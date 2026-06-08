import { buildLeadMagnetRequest } from '../../../../../test/factories/lead-magnet-request.factory';

// Mock createOptionalSmtpTransporter avant l'import du service pour injecter
// un faux transporter et couvrir la branche "transporter present".
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });

jest.mock(
  '../../../../common/infrastructure/mail/smtp-transporter.util',
  () => ({
    createOptionalSmtpTransporter: jest.fn(() => ({ sendMail: mockSendMail })),
  }),
);

import { LeadMagnetMailerService } from '../LeadMagnetMailer.service';

describe('LeadMagnetMailerService', () => {
  const PDF = Buffer.from('fake-pdf');
  let originalReplyTo: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    originalReplyTo = process.env.SMTP_REPLY_TO;
  });

  afterEach(() => {
    if (originalReplyTo === undefined) {
      delete process.env.SMTP_REPLY_TO;
    } else {
      process.env.SMTP_REPLY_TO = originalReplyTo;
    }
  });

  describe('reply-to par defaut', () => {
    it('utilise un reply-to @asilidesign.fr (jamais gmail) quand SMTP_REPLY_TO est absent', async () => {
      delete process.env.SMTP_REPLY_TO;
      const mailer = new LeadMagnetMailerService();

      await mailer.sendToolkitEmail(buildLeadMagnetRequest(), PDF);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const [call] = mockSendMail.mock.calls as [[{ replyTo: string }]];
      expect(call[0].replyTo).toMatch(/@asilidesign\.fr$/);
      expect(call[0].replyTo).not.toContain('gmail.com');
    });

    it('privilegie SMTP_REPLY_TO quand la variable est definie', async () => {
      process.env.SMTP_REPLY_TO = 'override@example.org';
      const mailer = new LeadMagnetMailerService();

      await mailer.sendToolkitEmail(buildLeadMagnetRequest(), PDF);

      const [call] = mockSendMail.mock.calls as [[{ replyTo: string }]];
      expect(call[0].replyTo).toBe('override@example.org');
    });
  });

  it('joint le PDF et adresse l email au participant', async () => {
    delete process.env.SMTP_REPLY_TO;
    const mailer = new LeadMagnetMailerService();
    const request = buildLeadMagnetRequest({ email: 'marie@example.com' });

    await mailer.sendToolkitEmail(request, PDF);

    const [call] = mockSendMail.mock.calls as [
      [{ to: string; attachments: Array<{ filename: string }> }],
    ];
    expect(call[0].to).toBe('marie@example.com');
    expect(call[0].attachments[0].filename).toBe('guide-ia-solopreneurs.pdf');
  });
});
