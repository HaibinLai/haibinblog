#!/usr/bin/env python3
"""Mirror images used by blog posts into the GitHub image repository.

Only an image that was downloaded, decoded, validated, and written successfully
is substituted in a post.  The separate manifest also lets a later WordPress
re-import restore the mirrored URLs without downloading the images again.
"""

from __future__ import annotations

import argparse
from collections import Counter
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait
from dataclasses import dataclass, field, replace
import hashlib
import html
from io import BytesIO
import ipaddress
import json
import os
from pathlib import Path, PurePosixPath
import re
import socket
import sys
import tempfile
import threading
import unicodedata
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple
from urllib.parse import quote, unquote, urlencode, urljoin, urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
import warnings

try:
    from PIL import Image, ImageOps, ImageSequence, UnidentifiedImageError
except ImportError as error:  # pragma: no cover - depends on the local runtime
    raise SystemExit(
        "Pillow is required. Install it with: python3 -m pip install Pillow"
    ) from error


RAW_BASE = "https://raw.githubusercontent.com/HaibinLai/image-backend/main"
MANIFEST_NAME = "body-images-manifest.json"
MAX_ALLOWED_BYTES = 50 * 1024 * 1024
DEFAULT_WORKERS = 4
DEFAULT_TIMEOUT = 20.0
MANIFEST_VERSION = 1
PROCESSOR_VERSION = 2
MAX_STATIC_LONG_EDGE = 2560
PHOTO_WEBP_QUALITY = 84
LANCZOS = getattr(Image, "Resampling", Image).LANCZOS
USER_AGENT = "HaibinBlogBodyImageMirror/1.0"
MAX_ANIMATION_FRAMES = 2000
MAX_DECODED_PIXELS = 500_000_000
WAYBACK_CDX_MAX_BYTES = 8 * 1024 * 1024
WAYBACK_CDX_BASE = "https://web.archive.org/cdx/search/cdx"
WAYBACK_REPLAY_BASE = "https://web.archive.org/web"
LEGACY_MEDIA_HOSTS = {"haibinlaiblog.top", "www.haibinlaiblog.top"}
LEGACY_MEDIA_PATH_PREFIX = "/wp-content/uploads/"

FRONTMATTER_OPEN = re.compile(r"\A---(?P<newline>\r?\n)")
FRONTMATTER_CLOSE = re.compile(r"(?m)^---[ \t]*(?:\r?\n|\Z)")
FEATURED_IMAGE = re.compile(
    r"(?m)^featuredImage:[ \t]*(?P<value>.*?)(?P<trailing>[ \t]*)$"
)
HTML_IMAGE = re.compile(
    r"<img\b(?:(?!>).)*?\bsrc\s*=\s*(?:"
    r'"(?P<double>[^\"]*)"|'
    r"'(?P<single>[^']*)'|"
    r"(?P<bare>[^\s\"'=<>`]+))",
    re.IGNORECASE | re.DOTALL,
)
HTML_TAG = re.compile(r"<[^>]*>", re.DOTALL)
HTML_COMMENT = re.compile(r"<!--.*?(?:-->|\Z)", re.DOTALL)
IGNORED_HTML_OPEN = re.compile(r"<(pre|code|script|style)\b[^>]*>", re.IGNORECASE)
FENCE_OPEN = re.compile(r"(?m)^[ \t]{0,3}(?P<fence>`{3,}|~{3,})[^\r\n]*(?:\r?\n|\Z)")
TRAILING_ENCODED_NEWLINE = re.compile(r"(?i)(?:%0a|%0d)+$")
BODY_TARGET_NAME = re.compile(
    r"^body-(?P<number>\d{3,})-(?P<sha>[0-9a-f]{12})\.(?P<ext>[a-z0-9]+)$"
)

FORMAT_EXTENSIONS = {
    "PNG": "png",
    "JPEG": "jpg",
    "GIF": "gif",
    "WEBP": "webp",
    "BMP": "bmp",
    "TIFF": "tiff",
    "ICO": "ico",
    "AVIF": "avif",
}
FORMAT_MIME_TYPES = {
    "PNG": "image/png",
    "JPEG": "image/jpeg",
    "GIF": "image/gif",
    "WEBP": "image/webp",
    "BMP": "image/bmp",
    "TIFF": "image/tiff",
    "ICO": "image/x-icon",
    "AVIF": "image/avif",
}
MIME_FORMATS = {
    "image/png": {"PNG"},
    "image/x-png": {"PNG"},
    "image/jpeg": {"JPEG"},
    "image/jpg": {"JPEG"},
    "image/pjpeg": {"JPEG"},
    "image/gif": {"GIF"},
    "image/webp": {"WEBP"},
    "image/bmp": {"BMP"},
    "image/x-ms-bmp": {"BMP"},
    "image/tiff": {"TIFF"},
    "image/x-icon": {"ICO"},
    "image/vnd.microsoft.icon": {"ICO"},
    "image/avif": {"AVIF"},
}
REMOTE_SCHEMES = {"http", "https"}


@dataclass(frozen=True)
class Frontmatter:
    header_start: int
    header_end: int
    body_start: int
    header: str
    body: str
    newline: str


@dataclass
class ImageReference:
    start: int
    end: int
    value: str
    location: str
    source: str = ""


@dataclass
class Post:
    path: Path
    relative_path: str
    source_text: str
    frontmatter: Frontmatter
    year_month: str
    slug: str
    draft: bool
    image_mirror_include_hosts: Optional[Tuple[str, ...]]
    image_mirror_opaque_webp_quality: Optional[int]
    references: List[ImageReference]


@dataclass
class WorkItem:
    post: Post
    source: str
    number: int
    references: List[ImageReference] = field(default_factory=list)
    previous: Optional[Dict[str, object]] = None
    input_sha256: str = ""
    prefer_previous_file: bool = False


@dataclass
class ExcludedImage:
    post: Post
    source: str
    references: List[ImageReference] = field(default_factory=list)
    previous: Optional[Dict[str, object]] = None


@dataclass(frozen=True)
class StoredImage:
    payload: bytes
    extension: str
    source_url: str
    source_format: str
    stored_format: str
    mime_type: str
    derived_from_target: str = ""
    derived_from_sha256: str = ""


@dataclass(frozen=True)
class WaybackSnapshot:
    timestamp: str
    original: str
    mime_type: str


@dataclass(frozen=True)
class MirrorResult:
    status: str
    source: str
    source_url: str
    target: str
    raw_url: str
    sha256: str
    byte_count: int
    source_format: str
    stored_format: str
    mime_type: str
    error: str
    payload: bytes = b""
    processor_version: int = PROCESSOR_VERSION
    input_sha256: str = ""
    optimization_error: str = ""
    derived_from_target: str = ""
    derived_from_sha256: str = ""


_WAYBACK_INDEX_LOCK = threading.Lock()
_WAYBACK_INDEX: Optional[Dict[str, WaybackSnapshot]] = None
_WAYBACK_INDEX_ERROR: Optional[str] = None


def split_frontmatter(source: str, path: Path) -> Frontmatter:
    opening = FRONTMATTER_OPEN.match(source)
    if not opening:
        raise ValueError(f"{path}: missing opening frontmatter delimiter")
    closing = FRONTMATTER_CLOSE.search(source, opening.end())
    if not closing:
        raise ValueError(f"{path}: missing closing frontmatter delimiter")
    return Frontmatter(
        header_start=opening.end(),
        header_end=closing.start(),
        body_start=closing.end(),
        header=source[opening.end() : closing.start()],
        body=source[closing.end() :],
        newline=opening.group("newline"),
    )


def parse_scalar(raw: str) -> str:
    value = raw.strip()
    if not value:
        return ""
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        if len(value) >= 2 and value[0] == value[-1] == "'":
            return value[1:-1].replace("''", "'")
        return value
    return str(parsed) if parsed is not None else ""


def scalar(header: str, key: str, default: str = "") -> str:
    match = re.search(rf"(?m)^{re.escape(key)}:\s*(.*?)\s*$", header)
    return parse_scalar(match.group(1)) if match else default


def boolean_scalar(header: str, key: str, default: bool = False) -> bool:
    match = re.search(rf"(?m)^{re.escape(key)}:\s*(.*?)\s*$", header)
    if not match:
        return default
    value = match.group(1).strip().lower()
    if value in {"true", "yes", "on", "1"}:
        return True
    if value in {"false", "no", "off", "0", ""}:
        return False
    return default


