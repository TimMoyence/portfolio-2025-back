import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  egalEnTempsConstant,
  hmacSha256,
} from '../../../common/domain/crypto/empreintes';
import { estUnSecretValable } from '../../../common/domain/crypto/secret-hmac';
import { envBrut, envString } from '../../../config/env-readers.util';
import { trousseauHmac } from '../../../config/trousseau-hmac';
import { LONGUEUR_MAX_DU_NONCE } from '../domain/article-contract';

interface ArticleRequest extends Request {
  rawBody?: Buffer;
}

function secretDeLaCle(keyId: string): string | undefined {
  const cle = trousseauHmac().find(({ id }) => id === keyId);
  if (cle) return cle.secret;
  if (keyId === (envString('MORNING_BRIEF_HMAC_KEY_ID') ?? 'morning-brief')) {
    return envBrut('MORNING_BRIEF_HMAC_SECRET');
  }
  return undefined;
}

function resolveSecret(keyId: string): string | undefined {
  const secret = secretDeLaCle(keyId);
  return estUnSecretValable(secret) ? secret : undefined;
}

@Injectable()
export class ArticleHmacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<ArticleRequest>();
    const keyId = request.header('X-Morning-Brief-Key-Id');
    const timestamp = request.header('X-Morning-Brief-Timestamp');
    const nonce = request.header('X-Morning-Brief-Nonce');
    const signature = request.header('X-Morning-Brief-Signature');
    const idempotencyKey = request.header('Idempotency-Key');
    const secret = keyId ? resolveSecret(keyId) : undefined;
    const rawBody = request.rawBody;

    if (
      !keyId ||
      !timestamp ||
      !nonce ||
      !signature ||
      !idempotencyKey ||
      !secret ||
      !rawBody ||
      nonce.length > LONGUEUR_MAX_DU_NONCE
    ) {
      throw new UnauthorizedException('Invalid machine credentials');
    }

    const timestampMs = Number(timestamp) * 1000;
    if (
      !Number.isFinite(timestampMs) ||
      Math.abs(Date.now() - timestampMs) > 300_000
    ) {
      throw new UnauthorizedException('Invalid machine credentials');
    }

    const input = `${request.method}\n${request.path}\n${timestamp}\n${nonce}\n`;
    const expected = hmacSha256(secret, input, rawBody);
    const provided = Buffer.from(signature, 'base64url');
    if (!egalEnTempsConstant(provided, expected)) {
      throw new UnauthorizedException('Invalid machine credentials');
    }

    return true;
  }
}
