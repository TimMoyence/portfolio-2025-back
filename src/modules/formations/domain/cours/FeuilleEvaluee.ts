import { nombreAffiche } from '../../../../common/domain/nombres/ecriture-francaise';
import type { Cours, SheetPlanStocke } from '../contrats/cours';
import type {
  FeuilleEvaluee,
  NatureDeCellule,
} from '../contrats/donnees-publiques';
import { ProductionInvalideError } from '../errors/FormationErrors';
import { reconstruire } from './CorrectionProduction';
import type { ResultatFormule, ValeurFormule } from './Formule';
import {
  LONGUEUR_MAX_FORMULE,
  arrondirMoitieLoinDeZero,
  decalerFormule,
  estUneFormule,
  evaluerFeuille,
  formaterResultat,
  lettreColonne,
  lireNombreSaisi,
  nomCellule,
} from './Formule';
import { estDansLaGrille, estReferenceDeCellule } from './PlansStockes';

export interface RecopieDeCellule {
  readonly de: string;
}

export interface SheetPlanServi extends SheetPlanStocke {
  readonly lettres: readonly string[];
  readonly grille: readonly (readonly string[])[];
  readonly longueurMaxSaisie: number;
  readonly initiale: FeuilleEvaluee;
}

const DECIMALES_D_UN_TAUX = 4;
const DECIMALES_D_UN_MONTANT = 2;

function refuser(plan: SheetPlanStocke, raison: string): never {
  throw new ProductionInvalideError(plan.id, raison);
}

function grilleDu(plan: SheetPlanStocke): string[][] {
  return Array.from({ length: plan.lignes }, (_, ligne) =>
    Array.from({ length: plan.colonnes }, (__, colonne) =>
      nomCellule(ligne, colonne),
    ),
  );
}

function verrouilleesDu(plan: SheetPlanStocke): ReadonlySet<string> {
  return new Set(plan.verrouillees.map((nom) => nom.toUpperCase()));
}

export function saisiesRetenues(
  plan: SheetPlanStocke,
  cellules: Readonly<Record<string, string>>,
): Record<string, string> {
  const verrouillees = verrouilleesDu(plan);
  const retenues: Record<string, string> = {};
  for (const [reference, saisie] of Object.entries(cellules)) {
    const nom = reference.toUpperCase();
    if (!estReferenceDeCellule(nom) || !estDansLaGrille(plan, nom)) {
      refuser(plan, `cellule hors de la grille : ${reference}`);
    }
    if (!verrouillees.has(nom) && saisie.trim().length > 0) {
      retenues[nom] = [...saisie].slice(0, LONGUEUR_MAX_FORMULE).join('');
    }
  }
  return retenues;
}

function avecLaRecopie(
  plan: SheetPlanStocke,
  saisies: Readonly<Record<string, string>>,
  recopie: RecopieDeCellule,
): Record<string, string> {
  const source = recopie.de.toUpperCase();
  const grille = grilleDu(plan);
  const ligne = grille.findIndex((rang) => rang.includes(source));
  const dessous = ligne < 0 ? undefined : grille.at(ligne + 1);
  const vers = dessous?.at(grille[ligne].indexOf(source));
  if (vers === undefined || verrouilleesDu(plan).has(vers)) {
    refuser(plan, `recopie impossible depuis ${recopie.de}`);
  }
  const contenu = saisies[source] ?? plan.cellules[source] ?? '';
  return { ...saisies, [vers]: decalerFormule(contenu, 1, 0) };
}

function natureDuResultat({
  valeur,
  erreur,
}: ResultatFormule): NatureDeCellule {
  if (erreur !== null || valeur === null) {
    return 'erreur';
  }
  switch (typeof valeur) {
    case 'number':
      return 'nombre';
    case 'boolean':
      return 'logique';
    default:
      return 'texte';
  }
}

export function evaluerLaFeuilleDuPlan(
  plan: SheetPlanStocke,
  cellules: Readonly<Record<string, string>>,
  recopie?: RecopieDeCellule,
): FeuilleEvaluee {
  const retenues = saisiesRetenues(plan, cellules);
  const saisies =
    recopie === undefined ? retenues : avecLaRecopie(plan, retenues, recopie);
  const feuille = reconstruire(plan, saisies);
  const resultats = evaluerFeuille(feuille);
  const affichages: Record<string, string> = {};
  const natures: Record<string, NatureDeCellule> = {};
  const formules: string[] = [];
  for (const [nom, saisie] of Object.entries(feuille.cellules)) {
    if (saisie.trim().length === 0) {
      continue;
    }
    if (!estUneFormule(saisie)) {
      affichages[nom] = saisie;
      natures[nom] = lireNombreSaisi(saisie) === null ? 'texte' : 'nombre';
      continue;
    }
    const resultat = resultats.get(nom) ?? { valeur: null, erreur: null };
    affichages[nom] = formaterResultat(resultat);
    natures[nom] = natureDuResultat(resultat);
    formules.push(nom);
  }
  return { saisies, affichages, natures, formules };
}

export function planDeFeuilleDuCours(
  cours: Cours,
  planId: string,
): SheetPlanStocke | null {
  for (const ecran of cours.ecrans) {
    if (ecran.brique === 'fp-sheet' && ecran.proprietes.plan.id === planId) {
      return ecran.proprietes.plan;
    }
  }
  return null;
}

export function planDeFeuilleServi(plan: SheetPlanStocke): SheetPlanServi {
  return {
    ...plan,
    lettres: Array.from({ length: plan.colonnes }, (_, colonne) =>
      lettreColonne(colonne),
    ),
    grille: grilleDu(plan),
    longueurMaxSaisie: LONGUEUR_MAX_FORMULE,
    initiale: evaluerLaFeuilleDuPlan(plan, {}),
  };
}

export function affichageDeLAttendu(valeur: ValeurFormule): string {
  if (typeof valeur !== 'number') {
    return formaterResultat({ valeur, erreur: null });
  }
  const decimales =
    Math.abs(valeur) < 1 ? DECIMALES_D_UN_TAUX : DECIMALES_D_UN_MONTANT;
  return nombreAffiche(arrondirMoitieLoinDeZero(valeur, decimales), decimales);
}
