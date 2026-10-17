export interface PlafondDEnvois {
  readonly maximum: number;
  readonly fenetreMs: number;
}

export const TROIS_ENVOIS_PAR_HEURE: PlafondDEnvois = {
  maximum: 3,
  fenetreMs: 60 * 60 * 1000,
};

export function plafondAtteint(
  plafond: PlafondDEnvois,
  recents: number,
): boolean {
  return recents >= plafond.maximum;
}
