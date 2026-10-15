import {
  LONGUEUR_MAX_DU_NAVIGATEUR,
  LONGUEUR_MAX_DU_REFERENT,
  type Provenance,
} from '../../src/common/domain/provenance';

export const PROVENANCE_DEMESUREE = {
  ip: ' 203.0.113.7 ',
  userAgent: ` ${'A'.repeat(15_000)} `,
  referer: `https://asilidesign.fr/fr/${'a'.repeat(15_000)}`,
};

export function attendreUneProvenanceBornee(consignee: Provenance): void {
  expect(consignee.ip).toBe('203.0.113.7');
  expect(consignee.userAgent).toHaveLength(LONGUEUR_MAX_DU_NAVIGATEUR);
  expect(consignee.userAgent?.startsWith('AAAA')).toBe(true);
  expect(consignee.referer).toHaveLength(LONGUEUR_MAX_DU_REFERENT);
  expect(consignee.referer?.startsWith('https://asilidesign.fr/fr/')).toBe(
    true,
  );
}
