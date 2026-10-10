import { Test } from '@nestjs/testing';
import { buildAuditRequest } from '../../../../../../test/factories/audit-requests.factory';
import {
  createMockTransporter,
  DEFAULT_AUDIT_ENV,
  setSmtpEnv,
} from '../../../../../../test/factories/mailer.factory';
import { AuditNotificationMailer } from '../audit-notification.mailer';
import { MailerDAudit } from '../mailer-d-audit';
import {
  SMTP_TRANSPORTER,
  type SmtpTransporter,
} from '../smtp-transporter.provider';

class MailerDeTest extends MailerDAudit {
  envoyerUnMot(): Promise<void> {
    return this.envoyer({ to: 'a@b.fr', subject: 'mot' });
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
      transporter as unknown as SmtpTransporter,
    ).envoyerUnMot();

    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: DEFAULT_AUDIT_ENV.SMTP_FROM,
      to: 'a@b.fr',
      subject: 'mot',
    });
  });

  it('reçoit par Nest le transport SMTP déclaré sur la base', async () => {
    const transporter = createMockTransporter();
    const module = await Test.createTestingModule({
      providers: [
        AuditNotificationMailer,
        { provide: SMTP_TRANSPORTER, useValue: transporter },
      ],
    }).compile();

    await module
      .get(AuditNotificationMailer)
      .sendAuditNotification(buildAuditRequest());

    expect(transporter.sendMail).toHaveBeenCalledTimes(1);
  });

  it('n envoie rien sans transport SMTP', async () => {
    await expect(new MailerDeTest(null).envoyerUnMot()).resolves.toBe(
      undefined,
    );
  });
});
