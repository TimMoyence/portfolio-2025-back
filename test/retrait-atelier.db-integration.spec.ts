import { RetireLAtelier1790800000000 } from '../src/migrations/1790800000000-RetireLAtelier';
import {
  baseMigreeDeLaSuite,
  describeDb,
  inscrireUtilisateur,
  jouerLaMigration,
  migrationsAnterieuresA,
  tablesPresentes,
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
    migrationsAnterieuresA('1790800000000-RetireLAtelier'),
  );

  const tablesDeLAtelier = () => tablesPresentes(base(), TABLES_DE_L_ATELIER);

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
    expect(await tablesDeLAtelier()).toEqual(TABLES_DE_L_ATELIER);
    await inscrire('mixte@example.com', 'weather,sebastian,teacher');
    await inscrire('atelier@example.com', 'sebastian,weather');
    await inscrire('admin@example.com', 'admin');
    await inscrire('homonyme@example.com', 'weathers,teacher');

    await jouerLaMigration(base(), new RetireLAtelier1790800000000(), 'up');

    expect(await tablesDeLAtelier()).toEqual([]);
    expect(await rolesDe('mixte@example.com')).toBe('teacher');
    expect(await rolesDe('atelier@example.com')).toBe('');
    expect(await rolesDe('admin@example.com')).toBe('admin');
    expect(await rolesDe('homonyme@example.com')).toBe('weathers,teacher');
  });

  it('refuse de recreer l atelier au retour arriere', async () => {
    await expect(new RetireLAtelier1790800000000().down()).rejects.toThrow(
      /definitif/,
    );
    expect(await tablesDeLAtelier()).toEqual([]);
  });
});
