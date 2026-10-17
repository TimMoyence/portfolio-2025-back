import { RetireLeCmsHerite1792300000000 } from '../src/migrations/1792300000000-RetireLeCmsHerite';
import {
  baseMigreeDeLaSuite,
  describeDb,
  jouerLaMigration,
  migrationsAnterieuresA,
  tablesPresentes,
  typesEnumeresPresents,
} from './helpers/db-integration-datasource';

const TABLES_DU_CMS_HERITE = [
  'course_resource',
  'courses',
  'courses_translation',
  'project_translation',
  'projects',
  'redirects',
  'service_faq',
  'service_faq_translation',
  'services',
  'services_translation',
];

const TYPES_DU_CMS_HERITE = [
  'course_resource_kind_enum',
  'projects_status_enum',
  'projects_type_enum',
  'services_status_enum',
];

describeDb('Retrait du CMS herite sur une base migree', () => {
  const base = baseMigreeDeLaSuite(
    [],
    migrationsAnterieuresA('1792300000000-RetireLeCmsHerite'),
  );

  const tablesDuSocle = () =>
    tablesPresentes(base(), ['users', 'contacts', ...TABLES_DU_CMS_HERITE]);

  const typesDuSocle = () =>
    typesEnumeresPresents(base(), [
      'contacts_status_enum',
      ...TYPES_DU_CMS_HERITE,
    ]);

  it('supprime les tables et les types du CMS herite, et garde le socle', async () => {
    expect(await tablesDuSocle()).toEqual([
      'contacts',
      ...TABLES_DU_CMS_HERITE,
      'users',
    ]);
    expect(await typesDuSocle()).toEqual([
      'contacts_status_enum',
      ...TYPES_DU_CMS_HERITE,
    ]);

    await jouerLaMigration(base(), new RetireLeCmsHerite1792300000000(), 'up');

    expect(await tablesDuSocle()).toEqual(['contacts', 'users']);
    expect(await typesDuSocle()).toEqual(['contacts_status_enum']);
  });

  it('refuse de recreer le CMS herite au retour arriere', async () => {
    await expect(new RetireLeCmsHerite1792300000000().down()).rejects.toThrow(
      /definitif/,
    );
    expect(await tablesDuSocle()).toEqual(['contacts', 'users']);
  });
});
