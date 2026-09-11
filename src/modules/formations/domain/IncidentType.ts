const INCIDENT_TYPES = [
  'tab_hidden',
  'window_blur',
  'fullscreen_exit',
  'copy_attempt',
  'paste_attempt',
  'blocked_shortcut',
  'devtools_suspected',
  'connection_lost',
  'fast_answer',
] as const;

export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const MAX_INCIDENTS_PAR_ENVOI = 200;

export function estTypeIncidentConnu(type: string): type is IncidentType {
  return (INCIDENT_TYPES as readonly string[]).includes(type);
}

export function envoiDansLaLimite(nombreIncidents: number): boolean {
  return nombreIncidents <= MAX_INCIDENTS_PAR_ENVOI;
}

export function filtrerIncidentsConnus<T extends { type: string }>(
  incidents: readonly T[],
): readonly T[] {
  return incidents.filter((incident) => estTypeIncidentConnu(incident.type));
}
