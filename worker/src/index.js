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
  'access-control-allow-headers': 'content-type,x-videohat-user,x-videohat-admin-token,authorization',
  'access-control-max-age': '86400',
});

const ok = (env, data, status = 200) => Response.json(data, jsonHeaders(env, status));
const fail = (env, message, status = 400) => ok(env, { error: message }, status);
const mediaBucket = (env) => env.MEDIA || env.ASSETS;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    display_name TEXT,
    email TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    title TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_projects_owner_updated ON projects(owner_id, updated_at DESC)`,
  `CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    project_id TEXT,
    kind TEXT NOT NULL,
    file_name TEXT NOT NULL,
    object_key TEXT NOT NULL UNIQUE,
    content_type TEXT,
    size INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_assets_owner_project ON assets(owner_id, project_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    payload TEXT NOT NULL,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_templates_published_updated ON templates(is_published, updated_at DESC)`,
];

const ensureDb = async (env) => {
  if (!env.DB) throw new Error('D1 binding DB is missing. Bind videohat-db to DB in the Pages project.');
  for (const statement of schemaStatements) {
    await env.DB.prepare(statement).run();
  }
};

const withDatabase = async (env, action, label = 'Database') => {
  try {
    await ensureDb(env);
    return await action();
  } catch (error) {
    console.error(error);
    return fail(env, `${label} error: ${error?.message || 'Unknown D1 error'}`, 500);
  }
};

const slug = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9._@-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 120);

const fontMimeType = (fileName, fallback = 'application/octet-stream') => {
  const lower = String(fileName || '').toLowerCase();
  if (lower.endsWith('.woff2')) return 'font/woff2';
  if (lower.endsWith('.woff')) return 'font/woff';
  if (lower.endsWith('.ttf')) return 'font/ttf';
  if (lower.endsWith('.otf')) return 'font/otf';
  if (lower.endsWith('.ttc')) return 'font/collection';
  return fallback;
};

const isAllowedFontFile = (fileName) => /\.(woff2?|ttf|otf|ttc)$/i.test(String(fileName || ''));

const fontFamilyFromFileName = (fileName) => String(fileName || 'VideoHat Font')
  .replace(/\.(woff2?|ttf|otf|ttc)$/i, '')
  .replace(/[-_]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 120) || 'VideoHat Font';

const sanitizeFont = (row) => ({
  id: row.id,
  ownerId: row.owner_id,
  family: fontFamilyFromFileName(row.file_name),
  fileName: row.file_name,
  objectKey: row.object_key,
  contentType: row.content_type || fontMimeType(row.file_name),
  size: row.size || 0,
  createdAt: row.created_at,
});
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

const sanitizeTemplate = (row, includeDraft = false) => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  payload: JSON.parse(row.payload),
  isPublished: Boolean(row.is_published),
  createdBy: includeDraft ? row.created_by : undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const isAdminRequest = (request, env) => {
  const configured = env.ADMIN_TOKEN;
  if (!configured) return false;
  const headerToken = request.headers.get('x-videohat-admin-token') || '';
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  return headerToken === configured || bearer === configured;
};

const requireAdmin = (request, env) => {
  if (isAdminRequest(request, env)) return null;
  return fail(env, 'Admin token required', 401);
};

const listTemplates = async (request, env) => withDatabase(env, async () => {
  const includeDraft = isAdminRequest(request, env);
  const sql = includeDraft
    ? `SELECT id, title, description, payload, is_published, created_by, created_at, updated_at FROM templates ORDER BY updated_at DESC LIMIT 100`
    : `SELECT id, title, description, payload, is_published, created_by, created_at, updated_at FROM templates WHERE is_published = 1 ORDER BY updated_at DESC LIMIT 100`;
  const { results } = await env.DB.prepare(sql).all();
  return ok(env, { templates: results.map((row) => sanitizeTemplate(row, includeDraft)), isAdmin: includeDraft });
}, 'Template database');

const saveTemplate = async (request, env) => {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  return withDatabase(env, async () => {

  const ownerId = await ownerFromRequest(request, env);
  const body = await readJson(request);
  const id = body.id || crypto.randomUUID();
  const title = String(body.title || '官方 Reels 模板').slice(0, 160);
  const description = String(body.description || '').slice(0, 500);
  const payload = JSON.stringify(body.payload || {});
  const isPublished = body.isPublished === false ? 0 : 1;
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO templates (id, title, description, payload, is_published, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      payload = excluded.payload,
      is_published = excluded.is_published,
      updated_at = excluded.updated_at
  `).bind(id, title, description, payload, isPublished, ownerId, now, now).run();

  const row = await env.DB.prepare(`
    SELECT id, title, description, payload, is_published, created_by, created_at, updated_at
    FROM templates
    WHERE id = ?
  `).bind(id).first();
  return ok(env, { template: sanitizeTemplate(row, true) }, 201);
  }, 'Template save');
};

const deleteTemplate = async (request, env, id) => {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  return withDatabase(env, async () => {
    await env.DB.prepare('DELETE FROM templates WHERE id = ?').bind(id).run();
    return ok(env, { ok: true });
  }, 'Template delete');
};

const listProjects = async (request, env) => withDatabase(env, async () => {
  const ownerId = await ownerFromRequest(request, env);
  const { results } = await env.DB.prepare(`
    SELECT id, owner_id, title, payload, created_at, updated_at
    FROM projects
    WHERE owner_id = ?
    ORDER BY updated_at DESC
    LIMIT 100
  `).bind(ownerId).all();
  return ok(env, { projects: results.map(sanitizeProject) });
}, 'Project database');

