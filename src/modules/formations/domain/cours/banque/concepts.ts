export const CONCEPTS_DU_B2_01 = [
  'proportion',
  'pourcentage',
  'taux-evolution',
  'coefficient-multiplicateur',
  'evolutions-successives',
  'evolution-reciproque',
  'taux-moyen',
  'indice-base-100',
  'point-de-pourcentage',
  'moyenne-ponderee',
  'lecture-graphique',
  'controle-coherence',
  'contrat-de-lecture',
  'tableur',
] as const;

export const CONCEPTS_DU_B2_02 = [
  'serie-statistique',
  'moyenne',
  'mediane',
  'quartiles',
  'dispersion',
  'ecart-type',
  'boite-a-moustaches',
  'histogramme',
  'choix-du-resume',
  'nuage-de-points',
  'correlation',
  'ajustement-affine',
  'prevision',
] as const;

export const CONCEPTS_DU_B2_03 = [
  'proposition',
  'connecteur',
  'negation',
  'quantificateur',
] as const;

export const CONCEPTS_DU_B2_04 = [
  'suite-arithmetique',
  'suite-geometrique',
  'algorithme-de-seuil',
  'somme-de-termes',
] as const;

export const CONCEPTS_DU_B2_05 = [
  'interets-composes',
  'valeur-actuelle',
  'annuites',
  'tableau-d-amortissement',
  'cout-du-credit',
] as const;

export const CONCEPTS = [
  ...CONCEPTS_DU_B2_01,
  ...CONCEPTS_DU_B2_02,
  ...CONCEPTS_DU_B2_03,
  ...CONCEPTS_DU_B2_04,
  ...CONCEPTS_DU_B2_05,
] as const;

export type ConceptId = (typeof CONCEPTS)[number];

const LIBELLES_DES_CONCEPTS: Readonly<Record<ConceptId, string>> = {
  proportion: 'Proportion',
  pourcentage: 'Pourcentage',
  'taux-evolution': 'Taux d’évolution',
  'coefficient-multiplicateur': 'Coefficient multiplicateur',
  'evolutions-successives': 'Évolutions successives',
  'evolution-reciproque': 'Évolution réciproque',
  'taux-moyen': 'Taux moyen',
  'indice-base-100': 'Indice base 100',
  'point-de-pourcentage': 'Point de pourcentage',
  'moyenne-ponderee': 'Moyenne pondérée',
  'lecture-graphique': 'Lecture de graphique',
  'controle-coherence': 'Contrôle de cohérence',
  'contrat-de-lecture': 'Contrat de lecture d’un chiffre',
  tableur: 'Tableur',
  'serie-statistique': 'Série statistique',
  moyenne: 'Moyenne',
  mediane: 'Médiane',
  quartiles: 'Quartiles',
  dispersion: 'Dispersion',
  'ecart-type': 'Écart-type',
  'boite-a-moustaches': 'Boîte à moustaches',
  histogramme: 'Histogramme',
  'choix-du-resume': 'Choix du résumé statistique',
  'nuage-de-points': 'Nuage de points',
  correlation: 'Corrélation',
  'ajustement-affine': 'Ajustement affine',
  prevision: 'Prévision',
  proposition: 'Proposition logique',
  connecteur: 'Connecteurs ET, OU',
  negation: 'Négation',
  quantificateur: 'Quantificateurs',
  'suite-arithmetique': 'Suite arithmétique',
  'suite-geometrique': 'Suite géométrique',
  'algorithme-de-seuil': 'Algorithme de seuil',
  'somme-de-termes': 'Somme de termes',
  'interets-composes': 'Intérêts composés',
  'valeur-actuelle': 'Valeur actuelle',
  annuites: 'Suite d’annuités',
  'tableau-d-amortissement': 'Tableau d’amortissement',
  'cout-du-credit': 'Coût du crédit',
};

export function libelleDeConcept(id: string): string {
  return Object.hasOwn(LIBELLES_DES_CONCEPTS, id)
    ? LIBELLES_DES_CONCEPTS[id as ConceptId]
    : id;
}
