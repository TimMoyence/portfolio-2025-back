import type { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  DocumentBuilder,
  type SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';

import {
  createLegacyUseCaseStubs,
  LEGACY_CONTROLLERS,
  legacyControllerProviders,
} from './factories/legacy-contract.factory';

import { UsersController } from '../src/modules/users/interfaces/Users.controller';
import { ListUsersUseCase } from '../src/modules/users/application/ListUsers.useCase';
import { ListOneUserUseCase } from '../src/modules/users/application/ListOneUser.useCase';
import { UpdateUsersUseCase } from '../src/modules/users/application/UpdateUsers.useCase';
import { DeleteUsersUseCase } from '../src/modules/users/application/DeleteUsers.useCase';

import { AuthController } from '../src/modules/users/interfaces/Auth.controller';

import { ContactsController } from '../src/modules/contacts/interfaces/Contacts.controller';
import { CookieConsentsController } from '../src/modules/cookie-consents/interfaces/CookieConsents.controller';
import { AuditsController } from '../src/modules/audit-requests/interfaces/Audits.controller';
import { RequestToolkitRequestDto } from '../src/modules/lead-magnets/interfaces/dto/request-toolkit.request.dto';
import { SubscribeNewsletterRequestDto } from '../src/modules/newsletter/interfaces/dto/subscribe-newsletter.request.dto';
import { ArticleListQueryDto } from '../src/modules/articles/interfaces/dto/article-list.query.dto';
import { JoinSessionRequestDto } from '../src/modules/formations/interfaces/dto/join-session.request.dto';

import {
  authControllerProviders,
  coreControllerProviders,
  createAuthUseCaseStubs,
  createCoreUseCaseStubs,
} from './factories/core-api.factory';

import { RolesGuard } from '../src/common/interfaces/auth/roles.guard';

import { ControlSessionRequestDto } from '../src/modules/formations/interfaces/dto/contrat/control-session.request.dto';
import { DeclarerJalonRequestDto } from '../src/modules/formations/interfaces/dto/contrat/declarer-jalon.request.dto';
import { DerouleResponseDto } from '../src/modules/formations/interfaces/dto/contrat/deroule.response.dto';
import { EtatParticipantResponseDto } from '../src/modules/formations/interfaces/dto/contrat/etat-participant.response.dto';
import { EvaluerFeuilleRequestDto } from '../src/modules/formations/interfaces/dto/contrat/evaluer-feuille.request.dto';
import { EvaluerMachineRequestDto } from '../src/modules/formations/interfaces/dto/contrat/evaluer-machine.request.dto';
import { EvaluerTableauRequestDto } from '../src/modules/formations/interfaces/dto/contrat/evaluer-tableau.request.dto';
import { FeuilleEvalueeResponseDto } from '../src/modules/formations/interfaces/dto/contrat/feuille-evaluee.response.dto';
import { MachineEvalueeResponseDto } from '../src/modules/formations/interfaces/dto/contrat/machine-evaluee.response.dto';
import { TableauEvalueResponseDto } from '../src/modules/formations/interfaces/dto/contrat/tableau-evalue.response.dto';
import { OpenSessionRequestDto } from '../src/modules/formations/interfaces/dto/contrat/open-session.request.dto';
import { RappelsResponseDto } from '../src/modules/formations/interfaces/dto/contrat/rappels.response.dto';
import { SessionResultsResponseDto } from '../src/modules/formations/interfaces/dto/contrat/session-results.response.dto';
import { StrategiesDefiResponseDto } from '../src/modules/formations/interfaces/dto/contrat/strategies-defi.response.dto';
import { SubmitDefiRequestDto } from '../src/modules/formations/interfaces/dto/contrat/submit-defi.request.dto';
import { SubmitProductionRequestDto } from '../src/modules/formations/interfaces/dto/contrat/submit-production.request.dto';
import {
  CoursPublicCatalogueResponseDto,
  SujetResponseDto,
} from '../src/modules/formations/interfaces/dto/contrat/sujet.response.dto';
import { SyntheseRappelsResponseDto } from '../src/modules/formations/interfaces/dto/contrat/synthese-rappels.response.dto';
import { TentativeEnigmeResponseDto } from '../src/modules/formations/interfaces/dto/contrat/tentative-enigme.response.dto';
import { TenterEnigmeRequestDto } from '../src/modules/formations/interfaces/dto/contrat/tenter-enigme.request.dto';
import { SubmitProductionResponseDto } from '../src/modules/formations/interfaces/dto/contrat/verdict-production.response.dto';
import { SubmitAnswerResponseDto } from '../src/modules/formations/interfaces/dto/submit-answer.response.dto';
import { deroulePresentateur } from '../src/modules/formations/domain/cours/DeroulePresentateur';
import {
  correctionDeLEcranRevele,
  correctionServie,
  correctionSurPlaceServie,
} from '../src/modules/formations/domain/cours/Diffusion';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import { buildCoursDuContenu } from './factories/contenus-de-cours.factory';
import { CONTENUS } from './factories/contenus-publies';
import { createMockDepotsFormations } from './factories/formation.factory';
import { monterApplicationFormations } from './helpers/formations-harness';
import { fermerApplication } from './helpers/nest-test-app';
import {
  documentOpenApiFormations,
  estSansForme,
  type SchemaOpenApi,
} from './helpers/schema-openapi';

const stub = () => ({ execute: jest.fn() });

const DTO_DU_CONTRAT = [
  SubmitProductionRequestDto,
  SubmitProductionResponseDto,
  TenterEnigmeRequestDto,
  TentativeEnigmeResponseDto,
  DeclarerJalonRequestDto,
  RappelsResponseDto,
  SubmitDefiRequestDto,
  StrategiesDefiResponseDto,
  EtatParticipantResponseDto,
  OpenSessionRequestDto,
  ControlSessionRequestDto,
  SujetResponseDto,
  DerouleResponseDto,
  SessionResultsResponseDto,
  SyntheseRappelsResponseDto,
  CoursPublicCatalogueResponseDto,
  EvaluerFeuilleRequestDto,
  FeuilleEvalueeResponseDto,
  EvaluerTableauRequestDto,
  TableauEvalueResponseDto,
  EvaluerMachineRequestDto,
  MachineEvalueeResponseDto,
];

const ROUTES_ACTIVES_DU_CONTRAT = [
  '/sessions/{id}/productions',
  '/sessions/{id}/escape/{parcoursId}/tentatives',
  '/sessions/{id}/pulses/{sondageId}',
  '/sessions/{id}/defis/{defiId}/tentative',
  '/sessions/{id}/defis/{defiId}/strategies',
  '/sessions/{id}/moi',
  '/sessions/{id}/participants/{participantId}',
  '/sessions/{id}/rappels',
  '/sessions/{id}/rappels/synthese',
  '/sessions/{id}/feuilles/{planId}/evaluation',
  '/sessions/{id}/tableaux/{planId}/evaluation',
  '/sessions/{id}/machines/{ecranId}/evaluation',
];

const ROUTES_A_VENIR_DU_CONTRAT: readonly string[] = [];

type DocumentOpenApi = ReturnType<typeof SwaggerModule.createDocument>;

async function documentDesFormations(): Promise<DocumentOpenApi> {
  const app = await monterApplicationFormations(createMockDepotsFormations());
  const document = documentOpenApiFormations(app);
  await fermerApplication(app);
  return document;
}

async function documenterLeModule(
  metadonnees: ModuleMetadata,
  constructeur: DocumentBuilder,
  options?: SwaggerDocumentOptions,
): Promise<DocumentOpenApi> {
  const moduleRef = await Test.createTestingModule(metadonnees).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  await app.init();
  try {
    return SwaggerModule.createDocument(app, constructeur.build(), options);
  } finally {
    await app.close();
  }
}

interface SchemaDeChamp {
  readonly type?: string;
  readonly default?: unknown;
  readonly example?: unknown;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly properties?: Record<string, SchemaDeChamp>;
  readonly oneOf?: readonly SchemaDeChamp[];
  readonly anyOf?: readonly SchemaDeChamp[];
}

const porteUnNombre = (schema: SchemaDeChamp): boolean =>
  typeof schema.default === 'number' ||
  typeof schema.example === 'number' ||
  schema.minimum !== undefined ||
  schema.maximum !== undefined;

const admetUnNombre = (schema: SchemaDeChamp): boolean =>
  schema.type === 'integer' ||
  schema.type === 'number' ||
  [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])].some(admetUnNombre);

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

