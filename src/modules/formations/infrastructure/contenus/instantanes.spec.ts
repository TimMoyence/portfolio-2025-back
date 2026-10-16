import { writeFileSync } from 'node:fs';
import {
  cheminDeLInstantane,
  construireLInstantane,
  lireLInstantane,
} from '../../../../../test/helpers/instantane-de-cours';
import { ESPACE_INSECABLE } from '../../../../common/domain/texte/sans-espaces-typographiques';
import { CONTENUS } from './index';

const MILLIER_SANS_ESPACE_FINE = new RegExp(
  `(?<![\\d,])\\d{1,3}[ ${ESPACE_INSECABLE}]\\d{3}(?!\\d)`,
  'gu',
);
const UNITE_DETACHEE = /\d (?:%|‰|[kM]?€)(?!\p{L})/gu;

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

    it('écrit chaque millier servi avec l espace fine et lie chaque nombre à son unité par une espace insécable', () => {
      const textes = (noeud: unknown): string[] => {
        if (typeof noeud === 'string') {
          return [noeud];
        }
        return typeof noeud === 'object' && noeud !== null
          ? Object.values(noeud).flatMap(textes)
          : [];
      };
      const fautifs = textes(construit).flatMap((texte) => [
        ...texte.matchAll(MILLIER_SANS_ESPACE_FINE),
        ...texte.matchAll(UNITE_DETACHEE),
      ]);

      expect(fautifs.map(([trouve]) => trouve)).toEqual([]);
    });

    it('porte tous les écrans du cours au sujet, au déroulé et au catalogue', () => {
      const livre = lireLInstantane(contenu);

      expect(livre.sujet.ecrans).toHaveLength(contenu.ecrans.length);
      expect(livre.deroule.ecrans).toHaveLength(contenu.ecrans.length);
      expect(livre.catalogue.ecrans).toHaveLength(contenu.ecrans.length);
    });
  },
);
