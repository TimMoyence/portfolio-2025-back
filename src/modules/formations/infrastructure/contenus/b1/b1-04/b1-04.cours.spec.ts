import { COURS_B1_04 } from './b1-04.cours';
import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import * as feuilleDeCours from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import { valeursAuCatalogue } from '../../../../../../../test/helpers/formations/cours/relecture-de-cours';
import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import { arrondi } from '../../../../../../common/domain/nombres/arrondi';
import { nombreFrancais } from '../../../../../../common/domain/nombres/ecriture-francaise';
import { questionsDuCours } from '../../../../domain/cours/structure/Cours';
import { verifierStructure } from '../../../../domain/cours/structure/StructureCours';
import { corrigerFeuille } from '../../../../domain/cours/correction/CorrectionProduction';
import {
  BUDGETS_DU_SITE,
  CA_DE_NANTES,
  CA_DU_SITE,
  CHOCOLATS_CHAUDS,
  ESPERANCES_DE_VIE,
  JEUX_VENDUS,
  SOIREES_DE_NANTES,
  TEMPERATURES_DE_NANTES,
} from './b1-04.donnees';

const COURS = buildCoursDuContenu(COURS_B1_04);
const NUAGE_DE_L_ANNALE = 'B1-04-A3-05-NUAGE-ANNALE';

const moyenne = (serie: readonly number[]): number =>
  serie.reduce((total, valeur) => total + valeur, 0) / serie.length;

function ajustement(x: readonly number[], y: readonly number[]) {
  const [mx, my] = [moyenne(x), moyenne(y)];
  const sxy = x.reduce((total, xi, i) => total + (xi - mx) * (y[i] - my), 0);
  const sxx = x.reduce((total, xi) => total + (xi - mx) ** 2, 0);
  const syy = y.reduce((total, yi) => total + (yi - my) ** 2, 0);
  const a = sxy / sxx;
  return { mx, my, a, b: my - a * mx, r: sxy / Math.sqrt(sxx * syy) };
}

const SITE = ajustement(BUDGETS_DU_SITE, CA_DU_SITE);
const SITE_INVERSE = ajustement(CA_DU_SITE, BUDGETS_DU_SITE);
const TEMPERATURE = ajustement(TEMPERATURES_DE_NANTES, CA_DE_NANTES);
const TEMPERATURE_INVERSEE = ajustement(CA_DE_NANTES, TEMPERATURES_DE_NANTES);
const SOIREES = ajustement(SOIREES_DE_NANTES, CA_DE_NANTES);
const SANS_DOLLAR = ajustement(SOIREES_DE_NANTES, TEMPERATURES_DE_NANTES);
const CHOCOLATS = ajustement(CHOCOLATS_CHAUDS, JEUX_VENDUS);
const RANGS = ESPERANCES_DE_VIE.map((_, rang) => rang);
const ANNALE = ajustement(RANGS, ESPERANCES_DE_VIE);
const ANNALE_INVERSEE = ajustement(ESPERANCES_DE_VIE, RANGS);
const PAR_D = (rang: number): number => 0.1 * rang + 84.2;

const REPONSES_PAR_EXERCICE = [
  [
    'A1-10-TABLEUR-AJUSTEMENT',
    [
      nombreFrancais(SITE.my, 0),
      nombreFrancais(arrondi(SITE.a, 2), 2),
      nombreFrancais(arrondi(SITE.b, 2), 2),
    ],
  ],
  [
    'A2-05-TABLEUR-CORRELATION',
    [
      nombreFrancais(arrondi(SOIREES.r, 3), 3),
      nombreFrancais(arrondi(TEMPERATURE.a, 2), 2),
      nombreFrancais(arrondi(SOIREES.a, 2), 2),
      nombreFrancais(arrondi(TEMPERATURE.b, 2), 2),
      nombreFrancais(arrondi(SOIREES.b, 2), 2),
    ],
  ],
  ['A2-06-ATELIER-CAUSALITE', [nombreFrancais(arrondi(CHOCOLATS.r, 3), 3)]],
  [
    'A3-06-ATELIER-ANNALE',
    [
      nombreFrancais(arrondi(ANNALE.r, 3), 3),
      nombreFrancais(arrondi(ANNALE.b, 2), 2),
      '86,1',
    ],
  ],
] as const;

