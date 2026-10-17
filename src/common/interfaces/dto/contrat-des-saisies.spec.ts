import type { Type } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import Ajv from 'ajv';
import { isDeepStrictEqual } from 'util';
import { routesDuControleur } from '../../../../test/helpers/metadonnees-de-route';
import {
  chargerLesSaisies,
  classeDe,
  type Contrainte,
  type Modele,
  nomDe,
  schemasDesModeles,
  valideLaContrainte,
} from '../../../../test/helpers/saisies-validees';
import {
  estSansForme,
  type SchemaOpenApi,
  variantesDe,
} from '../../../../test/helpers/schema-openapi';

const EMOJI = String.fromCodePoint(0x1f600);

type Ecarts = (champ: SchemaOpenApi, requis: boolean) => string[];
type Echantillon = readonly [valeur: unknown, accepte: boolean];

const ajv = new Ajv({ strict: false }).addKeyword({
  keyword: 'x-propertyNames',
  macro: (cles: object) => ({ propertyNames: cles }),
});

const apercu = (valeur: unknown): string =>
  JSON.stringify(valeur)?.slice(0, 60) ?? String(valeur);

const ensemble =
  (...ecarts: Ecarts[]): Ecarts =>
  (champ, requis) =>
    ecarts.flatMap((ecart) => ecart(champ, requis));

const porte =
  (motCle: string, attendu: unknown): Ecarts =>
  (champ) =>
    isDeepStrictEqual(champ[motCle], attendu)
      ? []
      : [`${motCle} ${apercu(champ[motCle])} au lieu de ${apercu(attendu)}`];

const admetLeType = (champ: SchemaOpenApi, type: string): boolean =>
  champ.type === type ||
  (type === 'object' && champ.$ref !== undefined) ||
  variantesDe(champ).some((variante) => admetLeType(variante, type));

const admet =
  (type: string): Ecarts =>
  (champ) =>
    admetLeType(champ, type)
      ? []
      : [`type ${apercu(champ.type)} au lieu de ${type}`];

const seuleValeur =
  (valeur: unknown): Ecarts =>
  (champ) => {
    const variantes = variantesDe(champ);
    const porteuses = variantes.length > 0 ? variantes : [champ];
    return porteuses.every((schema) => isDeepStrictEqual(schema.enum, [valeur]))
      ? []
      : [`enum ${apercu(champ.enum)} au lieu de ${apercu([valeur])}`];
  };

const enumeration =
  (valeurs: readonly unknown[]): Ecarts =>
  (champ, requis) =>
    porte('enum', champ.nullable === true ? [...valeurs, null] : valeurs)(
      champ,
      requis,
    );

const reference: Ecarts = (champ) =>
  champ.$ref !== undefined ||
  (variantesDe(champ).length > 0 &&
    variantesDe(champ).every((variante) => variante.$ref !== undefined))
    ? []
    : ['aucune reference au DTO imbrique'];

const facultatif: Ecarts = (_champ, requis) =>
  requis ? ['requis alors que la saisie est facultative'] : [];

const nonVide: Ecarts = (champ) =>
  typeof champ.minLength === 'number' && champ.minLength >= 1
    ? []
    : [`minLength ${apercu(champ.minLength)} au lieu d au moins 1`];

const motif = (expression: RegExp): Ecarts =>
  expression.flags === ''
    ? porte('pattern', expression.source)
    : () => [`drapeaux ${expression.flags} sans equivalent au contrat`];

const sansAnnonce: Ecarts = () => [];

const auxBornes =
  (echantillons: (contrainte: Contrainte) => readonly Echantillon[]) =>
  (contrainte: Contrainte): Ecarts =>
  (champ) => {
    const contrat = ajv.compile(champ);
    return echantillons(contrainte).flatMap(([valeur, accepte]) => {
      const annonce = contrat(valeur);
      const valide = valideLaContrainte(contrainte, valeur);
      return annonce === accepte && valide === accepte
        ? []
        : [
            `${apercu(valeur)} attendu ${accepte}, contrat ${annonce}, validation ${valide}`,
          ];
    });
  };

const entrees = (nombre: number, valeur: unknown): Record<string, unknown> =>
  Object.fromEntries(
    Array.from({ length: nombre }, (_, rang) => [`cle-${rang}`, valeur]),
  );

