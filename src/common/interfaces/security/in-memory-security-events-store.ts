import { Injectable } from '@nestjs/common';
import type {
  ISecurityEventsStore,
  SecurityEventRecord,
  SuspiciousIpSummary,
} from './ISecurityEventsStore';

interface StoredEntry {
  count: number;
  lastSeenMs: number;
  lastScore: number;
  lastReasons: string[];
  lastPath: string;
  lastUserAgent: string;
}

/**
 * Store en memoire des evenements de securite, indexe par IP.
 *
 * Les entrees sortant de la fenetre d'observation sont purgees a la
 * lecture (lazy eviction), ce qui evite d'avoir un scheduler dedie
 * tout en garantissant une borne memoire raisonnable pour un usage
 * solo (1 instance API). Redis-backed est une extension naturelle
 * via un second adaptateur du meme port.
 */
@Injectable()
export class InMemorySecurityEventsStore implements ISecurityEventsStore {
  private readonly entries = new Map<string, StoredEntry>();

  async recordEvent(event: SecurityEventRecord): Promise<number> {
    const existing = this.entries.get(event.ip);
    const next: StoredEntry = {
      count: (existing?.count ?? 0) + 1,
      lastSeenMs: event.occurredAtMs,
      lastScore: event.score,
      lastReasons: event.reasons,
      lastPath: event.path,
      lastUserAgent: event.userAgent,
    };
    this.entries.set(event.ip, next);
    return Promise.resolve(next.count);
  }

  async getTopIPs(
    limit: number,
    windowMs: number,
  ): Promise<SuspiciousIpSummary[]> {
    const now = Date.now();
    const cutoff = now - windowMs;
    const summaries: SuspiciousIpSummary[] = [];

    for (const [ip, entry] of this.entries.entries()) {
      if (entry.lastSeenMs < cutoff) {
        this.entries.delete(ip);
        continue;
      }
      summaries.push({
        ip,
        count: entry.count,
        lastSeenMs: entry.lastSeenMs,
        lastScore: entry.lastScore,
        lastReasons: entry.lastReasons,
        lastPath: entry.lastPath,
        lastUserAgent: entry.lastUserAgent,
      });
    }

    summaries.sort((a, b) => b.count - a.count || b.lastSeenMs - a.lastSeenMs);
    return Promise.resolve(summaries.slice(0, limit));
  }

  /** Reinitialise le store. Reserve aux tests. */
  clear(): void {
    this.entries.clear();
  }
}
