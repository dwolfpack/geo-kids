// Renders the animation to an MP4: node tools/export-video.js <page-url> <out.mp4> <he|en> [audio.wav]
// Needs Playwright (Chromium) and ffmpeg. The page exposes window.__render(t, lang).
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs");

(async () => {
  const [url, out, lang = "he", audio] = process.argv.slice(2);
  const FPS = 30;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
  await page.goto(url + (url.includes("?") ? "&" : "?") + "export");
  await page.waitForFunction(() => window.__ready);
  const duration = await page.evaluate(() => window.__duration);
  if (process.env.CUES_OUT) fs.writeFileSync(process.env.CUES_OUT, JSON.stringify(await page.evaluate(() => window.__CUES)));

  const args = ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-"];
  if (audio) args.push("-i", audio, "-c:a", "aac", "-b:a", "160k", "-shortest");
  args.push("-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out);
  const ff = spawn("ffmpeg", args, { stdio: ["pipe", "ignore", "inherit"] });

  const frames = Math.round(duration * FPS);
  for (let i = 0; i < frames; i++) {
    const b64 = await page.evaluate(([t, l]) => {
      window.__render(t, l);
      return document.getElementById("cv").toDataURL("image/png").split(",")[1];
    }, [i / FPS, lang]);
    if (!ff.stdin.write(Buffer.from(b64, "base64"))) await new Promise(r => ff.stdin.once("drain", r));
    if (i % 90 === 0) process.stderr.write(`frame ${i}/${frames}\n`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on("close", r));
  await browser.close();
})();
