"""Original Aquatica asset kit, built with Blender 4.5 LTS.

Run: blender --background --factory-startup --python scripts/blender/build-aquatica.py
All shapes and colors are authored here; no third-party models or textures.
Working coordinates follow the browser: X width, Y up, +Z forward.
"""

import bpy
import math
import random
import json
import numpy as np
from pathlib import Path
from mathutils import Vector, noise

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "models" / "aquatica"
SOURCE = ROOT / "art" / "aquatica"
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)
random.seed(4207)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def linear(v):
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def color(hex_value):
    hex_value = hex_value.lstrip("#")
    return tuple(linear(int(hex_value[i:i + 2], 16) / 255) for i in (0, 2, 4))


def mix(a, b, t):
    t = max(0, min(1, t))
    return tuple(x * (1 - t) + y * t for x, y in zip(a, b))


def xyz(p):
    return (p[0], -p[2], p[1])


def material(name, roughness, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    attr = mat.node_tree.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Color"
    mat.node_tree.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    mat.use_backface_culling = False
    return mat


FISH_MAT = material("Fish | satin scales and fin membranes", 0.34, 0.12)
FIN_MAT = material("Fins | thin pigmented membranes", 0.48, 0.02)
FIN_MAT.node_tree.nodes["Principled BSDF"].inputs["Alpha"].default_value = 0.78
FIN_MAT.surface_render_method = "DITHERED"
EYE_MAT = material("Eyes | wet cornea and iris", 0.13, 0.08)
EYE_MAT.node_tree.nodes["Principled BSDF"].inputs["Coat Weight"].default_value = 0.8
EYE_MAT.node_tree.nodes["Principled BSDF"].inputs["Coat Roughness"].default_value = 0.08
REEF_MAT = material("Reef | limestone and living coral", 0.88)
GRASS_MAT = material("Seagrass | green blades", 0.65)


def texture_image(name, pixels, non_color=False):
    height, width = pixels.shape[:2]
    img = bpy.data.images.new(name, width=width, height=height, alpha=True)
    img.colorspace_settings.name = "Non-Color" if non_color else "sRGB"
    img.pixels.foreach_set(pixels.astype(np.float32).reshape(-1))
    img.filepath_raw = str(SOURCE / (name + ".png"))
    img.file_format = "PNG"
    img.save()
    img.pack()
    return img


# Tangent-space scale relief, packed into every fish GLB. A relief map keeps the
# school efficient while making the overlapping scale edges visible up close.
uv_y, uv_x = np.mgrid[0:512, 0:1024].astype(np.float32)
uv_x /= 1024
uv_y /= 512
scale_row = np.floor(uv_y * 44)
sx = ((uv_x * 56 + (scale_row % 2) * 0.5) % 1) - 0.5
sy = ((uv_y * 44) % 1) - 0.5
ellipse = np.sqrt((sx / 0.61) ** 2 + (sy / 0.59) ** 2)
ridge = np.exp(-((ellipse - 0.87) / 0.095) ** 2)
body_mask = np.clip((0.81 - uv_x) * 16, 0, 1) * np.clip((uv_x - 0.06) * 15, 0, 1)
relief = (np.maximum(0, 1 - ellipse) * 0.6 - ridge * 0.2) * body_mask
dy, dx = np.gradient(relief)
normal = np.stack((-dx * 1.6, -dy * 1.6, np.ones_like(dx)), axis=-1)
normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
normal_pixels = np.concatenate((normal * 0.5 + 0.5, np.ones((*dx.shape, 1))), axis=-1)
SCALE_NORMAL = texture_image("fish-scale-normal", normal_pixels, True)
rough = 0.32 + ridge * body_mask * 0.12
ROUGHNESS = texture_image("fish-scale-roughness", np.stack((rough, rough, rough, np.ones_like(rough)), axis=-1), True)


def skin_material(species):
    mat = material(["Chromis | iridescent scales", "Tang | fine yellow skin", "Clownfish | scales and bands"][species], 0.37, 0.13 if species == 0 else 0.02)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Coat Weight"].default_value = 0.23
    bsdf.inputs["Coat Roughness"].default_value = 0.25
    bsdf.inputs["Subsurface Weight"].default_value = 0.035
    bsdf.inputs["Subsurface Radius"].default_value = (0.07, 0.035, 0.016)
    a = uv_y * math.tau
    z = uv_x * 1.34 - 0.66
    primary = np.array([color("56b7a7"), color("f7e814"), color("ee8718")][species])
    upper = np.array([color("216a80"), color("c8ba12"), color("b95810")][species])
    belly = np.array([color("c7decf"), color("f6dd38"), color("f9ae53")][species])
    blend = np.maximum(0, np.sin(a))[..., None] * (0.46 if species != 1 else 0.20)
    rgb = primary * (1 - blend) + upper * blend
    blend = np.maximum(0, -np.sin(a))[..., None] * 0.48
    rgb = rgb * (1 - blend) + belly * blend
    if species == 2:
        band_z = z + 0.018 * np.sin(a) + 0.016 * np.sin(a * 2)
        distance = np.minimum(np.minimum(np.abs(band_z - 0.405) - 0.052,
                              np.abs(band_z + 0.06) - 0.072), np.abs(band_z + 0.485) - 0.035)
        white = np.array(color("f1efdf"))
        black = np.array(color("201c16"))
        rgb = np.where((distance < 0.020)[..., None], black, rgb)
        rgb = np.where((distance < 0)[..., None], white, rgb)
    # Soft scale edging and minute mottling; tang scales are much finer/subtler.
    micro = np.sin(uv_x * 2350 + np.sin(uv_y * 970)) * np.cos(uv_y * 1780)
    rgb *= (1 - ridge * body_mask * (0.025 if species == 1 else 0.065) + micro * 0.012)[..., None]
    rgba = np.concatenate((np.clip(rgb, 0, 1), np.ones((*z.shape, 1))), axis=-1)
    image = texture_image(["chromis-skin", "yellow-tang-skin", "clownfish-skin"][species], rgba)
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = image
    links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    normal_tex = nodes.new("ShaderNodeTexImage")
    normal_tex.image = SCALE_NORMAL
    normal_node = nodes.new("ShaderNodeNormalMap")
    normal_node.inputs["Strength"].default_value = 0.15 if species == 1 else 0.45
    links.new(normal_tex.outputs["Color"], normal_node.inputs["Color"])
    links.new(normal_node.outputs["Normal"], bsdf.inputs["Normal"])
    rough_tex = nodes.new("ShaderNodeTexImage")
    rough_tex.image = ROUGHNESS
    links.new(rough_tex.outputs["Color"], bsdf.inputs["Roughness"])
    return mat


SKIN_MATS = [skin_material(i) for i in range(3)]

# A tiling relief texture adds limestone pores and fine coral surface variation.
py, px = np.mgrid[0:512, 0:512].astype(np.float32) / 512
rng = np.random.default_rng(613)
reef_height = (np.sin(px * math.tau * 9 + np.sin(py * math.tau * 7)) * 0.18 +
               np.sin(py * math.tau * 19 + np.sin(px * math.tau * 13)) * 0.11 +
               np.cos(px * math.tau * 41 + py * math.tau * 29) * 0.035 +
               rng.random((512, 512)) * 0.045)
ry = (np.roll(reef_height, -1, axis=0) - np.roll(reef_height, 1, axis=0)) * 0.5
rx = (np.roll(reef_height, -1, axis=1) - np.roll(reef_height, 1, axis=1)) * 0.5
rn = np.stack((-rx * 4, -ry * 4, np.ones_like(rx)), axis=-1)
rn /= np.linalg.norm(rn, axis=-1, keepdims=True)
reef_normal = texture_image("reef-surface-normal", np.concatenate((rn * 0.5 + 0.5, np.ones((*rx.shape, 1))), axis=-1), True)
reef_nodes, reef_links = REEF_MAT.node_tree.nodes, REEF_MAT.node_tree.links
reef_tex = reef_nodes.new("ShaderNodeTexImage")
reef_tex.image = reef_normal
reef_bump = reef_nodes.new("ShaderNodeNormalMap")
reef_bump.inputs["Strength"].default_value = 0.75
reef_links.new(reef_tex.outputs["Color"], reef_bump.inputs["Color"])
reef_links.new(reef_bump.outputs["Normal"], reef_nodes.get("Principled BSDF").inputs["Normal"])


class Mesh:
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.colors = []
        self.uvs = []
        self.material_ids = []
        self.active_material = 0

    def vertex(self, p, c, uv=(0, 0)):
        self.vertices.append(xyz(p))
        self.colors.append((*c, 1))
        self.uvs.append(uv)
        return len(self.vertices) - 1

    def face(self, *ids):
        self.faces.append(ids)
        self.material_ids.append(self.active_material)

    def sphere(self, center, scale, c, rings=8, sides=12):
        ids = []
        for i in range(rings + 1):
            a = math.pi * i / rings
            row = []
            for j in range(sides):
                b = math.tau * j / sides
                p = (center[0] + scale[0] * math.sin(a) * math.cos(b),
                     center[1] + scale[1] * math.cos(a),
                     center[2] + scale[2] * math.sin(a) * math.sin(b))
                row.append(self.vertex(p, c))
            ids.append(row)
        for i in range(rings):
            for j in range(sides):
                k = (j + 1) % sides
                self.face(ids[i][j], ids[i][k], ids[i + 1][k], ids[i + 1][j])

    def tube(self, points, radii, c, sides=7, tip=None):
        ids = []
        for i, p in enumerate(points):
            direction = Vector(points[min(i + 1, len(points) - 1)]) - Vector(points[max(i - 1, 0)])
            direction.normalize()
            u = direction.cross(Vector((0, 0, 1)))
            if u.length < 0.01:
                u = direction.cross(Vector((1, 0, 0)))
            u.normalize()
            v = direction.cross(u).normalized()
            cc = mix(c, tip or c, (i / (len(points) - 1)) ** 2)
            row = []
            for j in range(sides):
                theta = math.tau * j / sides
                q = Vector(p) + radii[i] * (math.cos(theta) * u + math.sin(theta) * v)
                row.append(self.vertex(q, cc))
            ids.append(row)
        for i in range(len(points) - 1):
            for j in range(sides):
                k = (j + 1) % sides
                self.face(ids[i][j], ids[i][k], ids[i + 1][k], ids[i + 1][j])
        self.face(*reversed(ids[0]))
        self.face(*ids[-1])

    def fin(self, origin, edge, c, edge_color, rim=False):
        """A curved fin membrane with radial striations and a fine outer rim."""
        smooth = []
        for i in range(len(edge) - 1):
            a = Vector(edge[max(0, i - 1)])
            b = Vector(edge[i])
            c1 = Vector(edge[i + 1])
            d = Vector(edge[min(len(edge) - 1, i + 2)])
            for j in range(3):
                t = j / 3
                smooth.append(0.5 * ((2 * b) + (-a + c1) * t +
                              (2 * a - 5 * b + 4 * c1 - d) * t * t +
                              (-a + 3 * b - 3 * c1 + d) * t * t * t))
        smooth.append(Vector(edge[-1]))
        edge = smooth
        rows = []
        for i, end in enumerate(edge):
            row = []
            for k in range(4):
                t = k / 3
                p = [origin[j] * (1 - t) + end[j] * t for j in range(3)]
                p[0] += math.sin(t * math.pi) * 0.012
                cc = mix(c, edge_color, max(0, (t - 0.72) / 0.28))
                if i % 3 == 0:
                    cc = mix(cc, color("fff3cc"), 0.15)
                row.append(self.vertex(p, cc))
            rows.append(row)
        for i in range(len(rows) - 1):
            for j in range(3):
                self.face(rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1])
        if rim:
            self.tube(edge, [0.0025] * len(edge), edge_color, sides=5)
        for end in edge[1::3]:
            points = [Vector(origin).lerp(Vector(end), t) + Vector((0.003, 0, 0)) for t in (0.15, 0.40, 0.7, 0.98)]
            self.tube(points, [0.0025, 0.0022, 0.0016, 0.0006], mix(c, edge_color, 0.25), 4)

    def object(self, name, mat, collection):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()
        attr = mesh.color_attributes.new(name="Color", type="FLOAT_COLOR", domain="POINT")
        for item, c in zip(attr.data, self.colors):
            item.color = c
        for item in mat if isinstance(mat, list) else [mat]:
            mesh.materials.append(item)
        uv_layer = mesh.uv_layers.new(name="UVMap")
        for face, material_id in zip(mesh.polygons, self.material_ids):
            face.use_smooth = True
            face.material_index = material_id
            values = [self.uvs[mesh.loops[loop].vertex_index] for loop in face.loop_indices]
            crosses_seam = max(v[1] for v in values) - min(v[1] for v in values) > 0.5
            for loop, uv in zip(face.loop_indices, values):
                uv_layer.data[loop].uv = (uv[0], uv[1] + 1 if crosses_seam and uv[1] < 0.5 else uv[1])
            if mat == REEF_MAT:
                axis = max(range(3), key=lambda k: abs(face.normal[k]))
                axes = [k for k in range(3) if k != axis]
                for loop in face.loop_indices:
                    co = mesh.vertices[mesh.loops[loop].vertex_index].co
                    uv_layer.data[loop].uv = (co[axes[0]] * 0.7, co[axes[1]] * 0.7)
        obj = bpy.data.objects.new(name, mesh)
        collection.objects.link(obj)
        return obj


