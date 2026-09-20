import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
  ValidationPipe,
  type Provider,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test as ModuleDeTest } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  request as requeteNode,
  type IncomingMessage,
  type Server,
} from 'node:http';
import request from 'supertest';
import type { Test } from 'supertest';
import { IS_PUBLIC_KEY } from '../../src/common/interfaces/auth/public.decorator';
import { AllExceptionsFilter } from '../../src/common/interfaces/filters/all-exceptions.filter';
import { DomainExceptionFilter } from '../../src/common/interfaces/filters/DomainExceptionFilter';
import { CloseSessionUseCase } from '../../src/modules/formations/application/CloseSession.useCase';
import { ControlSessionUseCase } from '../../src/modules/formations/application/ControlSession.useCase';
import { DueQuestionsUseCase } from '../../src/modules/formations/application/DueQuestions.useCase';
import { GetSessionResultsUseCase } from '../../src/modules/formations/application/GetSessionResults.useCase';
import { JoinSessionUseCase } from '../../src/modules/formations/application/JoinSession.useCase';
import { LireCoursPublicUseCase } from '../../src/modules/formations/application/LireCoursPublic.useCase';
import { LireDerouleUseCase } from '../../src/modules/formations/application/LireDeroule.useCase';
import { LireSujetUseCase } from '../../src/modules/formations/application/LireSujet.useCase';
import { ListFreeResponsesUseCase } from '../../src/modules/formations/application/ListFreeResponses.useCase';
import { ListSessionParticipantsUseCase } from '../../src/modules/formations/application/ListSessionParticipants.useCase';
import { ManageFormationGroupsUseCase } from '../../src/modules/formations/application/ManageFormationGroups.useCase';
import { ManageTeacherAnnotationsUseCase } from '../../src/modules/formations/application/ManageTeacherAnnotations.useCase';
import { OpenSessionUseCase } from '../../src/modules/formations/application/OpenSession.useCase';
import { RecordIncidentsUseCase } from '../../src/modules/formations/application/RecordIncidents.useCase';
import { SaveFreeResponseUseCase } from '../../src/modules/formations/application/SaveFreeResponse.useCase';
import { StreamSessionUseCase } from '../../src/modules/formations/application/StreamSession.useCase';
import { SubmitAnswerUseCase } from '../../src/modules/formations/application/SubmitAnswer.useCase';
import { DeclarerJalonUseCase } from '../../src/modules/formations/application/DeclarerJalon.useCase';
import { DefisUseCase } from '../../src/modules/formations/application/Defis.useCase';
import { SubmitProductionUseCase } from '../../src/modules/formations/application/SubmitProduction.useCase';
import { TenterEnigmeUseCase } from '../../src/modules/formations/application/TenterEnigme.useCase';
import type { IAnswersRepository } from '../../src/modules/formations/domain/IAnswers.repository';
import type { IFormationGroupsRepository } from '../../src/modules/formations/domain/IFormationGroups.repository';
import type { IEscapeRepository } from '../../src/modules/formations/domain/IEscape.repository';
import type { IFormationMailer } from '../../src/modules/formations/domain/IFormationMailer.port';
import type { IPulsesRepository } from '../../src/modules/formations/domain/IPulses.repository';
import type { IFreeResponsesRepository } from '../../src/modules/formations/domain/IFreeResponses.repository';
import type { IIncidentsRepository } from '../../src/modules/formations/domain/IIncidents.repository';
import type { IMasteryRepository } from '../../src/modules/formations/domain/IMastery.repository';
import type { IParticipantsRepository } from '../../src/modules/formations/domain/IParticipants.repository';
import type { IScoresRepository } from '../../src/modules/formations/domain/IScores.repository';
import type { ISessionsRepository } from '../../src/modules/formations/domain/ISessions.repository';
import type { ITeacherAnnotationsRepository } from '../../src/modules/formations/domain/ITeacherAnnotations.repository';
import type { Cours } from '../../src/modules/formations/domain/contrats/cours';
import type { ICatalogueCours } from '../../src/modules/formations/domain/cours/ICatalogueCours.port';
import {
  ANSWERS_REPOSITORY,
  CATALOGUE_COURS,
  FORMATION_GROUPS_REPOSITORY,
  FORMATION_MAILER,
  FREE_RESPONSES_REPOSITORY,
  INCIDENTS_REPOSITORY,
  MASTERY_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  ESCAPE_REPOSITORY,
  PULSES_REPOSITORY,
  SCORES_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
  TEACHER_ANNOTATIONS_REPOSITORY,
} from '../../src/modules/formations/domain/token';
import { SessionStateCacheService } from '../../src/modules/formations/infrastructure/SessionStateCache.service';
import { CodeScanProtectionService } from '../../src/modules/formations/interfaces/CodeScanProtection.service';
import { FormationsAnnotationsController } from '../../src/modules/formations/interfaces/FormationsAnnotations.controller';
import { FormationsCatalogController } from '../../src/modules/formations/interfaces/FormationsCatalog.controller';
import { FormationsGroupsController } from '../../src/modules/formations/interfaces/FormationsGroups.controller';
import { FormationsPresenterController } from '../../src/modules/formations/interfaces/FormationsPresenter.controller';
import { FormationsStudentController } from '../../src/modules/formations/interfaces/FormationsStudent.controller';
import {
  EN_TETE_JETON,
  ParticipantTokenService,
} from '../../src/modules/formations/interfaces/ParticipantToken.service';
import { createMockFormationMailer } from '../factories/formation.factory';
import {
  buildCoursDeTest,
  creerCatalogueDeTest,
} from '../factories/cours.factory';
import {
  ouvrirContexteFormations,
  type ContexteFormations,
} from './formations-db';
import {
  ADRESSE_BOUCLE_LOCALE,
  ecouterEnBoucleLocale,
  fermerApplication,
} from './nest-test-app';
import { GLOBAL_VALIDATION_PIPE_OPTIONS } from './validation-pipe';

