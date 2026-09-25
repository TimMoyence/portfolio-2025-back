import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsString, MaxLength } from 'class-validator';

export function VersionDesConditions(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({ example: '2026-04-10' }),
    IsString(),
    MaxLength(50),
  );
}

export function AcceptationDesConditions(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({ example: '2026-04-10T10:00:00.000Z' }),
    Type(() => Date),
    IsDate(),
  );
}
