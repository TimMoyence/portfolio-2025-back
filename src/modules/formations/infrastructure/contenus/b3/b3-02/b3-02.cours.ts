import {
  CONCEPTS_DU_B3_01,
  CONCEPTS_DU_B3_02,
} from '../../../../domain/cours/banque/concepts';
import type { ContenuDeCours } from '../../../../domain/cours/stockage/CoursStocke';
import { GRAVURE_DE_L_ACCROCHE } from '../b3-01/b3-01.acte-1';
import { ACTE_1 } from './b3-02.acte-1';
import { ACTE_2 } from './b3-02.acte-2';
import { ACTE_3 } from './b3-02.acte-3';
import { MEDIAS_DES_INFOGRAPHIES } from './b3-02.briques';
import * as moteur from '../../briques';

const CONTROLE = 'B3-02-A1-07-FORMULES-CONTROLE';
const TEXTE = 'B3-02-A1-05-FORMULES-TEXTE';
const SOMME_SI = 'B3-02-A1-11-FORMULES-SOMME-SI';
const RECHERCHE = 'B3-02-A1-10-FORMULE-RECHERCHE';
const JOURS_OUVRES = 'B3-02-A2-02-FORMULES-JOURS-OUVRES';
const MEDIANE = 'B3-02-A2-04-FORMULES-MEDIANE';
const TCD = 'B3-02-A2-08-OUTIL-TCD';
const GRAPHIQUES = 'B3-02-A2-12-OUTIL-GRAPHIQUES';
const RATIOS = 'B3-02-A2-15-FORMULES-RATIOS';
const TABLEAU_DE_BORD = 'B3-02-A2-16-OUTIL-TABLEAU-DE-BORD';
const CAHIER_DE_REGLES = 'B3-02-A3-03-COURS-CAHIER-DE-REGLES';

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  'suspect-corrige-sans-validation': CONTROLE,
  'donnee-douteuse-jugee-fausse': CONTROLE,
  'correction-certaine-renvoyee-a-un-humain': CONTROLE,
  'erreur-certaine-jugee-douteuse': CONTROLE,
  'controle-apres-correction': CONTROLE,
  'espaces-non-supprimes': TEXTE,
  'doublons-supprimes-sur-une-colonne': TEXTE,
  'en-tete-compte-comme-ligne': TEXTE,
  'texte-pris-pour-nombre': 'B3-02-A1-06-FORMULES-NOMBRE',
  'libelle-pris-pour-cle': RECHERCHE,
  'plage-recherche-non-figee': RECHERCHE,
  'critere-mal-ecrit': SOMME_SI,
  'periode-mal-delimitee': SOMME_SI,
  'jours-calendaires-pour-ouvres': JOURS_OUVRES,
  'bornes-comptees-dans-le-delai': JOURS_OUVRES,
  'valeur-extreme-ignoree': MEDIANE,
  'mediane-sur-liste-trop-large': MEDIANE,
  'plage-fixe-au-lieu-de-tableau': 'B3-02-A2-07-OUTIL-TABLEAU-STRUCTURE',
  'pourcentage-du-mauvais-total': TCD,
  'pourcentage-du-total-de-colonne': TCD,
  'tcd-filtre-ou-dates-mal-groupees': TCD,
  'axe-tronque-lu-comme-ecart': GRAPHIQUES,
  'graphique-sans-question': GRAPHIQUES,
  'objectif-annuel-pour-cumul': RATIOS,
  'evolution-sur-annee-pleine': RATIOS,
  'moyenne-simple-des-taux': RATIOS,
  'marque-confondue-avec-marge': RATIOS,
  'kpi-sans-contexte': TABLEAU_DE_BORD,
  'detail-au-lieu-de-synthese': TABLEAU_DE_BORD,
  'ia-crue-sur-parole': CAHIER_DE_REGLES,
  'ia-rejetee-sans-comparaison': CAHIER_DE_REGLES,
};

export const COURS_B3_02 = moteur.coursB3(
  [ACTE_1, ACTE_2, ACTE_3],
  REMEDIATIONS,
  MEDIAS_DES_INFOGRAPHIES(GRAVURE_DE_L_ACCROCHE),
  {
    slug: 'b3-02-formules-et-ia-analyste',
    titre: 'Toutes les formules, puis l’IA analyste',
    gabarit: 'b3',
    concepts: [...CONCEPTS_DU_B3_01, ...CONCEPTS_DU_B3_02],
  },
);
