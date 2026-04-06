import { Inject, Injectable } from '@nestjs/common';
import { BacCalculator, type BacResult } from '../../domain/BacCalculator';
import type { ISebastianEntryRepository } from '../../domain/ISebastianEntry.repository';
import type { ISebastianProfileRepository } from '../../domain/ISebastianProfile.repository';
import {
  DEFAULT_PROFILE,
  SebastianProfile,
} from '../../domain/SebastianProfile';
import {
  SEBASTIAN_ENTRY_REPOSITORY,
  SEBASTIAN_PROFILE_REPOSITORY,
} from '../../domain/token';
import type { GetBacQuery } from '../dto/GetBac.query';

/** Calcule le taux d'alcoolemie actuel d'un utilisateur. */
@Injectable()
export class CalculateBacUseCase {
  constructor(
    @Inject(SEBASTIAN_ENTRY_REPOSITORY)
    private readonly entryRepo: ISebastianEntryRepository,
    @Inject(SEBASTIAN_PROFILE_REPOSITORY)
    private readonly profileRepo: ISebastianProfileRepository,
  ) {}

  /** Execute le calcul BAC a partir des consommations du jour. */
  async execute(query: GetBacQuery): Promise<BacResult> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const entries = await this.entryRepo.findByFilters({
      userId: query.userId,
      from: today,
      to: today,
    });
    const profile = await this.profileRepo.findByUserId(query.userId);
    const effectiveProfile =
      profile ??
      SebastianProfile.fromPersistence({
        id: '',
        userId: query.userId,
        weightKg: DEFAULT_PROFILE.weightKg,
        widmarkR: DEFAULT_PROFILE.widmarkR,
        createdAt: now,
        updatedAt: now,
      });
    return BacCalculator.calculateBacCurve(entries, effectiveProfile, now);
  }
}
