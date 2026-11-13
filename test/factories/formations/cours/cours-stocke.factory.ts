import type {
  ContenuDeCoursBrut,
  EcranDeCoursBrut,
} from '../../../../src/modules/formations/domain/cours/stockage/CoursStocke';
import { buildReflexion } from './presentation-visuelle.factory';

const ECRAN_DE_REFLEXION = 'B2-01-S03-PREDICTION';

function proprietesParDefaut(): Record<string, unknown> {
  return {
    presentation: {
      version: 2,
      screenId: ECRAN_DE_REFLEXION,
      renderer: 'reflection',
      props: { promptData: buildReflexion() },
    },
    correction: {
      expected: 'Les valeurs, l’unité et l’échelle.',
      nextAction: 'Lire l’axe avant de conclure.',
    },
  };
}

export function buildEcranStocke(
  overrides: Partial<EcranDeCoursBrut> = {},
): EcranDeCoursBrut {
  return {
    screenId: ECRAN_DE_REFLEXION,
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
