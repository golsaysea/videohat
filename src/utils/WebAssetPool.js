export const WebAssetPool = {
  assets: new Map(),

  registerFiles(files) {
    const paths = [];

    for (const file of Array.from(files)) {
      const key = file.webkitRelativePath || file.name;
      const blobUrl = URL.createObjectURL(file);
      this.assets.set(key, blobUrl);

      const pureName = file.name;
      if (key !== pureName) this.assets.set(pureName, blobUrl);

      paths.push(key);
    }

    return paths;
  },

  getUrl(path) {
    if (!path) return '';
    if (/^(https?|blob|data):/i.test(path)) return path;
    const cleanName = path.replace(/\\/g, '/').split('/').pop();
    return this.assets.get(cleanName) || '';
  },

  getFileName(path) {
    if (!path) return '';
    return path.replace(/\\/g, '/').split('/').pop();
  },
};
