const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, private",
  "X-Content-Type-Options": "nosniff",
};

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
const text = (body, status = 200) => new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
const now = () => Math.floor(Date.now() / 1000);

async function requireIdentity(env, ctx) {
  if (!ctx.access) throw new ApiError(403, "Cloudflare Access login required");
  const identity = await ctx.access.getIdentity();
  const email = String(identity?.email || "").trim().toLowerCase();
  const allowed = String(env.ALLOWED_EMAIL || "").trim().toLowerCase();
  if (!email || !allowed || email !== allowed) throw new ApiError(403, "This account is not allowed");
  return { email, name: identity?.name || email };
}

function requireSameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) throw new ApiError(403, "Cross-origin mutation denied");
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) throw new ApiError(415, "Content-Type must be application/json");
}

async function readJson(request) {
  requireSameOrigin(request);
  try { return await request.json(); } catch { throw new ApiError(400, "Invalid JSON body"); }
}

const cleanString = (value, name, max, required = false) => {
  const result = typeof value === "string" ? value.trim() : "";
  if (required && !result) throw new ApiError(400, `${name} is required`);
  if (result.length > max) throw new ApiError(400, `${name} is too long`);
  return result;
};

function cleanTodo(body, partial = false) {
  const value = {};
  if (!partial || "title" in body) value.title = cleanString(body.title, "title", 180, true);
  if (!partial || "notes" in body) value.notes = cleanString(body.notes, "notes", 4000);
  if (!partial || "priority" in body) {
    value.priority = cleanString(body.priority || "thisweek", "priority", 20);
    if (!["urgent", "twodays", "thisweek", "anytime"].includes(value.priority)) throw new ApiError(400, "priority is invalid");
  }
  if (!partial || "importance" in body) {
    value.importance = Number(body.importance ?? 3);
    if (!Number.isInteger(value.importance) || value.importance < 1 || value.importance > 5) throw new ApiError(400, "importance is invalid");
  }
  if (!partial || "dueDate" in body) {
    value.dueDate = cleanString(body.dueDate, "dueDate", 10);
    if (value.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(value.dueDate)) throw new ApiError(400, "dueDate is invalid");
  }
  if (!partial || "completed" in body) value.completed = Boolean(body.completed);
  return value;
}

function cleanPost(body, partial = false) {
  const value = {};
  if (!partial || "title" in body) value.title = cleanString(body.title, "title", 240, true);
  if (!partial || "excerpt" in body) value.excerpt = cleanString(body.excerpt, "excerpt", 1000);
  if (!partial || "content" in body) value.content = cleanString(body.content, "content", 500000);
  if (!partial || "tags" in body) {
    if (!Array.isArray(body.tags)) throw new ApiError(400, "tags must be an array");
    value.tags = [...new Set(body.tags.map((tag) => cleanString(tag, "tag", 40)).filter(Boolean))].slice(0, 20);
  }
  if (!partial || "status" in body) {
    value.status = cleanString(body.status || "draft", "status", 20);
    if (!["draft", "published", "archived"].includes(value.status)) throw new ApiError(400, "status is invalid");
  }
  if (!partial || "pinned" in body) value.pinned = Boolean(body.pinned);
  return value;
}

const todoFromRow = (row) => ({ id: row.id, title: row.title, notes: row.notes, priority: row.priority, importance: row.importance, dueDate: row.due_date, completed: Boolean(row.completed), createdAt: row.created_at, updatedAt: row.updated_at });
const postFromRow = (row, includeContent = false) => ({ id: row.id, title: row.title, excerpt: row.excerpt, ...(includeContent ? { content: row.content } : {}), tags: JSON.parse(row.tags || "[]"), status: row.status, pinned: Boolean(row.pinned), createdAt: row.created_at, updatedAt: row.updated_at });

