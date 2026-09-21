import { BlankFieldError } from './errors/FormationErrors';
import { texteRenseigne } from './TexteRenseigne';

describe('texteRenseigne', () => {
  it('rend le texte sans les blancs qui l entourent', () => {
    expect(texteRenseigne('  Groupe A \n', 'Le nom du groupe')).toBe(
      'Groupe A',
    );
  });

  it('refuse un texte fait uniquement de blancs en nommant le champ', () => {
    expect(() => texteRenseigne(' \t\n ', 'La réponse')).toThrow(
      new BlankFieldError('La réponse'),
    );
  });
});
