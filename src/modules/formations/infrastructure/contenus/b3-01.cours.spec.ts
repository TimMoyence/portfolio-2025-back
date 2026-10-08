import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  lireConception,
  piecesJointesDuDocument,
} from '../../../../../test/helpers/conception-de-cours';
import { ANOMALIES_SEMEES } from '../../../../../test/helpers/cours-b3-01/generateur';
import * as fiche from '../../../../../test/helpers/fiche-de-cours';
import * as feuille from '../../../../../test/helpers/feuille-de-cours';
import {
  formulesAltereesALaPublication,
  piegesDesQuestionsSuivantesDevoilesParLesExplications,
  piegesPartagesDevoilesParLesExplications,
  valeursAuCatalogue,
  valeursDevoileesAvantLeurEcran,
  valeursDevoileesParLesExplications,
} from '../../../../../test/helpers/relecture-de-cours';
import { libelleDeConfusion } from '../../domain/cours/banque/confusions';
import { questionsDuCours } from '../../domain/cours/Cours';
import { tirer } from '../../domain/cours/Tirage';
import { COURS_B3_01 } from './b3-01.cours';
import {
  CLASSEURS_B3_01,
  HISTOIRES_B3_01,
  PIEGES_B3_01,
  QUESTIONS_CHIFFREES_B3_01,
  TOLERANCES_B3_01,
  VALEURS_B3_01,
} from './b3-01.donnees';

const COURS = buildCoursDuContenu(COURS_B3_01);
const DOCUMENT = lireConception('cours-b3-01-conception.md');
const VALEURS: Readonly<Record<string, number | string>> = Object.fromEntries(
  Object.entries(VALEURS_B3_01),
);
const SEUIL_D_UNE_VALEUR_RECONNAISSABLE = 10;
const UNITES_ARRONDIES = new Set(['€', '%']);
const ESPACES_TYPOGRAPHIQUES = /[\u{A0}\u{202F}]/gu;

interface NumeriqueStockee {
  readonly id: string;
  readonly enonce: string;
  readonly unite: string | null;
}

function numeriquesStockees(): NumeriqueStockee[] {
  return COURS_B3_01.ecrans.flatMap(({ proprietes }) =>
    'questions' in proprietes
      ? proprietes.questions.flatMap((question) =>
          question.type === 'numeric' ? [question] : [],
        )
      : [],
  );
}

function valeursReconnaissables(): (number | string)[] {
  return Object.values(VALEURS).filter(
    (valeur) =>
      typeof valeur === 'string' ||
      valeur >= SEUIL_D_UNE_VALEUR_RECONNAISSABLE ||
      !Number.isInteger(valeur),
  );
}

function texteDe(screenId: string): string {
  return feuille
    .texteDeLEcran(COURS_B3_01, screenId)
    .replaceAll(ESPACES_TYPOGRAPHIQUES, ' ');
}

function questionsDe(screenId: string) {
  const { proprietes } = fiche.ecranDuContenu(COURS_B3_01, screenId);
  return 'questions' in proprietes ? proprietes.questions : [];
}

function libellesDuVote(id: string): string[] {
  return Object.values(tirer(COURS, 0).libellesOptions[id]);
}

function confusionsDeLaChiffree(id: string): string[] {
  return tirer(COURS, 0).solutions[id].pieges.map(
    ({ misconception }) => misconception,
  );
}

function confusionsDuVote(screenId: string): (string | null)[] {
  return questionsDe(screenId).flatMap((question) =>
    question.type === 'vote'
      ? question.options.map(({ confusion }) => confusion)
      : [],
  );
}

function attendusDe(screenId: string) {
  return questionsDe(screenId).flatMap((question) =>
    question.type === 'classement' ? question.corrige.attendus : [],
  );
}

function enonceDe(id: string): string {
  return (
    numeriquesStockees().find((question) => question.id === id)?.enonce ?? ''
  ).replaceAll(ESPACES_TYPOGRAPHIQUES, ' ');
}

function remediationDe(confusion: string): string | undefined {
  return Object.entries(COURS_B3_01.remediations ?? {}).find(
    ([cle]) => cle === confusion,
  )?.[1];
}

function explicationsDe(screenId: string): string[] {
  const ecran = COURS.ecrans.find((candidat) => candidat.id === screenId);
  return (ecran?.correctionSurPlace?.explications ?? []).map((explication) =>
    explication.texte.replaceAll(ESPACES_TYPOGRAPHIQUES, ' '),
  );
}

fiche.decrireLaFicheDuCours('B3-01', COURS, {
  conception: 'cours-b3-01-conception.md',
  ecrans: 40,
  dureeMinutes: 180,
  minutesParActe: [56, 60, 64, 0, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 142, exposition: 38 },
  ateliersNotes: [
    'A1-07 (4)',
    'A1-08 (4)',
    'A1-13 (5)',
    'A1-14 (12)',
    'A2-04 (10)',
    'A2-07 (10)',
    'A2-11 (14)',
    'A3-04 (4)',
    'A3-05 (8)',
    'A3-09 (15)',
  ],
  noteesParType: [4, 18, 3, 0, 0],
  enigmes: 0,
  rappels: 0,
  remediations: 37,
  options: 12,
  catalogue: [
    'A1-02',
    'A1-03',
    'A1-05',
    'A1-06',
    'A1-10',
    'A1-11',
    'A2-02',
    'A2-03',
    'A2-06',
    'A2-09',
    'A3-01',
    'A3-03',
    'A3-07',
    'A3-11',
  ],
  gabarit: 'b3',
  corrigesSurPlace: [
    'B3-01-A1-07-TRI-COLONNES',
    'B3-01-A1-08-ATELIER-GRANULARITE',
    'B3-01-A1-13-TRI-ANOMALIES',
    'B3-01-A1-14-ATELIER-NETTOYAGE',
    'B3-01-A2-04-ATELIER-RECHERCHE',
    'B3-01-A2-07-ATELIER-DELAIS-MARGE',
    'B3-01-A2-11-ATELIER-TCD',
    'B3-01-A3-04-TRI-GRAPHIQUES',
    'B3-01-A3-05-ATELIER-GRAPHIQUES',
    'B3-01-A3-09-ATELIER-DASHBOARD',
    'B3-01-A3-10-RECOMMANDATIONS',
  ],
});

