import { DAILY_BRIEF_SOURCE } from '../../../common/domain/newsletter-sources';

export { DAILY_BRIEF_SOURCE };

export const SUPPORTED_FORMATION_SLUGS = [
  'ia-solopreneurs',
  'automatiser-avec-ia',
  DAILY_BRIEF_SOURCE,
] as const;

export type SupportedFormationSlug = (typeof SUPPORTED_FORMATION_SLUGS)[number];

export const isSupportedFormationSlug = (
  value: unknown,
): value is SupportedFormationSlug =>
  typeof value === 'string' &&
  (SUPPORTED_FORMATION_SLUGS as readonly string[]).includes(value);
