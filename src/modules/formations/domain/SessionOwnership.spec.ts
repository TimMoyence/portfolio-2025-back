import {
  SessionNotFoundError,
  SessionNotOwnedError,
} from './errors/FormationErrors';
import { assertSessionOwnedBy } from './SessionOwnership';
import type { SessionRecord } from './ISessions.repository';

function buildSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: 'session-uuid',
    courseSlug: 'b1-09-interets-composes',
    teacherId: 'teacher-uuid',
    code: '4271',
    etat: 'en_cours',
    modeRythme: 'pilote',
    ecranCourant: 0,
    intervalleLibre: null,
    bareme: {
      version: 1,
      graineReference: 9_999_999,
      questions: [],
      tirages: [],
    },
    ouverteLe: new Date('2026-09-11T08:00:00.000Z'),
    fermeeLe: null,
    majLe: new Date('2026-09-11T08:00:00.000Z'),
    ...overrides,
  };
}

describe('assertSessionOwnedBy', () => {
  it('retourne la session quand elle existe et appartient a l appelant', () => {
    const session = buildSession();

    expect(assertSessionOwnedBy(session, 'session-uuid', 'teacher-uuid')).toBe(
      session,
    );
  });

  it('leve SessionNotFoundError quand la session est introuvable', () => {
    expect(() =>
      assertSessionOwnedBy(null, 'session-uuid', 'teacher-uuid'),
    ).toThrow(SessionNotFoundError);
  });

  it('leve SessionNotOwnedError quand l appelant n est pas le formateur', () => {
    const session = buildSession({ teacherId: 'teacher-uuid' });

    expect(() =>
      assertSessionOwnedBy(session, 'session-uuid', 'autre-teacher-uuid'),
    ).toThrow(SessionNotOwnedError);
  });
});
