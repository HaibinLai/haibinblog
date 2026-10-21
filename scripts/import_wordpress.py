#!/usr/bin/env python3
"""Import WordPress WXR posts into this Astro blog.

The generated Markdown keeps WordPress HTML intact so that complex tables,
code blocks, images, and embeds survive the first migration pass. Running the
script again replaces only files inside src/content/posts/wordpress.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import sys
import unicodedata
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse


WP = "http://wordpress.org/export/1.2/"
CONTENT = "http://purl.org/rss/1.0/modules/content/"
EXCERPT = "http://wordpress.org/export/1.2/excerpt/"
NS = {"wp": WP, "content": CONTENT, "excerpt": EXCERPT}
INVALID_XML_CONTROLS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


def plain_text(value: str) -> str:
    parser = TextExtractor()
    try:
        parser.feed(value)
    except Exception:
        return re.sub(r"<[^>]+>", " ", value)
    return html.unescape(" ".join(parser.parts))


def summarize(excerpt: str, body: str, limit: int = 220) -> str:
    value = plain_text(excerpt or body)
    value = re.sub(r"\s+", " ", value).strip()
    if len(value) <= limit:
        return value
    return value[: limit - 1].rstrip(" ,.;，。；") + "…"


def safe_slug(raw_slug: str, post_id: str) -> str:
    slug = unicodedata.normalize("NFKC", unquote(raw_slug or "")).strip().lower()
    slug = re.sub(r"[\\/:*?\"<>|#]+", "-", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip(".-")
    if not slug:
        slug = f"wordpress-{post_id}"

    # Keep filenames comfortably below common filesystem byte limits.
    while len(slug.encode("utf-8")) > 180:
        slug = slug[:-1]
    return slug or f"wordpress-{post_id}"


def yaml_value(value: object) -> str:
    # JSON strings and arrays are valid YAML and avoid title/tag escaping bugs.
    return json.dumps(value, ensure_ascii=False)


def parse_wxr(path: Path) -> ET.Element:
    source = path.read_text(encoding="utf-8")
    cleaned = INVALID_XML_CONTROLS.sub("", source)
    removed = len(source) - len(cleaned)
    if removed:
        print(f"Removed {removed} invalid XML control characters.", file=sys.stderr)
    return ET.fromstring(cleaned)


def legacy_slug(item: ET.Element, fallback: str) -> str:
    link = item.findtext("link", default="")
    path = urlparse(link).path.rstrip("/")
    if "/index.php/" in path:
        return unquote(path.split("/index.php/", 1)[1])
    return unquote(fallback)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("wxr", type=Path, help="WordPress WXR/XML export")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("src/content/posts/wordpress"),
        help="Generated post directory",
    )
    parser.add_argument(
        "--include-non-public",
        action="store_true",
        help="Also import draft, pending, and private posts (unsafe for a public repository)",
    )
    args = parser.parse_args()

    root = parse_wxr(args.wxr)
    items = root.findall("./channel/item")
    posts = [
        item
        for item in items
        if item.findtext("wp:post_type", default="", namespaces=NS) == "post"
    ]

    output = args.output
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)

    used: set[str] = set()
    counts: dict[str, int] = {}
    skipped_password_protected = 0
    for item in posts:
        status = item.findtext("wp:status", default="draft", namespaces=NS)
        post_password = item.findtext(
            "wp:post_password", default="", namespaces=NS
        ).strip()
        allowed_statuses = (
            {"publish", "draft", "pending", "private"}
            if args.include_non_public
            else {"publish"}
        )
        if status not in allowed_statuses:
            continue
        if post_password and not args.include_non_public:
            skipped_password_protected += 1
            continue

        post_id = item.findtext("wp:post_id", default="0", namespaces=NS)
        raw_slug = item.findtext("wp:post_name", default="", namespaces=NS)
        slug = safe_slug(raw_slug, post_id)
        if slug in used:
            slug = f"{slug}-wp{post_id}"
        used.add(slug)

        title = item.findtext("title", default="Untitled")
        body = item.findtext("content:encoded", default="", namespaces=NS).strip()
        body = "\n".join(line.rstrip() for line in body.splitlines())
        excerpt = item.findtext("excerpt:encoded", default="", namespaces=NS)
        published = item.findtext("wp:post_date", default="", namespaces=NS)
        updated = item.findtext("wp:post_modified", default="", namespaces=NS)
        source_url = item.findtext("link", default="")
        categories = [
            category.text or ""
            for category in item.findall("category")
            if category.attrib.get("domain") == "category"
        ]
        tags = [
            category.text or ""
            for category in item.findall("category")
            if category.attrib.get("domain") == "post_tag"
        ]
        category = categories[0] if categories else "Uncategorized"
        old_slug = legacy_slug(item, raw_slug or slug)
        comment_count = sum(
            comment.findtext("wp:comment_approved", default="", namespaces=NS) == "1"
            for comment in item.findall("wp:comment", NS)
        )

        frontmatter = [
            "---",
            f"title: {yaml_value(title)}",
            f"description: {yaml_value(summarize(excerpt, body))}",
            f"publishedAt: {yaml_value(published)}",
        ]
        if updated and updated != published:
            frontmatter.append(f"updatedAt: {yaml_value(updated)}")
        frontmatter.extend(
            [
                f"category: {yaml_value(category)}",
                f"tags: {yaml_value(tags)}",
                f"draft: {'false' if status == 'publish' else 'true'}",
                f"slug: {yaml_value(slug)}",
                f"legacySlug: {yaml_value(old_slug)}",
                f"wordpressId: {int(post_id or 0)}",
                f"sourceUrl: {yaml_value(source_url)}",
                f"commentCount: {comment_count}",
                "importedFromWordPress: true",
                "---",
                "",
            ]
        )
        (output / f"{slug}.md").write_text(
            "\n".join(frontmatter) + body + "\n", encoding="utf-8"
        )
        counts[status] = counts.get(status, 0) + 1

    print(f"Imported {sum(counts.values())} posts into {output}")
    print("Statuses: " + ", ".join(f"{key}={value}" for key, value in sorted(counts.items())))
    if skipped_password_protected:
        print(
            "Skipped password-protected posts: "
            f"{skipped_password_protected} (use --include-non-public only for private output)"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
