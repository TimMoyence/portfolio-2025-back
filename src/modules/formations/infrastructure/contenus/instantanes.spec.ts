import { writeFileSync } from 'node:fs';
import {
  cheminDeLInstantane,
  construireLInstantane,
  lireLInstantane,
} from '../../../../../test/helpers/instantane-de-cours';
import { CONTENUS } from './index';

describe.each(CONTENUS.map((contenu) => [contenu.slug, contenu] as const))(
  'instantané livré au front — %s',
  (_slug, contenu) => {
    const construit = construireLInstantane(contenu);

    beforeAll(() => {
      if (process.env.ECRIRE_INSTANTANE === '1') {
        writeFileSync(
          cheminDeLInstantane(contenu),
          `${JSON.stringify(construit, null, 2)}\n`,
          'utf8',
        );
      }
    });

    it('reste identique au fichier livré, empreinte comprise', () => {
      const livre = lireLInstantane(contenu);

      expect(livre.empreinte).toBe(construit.empreinte);
      expect(livre).toEqual(construit);
    });

    it('porte tous les écrans du cours au sujet, au déroulé et au catalogue', () => {
      const livre = lireLInstantane(contenu);

      expect(livre.sujet.ecrans).toHaveLength(contenu.ecrans.length);
      expect(livre.deroule.ecrans).toHaveLength(contenu.ecrans.length);
      expect(livre.catalogue.ecrans).toHaveLength(contenu.ecrans.length);
    });
  },
);