def collection(name):
    result = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(result)
    return result


fish_collection = collection("01 | Fish species | export originals")
reef_collection = collection("02 | Reef habitat | browser coordinates")


def fish(species):
    m = Mesh()
    height = [0.30, 0.43, 0.33][species]
    width = [0.15, 0.115, 0.19][species]
    main = color(["55c7c6", "f9d32a", "ed771e"][species])
    dark = color(["286e83", "b59312", "261e19"][species])
    pale = color(["d2eadc", "ffe864", "ffeacb"][species])
    black = color("131f26")
    profiles = [
        [(-0.66, 0.16, 0.13), (-0.52, 0.31, 0.35), (-0.34, 0.68, 0.76),
         (-0.12, 0.94, 0.97), (0.10, 1, 1), (0.30, 0.90, 0.89),
         (0.46, 0.65, 0.63), (0.59, 0.36, 0.30), (0.65, 0.17, 0.13), (0.68, 0.05, 0.07)],
        [(-0.66, 0.13, 0.10), (-0.51, 0.33, 0.36), (-0.30, 0.78, 0.86),
         (-0.10, 0.98, 1), (0.12, 1, 1), (0.29, 0.84, 0.96),
         (0.43, 0.58, 0.68), (0.53, 0.25, 0.21), (0.65, 0.15, 0.075), (0.68, 0.08, 0.06)],
        [(-0.66, 0.17, 0.15), (-0.51, 0.34, 0.42), (-0.32, 0.65, 0.74),
         (-0.10, 0.94, 0.98), (0.13, 1, 1), (0.32, 0.90, 0.88),
         (0.48, 0.72, 0.68), (0.59, 0.45, 0.44), (0.655, 0.23, 0.23), (0.68, 0.08, 0.12)],
    ][species]

    def profile(z):
        for i, (a, b) in enumerate(zip(profiles, profiles[1:])):
            if z <= b[0]:
                t = max(0, (z - a[0]) / (b[0] - a[0]))
                p, q = profiles[max(0, i - 1)], profiles[min(len(profiles) - 1, i + 2)]
                return tuple(max(0.025, 0.5 * (2 * a[k] + (-p[k] + b[k]) * t +
                              (2 * p[k] - 5 * a[k] + 4 * b[k] - q[k]) * t * t +
                              (-p[k] + 3 * a[k] - 3 * b[k] + q[k]) * t * t * t)) for k in (1, 2))
        return profiles[-1][1:]

    rows = []
    # Additional rings at clownfish band edges keep the markings crisp.
    zs = sorted(set([-0.66 + i * 1.34 / 46 for i in range(47)] +
                    [-0.546, -0.541, -0.521, -0.516, -0.454, -0.450, -0.430, -0.425,
                     -0.157, -0.153, -0.130, -0.126, 0.006, 0.010, 0.033, 0.037,
                     0.329, 0.333, 0.356, 0.360, 0.450, 0.454, 0.477, 0.481]))
    for z in zs:
        w, h = profile(z)
        row = []
        for j in range(24):
            a = math.tau * j / 24
            body_z = z - (0.018 * math.sin(a) + 0.015 * math.sin(a * 2)) * max(0, 1 - abs(z) / 0.7) if species == 2 else z
            w, h = profile(body_z)
            x = math.cos(a) * w * width
            y = math.sin(a) * h * height
            # Tang has a narrow, slightly extended snout.
            center_y = -0.065 * max(0, (z - 0.3) / 0.38) if species == 1 else -0.017 * max(0, (z - 0.48) / 0.20)
            c = mix(main, dark, max(0, math.sin(a)) * (0.35 if species != 1 else 0.10))
            c = mix(c, pale, max(0, -math.sin(a)) * 0.57)
            if species == 0:
                # Fine scale sheen, a darker dorsal ridge and blue face.
                c = mix(c, pale, 0.08 * (0.5 + 0.5 * math.sin(z * 160 + j * 2.1)))
                c = mix(c, color("328da9"), max(0, z - 0.3) * 0.65)
            if species == 2:
                band_z = z
                d = min(abs(band_z - 0.405) - 0.047, abs(band_z + 0.06) - 0.068,
                        abs(band_z + 0.485) - 0.033)
                if d < 0:
                    c = color("f3f0e0")
                elif d < 0.027:
                    c = black
            row.append(m.vertex((x, y + center_y, body_z), (1, 1, 1), ((body_z + 0.66) / 1.34, j / 24)))
        rows.append(row)
    for i in range(len(rows) - 1):
        for j in range(24):
            k = (j + 1) % 24
            m.face(rows[i][j], rows[i][k], rows[i + 1][k], rows[i + 1][j])
    m.face(*reversed(rows[0]))
    m.face(*rows[-1])

    m.active_material = 1
    fin_color = mix(main, pale, 0.2)
    edge_color = black if species == 2 else mix(main, dark, 0.25)
    top = [
        [(-0.56, 0.09), (-0.48, 0.23), (-0.40, 0.33), (-0.31, 0.40),
         (-0.22, 0.39), (-0.11, 0.37), (0.00, 0.35), (0.13, 0.34), (0.25, 0.29), (0.32, 0.22)],
        [(-0.56, 0.10), (-0.47, 0.26), (-0.34, 0.51), (-0.22, 0.65),
         (-0.06, 0.69), (0.10, 0.66), (0.22, 0.56), (0.32, 0.44), (0.35, 0.28)],
        [(-0.55, 0.13), (-0.49, 0.31), (-0.41, 0.41), (-0.31, 0.43),
         (-0.21, 0.42), (-0.10, 0.39), (0.02, 0.36), (0.14, 0.34), (0.28, 0.29), (0.34, 0.22)],
    ][species]
    dorsal_gain = 1
    m.fin((0, height * 0.48, -0.1), [(0, y * dorsal_gain, z) for z, y in top], fin_color, edge_color, True)
    bottom = [(-0.53, -0.09), (-0.43, -0.27), (-0.30, -0.35), (-0.15, -0.34), (0.04, -0.25)]
    if species == 1:
        bottom = [(-0.55, -0.09), (-0.43, -0.35), (-0.28, -0.54), (-0.08, -0.60), (0.09, -0.53), (0.23, -0.33)]
    m.fin((0, -height * 0.4, -0.12), [(0, y * dorsal_gain, z) for z, y in bottom], fin_color, edge_color, True)
    if species == 2:
        # Clownfish has a rounded tail; tang and chromis have forked tails.
        tail = [(0, 0.29 * math.sin(-math.pi / 2 + i * math.pi / 12),
                 -0.73 - 0.31 * math.cos(-math.pi / 2 + i * math.pi / 12)) for i in range(13)]
    elif species == 1:
        tail = [(0, 0.27, -0.98), (0, 0.20, -1.025), (0, 0.10, -1.01),
                (0, 0, -0.975), (0, -0.10, -1.01), (0, -0.20, -1.025), (0, -0.27, -0.98)]
    else:
        tail = [(0, 0.34, -1.07), (0, 0.29, -1.06), (0, 0.19, -0.94),
                (0, 0.08, -0.83), (0, 0, -0.80), (0, -0.08, -0.83),
                (0, -0.19, -0.94), (0, -0.29, -1.06), (0, -0.34, -1.07)]
    m.fin((0, 0, -0.60), tail, fin_color, edge_color, True)
    for side in [-1, 1]:
        m.active_material = 1
        m.fin((side * width * 0.85, -0.035, 0.27),
              [(side * width, -0.08, 0.12), (side * 0.36, -0.18, -0.09),
               (side * 0.42, -0.22, -0.25), (side * 0.32, -0.24, -0.30),
               (side * 0.13, -0.16, -0.08)], fin_color, edge_color)
        m.fin((side * 0.06, -height * 0.80, 0.12),
              [(side * 0.07, -height * 0.8, 0.16), (side * 0.16, -height * 1.28, -0.09),
               (side * 0.10, -height * 1.25, -0.20)], fin_color, edge_color)
        # Eyes are set into the head, with a bronze iris, dark pupil and small catchlight.
        m.active_material = 2
        eye_z = 0.43
        eye_y = height * (0.44 if species == 1 else 0.32)
        ew, eh = profile(eye_z)
        eye_x = side * (width * ew * math.sqrt(max(0, 1 - (eye_y / (height * eh)) ** 2)))
        iris = color("d2ba67") if species != 1 else color("a58822")
        m.sphere((eye_x, eye_y, eye_z), (0.026, 0.045, 0.048), iris, 10, 16)
        m.sphere((eye_x + side * 0.018, eye_y, eye_z + 0.005), (0.016, 0.030, 0.032), black, 10, 16)
        m.sphere((eye_x + side * 0.030, eye_y + 0.009, eye_z + 0.014), (0.004, 0.005, 0.006), color("ecffff"), 5, 8)
        # Operculum crease follows the cheek, behind the eye.
        gill = []
        m.active_material = 1
        for i in range(8):
            a = -1.12 + i * 2.15 / 7
            gz = 0.27 - math.cos(a) * 0.09
            gw, gh = profile(gz)
            gy = math.sin(a) * height * 0.70
            gx = width * gw * math.sqrt(max(0, 1 - (gy / (height * gh)) ** 2)) + 0.003
            gill.append((side * gx, gy, gz))
        m.tube(gill, [0.0035] * len(gill), mix(main, dark, 0.64), 5)
        if species == 1:
            # Tang's pale caudal peduncle spine.
            m.tube([(side * 0.052, 0, -0.50), (side * 0.057, 0.012, -0.43)], [0.010, 0.005], pale, 5)
    mouth_y = -0.07 if species == 1 else -0.028
    m.tube([(-0.028, mouth_y, 0.670), (0, mouth_y - 0.003, 0.687), (0.028, mouth_y, 0.670)], [0.004] * 3, mix(dark, black, 0.4), 6)
    m.tube([(-0.026, mouth_y + 0.006, 0.668), (0, mouth_y + 0.008, 0.690), (0.026, mouth_y + 0.006, 0.668)], [0.004] * 3, mix(main, pale, 0.32), 6)
    name = ["chromis", "yellow-tang", "clownfish"][species]
    obj = m.object(name, [SKIN_MATS[species], FIN_MAT, EYE_MAT], fish_collection)
    obj["species"] = ["Chromis viridis", "Zebrasoma flavescens", "Amphiprion ocellaris"][species]
    obj["forward_axis"] = "+Z in exported glTF"
    return obj


