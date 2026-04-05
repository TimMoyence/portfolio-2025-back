import { TelegramLink } from './TelegramLink';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';

describe('TelegramLink', () => {
  describe('create', () => {
    it('cree un lien avec des proprietes valides', () => {
      const link = TelegramLink.create({
        telegramUserId: 123456,
        userId: 'user-1',
      });

      expect(link.telegramUserId).toBe(123456);
      expect(link.userId).toBe('user-1');
      expect(link.linkedAt).toBeInstanceOf(Date);
      expect(link.id).toBeUndefined();
    });

    it('rejette un telegramUserId negatif', () => {
      expect(() =>
        TelegramLink.create({ telegramUserId: -1, userId: 'user-1' }),
      ).toThrow(DomainValidationError);
    });

    it('rejette un telegramUserId nul', () => {
      expect(() =>
        TelegramLink.create({ telegramUserId: 0, userId: 'user-1' }),
      ).toThrow(DomainValidationError);
    });

    it('rejette un userId vide', () => {
      expect(() =>
        TelegramLink.create({ telegramUserId: 123, userId: '' }),
      ).toThrow(DomainValidationError);
    });

    it('rejette un userId avec espaces seulement', () => {
      expect(() =>
        TelegramLink.create({ telegramUserId: 123, userId: '   ' }),
      ).toThrow(DomainValidationError);
    });
  });

  describe('fromPersistence', () => {
    it('reconstruit un lien depuis la persistence', () => {
      const date = new Date('2026-04-01');
      const link = TelegramLink.fromPersistence({
        id: 'link-1',
        telegramUserId: 123456,
        userId: 'user-1',
        linkedAt: date,
      });

      expect(link.id).toBe('link-1');
      expect(link.telegramUserId).toBe(123456);
      expect(link.userId).toBe('user-1');
      expect(link.linkedAt).toBe(date);
    });

    it('convertit un telegramUserId string en number', () => {
      const link = TelegramLink.fromPersistence({
        id: 'link-1',
        telegramUserId: '123456' as unknown as number,
        userId: 'user-1',
        linkedAt: new Date(),
      });

      expect(link.telegramUserId).toBe(123456);
    });
  });
});
