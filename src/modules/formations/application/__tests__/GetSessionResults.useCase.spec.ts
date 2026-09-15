/* eslint-disable @typescript-eslint/unbound-method */
import {
  createMockAnswersRepo,
  createMockIncidentsRepo,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  SessionNotFoundError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';
import type {
  ConfusionComptee,
  ResultatQuestion,
  ResultatsSeance,
} from '../../domain/ResultatsSeance';
import { GetSessionResultsUseCase } from '../GetSessionResults.useCase';

const TEACHER_ID = 'teacher-uuid';
const AUTRE_TEACHER_ID = 'autre-teacher-uuid';

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
    );
  });

  it('retourne la synthese de la session pour son formateur', async () => {
    const rapport = await sut.execute('session-uuid', TEACHER_ID);
    expect(rapport.code).toBe('4271');
    expect(rapport.participants).toHaveLength(1);
  });

  it('leve une erreur si la session est introuvable', async () => {
    sessions.findById.mockResolvedValue(null);
    await expect(sut.execute('session-uuid', TEACHER_ID)).rejects.toThrow(
      SessionNotFoundError,
    );
    expect(participants.listBySession).not.toHaveBeenCalled();
  });

  it('refuse de lire les resultats sans en etre le formateur', async () => {
    await expect(sut.execute('session-uuid', AUTRE_TEACHER_ID)).rejects.toThrow(
      SessionNotOwnedError,
    );
    expect(participants.listBySession).not.toHaveBeenCalled();
    expect(answers.listBySession).not.toHaveBeenCalled();
    expect(incidents.listBySession).not.toHaveBeenCalled();
  });

  it('reprend le bareme de la session pour calculer la completion', async () => {
    const rapport = await sut.execute('session-uuid', TEACHER_ID);
    expect(rapport.participants[0].completion).toBe(1);
  });

  it('agrege les resultats par question du bareme dans le rapport', async () => {
    const rapport = await sut.execute('session-uuid', TEACHER_ID);
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