const MOTS_DU_COURS =
  /nuage|point|droite|ajust|corrélation|coefficient|série|valeur|moyen|prévi|seuil|cause|causalité|\d/i;

fiche.decrireLaFicheDuCours('B1-04', COURS, {
  ...fiche.FORME_DES_COURS_B1,
  conception: 'b1/cours-b1-04-conception.md',
  ecrans: 33,
  minutesParActe: [45, 36, 32, 8, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 93, exposition: 28 },
  noteesParType: [5, 5, 0, 2, 0],
  enigmes: 0,
  rappels: 12,
  options: 21,
  catalogue: fiche.CATALOGUE_ILLUSTRE_JUSQU_A_LA_PAGE_A4_02,
  ateliersNotes: ['A2-06 (8)', 'A3-06 (13)'],
  remediations: 10,
  corrigesSurPlace: [
    'B1-04-A1-10-TABLEUR-AJUSTEMENT',
    'B1-04-A2-05-TABLEUR-CORRELATION',
    'B1-04-A2-06-ATELIER-CAUSALITE',
    'B1-04-A3-06-ATELIER-ANNALE',
  ],
});

const ECRANS_POUR_COMPRENDRE = [
  [
    'A1-06',
    'PLATEAU',
    'NUAGE',
    'plateau-equilibre',
    ['nuage de points', 'point moyen'],
  ],
  ['A1-07', 'BATON', 'DROITE', 'baton-ficelles', ['moindres carrés']],
  [
    'A2-02',
    'OISEAUX',
    'CORRELATION',
    'oiseaux-vols',
    ['coefficient de corrélation'],
  ],
  ['A2-03', 'PLUIE', 'CAUSALITE', 'pluie-parapluies', ['cause']],
  [
    'A3-02',
    'PIERRES',
    'PREVOIR',
    'pierres-brouillard',
    ['interpoler', 'extrapoler'],
  ],
  ['A3-03', 'CHAMBRANLE', 'SEUIL', 'chambranle-traits', ['seuil']],
] as const;

describe('B1-04 — les écrans « pour comprendre »', () => {
  feuilleDeCours.decrireLesEcransPourComprendre(
    'B1-04',
    COURS_B1_04,
    ECRANS_POUR_COMPRENDRE,
    MOTS_DU_COURS,
  );

  it('B104-M2 · garde une seule page par notion, chacune avec sa méthode et sans encadré « Au CCF »', () => {
    expect(fiche.pagesDeCours(COURS_B1_04).map((id) => id.slice(12))).toEqual([
      'COURS-NUAGE',
      'COURS-DROITE',
      'COURS-CORRELATION',
      'COURS-CAUSALITE',
      'COURS-PREVOIR',
      'COURS-SEUIL',
    ]);
    expect(fiche.pagesSansMethodeOuAvecEncadreCcf(COURS_B1_04)).toEqual([]);
  });
});

