/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { verifierGardesDuFormateur } from '../../../../../test/helpers/gardes-de-seance';
import {
  GraineRepriseError,
  ParticipantNotFoundError,
  SeanceCompleteError,
} from '../../domain/errors/FormationErrors';
import { ReadmettreParticipantUseCase } from '../ReadmettreParticipant.useCase';

const TEACHER_ID = 'teacher-uuid';
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
      30,
    );
    expect(cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
  });

  it('S2 · laisse le depot verifier la capacite sous verrou, sans compter avant lui', async () => {
    participants.readmettre.mockRejectedValue(new SeanceCompleteError(30));

    await expect(
      sut.execute('session-uuid', TEACHER_ID, PARTICIPANT_ID),
    ).rejects.toThrow(SeanceCompleteError);
    expect(participants.countBySession).not.toHaveBeenCalled();
    expect(cache.signalerActivite).not.toHaveBeenCalled();
  });

  it('S2 · laisse remonter en conflit la graine reprise entre-temps par un autre poste', async () => {
    participants.readmettre.mockRejectedValue(new GraineRepriseError());

    await expect(
      sut.execute('session-uuid', TEACHER_ID, PARTICIPANT_ID),
    ).rejects.toThrow(GraineRepriseError);
  });

  verifierGardesDuFormateur(() => ({
    sessions,
    executerPar: (teacherId) =>
      sut.execute('session-uuid', teacherId, PARTICIPANT_ID),
    effetsInterdits: () => [participants.readmettre],
  }));

  it('signale un participant absent ou qui n etait pas evince', async () => {
    participants.readmettre.mockResolvedValue(false);

    await expect(
      sut.execute('session-uuid', TEACHER_ID, PARTICIPANT_ID),
    ).rejects.toThrow(ParticipantNotFoundError);
    expect(cache.signalerActivite).not.toHaveBeenCalled();
  });
});
