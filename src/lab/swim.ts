import * as THREE from "three";

const FRAMES = 48;

/** Sample Blender clips once, then interpolate a small bone palette per fish.
 * The GPU skins the instanced mesh using its exported weights and joint indices.
 */
export class SwimAtlas {
  readonly texture: THREE.DataTexture;
  readonly rows: THREE.InstancedBufferAttribute;
  readonly size: THREE.Vector2;
  private samples: Float32Array;
  private palette: Float32Array;
  private stride: number;

  constructor(
    root: THREE.Group,
    clips: THREE.AnimationClip[],
    skeleton: THREE.Skeleton,
    capacity: number,
  ) {
    const ordered = ["Glide", "Swim"].map((name) =>
      clips.find(
        (clip) => clip.name === name || clip.name.endsWith(` | ${name}`),
      ),
    );
    if (ordered.some((clip) => !clip))
      throw new Error(
        "The fish model is missing its swim animations. Reload the scene to try again.",
      );
    this.stride = skeleton.bones.length * 16;
    this.samples = new Float32Array(this.stride * FRAMES * 2);
    this.palette = new Float32Array(this.stride * capacity);
    const mixer = new THREE.AnimationMixer(root);
    for (let clipIndex = 0; clipIndex < ordered.length; clipIndex++) {
      mixer.stopAllAction();
      const clip = ordered[clipIndex]!;
      const action = mixer.clipAction(clip).play();
      for (let frame = 0; frame < FRAMES; frame++) {
        mixer.setTime((frame / FRAMES) * clip.duration);
        root.updateMatrixWorld(true);
        skeleton.update();
        if (!skeleton.boneMatrices)
          throw new Error("The fish skeleton could not be initialized.");
        this.samples.set(
          skeleton.boneMatrices,
          (clipIndex * FRAMES + frame) * this.stride,
        );
      }
      action.stop();
    }
    mixer.uncacheRoot(root);
    root.updateMatrixWorld(true);
    this.size = new THREE.Vector2(skeleton.bones.length * 4, capacity);
    this.texture = new THREE.DataTexture(
      this.palette,
      this.size.x,
      this.size.y,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    this.texture.name = "Aquatica instance bone palettes";
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
    this.texture.needsUpdate = true;
    this.rows = new THREE.InstancedBufferAttribute(
      Float32Array.from({ length: capacity }, (_, i) => i),
      1,
    );
  }

  write(instance: number, phase: number, effort: number) {
    const cursor = (phase % 1) * FRAMES;
    const frame = Math.floor(cursor),
      next = (frame + 1) % FRAMES,
      t = cursor - frame;
    const a = frame * this.stride,
      b = next * this.stride;
    const c = a + FRAMES * this.stride,
      d = b + FRAMES * this.stride;
    const destination = instance * this.stride;
    const samples = this.samples;
    for (let i = 0; i < this.stride; i++) {
      const glide = samples[a + i] + (samples[b + i] - samples[a + i]) * t;
      const swim = samples[c + i] + (samples[d + i] - samples[c + i]) * t;
      this.palette[destination + i] = glide + (swim - glide) * effort;
    }
  }

  commit() {
    this.texture.needsUpdate = true;
  }
}

export function applySwimRig(
  geometry: THREE.BufferGeometry,
  material: THREE.MeshStandardMaterial,
  atlas: SwimAtlas,
) {
  if (
    !geometry.hasAttribute("skinIndex") ||
    !geometry.hasAttribute("skinWeight")
  )
    throw new Error("The fish model is missing its skin weights.");
  geometry.setAttribute("aRigRow", atlas.rows);
  material.userData.swimAtlas = atlas.texture;
  material.customProgramCacheKey = () => "aquatica-instanced-skin-v1";
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRigBones = { value: atlas.texture };
    shader.uniforms.uRigSize = { value: atlas.size };
    shader.vertexShader =
      `
      attribute vec4 skinIndex;
      attribute vec4 skinWeight;
      attribute float aRigRow;
      uniform sampler2D uRigBones;
      uniform vec2 uRigSize;
      mat4 aquaticaBone(float joint) {
        float x = joint * 4.0;
        float y = (aRigRow + 0.5) / uRigSize.y;
        return mat4(
          texture2D(uRigBones, vec2((x + 0.5) / uRigSize.x, y)),
          texture2D(uRigBones, vec2((x + 1.5) / uRigSize.x, y)),
          texture2D(uRigBones, vec2((x + 2.5) / uRigSize.x, y)),
          texture2D(uRigBones, vec2((x + 3.5) / uRigSize.x, y))
        );
      }
    ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <beginnormal_vertex>",
      `
      mat4 swimSkin = skinWeight.x * aquaticaBone(skinIndex.x);
      if (skinWeight.y > 0.0) swimSkin += skinWeight.y * aquaticaBone(skinIndex.y);
      if (skinWeight.z > 0.0) swimSkin += skinWeight.z * aquaticaBone(skinIndex.z);
      if (skinWeight.w > 0.0) swimSkin += skinWeight.w * aquaticaBone(skinIndex.w);
      #include <beginnormal_vertex>
      objectNormal = mat3(swimSkin) * objectNormal;
      #ifdef USE_TANGENT
        objectTangent = mat3(swimSkin) * objectTangent;
      #endif
    `,
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "vec3 transformed = (swimSkin * vec4(position, 1.0)).xyz;",
    );
  };
}
