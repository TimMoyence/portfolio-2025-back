import { Injectable } from '@nestjs/common';
import { AuditRequest } from '../../domain/demande/AuditRequest';
import type {
  ClientReportMailInput,
  DemandeDeConfirmation,
  ExpertReportMailInput,
  IAuditNotifierPort,
} from '../../domain/traitement/IAuditNotifier.port';
import { AuditClientReportMailer } from './rapports/audit-client-report.mailer';
import { AuditConfirmationMailer } from './rapports/audit-confirmation.mailer';
import { AuditExpertReportMailer } from './rapports/audit-expert-report.mailer';
import { AuditNotificationMailer } from './rapports/audit-notification.mailer';

@Injectable()
export class AuditNotifierFacade implements IAuditNotifierPort {
  constructor(
    private readonly notificationMailer: AuditNotificationMailer,
    private readonly clientReportMailer: AuditClientReportMailer,
    private readonly expertReportMailer: AuditExpertReportMailer,
    private readonly confirmationMailer: AuditConfirmationMailer,
  ) {}

  demanderLaConfirmation(demande: DemandeDeConfirmation): Promise<void> {
    return this.confirmationMailer.demanderLaConfirmation(demande);
  }

  sendAuditNotification(request: AuditRequest): Promise<void> {
    return this.notificationMailer.sendAuditNotification(request);
  }

  sendClientReport(input: ClientReportMailInput): Promise<void> {
    return this.clientReportMailer.sendClientReport(input);
  }

  sendExpertReport(input: ExpertReportMailInput): Promise<void> {
    return this.expertReportMailer.sendExpertReport(input);
  }
}
