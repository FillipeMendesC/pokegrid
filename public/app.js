if (navigator.userAgent.includes("Electron")) {
  document.documentElement.classList.add("desktop-shell");
  if (navigator.userAgent.includes("Windows")) document.documentElement.classList.add("desktop-windows");
}

const app = document.querySelector("#app");
const dialog = document.querySelector("#search-dialog");
const searchInput = document.querySelector("#global-search");
const searchResults = document.querySelector("#search-results");
const toastEl = document.querySelector("#toast");
const teamCount = document.querySelector("#team-count");
const compareCount = document.querySelector("#compare-count");
const favoriteCount = document.querySelector("#favorite-count");

const LANGUAGE_KEY = "pokegrid:locale";
const sourceText = new WeakMap();
const sourceAttributes = new WeakMap();

const PT_BR = {
  "Index": "Índice",
  "Team Lab": "Lab de Time",
  "Compare": "Comparar",
  "Search index": "Buscar no índice",
  "Primary navigation": "Navegação principal",
  "Open search": "Abrir busca",
  "Change language": "Mudar idioma",
  "POKÉGRID home": "Início do POKÉGRID",
  "POKÉGRID / FIELD RESEARCH SYSTEM": "POKÉGRID / SISTEMA DE PESQUISA DE CAMPO",
  "DATA: POKÉAPI": "DADOS: POKÉAPI",
  "CONCEPT, DIRECTION & PROJECT BY MATHEUS CAMACHO · AI USED AS DEVELOPMENT SUPPORT": "CONCEITO, DIREÇÃO E PROJETO POR MATHEUS CAMACHO · IA UTILIZADA COMO SUPORTE NO DESENVOLVIMENTO",
  "FAN PROJECT · NOT AFFILIATED WITH NINTENDO / GAME FREAK": "PROJETO DE FÃ · SEM AFILIAÇÃO COM NINTENDO / GAME FREAK",
  "SEARCH THE FULL INDEX": "BUSCAR NO ÍNDICE COMPLETO",
  "ESC / CLOSE": "ESC / FECHAR",
  "Type a name. Results resolve against the full PokéAPI Pokémon index.": "Digite um nome. Os resultados são buscados no índice completo de Pokémon da PokéAPI.",
  "FIELD RESEARCH SYSTEM / REV. 01": "SISTEMA DE PESQUISA DE CAMPO / REV. 01",
  "READ THE": "LEIA O",
  "SIGNAL.": "SINAL.",
  "Pokémon stripped back to structure: species data, battle stats, type pressure and team composition in one research interface.": "Pokémon reduzido à estrutura: dados de espécies, atributos de batalha, pressão de tipos e composição de time em uma única interface de pesquisa.",
  "ACTIVE SPECIMEN": "ESPÉCIME ATIVO",
  "TYPE PRESSURE": "PRESSÃO DE TIPO",
  "SPECIES INDEX": "ÍNDICE DE ESPÉCIES",
  "TEAM BALANCE": "EQUILÍBRIO DO TIME",
  "EVOLUTION DATA": "DADOS DE EVOLUÇÃO",
  "BATTLE PROFILE": "PERFIL DE BATALHA",
  "FIELD NOTES": "NOTAS DE CAMPO",
  "02 / SPECIMEN INDEX": "02 / ÍNDICE DE ESPÉCIMES",
  "FIELD INDEX": "ÍNDICE DE CAMPO",
  "Start anywhere. Every entry opens a full specimen sheet; use + to send a Pokémon to Team Lab, or ≠ to stage a comparison.": "Comece por qualquer lugar. Cada entrada abre uma ficha completa; use + para enviar um Pokémon ao Lab de Time ou ≠ para colocá-lo na comparação.",
  "LIVE INDEX": "ÍNDICE AO VIVO",
  "Load next specimens →": "Carregar próximos espécimes →",
  "Reading next batch…": "Lendo próximo lote…",
  "Retry loading specimens": "Tentar carregar novamente",
  "Reading field data": "Lendo dados de campo",
  "Opening specimen index": "Abrindo índice de espécimes",
  "DATA LINK / ERROR": "CONEXÃO DE DADOS / ERRO",
  "Field signal lost.": "Sinal de campo perdido.",
  "Something went wrong.": "Algo deu errado.",
  "No field note available for this specimen.": "Nenhuma nota de campo disponível para este espécime.",
  "Retry": "Tentar novamente",
  "← Return to index": "← Voltar ao índice",
  "Height": "Altura",
  "Weight": "Peso",
  "Base stat total": "Total de atributos base",
  "Known moves": "Golpes conhecidos",
  "Capture rate": "Taxa de captura",
  "Growth": "Crescimento",
  "Habitat": "Habitat",
  "Class": "Classe",
  "Mythical": "Mítico",
  "Legendary": "Lendário",
  "Standard": "Padrão",
  "+ Add to Team Lab": "+ Adicionar ao Lab de Time",
  "≠ Toggle comparison": "≠ Alternar comparação",
  "Add to Team Lab": "Adicionar ao Lab de Time",
  "Toggle compare": "Alternar comparação",
  "ABILITIES": "HABILIDADES",
  "HIDDEN ABILITY": "HABILIDADE OCULTA",
  "ABILITY": "HABILIDADE",
  "EVOLUTION TRACE": "TRILHA DE EVOLUÇÃO",
  "BREEDING / FIELD": "CRIAÇÃO / CAMPO",
  "EGG GROUPS": "GRUPOS DE OVOS",
  "BASE HAPPINESS": "FELICIDADE BASE",
  "No evolution chain registered.": "Nenhuma cadeia de evolução registrada.",
  "Unknown": "Desconhecido",
  "unknown": "desconhecido",
  "BASE FORM": "FORMA BASE",
  "CONDITION VARIES": "CONDIÇÃO VARIÁVEL",
  "SPECIAL CONDITION": "CONDIÇÃO ESPECIAL",
  "REMOVE": "REMOVER",
  "EMPTY": "VAZIO",
  "Running team analysis": "Executando análise do time",
  "03 / COMPOSITION ENGINE": "03 / MOTOR DE COMPOSIÇÃO",
  "TEAM": "TIME",
  "LAB.": "LAB.",
  "MAXIMUM 06 SPECIMENS": "MÁXIMO DE 06 ESPÉCIMES",
  "Read a team as a system: shared weaknesses, resistances, immunities, native type coverage and overall stat shape.": "Leia o time como um sistema: fraquezas compartilhadas, resistências, imunidades, cobertura de tipos nativos e perfil geral de atributos.",
  "+ Search a Pokémon to add": "+ Buscar um Pokémon para adicionar",
  "COMPOSITION INDEX": "ÍNDICE DE COMPOSIÇÃO",
  "/ 100 · PROJECT HEURISTIC": "/ 100 · HEURÍSTICA DO PROJETO",
  "A compact project metric based on native type diversity, shared weaknesses and super-effective STAB coverage. It is not a competitive tier ranking.": "Uma métrica do projeto baseada em diversidade de tipos nativos, fraquezas compartilhadas e cobertura STAB super efetiva. Não é um ranking competitivo.",
  "Add more members to reveal stronger patterns.": "Adicione mais membros para revelar padrões mais claros.",
  "DEFENSIVE PRESSURE MATRIX": "MATRIZ DE PRESSÃO DEFENSIVA",
  "Attack type": "Tipo atacante",
  "Weak": "Fraco",
  "Resist": "Resiste",
  "Immune": "Imune",
  "Neutral": "Neutro",
  "04 / TEAM SHAPE": "04 / PERFIL DO TIME",
  "AVERAGE BASE STATS": "MÉDIA DOS ATRIBUTOS BASE",
  "Useful for reading whether the group leans toward speed, bulk or raw offensive pressure.": "Útil para entender se o grupo tende a velocidade, resistência ou pressão ofensiva bruta.",
  "NO ACTIVE TEAM": "NENHUM TIME ATIVO",
  "Build from the index.": "Monte a partir do índice.",
  "Use the + control on any specimen.": "Use o controle + em qualquer espécime.",
  "Aligning specimens": "Alinhando espécimes",
  "05 / PARALLEL VIEW": "05 / VISÃO PARALELA",
  "COMPARE.": "COMPARE.",
  "UP TO 03 SPECIMENS": "ATÉ 03 ESPÉCIMES",
  "Line up base attributes and body metrics without collapsing them into a single verdict.": "Compare atributos base e medidas corporais sem reduzi-los a um único veredito.",
  "COMPARISON BUFFER EMPTY": "COMPARAÇÃO VAZIA",
  "Choose your subjects.": "Escolha seus espécimes.",
  "Use the ≠ control in the index.": "Use o controle ≠ no índice.",
  "Specimen": "Espécime",
  "Types": "Tipos",
  "Base total": "Total base",
  "Scanning index…": "Varrendo o índice…",
  "OPEN →": "ABRIR →",
  "404 / INDEX MISS": "404 / FORA DO ÍNDICE",
  "Unknown coordinate.": "Coordenada desconhecida.",
  "Return to field index →": "Voltar ao índice de campo →",
  "Attack": "Ataque",
  "Defense": "Defesa",
  "Sp. Attack": "Ataque Esp.",
  "Sp. Defense": "Defesa Esp.",
  "Speed": "Velocidade",
  "IMMUNITY": "IMUNIDADE",
  "DIVERSITY": "DIVERSIDADE",
  "COVERAGE": "COBERTURA",
  "STACKED WEAKNESS": "FRAQUEZA ACUMULADA",
  "TYPE CLUSTER": "CONCENTRAÇÃO DE TIPO",
  "PRESSURE GAP": "LACUNA DE PRESSÃO",
  "medium": "médio",
  "slow": "lento",
  "fast": "rápido",
  "medium-slow": "médio-lento",
  "medium-fast": "médio-rápido",
  "erratic": "irregular",
  "fluctuating": "variável",
  "forest": "floresta",
  "grassland": "campo",
  "mountain": "montanha",
  "cave": "caverna",
  "rough-terrain": "terreno acidentado",
  "urban": "urbano",
  "waters-edge": "margem da água",
  "sea": "mar",
  "rare": "raro",
  "level up": "subir de nível",
  "trade": "troca",
  "use item": "usar item"
};

