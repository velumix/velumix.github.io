# Aquatica model workshop

Editable models for Velumix's Aquatica Flocking Lab, created in Blender 4.5 LTS.

- `aquatica-assets.blend` contains the three original fish, complete habitat, and a lit fish-study presentation.
- `aquatica-rigged.blend` adds eleven-bone fish armatures, skin weights, and looping Swim/Glide actions. Play frames 1–36 to see the swim cycle; frame 37 closes the loop.
- `aquatica-reef.blend` is the latest reef-floor scene: textured limestone banks, dense branching and plate corals, sea fans, tube sponges, coral scree, patchy seagrass, and a distant reef rim. It preserves the editable fish rigs and adds a staged school and underwater presentation lighting.
- `aquatica-caustics.blend` is the current lighting study: fine ripple caustics, restrained highlight contrast, a refracted-sun direction, soft light shafts, and a denoised underwater presentation. `reef-caustics-scene.png` shows the reef-level camera. The previous `aquatica-lighting.blend` and `reef-lighting.png` are retained.
- `reef-caustics.png` is a packed photon-density snapshot of the website's 24-wave ripple spectrum. `src/lab/water-spectrum.json` controls both authoring and the browser. The website generates and filters its animated caustic map directly on the GPU; the earlier `water-caustics.png` is retained only for the previous lighting project.
- `reef-floor.png` and `reef-floor-close.png` show the refined habitat from the overview and reef-level cameras. `reef-limestone-albedo.png` and `reef-limestone-normal.png` are its seamless mineral and pore textures.
- `rig-manifest.json` records the bones, clips, durations, and source vertex counts.
- `swim-pose-10.png` and `swim-pose-28.png` show two phases of the rigged motion.
- `fish-study.png` and `reef-study.png` are the Blender presentation renders.
- The skin, scale, and reef PNGs are editable texture sources, also packed into the `.blend` and web GLBs.
- `../../scripts/blender/build-aquatica.py` recreates the source file and the exported web assets.
- Run `../../scripts/blender/rig-aquatica.py` after the modeling script to regenerate the animated fish GLBs and rigged project.
- Finally run `../../scripts/blender/refine-reef.py` to regenerate the latest habitat and `aquatica-reef.blend`. This stage exports only the habitat, with Draco compression; it preserves the animated fish GLBs.
- Run `../../scripts/blender/light-reef.py` for the separate lighting project and render. Its **06 | Sunlight and caustic projection** collection holds the shadow-only surface projector and the three feathered shafts; these presentation objects are not exported into the habitat GLB.
- `../../scripts/blender/water_caustics.py` can also run alone in Blender to regenerate the new caustic texture without rendering the scene.
- `../../public/models/aquatica/` contains the lightweight GLB files used by the website.

Collections are named by purpose. The source fish are hidden in the presentation, but remain editable in **01 | Fish species | export originals**. The three study copies share their original mesh data. Each fish points along +Z after glTF export, matching the simulation. Reef coordinates match the existing three obstacle spheres; the seagrass and rubble are decorative.

In the latest reef project, **02 | Reef floor | export geometry** holds the website habitat. **05 | Reef observatory | presentation only** contains the matching sand terrain, water volume, lighting, camera, and staged fish. The browser generates its own sand bed with the same height function and adds drifting sediment, animated caustics, depth fog, and cached reef shadows. Taller background scenery remains outside the swimming bounds; low rubble and vegetation sit below the fish's floor. The original two Blender source projects are retained separately.

All geometry and textures were authored for this project. The fish use species-specific profiles, modeled fin rays, textured skin, scale relief, translucent fin membranes, and glossy eyes for real-time rendering.

Rig controls are named `root`, `spine.front`, `spine.mid`, `spine.rear`, `tail`, `dorsal`, `anal`, `pectoral.L/R`, and `pelvic.L/R`. The head remains stable; a traveling wave bends the spine and tail, and the paired fins scull. Source armatures are organized under **04 | Fish armatures and actions**; presentation copies are in the fish-study collection. Edit the actions in the Action Editor or switch the rig's active action to Glide for the lower-effort cycle.
