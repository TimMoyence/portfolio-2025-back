/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildIncidentInput,
  createMockIncidentsRepo,
  buildSessionRecord,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  SessionClosedError,
  SessionNotFoundError,
} from '../../domain/errors/FormationErrors';
import { RecordIncidentsUseCase } from '../RecordIncidents.useCase';

const SEANCE = 'session-uuid';

describe('RecordIncidentsUseCase', () => {
  let incidents: ReturnType<typeof createMockIncidentsRepo>;
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let sut: RecordIncidentsUseCase;

  const remonter = (lot: ReturnType<typeof buildIncidentInput>[]) =>
    sut.execute(SEANCE, lot);

  beforeEach(() => {
    incidents = createMockIncidentsRepo();
    sessions = createMockSessionsRepo();
    sut = new RecordIncidentsUseCase(incidents, sessions);
  });

  it('enregistre les incidents de types connus', async () => {
    const lot = [
      buildIncidentInput({ type: 'tab_hidden' }),
      buildIncidentInput({ type: 'copy_attempt' }),
    ];
    await remonter(lot);
    expect(incidents.createMany).toHaveBeenCalledWith(lot);
  });

  it('n appelle pas le depot pour un lot vide', async () => {
    await remonter([]);
    expect(incidents.createMany).not.toHaveBeenCalled();
  });

  it('S6 · refuse le journal d incidents d une seance close', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ id: SEANCE, etat: 'terminee' }),
    );

    await expect(
      remonter([buildIncidentInput({ type: 'tab_hidden' })]),
    ).rejects.toThrow(SessionClosedError);
    expect(incidents.createMany).not.toHaveBeenCalled();
  });

  it('S6 · accepte le journal d une seance ouverte mais pas encore demarree', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ id: SEANCE, etat: 'attente' }),
    );
    const lot = [buildIncidentInput({ type: 'tab_hidden' })];

    await remonter(lot);

    expect(incidents.createMany).toHaveBeenCalledWith(lot);
  });

  it('S6 · refuse le journal d une seance inconnue', async () => {
    sessions.findById.mockResolvedValue(null);

    await expect(
      remonter([buildIncidentInput({ type: 'tab_hidden' })]),
    ).rejects.toThrow(SessionNotFoundError);
    expect(incidents.createMany).not.toHaveBeenCalled();
  });
});
