export const INCIDENT_TYPES = [
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
