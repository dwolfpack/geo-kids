"""Single gateway for all Claude calls: model config, retry, token cap, daily budget."""
import logging
import os
from collections import defaultdict
from datetime import date

import anthropic

logger = logging.getLogger(__name__)

DEFAULT_MODEL = os.environ.get("CLAUDE_MODEL", "claude-haiku-4-5-20251001")
DAILY_BUDGET = int(os.environ.get("DAILY_MESSAGE_BUDGET", "50"))
BUDGET_EXCEEDED = "נגמרו ההודעות להיום 🙂 נתראה מחר!"

_client: anthropic.Anthropic | None = None
_usage: dict[str, dict[int, int]] = defaultdict(lambda: defaultdict(int))  # {day: {user: n}}


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
    return _client


def within_budget(user_id: int) -> bool:
    return _usage[date.today().isoformat()][user_id] < DAILY_BUDGET


def ask(user_id: int, messages: list[dict], system: str, max_tokens: int = 1024) -> str:
    """One Claude call with budget check and a single retry. Raises anthropic.APIError."""
    if not within_budget(user_id):
        return BUDGET_EXCEEDED
    _usage[date.today().isoformat()][user_id] += 1
    for attempt in (1, 2):
        try:
            resp = _get_client().messages.create(
                model=DEFAULT_MODEL, max_tokens=max_tokens, system=system, messages=messages
            )
            return resp.content[0].text
        except anthropic.APIError:
            if attempt == 2:
                raise
            logger.warning("Claude call failed, retrying once")
    raise RuntimeError("unreachable")
