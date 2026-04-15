import { Injectable } from '@nestjs/common';
import { AuditRequest } from '../../domain/AuditRequest';
import type {
  ClientReportMailInput,
  ExpertReportMailInput,
  IAuditNotifierPort,
} from '../../domain/IAuditNotifier.port';
import { AuditClientReportMailer } from './audit-client-report.mailer';
import { AuditExpertReportMailer } from './audit-expert-report.mailer';
import { AuditNotificationMailer } from './audit-notification.mailer';

/**
 * Facade qui implemente le port {@link IAuditNotifierPort} en deleguant chaque
 * methode au mailer specialise correspondant (Admin / Client / Expert).
 *
 * Cette facade est le seul point d'entree connu du reste du module (via le
 * token `AUDIT_NOTIFIER`) : les consommateurs (use cases, orchestrators)
 * n'ont pas a connaitre l'existence des trois mailers sous-jacents.
 */
@Injectable()
export class AuditNotifierFacade implements IAuditNotifierPort {
  constructor(
    private readonly notificationMailer: AuditNotificationMailer,
    private readonly clientReportMailer: AuditClientReportMailer,
    private readonly expertReportMailer: AuditExpertReportMailer,
  ) {}

  /** Delegue au {@link AuditNotificationMailer}. */
  sendAuditNotification(request: AuditRequest): Promise<void> {
    return this.notificationMailer.sendAuditNotification(request);
  }

  /** Delegue au {@link AuditClientReportMailer}. */
  sendClientReport(input: ClientReportMailInput): Promise<void> {
    return this.clientReportMailer.sendClientReport(input);
  }

  /** Delegue au {@link AuditExpertReportMailer}. */
  sendExpertReport(input: ExpertReportMailInput): Promise<void> {
    return this.expertReportMailer.sendExpertReport(input);
  }
}
