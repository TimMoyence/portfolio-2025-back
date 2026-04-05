import type { SebastianBadge } from './SebastianBadge';

/** Port de persistance pour les badges Sebastian. */
export interface ISebastianBadgeRepository {
  /** Persiste un nouveau badge et retourne l'entite creee. */
  create(badge: SebastianBadge): Promise<SebastianBadge>;
  /** Retourne tous les badges d'un utilisateur, tries par date de deblocage decroissante. */
  findByUserId(userId: string): Promise<SebastianBadge[]>;
  /** Retourne un badge specifique d'un utilisateur (null si non debloque). */
  findByUserIdAndKey(
    userId: string,
    badgeKey: string,
  ): Promise<SebastianBadge | null>;
}
