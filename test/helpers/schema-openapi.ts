import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';

interface SchemaOpenApi {
  $ref?: string;
  type?: string;
  properties?: Record<string, SchemaOpenApi>;
  required?: string[];
  items?: SchemaOpenApi;
}

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

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return (
    typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
  );
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
  return SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('formations').build(),
  );
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
  const chemin = Object.keys(document.paths).find((candidat) =>
    candidat.endsWith(suffixeDeChemin),
  );
  const schema = chemin
    ? (
        document.paths[chemin].get?.responses?.['200'] as {
          content?: Record<string, { schema?: SchemaOpenApi }>;
        }
      )?.content?.['application/json']?.schema
    : undefined;
  if (schema === undefined) {
    return [`${suffixeDeChemin} : aucun schema de reponse 200`];
  }
  return ecartsAuSchema(document, schema, corps, suffixeDeChemin);
}
