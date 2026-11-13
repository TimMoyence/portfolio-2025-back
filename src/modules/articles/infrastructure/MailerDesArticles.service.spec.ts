import { buildArticleRecord } from '../../../../test/factories/diffusion/article.factory';
import { buildDestinataire } from '../../../../test/factories/diffusion/diffusion.factory';
import {
  attendreLeMailAvecSonLien,
  mailSimule,
  moduleSmtpSimule,
  viderLeSmtpSimuleAChaqueTest,
} from '../../../../test/factories/mailer.factory';
import { urlDuSite, urlPubliqueDeLApi } from '../../../config/urls-publiques';

jest.mock('../../../common/infrastructure/mail/smtp-transporter.util', () =>
  moduleSmtpSimule(),
);

import { MailerDesArticlesService } from './MailerDesArticles.service';

const JETON = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';

describe('MailerDesArticlesService', () => {
  viderLeSmtpSimuleAChaqueTest();

  it.each([
    ['en' as const, 'Read the article', 'Unsubscribe'],
    ['fr' as const, 'Lire l’article', 'Me désabonner'],
  ])(
    'NL-05 · envoie l article en %s avec son lien et le desabonnement de la page de cette langue',
    async (locale, lire, desabonner) => {
      const article = buildArticleRecord({ locale, slug: 'veille-ia' });

      await new MailerDesArticlesService().envoyerLArticle(
        article,
        buildDestinataire({ locale, jetonDeDesabonnement: JETON }),
      );

      const mail = attendreLeMailAvecSonLien({
        sujet: article.title,
        bouton: lire,
        lien: `${urlDuSite()}/${locale}/articles/veille-ia`,
      });
      expect(mail.to).toBe('jane@mail.com');
      expect(mail.html).toContain(desabonner);
      expect(mail.html).toContain(
        `${urlDuSite()}/${locale}/newsletter/unsubscribe?token=${JETON}`,
      );
    },
  );

  it('NL-14 · annonce le desabonnement en un clic RFC 8058 par ses en-tetes', async () => {
    await new MailerDesArticlesService().envoyerLArticle(
      buildArticleRecord({ locale: 'en' }),
      buildDestinataire({ jetonDeDesabonnement: JETON }),
    );

    expect(mailSimule().headers).toEqual({
      'List-Unsubscribe': `<${urlPubliqueDeLApi('newsletter/unsubscribe')}?token=${JETON}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    });
  });
});
