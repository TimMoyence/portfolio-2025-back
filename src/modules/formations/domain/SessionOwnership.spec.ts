import { buildSessionRecord } from '../../../../test/factories/formation.factory';
import {
  SessionNotFoundError,
  SessionNotOwnedError,
} from './errors/FormationErrors';
import {
  assertSessionOwnedBy,
  assertSessionReadableBy,
} from './SessionOwnership';

const SESSION_ID = 'session-uuid';
const PROPRIETAIRE = 'teacher-uuid';

describe('assertSessionOwnedBy', () => {
  it('retourne la session quand elle existe et appartient a l appelant', () => {
    const session = buildSessionRecord({ teacherId: PROPRIETAIRE });

    expect(assertSessionOwnedBy(session, SESSION_ID, PROPRIETAIRE)).toBe(
      session,
    );
  });

  it('leve SessionNotFoundError quand la session est introuvable', () => {
    expect(() => assertSessionOwnedBy(null, SESSION_ID, PROPRIETAIRE)).toThrow(
      SessionNotFoundError,
    );
  });

  it('leve SessionNotOwnedError quand l appelant n est pas le formateur', () => {
    const session = buildSessionRecord({ teacherId: PROPRIETAIRE });

    expect(() =>
      assertSessionOwnedBy(session, SESSION_ID, 'autre-teacher-uuid'),
    ).toThrow(SessionNotOwnedError);
  });
});

describe('assertSessionReadableBy', () => {
  const session = buildSessionRecord({ teacherId: PROPRIETAIRE });

  it('laisse le formateur proprietaire lire sa seance', () => {
    expect(
      assertSessionReadableBy(session, SESSION_ID, {
        id: PROPRIETAIRE,
        roles: ['teacher'],
      }),
    ).toBe(session);
  });

  it('laisse un administrateur lire la seance d un formateur', () => {
    expect(
      assertSessionReadableBy(session, SESSION_ID, {
        id: 'admin-uuid',
        roles: ['admin'],
      }),
    ).toBe(session);
  });

  it('refuse la lecture a un autre formateur', () => {
    expect(() =>
      assertSessionReadableBy(session, SESSION_ID, {
        id: 'autre-teacher-uuid',
        roles: ['teacher'],
      }),
    ).toThrow(SessionNotOwnedError);
  });

  it('leve SessionNotFoundError quand la seance est introuvable, meme pour un administrateur', () => {
    expect(() =>
      assertSessionReadableBy(null, SESSION_ID, {
        id: 'admin-uuid',
        roles: ['admin'],
      }),
    ).toThrow(SessionNotFoundError);
  });
});
