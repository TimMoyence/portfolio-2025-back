import { sansLesCles } from './sans-les-cles';

describe('REF-02 · sansLesCles', () => {
  it('retire les clés demandées et garde les autres avec leur valeur', () => {
    expect(
      sansLesCles({ id: 'q1', corrige: 4, texte: 'Combien ?' }, ['corrige']),
    ).toEqual({ id: 'q1', texte: 'Combien ?' });
  });

  it('rend une copie égale quand aucune clé demandée n’est présente', () => {
    const objet = { id: 'q1' };

    expect(sansLesCles(objet, ['corrige'])).toEqual({ id: 'q1' });
    expect(sansLesCles(objet, [])).not.toBe(objet);
  });

  it('rend un objet vide quand toutes ses clés sont retirées', () => {
    expect(sansLesCles({ corrige: 4 }, ['corrige', 'banque'])).toEqual({});
  });
});
