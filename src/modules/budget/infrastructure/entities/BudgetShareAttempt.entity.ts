import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Trace des tentatives de partage de budget pour le cooldown anti
 * mail-bombing (CRIT-2 audit 2026-05-09). Une ligne par envoi reussi
 * (ou tentative SMTP) sur la paire (groupId, targetEmail).
 */
@Entity({ name: 'budget_share_attempts' })
@Index('idx_budget_share_attempts_lookup', ['groupId', 'targetEmail', 'sentAt'])
@Index('idx_budget_share_attempts_inviter_quota', ['inviterUserId', 'sentAt'])
export class BudgetShareAttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @Column({ name: 'target_email', type: 'varchar', length: 254 })
  targetEmail: string;

  @Column({ name: 'inviter_user_id', type: 'uuid', nullable: true })
  inviterUserId: string | null;

  @Column({ name: 'sent_at', type: 'timestamptz' })
  sentAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
