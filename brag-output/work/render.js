// Usage: node render.js stills 0.5,1.6,...   |   node render.js video
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.resolve(__dirname, "../..");
const WORK = __dirname;
const FFMPEG = process.env.FFMPEG;
const PORT = 8765;
const FPS = 30;
const VERT = process.argv.includes("vertical");
const VW = VERT ? 1080 : 1920, VH = VERT ? 1920 : 1080;
const SUF = VERT ? "-vertical" : "";

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".woff": "font/woff", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" });
    res.end(data);
  });
});

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
  page.on("console", m => { if (m.type() === "error") console.log("console:", m.text()); });
  page.on("pageerror", e => console.log("pageerror:", e.message));

  const base = `http://localhost:${PORT}/brag-output/work/node_modules`;
  await page.route("https://flagcdn.com/**", route => {
    const code = route.request().url().match(/\/(\w\w)\.png/)[1];
    route.fulfill({ status: 200, contentType: "image/svg+xml",
      body: fs.readFileSync(path.join(WORK, "node_modules/svg-country-flags/svg", code + ".svg")) });
  });
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ status: 200, contentType: "text/css",
    body: ["heebo/400", "heebo/600", "heebo/800", "rubik/700", "rubik/800"].map(f => `@import url(${base}/@fontsource/${f}.css);`).join("\n") }));
  await page.addInitScript(() => {
    try { localStorage.setItem("geo-lang", "en"); localStorage.setItem("geo-sound-muted", "1"); } catch (e) {}
    let s = 12345; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  });

  await page.goto(`http://localhost:${PORT}/brag-output/work/comp.html${VERT ? "?format=vertical" : ""}`);
  await page.evaluate(() => window.setup());
  const total = await page.evaluate(() => window.T.total);

  const mode = process.argv[2];
  if (mode === "stills") {
    const times = process.argv[3].split(",").map(Number);
    fs.mkdirSync(path.join(WORK, "stills"), { recursive: true });
    // step through time sequentially so app state advances like the real render
    const want = new Set(times.map(t => Math.round(t * FPS)));
    const last = Math.max(...want);
    for (let f = 0; f <= last; f++) {
      await page.evaluate(t => window.renderAt(t), f / FPS);
      if (want.has(f)) await page.screenshot({ path: path.join(WORK, "stills", `${SUF}t${(f / FPS).toFixed(2)}.jpg`), quality: 85, type: "jpeg" });
    }
  } else {
    const n = Math.round(total * FPS);
    const ff = spawn(FFMPEG, ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
      "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", path.join(WORK, `video${SUF}.mp4`)],
      { stdio: ["pipe", "ignore", "inherit"] });
    for (let f = 0; f < n; f++) {
      await page.evaluate(t => window.renderAt(t), f / FPS);
      const buf = await page.screenshot({ type: "jpeg", quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
      if (f % 60 === 0) console.log(`frame ${f}/${n}`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on("close", r));
  }
  await browser.close();
  server.close();
})();
