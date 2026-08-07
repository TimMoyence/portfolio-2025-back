export interface IBadgesEvaluationQueuePort {
  enqueue(userId: string): Promise<void>;
}
