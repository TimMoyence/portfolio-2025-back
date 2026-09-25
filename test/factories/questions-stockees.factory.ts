import type {
  NumeriqueStockee,
  OptionStockee,
  VoteStockee,
} from '../../src/modules/formations/domain/contrats/cours';
import { slugOption } from '../../src/modules/formations/domain/cours/QuestionStockee';

export function buildOptionStockee(
  libelle: string,
  confusion: OptionStockee['confusion'],
): OptionStockee {
  return { id: slugOption(libelle), libelle, confusion };
}

export function buildVoteStocke(
  overrides: Partial<VoteStockee> = {},
): VoteStockee {
  return {
    type: 'vote',
    id: 'b2-01-a1-diagnostic',
    concept: 'taux-evolution',
    noteCompte: true,
    enonce:
      'Le prix d’une réparation de voile passe de 80 € à 100 €. De quel pourcentage a-t-il augmenté ?',
    options: [
      buildOptionStockee('+25 %', null),
      buildOptionStockee('+20 %', 'base-arrivee'),
      buildOptionStockee('+20 €', 'ecart-absolu-au-lieu-du-taux'),
      buildOptionStockee('+125 %', 'coefficient-confondu-avec-taux'),
    ],
    segments: [],
    ...overrides,
  };
}

export function buildRappelDeCompensation(
  juste = 'Non : deux erreurs se compensent',
  piege = 'Oui : le total concorde',
  overrides: Partial<VoteStockee> = {},
): VoteStockee {
  return buildVoteStocke({
    id: 'b2-01-r-compensation',
    concept: 'controle-coherence',
    noteCompte: false,
    enonce: 'Peut-on valider chaque écriture ?',
    options: [
      buildOptionStockee(juste, null),
      buildOptionStockee(piege, 'total-concordant-vaut-preuve'),
    ],
    ...overrides,
  });
}

export function buildNumeriqueStockee(
  overrides: Partial<NumeriqueStockee> = {},
): NumeriqueStockee {
  return {
    type: 'numeric',
    id: 'b2-01-a2-part-marketplace',
    concept: 'proportion',
    noteCompte: true,
    enonce:
      'En 2025, la marketplace réalise 523 000 € d’un CA HT total de 1 150 000 €. Quelle part du CA représente-t-elle ? Réponse en %, arrondie au dixième.',
    unite: '%',
    solution: 45.478261,
    tolerance: { type: 'absolue', valeur: 0.05 },
    formePubliee: '45,5',
    pieges: [
      { valeur: 0.454783, confusion: 'taux-valeur-facteur-cent' },
      { valeur: 219.885277, confusion: 'base-inversee' },
    ],
    ...overrides,
  };
}
