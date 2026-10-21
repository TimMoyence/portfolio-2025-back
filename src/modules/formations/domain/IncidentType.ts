export const INCIDENT_TYPES = Object.freeze([
  'tab_hidden',
  'window_blur',
  'copy_attempt',
  'paste_attempt',
  'context_menu',
  'blocked_shortcut',
  'devtools_suspected',
  'page_unload',
  'fast_answer',
] as const);

export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const MAX_INCIDENTS_PAR_ENVOI = 200;
