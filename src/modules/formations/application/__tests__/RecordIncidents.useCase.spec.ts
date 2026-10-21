/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildIncidentInput,
  buildParticipantRecord,
  createMockIncidentsRepo,
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  ParticipantNotFoundError,
  SessionClosedError,
  SessionNotFoundError,
} from '../../domain/errors/FormationErrors';
import { RecordIncidentsUseCase } from '../RecordIncidents.useCase';

const SEANCE = 'session-uuid';
const POSTE = 'participant-uuid';

describe('RecordIncidentsUseCase', () => {
  let incidents: ReturnType<typeof createMockIncidentsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let sut: RecordIncidentsUseCase;

  const remonter = (lot: ReturnType<typeof buildIncidentInput>[]) =>
    sut.execute(SEANCE, POSTE, lot);

  beforeEach(() => {
    incidents = createMockIncidentsRepo();
    participants = createMockParticipantsRepo();
    sessions = createMockSessionsRepo();
    sut = new RecordIncidentsUseCase(incidents, participants, sessions);
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
