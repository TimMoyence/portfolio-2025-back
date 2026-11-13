import { COURS_B1_03 } from './b1-03.cours';
import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import { lireConception } from '../../../../../../../test/helpers/formations/cours/conception-de-cours';
import * as feuilleDeCours from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import { valeursAuCatalogue } from '../../../../../../../test/helpers/formations/cours/relecture-de-cours';
import { ecranDuCours } from '../../../../../../../test/helpers/formations/cours/lecture-de-cours';
import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import { auDixieme } from '../../../../../../common/domain/nombres/arrondi';
import { nombreFrancais } from '../../../../../../common/domain/nombres/ecriture-francaise';
import { estReservee } from '../../../../domain/cours/structure/Cours';
import { corrigerFeuille } from '../../../../domain/cours/correction/CorrectionProduction';
import {
  CLASSES_DE_NANTES,
  CLASSEUR_DES_VENTES,
  NOMBRE_DE_VENTES,
  PANIERS_DE_LA_MARKETPLACE as MARKETPLACE,
  PANIERS_DE_NANTES as NANTES,
  PANIERS_DU_SITE as SITE,
  VENTES_D_OCTOBRE,
} from './b1-03.donnees';

const COURS = buildCoursDuContenu(COURS_B1_03);

const CLASSES = CLASSES_DE_NANTES.map(
  ({ debut, fin, effectif }) => [debut, fin, effectif] as const,
);

const rangees = (serie: readonly number[]): number[] =>
  [...serie].sort((a, b) => a - b);
const auRang = (serie: readonly number[], rang: number): number =>
  rangees(serie)[rang - 1];
const quartile = (serie: readonly number[], quart: number): number =>
  auRang(serie, Math.ceil((quart * serie.length) / 4));
const auRangInferieur = (serie: readonly number[], quart: number): number =>
  auRang(serie, Math.floor((quart * serie.length) / 4));
const mediane = (serie: readonly number[]): number =>
  auRang(serie, (serie.length + 1) / 2);
const moyenne = (serie: readonly number[]): number =>
  serie.reduce((total, valeur) => total + valeur, 0) / serie.length;
const ecartType = (serie: readonly number[], perdus = 0): number =>
  Math.sqrt(
    serie.reduce((total, valeur) => total + (valeur - moyenne(serie)) ** 2, 0) /
      (serie.length - perdus),
  );
const parClasses = (borne: (debut: number, fin: number) => number): number =>
  CLASSES.reduce(
    (total, [debut, fin, effectif]) => total + effectif * borne(debut, fin),
    0,
  ) / CLASSES.reduce((total, [, , effectif]) => total + effectif, 0);

function sommes(canal: string | null) {
  const ventes = VENTES_D_OCTOBRE.filter(
    (vente) => canal === null || vente.canal === canal,
  );
  const ca = ventes.reduce((total, vente) => total + vente.ca, 0);
  const cout = ventes.reduce((total, vente) => total + vente.cout, 0);
  const taux = ventes.map(
    (vente) => ((vente.ca - vente.cout) / vente.cout) * 100,
  );
  return {
    ventes: ventes.length,
    ca,
    cout,
    marge: ((ca - cout) / cout) * 100,
    marque: ((ca - cout) / ca) * 100,
    moyenneDesTaux: moyenne(taux),
  };
}

const SITE_WEB = sommes('Site web');
const BOUTIQUE = sommes('Boutique');
const TOTAL = sommes(null);
const TROIS_TAUX = ['Boutique', 'Site web', 'Marketplace'].map(
  (canal) => sommes(canal).marge,
);

const REPONSES_DES_EXERCICES = [
  `${nombreFrancais(SITE_WEB.ca, 0)} €`,
  auDixieme(BOUTIQUE.marge),
  auDixieme(TOTAL.marge),
  `${mediane(MARKETPLACE)} €`,
  `${quartile(MARKETPLACE, 1)} €`,
  `${quartile(MARKETPLACE, 3)} €`,
  auDixieme(moyenne(SITE)),
  auDixieme(ecartType(SITE)),
  auDixieme(moyenne(NANTES)),
  auDixieme(ecartType(NANTES)),
  `${parClasses((debut, fin) => (debut + fin) / 2)} €`,
];

