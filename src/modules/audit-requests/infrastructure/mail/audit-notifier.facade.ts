import { Injectable } from '@nestjs/common';
import { AuditRequest } from '../../domain/AuditRequest';
import type {
  ClientReportMailInput,
  DemandeDeConfirmation,
  ExpertReportMailInput,
  IAuditNotifierPort,
} from '../../domain/IAuditNotifier.port';
import { AuditClientReportMailer } from './audit-client-report.mailer';
import { AuditConfirmationMailer } from './audit-confirmation.mailer';
import { AuditExpertReportMailer } from './audit-expert-report.mailer';
import { AuditNotificationMailer } from './audit-notification.mailer';

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
