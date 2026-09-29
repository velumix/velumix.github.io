"""An editable lighting study for the Aquatica reef, using Blender 4.5 LTS.

Reads aquatica-reef.blend and saves aquatica-caustics.blend separately.
The website calculates its animated caustics on the GPU. This project packs
a photon-density snapshot of the shared ripple spectrum for a sun gobo.
"""

import bpy
import sys
import numpy as np
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "art" / "aquatica"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from water_caustics import SPECTRUM, WATER_SUN, make_caustic_image

bpy.ops.wm.open_mainfile(filepath=str(ART / "aquatica-reef.blend"))
scene = bpy.context.scene


def xyz(p):
    return (p[0], -p[2], p[1])


collection = bpy.data.collections.new("06 | Sunlight and caustic projection")
scene.collection.children.link(collection)
water_sun = WATER_SUN
tile = SPECTRUM["tile"]
image = make_caustic_image()

# The sun is refracted toward the surface normal on entering the water.
sun = bpy.data.objects["Sun through the water"]
sun.location = xyz(water_sun * 68)
sun.rotation_euler = (-sun.location).to_track_quat("-Z", "Y").to_euler()
sun.data.energy = 5.6
sun.data.color = (1.0, 0.95, 0.82)
sun.data.angle = 0.005
bpy.data.objects["Broad surface fill"].data.energy = 5800
bpy.data.objects["Blue water fill"].data.energy = 1900
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.20

# A shadow-only, transparent sun gobo projects the focused light onto every
# surface and through the volume. It is excluded from all web asset exports.
bpy.ops.mesh.primitive_plane_add(size=180, location=xyz((0, 34, 0)))
gobo = bpy.context.object
gobo.name = "Water light transmission | shadow-only projector"
for owner in list(gobo.users_collection):
    owner.objects.unlink(gobo)
collection.objects.link(gobo)
gobo.visible_camera = False
gobo.visible_diffuse = False
gobo.visible_glossy = False
gobo.display_type = "WIRE"
mat = bpy.data.materials.new("Surface light | refracted caustic transmission")
mat.use_nodes = True
nodes, links = mat.node_tree.nodes, mat.node_tree.links
nodes.clear()
geometry = nodes.new("ShaderNodeNewGeometry")
mapping = nodes.new("ShaderNodeMapping")
mapping.inputs["Scale"].default_value = (1 / tile, -1 / tile, 1)
mapping.inputs["Location"].default_value = (.5, .5, 0)
links.new(geometry.outputs["Position"], mapping.inputs["Vector"])
texture = nodes.new("ShaderNodeTexImage")
texture.image = image
texture.extension = "REPEAT"
links.new(mapping.outputs["Vector"], texture.inputs["Vector"])
opaque = nodes.new("ShaderNodeBsdfDiffuse")
opaque.inputs["Color"].default_value = (0, 0, 0, 1)
transparent = nodes.new("ShaderNodeBsdfTransparent")
blend = nodes.new("ShaderNodeMixShader")
links.new(texture.outputs["Color"], blend.inputs[0])
links.new(opaque.outputs[0], blend.inputs[1])
links.new(transparent.outputs[0], blend.inputs[2])
output = nodes.new("ShaderNodeOutputMaterial")
links.new(blend.outputs[0], output.inputs["Surface"])
gobo.data.materials.append(mat)

# Broad, feathered openings give the suspended water readable shafts.
for name, point, power, angle in [
        ("Shaft | western coral bank", (-10, -1, -2), 1600, .38),
        ("Shaft | open sand channel", (7, -1, -7), 1950, .31),
        ("Shaft | foreground grazing light", (15, -1, 11), 1000, .26)]:
    data = bpy.data.lights.new(name, "SPOT")
    data.energy = power
    data.color = (.73, .92, 1.0)
    data.spot_size = angle
    data.spot_blend = .72
    data.shadow_soft_size = .28
    data.volume_factor = 6
    lamp = bpy.data.objects.new(name, data)
    collection.objects.link(lamp)
    lamp.location = xyz(np.array(point) + water_sun * (32 / water_sun[1]))
    lamp.rotation_euler = (Vector(xyz(point)) - lamp.location).to_track_quat("-Z", "Y").to_euler()

water = bpy.data.materials["Water | suspended blue-green light"]
volume = next(n for n in water.node_tree.nodes if n.type == "PRINCIPLED_VOLUME")
volume.inputs["Color"].default_value = (.45, .72, .79, 1)
volume.inputs["Density"].default_value = .008
volume.inputs["Anisotropy"].default_value = .32

# Denoise the volume before applying smooth distance color. Mist is blurred
# independently to avoid reintroducing sample noise into the finished image.
scene.view_layers[0].use_pass_mist = True
scene.view_layers[0].cycles.denoising_store_passes = True
scene.world.mist_settings.start = 12
scene.world.mist_settings.depth = 125
nodes, links = scene.node_tree.nodes, scene.node_tree.links
nodes.clear()
layers = nodes.new("CompositorNodeRLayers")
denoise = nodes.new("CompositorNodeDenoise")
links.new(layers.outputs["Image"], denoise.inputs["Image"])
links.new(layers.outputs["Denoising Normal"], denoise.inputs["Normal"])
links.new(layers.outputs["Denoising Albedo"], denoise.inputs["Albedo"])
blur = nodes.new("CompositorNodeBlur")
blur.filter_type = "GAUSS"
blur.size_x, blur.size_y = 4, 4
links.new(layers.outputs["Mist"], blur.inputs["Image"])
fog = nodes.new("CompositorNodeMixRGB")
fog.inputs[2].default_value = (.006, .038, .049, 1)
links.new(blur.outputs["Image"], fog.inputs[0])
links.new(denoise.outputs["Image"], fog.inputs[1])
glow = nodes.new("CompositorNodeGlare")
glow.glare_type = "FOG_GLOW"
glow.quality = "HIGH"
glow.threshold = 1.4
glow.mix = -.94
links.new(fog.outputs[0], glow.inputs["Image"])
output = nodes.new("CompositorNodeComposite")
links.new(glow.outputs["Image"], output.inputs[0])
scene.camera = bpy.data.objects["Reef channel camera"]
scene.view_settings.exposure = .4
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = 1600, 1000
scene.frame_set(10)
bpy.ops.object.select_all(action="DESELECT")
sun.select_set(True)
bpy.context.view_layer.objects.active = sun
bpy.ops.wm.save_as_mainfile(filepath=str(ART / "aquatica-caustics.blend"))
scene.render.filepath = str(ART / "reef-caustics-scene.png")
bpy.ops.render.render(write_still=True)
print("AQUATICA_LIGHTING_COMPLETE")
