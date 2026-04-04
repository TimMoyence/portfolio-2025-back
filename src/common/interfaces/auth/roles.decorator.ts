import { SetMetadata } from '@nestjs/common';

/** Cle de metadata pour les roles requis sur une route. */
export const ROLES_KEY = 'roles';

/**
 * Decorateur qui restreint l'acces a une route aux utilisateurs
 * possedant au moins un des roles specifies.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
