import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignJWT, jwtVerify, errors, type JWTPayload } from 'jose';
import type { JwtPayload } from './JwtPayload';

interface SignedToken {
  token: string;
  expiresIn: number;
  expiresAt: number;
}

const EXPIRES_IN_PATTERN = /^(\d+)([smhd])$/i;

function toJwtPayload(payload: JWTPayload): JwtPayload {
  const sub = payload.sub;
  const email = payload.email as string | undefined;
  if (!sub || typeof sub !== 'string') throw new Error('Invalid subject claim');
  if (!email || typeof email !== 'string')
    throw new Error('Invalid email claim');

  return {
    sub,
    email,
    iat: payload.iat!,
    exp: payload.exp!,
    iss: payload.iss!,
    aud: payload.aud as string,
    roles: Array.isArray(payload.roles) ? (payload.roles as string[]) : [],
  };
}

function toVerificationError(error: unknown): Error {
  if (error instanceof errors.JWTExpired) return new Error('Token expired');
  if (error instanceof errors.JWTClaimValidationFailed) {
    if (error.claim === 'iss') return new Error('Invalid issuer');
    if (error.claim === 'aud') return new Error('Invalid audience');
    return new Error(error.message);
  }
  if (error instanceof errors.JWSSignatureVerificationFailed)
    return new Error('Invalid signature');
  if (error instanceof errors.JWSInvalid) return new Error('Malformed token');
  if (error instanceof Error && error.message.startsWith('Invalid'))
    return error;
  return new Error('Malformed token');
}

@Injectable()
export class JwtTokenService {
  private static readonly ISSUER = 'portfolio-2025';
  private static readonly AUDIENCE = 'portfolio-2025-api';

  constructor(private readonly configService: ConfigService) {}

  private static readonly MIN_SECRET_LENGTH = 32;

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
    const match = EXPIRES_IN_PATTERN.exec(value.trim());

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

  private async verifyWithSecret(
    token: string,
    secret: Uint8Array,
  ): Promise<JwtPayload> {
    try {
      const { payload } = await jwtVerify(token, secret, {
        issuer: JwtTokenService.ISSUER,
        audience: JwtTokenService.AUDIENCE,
      });

      return toJwtPayload(payload);
    } catch (error) {
      throw toVerificationError(error);
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

  private getEncodedSecret(): Uint8Array {
    const secret = this.getValidatedSecret();
    return new TextEncoder().encode(secret);
  }

  private getPreviousSecret(): Uint8Array | null {
    const secret = this.configService.get<string>('JWT_SECRET_PREVIOUS');
    if (!secret || secret.length < JwtTokenService.MIN_SECRET_LENGTH)
      return null;
    return new TextEncoder().encode(secret);
  }

  private getKid(): string {
    return this.configService.get<string>('JWT_SECRET_PREVIOUS') ? 'v2' : 'v1';
  }
}
