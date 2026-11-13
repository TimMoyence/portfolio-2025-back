import { Injectable } from '@nestjs/common';
import { lienAvecJeton } from '../../../common/domain/liens/lien-avec-jeton';
import { escapeHtml } from '../../../common/domain/texte/nettoyage/html-escape.util';
import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';
import { corpsAvecBouton } from '../../../common/infrastructure/mail/corps/corps-avec-bouton';
import { ExpediteurSmtp } from '../../../common/infrastructure/mail/expediteur-smtp';
import { pageDuSite, urlPubliqueDeLApi } from '../../../config/urls-publiques';
import { articlePageUrl } from '../application/article-settings';
import type { ArticleRecord } from '../application/articles.repository';
import type {
  DestinataireDeDiffusion,
  IMailerDesArticles,
} from '../application/diffusion/diffusions.repository';

const LIBELLES: Readonly<
  Record<
    SupportedLocale,
    { readonly lire: string; readonly desabonner: string }
  >
> = {
  fr: { lire: 'Lire l’article', desabonner: 'Me désabonner' },
  en: { lire: 'Read the article', desabonner: 'Unsubscribe' },
};

@Injectable()
export class MailerDesArticlesService
  extends ExpediteurSmtp
  implements IMailerDesArticles
{
  constructor() {
    super(MailerDesArticlesService.name, 'Article mailer');
  }

  envoyerLArticle(
    article: ArticleRecord,
    destinataire: DestinataireDeDiffusion,
  ): Promise<void> {
    const libelles = LIBELLES[destinataire.locale];
    const desabonnement = lienAvecJeton(
      pageDuSite(destinataire.locale, 'newsletter/unsubscribe'),
      destinataire.jetonDeDesabonnement,
    );
    return this.envoyer({
      to: destinataire.email,
      subject: article.title,
      desabonnementEnUnClic: lienAvecJeton(
        urlPubliqueDeLApi('newsletter/unsubscribe'),
        destinataire.jetonDeDesabonnement,
      ),
      ...corpsAvecBouton({
        titre: escapeHtml(article.title),
        paragraphes: [article.excerpt],
        bouton: libelles.lire,
        lien: articlePageUrl(destinataire.locale, article.slug),
        pied: `${libelles.desabonner} : ${desabonnement}`,
      }),
    });
  }
}
