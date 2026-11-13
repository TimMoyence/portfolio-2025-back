import type { AuMoinsUnModifiable } from '../../../../../../common/domain/objets/au-moins-un';
import {
  auCentime,
  auMillieme,
  auMillionieme,
} from '../../../../../../common/domain/nombres/arrondi';
import type { ConceptId } from '../../../../domain/cours/banque/concepts';
import type { ConfusionId } from '../../../../domain/cours/banque/confusions';
import * as moteur from '../../briques';
import { avecVirgule } from '../../feuilles';

export const CONCEPTS_DU_COURS = [
  'probabilite-d-un-evenement',
  'probabilite-conditionnelle',
  'probabilites-totales',
  'independance',
] as const satisfies readonly ConceptId[];

export const COMPLEMENT = 'complementaire-oublie';
export const REUNION = 'reunion-sans-intersection';
export const INTERSECTION = 'intersection-pour-conditionnelle';
export const INVERSEE = 'conditionnelle-inversee';
export const MAUVAIS_TOTAL = 'mauvais-total-du-tableau';
export const CONDITION_IGNOREE = 'condition-ignoree';
export const BRANCHES_ADDITIONNEES = 'branches-additionnees';
export const SANS_PONDERATION = 'totales-sans-ponderation';
export const INCOMPLETES = 'totales-incompletes';
export const INCOMPATIBILITE = 'independance-et-incompatibilite-confondues';
export const SANS_CALCUL = 'independance-sans-calcul';

interface Numerique {
  readonly solution: number;
  readonly pieges: AuMoinsUnModifiable<readonly [number, ConfusionId]>;
}

const LETTRE = 0.4;
const ACHAT_SI_LETTRE = 0.55;
const ACHAT_SINON = 0.2;

export const INTERSECTION_DE_LA_LETTRE: Numerique = {
  solution: auCentime(LETTRE * ACHAT_SI_LETTRE),
  pieges: [
    [auCentime(LETTRE + ACHAT_SI_LETTRE), BRANCHES_ADDITIONNEES],
    [ACHAT_SI_LETTRE, INTERSECTION],
  ],
};

export const CHEMIN_SANS_LETTRE: Numerique = {
  solution: auCentime((1 - LETTRE) * (1 - ACHAT_SINON)),
  pieges: [
    [auCentime((1 - LETTRE) * ACHAT_SINON), COMPLEMENT],
    [auCentime(1 - LETTRE + (1 - ACHAT_SINON)), BRANCHES_ADDITIONNEES],
  ],
};

const COMMANDES = 1000;
const COMMANDES_DE_LA_LETTRE = 300;
const SAC_SI_LETTRE = 0.35;
const SAC_SINON = 0.2;

const effectifs = (effectif: number, part: number) => {
  const sac = Math.round(effectif * part);
  return { sac, sansSac: effectif - sac };
};

const LIGNES_DU_TABLEAU = [
  {
    libelle: 'Venues de la lettre (L)',
    effectif: COMMANDES_DE_LA_LETTRE,
    part: SAC_SI_LETTRE,
  },
  {
    libelle: 'Autres commandes (L̄)',
    effectif: COMMANDES - COMMANDES_DE_LA_LETTRE,
    part: SAC_SINON,
  },
] as const;

export const PLAN_DU_TABLEAU_CROISE: moteur.PlanDeTableau = {
  id: 'b2-09-a2-tableau-croise',
  intitule: 'Le tableau croisé des 1 000 commandes',
  consignes: [
    'Sur 1 000 commandes du mois, 300 sont venues de la lettre (L). 35 % des commandes venues de la lettre comportent un sac (B), contre 20 % des autres.',
    'Pour chaque ligne, calculez le nombre de commandes avec un sac, puis sans sac.',
    'La part de sacs se prend sur l’effectif de la ligne, pas sur les 1 000 commandes.',
    'Le total de chaque colonne se calcule tout seul : vérifiez qu’il redonne 1 000.',
  ],
  echeances: LIGNES_DU_TABLEAU.length,
  intituleDesLignes: 'Origine de la commande',
  libellesLignes: LIGNES_DU_TABLEAU.map(({ libelle }) => libelle),
  parametres: {},
  colonnes: [
    {
      cle: 'effectif',
      intitule: 'Commandes',
      role: 'donnee',
      valeurs: LIGNES_DU_TABLEAU.map(({ effectif }) => effectif),
      decimales: 0,
      totalise: true,
    },
    {
      cle: 'sac',
      intitule: 'Avec un sac (B)',
      role: 'saisie',
      decimales: 0,
      totalise: true,
    },
    {
      cle: 'sansSac',
      intitule: 'Sans sac (B̄)',
      role: 'saisie',
      decimales: 0,
      totalise: true,
    },
  ],
  synthese: [],
};

