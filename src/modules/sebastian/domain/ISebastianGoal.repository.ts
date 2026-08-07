import type { SebastianGoal } from './SebastianGoal';

export interface ISebastianGoalRepository {
  create(goal: SebastianGoal): Promise<SebastianGoal>;
  findByUserId(userId: string): Promise<SebastianGoal[]>;
  findById(id: string): Promise<SebastianGoal | null>;
  update(id: string, data: Partial<SebastianGoal>): Promise<SebastianGoal>;
  delete(id: string): Promise<void>;
}
