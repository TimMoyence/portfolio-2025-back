import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';
import { TexteSaisi } from './longueur-de-texte.decorator';

export function VersionDesConditions(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({ example: '2026-04-10' }),
    TexteSaisi(1, 50),
  );
}

export function AcceptationDesConditions(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({ example: '2026-04-10T10:00:00.000Z' }),
    Type(() => Date),
    IsDate(),
  );
}
