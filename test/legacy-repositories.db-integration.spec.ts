import { Courses } from '../src/modules/courses/domain/Courses';
import { Projects } from '../src/modules/projects/domain/Projects';
import { Redirects } from '../src/modules/redirects/domain/Redirects';
import { Services } from '../src/modules/services/domain/Services';
import {
  LEGACY_COURSE_PAYLOAD,
  LEGACY_PROJECT_PAYLOAD,
  LEGACY_REDIRECT_PAYLOAD,
  LEGACY_SERVICE_PAYLOAD,
} from './factories/legacy-contract.factory';
import {
  describeDb,
  destroyDbIntegrationDataSource,
} from './helpers/db-integration-datasource';
import { ouvrirBaseLegacy, type BaseLegacy } from './helpers/legacy-db';

const PREMIERE_PAGE = { page: 1, limit: 10 };
const PAR_ORDRE = { ...PREMIERE_PAGE, sortBy: 'order', order: 'ASC' } as const;
const PAR_CREATION = {
  ...PREMIERE_PAGE,
  sortBy: 'createdAt',
  order: 'DESC',
} as const;

interface Liste<T> {
  readonly items: readonly T[];
  readonly total: number;
}

async function attendrePersisteEtListe<T extends { id?: string; slug: string }>(
  creer: () => Promise<T>,
  lister: () => Promise<Liste<T>>,
): Promise<void> {
  const created = await creer();

  expect(created.id).toEqual(expect.any(String));

  const result = await lister();
  expect(result.items.some((item) => item.slug === created.slug)).toBe(true);
  expect(result.total).toBeGreaterThanOrEqual(1);
}

function attendreFiltre<T>(
  result: Liste<T>,
  retenu: (item: T) => boolean,
): void {
  expect(result.items.length).toBeGreaterThanOrEqual(1);
  expect(result.items.every(retenu)).toBe(true);
}

describeDb('Legacy repositories (db integration)', () => {
  let base: BaseLegacy;

  beforeAll(async () => {
    base = await ouvrirBaseLegacy();
  });

  afterAll(async () => {
    await destroyDbIntegrationDataSource(base?.dataSource);
  });

  it('persists and reads services entities', async () => {
    await attendrePersisteEtListe(
      () =>
        base.services.create(
          Services.create({ ...LEGACY_SERVICE_PAYLOAD, status: 'PUBLISHED' }),
        ),
      () => base.services.findAll(PAR_ORDRE),
    );
  });

  it('filters services entities by status', async () => {
    await base.services.create(
      Services.create({
        slug: 'service-draft',
        name: 'Service Draft',
        status: 'DRAFT',
        order: 3,
      }),
    );
    await base.services.create(
      Services.create({
        slug: 'service-published',
        name: 'Service Published',
        status: 'PUBLISHED',
        order: 4,
      }),
    );

    attendreFiltre(
      await base.services.findAll({ ...PAR_ORDRE, status: 'PUBLISHED' }),
      (item) => item.status === 'PUBLISHED',
    );
  });

  it('persists and reads projects entities', async () => {
    await attendrePersisteEtListe(
      () =>
        base.projects.create(
          Projects.create({
            ...LEGACY_PROJECT_PAYLOAD,
            type: 'SIDE',
            status: 'PUBLISHED',
          }),
        ),
      () => base.projects.findAll(PAR_ORDRE),
    );
  });

  it('filters projects entities by type and status', async () => {
    await base.projects.create(
      Projects.create({
        slug: 'project-client-draft',
        type: 'CLIENT',
        status: 'DRAFT',
        stack: ['nestjs'],
        order: 3,
      }),
    );
    await base.projects.create(
      Projects.create({
        slug: 'project-side-published',
        type: 'SIDE',
        status: 'PUBLISHED',
        stack: ['postgres'],
        order: 4,
      }),
    );

    attendreFiltre(
      await base.projects.findAll({
        ...PAR_ORDRE,
        type: 'SIDE',
        status: 'PUBLISHED',
      }),
      (item) => item.type === 'SIDE' && item.status === 'PUBLISHED',
    );
  });

  it('persists and reads courses entities', async () => {
    await attendrePersisteEtListe(
      () => base.courses.create(Courses.create(LEGACY_COURSE_PAYLOAD)),
      () => base.courses.findAll(PAR_CREATION),
    );
  });

  it('persists and reads redirects entities', async () => {
    await attendrePersisteEtListe(
      () => base.redirects.create(Redirects.create(LEGACY_REDIRECT_PAYLOAD)),
      () => base.redirects.findAll(PAR_CREATION),
    );
  });

  it('filters redirects entities by enabled flag', async () => {
    for (const [etat, enabled, clicks] of [
      ['enabled', true, 3],
      ['disabled', false, 5],
    ] as const) {
      await base.redirects.create(
        Redirects.create({
          slug: `redirect-${etat}`,
          targetUrl: `https://example.com/${etat}`,
          enabled,
          clicks,
        }),
      );
    }

    attendreFiltre(
      await base.redirects.findAll({ ...PAR_CREATION, enabled: false }),
      (item) => item.enabled === false,
    );
  });

  it.each([
    ['services', 'IDX_services_status_order'],
    ['projects', 'IDX_projects_type_order'],
    ['projects', 'IDX_projects_status_order'],
    ['redirects', 'IDX_redirects_enabled_created_at'],
  ])(
    'creates the %s index %s for filtered legacy list queries',
    async (table, index) => {
      const trouves: Array<{ indexname: string }> = await base.dataSource.query(
        `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = $1 AND indexname = $2`,
        [table, index],
      );

      expect(trouves).toHaveLength(1);
    },
  );
});
