const cache = new Map();
const CACHE_TTL = 60000;

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL,
  });
}

function clearCache() {
  cache.clear();
}

module.exports = { getCache, setCache, clearCache };