import { z } from 'zod';

/**
 * Schema Zod de validation des variables d'environnement.
 *
 * Les variables critiques (base de donnees, secrets, OAuth) sont requises
 * et provoquent une erreur descriptive au demarrage si elles sont absentes.
 * Les variables optionnelles disposent de valeurs par defaut sensibles.
 *
 * Les alias multiples (DB_HOST / DATABASE_HOST / PGHOST, etc.) sont supportes
 * via `z.preprocess` afin de ne pas casser la compatibilite existante.
 */
const envSchema = z
  .object({
    // --- Node ---
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),

    // --- API ---
    PORT: z.coerce.number().int().positive().default(3000),
    API_PREFIX: z.string().default('api/v1/portfolio25'),
    SWAGGER_PATH: z.string().optional(),
    CORS_ORIGIN: z.string().optional(),

    // --- Database (aliases resolus dans le preprocess) ---
    DB_HOST: z
      .string()
      .min(1, 'DB_HOST (ou DATABASE_HOST / PGHOST) est requis'),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    DB_NAME: z
      .string()
      .min(1, 'DB_NAME (ou DATABASE_NAME / POSTGRES_DB) est requis'),
    DB_USERNAME: z.string().optional(),
    DB_USER: z.string().optional(),
    DB_PASSWORD: z.string().optional(),
    DB_PASS: z.string().optional(),
    DB_SSL: z.string().optional(),
    DB_SYNCHRONIZE: z.string().optional(),
    DB_ADMIN_DATABASE: z.string().optional(),
    DATABASE_URL: z.string().optional(),
    DATABASE_HOST: z.string().optional(),
    DATABASE_PORT: z.string().optional(),
    DATABASE_NAME: z.string().optional(),
    DATABASE_USER: z.string().optional(),
    DATABASE_PASSWORD: z.string().optional(),
    DATABASE_SSL: z.string().optional(),
    DATABASE_ADMIN_NAME: z.string().optional(),
    PGHOST: z.string().optional(),
    PGPORT: z.string().optional(),
    POSTGRES_DB: z.string().optional(),
    POSTGRES_USER: z.string().optional(),
    POSTGRES_PASSWORD: z.string().optional(),
    TYPEORM_SYNCHRONIZE: z.string().optional(),

    // --- Security (critiques) ---
    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET doit faire au moins 32 caracteres'),
    JWT_EXPIRES_IN: z.string().default('900s'),
    SECURE_KEY_FOR_PASSWORD_HASHING: z
      .string()
      .min(
        32,
        'SECURE_KEY_FOR_PASSWORD_HASHING doit faire au moins 32 caracteres',
      ),
    GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID est requis'),
    PASSWORD_RESET_URL_BASE: z.string().optional(),

    // --- Redis (optionnel) ---
    REDIS_HOST: z.string().default('127.0.0.1'),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_URL: z.string().optional(),

    // --- Queue / BullMQ (optionnel) ---
    AUDIT_QUEUE_ENABLED: z.string().default('true'),
    AUDIT_QUEUE_NAME: z.string().default('audit_requests'),
    AUDIT_QUEUE_CONCURRENCY: z.coerce.number().int().positive().default(1),
    AUDIT_QUEUE_ATTEMPTS: z.coerce.number().int().positive().default(3),
    AUDIT_QUEUE_BACKOFF_MS: z.coerce.number().int().positive().default(2000),
    AUDIT_JOB_TIMEOUT_MS: z.coerce.number().int().positive().default(180000),

    // --- Sebastian badges queue (optionnel) ---
    SEBASTIAN_BADGES_QUEUE_ENABLED: z.string().default('true'),
    SEBASTIAN_BADGES_QUEUE_NAME: z
      .string()
      .default('sebastian_badges_evaluation'),
    SEBASTIAN_BADGES_QUEUE_CONCURRENCY: z.coerce
      .number()
      .int()
      .positive()
      .default(1),
    SEBASTIAN_BADGES_QUEUE_ATTEMPTS: z.coerce
      .number()
      .int()
      .positive()
      .default(3),
    SEBASTIAN_BADGES_QUEUE_BACKOFF_MS: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(500),
    SEBASTIAN_BADGES_JOB_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(30_000),
    SEBASTIAN_BADGES_DEDUPE_WINDOW_MS: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(5_000),

    // --- Audit fetch (optionnel) ---
    AUDIT_FETCH_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
    AUDIT_MAX_REDIRECTS: z.coerce.number().int().nonnegative().optional(),
    AUDIT_HTML_MAX_BYTES: z.coerce.number().int().positive().optional(),
    AUDIT_TEXT_MAX_BYTES: z.coerce.number().int().positive().optional(),
    AUDIT_SITEMAP_SAMPLE_SIZE: z.coerce.number().int().positive().optional(),
    AUDIT_SITEMAP_MAX_URLS: z.coerce.number().int().positive().optional(),
    AUDIT_SITEMAP_ANALYZE_LIMIT: z.coerce.number().int().positive().optional(),
    AUDIT_URL_ANALYZE_CONCURRENCY: z.coerce
      .number()
      .int()
      .positive()
      .optional(),
    AUDIT_PAGE_ANALYZE_LIMIT: z.coerce.number().int().positive().optional(),
    AUDIT_PAGE_AI_CONCURRENCY: z.coerce.number().int().positive().optional(),
    AUDIT_PAGE_AI_TIMEOUT_MS: z.coerce.number().int().positive().optional(),

    // --- LLM / OpenAI (optionnel) ---
    OPENAI_API_KEY: z.string().optional(),
    AUDIT_LLM_MODEL: z.string().default('gpt-4o-mini'),
    AUDIT_LLM_PROFILE: z.string().optional(),
    AUDIT_LLM_LANGUAGE: z.string().default('fr'),

    // --- SMTP (optionnel) ---
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_SECURE: z.string().default('false'),
    SMTP_FROM: z.string().optional(),
    SMTP_REPLY_TO: z.string().optional(),
    // Signature DKIM applicative (optionnelle) : les trois ou aucune.
    SMTP_DKIM_DOMAIN: z.string().optional(),
    SMTP_DKIM_SELECTOR: z.string().optional(),
    SMTP_DKIM_PRIVATE_KEY: z.string().optional(),
    CONTACT_NOTIFICATION_TO: z.string().optional(),
    AUDIT_REPORT_TO: z.string().optional(),

    // --- Frontend / liens externes ---
    FRONTEND_URL: z.string().optional(),

    // --- Puppeteer (optionnel, surcharge le binaire Chromium) ---
    PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: z.string().optional(),

    // --- Weather (optionnel) ---
    OPENWEATHERMAP_API_KEY: z.string().optional(),

    // --- Telegram (optionnel) ---
    TELEGRAM_BOT_TOKEN: z.string().optional(),

    // --- Metrics (optionnel) ---
    METRICS_TOKEN: z.string().optional(),

    // --- Security (optionnel) ---
    SECURITY_SUSPICIOUS_SCORE_THRESHOLD: z.coerce
      .number()
      .int()
      .positive()
      .default(25),
    SECURITY_REPORT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(24 * 60 * 60 * 1000),
    SECURITY_TOP_EVENTS_LIMIT: z.coerce.number().int().positive().default(10),

    // --- Runtime contexts (optionnel) ---
    ENABLE_LEGACY_CMS_CONTEXTS: z.string().default('false'),
  })
  .superRefine((env, ctx) => {
    // Un transporter SMTP n'est cree que si HOST/USER/PASS sont renseignes
    // (cf. `createOptionalSmtpTransporter`). Dans ce cas, les mailers
    // enverront reellement — et sans expediteur, nodemailer recoit
    // `from: undefined` et echoue a l'envoi, en production, bien apres le
    // demarrage. On refuse donc de demarrer plutot que de laisser passer
    // une configuration qui ne peut pas fonctionner.
    //
    // Hors de ce cas, les mailers sont no-op : exiger un expediteur
    // bloquerait inutilement les environnements de dev et de CI.
    const smtpConfigured = Boolean(
      env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS,
    );
    if (smtpConfigured && !env.SMTP_FROM?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SMTP_FROM'],
        message:
          'requis des lors que SMTP_HOST, SMTP_USER et SMTP_PASS sont definis ' +
          '(sinon les emails partent avec un expediteur vide)',
      });
    }

    // Une valeur presente mais malformee franchirait le demarrage pour
    // echouer a l'envoi en production — exactement ce que la garde
    // ci-dessus cherche a eviter. Les deux formes RFC 5322 sont
    // acceptees, la production utilisant `Nom <adresse>`.
    //
    // Contrairement a la garde de presence, ce controle s'applique meme
    // sans SMTP configure : une valeur renseignee mais invalide est une
    // erreur de configuration dans tous les environnements. Ne pas
    // renseigner la variable du tout reste libre.
    for (const key of ['SMTP_FROM', 'SMTP_REPLY_TO'] as const) {
      const value = env[key];
      if (value?.trim() && !isValidMailbox(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message:
            'doit etre une adresse email valide, seule ou sous la forme ' +
            '`Nom <adresse@domaine>`',
        });
      }
    }
  });

