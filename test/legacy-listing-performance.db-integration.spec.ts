import { performance } from 'node:perf_hooks';
import type { DataSource } from 'typeorm';
import { ProjectsRepositoryTypeORM } from '../src/modules/projects/infrastructure/Projects.repository.typeORM';
import { ProjectsEntity } from '../src/modules/projects/infrastructure/entities/Projects.entity';
import { ProjectsTranslationsEntity } from '../src/modules/projects/infrastructure/entities/ProjectsTranslations.entity';
import { ProjectType } from '../src/modules/projects/infrastructure/enums/ProjectType.enum';
import type { PublishableStatus } from '../src/common/domain/types/publishable-status';
import { RedirectsRepositoryTypeORM } from '../src/modules/redirects/infrastructure/Redirects.repository.typeORM';
import { RedirectsEntity } from '../src/modules/redirects/infrastructure/entities/Redirects.entity';
import { ServicesRepositoryTypeORM } from '../src/modules/services/infrastructure/Services.repository.typeORM';
import { ServicesEntity } from '../src/modules/services/infrastructure/entities/Services.entity';
import { ServicesFaqEntity } from '../src/modules/services/infrastructure/entities/ServicesFaq.entity';
import { ServicesFaqTranslationEntity } from '../src/modules/services/infrastructure/entities/ServicesFaqTranslation.entity';
import { ServicesTranslationEntity } from '../src/modules/services/infrastructure/entities/ServicesTranslation.entity';
import {
  describeDb,
  destroyDbIntegrationDataSource,
  initDbIntegrationDataSource,
} from './helpers/db-integration-datasource';

jest.setTimeout(120_000);

const PERF_DATASET_SIZE = parsePositiveInt(
  process.env.LEGACY_LIST_PERF_DATASET_SIZE,
  250,
);
const PERF_SAMPLE_SIZE = parsePositiveInt(
  process.env.LEGACY_LIST_PERF_SAMPLES,
  40,
);
const PERF_P95_BUDGET_MS = parsePositiveInt(
  process.env.LEGACY_LIST_P95_BUDGET_MS,
  120,
);
const PERF_P99_BUDGET_MS = parsePositiveInt(
  process.env.LEGACY_LIST_P99_BUDGET_MS,
  200,
);

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const rawIndex = Math.ceil((p / 100) * sorted.length) - 1;
  const index = Math.min(Math.max(rawIndex, 0), sorted.length - 1);
  return sorted[index];
}

async function measureLatencies(
  sampleSize: number,
  execute: (iteration: number) => Promise<unknown>,
): Promise<number[]> {
  const warmupIterations = Math.min(5, sampleSize);
  for (let i = 0; i < warmupIterations; i += 1) {
    await execute(i);
  }

  const latencies: number[] = [];
  for (let i = 0; i < sampleSize; i += 1) {
    const start = performance.now();
    await execute(i);
    latencies.push(performance.now() - start);
  }
  return latencies;
}

function expectLatencyBudget(latencies: number[]): void {
  const p95 = percentile(latencies, 95);
  const p99 = percentile(latencies, 99);
  expect(p95).toBeLessThanOrEqual(PERF_P95_BUDGET_MS);
  expect(p99).toBeLessThanOrEqual(PERF_P99_BUDGET_MS);
}

