const ALLOWED_ORIGINS = new Set([
  "https://haibinlai.github.io",
  "https://haibinlaiblog.top",
  "https://www.haibinlaiblog.top",
]);

const SITE_COUNTER_PATH = "@site";
const DEFAULT_BASE_PATH = "/haibinblog";
const DEFAULT_DEDUP_WINDOW_SECONDS = 86_400;
const DEFAULT_RETENTION_DAYS = 8;
const MAX_PATH_LENGTH = 512;
const MAX_VISITOR_ID_LENGTH = 128;
const STATS_PERIODS = new Set([7, 30, 90]);

const COUNT_SQL = `
  SELECT
    COALESCE((SELECT total FROM view_counts WHERE path = '${SITE_COUNTER_PATH}'), 363842) AS site_total,
    COALESCE((SELECT total FROM view_counts WHERE path = ?1), 0) AS page_total
`;

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parsePositiveInt(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : fallback;
}

function normalizedBasePath(value) {
  const raw = typeof value === "string" && value.trim() ? value.trim() : DEFAULT_BASE_PATH;
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.replace(/\/+$/u, "") || "/";
}

/**
 * Convert both GitHub Pages and custom-domain URLs to the same counter key.
 * Examples: /haibinblog/posts/x -> /posts/x/, /posts/x?from=home -> /posts/x/.
 */
export function normalizePath(value, basePath = DEFAULT_BASE_PATH) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, "path is required");
  }

  let pathname;
  try {
    pathname = new URL(value.trim(), "https://counter.invalid").pathname;
    pathname = decodeURIComponent(pathname).normalize("NFC");
  } catch {
    throw new ApiError(400, "path is invalid");
  }

  if (/\p{Cc}/u.test(pathname) || pathname.includes("\\")) {
    throw new ApiError(400, "path is invalid");
  }

  pathname = `/${pathname}`.replace(/\/{2,}/gu, "/");

  const base = normalizedBasePath(basePath);
  if (base !== "/") {
    if (pathname === base) {
      pathname = "/";
    } else if (pathname.startsWith(`${base}/`)) {
      pathname = pathname.slice(base.length);
    }
  }

  if (pathname.endsWith("/index.html")) {
    pathname = pathname.slice(0, -"index.html".length);
  }

  if (pathname !== "/" && !pathname.endsWith("/")) {
    pathname += "/";
  }

  if (pathname.length > MAX_PATH_LENGTH) {
    throw new ApiError(400, "path is too long");
  }

  return pathname;
}

