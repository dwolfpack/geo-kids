/* ============================================================================
 * Sky Rescue — arcade rescue-helicopter game (three.js).
 * ----------------------------------------------------------------------------
 * After Burner-style rail flight adapted for kids (see ref/REFERENCE.md):
 * the helicopter streams forward on a rail; the player steers inside a box,
 * drops water bombs on wildfires, skims the sea to refill, flies low over
 * rafts to winch people up, threads golden rings and dodges sea stacks,
 * birds and storm clouds. Three stages, no game over (just "try again").
 *
 * Test hooks (window.__heli): state snapshot, setInput, step(seconds),
 * start(stage), bot(on). The loop is deterministic under step().
 * ==========================================================================*/
import * as THREE from "./vendor/three.module.min.js";

const GE = window.GE;
const $ = (id) => document.getElementById(id);
const SAVE_KEY = "sky-rescue-v1";

/* ---------------- text ---------------- */
GE.setDict({
  he: {
    title: "מסוק ההצלה", sub: "טסים מעל הים, מכבים שריפות ומצילים אנשים!",
    controls: "חצים / WASD לטיסה · רווח = פצצת מים · טסים נמוך מעל הים כדי למלא מים",
    hint: "⬅️➡️⬆️⬇️ טיסה · רווח = 💧 · נמוך מעל הים = מילוי",
    goals: "🔥 {f}/{ft}  🙋 {r}/{rt}", score: "⭐ {s}",
    stage: "שלב {n}", locked: "🔒 סיימו את השלב הקודם",
    s1: "איי יוון", s1d: "ים שקט, שריפות ראשונות", s2: "הפיורדים של נורווגיה", s2d: "צוקים גבוהים — להתחמק!", s3: "סופה בקריביים", s3d: "עננים, ברקים ורוח",
    s4: "קניון בהימלאיה", s4d: "נהר קרחוני, צוקים מושלגים ושלג", s5: "הנילוס במצרים", s5d: "דיונות, פירמידות ושיירות גמלים",
    s6: "האמזונס בברזיל", s6d: "ג'ונגל סבוך, מקדשים עתיקים וערפל", s7: "הקוטב בקנדה", s7d: "גושי קרח, קרחונים ואנשים על הקרח",
    go: "יוצאים! 🚁", refill: "ממלאים מים! 💦", empty: "המיכל ריק — טוסו נמוך מעל הים 🌊",
    out: "כל הכבוד! 🔥➜💨", saved: "הצלתם! 🙋", ring: "טבעת! ✨", ouch: "אאוץ'! 💥",
    clear: "השלב הושלם! 🎉", fires: "שריפות", people: "הצלות", rings: "טבעות",
    next: "לשלב הבא ➜", again: "לשחק שוב 🔁", menu: "לתפריט 🏠",
    tryTitle: "אופס! המסוק צריך תיקון 🔧", tryBody: "לא נורא — כל טייס מתאמן. ננסה שוב?", tryBtn: "לנסות שוב 🚁",
    winTitle: "טייס הצלה אגדי! 👑", winBody: "סיימתם את כל השלבים!",
    paused: "הפסקה ⏸", resume: "ממשיכים ▶", factAbout: "💡 על {c}:",
    faster: "מהר יותר! ⚡", loop: "לולאה! 🔄", loops: "לולאות", speed: "💨 {v} קמ״ש",
    controls2: "L או Shift = לולאה 🔄",
    hangar: "המוסך — עיצוב המסוק 🎨", hBody: "צבע המסוק", hTrim: "צבע הפסים", hStripes: "סוג פסים", hBlades: "מספר להבים", hBlade: "צבע קצות הלהבים", hDone: "מוכן לטיסה! ✔", tBody: "🎨 צבע", tStripes: "〰️ פסים", tRotor: "🌀 להבים",
    st_bands: "טבעות", st_racing: "מרוץ", st_tail: "זנב", st_none: "חלק"
  },
  en: {
    title: "Sky Rescue", sub: "Fly over the sea, put out wildfires and rescue people!",
    controls: "Arrows / WASD to fly · Space = water bomb · Fly low over the sea to refill",
    hint: "⬅️➡️⬆️⬇️ fly · Space = 💧 · low over sea = refill",
    goals: "🔥 {f}/{ft}  🙋 {r}/{rt}", score: "⭐ {s}",
    stage: "Stage {n}", locked: "🔒 Finish the previous stage",
    s1: "Greek Islands", s1d: "Calm sea, first fires", s2: "Norway's Fjords", s2d: "Tall cliffs — dodge!", s3: "Caribbean Storm", s3d: "Clouds, lightning and wind",
    s4: "Himalaya Canyon", s4d: "Glacier river, snowy cliffs and snowfall", s5: "Egypt's Nile", s5d: "Dunes, pyramids and camel caravans",
    s6: "Brazil's Amazon", s6d: "Thick jungle, ancient temples and mist", s7: "Canada's Arctic", s7d: "Ice floes, icebergs and people on the ice",
    go: "Let's fly! 🚁", refill: "Refilling! 💦", empty: "Tank empty — fly low over the sea 🌊",
    out: "Fire's out! 🔥➜💨", saved: "Rescued! 🙋", ring: "Ring! ✨", ouch: "Ouch! 💥",
    clear: "Stage clear! 🎉", fires: "fires", people: "rescues", rings: "rings",
    next: "Next stage ➜", again: "Play again 🔁", menu: "Menu 🏠",
    tryTitle: "Oops! The chopper needs a fix 🔧", tryBody: "No worries — every pilot practises. Try again?", tryBtn: "Try again 🚁",
    winTitle: "Legendary rescue pilot! 👑", winBody: "You finished every stage!",
    paused: "Paused ⏸", resume: "Resume ▶", factAbout: "💡 About {c}:",
    faster: "Faster! ⚡", loop: "Loop! 🔄", loops: "loops", speed: "💨 {v} km/h",
    controls2: "L or Shift = loop-the-loop 🔄",
    hangar: "Hangar — paint your chopper 🎨", hBody: "Body colour", hTrim: "Stripe colour", hStripes: "Stripe style", hBlades: "Rotor blades", hBlade: "Blade tip colour", hDone: "Ready to fly! ✔", tBody: "🎨 Colour", tStripes: "〰️ Stripes", tRotor: "🌀 Rotor",
    st_bands: "Bands", st_racing: "Racing", st_tail: "Tail", st_none: "Plain"
  }
});
const t = GE.t;

/* ---------------- stages ---------------- */
const STAGES = [
  { key: "s1", look: "aegean", code: "gr", icon: "🏛️", length: 2300, speed: 30, sea: 0x1FA9D6, deep: 0x0B6FA6, sky: ["#6EC6EC", "#FFF1D8"], fog: 0xF3EBDD, sun: 0xFFE0B0,
    fires: 6, rafts: 4, rings: 10, stacks: 5, birds: 2, clouds: 0, islandTint: 0xA3AE6A },
  { key: "s2", theme: "fjord", code: "no", icon: "⛰️", length: 2600, speed: 34, sea: 0x1F8296, deep: 0x0B4153, sky: ["#7FA9C9", "#E6ECEF"], fog: 0xD3DDE2, sun: 0xFFF1DC,
    fires: 7, rafts: 5, rings: 10, stacks: 14, birds: 4, clouds: 0, islandTint: 0x5FA85E },
  { key: "s3", look: "tropic", code: "jm", icon: "⛈️", length: 2800, speed: 37, sea: 0x1AA2B8, deep: 0x0A4F66, sky: ["#7D9FBC", "#DCE6ED"], fog: 0xB4C4D0, sun: 0xFFF3E0,
    fires: 8, rafts: 6, rings: 10, stacks: 10, birds: 3, clouds: 8, islandTint: 0x5E9C57 },
  // New worlds (from the user's concept art): each keeps water to refill from.
  { key: "s4", theme: "canyon", code: "np", icon: "🏔️", length: 2800, speed: 38, sea: 0x86CADB, deep: 0x4A8FA6, sky: ["#9DBBD3", "#EEF3F7"], fog: 0xDDE6EE, sun: 0xFFFFFF,
    fires: 6, rafts: 5, rings: 10, stacks: 12, birds: 2, clouds: 0, islandTint: 0x44704F },
  { key: "s5", theme: "desert", code: "eg", icon: "🐪", length: 2900, speed: 39, sea: 0x25A3B6, deep: 0x157489, sky: ["#98C4DC", "#F3D6A2"], fog: 0xF0D2A0, sun: 0xFFDDA6,
    fires: 7, rafts: 5, rings: 10, stacks: 9, birds: 3, clouds: 5, islandTint: 0x93A94E },
  { key: "s6", theme: "jungle", code: "br", icon: "🌿", length: 3000, speed: 40, sea: 0x4FB39A, deep: 0x2E7A66, sky: ["#8FC0B6", "#E3EEE2"], fog: 0xC7DBC9, sun: 0xFFF0D0,
    fires: 8, rafts: 6, rings: 10, stacks: 12, birds: 4, clouds: 0, islandTint: 0x2E7A3A },
  { key: "s7", theme: "arctic", code: "ca", icon: "🧊", length: 3000, speed: 41, sea: 0x3B8FB8, deep: 0x1F5E86, sky: ["#86A9C9", "#E8EFF6"], fog: 0xD5E0EA, sun: 0xF3F8FF,
    fires: 4, rafts: 7, rings: 10, stacks: 12, birds: 2, clouds: 4, islandTint: 0xE6F1F7 }
];

const BOX = { x: 16, yMin: 2.4, yMax: 20 };
const TANK_MAX = 8;

/* ---------------- renderer / scene ---------------- */
const canvas = $("c");
const flashEl = document.createElement("div");
flashEl.className = "flash"; document.body.appendChild(flashEl);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
renderer.setPixelRatio(pixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.5, 900);
const hemi = new THREE.HemisphereLight(0xFFF4E2, 0x3C6E4E, 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xFFF1D6, 2.1);
sun.position.set(-40, 80, 30);
scene.add(sun); scene.add(sun.target);
// Real-time shadow, cast by the helicopter only: a tight box that follows it, so it's cheap on phones.
const SUN_OFF = new THREE.Vector3(-8, 40, 5);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 120 });
sun.shadow.bias = -0.0015;
sun.shadow.radius = 6; sun.shadow.blurSamples = 12;
sun.shadow.intensity = 0.55;

function skyTexture(top, bottom) {
  const c = document.createElement("canvas");
  c.width = 2; c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, top); grd.addColorStop(1, bottom);
  g.fillStyle = grd; g.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------------- baked noise textures ---------------- */
// Tileable fractal noise, generated once. Shaders sample these instead of computing noise per pixel,
// which keeps the realistic sky and surfaces cheap enough for phones (mipmaps also stop far-away shimmer).
function tileNoiseTex(size, octaves, period, seed) {
  const data = new Uint8Array(size * size * 4);
  const h = (x, y, o) => { const v = Math.sin(x * 127.1 + y * 311.7 + (seed + o) * 74.7) * 43758.5453; return v - Math.floor(v); };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0, a = 0.5, norm = 0;
    for (let o = 0; o < octaves; o++) {
      const P = period << o, fx = x / size * P, fy = y / size * P, xi = Math.floor(fx), yi = Math.floor(fy);
      const tx = fx - xi, ty = fy - yi, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const x0 = xi % P, y0 = yi % P, x1 = (xi + 1) % P, y1 = (yi + 1) % P;
      const top = h(x0, y0, o) + (h(x1, y0, o) - h(x0, y0, o)) * sx, bot = h(x0, y1, o) + (h(x1, y1, o) - h(x0, y1, o)) * sx;
      v += a * (top + (bot - top) * sy); norm += a; a *= 0.5;
    }
    const c = Math.round(v / norm * 255), i = (y * size + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = c; data[i + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}
const CLOUD_TEX = tileNoiseTex(256, 5, 4, 11), DETAIL_TEX = tileNoiseTex(128, 4, 8, 29);

/* ---------------- materials & shared geometry ---------------- */
// Procedural surface detail: a two-octave 3D noise in world space tints every lit surface a little,
// so rock, grass, sand and bark read as real materials without any textures or UVs.
const DETAIL_GLSL = `
  varying vec3 vDetailPos; uniform float uDetail, uSnow, uShore, uStrata; uniform vec3 uShoreCol; uniform sampler2D tDetail;`;
function addDetail(m, amount, snow = 0, shore = 0, strata = 0) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uDetail = { value: amount }; sh.uniforms.uSnow = { value: snow };
    sh.uniforms.uShore = { value: shore }; sh.uniforms.uStrata = { value: strata }; sh.uniforms.uShoreCol = { value: new THREE.Color(0xE9D6A0) };
    sh.uniforms.tDetail = { value: DETAIL_TEX };
    sh.vertexShader = "varying vec3 vDetailPos;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n  vDetailPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = DETAIL_GLSL + "\n" + sh.fragmentShader.replace("#include <color_fragment>",
      "#include <color_fragment>\n  // three cheap lookups: broad patches from above, streaks down vertical faces, fine grain\n  float dn = texture2D(tDetail, vDetailPos.xz * 0.012).r * 0.5 + texture2D(tDetail, vec2(vDetailPos.x + vDetailPos.z, vDetailPos.y * 2.5) * 0.035).r * 0.3 + texture2D(tDetail, (vDetailPos.xz + vDetailPos.y) * 0.16).r * 0.2;\n  dn = (dn - 0.5) * 1.6 + 0.5;\n  diffuseColor.rgb *= 1.0 + (dn - 0.5) * uDetail;\n  if (uStrata > 0.0) diffuseColor.rgb *= 1.0 + sin(vDetailPos.y * 1.9 + dn * 5.0) * 0.09 * uStrata;\n  if (uShore > 0.0) diffuseColor.rgb = mix(uShoreCol, diffuseColor.rgb, smoothstep(uShore, uShore + 1.4, vDetailPos.y + (dn - 0.5) * 1.2));\n  if (uSnow > 0.0) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.95, 0.99), smoothstep(uSnow - 3.0, uSnow + 3.0, vDetailPos.y + (dn - 0.5) * 16.0));");
  };
  m.customProgramCacheKey = () => "detail";
  return m;
}
const M = (color, { detail = 0.45, snow = 0, shore = 0, strata = 0, ...opts } = {}) => {
  const m = new THREE.MeshStandardMaterial({ color, flatShading: false, roughness: 0.82, metalness: 0, ...opts });
  return detail ? addDetail(m, detail, snow, shore, strata) : m;
};
const mat = {
  sand: M(0xF1DDA4), rock: M(0x8C7B6B, { detail: 0.7, strata: 1 }), rockDark: M(0x6E6258, { detail: 0.7, strata: 1 }), trunk: M(0x8B5A2B), leaf: M(0x3E9E4A),
  red: M(0xFF5B2E, { roughness: 0.4, detail: 0 }), white: M(0xF7F7F2, { roughness: 0.5, detail: 0 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x0E2F48, roughness: 0.03, metalness: 0.35, envMapIntensity: 1.8 }),
  dark: M(0x2B2F36, { roughness: 0.35, metalness: 0.6, detail: 0 }),
  // polished gold: metal reflecting the sky, with a gentle glow so it still reads from far away
  ring: new THREE.MeshStandardMaterial({ color: 0xFFC44D, metalness: 1, roughness: 0.2, emissive: 0xFF8A00, emissiveIntensity: 0.45, envMapIntensity: 1.6, fog: false }),
  flame: new THREE.MeshBasicMaterial({ color: 0xFF7A1A }), flame2: new THREE.MeshBasicMaterial({ color: 0xFFD54A }),
  smoke: new THREE.MeshStandardMaterial({ color: 0x46413D, transparent: true, opacity: 0.42, flatShading: false, roughness: 1, depthWrite: false }),
  steam: new THREE.MeshStandardMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.7, flatShading: true, depthWrite: false }),
  water: new THREE.MeshStandardMaterial({ color: 0x6FD3F5, transparent: true, opacity: 0.85, roughness: 0.2 }),
  raft: M(0xFF9E1B, { roughness: 0.5, detail: 0.1 }), person: M(0xF2B98A, { roughness: 0.6, detail: 0 }), shirt: M(0x3D7BE0, { detail: 0.15 }), boat: M(0xFFFFFF, { detail: 0.1 }),
  bird: M(0xFFFFFF, { detail: 0 }), cloud: M(0x5C6770, { transparent: true, opacity: 0.92 }),
  shallow: new THREE.MeshBasicMaterial({ color: 0x7FE6E6, transparent: true, opacity: 0.55, depthWrite: false }),
  shadow: new THREE.MeshBasicMaterial({ color: 0x06384A, transparent: true, opacity: 0.22, depthWrite: false }),
  reticle: new THREE.MeshBasicMaterial({ color: 0xBDF3FF, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }),
  spark: new THREE.MeshBasicMaterial({ color: 0xFFF3B0 }),
  spray: new THREE.MeshBasicMaterial({ color: 0xE9FCFF, transparent: true, opacity: 0.7, depthWrite: false }),
  flare: new THREE.MeshBasicMaterial({ color: 0xFF2D55, transparent: true, opacity: 0.7, depthWrite: false, fog: false }),
  streak: new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.1, depthWrite: false, fog: false }),
  mountain: M(0x7E9AA8, { snow: 46, detail: 0.5 })
};
/* organic shapes: noise-displaced, smooth-shaded geometry (a few variants of each, reused by scale) */
const nh3 = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf), L = (a, b, t) => a + (b - a) * t;
  return L(L(L(nh3(xi, yi, zi), nh3(xi + 1, yi, zi), u), L(nh3(xi, yi + 1, zi), nh3(xi + 1, yi + 1, zi), u), v),
           L(L(nh3(xi, yi, zi + 1), nh3(xi + 1, yi, zi + 1), u), L(nh3(xi, yi + 1, zi + 1), nh3(xi + 1, yi + 1, zi + 1), u), v), w);
}
function fbm3(x, y, z) { let s = 0, a = 0.5; for (let i = 0; i < 4; i++) { s += a * noise3(x, y, z); x = x * 2.03 + 5.1; y = y * 2.03 + 1.7; z = z * 2.03 + 3.3; a *= 0.5; } return s / 0.9375; }
// Merge duplicate vertices (UV seams, faces) so normals average into a smooth surface.
function smoothIndexed(g) {
  const pos = g.attributes.position, src = g.index ? g.index.array : null, n = src ? src.length : pos.count;
  const map = new Map(), verts = [], idx = [];
  for (let i = 0; i < n; i++) {
    const k = src ? src[i] : i, x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k);
    const key = Math.round(x * 1e4) + "," + Math.round(y * 1e4) + "," + Math.round(z * 1e4);
    let j = map.get(key);
    if (j === undefined) { j = verts.length / 3; verts.push(x, y, z); map.set(key, j); }
    idx.push(j);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3)); out.setIndex(idx);
  return out;
}
// radial: push out from the y axis (rock pillars, cones); otherwise from the centre (boulders, hills, foliage)
function organic(base, amp, freq, seed, radial, yMul = 2.2) {
  const g = smoothIndexed(base), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const d = 1 + (fbm3(x * freq + seed, y * freq * (radial ? yMul : 1), z * freq - seed) - 0.5) * 2 * amp;
    if (radial) p.setXYZ(i, x * d, y, z * d); else p.setXYZ(i, x * d, y * d, z * d);
  }
  g.computeVertexNormals();
  return g;
}
const variants = (n, make) => { const list = Array.from({ length: n }, (_, i) => make(i * 13.7 + 3)); let k = 0; return () => list[k++ % n]; };
const rockGeo = variants(6, (sd) => organic(new THREE.IcosahedronGeometry(1, 3), 0.2, 1.4, sd));
// (a cylinder with a near-zero top: this three.js build drops half the triangles of multi-row ConeGeometry)
const coneGeo = variants(4, (sd) => organic(new THREE.CylinderGeometry(0.0005, 1, 1, 28, 18), 0.12, 2.6, sd, true, 0.8));
const pillarGeo = variants(4, (sd) => organic(new THREE.CylinderGeometry(0.55, 1.35, 1, 24, 16), 0.2, 2.2, sd, true));
const cliffGeo = variants(4, (sd) => organic(new THREE.CylinderGeometry(0.55, 1, 1, 22, 12), 0.14, 2.4, sd, true));
const capGeo = variants(3, (sd) => organic(new THREE.CylinderGeometry(0.35, 1.02, 1, 22, 4), 0.16, 2.6, sd, true));
const slabGeo = variants(4, (sd) => organic(new THREE.CylinderGeometry(1, 1.12, 1, 22, 2), 0.2, 1.6, sd, true));
const geo = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.IcosahedronGeometry(1, 3),          // smooth ball (helicopter, heads, lights)
  get sphereLo() { return rockGeo(); },                  // natural lumpy shapes: hills, rocks, foliage, dunes, ice
  get cone() { return coneGeo(); },
  cyl: new THREE.CylinderGeometry(1, 1, 1, 18),
  ring: new THREE.TorusGeometry(3.6, 0.45, 16, 56),
  disc: new THREE.CircleGeometry(1, 32),
  reticle: new THREE.RingGeometry(1.1, 1.45, 32),
  get pillar() { return pillarGeo(); }, get cliff() { return cliffGeo(); }, get cap() { return capGeo(); }, get slab() { return slabGeo(); }
};

