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
import { ManageTeacherAnnotationsUseCase } from './application/ManageTeacherAnnotations.useCase';
import { OpenSessionUseCase } from './application/OpenSession.useCase';
import { RecordIncidentsUseCase } from './application/RecordIncidents.useCase';
import { SaveFreeResponseUseCase } from './application/SaveFreeResponse.useCase';
import { StreamSessionUseCase } from './application/StreamSession.useCase';
import { SubmitAnswerUseCase } from './application/SubmitAnswer.useCase';
import { DeclarerJalonUseCase } from './application/DeclarerJalon.useCase';
import { DefisUseCase } from './application/Defis.useCase';
import { EvincerParticipantUseCase } from './application/EvincerParticipant.useCase';
import { LireRappelsUseCase } from './application/LireRappels.useCase';
import { SyntheseRappelsUseCase } from './application/SyntheseRappels.useCase';
import { LireEtatParticipantUseCase } from './application/LireEtatParticipant.useCase';
import { SubmitProductionUseCase } from './application/SubmitProduction.useCase';
import { TenterEnigmeUseCase } from './application/TenterEnigme.useCase';
import {
  CATALOGUE_COURS,
  CONTENUS_DES_COURS,
  PUBLICATION_DES_COURS,
} from './domain/token';
import { COURS_B2_01 } from './infrastructure/contenus/b2-01.cours';
import { PublicationDesCoursRepositoryTypeORM } from './infrastructure/PublicationDesCours.repository.typeorm';
import { SynchronisationAuDemarrageService } from './infrastructure/SynchronisationAuDemarrage.service';
import { FormationsModule } from './Formations.module';
import { FormationAnswerEntity } from './infrastructure/entities/FormationAnswer.entity';
import { FormationEscapeAttemptEntity } from './infrastructure/entities/FormationEscapeAttempt.entity';
import { FormationEscapeProgressEntity } from './infrastructure/entities/FormationEscapeProgress.entity';
import { FormationCoursePublicationEntity } from './infrastructure/entities/FormationCoursePublication.entity';
import { FormationPulseEntity } from './infrastructure/entities/FormationPulse.entity';
import { FormationRappelServiEntity } from './infrastructure/entities/FormationRappelServi.entity';
import { FormationIncidentEntity } from './infrastructure/entities/FormationIncident.entity';
import { FormationFreeResponseEntity } from './infrastructure/entities/FormationFreeResponse.entity';
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
  FormationScoreEntity,
  FormationEscapeProgressEntity,
  FormationEscapeAttemptEntity,
  FormationPulseEntity,
  FormationCoursePublicationEntity,
  FormationRappelServiEntity,
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
  LireRappelsUseCase,
  SyntheseRappelsUseCase,
  RecordIncidentsUseCase,
  StreamSessionUseCase,
  DueQuestionsUseCase,
  LireSujetUseCase,
  LireDerouleUseCase,
  ManageTeacherAnnotationsUseCase,
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

  it('publie au démarrage tous les cours du dépôt, B2-01 compris', async () => {
    const module = await monter();
    expect({
      contenus: module.get(CONTENUS_DES_COURS),
      publication: module.get(PUBLICATION_DES_COURS),
      demarrage: module.get(SynchronisationAuDemarrageService),
    }).toEqual({
      contenus: expect.arrayContaining([COURS_B2_01]),
      publication: expect.any(PublicationDesCoursRepositoryTypeORM),
      demarrage: expect.any(SynchronisationAuDemarrageService),
    });
  });

  for (const service of SERVICES) {
    it(`instancie ${service.name}`, async () => {
      const module = await monter();
      expect(module.get(service)).toBeInstanceOf(service);
    });
  }
});
