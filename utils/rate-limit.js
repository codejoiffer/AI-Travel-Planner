const DEFAULT_LIMIT = 60; // 每窗口最大请求次数
const DEFAULT_WINDOW_MS = 60 * 1000; // 窗口大小（毫秒）

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) {
    return xf.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '0.0.0.0';
}

export function createRateLimiter({ limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS } = {}) {
  const store = new Map(); // key -> timestamps array

  function cleanupOld(now, arr) {
    const cutoff = now - windowMs;
    let i = 0;
    while (i < arr.length && arr[i] < cutoff) i++;
    if (i > 0) arr.splice(0, i);
  }

  return function check(req, res, keySuffix = '') {
    const now = Date.now();
    const ip = getClientIp(req);
    const path = (req.url || '').split('?')[0] || '/';
    const key = `${ip}:${path}${keySuffix ? ':' + keySuffix : ''}`;

    let arr = store.get(key);
    if (!arr) {
      arr = [];
      store.set(key, arr);
    }

    cleanupOld(now, arr);

    const remaining = Math.max(0, limit - arr.length);
    const resetMs = windowMs - (arr.length ? now - arr[0] : 0);

    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetMs / 1000)));

    if (arr.length >= limit) {
      return false;
    }
    arr.push(now);
    return true;
  };
}

export default createRateLimiter;

