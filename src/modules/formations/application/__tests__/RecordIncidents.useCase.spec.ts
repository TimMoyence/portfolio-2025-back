/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import {
  buildIncidentInput,
  createMockIncidentsRepo,
} from '../../../../../test/factories/formation.factory';
import { RecordIncidentsUseCase } from '../RecordIncidents.useCase';

describe('RecordIncidentsUseCase', () => {
  let incidents: ReturnType<typeof createMockIncidentsRepo>;
  let sut: RecordIncidentsUseCase;

  beforeEach(() => {
    incidents = createMockIncidentsRepo();
    sut = new RecordIncidentsUseCase(incidents);
  });

  it('enregistre les incidents de types connus', async () => {
    const lot = [
      buildIncidentInput({ type: 'tab_hidden' }),
      buildIncidentInput({ type: 'copy_attempt' }),
    ];
    await sut.execute(lot);
    expect(incidents.createMany).toHaveBeenCalledWith(lot);
  });

  it('ignore silencieusement un type inconnu sans faire echouer le lot', async () => {
    const connu = buildIncidentInput({ type: 'window_blur' });
    const inconnu = buildIncidentInput({ type: 'type_jamais_vu' });
    await expect(sut.execute([connu, inconnu])).resolves.toBeUndefined();
    expect(incidents.createMany).toHaveBeenCalledWith([connu]);
  });

  it('n appelle pas le depot quand aucun type n est connu', async () => {
    const lot = [buildIncidentInput({ type: 'type_jamais_vu' })];
    await sut.execute(lot);
    expect(incidents.createMany).not.toHaveBeenCalled();
  });

  it('refuse un envoi qui depasse la limite de volume', async () => {
    const lot = Array.from({ length: 201 }, () => buildIncidentInput());
    await expect(sut.execute(lot)).rejects.toThrow(DomainValidationError);
    expect(incidents.createMany).not.toHaveBeenCalled();
  });
});
