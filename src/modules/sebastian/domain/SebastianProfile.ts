import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';

/** Proprietes necessaires pour creer un profil Sebastian. */
export interface CreateSebastianProfileProps {
  userId: string;
  weightKg: number;
  widmarkR: number;
}

/** Proprietes pour reconstruire un profil depuis la persistence. */
export interface SebastianProfilePersistenceProps {
  id: string;
  userId: string;
  weightKg: number;
  widmarkR: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Valeurs par defaut du profil pour le calcul BAC. */
export const DEFAULT_PROFILE = { weightKg: 70, widmarkR: 0.68 };

/** Profil utilisateur pour le calcul du taux d'alcool (BAC). */
export class SebastianProfile {
  id?: string;
  userId: string;
  weightKg: number;
  widmarkR: number;
  createdAt?: Date;
  updatedAt?: Date;

  /**
   * Cree un nouveau profil utilisateur avec validation des invariants.
   * Le poids doit etre entre 30 et 300 kg, le facteur Widmark entre 0.1 et 1.0.
   */
  static create(props: CreateSebastianProfileProps): SebastianProfile {
    const userId = props.userId?.trim();
    if (!userId) {
      throw new DomainValidationError(
        "L'identifiant utilisateur est obligatoire",
      );
    }

    if (
      typeof props.weightKg !== 'number' ||
      props.weightKg < 30 ||
      props.weightKg > 300
    ) {
      throw new DomainValidationError(
        'Le poids doit etre compris entre 30 et 300 kg',
      );
    }

    if (
      typeof props.widmarkR !== 'number' ||
      props.widmarkR < 0.1 ||
      props.widmarkR > 1.0
    ) {
      throw new DomainValidationError(
        'Le facteur Widmark doit etre compris entre 0.1 et 1.0',
      );
    }

    const profile = new SebastianProfile();
    profile.userId = userId;
    profile.weightKg = props.weightKg;
    profile.widmarkR = props.widmarkR;
    profile.createdAt = new Date();
    profile.updatedAt = new Date();
    return profile;
  }

  /** Reconstruit un profil depuis la persistence (pas de validation). */
  static fromPersistence(
    props: SebastianProfilePersistenceProps,
  ): SebastianProfile {
    const profile = new SebastianProfile();
    profile.id = props.id;
    profile.userId = props.userId;
    profile.weightKg = Number(props.weightKg);
    profile.widmarkR = Number(props.widmarkR);
    profile.createdAt = props.createdAt;
    profile.updatedAt = props.updatedAt;
    return profile;
  }
}
