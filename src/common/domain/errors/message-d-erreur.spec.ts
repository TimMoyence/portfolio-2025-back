import { messageDErreur } from './message-d-erreur';

describe('messageDErreur', () => {
  it('rend le message d une erreur', () => {
    expect(messageDErreur(new TypeError('connexion refusee'))).toBe(
      'connexion refusee',
    );
  });

  it('rend la forme textuelle de ce qui a ete lance sans etre une erreur', () => {
    expect(messageDErreur('delai depasse')).toBe('delai depasse');
    expect(messageDErreur(42)).toBe('42');
    expect(messageDErreur(undefined)).toBe('undefined');
  });
});
