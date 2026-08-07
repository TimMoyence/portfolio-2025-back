import { Inject, Injectable, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import type { AuditSnapshot } from '../domain/AuditProcessing';
import { AUDIT_REQUESTS_REPOSITORY } from '../domain/token';

const SSE_GLOBAL_TIMEOUT_MS = 30 * 60 * 1000;

const POLL_INTERVAL_MS = 2_000;

const HEARTBEAT_INTERVAL_MS = 15_000;

@Injectable()
export class StreamAuditEventsUseCase {
  constructor(
    @Inject(AUDIT_REQUESTS_REPOSITORY)
    private readonly repo: IAuditRequestsRepository,
  ) {}

  execute(auditId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      let disposed = false;
      let busy = false;
      let lastFingerprint = '';

      const teardown = (): void => {
        if (disposed) return;
        disposed = true;
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
        clearTimeout(globalTimer);
        subscriber.complete();
      };

      const emitSnapshot = async (): Promise<void> => {
        if (disposed || busy) return;
        busy = true;

        try {
          const audit = await this.repo.findById(auditId);
          if (!audit) {
            subscriber.next(this.buildNotFoundEvent(auditId));
            teardown();
            return;
          }

          const fingerprint = this.computeFingerprint(audit);
          if (fingerprint === lastFingerprint) {
            return;
          }
          lastFingerprint = fingerprint;

          const event = this.buildSnapshotEvent(audit);
          subscriber.next(event);

          if (this.isTerminalStatus(audit.processingStatus)) {
            teardown();
          }
        } catch (error) {
          subscriber.next(this.buildErrorEvent(auditId, String(error)));
          teardown();
        } finally {
          busy = false;
        }
      };

      const pollTimer = setInterval(() => {
        void emitSnapshot();
      }, POLL_INTERVAL_MS);

      const heartbeatTimer = setInterval(() => {
        subscriber.next({
          type: 'heartbeat',
          data: { ts: new Date().toISOString() },
        });
      }, HEARTBEAT_INTERVAL_MS);

      const globalTimer = setTimeout(() => {
        if (!disposed) {
          subscriber.next(this.buildTimeoutEvent(auditId));
          teardown();
        }
      }, SSE_GLOBAL_TIMEOUT_MS);

      void emitSnapshot();

      return () => {
        teardown();
      };
    });
  }

  private isTerminalStatus(status: string): boolean {
    return status === 'COMPLETED' || status === 'FAILED';
  }

  private computeFingerprint(audit: AuditSnapshot): string {
    const updatedAt = audit.updatedAt.toISOString();
    const progressDetails = this.extractProgressDetails(audit.keyChecks);
    return `${audit.processingStatus}:${audit.progress}:${audit.step}:${audit.error}:${updatedAt}:${JSON.stringify(progressDetails)}`;
  }

  private buildSnapshotEvent(audit: AuditSnapshot): MessageEvent {
    const updatedAt = audit.updatedAt.toISOString();

    if (audit.processingStatus === 'COMPLETED') {
      return {
        type: 'completed',
        data: {
          auditId: audit.id,
          status: audit.processingStatus,
          progress: audit.progress,
          done: audit.done,
          summaryText: audit.summaryText,
          keyChecks: audit.keyChecks,
          quickWins: audit.quickWins,
          pillarScores: audit.pillarScores,
          clientReport: audit.clientReport ?? null,
          updatedAt,
        },
      };
    }

    if (audit.processingStatus === 'FAILED') {
      return {
        type: 'failed',
        data: {
          auditId: audit.id,
          status: audit.processingStatus,
          progress: audit.progress,
          done: audit.done,
          error: audit.error,
          updatedAt,
        },
      };
    }

    return {
      type: 'progress',
      data: {
        auditId: audit.id,
        status: audit.processingStatus,
        progress: audit.progress,
        step: audit.step,
        details: this.extractProgressDetails(audit.keyChecks),
        done: audit.done,
        updatedAt,
      },
    };
  }

  private buildNotFoundEvent(auditId: string): MessageEvent {
    return {
      type: 'failed',
      data: {
        auditId,
        status: 'FAILED',
        progress: 100,
        done: false,
        error: 'Audit not found.',
        updatedAt: new Date().toISOString(),
      },
    };
  }

  private buildErrorEvent(auditId: string, error: string): MessageEvent {
    return {
      type: 'failed',
      data: {
        auditId,
        status: 'FAILED',
        progress: 100,
        done: false,
        error,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  private buildTimeoutEvent(auditId: string): MessageEvent {
    return {
      type: 'timeout',
      data: {
        auditId,
        status: 'TIMEOUT',
        error: `SSE stream closed after ${SSE_GLOBAL_TIMEOUT_MS}ms`,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  private extractProgressDetails(
    keyChecks: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    const value = keyChecks['progressDetails'];
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    return value as Record<string, unknown>;
  }
}
