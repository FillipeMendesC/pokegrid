export class TTLCache {
  #entries = new Map();

  constructor({ ttlMs = 15 * 60 * 1000, maxEntries = 500 } = {}) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  get(key) {
    const entry = this.#entries.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.#entries.delete(key);
      return undefined;
    }

    // Refresh insertion order so frequently used entries survive eviction.
    this.#entries.delete(key);
    this.#entries.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs = this.ttlMs) {
    if (this.#entries.has(key)) this.#entries.delete(key);
    this.#entries.set(key, { value, expiresAt: Date.now() + ttlMs });

    while (this.#entries.size > this.maxEntries) {
      const oldestKey = this.#entries.keys().next().value;
      this.#entries.delete(oldestKey);
    }

    return value;
  }

  clear() {
    this.#entries.clear();
  }

  get size() {
    return this.#entries.size;
  }
}
