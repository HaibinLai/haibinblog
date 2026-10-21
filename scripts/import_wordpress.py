#!/usr/bin/env python3
"""Import WordPress WXR posts into this Astro blog.

The generated Markdown keeps WordPress HTML intact so that complex tables,
code blocks, images, and embeds survive the first migration pass. Running the
script again replaces only files inside src/content/posts/wordpress.
"""

from __future__ import annotations

import argparse
from datetime import datetime
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
DC = "http://purl.org/dc/elements/1.1/"
NS = {"wp": WP, "content": CONTENT, "excerpt": EXCERPT, "dc": DC}
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


def wordpress_gmt_date(value: str) -> str:
    """Convert a WXR UTC timestamp to an explicit ISO-8601 UTC timestamp."""
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
    except ValueError as error:
        raise ValueError(f"Invalid WordPress GMT date: {value!r}") from error
    return parsed.strftime("%Y-%m-%dT%H:%M:%SZ")


def postmeta(item: ET.Element) -> dict[str, list[str]]:
    values: dict[str, list[str]] = {}
    for entry in item.findall("wp:postmeta", NS):
        key = entry.findtext("wp:meta_key", default="", namespaces=NS)
        value = entry.findtext("wp:meta_value", default="", namespaces=NS)
        values.setdefault(key, []).append(value)
    return values


def latest_meta(metadata: dict[str, list[str]], key: str, default: str = "") -> str:
    values = metadata.get(key)
    return values[-1] if values else default


def nonnegative_meta_int(metadata: dict[str, list[str]], key: str) -> int:
    raw = latest_meta(metadata, key, "0").strip()
    try:
        return max(0, int(raw or 0))
    except ValueError:
        return 0


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
    attachment_urls = {
        item.findtext("wp:post_id", default="", namespaces=NS): item.findtext(
            "wp:attachment_url", default="", namespaces=NS
        )
        for item in items
        if item.findtext("wp:post_type", default="", namespaces=NS) == "attachment"
    }

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
        published = wordpress_gmt_date(
            item.findtext("wp:post_date_gmt", default="", namespaces=NS)
        )
        updated = wordpress_gmt_date(
            item.findtext("wp:post_modified_gmt", default="", namespaces=NS)
        )
        author = item.findtext("dc:creator", default="", namespaces=NS).strip()
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
        metadata = postmeta(item)
        old_slugs = list(
            dict.fromkeys(
                unquote(value).strip("/")
                for value in metadata.get("_wp_old_slug", [])
                if value.strip("/")
            )
        )
        featured_image = attachment_urls.get(
            latest_meta(metadata, "_thumbnail_id"), ""
        ).strip()
        view_count = nonnegative_meta_int(metadata, "post_views_count")
        like_count = nonnegative_meta_int(metadata, "post_nice_count")
        dislike_count = nonnegative_meta_int(metadata, "post_bad_count")
        # The original theme treats a missing per-post value as enabled and
        # suppresses the citation only when the stored value is exactly "0".
        show_citation = latest_meta(metadata, "nicen_show_citation") != "0"
        all_comments = item.findall("wp:comment", NS)
        comment_authors = {
            comment.findtext("wp:comment_id", default="", namespaces=NS):
            comment.findtext("wp:comment_author", default="", namespaces=NS).strip()
            for comment in all_comments
        }
        comments = []
        for comment in all_comments:
            if comment.findtext("wp:comment_approved", default="", namespaces=NS) != "1":
                continue

            parent_id = comment.findtext(
                "wp:comment_parent", default="0", namespaces=NS
            )
            comments.append(
                {
                    "author": comment.findtext(
                        "wp:comment_author", default="", namespaces=NS
                    ).strip() or "访客",
                    "replyTo": comment_authors.get(parent_id, ""),
                    "content": comment.findtext(
                        "wp:comment_content", default="", namespaces=NS
                    ).strip(),
                }
            )
        comment_count = len(comments)

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
                f"categories: {yaml_value(categories or [category])}",
                f"tags: {yaml_value(tags)}",
                f"author: {yaml_value(author or 'Haibin Lai')}",
                f"draft: {'false' if status == 'publish' else 'true'}",
                f"slug: {yaml_value(slug)}",
                f"legacySlug: {yaml_value(old_slug)}",
                f"oldSlugs: {yaml_value(old_slugs)}",
                f"wordpressId: {int(post_id or 0)}",
                f"sourceUrl: {yaml_value(source_url)}",
                f"commentCount: {comment_count}",
                f"viewCount: {view_count}",
                f"likeCount: {like_count}",
                f"dislikeCount: {dislike_count}",
            ]
        )
        if comments:
            frontmatter.append(f"comments: {yaml_value(comments)}")
        frontmatter.extend(
            [
                f"showCitation: {'true' if show_citation else 'false'}",
                "importedFromWordPress: true",
                "---",
                "",
            ]
        )
        if featured_image:
            frontmatter.insert(-3, f"featuredImage: {yaml_value(featured_image)}")
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
