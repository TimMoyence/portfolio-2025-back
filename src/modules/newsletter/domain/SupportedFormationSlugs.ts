export const SUPPORTED_FORMATION_SLUGS = [
  'ia-solopreneurs',
  'automatiser-avec-ia',
] as const;

export type SupportedFormationSlug = (typeof SUPPORTED_FORMATION_SLUGS)[number];

export const isSupportedFormationSlug = (
  value: unknown,
): value is SupportedFormationSlug =>
  typeof value === 'string' &&
  (SUPPORTED_FORMATION_SLUGS as readonly string[]).includes(value);
