import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const NON_SERIALISABLE = 'Valeur non sérialisable dans un vecteur de formule';

/**
 * @param {unknown} valeur
 * @returns {boolean}
 */
const estScalaireJson = (valeur) =>
  valeur === null ||
  typeof valeur === 'string' ||
  typeof valeur === 'boolean' ||
  (typeof valeur === 'number' && Number.isFinite(valeur));

/**
 * @param {string} premiere
 * @param {string} seconde
 * @returns {number}
 */
const parUnitesDeCode = (premiere, seconde) => {
  if (premiere === seconde) return 0;
  return premiere < seconde ? -1 : 1;
};

/**
 * @param {unknown} valeur
 * @returns {string}
 */
export function serialiserCanonique(valeur) {
  if (Array.isArray(valeur)) {
    return `[${valeur.map(serialiserCanonique).join(',')}]`;
  }
  if (typeof valeur === 'object' && valeur !== null) {
    const objet = /** @type {Record<string, unknown>} */ (valeur);
    const membres = Object.keys(objet)
      .sort(parUnitesDeCode)
      .map(
        (cle) => `${JSON.stringify(cle)}:${serialiserCanonique(objet[cle])}`,
      );
    return `{${membres.join(',')}}`;
  }
  if (!estScalaireJson(valeur)) {
    throw new Error(NON_SERIALISABLE);
  }
  return JSON.stringify(valeur);
}

/**
 * @param {unknown} vecteurs
 * @returns {string}
 */
export function empreinteDesVecteurs(vecteurs) {
  return createHash('sha256')
    .update(serialiserCanonique(vecteurs), 'utf8')
    .digest('hex');
}

/**
 * @param {string} chemin
 * @returns {{ version: number, sha256: string, vecteurs: any[] }}
 */
export function lireFichierDeVecteurs(chemin) {
  return JSON.parse(readFileSync(chemin, 'utf8'));
}

/**
 * @param {string} cheminTypeScript
 * @param {string} cheminTypeScriptCompilateur
 * @returns {Promise<{ moteur: any, liberer: () => void }>}
 */
export async function chargerMoteur(
  cheminTypeScript,
  cheminTypeScriptCompilateur,
) {
  const { default: ts } = await import(
    pathToFileURL(cheminTypeScriptCompilateur).href
  );
  const transpile = ts.transpileModule(readFileSync(cheminTypeScript, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const dossier = mkdtempSync(join(tmpdir(), 'parite-formules-'));
  const fichier = join(dossier, 'moteur.mjs');
  writeFileSync(fichier, transpile.outputText, 'utf8');
  const moteur = await import(pathToFileURL(fichier).href);
  return {
    moteur,
    liberer: () => rmSync(dossier, { recursive: true, force: true }),
  };
}

/**
 * @param {any} moteur
 * @param {any} vecteur
 * @returns {unknown}
 */
export function executerVecteur(moteur, vecteur) {
  if (vecteur.type === 'feuille') {
    return Object.fromEntries(moteur.evaluerFeuille(vecteur.entree));
  }
  if (vecteur.type === 'expression') {
    return moteur.evaluerExpression(
      vecteur.entree.expression,
      vecteur.entree.variables,
    );
  }
  if (vecteur.type === 'r1c1') {
    return moteur.formeR1C1(vecteur.entree.formule, vecteur.entree.cellule);
  }
  throw new Error(`type de vecteur inconnu : ${vecteur.type}`);
}

/**
 * @param {any} moteur
 * @param {any[]} vecteurs
 * @returns {Record<string, string>}
 */
export function resultatsDesVecteurs(moteur, vecteurs) {
  /** @type {Record<string, string>} */
  const resultats = {};
  for (const vecteur of vecteurs) {
    resultats[vecteur.id] = serialiserCanonique(
      executerVecteur(moteur, vecteur),
    );
  }
  return resultats;
}

/**
 * @param {Record<string, string>} obtenus
 * @param {any[]} vecteurs
 * @returns {string[]}
 */
export function ecartsAvecLesAttendus(obtenus, vecteurs) {
  return vecteurs
    .filter(
      (vecteur) => obtenus[vecteur.id] !== serialiserCanonique(vecteur.attendu),
    )
    .map(
      (vecteur) =>
        `${vecteur.id} : attendu ${serialiserCanonique(vecteur.attendu)}, obtenu ${obtenus[vecteur.id]}`,
    );
}

/**
 * @param {Record<string, string>} ici
 * @param {Record<string, string>} ailleurs
 * @returns {string[]}
 */
export function ecartsEntreMoteurs(ici, ailleurs) {
  return Object.keys(ici)
    .filter((id) => ici[id] !== ailleurs[id])
    .map((id) => `${id} : back ${ici[id]}, front ${ailleurs[id]}`);
}
