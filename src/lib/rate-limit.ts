// In-memory, best-effort rate limiter — same "accept per-instance state on
// serverless" tradeoff already made for the PayPal OAuth token cache (see
// src/lib/payments/paypal.ts). A cold start or a second concurrent instance
// resets/splits this counter, so it isn't a hard guarantee, but it still
// meaningfully raises the bar against a naive bot hammering checkout from
// one IP — which is the realistic threat now that checkout has no login
// requirement.
const hits = new Map<string, number[]>();

// Keeps the map from growing unbounded across the life of a warm instance —
// only checked opportunistically on write, no background timer needed.
function prune(now: number, windowMs: number) {
  if (hits.size < 5000) return;
  for (const [key, timestamps] of hits) {
    const recent = timestamps.filter((t) => now - t < windowMs);
    if (recent.length === 0) hits.delete(key);
    else hits.set(key, recent);
  }
}

/** Returns true if `key` (e.g. "createOrder:1.2.3.4") is still under `max`
 *  hits within the trailing `windowMs`, and records this call as a hit.
 *  Returns false (and does NOT record a hit) once the limit is reached, so
 *  a blocked caller retrying doesn't extend their own window. */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= max) {
    hits.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  prune(now, windowMs);
  return true;
}
