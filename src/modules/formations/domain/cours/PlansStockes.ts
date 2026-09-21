import { z } from 'zod';
import type {
  CardsortPlanStocke,
  EscapeParcoursStocke,
  ProblemeStocke,
  SheetPlanStocke,
  TableBuildPlanStocke,
} from '../contrats/cours';
import { auMoinsUn, identifiantDeQuestion, texte } from './SchemasCommuns';

const COLONNES_MAX = 26;
const TENTATIVES_MAX = 10;
const CODE_DE_A = 'A'.codePointAt(0) ?? 0;
const REFERENCE_DE_CELLULE = /^[A-Z][1-9]\d{0,2}$/;
const NOM_DE_VARIABLE = /^[a-z][A-Za-z]*$/;

export const referenceDeCellule = z.string().regex(REFERENCE_DE_CELLULE);

interface Grille {
  readonly lignes: number;
  readonly colonnes: number;
}

export function estDansLaGrille(grille: Grille, reference: string): boolean {
  const colonne = (reference.codePointAt(0) ?? 0) - CODE_DE_A + 1;
  const ligne = Number(reference.slice(1));
  return colonne <= grille.colonnes && ligne <= grille.lignes;
}

function doublonsDe(valeurs: readonly string[]): readonly string[] {
  return valeurs.filter((valeur, rang) => valeurs.indexOf(valeur) !== rang);
}

function signalerDoublons(
  contexte: z.RefinementCtx,
  chemin: string,
  valeurs: readonly string[],
): void {
  const doublons = doublonsDe(valeurs);
  if (doublons.length > 0) {
    contexte.addIssue({
      code: 'custom',
      path: [chemin],
      message: `identifiants en double : ${doublons.join(', ')}`,
    });
  }
}

export const planFeuille = z
  .object({
    id: identifiantDeQuestion,
    intitule: texte,
    lignes: z.number().int().positive(),
    colonnes: z.number().int().positive().max(COLONNES_MAX),
    cellules: z.record(referenceDeCellule, z.string()),
    verrouillees: z.array(referenceDeCellule),
    consignes: z.array(texte),
  })
  .strict()
  .superRefine((plan, contexte) => {
    const horsGrille = [
      ...Object.keys(plan.cellules),
      ...plan.verrouillees,
    ].filter((reference) => !estDansLaGrille(plan, reference));
    if (horsGrille.length > 0) {
      contexte.addIssue({
        code: 'custom',
        path: ['cellules'],
        message: `cellules hors de la grille ${plan.lignes} × ${plan.colonnes} : ${horsGrille.join(', ')}`,
      });
    }
    signalerDoublons(contexte, 'verrouillees', plan.verrouillees);
  }) satisfies z.ZodType<SheetPlanStocke>;

const optionDeClassement = z.object({ id: texte, libelle: texte }).strict();

export const planClassement = z
  .object({
    id: identifiantDeQuestion,
    intitule: texte,
    cartes: auMoinsUn(optionDeClassement),
    categories: auMoinsUn(optionDeClassement),
    dureeJeuMs: z.number().int().positive().optional(),
  })
  .strict()
  .superRefine((plan, contexte) => {
    signalerDoublons(
      contexte,
      'cartes',
      plan.cartes.map((carte) => carte.id),
    );
    signalerDoublons(
      contexte,
      'categories',
      plan.categories.map((categorie) => categorie.id),
    );
  }) satisfies z.ZodType<CardsortPlanStocke>;

const colonneDeTableau = z
  .object({
    cle: z.string().regex(NOM_DE_VARIABLE),
    intitule: texte,
    role: z.enum(['donnee', 'saisie', 'deduite']),
    decimales: z.number().int().nonnegative(),
    valeurs: z.array(z.number()).optional(),
    formule: texte.optional(),
    formuleInitiale: texte.optional(),
    soldeDe: texte.optional(),
    totalise: z.boolean(),
  })
  .strict();

type ColonneDeTableau = z.output<typeof colonneDeTableau>;

function incoherenceDeColonne(
  colonne: ColonneDeTableau,
  echeances: number,
): string | null {
  if (colonne.role === 'donnee' && colonne.valeurs?.length !== echeances) {
    return `la colonne de donnée ${colonne.cle} doit porter ${echeances} valeurs`;
  }
  if (colonne.role === 'deduite' && colonne.formule === undefined) {
    return `la colonne déduite ${colonne.cle} n'a pas de formule`;
  }
  if (
    colonne.role === 'saisie' &&
    (colonne.valeurs !== undefined || colonne.formule !== undefined)
  ) {
    return `la colonne saisie ${colonne.cle} ne porte ni valeur ni formule`;
  }
  return null;
}

export const planTableau = z
  .object({
    id: identifiantDeQuestion,
    intitule: texte,
    consignes: z.array(texte),
    echeances: z.number().int().positive(),
    libellesLignes: z.array(texte),
    parametres: z.record(z.string().regex(NOM_DE_VARIABLE), z.number()),
    colonnes: auMoinsUn(colonneDeTableau),
    synthese: z.array(
      z
        .object({
          libelle: texte,
          formule: texte,
          unite: texte.nullable(),
          decimales: z.number().int().nonnegative(),
        })
        .strict(),
    ),
  })
  .strict()
  .superRefine((plan, contexte) => {
    if (plan.libellesLignes.length !== plan.echeances) {
      contexte.addIssue({
        code: 'custom',
        path: ['libellesLignes'],
        message: `${plan.echeances} libellés de ligne sont attendus`,
      });
    }
    signalerDoublons(
      contexte,
      'colonnes',
      plan.colonnes.map((colonne) => colonne.cle),
    );
    plan.colonnes.forEach((colonne, rang) => {
      const incoherence = incoherenceDeColonne(colonne, plan.echeances);
      if (incoherence !== null) {
        contexte.addIssue({
          code: 'custom',
          path: ['colonnes', rang],
          message: incoherence,
        });
      }
    });
  }) satisfies z.ZodType<TableBuildPlanStocke>;

export const parcoursEnigmes = z
  .object({
    id: identifiantDeQuestion,
    intitule: texte,
    delaiIndiceMs: z.number().int().nonnegative(),
    budgetEnigmeMs: z.number().int().positive(),
    tentativesMax: z.number().int().positive().max(TENTATIVES_MAX),
    enigmes: auMoinsUn(
      z
        .object({
          id: identifiantDeQuestion,
          intitule: texte,
          enonce: texte,
          indice: texte,
        })
        .strict(),
    ),
  })
  .strict()
  .superRefine((parcours, contexte) => {
    signalerDoublons(
      contexte,
      'enigmes',
      parcours.enigmes.map((enigme) => enigme.id),
    );
  }) satisfies z.ZodType<EscapeParcoursStocke>;

export const probleme = z
  .object({ id: identifiantDeQuestion, enonce: texte, invite: texte })
  .strict() satisfies z.ZodType<ProblemeStocke>;

export const sondage = z
  .object({ id: identifiantDeQuestion, invite: texte })
  .strict();

export const rappel = z
  .object({ id: identifiantDeQuestion, intitule: texte })
  .strict();
