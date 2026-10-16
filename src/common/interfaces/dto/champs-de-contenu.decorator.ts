import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { PUBLISHABLE_STATUSES } from '../../domain/types/publishable-status';
import {
  AuMoinsCaracteres,
  AuPlusCaracteres,
} from './longueur-de-texte.decorator';

export function SlugDeContenu(exemple: string): PropertyDecorator {
  return applyDecorators(
    ApiProperty({ example: exemple }),
    IsString(),
    AuMoinsCaracteres(2),
    AuPlusCaracteres(120),
    Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  );
}

export function StatutDePublication(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      example: 'PUBLISHED',
      required: false,
      enum: PUBLISHABLE_STATUSES,
    }),
    IsOptional(),
    IsString(),
    IsIn(PUBLISHABLE_STATUSES),
  );
}

export function StatutPublie(): PropertyDecorator {
  return ApiProperty({
    example: 'PUBLISHED',
    enum: [...PUBLISHABLE_STATUSES],
  });
}

export function RangDAffichage(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({ example: 0, required: false, minimum: 0, maximum: 10000 }),
    IsOptional(),
    IsInt(),
    Min(0),
    Max(10000),
  );
}