describe('B3-01 — valeurs servies face au jeu Norvane', () => {
  it('sert les dix-huit valeurs attendues et leurs pièges, dans l’ordre du § 5.1', () => {
    fiche.attendreLesNumeriques(
      COURS,
      Object.fromEntries(
        QUESTIONS_CHIFFREES_B3_01.map((id) => [
          id,
          [VALEURS_B3_01[id], ...Object.values(PIEGES_B3_01[id])],
        ]),
      ),
    );
  });

  it('tolère l’euro près pour un montant, le dixième de point pour un taux, rien pour un comptage', () => {
    expect(
      Object.fromEntries(
        questionsDuCours(COURS).flatMap((question) =>
          question.type === 'numeric'
            ? [[question.id, question.tolerance]]
            : [],
        ),
      ),
    ).toEqual(
      Object.fromEntries(
        QUESTIONS_CHIFFREES_B3_01.map((id) => [
          id,
          { type: 'absolue', valeur: TOLERANCES_B3_01[id] },
        ]),
      ),
    );
  });

  it('fait voter le meilleur trimestre sur le trimestre du jeu', () => {
    const id = 'b3-01-a2-meilleur-trimestre';
    const { solutions, libellesOptions } = tirer(COURS, 0);

    expect(libellesOptions[id][String(solutions[id].valeur)]).toBe(
      VALEURS_B3_01[id],
    );
  });

  it('montre au graphique trompeur le CA 2025 de Rennes et de Nantes, sur un axe tronqué', () => {
    const { labels, series, axisRanges } = feuille.proprietesV2(
      COURS_B3_01,
      'B3-01-A3-01-GRAPHIQUE-TROMPEUR',
    );
    const rennes = HISTOIRES_B3_01['ca-2025-rennes'];

    expect(labels).toEqual(['Rennes', 'Nantes']);
    expect(series).toMatchObject([
      { values: [rennes, HISTOIRES_B3_01['ca-2025-nantes']] },
    ]);
    expect(axisRanges).toEqual([[expect.any(Number), expect.any(Number)]]);
    const [[debut]] = axisRanges as [[number, number]];
    expect(debut).toBeGreaterThan(0);
    expect(debut).toBeLessThan(rennes);
  });

  it('dévoile aux recommandations les quatre histoires du § 4.4, chiffrées', () => {
    const textes = explicationsDe('B3-01-A3-10-RECOMMANDATIONS');
    const histoires = [
      [
        feuille.enFrancais(VALEURS_B3_01['b3-01-a3-marge-marseille'], 1),
        feuille.enFrancais(HISTOIRES_B3_01['taux-de-marge-marseille-2025'], 1),
      ],
      [
        feuille.enFrancais(VALEURS_B3_01['b3-01-a3-atteinte-rennes'], 1),
        feuille.enFrancais(
          -HISTOIRES_B3_01['evolution-informatique-rennes'],
          1,
        ),
      ],
      [feuille.enFrancais(HISTOIRES_B3_01['evolution-lille'], 1)],
      [
        `${VALEURS_B3_01['b3-01-a2-delai-strasbourg']} jours ouvrés`,
        `contre ${HISTOIRES_B3_01['delai-median-strasbourg-2025']}`,
      ],
    ];

    expect(textes).toHaveLength(histoires.length);
    histoires.forEach((formes, rang) => {
      for (const forme of formes) {
        expect(textes[rang]).toContain(forme);
      }
    });
  });
});

describe('B3-01 — pièces jointes du § 8.2', () => {
  it('joint chaque classeur à son écran, dans la diffusion prévue', () => {
    const jointes = COURS.ecrans.flatMap((ecran) =>
      ecran.pieceJointe === undefined
        ? []
        : [
            {
              ecran: ecran.id.slice(6, 11),
              diffusion: ecran.diffusion,
              fichier: ecran.pieceJointe.fichier,
            },
          ],
    );
    const attendues = piecesJointesDuDocument(DOCUMENT);

    expect(jointes.map(({ fichier }) => fichier)).toEqual(
      Object.values(CLASSEURS_B3_01),
    );
    expect(
      jointes.map(({ ecran, diffusion }) => ({ ecran, diffusion })),
    ).toEqual(attendues.map(({ ecran, diffusion }) => ({ ecran, diffusion })));
    attendues.forEach(({ motif }, rang) => {
      expect(jointes[rang].fichier.split('/').at(-1)).toMatch(motif);
    });
  });
});

describe('B3-01 — gardes de la relecture', () => {
  it('V1 · sert chaque formule telle qu’Excel l’accepte, sans espace ajoutée par la typographie', () => {
    expect(formulesAltereesALaPublication(COURS_B3_01)).toEqual([]);
  });

  it('V4 · annonce dans chaque énoncé numérique l’arrondi et le symbole à omettre, ou le nombre entier', () => {
    const fautifs = numeriquesStockees()
      .filter(({ enonce, unite }) =>
        UNITES_ARRONDIES.has(unite ?? '')
          ? !enonce.includes('sans le symbole') || !enonce.includes('arrondi')
          : !enonce.includes('nombre entier'),
      )
      .map(({ id }) => id);

    expect(numeriquesStockees()).toHaveLength(QUESTIONS_CHIFFREES_B3_01.length);
    expect(fautifs).toEqual([]);
  });

  it('ne sert au catalogue aucune valeur attendue reconnaissable', () => {
    expect(valeursAuCatalogue(COURS, valeursReconnaissables())).toEqual([]);
  });

  it('ne dévoile dans aucune explication la valeur d’une question encore ouverte', () => {
    expect(valeursDevoileesParLesExplications(COURS, VALEURS)).toEqual([]);
  });

  it('réserve à la dernière correction la valeur-piège d’une confusion qu’une question suivante du même écran partage', () => {
    expect(
      piegesPartagesDevoilesParLesExplications(COURS, PIEGES_B3_01),
    ).toEqual([]);
  });

  it('ne dévoile dans aucune explication un piège reconnaissable d’une question suivante, du même écran ou d’un écran suivant', () => {
    expect(
      piegesDesQuestionsSuivantesDevoilesParLesExplications(
        COURS,
        PIEGES_B3_01,
      ),
    ).toEqual([]);
  });

  it('ne dévoile dans aucune correction sur place une valeur décimale d’un écran suivant', () => {
    expect(valeursDevoileesAvantLeurEcran(COURS)).toEqual([]);
  });

  it('écrit les colonnes du classeur où elles sont : ville en E, produit_id en H, ca_ht en L', () => {
    const textes = [
      'B3-01-A1-12-EXEMPLE-NETTOYAGE',
      'B3-01-A2-03-COURS-CHERCHER-AGREGER',
    ]
      .map((ecran) => feuille.texteDeLEcran(COURS_B3_01, ecran))
      .join(' ');

    expect(textes).toContain('=NOMPROPRE(SUPPRESPACE(E2))');
    expect(textes).toContain('SUBSTITUE(L2;');
    expect(textes).toContain('EQUIV(H2;Produits!$A$2:$A$41;0)');
  });

  it('V4 · ne pose sur une question en nombre entier que des pièges entiers', () => {
    const enNombreEntier = new Set(
      numeriquesStockees()
        .filter(({ enonce }) => enonce.includes('nombre entier'))
        .map(({ id }) => id),
    );
    const fautifs = QUESTIONS_CHIFFREES_B3_01.filter(
      (id) =>
        enNombreEntier.has(id) &&
        Object.values(PIEGES_B3_01[id]).some(
          (piege) => !Number.isInteger(piege),
        ),
    );

    expect(enNombreEntier.size).toBeGreaterThan(0);
    expect(fautifs).toEqual([]);
  });
});

