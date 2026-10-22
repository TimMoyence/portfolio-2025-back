import { Inject, Injectable, Logger } from '@nestjs/common';
import { enArrierePlan } from '../../../common/application/en-arriere-plan';
import { RateLimitExceededError } from '../../../common/domain/errors/RateLimitExceededError';
import { lienAvecJeton } from '../../../common/domain/lien-avec-jeton';
import { urlDuSite } from '../../../config/urls-publiques';
import { emettreJeton } from '../../../common/domain/crypto/TokenHash';
import { adresseDuSite } from '../domain/AdresseDuSite';
import type { IAuditNotifierPort } from '../domain/IAuditNotifier.port';
import type { IAuditQueuePort } from '../domain/IAuditQueue.port';
import { AuditRequestResponse } from '../domain/AuditRequestResponse';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import { SelfAuditGuard } from '../domain/SelfAuditGuard';
import {
  AUDIT_NOTIFIER,
  AUDIT_QUEUE,
  AUDIT_REQUESTS_REPOSITORY,
  AUDIT_SELF_GUARD,
} from '../domain/token';
import { CreateAuditRequestCommand } from './dto/CreateAuditRequest.command';
import { AuditRequestMapper } from './mappers/AuditRequest.mapper';

const FENETRE_PAR_CONTACT_MS = 60 * 60 * 1000;
const DEMANDES_MAX_PAR_CONTACT = 3;

@Injectable()
export class CreateAuditRequestsUseCase {
  private readonly logger = new Logger(CreateAuditRequestsUseCase.name);

  constructor(
    @Inject(AUDIT_REQUESTS_REPOSITORY)
    private readonly repo: IAuditRequestsRepository,
    @Inject(AUDIT_QUEUE)
    private readonly queueService: IAuditQueuePort,
    @Inject(AUDIT_NOTIFIER)
    private readonly notifier: IAuditNotifierPort,
    @Inject(AUDIT_SELF_GUARD)
    private readonly selfGuard: SelfAuditGuard,
  ) {}

  async execute(
    data: CreateAuditRequestCommand,
  ): Promise<AuditRequestResponse> {
    this.selfGuard.ensureNotSelf(data.websiteName);

    const request = AuditRequestMapper.fromCreateCommand(data);
    const jeton = request.contactMethod === 'EMAIL' ? emettreJeton() : null;
    const response = await this.repo.sousVerrouDeLaBoite(
      request.contactValue,
      async (depot) => {
        const delais = await depot.secondesAvantLaSortieDesDemandesVers(
          request.contactValue,
          FENETRE_PAR_CONTACT_MS,
        );
        if (delais.length >= DEMANDES_MAX_PAR_CONTACT) {
          throw new RateLimitExceededError(
            'Trop de demandes d audit vers cette adresse.',
            Math.ceil(delais[delais.length - DEMANDES_MAX_PAR_CONTACT]),
          );
        }
        return depot.create(request, jeton?.empreinte ?? null);
      },
    );

    if (jeton === null) {
      await this.queueService.enqueue(response.auditId);
    } else {
      enArrierePlan(
        this.notifier.demanderLaConfirmation({
          to: request.contactValue,
          hote: adresseDuSite(request.websiteName).hostname,
          lien: lienAvecJeton(
            `${urlDuSite()}/${request.locale}/growth-audit`,
            jeton.brut,
          ),
          locale: request.locale,
        }),
        'Audit confirmation email failed',
        this.logger,
      );
    }

    enArrierePlan(
      this.notifier.sendAuditNotification(request),
      'Audit request notification failed',
      this.logger,
    );

    return response;
  }
}
