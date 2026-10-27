import type { ConceptId } from '../../domain/cours/banque/concepts';
import {
  mapperAuMoinsUn,
  type AuMoinsUn,
  type AuMoinsUnModifiable,
} from '../../../../common/domain/au-moins-un';
import type { ConfusionId } from '../../domain/cours/banque/confusions';
import { somme } from '../../../../common/domain/nombres/statistiques';
import {
  arrondi,
  auMillionieme,
} from '../../../../common/domain/nombres/arrondi';
import * as moteur from './briques';
import {
  colonneDeValeurs,
  colonneRecopiee,
  gesteDeRecopie,
  type AttenduDeFeuille,
} from './feuilles';

export const CONCEPTS_DU_COURS = [
  'proportion',
  'pourcentage',
  'moyenne-ponderee',
  'point-de-pourcentage',
  'taux-evolution',
  'tableur',
  'contrat-de-lecture',
] as const satisfies readonly ConceptId[];

export const CONCEPTS_DES_PROPORTIONS = [
  'proportion',
  'pourcentage',
  'moyenne-ponderee',
  'point-de-pourcentage',
  'tableur',
] as const satisfies readonly ConceptId[];

export const BASE_INVERSEE = 'base-inversee';
export const FACTEUR_CENT = 'taux-valeur-facteur-cent';
export const VALEUR_POUR_TAUX = 'valeur-confondue-avec-taux';
export const MAUVAIS_TOUT = 'population-reference-ignoree';
export const NON_FIGEE = 'reference-relative-non-figee';
export const ARRONDI_OUBLIE = 'arrondi-oublie';
export const ADDITIF = 'raisonnement-additif';
export const MOYENNE_SIMPLE = 'moyenne-simple-des-taux';
export const POINTS_POUR_POURCENTAGE = 'points-confondus-avec-pourcentage';
export const PART_POUR_EVOLUTION = 'proportion-confondue-avec-evolution';
export const MARQUE_POUR_MARGE = 'marque-confondue-avec-marge';

export const DONNEES_FICTIVES =
  'Données fictives Partie Libre, créées pour ce cours.';

export const RENVOI_AU_DOSSIER = 'B1-01-A1-04-DOSSIER';

export const SALARIES = 40;
export const ALTERNANTS = 10;
export const SALARIES_DE_NANTES = 16;
export const ALTERNANTS_DE_NANTES = 4;
export const OBJECTIF_D_ALTERNANCE = 0.3;

export const BOUTIQUES = ['Nantes', 'Angers', 'Tours', 'Le Mans'] as const;
export const CLIENTS = [1200, 800, 600, 400] as const;
export const TAUX_DE_LA_CARTE = [45, 60, 50, 75] as const;
export const RESERVATION_EN_LIGNE = 0.4;

export const CLIENTS_D_OCTOBRE = [1500, 500] as const;
export const TAUX_D_OCTOBRE = [0.4, 0.7] as const;

export const PART_DES_JEUNES_2025 = 36.5;
export const PART_DES_JEUNES_2026 = 42.3;
export const ECART_DES_JEUNES = auMillionieme(
  PART_DES_JEUNES_2026 - PART_DES_JEUNES_2025,
);
export const ACHAT_DE_LA_MANETTE = 24;
export const VENTE_DE_LA_MANETTE = 39;

export const enPourcentage = (partie: number, tout: number): number =>
  auMillionieme((partie / tout) * 100);
const partArrondie = (partie: number, tout: number): number =>
  arrondi((partie / tout) * 100, 1);

function piegeDeLArrondi(
  partie: number,
  tout: number,
): (readonly [number, typeof ARRONDI_OUBLIE])[] {
  const exacte = enPourcentage(partie, tout);
  return exacte === partArrondie(partie, tout)
    ? []
    : [[exacte, ARRONDI_OUBLIE]];
}

export const TOTAL_DES_CLIENTS = somme(CLIENTS);
const PORTEURS = CLIENTS.map((clients, rang) =>
  auMillionieme((clients * TAUX_DE_LA_CARTE[rang]) / 100),
);
export const TOTAL_DES_PORTEURS = somme(PORTEURS);

interface Repartition {
  readonly id: string;
  readonly intitule: string;
  readonly titre?: string;
  readonly entetes: readonly [string, string, string];
  readonly libelles: readonly string[];
  readonly effectifs: AuMoinsUn<number>;
  readonly duTout: string;
  readonly consigneDeLaPart: (cellule: string) => string;
}

