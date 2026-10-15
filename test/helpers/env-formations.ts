import {
  TEST_FORMATION_REVIEW_TOKEN_SECRET,
  TEST_FORMATIONS_PULSE_SECRET,
} from '../factories/env.factory';
import { installerVariables } from './environnement';

type Portee = Parameters<typeof installerVariables>[1];

export interface EnvFormations {
  readonly syntheseA?: string;
}

export function installerEnvFormations(env: EnvFormations): void {
  installerVariables({
    FORMATION_REVIEW_TOKEN_SECRET: TEST_FORMATION_REVIEW_TOKEN_SECRET,
    FORMATIONS_PULSE_SECRET: TEST_FORMATIONS_PULSE_SECRET,
    FORMATION_TEACHER_NOTIFICATION_TO: env.syntheseA,
  });
}

export function installerSecretDeSignature(
  portee: Portee = 'tout-le-bloc',
): void {
  installerVariables(
    { FORMATION_REVIEW_TOKEN_SECRET: TEST_FORMATION_REVIEW_TOKEN_SECRET },
    portee,
  );
}

export function installerSecretDeJalons(portee: Portee = 'tout-le-bloc'): void {
  installerVariables(
    { FORMATIONS_PULSE_SECRET: TEST_FORMATIONS_PULSE_SECRET },
    portee,
  );
}
