import { envInt } from '../../../config/env-readers.util';

export interface SecurityConfig {
  suspiciousScoreThreshold: number;
}

export function loadSecurityConfig(): SecurityConfig {
  return {
    suspiciousScoreThreshold: Math.max(
      1,
      envInt('SECURITY_SUSPICIOUS_SCORE_THRESHOLD', 25),
    ),
  };
}
