import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PUBLISHABLE_STATUSES } from '../../domain/types/publishable-status';
import { EntierBorne, Motif } from './bornes-annoncees.decorator';
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
    Motif(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
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
    ApiProperty({ example: 0, required: false }),
    IsOptional(),
    EntierBorne(0, 10000),
  );
}
