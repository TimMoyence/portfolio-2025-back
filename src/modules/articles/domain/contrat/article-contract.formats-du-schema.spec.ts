import {
  ACCEPTEE_DES_DEUX_COTES,
  recitDuMatin,
  refuseeCommeParLeSchemaPartage,
  verdicts,
} from '../../../../../test/helpers/depot/schema-d-ingestion-partage';

type Enveloppe = {
  article: {
    published_at: string;
    sources: { url: string; publie_le: string | null }[];
  };
};

describe('MB-24 · dates et liens se lisent comme le schéma partagé', () => {
  refuseeCommeParLeSchemaPartage<Enveloppe>([
    [
      'une date sans heure',
      (e: Enveloppe) => (e.article.published_at = '2026-11-11'),
    ],
    [
      'une date sans fuseau',
      (e: Enveloppe) =>
        (e.article.sources[0].publie_le = '2026-11-11T06:00:00'),
    ],
    [
      'un lien au protocole en capitales',
      (e: Enveloppe) => (e.article.sources[0].url = 'HTTPS://a.test/x'),
    ],
    [
      'un lien qui contient une espace',
      (e: Enveloppe) => (e.article.sources[0].url = 'https://a.test/a b'),
    ],
  ]);

  it('MB-24 · accepte une date avec fuseau et un lien propre', () => {
    const juste = recitDuMatin<Enveloppe>((e) => {
      e.article.sources[0].publie_le = '2026-11-11T06:00:00+01:00';
      e.article.sources[0].url = 'https://a.test/x?y=1';
    });
    expect(verdicts(juste)).toEqual(ACCEPTEE_DES_DEUX_COTES);
  });
});
