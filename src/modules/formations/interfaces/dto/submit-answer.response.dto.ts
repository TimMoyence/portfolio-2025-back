import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerResponseDto {
  @ApiProperty({ example: false })
  correcte: boolean;

  @ApiProperty({
    description:
      'Etiquette de la confusion detectee, jamais la reponse attendue',
    example: 'interet-simple',
    nullable: true,
  })
  misconception: string | null;
}
