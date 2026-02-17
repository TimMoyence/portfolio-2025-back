import { BadRequestException } from '@nestjs/common';
import { assertSafeHttpUrl } from './ssrf-guard.util';

export interface NormalizedAuditUrl {
  normalizedUrl: string;
  hostname: string;
}

export async function normalizeAuditUrl(
  rawInput: string,
): Promise<NormalizedAuditUrl> {
  const raw = rawInput.trim();
  if (!raw) {
    throw new BadRequestException('Website is required.');
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw)
    ? raw
    : `https://${raw}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new BadRequestException('Website URL is invalid.');
  }

  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    throw new BadRequestException('Website hostname is invalid.');
  }

  parsed.hash = '';
  await assertSafeHttpUrl(parsed);

  return {
    normalizedUrl: parsed.toString(),
    hostname: parsed.hostname.toLowerCase(),
  };
}
