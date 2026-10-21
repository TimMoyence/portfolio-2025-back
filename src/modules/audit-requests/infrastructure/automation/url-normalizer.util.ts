import { adresseDuSite } from '../../domain/AdresseDuSite';
import { assertSafeHttpUrl } from './ssrf-guard.util';

export interface NormalizedAuditUrl {
  normalizedUrl: string;
  hostname: string;
}

export async function normalizeAuditUrl(
  rawInput: string,
): Promise<NormalizedAuditUrl> {
  const parsed = adresseDuSite(rawInput);
  await assertSafeHttpUrl(parsed);

  return {
    normalizedUrl: parsed.toString(),
    hostname: parsed.hostname,
  };
}
