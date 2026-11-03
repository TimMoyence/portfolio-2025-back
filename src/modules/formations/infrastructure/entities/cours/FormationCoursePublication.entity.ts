import { Check, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'formation_course_publications' })
@Check('chk_formation_course_publication_version', '"version_publiee" > 0')
export class FormationCoursePublicationEntity {
  @PrimaryColumn({ type: 'varchar', length: 120 })
  slug: string;

  @Column({ name: 'version_publiee', type: 'int' })
  versionPubliee: number;

  @Column({ name: 'publiee_le', type: 'timestamptz', default: () => 'now()' })
  publieeLe: Date;

  @Column({ name: 'publiee_par', type: 'uuid', nullable: true })
  publieePar: string | null;
}
