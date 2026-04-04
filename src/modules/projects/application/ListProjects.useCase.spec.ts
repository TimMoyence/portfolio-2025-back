/* eslint-disable @typescript-eslint/unbound-method */
import { ListProjectsUseCase } from './ListProjects.useCase';
import type { IProjectsRepository } from '../domain/IProjects.repository';
import type { ProjectListQuery } from '../domain/ProjectList.query';
import type { PaginatedResult } from '../../../common/domain/pagination.types';
import type { Projects } from '../domain/Projects';
import {
  buildProject,
  createMockProjectsRepo,
} from '../../../../test/factories/projects.factory';

describe('ListProjectsUseCase', () => {
  let useCase: ListProjectsUseCase;
  let repo: jest.Mocked<IProjectsRepository>;

  const defaultQuery: ProjectListQuery = {
    page: 1,
    limit: 10,
    sortBy: 'order',
    order: 'ASC',
  };

  beforeEach(() => {
    repo = createMockProjectsRepo();
    useCase = new ListProjectsUseCase(repo);
  });

  it('devrait retourner la liste paginee depuis le repository', async () => {
    const projects = [
      buildProject(),
      buildProject({ id: 'project-2', slug: 'autre-projet' }),
    ];
    const expected: PaginatedResult<Projects> = {
      items: projects,
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    };
    repo.findAll.mockResolvedValue(expected);

    const result = await useCase.execute(defaultQuery);

    expect(result).toEqual(expected);
    expect(repo.findAll).toHaveBeenCalledWith(defaultQuery);
  });

  it('devrait retourner une liste vide si aucun projet', async () => {
    const expected: PaginatedResult<Projects> = {
      items: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    };
    repo.findAll.mockResolvedValue(expected);

    const result = await useCase.execute(defaultQuery);

    expect(result).toEqual(expected);
    expect(repo.findAll).toHaveBeenCalledWith(defaultQuery);
  });
});
