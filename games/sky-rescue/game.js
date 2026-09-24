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
    go: "יוצאים! 🚁", refill: "ממלאים מים! 💦", empty: "המיכל ריק — טוסו נמוך מעל הים 🌊",
    out: "כל הכבוד! 🔥➜💨", saved: "הצלתם! 🙋", ring: "טבעת! ✨", ouch: "אאוץ'! 💥",
    clear: "השלב הושלם! 🎉", fires: "שריפות", people: "הצלות", rings: "טבעות",
    next: "לשלב הבא ➜", again: "לשחק שוב 🔁", menu: "לתפריט 🏠",
    tryTitle: "אופס! המסוק צריך תיקון 🔧", tryBody: "לא נורא — כל טייס מתאמן. ננסה שוב?", tryBtn: "לנסות שוב 🚁",
    winTitle: "טייס הצלה אגדי! 👑", winBody: "סיימתם את כל השלבים!",
    paused: "הפסקה ⏸", resume: "ממשיכים ▶", factAbout: "💡 על {c}:"
  },
  en: {
    title: "Sky Rescue", sub: "Fly over the sea, put out wildfires and rescue people!",
    controls: "Arrows / WASD to fly · Space = water bomb · Fly low over the sea to refill",
    hint: "⬅️➡️⬆️⬇️ fly · Space = 💧 · low over sea = refill",
    goals: "🔥 {f}/{ft}  🙋 {r}/{rt}", score: "⭐ {s}",
    stage: "Stage {n}", locked: "🔒 Finish the previous stage",
    s1: "Greek Islands", s1d: "Calm sea, first fires", s2: "Norway's Fjords", s2d: "Tall cliffs — dodge!", s3: "Caribbean Storm", s3d: "Clouds, lightning and wind",
    go: "Let's fly! 🚁", refill: "Refilling! 💦", empty: "Tank empty — fly low over the sea 🌊",
    out: "Fire's out! 🔥➜💨", saved: "Rescued! 🙋", ring: "Ring! ✨", ouch: "Ouch! 💥",
    clear: "Stage clear! 🎉", fires: "fires", people: "rescues", rings: "rings",
    next: "Next stage ➜", again: "Play again 🔁", menu: "Menu 🏠",
    tryTitle: "Oops! The chopper needs a fix 🔧", tryBody: "No worries — every pilot practises. Try again?", tryBtn: "Try again 🚁",
    winTitle: "Legendary rescue pilot! 👑", winBody: "You finished every stage!",
    paused: "Paused ⏸", resume: "Resume ▶", factAbout: "💡 About {c}:"
  }
});
const t = GE.t;

/* ---------------- stages ---------------- */
const STAGES = [
  { key: "s1", code: "gr", icon: "🏝️", length: 2300, speed: 30, sea: 0x1FB9C9, deep: 0x118CA6, sky: ["#6EC6EC", "#FFF1D8"], fog: 0xF3EBDD, sun: 0xFFE0B0,
    fires: 6, rafts: 4, rings: 10, stacks: 5, birds: 2, clouds: 0, islandTint: 0x7CC36A },
  { key: "s2", code: "no", icon: "🏔️", length: 2600, speed: 34, sea: 0x21A9BF, deep: 0x13809C, sky: ["#7FBDE3", "#FCEFDC"], fog: 0xE6E8E2, sun: 0xFFE6C0,
    fires: 7, rafts: 5, rings: 10, stacks: 14, birds: 4, clouds: 0, islandTint: 0x5FA85E },
  { key: "s3", code: "jm", icon: "⛈️", length: 2800, speed: 37, sea: 0x1AA2B8, deep: 0x0A4F66, sky: ["#7D9FBC", "#DCE6ED"], fog: 0xB4C4D0, sun: 0xFFF3E0,
    fires: 8, rafts: 6, rings: 10, stacks: 10, birds: 3, clouds: 8, islandTint: 0x5E9C57 }
];

const BOX = { x: 16, yMin: 2.4, yMax: 20 };
const TANK_MAX = 8;

/* ---------------- renderer / scene ---------------- */
const canvas = $("c");
const flashEl = document.createElement("div");
flashEl.className = "flash"; document.body.appendChild(flashEl);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.5, 900);
const hemi = new THREE.HemisphereLight(0xFFF4E2, 0x3C6E4E, 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xFFF1D6, 2.1);
sun.position.set(-40, 80, 30);
scene.add(sun);

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

