import { DataSource, DataSourceOptions } from 'typeorm';
import { BudgetInvitationEntity } from '../src/modules/budget/infrastructure/entities/BudgetInvitation.entity';
import { BudgetInvitationTypeOrmRepository } from '../src/modules/budget/infrastructure/BudgetInvitation.repository.typeORM';

const runDbIntegration = process.env.RUN_DB_INTEGRATION === 'true';
const describeDb = runDbIntegration ? describe : describe.skip;

function parsePort(raw: string | undefined): number {
  if (!raw) return 5432;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 5432;
}

function buildOptions(): DataSourceOptions {
  const sslEnabled =
    process.env.DB_SSL === 'true' || process.env.DATABASE_SSL === 'true';
  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: parsePort(process.env.DB_PORT),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'portfolio_2025_ci',
    entities: [BudgetInvitationEntity],
    synchronize: true,
    dropSchema: true,
    logging: false,
    ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

describeDb('BudgetInvitationTypeOrmRepository (db integration)', () => {
  let dataSource: DataSource;
  let repository: BudgetInvitationTypeOrmRepository;

  const GROUP_ID = '00000000-0000-4000-a000-000000000001';
  const OTHER_GROUP_ID = '00000000-0000-4000-a000-000000000002';
  const INVITER_ID = '00000000-0000-4000-a000-000000000010';
  const ACCEPTOR_ID = '00000000-0000-4000-a000-000000000020';

  function inviteFixture(overrides?: {
    groupId?: string;
    targetEmail?: string;
    tokenHash?: string;
    expiresAt?: Date;
  }): {
    groupId: string;
    inviterUserId: string;
    targetEmail: string;
    tokenHash: string;
    expiresAt: Date;
  } {
    return {
      groupId: overrides?.groupId ?? GROUP_ID,
      inviterUserId: INVITER_ID,
      targetEmail: overrides?.targetEmail ?? 'bob@example.com',
      tokenHash: overrides?.tokenHash ?? 'a'.repeat(64),
      expiresAt:
        overrides?.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  beforeAll(async () => {
    dataSource = new DataSource(buildOptions());
    await dataSource.initialize();
    repository = new BudgetInvitationTypeOrmRepository(
      dataSource.getRepository(BudgetInvitationEntity),
    );
  });

  afterEach(async () => {
    await dataSource.getRepository(BudgetInvitationEntity).clear();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('create', () => {
    it('persiste une invitation et retourne le domain mappe', async () => {
      const invitation = await repository.create(inviteFixture());

      expect(invitation.id).toEqual(expect.any(String));
      expect(invitation.groupId).toBe(GROUP_ID);
      expect(invitation.inviterUserId).toBe(INVITER_ID);
      expect(invitation.targetEmail).toBe('bob@example.com');
      expect(invitation.acceptedAt).toBeNull();
      expect(invitation.acceptedByUserId).toBeNull();
      expect(invitation.revokedAt).toBeNull();
      expect(invitation.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('findByTokenHash', () => {
    it('retourne null si le hash est inconnu', async () => {
      const found = await repository.findByTokenHash('z'.repeat(64));
      expect(found).toBeNull();
    });

    it('retourne l invitation correspondante au hash', async () => {
      const created = await repository.create(
        inviteFixture({ tokenHash: 'b'.repeat(64) }),
      );

      const found = await repository.findByTokenHash('b'.repeat(64));

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });
  });

  describe('findActiveByGroupAndEmail', () => {
    it('retourne null si aucune invitation pour la paire', async () => {
      const found = await repository.findActiveByGroupAndEmail(
        GROUP_ID,
        'absent@example.com',
      );
      expect(found).toBeNull();
    });

    it('retourne l invitation pending (non acceptee, non revoquee)', async () => {
      const created = await repository.create(inviteFixture());

      const found = await repository.findActiveByGroupAndEmail(
        GROUP_ID,
        'bob@example.com',
      );

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it('inclut les invitations expirees mais non revoquees (active != pending)', async () => {
      const created = await repository.create(
        inviteFixture({ expiresAt: new Date(Date.now() - 1000) }),
      );

      const found = await repository.findActiveByGroupAndEmail(
        GROUP_ID,
        'bob@example.com',
      );

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it('exclut les invitations acceptees', async () => {
      const created = await repository.create(inviteFixture());
      await repository.markAccepted(created.id, ACCEPTOR_ID, new Date());

      const found = await repository.findActiveByGroupAndEmail(
        GROUP_ID,
        'bob@example.com',
      );

      expect(found).toBeNull();
    });

    it('exclut les invitations revoquees', async () => {
      const created = await repository.create(inviteFixture());
      await repository.markRevoked(created.id, new Date());

      const found = await repository.findActiveByGroupAndEmail(
        GROUP_ID,
        'bob@example.com',
      );

      expect(found).toBeNull();
    });
  });

  describe('findPendingByGroup', () => {
    it('retourne uniquement les invitations non expirees, non acceptees, non revoquees', async () => {
      const now = new Date('2026-05-10T12:00:00Z');
      const pending = await repository.create(
        inviteFixture({
          targetEmail: 'pending@example.com',
          tokenHash: 'p'.repeat(64),
          expiresAt: new Date('2026-05-15T12:00:00Z'),
        }),
      );
      const expired = await repository.create(
        inviteFixture({
          targetEmail: 'expired@example.com',
          tokenHash: 'e'.repeat(64),
          expiresAt: new Date('2026-05-09T12:00:00Z'),
        }),
      );
      const accepted = await repository.create(
        inviteFixture({
          targetEmail: 'accepted@example.com',
          tokenHash: 'd'.repeat(64),
          expiresAt: new Date('2026-05-15T12:00:00Z'),
        }),
      );
      await repository.markAccepted(accepted.id, ACCEPTOR_ID, now);

      const result = await repository.findPendingByGroup(GROUP_ID, now);

      expect(result.map((r) => r.id)).toEqual([pending.id]);
      expect(result.map((r) => r.id)).not.toContain(expired.id);
      expect(result.map((r) => r.id)).not.toContain(accepted.id);
    });

    it('isole les groupes (pas de cross-group leak)', async () => {
      const now = new Date('2026-05-10T12:00:00Z');
      await repository.create(
        inviteFixture({
          groupId: OTHER_GROUP_ID,
          tokenHash: 'o'.repeat(64),
        }),
      );

      const result = await repository.findPendingByGroup(GROUP_ID, now);

      expect(result).toEqual([]);
    });

    it('ordonne par createdAt desc', async () => {
      const now = new Date('2026-05-10T12:00:00Z');
      const first = await repository.create(
        inviteFixture({
          targetEmail: 'first@example.com',
          tokenHash: '1'.repeat(64),
        }),
      );
      // Petite pause pour distinguer createdAt
      await new Promise((r) => setTimeout(r, 10));
      const second = await repository.create(
        inviteFixture({
          targetEmail: 'second@example.com',
          tokenHash: '2'.repeat(64),
        }),
      );

      const result = await repository.findPendingByGroup(GROUP_ID, now);

      expect(result.map((r) => r.id)).toEqual([second.id, first.id]);
    });
  });

  describe('markAccepted / markRevoked', () => {
    it('markAccepted enregistre acceptedAt et acceptedByUserId', async () => {
      const created = await repository.create(inviteFixture());
      const acceptedAt = new Date('2026-05-10T15:30:00Z');

      await repository.markAccepted(created.id, ACCEPTOR_ID, acceptedAt);

      const reloaded = await repository.findByTokenHash(created.tokenHash);
      expect(reloaded!.acceptedAt!.toISOString()).toBe(
        acceptedAt.toISOString(),
      );
      expect(reloaded!.acceptedByUserId).toBe(ACCEPTOR_ID);
    });

    it('markRevoked enregistre revokedAt sans toucher accepted*', async () => {
      const created = await repository.create(inviteFixture());
      const revokedAt = new Date('2026-05-10T16:00:00Z');

      await repository.markRevoked(created.id, revokedAt);

      const reloaded = await repository.findByTokenHash(created.tokenHash);
      expect(reloaded!.revokedAt!.toISOString()).toBe(revokedAt.toISOString());
      expect(reloaded!.acceptedAt).toBeNull();
      expect(reloaded!.acceptedByUserId).toBeNull();
    });
  });

  describe('contrainte unique partielle', () => {
    it('rejette une seconde invitation active sur la meme paire (groupId, targetEmail)', async () => {
      await repository.create(inviteFixture({ tokenHash: 'a'.repeat(64) }));

      await expect(
        repository.create(inviteFixture({ tokenHash: 'b'.repeat(64) })),
      ).rejects.toThrow();
    });

    it('autorise une nouvelle invitation apres revocation de la precedente', async () => {
      const first = await repository.create(
        inviteFixture({ tokenHash: 'a'.repeat(64) }),
      );
      await repository.markRevoked(first.id, new Date());

      const second = await repository.create(
        inviteFixture({ tokenHash: 'b'.repeat(64) }),
      );

      expect(second.id).not.toBe(first.id);
    });

    it('autorise une nouvelle invitation apres acceptation de la precedente', async () => {
      const first = await repository.create(
        inviteFixture({ tokenHash: 'a'.repeat(64) }),
      );
      await repository.markAccepted(first.id, ACCEPTOR_ID, new Date());

      const second = await repository.create(
        inviteFixture({ tokenHash: 'b'.repeat(64) }),
      );

      expect(second.id).not.toBe(first.id);
    });

    it('rejette deux invitations avec le meme tokenHash (unique global)', async () => {
      await repository.create(inviteFixture({ tokenHash: 'x'.repeat(64) }));

      await expect(
        repository.create(
          inviteFixture({
            targetEmail: 'other@example.com',
            tokenHash: 'x'.repeat(64),
          }),
        ),
      ).rejects.toThrow();
    });
  });
});
