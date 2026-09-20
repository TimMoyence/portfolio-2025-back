import {
  B2_VISUAL_SNAPSHOT,
  B2_VISUAL_SOURCE_SHA256,
} from '../src/migrations/data/b2-visual.snapshot';
import { CloseSessionUseCase } from '../src/modules/formations/application/CloseSession.useCase';
import { GetSessionResultsUseCase } from '../src/modules/formations/application/GetSessionResults.useCase';
import { LireCoursPublicUseCase } from '../src/modules/formations/application/LireCoursPublic.useCase';
import { ContenuDeCoursInvalideError } from '../src/modules/formations/domain/cours/CoursStocke';
import { deroulePresentateur } from '../src/modules/formations/domain/cours/DeroulePresentateur';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import {
  FormationGroupNameTakenError,
  FormationGroupNotFoundError,
  ParticipantNotFoundError,
} from '../src/modules/formations/domain/errors/FormationErrors';
import { FormationCourseContentEntity } from '../src/modules/formations/infrastructure/entities/FormationCourseContent.entity';
import { FormationScreenContentEntity } from '../src/modules/formations/infrastructure/entities/FormationScreenContent.entity';
import {
  buildEcranStockeAvec,
  buildQuizNote,
} from './factories/cours-stocke.factory';
import {
  buildBareme,
  createMockEscapeRepo,
  createMockFormationMailer,
  createMockPulsesRepo,
  createMockSessionStateCache,
} from './factories/formation.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  DELAI_OUVERTURE_CONTEXTE_MS,
  ouvrirContexteFormations,
  type ContexteFormations,
} from './helpers/formations-db';

const SLUG_B2 = 'b2-01-traitement-information-chiffree';
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111';
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

