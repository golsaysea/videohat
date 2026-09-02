const jsonHeaders = (env, status = 200) => ({
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    ...corsHeaders(env),
  },
});

const corsHeaders = (env) => ({
  'access-control-allow-origin': env.CORS_ORIGIN || '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type,x-videohat-user',
  'access-control-max-age': '86400',
});

const ok = (env, data, status = 200) => Response.json(data, jsonHeaders(env, status));
const fail = (env, message, status = 400) => ok(env, { error: message }, status);

const slug = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9._@-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 120);

const readJson = async (request) => {
  const text = await request.text();
  if (!text) return {};
  return JSON.parse(text);
};

const ownerFromRequest = async (request, env) => {
  const url = new URL(request.url);
  const rawOwner = request.headers.get('x-videohat-user') || url.searchParams.get('ownerId') || 'local-user';
  const ownerId = slug(rawOwner) || 'local-user';
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO users (id, display_name, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name, updated_at = excluded.updated_at
  `).bind(ownerId, rawOwner, now).run();
  return ownerId;
};

const sanitizeProject = (row) => ({
  id: row.id,
  ownerId: row.owner_id,
  title: row.title,
  payload: JSON.parse(row.payload),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const listProjects = async (request, env) => {
  const ownerId = await ownerFromRequest(request, env);
  const { results } = await env.DB.prepare(`
    SELECT id, owner_id, title, payload, created_at, updated_at
    FROM projects
    WHERE owner_id = ?
    ORDER BY updated_at DESC
    LIMIT 100
  `).bind(ownerId).all();
  return ok(env, { projects: results.map(sanitizeProject) });
};

const getProject = async (request, env, id) => {
  const ownerId = await ownerFromRequest(request, env);
  const row = await env.DB.prepare(`
    SELECT id, owner_id, title, payload, created_at, updated_at
    FROM projects
    WHERE id = ? AND owner_id = ?
  `).bind(id, ownerId).first();
  if (!row) return fail(env, 'Project not found', 404);
  return ok(env, { project: sanitizeProject(row) });
};

const saveProject = async (request, env) => {
  const ownerId = await ownerFromRequest(request, env);
  const body = await readJson(request);
  const id = body.id || crypto.randomUUID();
  const title = String(body.title || '未命名工程').slice(0, 160);
  const payload = JSON.stringify(body.payload || {});
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO projects (id, owner_id, title, payload, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET title = excluded.title, payload = excluded.payload, updated_at = excluded.updated_at
  `).bind(id, ownerId, title, payload, now, now).run();

  return getProject(request, env, id);
};

const deleteProject = async (request, env, id) => {
  const ownerId = await ownerFromRequest(request, env);
  await env.DB.prepare('DELETE FROM projects WHERE id = ? AND owner_id = ?').bind(id, ownerId).run();
  return ok(env, { ok: true });
};

const uploadAsset = async (request, env) => {
  const ownerId = await ownerFromRequest(request, env);
  const url = new URL(request.url);
  const fileName = url.searchParams.get('fileName') || 'asset.bin';
  const kind = slug(url.searchParams.get('kind') || 'asset') || 'asset';
  const projectId = url.searchParams.get('projectId') || null;
  const id = crypto.randomUUID();
  const objectKey = `${ownerId}/${kind}/${id}-${slug(fileName) || 'asset.bin'}`;
  const contentType = request.headers.get('content-type') || 'application/octet-stream';
  const size = Number(request.headers.get('content-length') || 0);

  await env.ASSETS.put(objectKey, request.body, {
    httpMetadata: { contentType },
    customMetadata: { ownerId, projectId: projectId || '', fileName, kind },
  });

  await env.DB.prepare(`
    INSERT INTO assets (id, owner_id, project_id, kind, file_name, object_key, content_type, size)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, ownerId, projectId, kind, fileName, objectKey, contentType, size).run();

  return ok(env, { asset: { id, ownerId, projectId, kind, fileName, objectKey, contentType, size } }, 201);
};

const getAsset = async (request, env) => {
  const ownerId = await ownerFromRequest(request, env);
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key || !key.startsWith(`${ownerId}/`)) return fail(env, 'Asset not found', 404);
  const object = await env.ASSETS.get(key);
  if (!object) return fail(env, 'Asset not found', 404);
  return new Response(object.body, {
    headers: {
      ...corsHeaders(env),
      'content-type': object.httpMetadata?.contentType || 'application/octet-stream',
      'cache-control': 'private, max-age=3600',
    },
  });
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(env) });

    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, '') || '/';

      if (path === '/api/health') return ok(env, { ok: true, service: 'videohat-api' });
      if (path === '/api/projects' && request.method === 'GET') return listProjects(request, env);
      if (path === '/api/projects' && request.method === 'POST') return saveProject(request, env);
      if (path.startsWith('/api/projects/') && request.method === 'GET') return getProject(request, env, decodeURIComponent(path.split('/').pop()));
      if (path.startsWith('/api/projects/') && request.method === 'DELETE') return deleteProject(request, env, decodeURIComponent(path.split('/').pop()));
      if (path === '/api/assets' && request.method === 'POST') return uploadAsset(request, env);
      if (path === '/api/assets' && request.method === 'GET') return getAsset(request, env);

      return fail(env, 'Not found', 404);
    } catch (error) {
      console.error(error);
      return fail(env, error?.message || 'Internal error', 500);
    }
  },
};
