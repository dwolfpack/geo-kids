"""WOLFPACK — 15 second terrain brand film rendered with forge3d.

The wolf from the logo is raised into a mountain massif. The camera skims in at
dawn, orbits while the sun sweeps shadows across the ridges, then climbs to a
top-down view where the mountain range reads as the logo, and the title lands.

    python make_video.py --preview   # low-res contact sheet of the camera path
    python make_video.py             # full 1920x1080 @ 30 fps -> wolfpack.mp4
"""
import argparse
import math
import os
import sys
import time

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from scene import WolfScene

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30
DURATION = 15.0

# Camera / sun keyframes: t, phi, theta, radius, tx, ty, tz, sun_az, sun_el
KEYS = np.array([
    [0.0, 150, 84.0, 1150, 0, -260, 10, 115, 2.0],   # skimming the foothills at first light
    [2.5, 180, 80.0, 820, 0, -120, 25, 125, 5.0],
    [5.0, 215, 72.0, 640, 0, -20, 40, 140, 10.0],    # the wolf massif fills the frame
    [7.5, 260, 60.0, 700, 0, 0, 35, 170, 22.0],      # orbit, sun sweeps the ridges
    [10.0, 305, 42.0, 820, 0, 0, 25, 200, 34.0],
    [12.0, 282, 8.0, 1200, -25, -120, 0, 215, 42.0],      # rise to top-down: the logo appears
    [15.0, 270, 0.2, 1450, -30, -200, 0, 225, 45.0],      # hold, gentle pull-back under title
], dtype=np.float64)


def catmull_rom(keys, t):
    ts = keys[:, 0]
    i = int(np.clip(np.searchsorted(ts, t) - 1, 0, len(ts) - 2))
    p0, p1, p2, p3 = (keys[max(i - 1, 0), 1:], keys[i, 1:], keys[i + 1, 1:], keys[min(i + 2, len(ts) - 1), 1:])
    u = (t - ts[i]) / (ts[i + 1] - ts[i])
    u = np.clip(u, 0, 1)
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u ** 2
                  + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3)


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


# --------------------------------------------------------------------------- post

