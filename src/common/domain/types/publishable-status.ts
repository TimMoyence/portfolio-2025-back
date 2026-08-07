export const PUBLISHABLE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

export type PublishableStatus = (typeof PUBLISHABLE_STATUSES)[number];