/* ---------------- soft particles (sprites) ---------------- */
// Round, soft-edged camera-facing puffs: smoke, spray, steam, flares, snow and dust.
function softTex(rgb, core = 1) {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, `rgba(${rgb},${core})`); grd.addColorStop(0.45, `rgba(${rgb},${core * 0.7})`); grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
const SP = (rgb, core, extra = {}) => new THREE.SpriteMaterial({ map: softTex(rgb, core), depthWrite: false, ...extra });
mat.shallow.map = softTex("255,255,255", 1); mat.shallow.opacity = 0.6;  // soft-edged shallows around islands
// flame tongue: a soft teardrop, bright at the base and fading to a point
function flameTex() {
  const c = document.createElement("canvas"); c.width = 64; c.height = 128;
  const g = c.getContext("2d");
  g.save(); g.translate(32, 92); g.scale(1, 2.2);
  const grd = g.createRadialGradient(0, 0, 0, 0, 0, 30);
  grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.35, "rgba(255,255,255,0.75)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.beginPath(); g.arc(0, 0, 30, 0, Math.PI * 2); g.fill(); g.restore();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
const FLAME_TEX = flameTex();
Object.assign(mat, {
  flameOuter: new THREE.SpriteMaterial({ map: FLAME_TEX, color: 0xFF5A14, blending: THREE.AdditiveBlending, depthWrite: false }),
  flameCore: new THREE.SpriteMaterial({ map: FLAME_TEX, color: 0xFFD25A, blending: THREE.AdditiveBlending, depthWrite: false }),
  ember: SP("255,170,60", 1, { blending: THREE.AdditiveBlending }),
  smoke: SP("62,58,56", 0.55),
  steam: SP("255,255,255", 0.8),
  spray: SP("235,252,255", 0.85),
  drop: SP("150,225,250", 0.95),
  flare: SP("255,70,90", 0.9, { blending: THREE.AdditiveBlending, fog: false }),
  flakeP: SP("255,255,255", 1),
  dustP: SP("227,192,138", 0.5),
  glowF: SP("255,150,40", 0.7, { blending: THREE.AdditiveBlending }),
  mistS: SP("236,244,238", 0.55)
});

/* ---------------- helicopter ---------------- */
// Radial motion-blur disc for the spinning rotor (light, see-through).
function rotorBlurTex() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  grd.addColorStop(0, "rgba(60,64,70,0.3)"); grd.addColorStop(0.7, "rgba(190,200,210,0.22)"); grd.addColorStop(0.93, "rgba(255,255,255,0.42)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
// Paint options for the hangar. Colours are hex; everything else is a key.
const PAINT = {
  body: [0xFF5B2E, 0xE53935, 0x1E88E5, 0xFDD835, 0x43A047, 0x8E24AA, 0xEC407A, 0x263238, 0xF5F5F5],
  trim: [0xF7F7F2, 0x263238, 0xFDD835, 0xE53935, 0x1E88E5, 0xFFB300, 0x43A047],
  stripes: ["bands", "racing", "tail", "none"],
  blades: [2, 3, 4, 5],
  blade: [0x3A3F47, 0xE53935, 0xFDD835, 0xF7F7F2, 0x1E88E5]
};
// fuselage radius along its length (0 = nose .. 1 = where the tail boom starts)
const fuseR = (s) => { const k = Math.min(1, Math.max(0, (s - 0.55) / 0.45)); return 1.3 * Math.pow(Math.sin(Math.PI * 0.92 * Math.pow(s, 0.8)), 0.5) * (1 - 0.55 * k * k * (3 - 2 * k)); };
const DEFAULT_LOOK = { body: 0xFF5B2E, trim: 0xF7F7F2, stripes: "bands", blades: 4, blade: 0x3A3F47 };
const heliMat = {
  // glossy paint that reflects the sky (single-layer PBR: cheap enough to fill a phone screen)
  body: new THREE.MeshStandardMaterial({ color: 0xFF5B2E, roughness: 0.2, metalness: 0.12, envMapIntensity: 1.25 }),
  trim: new THREE.MeshStandardMaterial({ color: 0xF7F7F2, roughness: 0.24, metalness: 0.05, envMapIntensity: 1.2 }),
  navR: new THREE.MeshBasicMaterial({ color: 0xFF2A2A }), navG: new THREE.MeshBasicMaterial({ color: 0x2BFF6A }),
  blade: new THREE.MeshBasicMaterial({ color: 0x3A3F47, transparent: true, opacity: 0.4, depthWrite: false }),
  tip: new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.6, depthWrite: false }),
  blur: new THREE.MeshBasicMaterial({ map: rotorBlurTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide })
};
// Builds (or rebuilds) the helicopter into group g from a look {body, trim, stripes, blades, blade}.
function buildHeli(look = DEFAULT_LOOK, g = new THREE.Group()) {
  for (const c of [...g.children]) g.remove(c);
  heliMat.body.color.setHex(look.body);
  heliMat.trim.color.setHex(look.trim);
  const dark = look.blade === 0x3A3F47;
  heliMat.blade.color.setHex(0x3A3F47);
  heliMat.tip.color.setHex(dark ? 0xF7F7F2 : look.blade);
  heliMat.blur.color.setHex(dark ? 0xFFFFFF : look.blade);
  const add = (geom, m, sx, sy, sz, x, y, z, rx = 0, rz = 0) => { const o = new THREE.Mesh(geom, m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); g.add(o); return o; };
  const R = Math.PI / 2;
  // Fuselage: a teardrop profile turned on a lathe. Paint, glass and stripes are slices of the same
  // surface (by length s and angle phi), so they wrap the body exactly like real livery.
  const hull = (s0, s1, ph0, phLen, grow, m) => {
    const pts = [];
    for (let i = 0; i <= 28; i++) { const s = s0 + (s1 - s0) * i / 28; pts.push(new THREE.Vector2(fuseR(s) * grow, -2.35 + s * 4.3)); }
    const lg = new THREE.LatheGeometry(pts, 40, ph0, phLen); lg.rotateX(R);
    const o = new THREE.Mesh(lg, m); o.scale.set(0.84, 1.04, 1); g.add(o); return o;
  };
  const TOP = Math.PI, BAND = (z) => (z + 2.35) / 4.3;
  hull(0, 1, 0, Math.PI * 2, 1, heliMat.body);
  add(geo.sphere, heliMat.body, fuseR(1) * 0.84, fuseR(1) * 1.04, 0.4, 0, 0, 1.95);   // close the rear
  hull(0.03, 0.97, -1.05, 2.1, 1.008, heliMat.trim);                                 // light belly
  hull(0.035, 0.4, TOP - 1.3, 2.6, 1.016, mat.glass);                              // wrap-around windscreen
  for (const sd of [-1, 1]) hull(0.42, 0.6, TOP + sd * 1.05 - 0.3, 0.6, 1.014, mat.glass);   // cabin side windows
  add(geo.sphere, heliMat.body, 0.5, 0.36, 1.25, 0, 1.12, 0.45);                    // engine cowling
  add(geo.cyl, mat.dark, 0.13, 0.35, 0.13, 0, 0.9, 1.75, R);                        // exhaust
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.3, 1, 18), heliMat.body); boom.scale.set(1, 2.8, 1); boom.rotation.x = R; boom.position.set(0, 0.2, 3.0); g.add(boom);
  const fin = add(geo.box, heliMat.body, 0.1, 1.0, 0.6, 0, 0.8, 4.12); fin.rotation.x = -0.35;   // swept fin
  add(geo.box, heliMat.body, 1.3, 0.06, 0.38, 0, 0.35, 3.75);                        // tail plane
  const st = look.stripes;
  if (st === "bands") {
    for (const z of [-0.25, 0.85]) hull(BAND(z) - 0.035, BAND(z) + 0.035, 0, Math.PI * 2, 1.02, heliMat.trim);
    add(geo.cyl, heliMat.trim, 0.3, 0.5, 0.3, 0, 0.3, 3.2, R);
  } else if (st === "racing") {
    for (const sd of [-1, 1]) hull(0.02, 0.98, TOP + sd * 0.34 - 0.07, 0.14, 1.02, heliMat.trim);
    add(geo.box, heliMat.trim, 0.3, 0.3, 2.6, 0, 0.44, 2.9);
  } else if (st === "tail") {
    for (let i = 0; i < 4; i++) add(geo.cyl, heliMat.trim, 0.3 - i * 0.02, 0.26, 0.3 - i * 0.02, 0, 0.3, 2.0 + i * 0.55, R);
    const tf = add(geo.box, heliMat.trim, 0.12, 0.5, 0.64, 0, 1.05, 4.2); tf.rotation.x = -0.35;
    hull(BAND(0.85) - 0.035, BAND(0.85) + 0.035, 0, Math.PI * 2, 1.02, heliMat.trim);
  }
  // navigation lights (red port, green starboard) and a red beacon on top
  add(geo.sphere, heliMat.navR, 0.055, 0.055, 0.055, -0.66, 0.35, 3.75);
  add(geo.sphere, heliMat.navG, 0.055, 0.055, 0.055, 0.66, 0.35, 3.75);
  add(geo.sphere, heliMat.navR, 0.11, 0.08, 0.11, 0, 1.47, 0.95);
  const tail = new THREE.Group(); tail.position.set(0.22, 0.85, 4.1);
  for (let i = 0; i < 2; i++) { const b = new THREE.Mesh(geo.box, heliMat.trim); b.scale.set(0.05, 0.9, 0.12); b.rotation.x = i * R; tail.add(b); }
  g.add(tail);
  for (const sd of [-1, 1]) {
    add(geo.cyl, mat.dark, 0.12, 3.2, 0.12, 0.95 * sd, -1.35, -0.1, R);
    for (const z of [-0.9, 0.8]) add(geo.cyl, mat.dark, 0.08, 0.6, 0.08, 0.85 * sd, -1.05, z, 0, 0.3 * sd);
  }
  add(geo.cyl, mat.dark, 0.16, 0.5, 0.16, 0, 1.3, 0);                              // mast
  const rotor = new THREE.Group(); rotor.position.y = 1.6;
  const n = look.blades;
  for (let i = 0; i < n; i++) {
    const arm = new THREE.Group(); arm.rotation.y = i * Math.PI * 2 / n;
    const b = new THREE.Mesh(geo.box, heliMat.blade); b.scale.set(0.26, 0.05, 3.5); b.position.z = 1.75; arm.add(b);
    const tip = new THREE.Mesh(geo.box, heliMat.tip); tip.scale.set(0.28, 0.06, 0.6); tip.position.z = 3.8; arm.add(tip);
    rotor.add(arm);
  }
  const hub = new THREE.Mesh(geo.sphere, heliMat.body); hub.scale.set(0.35, 0.2, 0.35); rotor.add(hub);
  const blur = new THREE.Mesh(geo.disc, heliMat.blur);
  blur.scale.setScalar(4.2); blur.rotation.x = -R; rotor.add(blur);
  g.add(rotor);
  g.userData = { rotor, tail };
  g.traverse((o) => { if (o.isMesh && o.material !== heliMat.blur && o.material !== heliMat.blade && o.material !== heliMat.tip) o.castShadow = true; });
  g.scale.setScalar(1.8);
  return g;
}

