/* eslint-disable @typescript-eslint/unbound-method */
import { buildAuditRequest } from '../../../../../../test/factories/audit-requests.factory';
import type { AuditClientReportMailer } from '../audit-client-report.mailer';
import type { AuditExpertReportMailer } from '../audit-expert-report.mailer';
import type { AuditNotificationMailer } from '../audit-notification.mailer';
import { AuditNotifierFacade } from '../audit-notifier.facade';

describe('AuditNotifierFacade', () => {
  let notificationMailer: jest.Mocked<AuditNotificationMailer>;
  let clientReportMailer: jest.Mocked<AuditClientReportMailer>;
  let expertReportMailer: jest.Mocked<AuditExpertReportMailer>;
  let facade: AuditNotifierFacade;

  beforeEach(() => {
    notificationMailer = {
      sendAuditNotification: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditNotificationMailer>;
    clientReportMailer = {
      sendClientReport: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditClientReportMailer>;
    expertReportMailer = {
      sendExpertReport: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditExpertReportMailer>;

    facade = new AuditNotifierFacade(
      notificationMailer,
      clientReportMailer,
      expertReportMailer,
    );
  });

  it('devrait deleguer sendAuditNotification au notificationMailer', async () => {
    // Arrange
    const request = buildAuditRequest({ id: 'audit-x' });

    // Act
    await facade.sendAuditNotification(request);

    // Assert
    expect(notificationMailer.sendAuditNotification).toHaveBeenCalledTimes(1);
    expect(notificationMailer.sendAuditNotification).toHaveBeenCalledWith(
      request,
    );
    expect(clientReportMailer.sendClientReport).not.toHaveBeenCalled();
    expect(expertReportMailer.sendExpertReport).not.toHaveBeenCalled();
  });

  it('devrait deleguer sendClientReport au clientReportMailer', async () => {
    // Arrange
    const input = {
      to: 'client@example.com',
      firstName: null,
      websiteName: 'mon-site.fr',
      clientReport: {
        executiveSummary: 's',
        topFindings: [],
        googleVsAiMatrix: {
          googleVisibility: { score: 0, summary: '' },
          aiVisibility: { score: 0, summary: '' },
        },
        pillarScorecard: [],
        quickWins: [],
        cta: { title: '', description: '', actionLabel: '' },
      },
      pdfBuffer: null,
    };

    // Act
    await facade.sendClientReport(input);

    // Assert
    expect(clientReportMailer.sendClientReport).toHaveBeenCalledTimes(1);
    expect(clientReportMailer.sendClientReport).toHaveBeenCalledWith(input);
    expect(notificationMailer.sendAuditNotification).not.toHaveBeenCalled();
    expect(expertReportMailer.sendExpertReport).not.toHaveBeenCalled();
  });

  it('devrait deleguer sendExpertReport a l expertReportMailer', async () => {
    // Arrange
    const input = {
      websiteName: 'mon-site.fr',
      auditId: 'audit-42',
      clientContact: { method: 'EMAIL' as const, value: 'client@example.com' },
      clientReport: {
        executiveSummary: 's',
        topFindings: [],
        googleVsAiMatrix: {
          googleVisibility: { score: 0, summary: '' },
          aiVisibility: { score: 0, summary: '' },
        },
        pillarScorecard: [],
        quickWins: [],
        cta: { title: '', description: '', actionLabel: '' },
      },
      expertReport: {
        executiveSummary: 'e',
        perPageAnalysis: [],
        crossPageFindings: [],
        priorityBacklog: [],
        clientEmailDraft: { subject: '', body: '' },
        internalNotes: '',
      },
      pdfBuffer: Buffer.from('pdf'),
    };

    // Act
    await facade.sendExpertReport(input);

    // Assert
    expect(expertReportMailer.sendExpertReport).toHaveBeenCalledTimes(1);
    expect(expertReportMailer.sendExpertReport).toHaveBeenCalledWith(input);
    expect(notificationMailer.sendAuditNotification).not.toHaveBeenCalled();
    expect(clientReportMailer.sendClientReport).not.toHaveBeenCalled();
  });
});
