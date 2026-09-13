import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CloseSessionUseCase } from './application/CloseSession.useCase';
import { ControlSessionUseCase } from './application/ControlSession.useCase';
import { GetSessionResultsUseCase } from './application/GetSessionResults.useCase';
import { JoinSessionUseCase } from './application/JoinSession.useCase';
import { OpenSessionUseCase } from './application/OpenSession.useCase';
import { RecordIncidentsUseCase } from './application/RecordIncidents.useCase';
import { StreamSessionUseCase } from './application/StreamSession.useCase';
import { SubmitAnswerUseCase } from './application/SubmitAnswer.useCase';
import { FormationsModule } from './Formations.module';
import { FormationAnswerEntity } from './infrastructure/entities/FormationAnswer.entity';
import { FormationIncidentEntity } from './infrastructure/entities/FormationIncident.entity';
import { FormationMasteryEntity } from './infrastructure/entities/FormationMastery.entity';
import { FormationParticipantEntity } from './infrastructure/entities/FormationParticipant.entity';
import { FormationSessionEntity } from './infrastructure/entities/FormationSession.entity';

const ENTITES = [
  FormationSessionEntity,
  FormationParticipantEntity,
  FormationAnswerEntity,
  FormationMasteryEntity,
  FormationIncidentEntity,
];

const SERVICES = [
  OpenSessionUseCase,
  ControlSessionUseCase,
  CloseSessionUseCase,
  GetSessionResultsUseCase,
  JoinSessionUseCase,
  SubmitAnswerUseCase,
  RecordIncidentsUseCase,
  StreamSessionUseCase,
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

  for (const service of SERVICES) {
    it(`instancie ${service.name}`, async () => {
      const module = await monter();
      expect(module.get(service)).toBeInstanceOf(service);
    });
  }
});
