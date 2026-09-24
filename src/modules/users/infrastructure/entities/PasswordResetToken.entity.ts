import { Column, CreateDateColumn, Entity, Index } from 'typeorm';
import { JetonDUtilisateur } from './jeton-d-utilisateur';

@Entity({ name: 'password_reset_tokens' })
@Index('IDX_password_reset_tokens_user_id', ['userId'])
@Index('IDX_password_reset_tokens_expires_at', ['expiresAt'])
@Index('IDX_password_reset_tokens_used_at_null', ['usedAt'], {
  where: '"used_at" IS NULL',
})
export class PasswordResetTokenEntity extends JetonDUtilisateur(
  'password_reset_tokens',
) {
  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