def normalized_hostname(value: str) -> str:
    candidate = value.strip().lower().rstrip(".")
    if not candidate:
        raise ValueError("image mirror host cannot be empty")
    parsed = urlsplit(
        candidate
        if candidate.startswith("//") or "://" in candidate
        else "//" + candidate
    )
    hostname = (parsed.hostname or "").lower().rstrip(".")
    if (
        not hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.port is not None
        or parsed.path not in ("", "/")
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError(f"invalid image mirror host {value!r}")
    return hostname.encode("idna").decode("ascii")


def hostname_list_scalar(header: str, key: str) -> Optional[Tuple[str, ...]]:
    match = re.search(rf"(?m)^{re.escape(key)}:\s*(.*?)\s*$", header)
    if not match:
        return None
    raw = match.group(1).strip()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as error:
        raise ValueError(f"{key} must be a JSON array of host names") from error
    if not isinstance(parsed, list) or any(not isinstance(value, str) for value in parsed):
        raise ValueError(f"{key} must be a JSON array of host names")
    return tuple(sorted({normalized_hostname(value) for value in parsed}))


def bounded_integer_scalar(
    header: str, key: str, minimum: int, maximum: int
) -> Optional[int]:
    match = re.search(rf"(?m)^{re.escape(key)}:\s*(.*?)\s*$", header)
    if not match:
        return None
    raw = match.group(1).strip()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as error:
        raise ValueError(f"{key} must be an integer") from error
    if isinstance(parsed, bool) or not isinstance(parsed, int):
        raise ValueError(f"{key} must be an integer")
    if not minimum <= parsed <= maximum:
        raise ValueError(f"{key} must be between {minimum} and {maximum}")
    return parsed


def safe_slug(value: str, fallback: str) -> str:
    slug = unicodedata.normalize("NFKC", unquote(value or fallback)).strip()
    slug = re.sub(r"[\\/:*?\"<>|#]+", "-", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip(".-")
    if not slug:
        slug = fallback
    while len(slug.encode("utf-8")) > 180:
        slug = slug[:-1]
    return slug or "post"


def merge_spans(spans: Iterable[Tuple[int, int]]) -> List[Tuple[int, int]]:
    result: List[Tuple[int, int]] = []
    for start, end in sorted(spans):
        if start >= end:
            continue
        if result and start <= result[-1][1]:
            result[-1] = (result[-1][0], max(result[-1][1], end))
        else:
            result.append((start, end))
    return result


def fenced_code_spans(body: str) -> List[Tuple[int, int]]:
    spans: List[Tuple[int, int]] = []
    cursor = 0
    while True:
        opening = FENCE_OPEN.search(body, cursor)
        if not opening:
            break
        fence = opening.group("fence")
        close = re.compile(
            rf"(?m)^[ \t]{{0,3}}{re.escape(fence[0])}{{{len(fence)},}}[ \t]*(?:\r?\n|\Z)"
        ).search(body, opening.end())
        end = close.end() if close else len(body)
        spans.append((opening.start(), end))
        cursor = end
    return spans


def ignored_body_spans(body: str) -> List[Tuple[int, int]]:
    # Discover each class on text with the earlier classes already hidden. A
    # literal ``<pre>`` inside a comment, for example, must not mask the rest
    # of the article when that comment has no matching ``</pre>``.
    spans: List[Tuple[int, int]] = [match.span() for match in HTML_COMMENT.finditer(body)]
    comment_mask = masked_text(body, merge_spans(spans))
    spans.extend(fenced_code_spans(comment_mask))
    search_text = masked_text(body, merge_spans(spans))
    cursor = 0
    while True:
        opening = IGNORED_HTML_OPEN.search(search_text, cursor)
        if not opening:
            break
        tag = opening.group(1)
        closing = re.compile(rf"</{re.escape(tag)}\s*>", re.IGNORECASE).search(
            search_text, opening.end()
        )
        end = closing.end() if closing else len(body)
        spans.append((opening.start(), end))
        cursor = end
    return merge_spans(spans)


def masked_text(source: str, spans: Sequence[Tuple[int, int]]) -> str:
    if not spans:
        return source
    parts: List[str] = []
    cursor = 0
    for start, end in spans:
        parts.append(source[cursor:start])
        parts.append("".join(char if char in "\r\n" else " " for char in source[start:end]))
        cursor = end
    parts.append(source[cursor:])
    return "".join(parts)


def is_escaped(source: str, position: int) -> bool:
    backslashes = 0
    position -= 1
    while position >= 0 and source[position] == "\\":
        backslashes += 1
        position -= 1
    return bool(backslashes % 2)


def markdown_image_spans(source: str) -> List[Tuple[int, int, str]]:
    """Return destination spans for inline Markdown images.

    This small parser handles angle destinations, balanced parentheses, and
    escaped punctuation while deliberately ignoring reference-style images.
    """
    results: List[Tuple[int, int, str]] = []
    cursor = 0
    length = len(source)
    while cursor < length - 1:
        marker = source.find("![", cursor)
        if marker == -1:
            break
        cursor = marker + 2
        if is_escaped(source, marker):
            continue

        bracket_depth = 1
        index = marker + 2
        while index < length and bracket_depth:
            if source[index] == "\\":
                index += 2
                continue
            if source[index] == "[":
                bracket_depth += 1
            elif source[index] == "]":
                bracket_depth -= 1
            index += 1
        if bracket_depth:
            continue
        # CommonMark inline links do not permit a line break between the label
        # and destination. This also prevents an Obsidian ![[...]] token from
        # being joined to an unrelated parenthesized phrase on a later line.
        while index < length and source[index] in " \t":
            index += 1
        if index >= length or source[index] != "(":
            continue
        index += 1
        while index < length and source[index] in " \t\r\n":
            index += 1
        if index >= length:
            continue

        if source[index] == "<":
            start = index + 1
            index = start
            while index < length:
                if source[index] == "\\":
                    index += 2
                    continue
                if source[index] == ">":
                    results.append((start, index, source[start:index]))
                    index += 1
                    break
                index += 1
            cursor = max(cursor, index)
            continue

        start = index
        paren_depth = 0
        while index < length:
            character = source[index]
            if character == "\\":
                index += 2
                continue
            if character == "(":
                paren_depth += 1
            elif character == ")":
                if paren_depth == 0:
                    break
                paren_depth -= 1
            elif character in " \t\r\n" and paren_depth == 0:
                break
            index += 1
        if index > start:
            results.append((start, index, source[start:index]))
        cursor = max(cursor, index + 1)
    return results


def markdown_destination(value: str) -> str:
    return re.sub(r"\\([\\`*_{}\[\]()#+\-.!<>])", r"\1", value)


def extract_references(source_text: str, frontmatter: Frontmatter) -> List[ImageReference]:
    references: List[ImageReference] = []

    featured = FEATURED_IMAGE.search(frontmatter.header)
    if featured:
        value = parse_scalar(featured.group("value"))
        if value:
            references.append(
                ImageReference(
                    start=frontmatter.header_start + featured.start("value"),
                    end=frontmatter.header_start + featured.end("value"),
                    value=html.unescape(value.strip()),
                    location="featuredImage",
                )
            )

    body = frontmatter.body
    mask = masked_text(body, ignored_body_spans(body))
    for match in HTML_IMAGE.finditer(mask):
        group = next(name for name in ("double", "single", "bare") if match.group(name) is not None)
        raw = match.group(group)
        references.append(
            ImageReference(
                start=frontmatter.body_start + match.start(group),
                end=frontmatter.body_start + match.end(group),
                value=html.unescape(raw.strip()),
                location="body",
            )
        )
    # Markdown-looking text inside HTML attributes is not Markdown. Mask only
    # the tags themselves so Markdown contained by <p>...</p> remains visible.
    markdown_mask = masked_text(mask, [match.span() for match in HTML_TAG.finditer(mask)])
    for start, end, raw in markdown_image_spans(markdown_mask):
        references.append(
            ImageReference(
                start=frontmatter.body_start + start,
                end=frontmatter.body_start + end,
                value=html.unescape(markdown_destination(raw.strip())),
                location="body",
            )
        )

    featured_refs = [ref for ref in references if ref.location == "featuredImage"]
    body_refs = sorted(
        (ref for ref in references if ref.location == "body"), key=lambda ref: ref.start
    )
    return featured_refs + body_refs


def parse_post(path: Path, repository_root: Path) -> Post:
    source_text = path.read_text(encoding="utf-8")
    frontmatter = split_frontmatter(source_text, path)
    published = scalar(frontmatter.header, "publishedAt")
    match = re.search(r"(?<!\d)(\d{4})-(\d{2})(?!\d)", published)
    if not match or not 1 <= int(match.group(2)) <= 12:
        raise ValueError(f"invalid publishedAt value {published!r}")
    slug = safe_slug(scalar(frontmatter.header, "slug", path.stem), path.stem)
    return Post(
        path=path,
        relative_path=path.relative_to(repository_root).as_posix(),
        source_text=source_text,
        frontmatter=frontmatter,
        year_month=f"{match.group(1)}-{match.group(2)}",
        slug=slug,
        draft=boolean_scalar(frontmatter.header, "draft"),
        image_mirror_include_hosts=hostname_list_scalar(
            frontmatter.header, "imageMirrorIncludeHosts"
        ),
        image_mirror_opaque_webp_quality=bounded_integer_scalar(
            frontmatter.header, "imageMirrorOpaqueWebpQuality", 1, 100
        ),
        references=extract_references(source_text, frontmatter),
    )


def raw_target_from_url(value: str) -> str:
    candidate = value.strip()
    if candidate.startswith("//"):
        candidate = "https:" + candidate
    parsed = urlsplit(candidate)
    if parsed.hostname is None or parsed.hostname.lower() != "raw.githubusercontent.com":
        return ""
    path_parts = [unquote(part) for part in parsed.path.split("/") if part]
    if len(path_parts) < 4:
        return ""
    if [part.lower() for part in path_parts[:3]] != ["haibinlai", "image-backend", "main"]:
        return ""
    return "/".join(path_parts[3:])


def raw_url(target: str) -> str:
    encoded = "/".join(quote(part, safe="-._~") for part in target.split("/"))
    return f"{RAW_BASE}/{encoded}"


def source_hostname(value: str) -> str:
    candidate = value.strip()
    if candidate.startswith("//"):
        candidate = "https:" + candidate
    parsed = urlsplit(candidate)
    if parsed.scheme.lower() not in REMOTE_SCHEMES or parsed.hostname is None:
        return ""
    try:
        return parsed.hostname.lower().rstrip(".").encode("idna").decode("ascii")
    except UnicodeError:
        return ""


def normalize_remote_url(value: str) -> str:
    candidate = value.strip()
    candidate = TRAILING_ENCODED_NEWLINE.sub("", candidate)
    if candidate.startswith("//"):
        candidate = "https:" + candidate
    parsed = urlsplit(candidate)
    path = TRAILING_ENCODED_NEWLINE.sub("", parsed.path.rstrip("\r\n"))
    path = quote(unquote(path), safe="/%:@-._~!$&'()*+,;=")
    return urlunsplit((parsed.scheme.lower(), parsed.netloc, path, parsed.query, ""))


def source_candidates(source: str) -> List[str]:
    source = source.strip()
    if source.startswith("//") or urlsplit(source).scheme.lower() in REMOTE_SCHEMES:
        normalized = normalize_remote_url(source)
        parsed = urlsplit(normalized)
        candidates: List[str] = []

        # A few historical object keys literally contain percent-encoded text
        # (for example ``%E5...`` as part of the stored filename).  Their URLs
        # therefore contain ``%25E5...``.  Trying only the decoded/normalized
        # form points at a different object and returns 404, so preserve that
        # exact ASCII path as the first candidate when double encoding is clear.
        original_parsed = urlsplit("https:" + source if source.startswith("//") else source)
        if re.search(r"(?i)%25[0-9a-f]{2}", original_parsed.path):
            candidates.append(
                urlunsplit(
                    (
                        original_parsed.scheme.lower(),
                        original_parsed.netloc,
                        original_parsed.path,
                        original_parsed.query,
                        "",
                    )
                )
            )
        candidates.append(normalized)
        if parsed.path.endswith("."):
            base = parsed.path[:-1]
            candidates.extend(
                urlunsplit((parsed.scheme, parsed.netloc, base + extension, parsed.query, ""))
                for extension in (".png", ".jpg", ".jpeg", ".webp", ".gif")
            )
        return list(dict.fromkeys(candidates))
    return [source]


def is_legacy_media_url(value: str) -> bool:
    candidate = "https:" + value if value.startswith("//") else value
    parsed = urlsplit(candidate)
    return (
        parsed.scheme.lower() in REMOTE_SCHEMES
        and (parsed.hostname or "").lower() in LEGACY_MEDIA_HOSTS
        and unquote(parsed.path).startswith(LEGACY_MEDIA_PATH_PREFIX)
    )


def wayback_lookup_key(value: str) -> str:
    normalized = normalize_remote_url(value)
    parsed = urlsplit(normalized)
    hostname = (parsed.hostname or "").lower()
    if hostname.startswith("www."):
        hostname = hostname[4:]
    path = unquote(parsed.path)
    query = f"?{parsed.query}" if parsed.query else ""
    return f"{hostname}{path}{query}"


def wayback_replay_url(snapshot: WaybackSnapshot) -> str:
    # The replay API expects the original URL after ``id_/``. Preserve URL
    # delimiters while encoding Unicode, spaces, and fragments safely.
    encoded_original = quote(
        normalize_remote_url(snapshot.original),
        safe=":/?&=;%@!$'()*+,-._~",
    )
    return f"{WAYBACK_REPLAY_BASE}/{snapshot.timestamp}id_/{encoded_original}"


def dry_run_source_is_valid(source: str, public_root: Path) -> bool:
    """Validate source structure without DNS, HTTP, or other network access."""
    value = source.strip()
    if not value or value.lower() in {"undefined", "null", "none"}:
        return False
    candidate = "https:" + value if value.startswith("//") else value
    parsed = urlsplit(candidate)
    if parsed.scheme.lower() in REMOTE_SCHEMES:
        if not parsed.hostname or parsed.username is not None or parsed.password is not None:
            return False
        try:
            parsed.port
        except ValueError:
            return False
        try:
            literal = ipaddress.ip_address(parsed.hostname.split("%", 1)[0])
        except ValueError:
            literal = None
        return literal is None or literal.is_global
    if parsed.scheme:
        return False
    try:
        return public_image_path(value, public_root).is_file()
    except (OSError, ValueError):
        return False


def is_public_address(address: str) -> bool:
    try:
        parsed = ipaddress.ip_address(address.split("%", 1)[0])
    except ValueError:
        return False
    return parsed.is_global


def validate_remote_url(url: str) -> None:
    parsed = urlsplit(url)
    if parsed.scheme.lower() not in REMOTE_SCHEMES:
        raise ValueError("only http and https URLs are allowed")
    if not parsed.hostname:
        raise ValueError("URL has no hostname")
    if parsed.username is not None or parsed.password is not None:
        raise ValueError("URLs containing credentials are not allowed")
    try:
        port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)
    except ValueError as error:
        raise ValueError("URL has an invalid port") from error

    hostname = parsed.hostname.rstrip(".")
    try:
        literal = ipaddress.ip_address(hostname.split("%", 1)[0])
    except ValueError:
        literal = None
    if literal is not None:
        if not literal.is_global:
            raise ValueError(f"refusing non-public address {literal}")
        return

    try:
        answers = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
    except socket.gaierror as error:
        raise ValueError(f"hostname lookup failed: {error}") from error
    addresses = {answer[4][0] for answer in answers}
    if not addresses:
        raise ValueError("hostname lookup returned no addresses")
    blocked = sorted(address for address in addresses if not is_public_address(address))
    if blocked:
        raise ValueError("refusing hostname with non-public address: " + ", ".join(blocked))


class SafeRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[no-untyped-def]
        absolute = urljoin(req.full_url, newurl)
        validate_remote_url(absolute)
        return super().redirect_request(req, fp, code, msg, headers, absolute)


def read_limited(response, max_bytes: int) -> bytes:  # type: ignore[no-untyped-def]
    declared = response.headers.get("Content-Length")
    if declared:
        try:
            if int(declared) > max_bytes:
                raise ValueError(f"image exceeds {max_bytes} byte limit")
        except ValueError as error:
            if "exceeds" in str(error):
                raise
    chunks: List[bytes] = []
    total = 0
    while True:
        chunk = response.read(min(1024 * 1024, max_bytes + 1 - total))
        if not chunk:
            break
        chunks.append(chunk)
        total += len(chunk)
        if total > max_bytes:
            raise ValueError(f"image exceeds {max_bytes} byte limit")
    return b"".join(chunks)


def wayback_cdx_url() -> str:
    parameters = [
        ("url", "www.haibinlaiblog.top/wp-content/uploads/*"),
        ("output", "json"),
        ("fl", "timestamp,original,mimetype,statuscode,digest"),
        ("filter", "statuscode:200"),
        ("filter", "mimetype:image/.*"),
        ("collapse", "urlkey"),
        ("sort", "reverse"),
    ]
    return f"{WAYBACK_CDX_BASE}?{urlencode(parameters)}"


def parse_wayback_cdx(payload: bytes) -> Dict[str, WaybackSnapshot]:
    try:
        decoded = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ValueError(f"invalid Wayback CDX JSON: {error}") from error
    if not isinstance(decoded, list) or not decoded:
        return {}
    header = decoded[0]
    if not isinstance(header, list):
        raise ValueError("invalid Wayback CDX header")
    positions = {str(name): index for index, name in enumerate(header)}
    required = {"timestamp", "original", "mimetype", "statuscode"}
    if not required.issubset(positions):
        raise ValueError("Wayback CDX response is missing required fields")

    snapshots: Dict[str, WaybackSnapshot] = {}
    for row in decoded[1:]:
        if not isinstance(row, list) or len(row) < len(header):
            continue
        timestamp = str(row[positions["timestamp"]])
        original = str(row[positions["original"]])
        mime_type = str(row[positions["mimetype"]]).lower()
        status = str(row[positions["statuscode"]])
        if (
            not re.fullmatch(r"\d{14}", timestamp)
            or status != "200"
            or not mime_type.startswith("image/")
            or not is_legacy_media_url(original)
        ):
            continue
        key = wayback_lookup_key(original)
        candidate = WaybackSnapshot(timestamp, original, mime_type)
        previous = snapshots.get(key)
        if previous is None or candidate.timestamp > previous.timestamp:
            snapshots[key] = candidate
    return snapshots


def load_wayback_media_index(timeout: float) -> Dict[str, WaybackSnapshot]:
    url = wayback_cdx_url()
    validate_remote_url(url)
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json,text/plain;q=0.8",
            "Accept-Encoding": "identity",
        },
    )
    opener = build_opener(SafeRedirectHandler())
    with opener.open(request, timeout=timeout) as response:
        content_type = (response.headers.get("Content-Type") or "").split(";", 1)[0].lower()
        if content_type and content_type not in {
            "application/json",
            "text/json",
            "text/plain",
            "application/octet-stream",
        }:
            raise ValueError(f"unexpected Wayback CDX content type {content_type}")
        return parse_wayback_cdx(read_limited(response, WAYBACK_CDX_MAX_BYTES))


