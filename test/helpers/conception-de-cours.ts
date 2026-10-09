import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const LIGNE_DE_TABLEAU = /^\|\s*\d+\s*\|/;
const ENTETE_DE_FICHE = /^#### (A\d-\d{2}) · `(B\d-\d{2}-[^`]+)`/;
const TITRE_PUBLIC = /Titre public : « (.+) »$/;
const PREMIER_CODE = /`([^`]+)`/;
const RENDU_V2 = /v2 `([^`]+)`/;
const TITRE_DES_REMEDIATIONS = 'Concepts, confusions et remédiations';
const TITRE_DES_VALEURS = 'Les valeurs attendues';
const EMPREINTE_DU_NOM = '<empreinte>';
const CARACTERES_SPECIAUX = /[.*+?^${}()|[\]\\]/g;

export interface LigneDeVueDEnsemble {
  readonly rang: number;
  readonly id: string;
  readonly minutes: number;
  readonly brique: string;
  readonly rendu: string | null;
  readonly interactif: boolean;
  readonly questionsNotees: number;
  readonly diffusion: string;
}

export interface MediaDuDocument {
  readonly id: string;
  readonly pageSource: string;
  readonly licence: string;
  readonly fichiers: readonly string[];
  readonly attribution: string;
}

export interface PieceJointeDuDocument {
  readonly motif: RegExp;
  readonly ecran: string;
  readonly diffusion: string;
}

export function lireConception(fichier: string): string {
  return readFileSync(join(__dirname, '../../docs', fichier), 'utf8');
}

function lignesDeSection(
  document: string,
  debut: string,
  fins: readonly string[],
): string[] {
  const lignes = document.split('\n');
  const premiere = lignes.findIndex((ligne) => ligne.startsWith(debut));
  if (premiere === -1) {
    throw new Error(`section introuvable dans le document : ${debut}`);
  }
  const derniere = lignes.findIndex(
    (ligne, rang) =>
      rang > premiere && fins.some((fin) => ligne.startsWith(fin)),
  );
  return lignes.slice(premiere, derniere === -1 ? lignes.length : derniere);
}

function cellules(ligne: string): string[] {
  return ligne
    .split('|')
    .slice(1, -1)
    .map((cellule) => cellule.trim());
}

function premierCode(cellule: string): string {
  const trouve = PREMIER_CODE.exec(cellule);
  if (trouve === null) {
    throw new Error(`aucun code dans la cellule « ${cellule} »`);
  }
  return trouve[1];
}

export function vueDEnsemble(document: string): LigneDeVueDEnsemble[] {
  return lignesDeSection(document, '### 3.1', ['### 3.2'])
    .filter((ligne) => LIGNE_DE_TABLEAU.test(ligne))
    .map((ligne) => {
      const [rang, id, minutes, brique, interactif, questions, diffusion] =
        cellules(ligne);
      return {
        rang: Number(rang),
        id,
        minutes: Number(minutes),
        brique: premierCode(brique),
        rendu: RENDU_V2.exec(brique)?.[1] ?? null,
        interactif: interactif === 'I',
        questionsNotees: Number(questions),
        diffusion,
      };
    });
}

export function titresPublics(document: string): ReadonlyMap<string, string> {
  const titres = new Map<string, string>();
  let courant: string | null = null;
  for (const ligne of lignesDeSection(document, '## 3. Déroulé', ['## 4.'])) {
    const entete = ENTETE_DE_FICHE.exec(ligne);
    if (entete !== null) {
      courant = entete[2];
      continue;
    }
    const titre = TITRE_PUBLIC.exec(ligne.trim());
    if (courant !== null && titre !== null && !titres.has(courant)) {
      titres.set(courant, titre[1]);
    }
  }
  return titres;
}

function enteteDeSection(document: string, titre: string): string {
  const entete = document
    .split('\n')
    .find((ligne) => ligne.startsWith('### ') && ligne.endsWith(` ${titre}`));
  if (entete === undefined) {
    throw new Error(`section introuvable dans le document : ${titre}`);
  }
  return entete;
}

export function remediationsDuDocument(
  document: string,
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    lignesDeSection(
      document,
      enteteDeSection(document, TITRE_DES_REMEDIATIONS),
      ['### ', '## '],
    )
      .filter((ligne) => ligne.startsWith('| `'))
      .map((ligne) => {
        const [confusion, , , cible] = cellules(ligne);
        return [premierCode(confusion), cible];
      }),
  );
}

export function lignesDesValeursAttendues(document: string): string[][] {
  return lignesDeSection(
    document,
    enteteDeSection(document, TITRE_DES_VALEURS),
    ['### ', '## '],
  )
    .filter((ligne) => ligne.startsWith('| `'))
    .map(cellules);
}

export function mediasDuDocument(document: string): MediaDuDocument[] {
  return lignesDeSection(document, '### 8.2', ['### 8.3'])
    .filter((ligne) => /^\| M\d/.test(ligne))
    .map((ligne) => {
      const [id, , page, , , licence, derive, attribution] = cellules(ligne);
      return {
        id,
        pageSource: page,
        licence,
        fichiers: [...derive.matchAll(/`([^`]+)`/g)].map((code) => code[1]),
        attribution: attribution.replace(/^« /, '').replace(/ »$/, ''),
      };
    });
}

export function piecesJointesDuDocument(
  document: string,
): PieceJointeDuDocument[] {
  return lignesDeSection(document, '### 8.2', ['### 8.3'])
    .filter((ligne) => ligne.startsWith('| `'))
    .map(cellules)
    .filter(([, , ecran]) => ecran !== '—')
    .map(([fichier, , ecran, diffusion]) => ({
      motif: motifDuNomPublie(premierCode(fichier)),
      ecran,
      diffusion,
    }));
}

function motifDuNomPublie(nom: string): RegExp {
  const morceaux = nom
    .split(EMPREINTE_DU_NOM)
    .map((morceau) => morceau.replaceAll(CARACTERES_SPECIAUX, '\\$&'));
  return new RegExp(`^${morceaux.join('[0-9a-f]{8}')}$`, 'u');
}

export function texteNormalise(document: string): string {
  return document
    .replaceAll('\\*', '*')
    .replaceAll('**', '')
    .replaceAll('`', '')
    .replace(/\s+/g, ' ');
}
