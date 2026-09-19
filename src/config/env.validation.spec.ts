import {
  buildValidEnv,
  TEST_JWT_SECRET,
} from '../../test/factories/env.factory';
import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('devrait valider un environnement avec toutes les variables critiques', () => {
    const env = buildValidEnv();
    const result = validateEnv(env);

    expect(result).toBeDefined();
    expect(result.DB_HOST).toBe('127.0.0.1');
    expect(result.DB_PORT).toBe(5432);
    expect(result.DB_NAME).toBe('portfolio_test');
    expect(result.JWT_SECRET).toBe(TEST_JWT_SECRET);
  });

  it('devrait appliquer les valeurs par defaut pour les variables optionnelles', () => {
    const env = buildValidEnv();
    const result = validateEnv(env);

    expect(result.NODE_ENV).toBe('development');
    expect(result.PORT).toBe(3000);
    expect(result.API_PREFIX).toBe('api/v1/portfolio25');
    expect(result.REDIS_HOST).toBe('127.0.0.1');
    expect(result.REDIS_PORT).toBe(6379);
    expect(result.SMTP_PORT).toBe(587);
  });

  it('devrait exiger une configuration HMAC complete en production', () => {
    const env = buildValidEnv({ NODE_ENV: 'production' });

    expect(() => validateEnv(env)).toThrow('MORNING_BRIEF_HMAC');
  });

  it('devrait accepter un trousseau HMAC en production', () => {
    const env = buildValidEnv({
      NODE_ENV: 'production',
      MORNING_BRIEF_HMAC_KEYS: 'morning-brief:key-from-secret-manager',
    });

    expect(() => validateEnv(env)).not.toThrow();
  });

  describe('coherence SMTP', () => {
    const SMTP_CONFIGURED = {
      SMTP_HOST: 'smtp.example.org',
      SMTP_USER: 'mailer',
      SMTP_PASS: 'test-smtp-password', // gitleaks:allow (ci.yml)
    };

    it('devrait lancer une erreur si SMTP est configure sans SMTP_FROM', () => {
      const env = buildValidEnv(SMTP_CONFIGURED);

      expect(() => validateEnv(env)).toThrow('SMTP_FROM');
    });

    it('devrait accepter un SMTP configure avec SMTP_FROM', () => {
      const env = buildValidEnv({
        ...SMTP_CONFIGURED,
        SMTP_FROM: 'contact@asilidesign.fr',
      });

      expect(() => validateEnv(env)).not.toThrow();
    });

    it('devrait accepter l’absence de SMTP_FROM quand SMTP n’est pas configure', () => {
      const env = buildValidEnv();

      expect(() => validateEnv(env)).not.toThrow();
    });

    it('devrait accepter la forme « display name + adresse » de production', () => {
      // Valeur reellement deployee. `z.email()` la rejetterait et
      // empecherait l'API de demarrer : la validation doit accepter les
      // deux formes RFC 5322.
      const env = buildValidEnv({
        ...SMTP_CONFIGURED,
        SMTP_FROM: "'Asili Design' <no-reply@asilidesign.fr>",
      });

      expect(() => validateEnv(env)).not.toThrow();
    });

    it.each([
      ['une valeur blanche', '   '],
      ['une valeur sans arobase', 'poubelle'],
      ['des chevrons sans adresse valide', 'Asili <pas-une-adresse>'],
    ])('devrait rejeter %s dans SMTP_FROM', (_label, value) => {
      const env = buildValidEnv({ ...SMTP_CONFIGURED, SMTP_FROM: value });

      expect(() => validateEnv(env)).toThrow('SMTP_FROM');
    });

    it('devrait rejeter un SMTP_REPLY_TO malforme', () => {
      const env = buildValidEnv({
        ...SMTP_CONFIGURED,
        SMTP_FROM: 'contact@asilidesign.fr',
        SMTP_REPLY_TO: 'pas-une-adresse',
      });

      expect(() => validateEnv(env)).toThrow('SMTP_REPLY_TO');
    });
  });

  it('devrait lancer une erreur si DB_HOST est manquant (aucun alias)', () => {
    const env = buildValidEnv({ DB_HOST: undefined });

    expect(() => validateEnv(env)).toThrow('DB_HOST');
  });

  it('devrait lancer une erreur si JWT_SECRET est manquant', () => {
    const env = buildValidEnv({ JWT_SECRET: undefined });

    expect(() => validateEnv(env)).toThrow('JWT_SECRET');
  });

  it('devrait lancer une erreur si SECURE_KEY_FOR_PASSWORD_HASHING est manquant', () => {
    const env = buildValidEnv({ SECURE_KEY_FOR_PASSWORD_HASHING: undefined });

    expect(() => validateEnv(env)).toThrow('SECURE_KEY_FOR_PASSWORD_HASHING');
  });

  it('devrait rejeter un JWT_SECRET de moins de 32 caracteres', () => {
    const env = buildValidEnv({ JWT_SECRET: 'trop-court' });

    expect(() => validateEnv(env)).toThrow('JWT_SECRET');
    expect(() => validateEnv(env)).toThrow('32');
  });

  it('devrait rejeter un SECURE_KEY_FOR_PASSWORD_HASHING de moins de 32 caracteres', () => {
    const env = buildValidEnv({
      SECURE_KEY_FOR_PASSWORD_HASHING: 'trop-court',
    });

    expect(() => validateEnv(env)).toThrow('SECURE_KEY_FOR_PASSWORD_HASHING');
    expect(() => validateEnv(env)).toThrow('32');
  });

  it('devrait lancer une erreur si FORMATION_REVIEW_TOKEN_SECRET est manquant', () => {
    const env = buildValidEnv({ FORMATION_REVIEW_TOKEN_SECRET: undefined });

    expect(() => validateEnv(env)).toThrow('FORMATION_REVIEW_TOKEN_SECRET');
  });

  it('devrait rejeter un FORMATION_REVIEW_TOKEN_SECRET de moins de 32 caracteres', () => {
    const env = buildValidEnv({ FORMATION_REVIEW_TOKEN_SECRET: 'trop-court' });

    expect(() => validateEnv(env)).toThrow('FORMATION_REVIEW_TOKEN_SECRET');
    expect(() => validateEnv(env)).toThrow('32');
  });

  it('devrait lancer une erreur si FORMATION_TEACHER_NOTIFICATION_TO est manquant', () => {
    const env = buildValidEnv({ FORMATION_TEACHER_NOTIFICATION_TO: undefined });

    expect(() => validateEnv(env)).toThrow('FORMATION_TEACHER_NOTIFICATION_TO');
  });

  it('devrait rejeter un FORMATION_TEACHER_NOTIFICATION_TO qui n est pas une adresse email', () => {
    const env = buildValidEnv({
      FORMATION_TEACHER_NOTIFICATION_TO: 'pas-une-adresse',
    });

    expect(() => validateEnv(env)).toThrow('FORMATION_TEACHER_NOTIFICATION_TO');
  });

  it('devrait lancer une erreur si GOOGLE_CLIENT_ID est manquant', () => {
    const env = buildValidEnv({ GOOGLE_CLIENT_ID: undefined });

    expect(() => validateEnv(env)).toThrow('GOOGLE_CLIENT_ID');
  });

  it('devrait lancer une erreur si DB_NAME est manquant (aucun alias)', () => {
    const env = buildValidEnv({ DB_NAME: undefined });

    expect(() => validateEnv(env)).toThrow('DB_NAME');
  });

  it('devrait resoudre DATABASE_HOST comme alias de DB_HOST', () => {
    const env = buildValidEnv({
      DB_HOST: undefined,
      DATABASE_HOST: 'db.example.com',
    });
    const result = validateEnv(env);

    expect(result.DB_HOST).toBe('db.example.com');
  });

  it('devrait resoudre PGHOST comme alias de DB_HOST', () => {
    const env = buildValidEnv({ DB_HOST: undefined, PGHOST: 'pg.example.com' });
    const result = validateEnv(env);

    expect(result.DB_HOST).toBe('pg.example.com');
  });

  it('devrait resoudre DATABASE_NAME comme alias de DB_NAME', () => {
    const env = buildValidEnv({
      DB_NAME: undefined,
      DATABASE_NAME: 'other_db',
    });
    const result = validateEnv(env);

    expect(result.DB_NAME).toBe('other_db');
  });

  it('devrait resoudre POSTGRES_DB comme alias de DB_NAME', () => {
    const env = buildValidEnv({ DB_NAME: undefined, POSTGRES_DB: 'pg_db' });
    const result = validateEnv(env);

    expect(result.DB_NAME).toBe('pg_db');
  });

  it('devrait extraire DB_NAME depuis DATABASE_URL si aucun alias direct', () => {
    const env = buildValidEnv({
      DB_NAME: undefined,
      DATABASE_URL: 'postgresql://user:pass@host:5432/my_database',
    });
    const result = validateEnv(env);

    expect(result.DB_NAME).toBe('my_database');
  });

  it('devrait resoudre DATABASE_PORT comme alias de DB_PORT', () => {
    const env = buildValidEnv({ DB_PORT: undefined, DATABASE_PORT: '5433' });
    const result = validateEnv(env);

    expect(result.DB_PORT).toBe(5433);
  });

  it('devrait privilegier DB_HOST sur DATABASE_HOST', () => {
    const env = buildValidEnv({
      DB_HOST: 'primary.host',
      DATABASE_HOST: 'secondary.host',
    });
    const result = validateEnv(env);

    expect(result.DB_HOST).toBe('primary.host');
  });

  it('devrait coercer DB_PORT en number', () => {
    const env = buildValidEnv({ DB_PORT: '5433' });
    const result = validateEnv(env);

    expect(result.DB_PORT).toBe(5433);
  });

  it('devrait coercer PORT en number', () => {
    const env = buildValidEnv({ PORT: '8080' });
    const result = validateEnv(env);

    expect(result.PORT).toBe(8080);
  });

  it('devrait accepter METRICS_TOKEN comme variable optionnelle', () => {
    const env = buildValidEnv({ METRICS_TOKEN: 'my-prom-token' });
    const result = validateEnv(env);

    expect(result.METRICS_TOKEN).toBe('my-prom-token');
  });

  it('devrait lister toutes les erreurs quand plusieurs variables critiques manquent', () => {
    const env = {};

    expect(() => validateEnv(env)).toThrow('[ENV VALIDATION]');
    expect(() => validateEnv(env)).toThrow('JWT_SECRET');
    expect(() => validateEnv(env)).toThrow('SECURE_KEY_FOR_PASSWORD_HASHING');
  });
});
