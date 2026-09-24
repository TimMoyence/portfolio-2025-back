import { ListProjectsUseCase } from './ListProjects.useCase';
import type { IProjectsRepository } from '../domain/IProjects.repository';
import {
  buildProject,
  createMockProjectsRepo,
} from '../../../../test/factories/projects.factory';
import { casDeListePaginee } from '../../../../test/factories/pagination.factory';

describe('ListProjectsUseCase', () => {
  it.each(
    casDeListePaginee<IProjectsRepository>({
      creerDepot: createMockProjectsRepo,
      creerUseCase: (depot) => new ListProjectsUseCase(depot),
      requete: { page: 1, limit: 10, sortBy: 'order', order: 'ASC' },
      elements: [
        buildProject(),
        buildProject({ id: 'project-2', slug: 'autre-projet' }),
      ],
    }),
  )('devrait retourner %s', (_cas, verifier) => verifier());
});
