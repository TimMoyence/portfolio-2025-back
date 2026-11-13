import { buildCoursDuContenu } from '../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import { texteDeLImage } from '../../../../../test/helpers/formations/cours/feuille-de-cours';
import { estUnEcranDImage } from '../../../../../test/helpers/formations/cours/recit-en-images';
import {
  CORRESPONDANCE,
  solutionsDansLesTextes,
} from '../../../../../test/helpers/formations/cours/relecture-de-cours';
import { COURS_B1_03 } from './b1/b1-03/b1-03.cours';
import { COURS_B1_04 } from './b1/b1-04/b1-04.cours';
import { COURS_B1_05 } from './b1/b1-05/b1-05.cours';
import { COURS_B2_07 } from './b2/b2-07/b2-07.cours';
import { COURS_B2_08 } from './b2/b2-08/b2-08.cours';
import { COURS_B2_09 } from './b2/b2-09/b2-09.cours';

const CONSIGNE_DE_L_ECRAN =
  '• 1 min : faire décrire l’image, puis faire dire à quoi correspond chaque élément dans le cours.\n• ';
const REGLE_DE_LA_NOTION = /^En maths, on écrit : \S/u;
const PREFIXE_RETIRE = /^(?:Comme à cinq ans|Pour comprendre) : /u;
const TITRE_EN_MAJUSCULE = /^(?:\p{Lu}|ln\b)/u;

const COURS = [
  [
    'B2-07',
    COURS_B2_07,
    14,
    /dérivée|tangente|exponentielle|logarithme|fonction|suite|boucle|algorithme|extremum|maximum|minimum|variation/iu,
  ],
  [
    'B2-08',
    COURS_B2_08,
    8,
    /dérivée|tangente|exponentielle|logarithme|fonction|produit|quotient|composée|coût|marginal|solution|dichotomie|balayage|extremum|maximum|minimum|variation/iu,
  ],
  [
    'B2-09',
    COURS_B2_09,
    8,
    /probabilit|événement|conditionnel|arbre|branche|tableau|intersection|réunion|contraire|indépendan|incompatible|partition|\d/iu,
  ],
  [
    'B1-03',
    COURS_B1_03,
    6,
    /moyenne|médiane|quartile|écart|tableau|champ|classe|série|valeur|effectif|taux|\d/iu,
  ],
  [
    'B1-04',
    COURS_B1_04,
    6,
    /nuage|point moyen|droite|moindres|corrélation|coefficient|ajustement|causalité|interpol|extrapol|seuil|série|\d/iu,
  ],
  [
    'B1-05',
    COURS_B1_05,
    6,
    /connecteur|vérité|implication|équivalen|négation|prédicat|quantificateur|pour tout|il existe|morgan|proposition|\d/iu,
  ],
] as const;

interface EcranDImage {
  readonly id: string;
  readonly titre: string;
  readonly notes: string;
  readonly paragraphes: string[];
  readonly correspondances: string[];
}

function ecransDImage(contenu: (typeof COURS)[number][1]): EcranDImage[] {
  return contenu.ecrans
    .filter(({ screenId }) => estUnEcranDImage(screenId))
    .map(({ screenId, titre, notes }) => {
      return {
        id: screenId,
        titre: String(titre),
        notes: String(notes),
        ...texteDeLImage(contenu, screenId),
      };
    });
}

function textesEcrits({ titre, paragraphes, correspondances }: EcranDImage) {
  return [titre, ...paragraphes, ...correspondances];
}

describe.each(COURS)(
  'Les écrans d’image du %s : une image, puis le cours en face',
  (_cours, contenu, nombre, motsDuCours) => {
    const ecrans = ecransDImage(contenu);

    it('IMG-1 · titre chaque écran sans préfixe, avec une majuscule sauf devant une notation', () => {
      expect(ecrans).toHaveLength(nombre);
      expect(
        ecrans
          .filter(
            ({ titre }) =>
              PREFIXE_RETIRE.test(titre) || !TITRE_EN_MAJUSCULE.test(titre),
          )
          .map(({ id, titre }) => `${id} : ${titre}`),
      ).toEqual([]);
    });

    it('IMG-2 · sert la phrase de l’image, la règle de la notion, puis 3 ou 4 correspondances image → cours', () => {
      expect(
        ecrans
          .filter(
            ({ paragraphes, correspondances }) =>
              paragraphes.length !== 2 ||
              !REGLE_DE_LA_NOTION.test(paragraphes[1] ?? '') ||
              correspondances.length < 3 ||
              correspondances.length > 4 ||
              !correspondances.every((ligne) => CORRESPONDANCE.test(ligne)),
          )
          .map(({ id }) => id),
      ).toEqual([]);
    });

    it('IMG-2 · décrit l’image par une phrase sans mot du cours', () => {
      expect(
        ecrans
          .filter(({ paragraphes }) => motsDuCours.test(paragraphes[0] ?? ''))
          .map(({ id, paragraphes }) => `${id} : ${paragraphes[0]}`),
      ).toEqual([]);
    });

    it('IMG-3 · donne au formateur la consigne de faire dire chaque correspondance, puis sa relance', () => {
      expect(
        ecrans
          .filter(({ notes }) => !notes.startsWith(CONSIGNE_DE_L_ECRAN))
          .map(({ id }) => id),
      ).toEqual([]);
    });

    it('IMG-2 · n’écrit « enfant » ni dans le titre, ni dans le texte, ni dans les notes', () => {
      expect(
        ecrans
          .filter((ecran) =>
            [...textesEcrits(ecran), ecran.notes].some((texte) =>
              /enfant/iu.test(texte),
            ),
          )
          .map(({ id }) => id),
      ).toEqual([]);
    });

    it('IMG-6 · n’écrit dans aucun de ces textes la solution d’une question numérique du cours', () => {
      const cours = buildCoursDuContenu(contenu);

      expect(
        ecrans.flatMap((ecran) =>
          solutionsDansLesTextes(cours, textesEcrits(ecran)).map(
            (solution) => `${solution} dans ${ecran.id}`,
          ),
        ),
      ).toEqual([]);
    });
  },
);

describe('Le B2-07 sans « comme à cinq ans »', () => {
  it('IMG-1 · ne sert « cinq ans » dans aucun texte du cours', () => {
    expect(JSON.stringify(COURS_B2_07)).not.toMatch(/cinq ans/iu);
  });
});
