export const TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting",
  "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
  "dragon", "dark", "steel", "fairy"
];

// Attacking type -> defending type multiplier. Missing entries are neutral (1x).
export const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

export function typeMultiplier(attackingType, defendingTypes) {
  return defendingTypes.reduce(
    (multiplier, defendingType) => multiplier * (TYPE_CHART[attackingType]?.[defendingType] ?? 1),
    1
  );
}

export function defensiveProfile(pokemon) {
  const profile = {};
  for (const attackType of TYPES) {
    profile[attackType] = typeMultiplier(attackType, pokemon.types);
  }
  return profile;
}

export function analyzeTeam(pokemonList) {
  const team = pokemonList.filter(Boolean).slice(0, 6);
  const defensive = Object.fromEntries(
    TYPES.map((type) => [type, { weak: 0, resist: 0, immune: 0, neutral: 0 }])
  );

  for (const pokemon of team) {
    const profile = defensiveProfile(pokemon);
    for (const [type, multiplier] of Object.entries(profile)) {
      if (multiplier === 0) defensive[type].immune += 1;
      else if (multiplier > 1) defensive[type].weak += 1;
      else if (multiplier < 1) defensive[type].resist += 1;
      else defensive[type].neutral += 1;
    }
  }

  const offensiveCoverage = Object.fromEntries(TYPES.map((type) => [type, 0]));
  const teamTypes = new Set(team.flatMap((pokemon) => pokemon.types));
  for (const attackType of teamTypes) {
    for (const defendingType of TYPES) {
      if ((TYPE_CHART[attackType]?.[defendingType] ?? 1) > 1) {
        offensiveCoverage[defendingType] += 1;
      }
    }
  }

  const sharedWeaknesses = Object.entries(defensive)
    .filter(([, value]) => value.weak >= Math.max(2, Math.ceil(team.length / 2)))
    .sort((a, b) => b[1].weak - a[1].weak)
    .map(([type, value]) => ({ type, count: value.weak }));

  const exposedTypes = TYPES
    .filter((type) => offensiveCoverage[type] === 0)
    .map((type) => ({ type }));

  const avgStats = team.length
    ? ["hp", "attack", "defense", "special-attack", "special-defense", "speed"].map((name) => ({
        name,
        value: Math.round(team.reduce((sum, pokemon) => sum + (pokemon.stats?.[name] ?? 0), 0) / team.length)
      }))
    : [];

  const duplicateTypes = [...teamTypes]
    .map((type) => ({ type, count: team.filter((pokemon) => pokemon.types.includes(type)).length }))
    .filter((item) => item.count > 2)
    .sort((a, b) => b.count - a.count);

  const strengths = [];
  const warnings = [];

  const immunities = Object.entries(defensive)
    .filter(([, value]) => value.immune > 0)
    .map(([type, value]) => ({ type, count: value.immune }));

  if (immunities.length) strengths.push({ code: "IMMUNITY", text: `${immunities.length} attacking types can be nullified by at least one member.` });
  if (teamTypes.size >= Math.min(8, team.length * 2)) strengths.push({ code: "DIVERSITY", text: `The team carries ${teamTypes.size} distinct native types.` });
  if (exposedTypes.length <= 4) strengths.push({ code: "COVERAGE", text: `Native STAB pressure reaches ${TYPES.length - exposedTypes.length}/${TYPES.length} defending types super-effectively.` });

  if (sharedWeaknesses.length) warnings.push({ code: "STACKED WEAKNESS", text: `${sharedWeaknesses[0].count}/${team.length} members are weak to ${sharedWeaknesses[0].type}.` });
  if (duplicateTypes.length) warnings.push({ code: "TYPE CLUSTER", text: `${duplicateTypes[0].count} members share ${duplicateTypes[0].type}.` });
  if (exposedTypes.length > 6) warnings.push({ code: "PRESSURE GAP", text: `${exposedTypes.length} defending types are not hit super-effectively by the team's native types.` });

  const rawScore = team.length
    ? 55
      + Math.min(teamTypes.size * 2, 20)
      + Math.max(0, 12 - sharedWeaknesses.reduce((sum, item) => sum + item.count, 0))
      + Math.max(0, 10 - exposedTypes.length)
      - duplicateTypes.reduce((sum, item) => sum + (item.count - 2) * 3, 0)
    : 0;

  return {
    teamSize: team.length,
    score: Math.max(0, Math.min(100, Math.round(rawScore))),
    teamTypes: [...teamTypes],
    defensive,
    offensiveCoverage,
    sharedWeaknesses,
    exposedTypes,
    duplicateTypes,
    avgStats,
    strengths,
    warnings
  };
}
