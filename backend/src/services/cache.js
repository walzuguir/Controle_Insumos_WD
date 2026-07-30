// backend/src/services/cache.js

const cache = new Map();
const CACHE_TTL = 60000; // 1 minuto

export function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key, data) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL,
  });
}

export function clearCache() {
  cache.clear();
}