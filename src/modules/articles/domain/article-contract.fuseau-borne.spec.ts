import {
  ACCEPTEE_DES_DEUX_COTES,
  recitDuMatin,
  REFUSEE_DES_DEUX_COTES,
  verdicts,
} from '../../../../test/helpers/depot/schema-d-ingestion-partage';

const publieeLe = (date: string) =>
  recitDuMatin<{ article: { published_at: string } }>(
    (e) => (e.article.published_at = date),
  );

describe('MB-24 · le fuseau d une date est borné, comme le schéma partagé', () => {
  it.each(['2026-11-11T06:00:00+25:00', '2026-11-11T06:00:00+01:99'])(
    'MB-24 · refuse le fuseau de %s',
    (date) => {
      expect(verdicts(publieeLe(date))).toEqual(REFUSEE_DES_DEUX_COTES);
    },
  );

  it('MB-24 · accepte un fuseau réel', () => {
    expect(verdicts(publieeLe('2026-11-11T06:00:00-09:30'))).toEqual(
      ACCEPTEE_DES_DEUX_COTES,
    );
  });
});
