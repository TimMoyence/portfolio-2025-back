import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';
import type { ArticleRecord } from '../articles.repository';

export const DELAI_AVANT_ENVOI_MS = 90 * 60_000;

export const DIFFUSIONS_REPOSITORY = Symbol('DIFFUSIONS_REPOSITORY');
export const MAILER_DES_ARTICLES = Symbol('MAILER_DES_ARTICLES');

export interface DiffusionDue {
  readonly id: string;
  readonly article: ArticleRecord;
}

export interface DestinataireDeDiffusion {
  readonly abonneId: string;
  readonly email: string;
  readonly locale: SupportedLocale;
  readonly jetonDeDesabonnement: string;
}

export interface IDiffusionsRepository {
  prendreLaProchaineDue(maintenant: Date): Promise<DiffusionDue | null>;
  destinatairesEnAttente(
    diffusionId: string,
    locale: SupportedLocale,
    limite: number,
  ): Promise<readonly DestinataireDeDiffusion[]>;
  reserver(diffusionId: string, abonneId: string): Promise<boolean>;
  marquerEnvoye(diffusionId: string, abonneId: string): Promise<void>;
  liberer(diffusionId: string, abonneId: string): Promise<void>;
  marquerRefuse(diffusionId: string, abonneId: string): Promise<void>;
  libererLesReservationsAbandonnees(reserveesAvant: Date): Promise<void>;
  cloturer(diffusionId: string): Promise<void>;
  reprogrammer(articleRecordId: string, envoiApres: Date): Promise<void>;
}

export interface IMailerDesArticles {
  envoyerLArticle(
    article: ArticleRecord,
    destinataire: DestinataireDeDiffusion,
  ): Promise<void>;
}
