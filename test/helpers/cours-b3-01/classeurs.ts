import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import {
  ValueType,
  Workbook,
  type Cell,
  type CellValue,
  type Worksheet,
} from 'exceljs';
import JSZip from 'jszip';
import { GRAINE_B3_01 } from './generateur';
import type { Valeur } from './excel';
import type {
  Cellule,
  Classeur,
  Colonne,
  FormatDeColonne,
  Formule,
  JeuB301,
  Onglet,
} from './modele';
import { estUneFormule, resultatDeCellule } from './modele';

export type RoleDuClasseur = 'brut' | 'repriseActe2' | 'repriseActe3';

export interface OngletCanonique {
  readonly colonnes: readonly string[];
  readonly lignes: readonly (readonly Cellule[])[];
}

export interface EmpreinteDOnglet {
  readonly nom: string;
  readonly lignes: number;
  readonly empreinte: string;
}

export interface ClasseurAPublier {
  readonly role: RoleDuClasseur;
  readonly base: string;
  readonly classeur: Classeur;
  readonly onglets: readonly EmpreinteDOnglet[];
  readonly tableau?: { readonly onglet: string; readonly nom: string };
}

export interface ManifesteDesClasseurs {
  readonly graine: number;
  readonly classeurs: readonly {
    readonly role: RoleDuClasseur;
    readonly fichier: string;
    readonly empreinte: string;
    readonly onglets: readonly EmpreinteDOnglet[];
  }[];
}

const MANIFESTE = 'classeurs.manifest.json';
const AUTEUR = 'Norvane Équipement — service commercial';
const DATE_DE_L_EXPORT = new Date(Date.UTC(2026, 9, 9, 7, 0, 0));
const JOURS_ENTRE_1900_ET_1970 = 25_569;
const MS_PAR_JOUR = 86_400_000;
const LONGUEUR_DU_SUFFIXE = 8;
const TABLEAU_DES_COMMANDES = { onglet: 'Commandes', nom: 'T_Commandes' };

const FORMATS_EXCEL: Readonly<Record<FormatDeColonne, string | null>> = {
  texte: null,
  entier: '0',
  euros: '#,##0.00\\ "€"',
  pourcentage: '0%',
  date: 'dd/mm/yyyy',
  mois: 'mmmm yyyy',
  booleen: null,
};

const LARGEURS: Readonly<Record<FormatDeColonne, number>> = {
  texte: 16,
  entier: 10,
  euros: 14,
  pourcentage: 10,
  date: 13,
  mois: 15,
  booleen: 11,
};

const sha256 = (contenu: string | Buffer): string =>
  createHash('sha256').update(contenu).digest('hex');

function celluleCanonique(cellule: Cellule | undefined): Cellule {
  if (cellule === undefined || cellule === null) {
    return null;
  }
  return estUneFormule(cellule)
    ? { formule: cellule.formule, resultat: cellule.resultat }
    : cellule;
}

export function ongletCanonique(onglet: Onglet): OngletCanonique {
  return {
    colonnes: onglet.colonnes.map((colonne) => colonne.nom),
    lignes: onglet.lignes.map((ligne) =>
      onglet.colonnes.map((colonne) => celluleCanonique(ligne[colonne.nom])),
    ),
  };
}

function empreintesDes(classeur: Classeur): EmpreinteDOnglet[] {
  return Object.entries(classeur).map(([nom, onglet]) => ({
    nom,
    lignes: onglet.lignes.length,
    empreinte: sha256(JSON.stringify(ongletCanonique(onglet))),
  }));
}

export function classeursPublies(jeu: JeuB301): readonly ClasseurAPublier[] {
  const publie = (
    role: RoleDuClasseur,
    base: string,
    classeur: Classeur,
  ): ClasseurAPublier => ({
    role,
    base,
    classeur,
    onglets: empreintesDes(classeur),
  });
  return [
    publie('brut', 'B3-01_export_ventes', jeu.brut),
    publie('repriseActe2', 'B3-01_reprise_acte_2', jeu.reprise1),
    {
      ...publie('repriseActe3', 'B3-01_reprise_acte_3', jeu.reprise2),
      tableau: TABLEAU_DES_COMMANDES,
    },
  ];
}

