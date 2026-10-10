"""Original soundtrack + in-key SFX for the geo-kids brag video. C major, 120 BPM."""
import numpy as np, wave

SR = 48000
DUR = 22.7
N = int(SR * DUR)
rng = np.random.default_rng(3)
BEAT = 0.5

def hz(note):
    names = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    n, o = note[:-1], int(note[-1])
    semi = names[n[0]] + (1 if "#" in n else 0) + 12 * (o + 1)
    return 440 * 2 ** ((semi - 69) / 12)

def buf(): return np.zeros(N)
def place(dst, x, t, g=1.0):
    i = int(t * SR)
    if i >= N: return
    x = x[: N - i]
    dst[i:i + len(x)] += x * g

def spectral(x, lo=None, hi=None):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo: m *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi: m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))

# ---------- voices ----------
def marimba(f, dur=0.9, tau=0.28):
    t = np.arange(int(SR * dur)) / SR
    env = np.exp(-t / tau) * np.minimum(1, t / 0.002)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.04) + 0.08 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t / 0.01)
    return x * env

def bell(f, dur=1.8, tau=0.7):
    t = np.arange(int(SR * dur)) / SR
    env = np.exp(-t / tau) * np.minimum(1, t / 0.003)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.3) + 0.15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.12)) * env

def chime_app(t0, dst, g=1.0):
    # the app's own "correct" chime: C5 + E5 sines, 90ms apart (js/sound.js)
    for i, f in enumerate([523.25, 659.25]):
        t = np.arange(int(SR * 0.32)) / SR
        env = np.where(t < 0.02, t / 0.02 * 0.15, 0.15 * np.exp(-(t - 0.02) / 0.05))
        place(dst, np.sin(2 * np.pi * f * t) * env / 0.15, t0 + i * 0.09, g)

def pad(freqs, dur, att=0.6, rel=0.8):
    t = np.arange(int(SR * dur)) / SR
    x = np.zeros_like(t)
    for f in freqs:
        for det in (-0.12, 0.12):
            ff = f * 2 ** (det / 12)
            for h in range(1, 6):
                x += np.sin(2 * np.pi * ff * h * t + rng.random() * 6) / h ** 1.6
    env = np.minimum(1, t / att) * np.minimum(1, (dur - t) / rel)
    return spectral(x * env, hi=2400) / (len(freqs) * 6)

def bass(f, dur=0.45):
    t = np.arange(int(SR * dur)) / SR
    env = np.exp(-t / 0.2) * np.minimum(1, t / 0.004)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * env

def kick():
    t = np.arange(int(SR * 0.35)) / SR
    f = 45 + 85 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.14)

def noise_hit(dur, tau, lo, hi):
    n = rng.standard_normal(int(SR * dur))
    t = np.arange(len(n)) / SR
    return spectral(n, lo, hi) * np.exp(-t / tau) * np.minimum(1, t / 0.001)

def clap():
    x = noise_hit(0.25, 0.07, 900, 5000)
    return x / np.abs(x).max()

def shaker():
    x = noise_hit(0.08, 0.018, 5000, 12000)
    return x / np.abs(x).max()

# ---------- music ----------
music = buf(); drums = buf(); sfx = buf()
CH = {"C": ["C3", "E4", "G4", "C5"], "Am": ["A2", "C4", "E4", "A4"], "F": ["F2", "A3", "C4", "F4"], "G": ["G2", "B3", "D4", "G4"]}
bars = ["C", "Am", "F", "G", "C", "Am", "F", "G", "C", "F", "C", "C"]  # 2s bars
ARP = {"C": ["C5", "G5", "E5", "G5"], "Am": ["A4", "E5", "C5", "E5"], "F": ["F4", "C5", "A4", "C5"], "G": ["G4", "D5", "B4", "D5"]}
for b, ch in enumerate(bars):
    t0 = b * 2.0
    if t0 >= DUR: break
    tones = CH[ch]
    last = t0 >= 20.0
    place(music, pad([hz(n) for n in tones[1:]], min(2.3 if not last else DUR - t0, DUR - t0), att=0.4 if b else 0.05), t0, 0.55 if t0 < 4 else 0.4)
    if t0 < 4:  # hook: sparse marimba, no drums
        for k, n in enumerate(["E5", "G5", "A5", "G5"] if b == 0 else ["C6", "A5", "G5", "E5"]):
            place(music, marimba(hz(n)), t0 + k * 0.5, 0.22)
        continue
    if last:  # outro: final chord rings out
        for k, n in enumerate(["C4", "E4", "G4", "C5", "E5", "G5"]):
            place(music, marimba(hz(n), 2.5, 0.8), t0 + k * 0.06, 0.16)
        place(music, bell(hz("C6"), 2.6, 1.0), t0 + 0.2, 0.10)
        place(music, bass(hz("C2"), 2.5) * 0 + marimba(hz("C3"), 2.5, 0.9), t0, 0.35)
        place(drums, kick(), t0, 0.8)
        continue
    # bass: root on 8ths with octave pops
    root = hz(tones[0])
    for k in range(8):
        f = root * (2 if k in (3, 7) else 1)
        place(music, bass(f), t0 + k * 0.25, 0.42 if k % 2 == 0 else 0.26)
    # marimba arp 8ths
    for k in range(8):
        place(music, marimba(hz(ARP[ch][k % 4])), t0 + k * 0.25, 0.10 + (0.03 if k % 2 == 0 else 0))
    # drums
    for k in range(4):
        place(drums, kick(), t0 + k * 0.5, 0.75 if k % 2 == 0 else 0.55)
        if k % 2 == 1: place(drums, clap(), t0 + k * 0.5, 0.16)
    for k in range(16):
        place(drums, shaker(), t0 + k * 0.125, 0.05 if k % 2 else 0.028)

