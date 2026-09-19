# CHANGELOG

## 1.3.1

- Fixed interface audio reliability in Electron/Chromium by explicitly unlocking the Web Audio context on user input.
- Reworked UI sounds with clearer short note patterns and a more audible gain envelope.
- Added a TEST SOUND control to the About/System page.

## 1.3.0

- Fixed Mega, Gigantamax and alternate-form detail resolution.
- Added natural form search such as `mega charizard`.
- Added type and generation filters to the field index.
- Added a dedicated Generations archive.
- Added persistent Favorites.
- Added saved Team Lab lineups.
- Added Move Lab with selected-move coverage, STAB and damage-class analysis.
- Added optional interface sounds.
- Added About/System page with author links and runtime information.
- Added GitHub Release update channel and packaged desktop update checks.
- Added localized species text when PokéAPI provides pt-BR entries.
- Expanded automated tests for special forms and natural form search.
- Rebuilt the repository landing page and download flow.

## 1.2.0

- Added English / Português (Brasil) interface switching with saved preference.
- Added Matheus Camacho author credit plus GitHub and LinkedIn links in the app.
- Added transparent AI-support disclosure.
- Moved direct desktop downloads to the top of the README.
- Added a Windows download shortcut to the repository archive.
- Prepared the repository for easier binary distribution.

## 1.1.0 — Desktop release

- Added Electron desktop shell with isolated, sandboxed renderer
- Added Windows NSIS installer target
- Added Windows portable executable target
- Added Linux AppImage target
- Added persistent disk cache with stale offline fallback
- Bound the desktop HTTP service to localhost on an ephemeral port
- Added application security headers
- Added desktop application icons
- Added GitHub Actions build and tagged-release pipelines
- Added server and persistent-cache tests

## 1.0.0 — Initial web release

- Added Pokémon field index and search
- Added specimen detail views
- Added Team Lab and type-pressure analysis
- Added comparison mode
- Added in-memory PokéAPI cache
