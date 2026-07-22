// Synthesized "correct answer" chime via Web Audio API — no audio asset
// files, so no licensing/attribution concerns. Mute state persists per
// browser in localStorage (not per-profile: sound preference is a device
// setting, not a player stat).
(function () {
  const SOUND_KEY = "geo-sound-muted";
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    }
    // Mobile browsers (notably iOS Safari) create AudioContext in a
    // "suspended" state and require an explicit resume() from within a
    // user-gesture handler before any sound will actually play.
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  window.isSoundOn = function isSoundOn() {
    return localStorage.getItem(SOUND_KEY) !== "1";
  };

  window.toggleSound = function toggleSound() {
    const muted = localStorage.getItem(SOUND_KEY) === "1";
    localStorage.setItem(SOUND_KEY, muted ? "0" : "1");
    return window.isSoundOn();
  };

  window.playChime = function playChime() {
    if (!window.isSoundOn()) return;
    const audioCtx = getCtx();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    [523.25, 659.25].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.09);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.3);
    });
  };
})();
