"""Extract COUNTRIES and LEVELS from geo-kids/index.html into data/countries.json.

The game stays a self-contained single file; the bot consumes structured JSON.
Run manually after editing the game; tests/test_extract.py fails if the
committed JSON drifts from the game source.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GAME_HTML = ROOT.parent / "geo-kids" / "index.html"
OUT = ROOT / "data" / "countries.json"


def _array_block(html: str, name: str) -> str:
    m = re.search(rf"const {name} = \[(.*?)\n\];", html, re.S)
    if not m:
        raise ValueError(f"{name} array not found in {GAME_HTML}")
    return m.group(1)


def extract(html: str) -> dict:
    countries = []
    for entry in re.finditer(r"\{([^{}]*)\}", _array_block(html, "COUNTRIES")):
        d = {}
        for key, val in re.findall(r'(\w+):\s*("(?:[^"\\]|\\.)*"|-?[\d.]+)', entry.group(1)):
            d[key] = val[1:-1].replace('\\"', '"') if val.startswith('"') else float(val)
        if d.get("code"):
            countries.append(d)

    levels = []
    for entry in re.finditer(r"\{([^{}]*)\}", _array_block(html, "LEVELS")):
        body = entry.group(1)
        key = int(re.search(r"key:\s*(\d+)", body).group(1))
        codes = re.findall(r'"(\w{2})"', re.search(r"codes:\s*\[(.*?)\]", body, re.S).group(1))
        levels.append({"key": key, "codes": codes})

    if len(countries) < 100:
        raise ValueError(f"extraction looks broken: only {len(countries)} countries parsed")
    if [l["key"] for l in levels] != [1, 2, 3, 4, 5]:
        raise ValueError("expected exactly levels 1..5")
    return {"countries": countries, "levels": levels}


def main() -> int:
    data = extract(GAME_HTML.read_text(encoding="utf-8"))
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {len(data['countries'])} countries, {len(data['levels'])} levels -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
