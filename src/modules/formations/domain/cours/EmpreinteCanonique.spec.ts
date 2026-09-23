import { buildContenuAPublierB2_01 } from '../../../../../test/factories/cours-b2-01.factory';
import { empreinteCanonique } from './EmpreinteCanonique';

const REFERENCE = empreinteCanonique(buildContenuAPublierB2_01());

describe('empreinteCanonique', () => {
  it('rend une empreinte sha256 hexadécimale', () => {
    expect(REFERENCE).toMatch(/^[0-9a-f]{64}$/);
  });

  it('ne dépend pas de l’ordre des clefs', () => {
    const inverse = Object.fromEntries(
      Object.entries(buildContenuAPublierB2_01()).reverse(),
    );

    expect(empreinteCanonique(inverse)).toBe(REFERENCE);
  });

  it('ignore les champs indéfinis, absents une fois le contenu stocké', () => {
    const avecIndefini = { ...buildContenuAPublierB2_01(), inconnu: undefined };

    expect(empreinteCanonique(avecIndefini)).toBe(REFERENCE);
  });

  it('change dès qu’une note d’écran est corrigée', () => {
    const contenu = buildContenuAPublierB2_01();
    const [premier, ...suivants] = contenu.ecrans;

    expect(
      empreinteCanonique({
        ...contenu,
        ecrans: [{ ...premier, notes: `${premier.notes} ` }, ...suivants],
      }),
    ).not.toBe(REFERENCE);
  });
});
