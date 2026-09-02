import localforage from 'localforage';

const LOG_KEY = 'videohat_operation_log_v1';
const MAX_ENTRIES = 200;

export const loadOperationLog = async () => {
  const entries = await localforage.getItem(LOG_KEY);
  return Array.isArray(entries) ? entries : [];
};

export const appendOperationLog = async (entry) => {
  const entries = await loadOperationLog();
  const normalized = {
    id: entry.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    time: entry.time || new Date().toISOString(),
    action: entry.action || '操作',
    status: entry.status || 'ok',
    detail: entry.detail || {},
  };
  const next = [normalized, ...entries].slice(0, MAX_ENTRIES);
  await localforage.setItem(LOG_KEY, next);
  return next;
};

export const clearOperationLog = async () => {
  await localforage.setItem(LOG_KEY, []);
  return [];
};
