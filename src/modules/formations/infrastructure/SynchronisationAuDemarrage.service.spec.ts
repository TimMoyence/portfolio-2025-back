/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import {
  buildContenuAPublierB2_01,
  createMockPublicationDesCours,
} from '../../../../test/factories/cours-b2-01.factory';
import { silenceNestLogger } from '../../../../test/helpers/silence-nest-logger';
import { SynchroniserCoursUseCase } from '../application/SynchroniserCours.useCase';
import { empreinteCanonique } from '../domain/cours/EmpreinteCanonique';
import { SynchronisationAuDemarrageService } from './SynchronisationAuDemarrage.service';

describe('SynchronisationAuDemarrageService', () => {
  silenceNestLogger(['log', 'error']);

  function monter(contenus = [buildContenuAPublierB2_01()]) {
    const publication = createMockPublicationDesCours();
    const service = new SynchronisationAuDemarrageService(
      new SynchroniserCoursUseCase(publication),
      contenus,
    );
    return { publication, service, contenus };
  }

  it('publie au démarrage le cours du dépôt quand la base ne le connaît pas', async () => {
    const { publication, service, contenus } = monter();

    await service.onApplicationBootstrap();

    expect(publication.publier).toHaveBeenCalledWith(
      contenus[0],
      empreinteCanonique(contenus[0]),
    );
  });

  it('journalise l échec de la publication sans empêcher le démarrage du reste de l API', async () => {
    const { publication, service } = monter();
    publication.publier.mockRejectedValue(new Error('base indisponible'));
    const erreur = jest.spyOn(Logger.prototype, 'error');

    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();

    expect(erreur).toHaveBeenCalledWith(
      expect.stringContaining('base indisponible'),
      expect.any(String),
    );
  });
});
