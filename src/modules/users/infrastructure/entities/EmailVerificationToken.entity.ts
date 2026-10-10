import { CreateDateColumn, Entity, Index } from 'typeorm';
import { JetonDUtilisateur } from './jeton-d-utilisateur';

@Entity({ name: 'email_verification_tokens' })
@Index('IDX_email_verification_tokens_user_id', ['userId'])
@Index('IDX_email_verification_tokens_expires_at', ['expiresAt'])
export class EmailVerificationTokenEntity extends JetonDUtilisateur(
  'email_verification_tokens',
) {
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
