import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import * as feuille from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import { arrondi } from '../../../../../../common/domain/nombres/arrondi';
import { somme } from '../../../../../../common/domain/nombres/statistiques';
import type { CorrigeTableau } from '../../../../domain/cours/correction/Corrige';
import {
  corrigerFeuille,
  corrigerTableau,
} from '../../../../domain/cours/correction/CorrectionProduction';
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

const CENTAINES = 100;

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
  const sx = somme(abscisses);
  const sy = somme(ordonnees);
  const sxy = somme(abscisses.map((x, i) => x * ordonnees[i]));
  const sxx = somme(abscisses.map((x) => x * x));
  const pente = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { pente, ordonnee: (sy - pente * sx) / n };
}

const logarithmes = (valeurs: readonly number[]): number[] =>
  valeurs.map((valeur) => Math.log(valeur));

function corrigeDuTableauDesLogarithmes(): CorrigeTableau {
  const corrige = fiche.corrigeDe(COURS, 'b2-06-a3-tableau-logarithmes');
  if (corrige.type !== 'tableau') {
    throw new Error('l’exercice 5 n’a pas de corrigé de tableau');
  }
  return corrige;
}

fiche.decrireLaFicheDuCours('B2-06', COURS, {
  conception: 'cours-b2-06-conception.md',
  ecrans: 37,
  dureeMinutes: 135,
  minutesParActe: [49, 41, 37, 8, 0, 0],
  rythme: { expositionContinueMax: 8, interactives: 103, exposition: 32 },
  ateliersNotes: ['A1-10 (10)', 'A2-05 (11)', 'A3-07 (10)'],
  noteesParType: [7, 6, 0, 2, 1],
  enigmes: 0,
  rappels: 12,
  remediations: 15,
  options: 23,
  catalogue: [
    'A1-02',
    'A1-04',
    'A1-05',
    'A1-07',
    'A1-07',
    'A1-08',
    'A1-08',
    'A2-02',
    'A2-02',
    'A2-02',
    'A2-03',
    'A2-03',
    'A2-03',
    'A3-01',
    'A3-03',
    'A3-03',
    'A3-04',
    'A3-04',
    'A4-05',
  ],
  corrigesSurPlace: [
    'B2-06-A1-10-ATELIER-VENTES',
    'B2-06-A1-11-TABLEUR-VENTES',
    'B2-06-A2-05-ATELIER-SEUILS',
    'B2-06-A2-06-TABLEUR-OBJECTIFS',
    'B2-06-A3-06-TABLEAU-LOGARITHMES',
    'B2-06-A3-07-ATELIER-DEMANDE',
  ],
});

describe('B2-06 — illustrations de la trace écrite', () => {
  const TEXTES_DES_ILLUSTRATIONS: Readonly<Record<string, readonly string[]>> =
    {
      'B2-06-A1-07-ILLUSTRATION-PUISSANCES': [
        'e⁰ = 1',
        '2,718',
        'e^0,4 ≈ 1,492',
      ],
      'B2-06-A1-08-ILLUSTRATION-MODELE': [
        'a = 1 000',
        '1,98 %',
        '=$H$1*EXP($H$2*A2)',
      ],
      'B2-06-A2-02-ILLUSTRATION-RECIPROQUE': ['1,609', '0,699'],
      'B2-06-A2-02-ILLUSTRATION-PROPRIETES': ['0,693', '0,961', '2,079'],
      'B2-06-A2-03-ILLUSTRATION-SEUIL': ['7,59', '11,39', '5,68', 'n = 6'],
      'B2-06-A2-03-ILLUSTRATION-SENS': ['0,357', '4,51', 'n = 5', '0,168'],
      'B2-06-A3-03-ILLUSTRATION-MODELES': ['183,94', '16,09', '0,67'],
      'B2-06-A3-04-ILLUSTRATION-AJUSTEMENT': ['4,605', '3,401', 'e^4,61'],
    };

  it('ILLU-1 · chaque page de cours du B2-06 suit ses illustrations', () => {
    expect(
      COURS.ecrans
        .map((ecran) => ecran.id)
        .filter((id) => /-(ILLUSTRATION|COURS)-/.test(id)),
    ).toEqual([
      'B2-06-A1-07-ILLUSTRATION-PUISSANCES',
      'B2-06-A1-07-COURS-EXPONENTIELLE',
      'B2-06-A1-08-ILLUSTRATION-MODELE',
      'B2-06-A1-08-COURS-MODELE-EXP',
      'B2-06-A2-02-ILLUSTRATION-RECIPROQUE',
      'B2-06-A2-02-ILLUSTRATION-PROPRIETES',
      'B2-06-A2-02-COURS-LOGARITHME',
      'B2-06-A2-03-ILLUSTRATION-SEUIL',
      'B2-06-A2-03-ILLUSTRATION-SENS',
      'B2-06-A2-03-COURS-SEUIL',
      'B2-06-A3-03-ILLUSTRATION-MODELES',
      'B2-06-A3-03-COURS-MODELE',
      'B2-06-A3-04-ILLUSTRATION-AJUSTEMENT',
      'B2-06-A3-04-COURS-AJUSTEMENT',
    ]);
  });

  it('ILLU-2 · annonce 8 min pour les pages et les quatre illustrations de l’acte 2', () => {
    const notes = fiche.ecranDuContenu(
      COURS_B2_06,
      'B2-06-A2-03-COURS-SEUIL',
    ).notes;

    expect(notes).toContain('8 min');
    expect(notes).not.toContain('6 min');
  });

  it('ILLU-4 · décrit chaque image dans son texte alternatif et crédite chaque fichier', () => {
    for (const [ecran, textes] of Object.entries(TEXTES_DES_ILLUSTRATIONS)) {
      const { image, imageAlt } = feuille.proprietesV2(COURS_B2_06, ecran);

      for (const texte of textes) {
        expect(imageAlt).toContain(texte);
      }
      expect(COURS.medias.map(({ chemins }) => chemins[0])).toContain(image);
    }
    expect(COURS.medias.map(({ id }) => id)).toEqual([
      'M1',
      'M2',
      'M3',
      'M4',
      'M5',
      'M6',
      'M7',
      'M8',
      'M9',
    ]);
  });
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
});

describe('B2-06 — retours de la relecture adverse', () => {
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
