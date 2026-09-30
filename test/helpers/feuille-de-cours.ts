import type { CorrigeFeuille } from '../../src/modules/formations/domain/cours/Corrige';
import { corrigerFeuille } from '../../src/modules/formations/domain/cours/CorrectionProduction';
import type { ContenuDeCours } from '../../src/modules/formations/domain/cours/CoursStocke';
import { ecranDuContenu } from './fiche-de-cours';

export const rangsDe = (premier: number, dernier: number): number[] =>
  Array.from({ length: dernier - premier + 1 }, (_, rang) => premier + rang);

export function enFrancais(valeur: number, decimales: number): string {
  return valeur.toFixed(decimales).replace('.', ',');
}

export function recopier(
  modele: string,
  colonne: string,
  premiere: number,
  derniere: number,
): Record<string, string> {
  return Object.fromEntries(
    rangsDe(premiere, derniere).map((ligne) => [
      `${colonne}${ligne}`,
      modele.replaceAll(
        /(?<![$A-Z])([A-H])(\d+)\b/g,
        (_, lettre: string, numero: string) =>
          `${lettre}${Number(numero) + ligne - premiere}`,
      ),
    ]),
  );
}

export function confusionsDe(
  corrige: CorrigeFeuille,
  envoi: Readonly<Record<string, string>>,
  colonne: string,
): (string | null)[] {
  return corrigerFeuille(corrige, envoi)
    .verdicts.filter((verdict) => verdict.reference.startsWith(colonne))
    .map((verdict) => verdict.confusion);
}

export function attendreUneRecopieNonFigee(
  corrige: CorrigeFeuille,
  envoi: Readonly<Record<string, string>>,
  colonne: string,
  lignesDecalees: number,
): void {
  expect(confusionsDe(corrige, envoi, colonne)).toEqual([
    null,
    ...Array.from(
      { length: lignesDecalees },
      () => 'reference-relative-non-figee',
    ),
  ]);
}

export const texteDeLEcran = (
  contenu: ContenuDeCours,
  screenId: string,
): string => JSON.stringify(ecranDuContenu(contenu, screenId));

export function proprietesV2(
  contenu: ContenuDeCours,
  screenId: string,
): Readonly<Record<string, unknown>> {
  const ecran = ecranDuContenu(contenu, screenId);
  if (ecran.brique !== 'fp-story') {
    throw new Error(`l’écran ${screenId} n’est pas un écran v2`);
  }
  const { presentation } = ecran.proprietes;
  if (presentation?.version !== 2) {
    throw new Error(`l’écran ${screenId} n’a pas de présentation v2`);
  }
  const { props } = presentation;
  if (typeof props !== 'object' || props === null) {
    throw new Error(`l’écran ${screenId} n’a pas de propriétés v2`);
  }
  return { ...props };
}
