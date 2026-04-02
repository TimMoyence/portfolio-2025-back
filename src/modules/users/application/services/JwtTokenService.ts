import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import type { JwtPayload } from './JwtPayload';

interface SignedToken {
  token: string;
  expiresIn: number;
  expiresAt: number;
}

/**
 * Service de gestion des JWT (signature et verification).
 * Utilise HMAC-SHA256 via le module `crypto` natif de Node.js.
 */
@Injectable()
export class JwtTokenService {
  private static readonly ISSUER = 'portfolio-2025';
  private static readonly AUDIENCE = 'portfolio-2025-api';

  constructor(private readonly configService: ConfigService) {}

  private static readonly MIN_SECRET_LENGTH = 32;

  sign(payload: Record<string, unknown>): SignedToken {
    const secret = this.getValidatedSecret();

    const expiresInValue =
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '3600s';
    const expiresIn = this.parseExpiresIn(expiresInValue);
    const issuedAtTime = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAtTime + expiresIn;

    const tokenPayload = {
      ...payload,
      iss: JwtTokenService.ISSUER,
      aud: JwtTokenService.AUDIENCE,
      issuedAtTime,
      expiresAt,
    };
    const header = { alg: 'HS256', typ: 'JWT' };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload));
    const signature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
      secret,
    );

    return {
      token: `${encodedHeader}.${encodedPayload}.${signature}`,
      expiresIn,
      expiresAt: expiresAt,
    };
  }

  private parseExpiresIn(value: string): number {
    const match = value.trim().match(/^(\d+)([smhd])$/i);

    if (!match) {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 3600;
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
        return 3600;
    }
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value).toString('base64url');
  }

  /**
   * Verifie un JWT et retourne le payload decode.
   *
   * @param token - Le JWT a verifier (format header.payload.signature)
   * @returns Le payload decode du token
   * @throws Error si le token est malformed, la signature invalide ou le token expire
   */
  verify(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Malformed token');
    }

    const [header, payload, signature] = parts;

    const secret = this.getValidatedSecret();

    // Verifier la signature HMAC-SHA256 (timing-safe)
    const expectedSignature = this.createSignature(
      `${header}.${payload}`,
      secret,
    );
    const sigBuffer = Buffer.from(signature, 'base64url');
    const expectedBuffer = Buffer.from(expectedSignature, 'base64url');
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      throw new Error('Invalid signature');
    }

    // Decoder le payload
    let decoded: Record<string, unknown>;
    try {
      decoded = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as Record<string, unknown>;
    } catch {
      throw new Error('Malformed token');
    }

    // Verifier l'expiration (champ `expiresAt` utilise par sign())
    const expiresAt = decoded.expiresAt as number | undefined;
    if (expiresAt !== undefined && expiresAt < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    // Verifier l'issuer et l'audience
    if (decoded.iss !== JwtTokenService.ISSUER) {
      throw new Error('Invalid issuer');
    }
    if (decoded.aud !== JwtTokenService.AUDIENCE) {
      throw new Error('Invalid audience');
    }

    const sub = decoded.sub;
    const email = decoded.email;
    if (!sub || typeof sub !== 'string') {
      throw new Error('Invalid subject claim');
    }
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email claim');
    }

    const roles = Array.isArray(decoded.roles)
      ? (decoded.roles as string[])
      : [];

    return {
      sub,
      email,
      iat: decoded.issuedAtTime as number,
      exp: expiresAt as number,
      iss: decoded.iss as string,
      aud: decoded.aud as string,
      roles,
    };
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

  private createSignature(data: string, secret: string): string {
    return createHmac('sha256', secret).update(data).digest('base64url');
  }
}
