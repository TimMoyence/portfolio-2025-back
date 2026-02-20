import { DataSource, DataSourceOptions } from 'typeorm';
import { Courses } from '../src/modules/courses/domain/Courses';
import { CoursesRepositoryTypeORM } from '../src/modules/courses/infrastructure/Courses.repository.typeORM';
import { CourseResourceEntity } from '../src/modules/courses/infrastructure/entities/CourseResources.entity';
import { CoursesEntity } from '../src/modules/courses/infrastructure/entities/Courses.entity';
import { CoursesTranslationEntity } from '../src/modules/courses/infrastructure/entities/CoursesTranslation.entity';
import { Projects } from '../src/modules/projects/domain/Projects';
import { ProjectsRepositoryTypeORM } from '../src/modules/projects/infrastructure/Projects.repository.typeORM';
import { ProjectsEntity } from '../src/modules/projects/infrastructure/entities/Projects.entity';
import { ProjectsTranslationsEntity } from '../src/modules/projects/infrastructure/entities/ProjectsTranslations.entity';
import { Redirects } from '../src/modules/redirects/domain/Redirects';
import { RedirectsRepositoryTypeORM } from '../src/modules/redirects/infrastructure/Redirects.repository.typeORM';
import { RedirectsEntity } from '../src/modules/redirects/infrastructure/entities/Redirects.entity';
import { Services } from '../src/modules/services/domain/Services';
import { ServicesRepositoryTypeORM } from '../src/modules/services/infrastructure/Services.repository.typeORM';
import { ServicesEntity } from '../src/modules/services/infrastructure/entities/Services.entity';
import { ServicesFaqEntity } from '../src/modules/services/infrastructure/entities/ServicesFaq.entity';
import { ServicesFaqTranslationEntity } from '../src/modules/services/infrastructure/entities/ServicesFaqTranslation.entity';
import { ServicesTranslationEntity } from '../src/modules/services/infrastructure/entities/ServicesTranslation.entity';

const runDbIntegration = process.env.RUN_DB_INTEGRATION === 'true';
const describeDb = runDbIntegration ? describe : describe.skip;

function parsePort(raw: string | undefined): number {
  if (!raw) return 5432;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 5432;
}

