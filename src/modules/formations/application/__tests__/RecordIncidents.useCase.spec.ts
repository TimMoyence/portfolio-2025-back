/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { createMockIncidentsRepo } from '../../../../../test/factories/formation.factory';
import type { IncidentInput } from '../../domain/IIncidents.repository';
import { RecordIncidentsUseCase } from '../RecordIncidents.useCase';

function buildIncident(overrides: Partial<IncidentInput> = {}): IncidentInput {
  return {
    sessionId: 'session-uuid',
    participantId: 'participant-uuid',
    type: 'tab_hidden',
    contexte: null,
    horodatage: new Date('2026-09-11T08:12:00.000Z'),
    ...overrides,
  };
}

describe('RecordIncidentsUseCase', () => {
  let incidents: ReturnType<typeof createMockIncidentsRepo>;
  let sut: RecordIncidentsUseCase;

  beforeEach(() => {
    incidents = createMockIncidentsRepo();
    sut = new RecordIncidentsUseCase(incidents);
  });

  it('enregistre les incidents de types connus', async () => {
    const lot = [
      buildIncident({ type: 'tab_hidden' }),
      buildIncident({ type: 'copy_attempt' }),
    ];
    await sut.execute(lot);
    expect(incidents.createMany).toHaveBeenCalledWith(lot);
  });

  it('ignore silencieusement un type inconnu sans faire echouer le lot', async () => {
    const connu = buildIncident({ type: 'window_blur' });
    const inconnu = buildIncident({ type: 'type_jamais_vu' });
    await expect(sut.execute([connu, inconnu])).resolves.toBeUndefined();
    expect(incidents.createMany).toHaveBeenCalledWith([connu]);
  });

  it('n appelle pas le depot quand aucun type n est connu', async () => {
    const lot = [buildIncident({ type: 'type_jamais_vu' })];
    await sut.execute(lot);
    expect(incidents.createMany).not.toHaveBeenCalled();
  });

  it('refuse un envoi qui depasse la limite de volume', async () => {
    const lot = Array.from({ length: 201 }, () => buildIncident());
    await expect(sut.execute(lot)).rejects.toThrow(DomainValidationError);
    expect(incidents.createMany).not.toHaveBeenCalled();
  });
});
