import { figerLHeureAChaqueTest } from '../../../../test/helpers/temps/horloge';
import { createMockArticlesRepositorySansLivraison } from '../../../../test/factories/diffusion/article.factory';
import { validArticleIngestEnvelope } from '../../../../test/factories/diffusion/article-ingest.factory';
import { ArticlesService } from './articles.service';

const RECU_LE = new Date('2026-09-09T07:00:00.000Z');
const QUATRE_VINGT_DIX_MINUTES_PLUS_TARD = new Date('2026-09-09T08:30:00.000Z');

describe('ArticlesService · diffusion à la réception', () => {
  figerLHeureAChaqueTest(RECU_LE);

  async function recevoir(publieLe: string) {
    const depot = createMockArticlesRepositorySansLivraison();
    await new ArticlesService(depot).ingest(
      {
        ...validArticleIngestEnvelope,
        article: {
          ...validArticleIngestEnvelope.article,
          published_at: publieLe,
        },
      },
      'idempotence-1',
      'nonce-1',
    );
    return depot.saveArticleAndDelivery.mock.calls.map(
      ([, , diffusion]) => diffusion,
    );
  }

  it('NL-04 · programme l envoi d un article recu 90 min apres sa reception', async () => {
    expect(await recevoir('2026-09-09T06:00:00.000Z')).toEqual([
      { envoiApres: QUATRE_VINGT_DIX_MINUTES_PLUS_TARD },
    ]);
  });

  it('NL-12 · programme encore un article publie 24 h pile avant sa reception', async () => {
    expect(await recevoir('2026-09-08T07:00:00.000Z')).toEqual([
      { envoiApres: QUATRE_VINGT_DIX_MINUTES_PLUS_TARD },
    ]);
  });

  it('NL-12 · ne programme aucun envoi d un article recu plus de 24 h apres sa publication', async () => {
    expect(await recevoir('2026-09-08T06:59:59.999Z')).toEqual([null]);
  });
});
