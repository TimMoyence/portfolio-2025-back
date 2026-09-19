/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildCoursDeClasse,
  buildCoursDeTest,
  buildSeanceRepondueAuRappel,
  creerCatalogueAVersions,
  creerCatalogueDeTest,
} from '../../../../../test/factories/cours.factory';
import {
  buildActeurFormation,
  buildAdministrateur,
  buildAnswerRecord,
  createMockAnswersRepo,
  createMockIncidentsRepo,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  SessionNotFoundError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';
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
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let answers: ReturnType<typeof createMockAnswersRepo>;
  let incidents: ReturnType<typeof createMockIncidentsRepo>;
  let sut: GetSessionResultsUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    participants = createMockParticipantsRepo();
    answers = createMockAnswersRepo();
    incidents = createMockIncidentsRepo();
    sut = new GetSessionResultsUseCase(
      sessions,
      participants,
      answers,
      incidents,
      creerCatalogueDeTest(),
    );
  });

  it('rend la valeur envoyee telle quelle quand le cours de la seance est absent du catalogue', async () => {
    answers.listBySession.mockResolvedValue([
      buildAnswerRecord({ valeur: 'o2', correcte: false }),
    ]);

    const rapport = await sut.execute('session-uuid', PROPRIETAIRE);

    expect(rapport.participants[0].reponses).toEqual([
      expect.objectContaining({ valeur: 'o2', reponse: 'o2' }),
    ]);
  });

  it('lit les libelles dans la version figee a l ouverture, pas dans la derniere publiee', async () => {
    const cours = buildCoursDeTest();
    const seance = buildSeanceRepondueAuRappel({ courseVersion: 2 }, cours);
    sessions.findById.mockResolvedValue(seance.session);
    participants.listBySession.mockResolvedValue([seance.participant]);
    answers.listBySession.mockResolvedValue([seance.reponse]);
    sut = new GetSessionResultsUseCase(
      sessions,
      participants,
      answers,
      incidents,
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
    sessions.findById.mockResolvedValue(null);
    await expect(sut.execute('session-uuid', PROPRIETAIRE)).rejects.toThrow(
      SessionNotFoundError,
    );
    expect(participants.listBySession).not.toHaveBeenCalled();
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
    expect(participants.listBySession).not.toHaveBeenCalled();
    expect(answers.listBySession).not.toHaveBeenCalled();
    expect(incidents.listBySession).not.toHaveBeenCalled();
  });

  it('annonce la regle de notation appliquee aux notes du rapport', async () => {
    const rapport = await sut.execute('session-uuid', PROPRIETAIRE);

    expect(rapport.notation).toBe(REGLE_DE_NOTATION);
  });

  it('reprend le bareme de la session pour calculer la completion', async () => {
    const rapport = await sut.execute('session-uuid', PROPRIETAIRE);
    expect(rapport.participants[0].completion).toBe(1);
  });

  it('agrege les resultats par question du bareme dans le rapport', async () => {
    const rapport = await sut.execute('session-uuid', PROPRIETAIRE);
    const confusionsAttendues: readonly ConfusionComptee[] = [];
    const questionsAttendues: readonly ResultatQuestion[] = [
      {
        questionId: 'Q-CAP-03',
        total: 1,
        correctes: 1,
        neSaitPas: 0,
        confusions: confusionsAttendues,
      },
    ];
    const resultatsAttendus: ResultatsSeance = {
      participants: 1,
      questions: questionsAttendues,
    };
    expect(rapport.resultats).toEqual(resultatsAttendus);
  });
});
