/* eslint-disable @typescript-eslint/unbound-method */
import { ListProjectsUseCase } from './ListProjects.useCase';
import type { IProjectsRepository } from '../domain/IProjects.repository';
import type { ProjectListQuery } from '../domain/ProjectList.query';
import type { Projects } from '../domain/Projects';
import {
  buildProject,
  createMockProjectsRepo,
} from '../../../../test/factories/projects.factory';
import { buildPaginatedResult } from '../../../../test/factories/pagination.factory';

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
    const expected = buildPaginatedResult(projects);
    repo.findAll.mockResolvedValue(expected);

    const result = await useCase.execute(defaultQuery);

    expect(result).toEqual(expected);
    expect(repo.findAll).toHaveBeenCalledWith(defaultQuery);
  });

  it('devrait retourner une liste vide si aucun projet', async () => {
    const expected = buildPaginatedResult<Projects>([]);
    repo.findAll.mockResolvedValue(expected);

    const result = await useCase.execute(defaultQuery);

    expect(result).toEqual(expected);
    expect(repo.findAll).toHaveBeenCalledWith(defaultQuery);
  });
});
