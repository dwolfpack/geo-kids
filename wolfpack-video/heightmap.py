"""Turn the Wolfpack logo into a terrain heightmap: the wolf becomes a mountain massif."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

N = 1024  # heightmap resolution


def fbm(n, octaves=6, seed=7):
    rng = np.random.default_rng(seed)
    out = np.zeros((n, n), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        res = 4 * 2 ** o
        g = rng.standard_normal((res + 1, res + 1)).astype(np.float32)
        up = np.asarray(Image.fromarray(g).resize((n, n), Image.BICUBIC))
        out += amp * up
        total += amp
        amp *= 0.5
    return out / total


def wolf_mask():
    im = np.asarray(Image.open(__file__.rsplit("/", 1)[0] + "/logo.jpg").convert("L"), np.float32)
    head = im[98:272, 142:286]  # wolf head only, text excluded
    ink = np.clip((200 - head) / 150, 0, 1)
    h, w = ink.shape
    side = max(h, w)
    canvas = np.zeros((side, side), np.float32)
    canvas[(side - h) // 2:(side - h) // 2 + h, (side - w) // 2:(side - w) // 2 + w] = ink
    # wolf occupies central ~60% of the map
    img = Image.fromarray((canvas * 255).astype(np.uint8)).resize((int(N * 0.40),) * 2, Image.LANCZOS)
    m = np.zeros((N, N), np.float32)
    o = (N - img.size[0]) // 2
    m[o:o + img.size[1], o:o + img.size[0]] = np.asarray(img, np.float32) / 255
    return m


def ridged(n, seed):
    return 1.0 - np.abs(fbm(n, seed=seed))


def build():
    m = wolf_mask()
    inside = ndi.binary_dilation(m > 0.5, iterations=3)
    # soft massif: blurred silhouette gives sloped flanks instead of cliffs
    soft = ndi.gaussian_filter(inside.astype(np.float32), 7.0)
    soft /= soft.max()
    dist = ndi.distance_transform_edt(inside).astype(np.float32)
    crest = ndi.gaussian_filter(dist / (dist.max() + 1e-6), 4.0)
    wolf = 0.7 * soft ** 1.3 + 0.3 * crest
    wolf *= 0.85 + 0.3 * ridged(N, 3) ** 2          # craggy ridges on the massif
    # surrounding ranges fading out toward the edges
    yy, xx = np.mgrid[-1:1:N * 1j, -1:1:N * 1j]
    r = np.sqrt(xx ** 2 + yy ** 2)
    hills = ridged(N, 11) ** 3 * 0.32 * np.clip(1.25 - r, 0.1, 1)
    hm = np.maximum(wolf, hills) + 0.03 * fbm(N, seed=5)
    hm = ndi.gaussian_filter(hm, 1.0)
    hm = (hm - hm.min()) / (hm.max() - hm.min())
    return hm.astype(np.float32), m


if __name__ == "__main__":
    hm, _ = build()
    Image.fromarray((hm * 255).astype(np.uint8)).save("heightmap_preview.png")
    print(hm.shape, hm.min(), hm.max())
