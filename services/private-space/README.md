# Haibin Private Space

Private Todo and Markdown blog hosted on Cloudflare Workers with D1 storage.

## Security boundary

- Every API route requires a Cloudflare Access identity.
- The Worker checks the authenticated email against `ALLOWED_EMAIL` again.
- Mutations require same-origin JSON requests.
- Static assets contain application code only. Todo and post content stays in D1.
- The page asks search engines not to index or archive it.

The current deployment is `haibinblog-private.haibinlai.workers.dev`. The desired
custom hostname is `private.haibinlaiblog.top`; it can be added after the domain's
DNS moves from Huawei Cloud to a Cloudflare-managed zone.

## Commands

```sh
npm install
npm run db:local:init
npm run dev
npm run db:remote:init
npm run deploy
```
