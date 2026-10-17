import { applyDecorators, Sse } from '@nestjs/common';
import { ApiOkResponse, ApiProduces } from '@nestjs/swagger';

export const FluxDEvenements = (
  chemin: string,
  description: string,
): MethodDecorator =>
  applyDecorators(
    Sse(chemin),
    ApiProduces('text/event-stream'),
    ApiOkResponse({ description, schema: { type: 'string' } }),
  );
