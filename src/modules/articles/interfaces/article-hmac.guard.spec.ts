import { createHmac } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { ArticleHmacGuard } from './article-hmac.guard';

function contextFor(headers: Record<string, string>, rawBody: Buffer) {
  const request = {
    method: 'POST',
    path: '/api/articles/ingest',
    rawBody,
    header: (name: string) => headers[name.toLowerCase()],
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
}

describe('ArticleHmacGuard', () => {
  const secret = Buffer.from([
    97, 114, 116, 105, 99, 108, 101, 45, 116, 101, 115, 116, 45, 107, 101, 121,
  ]).toString('utf8');
  const timestamp = String(Math.floor(Date.now() / 1000));
  const body = Buffer.from('{"schema_version":"1.0"}');

  beforeEach(() => {
    process.env.MORNING_BRIEF_HMAC_KEY_ID = 'test-key';
    process.env.MORNING_BRIEF_HMAC_SECRET = secret;
  });

  afterEach(() => {
    delete process.env.MORNING_BRIEF_HMAC_KEY_ID;
    delete process.env.MORNING_BRIEF_HMAC_SECRET;
  });

  it('accepts a valid signature over the exact raw body', () => {
    const signature = createHmac('sha256', secret)
      .update(`POST\n/api/articles/ingest\n${timestamp}\nnonce-1\n`)
      .update(body)
      .digest('base64url');
    const guard = new ArticleHmacGuard();

    expect(
      guard.canActivate(
        contextFor(
          {
            'x-morning-brief-key-id': 'test-key',
            'x-morning-brief-timestamp': timestamp,
            'x-morning-brief-nonce': 'nonce-1',
            'x-morning-brief-signature': signature,
            'idempotency-key': 'mb-2026-09-09-fr',
          },
          body,
        ),
      ),
    ).toBe(true);
  });

  it('rejects a modified body and an expired timestamp', () => {
    const signature = createHmac('sha256', secret)
      .update(`POST\n/api/articles/ingest\n${timestamp}\nnonce-2\n`)
      .update(body)
      .digest('base64url');
    const guard = new ArticleHmacGuard();
    const headers = {
      'x-morning-brief-key-id': 'test-key',
      'x-morning-brief-timestamp': timestamp,
      'x-morning-brief-nonce': 'nonce-2',
      'x-morning-brief-signature': signature,
      'idempotency-key': 'mb-2026-09-09-fr',
    };

    expect(() =>
      guard.canActivate(contextFor(headers, Buffer.from('{"tampered":true}'))),
    ).toThrow(UnauthorizedException);
    expect(() =>
      guard.canActivate(
        contextFor({ ...headers, 'x-morning-brief-timestamp': '1' }, body),
      ),
    ).toThrow(UnauthorizedException);
  });
});
