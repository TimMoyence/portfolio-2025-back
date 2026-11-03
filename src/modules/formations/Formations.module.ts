import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloseSessionUseCase } from './application/seance/pilotage/CloseSession.useCase';
import { ControlSessionUseCase } from './application/seance/pilotage/ControlSession.useCase';
import { GetSessionResultsUseCase } from './application/seance/pilotage/GetSessionResults.useCase';
import { JoinSessionUseCase } from './application/participants/JoinSession.useCase';
import { LireCoursPublicUseCase } from './application/cours/LireCoursPublic.useCase';
import { LireDerouleUseCase } from './application/seance/lecture/LireDeroule.useCase';
import { LireLivretUseCase } from './application/cours/LireLivret.useCase';
import { LireSujetUseCase } from './application/cours/LireSujet.useCase';
import { ListFreeResponsesUseCase } from './application/seance/lecture/ListFreeResponses.useCase';
import { ListSessionParticipantsUseCase } from './application/seance/lecture/ListSessionParticipants.useCase';
import { ManageTeacherAnnotationsUseCase } from './application/seance/lecture/ManageTeacherAnnotations.useCase';
import { OpenSessionUseCase } from './application/seance/pilotage/OpenSession.useCase';
import { RecordIncidentsUseCase } from './application/seance/RecordIncidents.useCase';
import { SaveFreeResponseUseCase } from './application/reponses/SaveFreeResponse.useCase';
import { StreamSessionUseCase } from './application/seance/pilotage/StreamSession.useCase';
import { SubmitAnswerUseCase } from './application/reponses/SubmitAnswer.useCase';
import { DeclarerJalonUseCase } from './application/defis/DeclarerJalon.useCase';
import { DefisUseCase } from './application/defis/Defis.useCase';
import { LectureDeSeance } from './application/seance/lecture/LectureDeSeance';
import { ParticipationEnSeance } from './application/participants/ParticipationEnSeance';
import { EvincerParticipantUseCase } from './application/participants/EvincerParticipant.useCase';
import { ReadmettreParticipantUseCase } from './application/participants/ReadmettreParticipant.useCase';
import { LibererPosteUseCase } from './application/participants/LibererPoste.useCase';
import { LireRappelsUseCase } from './application/defis/LireRappels.useCase';
import { SyntheseRappelsUseCase } from './application/seance/lecture/SyntheseRappels.useCase';
import { LireEtatParticipantUseCase } from './application/participants/LireEtatParticipant.useCase';
import { SubmitProductionUseCase } from './application/reponses/SubmitProduction.useCase';
import { EvaluerFeuilleUseCase } from './application/reponses/EvaluerFeuille.useCase';
import { EvaluerTableauUseCase } from './application/reponses/EvaluerTableau.useCase';
import { EvaluerMachineUseCase } from './application/reponses/EvaluerMachine.useCase';
import { TenterEnigmeUseCase } from './application/defis/TenterEnigme.useCase';
import { SynchroniserCoursUseCase } from './application/cours/SynchroniserCours.useCase';
import { TelechargerPieceJointeUseCase } from './application/seance/TelechargerPieceJointe.useCase';
import { ClasseursSurDisque } from './infrastructure/classeurs/ClasseursSurDisque';
import { CONTENUS } from './infrastructure/contenus';
import { PublicationDesCoursRepositoryTypeORM } from './infrastructure/cours/PublicationDesCours.repository.typeorm';
import { SynchronisationAuDemarrageService } from './infrastructure/cours/SynchronisationAuDemarrage.service';
import {
  ANSWERS_REPOSITORY,
  CATALOGUE_COURS,
  CLASSEURS_DE_COURS,
  CONTENUS_DES_COURS,
  ESCAPE_REPOSITORY,
  PUBLICATION_DES_COURS,
  FREE_RESPONSES_REPOSITORY,
  PULSES_REPOSITORY,
  RAPPELS_SERVIS_REPOSITORY,
  FORMATION_MAILER,
  INCIDENTS_REPOSITORY,
  MASTERY_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
  STREAM_CAPACITY,
  TEACHER_ANNOTATIONS_REPOSITORY,
} from './domain/token';
import { AnswersRepositoryTypeORM } from './infrastructure/reponses/Answers.repository.typeorm';
import { FormationAnswerEntity } from './infrastructure/entities/reponses/FormationAnswer.entity';
import { FormationEscapeAttemptEntity } from './infrastructure/entities/reponses/FormationEscapeAttempt.entity';
import { FormationEscapeProgressEntity } from './infrastructure/entities/reponses/FormationEscapeProgress.entity';
import { EscapeRepositoryTypeORM } from './infrastructure/reponses/Escape.repository.typeorm';
import { FormationCoursePublicationEntity } from './infrastructure/entities/cours/FormationCoursePublication.entity';
import { FormationPulseEntity } from './infrastructure/entities/reponses/FormationPulse.entity';
import { FormationRappelServiEntity } from './infrastructure/entities/reponses/FormationRappelServi.entity';
import { RappelsServisRepositoryTypeORM } from './infrastructure/reponses/RappelsServis.repository.typeorm';
import { PulsesRepositoryTypeORM } from './infrastructure/reponses/Pulses.repository.typeorm';
import { FreeResponsesRepositoryTypeORM } from './infrastructure/reponses/FreeResponses.repository.typeorm';
import { FormationFreeResponseEntity } from './infrastructure/entities/reponses/FormationFreeResponse.entity';
import { FormationTeacherAnnotationEntity } from './infrastructure/entities/seance/FormationTeacherAnnotation.entity';
import { FormationIncidentEntity } from './infrastructure/entities/seance/FormationIncident.entity';
import { FormationMasteryEntity } from './infrastructure/entities/reponses/FormationMastery.entity';
import { FormationParticipantEntity } from './infrastructure/entities/seance/FormationParticipant.entity';
import { FormationSessionEntity } from './infrastructure/entities/seance/FormationSession.entity';
import { CoursCatalogueRepositoryTypeORM } from './infrastructure/cours/CoursCatalogue.repository.typeorm';
import { FormationCourseContentEntity } from './infrastructure/entities/cours/FormationCourseContent.entity';
import { FormationScreenContentEntity } from './infrastructure/entities/cours/FormationScreenContent.entity';
import { FormationMailerService } from './infrastructure/FormationMailer.service';
import { IncidentsRepositoryTypeORM } from './infrastructure/seance/Incidents.repository.typeorm';
import { MasteryRepositoryTypeORM } from './infrastructure/reponses/Mastery.repository.typeorm';
import { ParticipantsRepositoryTypeORM } from './infrastructure/seance/Participants.repository.typeorm';
import { SessionsRepositoryTypeORM } from './infrastructure/seance/Sessions.repository.typeorm';
import { SessionStateCacheService } from './infrastructure/seance/SessionStateCache.service';
import { StreamCapacityService } from './infrastructure/seance/StreamCapacity.service';
import { TeacherAnnotationsRepositoryTypeORM } from './infrastructure/seance/TeacherAnnotations.repository.typeorm';
import { FormationsAnnotationsController } from './interfaces/presentateur/FormationsAnnotations.controller';
import { FormationsParticipantsController } from './interfaces/FormationsParticipants.controller';
import { FormationsPresenterController } from './interfaces/presentateur/FormationsPresenter.controller';
import { FormationsStudentController } from './interfaces/etudiant/FormationsStudent.controller';
import { FormationsCatalogController } from './interfaces/FormationsCatalog.controller';
import { FormationsLivretController } from './interfaces/presentateur/FormationsLivret.controller';
import { CodeScanProtectionService } from './interfaces/etudiant/CodeScanProtection.service';
import { ParticipantTokenService } from './interfaces/etudiant/ParticipantToken.service';

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
      FormationEscapeProgressEntity,
      FormationEscapeAttemptEntity,
      FormationPulseEntity,
      FormationCoursePublicationEntity,
      FormationRappelServiEntity,
    ]),
  ],
  controllers: [
    FormationsCatalogController,
    FormationsPresenterController,
    FormationsParticipantsController,
    FormationsAnnotationsController,
    FormationsStudentController,
    FormationsLivretController,
  ],
  providers: [
    OpenSessionUseCase,
    ControlSessionUseCase,
    CloseSessionUseCase,
    GetSessionResultsUseCase,
    JoinSessionUseCase,
    LireCoursPublicUseCase,
    LireLivretUseCase,
    SubmitAnswerUseCase,
    SubmitProductionUseCase,
    EvaluerFeuilleUseCase,
    EvaluerTableauUseCase,
    EvaluerMachineUseCase,
    TenterEnigmeUseCase,
    ParticipationEnSeance,
    LectureDeSeance,
    DeclarerJalonUseCase,
    DefisUseCase,
    LireEtatParticipantUseCase,
    EvincerParticipantUseCase,
    ReadmettreParticipantUseCase,
    LibererPosteUseCase,
    LireRappelsUseCase,
    SyntheseRappelsUseCase,
    RecordIncidentsUseCase,
    StreamSessionUseCase,
    {
      provide: STREAM_CAPACITY,
      useClass: StreamCapacityService,
    },
    LireSujetUseCase,
    LireDerouleUseCase,
    TelechargerPieceJointeUseCase,
    ManageTeacherAnnotationsUseCase,
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
      provide: ESCAPE_REPOSITORY,
      useClass: EscapeRepositoryTypeORM,
    },
    {
      provide: PULSES_REPOSITORY,
      useClass: PulsesRepositoryTypeORM,
    },
    {
      provide: RAPPELS_SERVIS_REPOSITORY,
      useClass: RappelsServisRepositoryTypeORM,
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
    {
      provide: PUBLICATION_DES_COURS,
      useClass: PublicationDesCoursRepositoryTypeORM,
    },
    {
      provide: CONTENUS_DES_COURS,
      useValue: CONTENUS,
    },
    {
      provide: CLASSEURS_DE_COURS,
      useClass: ClasseursSurDisque,
    },
    SynchroniserCoursUseCase,
    SynchronisationAuDemarrageService,
  ],
})
export class FormationsModule {}
