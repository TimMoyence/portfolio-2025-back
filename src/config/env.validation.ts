import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),

    PORT: z.coerce.number().int().positive().default(3000),
    API_PREFIX: z.string().default('api/v1/portfolio25'),
    SWAGGER_PATH: z.string().optional(),
    CORS_ORIGIN: z.string().optional(),

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

    FORMATION_TEACHER_NOTIFICATION_TO: z.string().optional(),
    FORMATION_REVIEW_BASE_URL: z.string().optional(),
    FORMATION_REVIEW_TOKEN_SECRET: z
      .string()
      .min(
        32,
        'FORMATION_REVIEW_TOKEN_SECRET doit faire au moins 32 caracteres',
      ),

    REDIS_HOST: z.string().default('127.0.0.1'),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_URL: z.string().optional(),

    AUDIT_QUEUE_ENABLED: z.string().default('true'),
    AUDIT_QUEUE_NAME: z.string().default('audit_requests'),
    AUDIT_QUEUE_CONCURRENCY: z.coerce.number().int().positive().default(1),
    AUDIT_QUEUE_ATTEMPTS: z.coerce.number().int().positive().default(3),
    AUDIT_QUEUE_BACKOFF_MS: z.coerce.number().int().positive().default(2000),
    AUDIT_JOB_TIMEOUT_MS: z.coerce.number().int().positive().default(180000),

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

    OPENAI_API_KEY: z.string().optional(),
    AUDIT_LLM_MODEL: z.string().default('gpt-4o-mini'),
    AUDIT_LLM_PROFILE: z.string().optional(),
    AUDIT_LLM_LANGUAGE: z.string().default('fr'),

    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_SECURE: z.string().default('false'),
    SMTP_FROM: z.string().optional(),
    SMTP_REPLY_TO: z.string().optional(),
    SMTP_DKIM_DOMAIN: z.string().optional(),
    SMTP_DKIM_SELECTOR: z.string().optional(),
    SMTP_DKIM_PRIVATE_KEY: z.string().optional(),
    CONTACT_NOTIFICATION_TO: z.string().optional(),
    AUDIT_REPORT_TO: z.string().optional(),

    FRONTEND_URL: z.string().optional(),
    MORNING_BRIEF_HMAC_KEYS: z.string().optional(),
    MORNING_BRIEF_HMAC_KEY_ID: z.string().optional(),
    MORNING_BRIEF_HMAC_SECRET: z.string().optional(),

    PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: z.string().optional(),

    OPENWEATHERMAP_API_KEY: z.string().optional(),

    TELEGRAM_BOT_TOKEN: z.string().optional(),

    METRICS_TOKEN: z.string().optional(),

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
        code: 'custom',
        path: ['SMTP_FROM'],
        message:
          'requis des lors que SMTP_HOST, SMTP_USER et SMTP_PASS sont definis ' +
          '(sinon les emails partent avec un expediteur vide)',
      });
    }

    const hmacRingConfigured = Boolean(env.MORNING_BRIEF_HMAC_KEYS?.trim());
    const hmacKeyIdConfigured = Boolean(env.MORNING_BRIEF_HMAC_KEY_ID?.trim());
    const hmacSecretConfigured = Boolean(env.MORNING_BRIEF_HMAC_SECRET?.trim());
    const hmacPairConfigured = hmacKeyIdConfigured && hmacSecretConfigured;
    const hmacPartialPair = hmacKeyIdConfigured !== hmacSecretConfigured;
    if (
      env.NODE_ENV === 'production' &&
      !hmacRingConfigured &&
      !hmacPairConfigured
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['MORNING_BRIEF_HMAC_KEYS'],
        message:
          'MORNING_BRIEF_HMAC_KEYS ou le couple MORNING_BRIEF_HMAC_KEY_ID / ' +
          'MORNING_BRIEF_HMAC_SECRET est requis en production',
      });
    }
    if (!hmacRingConfigured && hmacPartialPair) {
      ctx.addIssue({
        code: 'custom',
        path: ['MORNING_BRIEF_HMAC_SECRET'],
        message:
          'MORNING_BRIEF_HMAC_KEY_ID et MORNING_BRIEF_HMAC_SECRET doivent être ' +
          'renseignés ensemble',
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
          code: 'custom',
          path: [key],
          message:
            'doit etre une adresse email valide, seule ou sous la forme ' +
            '`Nom <adresse@domaine>`',
        });
      }
    }
  });

function allowsHeaderInjection(value: string): boolean {
  return /[\r\n]/.test(value);
}

function declaresSeveralMailboxes(value: string): boolean {
  return value.includes('<', value.indexOf('<') + 1);
}

function angledAddress(value: string): string | undefined {
  const open = value.indexOf('<');
  if (open < 0) return undefined;
  const close = value.indexOf('>', open + 1);
  if (close < 0) return undefined;
  return value.slice(open + 1, close);
}

/**
 * Valide une boite aux lettres RFC 5322 sous ses deux formes usuelles :
 * l'adresse nue (`contact@exemple.fr`) et l'adresse avec nom d'affichage
 * (`'Mon Nom' <contact@exemple.fr>`), cette derniere etant celle
 * deployee en production. `z.email()` rejetterait la seconde et
 * empecherait l'API de demarrer.
 */
function isValidMailbox(value: string): boolean {
  if (allowsHeaderInjection(value)) return false;
  if (declaresSeveralMailboxes(value)) return false;

  const address = (angledAddress(value) ?? value).trim();
  return z.email().safeParse(address).success;
}

function resolveAliases(env: Record<string, unknown>): Record<string, unknown> {
  const resolved = { ...env };

  if (!resolved.DB_HOST) {
    resolved.DB_HOST = resolved.DATABASE_HOST ?? resolved.PGHOST ?? undefined;
  }

  if (!resolved.DB_PORT) {
    resolved.DB_PORT = resolved.DATABASE_PORT ?? resolved.PGPORT ?? undefined;
  }

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
