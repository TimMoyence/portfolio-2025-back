import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  attendreLaFeuille,
  attendreLesNumeriques,
  corrigeDe,
  corrigeDeFeuille,
  CATALOGUE_ILLUSTRE_A_CINQ_PAGES,
  decrireLaFicheDuCours,
  valeursEtPieges,
} from '../../../../../test/helpers/fiche-de-cours';
import {
  attendreUneRecopieNonFigee,
  attendusDeColonne,
  confusionsDe,
  proprietesV2,
  rangsDe,
  recopier,
  texteDeLEcran as texteDe,
} from '../../../../../test/helpers/feuille-de-cours';
import { avecVirgule } from '../../../../common/domain/nombres/ecriture-francaise';
import { somme } from '../../../../common/domain/nombres/statistiques';
import {
  auCentime,
  auMillionieme,
} from '../../../../common/domain/nombres/arrondi';
import {
  corrigerFeuille,
  corrigerTableau,
} from '../../domain/cours/CorrectionProduction';
import type { CorrigeTableau } from '../../domain/cours/Corrige';
import { tirer } from '../../domain/cours/Tirage';
import { COURS_B2_05 } from './b2-05.cours';

const COURS = buildCoursDuContenu(COURS_B2_05);

function corrigeDuTableauDAmortissement(): CorrigeTableau {
  const corrige = corrigeDe(COURS, 'b2-05-a3-tableau-amortissement');
  if (corrige.type !== 'tableau') {
    throw new Error('l’exercice 6 n’a pas de corrigé de tableau');
  }
  return corrige;
}

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

const EMPRUNT_TYPE = 100000;
const TAUX_DE_L_EMPRUNT_TYPE = 0.05;
const DUREE_DE_L_EMPRUNT_TYPE = 10;

const valeurAcquise = (capital: number, taux: number, duree: number): number =>
  auMillionieme(capital * (1 + taux) ** duree);
const valeurActuelle = (capital: number, taux: number, duree: number): number =>
  auMillionieme(capital / (1 + taux) ** duree);
const interetsSimples = (capital: number, taux: number, duree: number) =>
  capital * (1 + taux * duree);
const suiteDAnnuites = (versement: number, taux: number, nombre: number) =>
  auMillionieme((versement * ((1 + taux) ** nombre - 1)) / taux);
const placesToutLaDuree = (versement: number, taux: number, nombre: number) =>
  nombre * valeurAcquise(versement, taux, nombre);
const annuite = (capital: number, taux: number, duree: number): number =>
  (capital * taux) / (1 - (1 + taux) ** -duree);

const placement = (rang: number): number =>
  valeurAcquise(TRESORERIE, TAUX_DU_PLACEMENT, rang);

