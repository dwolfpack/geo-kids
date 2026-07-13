// Mini equirectangular world map with a single pin for the Explorer game's
// currently-viewed country. No external map asset: the "map" is a flat
// dotted rectangle (matches the app's dot-grid background language) with
// a pin placed by projecting lat/lon onto it.
(function () {
  function project(lat, lon, width, height) {
    const x = (lon + 180) / 360 * width;
    const y = (90 - lat) / 180 * height;
    return { x, y };
  }

  window.renderMiniMap = function renderMiniMap(country, containerEl, label) {
    if (!containerEl) return;
    const width = 260, height = 130;
    const { x, y } = project(country.lat, country.lon, width, height);
    containerEl.innerHTML = `
      <svg class="mini-map" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">
        <rect x="0" y="0" width="${width}" height="${height}" rx="10" class="mini-map-bg" />
        <circle cx="${x}" cy="${y}" r="6" class="mini-map-pin-ring" />
        <circle cx="${x}" cy="${y}" r="3" class="mini-map-pin" />
      </svg>`;
  };
})();
