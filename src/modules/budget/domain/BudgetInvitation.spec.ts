import { BudgetInvitation } from './BudgetInvitation';

describe('BudgetInvitation', () => {
  const baseProps = {
    id: 'inv-1',
    groupId: 'group-1',
    inviterUserId: 'user-1',
    targetEmail: 'bob@example.com',
    tokenHash: 'a'.repeat(64),
    expiresAt: new Date('2026-05-17T00:00:00Z'),
    acceptedAt: null,
    acceptedByUserId: null,
    revokedAt: null,
    createdAt: new Date('2026-05-10T00:00:00Z'),
  };

  it('isPending() retourne true si ni acceptee ni revoquee ni expiree', () => {
    const inv = new BudgetInvitation({ ...baseProps });
    expect(inv.isPending(new Date('2026-05-12T00:00:00Z'))).toBe(true);
  });

  it('isPending() retourne false si acceptedAt est defini', () => {
    const inv = new BudgetInvitation({
      ...baseProps,
      acceptedAt: new Date('2026-05-11T00:00:00Z'),
    });
    expect(inv.isPending(new Date('2026-05-12T00:00:00Z'))).toBe(false);
  });

  it('isPending() retourne false si revokedAt est defini', () => {
    const inv = new BudgetInvitation({
      ...baseProps,
      revokedAt: new Date('2026-05-11T00:00:00Z'),
    });
    expect(inv.isPending(new Date('2026-05-12T00:00:00Z'))).toBe(false);
  });

  it('isPending() retourne false si expiresAt est depasse', () => {
    const inv = new BudgetInvitation({ ...baseProps });
    expect(inv.isPending(new Date('2026-05-20T00:00:00Z'))).toBe(false);
  });

  it('isExpired(now) verifie expires_at < now', () => {
    const inv = new BudgetInvitation({ ...baseProps });
    expect(inv.isExpired(new Date('2026-05-20T00:00:00Z'))).toBe(true);
    expect(inv.isExpired(new Date('2026-05-15T00:00:00Z'))).toBe(false);
  });
});
