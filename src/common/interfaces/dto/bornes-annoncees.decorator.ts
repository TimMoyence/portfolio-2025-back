import { applyDecorators } from '@nestjs/common';
import { ApiProperty, type ApiPropertyOptions } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsInt,
  Matches,
  Max,
  Min,
  type ValidationOptions,
} from 'class-validator';

export const EntierBorne = (min: number, max?: number): PropertyDecorator =>
  applyDecorators(
    ApiProperty({ type: 'integer', minimum: min, maximum: max }),
    IsInt(),
    Min(min),
    ...(max === undefined ? [] : [Max(max)]),
  );

export const Motif = (
  expression: RegExp,
  options?: ValidationOptions,
): PropertyDecorator =>
  applyDecorators(
    ApiProperty({ pattern: expression.source }),
    Matches(expression, options),
  );

export const AuPlusElements = (max: number): PropertyDecorator =>
  applyDecorators(ApiProperty({ maxItems: max }), ArrayMaxSize(max));

type SchemaDesValeurs = NonNullable<ApiPropertyOptions['additionalProperties']>;

export const DictionnaireBorne = (
  entreesMax: number,
  cleMax: number,
  valeurs: SchemaDesValeurs,
): PropertyDecorator => {
  const schema: ApiPropertyOptions & { 'x-propertyNames': SchemaDesValeurs } = {
    type: 'object',
    maxProperties: entreesMax,
    'x-propertyNames': { type: 'string', minLength: 1, maxLength: cleMax },
    additionalProperties: valeurs,
  };
  return ApiProperty(schema);
};
