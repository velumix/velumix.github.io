# Aquatica Flocking Lab

Open `/#lab` from the portfolio's **Systems lab** navigation item. This is a browser adaptation of the Aquatica Observatory fish system created by Velumix. The fish-system authorship belongs to Velumix. Sebastian Lague's Boids is a reference for the explorable lab format; Craig Reynolds' boids model supplies the foundational schooling rules.

## Source grounding

The adaptation is based on Velumix's Observatory source, inspected through the authenticated GitHub connection: `FishBehaviour`, `FishBrain`, `FishController`, `BoidNavigation`, and `BoidHybridService`. It carries over local schooling forces, periodically selected leaders, individual wandering, obstacle deflection, swimming bounds, and distance-based steering budgets. The browser implementation translates these behaviors to TypeScript. Private source files, map data, and networking code are not published with the website.

The browser adaptation uses three schools, Blender-authored fish and reef models, a spatial grid, analytic sphere obstacles, and a fixed 60 Hz integration step. Steering runs every 2, 4, or 8 steps depending on camera distance; leaders retain the finest budget. The Roblox navigation bake and networking are replaced with local browser equivalents. Water current and the temporary disturbance are lab controls. The three species share the lab's schooling rules; their markings and anatomy are visual representations, not a species-specific behavioral model.

## Controls and persistence

- Drag or pinch the scene to orbit or zoom. Orbit/Top/Side buttons also position the camera. Reef floor looks along the sand channel from just above the coral banks. Close-up follows the selected fish; choose another fish in Inspect to change the subject.
- Pause, step one frame, reset, or change playback speed. Reduced motion starts paused; animation and simulation suspend when the scene is offscreen or the page is hidden.
- The Lighting tab controls Sunlight, Caustics, and Light rays independently. These appearance settings save locally and have their own reset button. Shared links and JSON presets continue to describe the schooling setup.
- Change the school and world parameters. Population or seed changes restart the simulation; behavior weights update in place.
- Click a fish, or choose one in Inspect, to view its perception radius, up to 16 nearest schoolmates, and steering force arrows. Mid/far steering uses smaller neighbor budgets.
- Guide places an anchor on the water plane; Startle creates a four-second disturbance. World controls expose keyboard alternatives for a disturbance and releasing a guide.
- The last configuration and up to eight named presets save to this browser. JSON export/import and shared links contain settings and seed, not a recording, camera position, or interaction history.
- A Luau export is a reference table of **lab** parameters. It needs an adapter and tuning for a Roblox scene; it is not advertised as a drop-in FishBrain configuration.

Configuration imports validate types, finite numbers, limits, and version. JSON files are limited to 16 KB, and shared configurations to 6,000 encoded characters. Clipboard or storage failures are reported explicitly.

## Implementation

- `src/lab/config.ts`: presets, validation, exports, deterministic random source.
- `src/lab/simulation.ts`: renderer-independent simulation, neighbor lookup, steering, collision constraints, and measurements.
- `src/lab/scene.ts`: Three.js rendering, camera, inspection, interaction, lifecycle cleanup.
- `src/lab/environment.ts`: continuous sand terrain, filtered ripple shading, caustics, water color, and slow suspended sediment.
- `src/lab/lighting.ts`: refracted water-light generation, sun/shadow setup, depth-aware volumetric rays, and HDR composition.
- `src/lab/water-spectrum.json`: shared ripple wavelengths, amplitudes, motion, projection size, and light-filter footprint for the browser and Blender.
- `src/lab/assets.ts`: local GLB loading, per-species instancing, fin/tail motion, seagrass sway, and GPU resource cleanup.
- `src/lab/swim.ts`: sampling exported Blender clips and driving instanced skeletal animation.
- `scripts/blender/build-aquatica.py`: reproducible Blender source for all fish and habitat models.
- `scripts/blender/rig-aquatica.py`: armatures, skin weights, Swim/Glide actions, animated GLB exports, and posed renders.
- `scripts/blender/refine-reef.py`: the refined reef floor, packed limestone textures, habitat compression, and the latest editable underwater scene.
- `scripts/blender/light-reef.py`: an editable lighting study with a caustic projector, feathered light shafts, and a packed snapshot of the same refracting water model.
- `art/aquatica/aquatica-assets.blend`: editable Blender project with organized species, habitat, and presentation collections.
- `art/aquatica/aquatica-rigged.blend`: rigged fish and looping animation timeline, saved separately from the modeling source.
- `art/aquatica/aquatica-reef.blend`: current habitat, original fish rigs, and a lit reef-floor presentation.
- `public/models/aquatica/`: exported GLBs, loaded only when the lab opens.
- `src/lab/FlockingLab.tsx` and `lab.css`: interface and persistence.

The lab, Three.js, and its styles are loaded only when opening the lab. No runtime requests to the private repository or third-party APIs are required. The normal Vite build is deployable on GitHub Pages; fragment routing supports direct shared links without server rewrites.

## Blender assets

The model kit is authored for this site using Blender 4.5 LTS. Blue-green chromis, yellow tang, and ocellaris clownfish have species-specific body profiles, fins, embedded skin textures, scale relief and roughness maps, gill creases, and separate glossy eyes. Thin fin membranes have modeled rays and a translucent material. The habitat includes eroded limestone outcrops with a surface normal map, branching and plate corals, hollow tube sponges, anemones, seagrass, and scattered rubble. Geometry and textures are generated in Blender for this project.

Rebuild the modeling source with `blender --background --factory-startup --python scripts/blender/build-aquatica.py` (or the full path to the Blender executable). Then run `blender --background --factory-startup --python scripts/blender/rig-aquatica.py` to export the animated fish required by the browser. The modeling stage writes static assets; the rigging stage replaces the three fish GLBs with skinned, animated models. Textures are embedded in the GLBs. The browser uses three instanced material parts per species: skin, fins, and eyes. Geometry, textures, and materials are shared across each school.

