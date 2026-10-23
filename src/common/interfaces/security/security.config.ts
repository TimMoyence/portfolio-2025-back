import type { ConfigService } from '@nestjs/config';
import type { ValeursDeLEnv } from '../../../config/env.validation';

export interface SecurityConfig {
  suspiciousScoreThreshold: number;
}

export function loadSecurityConfig(
  config: ConfigService<ValeursDeLEnv>,
): SecurityConfig {
  return {
    suspiciousScoreThreshold: config.getOrThrow<number>(
      'SECURITY_SUSPICIOUS_SCORE_THRESHOLD',
    ),
  };
}
