import { Inject, Injectable } from '@nestjs/common';
import type { ISebastianProfileRepository } from '../../domain/ISebastianProfile.repository';
import {
  DEFAULT_PROFILE,
  SebastianProfile,
} from '../../domain/SebastianProfile';
import { SEBASTIAN_PROFILE_REPOSITORY } from '../../domain/token';

/** Recupere le profil BAC d'un utilisateur ou retourne les valeurs par defaut. */
@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(SEBASTIAN_PROFILE_REPOSITORY)
    private readonly profileRepo: ISebastianProfileRepository,
  ) {}

  /** Execute la recuperation du profil. */
  async execute(userId: string): Promise<SebastianProfile> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (profile) return profile;
    const now = new Date();
    return SebastianProfile.fromPersistence({
      id: '',
      userId,
      weightKg: DEFAULT_PROFILE.weightKg,
      widmarkR: DEFAULT_PROFILE.widmarkR,
      createdAt: now,
      updatedAt: now,
    });
  }
}
