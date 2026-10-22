import type { Provenance } from '../src/common/domain/provenance';
import {
  baseMigreeDeLaSuite,
  describeDb,
  TOUTES_LES_ENTITES,
  TOUTES_LES_MIGRATIONS,
} from './helpers/db-integration-datasource';
import {
  DEPOTS_DE_PROVENANCE as DEPOTS,
  TABLES_DE_PROVENANCE as TABLES,
  type TableDeProvenance,
} from './helpers/depots-de-provenance';
import {
  attendreUneProvenanceBornee,
  PROVENANCE_DEMESUREE,
} from './helpers/provenance';

describeDb('Provenance des requetes consignee sur une base migree', () => {
  const base = baseMigreeDeLaSuite(
    [TOUTES_LES_ENTITES],
    [TOUTES_LES_MIGRATIONS],
  );

  const ligneConsignee = async (
    table: TableDeProvenance,
    provenance: Provenance,
  ) => {
    await base().query(`TRUNCATE "${table}" CASCADE`);
    await DEPOTS[table](base(), provenance);
    const lignes: Array<Required<Provenance> & { requestId: string }> =
      await base().query(
        `SELECT host("ip") AS "ip", "userAgent", "referer", "requestId" FROM "${table}"`,
      );
    expect(lignes).toHaveLength(1);
    return lignes[0];
  };

  it.each(TABLES)(
    'consigne dans %s la provenance nettoyee et bornee',
    async (table) => {
      const ligne = await ligneConsignee(table, PROVENANCE_DEMESUREE);

      attendreUneProvenanceBornee(ligne);
      expect(ligne.requestId).toMatch(/^[0-9a-f-]{36}$/);
    },
  );

  it.each(TABLES)(
    'consigne dans %s une provenance absente comme nulle',
    async (table) => {
      expect(
        await ligneConsignee(table, {
          ip: null,
          userAgent: '   ',
          referer: undefined,
        }),
      ).toMatchObject({ ip: null, userAgent: null, referer: null });
    },
  );
});
