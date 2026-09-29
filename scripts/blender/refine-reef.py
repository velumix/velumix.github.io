"""Author the reef-floor habitat in Blender 4.5 LTS.

Run after build-aquatica.py and rig-aquatica.py. Reads the rigged source,
writes aquatica-reef.blend, and replaces ONLY the habitat GLB. Fish rigs,
weights, and animation exports stay intact. Coordinates below are browser Y-up.
"""

import bpy
import math
import random
import json
import numpy as np
from pathlib import Path
from mathutils import Vector, Matrix, noise
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "art" / "aquatica"
OUT = ROOT / "public" / "models" / "aquatica"
bpy.ops.wm.open_mainfile(filepath=str(SOURCE / "aquatica-rigged.blend"))
random.seed(280926)
scene = bpy.context.scene


def xyz(p):
    return (p[0], -p[2], p[1])


def color(value):
    value = value.lstrip("#")
    rgb = [int(value[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in rgb)


def mix(a, b, t):
    t = max(0, min(1, t))
    return tuple(x * (1 - t) + y * t for x, y in zip(a, b))


def ground(x, z):
    # Kept identical to terrainHeight in src/lab/environment.ts.
    return (-1 + 0.16 * math.sin(x * 0.15 + 0.4 * math.sin(z * 0.14))
            + 0.13 * math.cos(z * 0.21 - x * 0.08) + 0.07 * math.sin(x * 0.46 + z * 0.12))


def collection(name):
    result = bpy.data.collections.new(name)
    scene.collection.children.link(result)
    return result


# Replace the old habitat in this new file; keep the fish workshop and actions.
old_reef = bpy.data.collections.get("02 | Reef habitat | browser coordinates")
if old_reef:
    for obj in list(old_reef.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.collections.remove(old_reef)
for obj in list(bpy.data.objects):
    if obj.type in {"LIGHT", "CAMERA"} or obj.name.startswith("Sand bed"):
        bpy.data.objects.remove(obj, do_unlink=True)
    elif "study" in obj.name:
        obj.hide_render = True
        obj.hide_set(True)
habitat = collection("02 | Reef floor | export geometry")
presentation = collection("05 | Reef observatory | presentation only")

stone_mat = bpy.data.materials["Reef | limestone and living coral"]
stone_mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.92
for node in stone_mat.node_tree.nodes:
    if node.type == "NORMAL_MAP":
        node.inputs["Strength"].default_value = 0.55
coral_mat = stone_mat.copy()
coral_mat.name = "Coral | calcified branches and folded plates"
coral_mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.78
grass_mat = bpy.data.materials["Seagrass | green blades"]

# Seamless mineral mottling and limestone pores, authored as packed textures.
# A periodic spectral field avoids visible tile boundaries or painted lighting.
rng = np.random.default_rng(826)
size = 512
fy, fx = np.meshgrid(np.fft.fftfreq(size), np.fft.fftfreq(size), indexing="ij")
frequency = np.sqrt(fx * fx + fy * fy)
spectrum = np.fft.fft2(rng.standard_normal((size, size)))


def field(power, cutoff):
    weight = 1 / np.maximum(frequency, 1 / size) ** power
    weight[frequency < cutoff / size] = 0
    values = np.fft.ifft2(spectrum * weight).real
    return np.clip((values - values.mean()) / (values.std() * 4) + 0.5, 0, 1)


coarse, fine = field(1.7, 3), field(1.15, 14)
pores = np.maximum(0, 0.35 - fine) ** 1.5
height = coarse * 0.42 + fine * 0.17 - pores * 1.6
dy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * 0.5
dx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * 0.5
normal = np.stack((-dx * 4, -dy * 4, np.ones_like(dx)), axis=-1)
normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
albedo = np.stack((0.55 + coarse * 0.42, 0.54 + coarse * 0.39, 0.48 + coarse * 0.40), axis=-1)
albedo *= (0.94 + fine * 0.09 - pores * 0.45)[..., None]
pink = np.clip((field(1.6, 7) - 0.68) * 3, 0, 0.5)[..., None]
albedo = albedo * (1 - pink) + np.array((0.52, 0.31, 0.37)) * pink


def texture(name, pixels, non_color=False):
    image = bpy.data.images.new(name, width=size, height=size, alpha=False)
    image.colorspace_settings.name = "Non-Color" if non_color else "sRGB"
    rgba = np.concatenate((pixels, np.ones((size, size, 1))), axis=-1).astype(np.float32)
    image.pixels.foreach_set(rgba.reshape(-1))
    image.filepath_raw = str(SOURCE / (name + ".png"))
    image.file_format = "PNG"
    image.save()
    image.pack()
    return image


stone_texture = texture("reef-limestone-albedo", albedo)
stone_normal = texture("reef-limestone-normal", normal * 0.5 + 0.5, True)
for mat in (stone_mat, coral_mat):
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    for node in nodes:
        if node.type == "TEX_IMAGE":
            node.image = stone_normal
        elif node.type == "NORMAL_MAP":
            node.inputs["Strength"].default_value = 0.9 if mat == stone_mat else 0.42
    if mat == stone_mat:
        image_node = nodes.new("ShaderNodeTexImage")
        image_node.image = stone_texture
        multiply = nodes.new("ShaderNodeMix")
        multiply.data_type = "RGBA"
        multiply.blend_type = "MULTIPLY"
        multiply.inputs[0].default_value = 1
        vertex = next(n for n in nodes if n.type == "VERTEX_COLOR")
        links.new(vertex.outputs["Color"], multiply.inputs[6])
        links.new(image_node.outputs["Color"], multiply.inputs[7])
        links.new(multiply.outputs[2], nodes["Principled BSDF"].inputs["Base Color"])


class Mesh:
    def __init__(self):
        self.vertices, self.faces, self.colors, self.uvs = [], [], [], []

    def vertex(self, p, tint, uv=(0, 0)):
        self.vertices.append(tuple(p))
        self.colors.append((*tint, 1))
        self.uvs.append(uv)
        return len(self.vertices) - 1

    def face(self, *ids):
        self.faces.append(ids)

    def tube(self, points, radii, tint, sides=5, tip=None):
        rows = []
        for i, p in enumerate(points):
            p = Vector(p)
            d = (Vector(points[min(i + 1, len(points) - 1)]) - Vector(points[max(i - 1, 0)])).normalized()
            u = d.cross(Vector((0, 0, 1)))
            if u.length < 0.01:
                u = d.cross(Vector((1, 0, 0)))
            u.normalize()
            v = d.cross(u).normalized()
            t = i / (len(points) - 1)
            rows.append([self.vertex(p + radii[i] * (u * math.cos(j * math.tau / sides)
                                                    + v * math.sin(j * math.tau / sides)),
                                     mix(tint, tip or tint, t * t)) for j in range(sides)])
        for a, b in zip(rows, rows[1:]):
            for j in range(sides):
                k = (j + 1) % sides
                self.face(a[j], a[k], b[k], b[j])
        self.face(*reversed(rows[0]))
        self.face(*rows[-1])

    def object(self, name, mat, target=habitat, grass=False):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata([xyz(v) for v in self.vertices], [], self.faces)
        mesh.update()
        attr = mesh.color_attributes.new(name="Color", type="BYTE_COLOR", domain="POINT")
        for item, tint in zip(attr.data, self.colors):
            item.color = tint
        uv = mesh.uv_layers.new(name="UVMap")
        for face in mesh.polygons:
            face.use_smooth = True
            axis = max(range(3), key=lambda k: abs(face.normal[k]))
            axes = [k for k in range(3) if k != axis]
            for loop in face.loop_indices:
                index = mesh.loops[loop].vertex_index
                co = mesh.vertices[index].co
                uv.data[loop].uv = self.uvs[index] if grass else (co[axes[0]] * 1.2, co[axes[1]] * 1.2)
        mesh.materials.append(mat)
        obj = bpy.data.objects.new(name, mesh)
        target.objects.link(obj)
        return obj

    def surface(self):
        return BVHTree.FromPolygons([Vector(v) for v in self.vertices], self.faces)

    def contain(self, center, radius):
        # Decorative growth uses the same clearance envelopes as the fish.
        c = Vector(center)
        for i, v in enumerate(self.vertices):
            if v[1] < 1.3:
                continue
            d = Vector(v) - c
            if d.length > radius - 0.18:
                self.vertices[i] = tuple(c + d.normalized() * (radius - 0.18))


def rock(mesh, center, scale, seed, rings=21, sides=36, living=True):
    rows = []
    for i in range(rings + 1):
        a = math.pi * i / rings
        row = []
        for j in range(sides):
            b = j * math.tau / sides
            q = Vector((math.sin(a) * math.cos(b), math.cos(a), math.sin(a) * math.sin(b)))
            n = noise.noise_vector(q * 2.7 + Vector((seed, 0.7 * seed, 0)))
            fine = noise.noise_vector(q * 10 + Vector((0, seed, seed)))
            # Broken, sloping limestone strata and deep irregular erosion seams.
            layer = 0.045 * math.sin(q.y * 26 + q.x * 4 + seed)
            notch = 0.13 * max(0, math.sin(b * 3 + seed) * math.cos(a * 5)) ** 3
            radial = 0.87 + 0.22 * n.x + 0.065 * fine.x + layer - notch
            p = (center[0] + scale[0] * (q.x * radial + 0.10 * q.y),
                 center[1] + scale[1] * q.y * radial,
                 center[2] + scale[2] * (q.z * radial - 0.10 * q.y))
            tint = mix(color("686950"), color("c3b796"), (n.y + 1) * 0.49)
            if living:
                tint = mix(tint, color("835267"), max(0, fine.z - 0.12) * 0.7)
                tint = mix(tint, color("636d3e"), max(0, q.y) * 0.27)
            tint = mix(color("394538"), tint, 0.62 + max(0, q.y) * 0.38)
            row.append(mesh.vertex(p, tint))
        rows.append(row)
    for i in range(rings):
        for j in range(sides):
            k = (j + 1) % sides
            mesh.face(rows[i][j], rows[i][k], rows[i + 1][k], rows[i + 1][j])


def fork(mesh, origin, direction, length, radius, depth, tint):
    d = Vector(direction).normalized()
    bend = Vector((random.uniform(-0.25, 0.25), 0.05, random.uniform(-0.25, 0.25)))
    points = [Vector(origin) + (d * t + bend * t * t) * length for t in (0, 0.5, 1)]
    mesh.tube(points, [radius, radius * 0.72, radius * 0.35], tint, 5,
              mix(tint, color("d4c7ab"), 0.33 if depth else 0.70))
    if depth:
        for j in range(2):
            a = random.random() * math.tau
            direction = d * 0.60 + Vector((math.cos(a) * 0.76, 0.7, math.sin(a) * 0.76))
            fork(mesh, points[-1] if j else points[1], direction,
                 length * random.uniform(0.56, 0.76), radius * 0.60, depth - 1, tint)


def acropora(mesh, origin, size, tint):
    for i in range(9):
        a = i * 2.39996
        r = math.sqrt(i / 9) * size * 0.48
        p = Vector(origin) + Vector((math.cos(a) * r, -0.07, math.sin(a) * r))
        fork(mesh, p, (math.cos(a) * 0.30, 1, math.sin(a) * 0.30),
             size * random.uniform(0.42, 0.78), size * 0.073, 2, tint)


def plate(mesh, origin, size, tint, seed):
    # A substantial plate, with a thin curved rim and a shaded underside.
    rows = []
    for i in range(6):
        t = i / 5
        row = []
        for j in range(32):
            a = j * math.tau / 32
            r = size * t * (1 + 0.13 * math.sin(a * 5 + seed) + 0.045 * math.sin(a * 11))
            y = size * (0.18 * t * t + (0.10 * math.sin(a * 4 + seed) + 0.04 * math.sin(a * 9)) * t)
            y += 0.025 * math.sin(t * 42 + a * 2) * t
            c = mix(tint, color("c7b99c"), max(0, (t - 0.89) / 0.11) * 0.5)
            row.append(mesh.vertex((origin[0] + math.cos(a) * r, origin[1] + y,
                                    origin[2] + math.sin(a) * r * 0.84), c))
        rows.append(row)
    for a, b in zip(rows, rows[1:]):
        for j in range(32):
            k = (j + 1) % 32
            mesh.face(a[j], b[j], b[k], a[k])
    center = mesh.vertex((origin[0], origin[1] - size * 0.10, origin[2]), mix(tint, color("34352a"), 0.45))
    inner = []
    for index in rows[-1]:
        p = Vector(mesh.vertices[index]) - Vector((0, size * 0.035, 0))
        inner.append(mesh.vertex(p, mix(tint, color("34352a"), 0.3)))
    for j in range(32):
        k = (j + 1) % 32
        mesh.face(rows[-1][j], inner[j], inner[k], rows[-1][k])
        mesh.face(center, inner[k], inner[j])


def sponge(mesh, origin, height, radius, tint):
    rows = []
    for i in range(7):
        t = i / 6
        r = radius * (0.66 + 0.34 * t + 0.07 * math.sin(t * 13))
        rows.append([mesh.vertex((origin[0] + math.cos(j * math.tau / 14) * r + t * t * height * 0.12,
                                 origin[1] + height * t, origin[2] + math.sin(j * math.tau / 14) * r),
                                mix(tint, color("c8ac74"), t * 0.20)) for j in range(14)])
    for a, b in zip(rows, rows[1:]):
        for j in range(14):
            k = (j + 1) % 14
            mesh.face(a[j], a[k], b[k], b[j])
    inner, bottom = [], []
    for j in range(14):
        a = j * math.tau / 14
        inner.append(mesh.vertex((origin[0] + math.cos(a) * radius * 0.76 + height * 0.12,
                                  origin[1] + height - 0.025, origin[2] + math.sin(a) * radius * 0.76),
                                 mix(tint, color("d3b78c"), 0.35)))
        bottom.append(mesh.vertex((origin[0] + math.cos(a) * radius * 0.48 + height * 0.08,
                                   origin[1] + height * 0.50, origin[2] + math.sin(a) * radius * 0.48),
                                  color("2e2928")))
    for j in range(14):
        k = (j + 1) % 14
        mesh.face(rows[-1][j], rows[-1][k], inner[k], inner[j])
        mesh.face(inner[j], inner[k], bottom[k], bottom[j])
    mesh.face(*bottom)


def sea_fan(mesh, origin, height, angle, tint):
    # A flattened, branching gorgonian with connected secondary twigs.
    right = Vector((math.cos(angle), 0, math.sin(angle)))
    base = Vector(origin)
    trunk = base + Vector((0, height * 0.30, 0))
    mesh.tube([base, trunk], [height * 0.03, height * 0.02], tint, 6)
    tips = []
    for i in range(13):
        a = -1.20 + i * 2.4 / 12
        reach = height * (0.84 + random.random() * 0.12)
        end = trunk + right * (math.sin(a) * reach * 0.76) + Vector((0, math.cos(a) * reach, 0))
        mid = trunk.lerp(end, 0.53) + right * (0.04 * math.sin(i * 3))
        mesh.tube([trunk, mid, end], [height * 0.018, height * 0.011, height * 0.0035], tint, 5)
        tips.append(end)
        for side in (-1, 1):
            start = trunk.lerp(end, 0.58)
            twig = start.lerp(end, 0.7) + right * (side * height * 0.10)
            mesh.tube([start, twig], [height * 0.008, height * 0.0028], tint, 4)
    for i in range(1, len(tips)):
        for t in (0.55, 0.76):
            mesh.tube([trunk.lerp(tips[i - 1], t), trunk.lerp(tips[i], t + 0.03)],
                      [height * 0.004] * 2, tint, 4)


REEFS = [((-8, 2.3, -3), 5.1), ((9, 1.4, -5), 4.4), ((2, 0.6, 8), 3.5)]
palette = ["a47955", "927c57", "b58c69", "76638a", "71885f", "a66661"]
exports = []

for index, (center, radius) in enumerate(REEFS):
    cx, cy, cz = center
    stone, coral = Mesh(), Mesh()
    # Overlapping slanted buttresses form crevices; no circular tiers.
    rock(stone, (cx - radius * 0.19, cy - radius * 0.20, cz - radius * 0.13),
         (radius * 0.75, radius * 0.57, radius * 0.55), 3.3 + index)
    for j in range(7):
        a = j * 2.39996 + index * 0.6
        r = radius * random.uniform(0.36, 0.66)
        x, z = cx + math.cos(a) * r, cz + math.sin(a) * r
        h = radius * random.uniform(0.23, 0.42)
        rock(stone, (x, ground(x, z) + h * 0.68, z),
             (radius * random.uniform(0.31, 0.49), h, radius * random.uniform(0.28, 0.46)),
             index * 13 + j + 5)
    stone.contain(center, radius)
    surface = stone.surface()
    # Living cover is attached to actual rock surfaces, including lower ledges.
    for j in range(40):
        a = j * 2.39996 + 0.31 * index
        r = math.sqrt((j + 0.5) / 40) * radius * 0.78
        x, z = cx + math.cos(a) * r, cz + math.sin(a) * r
        hit, normal, _, _ = surface.ray_cast(Vector((x, 20, z)), Vector((0, -1, 0)))
        if hit is None or hit.y < -0.35:
            continue
        p = hit - Vector((0, 0.10, 0))
        size = radius * random.uniform(0.15, 0.25)
        tint = color(palette[(j // 3 + index) % len(palette)])
        kind = j % 7
        if kind < 3:
            acropora(coral, p, size, tint)
        elif kind < 5:
            for k in range(3):
                plate(coral, p + Vector((k * size * 0.15, k * size * 0.24, 0)),
                      size * (1.1 - k * 0.19), tint, j + k)
        elif kind == 5:
            for k in range(3):
                sponge(coral, p + Vector(((k - 1) * size * 0.30, 0, (k % 2) * size * 0.26)),
                       size * random.uniform(0.65, 1.5), size * random.uniform(0.14, 0.24),
                       color(["96653e", "865673", "a38b4d"][index]))
        else:
            sea_fan(coral, p, size * 1.65, index * 0.9 + j * 0.3, color("97717e"))
    coral.contain(center, radius)
    exports.extend([stone.object(f"reef-limestone-{index + 1}", stone_mat),
                    coral.object(f"reef-living-cover-{index + 1}", coral_mat)])

# A broken reef rim frames the swimming water. Tall scenery is outside the
# swimming bounds, so it cannot introduce invisible collisions for the fish.
rim_stone, rim_coral = Mesh(), Mesh()
rim = [(-33, -8, 7, 6), (-29, -23, 9, 8), (-17, -29, 10, 9),
       (-3, -30, 8, 7), (11, -31, 10, 8), (27, -26, 9, 8), (35, -8, 8, 6),
       (-23, 23, 8, 3), (18, 26, 8, 3.3)]
for index, (x, z, width, height) in enumerate(rim):
    for j in range(4):
        px, pz = x + random.uniform(-width * 0.50, width * 0.50), z + random.uniform(-2.8, 2.8)
        h = height * random.uniform(0.60, 1.0)
        rock(rim_stone, (px, ground(px, pz) + h * 0.30, pz),
             (width * random.uniform(0.40, 0.68), h * 0.67, width * random.uniform(0.32, 0.48)),
             70 + index * 4 + j, 18, 32)
for i, p in enumerate(rim_stone.vertices):
    if abs(p[0]) < 25.0 and abs(p[2]) < 17.5:
        rim_stone.vertices[i] = (p[0], min(1.15, p[1]), p[2])
surface = rim_stone.surface()
for index, (x, z, width, height) in enumerate(rim):
    for j in range(15):
        px, pz = x + random.uniform(-width * 0.7, width * 0.7), z + random.uniform(-2.7, 2.7)
        hit, _, _, _ = surface.ray_cast(Vector((px, 25, pz)), Vector((0, -1, 0)))
        if hit is None or (abs(px) < 26 and abs(pz) < 19):
            continue
        tint = color(palette[(j + index) % len(palette)])
        if j % 3 == 0:
            sea_fan(rim_coral, hit, random.uniform(1.1, 2.1), index * 0.7, tint)
        else:
            for k in range(3):
                plate(rim_coral, hit + Vector((k * 0.16, k * 0.25, 0)),
                      random.uniform(0.75, 1.5) * (1 - k * 0.13), tint, j + k)
exports.extend([rim_stone.object("reef-distant-ridge", stone_mat),
                rim_coral.object("reef-ridge-growth", coral_mat)])

# Coral scree gathers next to the banks, leaving generous open sand channels.
rubble, broken = Mesh(), Mesh()
for i in range(260):
    center, radius = REEFS[i % 3]
    a = random.random() * math.tau
    r = radius * random.uniform(0.72, 1.85)
    x, z = center[0] + math.cos(a) * r, center[2] + math.sin(a) * r
    size = random.uniform(0.09, 0.49) * (1.35 if r < radius * 1.2 else 0.8)
    rock(rubble, (x, ground(x, z) + size * 0.22, z), (size, size * 0.6, size * 0.7),
         160 + i, 4, 7, False)
    if i % 3 == 0:
        p = Vector((x, ground(x, z) + 0.06, z))
        direction = Vector((math.cos(a), 0.07, math.sin(a)))
        end = p + direction * random.uniform(0.25, 0.75)
        tint = color("b4ad90")
        broken.tube([p, p.lerp(end, 0.5), end], [0.065, 0.051, 0.025], tint, 5)
        broken.tube([p.lerp(end, 0.35), p.lerp(end, 0.6) + Vector((0.17, 0.08, -0.12))],
                    [0.041, 0.014], tint, 5)
exports.extend([rubble.object("reef-foot-rubble", stone_mat), broken.object("coral-scree", coral_mat)])

grass = Mesh()
for i in range(47):
    center, radius = REEFS[i % 3]
    # Patches collect on the sheltered sides of rocks.
    a = random.uniform(-0.4, 2.5) + (i % 3) * 0.6
    r = radius * random.uniform(1.0, 1.65)
    x, z = center[0] + math.cos(a) * r, center[2] + math.sin(a) * r
    for j in range(random.randint(4, 9)):
        angle = random.random() * math.tau
        h, w = random.uniform(0.25, 0.95), random.uniform(0.025, 0.055)
        px, pz = x + random.uniform(-0.25, 0.25), z + random.uniform(-0.25, 0.25)
        base = Vector((px, ground(px, pz) - 0.02, pz))
        rows = []
        for k in range(5):
            t = k / 4
            p = base + Vector((math.cos(angle) * h * t * t * 0.45, h * t,
                               math.sin(angle) * h * t * t * 0.45))
            u = Vector((math.sin(angle), 0, -math.cos(angle))) * w * (1 - t * 0.95)
            tint = mix(color("3f5740"), color("8a9762"), t * 0.8)
            rows.append([grass.vertex(p - u, tint, (0, t)), grass.vertex(p + u, tint, (1, t))])
        for a, b in zip(rows, rows[1:]):
            grass.face(a[0], a[1], b[1], b[0])
exports.append(grass.object("seagrass-meadow", grass_mat, grass=True))

bpy.ops.object.select_all(action="DESELECT")
for obj in exports:
    obj.select_set(True)
bpy.context.view_layer.objects.active = exports[0]
bpy.ops.export_scene.gltf(filepath=str(OUT / "reef-habitat.glb"), export_format="GLB",
                          use_selection=True, export_yup=True, export_apply=True,
                          export_animations=False, export_cameras=False, export_lights=False,
                          export_vertex_color="MATERIAL", export_materials="EXPORT",
                          export_draco_mesh_compression_enable=True,
                          export_draco_mesh_compression_level=6,
                          export_draco_position_quantization=16,
                          export_draco_normal_quantization=12,
                          export_draco_texcoord_quantization=14,
                          export_draco_color_quantization=10)

# Editable presentation terrain, matching the browser's continuous sand bed.
sand_mat = bpy.data.materials.new("Sand | carbonate ripples")
sand_mat.use_nodes = True
nodes, links = sand_mat.node_tree.nodes, sand_mat.node_tree.links
bsdf = nodes.get("Principled BSDF")
bsdf.inputs["Base Color"].default_value = (*color("b1ae91"), 1)
bsdf.inputs["Roughness"].default_value = 0.96
tex = nodes.new("ShaderNodeTexNoise")
tex.inputs["Scale"].default_value = 55
position_node = nodes.new("ShaderNodeNewGeometry")
links.new(position_node.outputs["Position"], tex.inputs["Vector"])
bump = nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.24
bump.inputs["Distance"].default_value = 0.035
links.new(tex.outputs["Fac"], bump.inputs["Height"])
wave = nodes.new("ShaderNodeTexWave")
wave.bands_direction = "X"
links.new(position_node.outputs["Position"], wave.inputs["Vector"])
wave.inputs["Scale"].default_value = 0.39
wave.inputs["Distortion"].default_value = 3
wave.inputs["Detail Scale"].default_value = 0.13
wave_bump = nodes.new("ShaderNodeBump")
wave_bump.inputs["Strength"].default_value = 0.20
wave_bump.inputs["Distance"].default_value = 0.10
links.new(bump.outputs["Normal"], wave_bump.inputs["Normal"])
links.new(wave.outputs["Color"], wave_bump.inputs["Height"])
links.new(wave_bump.outputs["Normal"], bsdf.inputs["Normal"])
sand = Mesh()
n = 180
for j in range(n + 1):
    v = j / n * 2 - 1
    z = v * 50 + v ** 5 * 450
    for i in range(n + 1):
        u = i / n * 2 - 1
        x = u * 50 + u ** 5 * 450
        sand.vertex((x, ground(x, z), z), color("b1ae91"))
for j in range(n):
    for i in range(n):
        a = j * (n + 1) + i
        sand.face(a, a + n + 1, a + n + 2, a + 1)
sand.object("Rippled sand | browser-matched terrain", sand_mat, presentation)

# A small staged school makes scale clear in the editable Blender scene.
for school, name in enumerate(["chromis", "yellow-tang", "clownfish"]):
    source = bpy.data.objects[name]
    source_rig = source.parent
    for i in range(14):
        rig = source_rig.copy()
        rig.data = source_rig.data
        rig.name = f"{name} | reef study rig {i + 1:02}"
        presentation.objects.link(rig)
        rig.hide_set(False)
        rig.hide_render = False
        x = [-8, 7, 0][school] + random.uniform(-5, 5)
        y = [8, 6.2, 5.2][school] + random.uniform(-1.8, 2.1)
        z = [-3, -2, 8][school] + random.uniform(-4, 4)
        rig.location = xyz((x, y, z))
        rig.rotation_euler.z = [-1.1, 0.75, -0.55][school] + random.uniform(-0.3, 0.3)
        rig.scale = (1.0, 1.0, 1.0)
        fish = source.copy()
        fish.name = f"{name} | reef study {i + 1:02}"
        presentation.objects.link(fish)
        fish.parent = rig
        fish.matrix_parent_inverse = Matrix.Identity(4)
        fish.matrix_basis = Matrix.Identity(4)
        fish.hide_set(False)
        fish.hide_render = False
        for mod in fish.modifiers:
            if mod.type == "ARMATURE":
                mod.object = rig


def light(name, kind, position, target, energy, tint, size=0):
    data = bpy.data.lights.new(name, kind)
    data.energy, data.color = energy, tint
    if kind == "AREA":
        data.shape, data.size = "DISK", size
    else:
        data.angle = 0.14
    obj = bpy.data.objects.new(name, data)
    presentation.objects.link(obj)
    obj.location = xyz(position)
    obj.rotation_euler = (Vector(xyz(target)) - obj.location).to_track_quat("-Z", "Y").to_euler()


light("Sun through the water", "SUN", (-18, 40, 14), (0, 0, 0), 2.4, (0.76, 0.95, 1.0))
light("Broad surface fill", "AREA", (0, 28, 5), (0, 0, 0), 17000, (0.35, 0.74, 0.84), 35)
light("Blue water fill", "AREA", (0, 12, -30), (0, 3, 0), 6500, (0.18, 0.55, 0.7), 25)
scene.world.use_nodes = True
world_nodes = scene.world.node_tree.nodes
world_nodes["Background"].inputs["Color"].default_value = (0.025, 0.095, 0.125, 1)
world_nodes["Background"].inputs["Strength"].default_value = 0.40

# Presentation-only bounded water volume. GLB uses real-time distance fog.
bpy.ops.mesh.primitive_cube_add(size=1, location=xyz((0, 28, 0)))
water = bpy.context.object
water.name = "Water column | Blender presentation only"
for c in list(water.users_collection):
    c.objects.unlink(water)
presentation.objects.link(water)
water.scale = (1400, 1400, 120)
water.display_type = "WIRE"
water_mat = bpy.data.materials.new("Water | suspended blue-green light")
water_mat.use_nodes = True
nodes, links = water_mat.node_tree.nodes, water_mat.node_tree.links
nodes.remove(nodes.get("Principled BSDF"))
volume = nodes.new("ShaderNodeVolumePrincipled")
volume.inputs["Color"].default_value = (0.21, 0.55, 0.63, 1)
volume.inputs["Density"].default_value = 0.009
volume.inputs["Anisotropy"].default_value = 0.25
links.new(volume.outputs["Volume"], nodes.get("Material Output").inputs["Volume"])
water.data.materials.append(water_mat)

camera_data = bpy.data.cameras.new("Reef floor camera")
camera = bpy.data.objects.new("Reef floor camera", camera_data)
presentation.objects.link(camera)
camera.location = xyz((28, 17, 38))
camera.rotation_euler = (Vector(xyz((0, 6, 0))) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera_data.type, camera_data.lens = "PERSP", 32
camera_data.clip_end = 400
scene.camera = camera
reef_camera = bpy.data.objects.new("Reef channel camera", camera_data.copy())
presentation.objects.link(reef_camera)
reef_camera.location = xyz((17, 5.5, 25))
reef_camera.rotation_euler = (Vector(xyz((0, 3, -3))) - reef_camera.location).to_track_quat("-Z", "Y").to_euler()

# Distance color also covers the far sand and world, avoiding a horizon seam.
# This presentation pass approximates the browser's continuous water fog.
scene.view_layers[0].use_pass_mist = True
scene.world.mist_settings.start = 8
scene.world.mist_settings.depth = 90
scene.world.mist_settings.falloff = "QUADRATIC"
scene.use_nodes = True
nodes, links = scene.node_tree.nodes, scene.node_tree.links
nodes.clear()
layers = nodes.new("CompositorNodeRLayers")
fog = nodes.new("CompositorNodeMixRGB")
fog.inputs[2].default_value = (0.007, 0.045, 0.058, 1)
links.new(layers.outputs["Mist"], fog.inputs[0])
links.new(layers.outputs["Image"], fog.inputs[1])
output = nodes.new("CompositorNodeComposite")
links.new(fog.outputs[0], output.inputs[0])
scene.frame_set(10)
scene.render.engine = "CYCLES"
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = 1600, 1000
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = 0.6
bpy.ops.object.select_all(action="DESELECT")
exports[0].select_set(True)
bpy.context.view_layer.objects.active = exports[0]
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == "VIEW_3D":
            area.spaces.active.region_3d.view_perspective = "CAMERA"
            area.spaces.active.shading.type = "MATERIAL"
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / "aquatica-reef.blend"))
manifest = {"generator": bpy.app.version_string, "rigged": True, "habitat": "reef-floor", "habitatCompression": "draco",
            "assets": [{"file": p.name, "bytes": p.stat().st_size} for p in sorted(OUT.glob("*.glb"))]}
(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
scene.render.filepath = str(SOURCE / "reef-floor.png")
bpy.ops.render.render(write_still=True)
scene.camera = reef_camera
scene.render.filepath = str(SOURCE / "reef-floor-close.png")
bpy.ops.render.render(write_still=True)
print("AQUATICA_REEF_COMPLETE " + json.dumps(manifest))
