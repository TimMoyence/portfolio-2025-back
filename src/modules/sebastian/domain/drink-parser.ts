/** Boisson parsee depuis un message Telegram. */
export interface ParsedDrink {
  category: 'alcohol' | 'coffee';
  quantity: number;
  unit: 'standard_drink' | 'cup';
  source: string;
  displayCount: number;
  drinkType?:
    | 'beer'
    | 'wine'
    | 'champagne'
    | 'coffee'
    | 'cocktail'
    | 'spiritueux'
    | 'cidre';
  alcoholDegree?: number | null;
  volumeCl?: number | null;
  consumedAt?: string;
}

/** Resultat du parsing d'un message. */
export interface DrinkParseResult {
  drinks: ParsedDrink[];
  confident: boolean;
  rawInput: string;
}

// ---------------------------------------------------------------------------
// Nombres ecrits (FR + EN)
// ---------------------------------------------------------------------------

const WRITTEN_NUMBERS: Record<string, number> = {
  // English
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  // French
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  // six already defined above
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
};

// ---------------------------------------------------------------------------
// Definitions NLP (langage naturel)
// ---------------------------------------------------------------------------

interface DrinkDefinition {
  pattern: RegExp;
  category: 'alcohol' | 'coffee';
  multiplier: number;
  unit: 'standard_drink' | 'cup';
  source: string;
}

const DRINK_DEFINITIONS: DrinkDefinition[] = [
  {
    pattern: /\bpinte?s?\b/i,
    category: 'alcohol',
    multiplier: 2,
    unit: 'standard_drink',
    source: 'pint',
  },
  {
    pattern: /\bcoupes?\s*(?:de\s+)?champagne\b/i,
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'champagne',
  },
  {
    pattern: /\bverres?\s*(?:de\s+)?vin\b/i,
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'wine',
  },
  {
    pattern: /\bchampagnes?\b/i,
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'champagne',
  },
  {
    pattern: /\bvins?\b/i,
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'wine',
  },
  {
    pattern: /\bcocktails?\b/i,
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'cocktail',
  },
  {
    pattern: /\bspiritueux\b/i,
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'spiritueux',
  },
  {
    pattern: /\bcidres?\b/i,
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'cidre',
  },
  {
    pattern: /\bbi[eè]res?\b/i,
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'beer',
  },
  {
    pattern: /\bbeers?\b/i,
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'beer',
  },
  {
    pattern: /\bcaf[eé]s?\b/i,
    category: 'coffee',
    multiplier: 1,
    unit: 'cup',
    source: 'coffee',
  },
  {
    pattern: /\bcoffees?\b/i,
    category: 'coffee',
    multiplier: 1,
    unit: 'cup',
    source: 'coffee',
  },
];

// ---------------------------------------------------------------------------
// Correspondances source → drinkType et defaults
// ---------------------------------------------------------------------------

/** Correspondance source → type de boisson pour enrichir les ParsedDrink. */
const SOURCE_TO_DRINK_TYPE: Record<
  string,
  'beer' | 'wine' | 'champagne' | 'coffee' | 'cocktail' | 'spiritueux' | 'cidre'
> = {
  beer: 'beer',
  pint: 'beer',
  wine: 'wine',
  champagne: 'champagne',
  coffee: 'coffee',
  cocktail: 'cocktail',
  spiritueux: 'spiritueux',
  cidre: 'cidre',
};

/** Valeurs par defaut (degre, volume) par source de boisson. */
const SOURCE_TO_DEFAULTS: Record<
  string,
  { alcoholDegree: number | null; volumeCl: number | null }
> = {
  beer: { alcoholDegree: 5, volumeCl: 25 },
  pint: { alcoholDegree: 5, volumeCl: 50 },
  wine: { alcoholDegree: 12, volumeCl: 12.5 },
  champagne: { alcoholDegree: 12, volumeCl: 12.5 },
  cocktail: { alcoholDegree: 15, volumeCl: 20 },
  spiritueux: { alcoholDegree: 40, volumeCl: 4 },
  cidre: { alcoholDegree: 5, volumeCl: 25 },
  coffee: { alcoholDegree: null, volumeCl: null },
};

// ---------------------------------------------------------------------------
// Jours relatifs
// ---------------------------------------------------------------------------

/** Mapping nom de jour → index JS (0=dimanche, 1=lundi ... 6=samedi). */
const DAY_NAME_TO_INDEX: Record<string, number> = {
  // Francais
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 0,
  // English
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
};

/**
 * Resout un token jour vers une Date.
 * - "hier" / "yesterday" → hier
 * - Nom de jour → le dernier passe. Si aujourd'hui = ce jour, reste aujourd'hui.
 * Retourne null si le token n'est pas un jour reconnu.
 */
