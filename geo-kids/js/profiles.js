/* ============================================================================
 * geo-kids — local player profiles (no login, no account, no setup)
 * ----------------------------------------------------------------------------
 * Replaces Google/Firebase sign-in with a simple "who's playing?" picker.
 * A profile is just a name. index.html's `store` object already namespaces
 * every score by whatever name is stored under ACTIVE_PROFILE_KEY, so all
 * this file has to do is manage that name and render two bits of UI:
 *   - the #auth-bar pill (active player + switch/records buttons)
 *   - the #screen-profile picker (list of known names + add-new)
 *
 * Exposes: getProfiles(), getActiveProfile(), setActiveProfile(name),
 * chooseProfile(), renderProfileBar(), addProfileFromInput().
 * ==========================================================================*/

const PROFILES_KEY = "geo-profiles";
// ACTIVE_PROFILE_KEY is also defined in index.html (kept as the same literal
// string "geo-active-profile" in both places — see index.html's store object).
const PROFILE_EMOJIS = ["🦁", "🐨", "🦊", "🐼", "🐸", "🦄", "🐢", "🦋", "🐬", "🦉"];

function getProfiles() {
  try {
    const list = JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveProfiles(list) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
}

function getActiveProfile() {
  return localStorage.getItem("geo-active-profile") || null;
}

function profileEmoji(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % PROFILE_EMOJIS.length;
  return PROFILE_EMOJIS[Math.abs(h) % PROFILE_EMOJIS.length];
}

function setActiveProfile(name) {
  name = name.trim();
  if (!name) return;
  localStorage.setItem("geo-active-profile", name);
  const list = getProfiles();
  if (!list.includes(name)) {
    list.push(name);
    saveProfiles(list);
  }
  renderProfileBar();
  goHome();
}

function chooseProfile() {
  renderProfileList();
  show("screen-profile");
  const input = document.getElementById("new-profile-name");
  if (input) input.value = "";
}

function renderProfileList() {
  const list = getProfiles();
  const container = document.getElementById("profile-list");
  if (!container) return;
  if (!list.length) {
    container.innerHTML = `<p class="profile-empty">${t("profileEmptyState")}</p>`;
    return;
  }
  container.innerHTML = list.map((name) => `
    <button class="profile-chip" onclick="setActiveProfile('${geoEscapeAttr(name)}')">
      <span class="profile-chip-emoji">${profileEmoji(name)}</span>
      <span>${geoEscapeHtml(name)}</span>
    </button>
  `).join("");
}

function addProfileFromInput() {
  const input = document.getElementById("new-profile-name");
  if (!input) return;
  setActiveProfile(input.value);
}

function renderProfileBar() {
  const bar = document.getElementById("auth-bar");
  if (!bar) return;
  const active = getActiveProfile();
  if (!active) {
    bar.innerHTML = `<button class="auth-btn auth-btn-signin" onclick="chooseProfile()">${t("profileChoose")}</button>`;
    return;
  }
  bar.innerHTML = `
    <div class="auth-signed-in">
      <span class="auth-avatar">${profileEmoji(active)}</span>
      <span class="auth-name">${geoEscapeHtml(active)}</span>
      <button class="auth-btn auth-btn-records" onclick="showRecords()">${t("profileRecords")}</button>
      <button class="auth-btn auth-btn-signout" onclick="chooseProfile()">${t("profileSwitch")}</button>
    </div>`;
}

function geoEscapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function geoEscapeAttr(s) {
  return geoEscapeHtml(s).replace(/'/g, "\\'");
}

window.getProfiles = getProfiles;
window.getActiveProfile = getActiveProfile;
window.setActiveProfile = setActiveProfile;
window.chooseProfile = chooseProfile;
window.renderProfileBar = renderProfileBar;
window.addProfileFromInput = addProfileFromInput;

/* ---------- init ---------- */
// Zero-friction default: an unnamed player gets a "Guest" placeholder so the
// app is immediately playable, but the auth bar always offers a real name.
if (!getActiveProfile()) {
  localStorage.setItem("geo-active-profile", LANG === "en" ? "Guest" : "אורח/ת");
}
renderProfileBar();
