import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { SebastianProfile } from './SebastianProfile';

describe('SebastianProfile', () => {
  const validProps = {
    userId: 'user-1',
    weightKg: 70,
    widmarkR: 0.68,
  };

  describe('create()', () => {
    it('devrait creer un profil valide', () => {
      const profile = SebastianProfile.create(validProps);

      expect(profile.userId).toBe('user-1');
      expect(profile.weightKg).toBe(70);
      expect(profile.widmarkR).toBe(0.68);
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.updatedAt).toBeInstanceOf(Date);
    });

    it("devrait rejeter si l'userId est vide", () => {
      expect(() =>
        SebastianProfile.create({ ...validProps, userId: '  ' }),
      ).toThrow(DomainValidationError);
    });

    it('devrait rejeter un poids inferieur a 30 kg', () => {
      expect(() =>
        SebastianProfile.create({ ...validProps, weightKg: 20 }),
      ).toThrow(DomainValidationError);
    });

    it('devrait rejeter un poids superieur a 300 kg', () => {
      expect(() =>
        SebastianProfile.create({ ...validProps, weightKg: 350 }),
      ).toThrow(DomainValidationError);
    });

    it('devrait rejeter un facteur Widmark inferieur a 0.1', () => {
      expect(() =>
        SebastianProfile.create({ ...validProps, widmarkR: 0.05 }),
      ).toThrow(DomainValidationError);
    });

    it('devrait rejeter un facteur Widmark superieur a 1.0', () => {
      expect(() =>
        SebastianProfile.create({ ...validProps, widmarkR: 1.5 }),
      ).toThrow(DomainValidationError);
    });
  });

  describe('fromPersistence()', () => {
    it('devrait reconstruire un profil depuis la persistence', () => {
      const profile = SebastianProfile.fromPersistence({
        id: 'profile-1',
        userId: 'user-1',
        weightKg: 80,
        widmarkR: 0.55,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-03-01'),
      });

      expect(profile.id).toBe('profile-1');
      expect(profile.userId).toBe('user-1');
      expect(profile.weightKg).toBe(80);
      expect(profile.widmarkR).toBe(0.55);
      expect(profile.createdAt).toEqual(new Date('2026-01-01'));
      expect(profile.updatedAt).toEqual(new Date('2026-03-01'));
    });
  });
});
