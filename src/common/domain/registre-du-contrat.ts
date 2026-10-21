import { z } from 'zod';

export const REGISTRE_DU_CONTRAT = z.registry<{ readonly id: string }>();

export function nommeAuContrat<S extends z.ZodType>(schema: S, id: string): S {
  REGISTRE_DU_CONTRAT.add(schema, { id });
  return schema;
}