const ANNONCES: Readonly<Record<string, (contrainte: Contrainte) => Ecarts>> = {
  isString: () => admet('string'),
  isInt: () => admet('integer'),
  isNumber: () => admet('number'),
  isBoolean: () => admet('boolean'),
  isArray: () => admet('array'),
  isObject: () => admet('object'),
  isDate: () => ensemble(admet('string'), porte('format', 'date-time')),
  isEmail: () => porte('format', 'email'),
  isUrl: () => porte('format', 'uri'),
  isNotEmpty: () => nonVide,
  isIn: ({ constraints: [valeurs] }) =>
    enumeration(valeurs as readonly unknown[]),
  equals: ({ constraints: [valeur] }) =>
    ensemble(admet(typeof valeur), seuleValeur(valeur)),
  matches: ({ constraints: [expression] }) => motif(expression as RegExp),
  min: ({ constraints }) => porte('minimum', constraints[0]),
  max: ({ constraints }) => porte('maximum', constraints[0]),
  minLength: ({ constraints }) => porte('minLength', constraints[0]),
  maxLength: ({ constraints }) => porte('maxLength', constraints[0]),
  arrayMinSize: ({ constraints }) => porte('minItems', constraints[0]),
  arrayMaxSize: ({ constraints }) => porte('maxItems', constraints[0]),
  isOptional: () => facultatif,
  nestedValidation: () => reference,
  conditionalValidation: () => sansAnnonce,
  whitelistValidation: () => sansAnnonce,
  dictionnaireDeTextes: auxBornes(({ constraints: [longueurMax] }) => {
    const texteMax = Number(longueurMax);
    return [
      [{ B5: EMOJI.repeat(texteMax) }, true],
      [{ B5: EMOJI.repeat(texteMax + 1) }, false],
      [{ [EMOJI.repeat(60)]: 'x' }, true],
      [{ [EMOJI.repeat(61)]: 'x' }, false],
      [{ '': 'x' }, false],
      [entrees(400, 'x'), true],
      [entrees(401, 'x'), false],
      [{ B5: 1 }, false],
      [['x'], false],
      ['x', false],
    ];
  }),
  contexteDIncidentBorne: auxBornes(() => [
    [{ duree: 1200, visible: false, note: EMOJI.repeat(200) }, true],
    [{ note: EMOJI.repeat(201) }, false],
    [{ [EMOJI.repeat(40)]: 1 }, true],
    [{ [EMOJI.repeat(41)]: 1 }, false],
    [{ '': 1 }, false],
    [entrees(10, 1), true],
    [entrees(11, 1), false],
    [{ note: null }, false],
    [{ note: {} }, false],
    [{ note: [] }, false],
    ['x', false],
  ]),
  estReglageNumerique: auxBornes(() => [
    [{ prix: 250, taux: 0.5 }, true],
    [{}, true],
    [{ prix: '250' }, false],
    [{ prix: null }, false],
    [[250], false],
    ['x', false],
  ]),
};

const proprietesDocumentees = (modele: Modele): string[] =>
  (
    (Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES_ARRAY,
      modele.prototype as object,
    ) ?? []) as string[]
  ).map((cle) => cle.slice(1));

const metadonneesDocumentees = (
  modele: Modele,
  propriete: string,
): { type?: unknown; items?: unknown } =>
  (Reflect.getMetadata(
    DECORATORS.API_MODEL_PROPERTIES,
    modele.prototype as object,
    propriete,
  ) ?? {}) as { type?: unknown; items?: unknown };

const MOTS_CLES_OPENAPI_30 = new Set([
  '$ref',
  'title',
  'multipleOf',
  'maximum',
  'exclusiveMaximum',
  'minimum',
  'exclusiveMinimum',
  'maxLength',
  'minLength',
  'pattern',
  'maxItems',
  'minItems',
  'uniqueItems',
  'maxProperties',
  'minProperties',
  'required',
  'enum',
  'type',
  'allOf',
  'oneOf',
  'anyOf',
  'not',
  'items',
  'properties',
  'additionalProperties',
  'description',
  'format',
  'default',
  'nullable',
  'discriminator',
  'readOnly',
  'writeOnly',
  'xml',
  'externalDocs',
  'example',
  'deprecated',
]);

type Forme = readonly [chemin: string, schema: SchemaOpenApi];

const formesDe = ([chemin, schema]: Forme): Forme[] => [
  [chemin, schema],
  ...[
    ...Object.entries(schema.properties ?? {}).map(
      ([cle, champ]): Forme => [`${chemin}.${cle}`, champ],
    ),
    ...(schema.items === undefined
      ? []
      : [[`${chemin}[]`, schema.items] as Forme]),
    ...(typeof schema.additionalProperties === 'object'
      ? [[`${chemin}{}`, schema.additionalProperties] as Forme]
      : []),
    ...variantesDe(schema).map(
      (variante, rang): Forme => [`${chemin}|${rang}`, variante],
    ),
    ...['not', 'x-propertyNames'].flatMap((motCle) =>
      typeof schema[motCle] === 'object'
        ? [[`${chemin} ${motCle}`, schema[motCle] as SchemaOpenApi] as Forme]
        : [],
    ),
  ].flatMap(formesDe),
];