describe('B1-04 — les graphes dessinés par le code', () => {
  it('B104-M3 · montre avant l’exercice 1 le nuage du site web, sans point moyen ni droite', () => {
    const props = feuilleDeCours.proprietesV2(
      COURS_B1_04,
      'B1-04-A1-09-NUAGE-SITE',
    );

    expect(props.points).toEqual(
      BUDGETS_DU_SITE.map((x, rang) =>
        expect.objectContaining({ x, y: CA_DU_SITE[rang] }),
      ),
    );
    expect(props).not.toHaveProperty('meanPoint');
    expect(props).not.toHaveProperty('line');
  });

  it('B104-M8 · ne place sur le nuage du site web aucun point égal à x̄, ȳ, a ou b', () => {
    const coordonnees = BUDGETS_DU_SITE.flatMap((x, rang) => [
      x,
      CA_DU_SITE[rang],
    ]);

    expect(
      [SITE.mx, SITE.my, arrondi(SITE.a, 2), arrondi(SITE.b, 2)].filter(
        (reponse) => coordonnees.includes(reponse),
      ),
    ).toEqual([]);
  });

  it('B104-M3 · montre avant l’exercice 4 le nuage de l’annale et la droite D, en séance', () => {
    const ecran = COURS_B1_04.ecrans.find(
      ({ screenId }) => screenId === NUAGE_DE_L_ANNALE,
    );
    const props = feuilleDeCours.proprietesV2(COURS_B1_04, NUAGE_DE_L_ANNALE);

    expect(ecran?.diffusion).toBe('seance');
    expect(props.points).toEqual(
      ESPERANCES_DE_VIE.map((y, x) => expect.objectContaining({ x, y })),
    );
    expect(props.line).toEqual(
      expect.objectContaining({ slope: 0.1, intercept: 84.2 }),
    );
  });

  it('B104-M7 · n’écrit ni 85,4 ni 86,1 dans le titre ni dans la description du nuage de l’annale', () => {
    const { title, description } = feuilleDeCours.proprietesV2(
      COURS_B1_04,
      NUAGE_DE_L_ANNALE,
    );
    const ecran = COURS_B1_04.ecrans.find(
      ({ screenId }) => screenId === NUAGE_DE_L_ANNALE,
    );

    expect(
      [String(title), String(description), String(ecran?.titre)].filter(
        (texte) => /85,4|86,1/.test(texte),
      ),
    ).toEqual([]);
    expect(String(description)).toContain('droite D');
  });
});

