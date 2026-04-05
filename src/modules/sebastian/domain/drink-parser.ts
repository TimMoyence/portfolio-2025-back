/** Boisson parsee depuis un message Telegram. */
export interface ParsedDrink {
  category: 'alcohol' | 'coffee';
  quantity: number;
  unit: 'standard_drink' | 'cup';
  source: string;
  displayCount: number;
}

/** Resultat du parsing d'un message. */
export interface DrinkParseResult {
  drinks: ParsedDrink[];
  confident: boolean;
  rawInput: string;
}

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

const NUMBER_PATTERN = /(\d+)/;

/** Extrait un nombre (chiffre ou ecrit) d'un token. */
function parseNumber(token: string): number | null {
  const digitMatch = token.match(NUMBER_PATTERN);
  if (digitMatch) return parseInt(digitMatch[1], 10);
  const written = WRITTEN_NUMBERS[token.toLowerCase()];
  return written ?? null;
}

/** Parse les commandes slash depuis un message (/pint 4 /coffee 2). */
function parseSlashCommands(text: string): {
  drinks: ParsedDrink[];
  remaining: string;
} {
  const drinks: ParsedDrink[] = [];
  let remaining = text;

  const slashPattern =
    /\/(pint|beer|coffee|biere|bière|cafe|café|pinte)(?:\s+(\d+))?/gi;
  let match: RegExpExecArray | null;

  while ((match = slashPattern.exec(text)) !== null) {
    const command = match[1].toLowerCase();
    const count = match[2] ? parseInt(match[2], 10) : 1;

    let category: 'alcohol' | 'coffee';
    let multiplier: number;
    let unit: 'standard_drink' | 'cup';
    let source: string;

    if (/^pint(?:e)?$/i.test(command)) {
      category = 'alcohol';
      multiplier = 2;
      unit = 'standard_drink';
      source = 'pint';
    } else if (/^(?:beer|bi[eè]re)$/i.test(command)) {
      category = 'alcohol';
      multiplier = 1;
      unit = 'standard_drink';
      source = 'beer';
    } else {
      category = 'coffee';
      multiplier = 1;
      unit = 'cup';
      source = 'coffee';
    }

    drinks.push({
      category,
      quantity: count * multiplier,
      unit,
      source,
      displayCount: count,
    });

    remaining = remaining.replace(match[0], ' ');
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

    drinks.push({
      category: def.category,
      quantity: count * def.multiplier,
      unit: def.unit,
      source: def.source,
      displayCount: count,
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
