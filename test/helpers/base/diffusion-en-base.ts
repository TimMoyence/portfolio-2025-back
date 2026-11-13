import type { DataSource } from 'typeorm';
import type { SupportedLocale } from '../../../src/common/domain/value-objects/LocaleCode';
import { TypeOrmArticlesRepository } from '../../../src/modules/articles/infrastructure/articles.repository';
import { TypeOrmDiffusionsRepository } from '../../../src/modules/articles/infrastructure/diffusions.repository.typeorm';
import { ArticleBroadcastRecipientEntity } from '../../../src/modules/articles/infrastructure/entities/article-broadcast-recipient.entity';
import { ArticleBroadcastEntity } from '../../../src/modules/articles/infrastructure/entities/article-broadcast.entity';
import { ArticleDeliveryEntity } from '../../../src/modules/articles/infrastructure/entities/article-delivery.entity';
import { ArticleEntity } from '../../../src/modules/articles/infrastructure/entities/article.entity';
import {
  buildArticleDeliveryWrite,
  buildArticleWrite,
} from '../../factories/diffusion/article.factory';
import { buildAbonne } from '../../factories/diffusion/newsletter.factory';
import {
  baseMigreeDeLaSuite,
  TOUTES_LES_MIGRATIONS,
} from './db-integration-datasource';
import { depotDesAbonnes, ENTITES_DE_LA_NEWSLETTER } from './depot-des-abonnes';

export const ENVOI_PREVU = new Date('2026-09-23T05:45:00.000Z');

const ABONNES = [
  ['jane@mail.com', '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b'],
  ['john@mail.com', '7f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b'],
] as const;

export function suiteDeLaDiffusion() {
  const base = baseMigreeDeLaSuite(
    [
      ArticleEntity,
      ArticleDeliveryEntity,
      ArticleBroadcastEntity,
      ArticleBroadcastRecipientEntity,
      ...ENTITES_DE_LA_NEWSLETTER,
    ],
    [TOUTES_LES_MIGRATIONS],
  );
  return {
    base,
    diffusions: () => new TypeOrmDiffusionsRepository(base()),
    abonnes: () => depotDesAbonnes(base()),
  };
}

export async function articleProgramme(
  base: DataSource,
  locale: SupportedLocale,
): Promise<string> {
  await base.query(
    'TRUNCATE article_broadcast_recipients, article_broadcasts, article_deliveries, articles, newsletter_subscribers CASCADE',
  );
  await new TypeOrmArticlesRepository(
    base.getRepository(ArticleEntity),
    base.getRepository(ArticleDeliveryEntity),
    base,
  ).saveArticleAndDelivery(
    buildArticleWrite({ locale }),
    buildArticleDeliveryWrite({ deliveryId: `mb-2026-09-23-${locale}` }),
    { envoiApres: ENVOI_PREVU },
  );
  const [{ id }]: { id: string }[] = await base.query(
    'SELECT "id" FROM "articles"',
  );
  return id;
}

export interface DiffusionReservee {
  readonly id: string;
  readonly jane: string;
  readonly john: string;
}

export async function janeEtJohnReserves(
  base: DataSource,
): Promise<DiffusionReservee> {
  await articleProgramme(base, 'en');
  for (const [email, jeton] of ABONNES) {
    await depotDesAbonnes(base).creer(
      buildAbonne({
        email,
        boite: email,
        locale: 'en',
        status: 'confirmed',
        jetonDeDesabonnement: jeton,
      }),
    );
  }
  const diffusions = new TypeOrmDiffusionsRepository(base);
  const id = (await diffusions.prendreLaProchaineDue(ENVOI_PREVU))?.id ?? '';
  const [jane, john] = (
    await diffusions.destinatairesEnAttente(id, 'en', 50)
  ).map(({ abonneId }) => abonneId);
  for (const abonneId of [jane, john]) {
    await diffusions.reserver(id, abonneId);
  }
  return { id, jane, john };
}
