import type {
  DestinataireDeDiffusion,
  DiffusionDue,
  IDiffusionsRepository,
  IMailerDesArticles,
} from '../../../src/modules/articles/application/diffusion/diffusions.repository';
import { buildArticleRecord } from './article.factory';

export function buildDiffusionDue(
  overrides: Partial<DiffusionDue> = {},
): DiffusionDue {
  return {
    id: 'diffusion-1',
    article: buildArticleRecord({ locale: 'en', status: 'published' }),
    ...overrides,
  };
}

export function buildDestinataire(
  overrides: Partial<DestinataireDeDiffusion> = {},
): DestinataireDeDiffusion {
  return {
    abonneId: 'abonne-1',
    email: 'jane@mail.com',
    locale: 'en',
    jetonDeDesabonnement: '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b',
    ...overrides,
  };
}

export function createMockDiffusionsRepository(): jest.Mocked<IDiffusionsRepository> {
  return {
    prendreLaProchaineDue: jest.fn().mockResolvedValue(null),
    destinatairesEnAttente: jest.fn().mockResolvedValue([]),
    reserver: jest.fn().mockResolvedValue(true),
    marquerEnvoye: jest.fn().mockResolvedValue(undefined),
    liberer: jest.fn().mockResolvedValue(undefined),
    marquerRefuse: jest.fn().mockResolvedValue(undefined),
    libererLesReservationsAbandonnees: jest.fn().mockResolvedValue(undefined),
    cloturer: jest.fn().mockResolvedValue(undefined),
    reprogrammer: jest.fn().mockResolvedValue(undefined),
  };
}

export function createMockMailerDesArticles(): jest.Mocked<IMailerDesArticles> {
  return {
    envoyerLArticle: jest.fn().mockResolvedValue(undefined),
  };
}
