import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  attendreLaFeuille,
  attendreLesEnigmes,
  attendreLesNumeriques,
  corrigeDe,
  corrigeDeFeuille,
  decrireLaFicheDuCours,
  decrireLaMiniSituation,
  valeursEtPieges,
} from '../../../../../test/helpers/fiche-de-cours';
import {
  attendreUneRecopieNonFigee,
  confusionsDe,
  enFrancais,
  proprietesV2 as proprietesDe,
  rangsDe,
  recopier,
  texteDeLEcran as texteDe,
} from '../../../../../test/helpers/feuille-de-cours';
import { arrondi } from '../../../../../test/helpers/lecture-de-cours';
import { corrigerFeuille } from '../../domain/cours/CorrectionProduction';
import { COURS_B2_05 } from './b2-05.cours';

const COURS = buildCoursDuContenu(COURS_B2_05);

const TRESORERIE = 40000;
const TAUX_DU_PLACEMENT = 0.025;
const SOMME_A_OBTENIR = 50000;
const DUREE_DU_PLACEMENT = 3;
const DERNIER_RANG_DU_PLACEMENT = 5;

const VERSEMENT = 6000;
const TAUX_DE_L_EPARGNE = 0.03;
const VERSEMENTS = 5;

const EMPRUNT = 60000;
const TAUX_DE_L_EMPRUNT = 0.04;
const DUREE_DE_L_EMPRUNT = 5;

const CAMIONNETTE = 32000;
const TAUX_DE_LA_CAMIONNETTE = 0.035;
const DUREE_DE_LA_CAMIONNETTE = 4;
const PLACEMENT_DE_LA_MINI_SITUATION = 15000;
const BATTERIE = 20000;
const VERSEMENT_DE_LA_MINI_SITUATION = 5000;
const TAUX_DE_LA_MINI_SITUATION = 0.02;
const DUREE_DE_LA_MINI_SITUATION = 4;

const EMPRUNT_TYPE = 100000;
const TAUX_DE_L_EMPRUNT_TYPE = 0.05;
const DUREE_DE_L_EMPRUNT_TYPE = 10;

const auCentime = (valeur: number): number => arrondi(valeur, 2);

const valeurAcquise = (capital: number, taux: number, duree: number): number =>
  arrondi(capital * (1 + taux) ** duree);
const valeurActuelle = (capital: number, taux: number, duree: number): number =>
  arrondi(capital / (1 + taux) ** duree);
const interetsSimples = (capital: number, taux: number, duree: number) =>
  capital * (1 + taux * duree);
const suiteDAnnuites = (versement: number, taux: number, nombre: number) =>
  arrondi((versement * ((1 + taux) ** nombre - 1)) / taux);
const annuite = (capital: number, taux: number, duree: number): number =>
  (capital * taux) / (1 - (1 + taux) ** -duree);

const placement = (rang: number): number =>
  valeurAcquise(TRESORERIE, TAUX_DU_PLACEMENT, rang);

function epargne(rang: number): number {
  return rang === 1
    ? VERSEMENT
    : arrondi(epargne(rang - 1) * (1 + TAUX_DE_L_EPARGNE) + VERSEMENT);
}

interface LigneDAmortissement {
  readonly capital: number;
  readonly interets: number;
  readonly amortissement: number;
}

function tableauDAmortissement(
  capital: number,
  taux: number,
  versement: number,
  duree: number,
  auPas: (valeur: number) => number,
): LigneDAmortissement[] {
  const lignes: LigneDAmortissement[] = [];
  let restant = capital;
  for (let annee = 1; annee <= duree; annee += 1) {
    const interets = auPas(restant * taux);
    const amortissement = auPas(versement - interets);
    lignes.push({ capital: restant, interets, amortissement });
    restant = auPas(restant - amortissement);
  }
  return lignes;
}

const ANNUITE_ARRONDIE = auCentime(
  annuite(EMPRUNT, TAUX_DE_L_EMPRUNT, DUREE_DE_L_EMPRUNT),
);
const ANNUITE_DE_LA_CAMIONNETTE = annuite(
  CAMIONNETTE,
  TAUX_DE_LA_CAMIONNETTE,
  DUREE_DE_LA_CAMIONNETTE,
);
const LIGNES_DE_L_EMPRUNT = tableauDAmortissement(
  EMPRUNT,
  TAUX_DE_L_EMPRUNT,
  ANNUITE_ARRONDIE,
  DUREE_DE_L_EMPRUNT,
  auCentime,
);
const LIGNES_DE_LA_CAMIONNETTE = tableauDAmortissement(
  CAMIONNETTE,
  TAUX_DE_LA_CAMIONNETTE,
  ANNUITE_DE_LA_CAMIONNETTE,
  DUREE_DE_LA_CAMIONNETTE,
  (valeur) => valeur,
);

