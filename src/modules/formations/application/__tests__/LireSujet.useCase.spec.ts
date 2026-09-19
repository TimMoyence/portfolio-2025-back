import {
  buildCoursDeTest,
  creerCatalogueDeTest,
} from '../../../../../test/factories/cours.factory';
import {
  buildBareme,
  buildParticipantRecord,
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import type { Cours, Ecran } from '../../domain/cours/Cours';
import { questionNumerique } from '../../domain/cours/Cours';
import { tirer } from '../../domain/cours/Tirage';
import {
  CoursInconnuError,
  CoursModifieError,
  ParticipantNotFoundError,
  SessionNotFoundError,
} from '../../domain/errors/FormationErrors';
import { LireSujetUseCase } from '../LireSujet.useCase';

const SEED = 4242;
const COURS = buildCoursDeTest();
const TIRAGE = tirer(COURS, SEED);
const BAREME = buildBareme({
  tirages: [{ seed: SEED, solutions: TIRAGE.solutions }],
});
const SESSION = buildSessionRecord({ courseSlug: COURS.slug, bareme: BAREME });
const PARTICIPANT = buildParticipantRecord({
  sessionId: SESSION.id,
  seed: SEED,
});

function coursAmbigu(): Cours {
  const question = questionNumerique({
    id: 'Q-FIGEE',
    concept: 'proportion',
    noteCompte: false,
    donnees: () => ({}),
    enonce: () => 'e',
    unite: null,
    solution: () => 100,
    tolerance: { type: 'relative', valeur: 0.01 },
    pieges: [{ confusion: 'base-arrivee', valeur: () => 100.5 }],
  });
  const ecran: Ecran = {
    id: 'E',
    dureeMinutes: 1,
    concepts: ['proportion'],
    notes: '',
    brique: 'fp-numeric',
    question,
  };
  return buildCoursDeTest({ ecrans: [ecran] });
}

describe('LireSujetUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let sut: LireSujetUseCase;

  const demander = () =>
    sut.execute({ sessionId: SESSION.id, participantId: PARTICIPANT.id });

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    participants = createMockParticipantsRepo();
    sessions.findById.mockResolvedValue(SESSION);
    participants.findById.mockResolvedValue(PARTICIPANT);
    sut = new LireSujetUseCase(
      sessions,
      participants,
      creerCatalogueDeTest(COURS),
    );
  });

  it('rend le sujet du tirage attribue au participant', async () => {
    const sujet = await demander();

    expect(sujet.ecrans[0]).toEqual(TIRAGE.sujet.ecrans[0]);
    expect(
      sujet.ecrans
        .slice(1)
        .every(
          ({ type, donnees }) =>
            type === 'ecran-verrouille' && Object.keys(donnees).length === 0,
        ),
    ).toBe(true);
  });

  it('lit la version du cours fixée à l ouverture de la séance', async () => {
    const catalogue = creerCatalogueDeTest(COURS);
    const trouver = jest.spyOn(catalogue, 'trouver').mockReturnValue(COURS);
    sessions.findById.mockResolvedValue({ ...SESSION, courseVersion: 2 });
    sut = new LireSujetUseCase(sessions, participants, catalogue);

    await demander();

    expect(trouver).toHaveBeenCalledWith(COURS.slug, 2);
  });

  it('rend tout le sujet apres la cloture de la seance', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ ...SESSION, etat: 'terminee' }),
    );

    await expect(demander()).resolves.toEqual(TIRAGE.sujet);
  });

  it('refuse une session inconnue', async () => {
    sessions.findById.mockResolvedValue(null);

    await expect(demander()).rejects.toBeInstanceOf(SessionNotFoundError);
  });

  it('refuse un participant introuvable', async () => {
    participants.findById.mockResolvedValue(null);

    await expect(demander()).rejects.toBeInstanceOf(ParticipantNotFoundError);
  });

  it('refuse un participant inscrit dans une autre session', async () => {
    participants.findById.mockResolvedValue(
      buildParticipantRecord({
        id: PARTICIPANT.id,
        sessionId: 'autre-session-uuid',
        seed: SEED,
      }),
    );

    await expect(demander()).rejects.toBeInstanceOf(ParticipantNotFoundError);
  });

  it('refuse un cours absent du catalogue', async () => {
    sut = new LireSujetUseCase(
      sessions,
      participants,
      creerCatalogueDeTest(buildCoursDeTest({ slug: 'un-autre-slug' })),
    );

    await expect(demander()).rejects.toBeInstanceOf(CoursInconnuError);
  });

  it('refuse quand le cours a change au point de rendre le tirage ambigu', async () => {
    sut = new LireSujetUseCase(
      sessions,
      participants,
      creerCatalogueDeTest(coursAmbigu()),
    );

    await expect(demander()).rejects.toBeInstanceOf(CoursModifieError);
  });

  it('refuse quand les solutions recalculees different du bareme stocke', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({
        courseSlug: COURS.slug,
        bareme: buildBareme({
          tirages: [
            {
              seed: SEED,
              solutions: {
                ...TIRAGE.solutions,
                'Q-TEST-NUM': { valeur: 999_999, pieges: [] },
              },
            },
          ],
        }),
      }),
    );

    await expect(demander()).rejects.toBeInstanceOf(CoursModifieError);
  });
});
