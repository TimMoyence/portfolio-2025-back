import type {
  ContenuDeCoursBrut,
  EcranDeCoursBrut,
} from '../../src/modules/formations/domain/cours/CoursStocke';
import { buildQuizAffiche } from './presentation-visuelle.factory';

const ECRAN_QUIZ = 'B2-01-S03-PREDICTION';

export function buildQuizNote(
  overrides: Readonly<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    ...buildQuizAffiche(),
    concept: 'proportion',
    optionIds: ['o1', 'o2', 'o3'],
    correctIndex: 0,
    confusions: ['raisonnement-additif', 'taux-valeur-facteur-cent'],
    noteCompte: true,
    context: 'Avant de commenter la pente, vérifiez le repère.',
    explanation: 'Les valeurs, l’unité et l’échelle.',
    nextAction: 'Le prochain écran montre le piège de l’échelle.',
    ...overrides,
  };
}

function proprietesParDefaut(): Record<string, unknown> {
  return {
    presentation: {
      version: 2,
      screenId: ECRAN_QUIZ,
      renderer: 'quiz',
      props: { questionData: buildQuizAffiche() },
    },
    interaction: buildQuizNote(),
    guide: {
      aDire: 'Avant de commenter la pente, vérifiez le repère.',
      reponse: 'Les valeurs, l’unité et l’échelle.',
    },
    correction: {
      correctIndex: 0,
      explanation: 'Une forme ne suffit jamais.',
      nextAction: 'Lire l’axe avant de conclure.',
    },
  };
}

export function buildEcranStocke(
  overrides: Partial<EcranDeCoursBrut> = {},
): EcranDeCoursBrut {
  return {
    screenId: ECRAN_QUIZ,
    brique: 'fp-story',
    dureeMinutes: 3,
    concepts: ['proportion'],
    notes: 'À dire : vérifier le repère avant la pente.',
    proprietes: proprietesParDefaut(),
    ...overrides,
  };
}

export function buildEcranStockeAvec(
  proprietes: Readonly<Record<string, unknown>>,
): EcranDeCoursBrut {
  return buildEcranStocke({
    proprietes: { ...proprietesParDefaut(), ...proprietes },
  });
}

export function buildCoursStocke(
  overrides: Partial<ContenuDeCoursBrut> = {},
): ContenuDeCoursBrut {
  return {
    slug: 'b2-01-traitement-information-chiffree',
    version: 2,
    titre: 'Lire et contrôler l’information chiffrée',
    niveau: 'B2',
    dureeMinutes: 3,
    concepts: ['proportion'],
    ecrans: [buildEcranStocke()],
    ...overrides,
  };
}