decrireLaFicheDuCours('B2-05', COURS, {
  conception: 'cours-b2-05-conception.md',
  ecrans: 34,
  dureeMinutes: 180,
  minutesParActe: [49, 39, 47, 45, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 147, exposition: 33 },
  ateliersNotes: ['A1-10 (10)', 'A2-05 (11)', 'A3-06 (10)'],
  noteesParType: [8, 6, 0, 3, 1],
  enigmes: 4,
  rappels: 12,
  remediations: 15,
  options: 8 + 4 + 12,
  catalogue: [
    'A1-02',
    'A1-04',
    'A1-05',
    'A1-07',
    'A1-08',
    'A2-02',
    'A2-03',
    'A3-01',
    'A3-03',
    'A3-04',
    'A4-01',
    'A4-05',
  ],
  corrigesSurPlace: [
    'B2-05-A1-10-ATELIER-PLACEMENT',
    'B2-05-A1-11-TABLEUR-PLACEMENT',
    'B2-05-A2-05-ATELIER-ANNUITES',
    'B2-05-A2-06-TABLEUR-EPARGNE',
    'B2-05-A3-06-ATELIER-EMPRUNT',
    'B2-05-A3-07-TABLEAU-AMORTISSEMENT',
    'B2-05-A3-08-DEFI-IA',
    'B2-05-A4-02-TABLEUR-CAMIONNETTE',
    'B2-05-A4-03-COFFRE-CAMIONNETTE',
  ],
});

decrireLaMiniSituation('B2-05', COURS_B2_05, {
  donneesFictives: ['B2-05-A1-05-DOSSIER', 'B2-05-A4-01-SITUATION-CAMIONNETTE'],
  coffre: 'B2-05-A4-03-COFFRE-CAMIONNETTE',
  tableur: 'B2-05-A4-02-TABLEUR-CAMIONNETTE',
});

describe('B2-05 — textes relus contre les données', () => {
  it('annonce dans le dossier la trésorerie, l’épargne et l’emprunt d’Hélène', () => {
    const texte = texteDe(COURS_B2_05, 'B2-05-A1-05-DOSSIER');

    expect(texte).toContain('40 000 €');
    expect(texte).toContain('6 000 €');
    expect(texte).toContain('60 000 €');
  });

  it('trace en barres les intérêts et l’amortissement de l’emprunt type, dont la somme reste l’annuité', () => {
    const { labels, series } = proprietesDe(
      COURS_B2_05,
      'B2-05-A3-01-GRAPHIQUE',
    );
    const lignes = tableauDAmortissement(
      EMPRUNT_TYPE,
      TAUX_DE_L_EMPRUNT_TYPE,
      annuite(EMPRUNT_TYPE, TAUX_DE_L_EMPRUNT_TYPE, DUREE_DE_L_EMPRUNT_TYPE),
      DUREE_DE_L_EMPRUNT_TYPE,
      arrondi,
    );

    expect(labels).toEqual(
      rangsDe(1, DUREE_DE_L_EMPRUNT_TYPE).map((annee) => `Année ${annee}`),
    );
    expect(series).toMatchObject([
      { values: lignes.map((ligne) => auCentime(ligne.interets)) },
      { values: lignes.map((ligne) => auCentime(ligne.amortissement)) },
    ]);
  });

  it('rappelle la formule de l’annuité et le taux de l’emprunt dans l’énoncé de l’exercice 5', () => {
    const texte = texteDe(COURS_B2_05, 'B2-05-A3-06-ATELIER-EMPRUNT');

    expect(texte).toContain('a = C × t ÷ (1 − (1 + t)⁻ⁿ)');
    expect(texte).toContain(`${enFrancais(TAUX_DE_L_EMPRUNT * 100, 0)} %`);
  });
});

