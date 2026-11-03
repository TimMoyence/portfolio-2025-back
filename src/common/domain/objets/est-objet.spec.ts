import { estObjet } from './est-objet';

describe('estObjet', () => {
  it('reconnaît un objet, jamais un tableau ni null', () => {
    expect(estObjet({ a: 1 })).toBe(true);
    expect(estObjet([1])).toBe(false);
    expect(estObjet(null)).toBe(false);
    expect(estObjet(undefined)).toBe(false);
    expect(estObjet('texte')).toBe(false);
  });
});
