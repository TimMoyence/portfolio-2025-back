import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';

/** Categories de consommation valides. */
export const VALID_CATEGORIES = ['alcohol', 'coffee'] as const;
/** Type de categorie de consommation. */
export type SebastianCategory = (typeof VALID_CATEGORIES)[number];

/** Unites de mesure valides. */
export const VALID_UNITS = ['standard_drink', 'cup'] as const;
/** Type d'unite de mesure. */
export type SebastianUnit = (typeof VALID_UNITS)[number];

/** Correspondance entre categorie et unite attendue. */
const CATEGORY_UNIT_MAP: Record<SebastianCategory, SebastianUnit> = {
  alcohol: 'standard_drink',
  coffee: 'cup',
};

/** Proprietes necessaires pour creer une entree Sebastian. */
export interface CreateSebastianEntryProps {
  userId: string;
  category: string;
  quantity: number;
  date: string;
  notes?: string | null;
}

/** Proprietes pour reconstruire une entree depuis la persistence. */
export interface SebastianEntryPersistenceProps {
  id: string;
  userId: string;
  category: string;
  quantity: number;
  unit: string;
  date: Date;
  notes: string | null;
  createdAt: Date;
}

/** Entite domaine representant une entree de consommation (alcool ou cafe). */
export class SebastianEntry {
  id?: string;
  userId: string;
  category: SebastianCategory;
  quantity: number;
  unit: SebastianUnit;
  date: Date;
  notes: string | null;
  createdAt?: Date;

  /**
   * Cree une nouvelle entree de consommation avec validation des invariants.
   * L'unite est determinee automatiquement depuis la categorie.
   */
  static create(props: CreateSebastianEntryProps): SebastianEntry {
    const userId = props.userId?.trim();
    if (!userId) {
      throw new DomainValidationError(
        "L'identifiant utilisateur est obligatoire",
      );
    }

    if (!VALID_CATEGORIES.includes(props.category as SebastianCategory)) {
      throw new DomainValidationError(
        `Categorie invalide : ${props.category}. Valeurs acceptees : ${VALID_CATEGORIES.join(', ')}`,
      );
    }
    const category = props.category as SebastianCategory;

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
    return entry;
  }

  /** Reconstruit une entree depuis la persistence (pas de validation). */
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
    return entry;
  }
}
