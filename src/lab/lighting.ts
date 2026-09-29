import * as THREE from "three";
import waterSpectrum from "./water-spectrum.json";

export type LightingSettings = {
  sunlight: number;
  caustics: number;
  rays: number;
};

export const DEFAULT_LIGHTING: LightingSettings = {
  sunlight: 1,
  caustics: 1.2,
  rays: 0.9,
};

const TILE = waterSpectrum.tile;
const WATER_TOP = waterSpectrum.waterTop;
const CAUSTIC_SIZE = waterSpectrum.resolution;
const ENERGY_SCALE = waterSpectrum.energyScale;
const glslNumber = (value: number) => value.toFixed(8);
const WATER_WAVES = waterSpectrum.waves
  .map(
    ({ cycles, amplitude, speed, phase }) =>
      `wave(surface, p, vec2(${cycles.map(glslNumber).join(", ")}), ${glslNumber(amplitude)}, ${glslNumber(speed)}, ${glslNumber(phase)});`,
  )
  .join("\n");

// A finite sunlight footprint softens folds before they reach scene materials.
// Pair adjacent Gaussian samples with bilinear filtering: nine taps cost five.
const blurWeights = Array.from({ length: 5 }, (_, i) =>
  Math.exp(-0.5 * (i / waterSpectrum.blurRadius) ** 2),
);
const blurTotal =
  blurWeights[0] + 2 * blurWeights.slice(1).reduce((a, b) => a + b, 0);
const BLUR_SAMPLES = [1, 3]
  .map((i) => {
    const weight = blurWeights[i] + blurWeights[i + 1];
    const offset = i + blurWeights[i + 1] / weight;
    return `light += (texture2D(uSource, vUv + uStep * ${glslNumber(offset)}).r
      + texture2D(uSource, vUv - uStep * ${glslNumber(offset)}).r) * ${glslNumber(weight / blurTotal)};`;
  })
  .join("\n");
const AIR_SUN = new THREE.Vector3(-26, 48, 18).normalize();
// Snell's law for the sun's direction below a flat air/water interface.
export const WATER_SUN = new THREE.Vector3(
  AIR_SUN.x / 1.333,
  Math.sqrt(1 - (AIR_SUN.x ** 2 + AIR_SUN.z ** 2) / 1.333 ** 2),
  AIR_SUN.z / 1.333,
);

export type LightUniforms = {
  uCausticMap: { value: THREE.Texture };
  uCausticStrength: { value: number };
  uWaterSun: { value: THREE.Vector3 };
  uReefTime: { value: number };
  uSunPower: { value: number };
};

// The same openings in the surface light illuminate objects and the water.
export const LIGHT_FIELD_GLSL = `
  vec2 reefLightPlane(vec3 world) {
    return world.xz - uWaterSun.xz / uWaterSun.y * (world.y + 1.0);
  }
  float reefLightOpening(vec2 p) {
    p += vec2(sin(uReefTime * 0.075 + p.y * 0.10),
              cos(uReefTime * 0.061 + p.x * 0.09)) * 0.65;
    vec2 a = (p - vec2(-10.0, -2.0)) / vec2(4.5, 7.5);
    vec2 b = (p - vec2(7.0, -7.0)) / vec2(3.6, 6.0);
    vec2 c = (p - vec2(15.0, 11.0)) / vec2(3.0, 4.5);
    vec2 d = (p - vec2(-24.0, -19.0)) / vec2(5.5, 8.0);
    return min(1.3, exp(-dot(a, a)) + exp(-dot(b, b)) * 0.95
      + exp(-dot(c, c)) * 0.7 + exp(-dot(d, d)) * 0.55);
  }
`;

export const CAUSTIC_LIGHT_GLSL = `
  float reefFocusedLight(vec2 lightPlane) {
    float irradiance = texture2D(uCausticMap, lightPlane / ${glslNumber(TILE)} + 0.5).r * ${glslNumber(ENERGY_SCALE)};
    float concentrated = max(0.0, irradiance - 1.0);
    // Preserve gentle illumination between caustics and roll off bright folds.
    // This is a light multiplier, so the receiving material still shades it.
    return irradiance < 1.0 ? 0.5 + irradiance * 0.5
      : 1.0 + concentrated / (1.0 + concentrated * 0.8);
  }
`;