function versExcel(cellule: Cellule | undefined): CellValue {
  const canonique = celluleCanonique(cellule);
  return estUneFormule(canonique)
    ? { formula: canonique.formule, result: canonique.resultat }
    : canonique;
}

function definirLesColonnes(
  feuille: Worksheet,
  colonnes: readonly Colonne[],
  avecEnTete: boolean,
): void {
  feuille.columns = colonnes.map((colonne) => {
    const format = FORMATS_EXCEL[colonne.format];
    return {
      key: colonne.nom,
      width: LARGEURS[colonne.format],
      ...(avecEnTete ? { header: colonne.nom } : {}),
      ...(format === null ? {} : { style: { numFmt: format } }),
    };
  });
}

export function ajouterLOnglet(
  classeur: Workbook,
  nom: string,
  onglet: Onglet,
  tableau: ClasseurAPublier['tableau'],
): void {
  const feuille = classeur.addWorksheet(nom, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  const enTableau = tableau?.onglet === nom;
  definirLesColonnes(feuille, onglet.colonnes, !enTableau);
  const valeurs = onglet.lignes.map((ligne) =>
    onglet.colonnes.map((colonne) => versExcel(ligne[colonne.nom])),
  );
  if (enTableau) {
    feuille.addTable({
      name: tableau.nom,
      ref: 'A1',
      headerRow: true,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: onglet.colonnes.map((colonne) => ({
        name: colonne.nom,
        filterButton: true,
      })),
      rows: valeurs,
    });
    return;
  }
  feuille.addRows(valeurs);
  feuille.getRow(1).font = { bold: true };
  feuille.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: onglet.colonnes.length },
  };
}

export function nouveauClasseur(): Workbook {
  const classeur = new Workbook();
  classeur.creator = AUTEUR;
  classeur.created = DATE_DE_L_EXPORT;
  classeur.modified = DATE_DE_L_EXPORT;
  return classeur;
}

async function octetsDuClasseur(publie: ClasseurAPublier): Promise<Buffer> {
  const classeur = nouveauClasseur();
  for (const [nom, onglet] of Object.entries(publie.classeur)) {
    ajouterLOnglet(classeur, nom, onglet, publie.tableau);
  }
  return dateALExport(Buffer.from(await classeur.xlsx.writeBuffer()));
}