def get_wayback_media_index(timeout: float) -> Dict[str, WaybackSnapshot]:
    global _WAYBACK_INDEX, _WAYBACK_INDEX_ERROR
    if _WAYBACK_INDEX is not None:
        return _WAYBACK_INDEX
    if _WAYBACK_INDEX_ERROR is not None:
        raise RuntimeError(_WAYBACK_INDEX_ERROR)
    with _WAYBACK_INDEX_LOCK:
        if _WAYBACK_INDEX is not None:
            return _WAYBACK_INDEX
        if _WAYBACK_INDEX_ERROR is None:
            try:
                _WAYBACK_INDEX = load_wayback_media_index(timeout)
            except Exception as error:
                _WAYBACK_INDEX_ERROR = f"{type(error).__name__}: {error}"
        if _WAYBACK_INDEX is None:
            raise RuntimeError(_WAYBACK_INDEX_ERROR or "Wayback CDX lookup failed")
        return _WAYBACK_INDEX


def public_image_path(source: str, public_root: Path) -> Path:
    parsed = urlsplit(source)
    if parsed.scheme:
        raise ValueError(f"unsupported image URL scheme {parsed.scheme!r}")
    value = unquote(source.split("?", 1)[0].split("#", 1)[0]).replace("\\", "/")
    value = value.lstrip("/")
    while value.startswith("./"):
        value = value[2:]
    if value.startswith("haibinblog/"):
        value = value[len("haibinblog/") :]
    if value.startswith("public/"):
        value = value[len("public/") :]
    path = (public_root / value).resolve()
    try:
        path.relative_to(public_root.resolve())
    except ValueError as error:
        raise ValueError("local image escapes the public directory") from error
    return path


