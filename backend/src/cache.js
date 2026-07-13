import NodeCache from 'node-cache';

// Wallet and profile are read on every screen but rarely change, so we cache
// them for a minute. Writes invalidate the entry for that courier.
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

export function walletKey(courierId) {
  return `wallet:${courierId}`;
}

export function courierKey(courierId) {
  return `courier:${courierId}`;
}