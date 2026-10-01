import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import * as fiche from '../../../../../test/helpers/fiche-de-cours';
import * as feuille from '../../../../../test/helpers/feuille-de-cours';
import { arrondi } from '../../../../../test/helpers/lecture-de-cours';
import {
  colonnesVidesDeLaFeuille,
  valeursDevoileesAvantLeurEcran,
} from '../../../../../test/helpers/relecture-de-cours';
import type { CorrigeTableau } from '../../domain/cours/Corrige';
import {
  corrigerFeuille,
  corrigerTableau,
} from '../../domain/cours/CorrectionProduction';
import { COURS_B2_06 } from './b2-06.cours';

const COURS = buildCoursDuContenu(COURS_B2_06);

const VENTES_DE_JANVIER = 400;
const K_DES_VENTES = 0.06;
const MOIS_DE_JUIN = 5;
const DERNIER_MOIS_DE_LA_FEUILLE = 6;
const CAPACITE = 1000;
const BAISSE_DE_LA_MACHINE = 0.2;
const PART_DU_PRIX = 0.4;
const OBJECTIFS = [500, 600, 800, 1000, 1200, 1500] as const;

const PRIX_DE_GROS = [20, 25, 30, 35, 40, 45] as const;
const DEMANDES = [1100, 860, 670, 520, 410, 315] as const;
const A_DE_LA_DEMANDE = 2981;
const K_DE_LA_DEMANDE = -0.05;
const PRIX_PREVU = 38;
const DEMANDE_VISEE = 600;

const PRIX_DES_KITS = [1, 1.5, 2, 2.5, 3, 3.5] as const;
const DEMANDES_DES_KITS = [9.9, 7, 4.9, 3.5, 2.4, 1.7] as const;
const A_DES_KITS = 20;
const K_DES_KITS = -0.7;
const PRIX_DE_LA_FEUILLE = 4;
const PRIX_DE_L_ENIGME = 2.5;
const KITS_VISES = 4;
const KITS_PLANCHER = 2;
const CENTAINES = 100;
const DIZAINES = 10;

const ventes = (mois: number): number =>
  VENTES_DE_JANVIER * Math.exp(K_DES_VENTES * mois);
const ventesLuesCommeProduit = (mois: number): number =>
  VENTES_DE_JANVIER * Math.E * K_DES_VENTES * mois;
const ventesAuTauxK = (mois: number): number =>
  VENTES_DE_JANVIER * (1 + K_DES_VENTES) ** mois;
const premierEntier = (seuil: number): number => Math.ceil(seuil);

interface Droite {
  readonly pente: number;
  readonly ordonnee: number;
}

function droiteDesMoindresCarres(
  abscisses: readonly number[],
  ordonnees: readonly number[],
): Droite {
  const n = abscisses.length;
  const sx = abscisses.reduce((total, x) => total + x, 0);
  const sy = ordonnees.reduce((total, y) => total + y, 0);
  const sxy = abscisses.reduce((total, x, i) => total + x * ordonnees[i], 0);
  const sxx = abscisses.reduce((total, x) => total + x * x, 0);
  const pente = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { pente, ordonnee: (sy - pente * sx) / n };
}

const logarithmes = (valeurs: readonly number[]): number[] =>
  valeurs.map((valeur) => Math.log(valeur));

const DROITE_DES_KITS = droiteDesMoindresCarres(
  PRIX_DES_KITS,
  logarithmes(DEMANDES_DES_KITS),
);
const DROITE_INVERSEE_DES_KITS = droiteDesMoindresCarres(
  logarithmes(DEMANDES_DES_KITS),
  PRIX_DES_KITS,
);
const DROITE_AFFINE_DES_KITS = droiteDesMoindresCarres(
  PRIX_DES_KITS,
  DEMANDES_DES_KITS,
);

function corrigeDuTableauDesLogarithmes(): CorrigeTableau {
  const corrige = fiche.corrigeDe(COURS, 'b2-06-a3-tableau-logarithmes');
  if (corrige.type !== 'tableau') {
    throw new Error('l’exercice 5 n’a pas de corrigé de tableau');
  }
  return corrige;
}

