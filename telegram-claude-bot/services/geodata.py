"""Country data + quiz question generation, driven by geo-kids game data."""
import json
import math
import random
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / "data" / "countries.json"
ISRAEL = ("il", 31.8, 35.2)

QTYPES = ("capital", "continent", "landmark", "farther")


class GeoData:
    def __init__(self, path: str | Path = DATA):
        raw = json.loads(Path(path).read_text(encoding="utf-8"))
        self.countries = {c["code"]: c for c in raw["countries"]}
        self.levels = {l["key"]: l["codes"] for l in raw["levels"]}

    def pool_for_level(self, level: int) -> list[dict]:
        """Cumulative pool, same rule as the game: level N includes levels 1..N."""
        level = max(1, min(5, level))
        codes = [c for k in range(1, level + 1) for c in self.levels[k]]
        return [self.countries[c] for c in codes if c in self.countries]

    @staticmethod
    def _distance_km(a: dict, b_lat: float, b_lon: float) -> float:
        lat1, lon1 = math.radians(a["lat"]), math.radians(a["lon"])
        lat2, lon2 = math.radians(b_lat), math.radians(b_lon)
        h = (math.sin((lat2 - lat1) / 2) ** 2
             + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2)
        return 6371 * 2 * math.asin(math.sqrt(h))

    def make_question(self, level: int, rng: random.Random | None = None) -> dict:
        """Returns {code, qtype, prompt, options, correct_index, fact}."""
        rng = rng or random.Random()
        pool = self.pool_for_level(level)
        qtype = rng.choice(QTYPES)
        country = rng.choice(pool)

        if qtype == "capital":
            prompt = f"מה בירת {country['name']}?"
            correct = country["capital"]
            distract = self._distractors(pool, country, "capital", rng)
        elif qtype == "continent":
            prompt = f"באיזו יבשת נמצאת {country['name']}?"
            correct = country["continent"]
            all_continents = list({c["continent"] for c in self.countries.values()})
            distract = rng.sample([x for x in all_continents if x != correct], 3)
        elif qtype == "landmark":
            prompt = f"באיזו מדינה נמצא {country['landmark']}?"
            correct = country["name"]
            distract = self._distractors(pool, country, "name", rng)
        else:  # farther
            others = rng.sample([c for c in pool if c["code"] != ISRAEL[0]], 4)
            dists = [(c, self._distance_km(c, ISRAEL[1], ISRAEL[2])) for c in others]
            far = max(dists, key=lambda t: t[1])[0]
            country, correct = far, far["name"]
            prompt = "איזו מהמדינות האלה הכי רחוקה מישראל?"
            options = [c["name"] for c, _ in dists]
            rng.shuffle(options)
            return {"code": country["code"], "qtype": qtype, "prompt": prompt,
                    "options": options, "correct_index": options.index(correct),
                    "fact": country["fact"]}

        options = distract + [correct]
        rng.shuffle(options)
        return {"code": country["code"], "qtype": qtype, "prompt": prompt,
                "options": options, "correct_index": options.index(correct),
                "fact": country["fact"]}

    @staticmethod
    def _distractors(pool: list[dict], country: dict, field: str, rng: random.Random) -> list[str]:
        """3 wrong options, preferring the same continent so it isn't too easy."""
        same = [c[field] for c in pool
                if c["code"] != country["code"] and c["continent"] == country["continent"]
                and c[field] != country[field]]
        other = [c[field] for c in pool
                 if c["code"] != country["code"] and c[field] != country[field]
                 and c[field] not in same]
        picks: list[str] = []
        for src in (same, other):
            rng.shuffle(src)
            for v in src:
                if v not in picks and len(picks) < 3:
                    picks.append(v)
        return picks