describe('B3-01 — acte 1 : consignes et corrections exactes', () => {
  it('A1-04 · n’offre au vote de la clé aucune option défendable', () => {
    expect(libellesDuVote('b3-01-a1-cle-client').join(' ')).not.toContain(
      'SIRET',
    );
  });

  it('A1-05 et A1-07 · nomment les valeurs du booléen comme Excel les affiche', () => {
    for (const ecran of [
      'B3-01-A1-05-COURS-DONNEE',
      'B3-01-A1-07-TRI-COLONNES',
    ]) {
      expect(texteDe(ecran)).toContain('VRAI');
      expect(texteDe(ecran)).not.toMatch(/«\s?oui\s?»/);
    }
  });

  it('A1-04 · rattache chaque estimation fausse de la part douteuse à la confusion de l’estimation', () => {
    expect(confusionsDuVote('B3-01-A1-04-VOTE-PART-ET-CLE')).toEqual([
      null,
      'part-douteuse-estimee-sans-mesure',
      'part-douteuse-estimee-sans-mesure',
      'part-douteuse-estimee-sans-mesure',
      null,
      'libelle-pris-pour-cle',
      'libelle-pris-pour-cle',
    ]);
    expect(remediationDe('part-douteuse-estimee-sans-mesure')).toBe(
      'B3-01-A1-10-COURS-GRILLE',
    );
  });

  it('A1-07 · diagnostique un code en texte rangé parmi les catégories comme un identifiant pris pour une catégorie, et n_commande seul comme un nombre', () => {
    const confusionDe = (carte: string) =>
      attendusDe('B3-01-A1-07-TRI-COLONNES').find(
        ({ carteId }) => carteId === carte,
      )?.confusionSiErreur;

    for (const code of [
      'agence-id',
      'client-id',
      'produit-id',
      'commercial-id',
    ]) {
      expect(confusionDe(code)).toBe('cle-prise-pour-categorie');
    }
    expect(confusionDe('n-commande')).toBe('identifiant-pris-pour-nombre');
    expect(libelleDeConfusion('cle-prise-pour-categorie')).toContain(
      'commercial_id',
    );
    expect(texteDe('B3-01-A1-07-TRI-COLONNES')).toContain(
      'identifiant rangé parmi les catégories',
    );
    expect(remediationDe('cle-prise-pour-categorie')).toBe(
      'B3-01-A1-06-COURS-RELATIONS',
    );
  });

  it('A1-12 · n’impose aux notes que l’ordre qui change le résultat, SUBSTITUE avant CNUM', () => {
    const texte = texteDe('B3-01-A1-12-EXEMPLE-NETTOYAGE');

    expect(texte).toContain('SUBSTITUE d’abord, CNUM ensuite');
    expect(texte).not.toContain('SUPPRESPACE d’abord, NOMPROPRE ensuite');
    expect(texte).toContain('accepter les deux');
  });

  it('A1-08 · ne borne pas à cinq les lignes d’une commande du brut, doublons compris', () => {
    const [granularite] = explicationsDe('B3-01-A1-08-ATELIER-GRANULARITE');

    expect(granularite).not.toContain('une à cinq lignes');
    expect(granularite).toContain('exportées deux fois');
  });

  it('A1-12 · cite deux cellules du classeur brut telles qu’elles y sont', () => {
    const texte = texteDe('B3-01-A1-12-EXEMPLE-NETTOYAGE');

    expect(texte).toContain(
      'en E783, la ville « Bordeaux », entourée d’espaces',
    );
    expect(texte).toContain(
      'en L2971, le ca_ht saisi comme le texte « 1 150,00 € »',
    );
    expect(texte).not.toContain('« bordeaux »');
    expect(texte).not.toContain('1 250');
  });

  it('A1-13 · diagnostique un mauvais classement par la confusion qui le décrit, jamais par une suppression', () => {
    const attendus = attendusDe('B3-01-A1-13-TRI-ANOMALIES');
    const confusionsDe = (categorie: string) =>
      new Set(
        attendus
          .filter(({ categorieId }) => categorieId === categorie)
          .map(({ confusionSiErreur }) => confusionSiErreur),
      );

    expect(confusionsDe('faux-automatique')).toEqual(
      new Set(['correction-certaine-renvoyee-a-un-humain']),
    );
    expect(confusionsDe('faux-humain')).toEqual(
      new Set(['suspect-corrige-sans-validation']),
    );
    expect(remediationDe('correction-certaine-renvoyee-a-un-humain')).toBe(
      'B3-01-A1-10-COURS-GRILLE',
    );
  });

  it('A1-10 et A1-13 · retirent le doublon exact par Supprimer les doublons, sans le corriger par formule', () => {
    const [fauxAutomatique] = explicationsDe('B3-01-A1-13-TRI-ANOMALIES');

    for (const texte of [
      texteDe('B3-01-A1-10-COURS-GRILLE'),
      fauxAutomatique,
    ]) {
      expect(texte).toContain(
        'le doublon exact se retire par Supprimer les doublons',
      );
    }
  });

  it('A1-14 · fait effacer le filtre de l’exercice 2 avant de copier l’onglet Commandes', () => {
    expect(texteDe('B3-01-A1-14-ATELIER-NETTOYAGE')).toContain(
      'effacez d’abord le filtre de l’exercice 2',
    );
  });

  it('A1-14 · chiffre la part douteuse sur les lignes uniques, hors doublons : environ 15 %', () => {
    const aVerifier = explicationsDe('B3-01-A1-14-ATELIER-NETTOYAGE').at(-1);

    expect(aVerifier).toContain('614 des 4 098 lignes uniques');
    expect(aVerifier).toContain('environ 15 %');
    expect(aVerifier).not.toContain('16 %');
  });

  it('A1-07 · rattache les dates, les mesures et le booléen à la confusion de type, n_commande à ses chiffres', () => {
    const attendus = attendusDe('B3-01-A1-07-TRI-COLONNES');
    const horsIdentifiants = attendus.filter(
      ({ categorieId }) => !['identifiant', 'categorie'].includes(categorieId),
    );

    expect(horsIdentifiants).toHaveLength(7);
    expect(
      horsIdentifiants.filter(
        ({ confusionSiErreur }) =>
          confusionSiErreur !== 'type-de-variable-confondu',
      ),
    ).toEqual([]);
    expect(texteDe('B3-01-A1-07-TRI-COLONNES')).not.toMatch(
      /écri(?:t|vent) en chiffres/,
    );
  });

  it('A1-08 · fait voter la granularité avant de compter les lignes de la commande témoin', () => {
    expect(
      questionsDe('B3-01-A1-08-ATELIER-GRANULARITE').map(({ id }) => id),
    ).toEqual(['b3-01-a1-granularite', 'b3-01-a1-lignes-commande']);
  });

  it('A1-11 · enseigne le comptage des valeurs distinctes que l’exercice 4 demande', () => {
    expect(texteDe('B3-01-A1-11-COURS-OUTILS')).toContain('Valeurs distinctes');
  });

  it('A1-12 · désigne l’espace insécable par UNICAR(160)', () => {
    const texte = texteDe('B3-01-A1-12-EXEMPLE-NETTOYAGE');

    expect(texte).toContain('UNICAR(160)');
    expect(texte).not.toMatch(/(?<!UNI)CAR\(160\)/);
  });

  it('A1-14 · range les colonnes nettoyées après la dernière colonne du brut, sans décaler la formule controle', () => {
    expect(texteDe('B3-01-A1-14-ATELIER-NETTOYAGE')).toContain(
      'en N et O, sans insérer de colonne',
    );
    expect(explicationsDe('B3-01-A1-14-ATELIER-NETTOYAGE')[3]).toContain(
      'Les formules N et O en corrigent 490 autres',
    );
  });

  it('A1-11 · fait coller en valeurs la colonne nettoyée avant d’en compter les valeurs distinctes', () => {
    const texte = texteDe('B3-01-A1-11-COURS-OUTILS');

    expect(texte).toContain(
      'collez-la en valeurs à part (Collage spécial › Valeurs)',
    );
    expect(texte).not.toContain('sur une colonne copiée à part');
    expect(texte).toContain('par-dessus la donnée brute');
  });

  it('A1-08 · fait effacer le filtre dès sa correction, pour que les écrans suivants lisent tout l’onglet', () => {
    expect(explicationsDe('B3-01-A1-08-ATELIER-GRANULARITE').at(-1)).toContain(
      'Effacez ensuite le filtre',
    );
  });

  it('A1-08 · annonce au futur les doublons que l’exercice 4 retirera', () => {
    const [granularite] = explicationsDe('B3-01-A1-08-ATELIER-GRANULARITE');

    expect(granularite).not.toContain('vues à l’exercice 4');
    expect(granularite).toContain('que l’exercice 4 retirera');
  });

  it('A1-11 · illustre NOMPROPRE sur une ville en capitales, sans la prêter à E2', () => {
    const texte = texteDe('B3-01-A1-11-COURS-OUTILS');

    expect(texte).not.toContain('NOMPROPRE(E2) écrit');
    expect(texte).not.toMatch(/NOMPROPRE\(E2\)[^.;]*BORDEAUX/u);
    expect(texte).toContain(
      'NOMPROPRE met une majuscule initiale, « BORDEAUX » devient « Bordeaux »',
    );
  });

  it('A1-04 · ne prétend pas qu’une seule colonne de contrôle mesure la part douteuse', () => {
    expect(
      libelleDeConfusion('part-douteuse-estimee-sans-mesure'),
    ).not.toContain('colonne de contrôle');
  });

  it('A1-13 · n’annonce en piège aucune suppression, que le tri ne propose pas', () => {
    expect(texteDe('B3-01-A1-13-TRI-ANOMALIES')).not.toContain(
      'supprimer une ligne',
    );
  });

  it('A1-14 · recompose la part douteuse : contrôle, formules, défi et lignes hors contrôle', () => {
    const aVerifier = explicationsDe('B3-01-A1-14-ATELIER-NETTOYAGE').at(-1);
    const corrigeesParFormule = ANOMALIES_SEMEES.F1 + ANOMALIES_SEMEES.F2;
    const horsControle = ANOMALIES_SEMEES.H1 + ANOMALIES_SEMEES.S3;

    expect(
      VALEURS_B3_01['b3-01-a1-a-verifier'] +
        corrigeesParFormule +
        ANOMALIES_SEMEES.F4 +
        horsControle,
    ).toBe(614);
    expect(aVerifier).toContain(`en corrigent ${corrigeesParFormule} autres`);
    expect(aVerifier).toContain(`${ANOMALIES_SEMEES.F4} ca_ht mal calculés`);
    expect(aVerifier).toContain(`${horsControle} échappent au contrôle`);
  });

  it('A1-04 et A1-06 · laissent au métier les raisons sociales en double, que le tri A1-13 classe suspectes', () => {
    const revelation = texteDe('B3-01-A1-04-VOTE-PART-ET-CLE');
    const relations = texteDe('B3-01-A1-06-COURS-RELATIONS');

    expect(revelation).toContain('doublon ou deux établissements');
    expect(revelation).not.toContain('clients saisis deux fois');
    expect(revelation).not.toContain('ne se trompe pas');
    expect(relations).not.toContain('ne se trompe pas');
    expect(relations).toContain('des clients peut-être saisis deux fois');
    expect(
      attendusDe('B3-01-A1-13-TRI-ANOMALIES').find(
        ({ carteId }) => carteId === 'client-en-double',
      )?.categorieId,
    ).toBe('suspect-humain');
  });

  it('A1-13 · nomme le champ fautif du ca_ht mal calculé, que la formule corrige seule', () => {
    expect(texteDe('B3-01-A1-13-TRI-ANOMALIES')).toContain(
      'ca_ht saisi sans appliquer la remise de la ligne',
    );
  });

  it('A1-14 · diagnostique le contrôle posé sur les dates converties par la formule du défi, puis par DATEVAL sur toute date en texte', () => {
    const aVerifier = explicationsDe('B3-01-A1-14-ATELIER-NETTOYAGE').at(-1);
    const pieges = PIEGES_B3_01['b3-01-a1-a-verifier'];
    const apresLeDefi = pieges['controle-apres-correction'] ?? Number.NaN;
    const apresDatevalPartout =
      pieges['suspect-corrige-sans-validation'] ?? Number.NaN;
    const datesMalLues = apresLeDefi - apresDatevalPartout;

    expect(apresLeDefi).toBe(
      VALEURS_B3_01['b3-01-a1-a-verifier'] - ANOMALIES_SEMEES.F5,
    );
    expect(aVerifier).toContain(
      `Recalculé sur les dates converties, le contrôle perd les ${ANOMALIES_SEMEES.F5} dates ISO : ${apresLeDefi}.`,
    );
    expect(aVerifier).toContain(
      `DATEVAL sur toute date en texte lui ôte aussi ${datesMalLues} des ${ANOMALIES_SEMEES.S1} dates d’un autre système, lues jour d’abord : ${apresDatevalPartout}.`,
    );
    expect(aVerifier).not.toContain('au format jj/mm/aa');
    expect(aVerifier).not.toContain('corrigé seul des dates douteuses');
  });

  it('A1-14 · renvoie le contrôle posé après correction à la règle de A1-11 : la donnée brute reste jusqu’au contrôle', () => {
    expect(confusionsDeLaChiffree('b3-01-a1-a-verifier')).toEqual([
      'suspect-corrige-sans-validation',
      'controle-apres-correction',
    ]);
    expect(remediationDe('controle-apres-correction')).toBe(
      'B3-01-A1-11-COURS-OUTILS',
    );
    expect(texteDe('B3-01-A1-11-COURS-OUTILS')).toContain(
      'On ne colle en valeurs par-dessus la donnée brute qu’une fois le contrôle lui-même figé en valeurs : c’est une formule, il se recalculerait sur les données corrigées.',
    );
    expect(libelleDeConfusion('controle-apres-correction')).not.toContain(
      'émetteur',
    );
  });

  it('A1-14 · diagnostique les lignes restantes comptées avec l’en-tête, comme le NBVAL de la quarantaine en A3-09', () => {
    expect(confusionsDeLaChiffree('b3-01-a1-lignes-uniques')).toEqual([
      'doublons-supprimes-sur-une-colonne',
      'en-tete-compte-comme-ligne',
    ]);
    expect(
      PIEGES_B3_01['b3-01-a1-lignes-uniques']['en-tete-compte-comme-ligne'],
    ).toBe(VALEURS_B3_01['b3-01-a1-lignes-uniques'] + 1);
    expect(explicationsDe('B3-01-A1-14-ATELIER-NETTOYAGE')[0]).toContain(
      'Lire le numéro de la dernière ligne compte aussi l’en-tête : 4 099.',
    );
  });

  it('A2-07 · diagnostique le délai compté sans retirer le jour de la commande, et ne le dit qu’à la correction des retards, la dernière qu’il fausse', () => {
    const [mediane, retards] = explicationsDe(
      'B3-01-A2-07-ATELIER-DELAIS-MARGE',
    );

    expect(confusionsDeLaChiffree('b3-01-a2-delai-strasbourg')).toEqual([
      'jours-calendaires-pour-ouvres',
      'valeur-extreme-ignoree',
      'bornes-comptees-dans-le-delai',
      'periode-mal-delimitee',
      'mediane-sur-liste-filtree',
    ]);
    expect(confusionsDeLaChiffree('b3-01-a2-retards')).toEqual([
      'jours-calendaires-pour-ouvres',
      'bornes-comptees-dans-le-delai',
    ]);
    expect(
      PIEGES_B3_01['b3-01-a2-delai-strasbourg'][
        'bornes-comptees-dans-le-delai'
      ],
    ).toBe(VALEURS_B3_01['b3-01-a2-delai-strasbourg'] + 1);
    expect(mediane).not.toContain('Sans le − 1');
    expect(retards).toContain(
      'Une ligne est en retard quand date_livraison dépasse SERIE.JOUR.OUVRE(date_commande;5), soit quand son delai dépasse 5 : 99 lignes commandées en 2026.',
    );
    expect(retards).toContain(
      'Sans le − 1, la colonne delai compte aussi le jour de la commande : au critère ">5", 284 lignes, livrées le jour promis comprises, et une médiane de Strasbourg de 9 jours.',
    );
  });

  it('A2-07 · diagnostique la médiane de Strasbourg prise sur toute la table, ou par MEDIANE sous un filtre, qui compte les lignes masquées', () => {
    const [mediane, , tauxDeMarque] = explicationsDe(
      'B3-01-A2-07-ATELIER-DELAIS-MARGE',
    );

    expect(PIEGES_B3_01['b3-01-a2-delai-strasbourg']).toMatchObject({
      'periode-mal-delimitee': 4,
      'mediane-sur-liste-filtree': 3,
    });
    expect(libelleDeConfusion('mediane-sur-liste-filtree')).toContain(
      'lignes masquées',
    );
    expect(remediationDe('mediane-sur-liste-filtree')).toBe(
      'B3-01-A2-06-COURS-TEMPS-STATS',
    );
    expect(mediane).toContain(
      'Sous un filtre, MEDIANE compte aussi les lignes masquées et rend la médiane de toute la colonne : AGREGAT(12;5;plage) ne garde que les lignes visibles.',
    );
    expect(mediane).not.toContain('Toutes années confondues');
    expect(tauxDeMarque).toContain(
      'Toutes années confondues, la médiane de Strasbourg de la première question tombe à 4 jours.',
    );
  });

  it('A2-07 · fait montrer le critère 2026 des retards, que toute la table ne trahit pas faute de retard en 2025', () => {
    expect(texteDe('B3-01-A2-07-ATELIER-DELAIS-MARGE')).toContain(
      'Retards : 2025 n’a aucun retard, et toute la table donne le même compte que 2026 : faire montrer le critère 2026.',
    );
  });

  it('A2-07 et A3-09 · diagnostiquent le taux de marque pris sur toute la table, et ne le disent qu’à la dernière correction qu’il fausse', () => {
    const [, ca2026, margeMarseille] = explicationsDe(
      'B3-01-A3-09-ATELIER-DASHBOARD',
    );

    for (const id of ['b3-01-a2-taux-marge', 'b3-01-a3-marge-marseille']) {
      expect(confusionsDeLaChiffree(id)).toEqual([
        'moyenne-simple-des-taux',
        'marque-confondue-avec-marge',
        'periode-mal-delimitee',
      ]);
    }
    expect(explicationsDe('B3-01-A2-07-ATELIER-DELAIS-MARGE')[2]).toContain(
      'Sur toute la table, 2025 compris, le même rapport donne 32,3 %.',
    );
    expect(ca2026).not.toContain('Toute la table');
    expect(margeMarseille).toContain(
      'Toute la table, 2025 compris, mêle deux années : 1 313 125 € de CA à la deuxième question, 29,8 % de taux de marque ici.',
    );
  });

  it('A2-11 · diagnostique la part lue en % de la colonne, ou sans le filtre annee par la confusion du TCD, et ne dit le filtre oublié qu’à la correction du trimestre', () => {
    const [part, trimestre] = explicationsDe('B3-01-A2-11-ATELIER-TCD');

    expect(confusionsDeLaChiffree('b3-01-a2-part-info-rennes')).toEqual([
      'pourcentage-du-mauvais-total',
      'pourcentage-du-total-de-colonne',
      'tcd-filtre-ou-dates-mal-groupees',
    ]);
    expect(libelleDeConfusion('tcd-filtre-ou-dates-mal-groupees')).toContain(
      'dont un filtre manque ou reste actif',
    );
    expect(remediationDe('pourcentage-du-total-de-colonne')).toBe(
      'B3-01-A2-09-COURS-TCD',
    );
    expect(part).toContain(
      'en % du total de la colonne, 3,8 % : la part de Rennes dans l’informatique du réseau.',
    );
    expect(part).not.toContain('filtre');
    expect(trimestre).toContain(
      'Oublié au premier TCD, le filtre annee mêle à l’inverse 2025 et 2026 : l’informatique y pèse 33,9 % du CA de Rennes.',
    );
  });

  it('A1-14 · désigne le vote sur le fichier, et non le premier vote de la séance, qui est le rappel', () => {
    const atelier = texteDe('B3-01-A1-14-ATELIER-NETTOYAGE');

    expect(atelier).toContain(
      'la première question du vote sur le fichier et Dupont, Bordeaux',
    );
    expect(atelier).not.toContain('premier vote de la séance');
    expect(atelier).not.toContain('vote d’ouverture');
  });

  it('A1-11 et A1-14 · réservent DATEVAL aux dates ISO, seules à 10 caractères, et laissent en texte la date d’un autre système', () => {
    const formule = '=SI(NBCAR(B2)=10;DATEVAL(B2);B2)';
    const cours = texteDe('B3-01-A1-11-COURS-OUTILS');
    const atelier = texteDe('B3-01-A1-14-ATELIER-NETTOYAGE');

    expect(cours).toContain(formule);
    expect(cours).toContain('Date ISO en texte « 2026-03-17 »');
    expect(cours).toContain('« 08/04/26 » reste à vérifier');
    expect(atelier).toContain(formule);
    for (const texte of [cours, atelier]) {
      expect(texte).not.toContain('ESTTEXTE(B2);DATEVAL(B2)');
    }
  });

  it('A1-13 et A1-14 · citent la date venue d’un autre système telle qu’elle est au brut, en B3785', () => {
    const tri = texteDe('B3-01-A1-13-TRI-ANOMALIES');
    const atelier = texteDe('B3-01-A1-14-ATELIER-NETTOYAGE');

    expect(tri).toContain('Date « 08/04/26 » venue d’un autre système');
    expect(tri).toContain('8 avril ou 4 août ? Seul l’émetteur le sait');
    expect(tri).toContain('Lire « 08/04/26 » jour d’abord');
    expect(atelier).toContain(
      '« 08/04/26 » (commande C-11481 : ligne 3785 du brut, 3741 de la copie dédoublonnée)',
    );
    for (const texte of [tri, atelier]) {
      expect(texte).not.toMatch(/05\/04\/26|04\/05\/26/u);
    }
  });

  it('A1-11 et A1-14 · font cocher « Mes données ont des en-têtes » pour ne pas compter l’en-tête parmi les villes', () => {
    expect(texteDe('B3-01-A1-11-COURS-OUTILS')).toContain(
      'case « Mes données ont des en-têtes » cochée',
    );
    expect(texteDe('B3-01-A1-14-ATELIER-NETTOYAGE')).toContain(
      'case « Mes données ont des en-têtes » cochée',
    );
  });

  it('A1-11 et A1-14 · ouvrent UNIQUE dès Excel 2021, et Power Query sous Windows ou avec 365 sur Mac', () => {
    const outils = texteDe('B3-01-A1-11-COURS-OUTILS');

    expect(outils).toContain(
      'Sous Windows depuis Excel 2016, ou sur Mac avec 365 : Power Query',
    );
    expect(outils).not.toContain('Si vous avez Excel 365');
    expect(texteDe('B3-01-A1-14-ATELIER-NETTOYAGE')).toContain(
      'sous Excel 2021 ou 365, =NBVAL(UNIQUE(N2:N4099))',
    );
  });

  it('A1-05 · dit que la ligne d’en-tête n’est pas une observation', () => {
    expect(texteDe('B3-01-A1-05-COURS-DONNEE')).toContain(
      'une ligne d’en-tête, qui n’est pas une observation',
    );
  });

  it('ne fait commencer aucune correction par la question la moins réussie, que le moteur dévoile dans l’ordre', () => {
    const fautifs = COURS_B3_01.ecrans
      .filter(({ screenId }) =>
        texteDe(screenId).includes('en commençant par la moins réussie'),
      )
      .map(({ screenId }) => screenId);

    expect(fautifs).toEqual([]);
  });
});

