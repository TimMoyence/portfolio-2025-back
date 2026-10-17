import { BlankFieldError, FieldTooLongError } from './errors/FormationErrors';
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

  it('mesure le plafond sur le texte rogne, en points de code comme la colonne varchar', () => {
    const sourires = String.fromCodePoint(0x1f600).repeat(80);

    expect(texteRenseigne(` ${sourires} `, 'Le prénom', 80)).toBe(sourires);
    expect(() =>
      texteRenseigne(
        String.fromCodePoint(0x2764, 0xfe0f).repeat(41),
        'Le prénom',
        80,
      ),
    ).toThrow(new FieldTooLongError('Le prénom', 80));
  });
});