/* ---------------- world objects ---------------- */
// Palm: a leaning, curving trunk with ring bands, drooping fronds and coconuts.
const frondGeo = (() => {
  const g = new THREE.PlaneGeometry(1, 1, 1, 8); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) + 0.5;                       // 0 at the trunk .. 1 at the tip
    const w = Math.sin(Math.PI * Math.min(1, t * 1.15)) * 0.5 + 0.08;   // leaf outline, pointed tip
    p.setXYZ(i, p.getX(i) * w * (p.getX(i) > 0 ? 1 : 1), -t * t * 0.55, t);  // droop under its own weight
  }
  g.computeVertexNormals(); return g;
})();
const palmMat = { leaf: M(0x3E9E4A, { side: THREE.DoubleSide, roughness: 0.7, detail: 0.35 }), leafDark: M(0x2F7F3A, { side: THREE.DoubleSide, roughness: 0.7, detail: 0.35 }), nut: M(0x6B4A22, { detail: 0.2 }) };
function palm(rng, h = 4.2) {
  const p = new THREE.Group();
  const lean = (rng() - 0.5) * 0.5, segs = 5; let x = 0, y = 0;
  for (let i = 0; i < segs; i++) {
    const seg = new THREE.Mesh(geo.cyl, mat.trunk);
    const sh = h / segs, ang = lean * (i + 1) / segs;
    seg.scale.set(0.2 - i * 0.015, sh * 1.05, 0.2 - i * 0.015); seg.rotation.z = -ang;
    seg.position.set(x + Math.sin(ang) * sh / 2, y + Math.cos(ang) * sh / 2, 0); p.add(seg);
    x += Math.sin(ang) * sh; y += Math.cos(ang) * sh;
  }
  const n = 8 + Math.floor(rng() * 3);
  for (let k = 0; k < n; k++) {
    const f = new THREE.Mesh(frondGeo, k % 2 ? palmMat.leaf : palmMat.leafDark);
    const len = 2.6 + rng() * 0.9;
    f.scale.set(len * 0.45, len, len);
    f.position.set(x, y, 0);
    f.rotation.set(-0.25 - rng() * 0.35, (k / n) * Math.PI * 2 + rng() * 0.3, 0, "YXZ");
    p.add(f);
  }
  for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(geo.sphere, palmMat.nut); c.scale.setScalar(0.17); c.position.set(x + Math.cos(k * 2.1) * 0.22, y - 0.25, Math.sin(k * 2.1) * 0.22); p.add(c); }
  p.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  return p;
}
// Greek village: whitewashed cube houses, a blue-domed chapel, olive and cypress trees.
function aegeanVillage(g, rng, r, face) {
  // terraced along the shore that faces the flight path, so it reads from the helicopter
  const n = 8 + Math.floor(rng() * 6);
  for (let i = 0; i < n; i++) {
    const row = i % 2, a = face + (rng() - 0.5) * 1.5, d = r * (row ? 0.62 : 0.84);
    const w = 2.4 + rng() * 1.8, h = 2.2 + rng() * 1.8, hx = Math.cos(a) * d, hz = Math.sin(a) * d, y0 = 0.8 + row * 1.8;
    const house = mesh(geo.box, W.whitewash, w, h, w * (0.8 + rng() * 0.4), hx, y0 + h / 2, hz); house.rotation.y = rng() * 0.5 - face; g.add(house);
    if (rng() < 0.45) g.add(mesh(geo.box, W.aegeanBlue, w * 0.9, 0.18, w * 0.9, hx, y0 + h + 0.09, hz));   // blue roof edge
    else if (rng() < 0.5) g.add(mesh(geo.box, W.aegeanBlue, 0.6, 1.1, 0.1, hx + Math.cos(face) * w * 0.52, y0 + 0.55, hz + Math.sin(face) * w * 0.52));   // blue door
  }
  const a = face + (rng() < 0.5 ? -0.35 : 0.35), d = r * 0.7, cx = Math.cos(a) * d, cz = Math.sin(a) * d, y0 = 0.8 + 1.2;
  g.add(mesh(geo.box, W.whitewash, 3.6, 3.4, 3.6, cx, y0 + 1.7, cz));
  g.add(mesh(geo.sphere, W.aegeanBlue, 1.6, 1.45, 1.6, cx, y0 + 3.4, cz));
  g.add(mesh(geo.box, W.whitewash, 0.14, 1.1, 0.14, cx, y0 + 5.3, cz));
  g.add(mesh(geo.box, W.whitewash, 0.6, 0.14, 0.14, cx, y0 + 5.5, cz));
}
function aegeanTree(rng) {
  const t = new THREE.Group();
  if (rng() < 0.5) { t.add(mesh(geo.cyl, mat.trunk, 0.14, 1.2, 0.14, 0, 0.6, 0)); t.add(mesh(geo.cone, W.cypress, 0.55, 4.2, 0.55, 0, 2.9, 0)); }
  else { t.add(mesh(geo.cyl, mat.trunk, 0.2, 1.3, 0.2, 0, 0.65, 0)); t.add(mesh(geo.sphereLo, W.olive, 1.4, 1.0, 1.4, 0, 1.8, 0)); }
  return t;
}
function buildIsland(rng, tint, big, flat, look, face = 0) {
  const g = new THREE.Group();
  const r = (big ? 16 : 9) + rng() * (big ? 10 : 6);
  const shallow = new THREE.Mesh(geo.disc, mat.shallow); shallow.scale.setScalar(r * 1.6); shallow.rotation.x = -Math.PI / 2; shallow.position.y = 0.35; g.add(shallow);
  // a low, gently sloping beach rather than a drum
  const sand = new THREE.Mesh(geo.sphereLo, mat.sand); sand.scale.set(r, 1.7, r * (0.8 + rng() * 0.4)); sand.position.y = -0.2; g.add(sand);
  const hills = flat ? 0 : 1 + Math.floor(rng() * 3);
  const green = islandMat(tint);
  for (let i = 0; i < hills; i++) {
    const h = new THREE.Mesh(geo.sphereLo, green);
    const s = r * (0.45 + rng() * 0.35);
    h.scale.set(s, s * (0.45 + rng() * 0.5), s);
    h.position.set((rng() - 0.5) * r * 0.55, -s * 0.12, (rng() - 0.5) * r * 0.55);
    h.rotation.y = rng() * 6;
    g.add(h);
    if (rng() < 0.5) { const rk = new THREE.Mesh(geo.sphereLo, mat.rock); rk.scale.set(s * 0.3, s * 0.25, s * 0.3); rk.position.set(h.position.x + s * 0.5, 0.8, h.position.z); g.add(rk); }
  }
  if (look === "aegean") {
    if (big && rng() < 0.8) aegeanVillage(g, rng, r, face);
    for (let i = 0; i < 3 + Math.floor(rng() * 4); i++) { const t = aegeanTree(rng); const a = rng() * 6.3, d = r * (0.4 + rng() * 0.4); t.position.set(Math.cos(a) * d, 0.8, Math.sin(a) * d); g.add(t); }
    g.userData = { r, top: 3 };
    return g;
  }
  const palms = 2 + Math.floor(rng() * 4);
  for (let i = 0; i < palms; i++) {
    const p = palm(rng, 3.6 + rng() * 1.6);
    const a = rng() * Math.PI * 2, d = r * (0.62 + rng() * 0.2);
    p.position.set(Math.cos(a) * d, 0.9, Math.sin(a) * d);
    p.rotation.y = rng() * 6;
    g.add(p);
  }
  g.userData = { r, top: 3 };
  return g;
}
const islandMats = new Map();
function islandMat(tint) { if (!islandMats.has(tint)) islandMats.set(tint, M(tint, { detail: 0.6, roughness: 0.9, shore: 1.1 })); return islandMats.get(tint); }
function buildStack(rng, look) {
  const g = new THREE.Group();
  const h = 18 + rng() * 16, r = 2.6 + rng() * 1.8;
  const bodyMat = look === "aegean" ? W.limestone : look === "fjord" ? W.fjordRock2 : rng() < 0.5 ? mat.rock : mat.rockDark;
  const body = new THREE.Mesh(geo.pillar, bodyMat); body.scale.set(r, h, r);
  body.position.y = h / 2 - 1; body.rotation.y = rng() * 3; g.add(body);
  const cap = new THREE.Mesh(geo.sphereLo, look === "fjord" ? W.snow : look === "aegean" ? W.olive : mat.leaf); cap.scale.set(r * 0.62, r * 0.32, r * 0.62); cap.position.y = h - 1.2; g.add(cap);
  const foam = new THREE.Mesh(geo.disc, mat.shallow); foam.scale.setScalar(r * 2); foam.rotation.x = -Math.PI / 2; foam.position.y = 0.2; g.add(foam);
  g.userData = { r: r * 1.2, h };   // matches the wider, eroded base
  return g;
}
function buildFire() {
  const g = new THREE.Group();
  const flames = [];
  // layered, additive flame sprites: wide orange tongues behind, hot yellow cores in front
  for (let i = 0; i < 7; i++) {
    const core = i >= 4;
    const f = new THREE.Sprite(core ? mat.flameCore : mat.flameOuter);
    const bx = core ? (i - 5) * 1.4 : (i - 1.5) * 1.9;
    f.userData = { bx, w: core ? 2.6 : 4.2, h: core ? 5.5 : 9, ph: i * 1.9 };
    f.position.set(bx, 3, core ? 0.8 : 0);
    g.add(f); flames.push(f);
  }
  const halo = new THREE.Sprite(mat.glowF); halo.scale.set(11, 8, 1); halo.position.y = 4; g.add(halo); flames.push(halo);
  const glow = new THREE.PointLight(0xFF7A1A, 30, 40, 2); glow.position.y = 3; g.add(glow);
  g.userData = { flames, glow, smoke: [] };
  return g;
}
function buildRaft() {
  const g = new THREE.Group();
  const boat = new THREE.Mesh(geo.cyl, mat.raft); boat.scale.set(2.2, 0.5, 2.2); boat.position.y = 0.25; g.add(boat);
  const body = new THREE.Mesh(geo.cyl, mat.shirt); body.scale.set(0.45, 1.1, 0.45); body.position.y = 1.2; g.add(body);
  const head = new THREE.Mesh(geo.sphere, mat.person); head.scale.setScalar(0.42); head.position.y = 2.05; g.add(head);
  const arm = new THREE.Mesh(geo.cyl, mat.person); arm.scale.set(0.13, 1, 0.13); arm.position.set(0.5, 2.1, 0); g.add(arm);
  const beacon = new THREE.Mesh(geo.sphere, new THREE.MeshBasicMaterial({ color: 0xFF3B30 })); beacon.scale.setScalar(0.3); beacon.position.set(-1.4, 0.9, 0); g.add(beacon);
  const pole = new THREE.Mesh(geo.cyl, mat.white); pole.scale.set(0.08, 3.2, 0.08); pole.position.set(1.3, 2.1, 0); g.add(pole);
  const flag = new THREE.Mesh(geo.box, new THREE.MeshBasicMaterial({ color: 0xFF7A00 })); flag.scale.set(1.3, 0.8, 0.06); flag.position.set(1.95, 3.3, 0); g.add(flag);
  g.userData = { arm, beacon, flag };
  g.scale.setScalar(1.9);
  return g;
}
function buildBirds(theme) {
  const bm = theme === "jungle" ? M(0x2ECC71) : theme === "desert" ? M(0x5D4037) : mat.bird;
  const g = new THREE.Group();
  const wings = [];
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Group();
    const l = new THREE.Mesh(geo.box, bm); l.scale.set(1.3, 0.08, 0.45); l.position.x = -0.6;
    const r = new THREE.Mesh(geo.box, bm); r.scale.set(1.3, 0.08, 0.45); r.position.x = 0.6;
    const lp = new THREE.Group(); lp.add(l); const rp = new THREE.Group(); rp.add(r);
    b.add(lp); b.add(rp);
    b.position.set((i % 2 ? 1 : -1) * (1 + i), -i * 0.5, i * 1.6);
    g.add(b); wings.push([lp, rp]);
  }
  g.userData = { wings, r: 4.5 };
  return g;
}
function buildCloud(rng, cmat) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(geo.sphereLo, cmat || mat.cloud);
    const s = 3 + rng() * 3;
    p.scale.set(s * 1.3, s * 0.8, s);
    p.position.set((rng() - 0.5) * 8, (rng() - 0.5) * 2, (rng() - 0.5) * 6);
    g.add(p);
  }
  g.userData = { r: 6.5 };
  return g;
}

