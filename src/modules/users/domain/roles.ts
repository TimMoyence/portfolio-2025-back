export const VALID_ROLES = [
  'weather',
  'sebastian',
  'admin',
  'teacher',
] as const;

export type UserRole = (typeof VALID_ROLES)[number];

export const DEFAULT_SELF_REGISTRATION_ROLES: UserRole[] = [
  'weather',
  'sebastian',
];
