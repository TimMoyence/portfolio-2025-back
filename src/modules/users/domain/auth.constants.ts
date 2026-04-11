/** Duree de vie par defaut d'un refresh token : 30 jours en millisecondes. */
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Nom du cookie HttpOnly contenant le refresh token. */
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

/** Path restreint du cookie refresh token (ne sera envoye que sur ce chemin). */
export const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/portfolio25/auth';

/** Duree de vie du cookie refresh token en millisecondes (30 jours). */
export const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = REFRESH_TOKEN_TTL_MS;
