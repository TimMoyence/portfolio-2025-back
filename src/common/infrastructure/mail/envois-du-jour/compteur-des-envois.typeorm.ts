import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

const JOUR_A_PARIS = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function jourAParis(instant: Date): string {
  return JOUR_A_PARIS.format(instant);
}

@Injectable()
export class CompteurDesEnvoisTypeOrm {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async restantPourLaDiffusion(maintenant: Date): Promise<number> {
    const budget =
      this.config.getOrThrow<number>('NEWSLETTER_PLAFOND_DU_JOUR') -
      this.config.getOrThrow<number>('NEWSLETTER_RESERVE_DU_JOUR');
    return Math.max(0, budget - (await this.envoyesLeJourDe(maintenant)));
  }

  async compter(maintenant: Date): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO "envois_du_jour" ("jour", "envoyes") VALUES ($1, 1)
       ON CONFLICT ("jour") DO UPDATE SET "envoyes" = "envois_du_jour"."envoyes" + 1`,
      [jourAParis(maintenant)],
    );
  }

  async envoyesLeJourDe(maintenant: Date): Promise<number> {
    const lignes: { envoyes: number }[] = await this.dataSource.query(
      `SELECT "envoyes" FROM "envois_du_jour" WHERE "jour" = $1`,
      [jourAParis(maintenant)],
    );
    return lignes.at(0)?.envoyes ?? 0;
  }
}
