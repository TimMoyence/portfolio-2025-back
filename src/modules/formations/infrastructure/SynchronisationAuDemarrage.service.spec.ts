/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildContenuAPublierB2_01,
  createMockPublicationDesCours,
} from '../../../../test/factories/cours-b2-01.factory';
import {
  espionnerLeLogger,
  silenceNestLogger,
} from '../../../../test/helpers/silence-nest-logger';
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

  it('M12 · nomme chaque cours non publié et sa cause, et publie les cours suivants', async () => {
    const premier = buildContenuAPublierB2_01();
    const second = { ...premier, slug: 'b2-01-seconde-copie' };
    const { publication, service } = monter([premier, second]);
    publication.publier
      .mockRejectedValueOnce(new Error('base indisponible'))
      .mockResolvedValueOnce(1);
    const erreur = espionnerLeLogger('error');
    const journal = espionnerLeLogger('log');

    await service.onApplicationBootstrap();

    expect(erreur).toHaveBeenCalledWith(
      `Cours ${premier.slug} non publié : base indisponible`,
      expect.any(String),
    );
    expect(journal).toHaveBeenCalledWith(
      'Cours b2-01-seconde-copie publié en version 1',
    );
    expect(erreur).not.toHaveBeenCalledWith(
      expect.stringContaining('reste servie'),
      expect.any(String),
    );
  });

  it('M12 · nomme chaque cours resté sans version quand la structure refuse toute la publication', async () => {
    const premier = buildContenuAPublierB2_01();
    const fautif = {
      ...premier,
      slug: 'b2-01-fautif',
      dureeMinutes: premier.dureeMinutes + 1,
    };
    const { publication, service } = monter([premier, fautif]);
    const erreur = espionnerLeLogger('error');

    await service.onApplicationBootstrap();

    expect(publication.publier).not.toHaveBeenCalled();
    expect(erreur).toHaveBeenCalledWith(
      expect.stringMatching(
        new RegExp(
          `^Synchronisation des cours refusée, aucun cours publié \\(${premier.slug}, b2-01-fautif\\) : `,
        ),
      ),
      expect.any(String),
    );
  });

  it('journalise l échec de la publication sans empêcher le démarrage du reste de l API', async () => {
    const { publication, service } = monter();
    publication.publier.mockRejectedValue(new Error('base indisponible'));
    const erreur = espionnerLeLogger('error');

    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();

    expect(erreur).toHaveBeenCalledWith(
      expect.stringContaining('base indisponible'),
      expect.any(String),
    );
  });
});