const TYPE_PT_BR = {
  normal: "normal",
  fire: "fogo",
  water: "água",
  electric: "elétrico",
  grass: "planta",
  ice: "gelo",
  fighting: "lutador",
  poison: "veneno",
  ground: "terrestre",
  flying: "voador",
  psychic: "psíquico",
  bug: "inseto",
  rock: "pedra",
  ghost: "fantasma",
  dragon: "dragão",
  dark: "sombrio",
  steel: "aço",
  fairy: "fada"
};

function readLocale() {
  const locale = localStorage.getItem(LANGUAGE_KEY);
  return locale === "pt-BR" ? "pt-BR" : "en";
}

function typeLabel(type) {
  return state.locale === "pt-BR" ? (TYPE_PT_BR[type] ?? type) : type;
}

function translateBaseText(value = "") {
  if (state.locale !== "pt-BR") return value;

  const raw = String(value);
  const clean = raw.trim();
  if (!clean) return raw;

  let translated = PT_BR[clean] ?? TYPE_PT_BR[clean];

  if (!translated) {
    let match;
    if ((match = clean.match(/^(\d+) API ENTRIES$/))) translated = match[1] + " ENTRADAS DA API";
    else if ((match = clean.match(/^(\d+) DISTINCT TYPES$/))) translated = match[1] + " TIPOS DISTINTOS";
    else if ((match = clean.match(/^SPECIMEN \/ (\d+)$/))) translated = "ESPÉCIME / " + match[1];
    else if ((match = clean.match(/^SPECIMEN #(\d+) \/ (.+)$/))) translated = "ESPÉCIME #" + match[1] + " / " + match[2];
    else if ((match = clean.match(/^SLOT (\d+)$/))) translated = "ESPAÇO " + match[1];
    else if ((match = clean.match(/^STAGE (\d+)$/))) translated = "ESTÁGIO " + match[1];
    else if ((match = clean.match(/^LEVEL (\d+)$/))) translated = "NÍVEL " + match[1];
    else if ((match = clean.match(/^USE (.+)$/))) translated = "USAR " + match[1];
    else if ((match = clean.match(/^HOLD (.+)$/))) translated = "SEGURAR " + match[1];
    else if ((match = clean.match(/^HAPPINESS (\d+)\+$/))) translated = "FELICIDADE " + match[1] + "+";
    else if ((match = clean.match(/^No index matches for “(.+)”\.$/))) translated = "Nenhum resultado no índice para “" + match[1] + "”.";
    else if ((match = clean.match(/^(.+) is already in Team Lab\.$/))) translated = match[1] + " já está no Lab de Time.";
    else if ((match = clean.match(/^(.+) added to Team Lab\.$/))) translated = match[1] + " foi adicionado ao Lab de Time.";
    else if ((match = clean.match(/^(.+) removed from comparison\.$/))) translated = match[1] + " foi removido da comparação.";
    else if ((match = clean.match(/^(.+) added to comparison\.$/))) translated = match[1] + " foi adicionado à comparação.";
    else if ((match = clean.match(/^(\d+) attacking types can be nullified by at least one member\.$/))) translated = match[1] + " tipos de ataque podem ser anulados por pelo menos um membro.";
    else if ((match = clean.match(/^The team carries (\d+) distinct native types\.$/))) translated = "O time possui " + match[1] + " tipos nativos distintos.";
    else if ((match = clean.match(/^Native STAB pressure reaches (\d+)\/(\d+) defending types super-effectively\.$/))) translated = "A pressão STAB nativa atinge " + match[1] + "/" + match[2] + " tipos defensores de forma super efetiva.";
    else if ((match = clean.match(/^(\d+)\/(\d+) members are weak to ([a-z-]+)\.$/))) translated = match[1] + "/" + match[2] + " membros são fracos contra " + typeLabel(match[3]) + ".";
    else if ((match = clean.match(/^(\d+) members share ([a-z-]+)\.$/))) translated = match[1] + " membros compartilham o tipo " + typeLabel(match[2]) + ".";
    else if ((match = clean.match(/^(\d+) defending types are not hit super-effectively by the team's native types\.$/))) translated = match[1] + " tipos defensores não são atingidos de forma super efetiva pelos tipos nativos do time.";
    else if ((match = clean.match(/^Open (.+)$/))) translated = "Abrir " + match[1];
    else if ((match = clean.match(/^Add (.+) to Team Lab$/))) translated = "Adicionar " + match[1] + " ao Lab de Time";
    else if ((match = clean.match(/^Compare (.+)$/))) translated = "Comparar " + match[1];
  }

  if (!translated) {
    if (clean === "Team Lab is full. Remove a member first.") translated = "O Lab de Time está cheio. Remova um membro primeiro.";
    else if (clean === "Compare holds up to three Pokémon.") translated = "A comparação aceita até três Pokémon.";
  }

  return translated ? raw.replace(clean, translated) : raw;
}

function translateRendered(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!sourceText.has(node)) sourceText.set(node, node.nodeValue);
    node.nodeValue = state.locale === "pt-BR"
      ? translateBaseText(sourceText.get(node))
      : sourceText.get(node);
  }

  root.querySelectorAll("[placeholder], [title], [aria-label]").forEach((element) => {
    if (!sourceAttributes.has(element)) {
      sourceAttributes.set(element, {
        placeholder: element.getAttribute("placeholder"),
        title: element.getAttribute("title"),
        ariaLabel: element.getAttribute("aria-label")
      });
    }
    const original = sourceAttributes.get(element);
    for (const [attribute, source] of [
      ["placeholder", original.placeholder],
      ["title", original.title],
      ["aria-label", original.ariaLabel]
    ]) {
      if (source == null) continue;
      element.setAttribute(attribute, state.locale === "pt-BR" ? translateBaseText(source) : source);
    }
  });

  document.documentElement.lang = state.locale;
  const current = document.querySelector("#language-current");
  const next = document.querySelector("#language-next");
  const currentLabel = state.locale === "pt-BR" ? "PT-BR" : "EN";
  const nextLabel = state.locale === "pt-BR" ? "EN" : "PT-BR";
  if (current && current.textContent !== currentLabel) current.textContent = currentLabel;
  if (next && next.textContent !== nextLabel) next.textContent = nextLabel;
  document.title = state.locale === "pt-BR"
    ? "POKÉGRID — Sistema de Pesquisa de Campo"
    : "POKÉGRID — Field Research System";
}

const state = {
  catalog: [],
  catalogOffset: 0,
  catalogCount: null,
  loadingMore: false,
  featured: null,
  team: readLocal("pokegrid:team", []),
  compare: readLocal("pokegrid:compare", []),
  favorites: readLocal("pokegrid:favorites", []),
  savedTeams: readLocal("pokegrid:saved-teams", []),
  moveSelections: readJson("pokegrid:move-selections", {}),
  moveAnalysis: null,
  filter: { type: "", generation: "", offset: 0, active: false },
  generations: [],
  soundEnabled: localStorage.getItem("pokegrid:sound") !== "off",
  searchTimer: null,
  locale: readLocale()
};

const TYPE_COLORS = {
  normal: "#8f8c80", fire: "#e7442e", water: "#2c71e8", electric: "#e4b92e",
  grass: "#4e9d53", ice: "#56bfc7", fighting: "#b9382f", poison: "#8945a2",
  ground: "#ae7841", flying: "#7592ce", psychic: "#d94e83", bug: "#7f9633",
  rock: "#8c7b4b", ghost: "#5b527f", dragon: "#5544cc", dark: "#403c39",
  steel: "#7d8892", fairy: "#d77ba7"
};

const STAT_LABELS = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Attack",
  "special-defense": "Sp. Defense",
  speed: "Speed"
};

function readLocal(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function playUiSound(kind = "tap") {
  if (!state.soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    playUiSound.context ??= new AudioContext();
    const ctx = playUiSound.context;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const frequencies = { tap: 520, open: 690, save: 820, remove: 250, error: 150 };
    oscillator.type = kind === "error" ? "square" : "sine";
    oscillator.frequency.setValueAtTime(frequencies[kind] ?? 520, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.06);
  } catch {}
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function number(value, width = 4) {
  return String(value ?? "—").padStart(width, "0");
}

function typeTag(type) {
  const color = TYPE_COLORS[type] ?? "#11110f";
  return `<span class="type" style="--type-color:${color}">${escapeHtml(type)}</span>`;
}

function typeTags(types = []) {
  return `<div class="type-row">${types.map(typeTag).join("")}</div>`;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function toast(message, sound = "tap") {
  playUiSound(sound);
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function updateCounters() {
  teamCount.textContent = state.team.length;
  compareCount.textContent = state.compare.length;
  if (favoriteCount) favoriteCount.textContent = state.favorites.length;
}

function syncNav(route) {
  document.querySelectorAll("[data-nav]").forEach((link) => link.classList.remove("active"));
  const key = route.startsWith("/team") ? "team"
    : route.startsWith("/compare") ? "compare"
      : route.startsWith("/favorites") ? "favorites"
        : route.startsWith("/generations") || route.startsWith("/generation/") ? "generations"
          : route.startsWith("/about") ? "about"
            : "explore";
  document.querySelector(`[data-nav="${key}"]`)?.classList.add("active");
}

function setLoading(label = "Reading field data") {
  app.innerHTML = `<div class="page"><div class="loading">${escapeHtml(label)}</div></div>`;
}

function renderError(error) {
  app.innerHTML = `<div class="page"><section class="error-state"><span class="eyebrow">DATA LINK / ERROR</span><h2>Field signal lost.</h2><p>${escapeHtml(error.message || "Something went wrong.")}</p><button class="secondary-button" data-retry>Retry</button></section></div>`;
  app.querySelector("[data-retry]")?.addEventListener("click", route);
}

function addToTeam(pokemon) {
  if (state.team.some((item) => item.name === pokemon.name)) return toast(`${pokemon.displayName} is already in Team Lab.`);
  if (state.team.length >= 6) return toast("Team Lab is full. Remove a member first.");
  state.team.push(minimalPokemon(pokemon));
  writeLocal("pokegrid:team", state.team);
  updateCounters();
  toast(`${pokemon.displayName} added to Team Lab.`);
}

function toggleCompare(pokemon) {
  const index = state.compare.findIndex((item) => item.name === pokemon.name);
  if (index >= 0) {
    state.compare.splice(index, 1);
    toast(`${pokemon.displayName} removed from comparison.`);
  } else {
    if (state.compare.length >= 3) return toast("Compare holds up to three Pokémon.");
    state.compare.push(minimalPokemon(pokemon));
    toast(`${pokemon.displayName} added to comparison.`);
  }
  writeLocal("pokegrid:compare", state.compare);
  updateCounters();
}


function isFavorite(name) {
  return state.favorites.some((item) => item.name === name);
}

function toggleFavorite(pokemon) {
  const index = state.favorites.findIndex((item) => item.name === pokemon.name);
  if (index >= 0) {
    state.favorites.splice(index, 1);
    toast(`${pokemon.displayName} removed from favorites.`, "remove");
  } else {
    state.favorites.push(minimalPokemon(pokemon));
    toast(`${pokemon.displayName} added to favorites.`, "save");
  }
  writeLocal("pokegrid:favorites", state.favorites);
  updateCounters();
}

function minimalPokemon(pokemon) {
  return {
    id: pokemon.id,
    name: pokemon.name,
    displayName: pokemon.displayName,
    image: pokemon.image,
    types: pokemon.types,
    stats: pokemon.stats,
    totalStats: pokemon.totalStats,
    height: pokemon.height,
    weight: pokemon.weight
  };
}

function specimenCard(pokemon) {
  return `
    <article class="specimen" data-open-pokemon="${escapeHtml(pokemon.name)}" tabindex="0" aria-label="Open ${escapeHtml(pokemon.displayName)}">
      <div class="specimen-head"><span>SPECIMEN / ${number(pokemon.id)}</span><span>BST ${pokemon.totalStats ?? "—"}</span></div>
      <div class="specimen-actions">
        <button class="icon-action" type="button" title="Add to Team Lab" aria-label="Add ${escapeHtml(pokemon.displayName)} to Team Lab" data-add-team="${escapeHtml(pokemon.name)}">+</button>
        <button class="icon-action" type="button" title="Toggle favorite" aria-label="Favorite ${escapeHtml(pokemon.displayName)}" data-add-favorite="${escapeHtml(pokemon.name)}">${isFavorite(pokemon.name) ? "★" : "☆"}</button>
        <button class="icon-action" type="button" title="Toggle compare" aria-label="Compare ${escapeHtml(pokemon.displayName)}" data-add-compare="${escapeHtml(pokemon.name)}">≠</button>
      </div>
      <div class="specimen-visual">
        <span class="specimen-index">${number(pokemon.id, 3)}</span>
        ${pokemon.image ? `<img class="specimen-image" src="${escapeHtml(pokemon.image)}" alt="${escapeHtml(pokemon.displayName)}" loading="lazy" />` : ""}
      </div>
      <div class="specimen-info">
        <h3 class="specimen-name">${escapeHtml(pokemon.displayName)}</h3>
        ${typeTags(pokemon.types)}
      </div>
    </article>`;
}

function bindSpecimens(root = app) {
  root.querySelectorAll("[data-open-pokemon]").forEach((card) => {
    const open = () => { location.hash = `#/pokemon/${encodeURIComponent(card.dataset.openPokemon)}`; };
    card.addEventListener("click", (event) => { if (!event.target.closest("button")) open(); });
    card.addEventListener("keydown", (event) => { if (event.key === "Enter") open(); });
  });
  root.querySelectorAll("[data-add-team]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const pokemon = [...state.catalog, state.featured].find((item) => item?.name === button.dataset.addTeam)
      ?? state.compare.find((item) => item.name === button.dataset.addTeam)
      ?? state.team.find((item) => item.name === button.dataset.addTeam);
    if (pokemon) addToTeam(pokemon);
  }));

  root.querySelectorAll("[data-add-favorite]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const pokemon = [...state.catalog, state.featured, ...state.team, ...state.compare, ...state.favorites]
      .find((item) => item?.name === button.dataset.addFavorite);
    if (pokemon) {
      toggleFavorite(pokemon);
      button.textContent = isFavorite(pokemon.name) ? "★" : "☆";
    }
  }));
  root.querySelectorAll("[data-add-compare]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const pokemon = [...state.catalog, state.featured].find((item) => item?.name === button.dataset.addCompare)
      ?? state.team.find((item) => item.name === button.dataset.addCompare)
      ?? state.compare.find((item) => item.name === button.dataset.addCompare);
    if (pokemon) toggleCompare(pokemon);
  }));
}

async function ensureExploreData() {
  if (!state.catalog.length) {
    const catalog = await api("/api/pokemon?limit=24&offset=0");
    state.catalog = catalog.items;
    state.catalogOffset = 24;
    state.catalogCount = catalog.count;
  }
  if (!state.featured) {
    state.featured = await api("/api/pokemon/pikachu");
  }
}

async function ensureGenerations() {
  if (state.generations.length) return state.generations;
  const data = await api("/api/generations");
  state.generations = data.items ?? [];
  return state.generations;
}

async function applyExploreFilter({ reset = true } = {}) {
  if (reset) state.filter.offset = 0;
  const params = new URLSearchParams();
  if (state.filter.type) params.set("type", state.filter.type);
  if (state.filter.generation) params.set("generation", state.filter.generation);
  params.set("limit", "36");
  params.set("offset", String(state.filter.offset));

  const result = await api(`/api/filter?${params.toString()}`);
  state.catalog = reset ? result.items : [...state.catalog, ...result.items];
  state.catalogCount = result.count;
  state.filter.offset = result.nextOffset ?? state.catalog.length;
  state.filter.active = Boolean(state.filter.type || state.filter.generation);
  return result;
}

function filterControls() {
  const typeOptions = Object.keys(TYPE_COLORS).map((type) =>
    `<button class="filter-chip ${state.filter.type === type ? "active" : ""}" data-filter-type="${type}" type="button">${escapeHtml(typeLabel(type))}</button>`
  ).join("");

  const generationOptions = [
    `<option value="">All generations</option>`,
    ...state.generations.map((generation) =>
      `<option value="${generation.id}" ${String(state.filter.generation) === String(generation.id) ? "selected" : ""}>GEN ${generation.id} · ${escapeHtml(generation.region ?? "")}</option>`
    )
  ].join("");

  return `
    <section class="filter-panel">
      <div class="filter-panel-head">
        <div><span class="section-kicker">FILTER / SIGNAL RANGE</span><p>Cross-reference the index by type and generation.</p></div>
        <button class="text-button" data-clear-filters type="button">CLEAR FILTERS</button>
      </div>
      <div class="filter-row">
        <span class="filter-label">TYPE</span>
        <div class="filter-chips">${typeOptions}</div>
      </div>
      <div class="filter-row compact">
        <label class="filter-label" for="generation-filter">GENERATION</label>
        <select id="generation-filter" class="field-select">${generationOptions}</select>
      </div>
    </section>`;
}

async function renderExplore() {
  setLoading("Opening specimen index");
  await Promise.all([ensureExploreData(), ensureGenerations()]);
  const featured = state.featured;

  app.innerHTML = `
    <div class="page">
      <section class="hero">
        <div class="hero-copy">
          <div>
            <span class="hero-kicker">FIELD RESEARCH SYSTEM / REV. 01</span>
            <h1>READ THE <span class="outline">SIGNAL.</span></h1>
          </div>
          <div class="hero-intro">
            <span class="hero-index">01</span>
            <p>Pokémon stripped back to structure: species data, battle stats, type pressure and team composition in one research interface.</p>
          </div>
        </div>
        <div class="hero-specimen" data-open-pokemon="pikachu">
          <div class="hero-specimen-head"><span>ACTIVE SPECIMEN</span><span>#${number(featured.id, 3)}</span></div>
          <div class="hero-art-wrap">
            ${featured.image ? `<img class="hero-art" src="${escapeHtml(featured.image)}" alt="Pikachu" />` : ""}
          </div>
          <div class="hero-specimen-foot"><span>${escapeHtml(featured.displayName)}</span>${typeTags(featured.types)}</div>
        </div>
      </section>

      <div class="ticker" aria-hidden="true"><div class="ticker-track">
        ${Array.from({ length: 2 }, () => `<span>TYPE PRESSURE</span><span>SPECIES INDEX</span><span>TEAM BALANCE</span><span>EVOLUTION DATA</span><span>BATTLE PROFILE</span><span>FIELD NOTES</span>`).join("")}
      </div></div>

      <section id="index">
        <header class="section-head">
          <span class="section-kicker">02 / SPECIMEN INDEX</span>
          <div><h2>FIELD INDEX</h2><p>Start anywhere. Every entry opens a full specimen sheet; use + to send a Pokémon to Team Lab, ☆ to save it, or ≠ to stage a comparison.</p></div>
          <span class="eyebrow">${state.catalogCount ? `${state.catalogCount} API ENTRIES` : "LIVE INDEX"}</span>
        </header>
        ${filterControls()}
        <div class="specimen-grid" id="specimen-grid">${state.catalog.map(specimenCard).join("")}</div>
        <button class="load-more" id="load-more" type="button">Load next specimens →</button>
      </section>
    </div>`;

  bindSpecimens();
  app.querySelector(".hero-specimen")?.addEventListener("click", () => { playUiSound("open"); location.hash = "#/pokemon/pikachu"; });
  app.querySelector("#load-more")?.addEventListener("click", loadMore);

  app.querySelectorAll("[data-filter-type]").forEach((button) => button.addEventListener("click", async () => {
    state.filter.type = state.filter.type === button.dataset.filterType ? "" : button.dataset.filterType;
    await applyExploreFilter();
    renderExplore().catch(renderError);
  }));

  app.querySelector("#generation-filter")?.addEventListener("change", async (event) => {
    state.filter.generation = event.target.value;
    await applyExploreFilter();
    renderExplore().catch(renderError);
  });

  app.querySelector("[data-clear-filters]")?.addEventListener("click", async () => {
    state.filter = { type: "", generation: "", offset: 0, active: false };
    state.catalog = [];
    state.catalogCount = null;
    await ensureExploreData();
    renderExplore().catch(renderError);
  });
}

async function loadMore() {
  if (state.loadingMore) return;
  state.loadingMore = true;
  const button = app.querySelector("#load-more");
  if (button) button.textContent = "Reading next batch…";

  try {
    let next;
    if (state.filter.active) {
      const params = new URLSearchParams();
      if (state.filter.type) params.set("type", state.filter.type);
      if (state.filter.generation) params.set("generation", state.filter.generation);
      params.set("limit", "36");
      params.set("offset", String(state.filter.offset));
      next = await api(`/api/filter?${params.toString()}`);
      state.filter.offset = next.nextOffset ?? (state.filter.offset + next.items.length);
    } else {
      next = await api(`/api/pokemon?limit=24&offset=${state.catalogOffset}`);
      state.catalogOffset += next.items.length;
    }

    state.catalog.push(...next.items);
    const grid = app.querySelector("#specimen-grid");
    grid.insertAdjacentHTML("beforeend", next.items.map(specimenCard).join(""));
    bindSpecimens(grid);
    if (button) {
      button.textContent = next.nextOffset === null ? "END OF INDEX" : "Load next specimens →";
      if (next.nextOffset === null) button.disabled = true;
    }
  } catch (error) {
    if (button) button.textContent = "Retry loading specimens";
    toast(error.message, "error");
  } finally {
    state.loadingMore = false;
  }
}

function evolutionCondition(entry) {
  const detail = entry.conditions?.[0];
  if (!detail) return entry.stage === 0 ? "BASE FORM" : "CONDITION VARIES";
  if (detail.minLevel) return `LEVEL ${detail.minLevel}`;
  if (detail.item) return `USE ${detail.item.replaceAll("-", " ")}`;
  if (detail.heldItem) return `HOLD ${detail.heldItem.replaceAll("-", " ")}`;
  if (detail.minHappiness) return `HAPPINESS ${detail.minHappiness}+`;
  if (detail.trigger) return detail.trigger.replaceAll("-", " ");
  return "SPECIAL CONDITION";
}

async function renderPokemon(name) {
  setLoading(`Resolving ${name}`);
  const pokemon = await api(`/api/pokemon/${encodeURIComponent(name)}`);
  state.featured = pokemon;

  const stats = Object.entries(pokemon.stats ?? {});
  const localized = pokemon.species?.localized?.[state.locale] ?? pokemon.species?.localized?.en ?? {};
  const genus = localized.genus ?? pokemon.species.genus ?? "Pokémon";
  const flavor = localized.flavor ?? pokemon.species.flavor ?? "No field note available for this specimen.";
  const favorite = isFavorite(pokemon.name);

  app.innerHTML = `
    <div class="page detail">
      <a class="detail-back" href="#/">← Return to index</a>
      <section class="detail-hero">
        <div class="detail-visual" data-number="${number(pokemon.id, 3)}">
          ${pokemon.image ? `<img src="${escapeHtml(pokemon.image)}" alt="${escapeHtml(pokemon.displayName)}" />` : ""}
        </div>
        <div class="detail-copy">
          <span class="eyebrow">SPECIMEN #${number(pokemon.id, 4)} / ${escapeHtml(pokemon.species.generation?.replace("generation-", "GEN ") ?? "UNKNOWN GEN")}</span>
          <h1>${escapeHtml(pokemon.displayName)}</h1>
          <p class="detail-genus">${escapeHtml(genus)}</p>
          ${typeTags(pokemon.types)}
          <p class="detail-flavor">${escapeHtml(flavor)}</p>
          <div class="detail-actions">
            <button class="primary-button" data-detail-team type="button">+ Add to Team Lab</button>
            <button class="secondary-button" data-detail-favorite type="button">${favorite ? "★ Saved favorite" : "☆ Add favorite"}</button>
            <button class="secondary-button" data-detail-compare type="button">≠ Toggle comparison</button>
          </div>
        </div>
      </section>

      <section class="detail-data">
        <div class="data-cell"><span class="data-label">Height</span><span class="data-value">${pokemon.height} m</span></div>
        <div class="data-cell"><span class="data-label">Weight</span><span class="data-value">${pokemon.weight} kg</span></div>
        <div class="data-cell"><span class="data-label">Base stat total</span><span class="data-value">${pokemon.totalStats}</span></div>
        <div class="data-cell"><span class="data-label">Known moves</span><span class="data-value">${pokemon.movesCount}</span></div>
        <div class="data-cell"><span class="data-label">Capture rate</span><span class="data-value">${pokemon.species.captureRate ?? "—"}</span></div>
        <div class="data-cell"><span class="data-label">Growth</span><span class="data-value">${escapeHtml(pokemon.species.growthRate?.replaceAll("-", " ") ?? "—")}</span></div>
        <div class="data-cell"><span class="data-label">Habitat</span><span class="data-value">${escapeHtml(pokemon.species.habitat?.replaceAll("-", " ") ?? "unknown")}</span></div>
        <div class="data-cell"><span class="data-label">Class</span><span class="data-value">${pokemon.species.mythical ? "Mythical" : pokemon.species.legendary ? "Legendary" : "Standard"}</span></div>
      </section>

      ${pokemon.varieties?.length > 1 ? `
      <section class="variant-strip">
        <span class="section-kicker">KNOWN FORMS / VARIANTS</span>
        <div class="variant-list">
          ${pokemon.varieties.map((variant) => `<button class="variant-chip ${variant.name === pokemon.name ? "active" : ""}" data-variant="${escapeHtml(variant.name)}" type="button">${escapeHtml(variant.displayName)}${variant.isDefault ? " · BASE" : ""}</button>`).join("")}
        </div>
      </section>` : ""}

      <section class="detail-lower">
        <div class="detail-section">
          <span class="section-kicker">BATTLE PROFILE</span>
          <div class="stat-comparison">
            ${stats.map(([key, value]) => `<div class="stat-line"><span>${escapeHtml(STAT_LABELS[key] ?? key)}</span><div class="stat-track"><div class="stat-fill" style="width:${Math.min(100, value / 2)}%"></div></div><strong>${value}</strong></div>`).join("")}
          </div>
          <div class="analysis-block">
            <span class="section-kicker">ABILITIES</span>
            <div class="findings">${pokemon.abilities.map((ability) => `<div class="finding"><span class="finding-code">${ability.hidden ? "HIDDEN ABILITY" : "ABILITY"}</span><p>${escapeHtml(ability.displayName)}</p></div>`).join("")}</div>
          </div>
          <div class="analysis-block">
            <span class="section-kicker">MOVE ARCHIVE</span>
            <p class="score-note">This specimen has ${pokemon.availableMoves?.length ?? 0} selectable moves in the data archive. Add it to Team Lab to run move coverage analysis.</p>
            <div class="move-preview">${(pokemon.availableMoves ?? []).slice(0, 18).map((move) => `<span>${escapeHtml(move.replaceAll("-", " "))}</span>`).join("")}</div>
          </div>
        </div>
        <div class="detail-section">
          <span class="section-kicker">EVOLUTION TRACE</span>
          <div class="evolution-list">
            ${pokemon.evolution.length ? pokemon.evolution.map((entry) => `<div class="evolution-item" data-evolution="${escapeHtml(entry.name)}"><span class="evolution-stage">STAGE ${String(entry.stage).padStart(2, "0")}</span><span class="evolution-name">${escapeHtml(entry.displayName)}</span><span class="evolution-condition">${escapeHtml(evolutionCondition(entry))}</span></div>`).join("") : `<p>No evolution chain registered.</p>`}
          </div>
          <div class="analysis-block">
            <span class="section-kicker">BREEDING / FIELD</span>
            <div class="findings">
              <div class="finding"><span class="finding-code">EGG GROUPS</span><p>${escapeHtml(pokemon.species.eggGroups.map((x) => x.replaceAll("-", " ")).join(" / ") || "Unknown")}</p></div>
              <div class="finding"><span class="finding-code">BASE HAPPINESS</span><p>${pokemon.species.baseHappiness ?? "Unknown"}</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>`;

  app.querySelector("[data-detail-team]")?.addEventListener("click", () => addToTeam(pokemon));
  app.querySelector("[data-detail-favorite]")?.addEventListener("click", (event) => {
    toggleFavorite(pokemon);
    event.currentTarget.textContent = isFavorite(pokemon.name) ? "★ Saved favorite" : "☆ Add favorite";
  });
  app.querySelector("[data-detail-compare]")?.addEventListener("click", () => toggleCompare(pokemon));
  app.querySelectorAll("[data-evolution]").forEach((entry) => entry.addEventListener("click", () => {
    playUiSound("open");
    location.hash = `#/pokemon/${encodeURIComponent(entry.dataset.evolution)}`;
  }));
  app.querySelectorAll("[data-variant]").forEach((entry) => entry.addEventListener("click", () => {
    playUiSound("open");
    location.hash = `#/pokemon/${encodeURIComponent(entry.dataset.variant)}`;
  }));
}

function teamSlot(pokemon, index) {
  if (!pokemon) return `<div class="team-slot empty"><span class="team-slot-label">SLOT ${String(index + 1).padStart(2, "0")}</span><strong>EMPTY</strong></div>`;
  return `<div class="team-slot">
    <span class="team-slot-label">SLOT ${String(index + 1).padStart(2, "0")}</span>
    ${pokemon.image ? `<img src="${escapeHtml(pokemon.image)}" alt="${escapeHtml(pokemon.displayName)}" />` : ""}
    <div class="team-slot-foot"><span class="team-slot-name">${escapeHtml(pokemon.displayName)}</span><button class="remove-button" data-remove-team="${escapeHtml(pokemon.name)}">REMOVE</button></div>
  </div>`;
}

function currentTeamMovePayload() {
  return state.team.map((pokemon) => ({
    name: pokemon.name,
    moves: (state.moveSelections[pokemon.name] ?? []).filter(Boolean).slice(0, 4)
  }));
}

function saveActiveTeam(name) {
  const cleanName = String(name ?? "").trim();
  if (!cleanName) return toast("Give this team a name first.", "error");
  if (!state.team.length) return toast("Add at least one Pokémon before saving.", "error");

  const saved = {
    id: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || String(Date.now()),
    name: cleanName,
    members: state.team.map(minimalPokemon),
    moves: Object.fromEntries(state.team.map((pokemon) => [pokemon.name, [...(state.moveSelections[pokemon.name] ?? [])]])),
    updatedAt: new Date().toISOString()
  };

  const existing = state.savedTeams.findIndex((team) => team.id === saved.id);
  if (existing >= 0) state.savedTeams[existing] = saved;
  else state.savedTeams.unshift(saved);
  writeLocal("pokegrid:saved-teams", state.savedTeams);
  toast(`Team “${cleanName}” saved.`, "save");
}

function loadSavedTeam(id) {
  const saved = state.savedTeams.find((team) => team.id === id);
  if (!saved) return;
  state.team = saved.members.map((member) => ({ ...member }));
  state.moveSelections = { ...state.moveSelections, ...(saved.moves ?? {}) };
  state.moveAnalysis = null;
  writeLocal("pokegrid:team", state.team);
  localStorage.setItem("pokegrid:move-selections", JSON.stringify(state.moveSelections));
  updateCounters();
  toast(`Team “${saved.name}” loaded.`, "open");
}

function deleteSavedTeam(id) {
  const saved = state.savedTeams.find((team) => team.id === id);
  state.savedTeams = state.savedTeams.filter((team) => team.id !== id);
  writeLocal("pokegrid:saved-teams", state.savedTeams);
  if (saved) toast(`Team “${saved.name}” deleted.`, "remove");
}

function moveInputsForPokemon(pokemon, index) {
  const selected = state.moveSelections[pokemon.name] ?? [];
  const listId = `moves-${index}`;
  return `
    <article class="move-member">
      <div class="move-member-head">
        ${pokemon.image ? `<img src="${escapeHtml(pokemon.image)}" alt="" />` : ""}
        <div><span class="eyebrow">MOVE SET / ${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(pokemon.displayName)}</strong></div>
      </div>
      <datalist id="${listId}">
        ${(pokemon.availableMoves ?? []).map((move) => `<option value="${escapeHtml(move)}">`).join("")}
      </datalist>
      <div class="move-input-grid">
        ${Array.from({ length: 4 }, (_, slot) => `
          <label><span>MOVE ${slot + 1}</span><input class="move-input" list="${listId}" data-move-pokemon="${escapeHtml(pokemon.name)}" data-move-slot="${slot}" value="${escapeHtml(selected[slot] ?? "")}" placeholder="choose move…" /></label>
        `).join("")}
      </div>
    </article>`;
}

function moveAnalysisHtml(analysis) {
  if (!analysis) return `<div class="move-analysis-empty"><span class="eyebrow">NO MOVE ANALYSIS YET</span><p>Select moves above and run the coverage scan.</p></div>`;
  const coverageRows = Object.entries(analysis.coverage ?? {}).map(([type, count]) =>
    `<tr><td>${typeTag(type)}</td><td class="${count ? "good" : "danger"}">${count}</td></tr>`
  ).join("");

  return `
    <div class="move-analysis-summary">
      <div class="metric"><span>ATTACKING MOVES</span><strong>${analysis.attackingMoves}</strong></div>
      <div class="metric"><span>STAB MOVES</span><strong>${analysis.stabMoves}</strong></div>
      <div class="metric"><span>COVERED TYPES</span><strong>${analysis.coveredTypes.length}/18</strong></div>
      <div class="metric"><span>PRESSURE GAPS</span><strong>${analysis.gaps.length}</strong></div>
    </div>
    <div class="move-analysis-grid">
      <div>
        <span class="section-kicker">DAMAGE CLASS</span>
        <div class="class-bars">
          <div><span>PHYSICAL</span><strong>${analysis.classes.physical ?? 0}</strong></div>
          <div><span>SPECIAL</span><strong>${analysis.classes.special ?? 0}</strong></div>
          <div><span>STATUS</span><strong>${analysis.classes.status ?? 0}</strong></div>
        </div>
        <span class="section-kicker">UNANSWERED TYPES</span>
        <div class="gap-tags">${analysis.gaps.map((type) => typeTag(type)).join("") || "<span>NONE</span>"}</div>
      </div>
      <div class="matrix-panel compact">
        <table class="matrix"><thead><tr><th>Defending type</th><th>Super-effective moves</th></tr></thead><tbody>${coverageRows}</tbody></table>
      </div>
    </div>`;
}

async function renderTeam() {
  setLoading("Running team analysis");
  let analysis = null;
  let details = [];

  if (state.team.length) {
    const data = await api("/api/team/analyze", { method: "POST", body: JSON.stringify({ pokemon: state.team.map((item) => item.name) }) });
    analysis = data.analysis;
    state.team = data.pokemon.map(minimalPokemon);
    writeLocal("pokegrid:team", state.team);
    details = await Promise.all(state.team.map((member) => api(`/api/pokemon/${encodeURIComponent(member.name)}`)));
  }

  const slots = Array.from({ length: 6 }, (_, index) => teamSlot(state.team[index], index)).join("");
  const savedOptions = state.savedTeams.map((team) => `<option value="${escapeHtml(team.id)}">${escapeHtml(team.name)} · ${team.members.length}/6</option>`).join("");

  app.innerHTML = `
    <div class="page">
      <header class="page-title">
        <div><span class="section-kicker">03 / COMPOSITION ENGINE</span><h1>TEAM<br>LAB.</h1></div>
        <div class="page-title-side"><span class="eyebrow">MAXIMUM 06 SPECIMENS</span><p>Read a team as a system: shared weaknesses, resistances, immunities, native type coverage and selected move pressure.</p></div>
      </header>

      <section class="team-vault">
        <div>
          <span class="section-kicker">TEAM VAULT</span>
          <p>Save different lineups locally and return to them later.</p>
        </div>
        <div class="team-vault-controls">
          <input id="team-save-name" class="field-input" maxlength="32" placeholder="team name…" />
          <button class="secondary-button" data-save-team type="button">SAVE CURRENT</button>
          <select id="saved-team-select" class="field-select"><option value="">Saved teams…</option>${savedOptions}</select>
          <button class="secondary-button" data-load-team type="button">LOAD</button>
          <button class="text-button danger-text" data-delete-team type="button">DELETE</button>
        </div>
      </section>

      <section class="team-slots">${slots}</section>
      ${state.team.length < 6 ? `<button class="load-more" data-open-search type="button">+ Search a Pokémon to add</button>` : ""}

      ${analysis ? `
        <section class="lab-grid">
          <div class="score-panel">
            <span class="section-kicker">COMPOSITION INDEX</span>
            <div class="score">${analysis.score}</div><span class="score-unit">/ 100 · PROJECT HEURISTIC</span>
            <p class="score-note">A compact project metric based on native type diversity, shared weaknesses and super-effective STAB coverage. It is not a competitive tier ranking.</p>
            <div class="findings">
              ${analysis.warnings.map((item) => `<div class="finding"><span class="finding-code">${escapeHtml(item.code)}</span><p>${escapeHtml(item.text)}</p></div>`).join("")}
              ${analysis.strengths.map((item) => `<div class="finding strength"><span class="finding-code">${escapeHtml(item.code)}</span><p>${escapeHtml(item.text)}</p></div>`).join("")}
            </div>
          </div>
          <div class="matrix-panel">
            <span class="section-kicker">DEFENSIVE PRESSURE MATRIX</span>
            <table class="matrix">
              <thead><tr><th>Attack type</th><th>Weak</th><th>Resist</th><th>Immune</th><th>Neutral</th></tr></thead>
              <tbody>${Object.entries(analysis.defensive).map(([type, values]) => `<tr><td>${typeTag(type)}</td><td class="${values.weak >= Math.max(2, Math.ceil(analysis.teamSize / 2)) ? "danger" : ""}">${values.weak}</td><td class="${values.resist ? "good" : ""}">${values.resist}</td><td>${values.immune}</td><td>${values.neutral}</td></tr>`).join("")}</tbody>
            </table>
          </div>
        </section>

        <section class="analysis-block">
          <header class="section-head"><span class="section-kicker">04 / TEAM SHAPE</span><div><h2>AVERAGE BASE STATS</h2><p>Useful for reading whether the group leans toward speed, bulk or raw offensive pressure.</p></div><span class="eyebrow">${analysis.teamTypes.length} DISTINCT TYPES</span></header>
          <div class="stat-comparison">${analysis.avgStats.map((stat) => `<div class="stat-line"><span>${escapeHtml(STAT_LABELS[stat.name] ?? stat.name)}</span><div class="stat-track"><div class="stat-fill" style="width:${Math.min(100, stat.value / 2)}%"></div></div><strong>${stat.value}</strong></div>`).join("")}</div>
        </section>

        <section class="move-lab">
          <header class="section-head"><span class="section-kicker">05 / MOVE COVERAGE</span><div><h2>MOVE LAB</h2><p>Select up to four moves per member. Coverage is recalculated from actual move types, including STAB and damage class distribution.</p></div><button class="primary-button" data-analyze-moves type="button">RUN MOVE SCAN</button></header>
          <div class="move-member-grid">${details.map(moveInputsForPokemon).join("")}</div>
          <div class="move-analysis-result">${moveAnalysisHtml(state.moveAnalysis)}</div>
        </section>`
        : `<section class="compare-empty"><div><span class="eyebrow">NO ACTIVE TEAM</span><strong>Build from the index.</strong><p>Use the + control on any specimen.</p></div></section>`}
    </div>`;

  app.querySelectorAll("[data-remove-team]").forEach((button) => button.addEventListener("click", () => {
    state.team = state.team.filter((item) => item.name !== button.dataset.removeTeam);
    state.moveAnalysis = null;
    writeLocal("pokegrid:team", state.team);
    updateCounters();
    playUiSound("remove");
    renderTeam().catch(renderError);
  }));

  app.querySelector("[data-open-search]")?.addEventListener("click", openSearch);

  app.querySelector("[data-save-team]")?.addEventListener("click", () => {
    saveActiveTeam(app.querySelector("#team-save-name")?.value);
    renderTeam().catch(renderError);
  });

  app.querySelector("[data-load-team]")?.addEventListener("click", () => {
    const id = app.querySelector("#saved-team-select")?.value;
    if (!id) return toast("Choose a saved team first.", "error");
    loadSavedTeam(id);
    renderTeam().catch(renderError);
  });

  app.querySelector("[data-delete-team]")?.addEventListener("click", () => {
    const id = app.querySelector("#saved-team-select")?.value;
    if (!id) return toast("Choose a saved team first.", "error");
    deleteSavedTeam(id);
    renderTeam().catch(renderError);
  });

  app.querySelectorAll("[data-move-pokemon]").forEach((input) => input.addEventListener("change", () => {
    const pokemon = input.dataset.movePokemon;
    const slot = Number(input.dataset.moveSlot);
    const values = [...(state.moveSelections[pokemon] ?? [])];
    values[slot] = input.value.trim().toLowerCase();
    state.moveSelections[pokemon] = values;
    localStorage.setItem("pokegrid:move-selections", JSON.stringify(state.moveSelections));
    state.moveAnalysis = null;
  }));

  app.querySelector("[data-analyze-moves]")?.addEventListener("click", async () => {
    try {
      const payload = currentTeamMovePayload();
      if (!payload.some((member) => member.moves.length)) return toast("Select at least one move first.", "error");
      const result = await api("/api/team/moves", { method: "POST", body: JSON.stringify({ members: payload }) });
      state.moveAnalysis = result.analysis;
      playUiSound("save");
      renderTeam().catch(renderError);
    } catch (error) {
      toast(error.message, "error");
    }
  });
}

async function resolveCompare() {
  if (!state.compare.length) return [];
  const resolved = await Promise.all(state.compare.map((item) => api(`/api/pokemon/${encodeURIComponent(item.name)}`)));
  state.compare = resolved.map(minimalPokemon);
  writeLocal("pokegrid:compare", state.compare);
  return resolved;
}

async function renderCompare() {
  setLoading("Aligning specimens");
  const pokemon = await resolveCompare();
  app.innerHTML = `
    <div class="page">
      <header class="page-title">
        <div><span class="section-kicker">05 / PARALLEL VIEW</span><h1>COMPARE.</h1></div>
        <div class="page-title-side"><span class="eyebrow">UP TO 03 SPECIMENS</span><p>Line up base attributes and body metrics without collapsing them into a single verdict.</p></div>
      </header>
      ${pokemon.length ? compareTable(pokemon) : `<section class="compare-empty"><div><span class="eyebrow">COMPARISON BUFFER EMPTY</span><strong>Choose your subjects.</strong><p>Use the ≠ control in the index.</p><button class="secondary-button" data-open-search type="button">Search index</button></div></section>`}
    </div>`;

  app.querySelector("[data-open-search]")?.addEventListener("click", openSearch);
  app.querySelectorAll("[data-remove-compare]").forEach((button) => button.addEventListener("click", () => {
    state.compare = state.compare.filter((item) => item.name !== button.dataset.removeCompare);
    writeLocal("pokegrid:compare", state.compare);
    updateCounters();
    renderCompare().catch(renderError);
  }));
}

function compareTable(pokemon) {
  const rows = [
    ["Types", (p) => typeTags(p.types)],
    ["Height", (p) => `${p.height} m`],
    ["Weight", (p) => `${p.weight} kg`],
    ["Base total", (p) => p.totalStats],
    ...Object.keys(STAT_LABELS).map((key) => [STAT_LABELS[key], (p) => `<span class="compare-value">${p.stats[key]}</span><div class="compare-bar"><span style="width:${Math.min(100, p.stats[key] / 2)}%"></span></div>`])
  ];

  return `<div class="compare-grid" style="--compare-count:${pokemon.length}">
    <div class="compare-cell compare-label">Specimen</div>
    ${pokemon.map((p) => `<div class="compare-cell compare-head">${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.displayName)}" />` : ""}<div><h3>${escapeHtml(p.displayName)}</h3><button class="remove-button" data-remove-compare="${escapeHtml(p.name)}">REMOVE</button></div></div>`).join("")}
    ${rows.map(([label, render]) => `<div class="compare-cell compare-label">${escapeHtml(label)}</div>${pokemon.map((p) => `<div class="compare-cell">${render(p)}</div>`).join("")}`).join("")}
  </div>`;
}

function openSearch() {
  if (!dialog.open) dialog.showModal();
  searchInput.focus();
}

async function runSearch(value) {
  const q = value.trim();
  if (!q) {
    searchResults.innerHTML = `<p class="search-hint">Type a name. Results resolve against the full PokéAPI Pokémon index.</p>`;
    return;
  }

  searchResults.innerHTML = `<p class="search-hint">Scanning index…</p>`;
  try {
    const data = await api(`/api/search?q=${encodeURIComponent(q)}&limit=10`);
    if (!data.items.length) {
      searchResults.innerHTML = `<p class="search-hint">No index matches for “${escapeHtml(q)}”.</p>`;
      return;
    }
    searchResults.innerHTML = data.items.map((pokemon) => `
      <div class="search-result" data-search-open="${escapeHtml(pokemon.name)}">
        ${pokemon.image ? `<img src="${escapeHtml(pokemon.image)}" alt="" />` : `<span></span>`}
        <div><span class="search-result-id">#${number(pokemon.id, 4)}</span><div class="search-result-name">${escapeHtml(pokemon.displayName)}</div>${typeTags(pokemon.types)}</div>
        <span class="eyebrow">OPEN →</span>
      </div>`).join("");
    searchResults.querySelectorAll("[data-search-open]").forEach((item) => item.addEventListener("click", () => {
      dialog.close();
      searchInput.value = "";
      location.hash = `#/pokemon/${encodeURIComponent(item.dataset.searchOpen)}`;
    }));
  } catch (error) {
    searchResults.innerHTML = `<p class="search-hint">${escapeHtml(error.message)}</p>`;
  }
}

