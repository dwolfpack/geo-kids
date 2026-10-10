#!/usr/bin/env node
/* Records a vertical (9:16) social-media clip of every Sky Rescue world.
 *
 * The game runs under manual stepping (window.__heli), so every video frame is
 * exactly 1/FPS of game time no matter how slow the machine renders — the
 * footage is perfectly smooth even on software WebGL. The autopilot flies and
 * puts out fires; the script triggers a loop-the-loop in each world.
 *
 * Needs:  python3 -m http.server 8080  (repo root), ffmpeg on PATH
 * Run:    NODE_PATH=$(npm root -g) node games/sky-rescue/tests/record-clips.js [options]
 *
 * Options (all optional):
 *   --worlds 1,4,7     which worlds to record (default: all 7)
 *   --seconds 12       length of each world clip
 *   --skip 2           game seconds to fly before recording (0 keeps the "Stage n" banner)
 *   --loops 3,8        clip times (s) to do a loop-the-loop; "none" disables
 *   --fps 30           frame rate
 *   --size 1080x1920   output resolution (rendered at half size, 2x pixel ratio)
 *   --lang he|en       game language (default: he)
 *   --clean            hide the HUD (score, goals, speed) for pure scenery shots
 *   --controls         keep the on-screen joystick and buttons (hidden by default)
 *
 * Output (games/sky-rescue/tests/clips/, git-ignored):
 *   world-{n}-{name}.mp4   one clip per world, H.264, ready for Reels/TikTok/Shorts
 *   all-worlds.mp4         every clip joined in order
 */
"use strict";
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:8080/games/sky-rescue/";
const OUT = path.join(__dirname, "clips");
const NAMES = ["greek-islands", "norway-fjords", "caribbean-storm", "himalaya-canyon", "egypt-nile", "brazil-amazon", "canada-arctic"];

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf("--" + name); return i < 0 ? def : args[i + 1]; };
const worlds = opt("worlds", "1,2,3,4,5,6,7").split(",").map(Number).filter((n) => n >= 1 && n <= 7);
const seconds = +opt("seconds", 12);
const skip = +opt("skip", 2);
const loopsArg = opt("loops", "3,8");
const loopAt = loopsArg === "none" ? [] : loopsArg.split(",").map(Number);
const fps = +opt("fps", 30);
const [outW, outH] = opt("size", "1080x1920").split("x").map(Number);
const lang = opt("lang", "he");
const clean = args.includes("--clean");
const controls = args.includes("--controls");

function encode(framesDir, file) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", path.join(framesDir, "%05d.jpg"),
    "-vf", `scale=${outW}:${outH}:flags=lanczos,format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", "18",
    "-movflags", "+faststart", file]);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const ctx = await browser.newContext({ viewport: { width: outW / 2, height: outH / 2 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE);
  await page.waitForFunction(() => window.__heli);
  await page.evaluate((lang) => { window.GE.setLang(lang); window.__heli.manual(true); }, lang);
  if (!controls) await page.addStyleTag({ content: "#stick, #btn-drop, #btn-loop, #btn-pause, #hud-hint { display: none !important; }" });

  const clips = [];
  for (const n of worlds) {
    const name = `world-${n}-${NAMES[n - 1]}`;
    const framesDir = path.join(OUT, ".frames-" + n);
    fs.rmSync(framesDir, { recursive: true, force: true });
    fs.mkdirSync(framesDir);

    await page.evaluate(({ n, skip, clean }) => {
      const h = window.__heli;
      h.start(n - 1); h.bot(true);
      if (skip > 0) h.step(skip);
      document.getElementById("hud").style.visibility = clean ? "hidden" : "";
    }, { n, skip, clean });

    const total = Math.round(seconds * fps);
    const loopFrames = new Set(loopAt.map((s) => Math.round(s * fps)));
    for (let f = 0; f < total; f++) {
      const mode = await page.evaluate(({ dt, loop }) => {
        const h = window.__heli;
        // The autopilot never loops on its own, so hand over the stick for one frame to start one.
        if (loop) { h.bot(false); h.setInput(0, 0, false); h.loop(); h.frame(dt); h.bot(true); }
        else h.frame(dt);
        return h.state.mode;
      }, { dt: 1 / fps, loop: loopFrames.has(f) });
      await page.screenshot({ type: "jpeg", quality: 92, path: path.join(framesDir, String(f).padStart(5, "0") + ".jpg") });
      if (mode !== "play") break;   // stage finished early: keep the end screen as the last frame
      if (f % fps === 0) process.stdout.write(`\r${name}: ${Math.round(f / fps)}/${seconds}s `);
    }
    const file = path.join(OUT, name + ".mp4");
    encode(framesDir, file);
    fs.rmSync(framesDir, { recursive: true, force: true });
    clips.push(file);
    console.log(`\r${name}: wrote ${path.relative(process.cwd(), file)}`);
  }
  await browser.close();

  if (clips.length > 1) {
    const list = path.join(OUT, ".concat.txt");
    fs.writeFileSync(list, clips.map((c) => `file '${c.replace(/'/g, "'\\''")}'`).join("\n"));
    const all = path.join(OUT, "all-worlds.mp4");
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", all]);
    fs.rmSync(list);
    console.log("joined:", path.relative(process.cwd(), all));
  }
  console.log(errors.length ? "PAGE ERRORS: " + JSON.stringify(errors) : "no page errors");
})().catch((e) => { console.error(e); process.exit(1); });
