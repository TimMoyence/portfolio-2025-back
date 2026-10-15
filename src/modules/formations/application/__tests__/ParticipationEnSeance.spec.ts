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
    'rend la séance ouverte et son cours au participant actif',
    () => ({
      sessions,
      courseSlug: COURS.slug,
      lire: () => sut.ouverte(PARTICIPANT_DE_TEST),
    }),
  );

  it('refuse une séance fermée aux réponses avant de lire le participant', async () => {
    terminer();

    await expect(sut.ouverte(PARTICIPANT_DE_TEST)).rejects.toBeInstanceOf(
      SessionClosedError,
    );
    expect(participants.findById).not.toHaveBeenCalled();
  });

  it.each([
    ['évincé', 'ouverte', { evinceLe: new Date() }],
    ['d une autre séance', 'contexte', { sessionId: 'autre-session' }],
  ] as const)('refuse un participant %s (%s)', async (_cas, lecture, etat) => {
    participants.findById.mockResolvedValue(buildParticipantRecord(etat));

    await expect(sut[lecture](PARTICIPANT_DE_TEST)).rejects.toBeInstanceOf(
      ParticipantNotFoundError,
    );
  });

  it('lit le contexte du participant même séance terminée', async () => {
    terminer();

    const contexte = await sut.contexte(PARTICIPANT_DE_TEST);

    expect(contexte.session.etat).toBe('terminee');
    expect(contexte.participant.id).toBe('participant-uuid');
    expect(contexte.cours.slug).toBe(COURS.slug);
  });

  it('rend la séance ouverte et son cours sans lire le participant', async () => {
    const lue = await sut.seanceEtCours('session-uuid');

    expect(lue.session.id).toBe('session-uuid');
    expect(lue.cours.slug).toBe(COURS.slug);
    expect(participants.findById).not.toHaveBeenCalled();
  });

  it('refuse la séance et son cours quand les réponses sont closes', async () => {
    terminer();

    await expect(sut.seanceEtCours('session-uuid')).rejects.toBeInstanceOf(
      SessionClosedError,
    );
  });

  it('rend le participant actif désigné par la commande', async () => {
    const commande = { ...PARTICIPANT_DE_TEST, questionId: 'q-1' };

    const participant = await sut.participantActif(commande);

    expect(participant.id).toBe('participant-uuid');
  });

  it('signale l activité de la séance au cache', () => {
    sut.signalerActivite('session-uuid');

    expect(cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
  });
});