Finish with `blender --background --factory-startup --python scripts/blender/refine-reef.py`. This reads the rigged project and exports only the new habitat, preserving the animated fish. It saves the reef composition separately as `aquatica-reef.blend` and renders `reef-floor.png`. The habitat uses Draco mesh compression. Three.js supplies the decoder; Vite emits its JavaScript and WebAssembly locally, so no decoder CDN is required. The decoder's Apache 2.0 license is included at `public/licenses/draco.txt`.

## Reef floor

The habitat is arranged around three irregular limestone banks, with living coral attached to their modeled surfaces, broken branches and stones gathered at their feet, and seagrass growing in sheltered patches. Distant reef ridges frame the open water; a continuous, gently undulating sand bed leaves open passages through the foreground. The sand height function is shared between the Blender script and the browser. Packed albedo and normal textures give the limestone mineral variation and pores.

Core rock and coral geometry above the decorative floor stays inside the simulation's existing avoidance spheres. The background's tall geometry sits outside the swimming bounds. No new obstacle forces or changes to the stabilized steering are introduced by the scenery.

The renderer uses a lower default camera, blue-green distance fog, cool fill light, warm surface light, filtered sand ripples, slow suspended sediment, and UV-weighted seagrass motion. The static reef casts a cached shadow map; fish receive those shadows. The map is refreshed on model load and when reef obstacles are toggled. The Open water preset hides the habitat and its contact shading.

### Sunlight, rays, and caustics

A 24-wave water surface refracts sunlight into a repeating 1024-pixel light map spanning eight scene units. The mixed directions and wavelengths create small, irregular cells instead of the previous large, repeated loops. The same spectrum is read by the website and Blender's photon-density authoring script. The GPU compares the source and focused areas of each water triangle, accumulating brighter light where the refracted rays converge. Two separable Gaussian passes soften narrow folds before material shading; mipmaps filter the result with distance. Intermediate light accumulation uses half-float targets where supported, with a byte-target fallback. The map updates at approximately 30 Hz at normal playback and follows simulation time, including pause and reset.

Sand, coral, rock, and rigged fish sample this map in world space. A bounded contrast curve retains light between cells and rolls off concentrated highlights; the strength control blends this response without the previous extra peak boost. It modulates the sun's direct illumination before material shading and shadowing, so cave walls and shaded surfaces do not glow independently. The caustic callback composes with fish skinning and includes each instance transform. This remains a projected realtime approximation: receivers share a reference focal plane rather than tracing separate photons to every surface. The refraction foundation follows the forward-light construction described in [NVIDIA's water-caustics discussion](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics).

Volumetric rays are integrated through the water at half resolution, capped at 900 pixels wide. They use the same sun direction, surface openings, and reef shadow map as the material lighting. Opaque scene depth terminates each ray at sand, rock, or fish; depth-weighted reconstruction reduces light bleeding around silhouettes. The final HDR pass combines scene color, scattered light, and a restrained highlight halo before tone mapping. Suspended sediment brightens inside the shafts. Setting Light rays to zero skips the volume pass. Render targets, depth textures, light maps, shadows, model resources, animation palettes, and decoder workers are released when the lab closes.

Run `blender --background --factory-startup --python scripts/blender/light-reef.py` after the reef stage to create `art/aquatica/aquatica-caustics.blend` and `reef-caustics-scene.png`. This saves separately from the earlier reef and lighting projects and does not replace the web models. Blender uses a packed photon-density snapshot as a shadow-only caustic projector; the browser generates and animates its light map at runtime. The shared spectrum's wavelengths and filtered contrast match, while the two renderers retain their respective lighting and shading pipelines.

Anatomical and color references include the [Blue-green Puller species account](https://fishesofaustralia.net.au/home/species/329), [Georgia Aquarium's Clown Anemonefish](https://www.georgiaaquarium.org/animal/clown-anemonefish/), and [yellow tang reference photography](https://commons.wikimedia.org/wiki/File:Zebrasoma_flavescens_001.jpg). Reference photographs are not bundled as assets.

## Rigging and motion

Each fish has eleven weighted bones: a stable root/head, three spine sections, the tail, dorsal and anal fins, and paired pectoral and pelvic fins. Swim and Glide are independent 1.2-second clips. Open `aquatica-rigged.blend` and play frames 1–36; frame 37 is the matching loop endpoint. The study rigs share the species' editable actions. The source rigs are in **04 | Fish armatures and actions**.

The website samples each exported clip once, interpolates bone matrices into a compact per-instance palette, and applies the GLB's joint indices and weights on the GPU. Each fish has a seeded, continuous swim clock; its speed controls cadence and the blend between Swim and Glide. Position in the tank no longer changes its animation phase. Pausing and stepping also pause and step skeletal motion.

Behavior stability comes from proportional cohesion/alignment corrections, smoothly fading separation, damped steering evaluated at the fixed simulation rate, bounded turn speed, consistent avoidance-side choices, and leader-selection hysteresis. Final collision constraints slide along surfaces. Rendering interpolates position, heading, and animation between simulation steps, uses upright yaw/pitch, and smooths the close-up camera by elapsed time.

## Verification

`npm run check:lab` exercises deterministic runs, imported configuration limits, spatial query correctness, dense schools, containment, speed bounds, configuration changes, temporary disturbances, and distance-based detail. Included in `npm run check`.

`npm run check:lab-browser` checks the production build at desktop and mobile widths, including WebGL startup, playback, parameter changes, presets, persistence, import/export, shared links, overflow, and light/dark accessibility. Screenshots go to `.preview/`.
