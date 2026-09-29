import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { loadAquariumAssets, disposeObjects } from "./assets";
import {
  createSeabed,
  createMarineSnow,
  WATER_COLOR,
  WATER_DENSITY,
} from "./environment";
import type { SwimAtlas } from "./swim";
import { ReefLighting, type LightingSettings } from "./lighting";
import { Simulation, BOUNDS, REEF, type Vec } from "./simulation";

export type Interaction = "inspect" | "guide" | "startle";
export type SceneOptions = {
  inspect: boolean;
  bounds: boolean;
  field: boolean;
  interaction: Interaction;
};
export type LabStats = {
  fps: number;
  simulationMs: number;
  coherence: number;
  time: number;
  selected: number;
  neighbors: number;
  speed: number;
  tier: number;
  leader: boolean;
  tiers: [number, number, number];
  guided: boolean;
};

export class AquariumScene {
  readonly simulation: Simulation;
  paused = false;
  speed = 1;
  selected = 0;
  options: SceneOptions = {
    inspect: false,
    bounds: false,
    field: false,
    interaction: "inspect",
  };
  private renderer: THREE.WebGLRenderer;
  private lighting: ReefLighting;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(42, 1, 0.1, 220);
  private controls: OrbitControls;
  private fishMeshes: THREE.InstancedMesh[][] = [];
  private swimming: SwimAtlas[] = [];
  private followFish = false;
  private followTarget = new THREE.Vector3();
  private reefGroup = new THREE.Group();
  private fieldGroup = new THREE.Group();
  private tank: THREE.LineSegments;
  private debug = new THREE.Group();
  private neighborLines: THREE.LineSegments;
  private radius: THREE.LineSegments;
  private selectedRing: THREE.Mesh;
  private arrows: THREE.ArrowHelper[];
  private marker: THREE.Mesh;
  private pulse: THREE.Mesh;
  private uniformTime = { value: 0 };
  private uniformReef = { value: 1 };
  private object = new THREE.Object3D();
  private direction = new THREE.Vector3();
  private resizeObserver: ResizeObserver;
  private observer: IntersectionObserver;
  private frame = 0;
  private previous = 0;
  private accumulator = 0;
  private frames = 0;
  private sampleTime = 0;
  private simulationCost = 0;
  private simulationSteps = 0;
  private inView = true;
  private pointerStart = { x: 0, y: 0 };
  private down = false;
  private disposed = false;
  private reportedError = false;

  constructor(
    private host: HTMLElement,
    simulation: Simulation,
    private onStats: (stats: LabStats) => void,
    private onSelect: (id: number) => void,
    private onError: (message: string) => void,
    private onAssetsReady: () => void,
  ) {
    this.simulation = simulation;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setClearColor(WATER_COLOR);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    // Only the static reef casts shadows. Regenerate on load or reef toggles.
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D aquarium. Drag to orbit, scroll to zoom, or use the camera buttons. Click a fish to inspect it.",
    );
    this.renderer.domElement.setAttribute("role", "img");
    this.host.appendChild(this.renderer.domElement);
    this.scene.fog = new THREE.FogExp2(WATER_COLOR, WATER_DENSITY);
    this.camera.position.set(28, 17, 38);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 6, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 105;
    this.controls.minPolarAngle = 0.1;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.enablePan = false;
    this.controls.update();
    this.lighting = new ReefLighting(this.uniformTime, this.scene);
    this.makeEnvironment();

    const box = new THREE.BoxGeometry(
      BOUNDS.x * 2,
      BOUNDS.ceiling - BOUNDS.floor,
      BOUNDS.z * 2,
    );
    this.tank = new THREE.LineSegments(
      new THREE.EdgesGeometry(box),
      new THREE.LineBasicMaterial({
        color: 0x78cbbb,
        transparent: true,
        opacity: 0.25,
      }),
    );
    box.dispose();
    this.tank.position.y = (BOUNDS.ceiling + BOUNDS.floor) / 2;
    this.scene.add(this.tank);

