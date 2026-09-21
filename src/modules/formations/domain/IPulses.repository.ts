import type { ComptesJalon } from './contrats/resultats';
import type { EtatPulse } from './contrats/pilotage';

export interface DeclarationDeJalon {
  readonly sessionId: string;
  readonly cleParticipant: string;
  readonly sondageId: string;
  readonly etat: EtatPulse;
}

export interface JalonDuParticipant {
  readonly sondageId: string;
  readonly etat: EtatPulse;
}

export interface IPulsesRepository {
  declarer(input: DeclarationDeJalon): Promise<void>;
  compterParSondage(
    sessionId: string,
  ): Promise<Readonly<Record<string, ComptesJalon>>>;
  listerDuParticipant(
    sessionId: string,
    cleParticipant: string,
  ): Promise<readonly JalonDuParticipant[]>;
}