export const PREFIXE_API = 'api/v1/portfolio25';
export const EN_TETE_IDENTITE = 'x-test-identite';

const COURS_FORMATION_TEST = buildCoursDeTest({
  slug: 'b2-01-traitement-information-chiffree',
});
const CATALOGUE_FORMATIONS_TEST = creerCatalogueDeTest(COURS_FORMATION_TEST);

export function coursPublie(slug: string): Cours {
  if (slug !== COURS_FORMATION_TEST.slug) {
    throw new Error(`Le cours ${slug} est absent du catalogue publie`);
  }
  return COURS_FORMATION_TEST;
}

const FENETRE_THROTTLE_MS = 60_000;
const LIMITE_THROTTLE_PAR_DEFAUT = 30;

@Injectable()
class IdentiteDeTestGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const estPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (estPublic) {
      return true;
    }
    const requete = context.switchToHttp().getRequest<Request>();
    const entete = requete.headers[EN_TETE_IDENTITE];
    if (typeof entete !== 'string') {
      throw new UnauthorizedException();
    }
    const [sub, ...roles] = entete.split(':');
    requete.user = { sub, roles } as Request['user'];
    return true;
  }
}

export interface DepotsFormations {
  sessions: ISessionsRepository;
  participants: IParticipantsRepository;
  answers: IAnswersRepository;
  incidents: IIncidentsRepository;
  mastery: IMasteryRepository;
  scores: IScoresRepository;
  freeResponses: IFreeResponsesRepository;
  annotations: ITeacherAnnotationsRepository;
  groups: IFormationGroupsRepository;
  escape: IEscapeRepository;
  pulses: IPulsesRepository;
  mailer: IFormationMailer;
}

export const CONTROLEURS_FORMATIONS = [
  FormationsPresenterController,
  FormationsGroupsController,
  FormationsAnnotationsController,
  FormationsStudentController,
  FormationsCatalogController,
];

