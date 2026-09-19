import { z } from 'zod';
import type { SheetPlanStocke } from '../contrats/cours';
import { identifiantDeQuestion, texte } from './SchemasCommuns';

const COLONNES_MAX = 26;
const CODE_DE_A = 'A'.codePointAt(0) ?? 0;
const REFERENCE_DE_CELLULE = /^[A-Z][1-9]\d{0,2}$/;

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
    if (new Set(plan.verrouillees).size !== plan.verrouillees.length) {
      contexte.addIssue({
        code: 'custom',
        path: ['verrouillees'],
        message: 'une cellule est verrouillée deux fois',
      });
    }
  }) satisfies z.ZodType<SheetPlanStocke>;
