import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type { Solution } from '../../domain/AnswerGrading';
import type { Bareme, BaremeTirage, QuestionType } from '../../domain/Bareme';
import { QUESTION_TYPES } from '../../domain/Bareme';
import { TOLERANCE_TYPES } from '../../domain/GradingCore';
import type { ToleranceType } from '../../domain/GradingCore';

const MAX_QUESTIONS = 200;
const MAX_TIRAGES = 200;

export class BaremeToleranceDto {
  @ApiProperty({ enum: TOLERANCE_TYPES, example: 'relative' })
  @IsIn(TOLERANCE_TYPES as unknown as readonly string[])
  type: ToleranceType;

  @ApiProperty({ example: 0.01 })
  @IsNumber()
  @Min(0)
  valeur: number;
}

export class BaremeQuestionDto {
  @ApiProperty({ example: 'Q-CAP-03' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  id: string;

  @ApiProperty({ enum: QUESTION_TYPES, example: 'numeric' })
  @IsIn(QUESTION_TYPES as unknown as readonly string[])
  type: QuestionType;

  @ApiProperty({ example: 'interet-compose' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  concept: string;

  @ApiPropertyOptional({ type: BaremeToleranceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BaremeToleranceDto)
  tolerance?: BaremeToleranceDto;

  @ApiProperty({ example: true })
  @IsBoolean()
  noteCompte: boolean;
}

export class BaremeTirageDto implements BaremeTirage {
  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(0)
  seed: number;

  @ApiProperty({
    description: 'Corrige du tirage, indexe par identifiant de question',
    example: { 'Q-CAP-03': { valeur: 1338.23, pieges: [] } },
  })
  @IsObject()
  solutions: Readonly<Record<string, Solution>>;
}

export class BaremeDto implements Bareme {
  @ApiProperty({ enum: [1], example: 1 })
  @IsIn([1])
  version: 1;

  @ApiProperty({ type: [BaremeQuestionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_QUESTIONS)
  @ValidateNested({ each: true })
  @Type(() => BaremeQuestionDto)
  questions: BaremeQuestionDto[];

  @ApiProperty({ type: [BaremeTirageDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_TIRAGES)
  @ValidateNested({ each: true })
  @Type(() => BaremeTirageDto)
  tirages: BaremeTirageDto[];
}

export class OpenSessionRequestDto {
  @ApiProperty({ example: 'maths-bts-suites-numeriques' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MinLength(1)
  @MaxLength(120)
  courseSlug: string;

  @ApiProperty({ type: BaremeDto })
  @ValidateNested()
  @Type(() => BaremeDto)
  bareme: BaremeDto;
}