export function fournisseursFormations(
  depots: DepotsFormations,
  catalogue: ICatalogueCours,
): Provider[] {
  return [
    OpenSessionUseCase,
    ControlSessionUseCase,
    CloseSessionUseCase,
    GetSessionResultsUseCase,
    JoinSessionUseCase,
    SubmitAnswerUseCase,
    SubmitProductionUseCase,
    TenterEnigmeUseCase,
    DeclarerJalonUseCase,
    DefisUseCase,
    RecordIncidentsUseCase,
    StreamSessionUseCase,
    DueQuestionsUseCase,
    LireSujetUseCase,
    LireDerouleUseCase,
    LireCoursPublicUseCase,
    ManageTeacherAnnotationsUseCase,
    ManageFormationGroupsUseCase,
    ListSessionParticipantsUseCase,
    ListFreeResponsesUseCase,
    SaveFreeResponseUseCase,
    ParticipantTokenService,
    CodeScanProtectionService,
    { provide: SESSIONS_REPOSITORY, useValue: depots.sessions },
    { provide: PARTICIPANTS_REPOSITORY, useValue: depots.participants },
    { provide: ANSWERS_REPOSITORY, useValue: depots.answers },
    { provide: INCIDENTS_REPOSITORY, useValue: depots.incidents },
    { provide: MASTERY_REPOSITORY, useValue: depots.mastery },
    { provide: SCORES_REPOSITORY, useValue: depots.scores },
    { provide: FREE_RESPONSES_REPOSITORY, useValue: depots.freeResponses },
    { provide: TEACHER_ANNOTATIONS_REPOSITORY, useValue: depots.annotations },
    { provide: FORMATION_GROUPS_REPOSITORY, useValue: depots.groups },
    { provide: ESCAPE_REPOSITORY, useValue: depots.escape },
    { provide: PULSES_REPOSITORY, useValue: depots.pulses },
    { provide: FORMATION_MAILER, useValue: depots.mailer },
    { provide: CATALOGUE_COURS, useValue: catalogue },
    { provide: SESSION_STATE_CACHE, useClass: SessionStateCacheService },
  ];
}

