/* eslint-disable @typescript-eslint/unbound-method */
import { B2_COURS_V3 } from '../../../../migrations/data/b2-v3.cours';
import { creerCatalogueAVersions } from '../../../../../test/factories/cours.factory';
import {
  buildSessionRecord,
  createMockAnswersRepo,
  createMockMasteryRepo,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import type { CorrigeFeuille } from '../../domain/cours/Corrige';
import { lireCoursStocke } from '../../domain/cours/CoursStocke';
import { ecranDeProduction } from '../../domain/cours/ProductionSoumise';
import { ProductionVideError } from '../../domain/errors/FormationErrors';
import { SubmitProductionUseCase } from '../SubmitProduction.useCase';

const COURS = lireCoursStocke(B2_COURS_V3);
const DERNIER_ECRAN = COURS.ecrans.length - 1;
const FEUILLE = 'b2-01-a4-feuille-canaux';
const TABLEAU = 'b2-01-a4-indice-toile';
const CELLULES_ATTENDUES = 17;
const LIGNES_DU_TABLEAU = 4;

function corrigeDeLaFeuille(): CorrigeFeuille {
  const cible = ecranDeProduction(COURS, FEUILLE);
  if (cible === null || cible.question.corrige.type !== 'feuille') {
    throw new Error('la feuille A4-02 est absente de la V3');
  }
  return cible.question.corrige;
}

function envoiDeReference(): Record<string, string> {
  return Object.fromEntries(
    corrigeDeLaFeuille().attendus.map((attendu) => [
      attendu.reference,
      attendu.formuleReference,
    ]),
  );
}

describe('productions de la V3 corrigées par le cas d’usage (B5, B11)', () => {
  let answers: ReturnType<typeof createMockAnswersRepo>;
  let sut: SubmitProductionUseCase;

  const commande = {
    sessionId: 'session-uuid',
    participantId: 'participant-uuid',
    questionId: FEUILLE,
    valeur: { type: 'feuille' as const, cellules: envoiDeReference() },
    dureeMs: 900000,
  };

  beforeEach(() => {
    const sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({
        courseSlug: COURS.slug,
        courseVersion: 3,
        ecranCourant: DERNIER_ECRAN,
      }),
    );
    answers = createMockAnswersRepo();
    sut = new SubmitProductionUseCase(
      sessions,
      createMockParticipantsRepo(),
      answers,
      createMockMasteryRepo(),
      createMockSessionStateCache(),
      creerCatalogueAVersions({ [COURS.slug]: { 3: COURS } }),
    );
  });

  it('déclare la feuille A4-02 réussie sur les 17 cellules attendues', async () => {
    const verdict = await sut.execute(commande);

    expect(verdict.details).toHaveLength(CELLULES_ATTENDUES);
    expect(verdict.score).toBe(1);
    expect(verdict.correcte).toBe(true);
  });

  it('reconnaît le taux écrit en pourcentage sur D2 et le nomme à l’étudiant', async () => {
    const verdict = await sut.execute({
      ...commande,
      valeur: {
        type: 'feuille',
        cellules: { ...envoiDeReference(), D2: '=(C2-B2)/B2*100' },
      },
    });

    expect(verdict.score).toBeLessThan(1);
    expect(verdict.details.find((detail) => detail.cle === 'D2')).toEqual({
      cle: 'D2',
      juste: false,
      libelleConfusion: expect.any(String),
    });
    expect(verdict.libelleConfusion).not.toBeNull();
  });

  it('refuse une feuille sans aucune saisie', async () => {
    await expect(
      sut.execute({
        ...commande,
        valeur: { type: 'feuille', cellules: {} },
      }),
    ).rejects.toThrow(ProductionVideError);
    expect(answers.create).not.toHaveBeenCalled();
  });

  it('corrige le tableau A4-05 sur les huit saisies attendues', async () => {
    const saisies = [
      { rang: 0, cle: 'prix', valeur: 21.6 },
      { rang: 0, cle: 'indice', valeur: 108 },
      { rang: 1, cle: 'prix', valeur: 20.52 },
      { rang: 1, cle: 'indice', valeur: 102.6 },
      { rang: 2, cle: 'prix', valeur: 21.34 },
      { rang: 2, cle: 'indice', valeur: 106.7 },
      { rang: 3, cle: 'prix', valeur: 20.7 },
      { rang: 3, cle: 'indice', valeur: 103.5 },
    ];

    const verdict = await sut.execute({
      ...commande,
      questionId: TABLEAU,
      valeur: { type: 'tableau', saisies },
    });

    expect(verdict.details).toHaveLength(LIGNES_DU_TABLEAU * 2);
    expect(verdict.correcte).toBe(true);
    expect(verdict.score).toBe(1);
  });

  it('enregistre le score et le détail servis au pupitre', async () => {
    await sut.execute(commande);

    expect(answers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        questionId: FEUILLE,
        concept: 'tableur',
        score: 1,
      }),
    );
  });
});
