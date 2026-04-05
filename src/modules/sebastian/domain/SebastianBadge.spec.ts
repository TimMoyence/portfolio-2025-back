import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { SebastianBadge } from './SebastianBadge';

describe('SebastianBadge', () => {
  const validProps = {
    userId: 'user-1',
    badgeKey: 'first-log',
    category: 'global' as const,
  };

  describe('create()', () => {
    it('devrait creer un badge valide', () => {
      const badge = SebastianBadge.create(validProps);

      expect(badge.userId).toBe('user-1');
      expect(badge.badgeKey).toBe('first-log');
      expect(badge.category).toBe('global');
      expect(badge.unlockedAt).toBeInstanceOf(Date);
      expect(badge.id).toBeUndefined();
    });

    it('devrait creer un badge alcool valide', () => {
      const badge = SebastianBadge.create({
        ...validProps,
        badgeKey: 'zen-monk-7',
        category: 'alcohol',
      });

      expect(badge.badgeKey).toBe('zen-monk-7');
      expect(badge.category).toBe('alcohol');
    });

    it('devrait creer un badge cafe valide', () => {
      const badge = SebastianBadge.create({
        ...validProps,
        badgeKey: 'espresso-machine',
        category: 'coffee',
      });

      expect(badge.badgeKey).toBe('espresso-machine');
      expect(badge.category).toBe('coffee');
    });

    it("devrait rejeter si l'userId est vide", () => {
      expect(() =>
        SebastianBadge.create({ ...validProps, userId: '  ' }),
      ).toThrow(DomainValidationError);
    });

    it("devrait rejeter si l'userId est une chaine vide", () => {
      expect(() =>
        SebastianBadge.create({ ...validProps, userId: '' }),
      ).toThrow(DomainValidationError);
    });

    it('devrait rejeter un badgeKey invalide', () => {
      expect(() =>
        SebastianBadge.create({ ...validProps, badgeKey: 'inexistant' }),
      ).toThrow(DomainValidationError);
    });

    it('devrait rejeter une categorie invalide', () => {
      expect(() =>
        SebastianBadge.create({
          ...validProps,
          category: 'soda' as 'alcohol' | 'coffee' | 'global',
        }),
      ).toThrow(DomainValidationError);
    });
  });

  describe('fromPersistence()', () => {
    it('devrait reconstruire un badge depuis la persistence sans validation', () => {
      const badge = SebastianBadge.fromPersistence({
        id: 'badge-1',
        userId: 'user-1',
        badgeKey: 'first-log',
        category: 'global',
        unlockedAt: new Date('2026-03-15'),
      });

      expect(badge.id).toBe('badge-1');
      expect(badge.userId).toBe('user-1');
      expect(badge.badgeKey).toBe('first-log');
      expect(badge.category).toBe('global');
      expect(badge.unlockedAt).toEqual(new Date('2026-03-15'));
    });
  });
});
