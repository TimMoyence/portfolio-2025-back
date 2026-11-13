import { COURS_B2_08 } from './b2-08.cours';
import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import * as feuille from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import * as lecture from '../../../../../../../test/helpers/formations/cours/lecture-de-cours';
import * as recit from '../../../../../../../test/helpers/formations/cours/recit-en-images';
import { nombreSansArrondi } from '../../../../../../common/domain/nombres/ecriture-francaise';
import { corrigerFeuille } from '../../../../domain/cours/correction/CorrectionProduction';
import { projeterCatalogue } from '../../../../domain/cours/diffusion/Diffusion';
import { ECHANTILLONS_D_UNE_COURBE } from '../../../../domain/cours/evaluation/TraceServi';
import { evaluerExpression } from '../../../../domain/cours/formule/Formule';

const COURS = buildCoursDuContenu(COURS_B2_08);

const f = (x: number): number => (3 * x - 2) * Math.exp(0.5 * x);
const fPrime = (x: number): number => (1.5 * x + 2) * Math.exp(0.5 * x);
const g = (x: number): number => (2 * x + 1) / (x + 3);
const gPrime = (x: number): number => 5 / (x + 3) ** 2;
const h = (x: number): number => Math.log(x ** 2 + 5);
const hPrime = (x: number): number => (2 * x) / (x ** 2 + 5);
const formel = (x: number): number => (x ** 2 + 1) * Math.exp(-x);
const formelPrime = (x: number): number => -((x - 1) ** 2) * Math.exp(-x);

const cout = (q: number): number => q ** 3 - 6 * q ** 2 + 20 * q + 100;
const coutMarginal = (q: number): number => 3 * q ** 2 - 12 * q + 20;
const coutMoyen = (q: number): number => cout(q) / q;

const demande = (p: number): number => 900 * Math.exp(-0.04 * p);
const recette = (p: number): number => p * demande(p);
const PRIX_D_EQUILIBRE = Math.log(9) / (0.04 + 0.05);
const PRIX_DE_LA_RECETTE_MAXIMALE = 1 / 0.04;

const abonnes = (t: number): number => 3000 / (1 + 29 * Math.exp(-0.5 * t));
const SEUIL_D_ABONNES = 2500;
const SOLUTION_EXACTE = -2 * Math.log((3000 / SEUIL_D_ABONNES - 1) / 29);
const MOIS_DE_LA_FEUILLE = Array.from(
  { length: 11 },
  (_, rang) => 9 + rang / 10,
);

function milieux(
  fonction: (t: number) => number,
  seuil: number,
  [depart, arrivee]: readonly [number, number],
  etapes: number,
): number[] {
  const calcules: number[] = [];
  let [a, b] = [depart, arrivee];
  for (let etape = 0; etape < etapes; etape += 1) {
    const milieu = (a + b) / 2;
    calcules.push(milieu);
    if (fonction(milieu) < seuil) {
      a = milieu;
    } else {
      b = milieu;
    }
  }
  return calcules;
}

const coutDExemple = (q: number): number =>
  q ** 3 / 12 - 1.5 * q ** 2 + 20 * q + 72;

fiche.decrireLaFicheDuCours('B2-08', COURS, {
  conception: 'b2/cours-b2-08-conception.md',
  ...recit.TRAME_DE_135_MINUTES,
  ateliersNotes: [
    'A2-06 (10)',
    'A2-10 (10)',
    'A3-06 (8)',
    'A3-10 (8)',
    'A4-07 (8)',
  ],
  noteesParType: [8, 10, 0, 1, 0],
  enigmes: 0,
  rappels: 12,
  remediations: 15,
  options: 30,
  catalogue: [
    'A1-01',
    'A1-02',
    'A1-03',
    'A1-04',
    'A1-06',
    'A1-07',
    'A2-01',
    'A2-03',
    'A2-04',
    'A2-08',
    'A2-09',
    'A3-02',
    'A3-03',
    'A3-04',
    'A3-08',
    'A3-09',
    'A4-02',
    'A4-03',
    'A4-04',
    'A4-05',
    'A5-02',
  ],
  corrigesSurPlace: [
    'B2-08-A2-06-ATELIER-PRODUIT',
    'B2-08-A2-10-ATELIER-COMPOSEES',
    'B2-08-A3-06-ATELIER-COUTS',
    'B2-08-A3-10-ATELIER-MARCHE',
    'B2-08-A4-07-ATELIER-SOLUTIONS',
    'B2-08-A4-08-TABLEUR-BALAYAGE',
  ],
});

