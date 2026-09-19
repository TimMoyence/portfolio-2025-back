import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsersEntity } from './Users.entity';

@Entity({ name: 'refresh_tokens' })
@Index('IDX_refresh_tokens_user_id', ['userId'])
@Index('IDX_refresh_tokens_expires_at', ['expiresAt'])
@Index('IDX_refresh_tokens_not_revoked', ['revoked'], {
  where: '"revoked" = false',
})
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ForeignKey(() => UsersEntity, {
    name: 'refresh_tokens_user_id_fkey',
    onDelete: 'CASCADE',
  })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 64, unique: true })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'revoked', type: 'boolean', default: false })
  revoked: boolean;

  @Column({ name: 'rotation_grace_until', type: 'timestamp', nullable: true })
  rotationGraceUntil: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