class Post:
    def __init__(self, w, h):
        self.w, self.h = w, h
        yy = np.linspace(0, 1, h)[:, None]
        xx = np.linspace(-1, 1, w)[None, :]
        # dusk sky: deep violet zenith -> magenta band -> warm horizon glow
        stops = [(0.0, (8, 3, 22)), (0.35, (34, 12, 70)), (0.62, (98, 38, 128)),
                 (0.80, (196, 92, 138)), (1.0, (255, 170, 120))]
        sky = np.zeros((h, 1, 3))
        for (a, ca), (b, cb) in zip(stops, stops[1:]):
            m = (yy >= a) & (yy <= b)
            k = ((yy - a) / (b - a))[..., None]
            sky = np.where(m[..., None], np.array(ca) * (1 - k) + np.array(cb) * k, sky)
        self.sky_day = np.broadcast_to(sky, (h, w, 3)).astype(np.float32)
        rng = np.random.default_rng(1)
        stars = np.zeros((h, w), np.float32)
        n = int(w * h / 2500)
        sy, sx = rng.integers(0, int(h * 0.6), n), rng.integers(0, w, n)
        stars[sy, sx] = rng.uniform(0.3, 1.0, n)
        self.stars = np.asarray(Image.fromarray((stars * 255).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(0.7)), np.float32)[..., None] * 3.0
        r = np.sqrt(xx ** 2 * 0.8 + ((yy - 0.5) * 2) ** 2)
        self.vignette = (1 - 0.55 * np.clip(r - 0.35, 0, 1) ** 1.6)[..., None].astype(np.float32)
        self.rng = np.random.default_rng(7)

    def __call__(self, rendered, t):
        rgba, dist = rendered
        img = rgba[..., :3].astype(np.float32)
        bg = dist <= 0
        # soften the sky/terrain seam a touch
        bgm = np.asarray(Image.fromarray((bg * 255).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(1.2)), np.float32)[..., None] / 255
        haze = np.asarray(Image.fromarray((bg * 255).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(self.h / 40)), np.float32)[..., None] / 255
        dawn = ease(t / 9.0)
        sky = self.sky_day * (0.55 + 0.45 * dawn) + self.stars * (1 - dawn)
        img = img * (1 - bgm) + np.clip(sky, 0, 255) * bgm
        img += (1 - bgm) * haze * np.array([150, 70, 110]) * 0.6   # glow where land meets sky
        # aerial perspective: distant terrain melts into the dusk haze
        far = np.clip((dist[..., None] - 1100.0) / 1300.0, 0, 1) ** 1.2 * (1 - bgm)
        img = img * (1 - far * 0.85) + np.array([120, 55, 125]) * far * 0.85
        # grade: lift shadows into violet, gentle S-curve
        x = img / 255
        x = x + np.array([0.035, 0.0, 0.07]) * (1 - x) ** 3
        x = np.clip(x, 0, 1)
        x = x * x * (3 - 2 * x) * 0.35 + x * 0.65
        img = x * 255
        # bloom on highlights (snowy crests, horizon glow)
        lum = img.mean(-1, keepdims=True)
        hi = np.clip((lum - 170) / 85, 0, 1) * img
        small = Image.fromarray(hi.astype(np.uint8)).resize((self.w // 4, self.h // 4), Image.BILINEAR)
        glow = np.asarray(small.filter(ImageFilter.GaussianBlur(6)).resize((self.w, self.h), Image.BILINEAR),
                          np.float32)
        img = img + glow * 0.55
        img = img * self.vignette
        img += self.rng.normal(0, 3.0, img.shape[:2])[..., None]
        return np.clip(img, 0, 255)


class Title:
    """WOLFPACK / RUN TOGETHER lock-up that lands over the top-down reveal."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        s = h / 1080
        self.big = ImageFont.truetype(os.path.join(HERE, "fonts/Montserrat-ExtraBold.ttf"), int(150 * s))
        self.small = ImageFont.truetype(os.path.join(HERE, "fonts/Montserrat-SemiBold.ttf"), int(46 * s))
        self.s = s

    def _draw_tracked(self, draw, text, font, cy, tracking, fill, reveal):
        widths = [draw.textlength(ch, font=font) for ch in text]
        total = sum(widths) + tracking * (len(text) - 1)
        x = (self.w - total) / 2
        for i, (ch, cw) in enumerate(zip(text, widths)):
            k = ease_out(reveal * len(text) * 0.6 - i * 0.6 + 0.6)   # letters cascade in
            if k > 0:
                a = int(fill[3] * k)
                draw.text((x, cy + (1 - k) * 40 * self.s), ch, font=font, fill=fill[:3] + (a,), anchor="lm")
            x += cw + tracking

    def __call__(self, img, t):
        t0 = 11.6
        if t < t0:
            return img
        p = (t - t0) / (DURATION - t0)
        h, w = self.h, self.w
        # darken the lower band so the lock-up reads over the terrain
        band = np.linspace(0, 1, h)[:, None, None]
        shade = np.clip((band - 0.45) / 0.4, 0, 1) ** 1.5 * 0.75 * ease(p * 3)
        img = img * (1 - shade) + np.array([12, 4, 26]) * shade
        layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        big_track = (60 - 42 * ease_out(p * 1.6)) * self.s
        self._draw_tracked(d, "WOLFPACK", self.big, h * 0.78, big_track, (255, 255, 255, 255), ease(p * 1.8))
        small_track = (40 - 18 * ease_out((p - 0.3) * 2)) * self.s
        self._draw_tracked(d, "RUN TOGETHER", self.small, h * 0.885, small_track, (214, 188, 255, 255),
                           ease((p - 0.3) * 2.2))
        arr = np.asarray(layer, np.float32)
        # light sweep across the letters
        sweep_x = (p - 0.45) / 0.35 * (w * 1.4) - w * 0.2
        xs = np.arange(w)[None, :]
        sheen = np.exp(-((xs - sweep_x - (np.arange(h)[:, None] - h * 0.8) * 0.4) / (40 * self.s)) ** 2)
        a = arr[..., 3:4] / 255
        col = arr[..., :3] + sheen[..., None] * 120 * (0 < p - 0.45 < 0.4)
        glow = np.asarray(Image.fromarray(arr.astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(18 * self.s)), np.float32)
        img = img + glow[..., :3] * (glow[..., 3:4] / 255) * 0.45 * np.array([0.8, 0.55, 1.0])
        img = img * (1 - a) + np.clip(col, 0, 255) * a
        return np.clip(img, 0, 255)


def frame_params(t):
    phi, theta, radius, tx, ty, tz, saz, sel = catmull_rom(KEYS, t)
    return dict(phi=float(phi), theta=float(max(theta, 0.2)), radius=float(radius),
                target=(float(tx), float(ty), float(tz)), sun_az=float(saz), sun_el=float(sel),
                fog_density=0.0025 * (1 - ease(t / 11)) + 0.0004)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--width", type=int, default=1920)
    ap.add_argument("--height", type=int, default=1080)
    ap.add_argument("--out", default=os.path.join(HERE, "wolfpack.mp4"))
    args = ap.parse_args()

    scene = WolfScene()
    if args.preview:
        w, h = 480, 270
        post, title = Post(w, h), Title(w, h)
        times = np.linspace(0, DURATION - 1 / FPS, 16)
        sheet = Image.new("RGB", (w * 4, h * 4))
        for i, t in enumerate(times):
            rgba = scene.render(size=(w, h), **frame_params(t))
            img = title(post(rgba, t), t)
            im = Image.fromarray(img.astype(np.uint8))
            ImageDraw.Draw(im).text((6, 4), f"{t:.1f}s", fill=(255, 255, 0))
            sheet.paste(im, ((i % 4) * w, (i // 4) * h))
            print(f"preview {i + 1}/16", flush=True)
        sheet.save(os.path.join(HERE, "preview_sheet.png"))
        return

    import imageio.v2 as imageio
    w, h = args.width, args.height
    post, title = Post(w, h), Title(w, h)
    n = int(DURATION * FPS)
    writer = imageio.get_writer(args.out, fps=FPS, codec="libx264", quality=None,
                                ffmpeg_params=["-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                               "-movflags", "+faststart"])
    start = time.time()
    for i in range(n):
        t = i / FPS
        rgba = scene.render(size=(w, h), **frame_params(t))
        img = title(post(rgba, t), t)
        img *= ease(t / 0.6) * (1 - 0.0 * ease((t - 14.6) / 0.4))   # fade in from black
        frame = img.astype(np.uint8)
        writer.append_data(frame)
        if i in (0, int(4 * FPS), int(9 * FPS), n - 1):
            Image.fromarray(frame).save(os.path.join(HERE, f"still_{t:04.1f}s.png"))
        el = time.time() - start
        print(f"frame {i + 1}/{n}  t={t:5.2f}s  eta {el / (i + 1) * (n - i - 1) / 60:5.1f} min", flush=True)
    writer.close()
    print("wrote", args.out)


if __name__ == "__main__":
    sys.exit(main())
