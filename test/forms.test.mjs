import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

function ok(data) {
  return { ok: true, status: 200, json: async () => data };
}

function pokemonPayload(name = "charizard-mega-x") {
  return {
    id: 10034,
    name,
    species: { name: "charizard", url: "https://pokeapi.co/api/v2/pokemon-species/6/" },
    height: 17,
    weight: 1105,
    base_experience: 285,
    sprites: { front_default: "sprite.png", other: { "official-artwork": { front_default: "art.png" } } },
    types: [
      { slot: 1, type: { name: "fire" } },
      { slot: 2, type: { name: "dragon" } }
    ],
    abilities: [{ is_hidden: false, ability: { name: "tough-claws" } }],
    stats: [
      ["hp", 78], ["attack", 130], ["defense", 111],
      ["special-attack", 130], ["special-defense", 85], ["speed", 100]
    ].map(([name, base_stat]) => ({ base_stat, stat: { name } })),
    moves: [{ move: { name: "flare-blitz" } }, { move: { name: "dragon-claw" } }]
  };
}

test("special forms resolve species through pokemon.species instead of the form id", async () => {
  const cacheDir = await mkdtemp(path.join(os.tmpdir(), "pokegrid-form-"));
  const originalFetch = globalThis.fetch;
  process.env.POKEGRID_CACHE_DIR = cacheDir;

  globalThis.fetch = async (url) => {
    const value = String(url);
    if (value.endsWith("/pokemon/charizard-mega-x")) return ok(pokemonPayload());
    if (value.endsWith("/pokemon-species/charizard")) {
      return ok({
        name: "charizard",
        evolution_chain: null,
        genera: [
          { genus: "Flame Pokémon", language: { name: "en" } },
          { genus: "Pokémon Chama", language: { name: "pt-br" } }
        ],
        flavor_text_entries: [
          { flavor_text: "Mega form field note.", language: { name: "en" } },
          { flavor_text: "Nota de campo da Mega forma.", language: { name: "pt-br" } }
        ],
        varieties: [
          { is_default: true, pokemon: { name: "charizard", url: "https://pokeapi.co/api/v2/pokemon/6/" } },
          { is_default: false, pokemon: { name: "charizard-mega-x", url: "https://pokeapi.co/api/v2/pokemon/10034/" } }
        ],
        color: { name: "red" },
        habitat: { name: "mountain" },
        generation: { name: "generation-i" },
        growth_rate: { name: "medium-slow" },
        capture_rate: 45,
        base_happiness: 50,
        egg_groups: [{ name: "monster" }, { name: "dragon" }],
        is_legendary: false,
        is_mythical: false
      });
    }
    throw new Error("Unexpected URL: " + value);
  };

  try {
    const module = await import(`../src/pokeapi.mjs?form-test=${Date.now()}`);
    const detail = await module.getPokemonDetail("charizard-mega-x");
    assert.equal(detail.name, "charizard-mega-x");
    assert.equal(detail.species.name, "charizard");
    assert.equal(detail.species.localized["pt-BR"].flavor, "Nota de campo da Mega forma.");
    assert.ok(detail.varieties.some((item) => item.name === "charizard-mega-x"));
    assert.deepEqual(detail.availableMoves, ["dragon-claw", "flare-blitz"]);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.POKEGRID_CACHE_DIR;
    await rm(cacheDir, { recursive: true, force: true });
  }
});

test("search accepts natural token order for Mega forms", async () => {
  const cacheDir = await mkdtemp(path.join(os.tmpdir(), "pokegrid-search-"));
  const originalFetch = globalThis.fetch;
  process.env.POKEGRID_CACHE_DIR = cacheDir;

  globalThis.fetch = async (url) => {
    const value = String(url);
    if (value.includes("/pokemon?limit=2000&offset=0")) {
      return ok({
        results: [
          { name: "charizard", url: "https://pokeapi.co/api/v2/pokemon/6/" },
          { name: "charizard-mega-x", url: "https://pokeapi.co/api/v2/pokemon/10034/" },
          { name: "charizard-mega-y", url: "https://pokeapi.co/api/v2/pokemon/10035/" }
        ]
      });
    }
    if (value.endsWith("/pokemon/charizard-mega-x")) return ok(pokemonPayload("charizard-mega-x"));
    if (value.endsWith("/pokemon/charizard-mega-y")) return ok({ ...pokemonPayload("charizard-mega-y"), id: 10035 });
    throw new Error("Unexpected URL: " + value);
  };

  try {
    const module = await import(`../src/pokeapi.mjs?search-test=${Date.now()}`);
    const results = await module.searchPokemon("mega charizard", { limit: 10 });
    assert.deepEqual(results.map((item) => item.name), ["charizard-mega-x", "charizard-mega-y"]);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.POKEGRID_CACHE_DIR;
    await rm(cacheDir, { recursive: true, force: true });
  }
});
