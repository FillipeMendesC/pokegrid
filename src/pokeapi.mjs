import path from "node:path";
import { TTLCache } from "./cache.mjs";
import { DiskJsonCache } from "./disk-cache.mjs";

const API = "https://pokeapi.co/api/v2";
const DEFAULT_TTL_MS = 60 * 60 * 1000;
const cache = new TTLCache({ ttlMs: DEFAULT_TTL_MS, maxEntries: 1200 });
const diskCache = new DiskJsonCache({
  directory: process.env.POKEGRID_CACHE_DIR?.trim() || path.resolve(process.cwd(), ".pokegrid-cache"),
  staleMs: 30 * 24 * 60 * 60 * 1000,
  maxEntries: 1600
});
const cacheMetrics = { memoryHits: 0, networkHits: 0, staleFallbacks: 0 };

function cleanText(value = "") {
  return value.replace(/[\n\f\r]+/g, " ").replace(/\s+/g, " ").trim();
}

export function displayName(value = "") {
  return value
    .split("-")
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(" ");
}

async function fetchJson(url, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const cached = cache.get(url);
  if (cached !== undefined) {
    cacheMetrics.memoryHits += 1;
    return cached;
  }

  const persisted = await diskCache.get(url);
  if (persisted !== undefined) {
    cache.set(url, persisted, ttlMs);
    return persisted;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Pokegrid-Portfolio/1.1"
      },
      signal: AbortSignal.timeout(9000)
    });

    if (!response.ok) {
      const error = new Error(`PokéAPI returned ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    cacheMetrics.networkHits += 1;
    cache.set(url, data, ttlMs);
    await diskCache.set(url, data, ttlMs);
    return data;
  } catch (error) {
    const stale = await diskCache.get(url, { allowStale: true });
    if (stale !== undefined) {
      cacheMetrics.staleFallbacks += 1;
      cache.set(url, stale, Math.min(ttlMs, 10 * 60 * 1000));
      return stale;
    }
    throw error;
  }
}

function officialArtwork(pokemon) {
  return pokemon.sprites?.other?.["official-artwork"]?.front_default
    ?? pokemon.sprites?.other?.home?.front_default
    ?? pokemon.sprites?.front_default
    ?? null;
}

export function normalizePokemon(pokemon) {
  return {
    id: pokemon.id,
    name: pokemon.name,
    displayName: displayName(pokemon.name),
    height: pokemon.height / 10,
    weight: pokemon.weight / 10,
    baseExperience: pokemon.base_experience,
    image: officialArtwork(pokemon),
    sprite: pokemon.sprites?.front_default ?? null,
    types: [...pokemon.types].sort((a, b) => a.slot - b.slot).map((entry) => entry.type.name),
    abilities: [...pokemon.abilities].sort((a, b) => Number(a.is_hidden) - Number(b.is_hidden)).map((entry) => ({
      name: entry.ability.name,
      displayName: displayName(entry.ability.name),
      hidden: entry.is_hidden
    })),
    stats: Object.fromEntries(pokemon.stats.map((entry) => [entry.stat.name, entry.base_stat])),
    totalStats: pokemon.stats.reduce((sum, entry) => sum + entry.base_stat, 0),
    movesCount: pokemon.moves?.length ?? 0
  };
}

function flattenEvolutionChain(node, stage = 0, result = []) {
  result.push({
    name: node.species.name,
    displayName: displayName(node.species.name),
    stage,
    conditions: (node.evolution_details ?? []).map((detail) => ({
      trigger: detail.trigger?.name ?? null,
      minLevel: detail.min_level ?? null,
      item: detail.item?.name ?? null,
      heldItem: detail.held_item?.name ?? null,
      timeOfDay: detail.time_of_day || null,
      minHappiness: detail.min_happiness ?? null,
      location: detail.location?.name ?? null
    }))
  });

  for (const child of node.evolves_to ?? []) flattenEvolutionChain(child, stage + 1, result);
  return result;
}

function translatedField(entries, language, field) {
  return entries.find((entry) => entry.language?.name === language)?.[field]
    ?? entries.find((entry) => entry.language?.name === "en")?.[field]
    ?? entries[0]?.[field]
    ?? null;
}

export async function getPokemon(idOrName) {
  const key = encodeURIComponent(String(idOrName).toLowerCase().trim());
  const pokemon = await fetchJson(`${API}/pokemon/${key}`);
  return normalizePokemon(pokemon);
}

export async function getPokemonDetail(idOrName) {
  const pokemon = await getPokemon(idOrName);
  const species = await fetchJson(`${API}/pokemon-species/${pokemon.id}`);
  const evolution = species.evolution_chain?.url ? await fetchJson(species.evolution_chain.url) : null;

  const evolutionEntries = evolution ? flattenEvolutionChain(evolution.chain) : [];
  const evolutionWithIds = evolutionEntries.map((entry) => {
    const match = entry.name === pokemon.name
      ? pokemon.id
      : Number(entry.name && species.varieties?.find((v) => v.pokemon?.name === entry.name)?.pokemon?.url?.match(/\/(\d+)\/$/)?.[1]);
    return { ...entry, id: Number.isFinite(match) ? match : null };
  });

  return {
    ...pokemon,
    species: {
      genus: translatedField(species.genera ?? [], "en", "genus"),
      flavor: cleanText(translatedField(species.flavor_text_entries ?? [], "en", "flavor_text") ?? ""),
      color: species.color?.name ?? null,
      habitat: species.habitat?.name ?? null,
      generation: species.generation?.name ?? null,
      growthRate: species.growth_rate?.name ?? null,
      captureRate: species.capture_rate ?? null,
      baseHappiness: species.base_happiness ?? null,
      eggGroups: (species.egg_groups ?? []).map((entry) => entry.name),
      legendary: Boolean(species.is_legendary),
      mythical: Boolean(species.is_mythical)
    },
    evolution: evolutionWithIds
  };
}

export async function listPokemon({ limit = 24, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 60);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const data = await fetchJson(`${API}/pokemon?limit=${safeLimit}&offset=${safeOffset}`, { ttlMs: 30 * 60 * 1000 });

  const items = await Promise.all(
    data.results.map(async (entry) => {
      try {
        return await getPokemon(entry.name);
      } catch {
        return { name: entry.name, displayName: displayName(entry.name), image: null, types: [], stats: {}, totalStats: 0 };
      }
    })
  );

  return {
    count: data.count,
    nextOffset: data.next ? safeOffset + safeLimit : null,
    previousOffset: data.previous ? Math.max(0, safeOffset - safeLimit) : null,
    items
  };
}

export async function searchPokemon(query, { limit = 10 } = {}) {
  const q = String(query ?? "").toLowerCase().trim();
  if (!q) return [];

  if (/^\d+$/.test(q)) {
    try {
      return [await getPokemon(q)];
    } catch (error) {
      if (error?.status === 404) return [];
      throw error;
    }
  }

  const index = await fetchJson(`${API}/pokemon?limit=2000&offset=0`, { ttlMs: 6 * 60 * 60 * 1000 });
  const ranked = index.results
    .map((entry) => ({
      name: entry.name,
      score: entry.name === q ? 0 : entry.name.startsWith(q) ? 1 : entry.name.includes(q) ? 2 : 99
    }))
    .filter((entry) => entry.score < 99)
    .sort((a, b) => a.score - b.score || a.name.length - b.name.length || a.name.localeCompare(b.name))
    .slice(0, Math.min(Math.max(Number(limit) || 10, 1), 20));

  return Promise.all(ranked.map((entry) => getPokemon(entry.name)));
}

export function cacheStats() {
  return {
    entries: cache.size,
    ...cacheMetrics,
    persistent: diskCache.stats()
  };
}