fishes = [fish(i) for i in range(3)]


def reef_rock(m, center, scale, seed):
    """Rounded limestone with eroded shelves and color variation."""
    ids = []
    rings, sides = 20, 36
    for i in range(rings + 1):
        a = math.pi * i / rings
        row = []
        for j in range(sides):
            b = math.tau * j / sides
            q = Vector((math.sin(a) * math.cos(b), math.cos(a), math.sin(a) * math.sin(b)))
            n = noise.noise_vector(q * 2.8 + Vector((seed, seed * 0.7, 0)))
            detail = noise.noise_vector(q * 8 + Vector((seed, 0, seed)))
            r = 0.85 + 0.12 * n.x + 0.028 * detail.x + 0.035 * math.sin(a * 21 + b * 4)
            p = (center[0] + q.x * scale[0] * r,
                 center[1] + q.y * scale[1] * r,
                 center[2] + q.z * scale[2] * r)
            c = mix(color("485e59"), color("a3a08b"), (n.y + 1) * 0.48)
            c = mix(c, color("3a6557"), max(0, q.y) * 0.22)
            row.append(m.vertex(p, c))
        ids.append(row)
    for i in range(rings):
        for j in range(sides):
            k = (j + 1) % sides
            m.face(ids[i][j], ids[i][k], ids[i + 1][k], ids[i + 1][j])


