import { ApiProperty } from '@nestjs/swagger';

export class EcranPublicResponseDto {
  @ApiProperty({ example: 'E-OUV-RAPPEL' })
  id: string;

  @ApiProperty({
    description: 'Brique qui rend l ecran',
    example: 'fp-recall',
  })
  type: string;

  @ApiProperty({ description: 'Duree de l ecran en minutes', example: 4 })
  duree: number;

  @ApiProperty({ example: true })
  interactif: boolean;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'Proprietes de la brique, rangees sous la propriete de la brique ; sans solution, piege, confusion ni notes',
  })
  donnees: Record<string, unknown>;
}

export class SujetResponseDto {
  @ApiProperty({ description: 'Slug du cours', example: 'b1-01-proportions' })
  id: string;

  @ApiProperty({ example: 'Proportions, taux et évolutions' })
  titre: string;

  @ApiProperty({ example: 'BTS CG 2' })
  niveau: string;

  @ApiProperty({ description: 'Duree du cours en minutes', example: 195 })
  duree: number;

  @ApiProperty({ type: [String], example: ['proportion'] })
  concepts: string[];

  @ApiProperty({ type: [EcranPublicResponseDto] })
  ecrans: EcranPublicResponseDto[];
}
