import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import * as feuille from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import { motsHorsProgramme } from '../../../../../../../test/helpers/formations/cours/lecture-de-cours';
import {
  imagesMalDecrites,
  recapitulatifDe,
} from '../../../../../../../test/helpers/formations/cours/recit-en-images';
import { corrigerFeuille } from '../../../../domain/cours/correction/CorrectionProduction';
import { COURS_B2_07 } from './b2-07.cours';

const COURS = buildCoursDuContenu(COURS_B2_07);

const COUT_UNITAIRE = 8;
const DEMANDE_A_PRIX_NUL = 360;
const BAISSE_PAR_EURO = 12;
const CAPACITE = 120;
const PRIX_MINIMAL = 12;
const PRIX_MAXIMAL = 28;
const PRIX_DE_LA_FEUILLE = [13, 15, 17, 19, 21, 23, 25, 27] as const;
const DERNIERE_LIGNE = PRIX_DE_LA_FEUILLE.length + 1;
const PRIX_DE_LA_PENTE = 15;

const VENTES_DE_JANVIER = 400;
const K_DES_VENTES = 0.06;
const MOIS_DE_JUIN = 5;
const VENTES_EN_BOUTIQUE = 900;
const K_EN_BOUTIQUE = -0.04;
const MOIS_EN_BOUTIQUE = 10;

const COUT_DES_PANNES = 50;
const COUT_DES_REVISIONS = 2000;
const K_DES_REVISIONS = -0.1;

const benefice = (prix: number): number =>
  (prix - COUT_UNITAIRE) * (DEMANDE_A_PRIX_NUL - BAISSE_PAR_EURO * prix);
const pente = (prix: number): number =>
  -2 * BAISSE_PAR_EURO * prix +
  DEMANDE_A_PRIX_NUL +
  BAISSE_PAR_EURO * COUT_UNITAIRE;
const prixOptimal =
  (DEMANDE_A_PRIX_NUL + BAISSE_PAR_EURO * COUT_UNITAIRE) /
  (2 * BAISSE_PAR_EURO);
const prixSousContrainte = (DEMANDE_A_PRIX_NUL - CAPACITE) / BAISSE_PAR_EURO;

const g = (x: number): number => 2 * x ** 3 - 6 * x ** 2 + 5;
const gPrime = (x: number): number => 6 * x ** 2 - 12 * x;

const ventes = (mois: number): number =>
  VENTES_DE_JANVIER * Math.exp(K_DES_VENTES * mois);
const enBoutique = (mois: number): number =>
  VENTES_EN_BOUTIQUE * Math.exp(K_EN_BOUTIQUE * mois);

const cout = (semaines: number): number =>
  COUT_DES_PANNES * semaines +
  COUT_DES_REVISIONS * Math.exp(K_DES_REVISIONS * semaines);
const partDesRevisions =
  COUT_DES_PANNES / (-K_DES_REVISIONS * COUT_DES_REVISIONS);
const semainesOptimales = Math.log(partDesRevisions) / K_DES_REVISIONS;

const ECRANS_D_IMAGE_DU_RECAP = [
  'B2-07-A1-02-ENFANT-MULTIPLIER',
  'B2-07-A1-03-ENFANT-A-ET-K',
  'B2-07-A1-04-ENFANT-LN',
  'B2-07-A1-05-ENFANT-SEUIL',
  'B2-07-A1-07-ENFANT-BOUCLE',
  'B2-07-A1-08-ENFANT-TANT-QUE',
];

const identifiants = (): string[] => COURS.ecrans.map((ecran) => ecran.id);

