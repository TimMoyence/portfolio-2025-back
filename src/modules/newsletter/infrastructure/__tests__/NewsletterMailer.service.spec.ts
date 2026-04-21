import { buildNewsletterSubscriber } from '../../../../../test/factories/newsletter-subscriber.factory';

// Mock createOptionalSmtpTransporter avant l'import du service pour injecter
// un faux transporter et couvrir les branches "transporter present".
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });

jest.mock(
  '../../../../common/infrastructure/mail/smtp-transporter.util',
  () => ({
    createOptionalSmtpTransporter: jest.fn(() => ({ sendMail: mockSendMail })),
  }),
);

import { NewsletterMailerService } from '../NewsletterMailer.service';

describe('NewsletterMailerService', () => {
  let mailer: NewsletterMailerService;

  beforeEach(() => {
    jest.clearAllMocks();
    mailer = new NewsletterMailerService();
  });

  it('s\u2019instancie sans erreur', () => {
    expect(mailer).toBeDefined();
  });

  describe('sendConfirmation', () => {
    it('appelle sendMail avec les bons champs obligatoires', async () => {
      const subscriber = buildNewsletterSubscriber();

      await mailer.sendConfirmation(subscriber);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const [call] = mockSendMail.mock.calls as [
        [{ to: string; subject: string; text: string; html: string }],
      ];
      expect(call[0].to).toBe(subscriber.email);
      expect(call[0].subject).toContain('Confirmez');
      expect(call[0].text).toContain(subscriber.confirmToken);
      expect(call[0].html).toContain(subscriber.confirmToken);
    });

    it('inclut le prenom dans le greeting quand il est fourni', async () => {
      const subscriber = buildNewsletterSubscriber({ firstName: 'Marie' });

      await mailer.sendConfirmation(subscriber);

      const [call] = mockSendMail.mock.calls as [[{ text: string }]];
      expect(call[0].text).toContain('Marie');
    });

    it('utilise un greeting generique quand le prenom est absent', async () => {
      const subscriber = buildNewsletterSubscriber({ firstName: null });

      await mailer.sendConfirmation(subscriber);

      const [call] = mockSendMail.mock.calls as [[{ text: string }]];
      expect(call[0].text).toContain('Bonjour');
      expect(call[0].text).not.toContain('null');
    });

    it('echappe les caracteres HTML speciaux dans le prenom', async () => {
      const subscriber = buildNewsletterSubscriber({
        firstName: '<script>alert(1)</script>',
      });

      await mailer.sendConfirmation(subscriber);

      const [call] = mockSendMail.mock.calls as [[{ html: string }]];
      expect(call[0].html).not.toContain('<script>');
      expect(call[0].html).toContain('&lt;script&gt;');
    });
  });

  describe('sendWelcome', () => {
    it('appelle sendMail avec un lien de desabonnement', async () => {
      const subscriber = buildNewsletterSubscriber();

      await mailer.sendWelcome(subscriber);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const [call] = mockSendMail.mock.calls as [
        [{ text: string; html: string }],
      ];
      expect(call[0].text).toContain(subscriber.unsubscribeToken);
      expect(call[0].html).toContain(subscriber.unsubscribeToken);
    });
  });

  describe('sendUnsubscribeAck', () => {
    it('appelle sendMail avec le sujet de desabonnement', async () => {
      const subscriber = buildNewsletterSubscriber();

      await mailer.sendUnsubscribeAck(subscriber);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const [call] = mockSendMail.mock.calls as [[{ subject: string }]];
      expect(call[0].subject).toContain('Desabonnement');
    });
  });

  describe('comportement sans transporter (SMTP non configure)', () => {
    it('ne leve pas d\u2019erreur si le transporter est null', async () => {
      const subscriber = buildNewsletterSubscriber();
      // Forcer le transporter a null via cast pour simuler l'absence de SMTP.
      (mailer as unknown as Record<string, unknown>)['transporter'] = null;

      await expect(
        mailer.sendConfirmation(subscriber),
      ).resolves.toBeUndefined();
      await expect(mailer.sendWelcome(subscriber)).resolves.toBeUndefined();
      await expect(
        mailer.sendUnsubscribeAck(subscriber),
      ).resolves.toBeUndefined();
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });
});
