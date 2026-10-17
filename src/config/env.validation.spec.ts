import {
  buildProductionEnv,
  buildValidEnv,
  TEST_JWT_SECRET,
  TEST_MORNING_BRIEF_HMAC_KEYS,
} from '../../test/factories/env.factory';
import { DEFAULT_SMTP_ENV } from '../../test/factories/mailer.factory';
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
    expect(result.REDIS_PORT).toBe(6379);
    expect(result.SMTP_PORT).toBe(587);
  });

  describe('ports, juges par la regle de envPort', () => {
    const PORTS_REFUSES = ['3000.0', '+3000', '5.87e2', '0x18EB', '0', '65536'];

    it.each(
      ['PORT', 'DB_PORT', 'REDIS_PORT', 'SMTP_PORT'].flatMap((variable) =>
        PORTS_REFUSES.map((port) => [variable, port]),
      ),
    )('refuse %s = %p', (variable, port) => {
      expect(() => validateEnv(buildValidEnv({ [variable]: port }))).toThrow(
        new RegExp(String.raw`\b${variable}\b`),
      );
    });

    it('lit un port entoure de blancs et rend ses bornes', () => {
      const result = validateEnv(
        buildValidEnv({ PORT: ' 8080 ', REDIS_PORT: '1', SMTP_PORT: '65535' }),
      );

      expect([result.PORT, result.REDIS_PORT, result.SMTP_PORT]).toEqual([
        8080, 1, 65535,
      ]);
    });

    it('prend un port blanc pour absent et lui donne sa valeur par defaut', () => {
      const result = validateEnv(
        buildValidEnv({ PORT: ' ', REDIS_PORT: '', SMTP_PORT: '  ' }),
      );

      expect([result.PORT, result.REDIS_PORT, result.SMTP_PORT]).toEqual([
        3000, 6379, 587,
      ]);
    });
  });

  it('ne reintroduit aucun hote Redis quand REDIS_URL et REDIS_HOST sont absents', () => {
    const result = validateEnv(buildValidEnv());

    expect(result.REDIS_URL).toBeUndefined();
    expect(result.REDIS_HOST).toBeUndefined();
  });

  it('garde l hote Redis renseigne et lui donne le port 6379 par defaut', () => {
    const result = validateEnv(buildValidEnv({ REDIS_HOST: 'redis' }));

    expect(result.REDIS_HOST).toBe('redis');
    expect(result.REDIS_PORT).toBe(6379);
  });

  it('devrait exiger une configuration HMAC complete en production', () => {
    const env = buildValidEnv({ NODE_ENV: 'production' });

    expect(() => validateEnv(env)).toThrow('MORNING_BRIEF_HMAC');
  });

  it('devrait accepter un trousseau HMAC en production', () => {
    const env = buildProductionEnv({
      MORNING_BRIEF_HMAC_KEYS: TEST_MORNING_BRIEF_HMAC_KEYS,
    });

    expect(() => validateEnv(env)).not.toThrow();
  });

  describe('coherence SMTP', () => {
    const SMTP_CONFIGURED = { ...DEFAULT_SMTP_ENV, SMTP_FROM: undefined };

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
      // Valeur reellement deployee : la refuser empecherait l'API de
      // demarrer, la validation doit accepter les deux formes RFC 5322.
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
      ['une adresse que la regle commune refuse', 'contact@asilidesign-.fr'],
      [
        'des chevrons autour d une adresse que la regle commune refuse',
        'Asili <contact@asilidesign-.fr>',
      ],
      [
        'une adresse coupee par une espace ideographique',
        `Asili <contact${String.fromCodePoint(0x3000)}tim@asilidesign.fr>`,
      ],
    ])('devrait rejeter %s dans SMTP_FROM', (_label, value) => {
      const env = buildValidEnv({ ...SMTP_CONFIGURED, SMTP_FROM: value });

      expect(() => validateEnv(env)).toThrow('SMTP_FROM');
    });

    it.each(['jean&co@asilidesign.fr', 'Asili <jean&co@asilidesign.fr>'])(
      'devrait accepter %p dans SMTP_FROM, comme la regle commune',
      (value) => {
        const env = buildValidEnv({ ...SMTP_CONFIGURED, SMTP_FROM: value });

        expect(() => validateEnv(env)).not.toThrow();
      },
    );

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

  describe('longueur des secrets, jugee hors blancs comme a la signature', () => {
    const ENTOURE_DE_BLANCS = `${' '.repeat(8)}${'s'.repeat(31)}${' '.repeat(8)}`;
    const SECRET_DE_32 = 's'.repeat(32);
    const AUTRE_SECRET_DE_32 = 't'.repeat(32);

    it.each<[string, Record<string, unknown>]>([
      ['JWT_SECRET', { JWT_SECRET: ENTOURE_DE_BLANCS }],
      [
        'SECURE_KEY_FOR_PASSWORD_HASHING',
        { SECURE_KEY_FOR_PASSWORD_HASHING: ENTOURE_DE_BLANCS },
      ],
      [
        'FORMATION_REVIEW_TOKEN_SECRET',
        { FORMATION_REVIEW_TOKEN_SECRET: ENTOURE_DE_BLANCS },
      ],
      [
        'FORMATIONS_PULSE_SECRET',
        { FORMATIONS_PULSE_SECRET: ENTOURE_DE_BLANCS },
      ],
      ['JWT_SECRET_PREVIOUS', { JWT_SECRET_PREVIOUS: ENTOURE_DE_BLANCS }],
      [
        'MORNING_BRIEF_HMAC_SECRET',
        {
          MORNING_BRIEF_HMAC_KEY_ID: 'morning-brief',
          MORNING_BRIEF_HMAC_SECRET: ENTOURE_DE_BLANCS,
        },
      ],
      [
        'MORNING_BRIEF_HMAC_KEYS',
        {
          MORNING_BRIEF_HMAC_KEYS: `ancienne:${SECRET_DE_32},courte:${ENTOURE_DE_BLANCS}`,
        },
      ],
    ])(
      'refuse %s de 31 caracteres entoure de blancs',
      (variable, surcharge) => {
        expect(() => validateEnv(buildValidEnv(surcharge))).toThrow(
          `${variable}: `,
        );
      },
    );

    it('accepte des secrets facultatifs de 32 caracteres', () => {
      expect(() =>
        validateEnv(
          buildValidEnv({
            JWT_SECRET_PREVIOUS: SECRET_DE_32,
            MORNING_BRIEF_HMAC_KEYS: `ancienne:${AUTRE_SECRET_DE_32}`,
          }),
        ),
      ).not.toThrow();
    });

    it('accepte un secret facultatif laisse vide, comme dans .env.example', () => {
      expect(() =>
        validateEnv(
          buildValidEnv({
            JWT_SECRET_PREVIOUS: '',
            MORNING_BRIEF_HMAC_KEYS: '',
          }),
        ),
      ).not.toThrow();
    });
  });

  it('devrait rejeter la reutilisation d’un secret cryptographique entre usages', () => {
    const env = buildValidEnv({
      FORMATIONS_PULSE_SECRET: TEST_JWT_SECRET,
    });

    expect(() => validateEnv(env)).toThrow('FORMATIONS_PULSE_SECRET');
  });

  describe('secrets distincts entre usages, trousseau HMAC et JWT precedent compris', () => {
    const PARTAGE = 'p'.repeat(40);

    it.each<[string, Record<string, unknown>, string]>([
      [
        'une cle du trousseau HMAC qui reprend JWT_SECRET',
        { MORNING_BRIEF_HMAC_KEYS: `mb:${TEST_JWT_SECRET}` },
        'MORNING_BRIEF_HMAC_KEYS: doit etre distinct de JWT_SECRET',
      ],
      [
        'JWT_SECRET_PREVIOUS repris par le hachage des mots de passe',
        {
          JWT_SECRET_PREVIOUS: PARTAGE,
          SECURE_KEY_FOR_PASSWORD_HASHING: PARTAGE,
        },
        'SECURE_KEY_FOR_PASSWORD_HASHING: doit etre distinct de JWT_SECRET_PREVIOUS',
      ],
      [
        'le secret HMAC du couple qui reprend FORMATIONS_PULSE_SECRET',
        {
          FORMATIONS_PULSE_SECRET: PARTAGE,
          MORNING_BRIEF_HMAC_KEY_ID: 'mb',
          MORNING_BRIEF_HMAC_SECRET: PARTAGE,
        },
        'MORNING_BRIEF_HMAC_SECRET: doit etre distinct de FORMATIONS_PULSE_SECRET',
      ],
      [
        'la seconde cle du trousseau HMAC qui reprend JWT_SECRET',
        {
          MORNING_BRIEF_HMAC_KEYS: `nouvelle:${PARTAGE},ancienne:${TEST_JWT_SECRET}`,
        },
        'MORNING_BRIEF_HMAC_KEYS: doit etre distinct de JWT_SECRET',
      ],
      [
        'un secret qui ne differe d un autre que par ses blancs',
        { FORMATIONS_PULSE_SECRET: ` ${TEST_JWT_SECRET} ` },
        'FORMATIONS_PULSE_SECRET: doit etre distinct de JWT_SECRET',
      ],
    ])('refuse %s', (_cas, surcharge, message) => {
      expect(() => validateEnv(buildValidEnv(surcharge))).toThrow(message);
    });

    it('accepte un meme secret porte par le couple et le trousseau HMAC, un seul usage', () => {
      expect(() =>
        validateEnv(
          buildValidEnv({
            MORNING_BRIEF_HMAC_KEYS: `mb:${PARTAGE}`,
            MORNING_BRIEF_HMAC_KEY_ID: 'mb',
            MORNING_BRIEF_HMAC_SECRET: PARTAGE,
          }),
        ),
      ).not.toThrow();
    });
  });

  describe('base de DATABASE_URL, lue comme pg la lit', () => {
    it.each([
      ['postgres://u:p@h:5432/donn%C3%A9es_2025', 'données_2025'],
      ['postgresql://u:p@h:5432/données_2025', 'données_2025'],
      ['postgres://u:p@h:5432/ma%20base', 'ma base'],
    ])('nomme DB_NAME la base decodee de %s', (url, base) => {
      expect(
        validateEnv(buildValidEnv({ DB_NAME: undefined, DATABASE_URL: url }))
          .DB_NAME,
      ).toBe(base);
    });

    it.each([
      [
        'un socket, dont pg lit la base dans ?db=',
        'socket:/var/run/postgresql?db=portfolio',
      ],
      ['un autre schema que postgres', 'mysql://u:p@h:3306/portfolio'],
      [
        'une URL sans base, ou pg ouvrirait celle de l utilisateur',
        'postgres://u:p@h:5432',
      ],
      ['un chemin mal encode', 'postgres://u:p@h:5432/%E0%A4%A'],
      [
        'une URL sans hote, que l amorcage de la base ne sait pas lire',
        'postgres://u:p@/portfolio',
      ],
    ])('refuse %s', (_cas, url) => {
      expect(() =>
        validateEnv(buildValidEnv({ DB_NAME: undefined, DATABASE_URL: url })),
      ).toThrow(
        'DATABASE_URL: doit etre une URL postgres:// ou postgresql:// qui nomme son hote et sa base',
      );
    });

    it('refuse en production une DATABASE_URL qui nomme une autre base que POSTGRES_DB, que db-backup sauvegarde', () => {
      expect(() =>
        validateEnv(
          buildProductionEnv({
            DATABASE_URL: 'postgres://u:p@db:5432/portfolio_prod',
          }),
        ),
      ).toThrow(
        'DATABASE_URL: doit nommer la base POSTGRES_DB, la seule que db-backup sauvegarde',
      );
    });

    it.each([
      [
        'un DB_NAME qui nomme une autre base, comme le gabarit de 32bde264',
        { DB_NAME: 'portfolio_prod' },
        'DB_NAME: doit nommer la base POSTGRES_DB, la seule que db-backup sauvegarde',
      ],
      [
        'un DATABASE_NAME qui nomme une autre base',
        { DATABASE_NAME: 'portfolio_prod' },
        'DB_NAME: doit nommer la base POSTGRES_DB, la seule que db-backup sauvegarde',
      ],
      [
        'un DB_HOST qui designe un autre hote que le service db',
        { DB_HOST: 'pg.exemple.net' },
        'DB_HOST: doit designer le service db, le seul que db-backup sauvegarde',
      ],
      [
        'une DATABASE_URL qui designe un autre hote que le service db',
        { DATABASE_URL: 'postgres://u:p@pg.exemple.net:5432/portfolio' },
        'DATABASE_URL: doit designer le service db, le seul que db-backup sauvegarde',
      ],
      [
        'une env sans POSTGRES_DB, la base que le deploiement sauvegarde avant migrate',
        { POSTGRES_DB: undefined, DB_NAME: 'portfolio' },
        'POSTGRES_DB: est requise en production, c est la base que le deploiement sauvegarde avant migrate',
      ],
      [
        'une POSTGRES_DB blanche',
        { POSTGRES_DB: '  ', DB_NAME: 'portfolio' },
        'POSTGRES_DB: est requise en production, c est la base que le deploiement sauvegarde avant migrate',
      ],
      [
        'un autre hote que le service db, meme sans POSTGRES_DB',
        {
          POSTGRES_DB: undefined,
          DB_NAME: 'portfolio_prod',
          DB_HOST: 'pg.exemple.net',
        },
        'DB_HOST: doit designer le service db, le seul que db-backup sauvegarde',
      ],
    ])('refuse en production %s', (_cas, surcharge, message) => {
      expect(() => validateEnv(buildProductionEnv(surcharge))).toThrow(message);
    });

    it('ouvre en production POSTGRES_DB sur le service db, un DB_DATABASE etant alors ignore', () => {
      const env = validateEnv(
        buildProductionEnv({ DB_DATABASE: 'portfolio_prod' }),
      );

      expect([env.DB_HOST, env.DB_NAME]).toEqual(['db', 'portfolio']);
    });

    it('accepte en production une DATABASE_URL qui nomme POSTGRES_DB', () => {
      expect(
        validateEnv(
          buildProductionEnv({
            DATABASE_URL: 'postgres://u:p@db:5432/portfolio',
          }),
        ).DB_NAME,
      ).toBe('portfolio');
    });
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

  it.each([
    [
      'devrait resoudre DATABASE_HOST comme alias de DB_HOST',
      { DB_HOST: undefined, DATABASE_HOST: 'db.example.com' },
      'DB_HOST',
      'db.example.com',
    ],
    [
      'devrait resoudre PGHOST comme alias de DB_HOST',
      { DB_HOST: undefined, PGHOST: 'pg.example.com' },
      'DB_HOST',
      'pg.example.com',
    ],
    [
      'devrait resoudre DATABASE_NAME comme alias de DB_NAME',
      { DB_NAME: undefined, DATABASE_NAME: 'other_db' },
      'DB_NAME',
      'other_db',
    ],
    [
      'devrait resoudre POSTGRES_DB comme alias de DB_NAME',
      { DB_NAME: undefined, POSTGRES_DB: 'pg_db' },
      'DB_NAME',
      'pg_db',
    ],
    [
      'devrait resoudre DB_DATABASE comme les migrations',
      { DB_NAME: undefined, DB_DATABASE: 'base_des_migrations' },
      'DB_NAME',
      'base_des_migrations',
    ],
    [
      'devrait ignorer un DB_HOST blanc comme la connexion',
      { DB_HOST: '  ', PGHOST: 'pg.example.com' },
      'DB_HOST',
      'pg.example.com',
    ],
    [
      'devrait extraire DB_NAME depuis DATABASE_URL si aucun alias direct',
      {
        DB_NAME: undefined,
        DATABASE_URL: 'postgresql://user:pass@host:5432/my_database',
      },
      'DB_NAME',
      'my_database',
    ],
    [
      'devrait nommer DB_NAME la base de DATABASE_URL, celle que pg ouvre, meme si POSTGRES_DB en nomme une autre',
      {
        DB_NAME: undefined,
        POSTGRES_DB: 'portfolio_2025_dev',
        DATABASE_URL: 'postgresql://user:pass@host:5432/my_database',
      },
      'DB_NAME',
      'my_database',
    ],
    [
      'devrait resoudre DATABASE_PORT comme alias de DB_PORT',
      { DB_PORT: undefined, DATABASE_PORT: '5433' },
      'DB_PORT',
      5433,
    ],
    [
      'devrait privilegier DB_HOST sur DATABASE_HOST',
      { DB_HOST: 'primary.host', DATABASE_HOST: 'secondary.host' },
      'DB_HOST',
      'primary.host',
    ],
    ['devrait coercer DB_PORT en number', { DB_PORT: '5433' }, 'DB_PORT', 5433],
    ['devrait coercer PORT en number', { PORT: '8080' }, 'PORT', 8080],
  ] as const)('%s', (_titre, overrides, cle, attendu) => {
    expect(validateEnv(buildValidEnv(overrides))[cle]).toBe(attendu);
  });

  it('devrait lister toutes les erreurs quand plusieurs variables critiques manquent', () => {
    const env = {};

    expect(() => validateEnv(env)).toThrow('[ENV VALIDATION]');
    expect(() => validateEnv(env)).toThrow('JWT_SECRET');
    expect(() => validateEnv(env)).toThrow('SECURE_KEY_FOR_PASSWORD_HASHING');
  });
});