/* ---------------- worlds (stages 4–7) ---------------- */
const W = {
  snow: M(0xF4F8FB, { detail: 0.14, roughness: 0.7 }), ice: M(0xCFE8F3, { roughness: 0.25, detail: 0.18 }), iceDeep: M(0x9FCBE0, { roughness: 0.2, detail: 0.2 }),
  granite: M(0x98A3AE), graniteDark: M(0x7A8591), pine: M(0x2F5D40), sandstone: M(0xD9A45E), sandDark: M(0xC98F48),
  dune: M(0xEDC98A), stone: M(0xB8A98A), moss: M(0x6E8B55), jungle1: M(0x2E7A3A), jungle2: M(0x3F9447), jungle3: M(0x25612F),
  bark: M(0x6B4A2E), camel: M(0xC9975B), cloth: M(0x2E6FD0), sail: M(0xFBF6E9, { flatShading: true, detail: 0.1 }), pyramid: M(0xD9A45E, { flatShading: true, detail: 0.5 }), parka: M(0xE53935), barrel: M(0xC62828),
  canoe: M(0x8D5A34), helmet: M(0xFF8F00), dust: new THREE.MeshStandardMaterial({ color: 0xE3C08A, transparent: true, opacity: 0.55, depthWrite: false }),
  fjordRock: M(0x66716B, { detail: 0.7, strata: 0.7, snow: 52 }), fjordRock2: M(0x566059, { detail: 0.7, strata: 0.7, snow: 52 }),
  fjordGrass: M(0x4E7D3C, { detail: 0.65, roughness: 0.9 }), cabin: M(0xA3281E, { detail: 0.2, roughness: 0.7 }), roofDark: M(0x2E2A28, { detail: 0.2 }),
  falls: new THREE.MeshBasicMaterial({ color: 0xF4FBFF, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }),
  whitewash: M(0xF6F3EC, { detail: 0.08, roughness: 0.85 }), aegeanBlue: M(0x1D5FB4, { detail: 0, roughness: 0.4 }),
  olive: M(0x7E8F55, { detail: 0.45 }), cypress: M(0x2F4A2A, { detail: 0.4 }),
  mtDry: M(0xA59878, { detail: 0.55 }), mtTropic: M(0x4F7D4B, { detail: 0.55 }),
  limestone: M(0xD9CFBC, { detail: 0.6, strata: 0.8 }), obelisk: M(0xD6A866, { detail: 0.5, strata: 0.3 }), gold: M(0xE9B84A, { roughness: 0.3, metalness: 0.8, detail: 0 }),
  reed: M(0x6E8F3A, { detail: 0.3 }), flagCols: [0x1E5FD0, 0xF4F4F4, 0xD32F2F, 0x2E9E4A, 0xF4C430].map((c) => M(c, { detail: 0, side: THREE.DoubleSide })),
  stupa: M(0xF2EFE8, { detail: 0.15 }), fog: M(0xE8EEF3, { transparent: true, opacity: 0.85, detail: 0 }),
  flake: new THREE.MeshBasicMaterial({ color: 0xFFFFFF }), mist: new THREE.MeshBasicMaterial({ color: 0xF2F7F2, transparent: true, opacity: 0.22, depthWrite: false })
};
const fallsGeo = (() => { const g = new THREE.PlaneGeometry(1, 1); return g; })();
const roofGeo = (() => { const g = new THREE.CylinderGeometry(0.0005, 1, 1, 3, 1); g.rotateZ(Math.PI / 2); g.rotateX(Math.PI / 2); return g; })();
const obeliskGeo = new THREE.CylinderGeometry(0.6, 1, 1, 4, 1), trunkGeo = new THREE.CylinderGeometry(0.55, 1, 1, 12), pyramidGeo = new THREE.ConeGeometry(1, 1, 4), sailGeo = new THREE.ConeGeometry(1, 1, 3);
const mesh = (g, m, sx, sy, sz, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); return o; };
function pineTree(h, snowy = true) {
  const g = new THREE.Group();
  g.add(mesh(geo.cyl, W.bark, 0.25, h * 0.3, 0.25, 0, h * 0.15, 0));
  for (let i = 0; i < 3; i++) g.add(mesh(geo.cone, W.pine, h * 0.28 - i * 0.4, h * 0.4, h * 0.28 - i * 0.4, 0, h * (0.35 + i * 0.2), 0));
  if (snowy) g.add(mesh(geo.cone, W.snow, h * 0.12, h * 0.14, h * 0.12, 0, h * 0.9, 0));
  return g;
}
// Tibetan prayer flags: a sagging line of five-coloured flags between two poles on the bank
function prayerFlags(rng, x, z, side) {
  const g = new THREE.Group(), len = 12 + rng() * 6, hTop = 7 + rng() * 3;
  g.add(mesh(geo.cyl, W.bark, 0.12, hTop, 0.12, 0, hTop / 2, 0)); g.add(mesh(geo.cyl, W.bark, 0.12, hTop * 0.7, 0.12, 0, hTop * 0.35, len));
  for (let i = 1; i < 14; i++) {
    const t = i / 14, y = hTop - (hTop * 0.3) * t - Math.sin(Math.PI * t) * 1.6;
    const f = mesh(geo.box, W.flagCols[i % 5], 0.06, 0.8, 0.7, 0, y - 0.45, t * len); f.rotation.y = 0.2 * Math.sin(i); g.add(f);
  }
  g.position.set(x, 0.9, z); g.rotation.y = side * 0.35;
  return g;
}
// Himalayan stupa: white dome on a stepped base with a golden spire
function stupa() {
  const g = new THREE.Group();
  g.add(mesh(geo.box, W.stupa, 5, 1, 5, 0, 0.5, 0)); g.add(mesh(geo.box, W.stupa, 4, 1, 4, 0, 1.5, 0));
  g.add(mesh(geo.sphere, W.stupa, 2.2, 1.9, 2.2, 0, 2.6, 0));
  g.add(mesh(geo.cone, W.gold, 0.6, 3, 0.6, 0, 5.8, 0));
  return g;
}
function jungleTree(rng, h) {
  const g = new THREE.Group();
  g.add(mesh(trunkGeo, W.bark, 0.5, h, 0.5, 0, h / 2, 0));
  const mats = [W.jungle1, W.jungle2, W.jungle3];
  // layered canopy: a big crown plus smaller clumps below and around it, on short branches
  for (let i = 0; i < 6; i++) {
    const top = i < 2, a = rng() * 6.3, d = top ? rng() * 1.2 : 1.6 + rng() * 1.6;
    const cx = Math.cos(a) * d, cz = Math.sin(a) * d, cy = h + (top ? 0.6 + rng() : -0.8 - rng() * 1.8);
    const w = top ? 3.4 + rng() * 1.6 : 1.8 + rng() * 1.2;
    g.add(mesh(geo.sphereLo, mats[i % 3], w, w * 0.62, w, cx, cy, cz));
    if (!top) { const br = mesh(geo.cyl, W.bark, 0.14, d * 1.2, 0.14, cx / 2, cy - 0.4, cz / 2); br.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1); g.add(br); }
  }
  return g;
}
function camel() {
  const g = new THREE.Group();
  g.add(mesh(geo.box, W.camel, 0.7, 0.6, 1.5, 0, 1.5, 0));
  g.add(mesh(geo.sphereLo, W.camel, 0.4, 0.45, 0.45, 0, 2, 0));
  const neck = mesh(geo.cyl, W.camel, 0.15, 0.9, 0.15, 0, 2, -0.9); neck.rotation.x = -0.6; g.add(neck);
  g.add(mesh(geo.box, W.camel, 0.25, 0.25, 0.5, 0, 2.4, -1.25));
  for (const [x, z] of [[-0.25, -0.55], [0.25, -0.55], [-0.25, 0.55], [0.25, 0.55]]) g.add(mesh(geo.cyl, W.camel, 0.09, 1.2, 0.09, x, 0.6, z));
  return g;
}
function person(shirtMat) {
  const g = new THREE.Group();
  g.add(mesh(geo.cyl, shirtMat, 0.45, 1.1, 0.45, 0, 1.2, 0));
  g.add(mesh(geo.sphere, mat.person, 0.42, 0.42, 0.42, 0, 2.05, 0));
  return g;
}
// Scenery along both sides of the flight corridor.
function buildSides(theme, rng, L) {
  // Solid ground either side so the water reads as a river, not the open sea.
  const ground = { desert: W.dune, canyon: W.snow, jungle: W.jungle3, fjord: W.fjordGrass }[theme];
  if (ground && theme !== "desert" && theme !== "jungle") for (const side of [-1, 1]) world.add(mesh(geo.box, ground, 260, 1, L + 700, side * (23 + 130), 0.45, -(L + 700) / 2 + 150));
  if (theme === "desert" || theme === "jungle") {
    // the river winds: each bank segment's edge wanders in and out (never into the flight path)
    for (let z = 150; z > -L - 560; z -= 24) for (const side of [-1, 1]) {
      const edge = 23 + Math.sin(z * 0.011 + side * 1.7) * 4 + Math.sin(z * 0.031 + side) * 2;
      world.add(mesh(geo.box, ground, 260, 1, 25, side * (edge + 130), 0.45, z));
      if (theme === "desert" && rng() < 0.5) for (let k = 0; k < 7; k++) { const rd = mesh(geo.cyl, W.reed, 0.07, 2 + rng() * 1.6, 0.07, side * (edge - 0.5 + rng() * 1.5), 1.2, z + (rng() - 0.5) * 12); rd.rotation.z = (rng() - 0.5) * 0.3; world.add(rd); }
    }
  }
  for (let z = -40; z > -L - 260; z -= theme === "canyon" ? 26 : 40) {
    for (const side of [-1, 1]) {
      const x0 = side * (30 + rng() * 8);
      if (theme === "fjord") {
        // Norwegian fjord: towering dark rock walls (snow on the tops), green lower slopes, waterfalls and red cabins
        const h = 75 + rng() * 55, w = 24 + rng() * 12;
        const wall = mesh(geo.cliff, rng() < 0.5 ? W.fjordRock : W.fjordRock2, w, h, w, x0 + side * w * 0.75, h / 2 - 2, z);
        wall.rotation.y = rng() * 3; world.add(wall);
        world.add(mesh(geo.sphereLo, W.fjordGrass, w * 0.55, 6 + rng() * 5, w * 0.9, x0 + side * w * 0.6, 0.5, z + rng() * 10));
        if (rng() < 0.55) {
          const fh = h * (0.55 + rng() * 0.3), fx = x0 - side * (w * 0.12);   // on the face of the wall, facing the fjord
          const fall = mesh(fallsGeo, W.falls, 3 + rng() * 2.5, fh, 1, fx, fh / 2 + 2, z + 8); fall.rotation.y = -side * Math.PI / 2; world.add(fall);
          const foam = mesh(geo.disc, mat.shallow, 4, 4, 1, fx - side * 2, 0.6, z + 8); foam.rotation.x = -Math.PI / 2; world.add(foam);
        }
        if (rng() < 0.6) {
          const c = new THREE.Group();
          c.add(mesh(geo.box, W.cabin, 3.4, 2.6, 4.4, 0, 1.3, 0));
          const roof = mesh(roofGeo, W.roofDark, 2.5, 1.5, 4.7, 0, 3.3, 0); c.add(roof);
          c.add(mesh(geo.box, W.whitewash, 0.9, 0.9, 0.08, 0, 1.5, 2.22));
          c.position.set(x0 - side * 5.5, 0.95, z + rng() * 15); c.rotation.y = (side > 0 ? -1 : 1) * Math.PI / 2 + (rng() - 0.5) * 0.4; world.add(c);   // on the shore, door facing the water
        }
        for (let i = 0; i < 2; i++) if (rng() < 0.6) { const t = pineTree(4 + rng() * 3, false); t.position.set(x0 + side * (2 + rng() * 6), 1.5, z + rng() * 25); world.add(t); }
      } else if (theme === "canyon") {
        const h = 45 + rng() * 45, w = 18 + rng() * 10;
        const cliff = mesh(geo.cliff, rng() < 0.5 ? W.granite : W.graniteDark, w, h, w, x0 + side * w * 0.6, h / 2 - 2, z);
        cliff.rotation.y = rng() * 3; world.add(cliff);
        world.add(mesh(geo.cap, W.snow, w * 0.57, h * 0.42, w * 0.57, cliff.position.x, h - 2 + h * 0.19, z));
        for (let i = 0; i < 3; i++) if (rng() < 0.7) { const t = pineTree(5 + rng() * 3); t.position.set(x0 - side * (1 + rng() * 5), 0.9, z + rng() * 22); world.add(t); }
        if (rng() < 0.5) world.add(prayerFlags(rng, x0 - side * 4, z + rng() * 10, side));
        if (rng() < 0.12) { const sp = stupa(); sp.position.set(x0 - side * 6, 0.9, z + 6); world.add(sp); }
      } else if (theme === "desert") {
        world.add(mesh(geo.box, W.dune, 26, 2.4, 44, x0 + side * 12, 0.6, z));
        if (rng() < 0.7) world.add(mesh(geo.sphereLo, rng() < 0.5 ? W.dune : W.sandDark, 14 + rng() * 10, 5 + rng() * 5, 16, x0 + side * (24 + rng() * 20), 1, z + rng() * 20));
        if (rng() < 0.35) { for (let i = 0; i < 3; i++) { const p = new THREE.Group(); p.add(mesh(geo.cyl, mat.trunk, 0.25, 5, 0.25, 0, 2.5, 0)); for (let k = 0; k < 5; k++) { const lf = mesh(geo.cone, mat.leaf, 0.5, 2.6, 0.2, 0, 5, 0); lf.rotation.set(1.2, k * 1.26, 0, "YXZ"); p.add(lf); } p.position.set(x0 + side * (3 + i * 2.5), 1.8, z + i * 3); world.add(p); } }
        if (rng() < 0.28) {
          const c = new THREE.Group();
          for (let i = 0; i < 5; i++) { const cm = camel(); cm.position.set(0, 0, i * 3.4); c.add(cm); }
          const guide = person(W.cloth); guide.position.set(0.9, 0, -2.4); c.add(guide);
          c.position.set(x0 - side * 2, 1.8, z); c.scale.setScalar(1.5); world.add(c); S.anim.push({ obj: c, kind: "caravan", z0: z });
        }
      } else if (theme === "jungle") {
        for (let i = 0; i < 6; i++) { const t = jungleTree(rng, 13 + rng() * 14); t.position.set(x0 + side * (i * 5 + rng() * 4), 0, z + rng() * 38); world.add(t); }
        for (let i = 0; i < 4; i++) world.add(mesh(geo.sphereLo, i % 2 ? W.jungle2 : W.jungle1, 2.5 + rng() * 2, 2 + rng() * 1.5, 2.5 + rng() * 2, x0 + side * (rng() * 10 - 3), 1.2, z + rng() * 38));   // understory
        world.add(mesh(geo.box, W.jungle3, 30, 3, 42, x0 + side * 18, 0.5, z));
        if (rng() < 0.16 || (z === -120 && side === 1)) {
          const r = new THREE.Group();
          for (let i = 0; i < 5; i++) r.add(mesh(geo.box, i % 2 ? W.stone : W.moss, 16 - i * 3, 2.6, 16 - i * 3, 0, 1.3 + i * 2.6, 0));
          r.add(mesh(geo.box, W.stone, 2.6, 2.4, 2.6, 0, 14.4, 0));
          r.position.set(x0 + side * 6, 0, z); r.rotation.y = rng(); world.add(r);
        }
      } else if (theme === "arctic") {
        if (rng() < 0.6) { const b = mesh(geo.sphereLo, rng() < 0.5 ? W.snow : W.ice, 10 + rng() * 12, 12 + rng() * 18, 10 + rng() * 10, x0 + side * (20 + rng() * 30), 3, z); b.rotation.y = rng() * 3; world.add(b); }
      }
    }
    if (theme === "arctic") {
      // flat ice floes drifting across the whole sea (decoration)
      for (let i = 0; i < 2; i++) { const f = mesh(geo.slab, rng() < 0.5 ? W.snow : W.ice, 3 + rng() * 6, 0.6, 3 + rng() * 5, (rng() < 0.5 ? -1 : 1) * (18 + rng() * 45), 0.25, z + rng() * 30); f.rotation.y = rng() * 3; world.add(f); }
    }
    if (theme === "jungle" && rng() < 0.7) { const m = new THREE.Sprite(mat.mistS); m.scale.set(40 + rng() * 30, 8 + rng() * 5, 1); m.position.set((rng() * 2 - 1) * 26, 3 + rng() * 3, z); world.add(m); }
  }
  // far horizon
  for (let i = 0; i < 14; i++) {
    const zf = -rng() * L - 200, sx = (rng() < 0.5 ? -1 : 1) * (150 + rng() * 120);
    if (theme === "desert") { const h = 30 + rng() * 40; const py = mesh(pyramidGeo, W.pyramid, h * 1.1, h, h * 1.1, sx, h / 2 - 1, zf); py.rotation.y = Math.PI / 4; world.add(py); }
    else if (theme === "jungle") world.add(mesh(geo.sphereLo, W.jungle3, 70 + rng() * 40, 30 + rng() * 30, 60, sx, 0, zf));
    else { const h = 60 + rng() * 70; world.add(mesh(geo.cone, mat.mountain, 55 + rng() * 40, h, 45, sx, h / 2 - 2, zf)); }
  }
}
// Little patch of land in the corridor that holds a fire.
function buildFireHost(theme, rng, tint) {
  if (theme === "island" || !theme) return buildIsland(rng, tint, false, true, STAGES[S.stage].look);
  const g = new THREE.Group(), r = 7 + rng() * 3;
  const base = { canyon: W.granite, desert: W.dune, jungle: W.jungle3, arctic: W.snow, fjord: W.fjordGrass }[theme];
  g.add(mesh(geo.slab, base, r, 1.6, r * 0.9, 0, 0.2, 0));
  if (theme !== "arctic") { const sh = mesh(geo.disc, mat.shallow, r * 1.5, r * 1.5, 1, 0, 0.15, 0); sh.rotation.x = -Math.PI / 2; g.add(sh); }
  for (let i = 0; i < 3; i++) {
    const a = rng() * 6.3, d = r * 0.7;
    let t;
    if (theme === "canyon") t = pineTree(4 + rng() * 2);
    else if (theme === "fjord") t = pineTree(4 + rng() * 2, false);
    else if (theme === "jungle") t = jungleTree(rng, 5 + rng() * 3);
    else if (theme === "desert") { t = new THREE.Group(); t.add(mesh(geo.sphereLo, M(0x8E8A3A), 1.4, 1, 1.4, 0, 0.8, 0)); }
    else { t = new THREE.Group(); t.add(mesh(geo.cyl, W.barrel, 0.6, 1.3, 0.6, 0, 0.65, 0)); }
    t.position.set(Math.cos(a) * d, 0.9, Math.sin(a) * d); g.add(t);
  }
  g.userData = { r, top: 2 };
  return g;
}
// People to rescue: a raft, a climber on a rock, a felucca, a canoe or an ice floe.
function buildRescue(theme) {
  if (!theme || theme === "island" || theme === "fjord") return buildRaft();
  const g = new THREE.Group(), people = [];
  if (theme === "canyon") { g.add(mesh(geo.sphereLo, W.granite, 3, 1.6, 2.6, 0, 0.4, 0)); const p = person(W.parka); p.scale.setScalar(1.6); p.position.set(0, 1.3, 0); p.add(mesh(geo.sphere, W.helmet, 0.46, 0.3, 0.46, 0, 2.3, 0)); g.add(p); people.push(p); }
  else if (theme === "desert") { g.add(mesh(geo.box, W.canoe, 1.8, 0.8, 5, 0, 0.3, 0)); const sail = mesh(sailGeo, W.sail, 2.2, 6, 0.1, 0, 4, 0.3); sail.rotation.z = 0.15; g.add(sail); const p = person(W.cloth); p.position.set(0, 0.5, -1.4); g.add(p); people.push(p); }
  else if (theme === "jungle") { g.add(mesh(geo.box, W.canoe, 1.3, 0.6, 6, 0, 0.25, 0)); for (const z of [-1.4, 1.2]) { const p = person(z < 0 ? W.cloth : mat.shirt); p.position.set(0, 0.2, z); g.add(p); people.push(p); } }
  else { g.add(mesh(geo.slab, W.snow, 4.5, 0.8, 4, 0, 0.3, 0)); for (const x of [-1.2, 1.2]) { const p = person(W.parka); p.scale.setScalar(1.8); p.position.set(x, 0.6, 0); g.add(p); people.push(p); } }
  const arm = mesh(geo.cyl, mat.person, 0.13, 1, 0.13, 0.5, 2.1, 0); people[0].add(arm);
  const beacon = mesh(geo.sphere, new THREE.MeshBasicMaterial({ color: 0xFF3B30 }), 0.3, 0.3, 0.3, -1.4, 1.2, 0); g.add(beacon);
  const pole = mesh(geo.cyl, mat.white, 0.08, 3.2, 0.08, 1.6, 2.2, 0); g.add(pole);
  const flag = mesh(geo.box, new THREE.MeshBasicMaterial({ color: 0xFF7A00 }), 1.3, 0.8, 0.06, 2.25, 3.4, 0); g.add(flag);
  g.userData = { arm, beacon, flag, people };
  g.scale.setScalar(1.9);
  return g;
}
// Obstacles: ice pillars, sandstone hoodoos, giant trees, icebergs.
function buildObstacle(theme, rng) {
  if (!theme || theme === "island" || theme === "fjord") return buildStack(rng, theme === "fjord" ? "fjord" : STAGES[S.stage].look);
  const g = new THREE.Group();
  const h = 20 + rng() * 14, r = 2.6 + rng() * 1.6;
  if (theme === "canyon") { g.add(mesh(geo.pillar, W.iceDeep, r * 0.95, h, r * 0.95, 0, h / 2 - 1, 0)); g.add(mesh(geo.cone, W.snow, r, 2.5, r, 0, h, 0)); }
  else if (theme === "desert") { const ob = mesh(obeliskGeo, W.obelisk, r * 0.8, h, r * 0.8, 0, h / 2 - 1, 0); ob.rotation.y = Math.PI / 4; g.add(ob); const tip = mesh(pyramidGeo, W.gold, r * 0.58, r * 1.1, r * 0.58, 0, h - 1 + r * 0.55, 0); tip.rotation.y = Math.PI / 4; g.add(tip); g.add(mesh(geo.box, W.obelisk, r * 2.2, 1.6, r * 2.2, 0, 0.5, 0)); }
  else if (theme === "jungle") { g.add(mesh(geo.cyl, W.bark, r * 0.6, h, r * 0.6, 0, h / 2 - 1, 0)); g.add(mesh(geo.sphereLo, W.jungle2, r * 3, r * 1.6, r * 3, 0, h, 0)); }
  else { const b = mesh(geo.sphereLo, W.snow, r * 1.6, h * 0.6, r * 1.4, 0, h * 0.25, 0); b.rotation.y = rng() * 3; g.add(b); g.add(mesh(geo.sphereLo, W.ice, r * 1.2, h * 0.3, r, 0.5, h * 0.55, 0)); }
  g.userData = { r: r * 1.05, h };
  return g;
}
// Weather drifting around the camera: snow, desert dust, jungle mist.
function weather(theme, dt) {
  const hz = -S.dist;
  updateRain(dt);
  if (theme === "canyon" || theme === "arctic") {
    const n = theme === "canyon" ? 3 : 1;
    for (let i = 0; i < n; i++) if (Math.random() < dt * 40) spawn(mat.flakeP, V(S.x + (Math.random() - 0.5) * 40, S.y + 4 + Math.random() * 10, hz - 22 - Math.random() * 60), V((Math.random() - 0.5) * 3, -5, 2), 1.3, 0.12);
  } else if (theme === "desert") {
    if (Math.random() < dt * 6) spawn(mat.dustP, V(S.x + (Math.random() - 0.5) * 60, 1 + Math.random() * 3, hz - 20 - Math.random() * 60), V(6 + Math.random() * 4, 0.5, 0), 3, 1.6, 2);
  }
}

