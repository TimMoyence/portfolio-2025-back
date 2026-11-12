import { lireConception } from '../../../../../../../test/helpers/formations/cours/conception-de-cours';
import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import * as feuille from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import * as relecture from '../../../../../../../test/helpers/formations/cours/gardes-de-relecture';
import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import { nombreFrancais } from '../../../../../../common/domain/nombres/ecriture-francaise';
import { sansEspacesTypographiques } from '../../../../../../common/domain/texte/nettoyage/sans-espaces-typographiques';
import { estReservee } from '../../../../domain/cours/structure/Cours';
import { tirer } from '../../../../domain/cours/tirage/Tirage';
import {
  CLASSEURS_B3_01,
  PIEGES_B3_01,
  TOLERANCES_B3_01,
  VALEURS_B3_01,
} from '../b3-01/b3-01.donnees';
import { COURS_B3_02 } from './b3-02.cours';
import {
  MEILLEUR_TRIMESTRE_B3_02,
  PIEGES_B3_02,
  SOURCES_B3_02,
  type QuestionChiffreeB302,
  VALEURS_B3_02,
} from './b3-02.donnees';
import {
  DOSSIER_DES_INFOGRAPHIES,
  INFOGRAPHIES,
  PAGES_DE_FORMULES,
} from './b3-02.briques';

const COURS = buildCoursDuContenu(COURS_B3_02);
const DOCUMENT = lireConception('cours-b3-02-conception.md');
const QUESTIONS = Object.keys(SOURCES_B3_02) as QuestionChiffreeB302[];
const SEUIL_D_UNE_VALEUR_RECONNAISSABLE = 10;
const FICHES_RECAP = ['B3-02-A2-18-FICHE-RECAP-1', 'B3-02-A2-19-FICHE-RECAP-2'];
const ORDRE_DU_TEXTE = ['Syntaxe : ', 'Le piège : ', 'Exemple : '];

function texteDe(screenId: string): string {
  return sansEspacesTypographiques(
    feuille.texteDeLEcran(COURS_B3_02, screenId),
  );
}

function formulesSansEspaces(screenId: string): string {
  return texteDe(screenId).replaceAll('; ', ';');
}

function proprietesDe(screenId: string) {
  return fiche.ecranDuContenu(COURS_B3_02, screenId).proprietes;
}

function explicationDe(screenId: string, reference: string): string {
  const ecran = COURS.ecrans.find((candidat) => candidat.id === screenId);
  return sansEspacesTypographiques(
    ecran?.correctionSurPlace?.explications.find(
      (explication) => explication.reference === reference,
    )?.texte ?? '',
  );
}

function ecranDeLaQuestion(id: string): string {
  const ecran = COURS.ecrans.find((candidat) =>
    'questions' in candidat
      ? candidat.questions.some((question) => question.id === id)
      : false,
  );
  return ecran?.id ?? '';
}

function formeServie(id: QuestionChiffreeB302): string {
  const valeur = Number(VALEURS_B3_02[id]);
  const decimales = TOLERANCES_B3_01[SOURCES_B3_02[id]].valeur === 1 ? 1 : 0;
  return sansEspacesTypographiques(nombreFrancais(valeur, decimales));
}

function pagesDeFormules() {
  return COURS_B3_02.ecrans.filter(
    ({ screenId }) =>
      /-(FORMULES?|OUTIL)-/.test(screenId) && !screenId.includes('RECAP'),
  );
}