async function route() {
  const raw = location.hash.slice(1) || "/";
  const routePath = raw.split("?")[0];
  syncNav(routePath);
  window.scrollTo({ top: 0, behavior: "auto" });

  try {
    if (routePath === "/" || routePath === "") await renderExplore();
    else if (routePath === "/team") await renderTeam();
    else if (routePath === "/compare") await renderCompare();
    else if (routePath.startsWith("/pokemon/")) await renderPokemon(decodeURIComponent(routePath.slice("/pokemon/".length)));
    else {
      app.innerHTML = `<div class="page"><section class="compare-empty"><div><span class="eyebrow">404 / INDEX MISS</span><strong>Unknown coordinate.</strong><p><a href="#/">Return to field index →</a></p></div></section></div>`;
    }
    translateRendered(document.body);
    app.focus({ preventScroll: true });
  } catch (error) {
    renderError(error);
  }
}

document.querySelector("#language-toggle")?.addEventListener("click", () => {
  state.locale = state.locale === "en" ? "pt-BR" : "en";
  localStorage.setItem(LANGUAGE_KEY, state.locale);
  translateRendered(document.body);
  route();
});

document.querySelector("#search-trigger")?.addEventListener("click", openSearch);
searchInput.addEventListener("input", () => {
  clearTimeout(state.searchTimer);
  state.searchTimer = setTimeout(() => runSearch(searchInput.value), 220);
});
dialog.addEventListener("close", () => { searchResults.innerHTML = `<p class="search-hint">Type a name. Results resolve against the full PokéAPI Pokémon index.</p>`; });
window.addEventListener("keydown", (event) => {
  if (event.key === "/" && !event.ctrlKey && !event.metaKey && document.activeElement?.tagName !== "INPUT") {
    event.preventDefault();
    openSearch();
  }
  if (event.key === "Escape" && dialog.open) dialog.close();
});
window.addEventListener("hashchange", route);

const localeObserver = new MutationObserver(() => {
  if (state.locale === "pt-BR") translateRendered(document.body);
});
localeObserver.observe(document.body, { childList: true, subtree: true });

translateRendered(document.body);
updateCounters();
route();
