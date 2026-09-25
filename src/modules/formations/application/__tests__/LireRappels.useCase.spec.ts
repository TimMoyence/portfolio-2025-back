/* eslint-disable @typescript-eslint/unbound-method */
import { buildCoursB2_01 } from '../../../../../test/factories/cours-b2-01.factory';
import {
  creerCatalogueAVersions,
  creerParticipationEnSeance,
} from '../../../../../test/factories/cours.factory';
import {
  buildMasteryRecord,
  buildParticipantRecord,
  buildSessionRecord,
  createMockAnswersRepo,
  createMockMasteryRepo,
  createMockParticipantsRepo,
  createMockRappelsServisRepo,
  createMockSessionsRepo,
  PARTICIPANT_DE_TEST,
} from '../../../../../test/factories/formation.factory';
import { verifierGardesDeParticipant } from '../../../../../test/helpers/gardes-de-seance';
import {
  EcranNonServiError,
  RappelsIndisponiblesError,
} from '../../domain/errors/FormationErrors';
import type { Cours } from '../../domain/contrats/cours';
import { LireRappelsUseCase } from '../LireRappels.useCase';

const COURS = buildCoursB2_01();
const DERNIER_ECRAN = COURS.ecrans.length - 1;
const OBLIGATOIRES = ['b2-01-r-compensation', 'b2-01-r-multiple-neuf'];
const SEANCE_DU_COURS = { courseSlug: COURS.slug, courseVersion: 3 } as const;

describe('LireRappelsUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let answers: ReturnType<typeof createMockAnswersRepo>;
  let mastery: ReturnType<typeof createMockMasteryRepo>;
  let rappels: ReturnType<typeof createMockRappelsServisRepo>;
  let sut: LireRappelsUseCase;

  const monter = (cours: Cours = COURS): LireRappelsUseCase =>
    new LireRappelsUseCase(
      creerParticipationEnSeance({
        sessions,
        participants,
        catalogue: creerCatalogueAVersions({ [COURS.slug]: { 3: cours } }),
      }),
      answers,
      mastery,
      rappels,
    );

  const lire = () => sut.execute(PARTICIPANT_DE_TEST);

  beforeEach(() => {
    sessions = createMockSessionsRepo({
      ...SEANCE_DU_COURS,
      ecranCourant: DERNIER_ECRAN,
    });
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
    const { questions } = await lire();

    expect(questions.length).toBeGreaterThanOrEqual(3);
    expect(questions.length).toBeLessThanOrEqual(4);
    expect(
      questions.slice(0, 2).map((question) => question.questionId),
    ).toEqual(OBLIGATOIRES);
  });

  it('sert des options a identifiants stables et un enonce, sans bonne reponse', async () => {
    const { questions } = await lire();

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
    const premier = await lire();
    answers.listerDuParticipant.mockResolvedValue([]);

    const second = await lire();

    expect(rappels.figer).toHaveBeenCalledTimes(1);
    expect(second.questions.map((question) => question.questionId)).toEqual(
      premier.questions.map((question) => question.questionId),
    );
  });

  it('rend la boite de Leitner du concept, ou la premiere par defaut', async () => {
    mastery.findByStudentKey.mockResolvedValue([
      buildMasteryRecord({ concept: 'controle-coherence', boite: 3 }),
    ]);

    const { questions } = await lire();

    expect(questions[0].boite).toBe(3);
    expect(questions[questions.length - 1].boite).toBe(1);
  });

  it('refuse un ecran de rappel non projete', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ ...SEANCE_DU_COURS, ecranCourant: 0 }),
    );

    await expect(lire()).rejects.toThrow(EcranNonServiError);
  });

  verifierGardesDeParticipant(() => ({
    participants,
    executer: lire,
    effetsInterdits: () => [rappels.figer],
  }));

  it('signale un cours sans ecran de rappel espace', async () => {
    const [premier, ...suite] = COURS.ecrans.filter(
      (ecran) => ecran.brique !== 'fp-spaced',
    );
    const sansRappel = { ...COURS, ecrans: [premier, ...suite] as const };
    sut = monter(sansRappel);

    await expect(lire()).rejects.toThrow(RappelsIndisponiblesError);
  });
});
