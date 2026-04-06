/** Roles valides dans l'application. */
export const VALID_ROLES = ['budget', 'weather', 'sebastian', 'admin'] as const;

/** Type union des roles valides. */
export type UserRole = (typeof VALID_ROLES)[number];

/** Roles attribues par defaut aux nouveaux utilisateurs (inscription ou Google). */
export const DEFAULT_SELF_REGISTRATION_ROLES: UserRole[] = [
  'budget',
  'weather',
  'sebastian',
];
