import { dateLongue } from './date-longue';

describe('dateLongue', () => {
  it('écrit le jour, le mois en toutes lettres et l année', () => {
    expect(dateLongue(new Date('2026-04-15T10:00:00Z'))).toBe('15 avril 2026');
  });
});