fiche.decrireLaFicheDuCours('B2-06', COURS, {
  ...fiche.FICHE_DU_GABARIT_V3,
  conception: 'cours-b2-06-conception.md',
  ateliersNotes: ['A1-10 (10)', 'A2-05 (11)', 'A3-07 (10)'],
  remediations: 15,
  corrigesSurPlace: [
    'B2-06-A1-10-ATELIER-VENTES',
    'B2-06-A1-11-TABLEUR-VENTES',
    'B2-06-A2-05-ATELIER-SEUILS',
    'B2-06-A2-06-TABLEUR-OBJECTIFS',
    'B2-06-A3-06-TABLEAU-LOGARITHMES',
    'B2-06-A3-07-ATELIER-DEMANDE',
    'B2-06-A3-08-DEFI-IA',
    'B2-06-A4-02-TABLEUR-KITS',
    'B2-06-A4-03-COFFRE-KITS',
  ],
});

fiche.decrireLaMiniSituation('B2-06', COURS_B2_06, {
  donneesFictives: ['B2-06-A1-05-DOSSIER', 'B2-06-A4-01-SITUATION-KITS'],
  coffre: 'B2-06-A4-03-COFFRE-KITS',
  tableur: 'B2-06-A4-02-TABLEUR-KITS',
});

describe('B2-06 — textes relus contre les données', () => {
  it('annonce dans le dossier le modèle des ventes, la capacité de l’atelier et l’étude de prix', () => {
    const texte = feuille.texteDeLEcran(COURS_B2_06, 'B2-06-A1-05-DOSSIER');

    expect(texte).toContain('400e^(0,06x)');
    expect(texte).toContain('1 000 sacs');
    expect(texte).toContain('de 20 € à 45 €');
  });

  it('trace en courbe les six demandes relevées, sans leur logarithme', () => {
    const { labels, series } = feuille.proprietesV2(
      COURS_B2_06,
      'B2-06-A3-01-GRAPHIQUE',
    );

    expect(labels).toEqual(PRIX_DE_GROS.map((prix) => `${prix} €`));
    expect(series).toMatchObject([{ values: [...DEMANDES] }]);
  });

  it('donne à l’exercice 5 les mêmes prix et demandes que le graphique', () => {
    const ecran = fiche.ecranDuContenu(
      COURS_B2_06,
      'B2-06-A3-06-TABLEAU-LOGARITHMES',
    );
    if (ecran.brique !== 'fp-table-build') {
      throw new Error('l’exercice 5 n’est plus un tableau à construire');
    }

    expect(
      ecran.proprietes.plan.colonnes.map(({ cle, valeurs }) => [cle, valeurs]),
    ).toEqual([
      ['prix', [...PRIX_DE_GROS]],
      ['demande', [...DEMANDES]],
      ['z', undefined],
    ]);
  });

  it('rappelle dans la mini-situation le modèle retenu et l’unité des prix et des demandes', () => {
    const texte = feuille.texteDeLEcran(
      COURS_B2_06,
      'B2-06-A4-01-SITUATION-KITS',
    );

    expect(texte).toContain('f(x) = 20e^(−0,7x)');
    expect(texte).toContain('dizaines d’euros');
    expect(texte).toContain('centaines de kits');
  });
});

