import re
from html import unescape


def strip_html(html: str) -> str:
    """Strip HTML tags and decode entities."""
    text = re.sub(r"<[^>]*>", "", html)
    return unescape(text).strip()


def decode_html_entities(text: str) -> str:
    """Decode HTML entities but keep text readable."""
    return unescape(text)
