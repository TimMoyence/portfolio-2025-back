/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildCoursDeTest,
  creerCatalogueDeTest,
} from '../../../../../test/factories/cours.factory';
import {
  buildParticipantRecord,
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
  PARTICIPANT_DE_TEST,
} from '../../../../../test/factories/formation.factory';
import { verifierLectureDeSeanceEtCours } from '../../../../../test/helpers/gardes-de-seance';
import {
  ParticipantNotFoundError,
  SessionClosedError,
} from '../../domain/errors/FormationErrors';
import { ParticipationEnSeance } from '../ParticipationEnSeance';

describe('ParticipationEnSeance', () => {
  const COURS = buildCoursDeTest();
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let sut: ParticipationEnSeance;

  const terminer = () =>
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug: COURS.slug, etat: 'terminee' }),
    );

  beforeEach(() => {
    sessions = createMockSessionsRepo({ courseSlug: COURS.slug });
    participants = createMockParticipantsRepo();
    participants.findById.mockResolvedValue(buildParticipantRecord());
    cache = createMockSessionStateCache();
    sut = new ParticipationEnSeance(
      sessions,
      participants,
      creerCatalogueDeTest(COURS),
      cache,
    );
  });

  verifierLectureDeSeanceEtCours(
    'rend la séance ouverte et son cours, sans lire le participant que la garde du jeton a déjà vérifié',
    () => ({
      sessions,
      courseSlug: COURS.slug,
      lire: async () => {
        const lue = await sut.ouverte(PARTICIPANT_DE_TEST);
        expect(participants.findById).not.toHaveBeenCalled();
        return lue;
      },
    }),
  );

  it('refuse une séance fermée aux réponses', async () => {
    terminer();

    await expect(sut.ouverte(PARTICIPANT_DE_TEST)).rejects.toBeInstanceOf(
      SessionClosedError,
    );
  });

  it('lit le contexte du participant même séance terminée', async () => {
    terminer();

    const contexte = await sut.contexte(PARTICIPANT_DE_TEST);

    expect(contexte.session.etat).toBe('terminee');
    expect(contexte.participant.id).toBe('participant-uuid');
    expect(contexte.cours.slug).toBe(COURS.slug);
  });

  it('rend le participant désigné par la commande', async () => {
    const participant = await sut.participant(PARTICIPANT_DE_TEST);

    expect(participant.id).toBe('participant-uuid');
  });

  it('signale un participant disparu du dépôt', async () => {
    participants.findById.mockResolvedValue(null);

    await expect(sut.participant(PARTICIPANT_DE_TEST)).rejects.toBeInstanceOf(
      ParticipantNotFoundError,
    );
  });

  it('signale l activité de la séance au cache', () => {
    sut.signalerActivite('session-uuid');

    expect(cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
  });
});
