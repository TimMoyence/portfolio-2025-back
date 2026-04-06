import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignJWT, jwtVerify, errors } from 'jose';
import type { JwtPayload } from './JwtPayload';

interface SignedToken {
  token: string;
  expiresIn: number;
  expiresAt: number;
}

/**
 * Service de gestion des JWT (signature et verification).
 * Utilise la librairie `jose` pour les operations HMAC-SHA256 conformes RFC 7519.
 */
@Injectable()
export class JwtTokenService {
  private static readonly ISSUER = 'portfolio-2025';
  private static readonly AUDIENCE = 'portfolio-2025-api';

  constructor(private readonly configService: ConfigService) {}

  private static readonly MIN_SECRET_LENGTH = 32;

  /**
   * Signe un payload et retourne un JWT avec ses metadonnees d'expiration.
   *
   * @param payload - Les donnees a inclure dans le token (sub, email, roles, etc.)
   * @returns Le token signe avec sa duree de vie et son timestamp d'expiration
   */
  async sign(payload: Record<string, unknown>): Promise<SignedToken> {
    const secret = this.getEncodedSecret();

    const expiresInValue =
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '900s';
    const expiresIn = this.parseExpiresIn(expiresInValue);
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + expiresIn;

    const token = await new SignJWT({
      ...payload,
      roles: (payload.roles as string[]) ?? [],
    })
      .setProtectedHeader({ alg: 'HS256', kid: this.getKid() })
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAt)
      .setIssuer(JwtTokenService.ISSUER)
      .setAudience(JwtTokenService.AUDIENCE)
      .sign(secret);

    return { token, expiresIn, expiresAt };
  }

  private parseExpiresIn(value: string): number {
    const match = value.trim().match(/^(\d+)([smhd])$/i);

    if (!match) {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 900;
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 3600;
      case 'd':
        return amount * 86400;
      default:
        return 900;
    }
  }

  /**
   * Verifie un JWT et retourne le payload decode.
   * Supporte la rotation de cles : si la verification avec le secret courant echoue
   * et qu'un `JWT_SECRET_PREVIOUS` est configure, retente avec l'ancien secret.
   *
   * @param token - Le JWT a verifier (format header.payload.signature)
   * @returns Le payload decode du token
   * @throws Error si le token est malformed, la signature invalide ou le token expire
   */
  async verify(token: string): Promise<JwtPayload> {
    try {
      return await this.verifyWithSecret(token, this.getEncodedSecret());
    } catch (firstError) {
      const previousSecret = this.getPreviousSecret();
      if (!previousSecret) throw firstError;
      try {
        return await this.verifyWithSecret(token, previousSecret);
      } catch {
        throw firstError;
      }
    }
  }

  /**
   * Verifie un JWT avec un secret donne et retourne le payload decode.
   *
   * @param token - Le JWT a verifier
   * @param secret - Le secret encode en Uint8Array
   * @returns Le payload decode du token
   */
  private async verifyWithSecret(
    token: string,
    secret: Uint8Array,
  ): Promise<JwtPayload> {
    try {
      const { payload } = await jwtVerify(token, secret, {
        issuer: JwtTokenService.ISSUER,
        audience: JwtTokenService.AUDIENCE,
      });

      const sub = payload.sub;
      const email = payload.email as string | undefined;
      if (!sub || typeof sub !== 'string')
        throw new Error('Invalid subject claim');
      if (!email || typeof email !== 'string')
        throw new Error('Invalid email claim');

      const roles = Array.isArray(payload.roles)
        ? (payload.roles as string[])
        : [];

      return {
        sub,
        email,
        iat: payload.iat!,
        exp: payload.exp!,
        iss: payload.iss!,
        aud: payload.aud as string,
        roles,
      };
    } catch (error) {
      if (error instanceof errors.JWTExpired) throw new Error('Token expired');
      if (error instanceof errors.JWTClaimValidationFailed) {
        if (error.claim === 'iss') throw new Error('Invalid issuer');
        if (error.claim === 'aud') throw new Error('Invalid audience');
        throw new Error(error.message);
      }
      if (error instanceof errors.JWSSignatureVerificationFailed)
        throw new Error('Invalid signature');
      if (error instanceof errors.JWSInvalid)
        throw new Error('Malformed token');
      if (error instanceof Error && error.message.startsWith('Invalid'))
        throw error;
      throw new Error('Malformed token');
    }
  }

  private getValidatedSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    if (secret.length < JwtTokenService.MIN_SECRET_LENGTH) {
      throw new Error(
        `JWT_SECRET must be at least ${JwtTokenService.MIN_SECRET_LENGTH} characters`,
      );
    }
    return secret;
  }

  /** Encode le secret en Uint8Array pour utilisation avec jose. */
  private getEncodedSecret(): Uint8Array {
    const secret = this.getValidatedSecret();
    return new TextEncoder().encode(secret);
  }

  /** Retourne le secret JWT precedent pour la rotation de cles (optionnel). */
  private getPreviousSecret(): Uint8Array | null {
    const secret = this.configService.get<string>('JWT_SECRET_PREVIOUS');
    if (!secret || secret.length < JwtTokenService.MIN_SECRET_LENGTH)
      return null;
    return new TextEncoder().encode(secret);
  }

  /** Retourne le kid (Key ID) pour le header JWT : 'v2' si rotation active, 'v1' sinon. */
  private getKid(): string {
    return this.configService.get<string>('JWT_SECRET_PREVIOUS') ? 'v2' : 'v1';
  }
}
