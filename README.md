# POKÉGRID — Field Research System

## Download

**Windows — no VS Code, Node.js or npm required**

[Download Portable for Windows](https://github.com/MatheusCamacho/pokegrid/releases/latest/download/POKEGRID-Portable-1.2.0-x64.exe) · [Download Windows Installer](https://github.com/MatheusCamacho/pokegrid/releases/latest/download/POKEGRID-Setup-1.2.0-x64.exe) · [Download Linux AppImage](https://github.com/MatheusCamacho/pokegrid/releases/latest/download/POKEGRID-1.2.0-x86_64.AppImage)

If you downloaded the repository through **Code → Download ZIP**, open `DOWNLOAD-WINDOWS.url` to jump straight to the current Windows Portable build.

**Project by Matheus Camacho. AI was used as a support tool during development.**

POKÉGRID is a desktop Pokémon research interface focused on species exploration, comparison and team composition. It combines a deliberately editorial interface with a small native Node.js service and a deterministic type-analysis engine.

The project avoids a frontend framework on purpose. The UI, routing, API boundary, cache and analysis model are built with browser and Node.js platform APIs; Electron provides the distributable desktop shell.

## Highlights

- Complete Pokémon index powered by PokéAPI
- Search by species name or National Pokédex number
- Individual specimen sheets with stats, abilities, species metadata and evolution data
- Team Lab for up to six Pokémon
- Defensive pressure matrix across all 18 types
- Shared weakness, immunity and native STAB coverage analysis
- Side-by-side comparison for up to three Pokémon
- Local persistence for Team Lab and comparison selections
- Memory cache plus persistent disk cache with stale offline fallback
- Local API bound to `127.0.0.1` on an ephemeral port in the desktop build
- Electron renderer with Node integration disabled, context isolation and sandbox enabled
- Windows installer, Windows portable build and Linux AppImage
- GitHub Actions validation and release pipelines

## Desktop use

End users do **not** need VS Code, Node.js or npm. Download a packaged build from the repository Releases page and open it normally.

Windows artifacts:

```text
POKEGRID-Setup-1.1.0-x64.exe
POKEGRID-Portable-1.1.0-x64.exe
```

Linux artifact:

```text
POKEGRID-1.1.0-x64.AppImage
```

The application needs internet for data that has never been loaded before. Previously cached PokéAPI responses remain available as a stale fallback for up to 30 days when the upstream service or connection is unavailable.

## Development

Requires Node.js 20.10 or newer.

```bash
npm install
npm start
```

Open `http://localhost:3000` for the browser version.

Run the desktop shell during development:

```bash
npm run desktop
```

## Validate

```bash
npm run check
npm test
```

## Package locally

Windows packaging is intended to run on Windows:

```bash
npm run dist:win
```

Linux:

```bash
npm run dist:linux
```

Build output is written to `release/`.

## Automated builds

`.github/workflows/build.yml` validates the project and produces downloadable Windows and Linux build artifacts on pushes and pull requests to `main`.

Pushing a version tag such as:

```bash
git tag v1.1.0
git push origin v1.1.0
```

runs `.github/workflows/release.yml`, builds the desktop applications on their native GitHub runners and creates a GitHub Release containing the installer, portable executable and AppImage.

## Structure

```text
pokegrid/
├── .github/workflows/
├── assets/
├── desktop/
│   └── main.mjs
├── docs/
├── public/
├── src/
│   ├── cache.mjs
│   ├── disk-cache.mjs
│   ├── pokeapi.mjs
│   ├── server.mjs
│   └── team-analysis.mjs
├── test/
├── electron-builder.yml
├── LICENSE
└── package.json
```

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for request flow, desktop isolation, caching strategy and analysis-model notes.

## Analysis model

The Team Lab composition index is a project heuristic, not a competitive Pokémon ranking. It considers native type diversity, shared defensive weaknesses and super-effective STAB coverage. The complete pressure matrix is shown alongside it so the underlying data remains inspectable.

## Data and trademarks

Pokémon data is provided by [PokéAPI](https://pokeapi.co/). Pokémon and Pokémon character names are trademarks of Nintendo. This is a non-commercial fan project and is not affiliated with Nintendo, Game Freak or The Pokémon Company.

The POKÉGRID source code itself is released under the MIT License.
