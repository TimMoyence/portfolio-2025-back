import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  attendreLaFeuille,
  attendreLesEnigmes,
  attendreLesNumeriques,
  corrigeDe,
  decrireLaFicheDuCours,
  valeursEtPieges,
} from '../../../../../test/helpers/fiche-de-cours';
import { arrondi } from '../../../../../test/helpers/lecture-de-cours';
import { COURS_B2_02 } from './b2-02.cours';

const COURS = buildCoursDuContenu(COURS_B2_02);

const DELAIS = [
  42, 25, 58, 31, 146, 38, 47, 18, 62, 44, 35, 52, 28, 75, 40, 30, 55, 34, 50,
  45,
];
const FOURNISSEURS = [30, 45, 28, 60, 35, 38, 58, 32, 46, 36, 56, 62];

const somme = (valeurs: readonly number[]): number =>
  valeurs.reduce((total, valeur) => total + valeur, 0);
const moyenne = (valeurs: readonly number[]): number =>
  somme(valeurs) / valeurs.length;
const trie = (valeurs: readonly number[]): number[] =>
  [...valeurs].sort((a, b) => a - b);
const milieu = (valeurs: readonly number[]): number =>
  (valeurs[valeurs.length / 2 - 1] + valeurs[valeurs.length / 2]) / 2;
const mediane = (valeurs: readonly number[]): number => milieu(trie(valeurs));
const quartileDuCours = (valeurs: readonly number[], rang: 1 | 3): number =>
  trie(valeurs)[Math.ceil((rang * valeurs.length) / 4) - 1];
const quartileDuTableur = (valeurs: readonly number[], rang: 1 | 3): number => {
  const triees = trie(valeurs);
  const position = ((valeurs.length - 1) * rang) / 4;
  const bas = Math.floor(position);
  return triees[bas] + (position - bas) * (triees[bas + 1] - triees[bas]);
};
const variance = (valeurs: readonly number[], diviseur: number): number =>
  somme(valeurs.map((valeur) => (valeur - moyenne(valeurs)) ** 2)) / diviseur;
const ecartType = (valeurs: readonly number[]): number =>
  Math.sqrt(variance(valeurs, valeurs.length));
const ecartTypeEchantillon = (valeurs: readonly number[]): number =>
  Math.sqrt(variance(valeurs, valeurs.length - 1));

decrireLaFicheDuCours('B2-02', COURS, {
  conception: 'cours-b2-02-conception.md',
  ecrans: 62,
  dureeMinutes: 204,
  minutesParActe: [33, 34, 31, 33, 47, 26],
  rythme: { expositionContinueMax: 4, interactives: 151, exposition: 53 },
  ateliersNotes: [
    'A1-06 (8)',
    'A2-03 (6)',
    'A2-03 (6)',
    'A2-05 (8)',
    'A3-01 (8)',
    'A3-04 (6)',
    'A3-04 (6)',
    'A4-05 (7)',
    'A5-04 (6)',
    'A5-04 (6)',
    'A5-05 (8)',
  ],
  noteesParType: [13, 10, 3, 1, 1],
  enigmes: 4,
  rappels: 13,
  remediations: 18,
  options: 13 + 13,
  catalogue: [
    'A1-02',
    'A1-04',
    'A1-05',
    'A1-07',
    'A1-09',
    'A2-01',
    'A4-01',
    'A6-05',
  ],
});

