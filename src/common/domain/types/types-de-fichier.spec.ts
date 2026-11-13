import { NOM_SERVI, nomServi } from './types-de-fichier';

const EMPREINTE =
  '0c1d2e3f4a5b6c7d8e9f00112233445566778899aabbccddeeff001122334455';
const servi = new RegExp(`^${NOM_SERVI}$`);

describe('nomServi', () => {
  it('suffixe la base des huit premiers caractères de l’empreinte, puis de l’extension', () => {
    expect(nomServi('B3-03_note_comite', EMPREINTE, 'txt')).toBe(
      'B3-03_note_comite.0c1d2e3f.txt',
    );
  });

  it.each(['xlsx', 'csv', 'pdf', 'txt'] as const)(
    'écrit un nom %s que le motif servi reconnaît',
    (extension) => {
      expect(servi.test(nomServi('B1-03_ventes', EMPREINTE, extension))).toBe(
        true,
      );
    },
  );

  it.each([
    'B1-03_ventes.0c1d2e3.xlsx',
    'B1-03_ventes.0C1D2E3F.xlsx',
    'B1-03_ventes.0c1d2e3f.xlsm',
    'B1 03.0c1d2e3f.xlsx',
  ])('refuse %s', (nom) => {
    expect(servi.test(nom)).toBe(false);
  });
});
