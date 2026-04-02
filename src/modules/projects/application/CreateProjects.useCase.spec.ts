/* eslint-disable @typescript-eslint/unbound-method */
import { CreateProjectsUseCase } from './CreateProjects.useCase';
import type { IProjectsRepository } from '../domain/IProjects.repository';
import { CreateProjectCommand } from './dto/CreateProject.command';
import {
  buildProject,
  createMockProjectsRepo,
} from '../../../../test/factories/projects.factory';

describe('CreateProjectsUseCase', () => {
  let useCase: CreateProjectsUseCase;
  let repo: jest.Mocked<IProjectsRepository>;

  const validCommand: CreateProjectCommand = {
    slug: 'nouveau-projet',
    type: 'SIDE',
    repoUrl: 'https://github.com/tim/nouveau-projet',
    stack: ['TypeScript', 'NestJS'],
    status: 'DRAFT',
    order: 2,
  };

  beforeEach(() => {
    repo = createMockProjectsRepo();
    useCase = new CreateProjectsUseCase(repo);
  });

  it('devrait creer un projet et le persister via le repository', async () => {
    const expectedProject = buildProject({
      slug: 'nouveau-projet',
      type: 'SIDE',
      status: 'DRAFT',
    });
    repo.create.mockResolvedValue(expectedProject);

    const result = await useCase.execute(validCommand);

    expect(result).toEqual(expectedProject);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});
