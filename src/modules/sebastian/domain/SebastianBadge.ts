import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { VALID_BADGE_KEYS } from './badge-catalog';

/** Categories valides pour les badges. */
export const VALID_BADGE_CATEGORIES = ['alcohol', 'coffee', 'global'] as const;
/** Type de categorie de badge. */
export type BadgeCategory = (typeof VALID_BADGE_CATEGORIES)[number];

/** Proprietes necessaires pour creer un badge Sebastian. */
export interface CreateSebastianBadgeProps {
  userId: string;
  badgeKey: string;
  category: BadgeCategory;
}

/** Proprietes pour reconstruire un badge depuis la persistence. */
export interface SebastianBadgePersistenceProps {
  id: string;
  userId: string;
  badgeKey: string;
  category: string;
  unlockedAt: Date;
}

/** Entite domaine representant un badge debloque par un utilisateur. */
export class SebastianBadge {
  id?: string;
  userId: string;
  badgeKey: string;
  category: BadgeCategory;
  unlockedAt: Date;

  /**
   * Cree un nouveau badge avec validation des invariants.
   * Le badgeKey doit correspondre a une entree du catalogue.
   */
  static create(props: CreateSebastianBadgeProps): SebastianBadge {
    const userId = props.userId?.trim();
    if (!userId) {
      throw new DomainValidationError(
        "L'identifiant utilisateur est obligatoire",
      );
    }

    if (!VALID_BADGE_KEYS.includes(props.badgeKey)) {
      throw new DomainValidationError(
        `Cle de badge invalide : ${props.badgeKey}. Valeurs acceptees : ${VALID_BADGE_KEYS.join(', ')}`,
      );
    }

    if (!VALID_BADGE_CATEGORIES.includes(props.category)) {
      throw new DomainValidationError(
        `Categorie invalide : ${props.category}. Valeurs acceptees : ${VALID_BADGE_CATEGORIES.join(', ')}`,
      );
    }

    const badge = new SebastianBadge();
    badge.userId = userId;
    badge.badgeKey = props.badgeKey;
    badge.category = props.category;
    badge.unlockedAt = new Date();
    return badge;
  }

  /** Reconstruit un badge depuis la persistence (pas de validation). */
  static fromPersistence(
    props: SebastianBadgePersistenceProps,
  ): SebastianBadge {
    const badge = new SebastianBadge();
    badge.id = props.id;
    badge.userId = props.userId;
    badge.badgeKey = props.badgeKey;
    badge.category = props.category as BadgeCategory;
    badge.unlockedAt = props.unlockedAt;
    return badge;
  }
}