describe('B2-05 — recalcul des corrigés depuis les seuls paramètres', () => {
  it('recalcule les solutions et pièges des six questions numériques', () => {
    const emprunt = annuite(EMPRUNT, TAUX_DE_L_EMPRUNT, DUREE_DE_L_EMPRUNT);
    const capitalSurLaDuree = EMPRUNT / DUREE_DE_L_EMPRUNT;
    const coutDuCredit = DUREE_DE_L_EMPRUNT * ANNUITE_ARRONDIE - EMPRUNT;

    attendreLesNumeriques(COURS, {
      'b2-05-a1-valeur-acquise': [
        placement(DUREE_DU_PLACEMENT),
        interetsSimples(TRESORERIE, TAUX_DU_PLACEMENT, DUREE_DU_PLACEMENT),
        placement(DUREE_DU_PLACEMENT + 1),
      ],
      'b2-05-a1-valeur-actuelle': [
        valeurActuelle(SOMME_A_OBTENIR, TAUX_DU_PLACEMENT, DUREE_DU_PLACEMENT),
        valeurAcquise(SOMME_A_OBTENIR, TAUX_DU_PLACEMENT, DUREE_DU_PLACEMENT),
        SOMME_A_OBTENIR / (1 + TAUX_DU_PLACEMENT * DUREE_DU_PLACEMENT),
      ],
      'b2-05-a2-premier': [
        valeurAcquise(VERSEMENT, TAUX_DE_L_EPARGNE, VERSEMENTS - 1),
        valeurAcquise(VERSEMENT, TAUX_DE_L_EPARGNE, VERSEMENTS),
        interetsSimples(VERSEMENT, TAUX_DE_L_EPARGNE, VERSEMENTS - 1),
      ],
      'b2-05-a2-valeur-acquise': [
        suiteDAnnuites(VERSEMENT, TAUX_DE_L_EPARGNE, VERSEMENTS),
        VERSEMENT * VERSEMENTS,
        suiteDAnnuites(VERSEMENT, TAUX_DE_L_EPARGNE, VERSEMENTS) *
          (1 + TAUX_DE_L_EPARGNE),
      ],
      'b2-05-a3-annuite': [
        emprunt,
        capitalSurLaDuree,
        capitalSurLaDuree + EMPRUNT * TAUX_DE_L_EMPRUNT,
      ],
      'b2-05-a3-cout': [
        coutDuCredit,
        coutDuCredit + EMPRUNT,
        DUREE_DE_L_EMPRUNT * EMPRUNT * TAUX_DE_L_EMPRUNT,
      ],
    });
  });

  it('écarte de deux centimes le coût du crédit et la somme des intérêts, par l’arrondi de l’annuité', () => {
    const sommeDesInterets = LIGNES_DE_L_EMPRUNT.reduce(
      (total, ligne) => total + ligne.interets,
      0,
    );

    expect(
      auCentime(DUREE_DE_L_EMPRUNT * ANNUITE_ARRONDIE - EMPRUNT) -
        auCentime(sommeDesInterets),
    ).toBeCloseTo(0.02, 6);
  });

  it('recalcule les solutions et pièges des quatre énigmes de la mini-situation', () => {
    const cout =
      DUREE_DE_LA_CAMIONNETTE * ANNUITE_DE_LA_CAMIONNETTE - CAMIONNETTE;
    const epargneDeLaMiniSituation = suiteDAnnuites(
      VERSEMENT_DE_LA_MINI_SITUATION,
      TAUX_DE_LA_MINI_SITUATION,
      DUREE_DE_LA_MINI_SITUATION,
    );

    attendreLesEnigmes(COURS, {
      'b2-05-a4-e1-placement': [
        valeurAcquise(
          PLACEMENT_DE_LA_MINI_SITUATION,
          TAUX_DE_LA_MINI_SITUATION,
          DUREE_DE_LA_MINI_SITUATION,
        ),
        interetsSimples(
          PLACEMENT_DE_LA_MINI_SITUATION,
          TAUX_DE_LA_MINI_SITUATION,
          DUREE_DE_LA_MINI_SITUATION,
        ),
        valeurAcquise(
          PLACEMENT_DE_LA_MINI_SITUATION,
          TAUX_DE_LA_MINI_SITUATION,
          DUREE_DE_LA_MINI_SITUATION + 1,
        ),
      ],
      'b2-05-a4-e2-batterie': [
        valeurActuelle(
          BATTERIE,
          TAUX_DE_LA_MINI_SITUATION,
          DUREE_DE_LA_MINI_SITUATION,
        ),
        valeurAcquise(
          BATTERIE,
          TAUX_DE_LA_MINI_SITUATION,
          DUREE_DE_LA_MINI_SITUATION,
        ),
        BATTERIE / (1 + TAUX_DE_LA_MINI_SITUATION * DUREE_DE_LA_MINI_SITUATION),
      ],
      'b2-05-a4-e3-epargne': [
        epargneDeLaMiniSituation,
        VERSEMENT_DE_LA_MINI_SITUATION * DUREE_DE_LA_MINI_SITUATION,
        epargneDeLaMiniSituation * (1 + TAUX_DE_LA_MINI_SITUATION),
      ],
      'b2-05-a4-e4-cout': [
        cout,
        cout + CAMIONNETTE,
        DUREE_DE_LA_CAMIONNETTE * CAMIONNETTE * TAUX_DE_LA_CAMIONNETTE,
      ],
    });
  });

  it('bâtit le tableau d’amortissement de l’exercice 6 avec l’annuité arrondie et les intérêts au centime', () => {
    const corrige = corrigeDe(COURS, 'b2-05-a3-tableau-amortissement');
    if (corrige.type !== 'tableau') {
      throw new Error('l’exercice 6 n’a pas de corrigé de tableau');
    }

    expect(corrige.attendus.map(valeursEtPieges)).toEqual(
      LIGNES_DE_L_EMPRUNT.flatMap((ligne, rang) => [
        rang === 0
          ? [ligne.interets]
          : [ligne.interets, EMPRUNT * TAUX_DE_L_EMPRUNT],
        [ligne.amortissement, ANNUITE_ARRONDIE],
      ]),
    );
    expect(LIGNES_DE_L_EMPRUNT.at(-1)?.amortissement).toBeCloseTo(12959.26, 2);
  });
});