const MOTS_DU_COURS =
  /moyenne|médiane|quartile|écart|tableau|champ|classe|série|valeur|effectif|taux|\d/i;

fiche.decrireLaFicheDuCours('B1-03', COURS, {
  ...fiche.FORME_DES_COURS_B1,
  conception: 'b1/cours-b1-03-conception.md',
  minutesParActe: [45, 36, 32, 8, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 94, exposition: 27 },
  noteesParType: [6, 7, 0, 1, 0],
  enigmes: 0,
  rappels: 12,
  options: 22,
  catalogue: fiche.CATALOGUE_ILLUSTRE_JUSQU_A_LA_PAGE_A4_02,
  ateliersNotes: ['A1-09 (15)', 'A2-05 (8)', 'A3-06 (13)'],
  remediations: 17,
  corrigesSurPlace: [
    'B1-03-A1-09-ATELIER-TCD',
    'B1-03-A2-05-ATELIER-MARKETPLACE',
    'B1-03-A2-06-TABLEUR-PANIERS',
    'B1-03-A3-06-ATELIER-COMPARER',
  ],
});

const ECRANS_POUR_COMPRENDRE = [
  ['A1-06', 'TAS', 'TCD', 'bonbons-tas', ['TCD', 'additionner les montants']],
  [
    'A1-07',
    'LIMONADE',
    'CHAMP-CALCULE',
    'limonade-pots',
    ['champ calculé', 'taux de marge'],
  ],
  [
    'A2-02',
    'FILE',
    'MEDIANE-QUARTILES',
    'file-rubans',
    ['médiane', 'quartiles'],
  ],
  ['A2-03', 'EQUIPES', 'ECART-TYPE', 'equipes-tailles', ['écart type']],
  ['A3-02', 'BOITE', 'BOITE', 'file-boite', ['boîte à moustaches']],
  ['A3-03', 'BILLES', 'CLASSES', 'billes-boites', ['classe', 'effectif']],
] as const;

describe('B1-03 — les écrans « pour comprendre »', () => {
  feuilleDeCours.decrireLesEcransPourComprendre(
    'B1-03',
    COURS_B1_03,
    ECRANS_POUR_COMPRENDRE,
    MOTS_DU_COURS,
  );

  it('B103-M2 · garde une seule page par notion, chacune avec sa méthode et sans encadré « Au CCF »', () => {
    expect(fiche.pagesDeCours(COURS_B1_03).map((id) => id.slice(12))).toEqual([
      'COURS-TCD',
      'COURS-CHAMP-CALCULE',
      'COURS-MEDIANE-QUARTILES',
      'COURS-ECART-TYPE',
      'COURS-BOITE',
      'COURS-CLASSES',
    ]);
    expect(fiche.pagesSansMethodeOuAvecEncadreCcf(COURS_B1_03)).toEqual([]);
  });
});

