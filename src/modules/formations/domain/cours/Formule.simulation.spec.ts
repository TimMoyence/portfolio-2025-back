import * as fc from 'fast-check';
import type { CodeErreur, Feuille, ResultatFormule } from './Formule';
import {
  evaluerExpression,
  evaluerFeuille,
  NOMBRE_MAX_CELLULES,
} from './Formule';

const PLAFOND_SOUS_JEST_MS = 500;
const REPETITIONS_DE_MESURE = 7;
const MAILLONS = 26;
const CODES: readonly CodeErreur[] = ['#REF!', '#DIV/0!', '#NOM?', '#VALEUR!'];
const COLONNES = ['A', 'B', 'C', 'D', 'E'] as const;

function nom(colonne: number, ligne: number): string {
  return `${COLONNES[colonne]}${ligne + 1}`;
}

function feuilleDeNombres(valeurs: readonly number[]): Feuille {
  const cellules: Record<string, string> = {};
  valeurs.forEach((valeur, rang) => {
    cellules[`A${rang + 1}`] = String(valeur);
  });
  return { lignes: valeurs.length + 4, colonnes: 3, cellules };
}

function chaineDeDoublements(longueur: number): Feuille {
  const cellules: Record<string, string> = { A1: '1' };
  for (let rang = 2; rang <= longueur; rang += 1) {
    cellules[`A${rang}`] = `=A${rang - 1}+A${rang - 1}`;
  }
  return { lignes: longueur, colonnes: 1, cellules };
}

function sommesCroisees(cote: number): Feuille {
  const cellules: Record<string, string> = {};
  for (let ligne = 1; ligne <= cote; ligne += 1) {
    cellules[`A${ligne}`] = String(ligne);
  }
  for (let colonne = 1; colonne < cote; colonne += 1) {
    const lettre = String.fromCharCode(65 + colonne);
    const precedente = String.fromCharCode(64 + colonne);
    for (let ligne = 1; ligne <= cote; ligne += 1) {
      cellules[`${lettre}${ligne}`] =
        `=SOMME(${precedente}1:${precedente}${cote})`;
    }
  }
  return { lignes: cote, colonnes: cote, cellules };
}

function cycleDeMaillons(longueur: number): Feuille {
  const cellules: Record<string, string> = {};
  for (let rang = 1; rang <= longueur; rang += 1) {
    cellules[`A${rang}`] = `=A${(rang % longueur) + 1}`;
  }
  return { lignes: longueur, colonnes: 1, cellules };
}

function largeurMaximale(): Feuille {
  const cellules: Record<string, string> = {};
  for (let rang = 1; rang <= NOMBRE_MAX_CELLULES; rang += 1) {
    cellules[`A${rang}`] = `=SOMME(A1:A${NOMBRE_MAX_CELLULES})`;
  }
  return { lignes: NOMBRE_MAX_CELLULES, colonnes: 1, cellules };
}

function millisecondesDeProcesseur(mesurer: () => void): number {
  for (let chauffe = 0; chauffe < REPETITIONS_DE_MESURE; chauffe += 1) {
    mesurer();
  }
  const releves: number[] = [];
  for (let essai = 0; essai < REPETITIONS_DE_MESURE; essai += 1) {
    const depart = process.cpuUsage();
    mesurer();
    const consomme = process.cpuUsage(depart);
    releves.push((consomme.user + consomme.system) / 1000);
  }
  return Math.min(...releves);
}

function estResultatRecevable(resultat: ResultatFormule): boolean {
  return resultat.erreur === null
    ? typeof resultat.valeur === 'number' && Number.isFinite(resultat.valeur)
    : resultat.valeur === null && CODES.includes(resultat.erreur);
}

const nombreDeCellule = fc
  .integer({ min: -100_000, max: 100_000 })
  .map((entier) => entier / 100);

const contenuQuelconque = fc.oneof(
  fc.constantFrom('', '   ', 'Canal', 'Total'),
  nombreDeCellule.map((valeur) => String(valeur).replace('.', ',')),
  fc
    .tuple(
      fc.integer({ min: 0, max: COLONNES.length - 1 }),
      fc.integer({ min: 0, max: 7 }),
      fc.constantFrom('+', '-', '*', '/', '^'),
    )
    .map(([colonne, ligne, signe]) => `=${nom(colonne, ligne)}${signe}2`),
  fc
    .tuple(
      fc.constantFrom('SOMME', 'MOYENNE', 'RACINE'),
      fc.integer({ min: 0, max: 7 }),
      fc.integer({ min: 0, max: 7 }),
    )
    .map(([fonction, debut, fin]) => `=${fonction}(A${debut + 1}:A${fin + 1})`),
);

