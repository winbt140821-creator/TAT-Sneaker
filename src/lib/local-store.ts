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
