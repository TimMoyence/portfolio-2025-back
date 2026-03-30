/**
 * Payload decode d'un JSON Web Token.
 * Contient les claims standard necessaires a l'authentification.
 */
export interface JwtPayload {
  /** Identifiant unique de l'utilisateur */
  sub: string;
  /** Adresse email de l'utilisateur */
  email: string;
  /** Timestamp d'emission du token (en secondes UNIX) */
  iat: number;
  /** Timestamp d'expiration du token (en secondes UNIX) */
  exp: number;
  /** Emetteur du token (issuer) */
  iss: string;
  /** Audience cible du token */
  aud: string;
}
