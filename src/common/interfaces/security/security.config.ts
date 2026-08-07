import { envInt } from '../../../config/env-readers.util';

export interface SecurityConfig {
  suspiciousScoreThreshold: number;
  reportWindowMs: number;
  topEventsLimit: number;
}

export function loadSecurityConfig(): SecurityConfig {
  return {
    suspiciousScoreThreshold: Math.max(
      1,
      envInt('SECURITY_SUSPICIOUS_SCORE_THRESHOLD', 25),
    ),
    reportWindowMs: Math.max(
      60_000,
      envInt('SECURITY_REPORT_WINDOW_MS', 24 * 60 * 60 * 1000),
    ),
    topEventsLimit: Math.max(1, envInt('SECURITY_TOP_EVENTS_LIMIT', 10)),
  };
}
