import { gradeAnswer, matchesSolution } from './AnswerGrading';

describe('matchesSolution', () => {
  it('accepte une valeur exacte sans tolerance', () => {
    expect(matchesSolution(1338.23, 1338.23)).toBe(true);
  });

  it('accepte un ecart dans la tolerance relative', () => {
    expect(
      matchesSolution(1338.23, 1340, { type: 'relative', valeur: 0.005 }),
    ).toBe(true);
  });

  it('refuse un ecart hors tolerance relative', () => {
    expect(
      matchesSolution(1300, 1340, { type: 'relative', valeur: 0.005 }),
    ).toBe(false);
  });

  it('accepte un ecart dans la tolerance absolue', () => {
    expect(
      matchesSolution(1338.2, 1338.23, { type: 'absolue', valeur: 0.05 }),
    ).toBe(true);
  });

  it('compare a la decimale demandee', () => {
    expect(
      matchesSolution(1338.234, 1338.231, { type: 'decimales', valeur: 2 }),
    ).toBe(true);
    expect(
      matchesSolution(1338.24, 1338.23, { type: 'decimales', valeur: 2 }),
    ).toBe(false);
  });

  it('gere une solution nulle en tolerance relative', () => {
    expect(matchesSolution(0, 0, { type: 'relative', valeur: 0.005 })).toBe(
      true,
    );
    expect(matchesSolution(0.1, 0, { type: 'relative', valeur: 0.005 })).toBe(
      false,
    );
  });

  it('compare les valeurs textuelles a l identique', () => {
    expect(matchesSolution('b', 'b')).toBe(true);
    expect(matchesSolution('B', 'b')).toBe(false);
  });

  it('refuse une valeur non numerique face a une solution numerique', () => {
    expect(matchesSolution('mille', 1338.23)).toBe(false);
  });
});

describe('gradeAnswer', () => {
  it('retourne correcte sans misconception quand la reponse est juste', () => {
    const result = gradeAnswer(1338.23, {
      valeur: 1338.23,
      pieges: [{ valeur: 1300, misconception: 'interet-simple' }],
    });
    expect(result).toEqual({ correcte: true, misconception: null });
  });

  it('identifie le piege declenche quand la reponse est fausse', () => {
    const result = gradeAnswer(1300, {
      valeur: 1338.23,
      pieges: [{ valeur: 1300, misconception: 'interet-simple' }],
    });
    expect(result).toEqual({
      correcte: false,
      misconception: 'interet-simple',
    });
  });

  it('retourne une misconception nulle pour une erreur non prevue', () => {
    const result = gradeAnswer(42, {
      valeur: 1338.23,
      pieges: [{ valeur: 1300, misconception: 'interet-simple' }],
    });
    expect(result).toEqual({ correcte: false, misconception: null });
  });

  it('traite je ne sais pas comme une erreur sans misconception', () => {
    const result = gradeAnswer('__je_ne_sais_pas__', {
      valeur: 1338.23,
      pieges: [{ valeur: 1300, misconception: 'interet-simple' }],
    });
    expect(result).toEqual({ correcte: false, misconception: null });
  });
});
