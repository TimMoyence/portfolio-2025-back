import {
  limiteDeThrottle,
  routesDuControleur,
} from '../../../../../test/helpers/metadonnees-de-route';
import { AuthController } from '../Auth.controller';
import { limiteDeRafraichissement } from '../refresh-throttling';

const UNE_HEURE_MS = 3600000;

describe('AuthController, plafond de chaque route', () => {
  it('borne par heure chaque route qui vérifie un secret ou envoie un e-mail, et seules les lectures du compte connecté restent au plafond global', () => {
    const plafonds = Object.fromEntries(
      routesDuControleur(AuthController).map(({ chemin, gestionnaire }) => {
        const { limite, fenetre } = limiteDeThrottle(gestionnaire);
        return [chemin, limite === undefined ? null : { limite, fenetre }];
      }),
    );

    expect(plafonds).toEqual({
      login: { limite: 10, fenetre: UNE_HEURE_MS },
      google: { limite: 10, fenetre: UNE_HEURE_MS },
      refresh: { limite: limiteDeRafraichissement, fenetre: UNE_HEURE_MS },
      logout: { limite: 10, fenetre: UNE_HEURE_MS },
      'change-password': { limite: 5, fenetre: UNE_HEURE_MS },
      'forgot-password': { limite: 3, fenetre: UNE_HEURE_MS },
      'reset-password': { limite: 10, fenetre: UNE_HEURE_MS },
      'set-password': { limite: 5, fenetre: UNE_HEURE_MS },
      register: { limite: 5, fenetre: UNE_HEURE_MS },
      'verify-email': { limite: 10, fenetre: UNE_HEURE_MS },
      'resend-verification': { limite: 3, fenetre: UNE_HEURE_MS },
      profile: null,
      me: null,
    });
  });
});
