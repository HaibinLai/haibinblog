# Haibin's Blog

A static, versioned rebuild of Haibin's blog, built with Astro and deployed to
GitHub Pages.

## Writing a post

Create a Markdown file in `src/content/posts/` with this frontmatter:

```yaml
---
title: Your title
description: A short description for the post list and search engines.
publishedAt: 2026-09-22
category: Research
tags: [systems, notes]
language: en
translationKey: example-bilingual-post
draft: false
---
```

Set `language` to `zh-CN` or `en` whenever the article language is known,
including for a single-language English post. For a bilingual post, give both
language versions the same `translationKey`. The article page will automatically
show a **中文 / English** switch when both published versions are available.
Leave `translationKey` out for an ordinary single-language post.

To place a post in the three-card homepage feature, add a `featuredRank` from
`1` to `3`. Rank `1` is the large card, while ranks `2` and `3` are the upper
and lower small cards. The card uses the article title, category, featured
image, date, and view count by default. These optional fields override only the
homepage card:

```yaml
featuredRank: 1
featuredTitle: A shorter display title
featuredLabel: Research
featuredBannerImage: images/featured/example.webp
```

Only one published article should use each rank. Posts in the `fragments` and
`life-fragments` categories never appear in the homepage feature.

Math uses ordinary Markdown math syntax:

```markdown
$$
2^{28} = 268435456
$$
```

## Publishing a Moment

Moments are regular posts whose category list contains `fragments`. They appear
both in the main article archive and in `/moments/`, where their text, images,
dates, and comment counts are rendered as a chronological feed.

## Commands

```bash
npm run dev
npm run build
```

## Importing from WordPress

Export **All content** from WordPress under **Tools → Export**, then run:

```bash
python3 scripts/import_wordpress.py /path/to/wordpress-export.xml
npm run build
```

The importer writes generated posts to `src/content/posts/wordpress/`. It keeps
the original HTML and imports categories, author, dates, historical views,
likes, featured images, old slugs, and the citation setting. It also generates
compatibility pages for current and older `/index.php/<slug>/` links. Re-running
it replaces only that generated directory. Draft, pending, private, and
password-protected posts are skipped by default so they cannot be accidentally
committed to this public repository.

To set up a bilingual pair in WordPress before exporting, use the **多语言文章**
panel in the post editor. Choose the article language and enter the same bilingual
group value for both versions (for example, `tianyin-xu-podcast`). These values
are exported as `nicen_language` and `nicen_translation_group`, then converted to
the Astro `language` and `translationKey` fields during import.

To choose homepage features while editing in WordPress, use the **首页精选**
panel. Select the main, upper-right, or lower-right slot. The optional display
title, label, and banner image URL apply only to the homepage card. Exported
values are converted to `featuredRank`, `featuredTitle`, `featuredLabel`, and
`featuredBannerImage`; choosing an occupied slot replaces its previous article.

## View counter

The static site always renders the migration baselines: **363,842** total views
and each post's exported WordPress count. Continued counting uses the
Cloudflare Worker + D1 service in [`services/view-counter`](services/view-counter/README.md).
After deploying it, set the GitHub Actions repository variable
`PUBLIC_VIEW_COUNTER_URL` to the Worker URL and rerun the Pages workflow.
