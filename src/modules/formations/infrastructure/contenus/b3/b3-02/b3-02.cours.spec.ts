import { lireConception } from '../../../../../../../test/helpers/formations/cours/conception-de-cours';
import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import * as feuille from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import * as relecture from '../../../../../../../test/helpers/formations/cours/gardes-de-relecture';
import {
  debutsDe,
  ORDRE_DU_TEXTE,
} from '../../../../../../../test/helpers/formations/cours/serie-de-pages';
import { ecranDuCours } from '../../../../../../../test/helpers/formations/cours/lecture-de-cours';
import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import { nombreFrancais } from '../../../../../../common/domain/nombres/ecriture-francaise';
import { sansEspacesTypographiques } from '../../../../../../common/domain/texte/nettoyage/sans-espaces-typographiques';
import {
  estReservee,
  presentationDe,
} from '../../../../domain/cours/structure/Cours';
import { verifierStructure } from '../../../../domain/cours/structure/StructureCours';
import { tirer } from '../../../../domain/cours/tirage/Tirage';
import {
  CLASSEURS_B3_01,
  PIEGES_B3_01,
  TOLERANCES_B3_01,
  VALEURS_B3_01,
} from '../b3-01/b3-01.donnees';
import { LES_SIX_REGLES } from './b3-02.acte-3';
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
  FICHES_RECAP_A4,
  INFOGRAPHIES,
} from './b3-02.briques';

const COURS = buildCoursDuContenu(COURS_B3_02);
const DOCUMENT = lireConception('b3/cours-b3-02-conception.md');
const QUESTIONS = Object.keys(SOURCES_B3_02) as QuestionChiffreeB302[];
const SEUIL_D_UNE_VALEUR_RECONNAISSABLE = 10;
const FICHES_RECAP = ['B3-02-A2-18-FICHE-RECAP-1', 'B3-02-A2-19-FICHE-RECAP-2'];

function texteDe(screenId: string): string {
  return sansEspacesTypographiques(
    feuille.texteDeLEcran(COURS_B3_02, screenId),
  );
}

function formulesSansEspaces(screenId: string): string {
  return texteDe(screenId).replaceAll('; ', ';');
}

function notesDe(screenId: string): string {
  return sansEspacesTypographiques(
    fiche.ecranDuContenu(COURS_B3_02, screenId).notes,
  );
}

