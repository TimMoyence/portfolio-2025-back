import { createHash } from 'node:crypto';
import type { ArticleIngestEnvelope } from '../domain/article-contract';

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
      content_sha256: createHash('sha256')
        .update(contentMarkdown)
        .digest('hex'),
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
