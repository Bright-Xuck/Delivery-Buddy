import NodeCache from 'node-cache';

// Simple in-memory cache with a 60s TTL.
// Used to cache read-heavy, rarely-changing endpoints (wallet balance, courier profile).
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export function getCache(key) {
  return cache.get(key);
}

export function setCache(key, value) {
  cache.set(key, value);
}

export function delCache(key) {
  cache.del(key);
}

// Keys are namespaced per courier so invalidation on write is surgical.
export function walletKey(courierId) {
  return `wallet:${courierId}`;
}

export function courierKey(courierId) {
  return `courier:${courierId}`;
}