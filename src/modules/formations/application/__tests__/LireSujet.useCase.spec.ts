import {
  buildCoursAUneQuestion,
  buildCoursDeTest,
  buildQuestionNumeriqueFigee,
  creerCatalogueDeTest,
  lireSujetSur,
  tireurSequentiel,
} from '../../../../../test/factories/cours.factory';
import {
  buildBareme,
  buildParticipantRecord,
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  buildCorrectionDeReponses,
  buildCoursDeBriques,
  buildEcranDeBrique,
} from '../../../../../test/factories/ecrans-stockes.factory';
import { verifierIntrouvables } from '../../../../../test/helpers/gardes-de-seance';
import type { Cours } from '../../domain/contrats/cours';
import type { CoursPublic } from '../../domain/contrats/tirage';
import { lireCoursStocke } from '../../domain/cours/CoursStocke';
import { ouvrirTirages } from '../../domain/cours/OuvertureTirages';
import { tirer } from '../../domain/cours/Tirage';
import {
  CoursInconnuError,
  CoursModifieError,
  ParticipantNotFoundError,
} from '../../domain/errors/FormationErrors';
import type { SessionRecord } from '../../domain/ISessions.repository';
import type { LireSujetUseCase } from '../LireSujet.useCase';

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

function sansCorrection(sujet: CoursPublic): CoursPublic {
  return {
    ...sujet,
    ecrans: sujet.ecrans.map(
      (ecran) =>
        Object.fromEntries(
          Object.entries(ecran).filter(([cle]) => cle !== 'correction'),
        ) as CoursPublic['ecrans'][number],
    ),
  };
}

function coursAmbigu(): Cours {
  return buildCoursAUneQuestion(
    buildQuestionNumeriqueFigee(100, [100.5], {
      type: 'relative',
      valeur: 0.01,
    }),
  );
}

function sujetDuParticipant(sut: LireSujetUseCase): Promise<CoursPublic> {
  return sut.execute({ sessionId: SESSION.id, participantId: PARTICIPANT.id });
}

function seanceDuCours(
  cours: Cours,
  diffusion: Partial<SessionRecord>,
): SessionRecord {
  return buildSessionRecord({
    courseSlug: cours.slug,
    bareme: buildBareme({
      tirages: [{ seed: SEED, solutions: tirer(cours, SEED).solutions }],
    }),
    ...diffusion,
  });
}

function lecteurDuParticipant(
  sessions: ReturnType<typeof createMockSessionsRepo>,
  cours: Cours,
): LireSujetUseCase {
  const participants = createMockParticipantsRepo();
  participants.findById.mockResolvedValue(PARTICIPANT);
  return lireSujetSur(sessions, participants, creerCatalogueDeTest(cours));
}