fiche.decrireLaFicheDuCours('B2-07', COURS, {
  conception: 'b2/cours-b2-07-conception.md',
  ecrans: 35,
  dureeMinutes: 132,
  minutesParActe: [11, 46, 24, 43, 8, 0],
  rythme: { expositionContinueMax: 5, interactives: 105, exposition: 27 },
  ateliersNotes: [
    'A2-07 (10)',
    'A2-11 (10)',
    'A3-06 (10)',
    'A4-06 (10)',
    'A4-08 (10)',
  ],
  noteesParType: [9, 11, 0, 1, 0],
  enigmes: 0,
  rappels: 12,
  remediations: 17,
  options: 27,
  catalogue: [
    'A1-01',
    'A1-02',
    'A1-03',
    'A1-04',
    'A1-05',
    'A1-07',
    'A1-08',
    'A2-01',
    'A2-03',
    'A2-04',
    'A2-05',
    'A2-09',
    'A2-10',
    'A3-02',
    'A3-03',
    'A3-04',
    'A4-02',
    'A4-03',
    'A4-04',
    'A5-02',
  ],
  corrigesSurPlace: [
    'B2-07-A2-07-ATELIER-DERIVEES',
    'B2-07-A2-11-ATELIER-VENTES',
    'B2-07-A3-06-ATELIER-VARIATIONS',
    'B2-07-A4-06-ATELIER-PRIX',
    'B2-07-A4-07-TABLEUR-BENEFICE',
    'B2-07-A4-08-ATELIER-REVISIONS',
  ],
});

describe('B2-07 — le récapitulatif du cours 6 et de la boucle, en images', () => {
  it('RET-02 · récapitule en onze minutes, six écrans d’une idée et un vote, sans aucune question notée', () => {
    const recap = recapitulatifDe(COURS, COURS_B2_07, 'B2-07-A1-');

    expect(recap.minutes).toBe(11);
    expect(recap.ecransDImage).toEqual(ECRANS_D_IMAGE_DU_RECAP);
    expect(recap.briques).toContain('fp-vote');
    expect(recap.notees).toEqual([]);
  });

  it('B207-M2 · la scène de la plante multiplie par 1,5, comme sa flèche et son pont, sans lui ajouter une fois et demie sa taille', () => {
    const { paragraphs } = feuille.proprietesV2(
      COURS_B2_07,
      'B2-07-A1-02-ENFANT-MULTIPLIER',
    );
    const [scene] = paragraphs as string[];

    expect(scene).not.toMatch(/d’une fois et demie sa taille/u);
    expect(scene).toContain('une fois et demie plus haute');
  });

  it('B207-M2 · montre sur chaque écran d’image une image du cours, décrite pour qui ne la voit pas', () => {
    expect(imagesMalDecrites(COURS, COURS_B2_07)).toEqual([]);
  });
});

interface FigureServie {
  readonly formula: string;
  readonly tangents?: readonly { x: number; slope: number }[];
  readonly zone?: { from: number };
}

const blocsDe = (screenId: string) =>
  feuille.proprietesV2(COURS_B2_07, screenId).blocks as readonly {
    formula?: string;
  }[];

const figureDe = (screenId: string) =>
  feuille.proprietesV2(COURS_B2_07, screenId).figure as FigureServie;

