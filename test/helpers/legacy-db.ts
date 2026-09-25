import type { DataSource } from 'typeorm';
import { CoursesRepositoryTypeORM } from '../../src/modules/courses/infrastructure/Courses.repository.typeORM';
import { CourseResourceEntity } from '../../src/modules/courses/infrastructure/entities/CourseResources.entity';
import { CoursesEntity } from '../../src/modules/courses/infrastructure/entities/Courses.entity';
import { CoursesTranslationEntity } from '../../src/modules/courses/infrastructure/entities/CoursesTranslation.entity';
import { ProjectsRepositoryTypeORM } from '../../src/modules/projects/infrastructure/Projects.repository.typeORM';
import { ProjectsEntity } from '../../src/modules/projects/infrastructure/entities/Projects.entity';
import { ProjectsTranslationsEntity } from '../../src/modules/projects/infrastructure/entities/ProjectsTranslations.entity';
import { RedirectsRepositoryTypeORM } from '../../src/modules/redirects/infrastructure/Redirects.repository.typeORM';
import { RedirectsEntity } from '../../src/modules/redirects/infrastructure/entities/Redirects.entity';
import { ServicesRepositoryTypeORM } from '../../src/modules/services/infrastructure/Services.repository.typeORM';
import { ServicesEntity } from '../../src/modules/services/infrastructure/entities/Services.entity';
import { ServicesFaqEntity } from '../../src/modules/services/infrastructure/entities/ServicesFaq.entity';
import { ServicesFaqTranslationEntity } from '../../src/modules/services/infrastructure/entities/ServicesFaqTranslation.entity';
import { ServicesTranslationEntity } from '../../src/modules/services/infrastructure/entities/ServicesTranslation.entity';
import { initDbIntegrationDataSource } from './db-integration-datasource';

const ENTITES_LEGACY = [
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
];

export interface BaseLegacy {
  readonly dataSource: DataSource;
  readonly services: ServicesRepositoryTypeORM;
  readonly projects: ProjectsRepositoryTypeORM;
  readonly courses: CoursesRepositoryTypeORM;
  readonly redirects: RedirectsRepositoryTypeORM;
}

export async function ouvrirBaseLegacy(): Promise<BaseLegacy> {
  const dataSource = await initDbIntegrationDataSource(ENTITES_LEGACY);
  return {
    dataSource,
    services: new ServicesRepositoryTypeORM(
      dataSource.getRepository(ServicesEntity),
    ),
    projects: new ProjectsRepositoryTypeORM(
      dataSource.getRepository(ProjectsEntity),
    ),
    courses: new CoursesRepositoryTypeORM(
      dataSource.getRepository(CoursesEntity),
    ),
    redirects: new RedirectsRepositoryTypeORM(
      dataSource.getRepository(RedirectsEntity),
    ),
  };
}