describe('B2-08 — le récapitulatif du B2-07, en images déjà servies', () => {
  recit.decrireLeRecapitulatifEnImages(COURS, COURS_B2_08, {
    acte: 'B2-08-A1-',
    minutes: 12,
    images: [
      '/assets/cours/b2-07/v1/velo-sur-la-colline.webp',
      '/assets/cours/b2-07/v1/exposant-qui-saute.webp',
      '/assets/cours/b2-07/v1/boule-de-neige.webp',
      '/assets/cours/b2-07/v1/panneaux-de-la-route.webp',
      '/assets/cours/b2-07/v1/sommet-de-la-colline.webp',
    ],
    references: ['B208-02', 'IMG-02'],
  });

  it('IMG-02 · n’écrit au catalogue, images réemployées comprises, aucune réponse ni aucun piège à trois chiffres d’un exercice', () => {
    expect(
      recit.reponsesAuCatalogue(
        COURS,
        fiche.corrigeDeFeuille(COURS, 'b2-08-a4-tableur-balayage').attendus,
      ),
    ).toEqual([]);
  });
});

describe('B2-08 — chaque notion s’ouvre sur sa réflexion et ses écrans', () => {
  it('B208-03 · fait lire une sortie de calcul formel et la confronter au calcul à la main', () => {
    const exercice = feuille.texteDeLEcran(
      COURS_B2_08,
      'B2-08-A2-10-ATELIER-COMPOSEES',
    );

    expect(exercice).toContain('Un logiciel de calcul formel affiche');
    expect(exercice).toContain('−(x − 1)²e^(−x)');
    expect(
      feuille.texteDeLEcran(COURS_B2_08, 'B2-08-A2-09-COURS-EXP-LN'),
    ).toContain('calcul formel');
  });

  it('B208-04 · lit le coût marginal comme C′(q) et le prix d’équilibre où l’offre égale la demande', () => {
    const couts = feuille.texteDeLEcran(COURS_B2_08, 'B2-08-A3-04-COURS-COUTS');
    const marche = feuille.texteDeLEcran(
      COURS_B2_08,
      'B2-08-A3-09-COURS-MARCHE',
    );

    expect(couts).toContain('Cm(q) ≈ C′(q)');
    expect(couts).toContain('CM(q) = C(q) ÷ q');
    expect(marche).toContain('R(p) = p × D(p)');
    expect(marche).toContain('D(p) = O(p)');
  });

  it('B208-05 · cherche le nombre de solutions de f(x) = k par les variations, puis balaie et coupe en deux sur le modèle A / (1 + a e^(−bt))', () => {
    const lecon = feuille.texteDeLEcran(
      COURS_B2_08,
      'B2-08-A4-05-COURS-SOLUTIONS',
    );

    expect(lecon).toContain('strictement');
    expect(lecon).toContain('balayage');
    expect(lecon).toContain('dichotomie');
    expect(
      feuille.texteDeLEcran(COURS_B2_08, 'B2-08-A4-07-ATELIER-SOLUTIONS'),
    ).toContain('3 000 / (1 + 29e^(−0,5t))');
  });
});

