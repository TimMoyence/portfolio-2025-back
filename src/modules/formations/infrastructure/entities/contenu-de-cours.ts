import { Column, PrimaryGeneratedColumn } from 'typeorm';

export abstract class ContenuDeCours {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'duree_minutes', type: 'int' })
  dureeMinutes: number;

  @Column({ type: 'jsonb' })
  concepts: readonly string[];
}
