import type { Request } from 'express';
import { buildParticipantRecord } from '../../../../../test/factories/formation.factory';
import {
  buildFormationsParticipantsController,
  createMockFormationsParticipantsDependances,
} from '../../../../../test/factories/formations-controllers.factory';
import { ROLES_KEY } from '../../../../common/interfaces/auth/roles.decorator';
import { FormationsParticipantsController } from '../FormationsParticipants.controller';

const SESSION_ID = '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90';
const TEACHER_ID = 'f1e2d3c4-b5a6-4978-8899-aabbccddeeff';
const PARTICIPANT_ID = 'a0b1c2d3-e4f5-4678-9012-abcdefabcdef';

const CIBLE = { id: SESSION_ID, participantId: PARTICIPANT_ID };

const requete = {
  user: { sub: TEACHER_ID, roles: ['teacher', 'admin'] },
} as unknown as Request;

describe('FormationsParticipantsController', () => {
  const dependances = createMockFormationsParticipantsDependances();
  const {
    participants,
    evincerParticipant,
    readmettreParticipant,
    libererPoste,
  } = dependances;
  const controller = buildFormationsParticipantsController(dependances);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('evince un participant avec l identite du formateur proprietaire', async () => {
    await controller.evincer(CIBLE, requete);

    expect(evincerParticipant.execute).toHaveBeenCalledWith(
      SESSION_ID,
      TEACHER_ID,
      PARTICIPANT_ID,
    );
  });

  it('readmet un participant avec l identite du formateur proprietaire', async () => {
    await controller.readmettre(CIBLE, requete);

    expect(readmettreParticipant.execute).toHaveBeenCalledWith(
      SESSION_ID,
      TEACHER_ID,
      PARTICIPANT_ID,
    );
  });

  it('S1 · libere le poste d un participant avec l identite du formateur proprietaire', async () => {
    await controller.libererPoste(CIBLE, requete);

    expect(libererPoste.execute).toHaveBeenCalledWith(
      SESSION_ID,
      TEACHER_ID,
      PARTICIPANT_ID,
    );
  });

  it('lit les participants avec l identite et les roles de l appelant', async () => {
    const acteur = { id: TEACHER_ID, roles: ['teacher', 'admin'] };
    const inscrit = buildParticipantRecord();
    participants.execute.mockResolvedValue([inscrit]);

    await expect(
      controller.getParticipants(SESSION_ID, requete),
    ).resolves.toEqual({ participants: [inscrit] });
    expect(participants.execute).toHaveBeenCalledWith(SESSION_ID, acteur);
  });

  it('ouvre la lecture a l administrateur et laisse les ecritures au seul role formateur', () => {
    const rolesDe = (route: keyof FormationsParticipantsController): unknown =>
      Reflect.getMetadata(
        ROLES_KEY,
        FormationsParticipantsController.prototype[route],
      ) ?? Reflect.getMetadata(ROLES_KEY, FormationsParticipantsController);

    expect({
      participants: rolesDe('getParticipants'),
      eviction: rolesDe('evincer'),
      readmission: rolesDe('readmettre'),
      liberation: rolesDe('libererPoste'),
    }).toEqual({
      participants: ['teacher', 'admin'],
      eviction: ['teacher'],
      readmission: ['teacher'],
      liberation: ['teacher'],
    });
  });
});
