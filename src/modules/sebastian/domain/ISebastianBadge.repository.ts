import type { SebastianBadge } from './SebastianBadge';

export interface ISebastianBadgeRepository {
  create(badge: SebastianBadge): Promise<SebastianBadge>;
  findByUserId(userId: string): Promise<SebastianBadge[]>;
  findByUserIdAndKey(
    userId: string,
    badgeKey: string,
  ): Promise<SebastianBadge | null>;
}
