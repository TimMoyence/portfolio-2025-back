import type { ArticleRecord } from '../application/articles.repository';

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
const mockCreateTransporter = jest.fn(() => ({ sendMail: mockSendMail }));

jest.mock('../../../common/infrastructure/mail/smtp-transporter.util', () => ({
  createOptionalSmtpTransporter: () => mockCreateTransporter(),
}));

import { ArticleBroadcastMailerService } from './article-broadcast.mailer';

const recipient = {
  subscriberId: 'subscriber-1',
  email: 'lecteur@example.com',
  firstName: 'Anne & <Marie>',
  unsubscribeToken: 'jeton-de-desabonnement',
};

function article(overrides: Partial<ArticleRecord> = {}): ArticleRecord {
  return {
    id: 'record-1',
    articleId: 'morning-brief-2026-09-23-fr',
    slug: 'morning-brief-2026-09-23',
    locale: 'fr',
    status: 'published',
    title: 'Veille IA <du> 23 septembre',
    excerpt: 'Les faits IA du jour, sourcés.',
    contentMarkdown: '# Veille',
    readingTimeMinutes: 6,
    tags: [],
    sections: [
      {
        id: 'essentiel',
        kind: 'essential',
        title: 'L essentiel',
        intro: '',
        body: '',
        items: [
          {
            entity: 'OpenAI <script>',
            text: 'Un fait vérifiable et sourcé sur un nouveau modèle.',
            source: 'Blog',
            url: 'https://example.com/fait',
          },
          {
            entity: 'Piège',
            text: 'Un lien piégé ne doit jamais devenir cliquable.',
            source: 'Inconnu',
            url: 'javascript:alert(1)',
          },
        ],
      },
    ],
    sources: [],
    provenance: {},
    seo: {},
    publishedAt: new Date('2026-09-23T04:15:00.000Z'),
    updatedAt: new Date('2026-09-23T04:15:00.000Z'),
    contentSha256: 'a'.repeat(64),
    ...overrides,
  };
}

describe('ArticleBroadcastMailerService', () => {
  const env = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SMTP_FROM = "'Asili Design' <veille@asilidesign.fr>";
    process.env.SMTP_REPLY_TO = 'Tim <contact@asilidesign.fr>';
    delete process.env.FRONTEND_URL;
    delete process.env.API_PREFIX;
  });

  afterAll(() => {
    process.env = env;
  });

  it('se déclare inactif sans transport SMTP', () => {
    mockCreateTransporter.mockReturnValueOnce(
      null as unknown as { sendMail: jest.Mock },
    );

    expect(new ArticleBroadcastMailerService().isEnabled()).toBe(false);
  });

  it('envoie l édition avec les en-têtes de désabonnement en un clic', async () => {
    await new ArticleBroadcastMailerService().send(article(), recipient);

    const mail = mockSendMail.mock.calls[0][0];
    const unsubscribeUrl =
      'https://asilidesign.fr/api/v1/portfolio25/newsletter/unsubscribe?token=jeton-de-desabonnement';
    expect(mail).toMatchObject({
      from: "'Asili Design' <veille@asilidesign.fr>",
      to: 'lecteur@example.com',
      replyTo: 'Tim <contact@asilidesign.fr>',
      subject: 'Veille IA <du> 23 septembre',
      headers: {
        'List-Unsubscribe': `<mailto:contact@asilidesign.fr?subject=unsubscribe>, <${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'List-Id': 'Veille IA <veille-ia.asilidesign.fr>',
      },
    });
    expect(mail.text).toContain(
      'https://asilidesign.fr/fr/articles/morning-brief-2026-09-23',
    );
    expect(mail.text).toContain(unsubscribeUrl);
    expect(mail.text).toContain('Les faits IA du jour, sourcés.');
  });

  it('échappe le contenu et neutralise les liens non HTTP(S)', async () => {
    await new ArticleBroadcastMailerService().send(article(), recipient);

    const html: string = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain('Veille IA &lt;du&gt; 23 septembre');
    expect(html).toContain('OpenAI &lt;script&gt;');
    expect(html).toContain('Bonjour Anne &amp; &lt;Marie&gt;');
    expect(html).toContain('href="https://example.com/fait"');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('<script>');
  });

  it('ignore les sections mal formées sans échouer', async () => {
    await new ArticleBroadcastMailerService().send(
      article({
        sections: [null, { title: 42 }, { title: 'Radar', items: 'x' }],
      }),
      recipient,
    );

    const html: string = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain('Radar');
  });
});
