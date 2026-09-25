import { Column, Entity, Index } from 'typeorm';
import {
  ColonneDeCreation,
  ColonneDeMiseAJour,
} from '../../../../common/infrastructure/typeorm/ColonnesDeTrace';
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

  @ColonneDeCreation()
  createdAt: Date;

  @ColonneDeMiseAJour()
  updatedAt: Date;
}
