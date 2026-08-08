import { BadRequestException } from '@nestjs/common';
import { lookup } from 'dns/promises';
import { isIP } from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
  // eslint-disable-next-line sonarjs/no-hardcoded-ip -- endpoint de metadonnees cloud : valeur de la liste de blocage SSRF elle-meme
  '169.254.169.254',
  // eslint-disable-next-line sonarjs/no-hardcoded-ip -- endpoint de metadonnees cloud : valeur de la liste de blocage SSRF elle-meme
  '169.254.170.2',
  // eslint-disable-next-line sonarjs/no-hardcoded-ip -- endpoint de metadonnees cloud : valeur de la liste de blocage SSRF elle-meme
  '100.100.100.200',
]);

const BLOCKED_SUFFIXES = ['.local', '.internal', '.home', '.lan'];

const BLOCKED_IPV6_PREFIXES = ['fe80:', 'fc', 'fd', 'ff'];

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) return true;
  if (BLOCKED_HOSTNAMES.has(normalized)) return true;
  return BLOCKED_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isBlockedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  return BLOCKED_IPV6_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function isBlockedIpAddress(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 0) return true;
  return kind === 4 ? isBlockedIpv4(ip) : isBlockedIpv6(ip);
}

export async function assertPublicHostname(hostname: string): Promise<void> {
  if (isBlockedHostname(hostname)) {
    throw new BadRequestException('Hostname is not allowed for audit.');
  }

  const records = await lookup(hostname, { all: true });
  if (!records.length) {
    throw new BadRequestException('Hostname cannot be resolved.');
  }

  for (const record of records) {
    if (isBlockedIpAddress(record.address)) {
      throw new BadRequestException('Target resolves to a blocked IP range.');
    }
  }
}

export async function assertSafeHttpUrl(target: URL): Promise<void> {
  if (!['http:', 'https:'].includes(target.protocol)) {
    throw new BadRequestException('Only HTTP(S) URLs are allowed.');
  }
  if (target.username || target.password) {
    throw new BadRequestException('URL credentials are not allowed.');
  }
  await assertPublicHostname(target.hostname);
}
