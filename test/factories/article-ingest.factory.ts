import { empreinteSha256 } from '../../src/common/domain/crypto/empreintes';
import type {
  ArticleIngere,
  ArticleIngestEnvelope,
} from '../../src/modules/articles/domain/article-contract';

type ItemDeSection = ArticleIngere['sections'][number]['items'][number];
type SourceDArticle = ArticleIngere['sources'][number];

const contentMarkdown = '# Une veille IA utile\n\n' + 'x'.repeat(120);

export const validArticleIngestEnvelope: ArticleIngestEnvelope = {
  schema_version: '1.0',
  delivery_id: 'mb-2026-09-09-fr',
  producer: { name: 'morning-brief', version: '0.1.0', device: 'pi-zero' },
  sent_at: '2026-09-09T06:15:04.000Z',
  article: {
    article_id: 'morning-brief-2026-09-09-fr',
    slug: 'morning-brief-2026-09-09',
    locale: 'fr',
    status: 'published',
    title: 'Une veille IA utile',
    excerpt:
      'Une édition sourcée qui transforme les signaux du jour en décisions concrètes.',
    content_markdown: contentMarkdown,
    reading_time_minutes: 1,
    tags: ['morning-brief', 'veille-ia'],
    published_at: '2026-09-09T06:00:00.000Z',
    updated_at: '2026-09-09T06:00:00.000Z',
    sections: [
      {
        id: 'essential',
        kind: 'essential',
        title: "L'essentiel",
        intro: 'Les faits qui méritent votre attention.',
        body: 'Une veille IA utile pour décider quoi tester.',
        items: [],
      },
    ],
    sources: [
      {
        name: 'Source',
        url: 'https://example.com/source',
        published_at: null,
        retrieved_at: null,
      },
    ],
    provenance: {
      run_id: 'morning-brief-2026-09-09-fr',
      edition_date: '2026-09-09',
      item_count: 1,
      source_count: 1,
      content_sha256: empreinteSha256(contentMarkdown),
    },
    seo: {
      description:
        'Une édition sourcée et actionnable pour comprendre les évolutions IA, relier les signaux aux usages et décider quoi tester concrètement dans son activité.',
      canonical_path: '/articles/morning-brief-2026-09-09',
      keywords: ['morning-brief', 'veille-ia'],
      image_url: null,
      image_alt: null,
    },
  },
};

export function buildSectionsEtSourcesDatees(dates: {
  item: Pick<ItemDeSection, 'published_at' | 'retrieved_at'>;
  source: Pick<SourceDArticle, 'published_at' | 'retrieved_at'>;
}): Pick<ArticleIngere, 'sections' | 'sources'> {
  const [section] = validArticleIngestEnvelope.article.sections;
  const [source] = validArticleIngestEnvelope.article.sources;
  const item = (rang: number): ItemDeSection => ({
    entity: 'OpenAI',
    text: `Un fait daté numéro ${rang}, assez long pour tenir le contrat.`,
    source: 'Source',
    url: `https://example.com/fait-${rang}`,
    ...dates.item,
  });
  return {
    sections: [
      { ...section, items: [item(1), item(2)] },
      { ...section, id: 'radar', kind: 'radar', items: [item(3), item(4)] },
    ],
    sources: [
      { ...source, ...dates.source },
      { ...source, url: 'https://example.com/autre-source', ...dates.source },
    ],
  };
}

export function itemsDe(
  article: Pick<ArticleIngere, 'sections'>,
): ItemDeSection[] {
  return article.sections.flatMap((section) => section.items);
}
