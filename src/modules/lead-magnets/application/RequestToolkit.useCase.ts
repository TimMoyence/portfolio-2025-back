import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ILeadMagnetNotifier } from '../domain/ILeadMagnetNotifier';
import type { ILeadMagnetRequestRepository } from '../domain/ILeadMagnetRequestRepository';
import type { IToolkitContentAssembler } from '../domain/IToolkitContentAssembler';
import type { IToolkitPdfGenerator } from '../domain/IToolkitPdfGenerator';
import type { LeadMagnetRequest } from '../domain/LeadMagnetRequest';
import { MessageLeadMagnetResponse } from '../domain/MessageLeadMagnetResponse';
import {
  LEAD_MAGNET_NOTIFIER,
  LEAD_MAGNET_REQUEST_REPOSITORY,
  TOOLKIT_CONTENT_ASSEMBLER,
  TOOLKIT_PDF_GENERATOR,
} from '../domain/token';
import type { RequestToolkitCommand } from './dto/RequestToolkit.command';
import { LeadMagnetRequestMapper } from './mappers/LeadMagnetRequest.mapper';

/** Orchestre la generation et l'envoi du PDF boite a outils par email. */
@Injectable()
export class RequestToolkitUseCase {
  private readonly logger = new Logger(RequestToolkitUseCase.name);

  constructor(
    @Inject(LEAD_MAGNET_REQUEST_REPOSITORY)
    private readonly repo: ILeadMagnetRequestRepository,
    @Inject(LEAD_MAGNET_NOTIFIER)
    private readonly notifier: ILeadMagnetNotifier,
    @Inject(TOOLKIT_PDF_GENERATOR)
    private readonly pdfGenerator: IToolkitPdfGenerator,
    @Inject(TOOLKIT_CONTENT_ASSEMBLER)
    private readonly assembler: IToolkitContentAssembler,
  ) {}

  /** Execute la demande de lead magnet : validation, deduplication, persistance, envoi. */
  async execute(
    command: RequestToolkitCommand,
  ): Promise<MessageLeadMagnetResponse> {
    const domainRequest = LeadMagnetRequestMapper.fromCommand(command);
    const response = new MessageLeadMagnetResponse();
    response.message = `Votre boite a outils a ete envoyee a ${domainRequest.email}`;

    const recentExists = await this.repo.existsRecentByEmail(
      domainRequest.email,
      domainRequest.formationSlug,
    );
    if (recentExists) return response;

    const savedRequest = await this.repo.create(domainRequest);
    response.accessToken = savedRequest.accessToken;

    // Fire-and-forget : generer le PDF et envoyer l'email sans bloquer la reponse
    void this.generateAndSend(savedRequest).catch((err: unknown) =>
      this.logger.warn('Lead magnet email failed', err),
    );

    return response;
  }

  private async generateAndSend(request: LeadMagnetRequest): Promise<void> {
    const content = this.assembler.assemble(
      request.firstName,
      request.profile ?? null,
    );
    const pdfBuffer = await this.pdfGenerator.generate(request, content);
    await this.notifier.sendToolkitEmail(request, pdfBuffer);
  }
}
