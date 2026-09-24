/* eslint-disable @typescript-eslint/unbound-method */
import { buildCoursB2_01 } from '../../../../../test/factories/cours-b2-01.factory';
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
import { verifierGardesDeParticipant } from '../../../../../test/helpers/gardes-de-seance';
import {
  EcranNonServiError,
  RappelsIndisponiblesError,
} from '../../domain/errors/FormationErrors';
import { LireRappelsUseCase } from '../LireRappels.useCase';

const COURS = buildCoursB2_01();
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

  verifierGardesDeParticipant(() => ({
    participants,
    executer: () => sut.execute('session-uuid', 'participant-uuid'),
    effetsInterdits: () => [rappels.figer],
  }));

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
