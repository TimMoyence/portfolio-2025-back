/** Port pour la mise en file d'attente des audits. */
export interface IAuditQueuePort {
  enqueue(auditId: string): Promise<void>;
}