def branch(m, origin, direction, length, radius, depth, tint):
    d = Vector(direction).normalized()
    p = Vector(origin)
    bend = Vector((random.uniform(-0.2, 0.2), 0.12, random.uniform(-0.2, 0.2)))
    points = [p + d * length * t + bend * t * t * length for t in [0, 0.33, 0.66, 1]]
    m.tube(points, [radius, radius * 0.82, radius * 0.64, radius * 0.35], tint, 7, mix(tint, color("f9dfca"), 0.6))
    if depth:
        for i in range(3 if depth > 1 else 2):
            angle = random.random() * math.tau
            v = Vector((math.cos(angle) * 0.74, 0.70 + random.random() * 0.45, math.sin(angle) * 0.74))
            v = (v + d * 0.45).normalized()
            start = points[2] if i == 0 else points[-1]
            branch(m, start, v, length * random.uniform(0.50, 0.67), radius * 0.57, depth - 1, tint)


def plate(m, origin, radius, tint, seed):
    rows = []
    for i in range(7):
        t = i / 6
        row = []
        for j in range(44):
            a = j * math.tau / 44
            ripple = (math.sin(a * 9 + seed) * 0.06 + math.cos(a * 5) * 0.09) * t
            r = radius * t * (1 + 0.08 * math.sin(a * 5 + seed))
            p = (origin[0] + math.cos(a) * r, origin[1] + 0.28 * t * t + ripple,
                 origin[2] + math.sin(a) * r)
            c = mix(tint, color("ecd5ad"), max(0, (t - 0.87) / 0.13) * 0.75)
            c = mix(c, color("613f41"), (0.5 + 0.5 * math.sin(t * 120)) * 0.12)
            row.append(m.vertex(p, c))
        rows.append(row)
    for i in range(6):
        for j in range(44):
            k = (j + 1) % 44
            m.face(rows[i][j], rows[i][k], rows[i + 1][k], rows[i + 1][j])


