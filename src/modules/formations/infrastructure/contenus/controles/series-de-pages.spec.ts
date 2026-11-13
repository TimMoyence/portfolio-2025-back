import {
  serieAttendue,
  serieServie,
} from '../../../../../../test/helpers/formations/cours/serie-de-pages';
import { COURS_B3_03 } from '../b3/b3-03/b3-03.cours';
import { COURS_B3_04 } from '../b3/b3-04/b3-04.cours';

describe.each([
  [COURS_B3_03.slug, COURS_B3_03, 'Traitement de texte'],
  [COURS_B3_04.slug, COURS_B3_04, 'Publipostage'],
] as const)('PAGE-01 — série de pages dessinées de %s', (_slug, cours, nom) => {
  it('montre sur chacune des onze pages une page dessinée, et à côté la syntaxe, le piège puis l’exemple', () => {
    expect(serieServie(cours)).toEqual(serieAttendue({ nom, pages: 11 }));
  });
});
