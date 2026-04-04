/**
 * Valeurs possibles du statut de publication,
 * partagees entre les modules Services, Projects et Courses.
 *
 * Le tableau est reutilisable pour la definition des colonnes TypeORM
 * (`@Column({ type: 'enum', enum: PUBLISHABLE_STATUSES })`).
 */
export const PUBLISHABLE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

/** Statut de publication commun aux modules Services, Projects et Courses. */
export type PublishableStatus = (typeof PUBLISHABLE_STATUSES)[number];
