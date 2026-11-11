import {
  ACCEPTEE_DES_DEUX_COTES,
  recitDuMatin,
  REFUSEE_DES_DEUX_COTES,
  verdicts,
} from '../../../../../test/helpers/depot/schema-d-ingestion-partage';

type Enveloppe = {
  article: {
    title: string;
    excerpt: string;
    seo: { description: string };
    sections: { kind: string; titre?: string }[];
  };
};

const aLaBorne = (borne: number) => '🚀' + 'a'.repeat(borne - 1);

describe('MB-24 · une longueur se compte en caractères, comme le schéma partagé', () => {
  it.each([
    [
      'la description SEO',
      160,
      (e: Enveloppe, v: string) => (e.article.seo.description = v),
    ],
    ['le chapô', 280, (e: Enveloppe, v: string) => (e.article.excerpt = v)],
    ['le titre', 180, (e: Enveloppe, v: string) => (e.article.title = v)],
    [
      'le titre du sujet',
      160,
      (e: Enveloppe, v: string) => (e.article.sections[1].titre = v),
    ],
  ])(
    'MB-24 · accepte %s à sa borne de %i caractères avec un emoji, et la refuse un caractère au-delà',
    (_champ, borne, poser) => {
      const juste = recitDuMatin<Enveloppe>((e) => poser(e, aLaBorne(borne)));
      const deTrop = recitDuMatin<Enveloppe>((e) =>
        poser(e, aLaBorne(borne + 1)),
      );
      expect(verdicts(juste)).toEqual(ACCEPTEE_DES_DEUX_COTES);
      expect(verdicts(deTrop)).toEqual(REFUSEE_DES_DEUX_COTES);
    },
  );
});
