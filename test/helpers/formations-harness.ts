import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test as ModuleDeTest } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { Request } from 'express';
import type { AddressInfo } from 'node:net';
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
import { OpenSessionUseCase } from '../../src/modules/formations/application/OpenSession.useCase';
import { RecordIncidentsUseCase } from '../../src/modules/formations/application/RecordIncidents.useCase';
import { StreamSessionUseCase } from '../../src/modules/formations/application/StreamSession.useCase';
import { SubmitAnswerUseCase } from '../../src/modules/formations/application/SubmitAnswer.useCase';
import type { IAnswersRepository } from '../../src/modules/formations/domain/IAnswers.repository';
import type { IFormationMailer } from '../../src/modules/formations/domain/IFormationMailer.port';
import type { IIncidentsRepository } from '../../src/modules/formations/domain/IIncidents.repository';
import type { IMasteryRepository } from '../../src/modules/formations/domain/IMastery.repository';
import type { IParticipantsRepository } from '../../src/modules/formations/domain/IParticipants.repository';
import type { ISessionsRepository } from '../../src/modules/formations/domain/ISessions.repository';
import {
  ANSWERS_REPOSITORY,
  FORMATION_MAILER,
  INCIDENTS_REPOSITORY,
  MASTERY_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../../src/modules/formations/domain/token';
import { SessionStateCacheService } from '../../src/modules/formations/infrastructure/SessionStateCache.service';
import { CodeScanProtectionService } from '../../src/modules/formations/interfaces/CodeScanProtection.service';
import { FormationsPresenterController } from '../../src/modules/formations/interfaces/FormationsPresenter.controller';
import { FormationsStudentController } from '../../src/modules/formations/interfaces/FormationsStudent.controller';
import {
  EN_TETE_JETON,
  ParticipantTokenService,
} from '../../src/modules/formations/interfaces/ParticipantToken.service';
import { createMockFormationMailer } from '../factories/formation.factory';
import {
  ouvrirContexteFormations,
  type ContexteFormations,
} from './formations-db';
import { GLOBAL_VALIDATION_PIPE_OPTIONS } from './validation-pipe';

export const PREFIXE_API = 'api/v1/portfolio25';
export const EN_TETE_IDENTITE = 'x-test-identite';

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
  mailer: IFormationMailer;
}

export async function monterApplicationFormations(
  depots: DepotsFormations,
): Promise<INestApplication> {
  const moduleRef = await ModuleDeTest.createTestingModule({
    imports: [
      ThrottlerModule.forRoot([
        { ttl: FENETRE_THROTTLE_MS, limit: LIMITE_THROTTLE_PAR_DEFAUT },
      ]),
    ],
    controllers: [FormationsPresenterController, FormationsStudentController],
    providers: [
      OpenSessionUseCase,
      ControlSessionUseCase,
      CloseSessionUseCase,
      GetSessionResultsUseCase,
      JoinSessionUseCase,
      SubmitAnswerUseCase,
      RecordIncidentsUseCase,
      StreamSessionUseCase,
      DueQuestionsUseCase,
      ParticipantTokenService,
      CodeScanProtectionService,
      { provide: SESSIONS_REPOSITORY, useValue: depots.sessions },
      { provide: PARTICIPANTS_REPOSITORY, useValue: depots.participants },
      { provide: ANSWERS_REPOSITORY, useValue: depots.answers },
      { provide: INCIDENTS_REPOSITORY, useValue: depots.incidents },
      { provide: MASTERY_REPOSITORY, useValue: depots.mastery },
      { provide: FORMATION_MAILER, useValue: depots.mailer },
      { provide: SESSION_STATE_CACHE, useClass: SessionStateCacheService },
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

export interface BancFormations {
  contexte: ContexteFormations;
  app: INestApplication;
  mailer: jest.Mocked<IFormationMailer>;
  port: number;
  fermer(): Promise<void>;
}

export async function monterBancFormations(): Promise<BancFormations> {
  const contexte = await ouvrirContexteFormations();
  const mailer = createMockFormationMailer();
  const app = await monterApplicationFormations({
    sessions: contexte.sessions,
    participants: contexte.participants,
    answers: contexte.answers,
    incidents: contexte.incidents,
    mastery: contexte.mastery,
    mailer,
  });
  await app.listen(0);
  return {
    contexte,
    app,
    mailer,
    port: (app.getHttpServer().address() as AddressInfo).port,
    async fermer(): Promise<void> {
      await app.close();
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
