import type { OpenAPIObject } from '@nestjs/swagger';

import { deroulePresentateur } from '../src/modules/formations/domain/cours/DeroulePresentateur';
import {
  correctionDeLEcranRevele,
  correctionServie,
  correctionSurPlaceServie,
} from '../src/modules/formations/domain/cours/Diffusion';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import {
  ecranVerrouille,
  exempleAuRythmeDuPilotage,
} from '../src/modules/formations/domain/cours/Diffusion';
import { DONNEES_PAR_BRIQUE } from '../src/modules/formations/domain/contrats/donnees-servies';
import { MOTIF_D_UNE_ADRESSE_EMAIL } from '../src/common/domain/value-objects/EmailAddress';
import { buildCoursDuContenu } from './factories/contenus-de-cours.factory';
import { buildCoursDeTest } from './factories/cours.factory';
import { CONTENUS } from './factories/contenus-publies';
import {
  documentPublie,
  ecartsAuSchemaDeReponse,
  estSansFormeHorsOuverts,
  evenementsDuFlux,
  type SchemaOpenApi,
} from './helpers/schema-openapi';

type DocumentOpenApi = OpenAPIObject;

const document: DocumentOpenApi = documentPublie();

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
    .filter(([nom, schema]) =>
      estSansFormeHorsOuverts(nom, schema as SchemaOpenApi),
    )
    .map(([nom]) => nom);

describe('OpenAPI des adresses e-mail', () => {
  it('publie sur chaque champ email saisi le motif du domaine, et aucun format que le front lirait autrement', () => {
    const champs = Object.entries(document.components?.schemas ?? {}).flatMap(
      ([nom, schema]) => {
        const email = (schema as SchemaOpenApi).properties?.email;
        return email === undefined || nom.endsWith('ResponseDto')
          ? []
          : [[nom, email] as const];
      },
    );

    expect(champs.length).toBeGreaterThan(0);
    expect(
      champs.filter(
        ([, email]) =>
          email.pattern !== MOTIF_D_UNE_ADRESSE_EMAIL.source ||
          email.format !== undefined,
      ),
    ).toEqual([]);
  });
});

describe('OpenAPI du contrat publié', () => {
  it('documente par un type numerique chaque champ qui porte un defaut, un exemple ou une borne numerique', () => {
    expect(champsNumeriquesSansTypeNumerique(document)).toEqual([]);
  });

  it('donne a chaque champ un type, et a chaque objet sa forme', () => {
    expect(champsSansForme(document)).toEqual([]);
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

describe('OpenAPI des données de chaque brique', () => {
  const ecransServis = [
    ...CONTENUS.map(buildCoursDuContenu),
    buildCoursDeTest(),
  ].flatMap((cours) => {
    const sujet = tirer(cours, 0).sujet.ecrans;
    return [
      ...sujet,
      ...sujet.map(ecranVerrouille),
      ...sujet.map((ecran) => exempleAuRythmeDuPilotage(ecran, undefined)),
      ...deroulePresentateur(cours, 0).ecrans,
    ];
  });

  it('valide par le schéma de sa brique les données de chaque écran servi, sur tous les cours', () => {
    const ecarts = ecransServis.flatMap(({ id, type, donnees }) => {
      const lecture = DONNEES_PAR_BRIQUE[type].safeParse(donnees);
      return lecture.success
        ? []
        : lecture.error.issues.map(
            (probleme) =>
              `${id} : ${probleme.path.join('.')} ${probleme.message}`,
          );
    });

    expect(ecransServis.length).toBeGreaterThan(0);
    expect([...new Set(ecarts)]).toEqual([]);
  });

  it('sert chaque brique décrite au moins une fois', () => {
    const servies = new Set<string>(ecransServis.map(({ type }) => type));

    expect(
      Object.keys(DONNEES_PAR_BRIQUE).filter((brique) => !servies.has(brique)),
    ).toEqual([]);
  });

  it.each(['/sujet', '/deroule'])(
    'lie les données de l écran de %s à sa brique : un vote qui porte les données d un rappel est refusé',
    (route) => {
      const cours = buildCoursDuContenu(CONTENUS[0]);
      const servi =
        route === '/sujet'
          ? tirer(cours, 0).sujet
          : deroulePresentateur(cours, 0);
      const rappel = servi.ecrans.find(({ type }) => type === 'fp-recall');

      expect(rappel).toBeDefined();
      expect(ecartsAuSchemaDeReponse(document, route, servi)).toEqual([]);
      expect(
        ecartsAuSchemaDeReponse(document, route, {
          ...servi,
          ecrans: [{ ...rappel, type: 'fp-vote' }],
        }),
      ).not.toEqual([]);
    },
  );
});

describe('OpenAPI des flux d événements', () => {
  const donneesParEvenement = (suffixe: string): Record<string, string> =>
    Object.fromEntries(
      Object.entries(evenementsDuFlux(document, suffixe)).map(
        ([nom, { $ref }]) => [nom, $ref?.split('/').at(-1) ?? ''],
      ),
    );
  const FLUX_DU_POSTE = {
    etat: 'EtatDeSeanceResponseDto',
    fin: 'FinDuFluxResponseDto',
    heartbeat: 'BattementResponseDto',
  };

  it('nomme chaque événement du flux du poste et la forme de ses données', () => {
    expect(donneesParEvenement('/sessions/{id}/stream')).toEqual(FLUX_DU_POSTE);
  });

  it('ajoute au flux du pupitre les résultats en direct', () => {
    expect(donneesParEvenement('/sessions/{id}/presenter-stream')).toEqual({
      ...FLUX_DU_POSTE,
      resultats: 'ResultatsEnDirectResponseDto',
    });
  });

  it('nomme chaque événement du flux d audit et la forme de ses données', () => {
    expect(donneesParEvenement('/audits/{id}/stream')).toEqual({
      progress: 'ProgressionDAuditResponseDto',
      completed: 'AuditTermineResponseDto',
      failed: 'AuditEchoueResponseDto',
      timeout: 'AuditExpireResponseDto',
      heartbeat: 'BattementResponseDto',
    });
  });

  it('nomme dans le contrat chaque composant référencé', () => {
    const references = [
      ...JSON.stringify(document).matchAll(
        /"#\/components\/schemas\/([^"]+)"/g,
      ),
    ].map(([, nom]) => nom);

    expect(
      [...new Set(references)].filter(
        (nom) => document.components?.schemas?.[nom] === undefined,
      ),
    ).toEqual([]);
  });
});
