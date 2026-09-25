import { Column, CreateDateColumn, Entity, Index } from 'typeorm';
import { LigneDeParticipant } from './ligne-de-participant';

@Entity({ name: 'formation_escape_attempts' })
@Index('idx_formation_escape_attempts_participant', [
  'participantId',
  'enigmeId',
])
export class FormationEscapeAttemptEntity extends LigneDeParticipant(
  'formation_escape_attempts',
) {
  @Column({ name: 'enigme_id', type: 'varchar', length: 60 })
  enigmeId: string;

  @Column({
    name: 'valeur_normalisee',
    type: 'numeric',
    nullable: true,
    transformer: {
      to: (valeur: number | null) => valeur,
      from: (valeur: string | null) =>
        valeur === null ? null : Number(valeur),
    },
  })
  valeurNormalisee: number | null;

  @Column({ type: 'varchar', length: 40 })
  saisie: string;

  @Column({ type: 'boolean' })
  correcte: boolean;

  @CreateDateColumn({ name: 'soumis_le', type: 'timestamptz' })
  soumisLe: Date;
}
