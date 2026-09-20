export interface ProgressionEnigmeRecord {
  readonly participantId: string;
  readonly parcoursId: string;
  readonly enigmeId: string;
  readonly tentatives: number;
  readonly resolueLe: Date | null;
}

export interface TentativeEnigmeInput {
  readonly sessionId: string;
  readonly participantId: string;
  readonly enigmeId: string;
  readonly valeurNormalisee: number | null;
  readonly saisie: string;
  readonly correcte: boolean;
}

export interface IEscapeRepository {
  listerProgression(
    participantId: string,
    parcoursId: string,
  ): Promise<readonly ProgressionEnigmeRecord[]>;
  listerProgressionDeSeance(
    sessionId: string,
  ): Promise<readonly ProgressionEnigmeRecord[]>;
  incrementerTentative(input: {
    readonly sessionId: string;
    readonly participantId: string;
    readonly parcoursId: string;
    readonly enigmeId: string;
    readonly plafond: number;
  }): Promise<number | null>;
  marquerResolue(participantId: string, enigmeId: string): Promise<void>;
  journaliser(input: TentativeEnigmeInput): Promise<void>;
  tentativeDejaFaite(
    participantId: string,
    enigmeId: string,
    valeurNormalisee: number | null,
    saisie: string,
  ): Promise<boolean>;
}
