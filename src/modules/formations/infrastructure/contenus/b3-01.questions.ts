import type { AuMoinsUnModifiable } from '../../../../common/domain/au-moins-un';
import type { ConceptId } from '../../domain/cours/banque/concepts';
import type { ConfusionId } from '../../domain/cours/banque/confusions';
import {
  PIEGES_B3_01,
  type QuestionChiffreeB301,
  TOLERANCES_B3_01,
  VALEURS_B3_01,
} from './b3-01.donnees';
import * as moteur from './briques';

type UniteDeSaisie =
  | '€'
  | '%'
  | 'lignes'
  | 'villes'
  | 'jours ouvrés'
  | 'agences';

const CONSIGNES_DE_SAISIE: Readonly<Record<UniteDeSaisie, string>> = {
  '€': 'En euros, sans le symbole, arrondi à l’euro.',
  '%': 'En %, sans le symbole, arrondi au dixième de point.',
  lignes: 'Saisissez un nombre entier.',
  villes: 'Saisissez un nombre entier.',
  'jours ouvrés': 'Saisissez un nombre entier.',
  agences: 'Saisissez un nombre entier.',
};

function formePubliee(valeur: number, unite: UniteDeSaisie): string {
  return `${moteur.nombreFrancais(valeur, unite === '%' ? 1 : 0)} ${unite}`;
}

function valeurDuPiege(
  id: QuestionChiffreeB301,
  confusion: ConfusionId,
): readonly [number, ConfusionId] {
  const valeur = PIEGES_B3_01[id][confusion];
  if (valeur === undefined) {
    throw new Error(`le piège ${confusion} n’est pas calculé pour ${id}`);
  }
  return [valeur, confusion];
}

export function questionChiffree(
  id: QuestionChiffreeB301,
  concept: ConceptId,
  question: string,
  unite: UniteDeSaisie,
  confusions: AuMoinsUnModifiable<ConfusionId>,
) {
  const [premiere, ...suite] = confusions;
  return moteur.numerique(
    id,
    concept,
    `${question} ${CONSIGNES_DE_SAISIE[unite]}`,
    unite,
    VALEURS_B3_01[id],
    { type: 'absolue', valeur: TOLERANCES_B3_01[id] },
    formePubliee(VALEURS_B3_01[id], unite),
    [
      valeurDuPiege(id, premiere),
      ...suite.map((confusion) => valeurDuPiege(id, confusion)),
    ],
  );
}
