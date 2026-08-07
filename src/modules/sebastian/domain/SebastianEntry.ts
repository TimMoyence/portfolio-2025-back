import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';

export const VALID_CATEGORIES = ['alcohol', 'coffee'] as const;
export type SebastianCategory = (typeof VALID_CATEGORIES)[number];

export const VALID_UNITS = ['standard_drink', 'cup'] as const;
export type SebastianUnit = (typeof VALID_UNITS)[number];

export const VALID_DRINK_TYPES = [
  'beer',
  'wine',
  'champagne',
  'coffee',
  'cocktail',
  'spiritueux',
  'cidre',
] as const;
export type DrinkType = (typeof VALID_DRINK_TYPES)[number];

export const DRINK_TYPE_DEFAULTS: Record<
  DrinkType,
  {
    category: SebastianCategory;
    alcoholDegree: number | null;
    volumeCl: number | null;
  }
> = {
  beer: { category: 'alcohol', alcoholDegree: 5, volumeCl: 25 },
  wine: { category: 'alcohol', alcoholDegree: 12, volumeCl: 12.5 },
  champagne: { category: 'alcohol', alcoholDegree: 12, volumeCl: 12.5 },
  coffee: { category: 'coffee', alcoholDegree: null, volumeCl: null },
  cocktail: { category: 'alcohol', alcoholDegree: 15, volumeCl: 20 },
  spiritueux: { category: 'alcohol', alcoholDegree: 40, volumeCl: 4 },
  cidre: { category: 'alcohol', alcoholDegree: 5, volumeCl: 25 },
};

const CATEGORY_UNIT_MAP: Record<SebastianCategory, SebastianUnit> = {
  alcohol: 'standard_drink',
  coffee: 'cup',
};

export interface CreateSebastianEntryProps {
  userId: string;
  category: string;
  quantity: number;
  date: string;
  notes?: string | null;
  drinkType?: string;
  alcoholDegree?: number | null;
  volumeCl?: number | null;
  consumedAt?: string;
}

export interface SebastianEntryPersistenceProps {
  id: string;
  userId: string;
  category: string;
  quantity: number;
  unit: string;
  date: Date;
  notes: string | null;
  createdAt: Date;
  drinkType: string | null;
  alcoholDegree: number | null;
  volumeCl: number | null;
  consumedAt: Date | null;
}

export class SebastianEntry {
  id?: string;
  userId: string;
  category: SebastianCategory;
  quantity: number;
  unit: SebastianUnit;
  date: Date;
  notes: string | null;
  createdAt?: Date;
  drinkType: DrinkType | null;
  alcoholDegree: number | null;
  volumeCl: number | null;
  consumedAt: Date | null;

  static create(props: CreateSebastianEntryProps): SebastianEntry {
    const userId = props.userId?.trim();
    if (!userId) {
      throw new DomainValidationError(
        "L'identifiant utilisateur est obligatoire",
      );
    }

    let category: SebastianCategory;
    let drinkType: DrinkType | null = null;
    let alcoholDegree: number | null = null;
    let volumeCl: number | null = null;

    if (props.drinkType) {
      if (!VALID_DRINK_TYPES.includes(props.drinkType as DrinkType)) {
        throw new DomainValidationError(
          `Type de boisson invalide : ${props.drinkType}. Valeurs acceptees : ${VALID_DRINK_TYPES.join(', ')}`,
        );
      }
      drinkType = props.drinkType as DrinkType;
      const defaults = DRINK_TYPE_DEFAULTS[drinkType];
      category = defaults.category;
      alcoholDegree = props.alcoholDegree ?? defaults.alcoholDegree;
      volumeCl = props.volumeCl ?? defaults.volumeCl;
    } else {
      if (!VALID_CATEGORIES.includes(props.category as SebastianCategory)) {
        throw new DomainValidationError(
          `Categorie invalide : ${props.category}. Valeurs acceptees : ${VALID_CATEGORIES.join(', ')}`,
        );
      }
      category = props.category as SebastianCategory;
      alcoholDegree = props.alcoholDegree ?? null;
      volumeCl = props.volumeCl ?? null;
    }

    if (alcoholDegree != null && (alcoholDegree <= 0 || alcoholDegree > 100)) {
      throw new DomainValidationError(
        "Le degre d'alcool doit etre compris entre 0 (exclu) et 100 (inclus)",
      );
    }

    if (volumeCl != null && volumeCl <= 0) {
      throw new DomainValidationError(
        'Le volume doit etre strictement positif',
      );
    }

    if (typeof props.quantity !== 'number' || props.quantity <= 0) {
      throw new DomainValidationError(
        'La quantite doit etre un nombre strictement positif',
      );
    }

    const parsedDate = new Date(props.date);
    if (isNaN(parsedDate.getTime())) {
      throw new DomainValidationError('Date invalide');
    }

    const unit = CATEGORY_UNIT_MAP[category];

    const entry = new SebastianEntry();
    entry.userId = userId;
    entry.category = category;
    entry.quantity = props.quantity;
    entry.unit = unit;
    entry.date = parsedDate;
    entry.notes = props.notes ?? null;
    entry.createdAt = new Date();
    entry.drinkType = drinkType;
    entry.alcoholDegree = alcoholDegree;
    entry.volumeCl = volumeCl;
    if (props.consumedAt) {
      const parsedConsumedAt = new Date(props.consumedAt);
      if (isNaN(parsedConsumedAt.getTime())) {
        throw new DomainValidationError('consumedAt invalide');
      }
      entry.consumedAt = parsedConsumedAt;
    } else {
      entry.consumedAt = new Date();
    }
    return entry;
  }

  static fromPersistence(
    props: SebastianEntryPersistenceProps,
  ): SebastianEntry {
    const entry = new SebastianEntry();
    entry.id = props.id;
    entry.userId = props.userId;
    entry.category = props.category as SebastianCategory;
    entry.quantity = Number(props.quantity);
    entry.unit = props.unit as SebastianUnit;
    entry.date = props.date;
    entry.notes = props.notes;
    entry.createdAt = props.createdAt;
    entry.drinkType = props.drinkType as DrinkType | null;
    entry.alcoholDegree =
      props.alcoholDegree != null ? Number(props.alcoholDegree) : null;
    entry.volumeCl = props.volumeCl != null ? Number(props.volumeCl) : null;
    entry.consumedAt = props.consumedAt;
    return entry;
  }
}
