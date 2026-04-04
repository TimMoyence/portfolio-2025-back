import type { JwtPayload } from '../modules/users/application/services/JwtPayload';

/**
 * Augmentation du type Express Request pour ajouter la propriete `user`
 * injectee par le guard JWT de Passport.
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
