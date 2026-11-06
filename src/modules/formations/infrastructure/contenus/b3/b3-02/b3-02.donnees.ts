import type { AuMoinsUnModifiable } from '../../../../../../common/domain/objets/au-moins-un';
import type { ConceptId } from '../../../../domain/cours/banque/concepts';
import type { ConfusionId } from '../../../../domain/cours/banque/confusions';
import {
  PIEGES_B3_01,
  type QuestionChiffreeB301,
  VALEURS_B3_01,
} from '../b3-01/b3-01.donnees';
import {
  questionChiffreeDe,
  type UniteDeSaisie,
} from '../b3-01/b3-01.questions';

export const SOURCES_B3_02 = {
  'b3-02-a1-lignes-uniques': 'b3-01-a1-lignes-uniques',
  'b3-02-a1-ca-total': 'b3-01-a1-ca-total',
  'b3-02-a1-a-verifier': 'b3-01-a1-a-verifier',
  'b3-02-a1-ca-rennes-info': 'b3-01-a2-ca-rennes-info',
  'b3-02-a1-ca-ouest': 'b3-01-a2-ca-ouest',
  'b3-02-a2-delai-strasbourg': 'b3-01-a2-delai-strasbourg',
  'b3-02-a2-retards': 'b3-01-a2-retards',
  'b3-02-a2-part-info-rennes': 'b3-01-a2-part-info-rennes',
  'b3-02-a2-agences-sous-objectif': 'b3-01-a3-agences-sous-objectif',
  'b3-02-a2-atteinte-rennes': 'b3-01-a3-atteinte-rennes',
  'b3-02-a2-evolution': 'b3-01-a3-evolution',
  'b3-02-a2-ca-2026': 'b3-01-a3-ca-2026',
  'b3-02-a2-marge-marseille': 'b3-01-a3-marge-marseille',
} as const satisfies Readonly<Record<string, QuestionChiffreeB301>>;

export type QuestionChiffreeB302 = keyof typeof SOURCES_B3_02;

export const MEILLEUR_TRIMESTRE_B3_02 = 'b3-02-a2-meilleur-trimestre';

function selonLaSource<V>(
  lire: (source: QuestionChiffreeB301) => V,
): Readonly<Record<QuestionChiffreeB302, V>> {
  return Object.fromEntries(
    Object.entries(SOURCES_B3_02).map(([id, source]) => [id, lire(source)]),
  ) as Record<QuestionChiffreeB302, V>;
}

export const VALEURS_B3_02: Readonly<Record<string, number | string>> = {
  ...selonLaSource((source) => VALEURS_B3_01[source]),
  [MEILLEUR_TRIMESTRE_B3_02]: VALEURS_B3_01['b3-01-a2-meilleur-trimestre'],
};

export const PIEGES_B3_02: Readonly<
  Record<QuestionChiffreeB302, Readonly<Partial<Record<ConfusionId, number>>>>
> = selonLaSource((source) => PIEGES_B3_01[source]);

export function questionChiffreeB302(
  id: QuestionChiffreeB302,
  concept: ConceptId,
  question: string,
  unite: UniteDeSaisie,
  confusions: AuMoinsUnModifiable<ConfusionId>,
) {
  return questionChiffreeDe(
    SOURCES_B3_02[id],
    id,
    concept,
    question,
    unite,
    confusions,
  );
}
