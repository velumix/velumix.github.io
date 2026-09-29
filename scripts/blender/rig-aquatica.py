"""Add editable armatures and looped actions to the existing Aquatica models.

blender --background --factory-startup --python scripts/blender/rig-aquatica.py
The unrigged source is read without overwriting it; output is aquatica-rigged.blend.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector, Quaternion, Matrix

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "art" / "aquatica"
OUT = ROOT / "public" / "models" / "aquatica"
bpy.ops.wm.open_mainfile(filepath=str(SOURCE / "aquatica-assets.blend"))
scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 36


def xyz(p):
    return (p[0], -p[2], p[1])


def smooth(t):
    t = max(0, min(1, t))
    return t * t * (3 - 2 * t)


rig_collection = bpy.data.collections.new("04 | Fish armatures and actions")
scene.collection.children.link(rig_collection)
species = ["chromis", "yellow-tang", "clownfish"]
report = []


def make_rig(mesh, school):
    mesh.hide_set(False)
    bpy.ops.object.select_all(action="DESELECT")
    armature = bpy.data.armatures.new(mesh.name + " | skeleton")
    rig = bpy.data.objects.new(mesh.name + " | rig", armature)
    rig_collection.objects.link(rig)
    rig.show_in_front = True
    rig.data.display_type = "OCTAHEDRAL"
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")
    definitions = [
        ("root", (0, 0, 0.32), (0, 0.22, 0.32), None),
        ("spine.front", (0, 0, 0.20), (0, 0, -0.10), "root"),
        ("spine.mid", (0, 0, -0.10), (0, 0, -0.37), "spine.front"),
        ("spine.rear", (0, 0, -0.37), (0, 0, -0.64), "spine.mid"),
        ("tail", (0, 0, -0.64), (0, 0, -1.06), "spine.rear"),
        ("dorsal", (0, 0.20, -0.12), (0, 0.50, -0.18), "spine.front"),
        ("anal", (0, -0.20, -0.18), (0, -0.42, -0.28), "spine.mid"),
    ]
    width = [0.15, 0.115, 0.19][school]
    height = [0.30, 0.43, 0.33][school]
    for side, label in [(-1, "L"), (1, "R")]:
        definitions += [
            ("pectoral." + label, (side * width * 0.85, -0.035, 0.27),
             (side * 0.40, -0.20, -0.22), "root"),
            ("pelvic." + label, (side * 0.06, -height * 0.80, 0.12),
             (side * 0.14, -height * 1.25, -0.16), "root"),
        ]
    for name, head, tail, parent in definitions:
        bone = armature.edit_bones.new(name)
        bone.head, bone.tail = xyz(head), xyz(tail)
        if parent:
            bone.parent = armature.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")
    groups = {bone.name: mesh.vertex_groups.new(name=bone.name) for bone in armature.bones}
    vertex_material = [0] * len(mesh.data.vertices)
    for polygon in mesh.data.polygons:
        for index in polygon.vertices:
            vertex_material[index] = polygon.material_index
    joints = [(0.20, "root"), (-0.05, "spine.front"), (-0.30, "spine.mid"),
              (-0.56, "spine.rear"), (-0.82, "tail")]
    for vertex in mesh.data.vertices:
        x, z, y = vertex.co.x, -vertex.co.y, vertex.co.z
        weights = {"root": 1.0}
        if z <= joints[-1][0]:
            weights = {"tail": 1.0}
        else:
            for (front_z, front), (back_z, back) in zip(joints, joints[1:]):
                if back_z <= z <= front_z:
                    t = smooth((front_z - z) / (front_z - back_z))
                    weights = {front: 1 - t, back: t}
                    break
        # Fin vertices are separate from the skin and eyes in the source mesh.
        if vertex_material[vertex.index] == 1 and z > -0.61:
            fin, amount = None, 0
            if abs(x) > width * 0.70 and -0.34 < z < 0.28 and y > -height * 0.78:
                fin = "pectoral." + ("L" if x < 0 else "R")
                amount = smooth((abs(x) - width * 0.74) / 0.13)
            elif abs(x) > 0.045 and y < -height * 0.80 and z > -0.24:
                fin = "pelvic." + ("L" if x < 0 else "R")
                amount = smooth((-y / height - 0.80) / 0.34)
            elif abs(x) < 0.045 and y > height * 0.72:
                fin = "dorsal"
                amount = smooth((y - height * 0.72) / 0.17) * 0.8
            elif abs(x) < 0.045 and y < -height * 0.72:
                fin = "anal"
                amount = smooth((-y - height * 0.72) / 0.14) * 0.8
            if fin and amount > 0:
                weights = {name: w * (1 - amount) for name, w in weights.items()}
                weights[fin] = amount
        if vertex_material[vertex.index] == 2:
            weights = {"root": 1.0}
        total = sum(weights.values())
        for name, weight in weights.items():
            if weight > 0.00001:
                groups[name].add([vertex.index], weight / total, "REPLACE")
    modifier = mesh.modifiers.new("Aquatica weighted swim rig", "ARMATURE")
    modifier.object = rig
    modifier.use_deform_preserve_volume = False  # Match glTF linear skinning.
    mesh.parent = rig
    mesh.matrix_parent_inverse = Matrix.Identity(4)
    rig["description"] = "Stationary head; traveling spine wave; tail propulsion; paired fin sculling."
    rig["cycle_seconds"] = 1.2
    return rig


def animate(rig, school, name, strength):
    action = bpy.data.actions.new(rig.name.split(" |")[0] + " | " + name)
    action.use_fake_user = True
    rig.animation_data_create()
    rig.animation_data.action = action
    species_gain = [1.0, 0.73, 0.86][school]
    for frame in range(1, 38):
        phase = (frame - 1) / 36 * math.tau
        for bone in rig.pose.bones:
            amplitude, lag, axis, frequency = 0, 0, Vector((0, 0, 1)), 1
            if bone.name.startswith("spine"):
                i = ["spine.front", "spine.mid", "spine.rear"].index(bone.name)
                amplitude, lag = [0.018, 0.052, 0.095][i] * species_gain * strength, i * 0.70
            elif bone.name == "tail":
                amplitude, lag = 0.23 * species_gain * strength, 2.10
            elif bone.name.startswith("pectoral"):
                side = -1 if bone.name.endswith("L") else 1
                amplitude = side * (0.16 + strength * 0.12)
                frequency, axis = 2, Vector((0, -1, 0))
            elif bone.name.startswith("pelvic"):
                amplitude, frequency, axis = 0.055 * strength, 2, Vector((0, -1, 0))
            elif bone.name == "dorsal":
                amplitude, lag, axis = 0.035 * strength, 0.5, Vector((0, 1, 0))
            elif bone.name == "anal":
                amplitude, lag, axis = 0.030 * strength, 1.1, Vector((0, 1, 0))
            local_axis = bone.bone.matrix_local.to_3x3().inverted() @ axis
            bone.rotation_mode = "QUATERNION"
            bone.rotation_quaternion = Quaternion(local_axis.normalized(), math.sin(phase * frequency - lag) * amplitude)
            bone.keyframe_insert(data_path="rotation_quaternion", frame=frame, group=bone.name)
    # Keep one independent NLA track per clip for predictable glTF names.
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(action.name, 1, action)
    strip.action_frame_start = 1
    strip.action_frame_end = 37
    track.mute = True
    rig.animation_data.action = None
    return action


for school, name in enumerate(species):
    print("Rigging " + name, flush=True)
    mesh = bpy.data.objects[name]
    rig = make_rig(mesh, school)
    glide = animate(rig, school, "Glide", 0.30)
    swim = animate(rig, school, "Swim", 1.0)
    scene.frame_set(1)
    bpy.ops.object.select_all(action="DESELECT")
    mesh.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    for bone in rig.pose.bones:
        bone.rotation_quaternion = Quaternion()
    # Track muting controls the Blender preview; the exporter handles each track independently.
    for track in rig.animation_data.nla_tracks:
        track.mute = False
    bpy.ops.export_scene.gltf(
        filepath=str(OUT / (name + ".glb")), export_format="GLB", use_selection=True,
        export_yup=True, export_apply=False, export_animations=True,
        export_animation_mode="NLA_TRACKS", export_force_sampling=True,
        export_frame_range=False, export_skins=True, export_def_bones=True,
        export_cameras=False, export_lights=False, export_materials="EXPORT",
        export_vertex_color="MATERIAL", export_influence_nb=4,
    )
    for track in rig.animation_data.nla_tracks:
        track.mute = True
    rig.animation_data.action = swim
    # The display copies get their own armature transforms, sharing the editable action.
    study = bpy.data.objects.get(name + " | study")
    if study:
        display_transform = study.matrix_world.copy()
        display_collection = study.users_collection[0]
        bpy.data.objects.remove(study, do_unlink=True)
        study_rig = rig.copy()
        study_rig.data = rig.data.copy()
        study_rig.name = name + " | study rig"
        bpy.data.collections["03 | Fish study | presentation only"].objects.link(study_rig)
        study_rig.matrix_world = display_transform
        study = mesh.copy()
        study.name = name + " | study"
        display_collection.objects.link(study)
        study.hide_set(False)
        study.hide_render = False
        study.parent = study_rig
        study.matrix_parent_inverse = Matrix.Identity(4)
        study.matrix_basis = Matrix.Identity(4)
        for mod in study.modifiers:
            if mod.type == "ARMATURE":
                mod.object = study_rig
        study_rig.hide_set(False)
        study_rig.hide_render = False
    mesh.hide_render = True
    mesh.hide_set(True)
    rig.hide_set(True)
    report.append({"species": name, "bones": len(rig.data.bones), "clips": ["Glide", "Swim"],
                   "duration": 1.2, "vertices": len(mesh.data.vertices)})

scene.frame_set(1)
scene.render.fps = 30
scene.frame_end = 36
scene.timeline_markers.clear()
for name, frame in [("Cycle start", 1), ("Left stroke", 10), ("Recovery", 19), ("Right stroke", 28)]:
    scene.timeline_markers.new(name, frame=frame)
bpy.ops.object.select_all(action="DESELECT")
study_rig = bpy.data.objects.get("chromis | study rig")
if study_rig:
    study_rig.select_set(True)
    bpy.context.view_layer.objects.active = study_rig
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / "aquatica-rigged.blend"))
(SOURCE / "rig-manifest.json").write_text(json.dumps(report, indent=2) + "\n")
manifest = {"generator": bpy.app.version_string, "rigged": True,
            "assets": [{"file": p.name, "bytes": p.stat().st_size} for p in sorted(OUT.glob("*.glb"))]}
(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
# Render different stroke phases for review without changing the saved animation project.
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.cycles.samples = 16
for frame in [10, 28]:
    scene.frame_set(frame)
    scene.render.filepath = str(SOURCE / ("swim-pose-" + str(frame) + ".png"))
    bpy.ops.render.render(write_still=True)
print("AQUATICA_RIG_COMPLETE " + json.dumps(report))