fiche.decrireLaFicheDuCours('B3-02', COURS, {
  conception: 'cours-b3-02-conception.md',
  ecrans: 40,
  dureeMinutes: 180,
  minutesParActe: [57, 63, 60, 0, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 141, exposition: 39 },
  ateliersNotes: [
    'A1-03 (8)',
    'A1-08 (15)',
    'A1-13 (13)',
    'A2-05 (9)',
    'A2-09 (9)',
    'A2-13 (8)',
    'A2-17 (10)',
    'A3-04 (11)',
  ],
  noteesParType: [2, 13, 2, 0, 0],
  enigmes: 0,
  rappels: 0,
  remediations: 31,
  options: 9,
  catalogue: [
    'A1-02',
    'A1-05',
    'A1-06',
    'A1-07',
    'A1-10',
    'A1-11',
    'A2-02',
    'A2-03',
    'A2-04',
    'A2-07',
    'A2-08',
    'A2-10',
    'A2-12',
    'A2-15',
    'A2-16',
    'A2-18',
    'A2-19',
    'A3-02',
    'A3-03',
    'A3-08',
  ],
  gabarit: 'b3',
  corrigesSurPlace: [
    'B3-02-A1-03-TRI-ANOMALIES',
    'B3-02-A1-08-ATELIER-NETTOYAGE',
    'B3-02-A1-13-ATELIER-RECHERCHE',
    'B3-02-A2-05-ATELIER-DELAIS',
    'B3-02-A2-09-ATELIER-TCD',
    'B3-02-A2-13-ATELIER-GRAPHIQUES',
    'B3-02-A2-17-ATELIER-DASHBOARD',
    'B3-02-A3-04-AUDIT-RAPPORT-IA',
    'B3-02-A3-05-DEFI-CONSIGNE',
    'B3-02-A3-07-RECOMMANDATIONS',
  ],
});