function piegesDistincts(
  pieges: readonly (readonly [number, ConfusionId])[],
): (readonly [number, ConfusionId])[] {
  return pieges.filter(
    ([valeur], rang) =>
      pieges.findIndex(([autre]) => autre === valeur) === rang,
  );
}

function feuilleDeRepartition({
  id,
  intitule,
  titre,
  entetes,
  libelles,
  effectifs,
  duTout,
  consigneDeLaPart,
}: Repartition) {
  const premiere = titre === undefined ? 2 : 3;
  const derniere = premiere + effectifs.length - 1;
  const ligneDuTotal = derniere + 1;
  const modele = `C${premiere}`;
  const total = somme(effectifs);
  const [premierEffectif] = effectifs;
  const formules = {
    total: `=SOMME(B${premiere}:B${derniere})`,
    part: `=ARRONDI(B${premiere}/$B$${ligneDuTotal}*100;1)`,
    controle: `=SOMME(C${premiere}:C${derniere})`,
  };
  const [colonneA, colonneB, colonneC] = entetes;
  const cellules = {
    ...(titre === undefined ? {} : { A1: titre }),
    [`A${premiere - 1}`]: colonneA,
    [`B${premiere - 1}`]: colonneB,
    [`C${premiere - 1}`]: colonneC,
    [`A${ligneDuTotal}`]: 'Total',
    ...colonneDeValeurs('A', libelles, premiere),
    ...colonneDeValeurs('B', effectifs, premiere),
  };
  const attendus: AuMoinsUnModifiable<AttenduDeFeuille> = [
    moteur.attendu(`B${ligneDuTotal}`, formules.total, total, 'references'),
    ...colonneRecopiee(
      {
        colonne: 'C',
        premiereLigne: premiere,
        formule: formules.part,
        piegesDuModele: piegesDistincts([
          [arrondi(premierEffectif / total, 1), FACTEUR_CENT],
          [auMillionieme(premierEffectif / total), FACTEUR_CENT],
          [arrondi((total / premierEffectif) * 100, 1), BASE_INVERSEE],
          ...piegeDeLArrondi(premierEffectif, total),
        ]),
        piegesDuRang: (rang) => piegeDeLArrondi(effectifs[rang], total),
        confusionSiErreur: NON_FIGEE,
      },
      mapperAuMoinsUn(effectifs, (effectif) => partArrondie(effectif, total)),
    ),
    moteur.attendu(`C${ligneDuTotal}`, formules.controle, 100, 'references'),
  ];
  return {
    formules,
    attendus,
    plan: {
      id,
      intitule,
      lignes: ligneDuTotal,
      colonnes: 3,
      cellules,
      verrouillees: Object.keys(cellules),
      consignes: [
        `En B${ligneDuTotal}, calculez ${duTout}.`,
        `${consigneDeLaPart(modele)} Recopiez jusqu’en C${derniere} : ${gesteDeRecopie([modele], derniere)}.`,
        `En C${ligneDuTotal}, vérifiez que les parts font 100 %.`,
        `Le total ne s’écrit pas dans la formule : utilisez B${ligneDuTotal}, figé par des $.`,
      ],
    },
  };
}

export const REPARTITION_DES_CLIENTS = feuilleDeRepartition({
  id: 'b1-01-a1-tableur-clients',
  intitule: 'Exercice 2 — La répartition des clients au tableur',
  entetes: ['Boutique', 'Clients en septembre', 'Part des clients (%)'],
  libelles: BOUTIQUES,
  effectifs: CLIENTS,
  duTout: 'le total des clients',
  consigneDeLaPart: (cellule) =>
    `En ${cellule}, écrivez la part des clients de Nantes, en %, arrondie au dixième avec ARRONDI.`,
});

type AttenduDeTableau = Parameters<typeof moteur.questionDeTableau>[2][number];

export const [PREMIERS_PORTEURS, ...AUTRES_PORTEURS] = PORTEURS.map(
  (porteurs, rang): AttenduDeTableau => ({
    rang,
    cle: 'porteurs',
    valeur: porteurs,
    pieges: [
      { valeur: TAUX_DE_LA_CARTE[rang], confusion: VALEUR_POUR_TAUX },
      {
        valeur: auMillionieme(CLIENTS[rang] / (TAUX_DE_LA_CARTE[rang] / 100)),
        confusion: BASE_INVERSEE,
      },
    ],
  }),
);
