import { schemasDeLArticleServi } from '../../../../../test/helpers/http/schemas-de-l-article-servi';
import {
  ACCEPTEE_DES_DEUX_COTES,
  recitDuMatin,
  refuseeCommeParLeSchemaPartage,
  verdicts,
} from '../../../../../test/helpers/depot/schema-d-ingestion-partage';

type Barre = Record<string, unknown>;
type Enveloppe = {
  article: {
    sections: {
      kind: string;
      graphique?: { barres: Barre[] };
      traduite_de?: string | null;
    }[];
  };
};

const barres = (e: Enveloppe) => e.article.sections[1].graphique?.barres ?? [];
const citation = (e: Enveloppe) =>
  e.article.sections.find((section) => section.kind === 'citation');

describe('MB-10 · MB-09 · largeur des barres et langue traduite, comme le schéma partagé', () => {
  it('MB-10 · accepte le récit du Pi, dont chaque barre porte sa largeur', () => {
    expect(barres(recitDuMatin<Enveloppe>()).map((b) => b.largeur)).toEqual([
      20, 60, 100,
    ]);
    expect(verdicts(recitDuMatin())).toEqual(ACCEPTEE_DES_DEUX_COTES);
  });

  refuseeCommeParLeSchemaPartage<Enveloppe>([
    ['une barre sans largeur', (e) => delete barres(e)[0].largeur],
    ['une largeur au-delà de 100', (e) => (barres(e)[0].largeur = 101)],
    ['une largeur décimale', (e) => (barres(e)[0].largeur = 20.5)],
    [
      'une langue traduite hors du vocabulaire',
      (e) => {
        const bloc = citation(e);
        if (bloc) bloc.traduite_de = 'anglais';
      },
    ],
  ]);

  describe('MB-19 · l API sert la largeur et la langue fermée', () => {
    const schemas = schemasDeLArticleServi();

    it('MB-10 · la barre servie porte une largeur entière', () => {
      expect(schemas().BarreDuRecitDto?.properties?.largeur?.type).toBe(
        'integer',
      );
    });

    it('MB-09 · la langue servie est une liste fermée', () => {
      expect(schemas().CitationDto?.properties?.traduite_de?.enum).toEqual([
        "l'anglais",
        "l'allemand",
        "l'espagnol",
        "l'italien",
        null,
      ]);
    });
  });
});