describe('LireSujetUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let sut: LireSujetUseCase;

  const demander = () => sujetDuParticipant(sut);

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    participants = createMockParticipantsRepo();
    sessions.findById.mockResolvedValue(SESSION);
    participants.findById.mockResolvedValue(PARTICIPANT);
    sut = lireSujetSur(sessions, participants, creerCatalogueDeTest(COURS));
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

  describe('sur l exemple travaille projete', () => {
    const RANG_DE_L_EXEMPLE = TIRAGE.sujet.ecrans.findIndex(
      ({ id }) => id === 'E-REM',
    );
    const exempleServi = async () => {
      const sujet = await demander();
      return sujet.ecrans[RANG_DE_L_EXEMPLE].donnees as {
        readonly exemple: {
          readonly etapes: readonly { readonly raisonnement: string }[];
        };
        readonly etayage: number;
      };
    };
    const projeter = (pilotageEcrans: Record<string, { etayage: number }>) =>
      sessions.findById.mockResolvedValue({
        ...SESSION,
        ecranCourant: RANG_DE_L_EXEMPLE,
        pilotageEcrans,
      });

    it('RET-23 · tait le raisonnement des etapes que le formateur n a pas revelees', async () => {
      projeter({});

      const { exemple, etayage } = await exempleServi();

      expect(etayage).toBe(0);
      expect(exemple.etapes.map(({ raisonnement }) => raisonnement)).toEqual([
        '',
      ]);
    });

    it('RET-23 · sert le raisonnement d une etape une fois revelee', async () => {
      projeter({ 'E-REM': { etayage: 1 } });

      const { exemple, etayage } = await exempleServi();

      expect(etayage).toBe(1);
      expect(exemple.etapes.map(({ raisonnement }) => raisonnement)).toEqual([
        'Arrivée moins départ.',
      ]);
    });
  });

  it('lit la version du cours fixée à l ouverture de la séance', async () => {
    const catalogue = creerCatalogueDeTest(COURS);
    const trouver = jest.spyOn(catalogue, 'trouver').mockResolvedValue(COURS);
    sessions.findById.mockResolvedValue({ ...SESSION, courseVersion: 2 });
    sut = lireSujetSur(sessions, participants, catalogue);

    await demander();

    expect(trouver).toHaveBeenCalledWith(COURS.slug, 2);
  });

  it('rend tout le sujet apres la cloture de la seance', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ ...SESSION, etat: 'terminee' }),
    );

    const sujet = await demander();

    expect(sansCorrection(sujet)).toEqual(TIRAGE.sujet);
    expect(sujet.ecrans[0].correction?.ecranId).toBe(sujet.ecrans[0].id);
  });

  verifierIntrouvables(() => ({
    sessions,
    participants,
    executer: demander,
  }));

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
    sut = lireSujetSur(
      sessions,
      participants,
      creerCatalogueDeTest(buildCoursDeTest({ slug: 'un-autre-slug' })),
    );

    await expect(demander()).rejects.toBeInstanceOf(CoursInconnuError);
  });

  it('refuse quand le cours a change au point de rendre le tirage ambigu', async () => {
    sut = lireSujetSur(
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

  describe('sur un barème v2', () => {
    const v2 = ouvrirTirages(COURS, tireurSequentiel(300));
    const [{ seed }] = v2.tirages;

    beforeEach(() => {
      participants.findById.mockResolvedValue(
        buildParticipantRecord({ sessionId: SESSION.id, seed }),
      );
    });

    it('rend le sujet quand les solutions recalculées égalent écarts et solutions communes', async () => {
      sessions.findById.mockResolvedValue(
        buildSessionRecord({ ...SESSION, etat: 'terminee', bareme: v2 }),
      );

      expect(sansCorrection(await demander())).toEqual(
        tirer(COURS, seed).sujet,
      );
    });

    it('refuse quand une solution commune a changé', async () => {
      if (v2.version !== 2) {
        throw new Error('barème v2 attendu');
      }
      sessions.findById.mockResolvedValue(
        buildSessionRecord({
          ...SESSION,
          bareme: {
            ...v2,
            solutionsCommunes: {
              ...v2.solutionsCommunes,
              'Q-TEST-VOTE-INCONNUE': { valeur: 'o1', pieges: [] },
            },
          },
        }),
      );

      await expect(demander()).rejects.toBeInstanceOf(CoursModifieError);
    });
  });
});

describe('LireSujetUseCase — écrans de correction (SEC-1)', () => {
  const ATELIER = buildEcranDeBrique('questionnaire', {
    screenId: 'B2-01-A2-03-ATELIER-1',
  });
  const CORRIGE = lireCoursStocke(
    buildCoursDeBriques([ATELIER, buildCorrectionDeReponses(ATELIER.screenId)]),
  );
  const tirage = tirer(CORRIGE, SEED);
  const session = (diffusion: Partial<SessionRecord>) =>
    seanceDuCours(CORRIGE, diffusion);
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let sut: LireSujetUseCase;

  const correctionServie = async () =>
    (await sujetDuParticipant(sut)).ecrans[1];

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sut = lecteurDuParticipant(sessions, CORRIGE);
  });

  it('verrouille en rythme libre une correction dont la source n est pas révélée', async () => {
    sessions.findById.mockResolvedValue(
      session({ modeRythme: 'libre', intervalleLibre: null }),
    );

    await expect(correctionServie()).resolves.toEqual({
      id: `${ATELIER.screenId}-CORRECTION`,
      type: 'ecran-verrouille',
      titre: 'Écran fp-story',
      duree: 1,
      interactif: false,
      donnees: {},
      ecranCorrige: ATELIER.screenId,
    });
  });

  it('sert la correction et les réponses du tirage une fois la source révélée', async () => {
    sessions.findById.mockResolvedValue(
      session({
        ecranCourant: 1,
        pilotageEcrans: { [ATELIER.screenId]: { revele: true } },
      }),
    );

    const servi = await correctionServie();

    expect(servi.type).toBe('fp-story');
    expect(servi.correction).toMatchObject({
      ecranId: ATELIER.screenId,
      questions: [
        {
          questionId: 'b2-01-a2-evolution-marge',
          optionId: tirage.solutions['b2-01-a2-evolution-marge'].valeur,
        },
        { questionId: 'b2-01-a2-part-marketplace', optionId: null },
      ],
    });
  });

  it('sert la correction après la clôture de la séance', async () => {
    sessions.findById.mockResolvedValue(session({ etat: 'terminee' }));

    expect((await correctionServie()).correction?.ecranId).toBe(
      ATELIER.screenId,
    );
  });
});

