import { Column, ForeignKey, PrimaryGeneratedColumn } from 'typeorm';
import { UsersEntity } from './Users.entity';

export function JetonDUtilisateur(table: string) {
  abstract class Jeton {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ForeignKey(() => UsersEntity, {
      name: `${table}_user_id_fkey`,
      onDelete: 'CASCADE',
    })
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'token_hash', type: 'varchar', length: 64, unique: true })
    tokenHash: string;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt: Date;
  }
  return Jeton;
}
