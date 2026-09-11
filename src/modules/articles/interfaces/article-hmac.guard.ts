import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

interface ArticleRequest extends Request {
  rawBody?: Buffer;
}

function resolveSecret(keyId: string): string | undefined {
  const pairs = (process.env.MORNING_BRIEF_HMAC_KEYS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  for (const pair of pairs) {
    const separator = pair.indexOf(':');
    if (separator > 0 && pair.slice(0, separator) === keyId) {
      return pair.slice(separator + 1);
    }
  }
  if (keyId === (process.env.MORNING_BRIEF_HMAC_KEY_ID ?? 'morning-brief')) {
    return process.env.MORNING_BRIEF_HMAC_SECRET;
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
    const expected = createHmac('sha256', secret)
      .update(input)
      .update(rawBody)
      .digest();
    const provided = Buffer.from(signature, 'base64url');
    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      throw new UnauthorizedException('Invalid machine credentials');
    }

    return true;
  }
}