describe('B2-07 — retours de Tim du 2026-11-19', () => {
  it('RET-01 · nomme chaque lettre de a e^(kx), une idée par ligne', () => {
    const { conclusion } = feuille.texteDeLImage(
      COURS_B2_07,
      'B2-07-A1-03-ENFANT-A-ET-K',
    );

    expect(conclusion.split('\n')).toEqual([
      'En maths, on écrit : f(x) = a e^(kx).',
      'a est la valeur de départ : f(0) = a × e⁰ = a × 1 = a.',
      'k règle le sens : k > 0, f croît ; k < 0, f décroît.',
      'e^k est le coefficient multiplicateur d’une unité à la suivante.',
      'Pour 1 000e^(0,02x) : a = 1 000 et e^0,02 ≈ 1,0202, soit + 2,02 % par unité, pas + 2 %.',
    ]);
  });

  it('RET-02 · retire l’écran des deux chemins et fait écrire la boucle de la plante dans l’écran de Tant que', () => {
    const { conclusion } = feuille.texteDeLImage(
      COURS_B2_07,
      'B2-07-A1-08-ENFANT-TANT-QUE',
    );

    expect(identifiants()).not.toContain('B2-07-A1-09-ENFANT-DEUX-CHEMINS');
    expect(JSON.stringify(COURS_B2_07)).not.toContain('deux-chemins');
    expect(conclusion).toContain(
      'u ← 1 ; n ← 0 ; Tant que u < 10 : n ← n + 1, u ← u × 1,5 ; Afficher n, soit 6.',
    );
    expect(conclusion).toContain('ln 10 ÷ ln 1,5 ≈ 5,68');
  });

  it('RET-03 · remplace le plongeoir par la colline −x² + 6x, pente après pente, jusqu’à la dérivée', () => {
    const ecran = COURS.ecrans.find(
      ({ id }) => id === 'B2-07-A2-04-COURBE-PENTES',
    );
    const props = feuille.proprietesV2(
      COURS_B2_07,
      'B2-07-A2-04-COURBE-PENTES',
    );
    const etapes = props.steps as readonly {
      text: string;
      tangent?: { slope: number };
    }[];

    expect([ecran?.dureeMinutes, ecran?.diffusion]).toEqual([2, 'catalogue']);
    expect((props.figure as FigureServie).formula).toBe('f(x) = −x² + 6x');
    expect(etapes.flatMap(({ tangent }) => tangent?.slope ?? [])).toEqual([
      4, 2, 0, -2, -4,
    ]);
    expect(etapes.at(-1)?.text).toContain('f′(x) = −2x + 6');
    expect(JSON.stringify(COURS_B2_07)).not.toContain('exposant-qui-saute');
    expect(blocsDe('B2-07-A2-05-COURS-DERIVEE')[0]?.formula).toContain(
      '(x²)′ = 2x',
    );
  });

  it.each([
    'B2-07-A2-05-COURS-DERIVEE',
    'B2-07-A2-10-COURS-DERIVEE-EXP',
    'B2-07-A4-04-COURS-OPTIMUM',
  ])(
    'RET-04 · %s écrit ses formules une par ligne, sous un titre court',
    (screenId) => {
      const { title } = feuille.proprietesV2(COURS_B2_07, screenId);
      const formules = blocsDe(screenId).flatMap(({ formula }) =>
        formula === undefined ? [] : [formula],
      );

      expect(String(title).length).toBeLessThanOrEqual(32);
      expect(formules.filter((formule) => formule.includes('·'))).toEqual([]);
      expect(formules.every((formule) => formule.includes('\n'))).toBe(true);
    },
  );

  it('RET-04 · dessine sous la dérivée de l’exponentielle la courbe de son exemple et sa pente en 0', () => {
    const figure = figureDe('B2-07-A2-10-COURS-DERIVEE-EXP');

    expect(figure.formula).toBe('f(x) = 1 000e^(0,02x)');
    expect(figure.tangents).toEqual([
      expect.objectContaining({ x: 0, slope: 20 }),
    ]);
  });

  it('RET-04 · dessine sous l’optimum la parabole de son exemple, son sommet et la barrière x ≥ 12', () => {
    const figure = figureDe('B2-07-A4-04-COURS-OPTIMUM');

    expect(figure.formula).toBe('f(x) = −2x² + 40x + 5');
    expect(figure.tangents).toEqual([
      expect.objectContaining({ x: 10, slope: 0 }),
    ]);
    expect(figure.zone?.from).toBe(12);
  });

  it.each(['B2-07-A2-12-JALON', 'B2-07-A3-07-JALON', 'B2-07-A4-09-JALON'])(
    'RET-06 · ne sert plus %s',
    (screenId) => {
      expect(identifiants()).not.toContain(screenId);
    },
  );
});