function explicationDe(screenId: string, reference: string): string {
  return sansEspacesTypographiques(
    ecranDuCours(COURS, screenId).correctionSurPlace?.explications.find(
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
  conception: 'b3/cours-b3-02-conception.md',
  ecrans: 36,
  dureeMinutes: 156,
  minutesParActe: [57, 57, 42, 0, 0, 0],
  rythme: { expositionContinueMax: 39, interactives: 87, exposition: 69 },
  ateliersNotes: [
    'A1-03 (8)',
    'A1-08 (15)',
    'A1-13 (13)',
    'A2-05 (9)',
    'A2-09 (9)',
    'A2-17 (12)',
  ],
  noteesParType: [2, 11, 1, 0, 0],
  enigmes: 0,
  rappels: 0,
  remediations: 30,
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
    'B3-02-A2-17-ATELIER-DASHBOARD',
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
        (ecranDuCours(COURS, screenId).correctionSurPlace?.explications ?? [])
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

  it('B302-M3 · écrit en entier les formules de l’évolution et du taux de marque de l’exercice 6', () => {
    const consigne = formulesSansEspaces('B3-02-A2-17-ATELIER-DASHBOARD');

    expect(consigne).toContain('-1');
    expect(consigne).toContain(
      '=SOMME.SI.ENS(T_Commandes[marge];T_Commandes[agence_id];\\"AG09\\";T_Commandes[annee];2026)/SOMME.SI.ENS(T_Commandes[ca_ht];T_Commandes[agence_id];\\"AG09\\";T_Commandes[annee];2026)',
    );
  });
});

describe('B3-02 — les pages de formules', () => {
  it(`B302-M2 · montre sur chacune des ${INFOGRAPHIES.length} pages son infographie à gauche, et à côté la syntaxe, les arguments, le piège puis l’exemple chiffré`, () => {
    const pages = pagesDeFormules().map((ecran) => {
      const { image, paragraphs } = feuille.proprietesV2(
        COURS_B3_02,
        ecran.screenId,
      ) as { image: string; paragraphs: string[] };
      return {
        rendu: presentationDe(ecran)?.renderer,
        image,
        debuts: debutsDe(paragraphs),
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

describe('B3-02 — pièces jointes du § 8.2', () => {
  const jointes = relecture.piecesJointesDuCours(COURS);

  it('B302-M4 · joint chaque classeur du B3-01 à son écran, dans la diffusion prévue', () => {
    relecture.attendreLesPiecesJointesDuDocument(COURS, DOCUMENT, [
      CLASSEURS_B3_01.brut,
      CLASSEURS_B3_01.repriseActe2,
      CLASSEURS_B3_01.repriseActe3,
      ...FICHES_RECAP_A4.map(({ pdf }) => pdf),
      CLASSEURS_B3_01.repriseActe2,
    ]);
  });

  it('B302-M4 · réserve les reprises à la séance, après les exercices dont elles portent les réponses', () => {
    expect(jointes.map(({ ecran, reservee }) => ({ ecran, reservee }))).toEqual(
      [
        { ecran: 'A1-02', reservee: false },
        { ecran: 'A1-09', reservee: true },
        { ecran: 'A2-11', reservee: true },
        { ecran: 'A2-18', reservee: false },
        { ecran: 'A2-19', reservee: false },
        { ecran: 'A3-04', reservee: true },
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
      ['A3-04', ['B3-02-A1-03-TRI-ANOMALIES', 'B3-02-A1-08-ATELIER-NETTOYAGE']],
    ]);
  });
});

describe('B3-02 — l’IA analyste, tous ensemble', () => {
  const PROMPT = 'B3-02-A3-04-PROMPT-TOUS-ENSEMBLE';
  const prompt = (): string =>
    sansEspacesTypographiques(
      (feuille.proprietesV2(COURS_B3_02, PROMPT) as { prompt: string }).prompt,
    );

  it('B3 · sert après les deux pages de cours un prompt seul, en séance, 30 min, rien à saisir', () => {
    const ecrans = COURS_B3_02.ecrans.map(({ screenId }) => screenId);
    const rang = ecrans.indexOf(PROMPT);
    const ecran = fiche.ecranDuContenu(COURS_B3_02, PROMPT);

    expect(ecrans.slice(rang - 2, rang + 2)).toEqual([
      'B3-02-A3-02-COURS-IA-ANALYSTE',
      'B3-02-A3-03-COURS-CAHIER-DE-REGLES',
      PROMPT,
      'B3-02-A3-08-FICHE-MEMO',
    ]);
    expect({
      titre: ecran.titre,
      diffusion: ecran.diffusion,
      dureeMinutes: ecran.dureeMinutes,
      brique: ecran.brique,
      rendu: presentationDe(ecran)?.renderer,
    }).toEqual({
      titre: 'L’IA analyste, tous ensemble',
      diffusion: 'seance',
      dureeMinutes: 30,
      brique: 'fp-story',
      rendu: 'prompt',
    });
  });

  it('B3 · donne à l’IA son rôle, les six onglets, les définitions absentes du classeur, les six règles mot pour mot et le format', () => {
    const texte = prompt();

    expect(
      [
        'Tu es analyste data pour Norvane Équipement, un réseau de 12 agences.',
        'Commandes (colonnes A à M)',
        'Quarantaine',
        'Clients',
        'Agences',
        'Produits',
        'Objectifs',
        'date promise = 5 jours ouvrés après date_commande',
        'délai = jours ouvrés entre date_commande et date_livraison, jour de commande exclu, sans jours fériés',
        'marge = ca_ht − quantite × cout_unitaire',
        ...LES_SIX_REGLES,
        'Un tableau : question, chiffre, méthode ou code, lignes retenues.',
      ]
        .map(sansEspacesTypographiques)
        .filter((attendu) => !texte.includes(attendu)),
    ).toEqual([]);
  });

  it('B3 · pose six questions, chacune au périmètre et à l’unité de la question d’exercice dont les notes donnent la valeur', () => {
    expect(
      prompt()
        .split('\n')
        .filter((ligne) => /^Q\d\. /.test(ligne)),
    ).toEqual(
      [
        'Q1. CA HT de Rennes (AG06) en informatique, de janvier à septembre 2026, en euros.',
        'Q2. Délai médian de livraison de Strasbourg (AG12) en 2026, en jours ouvrés.',
        'Q3. Nombre de lignes du réseau commandées en 2026 et livrées après leur date promise.',
        'Q4. Part de l’informatique dans le CA HT de Rennes (AG06), de janvier à septembre 2026, en %.',
        'Q5. Évolution du CA HT du réseau de janvier à septembre 2026 par rapport aux mêmes mois de 2025, en %.',
        'Q6. Taux de marque de Marseille (AG09), marge ÷ CA HT, de janvier à septembre 2026, en %.',
      ].map(sansEspacesTypographiques),
    );
  });

  it('B3 · ne renvoie l’IA ni à un exercice, ni à la séance, ni à un compte', () => {
    expect(prompt()).toContain('Norvane Équipement');
    expect(prompt()).not.toMatch(/exercice|séance|binôme|compte/iu);
  });

  it('B3 · donne dans les notes les six chiffres de référence, valeurs du B3-01', () => {
    const notes = notesDe(PROMPT);
    const references = [
      `Q1 : ${nombreFrancais(VALEURS_B3_01['b3-01-a2-ca-rennes-info'], 0)} €`,
      `Q2 : ${VALEURS_B3_01['b3-01-a2-delai-strasbourg']} jours ouvrés`,
      `Q3 : ${VALEURS_B3_01['b3-01-a2-retards']} lignes`,
      `Q4 : ${nombreFrancais(VALEURS_B3_01['b3-01-a2-part-info-rennes'], 1)} %`,
      `Q5 : +${nombreFrancais(VALEURS_B3_01['b3-01-a3-evolution'], 1)} %`,
      `Q6 : ${nombreFrancais(VALEURS_B3_01['b3-01-a3-marge-marseille'], 1)} %`,
    ].map(sansEspacesTypographiques);

    expect(
      references.filter((reference) => !notes.includes(reference)),
    ).toEqual([]);
  });
});

describe('B3-02 — le cours allégé', () => {
  const RETIRES = [
    'B3-02-A2-13-ATELIER-GRAPHIQUES',
    'B3-02-A3-04-AUDIT-RAPPORT-IA',
    'B3-02-A3-05-DEFI-CONSIGNE',
    'B3-02-A3-06-ANALYSE-IA',
    'B3-02-A3-07-RECOMMANDATIONS',
  ];
  const toutLeTexte = sansEspacesTypographiques(
    JSON.stringify(COURS_B3_02.ecrans),
  );

  it('B1 · ne sert plus les cinq écrans retirés', () => {
    const servis = COURS_B3_02.ecrans.map(({ screenId }) => screenId);

    expect(servis).toContain('B3-02-A2-17-ATELIER-DASHBOARD');
    expect(RETIRES.filter((retire) => servis.includes(retire))).toEqual([]);
  });

  it('B2 · numérote ses exercices de 1 à 6, le tableau de bord en dernier', () => {
    const titres = COURS_B3_02.ecrans
      .map(({ titre }) => titre ?? '')
      .filter((titre) => titre.startsWith('Exercice '));

    expect(titres.map((titre) => titre.split(' —')[0])).toEqual([
      'Exercice 1',
      'Exercice 2',
      'Exercice 3',
      'Exercice 4',
      'Exercice 5',
      'Exercice 6',
    ]);
    expect(titres.at(-1)).toBe('Exercice 6 — Le tableau de bord Direction');
  });

  it('B2 · ne renvoie, dans aucun texte ni aucune note, à un écran retiré ou à son activité', () => {
    const renvois = [
      /exercices? (?:[7-9]|10)\b/iu,
      /exercices 6 et 7/iu,
      /exercices 3 à 7/iu,
      /CA et objectif par agence/iu,
      /binôme/iu,
      /rapport d’une IA à auditer/iu,
      /consigne qui évite/iu,
      /une heure (?:où|pour)/iu,
      /enchaînées sur le cahier de règles : 6 min d’exposition au plus/iu,
    ];

    expect(toutLeTexte).toContain('Exercice 6');
    expect(
      renvois.filter((renvoi) => renvoi.test(toutLeTexte)).map(String),
    ).toEqual([]);
  });

  it('B2 · annonce une demi-heure avec une IA, tous ensemble, dans l’accroche servie et dans sa note', () => {
    expect(texteDe('B3-02-A1-02-REPRISE')).toContain(
      'une demi-heure avec une IA, tous ensemble',
    );
    expect(notesDe('B3-02-A1-02-REPRISE')).toContain(
      'une demi-heure avec une IA, tous ensemble',
    );
  });

  it('B2 · fait annoncer à chaque transition touchée l’écran qui la suit', () => {
    expect({
      outilGraphiques: notesDe('B3-02-A2-12-OUTIL-GRAPHIQUES'),
      outilTableauDeBord: notesDe('B3-02-A2-16-OUTIL-TABLEAU-DE-BORD'),
      cahierDeRegles: notesDe('B3-02-A3-03-COURS-CAHIER-DE-REGLES'),
      prompt: notesDe('B3-02-A3-04-PROMPT-TOUS-ENSEMBLE'),
    }).toEqual({
      outilGraphiques: expect.stringContaining(
        'Transition : « Nadia a trente secondes : un vote. »',
      ),
      outilTableauDeBord: expect.stringContaining(
        'Transition : « Le tableau de bord Direction : exercice 6. »',
      ),
      cahierDeRegles: expect.stringContaining(
        'Transition : « L’IA analyste, tous ensemble : le prompt. »',
      ),
      prompt: expect.stringContaining(
        'Transition : « Gardez la fiche mémo de l’IA analyste. »',
      ),
    });
  });

  it('B2 · retire la remédiation objectif-annuel-pour-cumul, qu’aucune question ne porte plus', () => {
    expect(COURS_B3_02.remediations).toHaveProperty(
      'evolution-sur-annee-pleine',
    );
    expect(COURS_B3_02.remediations).not.toHaveProperty(
      'objectif-annuel-pour-cumul',
    );
  });

  it('B4 · tient sa structure par deux dérogations sur la première leçon de l’IA, et aucune autre', () => {
    const sansDerogation = verifierStructure(COURS, [])
      .map(({ regle, ecran }) => `${regle} · ${ecran}`)
      .sort((premiere, seconde) => premiere.localeCompare(seconde));

    expect(verifierStructure(COURS)).toEqual([]);
    expect(sansDerogation).toEqual([
      'exposition-continue · B3-02-A3-02-COURS-IA-ANALYSTE',
      'gabarit-cycle · B3-02-A3-02-COURS-IA-ANALYSTE',
    ]);
  });

  it('B6 · fait tirer à l’exercice 6 un histogramme de son TCD, titre qui conclut, axe depuis 0, et le corrige', () => {
    const ecran = fiche.ecranDuContenu(
      COURS_B3_02,
      'B3-02-A2-17-ATELIER-DASHBOARD',
    );

    expect(texteDe('B3-02-A2-17-ATELIER-DASHBOARD')).toContain(
      'Graphique croisé dynamique › Histogramme groupé ; un titre qui conclut, l’axe vertical depuis 0',
    );
    expect(ecran.concepts).toContain('choix-du-graphique');
    expect(notesDe('B3-02-A2-17-ATELIER-DASHBOARD')).toContain(
      'Projeter l’histogramme réussi : titre qui conclut, axe depuis zéro.',
    );
  });
});

relecture.decrireLesGardesDeRelecture('B3-02', {
  contenu: COURS_B3_02,
  cours: COURS,
  valeurs: VALEURS_B3_02,
  pieges: PIEGES_B3_02,
  mustDeConfidentialite: 'B302-M5',
});