const SOURCES_DES_DTO: ReadonlyMap<number, string> = new Map([
  [RouteParamtypes.BODY, 'body'],
  [RouteParamtypes.QUERY, 'query'],
  [RouteParamtypes.PARAM, 'path'],
]);

const { contraintes, modeles, controleurs } = chargerLesSaisies();

interface Route {
  readonly nom: string;
  readonly sources: readonly string[];
  readonly declares: readonly { in: string; name?: string }[];
}

const routeDe = (controleur: Type, methode: string): Route => {
  const prototype = controleur.prototype as Record<string, object>;
  const types = (Reflect.getMetadata('design:paramtypes', prototype, methode) ??
    []) as unknown[];
  const argumentsDeRoute = (Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    controleur,
    methode,
  ) ?? {}) as Record<string, { index: number; data?: unknown }>;
  return {
    nom: `${controleur.name}.${methode}`,
    sources: Object.entries(argumentsDeRoute).flatMap(
      ([cle, { index, data }]) => {
        const source = SOURCES_DES_DTO.get(Number(cle.split(':')[0]));
        return source !== undefined &&
          data === undefined &&
          modeles.includes(types[index] as Modele)
          ? [source]
          : [];
      },
    ),
    declares: (Reflect.getMetadata(
      DECORATORS.API_PARAMETERS,
      prototype[methode],
    ) ?? []) as { in: string; name?: string }[],
  };
};

const ROUTES = controleurs.flatMap((controleur) =>
  routesDuControleur(controleur).map(({ action }) =>
    routeDe(controleur, action),
  ),
);

