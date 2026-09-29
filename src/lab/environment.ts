import * as THREE from "three";
import { randomSource } from "./config";
import {
  CAUSTIC_LIGHT_GLSL,
  LIGHT_FIELD_GLSL,
  type LightUniforms,
} from "./lighting";

export const WATER_COLOR = 0x082e3b;
export const WATER_DENSITY = 0.0125;

type Clock = { value: number };

/** Matches the ground function in scripts/blender/refine-reef.py. */
export function terrainHeight(x: number, z: number) {
  return (
    -1 +
    0.16 * Math.sin(x * 0.15 + 0.4 * Math.sin(z * 0.14)) +
    0.13 * Math.cos(z * 0.21 - x * 0.08) +
    0.07 * Math.sin(x * 0.46 + z * 0.12)
  );
}

/** Keep standard lighting, shadow mapping, and fog on all underwater surfaces. */
export function shadeReefSurface(
  material: THREE.MeshStandardMaterial,
  light: LightUniforms,
  options: { sand?: Clock; grass?: boolean } = {},
) {
  const previousCompile = material.onBeforeCompile;
  const previousKey = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    // Compose with the fish skinning callback; world light follows the posed mesh.
    previousCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, light);
    shader.uniforms.uReefPresence = options.sand ?? { value: 1 };
    shader.vertexShader =
      "varying vec3 vReefWorld;\nuniform float uReefTime;\n" +
      shader.vertexShader;
    if (options.grass) {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float blade = uv.y * uv.y;
        transformed.x += sin(uReefTime * 0.72 + position.x * 0.45 + position.z * 0.3) * blade * 0.16;
        transformed.z += cos(uReefTime * 0.57 + position.z * 0.4) * blade * 0.07;`,
      );
    }
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `#include <project_vertex>
      vec4 reefWorld = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        reefWorld = instanceMatrix * reefWorld;
      #endif
      vReefWorld = (modelMatrix * reefWorld).xyz;`,
    );
    shader.fragmentShader =
      `varying vec3 vReefWorld;
      uniform float uReefTime;
      uniform float uReefPresence;
      uniform float uCausticStrength;
      uniform sampler2D uCausticMap;
      uniform vec3 uWaterSun;
      ${LIGHT_FIELD_GLSL}
      ${CAUSTIC_LIGHT_GLSL}
      float reefHash(vec2 p) {
        vec3 q = fract(vec3(p.xyx) * 0.1031);
        q += dot(q, q.yzx + 33.33);
        return fract((q.x + q.y) * q.z);
      }
      ` + shader.fragmentShader;

    if (options.sand) {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec2 sandP = vReefWorld.xz;
        float ripplePhase = sandP.x * 7.8 + sin(sandP.y * 0.85) * 1.35 + sin(sandP.y * 0.22) * 4.0;
        float rippleFade = 1.0 - smoothstep(0.7, 2.4, fwidth(ripplePhase));
        float ripple = sin(ripplePhase) * rippleFade;
        float grainFade = 1.0 - smoothstep(0.3, 1.3, length(fwidth(sandP * 95.0)));
        float grain = (reefHash(floor(sandP * 95.0)) - 0.5) * grainFade;
        float sediment = sin(sandP.x * 0.35 + sin(sandP.y * 0.27)) * sin(sandP.y * 0.46);
        diffuseColor.rgb *= 0.94 + ripple * 0.035 + grain * 0.10 + sediment * 0.045;
        float contact = exp(-dot(sandP - vec2(-8.0, -3.0), sandP - vec2(-8.0, -3.0)) / 22.0)
                      + exp(-dot(sandP - vec2(9.0, -5.0), sandP - vec2(9.0, -5.0)) / 16.0)
                      + exp(-dot(sandP - vec2(2.0, 8.0), sandP - vec2(2.0, 8.0)) / 10.0);
        diffuseColor.rgb *= 1.0 - min(0.28, contact * 0.27) * uReefPresence;`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        vec3 sandNormal = inverseTransformDirection(normal, viewMatrix);
        sandNormal.x -= cos(ripplePhase) * 0.085 * rippleFade;
        sandNormal.z -= cos(ripplePhase) * cos(sandP.y * 0.85) * 0.013 * rippleFade;
        normal = normalize((viewMatrix * vec4(sandNormal, 0.0)).xyz);`,
      );
    }

    const directLighting = THREE.ShaderChunk.lights_fragment_begin.replace(
      "getDirectionalLightInfo( directionalLight, directLight );",
      `getDirectionalLightInfo( directionalLight, directLight );
      #if UNROLLED_LOOP_INDEX == 0
        directLight.color *= reefSunlight * vec3(0.83, 0.97, 1.05);
      #endif`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <lights_fragment_begin>",
      `vec2 lightPlane = reefLightPlane(vReefWorld);
      float focusedLight = reefFocusedLight(lightPlane);
      float focusAmount = uCausticStrength * 0.75 * (0.55 + 0.45 * (1.0 - smoothstep(3.0, 24.0, vReefWorld.y)));
      float focus = 1.0 + (focusedLight - 1.0) * focusAmount;
      float reefSunlight = focus * (0.40 + reefLightOpening(lightPlane) * 0.95);
      ${directLighting}`,
    );
  };
  material.customProgramCacheKey = () =>
    `${previousKey}-reef-sunlight-v3-${!!options.sand}-${!!options.grass}`;
}