function resolveDay(token: string): Date | null {
  const lower = token.toLowerCase();

  if (lower === 'hier' || lower === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const targetIndex = DAY_NAME_TO_INDEX[lower];
  if (targetIndex === undefined) return null;

  const now = new Date();
  const currentDay = now.getDay();
  let diff = currentDay - targetIndex;
  if (diff < 0) diff += 7;
  // Si diff === 0, c'est aujourd'hui → on garde aujourd'hui
  const d = new Date();
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Parse un token d'heure.
 * Formats reconnus : "22h", "22:08", "22h00".
 * Retourne null si le token n'est pas une heure.
 */
function parseTime(token: string): { hours: number; minutes: number } | null {
  // 22h, 14h
  const hOnly = /^(\d{1,2})h$/i.exec(token);
  if (hOnly) {
    return { hours: parseInt(hOnly[1], 10), minutes: 0 };
  }

  // 22h00, 22h30
  const hm = /^(\d{1,2})h(\d{2})$/i.exec(token);
  if (hm) {
    return { hours: parseInt(hm[1], 10), minutes: parseInt(hm[2], 10) };
  }

  // 22:08, 22:00
  const colon = /^(\d{1,2}):(\d{2})$/i.exec(token);
  if (colon) {
    return { hours: parseInt(colon[1], 10), minutes: parseInt(colon[2], 10) };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Commandes slash v2
// ---------------------------------------------------------------------------

interface SlashCommandDef {
  category: 'alcohol' | 'coffee';
  multiplier: number;
  unit: 'standard_drink' | 'cup';
  source: string;
}

/** Record de toutes les commandes slash reconnues. */
const SLASH_COMMANDS: Record<string, SlashCommandDef> = {
  pint: {
    category: 'alcohol',
    multiplier: 2,
    unit: 'standard_drink',
    source: 'pint',
  },
  pinte: {
    category: 'alcohol',
    multiplier: 2,
    unit: 'standard_drink',
    source: 'pint',
  },
  beer: {
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'beer',
  },
  biere: {
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'beer',
  },
  bière: {
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'beer',
  },
  vin: {
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'wine',
  },
  champagne: {
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'champagne',
  },
  cocktail: {
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'cocktail',
  },
  spiritueux: {
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'spiritueux',
  },
  cidre: {
    category: 'alcohol',
    multiplier: 1,
    unit: 'standard_drink',
    source: 'cidre',
  },
  coffee: {
    category: 'coffee',
    multiplier: 1,
    unit: 'cup',
    source: 'coffee',
  },
  cafe: {
    category: 'coffee',
    multiplier: 1,
    unit: 'cup',
    source: 'coffee',
  },
  café: {
    category: 'coffee',
    multiplier: 1,
    unit: 'cup',
    source: 'coffee',
  },
};

/** Liste des noms de commandes pour le regex de decoupe. */
const SLASH_COMMAND_NAMES = Object.keys(SLASH_COMMANDS).join('|');

const NUMBER_PATTERN = /(\d+)/;

/** Extrait un nombre (chiffre ou ecrit) d'un token. */
function parseNumber(token: string): number | null {
  const digitMatch = token.match(NUMBER_PATTERN);
  if (digitMatch) return parseInt(digitMatch[1], 10);
  const written = WRITTEN_NUMBERS[token.toLowerCase()];
  return written ?? null;
}

/**
 * Parse les commandes slash depuis un message.
 * Grammaire v2 : /command [qts:N] [jour] [soir] [heure] [degre]
 * - Nombre seul = degre
 * - qts:N = quantite (defaut: 1)
 */
function parseSlashCommands(text: string): {
  drinks: ParsedDrink[];
  remaining: string;
} {
  const drinks: ParsedDrink[] = [];
  let remaining = text;

  // Decoupe le texte en segments par commande slash
  const splitPattern = new RegExp(
    `(?=\\/(?:${SLASH_COMMAND_NAMES})(?:\\s|$))`,
    'gi',
  );
  const segments = text.split(splitPattern).filter((s) => s.trim());

  for (const segment of segments) {
    // Extrait la commande du segment
    const cmdMatch = new RegExp(
      `^\\/(${SLASH_COMMAND_NAMES})(?:\\s|$)`,
      'i',
    ).exec(segment.trim());
    if (!cmdMatch) continue;

    const commandName = cmdMatch[1].toLowerCase();
    const def = SLASH_COMMANDS[commandName];
    if (!def) continue;

    // Retire la commande du remaining
    remaining = remaining.replace(segment.trim(), '');

    // Parse les arguments (tout ce qui suit la commande)
    const argsStr = segment.trim().substring(cmdMatch[0].length).trim();
    const tokens = argsStr ? argsStr.split(/\s+/) : [];

    let displayCount = 1;
    let degreeOverride: number | undefined;
    let dayDate: Date | null = null;
    let time: { hours: number; minutes: number } | null = null;
    let soirAfterDay = false;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const tokenLower = token.toLowerCase();

      // qts:N
      const qtsMatch = /^qts:(\d+)$/i.exec(token);
      if (qtsMatch) {
        displayCount = parseInt(qtsMatch[1], 10);
        continue;
      }

      // "soir" (doit suivre un jour — hier/yesterday ou nom de jour)
      if (tokenLower === 'soir' && dayDate !== null) {
        soirAfterDay = true;
        continue;
      }

      // Jour (hier, yesterday, lundi-dimanche, monday-sunday)
      const resolvedDay = resolveDay(tokenLower);
      if (resolvedDay) {
        dayDate = resolvedDay;
        continue;
      }

      // Heure (22h, 22:08, 22h00)
      const parsedTime = parseTime(token);
      if (parsedTime) {
        time = parsedTime;
        continue;
      }

      // Nombre seul = degre
      const num = /^(\d+)$/.exec(token);
      if (num) {
        degreeOverride = parseInt(num[1], 10);
        continue;
      }
    }

    const defaults = SOURCE_TO_DEFAULTS[def.source] ?? {
      alcoholDegree: null,
      volumeCl: null,
    };
    const drinkType = SOURCE_TO_DRINK_TYPE[def.source];

    // Construire consumedAt si jour ou heure present
    let consumedAt: string | undefined;
    if (dayDate || time || soirAfterDay) {
      const baseDate = dayDate ?? new Date();
      if (!dayDate) {
        // Heure seule → aujourd'hui
        baseDate.setHours(0, 0, 0, 0);
      }
      if (soirAfterDay && !time) {
        baseDate.setHours(21, 0, 0, 0);
      } else if (time) {
        baseDate.setHours(time.hours, time.minutes, 0, 0);
      }
      consumedAt = baseDate.toISOString();
    }

    const drink: ParsedDrink = {
      category: def.category,
      quantity: displayCount * def.multiplier,
      unit: def.unit,
      source: def.source,
      displayCount,
      drinkType,
      alcoholDegree: degreeOverride ?? defaults.alcoholDegree,
      volumeCl: defaults.volumeCl,
    };

    if (consumedAt !== undefined) {
      drink.consumedAt = consumedAt;
    }

    drinks.push(drink);
  }

  return { drinks, remaining: remaining.trim() };
}

/** Parse le langage naturel pour trouver des boissons. */
function parseNaturalLanguage(text: string): {
  drinks: ParsedDrink[];
  consumed: boolean;
} {
  const drinks: ParsedDrink[] = [];
  let workingText = text;

  // Normalise les connecteurs
  workingText = workingText.replace(/\b(et|and|,|;|\+)\b/gi, ' ');

  for (const def of DRINK_DEFINITIONS) {
    const drinkMatch = workingText.match(def.pattern);
    if (!drinkMatch) continue;

    // Cherche un nombre avant la boisson
    const drinkIndex = drinkMatch.index!;
    const beforeDrink = workingText.substring(0, drinkIndex).trim();
    const tokens = beforeDrink.split(/\s+/);
    const lastToken = tokens[tokens.length - 1] || '';
    const parsedCount = parseNumber(lastToken);
    const count = parsedCount ?? 1;

    const nlpDefaults = SOURCE_TO_DEFAULTS[def.source] ?? {
      alcoholDegree: null,
      volumeCl: null,
    };

    drinks.push({
      category: def.category,
      quantity: count * def.multiplier,
      unit: def.unit,
      source: def.source,
      displayCount: count,
      drinkType: SOURCE_TO_DRINK_TYPE[def.source],
      alcoholDegree: nlpDefaults.alcoholDegree,
      volumeCl: nlpDefaults.volumeCl,
    });

    // Retire la partie matchee du texte (nombre + boisson) par position
    const drinkEnd = drinkIndex + drinkMatch[0].length;
    let removeStart = drinkIndex;
    if (parsedCount !== null && lastToken) {
      // Recule pour inclure le token numerique qui precede
      const tokenStart = workingText.lastIndexOf(lastToken, drinkIndex);
      if (tokenStart >= 0) {
        removeStart = tokenStart;
      }
    }
    workingText =
      workingText.substring(0, removeStart) +
      ' ' +
      workingText.substring(drinkEnd);
  }

  // Verifie si tout le texte est consomme
  const leftover = workingText.replace(/\s+/g, '').replace(/[,;.!?]/g, '');
  const consumed = leftover.length === 0;

  return { drinks, consumed };
}

/** Parse un message Telegram pour en extraire des consommations. */
export function parseDrinkMessage(text: string): DrinkParseResult {
  const rawInput = text;

  if (!text || !text.trim()) {
    return { drinks: [], confident: false, rawInput };
  }

  // Phase 1 : slash commands
  const { drinks: slashDrinks, remaining } = parseSlashCommands(text);

  if (slashDrinks.length > 0 && !remaining) {
    return { drinks: slashDrinks, confident: true, rawInput };
  }

  // Phase 2 : langage naturel sur le texte restant
  const textToParse = remaining || text;
  const { drinks: nlpDrinks, consumed } = parseNaturalLanguage(textToParse);

  const allDrinks = [...slashDrinks, ...nlpDrinks];

  if (allDrinks.length === 0) {
    return { drinks: [], confident: false, rawInput };
  }

  return {
    drinks: allDrinks,
    confident: slashDrinks.length > 0 || consumed,
    rawInput,
  };
}
