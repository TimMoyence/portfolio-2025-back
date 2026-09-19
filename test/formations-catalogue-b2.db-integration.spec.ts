import { DataSource, type EntityTarget, type ObjectLiteral } from 'typeorm';
import { CreateFormations1778900000000 } from '../src/migrations/1778900000000-CreateFormations';
import { CreateFormationCourseContent1779100000000 } from '../src/migrations/1779100000000-CreateFormationCourseContent';
import { SeedB2StoryboardLots1231779200000 } from '../src/migrations/1779200000000-SeedB2StoryboardLots123';
import { AlignB2SessionDeck1779300000000 } from '../src/migrations/1779300000000-AlignB2SessionDeck';
import { SeedB2QuizAndPresentationNotes1779400000000 } from '../src/migrations/1779400000000-SeedB2QuizAndPresentationNotes';
import { FixB2QuizScreenIds1779500000000 } from '../src/migrations/1779500000000-FixB2QuizScreenIds';
import { AddFormationCourseVersion1779550000000 } from '../src/migrations/1779550000000-AddFormationCourseVersion';
import { BackfillB2OpenSessionBaremes1779600000000 } from '../src/migrations/1779600000000-BackfillB2OpenSessionBaremes';
import { AlignB2ParticipantSeeds1779700000000 } from '../src/migrations/1779700000000-AlignB2ParticipantSeeds';
import { RecheckB2ParticipantSeeds1779800000000 } from '../src/migrations/1779800000000-RecheckB2ParticipantSeeds';
import { SeedB2PresentationContent1779900000000 } from '../src/migrations/1779900000000-SeedB2PresentationContent';
import { CleanB2PlaceholderContent1780000000000 } from '../src/migrations/1780000000000-CleanB2PlaceholderContent';
import { AddFormationSessionCourseVersion1780050000000 } from '../src/migrations/1780050000000-AddFormationSessionCourseVersion';
import { SeedB2PresentationNotes1780060000000 } from '../src/migrations/1780060000000-SeedB2PresentationNotes';
import { VersionFormationCourseContent1780100000000 } from '../src/migrations/1780100000000-VersionFormationCourseContent';
import { PublishB2VisualDeck1780200000000 } from '../src/migrations/1780200000000-PublishB2VisualDeck';
import { CreateFormationFreeResponses1780300000000 } from '../src/migrations/1780300000000-CreateFormationFreeResponses';
import { CreateFormationTeacherAnnotations1780400000000 } from '../src/migrations/1780400000000-CreateFormationTeacherAnnotations';
import { CreateFormationGroups1780500000000 } from '../src/migrations/1780500000000-CreateFormationGroups';
import { CreateFormationScores1780600000000 } from '../src/migrations/1780600000000-CreateFormationScores';
import {
  B2_VISUAL_SNAPSHOT,
  B2_VISUAL_SOURCE_SHA256,
} from '../src/migrations/data/b2-visual.snapshot';
import { FormationCourseContentEntity } from '../src/modules/formations/infrastructure/entities/FormationCourseContent.entity';
import { LireCoursPublicUseCase } from '../src/modules/formations/application/LireCoursPublic.useCase';
import { deroulePresentateur } from '../src/modules/formations/domain/cours/DeroulePresentateur';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import { FormationScreenContentEntity } from '../src/modules/formations/infrastructure/entities/FormationScreenContent.entity';
import { CoursCatalogueRepositoryTypeORM } from '../src/modules/formations/infrastructure/CoursCatalogue.repository.typeorm';
import { FreeResponsesRepositoryTypeORM } from '../src/modules/formations/infrastructure/FreeResponses.repository.typeorm';
import { TeacherAnnotationsRepositoryTypeORM } from '../src/modules/formations/infrastructure/TeacherAnnotations.repository.typeorm';
import { SessionsRepositoryTypeORM } from '../src/modules/formations/infrastructure/Sessions.repository.typeorm';
import { FormationSessionEntity } from '../src/modules/formations/infrastructure/entities/FormationSession.entity';
import { FormationFreeResponseEntity } from '../src/modules/formations/infrastructure/entities/FormationFreeResponse.entity';
import { FormationTeacherAnnotationEntity } from '../src/modules/formations/infrastructure/entities/FormationTeacherAnnotation.entity';
import { FormationGroupsRepositoryTypeORM } from '../src/modules/formations/infrastructure/FormationGroups.repository.typeorm';
import { FormationScoreEntity } from '../src/modules/formations/infrastructure/entities/FormationScore.entity';
import { ScoresRepositoryTypeORM } from '../src/modules/formations/infrastructure/Scores.repository.typeorm';
import { FormationParticipantEntity } from '../src/modules/formations/infrastructure/entities/FormationParticipant.entity';
import { FormationGroupEntity } from '../src/modules/formations/infrastructure/entities/FormationGroup.entity';
import { ParticipantsRepositoryTypeORM } from '../src/modules/formations/infrastructure/Participants.repository.typeorm';
import { AnswersRepositoryTypeORM } from '../src/modules/formations/infrastructure/Answers.repository.typeorm';
import { IncidentsRepositoryTypeORM } from '../src/modules/formations/infrastructure/Incidents.repository.typeorm';
import { FormationAnswerEntity } from '../src/modules/formations/infrastructure/entities/FormationAnswer.entity';
import { FormationIncidentEntity } from '../src/modules/formations/infrastructure/entities/FormationIncident.entity';
import { CloseSessionUseCase } from '../src/modules/formations/application/CloseSession.useCase';
import { GetSessionResultsUseCase } from '../src/modules/formations/application/GetSessionResults.useCase';
import {
  buildBareme,
  createMockFormationMailer,
  createMockSessionStateCache,
} from './factories/formation.factory';
import { FORMATION_ENTITIES } from './helpers/formations-db';
import {
  buildDbIntegrationOptions,
  describeDb,
  destroyDbIntegrationDataSource,
} from './helpers/db-integration-datasource';

