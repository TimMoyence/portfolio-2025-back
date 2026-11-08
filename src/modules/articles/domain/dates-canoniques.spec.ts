import { z } from 'zod';
import { buildArticleRecord } from '../../../../test/factories/article.factory';
import {
  buildSectionsEtSourcesDatees,
  itemsDe,
} from '../../../../test/factories/article-ingest.factory';
import { avecDatesCanoniques } from './dates-canoniques';

const dateLueParLeSite = z.iso.datetime();
const LISIBLE = '2026-11-08T08:30:00+02:00';
const LISIBLE_SERVIE = '2026-11-08T06:30:00.000Z';

type Article = ReturnType<typeof buildSectionsEtSourcesDatees>;

const datesDeLItem = (item: ReturnType<typeof itemsDe>[number]) =>
  Object.fromEntries(
    Object.entries(item).filter(
      ([cle]) => cle === 'published_at' || cle === 'retrieved_at',
    ),
  );

const datesDeLaSource = ({
  published_at,
  retrieved_at,
}: Article['sources'][number]) => ({ published_at, retrieved_at });

const servir = (recu: { published_at: string; retrieved_at: string }) =>
  avecDatesCanoniques(
    buildSectionsEtSourcesDatees({ item: recu, source: recu }),
  );

describe('avecDatesCanoniques', () => {
  it.each([
    [
      '2026-11-08T06:15:00+00:00',
      '2026-11-08T06:15:00.000Z',
      '2026-11-08T08:30:00+02:00',
      '2026-11-08T06:30:00.000Z',
    ],
    [
      '2026-11-08T07:15:00+01:00',
      '2026-11-08T06:15:00.000Z',
      '2026-11-08T06:30:00Z',
      '2026-11-08T06:30:00.000Z',
    ],
    [
      '2026-11-07T23:15:00-07:00',
      '2026-11-08T06:15:00.000Z',
      '2026-11-08T06:30:00.25+00:00',
      '2026-11-08T06:30:00.250Z',
    ],
    [
      '2026-11-08T06:15:00.5Z',
      '2026-11-08T06:15:00.500Z',
      '2026-11-07T22:30:00-08:00',
      '2026-11-08T06:30:00.000Z',
    ],
  ])(
    'sert published_at %s en %s et retrieved_at %s en %s, sur chaque item de chaque section et sur chaque source',
    (publieRecu, publieServi, recupereRecu, recupereServi) => {
      const article = servir({
        published_at: publieRecu,
        retrieved_at: recupereRecu,
      });
      const servies = {
        published_at: publieServi,
        retrieved_at: recupereServi,
      };

      expect(itemsDe(article).map(datesDeLItem)).toStrictEqual(
        Array.from({ length: 4 }, () => servies),
      );
      expect(article.sources.map(datesDeLaSource)).toStrictEqual(
        Array.from({ length: 2 }, () => servies),
      );
      expect(
        [publieServi, recupereServi].filter(
          (date) => !dateLueParLeSite.safeParse(date).success,
        ),
      ).toEqual([]);
    },
  );

  it.each([
    [
      'published_at illisible',
      { published_at: 'pas une date', retrieved_at: LISIBLE },
      { retrieved_at: LISIBLE_SERVIE },
      { published_at: null, retrieved_at: LISIBLE_SERVIE },
    ],
    [
      'retrieved_at illisible',
      { published_at: LISIBLE, retrieved_at: 'pas une date' },
      { published_at: LISIBLE_SERVIE },
      { published_at: LISIBLE_SERVIE, retrieved_at: null },
    ],
    [
      'published_at hors de l an 9999',
      { published_at: '+010000-01-01T00:00:00Z', retrieved_at: LISIBLE },
      { retrieved_at: LISIBLE_SERVIE },
      { published_at: null, retrieved_at: LISIBLE_SERVIE },
    ],
    [
      'retrieved_at hors de l an 9999',
      { published_at: LISIBLE, retrieved_at: '+010000-01-01T00:00:00Z' },
      { published_at: LISIBLE_SERVIE },
      { published_at: LISIBLE_SERVIE, retrieved_at: null },
    ],
  ])(
    '%s : la date disparait de chaque item, vaut null sur chaque source, et l autre date reste servie',
    (_cas, recu, itemServi, sourceServie) => {
      const article = servir(recu);

      expect(itemsDe(article).map(datesDeLItem)).toStrictEqual(
        Array.from({ length: 4 }, () => itemServi),
      );
      expect(article.sources.map(datesDeLaSource)).toStrictEqual(
        Array.from({ length: 2 }, () => sourceServie),
      );
    },
  );

  it('laisse le reste de l article tel quel, dates absentes ou nulles comprises', () => {
    const recu = {
      ...buildArticleRecord(),
      ...buildSectionsEtSourcesDatees({
        item: {},
        source: { published_at: null, retrieved_at: null },
      }),
    };

    expect(avecDatesCanoniques(structuredClone(recu))).toEqual(recu);
  });
});