def sponge(m, origin, height, radius, tint):
    rows = []
    for i in range(9):
        t = i / 8
        r = radius * (0.64 + 0.35 * t + 0.08 * math.sin(t * 11))
        row = []
        for j in range(14):
            a = j * math.tau / 14
            p = (origin[0] + math.cos(a) * r + t * t * 0.15,
                 origin[1] + height * t, origin[2] + math.sin(a) * r)
            row.append(m.vertex(p, mix(tint, color("e9c982"), t * 0.25)))
        rows.append(row)
    for i in range(8):
        for j in range(14):
            k = (j + 1) % 14
            m.face(rows[i][j], rows[i][k], rows[i + 1][k], rows[i + 1][j])
    # Rolled lip and recessed inner cavity, not a capped cylinder.
    inner = []
    bottom = []
    for j in range(14):
        a = j * math.tau / 14
        inner.append(m.vertex((origin[0] + math.cos(a) * radius * 0.74 + 0.15,
                               origin[1] + height - 0.025, origin[2] + math.sin(a) * radius * 0.74), mix(tint, color("f0d397"), 0.4)))
        bottom.append(m.vertex((origin[0] + math.cos(a) * radius * 0.50 + 0.13,
                                origin[1] + height * 0.6, origin[2] + math.sin(a) * radius * 0.50), mix(tint, color("282926"), 0.8)))
    for j in range(14):
        k = (j + 1) % 14
        m.face(rows[-1][j], rows[-1][k], inner[k], inner[j])
        m.face(inner[j], inner[k], bottom[k], bottom[j])
    m.face(*bottom)


