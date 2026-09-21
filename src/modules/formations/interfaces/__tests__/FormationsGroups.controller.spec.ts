import type { Request } from 'express';
import {
  buildFormationGroupRecord,
  buildParticipantRecord,
} from '../../../../../test/factories/formation.factory';
import { ROLES_KEY } from '../../../../common/interfaces/auth/roles.decorator';
import { FormationsGroupsController } from '../FormationsGroups.controller';

const SESSION_ID = '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90';
const TEACHER_ID = 'f1e2d3c4-b5a6-4978-8899-aabbccddeeff';
const GROUPE_ID = 'b0b1c2d3-e4f5-4678-9012-abcdefabcdef';
const PARTICIPANT_ID = 'a0b1c2d3-e4f5-4678-9012-abcdefabcdef';

const requete = {
  user: { sub: TEACHER_ID, roles: ['teacher', 'admin'] },
} as unknown as Request;

describe('FormationsGroupsController', () => {
  const groups = {
    list: jest.fn(),
    create: jest.fn(),
    rename: jest.fn(),
    assign: jest.fn(),
  };
  const participants = { execute: jest.fn() };
  const evincerParticipant = { execute: jest.fn() };
  const readmettreParticipant = { execute: jest.fn() };
  const controller = new FormationsGroupsController(
    groups as never,
    participants as never,
    evincerParticipant as never,
    readmettreParticipant as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('evince un participant avec l identite du formateur proprietaire', async () => {
    await controller.evincer(SESSION_ID, PARTICIPANT_ID, requete);

    expect(evincerParticipant.execute).toHaveBeenCalledWith(
      SESSION_ID,
      TEACHER_ID,
      PARTICIPANT_ID,
    );
  });

  it('readmet un participant avec l identite du formateur proprietaire', async () => {
    await controller.readmettre(SESSION_ID, PARTICIPANT_ID, requete);

    expect(readmettreParticipant.execute).toHaveBeenCalledWith(
      SESSION_ID,
      TEACHER_ID,
      PARTICIPANT_ID,
    );
  });

  it('lit participants et groupes avec l identite et les roles de l appelant', async () => {
    const acteur = { id: TEACHER_ID, roles: ['teacher', 'admin'] };
    const inscrit = buildParticipantRecord();
    participants.execute.mockResolvedValue([inscrit]);
    groups.list.mockResolvedValue([buildFormationGroupRecord()]);

    await expect(
      controller.getParticipants(SESSION_ID, requete),
    ).resolves.toEqual({ participants: [inscrit] });
    await expect(controller.getGroups(SESSION_ID, requete)).resolves.toEqual({
      groups: [buildFormationGroupRecord()],
    });
    expect(participants.execute).toHaveBeenCalledWith(SESSION_ID, acteur);
    expect(groups.list).toHaveBeenCalledWith(SESSION_ID, acteur);
  });

  it('cree, renomme, affecte et desaffecte au nom du formateur appelant', async () => {
    await controller.createGroup(SESSION_ID, { name: 'Groupe A' }, requete);
    await controller.renameGroup(
      SESSION_ID,
      GROUPE_ID,
      { name: 'Groupe B' },
      requete,
    );
    await controller.assignGroup(
      SESSION_ID,
      PARTICIPANT_ID,
      { groupId: GROUPE_ID },
      requete,
    );
    await controller.unassignGroup(SESSION_ID, PARTICIPANT_ID, requete);

    expect(groups.create).toHaveBeenCalledWith(
      SESSION_ID,
      TEACHER_ID,
      'Groupe A',
    );
    expect(groups.rename).toHaveBeenCalledWith(
      SESSION_ID,
      TEACHER_ID,
      GROUPE_ID,
      'Groupe B',
    );
    expect(groups.assign.mock.calls).toEqual([
      [SESSION_ID, TEACHER_ID, PARTICIPANT_ID, GROUPE_ID],
      [SESSION_ID, TEACHER_ID, PARTICIPANT_ID, null],
    ]);
  });

  it('ouvre les lectures a l administrateur et laisse les ecritures au seul role formateur', () => {
    const rolesDe = (route: keyof FormationsGroupsController): unknown =>
      Reflect.getMetadata(
        ROLES_KEY,
        FormationsGroupsController.prototype[route],
      ) ?? Reflect.getMetadata(ROLES_KEY, FormationsGroupsController);

    expect({
      participants: rolesDe('getParticipants'),
      groupes: rolesDe('getGroups'),
      creation: rolesDe('createGroup'),
      renommage: rolesDe('renameGroup'),
      affectation: rolesDe('assignGroup'),
      retrait: rolesDe('unassignGroup'),
    }).toEqual({
      participants: ['teacher', 'admin'],
      groupes: ['teacher', 'admin'],
      creation: ['teacher'],
      renommage: ['teacher'],
      affectation: ['teacher'],
      retrait: ['teacher'],
    });
  });
});
