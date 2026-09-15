import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloseSessionUseCase } from './application/CloseSession.useCase';
import { ControlSessionUseCase } from './application/ControlSession.useCase';
import { DueQuestionsUseCase } from './application/DueQuestions.useCase';
import { GetSessionResultsUseCase } from './application/GetSessionResults.useCase';
import { JoinSessionUseCase } from './application/JoinSession.useCase';
import { LireDerouleUseCase } from './application/LireDeroule.useCase';
import { LireSujetUseCase } from './application/LireSujet.useCase';
import { OpenSessionUseCase } from './application/OpenSession.useCase';
import { RecordIncidentsUseCase } from './application/RecordIncidents.useCase';
import { StreamSessionUseCase } from './application/StreamSession.useCase';
import { SubmitAnswerUseCase } from './application/SubmitAnswer.useCase';
import { CATALOGUE_COURS_STATIQUE } from './domain/cours/catalogue';
import {
  ANSWERS_REPOSITORY,
  CATALOGUE_COURS,
  FORMATION_MAILER,
  INCIDENTS_REPOSITORY,
  MASTERY_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
  STREAM_CAPACITY,
} from './domain/token';
import { AnswersRepositoryTypeORM } from './infrastructure/Answers.repository.typeorm';
import { FormationAnswerEntity } from './infrastructure/entities/FormationAnswer.entity';
import { FormationIncidentEntity } from './infrastructure/entities/FormationIncident.entity';
import { FormationMasteryEntity } from './infrastructure/entities/FormationMastery.entity';
import { FormationParticipantEntity } from './infrastructure/entities/FormationParticipant.entity';
import { FormationSessionEntity } from './infrastructure/entities/FormationSession.entity';
import { FormationMailerService } from './infrastructure/FormationMailer.service';
import { IncidentsRepositoryTypeORM } from './infrastructure/Incidents.repository.typeorm';
import { MasteryRepositoryTypeORM } from './infrastructure/Mastery.repository.typeorm';
import { ParticipantsRepositoryTypeORM } from './infrastructure/Participants.repository.typeorm';
import { SessionsRepositoryTypeORM } from './infrastructure/Sessions.repository.typeorm';
import { SessionStateCacheService } from './infrastructure/SessionStateCache.service';
import { StreamCapacityService } from './infrastructure/StreamCapacity.service';
import { FormationsPresenterController } from './interfaces/FormationsPresenter.controller';
import { FormationsStudentController } from './interfaces/FormationsStudent.controller';
import { CodeScanProtectionService } from './interfaces/CodeScanProtection.service';
import { ParticipantTokenService } from './interfaces/ParticipantToken.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FormationSessionEntity,
      FormationParticipantEntity,
      FormationAnswerEntity,
      FormationMasteryEntity,
      FormationIncidentEntity,
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
    {
      provide: STREAM_CAPACITY,
      useClass: StreamCapacityService,
    },
    DueQuestionsUseCase,
    LireSujetUseCase,
    LireDerouleUseCase,
    ParticipantTokenService,
    CodeScanProtectionService,
    {
      provide: SESSIONS_REPOSITORY,
      useClass: SessionsRepositoryTypeORM,
    },
    {
      provide: PARTICIPANTS_REPOSITORY,
      useClass: ParticipantsRepositoryTypeORM,
    },
    {
      provide: ANSWERS_REPOSITORY,
      useClass: AnswersRepositoryTypeORM,
    },
    {
      provide: MASTERY_REPOSITORY,
      useClass: MasteryRepositoryTypeORM,
    },
    {
      provide: INCIDENTS_REPOSITORY,
      useClass: IncidentsRepositoryTypeORM,
    },
    {
      provide: FORMATION_MAILER,
      useClass: FormationMailerService,
    },
    {
      provide: SESSION_STATE_CACHE,
      useClass: SessionStateCacheService,
    },
    {
      provide: CATALOGUE_COURS,
      useValue: CATALOGUE_COURS_STATIQUE,
    },
  ],
})
export class FormationsModule {}
