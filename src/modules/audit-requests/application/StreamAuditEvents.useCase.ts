import { Inject, Injectable, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import { AUDIT_REQUESTS_REPOSITORY } from '../domain/token';

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
      let instantSummarySent = false;

      const emitSnapshot = async (): Promise<void> => {
        if (disposed || busy) return;
        busy = true;

        try {
          const audit = await this.repo.findById(auditId);
          if (!audit) {
            subscriber.next({
              type: 'failed',
              data: {
                auditId,
                status: 'FAILED',
                progress: 100,
                done: false,
                error: 'Audit not found.',
                updatedAt: new Date().toISOString(),
              },
            });
            finish();
            return;
          }

          const updatedAt = audit.updatedAt.toISOString();
          const fingerprint = `${audit.processingStatus}:${audit.progress}:${audit.step}:${audit.error}:${updatedAt}`;
          if (fingerprint === lastFingerprint) {
            return;
          }
          lastFingerprint = fingerprint;

          if (audit.processingStatus === 'COMPLETED') {
            subscriber.next({
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
                updatedAt,
              },
            });
            finish();
            return;
          }

          if (audit.processingStatus === 'FAILED') {
            subscriber.next({
              type: 'failed',
              data: {
                auditId: audit.id,
                status: audit.processingStatus,
                progress: audit.progress,
                done: audit.done,
                error: audit.error,
                updatedAt,
              },
            });
            finish();
            return;
          }

          if (
            !instantSummarySent &&
            audit.processingStatus === 'RUNNING' &&
            audit.summaryText &&
            audit.summaryText.trim().length > 0
          ) {
            instantSummarySent = true;
            subscriber.next({
              type: 'instant_summary',
              data: {
                auditId: audit.id,
                ready: false,
                status: audit.processingStatus,
                progress: audit.progress,
                summaryText: audit.summaryText,
                keyChecks: audit.keyChecks,
                quickWins: audit.quickWins,
                pillarScores: audit.pillarScores,
                updatedAt,
              },
            });
          }

          subscriber.next({
            type: 'progress',
            data: {
              auditId: audit.id,
              status: audit.processingStatus,
              progress: audit.progress,
              step: audit.step,
              done: audit.done,
              updatedAt,
            },
          });
        } catch (error) {
          subscriber.next({
            type: 'failed',
            data: {
              auditId,
              status: 'FAILED',
              progress: 100,
              done: false,
              error: String(error),
              updatedAt: new Date().toISOString(),
            },
          });
          finish();
        } finally {
          busy = false;
        }
      };

      const pollTimer = setInterval(() => {
        void emitSnapshot();
      }, 2000);

      const heartbeatTimer = setInterval(() => {
        subscriber.next({
          type: 'heartbeat',
          data: { ts: new Date().toISOString() },
        });
      }, 15000);

      const finish = (): void => {
        if (disposed) return;
        disposed = true;
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
        subscriber.complete();
      };

      void emitSnapshot();

      return () => {
        if (!disposed) {
          disposed = true;
          clearInterval(pollTimer);
          clearInterval(heartbeatTimer);
        }
      };
    });
  }
}
