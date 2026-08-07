import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';

export interface CreateTelegramLinkProps {
  telegramUserId: number;
  userId: string;
}

export interface TelegramLinkPersistenceProps {
  id: string;
  telegramUserId: number;
  userId: string;
  linkedAt: Date;
}

export class TelegramLink {
  id?: string;
  telegramUserId: number;
  userId: string;
  linkedAt?: Date;

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

  static fromPersistence(props: TelegramLinkPersistenceProps): TelegramLink {
    const link = new TelegramLink();
    link.id = props.id;
    link.telegramUserId = Number(props.telegramUserId);
    link.userId = props.userId;
    link.linkedAt = props.linkedAt;
    return link;
  }
}
