import {
  construireLInstantane,
  lireLInstantane,
} from '../../../../../../test/helpers/formations/cours/instantane-de-cours';
import { typographierEnProfondeur } from '../../../domain/cours/formule/Typographie';
import { COURS_B2_08 } from '../b2/b2-08/b2-08.cours';
import { COURS_B2_09 } from '../b2/b2-09/b2-09.cours';
import { CONTENUS, citationsLitteralesDe } from '../index';

describe.each([
  ['B2-08', COURS_B2_08],
  ['B2-09', COURS_B2_09],
] as const)('PUB-01 · le %s est publié et livré au front', (_code, contenu) => {
  const servi = CONTENUS.find(({ slug }) => slug === contenu.slug);

  it('le sert parmi les contenus synchronisés, typographié pour la publication', () => {
    expect(servi).toEqual(
      typographierEnProfondeur(contenu, citationsLitteralesDe(contenu.slug)),
    );
  });

  it('livre au front son instantané, empreinte comprise, avec ses quarante écrans', () => {
    if (servi === undefined) {
      throw new Error(`${contenu.slug} absent des contenus synchronisés`);
    }
    const livre = lireLInstantane(servi);

    expect(livre.empreinte).toBe(construireLInstantane(servi).empreinte);
    expect(livre.catalogue.ecrans).toHaveLength(40);
  });
});
