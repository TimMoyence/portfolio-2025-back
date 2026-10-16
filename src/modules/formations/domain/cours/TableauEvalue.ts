import { nombreAffiche } from '../../../../common/domain/nombres/ecriture-francaise';
import { ESPACE_INSECABLE } from '../../../../common/domain/texte/sans-espaces-typographiques';
import type { Cours, TableBuildPlanStocke } from '../contrats/cours';
import type {
  TableauEvalue,
  ValeurDuTableau,
} from '../contrats/donnees-publiques';
import { ProductionInvalideError } from '../errors/FormationErrors';
import { evaluerExpression, lireNombreSaisi } from './Formule';
import { estUneValeurDeVerite } from './PlansStockes';

export interface TableBuildPlanServi extends TableBuildPlanStocke {
  readonly tableauInitial: TableauEvalue;
}

export interface SaisieBruteDeTableau {
  readonly rang: number;
  readonly cle: string;
  readonly saisie: string;
}

type ValeursDeLigne = Record<string, number | null>;

type Colonne = TableBuildPlanStocke['colonnes'][number];

type Lecture = (rang: number, cle: string) => number | null;

const DECIMALES_MAX = 6;

function refuser(plan: TableBuildPlanStocke, raison: string): never {
  throw new ProductionInvalideError(plan.id, raison);
}

function lu(valeurs: Readonly<ValeursDeLigne>, cle: string): number | null {
  return Object.hasOwn(valeurs, cle) ? valeurs[cle] : null;
}

function capitaliser(cle: string): string {
  return cle.charAt(0).toUpperCase() + cle.slice(1);
}

function nombresFinis(
  source: Readonly<ValeursDeLigne>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(source).filter(
      (entree): entree is [string, number] =>
        entree[1] !== null && Number.isFinite(entree[1]),
    ),
  );
}

function prefixees(
  prefixe: string,
  valeurs: Readonly<ValeursDeLigne>,
): ValeursDeLigne {
  return Object.fromEntries(
    Object.entries(valeurs).map(([cle, valeur]) => [
      `${prefixe}${capitaliser(cle)}`,
      valeur,
    ]),
  );
}

function evaluer(
  formule: string | undefined,
  variables: Readonly<Record<string, number>>,
): number | null {
  if (formule === undefined) {
    return null;
  }
  const { valeur } = evaluerExpression(formule, variables);
  return valeur !== null && Number.isFinite(valeur) ? valeur : null;
}

function valeurDuTableau(
  valeur: number | null,
  decimales: number,
): ValeurDuTableau {
  const fixes = Math.min(decimales, DECIMALES_MAX);
  return { valeur, affichage: nombreAffiche(valeur, fixes, fixes) };
}

function formuleDuRang(colonne: Colonne, rang: number): string | undefined {
  return rang === 0 && colonne.formuleInitiale !== undefined
    ? colonne.formuleInitiale
    : colonne.formule;
}

function ligneBatie(
  plan: TableBuildPlanStocke,
  rang: number,
  lire: Lecture,
  precedente: Readonly<ValeursDeLigne>,
): ValeursDeLigne {
  const valeurs: ValeursDeLigne = {};
  for (const colonne of plan.colonnes) {
    if (colonne.role === 'donnee') {
      valeurs[colonne.cle] = colonne.valeurs?.[rang] ?? null;
    } else if (colonne.role === 'saisie') {
      valeurs[colonne.cle] = lire(rang, colonne.cle);
    }
  }
  for (const colonne of plan.colonnes) {
    if (colonne.role === 'deduite') {
      valeurs[colonne.cle] = evaluer(
        formuleDuRang(colonne, rang),
        nombresFinis({
          ...plan.parametres,
          ...prefixees('avant', precedente),
          ...valeurs,
        }),
      );
    }
  }
  return valeurs;
}

function batir(plan: TableBuildPlanStocke, lire: Lecture): ValeursDeLigne[] {
  const lignes: ValeursDeLigne[] = [];
  for (let rang = 0; rang < plan.echeances; rang += 1) {
    lignes.push(ligneBatie(plan, rang, lire, lignes.at(-1) ?? {}));
  }
  return lignes;
}

function parColonne<T>(
  colonnes: readonly Colonne[],
  valeurDe: (colonne: Colonne) => T,
): Record<string, T> {
  return Object.fromEntries(
    colonnes.map((colonne) => [colonne.cle, valeurDe(colonne)]),
  );
}

function colonnesTotalisees(plan: TableBuildPlanStocke): readonly Colonne[] {
  return plan.colonnes.filter((colonne) => colonne.totalise);
}

