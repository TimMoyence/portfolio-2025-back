import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { EntityTarget, ObjectLiteral } from 'typeorm';
import { DataSource, IsNull, Not } from 'typeorm';
import { MOIS_DE_CONSERVATION_DE_LA_PROVENANCE } from '../../domain/provenance';
import { ColonnesDeRequete } from './ColonnesDeProvenance';
import { poseeIlYAPlusDeMois } from './horloge-de-la-base';

const COLONNES_DE_PROVENANCE = ['ip', 'userAgent', 'referer'] as const;

@Injectable()
export class EffacementDesProvenancesService {
  private readonly logger = new Logger(EffacementDesProvenancesService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async effacer(): Promise<number> {
    let effacees = 0;
    for (const entite of this.entitesDeRequete()) {
      const { affected } = await this.dataSource
        .createQueryBuilder()
        .update(entite)
        .set({ ip: null, userAgent: null, referer: null })
        .where(
          COLONNES_DE_PROVENANCE.map((colonne) => ({
            createdAt: poseeIlYAPlusDeMois(
              MOIS_DE_CONSERVATION_DE_LA_PROVENANCE,
            ),
            [colonne]: Not(IsNull()),
          })),
        )
        .execute();
      effacees += affected ?? 0;
    }
    this.logger.log(
      `Provenance effacée de ${effacees} ligne(s) de plus de ${MOIS_DE_CONSERVATION_DE_LA_PROVENANCE} mois`,
    );
    return effacees;
  }

  private entitesDeRequete(): EntityTarget<ObjectLiteral>[] {
    return this.dataSource.entityMetadatas
      .filter(({ inheritanceTree }) =>
        inheritanceTree.includes(ColonnesDeRequete),
      )
      .map(({ target }) => target);
  }
}
