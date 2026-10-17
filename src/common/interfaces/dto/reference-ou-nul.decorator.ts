import type { Type } from '@nestjs/common';
import { ApiProperty, getSchemaPath } from '@nestjs/swagger';

const NUL = { type: 'object', nullable: true, enum: [null] };

export const ReferenceOuNul = (
  modeles: readonly Type<unknown>[],
  description?: string,
): PropertyDecorator =>
  ApiProperty({
    oneOf: [...modeles.map((modele) => ({ $ref: getSchemaPath(modele) })), NUL],
    description,
  });