describe('B2-08 — recalcul des corrigés depuis les seuls paramètres', () => {
  it('B208-06 · recalcule les solutions et pièges des dix questions numériques', () => {
    const [, , , quatrieme] = milieux(abonnes, SEUIL_D_ABONNES, [0, 20], 4);
    const [, deuxieme, troisieme] = milieux(
      abonnes,
      SEUIL_D_ABONNES,
      [0, 20],
      3,
    );

    fiche.attendreLesNumeriques(COURS, {
      'b2-08-a2-produit-valeur': [fPrime(2), 3 * 0.5 * Math.exp(1), f(2)],
      'b2-08-a2-quotient-valeur': [gPrime(1), -gPrime(1), 5 / 4, g(1)],
      'b2-08-a2-ln-valeur': [hPrime(3), 1 / 14, h(3)],
      'b2-08-a2-calcul-formel-valeur': [formelPrime(2), formel(2)],
      'b2-08-a3-cout-marginal': [coutMarginal(3), coutMoyen(3)],
      'b2-08-a3-cout-moyen-minimal': [coutMoyen(5), 5, coutMarginal(2)],
      'b2-08-a3-prix-equilibre': [PRIX_D_EQUILIBRE, Math.log(9) / 0.01],
      'b2-08-a3-recette-maximale': [
        recette(PRIX_DE_LA_RECETTE_MAXIMALE),
        PRIX_DE_LA_RECETTE_MAXIMALE,
        demande(PRIX_DE_LA_RECETTE_MAXIMALE),
      ],
      'b2-08-a4-valeur-approchee': [
        Math.floor(SOLUTION_EXACTE * 10) / 10,
        Math.ceil(SOLUTION_EXACTE * 10) / 10,
      ],
      'b2-08-a4-dichotomie': [quatrieme, (deuxieme + troisieme) / 2],
    });
  });

  it('B208-06 · trouve le minimum du coût moyen là où il égale le coût marginal', () => {
    expect(coutMoyen(5)).toBe(coutMarginal(5));
    expect(coutDExemple(12) / 12).toBe(12 ** 2 / 4 - 3 * 12 + 20);
  });
});

describe('B2-08 — la feuille de balayage corrigée par le moteur de formules', () => {
  const FORMULE = '=3000/(1+29*EXP(-0,5*A2))';

  it('B208-05 · reconnaît juste N(t) recopié de 9 à 10 mois au pas de 0,1, la valeur 2 500 franchie entre 9,9 et 10', () => {
    const corrige = fiche.corrigeDeFeuille(COURS, 'b2-08-a4-tableur-balayage');

    fiche.attendreLaFeuille(
      corrige,
      feuille.attendusDeColonne('B', 2, MOIS_DE_LA_FEUILLE, (mois) => [
        abonnes(mois),
        3000 / (1 + 29 * Math.exp(0.5 * mois)),
      ]),
    );
    expect(
      corrigerFeuille(corrige, feuille.recopier(FORMULE, 'B', 2, 12)).score,
    ).toBe(1);
    expect(abonnes(9.9)).toBeLessThan(SEUIL_D_ABONNES);
    expect(abonnes(10)).toBeGreaterThan(SEUIL_D_ABONNES);
  });

  it('B208-05 · nomme le signe de l’exposant perdu dans toute la colonne', () => {
    const corrige = fiche.corrigeDeFeuille(COURS, 'b2-08-a4-tableur-balayage');

    expect(
      feuille.confusionsDe(
        corrige,
        feuille.recopier('=3000/(1+29*EXP(0,5*A2))', 'B', 2, 12),
        'B',
      ),
    ).toEqual(MOIS_DE_LA_FEUILLE.map(() => 'signe-de-k-ignore'));
  });
});

type TraceDuCours = Extract<
  (typeof COURS_B2_08.ecrans)[number],
  { brique: 'fp-plot' }
>;

const traces = (): TraceDuCours[] =>
  COURS_B2_08.ecrans.flatMap((ecran) =>
    ecran.brique === 'fp-plot' ? [ecran] : [],
  );

