import { createHmac } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { TEST_MORNING_BRIEF_HMAC_SECRET as SECRET } from '../../../../test/factories/env.factory';
import {
  appliquer,
  installerVariables,
} from '../../../../test/helpers/environnement';
import { LONGUEUR_MAX_DU_NONCE } from '../domain/article-contract';
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
  const timestamp = String(Math.floor(Date.now() / 1000));
  const body = Buffer.from('{"schema_version":"1.0"}');

  function entetesSignes(
    cle: string,
    secret: string,
    nonce: string,
  ): Record<string, string> {
    return {
      'x-morning-brief-key-id': cle,
      'x-morning-brief-timestamp': timestamp,
      'x-morning-brief-nonce': nonce,
      'x-morning-brief-signature': createHmac('sha256', secret)
        .update(`POST\n/api/articles/ingest\n${timestamp}\n${nonce}\n`)
        .update(body)
        .digest('base64url'),
      'idempotency-key': 'mb-2026-09-09-fr',
    };
  }

  installerVariables(
    {
      MORNING_BRIEF_HMAC_KEY_ID: 'test-key',
      MORNING_BRIEF_HMAC_SECRET: SECRET,
    },
    'chaque-test',
  );

  it('accepts a valid signature over the exact raw body', () => {
    const guard = new ArticleHmacGuard();

    expect(
      guard.canActivate(
        contextFor(entetesSignes('test-key', SECRET, 'nonce-1'), body),
      ),
    ).toBe(true);
  });

  it('refuse un nonce signe plus long que la colonne qui le consigne', () => {
    const guard = new ArticleHmacGuard();
    const nonce = 'n'.repeat(LONGUEUR_MAX_DU_NONCE + 1);

    expect(() =>
      guard.canActivate(
        contextFor(entetesSignes('test-key', SECRET, nonce), body),
      ),
    ).toThrow(UnauthorizedException);
    expect(
      guard.canActivate(
        contextFor(
          entetesSignes('test-key', SECRET, 'n'.repeat(LONGUEUR_MAX_DU_NONCE)),
          body,
        ),
      ),
    ).toBe(true);
  });

  it('rejects a modified body and an expired timestamp', () => {
    const guard = new ArticleHmacGuard();
    const headers = entetesSignes('test-key', SECRET, 'nonce-2');

    expect(() =>
      guard.canActivate(contextFor(headers, Buffer.from('{"tampered":true}'))),
    ).toThrow(UnauthorizedException);
    expect(() =>
      guard.canActivate(
        contextFor({ ...headers, 'x-morning-brief-timestamp': '1' }, body),
      ),
    ).toThrow(UnauthorizedException);
  });

  const COURT = 'c'.repeat(31);

  it.each([
    ['du trousseau', { MORNING_BRIEF_HMAC_KEYS: `courte:${COURT}` }],
    [
      'du couple identifiant et secret',
      { MORNING_BRIEF_HMAC_KEY_ID: 'courte', MORNING_BRIEF_HMAC_SECRET: COURT },
    ],
  ])(
    'refuse une signature exacte par un secret %s de moins de 32 caracteres',
    (_cas, variables) => {
      appliquer(variables);

      expect(() =>
        new ArticleHmacGuard().canActivate(
          contextFor(entetesSignes('courte', COURT, 'nonce-3'), body),
        ),
      ).toThrow(UnauthorizedException);
    },
  );
});
