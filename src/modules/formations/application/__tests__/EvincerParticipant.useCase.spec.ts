/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  ParticipantNotFoundError,
  SessionNotFoundError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';
import { EvincerParticipantUseCase } from '../EvincerParticipant.useCase';

const TEACHER_ID = 'teacher-uuid';
const AUTRE_TEACHER = 'autre-teacher-uuid';
const PARTICIPANT_ID = 'participant-uuid';

describe('EvincerParticipantUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let sut: EvincerParticipantUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(buildSessionRecord());
    participants = createMockParticipantsRepo();
    cache = createMockSessionStateCache();
    sut = new EvincerParticipantUseCase(sessions, participants, cache);
  });

  it('evince le participant de la seance du formateur proprietaire', async () => {
    await sut.execute('session-uuid', TEACHER_ID, PARTICIPANT_ID);

    expect(participants.evincer).toHaveBeenCalledWith(
      'session-uuid',
      PARTICIPANT_ID,
    );
    expect(cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
  });

  it('refuse un formateur qui n est pas proprietaire de la seance', async () => {
    await expect(
      sut.execute('session-uuid', AUTRE_TEACHER, PARTICIPANT_ID),
    ).rejects.toThrow(SessionNotOwnedError);
    expect(participants.evincer).not.toHaveBeenCalled();
  });

  it('signale une seance introuvable', async () => {
    sessions.findById.mockResolvedValue(null);

    await expect(
      sut.execute('session-uuid', TEACHER_ID, PARTICIPANT_ID),
    ).rejects.toThrow(SessionNotFoundError);
  });

  it('signale un participant absent ou deja evince', async () => {
    participants.evincer.mockResolvedValue(false);

    await expect(
      sut.execute('session-uuid', TEACHER_ID, PARTICIPANT_ID),
    ).rejects.toThrow(ParticipantNotFoundError);
    expect(cache.signalerActivite).not.toHaveBeenCalled();
  });
});
