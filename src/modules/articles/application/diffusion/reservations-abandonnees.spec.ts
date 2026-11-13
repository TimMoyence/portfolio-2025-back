import {
  createMockDiffusionsRepository,
  createMockMailerDesArticles,
} from '../../../../../test/factories/diffusion/diffusion.factory';
import { createMockBudgetDesEnvois } from '../../../../../test/factories/mailer.factory';
import { EnvoyerLesDiffusionsDuesUseCase } from './EnvoyerLesDiffusionsDues.useCase';

const MAINTENANT = new Date('2026-11-12T10:00:00.000Z');
const DIX_MINUTES_AVANT = new Date('2026-11-12T09:50:00.000Z');

describe('EnvoyerLesDiffusionsDuesUseCase · reservations abandonnees', () => {
  it('NL-20 · rend au tour les reservations restees en attente plus de dix minutes, avant de prendre un lot', async () => {
    const depot = createMockDiffusionsRepository();

    await new EnvoyerLesDiffusionsDuesUseCase(
      depot,
      createMockMailerDesArticles(),
      createMockBudgetDesEnvois(),
    ).executer(MAINTENANT);

    expect(depot.libererLesReservationsAbandonnees.mock.calls).toEqual([
      [DIX_MINUTES_AVANT],
    ]);
    expect(
      depot.libererLesReservationsAbandonnees.mock.invocationCallOrder[0],
    ).toBeLessThan(depot.prendreLaProchaineDue.mock.invocationCallOrder[0]);
  });
});
