import { z } from 'zod';
import {
  estUnSecretValable,
  LONGUEUR_MIN_DU_SECRET,
} from '../common/domain/crypto/secret-hmac';
import { EmailAddress } from '../common/domain/value-objects/EmailAddress';
import {
  emplacementDeLUrl,
  resoudreConnexionPostgres,
} from '../database/connexion-postgres';
import { estEnProduction, lirePort, PORT_ATTENDU } from './env-readers.util';
import { PREFIXE_API_PAR_DEFAUT } from './prefixe-api';
import { trousseauHmac } from './trousseau-hmac';

function portTcp(defaut: number) {
  return z
    .union([z.string(), z.number()])
    .optional()
    .transform((valeur, ctx) => {
      const texte = valeur === undefined ? '' : String(valeur).trim();
      if (!texte) return defaut;
      const port = lirePort(texte);
      if (port !== undefined) return port;
      ctx.addIssue({ code: 'custom', message: `doit etre ${PORT_ATTENDU}` });
      return z.NEVER;
    });
}

const SECRET_TROP_COURT = `doit faire au moins ${LONGUEUR_MIN_DU_SECRET} caracteres hors blancs`;

function secretRequis(nom: string) {
  return z.string().refine(estUnSecretValable, `${nom} ${SECRET_TROP_COURT}`);
}

function secretFacultatif(nom: string) {
  return z
    .string()
    .optional()
    .refine(
      (secret) => !secret?.trim() || estUnSecretValable(secret),
      `${nom} ${SECRET_TROP_COURT}`,
    );
}

const USAGES_DES_SECRETS = [
  ['JWT_SECRET', 'JWT_SECRET_PREVIOUS'],
  ['SECURE_KEY_FOR_PASSWORD_HASHING'],
  ['FORMATION_REVIEW_TOKEN_SECRET'],
  ['FORMATIONS_PULSE_SECRET'],
  ['MORNING_BRIEF_HMAC_SECRET', 'MORNING_BRIEF_HMAC_KEYS'],
] as const;

type CleDeSecret = (typeof USAGES_DES_SECRETS)[number][number];

export type CryptographicSecretKey = Exclude<
  CleDeSecret,
  'JWT_SECRET_PREVIOUS' | 'MORNING_BRIEF_HMAC_KEYS'
>;

type EnvLue = z.infer<typeof formeDeLEnv>;

function secretsDe(env: EnvLue, cle: CleDeSecret): string[] {
  const valeurs =
    cle === 'MORNING_BRIEF_HMAC_KEYS'
      ? trousseauHmac(env).map(({ secret }) => secret)
      : [env[cle]];
  return valeurs.flatMap((valeur) => valeur?.trim() || []);
}

function findDuplicateCryptographicSecret(
  env: EnvLue,
): { key: CleDeSecret; previousKey: CleDeSecret } | null {
  const premiereCle = new Map<string, { usage: number; cle: CleDeSecret }>();
  for (const [usage, cles] of USAGES_DES_SECRETS.entries()) {
    for (const cle of cles) {
      for (const secret of secretsDe(env, cle)) {
        const vue = premiereCle.get(secret);
        if (vue !== undefined && vue.usage !== usage) {
          return { key: cle, previousKey: vue.cle };
        }
        premiereCle.set(secret, { usage, cle });
      }
    }
  }
  return null;
}

function addSmtpIssues(
  env: {
    SMTP_HOST?: string;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    SMTP_FROM?: string;
  },
  ctx: z.RefinementCtx,
): void {
  // Un transporter SMTP n'est cree que si HOST/PORT/USER/PASS sont
  // renseignes (cf. `createOptionalSmtpTransporter`), le port valant 587
  // par defaut une fois l'environnement valide. Dans ce cas, les mailers
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
}

const HOTE_SAUVEGARDE_EN_PRODUCTION = 'db';

function addEmplacementSauvegardeIssues(
  env: EnvLue,
  ctx: z.RefinementCtx,
): void {
  if (!estEnProduction(env)) return;
  const base = env.POSTGRES_DB?.trim();
  const parUrl = Boolean(env.DATABASE_URL?.trim());
  if (!base) {
    ctx.addIssue({
      code: 'custom',
      path: ['POSTGRES_DB'],
      message:
        'est requise en production, c est la base que le deploiement sauvegarde avant migrate',
    });
  } else if (env.DB_NAME !== base) {
    ctx.addIssue({
      code: 'custom',
      path: [parUrl ? 'DATABASE_URL' : 'DB_NAME'],
      message:
        'doit nommer la base POSTGRES_DB, la seule que db-backup sauvegarde',
    });
  }
  if (env.DB_HOST !== HOTE_SAUVEGARDE_EN_PRODUCTION) {
    ctx.addIssue({
      code: 'custom',
      path: [parUrl ? 'DATABASE_URL' : 'DB_HOST'],
      message: `doit designer le service ${HOTE_SAUVEGARDE_EN_PRODUCTION}, le seul que db-backup sauvegarde`,
    });
  }
}

