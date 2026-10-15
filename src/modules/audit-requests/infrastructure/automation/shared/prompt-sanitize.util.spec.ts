import {
  attendreUnSeulBlocDeDonnees,
  BALISE_FERMANTE_INJECTEE,
} from '../../../../../../test/helpers/appels-llm';
import { wrapUntrustedUserPayload } from './prompt-sanitize.util';

describe('wrapUntrustedUserPayload', () => {
  it.each([
    ['le titre', { title: BALISE_FERMANTE_INJECTEE }],
    ['une liste de h1', { h1: ['Accueil', BALISE_FERMANTE_INJECTEE] }],
    ['une cle', { [BALISE_FERMANTE_INJECTEE]: 'valeur' }],
    [
      'un objet imbrique',
      { page: { metaDescription: BALISE_FERMANTE_INJECTEE } },
    ],
  ])("n'ouvre ni ne ferme le bloc depuis %s de la donnee", (_cas, payload) => {
    attendreUnSeulBlocDeDonnees(wrapUntrustedUserPayload(payload));
  });

  it('rend au modele la donnee intacte une fois relue', () => {
    const payload = { title: BALISE_FERMANTE_INJECTEE, note: 'a < b > c' };

    const bloc = wrapUntrustedUserPayload(payload);
    const json = bloc.slice('<user_data>\n'.length, -'\n</user_data>'.length);

    expect(JSON.parse(json)).toEqual(payload);
  });
});
