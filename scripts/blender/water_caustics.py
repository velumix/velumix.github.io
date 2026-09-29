"""Photon-density texture for the shared Aquatica ripple spectrum.

This is an authoring counterpart to the browser's refracted-triangle pass.
Run in Blender to write the packed-project texture without rendering a scene.
"""

import json
import math
from pathlib import Path

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SPECTRUM = json.loads((ROOT / "src/lab/water-spectrum.json").read_text())
AIR_SUN = np.array((-26.0, 48.0, 18.0), dtype=np.float32)
AIR_SUN /= np.linalg.norm(AIR_SUN)
WATER_SUN = np.array((AIR_SUN[0] / 1.333,
                      math.sqrt(1 - (AIR_SUN[0] ** 2 + AIR_SUN[2] ** 2) / 1.333 ** 2),
                      AIR_SUN[2] / 1.333), dtype=np.float32)


def make_caustic_image(time=10 / 30):
    tile = SPECTRUM["tile"]
    resolution = SPECTRUM["resolution"]
    photons = resolution * 2
    depth = SPECTRUM["waterTop"] + 1
    axis = (np.arange(photons, dtype=np.float32) + .5) / photons * tile - tile / 2
    px, pz = np.meshgrid(axis, axis)
    height = np.zeros_like(px)
    dx, dz = np.zeros_like(px), np.zeros_like(px)
    for wave in SPECTRUM["waves"]:
        kx, kz = np.array(wave["cycles"], dtype=np.float32) * math.tau / tile
        angle = px * kx + pz * kz + time * wave["speed"] + wave["phase"]
        height += wave["amplitude"] * np.sin(angle)
        slope = wave["amplitude"] * np.cos(angle)
        dx += kx * slope
        dz += kz * slope
    normal = np.stack((-dx, np.ones_like(dx), -dz), axis=-1)
    normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
    incident, eta = -AIR_SUN, 1 / 1.333
    dot = (normal * incident).sum(axis=-1)
    factor = eta * dot + np.sqrt(1 - eta * eta * (1 - dot * dot))
    ray = incident * eta - normal * factor[..., None]
    qx = px - ray[..., 0] / ray[..., 1] * (depth + height) + WATER_SUN[0] / WATER_SUN[1] * depth
    qz = pz - ray[..., 2] / ray[..., 1] * (depth + height) + WATER_SUN[2] / WATER_SUN[1] * depth
    ix = np.floor((qx / tile + .5) * resolution).astype(np.int32) % resolution
    iz = np.floor((qz / tile + .5) * resolution).astype(np.int32) % resolution
    density = np.bincount((iz * resolution + ix).reshape(-1), minlength=resolution ** 2)
    density = density.reshape(resolution, resolution).astype(np.float32) / (photons / resolution) ** 2

    # Match the browser's finite, separable Gaussian footprint. Filtering before
    # contrast compression keeps concentrated light soft without broad ribbons.
    sigma = SPECTRUM["blurRadius"]
    weights = np.exp(-.5 * (np.arange(-4, 5) / sigma) ** 2)
    weights /= weights.sum()
    for axis in (0, 1):
        density = sum(weight * np.roll(density, offset, axis=axis)
                      for offset, weight in zip(range(-4, 5), weights))
    delta = np.maximum(0, density - 1)
    light = np.where(density < 1, .5 + density * .5, 1 + delta / (1 + delta * .8))
    # A transmission gobo can only remove light. Divide by the bounded peak;
    # the Blender sun compensates, preserving the browser's restrained contrast.
    intensity = np.clip((1 + (light - 1) * .9) / 2.125, 0, 1).astype(np.float32)
    image = bpy.data.images.new("Water light | 24-direction ripple spectrum", width=resolution, height=resolution, alpha=False)
    image.colorspace_settings.name = "Non-Color"
    image.pixels.foreach_set(np.stack((intensity, intensity, intensity, np.ones_like(intensity)), axis=-1).reshape(-1))
    image.filepath_raw = str(ROOT / "art/aquatica/reef-caustics.png")
    image.file_format = "PNG"
    image.save()
    image.pack()
    return image


if __name__ == "__main__":
    make_caustic_image()
    print("AQUATICA_RIPPLE_TEXTURE_COMPLETE")
