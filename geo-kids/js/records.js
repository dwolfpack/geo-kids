/* ============================================================================
 * geo-kids — "My Records" screen
 * ----------------------------------------------------------------------------
 * Owns #records-content only (the #auth-bar is rendered by js/profiles.js).
 * Defines a single global: showRecords().
 *
 * Data source: store.get(...) — the same four keys renderHome() in
 * index.html reads, already namespaced per active local profile.
 * ==========================================================================*/

const GEO_GAME_LABEL_KEYS = {
  flags: { titleKey: "gameFlagsTitle", emoji: "🚩" },
  capitals: { titleKey: "gameCapitalsTitle", emoji: "🏛️" },
  continents: { titleKey: "gameContinentsTitle", emoji: "🗺️" },
  memory: { titleKey: "gameMemoryTitle", emoji: "🧠" },
};
const GEO_GAME_ORDER = ["flags", "capitals", "continents", "memory"];

function showRecords() {
  show("screen-records");
  renderRecordsContent();
}

function renderRecordsContent() {
  const container = document.getElementById("records-content");
  if (!container) return;

  const name = (typeof getActiveProfile === "function" ? getActiveProfile() : null) || t("profileHeading");
  const emoji = (typeof profileEmoji === "function") ? profileEmoji(name) : "🧑";

  let total = 0;
  const rows = GEO_GAME_ORDER.map((g) => {
    const stars = store.get(g);
    total += stars;
    return geoRecordRowHtml(g, stars);
  }).join("");

  container.innerHTML = `
    <div class="records-card">
      <div class="records-profile">
        <span class="records-avatar">${emoji}</span>
        <div class="records-profile-name">${geoEscapeHtml(name)}</div>
      </div>
      <div class="records-total">
        <span class="records-total-emoji">⭐</span>
        <span class="records-total-num">${total}</span>
        <span class="records-total-label">${t("recordsTotal")}</span>
      </div>
      <div class="records-grid">${rows}</div>
      <div class="records-banner">
        ${t("recordsBanner")}
      </div>
    </div>
  `;
}

function geoRecordRowHtml(gameKey, stars) {
  const info = GEO_GAME_LABEL_KEYS[gameKey];
  const starsText = stars ? "⭐".repeat(stars) : t("notPlayedYet");
  return `
    <div class="records-row">
      <span class="records-row-emoji">${info.emoji}</span>
      <div class="records-row-body">
        <div class="records-row-name">${t(info.titleKey)}</div>
        <div class="records-row-stars">${starsText}</div>
      </div>
    </div>
  `;
}

window.showRecords = showRecords;
