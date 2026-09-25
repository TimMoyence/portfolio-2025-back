/* eslint-disable @typescript-eslint/unbound-method */
import { monterDepotsDeParticipation } from '../../../../../test/factories/cours.factory';
import { buildSessionRecord } from '../../../../../test/factories/formation.factory';
import { verifierActionSurParticipant } from '../../../../../test/helpers/gardes-de-seance';
import { EvincerParticipantUseCase } from '../EvincerParticipant.useCase';

const TEACHER_ID = 'teacher-uuid';
const PARTICIPANT_ID = 'participant-uuid';

describe('EvincerParticipantUseCase', () => {
  let depots: ReturnType<typeof monterDepotsDeParticipation>;
  let sut: EvincerParticipantUseCase;

  const evincerPar = (teacherId: string) =>
    sut.execute('session-uuid', teacherId, PARTICIPANT_ID);

  beforeEach(() => {
    depots = monterDepotsDeParticipation(buildSessionRecord());
    sut = new EvincerParticipantUseCase(depots.participation);
  });

  it('evince le participant de la seance du formateur proprietaire', async () => {
    await evincerPar(TEACHER_ID);

    expect(depots.participants.evincer).toHaveBeenCalledWith(
      'session-uuid',
      PARTICIPANT_ID,
    );
    expect(depots.cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
  });

  verifierActionSurParticipant(
    'signale un participant absent ou deja evince',
    () => ({
      ...depots,
      executerPar: evincerPar,
      action: depots.participants.evincer,
    }),
  );
});
