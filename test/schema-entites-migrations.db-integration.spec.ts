import {
  attendreSchemaAligneSurLesEntites,
  baseMigreeDeLaSuite,
  describeDb,
  TOUTES_LES_ENTITES,
  TOUTES_LES_MIGRATIONS,
} from './helpers/db-integration-datasource';

describeDb('Schema de la base migree face aux entites', () => {
  const base = baseMigreeDeLaSuite(
    [TOUTES_LES_ENTITES],
    [TOUTES_LES_MIGRATIONS],
  );

  it('ne laisse a migration:generate aucune requete a proposer', async () => {
    await attendreSchemaAligneSurLesEntites(base());
  });
});
