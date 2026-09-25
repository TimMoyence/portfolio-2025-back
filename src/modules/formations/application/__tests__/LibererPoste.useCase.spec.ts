/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { verifierActionSurParticipant } from '../../../../../test/helpers/gardes-de-seance';
import { LibererPosteUseCase } from '../LibererPoste.useCase';

const TEACHER_ID = 'teacher-uuid';
const PARTICIPANT_ID = 'participant-uuid';

describe('LibererPosteUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let sut: LibererPosteUseCase;

  const libererPar = (teacherId: string) =>
    sut.execute('session-uuid', teacherId, PARTICIPANT_ID);

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(buildSessionRecord());
    participants = createMockParticipantsRepo();
    sut = new LibererPosteUseCase(sessions, participants);
  });

  it('S1 · oublie le secret de reprise pour que l etudiant reprenne sa place depuis un autre poste', async () => {
    await libererPar(TEACHER_ID);

    expect(participants.libererPoste).toHaveBeenCalledWith(
      'session-uuid',
      PARTICIPANT_ID,
    );
  });

  verifierActionSurParticipant(
    'S1 · signale un participant absent de la seance ou evince',
    () => ({
      sessions,
      executerPar: libererPar,
      action: participants.libererPoste,
    }),
  );
});
