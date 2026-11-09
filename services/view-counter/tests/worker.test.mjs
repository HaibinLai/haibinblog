import assert from "node:assert/strict";
import test from "node:test";

import worker, { createIdentityHashes, dateInTimeZone, normalizePath, readStats, reportingWindow } from "../src/index.js";

const ALLOWED_ORIGIN = "https://haibinlai.github.io";

class FakeStatement {
  constructor(database, sql, args = []) {
    this.database = database;
    this.sql = sql;
    this.args = args;
  }

  bind(...args) {
    return new FakeStatement(this.database, this.sql, args);
  }

  async first() {
    return this.database.countRow(this.args[0]);
  }

  async run() {
    return { meta: { changes: 0 } };
  }
}

class FakeD1 {
  constructor() {
    this.siteTotal = 363842;
    this.pageTotals = new Map();
    this.events = new Set();
  }

  prepare(sql) {
    return new FakeStatement(this, sql);
  }

  countRow(path) {
    return {
      site_total: this.siteTotal,
      page_total: this.pageTotals.get(path) || 0,
    };
  }

  async batch(statements) {
    const [insert, select] = statements;
    const [path, bucket, visitorHash, clientHash] = insert.args;
    const key = `${path}\0${bucket}\0${visitorHash}\0${clientHash}`;
    const incremented = !this.events.has(key);
    if (incremented) {
      this.events.add(key);
      this.siteTotal += 1;
      this.pageTotals.set(path, (this.pageTotals.get(path) || 0) + 1);
    }
    return [
      { meta: { changes: incremented ? 1 : 0 } },
      { results: [this.countRow(select.args[0])] },
    ];
  }
}

function env(database = new FakeD1(), rateLimiter = null) {
  return {
    DB: database,
    HASH_SALT: "test-secret-with-at-least-16-characters",
    GITHUB_BASE_PATH: "/haibinblog",
    DEDUP_WINDOW_SECONDS: "86400",
    ...(rateLimiter ? { VIEW_RATE_LIMITER: rateLimiter } : {}),
  };
}

function postRequest(body, origin = ALLOWED_ORIGIN) {
  return new Request("https://counter.example/view", {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "CF-Connecting-IP": "203.0.113.7",
      "User-Agent": "counter-test/1.0",
    },
    body: JSON.stringify(body),
  });
}

test("normalizes GitHub Pages and custom-domain paths to one key", () => {
  assert.equal(normalizePath("/haibinblog/posts/demo?x=1"), "/posts/demo/");
  assert.equal(normalizePath("https://haibinlaiblog.top/posts/demo/"), "/posts/demo/");
  assert.equal(normalizePath("/haibinblog"), "/");
  assert.equal(normalizePath("/haibinblog/index.html"), "/");
});

test("assigns visits to the Chicago calendar date instead of UTC", () => {
  assert.equal(
    dateInTimeZone(Date.parse("2026-10-23T02:30:00Z")),
    "2026-10-22",
  );
  assert.equal(
    dateInTimeZone(Date.parse("2026-12-23T05:30:00Z")),
    "2026-12-22",
  );
});

test("the daily report switches at Chicago midnight and uses 14 complete days", () => {
  const before = reportingWindow(Date.parse("2026-11-10T05:59:59Z"));
  const after = reportingWindow(Date.parse("2026-11-10T06:00:00Z"));
  assert.equal(before.snapshotDate, "2026-11-09");
  assert.equal(before.periodEnd, "2026-11-08");
  assert.deepEqual(
    { snapshotDate: after.snapshotDate, periodStart: after.periodStart, periodEnd: after.periodEnd, days: after.dates.length },
    { snapshotDate: "2026-11-10", periodStart: "2026-10-27", periodEnd: "2026-11-09", days: 14 },
  );
});