describe('contrat OpenAPI des saisies', () => {
  let schemas: Map<Modele, Record<string, SchemaOpenApi>>;

  beforeAll(async () => {
    schemas = await schemasDesModeles(modeles);
  });

  const formesDuContrat = (): (readonly [
    Forme,
    Record<string, SchemaOpenApi>,
  ])[] =>
    [...schemas.values()].flatMap((composants) =>
      Object.entries(composants)
        .flatMap(formesDe)
        .map((forme) => [forme, composants] as const),
    );

  it('charge les interfaces de chaque module, reponses et dictionnaires bornes compris', () => {
    expect(modeles.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        'ToolkitPageResponseDto',
        'AuditSummaryResponseDto',
        'SubmitAnswerResponseDto',
        'IncidentEntryDto',
      ]),
    );
    expect(contraintes.map(nomDe)).toEqual(
      expect.arrayContaining([
        'dictionnaireDeTextes',
        'contexteDIncidentBorne',
        'estReglageNumerique',
        'isOptional',
      ]),
    );
  });

  it('sait annoncer chaque contrainte que valident les interfaces', () => {
    expect(
      [...new Set(contraintes.map(nomDe))].filter((nom) => !(nom in ANNONCES)),
    ).toEqual([]);
  });

  it('annonce au contrat chaque contrainte que la saisie valide', () => {
    expect(
      contraintes.flatMap((contrainte) => {
        const libelle = `${classeDe(contrainte)}.${contrainte.propertyName} ${nomDe(contrainte)}`;
        const { target } = contrainte;
        const schema =
          typeof target === 'function'
            ? schemas.get(target)?.[target.name]
            : undefined;
        const champ = schema?.properties?.[contrainte.propertyName];
        const cible = contrainte.each ? champ?.items : champ;
        if (cible === undefined) {
          return [`${libelle} : absent du contrat`];
        }
        const annonce = ANNONCES[nomDe(contrainte)];
        return (
          annonce?.(contrainte)(
            cible,
            schema?.required?.includes(contrainte.propertyName) ?? false,
          ) ?? []
        ).map((ecart) => `${libelle} : ${ecart}`);
      }),
    ).toEqual([]);
  });

  it('annonce requis chaque champ que la saisie exige', () => {
    const memeChamp = (une: Contrainte, autre: Contrainte): boolean =>
      une.target === autre.target && une.propertyName === autre.propertyName;
    const facultatives = contraintes.filter((contrainte) =>
      ['isOptional', 'conditionalValidation', 'whitelistValidation'].includes(
        nomDe(contrainte),
      ),
    );
    expect([
      ...new Set(
        contraintes
          .filter(
            (contrainte) =>
              !facultatives.some((facultative) =>
                memeChamp(facultative, contrainte),
              ),
          )
          .filter(({ target, propertyName }) => {
            const schema =
              typeof target === 'function'
                ? schemas.get(target)?.[target.name]
                : undefined;
            return !(schema?.required ?? []).includes(propertyName);
          })
          .map(
            (contrainte) =>
              `${classeDe(contrainte)}.${contrainte.propertyName}`,
          ),
      ),
    ]).toEqual([]);
  });

  it('donne a chaque champ de chaque DTO un type, et a chaque objet sa forme', () => {
    expect([
      ...new Set(
        [...schemas.values()].flatMap((composants) =>
          Object.entries(composants).flatMap(([nom, schema]) => [
            ...(estSansForme(schema) ? [nom] : []),
            ...Object.entries(schema.properties ?? {})
              .filter(([, champ]) => estSansForme(champ))
              .map(([champ]) => `${nom}.${champ}`),
          ]),
        ),
      ),
    ]).toEqual([]);
  });

  it('decrit le corps de chaque reponse 2xx de chaque route, hors 204', () => {
    const reponsesDe = (
      cible: object,
    ): Record<string, { type?: unknown; schema?: unknown }> =>
      (Reflect.getMetadata(DECORATORS.API_RESPONSE, cible) ?? {}) as Record<
        string,
        { type?: unknown; schema?: unknown }
      >;
    const ecartDuCorps = (type: unknown, schema: unknown): string | null => {
      if (type === undefined) {
        return schema === undefined ? 'corps non decrit' : null;
      }
      return typeof type === 'function' &&
        ![String, Number, Boolean].includes(type as StringConstructor) &&
        !modeles.includes(type)
        ? `${type.name} sans champ documente`
        : null;
    };
    expect(
      controleurs.flatMap((controleur) =>
        routesDuControleur(controleur).flatMap(({ action, gestionnaire }) => {
          const succes = Object.entries({
            ...reponsesDe(controleur),
            ...reponsesDe(gestionnaire),
          }).filter(([statut]) => /^2\d\d$/.test(statut));
          const nom = `${controleur.name}.${action}`;
          return succes.length === 0
            ? [`${nom} : aucune reponse 2xx documentee`]
            : succes
                .filter(([statut]) => statut !== '204')
                .flatMap(([statut, { type, schema }]) => {
                  const ecart = ecartDuCorps(type, schema);
                  return ecart === null ? [] : [`${nom} ${statut} : ${ecart}`];
                });
        }),
      ),
    ).toEqual([]);
  });

  it('donne a chaque tableau le type de ses elements', () => {
    expect(
      modeles.flatMap((modele) =>
        proprietesDocumentees(modele)
          .filter((propriete) => {
            const { type, items } = metadonneesDocumentees(modele, propriete);
            const declare =
              type ??
              (Reflect.getMetadata(
                'design:type',
                modele.prototype as object,
                propriete,
              ) as unknown);
            return declare === Array && items === undefined;
          })
          .map((propriete) => `${modele.name}.${propriete}`),
      ),
    ).toEqual([]);
  });

  it('n emploie dans chaque schema que les mots-cles d OpenAPI 3.0', () => {
    expect([
      ...new Set(
        formesDuContrat().flatMap(([[chemin, forme]]) =>
          Object.keys(forme)
            .filter(
              (cle) => !MOTS_CLES_OPENAPI_30.has(cle) && !cle.startsWith('x-'),
            )
            .map((cle) => `${chemin} : ${cle}`),
        ),
      ),
    ]).toEqual([]);
  });

  it('accepte null partout ou le contrat l annonce', () => {
    expect([
      ...new Set(
        formesDuContrat()
          .filter(
            ([[, forme]]) =>
              forme.nullable === true ||
              (Array.isArray(forme.enum) && forme.enum.includes(null)),
          )
          .flatMap(([[chemin, forme], composants]) => {
            try {
              return ajv.compile({
                ...forme,
                components: { schemas: composants },
              })(null)
                ? []
                : [`${chemin} : null refuse`];
            } catch (erreur) {
              return [`${chemin} : ${(erreur as Error).message}`];
            }
          }),
      ),
    ]).toEqual([]);
  });

  it('laisse au DTO de chaque route l annonce de ses parametres', () => {
    expect(
      ROUTES.flatMap(({ nom, sources }) =>
        sources.map((source) => `${nom} : ${source}`),
      ),
    ).toEqual(
      expect.arrayContaining([
        'ArticlesController.list : query',
        'AuthController.login : body',
      ]),
    );
    expect(
      ROUTES.flatMap(({ nom, sources, declares }) =>
        declares
          .filter((parametre) => sources.includes(parametre.in))
          .map(
            (parametre) => `${nom} : ${parametre.in} ${parametre.name ?? ''}`,
          ),
      ),
    ).toEqual([]);
  });
});
