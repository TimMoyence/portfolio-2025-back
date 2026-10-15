import {
  attendreUneProvenanceBornee,
  PROVENANCE_DEMESUREE,
} from '../../../test/helpers/provenance';
import {
  LONGUEUR_MAX_DU_NAVIGATEUR,
  navigateurConsignable,
  provenanceConsignable,
} from './provenance';

describe('provenanceConsignable', () => {
  it('borne le navigateur et le referent, garde l ip nettoyee', () => {
    attendreUneProvenanceBornee(provenanceConsignable(PROVENANCE_DEMESUREE));
  });

  it('garde intacte une provenance ordinaire', () => {
    expect(
      provenanceConsignable({
        ip: '203.0.113.7',
        userAgent: ' Mozilla/5.0 ',
        referer: 'https://asilidesign.fr/fr/contact',
      }),
    ).toEqual({
      ip: '203.0.113.7',
      userAgent: 'Mozilla/5.0',
      referer: 'https://asilidesign.fr/fr/contact',
    });
  });

  it('consigne une provenance absente ou vide comme nulle', () => {
    expect(provenanceConsignable({ userAgent: '   ', referer: null })).toEqual({
      ip: null,
      userAgent: null,
      referer: null,
    });
  });
});

describe('navigateurConsignable', () => {
  it('borne le navigateur', () => {
    expect(navigateurConsignable('B'.repeat(15_000))).toHaveLength(
      LONGUEUR_MAX_DU_NAVIGATEUR,
    );
  });

  it('rend null sans navigateur', () => {
    expect(navigateurConsignable(null)).toBeNull();
  });
});