describe('OpenAPI legacy contract (phase 11)', () => {
  let document: DocumentOpenApi;

  beforeAll(async () => {
    document = await documenterLeModule(
      {
        controllers: LEGACY_CONTROLLERS,
        providers: legacyControllerProviders(createLegacyUseCaseStubs()),
      },
      new DocumentBuilder().setTitle('Contract Test').setVersion('1.0'),
    );
  });

  it('keeps legacy path contracts stable', () => {
    const pathBySuffix = (suffix: string) => {
      const path = Object.keys(document.paths).find((candidate) =>
        candidate.endsWith(suffix),
      );
      if (!path) {
        throw new Error(`Missing OpenAPI path with suffix ${suffix}`);
      }
      return document.paths[path];
    };

    expect({
      services: pathBySuffix('/services'),
      projects: pathBySuffix('/projects'),
      courses: pathBySuffix('/courses'),
      redirects: pathBySuffix('/redirects'),
    }).toMatchSnapshot();
  });

  it('documente par un type numerique chaque champ legacy qui porte un defaut, un exemple ou une borne numerique', () => {
    expect(champsNumeriquesSansTypeNumerique(document)).toEqual([]);
  });

  it('donne a chaque champ legacy un type, et a chaque objet sa forme', () => {
    expect(champsSansForme(document)).toEqual([]);
  });

  it('keeps legacy DTO schemas stable', () => {
    const schemas = document.components?.schemas ?? {};

    expect({
      ServiceResponseDto: schemas.ServiceResponseDto,
      ServiceListResponseDto: schemas.ServiceListResponseDto,
      ServiceRequestDto: schemas.ServiceRequestDto,
      ProjectRequestDto: schemas.ProjectRequestDto,
      ProjectResponseDto: schemas.ProjectResponseDto,
      ProjectListResponseDto: schemas.ProjectListResponseDto,
      CourseRequestDto: schemas.CourseRequestDto,
      CourseResponseDto: schemas.CourseResponseDto,
      CourseListResponseDto: schemas.CourseListResponseDto,
      RedirectRequestDto: schemas.RedirectRequestDto,
      RedirectResponseDto: schemas.RedirectResponseDto,
      RedirectListResponseDto: schemas.RedirectListResponseDto,
      PaginationMetaResponseDto: schemas.PaginationMetaResponseDto,
    }).toMatchSnapshot();
  });
});

