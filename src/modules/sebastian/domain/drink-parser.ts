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

export interface DrinkParseResult {
  drinks: ParsedDrink[];
  confident: boolean;
  rawInput: string;
}

const WRITTEN_NUMBERS: Record<string, number> = {
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
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
};

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

const DAY_NAME_TO_INDEX: Record<string, number> = {
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
};

function resolveDay(token: string): Date | null {
  const lower = token.toLowerCase();

  if (lower === 'hier' || lower === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  if (!(lower in DAY_NAME_TO_INDEX)) return null;
  const targetIndex = DAY_NAME_TO_INDEX[lower];

  const now = new Date();
  const currentDay = now.getDay();
  let diff = currentDay - targetIndex;
  if (diff < 0) diff += 7;
  const d = new Date();
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseTime(token: string): { hours: number; minutes: number } | null {
  const hOnly = /^(\d{1,2})h$/i.exec(token);
  if (hOnly) {
    return { hours: parseInt(hOnly[1], 10), minutes: 0 };
  }

  const hm = /^(\d{1,2})h(\d{2})$/i.exec(token);
  if (hm) {
    return { hours: parseInt(hm[1], 10), minutes: parseInt(hm[2], 10) };
  }

  const colon = /^(\d{1,2}):(\d{2})$/i.exec(token);
  if (colon) {
    return { hours: parseInt(colon[1], 10), minutes: parseInt(colon[2], 10) };
  }

  return null;
}

interface SlashCommandDef {
  category: 'alcohol' | 'coffee';
  multiplier: number;
  unit: 'standard_drink' | 'cup';
  source: string;
}

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

const SLASH_COMMAND_NAMES = Object.keys(SLASH_COMMANDS).join('|');

const NUMBER_PATTERN = /(\d+)/;

function parseNumber(token: string): number | null {
  const digitMatch = NUMBER_PATTERN.exec(token);
  if (digitMatch) return parseInt(digitMatch[1], 10);
  const written = WRITTEN_NUMBERS[token.toLowerCase()];
  return written ?? null;
}

interface SlashCommandArgs {
  displayCount: number;
  degreeOverride?: number;
  dayDate: Date | null;
  time: { hours: number; minutes: number } | null;
  soirAfterDay: boolean;
}

const EVENING_HOUR = 21;

function parseSlashCommandArgs(tokens: string[]): SlashCommandArgs {
  const args: SlashCommandArgs = {
    displayCount: 1,
    dayDate: null,
    time: null,
    soirAfterDay: false,
  };

  for (const token of tokens) {
    const qtsMatch = /^qts:(\d+)$/i.exec(token);
    if (qtsMatch) {
      args.displayCount = parseInt(qtsMatch[1], 10);
      continue;
    }

    const tokenLower = token.toLowerCase();
    if (tokenLower === 'soir' && args.dayDate !== null) {
      args.soirAfterDay = true;
      continue;
    }

    const resolvedDay = resolveDay(tokenLower);
    if (resolvedDay) {
      args.dayDate = resolvedDay;
      continue;
    }

    const parsedTime = parseTime(token);
    if (parsedTime) {
      args.time = parsedTime;
      continue;
    }

    const degree = /^(\d+)$/.exec(token);
    if (degree) {
      args.degreeOverride = parseInt(degree[1], 10);
    }
  }

  return args;
}

function resolveConsumedAt({
  dayDate,
  time,
  soirAfterDay,
}: SlashCommandArgs): string | undefined {
  if (!dayDate && !time && !soirAfterDay) return undefined;

  const baseDate = dayDate ?? new Date();
  if (!dayDate) {
    baseDate.setHours(0, 0, 0, 0);
  }
  if (time) {
    baseDate.setHours(time.hours, time.minutes, 0, 0);
  } else if (soirAfterDay) {
    baseDate.setHours(EVENING_HOUR, 0, 0, 0);
  }
  return baseDate.toISOString();
}

function buildSlashDrink(
  def: SlashCommandDef,
  args: SlashCommandArgs,
): ParsedDrink {
  const defaults = SOURCE_TO_DEFAULTS[def.source] ?? {
    alcoholDegree: null,
    volumeCl: null,
  };

  const drink: ParsedDrink = {
    category: def.category,
    quantity: args.displayCount * def.multiplier,
    unit: def.unit,
    source: def.source,
    displayCount: args.displayCount,
    drinkType: SOURCE_TO_DRINK_TYPE[def.source],
    alcoholDegree: args.degreeOverride ?? defaults.alcoholDegree,
    volumeCl: defaults.volumeCl,
  };

  const consumedAt = resolveConsumedAt(args);
  if (consumedAt !== undefined) {
    drink.consumedAt = consumedAt;
  }

  return drink;
}

function parseSlashCommands(text: string): {
  drinks: ParsedDrink[];
  remaining: string;
} {
  const drinks: ParsedDrink[] = [];
  let remaining = text;

  const splitPattern = new RegExp(
    `(?=\\/(?:${SLASH_COMMAND_NAMES})(?:\\s|$))`,
    'gi',
  );
  const segments = text.split(splitPattern).filter((s) => s.trim());

  for (const segment of segments) {
    const trimmedSegment = segment.trim();
    const cmdMatch = new RegExp(
      `^\\/(${SLASH_COMMAND_NAMES})(?:\\s|$)`,
      'i',
    ).exec(trimmedSegment);
    if (!cmdMatch) continue;

    const def = SLASH_COMMANDS[cmdMatch[1].toLowerCase()];
    if (!def) continue;

    remaining = remaining.replace(trimmedSegment, '');

    const argsStr = trimmedSegment.substring(cmdMatch[0].length).trim();
    const tokens = argsStr ? argsStr.split(/\s+/) : [];

    drinks.push(buildSlashDrink(def, parseSlashCommandArgs(tokens)));
  }

  return { drinks, remaining: remaining.trim() };
}

function parseNaturalLanguage(text: string): {
  drinks: ParsedDrink[];
  consumed: boolean;
} {
  const drinks: ParsedDrink[] = [];
  let workingText = text;

  workingText = workingText.replace(/\b(et|and|,|;|\+)\b/gi, ' ');

  for (const def of DRINK_DEFINITIONS) {
    const drinkMatch = def.pattern.exec(workingText);
    if (!drinkMatch) continue;

    const drinkIndex = drinkMatch.index;
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

    const drinkEnd = drinkIndex + drinkMatch[0].length;
    let removeStart = drinkIndex;
    if (parsedCount !== null && lastToken) {
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

  const leftover = workingText.replace(/\s+/g, '').replace(/[,;.!?]/g, '');
  const consumed = leftover.length === 0;

  return { drinks, consumed };
}

export function parseDrinkMessage(text: string): DrinkParseResult {
  const rawInput = text;

  if (!text || !text.trim()) {
    return { drinks: [], confident: false, rawInput };
  }

  const { drinks: slashDrinks, remaining } = parseSlashCommands(text);

  if (slashDrinks.length > 0 && !remaining) {
    return { drinks: slashDrinks, confident: true, rawInput };
  }

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
