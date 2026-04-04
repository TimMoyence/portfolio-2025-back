import { SetMetadata } from '@nestjs/common';

/** Cle de metadata utilisee pour marquer une route comme publique. */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorateur qui marque une route comme publique,
 * la dispensant de l'authentification JWT.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
