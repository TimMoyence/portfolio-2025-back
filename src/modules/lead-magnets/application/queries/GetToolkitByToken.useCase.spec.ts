import { Test, TestingModule } from '@nestjs/testing';
import {
  buildLeadMagnetRequest,
  buildToolkitContent,
  createMockLeadMagnetRequestRepo,
  createMockToolkitContentAssembler,
} from '../../../../../test/factories/lead-magnet-request.factory';
import { LienInvalideError } from '../../../../common/domain/errors/LienInvalideError';
import {
  LEAD_MAGNET_REQUEST_REPOSITORY,
  TOOLKIT_CONTENT_ASSEMBLER,
} from '../../domain/token';
import { GetToolkitByTokenUseCase } from './GetToolkitByToken.useCase';

describe('GetToolkitByTokenUseCase', () => {
  let useCase: GetToolkitByTokenUseCase;
  let repo: ReturnType<typeof createMockLeadMagnetRequestRepo>;
  let assembler: ReturnType<typeof createMockToolkitContentAssembler>;

  const mockContent = buildToolkitContent();
  const mockRequest = buildLeadMagnetRequest({ firstName: 'Tim' });

  beforeEach(async () => {
    repo = createMockLeadMagnetRequestRepo();
    assembler = createMockToolkitContentAssembler();

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
    expect(assembler.assemble).toHaveBeenCalledWith('Tim');
  });

  it('refuse un token inconnu comme tout lien invalide', async () => {
    repo.findByToken.mockResolvedValue(null);

    await expect(
      useCase.execute({ accessToken: 'inexistant' }),
    ).rejects.toBeInstanceOf(LienInvalideError);
  });
});
