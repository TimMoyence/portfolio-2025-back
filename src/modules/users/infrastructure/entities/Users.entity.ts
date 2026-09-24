import { ColonnesDeTrace } from '../../../../common/infrastructure/typeorm/ColonnesDeTrace';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class UsersEntity extends ColonnesDeTrace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true })
  passwordHash: string | null;

  @Column({ name: 'google_id', type: 'varchar', nullable: true, unique: true })
  googleId: string | null;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'simple-array', default: '' })
  roles: string[];

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;
}
