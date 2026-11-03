import { envBool } from '../config/environnement/env-readers.util';

export function logBootstrapStep(message: string): void {
  if (envBool('BOOTSTRAP_DEBUG', false)) {
    console.log(`[bootstrap] ${message}`);
  }
}