def download_candidate(
    candidate: str, public_root: Path, timeout: float, max_bytes: int
) -> Tuple[bytes, str]:
    parsed = urlsplit(candidate if not candidate.startswith("//") else "https:" + candidate)
    if parsed.scheme.lower() in REMOTE_SCHEMES:
        validate_remote_url(candidate)
        request = Request(
            candidate,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "image/avif,image/webp,image/png,image/jpeg,image/gif,image/*;q=0.8",
                "Accept-Encoding": "identity",
            },
        )
        opener = build_opener(SafeRedirectHandler())
        with opener.open(request, timeout=timeout) as response:
            mime_type = (response.headers.get("Content-Type") or "").split(";", 1)[0].strip().lower()
            if mime_type == "image/svg+xml":
                raise ValueError("SVG images are not mirrored")
            if mime_type and not (
                mime_type.startswith("image/") or mime_type == "application/octet-stream"
            ):
                raise ValueError(f"unexpected content type {mime_type}")
            return read_limited(response, max_bytes), mime_type

    path = public_image_path(candidate, public_root)
    if not path.is_file():
        raise FileNotFoundError(f"local image not found: {path}")
    if path.stat().st_size > max_bytes:
        raise ValueError(f"image exceeds {max_bytes} byte limit")
    return path.read_bytes(), ""


def magic_format(payload: bytes) -> str:
    if payload.startswith(b"\x89PNG\r\n\x1a\n"):
        return "PNG"
    if payload.startswith(b"\xff\xd8\xff"):
        return "JPEG"
    if payload.startswith((b"GIF87a", b"GIF89a")):
        return "GIF"
    if len(payload) >= 12 and payload[:4] == b"RIFF" and payload[8:12] == b"WEBP":
        return "WEBP"
    if payload.startswith(b"BM"):
        return "BMP"
    if payload.startswith((b"II*\x00", b"MM\x00*")):
        return "TIFF"
    if payload.startswith(b"\x00\x00\x01\x00"):
        return "ICO"
    if len(payload) >= 12 and payload[4:8] == b"ftyp" and payload[8:12] in {
        b"avif",
        b"avis",
    }:
        return "AVIF"
    stripped = payload[:1024].lstrip().lower()
    if stripped.startswith(b"<?xml") or stripped.startswith(b"<svg"):
        raise ValueError("SVG images are not mirrored")
    raise ValueError("unrecognized image signature")


def validated_image(payload: bytes, mime_type: str) -> Tuple[str, bool]:
    detected = magic_format(payload)

    # A sizeable part of the historical object store has incorrect metadata
    # (most often image/png for JPEG bytes).  Treat Content-Type as descriptive
    # only: the signature and Pillow's full decode below determine whether the
    # payload is a supported image.  SVG is still rejected both when downloading
    # and by magic_format().

    with warnings.catch_warnings():
        warnings.simplefilter("error", Image.DecompressionBombWarning)
        try:
            with Image.open(BytesIO(payload)) as probe:
                pillow_format = (probe.format or "").upper()
                frame_count = int(getattr(probe, "n_frames", 1) or 1)
                animated = frame_count > 1
                if frame_count > MAX_ANIMATION_FRAMES:
                    raise ValueError(
                        f"image has {frame_count} frames; limit is {MAX_ANIMATION_FRAMES}"
                    )
                probe.verify()
            with Image.open(BytesIO(payload)) as decoded:
                decoded_pixels = 0
                for frame in ImageSequence.Iterator(decoded):
                    decoded_pixels += frame.width * frame.height
                    if decoded_pixels > MAX_DECODED_PIXELS:
                        raise ValueError(
                            f"decoded animation exceeds {MAX_DECODED_PIXELS} total pixels"
                        )
                    frame.load()
        except (UnidentifiedImageError, OSError, SyntaxError) as error:
            raise ValueError(f"Pillow could not validate image: {error}") from error
    if pillow_format == "JPG":
        pillow_format = "JPEG"
    if pillow_format != detected:
        raise ValueError(f"image signature {detected} disagrees with Pillow format {pillow_format}")
    return detected, animated


def prepare_image(
    payload: bytes,
    mime_type: str,
    source_url: str,
    lossless_source_hint: bool = False,
    opaque_webp_quality: Optional[int] = None,
) -> StoredImage:
    source_format, animated = validated_image(payload, mime_type)
    original_extension = FORMAT_EXTENSIONS.get(source_format)
    if not original_extension:
        raise ValueError(f"unsupported Pillow image format {source_format}")

    # Keep every animation byte-for-byte so no frames, timing, or loop metadata
    # can be lost during web optimization.
    if animated:
        return StoredImage(
            payload=payload,
            extension=original_extension,
            source_url=source_url,
            source_format=source_format,
            stored_format=source_format,
            mime_type=mime_type,
        )

    with warnings.catch_warnings():
        warnings.simplefilter("error", Image.DecompressionBombWarning)
        with Image.open(BytesIO(payload)) as original:
            image = ImageOps.exif_transpose(original)
            oversized = max(image.size) > MAX_STATIC_LONG_EDGE

            # A web-sized static WebP is already the desired delivery format.
            if (
                source_format == "WEBP"
                and not oversized
                and opaque_webp_quality is None
            ):
                return StoredImage(
                    payload=payload,
                    extension=original_extension,
                    source_url=source_url,
                    source_format=source_format,
                    stored_format=source_format,
                    mime_type=mime_type,
                )

            icc_profile = original.info.get("icc_profile")
            if oversized:
                scale = MAX_STATIC_LONG_EDGE / max(image.size)
                resized = (
                    max(1, round(image.width * scale)),
                    max(1, round(image.height * scale)),
                )
                image = image.resize(resized, LANCZOS)

            has_alpha = "A" in image.getbands() or (
                image.mode == "P" and "transparency" in image.info
            )
            if has_alpha:
                image = image.convert("RGBA")
            else:
                image = image.convert("RGB")
            output = BytesIO()
            lossless = has_alpha or (
                opaque_webp_quality is None
                and (source_format == "PNG" or lossless_source_hint)
            )
            save_options: Dict[str, object] = {"method": 6}
            if isinstance(icc_profile, bytes) and icc_profile:
                save_options["icc_profile"] = icc_profile
            if lossless:
                image.save(output, format="WEBP", lossless=True, **save_options)
            else:
                image.save(
                    output,
                    format="WEBP",
                    quality=(
                        opaque_webp_quality
                        if opaque_webp_quality is not None
                        else PHOTO_WEBP_QUALITY
                    ),
                    **save_options,
                )
            converted = output.getvalue()
            expected_size = image.size
            expected_alpha = has_alpha

    # A downscaled source must never fall back to its oversized original. For
    # small opaque non-PNG rasters, retaining a smaller original remains useful.
    if (
        opaque_webp_quality is None
        and not oversized
        and not lossless
        and len(converted) >= len(payload)
    ):
        return StoredImage(
            payload=payload,
            extension=original_extension,
            source_url=source_url,
            source_format=source_format,
            stored_format=source_format,
            mime_type=mime_type,
        )
    stored_format, stored_animated = validated_image(converted, "image/webp")
    if stored_format != "WEBP" or stored_animated:
        raise ValueError("optimized static image did not validate as static WebP")
    with Image.open(BytesIO(converted)) as check:
        check.load()
        if check.size != expected_size:
            raise ValueError(
                f"optimized image size {check.size} disagrees with expected {expected_size}"
            )
        if expected_alpha and "A" not in check.getbands():
            raise ValueError("optimized image lost its alpha channel")
    return StoredImage(
        payload=converted,
        extension="webp",
        source_url=source_url,
        source_format=source_format,
        stored_format="WEBP",
        mime_type=mime_type,
    )


