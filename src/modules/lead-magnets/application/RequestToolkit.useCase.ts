import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ILeadMagnetNotifier } from '../domain/ILeadMagnetNotifier';
import type { ILeadMagnetRequestRepository } from '../domain/ILeadMagnetRequestRepository';
import type { IToolkitPdfGenerator } from '../domain/IToolkitPdfGenerator';
import type { LeadMagnetRequest } from '../domain/LeadMagnetRequest';
import { MessageLeadMagnetResponse } from '../domain/MessageLeadMagnetResponse';
import {
  LEAD_MAGNET_NOTIFIER,
  LEAD_MAGNET_REQUEST_REPOSITORY,
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
  ) {}

  /** Execute la demande de lead magnet : validation, deduplication, persistance, envoi. */
  async execute(
    command: RequestToolkitCommand,
  ): Promise<MessageLeadMagnetResponse> {
    const request = LeadMagnetRequestMapper.fromCommand(command);
    const response = new MessageLeadMagnetResponse();
    response.message = `Votre boite a outils a ete envoyee a ${request.email}`;

    const recentExists = await this.repo.existsRecentByEmail(
      request.email,
      request.formationSlug,
    );
    if (recentExists) return response;

    await this.repo.create(request);

    // Fire-and-forget : generer le PDF et envoyer l'email sans bloquer la reponse
    void this.generateAndSend(request).catch((err: unknown) =>
      this.logger.warn('Lead magnet email failed', err),
    );

    return response;
  }

  private async generateAndSend(request: LeadMagnetRequest): Promise<void> {
    const pdfBuffer = await this.pdfGenerator.generate(request);
    await this.notifier.sendToolkitEmail(request, pdfBuffer);
  }
}
