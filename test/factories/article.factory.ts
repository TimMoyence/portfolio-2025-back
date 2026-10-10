import type { ArticleBroadcastRecord } from '../../src/modules/articles/application/article-broadcast.repository';
import type {
  ArticleRecord,
  ArticleWrite,
} from '../../src/modules/articles/application/articles.repository';

export function buildArticleBroadcastRecord(
  overrides: Partial<ArticleBroadcastRecord> = {},
): ArticleBroadcastRecord {
  return {
    id: 'broadcast-1',
    articleRecordId: 'record-1',
    status: 'scheduled',
    sendAfter: new Date('2026-09-23T07:44:00.000Z'),
    lockedUntil: null,
    sentCount: 0,
    failedCount: 0,
    completedAt: null,
    ...overrides,
  };
}

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
