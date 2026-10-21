# WordPress migration status

## Current local prototype

- Source export: `haibin039sblog.WordPress.2026-10-21.xml`
- Export coverage: 257 posts (231 published, 26 non-public)
- Export date range: 2024-08-21 through 2026-10-10
- Imported content: 231 public posts in `src/content/posts/wordpress/`
- Legacy links: `/index.php/<wordpress-slug>/` redirect to the matching Astro post
- Static build: 399 pages generated successfully

The October 21 export is the current migration snapshot. Before final cutover,
export once more if WordPress content has changed since this file was created.

## Theme mapping

The WordPress source theme is maintained in
`../theme-document/`. Its PHP templates cannot run on GitHub Pages, but these
parts have direct static equivalents:

| WordPress theme feature | Astro status |
| --- | --- |
| Document-style header and three-column home page | Present |
| Article table of contents | Present |
| Light/dark appearance | Present |
| KaTeX math and code blocks | Present; article-by-article audit pending |
| Responsive images, tables, and code | Present |
| WordPress permalink compatibility | Present for exported posts |
| Full-text search | Pending |
| Image lightbox | Pending |
| Comments | Exported in WXR but not rendered yet |
| View counts and trend dashboards | Needs a hosted analytics service |
| SMTP subscriptions and notifications | Needs an external email service |
| WordPress AJAX tools and database-backed games | Needs separate hosting or a static rewrite |

## Before changing DNS

1. Import a fresh WXR export and download the complete media library.
2. Copy media into the repository or an intentional object-storage bucket;
   remove dependencies on the old WordPress and Vercel hosts.
3. Audit shortcodes, PDFs, audio, iframes, Mermaid diagrams, formulas, and
   internal links.
4. Compare post, attachment, and approved-comment counts with WordPress.
5. Test representative desktop and mobile pages.
6. Change Astro's `site`, remove the GitHub project `base`, configure the
   GitHub Pages custom domain, and only then update DNS.
