import { MOIS_DE_CONSERVATION_DE_LA_PROVENANCE } from '../src/common/domain/provenance';
import { EffacementDesProvenancesService } from '../src/common/infrastructure/typeorm/EffacementDesProvenances.service';
import {
  baseMigreeDeLaSuite,
  describeDb,
  TOUTES_LES_ENTITES,
  TOUTES_LES_MIGRATIONS,
} from './helpers/db-integration-datasource';
import {
  DEPOTS_DE_PROVENANCE,
  TABLES_DE_PROVENANCE,
} from './helpers/depots-de-provenance';

const PROVENANCE = {
  ip: '203.0.113.7',
  userAgent: 'Mozilla/5.0',
  referer: 'https://asilidesign.fr/fr/contact',
};

interface LigneLue {
  ancienne: boolean;
  ip: string | null;
  userAgent: string | null;
  referer: string | null;
}

describeDb(
  'Effacement de la provenance au-delà de sa durée de conservation',
  () => {
    const base = baseMigreeDeLaSuite(
      [TOUTES_LES_ENTITES],
      [TOUTES_LES_MIGRATIONS],
    );

    const vieillirLaPremiereLigne = (table: string, mois: number) =>
      base().query(
        `UPDATE "${table}" SET "created_at" = LOCALTIMESTAMP - make_interval(months => $1, days => 1)
       WHERE "id" = (SELECT "id" FROM "${table}" ORDER BY "created_at" LIMIT 1)`,
        [mois],
      );

    const lignesDe = (table: string): Promise<LigneLue[]> =>
      base().query(
        `SELECT "created_at" < LOCALTIMESTAMP - make_interval(months => $1) AS "ancienne",
              host("ip") AS "ip", "userAgent", "referer"
       FROM "${table}" ORDER BY "created_at"`,
        [MOIS_DE_CONSERVATION_DE_LA_PROVENANCE],
      );

    beforeEach(async () => {
      for (const table of TABLES_DE_PROVENANCE) {
        await base().query(`TRUNCATE "${table}" CASCADE`);
        await DEPOTS_DE_PROVENANCE[table](base(), PROVENANCE);
        await vieillirLaPremiereLigne(
          table,
          MOIS_DE_CONSERVATION_DE_LA_PROVENANCE,
        );
        await DEPOTS_DE_PROVENANCE[table](base(), PROVENANCE);
      }
    });

    it('efface la provenance des lignes plus anciennes que la durée de conservation, dans chaque table de requêtes, et garde les autres', async () => {
      const effacees = await new EffacementDesProvenancesService(
        base(),
      ).effacer();

      expect(effacees).toBe(TABLES_DE_PROVENANCE.length);
      for (const table of TABLES_DE_PROVENANCE) {
        expect(await lignesDe(table)).toEqual([
          { ancienne: true, ip: null, userAgent: null, referer: null },
          { ancienne: false, ...PROVENANCE },
        ]);
      }
    });

    it('ne retouche pas une ligne déjà effacée au passage suivant', async () => {
      const service = new EffacementDesProvenancesService(base());
      await service.effacer();

      expect(await service.effacer()).toBe(0);
    });
  },
);
