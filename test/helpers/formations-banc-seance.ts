import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response, Test } from 'supertest';
import type { Cours } from '../../src/modules/formations/domain/contrats/cours';
import type { ICatalogueCours } from '../../src/modules/formations/domain/cours/ICatalogueCours.port';
import type { IFormationMailer } from '../../src/modules/formations/domain/IFormationMailer.port';
import { EN_TETE_JETON } from '../../src/modules/formations/interfaces/ParticipantToken.service';
import { creerCatalogueDeTest } from '../factories/cours.factory';
import { createMockFormationMailer } from '../factories/formation.factory';
import { describeDb } from './db-integration-datasource';
import {
  DELAI_OUVERTURE_CONTEXTE_MS,
  ouvrirContexteFormations,
  type ContexteFormations,
} from './formations-db';
import {
  EN_TETE_IDENTITE,
  monterApplicationFormations,
  routeFormations,
  serveurHttpDe,
} from './formations-harness';
import { ecouterEnBoucleLocale, fermerApplication } from './nest-test-app';
import { silenceNestLogger } from './silence-nest-logger';

export const CODE_HTTP = {
  OK: 200,
  CREE: 201,
  SANS_CONTENU: 204,
  INVALIDE: 400,
  NON_AUTORISE: 401,
  INTERDIT: 403,
  INTROUVABLE: 404,
  CONFLIT: 409,
  TROP_DE_REQUETES: 429,
} as const;

export const FORMATEUR_DE_TEST = 'a1111111-1111-4111-8111-111111111111';
export const AUTRE_FORMATEUR_DE_TEST = 'b2222222-2222-4222-8222-222222222222';
export const ADMIN_DE_TEST = 'f6666666-6666-4666-8666-666666666666';
export const SECRET_DE_TEST = 'secret-de-test-formations-assez-long-1234';

export function codeDe(reponse: Response): string | undefined {
  return (reponse.body as { code?: string }).code;
}

export function attendreRefus(
  reponse: Response,
  statut: number,
  code: string,
): void {
  expect({ statut: reponse.status, code: codeDe(reponse) }).toEqual({
    statut,
    code,
  });
}

export function statutsEnEchec(
  reponses: readonly Response[],
  attendu: number,
): number[] {
  return reponses
    .map((reponse) => reponse.status)
    .filter((statut) => statut !== attendu);
}

export type MethodeHttp = 'get' | 'post' | 'patch' | 'put' | 'delete';

export interface SeanceDeTest {
  readonly sessionId: string;
  readonly code: string;
  readonly jeton: string;
  readonly participantId: string;
}

export interface OuvertureDeSeance {
  readonly cle?: string;
  readonly ecran?: number;
  readonly corps?: Readonly<Record<string, unknown>>;
  readonly identite?: string;
  readonly demarrer?: boolean;
}

export interface SeanceOuverteDeTest {
  readonly sessionId: string;
  readonly code: string;
}

export interface BancDeSeance {
  readonly contexte: () => ContexteFormations;
  readonly application: () => INestApplication;
  readonly mailer: () => jest.Mocked<IFormationMailer>;
  readonly port: () => number;
  readonly remonter: () => Promise<void>;
  readonly route: (chemin: string) => string;
  readonly ouvrir: (
    corps?: Readonly<Record<string, unknown>>,
    identite?: string,
  ) => Promise<SeanceOuverteDeTest>;
  readonly piloter: (
    sessionId: string,
    corps: Readonly<Record<string, unknown>>,
    identite?: string,
  ) => Test;
  readonly formateur: (
    methode: MethodeHttp,
    chemin: string,
    identite?: string,
  ) => Test;
  readonly avecJeton: (
    methode: MethodeHttp,
    chemin: string,
    jeton: string,
  ) => Test;
  readonly anonyme: (methode: MethodeHttp, chemin: string) => Test;
  readonly inscrire: (
    seance: { readonly sessionId: string; readonly code: string },
    cle: string,
    prenom?: string,
  ) => Promise<SeanceDeTest>;
  readonly ouvrirSeance: (options?: OuvertureDeSeance) => Promise<SeanceDeTest>;
  readonly ouvrirPuisRamener: (
    cle: string,
    ecran: number,
  ) => Promise<SeanceDeTest>;
  readonly ouvrirDeuxSeances: (
    cle: string,
    cleAutre: string,
  ) => Promise<[SeanceDeTest, SeanceDeTest]>;
}

interface ReponseOuverture {
  sessionId: string;
  code: string;
}

interface ReponseInscription {
  participantId: string;
  jeton: string;
}