def fetch_image(item: WorkItem, public_root: Path, timeout: float, max_bytes: int) -> StoredImage:
    errors: List[str] = []
    direct_candidates = source_candidates(item.source)
    for candidate in direct_candidates:
        try:
            payload, mime_type = download_candidate(candidate, public_root, timeout, max_bytes)
            return prepare_image(
                payload,
                mime_type,
                candidate,
                opaque_webp_quality=item.post.image_mirror_opaque_webp_quality,
            )
        except Exception as error:
            errors.append(f"{candidate}: {type(error).__name__}: {str(error)[:300]}")

    legacy_candidates = [candidate for candidate in direct_candidates if is_legacy_media_url(candidate)]
    if legacy_candidates:
        try:
            index = get_wayback_media_index(timeout)
            snapshots = [
                snapshot
                for candidate in legacy_candidates
                for snapshot in [index.get(wayback_lookup_key(candidate))]
                if snapshot is not None
            ]
            if not snapshots:
                raise LookupError("no archived 200 image snapshot found")
            snapshot = max(snapshots, key=lambda value: value.timestamp)
            archive_url = wayback_replay_url(snapshot)
            try:
                payload, mime_type = download_candidate(
                    archive_url, public_root, timeout, max_bytes
                )
                return prepare_image(
                    payload,
                    mime_type,
                    archive_url,
                    opaque_webp_quality=item.post.image_mirror_opaque_webp_quality,
                )
            except Exception as error:
                errors.append(
                    f"Wayback replay {archive_url}: {type(error).__name__}: {str(error)[:300]}"
                )
        except Exception as error:
            errors.append(f"Wayback CDX: {type(error).__name__}: {str(error)[:300]}")
    raise ValueError("; ".join(errors) if errors else "no usable source URL")


def safe_manifest_target(image_repo: Path, target: str) -> Optional[Path]:
    pure = PurePosixPath(target)
    if pure.is_absolute() or ".." in pure.parts or not pure.parts:
        return None
    path = (image_repo / Path(*pure.parts)).resolve()
    try:
        path.relative_to(image_repo.resolve())
    except ValueError:
        return None
    return path


def safe_body_target_for_prune(image_repo: Path, target: str) -> Optional[Path]:
    pure = PurePosixPath(target)
    if (
        pure.is_absolute()
        or ".." in pure.parts
        or len(pure.parts) != 3
        or pure.as_posix() != target
        or not re.fullmatch(r"\d{4}-\d{2}", pure.parts[0])
        or BODY_TARGET_NAME.fullmatch(pure.name) is None
    ):
        return None
    path = image_repo.joinpath(*pure.parts)
    root = image_repo.resolve()
    cursor = path
    while cursor != image_repo:
        if cursor.is_symlink():
            return None
        cursor = cursor.parent
    try:
        path.resolve().relative_to(root)
    except ValueError:
        return None
    return path


def existing_manifest(image_repo: Path) -> List[Dict[str, object]]:
    path = image_repo / MANIFEST_NAME
    if not path.is_file():
        return []
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    entries = payload.get("entries", []) if isinstance(payload, dict) else []
    return [entry for entry in entries if isinstance(entry, dict)] if isinstance(entries, list) else []


def prune_superseded_targets(
    items: Sequence[WorkItem],
    exclusions: Sequence[ExcludedImage],
    results: Dict[Tuple[str, str], MirrorResult],
    previous_entries: Sequence[Dict[str, object]],
    image_repo: Path,
    live_targets: Set[str],
) -> Tuple[int, int]:
    """Delete only verified old body assets that a successful result replaced."""
    new_targets = {result.target for result in results.values() if result.target}
    protected_error_targets = {
        str(entry.get("target", ""))
        for entry in previous_entries
        if entry.get("status") == "error" and entry.get("target")
    }
    candidates: Dict[str, str] = {}

    def add_previous_targets(
        previous: Dict[str, object], current_target: str = ""
    ) -> None:
        prior_targets: List[Tuple[object, object]] = []
        if previous.get("status") in {"mirrored", "excluded"}:
            prior_targets.append((previous.get("target"), previous.get("sha256")))
        history = previous.get("previousTargets", [])
        if isinstance(history, list):
            for historical in history:
                if isinstance(historical, dict):
                    prior_targets.append(
                        (historical.get("target"), historical.get("sha256"))
                    )
        for old_target, old_sha in prior_targets:
            if not (
                isinstance(old_target, str)
                and isinstance(old_sha, str)
                and old_target
                and old_sha
                and old_target != current_target
                and old_target not in new_targets
                and old_target not in live_targets
                and old_target not in protected_error_targets
            ):
                continue
            known_sha = candidates.get(old_target)
            candidates[old_target] = old_sha if known_sha in (None, old_sha) else ""

    for item in items:
        previous = item.previous
        result = results[(item.post.relative_path, item.source)]
        if not previous or result.status != "mirrored":
            continue
        add_previous_targets(previous, result.target)
    for exclusion in exclusions:
        if exclusion.previous:
            add_previous_targets(exclusion.previous)

    files_pruned = 0
    prune_failures = 0
    for target, expected_sha in sorted(candidates.items()):
        if not expected_sha:
            prune_failures += 1
            print(f"prune_error={target}: conflicting historical checksums", file=sys.stderr)
            continue
        path = safe_body_target_for_prune(image_repo, target)
        if path is None:
            prune_failures += 1
            print(f"prune_error={target}: unsafe body target", file=sys.stderr)
            continue
        if not path.exists():
            continue
        if not path.is_file() or path.is_symlink():
            prune_failures += 1
            print(f"prune_error={target}: target is not a regular file", file=sys.stderr)
            continue
        try:
            if hashlib.sha256(path.read_bytes()).hexdigest() != expected_sha:
                raise ValueError("checksum differs from previous manifest")
            path.unlink()
            files_pruned += 1
        except Exception as error:
            prune_failures += 1
            print(
                f"prune_error={target}: {type(error).__name__}: {error}",
                file=sys.stderr,
            )
    return files_pruned, prune_failures


def verify_final_state_before_prune(
    paths: Sequence[Path],
    repository_root: Path,
    items: Sequence[WorkItem],
    exclusions: Sequence[ExcludedImage],
    results: Dict[Tuple[str, str], MirrorResult],
    image_repo: Path,
) -> Tuple[Set[str], List[str]]:
    """Re-read posts and image files before deleting any superseded asset."""
    live_targets: Set[str] = set()
    actual_references: Counter[Tuple[str, str]] = Counter()
    failures: List[str] = []

    for path in paths:
        try:
            post = parse_post(path, repository_root)
        except Exception as error:
            failures.append(
                f"{path.relative_to(repository_root).as_posix()}: "
                f"{type(error).__name__}: {error}"
            )
            continue
        for reference in post.references:
            actual_references[(post.relative_path, reference.value)] += 1
            target = raw_target_from_url(reference.value)
            if not target:
                continue
            live_targets.add(target)
            target_path = safe_manifest_target(image_repo, target)
            if target_path is None or not target_path.is_file():
                failures.append(
                    f"{post.relative_path}: managed image is missing or unsafe: {target}"
                )

    for item in items:
        result = results[(item.post.relative_path, item.source)]
        if result.status != "mirrored" or not result.raw_url:
            continue
        actual = actual_references[(item.post.relative_path, result.raw_url)]
        expected = len(item.references)
        if actual != expected:
            failures.append(
                f"{item.post.relative_path}: expected {expected} references to "
                f"{result.raw_url}, found {actual}"
            )
        target_path = safe_body_target_for_prune(image_repo, result.target)
        if target_path is None or not target_path.is_file() or target_path.is_symlink():
            failures.append(
                f"{item.post.relative_path}: mirrored target is missing or unsafe: "
                f"{result.target}"
            )
            continue
        try:
            payload = target_path.read_bytes()
        except OSError as error:
            failures.append(
                f"{item.post.relative_path}: cannot read {result.target}: {error}"
            )
            continue
        if len(payload) != result.byte_count:
            failures.append(
                f"{item.post.relative_path}: byte count differs for {result.target}"
            )
        if hashlib.sha256(payload).hexdigest() != result.sha256:
            failures.append(
                f"{item.post.relative_path}: checksum differs for {result.target}"
            )

    for exclusion in exclusions:
        actual = actual_references[
            (exclusion.post.relative_path, exclusion.source)
        ]
        expected = len(exclusion.references)
        if actual != expected:
            failures.append(
                f"{exclusion.post.relative_path}: expected {expected} excluded "
                f"references restored to {exclusion.source}, found {actual}"
            )

    return live_targets, failures


def reusable_previous(entry: Dict[str, object], image_repo: Path) -> bool:
    if entry.get("status") != "mirrored":
        return False
    target = entry.get("target")
    sha256 = entry.get("sha256")
    if not isinstance(target, str) or not isinstance(sha256, str):
        return False
    path = safe_body_target_for_prune(image_repo, target)
    if path is None or not path.is_file():
        return False
    return hashlib.sha256(path.read_bytes()).hexdigest() == sha256


def target_number(entry: Optional[Dict[str, object]]) -> Optional[int]:
    if not entry:
        return None
    target = entry.get("target")
    if not isinstance(target, str):
        return None
    match = BODY_TARGET_NAME.match(PurePosixPath(target).name)
    return int(match.group("number")) if match else None


