import { ConfigService } from '@nestjs/config';
import {
  envoiSmtpSimule,
  mailSimule,
  moduleSmtpSimule,
} from '../../../../../test/factories/mailer.factory';
import { buildNewsletterSubscriber } from '../../../../../test/factories/newsletter-subscriber.factory';
import type { NewsletterSubscriber } from '../../domain/NewsletterSubscriber';

jest.mock('../../../../common/infrastructure/mail/smtp-transporter.util', () =>
  moduleSmtpSimule(),
);

import { NewsletterMailerService } from '../NewsletterMailer.service';

function mailerAvec(
  variables: Readonly<Record<string, string>> = {},
): NewsletterMailerService {
  return new NewsletterMailerService({
    get: jest.fn((key: string) => variables[key]),
  } as unknown as ConfigService);
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
    mailer = mailerAvec();
  });

  describe('sendConfirmation', () => {
    it('appelle sendMail avec les bons champs obligatoires', async () => {
      const subscriber = buildNewsletterSubscriber();

      await mailer.sendConfirmation(subscriber);

      const mail = mailSimule();
      expect(mail.to).toBe(subscriber.email);
      expect(mail.subject).toContain('Confirmez');
      expect(mail.text).toContain(subscriber.confirmToken);
      expect(mail.html).toContain(subscriber.confirmToken);
    });

    it('inclut le prenom dans le greeting quand il est fourni', async () => {
      await mailer.sendConfirmation(
        buildNewsletterSubscriber({ firstName: 'Marie' }),
      );

      expect(mailSimule().text).toContain('Marie');
    });

    it('utilise un greeting generique quand le prenom est absent', async () => {
      await mailer.sendConfirmation(
        buildNewsletterSubscriber({ firstName: null }),
      );

      const { text } = mailSimule();
      expect(text).toContain('Bonjour');
      expect(text).not.toContain('null');
    });

    it('echappe les caracteres HTML speciaux dans le prenom', async () => {
      await mailer.sendConfirmation(
        buildNewsletterSubscriber({ firstName: '<script>alert(1)</script>' }),
      );

      const { html } = mailSimule();
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  it('sendWelcome · porte le lien de desabonnement', async () => {
    const subscriber = buildNewsletterSubscriber();

    await mailer.sendWelcome(subscriber);

    const mail = mailSimule();
    expect(mail.text).toContain(subscriber.unsubscribeToken);
    expect(mail.html).toContain(subscriber.unsubscribeToken);
  });

  it('sendUnsubscribeAck · porte le sujet de desabonnement', async () => {
    await mailer.sendUnsubscribeAck(buildNewsletterSubscriber());

    expect(mailSimule().subject).toContain('Desabonnement');
  });

  describe('source veille-ia', () => {
    const veille = () =>
      buildNewsletterSubscriber({ sourceFormationSlug: 'veille-ia' });

    it('présente la veille quotidienne, pas une formation, à la confirmation', async () => {
      await mailer.sendConfirmation(veille());

      const { text, html } = mailSimule();
      expect(text).toContain('veille IA');
      expect(text).not.toContain('formation "veille-ia"');
      expect(html).not.toContain('formation <strong>veille-ia');
    });

    it('n annonce pas la séquence de formation dans l email de bienvenue', async () => {
      await mailer.sendWelcome(veille());

      const { text, html } = mailSimule();
      expect(text).not.toContain('J+2');
      expect(html).not.toContain('J+2');
      expect(text).toContain('chaque matin');
    });
  });

  describe('URL des liens newsletter (routes servies par l’API)', () => {
    it('prefixe l’URL de desabonnement par le prefixe d’API', async () => {
      await mailer.sendWelcome(buildNewsletterSubscriber());

      const mail = mailSimule();
      const expectedPath = '/api/v1/portfolio25/newsletter/unsubscribe';
      expect(mail.text).toContain(expectedPath);
      expect(mail.headers?.['List-Unsubscribe']).toContain(expectedPath);
    });

    it('prefixe l’URL de confirmation par le prefixe d’API', async () => {
      await mailer.sendConfirmation(buildNewsletterSubscriber());

      expect(mailSimule().text).toContain(
        '/api/v1/portfolio25/newsletter/confirm',
      );
    });

    it.each([
      ['sans slash', 'api/v1/portfolio25', '/api/v1/portfolio25'],
      ['avec slash de tete', '/api/v1/portfolio25', '/api/v1/portfolio25'],
      ['avec slash de queue', 'api/v1/portfolio25/', '/api/v1/portfolio25'],
      ['avec les deux slashes', '/api/v1/portfolio25/', '/api/v1/portfolio25'],
      ['personnalise', 'custom/prefix', '/custom/prefix'],
      ['vide, sans detourner l’hote', '', ''],
    ])(
      'place le desabonnement sous l’hote du site, prefixe %s',
      async (_label, prefix, chemin) => {
        await mailerAvec({ API_PREFIX: prefix }).sendWelcome(
          buildNewsletterSubscriber(),
        );

        expect(mailSimule().text).toContain(
          `https://asilidesign.fr${chemin}/newsletter/unsubscribe`,
        );
      },
    );
  });

  describe('en-tetes List-Unsubscribe (RFC 8058)', () => {
    it.each(SEND_METHODS.filter(([nom]) => nom !== 'sendWelcome'))(
      'n’expose PAS le bouton natif sur %s',
      async (_label, envoyer) => {
        await envoyer(mailer, buildNewsletterSubscriber());

        const { headers } = mailSimule();
        expect(headers?.['List-Unsubscribe']).toBeUndefined();
        expect(headers?.['List-Unsubscribe-Post']).toBeUndefined();
      },
    );

    it('utilise une adresse mailto nue, sans display name', async () => {
      await mailerAvec({
        SMTP_REPLY_TO: "'Asili Design' <contact@asilidesign.fr>",
      }).sendWelcome(buildNewsletterSubscriber());

      expect(mailSimule().headers?.['List-Unsubscribe']).toContain(
        '<mailto:contact@asilidesign.fr?subject=unsubscribe>',
      );
    });

    it('expose le desabonnement en un clic sur l’email de bienvenue', async () => {
      const subscriber = buildNewsletterSubscriber();

      await mailer.sendWelcome(subscriber);

      const { headers } = mailSimule();
      expect(headers?.['List-Unsubscribe']).toContain(
        subscriber.unsubscribeToken,
      );
      expect(headers?.['List-Unsubscribe-Post']).toBe(
        'List-Unsubscribe=One-Click',
      );
    });
  });

  it.each([
    [
      'un reply-to @asilidesign.fr quand SMTP_REPLY_TO est absent',
      {},
      /@asilidesign\.fr$/,
    ],
    [
      'SMTP_REPLY_TO quand la variable est definie',
      { SMTP_REPLY_TO: 'override@example.org' },
      /^override@example\.org$/,
    ],
  ])('repond a %s', async (_label, variables, attendu) => {
    await mailerAvec(variables).sendConfirmation(buildNewsletterSubscriber());

    expect(mailSimule().replyTo).toMatch(attendu);
  });

  describe.each(SEND_METHODS)(
    '%s — le greeting est brut en text/plain, echappe en HTML',
    (_label, send) => {
      beforeEach(async () => {
        await send(
          mailer,
          buildNewsletterSubscriber({ firstName: HOSTILE_FIRST_NAME }),
        );
      });

      it('livre le prenom intact et sans entite HTML dans le corps texte', () => {
        const { text } = mailSimule();
        expect(text).toContain(`Bonjour ${HOSTILE_FIRST_NAME}`);
        expect(text).not.toMatch(/&(amp|lt|gt|quot|#39);/);
      });

      it('echappe le prenom dans le corps HTML', () => {
        const { html } = mailSimule();
        expect(html).toContain(`Bonjour ${HOSTILE_FIRST_NAME_ESCAPED}`);
        expect(html).not.toContain(HOSTILE_FIRST_NAME);
        expect(html).not.toContain('<Marie>');
      });
    },
  );

  it('ne leve pas d’erreur sans transporter (SMTP non configure)', async () => {
    const subscriber = buildNewsletterSubscriber();
    (mailer as unknown as Record<string, unknown>)['transporter'] = null;

    await expect(mailer.sendConfirmation(subscriber)).resolves.toBeUndefined();
    await expect(mailer.sendWelcome(subscriber)).resolves.toBeUndefined();
    await expect(
      mailer.sendUnsubscribeAck(subscriber),
    ).resolves.toBeUndefined();
    expect(envoiSmtpSimule).not.toHaveBeenCalled();
  });
});
