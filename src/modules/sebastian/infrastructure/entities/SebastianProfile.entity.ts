import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Entite TypeORM pour la table sebastian_profiles. */
@Entity({ name: 'sebastian_profiles' })
export class SebastianProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    name: 'weight_kg',
    type: 'decimal',
    precision: 5,
    scale: 1,
    default: 70.0,
  })
  weightKg: number;

  @Column({
    name: 'widmark_r',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0.68,
  })
  widmarkR: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
