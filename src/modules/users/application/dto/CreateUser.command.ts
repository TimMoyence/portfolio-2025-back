import type { CreateUserProps } from '../../domain/User';

export type CreateUserCommand = Omit<
  CreateUserProps,
  'passwordHash' | 'googleId' | 'emailVerified'
> & { password: string };

export type InscriptionCommand = Omit<
  CreateUserCommand,
  'updatedOrCreatedBy' | 'roles' | 'isActive'
>;

export interface InscriptionResult {
  message: string;
}