/* ---------------- lightning bolt (Caribbean storm) ---------------- */
const bolt = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xF4F8FF, transparent: true, opacity: 0, fog: false }));
bolt.visible = false; scene.add(bolt);
function strike(hz) {
  const pts = [], x = (Math.random() < 0.5 ? -1 : 1) * (25 + Math.random() * 60), z = hz - 120 - Math.random() * 120;
  let px = x, py = 70;
  while (py > 0) { pts.push(new THREE.Vector3(px, py, z)); py -= 6 + Math.random() * 8; px += (Math.random() - 0.5) * 9; }
  pts.push(new THREE.Vector3(px, 0, z));
  bolt.geometry.dispose(); bolt.geometry = new THREE.BufferGeometry().setFromPoints(pts);
  bolt.material.opacity = 1; bolt.visible = true;
}

/* ---------------- rain (Caribbean storm) ---------------- */
const rainMat = new THREE.MeshBasicMaterial({ color: 0xD5E2EC, transparent: true, opacity: 0.35, depthWrite: false, fog: false });
const rain = [];
for (let i = 0; i < 90; i++) { const d = new THREE.Mesh(geo.box, rainMat); d.scale.set(0.035, 1.6, 0.035); d.visible = false; scene.add(d); rain.push({ m: d, x: 0, y: 0, z: 0 }); }
function updateRain(dt) {
  const on = STAGES[S.stage] && STAGES[S.stage].look === "tropic";
  for (const r of rain) {
    r.m.visible = on && S.mode === "play";
    if (!on) continue;
    r.y -= 55 * dt;
    if (r.y < 0 || Math.abs(r.x - S.x) > 30 || r.z > -S.dist + 12 || r.z < -S.dist - 70) {
      r.x = S.x + (Math.random() - 0.5) * 50; r.y = 8 + Math.random() * 22; r.z = -S.dist + 10 - Math.random() * 75;
    }
    r.m.position.set(r.x, r.y, r.z); r.m.rotation.x = -0.35;   // slanted by the wind and our speed
  }
}

/* ---------------- sky: physically-inspired dome ---------------- */
// Gradient atmosphere + sun disc/halo + drifting fbm clouds projected on a cloud plane.
// The same dome is baked into an environment map, so the water and every object reflect the sky.
const SKY_SUN = new THREE.Vector3(-0.42, 0.2, -1).normalize();   // visible sun, ahead-left, low
const skyU = {
  top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() },
  sunDir: { value: SKY_SUN }, sunCol: { value: new THREE.Color() },
  cloudCol: { value: new THREE.Color() }, cloudShade: { value: new THREE.Color() },
  cover: { value: 0.45 }, time: { value: 0 }, sunSize: { value: 1 }, tCloud: { value: CLOUD_TEX }
};
const skyMat = new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
  vertexShader: `varying vec3 vDir;
    void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
  fragmentShader: `uniform vec3 top, horizon, sunDir, sunCol, cloudCol, cloudShade; uniform float cover, time, sunSize; uniform sampler2D tCloud;
    varying vec3 vDir;
    float fbm(vec2 p) { return (texture2D(tCloud, p * 0.3).r - 0.5) * 1.5 + 0.5; }
    void main() {
      vec3 d = normalize(vDir);
      float h = clamp(d.y, 0.0, 1.0);
      vec3 col = mix(horizon, top, 1.0 - exp(-h * 9.0));        // pale haze only in a thin band above the horizon
      col = mix(col, horizon * 1.04, exp(-h * 30.0) * 0.5);             // bright haze band at the horizon
      float sd = max(dot(d, sunDir), 0.0);
      vec3 sunLight = sunCol * (pow(sd, 4000.0 / sunSize) * 12.0 + pow(sd, 220.0) * 0.3 + pow(sd, 10.0) * 0.06);
      if (d.y > 0.004) {
        vec2 uv = d.xz / (d.y + 0.14) * 0.42 + vec2(time * 0.008, time * 0.003);
        float n = fbm(uv);
        float c = smoothstep(1.0 - cover, 1.0 - cover + 0.16, n);
        float toward = fbm(uv + sunDir.xz * 0.12);                        // denser toward the sun = shaded
        float lit = clamp(0.85 - (toward - n) * 4.0 + (n - 0.6) * 1.2, 0.0, 1.0);
        vec3 cc = mix(cloudShade, cloudCol, lit) + sunCol * pow(sd, 10.0) * 0.5 * (1.0 - c * 0.6);
        float fade = smoothstep(0.02, 0.2, d.y);
        col = mix(col + sunLight, cc, c * fade * 0.96);
      } else col += sunLight;
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
});
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), skyMat);
skyDome.renderOrder = -1000; skyDome.frustumCulled = false;
scene.add(skyDome);
// A warm rim light from the visible sun (no shadows): back-lights edges and makes the sun path glint on the water.
const rimSun = new THREE.DirectionalLight(0xFFE2B8, 0.9);
rimSun.position.copy(SKY_SUN).multiplyScalar(100); scene.add(rimSun);
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene(), envDome = new THREE.Mesh(skyDome.geometry, skyMat);
envScene.add(envDome);
let envRT = null;
const SKY_LOOK = {
  island: { cover: 0.36, cloud: 0xFFFFFF, shade: 0xB8C4D2 },
  storm: { cover: 0.82, cloud: 0xC4CCD4, shade: 0x5E6873 },
  canyon: { cover: 0.4, cloud: 0xFFFFFF, shade: 0xAFBBC8 },
  desert: { cover: 0.16, cloud: 0xFFF6E8, shade: 0xD8C0A0 },
  jungle: { cover: 0.42, cloud: 0xF4F8F4, shade: 0xA9B8B0 },
  fjord: { cover: 0.5, cloud: 0xF4F6F8, shade: 0x9DA9B4 },
  arctic: { cover: 0.38, cloud: 0xFFFFFF, shade: 0xB3C3D3 }
};
function setSky(st, storm) {
  const L = SKY_LOOK[storm ? "storm" : st.theme || "island"];
  skyU.top.value.set(st.sky[0]);
  if (!storm) skyU.top.value.lerp(new THREE.Color(0x3F93E6), 0.6);   // deeper, truer blue overhead
  // horizon = the stage haze nudged towards sky blue; fog uses the same colour so distance melts into the sky
  skyU.horizon.value.setHex(st.fog).lerp(new THREE.Color(st.sky[0]), storm ? 0.1 : 0.5);
  if (scene.fog) scene.fog.color.copy(skyU.horizon.value);
  skyU.sunCol.value.setHex(st.sun).multiplyScalar(storm ? 0.35 : 1);
  skyU.cloudCol.value.setHex(L.cloud); skyU.cloudShade.value.setHex(L.shade);
  skyU.cover.value = L.cover; skyU.sunSize.value = storm ? 0.4 : 1;
  rimSun.intensity = storm ? 0.25 : 0.9;
  // bake the sky into an environment map for reflections + soft image-based light
  if (envRT) envRT.dispose();
  envRT = pmrem.fromScene(envScene, 0, 0.1, 1000);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.6;
  scene.background = null;
}

/* ---------------- water ---------------- */
// Smooth rolling swell (vertex waves) + a tiling ripple normal map for small-scale glitter,
// on a physically based surface (IOR 1.33) that reflects the sky: dark straight down, bright towards the horizon.
const WATER_W = 520, WATER_D = 760, RIPPLE_TILE = 44;
function rippleNormalTex(seed, tile) {
  const N = 512, c = document.createElement("canvas"); c.width = c.height = N;
  const g = c.getContext("2d"), img = g.createImageData(N, N), d = img.data;
  const rng = GE.rng(seed), waves = [];
  for (let i = 0; i < 26; i++) {
    const k = 2 + i * 1.6, kx = Math.round((rng() * 2 - 1) * k), ky = Math.round((rng() * 2 - 1) * k) || 1;
    waves.push({ kx, ky, a: 1 / (1 + i * 0.45), ph: rng() * 6.283 });
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let dx = 0, dy = 0;
    for (const w of waves) { const t = 6.283 * (w.kx * x + w.ky * y) / N + w.ph, c2 = Math.cos(t) * w.a; dx += c2 * w.kx; dy += c2 * w.ky; }
    const nx = -dx * 0.028, ny = -dy * 0.028, l = Math.hypot(nx, ny, 1), o = (y * N + x) * 4;
    d[o] = (nx / l * 0.5 + 0.5) * 255; d[o + 1] = (ny / l * 0.5 + 0.5) * 255; d[o + 2] = (1 / l * 0.5 + 0.5) * 255; d[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(WATER_W / tile, WATER_D / tile);
  tex.anisotropy = 4;
  return tex;
}
const waterGeo = new THREE.PlaneGeometry(WATER_W, WATER_D, 64, 96);
waterGeo.rotateX(-Math.PI / 2);
const waterBase = Float32Array.from(waterGeo.attributes.position.array);
const rippleTex = rippleNormalTex(42, RIPPLE_TILE);
const waterMat = new THREE.MeshStandardMaterial({
  color: 0xD2D2D2, vertexColors: true, roughness: 0.07, metalness: 0,
  normalMap: rippleTex, normalScale: new THREE.Vector2(0.3, 0.3), envMapIntensity: 1.2
});
waterGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(waterGeo.attributes.position.count * 3), 3));
const seaCol = new THREE.Color(0x1FB5C7), seaDeep = new THREE.Color(0x118CA6), seaCrest = new THREE.Color(0xCFF6F4), tmpCol = new THREE.Color();
const water = new THREE.Mesh(waterGeo, waterMat);
water.receiveShadow = true;
scene.add(water);
function updateWater(time, cx, cz) {
  // Snap to a grid (so vertices don't swim) and keep the ripple texture anchored to the world.
  const sx = Math.round(cx / 8) * 8, sz = Math.round((cz - WATER_D * 0.38) / 8) * 8;
  water.position.set(sx, 0, sz);
  rippleTex.offset.set((sx / RIPPLE_TILE + time * 0.014) % 1, (-sz / RIPPLE_TILE + time * 0.022) % 1);
  const p = waterGeo.attributes.position.array, col = waterGeo.attributes.color.array;
  for (let i = 0; i < p.length; i += 3) {
    const x = waterBase[i] + sx, z = waterBase[i + 2] + sz;
    // a few crossing swells, sharpened at the crests like real waves
    const s1 = Math.sin(x * 0.075 + z * 0.02 + time * 1.3), s2 = Math.sin(z * 0.06 - x * 0.03 + time * 1.05), s3 = Math.sin((x + z) * 0.17 + time * 2.1);
    const h = (1 - Math.abs(s1)) * -0.5 + s1 * 0.12 + s2 * 0.32 + s3 * 0.1;
    p[i + 1] = h;
    const k = Math.min(1, Math.max(0, (h + 0.75) / 1.3));   // 0 trough .. 1 crest
    tmpCol.copy(seaDeep).lerp(seaCol, Math.pow(k, 1.3));
    if (k > 0.9) tmpCol.lerp(seaCrest, (k - 0.9) * 3);        // thin foamy caps
    col[i] = tmpCol.r; col[i + 1] = tmpCol.g; col[i + 2] = tmpCol.b;
  }
  waterGeo.attributes.color.needsUpdate = true;
  waterGeo.attributes.position.needsUpdate = true;
  waterGeo.computeVertexNormals();
}

/* ---------------- particles ---------------- */
const parts = [];
function spawn(material, pos, vel, life, size, grow = 0) {
  let p = parts.find((q) => !q.alive && q.mat === material);
  if (!p) {
    if (parts.length > 260) return;
    const sprite = !!material.isSpriteMaterial;
    const mesh = sprite ? new THREE.Sprite(material) : new THREE.Mesh(geo.sphereLo, material);
    scene.add(mesh);
    p = { mesh, mat: material, alive: false, k: sprite ? 2.4 : 1 };  // sprites are sized by diameter
    parts.push(p);
  }
  p.alive = true; p.t = 0; p.life = life; p.size = size; p.grow = grow;
  p.mesh.visible = true; p.mesh.position.copy(pos); p.vel = vel.clone(); p.mesh.scale.setScalar(size * p.k);
}
function updateParts(dt) {
  for (const p of parts) {
    if (!p.alive) continue;
    p.t += dt;
    if (p.t >= p.life) { p.alive = false; p.mesh.visible = false; continue; }
    p.mesh.position.addScaledVector(p.vel, dt);
    const k = p.t / p.life;
    p.mesh.scale.setScalar(Math.max(0.01, p.k * p.size * (1 + p.grow * k) * (1 - k * 0.6)));
  }
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Expanding, fading ring pulse placed in the world (ring pickups, bomb splashes).
const bursts = [];
function burst(x, y, z, color, flat) {
  let b = bursts.find((q) => !q.alive);
  if (!b) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.22, 6, 32), new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, fog: false }));
    scene.add(m); b = { m, alive: false }; bursts.push(b);
  }
  b.alive = true; b.t = 0; b.m.visible = true; b.m.material.color.setHex(color);
  b.m.position.set(x, y, z); b.m.rotation.set(flat ? -Math.PI / 2 : 0, 0, 0);
}
function updateBursts(dt) {
  for (const b of bursts) {
    if (!b.alive) continue;
    b.t += dt;
    const k = b.t / 0.3;
    if (k >= 1) { b.alive = false; b.m.visible = false; continue; }
    b.m.scale.setScalar(1 + k * 1.6);
    b.m.material.opacity = 0.9 * (1 - k);
  }
}

