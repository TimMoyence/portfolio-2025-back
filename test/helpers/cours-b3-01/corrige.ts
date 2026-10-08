import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Workbook, Worksheet } from 'exceljs';
import {
  VALEURS_B3_01,
  type ValeursAttenduesB301,
} from '../../../src/modules/formations/infrastructure/contenus/b3-01.donnees';
import {
  ajouterLOnglet,
  nouveauClasseur,
  ouvrirClasseur,
  resultatDe,
} from './classeurs';
import type { Valeur } from './excel';
import { ongletDe, texteDe, valeurDe, type JeuB301 } from './modele';

type QuestionDuCorrige = keyof ValeursAttenduesB301;

const A_VERIFIER = 'À vérifier';
const DEBUT_2026 = 'DATE(2026,1,1)';
const DEPUIS_2026 = `Commandes!B:B,">="&${DEBUT_2026}`;
const PREMIERE_LIGNE_DES_AGENCES = 11;
const COLONNES_CALCULEES = [
  'annee',
  'region',
  'categorie',
  'cout',
  'marge',
  'delai_ouvre',
  'date_promise',
  'en_retard',
] as const;
const PREMIERE_COLONNE_CALCULEE = 14;
const TRIMESTRES = [
  [2025, 1],
  [2025, 2],
  [2025, 3],
  [2025, 4],
  [2026, 1],
  [2026, 2],
  [2026, 3],
] as const;
const FORMAT_DATE = 'dd/mm/yyyy';

const formule = (expression: string) => ({ formula: expression });

function ajouterLesAidesDuBrut(feuille: Worksheet, derniere: number): void {
  const aides = [
    'cle',
    'premiere',
    'ca_converti',
    'ville_normalisee',
    'controle',
  ];
  aides.forEach((nom, rang) => {
    feuille.getRow(1).getCell(PREMIERE_COLONNE_CALCULEE + rang).value = nom;
  });
  for (let r = 2; r <= derniere; r += 1) {
    const ligne = feuille.getRow(r);
    const cle = 'ABCDEFGHIJKLM'
      .split('')
      .map((colonne) => `${colonne}${r}`)
      .join('&"|"&');
    ligne.getCell(14).value = formule(cle);
    ligne.getCell(15).value = formule(`IF(COUNTIF(N$2:N${r},N${r})=1,1,0)`);
    ligne.getCell(16).value = formule(
      `IF(ISTEXT(L${r}),VALUE(SUBSTITUTE(SUBSTITUTE(L${r}," €","")," ","")),L${r})`,
    );
    ligne.getCell(17).value = formule(`PROPER(TRIM(E${r}))`);
    ligne.getCell(18).value = formule(
      `IF(OR(C${r}<B${r},I${r}<=0,G${r}=""),"${A_VERIFIER}","OK")`,
    );
  }
}

function ajouterLAideDeStrasbourg(feuille: Worksheet, derniere: number): void {
  const colonne = PREMIERE_COLONNE_CALCULEE + COLONNES_CALCULEES.length;
  feuille.getRow(1).getCell(colonne).value = 'delai_strasbourg_2026';
  for (let r = 2; r <= derniere; r += 1) {
    feuille.getRow(r).getCell(colonne).value = formule(
      `IF(AND(F${r}="AG12",B${r}>=${DEBUT_2026}),S${r},"")`,
    );
  }
}

function ajouterLesCalculs(
  feuille: Worksheet,
  agences: readonly string[],
): void {
  feuille.addRow(['Trimestre', 'Début', 'Fin', 'CA']);
  TRIMESTRES.forEach(([annee, trimestre], rang) => {
    const r = rang + 2;
    feuille.addRow([
      `T${trimestre} ${annee}`,
      formule(`DATE(${annee},${3 * trimestre - 2},1)`),
      formule(`EOMONTH(B${r},2)`),
      formule(
        `SUMIFS(Commandes!L:L,Commandes!B:B,">="&B${r},Commandes!B:B,"<="&C${r})`,
      ),
    ]);
  });
  feuille.getColumn(2).numFmt = FORMAT_DATE;
  feuille.getColumn(3).numFmt = FORMAT_DATE;
  feuille.getRow(PREMIERE_LIGNE_DES_AGENCES - 1).values = [
    'Agence',
    'CA 2026',
    'Objectif 2026',
    'Atteinte',
  ];
  agences.forEach((agence, rang) => {
    const r = PREMIERE_LIGNE_DES_AGENCES + rang;
    feuille.getRow(r).values = [
      agence,
      formule(`SUMIFS(Commandes!L:L,Commandes!F:F,A${r},${DEPUIS_2026})`),
      formule(
        `SUMIFS(Objectifs!C:C,Objectifs!A:A,A${r},Objectifs!B:B,">="&${DEBUT_2026})`,
      ),
      formule(`B${r}/C${r}`),
    ];
  });
}