/* ---------------- materials & shared geometry ---------------- */
const M = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.75, metalness: 0.05, ...opts });
const mat = {
  sand: M(0xF1DDA4), rock: M(0x8C7B6B), rockDark: M(0x6E6258), trunk: M(0x8B5A2B), leaf: M(0x3E9E4A),
  red: M(0xFF5B2E, { roughness: 0.4 }), white: M(0xF7F7F2, { roughness: 0.5 }), glass: M(0x1C4E72, { roughness: 0.15, metalness: 0.3 }),
  dark: M(0x2B2F36), ring: new THREE.MeshStandardMaterial({ color: 0xFFC400, emissive: 0xFF9E00, emissiveIntensity: 1.1, roughness: 0.3, fog: false }),
  flame: new THREE.MeshBasicMaterial({ color: 0xFF7A1A }), flame2: new THREE.MeshBasicMaterial({ color: 0xFFD54A }),
  smoke: new THREE.MeshStandardMaterial({ color: 0x46413D, transparent: true, opacity: 0.42, flatShading: false, roughness: 1, depthWrite: false }),
  steam: new THREE.MeshStandardMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.7, flatShading: true, depthWrite: false }),
  water: new THREE.MeshStandardMaterial({ color: 0x6FD3F5, transparent: true, opacity: 0.85, roughness: 0.2 }),
  raft: M(0xFF9E1B), person: M(0xFFCC80), shirt: M(0x3D7BE0), boat: M(0xFFFFFF),
  bird: M(0xFFFFFF), cloud: M(0x5C6770, { transparent: true, opacity: 0.92 }),
  shallow: new THREE.MeshBasicMaterial({ color: 0x7FE6E6, transparent: true, opacity: 0.55, depthWrite: false }),
  shadow: new THREE.MeshBasicMaterial({ color: 0x06384A, transparent: true, opacity: 0.22, depthWrite: false }),
  reticle: new THREE.MeshBasicMaterial({ color: 0xBDF3FF, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }),
  spark: new THREE.MeshBasicMaterial({ color: 0xFFF3B0 }),
  flare: new THREE.MeshBasicMaterial({ color: 0xFF2D55, transparent: true, opacity: 0.7, depthWrite: false, fog: false }),
  streak: new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.35, depthWrite: false }),
  mountain: M(0x86A7B4)
};
const geo = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.IcosahedronGeometry(1, 1),
  sphereLo: new THREE.IcosahedronGeometry(1, 0),
  cone: new THREE.ConeGeometry(1, 1, 7),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 8),
  ring: new THREE.TorusGeometry(3.6, 0.45, 8, 28),
  disc: new THREE.CircleGeometry(1, 24),
  reticle: new THREE.RingGeometry(1.1, 1.45, 24)
};

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
function buildHeli() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(geo.sphere, mat.red); body.scale.set(1.35, 1.15, 2.1); g.add(body);
  const belly = new THREE.Mesh(geo.sphere, mat.white); belly.scale.set(1.25, 0.6, 1.9); belly.position.y = -0.55; g.add(belly);
  const glass = new THREE.Mesh(geo.sphere, mat.glass); glass.scale.set(1.05, 0.8, 1.0); glass.position.set(0, 0.25, -1.35); g.add(glass);
  const boom = new THREE.Mesh(geo.cyl, mat.red); boom.scale.set(0.32, 2.7, 0.32); boom.rotation.x = Math.PI / 2; boom.position.set(0, 0.35, 2.75); g.add(boom);
  const stripe = new THREE.Mesh(geo.cyl, mat.white); stripe.scale.set(0.34, 0.5, 0.34); stripe.rotation.x = Math.PI / 2; stripe.position.set(0, 0.35, 3.1); g.add(stripe);
  const fin = new THREE.Mesh(geo.box, mat.red); fin.scale.set(0.12, 1.3, 0.8); fin.position.set(0, 0.95, 4.05); g.add(fin);
  const tail = new THREE.Group(); tail.position.set(0.25, 1.05, 4.1);
  for (let i = 0; i < 2; i++) { const b = new THREE.Mesh(geo.box, mat.white); b.scale.set(0.06, 1.3, 0.16); b.rotation.x = i * Math.PI / 2; tail.add(b); }
  g.add(tail);
  for (const s of [-1, 1]) {
    const skid = new THREE.Mesh(geo.cyl, mat.dark); skid.scale.set(0.12, 3.2, 0.12); skid.rotation.x = Math.PI / 2; skid.position.set(0.95 * s, -1.35, -0.1); g.add(skid);
    for (const z of [-0.9, 0.8]) { const leg = new THREE.Mesh(geo.cyl, mat.dark); leg.scale.set(0.08, 0.6, 0.08); leg.position.set(0.85 * s, -1.05, z); leg.rotation.z = 0.3 * s; g.add(leg); }
  }
  for (const z of [-0.2, 0.9]) { const band = new THREE.Mesh(geo.cyl, mat.white); band.scale.set(1.37, 0.22, 1.2); band.rotation.x = Math.PI / 2; band.position.set(0, 0.05, z); band.scale.set(1.39, 0.26, 1.19); g.add(band); }
  const nose = new THREE.Mesh(geo.sphere, mat.white); nose.scale.set(0.7, 0.45, 0.5); nose.position.set(0, -0.45, -1.85); g.add(nose);
  const mast = new THREE.Mesh(geo.cyl, mat.dark); mast.scale.set(0.16, 0.5, 0.16); mast.position.y = 1.3; g.add(mast);
  const rotor = new THREE.Group(); rotor.position.y = 1.6;
  const bladeMat = new THREE.MeshBasicMaterial({ color: 0x3A3F47, transparent: true, opacity: 0.35, depthWrite: false });
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(geo.box, bladeMat); b.scale.set(0.3, 0.05, 5.2); b.position.z = 2.6; const arm = new THREE.Group(); arm.add(b); arm.rotation.y = i * Math.PI / 2; rotor.add(arm); }
  const blur = new THREE.Mesh(geo.disc, new THREE.MeshBasicMaterial({ map: rotorBlurTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  blur.scale.setScalar(4.8); blur.rotation.x = -Math.PI / 2; rotor.add(blur);
  g.add(rotor);
  g.userData = { rotor, tail };
  g.scale.setScalar(1.8);
  return g;
}

/* ---------------- world objects ---------------- */
function buildIsland(rng, tint, big, flat) {
  const g = new THREE.Group();
  const r = (big ? 16 : 9) + rng() * (big ? 10 : 6);
  const shallow = new THREE.Mesh(geo.disc, mat.shallow); shallow.scale.setScalar(r * 1.55); shallow.rotation.x = -Math.PI / 2; shallow.position.y = 0.15; g.add(shallow);
  const sand = new THREE.Mesh(geo.cyl, mat.sand); sand.scale.set(r, 1.4, r * (0.8 + rng() * 0.4)); sand.position.y = 0.2; g.add(sand);
  const hills = flat ? 0 : 1 + Math.floor(rng() * 3);
  const green = M(tint);
  for (let i = 0; i < hills; i++) {
    const h = new THREE.Mesh(geo.sphereLo, green);
    const s = r * (0.45 + rng() * 0.35);
    h.scale.set(s, s * (0.5 + rng() * 0.6), s);
    h.position.set((rng() - 0.5) * r * 0.6, 0.8, (rng() - 0.5) * r * 0.6);
    g.add(h);
  }
  const palms = 2 + Math.floor(rng() * 4);
  for (let i = 0; i < palms; i++) {
    const p = new THREE.Group();
    const trunk = new THREE.Mesh(geo.cyl, mat.trunk); trunk.scale.set(0.25, 4, 0.25); trunk.position.y = 2; trunk.rotation.z = (rng() - 0.5) * 0.4; p.add(trunk);
    for (let k = 0; k < 5; k++) { const lf = new THREE.Mesh(geo.cone, mat.leaf); lf.scale.set(0.5, 2.6, 0.2); lf.position.y = 4; lf.rotation.set(1.2, (k / 5) * Math.PI * 2, 0, "YXZ"); p.add(lf); }
    const a = rng() * Math.PI * 2, d = r * (0.7 + rng() * 0.2);
    p.position.set(Math.cos(a) * d, 0.8, Math.sin(a) * d);
    g.add(p);
  }
  g.userData = { r, top: 3 };
  return g;
}
function buildStack(rng) {
  const g = new THREE.Group();
  const h = 18 + rng() * 16, r = 2.6 + rng() * 1.8;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.75, r * 1.2, h, 6), rng() < 0.5 ? mat.rock : mat.rockDark);
  body.position.y = h / 2 - 1; body.rotation.y = rng() * 3; g.add(body);
  const cap = new THREE.Mesh(geo.sphereLo, mat.leaf); cap.scale.set(r * 0.9, r * 0.4, r * 0.9); cap.position.y = h - 1; g.add(cap);
  const foam = new THREE.Mesh(geo.disc, mat.shallow); foam.scale.setScalar(r * 2); foam.rotation.x = -Math.PI / 2; foam.position.y = 0.2; g.add(foam);
  g.userData = { r: r * 1.05, h };
  return g;
}
function buildFire() {
  const g = new THREE.Group();
  const flames = [];
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Mesh(geo.cone, i % 2 ? mat.flame2 : mat.flame);
    f.position.set((i - 2) * 1.5, 3, (i % 2 ? 1 : -0.9));
    f.scale.set(2.1, 6, 2.1);
    g.add(f); flames.push(f);
  }
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
function buildBirds() {
  const g = new THREE.Group();
  const wings = [];
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Group();
    const l = new THREE.Mesh(geo.box, mat.bird); l.scale.set(1.3, 0.08, 0.45); l.position.x = -0.6;
    const r = new THREE.Mesh(geo.box, mat.bird); r.scale.set(1.3, 0.08, 0.45); r.position.x = 0.6;
    const lp = new THREE.Group(); lp.add(l); const rp = new THREE.Group(); rp.add(r);
    b.add(lp); b.add(rp);
    b.position.set((i % 2 ? 1 : -1) * (1 + i), -i * 0.5, i * 1.6);
    g.add(b); wings.push([lp, rp]);
  }
  g.userData = { wings, r: 4.5 };
  return g;
}
function buildCloud(rng) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(geo.sphereLo, mat.cloud);
    const s = 3 + rng() * 3;
    p.scale.set(s * 1.3, s * 0.8, s);
    p.position.set((rng() - 0.5) * 8, (rng() - 0.5) * 2, (rng() - 0.5) * 6);
    g.add(p);
  }
  g.userData = { r: 6.5 };
  return g;
}

