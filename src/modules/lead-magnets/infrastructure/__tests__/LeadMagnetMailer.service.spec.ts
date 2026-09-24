import { buildLeadMagnetRequest } from '../../../../../test/factories/lead-magnet-request.factory';
import {
  mailSimule,
  moduleSmtpSimule,
} from '../../../../../test/factories/mailer.factory';

jest.mock('../../../../common/infrastructure/mail/smtp-transporter.util', () =>
  moduleSmtpSimule(),
);

import { LeadMagnetMailerService } from '../LeadMagnetMailer.service';

describe('LeadMagnetMailerService', () => {
  const PDF = Buffer.from('fake-pdf');
  let originalReplyTo: string | undefined;

  const envoyerLeGuide = (email?: string) =>
    new LeadMagnetMailerService().sendToolkitEmail(
      buildLeadMagnetRequest(email === undefined ? {} : { email }),
      PDF,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    originalReplyTo = process.env.SMTP_REPLY_TO;
    delete process.env.SMTP_REPLY_TO;
  });

  afterEach(() => {
    if (originalReplyTo === undefined) {
      delete process.env.SMTP_REPLY_TO;
    } else {
      process.env.SMTP_REPLY_TO = originalReplyTo;
    }
  });

  it('utilise un reply-to @asilidesign.fr (jamais gmail) quand SMTP_REPLY_TO est absent', async () => {
    await envoyerLeGuide();

    expect(mailSimule().replyTo).toMatch(/@asilidesign\.fr$/);
  });

  it('privilegie SMTP_REPLY_TO quand la variable est definie', async () => {
    process.env.SMTP_REPLY_TO = 'override@example.org';

    await envoyerLeGuide();

    expect(mailSimule().replyTo).toBe('override@example.org');
  });

  it('joint le PDF et adresse l email au participant', async () => {
    await envoyerLeGuide('marie@example.com');

    const mail = mailSimule();
    expect(mail.to).toBe('marie@example.com');
    expect(mail.attachments?.map((piece) => piece.filename)).toEqual([
      'guide-ia-solopreneurs.pdf',
    ]);
  });
});
