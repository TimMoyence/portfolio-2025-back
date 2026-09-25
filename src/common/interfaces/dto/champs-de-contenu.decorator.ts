import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PUBLISHABLE_STATUSES } from '../../domain/types/publishable-status';

export function SlugDeContenu(exemple: string): PropertyDecorator {
  return applyDecorators(
    ApiProperty({ example: exemple }),
    IsString(),
    MinLength(2),
    MaxLength(120),
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
