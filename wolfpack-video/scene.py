"""forge3d scene setup for the Wolfpack terrain video."""
import numpy as np
import forge3d as f3d
from forge3d.terrain_params import (
    make_terrain_params_config, FogSettings, TonemapSettings, AovSettings,
)
from forge3d.terrain_demo import _builtin_ibl_path
from heightmap import build

Z_MAX = 110.0      # height of the wolf peaks (world units)
FAR = 20000.0      # far clip; depth AOV is view distance / FAR
SPAN = 2000.0      # terrain width (world units)

# Wolfpack brand ramp: deep night-violet valleys -> royal purple -> lavender -> snow
STOPS = [
    (0.00, "#0d0618"), (0.10, "#1f0d3a"), (0.25, "#3b1868"),
    (0.50, "#6a2fb0"), (0.72, "#a97fe6"), (0.88, "#e3d4ff"), (1.00, "#ffffff"),
]


class WolfScene:
    def __init__(self):
        hm, self.mask = build()
        self.heights = np.ascontiguousarray(np.flipud(hm) * Z_MAX).astype(np.float32)  # flip so top-down matches the logo
        self.sess = f3d.Session(window=False)
        self.renderer = f3d.TerrainRenderer(self.sess)
        self.materials = f3d.MaterialSet.terrain_default(
            triplanar_scale=6.0, normal_strength=1.2, blend_sharpness=4.0)
        self.ibl = f3d.IBL.from_hdr(str(_builtin_ibl_path("clearsky", prefer_local_assets=False)), intensity=1.0)
        cmap = f3d.Colormap1D.from_stops(stops=[(s * Z_MAX, c) for s, c in STOPS], domain=(0.0, Z_MAX))
        self.overlays = [f3d.OverlayLayer.from_colormap1d(
            cmap, strength=1.0, offset=0.0, blend_mode="Alpha", domain=(0.0, Z_MAX))]

    def render(self, *, phi, theta, radius, sun_az, sun_el, size=(1280, 720), fov=40.0,
               target=(0.0, 0.0, 0.0), sun_intensity=3.2, fog_density=0.0, exposure=1.0, heights=None):
        cfg = make_terrain_params_config(
            size_px=size, render_scale=1.0, terrain_span=SPAN, msaa_samples=1, z_scale=1.0,
            exposure=exposure, domain=(0.0, Z_MAX), albedo_mode="colormap", colormap_strength=1.0,
            overlays=self.overlays, light_azimuth_deg=sun_az, light_elevation_deg=sun_el,
            sun_intensity=sun_intensity, sun_color=(1.0, 0.86, 0.78), ibl_intensity=0.8,
            cam_radius=radius, cam_phi_deg=phi, cam_theta_deg=theta, cam_target=target, fov_y_deg=fov,
            camera_mode="mesh:zup", clip=(1.0, FAR),
            aov=AovSettings(enabled=True, albedo=False, normal=False, depth=True),
            fog=FogSettings(density=fog_density, height_falloff=0.02, base_height=0.0,
                            inscatter=(0.42, 0.30, 0.62)) if fog_density > 0 else None,
            
            tonemap=TonemapSettings(operator="aces") if hasattr(TonemapSettings, "operator") else None,
        )
        params = f3d.TerrainRenderParams(cfg)
        frame, aov = self.renderer.render_with_aov(
            material_set=self.materials, env_maps=self.ibl, params=params,
            heightmap=heights if heights is not None else self.heights)
        return frame.to_numpy(), aov.depth() * FAR   # rgba, view distance (0 = sky)
