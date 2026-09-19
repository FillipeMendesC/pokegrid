import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { DiskJsonCache } from "../src/disk-cache.mjs";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("DiskJsonCache returns fresh data and permits stale data only as fallback", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "pokegrid-cache-test-"));
  const cache = new DiskJsonCache({ directory, staleMs: 1000, maxEntries: 5 });

  try {
    await cache.set("pokemon:25", { id: 25, name: "pikachu" }, 40);
    assert.deepEqual(await cache.get("pokemon:25"), { id: 25, name: "pikachu" });

    await sleep(70);
    assert.equal(await cache.get("pokemon:25"), undefined);
    assert.deepEqual(await cache.get("pokemon:25", { allowStale: true }), { id: 25, name: "pikachu" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("DiskJsonCache keeps the most recent bounded set", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "pokegrid-prune-test-"));
  const cache = new DiskJsonCache({ directory, staleMs: 1000, maxEntries: 2 });

  try {
    await cache.set("a", { value: "a" }, 1000);
    await sleep(5);
    await cache.set("b", { value: "b" }, 1000);
    await sleep(5);
    await cache.set("c", { value: "c" }, 1000);
    await cache.prune();

    const values = await Promise.all(["a", "b", "c"].map((key) => cache.get(key)));
    assert.equal(values.filter(Boolean).length, 2);
    assert.deepEqual(values[2], { value: "c" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