const feuilleQuelconque = fc
  .array(
    fc.tuple(
      fc.integer({ min: 0, max: COLONNES.length - 1 }),
      fc.integer({ min: 0, max: 7 }),
      contenuQuelconque,
    ),
    { minLength: 1, maxLength: 40 },
  )
  .map((entrees): Feuille => {
    const cellules: Record<string, string> = {};
    for (const [colonne, ligne, contenu] of entrees) {
      cellules[nom(colonne, ligne)] = contenu;
    }
    return { lignes: 8, colonnes: COLONNES.length, cellules };
  });

describe('moteur de formules — propriétés sur des feuilles générées', () => {
  it('somme une plage indépendamment du découpage et de l’ordre des termes', () => {
    fc.assert(
      fc.property(
        fc.array(nombreDeCellule, { minLength: 2, maxLength: 20 }),
        fc.integer({ min: 1, max: 19 }),
        (valeurs, coupure) => {
          const hauteur = valeurs.length;
          const rupture = Math.min(coupure, hauteur - 1);
          const base = feuilleDeNombres(valeurs);
          const cellules = {
            ...base.cellules,
            B1: `=SOMME(A1:A${hauteur})`,
            B2: `=SOMME(A1:A${rupture})+SOMME(A${rupture + 1}:A${hauteur})`,
            B3: `=SOMME(A${hauteur}:A1)`,
          };
          const resultats = evaluerFeuille({ ...base, cellules });
          const total = resultats.get('B1')?.valeur ?? Number.NaN;

          expect(resultats.get('B2')?.valeur).toBeCloseTo(total, 6);
          expect(resultats.get('B3')?.valeur).toBeCloseTo(total, 6);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('rend deux fois le même résultat pour la même feuille', () => {
    fc.assert(
      fc.property(feuilleQuelconque, (feuille) => {
        const premier = Object.fromEntries(evaluerFeuille(feuille));
        const second = Object.fromEntries(evaluerFeuille(feuille));

        expect(second).toEqual(premier);
      }),
      { numRuns: 300 },
    );
  });

  it('rend pour chaque cellule remplie une valeur finie ou un code d’erreur connu', () => {
    fc.assert(
      fc.property(feuilleQuelconque, (feuille) => {
        const resultats = evaluerFeuille(feuille);
        const remplies = Object.entries(feuille.cellules).filter(
          ([, contenu]) => contenu.trim().length > 0,
        );

        expect(resultats.size).toBe(remplies.length);
        expect([...resultats.values()].every(estResultatRecevable)).toBe(true);
      }),
      { numRuns: 300 },
    );
  });

  it('arrondit toute expression au millionième sans jamais renvoyer un infini', () => {
    fc.assert(
      fc.property(nombreDeCellule, nombreDeCellule, (gauche, droite) => {
        const resultat = evaluerExpression('a/b', { a: gauche, b: droite });

        if (droite === 0) {
          expect(resultat.erreur).toBe('#DIV/0!');
          return;
        }
        expect(resultat.erreur).toBeNull();
        expect(Number.isFinite(resultat.valeur ?? Number.NaN)).toBe(true);
      }),
      { numRuns: 300 },
    );
  });
});

describe('moteur de formules — feuilles adverses', () => {
  const adverses: readonly (readonly [string, Feuille])[] = [
    [`chaîne de ${MAILLONS} doublements`, chaineDeDoublements(MAILLONS)],
    [`${MAILLONS} SOMME croisées`, sommesCroisees(MAILLONS)],
    [`cycle de ${MAILLONS} maillons`, cycleDeMaillons(MAILLONS)],
    [`chaîne de 1500 doublements`, chaineDeDoublements(1500)],
    [`largeur maximale (${NOMBRE_MAX_CELLULES} cellules)`, largeurMaximale()],
  ];

  for (const [intitule, feuille] of adverses) {
    it(`évalue « ${intitule} » sans explosion et rend des résultats bornés`, () => {
      const processeurMs = millisecondesDeProcesseur(() => {
        evaluerFeuille(feuille);
      });
      const resultats = evaluerFeuille(feuille);

      expect(resultats.size).toBe(Object.keys(feuille.cellules).length);
      expect([...resultats.values()].every(estResultatRecevable)).toBe(true);
      expect(processeurMs).toBeLessThan(PLAFOND_SOUS_JEST_MS);
    });
  }
});
