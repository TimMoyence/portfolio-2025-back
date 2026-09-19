import { z } from 'zod';
import { CONCEPTS } from './banque/concepts';
import { CONFUSIONS, type ConfusionId } from './banque/confusions';

const LONGUEUR_MAX_IDENTIFIANT_DE_QUESTION = 60;
const CHEMIN_DE_MEDIA =
  /^\/assets\/cours\/[a-z0-9-]+\/v\d+\/[a-z0-9.-]+\.(webp|jpg|png|webm|vtt)$/;
const PAGE_DE_FORMATION = /^\/formations\/[a-z0-9-]+$/;
const EN_HTTPS = z.url({ protocol: /^https$/ });

const IDENTIFIANTS_DE_CONFUSION = Object.keys(CONFUSIONS) as [
  ConfusionId,
  ...ConfusionId[],
];

export const texte = z.string().min(1);
export const identifiantDeQuestion = texte.max(
  LONGUEUR_MAX_IDENTIFIANT_DE_QUESTION,
);
export const concept = z.enum(CONCEPTS);
export const concepts = z.tuple([concept], concept);
export const confusion = z.enum(IDENTIFIANTS_DE_CONFUSION);
export const media = z.union([
  EN_HTTPS,
  z
    .string()
    .regex(CHEMIN_DE_MEDIA)
    .refine((chemin) => !chemin.includes('..'), 'chemin de média remontant'),
]);
export const sourceDeVideo = z.union([
  EN_HTTPS,
  z.string().regex(PAGE_DE_FORMATION),
]);
export const tolerance = z
  .object({
    type: z.enum(['relative', 'absolue', 'decimales']),
    valeur: z.number().nonnegative(),
  })
  .strict();

export function auMoinsUn<T extends z.ZodType>(element: T): z.ZodTuple<[T], T> {
  return z.tuple([element], element);
}
