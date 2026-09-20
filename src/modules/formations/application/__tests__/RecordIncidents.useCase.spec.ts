/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import {
  buildIncidentInput,
  buildParticipantRecord,
  createMockIncidentsRepo,
  createMockParticipantsRepo,
} from '../../../../../test/factories/formation.factory';
import { ParticipantNotFoundError } from '../../domain/errors/FormationErrors';
import { RecordIncidentsUseCase } from '../RecordIncidents.useCase';

const SEANCE = 'session-uuid';
const POSTE = 'participant-uuid';

describe('RecordIncidentsUseCase', () => {
  let incidents: ReturnType<typeof createMockIncidentsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let sut: RecordIncidentsUseCase;

  const remonter = (lot: ReturnType<typeof buildIncidentInput>[]) =>
    sut.execute(SEANCE, POSTE, lot);

  beforeEach(() => {
    incidents = createMockIncidentsRepo();
    participants = createMockParticipantsRepo();
    sut = new RecordIncidentsUseCase(incidents, participants);
  });

  it('enregistre les incidents de types connus', async () => {
    const lot = [
      buildIncidentInput({ type: 'tab_hidden' }),
      buildIncidentInput({ type: 'copy_attempt' }),
    ];
    await remonter(lot);
    expect(incidents.createMany).toHaveBeenCalledWith(lot);
  });

  it('ignore silencieusement un type inconnu sans faire echouer le lot', async () => {
    const connu = buildIncidentInput({ type: 'window_blur' });
    const inconnu = buildIncidentInput({ type: 'type_jamais_vu' });
    await expect(remonter([connu, inconnu])).resolves.toBeUndefined();
    expect(incidents.createMany).toHaveBeenCalledWith([connu]);
  });

  it('n appelle pas le depot quand aucun type n est connu', async () => {
    const lot = [buildIncidentInput({ type: 'type_jamais_vu' })];
    await remonter(lot);
    expect(incidents.createMany).not.toHaveBeenCalled();
  });

  it('refuse un envoi qui depasse la limite de volume', async () => {
    const lot = Array.from({ length: 201 }, () => buildIncidentInput());
    await expect(remonter(lot)).rejects.toThrow(DomainValidationError);
    expect(incidents.createMany).not.toHaveBeenCalled();
  });

  it('refuse le journal d incidents d un participant evince', async () => {
    participants.findById.mockResolvedValue(
      buildParticipantRecord({
        evinceLe: new Date('2026-09-20T09:00:00.000Z'),
      }),
    );

    await expect(
      remonter([buildIncidentInput({ type: 'tab_hidden' })]),
    ).rejects.toThrow(ParticipantNotFoundError);
    expect(incidents.createMany).not.toHaveBeenCalled();
  });
});
