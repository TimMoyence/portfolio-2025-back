import { BadRequestException } from '@nestjs/common';
import { lookup } from 'dns/promises';
import { isIP } from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
  '169.254.169.254',
  '169.254.170.2',
  '100.100.100.200',
]);

const BLOCKED_SUFFIXES = ['.local', '.internal', '.home', '.lan'];

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) return true;
  if (BLOCKED_HOSTNAMES.has(normalized)) return true;
  return BLOCKED_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

export function isBlockedIpAddress(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 0) {
    return true;
  }

  if (kind === 4) {
    const parts = ip.split('.').map((part) => Number.parseInt(part, 10));
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
      return true;
    }

    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true;
    return false;
  }

  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('fe80:')) return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (normalized.startsWith('ff')) return true;
  return false;
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
