import test from "node:test";
import assert from "node:assert/strict";
import { TTLCache } from "../src/cache.mjs";
import { analyzeTeam, typeMultiplier } from "../src/team-analysis.mjs";
import { displayName } from "../src/pokeapi.mjs";

test("typeMultiplier handles dual-type weaknesses and immunities", () => {
  assert.equal(typeMultiplier("ice", ["dragon", "flying"]), 4);
  assert.equal(typeMultiplier("electric", ["water", "ground"]), 0);
  assert.equal(typeMultiplier("fire", ["grass", "poison"]), 2);
});

test("team analysis identifies a stacked weakness", () => {
  const team = [
    { types: ["fire", "flying"], stats: { hp: 78, attack: 84, defense: 78, "special-attack": 109, "special-defense": 85, speed: 100 } },
    { types: ["bug", "flying"], stats: { hp: 60, attack: 45, defense: 50, "special-attack": 90, "special-defense": 80, speed: 70 } },
    { types: ["ice", "flying"], stats: { hp: 90, attack: 85, defense: 100, "special-attack": 95, "special-defense": 125, speed: 85 } }
  ];

  const result = analyzeTeam(team);
  assert.equal(result.teamSize, 3);
  assert.ok(result.sharedWeaknesses.some((entry) => entry.type === "rock" && entry.count === 3));
  assert.equal(result.avgStats.find((stat) => stat.name === "hp")?.value, 76);
});

test("displayName converts API slugs", () => {
  assert.equal(displayName("mr-mime"), "Mr Mime");
  assert.equal(displayName("special-attack"), "Special Attack");
});

test("TTLCache evicts least recently used entry when full", () => {
  const cache = new TTLCache({ ttlMs: 5000, maxEntries: 2 });
  cache.set("a", 1);
  cache.set("b", 2);
  assert.equal(cache.get("a"), 1);
  cache.set("c", 3);
  assert.equal(cache.get("b"), undefined);
  assert.equal(cache.get("a"), 1);
  assert.equal(cache.get("c"), 3);
});
