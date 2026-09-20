export const TEST_JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long'; // gitleaks:allow (ci.yml)
const TEST_HASHING_KEY = 'test-hashing-key-at-least-32-characters-long'; // gitleaks:allow (ci.yml)
const TEST_FORMATION_REVIEW_TOKEN_SECRET =
  'test-formation-review-secret-at-least-32-chars'; // gitleaks:allow (ci.yml)

const SECRETS_REQUIS = {
  JWT_SECRET: TEST_JWT_SECRET,
  SECURE_KEY_FOR_PASSWORD_HASHING: TEST_HASHING_KEY,
  GOOGLE_CLIENT_ID: 'test-google-client-id.apps.googleusercontent.com',
  FORMATION_REVIEW_TOKEN_SECRET: TEST_FORMATION_REVIEW_TOKEN_SECRET,
  FORMATIONS_PULSE_SECRET: TEST_FORMATION_REVIEW_TOKEN_SECRET,
  FORMATION_TEACHER_NOTIFICATION_TO: 'formateur-notifications@example.com',
};

export function buildValidEnv(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    DB_HOST: '127.0.0.1',
    DB_PORT: '5432',
    DB_NAME: 'portfolio_test',
    ...SECRETS_REQUIS,
    ...overrides,
  };
}

export function buildProductionSecrets(): Record<string, string> {
  return {
    ...SECRETS_REQUIS,
    MORNING_BRIEF_HMAC_KEYS: 'morning-brief:key-from-secret-manager',
  };
}
