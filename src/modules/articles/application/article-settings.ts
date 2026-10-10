import { DAILY_BRIEF_SOURCE } from '../../../common/domain/newsletter-sources';
import { cheminDeLApi } from '../../../config/prefixe-api';

const DEFAULT_SITE_URL = 'https://asilidesign.fr';
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

function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === '/') end -= 1;
  return value.slice(0, end);
}

export function siteUrl(): string {
  const configured = process.env.FRONTEND_URL?.trim();
  return trimTrailingSlashes(configured || DEFAULT_SITE_URL);
}

export function publicApiUrl(path: string): string {
  return `${siteUrl()}${cheminDeLApi(path)}`;
}

export function articlePageUrl(locale: 'fr' | 'en', slug: string): string {
  return `${siteUrl()}/${locale}/articles/${encodeURIComponent(slug)}`;
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