describe('B2-06 — recalcul des corrigés depuis les seuls paramètres', () => {
  it('recalcule les solutions et pièges des six questions numériques', () => {
    const seuilDeCapacite =
      Math.log(CAPACITE / VENTES_DE_JANVIER) / K_DES_VENTES;
    const seuilDeLaMachine =
      Math.log(PART_DU_PRIX) / Math.log(1 - BAISSE_DE_LA_MACHINE);
    const partVisee = DEMANDE_VISEE / A_DE_LA_DEMANDE;

    fiche.attendreLesNumeriques(COURS, {
      'b2-06-a1-ventes': [
        ventes(MOIS_DE_JUIN),
        ventesAuTauxK(MOIS_DE_JUIN),
        ventesLuesCommeProduit(MOIS_DE_JUIN),
      ],
      'b2-06-a1-taux': [
        (Math.exp(K_DES_VENTES) - 1) * CENTAINES,
        K_DES_VENTES * CENTAINES,
        Math.exp(K_DES_VENTES) * CENTAINES,
      ],
      'b2-06-a2-capacite': [
        premierEntier(seuilDeCapacite),
        Math.floor(seuilDeCapacite),
        premierEntier(CAPACITE / VENTES_DE_JANVIER / K_DES_VENTES),
      ],
      'b2-06-a2-machine': [
        premierEntier(seuilDeLaMachine),
        Math.floor(seuilDeLaMachine),
        premierEntier(Math.log(PART_DU_PRIX) / Math.log(BAISSE_DE_LA_MACHINE)),
      ],
      'b2-06-a3-demande': [
        A_DE_LA_DEMANDE * Math.exp(K_DE_LA_DEMANDE * PRIX_PREVU),
        A_DE_LA_DEMANDE * (1 + K_DE_LA_DEMANDE) ** PRIX_PREVU,
        A_DE_LA_DEMANDE * Math.exp(-K_DE_LA_DEMANDE * PRIX_PREVU),
      ],
      'b2-06-a3-prix': [
        Math.log(partVisee) / K_DE_LA_DEMANDE,
        partVisee / K_DE_LA_DEMANDE,
        Math.log(partVisee) / -K_DE_LA_DEMANDE,
      ],
    });
  });

  it('retrouve le modèle 2 981e^(−0,05x) en ajustant z = ln y, et une droite négative au-delà de 53 €', () => {
    const droite = droiteDesMoindresCarres(PRIX_DE_GROS, logarithmes(DEMANDES));
    const affine = droiteDesMoindresCarres(PRIX_DE_GROS, DEMANDES);

    expect(droite.pente).toBeCloseTo(K_DE_LA_DEMANDE, 3);
    expect(Math.round(Math.exp(Math.round(droite.ordonnee)))).toBe(
      A_DE_LA_DEMANDE,
    );
    expect(affine.pente).toBeCloseTo(-31, 6);
    expect(-affine.ordonnee / affine.pente).toBeCloseTo(53.33, 2);
  });

  it('retrouve le modèle 20e^(−0,7x) des kits en ajustant z = ln y', () => {
    expect(DROITE_DES_KITS.pente).toBeCloseTo(K_DES_KITS, 1);
    expect(Math.round(Math.exp(DROITE_DES_KITS.ordonnee))).toBe(A_DES_KITS);
  });

  it('recalcule les solutions et pièges des quatre énigmes de la mini-situation', () => {
    const kits = (prix: number, k: number): number =>
      A_DES_KITS * Math.exp(k * prix) * CENTAINES;
    const partVisee = KITS_VISES / A_DES_KITS;
    const plancher = Math.log(KITS_PLANCHER / A_DES_KITS) / K_DES_KITS;
    const coefficientAuTauxK = 1 + K_DES_KITS;

    fiche.attendreLesEnigmes(COURS, {
      'b2-06-a4-e1-demande': [
        kits(PRIX_DE_L_ENIGME, K_DES_KITS),
        A_DES_KITS * coefficientAuTauxK ** PRIX_DE_L_ENIGME * CENTAINES,
        kits(PRIX_DE_L_ENIGME, -K_DES_KITS),
      ],
      'b2-06-a4-e2-prix': [
        (Math.log(partVisee) / K_DES_KITS) * DIZAINES,
        (partVisee / K_DES_KITS) * DIZAINES,
        (Math.log(partVisee) / -K_DES_KITS) * DIZAINES,
      ],
      'b2-06-a4-e3-plancher': [
        premierEntier(plancher * DIZAINES),
        Math.floor(plancher * DIZAINES),
        premierEntier(
          (Math.log(KITS_PLANCHER / A_DES_KITS) /
            Math.log(coefficientAuTauxK)) *
            DIZAINES,
        ),
      ],
      'b2-06-a4-e4-baisse': [
        (1 - Math.exp(K_DES_KITS)) * CENTAINES,
        -K_DES_KITS * CENTAINES,
        Math.exp(K_DES_KITS) * CENTAINES,
      ],
    });
  });

  it('calcule z = ln y au millième à l’exercice 5, la touche log pour piège', () => {
    const corrige = corrigeDuTableauDesLogarithmes();

    expect(corrige.attendus.map(fiche.valeursEtPieges)).toEqual(
      DEMANDES.map((demande) => [
        arrondi(Math.log(demande), 3),
        arrondi(Math.log10(demande), 3),
      ]),
    );
    expect(
      corrigerTableau(
        corrige,
        DEMANDES.map((demande) => ({ z: Math.log(demande) })),
      ).score,
    ).toBe(1);
  });
});

