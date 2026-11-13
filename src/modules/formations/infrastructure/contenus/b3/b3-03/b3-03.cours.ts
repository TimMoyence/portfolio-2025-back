import {
  CONCEPTS_DU_B3_01,
  CONCEPTS_DU_B3_02,
  CONCEPTS_DU_B3_03,
} from '../../../../domain/cours/banque/concepts';
import type { ContenuDeCours } from '../../../../domain/cours/stockage/CoursStocke';
import { ACTE_1 } from './b3-03.acte-1';
import { ACTE_2 } from './b3-03.acte-2';
import { ACTE_3 } from './b3-03.acte-3';
import { GRAVURE_DE_LA_MACHINE_A_ECRIRE } from './b3-03.briques';
import * as moteur from '../../briques';

const NETTOYER = 'B3-03-A1-05-PAGE-NETTOYER';
const STYLES = 'B3-03-A1-09-PAGE-STYLES';
const PARAGRAPHES = 'B3-03-A2-02-PAGE-PARAGRAPHES';
const LISTES = 'B3-03-A2-03-PAGE-LISTES-ET-SAUTS';
const MISE_EN_PAGE = 'B3-03-A2-07-PAGE-MISE-EN-PAGE';
const RELIRE = 'B3-03-A3-03-COURS-RELIRE';

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  'valeur-extreme-ignoree': 'B3-03-A1-01-RAPPEL-MEDIANE',
  'paragraphe-vide-pour-espacer': NETTOYER,
  'recherche-mal-saisie': NETTOYER,
  'mise-en-forme-directe-au-lieu-du-style': STYLES,
  'niveaux-de-titre-confondus': STYLES,
  'style-pour-un-mot-isole': 'B3-03-A1-08-PAGE-CARACTERES',
  'couleur-hors-du-theme': 'B3-03-A1-10-PAGE-THEME',
  'espace-pour-aligner': PARAGRAPHES,
  'saut-de-page-par-entrees': LISTES,
  'premiere-page-non-differenciee': 'B3-03-A2-06-PAGE-EN-TETE-PIED',
  'saut-de-page-au-lieu-de-section': MISE_EN_PAGE,
  'niveau-de-reglage-confondu': MISE_EN_PAGE,
  'numero-de-page-tape': 'B3-03-A2-08-PAGE-NUMEROS',
  'pdf-imprime-au-lieu-d-enregistre': 'B3-03-A2-12-PAGE-PDF',
  'texte-d-ia-repris-sans-relecture': RELIRE,
  'texte-d-ia-rejete-sans-relecture': RELIRE,
  'ecart-d-ia-mal-nomme': RELIRE,
};

export const COURS_B3_03 = moteur.coursB3(
  [ACTE_1, ACTE_2, ACTE_3],
  REMEDIATIONS,
  [GRAVURE_DE_LA_MACHINE_A_ECRIRE],
  {
    slug: 'b3-03-traitement-de-texte',
    titre: 'Traitement de texte : mettre en forme et mettre en page',
    gabarit: 'b3',
    concepts: [
      ...CONCEPTS_DU_B3_01,
      ...CONCEPTS_DU_B3_02,
      ...CONCEPTS_DU_B3_03,
    ],
  },
);
