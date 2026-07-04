"""SQLite persistence. Single-file DB, WAL mode, schema_version for migrations.

Calls are synchronous; at family scale each is sub-millisecond, so handlers
call them directly. A threading.Lock serializes writers.
"""
import json
import sqlite3
import threading
from datetime import date, datetime, timedelta
from pathlib import Path

SCHEMA_VERSION = 1

_SCHEMA = """
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  quiz_level INTEGER NOT NULL DEFAULT 1,
  subscribed_quiz INTEGER NOT NULL DEFAULT 1,
  subscribed_digest INTEGER NOT NULL DEFAULT 1,
  joined_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  country_code TEXT NOT NULL,
  qtype TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options TEXT NOT NULL,          -- JSON array of strings
  correct_index INTEGER NOT NULL,
  answered_index INTEGER,
  answered_at TEXT
);
CREATE TABLE IF NOT EXISTS streaks (
  user_id INTEGER PRIMARY KEY,
  current INTEGER NOT NULL DEFAULT 0,
  best INTEGER NOT NULL DEFAULT 0,
  last_correct_date TEXT,
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_answered INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  due_at TEXT NOT NULL,           -- ISO "YYYY-MM-DD HH:MM"
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0
);
"""


class Store:
    def __init__(self, path: str | Path):
        self._lock = threading.Lock()
        self._db = sqlite3.connect(str(path), check_same_thread=False)
        self._db.row_factory = sqlite3.Row
        self._db.execute("PRAGMA journal_mode=WAL")
        with self._lock, self._db:
            self._db.executescript(_SCHEMA)
            cur = self._db.execute("SELECT value FROM meta WHERE key='schema_version'")
            row = cur.fetchone()
            if row is None:
                self._db.execute(
                    "INSERT INTO meta VALUES ('schema_version', ?)", (str(SCHEMA_VERSION),)
                )
            elif int(row["value"]) != SCHEMA_VERSION:
                raise RuntimeError(
                    f"DB schema {row['value']} != code schema {SCHEMA_VERSION}; run migration"
                )

    # -- meta / dead-man's switch -------------------------------------------
    def set_meta(self, key: str, value: str) -> None:
        with self._lock, self._db:
            self._db.execute("INSERT OR REPLACE INTO meta VALUES (?, ?)", (key, value))

    def get_meta(self, key: str) -> str | None:
        row = self._db.execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
        return row["value"] if row else None

    # -- users ---------------------------------------------------------------
    def upsert_user(self, user_id: int, name: str, age: int | None) -> None:
        level = 1 if (age is not None and age < 10) else 2
        with self._lock, self._db:
            self._db.execute(
                "INSERT INTO users (user_id, name, age, quiz_level, joined_at) VALUES (?,?,?,?,?) "
                "ON CONFLICT(user_id) DO UPDATE SET name=excluded.name, age=excluded.age",
                (user_id, name, age, level, datetime.now().isoformat(timespec="seconds")),
            )

    def get_user(self, user_id: int) -> sqlite3.Row | None:
        return self._db.execute("SELECT * FROM users WHERE user_id=?", (user_id,)).fetchone()

    def users_subscribed(self, field: str) -> list[sqlite3.Row]:
        assert field in ("subscribed_quiz", "subscribed_digest")
        return self._db.execute(f"SELECT * FROM users WHERE {field}=1").fetchall()

    def set_user_field(self, user_id: int, field: str, value) -> None:
        assert field in ("quiz_level", "subscribed_quiz", "subscribed_digest", "age")
        with self._lock, self._db:
            self._db.execute(f"UPDATE users SET {field}=? WHERE user_id=?", (value, user_id))

    # -- quiz ------------------------------------------------------------------
    def create_question(self, user_id: int, q: dict) -> int:
        with self._lock, self._db:
            cur = self._db.execute(
                "INSERT INTO quiz_questions (user_id, created_at, country_code, qtype, prompt, options, correct_index) "
                "VALUES (?,?,?,?,?,?,?)",
                (user_id, datetime.now().isoformat(timespec="seconds"), q["code"],
                 q["qtype"], q["prompt"], json.dumps(q["options"], ensure_ascii=False),
                 q["correct_index"]),
            )
            return cur.lastrowid

    def get_question(self, qid: int) -> sqlite3.Row | None:
        return self._db.execute("SELECT * FROM quiz_questions WHERE id=?", (qid,)).fetchone()

    def questions_today(self, user_id: int) -> int:
        today = date.today().isoformat()
        return self._db.execute(
            "SELECT COUNT(*) c FROM quiz_questions WHERE user_id=? AND created_at LIKE ?",
            (user_id, f"{today}%"),
        ).fetchone()["c"]

    def answer_question(self, qid: int, answered_index: int) -> bool:
        """Record an answer. Returns False if already answered (idempotent)."""
        with self._lock, self._db:
            cur = self._db.execute(
                "UPDATE quiz_questions SET answered_index=?, answered_at=? "
                "WHERE id=? AND answered_index IS NULL",
                (answered_index, datetime.now().isoformat(timespec="seconds"), qid),
            )
            return cur.rowcount == 1

    def record_result(self, user_id: int, correct: bool) -> dict:
        """Update streak counters. Returns {current, best, milestone}."""
        today = date.today()
        with self._lock, self._db:
            row = self._db.execute("SELECT * FROM streaks WHERE user_id=?", (user_id,)).fetchone()
            if row is None:
                self._db.execute("INSERT INTO streaks (user_id) VALUES (?)", (user_id,))
                row = self._db.execute("SELECT * FROM streaks WHERE user_id=?", (user_id,)).fetchone()
            current, best = row["current"], row["best"]
            last = date.fromisoformat(row["last_correct_date"]) if row["last_correct_date"] else None
            if correct:
                if last == today:
                    pass                      # already counted today
                elif last == today - timedelta(days=1):
                    current += 1
                else:
                    current = 1               # gap (or first ever) starts fresh
                best = max(best, current)
                self._db.execute(
                    "UPDATE streaks SET current=?, best=?, last_correct_date=?, "
                    "total_correct=total_correct+1, total_answered=total_answered+1 WHERE user_id=?",
                    (current, best, today.isoformat(), user_id),
                )
            else:
                self._db.execute(
                    "UPDATE streaks SET total_answered=total_answered+1 WHERE user_id=?",
                    (user_id,),
                )
            milestone = current if correct and current in (3, 7, 14, 30) and last != today else None
            return {"current": current, "best": best, "milestone": milestone}

    def scores(self) -> list[sqlite3.Row]:
        return self._db.execute(
            "SELECT u.name, s.current, s.best, s.total_correct, s.total_answered "
            "FROM streaks s JOIN users u ON u.user_id=s.user_id ORDER BY s.current DESC"
        ).fetchall()

    def correct_in_a_row_at_level(self, user_id: int, n: int = 5) -> bool:
        rows = self._db.execute(
            "SELECT answered_index, correct_index FROM quiz_questions "
            "WHERE user_id=? AND answered_index IS NOT NULL ORDER BY id DESC LIMIT ?",
            (user_id, n),
        ).fetchall()
        return len(rows) == n and all(r["answered_index"] == r["correct_index"] for r in rows)

    # -- reminders --------------------------------------------------------------
    def add_reminder(self, user_id: int, due_at: str, text: str) -> int:
        with self._lock, self._db:
            cur = self._db.execute(
                "INSERT INTO reminders (user_id, due_at, text, created_at) VALUES (?,?,?,?)",
                (user_id, due_at, text, datetime.now().isoformat(timespec="seconds")),
            )
            return cur.lastrowid

    def delete_reminder(self, rid: int, user_id: int) -> bool:
        with self._lock, self._db:
            cur = self._db.execute(
                "DELETE FROM reminders WHERE id=? AND user_id=?", (rid, user_id)
            )
            return cur.rowcount == 1

    def reminders_for(self, user_id: int) -> list[sqlite3.Row]:
        return self._db.execute(
            "SELECT * FROM reminders WHERE user_id=? AND done=0 ORDER BY due_at", (user_id,)
        ).fetchall()

    def reminders_due(self, user_id: int, start: str, end: str) -> list[sqlite3.Row]:
        return self._db.execute(
            "SELECT * FROM reminders WHERE user_id=? AND done=0 AND due_at>=? AND due_at<? "
            "ORDER BY due_at",
            (user_id, start, end),
        ).fetchall()

    def close(self) -> None:
        self._db.close()
