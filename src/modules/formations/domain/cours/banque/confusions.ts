import type { ConceptId } from './concepts';

interface DefinitionConfusion {
  readonly concept: ConceptId;
  readonly libelle: string;
}

export const CONFUSIONS = {
  'hausse-baisse-symetriques': {
    concept: 'evolutions-successives',
    libelle:
      'Croire qu’une hausse puis une baisse du même pourcentage ramènent à la valeur de départ.',
  },
  'taux-successifs-additionnes': {
    concept: 'evolutions-successives',
    libelle:
      'Additionner des taux successifs au lieu de multiplier les coefficients.',
  },
  'reciproque-meme-taux': {
    concept: 'evolution-reciproque',
    libelle:
      'Croire que le même pourcentage en sens inverse suffit pour revenir au départ.',
  },
  'base-arrivee': {
    concept: 'taux-evolution',
    libelle:
      'Diviser l’écart par la valeur d’arrivée au lieu de la valeur de départ.',
  },
  'ecart-absolu-au-lieu-du-taux': {
    concept: 'taux-evolution',
    libelle: 'Donner l’écart en valeur au lieu du taux en pourcentage.',
  },
  'coefficient-confondu-avec-taux': {
    concept: 'coefficient-multiplicateur',
    libelle:
      'Confondre le coefficient multiplicateur 1,15 avec le taux de 15 %.',
  },
  'taux-valeur-facteur-cent': {
    concept: 'pourcentage',
    libelle:
      'Confondre le taux 70 % et la valeur 0,7 : le résultat est décalé d’un facteur 100.',
  },
  'raisonnement-additif': {
    concept: 'proportion',
    libelle:
      'Ajouter un écart constant là où la situation est proportionnelle.',
  },
} as const satisfies Readonly<Record<string, DefinitionConfusion>>;

export type ConfusionId = keyof typeof CONFUSIONS;

export function libelleDeConfusion(id: string): string | null {
  return Object.hasOwn(CONFUSIONS, id)
    ? CONFUSIONS[id as ConfusionId].libelle
    : null;
}
