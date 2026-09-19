# Architecture notes

## Product shape

POKÉGRID ships in two forms from the same codebase:

1. a browser application served by the Node.js HTTP service;
2. a desktop application where Electron owns the lifecycle of that same local service.

The frontend remains independent from PokéAPI endpoint shapes and from Electron APIs.

## Desktop request flow

```text
Electron main process
  │
  ├── chooses 127.0.0.1:<ephemeral-port>
  ├── starts the local Node HTTP server
  └── opens BrowserWindow
          │
          ├── static files ──────────────────────┐
          │                                      │
          └── /api/*                             │
               │                                 │
               ▼                                 │
        Node HTTP server                         │
          │                                      │
          ├── Team analysis engine               │
          │                                      │
          └── PokéAPI client                     │
               ├── memory TTL cache              │
               ├── persistent JSON cache         │
               └── PokéAPI                       │
                                                 │
        public/ ◄────────────────────────────────┘
```

The desktop server is never bound to the LAN. It listens only on `127.0.0.1` and uses an operating-system-selected ephemeral port.

## Electron isolation

The renderer receives no Node.js or filesystem API. `BrowserWindow` uses:

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- `webSecurity: true`

Unexpected navigation is blocked. Normal external `http` and `https` links are handed to the operating system browser instead of being opened inside the renderer.

A minimal sandboxed preload bridge exposes only desktop metadata and updater actions. It does not expose Node.js, the filesystem or arbitrary IPC to the renderer.

## Frontend

The frontend is a hash-routed single-page application. It owns durable browser state for:

- Team Lab members;
- saved teams and selected moves;
- favorites;
- comparison selections;
- language and sound preferences.

Those selections use `localStorage`, which Electron stores inside the application's user-data directory in packaged builds.

## API boundary

`src/pokeapi.mjs` normalizes remote resources into a compact internal shape. The UI therefore does not depend on PokéAPI response structure.

Application endpoints:

- `GET /api/pokemon?limit=&offset=` — paginated field index
- `GET /api/pokemon/:idOrName` — complete specimen sheet
- `GET /api/search?q=` — name/id/form search
- `GET /api/filter?type=&generation=` — filtered specimen index
- `GET /api/generations` — generation metadata
- `GET /api/generation/:id` — generation species index
- `GET /api/move/:name` — normalized move data
- `POST /api/team/analyze` — team resolution and composition analysis
- `POST /api/team/moves` — selected-move coverage analysis
- `GET /api/health` — process and cache telemetry

## Cache model

There are two cache layers.

### Memory

`TTLCache` provides fast in-process reuse with access-order eviction. Pokémon resources use a one-hour default TTL, index pages use a shorter TTL and the broad search index uses a longer TTL.

### Persistent disk cache

`DiskJsonCache` stores upstream JSON by SHA-256 key. Writes are atomic: content is written to a temporary file and renamed into place. The cache keeps a fresh window and a separate stale window.

Normal behavior is:

1. memory cache;
2. fresh disk cache;
3. network request;
4. stale disk fallback only if the network/upstream request fails.

The stale window is 30 days. This means previously visited data can still open when PokéAPI is temporarily unavailable, without treating old data as fresh during normal online use.

Desktop cache files live under Electron's platform-specific `userData/cache` directory. Old entries are pruned to a bounded count.

## Team analysis

The analysis engine is deterministic and contains the 18-type effectiveness matrix. It calculates:

- defensive multiplier for every attacking type against every member;
- stacked weaknesses;
- resistances and immunities;
- native STAB super-effective coverage;
- repeated type concentration;
- average base-stat profile;
- a compact composition index.

The composition index is deliberately presented as a project heuristic. The pressure matrix remains visible so the user can inspect the source values instead of relying on a black-box score.

## Packaging and releases

`electron-builder` produces:

- Windows NSIS installer;
- Windows portable executable;
- Linux AppImage.

GitHub Actions uses native Windows and Linux runners. A regular push validates and builds artifacts; a version tag (`v*`) creates a GitHub Release and attaches the packaged applications plus update metadata.

The installed Windows build uses `electron-updater` with the GitHub Releases provider. Windows NSIS builds can download a new version and install it on app exit. Portable Windows builds are treated separately: they check the latest release but remain manually replaceable because Portable is not an auto-updatable Windows target.

## Failure behavior

PokéAPI calls use an explicit timeout. Upstream failures first try the stale persistent cache, then resolve to a stable JSON error shape if no usable cached response exists. The frontend contains explicit loading, empty and error states.
