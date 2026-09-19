import { DataSource, type DataSourceOptions } from 'typeorm';
import { CreateFormations1778900000000 } from '../../src/migrations/1778900000000-CreateFormations';
import { AddFormationSessionCourseVersion1780050000000 } from '../../src/migrations/1780050000000-AddFormationSessionCourseVersion';
import { CreateFormationGroups1780500000000 } from '../../src/migrations/1780500000000-CreateFormationGroups';
import { CreateFormationScores1780600000000 } from '../../src/migrations/1780600000000-CreateFormationScores';
import { AnswersRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Answers.repository.typeorm';
import { FormationAnswerEntity } from '../../src/modules/formations/infrastructure/entities/FormationAnswer.entity';
import { FormationIncidentEntity } from '../../src/modules/formations/infrastructure/entities/FormationIncident.entity';
import { FormationMasteryEntity } from '../../src/modules/formations/infrastructure/entities/FormationMastery.entity';
import { FormationParticipantEntity } from '../../src/modules/formations/infrastructure/entities/FormationParticipant.entity';
import { FormationGroupEntity } from '../../src/modules/formations/infrastructure/entities/FormationGroup.entity';
import { FormationScoreEntity } from '../../src/modules/formations/infrastructure/entities/FormationScore.entity';
import { FormationSessionEntity } from '../../src/modules/formations/infrastructure/entities/FormationSession.entity';
import { FormationGroupsRepositoryTypeORM } from '../../src/modules/formations/infrastructure/FormationGroups.repository.typeorm';
import { IncidentsRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Incidents.repository.typeorm';
import { MasteryRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Mastery.repository.typeorm';
import { ParticipantsRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Participants.repository.typeorm';
import { ScoresRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Scores.repository.typeorm';
import { SessionsRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Sessions.repository.typeorm';
import { buildDbIntegrationOptions } from './db-integration-datasource';

export const FORMATION_ENTITIES = [
  FormationSessionEntity,
  FormationParticipantEntity,
  FormationAnswerEntity,
  FormationIncidentEntity,
  FormationMasteryEntity,
  FormationGroupEntity,
  FormationScoreEntity,
];

export const FORMATION_TABLES = [
  'formation_sessions',
  'formation_participants',
  'formation_answers',
  'formation_incidents',
  'formation_mastery',
  'formation_groups',
  'formation_scores',
] as const;

export interface ContexteFormations {
  dataSource: DataSource;
  sessions: SessionsRepositoryTypeORM;
  participants: ParticipantsRepositoryTypeORM;
  answers: AnswersRepositoryTypeORM;
  incidents: IncidentsRepositoryTypeORM;
  mastery: MasteryRepositoryTypeORM;
  scores: ScoresRepositoryTypeORM;
  groups: FormationGroupsRepositoryTypeORM;
  graineDe(participantId: string): Promise<number>;
  nettoyer(): Promise<void>;
  rejouerMigration(): Promise<void>;
  fermer(): Promise<void>;
}

function buildFormationsOptions(): DataSourceOptions {
  return {
    ...buildDbIntegrationOptions(FORMATION_ENTITIES),
    synchronize: false,
    dropSchema: true,
    migrations: [
      CreateFormations1778900000000,
      AddFormationSessionCourseVersion1780050000000,
      CreateFormationGroups1780500000000,
      CreateFormationScores1780600000000,
    ],
  };
}

export async function ouvrirContexteFormations(): Promise<ContexteFormations> {
  const dataSource = new DataSource(buildFormationsOptions());
  await dataSource.initialize();
  await dataSource.runMigrations({ transaction: 'all' });
  const participants = new ParticipantsRepositoryTypeORM(
    dataSource.getRepository(FormationParticipantEntity),
  );

  return {
    dataSource,
    sessions: new SessionsRepositoryTypeORM(
      dataSource.getRepository(FormationSessionEntity),
    ),
    participants,
    answers: new AnswersRepositoryTypeORM(
      dataSource.getRepository(FormationAnswerEntity),
    ),
    incidents: new IncidentsRepositoryTypeORM(
      dataSource.getRepository(FormationIncidentEntity),
    ),
    mastery: new MasteryRepositoryTypeORM(
      dataSource.getRepository(FormationMasteryEntity),
    ),
    scores: new ScoresRepositoryTypeORM(
      dataSource.getRepository(FormationScoreEntity),
    ),
    groups: new FormationGroupsRepositoryTypeORM(
      dataSource.getRepository(FormationGroupEntity),
      dataSource.getRepository(FormationParticipantEntity),
    ),
    async graineDe(participantId: string): Promise<number> {
      const participant = await participants.findById(participantId);
      if (participant === null) {
        throw new Error(`Participant absent de la base: ${participantId}`);
      }
      return participant.seed;
    },
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
