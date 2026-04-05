import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';

/** Proprietes necessaires pour creer un lien Telegram. */
export interface CreateTelegramLinkProps {
  telegramUserId: number;
  userId: string;
}

/** Proprietes pour reconstruire un lien depuis la persistence. */
export interface TelegramLinkPersistenceProps {
  id: string;
  telegramUserId: number;
  userId: string;
  linkedAt: Date;
}

/** Entite domaine representant le lien entre un compte Telegram et un utilisateur en base. */
export class TelegramLink {
  id?: string;
  telegramUserId: number;
  userId: string;
  linkedAt?: Date;

  /** Cree un nouveau lien Telegram avec validation des invariants. */
  static create(props: CreateTelegramLinkProps): TelegramLink {
    if (typeof props.telegramUserId !== 'number' || props.telegramUserId <= 0) {
      throw new DomainValidationError(
        "L'identifiant Telegram doit etre un nombre positif",
      );
    }

    const userId = props.userId?.trim();
    if (!userId) {
      throw new DomainValidationError(
        "L'identifiant utilisateur est obligatoire",
      );
    }

    const link = new TelegramLink();
    link.telegramUserId = props.telegramUserId;
    link.userId = userId;
    link.linkedAt = new Date();
    return link;
  }

  /** Reconstruit un lien depuis la persistence (pas de validation). */
  static fromPersistence(props: TelegramLinkPersistenceProps): TelegramLink {
    const link = new TelegramLink();
    link.id = props.id;
    link.telegramUserId = Number(props.telegramUserId);
    link.userId = props.userId;
    link.linkedAt = props.linkedAt;
    return link;
  }
}
