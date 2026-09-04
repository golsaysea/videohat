const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GOOGLE_SCRIPT_ID = 'google-identity-services';
const GOOGLE_API_SCRIPT_ID = 'google-api-client';

const loadScript = (id, src) => new Promise((resolve, reject) => {
  if (document.getElementById(id)) {
    resolve();
    return;
  }
  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = true;
  script.defer = true;
  script.onload = () => resolve();
  script.onerror = () => reject(new Error(`无法加载 ${src}`));
  document.head.appendChild(script);
});

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
const appId = import.meta.env.VITE_GOOGLE_APP_ID || clientId.split('-')[0] || '';

export const isGoogleDriveConfigured = () => Boolean(clientId && apiKey);

export const ensureGoogleDriveConfigured = () => {
  if (!clientId || !apiKey) {
    throw new Error('请先在 Cloudflare Pages 环境变量配置 VITE_GOOGLE_CLIENT_ID 和 VITE_GOOGLE_API_KEY');
  }
};

export const requestDriveToken = async ({ prompt = '' } = {}) => {
  ensureGoogleDriveConfigured();
  await loadScript(GOOGLE_SCRIPT_ID, 'https://accounts.google.com/gsi/client');
  return new Promise((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_DRIVE_SCOPE,
      callback: (response) => {
        if (response?.access_token) resolve(response.access_token);
        else reject(new Error(response?.error || 'Google 授权失败'));
      },
      error_callback: (error) => reject(new Error(error?.message || error?.type || 'Google 授权窗口被关闭')),
    });
    tokenClient.requestAccessToken({ prompt });
  });
};

const ensurePicker = async () => {
  ensureGoogleDriveConfigured();
  await loadScript(GOOGLE_API_SCRIPT_ID, 'https://apis.google.com/js/api.js');
  await new Promise((resolve) => gapi.load('picker', resolve));
};

const normalizePickerDoc = (doc, kind) => ({
  id: doc.id,
  name: doc.name || doc.id,
  mimeType: doc.mimeType || '',
  url: doc.url || '',
  kind,
  provider: 'google-drive',
  status: '已加入媒体池',
});

export const openDrivePicker = async ({ token, kind = 'video' }) => {
  ensureGoogleDriveConfigured();
  await ensurePicker();
  const mimeTypes = kind === 'audio' || kind === 'music'
    ? 'audio/mpeg,audio/mp4,audio/wav,audio/x-wav,audio/aac,audio/ogg'
    : 'video/mp4,video/quicktime,video/webm,video/x-m4v';
  return new Promise((resolve, reject) => {
    let settled = false;
    const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
      .setMimeTypes(mimeTypes)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);
    const builder = new google.picker.PickerBuilder()
      .setDeveloperKey(apiKey)
      .setOAuthToken(token)
      .setOrigin(window.location.origin)
      .addView(view)
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .setCallback((data) => {
        if (data.action === google.picker.Action.PICKED) {
          settled = true;
          resolve((data.docs || []).map((doc) => normalizePickerDoc(doc, kind)));
        } else if (data.action === google.picker.Action.CANCEL && !settled) {
          settled = true;
          resolve([]);
        }
      })
      ;
    if (appId) builder.setAppId(appId);
    const picker = builder.build();
    try {
      picker.setVisible(true);
    } catch (error) {
      reject(error);
    }
  });
};

export const fetchDriveMetadata = async (item, token) => {
  const fields = 'id,name,mimeType,size,modifiedTime,videoMediaMetadata';
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(item.id)}?fields=${encodeURIComponent(fields)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`读取 Drive 元数据失败 HTTP ${response.status}`);
  return response.json();
};

export const downloadDriveFile = async (item, token, onProgress) => {
  const meta = await fetchDriveMetadata(item, token).catch(() => ({}));
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(item.id)}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`下载 Google Drive 素材失败 HTTP ${response.status}`);
  const total = Number(response.headers.get('content-length') || meta.size || 0);
  const reader = response.body?.getReader();
  if (!reader) {
    const blob = await response.blob();
    onProgress?.(1, '下载完成');
    return new File([blob], item.name || meta.name || item.id, { type: blob.type || item.mimeType || meta.mimeType || '' });
  }
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    if (total) onProgress?.(Math.min(0.98, received / total), '下载 Google Drive 素材');
  }
  const blob = new Blob(chunks, { type: item.mimeType || meta.mimeType || response.headers.get('content-type') || '' });
  onProgress?.(1, '下载完成');
  return new File([blob], item.name || meta.name || item.id, { type: blob.type });
};
