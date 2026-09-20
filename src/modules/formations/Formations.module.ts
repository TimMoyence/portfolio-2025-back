import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloseSessionUseCase } from './application/CloseSession.useCase';
import { ControlSessionUseCase } from './application/ControlSession.useCase';
import { DueQuestionsUseCase } from './application/DueQuestions.useCase';
import { GetSessionResultsUseCase } from './application/GetSessionResults.useCase';
import { JoinSessionUseCase } from './application/JoinSession.useCase';
import { LireCoursPublicUseCase } from './application/LireCoursPublic.useCase';
import { LireDerouleUseCase } from './application/LireDeroule.useCase';
import { LireSujetUseCase } from './application/LireSujet.useCase';
import { ListFreeResponsesUseCase } from './application/ListFreeResponses.useCase';
import { ListSessionParticipantsUseCase } from './application/ListSessionParticipants.useCase';
import { ManageFormationGroupsUseCase } from './application/ManageFormationGroups.useCase';
import { ManageTeacherAnnotationsUseCase } from './application/ManageTeacherAnnotations.useCase';
import { OpenSessionUseCase } from './application/OpenSession.useCase';
import { RecordIncidentsUseCase } from './application/RecordIncidents.useCase';
import { SaveFreeResponseUseCase } from './application/SaveFreeResponse.useCase';
import { StreamSessionUseCase } from './application/StreamSession.useCase';
import { SubmitAnswerUseCase } from './application/SubmitAnswer.useCase';
import { DeclarerJalonUseCase } from './application/DeclarerJalon.useCase';
import { DefisUseCase } from './application/Defis.useCase';
import { SubmitProductionUseCase } from './application/SubmitProduction.useCase';
import { TenterEnigmeUseCase } from './application/TenterEnigme.useCase';
import {
  ANSWERS_REPOSITORY,
  CATALOGUE_COURS,
  ESCAPE_REPOSITORY,
  FREE_RESPONSES_REPOSITORY,
  PULSES_REPOSITORY,
  FORMATION_GROUPS_REPOSITORY,
  FORMATION_MAILER,
  INCIDENTS_REPOSITORY,
  MASTERY_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SCORES_REPOSITORY,
  SESSIONS_REPOSITORY,
  STREAM_CAPACITY,
  TEACHER_ANNOTATIONS_REPOSITORY,
} from './domain/token';
import { AnswersRepositoryTypeORM } from './infrastructure/Answers.repository.typeorm';
import { FormationAnswerEntity } from './infrastructure/entities/FormationAnswer.entity';
import { FormationEscapeAttemptEntity } from './infrastructure/entities/FormationEscapeAttempt.entity';
import { FormationEscapeProgressEntity } from './infrastructure/entities/FormationEscapeProgress.entity';
import { EscapeRepositoryTypeORM } from './infrastructure/Escape.repository.typeorm';
import { FormationPulseEntity } from './infrastructure/entities/FormationPulse.entity';
import { PulsesRepositoryTypeORM } from './infrastructure/Pulses.repository.typeorm';
import { FreeResponsesRepositoryTypeORM } from './infrastructure/FreeResponses.repository.typeorm';
import { FormationGroupsRepositoryTypeORM } from './infrastructure/FormationGroups.repository.typeorm';
import { FormationFreeResponseEntity } from './infrastructure/entities/FormationFreeResponse.entity';
import { FormationGroupEntity } from './infrastructure/entities/FormationGroup.entity';
import { FormationScoreEntity } from './infrastructure/entities/FormationScore.entity';
import { ScoresRepositoryTypeORM } from './infrastructure/Scores.repository.typeorm';
import { FormationTeacherAnnotationEntity } from './infrastructure/entities/FormationTeacherAnnotation.entity';
import { FormationIncidentEntity } from './infrastructure/entities/FormationIncident.entity';
import { FormationMasteryEntity } from './infrastructure/entities/FormationMastery.entity';
import { FormationParticipantEntity } from './infrastructure/entities/FormationParticipant.entity';
import { FormationSessionEntity } from './infrastructure/entities/FormationSession.entity';
import { CoursCatalogueRepositoryTypeORM } from './infrastructure/CoursCatalogue.repository.typeorm';
import { FormationCourseContentEntity } from './infrastructure/entities/FormationCourseContent.entity';
import { FormationScreenContentEntity } from './infrastructure/entities/FormationScreenContent.entity';
import { FormationMailerService } from './infrastructure/FormationMailer.service';
import { IncidentsRepositoryTypeORM } from './infrastructure/Incidents.repository.typeorm';
import { MasteryRepositoryTypeORM } from './infrastructure/Mastery.repository.typeorm';
import { ParticipantsRepositoryTypeORM } from './infrastructure/Participants.repository.typeorm';
import { SessionsRepositoryTypeORM } from './infrastructure/Sessions.repository.typeorm';
import { SessionStateCacheService } from './infrastructure/SessionStateCache.service';
import { StreamCapacityService } from './infrastructure/StreamCapacity.service';
import { TeacherAnnotationsRepositoryTypeORM } from './infrastructure/TeacherAnnotations.repository.typeorm';
import { FormationsAnnotationsController } from './interfaces/FormationsAnnotations.controller';
import { FormationsGroupsController } from './interfaces/FormationsGroups.controller';
import { FormationsPresenterController } from './interfaces/FormationsPresenter.controller';
import { FormationsStudentController } from './interfaces/FormationsStudent.controller';
import { FormationsCatalogController } from './interfaces/FormationsCatalog.controller';
import { CodeScanProtectionService } from './interfaces/CodeScanProtection.service';
import { ParticipantTokenService } from './interfaces/ParticipantToken.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FormationSessionEntity,
      FormationParticipantEntity,
      FormationAnswerEntity,
      FormationFreeResponseEntity,
      FormationMasteryEntity,
      FormationIncidentEntity,
      FormationCourseContentEntity,
      FormationScreenContentEntity,
      FormationTeacherAnnotationEntity,
      FormationGroupEntity,
      FormationScoreEntity,
      FormationEscapeProgressEntity,
      FormationEscapeAttemptEntity,
      FormationPulseEntity,
    ]),
  ],
  controllers: [
    FormationsCatalogController,
    FormationsPresenterController,
    FormationsGroupsController,
    FormationsAnnotationsController,
    FormationsStudentController,
  ],
  providers: [
    OpenSessionUseCase,
    ControlSessionUseCase,
    CloseSessionUseCase,
    GetSessionResultsUseCase,
    JoinSessionUseCase,
    LireCoursPublicUseCase,
    SubmitAnswerUseCase,
    SubmitProductionUseCase,
    TenterEnigmeUseCase,
    DeclarerJalonUseCase,
    DefisUseCase,
    RecordIncidentsUseCase,
    StreamSessionUseCase,
    {
      provide: STREAM_CAPACITY,
      useClass: StreamCapacityService,
    },
    DueQuestionsUseCase,
    LireSujetUseCase,
    LireDerouleUseCase,
    ManageTeacherAnnotationsUseCase,
    ManageFormationGroupsUseCase,
    ListSessionParticipantsUseCase,
    ListFreeResponsesUseCase,
    SaveFreeResponseUseCase,
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
      provide: FREE_RESPONSES_REPOSITORY,
      useClass: FreeResponsesRepositoryTypeORM,
    },
    {
      provide: TEACHER_ANNOTATIONS_REPOSITORY,
      useClass: TeacherAnnotationsRepositoryTypeORM,
    },
    {
      provide: FORMATION_GROUPS_REPOSITORY,
      useClass: FormationGroupsRepositoryTypeORM,
    },
    {
      provide: SCORES_REPOSITORY,
      useClass: ScoresRepositoryTypeORM,
    },
    {
      provide: ESCAPE_REPOSITORY,
      useClass: EscapeRepositoryTypeORM,
    },
    {
      provide: PULSES_REPOSITORY,
      useClass: PulsesRepositoryTypeORM,
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
      useClass: CoursCatalogueRepositoryTypeORM,
    },
  ],
})
export class FormationsModule {}
