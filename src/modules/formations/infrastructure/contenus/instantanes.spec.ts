import { writeFileSync } from 'node:fs';
import {
  cheminDeLInstantane,
  construireLInstantane,
  lireLInstantane,
} from '../../../../../test/helpers/instantane-de-cours';
import {
  ESPACE_FINE_INSECABLE,
  ESPACE_INSECABLE,
} from '../../../../common/domain/texte/sans-espaces-typographiques';
import { CONTENUS, citationsLitteralesDe } from './index';

const MILLIER_SANS_ESPACE_FINE = new RegExp(
  `(?<![\\d,])\\d{1,3}[ ${ESPACE_INSECABLE}]\\d{3}(?!\\d)`,
  'gu',
);
const UNITE_SANS_INSECABLE = new RegExp(
  `\\d[ ${ESPACE_FINE_INSECABLE}]?(?:%|‰|[kM]?€|kWh|km|kg)(?!\\p{L})`,
  'gu',
);

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

    it('écrit chaque millier servi avec l espace fine et lie chaque nombre à son unité par une espace insécable, hors citation littérale d une cellule', () => {
      const textes = (noeud: unknown): string[] => {
        if (typeof noeud === 'string') {
          return [noeud];
        }
        return typeof noeud === 'object' && noeud !== null
          ? Object.values(noeud).flatMap(textes)
          : [];
      };
      const citations = citationsLitteralesDe(contenu.slug);
      const fautifs = textes(construit)
        .map((texte) =>
          citations.reduce(
            (reste, citation) => reste.replaceAll(citation, '…'),
            texte,
          ),
        )
        .flatMap((prose) => [
          ...prose.matchAll(MILLIER_SANS_ESPACE_FINE),
          ...prose.matchAll(UNITE_SANS_INSECABLE),
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
