import { trousseauHmac } from './trousseau-hmac';

describe('trousseauHmac', () => {
  it('lit chaque entree identifiant:secret, le secret gardant ses deux-points', () => {
    expect(
      trousseauHmac({ MORNING_BRIEF_HMAC_KEYS: ' a:un:secret , b:autre ' }),
    ).toEqual([
      { id: 'a', secret: 'un:secret' },
      { id: 'b', secret: 'autre' },
    ]);
  });

  it.each(['sans-separateur', ':sans-identifiant'])(
    'rend une entree "%s" sans identifiant ni secret',
    (entree) => {
      expect(trousseauHmac({ MORNING_BRIEF_HMAC_KEYS: entree })).toEqual([
        { id: '', secret: '' },
      ]);
    },
  );

  it('rend un trousseau vide quand la variable est absente ou blanche', () => {
    expect(trousseauHmac({})).toEqual([]);
    expect(trousseauHmac({ MORNING_BRIEF_HMAC_KEYS: '   ' })).toEqual([]);
  });
});