def build_work_items(
    posts: Sequence[Post], previous_entries: Sequence[Dict[str, object]]
) -> Tuple[List[WorkItem], List[ExcludedImage], int]:
    previous_by_source: Dict[Tuple[str, str], Dict[str, object]] = {}
    previous_by_raw: Dict[Tuple[str, str], Dict[str, object]] = {}
    for entry in previous_entries:
        post = entry.get("post")
        source = entry.get("source")
        raw = entry.get("rawUrl")
        if isinstance(post, str) and isinstance(source, str):
            previous_by_source[(post, source)] = entry
        if isinstance(post, str) and isinstance(raw, str) and raw:
            previous_by_raw[(post, raw)] = entry
        aliases = entry.get("previousRawUrls", [])
        if isinstance(post, str) and isinstance(aliases, list):
            for alias in aliases:
                if isinstance(alias, str) and alias:
                    previous_by_raw[(post, alias)] = entry

    items: List[WorkItem] = []
    exclusions: List[ExcludedImage] = []
    already_mirrored = 0
    for post in posts:
        grouped: Dict[str, List[ImageReference]] = {}
        previous_for_source: Dict[str, Optional[Dict[str, object]]] = {}
        order: List[str] = []
        excluded_grouped: Dict[str, List[ImageReference]] = {}
        excluded_previous: Dict[str, Optional[Dict[str, object]]] = {}
        excluded_order: List[str] = []
        include_hosts = (
            set(post.image_mirror_include_hosts)
            if post.image_mirror_include_hosts is not None
            else None
        )
        for reference in post.references:
            if not reference.value:
                continue
            prior = previous_by_raw.get((post.relative_path, reference.value))
            if prior is None:
                prior = previous_by_source.get((post.relative_path, reference.value))
            managed_raw = bool(raw_target_from_url(reference.value))
            source = (
                str(prior.get("source", ""))
                if managed_raw and prior is not None
                else reference.value
            )
            if not source:
                source = reference.value
            reference.source = source

            if include_hosts is not None and source_hostname(source) not in include_hosts:
                if source not in excluded_grouped:
                    excluded_grouped[source] = []
                    excluded_previous[source] = prior
                    excluded_order.append(source)
                excluded_grouped[source].append(reference)
                continue

            if managed_raw and (
                prior is None
                or not isinstance(prior.get("source"), str)
                or not str(prior.get("source", ""))
            ):
                already_mirrored += 1
                continue
            if source not in grouped:
                grouped[source] = []
                previous_for_source[source] = prior
                order.append(source)
            grouped[source].append(reference)

        used_numbers: Set[int] = set()
        for source in order:
            number = target_number(previous_for_source[source])
            if number is not None:
                used_numbers.add(number)
        next_number = 1
        for source in order:
            prior = previous_for_source[source]
            number = target_number(prior)
            if number is None:
                while next_number in used_numbers:
                    next_number += 1
                number = next_number
                used_numbers.add(number)
                next_number += 1
            items.append(
                WorkItem(
                    post=post,
                    source=source,
                    number=number,
                    references=grouped[source],
                    previous=prior,
                )
            )
        for source in excluded_order:
            exclusions.append(
                ExcludedImage(
                    post=post,
                    source=source,
                    references=excluded_grouped[source],
                    previous=excluded_previous[source],
                )
            )
    return items, exclusions, already_mirrored


def work_item_fingerprint(item: WorkItem, public_root: Path) -> str:
    inputs: Dict[str, object] = {
        "processorVersion": PROCESSOR_VERSION,
        "source": item.source,
        "candidates": source_candidates(item.source),
        "maxStaticLongEdge": MAX_STATIC_LONG_EDGE,
        "pngWebpLossless": True,
        "alphaWebpLossless": True,
        "photoWebpQuality": PHOTO_WEBP_QUALITY,
        "resizeResampler": "LANCZOS",
        "applyExifOrientation": True,
        "preserveIccProfile": True,
        "preserveSmallStaticWebpBytes": True,
        "oversizedNeverFallsBack": True,
        "preserveSmallOpaqueWhenConversionIsLarger": True,
        "preserveAnimation": True,
    }
    if item.post.image_mirror_opaque_webp_quality is not None:
        inputs["postOpaqueWebpQuality"] = (
            item.post.image_mirror_opaque_webp_quality
        )
    parsed = urlsplit(item.source if not item.source.startswith("//") else "https:" + item.source)
    if parsed.scheme.lower() not in REMOTE_SCHEMES:
        try:
            path = public_image_path(item.source, public_root)
            inputs["localSha256"] = (
                hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else "missing"
            )
        except Exception as error:
            inputs["localSha256"] = f"{type(error).__name__}:{error}"
    encoded = json.dumps(inputs, ensure_ascii=False, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def cached_result(item: WorkItem, image_repo: Path) -> Optional[MirrorResult]:
    entry = item.previous
    if entry is None:
        return None
    if entry.get("processorVersion") != PROCESSOR_VERSION:
        return None
    if entry.get("optimizationError"):
        return None
    if entry.get("inputSha256") != item.input_sha256:
        return None
    target = str(entry["target"])
    required_prefix = f"{item.post.year_month}/{item.post.slug}/"
    if not target.startswith(required_prefix):
        return None
    if not reusable_previous(entry, image_repo):
        return None
    return MirrorResult(
        status="mirrored",
        source=item.source,
        source_url=str(entry.get("sourceUrl", item.source)),
        target=target,
        raw_url=raw_url(target),
        sha256=str(entry.get("sha256", "")),
        byte_count=int(entry.get("bytes", 0) or 0),
        source_format=str(entry.get("sourceFormat", "")),
        stored_format=str(entry.get("storedFormat", "")),
        mime_type=str(entry.get("sourceMimeType", entry.get("mimeType", ""))),
        error="",
        processor_version=int(entry.get("processorVersion", PROCESSOR_VERSION)),
        input_sha256=str(entry.get("inputSha256", item.input_sha256)),
        optimization_error=str(entry.get("optimizationError", "")),
        derived_from_target=str(entry.get("derivedFromTarget", "")),
        derived_from_sha256=str(entry.get("derivedFromSha256", "")),
    )


def previous_processor_version(entry: Optional[Dict[str, object]]) -> int:
    if not entry:
        return 0
    try:
        return int(entry.get("processorVersion", 0))
    except (TypeError, ValueError):
        return 0


def prepare_previous_image(
    item: WorkItem, image_repo: Path, max_bytes: int
) -> StoredImage:
    entry = item.previous
    if not entry or entry.get("status") != "mirrored":
        raise ValueError("previous manifest entry is not a mirrored image")
    target = entry.get("target")
    expected_sha = entry.get("sha256")
    if not isinstance(target, str) or not isinstance(expected_sha, str) or not expected_sha:
        raise ValueError("previous manifest entry has no verifiable target")
    path = safe_body_target_for_prune(image_repo, target)
    if path is None or not path.is_file():
        raise FileNotFoundError("previous mirrored image is missing")
    size = path.stat().st_size
    if size > max_bytes:
        raise ValueError(f"previous mirrored image exceeds {max_bytes} byte limit")
    payload = path.read_bytes()
    if hashlib.sha256(payload).hexdigest() != expected_sha:
        raise ValueError("previous mirrored image checksum does not match manifest")

    prior_stored_format = str(entry.get("storedFormat", "")).upper()
    stored_mime = str(entry.get("storedMimeType", "")) or FORMAT_MIME_TYPES.get(
        prior_stored_format, ""
    )
    semantic_source_format = str(entry.get("sourceFormat", "")).upper()
    semantic_source_mime = str(
        entry.get("sourceMimeType", entry.get("mimeType", ""))
    )
    semantic_source_url = str(entry.get("sourceUrl", "")) or item.source
    lossless_hint = semantic_source_format == "PNG" or semantic_source_mime == "image/png"
    prepared = prepare_image(
        payload,
        stored_mime,
        semantic_source_url,
        lossless_source_hint=lossless_hint,
        opaque_webp_quality=item.post.image_mirror_opaque_webp_quality,
    )
    return replace(
        prepared,
        source_url=semantic_source_url,
        source_format=semantic_source_format or prepared.source_format,
        mime_type=semantic_source_mime or prepared.mime_type,
        derived_from_target=target,
        derived_from_sha256=expected_sha,
    )


def fetch_or_upgrade_image(
    item: WorkItem,
    public_root: Path,
    image_repo: Path,
    timeout: float,
    max_bytes: int,
) -> StoredImage:
    local_error: Optional[Exception] = None
    if item.prefer_previous_file:
        try:
            return prepare_previous_image(item, image_repo, max_bytes)
        except Exception as error:
            local_error = error
    try:
        return fetch_image(item, public_root, timeout, max_bytes)
    except Exception as source_error:
        if local_error is not None:
            raise ValueError(
                "previous local upgrade failed: "
                f"{type(local_error).__name__}: {local_error}; "
                "source fallback failed: "
                f"{type(source_error).__name__}: {source_error}"
            ) from source_error
        raise


def result_from_stored(item: WorkItem, image: StoredImage) -> MirrorResult:
    digest = hashlib.sha256(image.payload).hexdigest()
    target = (
        f"{item.post.year_month}/{item.post.slug}/"
        f"body-{item.number:03d}-{digest[:12]}.{image.extension}"
    )
    return MirrorResult(
        status="mirrored",
        source=item.source,
        source_url=image.source_url,
        target=target,
        raw_url=raw_url(target),
        sha256=digest,
        byte_count=len(image.payload),
        source_format=image.source_format,
        stored_format=image.stored_format,
        mime_type=image.mime_type,
        error="",
        payload=image.payload,
        processor_version=PROCESSOR_VERSION,
        input_sha256=item.input_sha256,
        derived_from_target=image.derived_from_target,
        derived_from_sha256=image.derived_from_sha256,
    )


def persist_stored_image(
    item: WorkItem, image: StoredImage, image_repo: Path
) -> Tuple[MirrorResult, bool]:
    """Atomically persist one completed image and discard its in-memory bytes."""
    result = result_from_stored(item, image)
    target_path = safe_body_target_for_prune(image_repo, result.target)
    if target_path is None:
        raise ValueError("unsafe output target")
    changed = atomic_write(target_path, result.payload)
    return replace(result, payload=b""), changed


def error_result(item: WorkItem, error: Exception, image_repo: Path) -> MirrorResult:
    previous = item.previous or {}
    message = f"{type(error).__name__}: {str(error)[:2000]}"
    if previous.get("status") == "mirrored" and reusable_previous(
        previous, image_repo
    ):
        target = str(previous.get("target", ""))
        return MirrorResult(
            status="mirrored",
            source=item.source,
            source_url=str(previous.get("sourceUrl", item.source)),
            target=target,
            raw_url=raw_url(target),
            sha256=str(previous.get("sha256", "")),
            byte_count=int(previous.get("bytes", 0) or 0),
            source_format=str(previous.get("sourceFormat", "")),
            stored_format=str(previous.get("storedFormat", "")),
            mime_type=str(
                previous.get("sourceMimeType", previous.get("mimeType", ""))
            ),
            error="",
            processor_version=previous_processor_version(previous),
            input_sha256=str(previous.get("inputSha256", "")),
            optimization_error=message,
            derived_from_target=str(previous.get("derivedFromTarget", "")),
            derived_from_sha256=str(previous.get("derivedFromSha256", "")),
        )
    return MirrorResult(
        status="error",
        source=item.source,
        source_url=str(previous.get("sourceUrl", "")),
        target=str(previous.get("target", "")),
        raw_url=str(previous.get("rawUrl", "")),
        sha256=str(previous.get("sha256", "")),
        byte_count=int(previous.get("bytes", 0) or 0),
        source_format=str(previous.get("sourceFormat", "")),
        stored_format=str(previous.get("storedFormat", "")),
        mime_type=str(previous.get("sourceMimeType", previous.get("mimeType", ""))),
        error=message,
        processor_version=PROCESSOR_VERSION,
        input_sha256=item.input_sha256,
    )


def atomic_write(path: Path, payload: bytes) -> bool:
    if path.is_file() and path.read_bytes() == payload:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=str(path.parent))
    try:
        with os.fdopen(descriptor, "wb") as output:
            output.write(payload)
            output.flush()
            os.fsync(output.fileno())
        os.chmod(temporary_name, path.stat().st_mode & 0o777 if path.exists() else 0o644)
        os.replace(temporary_name, path)
    except BaseException:
        try:
            os.unlink(temporary_name)
        except FileNotFoundError:
            pass
        raise
    return True