test("14-day statistics exclude today's events and align the five trend series", async () => {
  const queries = [];
  const database = {
    prepare(sql) {
      return {
        sql,
        bind(...args) {
          return {
            sql, args,
            async all() {
              queries.push({ sql, args });
              return { results: [{ path: "/posts/a/", view_date: "2026-11-09", views: 5 }] };
            },
          };
        },
      };
    },
    async batch(statements) {
      queries.push(...statements);
      return [
        { results: [{ site_total: 500, today_views: 4, yesterday_views: 5, tracking_since: "2026-10-22" }] },
        { results: [{ view_date: "2026-11-09", views: 5 }] },
        { results: [{ path: "/posts/a/", views: 100, snapshot_views: 99 }] },
        { results: [{ path: "/posts/a/", views: 5 }] },
      ];
    },
  };

  const result = await readStats({ DB: database }, "14", Date.parse("2026-11-10T06:00:00Z"));
  assert.equal(result.periodDays, 14);
  assert.equal(result.overview.siteTotalAtMidnight, 496);
  assert.equal(result.overview.yesterdayViews, 5);
  assert.deepEqual(result.popularAtMidnight, [{ path: "/posts/a/", views: 99 }]);
  assert.deepEqual(result.daily.at(-1), { date: "2026-11-09", views: 5 });
  assert.equal(result.daily.length, 14);
  assert.equal(result.trending[0].total, 5);
  assert.deepEqual(result.trending[0].values, [...Array(13).fill(0), 5]);
  assert.deepEqual(queries.slice(0, 4).map((query) => query.args), [
    ["2026-11-10", "2026-11-09"],
    ["2026-10-27", "2026-11-09"],
    ["2026-11-10"],
    ["2026-10-27", "2026-11-09"],
  ]);
  assert.match(queries[3].sql, /LIMIT 5/);
  assert.deepEqual(queries[4].args, ["2026-10-27", "2026-11-09", "/posts/a/"]);
});

test("identity data is HMACed and never returned as raw input", async () => {
  const hashes = await createIdentityHashes(
    "test-secret-with-at-least-16-characters",
    "visitor-12345678",
    "203.0.113.7",
    "counter-test/1.0",
  );
  assert.match(hashes.visitorHash, /^[a-f0-9]{64}$/);
  assert.match(hashes.clientHash, /^[a-f0-9]{64}$/);
  assert.ok(!hashes.clientHash.includes("203.0.113.7"));
});

test("POST increments once per path, identity and time bucket", async () => {
  const database = new FakeD1();
  const bindings = env(database);
  const body = { path: "/haibinblog/posts/demo/", visitorId: "visitor-12345678" };

  const first = await worker.fetch(postRequest(body), bindings);
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), {
    siteTotal: 363843,
    pageTotal: 1,
    incremented: true,
  });

  const duplicate = await worker.fetch(postRequest(body), bindings);
  assert.deepEqual(await duplicate.json(), {
    siteTotal: 363843,
    pageTotal: 1,
    incremented: false,
  });
});

test("rejects view writes when the per-IP rate limiter denies the request", async () => {
  const calls = [];
  const rateLimiter = {
    async limit(value) {
      calls.push(value);
      return { success: false };
    },
  };
  const response = await worker.fetch(
    postRequest({ path: "/posts/demo/", visitorId: "visitor-12345678" }),
    env(new FakeD1(), rateLimiter),
  );

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "60");
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), ALLOWED_ORIGIN);
  assert.deepEqual(calls, [{ key: "view:203.0.113.7" }]);
  assert.deepEqual(await response.json(), { error: "rate limit exceeded" });
});

test("GET returns the same response shape without incrementing", async () => {
  const bindings = env();
  const request = new Request(
    "https://counter.example/counts?path=%2Fhaibinblog%2Fposts%2Fdemo%2F",
    { headers: { Origin: ALLOWED_ORIGIN } },
  );
  const response = await worker.fetch(request, bindings);
  assert.deepEqual(await response.json(), {
    siteTotal: 363842,
    pageTotal: 0,
    incremented: false,
  });
});

test("rejects origins outside the exact allowlist", async () => {
  const response = await worker.fetch(
    postRequest(
      { path: "/posts/demo/", visitorId: "visitor-12345678" },
      "https://example.com",
    ),
    env(),
  );
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
});
