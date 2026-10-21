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
draft: false
---
```

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

## View counter

The static site always renders the migration baselines: **363,842** total views
and each post's exported WordPress count. Continued counting uses the
Cloudflare Worker + D1 service in [`services/view-counter`](services/view-counter/README.md).
After deploying it, set the GitHub Actions repository variable
`PUBLIC_VIEW_COUNTER_URL` to the Worker URL and rerun the Pages workflow.
