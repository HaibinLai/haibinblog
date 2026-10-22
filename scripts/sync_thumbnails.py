#!/usr/bin/env python3
"""Build deterministic post thumbnails and sync their frontmatter URLs.

The script intentionally parses only the scalar frontmatter fields it needs,
so it does not require PyYAML and leaves the rest of every document untouched.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
import hashlib
import html
from io import BytesIO
import json
import re
from pathlib import Path
import unicodedata
from urllib.parse import quote, unquote, urlsplit, urlunsplit
from urllib.request import Request, urlopen

try:
    from PIL import Image, ImageDraw, ImageFont, ImageOps
except ImportError as error:  # pragma: no cover - depends on the local runtime
    raise SystemExit(
        "Pillow is required. Install it with: python3 -m pip install Pillow"
    ) from error


WIDTH = 640
HEIGHT = 400
WEBP_QUALITY = 84
RENDERER_VERSION = 1
MAX_DOWNLOAD_BYTES = 30 * 1024 * 1024
RAW_BASE = "https://raw.githubusercontent.com/HaibinLai/image-backend/main"
FRONTMATTER_OPEN = re.compile(r"\A---(?P<newline>\r?\n)")
FRONTMATTER_CLOSE = re.compile(r"(?m)^---[ \t]*(?:\r?\n|\Z)")
HTML_IMAGE = re.compile(
    r"<img\b[^>]*?\bsrc\s*=\s*([\"'])(?P<src>.*?)\1",
    re.IGNORECASE | re.DOTALL,
)
MARKDOWN_IMAGE = re.compile(
    r"!\[[^\]]*\]\(\s*(?:<(?P<angle>[^>]+)>|(?P<plain>[^\s)]+))",
    re.DOTALL,
)
REMOTE_SCHEMES = {"http", "https"}
FONT_CANDIDATES = (
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/Library/Fonts/Arial Unicode.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
)
PALETTES = (
    ((30, 64, 175), (79, 70, 229), (219, 234, 254)),
    ((5, 120, 112), (16, 185, 129), (209, 250, 229)),
    ((159, 18, 57), (234, 88, 12), (255, 237, 213)),
    ((76, 29, 149), (147, 51, 234), (243, 232, 255)),
    ((8, 47, 73), (14, 116, 144), (207, 250, 254)),
)


@dataclass(frozen=True)
class Frontmatter:
    header_start: int
    header_end: int
    header: str
    body: str
    newline: str


@dataclass(frozen=True)
class Post:
    path: Path
    relative_path: str
    source_text: str
    frontmatter: Frontmatter
    title: str
    category: str
    year_month: str
    slug: str
    sources: tuple[str, ...]


@dataclass(frozen=True)
class Rendered:
    payload: bytes
    source: str
    status: str
    error: str


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
        header=source[opening.end() : closing.start()],
        body=source[closing.end() :],
        newline=opening.group("newline"),
    )


def scalar(header: str, key: str, default: str = "") -> str:
    match = re.search(rf"(?m)^{re.escape(key)}:\s*(.*?)\s*$", header)
    if not match:
        return default
    raw = match.group(1).strip()
    if not raw:
        return default
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        if len(raw) >= 2 and raw[0] == raw[-1] == "'":
            return raw[1:-1].replace("''", "'")
        return raw
    return str(parsed) if parsed is not None else default


def first_body_image(body: str) -> str:
    matches: list[tuple[int, str]] = []
    html_match = HTML_IMAGE.search(body)
    if html_match:
        matches.append((html_match.start(), html_match.group("src")))
    markdown_match = MARKDOWN_IMAGE.search(body)
    if markdown_match:
        matches.append(
            (
                markdown_match.start(),
                markdown_match.group("angle") or markdown_match.group("plain") or "",
            )
        )
    if not matches:
        return ""
    return html.unescape(min(matches, key=lambda item: item[0])[1].strip())


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


def parse_post(path: Path, repository_root: Path) -> Post:
    source_text = path.read_text(encoding="utf-8")
    frontmatter = split_frontmatter(source_text, path)
    published = scalar(frontmatter.header, "publishedAt")
    date_match = re.search(r"(?<!\d)(\d{4})-(\d{2})(?!\d)", published)
    if not date_match or not 1 <= int(date_match.group(2)) <= 12:
        raise ValueError(f"{path}: invalid publishedAt value {published!r}")

    title = scalar(frontmatter.header, "title", path.stem)
    category = scalar(frontmatter.header, "category", "Blog")
    slug = safe_slug(scalar(frontmatter.header, "slug", path.stem), path.stem)
    candidate_sources = (
        scalar(frontmatter.header, "featuredBannerImage"),
        scalar(frontmatter.header, "featuredImage"),
        first_body_image(frontmatter.body),
    )
    deduplicated: list[str] = []
    for candidate in candidate_sources:
        candidate = html.unescape(candidate.strip())
        if candidate and candidate not in deduplicated:
            deduplicated.append(candidate)

    return Post(
        path=path,
        relative_path=path.relative_to(repository_root).as_posix(),
        source_text=source_text,
        frontmatter=frontmatter,
        title=title,
        category=category,
        year_month=f"{date_match.group(1)}-{date_match.group(2)}",
        slug=slug,
        sources=tuple(deduplicated),
    )


def public_image_path(source: str, public_root: Path) -> Path:
    parsed = urlsplit(source)
    value = unquote(parsed.path if parsed.scheme else source.split("?", 1)[0].split("#", 1)[0])
    value = value.replace("\\", "/").lstrip("./")
    if value.startswith("haibinblog/"):
        value = value[len("haibinblog/") :]
    if value.startswith("public/"):
        value = value[len("public/") :]
    candidate = (public_root / value).resolve()
    try:
        candidate.relative_to(public_root.resolve())
    except ValueError as error:
        raise ValueError("local image escapes the public directory") from error
    return candidate


def normalized_remote_url(source: str) -> str:
    if source.startswith("//"):
        source = "https:" + source
    parts = urlsplit(source)
    path = quote(unquote(parts.path), safe="/%:@-._~!$&'()*+,;=")
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, ""))


def read_image_source(source: str, public_root: Path, timeout: float) -> bytes:
    parsed = urlsplit(source if not source.startswith("//") else "https:" + source)
    if parsed.scheme.lower() in REMOTE_SCHEMES:
        request = Request(
            normalized_remote_url(source),
            headers={
                "User-Agent": "HaibinBlogThumbnailSync/1.0",
                "Accept": "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
            },
        )
        with urlopen(request, timeout=timeout) as response:
            content_type = response.headers.get_content_type()
            if not content_type.startswith("image/") and content_type != "application/octet-stream":
                raise ValueError(f"unexpected content type {content_type}")
            payload = response.read(MAX_DOWNLOAD_BYTES + 1)
            if len(payload) > MAX_DOWNLOAD_BYTES:
                raise ValueError("image exceeds 30 MiB download limit")
            return payload

    path = public_image_path(source, public_root)
    if not path.is_file():
        raise FileNotFoundError(f"local image not found: {path.relative_to(public_root)}")
    if path.stat().st_size > MAX_DOWNLOAD_BYTES:
        raise ValueError("image exceeds 30 MiB size limit")
    return path.read_bytes()


def webp_thumbnail(payload: bytes) -> bytes:
    with Image.open(BytesIO(payload)) as image:
        image.seek(0)
        image = ImageOps.exif_transpose(image)
        if image.mode in {"RGBA", "LA"} or "transparency" in image.info:
            rgba = image.convert("RGBA")
            background = Image.new("RGBA", rgba.size, (247, 249, 252, 255))
            image = Image.alpha_composite(background, rgba).convert("RGB")
        else:
            image = image.convert("RGB")
        image = ImageOps.fit(
            image,
            (WIDTH, HEIGHT),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )
        output = BytesIO()
        image.save(output, format="WEBP", quality=WEBP_QUALITY, method=6)
        return output.getvalue()


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in FONT_CANDIDATES:
        if not Path(candidate).is_file():
            continue
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def text_width(draw: ImageDraw.ImageDraw, value: str, font: ImageFont.ImageFont) -> float:
    if not value:
        return 0
    box = draw.textbbox((0, 0), value, font=font)
    return float(box[2] - box[0])


def wrap_title(
    draw: ImageDraw.ImageDraw,
    title: str,
    font: ImageFont.ImageFont,
    max_width: int,
    max_lines: int = 3,
) -> list[str]:
    compact = re.sub(r"\s+", " ", title).strip()
    if not compact:
        return ["Untitled"]
    tokens = re.findall(r"[\u3400-\u9fff]|\s+|[^\s\u3400-\u9fff]+", compact)
    lines: list[str] = []
    current = ""

    def append_token(token: str) -> None:
        nonlocal current
        proposal = (current + token).strip() if not token.isspace() else current + " "
        if current and text_width(draw, proposal, font) > max_width:
            lines.append(current.rstrip())
            current = token.lstrip()
        else:
            current = proposal

    for token in tokens:
        if text_width(draw, token.strip(), font) <= max_width:
            append_token(token)
            continue
        for character in token:
            append_token(character)
    if current.strip():
        lines.append(current.strip())

    if len(lines) > max_lines:
        lines = lines[:max_lines]
        ellipsis = "…"
        last = lines[-1]
        while last and text_width(draw, last + ellipsis, font) > max_width:
            last = last[:-1]
        lines[-1] = last.rstrip() + ellipsis
    return lines or ["Untitled"]


def generated_cover(title: str, category: str) -> bytes:
    digest = hashlib.sha256(f"{category}\0{title}".encode("utf-8")).digest()
    start, end, accent = PALETTES[digest[0] % len(PALETTES)]
    image = Image.new("RGB", (WIDTH, HEIGHT), start)
    pixels = image.load()
    for y in range(HEIGHT):
        ratio = y / max(1, HEIGHT - 1)
        for x in range(WIDTH):
            diagonal = min(1.0, ratio * 0.72 + (x / WIDTH) * 0.28)
            pixels[x, y] = tuple(
                round(start[channel] * (1 - diagonal) + end[channel] * diagonal)
                for channel in range(3)
            )

    draw = ImageDraw.Draw(image, "RGBA")
    draw.ellipse((430, -110, 720, 180), fill=(*accent, 32))
    draw.ellipse((-120, 275, 210, 590), fill=(255, 255, 255, 18))
    draw.rounded_rectangle((44, 42, 596, 358), radius=28, fill=(7, 16, 34, 54))

    category_font = load_font(18)
    title_font = load_font(35)
    small_font = load_font(14)
    category_text = category.strip() or "Blog"
    category_width = min(430, int(text_width(draw, category_text, category_font)))
    draw.rounded_rectangle(
        (70, 74, 102 + category_width, 112),
        radius=19,
        fill=(255, 255, 255, 42),
        outline=(255, 255, 255, 72),
        width=1,
    )
    draw.text((86, 82), category_text, font=category_font, fill=(255, 255, 255, 235))

    lines = wrap_title(draw, title, title_font, max_width=500)
    line_height = 50
    title_y = 144
    for index, line in enumerate(lines):
        draw.text(
            (70, title_y + index * line_height),
            line,
            font=title_font,
            fill=(255, 255, 255, 250),
        )
    draw.text((70, 326), "HAIBIN'S BLOG", font=small_font, fill=(255, 255, 255, 175))

    output = BytesIO()
    image.save(output, format="WEBP", quality=WEBP_QUALITY, method=6)
    return output.getvalue()


def render_post(post: Post, public_root: Path, timeout: float) -> Rendered:
    failures: list[str] = []
    for source in post.sources:
        try:
            payload = read_image_source(source, public_root, timeout)
            rendered = webp_thumbnail(payload)
            return Rendered(
                payload=rendered,
                source=source,
                status="image",
                error="; ".join(failures),
            )
        except Exception as error:  # Continue through lower-priority sources.
            failures.append(f"{source}: {type(error).__name__}: {str(error)[:240]}")

    try:
        payload = generated_cover(post.title, post.category)
    except Exception as error:
        return Rendered(
            payload=b"",
            source="generated",
            status="error",
            error=f"{type(error).__name__}: {error}",
        )
    return Rendered(
        payload=payload,
        source="generated",
        status="generated",
        error="; ".join(failures) if failures else "no image source found",
    )


def raw_url(relative_target: str) -> str:
    encoded = "/".join(quote(part, safe="-._~") for part in relative_target.split("/"))
    return f"{RAW_BASE}/{encoded}"


def post_input_sha256(post: Post, public_root: Path) -> str:
    """Fingerprint inputs whose changes should invalidate a cached thumbnail."""
    inputs: dict[str, object] = {
        "rendererVersion": RENDERER_VERSION,
        "width": WIDTH,
        "height": HEIGHT,
        "webpQuality": WEBP_QUALITY,
        "title": post.title,
        "category": post.category,
        "sources": list(post.sources),
        "localImages": {},
    }
    local_images = inputs["localImages"]
    assert isinstance(local_images, dict)
    for source in post.sources:
        parsed = urlsplit(source if not source.startswith("//") else "https:" + source)
        if parsed.scheme.lower() in REMOTE_SCHEMES:
            continue
        try:
            path = public_image_path(source, public_root)
            local_images[source] = (
                hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else "missing"
            )
        except Exception as error:
            local_images[source] = f"{type(error).__name__}:{error}"
    encoded = json.dumps(inputs, ensure_ascii=False, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def set_card_image(post: Post, value: str) -> str:
    newline = post.frontmatter.newline
    header = post.frontmatter.header
    replacement = f"cardImage: {json.dumps(value, ensure_ascii=False)}"
    field = re.compile(r"(?m)^cardImage:[^\r\n]*(?:\r?\n|\Z)")
    match = field.search(header)
    if match:
        suffix = newline if match.group(0).endswith(("\n", "\r")) else ""
        updated_header = header[: match.start()] + replacement + suffix + header[match.end() :]
    else:
        separator = "" if not header or header.endswith(("\n", "\r")) else newline
        updated_header = header + separator + replacement + newline
    return (
        post.source_text[: post.frontmatter.header_start]
        + updated_header
        + post.source_text[post.frontmatter.header_end :]
    )


def write_if_changed(path: Path, payload: bytes) -> bool:
    if path.is_file() and path.read_bytes() == payload:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)
    return True


def manifest_bytes(entries: list[dict[str, str]]) -> bytes:
    manifest = {
        "version": 1,
        "image": {"width": WIDTH, "height": HEIGHT, "format": "webp", "quality": WEBP_QUALITY},
        "entries": entries,
    }
    return (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def existing_manifest_entries(image_repo: Path) -> dict[str, dict[str, str]]:
    path = image_repo / "manifest.json"
    if not path.is_file():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        entries = payload.get("entries", [])
        if not isinstance(entries, list):
            return {}
        return {
            entry["post"]: entry
            for entry in entries
            if isinstance(entry, dict) and isinstance(entry.get("post"), str)
        }
    except (OSError, json.JSONDecodeError):
        return {}


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate 640x400 post thumbnails in a GitHub image repository."
    )
    parser.add_argument(
        "--image-repo",
        type=Path,
        required=True,
        help="Path to the checked-out HaibinLai/image-backend repository",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=8,
        help="Concurrent image fetch/render workers (default: 8)",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=15.0,
        help="Per-request timeout in seconds (default: 15)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-fetch and rebuild thumbnails even when the manifest inputs match",
    )
    args = parser.parse_args()
    if args.workers < 1:
        parser.error("--workers must be at least 1")
    if args.timeout <= 0:
        parser.error("--timeout must be positive")

    repository_root = Path(__file__).resolve().parents[1]
    posts_root = repository_root / "src/content/posts"
    public_root = repository_root / "public"
    image_repo = args.image_repo.expanduser().resolve()
    if not image_repo.is_dir():
        parser.error(f"image repository does not exist: {image_repo}")
    if not (image_repo / ".git").exists():
        parser.error(f"image repository is not a Git checkout: {image_repo}")

    paths = sorted((*posts_root.rglob("*.md"), *posts_root.rglob("*.mdx")))
    posts: list[Post] = []
    parse_errors: list[dict[str, str]] = []
    targets: dict[str, str] = {}
    for path in paths:
        try:
            post = parse_post(path, repository_root)
            target = f"{post.year_month}/{post.slug}.webp"
            previous = targets.get(target)
            if previous:
                raise ValueError(f"target collision with {previous}: {target}")
            targets[target] = post.relative_path
            posts.append(post)
        except Exception as error:
            parse_errors.append(
                {
                    "post": path.relative_to(repository_root).as_posix(),
                    "source": "",
                    "target": "",
                    "sha256": "",
                    "inputSha256": "",
                    "status": "error",
                    "error": f"{type(error).__name__}: {error}",
                }
            )

    fingerprints = {
        post.relative_path: post_input_sha256(post, public_root) for post in posts
    }
    previous_entries = existing_manifest_entries(image_repo)
    rendered: dict[str, Rendered] = {}
    pending: list[Post] = []
    reused = 0
    for post in posts:
        target = f"{post.year_month}/{post.slug}.webp"
        target_path = image_repo / target
        previous = previous_entries.get(post.relative_path, {})
        expected_url = raw_url(target)
        previous_input = previous.get("inputSha256", "")
        input_matches = previous_input in {"", fingerprints[post.relative_path]}
        previous_status = previous.get("status")
        reusable_status = previous_status == "image" or (
            previous_status == "generated" and not post.sources
        )
        can_reuse = (
            not args.force
            and previous.get("target") == target
            and reusable_status
            and scalar(post.frontmatter.header, "cardImage") == expected_url
            and input_matches
            and target_path.is_file()
        )
        if can_reuse:
            payload = target_path.read_bytes()
            if hashlib.sha256(payload).hexdigest() == previous.get("sha256"):
                rendered[post.relative_path] = Rendered(
                    payload=payload,
                    source=str(previous.get("source", "")),
                    status=str(previous.get("status", "image")),
                    error=str(previous.get("error", "")),
                )
                reused += 1
                continue
        pending.append(post)

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(render_post, post, public_root, args.timeout): post
            for post in pending
        }
        for future in as_completed(futures):
            post = futures[future]
            try:
                rendered[post.relative_path] = future.result()
            except Exception as error:
                rendered[post.relative_path] = Rendered(
                    payload=b"",
                    source="",
                    status="error",
                    error=f"{type(error).__name__}: {error}",
                )

    entries: list[dict[str, str]] = list(parse_errors)
    images_written = 0
    images_unchanged = 0
    frontmatter_updated = 0
    for post in posts:
        result = rendered[post.relative_path]
        target = f"{post.year_month}/{post.slug}.webp"
        digest = hashlib.sha256(result.payload).hexdigest() if result.payload else ""
        entries.append(
            {
                "post": post.relative_path,
                "source": result.source,
                "target": target,
                "sha256": digest,
                "inputSha256": fingerprints[post.relative_path],
                "status": result.status,
                "error": result.error,
            }
        )
        if result.status == "error":
            continue

        if write_if_changed(image_repo / target, result.payload):
            images_written += 1
        else:
            images_unchanged += 1

        updated_source = set_card_image(post, raw_url(target))
        if updated_source != post.source_text:
            with post.path.open("w", encoding="utf-8", newline="") as output:
                output.write(updated_source)
            frontmatter_updated += 1

    entries.sort(key=lambda entry: entry["post"])
    manifest_changed = write_if_changed(image_repo / "manifest.json", manifest_bytes(entries))
    status_counts: dict[str, int] = {}
    for entry in entries:
        status_counts[entry["status"]] = status_counts.get(entry["status"], 0) + 1

    print(f"posts={len(paths)}")
    print(f"images_written={images_written}")
    print(f"images_unchanged={images_unchanged}")
    print(f"images_reused={reused}")
    print(f"frontmatter_updated={frontmatter_updated}")
    print(f"manifest_changed={str(manifest_changed).lower()}")
    print("statuses=" + json.dumps(status_counts, sort_keys=True))
    print(f"manifest={image_repo / 'manifest.json'}")
    return 1 if status_counts.get("error", 0) else 0


if __name__ == "__main__":
    raise SystemExit(main())