# Core habitat stays inside the simulation's three existing clearance spheres.
REEFS = [((-8, 2.3, -3), 5.1), ((9, 1.4, -5), 4.4), ((2, 0.6, 8), 3.5)]
habitats = []
for index, (center, radius) in enumerate(REEFS):
    m = Mesh()
    cx, cy, cz = center
    reef_rock(m, (cx, cy - radius * 0.26, cz), (radius * 0.98, radius * 0.67, radius * 0.91), index * 4.1)
    for j in range(7):
        a = j * math.tau / 7
        rr = radius * 0.60
        reef_rock(m, (cx + math.cos(a) * rr, max(-0.4, cy - radius * 0.5), cz + math.sin(a) * rr),
                  (radius * 0.34, radius * 0.30, radius * 0.36), 8 + j + index * 10)
    for j in range(8):
        a = j * 2.4 + index
        rr = radius * (0.15 + (j % 3) * 0.15)
        origin = (cx + math.cos(a) * rr, cy + radius * (0.17 + (0.07 if j == 0 else 0)), cz + math.sin(a) * rr)
        tint = color(["cc797b", "bc935f", "8b7faf", "d0926f", "799b8c"][(j + index) % 5])
        branch(m, origin, (math.cos(a) * 0.12, 1, math.sin(a) * 0.12), radius * 0.25, radius * 0.030, 3, tint)
    for j in range(4):
        a = index + j * 1.8
        origin = (cx + math.cos(a) * radius * 0.57, cy - 0.15 + j * 0.22, cz + math.sin(a) * radius * 0.57)
        plate(m, origin, radius * (0.28 + random.random() * 0.10), color(["b78866", "899d8a", "ae7890"][index]), j)
    for j in range(6):
        a = index + j * 0.8
        origin = (cx + math.cos(a) * radius * 0.45, cy + radius * 0.12, cz + math.sin(a) * radius * 0.40)
        sponge(m, origin, radius * random.uniform(0.18, 0.31), radius * random.uniform(0.055, 0.085), color("b28b55"))
    # A small anemone colony nestles in a rock crevice.
    anemone = Vector((cx - radius * 0.34, cy + radius * 0.25, cz + radius * 0.12))
    for j in range(44):
        a = j * 2.39996
        r = math.sqrt(j / 44) * radius * 0.14
        origin = anemone + Vector((math.cos(a) * r, 0, math.sin(a) * r))
        height = radius * random.uniform(0.08, 0.16)
        points = [origin + Vector((math.cos(a) * t * t * 0.17, height * t,
                                   math.sin(a) * t * t * 0.17)) for t in (0, 0.25, 0.5, 0.75, 1)]
        m.tube(points, [0.039, 0.035, 0.030, 0.024, 0.014], color("887d6f"), 6, color("cbb2aa"))
    habitats.append(m.object("reef-outcrop-" + str(index + 1), REEF_MAT, reef_collection))