describe('B1-04 — les nombres recalculés depuis les données', () => {
  it('B104-M4 · attend à l’exercice 1 le point moyen, a et b, avec leurs pièges', () => {
    fiche.attendreLaFeuille(
      fiche.corrigeDeFeuille(COURS, 'b1-04-a1-tableur-ajustement'),
      {
        E2: [
          SITE.mx,
          SITE.my,
          BUDGETS_DU_SITE.reduce((total, x) => total + x, 0),
        ],
        E3: [SITE.my, SITE.mx],
        E4: [arrondi(SITE.a, 2), arrondi(SITE_INVERSE.a, 2), SITE.a],
        E5: [arrondi(SITE.b, 2), arrondi(SITE_INVERSE.b, 2), SITE.b],
      },
    );
  });

  it('B104-M4 · attend à l’exercice 2 r, a et b des deux séries, recopiés vers la droite', () => {
    fiche.attendreLaFeuille(
      fiche.corrigeDeFeuille(COURS, 'b1-04-a2-tableur-correlation'),
      {
        F2: [arrondi(TEMPERATURE.r, 3), TEMPERATURE.r],
        F3: [arrondi(TEMPERATURE.a, 2), arrondi(TEMPERATURE_INVERSEE.a, 2)],
        F4: [arrondi(TEMPERATURE.b, 2), arrondi(TEMPERATURE_INVERSEE.b, 2)],
        G2: [arrondi(SOIREES.r, 3), arrondi(SANS_DOLLAR.r, 3)],
        G3: [arrondi(SOIREES.a, 2), arrondi(SANS_DOLLAR.a, 2)],
        G4: [arrondi(SOIREES.b, 2), arrondi(SANS_DOLLAR.b, 2)],
      },
    );
  });

  it('B104-M4 · retient l’ajustement à la température, au r négatif mais plus proche de −1', () => {
    expect(TEMPERATURE.r).toBeLessThan(0);
    expect(Math.abs(TEMPERATURE.r)).toBeGreaterThan(Math.abs(SOIREES.r));
    expect(SOIREES.r).toBeGreaterThan(0);
    expect(SANS_DOLLAR.r).not.toBeCloseTo(SOIREES.r, 3);
  });

  it('B104-M4 · recalcule le r des chocolats et les réponses de l’annale, avec leurs pièges', () => {
    fiche.attendreLesNumeriques(COURS, {
      'b1-04-a2-r-chocolats': [
        arrondi(CHOCOLATS.r, 3),
        arrondi(CHOCOLATS.a, 3),
      ],
      'b1-04-a3-annale-r': [arrondi(ANNALE.r, 3), arrondi(ANNALE.a, 3)],
      'b1-04-a3-annale-a': [
        arrondi(ANNALE.a, 2),
        arrondi(ANNALE_INVERSEE.a, 2),
      ],
      'b1-04-a3-annale-b': [
        arrondi(ANNALE.b, 2),
        arrondi(ANNALE_INVERSEE.b, 2),
      ],
      'b1-04-a3-annale-2018': [PAR_D(2018 - 2006), PAR_D(2018)],
    });
  });

  it('B104-M5 · publie les réponses de l’annale de Polynésie 2018 et juge P fausse au rang 19', () => {
    const publiees = Object.fromEntries(
      questionsDuCours(COURS).flatMap((question) =>
        question.type === 'numeric'
          ? [[question.id, question.formePubliee]]
          : [],
      ),
    );

    expect(publiees).toEqual(
      expect.objectContaining({
        'b1-04-a3-annale-r': '0,945',
        'b1-04-a3-annale-a': '0,12',
        'b1-04-a3-annale-b': '84,17',
        'b1-04-a3-annale-2018': '85,4 ans',
      }),
    );
    expect(PAR_D(18)).toBeCloseTo(86, 10);
    expect(PAR_D(19)).toBeGreaterThan(86);
    expect(
      feuilleDeCours.texteDeLEcran(COURS_B1_04, 'B1-04-A3-06-ATELIER-ANNALE'),
    ).toMatch(/Polynésie[^"]*2018[^"]*Insee/);
  });

  it('B104-M9 · arrondit a et b au centième, r au millième', () => {
    const tolerances = Object.fromEntries(
      questionsDuCours(COURS).flatMap((question) =>
        question.type === 'numeric' ? [[question.id, question.tolerance]] : [],
      ),
    );
    const decimales = (valeur: number) => ({ type: 'decimales', valeur });

    expect(tolerances).toEqual(
      expect.objectContaining({
        'b1-04-a2-r-chocolats': decimales(3),
        'b1-04-a3-annale-r': decimales(3),
        'b1-04-a3-annale-a': decimales(2),
        'b1-04-a3-annale-b': decimales(2),
        'b1-04-a3-annale-2018': decimales(1),
      }),
    );
  });
});

