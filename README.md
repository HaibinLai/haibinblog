# Haibin's Blog

A static, versioned rebuild of Haibin's blog, built with Astro and ready for Vercel.

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

## Writing a moment

Create a Markdown file in `src/content/moments/`. Provide image URLs in the `images` frontmatter list. They render as small thumbnails and open at full size when clicked.

## Commands

```bash
npm run dev
npm run build
```
