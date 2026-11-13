import type { SubscribeNewsletterCommand } from '../../../src/modules/newsletter/application/dto/SubscribeNewsletter.command';
import type { INewsletterMailer } from '../../../src/modules/newsletter/domain/INewsletterMailer';
import type { INewsletterRepository } from '../../../src/modules/newsletter/domain/INewsletterRepository';
import type {
  LienDeConfirmation,
  NewsletterSubscriber,
} from '../../../src/modules/newsletter/domain/NewsletterSubscriber';
import { sectionSurLeDepot } from '../comptes/verrou-par-boite.factory';

export function buildCommandeDAbonnement(
  overrides: Partial<SubscribeNewsletterCommand> = {},
): SubscribeNewsletterCommand {
  return {
    email: 'jane@mail.com',
    locale: 'fr',
    termsVersion: '2026-11-12',
    termsAcceptedAt: new Date('2026-11-12T10:00:00.000Z'),
    ...overrides,
  };
}

export function buildAbonne(
  overrides: Partial<NewsletterSubscriber> = {},
): NewsletterSubscriber {
  return {
    email: 'jane@mail.com',
    boite: 'jane@mail.com',
    locale: 'fr',
    status: 'pending',
    jetonDeDesabonnement: '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b',
    termsVersion: '2026-11-12',
    termsAcceptedAt: new Date('2026-11-01T10:00:00.000Z'),
    dernierMailLe: null,
    ...overrides,
  };
}

export function buildLienDeConfirmation(
  overrides: Partial<LienDeConfirmation> = {},
): LienDeConfirmation {
  return {
    jeton: '0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d',
    boite: 'jane@mail.com',
    locale: 'fr',
    expireLe: new Date('2026-11-19T10:00:00.000Z'),
    ...overrides,
  };
}

export function createMockNewsletterRepository(): jest.Mocked<INewsletterRepository> {
  const depot: jest.Mocked<INewsletterRepository> = {
    sousVerrouDeLaBoite: sectionSurLeDepot(() => depot),
    trouverParBoite: jest.fn().mockResolvedValue(null),
    trouverParJetonDeDesabonnement: jest.fn().mockResolvedValue(null),
    trouverLeLien: jest.fn().mockResolvedValue(null),
    creer: jest
      .fn()
      .mockImplementation((abonne: NewsletterSubscriber) =>
        Promise.resolve(abonne),
      ),
    mettreAJour: jest
      .fn()
      .mockImplementation((abonne: NewsletterSubscriber) =>
        Promise.resolve(abonne),
      ),
    enregistrerLeLien: jest.fn().mockResolvedValue(undefined),
    supprimerLesLiensDe: jest.fn().mockResolvedValue(undefined),
  };
  return depot;
}

export function createMockNewsletterMailer(): jest.Mocked<INewsletterMailer> {
  return {
    envoyerLaConfirmation: jest.fn().mockResolvedValue(undefined),
    envoyerDejaAbonne: jest.fn().mockResolvedValue(undefined),
  };
}

export interface DependancesDeLaNewsletter {
  readonly depot: jest.Mocked<INewsletterRepository>;
  readonly mailer: jest.Mocked<INewsletterMailer>;
}

export function createNewsletterDependances(): DependancesDeLaNewsletter {
  return {
    depot: createMockNewsletterRepository(),
    mailer: createMockNewsletterMailer(),
  };
}
