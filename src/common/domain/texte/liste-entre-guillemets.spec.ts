import { listeEntreGuillemets } from './liste-entre-guillemets';

describe('listeEntreGuillemets', () => {
  it('encadre chaque valeur de guillemets français et les sépare par une virgule', () => {
    expect(listeEntreGuillemets(['a', 'b c'])).toBe('« a », « b c »');
  });

  it('rend une chaîne vide pour une liste vide', () => {
    expect(listeEntreGuillemets([])).toBe('');
  });
});
