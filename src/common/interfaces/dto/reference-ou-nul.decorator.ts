import type { Type } from '@nestjs/common';
import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import type { z } from 'zod';
import { referenceAuContrat } from '../http/schemas-du-contrat';

const NUL = { type: 'object', nullable: true, enum: [null] };

export const ReferenceOuNul = (
  modeles: readonly (Type<unknown> | z.ZodType)[],
  description?: string,
): PropertyDecorator =>
  ApiProperty({
    type: Object,
    oneOf: [
      ...modeles.map((modele) =>
        typeof modele === 'function'
          ? { $ref: getSchemaPath(modele) }
          : referenceAuContrat(modele),
      ),
      NUL,
    ],
    description,
  });
