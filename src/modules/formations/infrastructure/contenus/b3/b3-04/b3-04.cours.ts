import {
  CONCEPTS_DU_B3_01,
  CONCEPTS_DU_B3_02,
  CONCEPTS_DU_B3_03,
  CONCEPTS_DU_B3_04,
} from '../../../../domain/cours/banque/concepts';
import type { ContenuDeCours } from '../../../../domain/cours/stockage/CoursStocke';
import { ACTE_1 } from './b3-04.acte-1';
import { ACTE_2 } from './b3-04.acte-2';
import { ACTE_3 } from './b3-04.acte-3';
import { GRAVURE_DU_FACTEUR } from './b3-04.briques';
import * as moteur from '../../briques';

const CHAMPS = 'B3-04-A1-08-PAGE-CHAMPS';
const FILTRER = 'B3-04-A2-02-PAGE-FILTRER';
const APERCU = 'B3-04-A2-06-PAGE-APERCU';
const E_MAILING = 'B3-04-A3-02-PAGE-E-MAILING';
const IA_LETTRE = 'B3-04-A3-07-COURS-IA-LETTRE';

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  'numero-de-page-tape': 'B3-04-A1-01-RAPPEL-CHAMPS',
  'lettre-recopiee-a-la-main': 'B3-04-A1-04-PAGE-PUBLIPOSTAGE',
  'ligne-d-en-tete-comptee': 'B3-04-A1-05-PAGE-SOURCE',
  'champ-tape-a-la-main': CHAMPS,
  'piece-de-la-lettre-confondue': CHAMPS,
  'format-du-nombre-ignore': 'B3-04-A1-09-PAGE-FORMAT',
  'filtre-sur-le-mauvais-champ': FILTRER,
  'source-modifiee-pour-filtrer': FILTRER,
  'condition-inversee': 'B3-04-A2-03-PAGE-REGLE',
  'fusion-sans-apercu': APERCU,
  'correction-au-mauvais-endroit': APERCU,
  'lettre-type-exportee-au-lieu-de-fusionnee': 'B3-04-A2-07-PAGE-FUSION',
  'pdf-de-toutes-les-lettres-a-chacun': 'B3-04-A2-08-PAGE-PDF',
  'destinataires-en-copie': E_MAILING,
  'champ-a-mal-choisi': E_MAILING,
  'format-de-message-texte-brut': E_MAILING,
  'texte-d-ia-repris-sans-relecture': IA_LETTRE,
  'texte-d-ia-rejete-sans-relecture': IA_LETTRE,
  'ecart-d-ia-mal-nomme': IA_LETTRE,
};

export const COURS_B3_04 = moteur.coursB3(
  [ACTE_1, ACTE_2, ACTE_3],
  REMEDIATIONS,
  [GRAVURE_DU_FACTEUR],
  {
    slug: 'b3-04-publipostage',
    titre: 'Publipostage et e-mailing',
    gabarit: 'b3',
    concepts: [
      ...CONCEPTS_DU_B3_01,
      ...CONCEPTS_DU_B3_02,
      ...CONCEPTS_DU_B3_03,
      ...CONCEPTS_DU_B3_04,
    ],
  },
);
