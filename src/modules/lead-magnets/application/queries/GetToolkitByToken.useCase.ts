import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ILeadMagnetRequestRepository } from '../../domain/ILeadMagnetRequestRepository';
import type { IToolkitContentAssembler } from '../../domain/IToolkitContentAssembler';
import type { InteractionProfile } from '../../domain/InteractionProfile';
import type { ToolkitContent } from '../../domain/ToolkitContent';
import {
  LEAD_MAGNET_REQUEST_REPOSITORY,
  TOOLKIT_CONTENT_ASSEMBLER,
} from '../../domain/token';
import type { GetToolkitByTokenQuery } from './GetToolkitByToken.query';

/** Recupere le contenu personnalise d'un guide IA via son token d'acces unique. */
@Injectable()
export class GetToolkitByTokenUseCase {
  constructor(
    @Inject(LEAD_MAGNET_REQUEST_REPOSITORY)
    private readonly repo: ILeadMagnetRequestRepository,
    @Inject(TOOLKIT_CONTENT_ASSEMBLER)
    private readonly assembler: IToolkitContentAssembler,
  ) {}

  /** Execute la requete et retourne le contenu personnalise du guide. */
  async execute(query: GetToolkitByTokenQuery): Promise<ToolkitContent> {
    const request = await this.repo.findByToken(query.accessToken);
    if (!request) {
      throw new NotFoundException('Guide introuvable pour ce token.');
    }

    const profile: InteractionProfile | null = request.profile ?? null;
    return this.assembler.assemble(request.firstName, profile);
  }
}