grass = Mesh()
for cluster in range(85):
    x, z = random.uniform(-27, 27), random.uniform(-19, 19)
    if any((x - c[0]) ** 2 + (z - c[2]) ** 2 < (r * 0.91) ** 2 for c, r in REEFS):
        continue
    for blade in range(random.randint(5, 10)):
        a = random.random() * math.tau
        h = random.uniform(0.7, 2.0)
        w = random.uniform(0.05, 0.11)
        base = (x + random.uniform(-0.35, 0.35), -0.91, z + random.uniform(-0.35, 0.35))
        rows = []
        for j in range(6):
            t = j / 5
            p = Vector((base[0] + math.cos(a) * h * t * t * 0.52, base[1] + h * t,
                        base[2] + math.sin(a) * h * t * t * 0.52))
            u = Vector((math.sin(a), 0, -math.cos(a))) * w * (1 - t * 0.94)
            tint = mix(color("285b48"), color("86a36b"), t * 0.75)
            rows.append([grass.vertex(p - u, tint), grass.vertex(p + u, tint)])
        for j in range(5):
            grass.face(rows[j][0], rows[j][1], rows[j + 1][1], rows[j + 1][0])
grass_obj = grass.object("seagrass-meadow", GRASS_MAT, reef_collection)

rubble = Mesh()
for i in range(100):
    x, z = random.uniform(-29, 29), random.uniform(-21, 21)
    size = random.uniform(0.08, 0.36)
    rubble.sphere((x, -0.95 + size * 0.2, z), (size, size * 0.48, size * 0.75),
                  mix(color("798576"), color("b0b5a2"), random.random()), 4, 7)
rubble_obj = rubble.object("sand-rubble", REEF_MAT, reef_collection)


