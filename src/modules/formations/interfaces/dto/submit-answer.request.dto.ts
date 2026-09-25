import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import type { AnswerValue } from '../../domain/AnswerGrading';
import { DureeDeReponse } from './duree-de-reponse.decorator';

export class SubmitAnswerRequestDto {
  @ApiProperty({ example: 'Q-CAP-03' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  questionId: string;

  @ApiProperty({
    description: 'Reponse brute de l etudiant, jamais corrigee cote client',
    oneOf: [{ type: 'number' }, { type: 'string' }],
    example: 1300,
  })
  @ValidateIf((dto: SubmitAnswerRequestDto) => typeof dto.valeur !== 'number')
  @IsString()
  @MaxLength(200)
  valeur: AnswerValue;

  @DureeDeReponse(42000)
  dureeMs: number;
}
