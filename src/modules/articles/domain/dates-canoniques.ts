import { z } from 'zod';
import type { ArticleIngere } from './article-contract';

type DatesDeLArticle = Pick<ArticleIngere, 'sections' | 'sources'>;
type Section = ArticleIngere['sections'][number];
type ItemDeSection = Section['items'][number];
type SourceDArticle = ArticleIngere['sources'][number];

const DATE_SERVIE = z.iso.datetime();

function dateCanonique(recue: string | null | undefined): string | null {
  if (recue === null || recue === undefined) return null;
  const instant = Date.parse(recue);
  if (Number.isNaN(instant)) return null;
  const servie = new Date(instant).toISOString();
  return DATE_SERVIE.safeParse(servie).success ? servie : null;
}

function itemCanonique(item: ItemDeSection): ItemDeSection {
  const { published_at, retrieved_at, ...reste } = item;
  const publie = dateCanonique(published_at);
  const recupere = dateCanonique(retrieved_at);
  return {
    ...reste,
    ...(publie === null ? {} : { published_at: publie }),
    ...(recupere === null ? {} : { retrieved_at: recupere }),
  };
}

function sourceCanonique(source: SourceDArticle): SourceDArticle {
  return {
    ...source,
    published_at: dateCanonique(source.published_at),
    retrieved_at: dateCanonique(source.retrieved_at),
  };
}

export function avecDatesCanoniques<T extends DatesDeLArticle>(article: T): T {
  return {
    ...article,
    sections: article.sections.map((section) => ({
      ...section,
      items: section.items.map(itemCanonique),
    })),
    sources: article.sources.map(sourceCanonique),
  };
}
