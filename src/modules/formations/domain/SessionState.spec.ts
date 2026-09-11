import { canTransition, SESSION_STATES } from './SessionState';

describe('SessionState', () => {
  it('declare les trois etats', () => {
    expect(SESSION_STATES).toEqual(['attente', 'en_cours', 'terminee']);
  });

  it('autorise attente vers en_cours', () => {
    expect(canTransition('attente', 'en_cours')).toBe(true);
  });

  it('autorise en_cours vers terminee', () => {
    expect(canTransition('en_cours', 'terminee')).toBe(true);
  });

  it('autorise attente vers terminee', () => {
    expect(canTransition('attente', 'terminee')).toBe(true);
  });

  it('refuse de rouvrir une session terminee', () => {
    expect(canTransition('terminee', 'en_cours')).toBe(false);
    expect(canTransition('terminee', 'attente')).toBe(false);
  });

  it('refuse un retour en arriere depuis en_cours', () => {
    expect(canTransition('en_cours', 'attente')).toBe(false);
  });
});