describe('OpenAPI core contract', () => {
  let document: DocumentOpenApi;

  beforeAll(async () => {
    document = await documenterLeModule(
      {
        controllers: [
          UsersController,
          AuthController,
          ContactsController,
          CookieConsentsController,
          AuditsController,
        ],
        providers: [
          RolesGuard,

          { provide: ListUsersUseCase, useValue: stub() },
          { provide: ListOneUserUseCase, useValue: stub() },
          { provide: UpdateUsersUseCase, useValue: stub() },
          { provide: DeleteUsersUseCase, useValue: stub() },

          ...authControllerProviders(createAuthUseCaseStubs()),
          ...coreControllerProviders(createCoreUseCaseStubs()),
        ],
      },
      new DocumentBuilder()
        .setTitle('Core Contract Test')
        .setVersion('1.0')
        .addBearerAuth(),
      {
        extraModels: [
          RequestToolkitRequestDto,
          SubscribeNewsletterRequestDto,
          ArticleListQueryDto,
          JoinSessionRequestDto,
        ],
      },
    );
  });

  it('fige les schemas des DTO de saisie : comptes, contact, cookies, audit, boite a outils, newsletter, articles et entree en seance', () => {
    expect(document.components?.schemas).toMatchSnapshot();
  });

  it('documente par un type numerique chaque champ qui porte un defaut, un exemple ou une borne numerique', () => {
    expect(champsNumeriquesSansTypeNumerique(document)).toEqual([]);
  });

  it('donne a chaque champ un type, et a chaque objet sa forme', () => {
    expect(champsSansForme(document)).toEqual([]);
  });

  const pathsContaining = (segment: string) =>
    Object.fromEntries(
      Object.entries(document.paths).filter(([p]) => p.includes(`/${segment}`)),
    );

  it('keeps Users path contracts stable', () => {
    expect(pathsContaining('users')).toMatchSnapshot();
  });

  it('n annonce au PATCH utilisateur aucune valeur par défaut de la création', () => {
    const { properties } = document.components?.schemas?.UpdateUserDto as {
      properties: Record<string, object>;
    };

    expect(properties.isActive).not.toHaveProperty('default');
    expect(properties.roles).not.toHaveProperty('default');
  });

  it('keeps Auth path contracts stable', () => {
    expect(pathsContaining('auth')).toMatchSnapshot();
  });

  it('keeps Contacts path contracts stable', () => {
    expect(pathsContaining('contacts')).toMatchSnapshot();
  });

  it('keeps CookieConsents path contracts stable', () => {
    expect(pathsContaining('cookie-consents')).toMatchSnapshot();
  });

  it('keeps AuditRequests path contracts stable', () => {
    expect(pathsContaining('audits')).toMatchSnapshot();
  });
});