describe('B2-02 — recalcul des corrigés depuis les données brutes', () => {
  const sansLitige = DELAIS.filter((delai) => delai !== 146);
  const cinqClients = [30, 40, 50, 60, 70];
  const salaires = [4629, 2633, 1941, 2051];
  const poids = [0.23, 0.206, 0.279, 0.286];
  const relances = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 4];
  const effectifs = [3, 8, 6, 2, 1];
  const bornes = [0, 30, 45, 60, 90, 150];
  const moyenneDesClasses = (point: (rang: number) => number): number =>
    somme(effectifs.map((effectif, rang) => effectif * point(rang))) /
    somme(effectifs);
  const tranchesFusionnees = 1464 + 930;

  it('recalcule les solutions et pièges des dix questions numériques', () => {
    const attendus = {
      'b2-02-a2-mediane': [
        mediane(DELAIS),
        milieu(DELAIS),
        trie(DELAIS)[9],
        trie(DELAIS)[10],
        moyenne(DELAIS),
      ],
      'b2-02-a2-moyenne': [
        moyenne(DELAIS),
        moyenne(sansLitige),
        mediane(DELAIS),
      ],
      'b2-02-a2-salaire-moyen': [
        somme(salaires.map((salaire, rang) => salaire * poids[rang])),
        moyenne(salaires),
      ],
      'b2-02-a2-relances': [moyenne(relances), 2, Math.max(...relances)],
      'b2-02-a3-eiq': [
        quartileDuCours(DELAIS, 3) - quartileDuCours(DELAIS, 1),
        Math.max(...DELAIS) - Math.min(...DELAIS),
        quartileDuTableur(DELAIS, 3) - quartileDuTableur(DELAIS, 1),
        mediane(DELAIS),
      ],
      'b2-02-a3-ecart-type-cinq': [
        ecartType(cinqClients),
        ecartTypeEchantillon(cinqClients),
        variance(cinqClients, 5),
      ],
      'b2-02-a3-ecart-type-echantillon': [
        ecartTypeEchantillon(cinqClients),
        ecartType(cinqClients),
        variance(cinqClients, 4),
      ],
      'b2-02-a4-eiq-2024': [75.0 - 41.7, 100.4 - 29.9, 75.0 - 56.2],
      'b2-02-a5-moyenne-classes': [
        moyenneDesClasses((rang) => (bornes[rang] + bornes[rang + 1]) / 2),
        moyenneDesClasses((rang) => bornes[rang]),
        moyenneDesClasses((rang) => bornes[rang + 1]),
      ],
      'b2-02-a5-densite': [
        tranchesFusionnees / 10,
        tranchesFusionnees,
        tranchesFusionnees / 5,
      ],
    };
    attendreLesNumeriques(COURS, attendus);
  });

  it('recalcule les solutions et pièges des quatre énigmes du coffre', () => {
    const six = [25, 35, 45, 55, 65, 75];
    const attendus = {
      'b2-02-a6-e1-mediane': [
        mediane(FOURNISSEURS),
        milieu(FOURNISSEURS),
        moyenne(FOURNISSEURS),
      ],
      'b2-02-a6-e2-eiq': [
        quartileDuCours(FOURNISSEURS, 3) - quartileDuCours(FOURNISSEURS, 1),
        quartileDuTableur(FOURNISSEURS, 3) - quartileDuTableur(FOURNISSEURS, 1),
        Math.max(...FOURNISSEURS) - Math.min(...FOURNISSEURS),
      ],
      'b2-02-a6-e3-ecart-type': [
        ecartType(six),
        ecartTypeEchantillon(six),
        variance(six, 6),
      ],
      'b2-02-a6-e4-moyenne': [(28 * 30 + 12 * 75) / 40, (30 + 75) / 2],
    };
    attendreLesEnigmes(COURS, attendus);
  });

  it('recalcule les neuf cellules attendues de la feuille A4-02 et leurs pièges', () => {
    const corrige = corrigeDe(COURS, 'b2-02-a4-feuille-delais');
    if (corrige.type !== 'feuille') {
      throw new Error('la feuille A4-02 n’a pas de corrigé de feuille');
    }
    const q1 = quartileDuTableur(DELAIS, 1);
    const q3 = quartileDuTableur(DELAIS, 3);
    const attendus: Record<string, readonly number[]> = {
      E2: [DELAIS.length],
      E3: [moyenne(DELAIS), mediane(DELAIS)],
      E4: [mediane(DELAIS), moyenne(DELAIS), milieu(DELAIS)],
      E5: [q1, mediane(DELAIS) / 2],
      E6: [q3],
      E7: [q3 - q1, Math.max(...DELAIS) - Math.min(...DELAIS)],
      E8: [Math.max(...DELAIS) - Math.min(...DELAIS)],
      E9: [
        ecartType(DELAIS),
        ecartTypeEchantillon(DELAIS),
        variance(DELAIS, DELAIS.length),
      ],
      E10: [DELAIS.length * moyenne(DELAIS) === somme(DELAIS) ? 1 : 0],
    };

    expect(corrige.attendus.map((attendu) => attendu.reference)).toEqual(
      Object.keys(attendus),
    );
    attendreLaFeuille(corrige, attendus);
  });

  it('recalcule les effectifs et fréquences cumulés du tableau A5-03 depuis les vingt délais', () => {
    const corrige = corrigeDe(COURS, 'b2-02-a5-effectifs-cumules');
    if (corrige.type !== 'tableau') {
      throw new Error('le tableau A5-03 n’a pas de corrigé de tableau');
    }
    const parClasse = effectifs.map(
      (_, rang) =>
        DELAIS.filter(
          (delai) => delai >= bornes[rang] && delai < bornes[rang + 1],
        ).length,
    );
    const cumuls = parClasse.map((_, rang) =>
      somme(parClasse.slice(0, rang + 1)),
    );
    const enPourcent = (effectif: number): number =>
      arrondi((effectif / DELAIS.length) * 100);
    const attendus = parClasse.flatMap((effectif, rang) => [
      [cumuls[rang], ...(rang === 0 ? [] : [effectif])],
      [enPourcent(cumuls[rang]), ...(rang === 0 ? [] : [enPourcent(effectif)])],
    ]);

    expect(parClasse).toEqual(effectifs);
    expect(corrige.attendus.map(valeursEtPieges)).toEqual(attendus);
  });
});
