import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeTeam } from "./team-analysis.mjs";
import { analyzeSelectedMoves, cacheStats, filterPokemon, getMove, getPokemon, getPokemonDetail, listGeneration, listGenerations, listPokemon, searchPokemon } from "./pokeapi.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "../public");
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer"
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers
  });
  res.end(JSON.stringify(body));
}

function errorResponse(res, error) {
  const rawStatus = Number(error?.status);
  const status = [400, 404, 413].includes(rawStatus) ? rawStatus : 502;
  const messages = {
    400: "Invalid request.",
    404: "Pokémon or field data not found.",
    413: "Payload too large.",
    502: "Upstream data is temporarily unavailable."
  };
  sendJson(res, status, {
    error: messages[status],
    detail: process.env.NODE_ENV === "development" ? String(error?.message ?? error) : undefined
  });
}

async function readBody(req, maxBytes = 64_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      const error = new Error("Payload too large");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return null;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/health" && req.method === "GET") {
    return sendJson(res, 200, { ok: true, cache: cacheStats(), timestamp: new Date().toISOString() });
  }

  if (url.pathname === "/api/pokemon" && req.method === "GET") {
    try {
      const result = await listPokemon({
        limit: url.searchParams.get("limit"),
        offset: url.searchParams.get("offset")
      });
      return sendJson(res, 200, result, { "Cache-Control": "public, max-age=120, stale-while-revalidate=600" });
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  if (url.pathname === "/api/search" && req.method === "GET") {
    try {
      const items = await searchPokemon(url.searchParams.get("q"), { limit: url.searchParams.get("limit") });
      return sendJson(res, 200, { items });
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  if (url.pathname === "/api/generations" && req.method === "GET") {
    try {
      return sendJson(res, 200, { items: await listGenerations() }, { "Cache-Control": "public, max-age=3600" });
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  const generationMatch = url.pathname.match(/^\/api\/generation\/([^/]+)$/);
  if (generationMatch && req.method === "GET") {
    try {
      const result = await listGeneration(decodeURIComponent(generationMatch[1]), {
        limit: url.searchParams.get("limit"),
        offset: url.searchParams.get("offset")
      });
      return sendJson(res, 200, result, { "Cache-Control": "public, max-age=600, stale-while-revalidate=3600" });
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  if (url.pathname === "/api/filter" && req.method === "GET") {
    try {
      const result = await filterPokemon({
        type: url.searchParams.get("type"),
        generation: url.searchParams.get("generation"),
        limit: url.searchParams.get("limit"),
        offset: url.searchParams.get("offset")
      });
      return sendJson(res, 200, result, { "Cache-Control": "public, max-age=300, stale-while-revalidate=1800" });
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  const moveMatch = url.pathname.match(/^\/api\/move\/([^/]+)$/);
  if (moveMatch && req.method === "GET") {
    try {
      return sendJson(res, 200, await getMove(decodeURIComponent(moveMatch[1])), { "Cache-Control": "public, max-age=3600" });
    } catch (error) {
      return errorResponse(res, error);
    }
  }


  const pokemonMatch = url.pathname.match(/^\/api\/pokemon\/([^/]+)$/);
  if (pokemonMatch && req.method === "GET") {
    try {
      const data = await getPokemonDetail(decodeURIComponent(pokemonMatch[1]));
      return sendJson(res, 200, data, { "Cache-Control": "public, max-age=300, stale-while-revalidate=1800" });
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  if (url.pathname === "/api/team/analyze" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const members = Array.isArray(body?.pokemon) ? body.pokemon.slice(0, 6) : [];
      const unique = [...new Set(members.map((item) => String(item).toLowerCase().trim()).filter(Boolean))];
      const pokemon = await Promise.all(unique.map((item) => getPokemon(item)));
      return sendJson(res, 200, { pokemon, analysis: analyzeTeam(pokemon) });
    } catch (error) {
      if (error instanceof SyntaxError) return sendJson(res, 400, { error: "Invalid JSON payload." });
      if (error?.status === 413) return sendJson(res, 413, { error: "Payload too large." });
      return errorResponse(res, error);
    }
  }

  if (url.pathname === "/api/team/moves" && req.method === "POST") {
    try {
      const body = await readBody(req, 128_000);
      const members = Array.isArray(body?.members) ? body.members : [];
      return sendJson(res, 200, { analysis: await analyzeSelectedMoves(members) });
    } catch (error) {
      if (error instanceof SyntaxError) return sendJson(res, 400, { error: "Invalid JSON payload." });
      return errorResponse(res, error);
    }
  }


  return sendJson(res, 404, { error: "API route not found." });
}

async function serveStatic(res, pathname, method = "GET") {
  if (method !== "GET" && method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD", ...SECURITY_HEADERS });
    return res.end();
  }

  const requested = pathname === "/" ? "/index.html" : pathname;
  let decoded;
  try {
    decoded = decodeURIComponent(requested);
  } catch {
    res.writeHead(400, SECURITY_HEADERS);
    return res.end("Bad request");
  }

  const safePath = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.resolve(PUBLIC_DIR, `.${safePath}`);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) filePath = path.join(filePath, "index.html");
    const data = await readFile(filePath);
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      "Content-Type": MIME[path.extname(filePath)] ?? "application/octet-stream",
      "Cache-Control": path.extname(filePath) === ".html" ? "no-cache" : "public, max-age=86400"
    });
    res.end(method === "HEAD" ? undefined : data);
  } catch {
    try {
      const data = await readFile(path.join(PUBLIC_DIR, "index.html"));
      res.writeHead(200, { ...SECURITY_HEADERS, "Content-Type": MIME[".html"], "Cache-Control": "no-cache" });
      res.end(method === "HEAD" ? undefined : data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  }
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    if (url.pathname.startsWith("/api/")) return handleApi(req, res, url);
    return serveStatic(res, url.pathname, req.method ?? "GET");
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createServer().listen(PORT, HOST, () => {
    console.log(`POKÉGRID running at http://localhost:${PORT}`);
  });
}
