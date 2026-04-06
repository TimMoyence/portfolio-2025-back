import { Inject, Injectable } from '@nestjs/common';
import type { ISebastianProfileRepository } from '../../domain/ISebastianProfile.repository';
import { SebastianProfile } from '../../domain/SebastianProfile';
import { SEBASTIAN_PROFILE_REPOSITORY } from '../../domain/token';
import type { SetProfileCommand } from '../dto/SetProfile.command';

/** Cree ou met a jour le profil BAC d'un utilisateur. */
@Injectable()
export class SetProfileUseCase {
  constructor(
    @Inject(SEBASTIAN_PROFILE_REPOSITORY)
    private readonly profileRepo: ISebastianProfileRepository,
  ) {}

  /** Execute la creation ou mise a jour du profil. */
  async execute(command: SetProfileCommand): Promise<SebastianProfile> {
    const profile = SebastianProfile.create({
      userId: command.userId,
      weightKg: command.weightKg,
      widmarkR: command.widmarkR,
    });
    return this.profileRepo.createOrUpdate(profile);
  }
}
