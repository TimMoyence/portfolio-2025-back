import { CONCEPTS_DU_B3_01 } from '../../domain/cours/banque/concepts';
import type { ContenuDeCours } from '../../domain/cours/CoursStocke';
import { ACTE_1 } from './b3-01.acte-1';
import { ACTE_2 } from './b3-01.acte-2';
import { ACTE_3 } from './b3-01.acte-3';
import * as moteur from './briques';

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  'reference-absolue-ignoree': 'B3-01-A2-03-COURS-CHERCHER-AGREGER',
  'identifiant-pris-pour-nombre': 'B3-01-A1-05-COURS-DONNEE',
  'lignes-comptees-pour-commandes': 'B3-01-A1-05-COURS-DONNEE',
  'commandes-comptees-pour-lignes': 'B3-01-A1-05-COURS-DONNEE',
  'type-de-variable-confondu': 'B3-01-A1-05-COURS-DONNEE',
  'libelle-pris-pour-cle': 'B3-01-A1-06-COURS-RELATIONS',
  'cle-prise-pour-categorie': 'B3-01-A1-06-COURS-RELATIONS',
  'part-douteuse-estimee-sans-mesure': 'B3-01-A1-10-COURS-GRILLE',
  'suspect-corrige-sans-validation': 'B3-01-A1-10-COURS-GRILLE',
  'correction-certaine-renvoyee-a-un-humain': 'B3-01-A1-10-COURS-GRILLE',
  'suppression-au-lieu-de-signalement': 'B3-01-A1-10-COURS-GRILLE',
  'texte-pris-pour-nombre': 'B3-01-A1-11-COURS-OUTILS',
  'casse-non-normalisee': 'B3-01-A1-11-COURS-OUTILS',
  'espaces-non-supprimes': 'B3-01-A1-11-COURS-OUTILS',
  'doublons-supprimes-sur-une-colonne': 'B3-01-A1-11-COURS-OUTILS',
  'famille-de-probleme-mal-nommee': 'B3-01-A2-02-FAMILLES',
  'plage-recherche-non-figee': 'B3-01-A2-03-COURS-CHERCHER-AGREGER',
  'critere-mal-ecrit': 'B3-01-A2-03-COURS-CHERCHER-AGREGER',
  'periode-mal-delimitee': 'B3-01-A2-03-COURS-CHERCHER-AGREGER',
  'jours-calendaires-pour-ouvres': 'B3-01-A2-06-COURS-TEMPS-STATS',
  'bornes-comptees-dans-le-delai': 'B3-01-A2-06-COURS-TEMPS-STATS',
  'valeur-extreme-ignoree': 'B3-01-A2-06-COURS-TEMPS-STATS',
  'moyenne-simple-des-taux': 'B3-01-A2-06-COURS-TEMPS-STATS',
  'marque-confondue-avec-marge': 'B3-01-A2-06-COURS-TEMPS-STATS',
  'plage-fixe-au-lieu-de-tableau': 'B3-01-A2-09-COURS-TCD',
  'pourcentage-du-mauvais-total': 'B3-01-A2-09-COURS-TCD',
  'tcd-filtre-ou-dates-mal-groupees': 'B3-01-A2-09-COURS-TCD',
  'graphique-sans-question': 'B3-01-A3-03-COURS-GRAPHIQUES',
  'axe-tronque-lu-comme-ecart': 'B3-01-A3-03-COURS-GRAPHIQUES',
  'objectif-annuel-pour-cumul': 'B3-01-A3-07-COURS-DASHBOARD',
  'evolution-sur-annee-pleine': 'B3-01-A3-07-COURS-DASHBOARD',
  'kpi-sans-contexte': 'B3-01-A3-07-COURS-DASHBOARD',
  'detail-au-lieu-de-synthese': 'B3-01-A3-07-COURS-DASHBOARD',
};

export const COURS_B3_01 = moteur.coursB3(
  [ACTE_1, ACTE_2, ACTE_3],
  REMEDIATIONS,
  [],
  {
    slug: 'b3-01-donnee-brute-decision',
    titre: 'Expert Data : de la donnée brute à la décision',
    gabarit: 'b3',
    dureeMinutes: 180,
    concepts: [...CONCEPTS_DU_B3_01],
  },
);
