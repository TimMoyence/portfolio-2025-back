import { ApiProperty } from '@nestjs/swagger';

export class DetailVerdictResponseDto {
  @ApiProperty({
    description: 'Cellule, carte, ou rang et cle d une ligne de tableau',
    example: 'E3',
  })
  cle: string;

  @ApiProperty({ example: false })
  juste: boolean;

  @ApiProperty({
    nullable: true,
    type: String,
    example: 'Confondre le taux 70 % et la valeur 0,7.',
  })
  libelleConfusion: string | null;
}

export class SubmitProductionResponseDto {
  @ApiProperty({ example: false })
  correcte: boolean;

  @ApiProperty({
    description: 'Part des attendus justes, de 0 a 1',
    example: 0.7647,
  })
  score: number;

  @ApiProperty({ type: [DetailVerdictResponseDto] })
  details: DetailVerdictResponseDto[];

  @ApiProperty({
    description: 'Libelle de la confusion la plus frequente du detail',
    nullable: true,
    type: String,
  })
  libelleConfusion: string | null;
}
