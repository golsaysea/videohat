export const WebAssetPool = {
  assets: new Map(),
  records: new Map(),

  registerFiles(files) {
    const paths = [];

    for (const file of Array.from(files)) {
      const key = file.webkitRelativePath || file.name;
      const blobUrl = URL.createObjectURL(file);
      const pureName = file.name;
      const record = {
        file,
        url: blobUrl,
        name: pureName,
        path: key,
        type: file.type || '',
        size: file.size || 0,
        kind: this.detectKind(file),
      };

      this.assets.set(key, blobUrl);
      this.assets.set(pureName, blobUrl);
      this.records.set(key, record);
      this.records.set(pureName, record);

      paths.push(key);
    }

    return paths;
  },

  detectKind(file) {
    const type = String(file?.type || '').toLowerCase();
    const name = String(file?.name || '').toLowerCase();
    if (type.startsWith('video/') || /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(name)) return 'video';
    if (type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(name)) return 'audio';
    return 'file';
  },

  getUrl(path) {
    if (!path) return '';
    if (/^(https?|blob|data):/i.test(path)) return path;
    const cleanName = path.replace(/\\/g, '/').split('/').pop();
    return this.assets.get(path) || this.assets.get(cleanName) || '';
  },

  getRecord(path) {
    if (!path) return null;
    const cleanName = path.replace(/\\/g, '/').split('/').pop();
    return this.records.get(path) || this.records.get(cleanName) || null;
  },

  list(kind = '') {
    const unique = new Map();
    for (const record of this.records.values()) {
      if (kind && record.kind !== kind) continue;
      unique.set(record.path || record.name, record);
    }
    return Array.from(unique.values());
  },

  getFileName(path) {
    if (!path) return '';
    return path.replace(/\\/g, '/').split('/').pop();
  },
};

if (typeof window !== 'undefined') window.WebAssetPool = WebAssetPool;
