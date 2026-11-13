import {
  buildAbonne,
  createMockNewsletterRepository,
} from '../../../../test/factories/diffusion/newsletter.factory';
import { UnsubscribeNewsletterUseCase } from './UnsubscribeNewsletter.useCase';

describe('UnsubscribeNewsletterUseCase · sous le verrou de la boîte', () => {
  it('NL-10 NL-13 · desabonne l abonne relu sous le verrou, sans ecraser ce qu une demande ou un clic vient d ecrire', async () => {
    const depot = createMockNewsletterRepository();
    const lu = buildAbonne({
      status: 'pending',
      locale: 'fr',
      dernierMailLe: new Date('2026-11-12T09:00:00.000Z'),
    });
    const relu = {
      ...lu,
      status: 'confirmed' as const,
      locale: 'en' as const,
      dernierMailLe: new Date('2026-11-12T10:00:00.000Z'),
    };
    depot.trouverParJetonDeDesabonnement.mockResolvedValue(lu);
    depot.trouverParBoite.mockImplementation((boite) =>
      Promise.resolve(boite === lu.boite ? relu : null),
    );

    await new UnsubscribeNewsletterUseCase(depot).execute(
      lu.jetonDeDesabonnement,
    );

    expect(depot.mettreAJour.mock.calls).toEqual([
      [{ ...relu, status: 'unsubscribed' }],
    ]);
  });
});
