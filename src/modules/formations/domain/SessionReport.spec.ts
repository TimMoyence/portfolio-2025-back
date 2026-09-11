import {
  buildAnswerRecord,
  buildIncidentInput,
  buildParticipantRecord,
  buildSessionRecord,
} from '../../../../test/factories/formation.factory';
import type { IncidentRecord } from './IIncidents.repository';
import { buildRapportSession } from './SessionReport';

function buildIncidentRecord(
  overrides: Partial<IncidentRecord> = {},
): IncidentRecord {
  return { id: 'incident-uuid', ...buildIncidentInput(), ...overrides };
}

describe('buildRapportSession', () => {
  it('compte une reponse fausse dans la completion, pas seulement une reponse juste', () => {
    const rapport = buildRapportSession({
      session: buildSessionRecord(),
      participants: [buildParticipantRecord({ id: 'p1' })],
      answers: [buildAnswerRecord({ participantId: 'p1', correcte: false })],
      incidents: [],
    });

    expect(rapport.participants[0].completion).toBe(1);
  });

  it('exclut les questions non notees du denominateur de completion', () => {
    const session = buildSessionRecord({
      bareme: {
        version: 1,
        questions: [
          {
            id: 'Q-1',
            type: 'numeric',
            concept: 'capitalisation',
            noteCompte: true,
          },
          {
            id: 'Q-2',
            type: 'numeric',
            concept: 'actualisation',
            noteCompte: false,
          },
        ],
        tirages: [],
      },
    });

    const rapport = buildRapportSession({
      session,
      participants: [buildParticipantRecord({ id: 'p1' })],
      answers: [buildAnswerRecord({ participantId: 'p1', questionId: 'Q-1' })],
      incidents: [],
    });

    expect(rapport.participants[0].completion).toBe(1);
  });

  it('reprend la date de fermeture de la session quand elle existe', () => {
    const fermeeLe = new Date('2026-09-11T10:00:00.000Z');
    const rapport = buildRapportSession({
      session: buildSessionRecord({ fermeeLe }),
      participants: [],
      answers: [],
      incidents: [],
    });

    expect(rapport.fermeeLe).toBe(fermeeLe);
  });

  it('substitue la date courante quand la session n est pas encore fermee', () => {
    const rapport = buildRapportSession({
      session: buildSessionRecord({ fermeeLe: null }),
      participants: [],
      answers: [],
      incidents: [],
    });

    expect(rapport.fermeeLe).toBeInstanceOf(Date);
  });

  it('signale un concept sous 70 pourcent de reussite comme fragile', () => {
    const rapport = buildRapportSession({
      session: buildSessionRecord(),
      participants: [],
      answers: [
        buildAnswerRecord({ concept: 'interet-simple', correcte: false }),
        buildAnswerRecord({ concept: 'interet-simple', correcte: false }),
        buildAnswerRecord({ concept: 'interet-simple', correcte: true }),
      ],
      incidents: [],
    });

    expect(rapport.conceptsFragiles).toContain('interet-simple');
  });

  it('n inclut pas un concept dont la reussite atteint 70 pourcent ou plus', () => {
    const rapport = buildRapportSession({
      session: buildSessionRecord(),
      participants: [],
      answers: [
        buildAnswerRecord({ concept: 'actualisation', correcte: true }),
        buildAnswerRecord({ concept: 'actualisation', correcte: true }),
        buildAnswerRecord({ concept: 'actualisation', correcte: true }),
        buildAnswerRecord({ concept: 'actualisation', correcte: true }),
        buildAnswerRecord({ concept: 'actualisation', correcte: false }),
      ],
      incidents: [],
    });

    expect(rapport.conceptsFragiles).not.toContain('actualisation');
  });

  it('compte les incidents par participant', () => {
    const rapport = buildRapportSession({
      session: buildSessionRecord(),
      participants: [
        buildParticipantRecord({ id: 'p1' }),
        buildParticipantRecord({ id: 'p2', email: 'b@example.com' }),
      ],
      answers: [],
      incidents: [
        buildIncidentRecord({ participantId: 'p1' }),
        buildIncidentRecord({ participantId: 'p1' }),
        buildIncidentRecord({ participantId: 'p2' }),
      ],
    });

    const p1 = rapport.participants.find(
      (participant) => participant.email === 'theo.martin@example.com',
    );
    expect(p1?.incidents).toBe(2);
  });

  it('classe les participants sous le seuil via computeCohortScore', () => {
    const rapport = buildRapportSession({
      session: buildSessionRecord(),
      participants: [
        buildParticipantRecord({ id: 'p1' }),
        buildParticipantRecord({ id: 'p2', email: 'b@example.com' }),
      ],
      answers: [buildAnswerRecord({ participantId: 'p1' })],
      incidents: [],
    });

    const p1 = rapport.participants[0];
    const p2 = rapport.participants[1];
    expect(p1.completion).toBe(1);
    expect(p2.completion).toBe(0);
    expect(p2.sousSeuil).toBe(true);
  });
});
