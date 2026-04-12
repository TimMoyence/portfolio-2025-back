export interface SecurityEventRecord {
  ip: string;
  userAgent: string;
  method: string;
  path: string;
  statusCode: number;
  score: number;
  reasons: string[];
  occurredAtMs: number;
}

export interface SuspiciousIpSummary {
  ip: string;
  count: number;
  lastSeenMs: number;
  lastScore: number;
  lastReasons: string[];
  lastPath: string;
  lastUserAgent: string;
}

/**
 * Port de persistance des evenements de securite (requetes suspectes).
 *
 * Les implementations doivent etre thread-safe et auto-nettoyer les
 * evenements sortant de la fenetre d'observation afin de borner la memoire.
 */
export interface ISecurityEventsStore {
  /**
   * Enregistre un evenement suspect et retourne le compteur cumule
   * pour cette IP dans la fenetre d'observation active.
   */
  recordEvent(event: SecurityEventRecord): Promise<number>;
  /**
   * Retourne les N IPs les plus actives dans la fenetre donnee,
   * triees par nombre d'evenements decroissant.
   */
  getTopIPs(limit: number, windowMs: number): Promise<SuspiciousIpSummary[]>;
}

export const SECURITY_EVENTS_STORE = Symbol('SECURITY_EVENTS_STORE');
