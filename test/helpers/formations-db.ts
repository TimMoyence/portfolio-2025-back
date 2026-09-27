import { DataSource, type DataSourceOptions } from 'typeorm';
import { CreateFormations1778900000000 } from '../../src/migrations/1778900000000-CreateFormations';
import { CreateFormationCourseContent1779100000000 } from '../../src/migrations/1779100000000-CreateFormationCourseContent';
import { AddFormationCourseVersion1779550000000 } from '../../src/migrations/1779550000000-AddFormationCourseVersion';
import { AddFormationContentV3Columns1779560000000 } from '../../src/migrations/1779560000000-AddFormationContentV3Columns';
import { AddFormationSessionCourseVersion1780050000000 } from '../../src/migrations/1780050000000-AddFormationSessionCourseVersion';
import { SeedB2PresentationNotes1780060000000 } from '../../src/migrations/1780060000000-SeedB2PresentationNotes';
import { VersionFormationCourseContent1780100000000 } from '../../src/migrations/1780100000000-VersionFormationCourseContent';
import { CreateFormationFreeResponses1780300000000 } from '../../src/migrations/1780300000000-CreateFormationFreeResponses';
import { CreateFormationTeacherAnnotations1780400000000 } from '../../src/migrations/1780400000000-CreateFormationTeacherAnnotations';
import { CreateFormationGroups1780500000000 } from '../../src/migrations/1780500000000-CreateFormationGroups';
import { CreateFormationScores1780600000000 } from '../../src/migrations/1780600000000-CreateFormationScores';
import { DropFormationScreenNotesDefault1789818127042 } from '../../src/migrations/1789818127042-DropFormationScreenNotesDefault';
import { AddFormationSessionPilotage1789861524871 } from '../../src/migrations/1789861524871-AddFormationSessionPilotage';
import { AddFormationAnswerProduction1789862782667 } from '../../src/migrations/1789862782667-AddFormationAnswerProduction';
import { CreateFormationEscape1789864720421 } from '../../src/migrations/1789864720421-CreateFormationEscape';
import { CreateFormationPulses1789867324005 } from '../../src/migrations/1789867324005-CreateFormationPulses';
import { AddFormationDefiColumns1789869335826 } from '../../src/migrations/1789869335826-AddFormationDefiColumns';
import { AddFormationCapaciteEtEviction1789870829038 } from '../../src/migrations/1789870829038-AddFormationCapaciteEtEviction';
import { CreateFormationCoursePublications1789871582928 } from '../../src/migrations/1789871582928-CreateFormationCoursePublications';
import { AmorcerPublicationsDeCours1789871600000 } from '../../src/migrations/1789871600000-AmorcerPublicationsDeCours';
import { CreateFormationRappelsServis1789875476980 } from '../../src/migrations/1789875476980-CreateFormationRappelsServis';
import { CleEtudianteDerivee1789974322913 } from '../../src/migrations/1789974322913-CleEtudianteDerivee';
import { AddFormationCourseEmpreinte1790178630008 } from '../../src/migrations/1790178630008-AddFormationCourseEmpreinte';
import { NotesFormateurFacultatives1790300000000 } from '../../src/migrations/1790300000000-NotesFormateurFacultatives';
import { PlafondDesReprisesDeProduction1790400000000 } from '../../src/migrations/1790400000000-PlafondDesReprisesDeProduction';
import { DiffusionSeanceParDefaut1790500000000 } from '../../src/migrations/1790500000000-DiffusionSeanceParDefaut';
import { RetireLesGroupesDeSuivi1790600000000 } from '../../src/migrations/1790600000000-RetireLesGroupesDeSuivi';
import { AjouteEmpreinteDeReprise1790700000000 } from '../../src/migrations/1790700000000-AjouteEmpreinteDeReprise';
import { AjouteGenerationDeJeton1790900000000 } from '../../src/migrations/1790900000000-AjouteGenerationDeJeton';
import {
  SynchroniserCoursUseCase,
  type IssueDeSynchronisation,
} from '../../src/modules/formations/application/SynchroniserCours.useCase';
import type { ContenuAPublier } from '../../src/modules/formations/domain/cours/CoursStocke';
import { CONTENUS } from '../../src/modules/formations/infrastructure/contenus';
import { PublicationDesCoursRepositoryTypeORM } from '../../src/modules/formations/infrastructure/PublicationDesCours.repository.typeorm';
import type {
  IParticipantsRepository,
  ParticipantRecord,
} from '../../src/modules/formations/domain/IParticipants.repository';
import { AnswersRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Answers.repository.typeorm';
import { CoursCatalogueRepositoryTypeORM } from '../../src/modules/formations/infrastructure/CoursCatalogue.repository.typeorm';
import { CleEtudiantService } from '../../src/modules/formations/interfaces/CleEtudiant.service';
import { FormationAnswerEntity } from '../../src/modules/formations/infrastructure/entities/FormationAnswer.entity';
import { FormationEscapeAttemptEntity } from '../../src/modules/formations/infrastructure/entities/FormationEscapeAttempt.entity';
import { FormationEscapeProgressEntity } from '../../src/modules/formations/infrastructure/entities/FormationEscapeProgress.entity';
import { EscapeRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Escape.repository.typeorm';
import { FormationPulseEntity } from '../../src/modules/formations/infrastructure/entities/FormationPulse.entity';
import { PulsesRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Pulses.repository.typeorm';
import { FormationRappelServiEntity } from '../../src/modules/formations/infrastructure/entities/FormationRappelServi.entity';
import { RappelsServisRepositoryTypeORM } from '../../src/modules/formations/infrastructure/RappelsServis.repository.typeorm';
import { FormationCourseContentEntity } from '../../src/modules/formations/infrastructure/entities/FormationCourseContent.entity';
import { FormationCoursePublicationEntity } from '../../src/modules/formations/infrastructure/entities/FormationCoursePublication.entity';
import { FormationFreeResponseEntity } from '../../src/modules/formations/infrastructure/entities/FormationFreeResponse.entity';
import { FormationIncidentEntity } from '../../src/modules/formations/infrastructure/entities/FormationIncident.entity';
import { FormationMasteryEntity } from '../../src/modules/formations/infrastructure/entities/FormationMastery.entity';
import { FormationParticipantEntity } from '../../src/modules/formations/infrastructure/entities/FormationParticipant.entity';
import { FormationScoreEntity } from '../../src/modules/formations/infrastructure/entities/FormationScore.entity';
import { FormationScreenContentEntity } from '../../src/modules/formations/infrastructure/entities/FormationScreenContent.entity';
import { FormationSessionEntity } from '../../src/modules/formations/infrastructure/entities/FormationSession.entity';
import { FormationTeacherAnnotationEntity } from '../../src/modules/formations/infrastructure/entities/FormationTeacherAnnotation.entity';
import { FreeResponsesRepositoryTypeORM } from '../../src/modules/formations/infrastructure/FreeResponses.repository.typeorm';
import { IncidentsRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Incidents.repository.typeorm';
import { MasteryRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Mastery.repository.typeorm';
import { SecretDeReprise } from '../../src/modules/formations/domain/SecretDeReprise';
import { ParticipantsRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Participants.repository.typeorm';
import { ScoresRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Scores.repository.typeorm';
import { SessionsRepositoryTypeORM } from '../../src/modules/formations/infrastructure/Sessions.repository.typeorm';
import { TeacherAnnotationsRepositoryTypeORM } from '../../src/modules/formations/infrastructure/TeacherAnnotations.repository.typeorm';
import {
  buildDbIntegrationOptions,
  initialiserEtMigrer,
} from './db-integration-datasource';

export const FORMATION_ENTITIES = [
  FormationSessionEntity,
  FormationParticipantEntity,
  FormationAnswerEntity,
  FormationIncidentEntity,
  FormationMasteryEntity,
  FormationScoreEntity,
  FormationFreeResponseEntity,
  FormationTeacherAnnotationEntity,
  FormationCourseContentEntity,
  FormationScreenContentEntity,
  FormationCoursePublicationEntity,
  FormationEscapeProgressEntity,
  FormationEscapeAttemptEntity,
  FormationPulseEntity,
  FormationRappelServiEntity,
];

const FORMATION_MIGRATIONS = [
  CreateFormations1778900000000,
  CreateFormationCourseContent1779100000000,
  AddFormationCourseVersion1779550000000,
  AddFormationContentV3Columns1779560000000,
  AddFormationSessionCourseVersion1780050000000,
  SeedB2PresentationNotes1780060000000,
  VersionFormationCourseContent1780100000000,
  CreateFormationFreeResponses1780300000000,
  CreateFormationTeacherAnnotations1780400000000,
  CreateFormationGroups1780500000000,
  CreateFormationScores1780600000000,
  DropFormationScreenNotesDefault1789818127042,
  AddFormationSessionPilotage1789861524871,
  AddFormationAnswerProduction1789862782667,
  CreateFormationEscape1789864720421,
  CreateFormationPulses1789867324005,
  AddFormationDefiColumns1789869335826,
  AddFormationCapaciteEtEviction1789870829038,
  CreateFormationCoursePublications1789871582928,
  AmorcerPublicationsDeCours1789871600000,
  CreateFormationRappelsServis1789875476980,
  CleEtudianteDerivee1789974322913,
  AddFormationCourseEmpreinte1790178630008,
  NotesFormateurFacultatives1790300000000,
  PlafondDesReprisesDeProduction1790400000000,
  DiffusionSeanceParDefaut1790500000000,
  RetireLesGroupesDeSuivi1790600000000,
  AjouteEmpreinteDeReprise1790700000000,
  AjouteGenerationDeJeton1790900000000,
];

export const TABLES_DE_SEANCE = [
  'formation_sessions',
  'formation_participants',
  'formation_answers',
  'formation_incidents',
  'formation_mastery',
  'formation_scores',
  'formation_free_responses',
  'formation_teacher_annotations',
  'formation_escape_progress',
  'formation_escape_attempts',
  'formation_pulses',
  'formation_rappels_servis',
] as const;

export const FORMATION_TABLES = [
  ...TABLES_DE_SEANCE,
  'formation_course_contents',
  'formation_screen_contents',
  'formation_course_publications',
] as const;

const CAPACITE_MAXIMALE_DE_SEANCE = 60;

export interface InscriptionDeTest {
  sessionId: string;
  studentKey: string;
  prenom: string;
  nom: string;
  email: string;
  seed: number;
}

const clesEtudiants = new CleEtudiantService();

export function cleEtudianteDe(email: string): string {
  return clesEtudiants.de(email);
}

export async function inscrireParticipant(
  participants: IParticipantsRepository,
  { seed, ...identite }: InscriptionDeTest,
): Promise<ParticipantRecord> {
  const { participant } = await participants.inscrire({
    ...identite,
    capacite: CAPACITE_MAXIMALE_DE_SEANCE,
    empreinteDeReprise: SecretDeReprise.empreinte(identite.studentKey),
    repriseAutorisee: () => true,
    choisirGraine: () => seed,
  });
  return participant;
}

export interface ContexteFormations {
  dataSource: DataSource;
  sessions: SessionsRepositoryTypeORM;
  participants: ParticipantsRepositoryTypeORM;
  answers: AnswersRepositoryTypeORM;
  incidents: IncidentsRepositoryTypeORM;
  mastery: MasteryRepositoryTypeORM;
  scores: ScoresRepositoryTypeORM;
  freeResponses: FreeResponsesRepositoryTypeORM;
  annotations: TeacherAnnotationsRepositoryTypeORM;
  escape: EscapeRepositoryTypeORM;
  pulses: PulsesRepositoryTypeORM;
  rappels: RappelsServisRepositoryTypeORM;
  catalogue: CoursCatalogueRepositoryTypeORM;
  publication: PublicationDesCoursRepositoryTypeORM;
  synchroniser(
    contenus: readonly ContenuAPublier[],
  ): Promise<readonly IssueDeSynchronisation[]>;
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
    migrations: FORMATION_MIGRATIONS,
  };
}

export const DELAI_OUVERTURE_CONTEXTE_MS = 60_000;

export const VERSION_PUBLIEE_SUR_BASE_NEUVE = 1;

export async function ouvrirContexteFormations(): Promise<ContexteFormations> {
  const dataSource = new DataSource(buildFormationsOptions());
  await initialiserEtMigrer(dataSource);
  const participants = new ParticipantsRepositoryTypeORM(
    dataSource.getRepository(FormationParticipantEntity),
  );
  const publication = new PublicationDesCoursRepositoryTypeORM(
    dataSource.getRepository(FormationCourseContentEntity),
  );
  const synchronisation = new SynchroniserCoursUseCase(publication);
  await synchronisation.execute(CONTENUS);

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
    freeResponses: new FreeResponsesRepositoryTypeORM(
      dataSource.getRepository(FormationFreeResponseEntity),
    ),
    annotations: new TeacherAnnotationsRepositoryTypeORM(
      dataSource.getRepository(FormationTeacherAnnotationEntity),
    ),
    escape: new EscapeRepositoryTypeORM(
      dataSource.getRepository(FormationEscapeProgressEntity),
      dataSource.getRepository(FormationEscapeAttemptEntity),
    ),
    pulses: new PulsesRepositoryTypeORM(
      dataSource.getRepository(FormationPulseEntity),
    ),
    rappels: new RappelsServisRepositoryTypeORM(
      dataSource.getRepository(FormationRappelServiEntity),
    ),
    catalogue: new CoursCatalogueRepositoryTypeORM(
      dataSource.getRepository(FormationCourseContentEntity),
      dataSource.getRepository(FormationCoursePublicationEntity),
    ),
    publication,
    async synchroniser(contenus) {
      return synchronisation.execute(contenus);
    },
    async graineDe(participantId: string): Promise<number> {
      const participant = await participants.findById(participantId);
      if (participant === null) {
        throw new Error(`Participant absent de la base: ${participantId}`);
      }
      return participant.seed;
    },
    async nettoyer(): Promise<void> {
      const cibles = TABLES_DE_SEANCE.map((table) => `"${table}"`).join(', ');
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
