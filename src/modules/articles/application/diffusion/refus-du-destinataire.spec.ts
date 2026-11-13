import { RefusDuDestinataire } from '../../../../common/domain/errors/RefusDuDestinataire';
import {
  buildDestinataire,
  buildDiffusionDue,
  createMockDiffusionsRepository,
  createMockMailerDesArticles,
} from '../../../../../test/factories/diffusion/diffusion.factory';
import { createMockBudgetDesEnvois } from '../../../../../test/factories/mailer.factory';
import { EnvoyerLesDiffusionsDuesUseCase } from './EnvoyerLesDiffusionsDues.useCase';

describe('EnvoyerLesDiffusionsDuesUseCase · refus du destinataire', () => {
  it('NL-20 · ecarte une adresse refusee definitivement et sert les abonnes suivants', async () => {
    const depot = createMockDiffusionsRepository();
    const mailer = createMockMailerDesArticles();
    const diffusion = buildDiffusionDue();
    const john = buildDestinataire({ abonneId: 'abonne-2' });
    depot.prendreLaProchaineDue.mockResolvedValue(diffusion);
    depot.destinatairesEnAttente.mockResolvedValue([buildDestinataire(), john]);
    mailer.envoyerLArticle.mockRejectedValueOnce(
      new RefusDuDestinataire('550 adresse inconnue'),
    );

    await new EnvoyerLesDiffusionsDuesUseCase(
      depot,
      mailer,
      createMockBudgetDesEnvois(),
    ).executer(new Date('2026-11-12T10:00:00.000Z'));

    expect(depot.marquerRefuse.mock.calls).toEqual([
      [diffusion.id, 'abonne-1'],
    ]);
    expect(depot.liberer.mock.calls).toEqual([]);
    expect(depot.marquerEnvoye.mock.calls).toEqual([
      [diffusion.id, 'abonne-2'],
    ]);
  });
});
