/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildCoursAvecDefi,
  buildCoursDeTest,
  creerCatalogueDeTest,
  DEFI_DE_TEST,
  ENIGMES_DE_TEST,
  PARCOURS_DE_TEST,
  buildEcranDEnigmes,
} from '../../../../../test/factories/cours.factory';
import {
  buildAnswerRecord,
  buildFreeResponseRecord,
  buildParticipantRecord,
  buildSessionRecord,
  createMockAnswersRepo,
  createMockEscapeRepo,
  createMockFreeResponsesRepo,
  createMockParticipantsRepo,
  createMockPulsesRepo,
  createMockRappelsServisRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { cleDeJalon } from '../../domain/cours/CleDeJalon';
import {
  ParticipantNotFoundError,
  SessionNotFoundError,
} from '../../domain/errors/FormationErrors';
import { LireEtatParticipantUseCase } from '../LireEtatParticipant.useCase';

const SOCLE = buildCoursAvecDefi();
const COURS = {
  ...SOCLE,
  ecrans: [...SOCLE.ecrans, buildEcranDEnigmes()] as typeof SOCLE.ecrans,
};
const SECRET = 'secret-de-test-des-jalons-assez-long-1234';
const TENTATIVES_MAX = 10;

describe('LireEtatParticipantUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let answers: ReturnType<typeof createMockAnswersRepo>;
  let freeResponses: ReturnType<typeof createMockFreeResponsesRepo>;
  let pulses: ReturnType<typeof createMockPulsesRepo>;
  let escape: ReturnType<typeof createMockEscapeRepo>;
  let rappels: ReturnType<typeof createMockRappelsServisRepo>;
  let sut: LireEtatParticipantUseCase;
  let secretInitial: string | undefined;

  beforeAll(() => {
    secretInitial = process.env.FORMATIONS_PULSE_SECRET;
    process.env.FORMATIONS_PULSE_SECRET = SECRET;
  });

  afterAll(() => {
    process.env.FORMATIONS_PULSE_SECRET = secretInitial;
  });

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug: COURS.slug, revision: 7 }),
    );
    participants = createMockParticipantsRepo();
    answers = createMockAnswersRepo();
    freeResponses = createMockFreeResponsesRepo();
    pulses = createMockPulsesRepo();
    escape = createMockEscapeRepo();
    rappels = createMockRappelsServisRepo();
    sut = new LireEtatParticipantUseCase(
      sessions,
      participants,
      answers,
      freeResponses,
      pulses,
      escape,
      rappels,
      creerCatalogueDeTest(COURS),
    );
  });

  it('rend la revision courante de la seance pour la reprise', async () => {
    const etat = await sut.execute('session-uuid', 'participant-uuid');

    expect(etat.revision).toBe(7);
    expect(etat.sessionId).toBe('session-uuid');
    expect(etat.participantId).toBe('participant-uuid');
  });

  it('ne lit que les donnees du participant porte par le jeton', async () => {
    await sut.execute('session-uuid', 'participant-uuid');

    expect(answers.listerDuParticipant).toHaveBeenCalledWith(
      'session-uuid',
      'participant-uuid',
    );
    expect(freeResponses.listerDuParticipant).toHaveBeenCalledWith(
      'session-uuid',
      'participant-uuid',
    );
    expect(pulses.listerDuParticipant).toHaveBeenCalledWith(
      'session-uuid',
      cleDeJalon('session-uuid', 'participant-uuid'),
    );
    expect(escape.listerProgressionDuParticipant).toHaveBeenCalledWith(
      'participant-uuid',
    );
  });

  it('restitue les verdicts deja obtenus, detail compris', async () => {
    answers.listerDuParticipant.mockResolvedValue([
      buildAnswerRecord({
        questionId: 'Q-TEST-FEUILLE',
        valeur: { type: 'feuille', cellules: { D2: '=(C2-B2)/B2' } },
        correcte: false,
        misconception: 'base-arrivee',
        score: 0.5,
        details: [
          { cle: 'D2', juste: false, confusion: 'base-arrivee' },
          { cle: 'D3', juste: true, confusion: null },
        ],
      }),
    ]);

    const etat = await sut.execute('session-uuid', 'participant-uuid');

    expect(etat.reponses[0].score).toBe(0.5);
    expect(etat.reponses[0].details).toEqual([
      { cle: 'D2', juste: false, libelleConfusion: expect.any(String) },
      { cle: 'D3', juste: true, libelleConfusion: null },
    ]);
    expect(etat.reponses[0].libelleConfusion).not.toBeNull();
  });

  it('separe les tentatives de defi des autres reponses libres', async () => {
    freeResponses.listerDuParticipant.mockResolvedValue([
      buildFreeResponseRecord({
        activityId: DEFI_DE_TEST,
        response: 'Seconde idée.',
        premiereReponse: 'Première idée.',
      }),
      buildFreeResponseRecord({
        activityId: 'E-REM:etape-1',
        response: 'Je reprends la base.',
      }),
    ]);

    const etat = await sut.execute('session-uuid', 'participant-uuid');

    expect(etat.defis).toEqual([
      { defiId: DEFI_DE_TEST, premiereTentative: 'Première idée.' },
    ]);
    expect(etat.reponsesLibres).toEqual([
      { activityId: 'E-REM:etape-1', response: 'Je reprends la base.' },
    ]);
  });

  it('rend le fragment des seules enigmes resolues et le reste des tentatives', async () => {
    escape.listerProgressionDuParticipant.mockResolvedValue([
      {
        participantId: 'participant-uuid',
        parcoursId: PARCOURS_DE_TEST,
        enigmeId: ENIGMES_DE_TEST[0],
        tentatives: 2,
        resolueLe: new Date('2026-09-11T09:00:00.000Z'),
      },
      {
        participantId: 'participant-uuid',
        parcoursId: PARCOURS_DE_TEST,
        enigmeId: ENIGMES_DE_TEST[1],
        tentatives: 3,
        resolueLe: null,
      },
    ]);

    const etat = await sut.execute('session-uuid', 'participant-uuid');

    expect(etat.enigmes).toEqual([
      {
        parcoursId: PARCOURS_DE_TEST,
        resolues: [{ enigmeId: ENIGMES_DE_TEST[0], fragment: 'F0' }],
        tentativesRestantes: { [ENIGMES_DE_TEST[1]]: TENTATIVES_MAX - 3 },
      },
    ]);
  });

  it('rend les jalons declares par le participant', async () => {
    pulses.listerDuParticipant.mockResolvedValue([
      { sondageId: 'jalon-test-1', etat: 'ca-va' },
    ]);

    const etat = await sut.execute('session-uuid', 'participant-uuid');

    expect(etat.jalons).toEqual([{ sondageId: 'jalon-test-1', etat: 'ca-va' }]);
  });

  it('refuse un participant rattache a une autre seance', async () => {
    participants.findById.mockResolvedValue(
      buildParticipantRecord({ sessionId: 'autre-session' }),
    );

    await expect(
      sut.execute('session-uuid', 'participant-uuid'),
    ).rejects.toThrow(ParticipantNotFoundError);
  });

  it('signale une seance introuvable', async () => {
    sessions.findById.mockResolvedValue(null);

    await expect(
      sut.execute('session-uuid', 'participant-uuid'),
    ).rejects.toThrow(SessionNotFoundError);
  });

  it('rend la liste figee des rappels deja servis', async () => {
    await rappels.figer({
      sessionId: 'session-uuid',
      participantId: 'participant-uuid',
      questionIds: ['R-COMPENSATION', 'R-MULTIPLE-NEUF'],
    });

    const etat = await sut.execute('session-uuid', 'participant-uuid');

    expect(etat.rappels.questionIds).toEqual([
      'R-COMPENSATION',
      'R-MULTIPLE-NEUF',
    ]);
  });

  it('rend un etat vide quand le participant n a encore rien envoye', async () => {
    sut = new LireEtatParticipantUseCase(
      sessions,
      participants,
      answers,
      freeResponses,
      pulses,
      escape,
      rappels,
      creerCatalogueDeTest(buildCoursDeTest({ slug: COURS.slug })),
    );

    const etat = await sut.execute('session-uuid', 'participant-uuid');

    expect(etat.reponses).toEqual([]);
    expect(etat.reponsesLibres).toEqual([]);
    expect(etat.jalons).toEqual([]);
    expect(etat.enigmes).toEqual([]);
    expect(etat.defis).toEqual([]);
    expect(etat.rappels).toEqual({ questionIds: [] });
  });
});
