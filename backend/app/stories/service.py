import asyncio
from datetime import datetime, timezone

import httpx

from app.core.config import settings
from app.core.exceptions import ExternalApiError
from app.stories.schemas import Comment, Story
from app.utils.cache import get_cached, set_cache
from app.utils.html import decode_html_entities


# --- Firebase API (stories) ---

async def _fetch_from_firebase(client: httpx.AsyncClient, path: str) -> dict:
    url = f"{settings.firebase_base_url}/{path}.json"
    res = await client.get(url)
    if res.status_code != 200:
        raise ExternalApiError(f"Firebase API error: {res.status_code} for {path}")
    return res.json()


def _map_firebase_story(item: dict) -> Story:
    ts = item.get("time", 0)
    created_at = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()

    return Story(
        id=item["id"],
        title=decode_html_entities(item.get("title", "")),
        url=item.get("url") or None,
        text=item.get("text") or None,
        author=item.get("by", "[deleted]"),
        points=item.get("score", 0),
        commentCount=item.get("descendants", 0),
        createdAt=created_at,
        type=item.get("type", "story"),
    )


async def fetch_story_ids(story_type: str) -> list[int]:
    cached = get_cached(f"story_ids_{story_type}")
    if cached:
        return cached

    endpoint_map = {"top": "topstories", "new": "newstories", "best": "beststories"}

    async with httpx.AsyncClient(timeout=10) as client:
        ids = await _fetch_from_firebase(client, endpoint_map[story_type])

    set_cache(f"story_ids_{story_type}", ids, settings.cache_ttl_seconds)
    return ids


async def fetch_story_by_id(story_id: int) -> Story:
    cached = get_cached(f"story_{story_id}")
    if cached:
        return cached

    async with httpx.AsyncClient(timeout=10) as client:
        item = await _fetch_from_firebase(client, f"item/{story_id}")

    if not item or item.get("deleted") or item.get("dead"):
        raise ExternalApiError(f"Story {story_id} not found or deleted")

    story = _map_firebase_story(item)
    set_cache(f"story_{story_id}", story, 300)
    return story


async def fetch_stories_paginated(story_type: str, page: int, limit: int) -> dict:
    all_ids = await fetch_story_ids(story_type)
    start = (page - 1) * limit
    page_ids = all_ids[start : start + limit]

    async def _fetch_one(sid: int) -> Story | None:
        try:
            return await fetch_story_by_id(sid)
        except Exception:
            return None

    stories = await asyncio.gather(*[_fetch_one(sid) for sid in page_ids])

    return {
        "stories": [s for s in stories if s is not None],
        "totalPages": -(-len(all_ids) // limit),
        "currentPage": page,
    }


# --- Algolia API (comments) ---

def _transform_algolia_tree(children: list[dict]) -> list[Comment]:
    result = []
    for child in children:
        if not child.get("text") or not child.get("author"):
            continue
        result.append(
            Comment(
                id=child["id"],
                author=child["author"],
                text=child["text"],
                createdAt=child.get("created_at", ""),
                children=_transform_algolia_tree(child.get("children", [])),
            )
        )
    return result


async def fetch_comments_algolia(story_id: int) -> list[Comment]:
    url = f"{settings.algolia_base_url}/items/{story_id}"

    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(url)

    if res.status_code != 200:
        return await _fetch_comments_firebase(story_id)

    data = res.json()
    return _transform_algolia_tree(data.get("children", []))


# --- Firebase fallback ---

async def _fetch_comment_tree(client: httpx.AsyncClient, cid: int, depth: int = 0, max_depth: int = 3):
    if depth >= max_depth:
        return None
    try:
        item = await _fetch_from_firebase(client, f"item/{cid}")
        if not item or item.get("deleted") or item.get("dead") or not item.get("text"):
            return None

        ts = item.get("time", 0)
        created_at = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()

        kids = item.get("kids", [])[:25]
        children = await asyncio.gather(*[_fetch_comment_tree(client, kid, depth + 1, max_depth) for kid in kids])

        return Comment(
            id=item["id"],
            author=item.get("by", "[deleted]"),
            text=item["text"],
            createdAt=created_at,
            children=[c for c in children if c is not None],
        )
    except Exception:
        return None


async def _fetch_comments_firebase(story_id: int) -> list[Comment]:
    async with httpx.AsyncClient(timeout=10) as client:
        story = await _fetch_from_firebase(client, f"item/{story_id}")
        if not story or not story.get("kids"):
            return []

        root_ids = story["kids"][:50]
        comments = await asyncio.gather(*[_fetch_comment_tree(client, cid) for cid in root_ids])

    return [c for c in comments if c is not None]
