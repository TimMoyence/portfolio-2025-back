import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { estObjet } from '../../src/common/domain/est-objet';
import { avecLesSchemasDuContrat } from '../../src/common/interfaces/http/document-openapi';
import { RACINE } from './racine';
import type { EvenementFlux } from './trames-sse';

export interface SchemaOpenApi {
  $ref?: string;
  type?: string;
  properties?: Record<string, SchemaOpenApi>;
  required?: string[];
  items?: SchemaOpenApi;
  additionalProperties?: SchemaOpenApi | boolean;
  allOf?: SchemaOpenApi[];
  oneOf?: SchemaOpenApi[];
  anyOf?: SchemaOpenApi[];
  [motCle: string]: unknown;
}

export const variantesDe = (schema: SchemaOpenApi): SchemaOpenApi[] => [
  ...(schema.allOf ?? []),
  ...(schema.oneOf ?? []),
  ...(schema.anyOf ?? []),
];

export const CHAMPS_VOLONTAIREMENT_OUVERTS: readonly string[] = [
  'AuditSummaryResponseDto.keyChecks',
  'AuditTermineResponseDto.keyChecks',
];

export function estSansForme(schema: SchemaOpenApi): boolean {
  if (schema.$ref !== undefined || variantesDe(schema).length > 0) {
    return false;
  }
  if (schema.type === 'array') {
    return schema.items === undefined || estSansForme(schema.items);
  }
  return (
    schema.type === undefined ||
    (schema.type === 'object' &&
      Object.keys(schema.properties ?? {}).length === 0 &&
      (schema.additionalProperties === undefined ||
        schema.additionalProperties === true))
  );
}

export const estSansFormeHorsOuverts = (
  nom: string,
  schema: SchemaOpenApi,
): boolean =>
  estSansForme(schema) && !CHAMPS_VOLONTAIREMENT_OUVERTS.includes(nom);

const PREFIXE_COMPOSANT = '#/components/schemas/';

function resoudre(
  document: OpenAPIObject,
  schema: SchemaOpenApi,
): SchemaOpenApi {
  if (schema.$ref === undefined) {
    return schema;
  }
  const nom = schema.$ref.slice(PREFIXE_COMPOSANT.length);
  const composant = document.components?.schemas?.[nom];
  if (composant === undefined) {
    throw new Error(`Schema OpenAPI introuvable: ${schema.$ref}`);
  }
  return composant as SchemaOpenApi;
}

function ecartsDesProprietes(
  document: OpenAPIObject,
  proprietes: Record<string, SchemaOpenApi>,
  requises: readonly string[],
  valeur: unknown,
  chemin: string,
): string[] {
  if (!estObjet(valeur)) {
    return [`${chemin} : objet attendu`];
  }
  const documentees = Object.keys(proprietes);
  const recues = Object.keys(valeur);
  return [
    ...requises
      .filter((cle) => !recues.includes(cle))
      .map((cle) => `${chemin}.${cle} : documente mais absent de la reponse`),
    ...recues
      .filter((cle) => !documentees.includes(cle))
      .map((cle) => `${chemin}.${cle} : rendu mais absent du schema`),
    ...documentees
      .filter((cle) => recues.includes(cle))
      .flatMap((cle) =>
        ecartsAuSchema(
          document,
          proprietes[cle],
          valeur[cle],
          `${chemin}.${cle}`,
        ),
      ),
  ];
}

function ecartsAuSchema(
  document: OpenAPIObject,
  schema: SchemaOpenApi,
  valeur: unknown,
  chemin: string,
): string[] {
  const resolu = resoudre(document, schema);
  if (resolu.properties !== undefined) {
    return ecartsDesProprietes(
      document,
      resolu.properties,
      resolu.required ?? [],
      valeur,
      chemin,
    );
  }
  const items = resolu.items;
  if (items !== undefined && Array.isArray(valeur)) {
    return valeur.flatMap((element: unknown, rang) =>
      ecartsAuSchema(document, items, element, `${chemin}[${rang}]`),
    );
  }
  return [];
}

export function documentOpenApiFormations(
  app: INestApplication,
): OpenAPIObject {
  return avecLesSchemasDuContrat(
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('formations').build(),
    ),
  );
}

export const documentPublie = (): OpenAPIObject =>
  JSON.parse(
    readFileSync(join(RACINE, 'openapi.json'), 'utf8'),
  ) as OpenAPIObject;

const ajv = addFormats(new Ajv({ strict: false, allErrors: true }));
const validateurs = new WeakMap<SchemaOpenApi, ValidateFunction>();

function ecartsDeValidation(
  document: OpenAPIObject,
  schema: SchemaOpenApi,
  valeur: unknown,
  chemin: string,
): string[] {
  const valider =
    validateurs.get(schema) ??
    ajv.compile({ ...schema, components: document.components });
  validateurs.set(schema, valider);
  return valider(valeur)
    ? []
    : (valider.errors ?? []).map(
        ({ instancePath, message }) => `${chemin}${instancePath} : ${message}`,
      );
}

function operationDu(
  document: OpenAPIObject,
  suffixeDeChemin: string,
): { responses?: Record<string, unknown> } | undefined {
  const chemin = Object.keys(document.paths).find((candidat) =>
    candidat.endsWith(suffixeDeChemin),
  );
  return chemin === undefined ? undefined : document.paths[chemin].get;
}

export function evenementsDuFlux(
  document: OpenAPIObject,
  suffixeDeChemin: string,
): Readonly<Record<string, SchemaOpenApi>> {
  const reponse = operationDu(document, suffixeDeChemin)?.responses?.['200'] as
    | { content?: Record<string, { schema?: SchemaOpenApi }> }
    | undefined;
  const variantes = reponse?.content?.['text/event-stream']?.schema?.oneOf;
  return Object.fromEntries(
    (variantes ?? []).flatMap(({ properties }) => {
      const nom = properties?.event?.enum;
      const donnees = properties?.data;
      return Array.isArray(nom) && donnees !== undefined
        ? [[String(nom[0]), donnees] as const]
        : [];
    }),
  );
}

export function ecartsAuFlux(
  document: OpenAPIObject,
  suffixeDeChemin: string,
  evenements: readonly EvenementFlux[],
): string[] {
  const contrat = evenementsDuFlux(document, suffixeDeChemin);
  return [
    ...new Set(
      evenements.flatMap(({ type, donnees }) => {
        const chemin = `${suffixeDeChemin} ${type}`;
        if (!Object.hasOwn(contrat, type)) {
          return [`${chemin} : evenement absent du contrat`];
        }
        const schema = contrat[type];
        return [
          ...ecartsDeValidation(document, schema, donnees, chemin),
          ...ecartsAuSchema(document, schema, donnees, chemin),
        ];
      }),
    ),
  ];
}

export function attendreVersionServie(corps: unknown, version: number): void {
  const servi = corps as { version: number; publieLe: string };
  expect(servi.version).toBe(version);
  expect(Date.parse(servi.publieLe)).not.toBeNaN();
}

export function ecartsAuSchemaDeReponse(
  document: OpenAPIObject,
  suffixeDeChemin: string,
  corps: unknown,
): string[] {
  const schema = (
    operationDu(document, suffixeDeChemin)?.responses?.['200'] as
      | { content?: Record<string, { schema?: SchemaOpenApi }> }
      | undefined
  )?.content?.['application/json']?.schema;
  if (schema === undefined) {
    return [`${suffixeDeChemin} : aucun schema de reponse 200`];
  }
  return ecartsAuSchema(document, schema, corps, suffixeDeChemin);
}