describe('B2-07 — chaque notion s’ouvre sur ses écrans d’image', () => {
  it('RET-03 · place un écran d’image ou la courbe juste avant chacune des quatre traces écrites', () => {
    const ids = identifiants();
    const precedents = ids
      .map((id, rang) => [id, ids[rang - 1]] as const)
      .filter(([id]) => id.includes('-COURS-'));

    expect(precedents).toEqual([
      ['B2-07-A2-05-COURS-DERIVEE', 'B2-07-A2-04-COURBE-PENTES'],
      ['B2-07-A2-10-COURS-DERIVEE-EXP', 'B2-07-A2-09-ENFANT-EXPONENTIELLE'],
      ['B2-07-A3-04-COURS-VARIATIONS', 'B2-07-A3-03-ENFANT-CARTE'],
      ['B2-07-A4-04-COURS-OPTIMUM', 'B2-07-A4-03-ENFANT-BORD'],
    ]);
  });

  it('B207-M3 · donne à la dérivée de e^(kx) son écran d’image et sa recette, dans la notion 1', () => {
    expect(
      feuille.texteDeLEcran(COURS_B2_07, 'B2-07-A2-09-ENFANT-EXPONENTIELLE'),
    ).toContain('(e^(kx))′ = k e^(kx)');
    expect(
      feuille.texteDeLEcran(COURS_B2_07, 'B2-07-A2-10-COURS-DERIVEE-EXP'),
    ).toContain('(e^(kx))′ = k e^(kx)');
  });

  it('B207-M4 · fait employer la dérivée de e^(kx) par l’exercice des ventes du B2-06 et par celui des révisions', () => {
    expect(
      feuille.texteDeLEcran(COURS_B2_07, 'B2-07-A2-11-ATELIER-VENTES'),
    ).toContain('400e^(0,06x)');
    expect(
      feuille.texteDeLEcran(COURS_B2_07, 'B2-07-A4-08-ATELIER-REVISIONS'),
    ).toContain('2 000e^(−0,1x)');
  });
});

describe('B2-07 — recalcul des corrigés depuis les seuls paramètres', () => {
  it('B207-M5 · recalcule les solutions et pièges des onze questions numériques', () => {
    fiche.attendreLesNumeriques(COURS, {
      'b2-07-a2-cube': [gPrime(3), 2 * 3 ** 2 - 6 * 3, gPrime(3) + 5, g(3)],
      'b2-07-a2-pente': [
        pente(PRIX_DE_LA_PENTE),
        benefice(PRIX_DE_LA_PENTE),
        -BAISSE_PAR_EURO * PRIX_DE_LA_PENTE + 456,
      ],
      'b2-07-a2-vitesse-juin': [
        K_DES_VENTES * ventes(MOIS_DE_JUIN),
        ventes(MOIS_DE_JUIN),
      ],
      'b2-07-a2-vitesse-boutique': [
        K_EN_BOUTIQUE * enBoutique(MOIS_EN_BOUTIQUE),
        -K_EN_BOUTIQUE * enBoutique(MOIS_EN_BOUTIQUE),
        enBoutique(MOIS_EN_BOUTIQUE),
      ],
      'b2-07-a3-depart': [benefice(PRIX_MINIMAL), pente(PRIX_MINIMAL)],
      'b2-07-a3-arrivee': [benefice(PRIX_MAXIMAL), pente(PRIX_MAXIMAL)],
      'b2-07-a4-maximum': [
        benefice(prixOptimal),
        prixOptimal,
        pente(prixOptimal),
      ],
      'b2-07-a4-prix': [prixSousContrainte, prixOptimal, PRIX_MAXIMAL],
      'b2-07-a4-benefice': [
        benefice(prixSousContrainte),
        benefice(prixOptimal),
        benefice(PRIX_MAXIMAL),
      ],
      'b2-07-a4-intervalle': [
        semainesOptimales,
        partDesRevisions / -K_DES_REVISIONS,
        -semainesOptimales,
      ],
      'b2-07-a4-cout-minimal': [cout(semainesOptimales), semainesOptimales, 0],
    });
  });
});

