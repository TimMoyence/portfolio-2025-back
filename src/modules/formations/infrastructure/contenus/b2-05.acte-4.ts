import type { AuMoinsUnModifiable } from '../../../../common/domain/au-moins-un';
import * as moteur from './briques';
import {
  ACTUALISATION_INVERSEE,
  ANNUITE_POUR_AMORTISSEMENT,
  CAPITAL_INITIAL,
  CONCEPTS_DES_MATHEMATIQUES_FINANCIERES,
  INTERETS_SIMPLES,
  NON_FIGEE,
  SANS_INTERETS,
  TAUX_POUR_COEFFICIENT,
  TOTAL_REMBOURSE,
  TOUTE_LA_DUREE,
  VPM_NON_SIGNE,
} from './b2-05.donnees';

const QUESTIONS_DU_RAPPEL: AuMoinsUnModifiable<moteur.VoteDuCours> = [
  moteur.rappel(
    'b2-05-r-coefficient',
    'interets-composes',
    'Un placement rapporte 4 % par an. Par quel nombre multiplie-t-on le capital chaque année ?',
    'Par 1,04',
    [['Par 0,04', TAUX_POUR_COEFFICIENT]],
  ),
  moteur.rappel(
    'b2-05-r-deux-ans',
    'interets-composes',
    '1 000 € sont placés à 5 % par an, à intérêts composés. Que valent-ils après deux ans ?',
    '1 102,50 €, soit 1 000 × 1,05²',
    [['1 100 €, soit 1 000 + 2 × 50', INTERETS_SIMPLES]],
  ),
  moteur.rappel(
    'b2-05-r-valeur-actuelle',
    'valeur-actuelle',
    'Quelle somme placer aujourd’hui à 10 % par an pour disposer de 1 210 € dans deux ans ?',
    '1 000 €, soit 1 210 ÷ 1,1²',
    [['1 464,10 €, soit 1 210 × 1,1²', ACTUALISATION_INVERSEE]],
  ),
  moteur.rappel(
    'b2-05-r-sens',
    'valeur-actuelle',
    'Pour actualiser une somme disponible dans n années, que fait-on ?',
    'On divise par (1 + t)ⁿ',
    [['On multiplie par (1 + t)ⁿ', ACTUALISATION_INVERSEE]],
  ),
  moteur.rappel(
    'b2-05-r-duree-versement',
    'annuites',
    'Versements en fin d’année, de 2026 à 2030. Combien d’années le versement de fin 2027 rapporte-t-il jusqu’à fin 2030 ?',
    'Trois ans',
    [['Cinq ans : toute la durée du plan', TOUTE_LA_DUREE]],
  ),
  moteur.rappel(
    'b2-05-r-versements',
    'annuites',
    'Trois versements de 1 000 € en fin d’année, à 2 %. L’épargne au troisième versement vaut-elle 3 000 € ?',
    'Non : 3 060,40 €, intérêts compris',
    [['Oui : trois fois 1 000 €', SANS_INTERETS]],
  ),
  moteur.rappel(
    'b2-05-r-interets-emprunt',
    'tableau-d-amortissement',
    'Sur quel capital calcule-t-on les intérêts de la troisième année d’un emprunt ?',
    'Sur le capital restant dû au début de la troisième année',
    [['Sur le capital emprunté au départ', CAPITAL_INITIAL]],
  ),
  moteur.rappel(
    'b2-05-r-amortissement',
    'tableau-d-amortissement',
    'Une annuité de 5 000 € contient 800 € d’intérêts. Quel capital rembourse-t-elle ?',
    '4 200 €',
    [['5 000 €', ANNUITE_POUR_AMORTISSEMENT]],
  ),
  moteur.rappel(
    'b2-05-r-evolution-interets',
    'tableau-d-amortissement',
    'Emprunt à annuités constantes : comment évoluent les intérêts d’une année à l’autre ?',
    'Ils baissent : le capital restant dû diminue',
    [['Ils restent égaux : le taux ne change pas', CAPITAL_INITIAL]],
  ),
  moteur.rappel(
    'b2-05-r-cout',
    'cout-du-credit',
    'Quatre annuités de 2 740 € remboursent un emprunt de 10 000 €. Quel est le coût du crédit ?',
    '960 €',
    [['10 960 €', TOTAL_REMBOURSE]],
  ),
  moteur.rappel(
    'b2-05-r-vpm',
    'tableur',
    'Taux en C1, durée en C2, capital emprunté en C3 : quelle formule affiche une annuité positive ?',
    '=VPM(C1;C2;-C3)',
    [['=VPM(C1;C2;C3)', VPM_NON_SIGNE]],
  ),
  moteur.rappel(
    'b2-05-r-figee',
    'tableur',
    'Capital dû en D2, taux en K1 : quelle formule des intérêts recopier vers le bas ?',
    '=D2*$K$1',
    [['=D2*K1', NON_FIGEE]],
  ),
];

