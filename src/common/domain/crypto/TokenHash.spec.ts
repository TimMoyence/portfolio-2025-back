import { createHash } from 'crypto';
import { emettreJeton, TokenHash } from './TokenHash';

describe('TokenHash', () => {
  it('hache un jeton brut en sha256 hexadecimal', () => {
    expect(TokenHash.fromRaw('abc').value).toBe(
      createHash('sha256').update('abc').digest('hex'),
    );
  });
});

describe('emettreJeton', () => {
  it('emet un jeton brut de 32 octets et l empreinte a stocker', () => {
    const jeton = emettreJeton();

    expect(jeton.brut).toMatch(/^[0-9a-f]{64}$/);
    expect(jeton.empreinte).toBe(TokenHash.fromRaw(jeton.brut).value);
  });

  it('emet un jeton different a chaque appel', () => {
    expect(emettreJeton().brut).not.toBe(emettreJeton().brut);
  });
});
