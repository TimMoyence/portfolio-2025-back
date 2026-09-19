import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsersEntity } from './Users.entity';

@Entity({ name: 'email_verification_tokens' })
@Index('IDX_email_verification_tokens_user_id', ['userId'])
@Index('IDX_email_verification_tokens_expires_at', ['expiresAt'])
export class EmailVerificationTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ForeignKey(() => UsersEntity, {
    name: 'email_verification_tokens_user_id_fkey',
    onDelete: 'CASCADE',
  })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  token: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
