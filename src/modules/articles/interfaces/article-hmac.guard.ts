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
import { envBrut, envListe, envString } from '../../../config/env-readers.util';

interface ArticleRequest extends Request {
  rawBody?: Buffer;
}

function resolveSecret(keyId: string): string | undefined {
  for (const pair of envListe('MORNING_BRIEF_HMAC_KEYS')) {
    const separator = pair.indexOf(':');
    if (separator > 0 && pair.slice(0, separator) === keyId) {
      return pair.slice(separator + 1);
    }
  }
  if (keyId === (envString('MORNING_BRIEF_HMAC_KEY_ID') ?? 'morning-brief')) {
    return envBrut('MORNING_BRIEF_HMAC_SECRET');
  }
  return undefined;
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
      !rawBody
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
