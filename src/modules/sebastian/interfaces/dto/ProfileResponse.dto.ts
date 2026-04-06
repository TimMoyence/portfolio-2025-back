import { ApiProperty } from '@nestjs/swagger';
import type { SebastianProfile } from '../../domain/SebastianProfile';

/** DTO de reponse pour le profil BAC. */
export class ProfileResponseDto {
  @ApiProperty() weightKg: number;
  @ApiProperty() widmarkR: number;

  /** Convertit un profil domaine en DTO de reponse. */
  static fromDomain(profile: SebastianProfile): ProfileResponseDto {
    const dto = new ProfileResponseDto();
    dto.weightKg = profile.weightKg;
    dto.widmarkR = profile.widmarkR;
    return dto;
  }
}