const formeDeLEnv = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: portTcp(3000),
  API_PREFIX: z.string().default(PREFIXE_API_PAR_DEFAUT),
  SWAGGER_PATH: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),

  DB_HOST: z.string().min(1, 'DB_HOST (ou DATABASE_HOST / PGHOST) est requis'),
  DB_PORT: portTcp(5432),
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
  DB_DATABASE: z.string().optional(),
  DB_POOL_MAX: z.string().optional(),
  DB_POOL_IDLE_TIMEOUT_MS: z.string().optional(),
  DB_POOL_CONNECT_TIMEOUT_MS: z.string().optional(),
  DATABASE_URL: z
    .string()
    .optional()
    .refine(
      (url) => !url?.trim() || emplacementDeLUrl(url.trim()) !== undefined,
      'doit etre une URL postgres:// ou postgresql:// qui nomme son hote et sa base',
    ),
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

  JWT_SECRET: secretRequis('JWT_SECRET'),
  JWT_EXPIRES_IN: z.string().default('900s'),
  JWT_SECRET_PREVIOUS: secretFacultatif('JWT_SECRET_PREVIOUS'),
  SECURE_KEY_FOR_PASSWORD_HASHING: secretRequis(
    'SECURE_KEY_FOR_PASSWORD_HASHING',
  ),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID est requis'),
  PASSWORD_RESET_URL_BASE: z.string().optional(),
  EMAIL_VERIFICATION_URL_BASE: z.string().optional(),

  FORMATION_TEACHER_NOTIFICATION_TO: z
    .string()
    .min(1, 'FORMATION_TEACHER_NOTIFICATION_TO est requis'),
  FORMATION_REVIEW_TOKEN_SECRET: secretRequis('FORMATION_REVIEW_TOKEN_SECRET'),
  FORMATIONS_PULSE_SECRET: secretRequis('FORMATIONS_PULSE_SECRET'),

  REDIS_HOST: z.string().optional(),
  REDIS_PORT: portTcp(6379),
  REDIS_URL: z.string().optional(),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  AUDIT_QUEUE_ENABLED: z.string().default('true'),
  AUDIT_QUEUE_NAME: z.string().default('audit_requests'),
  AUDIT_QUEUE_CONCURRENCY: z.coerce.number().int().positive().default(1),
  AUDIT_QUEUE_ATTEMPTS: z.coerce.number().int().positive().default(3),
  AUDIT_QUEUE_BACKOFF_MS: z.coerce.number().int().positive().default(2000),
  AUDIT_JOB_TIMEOUT_MS: z.coerce.number().int().positive().default(180000),

  AUDIT_FETCH_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  AUDIT_MAX_REDIRECTS: z.coerce.number().int().nonnegative().optional(),
  AUDIT_HTML_MAX_BYTES: z.coerce.number().int().positive().optional(),
  AUDIT_TEXT_MAX_BYTES: z.coerce.number().int().positive().optional(),
  AUDIT_SITEMAP_SAMPLE_SIZE: z.coerce.number().int().positive().optional(),
  AUDIT_SITEMAP_MAX_URLS: z.coerce.number().int().positive().optional(),
  AUDIT_SITEMAP_ANALYZE_LIMIT: z.coerce.number().int().positive().optional(),
  AUDIT_URL_ANALYZE_CONCURRENCY: z.coerce.number().int().positive().optional(),
  AUDIT_PAGE_ANALYZE_LIMIT: z.coerce.number().int().positive().optional(),
  AUDIT_PAGE_AI_CONCURRENCY: z.coerce.number().int().positive().optional(),
  AUDIT_PAGE_AI_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  AUDIT_PAGE_AI_CIRCUIT_BREAKER_MIN_SAMPLES: z.string().optional(),
  AUDIT_PAGE_AI_CIRCUIT_BREAKER_FAILURE_RATIO: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
  AUDIT_LLM_MODEL: z.string().default('gpt-4o-mini'),
  AUDIT_LLM_PROFILE: z.string().optional(),
  AUDIT_LLM_LANGUAGE: z.string().default('fr'),
  AUDIT_LLM_PROFILE_CANARY_PERCENT: z.string().optional(),
  AUDIT_LLM_TIMEOUT_MS: z.string().optional(),
  AUDIT_LLM_SUMMARY_TIMEOUT_MS: z.string().optional(),
  AUDIT_LLM_EXPERT_TIMEOUT_MS: z.string().optional(),
  AUDIT_LLM_GLOBAL_TIMEOUT_MS: z.string().optional(),
  AUDIT_LLM_SECTION_TIMEOUT_MS: z.string().optional(),
  AUDIT_LLM_SECTION_RETRY_MAX: z.string().optional(),
  AUDIT_LLM_SECTION_RETRY_MIN_REMAINING_MS: z.string().optional(),
  AUDIT_LLM_INFLIGHT_MAX: z.string().optional(),
  AUDIT_LLM_RETRIES: z.string().optional(),
  AUDIT_ANTHROPIC_API_KEY: z.string().optional(),
  AUDIT_ANTHROPIC_MODEL: z.string().optional(),
  AUDIT_ENABLE_ANTHROPIC_CACHING: z.string().optional(),
  AUDIT_RATE_HOURLY_MIN: z.string().optional(),
  AUDIT_RATE_HOURLY_MAX: z.string().optional(),
  AUDIT_RATE_CURRENCY: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: portTcp(587),
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
  AUDIT_SELF_DOMAINS: z.string().optional(),
  AUDIT_BOOKING_URL: z.string().optional(),
  AUDIT_BRAND_LOGO_URL: z.string().optional(),
  AUDIT_UNSUBSCRIBE_URL: z.string().optional(),

  FRONTEND_URL: z.string().optional(),
  MORNING_BRIEF_HMAC_KEYS: z.string().optional(),
  MORNING_BRIEF_HMAC_KEY_ID: z.string().optional(),
  MORNING_BRIEF_HMAC_SECRET: secretFacultatif('MORNING_BRIEF_HMAC_SECRET'),

  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),

  SECURITY_SUSPICIOUS_SCORE_THRESHOLD: z.coerce
    .number()
    .int()
    .positive()
    .default(25),

  BOOTSTRAP_DEBUG: z.string().optional(),
});