export function installerBancDeSeance(options: {
  readonly catalogue?: ICatalogueCours;
  readonly slug: string;
  readonly ecran?: number;
  readonly environnement?: Readonly<Record<string, string>>;
}): BancDeSeance {
  silenceNestLogger(['log', 'warn', 'error']);

  let contexte: ContexteFormations;
  let app: INestApplication;
  let mailer: jest.Mocked<IFormationMailer>;
  let port: number;
  const identiteParDefaut = `${FORMATEUR_DE_TEST}:teacher`;

  const serveur = () => serveurHttpDe(app);

  const route = routeFormations;

  const formateur = (
    methode: MethodeHttp,
    chemin: string,
    identite = identiteParDefaut,
  ): Test =>
    request(serveur())[methode](route(chemin)).set(EN_TETE_IDENTITE, identite);

  const avecJeton = (
    methode: MethodeHttp,
    chemin: string,
    jeton: string,
  ): Test =>
    request(serveur())[methode](route(chemin)).set(EN_TETE_JETON, jeton);

  const anonyme = (methode: MethodeHttp, chemin: string): Test =>
    request(serveur())[methode](route(chemin));

  const inscrire = async (
    seance: { readonly sessionId: string; readonly code: string },
    cle: string,
    prenom = 'Theo',
  ): Promise<SeanceDeTest> => {
    const inscription = await anonyme('post', `/sessions/${seance.code}/join`)
      .send({
        prenom,
        nom: 'Martin',
        email: `${cle}@example.test`,
      })
      .expect(CODE_HTTP.CREE);
    const { jeton, participantId } = inscription.body as ReponseInscription;
    return { ...seance, jeton, participantId };
  };

  const ouvrir = async (
    corps: Readonly<Record<string, unknown>> = {},
    identite?: string,
  ): Promise<SeanceOuverteDeTest> => {
    const reponse = await formateur('post', '/sessions', identite)
      .send({ courseSlug: options.slug, ...corps })
      .expect(CODE_HTTP.CREE);
    const { sessionId, code } = reponse.body as ReponseOuverture;
    return { sessionId, code };
  };

  const piloter = (
    sessionId: string,
    corps: Readonly<Record<string, unknown>>,
    identite?: string,
  ): Test =>
    formateur('patch', `/sessions/${sessionId}/control`, identite).send(corps);

  const ouvrirSeance = async (
    ouverture: OuvertureDeSeance = {},
  ): Promise<SeanceDeTest> => {
    const identite = ouverture.identite;
    const seance = await ouvrir(ouverture.corps, identite);
    if (ouverture.demarrer !== false) {
      await formateur(
        'post',
        `/sessions/${seance.sessionId}/start`,
        identite,
      ).expect(CODE_HTTP.SANS_CONTENU);
    }
    const ecran = ouverture.ecran ?? options.ecran;
    if (ecran !== undefined) {
      await piloter(seance.sessionId, { ecran }, identite).expect(
        CODE_HTTP.SANS_CONTENU,
      );
    }
    return inscrire(
      seance,
      ouverture.cle ?? 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
    );
  };

  const ouvrirPuisRamener = async (
    cle: string,
    ecran: number,
  ): Promise<SeanceDeTest> => {
    const seance = await ouvrirSeance({ cle });
    await piloter(seance.sessionId, { ecran }).expect(CODE_HTTP.SANS_CONTENU);
    return seance;
  };

  const ouvrirDeuxSeances = async (
    cle: string,
    cleAutre: string,
  ): Promise<[SeanceDeTest, SeanceDeTest]> => [
    await ouvrirSeance({ cle }),
    await ouvrirSeance({ cle: cleAutre }),
  ];

  const monter = async (): Promise<void> => {
    mailer = createMockFormationMailer();
    app = await monterApplicationFormations(
      { ...contexte, mailer },
      options.catalogue ?? contexte.catalogue,
    );
    port = await ecouterEnBoucleLocale(app);
  };

  const remonter = async (): Promise<void> => {
    await fermerApplication(app);
    await monter();
  };

  const environnement: Readonly<Record<string, string>> = {
    FORMATION_REVIEW_TOKEN_SECRET: SECRET_DE_TEST,
    FORMATIONS_PULSE_SECRET: SECRET_DE_TEST,
    ...options.environnement,
  };
  const environnementAnterieur = new Map<string, string | undefined>();

  beforeAll(async () => {
    for (const [cle, valeur] of Object.entries(environnement)) {
      environnementAnterieur.set(cle, process.env[cle]);
      process.env[cle] = valeur;
    }
    contexte = await ouvrirContexteFormations();
    await monter();
  }, DELAI_OUVERTURE_CONTEXTE_MS);

  afterEach(async () => {
    await contexte.nettoyer();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await fermerApplication(app);
    await contexte.fermer();
    for (const [cle, valeur] of environnementAnterieur) {
      if (valeur === undefined) {
        delete process.env[cle];
      } else {
        process.env[cle] = valeur;
      }
    }
  });

  return {
    contexte: () => contexte,
    application: () => app,
    mailer: () => mailer,
    port: () => port,
    remonter,
    route,
    ouvrir,
    piloter,
    formateur,
    avecJeton,
    anonyme,
    inscrire,
    ouvrirSeance,
    ouvrirPuisRamener,
    ouvrirDeuxSeances,
  };
}

export function installerBancSurLeDernierEcran(cours: Cours): BancDeSeance {
  return installerBancDeSeance({
    catalogue: creerCatalogueDeTest(cours),
    slug: cours.slug,
    ecran: cours.ecrans.length - 1,
  });
}

type EnvoiDuPoste = (seance: SeanceDeTest) => PromiseLike<Response>;

export async function attendreEcranNonServi(
  banc: BancDeSeance,
  cle: string,
  envoyer: EnvoiDuPoste,
): Promise<void> {
  const seance = await banc.ouvrirPuisRamener(cle, 0);

  attendreRefus(
    await envoyer(seance),
    CODE_HTTP.INTROUVABLE,
    'ECRAN_NON_SERVI',
  );
}

export async function attendreJetonEtrangerRefuse(
  banc: BancDeSeance,
  cles: readonly [string, string],
  envoyer: EnvoiDuPoste,
): Promise<void> {
  const [seance, autre] = await banc.ouvrirDeuxSeances(...cles);

  const refus = await envoyer({ ...seance, jeton: autre.jeton });

  expect(refus.status).toBe(CODE_HTTP.NON_AUTORISE);
}

export function decrireSurLeDernierEcran(
  titre: string,
  cours: Cours,
  definir: (banc: BancDeSeance) => void,
): void {
  describeDb(titre, () => definir(installerBancSurLeDernierEcran(cours)));
}
