import { BadRequestException } from '@nestjs/common';
import { lookup as resoudreParRappel, type LookupAddress } from 'dns';
import { lookup } from 'dns/promises';
import { BlockList, isIP, type LookupFunction } from 'node:net';

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata']);

const BLOCKED_SUFFIXES = ['.local', '.internal', '.home', '.lan'];

/* eslint-disable sonarjs/no-hardcoded-ip -- plages reservees de l'IANA : valeurs de la liste de blocage SSRF elle-meme */
const PLAGES_NON_PUBLIQUES: ReadonlyArray<
  readonly [string, number, 'ipv4' | 'ipv6']
> = [
  ['0.0.0.0', 8, 'ipv4'],
  ['10.0.0.0', 8, 'ipv4'],
  ['100.64.0.0', 10, 'ipv4'],
  ['127.0.0.0', 8, 'ipv4'],
  ['169.254.0.0', 16, 'ipv4'],
  ['172.16.0.0', 12, 'ipv4'],
  ['192.0.0.0', 24, 'ipv4'],
  ['192.0.2.0', 24, 'ipv4'],
  ['192.88.99.0', 24, 'ipv4'],
  ['192.168.0.0', 16, 'ipv4'],
  ['198.18.0.0', 15, 'ipv4'],
  ['198.51.100.0', 24, 'ipv4'],
  ['203.0.113.0', 24, 'ipv4'],
  ['224.0.0.0', 3, 'ipv4'],
  ['::', 96, 'ipv6'],
  ['64:ff9b::', 96, 'ipv6'],
  ['64:ff9b:1::', 48, 'ipv6'],
  ['100::', 64, 'ipv6'],
  ['2001::', 23, 'ipv6'],
  ['2001:db8::', 32, 'ipv6'],
  ['2002::', 16, 'ipv6'],
  ['fc00::', 7, 'ipv6'],
  ['fe80::', 10, 'ipv6'],
  ['ff00::', 8, 'ipv6'],
];
/* eslint-enable sonarjs/no-hardcoded-ip */

const ADRESSES_NON_PUBLIQUES = PLAGES_NON_PUBLIQUES.reduce(
  (liste, [reseau, prefixe, famille]) => {
    liste.addSubnet(reseau, prefixe, famille);
    return liste;
  },
  new BlockList(),
);

const CIBLE_BLOQUEE = 'Target resolves to a blocked IP range.';

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) return true;
  if (BLOCKED_HOSTNAMES.has(normalized)) return true;
  return BLOCKED_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

export function isBlockedIpAddress(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 0) return true;
  return ADRESSES_NON_PUBLIQUES.check(ip, kind === 4 ? 'ipv4' : 'ipv6');
}

function sansCrochets(hostname: string): string {
  return hostname.replace(/^\[(.*)\]$/, '$1');
}

function premiereAdresseBloquee(
  adresses: readonly LookupAddress[],
): LookupAddress | undefined {
  return adresses.find(({ address }) => isBlockedIpAddress(address));
}

export const resoudreVersUneAdressePublique: LookupFunction = (
  hostname,
  options,
  rappel,
) => {
  resoudreParRappel(hostname, { ...options, all: true }, (erreur, adresses) => {
    if (erreur) {
      rappel(erreur, '', 0);
      return;
    }
    if (adresses.length === 0 || premiereAdresseBloquee(adresses)) {
      rappel(new Error(CIBLE_BLOQUEE), '', 0);
      return;
    }
    if (options.all) {
      (rappel as unknown as (e: null, a: LookupAddress[]) => void)(
        null,
        adresses,
      );
      return;
    }
    rappel(null, adresses[0].address, adresses[0].family);
  });
};

export async function assertPublicHostname(hostname: string): Promise<void> {
  if (isBlockedHostname(hostname)) {
    throw new BadRequestException('Hostname is not allowed for audit.');
  }

  const hote = sansCrochets(hostname);
  if (isIP(hote) !== 0) {
    if (isBlockedIpAddress(hote)) throw new BadRequestException(CIBLE_BLOQUEE);
    return;
  }

  const records = await lookup(hote, { all: true });
  if (!records.length) {
    throw new BadRequestException('Hostname cannot be resolved.');
  }
  if (premiereAdresseBloquee(records)) {
    throw new BadRequestException(CIBLE_BLOQUEE);
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