function epargne(rang: number): number {
  return rang === 1
    ? VERSEMENT
    : auMillionieme(epargne(rang - 1) * (1 + TAUX_DE_L_EPARGNE) + VERSEMENT);
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
const LIGNES_DE_L_EMPRUNT = tableauDAmortissement(
  EMPRUNT,
  TAUX_DE_L_EMPRUNT,
  ANNUITE_ARRONDIE,
  DUREE_DE_L_EMPRUNT,
  auCentime,
);

decrireLaFicheDuCours('B2-05', COURS, {
  conception: 'cours-b2-05-conception.md',
  ecrans: 33,
  dureeMinutes: 133,
  minutesParActe: [49, 39, 37, 8, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 106, exposition: 27 },
  noteesParType: [7, 6, 0, 2, 1],
  enigmes: 0,
  rappels: 12,
  options: 23,
  catalogue: CATALOGUE_ILLUSTRE_A_CINQ_PAGES.filter((code) => code !== 'A4-01'),
  ateliersNotes: ['A1-10 (10)', 'A2-05 (12)', 'A3-06 (10)'],
  remediations: 15,
  corrigesSurPlace: [
    'B2-05-A1-10-ATELIER-PLACEMENT',
    'B2-05-A1-11-TABLEUR-PLACEMENT',
    'B2-05-A2-05-ATELIER-ANNUITES',
    'B2-05-A2-06-TABLEUR-EPARGNE',
    'B2-05-A3-06-ATELIER-EMPRUNT',
    'B2-05-A3-07-TABLEAU-AMORTISSEMENT',
  ],
});

describe('B2-05 — textes relus contre les données', () => {
  it('annonce dans le dossier la trésorerie, l’épargne et l’emprunt d’Hélène', () => {
    const texte = texteDe(COURS_B2_05, 'B2-05-A1-05-DOSSIER');

    expect(texte).toContain('40 000 €');
    expect(texte).toContain('6 000 €');
    expect(texte).toContain('60 000 €');
  });

  it('trace en barres les intérêts et l’amortissement de l’emprunt type, dont la somme reste l’annuité', () => {
    const { labels, series } = proprietesV2(
      COURS_B2_05,
      'B2-05-A3-01-GRAPHIQUE',
    );
    const lignes = tableauDAmortissement(
      EMPRUNT_TYPE,
      TAUX_DE_L_EMPRUNT_TYPE,
      annuite(EMPRUNT_TYPE, TAUX_DE_L_EMPRUNT_TYPE, DUREE_DE_L_EMPRUNT_TYPE),
      DUREE_DE_L_EMPRUNT_TYPE,
      auMillionieme,
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
    expect(texte).toContain(`${avecVirgule(TAUX_DE_L_EMPRUNT * 100, 0)} %`);
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
        placesToutLaDuree(VERSEMENT, TAUX_DE_L_EPARGNE, VERSEMENTS),
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
    const sommeDesInterets = somme(
      LIGNES_DE_L_EMPRUNT.map((ligne) => ligne.interets),
    );

    expect(
      auCentime(DUREE_DE_L_EMPRUNT * ANNUITE_ARRONDIE - EMPRUNT) -
        auCentime(sommeDesInterets),
    ).toBeCloseTo(0.02, 6);
  });

  it('bâtit le tableau d’amortissement de l’exercice 6 avec l’annuité arrondie et les intérêts au centime', () => {
    const corrige = corrigeDuTableauDAmortissement();

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
      ...attendusDeColonne('C', 3, rangs, (rang) =>
        rang === 1
          ? [placement(rang), TRESORERIE * TAUX_DU_PLACEMENT]
          : [placement(rang), placement(1)],
      ),
      ...attendusDeColonne('D', 3, rangs, (rang) =>
        rang === 1
          ? [placement(1) - placement(0)]
          : [
              placement(rang) - placement(rang - 1),
              TRESORERIE * TAUX_DU_PLACEMENT,
            ],
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
      auMillionieme(epargne(rang - 1) * TAUX_DE_L_EPARGNE);

    attendreLaFeuille(corrige, {
      ...attendusDeColonne('B', 3, rangs, (rang) =>
        rang === 2
          ? [epargne(rang), VERSEMENT * 2]
          : [epargne(rang), epargne(2)],
      ),
      ...attendusDeColonne('C', 3, rangs, (rang) =>
        rang === 2 ? [interets(rang)] : [interets(rang), 0, interets(2)],
      ),
      F3: [
        auMillionieme(epargne(VERSEMENTS) - VERSEMENT * VERSEMENTS),
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
});

const TIRAGE = tirer(COURS, 0);

function piegesDe(id: string): readonly (readonly [number, string])[] {
  if (id in TIRAGE.solutions) {
    return TIRAGE.solutions[id].pieges.map(({ valeur, misconception }) => [
      Number(valeur),
      misconception,
    ]);
  }
  const corrige = corrigeDe(COURS, id);
  if (corrige.type !== 'enigme') {
    throw new Error(`${id} n’est ni une numérique ni une énigme`);
  }
  return corrige.pieges.map(({ valeur, confusion }) => [valeur, confusion]);
}

describe('B2-05 — retours de la relecture adverse', () => {
  it('rattache « toute la durée » aux n versements placés n ans, et l’année de trop au rang décalé', () => {
    const cas = [
      ['b2-05-a2-valeur-acquise', VERSEMENT, TAUX_DE_L_EPARGNE, VERSEMENTS],
    ] as const;

    for (const [id, versement, taux, nombre] of cas) {
      const pieges = piegesDe(id);
      const valeurDe = (confusion: string) =>
        pieges.find(([, candidate]) => candidate === confusion)?.[0];

      expect(valeurDe('versements-places-toute-la-duree')).toBeCloseTo(
        placesToutLaDuree(versement, taux, nombre),
        2,
      );
      expect(valeurDe('rang-decale')).toBeCloseTo(
        suiteDAnnuites(versement, taux, nombre) * (1 + taux),
        2,
      );
    }
  });

  it('accepte au tableau de l’exercice 6 la dernière ligne ajustée pour solder le capital', () => {
    const corrige = corrigeDuTableauDAmortissement();
    const saisies = LIGNES_DE_L_EMPRUNT.map((ligne, rang) => ({
      interets: ligne.interets,
      amortissement:
        rang === LIGNES_DE_L_EMPRUNT.length - 1
          ? ligne.capital
          : ligne.amortissement,
    }));

    expect(LIGNES_DE_L_EMPRUNT.at(-1)?.capital).toBeCloseTo(12959.24, 2);
    expect(
      corrigerTableau(corrige, saisies).verdicts.filter(({ juste }) => !juste),
    ).toEqual([]);
  });

  it('annonce dans la consigne et la trace écrite le solde de quelques centimes laissé par l’annuité arrondie', () => {
    for (const ecran of [
      'B2-05-A3-03-COURS-EMPRUNT',
      'B2-05-A3-04-COURS-COUT-TABLEUR',
      'B2-05-A3-07-TABLEAU-AMORTISSEMENT',
    ]) {
      expect(texteDe(COURS_B2_05, ecran)).toContain('quelques centimes');
    }
  });

  it('garde le taux dans une seule cellule figée de VPM aux intérêts, dans la méthode tableur', () => {
    const methode = texteDe(COURS_B2_05, 'B2-05-A3-04-COURS-COUT-TABLEUR');

    expect(methode).toContain('=VPM(K1;K2;-K3)');
    expect(methode).toContain('=B2*$K$1');
    expect(methode).not.toContain('G1');
  });

  it('distingue l’amortissement d’un emprunt de la dotation d’une immobilisation, et le coût du crédit de ses frais', () => {
    expect(texteDe(COURS_B2_05, 'B2-05-A3-03-COURS-EMPRUNT')).toContain(
      'dotation',
    );
    expect(texteDe(COURS_B2_05, 'B2-05-A3-04-COURS-COUT-TABLEUR')).toContain(
      'assurance',
    );
  });
});