function formulesDesQuestions(
  derniereDuBrut: number,
  derniereDesCommandes: number,
  derniereAgence: number,
): Readonly<Record<QuestionDuCorrige, string>> {
  const brut = (colonne: string) =>
    `Brut!${colonne}2:${colonne}${derniereDuBrut}`;
  const commandes = (colonne: string) =>
    `Commandes!${colonne}2:${colonne}${derniereDesCommandes}`;
  const caDepuis2026 = (...criteres: readonly string[]) =>
    `SUMIFS(Commandes!L:L,${[...criteres, DEPUIS_2026].join(',')})`;
  const margeExacte = `(${commandes('I')}*${commandes('J')}*(1-${commandes('K')})-${commandes('Q')})`;
  const en2026 = `(${commandes('B')}>=${DEBUT_2026})`;
  const agences = `Calculs!A${PREMIERE_LIGNE_DES_AGENCES}:D${derniereAgence}`;
  const rennes = 'Commandes!F:F,"AG06"';
  const marseille = 'Commandes!F:F,"AG09"';
  const informatique = 'Commandes!P:P,"Informatique"';
  return {
    'b3-01-a1-lignes-commande': `COUNTIF(${brut('A')},"C-10234")`,
    'b3-01-a1-lignes-uniques': `SUM(${brut('O')})`,
    'b3-01-a1-ca-total': `ROUND(SUMPRODUCT(${brut('P')},${brut('O')}),0)`,
    'b3-01-a1-villes': `SUMPRODUCT(${brut('O')}/COUNTIFS(${brut('Q')},${brut('Q')},${brut('O')},1))`,
    'b3-01-a1-a-verifier': `COUNTIFS(${brut('R')},"${A_VERIFIER}",${brut('O')},1)`,
    'b3-01-a2-ca-rennes-info': `ROUND(${caDepuis2026(rennes, informatique)},0)`,
    'b3-01-a2-remises-marseille': `COUNTIFS(${marseille},Commandes!K:K,">"&0.15)`,
    'b3-01-a2-ca-ouest': `ROUND(${caDepuis2026('Commandes!O:O,"Ouest"')},0)`,
    'b3-01-a2-delai-strasbourg': `MEDIAN(${commandes('V')})`,
    'b3-01-a2-retards': `COUNTIFS(Commandes!U:U,TRUE,${DEPUIS_2026})`,
    'b3-01-a2-taux-marge': `ROUND(SUMPRODUCT(${en2026}*${margeExacte})/${caDepuis2026()}*100,1)`,
    'b3-01-a2-part-info-rennes': `ROUND(${caDepuis2026(rennes, informatique)}/${caDepuis2026(rennes)}*100,1)`,
    'b3-01-a2-meilleur-trimestre':
      'INDEX(Calculs!A2:A8,MATCH(MAX(Calculs!D2:D8),Calculs!D2:D8,0))',
    'b3-01-a3-agences-sous-objectif': `SUMPRODUCT(--(Calculs!B${PREMIERE_LIGNE_DES_AGENCES}:B${derniereAgence}<Calculs!C${PREMIERE_LIGNE_DES_AGENCES}:C${derniereAgence}))`,
    'b3-01-a3-atteinte-rennes': `ROUND(VLOOKUP("AG06",${agences},4,FALSE)*100,1)`,
    'b3-01-a3-ca-2026': `ROUND(${caDepuis2026()},0)`,
    'b3-01-a3-evolution': `ROUND((${caDepuis2026()}/SUMIFS(Commandes!L:L,Commandes!B:B,">="&DATE(2025,1,1),Commandes!B:B,"<="&DATE(2025,9,30))-1)*100,1)`,
    'b3-01-a3-marge-marseille': `ROUND(SUMPRODUCT(${en2026}*(${commandes('F')}="AG09")*${margeExacte})/${caDepuis2026(marseille)}*100,1)`,
    'b3-01-a3-quarantaine': 'COUNTA(Quarantaine!A:A)-1',
  };
}

