import { normalizeSeverity, severityRank } from './severity.util';

describe('normalizeSeverity', () => {
  it.each([
    ['high', 'high'],
    ['HIGH', 'high'],
    ['critical', 'high'],
    ['Critical', 'high'],
    ['low', 'low'],
    ['LOW', 'low'],
    ['medium', 'medium'],
    ['urgent', 'medium'],
    [undefined, 'medium'],
    [42, 'medium'],
  ])('range %p en %p', (valeur, attendue) => {
    expect(normalizeSeverity(valeur)).toBe(attendue);
  });
});

describe('severityRank', () => {
  it('classe high avant medium avant low', () => {
    expect([
      severityRank('high'),
      severityRank('medium'),
      severityRank('low'),
    ]).toEqual([3, 2, 1]);
  });
});
