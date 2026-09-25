/* eslint-disable @typescript-eslint/unbound-method */
import { monterDepotsDeParticipation } from '../../../../../test/factories/cours.factory';
import { buildSessionRecord } from '../../../../../test/factories/formation.factory';
import { verifierActionSurParticipant } from '../../../../../test/helpers/gardes-de-seance';
import {
  GraineRepriseError,
  SeanceCompleteError,
} from '../../domain/errors/FormationErrors';
import { ReadmettreParticipantUseCase } from '../ReadmettreParticipant.useCase';

const TEACHER_ID = 'teacher-uuid';
const PARTICIPANT_ID = 'participant-uuid';

describe('ReadmettreParticipantUseCase', () => {
  let depots: ReturnType<typeof monterDepotsDeParticipation>;
  let sut: ReadmettreParticipantUseCase;

  const readmettrePar = (teacherId: string) =>
    sut.execute('session-uuid', teacherId, PARTICIPANT_ID);

  beforeEach(() => {
    depots = monterDepotsDeParticipation(buildSessionRecord({ capacite: 30 }));
    depots.participants.countBySession.mockResolvedValue(12);
    depots.participants.readmettre.mockResolvedValue(true);
    sut = new ReadmettreParticipantUseCase(depots.participation);
  });

  it('readmet le participant de la seance du formateur proprietaire', async () => {
    await readmettrePar(TEACHER_ID);

    expect(depots.participants.readmettre).toHaveBeenCalledWith(
      'session-uuid',
      PARTICIPANT_ID,
      30,
    );
    expect(depots.cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
  });

  it('S2 · laisse le depot verifier la capacite sous verrou, sans compter avant lui', async () => {
    depots.participants.readmettre.mockRejectedValue(
      new SeanceCompleteError(30),
    );

    await expect(readmettrePar(TEACHER_ID)).rejects.toThrow(
      SeanceCompleteError,
    );
    expect(depots.participants.countBySession).not.toHaveBeenCalled();
    expect(depots.cache.signalerActivite).not.toHaveBeenCalled();
  });

  it('S2 · laisse remonter en conflit la graine reprise entre-temps par un autre poste', async () => {
    depots.participants.readmettre.mockRejectedValue(new GraineRepriseError());

    await expect(readmettrePar(TEACHER_ID)).rejects.toThrow(GraineRepriseError);
  });

  verifierActionSurParticipant(
    'signale un participant absent ou qui n etait pas evince',
    () => ({
      ...depots,
      executerPar: readmettrePar,
      action: depots.participants.readmettre,
    }),
  );
});
