import { Projects } from '../../src/modules/projects/domain/Projects';
import type { IProjectsRepository } from '../../src/modules/projects/domain/IProjects.repository';

/** Construit un objet Projects domaine avec des valeurs par defaut. */
export function buildProject(overrides?: Partial<Projects>): Projects {
  const project = new Projects();
  project.id = 'project-1';
  project.slug = 'portfolio-2025';
  project.type = 'SIDE';
  project.repoUrl = 'https://github.com/tim/portfolio-2025';
  project.liveUrl = 'https://portfolio.example.com';
  project.coverImage = 'https://example.com/portfolio-cover.png';
  project.gallery = ['https://example.com/screen1.png'];
  project.stack = ['NestJS', 'Angular', 'PostgreSQL'];
  project.status = 'PUBLISHED';
  project.order = 1;
  return Object.assign(project, overrides);
}

/** Cree un mock complet du repository projects. */
export function createMockProjectsRepo(): jest.Mocked<IProjectsRepository> {
  return {
    findAll: jest.fn(),
    create: jest.fn(),
  };
}
