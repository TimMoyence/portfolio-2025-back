import { libelleOuCle } from '../../../../../common/domain/objets/libelle-ou-cle';

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

export const CONCEPTS_DU_B2_06 = [
  'fonction-exponentielle',
  'logarithme-neperien',
  'resolution-par-logarithme',
  'ajustement-exponentiel',
] as const;

export const CONCEPTS_DU_B3_01 = [
  'reference-de-cellule',
  'jeu-de-donnees',
  'cle-et-relation',
  'granularite',
  'qualite-des-donnees',
  'nettoyage',
  'recherche-dans-une-table',
  'agregation-conditionnelle',
  'calcul-sur-dates',
  'indicateur-statistique',
  'tableau-croise-dynamique',
  'choix-du-graphique',
  'tableau-de-bord',
] as const;

export const CONCEPTS_DU_B3_02 = ['ia-analyste'] as const;

export const CONCEPTS_DU_B3_03 = [
  'texte-brut',
  'mise-en-forme-des-caracteres',
  'styles-et-theme',
  'mise-en-forme-des-paragraphes',
  'mise-en-page',
  'export-pdf',
  'ia-redactrice',
] as const;

export const CONCEPTS_DU_B3_04 = [
  'source-de-publipostage',
  'champ-de-fusion',
  'regle-de-fusion',
  'fusion-et-pdf',
  'e-mailing',
] as const;

export const CONCEPTS_DU_B2_07 = [
  'fonction-derivee',
  'variations-d-une-fonction',
  'optimisation',
] as const;

const CONCEPTS_DU_B2_08 = [
  'derivees-composees',
  'fonctions-economiques',
  'resolution-approchee',
] as const;

const CONCEPTS_DU_B2_09 = [
  'probabilite-d-un-evenement',
  'probabilite-conditionnelle',
  'probabilites-totales',
  'independance',
] as const;

export const CONCEPTS = [
  ...CONCEPTS_DU_B2_01,
  ...CONCEPTS_DU_B2_02,
  ...CONCEPTS_DU_B2_03,
  ...CONCEPTS_DU_B2_04,
  ...CONCEPTS_DU_B2_05,
  ...CONCEPTS_DU_B2_06,
  ...CONCEPTS_DU_B3_01,
  ...CONCEPTS_DU_B3_02,
  ...CONCEPTS_DU_B3_03,
  ...CONCEPTS_DU_B3_04,
  ...CONCEPTS_DU_B2_07,
  ...CONCEPTS_DU_B2_08,
  ...CONCEPTS_DU_B2_09,
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
  'fonction-exponentielle': 'Fonction exponentielle',
  'logarithme-neperien': 'Logarithme népérien',
  'resolution-par-logarithme': 'Résolution par le logarithme',
  'ajustement-exponentiel': 'Ajustement exponentiel',
  'reference-de-cellule': 'Référence de cellule',
  'jeu-de-donnees': 'Jeu de données',
  'cle-et-relation': 'Clé et relation entre tables',
  granularite: 'Granularité',
  'qualite-des-donnees': 'Qualité des données',
  nettoyage: 'Nettoyage des données',
  'recherche-dans-une-table': 'Recherche dans une table',
  'agregation-conditionnelle': 'Agrégation conditionnelle',
  'calcul-sur-dates': 'Calcul sur des dates',
  'indicateur-statistique': 'Indicateur statistique',
  'tableau-croise-dynamique': 'Tableau croisé dynamique',
  'choix-du-graphique': 'Choix du graphique',
  'tableau-de-bord': 'Tableau de bord',
  'ia-analyste': 'IA analyste de données',
  'texte-brut': 'Importer et nettoyer un texte brut',
  'mise-en-forme-des-caracteres': 'Mise en forme des caractères',
  'styles-et-theme': 'Styles et thème',
  'mise-en-forme-des-paragraphes': 'Mise en forme des paragraphes',
  'mise-en-page': 'Mise en page et numérotation',
  'export-pdf': 'Export en PDF',
  'ia-redactrice': 'IA rédactrice',
  'source-de-publipostage': 'Lettre type et liste des destinataires',
  'champ-de-fusion': 'Champs de fusion',
  'regle-de-fusion': 'Filtres et règles de fusion',
  'fusion-et-pdf': 'Fusion et PDF',
  'e-mailing': 'E-mailing',
  'fonction-derivee': 'Fonction dérivée',
  'variations-d-une-fonction': 'Variations d’une fonction',
  optimisation: 'Optimisation',
  'derivees-composees':
    'Dérivées d’un produit, d’un quotient, de e^u et de ln u',
  'fonctions-economiques': 'Coûts, recette, offre et demande',
  'resolution-approchee': 'Solutions approchées de f(x) = k',
  'probabilite-d-un-evenement': 'Probabilité d’un événement',
  'probabilite-conditionnelle': 'Probabilité conditionnelle P_A(B)',
  'probabilites-totales': 'Probabilités totales',
  independance: 'Indépendance de deux événements',
};

export const libelleDeConcept = (id: string): string =>
  libelleOuCle(LIBELLES_DES_CONCEPTS, id);
