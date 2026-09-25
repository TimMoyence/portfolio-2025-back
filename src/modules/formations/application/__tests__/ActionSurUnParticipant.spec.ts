/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { creerParticipationEnSeance } from '../../../../../test/factories/cours.factory';
import {
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { EvincerParticipantUseCase } from '../EvincerParticipant.useCase';
import { ParticipationEnSeance } from '../ParticipationEnSeance';
import { ReadmettreParticipantUseCase } from '../ReadmettreParticipant.useCase';

describe('ActionSurUnParticipant', () => {
  it.each([EvincerParticipantUseCase, ReadmettreParticipantUseCase])(
    'recoit de l injection Nest la participation dont %p lit la seance',
    async (CasDUsage) => {
      const sessions = createMockSessionsRepo();
      sessions.findById.mockResolvedValue(buildSessionRecord());
      const participants = createMockParticipantsRepo();
      participants.evincer.mockResolvedValue(true);
      participants.readmettre.mockResolvedValue(true);
      const moduleRef = await Test.createTestingModule({
        providers: [
          CasDUsage,
          {
            provide: ParticipationEnSeance,
            useValue: creerParticipationEnSeance({ sessions, participants }),
          },
        ],
      }).compile();

      await moduleRef
        .get(CasDUsage)
        .execute('session-uuid', 'teacher-uuid', 'participant-uuid');

      expect(sessions.findById).toHaveBeenCalledWith('session-uuid');
    },
  );
});
