import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StrategieDefiResponseDto {
  @ApiProperty({ example: 'somme-des-taux' })
  id: string;

  @ApiProperty({ example: 'Additionner les taux annoncés' })
  libelle: string;

  @ApiPropertyOptional({
    description:
      'Present une fois le defi revele par le formateur ou la seance terminee',
    example: true,
  })
  fausse?: boolean;
}

export class StrategiesDefiResponseDto {
  @ApiProperty({ type: [StrategieDefiResponseDto] })
  strategies: readonly StrategieDefiResponseDto[];
}
