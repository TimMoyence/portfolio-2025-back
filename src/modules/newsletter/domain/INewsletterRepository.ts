import type { VerrouParBoite } from '../../../common/domain/liens/verrou-par-boite';
import type {
  LienDeConfirmation,
  NewsletterSubscriber,
} from './NewsletterSubscriber';

export interface INewsletterRepository extends VerrouParBoite<INewsletterRepository> {
  trouverParBoite(boite: string): Promise<NewsletterSubscriber | null>;
  trouverParJetonDeDesabonnement(
    jeton: string,
  ): Promise<NewsletterSubscriber | null>;
  trouverLeLien(jeton: string): Promise<LienDeConfirmation | null>;
  creer(abonne: NewsletterSubscriber): Promise<NewsletterSubscriber>;
  mettreAJour(abonne: NewsletterSubscriber): Promise<NewsletterSubscriber>;
  enregistrerLeLien(lien: LienDeConfirmation): Promise<void>;
  supprimerLesLiensDe(boite: string): Promise<void>;
}
