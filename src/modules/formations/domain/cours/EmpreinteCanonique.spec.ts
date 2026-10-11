import { buildContenuAPublierB2_01 } from '../../../../../test/factories/cours-b2-01.factory';
import { empreinteSha256 } from '../../../../common/domain/crypto/empreintes';
import { empreinteCanonique } from './EmpreinteCanonique';

const REFERENCE = empreinteCanonique(buildContenuAPublierB2_01());

describe('empreinteCanonique', () => {
  it('rend une empreinte sha256 hexadécimale', () => {
    expect(REFERENCE).toMatch(/^[0-9a-f]{64}$/);
  });

  it('empreinte les clés triées par unités de code, à toute profondeur, sans blanc', () => {
    expect(
      empreinteCanonique({
        b: 1,
        É: [{ z: 'é', y: -3 }],
        a: { d: [2, 1], c: null },
        B: true,
      }),
    ).toBe(
      empreinteSha256(
        '{"B":true,"a":{"c":null,"d":[2,1]},"b":1,"É":[{"y":-3,"z":"é"}]}',
      ),
    );
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
