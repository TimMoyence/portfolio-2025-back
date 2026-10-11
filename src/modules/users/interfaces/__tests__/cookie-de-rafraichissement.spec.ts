import { installerVariables } from '../../../../../test/helpers/environnement';
import { attributsDuCookieDeRafraichissement } from '../cookie-de-rafraichissement';

describe('attributsDuCookieDeRafraichissement', () => {
  describe('hors production', () => {
    installerVariables(
      { NODE_ENV: 'test', API_PREFIX: undefined },
      'chaque-test',
    );

    it('restreint le cookie aux routes d authentification, sans exiger HTTPS', () => {
      expect(attributsDuCookieDeRafraichissement()).toEqual({
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        path: '/api/v1/portfolio25/auth',
      });
    });
  });

  describe('en production', () => {
    installerVariables(
      { NODE_ENV: 'production', API_PREFIX: '/edge/api' },
      'chaque-test',
    );

    it('exige HTTPS et suit le prefixe de l API', () => {
      expect(attributsDuCookieDeRafraichissement()).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/edge/api/auth',
      });
    });
  });
});
