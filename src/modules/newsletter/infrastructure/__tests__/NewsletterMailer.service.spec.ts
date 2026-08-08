import { ConfigService } from '@nestjs/config';
import { buildNewsletterSubscriber } from '../../../../../test/factories/newsletter-subscriber.factory';
import type { NewsletterSubscriber } from '../../domain/NewsletterSubscriber';

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });

jest.mock(
  '../../../../common/infrastructure/mail/smtp-transporter.util',
  () => ({
    createOptionalSmtpTransporter: jest.fn(() => ({ sendMail: mockSendMail })),
  }),
);

import { NewsletterMailerService } from '../NewsletterMailer.service';

function buildMockConfigService(): ConfigService {
  return {
    get: jest.fn().mockReturnValue(undefined),
  } as unknown as ConfigService;
}

const HOSTILE_FIRST_NAME = "Anne & <Marie> d'Arc";
const HOSTILE_FIRST_NAME_ESCAPED = 'Anne &amp; &lt;Marie&gt; d&#39;Arc';

type SendMail = (
  mailer: NewsletterMailerService,
  subscriber: NewsletterSubscriber,
) => Promise<void>;

const SEND_METHODS: ReadonlyArray<[string, SendMail]> = [
  [
    'sendConfirmation',
    (mailer, subscriber) => mailer.sendConfirmation(subscriber),
  ],
  ['sendWelcome', (mailer, subscriber) => mailer.sendWelcome(subscriber)],
  [
    'sendUnsubscribeAck',
    (mailer, subscriber) => mailer.sendUnsubscribeAck(subscriber),
  ],
];