export const ACTE_4: moteur.Acte = [
  moteur.rappelDeToutLeCours(
    {
      screenId: 'B2-05-A4-04-RAPPEL',
      concepts: [...CONCEPTS_DES_MATHEMATIQUES_FINANCIERES],
    },
    'b2-05-a4-rappel',
    QUESTIONS_DU_RAPPEL,
  ),
  moteur.ficheMemo(
    {
      screenId: 'B2-05-A4-05-FICHE-MEMO',
      titre: 'Fiche mémo : placer, emprunter',
      concepts: [...CONCEPTS_DES_MATHEMATIQUES_FINANCIERES],
    },
    [
      {
        title: 'Intérêts composés',
        description: 'Que vaudra le capital ?',
        back: 'Cₙ = C₀ × (1 + t)ⁿ. Les intérêts rapportent à leur tour. Intérêts simples : C₀ × (1 + n × t).',
      },
      {
        title: 'Valeur actuelle',
        description: 'Combien placer aujourd’hui ?',
        back: 'C₀ = Cₙ ÷ (1 + t)ⁿ. On divise pour remonter le temps ; la valeur actuelle est plus petite.',
      },
      {
        title: 'Suite d’annuités',
        description: 'Des versements réguliers ?',
        back: 'Vₙ = a × ((1 + t)ⁿ − 1) ÷ t, au dernier versement. Chaque versement a sa durée ; le dernier ne rapporte rien.',
      },
      {
        title: 'Annuité d’emprunt',
        description: 'Combien rembourser chaque année ?',
        back: 'a = C × t ÷ (1 − (1 + t)⁻ⁿ). Formule donnée au CCF.',
      },
      {
        title: 'Tableau d’amortissement',
        description: 'Une ligne par année ?',
        back: 'Intérêts = capital restant dû × t ; amortissement = a − intérêts ; capital dû suivant = capital − amortissement.',
      },
      {
        title: 'Coût du crédit',
        description: 'Combien coûte l’emprunt ?',
        back: 'n × a − C, ou la somme des intérêts. Le total remboursé n’est pas le coût.',
      },
      {
        title: 'VPM',
        description: 'L’annuité au tableur ?',
        back: 'VPM(taux ; durée ; −capital). Sans le signe moins, l’annuité s’affiche négative.',
      },
      {
        title: 'Tableur',
        description: 'Quelle formule recopier ?',
        back: 'Taux, versement et annuité figés par des $. SOMME pour un total, jamais la dernière cellule.',
      },
      {
        title: 'Capitaliser ou actualiser',
        description: 'Quel sens du temps ?',
        back: 'Vers le futur : × (1 + t)ⁿ. Vers le présent : ÷ (1 + t)ⁿ. Relire la question avant de calculer.',
      },
      moteur.REFERENTIEL_DU_BTS_CG,
    ],
  ),
];
