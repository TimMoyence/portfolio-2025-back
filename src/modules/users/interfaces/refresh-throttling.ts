import type { ExecutionContext } from '@nestjs/common';
import { empreinteSha256 } from '../../../common/domain/crypto/empreintes';
import {
  REFRESH_SANS_JETON_PAR_ADRESSE,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_RATE_LIMIT,
} from '../domain/auth.constants';

export function suivreParJetonDeRafraichissement(
  req: Record<string, unknown>,
): string {
  const jeton = jetonPresente(req);
  if (jeton !== null) {
    return `refresh:${empreinteSha256(jeton)}`;
  }
  return typeof req.ip === 'string' ? `ip:${req.ip}` : 'ip:inconnue';
}

export function limiteDeRafraichissement(context: ExecutionContext): number {
  const req = context.switchToHttp().getRequest<Record<string, unknown>>();
  return jetonPresente(req) === null
    ? REFRESH_SANS_JETON_PAR_ADRESSE
    : REFRESH_TOKEN_RATE_LIMIT;
}

function jetonPresente(req: Record<string, unknown>): string | null {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const jeton = cookies?.[REFRESH_TOKEN_COOKIE_NAME];
  return typeof jeton === 'string' && jeton.length > 0 ? jeton : null;
}