const SLUG_B2 = 'b2-01-traitement-information-chiffree';
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111';
const DELAI_MIGRATIONS_MS = 60_000;
const RUBRIQUE_A_DIRE_DES_NOTES = /À dire : (.+?)(?= [A-ZÉ][\p{L}’' ]* : |$)/gu;

function aDireDuGuide(guide: unknown): string[] {
  if (typeof guide !== 'object' || guide === null) return [];
  const aDire = (guide as Record<string, unknown>)['aDire'];
  return typeof aDire === 'string' && aDire.trim().length > 0
    ? [aDire.trim()]
    : [];
}

function aDireDesNotes(notes: string): string[] {
  return [...notes.matchAll(RUBRIQUE_A_DIRE_DES_NOTES)].map(([, texte]) =>
    texte.trim(),
  );
}

const MIGRATIONS = [
  CreateFormations1778900000000,
  CreateFormationCourseContent1779100000000,
  SeedB2StoryboardLots1231779200000,
  AlignB2SessionDeck1779300000000,
  SeedB2QuizAndPresentationNotes1779400000000,
  FixB2QuizScreenIds1779500000000,
  AddFormationCourseVersion1779550000000,
  BackfillB2OpenSessionBaremes1779600000000,
  AlignB2ParticipantSeeds1779700000000,
  RecheckB2ParticipantSeeds1779800000000,
  SeedB2PresentationContent1779900000000,
  CleanB2PlaceholderContent1780000000000,
  AddFormationSessionCourseVersion1780050000000,
  SeedB2PresentationNotes1780060000000,
  VersionFormationCourseContent1780100000000,
  PublishB2VisualDeck1780200000000,
  CreateFormationFreeResponses1780300000000,
  CreateFormationTeacherAnnotations1780400000000,
  CreateFormationGroups1780500000000,
  CreateFormationScores1780600000000,
];

describeDb('catalogue B2 migré', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      ...buildDbIntegrationOptions([
        ...FORMATION_ENTITIES,
        FormationCourseContentEntity,
        FormationScreenContentEntity,
        FormationFreeResponseEntity,
        FormationTeacherAnnotationEntity,
        FormationGroupEntity,
        FormationScoreEntity,
      ]),
      synchronize: false,
      migrations: MIGRATIONS,
    });
    await dataSource.initialize();
    await dataSource.runMigrations({ transaction: 'all' });
  }, DELAI_MIGRATIONS_MS);

  afterAll(async () => destroyDbIntegrationDataSource(dataSource));

  it('installe les 72 écrans dans un ordre stable, sans doublon ni contenu de remplissage', async () => {
    const course = await dataSource
      .getRepository(FormationCourseContentEntity)
      .findOneByOrFail({
        slug: 'b2-01-traitement-information-chiffree',
        version: 1,
      });
    const ecrans = await dataSource
      .getRepository(FormationScreenContentEntity)
      .find({
        where: { courseId: course.id },
        order: { position: 'ASC' },
      });

    expect(ecrans).toHaveLength(72);
    expect(ecrans.map((ecran) => ecran.position)).toEqual(
      Array.from({ length: 72 }, (_, position) => position),
    );
    expect(new Set(ecrans.map((ecran) => ecran.screenId)).size).toBe(72);
    expect(ecrans.every((ecran) => ecran.proprietes['presentation'])).toBe(
      true,
    );
    expect(ecrans.every((ecran) => ecran.notes.trim().length > 0)).toBe(true);
    expect(
      ecrans.find((ecran) => ecran.screenId === 'B2-01-S03-PREDICTION')?.notes,
    ).toContain('Attendu :');
    expect(
      ecrans.filter((ecran) => ecran.proprietes['interaction'] !== undefined),
    ).toHaveLength(14);
    expect(
      ecrans.some((ecran) =>
        JSON.stringify(ecran.proprietes).includes(
          'Contenu visuel servi par le deck B2 partagé.',
        ),
      ),
    ).toBe(false);
  });

  it('sert les 72 propriétés visuelles issues du deck source dans une version publiée', async () => {
    const course = await dataSource
      .getRepository(FormationCourseContentEntity)
      .findOneByOrFail({
        slug: 'b2-01-traitement-information-chiffree',
        version: 2,
      });
    const ecrans = await dataSource
      .getRepository(FormationScreenContentEntity)
      .find({ where: { courseId: course.id }, order: { position: 'ASC' } });
    expect(ecrans).toHaveLength(72);
    expect(B2_VISUAL_SOURCE_SHA256).toMatch(/^[a-f0-9]{64}$/);
    expect(
      ecrans.map((ecran) => ({
        position: ecran.position,
        screenId: ecran.screenId,
        renderer: (ecran.proprietes['presentation'] as Record<string, unknown>)[
          'renderer'
        ],
        props: (ecran.proprietes['presentation'] as Record<string, unknown>)[
          'props'
        ],
      })),
    ).toEqual(
      B2_VISUAL_SNAPSHOT.map(({ position, screenId, renderer, props }) => ({
        position,
        screenId,
        renderer,
        props,
      })),
    );
  });

  it('garde la version publiée immuable et permet une nouvelle version du même cours', async () => {
    const catalogue = new CoursCatalogueRepositoryTypeORM(
      dataSource.getRepository(FormationCourseContentEntity),
    );
    const sessions = new SessionsRepositoryTypeORM(
      dataSource.getRepository(FormationSessionEntity),
    );
    const course = await dataSource
      .getRepository(FormationCourseContentEntity)
      .findOneByOrFail({
        slug: 'b2-01-traitement-information-chiffree',
        version: 1,
      });
    const session = await sessions.create({
      courseSlug: course.slug,
      courseVersion: 1,
      teacherId: 'a1111111-1111-4111-8111-111111111111',
      code: '5982',
      bareme: buildBareme(),
    });
    await expect(
      dataSource.query(
        'UPDATE formation_course_contents SET titre = $1 WHERE id = $2',
        ['Titre modifié', course.id],
      ),
    ).rejects.toThrow('version publiée immuable');

    const nouvelle = dataSource
      .getRepository(FormationCourseContentEntity)
      .create({
        slug: course.slug,
        version: 3,
        titre: 'Nouvelle édition',
        niveau: course.niveau,
        dureeMinutes: course.dureeMinutes,
        concepts: course.concepts,
      });
    const publiee = await dataSource
      .getRepository(FormationCourseContentEntity)
      .save(nouvelle);
    await expect(
      dataSource.query(
        `INSERT INTO "formation_screen_contents" ("course_id", "position", "screen_id", "brique", "duree_minutes", "concepts", "notes", "proprietes") VALUES ($1, 0, 'ECRAN-SANS-NOTE', 'fp-story', 1, '[]'::jsonb, '', '{}'::jsonb)`,
        [publiee.id],
      ),
    ).rejects.toThrow('chk_formation_screen_notes_not_blank');
    await dataSource.query(
      `INSERT INTO "formation_screen_contents" ("course_id", "position", "screen_id", "brique", "duree_minutes", "concepts", "notes", "proprietes")
       SELECT $1, "position", "screen_id", "brique", "duree_minutes", "concepts", "notes", "proprietes"
       FROM "formation_screen_contents" WHERE "course_id" = $2`,
      [publiee.id, course.id],
    );

    expect((await catalogue.trouverCourant(course.slug))?.version).toBe(3);
    expect((await catalogue.trouver(course.slug, 1))?.titre).toBe(course.titre);
    expect((await catalogue.trouver(course.slug, 3))?.titre).toBe(
      'Nouvelle édition',
    );
    expect((await sessions.findById(session.id))?.courseVersion).toBe(1);
    await expect(
      dataSource.query(
        `UPDATE "formation_screen_contents" SET "notes" = 'modifiée' WHERE "course_id" = $1`,
        [course.id],
      ),
    ).rejects.toThrow('version publiée immuable');
  });

  it('réserve les notes au déroulé formateur', async () => {
    const catalogue = new CoursCatalogueRepositoryTypeORM(
      dataSource.getRepository(FormationCourseContentEntity),
    );
    const cours = await catalogue.trouver(
      'b2-01-traitement-information-chiffree',
      1,
    );
    if (cours === null) {
      throw new Error('Cours B2 absent après migration');
    }

    const sujet = tirer(cours, 0).sujet;
    const deroule = deroulePresentateur(cours, 0);

    expect(sujet.ecrans.every((ecran) => !('notes' in ecran))).toBe(true);
    expect(deroule.ecrans.every((ecran) => ecran.notes.trim().length > 0)).toBe(
      true,
    );
    expect(JSON.stringify(sujet)).not.toContain('Attendu :');
    expect(JSON.stringify(sujet)).not.toContain('correctIndex');
    expect(JSON.stringify(sujet)).not.toContain('bonneReponse');
    expect(JSON.stringify(sujet)).not.toContain('explanation');
    expect(JSON.stringify(sujet)).not.toContain('"guide":');
    expect(JSON.stringify(deroule)).toContain('bonneReponse');
  });

  it('sert la version visuelle sans réponse attendue ni correction au poste étudiant', async () => {
    const catalogue = new CoursCatalogueRepositoryTypeORM(
      dataSource.getRepository(FormationCourseContentEntity),
    );
    const cours = await catalogue.trouver(
      'b2-01-traitement-information-chiffree',
      2,
    );
    if (cours === null) throw new Error('Version visuelle B2 absente');

    const sujet = tirer(cours, 0).sujet;
    const deroule = deroulePresentateur(cours, 0);
    const contenuEtudiant = JSON.stringify(sujet);
    expect(sujet.ecrans).toHaveLength(72);
    expect(contenuEtudiant).toContain('axisRanges');
    expect(contenuEtudiant).not.toContain('"correction":');
    expect(contenuEtudiant).not.toContain('"guide":');
    expect(contenuEtudiant).not.toContain('"correctIndex":');
    expect(contenuEtudiant).not.toContain('"expected":');
    expect(contenuEtudiant).not.toContain('"notes":');
    expect(JSON.stringify(deroule)).toContain('"bonneReponse":');
  });

  it('ne sert ni interaction ni rubrique à dire hors du deck au poste étudiant ni au catalogue public', async () => {
    const catalogue = new CoursCatalogueRepositoryTypeORM(
      dataSource.getRepository(FormationCourseContentEntity),
    );
    const ecrans = await dataSource
      .getRepository(FormationScreenContentEntity)
      .find();
    const rubriquesADire = ecrans.flatMap((ecran) => [
      ...aDireDuGuide(ecran.proprietes['guide']),
      ...aDireDesNotes(ecran.notes),
    ]);
    const sujets = await Promise.all(
      [1, 2].map(async (version) => {
        const cours = await catalogue.trouver(SLUG_B2, version);
        if (cours === null) throw new Error(`Version ${version} absente`);
        return tirer(cours, 0).sujet;
      }),
    );
    const publics = [
      ...sujets,
      await new LireCoursPublicUseCase(catalogue).execute(SLUG_B2),
    ];
    const complets = publics.map((contenu) => JSON.stringify(contenu));
    const horsDuDeck = publics.map((contenu) =>
      JSON.stringify(contenu, (cle, valeur: unknown) =>
        cle === 'presentation' ? undefined : valeur,
      ),
    );

    expect(rubriquesADire.length).toBeGreaterThan(0);
    expect(
      complets.filter((contenu) => contenu.includes('"interaction"')),
    ).toEqual([]);
    expect(
      rubriquesADire.filter((texte) =>
        horsDuDeck.some((contenu) => contenu.includes(texte)),
      ),
    ).toEqual([]);
  });

  it('persiste une réponse libre de façon idempotente par participant et activité', async () => {
    const sessions = new SessionsRepositoryTypeORM(
      dataSource.getRepository(FormationSessionEntity),
    );
    const participants = new ParticipantsRepositoryTypeORM(
      dataSource.getRepository(FormationParticipantEntity),
    );
    const responses = new FreeResponsesRepositoryTypeORM(
      dataSource.getRepository(FormationFreeResponseEntity),
    );
    const session = await sessions.create({
      courseSlug: 'b2-01-traitement-information-chiffree',
      courseVersion: 2,
      teacherId: 'a1111111-1111-4111-8111-111111111111',
      code: '8364',
      bareme: buildBareme(),
    });
    const participant = await participants.create({
      sessionId: session.id,
      studentKey: 'b1111111-1111-4111-8111-111111111111',
      prenom: 'Ada',
      nom: 'Lovelace',
      email: 'ada@example.test',
      seed: 4,
    });

    const first = await responses.save({
      sessionId: session.id,
      participantId: participant.id,
      screenId: 'B2-01-S11-REFLECTION',
      activityId: 'b2-s11-c1',
      response: 'Première réponse',
      dureeMs: 1200,
    });
    const second = await responses.save({
      sessionId: session.id,
      participantId: participant.id,
      screenId: 'B2-01-S11-REFLECTION',
      activityId: 'b2-s11-c1',
      response: 'Réponse reprise après reconnexion',
      dureeMs: 2200,
    });

    expect(second.id).toBe(first.id);
    await expect(responses.listBySession(session.id)).resolves.toEqual([
      expect.objectContaining({
        participantId: participant.id,
        activityId: 'b2-s11-c1',
        response: 'Réponse reprise après reconnexion',
        status: 'enregistre',
        dureeMs: 2200,
      }),
    ]);
  });

  it('synchronise les annotations formateur par écran et groupe', async () => {
    const sessions = new SessionsRepositoryTypeORM(
      dataSource.getRepository(FormationSessionEntity),
    );
    const annotations = new TeacherAnnotationsRepositoryTypeORM(
      dataSource.getRepository(FormationTeacherAnnotationEntity),
    );
    const session = await sessions.create({
      courseSlug: 'b2-01-traitement-information-chiffree',
      courseVersion: 2,
      teacherId: 'a1111111-1111-4111-8111-111111111111',
      code: '9473',
      bareme: buildBareme(),
    });
    const first = await annotations.save({
      sessionId: session.id,
      teacherId: session.teacherId,
      screenId: 'B2-01-S11-REFLECTION',
      groupName: 'Groupe A',
      note: 'Relancer sur la base de comparaison.',
    });
    const second = await annotations.save({
      sessionId: session.id,
      teacherId: session.teacherId,
      screenId: 'B2-01-S11-REFLECTION',
      groupName: 'Groupe A',
      note: 'Faire verbaliser la formule.',
    });

    expect(second.id).toBe(first.id);
    await expect(
      annotations.listBySession(session.id, session.teacherId),
    ).resolves.toEqual([
      expect.objectContaining({
        screenId: 'B2-01-S11-REFLECTION',
        groupName: 'Groupe A',
        note: 'Faire verbaliser la formule.',
      }),
    ]);
    await expect(
      annotations.listBySession(
        session.id,
        'b2222222-2222-4222-8222-222222222222',
      ),
    ).resolves.toEqual([]);
  });

  it('persiste les groupes et les affectations', async () => {
    const sessions = new SessionsRepositoryTypeORM(
      dataSource.getRepository(FormationSessionEntity),
    );
    const participants = new ParticipantsRepositoryTypeORM(
      dataSource.getRepository(FormationParticipantEntity),
    );
    const groups = new FormationGroupsRepositoryTypeORM(
      dataSource.getRepository(FormationGroupEntity),
      dataSource.getRepository(FormationParticipantEntity),
    );
    const session = await sessions.create({
      courseSlug: 'b2-01-traitement-information-chiffree',
      courseVersion: 2,
      teacherId: 'a1111111-1111-4111-8111-111111111111',
      code: '1582',
      bareme: buildBareme(),
    });
    const participant = await participants.create({
      sessionId: session.id,
      studentKey: 'b3111111-1111-4111-8111-111111111111',
      prenom: 'Grace',
      nom: 'Hopper',
      email: 'grace@example.test',
      seed: 8,
    });
    const groupe = await groups.create(session.id, 'Groupe A');
    await groups.assignParticipant(session.id, participant.id, groupe.id);
    expect((await participants.findById(participant.id))?.groupId).toBe(
      groupe.id,
    );
    await groups.rename(session.id, groupe.id, 'Groupe B');
    expect((await groups.listBySession(session.id))[0]?.name).toBe('Groupe B');
  });

  it('persiste à la clôture la note et la complétion de chaque participant et les statistiques de la séance', async () => {
    const depot = <T extends ObjectLiteral>(entite: EntityTarget<T>) =>
      dataSource.getRepository(entite);
    const sessions = new SessionsRepositoryTypeORM(
      depot(FormationSessionEntity),
    );
    const participants = new ParticipantsRepositoryTypeORM(
      depot(FormationParticipantEntity),
    );
    const answers = new AnswersRepositoryTypeORM(depot(FormationAnswerEntity));
    const scores = new ScoresRepositoryTypeORM(depot(FormationScoreEntity));
    const session = await sessions.create({
      courseSlug: SLUG_B2,
      courseVersion: 2,
      teacherId: FORMATEUR,
      code: '7315',
      bareme: buildBareme(),
    });
    const ada = await participants.create({
      sessionId: session.id,
      studentKey: 'b4111111-1111-4111-8111-111111111111',
      prenom: 'Ada',
      nom: 'Lovelace',
      email: 'ada@example.test',
      seed: 1001,
    });
    const grace = await participants.create({
      sessionId: session.id,
      studentKey: 'b5111111-1111-4111-8111-111111111111',
      prenom: 'Grace',
      nom: 'Hopper',
      email: 'grace@example.test',
      seed: 1002,
    });
    await answers.create({
      sessionId: session.id,
      participantId: ada.id,
      questionId: 'Q-CAP-03',
      concept: 'capitalisation',
      valeur: 1338.23,
      seed: 1001,
      correcte: true,
      misconception: null,
      dureeMs: 1000,
    });
    const cloture = new CloseSessionUseCase(
      sessions,
      new GetSessionResultsUseCase(
        sessions,
        participants,
        answers,
        new IncidentsRepositoryTypeORM(depot(FormationIncidentEntity)),
        new CoursCatalogueRepositoryTypeORM(
          depot(FormationCourseContentEntity),
        ),
      ),
      scores,
      createMockFormationMailer(),
      createMockSessionStateCache(),
    );

    await cloture.execute(session.id, FORMATEUR);
    const statistiques = {
      sessionId: session.id,
      moyenne: 10,
      mediane: 10,
      dispersion: 10,
      tauxParticipation: 0.5,
      tauxReussite: 1,
      questionsProblemes: [],
    };
    await Promise.all([
      scores.saveSession(statistiques),
      scores.saveSession(statistiques),
    ]);

    await expect(
      dataSource.query(
        `SELECT "participant_id" AS "participantId", "kind", "score", "percentage", "metrics"
         FROM "formation_scores" WHERE "session_id" = $1
         ORDER BY "kind", "score" DESC`,
        [session.id],
      ),
    ).resolves.toEqual([
      {
        participantId: ada.id,
        kind: 'individual',
        score: 20,
        percentage: 1,
        metrics: {},
      },
      {
        participantId: grace.id,
        kind: 'individual',
        score: 0,
        percentage: 0,
        metrics: {},
      },
      {
        participantId: null,
        kind: 'session',
        score: 10,
        percentage: 1,
        metrics: {
          mediane: 10,
          dispersion: 10,
          tauxParticipation: 0.5,
          questionsProblemes: [],
        },
      },
    ]);
  });
});