const FULLSCREEN_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/** Refracted caustics plus depth-terminated, shadowed volumetric sunlight. */
export class ReefLighting {
  readonly uniforms: LightUniforms;
  readonly sun = new THREE.DirectionalLight(0xfff3dd, 4.1);
  private settings = { ...DEFAULT_LIGHTING };
  private causticTarget = new THREE.WebGLRenderTarget(
    CAUSTIC_SIZE,
    CAUSTIC_SIZE,
    {
      depthBuffer: false,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: true,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
    },
  );
  private causticRaw = new THREE.WebGLRenderTarget(CAUSTIC_SIZE, CAUSTIC_SIZE, {
    depthBuffer: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.RepeatWrapping,
  });
  private causticBlur = this.causticRaw.clone();
  private colorTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    depthBuffer: true,
    // Keep multisampled color/depth registration exact for the ray pass.
    samples: 2,
  });
  private rayTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    depthBuffer: false,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  });
  private causticScene = new THREE.Scene();
  private filterScene = new THREE.Scene();
  private rayScene = new THREE.Scene();
  private compositeScene = new THREE.Scene();
  private screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private screenGeometry = new THREE.BufferGeometry();
  private waterGeometry = new THREE.PlaneGeometry(
    TILE + waterSpectrum.margin * 2,
    TILE + waterSpectrum.margin * 2,
    waterSpectrum.segments,
    waterSpectrum.segments,
  );
  private causticMaterial: THREE.ShaderMaterial;
  private filterMaterial: THREE.ShaderMaterial;
  private rayMaterial: THREE.ShaderMaterial;
  private compositeMaterial: THREE.ShaderMaterial;
  private lastCausticTime = -Infinity;
  private clearColor = new THREE.Color();
  private drawingSize = new THREE.Vector2();

  constructor(time: { value: number }, scene: THREE.Scene) {
    this.causticTarget.texture.name = "Aquatica refracted water light";
    this.causticRaw.texture.name = "Aquatica focused ripple irradiance";
    this.causticBlur.texture.name = "Aquatica sunlight footprint";
    this.colorTarget.texture.name = "Aquatica linear scene color";
    this.colorTarget.depthTexture = new THREE.DepthTexture(
      1,
      1,
      THREE.UnsignedIntType,
    );
    this.colorTarget.depthTexture.name = "Aquatica opaque scene depth";
    this.rayTarget.texture.name = "Aquatica half-resolution sunlight";
    this.uniforms = {
      uCausticMap: { value: this.causticTarget.texture },
      uCausticStrength: { value: this.settings.caustics },
      uWaterSun: { value: WATER_SUN.clone() },
      uReefTime: time,
      uSunPower: { value: this.settings.sunlight },
    };

    scene.add(new THREE.HemisphereLight(0x8cdae8, 0x193b34, 0.78));
    this.sun.name = "Refracted surface sunlight";
    this.sun.position.copy(WATER_SUN).multiplyScalar(68);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, {
      left: -52,
      right: 52,
      top: 45,
      bottom: -45,
      near: 1,
      far: 130,
    });
    this.sun.shadow.camera.updateProjectionMatrix();
    this.sun.shadow.normalBias = 0.07;
    this.sun.shadow.bias = -0.0001;
    this.sun.shadow.radius = 2.3;
    this.sun.shadow.intensity = 0.92;
    scene.add(this.sun);
    const blueFill = new THREE.DirectionalLight(0x519ec2, 0.7);
    blueFill.position.set(24, 14, -25);
    scene.add(blueFill);

    this.causticMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: time,
        uAirSun: { value: AIR_SUN.clone() },
        uWaterSun: this.uniforms.uWaterSun,
      },
      vertexShader: `
        uniform float uTime;
        uniform vec3 uAirSun;
        uniform vec3 uWaterSun;
        varying vec2 vSource;
        varying vec2 vFocused;
        void wave(inout vec3 surface, vec2 p, vec2 cycles, float height, float speed, float phase) {
          vec2 k = cycles * (6.28318530718 / ${TILE.toFixed(1)});
          float angle = dot(k, p) + uTime * speed + phase;
          surface.x += height * sin(angle);
          surface.yz += k * height * cos(angle);
        }
        void main() {
          vec2 p = position.xy;
          vec3 surface = vec3(0.0);
          ${WATER_WAVES}
          vec3 n = normalize(vec3(-surface.y, 1.0, -surface.z));
          vec3 ray = refract(-uAirSun, n, 1.0 / 1.333);
          float depth = ${WATER_TOP + 1}.0 + surface.x;
          vec2 focused = p - ray.xz / ray.y * depth;
          // Remove the flat-water offset; the surface shader projects it back.
          focused += uWaterSun.xz / uWaterSun.y * ${WATER_TOP + 1}.0;
          vSource = p;
          vFocused = focused;
          gl_Position = vec4(focused / ${(TILE / 2).toFixed(1)}, 0.0, 1.0);
        }`,
      fragmentShader: `
        varying vec2 vSource;
        varying vec2 vFocused;
        void main() {
          vec2 a = dFdx(vSource), b = dFdy(vSource);
          vec2 c = dFdx(vFocused), d = dFdy(vFocused);
          float sourceArea = abs(a.x * b.y - a.y * b.x);
          float focusArea = max(abs(c.x * d.y - c.y * d.x), 0.0000001);
          float energy = min(32.0, sourceArea / focusArea);
          // Overlapping refracted triangles add their light into the map.
          gl_FragColor = vec4(vec3(energy / ${glslNumber(ENERGY_SCALE)}), 1.0);
        }`,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const water = new THREE.Mesh(this.waterGeometry, this.causticMaterial);
    water.frustumCulled = false;
    this.causticScene.add(water);

    this.screenGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
    );
    this.filterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uSource: { value: this.causticRaw.texture },
        uStep: { value: new THREE.Vector2(1 / CAUSTIC_SIZE, 0) },
      },
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: `
        uniform sampler2D uSource;
        uniform vec2 uStep;
        varying vec2 vUv;
        void main() {
          float light = texture2D(uSource, vUv).r * ${glslNumber(blurWeights[0] / blurTotal)};
          ${BLUR_SAMPLES}
          gl_FragColor = vec4(vec3(light), 1.0);
        }`,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.addScreen(this.filterScene, this.filterMaterial);
    this.rayMaterial = new THREE.ShaderMaterial({
      uniforms: {
        ...this.uniforms,
        uSceneDepth: { value: this.colorTarget.depthTexture },
        uSunShadow: { value: null },
        uShadowMatrix: { value: new THREE.Matrix4() },
        uProjectionInverse: { value: new THREE.Matrix4() },
        uCameraWorld: { value: new THREE.Matrix4() },
        uCameraPosition: { value: new THREE.Vector3() },
        uCameraFar: { value: 220 },
      },
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: `
        precision highp sampler2DShadow;
        uniform sampler2D uSceneDepth;
        uniform sampler2D uCausticMap;
        uniform sampler2DShadow uSunShadow;
        uniform mat4 uShadowMatrix, uProjectionInverse, uCameraWorld;
        uniform vec3 uCameraPosition, uWaterSun;
        uniform float uReefTime, uSunPower, uCameraFar;
        varying vec2 vUv;
        ${LIGHT_FIELD_GLSL}
        void main() {
          float depth = texture2D(uSceneDepth, vUv).r;
          vec4 view = uProjectionInverse * vec4(vUv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
          view /= view.w;
          vec3 endpoint = (uCameraWorld * view).xyz;
          vec3 delta = endpoint - uCameraPosition;
          float distanceToSurface = length(delta);
          vec3 direction = delta / max(distanceToSurface, 0.0001);
          float begin = 0.0, end = min(distanceToSurface, 115.0);
          if (abs(direction.y) > 0.0001) {
            float a = (-1.0 - uCameraPosition.y) / direction.y;
            float b = (${WATER_TOP}.0 - uCameraPosition.y) / direction.y;
            begin = max(begin, min(a, b));
            end = min(end, max(a, b));
          } else if (uCameraPosition.y < -1.0 || uCameraPosition.y > ${WATER_TOP}.0) {
            end = 0.0;
          }
          float lengthInWater = max(0.0, end - begin);
          if (lengthInWater < 0.0001) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, clamp(-view.z / uCameraFar, 0.0, 1.0));
            return;
          }
          float stepLength = lengthInWater / 28.0;
          // Stable interleaved sampling avoids temporal sparkle when paused.
          float jitter = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
          float sum = 0.0;
          for (int i = 0; i < 28; i++) {
            float t = begin + (float(i) + 0.15 + jitter * 0.70) * stepLength;
            vec3 p = uCameraPosition + direction * t;
            vec2 lightPlane = reefLightPlane(p);
            float opening = reefLightOpening(lightPlane);
            if (opening < 0.006) continue;
            vec4 shadow = uShadowMatrix * vec4(p, 1.0);
            vec3 shadowUV = shadow.xyz / shadow.w;
            float visibility = 1.0;
            if (all(greaterThan(shadowUV, vec3(0.0))) && all(lessThan(shadowUV, vec3(1.0)))) {
              visibility = texture(uSunShadow, vec3(shadowUV.xy, shadowUV.z - 0.00025));
            }
            // Integrate fine ripples across the volume sample's footprint.
            float threads = texture2D(uCausticMap, lightPlane / ${glslNumber(TILE)} + 0.5, 4.5).r * ${glslNumber(ENERGY_SCALE)};
            float density = opening * (0.42 + min(threads, 3.0) * 0.24);
            float nearFloor = smoothstep(-0.8, 2.0, p.y);
            float surfaceFade = 1.0 - smoothstep(29.0, ${WATER_TOP}.0, p.y);
            sum += density * visibility * exp(-t * 0.026) * nearFloor * surfaceFade * stepLength;
          }
          float towardSun = dot(direction, uWaterSun);
          float phase = 0.65 + 0.35 * (1.0 - 0.09) / pow(1.09 - 0.6 * towardSun, 1.5);
          vec3 rays = vec3(0.60, 0.84, 0.91) * sum * 0.027 * phase * uSunPower;
          gl_FragColor = vec4(rays, clamp(-view.z / uCameraFar, 0.0, 1.0));
        }`,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.addScreen(this.rayScene, this.rayMaterial);
    this.compositeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uScene: { value: this.colorTarget.texture },
        uDepth: { value: this.colorTarget.depthTexture },
        uRays: { value: this.rayTarget.texture },
        uRaySize: { value: new THREE.Vector2(1, 1) },
        uPixel: { value: new THREE.Vector2(1, 1) },
        uRayStrength: { value: this.settings.rays },
        uNear: { value: 0.1 },
        uFar: { value: 220 },
      },
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: `
        uniform sampler2D uScene, uDepth, uRays;
        uniform vec2 uRaySize, uPixel;
        uniform float uRayStrength, uNear, uFar;
        varying vec2 vUv;
        float linearDepth(float z) {
          return uNear * uFar / (uFar - z * (uFar - uNear));
        }
        void main() {
          vec3 color = texture2D(uScene, vUv).rgb;
          if (uRayStrength > 0.0) {
            float depth = linearDepth(texture2D(uDepth, vUv).r);
            vec2 texel = vUv * uRaySize - 0.5;
            vec2 base = floor(texel), f = fract(texel);
            vec3 rays = vec3(0.0);
            float total = 0.0;
            for (int y = 0; y < 2; y++) {
              for (int x = 0; x < 2; x++) {
                vec2 offset = vec2(float(x), float(y));
                vec4 sampleRay = texture2D(uRays, (base + offset + 0.5) / uRaySize);
                vec2 w = mix(1.0 - f, f, offset);
                float weight = max(0.0001, w.x * w.y) / (1.0 + abs(sampleRay.a * uFar - depth) * 3.0);
                rays += sampleRay.rgb * weight;
                total += weight;
              }
            }
            float confidence = smoothstep(0.015, 0.25, total);
            color += rays / max(total, 0.00001) * uRayStrength * confidence;
          }
          // A small highlight halo keeps focused sunlight from looking etched.
          vec3 highlights = max(vec3(0.0), texture2D(uScene, vUv + uPixel * vec2(2.0, 0.0)).rgb - 1.7);
          highlights += max(vec3(0.0), texture2D(uScene, vUv - uPixel * vec2(2.0, 0.0)).rgb - 1.7);
          highlights += max(vec3(0.0), texture2D(uScene, vUv + uPixel * vec2(0.0, 2.0)).rgb - 1.7);
          highlights += max(vec3(0.0), texture2D(uScene, vUv - uPixel * vec2(0.0, 2.0)).rgb - 1.7);
          gl_FragColor = vec4(color + highlights * 0.025, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <dithering_fragment>
        }`,
      depthTest: false,
      depthWrite: false,
      dithering: true,
    });
    // The dithering helper is required by the output chunk above.
    this.compositeMaterial.fragmentShader =
      "#include <common>\n#include <dithering_pars_fragment>\n" +
      this.compositeMaterial.fragmentShader;
    this.addScreen(this.compositeScene, this.compositeMaterial);
  }

  private addScreen(scene: THREE.Scene, material: THREE.ShaderMaterial) {
    const mesh = new THREE.Mesh(this.screenGeometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);
  }

  configure(settings: LightingSettings) {
    for (const key of ["sunlight", "caustics", "rays"] as const) {
      const value = settings[key];
      this.settings[key] = Number.isFinite(value)
        ? THREE.MathUtils.clamp(value, 0, 2)
        : DEFAULT_LIGHTING[key];
    }
    this.sun.intensity = 4.1 * this.settings.sunlight;
    this.uniforms.uCausticStrength.value = this.settings.caustics;
    this.uniforms.uSunPower.value = this.settings.sunlight;
    this.compositeMaterial.uniforms.uRayStrength.value = this.settings.rays;
  }

  resize(renderer: THREE.WebGLRenderer) {
    // Keep the lighting available on WebGL2 devices without float color buffers.
    const type = renderer.extensions.has("EXT_color_buffer_float")
      ? THREE.HalfFloatType
      : THREE.UnsignedByteType;
    for (const target of [
      this.colorTarget,
      this.rayTarget,
      this.causticRaw,
      this.causticBlur,
    ]) {
      if (target.texture.type !== type) {
        target.dispose();
        target.texture.type = type;
      }
    }
    this.colorTarget.samples = Math.min(2, renderer.capabilities.maxSamples);
    renderer.getDrawingBufferSize(this.drawingSize);
    const { x: width, y: height } = this.drawingSize;
    this.colorTarget.setSize(width, height);
    // Rays are reconstructed with scene depth; cap their cost on high-DPI displays.
    const scale = Math.min(0.5, 900 / width);
    const rayWidth = Math.max(1, Math.ceil(width * scale));
    const rayHeight = Math.max(1, Math.ceil(height * scale));
    this.rayTarget.setSize(rayWidth, rayHeight);
    this.compositeMaterial.uniforms.uRaySize.value.set(rayWidth, rayHeight);
    this.compositeMaterial.uniforms.uPixel.value.set(1 / width, 1 / height);
  }

  render(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ) {
    const target = renderer.getRenderTarget();
    const time = this.uniforms.uReefTime.value;
    // 30 Hz light focusing, independent of the 60 Hz fish integration.
    if (Math.abs(time - this.lastCausticTime) >= 1 / 30) {
      renderer.getClearColor(this.clearColor);
      const alpha = renderer.getClearAlpha();
      renderer.setClearColor(0x000000, 0);
      renderer.setRenderTarget(this.causticRaw);
      renderer.render(this.causticScene, this.screenCamera);
      this.filterMaterial.uniforms.uSource.value = this.causticRaw.texture;
      this.filterMaterial.uniforms.uStep.value.set(1 / CAUSTIC_SIZE, 0);
      renderer.setRenderTarget(this.causticBlur);
      renderer.render(this.filterScene, this.screenCamera);
      this.filterMaterial.uniforms.uSource.value = this.causticBlur.texture;
      this.filterMaterial.uniforms.uStep.value.set(0, 1 / CAUSTIC_SIZE);
      renderer.setRenderTarget(this.causticTarget);
      renderer.render(this.filterScene, this.screenCamera);
      renderer.setClearColor(this.clearColor, alpha);
      this.lastCausticTime = time;
    }
    renderer.setRenderTarget(this.colorTarget);
    renderer.render(scene, camera);
    if (this.settings.rays > 0 && this.sun.shadow.map?.depthTexture) {
      const uniforms = this.rayMaterial.uniforms;
      uniforms.uSunShadow.value = this.sun.shadow.map.depthTexture;
      uniforms.uShadowMatrix.value.copy(this.sun.shadow.matrix);
      uniforms.uProjectionInverse.value.copy(camera.projectionMatrixInverse);
      uniforms.uCameraWorld.value.copy(camera.matrixWorld);
      uniforms.uCameraPosition.value.copy(camera.position);
      uniforms.uCameraFar.value = camera.far;
      renderer.setRenderTarget(this.rayTarget);
      renderer.render(this.rayScene, this.screenCamera);
    }
    this.compositeMaterial.uniforms.uNear.value = camera.near;
    this.compositeMaterial.uniforms.uFar.value = camera.far;
    renderer.setRenderTarget(target);
    renderer.render(this.compositeScene, this.screenCamera);
  }

  dispose() {
    this.causticTarget.dispose();
    this.causticRaw.dispose();
    this.causticBlur.dispose();
    this.colorTarget.dispose();
    this.rayTarget.dispose();
    this.screenGeometry.dispose();
    this.waterGeometry.dispose();
    this.causticMaterial.dispose();
    this.filterMaterial.dispose();
    this.rayMaterial.dispose();
    this.compositeMaterial.dispose();
  }
}
