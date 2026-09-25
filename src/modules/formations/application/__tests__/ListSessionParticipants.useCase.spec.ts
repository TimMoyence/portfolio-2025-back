/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildActeurFormation,
  buildAdministrateur,
  buildParticipantRecord,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { SessionNotOwnedError } from '../../domain/errors/FormationErrors';
import { ListSessionParticipantsUseCase } from '../ListSessionParticipants.useCase';

const SESSION_ID = 'session-uuid';
const PROPRIETAIRE = buildActeurFormation({ id: 'teacher-uuid' });

describe('ListSessionParticipantsUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let sut: ListSessionParticipantsUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo({
      id: SESSION_ID,
      teacherId: PROPRIETAIRE.id,
    });
    participants = createMockParticipantsRepo();
    participants.listBySession.mockResolvedValue([
      buildParticipantRecord({ id: 'p1', prenom: 'Ada', nom: 'Lovelace' }),
      buildParticipantRecord({ id: 'p2', prenom: 'Grace', nom: 'Hopper' }),
    ]);
    sut = new ListSessionParticipantsUseCase(sessions, participants);
  });

  it('rend au formateur chaque participant, sans son adresse', async () => {
    await expect(sut.execute(SESSION_ID, PROPRIETAIRE)).resolves.toEqual([
      { id: 'p1', prenom: 'Ada', nom: 'Lovelace', evince: false },
      { id: 'p2', prenom: 'Grace', nom: 'Hopper', evince: false },
    ]);
    expect(participants.listBySession).toHaveBeenCalledWith(SESSION_ID);
  });

  it('rend aussi les evinces, marques comme tels, pour que le formateur puisse les readmettre', async () => {
    participants.listEvincesBySession.mockResolvedValue([
      buildParticipantRecord({
        id: 'p3',
        prenom: 'Katherine',
        nom: 'Johnson',
        evinceLe: new Date('2026-09-20T09:00:00.000Z'),
      }),
    ]);

    await expect(sut.execute(SESSION_ID, PROPRIETAIRE)).resolves.toEqual([
      { id: 'p1', prenom: 'Ada', nom: 'Lovelace', evince: false },
      { id: 'p2', prenom: 'Grace', nom: 'Hopper', evince: false },
      { id: 'p3', prenom: 'Katherine', nom: 'Johnson', evince: true },
    ]);
    expect(participants.listEvincesBySession).toHaveBeenCalledWith(SESSION_ID);
  });

  it('rend la liste a un administrateur', async () => {
    await expect(
      sut.execute(SESSION_ID, buildAdministrateur()),
    ).resolves.toHaveLength(2);
  });

  it('refuse la liste a un autre formateur', async () => {
    await expect(
      sut.execute(SESSION_ID, buildActeurFormation({ id: 'autre-uuid' })),
    ).rejects.toThrow(SessionNotOwnedError);
  });
});
