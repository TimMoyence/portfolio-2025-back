import type { SebastianProfile } from './SebastianProfile';

export interface ISebastianProfileRepository {
  findByUserId(userId: string): Promise<SebastianProfile | null>;
  createOrUpdate(profile: SebastianProfile): Promise<SebastianProfile>;
}
