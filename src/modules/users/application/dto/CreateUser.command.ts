import type { CreateUserProps, User } from '../../domain/User';

export type CreateUserCommand = Omit<
  CreateUserProps,
  'passwordHash' | 'googleId' | 'emailVerified'
> & { password: string };

export interface CreateUserResult {
  user: User;
}
