/* eslint-disable @typescript-eslint/unbound-method */
import { B2_COURS_V3 } from '../../../../migrations/data/b2-v3.cours';
import { creerCatalogueAVersions } from '../../../../../test/factories/cours.factory';
import {
  buildMasteryRecord,
  buildParticipantRecord,
  buildSessionRecord,
  createMockAnswersRepo,
  createMockMasteryRepo,
  createMockParticipantsRepo,
  createMockRappelsServisRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { lireCoursStocke } from '../../domain/cours/CoursStocke';
import {
  EcranNonServiError,
  ParticipantNotFoundError,
  RappelsIndisponiblesError,
} from '../../domain/errors/FormationErrors';
import { LireRappelsUseCase } from '../LireRappels.useCase';

const COURS = lireCoursStocke(B2_COURS_V3);
const DERNIER_ECRAN = COURS.ecrans.length - 1;
const OBLIGATOIRES = ['b2-01-r-compensation', 'b2-01-r-multiple-neuf'];

describe('LireRappelsUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let answers: ReturnType<typeof createMockAnswersRepo>;
  let mastery: ReturnType<typeof createMockMasteryRepo>;
  let rappels: ReturnType<typeof createMockRappelsServisRepo>;
  let sut: LireRappelsUseCase;

  const monter = (): LireRappelsUseCase =>
    new LireRappelsUseCase(
      sessions,
      participants,
      answers,
      mastery,
      rappels,
      creerCatalogueAVersions({ [COURS.slug]: { 3: COURS } }),
    );

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({
        courseSlug: COURS.slug,
        courseVersion: 3,
        ecranCourant: DERNIER_ECRAN,
      }),
    );
    participants = createMockParticipantsRepo();
    participants.findById.mockResolvedValue(
      buildParticipantRecord({ seed: 11 }),
    );
    answers = createMockAnswersRepo();
    mastery = createMockMasteryRepo();
    rappels = createMockRappelsServisRepo();
    sut = monter();
  });

  it('sert trois a quatre questions dont les deux obligatoires', async () => {
    const { questions } = await sut.execute('session-uuid', 'participant-uuid');

    expect(questions.length).toBeGreaterThanOrEqual(3);
    expect(questions.length).toBeLessThanOrEqual(4);
    expect(
      questions.slice(0, 2).map((question) => question.questionId),
    ).toEqual(OBLIGATOIRES);
  });

  it('sert des options a identifiants stables et un enonce, sans bonne reponse', async () => {
    const { questions } = await sut.execute('session-uuid', 'participant-uuid');

    for (const question of questions) {
      expect(question.enonce.length).toBeGreaterThan(0);
      expect(question.options.length).toBeGreaterThan(1);
      for (const option of question.options) {
        expect(
          Object.keys(option).sort((gauche, droite) =>
            gauche.localeCompare(droite),
          ),
        ).toEqual(['id', 'libelle']);
      }
    }
  });

  it('fige la liste au premier appel et la resert telle quelle', async () => {
    const premier = await sut.execute('session-uuid', 'participant-uuid');
    answers.listerDuParticipant.mockResolvedValue([]);

    const second = await sut.execute('session-uuid', 'participant-uuid');

    expect(rappels.figer).toHaveBeenCalledTimes(1);
    expect(second.questions.map((question) => question.questionId)).toEqual(
      premier.questions.map((question) => question.questionId),
    );
  });

  it('rend la boite de Leitner du concept, ou la premiere par defaut', async () => {
    mastery.findByStudentKey.mockResolvedValue([
      buildMasteryRecord({ concept: 'controle-coherence', boite: 3 }),
    ]);

    const { questions } = await sut.execute('session-uuid', 'participant-uuid');

    expect(questions[0].boite).toBe(3);
    expect(questions[questions.length - 1].boite).toBe(1);
  });

  it('refuse un ecran de rappel non projete', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({
        courseSlug: COURS.slug,
        courseVersion: 3,
        ecranCourant: 0,
      }),
    );

    await expect(
      sut.execute('session-uuid', 'participant-uuid'),
    ).rejects.toThrow(EcranNonServiError);
  });

  it('refuse un participant rattache a une autre seance', async () => {
    participants.findById.mockResolvedValue(
      buildParticipantRecord({ sessionId: 'autre-session' }),
    );

    await expect(
      sut.execute('session-uuid', 'participant-uuid'),
    ).rejects.toThrow(ParticipantNotFoundError);
  });

  it('refuse un participant evince', async () => {
    participants.findById.mockResolvedValue(
      buildParticipantRecord({ evinceLe: new Date() }),
    );

    await expect(
      sut.execute('session-uuid', 'participant-uuid'),
    ).rejects.toThrow(ParticipantNotFoundError);
  });

  it('signale un cours sans ecran de rappel espace', async () => {
    const [premier, ...suite] = COURS.ecrans.filter(
      (ecran) => ecran.brique !== 'fp-spaced',
    );
    const sansRappel = { ...COURS, ecrans: [premier, ...suite] as const };
    sut = new LireRappelsUseCase(
      sessions,
      participants,
      answers,
      mastery,
      rappels,
      creerCatalogueAVersions({ [COURS.slug]: { 3: sansRappel } }),
    );

    await expect(
      sut.execute('session-uuid', 'participant-uuid'),
    ).rejects.toThrow(RappelsIndisponiblesError);
  });
});
