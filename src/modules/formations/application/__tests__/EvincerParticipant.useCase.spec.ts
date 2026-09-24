/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { verifierGardesDuFormateur } from '../../../../../test/helpers/gardes-de-seance';
import { ParticipantNotFoundError } from '../../domain/errors/FormationErrors';
import { EvincerParticipantUseCase } from '../EvincerParticipant.useCase';

const TEACHER_ID = 'teacher-uuid';
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

  verifierGardesDuFormateur(() => ({
    sessions,
    executerPar: (teacherId) =>
      sut.execute('session-uuid', teacherId, PARTICIPANT_ID),
    effetsInterdits: () => [participants.evincer],
  }));

  it('signale un participant absent ou deja evince', async () => {
    participants.evincer.mockResolvedValue(false);

    await expect(
      sut.execute('session-uuid', TEACHER_ID, PARTICIPANT_ID),
    ).rejects.toThrow(ParticipantNotFoundError);
    expect(cache.signalerActivite).not.toHaveBeenCalled();
  });
});
