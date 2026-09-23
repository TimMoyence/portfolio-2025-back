import { buildCoursDeTest } from '../../../../../test/factories/cours.factory';
import {
  buildCorrectionDeReponses,
  buildCorrectionDExemple,
  buildCoursDeBriques,
  buildEcranDeBrique,
} from '../../../../../test/factories/ecrans-stockes.factory';
import { lireCoursStocke } from './CoursStocke';
import {
  correctionServie,
  ecranVerrouille,
  exempleAuRythmeDuPilotage,
  projeterCatalogue,
} from './Diffusion';
import { tirer } from './Tirage';

describe('ecranVerrouille', () => {
  it('ne garde que l identifiant, le titre et la durée', () => {
    const [ecran] = tirer(buildCoursDeTest(), 3).sujet.ecrans;

    expect(ecranVerrouille({ ...ecran, titre: 'Rappel' })).toEqual({
      id: ecran.id,
      type: 'ecran-verrouille',
      titre: 'Rappel',
      duree: ecran.duree,
      interactif: false,
      donnees: {},
    });
  });

  it('SEC-1 · garde l écran corrigé d une correction verrouillée', () => {
    const [ecran] = tirer(buildCoursDeTest(), 3).sujet.ecrans;

    expect(
      ecranVerrouille({ ...ecran, ecranCorrige: 'B2-01-A2-06-POINTS' }),
    ).toMatchObject({
      type: 'ecran-verrouille',
      ecranCorrige: 'B2-01-A2-06-POINTS',
    });
  });
});

describe('projeterCatalogue (B19)', () => {
  it('sert en clair les écrans du catalogue et verrouille les écrans de séance', () => {
    const cours = lireCoursStocke(
      buildCoursDeBriques([
        buildEcranDeBrique('fp-quote', { diffusion: 'catalogue' }),
        buildEcranDeBrique('fp-recall'),
      ]),
    );
    const sujet = tirer(cours, 0).sujet;

    expect(projeterCatalogue(cours)).toEqual({
      ...sujet,
      ecrans: [sujet.ecrans[0], ecranVerrouille(sujet.ecrans[1])],
    });
  });

  it('sert en clair toute version historique, lue en diffusion catalogue', () => {
    const cours = buildCoursDeTest();

    expect(projeterCatalogue(cours)).toEqual(tirer(cours, 0).sujet);
  });
});

describe('exemple corrigé au rythme du pilotage', () => {
  const EXERCICE = buildEcranDeBrique('fp-worked', {
    screenId: 'B2-01-A2-06-POINTS',
  });
  const cours = lireCoursStocke(
    buildCoursDeBriques([EXERCICE, buildCorrectionDExemple(EXERCICE.screenId)]),
  );
  const corrige = tirer(cours, 0).sujet.ecrans[1];

  it('garde pilote et écran corrigé, raisonnements masqués avant l étayage', () => {
    const servi = exempleAuRythmeDuPilotage(corrige, undefined);

    expect(servi.donnees).toMatchObject({
      pilote: true,
      corrigeDe: 'B2-01-A2-06-POINTS',
      etayage: 0,
      exemple: { etapes: [{ raisonnement: '' }] },
    });
  });

  it('dévoile les étapes que le formateur a corrigées', () => {
    const servi = exempleAuRythmeDuPilotage(corrige, { etayage: 1 });

    expect(servi.donnees).toMatchObject({
      pilote: true,
      etayage: 1,
      exemple: { etapes: [{ raisonnement: '25,30 − 27,60 = −2,30 points.' }] },
    });
  });
});

describe('correctionServie', () => {
  const QUESTIONNAIRE = buildEcranDeBrique('questionnaire', {
    screenId: 'B2-01-A2-03-ATELIER-1',
  });
  const cours = lireCoursStocke(
    buildCoursDeBriques([
      QUESTIONNAIRE,
      buildCorrectionDeReponses(QUESTIONNAIRE.screenId),
      buildEcranDeBrique('fp-cardsort'),
      buildCorrectionDeReponses(
        'B2-01-A1-01-FP-CARDSORT',
        'B2-01-A1-01-CORRECTION-TRI',
      ),
    ]),
  );
  const tirage = tirer(cours, 4);

  it('sert les bonnes réponses du tirage du participant', () => {
    const correction = correctionServie(cours, cours.ecrans[1], tirage);

    expect(correction).toEqual({
      ecranId: 'B2-01-A2-03-ATELIER-1',
      questions: [
        {
          questionId: 'b2-01-a2-evolution-marge',
          bonneReponse:
            tirage.corriges['b2-01-a2-evolution-marge'].bonneReponse,
          optionId: tirage.solutions['b2-01-a2-evolution-marge'].valeur,
        },
        {
          questionId: 'b2-01-a2-part-marketplace',
          bonneReponse:
            tirage.corriges['b2-01-a2-part-marketplace'].bonneReponse,
          optionId: null,
        },
      ],
      corrige: null,
      reflexion: null,
    });
  });

  it('sert le corrigé d une production', () => {
    expect(
      correctionServie(cours, cours.ecrans[3], tirage)?.corrige?.type,
    ).toBe('classement');
  });

  it('ne sert rien pour un écran qui n est pas une correction', () => {
    expect(correctionServie(cours, cours.ecrans[0], tirage)).toBeNull();
  });
});
