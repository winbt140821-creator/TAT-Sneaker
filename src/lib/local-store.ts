// Shared factory for the localStorage-backed state used by the cart and the
// wishlist (see cart-storage.ts / wishlist-storage.ts) — both need the same
// get/subscribe/read/write shape for useSyncExternalStore, differing only in
// storage key, change-event name, and the value type.
export function createLocalStore<T>(storageKey: string, eventName: string, empty: T) {
  let cachedRaw: string | null | undefined;
  let cachedSnapshot: T = empty;

  /** Stable-reference snapshot for useSyncExternalStore — only reparses when the underlying value changed. */
  function getSnapshot(): T {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === cachedRaw) return cachedSnapshot;
    cachedRaw = raw;
    try {
      cachedSnapshot = raw ? (JSON.parse(raw) as T) : empty;
    } catch {
      cachedSnapshot = empty;
    }
    return cachedSnapshot;
  }

  function getServerSnapshot(): T {
    return empty;
  }

  function subscribe(callback: () => void): () => void {
    window.addEventListener(eventName, callback);
    window.addEventListener("storage", callback);
    return () => {
      window.removeEventListener(eventName, callback);
      window.removeEventListener("storage", callback);
    };
  }

  function read(): T {
    if (typeof window === "undefined") return empty;
    return getSnapshot();
  }

  function write(value: T) {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
    window.dispatchEvent(new Event(eventName));
  }

  return { getSnapshot, getServerSnapshot, subscribe, read, write };
}

// tatsneaker.vn (shoes) and quanao.tatsneaker.vn (clothing) are different
// origins, so localStorage never carries a value between them — a cookie
// scoped to the shared parent domain does. Undefined on any other host
// (local dev's localhost, preview deployments) — a Domain attribute the
// browser doesn't recognize as covering the current host silently fails to
// set the cookie at all, so it's safer to just omit it there and fall back
// to a plain same-origin cookie.
function cookieDomain(): string | undefined {
  const { hostname } = window.location;
  return hostname === "tatsneaker.vn" || hostname.endsWith(".tatsneaker.vn")
    ? ".tatsneaker.vn"
    : undefined;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Same shape as createLocalStore, backed by a cookie shared across
 *  tatsneaker.vn's subdomains instead of localStorage — see cart-storage.ts,
 *  the one piece of client state that has to follow a shopper between the
 *  shoe and clothing storefronts (everything else, e.g. wishlist, stays on
 *  createLocalStore, per-site). */
export function createCookieStore<T>(cookieName: string, eventName: string, empty: T) {
  let cachedRaw: string | null | undefined;
  let cachedSnapshot: T = empty;

  function getSnapshot(): T {
    const raw = readCookie(cookieName);
    if (raw === cachedRaw) return cachedSnapshot;
    cachedRaw = raw;
    try {
      cachedSnapshot = raw ? (JSON.parse(raw) as T) : empty;
    } catch {
      cachedSnapshot = empty;
    }
    return cachedSnapshot;
  }

  function getServerSnapshot(): T {
    return empty;
  }

  function subscribe(callback: () => void): () => void {
    window.addEventListener(eventName, callback);
    return () => window.removeEventListener(eventName, callback);
  }

  function read(): T {
    if (typeof window === "undefined") return empty;
    return getSnapshot();
  }

  function write(value: T) {
    const domain = cookieDomain();
    const maxAge = 60 * 60 * 24 * 30; // 30 days, matches the attribution cookie's lifetime
    document.cookie = [
      `${cookieName}=${encodeURIComponent(JSON.stringify(value))}`,
      "path=/",
      `max-age=${maxAge}`,
      "samesite=lax",
      ...(domain ? [`domain=${domain}`] : []),
    ].join("; ");
    window.dispatchEvent(new Event(eventName));
  }

  return { getSnapshot, getServerSnapshot, subscribe, read, write };
}
