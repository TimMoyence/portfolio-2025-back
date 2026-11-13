import {
  buildDestinataire,
  buildDiffusionDue,
  createMockDiffusionsRepository,
  createMockMailerDesArticles,
} from '../../../../../test/factories/diffusion/diffusion.factory';
import { createMockBudgetDesEnvois } from '../../../../../test/factories/mailer.factory';
import type {
  IDiffusionsRepository,
  IMailerDesArticles,
} from './diffusions.repository';
import {
  EnvoyerLesDiffusionsDuesUseCase,
  TAILLE_D_UN_LOT,
} from './EnvoyerLesDiffusionsDues.useCase';

const MAINTENANT = new Date('2026-11-12T10:00:00.000Z');

function envoi(
  depot: IDiffusionsRepository,
  mailer: IMailerDesArticles,
  budget = createMockBudgetDesEnvois(),
): EnvoyerLesDiffusionsDuesUseCase {
  return new EnvoyerLesDiffusionsDuesUseCase(depot, mailer, budget);
}

describe('EnvoyerLesDiffusionsDuesUseCase', () => {
  it('NL-16 · ne prend aucune diffusion quand le budget du jour est epuise', async () => {
    const depot = createMockDiffusionsRepository();
    depot.prendreLaProchaineDue.mockResolvedValue(buildDiffusionDue());
    const budget = createMockBudgetDesEnvois(0);

    await envoi(depot, createMockMailerDesArticles(), budget).executer(
      MAINTENANT,
    );

    expect(budget.restantPourLaDiffusion.mock.calls).toEqual([[MAINTENANT]]);
    expect(depot.prendreLaProchaineDue.mock.calls).toEqual([]);
  });

  it('NL-16 · reduit le lot au budget restant et laisse la diffusion ouverte pour le lendemain', async () => {
    const depot = createMockDiffusionsRepository();
    const diffusion = buildDiffusionDue();
    depot.prendreLaProchaineDue.mockResolvedValue(diffusion);
    depot.destinatairesEnAttente.mockResolvedValue([buildDestinataire()]);

    await envoi(
      depot,
      createMockMailerDesArticles(),
      createMockBudgetDesEnvois(1),
    ).executer(MAINTENANT);

    expect(depot.destinatairesEnAttente.mock.calls).toEqual([
      [diffusion.id, 'en', 1],
    ]);
    expect(depot.cloturer.mock.calls).toEqual([]);
  });

  it('NL-20 NL-11 · envoie l article due a chaque abonne confirme de sa langue, reserve une seule fois, puis clot la diffusion', async () => {
    const depot = createMockDiffusionsRepository();
    const mailer = createMockMailerDesArticles();
    const diffusion = buildDiffusionDue();
    const jane = buildDestinataire();
    const john = buildDestinataire({
      abonneId: 'abonne-2',
      email: 'john@mail.com',
    });
    depot.prendreLaProchaineDue.mockResolvedValue(diffusion);
    depot.destinatairesEnAttente.mockResolvedValue([jane, john]);
    depot.reserver.mockImplementation((_id, abonneId) =>
      Promise.resolve(abonneId !== 'abonne-2'),
    );

    await envoi(depot, mailer).executer(MAINTENANT);

    expect(depot.prendreLaProchaineDue.mock.calls).toEqual([[MAINTENANT]]);
    expect(depot.destinatairesEnAttente.mock.calls).toEqual([
      [diffusion.id, 'en', TAILLE_D_UN_LOT],
    ]);
    expect(mailer.envoyerLArticle.mock.calls).toEqual([
      [diffusion.article, jane],
    ]);
    expect(depot.marquerEnvoye.mock.calls).toEqual([
      [diffusion.id, 'abonne-1'],
    ]);
    expect(depot.cloturer.mock.calls).toEqual([[diffusion.id]]);
  });

  it('NL-20 · reprend au tour suivant un abonne dont l envoi a echoue, sans clore la diffusion', async () => {
    const depot = createMockDiffusionsRepository();
    const mailer = createMockMailerDesArticles();
    const diffusion = buildDiffusionDue();
    depot.prendreLaProchaineDue.mockResolvedValue(diffusion);
    depot.destinatairesEnAttente.mockResolvedValue([
      buildDestinataire(),
      buildDestinataire({ abonneId: 'abonne-2', email: 'john@mail.com' }),
    ]);
    mailer.envoyerLArticle.mockRejectedValueOnce(new Error('421 relais'));

    await expect(envoi(depot, mailer).executer(MAINTENANT)).rejects.toThrow(
      '421 relais',
    );

    expect(depot.liberer.mock.calls).toEqual([[diffusion.id, 'abonne-1']]);
    expect(mailer.envoyerLArticle.mock.calls).toHaveLength(1);
    expect(depot.marquerEnvoye.mock.calls).toEqual([]);
    expect(depot.cloturer.mock.calls).toEqual([]);
  });

  it('NL-16 · laisse la diffusion ouverte quand le lot est plein, pour le tour suivant', async () => {
    const depot = createMockDiffusionsRepository();
    depot.prendreLaProchaineDue.mockResolvedValue(buildDiffusionDue());
    depot.destinatairesEnAttente.mockResolvedValue(
      Array.from({ length: TAILLE_D_UN_LOT }, (_, rang) =>
        buildDestinataire({ abonneId: `abonne-${rang}` }),
      ),
    );

    await envoi(depot, createMockMailerDesArticles()).executer(MAINTENANT);

    expect(depot.cloturer.mock.calls).toEqual([]);
  });

  it('NL-04 · ne fait rien sans diffusion due', async () => {
    const depot = createMockDiffusionsRepository();
    const mailer = createMockMailerDesArticles();

    await envoi(depot, mailer).executer(MAINTENANT);

    expect(mailer.envoyerLArticle.mock.calls).toEqual([]);
    expect(depot.destinatairesEnAttente.mock.calls).toEqual([]);
  });
});
