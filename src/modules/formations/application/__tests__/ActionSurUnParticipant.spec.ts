/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  creerParticipationEnSeance,
  monterDepotsDeParticipation,
} from '../../../../../test/factories/cours.factory';
import {
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { verifierActionSurParticipant } from '../../../../../test/helpers/gardes-de-seance';
import type { ActionSurUnParticipant } from '../ActionSurUnParticipant';
import { EvincerParticipantUseCase } from '../EvincerParticipant.useCase';
import { LibererPosteUseCase } from '../LibererPoste.useCase';
import { ParticipationEnSeance } from '../ParticipationEnSeance';
import { ReadmettreParticipantUseCase } from '../ReadmettreParticipant.useCase';

const PARTICIPANT_ID = 'participant-uuid';

describe('ActionSurUnParticipant', () => {
  it.each([
    EvincerParticipantUseCase,
    ReadmettreParticipantUseCase,
    LibererPosteUseCase,
  ])(
    'recoit de l injection Nest la participation dont %p lit la seance, puis notifie le pupitre',
    async (CasDUsage) => {
      const sessions = createMockSessionsRepo();
      sessions.findById.mockResolvedValue(buildSessionRecord());
      const participants = createMockParticipantsRepo();
      participants.evincer.mockResolvedValue(true);
      participants.readmettre.mockResolvedValue(true);
      const cache = createMockSessionStateCache();
      const moduleRef = await Test.createTestingModule({
        providers: [
          CasDUsage,
          {
            provide: ParticipationEnSeance,
            useValue: creerParticipationEnSeance({
              sessions,
              participants,
              cache,
            }),
          },
        ],
      }).compile();

      await moduleRef
        .get(CasDUsage)
        .execute('session-uuid', 'teacher-uuid', PARTICIPANT_ID);

      expect(sessions.findById).toHaveBeenCalledWith('session-uuid');
      expect(cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
    },
  );

  describe.each([
    [
      'evince le participant',
      EvincerParticipantUseCase,
      'evincer',
      'signale un participant absent ou deja evince',
    ],
    [
      'S1 · libere le poste, pour que l etudiant reprenne sa place depuis un autre poste',
      LibererPosteUseCase,
      'libererPoste',
      'S1 · signale un participant absent de la seance ou evince',
    ],
  ] as const)('%s', (titre, CasDUsage, methode, titreDuRefus) => {
    let depots: ReturnType<typeof monterDepotsDeParticipation>;
    let sut: ActionSurUnParticipant;

    const agirPar = (teacherId: string) =>
      sut.execute('session-uuid', teacherId, PARTICIPANT_ID);

    beforeEach(() => {
      depots = monterDepotsDeParticipation(buildSessionRecord());
      depots.participants[methode].mockResolvedValue(true);
      sut = new CasDUsage(depots.participation);
    });

    it(`${titre} de la seance du formateur proprietaire, puis notifie le pupitre`, async () => {
      await agirPar('teacher-uuid');

      expect(depots.participants[methode]).toHaveBeenCalledWith(
        'session-uuid',
        PARTICIPANT_ID,
      );
      expect(depots.cache.signalerActivite).toHaveBeenCalledWith(
        'session-uuid',
      );
    });

    verifierActionSurParticipant(titreDuRefus, () => ({
      ...depots,
      executerPar: agirPar,
      action: depots.participants[methode],
    }));
  });
});
