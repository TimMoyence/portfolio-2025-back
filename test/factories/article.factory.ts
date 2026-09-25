import type {
  ArticleRecord,
  ArticleWrite,
} from '../../src/modules/articles/application/articles.repository';

export function buildArticleWrite(
  overrides: Partial<ArticleWrite> = {},
): ArticleWrite {
  return {
    articleId: 'morning-brief-2026-09-23-fr',
    slug: 'morning-brief-2026-09-23',
    locale: 'fr',
    status: 'published',
    title: 'Veille IA du 23 septembre',
    excerpt: 'Les faits IA du jour, sourcés.',
    contentMarkdown: '# Veille',
    readingTimeMinutes: 6,
    tags: [],
    sections: [],
    sources: [],
    provenance: {},
    seo: {},
    publishedAt: new Date('2026-09-23T04:15:00.000Z'),
    updatedAt: new Date('2026-09-23T04:15:00.000Z'),
    contentSha256: 'a'.repeat(64),
    ...overrides,
  };
}

export function buildArticleRecord(
  overrides: Partial<ArticleRecord> = {},
): ArticleRecord {
  return { id: 'record-1', ...buildArticleWrite(), ...overrides };
}
