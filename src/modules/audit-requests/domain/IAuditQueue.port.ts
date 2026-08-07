export interface IAuditQueuePort {
  enqueue(auditId: string): Promise<void>;
}
