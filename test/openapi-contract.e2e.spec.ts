import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OpenAPIObject } from '@nestjs/swagger';

import { deroulePresentateur } from '../src/modules/formations/domain/cours/DeroulePresentateur';
import {
  correctionDeLEcranRevele,
  correctionServie,
  correctionSurPlaceServie,
} from '../src/modules/formations/domain/cours/Diffusion';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import { buildCoursDuContenu } from './factories/contenus-de-cours.factory';
import { CONTENUS } from './factories/contenus-publies';
import { RACINE } from './helpers/racine';
import { estSansForme, type SchemaOpenApi } from './helpers/schema-openapi';

type DocumentOpenApi = OpenAPIObject;

const document: DocumentOpenApi = JSON.parse(
  readFileSync(join(RACINE, 'openapi.json'), 'utf8'),
) as DocumentOpenApi;

interface SchemaDeChamp {
  readonly type?: string;
  readonly default?: unknown;
  readonly example?: unknown;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly properties?: Record<string, SchemaDeChamp>;
  readonly oneOf?: readonly SchemaDeChamp[];
  readonly anyOf?: readonly SchemaDeChamp[];
  readonly allOf?: readonly SchemaDeChamp[];
  readonly $ref?: string;
}

const porteUnNombre = (schema: SchemaDeChamp): boolean =>
  typeof schema.default === 'number' ||
  typeof schema.example === 'number' ||
  schema.minimum !== undefined ||
  schema.maximum !== undefined;

const composantNomme = (ref: string): SchemaDeChamp =>
  (document.components?.schemas?.[ref.split('/').at(-1) ?? ''] ??
    {}) as SchemaDeChamp;

const admetUnNombre = (schema: SchemaDeChamp): boolean =>
  schema.type === 'integer' ||
  schema.type === 'number' ||
  (schema.$ref !== undefined && admetUnNombre(composantNomme(schema.$ref))) ||
  [
    ...(schema.oneOf ?? []),
    ...(schema.anyOf ?? []),
    ...(schema.allOf ?? []),
  ].some(admetUnNombre);

function champsDuDocument(
  document: DocumentOpenApi,
): (readonly [string, SchemaDeChamp])[] {
  const proprietes = Object.entries(document.components?.schemas ?? {}).flatMap(
    ([nom, schema]) =>
      Object.entries((schema as SchemaDeChamp).properties ?? {}).map(
        ([champ, propriete]) => [`${nom}.${champ}`, propriete] as const,
      ),
  );
  const parametres = Object.entries(document.paths).flatMap(
    ([chemin, operations]) =>
      Object.values(operations as object).flatMap(
        (operation: {
          parameters?: { name: string; schema?: SchemaDeChamp }[];
        }) =>
          (operation.parameters ?? []).map(
            (parametre) =>
              [`${chemin} ${parametre.name}`, parametre.schema ?? {}] as const,
          ),
      ),
  );
  return [...proprietes, ...parametres];
}

const champsNumeriquesSansTypeNumerique = (
  document: DocumentOpenApi,
): string[] =>
  champsDuDocument(document)
    .filter(([, schema]) => porteUnNombre(schema) && !admetUnNombre(schema))
    .map(([nom]) => nom);

const champsSansForme = (document: DocumentOpenApi): string[] =>
  champsDuDocument(document)
    .filter(([, schema]) => estSansForme(schema as SchemaOpenApi))
    .map(([nom]) => nom);

describe('OpenAPI du contrat publié', () => {
  it('documente par un type numerique chaque champ qui porte un defaut, un exemple ou une borne numerique', () => {
    expect(champsNumeriquesSansTypeNumerique(document)).toEqual([]);
  });

  it('donne a chaque champ un type, et a chaque objet sa forme', () => {
    expect(champsSansForme(document)).toEqual([]);
  });

  it('n annonce au PATCH utilisateur aucune valeur par défaut de la création', () => {
    const { properties } = document.components?.schemas?.UpdateUserDto as {
      properties: Record<string, object>;
    };

    expect(properties.isActive).not.toHaveProperty('default');
    expect(properties.roles).not.toHaveProperty('default');
  });

  it('QA-12 · documente nullable le verdict servi par la réponse et par l état du participant', () => {
    const verdictDe = (dto: string): unknown => {
      const schema = document.components?.schemas?.[dto];
      return schema !== undefined && 'properties' in schema
        ? schema.properties?.['correcte']
        : undefined;
    };
    const verdictNullable = expect.objectContaining({
      type: 'boolean',
      nullable: true,
    });

    expect({
      reponse: verdictDe('SubmitAnswerResponseDto'),
      etat: verdictDe('ReponseParticipantResponseDto'),
    }).toEqual({ reponse: verdictNullable, etat: verdictNullable });
  });
});

