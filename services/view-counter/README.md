# Haibin Blog view counter

An independently deployable Cloudflare Worker + D1 service for the blog's site-wide and per-page view counts.

The historical site total starts at **363842**. Each post separately starts at its own Markdown frontmatter `viewCount`. A new accepted view increments the site counter and that page's counter in the same D1 write. Repeated views with the same canonical path, time bucket, browser `visitorId`, and IP/User-Agent fingerprint do not increment again.

The site baseline and per-page baselines are independent WordPress data. The page totals are never summed into 363842, and any difference between them is deliberately left untouched rather than distributed among posts.

## API

Only these browser origins are accepted:

- `https://haibinlai.github.io`
- `https://haibinlaiblog.top`
- `https://www.haibinlaiblog.top`

### Record a view

```http
POST /view
Origin: https://haibinlai.github.io
Content-Type: application/json

{"path":"/posts/example/","visitorId":"a-browser-generated-uuid"}
```

Response:

```json
{"siteTotal":363843,"pageTotal":1,"incremented":true}
```

The client should remove the GitHub Pages base and send canonical paths such as `/posts/example/`. As a compatibility guard, the Worker also strips `/haibinblog`, removes query/hash data, normalizes Unicode, and adds the trailing slash.

### Read counts

```http
GET /counts?path=/posts/example/
Origin: https://haibinlai.github.io
```

Response:

```json
{"siteTotal":363843,"pageTotal":1,"incremented":false}
```

### Read public aggregate statistics

```http
GET /stats?days=30
Origin: https://haibinlai.github.io
```

`days` accepts `7`, `30`, or `90`. The response contains the site total,
today's accepted views, a zero-filled daily series, the all-time top 20 posts,
and daily series for up to five recently viewed posts. It exposes only aggregate
counts and canonical paths; visitor and client hashes are never returned.

## Why increments are concurrency-safe

`view_events` has a unique key over the canonical path, time bucket, visitor hash, and client fingerprint hash. `INSERT OR IGNORE` is therefore the single decision about whether a view is new. An `AFTER INSERT` trigger updates both aggregate counters only when that insert succeeds. The insert and count read are sent with D1 `batch()`, whose statements execute sequentially as a transaction. There is no separate read-before-write race.

D1 documentation: [Worker binding and transactional batches](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch).

The service HMACs `visitorId` and `CF-Connecting-IP + User-Agent` with the `HASH_SALT` secret. It stores only those hashes, the canonical path, and the time bucket; it never writes the raw IP address or User-Agent to D1. The daily cleanup removes expired deduplication rows while leaving aggregate counts intact.

## Deploy

Requirements: a Cloudflare account and Node.js 20 or newer.

```bash
cd services/view-counter
npm install
npx wrangler login
npx wrangler d1 create haibinblog-view-counter
cp wrangler.jsonc.example wrangler.jsonc
```

Put the `database_id` returned by `d1 create` into `wrangler.jsonc`, then initialize production D1:

```bash
npm run db:remote:init
```

That command regenerates `page-seed.sql` from `../../src/content/posts/**/*.md`, then applies `schema.sql`, the 363842 site seed, and every post's own historical `viewCount`. The generator uses each published post's `/posts/{slug}/` route. It fails on duplicate routes or invalid counts instead of producing an ambiguous import.

Create a long random secret and save it as a Worker secret:

```bash
openssl rand -hex 32
npx wrangler secret put HASH_SALT
```

Paste the generated value when Wrangler prompts, then deploy:

```bash
npm run deploy
```

Copy the deployed Worker URL, then expose it to the Astro build as the GitHub
Actions repository variable `PUBLIC_VIEW_COUNTER_URL`. You can set it under
**Repository Settings → Secrets and variables → Actions → Variables**, or with
an authenticated GitHub CLI:

```bash
gh variable set PUBLIC_VIEW_COUNTER_URL --body 'https://haibinblog-view-counter.<account>.workers.dev'
```

Run the **Build static blog** workflow again after setting the variable. The
generated site keeps showing the historical baselines when this variable is
unset or the counter is temporarily unavailable.

The site and page seeds use `ON CONFLICT DO NOTHING`, so rerunning initialization cannot reset totals that have already advanced. Run `npm run seed:pages` whenever the Markdown import changes; review `page-seed.sql`, then run the relevant initialization command.

Wrangler's D1 binding configuration follows Cloudflare's current [`d1_databases` format](https://developers.cloudflare.com/workers/wrangler/configuration/#d1-databases). The example intentionally contains a placeholder database ID and is not deployable until that value is replaced.

## Local development

```bash
cp wrangler.jsonc.example wrangler.jsonc
cp .dev.vars.example .dev.vars
# Use the database ID emitted by `wrangler d1 create` in wrangler.jsonc.
npm install
npm run db:local:init
npm run dev
```

Test it from another terminal. The production Origin header is required even locally because the CORS allowlist is intentionally exact:

```bash
curl -sS http://localhost:8787/view \
  -H 'Origin: https://haibinlai.github.io' \
  -H 'Content-Type: application/json' \
  -H 'CF-Connecting-IP: 203.0.113.7' \
  --data '{"path":"/posts/local-test/","visitorId":"local-test-visitor-0001"}'

curl -sS 'http://localhost:8787/counts?path=/posts/local-test/' \
  -H 'Origin: https://haibinlai.github.io'
```

Run the fast code and SQLite trigger tests without a Cloudflare account:

```bash
npm test
```

## Runtime settings

| Setting | Default | Purpose |
| --- | ---: | --- |
| `HASH_SALT` | required secret | HMAC key for visitor and client fingerprints |
| `DEDUP_WINDOW_SECONDS` | `86400` | Deduplication time bucket, 60 seconds to 7 days |
| `GITHUB_BASE_PATH` | `/haibinblog` | Base stripped from GitHub Pages paths |
| `EVENT_RETENTION_DAYS` | `90` | Number of days to retain hashed events for deduplication and public aggregate trends |

Changing `HASH_SALT` makes existing hashes incomparable and can allow one extra count for returning visitors in the active bucket. Keep it stable after launch.