const trace = (screenId: string): TraceDuCours['proprietes'] => {
  const ecran = traces().find((candidat) => candidat.screenId === screenId);
  if (ecran === undefined) {
    throw new Error(`aucun tracé ${screenId}`);
  }
  return ecran.proprietes;
};

const PAS_DE_RECHERCHE_DES_RENCONTRES = 4800;

function rencontresAvecLaDroite(screenId: string): Map<number, number> {
  const { abscisse, parametres, series } = trace(screenId);
  const [curseur] = parametres;
  const [courbe] = series;
  const largeur =
    (abscisse.max - abscisse.min) / PAS_DE_RECHERCHE_DES_RENCONTRES;
  const positions = Array.from(
    { length: Math.round((curseur.max - curseur.min) / curseur.pas) + 1 },
    (_, rang) => curseur.min + rang * curseur.pas,
  );
  return new Map(
    positions.map((k) => {
      const ecarts = Array.from(
        { length: PAS_DE_RECHERCHE_DES_RENCONTRES + 1 },
        (_, rang) =>
          Math.sign(
            (evaluerExpression(courbe.calcul, {
              x: abscisse.min + rang * largeur,
            }).valeur ?? Number.NaN) - k,
          ),
      );
      const rencontres = ecarts.filter(
        (signe, rang) =>
          signe === 0 || (rang > 0 && signe * ecarts[rang - 1] === -1),
      ).length;
      return [k, rencontres];
    }),
  );
}