describe('OpenAPI des pièces jointes réservées', () => {
  const reponsesDe = (suffixe: string): Record<string, string> => {
    const chemin = Object.keys(document.paths).find((candidat) =>
      candidat.endsWith(suffixe),
    );
    if (chemin === undefined) {
      throw new Error(`Chemin OpenAPI absent : ${suffixe}`);
    }
    return Object.fromEntries(
      Object.entries(document.paths[chemin].get?.responses ?? {}).map(
        ([statut, reponse]) => [
          statut,
          reponse !== undefined && 'description' in reponse
            ? reponse.description
            : '',
        ],
      ),
    );
  };

  it('documente au poste la reprise retenue, le plafond et l écran pas encore servi', () => {
    const poste = reponsesDe('/sessions/{id}/pieces-jointes/{ecranId}');

    expect({
      retenue: poste['409'],
      plafond: poste['429'],
      introuvable: poste['404'],
    }).toEqual({
      retenue: expect.stringContaining('PIECE_JOINTE_RETENUE'),
      plafond: expect.any(String),
      introuvable: expect.stringMatching(
        /ECRAN_NON_SERVI.*PIECE_JOINTE_INTROUVABLE/,
      ),
    });
  });

  it('ne promet au pupitre ni retenue ni écran non servi', () => {
    const pupitre = reponsesDe(
      '/sessions/{id}/deroule/pieces-jointes/{ecranId}',
    );

    expect({ retenue: pupitre['409'], introuvable: pupitre['404'] }).toEqual({
      retenue: undefined,
      introuvable: expect.stringContaining('PIECE_JOINTE_INTROUVABLE'),
    });
    expect(pupitre['404']).not.toContain('ECRAN_NON_SERVI');
  });
});

describe('OpenAPI des écrans servis', () => {
  interface SchemaOpenApi {
    readonly $ref?: string;
    readonly type?: string;
    readonly properties?: Readonly<Record<string, SchemaOpenApi>>;
    readonly allOf?: readonly SchemaOpenApi[];
    readonly oneOf?: readonly SchemaOpenApi[];
    readonly items?: SchemaOpenApi;
    readonly enum?: readonly unknown[];
  }

  const schemaNomme = (ref: string): SchemaOpenApi => {
    const nom = ref.split('/').at(-1) ?? '';
    const schema = document.components?.schemas?.[nom];
    if (schema === undefined) {
      throw new Error(`Schéma OpenAPI absent : ${nom}`);
    }
    return schema as SchemaOpenApi;
  };

  const proprietesDe = (
    schema: SchemaOpenApi,
  ): Readonly<Record<string, SchemaOpenApi>> | null => {
    const resolu =
      schema.$ref === undefined ? schema : schemaNomme(schema.$ref);
    const heritees = (resolu.allOf ?? []).map(proprietesDe);
    if (resolu.properties === undefined && heritees.every((p) => p === null)) {
      return null;
    }
    return Object.assign({}, ...heritees, resolu.properties);
  };

  const nonDeclares = (
    valeur: unknown,
    schema: SchemaOpenApi,
    chemin: string,
  ): string[] => {
    if (valeur === null || typeof valeur !== 'object') {
      return [];
    }
    if (schema.oneOf !== undefined) {
      return (
        schema.oneOf
          .filter(
            (variante) =>
              variante.enum === undefined || variante.enum.includes(valeur),
          )
          .map((variante) => nonDeclares(valeur, variante, chemin))
          .reduce<string[] | null>(
            (retenue, essai) =>
              retenue === null || essai.length < retenue.length
                ? essai
                : retenue,
            null,
          ) ?? [`${chemin} (oneOf vide)`]
      );
    }
    if (
      schema.type !== undefined &&
      !['object', 'array'].includes(schema.type)
    ) {
      return [`${chemin} (${schema.type})`];
    }
    if (Array.isArray(valeur)) {
      const items = schema.items;
      return items === undefined
        ? [`${chemin} (tableau non déclaré)`]
        : valeur.flatMap((element) =>
            nonDeclares(element, items, `${chemin}[]`),
          );
    }
    const proprietes = proprietesDe(schema);
    if (proprietes === null) {
      return [];
    }
    return Object.entries(valeur).flatMap(([cle, champ]) =>
      Object.hasOwn(proprietes, cle)
        ? nonDeclares(champ, proprietes[cle], `${chemin}.${cle}`)
        : [`${chemin}.${cle}`],
    );
  };

  const confronter = (servis: readonly unknown[], dto: string): string[] => {
    expect(servis.length).toBeGreaterThan(0);
    return [
      ...new Set(
        servis.flatMap((servi) =>
          nonDeclares(servi, { $ref: `#/components/schemas/${dto}` }, dto),
        ),
      ),
    ].sort((a, b) => a.localeCompare(b));
  };

  it('déclare chaque champ du déroulé tel que le pupitre le reçoit, imbriqués compris, sur tous les cours', () => {
    const servis = CONTENUS.map((contenu) =>
      deroulePresentateur(buildCoursDuContenu(contenu), 0),
    );

    expect(confronter(servis, 'DerouleResponseDto')).toEqual([]);
  });

  it('déclare chaque champ du sujet tel que le poste le reçoit, chaque forme de correction comprise, sur tous les cours', () => {
    const revele = { revele: true };
    const servis = CONTENUS.flatMap((contenu) => {
      const cours = buildCoursDuContenu(contenu);
      const tirage = tirer(cours, 0);
      return [
        tirage.sujet,
        ...[
          (rang: number) => correctionServie(cours, cours.ecrans[rang], tirage),
          (rang: number) =>
            correctionSurPlaceServie(cours.ecrans[rang], tirage, revele),
          (rang: number) =>
            correctionDeLEcranRevele(cours.ecrans[rang], tirage),
        ].map((correctionDuRang) => ({
          ...tirage.sujet,
          ecrans: tirage.sujet.ecrans.map((ecran, rang) => {
            const correction = correctionDuRang(rang);
            return correction === null ? ecran : { ...ecran, correction };
          }),
        })),
      ];
    });

    expect(confronter(servis, 'SujetResponseDto')).toEqual([]);
  });

  it('fait rougir la confrontation sur un champ imbriqué que le DTO ne déclare pas', () => {
    const deroule = deroulePresentateur(buildCoursDuContenu(CONTENUS[0]), 0);
    const [premier, ...suivants] = deroule.ecrans;

    expect(
      confronter(
        [
          {
            ...deroule,
            ecrans: [
              {
                ...premier,
                reflexion: { attendu: 'a', suite: null, cache: 1 },
              },
              ...suivants,
            ],
          },
        ],
        'DerouleResponseDto',
      ),
    ).toEqual(['DerouleResponseDto.ecrans[].reflexion.cache']);
  });
});

