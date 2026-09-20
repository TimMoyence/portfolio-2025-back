import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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
import { EvincerParticipantUseCase } from './application/EvincerParticipant.useCase';
import { LireEtatParticipantUseCase } from './application/LireEtatParticipant.useCase';
import { SubmitProductionUseCase } from './application/SubmitProduction.useCase';
import { TenterEnigmeUseCase } from './application/TenterEnigme.useCase';
import { CATALOGUE_COURS } from './domain/token';
import { FormationsModule } from './Formations.module';
import { FormationAnswerEntity } from './infrastructure/entities/FormationAnswer.entity';
import { FormationEscapeAttemptEntity } from './infrastructure/entities/FormationEscapeAttempt.entity';
import { FormationEscapeProgressEntity } from './infrastructure/entities/FormationEscapeProgress.entity';
import { FormationPulseEntity } from './infrastructure/entities/FormationPulse.entity';
import { FormationIncidentEntity } from './infrastructure/entities/FormationIncident.entity';
import { FormationFreeResponseEntity } from './infrastructure/entities/FormationFreeResponse.entity';
import { FormationGroupEntity } from './infrastructure/entities/FormationGroup.entity';
import { FormationScoreEntity } from './infrastructure/entities/FormationScore.entity';
import { FormationMasteryEntity } from './infrastructure/entities/FormationMastery.entity';
import { FormationParticipantEntity } from './infrastructure/entities/FormationParticipant.entity';
import { FormationSessionEntity } from './infrastructure/entities/FormationSession.entity';
import { FormationTeacherAnnotationEntity } from './infrastructure/entities/FormationTeacherAnnotation.entity';
import { CoursCatalogueRepositoryTypeORM } from './infrastructure/CoursCatalogue.repository.typeorm';
import { FormationCourseContentEntity } from './infrastructure/entities/FormationCourseContent.entity';
import { FormationScreenContentEntity } from './infrastructure/entities/FormationScreenContent.entity';

const ENTITES = [
  FormationSessionEntity,
  FormationCourseContentEntity,
  FormationScreenContentEntity,
  FormationParticipantEntity,
  FormationAnswerEntity,
  FormationFreeResponseEntity,
  FormationMasteryEntity,
  FormationIncidentEntity,
  FormationTeacherAnnotationEntity,
  FormationGroupEntity,
  FormationScoreEntity,
  FormationEscapeProgressEntity,
  FormationEscapeAttemptEntity,
  FormationPulseEntity,
];

const SERVICES = [
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
  LireEtatParticipantUseCase,
  EvincerParticipantUseCase,
  RecordIncidentsUseCase,
  StreamSessionUseCase,
  DueQuestionsUseCase,
  LireSujetUseCase,
  LireDerouleUseCase,
  ManageTeacherAnnotationsUseCase,
  ManageFormationGroupsUseCase,
  ListSessionParticipantsUseCase,
  ListFreeResponsesUseCase,
  SaveFreeResponseUseCase,
];

describe('FormationsModule', () => {
  async function monter() {
    const constructeur = Test.createTestingModule({
      imports: [FormationsModule],
    });
    for (const entite of ENTITES) {
      constructeur.overrideProvider(getRepositoryToken(entite)).useValue({});
    }
    return constructeur.compile();
  }

  it('se construit avec toutes ses dependances resolvables', async () => {
    await expect(monter()).resolves.toBeDefined();
  });

  it('charge le catalogue des cours depuis la base', async () => {
    const module = await monter();
    expect(module.get(CATALOGUE_COURS)).toBeInstanceOf(
      CoursCatalogueRepositoryTypeORM,
    );
  });

  for (const service of SERVICES) {
    it(`instancie ${service.name}`, async () => {
      const module = await monter();
      expect(module.get(service)).toBeInstanceOf(service);
    });
  }
});
