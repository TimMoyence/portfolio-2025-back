import { ApiProperty } from '@nestjs/swagger';
import type { SebastianProfile } from '../../domain/SebastianProfile';

export class ProfileResponseDto {
  @ApiProperty() weightKg: number;
  @ApiProperty() widmarkR: number;

  static fromDomain(profile: SebastianProfile): ProfileResponseDto {
    const dto = new ProfileResponseDto();
    dto.weightKg = profile.weightKg;
    dto.widmarkR = profile.widmarkR;
    return dto;
  }
}