async function dateALExport(octets: Buffer): Promise<Buffer> {
  const archive = await JSZip.loadAsync(octets);
  archive.forEach((_, entree) => {
    entree.date = DATE_DE_L_EXPORT;
  });
  return archive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export function empreinteDuFichier(chemin: string): string {
  return sha256(readFileSync(chemin));
}

function retirerLesVersionsPerimees(
  dossier: string,
  base: string,
  fichierCourant: string,
): void {
  for (const nom of readdirSync(dossier)) {
    if (
      nom.startsWith(`${base}.`) &&
      nom.endsWith('.xlsx') &&
      nom !== fichierCourant
    ) {
      rmSync(join(dossier, nom));
    }
  }
}

export async function ecrireLesClasseurs(
  jeu: JeuB301,
  dossier: string,
): Promise<void> {
  mkdirSync(dossier, { recursive: true });
  const classeurs: ManifesteDesClasseurs['classeurs'][number][] = [];
  for (const publie of classeursPublies(jeu)) {
    const octets = await octetsDuClasseur(publie);
    const empreinte = sha256(octets);
    const fichier = `${publie.base}.${empreinte.slice(0, LONGUEUR_DU_SUFFIXE)}.xlsx`;
    writeFileSync(join(dossier, fichier), octets);
    retirerLesVersionsPerimees(dossier, publie.base, fichier);
    classeurs.push({
      role: publie.role,
      fichier,
      empreinte,
      onglets: publie.onglets,
    });
  }
  const manifeste: ManifesteDesClasseurs = {
    graine: GRAINE_B3_01,
    classeurs,
  };
  writeFileSync(
    join(dossier, MANIFESTE),
    `${JSON.stringify(manifeste, null, 2)}\n`,
    'utf8',
  );
}

export function lireLeManifeste(dossier: string): ManifesteDesClasseurs {
  return JSON.parse(
    readFileSync(join(dossier, MANIFESTE), 'utf8'),
  ) as ManifesteDesClasseurs;
}

const serieDe = (date: Date): number =>
  date.getTime() / MS_PAR_JOUR + JOURS_ENTRE_1900_ET_1970;

const TYPES_RELISIBLES: ReadonlySet<string> = new Set([
  'number',
  'string',
  'boolean',
]);

const estRelisible = (valeur: unknown): valeur is Valeur | Date | undefined =>
  valeur === null ||
  valeur === undefined ||
  valeur instanceof Date ||
  TYPES_RELISIBLES.has(typeof valeur);

function valeurRelue(valeur: unknown): Valeur {
  if (!estRelisible(valeur)) {
    throw new TypeError(`Cellule illisible : ${JSON.stringify(valeur)}`);
  }
  return valeur instanceof Date ? serieDe(valeur) : (valeur ?? null);
}

export function resultatDe(cellule: Cell): Valeur {
  return valeurRelue(cellule.formula ? cellule.result : cellule.value);
}

function formuleRelue(formule: string, resultat: Valeur): Formule {
  if (resultat === null) {
    throw new TypeError(`Formule sans résultat : ${formule}`);
  }
  return { formule, resultat };
}

function celluleRelue(cellule: Cell): Cellule {
  const resultat = resultatDe(cellule);
  return cellule.formula ? formuleRelue(cellule.formula, resultat) : resultat;
}

function ongletRelu(feuille: Worksheet): OngletCanonique {
  const enTete = feuille.getRow(1);
  const colonnes = Array.from(
    { length: enTete.cellCount },
    (_, rang) => enTete.getCell(rang + 1).text,
  );
  const lignes: Cellule[][] = [];
  for (let rang = 2; rang <= feuille.rowCount; rang += 1) {
    const ligne = feuille.getRow(rang);
    lignes.push(
      colonnes.map((_, colonne) => celluleRelue(ligne.getCell(colonne + 1))),
    );
  }
  return { colonnes, lignes };
}

export async function ouvrirClasseur(chemin: string): Promise<Workbook> {
  const classeur = new Workbook();
  await classeur.xlsx.readFile(chemin);
  return classeur;
}

export async function relireClasseur(
  chemin: string,
): Promise<Readonly<Record<string, OngletCanonique>>> {
  const classeur = await ouvrirClasseur(chemin);
  return Object.fromEntries(
    classeur.worksheets.map((feuille) => [feuille.name, ongletRelu(feuille)]),
  );
}

const FORMATS_DE_DATE: ReadonlySet<FormatDeColonne> = new Set(['date', 'mois']);

const estUneDateEcrite = (cellule: Cellule | undefined): boolean =>
  cellule !== undefined && typeof resultatDeCellule(cellule) === 'number';

const estUneDateRelue = (cellule: Cell, format: FormatDeColonne): boolean =>
  cellule.effectiveType === ValueType.Date &&
  cellule.numFmt === FORMATS_EXCEL[format];

function datesSansFormatDansLOnglet(
  feuille: Worksheet | undefined,
  nom: string,
  onglet: Onglet,
): readonly string[] {
  return onglet.colonnes.flatMap((colonne, rang) =>
    FORMATS_DE_DATE.has(colonne.format)
      ? onglet.lignes.flatMap((ligne, index) => {
          const cellule = feuille?.getRow(index + 2).getCell(rang + 1);
          const enDefaut =
            estUneDateEcrite(ligne[colonne.nom]) &&
            (cellule === undefined ||
              !estUneDateRelue(cellule, colonne.format));
          return enDefaut ? [`${nom}!${colonne.nom}:${index + 2}`] : [];
        })
      : [],
  );
}

export async function datesSansFormatDeDate(
  chemin: string,
  classeur: Classeur,
): Promise<readonly string[]> {
  const relu = await ouvrirClasseur(chemin);
  return Object.entries(classeur).flatMap(([nom, onglet]) =>
    datesSansFormatDansLOnglet(relu.getWorksheet(nom), nom, onglet),
  );
}