describe('B1-03 — le fichier des ventes et son TCD', () => {
  it('B103-M3 · signale au dossier les données fictives et décrit le fichier de l’exercice', () => {
    const dossier = feuilleDeCours.texteDeLEcran(
      COURS_B1_03,
      'B1-03-A1-04-DOSSIER',
    );
    const [premiere] = VENTES_D_OCTOBRE;

    expect(dossier).toContain('Données fictives');
    expect(dossier).toContain(`${NOMBRE_DE_VENTES} ventes`);
    expect(dossier).toContain(
      `${premiere.boutique} · ${premiere.canal} · ${premiere.categorie} · ${premiere.ca} € · ${premiere.cout} €`,
    );
  });

  it('B103-M3 · joint à l’exercice 1 le classeur des ventes, réservé à la séance, sans écran repris', () => {
    const exercice = ecranDuCours(COURS, 'B1-03-A1-09-ATELIER-TCD');
    const piece = exercice.pieceJointe;

    expect(exercice.diffusion).toBe('seance');
    expect(piece !== undefined && estReservee(piece)).toBe(true);
    expect(piece).toEqual(
      expect.objectContaining({ classeur: CLASSEUR_DES_VENTES, reprend: [] }),
    );
  });

  it('B103-M4 · recalcule depuis les ventes les réponses et les pièges de l’exercice 1', () => {
    fiche.attendreLesNumeriques(COURS, {
      'b1-03-a1-ca-site': [
        SITE_WEB.ca,
        SITE_WEB.ventes,
        SITE_WEB.ca / SITE_WEB.ventes,
      ],
      'b1-03-a1-taux-boutique': [BOUTIQUE.marge, BOUTIQUE.marque],
      'b1-03-a1-taux-total': [TOTAL.marge, moyenne(TROIS_TAUX), TOTAL.marque],
      'b1-03-a2-mediane': [
        mediane(MARKETPLACE),
        MARKETPLACE[4],
        moyenne(MARKETPLACE),
      ],
      'b1-03-a2-q1': [
        quartile(MARKETPLACE, 1),
        auRangInferieur(MARKETPLACE, 1),
        mediane(MARKETPLACE) / 2,
      ],
      'b1-03-a2-q3': [
        quartile(MARKETPLACE, 3),
        auRangInferieur(MARKETPLACE, 3),
        mediane(MARKETPLACE) * 1.5,
      ],
      'b1-03-a3-moyenne-classes': [
        parClasses((debut, fin) => (debut + fin) / 2),
        parClasses((debut) => debut),
        parClasses((_, fin) => fin),
      ],
    });
  });

  it('B103-M4 · reporte au § 5.2 de la conception les sommes et les taux du TCD', () => {
    const document = lireConception('b1/cours-b1-03-conception.md');
    const ligne = (canal: string, valeurs: ReturnType<typeof sommes>) =>
      [
        canal,
        String(valeurs.ventes),
        nombreFrancais(valeurs.ca, 0),
        nombreFrancais(valeurs.cout, 0),
        nombreFrancais(auDixieme(valeurs.marge), 1),
        nombreFrancais(auDixieme(valeurs.marque), 1),
        nombreFrancais(auDixieme(valeurs.moyenneDesTaux), 1),
      ].join(' | ');
    const lignesDuDocument = document.split('\n').map((texte) =>
      texte
        .split('|')
        .slice(1, -1)
        .map((cellule) => cellule.trim())
        .join(' | '),
    );

    for (const [canal, valeurs] of [
      ['Boutique', BOUTIQUE],
      ['Site web', SITE_WEB],
      ['Marketplace', sommes('Marketplace')],
      ['Total général', TOTAL],
    ] as const) {
      expect(lignesDuDocument).toContain(ligne(canal, valeurs));
    }
  });
});

describe('B1-03 — les paniers de septembre, à côté du fichier d’octobre', () => {
  it.each([
    'B1-03-A2-01-REFLEXION-PANIER',
    'B1-03-A2-06-TABLEUR-PANIERS',
    'B1-03-A3-05-BOITES-CANAUX',
    'B1-03-A3-06-ATELIER-COMPARER',
  ])(
    'B103-M4 · date de septembre les paniers de %s, que le fichier d’octobre ne contient pas',
    (ecran) => {
      const texte = feuilleDeCours.texteDeLEcran(COURS_B1_03, ecran);

      expect(texte).toContain('septembre');
      expect(texte).not.toContain('octobre');
    },
  );

  it('B103-M5 · présente chaque colonne de la feuille comme toutes les commandes de la semaine, pas un tirage', () => {
    const feuille = feuilleDeCours.texteDeLEcran(
      COURS_B1_03,
      'B1-03-A2-06-TABLEUR-PANIERS',
    );
    const comparer = feuilleDeCours.texteDeLEcran(
      COURS_B1_03,
      'B1-03-A3-06-ATELIER-COMPARER',
    );

    expect(feuille).toContain('toutes les commandes de la dernière semaine');
    expect(feuille).not.toMatch(/tir[ée]s? de|échantillon/i);
    expect(comparer).not.toContain('tout le mois de septembre');
  });

  it('B103-M4 · tient la commande du club hors du fichier d’octobre', () => {
    expect(Math.max(...VENTES_D_OCTOBRE.map(({ ca }) => ca))).toBeLessThan(
      Math.max(...SITE),
    );
  });
});