const ROUTES_SUR_UN_ECRAN_SERVI = [
  'post /sessions/{id}/answers',
  'post /sessions/{id}/free-responses',
  'post /sessions/{id}/productions',
  'post /sessions/{id}/feuilles/{planId}/evaluation',
  'post /sessions/{id}/tableaux/{planId}/evaluation',
  'post /sessions/{id}/machines/{ecranId}/evaluation',
  'post /sessions/{id}/escape/{parcoursId}/tentatives',
  'put /sessions/{id}/pulses/{sondageId}',
  'post /sessions/{id}/defis/{defiId}/tentative',
  'get /sessions/{id}/defis/{defiId}/strategies',
  'get /sessions/{id}/rappels',
  'get /sessions/{id}/pieces-jointes/{ecranId}',
] as const;

describe('OpenAPI de l écran pas encore servi', () => {
  const reponses = (): {
    methode: string;
    chemin: string;
    statut: string;
    description: string;
  }[] =>
    Object.entries(document.paths).flatMap(([chemin, operations]) =>
      Object.entries(operations).flatMap(([methode, operation]) =>
        Object.entries(
          (operation as { responses?: Record<string, unknown> }).responses ??
            {},
        ).map(([statut, reponse]) => ({
          methode,
          chemin,
          statut,
          description: (reponse as { description?: string }).description ?? '',
        })),
      ),
    );

  it('n annonce ECRAN_NON_SERVI sous aucun autre statut que 404', () => {
    const ailleurs = reponses()
      .filter(
        ({ statut, description }) =>
          statut !== '404' && description.includes('ECRAN_NON_SERVI'),
      )
      .map(({ methode, chemin, statut }) => `${statut} ${methode} ${chemin}`);

    expect(ailleurs).toEqual([]);
  });

  it('annonce ECRAN_NON_SERVI en 404 sur chaque route qui refuse un écran pas encore servi', () => {
    const annoncees = reponses().filter(
      ({ statut, description }) =>
        statut === '404' && description.includes('ECRAN_NON_SERVI'),
    );

    const muettes = ROUTES_SUR_UN_ECRAN_SERVI.filter((route) => {
      const [methode, suffixe] = route.split(' ');
      return !annoncees.some(
        (annoncee) =>
          annoncee.methode === methode && annoncee.chemin.endsWith(suffixe),
      );
    });

    expect(muettes).toEqual([]);
  });
});