describe('OpenAPI contrat B2-01', () => {
  it('fige les schemas des DTO du § 9.5 sans exposer de chemin', async () => {
    const document = await documenterLeModule(
      {},
      new DocumentBuilder().setTitle('Contrat B2-01').setVersion('1.0'),
      { extraModels: DTO_DU_CONTRAT },
    );

    expect(document.paths).toEqual({});
    expect(document.components?.schemas).toMatchSnapshot();
  });

  it('QA-12 · documente nullable le verdict servi par la réponse et par l état du participant', async () => {
    const document = await documenterLeModule(
      {},
      new DocumentBuilder().setTitle('Verdict servi').setVersion('1.0'),
      { extraModels: [SubmitAnswerResponseDto, EtatParticipantResponseDto] },
    );
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

  it('branche les routes du § 9.5 deja livrees et aucune autre', async () => {
    const chemins = Object.keys((await documentDesFormations()).paths);
    const servie = (route: string): boolean =>
      chemins.some((chemin) => chemin.endsWith(route));

    expect(ROUTES_ACTIVES_DU_CONTRAT.filter((route) => !servie(route))).toEqual(
      [],
    );
    expect(ROUTES_A_VENIR_DU_CONTRAT.filter(servie)).toEqual([]);
    expect(servie('/sessions/{id}/sujet')).toBe(true);
  });
});

describe('OpenAPI des pièces jointes réservées', () => {
  let document: DocumentOpenApi;

  beforeAll(async () => {
    document = await documentDesFormations();
  });

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
  let document: DocumentOpenApi;

  beforeAll(async () => {
    document = await documentDesFormations();
  });

  it('documente par un type numerique chaque champ des formations qui porte un defaut, un exemple ou une borne numerique', () => {
    expect(champsNumeriquesSansTypeNumerique(document)).toEqual([]);
  });

  it('donne a chaque champ des formations un type, et a chaque objet sa forme', () => {
    expect(champsSansForme(document)).toEqual([]);
  });

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
  let document: DocumentOpenApi;

  beforeAll(async () => {
    document = await documentDesFormations();
  });

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
