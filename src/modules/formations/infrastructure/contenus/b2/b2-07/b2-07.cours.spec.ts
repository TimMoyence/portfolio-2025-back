import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import * as feuille from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import { motsHorsProgramme } from '../../../../../../../test/helpers/formations/cours/lecture-de-cours';
import { corrigerFeuille } from '../../../../domain/cours/correction/CorrectionProduction';
import { questionsDe } from '../../../../domain/cours/structure/Cours';
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

const ECRANS_ENFANT_DU_RECAP = [
  'B2-07-A1-02-ENFANT-MULTIPLIER',
  'B2-07-A1-03-ENFANT-A-ET-K',
  'B2-07-A1-04-ENFANT-LN',
  'B2-07-A1-05-ENFANT-SEUIL',
  'B2-07-A1-07-ENFANT-BOUCLE',
  'B2-07-A1-08-ENFANT-TANT-QUE',
  'B2-07-A1-09-ENFANT-DEUX-CHEMINS',
];

const identifiants = (): string[] => COURS.ecrans.map((ecran) => ecran.id);

fiche.decrireLaFicheDuCours('B2-07', COURS, {
  conception: 'cours-b2-07-conception.md',
  ecrans: 39,
  dureeMinutes: 135,
  minutesParActe: [12, 46, 25, 44, 8, 0],
  rythme: { expositionContinueMax: 5, interactives: 105, exposition: 30 },
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
    'A1-09',
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

describe('B2-07 — le récapitulatif du cours 6 et de la boucle, comme à cinq ans', () => {
  it('B207-M2 · récapitule en douze minutes, sept écrans d’une idée et un vote, sans aucune question notée', () => {
    const recap = COURS.ecrans.filter((ecran) =>
      ecran.id.startsWith('B2-07-A1-'),
    );

    expect(recap.reduce((total, ecran) => total + ecran.dureeMinutes, 0)).toBe(
      12,
    );
    expect(
      recap
        .filter((ecran) => ecran.id.includes('-ENFANT-'))
        .map(({ id }) => id),
    ).toEqual(ECRANS_ENFANT_DU_RECAP);
    expect(recap.map((ecran) => ecran.brique)).toContain('fp-vote');
    expect(
      recap.flatMap((ecran) => questionsDe(ecran)).filter((q) => q.noteCompte),
    ).toEqual([]);
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

  it('B207-M2 · montre sur chaque écran comme à cinq ans une image, l’idée, puis le pont vers la notation', () => {
    const ecrans = identifiants().filter((id) => id.includes('-ENFANT-'));

    expect(ecrans).toHaveLength(14);
    for (const ecran of ecrans) {
      const { title, image, imageAlt, paragraphs } = feuille.proprietesV2(
        COURS_B2_07,
        ecran,
      );

      expect(title).toEqual(expect.stringMatching(/^Comme à cinq ans : /u));
      expect(COURS.medias.map(({ chemins }) => chemins[0])).toContain(image);
      expect(String(imageAlt).length).toBeGreaterThan(40);
      expect(paragraphs).toHaveLength(3);
      expect((paragraphs as string[])[2]).toMatch(/^En maths, on écrit/u);
    }
  });
});

describe('B2-07 — chaque notion s’ouvre sur ses écrans comme à cinq ans', () => {
  it('B207-M3 · place un écran comme à cinq ans juste avant chacune des quatre traces écrites', () => {
    const ids = identifiants();
    const precedents = ids
      .map((id, rang) => [id, ids[rang - 1]] as const)
      .filter(([id]) => id.includes('-COURS-'));

    expect(precedents).toEqual([
      ['B2-07-A2-05-COURS-DERIVEE', 'B2-07-A2-04-ENFANT-RECETTE'],
      ['B2-07-A2-10-COURS-DERIVEE-EXP', 'B2-07-A2-09-ENFANT-EXPONENTIELLE'],
      ['B2-07-A3-04-COURS-VARIATIONS', 'B2-07-A3-03-ENFANT-CARTE'],
      ['B2-07-A4-04-COURS-OPTIMUM', 'B2-07-A4-03-ENFANT-BORD'],
    ]);
  });

  it('B207-M3 · donne à la dérivée de e^(kx) son écran comme à cinq ans et sa recette, dans la notion 1', () => {
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
