import type { Tolerance } from '../GradingCore';
import { matchesSolution } from '../GradingCore';
import type { SheetPlanStocke } from '../contrats/cours';
import type {
  CorrigeClassement,
  CorrigeFeuille,
  CorrigeTableau,
  PiegeNumerique,
} from './Corrige';
import type { ConfusionId } from './banque/confusions';
import type { Feuille, ResultatFormule, ValeurFormule } from './Formule';
import { evaluerFeuille, formeR1C1, surfaceDeFormule } from './Formule';

interface VerdictDeCellule {
  readonly reference: string;
  readonly juste: boolean;
  readonly confusion: ConfusionId | null;
}

interface VerdictDeLigne {
  readonly rang: number;
  readonly cle: string;
  readonly juste: boolean;
  readonly confusion: ConfusionId | null;
}

interface VerdictDeCarte {
  readonly carteId: string;
  readonly juste: boolean;
  readonly confusion: ConfusionId | null;
}

interface Correction<V> {
  readonly verdicts: readonly V[];
  readonly score: number;
  readonly correcte: boolean;
}

export type CorrectionDeClassement = Correction<VerdictDeCarte>;
export type CorrectionDeFeuille = Correction<VerdictDeCellule>;
export type CorrectionDeTableau = Correction<VerdictDeLigne>;

export type SaisiesDeTableau = readonly Readonly<
  Record<string, number | undefined>
>[];

const SANS_FORMULE: ConfusionId = 'valeur-saisie-sans-formule';
const NON_RECOPIABLE: ConfusionId = 'formule-non-recopiable';

type AttenduDeCellule = CorrigeFeuille['attendus'][number];

function confusionDuPiege(
  valeur: number,
  pieges: readonly PiegeNumerique[],
  tolerance: Tolerance,
): ConfusionId | null {
  const trouve = pieges.find((piege) =>
    matchesSolution(valeur, piege.valeur, tolerance),
  );
  return trouve?.confusion ?? null;
}

function reconstruire(
  plan: SheetPlanStocke,
  envoi: Readonly<Record<string, string>>,
): Feuille {
  const cellules: Record<string, string> = {};
  for (const [nom, contenu] of Object.entries(envoi)) {
    cellules[nom.toUpperCase()] = contenu;
  }
  for (const nom of plan.verrouillees) {
    cellules[nom.toUpperCase()] = plan.cellules[nom] ?? '';
  }
  return { lignes: plan.lignes, colonnes: plan.colonnes, cellules };
}

function estValeurDeControle(valeur: number): boolean {
  return Number.isInteger(valeur) && Math.abs(valeur) <= 1;
}

function trahitLaFormule(saisie: string, attendu: AttenduDeCellule): boolean {
  const surface = surfaceDeFormule(saisie);
  if (surface === null || surface.references.length === 0) {
    return true;
  }
  const valeur = attendu.valeur;
  if (typeof valeur !== 'number' || estValeurDeControle(valeur)) {
    return false;
  }
  return surface.litteraux.some((litteral) =>
    matchesSolution(Math.abs(litteral), Math.abs(valeur), attendu.tolerance),
  );
}

function normaliserTexte(texte: string): string {
  return texte.trim().toUpperCase();
}

function valeurConforme(
  valeur: ValeurFormule,
  attendu: AttenduDeCellule,
): boolean {
  if (typeof attendu.valeur === 'number') {
    return (
      typeof valeur === 'number' &&
      matchesSolution(valeur, attendu.valeur, attendu.tolerance)
    );
  }
  if (typeof attendu.valeur === 'string') {
    return (
      typeof valeur === 'string' &&
      normaliserTexte(valeur) === normaliserTexte(attendu.valeur)
    );
  }
  return valeur === attendu.valeur;
}

function trahitLaRecopie(attendu: AttenduDeCellule, feuille: Feuille): boolean {
  if (attendu.forme === 'references') {
    return false;
  }
  const modele = attendu.forme.memeQue;
  const formeAttendue = formeR1C1(feuille.cellules[modele] ?? '', modele);
  const formeSaisie = formeR1C1(
    feuille.cellules[attendu.reference] ?? '',
    attendu.reference,
  );
  return formeAttendue === null || formeAttendue !== formeSaisie;
}

function confusionDeLaCellule(
  attendu: AttenduDeCellule,
  feuille: Feuille,
  resultat: ResultatFormule | undefined,
): ConfusionId | null | undefined {
  const saisie = feuille.cellules[attendu.reference] ?? '';
  if (saisie.trim().length === 0) {
    return null;
  }
  if (trahitLaFormule(saisie, attendu)) {
    return SANS_FORMULE;
  }
  if (
    resultat === undefined ||
    resultat.erreur !== null ||
    resultat.valeur === null
  ) {
    return attendu.confusionSiErreurFormule;
  }
  const valeur = resultat.valeur;
  if (!valeurConforme(valeur, attendu)) {
    return typeof valeur === 'number'
      ? confusionDuPiege(valeur, attendu.pieges, attendu.tolerance)
      : null;
  }
  return trahitLaRecopie(attendu, feuille) ? NON_RECOPIABLE : undefined;
}

function bilan<V extends { readonly juste: boolean }>(
  verdicts: readonly V[],
  seuilReussite: number,
): Correction<V> {
  const score =
    verdicts.filter((verdict) => verdict.juste).length / verdicts.length;
  return { verdicts, score, correcte: score >= seuilReussite };
}

export function corrigerFeuille(
  corrige: CorrigeFeuille,
  envoi: Readonly<Record<string, string>>,
): CorrectionDeFeuille {
  const feuille = reconstruire(corrige.plan, envoi);
  const resultats = evaluerFeuille(feuille);
  const verdicts = corrige.attendus.map((attendu) => {
    const confusion = confusionDeLaCellule(
      attendu,
      feuille,
      resultats.get(attendu.reference),
    );
    return {
      reference: attendu.reference,
      juste: confusion === undefined,
      confusion: confusion ?? null,
    };
  });
  return bilan(verdicts, corrige.seuilReussite);
}

export function corrigerClassement(
  corrige: CorrigeClassement,
  classement: Readonly<Record<string, string>>,
): CorrectionDeClassement {
  const verdicts = corrige.attendus.map((attendu) => {
    const juste = classement[attendu.carteId] === attendu.categorieId;
    return {
      carteId: attendu.carteId,
      juste,
      confusion: juste ? null : attendu.confusionSiErreur,
    };
  });
  return bilan(verdicts, corrige.seuilReussite);
}

export function corrigerTableau(
  corrige: CorrigeTableau,
  saisies: SaisiesDeTableau,
): CorrectionDeTableau {
  const verdicts = corrige.attendus.map((attendu) => {
    const valeur = saisies[attendu.rang]?.[attendu.cle];
    const juste =
      valeur !== undefined &&
      matchesSolution(valeur, attendu.valeur, corrige.tolerance);
    const confusion =
      juste || valeur === undefined
        ? null
        : confusionDuPiege(valeur, attendu.pieges, corrige.tolerance);
    return { rang: attendu.rang, cle: attendu.cle, juste, confusion };
  });
  return bilan(verdicts, corrige.seuilReussite);
}
