import type { IPasswordResetNotifier } from '../../src/modules/users/domain/IPasswordResetNotifier';

/** Cree un mock du notifier de reset password. */
export function createMockPasswordResetNotifier(): jest.Mocked<IPasswordResetNotifier> {
  return {
    sendPasswordResetEmail: jest.fn(),
  };
}
