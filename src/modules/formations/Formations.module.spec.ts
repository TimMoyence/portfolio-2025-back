import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CloseSessionUseCase } from './application/seance/pilotage/CloseSession.useCase';
import { ControlSessionUseCase } from './application/seance/pilotage/ControlSession.useCase';
import { GetSessionResultsUseCase } from './application/seance/pilotage/GetSessionResults.useCase';
import { JoinSessionUseCase } from './application/participants/JoinSession.useCase';
import { LireCoursPublicUseCase } from './application/cours/LireCoursPublic.useCase';
import { LireDerouleUseCase } from './application/seance/lecture/LireDeroule.useCase';
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
import { EvincerParticipantUseCase } from './application/participants/EvincerParticipant.useCase';
import { LireRappelsUseCase } from './application/defis/LireRappels.useCase';
import { SyntheseRappelsUseCase } from './application/seance/lecture/SyntheseRappels.useCase';
import { LireEtatParticipantUseCase } from './application/participants/LireEtatParticipant.useCase';
import { SubmitProductionUseCase } from './application/reponses/SubmitProduction.useCase';
import { EvaluerFeuilleUseCase } from './application/reponses/EvaluerFeuille.useCase';
import { EvaluerTableauUseCase } from './application/reponses/EvaluerTableau.useCase';
import { EvaluerMachineUseCase } from './application/reponses/EvaluerMachine.useCase';
import { TenterEnigmeUseCase } from './application/defis/TenterEnigme.useCase';
import {
  CATALOGUE_COURS,
  CONTENUS_DES_COURS,
  PUBLICATION_DES_COURS,
} from './domain/token';
import { CONTENUS } from './infrastructure/contenus';
import { PublicationDesCoursRepositoryTypeORM } from './infrastructure/cours/PublicationDesCours.repository.typeorm';
import { SynchronisationAuDemarrageService } from './infrastructure/cours/SynchronisationAuDemarrage.service';
import { FormationsModule } from './Formations.module';
import { FormationAnswerEntity } from './infrastructure/entities/reponses/FormationAnswer.entity';
import { FormationEscapeAttemptEntity } from './infrastructure/entities/reponses/FormationEscapeAttempt.entity';
import { FormationEscapeProgressEntity } from './infrastructure/entities/reponses/FormationEscapeProgress.entity';
import { FormationCoursePublicationEntity } from './infrastructure/entities/cours/FormationCoursePublication.entity';
import { FormationPulseEntity } from './infrastructure/entities/reponses/FormationPulse.entity';
import { FormationRappelServiEntity } from './infrastructure/entities/reponses/FormationRappelServi.entity';
import { FormationIncidentEntity } from './infrastructure/entities/seance/FormationIncident.entity';
import { FormationFreeResponseEntity } from './infrastructure/entities/reponses/FormationFreeResponse.entity';
import { FormationMasteryEntity } from './infrastructure/entities/reponses/FormationMastery.entity';
import { FormationParticipantEntity } from './infrastructure/entities/seance/FormationParticipant.entity';
import { FormationSessionEntity } from './infrastructure/entities/seance/FormationSession.entity';
import { FormationTeacherAnnotationEntity } from './infrastructure/entities/seance/FormationTeacherAnnotation.entity';
import { CoursCatalogueRepositoryTypeORM } from './infrastructure/cours/CoursCatalogue.repository.typeorm';
import { FormationCourseContentEntity } from './infrastructure/entities/cours/FormationCourseContent.entity';
import { FormationScreenContentEntity } from './infrastructure/entities/cours/FormationScreenContent.entity';

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
  EvaluerFeuilleUseCase,
  EvaluerTableauUseCase,
  EvaluerMachineUseCase,
  TenterEnigmeUseCase,
  DeclarerJalonUseCase,
  DefisUseCase,
  LireEtatParticipantUseCase,
  EvincerParticipantUseCase,
  LireRappelsUseCase,
  SyntheseRappelsUseCase,
  RecordIncidentsUseCase,
  StreamSessionUseCase,
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
      contenus: CONTENUS,
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