function validateVisitorId(value) {
  if (typeof value !== "string") {
    throw new ApiError(400, "visitorId is required");
  }

  const visitorId = value.trim();
  if (
    visitorId.length < 8 ||
    visitorId.length > MAX_VISITOR_ID_LENGTH ||
    !/^[A-Za-z0-9._:-]+$/u.test(visitorId)
  ) {
    throw new ApiError(400, "visitorId is invalid");
  }
  return visitorId;
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signIdentity(key, namespace, value) {
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${namespace}\0${value}`),
  );
  return toHex(signature);
}

export async function createIdentityHashes(secret, visitorId, ipAddress, userAgent) {
  if (typeof secret !== "string" || secret.length < 16) {
    throw new Error("HASH_SALT must be configured with at least 16 characters");
  }

  const key = await importHmacKey(secret);
  const [visitorHash, clientHash] = await Promise.all([
    signIdentity(key, "visitor", visitorId),
    signIdentity(key, "client", `${ipAddress}\0${userAgent}`),
  ]);
  return { visitorHash, clientHash };
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  };
}

function json(payload, status, origin) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders(origin),
  });
}

function responsePayload(row, incremented) {
  return {
    siteTotal: Number(row?.site_total ?? 363842),
    pageTotal: Number(row?.page_total ?? 0),
    incremented,
  };
}

async function readCounts(env, path) {
  const row = await env.DB.prepare(COUNT_SQL).bind(path).first();
  return responsePayload(row, false);
}

function utcDate(timestampSeconds) {
  return new Date(timestampSeconds * 1000).toISOString().slice(0, 10);
}

function fillDailySeries(rows, days, todayStart) {
  const counts = new Map((rows || []).map((row) => [row.view_date, Number(row.views || 0)]));
  return Array.from({ length: days }, (_, index) => {
    const timestamp = todayStart - (days - 1 - index) * 86_400;
    const date = utcDate(timestamp);
    return { date, views: counts.get(date) || 0 };
  });
}

async function readStats(env, requestedDays) {
  const parsedDays = Number.parseInt(String(requestedDays || "30"), 10);
  const days = STATS_PERIODS.has(parsedDays) ? parsedDays : 30;
  const now = Math.floor(Date.now() / 1000);
  const todayStart = Math.floor(now / 86_400) * 86_400;
  const periodStart = todayStart - (days - 1) * 86_400;

  const [overviewResult, dailyResult, popularResult, trendingResult] = await env.DB.batch([
    env.DB.prepare(`
      SELECT
        COALESCE((SELECT total FROM view_counts WHERE path = '${SITE_COUNTER_PATH}'), 363842) AS site_total,
        (SELECT COUNT(*) FROM view_events WHERE created_at >= ?1) AS today_views
    `).bind(todayStart),
    env.DB.prepare(`
      SELECT strftime('%Y-%m-%d', created_at, 'unixepoch') AS view_date, COUNT(*) AS views
      FROM view_events
      WHERE created_at >= ?1
      GROUP BY view_date
      ORDER BY view_date ASC
    `).bind(periodStart),
    env.DB.prepare(`
      SELECT path, total AS views
      FROM view_counts
      WHERE path LIKE '/posts/%'
      ORDER BY total DESC, path ASC
      LIMIT 20
    `),
    env.DB.prepare(`
      SELECT path, COUNT(*) AS views
      FROM view_events
      WHERE created_at >= ?1 AND path LIKE '/posts/%'
      GROUP BY path
      ORDER BY views DESC, path ASC
      LIMIT 5
    `).bind(periodStart),
  ]);

  const overview = overviewResult?.results?.[0] || {};
  const daily = fillDailySeries(dailyResult?.results, days, todayStart);
  const popular = (popularResult?.results || []).map((row) => ({
    path: row.path,
    views: Number(row.views || 0),
  }));
  const trendingRows = trendingResult?.results || [];
  let trending = [];

  if (trendingRows.length) {
    const paths = trendingRows.map((row) => row.path);
    const placeholders = paths.map((_, index) => `?${index + 2}`).join(', ');
    const trendResult = await env.DB.prepare(`
      SELECT path, strftime('%Y-%m-%d', created_at, 'unixepoch') AS view_date, COUNT(*) AS views
      FROM view_events
      WHERE created_at >= ?1 AND path IN (${placeholders})
      GROUP BY path, view_date
      ORDER BY view_date ASC
    `).bind(periodStart, ...paths).all();
    const valuesByPath = new Map(paths.map((path) => [path, new Map()]));
    for (const row of trendResult?.results || []) {
      valuesByPath.get(row.path)?.set(row.view_date, Number(row.views || 0));
    }
    trending = trendingRows.map((row) => ({
      path: row.path,
      total: Number(row.views || 0),
      values: daily.map(({ date }) => valuesByPath.get(row.path)?.get(date) || 0),
    }));
  }

  return {
    generatedAt: new Date(now * 1000).toISOString(),
    periodDays: days,
    overview: {
      siteTotal: Number(overview.site_total ?? 363842),
      todayViews: Number(overview.today_views || 0),
    },
    daily,
    popular,
    trending,
  };
}

async function recordView(request, env, path, visitorId) {
  const windowSeconds = parsePositiveInt(
    env.DEDUP_WINDOW_SECONDS,
    DEFAULT_DEDUP_WINDOW_SECONDS,
    60,
    604_800,
  );
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / windowSeconds);
  const ipAddress = request.headers.get("CF-Connecting-IP") || "unknown";
  const userAgent = (request.headers.get("User-Agent") || "unknown").slice(0, 512);
  const { visitorHash, clientHash } = await createIdentityHashes(
    env.HASH_SALT,
    visitorId,
    ipAddress,
    userAgent,
  );

  const insert = env.DB.prepare(`
    INSERT OR IGNORE INTO view_events
      (path, bucket, visitor_hash, client_hash, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5)
  `).bind(path, bucket, visitorHash, clientHash, now);
  const counts = env.DB.prepare(COUNT_SQL).bind(path);

  // D1 batches execute sequentially as one transaction. The INSERT trigger updates
  // both counters only when the UNIQUE constraint accepts a new view event.
  const [insertResult, countResult] = await env.DB.batch([insert, counts]);
  const row = countResult?.results?.[0];
  const incremented = Number(insertResult?.meta?.changes ?? 0) === 1;
  return responsePayload(row, incremented);
}

async function handleRequest(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (!ALLOWED_ORIGINS.has(origin)) {
    return new Response(JSON.stringify({ error: "origin is not allowed" }), {
      status: 403,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
        Vary: "Origin",
      },
    });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const url = new URL(request.url);
  const basePath = env.GITHUB_BASE_PATH || DEFAULT_BASE_PATH;

  if (request.method === "GET" && url.pathname === "/counts") {
    const path = normalizePath(url.searchParams.get("path"), basePath);
    return json(await readCounts(env, path), 200, origin);
  }

  if (request.method === "GET" && url.pathname === "/stats") {
    return json(await readStats(env, url.searchParams.get("days")), 200, origin);
  }

  if (request.method === "POST" && url.pathname === "/view") {
    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      throw new ApiError(415, "Content-Type must be application/json");
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 4096) {
      throw new ApiError(413, "request body is too large");
    }
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw new ApiError(400, "request body must be valid JSON");
    }
    const path = normalizePath(body?.path, basePath);
    const visitorId = validateVisitorId(body?.visitorId);
    return json(await recordView(request, env, path, visitorId), 200, origin);
  }

  return json({ error: "not found" }, 404, origin);
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      if (error instanceof ApiError) {
        const origin = request.headers.get("Origin") || "";
        return json({ error: error.message }, error.status, origin);
      }
      console.error("view counter request failed", error instanceof Error ? error.message : error);
      const origin = request.headers.get("Origin") || "";
      return json({ error: "internal server error" }, 500, origin);
    }
  },

  async scheduled(_controller, env, ctx) {
    const retentionDays = parsePositiveInt(
      env.EVENT_RETENTION_DAYS,
      DEFAULT_RETENTION_DAYS,
      2,
      90,
    );
    const windowSeconds = parsePositiveInt(
      env.DEDUP_WINDOW_SECONDS,
      DEFAULT_DEDUP_WINDOW_SECONDS,
      60,
      604_800,
    );
    // Keep at least two complete deduplication windows even if the configured
    // day count is accidentally set too low.
    const retentionSeconds = Math.max(retentionDays * 86_400, windowSeconds * 2);
    const cutoff = Math.floor(Date.now() / 1000) - retentionSeconds;
    ctx.waitUntil(
      env.DB.prepare("DELETE FROM view_events WHERE created_at < ?1").bind(cutoff).run(),
    );
  },
};
