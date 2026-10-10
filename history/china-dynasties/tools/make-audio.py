"""Synthesizes the soundtrack from the page's cue list: python3 make-audio.py cues.json out.wav
Same instruments as the in-page WebAudio version (plucked pentatonic notes, gongs, a drum)
plus a soft drone, so the video and the page sound alike."""
import json, sys, wave
import numpy as np

SR, DUR = 44100, 30.0
cues = json.load(open(sys.argv[1]))
n = int(SR * DUR)
mix = np.zeros(n)
t_all = np.arange(n) / SR

def add(start, sig):
    i = int(start * SR)
    end = min(n, i + len(sig))
    if end > i:
        mix[i:end] += sig[: end - i]

def pluck(f, soft=False):
    t = np.arange(int(SR * 1.4)) / SR
    s = np.zeros_like(t)
    for k in range(1, 4):
        s += np.sin(2 * np.pi * f * k * t) * np.exp(-t * 4.5 * k) / k
    s *= 1 - np.exp(-t * 900)  # soft attack
    return s * (0.10 if soft else 0.20)

def gong():
    t = np.arange(int(SR * 3.6)) / SR
    s = np.zeros_like(t)
    for j, m in enumerate([1, 1.48, 2.03, 2.74, 3.6]):
        s += np.sin(2 * np.pi * 98 * m * t + j) * np.exp(-t * (1.1 + 0.5 * j)) / (j + 1)
    s *= (1 - np.exp(-t * 60)) * (1 + 0.15 * np.sin(2 * np.pi * 5 * t))
    return s * 0.28

def drum():
    t = np.arange(int(SR * 0.6)) / SR
    f = 50 + 90 * np.exp(-t * 9)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) * 0.5

for c in cues:
    if c["k"] == "pluck": add(c["t"], pluck(c["f"], c.get("soft", False)))
    elif c["k"] == "gong": add(c["t"], gong())
    elif c["k"] == "drum": add(c["t"], drum())

# drone on D and A, swelling in and out
env = np.clip(t_all / 2.5, 0, 1) * np.clip((DUR - t_all) / 1.5, 0, 1)
drone = (np.sin(2 * np.pi * 73.42 * t_all) + 0.6 * np.sin(2 * np.pi * 110.0 * t_all + 0.5 * np.sin(2 * np.pi * 0.2 * t_all)))
mix += drone * env * 0.05

# simple echo for space
d = int(SR * 0.23)
mix[d:] += mix[:-d] * 0.28
mix /= max(1e-9, np.abs(mix).max()) / 0.85
pcm = (mix * 32767).astype("<i2")
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