/**
 * Valide une boite aux lettres RFC 5322 sous ses deux formes usuelles :
 * l'adresse nue (`contact@exemple.fr`) et l'adresse avec nom d'affichage
 * (`'Mon Nom' <contact@exemple.fr>`), cette derniere etant celle
 * deployee en production. `z.string().email()` rejetterait la seconde et
 * empecherait l'API de demarrer.
 */
function isValidMailbox(value: string): boolean {
  // Un saut de ligne permettrait d'injecter un en-tete supplementaire
  // (`Bcc:`) apres l'adresse ; la regex ci-dessous s'arretant au premier
  // `>`, le reste ne serait jamais examine.
  if (/[\r\n]/.test(value)) return false;
  // Une seule boite : `A <a@x.fr>, B <b@y.fr>` passerait sinon la
  // validation alors que seule la premiere adresse serait retenue.
  if ((value.match(/</g) ?? []).length > 1) return false;

  const angled = /<([^>]+)>/.exec(value);
  const address = (angled ? angled[1] : value).trim();
  return z.string().email().safeParse(address).success;
}

/**
 * Pre-traite les variables d'environnement pour resoudre les alias multiples.
 *
 * L'application supporte plusieurs noms pour les memes variables (ex: DB_HOST,
 * DATABASE_HOST, PGHOST). Cette fonction normalise les alias vers les noms
 * canoniques utilises par le schema, sans ecraser une valeur deja presente.
 */