describe('LireSujetUseCase — correction de l écran source révélé (T9)', () => {
  const RAPPEL = buildEcranDeBrique('fp-recall', {
    screenId: 'B2-01-A1-01-RAPPEL',
  });
  const FEUILLE = buildEcranDeBrique('fp-sheet', {
    screenId: 'B2-01-A4-02-FEUILLE',
  });
  const CITATION = buildEcranDeBrique('fp-quote', {
    screenId: 'B2-01-A1-02-CITATION',
  });
  const SOURCES = lireCoursStocke(
    buildCoursDeBriques([RAPPEL, FEUILLE, CITATION]),
  );
  const tirage = tirer(SOURCES, SEED);
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let sut: LireSujetUseCase;

  const servir = (diffusion: Partial<SessionRecord>) =>
    sessions.findById.mockResolvedValue(
      seanceDuCours(SOURCES, { ecranCourant: 2, ...diffusion }),
    );
  const ecransServis = async () => (await sujetDuParticipant(sut)).ecrans;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sut = lecteurDuParticipant(sessions, SOURCES);
  });

  it('tait la bonne réponse tant que le formateur n a pas révélé l écran', async () => {
    servir({});

    const [rappel, feuille] = await ecransServis();

    expect(rappel.correction).toBeUndefined();
    expect(feuille.correction).toBeUndefined();
  });

  it('tait la bonne réponse en phase de révélation d un vote, quand la question jumelle reste ouverte', async () => {
    servir({ pilotageEcrans: { [RAPPEL.screenId]: { phase: 'revele' } } });

    expect((await ecransServis())[0].correction).toBeUndefined();
  });

  it('sert sur l écran révélé la bonne réponse du tirage de l étudiant', async () => {
    servir({ pilotageEcrans: { [RAPPEL.screenId]: { revele: true } } });

    const [rappel, feuille] = await ecransServis();
    const [question] = rappel.correction?.questions ?? [];

    expect(rappel.correction?.ecranId).toBe(RAPPEL.screenId);
    expect(question.optionId).toBe(
      tirage.solutions[question.questionId].valeur,
    );
    expect(feuille.correction).toBeUndefined();
  });

  it('sert le corrigé d une feuille révélée', async () => {
    servir({ pilotageEcrans: { [FEUILLE.screenId]: { revele: true } } });

    const feuille = (await ecransServis())[1];

    expect(feuille.correction).toMatchObject({
      ecranId: FEUILLE.screenId,
      corrige: { type: 'feuille' },
    });
  });

  it('sert chaque corrigé après la clôture, sans rien poser sur un écran sans corrigé', async () => {
    servir({ etat: 'terminee' });

    const [rappel, feuille, citation] = await ecransServis();

    expect(rappel.correction?.ecranId).toBe(RAPPEL.screenId);
    expect(feuille.correction?.ecranId).toBe(FEUILLE.screenId);
    expect(citation.correction).toBeUndefined();
  });
});
