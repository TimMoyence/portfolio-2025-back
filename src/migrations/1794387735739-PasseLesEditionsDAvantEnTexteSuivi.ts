import { MigrationInterface, QueryRunner } from 'typeorm';
import { TYPES_DE_SECTION } from '../modules/articles/domain/article-contract';
import {
  type ArticleDAvantLaRefonte,
  enTexteSuivi,
} from '../modules/articles/domain/texte-suivi';

type Ligne = {
  id: string;
  sections: { kind?: unknown }[];
  sources: Record<string, unknown>[];
  provenance: ArticleDAvantLaRefonte['provenance'];
};

const KINDS_DU_RECIT: readonly unknown[] = TYPES_DE_SECTION;

function dAvantLaRefonte(ligne: Ligne): boolean {
  return (
    ligne.sections.some((section) => !KINDS_DU_RECIT.includes(section.kind)) ||
    ligne.sources.some((source) => 'name' in source)
  );
}

export class PasseLesEditionsDAvantEnTexteSuivi1794387735739 implements MigrationInterface {
  name = 'PasseLesEditionsDAvantEnTexteSuivi1794387735739';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const lignes = (await queryRunner.query(
      'SELECT "id", "sections", "sources", "provenance" FROM "articles"',
    )) as Ligne[];
    for (const ligne of lignes.filter(dAvantLaRefonte)) {
      const suivi = enTexteSuivi(ligne as unknown as ArticleDAvantLaRefonte);
      await queryRunner.query(
        'UPDATE "articles" SET "sections" = $1::jsonb, "sources" = $2::jsonb, "provenance" = $3::jsonb WHERE "id" = $4',
        [
          JSON.stringify(suivi.sections),
          JSON.stringify(suivi.sources),
          JSON.stringify(suivi.provenance),
          ligne.id,
        ],
      );
    }
  }

  public async down(): Promise<void> {}
}
