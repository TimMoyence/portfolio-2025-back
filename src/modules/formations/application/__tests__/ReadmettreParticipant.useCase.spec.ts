/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  ParticipantNotFoundError,
  SeanceCompleteError,
  SessionNotFoundError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';
import { ReadmettreParticipantUseCase } from '../ReadmettreParticipant.useCase';

const TEACHER_ID = 'teacher-uuid';
const AUTRE_TEACHER = 'autre-teacher-uuid';
const PARTICIPANT_ID = 'participant-uuid';

describe('ReadmettreParticipantUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let sut: ReadmettreParticipantUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(buildSessionRecord({ capacite: 30 }));
    participants = createMockParticipantsRepo();
    participants.countBySession.mockResolvedValue(12);
    participants.readmettre.mockResolvedValue(true);
    cache = createMockSessionStateCache();
    sut = new ReadmettreParticipantUseCase(sessions, participants, cache);
  });

  it('readmet le participant de la seance du formateur proprietaire', async () => {
    await sut.execute('session-uuid', TEACHER_ID, PARTICIPANT_ID);

    expect(participants.readmettre).toHaveBeenCalledWith(
      'session-uuid',
      PARTICIPANT_ID,
    );
    expect(cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
  });

  it('refuse un formateur qui n est pas proprietaire de la seance', async () => {
    await expect(
      sut.execute('session-uuid', AUTRE_TEACHER, PARTICIPANT_ID),
    ).rejects.toThrow(SessionNotOwnedError);
    expect(participants.readmettre).not.toHaveBeenCalled();
  });

  it('signale une seance introuvable', async () => {
    sessions.findById.mockResolvedValue(null);

    await expect(
      sut.execute('session-uuid', TEACHER_ID, PARTICIPANT_ID),
    ).rejects.toThrow(SessionNotFoundError);
  });

  it('signale un participant absent ou qui n etait pas evince', async () => {
    participants.readmettre.mockResolvedValue(false);

    await expect(
      sut.execute('session-uuid', TEACHER_ID, PARTICIPANT_ID),
    ).rejects.toThrow(ParticipantNotFoundError);
    expect(cache.signalerActivite).not.toHaveBeenCalled();
  });

  it('refuse de readmettre au dela de la capacite de la seance', async () => {
    participants.countBySession.mockResolvedValue(30);

    await expect(
      sut.execute('session-uuid', TEACHER_ID, PARTICIPANT_ID),
    ).rejects.toThrow(SeanceCompleteError);
    expect(participants.readmettre).not.toHaveBeenCalled();
  });
});
