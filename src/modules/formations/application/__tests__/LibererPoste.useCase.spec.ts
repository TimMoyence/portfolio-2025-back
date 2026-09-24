/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  ParticipantNotFoundError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';
import { LibererPosteUseCase } from '../LibererPoste.useCase';

const TEACHER_ID = 'teacher-uuid';
const PARTICIPANT_ID = 'participant-uuid';

describe('LibererPosteUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let sut: LibererPosteUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(buildSessionRecord());
    participants = createMockParticipantsRepo();
    sut = new LibererPosteUseCase(sessions, participants);
  });

  it('S1 · oublie le secret de reprise pour que l etudiant reprenne sa place depuis un autre poste', async () => {
    await sut.execute('session-uuid', TEACHER_ID, PARTICIPANT_ID);

    expect(participants.libererPoste).toHaveBeenCalledWith(
      'session-uuid',
      PARTICIPANT_ID,
    );
  });

  it('S1 · refuse un formateur qui n est pas proprietaire de la seance', async () => {
    await expect(
      sut.execute('session-uuid', 'autre-teacher-uuid', PARTICIPANT_ID),
    ).rejects.toThrow(SessionNotOwnedError);
    expect(participants.libererPoste).not.toHaveBeenCalled();
  });

  it('S1 · signale un participant absent de la seance ou evince', async () => {
    participants.libererPoste.mockResolvedValue(false);

    await expect(
      sut.execute('session-uuid', TEACHER_ID, PARTICIPANT_ID),
    ).rejects.toThrow(ParticipantNotFoundError);
  });
});
