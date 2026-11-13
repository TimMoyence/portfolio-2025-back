import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { z } from 'zod';
import { REGISTRE_DU_CONTRAT } from '../../domain/liens/registre-du-contrat';
import { sansLesCles } from '../../domain/objets/sans-les-cles';

const PREFIXE_DES_COMPOSANTS = '#/components/schemas/';

export function referenceAuContrat(schema: z.ZodType): { $ref: string } {
  const id = REGISTRE_DU_CONTRAT.get(schema)?.id;
  if (id === undefined) {
    throw new Error('Schema absent du registre du contrat');
  }
  return { $ref: `${PREFIXE_DES_COMPOSANTS}${id}` };
}

type Conversion = Parameters<
  NonNullable<z.core.ToJSONSchemaParams['override']>
>[0];

function tupleEnTableau({ zodSchema, jsonSchema }: Conversion): void {
  const def = zodSchema._zod.def;
  if (def.type !== 'tuple') {
    return;
  }
  const elements = [...def.items, ...(def.rest === null ? [] : [def.rest])];
  const items = jsonSchema.items as { anyOf: z.core.JSONSchema.BaseSchema[] };
  jsonSchema.minItems = def.items.length;
  if (elements.length === 0) {
    jsonSchema.items = { not: {} };
  } else if (elements.every((element) => element === elements[0])) {
    jsonSchema.items = items.anyOf[0];
  }
}

function avecNullDansLesEnumsNullables(noeud: unknown): void {
  if (noeud === null || typeof noeud !== 'object') {
    return;
  }
  const schema = noeud as { nullable?: unknown; enum?: unknown };
  if (
    schema.nullable === true &&
    Array.isArray(schema.enum) &&
    !schema.enum.includes(null)
  ) {
    schema.enum = [...(schema.enum as unknown[]), null];
  }
  Object.values(noeud).forEach(avecNullDansLesEnumsNullables);
}

export function schemasDuContrat(): Record<string, SchemaObject> {
  const { schemas } = z.toJSONSchema(REGISTRE_DU_CONTRAT, {
    target: 'openapi-3.0',
    uri: (id) => `${PREFIXE_DES_COMPOSANTS}${id}`,
    override: tupleEnTableau,
  });
  avecNullDansLesEnumsNullables(schemas);
  return Object.fromEntries(
    Object.entries(schemas).map(([id, schema]) => [
      id,
      sansLesCles(schema, ['$id']) as SchemaObject,
    ]),
  );
}