function buildOptions(): DataSourceOptions {
  const sslEnabled =
    process.env.DB_SSL === 'true' || process.env.DATABASE_SSL === 'true';

  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? process.env.DATABASE_HOST ?? '127.0.0.1',
    port: parsePort(process.env.DB_PORT ?? process.env.DATABASE_PORT),
    username:
      process.env.DB_USERNAME ??
      process.env.DB_USER ??
      process.env.DATABASE_USER ??
      'postgres',
    password:
      process.env.DB_PASSWORD ??
      process.env.DB_PASS ??
      process.env.DATABASE_PASSWORD ??
      'postgres',
    database:
      process.env.DB_NAME ?? process.env.DATABASE_NAME ?? 'portfolio_2025_ci',
    entities: [
      ServicesEntity,
      ServicesTranslationEntity,
      ServicesFaqEntity,
      ServicesFaqTranslationEntity,
      ProjectsEntity,
      ProjectsTranslationsEntity,
      CoursesEntity,
      CoursesTranslationEntity,
      CourseResourceEntity,
      RedirectsEntity,
    ],
    synchronize: true,
    dropSchema: true,
    logging: false,
    ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

describeDb('Legacy repositories (db integration)', () => {
  let dataSource: DataSource;
  let servicesRepository: ServicesRepositoryTypeORM;
  let projectsRepository: ProjectsRepositoryTypeORM;
  let coursesRepository: CoursesRepositoryTypeORM;
  let redirectsRepository: RedirectsRepositoryTypeORM;

  beforeAll(async () => {
    dataSource = new DataSource(buildOptions());
    await dataSource.initialize();

    servicesRepository = new ServicesRepositoryTypeORM(
      dataSource.getRepository(ServicesEntity),
    );
    projectsRepository = new ProjectsRepositoryTypeORM(
      dataSource.getRepository(ProjectsEntity),
    );
    coursesRepository = new CoursesRepositoryTypeORM(
      dataSource.getRepository(CoursesEntity),
    );
    redirectsRepository = new RedirectsRepositoryTypeORM(
      dataSource.getRepository(RedirectsEntity),
    );
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('persists and reads services entities', async () => {
    const created = await servicesRepository.create(
      Services.create({
        slug: 'technical-seo',
        name: 'Technical SEO',
        icon: '/icons/seo.svg',
        status: 'PUBLISHED',
        order: 1,
      }),
    );

    expect(created.id).toEqual(expect.any(String));

    const result = await servicesRepository.findAll({
      page: 1,
      limit: 10,
      sortBy: 'order',
      order: 'ASC',
    });
    expect(result.items.some((service) => service.slug === 'technical-seo')).toBe(
      true,
    );
    expect(result.total).toBeGreaterThanOrEqual(1);
  });

  it('filters services entities by status', async () => {
    await servicesRepository.create(
      Services.create({
        slug: 'service-draft',
        name: 'Service Draft',
        status: 'DRAFT',
        order: 3,
      }),
    );
    await servicesRepository.create(
      Services.create({
        slug: 'service-published',
        name: 'Service Published',
        status: 'PUBLISHED',
        order: 4,
      }),
    );

    const result = await servicesRepository.findAll({
      page: 1,
      limit: 10,
      sortBy: 'order',
      status: 'PUBLISHED',
      order: 'ASC',
    });

    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items.every((item) => item.status === 'PUBLISHED')).toBe(true);
  });

  it('persists and reads projects entities', async () => {
    const created = await projectsRepository.create(
      Projects.create({
        slug: 'portfolio-site',
        type: 'SIDE',
        repoUrl: 'https://github.com/acme/portfolio',
        liveUrl: 'https://example.com',
        coverImage: '/images/portfolio.webp',
        gallery: ['/images/portfolio-1.webp'],
        stack: ['nestjs', 'postgres'],
        status: 'PUBLISHED',
        order: 2,
      }),
    );

    expect(created.id).toEqual(expect.any(String));

    const result = await projectsRepository.findAll({
      page: 1,
      limit: 10,
      sortBy: 'order',
      order: 'ASC',
    });
    expect(result.items.some((project) => project.slug === 'portfolio-site')).toBe(
      true,
    );
    expect(result.total).toBeGreaterThanOrEqual(1);
  });

  it('filters projects entities by type and status', async () => {
    await projectsRepository.create(
      Projects.create({
        slug: 'project-client-draft',
        type: 'CLIENT',
        status: 'DRAFT',
        stack: ['nestjs'],
        order: 3,
      }),
    );
    await projectsRepository.create(
      Projects.create({
        slug: 'project-side-published',
        type: 'SIDE',
        status: 'PUBLISHED',
        stack: ['postgres'],
        order: 4,
      }),
    );

    const result = await projectsRepository.findAll({
      page: 1,
      limit: 10,
      sortBy: 'order',
      type: 'SIDE',
      status: 'PUBLISHED',
      order: 'ASC',
    });

    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(
      result.items.every(
        (item) => item.type === 'SIDE' && item.status === 'PUBLISHED',
      ),
    ).toBe(true);
  });

  it('persists and reads courses entities', async () => {
    const created = await coursesRepository.create(
      Courses.create({
        slug: 'ai-course',
        title: 'AI Course',
        summary: 'A premium course for practical AI delivery.',
        coverImage: '/images/ai-course.webp',
      }),
    );

    expect(created.id).toEqual(expect.any(String));

    const result = await coursesRepository.findAll({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      order: 'DESC',
    });
    expect(result.items.some((course) => course.slug === 'ai-course')).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(1);
  });

  it('persists and reads redirects entities', async () => {
    const created = await redirectsRepository.create(
      Redirects.create({
        slug: 'promo-offer',
        targetUrl: 'https://example.com/promo',
        enabled: true,
        clicks: 0,
      }),
    );

    expect(created.id).toEqual(expect.any(String));

    const result = await redirectsRepository.findAll({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      order: 'DESC',
    });
    expect(result.items.some((redirect) => redirect.slug === 'promo-offer')).toBe(
      true,
    );
    expect(result.total).toBeGreaterThanOrEqual(1);
  });

  it('filters redirects entities by enabled flag', async () => {
    await redirectsRepository.create(
      Redirects.create({
        slug: 'redirect-enabled',
        targetUrl: 'https://example.com/enabled',
        enabled: true,
        clicks: 3,
      }),
    );
    await redirectsRepository.create(
      Redirects.create({
        slug: 'redirect-disabled',
        targetUrl: 'https://example.com/disabled',
        enabled: false,
        clicks: 5,
      }),
    );

    const result = await redirectsRepository.findAll({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      enabled: false,
      order: 'DESC',
    });

    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items.every((item) => item.enabled === false)).toBe(true);
  });

  it('creates expected indexes for filtered legacy list queries', async () => {
    const servicesStatusOrderIndex = await dataSource.query(
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'services' AND indexname = 'IDX_services_status_order'`,
    );
    const projectsTypeOrderIndex = await dataSource.query(
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'projects' AND indexname = 'IDX_projects_type_order'`,
    );
    const projectsStatusOrderIndex = await dataSource.query(
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'projects' AND indexname = 'IDX_projects_status_order'`,
    );
    const redirectsEnabledCreatedAtIndex = await dataSource.query(
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'redirects' AND indexname = 'IDX_redirects_enabled_created_at'`,
    );

    expect(servicesStatusOrderIndex).toHaveLength(1);
    expect(projectsTypeOrderIndex).toHaveLength(1);
    expect(projectsStatusOrderIndex).toHaveLength(1);
    expect(redirectsEnabledCreatedAtIndex).toHaveLength(1);
  });
});
