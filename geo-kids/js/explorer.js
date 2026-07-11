// Explorer game: type-ahead country search that renders the shared country panel.

(function () {
  const searchInput = $("explorer-search");
  const suggestionsBox = $("explorer-suggestions");
  const panel = $("explorer-panel");

  function resetPanel() {
    if (!panel) return;
    panel.classList.add("placeholder");
    panel.textContent = t("explorerInitial");
  }

  function findMatches(query) {
    const q = query.trim();
    if (!q) return [];
    return COUNTRIES.filter(c => c.name[LANG].includes(q)).slice(0, 8);
  }

  function selectCountry(country) {
    renderCountryPanel(country, panel);
    suggestionsBox.innerHTML = "";
    searchInput.value = country.name[LANG];
  }

  function renderSuggestions(query) {
    suggestionsBox.innerHTML = "";
    const q = query.trim();
    if (!q) return;

    const matches = findMatches(q);

    if (matches.length === 0) {
      const empty = document.createElement("div");
      empty.className = "explorer-empty";
      empty.textContent = t("explorerNoMatch");
      suggestionsBox.appendChild(empty);
      return;
    }

    matches.forEach(c => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "explorer-suggestion";
      btn.textContent = c.name[LANG];
      btn.addEventListener("click", () => selectCountry(c));
      suggestionsBox.appendChild(btn);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderSuggestions(searchInput.value);
    });

    searchInput.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      const matches = findMatches(searchInput.value);
      if (matches.length === 1) {
        selectCountry(matches[0]);
      }
    });
  }

  window.startExplorer = function startExplorer() {
    if (searchInput) searchInput.value = "";
    if (suggestionsBox) suggestionsBox.innerHTML = "";
    resetPanel();
    show("screen-explorer");
    if (searchInput) searchInput.focus();
  };
})();
