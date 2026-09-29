import type { Ecran } from '../contrats/cours';
import type { PilotageDemande, PilotageEcran } from '../contrats/pilotage';
import { PhaseFermeeError } from '../errors/FormationErrors';
import type { ExplicationDeCorrection } from './Cours';

export function correctionsRevelables(ecran: Ecran): number | null {
  return ecran.correctionSurPlace?.explications.length ?? null;
}

export function explicationsRevelees(
  ecran: Ecran,
  pilotage: PilotageEcran | undefined,
): readonly ExplicationDeCorrection[] {
  const explications = ecran.correctionSurPlace?.explications ?? [];
  return pilotage?.revele === true
    ? explications
    : explications.slice(0, pilotage?.explicationsDevoilees ?? 0);
}

export function demandeDeCorrection(
  ecran: Ecran,
  demande: PilotageDemande,
): PilotageDemande {
  const revelees = demande.explicationsDevoilees;
  if (revelees === undefined || revelees === 0) {
    return demande;
  }
  const derniere = revelees === correctionsRevelables(ecran);
  return ecran.brique !== 'questionnaire' || derniere
    ? { ...demande, revele: true }
    : demande;
}

export function assertQuestionNonCorrigee(
  pilotage: Readonly<Record<string, PilotageEcran>>,
  ecran: Ecran | undefined,
  questionId: string,
): void {
  if (ecran === undefined) {
    return;
  }
  const corrigee = explicationsRevelees(ecran, pilotage[ecran.id]).some(
    (explication) => explication.reference === questionId,
  );
  if (corrigee) {
    throw new PhaseFermeeError(ecran.id);
  }
}
