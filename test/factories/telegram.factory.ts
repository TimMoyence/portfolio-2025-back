import type { TelegramLink } from '../../src/modules/sebastian/domain/TelegramLink';
import type { ITelegramLinkRepository } from '../../src/modules/sebastian/domain/ITelegramLink.repository';

export { buildUser, createMockUsersRepo } from './user.factory';

export function buildTelegramLink(
  overrides?: Partial<TelegramLink>,
): TelegramLink {
  return {
    id: 'link-1',
    telegramUserId: 123456789,
    userId: 'user-1',
    linkedAt: new Date('2026-04-01'),
    ...overrides,
  } as TelegramLink;
}

export function createMockTelegramLinkRepo(): jest.Mocked<ITelegramLinkRepository> {
  return {
    create: jest.fn(),
    findByTelegramUserId: jest.fn(),
    findByUserId: jest.fn(),
    delete: jest.fn(),
  };
}