export type VariableDEnv = keyof typeof formeDeLEnv.shape;

export type ValeursDeLEnv = Record<VariableDEnv, unknown>;

export const VARIABLES_DE_L_ENV = Object.keys(
  formeDeLEnv.shape,
) as readonly VariableDEnv[];

const envSchema = formeDeLEnv.superRefine((env, ctx) => {
  const duplicateSecret = findDuplicateCryptographicSecret(env);
  if (duplicateSecret) {
    ctx.addIssue({
      code: 'custom',
      path: [duplicateSecret.key],
      message: `doit etre distinct de ${duplicateSecret.previousKey}`,
    });
  }

  addSmtpIssues(env, ctx);

  addEmplacementSauvegardeIssues(env, ctx);

  const hmacRingConfigured = Boolean(env.MORNING_BRIEF_HMAC_KEYS?.trim());
  const hmacKeyIdConfigured = Boolean(env.MORNING_BRIEF_HMAC_KEY_ID?.trim());
  const hmacSecretConfigured = Boolean(env.MORNING_BRIEF_HMAC_SECRET?.trim());
  const hmacPairConfigured = hmacKeyIdConfigured && hmacSecretConfigured;
  const hmacPartialPair = hmacKeyIdConfigured !== hmacSecretConfigured;
  if (estEnProduction(env) && !hmacRingConfigured && !hmacPairConfigured) {
    ctx.addIssue({
      code: 'custom',
      path: ['MORNING_BRIEF_HMAC_KEYS'],
      message:
        'MORNING_BRIEF_HMAC_KEYS ou le couple MORNING_BRIEF_HMAC_KEY_ID / ' +
        'MORNING_BRIEF_HMAC_SECRET est requis en production',
    });
  }
  if (
    trousseauHmac(env).some(
      ({ id, secret }) => !id || !estUnSecretValable(secret),
    )
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['MORNING_BRIEF_HMAC_KEYS'],
      message: `chaque cle s'ecrit identifiant:secret, et son secret ${SECRET_TROP_COURT}`,
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

  // FORMATION_TEACHER_NOTIFICATION_TO est obligatoire (contrairement a
  // SMTP_FROM/SMTP_REPLY_TO ci-dessus) : sans elle, CloseSession.useCase.ts
  // n'a aucun destinataire de repli pour la synthese formateur.
  if (
    env.FORMATION_TEACHER_NOTIFICATION_TO?.trim() &&
    !isValidMailbox(env.FORMATION_TEACHER_NOTIFICATION_TO)
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['FORMATION_TEACHER_NOTIFICATION_TO'],
      message: 'doit etre une adresse email valide',
    });
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
 * deployee en production. L'adresse suit la regle commune d'EmailAddress.
 */
function isValidMailbox(value: string): boolean {
  if (allowsHeaderInjection(value)) return false;
  if (declaresSeveralMailboxes(value)) return false;

  return EmailAddress.parse(angledAddress(value) ?? value) !== null;
}

function resolveAliases(env: Record<string, unknown>): Record<string, unknown> {
  const { host, port, database } = resoudreConnexionPostgres(env);
  return { ...env, DB_HOST: host, DB_PORT: port, DB_NAME: database };
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
