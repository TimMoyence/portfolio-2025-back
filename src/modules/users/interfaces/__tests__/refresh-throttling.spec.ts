import {
  ADRESSE_IPV4,
  ADRESSE_IPV4_MAPPEE,
} from '../../../../../test/helpers/provenance';
import { REFRESH_TOKEN_COOKIE_NAME } from '../../domain/auth.constants';
import { suivreParJetonDeRafraichissement } from '../refresh-throttling';

describe('suivreParJetonDeRafraichissement', () => {
  it('compte par jeton quand le cookie de rafraichissement est present', () => {
    const avecJeton = (ip: string) =>
      suivreParJetonDeRafraichissement({
        ip,
        cookies: { [REFRESH_TOKEN_COOKIE_NAME]: 'jeton-opaque' },
      });

    expect(avecJeton(ADRESSE_IPV4)).toBe(avecJeton('2001:db8::1'));
    expect(avecJeton(ADRESSE_IPV4)).toMatch(/^refresh:/);
  });

  it('compte une adresse IPv4 et sa forme IPv4-mappee-IPv6 dans le meme seau', () => {
    expect(suivreParJetonDeRafraichissement({ ip: ADRESSE_IPV4_MAPPEE })).toBe(
      suivreParJetonDeRafraichissement({ ip: ADRESSE_IPV4 }),
    );
  });

  it('ne laisse pas une requete sans adresse echapper au comptage', () => {
    expect(suivreParJetonDeRafraichissement({})).toBe('ip:unknown');
  });
});
