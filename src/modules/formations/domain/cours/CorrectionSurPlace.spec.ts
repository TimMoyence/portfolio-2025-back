import {
  buildCorrigeSurPlace,
  buildCoursDeBriques,
  buildEcranDeBrique,
  buildQuestionnaireCorrigeSurPlace,
  EXPLICATIONS_SUR_PLACE,
} from '../../../../../test/factories/ecrans-stockes.factory';
import {
  PhaseFermeeError,
  PhaseNonMonotoneError,
  PilotageIncompatibleError,
} from '../errors/FormationErrors';
import {
  assertQuestionNonCorrigee,
  correctionsRevelables,
  demandeDeCorrection,
} from './CorrectionSurPlace';
import { lireCoursStocke } from './CoursStocke';
import { correctionSurPlaceServie } from './Diffusion';
import { assertPilotageCompatible, fusionnerPilotage } from './PilotageEcrans';
import { tirer } from './Tirage';

describe('correction sur place', () => {
  const cours = lireCoursStocke(
    buildCoursDeBriques([
      buildQuestionnaireCorrigeSurPlace(),
      buildCorrigeSurPlace(
        'fp-challenge',
        [{ reference: 'rang', texte: 'Le rang remplace l’année.' }],
        { screenId: 'B2-01-A3-01-DEFI' },
      ),
      buildEcranDeBrique('fp-numeric'),
    ]),
  );
  const [questionnaire, defi, sansCorrection] = cours.ecrans;
  const tirage = tirer(cours, 4);
  const [premiere, seconde] = EXPLICATIONS_SUR_PLACE;

  it('lit les explications stockées sur l écran', () => {
    expect(questionnaire.correctionSurPlace?.explications).toEqual(
      EXPLICATIONS_SUR_PLACE,
    );
  });

  it('ne projette jamais les explications dans le sujet', () => {
    expect(JSON.stringify(tirage.sujet)).not.toContain(premiere.texte);
    expect(JSON.stringify(tirage.sujet)).not.toContain('correctionSurPlace');
  });

  it('compte une correction par explication', () => {
    expect(correctionsRevelables(questionnaire)).toBe(2);
    expect(correctionsRevelables(sansCorrection)).toBeNull();
  });

  it('ne sert rien avant la première correction', () => {
    expect(
      correctionSurPlaceServie(questionnaire, tirage, undefined),
    ).toBeNull();
  });

  it('sert la bonne réponse et l explication des seules questions corrigées', () => {
    const servie = correctionSurPlaceServie(questionnaire, tirage, {
      explicationsDevoilees: 1,
    });

    expect(servie?.questions.map((question) => question.questionId)).toEqual([
      premiere.reference,
    ]);
    expect(servie?.explications).toEqual([premiere]);
  });

  it('sert toutes les corrections d un écran révélé', () => {
    const servie = correctionSurPlaceServie(questionnaire, tirage, {
      revele: true,
    });

    expect(servie?.questions).toHaveLength(2);
    expect(servie?.explications).toEqual([premiere, seconde]);
  });

  it('refuse une réponse à une question déjà corrigée, pas aux suivantes', () => {
    const pilotage = { [questionnaire.id]: { explicationsDevoilees: 1 } };

    expect(() =>
      assertQuestionNonCorrigee(pilotage, questionnaire, premiere.reference),
    ).toThrow(PhaseFermeeError);
    expect(() =>
      assertQuestionNonCorrigee(pilotage, questionnaire, seconde.reference),
    ).not.toThrow();
  });

  it('ferme tout l écran d un autre exercice dès sa première correction', () => {
    expect(
      demandeDeCorrection(defi, {
        screenId: defi.id,
        explicationsDevoilees: 1,
      }),
    ).toEqual({ screenId: defi.id, explicationsDevoilees: 1, revele: true });
  });

  it('ne ferme le questionnaire qu à sa dernière correction', () => {
    const demande = (explicationsDevoilees: number) =>
      demandeDeCorrection(questionnaire, {
        screenId: questionnaire.id,
        explicationsDevoilees,
      });

    expect(demande(1)).toEqual({
      screenId: questionnaire.id,
      explicationsDevoilees: 1,
    });
    expect(demande(2)).toMatchObject({ revele: true });
  });

  it('refuse de corriger un écran sans correction sur place ou au-delà de ses explications', () => {
    expect(() =>
      assertPilotageCompatible(sansCorrection, {
        screenId: sansCorrection.id,
        explicationsDevoilees: 1,
      }),
    ).toThrow(PilotageIncompatibleError);
    expect(() =>
      assertPilotageCompatible(questionnaire, {
        screenId: questionnaire.id,
        explicationsDevoilees: 3,
      }),
    ).toThrow(PilotageIncompatibleError);
    expect(() =>
      assertPilotageCompatible(questionnaire, {
        screenId: questionnaire.id,
        explicationsDevoilees: 2,
      }),
    ).not.toThrow();
  });

  it('ne revient jamais sur une correction révélée', () => {
    const courant = fusionnerPilotage(
      {},
      { screenId: questionnaire.id, explicationsDevoilees: 2 },
    );

    expect(() =>
      fusionnerPilotage(courant, {
        screenId: questionnaire.id,
        explicationsDevoilees: 1,
      }),
    ).toThrow(PhaseNonMonotoneError);
  });
});
