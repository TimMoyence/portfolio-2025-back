import type { AuMoinsUnModifiable } from '../../../../../../common/domain/objets/au-moins-un';
import {
  BASE_ARRIVEE,
  CONCEPTS_DU_COURS,
  ECART,
  INDICE_POUR_TAUX,
  MEME_TAUX_AU_RETOUR,
  SENS,
  SYMETRIE,
  TAUX_ADDITIONNES,
  TAUX_MOYEN_DIVISE,
  TVA_SUR_TTC,
} from './b1-02.donnees';
import * as moteur from '../../briques';

const QUESTIONS_DU_RAPPEL: AuMoinsUnModifiable<moteur.VoteDuCours> = [
  moteur.rappel(
    'b1-02-r-taux',
    'taux-evolution',
    'Un prix passe de 200 € à 230 €. Quel est son taux d’évolution ?',
    '30 ÷ 200 = 0,15, soit + 15 %',
    [['30 ÷ 230 ≈ 0,13, soit + 13 %', BASE_ARRIVEE]],
  ),
  moteur.rappel(
    'b1-02-r-coefficient',
    'coefficient-multiplicateur',
    'Quel coefficient traduit une baisse de 12 % ?',
    '1 − 0,12 = 0,88',
    [['1 + 0,12 = 1,12', SENS]],
  ),
  moteur.rappel(
    'b1-02-r-depart',
    'coefficient-multiplicateur',
    'Après une hausse de 25 %, un prix vaut 100 €. Quel était le prix de départ ?',
    '100 ÷ 1,25 = 80 €',
    [['100 × 0,75 = 75 €', MEME_TAUX_AU_RETOUR]],
  ),
  moteur.rappel(
    'b1-02-r-ttc',
    'pourcentage',
    'Un article vaut 100 € HT, TVA à 20 %. Quel est son prix TTC ?',
    '100 × 1,20 = 120 € TTC',
    [['100 ÷ 0,80 = 125 € TTC', TVA_SUR_TTC]],
  ),
  moteur.rappel(
    'b1-02-r-ht',
    'pourcentage',
    'Un article vaut 240 € TTC, TVA à 20 %. Quel est son prix HT ?',
    '240 ÷ 1,20 = 200 € HT',
    [['240 × 0,80 = 192 € HT', TVA_SUR_TTC]],
  ),
  moteur.rappel(
    'b1-02-r-remise',
    'coefficient-multiplicateur',
    'Un prix de 40 € bénéficie d’une remise de 25 %. Quel est le nouveau prix ?',
    '40 × 0,75 = 30 €',
    [['40 − 25 = 15 €', ECART]],
  ),
  moteur.rappel(
    'b1-02-r-successives',
    'evolutions-successives',
    'Un prix augmente de 20 %, puis de 30 %. Quelle est l’évolution globale ?',
    '1,20 × 1,30 = 1,56, soit + 56 %',
    [['20 % + 30 % = + 50 %', TAUX_ADDITIONNES]],
  ),
  moteur.rappel(
    'b1-02-r-symetrie',
    'evolutions-successives',
    'Un prix augmente de 50 %, puis baisse de 50 %. Quelle est l’évolution globale ?',
    '1,5 × 0,5 = 0,75, soit − 25 %',
    [['Aucune : on revient au départ', SYMETRIE]],
  ),
  moteur.rappel(
    'b1-02-r-reciproque',
    'evolution-reciproque',
    'Un prix baisse de 20 %. Quelle hausse le ramène au départ ?',
    '1 ÷ 0,8 = 1,25, soit + 25 %',
    [['La même : + 20 %', MEME_TAUX_AU_RETOUR]],
  ),
  moteur.rappel(
    'b1-02-r-indice',
    'indice-base-100',
    'Un indice vaut 125, base 100 en 2020. Que signifie-t-il ?',
    '125 − 100 = 25 : + 25 % depuis 2020',
    [['+ 125 % depuis 2020', INDICE_POUR_TAUX]],
  ),
  moteur.rappel(
    'b1-02-r-taux-moyen',
    'taux-moyen',
    'Une valeur augmente de 44 % en 2 ans. Quel est le taux annuel moyen ?',
    '1,44^(1/2) = 1,2, soit + 20 % par an',
    [['44 % ÷ 2 = + 22 % par an', TAUX_MOYEN_DIVISE]],
  ),
  moteur.rappel(
    'b1-02-r-puissance',
    'tableur',
    'Coefficient global en B1, sur 3 évolutions : quelle formule donne le taux moyen ?',
    '=PUISSANCE(B1;1/3)-1',
    [['=B1/3', TAUX_MOYEN_DIVISE]],
  ),
];

export const ACTE_4: moteur.Acte = [
  moteur.rappelDeToutLeCours(
    {
      screenId: 'B1-02-A4-01-RAPPEL',
      concepts: [...CONCEPTS_DU_COURS],
    },
    'b1-02-a4-rappel',
    QUESTIONS_DU_RAPPEL,
  ),
  moteur.ficheMemo(
    {
      screenId: 'B1-02-A4-02-FICHE-MEMO',
      titre: 'Fiche mémo : évolutions, coefficients, indices',
      concepts: [...CONCEPTS_DU_COURS],
    },
    [
      {
        title: 'Taux d’évolution',
        description: 'De combien ça a bougé ?',
        back: 't = (V₂ − V₁) ÷ V₁. Toujours le départ en bas.',
      },
      {
        title: 'Coefficient',
        description: 'Par quoi multiplier ?',
        back: 'c = 1 + t : + 7 % donne 1,07 ; − 7 % donne 0,93.',
      },
      {
        title: 'Départ ou arrivée',
        description: 'Quelle valeur je cherche ?',
        back: 'V₂ = V₁ × c ; V₁ = V₂ ÷ c.',
      },
      {
        title: 'HT et TTC',
        description: 'Quel sens ?',
        back: 'TTC = HT × 1,20 ; HT = TTC ÷ 1,20. Jamais − 20 % sur le TTC.',
      },
      {
        title: 'Évolutions successives',
        description: 'Plusieurs évolutions ?',
        back: 'On multiplie les coefficients, jamais on n’additionne les taux. Taux global = C − 1.',
      },
      {
        title: 'Évolution réciproque',
        description: 'Revenir au départ ?',
        back: 'c réciproque = 1 ÷ c. Le retour n’a pas le même taux.',
      },
      {
        title: 'Indice base 100',
        description: 'Que dit un indice ?',
        back: 'I = V ÷ V₀ × 100. I − 100 donne le taux depuis la base.',
      },
      {
        title: 'Taux moyen',
        description: 'Un taux constant équivalent ?',
        back: 'c moyen = C^(1/n), n comptant les évolutions. Jamais le taux global ÷ n.',
      },
      {
        title: 'Tableur',
        description: 'La formule à recopier ?',
        back: 'La valeur de base figée par des $. Taux moyen : =PUISSANCE(C;1/n)-1.',
      },
      moteur.REFERENTIEL_DU_BTS_CG,
    ],
  ),
];
