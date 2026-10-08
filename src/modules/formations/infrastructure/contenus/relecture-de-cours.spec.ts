import {
  buildCoursAvecExplicationAllongee,
  buildCoursDuContenu,
} from '../../../../../test/factories/contenus-de-cours.factory';
import {
  piegesDesQuestionsSuivantesDevoilesParLesExplications,
  piegesPartagesDevoilesParLesExplications,
  valeursAuCatalogue,
  valeursDevoileesAvantLeurEcran,
  valeursDevoileesParLesExplications,
} from '../../../../../test/helpers/relecture-de-cours';
import { COURS_B2_05 } from './b2-05.cours';
import { COURS_B2_06 } from './b2-06.cours';
import { COURS_B3_01 } from './b3-01.cours';
import { PIEGES_B3_01, VALEURS_B3_01 } from './b3-01.donnees';

const COURS = buildCoursDuContenu(COURS_B3_01);
const VALEURS: Readonly<Record<string, number | string>> = Object.fromEntries(
  Object.entries(VALEURS_B3_01),
);

const allonger = (reference: string, ajout: string) =>
  buildCoursAvecExplicationAllongee(COURS, reference, ajout);

describe('Gardes de relecture, éprouvées par mutation du B3-01', () => {
  it('ne signalent rien sur le cours publié', () => {
    expect(valeursDevoileesParLesExplications(COURS, VALEURS)).toEqual([]);
    expect(
      piegesDesQuestionsSuivantesDevoilesParLesExplications(
        COURS,
        PIEGES_B3_01,
      ),
    ).toEqual([]);
    expect(
      piegesPartagesDevoilesParLesExplications(COURS, PIEGES_B3_01),
    ).toEqual([]);
    expect(valeursDevoileesAvantLeurEcran(COURS)).toEqual([]);
  });

  it.each([
    [
      'b3-01-a3-agences-sous-objectif',
      'Rennes atteint 79,0 %.',
      '79 de b3-01-a3-atteinte-rennes',
    ],
    [
      'b3-01-a2-delai-strasbourg',
      'Le taux de marque vaut 32,0 %.',
      '32 de b3-01-a2-taux-marge',
    ],
    [
      'b3-01-a2-ca-ouest',
      'Le contrat donnerait 99 retards.',
      '99 de b3-01-a2-retards dans B3-01-A2-04-ATELIER-RECHERCHE',
    ],
  ])(
    'valeursDevoileesParLesExplications · voit sous %s une valeur suivante, de l’écran ou d’un écran suivant : « %s »',
    (reference, ajout, alerte) => {
      expect(
        valeursDevoileesParLesExplications(
          allonger(reference, ajout),
          VALEURS,
        ).join(' | '),
      ).toContain(alerte);
    },
  );

  it.each([
    [
      'b3-01-a3-agences-sous-objectif',
      'Rapporté à tout l’objectif annuel, Rennes tomberait à 33,8 %.',
      '(objectif-annuel-pour-cumul) de b3-01-a3-atteinte-rennes',
    ],
    [
      'b3-01-a2-delai-strasbourg',
      'Divisée par le coût d’achat, la marge donne 47,0 %.',
      '(marque-confondue-avec-marge) de b3-01-a2-taux-marge',
    ],
    [
      'b3-01-a3-evolution',
      'Toute la table, 2025 compris, donne 1 313 125 €.',
      '(periode-mal-delimitee) de b3-01-a3-ca-2026',
    ],
    [
      'b3-01-a3-agences-sous-objectif',
      'Prise sur toute la table, la somme donnerait 1 313 125 €.',
      '(periode-mal-delimitee) de b3-01-a3-ca-2026 dans B3-01-A3-05-ATELIER-GRAPHIQUES',
    ],
    [
      'b3-01-a2-ca-ouest',
      'En jours calendaires, on compterait 481 retards.',
      '(jours-calendaires-pour-ouvres) de b3-01-a2-retards dans B3-01-A2-04-ATELIER-RECHERCHE',
    ],
  ])(
    'piegesDesQuestionsSuivantesDevoilesParLesExplications · voit sous %s le piège d’une question suivante, de l’écran ou d’un écran suivant : « %s »',
    (reference, ajout, alerte) => {
      expect(
        piegesDesQuestionsSuivantesDevoilesParLesExplications(
          allonger(reference, ajout),
          PIEGES_B3_01,
        ).join(' | '),
      ).toContain(alerte);
    },
  );

  it.each(['Il reculerait de −23,4 %.', 'Il baisserait de 23,4 %.'])(
    'piegesDesQuestionsSuivantesDevoilesParLesExplications · lit un piège négatif, écrit avec le signe moins typographique ou sans signe : « %s »',
    (ajout) => {
      const pieges = {
        ...PIEGES_B3_01,
        'b3-01-a3-ca-2026': { 'periode-mal-delimitee': -23.4 },
      };

      expect(
        piegesDesQuestionsSuivantesDevoilesParLesExplications(COURS, pieges),
      ).toEqual([]);
      expect(
        piegesDesQuestionsSuivantesDevoilesParLesExplications(
          allonger('b3-01-a3-evolution', ajout),
          pieges,
        ).join(' | '),
      ).toContain('(periode-mal-delimitee) de b3-01-a3-ca-2026');
    },
  );

  it('valeursDevoileesParLesExplications · voit une valeur écrite sans espace des milliers, comme Excel l’affiche', () => {
    expect(
      valeursDevoileesParLesExplications(
        allonger(
          'b3-01-a2-ca-rennes-info',
          'La troisième cellule afficherait 77850.',
        ),
        VALEURS,
      ).join(' | '),
    ).toContain('77 850 de b3-01-a2-ca-ouest');
  });

  it('piegesPartagesDevoilesParLesExplications · voit la valeur-piège d’une confusion qu’une question suivante partage, même négative', () => {
    const negatifs = {
      ...PIEGES_B3_01,
      'b3-01-a2-ca-rennes-info': { 'periode-mal-delimitee': -27_862 },
    };

    expect(
      piegesPartagesDevoilesParLesExplications(
        allonger('b3-01-a2-ca-rennes-info', 'Sans borne de date : 27 862 €.'),
        PIEGES_B3_01,
      ).join(' | '),
    ).toContain('(periode-mal-delimitee) dans B3-01-A2-04-ATELIER-RECHERCHE');
    expect(
      piegesPartagesDevoilesParLesExplications(
        allonger('b3-01-a2-ca-rennes-info', 'Écart : −27 862 €.'),
        negatifs,
      ).join(' | '),
    ).toContain('(periode-mal-delimitee) dans B3-01-A2-04-ATELIER-RECHERCHE');
  });

  it.each([
    [
      'b3-01-a2-delai-strasbourg',
      'L’informatique pèse 27,2 % à Rennes.',
      'dans B3-01-A2-07-ATELIER-DELAIS-MARGE',
    ],
    [
      'b3-01-a3-agences-sous-objectif',
      'Le CA progresse de +8,6 %.',
      '8,6 de B3-01-A3-09-ATELIER-DASHBOARD dans B3-01-A3-05-ATELIER-GRAPHIQUES',
    ],
  ])(
    'valeursDevoileesAvantLeurEcran · voit sous %s une valeur décimale d’un écran suivant : « %s »',
    (reference, ajout, alerte) => {
      expect(
        valeursDevoileesAvantLeurEcran(allonger(reference, ajout)).join(' | '),
      ).toContain(alerte);
    },
  );

  it('valeursAuCatalogue · voit une valeur écrite au catalogue, sans la confondre avec une valeur plus longue', () => {
    expect(valeursAuCatalogue(COURS, [0.15, 0.1])).toEqual([
      '0,15 dans B3-01-A2-03-COURS-CHERCHER-AGREGER',
    ]);
  });
});

describe('Gardes de relecture sur les cours à feuilles exigeant une formule', () => {
  it.each([
    ['B2-05', COURS_B2_05],
    ['B2-06', COURS_B2_06],
  ])(
    '%s · ne dévoile dans aucune correction sur place une valeur à saisir d’un écran suivant',
    (_, contenu) => {
      expect(
        valeursDevoileesAvantLeurEcran(buildCoursDuContenu(contenu)),
      ).toEqual([]);
    },
  );

  it('B2-05 · voit une valeur d’un écran suivant écrite sans espace des milliers, comme Excel l’affiche', () => {
    const cours = buildCoursAvecExplicationAllongee(
      buildCoursDuContenu(COURS_B2_05),
      'b2-05-a1-valeur-actuelle',
      'La cellule affichera 6753,05.',
    );

    expect(valeursDevoileesAvantLeurEcran(cours).join(' | ')).toContain(
      '6 753,05 de B2-05-A2-05-ATELIER-ANNUITES dans B2-05-A1-10-ATELIER-PLACEMENT',
    );
  });
});