function resolveAliases(env: Record<string, unknown>): Record<string, unknown> {
  const resolved = { ...env };

  // DB_HOST <- DATABASE_HOST <- PGHOST
  if (!resolved.DB_HOST) {
    resolved.DB_HOST = resolved.DATABASE_HOST ?? resolved.PGHOST ?? undefined;
  }

  // DB_PORT <- DATABASE_PORT <- PGPORT
  if (!resolved.DB_PORT) {
    resolved.DB_PORT = resolved.DATABASE_PORT ?? resolved.PGPORT ?? undefined;
  }

  // DB_NAME <- DATABASE_NAME <- POSTGRES_DB (+ extraction depuis DATABASE_URL)
  if (!resolved.DB_NAME) {
    resolved.DB_NAME =
      resolved.DATABASE_NAME ?? resolved.POSTGRES_DB ?? undefined;

    if (
      !resolved.DB_NAME &&
      typeof resolved.DATABASE_URL === 'string' &&
      resolved.DATABASE_URL.trim().length > 0
    ) {
      try {
        resolved.DB_NAME = new URL(
          resolved.DATABASE_URL.trim(),
        ).pathname.replace(/^\//, '');
      } catch {
        // URL invalide — le schema la rejettera ensuite
      }
    }
  }

  return resolved;
}

/**
 * Valide les variables d'environnement au demarrage de l'application.
 *
 * Utilise le schema Zod `envSchema` apres resolution des alias.
 * Si la validation echoue, une erreur descriptive listant toutes les
 * variables manquantes/invalides est lancee, empechant le demarrage.
 *
 * @param config - Les variables d'environnement brutes fournies par ConfigModule
 * @returns Les variables validees et typees
 * @throws Error avec un message detaillant les problemes de validation
 */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const resolved = resolveAliases(config);
  const result = envSchema.safeParse(resolved);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `\n[ENV VALIDATION] Variables d'environnement invalides :\n${errors}\n\n` +
        `Consultez .env.example pour la liste des variables attendues.\n`,
    );
  }

  return result.data as Record<string, unknown>;
}
