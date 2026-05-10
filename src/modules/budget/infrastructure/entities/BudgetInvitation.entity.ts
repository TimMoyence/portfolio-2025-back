import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Invitation a rejoindre un groupe budget. L'identification se fait
 * via un token magique hashe (sha256) stocke dans `tokenHash`. Les
 * deux index partiels assurent qu'une seule invitation active
 * (ni acceptee ni revoquee) peut exister pour une paire (groupId,
 * targetEmail) et accelerent la recherche des invitations en attente.
 */
@Entity({ name: 'budget_invitations' })
@Index('uq_budget_invitations_active', ['groupId', 'targetEmail'], {
  unique: true,
  where: '"accepted_at" IS NULL AND "revoked_at" IS NULL',
})
@Index('idx_budget_invitations_group_pending', ['groupId'], {
  where: '"accepted_at" IS NULL AND "revoked_at" IS NULL',
})
export class BudgetInvitationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @Column({ name: 'inviter_user_id', type: 'uuid' })
  inviterUserId: string;

  @Column({ name: 'target_email', type: 'varchar', length: 254 })
  targetEmail: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 64, unique: true })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ name: 'accepted_by_user_id', type: 'uuid', nullable: true })
  acceptedByUserId: string | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