describe('B2-06 — les trois feuilles corrigées par le moteur de formules', () => {
  const VENTES_JUSTES = {
    ...feuille.recopier('=$E$1*EXP($G$1*A2)', 'B', 2, 8),
    ...feuille.recopier('=B3/B2-1', 'C', 3, 8),
  };

  it('reconnaît justes les ventes calculées par EXP jusqu’en B8 et leur taux d’un mois sur l’autre', () => {
    const corrige = fiche.corrigeDeFeuille(COURS, 'b2-06-a1-tableur-ventes');
    const taux = Math.exp(K_DES_VENTES) - 1;

    fiche.attendreLaFeuille(corrige, {
      ...feuille.attendusDeColonne(
        'B',
        2,
        feuille.rangsDe(0, DERNIER_MOIS_DE_LA_FEUILLE),
        (mois) =>
          mois === 0
            ? [ventes(mois), 0]
            : [
                ventes(mois),
                0,
                ventesLuesCommeProduit(mois),
                ventesAuTauxK(mois),
              ],
      ),
      ...feuille.attendusDeColonne(
        'C',
        3,
        feuille.rangsDe(1, DERNIER_MOIS_DE_LA_FEUILLE),
        () => [taux, taux + 1, K_DES_VENTES],
      ),
    });
    expect(corrigerFeuille(corrige, VENTES_JUSTES).score).toBe(1);
  });

  it('nomme dans les ventes les paramètres non figés, l’exponentielle lue comme un produit, k pris pour le taux et le coefficient pris pour le taux', () => {
    const corrige = fiche.corrigeDeFeuille(COURS, 'b2-06-a1-tableur-ventes');

    feuille.attendreUneRecopieNonFigee(
      corrige,
      feuille.recopier('=E1*EXP(G1*A2)', 'B', 2, 8),
      'B',
      DERNIER_MOIS_DE_LA_FEUILLE,
    );
    for (const formule of ['=$E$1*EXP(G1*A2)', '=$E$1*EXP($G$1*$A$2)']) {
      expect(
        feuille.confusionsDe(
          corrige,
          feuille.recopier(formule, 'B', 2, 8),
          'B',
        ),
      ).toEqual(
        Array.from({ length: DERNIER_MOIS_DE_LA_FEUILLE + 1 }, () => null),
      );
    }
    expect(
      feuille.confusionsDe(
        corrige,
        feuille.recopier('=$E$1*EXP(1)*$G$1*A2', 'B', 2, 8),
        'B',
      ),
    ).toEqual(
      feuille
        .rangsDe(0, DERNIER_MOIS_DE_LA_FEUILLE)
        .map(() => 'exponentielle-lue-comme-produit'),
    );
    expect(
      feuille.confusionsDe(
        corrige,
        feuille.recopier('=$E$1*PUISSANCE(1+$G$1;A2)', 'B', 2, 8),
        'B',
      ),
    ).toEqual([
      null,
      ...feuille
        .rangsDe(1, DERNIER_MOIS_DE_LA_FEUILLE)
        .map(() => 'k-confondu-avec-taux'),
    ]);
    expect(
      feuille.confusionsDe(
        corrige,
        { ...VENTES_JUSTES, ...feuille.recopier('=B3/B2', 'C', 3, 8) },
        'C',
      ),
    ).toEqual(
      feuille
        .rangsDe(1, DERNIER_MOIS_DE_LA_FEUILLE)
        .map(() => 'coefficient-confondu-avec-taux'),
    );
  });

  it('reconnaît justes les objectifs de ventes résolus par LN, mois exact compris', () => {
    const corrige = fiche.corrigeDeFeuille(COURS, 'b2-06-a2-tableur-objectifs');
    const exposant = (objectif: number): number =>
      Math.log(objectif / VENTES_DE_JANVIER);
    const part = (objectif: number): number => objectif / VENTES_DE_JANVIER;

    fiche.attendreLaFeuille(corrige, {
      ...feuille.attendusDeColonne('B', 2, OBJECTIFS, (objectif) => [
        exposant(objectif),
        part(objectif),
        Math.log(objectif) / Math.log(VENTES_DE_JANVIER),
      ]),
      ...feuille.attendusDeColonne('C', 2, OBJECTIFS, (objectif) => [
        exposant(objectif) / K_DES_VENTES,
        part(objectif) / K_DES_VENTES,
      ]),
    });
    expect(
      corrigerFeuille(corrige, {
        ...feuille.recopier('=LN(A2/$E$1)', 'B', 2, 7),
        ...feuille.recopier('=B2/$G$1', 'C', 2, 7),
      }).score,
    ).toBe(1);
  });

  it('nomme dans les objectifs la division sans ln, le logarithme d’un quotient et les paramètres non figés', () => {
    const corrige = fiche.corrigeDeFeuille(COURS, 'b2-06-a2-tableur-objectifs');
    const logarithmesJustes = feuille.recopier('=LN(A2/$E$1)', 'B', 2, 7);

    expect(feuille.confusionsDe(corrige, { B2: '=A2/$E$1' }, 'B2')).toEqual([
      'seuil-par-division',
    ]);
    expect(
      feuille.confusionsDe(corrige, { B2: '=LN(A2)/LN($E$1)' }, 'B2'),
    ).toEqual(['ln-produit-en-produit']);
    feuille.attendreUneRecopieNonFigee(
      corrige,
      feuille.recopier('=LN(A2/E1)', 'B', 2, 7),
      'B',
      OBJECTIFS.length - 1,
    );
    feuille.attendreUneRecopieNonFigee(
      corrige,
      { ...logarithmesJustes, ...feuille.recopier('=B2/G1', 'C', 2, 7) },
      'C',
      OBJECTIFS.length - 1,
    );
  });

  it('reconnaît juste l’ajustement des kits par LN, PENTE, ORDONNEE.ORIGINE et EXP', () => {
    const corrige = fiche.corrigeDeFeuille(COURS, 'b2-06-a4-feuille-kits');
    const { pente, ordonnee } = DROITE_DES_KITS;
    const a = Math.exp(ordonnee);

    fiche.attendreLaFeuille(corrige, {
      ...feuille.attendusDeColonne('C', 2, DEMANDES_DES_KITS, (demande) => [
        Math.log(demande),
      ]),
      D2: [pente, DROITE_AFFINE_DES_KITS.pente, DROITE_INVERSEE_DES_KITS.pente],
      E2: [
        ordonnee,
        DROITE_AFFINE_DES_KITS.ordonnee,
        DROITE_INVERSEE_DES_KITS.ordonnee,
      ],
      F2: [a, ordonnee],
      G2: [
        a * Math.exp(pente * PRIX_DE_LA_FEUILLE),
        a * Math.E * pente * PRIX_DE_LA_FEUILLE,
        ordonnee * Math.exp(pente * PRIX_DE_LA_FEUILLE),
      ],
    });
    expect(corrige.attendus).toHaveLength(10);
    expect(
      corrigerFeuille(corrige, {
        ...feuille.recopier('=LN(B2)', 'C', 2, 7),
        D2: '=PENTE(C2:C7;A2:A7)',
        E2: '=ORDONNEE.ORIGINE(C2:C7;A2:A7)',
        F2: '=EXP(E2)',
        G2: '=F2*EXP(D2*4)',
      }).score,
    ).toBe(1);
  });

  it('QF-28 · ne laisse dans la feuille des kits aucune colonne sans intitulé ni réponse, pour tenir au poste étudiant', () => {
    expect(
      colonnesVidesDeLaFeuille(
        COURS_B2_06,
        COURS,
        'B2-06-A4-02-TABLEUR-KITS',
        'b2-06-a4-feuille-kits',
      ),
    ).toEqual([]);
  });

  it('nomme dans les kits l’ajustement de y, les séries inversées, l’ordonnée non exponentiée et l’exponentielle lue comme un produit', () => {
    const corrige = fiche.corrigeDeFeuille(COURS, 'b2-06-a4-feuille-kits');
    const justes = {
      ...feuille.recopier('=LN(B2)', 'C', 2, 7),
      D2: '=PENTE(C2:C7;A2:A7)',
      E2: '=ORDONNEE.ORIGINE(C2:C7;A2:A7)',
    };

    expect(
      feuille.confusionsDe(
        corrige,
        { ...justes, D2: '=PENTE(B2:B7;A2:A7)' },
        'D2',
      ),
    ).toEqual(['ajustement-affine-sur-y']);
    expect(
      feuille.confusionsDe(
        corrige,
        { ...justes, D2: '=PENTE(A2:A7;C2:C7)' },
        'D2',
      ),
    ).toEqual(['pente-ordonnee-inversees']);
    expect(
      feuille.confusionsDe(corrige, { ...justes, F2: '=E2' }, 'F2'),
    ).toEqual(['ordonnee-non-exponentiee']);
    expect(
      feuille.confusionsDe(
        corrige,
        { ...justes, F2: '=EXP(E2)', G2: '=F2*EXP(1)*D2*4' },
        'G2',
      ),
    ).toEqual(['exponentielle-lue-comme-produit']);
  });
});