function totauxDes(
  plan: TableBuildPlanStocke,
  lignes: readonly ValeursDeLigne[],
): ValeursDeLigne {
  return parColonne(colonnesTotalisees(plan), (colonne) =>
    lignes.reduce<number | null>((cumul, ligne) => {
      const valeur = lu(ligne, colonne.cle);
      return cumul === null || valeur === null ? null : cumul + valeur;
    }, 0),
  );
}

function soldeFinalDe(
  plan: TableBuildPlanStocke,
  derniere: Readonly<ValeursDeLigne>,
): ValeurDuTableau | null {
  const colonne = plan.colonnes.find(
    (candidate) => candidate.soldeDe !== undefined,
  );
  if (colonne?.soldeDe === undefined) {
    return null;
  }
  const depart = lu(derniere, colonne.soldeDe);
  const verse = lu(derniere, colonne.cle);
  return valeurDuTableau(
    depart === null || verse === null ? null : depart - verse,
    colonne.decimales,
  );
}

function tableauBati(plan: TableBuildPlanStocke, lire: Lecture): TableauEvalue {
  const lignes = batir(plan, lire);
  const derniere = lignes.at(-1) ?? {};
  const totaux = totauxDes(plan, lignes);
  const variablesDeSynthese = nombresFinis({
    ...plan.parametres,
    ...prefixees('dernier', derniere),
    ...prefixees('total', totaux),
  });
  return {
    lignes: lignes.map((valeurs, rang) => ({
      rang,
      valeurs: parColonne(plan.colonnes, (colonne) =>
        valeurDuTableau(lu(valeurs, colonne.cle), colonne.decimales),
      ),
    })),
    totaux: parColonne(colonnesTotalisees(plan), (colonne) =>
      valeurDuTableau(lu(totaux, colonne.cle), colonne.decimales),
    ),
    synthese: plan.synthese.map((element) => {
      const resultat = valeurDuTableau(
        evaluer(element.formule, variablesDeSynthese),
        element.decimales,
      );
      return resultat.valeur === null || element.unite === null
        ? resultat
        : {
            ...resultat,
            affichage: `${resultat.affichage}${ESPACE_INSECABLE}${element.unite}`,
          };
    }),
    soldeFinal: soldeFinalDe(plan, derniere),
  };
}

function cleDeCellule(rang: number, cle: string): string {
  return `${rang}:${cle}`;
}

function nombreDeLaSaisie(colonne: Colonne, saisie: string): number | null {
  const nombre = lireNombreSaisi(saisie);
  if (nombre === null || !Number.isFinite(nombre)) {
    return null;
  }
  return colonne.format === 'booleen' && !estUneValeurDeVerite(nombre)
    ? null
    : nombre;
}

export function planDeTableauServi(
  plan: TableBuildPlanStocke,
): TableBuildPlanServi {
  return { ...plan, tableauInitial: tableauBati(plan, () => null) };
}

export function evaluerLeTableauDuPlan(
  plan: TableBuildPlanStocke,
  saisies: readonly SaisieBruteDeTableau[],
): TableauEvalue {
  const lues = new Map<string, number | null>();
  for (const { rang, cle, saisie } of saisies) {
    const colonne = plan.colonnes.find((candidate) => candidate.cle === cle);
    if (colonne?.role !== 'saisie') {
      refuser(plan, `la colonne ${cle} ne se saisit pas`);
    }
    if (!Number.isInteger(rang) || rang < 0 || rang >= plan.echeances) {
      refuser(plan, `ligne hors du tableau : ${rang}`);
    }
    lues.set(cleDeCellule(rang, cle), nombreDeLaSaisie(colonne, saisie));
  }
  return tableauBati(
    plan,
    (rang, cle) => lues.get(cleDeCellule(rang, cle)) ?? null,
  );
}

export function tableauDuCorrige(
  plan: TableBuildPlanStocke,
  attendus: readonly {
    readonly rang: number;
    readonly cle: string;
    readonly valeur: number;
  }[],
): TableauEvalue {
  const parCellule = new Map(
    attendus.map(({ rang, cle, valeur }) => [cleDeCellule(rang, cle), valeur]),
  );
  return tableauBati(
    plan,
    (rang, cle) => parCellule.get(cleDeCellule(rang, cle)) ?? null,
  );
}

export function planDeTableauDuCours(
  cours: Cours,
  planId: string,
): TableBuildPlanStocke | null {
  for (const ecran of cours.ecrans) {
    if (
      ecran.brique === 'fp-table-build' &&
      ecran.proprietes.plan.id === planId
    ) {
      return ecran.proprietes.plan;
    }
  }
  return null;
}