/* ---------------- game state ---------------- */
const heli = buildHeli();
scene.add(heli);
const shadow = new THREE.Mesh(geo.disc, mat.shadow); shadow.rotation.x = -Math.PI / 2; shadow.scale.set(2.2, 3.2, 1); scene.add(shadow);
const reticle = new THREE.Mesh(geo.reticle, mat.reticle); reticle.rotation.x = -Math.PI / 2; scene.add(reticle);
const world = new THREE.Group(); scene.add(world);
const streaks = [];
for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(geo.box, mat.streak); s.scale.set(0.035, 0.035, 3); scene.add(s); streaks.push(s); }

const save = GE.load(SAVE_KEY, { unlocked: 1, stars: [0, 0, 0] });
const look = Object.assign({}, DEFAULT_LOOK, save.heli || {});
buildHeli(look, heli);
const S = {
  mode: "title", stage: 0, time: 0, dist: 0, speed: 30,
  x: 0, y: 9, vx: 0, vy: 0, bank: 0, pitch: 0,
  hearts: 3, inv: 0, tank: TANK_MAX, score: 0, dropCd: 0,
  fires: [], rafts: [], rings: [], stacks: [], birds: [], clouds: [], islands: [], bombs: [], anim: [],
  put: 0, saved: 0, ringsHit: 0, totals: { f: 0, r: 0, g: 0 },
  shake: 0, flash: 0, slow: 0, refilling: false, bannerT: 0, lightning: 0, ended: false
};
const input = { x: 0, y: 0, drop: false, stickX: 0, stickY: 0, keys: {} };
let bot = false;
let bannerTimer = 0;
let hangarT = 0, portraitView = false;

const LOOP_DUR = 1.25;
// Hitbox matches the visible airframe (body + skids + inner rotor), in world units.
const HITBOX = { half: 2.6, front: 3.2, back: 4.5, below: 2.2 };
const HIT_GRACE = 0.15;

/* ---------------- stage generation ---------------- */
function clearWorld() {
  for (const c of [...world.children]) world.remove(c);
  for (const p of parts) { p.alive = false; p.mesh.visible = false; }
  S.fires = []; S.rafts = []; S.rings = []; S.stacks = []; S.birds = []; S.clouds = []; S.islands = []; S.bombs = []; S.anim = [];
}
function startStage(n) {
  const st = STAGES[n];
  clearWorld();
  const rng = GE.rng(1000 + n * 77);
  Object.assign(S, { mode: "play", stage: n, time: 0, dist: 0, speed: st.speed, x: 0, y: 9, vx: 0, vy: 0, bank: 0, pitch: 0,
    hearts: 3, hits: 0, inv: 0, tank: TANK_MAX, score: 0, dropCd: 0, put: 0, saved: 0, ringsHit: 0, shake: 0, flash: 0, slow: 0, ended: false,
    hitLog: [], bankV: 0, yaw: 0, loopT: -1, loopCd: 0, loops: 0, lift: 0, loopPitch: 0, speedStep: 0, washT: 0 });
  scene.fog = new THREE.Fog(st.fog, 110, 540);
  seaCol.setHex(st.sea); seaDeep.setHex(st.deep);
  sun.color.setHex(st.sun);
  setSky(st, n === 2);
  sun.intensity = n === 2 ? 1.5 : 2.0;
  hemi.intensity = n === 2 ? 0.5 : 0.45;   // the sky environment map now provides most of the ambient light

  const L = st.length;
  const theme = st.theme || "island";
  if (theme !== "island") buildSides(theme, rng, L);
  // Distant mountains on the horizon (decoration)
  // Greek islands: dry brown hills; Caribbean: green volcanic peaks (neither has snow)
  const mtMat = st.look === "aegean" ? W.mtDry : st.look === "tropic" ? W.mtTropic : mat.mountain;
  for (let i = 0; i < (theme === "island" ? 18 : 0); i++) {
    const m = new THREE.Mesh(geo.cone, mtMat);
    const h = (st.look === "aegean" ? 25 : 40) + rng() * (st.look === "aegean" ? 35 : 60);
    m.scale.set(50 + rng() * 40, h, 40);
    m.position.set((rng() < 0.5 ? -1 : 1) * (160 + rng() * 120), h / 2 - 2, -rng() * L - 200);
    world.add(m);
  }
  // Decorative islands on both sides
  for (let z = -120; theme === "island" && z > -L - 200; z -= 70 + rng() * 60) {
    for (const side of [-1, 1]) {
      if (rng() < 0.7) {
        const isl = buildIsland(rng, st.islandTint, true, false, st.look, side > 0 ? Math.PI : 0);
        isl.position.set(side * (48 + rng() * 60), 0, z + rng() * 30);
        world.add(isl); S.islands.push(isl);
      }
    }
  }
  const lane = () => (rng() * 2 - 1) * (BOX.x - 3);
  const slots = (count, from, to) => Array.from({ length: count }, (_, i) => from + (to - from) * ((i + 0.3 + rng() * 0.4) / count));
  // Fires on small islands inside the flight corridor
  for (const z of slots(st.fires, -260, -L + 150)) {
    const isl = buildFireHost(theme, rng, st.islandTint);
    const x = lane();
    isl.position.set(x, 0, z);
    world.add(isl); S.islands.push(isl);
    const f = buildFire();
    f.position.set(x, 0.9, z);
    world.add(f);
    S.fires.push({ obj: f, x, z, out: false, smokeT: 0 });
  }
  for (const z of slots(st.rafts, -190, -L + 120)) {
    const r = buildRescue(theme); const x = lane();
    r.position.set(x, 0, z); world.add(r);
    S.rafts.push({ obj: r, x, z, saved: false });
  }
  for (const z of slots(st.rings, -180, -L + 100)) {
    const r = new THREE.Mesh(geo.ring, mat.ring); const x = lane() * 0.8, y = 5 + rng() * 10;
    r.position.set(x, y, z); world.add(r);
    S.rings.push({ obj: r, x, y, z, hit: false });
  }
  for (const z of slots(st.stacks, -400, -L + 200)) {
    const s = buildObstacle(theme, rng); const x = lane();
    // keep stacks away from fires/rafts so every target stays reachable
    const tooClose = S.fires.concat(S.rafts).some((o) => Math.abs(o.z - z) < 40 && Math.abs(o.x - x) < 10);
    s.position.set(tooClose ? -x : x, 0, z); world.add(s);
    S.stacks.push({ obj: s, x: s.position.x, z, r: s.userData.r, h: s.userData.h, hit: false });
  }
  for (const z of slots(st.birds, -500, -L + 250)) {
    const b = buildBirds(theme); const x = lane(), y = 7 + rng() * 8;
    b.position.set(x, y, z); world.add(b);
    S.birds.push({ obj: b, x, y, z, hit: false, phase: rng() * 6 });
  }
  for (const z of slots(st.clouds, -450, -L + 200)) {
    const c = buildCloud(rng, theme === "desert" ? W.dust : theme === "arctic" ? W.fog : null); const x = lane(), y = 8 + rng() * 9;
    c.position.set(x, y, z); world.add(c);
    S.clouds.push({ obj: c, x, y, z, hit: false });
  }
  // Rescue ship with helipad at the end
  const ship = new THREE.Group();
  const hull = new THREE.Mesh(geo.box, mat.white); hull.scale.set(18, 4, 40); hull.position.y = 1; ship.add(hull);
  const pad = new THREE.Mesh(geo.cyl, M(0x2E7D32)); pad.scale.set(7, 0.3, 7); pad.position.set(0, 3.2, 8); ship.add(pad);
  const hMark = new THREE.Mesh(geo.box, mat.white); hMark.scale.set(1, 0.35, 6); hMark.position.set(0, 3.4, 8); ship.add(hMark);
  const bridge = new THREE.Mesh(geo.box, mat.red); bridge.scale.set(10, 7, 8); bridge.position.set(0, 6.5, -10); ship.add(bridge);
  ship.position.set(0, 0, -L - 30); world.add(ship);
  S.totals = { f: S.fires.length, r: S.rafts.length, g: S.rings.length };
  world.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
  snapCamera();
  // compile every shader now, while the stage loads, so the first seconds of flight never stutter
  camera.position.copy(camPos); camera.lookAt(camLook);
  try { renderer.compile(scene, camera); } catch (e) { /* optional warm-up */ }
  showBanner(t("stage", { n: n + 1 }) + " · " + t(st.key), t("go"));
  setScreen(null);
  $("hud").hidden = false;
  GE.sfx("event");
}

/* ---------------- input ---------------- */
const KEYMAP = { ArrowLeft: "l", KeyA: "l", ArrowRight: "r", KeyD: "r", ArrowUp: "u", KeyW: "u", ArrowDown: "d", KeyS: "d" };
addEventListener("keydown", (e) => {
  if (KEYMAP[e.code]) { input.keys[KEYMAP[e.code]] = true; e.preventDefault(); }
  if (e.code === "Space") { input.drop = true; e.preventDefault(); }
  if (e.code === "KeyL" || e.code === "ShiftLeft" || e.code === "ShiftRight") { input.loop = true; e.preventDefault(); }
  if (e.code === "Escape" || e.code === "KeyP") togglePause();
});
addEventListener("keyup", (e) => {
  if (KEYMAP[e.code]) input.keys[KEYMAP[e.code]] = false;
  if (e.code === "Space") input.drop = false;
});
const stick = $("stick"), knob = $("stick-knob");
let stickId = null, stickC = null;
stick.addEventListener("pointerdown", (e) => { stickId = e.pointerId; const r = stick.getBoundingClientRect(); stickC = { x: r.left + r.width / 2, y: r.top + r.height / 2, R: r.width / 2 }; try { stick.setPointerCapture(e.pointerId); } catch (err) { /* synthetic or lost pointer */ } moveStick(e); });
stick.addEventListener("pointermove", (e) => { if (e.pointerId === stickId) moveStick(e); });
const endStick = (e) => { if (e.pointerId !== stickId) return; stickId = null; input.stickX = input.stickY = 0; knob.style.transform = ""; };
stick.addEventListener("pointerup", endStick); stick.addEventListener("pointercancel", endStick);
function moveStick(e) {
  let dx = (e.clientX - stickC.x) / stickC.R, dy = (e.clientY - stickC.y) / stickC.R;
  const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
  input.stickX = dx; input.stickY = -dy;
  knob.style.transform = `translate(${dx * 36}px, ${-input.stickY * 36}px)`;
}
const loopBtn = $("btn-loop");
loopBtn.addEventListener("pointerdown", (e) => { input.loop = true; loopBtn.classList.add("on"); e.preventDefault(); });
const loopUp = () => loopBtn.classList.remove("on");
loopBtn.addEventListener("pointerup", loopUp); loopBtn.addEventListener("pointercancel", loopUp); loopBtn.addEventListener("pointerleave", loopUp);
const dropBtn = $("btn-drop");
dropBtn.addEventListener("pointerdown", (e) => { input.drop = true; dropBtn.classList.add("on"); e.preventDefault(); });
const dropUp = () => { input.drop = false; dropBtn.classList.remove("on"); };
dropBtn.addEventListener("pointerup", dropUp); dropBtn.addEventListener("pointercancel", dropUp); dropBtn.addEventListener("pointerleave", dropUp);

/* ---------------- autopilot (tests + demo) ---------------- */
function botInput() {
  // Look ahead for the nearest useful target and steer towards it, avoiding hazards.
  const ahead = (o) => o.z < -S.dist - 6 && o.z > -S.dist - 140;
  let tx = 0, ty = 10;
  const fire = S.fires.find((f) => !f.out && ahead(f));
  const raft = S.rafts.find((r) => !r.saved && ahead(r));
  const ring = S.rings.find((r) => !r.hit && ahead(r));
  const cands = [fire && { x: fire.x, y: 9, z: fire.z, k: "f" }, raft && { x: raft.x, y: 3.2, z: raft.z, k: "r" }, ring && { x: ring.x, y: ring.y, z: ring.z, k: "g" }].filter(Boolean);
  cands.sort((a, b) => b.z - a.z);
  let goal = cands[0];
  if (S.tank < 2 && (!goal || goal.k !== "r")) goal = { x: S.x, y: 3, z: -S.dist - 50, k: "w" };
  if (goal) { tx = goal.x; ty = goal.y; }
  // Dodge hazards nearest-first, always to a side that stays inside the flight box.
  const reach = Math.max(60, S.speed * 1.6);
  const hazards = S.stacks.concat(S.birds, S.clouds).filter((h) => !h.hit && h.z < -S.dist + 3 && h.z > -S.dist - reach).sort((a, b) => b.z - a.z);
  for (const h of hazards) {
    const hr = (h.r || 5) + HITBOX.half + 1.4;
    if (h.y != null && Math.abs(ty - h.y) >= 5) continue;       // passing over/under it already
    if (Math.abs(tx - h.x) < hr) {
      const sides = [h.x - hr, h.x + hr].filter((v) => Math.abs(v) <= BOX.x - 0.5);
      tx = sides.length ? sides.sort((p, q) => Math.abs(p - S.x) - Math.abs(q - S.x))[0] : (h.x > 0 ? -BOX.x : BOX.x);
      if (h.y != null) ty = h.y > 10 ? 4 : h.y + 7;
    }
  }
  let drop = false;
  if (fire) {
    const land = predictLanding();
    drop = Math.hypot(land.x - fire.x, land.z - fire.z) < 4;
  }
  return { x: Math.max(-1, Math.min(1, (tx - S.x) / 5)), y: Math.max(-1, Math.min(1, (ty - S.y) / 4)), drop };
}

/* ---------------- simulation ---------------- */
function predictLanding() {
  // Bomb: starts at the heli, forward speed = heli speed, falls with g = 30.
  const vy0 = -4, g = 30, y0 = S.y - 1.2, groundY = 2.5;
  const tFall = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * (y0 - groundY))) / g;
  return { x: S.x + S.vx * tFall, z: -S.dist - 2 - S.speed * 0.92 * tFall, t: tFall };
}

