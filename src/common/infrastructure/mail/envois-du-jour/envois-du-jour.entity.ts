import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'envois_du_jour' })
export class EnvoisDuJourEntity {
  @PrimaryColumn({ type: 'date' })
  jour: string;

  @Column({ type: 'integer', default: 0 })
  envoyes: number;
}
