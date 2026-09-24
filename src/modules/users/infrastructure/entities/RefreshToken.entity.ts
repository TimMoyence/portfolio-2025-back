import { Column, CreateDateColumn, Entity, Index } from 'typeorm';
import { JetonDUtilisateur } from './jeton-d-utilisateur';

@Entity({ name: 'refresh_tokens' })
@Index('IDX_refresh_tokens_user_id', ['userId'])
@Index('IDX_refresh_tokens_expires_at', ['expiresAt'])
@Index('IDX_refresh_tokens_not_revoked', ['revoked'], {
  where: '"revoked" = false',
})
export class RefreshTokenEntity extends JetonDUtilisateur('refresh_tokens') {
  @Column({ name: 'revoked', type: 'boolean', default: false })
  revoked: boolean;

  @Column({ name: 'rotation_grace_until', type: 'timestamp', nullable: true })
  rotationGraceUntil: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