function step(dt) {
  if (S.mode !== "play") return;
  if (S.slow > 0) { S.slow -= dt; dt *= 0.35; }
  S.time += dt;
  const st = STAGES[S.stage];
  let ix, iy, drop;
  if (bot) { const b = botInput(); ix = b.x; iy = b.y; drop = b.drop; }
  else {
    ix = (input.keys.r ? 1 : 0) - (input.keys.l ? 1 : 0) + input.stickX + input.x;
    iy = (input.keys.u ? 1 : 0) - (input.keys.d ? 1 : 0) + input.stickY + input.y;
    drop = input.drop;
  }
  ix = Math.max(-1, Math.min(1, ix)); iy = Math.max(-1, Math.min(1, iy));
  // Weighty lateral/vertical response
  S.vx += (ix * 17 - S.vx) * Math.min(1, dt * (ix ? 4.5 : 6.5));
  S.vy += (iy * 11 - S.vy) * Math.min(1, dt * 4.5);
  S.x = Math.max(-BOX.x, Math.min(BOX.x, S.x + S.vx * dt));
  S.y = Math.max(BOX.yMin, Math.min(BOX.yMax, S.y + S.vy * dt));
  if (S.stage === 2) S.x += Math.sin(S.time * 0.7) * 1.4 * dt; // storm wind
  // Bank on a spring (slight overshoot, then settles) — feels like a real airframe.
  const bankTarget = -S.vx / 17 * 0.85;
  S.bankV += ((bankTarget - S.bank) * 70 - S.bankV * 11) * dt;
  S.bank += S.bankV * dt;
  S.yaw += (-S.vx * 0.013 - S.yaw) * Math.min(1, dt * 5); // nose turns into the turn
  // Speed ramps up through the stage (+55% by the end).
  const prog = Math.min(1, S.dist / st.length);
  const target = st.speed * (1 + 0.55 * prog);
  const accel = target - S.speed;
  S.speed += accel * Math.min(1, dt * 1.5);
  S.pitch += (S.vy / 11 * 0.18 - 0.07 - accel * 0.02 - S.pitch) * Math.min(1, dt * 6); // nose down to fly forward, dips more when speeding up
  const stepNow = Math.floor(prog * 3);
  if (stepNow > S.speedStep && stepNow < 3) { S.speedStep = stepNow; showBanner(t("faster")); GE.sfx("upgrade"); }
  // Loop-the-loop stunt
  S.loopCd = Math.max(0, S.loopCd - dt);
  if (input.loop && S.loopT < 0 && S.loopCd <= 0 && !bot) { S.loopT = 0; GE.sfx("sail"); }
  input.loop = false;
  if (S.loopT >= 0) {
    S.loopT += dt;
    const k = Math.min(1, S.loopT / LOOP_DUR);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // ease in-out
    S.loopPitch = e * Math.PI * 2;                 // nose up, over the top, back level
    S.lift = Math.sin(Math.PI * k) * 9;            // climbs over the top of the loop
    if (k >= 1) {
      S.loopT = -1; S.loopPitch = 0; S.lift = 0; S.loopCd = 1.2; S.loops++; S.score += 100;
      showBanner(t("loop"), "+100"); GE.sfx("win");
      burst(S.x, S.y, -S.dist - 4, 0xFFFFFF);
    }
  }
  S.dist += S.speed * dt;
  const hz = -S.dist;
  S.inv = Math.max(0, S.inv - dt);
  S.dropCd = Math.max(0, S.dropCd - dt);
  S.shake = Math.max(0, S.shake - dt * 1.6);
  S.flash = Math.max(0, S.flash - dt * 4.5);

  // Refill: skim the sea
  const overIsland = S.islands.some((i) => Math.hypot(i.position.x - S.x, i.position.z - hz) < i.userData.r);
  S.refilling = S.y < 4.2 && !overIsland && S.tank < TANK_MAX;
  if (S.refilling) {
    S.tank = Math.min(TANK_MAX, S.tank + dt * 3.2);
    if (Math.random() < 0.7) spawn(mat.drop, V(S.x + (Math.random() - 0.5) * 3, 0.4, hz + 1.5), V((Math.random() - 0.5) * 6, 5 + Math.random() * 4, 10), 0.6, 0.35);
  }

  // Rotor downwash: spray and ripples on the water when flying low
  const washK = Math.max(0, (8.5 - S.y) / 6);
  if (washK > 0 && !overIsland && S.lift < 1) {
    const n = Math.random() < washK ? 2 : 0;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = 2.5 + Math.random() * 1.5;
      spawn(mat.spray, V(S.x + Math.cos(a) * r, 0.35, hz + Math.sin(a) * r), V(Math.cos(a) * 9 * washK, 1.5 + Math.random() * 2, Math.sin(a) * 9 * washK + S.speed * 0.2), 0.55, 0.28, 0.5);
    }
    S.washT -= dt;
    if (S.washT <= 0) { S.washT = 0.28; burst(S.x, 0.35, hz, 0xE6FBFF, true); }
  }

  // Drop water bombs
  if (drop && S.dropCd <= 0) {
    if (S.tank >= 1) {
      S.tank -= 1; S.dropCd = 0.32 * Math.min(1, 30 / S.speed);   // keep bombs ~10 m apart even at top speed, so a fire can't slip between two splashes
      const m = new THREE.Mesh(geo.sphere, mat.water); m.scale.set(1.1, 1.4, 1.1);
      m.position.set(S.x, S.y - 1.2, hz - 2); scene.add(m);
      S.bombs.push({ m, vx: S.vx, vy: -4, vz: -S.speed * 0.92 });
      GE.sfx("tap");
    } else if (!S.warnedEmpty) { S.warnedEmpty = true; showBanner(t("empty")); GE.sfx("whoops"); }
  }
  if (S.tank >= 1) S.warnedEmpty = false;
  for (const b of S.bombs) {
    b.vy -= 30 * dt;
    b.m.position.x += b.vx * dt; b.m.position.y += b.vy * dt; b.m.position.z += b.vz * dt;
    if (b.m.position.y < 2.5) {
      b.dead = true;
      const p = b.m.position;
      for (let i = 0; i < 18; i++) spawn(mat.drop, p.clone(), V((Math.random() - 0.5) * 12, 6 + Math.random() * 9, (Math.random() - 0.5) * 12), 0.7, 0.6);
      burst(p.x, 2.8, p.z, 0x8FE3FF, true);
      for (const f of S.fires) {
        if (!f.out && Math.hypot(f.x - p.x, f.z - p.z) < 6.5) {
          f.out = true; S.put++; S.score += 150;
          f.obj.userData.flames.forEach((fl) => (fl.visible = false));
          f.obj.userData.glow.intensity = 0;
          for (const q of parts) if (q.alive && q.mat === mat.smoke && Math.abs(q.mesh.position.x - f.x) < 12 && Math.abs(q.mesh.position.z - f.z) < 14) { q.alive = false; q.mesh.visible = false; }
          for (let i = 0; i < 14; i++) spawn(mat.steam, V(f.x + (Math.random() - 0.5) * 4, 3, f.z + (Math.random() - 0.5) * 4), V((Math.random() - 0.5) * 3, 5 + Math.random() * 5, (Math.random() - 0.5) * 3), 1.6, 1.1, 1.5);
          showBanner(t("out"), "+150"); GE.sfx("win");
        }
      }
      GE.sfx("splash");
    }
  }
  S.bombs = S.bombs.filter((b) => { if (b.dead) scene.remove(b.m); return !b.dead; });

  // Rafts: fly low and slow over them
  for (const r of S.rafts) {
    if (!r.saved && Math.abs(r.z - hz) < 5 && Math.abs(r.x - S.x) < 5.5 && S.y < 8) {
      r.saved = true; S.saved++; S.score += 200;
      if (r.obj.userData.people) r.obj.userData.people.forEach((q) => (q.visible = false));
      else { r.obj.userData.arm.visible = false; r.obj.children[1].visible = false; r.obj.children[2].visible = false; }
      for (let i = 0; i < 12; i++) spawn(mat.spark, V(r.x, 2, r.z), V((Math.random() - 0.5) * 8, 6 + Math.random() * 6, (Math.random() - 0.5) * 8), 0.8, 0.25);
      showBanner(t("saved"), "+200"); GE.sfx("coin", { streak: 4 });
    }
  }
  // Rings
  for (const g of S.rings) {
    if (!g.hit && Math.abs(g.z - hz) < 1.5 + S.speed * dt && Math.hypot(g.x - S.x, g.y - (S.y + S.lift)) < 3.6) {
      g.hit = true; S.ringsHit++; S.score += 50;
      g.obj.visible = false;
      burst(g.x, g.y, g.z - 3, 0xFFC928);
      for (let i = 0; i < 10; i++) spawn(mat.spark, V(g.x, g.y, g.z), V((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 4), 0.5, 0.22);
      GE.sfx("coin", { streak: S.ringsHit });
    }
  }
  // Hazards
  // Every obstacle you touch costs exactly one heart. The only grace is a
  // blink-length window so one crash into overlapping objects counts once.
  const hy = S.y + S.lift;
  const hit = (h, kind) => {
    if (h.hit) return;
    h.hit = true;
    if (S.inv > 0) return;
    S.hitLog.push({ kind, dist: Math.round(S.dist), dx: +(h.x - S.x).toFixed(1), y: +hy.toFixed(1) });
    S.hearts--; S.hits = (S.hits || 0) + 1; S.inv = HIT_GRACE; S.shake = 1; S.flash = 1; S.slow = 0.3;
    for (let i = 0; i < 28; i++) spawn(mat.spark, V(S.x, S.y, hz), V((Math.random() - 0.5) * 18, (Math.random() - 0.2) * 14, (Math.random() - 0.5) * 10), 0.8, 0.45);
    for (let i = 0; i < 6; i++) spawn(mat.smoke, V(S.x, S.y, hz + 1), V((Math.random() - 0.5) * 4, 3, 6), 1.2, 0.9, 1.5);
    flashEl.style.opacity = "0.55";
    GE.sfx("whoops");
    showBanner(t("ouch"));
    if (S.hearts <= 0) endStage(false);
  };
  for (const s of S.stacks) {
    if (!s.hit && s.z > hz - HITBOX.front - s.r && s.z < hz + HITBOX.back && Math.abs(s.x - S.x) < s.r + HITBOX.half && hy - HITBOX.below < s.h) {
      if (s.obj) {
        // The stack shatters so the camera never ends up inside rock.
        s.obj.visible = false;
        for (let i = 0; i < 26; i++) spawn(mat.rock, V(s.x + (Math.random() - 0.5) * s.r * 2, 2 + Math.random() * Math.min(s.h, 18), s.z), V((Math.random() - 0.5) * 18, 4 + Math.random() * 10, 6 + Math.random() * 10), 1.1, 0.7 + Math.random() * 0.6);
        for (let i = 0; i < 14; i++) spawn(mat.drop, V(s.x, 0.5, s.z), V((Math.random() - 0.5) * 14, 8 + Math.random() * 8, (Math.random() - 0.5) * 8), 0.9, 0.7);
        S.vx = (S.x >= s.x ? 1 : -1) * 22; // knocked sideways
      }
      hit(s, "stack");
    }
  }
  for (const b of S.birds) if (!b.hit && Math.abs(b.z - hz) < 4 && Math.abs(b.x - S.x) < HITBOX.half + 1.5 && Math.abs(b.y - hy) < 3) {
    hit(b, "bird");
    // the flock scatters so the hit reads
    b.obj.visible = false;
    for (let i = 0; i < 14; i++) spawn(mat.bird, V(b.x, b.y, b.z), V((Math.random() - 0.5) * 16, Math.random() * 10, (Math.random() - 0.5) * 10), 0.9, 0.3);
  }
  for (const c of S.clouds) if (Math.abs(c.z - hz) < 5 && Math.hypot(c.x - S.x, c.y - hy) < 5) hit(c, "cloud");

  // Fires: flicker + smoke
  for (const f of S.fires) {
    if (f.out) continue;
    f.obj.userData.flames.forEach((fl) => {
      const u = fl.userData;
      if (!u.h) { fl.scale.x = 11 + Math.sin(S.time * 9) * 1.2; return; }   // glow halo
      const k = 1 + Math.sin(S.time * 11 + u.ph) * 0.18 + Math.sin(S.time * 23 + u.ph * 2) * 0.1;
      fl.scale.set(u.w * (1.1 - k * 0.1), u.h * k, 1); fl.position.set(u.bx + Math.sin(S.time * 7 + u.ph) * 0.25, u.h * k / 2 - 0.3, fl.position.z);
    });
    if (Math.abs(f.z - hz) < 200 && Math.random() < dt * 14) spawn(mat.ember, V(f.x + (Math.random() - 0.5) * 4, 3 + Math.random() * 3, f.z + (Math.random() - 0.5) * 3), V((Math.random() - 0.5) * 3, 7 + Math.random() * 6, (Math.random() - 0.5) * 2), 0.9, 0.35);
    f.obj.userData.glow.intensity = 26 + Math.sin(S.time * 17) * 8;
    f.smokeT -= dt;
    if (f.smokeT <= 0 && Math.abs(f.z - hz) < 380) {
      f.smokeT = 0.1;
      spawn(mat.smoke, V(f.x + (Math.random() - 0.5) * 2, 9, f.z + (Math.random() - 0.5) * 2), V(1.6 + Math.random(), 11 + Math.random() * 4, 0.5), 3.4, 1.6, 2.6);
    }
  }
  for (const r of S.rafts) if (!r.saved) {
    r.obj.userData.flag.rotation.y = Math.sin(S.time * 6 + r.x) * 0.3;
    if (Math.abs(r.z + S.dist) < 380 && Math.random() < dt * 5) spawn(mat.flare, V(r.x + 3.4, 9, r.z), V(0.4, 10, 0), 1.8, 0.6, 0.8);
    r.obj.userData.arm.rotation.z = Math.sin(S.time * 8) * 0.8; r.obj.userData.beacon.visible = Math.sin(S.time * 10) > 0; r.obj.position.y = Math.sin(S.time * 2 + r.x) * 0.25; }
  for (const g of S.rings) g.obj.rotation.z += dt * 1.5;
  for (const b of S.birds) { b.obj.userData.wings.forEach(([l, r], i) => { const a = Math.sin(S.time * 14 + i) * 0.7; l.rotation.z = a; r.rotation.z = -a; }); b.obj.position.x = b.x + Math.sin(S.time + b.phase) * 2; b.x = b.obj.position.x; }
  weather(st.theme, dt);
  for (const a of S.anim) if (a.kind === "caravan") { a.obj.position.z = a.z0 + Math.sin(S.time * 0.3) * 4; a.obj.children.forEach((c, i) => { c.position.y = Math.abs(Math.sin(S.time * 3 + i)) * 0.15; }); }
  if (S.stage === 2) { S.lightning -= dt; if (S.lightning <= 0) { S.lightning = 3 + Math.random() * 4; S.flash = Math.max(S.flash, 0.6); strike(hz); } }
  bolt.material.opacity = Math.max(0, bolt.material.opacity - dt * 5); bolt.visible = bolt.material.opacity > 0.01;

  updateParts(dt);
  updateBursts(dt);
  updateCamera(dt);
  if (bannerTimer > 0) { bannerTimer -= dt; if (bannerTimer <= 0) $("banner").hidden = true; }
  // Progress & end of stage
  if (S.dist >= STAGES[S.stage].length && !S.ended) endStage(true);
}

/* ---------------- chase camera ---------------- */
// Behind & above the heli, lags laterally (weight), rolls with the bank.
const CAM = { back: 9.2, up: 7, side: 2.4, lookAhead: 16, lookDown: 0.8 };
const camPos = V(0, 12, 10), camLook = V(0, 8, -20);
function camTarget() { return V(S.x * 0.78 + CAM.side, S.y + S.lift * 0.55 + CAM.up, -S.dist + CAM.back); }
function snapCamera() { camPos.copy(camTarget()); camLook.set(S.x * 0.92, S.y - CAM.lookDown, -S.dist - CAM.lookAhead); }
function updateCamera(dt) {
  camPos.lerp(camTarget(), Math.min(1, dt * 5));
  camLook.lerp(V(S.x * 0.92, S.y + S.lift * 0.6 - CAM.lookDown, -S.dist - CAM.lookAhead), Math.min(1, dt * 7));
}

