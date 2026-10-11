import { egalEnTempsConstant, empreinteSha256, hmacSha256 } from './empreintes';

describe('empreinteSha256', () => {
  it('rend le condense SHA-256 hexadecimal du texte en UTF-8', () => {
    expect(empreinteSha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});

describe('hmacSha256', () => {
  const ATTENDU =
    'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8';

  it('signe le message avec le secret', () => {
    expect(
      hmacSha256('key', 'The quick brown fox jumps over the lazy dog').toString(
        'hex',
      ),
    ).toBe(ATTENDU);
  });

  it('signe la suite de ses parties comme un seul message', () => {
    expect(
      hmacSha256(
        'key',
        'The quick ',
        Buffer.from('brown fox jumps over the lazy dog'),
      ).toString('hex'),
    ).toBe(ATTENDU);
  });
});

describe('egalEnTempsConstant', () => {
  it.each([
    ['deux textes identiques', 'abc', 'abc', true],
    ['deux textes differents', 'abc', 'abd', false],
    ['deux longueurs differentes', 'abc', 'abcd', false],
    ['un texte vide', '', 'abc', false],
    ['deux octets identiques', Buffer.from([1, 2]), Buffer.from([1, 2]), true],
    ['deux octets differents', Buffer.from([1, 2]), Buffer.from([1]), false],
  ])('compare %s sans lever', (_cas, presente, attendue, egal) => {
    expect(egalEnTempsConstant(presente, attendue)).toBe(egal);
  });
});
