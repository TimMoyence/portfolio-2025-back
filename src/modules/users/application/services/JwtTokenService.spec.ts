import { ConfigService } from '@nestjs/config';
import { SignJWT, decodeProtectedHeader } from 'jose';
import { JwtTokenService } from './JwtTokenService';
import type { JwtPayload } from './JwtPayload';

describe('JwtTokenService', () => {
  const JWT_SECRET = 'test-secret-key-for-unit-tests-32';
  const JWT_SECRET_PREVIOUS = 'old-secret-key-for-rotation-test!';
  const CONFIG_COURANTE = { JWT_SECRET, JWT_EXPIRES_IN: '3600s' };
  const CONFIG_EN_ROTATION = { ...CONFIG_COURANTE, JWT_SECRET_PREVIOUS };
  let configService: jest.Mocked<ConfigService>;
  let service: JwtTokenService;

  const encodeSecret = (secret = JWT_SECRET): Uint8Array =>
    new TextEncoder().encode(secret);

  const configurer = (variables: Readonly<Record<string, string>>): void => {
    configService.get.mockImplementation((key: string) => variables[key]);
  };

  const signer = () => service.sign({ sub: 'user-1', email: 'a@b.com' });

  const signRawToken = (
    secret: Uint8Array,
    options: {
      issuer?: string;
      audience?: string;
      kid?: string;
      emisA?: number;
    } = {},
  ): Promise<string> => {
    const jeton = new SignJWT({ sub: 'user-1', email: 'a@b.com', roles: [] })
      .setProtectedHeader({ alg: 'HS256', kid: options.kid })
      .setIssuer(options.issuer ?? 'portfolio-2025')
      .setAudience(options.audience ?? 'portfolio-2025-api');
    return (
      options.emisA === undefined
        ? jeton.setIssuedAt().setExpirationTime('1h')
        : jeton
            .setIssuedAt(options.emisA)
            .setExpirationTime(options.emisA + 3600)
    ).sign(secret);
  };

  beforeEach(() => {
    configService = { get: jest.fn() } as unknown as jest.Mocked<ConfigService>;
    configurer(CONFIG_COURANTE);
    service = new JwtTokenService(configService);
  });

  describe('sign', () => {
    it('devrait retourner un token avec 3 segments', async () => {
      const result = await signer();
      expect(result.token.split('.')).toHaveLength(3);
      expect(result.expiresIn).toBe(3600);
    });

    it('devrait rejeter un secret trop court', async () => {
      configurer({ JWT_SECRET: 'short' });

      await expect(signer()).rejects.toThrow(
        'JWT_SECRET must be at least 32 characters',
      );
    });
  });

  describe('verify', () => {
    it('devrait retourner le payload pour un token valide', async () => {
      const { token } = await signer();

      const payload: JwtPayload = await service.verify(token);

      expect(payload).toEqual(
        expect.objectContaining({
          sub: 'user-1',
          email: 'a@b.com',
          iss: 'portfolio-2025',
          aud: 'portfolio-2025-api',
        }),
      );
      expect(payload.exp).toBeGreaterThan(payload.iat);
    });

    it('devrait lever une erreur pour un token expire', async () => {
      const expiredToken = await signRawToken(encodeSecret(), {
        emisA: Math.floor(Date.now() / 1000) - 7200,
      });

      await expect(service.verify(expiredToken)).rejects.toThrow(
        'Token expired',
      );
    });

    it('devrait lever une erreur pour une signature invalide', async () => {
      const [entete, charge] = (await signer()).token.split('.');

      await expect(
        service.verify(`${entete}.${charge}.invalidsignature`),
      ).rejects.toThrow('Invalid signature');
    });

    it.each(['not-a-jwt', 'only.two', ''])(
      'devrait lever une erreur pour le token malformed "%s"',
      async (jeton) => {
        await expect(service.verify(jeton)).rejects.toThrow('Malformed token');
      },
    );

    it.each([
      ['issuer', { issuer: 'wrong-issuer' }, 'Invalid issuer'],
      ['audience', { audience: 'wrong-audience' }, 'Invalid audience'],
    ])(
      'devrait lever une erreur pour une %s invalide',
      async (_label, options, erreur) => {
        const token = await signRawToken(encodeSecret(), options);

        await expect(service.verify(token)).rejects.toThrow(erreur);
      },
    );
  });

  describe('rotation de cles (kid)', () => {
    it('devrait inclure kid v1 dans le header JWT sans secret precedent', async () => {
      const header = decodeProtectedHeader((await signer()).token);

      expect(header.kid).toBe('v1');
      expect(header.alg).toBe('HS256');
    });

    it('devrait inclure kid v2 dans le header JWT avec secret precedent', async () => {
      configurer(CONFIG_EN_ROTATION);

      const header = decodeProtectedHeader((await signer()).token);

      expect(header.kid).toBe('v2');
    });

    it('devrait verifier un token signe avec la cle precedente quand JWT_SECRET_PREVIOUS est configure', async () => {
      const token = await signRawToken(encodeSecret(JWT_SECRET_PREVIOUS), {
        kid: 'v1',
      });
      configurer(CONFIG_EN_ROTATION);

      const payload: JwtPayload = await service.verify(token);

      expect(payload.sub).toBe('user-1');
      expect(payload.email).toBe('a@b.com');
    });

    it('devrait rejeter un token signe avec une cle inconnue', async () => {
      const token = await signRawToken(
        encodeSecret('unknown-secret-that-is-long-enough!'),
        { kid: 'v0' },
      );

      await expect(service.verify(token)).rejects.toThrow('Invalid signature');

      configurer(CONFIG_EN_ROTATION);

      await expect(service.verify(token)).rejects.toThrow('Invalid signature');
    });
  });
});