export async function ecrireLeCorrigeFormateur(
  jeu: JeuB301,
  chemin: string,
): Promise<void> {
  const classeur = nouveauClasseur();
  classeur.calcProperties.fullCalcOnLoad = true;
  ajouterLOnglet(classeur, 'Brut', ongletDe(jeu.brut, 'Commandes'), undefined);
  for (const [nom, onglet] of Object.entries(jeu.reprise2)) {
    ajouterLOnglet(classeur, nom, onglet, undefined);
  }
  const derniereDuBrut = ongletDe(jeu.brut, 'Commandes').lignes.length + 1;
  const derniereDesCommandes =
    ongletDe(jeu.reprise2, 'Commandes').lignes.length + 1;
  const agences = ongletDe(jeu.reprise2, 'Agences').lignes.map((agence) =>
    texteDe(agence, 'agence_id'),
  );
  const brut = classeur.getWorksheet('Brut');
  const commandes = classeur.getWorksheet('Commandes');
  if (brut === undefined || commandes === undefined) {
    throw new Error('Onglets du corrigé absents');
  }
  ajouterLesAidesDuBrut(brut, derniereDuBrut);
  ajouterLAideDeStrasbourg(commandes, derniereDesCommandes);
  ajouterLesCalculs(classeur.addWorksheet('Calculs'), agences);
  const formules = formulesDesQuestions(
    derniereDuBrut,
    derniereDesCommandes,
    PREMIERE_LIGNE_DES_AGENCES + agences.length - 1,
  );
  const corrige = classeur.addWorksheet('Corrigé');
  corrige.addRow(['question', 'calculee', 'attendue', 'verdict']);
  Object.entries(VALEURS_B3_01).forEach(([question, attendue], rang) => {
    const r = rang + 2;
    corrige.addRow([
      question,
      formule(formules[question as QuestionDuCorrige]),
      attendue,
      formule(`IF(B${r}=C${r},"OK","ÉCART")`),
    ]);
  });
  mkdirSync(dirname(chemin), { recursive: true });
  await classeur.xlsx.writeFile(chemin);
}

function feuilleDe(classeur: Workbook, nom: string): Worksheet {
  const feuille = classeur.getWorksheet(nom);
  if (feuille === undefined) {
    throw new Error(`Onglet absent du corrigé recalculé : ${nom}`);
  }
  return feuille;
}

export interface CorrigeRecalcule {
  readonly valeurs: Readonly<Record<string, Valeur>>;
  readonly colonnesCalculees: readonly (readonly Valeur[])[];
}

export async function lireLeCorrigeRecalcule(
  chemin: string,
): Promise<CorrigeRecalcule> {
  const classeur = await ouvrirClasseur(chemin);
  const corrige = feuilleDe(classeur, 'Corrigé');
  const valeurs: Record<string, Valeur> = {};
  for (let r = 2; r <= corrige.rowCount; r += 1) {
    const ligne = corrige.getRow(r);
    valeurs[ligne.getCell(1).text] = resultatDe(ligne.getCell(2));
  }
  const commandes = feuilleDe(classeur, 'Commandes');
  const colonnesCalculees: Valeur[][] = [];
  for (let r = 2; r <= commandes.rowCount; r += 1) {
    const ligne = commandes.getRow(r);
    colonnesCalculees.push(
      COLONNES_CALCULEES.map((_, rang) =>
        resultatDe(ligne.getCell(PREMIERE_COLONNE_CALCULEE + rang)),
      ),
    );
  }
  return { valeurs, colonnesCalculees };
}

export function colonnesCalculeesDuGenerateur(
  jeu: JeuB301,
): readonly (readonly Valeur[])[] {
  return ongletDe(jeu.reprise2, 'Commandes').lignes.map((ligne) =>
    COLONNES_CALCULEES.map((colonne) => valeurDe(ligne, colonne)),
  );
}