/* ---------------- water ---------------- */
const WATER_W = 520, WATER_D = 760;
const waterGeo = new THREE.PlaneGeometry(WATER_W, WATER_D, 52, 76);
waterGeo.rotateX(-Math.PI / 2);
const waterBase = Float32Array.from(waterGeo.attributes.position.array);
const waterMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, vertexColors: true, flatShading: true, roughness: 0.18, metalness: 0.2 });
waterGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(waterGeo.attributes.position.count * 3), 3));
const seaCol = new THREE.Color(0x1FB5C7), seaDeep = new THREE.Color(0x118CA6), seaCrest = new THREE.Color(0xB5F4F7), tmpCol = new THREE.Color();
const water = new THREE.Mesh(waterGeo, waterMat);
scene.add(water);
function updateWater(time, cx, cz) {
  // Snap to a grid so facets don't swim, then displace.
  const sx = Math.round(cx / 10) * 10, sz = Math.round((cz - WATER_D * 0.38) / 10) * 10;
  water.position.set(sx, 0, sz);
  const p = waterGeo.attributes.position.array, col = waterGeo.attributes.color.array;
  for (let i = 0; i < p.length; i += 3) {
    const x = waterBase[i] + sx, z = waterBase[i + 2] + sz;
    const h = Math.sin(x * 0.09 + time * 1.4) * 0.35 + Math.cos(z * 0.07 + time * 1.1) * 0.35 + Math.sin((x + z) * 0.21 + time * 2.2) * 0.12;
    p[i + 1] = h;
    const k = (h + 0.82) / 1.64; // 0 trough .. 1 crest
    if (k > 0.86) tmpCol.copy(seaCol).lerp(seaCrest, (k - 0.86) / 0.14 * 0.8);
    else tmpCol.copy(seaDeep).lerp(seaCol, Math.min(1, k * 1.4));
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
    const mesh = new THREE.Mesh(material === mat.smoke || material === mat.steam || material === mat.flare ? geo.sphere : geo.sphereLo, material);
    scene.add(mesh);
    p = { mesh, mat: material, alive: false };
    parts.push(p);
  }
  p.alive = true; p.t = 0; p.life = life; p.size = size; p.grow = grow;
  p.mesh.visible = true; p.mesh.position.copy(pos); p.vel = vel.clone(); p.mesh.scale.setScalar(size);
}
function updateParts(dt) {
  for (const p of parts) {
    if (!p.alive) continue;
    p.t += dt;
    if (p.t >= p.life) { p.alive = false; p.mesh.visible = false; continue; }
    p.mesh.position.addScaledVector(p.vel, dt);
    const k = p.t / p.life;
    p.mesh.scale.setScalar(Math.max(0.01, p.size * (1 + p.grow * k) * (1 - k * 0.6)));
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
const shield = new THREE.Mesh(new THREE.IcosahedronGeometry(5.2, 2), new THREE.MeshBasicMaterial({ color: 0x9BE7FF, transparent: true, opacity: 0.2, depthWrite: false }));
shield.visible = false; scene.add(shield);
const shadow = new THREE.Mesh(geo.disc, mat.shadow); shadow.rotation.x = -Math.PI / 2; shadow.scale.set(2.2, 3.2, 1); scene.add(shadow);
const reticle = new THREE.Mesh(geo.reticle, mat.reticle); reticle.rotation.x = -Math.PI / 2; scene.add(reticle);
const world = new THREE.Group(); scene.add(world);
const streaks = [];
for (let i = 0; i < 26; i++) { const s = new THREE.Mesh(geo.box, mat.streak); s.scale.set(0.05, 0.05, 6); scene.add(s); streaks.push(s); }

const save = GE.load(SAVE_KEY, { unlocked: 1, stars: [0, 0, 0] });
const S = {
  mode: "title", stage: 0, time: 0, dist: 0, speed: 30,
  x: 0, y: 9, vx: 0, vy: 0, bank: 0, pitch: 0,
  hearts: 3, inv: 0, tank: TANK_MAX, score: 0, dropCd: 0,
  fires: [], rafts: [], rings: [], stacks: [], birds: [], clouds: [], islands: [], bombs: [],
  put: 0, saved: 0, ringsHit: 0, totals: { f: 0, r: 0, g: 0 },
  shake: 0, flash: 0, slow: 0, refilling: false, bannerT: 0, lightning: 0, ended: false
};
const input = { x: 0, y: 0, drop: false, stickX: 0, stickY: 0, keys: {} };
let bot = false;
let bannerTimer = 0;

/* ---------------- stage generation ---------------- */
function clearWorld() {
  for (const c of [...world.children]) world.remove(c);
  for (const p of parts) { p.alive = false; p.mesh.visible = false; }
  S.fires = []; S.rafts = []; S.rings = []; S.stacks = []; S.birds = []; S.clouds = []; S.islands = []; S.bombs = [];
}
function startStage(n) {
  const st = STAGES[n];
  clearWorld();
  const rng = GE.rng(1000 + n * 77);
  Object.assign(S, { mode: "play", stage: n, time: 0, dist: 0, speed: st.speed, x: 0, y: 9, vx: 0, vy: 0, bank: 0, pitch: 0,
    hearts: 3, inv: 0, tank: TANK_MAX, score: 0, dropCd: 0, put: 0, saved: 0, ringsHit: 0, shake: 0, flash: 0, slow: 0, ended: false });
  scene.background = skyTexture(st.sky[0], st.sky[1]);
  scene.fog = new THREE.Fog(st.fog, 90, 430);
  seaCol.setHex(st.sea); seaDeep.setHex(st.deep);
  sun.color.setHex(st.sun);
  sun.intensity = n === 2 ? 1.7 : 2.1;
  hemi.intensity = n === 2 ? 1.0 : 1.1;

  const L = st.length;
  // Distant mountains on the horizon (decoration)
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(geo.cone, mat.mountain);
    const h = 40 + rng() * 60;
    m.scale.set(50 + rng() * 40, h, 40);
    m.position.set((rng() < 0.5 ? -1 : 1) * (160 + rng() * 120), h / 2 - 2, -rng() * L - 200);
    world.add(m);
  }
  // Decorative islands on both sides
  for (let z = -120; z > -L - 200; z -= 70 + rng() * 60) {
    for (const side of [-1, 1]) {
      if (rng() < 0.7) {
        const isl = buildIsland(rng, st.islandTint, true);
        isl.position.set(side * (48 + rng() * 60), 0, z + rng() * 30);
        world.add(isl); S.islands.push(isl);
      }
    }
  }
  const lane = () => (rng() * 2 - 1) * (BOX.x - 3);
  const slots = (count, from, to) => Array.from({ length: count }, (_, i) => from + (to - from) * ((i + 0.3 + rng() * 0.4) / count));
  // Fires on small islands inside the flight corridor
  for (const z of slots(st.fires, -260, -L + 150)) {
    const isl = buildIsland(rng, st.islandTint, false, true);
    const x = lane();
    isl.position.set(x, 0, z);
    world.add(isl); S.islands.push(isl);
    const f = buildFire();
    f.position.set(x, 0.9, z);
    world.add(f);
    S.fires.push({ obj: f, x, z, out: false, smokeT: 0 });
  }
  for (const z of slots(st.rafts, -190, -L + 120)) {
    const r = buildRaft(); const x = lane();
    r.position.set(x, 0, z); world.add(r);
    S.rafts.push({ obj: r, x, z, saved: false });
  }
  for (const z of slots(st.rings, -180, -L + 100)) {
    const r = new THREE.Mesh(geo.ring, mat.ring); const x = lane() * 0.8, y = 5 + rng() * 10;
    r.position.set(x, y, z); world.add(r);
    S.rings.push({ obj: r, x, y, z, hit: false });
  }
  for (const z of slots(st.stacks, -400, -L + 200)) {
    const s = buildStack(rng); const x = lane();
    // keep stacks away from fires/rafts so every target stays reachable
    const tooClose = S.fires.concat(S.rafts).some((o) => Math.abs(o.z - z) < 40 && Math.abs(o.x - x) < 10);
    s.position.set(tooClose ? -x : x, 0, z); world.add(s);
    S.stacks.push({ obj: s, x: s.position.x, z, r: s.userData.r, h: s.userData.h, hit: false });
  }
  for (const z of slots(st.birds, -500, -L + 250)) {
    const b = buildBirds(); const x = lane(), y = 7 + rng() * 8;
    b.position.set(x, y, z); world.add(b);
    S.birds.push({ obj: b, x, y, z, hit: false, phase: rng() * 6 });
  }
  for (const z of slots(st.clouds, -450, -L + 200)) {
    const c = buildCloud(rng); const x = lane(), y = 8 + rng() * 9;
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
  snapCamera();
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
  for (const h of S.stacks.concat(S.birds, S.clouds)) {
    if (h.z < -S.dist && h.z > -S.dist - 60) {
      const hr = (h.r || 5) + 3;
      if (Math.abs(tx - h.x) < hr) tx = h.x + (tx >= h.x ? hr : -hr);
      if (h.y != null && Math.abs(ty - h.y) < 5) ty = h.y > 10 ? 4 : h.y + 7;
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
  S.bank += (-S.vx / 17 * 0.85 - S.bank) * Math.min(1, dt * 9);
  S.pitch += (S.vy / 11 * 0.18 - 0.07 - S.pitch) * Math.min(1, dt * 6); // nose down to fly forward
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
    if (Math.random() < 0.7) spawn(mat.water, V(S.x + (Math.random() - 0.5) * 3, 0.4, hz + 1.5), V((Math.random() - 0.5) * 6, 5 + Math.random() * 4, 10), 0.6, 0.35);
  }

  // Drop water bombs
  if (drop && S.dropCd <= 0) {
    if (S.tank >= 1) {
      S.tank -= 1; S.dropCd = 0.32;
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
      for (let i = 0; i < 18; i++) spawn(mat.water, p.clone(), V((Math.random() - 0.5) * 12, 6 + Math.random() * 9, (Math.random() - 0.5) * 12), 0.7, 0.6);
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
      r.obj.userData.arm.visible = false; r.obj.children[1].visible = false; r.obj.children[2].visible = false;
      for (let i = 0; i < 12; i++) spawn(mat.spark, V(r.x, 2, r.z), V((Math.random() - 0.5) * 8, 6 + Math.random() * 6, (Math.random() - 0.5) * 8), 0.8, 0.25);
      showBanner(t("saved"), "+200"); GE.sfx("coin", { streak: 4 });
    }
  }
  // Rings
  for (const g of S.rings) {
    if (!g.hit && Math.abs(g.z - hz) < 1.5 + S.speed * dt && Math.hypot(g.x - S.x, g.y - S.y) < 3.6) {
      g.hit = true; S.ringsHit++; S.score += 50;
      g.obj.visible = false;
      burst(g.x, g.y, g.z - 3, 0xFFC928);
      for (let i = 0; i < 10; i++) spawn(mat.spark, V(g.x, g.y, g.z), V((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 4), 0.5, 0.22);
      GE.sfx("coin", { streak: S.ringsHit });
    }
  }
  // Hazards
  const hit = (h) => {
    if (S.inv > 0 || h.hit) return;
    h.hit = true; S.hearts--; S.inv = 1.6; S.shake = 1; S.flash = 1; S.slow = 0.3;
    for (let i = 0; i < 28; i++) spawn(mat.spark, V(S.x, S.y, hz), V((Math.random() - 0.5) * 18, (Math.random() - 0.2) * 14, (Math.random() - 0.5) * 10), 0.8, 0.45);
    for (let i = 0; i < 6; i++) spawn(mat.smoke, V(S.x, S.y, hz + 1), V((Math.random() - 0.5) * 4, 3, 6), 1.2, 0.9, 1.5);
    flashEl.style.opacity = "0.55";
    GE.sfx("whoops");
    showBanner(t("ouch"));
    if (S.hearts <= 0) endStage(false);
  };
  for (const s of S.stacks) {
    if (!s.hit && Math.abs(s.z - hz) < 3.5 && Math.abs(s.x - S.x) < s.r + 1.2 && S.y < s.h) {
      const wasInv = S.inv > 0;
      if (s.obj) {
        // The stack shatters so the camera never ends up inside rock.
        s.obj.visible = false;
        for (let i = 0; i < 26; i++) spawn(mat.rock, V(s.x + (Math.random() - 0.5) * s.r * 2, 2 + Math.random() * Math.min(s.h, 18), s.z), V((Math.random() - 0.5) * 18, 4 + Math.random() * 10, 6 + Math.random() * 10), 1.1, 0.7 + Math.random() * 0.6);
        for (let i = 0; i < 14; i++) spawn(mat.water, V(s.x, 0.5, s.z), V((Math.random() - 0.5) * 14, 8 + Math.random() * 8, (Math.random() - 0.5) * 8), 0.9, 0.7);
        S.vx = (S.x >= s.x ? 1 : -1) * 22; // knocked sideways
      }
      if (!wasInv) hit(s); else s.hit = true;
    }
  }
  for (const b of S.birds) if (Math.abs(b.z - hz) < 3 && Math.hypot(b.x - S.x, b.y - S.y) < 3.2) hit(b);
  for (const c of S.clouds) if (Math.abs(c.z - hz) < 5 && Math.hypot(c.x - S.x, c.y - S.y) < 5) hit(c);

  // Fires: flicker + smoke
  for (const f of S.fires) {
    if (f.out) continue;
    f.obj.userData.flames.forEach((fl, i) => { fl.scale.y = 5.6 + Math.sin(S.time * 12 + i * 1.7) * 1.6; fl.position.y = fl.scale.y / 2 + 0.2; });
    f.obj.userData.glow.intensity = 26 + Math.sin(S.time * 17) * 8;
    f.smokeT -= dt;
    if (f.smokeT <= 0 && Math.abs(f.z - hz) < 380) {
      f.smokeT = 0.1;
      spawn(mat.smoke, V(f.x + (Math.random() - 0.5) * 2, 9, f.z + (Math.random() - 0.5) * 2), V(1.6 + Math.random(), 11 + Math.random() * 4, 0.5), 3.4, 1.4, 2.2);
    }
  }
  for (const r of S.rafts) if (!r.saved) {
    r.obj.userData.flag.rotation.y = Math.sin(S.time * 6 + r.x) * 0.3;
    if (Math.abs(r.z + S.dist) < 380 && Math.random() < dt * 10) spawn(mat.flare, V(r.x + 3.4, 9, r.z), V(0.4, 10, 0), 1.8, 0.6, 0.8);
    r.obj.userData.arm.rotation.z = Math.sin(S.time * 8) * 0.8; r.obj.userData.beacon.visible = Math.sin(S.time * 10) > 0; r.obj.position.y = Math.sin(S.time * 2 + r.x) * 0.25; }
  for (const g of S.rings) g.obj.rotation.z += dt * 1.5;
  for (const b of S.birds) { b.obj.userData.wings.forEach(([l, r], i) => { const a = Math.sin(S.time * 14 + i) * 0.7; l.rotation.z = a; r.rotation.z = -a; }); b.obj.position.x = b.x + Math.sin(S.time + b.phase) * 2; b.x = b.obj.position.x; }
  if (S.stage === 2) { S.lightning -= dt; if (S.lightning <= 0) { S.lightning = 3 + Math.random() * 4; S.flash = Math.max(S.flash, 0.6); } }

  updateParts(dt);
  updateBursts(dt);
  updateCamera(dt);
  if (bannerTimer > 0) { bannerTimer -= dt; if (bannerTimer <= 0) $("banner").hidden = true; }
  // Progress & end of stage
  if (S.dist >= STAGES[S.stage].length && !S.ended) endStage(true);
}

/* ---------------- chase camera ---------------- */
// Behind & above the heli, lags laterally (weight), rolls with the bank.
const CAM = { back: 8.2, up: 5.6, side: 2.4, lookAhead: 12, lookDown: 3.2 };
const camPos = V(0, 12, 10), camLook = V(0, 8, -20);
function camTarget() { return V(S.x * 0.78 + CAM.side, S.y + CAM.up, -S.dist + CAM.back); }
function snapCamera() { camPos.copy(camTarget()); camLook.set(S.x * 0.92, S.y - CAM.lookDown, -S.dist - CAM.lookAhead); }
function updateCamera(dt) {
  camPos.lerp(camTarget(), Math.min(1, dt * 5));
  camLook.lerp(V(S.x * 0.92, S.y - CAM.lookDown, -S.dist - CAM.lookAhead), Math.min(1, dt * 7));
}

/* ---------------- render ---------------- */
function render(realDt) {
  const hz = -S.dist;
  heli.position.set(S.x, S.y + Math.sin(S.time * 2.2) * 0.12, hz);
  heli.rotation.set(S.pitch, 0, S.bank, "YXZ");
  heli.userData.rotor.rotation.y += realDt * 40;
  heli.userData.tail.rotation.x += realDt * 50;
  heli.visible = true;
  shield.visible = S.mode === "play" && S.inv > 0 && S.stage != null && S.hearts < 3;
  shield.position.copy(heli.position);
  shield.material.opacity = 0.12 + Math.abs(Math.sin(S.time * 10)) * 0.18;
  shadow.position.set(S.x, 0.3, hz);
  shadow.scale.set(2.4, 3.4, 1);
  mat.shadow.opacity = Math.max(0, 0.26 - S.y * 0.016);
  const land = predictLanding();
  reticle.visible = S.mode === "play" && S.tank >= 1;
  reticle.position.set(land.x, 3, land.z);
  reticle.material.opacity = 0.4 + Math.sin(S.time * 8) * 0.2;
  camera.position.copy(camPos);
  if (S.shake > 0) camera.position.add(V((Math.random() - 0.5) * S.shake * 4.5, (Math.random() - 0.5) * S.shake * 3.4, 0));
  camera.lookAt(camLook);
  camera.rotation.z += S.bank * 0.55 + (S.shake > 0 ? (Math.random() - 0.5) * S.shake * 0.12 : 0);
  flashEl.style.opacity = String(Math.max(0, S.flash * S.flash * 0.55 - 0.03));
  camera.fov = 62 + Math.min(8, S.speed * 0.12);
  camera.updateProjectionMatrix();
  // Speed streaks
  for (let i = 0; i < streaks.length; i++) {
    const s = streaks[i];
    const z = ((i * 37.7 + S.dist * 2.6) % 90);
    s.position.set(S.x + Math.sin(i * 12.9) * 14, S.y + Math.cos(i * 7.3) * 8, hz - 70 + z);
  }
  updateWater(S.time, S.x, hz);
  const fl = S.flash;
  renderer.toneMappingExposure = 1.05 + fl * 0.8;
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
  $("hud-score").textContent = t("score", { s: GE.num(S.score) });
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
  for (const s of ["scr-title", "scr-end", "scr-pause"]) $(s).hidden = s !== id;
}
function stars(n) { return "★".repeat(n) + "☆".repeat(3 - n); }
function renderTitle() {
  document.title = t("title") + " 🚁";
  $("t-title").textContent = t("title");
  $("t-sub").textContent = t("sub");
  $("t-controls").textContent = t("controls");
  $("t-stages").innerHTML = STAGES.map((st, i) => {
    const open = i < save.unlocked;
    return `<button type="button" class="stage-btn" data-stage="${i}" ${open ? "" : "disabled"}><span class="ico">${st.icon}</span>` +
      `<span>${GE.esc(t("stage", { n: i + 1 }))} · ${GE.esc(t(st.key))}<small>${GE.esc(open ? t(st.key + "d") : t("locked"))}</small></span>` +
      `<span class="stars">${stars(save.stars[i] || 0)}</span></button>`;
  }).join("");
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
  if (b.dataset.stage != null) { GE.sfx("tap"); startRotor(); startStage(+b.dataset.stage); }
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
  camera.zoom = portrait ? 0.78 : 1;
  // Portrait: pull back, centre the heli (less side offset), tilt a bit further down.
  Object.assign(CAM, portrait ? { back: 10.5, up: 6.2, side: 1.4, lookDown: 3.6 } : { back: 8.2, up: 5.6, side: 2.4, lookDown: 3.2 });
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
    fpsAcc += realDt; fpsN++; if (fpsAcc > 1) { window.__fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; }
  }
  requestAnimationFrame(frame);
}
// Title backdrop: demo flight on stage 1 under the menu.
startStage(0); S.mode = "title"; $("hud").hidden = true; bot = false;
renderTitle(); setScreen("scr-title");
requestAnimationFrame(frame);
GE.registerSW("sw.js");

window.__heli = {
  get state() { return { mode: S.mode, stage: S.stage, dist: S.dist, length: STAGES[S.stage].length, x: S.x, y: S.y, bank: S.bank, hearts: S.hearts, tank: S.tank, score: S.score, put: S.put, saved: S.saved, rings: S.ringsHit, totals: S.totals, unlocked: save.unlocked, stars: save.stars.slice() }; },
  start(n) { startStage(n); },
  bot(on) { bot = !!on; },
  setInput(x, y, drop) { input.x = x; input.y = y; input.drop = !!drop; },
  manual(on) { manual = !!on; },
  // Deterministic stepping for tests: n frames of dt, rendering the last one.
  step(seconds, dt = 1 / 60) { const n = Math.round(seconds / dt); for (let i = 0; i < n; i++) step(dt); render(dt); },
  frame(dt = 1 / 60) { step(dt); render(dt); },
  stackAhead() { const s = S.stacks.find((q) => q.z < -S.dist - 60); return { x: s.x, z: s.z }; },
  place(x, y, z) { S.x = x; S.y = y; S.dist = -z; snapCamera(); },
  hurt() { S.inv = 0; const fake = { hit: false }; S.stacks.push({ ...fake, x: S.x, z: -S.dist, r: 2, h: 99 }); step(1 / 60); render(1 / 60); }
};