describe('NewsletterMailerService', () => {
  let mailer: NewsletterMailerService;

  beforeEach(() => {
    jest.clearAllMocks();
    mailer = new NewsletterMailerService(buildMockConfigService());
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

  describe('URL des liens newsletter (routes servies par l’API)', () => {
    it('prefixe l’URL de desabonnement par le prefixe d’API', async () => {
      const subscriber = buildNewsletterSubscriber();

      await mailer.sendWelcome(subscriber);

      const [call] = mockSendMail.mock.calls as [
        [{ text: string; headers: Record<string, string> }],
      ];
      const expectedPath = '/api/v1/portfolio25/newsletter/unsubscribe';
      expect(call[0].text).toContain(expectedPath);
      expect(call[0].headers['List-Unsubscribe']).toContain(expectedPath);
    });

    it('prefixe l’URL de confirmation par le prefixe d’API', async () => {
      const subscriber = buildNewsletterSubscriber();

      await mailer.sendConfirmation(subscriber);

      const [call] = mockSendMail.mock.calls as [[{ text: string }]];
      expect(call[0].text).toContain('/api/v1/portfolio25/newsletter/confirm');
    });

    it.each([
      ['sans slash', 'api/v1/portfolio25'],
      ['avec slash de tete', '/api/v1/portfolio25'],
      ['avec slash de queue', 'api/v1/portfolio25/'],
      ['avec les deux slashes', '/api/v1/portfolio25/'],
    ])(
      'produit toujours le meme chemin quel que soit le prefixe %s',
      async (_label, prefix) => {
        // `.env` et `deploy/backend.env` utilisent des formes
        // differentes : sans normalisation, un slash de tete ferait
        // interpreter le premier segment comme un hote.
        const configService = {
          get: jest.fn((key: string) =>
            key === 'API_PREFIX' ? prefix : undefined,
          ),
        } as unknown as ConfigService;
        const customMailer = new NewsletterMailerService(configService);

        await customMailer.sendWelcome(buildNewsletterSubscriber());

        const [call] = mockSendMail.mock.calls as [[{ text: string }]];
        expect(call[0].text).toContain(
          'https://asilidesign.fr/api/v1/portfolio25/newsletter/unsubscribe',
        );
      },
    );

    it('ne detourne pas l’hote quand API_PREFIX est vide', async () => {
      const configService = {
        get: jest.fn((key: string) => (key === 'API_PREFIX' ? '' : undefined)),
      } as unknown as ConfigService;
      const customMailer = new NewsletterMailerService(configService);

      await customMailer.sendWelcome(buildNewsletterSubscriber());

      const [call] = mockSendMail.mock.calls as [[{ text: string }]];
      expect(call[0].text).toContain(
        'https://asilidesign.fr/newsletter/unsubscribe',
      );
      expect(call[0].text).not.toContain('https://newsletter');
    });

    it('respecte un API_PREFIX personnalise', async () => {
      const configService = {
        get: jest.fn((key: string) =>
          key === 'API_PREFIX' ? 'custom/prefix' : undefined,
        ),
      } as unknown as ConfigService;
      const customMailer = new NewsletterMailerService(configService);
      const subscriber = buildNewsletterSubscriber();

      await customMailer.sendWelcome(subscriber);

      const [call] = mockSendMail.mock.calls as [[{ text: string }]];
      expect(call[0].text).toContain('/custom/prefix/newsletter/unsubscribe');
    });
  });

  describe('en-tetes List-Unsubscribe (RFC 8058)', () => {
    it('n’expose PAS le bouton natif sur l’email de confirmation', async () => {
      const subscriber = buildNewsletterSubscriber();

      await mailer.sendConfirmation(subscriber);

      const [call] = mockSendMail.mock.calls as [
        [{ headers?: Record<string, string> }],
      ];
      expect(call[0].headers?.['List-Unsubscribe']).toBeUndefined();
      expect(call[0].headers?.['List-Unsubscribe-Post']).toBeUndefined();
    });

    it('utilise une adresse mailto nue, sans display name', async () => {
      const configService = {
        get: jest.fn((key: string) =>
          key === 'SMTP_REPLY_TO'
            ? "'Asili Design' <contact@asilidesign.fr>"
            : undefined,
        ),
      } as unknown as ConfigService;
      const customMailer = new NewsletterMailerService(configService);
      const subscriber = buildNewsletterSubscriber();

      await customMailer.sendWelcome(subscriber);

      const [call] = mockSendMail.mock.calls as [
        [{ headers: Record<string, string> }],
      ];
      expect(call[0].headers['List-Unsubscribe']).toContain(
        '<mailto:contact@asilidesign.fr?subject=unsubscribe>',
      );
    });

    it('expose le desabonnement en un clic sur l’email de bienvenue', async () => {
      const subscriber = buildNewsletterSubscriber();

      await mailer.sendWelcome(subscriber);

      const [call] = mockSendMail.mock.calls as [
        [{ headers: Record<string, string> }],
      ];
      expect(call[0].headers['List-Unsubscribe']).toContain(
        subscriber.unsubscribeToken,
      );
      expect(call[0].headers['List-Unsubscribe-Post']).toBe(
        'List-Unsubscribe=One-Click',
      );
    });

    it('n’ajoute pas d’en-tete de desabonnement a l’accuse de desabonnement', async () => {
      const subscriber = buildNewsletterSubscriber();

      await mailer.sendUnsubscribeAck(subscriber);

      const [call] = mockSendMail.mock.calls as [
        [{ headers?: Record<string, string> }],
      ];
      expect(call[0].headers?.['List-Unsubscribe']).toBeUndefined();
    });
  });

  describe('reply-to par defaut', () => {
    it('utilise un reply-to @asilidesign.fr (jamais gmail) quand SMTP_REPLY_TO est absent', async () => {
      const subscriber = buildNewsletterSubscriber();

      await mailer.sendConfirmation(subscriber);

      const [call] = mockSendMail.mock.calls as [[{ replyTo: string }]];
      expect(call[0].replyTo).toMatch(/@asilidesign\.fr$/);
      expect(call[0].replyTo).not.toContain('gmail.com');
    });

    it('privilegie SMTP_REPLY_TO quand la variable est definie', async () => {
      const configWithReplyTo = {
        get: jest.fn((key: string) =>
          key === 'SMTP_REPLY_TO' ? 'override@example.org' : undefined,
        ),
      } as unknown as ConfigService;
      const mailerWithReplyTo = new NewsletterMailerService(configWithReplyTo);

      await mailerWithReplyTo.sendConfirmation(buildNewsletterSubscriber());

      const [call] = mockSendMail.mock.calls as [[{ replyTo: string }]];
      expect(call[0].replyTo).toBe('override@example.org');
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

  describe.each(SEND_METHODS)(
    '%s — le greeting est brut en text/plain, echappe en HTML',
    (_label, send) => {
      it('livre le prenom intact dans le corps texte', async () => {
        const subscriber = buildNewsletterSubscriber({
          firstName: HOSTILE_FIRST_NAME,
        });

        await send(mailer, subscriber);

        const [call] = mockSendMail.mock.calls as [[{ text: string }]];
        expect(call[0].text).toContain(`Bonjour ${HOSTILE_FIRST_NAME}`);
      });

      it('ne laisse aucune entite HTML dans le corps texte', async () => {
        const subscriber = buildNewsletterSubscriber({
          firstName: HOSTILE_FIRST_NAME,
        });

        await send(mailer, subscriber);

        const [call] = mockSendMail.mock.calls as [[{ text: string }]];
        expect(call[0].text).not.toMatch(/&(amp|lt|gt|quot|#39);/);
      });

      it('echappe le prenom dans le corps HTML', async () => {
        const subscriber = buildNewsletterSubscriber({
          firstName: HOSTILE_FIRST_NAME,
        });

        await send(mailer, subscriber);

        const [call] = mockSendMail.mock.calls as [[{ html: string }]];
        expect(call[0].html).toContain(`Bonjour ${HOSTILE_FIRST_NAME_ESCAPED}`);
        expect(call[0].html).not.toContain(HOSTILE_FIRST_NAME);
        expect(call[0].html).not.toContain('<Marie>');
      });
    },
  );

  describe('comportement sans transporter (SMTP non configure)', () => {
    it('ne leve pas d\u2019erreur si le transporter est null', async () => {
      const subscriber = buildNewsletterSubscriber();
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
