# WOLFPACK — 15s terrain brand film (forge3d)

The wolf from the Wolfpack logo is raised into a mountain massif and rendered with
[forge3d](https://github.com/milos-agathon/forge3d)'s PBR terrain renderer.

**Storyboard (15 s, 1920×1080, 30 fps)**

| Time | Shot |
|------|------|
| 0–4 s | Fade in from black under a starry violet sky; camera skims the foothills at first light toward the massif |
| 4–10 s | Camera orbits and climbs while the sun rises and sweeps shadows across the wolf ridges |
| 10–12 s | Camera rises to straight overhead — the mountain range reads as the logo |
| 12–15 s | `WOLFPACK` letters cascade in with a light sweep, `RUN TOGETHER` settles underneath |

## Files

- `logo.jpg` — source logo
- `heightmap.py` — turns the wolf silhouette into a heightmap (soft massif + ridged crests + surrounding ranges)
- `scene.py` — forge3d session, brand colour ramp, render call (beauty + depth AOV)
- `make_video.py` — camera/sun keyframes (Catmull-Rom), post (dusk sky, depth haze, bloom, grade, vignette, grain), title, MP4 encode
- `fonts/` — Montserrat (SIL OFL)

## Run

```bash
pip install forge3d imageio imageio-ffmpeg pillow numpy scipy
python make_video.py --preview   # 16-frame contact sheet -> preview_sheet.png (~1 min)
python make_video.py             # full render -> wolfpack.mp4
```

Needs a GPU adapter visible to wgpu. With no GPU, install Mesa's software Vulkan
driver (`apt-get install mesa-vulkan-drivers`); it renders at ~9 s/frame on 4 CPU cores
(~70 min total). On a real GPU it takes a couple of minutes.

## Tweaking

- Camera path and sun: `KEYS` in `make_video.py` (`t, phi, theta, radius, target xyz, sun azimuth, sun elevation`).
  `theta` is measured from straight down (0 = top-down).
- Colours: `STOPS` in `scene.py` (elevation ramp) and the sky stops in `Post`.
- Mountain shape/height: `heightmap.py`, `Z_MAX` in `scene.py`.
