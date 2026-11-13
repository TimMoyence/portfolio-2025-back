import { questionChiffreeDe } from './b3-03.donnees';

const question = questionChiffreeDe(
  { lignes: 31, pages: 5 },
  {
    lignes: { 'recherche-mal-saisie': 62 },
    pages: { 'numero-de-page-tape': 4 },
  },
);

describe('questionChiffreeDe', () => {
  it.each([
    ['lignes', 31, 62, 'recherche-mal-saisie'],
    ['pages', 5, 4, 'numero-de-page-tape'],
  ] as const)(
    'sert pour %s le compte et le piège de sa ligne dans les deux tables',
    (id, solution, valeur, confusion) => {
      expect(question(id, 'mise-en-page', 'Combien ?', id)).toMatchObject({
        id,
        solution,
        formePubliee: `${solution} ${id}`,
        pieges: [{ valeur, confusion }],
      });
    },
  );
});
