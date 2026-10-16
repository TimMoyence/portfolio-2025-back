import { borner } from '../../../../common/domain/nombres/borner';
import type { TraceCalcule } from '../contrats/donnees-publiques';
import { evaluerExpression, variablesDeLExpression } from './Formule';

export const ECHANTILLONS_D_UNE_COURBE = 24;
const PRECISION_D_UN_CRAN = 1e9;
const TOLERANCE_DU_DERNIER_CRAN = 1e-9;
export const POINTS_MAX_D_UN_TRACE = 5_000;

export interface CurseurReglable {
  readonly cle: string;
  readonly min: number;
  readonly max: number;
  readonly pas: number;
  readonly defaut: number;
}

interface PrereglageDuTrace {
  readonly valeurs: Readonly<Record<string, number>>;
}

export interface TraceACalculer {
  readonly abscisse: { readonly min: number; readonly max: number };
  readonly parametres: readonly CurseurReglable[];
  readonly series: readonly { readonly id: string; readonly calcul: string }[];
  readonly forme?: 'courbes' | 'barres';
  readonly prereglages?: readonly PrereglageDuTrace[];
}

function abscissesDu(trace: TraceACalculer): number[] {
  const depart = trace.abscisse.min;
  const arrivee = Math.max(trace.abscisse.max, depart);
  if (trace.forme === 'barres') {
    const premiere = Math.ceil(depart);
    return Array.from(
      { length: Math.max(Math.floor(arrivee) - premiere + 1, 0) },
      (_, rang) => premiere + rang,
    );
  }
  return jalons(depart, arrivee, ECHANTILLONS_D_UNE_COURBE);
}

export function jalons(
  depart: number,
  arrivee: number,
  intervalles: number,
): number[] {
  return Array.from(
    { length: intervalles + 1 },
    (_, rang) => depart + ((arrivee - depart) * rang) / intervalles,
  );
}

function dansLeCurseur(curseur: CurseurReglable, valeur: number): number {
  return borner(valeur, curseur.min, Math.max(curseur.max, curseur.min));
}

function positionsDuCurseur(
  curseur: CurseurReglable,
  prereglages: readonly PrereglageDuTrace[] = [],
): number[] {
  const etendue = Math.max(curseur.max, curseur.min) - curseur.min;
  const crans = Math.floor(etendue / curseur.pas + TOLERANCE_DU_DERNIER_CRAN);
  const surLePas = Array.from({ length: crans + 1 }, (_, rang) =>
    dansLeCurseur(
      curseur,
      Math.round((curseur.min + rang * curseur.pas) * PRECISION_D_UN_CRAN) /
        PRECISION_D_UN_CRAN,
    ),
  );
  const posees = [
    curseur.defaut,
    ...prereglages.flatMap(({ valeurs }) =>
      Object.hasOwn(valeurs, curseur.cle) ? [valeurs[curseur.cle]] : [],
    ),
  ].map((valeur) => dansLeCurseur(curseur, valeur));
  return [...new Set([...surLePas, ...posees])].sort((a, b) => a - b);
}

export function reglageServi(
  trace: TraceACalculer,
  cle: string,
  valeur: number,
): boolean {
  const curseur = trace.parametres.find((candidat) => candidat.cle === cle);
  return (
    curseur !== undefined &&
    positionsDuCurseur(curseur, trace.prereglages).includes(valeur)
  );
}

function curseursLus(trace: TraceACalculer): CurseurReglable[] {
  const lus = new Set(
    trace.series.flatMap(({ calcul }) => variablesDeLExpression(calcul) ?? []),
  );
  return trace.parametres.filter(({ cle }) => lus.has(cle));
}

function reglagesDu(trace: TraceACalculer): Record<string, number>[] {
  return curseursLus(trace).reduce<Record<string, number>[]>(
    (reglages, curseur) =>
      reglages.flatMap((valeurs) =>
        positionsDuCurseur(curseur, trace.prereglages).map((valeur) => ({
          ...valeurs,
          [curseur.cle]: valeur,
        })),
      ),
    [{}],
  );
}

export function pointsDuTrace(trace: TraceACalculer): number {
  return curseursLus(trace).reduce(
    (points, curseur) =>
      points * positionsDuCurseur(curseur, trace.prereglages).length,
    trace.series.length * abscissesDu(trace).length,
  );
}

function ordonnee(
  calcul: string,
  variables: Readonly<Record<string, number>>,
): number | null {
  const { valeur } = evaluerExpression(calcul, variables);
  return valeur !== null && Number.isFinite(valeur) ? valeur : null;
}

export function traceCalcule(trace: TraceACalculer): TraceCalcule {
  const abscisses = abscissesDu(trace);
  return {
    abscisses,
    positions: reglagesDu(trace).map((valeurs) => ({
      valeurs,
      ordonnees: Object.fromEntries(
        trace.series.map(({ id, calcul }) => [
          id,
          abscisses.map((x) => ordonnee(calcul, { ...valeurs, x })),
        ]),
      ),
    })),
  };
}
