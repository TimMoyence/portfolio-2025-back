import { Inject, Injectable } from '@nestjs/common';
import { UserNotFoundError } from '../../../common/domain/errors/UserNotFoundError';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import type { User } from '../domain/User';
import type { UpdateProfileCommand } from './dto/UpdateProfile.command';
import { UsersMapper } from './mappers/UsersMapper';

/**
 * Met a jour le profil de l'utilisateur connecte (self-update).
 * Seuls le prenom, le nom et le telephone sont modifiables.
 */
@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
  ) {}

  /**
   * Execute la mise a jour du profil.
   * @param userId - Identifiant de l'utilisateur (extrait du JWT)
   * @param command - Champs a mettre a jour
   * @returns L'utilisateur mis a jour
   * @throws UserNotFoundError si l'utilisateur n'existe pas
   */
  async execute(userId: string, command: UpdateProfileCommand): Promise<User> {
    const existing = await this.repo.findById(userId);

    if (!existing) {
      throw new UserNotFoundError(`User with id ${userId} was not found`);
    }

    const updatePayload = UsersMapper.fromUpdateCommand({
      firstName: command.firstName,
      lastName: command.lastName,
      phone: command.phone,
      updatedOrCreatedBy: 'self-update',
    });

    return this.repo.update(userId, updatePayload);
  }
}
