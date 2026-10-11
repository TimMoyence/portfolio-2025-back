import { DAILY_BRIEF_SOURCE } from '../../../common/domain/newsletter-sources';
import {
  DELAI_DE_DIFFUSION_EN_MINUTES,
  TAILLE_DU_LOT_DE_DIFFUSION,
} from '../../../config/diffusion-des-articles';
import { envBool, envEntierBorne } from '../../../config/env-readers.util';
import { urlDuSite } from '../../../config/urls-publiques';

const MS_PAR_MINUTE = 60_000;

export const ARTICLE_NEWSLETTER_SOURCE = DAILY_BRIEF_SOURCE;

export function articlePageUrl(locale: 'fr' | 'en', slug: string): string {
  return `${urlDuSite()}/${locale}/articles/${encodeURIComponent(slug)}`;
}

export function broadcastDelayMs(): number {
  return (
    envEntierBorne(
      'ARTICLE_BROADCAST_DELAY_MINUTES',
      DELAI_DE_DIFFUSION_EN_MINUTES,
    ) * MS_PAR_MINUTE
  );
}

export function broadcastEnabled(): boolean {
  return envBool('ARTICLE_BROADCAST_ENABLED', false);
}

export function broadcastBatchSize(): number {
  return envEntierBorne(
    'ARTICLE_BROADCAST_BATCH_SIZE',
    TAILLE_DU_LOT_DE_DIFFUSION,
  );
}