describe('B2-06 — retours de la relecture adverse', () => {
  it('ne dévoile dans aucune correction sur place une valeur à saisir d’un écran suivant, les feuilles exigeant une formule', () => {
    expect(valeursDevoileesAvantLeurEcran(COURS_B2_06, COURS)).toEqual([]);
  });

  it('ne parle ni de limite ni d’asymptote, hors programme', () => {
    const texte = JSON.stringify(COURS_B2_06).toLowerCase();

    expect(texte).not.toContain('limite');
    expect(texte).not.toContain('asymptote');
  });

  it('distingue ln de la touche log dans la trace écrite et dans l’exercice 5', () => {
    for (const ecran of [
      'B2-06-A2-02-COURS-LOGARITHME',
      'B2-06-A3-06-TABLEAU-LOGARITHMES',
    ]) {
      expect(feuille.texteDeLEcran(COURS_B2_06, ecran)).toContain('touche log');
    }
  });

  it('dit dans la trace écrite du seuil que diviser par ln q négatif change le sens de l’inégalité', () => {
    expect(
      feuille.texteDeLEcran(COURS_B2_06, 'B2-06-A2-03-COURS-SEUIL'),
    ).toContain('change le sens');
  });

  it('propose à l’exercice 7 une piste fausse qui se fie au seul coefficient de corrélation', () => {
    const { proprietes } = fiche.ecranDuContenu(
      COURS_B2_06,
      'B2-06-A3-08-DEFI-IA',
    );
    const fausse = /"id":"garder","libelle":"([^"]+)","fausse":true/u.exec(
      JSON.stringify(proprietes),
    )?.[1];

    expect(fausse).toContain('coefficient de corrélation');
  });

  it('écrit les exposants en notation e^(kx) et le taux e^k − 1 dans la trace écrite des modèles', () => {
    const texte = feuille.texteDeLEcran(
      COURS_B2_06,
      'B2-06-A1-08-COURS-MODELE-EXP',
    );

    expect(texte).toContain('a e^(kx)');
    expect(texte).toContain('e^k − 1');
  });

  it('garde au tableur de la trace écrite des cellules de paramètres distinctes de celles des exercices', () => {
    const methode = feuille.texteDeLEcran(
      COURS_B2_06,
      'B2-06-A1-08-COURS-MODELE-EXP',
    );

    expect(methode).toContain('=$H$1*EXP($H$2*A2)');
    expect(methode).not.toContain('$G$1');
  });
});
