import { tronquer } from './tronquer';

describe('tronquer', () => {
  it('rend le texte intact quand il tient dans la limite', () => {
    expect(tronquer('bonjour', 7)).toBe('bonjour');
  });

  it('coupe à la limite en comptant l ellipse', () => {
    expect(tronquer('bonjour le monde', 8)).toBe('bonjour…');
  });

  it('retire le blanc laissé avant l ellipse', () => {
    expect(tronquer('abc def ghi', 5)).toBe('abc…');
  });

  it('compte en points de code et ne coupe pas une paire de substitution', () => {
    expect(tronquer('😀😀😀😀', 3)).toBe('😀😀…');
  });

  it('se réduit à l ellipse quand la limite vaut un', () => {
    expect(tronquer('bonjour', 1)).toBe('…');
  });
});
