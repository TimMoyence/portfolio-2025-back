import { applyDecorators, Sse, type Type } from '@nestjs/common';
import { ApiOkResponse, ApiProduces, getSchemaPath } from '@nestjs/swagger';

export type DonneesParEvenement = Readonly<Record<string, Type<unknown>>>;

export const FluxDEvenements = (
  chemin: string,
  description: string,
  evenements: DonneesParEvenement,
): MethodDecorator =>
  applyDecorators(
    Sse(chemin),
    ApiProduces('text/event-stream'),
    ApiOkResponse({
      description,
      schema: {
        oneOf: Object.entries(evenements).map(([evenement, donnees]) => ({
          type: 'object',
          required: ['event', 'data'],
          properties: {
            event: { type: 'string', enum: [evenement] },
            data: { $ref: getSchemaPath(donnees) },
          },
        })),
      },
    }),
  );
