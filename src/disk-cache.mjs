import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

function filenameFor(key) {
  return `${createHash("sha256").update(key).digest("hex")}.json`;
}

function isValidRecord(record, key) {
  return record
    && record.version === 1
    && record.key === key
    && typeof record.freshUntil === "number"
    && typeof record.staleUntil === "number"
    && Object.hasOwn(record, "value");
}

export class DiskJsonCache {
  constructor({ directory, staleMs = 30 * 24 * 60 * 60 * 1000, maxEntries = 1600 } = {}) {
    this.directory = directory || null;
    this.staleMs = staleMs;
    this.maxEntries = maxEntries;
    this.metrics = { freshHits: 0, staleHits: 0, writes: 0, errors: 0 };
    this.pruneScheduled = false;
  }

  filePath(key) {
    return path.join(this.directory, filenameFor(key));
  }

  async get(key, { allowStale = false } = {}) {
    if (!this.directory) return undefined;

    try {
      const raw = await readFile(this.filePath(key), "utf8");
      const record = JSON.parse(raw);
      if (!isValidRecord(record, key)) return undefined;

      const now = Date.now();
      if (now <= record.freshUntil) {
        this.metrics.freshHits += 1;
        return record.value;
      }

      if (allowStale && now <= record.staleUntil) {
        this.metrics.staleHits += 1;
        return record.value;
      }

      if (now > record.staleUntil) {
        void rm(this.filePath(key), { force: true }).catch(() => {});
      }
      return undefined;
    } catch (error) {
      if (error?.code !== "ENOENT") this.metrics.errors += 1;
      return undefined;
    }
  }

  async set(key, value, ttlMs) {
    if (!this.directory) return value;

    try {
      await mkdir(this.directory, { recursive: true });
      const now = Date.now();
      const target = this.filePath(key);
      const temporary = `${target}.${process.pid}.tmp`;
      const record = {
        version: 1,
        key,
        storedAt: now,
        freshUntil: now + ttlMs,
        staleUntil: now + Math.max(ttlMs, this.staleMs),
        value
      };

      await writeFile(temporary, JSON.stringify(record), "utf8");
      try {
        await rename(temporary, target);
      } catch (error) {
        if (error?.code !== "EEXIST" && error?.code !== "EPERM") throw error;
        await rm(target, { force: true });
        await rename(temporary, target);
      }
      this.metrics.writes += 1;
      this.schedulePrune();
    } catch {
      this.metrics.errors += 1;
    }

    return value;
  }

  schedulePrune() {
    if (this.pruneScheduled || !this.directory) return;
    this.pruneScheduled = true;
    const timer = setTimeout(() => {
      this.pruneScheduled = false;
      void this.prune();
    }, 2000);
    timer.unref?.();
  }

  async prune() {
    if (!this.directory) return;

    try {
      const names = (await readdir(this.directory)).filter((name) => name.endsWith(".json"));
      const files = await Promise.all(names.map(async (name) => {
        const filePath = path.join(this.directory, name);
        try {
          const fileStat = await stat(filePath);
          return { filePath, mtimeMs: fileStat.mtimeMs };
        } catch {
          return null;
        }
      }));

      const existing = files.filter(Boolean).sort((a, b) => b.mtimeMs - a.mtimeMs);
      await Promise.all(existing.slice(this.maxEntries).map((entry) => rm(entry.filePath, { force: true })));
    } catch {
      this.metrics.errors += 1;
    }
  }

  stats() {
    return { enabled: Boolean(this.directory), ...this.metrics };
  }
}
