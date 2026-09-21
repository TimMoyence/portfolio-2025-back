import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UsersEntity } from '../../../users/infrastructure/entities/Users.entity';

@Entity({ name: 'sebastian_profiles' })
export class SebastianProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ForeignKey(() => UsersEntity, {
    name: 'sebastian_profiles_user_id_fkey',
    onDelete: 'CASCADE',
  })
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({
    name: 'weight_kg',
    type: 'decimal',
    precision: 5,
    scale: 1,
    default: () => '70.0',
  })
  weightKg: number;

  @Column({
    name: 'widmark_r',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: () => '0.68',
  })
  widmarkR: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
