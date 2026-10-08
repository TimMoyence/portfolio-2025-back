import {
  buildCoursAvecExplicationAllongee,
  buildCoursDuContenu,
} from '../../../../../test/factories/contenus-de-cours.factory';
import type { ContenuDeCours } from '../../domain/cours/CoursStocke';
import {
  formulesAltereesALaPublication,
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
    [
      'b3-01-a2-part-info-rennes',
      'Le trimestre le plus fort, T4 2025, pèse le plus.',
      'T4 2025 de b3-01-a2-meilleur-trimestre dans B3-01-A2-11-ATELIER-TCD',
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
    [
      'b3-01-a2-ca-ouest',
      'Rapporté à tout l’objectif annuel, Rennes tomberait à 33,8 %.',
      '33,8 (objectif-annuel-pour-cumul) de b3-01-a3-atteinte-rennes dans B3-01-A2-04-ATELIER-RECHERCHE',
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
      ),
    ).toEqual([
      '27 862 (periode-mal-delimitee) dans B3-01-A2-04-ATELIER-RECHERCHE (b3-01-a2-ca-rennes-info)',
    ]);
    expect(
      piegesPartagesDevoilesParLesExplications(
        allonger('b3-01-a2-ca-rennes-info', 'Écart : −27 862 €.'),
        negatifs,
      ),
    ).toEqual([
      '-27 862 (periode-mal-delimitee) dans B3-01-A2-04-ATELIER-RECHERCHE (b3-01-a2-ca-rennes-info)',
    ]);
  });

  it('piegesPartagesDevoilesParLesExplications · voit dans l’écran un piège entier dès 10, et laisse en deçà les entiers trop communs pour être reconnus', () => {
    expect(
      piegesPartagesDevoilesParLesExplications(
        allonger(
          'b3-01-a2-delai-strasbourg',
          'En jours calendaires, la médiane donnerait 11 jours.',
        ),
        PIEGES_B3_01,
      ),
    ).toEqual([
      '11 (jours-calendaires-pour-ouvres) dans B3-01-A2-07-ATELIER-DELAIS-MARGE (b3-01-a2-delai-strasbourg)',
    ]);
    expect(
      piegesPartagesDevoilesParLesExplications(
        allonger(
          'b3-01-a2-delai-strasbourg',
          'Sans le − 1, on lirait 9 jours.',
        ),
        PIEGES_B3_01,
      ),
    ).toEqual([]);
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
    [
      'b3-01-a3-agences-sous-objectif',
      'Au format 0,00 %, le CA progresse de 8,60 %.',
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

  it('valeursAuCatalogue · ignore un écran verrouillé, dont seul le titre est servi', () => {
    expect(
      COURS.ecrans.find(({ id }) => id === 'B3-01-A2-08-VOTE-NOUVELLES-LIGNES')
        ?.titre,
    ).toBe('Vote : 200 lignes de plus');
    expect(valeursAuCatalogue(COURS, [200])).toEqual([]);
  });

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

  it('B2-05 · voit une case du tableau d’amortissement citée avant l’écran qui la fait remplir', () => {
    const cours = buildCoursAvecExplicationAllongee(
      buildCoursDuContenu(COURS_B2_05),
      'b2-05-a1-valeur-actuelle',
      'Le capital restant dû affichera 11 077,63.',
    );

    expect(valeursDevoileesAvantLeurEcran(cours).join(' | ')).toContain(
      '11 077,63 de B2-05-A3-07-TABLEAU-AMORTISSEMENT dans B2-05-A1-10-ATELIER-PLACEMENT',
    );
  });
});

describe('formulesAltereesALaPublication', () => {
  const avecTexte = (texte: string): ContenuDeCours => ({
    ...COURS_B3_01,
    titre: `${COURS_B3_01.titre} ${texte}`,
  });

  it('ne signale rien sur le cours publié', () => {
    expect(formulesAltereesALaPublication(COURS_B3_01)).toEqual([]);
  });

  it.each([
    ['Écrire =SI(A1>0 ;1;0) en B2.', '=SI(A1>0 ;1;0)'],
    ['Écrire =SI(B2="";"vide";"1 000") en C2.', '=SI(B2="";"vide";"1 000")'],
    ['Écrire =SI(A1>0 ;1;0) en B2.', '=SI(A1>0 ;1;0)'],
  ])(
    'signale une formule que la typographie altérerait : « %s »',
    (texte, formule) => {
      expect(formulesAltereesALaPublication(avecTexte(texte))).toEqual([
        formule,
      ]);
    },
  );

  it('laisse une formule suivie de la ponctuation de sa phrase', () => {
    expect(
      formulesAltereesALaPublication(avecTexte('=SOMME(L2:L4099) : total.')),
    ).toEqual([]);
  });
});