def fetch_and_store_pending(
    pending: Sequence[WorkItem],
    public_root: Path,
    image_repo: Path,
    workers: int,
    timeout: float,
    max_bytes: int,
) -> Tuple[Dict[Tuple[str, str], MirrorResult], int, int, int]:
    """Fetch with bounded concurrency and write each completed payload immediately.

    At most ``workers`` futures exist at once. Completed futures are removed and
    cleared before replacements are submitted, so their byte payloads cannot
    accumulate across the full corpus.
    """
    results: Dict[Tuple[str, str], MirrorResult] = {}
    images_written = 0
    images_unchanged = 0
    write_failures = 0
    item_iterator = iter(pending)
    executor = ThreadPoolExecutor(max_workers=workers)
    in_flight: Dict[object, WorkItem] = {}

    def fill_slots() -> None:
        while len(in_flight) < workers:
            try:
                item = next(item_iterator)
            except StopIteration:
                return
            future = executor.submit(
                fetch_or_upgrade_image,
                item,
                public_root,
                image_repo,
                timeout,
                max_bytes,
            )
            in_flight[future] = item

    try:
        fill_slots()
        while in_flight:
            completed, _ = wait(tuple(in_flight), return_when=FIRST_COMPLETED)
            for future in completed:
                item = in_flight.pop(future)
                key = (item.post.relative_path, item.source)
                try:
                    image = future.result()
                except Exception as error:
                    results[key] = error_result(item, error, image_repo)
                    continue
                try:
                    result, changed = persist_stored_image(item, image, image_repo)
                    results[key] = result
                    if changed:
                        images_written += 1
                    else:
                        images_unchanged += 1
                except Exception as error:
                    results[key] = error_result(item, error, image_repo)
                    write_failures += 1
                finally:
                    del image
            # Release Future.result() payloads before starting another batch.
            completed.clear()
            del future
            fill_slots()
    except BaseException:
        for future in in_flight:
            future.cancel()
        in_flight.clear()
        executor.shutdown(wait=False, cancel_futures=True)
        raise
    else:
        executor.shutdown(wait=True)

    return results, images_written, images_unchanged, write_failures


def apply_replacements(source: str, replacements: Sequence[Tuple[int, int, str]]) -> str:
    updated = source
    previous_start = len(source) + 1
    for start, end, value in sorted(replacements, reverse=True):
        if start < 0 or end < start or end > len(source) or end > previous_start:
            raise ValueError("overlapping or invalid source replacement")
        updated = updated[:start] + value + updated[end:]
        previous_start = start
    return updated


