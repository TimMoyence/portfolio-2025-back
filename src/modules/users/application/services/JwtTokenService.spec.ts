import { ConfigService } from '@nestjs/config';
import { SignJWT, decodeProtectedHeader } from 'jose';
import { JwtTokenService } from './JwtTokenService';
import type { JwtPayload } from './JwtPayload';

describe('JwtTokenService', () => {
  const JWT_SECRET = 'test-secret-key-for-unit-tests-32';
  const JWT_SECRET_PREVIOUS = 'old-secret-key-for-rotation-test!';
  let configService: jest.Mocked<ConfigService>;
  let service: JwtTokenService;

  /** Encode le secret en Uint8Array pour la creation de tokens de test avec jose. */
  const encodeSecret = (secret = JWT_SECRET): Uint8Array =>
    new TextEncoder().encode(secret);

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
    it('devrait retourner un token avec 3 segments', async () => {
      const result = await service.sign({ sub: 'user-1', email: 'a@b.com' });
      expect(result.token.split('.')).toHaveLength(3);
      expect(result.expiresIn).toBe(3600);
    });

    it('devrait rejeter un secret trop court', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'short';
        return undefined;
      });

      await expect(
        service.sign({ sub: 'u', email: 'a@b.com' }),
      ).rejects.toThrow('JWT_SECRET must be at least 32 characters');
    });
  });

  describe('verify', () => {
    it('devrait retourner le payload pour un token valide', async () => {
      const { token } = await service.sign({
        sub: 'user-1',
        email: 'a@b.com',
      });

      const payload: JwtPayload = await service.verify(token);

      expect(payload.sub).toBe('user-1');
      expect(payload.email).toBe('a@b.com');
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
      expect(payload.exp).toBeGreaterThan(payload.iat);
      expect(payload.iss).toBe('portfolio-2025');
      expect(payload.aud).toBe('portfolio-2025-api');
    });

    it('devrait lever une erreur pour un token expire', async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 7200;
      const secret = encodeSecret();

      const expiredToken = await new SignJWT({
        sub: 'user-1',
        email: 'a@b.com',
        roles: [],
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(pastTime)
        .setExpirationTime(pastTime + 3600) // expire il y a 1h
        .setIssuer('portfolio-2025')
        .setAudience('portfolio-2025-api')
        .sign(secret);

      await expect(service.verify(expiredToken)).rejects.toThrow(
        'Token expired',
      );
    });

    it('devrait lever une erreur pour une signature invalide', async () => {
      const { token } = await service.sign({
        sub: 'user-1',
        email: 'a@b.com',
      });
      const parts = token.split('.');
      // Alterer la signature
      const tamperedToken = `${parts[0]}.${parts[1]}.invalidsignature`;

      await expect(service.verify(tamperedToken)).rejects.toThrow(
        'Invalid signature',
      );
    });

    it('devrait lever une erreur pour un token malformed', async () => {
      await expect(service.verify('not-a-jwt')).rejects.toThrow(
        'Malformed token',
      );
      await expect(service.verify('only.two')).rejects.toThrow(
        'Malformed token',
      );
      await expect(service.verify('')).rejects.toThrow('Malformed token');
    });

    it('devrait lever une erreur pour un issuer invalide', async () => {
      const secret = encodeSecret();

      const token = await new SignJWT({
        sub: 'user-1',
        email: 'a@b.com',
        roles: [],
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .setIssuer('wrong-issuer')
        .setAudience('portfolio-2025-api')
        .sign(secret);

      await expect(service.verify(token)).rejects.toThrow('Invalid issuer');
    });

    it('devrait lever une erreur pour une audience invalide', async () => {
      const secret = encodeSecret();

      const token = await new SignJWT({
        sub: 'user-1',
        email: 'a@b.com',
        roles: [],
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .setIssuer('portfolio-2025')
        .setAudience('wrong-audience')
        .sign(secret);

      await expect(service.verify(token)).rejects.toThrow('Invalid audience');
    });
  });

  describe('rotation de cles (kid)', () => {
    it('devrait inclure kid v1 dans le header JWT sans secret precedent', async () => {
      const { token } = await service.sign({
        sub: 'user-1',
        email: 'a@b.com',
      });

      const header = decodeProtectedHeader(token);
      expect(header.kid).toBe('v1');
      expect(header.alg).toBe('HS256');
    });

    it('devrait inclure kid v2 dans le header JWT avec secret precedent', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return JWT_SECRET;
        if (key === 'JWT_EXPIRES_IN') return '3600s';
        if (key === 'JWT_SECRET_PREVIOUS') return JWT_SECRET_PREVIOUS;
        return undefined;
      });

      const { token } = await service.sign({
        sub: 'user-1',
        email: 'a@b.com',
      });

      const header = decodeProtectedHeader(token);
      expect(header.kid).toBe('v2');
    });

    it('devrait verifier un token signe avec la cle courante', async () => {
      const { token } = await service.sign({
        sub: 'user-1',
        email: 'a@b.com',
      });

      const payload: JwtPayload = await service.verify(token);
      expect(payload.sub).toBe('user-1');
      expect(payload.email).toBe('a@b.com');
    });

    it('devrait verifier un token signe avec la cle precedente quand JWT_SECRET_PREVIOUS est configure', async () => {
      // Signer un token avec l'ancien secret
      const oldSecret = encodeSecret(JWT_SECRET_PREVIOUS);
      const token = await new SignJWT({
        sub: 'user-1',
        email: 'a@b.com',
        roles: [],
      })
        .setProtectedHeader({ alg: 'HS256', kid: 'v1' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .setIssuer('portfolio-2025')
        .setAudience('portfolio-2025-api')
        .sign(oldSecret);

      // Configurer le service avec le nouveau secret + ancien secret
      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return JWT_SECRET;
        if (key === 'JWT_EXPIRES_IN') return '3600s';
        if (key === 'JWT_SECRET_PREVIOUS') return JWT_SECRET_PREVIOUS;
        return undefined;
      });

      const payload: JwtPayload = await service.verify(token);
      expect(payload.sub).toBe('user-1');
      expect(payload.email).toBe('a@b.com');
    });

    it('devrait rejeter un token signe avec une cle inconnue', async () => {
      const unknownSecret = encodeSecret('unknown-secret-that-is-long-enough!');
      const token = await new SignJWT({
        sub: 'user-1',
        email: 'a@b.com',
        roles: [],
      })
        .setProtectedHeader({ alg: 'HS256', kid: 'v0' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .setIssuer('portfolio-2025')
        .setAudience('portfolio-2025-api')
        .sign(unknownSecret);

      // Sans JWT_SECRET_PREVIOUS configure
      await expect(service.verify(token)).rejects.toThrow('Invalid signature');

      // Avec JWT_SECRET_PREVIOUS configure (mais aucun ne correspond)
      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return JWT_SECRET;
        if (key === 'JWT_EXPIRES_IN') return '3600s';
        if (key === 'JWT_SECRET_PREVIOUS') return JWT_SECRET_PREVIOUS;
        return undefined;
      });

      await expect(service.verify(token)).rejects.toThrow('Invalid signature');
    });
  });
});