describeDb('catalogue B2 migré', () => {
  let contexte: ContexteFormations;

  const ecransDeLaVersion = async (
    version: number,
  ): Promise<FormationScreenContentEntity[]> => {
    const course = await contexte.dataSource
      .getRepository(FormationCourseContentEntity)
      .findOneByOrFail({ slug: SLUG_B2, version });
    return contexte.dataSource
      .getRepository(FormationScreenContentEntity)
      .find({ where: { courseId: course.id }, order: { position: 'ASC' } });
  };

  const ouvrirSeanceB2 = (code: string, courseVersion = 2) =>
    contexte.sessions.create({
      courseSlug: SLUG_B2,
      courseVersion,
      teacherId: FORMATEUR,
      code,
      bareme: buildBareme(),
    });

  const coursDeLaVersion = async (version: number) => {
    const cours = await contexte.catalogue.trouver(SLUG_B2, version);
    if (cours === null) throw new Error(`Version ${version} absente`);
    return cours;
  };

  beforeAll(async () => {
    contexte = await ouvrirContexteFormations();
  }, DELAI_OUVERTURE_CONTEXTE_MS);

  afterAll(async () => contexte.fermer());

  it('installe les 72 écrans dans un ordre stable, sans doublon ni contenu de remplissage', async () => {
    const ecrans = await ecransDeLaVersion(1);

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
    const ecrans = await ecransDeLaVersion(2);
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
    const { dataSource, catalogue, sessions } = contexte;
    const course = await dataSource
      .getRepository(FormationCourseContentEntity)
      .findOneByOrFail({ slug: SLUG_B2, version: 1 });
    const session = await ouvrirSeanceB2('5982', 1);
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
      `INSERT INTO "formation_screen_contents" ("course_id", "position", "screen_id", "titre", "diffusion", "brique", "duree_minutes", "concepts", "notes", "proprietes")
       SELECT $1, "position", "screen_id", "screen_id", 'catalogue', "brique", "duree_minutes", "concepts", "notes", "proprietes"
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

  it('valide à la lecture le contenu réellement migré des versions 1 et 2', async () => {
    const lus = await Promise.all([1, 2].map(coursDeLaVersion));

    expect(lus.map((cours) => cours.ecrans.length)).toEqual([72, 72]);
    expect(
      lus.map((cours) => cours.ecrans.filter((ecran) => ecran.question).length),
    ).toEqual([14, 14]);
  });

  it('refuse à la lecture un contenu stocké hors contrat au lieu de le rafistoler', async () => {
    const { dataSource, catalogue } = contexte;
    const [cours]: Array<{ id: string }> = await dataSource.query(
      `INSERT INTO "formation_course_contents" ("slug", "version", "titre", "niveau", "duree_minutes", "concepts")
       VALUES ('cours-hors-contrat', 1, 'Cours hors contrat', 'B2', 3, '["proportion"]'::jsonb) RETURNING "id"`,
    );
    const ecran = buildEcranStockeAvec({
      interaction: buildQuizNote({
        confusions: ['raisonnement-additif', 'unite-oubliee'],
      }),
    });
    await dataSource.query(
      `INSERT INTO "formation_screen_contents" ("course_id", "position", "screen_id", "brique", "duree_minutes", "concepts", "notes", "proprietes")
       VALUES ($1, 0, $2, $3, $4, $5::jsonb, $6, $7::jsonb)`,
      [
        cours.id,
        ecran.screenId,
        ecran.brique,
        ecran.dureeMinutes,
        JSON.stringify(ecran.concepts),
        ecran.notes,
        JSON.stringify(ecran.proprietes),
      ],
    );

    await expect(
      catalogue.trouver('cours-hors-contrat', 1),
    ).rejects.toBeInstanceOf(ContenuDeCoursInvalideError);
  });

  it('réserve les notes au déroulé formateur', async () => {
    const cours = await coursDeLaVersion(1);

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
    const cours = await coursDeLaVersion(2);

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
    const ecrans = await contexte.dataSource
      .getRepository(FormationScreenContentEntity)
      .find();
    const rubriquesADire = ecrans.flatMap((ecran) => [
      ...aDireDuGuide(ecran.proprietes['guide']),
      ...aDireDesNotes(ecran.notes),
    ]);
    const sujets = await Promise.all(
      [1, 2].map(
        async (version) => tirer(await coursDeLaVersion(version), 0).sujet,
      ),
    );
    const publics = [
      ...sujets,
      await new LireCoursPublicUseCase(contexte.catalogue).execute(SLUG_B2),
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
    const { participants, freeResponses } = contexte;
    const session = await ouvrirSeanceB2('8364');
    const participant = await participants.create({
      sessionId: session.id,
      studentKey: 'b1111111-1111-4111-8111-111111111111',
      prenom: 'Ada',
      nom: 'Lovelace',
      email: 'ada@example.test',
      seed: 4,
    });

    const reponse = {
      sessionId: session.id,
      participantId: participant.id,
      screenId: 'B2-01-S11-REFLECTION',
      activityId: 'b2-s11-c1',
    };

    await expect(
      Promise.all([
        freeResponses.save({
          ...reponse,
          response: 'Envoi du premier onglet',
          dureeMs: 1200,
        }),
        freeResponses.save({
          ...reponse,
          response: 'Envoi du second onglet',
          dureeMs: 1300,
        }),
      ]),
    ).resolves.toEqual([undefined, undefined]);
    await freeResponses.save({
      ...reponse,
      response: 'Réponse reprise après reconnexion',
      dureeMs: 2200,
    });

    await expect(freeResponses.listBySession(session.id)).resolves.toEqual([
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
    const { annotations } = contexte;
    const session = await ouvrirSeanceB2('9473');
    const annotation = {
      sessionId: session.id,
      teacherId: session.teacherId,
      screenId: 'B2-01-S11-REFLECTION',
      groupName: 'Groupe A',
    };
    const [pupitre, scene] = await Promise.all([
      annotations.save({
        ...annotation,
        note: 'Relancer sur la base de comparaison.',
      }),
      annotations.save({ ...annotation, note: 'Noter au tableau.' }),
    ]);
    const reprise = await annotations.save({
      ...annotation,
      note: 'Faire verbaliser la formule.',
    });

    expect([scene.id, reprise.id]).toEqual([pupitre.id, pupitre.id]);
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
    const { participants, groups } = contexte;
    const session = await ouvrirSeanceB2('1582');
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

    const autre = await groups.create(session.id, 'Groupe C');
    const inconnu = 'c9999999-9999-4999-8999-999999999999';
    await expect(groups.create(session.id, 'Groupe B')).rejects.toBeInstanceOf(
      FormationGroupNameTakenError,
    );
    await expect(
      groups.rename(session.id, autre.id, 'Groupe B'),
    ).rejects.toBeInstanceOf(FormationGroupNameTakenError);
    await expect(
      groups.rename(session.id, inconnu, 'Groupe D'),
    ).rejects.toBeInstanceOf(FormationGroupNotFoundError);
    await expect(
      groups.assignParticipant(session.id, participant.id, inconnu),
    ).rejects.toBeInstanceOf(FormationGroupNotFoundError);
    await expect(
      groups.assignParticipant(session.id, inconnu, groupe.id),
    ).rejects.toBeInstanceOf(ParticipantNotFoundError);
  });

  it('persiste à la clôture la note et la complétion de chaque participant et les statistiques de la séance', async () => {
    const { sessions, participants, answers, incidents, catalogue, scores } =
      contexte;
    const session = await ouvrirSeanceB2('7315');
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
        incidents,
        catalogue,
        createMockPulsesRepo(),
        createMockEscapeRepo(),
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
      contexte.dataSource.query(
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