describe('B1-04 — les feuilles corrigées', () => {
  const FORMULES_DE_L_AJUSTEMENT = {
    E2: '=MOYENNE(B2:B11)',
    E3: '=MOYENNE(C2:C11)',
    E4: '=ARRONDI(PENTE(C2:C11;B2:B11);2)',
    E5: '=ARRONDI(ORDONNEE.ORIGINE(C2:C11;B2:B11);2)',
  };
  const FORMULES_DE_LA_CORRELATION = {
    F2: '=ARRONDI(COEFFICIENT.CORRELATION(C2:C11;$B$2:$B$11);3)',
    F3: '=ARRONDI(PENTE($B$2:$B$11;C2:C11);2)',
    F4: '=ARRONDI(ORDONNEE.ORIGINE($B$2:$B$11;C2:C11);2)',
    G2: '=ARRONDI(COEFFICIENT.CORRELATION(D2:D11;$B$2:$B$11);3)',
    G3: '=ARRONDI(PENTE($B$2:$B$11;D2:D11);2)',
    G4: '=ARRONDI(ORDONNEE.ORIGINE($B$2:$B$11;D2:D11);2)',
  };
  const verdictDe = (
    plan: string,
    envoi: Readonly<Record<string, string>>,
    cellule: string,
  ) =>
    corrigerFeuille(fiche.corrigeDeFeuille(COURS, plan), envoi).verdicts.find(
      (verdict) => verdict.reference === cellule,
    );

  it('B104-M4 · reconnaît justes les deux feuilles écrites puis recopiées', () => {
    expect(
      corrigerFeuille(
        fiche.corrigeDeFeuille(COURS, 'b1-04-a1-tableur-ajustement'),
        FORMULES_DE_L_AJUSTEMENT,
      ).score,
    ).toBe(1);
    expect(
      corrigerFeuille(
        fiche.corrigeDeFeuille(COURS, 'b1-04-a2-tableur-correlation'),
        FORMULES_DE_LA_CORRELATION,
      ).score,
    ).toBe(1);
  });

  it('B104-M4 · nomme les séries inversées dans PENTE', () => {
    expect(
      verdictDe(
        'b1-04-a1-tableur-ajustement',
        {
          ...FORMULES_DE_L_AJUSTEMENT,
          E4: '=ARRONDI(PENTE(B2:B11;C2:C11);2)',
        },
        'E4',
      ),
    ).toEqual(
      expect.objectContaining({
        juste: false,
        confusion: 'pente-ordonnee-inversees',
      }),
    );
  });

  it.each([
    ['b1-04-a1-tableur-ajustement', 'E4', '=PENTE(C2:C11;B2:B11)'],
    ['b1-04-a1-tableur-ajustement', 'E5', '=ORDONNEE.ORIGINE(C2:C11;B2:B11)'],
    [
      'b1-04-a2-tableur-correlation',
      'F2',
      '=COEFFICIENT.CORRELATION(C2:C11;$B$2:$B$11)',
    ],
  ])('REF-01 · %s nomme l’arrondi oublié en %s', (plan, cellule, formule) => {
    const formules =
      plan === 'b1-04-a1-tableur-ajustement'
        ? FORMULES_DE_L_AJUSTEMENT
        : FORMULES_DE_LA_CORRELATION;

    expect(
      verdictDe(plan, { ...formules, [cellule]: formule }, cellule),
    ).toEqual(
      expect.objectContaining({ juste: false, confusion: 'arrondi-oublie' }),
    );
  });

  it('B104-M4 · nomme la plage du CA non figée, recopiée vers la droite', () => {
    expect(
      verdictDe(
        'b1-04-a2-tableur-correlation',
        {
          ...FORMULES_DE_LA_CORRELATION,
          G2: '=ARRONDI(COEFFICIENT.CORRELATION(D2:D11;C2:C11);3)',
        },
        'G2',
      ),
    ).toEqual(
      expect.objectContaining({
        juste: false,
        confusion: 'reference-non-figee-en-ligne',
      }),
    );
  });
});

describe('B1-04 — confidentialité des réponses', () => {
  it('B104-M6 · ne sert au catalogue aucune réponse d’exercice, annale comprise', () => {
    expect(
      valeursAuCatalogue(COURS, [
        ...REPONSES_PAR_EXERCICE.flatMap(([, reponses]) => reponses),
        '85,4',
        '0,12',
      ]),
    ).toEqual([]);
  });

  it.each(REPONSES_PAR_EXERCICE)(
    'B104-M6 · ne montre aucune réponse de %s dans un écran antérieur',
    (ecran, reponses) => {
      expect(
        feuilleDeCours.reponsesDejaMontrees(
          COURS_B1_04,
          `B1-04-${ecran}`,
          reponses,
        ),
      ).toEqual([]);
    },
  );

  it('B104-M7 · ne laisse, sans dérogation, que le 85,4 du nuage de l’annale', () => {
    const violations = verifierStructure(COURS, []);

    expect(violations.length).toBeGreaterThan(0);
    expect(
      violations.filter(
        ({ regle, ecran, raison }) =>
          regle !== 'confidentialite' ||
          ecran !== NUAGE_DE_L_ANNALE ||
          !raison.includes('85,4'),
      ),
    ).toEqual([]);
  });

  it('B104-M7 · ne lève aucune violation de structure avec sa dérogation écrite', () => {
    expect(verifierStructure(COURS)).toEqual([]);
  });
});