describe('B1-03 — les paniers au tableur', () => {
  const FORMULES = {
    E2: '=ARRONDI(MOYENNE(B2:B22);1)',
    E3: '=MEDIANE(B2:B22)',
    E4: '=QUARTILE(B2:B22;1)',
    E5: '=QUARTILE(B2:B22;3)',
    E6: '=ARRONDI(ECARTYPEP(B2:B22);1)',
    E7: '=E5-E4',
    F2: '=ARRONDI(MOYENNE(C2:C22);1)',
    F3: '=MEDIANE(C2:C22)',
    F4: '=QUARTILE(C2:C22;1)',
    F5: '=QUARTILE(C2:C22;3)',
    F6: '=ARRONDI(ECARTYPEP(C2:C22);1)',
    F7: '=F5-F4',
  };
  const corrige = () =>
    fiche.corrigeDeFeuille(COURS, 'b1-03-a2-tableur-paniers');
  const verdictDe = (
    envoi: Readonly<Record<string, string>>,
    cellule: string,
  ) =>
    corrigerFeuille(corrige(), envoi).verdicts.find(
      (verdict) => verdict.reference === cellule,
    );

  it('B103-M5 · attend le résumé des deux séries, recalculé depuis les paniers, avec ses pièges', () => {
    const resume = (serie: readonly number[]) => [
      [auDixieme(moyenne(serie)), moyenne(serie)],
      [mediane(serie), auDixieme(moyenne(serie))],
      [quartile(serie, 1), auRangInferieur(serie, 1)],
      [quartile(serie, 3), auRangInferieur(serie, 3)],
      [
        auDixieme(ecartType(serie)),
        auDixieme(ecartType(serie, 1)),
        ecartType(serie),
      ],
      [
        quartile(serie, 3) - quartile(serie, 1),
        Math.max(...serie) - Math.min(...serie),
      ],
    ];
    const [site, nantes] = [resume(SITE), resume(NANTES)];

    fiche.attendreLaFeuille(
      corrige(),
      Object.fromEntries(
        site.flatMap((valeurs, rang) => [
          [`E${rang + 2}`, valeurs],
          [`F${rang + 2}`, nantes[rang]],
        ]),
      ),
    );
  });

  it('B103-M5 · intitule la feuille comme le titre de son écran', () => {
    expect(corrige().plan.intitule).toBe(
      ecranDuCours(COURS, 'B1-03-A2-06-TABLEUR-PANIERS').titre,
    );
  });

  it('B103-M5 · reconnaît juste la feuille écrite puis recopiée vers la droite', () => {
    expect(corrigerFeuille(corrige(), FORMULES).score).toBe(1);
  });

  it('B103-M5 · nomme ECARTYPE à la place d’ECARTYPEP', () => {
    expect(
      verdictDe({ ...FORMULES, E6: '=ARRONDI(ECARTYPE(B2:B22);1)' }, 'E6'),
    ).toEqual(
      expect.objectContaining({
        juste: false,
        confusion: 'ecart-type-population-echantillon',
      }),
    );
  });

  it('B103-M5 · nomme la moyenne non arrondie', () => {
    expect(verdictDe({ ...FORMULES, E2: '=MOYENNE(B2:B22)' }, 'E2')).toEqual(
      expect.objectContaining({ juste: false, confusion: 'arrondi-oublie' }),
    );
  });
});

describe('B1-03 — confidentialité des réponses', () => {
  it('B103-M7 · ne sert au catalogue aucune réponse d’exercice', () => {
    expect(valeursAuCatalogue(COURS, REPONSES_DES_EXERCICES)).toEqual([]);
  });

  it.each([
    ['A1-09-ATELIER-TCD', REPONSES_DES_EXERCICES.slice(0, 3)],
    ['A2-05-ATELIER-MARKETPLACE', REPONSES_DES_EXERCICES.slice(3, 6)],
    ['A2-06-TABLEUR-PANIERS', REPONSES_DES_EXERCICES.slice(6, 10)],
    ['A3-06-ATELIER-COMPARER', REPONSES_DES_EXERCICES.slice(10)],
  ])(
    'B103-M7 · ne montre aucune réponse de %s dans un écran antérieur',
    (ecran, reponses) => {
      const ecrites = reponses.map((reponse) =>
        typeof reponse === 'number' ? nombreFrancais(reponse, 1) : reponse,
      );

      expect(
        feuilleDeCours.reponsesDejaMontrees(
          COURS_B1_03,
          `B1-03-${ecran}`,
          ecrites,
        ),
      ).toEqual([]);
    },
  );
});