describe('B2-08 — les graphiques tracent les exemples du cours, jamais un exercice', () => {
  it('B208-04 · sert les cinq graphiques au catalogue, sans référence, le livret imprimant le réglage par défaut', () => {
    expect(traces().map((ecran) => [ecran.screenId, ecran.diffusion])).toEqual([
      ['B2-08-A3-02-GRAPHE-TANGENTE', 'catalogue'],
      ['B2-08-A3-03-GRAPHE-COUT-MOYEN', 'catalogue'],
      ['B2-08-A3-08-GRAPHE-MARCHE', 'catalogue'],
      ['B2-08-A4-02-GRAPHE-DROITE-K', 'catalogue'],
      ['B2-08-A4-03-GRAPHE-LOGISTIQUE', 'catalogue'],
    ]);
    expect(traces().filter((ecran) => 'reference' in ecran.proprietes)).toEqual(
      [],
    );
  });

  it('CONF-01 · ne sert dans aucun graphique un nombre égal, au centième, à une réponse ou à un piège d’exercice', () => {
    const corrige = fiche.corrigeDeFeuille(COURS, 'b2-08-a4-tableur-balayage');
    const notees = recit.reponsesEtPiegesNotables(COURS, corrige.attendus);
    const servis = projeterCatalogue(COURS).ecrans.filter((ecran) =>
      ecran.id.includes('-GRAPHE-'),
    );

    expect(servis).toHaveLength(5);
    expect(recit.nombresServisEgauxAuCentieme(servis, notees)).toEqual([]);
  });

  it('PLOT-01 · pose chaque position d’un curseur d’abscisse sur un jalon d’un axe long d’un multiple de 24', () => {
    const horsJalon = traces().flatMap(({ screenId, proprietes }) => {
      const { min, max } = proprietes.abscisse;
      const ecart = (max - min) / ECHANTILLONS_D_UNE_COURBE;
      const axe = max - min;
      return [
        ...(axe % ECHANTILLONS_D_UNE_COURBE === 0
          ? []
          : [`${screenId} : axe de ${axe}`]),
        ...proprietes.parametres
          .filter(({ cle }) => cle !== 'k')
          .flatMap(({ cle, min: debut, max: fin, pas }) =>
            Array.from(
              { length: Math.round((fin - debut) / pas) + 1 },
              (_, rang) => debut + rang * pas,
            )
              .filter((position) => {
                const jalon = (position - min) / ecart;
                return Math.abs(jalon - Math.round(jalon)) > 1e-9;
              })
              .map((position) => `${screenId} : ${cle} = ${position}`),
          ),
      ];
    });

    expect(horsJalon).toEqual([]);
  });

  it('PLOT-01 · fait passer la tangente par le point de la courbe du coût, à chaque position de q', () => {
    const { parametres, series } = trace('B2-08-A3-02-GRAPHE-TANGENTE');
    const [curseur] = parametres;
    const [courbe, tangente] = series;
    const ecarts = Array.from(
      { length: (curseur.max - curseur.min) / curseur.pas + 1 },
      (_, rang) => curseur.min + rang * curseur.pas,
    ).filter((q) => {
      const variables = { x: q, q };
      const surLaCourbe = evaluerExpression(courbe.calcul, variables).valeur;
      return (
        surLaCourbe === null ||
        Math.abs(surLaCourbe - coutDExemple(q)) > 1e-6 ||
        Math.abs(
          (evaluerExpression(tangente.calcul, variables).valeur ?? Number.NaN) -
            surLaCourbe,
        ) > 1e-6
      );
    });

    expect(curseur.cle).toBe('q');
    expect(ecarts).toEqual([]);
  });

  it('PLOT-01 · nomme dans chaque description le nombre que l’élève lit et où il le lit', () => {
    expect(trace('B2-08-A3-02-GRAPHE-TANGENTE').description).toContain(
      'C′(12) = 20',
    );
    expect(trace('B2-08-A3-03-GRAPHE-COUT-MOYEN').description).toContain(
      'en q = 12',
    );
    expect(trace('B2-08-A3-08-GRAPHE-MARCHE').description).toContain('17,33 €');
    expect(trace('B2-08-A4-02-GRAPHE-DROITE-K').description).toContain('73,58');
    expect(trace('B2-08-A4-03-GRAPHE-LOGISTIQUE').description).toContain(
      'une seule fois',
    );
  });

  it('PLOT-01 · B208-05 · fait voir, à chaque position servie de k, deux rencontres sous le sommet ou aucune au-dessus, comme l’annonce la description', () => {
    const rencontres = [
      ...rencontresAvecLaDroite('B2-08-A4-02-GRAPHE-DROITE-K').values(),
    ];

    expect(rencontres.filter((nombre) => nombre !== 0 && nombre !== 2)).toEqual(
      [],
    );
    expect(new Set(rencontres)).toEqual(new Set([0, 2]));
    const {
      description,
      parametres: [curseur],
    } = trace('B2-08-A4-02-GRAPHE-DROITE-K');
    expect(description).not.toContain('au sommet, une seule');
    expect(description).toContain(
      `de ${nombreSansArrondi(curseur.min)} à ${nombreSansArrondi(curseur.max)}`,
    );
  });

  it('PLOT-01 · B208-05 · fait voir une seule rencontre à chaque position servie de k, sur la courbe qui monte toujours', () => {
    const rencontres = rencontresAvecLaDroite('B2-08-A4-03-GRAPHE-LOGISTIQUE');
    const {
      description,
      parametres: [curseur],
    } = trace('B2-08-A4-03-GRAPHE-LOGISTIQUE');

    expect(
      [...rencontres].filter(([, nombre]) => nombre !== 1).map(([k]) => k),
    ).toEqual([]);
    expect(description).toContain(
      `entre ${nombreSansArrondi(curseur.min)} et ${nombreSansArrondi(curseur.max)}`,
    );
  });
});

describe('B2-08 — retours de relecture', () => {
  it('ne parle ni de limite ni d’asymptote, hors programme', () => {
    expect(JSON.stringify(COURS_B2_08)).toContain('dérivée');
    expect(lecture.motsHorsProgramme(COURS_B2_08)).toEqual([]);
  });

  it('écrit la dérivée avec le signe prime, jamais avec une apostrophe droite', () => {
    const texte = JSON.stringify(COURS_B2_08);

    expect(texte).toContain('C′(q)');
    expect(texte).not.toMatch(/[fghCRNuv]'\(/u);
  });
});