describe('B2-05 — les trois feuilles corrigées par le moteur de formules', () => {
  it('reconnaît juste le placement de la trésorerie recopié jusqu’en C7 et ses intérêts', () => {
    const corrige = corrigeDeFeuille(COURS, 'b2-05-a1-tableur-placement');
    const rangs = rangsDe(1, DERNIER_RANG_DU_PLACEMENT);

    attendreLaFeuille(corrige, {
      ...Object.fromEntries(
        rangs.map((rang) => [
          `C${rang + 2}`,
          rang === 1
            ? [placement(rang), TRESORERIE * TAUX_DU_PLACEMENT]
            : [placement(rang), placement(1)],
        ]),
      ),
      ...Object.fromEntries(
        rangs.map((rang) => [
          `D${rang + 2}`,
          rang === 1
            ? [placement(1) - placement(0)]
            : [
                placement(rang) - placement(rang - 1),
                TRESORERIE * TAUX_DU_PLACEMENT,
              ],
        ]),
      ),
    });
    expect(
      corrigerFeuille(corrige, {
        ...recopier('=C2*(1+$G$1)', 'C', 3, 7),
        ...recopier('=C3-C2', 'D', 3, 7),
      }).score,
    ).toBe(1);
  });

  it('nomme le taux non figé et le taux pris pour le coefficient dans le placement', () => {
    const corrige = corrigeDeFeuille(COURS, 'b2-05-a1-tableur-placement');

    attendreUneRecopieNonFigee(
      corrige,
      recopier('=C2*(1+G1)', 'C', 3, 7),
      'C',
      4,
    );
    expect(confusionsDe(corrige, { C3: '=C2*$G$1' }, 'C3')).toEqual([
      'coefficient-confondu-avec-taux',
    ]);
  });

  it('reconnaît juste l’épargne des machines, ses intérêts et leur total', () => {
    const corrige = corrigeDeFeuille(COURS, 'b2-05-a2-tableur-epargne');
    const rangs = rangsDe(2, VERSEMENTS);
    const interets = (rang: number): number =>
      arrondi(epargne(rang - 1) * TAUX_DE_L_EPARGNE);

    attendreLaFeuille(corrige, {
      ...Object.fromEntries(
        rangs.map((rang) => [
          `B${rang + 1}`,
          rang === 2
            ? [epargne(rang), VERSEMENT * 2]
            : [epargne(rang), epargne(2)],
        ]),
      ),
      ...Object.fromEntries(
        rangs.map((rang) => [
          `C${rang + 1}`,
          rang === 2 ? [interets(rang)] : [interets(rang), 0, interets(2)],
        ]),
      ),
      F3: [
        arrondi(epargne(VERSEMENTS) - VERSEMENT * VERSEMENTS),
        interets(VERSEMENTS),
      ],
    });
    expect(
      corrigerFeuille(corrige, {
        ...recopier('=B2*(1+$F$1)+$H$1', 'B', 3, 6),
        ...recopier('=B2*$F$1', 'C', 3, 6),
        F3: '=SOMME(C3:C6)',
      }).score,
    ).toBe(1);
  });

  it('nomme dans l’épargne le versement sans intérêts, la recopie non figée et le dernier terme pris pour le total', () => {
    const corrige = corrigeDeFeuille(COURS, 'b2-05-a2-tableur-epargne');
    const justes = recopier('=B2*$F$1', 'C', 3, 6);

    expect(confusionsDe(corrige, { B3: '=B2+$H$1' }, 'B3')).toEqual([
      'versements-sans-interets',
    ]);
    attendreUneRecopieNonFigee(
      corrige,
      recopier('=B2*(1+F1)+H1', 'B', 3, 6),
      'B',
      3,
    );
    expect(
      confusionsDe(
        corrige,
        { ...recopier('=B2*(1+$F$1)+$H$1', 'B', 3, 6), ...justes, F3: '=C6' },
        'F3',
      ),
    ).toEqual(['terme-pris-pour-somme']);
  });

  it('reconnaît juste le tableau d’amortissement de la camionnette, VPM et coût du crédit compris', () => {
    const corrige = corrigeDeFeuille(COURS, 'b2-05-a4-feuille-camionnette');
    const lignes = LIGNES_DE_LA_CAMIONNETTE;
    const cout =
      DUREE_DE_LA_CAMIONNETTE * ANNUITE_DE_LA_CAMIONNETTE - CAMIONNETTE;

    attendreLaFeuille(corrige, {
      I2: [
        ANNUITE_DE_LA_CAMIONNETTE,
        -ANNUITE_DE_LA_CAMIONNETTE,
        CAMIONNETTE / DUREE_DE_LA_CAMIONNETTE,
      ],
      ...Object.fromEntries(
        lignes.slice(1).map((ligne, rang) => [`B${rang + 3}`, [ligne.capital]]),
      ),
      ...Object.fromEntries(
        lignes.map((ligne, rang) => [
          `C${rang + 2}`,
          rang === 0
            ? [ligne.interets]
            : [ligne.interets, 0, CAMIONNETTE * TAUX_DE_LA_CAMIONNETTE],
        ]),
      ),
      ...Object.fromEntries(
        lignes.map((ligne, rang) => [
          `D${rang + 2}`,
          [ligne.amortissement, arrondi(ANNUITE_DE_LA_CAMIONNETTE)],
        ]),
      ),
      ...Object.fromEntries(
        lignes.map((ligne, rang) => [
          `E${rang + 2}`,
          [arrondi(ligne.capital - ligne.amortissement)],
        ]),
      ),
      J2: [
        cout,
        cout + CAMIONNETTE,
        DUREE_DE_LA_CAMIONNETTE * CAMIONNETTE * TAUX_DE_LA_CAMIONNETTE,
      ],
    });
    expect(corrige.attendus).toHaveLength(17);
    expect(
      corrigerFeuille(corrige, {
        I2: '=VPM(G2;H2;-B2)',
        ...recopier('=B2*$G$2', 'C', 2, 5),
        ...recopier('=$I$2-C2', 'D', 2, 5),
        ...recopier('=B2-D2', 'E', 2, 5),
        ...recopier('=E2', 'B', 3, 5),
        J2: '=I2*H2-B2',
      }).score,
    ).toBe(1);
  });

  it('nomme dans la camionnette le capital de VPM sans signe, le taux non figé et le total remboursé', () => {
    const corrige = corrigeDeFeuille(COURS, 'b2-05-a4-feuille-camionnette');
    const justes = {
      I2: '=VPM(G2;H2;-B2)',
      ...recopier('=$I$2-C2', 'D', 2, 5),
      ...recopier('=B2-D2', 'E', 2, 5),
      ...recopier('=E2', 'B', 3, 5),
    };

    expect(confusionsDe(corrige, { I2: '=VPM(G2;H2;B2)' }, 'I2')).toEqual([
      'capital-de-vpm-non-signe',
    ]);
    attendreUneRecopieNonFigee(
      corrige,
      { ...justes, ...recopier('=B2*G2', 'C', 2, 5) },
      'C',
      3,
    );
    expect(
      confusionsDe(
        corrige,
        { ...justes, ...recopier('=B2*$G$2', 'C', 2, 5), J2: '=I2*H2' },
        'J2',
      ),
    ).toEqual(['cout-credit-confondu-avec-total-rembourse']);
  });
});
