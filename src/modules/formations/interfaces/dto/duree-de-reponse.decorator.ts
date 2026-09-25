import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

const DUREE_MAX_MS = 5 * 60 * 60 * 1000;

export function DureeDeReponse(exemple: number): PropertyDecorator {
  return applyDecorators(
    ApiProperty({ example: exemple }),
    IsInt(),
    Min(0),
    Max(DUREE_MAX_MS),
  );
}
