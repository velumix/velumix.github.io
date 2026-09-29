import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  DRACOLoader,
  DRACO_GLTF_CONFIG,
} from "three/addons/loaders/DRACOLoader.js";
import { MAX_FISH } from "./config";
import { SwimAtlas, applySwimRig } from "./swim";
import { shadeReefSurface } from "./environment";
import type { LightUniforms } from "./lighting";

export type AquariumAssets = {
  fish: THREE.InstancedMesh[][];
  habitat: THREE.Group;
  swimming: SwimAtlas[];
};

/** Release GPU resources, including assets that finish loading after navigation. */
export function disposeObjects(objects: THREE.Object3D[]) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  for (const root of objects) {
    root.traverse((object) => {
      if (!(
        object instanceof THREE.Mesh ||
        object instanceof THREE.Line ||
        object instanceof THREE.Points
      ))
        return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material]) {
        materials.add(material);
        if (material.userData.swimAtlas instanceof THREE.Texture)
          textures.add(material.userData.swimAtlas);
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) textures.add(value);
        }
      }
      if (object instanceof THREE.InstancedMesh) object.dispose();
    });
  }
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}

export async function loadAquariumAssets(
  light: LightUniforms,
): Promise<AquariumAssets> {
  const loader = new GLTFLoader();
  // Vite emits these decoder assets locally, including under a Pages base URL.
  const draco = new DRACOLoader()
    .setDecoderPath(DRACO_GLTF_CONFIG)
    .setWorkerLimit(2);
  loader.setDRACOLoader(draco);
  const base = `${import.meta.env.BASE_URL}models/aquatica/`;
  const names = ["chromis", "yellow-tang", "clownfish", "reef-habitat"];
  const results = await Promise.allSettled(
    names.map((name) => loader.loadAsync(`${base}${name}.glb`)),
  );
  draco.dispose();
  const gltfs = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  const loaded = gltfs.map((gltf) => gltf.scene);
  if (results.some((result) => result.status === "rejected")) {
    disposeObjects(loaded);
    throw new Error(
      "The fish and reef models couldn’t load. Reload the scene to try again.",
    );
  }
  const fish: THREE.InstancedMesh[][] = [];
  const swimming: SwimAtlas[] = [];
  try {
    for (let school = 0; school < 3; school++) {
      const source = loaded[school];
      source.updateMatrixWorld(true);
      const meshes: THREE.SkinnedMesh[] = [];
      source.traverse((object) => {
        if (object instanceof THREE.SkinnedMesh) meshes.push(object);
      });
      if (
        !meshes.length ||
        meshes.some((mesh) => Array.isArray(mesh.material))
      ) {
        throw new Error("The fish model has an unsupported mesh layout.");
      }
      const parts: THREE.InstancedMesh[] = [];
      const atlas = new SwimAtlas(
        source,
        gltfs[school].animations,
        meshes[0].skeleton,
        Math.ceil(MAX_FISH / 3),
      );
      swimming.push(atlas);
      fish.push(parts);
      for (const original of meshes) {
        const geometry = original.geometry
          .clone()
          .applyMatrix4(original.bindMatrix);
        const material = original.material as THREE.MeshStandardMaterial;
        if (material.transparent) material.depthWrite = false;
        if (material.map) material.map.anisotropy = 4;
        applySwimRig(geometry, material, atlas);
        shadeReefSurface(material, light);
        const mesh = new THREE.InstancedMesh(
          geometry,
          material,
          Math.ceil(MAX_FISH / 3),
        );
        mesh.name = `${names[school]}-${material.name}`;
        mesh.count = 0;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.frustumCulled = false;
        mesh.receiveShadow = true;
        parts.push(mesh);
        original.geometry.dispose();
      }
    }
    const habitat = loaded[3];
    const shaded = new Set<THREE.Material>();
    habitat.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const grass = object.name === "seagrass-meadow";
      object.receiveShadow = true;
      object.castShadow = !grass;
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material]) {
        if (
          !(material instanceof THREE.MeshStandardMaterial) ||
          shaded.has(material)
        )
          continue;
        shadeReefSurface(material, light, { grass });
        if (material.normalMap) material.normalMap.anisotropy = 4;
        shaded.add(material);
      }
    });
    return { fish, habitat, swimming };
  } catch (error) {
    disposeObjects([...loaded, ...fish.flat()]);
    swimming.forEach((atlas) => atlas.texture.dispose());
    throw error;
  }
}
