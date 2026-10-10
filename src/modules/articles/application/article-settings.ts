import { DAILY_BRIEF_SOURCE } from '../../../common/domain/newsletter-sources';
import { urlDuSite } from '../../../config/urls-publiques';

const DEFAULT_BROADCAST_DELAY_MINUTES = 90;
const MAX_BROADCAST_DELAY_MINUTES = 24 * 60;
const DEFAULT_BROADCAST_BATCH_SIZE = 200;
const MAX_BROADCAST_BATCH_SIZE = 1000;

export const ARTICLE_NEWSLETTER_SOURCE = DAILY_BRIEF_SOURCE;

function boundedInteger(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) return fallback;
  return value;
}

export function articlePageUrl(locale: 'fr' | 'en', slug: string): string {
  return `${urlDuSite()}/${locale}/articles/${encodeURIComponent(slug)}`;
}

export function broadcastDelayMs(): number {
  return (
    boundedInteger(
      process.env.ARTICLE_BROADCAST_DELAY_MINUTES,
      DEFAULT_BROADCAST_DELAY_MINUTES,
      0,
      MAX_BROADCAST_DELAY_MINUTES,
    ) * 60_000
  );
}

export function broadcastEnabled(): boolean {
  return process.env.ARTICLE_BROADCAST_ENABLED === 'true';
}

export function broadcastBatchSize(): number {
  return boundedInteger(
    process.env.ARTICLE_BROADCAST_BATCH_SIZE,
    DEFAULT_BROADCAST_BATCH_SIZE,
    1,
    MAX_BROADCAST_BATCH_SIZE,
  );
}