/* ---------------- render ---------------- */
function render(realDt) {
  const hz = -S.dist;
  // Gentle hover bob + fine engine vibration
  const vib = Math.sin(S.time * 53) * 0.018 + Math.sin(S.time * 37) * 0.012;
  heli.position.set(S.x, S.y + S.lift + Math.sin(S.time * 2.2) * 0.1 + vib, hz);
  heli.rotation.set(S.pitch + S.loopPitch + vib * 0.4, S.yaw, S.bank, "YXZ");
  const ud = heli.userData;
  ud.rotor.rotation.y += realDt * 44;
  heliMat.blade.opacity = S.mode === "hangar" ? 0.45 : 0.1; heliMat.tip.opacity = S.mode === "hangar" ? 0.7 : 0.22;
  ud.rotor.rotation.x = -0.06 - (S.speed - 30) * 0.002;   // rotor disc tips forward with speed
  ud.rotor.rotation.z = -S.vx * 0.006;                     // and into sideways moves
  ud.tail.rotation.x += realDt * 62;
  heli.visible = true;
  sun.position.copy(heli.position).add(SUN_OFF); sun.target.position.copy(heli.position);
  shadow.position.set(S.x, 0.3, hz);
  shadow.visible = S.lift < 6;
  shadow.scale.set(2.4, 3.4, 1);
  mat.shadow.opacity = Math.max(0, 0.12 - S.y * 0.008); // soft contact darkening under the real shadow
  sun.shadow.intensity = Math.max(0.12, 0.42 - (S.y + S.lift) * 0.02);   // higher up = fainter, more diffuse shadow
  const land = predictLanding();
  reticle.visible = S.mode === "play" && S.tank >= 1;
  reticle.position.set(land.x, 3, land.z);
  reticle.material.opacity = 0.4 + Math.sin(S.time * 8) * 0.2;
  if (S.mode === "hangar") {
    hangarT += realDt;
    const a = 0.7 + hangarT * 0.45, R = portraitView ? 24 : 15;
    heli.rotation.set(0, 0, 0);
    camera.position.set(heli.position.x + Math.sin(a) * R, heli.position.y + 3.2, heli.position.z + Math.cos(a) * R);
    camera.lookAt(heli.position.x, heli.position.y - (portraitView ? 4.5 : 3), heli.position.z);
    camera.fov = 50; camera.updateProjectionMatrix();
    updateWater(hangarT, heli.position.x, hz);
    skyDome.position.copy(camera.position); skyU.time.value = hangarT + S.time;
    renderer.render(scene, camera);
    return;
  }
  camera.position.copy(camPos);
  if (S.shake > 0) camera.position.add(V((Math.random() - 0.5) * S.shake * 4.5, (Math.random() - 0.5) * S.shake * 3.4, 0));
  camera.lookAt(camLook);
  camera.rotation.z += S.bank * 0.55 + (S.shake > 0 ? (Math.random() - 0.5) * S.shake * 0.12 : 0);
  flashEl.style.opacity = String(Math.max(0, S.flash * S.flash * 0.55 - 0.03));
  camera.fov = 58 + Math.min(16, S.speed * 0.22);
  camera.updateProjectionMatrix();
  // Speed streaks
  for (let i = 0; i < streaks.length; i++) {
    const s = streaks[i];
    const z = ((i * 37.7 + S.dist * 2.6) % 90);
    s.position.set(S.x + Math.sin(i * 12.9) * 14, S.y + Math.cos(i * 7.3) * 8, hz - 70 + z);
    s.scale.z = Math.max(0.01, (S.speed - 32) * 0.1);
    s.position.y = Math.max(s.position.y, 3.5);
  }
  updateWater(S.time, S.x, hz);
  const fl = S.flash;
  renderer.toneMappingExposure = 1.05 + fl * 0.8;
  skyDome.position.copy(camera.position); skyU.time.value = S.time;
  renderer.render(scene, camera);
  updateHud();
}

/* ---------------- HUD & screens ---------------- */
function showBanner(text, sub) {
  const b = $("banner");
  b.hidden = false;
  b.innerHTML = GE.esc(text) + (sub ? "<small>" + GE.esc(sub) + "</small>" : "");
  b.style.animation = "none"; void b.offsetWidth; b.style.animation = "";
  bannerTimer = 1.4;
}
function updateHud() {
  if (S.mode !== "play") return;
  $("hud-goals").textContent = t("goals", { f: S.put, ft: S.totals.f, r: S.saved, rt: S.totals.r });
  $("hud-score").textContent = t("score", { s: GE.num(S.score) }) + "  " + t("speed", { v: Math.round(S.speed * 5.4) });
  loopBtn.classList.toggle("empty", S.loopT >= 0 || S.loopCd > 0);
  $("hud-hearts").textContent = "❤️".repeat(Math.max(0, S.hearts)) + "🤍".repeat(Math.max(0, 3 - S.hearts));
  $("hud-tank-fill").style.transform = `scaleX(${(S.tank / TANK_MAX).toFixed(3)})`;
  $("hud-tank-label").textContent = S.refilling ? "💦" : "💧 " + Math.floor(S.tank);
  $("hud-tank").classList.toggle("low", S.tank < 1);
  dropBtn.classList.toggle("empty", S.tank < 1);
  const k = Math.min(1, S.dist / STAGES[S.stage].length);
  $("hud-progress").style.transform = `scaleX(${k.toFixed(3)})`;
  document.querySelector(".progress-heli").style.left = `calc(${(k * 100).toFixed(1)}% - 8px)`;
}
function setScreen(id) {
  for (const s of ["scr-title", "scr-end", "scr-pause", "scr-hangar"]) $(s).hidden = s !== id;
}
const hex = (c) => "#" + c.toString(16).padStart(6, "0");
let hangarTab = "body";
function renderHangar() {
  const row = (key, label, items, show) => `<div class="paint-row"><b>${GE.esc(t(label))}</b><div class="swatches">` +
    items.map((v) => `<button type="button" class="sw${look[key] === v ? " on" : ""}" data-paint="${key}" data-v="${v}" aria-label="${key} ${v}"${typeof v === "number" && key !== "blades" ? ` style="background:${hex(v)}"` : ""}>${show ? show(v) : ""}</button>`).join("") + `</div></div>`;
  const tabs = [["body", "tBody"], ["stripes", "tStripes"], ["rotor", "tRotor"]];
  const panel = hangarTab === "body" ? row("body", "hBody", PAINT.body)
    : hangarTab === "stripes" ? row("stripes", "hStripes", PAINT.stripes, (v) => GE.esc(t("st_" + v))) + row("trim", "hTrim", PAINT.trim)
    : row("blades", "hBlades", PAINT.blades, (v) => v) + row("blade", "hBlade", PAINT.blade);
  $("hangar-card").innerHTML = `<h1>${GE.esc(t("hangar"))}</h1>` +
    `<div class="htabs">${tabs.map(([k, l]) => `<button type="button" class="htab${hangarTab === k ? " on" : ""}" data-htab="${k}">${GE.esc(t(l))}</button>`).join("")}</div>` +
    panel + `<button class="ge-btn ge-btn-primary hdone" id="btn-hangar-done" type="button">${GE.esc(t("hDone"))}</button>`;
}
function setLook(key, v) {
  look[key] = key === "stripes" ? v : +v;
  buildHeli(look, heli);
  save.heli = { ...look }; GE.save(SAVE_KEY, save);
  renderHangar();
}
function openHangar() { S.mode = "hangar"; hangarT = 0; renderHangar(); setScreen("scr-hangar"); }
function stars(n) { return "★".repeat(n) + "☆".repeat(3 - n); }
function renderTitle() {
  document.title = t("title") + " 🚁";
  $("t-title").textContent = t("title");
  $("t-sub").textContent = t("sub");
  $("t-controls").textContent = t("controls") + " · " + t("controls2");
  $("t-stages").innerHTML = STAGES.map((st, i) => {
    const open = i < save.unlocked;
    return `<button type="button" class="stage-btn" data-stage="${i}" ${open ? "" : "disabled"}><span class="ico">${st.icon}</span>` +
      `<span>${GE.esc(t("stage", { n: i + 1 }))} · ${GE.esc(t(st.key))}<small>${GE.esc(open ? t(st.key + "d") : t("locked"))}</small></span>` +
      `<span class="stars">${stars(save.stars[i] || 0)}</span></button>`;
  }).join("");
  $("btn-hangar").textContent = t("hangar");
  $("btn-sound").textContent = GE.isMuted() ? "🔇" : "🔊";
  $("btn-lang").textContent = GE.lang === "he" ? "EN" : "עב";
  $("hud-hint").textContent = t("hint");
}
function endStage(won) {
  S.ended = true;
  S.mode = "end";
  stopRotor();
  $("hud").hidden = true;
  const st = STAGES[S.stage];
  const card = $("end-card");
  if (won) {
    const f = S.totals.f ? S.put / S.totals.f : 1, r = S.totals.r ? S.saved / S.totals.r : 1;
    const n = 1 + (f + r >= 1.2 ? 1 : 0) + (f + r >= 1.7 ? 1 : 0);
    save.stars[S.stage] = Math.max(save.stars[S.stage] || 0, n);
    save.unlocked = Math.max(save.unlocked, Math.min(STAGES.length, S.stage + 2));
    GE.save(SAVE_KEY, save);
    const last = S.stage === STAGES.length - 1;
    const c = (window.COUNTRIES || []).find((x) => x.code === st.code);
    card.innerHTML = `<div class="logo">${last ? "👑" : "🎉"}</div><h1>${GE.esc(last ? t("winTitle") : t("clear"))}</h1>` +
      (last ? `<p>${GE.esc(t("winBody"))}</p>` : "") +
      `<div class="big-stars">${stars(n)}</div>` +
      `<div class="stats"><div>${S.put}/${S.totals.f}<small>🔥 ${t("fires")}</small></div><div>${S.saved}/${S.totals.r}<small>🙋 ${t("people")}</small></div><div>${S.ringsHit}/${S.totals.g}<small>✨ ${t("rings")}</small></div></div>` +
      (S.loops ? `<p>🔄 ${S.loops} ${GE.esc(t("loops"))}</p>` : "") +
      (c ? `<p class="fact">${GE.esc(t("factAbout", { c: GE.L(c.name) }))} ${GE.esc(GE.L(c.fact))}</p>` : "") +
      `<div class="btns">${last ? "" : `<button class="ge-btn ge-btn-primary" id="btn-next" type="button">${t("next")}</button>`}` +
      `<button class="ge-btn ge-btn-ghost" id="btn-again" type="button">${t("again")}</button><button class="ge-btn ge-btn-ghost" id="btn-menu" type="button">${t("menu")}</button></div>`;
    GE.sfx("win"); GE.confetti();
  } else {
    card.innerHTML = `<div class="logo">🔧</div><h1>${GE.esc(t("tryTitle"))}</h1><p>${GE.esc(t("tryBody"))}</p>` +
      `<div class="btns"><button class="ge-btn ge-btn-primary" id="btn-again" type="button">${t("tryBtn")}</button><button class="ge-btn ge-btn-ghost" id="btn-menu" type="button">${t("menu")}</button></div>`;
  }
  setScreen("scr-end");
}
function togglePause() {
  if (S.mode === "play") {
    S.mode = "paused"; stopRotor();
    $("pause-card").innerHTML = `<div class="logo">⏸</div><h1>${t("paused")}</h1><div class="btns"><button class="ge-btn ge-btn-primary" id="btn-resume" type="button">${t("resume")}</button><button class="ge-btn ge-btn-ghost" id="btn-menu2" type="button">${t("menu")}</button></div>`;
    setScreen("scr-pause");
  } else if (S.mode === "paused") { S.mode = "play"; setScreen(null); startRotor(); }
}
function toMenu() { S.mode = "title"; $("hud").hidden = true; stopRotor(); renderTitle(); setScreen("scr-title"); }

document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.htab) { GE.sfx("tap"); hangarTab = b.dataset.htab; renderHangar(); }
  else if (b.dataset.paint) { GE.sfx("tap"); setLook(b.dataset.paint, b.dataset.v); }
  else if (b.id === "btn-hangar") { GE.sfx("tap"); openHangar(); }
  else if (b.id === "btn-hangar-done") toMenu();
  else if (b.dataset.stage != null) { GE.sfx("tap"); startRotor(); startStage(+b.dataset.stage); }
  else if (b.id === "btn-next") { startRotor(); startStage(S.stage + 1); }
  else if (b.id === "btn-again") { startRotor(); startStage(S.stage); }
  else if (b.id === "btn-menu" || b.id === "btn-menu2") toMenu();
  else if (b.id === "btn-resume") togglePause();
  else if (b.id === "btn-pause") togglePause();
  else if (b.id === "btn-sound") { GE.toggleMute(); if (GE.isMuted()) stopRotor(); renderTitle(); }
  else if (b.id === "btn-lang") { GE.setLang(GE.lang === "he" ? "en" : "he"); renderTitle(); }
});
document.addEventListener("visibilitychange", () => { if (document.hidden && S.mode === "play") togglePause(); });

/* ---------------- rotor hum (WebAudio) ---------------- */
let rotorNode = null;
function startRotor() {
  if (GE.isMuted() || rotorNode) return;
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return;
  try {
    const ctx = startRotor.ctx || (startRotor.ctx = new C());
    if (ctx.state === "suspended") ctx.resume();
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 380;
    const g = ctx.createGain(); g.gain.value = 0.05;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 13; const lg = ctx.createGain(); lg.gain.value = 0.04;
    lfo.connect(lg); lg.connect(g.gain);
    src.connect(lp); lp.connect(g); g.connect(ctx.destination);
    src.start(); lfo.start();
    rotorNode = { src, lfo };
  } catch (e) { /* audio is optional */ }
}
function stopRotor() { if (!rotorNode) return; try { rotorNode.src.stop(); rotorNode.lfo.stop(); } catch (e) {} rotorNode = null; }

/* ---------------- loop ---------------- */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // Portrait phones: widen the view so the heli and targets stay framed.
  const portrait = w < h;
  portraitView = portrait;
  camera.zoom = portrait ? 0.78 : 1;
  // Portrait: pull back, centre the heli (less side offset), tilt a bit further down.
  Object.assign(CAM, portrait ? { back: 10, up: 7, side: 2.6, lookDown: 1.6 } : { back: 9.2, up: 7, side: 2.4, lookDown: 0.8 });
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();
let last = performance.now(), manual = false, fpsAcc = 0, fpsN = 0;
window.__fps = 0;
function frame(now) {
  const realDt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!manual) {
    step(realDt);
    render(realDt);
    fpsAcc += realDt; fpsN++;
    if (fpsAcc > 2) {
      window.__fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0;
      // dynamic resolution: if a phone can't hold ~40 fps, render fewer pixels (never below 1x)
      if (S.mode === "play" && window.__fps < 40 && pixelRatio > 1) { pixelRatio = Math.max(1, pixelRatio - 0.25); renderer.setPixelRatio(pixelRatio); resize(); }
    }
  }
  requestAnimationFrame(frame);
}
// Title backdrop: demo flight on stage 1 under the menu.
startStage(0); S.mode = "title"; $("hud").hidden = true; bot = false;
renderTitle(); setScreen("scr-title");
requestAnimationFrame(frame);
GE.registerSW("sw.js");

window.__heli = {
  get state() { return { mode: S.mode, stage: S.stage, dist: S.dist, length: STAGES[S.stage].length, x: S.x, y: S.y, bank: S.bank, hearts: S.hearts, hits: S.hits, tank: S.tank, score: S.score, put: S.put, saved: S.saved, rings: S.ringsHit, totals: S.totals, unlocked: save.unlocked, stars: save.stars.slice() }; },
  start(n) { startStage(n); },
  bot(on) { bot = !!on; },
  setInput(x, y, drop) { input.x = x; input.y = y; input.drop = !!drop; },
  loop() { input.loop = true; },
  get motion() { return { speed: S.speed, loopT: S.loopT, lift: S.lift, loopPitch: S.loopPitch, loops: S.loops, yaw: S.yaw, bank: S.bank, inv: S.inv }; },
  manual(on) { manual = !!on; },
  get look() { return { ...look }; },
  get _dbg() { return { renderer, scene, sun, world, skyDome, water, camera, heli }; },
  get hitLog() { return S.hitLog.slice(); },
  get raftsList() { return S.rafts.map((r) => ({ x: +r.x.toFixed(1), z: Math.round(r.z), saved: r.saved })); },
  get firesList() { return S.fires.map((f) => ({ x: +f.x.toFixed(1), z: Math.round(f.z), out: f.out })); },
  hazardsNear(z, w = 40) { return S.stacks.concat(S.birds, S.clouds).filter((h) => Math.abs(h.z - z) < w).map((h) => ({ x: +h.x.toFixed(1), z: Math.round(h.z), r: +(h.r || 0).toFixed(1), y: h.y, h: h.h && +h.h.toFixed(0) })); },
  // Deterministic stepping for tests: n frames of dt, rendering the last one.
  step(seconds, dt = 1 / 60) { const n = Math.round(seconds / dt); for (let i = 0; i < n; i++) step(dt); render(dt); },
  frame(dt = 1 / 60) { step(dt); render(dt); },
  stackAhead() { const s = S.stacks.find((q) => q.z < -S.dist - 60); return { x: s.x, z: s.z }; },
  place(x, y, z) { S.x = x; S.y = y; S.dist = -z; snapCamera(); },
  hurt() { S.inv = 0; const fake = { hit: false }; S.stacks.push({ ...fake, x: S.x, z: -S.dist, r: 2, h: 99 }); step(1 / 60); render(1 / 60); }
};