def export(name, objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(filepath=str(OUT / (name + ".glb")), export_format="GLB",
                              use_selection=True, export_yup=True, export_apply=True,
                              export_animations=False, export_cameras=False, export_lights=False,
                              export_vertex_color="MATERIAL", export_materials="EXPORT")


for obj in fishes:
    export(obj.name, [obj])
export("reef-habitat", habitats + [grass_obj, rubble_obj])

# A presentation-only sand bed helps view the habitat in Blender. The website
# supplies its own animated sand/caustics material at the same height.
bpy.ops.mesh.primitive_plane_add(size=160, location=xyz((0, -1, 0)))
floor = bpy.context.object
floor.name = "Sand bed | Blender presentation only"
floor_mat = bpy.data.materials.new("Sand | fine carbonate grains")
floor_mat.use_nodes = True
floor_bsdf = floor_mat.node_tree.nodes.get("Principled BSDF")
floor_bsdf.inputs["Base Color"].default_value = (*color("667c72"), 1)
floor_bsdf.inputs["Roughness"].default_value = 0.91
floor_noise = floor_mat.node_tree.nodes.new("ShaderNodeTexNoise")
floor_noise.inputs["Scale"].default_value = 3000
floor_bump = floor_mat.node_tree.nodes.new("ShaderNodeBump")
floor_bump.inputs["Strength"].default_value = 0.14
floor_bump.inputs["Distance"].default_value = 0.01
floor_mat.node_tree.links.new(floor_noise.outputs["Fac"], floor_bump.inputs["Height"])
floor_mat.node_tree.links.new(floor_bump.outputs["Normal"], floor_bsdf.inputs["Normal"])
floor.data.materials.append(floor_mat)

# The source file includes a presentation scene, with originals in named collections.
# Hide the original fish at the origin and arrange display copies for a close study.
presentation = collection("03 | Fish study | presentation only")
for i, source in enumerate(fishes):
    source.hide_render = True
    source.hide_set(True)
    copy = source.copy()
    copy.data = source.data
    copy.name = source.name + " | study"
    presentation.objects.link(copy)
    copy.hide_render = False
    copy.hide_set(False)
    copy.location = xyz((-3.2 + i * 3.1, 10, 0))
    copy.rotation_euler.z = -math.pi / 2
    copy.scale = (2, 2, 2)

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.world.color = (0.08, 0.08, 0.08)
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.025, 0.060, 0.073, 1)
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.5


def area(name, p, energy, size, tint, target):
    data = bpy.data.lights.new(name, "AREA")
    data.energy, data.shape, data.size, data.color = energy, "DISK", size, tint
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = xyz(p)
    obj.rotation_euler = (Vector(xyz(target)) - obj.location).to_track_quat("-Z", "Y").to_euler()


area("Soft surface light", (0, 18, 8), 2300, 10, (0.75, 0.93, 1), (0, 8, 0))
area("Soft fill", (-7, 11, 5), 1200, 8, (0.83, 0.95, 1), (0, 9, 0))
area("Blue rim", (4, 13, -7), 2600, 8, (0.43, 0.79, 1), (0, 9, 0))
camera_data = bpy.data.cameras.new("Fish study camera")
camera = bpy.data.objects.new("Fish study camera", camera_data)
scene.collection.objects.link(camera)
camera.location = xyz((0, 12, 15))
camera.rotation_euler = (Vector(xyz((0, 10, 0))) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera_data.type = "ORTHO"
camera_data.ortho_scale = 11
scene.camera = camera
scene.render.resolution_x = 1600
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = "AgX"
bpy.ops.object.select_all(action="DESELECT")
for obj in presentation.objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = list(presentation.objects)[0]
for screen in bpy.data.screens:
    for area_item in screen.areas:
        if area_item.type == "VIEW_3D":
            area_item.spaces.active.region_3d.view_perspective = "CAMERA"
            area_item.spaces.active.shading.type = "MATERIAL"
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / "aquatica-assets.blend"))
manifest = {"generator": bpy.app.version_string, "assets": []}
for path in sorted(OUT.glob("*.glb")):
    manifest["assets"].append({"file": path.name, "bytes": path.stat().st_size})
(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
scene.render.filepath = str(SOURCE / "fish-study.png")
bpy.ops.render.render(write_still=True)
# A second render documents the habitat rather than only the fish study.
for obj in presentation.objects:
    obj.hide_render = True
camera.location = xyz((31, 25, 36))
camera.rotation_euler = (Vector(xyz((0, 2, 0))) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera_data.ortho_scale = 51
area("Habitat daylight", (0, 24, 0), 14000, 25, (0.66, 0.89, 1), (0, 0, 0))
scene.render.filepath = str(SOURCE / "reef-study.png")
bpy.ops.render.render(write_still=True)
print("AQUATICA_ASSETS_COMPLETE " + json.dumps(manifest))