describe('B3-02 — les valeurs du B3-01, servies telles quelles', () => {
  it('B302-M3 · sert à chaque question chiffrée la valeur et les pièges de sa question source du § 5.1', () => {
    fiche.attendreLesNumeriques(
      COURS,
      Object.fromEntries(
        QUESTIONS.map((id) => [
          id,
          [
            VALEURS_B3_01[SOURCES_B3_02[id]],
            ...Object.values(PIEGES_B3_01[SOURCES_B3_02[id]]),
          ],
        ]),
      ),
    );
  });

  it('B302-M3 · reprend la tolérance de chaque question source : l’euro, le dixième de point, rien pour un comptage', () => {
    expect(relecture.tolerancesDuCours(COURS)).toEqual(
      Object.fromEntries(
        QUESTIONS.map((id) => [id, TOLERANCES_B3_01[SOURCES_B3_02[id]]]),
      ),
    );
  });

  it('B302-M3 · associe chaque question du § 5.1 à la question source qu’il nomme', () => {
    const lignes = DOCUMENT.split('\n').filter((ligne) =>
      /^\| `b3-02-a\d-[^`]+` +\| `b3-01-/.test(ligne),
    );

    expect(
      Object.fromEntries(
        lignes.map((ligne) => {
          const [question, source] = [...ligne.matchAll(/`([^`]+)`/g)].map(
            ([, code]) => code,
          );
          return [question, source];
        }),
      ),
    ).toEqual({
      ...SOURCES_B3_02,
      [MEILLEUR_TRIMESTRE_B3_02]: 'b3-01-a2-meilleur-trimestre',
    });
  });

  it('B302-M3 · fait voter le meilleur trimestre sur le trimestre du jeu', () => {
    const { solutions, libellesOptions } = tirer(COURS, 0);

    expect(
      libellesOptions[MEILLEUR_TRIMESTRE_B3_02][
        String(solutions[MEILLEUR_TRIMESTRE_B3_02].valeur)
      ],
    ).toBe(VALEURS_B3_01['b3-01-a2-meilleur-trimestre']);
  });

  it('B302-M3 · cite dans la correction de chaque question chiffrée la valeur servie', () => {
    const muettes = QUESTIONS.filter(
      (id) =>
        !explicationDe(ecranDeLaQuestion(id), id).includes(formeServie(id)),
    );

    expect(muettes).toEqual([]);
  });

  it('B302-M3 · cite dans les corrections de son écran chaque piège reconnaissable de la question, tel que le B3-01 le calcule', () => {
    const corrections = (screenId: string): string =>
      sansEspacesTypographiques(
        (
          COURS.ecrans.find((ecran) => ecran.id === screenId)
            ?.correctionSurPlace?.explications ?? []
        )
          .map((explication) => explication.texte)
          .join(' '),
      );
    const absents = QUESTIONS.flatMap((id) => {
      const decimales =
        TOLERANCES_B3_01[SOURCES_B3_02[id]].valeur === 1 ? 1 : 0;
      return Object.values(PIEGES_B3_02[id])
        .filter(
          (piege) =>
            Math.abs(piege) >= SEUIL_D_UNE_VALEUR_RECONNAISSABLE ||
            !Number.isInteger(piege),
        )
        .map((piege) =>
          sansEspacesTypographiques(nombreFrancais(Math.abs(piege), decimales)),
        )
        .filter((forme) => !corrections(ecranDeLaQuestion(id)).includes(forme))
        .map((forme) => `${forme} de ${id}`);
    });

    expect(absents).toEqual([]);
  });

  it('B302-M3 · écrit en entier chaque formule des étapes de l’exercice 3, sans « même formule »', () => {
    const consigne = formulesSansEspaces('B3-02-A1-13-ATELIER-RECHERCHE');

    expect(consigne).toContain(
      '=SOMME.SI.ENS(L2:L4039;F2:F4039;\\"AG06\\";O2:O4039;\\"Informatique\\";B2:B4039;\\">=\\"&DATE(2026;1;1))',
    );
    expect(consigne).toContain(
      '=SOMME.SI.ENS(L2:L4039;N2:N4039;\\"Ouest\\";B2:B4039;\\">=\\"&DATE(2026;1;1))',
    );
    expect(consigne).not.toContain('même formule');
  });

  it('B302-M3 · écrit en entier les formules de l’évolution et du taux de marque de l’exercice 7', () => {
    const consigne = formulesSansEspaces('B3-02-A2-17-ATELIER-DASHBOARD');

    expect(consigne).toContain('-1');
    expect(consigne).toContain(
      '=SOMME.SI.ENS(T_Commandes[marge];T_Commandes[agence_id];\\"AG09\\";T_Commandes[annee];2026)/SOMME.SI.ENS(T_Commandes[ca_ht];T_Commandes[agence_id];\\"AG09\\";T_Commandes[annee];2026)',
    );
  });

  it('écrit les en-têtes de la synthèse de l’exercice 6 avant d’en tirer le graphique', () => {
    expect(texteDe('B3-02-A2-13-ATELIER-GRAPHIQUES')).toContain(
      'en A1 à D1, les en-têtes agence_id, ca, objectif, atteinte',
    );
  });
});

describe('B3-02 — les pages de formules', () => {
  it(`B302-M2 · montre sur chacune des ${PAGES_DE_FORMULES} pages son infographie à gauche, et à côté la syntaxe, les arguments, le piège puis l’exemple chiffré`, () => {
    const pages = pagesDeFormules().map((ecran) => {
      const { image, paragraphs } = feuille.proprietesV2(
        COURS_B3_02,
        ecran.screenId,
      ) as { image: string; paragraphs: string[] };
      const presentation =
        ecran.brique === 'fp-story' ? ecran.proprietes.presentation : null;
      return {
        rendu: presentation?.version === 2 ? presentation.renderer : null,
        image,
        debuts: paragraphs.map((paragraphe) =>
          paragraphe.slice(0, paragraphe.indexOf(':') + 2),
        ),
      };
    });

    expect(pages).toEqual(
      INFOGRAPHIES.map(({ fichier }) => ({
        rendu: 'image-left',
        image: `${DOSSIER_DES_INFOGRAPHIES}/${fichier}`,
        debuts: ORDRE_DU_TEXTE,
      })),
    );
  });

  it('B302-M2 · garde à chaque page de formules ses 2 minutes', () => {
    expect(pagesDeFormules().map(({ dureeMinutes }) => dureeMinutes)).toEqual(
      INFOGRAPHIES.map(() => 2),
    );
  });

  it('B302-M2 · numérote les pages dans l’ordre du cours', () => {
    expect(
      pagesDeFormules().map(
        ({ screenId }) =>
          feuille.proprietesV2(COURS_B3_02, screenId)['subtitle'],
      ),
    ).toEqual(
      Array.from(
        { length: PAGES_DE_FORMULES },
        (_, rang) =>
          `Formules pas à pas · page ${rang + 1} sur ${PAGES_DE_FORMULES}`,
      ),
    );
  });

  it('B302-M6 · rassemble dans les deux fiches récap toutes les formules du référentiel, citées comprises', () => {
    const recap = FICHES_RECAP.map(texteDe).join(' ');
    const formules = [
      'SUPPRESPACE',
      'NOMPROPRE',
      'MAJUSCULE',
      'MINUSCULE',
      'NBCAR',
      'SUBSTITUE',
      'CNUM',
      'ESTNUM',
      'DATEVAL',
      'UNICAR',
      'Power Query',
      'Supprimer les doublons',
      'SI(',
      'OU(',
      'ET(',
      'SI.CONDITIONS',
      'RECHERCHEV',
      'INDEX',
      'EQUIV',
      'RECHERCHEX',
      'SOMME.SI.ENS',
      'NB.SI.ENS',
      'DATE(',
      'SOMMEPROD',
      'NB.JOURS.OUVRES',
      'SERIE.JOUR.OUVRE',
      'JOURSEM',
      'DATEDIF',
      'TEMPS',
      'ANNEE',
      'MOYENNE',
      'MEDIANE',
      'AGREGAT',
      'ECARTYPE.STANDARD',
      'EQUATION.RANG',
      'GRANDE.VALEUR',
      'TRIER',
      'FILTRE',
      'UNIQUE',
      'Tableau structuré',
      'tableau croisé dynamique',
      'Barres de données'.toLowerCase(),
      'segments',
      '$',
    ];

    expect(formules.filter((formule) => !recap.includes(formule))).toEqual([]);
    expect(
      FICHES_RECAP.map((screenId) => proprietesV2De(screenId)['imprimable']),
    ).toEqual([true, true]);
  });

  it('écrit les colonnes du classeur où elles sont : agence_id en F, produit_id en H, ca_ht en L', () => {
    expect(texteDe('B3-02-A1-10-FORMULE-RECHERCHE')).toContain(
      '=RECHERCHEV(H2;Produits!$A$2:$E$41;3;FAUX)',
    );
    expect(texteDe('B3-02-A1-12-EXEMPLE-RECHERCHE')).toContain(
      '=RECHERCHEV(F2;Agences!$A$2:$D$13;3;FAUX)',
    );
    expect(texteDe('B3-02-A1-06-FORMULES-NOMBRE')).toContain('SUBSTITUE(L2;');
  });
});

function proprietesV2De(screenId: string): Readonly<Record<string, unknown>> {
  return feuille.proprietesV2(COURS_B3_02, screenId);
}

describe('B3-02 — pièces jointes du § 8.2', () => {
  const jointes = relecture.piecesJointesDuCours(COURS);

  it('B302-M4 · joint chaque classeur du B3-01 à son écran, dans la diffusion prévue', () => {
    relecture.attendreLesPiecesJointesDuDocument(COURS, DOCUMENT, [
      CLASSEURS_B3_01.brut,
      CLASSEURS_B3_01.repriseActe2,
      CLASSEURS_B3_01.repriseActe3,
      CLASSEURS_B3_01.repriseActe2,
    ]);
  });

  it('B302-M4 · réserve les reprises à la séance, après les exercices dont elles portent les réponses', () => {
    expect(jointes.map(({ ecran, reservee }) => ({ ecran, reservee }))).toEqual(
      [
        { ecran: 'A1-02', reservee: false },
        { ecran: 'A1-09', reservee: true },
        { ecran: 'A2-11', reservee: true },
        { ecran: 'A3-06', reservee: true },
      ],
    );
    expect(
      COURS.ecrans.flatMap((ecran) =>
        ecran.pieceJointe !== undefined && estReservee(ecran.pieceJointe)
          ? [[ecran.id.slice(6, 11), ecran.pieceJointe.reprend]]
          : [],
      ),
    ).toEqual([
      ['A1-09', ['B3-02-A1-03-TRI-ANOMALIES', 'B3-02-A1-08-ATELIER-NETTOYAGE']],
      [
        'A2-11',
        [
          'B3-02-A1-03-TRI-ANOMALIES',
          'B3-02-A1-08-ATELIER-NETTOYAGE',
          'B3-02-A1-13-ATELIER-RECHERCHE',
          'B3-02-A2-05-ATELIER-DELAIS',
        ],
      ],
      ['A3-06', ['B3-02-A1-03-TRI-ANOMALIES', 'B3-02-A1-08-ATELIER-NETTOYAGE']],
    ]);
  });
});

describe('B3-02 — l’IA analyste', () => {
  it('B302-M7 · range au rapport d’IA deux chiffres justes, valeurs du B3-01, et six faux, pièges du B3-01', () => {
    const proprietes = proprietesDe('B3-02-A3-04-AUDIT-RAPPORT-IA');
    const cartes =
      'plan' in proprietes && 'cartes' in proprietes.plan
        ? proprietes.plan.cartes
        : [];
    const attendus =
      'questions' in proprietes && proprietes.questions[0].type === 'classement'
        ? proprietes.questions[0].corrige.attendus
        : [];
    const categorieDe = (carte: string) =>
      attendus.find(({ carteId }) => carteId === carte)?.categorieId;
    const ecrit = (valeur: number, decimales: number) =>
      sansEspacesTypographiques(nombreFrancais(valeur, decimales));
    const libelles = Object.fromEntries(
      cartes.map(({ id, libelle }) => [id, sansEspacesTypographiques(libelle)]),
    );

    expect(cartes.map(({ id }) => [id, categorieDe(id)])).toEqual([
      ['atteinte-rennes', 'juste'],
      ['retards', 'juste'],
      ['ca-rennes-info', 'periode'],
      ['evolution', 'periode'],
      ['delai-strasbourg', 'resume'],
      ['marge-moyenne', 'resume'],
      ['part-info', 'denominateur'],
      ['marge-cout', 'denominateur'],
    ]);
    expect(libelles['atteinte-rennes']).toContain(
      ecrit(VALEURS_B3_01['b3-01-a3-atteinte-rennes'], 1),
    );
    expect(libelles['retards']).toContain(
      ecrit(VALEURS_B3_01['b3-01-a2-retards'], 0),
    );
    expect(libelles['ca-rennes-info']).toContain(
      ecrit(
        PIEGES_B3_02['b3-02-a1-ca-rennes-info']['periode-mal-delimitee'] ??
          Number.NaN,
        0,
      ),
    );
    expect(libelles['marge-cout']).toContain(
      ecrit(
        PIEGES_B3_02['b3-02-a2-marge-marseille'][
          'marque-confondue-avec-marge'
        ] ?? Number.NaN,
        1,
      ),
    );
    expect(libelles['part-info']).toContain(
      ecrit(
        PIEGES_B3_02['b3-02-a2-part-info-rennes'][
          'pourcentage-du-mauvais-total'
        ] ?? Number.NaN,
        1,
      ),
    );
  });

  it('B302-M7 · fait déclarer l’outil, puis noter le chiffre de l’IA face au sien pour chacune des sept questions sources', () => {
    const proprietes = proprietesDe('B3-02-A3-06-ANALYSE-IA');
    const ids =
      'questionsLibres' in proprietes
        ? (proprietes.questionsLibres ?? []).map(({ id }) => id)
        : [];

    const texte = texteDe('B3-02-A3-06-ANALYSE-IA');

    expect(ids).toEqual([
      'b3-02-a3-analyse:outil',
      'b3-02-a3-analyse:chiffres',
      'b3-02-a3-analyse:ecarts',
    ]);
    expect(
      [
        '1. CA de Rennes en informatique',
        '2. délai médian de Strasbourg',
        '3. retards',
        '4. part de l’informatique à Rennes',
        '5. atteinte de Rennes',
        '6. évolution du CA',
        '7. taux de marque de Marseille',
      ].filter((question) => !texte.includes(question)),
    ).toEqual([]);
    expect(texte).toContain('binôme');
  });

  it('B302-M7 · donne à l’IA la reprise nettoyée, pas l’export brut', () => {
    const proprietes = proprietesDe('B3-02-A3-06-ANALYSE-IA');

    expect('pieceJointe' in proprietes ? proprietes.pieceJointe : null).toEqual(
      expect.objectContaining({ classeur: CLASSEURS_B3_01.repriseActe2 }),
    );
  });

  it('B302-M7 · garde parmi les stratégies de la consigne une seule fausse : tout corriger', () => {
    const proprietes = proprietesDe('B3-02-A3-05-DEFI-CONSIGNE');
    const strategies =
      'corrige' in proprietes && proprietes.corrige.type === 'defi'
        ? proprietes.corrige.strategies
        : [];

    expect(
      strategies.filter(({ fausse }) => fausse).map(({ id }) => id),
    ).toEqual(['tout-corriger']);
    expect(strategies.map(({ id }) => id)).toEqual([
      'role',
      'donnees',
      'regles',
      'questions',
      'format',
      'tout-corriger',
    ]);
  });
});

relecture.decrireLesGardesDeRelecture('B3-02', {
  contenu: COURS_B3_02,
  cours: COURS,
  valeurs: VALEURS_B3_02,
  pieges: PIEGES_B3_02,
  mustDeConfidentialite: 'B302-M5',
});