async function todoRoutes(request, env, identity, path, method) {
  const id = path.match(/^\/api\/todos\/([^/]+)$/)?.[1];
  if (path === "/api/todos" && method === "GET") {
    const rows = await env.DB.prepare("SELECT * FROM private_todos WHERE owner_email = ? ORDER BY completed ASC, updated_at DESC").bind(identity.email).all();
    return json({ todos: rows.results.map(todoFromRow) });
  }
  if (path === "/api/todos" && method === "POST") {
    const body = cleanTodo(await readJson(request)); const stamp = now(); const newId = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO private_todos (id, owner_email, title, notes, priority, importance, due_date, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(newId, identity.email, body.title, body.notes, body.priority, body.importance, body.dueDate, Number(body.completed), stamp, stamp).run();
    return json({ todo: { id: newId, ...body, createdAt: stamp, updatedAt: stamp } }, 201);
  }
  if (id && method === "PUT") {
    const body = cleanTodo(await readJson(request)); const stamp = now();
    const result = await env.DB.prepare("UPDATE private_todos SET title=?, notes=?, priority=?, importance=?, due_date=?, completed=?, updated_at=? WHERE id=? AND owner_email=?")
      .bind(body.title, body.notes, body.priority, body.importance, body.dueDate, Number(body.completed), stamp, id, identity.email).run();
    if (!result.meta.changes) throw new ApiError(404, "Todo not found");
    return json({ todo: { id, ...body, updatedAt: stamp } });
  }
  if (id && method === "DELETE") {
    requireSameOrigin(request); const result = await env.DB.prepare("DELETE FROM private_todos WHERE id=? AND owner_email=?").bind(id, identity.email).run();
    if (!result.meta.changes) throw new ApiError(404, "Todo not found"); return json({ deleted: true });
  }
  return null;
}

async function postRoutes(request, env, identity, path, method) {
  const id = path.match(/^\/api\/posts\/([^/]+)$/)?.[1];
  if (path === "/api/posts" && method === "GET") {
    const rows = await env.DB.prepare("SELECT id,title,excerpt,tags,status,pinned,created_at,updated_at FROM private_posts WHERE owner_email=? ORDER BY pinned DESC, updated_at DESC").bind(identity.email).all();
    return json({ posts: rows.results.map((row) => postFromRow(row)) });
  }
  if (path === "/api/posts" && method === "POST") {
    const body = cleanPost(await readJson(request)); const stamp = now(); const newId = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO private_posts (id,owner_email,title,excerpt,content,tags,status,pinned,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
      .bind(newId, identity.email, body.title, body.excerpt, body.content, JSON.stringify(body.tags), body.status, Number(body.pinned), stamp, stamp).run();
    return json({ post: { id: newId, ...body, createdAt: stamp, updatedAt: stamp } }, 201);
  }
  if (id && method === "GET") {
    const row = await env.DB.prepare("SELECT * FROM private_posts WHERE id=? AND owner_email=?").bind(id, identity.email).first();
    if (!row) throw new ApiError(404, "Post not found"); return json({ post: postFromRow(row, true) });
  }
  if (id && method === "PUT") {
    const body = cleanPost(await readJson(request)); const stamp = now();
    const result = await env.DB.prepare("UPDATE private_posts SET title=?,excerpt=?,content=?,tags=?,status=?,pinned=?,updated_at=? WHERE id=? AND owner_email=?")
      .bind(body.title, body.excerpt, body.content, JSON.stringify(body.tags), body.status, Number(body.pinned), stamp, id, identity.email).run();
    if (!result.meta.changes) throw new ApiError(404, "Post not found"); return json({ post: { id, ...body, updatedAt: stamp } });
  }
  if (id && method === "DELETE") {
    requireSameOrigin(request); const result = await env.DB.prepare("DELETE FROM private_posts WHERE id=? AND owner_email=?").bind(id, identity.email).run();
    if (!result.meta.changes) throw new ApiError(404, "Post not found"); return json({ deleted: true });
  }
  return null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    try {
      const identity = await requireIdentity(env, ctx);
      if (url.pathname === "/api/session" && request.method === "GET") return json({ user: identity });
      if (url.pathname === "/api/export" && request.method === "GET") {
        const [todos, posts] = await env.DB.batch([
          env.DB.prepare("SELECT * FROM private_todos WHERE owner_email=? ORDER BY created_at").bind(identity.email),
          env.DB.prepare("SELECT * FROM private_posts WHERE owner_email=? ORDER BY created_at").bind(identity.email),
        ]);
        return json({ version: 1, exportedAt: new Date().toISOString(), todos: todos.results.map(todoFromRow), posts: posts.results.map((row) => postFromRow(row, true)) });
      }
      const todoResponse = await todoRoutes(request, env, identity, url.pathname, request.method); if (todoResponse) return todoResponse;
      const postResponse = await postRoutes(request, env, identity, url.pathname, request.method); if (postResponse) return postResponse;
      throw new ApiError(404, "Not found");
    } catch (error) {
      if (error instanceof ApiError) return json({ error: error.message }, error.status);
      console.error(error); return json({ error: "Internal server error" }, 500);
    }
  },
};
