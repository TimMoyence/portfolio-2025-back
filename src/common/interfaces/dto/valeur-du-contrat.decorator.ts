import { applyDecorators } from '@nestjs/common';
import {
  ApiProperty,
  ApiPropertyOptional,
  type ApiPropertyOptions,
} from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

interface OptionsDeValeur {
  readonly facultative?: boolean;
  readonly chaque?: boolean;
  readonly documentation?: ApiPropertyOptions;
}

export function ValeurDuContrat(
  valeurs: readonly (string | number)[],
  enumName: string,
  { facultative = false, chaque = false, documentation }: OptionsDeValeur = {},
): PropertyDecorator {
  const schema = {
    ...documentation,
    enum: [...valeurs],
    enumName,
    isArray: chaque,
  } as ApiPropertyOptions;
  return applyDecorators(
    ...(facultative
      ? [ApiPropertyOptional(schema), IsOptional()]
      : [ApiProperty(schema)]),
    IsIn(valeurs, { each: chaque }),
  );
}