type AttenduDeTableau = Parameters<typeof moteur.questionDeTableau>[2][number];

export const [PREMIER_EFFECTIF, ...AUTRES_EFFECTIFS] =
  LIGNES_DU_TABLEAU.flatMap(({ effectif, part }, rang) => {
    const { sac, sansSac } = effectifs(effectif, part);
    return [
      {
        rang,
        cle: 'sac',
        valeur: sac,
        pieges: [
          { valeur: Math.round(COMMANDES * part), confusion: MAUVAIS_TOTAL },
        ],
      },
      {
        rang,
        cle: 'sansSac',
        valeur: sansSac,
        pieges: [
          {
            valeur: Math.round(COMMANDES * (1 - part)),
            confusion: MAUVAIS_TOTAL,
          },
        ],
      },
    ] satisfies AttenduDeTableau[];
  });

export const CORRIGE_DU_TABLEAU = LIGNES_DU_TABLEAU.map(
  ({ libelle, effectif, part }) => {
    const { sac, sansSac } = effectifs(effectif, part);
    return `${libelle} : ${effectif} × ${avecVirgule(part)} = ${sac} avec un sac, ${effectif} − ${sac} = ${sansSac} sans sac`;
  },
).join(' ; ');

const LA_ROCHELLE = 0.7;
const DEFAUT_LA_ROCHELLE = 0.04;
const DEFAUT_ROCHEFORT = 0.09;
const CHEMIN_LA_ROCHELLE = auMillionieme(LA_ROCHELLE * DEFAUT_LA_ROCHELLE);
const CHEMIN_ROCHEFORT = auMillionieme((1 - LA_ROCHELLE) * DEFAUT_ROCHEFORT);
const DEFAUT = auMillionieme(CHEMIN_LA_ROCHELLE + CHEMIN_ROCHEFORT);
const DEFAUT_SANS_PONDERATION = auMillionieme(
  DEFAUT_LA_ROCHELLE + DEFAUT_ROCHEFORT,
);

export const VOILES_DEFECTUEUSES: Numerique = {
  solution: auMillieme(DEFAUT),
  pieges: [
    [DEFAUT_SANS_PONDERATION, SANS_PONDERATION],
    [CHEMIN_LA_ROCHELLE, INCOMPLETES],
  ],
};

export const VOILES_SANS_DEFAUT: Numerique = {
  solution: auMillieme(1 - DEFAUT),
  pieges: [[auCentime(1 - DEFAUT_SANS_PONDERATION), SANS_PONDERATION]],
};

export const DEFECTUEUSE_DE_ROCHEFORT: Numerique = {
  solution: auCentime(CHEMIN_ROCHEFORT / DEFAUT),
  pieges: [
    [DEFAUT_ROCHEFORT, INVERSEE],
    [CHEMIN_ROCHEFORT, INTERSECTION],
    [auCentime(1 - LA_ROCHELLE), CONDITION_IGNOREE],
  ],
};

export const DEFECTUEUSE_DE_LA_ROCHELLE: Numerique = {
  solution: auCentime(CHEMIN_LA_ROCHELLE / DEFAUT),
  pieges: [
    [DEFAUT_LA_ROCHELLE, INVERSEE],
    [LA_ROCHELLE, CONDITION_IGNOREE],
  ],
};

const SAC = 0.2;
const MOBILE = 0.45;
const MOBILE_ET_SAC = 0.12;

export const SAC_SUR_MOBILE: Numerique = {
  solution: auCentime(MOBILE_ET_SAC / MOBILE),
  pieges: [
    [MOBILE_ET_SAC, INTERSECTION],
    [auCentime(MOBILE_ET_SAC / SAC), INVERSEE],
  ],
};

const TROIS_FOIS = 0.3;
const RETARD_SI_TROIS_FOIS = 0.16;
const RETARD_SINON = 0.05;
const CHEMIN_TROIS_FOIS = auMillionieme(TROIS_FOIS * RETARD_SI_TROIS_FOIS);
const RETARD = auMillionieme(
  CHEMIN_TROIS_FOIS + (1 - TROIS_FOIS) * RETARD_SINON,
);

export const PAIEMENTS_EN_RETARD: Numerique = {
  solution: auMillieme(RETARD),
  pieges: [
    [auCentime(RETARD_SI_TROIS_FOIS + RETARD_SINON), SANS_PONDERATION],
    [CHEMIN_TROIS_FOIS, INCOMPLETES],
  ],
};

export const RETARD_EN_TROIS_FOIS: Numerique = {
  solution: auCentime(CHEMIN_TROIS_FOIS / RETARD),
  pieges: [
    [RETARD_SI_TROIS_FOIS, INVERSEE],
    [TROIS_FOIS, CONDITION_IGNOREE],
  ],
};
