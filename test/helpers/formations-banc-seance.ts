import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Test } from 'supertest';
import type { ICatalogueCours } from '../../src/modules/formations/domain/cours/ICatalogueCours.port';
import { EN_TETE_JETON } from '../../src/modules/formations/interfaces/ParticipantToken.service';
import { createMockFormationMailer } from '../factories/formation.factory';
import {
  DELAI_OUVERTURE_CONTEXTE_MS,
  ouvrirContexteFormations,
  type ContexteFormations,
} from './formations-db';
import {
  EN_TETE_IDENTITE,
  monterApplicationFormations,
  PREFIXE_API,
} from './formations-harness';
import { fermerApplication } from './nest-test-app';
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

export interface BancDeSeance {
  readonly contexte: () => ContexteFormations;
  readonly application: () => INestApplication;
  readonly route: (chemin: string) => string;
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
  readonly version?: number;
}): BancDeSeance {
  silenceNestLogger(['log', 'warn', 'error']);

  let contexte: ContexteFormations;
  let app: INestApplication;
  let secretJeton: string | undefined;
  let secretJalon: string | undefined;
  const identiteParDefaut =
    options.version === undefined
      ? `${FORMATEUR_DE_TEST}:teacher`
      : `${FORMATEUR_DE_TEST}:teacher:admin`;

  const serveur = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  const route = (chemin: string): string =>
    `/${PREFIXE_API}/formations${chemin}`;

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
        studentKey: cle,
        prenom,
        nom: 'Martin',
        email: `${cle}@example.test`,
      })
      .expect(CODE_HTTP.CREE);
    const { jeton, participantId } = inscription.body as ReponseInscription;
    return { ...seance, jeton, participantId };
  };

  const ouvrirSeance = async (
    ouverture: OuvertureDeSeance = {},
  ): Promise<SeanceDeTest> => {
    const identite = ouverture.identite;
    const reponse = await formateur('post', '/sessions', identite)
      .send({
        courseSlug: options.slug,
        ...(options.version === undefined ? {} : { version: options.version }),
        ...ouverture.corps,
      })
      .expect(CODE_HTTP.CREE);
    const { sessionId, code } = reponse.body as ReponseOuverture;
    if (ouverture.demarrer !== false) {
      await formateur('post', `/sessions/${sessionId}/start`, identite).expect(
        CODE_HTTP.SANS_CONTENU,
      );
    }
    const ecran = ouverture.ecran ?? options.ecran;
    if (ecran !== undefined) {
      await formateur('patch', `/sessions/${sessionId}/control`, identite)
        .send({ ecran })
        .expect(CODE_HTTP.SANS_CONTENU);
    }
    return inscrire(
      { sessionId, code },
      ouverture.cle ?? 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
    );
  };

  beforeAll(async () => {
    secretJeton = process.env.FORMATION_REVIEW_TOKEN_SECRET;
    secretJalon = process.env.FORMATIONS_PULSE_SECRET;
    process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET_DE_TEST;
    process.env.FORMATIONS_PULSE_SECRET = SECRET_DE_TEST;
    contexte = await ouvrirContexteFormations();
    app = await monterApplicationFormations(
      { ...contexte, mailer: createMockFormationMailer() },
      options.catalogue ?? contexte.catalogue,
    );
  }, DELAI_OUVERTURE_CONTEXTE_MS);

  afterEach(async () => {
    await contexte.nettoyer();
  });

  afterAll(async () => {
    await fermerApplication(app);
    await contexte.fermer();
    process.env.FORMATION_REVIEW_TOKEN_SECRET = secretJeton;
    process.env.FORMATIONS_PULSE_SECRET = secretJalon;
  });

  return {
    contexte: () => contexte,
    application: () => app,
    route,
    formateur,
    avecJeton,
    anonyme,
    inscrire,
    ouvrirSeance,
  };
}
