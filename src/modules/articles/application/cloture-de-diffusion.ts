import type {
  ArticleBroadcastPatch,
  ArticleBroadcastRecord,
  ArticleBroadcastStatus,
} from './article-broadcast.repository';

export type StatutDeCloture = Extract<
  ArticleBroadcastStatus,
  'cancelled' | 'expired'
>;

export function estAnnulable(
  broadcast: ArticleBroadcastRecord | null,
): broadcast is ArticleBroadcastRecord {
  return broadcast?.status === 'scheduled' || broadcast?.status === 'sending';
}

export function clotureDeDiffusion(
  status: StatutDeCloture,
  now: Date,
): ArticleBroadcastPatch {
  return { status, lockedUntil: null, completedAt: now };
}
