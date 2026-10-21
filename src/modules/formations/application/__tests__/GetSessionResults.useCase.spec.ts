/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildCoursAvecEnigmes,
  buildCoursDeClasse,
  buildCoursDeTest,
  buildProgressionEnigme,
  buildSeanceRepondueAuRappel,
  creerCatalogueAVersions,
  creerCatalogueDeTest,
  ENIGMES_DE_TEST,
} from '../../../../../test/factories/cours.factory';
import {
  buildActeurFormation,
  buildAdministrateur,
  buildAnswerRecord,
  buildFreeResponseRecord,
  buildResultatQuestion,
  buildSessionRecord,
  createMockDepotsFormations,
} from '../../../../../test/factories/formation.factory';
import {
  buildCoursB2_01,
  ouvrirLeBaremeV2DuB2_01,
} from '../../../../../test/factories/cours-b2-01.factory';
import { seuilDe } from '../../domain/cours/EcranServi';
import type { ICatalogueCours } from '../../domain/cours/ICatalogueCours.port';
import type { ProgressionEnigmeRecord } from '../../domain/IEscape.repository';
import {
  CoursInconnuError,
  SessionNotFoundError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';
import { rapportEnCsv } from '../../domain/RapportCsv';
import { REGLE_DE_NOTATION } from '../../domain/RegleDeNotation';
import type {
  ConfusionComptee,
  ResultatQuestion,
  ResultatsSeance,
} from '../../domain/ResultatsSeance';
import { GetSessionResultsUseCase } from '../GetSessionResults.useCase';

const TEACHER_ID = 'teacher-uuid';
const AUTRE_TEACHER_ID = 'autre-teacher-uuid';
const PROPRIETAIRE = buildActeurFormation({ id: TEACHER_ID });

describe('GetSessionResultsUseCase', () => {
  let depots: ReturnType<typeof createMockDepotsFormations>;
  let sut: GetSessionResultsUseCase;

  const monter = (catalogue: ICatalogueCours) =>
    new GetSessionResultsUseCase(
      depots.sessions,
      depots.participants,
      depots.answers,
      depots.incidents,
      catalogue,
      depots.pulses,
      depots.escape,
      depots.freeResponses,
    );

  const enigmesDuRapport = async (
    progressions: readonly ProgressionEnigmeRecord[],
  ) => {
    depots.escape.listerProgressionDeSeance.mockResolvedValue([
      ...progressions,
    ]);
    return (await sut.execute('session-uuid', PROPRIETAIRE)).enigmes;
  };

  beforeEach(() => {
    depots = createMockDepotsFormations();
    sut = monter(
      creerCatalogueDeTest(
        buildCoursDeTest({ slug: buildSessionRecord().courseSlug }),
      ),
    );
  });

  it('V6 · joint au rapport de chaque participant les réponses libres de la séance', async () => {
    depots.freeResponses.listBySession.mockResolvedValue([
      buildFreeResponseRecord({ response: 'Je nomme chaque colonne.' }),
    ]);

    const rapport = await sut.execute('session-uuid', PROPRIETAIRE);

    expect(depots.freeResponses.listBySession).toHaveBeenCalledWith(
      'session-uuid',
    );
    expect(rapport.participants[0].reponsesLibres).toEqual([
      expect.objectContaining({ reponse: 'Je nomme chaque colonne.' }),
    ]);
  });

  it('R1-25 · ne lit pas les réponses libres pour un bilan qui les écarte', async () => {
    const bilan = await sut.bilanDe(buildSessionRecord(), {
      sansReponsesLibres: true,
    });

    expect(depots.freeResponses.listBySession).not.toHaveBeenCalled();
    expect(bilan.resultats.participants[0].reponsesLibres).toEqual([]);
  });

  it('lit les libelles dans la version figee a l ouverture, pas dans la derniere publiee', async () => {
    const cours = buildCoursDeTest();
    const seance = buildSeanceRepondueAuRappel({ courseVersion: 2 }, cours);
    depots.sessions.findById.mockResolvedValue(seance.session);
    depots.participants.listBySession.mockResolvedValue([seance.participant]);
    depots.answers.listBySession.mockResolvedValue([seance.reponse]);
    sut = monter(
      creerCatalogueAVersions({
        [cours.slug]: {
          2: cours,
          3: { ...buildCoursDeClasse(2), slug: cours.slug },
        },
      }),
    );

    const rapport = await sut.execute(seance.session.id, PROPRIETAIRE);

    expect(rapport.participants[0].reponses).toEqual([
      expect.objectContaining({ reponse: seance.libelleAttendu }),
    ]);
  });

  it('retourne la synthese de la session pour son formateur', async () => {
    const rapport = await sut.execute('session-uuid', PROPRIETAIRE);
    expect(rapport.code).toBe('4271');
    expect(rapport.participants).toHaveLength(1);
  });

  it('leve une erreur si la session est introuvable', async () => {
    depots.sessions.findById.mockResolvedValue(null);
    await expect(sut.execute('session-uuid', PROPRIETAIRE)).rejects.toThrow(
      SessionNotFoundError,
    );
    expect(depots.participants.listBySession).not.toHaveBeenCalled();
  });

  it('refuse en CoursInconnu les resultats d une seance dont le cours a disparu du catalogue, comme le deroule', async () => {
    depots.sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug: 'cours-absent' }),
    );

    await expect(sut.execute('session-uuid', PROPRIETAIRE)).rejects.toThrow(
      CoursInconnuError,
    );
  });

  it('laisse un administrateur lire les resultats d une seance qui n est pas la sienne', async () => {
    const rapport = await sut.execute('session-uuid', buildAdministrateur());

    expect(rapport.code).toBe('4271');
  });

  it('refuse de lire les resultats sans en etre le formateur', async () => {
    await expect(
      sut.execute(
        'session-uuid',
        buildActeurFormation({ id: AUTRE_TEACHER_ID }),
      ),
    ).rejects.toThrow(SessionNotOwnedError);
    expect(depots.participants.listBySession).not.toHaveBeenCalled();
    expect(depots.answers.listBySession).not.toHaveBeenCalled();
    expect(depots.incidents.listBySession).not.toHaveBeenCalled();
  });

  it('exporte en csv le rapport de la seance pour son formateur', async () => {
    const csv = await sut.exporterEnCsv('session-uuid', PROPRIETAIRE);

    expect(csv).toEqual(
      rapportEnCsv(await sut.execute('session-uuid', PROPRIETAIRE)),
    );
  });

  it('refuse d exporter le csv sans etre le formateur de la seance', async () => {
    await expect(
      sut.exporterEnCsv(
        'session-uuid',
        buildActeurFormation({ id: AUTRE_TEACHER_ID }),
      ),
    ).rejects.toThrow(SessionNotOwnedError);
  });

  it('annonce la regle de notation appliquee aux notes du rapport', async () => {
    const rapport = await sut.execute('session-uuid', PROPRIETAIRE);

    expect(rapport.notation).toBe(REGLE_DE_NOTATION);
  });

  it('reprend le bareme de la session pour calculer la completion', async () => {
    const rapport = await sut.execute('session-uuid', PROPRIETAIRE);
    expect(rapport.participants[0].completion).toBe(1);
  });

  it('compte une enigme epuisee sur le plafond de son parcours', async () => {
    const cours = buildCoursAvecEnigmes({}, 3);
    depots.sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug: cours.slug }),
    );
    sut = monter(creerCatalogueDeTest(cours));

    const enigmes = await enigmesDuRapport([
      buildProgressionEnigme({ tentatives: 3, resolueLe: null }),
      buildProgressionEnigme({
        participantId: 'autre-participant',
        tentatives: 2,
        resolueLe: null,
      }),
    ]);

    expect(enigmes).toEqual([
      expect.objectContaining({ enigmeId: ENIGMES_DE_TEST[0], epuisees: 1 }),
    ]);
  });

  it('agrege les resultats par question du bareme dans le rapport', async () => {
    const rapport = await sut.execute('session-uuid', PROPRIETAIRE);
    const confusionsAttendues: readonly ConfusionComptee[] = [];
    const questionsAttendues: readonly ResultatQuestion[] = [
      buildResultatQuestion({
        questionId: 'Q-CAP-03',
        ecranId: '',
        total: 1,
        correctes: 1,
        confusions: confusionsAttendues,
        part: 1,
      }),
    ];
    const resultatsAttendus: ResultatsSeance = {
      participants: 1,
      questions: questionsAttendues,
    };
    expect(rapport.resultats).toEqual(resultatsAttendus);
  });

  it('B-70 · sert la confusion dominante et l écran qui la remédie sous le seuil, sur le B2-01 servi', async () => {
    const cours = buildCoursB2_01();
    const bareme = ouvrirLeBaremeV2DuB2_01(cours);
    const [{ question, seuil }] = bareme.questions.flatMap((candidate) => {
      const seuilDeLEcran = seuilDe(cours.ecrans[candidate.rangEcran]);
      return seuilDeLEcran === null
        ? []
        : [{ question: candidate, seuil: seuilDeLEcran }];
    });
    const reponse = (correcte: boolean, misconception: string | null) =>
      buildAnswerRecord({ questionId: question.id, correcte, misconception });
    depots.sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug: cours.slug, bareme }),
    );
    depots.answers.listBySession.mockResolvedValue([
      reponse(true, null),
      reponse(false, 'hausse-baisse-symetriques'),
      reponse(false, 'base-arrivee'),
      reponse(false, 'base-arrivee'),
    ]);
    sut = monter(creerCatalogueDeTest(cours));

    const rapport = await sut.execute('session-uuid', PROPRIETAIRE);

    expect(seuil).toBeGreaterThan(0.25);
    expect(
      rapport.resultats.questions.find(
        ({ questionId }) => questionId === question.id,
      ),
    ).toMatchObject({
      confusionDominante: 'base-arrivee',
      part: 0.25,
      sousLeSeuil: true,
      remediation: {
        confusionId: 'base-arrivee',
        ecranId: cours.remediations['base-arrivee'],
      },
    });
  });
});
