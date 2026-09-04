const WINDOW_MS = 15 * 60 * 1000;
const MAX_HITS = 8;
const buckets = new Map();

function prune(now) {
  for (const [key, bucket] of buckets) {
    if (now - bucket.start > WINDOW_MS) buckets.delete(key);
  }
}

export function hitLimit(key) {
  const now = Date.now();
  if (buckets.size > 2000) prune(now);

  const current = buckets.get(key);
  if (!current || now - current.start > WINDOW_MS) {
    buckets.set(key, { start: now, count: 1 });
    return { limited: false, remaining: MAX_HITS - 1, retryAfter: 0 };
  }

  current.count += 1;
  if (current.count > MAX_HITS) {
    const retryAfter = Math.ceil((current.start + WINDOW_MS - now) / 1000);
    return { limited: true, remaining: 0, retryAfter };
  }

  return {
    limited: false,
    remaining: Math.max(0, MAX_HITS - current.count),
    retryAfter: 0,
  };
}
