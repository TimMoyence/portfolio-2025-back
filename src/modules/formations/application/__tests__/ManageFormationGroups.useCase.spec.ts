/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildActeurFormation,
  buildAdministrateur,
  buildFormationGroupRecord,
  buildSessionRecord,
  createMockFormationGroupsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  BlankFieldError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';
import { ManageFormationGroupsUseCase } from '../ManageFormationGroups.useCase';

const SESSION_ID = 'session-uuid';
const PROPRIETAIRE = 'teacher-uuid';
const AUTRE_FORMATEUR = 'autre-teacher-uuid';
const GROUPE_ID = 'group-uuid';
const PARTICIPANT_ID = 'participant-uuid';

describe('ManageFormationGroupsUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let groups: ReturnType<typeof createMockFormationGroupsRepo>;
  let sut: ManageFormationGroupsUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ id: SESSION_ID, teacherId: PROPRIETAIRE }),
    );
    groups = createMockFormationGroupsRepo();
    sut = new ManageFormationGroupsUseCase(sessions, groups);
  });

  it('liste les groupes au proprietaire comme a un administrateur', async () => {
    const attendus = [buildFormationGroupRecord()];

    await expect(
      sut.list(SESSION_ID, buildActeurFormation({ id: PROPRIETAIRE })),
    ).resolves.toEqual(attendus);
    await expect(sut.list(SESSION_ID, buildAdministrateur())).resolves.toEqual(
      attendus,
    );
  });

  it('refuse la liste des groupes a un autre formateur', async () => {
    await expect(
      sut.list(SESSION_ID, buildActeurFormation({ id: AUTRE_FORMATEUR })),
    ).rejects.toThrow(SessionNotOwnedError);
    expect(groups.listBySession).not.toHaveBeenCalled();
  });

  it('cree puis renomme un groupe au nom sans blancs superflus', async () => {
    await sut.create(SESSION_ID, PROPRIETAIRE, '  Groupe A ');
    await sut.rename(SESSION_ID, PROPRIETAIRE, GROUPE_ID, ' Groupe B  ');

    expect(groups.create).toHaveBeenCalledWith(SESSION_ID, 'Groupe A');
    expect(groups.rename).toHaveBeenCalledWith(
      SESSION_ID,
      GROUPE_ID,
      'Groupe B',
    );
  });

  it('refuse un nom de groupe vide sans rien ecrire', async () => {
    await expect(sut.create(SESSION_ID, PROPRIETAIRE, '   ')).rejects.toThrow(
      BlankFieldError,
    );
    await expect(
      sut.rename(SESSION_ID, PROPRIETAIRE, GROUPE_ID, ' '),
    ).rejects.toThrow(BlankFieldError);
    expect(groups.create).not.toHaveBeenCalled();
    expect(groups.rename).not.toHaveBeenCalled();
  });

  it('affecte puis desaffecte un participant du groupe', async () => {
    await sut.assign(SESSION_ID, PROPRIETAIRE, PARTICIPANT_ID, GROUPE_ID);
    await sut.assign(SESSION_ID, PROPRIETAIRE, PARTICIPANT_ID, null);

    expect(groups.assignParticipant.mock.calls).toEqual([
      [SESSION_ID, PARTICIPANT_ID, GROUPE_ID],
      [SESSION_ID, PARTICIPANT_ID, null],
    ]);
  });

  it.each([
    ['un autre formateur', AUTRE_FORMATEUR],
    ['un administrateur qui n est pas le proprietaire', 'admin-uuid'],
  ])('refuse a %s de creer, renommer ou affecter', async (_cas, appelant) => {
    await expect(sut.create(SESSION_ID, appelant, 'Groupe A')).rejects.toThrow(
      SessionNotOwnedError,
    );
    await expect(
      sut.rename(SESSION_ID, appelant, GROUPE_ID, 'Groupe B'),
    ).rejects.toThrow(SessionNotOwnedError);
    await expect(
      sut.assign(SESSION_ID, appelant, PARTICIPANT_ID, GROUPE_ID),
    ).rejects.toThrow(SessionNotOwnedError);
    expect(groups.create).not.toHaveBeenCalled();
    expect(groups.rename).not.toHaveBeenCalled();
    expect(groups.assignParticipant).not.toHaveBeenCalled();
  });
});
