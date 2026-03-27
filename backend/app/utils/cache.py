import time
from typing import Any

_store: dict[str, dict[str, Any]] = {}


def get_cached(key: str) -> Any | None:
    entry = _store.get(key)
    if not entry:
        return None
    if time.time() > entry["expiry"]:
        del _store[key]
        return None
    return entry["data"]


def set_cache(key: str, data: Any, ttl_seconds: int = 180) -> None:
    _store[key] = {"data": data, "expiry": time.time() + ttl_seconds}
