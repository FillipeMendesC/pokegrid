import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

function ok(data) {
  return { ok: true, status: 200, json: async () => data };
}

function pikachu() {
  return {
    id: 25,
    name: "pikachu",
    species: { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon-species/25/" },
    height: 4,
    weight: 60,
    base_experience: 112,
    sprites: { front_default: null, other: { "official-artwork": { front_default: null } } },
    types: [{ slot: 1, type: { name: "electric" } }],
    abilities: [],
    stats: [
      ["hp", 35], ["attack", 55], ["defense", 40],
      ["special-attack", 50], ["special-defense", 50], ["speed", 90]
    ].map(([name, base_stat]) => ({ base_stat, stat: { name } })),
    moves: []
  };
}

function move(name, type, damageClass) {
  return {
    id: name === "thunderbolt" ? 85 : 98,
    name,
    accuracy: 100,
    power: name === "thunderbolt" ? 90 : 40,
    pp: 15,
    priority: 0,
    type: { name: type },
    damage_class: { name: damageClass },
    generation: { name: "generation-i" },
    flavor_text_entries: []
  };
}

test("selected moves calculate actual offensive coverage and STAB", async () => {
  const cacheDir = await mkdtemp(path.join(os.tmpdir(), "pokegrid-moves-"));
  const originalFetch = globalThis.fetch;
  process.env.POKEGRID_CACHE_DIR = cacheDir;

  globalThis.fetch = async (url) => {
    const value = String(url);
    if (value.endsWith("/pokemon/pikachu")) return ok(pikachu());
    if (value.endsWith("/move/thunderbolt")) return ok(move("thunderbolt", "electric", "special"));
    if (value.endsWith("/move/quick-attack")) return ok(move("quick-attack", "normal", "physical"));
    throw new Error("Unexpected URL: " + value);
  };

  try {
    const module = await import(`../src/pokeapi.mjs?move-test=${Date.now()}`);
    const result = await module.analyzeSelectedMoves([
      { name: "pikachu", moves: ["thunderbolt", "quick-attack"] }
    ]);

    assert.equal(result.attackingMoves, 2);
    assert.equal(result.stabMoves, 1);
    assert.equal(result.classes.special, 1);
    assert.equal(result.classes.physical, 1);
    assert.ok(result.coveredTypes.includes("water"));
    assert.ok(result.coveredTypes.includes("flying"));
    assert.equal(result.coverage.water, 1);
    assert.equal(result.coverage.flying, 1);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.POKEGRID_CACHE_DIR;
    await rm(cacheDir, { recursive: true, force: true });
  }
});