    const lines = new THREE.BufferGeometry();
    lines.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Float32Array(16 * 6), 3),
    );
    this.neighborLines = new THREE.LineSegments(
      lines,
      new THREE.LineBasicMaterial({
        color: 0x8cf9d9,
        transparent: true,
        opacity: 0.45,
      }),
    );
    this.neighborLines.frustumCulled = false;
    this.debug.add(this.neighborLines);
    const sphere = new THREE.SphereGeometry(1, 20, 12);
    this.radius = new THREE.LineSegments(
      new THREE.WireframeGeometry(sphere),
      new THREE.LineBasicMaterial({
        color: 0x8bcfbd,
        transparent: true,
        opacity: 0.1,
      }),
    );
    sphere.dispose();
    this.debug.add(this.radius);
    this.selectedRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.025, 4, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
      }),
    );
    this.debug.add(this.selectedRing);
    this.arrows = [0xff9b8e, 0x96b9f2, 0x79dcd2, 0xedcb8e].map((color) => {
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(),
        1,
        color,
        0.4,
        0.2,
      );
      this.debug.add(arrow);
      return arrow;
    });
    this.scene.add(this.debug);
    this.marker = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.04, 5, 40),
      new THREE.MeshBasicMaterial({ color: 0x93ffe0 }),
    );
    this.marker.rotation.x = -Math.PI / 2;
    this.scene.add(this.marker);
    this.pulse = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffbc9c,
        wireframe: true,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
      }),
    );
    this.scene.add(this.pulse);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.host);
    this.observer = new IntersectionObserver(
      (entries) => {
        this.inView = entries[0]?.isIntersecting ?? true;
        this.previous = 0;
        this.sampleTime = 0;
      },
      { threshold: 0 },
    );
    this.observer.observe(this.host);
    this.renderer.domElement.addEventListener("pointerdown", this.pointerDown);
    this.renderer.domElement.addEventListener("pointerup", this.pointerUp);
    this.renderer.domElement.addEventListener(
      "pointercancel",
      this.pointerCancel,
    );
    this.renderer.domElement.addEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    this.resize();
    this.frame = requestAnimationFrame(this.animate);
    void this.loadModels();
  }

  private async loadModels() {
    try {
      const assets = await loadAquariumAssets(this.lighting.uniforms);
      if (this.disposed) {
        disposeObjects([...assets.fish.flat(), assets.habitat]);
        return;
      }
      this.fishMeshes = assets.fish;
      this.swimming = assets.swimming;
      this.scene.add(...assets.fish.flat());
      this.reefGroup.add(assets.habitat);
      this.renderer.shadowMap.needsUpdate = true;
      this.onAssetsReady();
    } catch (error) {
      if (!this.disposed)
        this.onError(
          error instanceof Error
            ? error.message
            : "The aquarium models couldn’t load. Reload the scene to try again.",
        );
    }
  }

  private makeEnvironment() {
    this.scene.add(
      createSeabed(this.lighting.uniforms, this.uniformReef),
      createMarineSnow(this.lighting.uniforms),
    );
    for (const rock of REEF) {
      const sphere = new THREE.IcosahedronGeometry(rock.radius + 0.65, 1);
      const outline = new THREE.LineSegments(
        new THREE.WireframeGeometry(sphere),
        new THREE.LineBasicMaterial({
          color: 0xe8c88b,
          transparent: true,
          opacity: 0.2,
        }),
      );
      sphere.dispose();
      outline.position.set(rock.center.x, rock.center.y, rock.center.z);
      this.fieldGroup.add(outline);
    }
    this.scene.add(this.reefGroup, this.fieldGroup);
  }

  private resize = () => {
    const { width, height } = this.host.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    this.camera.aspect = width / height;
    this.camera.fov = width < 500 ? 53 : 42;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.lighting.resize(this.renderer);
  };

  private pointerDown = (event: PointerEvent) => {
    this.pointerStart = { x: event.clientX, y: event.clientY };
    this.down = true;
  };
  private pointerCancel = () => {
    this.down = false;
  };
  private pointerUp = (event: PointerEvent) => {
    if (!this.down) return;
    this.down = false;
    if (
      Math.hypot(
        event.clientX - this.pointerStart.x,
        event.clientY - this.pointerStart.y,
      ) > 7
    )
      return;
    const rect = this.host.getBoundingClientRect();
    const x = event.clientX - rect.left,
      y = event.clientY - rect.top;
    if (this.options.interaction === "inspect") {
      let best = 28,
        selected = -1;
      for (const fish of this.simulation.fish) {
        const projected = this.direction
          .set(fish.position.x, fish.position.y, fish.position.z)
          .project(this.camera);
        if (projected.z < -1 || projected.z > 1) continue;
        const distance = Math.hypot(
          (projected.x * 0.5 + 0.5) * rect.width - x,
          (-projected.y * 0.5 + 0.5) * rect.height - y,
        );
        if (distance < best) {
          best = distance;
          selected = fish.id;
        }
      }
      if (selected >= 0) {
        this.selected = selected;
        this.onSelect(selected);
      }
    } else {
      const ray = new THREE.Raycaster();
      ray.setFromCamera(
        new THREE.Vector2((x / rect.width) * 2 - 1, 1 - (y / rect.height) * 2),
        this.camera,
      );
      const point = ray.ray.intersectPlane(
        new THREE.Plane(new THREE.Vector3(0, 1, 0), -11),
        new THREE.Vector3(),
      );
      if (!point) return;
      const target = {
        x: THREE.MathUtils.clamp(point.x, -20, 20),
        y: 11,
        z: THREE.MathUtils.clamp(point.z, -13, 13),
      };
      if (this.options.interaction === "guide") this.simulation.guide = target;
      else this.simulation.startle(target);
    }
    this.emitStats(0);
  };

  private contextLost = (event: Event) => {
    event.preventDefault();
    this.reportedError = true;
    this.onError(
      "The 3D view lost its graphics connection. Reload the scene to continue.",
    );
  };

  setCamera(view: "orbit" | "reef" | "top" | "side" | "fish") {
    this.followFish = view === "fish";
    if (this.followFish) {
      const fish = this.simulation.fish[this.selected];
      if (!fish) return;
      this.controls.target.set(
        fish.position.x,
        fish.position.y,
        fish.position.z,
      );
      this.camera.position
        .copy(this.controls.target)
        .add(new THREE.Vector3(6, 2.5, 4));
      this.controls.update();
      return;
    }
    const positions = {
      orbit: [28, 17, 38],
      reef: [17, 5.5, 25],
      top: [0, 68, 0.1],
      side: [0, 10, 49],
    };
    const [x, y, z] = positions[view as keyof typeof positions];
    this.camera.position.set(x, y, z);
    this.controls.target.set(
      0,
      view === "reef" ? 3 : 6,
      view === "reef" ? -3 : 0,
    );
    this.controls.update();
  }

  setLighting(settings: LightingSettings) {
    this.lighting.configure(settings);
  }

  stepOnce() {
    this.simulation.step(1 / 60, this.camera.position);
    this.draw();
    this.emitStats(0);
  }

  private draw(alpha = 1, renderDelta = 1 / 60) {
    const sim = this.simulation;
    this.uniformTime.value = Math.max(0, sim.time - (1 - alpha) / 60);
    this.selected = Math.min(this.selected, sim.fish.length - 1);
    const counts = [0, 0, 0];
    const color = new THREE.Color();
    const selected = sim.fish[this.selected];
    const neighbors = this.options.inspect
      ? sim.neighborsFor(this.selected)
      : [];
    const near = new Set(neighbors);
    for (const fish of sim.fish) {
      this.object.position.set(
        THREE.MathUtils.lerp(fish.previousPosition.x, fish.position.x, alpha),
        THREE.MathUtils.lerp(fish.previousPosition.y, fish.position.y, alpha),
        THREE.MathUtils.lerp(fish.previousPosition.z, fish.position.z, alpha),
      );
      this.direction
        .set(
          THREE.MathUtils.lerp(fish.previousVelocity.x, fish.velocity.x, alpha),
          THREE.MathUtils.lerp(fish.previousVelocity.y, fish.velocity.y, alpha),
          THREE.MathUtils.lerp(fish.previousVelocity.z, fish.velocity.z, alpha),
        )
        .normalize();
      // Explicit yaw/pitch keeps fish upright through a full turn; shortest-arc
      // rotations from +Z can introduce an abrupt roll near the opposite heading.
      this.object.rotation.set(
        -Math.asin(THREE.MathUtils.clamp(this.direction.y, -1, 1)),
        Math.atan2(this.direction.x, this.direction.z),
        0,
        "YXZ",
      );
      this.object.scale.setScalar(fish.size * 1.18);
      this.object.updateMatrix();
      const parts = this.fishMeshes[fish.school];
      if (!parts) continue;
      const instance = counts[fish.school]++;
      const phaseDelta = (fish.swimPhase - fish.previousSwimPhase + 1) % 1;
      this.swimming[fish.school]?.write(
        instance,
        (fish.previousSwimPhase + phaseDelta * alpha) % 1,
        THREE.MathUtils.lerp(fish.previousSwimEffort, fish.swimEffort, alpha),
      );
      color.set(0xffffff);
      if (this.options.inspect) {
        if (fish.id !== this.selected && !near.has(fish.id))
          color.multiplyScalar(0.38);
      }
      for (const mesh of parts) {
        mesh.setMatrixAt(instance, this.object.matrix);
        mesh.setColorAt(instance, color);
      }
    }
    this.fishMeshes.forEach((parts, school) => {
      for (const mesh of parts) {
        mesh.count = counts[school];
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    });
    this.swimming.forEach((atlas) => atlas.commit());
    if (this.followFish && selected) {
      this.followTarget.set(
        THREE.MathUtils.lerp(
          selected.previousPosition.x,
          selected.position.x,
          alpha,
        ),
        THREE.MathUtils.lerp(
          selected.previousPosition.y,
          selected.position.y,
          alpha,
        ),
        THREE.MathUtils.lerp(
          selected.previousPosition.z,
          selected.position.z,
          alpha,
        ),
      );
      this.followTarget
        .sub(this.controls.target)
        .multiplyScalar(1 - Math.exp(-6 * renderDelta));
      this.camera.position.add(this.followTarget);
      this.controls.target.add(this.followTarget);
      this.controls.update();
    }
    if (this.reefGroup.visible !== sim.config.obstacles) {
      this.reefGroup.visible = sim.config.obstacles;
      this.renderer.shadowMap.needsUpdate = true;
    }
    this.uniformReef.value = sim.config.obstacles ? 1 : 0;
    this.fieldGroup.visible = sim.config.obstacles && this.options.field;
    this.tank.visible = this.options.bounds;
    this.debug.visible = this.options.inspect;
    if (this.options.inspect && selected)
      this.drawInspection(selected.position, neighbors, alpha);
    this.marker.visible = !!sim.guide;
    if (sim.guide)
      this.marker.position.set(sim.guide.x, sim.guide.y, sim.guide.z);
    this.pulse.visible = !!sim.disturbance;
    if (sim.disturbance) {
      const { point, expires } = sim.disturbance;
      this.pulse.position.set(point.x, point.y, point.z);
      this.pulse.scale.setScalar(1 + (4 - expires + sim.time) * 2.5);
      (this.pulse.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0,
        ((expires - sim.time) / 4) * 0.13,
      );
    }
    this.lighting.render(this.renderer, this.scene, this.camera);
  }

  private drawInspection(position: Vec, neighbors: number[], alpha: number) {
    const previous = this.simulation.fish[this.selected].previousPosition;
    const p = new THREE.Vector3(
      THREE.MathUtils.lerp(previous.x, position.x, alpha),
      THREE.MathUtils.lerp(previous.y, position.y, alpha),
      THREE.MathUtils.lerp(previous.z, position.z, alpha),
    );
    this.radius.position.copy(p);
    this.radius.scale.setScalar(this.simulation.config.perception);
    this.selectedRing.position.copy(p);
    this.selectedRing.quaternion.copy(this.camera.quaternion);
    const attribute = this.neighborLines.geometry.getAttribute("position");
    neighbors.forEach((id, index) => {
      const other = this.simulation.fish[id];
      attribute.setXYZ(index * 2, p.x, p.y, p.z);
      attribute.setXYZ(
        index * 2 + 1,
        THREE.MathUtils.lerp(other.previousPosition.x, other.position.x, alpha),
        THREE.MathUtils.lerp(other.previousPosition.y, other.position.y, alpha),
        THREE.MathUtils.lerp(other.previousPosition.z, other.position.z, alpha),
      );
    });
    attribute.needsUpdate = true;
    this.neighborLines.geometry.setDrawRange(0, neighbors.length * 2);
    const forces = this.simulation.fish[this.selected].forces;
    [
      forces.separation,
      forces.alignment,
      forces.cohesion,
      forces.navigation,
    ].forEach((force, i) => {
      const arrow = this.arrows[i];
      this.direction.set(force.x, force.y, force.z);
      const magnitude = this.direction.length();
      arrow.visible = magnitude > 0.05;
      if (!arrow.visible) return;
      arrow.position.copy(p);
      arrow.setDirection(this.direction.normalize());
      arrow.setLength(Math.min(magnitude * 0.7, 5), 0.35, 0.18);
    });
  }

  private emitStats(fps: number) {
    const sim = this.simulation,
      fish = sim.fish[this.selected];
    if (!fish) return;
    const tiers: [number, number, number] = [0, 0, 0];
    for (const fish of sim.fish) tiers[fish.tier]++;
    this.onStats({
      fps,
      simulationMs: this.simulationCost / Math.max(1, this.simulationSteps),
      coherence: sim.coherence,
      time: sim.time,
      selected: this.selected,
      neighbors: sim.neighborsFor(this.selected).length,
      speed: Math.hypot(fish.velocity.x, fish.velocity.y, fish.velocity.z),
      tier: fish.tier,
      leader: sim.leaders[fish.school] === this.selected,
      tiers,
      guided: !!sim.guide,
    });
    this.simulationCost = 0;
    this.simulationSteps = 0;
  }

  private animate = (now: number) => {
    if (this.disposed || this.reportedError) return;
    this.frame = requestAnimationFrame(this.animate);
    if (document.hidden || !this.inView) {
      this.previous = 0;
      this.sampleTime = 0;
      this.accumulator = 0;
      this.frames = 0;
      return;
    }
    const dt = this.previous ? Math.min((now - this.previous) / 1000, 0.1) : 0;
    this.previous = now;
    this.controls.update();
    if (!this.paused) {
      this.accumulator = Math.min(this.accumulator + dt * this.speed, 0.12);
      while (this.accumulator >= 1 / 60) {
        const start = performance.now();
        this.simulation.step(1 / 60, this.camera.position);
        this.simulationCost += performance.now() - start;
        this.simulationSteps++;
        this.accumulator -= 1 / 60;
      }
    } else this.accumulator = 0;
    this.draw(this.paused ? 1 : this.accumulator * 60, dt);
    this.frames++;
    if (!this.sampleTime) this.sampleTime = now;
    if (now - this.sampleTime >= 500) {
      this.emitStats(
        Math.round((this.frames * 1000) / (now - this.sampleTime)),
      );
      this.frames = 0;
      this.sampleTime = now;
    }
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.observer.disconnect();
    this.controls.dispose();
    this.renderer.domElement.removeEventListener(
      "pointerdown",
      this.pointerDown,
    );
    this.renderer.domElement.removeEventListener("pointerup", this.pointerUp);
    this.renderer.domElement.removeEventListener(
      "pointercancel",
      this.pointerCancel,
    );
    this.renderer.domElement.removeEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    disposeObjects([this.scene]);
    this.lighting.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight) object.shadow.dispose();
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
