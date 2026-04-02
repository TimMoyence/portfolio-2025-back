import type { RefreshToken } from './RefreshToken';

/** Port de persistance des jetons de rafraichissement (refresh tokens). */
export interface IRefreshTokensRepository {
  /** Cree un nouveau refresh token en base. */
  create(token: RefreshToken): Promise<RefreshToken>;

  /** Charge un refresh token a partir de son hash. */
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;

  /** Revoque tous les refresh tokens actifs d'un utilisateur. */
  revokeByUserId(userId: string): Promise<void>;

  /** Revoque un refresh token par son identifiant. */
  revokeById(id: string): Promise<void>;

  /** Supprime les refresh tokens expirés ou révoqués depuis plus de 7 jours. */
  purgeExpired(): Promise<number>;
}
