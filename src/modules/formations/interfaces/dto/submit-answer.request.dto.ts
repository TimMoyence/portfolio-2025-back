import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import type { AnswerValue } from '../../domain/AnswerGrading';

const DUREE_MAX_MS = 5 * 60 * 60 * 1000;

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

  @ApiProperty({ example: 42000 })
  @IsInt()
  @Min(0)
  @Max(DUREE_MAX_MS)
  dureeMs: number;
}
