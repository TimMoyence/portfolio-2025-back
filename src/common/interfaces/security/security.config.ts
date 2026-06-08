/**
 * Configuration du module de securite applicative.
 *
 * Les signaux et seuils sont reglables via variables d'environnement
 * pour permettre un ajustement en production sans redeploiement code.
 * L'intercepteur est toujours actif en mode "log-only" par defaut :
 * il ne bloque jamais les requetes legitimes, il les trace uniquement.
 */
import { envInt } from '../../../config/env-readers.util';

export interface SecurityConfig {
  /** Score minimum pour qu'une requete soit consideree suspecte et logguee. */
  suspiciousScoreThreshold: number;
  /** Fenetre d'observation pour le top-N IPs suspectes (millisecondes). */
  reportWindowMs: number;
  /** Taille max du Top-N retourne par l'endpoint metrics/security. */
  topEventsLimit: number;
}

/** Charge la configuration securite depuis l'environnement. */
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