export async function monterApplicationFormations(
  depots: DepotsFormations,
  catalogue: ICatalogueCours = CATALOGUE_FORMATIONS_TEST,
): Promise<INestApplication> {
  const moduleRef = await ModuleDeTest.createTestingModule({
    imports: [
      ThrottlerModule.forRoot([
        { ttl: FENETRE_THROTTLE_MS, limit: LIMITE_THROTTLE_PAR_DEFAUT },
      ]),
    ],
    controllers: CONTROLEURS_FORMATIONS,
    providers: [
      ...fournisseursFormations(depots, catalogue),
      { provide: APP_GUARD, useClass: IdentiteDeTestGuard },
      { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix(PREFIXE_API);
  app.useGlobalFilters(new AllExceptionsFilter(), new DomainExceptionFilter());
  app.useGlobalPipes(new ValidationPipe(GLOBAL_VALIDATION_PIPE_OPTIONS));
  await app.init();
  return app;
}

export interface EvenementFlux {
  type: string;
  donnees: Record<string, unknown>;
}

export interface FluxEcoute {
  statut: number;
  evenements: EvenementFlux[];
  ferme: boolean;
  fermer(): void;
}

const SEPARATEUR_DE_TRAMES = '\n\n';
const PREFIXE_EVENEMENT = 'event: ';
const PREFIXE_DONNEES = 'data: ';

function evenementsDeLaTrame(trame: string): EvenementFlux[] {
  const lignes = trame.split('\n');
  const type = lignes
    .find((ligne) => ligne.startsWith(PREFIXE_EVENEMENT))
    ?.slice(PREFIXE_EVENEMENT.length);
  const donnees = lignes
    .filter((ligne) => ligne.startsWith(PREFIXE_DONNEES))
    .map((ligne) => ligne.slice(PREFIXE_DONNEES.length));
  if (type === undefined || donnees.length === 0) {
    return [];
  }
  return [
    {
      type,
      donnees: JSON.parse(donnees.join('\n')) as Record<string, unknown>,
    },
  ];
}

function suivreLeFlux(reponse: IncomingMessage, flux: FluxEcoute): void {
  let reste = '';
  reponse.setEncoding('utf8');
  reponse.on('data', (morceau: string) => {
    const trames = `${reste}${morceau}`.split(SEPARATEUR_DE_TRAMES);
    reste = trames.pop() ?? '';
    flux.evenements.push(...trames.flatMap(evenementsDeLaTrame));
  });
  reponse.on('close', () => {
    flux.ferme = true;
  });
}

export function abonnerAuFlux(
  port: number,
  chemin: string,
  entetes: Readonly<Record<string, string>>,
): Promise<FluxEcoute> {
  return new Promise((resoudre, rejeter) => {
    const requete = requeteNode(
      { host: ADRESSE_BOUCLE_LOCALE, port, path: chemin, headers: entetes },
      (reponse) => {
        const flux: FluxEcoute = {
          statut: reponse.statusCode ?? 0,
          evenements: [],
          ferme: false,
          fermer: () => requete.destroy(),
        };
        suivreLeFlux(reponse, flux);
        resoudre(flux);
      },
    );
    requete.on('error', rejeter);
    requete.end();
  });
}

export function fermetureCoteServeur(
  app: INestApplication,
  chemin: string,
): Promise<void> {
  const serveur = app.getHttpServer() as Server;
  return new Promise((resoudre) => {
    const surRequete = (requete: IncomingMessage): void => {
      if (requete.url !== chemin) {
        return;
      }
      serveur.off('request', surRequete);
      requete.once('close', () => resoudre());
    };
    serveur.on('request', surRequete);
  });
}

export function patienter(delaiMs: number): Promise<void> {
  return new Promise((resoudre) => setTimeout(resoudre, delaiMs));
}

const PAS_ATTENTE_MS = 10;

export async function attendreQue(
  condition: () => boolean,
  delaiMaxMs: number,
): Promise<void> {
  const limite = Date.now() + delaiMaxMs;
  while (!condition() && Date.now() < limite) {
    await patienter(PAS_ATTENTE_MS);
  }
}

export interface BancFormations {
  contexte: ContexteFormations;
  app: INestApplication;
  mailer: jest.Mocked<IFormationMailer>;
  port: number;
  fermer(): Promise<void>;
}

export async function monterBancFormations(
  catalogueDeTest?: ICatalogueCours,
): Promise<BancFormations> {
  const contexte = await ouvrirContexteFormations();
  const mailer = createMockFormationMailer();
  const app = await monterApplicationFormations(
    { ...contexte, mailer },
    catalogueDeTest ?? contexte.catalogue,
  );
  const port = await ecouterEnBoucleLocale(app);
  return {
    contexte,
    app,
    mailer,
    port,
    async fermer(): Promise<void> {
      await fermerApplication(app);
      await contexte.fermer();
    },
  };
}

export function clientFormations(
  app: INestApplication,
  formateurId: string,
): ClientFormations {
  const serveur = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];
  const chemin = (suffixe: string): string =>
    `/${PREFIXE_API}/formations${suffixe}`;
  const formateur = (
    methode: 'post' | 'patch' | 'get',
    suffixe: string,
  ): Test =>
    request(serveur())
      [methode](chemin(suffixe))
      .set(EN_TETE_IDENTITE, `${formateurId}:teacher`);
  return {
    chemin,
    formateur,
    participant: (suffixe, jeton) =>
      request(serveur()).post(chemin(suffixe)).set(EN_TETE_JETON, jeton),
    anonyme: (suffixe) => request(serveur()).post(chemin(suffixe)),
  };
}

export interface ClientFormations {
  chemin(suffixe: string): string;
  formateur(methode: 'post' | 'patch' | 'get', suffixe: string): Test;
  participant(suffixe: string, jeton: string): Test;
  anonyme(suffixe: string): Test;
}
