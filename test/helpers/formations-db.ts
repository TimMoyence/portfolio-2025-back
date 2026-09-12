import { DataSource, type DataSourceOptions } from 'typeorm';
import { CreateFormations1778900000000 } from '../../src/migrations/1778900000000-CreateFormations';
import { AnswersRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Answers.repository.typeorm';
import { FormationAnswerEntity } from '../../src/modules/formations/infrastructure/entities/FormationAnswer.entity';
import { FormationIncidentEntity } from '../../src/modules/formations/infrastructure/entities/FormationIncident.entity';
import { FormationMasteryEntity } from '../../src/modules/formations/infrastructure/entities/FormationMastery.entity';
import { FormationParticipantEntity } from '../../src/modules/formations/infrastructure/entities/FormationParticipant.entity';
import { FormationSessionEntity } from '../../src/modules/formations/infrastructure/entities/FormationSession.entity';
import { IncidentsRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Incidents.repository.typeorm';
import { MasteryRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Mastery.repository.typeorm';
import { ParticipantsRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Participants.repository.typeorm';
import { SessionsRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Sessions.repository.typeorm';
import { buildDbIntegrationOptions } from './db-integration-datasource';

export const FORMATION_TABLES = [
  'formation_sessions',
  'formation_participants',
  'formation_answers',
  'formation_incidents',
  'formation_mastery',
] as const;

export interface ContexteFormations {
  dataSource: DataSource;
  sessions: SessionsRepositoryTypeORM;
  participants: ParticipantsRepositoryTypeORM;
  answers: AnswersRepositoryTypeORM;
  incidents: IncidentsRepositoryTypeORM;
  mastery: MasteryRepositoryTypeORM;
  nettoyer(): Promise<void>;
  rejouerMigration(): Promise<void>;
  fermer(): Promise<void>;
}

function buildFormationsOptions(): DataSourceOptions {
  return {
    ...buildDbIntegrationOptions([
      FormationSessionEntity,
      FormationParticipantEntity,
      FormationAnswerEntity,
      FormationIncidentEntity,
      FormationMasteryEntity,
    ]),
    synchronize: false,
    dropSchema: true,
    migrations: [CreateFormations1778900000000],
  };
}

export async function ouvrirContexteFormations(): Promise<ContexteFormations> {
  const dataSource = new DataSource(buildFormationsOptions());
  await dataSource.initialize();
  await dataSource.runMigrations({ transaction: 'all' });

  return {
    dataSource,
    sessions: new SessionsRepositoryTypeORM(
      dataSource.getRepository(FormationSessionEntity),
    ),
    participants: new ParticipantsRepositoryTypeORM(
      dataSource.getRepository(FormationParticipantEntity),
    ),
    answers: new AnswersRepositoryTypeORM(
      dataSource.getRepository(FormationAnswerEntity),
    ),
    incidents: new IncidentsRepositoryTypeORM(
      dataSource.getRepository(FormationIncidentEntity),
    ),
    mastery: new MasteryRepositoryTypeORM(
      dataSource.getRepository(FormationMasteryEntity),
    ),
    async nettoyer(): Promise<void> {
      const cibles = FORMATION_TABLES.map((table) => `"${table}"`).join(', ');
      await dataSource.query(
        `TRUNCATE TABLE ${cibles} RESTART IDENTITY CASCADE`,
      );
    },
    async rejouerMigration(): Promise<void> {
      await dataSource.undoLastMigration({ transaction: 'all' });
      await dataSource.runMigrations({ transaction: 'all' });
    },
    async fermer(): Promise<void> {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    },
  };
}
