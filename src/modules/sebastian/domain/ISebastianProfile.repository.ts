import type { SebastianProfile } from './SebastianProfile';

/** Port de persistance pour les profils Sebastian. */
export interface ISebastianProfileRepository {
  findByUserId(userId: string): Promise<SebastianProfile | null>;
  createOrUpdate(profile: SebastianProfile): Promise<SebastianProfile>;
}