const getProject = async (request, env, id) => withDatabase(env, async () => {
  const ownerId = await ownerFromRequest(request, env);
  const row = await env.DB.prepare(`
    SELECT id, owner_id, title, payload, created_at, updated_at
    FROM projects
    WHERE id = ? AND owner_id = ?
  `).bind(id, ownerId).first();
  if (!row) return fail(env, 'Project not found', 404);
  return ok(env, { project: sanitizeProject(row) });
}, 'Project database');

const saveProject = async (request, env) => withDatabase(env, async () => {
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
}, 'Project save');

const deleteProject = async (request, env, id) => withDatabase(env, async () => {
  const ownerId = await ownerFromRequest(request, env);
  await env.DB.prepare('DELETE FROM projects WHERE id = ? AND owner_id = ?').bind(id, ownerId).run();
  return ok(env, { ok: true });
}, 'Project delete');

const listFonts = async (request, env) => withDatabase(env, async () => {
  const { results } = await env.DB.prepare(`
    SELECT id, owner_id, file_name, object_key, content_type, size, created_at
    FROM assets
    WHERE kind = 'font'
    ORDER BY file_name COLLATE NOCASE ASC
    LIMIT 500
  `).all();
  return ok(env, { fonts: results.map(sanitizeFont) });
}, 'Font database');

const uploadFont = async (request, env) => {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  return withDatabase(env, async () => {
    const ownerId = await ownerFromRequest(request, env);
    const url = new URL(request.url);
    const fileName = url.searchParams.get('fileName') || 'font.woff2';
    if (!isAllowedFontFile(fileName)) return fail(env, 'Only WOFF2, WOFF, TTF, OTF and TTC font files are supported', 415);

    const id = crypto.randomUUID();
    const kind = 'font';
    const projectId = 'official-fonts';
    const objectKey = `${ownerId}/${kind}/${id}-${slug(fileName) || 'font'}`;
    const contentType = fontMimeType(fileName, request.headers.get('content-type') || 'application/octet-stream');
    const size = Number(request.headers.get('content-length') || 0);
    const bucket = mediaBucket(env);
    if (!bucket) return fail(env, 'Media bucket binding missing', 500);

    await bucket.put(objectKey, request.body, {
      httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' },
      customMetadata: { ownerId, projectId, fileName, kind },
    });

    await env.DB.prepare(`
      INSERT INTO assets (id, owner_id, project_id, kind, file_name, object_key, content_type, size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, ownerId, projectId, kind, fileName, objectKey, contentType, size).run();

    return ok(env, { font: { id, ownerId, projectId, kind, family: fontFamilyFromFileName(fileName), fileName, objectKey, contentType, size } }, 201);
  }, 'Font upload');
};
const uploadAsset = async (request, env) => withDatabase(env, async () => {
  const ownerId = await ownerFromRequest(request, env);
  const url = new URL(request.url);
  const fileName = url.searchParams.get('fileName') || 'asset.bin';
  const kind = slug(url.searchParams.get('kind') || 'asset') || 'asset';
  const projectId = url.searchParams.get('projectId') || null;
  const id = crypto.randomUUID();
  const objectKey = `${ownerId}/${kind}/${id}-${slug(fileName) || 'asset.bin'}`;
  const contentType = request.headers.get('content-type') || 'application/octet-stream';
  const size = Number(request.headers.get('content-length') || 0);

  const bucket = mediaBucket(env);
  if (!bucket) return fail(env, 'Media bucket binding missing', 500);

  await bucket.put(objectKey, request.body, {
    httpMetadata: { contentType },
    customMetadata: { ownerId, projectId: projectId || '', fileName, kind },
  });

  await env.DB.prepare(`
    INSERT INTO assets (id, owner_id, project_id, kind, file_name, object_key, content_type, size)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, ownerId, projectId, kind, fileName, objectKey, contentType, size).run();

  return ok(env, { asset: { id, ownerId, projectId, kind, fileName, objectKey, contentType, size } }, 201);
}, 'Asset upload');

const getAsset = async (request, env) => withDatabase(env, async () => {
  const ownerId = await ownerFromRequest(request, env);
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key || !key.startsWith(`${ownerId}/`)) return fail(env, 'Asset not found', 404);
  const bucket = mediaBucket(env);
  if (!bucket) return fail(env, 'Media bucket binding missing', 500);
  const object = await bucket.get(key);
  if (!object) return fail(env, 'Asset not found', 404);
  return new Response(object.body, {
    headers: {
      ...corsHeaders(env),
      'content-type': object.httpMetadata?.contentType || 'application/octet-stream',
      'cache-control': 'private, max-age=3600',
    },
  });
}, 'Asset read');

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(env) });

    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, '') || '/';

      if (path === '/api/health') return ok(env, { ok: true, service: 'videohat-api' });
      if (path === '/api/db/ensure') return withDatabase(env, async () => ok(env, { ok: true, db: true, media: Boolean(mediaBucket(env)) }), 'Database setup');
      if (path === '/api/templates' && request.method === 'GET') return listTemplates(request, env);
      if (path === '/api/fonts' && request.method === 'GET') return listFonts(request, env);
      if (path === '/api/fonts' && request.method === 'POST') return uploadFont(request, env);
      if (path === '/api/templates' && request.method === 'POST') return saveTemplate(request, env);
      if (path.startsWith('/api/templates/') && request.method === 'DELETE') return deleteTemplate(request, env, decodeURIComponent(path.split('/').pop()));
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
