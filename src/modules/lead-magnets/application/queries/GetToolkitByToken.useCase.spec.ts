import { Test, TestingModule } from '@nestjs/testing';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { ILeadMagnetRequestRepository } from '../../domain/ILeadMagnetRequestRepository';
import type { IToolkitContentAssembler } from '../../domain/IToolkitContentAssembler';
import type { LeadMagnetRequest } from '../../domain/LeadMagnetRequest';
import type { ToolkitContent } from '../../domain/ToolkitContent';
import {
  LEAD_MAGNET_REQUEST_REPOSITORY,
  TOOLKIT_CONTENT_ASSEMBLER,
} from '../../domain/token';
import { GetToolkitByTokenUseCase } from './GetToolkitByToken.useCase';

describe('GetToolkitByTokenUseCase', () => {
  let useCase: GetToolkitByTokenUseCase;
  let repo: jest.Mocked<ILeadMagnetRequestRepository>;
  let assembler: jest.Mocked<IToolkitContentAssembler>;

  const mockContent = { title: 'Guide IA' } as unknown as ToolkitContent;
  const mockRequest = {
    firstName: 'Tim',
    profile: null,
  } as unknown as LeadMagnetRequest;

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      existsRecentByEmail: jest.fn(),
      findByToken: jest.fn(),
    };
    assembler = {
      assemble: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetToolkitByTokenUseCase,
        { provide: LEAD_MAGNET_REQUEST_REPOSITORY, useValue: repo },
        { provide: TOOLKIT_CONTENT_ASSEMBLER, useValue: assembler },
      ],
    }).compile();

    useCase = module.get(GetToolkitByTokenUseCase);
  });

  it('devrait retourner le contenu assemble pour un token existant', async () => {
    repo.findByToken.mockResolvedValue(mockRequest);
    assembler.assemble.mockReturnValue(mockContent);

    const result = await useCase.execute({ accessToken: 'token-123' });

    expect(result).toBe(mockContent);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repo.findByToken).toHaveBeenCalledWith('token-123');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(assembler.assemble).toHaveBeenCalledWith('Tim', null);
  });

  it('devrait lever ResourceNotFoundError pour un token inconnu', async () => {
    repo.findByToken.mockResolvedValue(null);

    await expect(
      useCase.execute({ accessToken: 'inexistant' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
