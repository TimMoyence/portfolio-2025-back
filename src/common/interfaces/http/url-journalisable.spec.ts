import {
  JETON_DE_PAGE,
  REFERENTS_DES_PAGES_A_JETON,
  REFERENTS_SANS_JETON,
} from '../../../../test/helpers/referents-des-pages-a-jeton';
import {
  CENSURE,
  referentJournalisable,
  urlJournalisable,
} from './url-journalisable';

const JETON = '550e8400-e29b-41d4-a716-446655440000';

describe('urlJournalisable', () => {
  it.each([
    [
      'le jeton d un lien porte par la requete',
      `/api/auth/verify-email?token=${JETON}&locale=fr`,
      `/api/auth/verify-email?token=${CENSURE}&locale=fr`,
    ],
    [
      'chaque valeur d un jeton repete',
      `/api/auth/verify-email?token=${JETON}&token=${JETON}`,
      `/api/auth/verify-email?token=${CENSURE}&token=${CENSURE}`,
    ],
    [
      'un jeton indexe, que la requete lit comme un objet',
      `/api/auth/verify-email?token%5Bjeton%5D=${JETON}`,
      `/api/auth/verify-email?token%5Bjeton%5D=${CENSURE}`,
    ],
  ])('censure %s', (_cas, url, attendue) => {
    expect(urlJournalisable(url)).toBe(attendue);
  });

  it('censure le segment du chemin que la route lit comme jeton', () => {
    expect(
      urlJournalisable(`/api/lead-magnets/toolkit/${JETON}`, { token: JETON }),
    ).toBe(`/api/lead-magnets/toolkit/${CENSURE}`);
  });

  it('reconnait un jeton de chemin encode', () => {
    expect(
      urlJournalisable('/api/lead-magnets/toolkit/pas%2Fun-jeton', {
        token: 'pas/un-jeton',
      }),
    ).toBe(`/api/lead-magnets/toolkit/${CENSURE}`);
  });

  it('garde tels quels les autres segments et parametres', () => {
    const url = `/api/formations/sessions/${JETON}/sujet?locale=fr&page=2`;

    expect(urlJournalisable(url, { id: JETON })).toBe(url);
  });
});

describe('referentJournalisable', () => {
  it.each(REFERENTS_DES_PAGES_A_JETON)(
    'censure le jeton du referent %s',
    (referent) => {
      expect(referentJournalisable(referent)).toBe(
        referent.replace(JETON_DE_PAGE, CENSURE),
      );
    },
  );

  it.each([
    ...REFERENTS_SANS_JETON,
    'https://asilidesign.fr/fr/formations/ia-solopreneurs/toolkit/',
    'pas une adresse',
  ])('garde tel quel le referent %s', (referent) => {
    expect(referentJournalisable(referent)).toBe(referent);
  });
});
