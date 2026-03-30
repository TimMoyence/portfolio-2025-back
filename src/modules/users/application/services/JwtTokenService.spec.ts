import { ConfigService } from '@nestjs/config';
import { JwtTokenService } from './JwtTokenService';
import type { JwtPayload } from './JwtPayload';
import { createHmac } from 'crypto';

describe('JwtTokenService', () => {
  const JWT_SECRET = 'test-secret-key-for-unit-tests';
  let configService: jest.Mocked<ConfigService>;
  let service: JwtTokenService;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return JWT_SECRET;
        if (key === 'JWT_EXPIRES_IN') return '3600s';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new JwtTokenService(configService);
  });

  describe('sign', () => {
    it('devrait retourner un token avec 3 segments', () => {
      const result = service.sign({ sub: 'user-1', email: 'a@b.com' });
      expect(result.token.split('.')).toHaveLength(3);
      expect(result.expiresIn).toBe(3600);
    });
  });

  describe('verify', () => {
    it('devrait retourner le payload pour un token valide', () => {
      const { token } = service.sign({ sub: 'user-1', email: 'a@b.com' });

      const payload: JwtPayload = service.verify(token);

      expect(payload.sub).toBe('user-1');
      expect(payload.email).toBe('a@b.com');
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
      expect(payload.exp).toBeGreaterThan(payload.iat);
      expect(payload.iss).toBe('portfolio-2025');
      expect(payload.aud).toBe('portfolio-2025-api');
    });

    it('devrait lever une erreur pour un token expire', () => {
      // Creer un token manuellement avec une expiration passee
      const header = Buffer.from(
        JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
      ).toString('base64url');
      const payloadData = {
        sub: 'user-1',
        email: 'a@b.com',
        iss: 'portfolio-2025',
        aud: 'portfolio-2025-api',
        issuedAtTime: Math.floor(Date.now() / 1000) - 7200,
        expiresAt: Math.floor(Date.now() / 1000) - 3600,
      };
      const encodedPayload = Buffer.from(JSON.stringify(payloadData)).toString(
        'base64url',
      );
      const signature = createHmac('sha256', JWT_SECRET)
        .update(`${header}.${encodedPayload}`)
        .digest('base64url');
      const expiredToken = `${header}.${encodedPayload}.${signature}`;

      expect(() => service.verify(expiredToken)).toThrow('Token expired');
    });

    it('devrait lever une erreur pour une signature invalide', () => {
      const { token } = service.sign({ sub: 'user-1', email: 'a@b.com' });
      const parts = token.split('.');
      // Alterer la signature
      const tamperedToken = `${parts[0]}.${parts[1]}.invalidsignature`;

      expect(() => service.verify(tamperedToken)).toThrow('Invalid signature');
    });

    it('devrait lever une erreur pour un token malformed', () => {
      expect(() => service.verify('not-a-jwt')).toThrow('Malformed token');
      expect(() => service.verify('only.two')).toThrow('Malformed token');
      expect(() => service.verify('')).toThrow('Malformed token');
    });

    it('devrait lever une erreur pour un issuer invalide', () => {
      const header = Buffer.from(
        JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
      ).toString('base64url');
      const payloadData = {
        sub: 'user-1',
        email: 'a@b.com',
        iss: 'wrong-issuer',
        aud: 'portfolio-2025-api',
        issuedAtTime: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
      const encodedPayload = Buffer.from(JSON.stringify(payloadData)).toString(
        'base64url',
      );
      const signature = createHmac('sha256', JWT_SECRET)
        .update(`${header}.${encodedPayload}`)
        .digest('base64url');
      const token = `${header}.${encodedPayload}.${signature}`;

      expect(() => service.verify(token)).toThrow('Invalid issuer');
    });

    it('devrait lever une erreur pour une audience invalide', () => {
      const header = Buffer.from(
        JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
      ).toString('base64url');
      const payloadData = {
        sub: 'user-1',
        email: 'a@b.com',
        iss: 'portfolio-2025',
        aud: 'wrong-audience',
        issuedAtTime: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
      const encodedPayload = Buffer.from(JSON.stringify(payloadData)).toString(
        'base64url',
      );
      const signature = createHmac('sha256', JWT_SECRET)
        .update(`${header}.${encodedPayload}`)
        .digest('base64url');
      const token = `${header}.${encodedPayload}.${signature}`;

      expect(() => service.verify(token)).toThrow('Invalid audience');
    });
  });
});