describeDb('Legacy listing performance budgets (db integration)', () => {
  let dataSource: DataSource;
  let servicesRepository: ServicesRepositoryTypeORM;
  let projectsRepository: ProjectsRepositoryTypeORM;
  let redirectsRepository: RedirectsRepositoryTypeORM;

  beforeAll(async () => {
    dataSource = await initDbIntegrationDataSource([
      ServicesEntity,
      ServicesTranslationEntity,
      ServicesFaqEntity,
      ServicesFaqTranslationEntity,
      ProjectsEntity,
      ProjectsTranslationsEntity,
      RedirectsEntity,
    ]);

    servicesRepository = new ServicesRepositoryTypeORM(
      dataSource.getRepository(ServicesEntity),
    );
    projectsRepository = new ProjectsRepositoryTypeORM(
      dataSource.getRepository(ProjectsEntity),
    );
    redirectsRepository = new RedirectsRepositoryTypeORM(
      dataSource.getRepository(RedirectsEntity),
    );

    const serviceRows: Array<Partial<ServicesEntity>> = [];
    const projectRows: Array<Partial<ProjectsEntity>> = [];
    const redirectRows: Array<Partial<RedirectsEntity>> = [];

    for (let i = 0; i < PERF_DATASET_SIZE; i += 1) {
      serviceRows.push({
        slug: `perf-service-${i}`,
        name: `Perf Service ${i}`,
        icon: undefined,
        status:
          i % 3 === 0
            ? ('DRAFT' as PublishableStatus)
            : ('PUBLISHED' as PublishableStatus),
        order: i,
        updatedOrCreatedBy: null,
      });

      projectRows.push({
        slug: `perf-project-${i}`,
        type: i % 2 === 0 ? ProjectType.SIDE : ProjectType.CLIENT,
        repoUrl: `https://github.com/acme/perf-project-${i}`,
        liveUrl: `https://example.com/perf-project-${i}`,
        coverImage: `/images/perf-project-${i}.webp`,
        gallery: [`/images/perf-project-${i}-1.webp`],
        stack: ['nestjs', 'postgres'],
        status:
          i % 3 === 0
            ? ('DRAFT' as PublishableStatus)
            : ('PUBLISHED' as PublishableStatus),
        order: i,
        updatedOrCreatedBy: null,
      });

      redirectRows.push({
        slug: `perf-redirect-${i}`,
        targetUrl: `https://example.com/r/${i}`,
        enabled: i % 2 === 0,
        clicks: i * 3,
        updatedOrCreatedBy: null,
      });
    }

    await dataSource
      .getRepository(ServicesEntity)
      .save(serviceRows, { chunk: 200 });
    await dataSource
      .getRepository(ProjectsEntity)
      .save(projectRows, { chunk: 200 });
    await dataSource
      .getRepository(RedirectsEntity)
      .save(redirectRows, { chunk: 200 });
  });

  afterAll(async () => {
    await destroyDbIntegrationDataSource(dataSource);
  });

  it('keeps services list pagination/filter/sort within p95/p99 budget', async () => {
    const latencies = await measureLatencies(PERF_SAMPLE_SIZE, (iteration) =>
      servicesRepository.findAll({
        page: (iteration % 5) + 1,
        limit: 20,
        sortBy: iteration % 2 === 0 ? 'order' : 'createdAt',
        status: iteration % 2 === 0 ? 'PUBLISHED' : 'DRAFT',
        order: iteration % 2 === 0 ? 'ASC' : 'DESC',
      }),
    );

    expectLatencyBudget(latencies);
  });

  it('keeps projects list pagination/filter/sort within p95/p99 budget', async () => {
    const latencies = await measureLatencies(PERF_SAMPLE_SIZE, (iteration) =>
      projectsRepository.findAll({
        page: (iteration % 5) + 1,
        limit: 20,
        sortBy: iteration % 2 === 0 ? 'type' : 'order',
        type: iteration % 2 === 0 ? 'SIDE' : 'CLIENT',
        status: iteration % 3 === 0 ? 'DRAFT' : 'PUBLISHED',
        order: iteration % 2 === 0 ? 'ASC' : 'DESC',
      }),
    );

    expectLatencyBudget(latencies);
  });

  it('keeps redirects list pagination/filter/sort within p95/p99 budget', async () => {
    const latencies = await measureLatencies(PERF_SAMPLE_SIZE, (iteration) =>
      redirectsRepository.findAll({
        page: (iteration % 5) + 1,
        limit: 20,
        sortBy: iteration % 2 === 0 ? 'createdAt' : 'clicks',
        enabled: iteration % 2 === 0,
        order: iteration % 2 === 0 ? 'DESC' : 'ASC',
      }),
    );

    expectLatencyBudget(latencies);
  });
});
