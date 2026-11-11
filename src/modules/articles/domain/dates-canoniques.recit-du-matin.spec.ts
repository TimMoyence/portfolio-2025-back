import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE } from '../../../../test/helpers/depot/racine';
import type { ArticleIngere } from './article-contract';
import { avecDatesCanoniques } from './dates-canoniques';

function recit(
  publie_le: string | null,
): Pick<ArticleIngere, 'sections' | 'sources'> {
  const article = JSON.parse(
    readFileSync(
      join(RACINE, 'test/fixtures/articles/enveloppe-recit-du-matin.json'),
      'utf8',
    ),
  ).article as ArticleIngere;
  const texte = JSON.stringify({
    sections: article.sections,
    sources: article.sources,
  }).replace(
    /"publie_le":("[^"]*"|null)/g,
    `"publie_le":${JSON.stringify(publie_le)}`,
  );
  return JSON.parse(texte) as Pick<ArticleIngere, 'sections' | 'sources'>;
}

function datesServies(
  article: Pick<ArticleIngere, 'sections' | 'sources'>,
): unknown[] {
  return [
    ...JSON.stringify(article).matchAll(/"publie_le":("[^"]*"|null)/g),
  ].map(([, d]) => JSON.parse(d));
}

describe('MB-19 · dates servies du récit du matin', () => {
  it('MB-19 · chaque source du récit sert une date ISO canonique', () => {
    const dates = datesServies(
      avecDatesCanoniques(recit('2026-11-10T09:00:00+01:00')),
    );
    expect(dates.length).toBeGreaterThan(3);
    expect(new Set(dates)).toEqual(new Set(['2026-11-10T08:00:00.000Z']));
  });

  it('MB-19 · une date illisible est servie nulle plutôt que de casser la lecture', () => {
    expect(
      new Set(datesServies(avecDatesCanoniques(recit('pas une date')))),
    ).toEqual(new Set([null]));
  });
});
