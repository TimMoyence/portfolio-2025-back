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

export interface ISecurityEventsStore {
  recordEvent(event: SecurityEventRecord): Promise<number>;
  getTopIPs(limit: number, windowMs: number): Promise<SuspiciousIpSummary[]>;
}

export const SECURITY_EVENTS_STORE = Symbol('SECURITY_EVENTS_STORE');
