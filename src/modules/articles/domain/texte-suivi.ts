import type { ArticleIngere } from './article-contract';

type SourceDAvant = {
  name: string;
  url: string;
  published_at: string | null;
};

export type ArticleDAvantLaRefonte = Omit<
  ArticleIngere,
  'sections' | 'sources' | 'provenance'
> & {
  sections: unknown[];
  sources: SourceDAvant[];
  provenance: { run_id: string; edition_date: string; content_sha256: string };
};

export type ArticleStocke = Omit<ArticleIngere, 'sections'> & {
  sections: ArticleIngere['sections'] | [];
};

export function enTexteSuivi(article: ArticleDAvantLaRefonte): ArticleStocke {
  const { run_id, edition_date, content_sha256 } = article.provenance;
  return {
    ...article,
    sections: [],
    sources: article.sources.map(({ name, url, published_at }) => ({
      nom: name,
      url,
      publie_le: published_at,
    })),
    provenance: { run_id, edition_date, content_sha256 },
  };
}
