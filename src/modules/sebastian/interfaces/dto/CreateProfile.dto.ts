import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

/** DTO de requete pour definir le profil BAC. */
export class CreateProfileDto {
  @ApiProperty({ example: 70, description: 'Poids en kg (30-300)' })
  @IsNumber()
  @Min(30)
  @Max(300)
  weightKg: number;

  @ApiProperty({
    example: 0.68,
    description: 'Facteur Widmark (0.68 homme, 0.55 femme)',
  })
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  widmarkR: number;
}