describe('B2-07 — la feuille du bénéfice corrigée par le moteur de formules', () => {
  const FORMULE_DU_BENEFICE = '=-12*A2^2+456*A2-2880';
  const FORMULE_DE_LA_PENTE = '=-24*A2+456';
  const JUSTES = {
    ...feuille.recopier(FORMULE_DU_BENEFICE, 'B', 2, DERNIERE_LIGNE),
    ...feuille.recopier(FORMULE_DE_LA_PENTE, 'C', 2, DERNIERE_LIGNE),
  };

  it('B207-M5 · reconnaît justes B(x) et B′(x) recopiés pour les prix impairs de 13 € à 27 €, B′ nul au sommet', () => {
    const corrige = fiche.corrigeDeFeuille(COURS, 'b2-07-a4-tableur-benefice');

    fiche.attendreLaFeuille(corrige, {
      ...feuille.attendusDeColonne('B', 2, PRIX_DE_LA_FEUILLE, (prix) => [
        benefice(prix),
      ]),
      ...feuille.attendusDeColonne('C', 2, PRIX_DE_LA_FEUILLE, (prix) => [
        pente(prix),
        -BAISSE_PAR_EURO * prix + 456,
        pente(prix) - 2880,
        benefice(prix),
      ]),
    });
    expect(corrigerFeuille(corrige, JUSTES).score).toBe(1);
    expect(
      corrige.attendus.find(({ reference }) => reference === 'C5')?.valeur,
    ).toBe(0);
  });

  it('B207-M5 · nomme dans B′(x) l’exposant non descendu, la constante gardée et la valeur prise pour la pente', () => {
    const corrige = fiche.corrigeDeFeuille(COURS, 'b2-07-a4-tableur-benefice');
    const avec = (formule: string): (string | null)[] =>
      feuille.confusionsDe(
        corrige,
        {
          ...feuille.recopier(FORMULE_DU_BENEFICE, 'B', 2, DERNIERE_LIGNE),
          ...feuille.recopier(formule, 'C', 2, DERNIERE_LIGNE),
        },
        'C',
      );
    const partout = (confusion: string): string[] =>
      PRIX_DE_LA_FEUILLE.map(() => confusion);

    expect(avec('=-12*A2+456')).toEqual(partout('exposant-non-descendu'));
    expect(avec('=-24*A2+456-2880')).toEqual(partout('constante-non-annulee'));
    expect(avec(FORMULE_DU_BENEFICE)).toEqual(
      partout('valeur-et-pente-confondues'),
    );
  });
});

describe('B2-07 — retours de la relecture adverse', () => {
  it('B207-M11 · sert la feuille du bénéfice après les exercices qui notent B(12), B(28) et B(19)', () => {
    const ids = identifiants();

    expect(ids.indexOf('B2-07-A4-07-TABLEUR-BENEFICE')).toBeGreaterThan(
      ids.indexOf('B2-07-A4-06-ATELIER-PRIX'),
    );
    expect(ids.indexOf('B2-07-A4-06-ATELIER-PRIX')).toBeGreaterThan(
      ids.indexOf('B2-07-A3-06-ATELIER-VARIATIONS'),
    );
  });

  it('ne parle ni de limite ni d’asymptote, hors programme', () => {
    expect(JSON.stringify(COURS_B2_07)).toContain('dérivée');
    expect(motsHorsProgramme(COURS_B2_07)).toEqual([]);
  });

  it('écrit la dérivée avec le signe prime, jamais avec une apostrophe droite', () => {
    const texte = JSON.stringify(COURS_B2_07);

    expect(texte).toContain('B′(x)');
    expect(texte).not.toMatch(/[fBCVWgK]'\(/u);
  });
});
