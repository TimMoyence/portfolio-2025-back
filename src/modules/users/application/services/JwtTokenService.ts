import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

interface SignedToken {
  token: string;
  expiresIn: number;
  expiresAt: number;
}

@Injectable()
export class JwtTokenService {
  constructor(private readonly configService: ConfigService) {}

  sign(payload: Record<string, unknown>): SignedToken {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const expiresInValue =
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '3600s';
    const expiresIn = this.parseExpiresIn(expiresInValue);
    const issuedAtTime = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAtTime + expiresIn;

    const tokenPayload = { ...payload, issuedAtTime, expiresAt };
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

  private createSignature(data: string, secret: string): string {
    return createHmac('sha256', secret).update(data).digest('base64url');
  }
}
