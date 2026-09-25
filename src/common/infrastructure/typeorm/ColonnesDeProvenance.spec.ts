import { valeursDeProvenance } from './ColonnesDeProvenance';

describe('valeursDeProvenance', () => {
  it('reporte la provenance et attribue un identifiant de requete', () => {
    const valeurs = valeursDeProvenance({
      ip: '192.0.2.1',
      userAgent: 'Navigateur/1.0',
      referer: 'https://a.fr/',
    });

    expect(valeurs).toEqual({
      ip: '192.0.2.1',
      userAgent: 'Navigateur/1.0',
      referer: 'https://a.fr/',
      requestId: expect.stringMatching(/^[0-9a-f-]{36}$/) as string,
    });
  });

  it('laisse la colonne vide quand la provenance est nulle', () => {
    const valeurs = valeursDeProvenance({
      ip: null,
      userAgent: null,
      referer: undefined,
    });

    expect(valeurs.ip).toBeUndefined();
    expect(valeurs.userAgent).toBeUndefined();
    expect(valeurs.referer).toBeUndefined();
  });

  it('attribue un identifiant distinct a chaque requete', () => {
    expect(valeursDeProvenance({}).requestId).not.toBe(
      valeursDeProvenance({}).requestId,
    );
  });
});
