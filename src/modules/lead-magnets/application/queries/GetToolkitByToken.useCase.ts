import { Inject, Injectable } from '@nestjs/common';
import { LienInvalideError } from '../../../../common/domain/errors/LienInvalideError';
import type { ILeadMagnetRequestRepository } from '../../domain/ILeadMagnetRequestRepository';
import type { IToolkitContentAssembler } from '../../domain/IToolkitContentAssembler';
import type { ToolkitContent } from '../../domain/ToolkitContent';
import {
  LEAD_MAGNET_REQUEST_REPOSITORY,
  TOOLKIT_CONTENT_ASSEMBLER,
} from '../../domain/token';
import type { GetToolkitByTokenQuery } from './GetToolkitByToken.query';

@Injectable()
export class GetToolkitByTokenUseCase {
  constructor(
    @Inject(LEAD_MAGNET_REQUEST_REPOSITORY)
    private readonly repo: ILeadMagnetRequestRepository,
    @Inject(TOOLKIT_CONTENT_ASSEMBLER)
    private readonly assembler: IToolkitContentAssembler,
  ) {}

  async execute(query: GetToolkitByTokenQuery): Promise<ToolkitContent> {
    const request = await this.repo.findByToken(query.accessToken);
    if (!request) {
      throw new LienInvalideError();
    }

    return this.assembler.assemble(request.firstName);
  }
}
