import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chargerMoteur } from './lib/vecteurs-formules.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPILATEUR = join(ROOT, 'node_modules/typescript/lib/typescript.js');
const MOTEUR = join(ROOT, 'src/modules/formations/domain/cours/Formule.ts');
const BUDGET_MS = 50;
const MAILLONS = 26;
const CELLULES_LARGEUR = 2000;
const CHAUFFES = 5;
const MESURES = 9;

/**
 * @param {number} longueur
 * @returns {{ lignes: number, colonnes: number, cellules: Record<string, string> }}
 */
const chaineDeDoublements = (longueur) => {
  /** @type {Record<string, string>} */
  const cellules = { A1: '1' };
  for (let rang = 2; rang <= longueur; rang += 1) {
    cellules[`A${rang}`] = `=A${rang - 1}+A${rang - 1}`;
  }
  return { lignes: longueur, colonnes: 1, cellules };
};

/**
 * @param {number} cote
 * @returns {{ lignes: number, colonnes: number, cellules: Record<string, string> }}
 */
const sommesCroisees = (cote) => {
  /** @type {Record<string, string>} */
  const cellules = {};
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
};

/**
 * @param {number} longueur
 * @returns {{ lignes: number, colonnes: number, cellules: Record<string, string> }}
 */
const cycleDeMaillons = (longueur) => {
  /** @type {Record<string, string>} */
  const cellules = {};
  for (let rang = 1; rang <= longueur; rang += 1) {
    cellules[`A${rang}`] = `=A${(rang % longueur) + 1}`;
  }
  return { lignes: longueur, colonnes: 1, cellules };
};

/**
 * @param {number} nombre
 * @returns {{ lignes: number, colonnes: number, cellules: Record<string, string> }}
 */
const largeurMaximale = (nombre) => {
  /** @type {Record<string, string>} */
  const cellules = {};
  for (let rang = 1; rang <= nombre; rang += 1) {
    cellules[`A${rang}`] = `=SOMME(A1:A${nombre})`;
  }
  return { lignes: nombre, colonnes: 1, cellules };
};

/**
 * @param {() => void} executer
 * @returns {number}
 */
const millisecondesProcesseur = (executer) => {
  for (let chauffe = 0; chauffe < CHAUFFES; chauffe += 1) executer();
  /** @type {number[]} */
  const releves = [];
  for (let essai = 0; essai < MESURES; essai += 1) {
    const depart = process.cpuUsage();
    executer();
    const consomme = process.cpuUsage(depart);
    releves.push((consomme.user + consomme.system) / 1000);
  }
  return Math.min(...releves);
};

void test(`une feuille adverse reste sous ${BUDGET_MS} ms de processeur`, async () => {
  const { moteur, liberer } = await chargerMoteur(MOTEUR, COMPILATEUR);
  const adverses = [
    [`chaine de ${MAILLONS} doublements`, chaineDeDoublements(MAILLONS)],
    [`${MAILLONS} SOMME croisees`, sommesCroisees(MAILLONS)],
    [`cycle de ${MAILLONS} maillons`, cycleDeMaillons(MAILLONS)],
    [`chaine de 1500 doublements`, chaineDeDoublements(1500)],
    [`largeur ${CELLULES_LARGEUR}`, largeurMaximale(CELLULES_LARGEUR)],
  ];

  try {
    for (const [intitule, feuille] of adverses) {
      const ms = millisecondesProcesseur(() => {
        moteur.evaluerFeuille(feuille);
      });
      console.log(`budget-formules: ${intitule} — ${ms.toFixed(3)} ms`);
      assert.ok(
        ms < BUDGET_MS,
        `${intitule} : ${ms.toFixed(3)} ms pour un budget de ${BUDGET_MS} ms`,
      );
      assert.ok(moteur.evaluerFeuille(feuille).size > 0);
    }
  } finally {
    liberer();
  }
});
