import { Test } from '@nestjs/testing';
import { buildAuditRequest } from '../../../../../../test/factories/audit-requests.factory';
import {
  createMockTransporter,
  DEFAULT_AUDIT_ENV,
  setSmtpEnv,
} from '../../../../../../test/factories/mailer.factory';
import {
  escapeHtml,
  safeHtml,
} from '../../../../../common/domain/texte/html-escape.util';
import { ExpediteurDeCourriels } from '../../../../../common/infrastructure/mail/expediteur-smtp';
import { AuditNotificationMailer } from '../audit-notification.mailer';
import { EXPEDITEUR_D_AUDIT } from '../expediteur-d-audit.provider';
import { MailerDAudit } from '../mailer-d-audit';

class MailerDeTest extends MailerDAudit {
  envoyerUnMot(): Promise<void> {
    return this.envoyer({
      to: 'a@b.fr',
      subject: 'mot',
      html: safeHtml`<p>${escapeHtml('<mot>')}</p>`,
    });
  }

  envoyerUnHtmlNonEmis(): Promise<void> {
    return this.envoyer({
      to: 'a@b.fr',
      subject: 'mot',
      html: '<img src=x onerror=alert(1)>' as never,
    });
  }
}

describe('MailerDAudit', () => {
  let restaurerEnv: () => void;

  beforeEach(() => {
    restaurerEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
  });

  afterEach(() => restaurerEnv());

  it('envoie depuis l expéditeur configuré', async () => {
    const transporter = createMockTransporter();

    await new MailerDeTest(
      new ExpediteurDeCourriels(transporter),
    ).envoyerUnMot();

    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: DEFAULT_AUDIT_ENV.SMTP_FROM,
      to: 'a@b.fr',
      subject: 'mot',
      html: '<p>&lt;mot&gt;</p>',
    });
  });

  it('n envoie aucun HTML qui n a pas ete emis par escapeHtml ou safeHtml', async () => {
    const transporter = createMockTransporter();

    await expect(
      new MailerDeTest(
        new ExpediteurDeCourriels(transporter),
      ).envoyerUnHtmlNonEmis(),
    ).rejects.toThrow(/Fragment HTML refusé/);
    expect(transporter.sendMail).not.toHaveBeenCalled();
  });

  it('reçoit par Nest le transport SMTP déclaré sur la base', async () => {
    const transporter = createMockTransporter();
    const module = await Test.createTestingModule({
      providers: [
        AuditNotificationMailer,
        {
          provide: EXPEDITEUR_D_AUDIT,
          useValue: new ExpediteurDeCourriels(transporter),
        },
      ],
    }).compile();

    await module
      .get(AuditNotificationMailer)
      .sendAuditNotification(buildAuditRequest());

    expect(transporter.sendMail).toHaveBeenCalledTimes(1);
  });

  it('n envoie rien sans transport SMTP', async () => {
    await expect(
      new MailerDeTest(new ExpediteurDeCourriels(null)).envoyerUnMot(),
    ).resolves.toBe(undefined);
  });
});