describe('B3-01 — actes 2 et 3 : consignes et corrections exactes', () => {
  it('A2-02 · range SI.CONDITIONS dans le socle, puisqu’il existe depuis Excel 2019', () => {
    expect(texteDe('B3-01-A2-02-FAMILLES')).toContain(
      '"socle":"SI, ET, OU, SI.CONDITIONS"',
    );
  });

  it('A2-03 · fige les plages du modèle INDEX et EQUIV, pour que la recopie sans $ montre l’erreur', () => {
    const texte = texteDe('B3-01-A2-03-COURS-CHERCHER-AGREGER');

    expect(texte).toContain(
      '=INDEX(Produits!$C$2:$C$41;EQUIV(H2;Produits!$A$2:$A$41;0))',
    );
    expect(texte).not.toMatch(/Produits!\$?[A-Z]:/);
  });

  it('A2-04 · décrit la recherche non figée telle qu’elle glisse : la seule ligne Ouest trouvée date de 2025', () => {
    const [, , ouest] = explicationsDe('B3-01-A2-04-ATELIER-RECHERCHE');

    expect(ouest).not.toContain('aucune ne porte Ouest');
    expect(ouest).toContain('date de 2025');
  });

  it('A2-05 · pose le contrat en jours ouvrés dans le vote et des options dans la même unité', () => {
    expect(texteDe('B3-01-A2-05-VOTE-DELAI')).toContain(
      'Le contrat de Norvane compte les délais en jours ouvrés',
    );
    expect(
      libellesDuVote('b3-01-a2-delai').filter(
        (libelle) => !libelle.includes('ouvré'),
      ),
    ).toEqual([]);
  });

  it('A2-08 · borne la plage fixe à la dernière ligne de la reprise', () => {
    const derniereLigne =
      VALEURS_B3_01['b3-01-a1-lignes-uniques'] -
      VALEURS_B3_01['b3-01-a3-quarantaine'] +
      1;
    const texte = texteDe('B3-01-A2-08-VOTE-NOUVELLES-LIGNES');

    expect(texte).toContain(`A2:A${derniereLigne}`);
    expect(texte).not.toContain('A2:A4001');
  });

  it('A3-02 · renvoie au graphique de l’écran précédent et chiffre l’écart affiché', () => {
    const ecart = Math.round(
      (1 -
        HISTOIRES_B3_01['ca-2025-rennes'] / HISTOIRES_B3_01['ca-2025-nantes']) *
        100,
    );
    const texte = texteDe('B3-01-A3-02-VOTE-GRAPHIQUE');

    expect(texte).toContain('le graphique de l’écran précédent');
    expect(texte).toContain(`environ ${ecart} % de moins`);
    expect(ecart).toBe(13);
  });

  it('A3-07 · ne promet aux segments que les TCD et leurs graphiques', () => {
    const texte = texteDe('B3-01-A3-07-COURS-DASHBOARD');

    expect(texte).not.toContain('toute la page');
    expect(texte).toContain('tous les TCD connectés et leurs graphiques');
  });

  it('A3-08 · démontre au pupitre sur une feuille décrite, sans supposer celle de l’étudiant', () => {
    const texte = texteDe('B3-01-A3-08-EXEMPLE-MFC-SEGMENTS');

    expect(texte).not.toContain('de l’exercice 9');
    expect(texte).toContain('au pupitre');
    expect(texte).toContain('deux TCD');
  });

  it('A3-10 · chiffre chaque histoire sur sa période et donne à chacune constat, cause et action', () => {
    const [marseille, rennes, ...suite] = explicationsDe(
      'B3-01-A3-10-RECOMMANDATIONS',
    );

    expect(marseille).toContain(
      `${feuille.enFrancais(HISTOIRES_B3_01['taux-de-marge-marseille-2025'], 1)} % de janvier à septembre 2025`,
    );
    expect(rennes).toContain('par rapport à la même période de 2025');
    for (const histoire of [marseille, rennes, ...suite]) {
      expect(histoire).toContain('Cause :');
      expect(histoire).toContain('Action :');
    }
  });

  it('A2-01 · rattache les familles mal nommées à la confusion de la famille', () => {
    expect(confusionsDuVote('B3-01-A2-01-VOTE-FAMILLE')).toEqual([
      null,
      'famille-de-probleme-mal-nommee',
      'famille-de-probleme-mal-nommee',
      'periode-mal-delimitee',
    ]);
    expect(remediationDe('famille-de-probleme-mal-nommee')).toBe(
      'B3-01-A2-02-FAMILLES',
    );
  });

  it('A2-04 · donne au total nul ses deux causes à la dernière question, sans souffler la recherche non figée à la première', () => {
    const [rennes, , ouest] = explicationsDe('B3-01-A2-04-ATELIER-RECHERCHE');

    expect(rennes).not.toContain('sans $');
    expect(rennes).not.toContain('guillemets');
    expect(ouest).toContain(
      'Le même glissement vide la colonne categorie : à la première question aussi, 0 €',
    );
    expect(ouest).toContain(
      'Un critère de date écrit tout entier entre guillemets ne compare qu’à un texte : 0 €, ici comme à la première question',
    );
    expect(ouest).toContain(
      'Avant la ligne 14, la seule ligne Ouest trouvée, la ligne 2, date de 2025',
    );
  });

  it('A2-05 · propose le délai de NB.JOURS.OUVRES sans le − 1, diagnostiqué comme tel', () => {
    expect(libellesDuVote('b3-01-a2-delai')).toContain('2 jours ouvrés');
    expect(confusionsDuVote('B3-01-A2-05-VOTE-DELAI')).toEqual([
      null,
      'jours-calendaires-pour-ouvres',
      'bornes-comptees-dans-le-delai',
    ]);
    expect(remediationDe('bornes-comptees-dans-le-delai')).toBe(
      'B3-01-A2-06-COURS-TEMPS-STATS',
    );
  });

  it('A2-06, A2-07, A3-09 et A3-10 · nomment taux de marque la marge rapportée au CA HT, et piègent le taux de marge', () => {
    for (const ecran of [
      'B3-01-A2-06-COURS-TEMPS-STATS',
      'B3-01-A2-07-ATELIER-DELAIS-MARGE',
      'B3-01-A3-09-ATELIER-DASHBOARD',
      'B3-01-A3-10-RECOMMANDATIONS',
    ]) {
      expect(texteDe(ecran)).toMatch(/[Tt]aux de marque/);
    }
    for (const id of [
      'b3-01-a2-taux-marge',
      'b3-01-a3-marge-marseille',
    ] as const) {
      expect(enonceDe(id)).toContain('taux de marque');
      expect(enonceDe(id)).toContain('marge ÷ CA HT');
      expect(Object.keys(PIEGES_B3_01[id])).toContain(
        'marque-confondue-avec-marge',
      );
    }
    expect(remediationDe('marque-confondue-avec-marge')).toBe(
      'B3-01-A2-06-COURS-TEMPS-STATS',
    );
  });

  it('A2-11 · diagnostique un trimestre mal lu par la confusion du TCD, qui renvoie à sa trace', () => {
    expect(confusionsDuVote('B3-01-A2-11-ATELIER-TCD')).toEqual([
      null,
      'tcd-filtre-ou-dates-mal-groupees',
      'tcd-filtre-ou-dates-mal-groupees',
    ]);
    expect(remediationDe('tcd-filtre-ou-dates-mal-groupees')).toBe(
      'B3-01-A2-09-COURS-TCD',
    );
  });

  it('A3-01 · trace Rennes environ trois fois plus bas que Nantes, comme le dit le commentaire du collègue', () => {
    const { axisRanges } = feuille.proprietesV2(
      COURS_B3_01,
      'B3-01-A3-01-GRAPHIQUE-TROMPEUR',
    );
    const [[debut, fin]] = axisRanges as [[number, number]];
    const hauteur = (valeur: number): number =>
      (valeur - debut) / (fin - debut);
    const rapport =
      hauteur(HISTOIRES_B3_01['ca-2025-nantes']) /
      hauteur(HISTOIRES_B3_01['ca-2025-rennes']);

    expect(rapport).toBeGreaterThan(2.5);
    expect(rapport).toBeLessThan(3.5);
    expect(debut).toBe(47_500);
    expect(texteDe('B3-01-A3-02-VOTE-GRAPHIQUE')).toContain(
      'L’axe part de 47 500 €',
    );
  });

  it('A3-04 · nomme l’histogramme par la répartition et ne diagnostique aucune carte par un camembert absent', () => {
    expect(texteDe('B3-01-A3-04-TRI-GRAPHIQUES')).toContain(
      'Histogramme (répartition par tranches)',
    );
    expect(
      attendusDe('B3-01-A3-04-TRI-GRAPHIQUES').map(
        ({ confusionSiErreur }) => confusionSiErreur,
      ),
    ).not.toContain('camembert-pour-evolution');
  });

  it('A3-05 · relie T_Commandes et Objectifs à Agences, la seule table aux identifiants uniques', () => {
    const texte = texteDe('B3-01-A3-05-ATELIER-GRAPHIQUES');

    expect(texte).toContain(
      'relier T_Commandes et T_Objectifs à T_Agences par agence_id',
    );
    expect(texte).not.toContain('relie les deux tables');
  });

  it('A2-09 et A3-05 · nomment chaque table avant de la relier, et disent quels champs mettre en valeurs', () => {
    const tcd = texteDe('B3-01-A2-09-COURS-TCD');
    const atelier = texteDe('B3-01-A3-05-ATELIER-GRAPHIQUES');

    expect(tcd).toContain(
      'Création de tableau (Tableau sur Mac) › Nom du tableau',
    );
    expect(tcd).toContain('Agences en tableau T_Agences');
    expect(atelier).toContain(
      'mettre Agences et Objectifs sous forme de tableau, nommés T_Agences et T_Objectifs',
    );
    expect(atelier).toContain('agence_id de T_Agences en lignes');
    expect(atelier).toContain(
      'ca_ht de T_Commandes et objectif_ca_ht de T_Objectifs en valeurs',
    );
  });

  it('A3-03 · distingue l’histogramme de répartition de l’« histogramme groupé » du ruban', () => {
    const graphiques = texteDe('B3-01-A3-03-COURS-GRAPHIQUES');

    expect(graphiques).toContain('Insertion › Graphique statistique');
    expect(graphiques).toContain('l’« histogramme groupé » d’Excel');
  });

  it('A2-02 · ne donne de variante qu’aux familles qui en ont une, distincte du socle', () => {
    const { rows } = feuille.proprietesV2(COURS_B3_01, 'B3-01-A2-02-FAMILLES');
    const lignes = rows as readonly { socle: string; variante: string }[];

    expect(
      lignes
        .filter(({ socle, variante }) => socle.split(', ').includes(variante))
        .map(({ variante }) => variante),
    ).toEqual([]);
    expect(lignes.filter(({ variante }) => variante === '—')).toHaveLength(5);
  });

  it.each([
    ['A2-09', 'B3-01-A2-09-COURS-TCD'],
    ['A3-05', 'B3-01-A3-05-ATELIER-GRAPHIQUES'],
  ])(
    '%s · réserve le modèle de données à Excel sous Windows, absent d’Excel pour Mac',
    (_ecran, screenId) => {
      const texte = texteDe(screenId);

      expect(texte).toContain('Windows');
      expect(texte).toContain('Excel 2019, 2021 ou 365');
      expect(texte).toMatch(
        /Sur Mac, (le modèle de données n’existe pas|absent)/u,
      );
      expect(texte).not.toContain('Si vous avez Excel 365');
    },
  );

  it('A3-06 · diagnostique chaque option par l’erreur qu’elle commet', () => {
    expect(confusionsDuVote('B3-01-A3-06-VOTE-TRENTE-SECONDES')).toEqual([
      null,
      'detail-au-lieu-de-synthese',
      'graphique-sans-question',
      'kpi-sans-contexte',
    ]);
    expect(remediationDe('detail-au-lieu-de-synthese')).toBe(
      'B3-01-A3-07-COURS-DASHBOARD',
    );
  });

  it('A3-07 · enseigne l’objectif cumulé sur les mêmes mois, que l’exercice 9 demande', () => {
    expect(texteDe('B3-01-A3-07-COURS-DASHBOARD')).toContain(
      'l’objectif cumulé sur les mêmes mois',
    );
  });

  it('A3-08 · fait ressortir les agences sous 95 % de leur objectif, pas « en retard »', () => {
    const texte = texteDe('B3-01-A3-08-EXEMPLE-MFC-SEGMENTS');

    expect(texte).not.toContain('en retard');
    expect(texte).toContain(
      'Faites ressortir les agences sous 95 % de leur objectif',
    );
  });

  it('A3-05 · met Agences et Objectifs en tableau et filtre chaque table, car un filtre ne passe pas d’une table à l’autre', () => {
    const texte = texteDe('B3-01-A3-05-ATELIER-GRAPHIQUES');

    expect(texte).toContain(
      'mettre Agences et Objectifs sous forme de tableau',
    );
    expect(texte).toContain('un filtre ne passe pas d’une table à l’autre');
    expect(texte).toContain('mois de T_Objectifs de janvier à septembre 2026');
  });

  it('A3-05 · ne souffle pas à la première correction le piège des vingt et un mois, seul piège de la seconde', () => {
    const [agences, rennes] = explicationsDe('B3-01-A3-05-ATELIER-GRAPHIQUES');

    expect(agences).not.toContain('vingt et un mois');
    expect(agences).not.toContain('additionne');
    expect(rennes).toContain(
      'qui additionne ses objectifs mensuels de janvier à septembre 2026',
    );
    expect(rennes).toContain('vingt et un mois');
    expect(rennes).toContain('dans les 12 agences');
  });

  it('A3-05 · diagnostique la période oubliée des deux côtés, et ne la dit qu’à la correction de Rennes', () => {
    const [agences, rennes] = explicationsDe('B3-01-A3-05-ATELIER-GRAPHIQUES');

    for (const id of [
      'b3-01-a3-agences-sous-objectif',
      'b3-01-a3-atteinte-rennes',
    ]) {
      expect(confusionsDeLaChiffree(id)).toEqual([
        'objectif-annuel-pour-cumul',
        'periode-mal-delimitee',
      ]);
    }
    expect(agences).not.toContain('critère de date');
    expect(rennes).toContain(
      'Sans critère de date, ni sur les ventes ni sur les objectifs, vingt et un mois face à vingt et un mois : 7 agences sous l’objectif, et Rennes à 90,8 %.',
    );
  });

  it('A3-09 · pose l’évolution avant le CA cumulé, dont la correction donne le numérateur', () => {
    expect(
      questionsDe('B3-01-A3-09-ATELIER-DASHBOARD').map(({ id }) => id),
    ).toEqual([
      'b3-01-a3-evolution',
      'b3-01-a3-ca-2026',
      'b3-01-a3-marge-marseille',
      'b3-01-a3-quarantaine',
    ]);
  });

  it('A3-09 · compte la quarantaine hors en-tête et piège le NBVAL de la colonne entière', () => {
    expect(enonceDe('b3-01-a3-quarantaine')).toContain('hors en-tête');
    expect(PIEGES_B3_01['b3-01-a3-quarantaine']).toEqual({
      'en-tete-compte-comme-ligne': VALEURS_B3_01['b3-01-a3-quarantaine'] + 1,
    });
    expect(remediationDe('en-tete-compte-comme-ligne')).toBe(
      'B3-01-A1-05-COURS-DONNEE',
    );
  });

  it('A3-09 · explique l’écart entre les lignes à vérifier de l’exercice 4 et la quarantaine', () => {
    const quarantaine = explicationsDe('B3-01-A3-09-ATELIER-DASHBOARD').at(-1);

    expect(
      VALEURS_B3_01['b3-01-a1-a-verifier'] -
        ANOMALIES_SEMEES.F5 +
        ANOMALIES_SEMEES.H1 +
        ANOMALIES_SEMEES.S3,
    ).toBe(VALEURS_B3_01['b3-01-a3-quarantaine']);
    expect(quarantaine).toContain(
      `les ${VALEURS_B3_01['b3-01-a1-a-verifier']} lignes « À vérifier » de l’exercice 4, moins les ${ANOMALIES_SEMEES.F5} dates ISO`,
    );
    expect(quarantaine).toContain(
      `plus ${ANOMALIES_SEMEES.H1} produits inconnus et ${ANOMALIES_SEMEES.S3} prix hors norme`,
    );
  });

  it('A2-09 · met Agences en tableau avant de la relier, et rappelle qu’un filtre reste actif', () => {
    const texte = texteDe('B3-01-A2-09-COURS-TCD');

    expect(texte).toContain('Agences en tableau');
    expect(texte).toContain(
      'un filtre reste actif tant qu’on ne l’a pas retiré',
    );
  });

  it('A2-09 et A3-05 · disent où relier les tables, et où cocher le modèle de données', () => {
    const tcd = texteDe('B3-01-A2-09-COURS-TCD');

    expect(tcd).toContain('Données › Relations');
    expect(tcd).toContain(
      'le TCD, créé avec « Ajouter ces données au modèle de données », prend region dans T_Agences',
    );
    expect(texteDe('B3-01-A3-05-ATELIER-GRAPHIQUES')).toContain(
      'Données › Relations',
    );
  });

  it('A2-02 · date chaque variante : Power Query dès Excel 2016 sous Windows, les autres dès Excel 2021', () => {
    const texte = texteDe('B3-01-A2-02-FAMILLES');

    expect(texte).toContain(
      'Power Query : Windows dès Excel 2016, Mac avec 365',
    );
    expect(texte).toContain(
      'RECHERCHEX, TRIER, FILTRE et UNIQUE : Excel 2021 ou 365',
    );
    expect(texte).not.toContain('Avec Excel 2021 ou 365');
  });

  it('A3-03 et A3-07 · donnent Caen pour un exemple hors dossier, sans souffler une histoire du comité', () => {
    const graphiques = texteDe('B3-01-A3-03-COURS-GRAPHIQUES');
    const dashboard = texteDe('B3-01-A3-07-COURS-DASHBOARD');

    expect(graphiques).toContain('hors dossier');
    expect(graphiques).not.toContain('92 %');
    expect(dashboard).toContain('hors dossier');
    expect(dashboard).not.toMatch(/transport|délai|mars/);
  });

  it('A3-10 · date les ruptures de Strasbourg d’avril à juillet, livrées environ deux mois plus tard', () => {
    const strasbourg = explicationsDe('B3-01-A3-10-RECOMMANDATIONS').at(-1);

    expect(strasbourg).toContain('ruptures de stock d’avril à juillet');
    expect(strasbourg).toContain('livrées environ deux mois plus tard');
  });

  it('A3-10 · fait révéler les quatre histoires ensemble, comme le fait la brique, puis les commenter une à une', () => {
    const texte = texteDe('B3-01-A3-10-RECOMMANDATIONS');

    expect(texte).toContain('les quatre histoires s’affichent ensemble');
    expect(texte).not.toContain('révéler les quatre histoires une à une');
    expect(texte).not.toContain('Révéler une histoire à la fois');
    expect(texte).not.toContain('coche');
  });

  it('A3-10 · date chaque action et la confie à quelqu’un, comme le veut la méthode de A3-07', () => {
    const actions = explicationsDe('B3-01-A3-10-RECOMMANDATIONS').map(
      (histoire) => histoire.split('Action :').at(1) ?? '',
    );

    expect(texteDe('B3-01-A3-07-COURS-DASHBOARD')).toContain(
      'l’action est précise, datée, et confiée à quelqu’un',
    );
    expect(texteDe('B3-01-A3-10-RECOMMANDATIONS')).toContain(
      'une action précise, datée, confiée à quelqu’un',
    );
    expect(actions).toHaveLength(4);
    for (const action of actions) {
      expect(action).toMatch(/(avant|d’ici|dès) /u);
      expect(action).toContain('confié au responsable de l’agence');
    }
  });

  it('A3-10 · dit au formateur que Rouen, troisième agence sous l’objectif, n’est pas une histoire', () => {
    expect(texteDe('B3-01-A3-10-RECOMMANDATIONS')).toContain('Rouen (91,9 %)');
  });

  it('A3-10 · décrit les catégories de Rennes et de Rouen telles que le jeu les fait évoluer', () => {
    const enPourcentEntier = (evolution: number): string => {
      const entier = Math.round(evolution);
      if (entier < 0) {
        return `−${-entier} %`;
      }
      return entier > 0 ? `+${entier} %` : '0 %';
    };
    const [, rennes] = explicationsDe('B3-01-A3-10-RECOMMANDATIONS');
    const texte = texteDe('B3-01-A3-10-RECOMMANDATIONS');

    expect(rennes).not.toContain('stables');
    expect(rennes).toContain(
      `les autres catégories bougent peu, de ${enPourcentEntier(HISTOIRES_B3_01['evolution-min-rennes-hors-informatique'])} à ${enPourcentEntier(HISTOIRES_B3_01['evolution-max-rennes-hors-informatique'])}`,
    );
    expect(texte).toContain(
      `en recul d’environ ${-Math.round(HISTOIRES_B3_01['evolution-rouen'])} % sur un an, de ${enPourcentEntier(HISTOIRES_B3_01['evolution-min-categorie-rouen'])} à ${enPourcentEntier(HISTOIRES_B3_01['evolution-max-categorie-rouen'])} selon la catégorie`,
    );
    expect(texte).not.toContain('dans toutes ses catégories');
  });

  it.each([
    ['A2-02', 'B3-01-A2-02-FAMILLES'],
    ['A2-03', 'B3-01-A2-03-COURS-CHERCHER-AGREGER'],
    ['A2-06', 'B3-01-A2-06-COURS-TEMPS-STATS'],
  ])(
    '%s · ouvre RECHERCHEX, UNIQUE et les formules matricielles dès Excel 2021',
    (_ecran, screenId) => {
      expect(texteDe(screenId)).not.toContain('Excel 365');
    },
  );
});