# ---------- sfx (in key, same room) ----------
def tap(t, g=0.10):
    place(sfx, noise_hit(0.05, 0.006, 1500, 6000), t, g)
def swish(t, g=0.10):
    n = rng.standard_normal(int(SR * 0.14)); tt = np.arange(len(n)) / SR
    env = np.sin(np.pi * tt / tt[-1]) ** 2
    place(sfx, spectral(n, 1200, 5000) * env, t, g)

tap(1.5); chime_app(1.5, sfx, 0.34)
# riser into the reveal
n = rng.standard_normal(int(SR * 0.6)); tt = np.arange(len(n)) / SR
place(sfx, spectral(n, 800, 7000) * (tt / tt[-1]) ** 2.5, 3.4, 0.045)
tap(7.0)
for k, note in enumerate(["C5", "D5", "E5", "G5", "A5"]):
    place(sfx, marimba(hz(note)), 7.75 + k * 0.25, 0.17)
place(sfx, bell(hz("C6")), 9.25, 0.12); place(sfx, bell(hz("G6")), 9.31, 0.07)
for k in range(5): place(sfx, noise_hit(0.04, 0.005, 2500, 7000), 11.4 + k * 0.14, 0.12)
tap(12.5)
for k, note in enumerate(["C5", "E5", "G5"]): place(sfx, marimba(hz(note)), 12.55 + k * 0.05, 0.16)
for t in [15.45, 15.75, 16.6, 16.85, 17.25, 17.5]: swish(t)
swish(16.35, 0.07)
chime_app(17.05, sfx, 0.26); chime_app(17.7, sfx, 0.26)
for k, note in enumerate(["C5", "E5", "G5", "C6"]): place(sfx, marimba(hz(note), 1.2, 0.4), 18.0 + k * 0.08, 0.14)
chime_app(18.3, sfx, 0.22)
pent = ["C7", "D7", "E7", "G7", "A7"]
for k in range(10):
    place(sfx, bell(hz(pent[rng.integers(5)]), 0.8, 0.2), 18.1 + k * 0.11 + rng.random() * 0.04, 0.03)
    place(sfx, bell(hz(pent[rng.integers(5)]), 0.8, 0.2), 20.3 + k * 0.1 + rng.random() * 0.04, 0.025)
swish(20.0, 0.06)

# ---------- mix ----------
def reverb(x, wet=0.2):
    L = int(SR * 1.4); t = np.arange(L) / SR
    ir = rng.standard_normal(L) * np.exp(-t / 0.32)
    ir = spectral(ir, 200, 6000); ir /= np.sqrt((ir ** 2).sum())
    M = 1 << int(np.ceil(np.log2(len(x) + L)))
    y = np.fft.irfft(np.fft.rfft(x, M) * np.fft.rfft(ir, M), M)[: len(x)]
    return x + wet * y

mix = music + 0.5 * drums + 0.8 * sfx
mix = reverb(mix, 0.22)
# gentle master: fade in first 20ms, fade out last 0.5s, soft limit
t = np.arange(N) / SR
mix *= np.minimum(1, t / 0.02) * np.minimum(1, (DUR - t) / 0.5)
rms = np.sqrt((mix ** 2).mean())
mix *= 10 ** (-17 / 20) / rms
mix = np.tanh(mix * 1.1) / 1.1
mix *= 10 ** (-1 / 20) / max(1e-9, np.abs(mix).max()) if np.abs(mix).max() > 10 ** (-1 / 20) else 1
st = np.stack([mix, mix], 1)
# tiny stereo width: delay right channel's reverb-ish content by 7ms
d = int(SR * 0.007); st[d:, 1] = 0.85 * mix[d:] + 0.15 * mix[:-d]
pcm = (np.clip(st, -1, 1) * 32767).astype(np.int16)
with wave.open("soundtrack.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("peak", np.abs(mix).max(), "rms dB", 20 * np.log10(np.sqrt((mix ** 2).mean())))
