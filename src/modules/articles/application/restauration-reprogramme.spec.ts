import { figerLHeureAChaqueTest } from '../../../../test/helpers/temps/horloge';
import {
  ArticlesEnMemoire,
  buildArticleRecord,
} from '../../../../test/factories/diffusion/article.factory';
import { createMockDiffusionsRepository } from '../../../../test/factories/diffusion/diffusion.factory';
import { ArticleModerationService } from './article-moderation.service';

const MAINTENANT = new Date('2026-11-12T10:00:00.000Z');
const DANS_QUATRE_VINGT_DIX_MINUTES = new Date('2026-11-12T11:30:00.000Z');

describe('ArticleModerationService · restauration', () => {
  figerLHeureAChaqueTest(MAINTENANT);

  function setup() {
    const store = new ArticlesEnMemoire();
    store.articles.set('record-1', buildArticleRecord({ status: 'withdrawn' }));
    const diffusions = createMockDiffusionsRepository();
    return {
      store,
      diffusions,
      moderation: new ArticleModerationService(store, diffusions),
    };
  }

  it('NL-15 · reprogramme la diffusion inachevee d un article restaure 90 min apres sa restauration', async () => {
    const { diffusions, moderation } = setup();

    await moderation.restore('morning-brief-2026-09-23-fr');

    expect(diffusions.reprogrammer.mock.calls).toEqual([
      ['record-1', DANS_QUATRE_VINGT_DIX_MINUTES],
    ]);
  });

  it('NL-15 · ne repousse pas la diffusion d un article restaure sans avoir ete retire', async () => {
    const { store, diffusions, moderation } = setup();
    store.articles.set('record-1', buildArticleRecord({ status: 'published' }));

    await moderation.restore('morning-brief-2026-09-23-fr');

    expect(diffusions.reprogrammer.mock.calls).toEqual([]);
  });

  it('NL-15 · ne reprogramme rien au retrait, qui suspend seul les envois restants', async () => {
    const { diffusions, moderation } = setup();

    await moderation.withdraw('morning-brief-2026-09-23-fr');

    expect(diffusions.reprogrammer.mock.calls).toEqual([]);
  });
});