def manifest_payload(
    items: Sequence[WorkItem],
    results: Dict[Tuple[str, str], MirrorResult],
    parse_errors: Sequence[Dict[str, str]],
    exclusions: Sequence[ExcludedImage] = (),
    include_excluded_recovery: bool = False,
) -> bytes:
    entries: List[Dict[str, object]] = []
    for item in items:
        result = results[(item.post.relative_path, item.source)]
        locations = sorted({reference.location for reference in item.references})
        previous_raw_urls: List[str] = []
        if item.previous:
            prior_aliases = item.previous.get("previousRawUrls", [])
            if isinstance(prior_aliases, list):
                previous_raw_urls.extend(
                    alias for alias in prior_aliases if isinstance(alias, str) and alias
                )
            prior_raw = item.previous.get("rawUrl")
            if isinstance(prior_raw, str) and prior_raw:
                previous_raw_urls.append(prior_raw)
        previous_raw_urls = sorted(
            {url for url in previous_raw_urls if url != result.raw_url}
        )
        previous_targets: Dict[str, str] = {}
        if item.previous:
            prior_history = item.previous.get("previousTargets", [])
            if isinstance(prior_history, list):
                for historical in prior_history:
                    if not isinstance(historical, dict):
                        continue
                    target = historical.get("target")
                    sha256 = historical.get("sha256")
                    if isinstance(target, str) and isinstance(sha256, str):
                        if target and sha256 and target != result.target:
                            previous_targets[target] = sha256
            prior_target = item.previous.get("target")
            prior_sha = item.previous.get("sha256")
            if (
                item.previous.get("status") == "mirrored"
                and isinstance(prior_target, str)
                and isinstance(prior_sha, str)
                and prior_target
                and prior_sha
                and prior_target != result.target
            ):
                previous_targets[prior_target] = prior_sha
        entry: Dict[str, object] = {
            "post": item.post.relative_path,
            "source": item.source,
            "sourceUrl": result.source_url,
            "processorVersion": result.processor_version,
            "inputSha256": result.input_sha256 or item.input_sha256,
            "locations": locations,
            "occurrences": len(item.references),
            "target": result.target,
            "rawUrl": result.raw_url,
            "previousRawUrls": previous_raw_urls,
            "previousTargets": [
                {"target": target, "sha256": sha256}
                for target, sha256 in sorted(previous_targets.items())
            ],
            "sha256": result.sha256,
            "bytes": result.byte_count,
            "sourceFormat": result.source_format,
            "storedFormat": result.stored_format,
            "sourceMimeType": result.mime_type,
            "storedMimeType": FORMAT_MIME_TYPES.get(result.stored_format, ""),
            "status": result.status,
            "error": result.error,
        }
        if result.optimization_error:
            entry["optimizationError"] = result.optimization_error
        if (
            item.post.image_mirror_opaque_webp_quality is not None
            and result.status == "mirrored"
            and not result.optimization_error
            and result.input_sha256 == item.input_sha256
        ):
            entry["opaqueWebpQuality"] = (
                item.post.image_mirror_opaque_webp_quality
            )
        if result.derived_from_target:
            entry["derivedFromTarget"] = result.derived_from_target
        if result.derived_from_sha256:
            entry["derivedFromSha256"] = result.derived_from_sha256
        entries.append(entry)
    if include_excluded_recovery:
        for exclusion in exclusions:
            if not exclusion.previous:
                continue
            entry = dict(exclusion.previous)
            entry.update(
                {
                    "post": exclusion.post.relative_path,
                    "source": exclusion.source,
                    "locations": sorted(
                        {reference.location for reference in exclusion.references}
                    ),
                    "occurrences": len(exclusion.references),
                    "status": "excluded",
                    "error": "",
                    "excludedByImageMirrorIncludeHosts": list(
                        exclusion.post.image_mirror_include_hosts or ()
                    ),
                }
            )
            entries.append(entry)
    entries.sort(key=lambda entry: (str(entry["post"]), str(entry["source"])))
    payload = {
        "version": MANIFEST_VERSION,
        "rawBase": RAW_BASE,
        "entries": entries,
        "parseErrors": list(parse_errors),
    }
    return (json.dumps(payload, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Mirror frontmatter and body images into HaibinLai/image-backend."
    )
    parser.add_argument(
        "--image-repo",
        type=Path,
        required=True,
        help="Path to the checked-out HaibinLai/image-backend repository",
    )
    parser.add_argument(
        "--workers", type=int, default=DEFAULT_WORKERS, help="Concurrent image jobs (default: 4)"
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=DEFAULT_TIMEOUT,
        help="Per-request timeout in seconds (default: 20)",
    )
    parser.add_argument(
        "--max-bytes",
        type=int,
        default=MAX_ALLOWED_BYTES,
        help="Maximum bytes accepted per image, capped at 52428800 (default: 50 MiB)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-fetch images from their source instead of using cached/local input",
    )
    parser.add_argument(
        "--include-drafts",
        action="store_true",
        help="Also mirror draft posts (their images will become public)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Scan and report the plan without network requests or file changes",
    )
    args = parser.parse_args()
    if args.workers < 1:
        parser.error("--workers must be at least 1")
    if args.timeout <= 0:
        parser.error("--timeout must be positive")
    if args.max_bytes < 1 or args.max_bytes > MAX_ALLOWED_BYTES:
        parser.error(f"--max-bytes must be between 1 and {MAX_ALLOWED_BYTES}")
    return args


def main() -> int:
    args = parse_arguments()
    repository_root = Path(__file__).resolve().parents[1]
    posts_root = repository_root / "src/content/posts"
    public_root = repository_root / "public"
    image_repo = args.image_repo.expanduser().resolve()
    if not image_repo.is_dir():
        raise SystemExit(f"image repository does not exist: {image_repo}")
    if not (image_repo / ".git").exists():
        raise SystemExit(f"image repository is not a Git checkout: {image_repo}")

    paths = sorted((*posts_root.rglob("*.md"), *posts_root.rglob("*.mdx")))
    posts: List[Post] = []
    parse_errors: List[Dict[str, str]] = []
    drafts_skipped = 0
    for path in paths:
        try:
            post = parse_post(path, repository_root)
            if post.draft and not args.include_drafts:
                drafts_skipped += 1
                continue
            posts.append(post)
        except Exception as error:
            parse_errors.append(
                {
                    "post": path.relative_to(repository_root).as_posix(),
                    "error": f"{type(error).__name__}: {error}",
                }
            )

    previous_entries = existing_manifest(image_repo)
    items, exclusions, already_mirrored = build_work_items(posts, previous_entries)
    for item in items:
        item.input_sha256 = work_item_fingerprint(item, public_root)
        item.prefer_previous_file = (
            not args.force
            and bool(item.previous)
            and item.previous.get("status") == "mirrored"
            and (
                previous_processor_version(item.previous) < PROCESSOR_VERSION
                or (
                    item.post.image_mirror_opaque_webp_quality is not None
                    and item.previous.get("inputSha256") != item.input_sha256
                    and item.previous.get("opaqueWebpQuality") is None
                )
            )
        )
    reference_count = sum(len(post.references) for post in posts)
    excluded_reference_count = sum(
        len(exclusion.references) for exclusion in exclusions
    )
    results: Dict[Tuple[str, str], MirrorResult] = {}
    pending: List[WorkItem] = []
    reused = 0
    for item in items:
        cached = None if args.force else cached_result(item, image_repo)
        if cached is not None:
            results[(item.post.relative_path, item.source)] = cached
            reused += 1
        else:
            pending.append(item)

    if args.dry_run:
        invalid_sources = sum(
            1 for item in pending if not dry_run_source_is_valid(item.source, public_root)
        )
        local_upgrades_planned = sum(
            1 for item in pending if item.prefer_previous_file
        )
        print(f"posts={len(paths)}")
        print(f"posts_parsed={len(posts)}")
        print(f"drafts_skipped={drafts_skipped}")
        print(f"references={reference_count}")
        print(f"unique_images={len(items)}")
        print(f"excluded_items={len(exclusions)}")
        print(f"excluded_references={excluded_reference_count}")
        print(f"already_mirrored_skipped={already_mirrored}")
        print(f"cache_reusable={reused}")
        print(f"images_to_process={len(pending)}")
        print(f"local_upgrades_planned={local_upgrades_planned}")
        print(f"downloads_planned={len(pending) - local_upgrades_planned}")
        print(f"invalid_sources={invalid_sources}")
        print(f"parse_errors={len(parse_errors)}")
        print("dry_run=true")
        return 0

    streamed_results, images_written, images_unchanged, write_failures = (
        fetch_and_store_pending(
            pending,
            public_root,
            image_repo,
            args.workers,
            args.timeout,
            args.max_bytes,
        )
    )
    results.update(streamed_results)

    # Commit the recovery map before touching article text. Excluded entries stay
    # here temporarily as tombstones, so an interruption can still restore their
    # original URLs. They are removed only after article verification and prune.
    recovery_manifest = manifest_payload(
        items,
        results,
        parse_errors,
        exclusions=exclusions,
        include_excluded_recovery=True,
    )
    manifest_changed = atomic_write(
        image_repo / MANIFEST_NAME, recovery_manifest
    )

    replacements_by_post: Dict[str, List[Tuple[int, int, str]]] = {}
    for item in items:
        result = results[(item.post.relative_path, item.source)]
        if result.status != "mirrored" or not result.raw_url:
            continue
        for reference in item.references:
            if reference.value == result.raw_url:
                continue
            replacements_by_post.setdefault(item.post.relative_path, []).append(
                (reference.start, reference.end, json.dumps(result.raw_url, ensure_ascii=False)
                 if reference.location == "featuredImage" else result.raw_url)
            )
    for exclusion in exclusions:
        for reference in exclusion.references:
            if reference.value == exclusion.source:
                continue
            replacements_by_post.setdefault(
                exclusion.post.relative_path, []
            ).append(
                (
                    reference.start,
                    reference.end,
                    json.dumps(exclusion.source, ensure_ascii=False)
                    if reference.location == "featuredImage"
                    else exclusion.source,
                )
            )

    posts_updated = 0
    post_write_failures = 0
    for post in posts:
        replacements = replacements_by_post.get(post.relative_path, [])
        if not replacements:
            continue
        try:
            updated = apply_replacements(post.source_text, replacements)
            if updated != post.source_text:
                atomic_write(post.path, updated.encode("utf-8"))
                posts_updated += 1
        except Exception as error:
            post_write_failures += 1
            print(
                f"post_write_error={post.relative_path}: {type(error).__name__}: {error}",
                file=sys.stderr,
            )

    files_pruned = 0
    prune_failures = 0
    prune_verification_failures = 0
    manifest_finalized = False
    final_paths = sorted((*posts_root.rglob("*.md"), *posts_root.rglob("*.mdx")))
    post_path_set_changed = {
        path.resolve() for path in final_paths
    } != {path.resolve() for path in paths}
    if post_path_set_changed:
        print(
            "prune_verification_error=post file set changed while migration was running",
            file=sys.stderr,
        )
        prune_verification_failures += 1
    if (
        not parse_errors
        and not write_failures
        and not post_write_failures
        and not post_path_set_changed
    ):
        live_targets, prune_verification_errors = verify_final_state_before_prune(
            final_paths, repository_root, items, exclusions, results, image_repo
        )
        prune_verification_failures += len(prune_verification_errors)
        for error in prune_verification_errors:
            print(f"prune_verification_error={error}", file=sys.stderr)
        if not prune_verification_errors:
            files_pruned, prune_failures = prune_superseded_targets(
                items,
                exclusions,
                results,
                previous_entries,
                image_repo,
                live_targets,
            )
            if not prune_failures:
                final_manifest = manifest_payload(items, results, parse_errors)
                final_changed = atomic_write(
                    image_repo / MANIFEST_NAME, final_manifest
                )
                manifest_changed = manifest_changed or final_changed
                manifest_finalized = True
    errors = sum(1 for result in results.values() if result.status == "error")
    optimization_errors = sum(
        1 for result in results.values() if result.optimization_error
    )
    mirrored = sum(1 for result in results.values() if result.status == "mirrored")

    print(f"posts={len(paths)}")
    print(f"drafts_skipped={drafts_skipped}")
    print(f"references={reference_count}")
    print(f"unique_images={len(items)}")
    print(f"excluded_items={len(exclusions)}")
    print(f"excluded_references={excluded_reference_count}")
    print(f"mirrored={mirrored}")
    print(f"errors={errors}")
    print(f"optimization_errors={optimization_errors}")
    print(f"already_mirrored_skipped={already_mirrored}")
    print(f"cache_reused={reused}")
    print(f"images_written={images_written}")
    print(f"images_unchanged={images_unchanged}")
    print(f"write_failures={write_failures}")
    print(f"post_write_failures={post_write_failures}")
    print(f"prune_verification_failures={prune_verification_failures}")
    print(f"prune_failures={prune_failures}")
    print(f"files_pruned={files_pruned}")
    print(f"posts_updated={posts_updated}")
    print(f"manifest_changed={str(manifest_changed).lower()}")
    print(f"manifest_finalized={str(manifest_finalized).lower()}")
    print(f"manifest={image_repo / MANIFEST_NAME}")
    return 1 if any(
        (
            errors,
            optimization_errors,
            parse_errors,
            write_failures,
            post_write_failures,
            prune_verification_failures,
            prune_failures,
        )
    ) else 0


if __name__ == "__main__":
    raise SystemExit(main())
