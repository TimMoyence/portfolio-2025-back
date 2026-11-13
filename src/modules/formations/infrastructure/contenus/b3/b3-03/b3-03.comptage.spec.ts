import { TOLERANCE_NULLE } from '../../briques';
import {
  PIEGES_B3_04,
  QUESTIONS_CHIFFREES_B3_04,
  questionChiffreeB304,
  VALEURS_B3_04,
} from '../b3-04/b3-04.donnees';
import {
  PIEGES_B3_03,
  QUESTIONS_CHIFFREES_B3_03,
  questionChiffreeB303,
  questionDeComptage,
  VALEURS_B3_03,
} from './b3-03.donnees';

const enPieges = (pieges: Readonly<Partial<Record<string, number>>>) =>
  Object.entries(pieges).map(([confusion, valeur]) => ({ valeur, confusion }));

const servies = <Id extends string>(
  questions: readonly Id[],
  question: (
    id: Id,
    concept: 'texte-brut',
    enonce: string,
    unite: string,
  ) => object,
  valeurs: Readonly<Record<Id, number>>,
  pieges: Readonly<Record<Id, Readonly<Partial<Record<string, number>>>>>,
) =>
  questions.map((id) => ({
    id,
    servie: question(id, 'texte-brut', 'Combien ?', 'unités'),
    valeur: valeurs[id],
    pieges: pieges[id],
  }));

describe('questionDeComptage', () => {
  it('sert le compte à tolérance nulle, sa forme publiée et un piège par confusion', () => {
    expect(
      questionDeComptage('q', 'export-pdf', 'Combien de pages ?', 'pages', {
        valeur: 12,
        pieges: { 'numero-de-page-tape': 13, 'recherche-mal-saisie': 0 },
      }),
    ).toMatchObject({
      type: 'numeric',
      noteCompte: true,
      enonce: 'Combien de pages ? Saisissez le nombre seul.',
      unite: 'pages',
      solution: 12,
      tolerance: TOLERANCE_NULLE,
      formePubliee: '12 pages',
      pieges: [
        { valeur: 13, confusion: 'numero-de-page-tape' },
        { valeur: 0, confusion: 'recherche-mal-saisie' },
      ],
    });
  });

  it('refuse un comptage sans piège : une question chiffrée nomme la confusion qu’elle attrape', () => {
    expect(() =>
      questionDeComptage('q', 'export-pdf', 'Combien ?', 'pages', {
        valeur: 12,
        pieges: {},
      }),
    ).toThrow('Comptage sans piège : q');
  });

  it.each([
    ...servies(
      QUESTIONS_CHIFFREES_B3_03,
      questionChiffreeB303,
      VALEURS_B3_03,
      PIEGES_B3_03,
    ),
    ...servies(
      QUESTIONS_CHIFFREES_B3_04,
      questionChiffreeB304,
      VALEURS_B3_04,
      PIEGES_B3_04,
    ),
  ])(
    'sert pour $id le compte et les pièges de son cours',
    ({ id, servie, valeur, pieges }) => {
      expect(servie).toMatchObject({
        id,
        solution: valeur,
        pieges: enPieges(pieges),
      });
    },
  );
});
