const API_BASE = (import.meta.env.VITE_VIDEOHAT_API_BASE || '').replace(/\/$/, '');

const endpoint = (path) => `${API_BASE}${path}`;

const headersFor = (ownerId, extra = {}) => ({
  'x-videohat-user': ownerId || 'local-user',
  ...extra,
});

const assertOk = async (response) => {
  if (response.ok) return response;
  let message = `HTTP ${response.status}`;
  try {
    const body = await response.json();
    if (body?.error) message = body.error;
  } catch (_) {}
  throw new Error(message);
};

export const listCloudProjects = async (ownerId) => {
  const response = await assertOk(await fetch(endpoint('/api/projects'), {
    headers: headersFor(ownerId),
  }));
  return response.json();
};

export const saveCloudProject = async (ownerId, project) => {
  const response = await assertOk(await fetch(endpoint('/api/projects'), {
    method: 'POST',
    headers: headersFor(ownerId, { 'content-type': 'application/json' }),
    body: JSON.stringify(project),
  }));
  return response.json();
};

export const uploadCloudAsset = async (ownerId, file, { kind = 'asset', projectId = '' } = {}) => {
  const params = new URLSearchParams({ kind, fileName: file.name });
  if (projectId) params.set('projectId', projectId);
  const response = await assertOk(await fetch(endpoint(`/api/assets?${params}`), {
    method: 'POST',
    headers: headersFor(ownerId, { 'content-type': file.type || 'application/octet-stream' }),
    body: file,
  }));
  return response.json();
};

export const assetUrl = (ownerId, objectKey) => {
  const params = new URLSearchParams({ key: objectKey, ownerId: ownerId || 'local-user' });
  return endpoint(`/api/assets?${params}`);
};
