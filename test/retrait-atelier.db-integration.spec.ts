import { RetireLAtelier1790800000000 } from '../src/migrations/1790800000000-RetireLAtelier';
import {
  baseMigreeDeLaSuite,
  describeDb,
  inscrireUtilisateur,
  migrationsAnterieuresA,
} from './helpers/db-integration-datasource';

const TABLES_DE_L_ATELIER = [
  'sebastian_badges',
  'sebastian_entries',
  'sebastian_goals',
  'sebastian_profiles',
  'telegram_links',
  'weather_user_preferences',
];

describeDb('Retrait de l atelier sur une base migree', () => {
  const base = baseMigreeDeLaSuite(
    [],
    [migrationsAnterieuresA('1790800000000-RetireLAtelier')],
  );

  const tablesPresentes = async (): Promise<string[]> => {
    const lignes: { table_name: string }[] = await base().query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1)
       ORDER BY table_name`,
      [TABLES_DE_L_ATELIER],
    );
    return lignes.map(({ table_name }) => table_name);
  };

  const inscrire = (email: string, roles: string) =>
    inscrireUtilisateur(base(), email, roles);

  const rolesDe = async (email: string): Promise<string> => {
    const [ligne]: { roles: string }[] = await base().query(
      `SELECT "roles" FROM "users" WHERE "email" = $1`,
      [email],
    );
    return ligne.roles;
  };

  it('supprime les tables meteo, sebastian et telegram et retire leurs roles', async () => {
    expect(await tablesPresentes()).toEqual(TABLES_DE_L_ATELIER);
    await inscrire('mixte@example.com', 'weather,sebastian,teacher');
    await inscrire('atelier@example.com', 'sebastian,weather');
    await inscrire('admin@example.com', 'admin');
    await inscrire('homonyme@example.com', 'weathers,teacher');

    await base().transaction((manager) =>
      new RetireLAtelier1790800000000().up(manager.queryRunner!),
    );

    expect(await tablesPresentes()).toEqual([]);
    expect(await rolesDe('mixte@example.com')).toBe('teacher');
    expect(await rolesDe('atelier@example.com')).toBe('');
    expect(await rolesDe('admin@example.com')).toBe('admin');
    expect(await rolesDe('homonyme@example.com')).toBe('weathers,teacher');
  });

  it('refuse de recreer l atelier au retour arriere', async () => {
    await expect(new RetireLAtelier1790800000000().down()).rejects.toThrow(
      /definitif/,
    );
    expect(await tablesPresentes()).toEqual([]);
  });
});