export function createSeabed(light: LightUniforms, reef: Clock) {
  // A continuous bed with more vertices near the habitat; its edges disappear
  // into the same water fog as the models, even from the overhead camera.
  const geometry = new THREE.PlaneGeometry(2, 2, 180, 180);
  const positions = geometry.getAttribute("position");
  for (let i = 0; i < positions.count; i++) {
    const u = positions.getX(i);
    const v = -positions.getY(i);
    const x = u * 50 + Math.pow(u, 5) * 450;
    const z = v * 50 + Math.pow(v, 5) * 450;
    positions.setXYZ(i, x, terrainHeight(x, z), z);
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const material = new THREE.MeshStandardMaterial({
    color: 0xb1ae91,
    roughness: 0.96,
    metalness: 0,
  });
  shadeReefSurface(material, light, { sand: reef });
  const bed = new THREE.Mesh(geometry, material);
  bed.name = "Continuous rippled carbonate sand";
  bed.receiveShadow = true;
  return bed;
}

export function createMarineSnow(light: LightUniforms) {
  const random = randomSource(280926);
  const positions = new Float32Array(340 * 3);
  const seeds = new Float32Array(340);
  for (let i = 0; i < seeds.length; i++) {
    positions[i * 3] = (random() - 0.5) * 100;
    positions[i * 3 + 1] = random() * 34;
    positions[i * 3 + 2] = (random() - 0.5) * 100;
    seeds[i] = random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aDrift", new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...light,
      uColor: { value: new THREE.Color(0xb5dee1) },
    },
    vertexShader: `
      uniform float uReefTime;
      uniform vec3 uWaterSun;
      uniform float uSunPower;
      attribute float aDrift;
      varying float vOpacity;
      ${LIGHT_FIELD_GLSL}
      void main() {
        vec3 p = position;
        p.y = mod(p.y - uReefTime * (0.014 + aDrift * 0.027) + 34.0, 34.0);
        p.x += sin(uReefTime * 0.09 + aDrift * 51.0) * 0.65;
        p.z += cos(uReefTime * 0.07 + aDrift * 37.0) * 0.35;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((0.5 + aDrift) * 65.0 / max(1.0, -mv.z), 0.8, 2.6);
        float depth = max(0.0, -mv.z);
        vOpacity = (0.12 + aDrift * 0.23) * exp(-0.0005 * depth * depth)
          * smoothstep(1.0, 4.0, depth) * smoothstep(0.0, 2.0, p.y)
          * (0.40 + reefLightOpening(reefLightPlane(p)) * 1.6 * uSunPower);
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vOpacity;
      void main() {
        float radius = length(gl_PointCoord - 0.5) * 2.0;
        float alpha = (1.0 - smoothstep(0.15, 1.0, radius)) * vOpacity;
        gl_FragColor = vec4(uColor, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
  });
  const snow = new THREE.Points(geometry, material);
  snow.name = "Slowly drifting suspended sediment";
  snow.frustumCulled = false;
  return snow;
}
