import { Inject, Injectable } from '@nestjs/common';
import type { ISebastianProfileRepository } from '../../domain/ISebastianProfile.repository';
import { SebastianProfile } from '../../domain/SebastianProfile';
import { SEBASTIAN_PROFILE_REPOSITORY } from '../../domain/token';
import type { SetProfileCommand } from '../dto/SetProfile.command';

@Injectable()
export class SetProfileUseCase {
  constructor(
    @Inject(SEBASTIAN_PROFILE_REPOSITORY)
    private readonly profileRepo: ISebastianProfileRepository,
  ) {}

  async execute(command: SetProfileCommand): Promise<SebastianProfile> {
    const profile = SebastianProfile.create({
      userId: command.userId,
      weightKg: command.weightKg,
      widmarkR: command.widmarkR,
    });
    return this.profileRepo.createOrUpdate(profile);
  }
}
