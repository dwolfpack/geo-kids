import json
import random
from datetime import date, timedelta

import pytest

from handlers.digest import parse_reminder_reply
from services.geodata import GeoData, QTYPES
from services.store import Store
from scripts.extract_countries import extract, GAME_HTML, OUT


@pytest.fixture()
def store(tmp_path):
    s = Store(tmp_path / "test.db")
    yield s
    s.close()


@pytest.fixture(scope="module")
def geo():
    return GeoData()


# ---- extraction drift -------------------------------------------------------

def test_committed_countries_json_matches_game_source():
    """Fails when geo-kids/index.html changes but countries.json wasn't re-extracted."""
    fresh = extract(GAME_HTML.read_text(encoding="utf-8"))
    committed = json.loads(OUT.read_text(encoding="utf-8"))
    assert fresh == committed, "run scripts/extract_countries.py to refresh data/countries.json"


def test_extraction_completeness():
    data = json.loads(OUT.read_text(encoding="utf-8"))
    assert len(data["countries"]) >= 100
    required = {"code", "name", "capital", "continent", "lat", "lon", "fact", "landmark"}
    for c in data["countries"]:
        assert required <= set(c), f"{c.get('code')} missing fields"
    level_codes = [code for l in data["levels"] for code in l["codes"]]
    assert len(level_codes) == len(set(level_codes)), "country appears in two levels"


# ---- geodata ----------------------------------------------------------------

def test_pools_are_cumulative(geo):
    sizes = [len(geo.pool_for_level(k)) for k in range(1, 6)]
    assert sizes == sorted(sizes) and sizes[0] >= 10
    assert len(geo.pool_for_level(5)) == len(geo.countries)


@pytest.mark.parametrize("seed", range(20))
def test_questions_are_well_formed(geo, seed):
    rng = random.Random(seed)
    q = geo.make_question(level=rng.randint(1, 5), rng=rng)
    assert q["qtype"] in QTYPES
    assert len(q["options"]) == 4
    assert len(set(q["options"])) == 4, "duplicate options"
    assert 0 <= q["correct_index"] < 4
    assert q["prompt"] and q["fact"]
    # the correct answer is actually correct
    c = geo.countries[q["code"]]
    expected = {"capital": c["capital"], "continent": c["continent"],
                "landmark": c["name"], "farther": c["name"]}[q["qtype"]]
    assert q["options"][q["correct_index"]] == expected


# ---- store: quiz ------------------------------------------------------------

def _make_q():
    return {"code": "il", "qtype": "capital", "prompt": "מה בירת ישראל?",
            "options": ["ירושלים", "תל אביב", "חיפה", "אילת"], "correct_index": 0}


def test_answer_is_idempotent(store):
    store.upsert_user(1, "יואב", 9)
    qid = store.create_question(1, _make_q())
    assert store.answer_question(qid, 0) is True
    assert store.answer_question(qid, 2) is False, "second answer must be rejected"
    q = store.get_question(qid)
    assert q["answered_index"] == 0, "first answer wins"


def test_daily_question_cap_counting(store):
    store.upsert_user(1, "יואב", 9)
    for _ in range(3):
        store.create_question(1, _make_q())
    assert store.questions_today(1) == 3


def test_streak_same_day_counts_once(store):
    store.upsert_user(1, "יואב", 9)
    r1 = store.record_result(1, correct=True)
    r2 = store.record_result(1, correct=True)
    assert r1["current"] == 1 and r2["current"] == 1


def test_streak_continues_from_yesterday(store):
    store.upsert_user(1, "יואב", 9)
    store.record_result(1, correct=True)
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    store._db.execute("UPDATE streaks SET last_correct_date=? WHERE user_id=1", (yesterday,))
    r = store.record_result(1, correct=True)
    assert r["current"] == 2


def test_streak_resets_after_gap(store):
    store.upsert_user(1, "יואב", 9)
    store.record_result(1, correct=True)
    long_ago = (date.today() - timedelta(days=5)).isoformat()
    store._db.execute(
        "UPDATE streaks SET current=7, best=7, last_correct_date=? WHERE user_id=1", (long_ago,)
    )
    r = store.record_result(1, correct=True)
    assert r["current"] == 1
    assert r["best"] == 7, "best streak survives the reset"


def test_wrong_answer_keeps_streak_date_logic(store):
    store.upsert_user(1, "יואב", 9)
    r = store.record_result(1, correct=False)
    assert r["current"] == 0


def test_level_up_detection(store):
    store.upsert_user(1, "יואב", 9)
    for _ in range(5):
        qid = store.create_question(1, _make_q())
        store.answer_question(qid, 0)  # correct
    assert store.correct_in_a_row_at_level(1, 5) is True
    qid = store.create_question(1, _make_q())
    store.answer_question(qid, 1)  # wrong
    assert store.correct_in_a_row_at_level(1, 5) is False


# ---- store: reminders ---------------------------------------------------------

def test_reminder_lifecycle(store):
    store.upsert_user(1, "דרור", 45)
    rid = store.add_reminder(1, "2026-07-05 07:30", "להביא כובע")
    assert [r["text"] for r in store.reminders_for(1)] == ["להביא כובע"]
    assert store.reminders_due(1, "2026-07-05 00:00", "2026-07-06 00:00")
    assert not store.reminders_due(1, "2026-07-06 00:00", "2026-07-07 00:00")
    assert store.delete_reminder(rid, user_id=1) is True
    assert store.delete_reminder(rid, user_id=1) is False
    assert store.reminders_for(1) == []


def test_reminder_delete_requires_owner(store):
    store.upsert_user(1, "דרור", 45)
    rid = store.add_reminder(1, "2026-07-05 07:30", "סוד")
    assert store.delete_reminder(rid, user_id=999) is False, "others must not delete my reminders"


# ---- reminder parse validation ------------------------------------------------

@pytest.mark.parametrize("raw,ok", [
    ('{"date": "2026-07-05", "time": "07:30", "text": "להביא כובע"}', True),
    ('Sure! Here is the JSON:\n{"date": "2026-07-05", "time": "07:30", "text": "x"}', True),
    ('{"error": "unparseable"}', False),
    ('{"date": "tomorrow", "time": "07:30", "text": "x"}', False),
    ('{"date": "2026-07-05", "time": "25:99", "text": "x"}', False),
    ("no json here", False),
])
def test_parse_reminder_reply(raw, ok):
    assert (parse_reminder_reply(raw) is not None) == ok
