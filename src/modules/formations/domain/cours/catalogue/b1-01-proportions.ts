import type { Tolerance } from '../../GradingCore';
import type { Tirage } from '../Aleatoire';
import type {
  AuMoinsUn,
  Cours,
  DefinitionNumerique,
  DefinitionVote,
  Ecran,
  QuestionNumerique,
  QuestionVote,
} from '../Cours';
import { questionNumerique, questionVote } from '../Cours';
import { SEUIL_PAR_DEFAUT } from '../DeroulePresentateur';

const TOLERANCE_EUROS: Tolerance = { type: 'decimales', valeur: 2 };
const TOLERANCE_POURCENTAGE: Tolerance = { type: 'absolue', valeur: 0.05 };
const TOLERANCE_COEFFICIENT: Tolerance = { type: 'absolue', valeur: 0.001 };
const TAUX_ARRONDI = 'en % (arrondi à 0,1 %)';
const TAUX_ARRONDI_SIGNE = 'en % (arrondi à 0,1 %, négatif en cas de baisse)';
const COEFFICIENT_ARRONDI = '(arrondi au millième)';
const ESPACE_FINE_INSECABLE = String.fromCodePoint(0x202f);
const ESPACE_INSECABLE = String.fromCodePoint(0xa0);
const CONSIGNE_CALCULATRICE =
  'calculatrice de poche, ou téléphone posé à côté si l’on répond sur ordinateur ; ne changez pas de fenêtre';

type Sens = 1 | -1;

interface Variation {
  readonly taux: number;
}

interface Evolution {
  readonly depart: number;
  readonly arrivee: number;
}

interface Successives {
  readonly premier: number;
  readonly second: number;
}

interface MontantEtTaux {
  readonly montant: number;
  readonly taux: number;
}

interface Part {
  readonly total: number;
  readonly partie: number;
}

interface MemeProportion {
  readonly avant: number;
  readonly apres: number;
  readonly autre: number;
}

interface DeuxClients {
  readonly gain: number;
  readonly premier: number;
  readonly second: number;
}

interface Dossier {
  readonly client: string;
  readonly ca2: number;
  readonly ca1: number;
  readonly ca0: number;
}

interface Gabarit<D> {
  readonly id: string;
  readonly enonce: (donnees: D) => string;
}

function typographier(texte: string): string {
  return texte
    .replaceAll(/ ([%€])/g, `${ESPACE_FINE_INSECABLE}$1`)
    .replaceAll(/ ([?!;:»])/g, `${ESPACE_INSECABLE}$1`)
    .replaceAll('« ', `«${ESPACE_INSECABLE}`);
}

function estDonneeSimple(
  valeur: unknown,
): valeur is Readonly<Record<string, unknown>> {
  return (
    typeof valeur === 'object' &&
    valeur !== null &&
    Object.getPrototypeOf(valeur) === Object.prototype
  );
}

function avecEspacesInsecables<T>(valeur: T): T {
  if (typeof valeur === 'string') {
    return typographier(valeur) as T;
  }
  if (Array.isArray(valeur)) {
    return valeur.map((element: unknown) =>
      avecEspacesInsecables(element),
    ) as T;
  }
  if (estDonneeSimple(valeur)) {
    return Object.fromEntries(
      Object.entries(valeur).map(([cle, element]) => [
        cle,
        avecEspacesInsecables(element),
      ]),
    ) as T;
  }
  return valeur;
}

function numerique<D>(definition: DefinitionNumerique<D>): QuestionNumerique {
  return questionNumerique({
    ...definition,
    enonce: (donnees) => typographier(definition.enonce(donnees)),
  });
}

function vote<D>(definition: DefinitionVote<D>): QuestionVote {
  const [premier, ...autres] = definition.pieges;
  const habiller = (piege: (typeof definition.pieges)[number]) => ({
    confusion: piege.confusion,
    libelle: (donnees: D) => typographier(piege.libelle(donnees)),
  });
  return questionVote({
    ...definition,
    enonce: (donnees) => typographier(definition.enonce(donnees)),
    bonne: (donnees) => typographier(definition.bonne(donnees)),
    pieges: [habiller(premier), ...autres.map(habiller)],
  });
}

function nombre(valeur: number, decimales: number): string {
  return valeur.toLocaleString('fr-FR', { maximumFractionDigits: decimales });
}

function euros(valeur: number): string {
  const centimes = Math.round(valeur * 100) / 100;
  const decimales = Number.isInteger(centimes) ? 0 : 2;
  const montant = centimes.toLocaleString('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
  return `${montant} €`;
}

function pourcentage(valeur: number): string {
  return `${nombre(valeur, 2)} %`;
}

function evolution(valeur: number): string {
  const arrondi = Math.round(valeur * 100) / 100;
  if (arrondi === 0) {
    return '0 %';
  }
  const signe = arrondi > 0 ? '+' : '−';
  return `${signe}${pourcentage(Math.abs(arrondi))}`;
}

function coefficient(valeur: number): string {
  return nombre(valeur, 4);
}

function motDuSens(taux: number): string {
  return taux > 0 ? 'hausse' : 'baisse';
}

function variationEnMots(taux: number): string {
  return taux > 0
    ? `augmente de ${pourcentage(taux)}`
    : `baisse de ${pourcentage(-taux)}`;
}

function appliquer(valeur: number, taux: number): number {
  return Math.round((valeur + (valeur * taux) / 100) * 100) / 100;
}

function tirerSens(tirage: Tirage): Sens {
  return tirage.choix([1, -1] as const);
}

function tirerTauxEntier(tirage: Tirage): Variation {
  const sens = tirerSens(tirage);
  return { taux: sens * tirage.entier(3, 45) };
}

function tirerEvolution(
  tirage: Tirage,
  sens: Sens,
  tauxMinimal: number,
): Evolution {
  const depart = tirage.entier(12, 90) * 5000;
  const taux = sens * tirage.decimal(tauxMinimal, 30, 0.5);
  return { depart, arrivee: appliquer(depart, taux) };
}

function tirerHausse(tirage: Tirage): Evolution {
  return tirerEvolution(tirage, 1, 4);
}

function tirerEvolutionSignee(tirage: Tirage, tauxMinimal = 4): Evolution {
  return tirerEvolution(tirage, tirerSens(tirage), tauxMinimal);
}

function tauxEntre({ depart, arrivee }: Evolution): number {
  return ((arrivee - depart) / depart) * 100;
}

function tauxSurArrivee({ depart, arrivee }: Evolution): number {
  return ((arrivee - depart) / arrivee) * 100;
}

function ecart({ depart, arrivee }: Evolution): number {
  return arrivee - depart;
}

function coefficientEntre({ depart, arrivee }: Evolution): number {
  return arrivee / depart;
}

function tirerSuccessives(
  tirage: Tirage,
  sensPremier: Sens,
  sensSecond: Sens,
): Successives {
  const premier = sensPremier * 2 * tirage.entier(4, 10);
  return { premier, second: sensSecond * tirage.entier(7, 15) };
}

function coefficientGlobal({ premier, second }: Successives): number {
  return (1 + premier / 100) * (1 + second / 100);
}

function tauxGlobal(donnees: Successives): number {
  return (coefficientGlobal(donnees) - 1) * 100;
}

function tauxAdditionnes({ premier, second }: Successives): number {
  return premier + second;
}

function presenterSuccessives({ premier, second }: Successives): string {
  return `Le chiffre d’affaires d’un client ${variationEnMots(premier)} en N-1, puis ${variationEnMots(second)} en N.`;
}

function tauxReciproque(taux: number): number {
  return (1 / (1 + taux / 100) - 1) * 100;
}

function tirerHausseBaisse(tirage: Tirage): MontantEtTaux {
  const montant = tirage.entier(8, 40) * 500;
  return { montant, taux: tirage.choix([20, 30, 40] as const) };
}

function apresHausseBaisse({ montant, taux }: MontantEtTaux): number {
  return montant * (1 + taux / 100) * (1 - taux / 100);
}

function baisseGlobaleCentFoisTropPetite({
  montant,
  taux,
}: MontantEtTaux): number {
  return montant * (1 - (taux * taux) / 1_000_000);
}

function tirerPartDuMontant(tirage: Tirage): MontantEtTaux {
  const montant = tirage.entier(15, 95) * 10000;
  return { montant, taux: tirage.decimal(18, 45, 0.5) };
}

function tirerPart(tirage: Tirage): Part {
  const total = tirage.entier(30, 90) * 10000;
  const taux = tirage.decimal(6, 45, 0.5);
  return { total, partie: (total * taux) / 100 };
}

function tirerMemeProportion(tirage: Tirage): MemeProportion {
  const avant = tirage.entier(4, 20) * 10;
  const apres = appliquer(avant, tirage.entier(1, 8) * 5);
  return { avant, apres, autre: avant + tirage.entier(3, 30) * 10 };
}

function tirerDeuxClients(tirage: Tirage): DeuxClients {
  const gain = tirage.entier(2, 8) * 5000;
  const premier = tirage.entier(4, 10) * 10000;
  return {
    gain,
    premier,
    second: premier * tirage.choix([3, 4, 5] as const),
  };
}

function deuxProgressions(premier: string, second: string): string {
  return `Le premier : ${premier} ; le second : ${second}`;
}

const CLIENTS = [
  'Boulangerie Lemoine',
  'Garage Perrin',
  'Librairie Fabre',
  'Menuiserie Roux',
  'Traiteur Benali',
  'Salon Nguyen',
  'Transports Girard',
  'Pharmacie Morel',
] as const;

type TauxDossier = readonly [number, number];

const SCENARIOS_DOSSIER: AuMoinsUn<(tirage: Tirage) => TauxDossier> = [
  (tirage) => {
    const modere = 2 * tirage.entier(2, 4);
    const fort = tirage.entier(18, 25);
    return tirage.choix([
      [modere, fort],
      [fort, modere],
    ] as const);
  },
  (tirage) => [2 * tirage.entier(6, 10), -tirage.entier(5, 8)],
  (tirage) => [-2 * tirage.entier(3, 5), tirage.entier(12, 20)],
];

function tirerDossier(tirage: Tirage): Dossier {
  const client = tirage.choix(CLIENTS);
  const [premier, second] = tirage.choix(SCENARIOS_DOSSIER)(tirage);
  const ca2 = tirage.entier(15, 60) * 10000;
  const ca1 = appliquer(ca2, premier);
  return { client, ca2, ca1, ca0: appliquer(ca1, second) };
}

function presenterDossier({ client, ca2, ca1, ca0 }: Dossier): string {
  return `Dossier ${client} : chiffre d’affaires de ${euros(ca2)} en N-2, ${euros(ca1)} en N-1 et ${euros(ca0)} en N.`;
}

function premiereAnnee({ ca2, ca1 }: Dossier): Evolution {
  return { depart: ca2, arrivee: ca1 };
}

function derniereAnnee({ ca1, ca0 }: Dossier): Evolution {
  return { depart: ca1, arrivee: ca0 };
}

function deuxAnnees({ ca2, ca0 }: Dossier): Evolution {
  return { depart: ca2, arrivee: ca0 };
}

function tauxAnnuelsAdditionnes(dossier: Dossier): number {
  return tauxEntre(premiereAnnee(dossier)) + tauxEntre(derniereAnnee(dossier));
}

function questionTaux(
  definition: Gabarit<Evolution> & {
    readonly noteCompte: boolean;
    readonly donnees: (tirage: Tirage) => Evolution;
  },
) {
  return numerique({
    ...definition,
    concept: 'taux-evolution',
    unite: '%',
    solution: tauxEntre,
    tolerance: TOLERANCE_POURCENTAGE,
    pieges: [
      { confusion: 'base-arrivee', valeur: tauxSurArrivee },
      { confusion: 'ecart-absolu-au-lieu-du-taux', valeur: ecart },
      {
        confusion: 'taux-valeur-facteur-cent',
        valeur: (donnees) => tauxEntre(donnees) / 100,
      },
      {
        confusion: 'coefficient-confondu-avec-taux',
        valeur: (donnees) => coefficientEntre(donnees) * 100,
      },
    ],
  });
}

function questionTauxGlobal(
  definition: Gabarit<Successives> & {
    readonly noteCompte: boolean;
    readonly donnees: (tirage: Tirage) => Successives;
  },
) {
  return numerique({
    ...definition,
    concept: 'evolutions-successives',
    unite: '%',
    solution: tauxGlobal,
    tolerance: TOLERANCE_POURCENTAGE,
    pieges: [
      { confusion: 'taux-successifs-additionnes', valeur: tauxAdditionnes },
      {
        confusion: 'coefficient-confondu-avec-taux',
        valeur: (donnees) => coefficientGlobal(donnees) * 100,
      },
    ],
  });
}

function questionReciproque(
  definition: Gabarit<Variation> & {
    readonly donnees: (tirage: Tirage) => Variation;
  },
) {
  return numerique({
    ...definition,
    concept: 'evolution-reciproque',
    noteCompte: false,
    unite: '%',
    solution: ({ taux }) => tauxReciproque(taux),
    tolerance: TOLERANCE_POURCENTAGE,
    pieges: [
      { confusion: 'reciproque-meme-taux', valeur: ({ taux }) => -taux },
      {
        confusion: 'coefficient-confondu-avec-taux',
        valeur: ({ taux }) => 100 / (1 + taux / 100),
      },
      {
        confusion: 'taux-valeur-facteur-cent',
        valeur: ({ taux }) => tauxReciproque(taux) / 100,
      },
    ],
  });
}

function pourcentageDuMontant({ montant, taux }: MontantEtTaux): number {
  return (montant * taux) / 100;
}

function tauxPrisPourValeur({ montant, taux }: MontantEtTaux): number {
  return montant * taux;
}

function complementDuMontant({ montant, taux }: MontantEtTaux): number {
  return montant * (1 - taux / 100);
}

function questionPartDuMontant(definition: Gabarit<MontantEtTaux>) {
  return numerique({
    ...definition,
    concept: 'pourcentage',
    noteCompte: false,
    donnees: tirerPartDuMontant,
    unite: '€',
    solution: pourcentageDuMontant,
    tolerance: TOLERANCE_EUROS,
    pieges: [
      { confusion: 'taux-valeur-facteur-cent', valeur: tauxPrisPourValeur },
      {
        confusion: 'coefficient-confondu-avec-taux',
        valeur: complementDuMontant,
      },
    ],
  });
}

function questionPart(definition: Gabarit<Part>) {
  return numerique({
    ...definition,
    concept: 'proportion',
    noteCompte: false,
    donnees: tirerPart,
    unite: '%',
    solution: ({ total, partie }) => (partie / total) * 100,
    tolerance: TOLERANCE_POURCENTAGE,
    pieges: [
      {
        confusion: 'taux-valeur-facteur-cent',
        valeur: ({ total, partie }) => partie / total,
      },
    ],
  });
}

function questionMemeProportion(definition: Gabarit<MemeProportion>) {
  return numerique({
    ...definition,
    concept: 'proportion',
    noteCompte: false,
    donnees: tirerMemeProportion,
    unite: '€',
    solution: ({ avant, apres, autre }) => (autre * apres) / avant,
    tolerance: TOLERANCE_EUROS,
    pieges: [
      {
        confusion: 'raisonnement-additif',
        valeur: ({ avant, apres, autre }) => autre + apres - avant,
      },
      {
        confusion: 'coefficient-confondu-avec-taux',
        valeur: ({ avant, apres, autre }) => (autre * (apres - avant)) / avant,
      },
    ],
  });
}

const QUESTION_OUVERTURE_RAPPEL = vote({
  id: 'B1-01-OUV-RAPPEL-HAUSSE-BAISSE',
  concept: 'evolutions-successives',
  noteCompte: false,
  donnees: tirerHausseBaisse,
  enonce: ({ montant, taux }) =>
    `Le chiffre d’affaires mensuel d’un client est de ${euros(montant)}. Il augmente de ${pourcentage(taux)} en mars, puis baisse de ${pourcentage(taux)} en avril. Quel est son chiffre d’affaires d’avril ?`,
  bonne: (donnees) => euros(apresHausseBaisse(donnees)),
  pieges: [
    {
      confusion: 'hausse-baisse-symetriques',
      libelle: ({ montant }) => euros(montant),
    },
    {
      confusion: 'taux-valeur-facteur-cent',
      libelle: (donnees) => euros(baisseGlobaleCentFoisTropPetite(donnees)),
    },
  ],
});

const QUESTION_SAS_POURCENTAGE = numerique({
  id: 'B1-01-SAS-POURCENTAGE',
  concept: 'pourcentage',
  noteCompte: true,
  donnees: (tirage) => {
    const montant = tirage.entier(12, 95) * 100;
    return { montant, taux: tirage.entier(3, 18) };
  },
  enonce: ({ montant, taux }) =>
    `Une facture d’achat de ${euros(montant)} HT bénéficie d’une remise de ${pourcentage(taux)}. Quel est le montant de la remise, en euros ?`,
  unite: '€',
  solution: pourcentageDuMontant,
  tolerance: TOLERANCE_EUROS,
  pieges: [
    { confusion: 'taux-valeur-facteur-cent', valeur: tauxPrisPourValeur },
    {
      confusion: 'coefficient-confondu-avec-taux',
      valeur: complementDuMontant,
    },
  ],
});

const QUESTION_SAS_TAUX = questionTaux({
  id: 'B1-01-SAS-TAUX',
  noteCompte: true,
  donnees: tirerHausse,
  enonce: ({ depart, arrivee }) =>
    `Le chiffre d’affaires annuel d’un client passe de ${euros(depart)} en N-1 à ${euros(arrivee)} en N. Quel est le taux d’évolution, ${TAUX_ARRONDI} ?`,
});

const QUESTION_SAS_COEFFICIENT = numerique({
  id: 'B1-01-SAS-COEFFICIENT',
  concept: 'coefficient-multiplicateur',
  noteCompte: true,
  donnees: tirerTauxEntier,
  enonce: ({ taux }) =>
    `Par quel coefficient multiplicateur faut-il multiplier un prix pour lui appliquer une ${motDuSens(taux)} de ${pourcentage(Math.abs(taux))} ?`,
  unite: null,
  solution: ({ taux }) => 1 + taux / 100,
  tolerance: TOLERANCE_COEFFICIENT,
  pieges: [
    {
      confusion: 'coefficient-confondu-avec-taux',
      valeur: ({ taux }) => Math.abs(taux) / 100,
    },
    {
      confusion: 'taux-valeur-facteur-cent',
      valeur: ({ taux }) => 100 + taux,
    },
  ],
});

const QUESTION_SAS_SUCCESSIVES = questionTauxGlobal({
  id: 'B1-01-SAS-SUCCESSIVES',
  noteCompte: true,
  donnees: (tirage) => tirerSuccessives(tirage, 1, -1),
  enonce: (donnees) =>
    `${presenterSuccessives(donnees)} Quel est le taux d’évolution global sur les deux années, ${TAUX_ARRONDI_SIGNE} ?`,
});

const QUESTION_M1_PART = questionPart({
  id: 'B1-01-M1-PART-A-TOI',
  enonce: ({ total, partie }) =>
    `Le chiffre d’affaires annuel d’un client s’élève à ${euros(total)}, dont ${euros(partie)} réalisés en vente à emporter. Quelle part du chiffre d’affaires la vente à emporter représente-t-elle, ${TAUX_ARRONDI} ?`,
});

const QUESTION_M1_PIVOT = vote({
  id: 'B1-01-M1-PIVOT-TAUX-VALEUR',
  concept: 'pourcentage',
  noteCompte: false,
  donnees: (tirage) => ({
    taux: tirage.choix([
      15, 20, 25, 30, 35, 40, 45, 60, 65, 70, 75, 80,
    ] as const),
  }),
  enonce: ({ taux }) =>
    `Dans le tableur du cabinet, la cellule B2 contient le chiffre d’affaires d’un client. Sa marge représente ${pourcentage(taux)} de ce chiffre d’affaires. Quelle formule calcule le montant de la marge ?`,
  bonne: ({ taux }) => `=B2*${nombre(taux / 100, 2)}`,
  pieges: [
    {
      confusion: 'taux-valeur-facteur-cent',
      libelle: ({ taux }) => `=B2*${nombre(taux, 2)}`,
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      libelle: ({ taux }) => `=B2*${nombre(1 + taux / 100, 2)}`,
    },
  ],
});

const QUESTION_M1_POURCENTAGE = questionPartDuMontant({
  id: 'B1-01-M1-PRATIQUE-POURCENTAGE',
  enonce: ({ montant, taux }) =>
    `Les charges de personnel d’un client représentent ${pourcentage(taux)} de son chiffre d’affaires, qui s’élève à ${euros(montant)}. Quel est le montant des charges de personnel, en euros ?`,
});

const QUESTION_M1_TOTAL = numerique({
  id: 'B1-01-M1-PRATIQUE-TOTAL',
  concept: 'pourcentage',
  noteCompte: false,
  donnees: (tirage) => {
    const total = tirage.entier(20, 150) * 100;
    const taux = tirage.entier(4, 25);
    return { taux, montant: (total * taux) / 100 };
  },
  enonce: ({ montant, taux }) =>
    `Les frais de transport d’un client s’élèvent à ${euros(montant)}, soit ${pourcentage(taux)} du montant total de ses achats. Quel est le montant total des achats, en euros ?`,
  unite: '€',
  solution: ({ montant, taux }) => (montant * 100) / taux,
  tolerance: TOLERANCE_EUROS,
  pieges: [
    {
      confusion: 'taux-valeur-facteur-cent',
      valeur: ({ montant, taux }) => montant / taux,
    },
  ],
});

const QUESTION_M1_PROPORTION = questionMemeProportion({
  id: 'B1-01-M1-PRATIQUE-PROPORTION',
  enonce: ({ avant, apres, autre }) =>
    `Chez un fournisseur, le prix d’achat d’un article passe de ${euros(avant)} à ${euros(apres)}. Un second article, acheté ${euros(autre)}, augmente dans la même proportion. Quel est son nouveau prix d’achat, en euros ?`,
});

const QUESTION_M1_DEUX_CLIENTS = vote({
  id: 'B1-01-M1-PRATIQUE-DEUX-CLIENTS',
  concept: 'proportion',
  noteCompte: false,
  donnees: tirerDeuxClients,
  enonce: ({ gain, premier, second }) =>
    `Cette année, deux clients du cabinet gagnent chacun ${euros(gain)} de chiffre d’affaires : le premier partait de ${euros(premier)}, le second de ${euros(second)}. De quel pourcentage chacun progresse-t-il ?`,
  bonne: ({ gain, premier, second }) =>
    deuxProgressions(
      evolution((gain / premier) * 100),
      evolution((gain / second) * 100),
    ),
  pieges: [
    {
      confusion: 'base-arrivee',
      libelle: ({ gain, premier, second }) =>
        deuxProgressions(
          evolution((gain / (premier + gain)) * 100),
          evolution((gain / (second + gain)) * 100),
        ),
    },
    {
      confusion: 'ecart-absolu-au-lieu-du-taux',
      libelle: ({ gain }) =>
        deuxProgressions(`+${euros(gain)}`, `+${euros(gain)}`),
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      libelle: ({ gain, premier, second }) =>
        deuxProgressions(
          pourcentage(100 + (gain / premier) * 100),
          pourcentage(100 + (gain / second) * 100),
        ),
    },
  ],
});

const QUESTION_M1_PART_CHARGES = questionPart({
  id: 'B1-01-M1-PRATIQUE-PART',
  enonce: ({ total, partie }) =>
    `Les charges d’exploitation d’un client s’élèvent à ${euros(total)}, dont ${euros(partie)} d’achats de matières premières. Quelle part des charges les achats de matières premières représentent-ils, ${TAUX_ARRONDI} ?`,
});

const QUESTION_M1_ANCRAGE = vote({
  id: 'B1-01-M1-ANCRAGE-PART-CONSERVEE',
  concept: 'proportion',
  noteCompte: false,
  donnees: (tirage) => {
    const total = tirage.entier(20, 60) * 10000;
    const taux = tirage.entier(1, 8) * 5;
    return { total, taux, nouveau: appliquer(total, taux) };
  },
  enonce: ({ total, nouveau }) =>
    `Le chiffre d’affaires total d’un client passe de ${euros(total)} à ${euros(nouveau)}. Si la part réalisée en ligne reste la même, le chiffre d’affaires en ligne :`,
  bonne: ({ taux }) => `augmente de ${pourcentage(taux)}`,
  pieges: [
    {
      confusion: 'raisonnement-additif',
      libelle: ({ total, nouveau }) => `augmente de ${euros(nouveau - total)}`,
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      libelle: ({ taux }) => `augmente de ${pourcentage(100 + taux)}`,
    },
  ],
});

const QUESTION_M2_PIVOT = questionTaux({
  id: 'B1-01-M2-PIVOT-TAUX',
  noteCompte: false,
  donnees: tirerEvolutionSignee,
  enonce: ({ depart, arrivee }) =>
    `Le chiffre d’affaires d’un client passe de ${euros(depart)} en N-1 à ${euros(arrivee)} en N. Quel est le taux d’évolution, ${TAUX_ARRONDI_SIGNE} ?`,
});

const QUESTION_M2_VALEUR_ARRIVEE = numerique({
  id: 'B1-01-M2-PRATIQUE-VALEUR-ARRIVEE',
  concept: 'coefficient-multiplicateur',
  noteCompte: false,
  donnees: (tirage) => {
    const montant = tirage.entier(40, 950);
    return { montant, taux: tirage.entier(2, 35) };
  },
  enonce: ({ montant, taux }) =>
    `Un fournisseur augmente de ${pourcentage(taux)} le prix d’un article vendu ${euros(montant)} HT. Quel est le nouveau prix HT, en euros ?`,
  unite: '€',
  solution: ({ montant, taux }) => montant * (1 + taux / 100),
  tolerance: TOLERANCE_EUROS,
  pieges: [
    {
      confusion: 'taux-valeur-facteur-cent',
      valeur: ({ montant, taux }) => montant * (1 + taux),
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      valeur: ({ montant, taux }) => (montant * taux) / 100,
    },
  ],
});

const QUESTION_M2_TAUX_DU_COEFFICIENT = numerique({
  id: 'B1-01-M2-PRATIQUE-TAUX-DU-COEFFICIENT',
  concept: 'coefficient-multiplicateur',
  noteCompte: false,
  donnees: tirerTauxEntier,
  enonce: ({ taux }) =>
    `Pour mettre à jour ses tarifs, un client multiplie tous ses prix par ${coefficient(1 + taux / 100)}. Quel est le taux d’évolution appliqué, en % (négatif en cas de baisse) ?`,
  unite: '%',
  solution: ({ taux }) => taux,
  tolerance: TOLERANCE_POURCENTAGE,
  pieges: [
    {
      confusion: 'coefficient-confondu-avec-taux',
      valeur: ({ taux }) => 100 + taux,
    },
    {
      confusion: 'taux-valeur-facteur-cent',
      valeur: ({ taux }) => taux / 100,
    },
  ],
});

const QUESTION_M2_VALEUR_DEPART = numerique({
  id: 'B1-01-M2-PRATIQUE-VALEUR-DEPART',
  concept: 'coefficient-multiplicateur',
  noteCompte: false,
  donnees: (tirage) => {
    const depart = tirage.entier(10, 80) * 1000;
    return { depart, arrivee: appliquer(depart, tirage.entier(2, 30)) };
  },
  enonce: (donnees) =>
    `Après une hausse de ${pourcentage(tauxEntre(donnees))}, le chiffre d’affaires d’un client atteint ${euros(donnees.arrivee)}. Quel était son chiffre d’affaires avant la hausse, en euros ?`,
  unite: '€',
  solution: (donnees) => donnees.arrivee / (1 + tauxEntre(donnees) / 100),
  tolerance: TOLERANCE_EUROS,
  pieges: [
    {
      confusion: 'reciproque-meme-taux',
      valeur: (donnees) => donnees.arrivee * (1 - tauxEntre(donnees) / 100),
    },
  ],
});

const QUESTION_M2_COEFFICIENT_ENTRE = numerique({
  id: 'B1-01-M2-PRATIQUE-COEFFICIENT-ENTRE',
  concept: 'coefficient-multiplicateur',
  noteCompte: false,
  donnees: (tirage) => tirerEvolutionSignee(tirage, 8),
  enonce: ({ depart, arrivee }) =>
    `Le chiffre d’affaires d’un client passe de ${euros(depart)} à ${euros(arrivee)}. Par quel coefficient multiplicateur a-t-il été multiplié ${COEFFICIENT_ARRONDI} ?`,
  unite: null,
  solution: coefficientEntre,
  tolerance: TOLERANCE_COEFFICIENT,
  pieges: [
    {
      confusion: 'coefficient-confondu-avec-taux',
      valeur: (donnees) => Math.abs(tauxEntre(donnees)) / 100,
    },
    {
      confusion: 'taux-valeur-facteur-cent',
      valeur: (donnees) => coefficientEntre(donnees) * 100,
    },
    {
      confusion: 'base-arrivee',
      valeur: (donnees) => 1 + tauxSurArrivee(donnees) / 100,
    },
  ],
});

const QUESTION_M2_LECTURE_COEFFICIENT = vote({
  id: 'B1-01-M2-PRATIQUE-LECTURE-COEFFICIENT',
  concept: 'coefficient-multiplicateur',
  noteCompte: false,
  donnees: tirerTauxEntier,
  enonce: ({ taux }) =>
    `Le prix d’un article est multiplié par ${coefficient(1 + taux / 100)}. Cela correspond à :`,
  bonne: ({ taux }) =>
    `une ${motDuSens(taux)} de ${pourcentage(Math.abs(taux))}`,
  pieges: [
    {
      confusion: 'coefficient-confondu-avec-taux',
      libelle: ({ taux }) =>
        `une ${motDuSens(taux)} de ${pourcentage(100 + taux)}`,
    },
    {
      confusion: 'taux-valeur-facteur-cent',
      libelle: ({ taux }) =>
        `une ${motDuSens(taux)} de ${pourcentage(Math.abs(taux) / 100)}`,
    },
  ],
});

const QUESTION_M2_TAUX_DU_GAIN = numerique({
  id: 'B1-01-M2-PRATIQUE-TAUX-DU-GAIN',
  concept: 'taux-evolution',
  noteCompte: false,
  donnees: tirerHausse,
  enonce: (donnees) =>
    `Le chiffre d’affaires d’un client a augmenté de ${euros(ecart(donnees))} pour atteindre ${euros(donnees.arrivee)}. Quel est le taux d’évolution, ${TAUX_ARRONDI} ?`,
  unite: '%',
  solution: tauxEntre,
  tolerance: TOLERANCE_POURCENTAGE,
  pieges: [
    { confusion: 'base-arrivee', valeur: tauxSurArrivee },
    { confusion: 'ecart-absolu-au-lieu-du-taux', valeur: ecart },
  ],
});

const QUESTION_M2_ANCRAGE = vote({
  id: 'B1-01-M2-ANCRAGE-FORMULE-TAUX',
  concept: 'taux-evolution',
  noteCompte: false,
  donnees: tirerEvolutionSignee,
  enonce: ({ depart, arrivee }) =>
    `Le chiffre d’affaires d’un client passe de ${euros(depart)} à ${euros(arrivee)}. Quel calcul donne son taux d’évolution en % ?`,
  bonne: ({ depart, arrivee }) =>
    `(${nombre(arrivee, 2)} − ${nombre(depart, 2)}) ÷ ${nombre(depart, 2)} × 100`,
  pieges: [
    {
      confusion: 'base-arrivee',
      libelle: ({ depart, arrivee }) =>
        `(${nombre(arrivee, 2)} − ${nombre(depart, 2)}) ÷ ${nombre(arrivee, 2)} × 100`,
    },
    {
      confusion: 'ecart-absolu-au-lieu-du-taux',
      libelle: ({ depart, arrivee }) =>
        `${nombre(arrivee, 2)} − ${nombre(depart, 2)}`,
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      libelle: ({ depart, arrivee }) =>
        `${nombre(arrivee, 2)} ÷ ${nombre(depart, 2)} × 100`,
    },
  ],
});

const QUESTION_M3_PIVOT_SUCCESSIVES = vote({
  id: 'B1-01-M3-PIVOT-SUCCESSIVES',
  concept: 'evolutions-successives',
  noteCompte: false,
  donnees: (tirage) => tirerSuccessives(tirage, 1, 1),
  enonce: (donnees) =>
    `${presenterSuccessives(donnees)} Sur les deux années, il a augmenté de :`,
  bonne: (donnees) => pourcentage(tauxGlobal(donnees)),
  pieges: [
    {
      confusion: 'taux-successifs-additionnes',
      libelle: (donnees) => pourcentage(tauxAdditionnes(donnees)),
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      libelle: (donnees) => pourcentage(coefficientGlobal(donnees) * 100),
    },
  ],
});

const QUESTION_M3_PIVOT_RECIPROQUE = questionReciproque({
  id: 'B1-01-M3-PIVOT-RECIPROQUE',
  donnees: (tirage) => ({ taux: tirage.entier(5, 60) }),
  enonce: ({ taux }) =>
    `Le prix d’un produit vient d’augmenter de ${pourcentage(taux)}. Quel taux d’évolution faut-il appliquer au nouveau prix pour revenir exactement au prix initial, ${TAUX_ARRONDI_SIGNE} ?`,
});

const QUESTION_M3_PROPORTION = questionMemeProportion({
  id: 'B1-01-M3-MELANGE-PROPORTION',
  enonce: ({ avant, apres, autre }) =>
    `L’abonnement mensuel d’un logiciel de gestion passe de ${euros(avant)} à ${euros(apres)}. Un second abonnement, facturé ${euros(autre)} par mois, est revalorisé dans la même proportion. Quel est son nouveau tarif mensuel, en euros ?`,
});

const QUESTION_M3_HAUSSE_BAISSE = numerique({
  id: 'B1-01-M3-MELANGE-HAUSSE-BAISSE',
  concept: 'evolutions-successives',
  noteCompte: false,
  donnees: tirerHausseBaisse,
  enonce: ({ montant, taux }) =>
    `Un fournisseur augmente de ${pourcentage(taux)} le prix d’une machine vendue ${euros(montant)}, puis accorde une remise de ${pourcentage(taux)} sur ce nouveau prix. Quel est le prix final, en euros ?`,
  unite: '€',
  solution: apresHausseBaisse,
  tolerance: TOLERANCE_EUROS,
  pieges: [
    {
      confusion: 'hausse-baisse-symetriques',
      valeur: ({ montant }) => montant,
    },
    {
      confusion: 'taux-valeur-facteur-cent',
      valeur: baisseGlobaleCentFoisTropPetite,
    },
  ],
});

const QUESTION_M3_TAUX_GLOBAL = questionTauxGlobal({
  id: 'B1-01-M3-MELANGE-TAUX-GLOBAL',
  noteCompte: false,
  donnees: (tirage) => tirerSuccessives(tirage, -1, 1),
  enonce: (donnees) =>
    `${presenterSuccessives(donnees)} Quel est le taux d’évolution global sur les deux années, ${TAUX_ARRONDI_SIGNE} ?`,
});

const QUESTION_M3_RECIPROQUE = questionReciproque({
  id: 'B1-01-M3-MELANGE-RECIPROQUE',
  donnees: (tirage) => ({ taux: -tirage.entier(5, 35) }),
  enonce: ({ taux }) =>
    `Le chiffre d’affaires d’un client a baissé de ${pourcentage(-taux)} en N. De quel pourcentage doit-il augmenter en N+1 pour retrouver son niveau de N-1, ${TAUX_ARRONDI} ?`,
});

const QUESTION_M3_TVA = vote({
  id: 'B1-01-M3-MELANGE-TVA',
  concept: 'evolution-reciproque',
  noteCompte: false,
  donnees: (tirage) => ({ ttc: appliquer(tirage.entier(50, 4000), 20) }),
  enonce: ({ ttc }) =>
    `Une facture s’élève à ${euros(ttc)} TTC, avec une TVA à 20 %. Quel calcul donne le montant HT ?`,
  bonne: ({ ttc }) => `${euros(ttc)} ÷ 1,2`,
  pieges: [
    {
      confusion: 'reciproque-meme-taux',
      libelle: ({ ttc }) => `${euros(ttc)} × 0,8`,
    },
    {
      confusion: 'taux-valeur-facteur-cent',
      libelle: ({ ttc }) => `${euros(ttc)} ÷ 120`,
    },
  ],
});

const QUESTION_M3_TAUX = questionTaux({
  id: 'B1-01-M3-MELANGE-TAUX',
  noteCompte: false,
  donnees: tirerEvolutionSignee,
  enonce: ({ depart, arrivee }) =>
    `Les achats de marchandises d’un client passent de ${euros(depart)} en N-1 à ${euros(arrivee)} en N. Quel est leur taux d’évolution, ${TAUX_ARRONDI_SIGNE} ?`,
});

const QUESTION_M3_POURCENTAGE = questionPartDuMontant({
  id: 'B1-01-M3-MELANGE-POURCENTAGE',
  enonce: ({ montant, taux }) =>
    `Le coût d’achat des marchandises vendues d’un client représente ${pourcentage(taux)} de son chiffre d’affaires, qui s’élève à ${euros(montant)}. Quel est ce coût d’achat, en euros ?`,
});

const QUESTION_M3_VOTE_HAUSSE_BAISSE = vote({
  id: 'B1-01-M3-MELANGE-VOTE-HAUSSE-BAISSE',
  concept: 'evolutions-successives',
  noteCompte: false,
  donnees: (tirage) => ({
    taux: tirage.choix([10, 15, 20, 25, 30, 40, 50] as const),
  }),
  enonce: ({ taux }) =>
    `Un fournisseur augmente tous ses prix de ${pourcentage(taux)} au 1er janvier, puis les baisse de ${pourcentage(taux)} au 1er juillet. Au 1er juillet, par rapport à leur niveau de départ, ses prix sont :`,
  bonne: ({ taux }) => `${pourcentage((taux * taux) / 100)} plus bas`,
  pieges: [
    {
      confusion: 'hausse-baisse-symetriques',
      libelle: () => 'revenus à leur niveau de départ',
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      libelle: ({ taux }) =>
        `${pourcentage(100 - (taux * taux) / 100)} plus bas`,
    },
  ],
});

const QUESTION_M3_COEFFICIENT_GLOBAL = numerique({
  id: 'B1-01-M3-MELANGE-COEFFICIENT-GLOBAL',
  concept: 'evolutions-successives',
  noteCompte: false,
  donnees: (tirage) => tirerSuccessives(tirage, 1, -1),
  enonce: (donnees) =>
    `${presenterSuccessives(donnees)} Par quel coefficient multiplicateur global a-t-il été multiplié entre N-2 et N ${COEFFICIENT_ARRONDI} ?`,
  unite: null,
  solution: coefficientGlobal,
  tolerance: TOLERANCE_COEFFICIENT,
  pieges: [
    {
      confusion: 'taux-successifs-additionnes',
      valeur: (donnees) => 1 + tauxAdditionnes(donnees) / 100,
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      valeur: (donnees) => Math.abs(coefficientGlobal(donnees) - 1),
    },
  ],
});

const QUESTION_M4_TAUX_ANNUEL = numerique({
  id: 'B1-01-M4-DOSSIER-TAUX-ANNUEL',
  concept: 'taux-evolution',
  noteCompte: false,
  donnees: tirerDossier,
  enonce: (dossier) =>
    `${presenterDossier(dossier)} Quel est le taux d’évolution du chiffre d’affaires entre N-1 et N, ${TAUX_ARRONDI_SIGNE} ?`,
  unite: '%',
  solution: (dossier) => tauxEntre(derniereAnnee(dossier)),
  tolerance: TOLERANCE_POURCENTAGE,
  pieges: [
    {
      confusion: 'base-arrivee',
      valeur: (dossier) => tauxSurArrivee(derniereAnnee(dossier)),
    },
    {
      confusion: 'ecart-absolu-au-lieu-du-taux',
      valeur: (dossier) => ecart(derniereAnnee(dossier)),
    },
  ],
});

const QUESTION_M4_COEFFICIENT_GLOBAL = numerique({
  id: 'B1-01-M4-DOSSIER-COEFFICIENT-GLOBAL',
  concept: 'evolutions-successives',
  noteCompte: false,
  donnees: tirerDossier,
  enonce: (dossier) =>
    `${presenterDossier(dossier)} Quel est le coefficient multiplicateur global entre N-2 et N ${COEFFICIENT_ARRONDI} ?`,
  unite: null,
  solution: (dossier) => coefficientEntre(deuxAnnees(dossier)),
  tolerance: TOLERANCE_COEFFICIENT,
  pieges: [
    {
      confusion: 'taux-successifs-additionnes',
      valeur: (dossier) => 1 + tauxAnnuelsAdditionnes(dossier) / 100,
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      valeur: (dossier) => Math.abs(coefficientEntre(deuxAnnees(dossier)) - 1),
    },
  ],
});

const QUESTION_M4_TAUX_GLOBAL = numerique({
  id: 'B1-01-M4-DOSSIER-TAUX-GLOBAL',
  concept: 'evolutions-successives',
  noteCompte: false,
  donnees: tirerDossier,
  enonce: (dossier) =>
    `${presenterDossier(dossier)} Quel est le taux d’évolution global entre N-2 et N, ${TAUX_ARRONDI_SIGNE} ?`,
  unite: '%',
  solution: (dossier) => tauxEntre(deuxAnnees(dossier)),
  tolerance: TOLERANCE_POURCENTAGE,
  pieges: [
    {
      confusion: 'taux-successifs-additionnes',
      valeur: tauxAnnuelsAdditionnes,
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      valeur: (dossier) => coefficientEntre(deuxAnnees(dossier)) * 100,
    },
    {
      confusion: 'ecart-absolu-au-lieu-du-taux',
      valeur: (dossier) => ecart(deuxAnnees(dossier)),
    },
  ],
});

const QUESTION_M4_TAUX_MOYEN = numerique({
  id: 'B1-01-M4-DOSSIER-TAUX-MOYEN',
  concept: 'taux-moyen',
  noteCompte: false,
  donnees: tirerDossier,
  enonce: (dossier) =>
    `${presenterDossier(dossier)} Quel est le taux d’évolution moyen annuel entre N-2 et N, ${TAUX_ARRONDI_SIGNE} ?`,
  unite: '%',
  solution: (dossier) =>
    (Math.sqrt(coefficientEntre(deuxAnnees(dossier))) - 1) * 100,
  tolerance: TOLERANCE_POURCENTAGE,
  pieges: [
    {
      confusion: 'taux-successifs-additionnes',
      valeur: (dossier) => tauxAnnuelsAdditionnes(dossier) / 2,
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      valeur: (dossier) =>
        Math.sqrt(coefficientEntre(deuxAnnees(dossier))) * 100,
    },
  ],
});

const QUESTION_M4_RECIPROQUE = numerique({
  id: 'B1-01-M4-DOSSIER-RECIPROQUE',
  concept: 'evolution-reciproque',
  noteCompte: false,
  donnees: tirerDossier,
  enonce: (dossier) =>
    `${presenterDossier(dossier)} Quel taux d’évolution, appliqué au chiffre d’affaires de N, le ramènerait exactement à son niveau de N-1, ${TAUX_ARRONDI_SIGNE} ?`,
  unite: '%',
  solution: ({ ca1, ca0 }) => tauxEntre({ depart: ca0, arrivee: ca1 }),
  tolerance: TOLERANCE_POURCENTAGE,
  pieges: [
    {
      confusion: 'reciproque-meme-taux',
      valeur: (dossier) => -tauxEntre(derniereAnnee(dossier)),
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      valeur: ({ ca1, ca0 }) => (ca1 / ca0) * 100,
    },
  ],
});

const QUESTION_M4_AFFIRMATION = vote({
  id: 'B1-01-M4-DOSSIER-AFFIRMATION',
  concept: 'evolutions-successives',
  noteCompte: false,
  donnees: tirerDossier,
  enonce: (dossier) =>
    `${presenterDossier(dossier)} Le gérant affirme que son chiffre d’affaires a évolué de ${evolution(tauxAnnuelsAdditionnes(dossier))} en deux ans, puisqu’il a évolué de ${evolution(tauxEntre(premiereAnnee(dossier)))} puis de ${evolution(tauxEntre(derniereAnnee(dossier)))}. Qu’en pensez-vous ?`,
  bonne: (dossier) =>
    `Il se trompe : ${evolution(tauxEntre(deuxAnnees(dossier)))}`,
  pieges: [
    {
      confusion: 'taux-successifs-additionnes',
      libelle: () => 'Il a raison : les taux s’additionnent',
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      libelle: (dossier) =>
        `Il se trompe : ${pourcentage(coefficientEntre(deuxAnnees(dossier)) * 100)}`,
    },
  ],
});

const QUESTION_EXIT = vote({
  id: 'B1-01-EXIT-SUCCESSIVES',
  concept: 'evolutions-successives',
  noteCompte: true,
  donnees: (tirage) => tirerSuccessives(tirage, 1, -1),
  enonce: (donnees) =>
    `${presenterSuccessives(donnees)} Sur les deux années, il a évolué de :`,
  bonne: (donnees) => evolution(tauxGlobal(donnees)),
  pieges: [
    {
      confusion: 'taux-successifs-additionnes',
      libelle: (donnees) => evolution(tauxAdditionnes(donnees)),
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      libelle: (donnees) => pourcentage(coefficientGlobal(donnees) * 100),
    },
  ],
});

export const B1_01_PROPORTIONS: Cours = {
  slug: 'b1-01-proportions',
  titre: 'Proportions, taux et évolutions',
  niveau: 'BTS CG 2',
  dureeMinutes: 195,
  concepts: [
    'proportion',
    'pourcentage',
    'taux-evolution',
    'coefficient-multiplicateur',
    'evolutions-successives',
    'evolution-reciproque',
    'taux-moyen',
  ],
  ecrans: avecEspacesInsecables<AuMoinsUn<Ecran>>([
    {
      id: 'E-OUV-RAPPEL',
      brique: 'fp-recall',
      dureeMinutes: 4,
      concepts: ['evolutions-successives'],
      seuil: SEUIL_PAR_DEFAUT,
      notes:
        '[4 min · minutes 0 à 4 · mode piloté] Dans toutes les notes, « minutes a à b » compte le temps de cours, pauses exclues. Avant l’heure : affichez le code de séance dès l’entrée en salle ; à la première connexion, chacun saisit prénom, nom et e-mail, laissez-les rejoindre en s’installant. 0’–1’ : présentez-vous en une phrase et posez à voix haute deux règles : la classe ne voit jamais vos réponses ; « je ne sais pas » est une réponse légitime (sur un vote, choisissez-la ; sur une question de calcul, qui n’a pas ce bouton, laissez la réponse vide plutôt que de tenter au hasard). 1’–3’ : lancez le rappel ; 8 secondes de réflexion sans les options, puis vote individuel sans calculatrice. 3’–4’ : ne corrigez pas, c’est un diagnostic. Lisez seulement la répartition à voix haute (« un tiers d’entre vous pense que le chiffre d’affaires revient à son niveau de départ ») et annoncez que la séance va trancher. Pièges attendus : le montant de départ (hausse et baisse crues symétriques) ; un montant à peine inférieur au départ (baisse globale lue cent fois trop petite). Notez le taux de bonnes réponses : on le compare au billet de sortie.',
      question: QUESTION_OUVERTURE_RAPPEL,
    },
    {
      id: 'E-OUV-CABINET',
      brique: 'fp-pro',
      dureeMinutes: 3,
      concepts: ['taux-evolution', 'coefficient-multiplicateur'],
      modalite: 'classe',
      notes:
        '[3 min · minutes 4 à 7 · mode piloté] Lisez la situation, puis demandez : « la gérante veut savoir de combien elle a progressé : vous lui répondez en euros ou en pourcentage ? » Prenez deux réponses de volontaires. Faites calculer 41 200 ÷ 412 000 à la calculatrice de poche (0,10). Insistez sur la conséquence : diviser par 453 200 donne 9,1 %, soit 0,9 point d’écart dans une note remise à une cliente. Annoncez le plan : proportions, taux et coefficients, évolutions enchaînées, puis vos propres dossiers clients.',
      proprietes: {
        metier: 'Collaborateur comptable en cabinet d’expertise comptable',
        situation:
          'Le chef de mission vous transmet le dossier d’une boulangerie cliente : son chiffre d’affaires est passé de 412 000 € en N-1 à 453 200 € en N. La gérante vient cet après-midi et demande « de combien elle a progressé ».',
        geste:
          'Vous calculez l’écart, 41 200 €, puis le taux d’évolution rapporté au chiffre d’affaires de départ : 41 200 ÷ 412 000 = 0,10, soit une hausse de 10 %. Vous notez aussi le coefficient multiplicateur 1,10, qui servira au prévisionnel de N+1.',
        consequence:
          'Diviser par le chiffre d’affaires d’arrivée donnerait 9,1 % : 0,9 point d’écart dans la note remise à la cliente et un prévisionnel faussé. Aujourd’hui, on vérifie qu’aucun de ces réflexes ne vous trahit.',
      },
    },
    {
      id: 'E-OUV-SAS',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: [
        'pourcentage',
        'taux-evolution',
        'coefficient-multiplicateur',
        'evolutions-successives',
      ],
      regime: 'examen',
      notes: `[8 min · minutes 7 à 15 · mode piloté, régime examen] 0’–1’ : annoncez le cadre avant de lancer. Quatre questions, note de participation et non de justesse, chiffres différents pour chacun. Consigne : ${CONSIGNE_CALCULATRICE} ; en régime examen, toute sortie du plein écran est journalisée et apparaît dans votre rapport. 1’–7’ : travail individuel en silence. Observez le tableau de bord sans rien corriger : plus d’un tiers d’erreurs sur le taux (division par l’arrivée, écart en euros) → vous ralentirez sur l’exemple résolu du mouvement 2 ; coefficient d’une baisse rendu en 0,15 au lieu de 0,85 → vous insisterez sur le concept à quatre faces ; taux successifs additionnés → le mouvement 3 sera décisif. 7’–8’ : clôturez et annoncez que chaque question du sas reviendra dans la séance.`,
      questions: [
        QUESTION_SAS_POURCENTAGE,
        QUESTION_SAS_TAUX,
        QUESTION_SAS_COEFFICIENT,
        QUESTION_SAS_SUCCESSIVES,
      ],
    },
    {
      id: 'E-M1-ACCROCHE',
      brique: 'fp-story',
      dureeMinutes: 2,
      concepts: ['pourcentage'],
      modalite: 'classe',
      notes:
        '[2 min · minutes 15 à 17 · mode piloté] Racontez plutôt que lire. Question à poser à la fin : « 35 %, c’est quel nombre ? » Attendez « 0,35 ». Relance si quelqu’un répond « 35 » : « 35 pour 100 : écrivez la division ». C’est le fil du mouvement 1 : un pourcentage est une division par 100 déjà écrite.',
      proprietes: {
        titre: 'Du « per cento » au signe %',
        paragraphes: [
          'Dans les livres de comptes des marchands italiens du XVe siècle, les intérêts et les remises s’écrivent « per cento » : pour cent, c’est-à-dire pour chaque centaine.',
          'Recopiée à la main des milliers de fois, l’expression s’abrège, puis se réduit à un petit signe : le % que nous tapons aujourd’hui sans y penser.',
          'Le signe garde la trace de son origine : « 35 % » se lit « 35 pour 100 » et désigne le nombre 35 ÷ 100 = 0,35. Ce n’est pas une unité, c’est une division par 100.',
        ],
      },
    },
    {
      id: 'E-M1-PART',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['proportion', 'pourcentage'],
      modalite: 'classe',
      notes:
        '[4 min · minutes 17 à 21 · mode piloté] Déroulez les quatre étapes une par une. À chaque invite, laissez 20 secondes, faites comparer en binôme, puis prenez la réponse d’un volontaire. Étape 3 : écrivez au tableau 0,275 = 27,5 % et barrez « 27,5 » écrit seul. Étape 4 : posez « 212 000 € ou 154 000 € ? », laissez 30 secondes de discussion en binôme, puis faites voter la classe avant de dévoiler : c’est le raisonnement additif à débusquer. Cet écran est la remédiation du raisonnement additif : revenez-y si l’ancrage du mouvement 1 ou la question de proportion du mouvement 3 passe sous 70 %.',
      proprietes: {
        enonce:
          'La boulangerie Lemoine réalise un chiffre d’affaires annuel de 480 000 €, dont 132 000 € en service traiteur. Quelle part du chiffre d’affaires le traiteur représente-t-il ?',
        etapes: [
          {
            id: 'tout-et-partie',
            intitule: 'Repérer le tout et la partie',
            raisonnement:
              'Le tout est le chiffre d’affaires total, 480 000 €. La partie est ce qu’on compare à ce tout : les 132 000 € du traiteur.',
            invite:
              'Si l’on cherchait la part du traiteur dans les seules ventes du samedi, quel serait le tout ?',
          },
          {
            id: 'division',
            intitule: 'Diviser la partie par le tout',
            raisonnement:
              '132 000 ÷ 480 000 = 0,275. Une part est toujours comprise entre 0 et 1, puisque la partie est contenue dans le tout.',
            invite: 'Pourquoi le résultat ne peut-il pas dépasser 1 ?',
          },
          {
            id: 'pourcentage',
            intitule: 'Écrire la part en pourcentage',
            raisonnement:
              '0,275 = 27,5 ÷ 100 = 27,5 %. « 0,275 » et « 27,5 % » sont le même nombre ; « 27,5 » écrit seul est cent fois trop grand.',
            invite: 'Comment s’écrit 8 % sous forme décimale ?',
          },
          {
            id: 'part-conservee',
            intitule: 'Conserver la part quand le total change',
            raisonnement:
              'L’an prochain, le chiffre d’affaires prévu est de 560 000 €, avec la même part de traiteur : 560 000 × 0,275 = 154 000 €. Ajouter au traiteur les 80 000 € de hausse du total (212 000 €) serait un raisonnement additif : on conserve le rapport, pas l’écart.',
            invite:
              'Si le chiffre d’affaires total doublait, que deviendrait le chiffre d’affaires du traiteur ?',
          },
        ],
      },
    },
    {
      id: 'E-M1-A-TOI',
      brique: 'fp-numeric',
      dureeMinutes: 4,
      concepts: ['proportion'],
      seuil: SEUIL_PAR_DEFAUT,
      notes: `[4 min · minutes 21 à 25 · mode piloté, seuil 70 %] À leur tour, seuls : 2 min de calcul. Consigne : ${CONSIGNE_CALCULATRICE}. Surveillez le tableau de bord. Erreur attendue : 0,275 au lieu de 27,5 (facteur 100). Sous 70 % de réussite, affichez une réponse erronée anonyme et refaites l’étape 3 de l’exemple précédent. 1 min de correction : partie ÷ tout × 100.`,
      question: QUESTION_M1_PART,
    },
    {
      id: 'E-M1-POURCENTAGE',
      brique: 'fp-concept4',
      dureeMinutes: 5,
      concepts: ['pourcentage'],
      modalite: 'classe',
      notes:
        '[5 min · minutes 25 à 30 · mode piloté] Chemin inverse : on connaît le pourcentage, on cherche la quantité. Réglez 2 400 € et 35 % : faites prédire le résultat avant de le montrer (840 €). Puis 100 % (le montant entier), 50 % (la moitié), 1 % (un centième). Question à poser : « 70 % de 2 400 €, c’est 2 400 multiplié par combien ? » Attendez 0,7. Relance : « et si on oublie de diviser par 100 ? » Cet écran est la remédiation du facteur 100 : revenez-y dès qu’un résultat est cent fois trop grand ou trop petit.',
      proprietes: {
        parametres: [
          {
            cle: 'montant',
            libelle: 'Montant de référence (€)',
            min: 100,
            max: 10000,
            pas: 100,
            defaut: 2400,
          },
          {
            cle: 'taux',
            libelle: 'Pourcentage (%)',
            min: 0,
            max: 100,
            pas: 0.5,
            defaut: 35,
          },
        ],
        formuleLatexSimplifie: 'montant × taux ÷ 100',
        calcul: 'montant*taux/100',
        phrase:
          '{taux} % de {montant} €, c’est {montant} × {taux} ÷ 100, soit {resultat} €.',
      },
    },
    {
      id: 'E-M1-PIVOT',
      brique: 'fp-vote',
      dureeMinutes: 5,
      concepts: ['pourcentage'],
      seuil: SEUIL_PAR_DEFAUT,
      notes:
        '[5 min · minutes 30 à 35 · mode piloté, seuil 70 %] 0’–1’ : vote individuel, sans discussion. Au-dessus de 70 % : validez en 30 secondes et passez à la pratique. Entre 30 % et 70 % : 2 min de discussion en binôme (« convainquez votre voisin »), puis revote. Sous 30 % : réexpliquez directement avec l’écran « pourcentage d’une quantité ». Erreurs attendues, pour une marge de 70 % : =B2*70 (taux pris pour la valeur, résultat cent fois trop grand) et =B2*1,7 (coefficient d’une hausse pris pour une part).',
      question: QUESTION_M1_PIVOT,
    },
    {
      id: 'E-M1-PRATIQUE',
      brique: 'questionnaire',
      dureeMinutes: 21,
      concepts: ['proportion', 'pourcentage'],
      regime: 'ouvert',
      notes:
        '[21 min · minutes 35 à 56 · mode libre sur cet écran] Passez en mode libre : cinq questions, chiffres et ordre propres à chacun, correction immédiate. Consigne : écrire le calcul posé avant de saisir le résultat. 0’–15’ : travail individuel ; repérez au tableau de bord la confusion dominante. 15’–19’ : correction collective de la question la plus ratée, expliquée par un volontaire qui l’a réussie. 19’–21’ : repassez en mode piloté. Pièges attendus : oubli de la division par 100 ; multiplication au lieu de division pour retrouver un total ; même écart en euros ajouté au lieu de conserver la proportion ; progressions données en euros au lieu de pourcentages. Pour les plus rapides : « inventez une question piège pour votre voisin ».',
      questions: [
        QUESTION_M1_POURCENTAGE,
        QUESTION_M1_TOTAL,
        QUESTION_M1_PROPORTION,
        QUESTION_M1_DEUX_CLIENTS,
        QUESTION_M1_PART_CHARGES,
      ],
    },
    {
      id: 'E-M1-ANCRAGE',
      brique: 'fp-recall',
      dureeMinutes: 4,
      concepts: ['proportion'],
      seuil: SEUIL_PAR_DEFAUT,
      notes:
        '[4 min · minutes 56 à 60 · mode piloté] Rappel sans notes : 8 secondes de réflexion, puis vote. Sous 70 % : reprenez l’étape 4 de l’exemple « part d’un total » (1 min). Faites formuler la synthèse par la classe : « une part se calcule partie ÷ tout ; elle se conserve en multipliant, jamais en ajoutant le même écart ». Fin du mouvement 1 : pause de 10 minutes. Reprise à l’heure dite, sur l’accroche du mouvement 2.',
      question: QUESTION_M1_ANCRAGE,
    },
    {
      id: 'E-M2-ACCROCHE',
      brique: 'fp-story',
      dureeMinutes: 2,
      concepts: ['taux-evolution', 'evolution-reciproque'],
      modalite: 'classe',
      notes:
        '[2 min · minutes 60 à 62 · mode piloté] L’écran affiche toute l’histoire d’un coup : posez la question avant de passer à l’écran. « Un indice boursier perd 78 % : de combien doit-il remonter pour revenir à son niveau ? » Laissez répondre « 78 % » sans corriger, puis passez à l’écran et racontez sans lire. Phrase-clé à écrire au tableau : un taux se calcule toujours sur la valeur de départ.',
      proprietes: {
        titre: 'Le Nasdaq, ou pourquoi −78 % ne se rattrape pas avec +78 %',
        paragraphes: [
          'Le 10 mars 2000, le Nasdaq Composite, indice boursier américain à forte dominante technologique, clôture à environ 5 050 points. Le 9 octobre 2002, après l’éclatement de la bulle internet, il clôture à environ 1 114 points : une chute de près de 78 %.',
          'Une remontée de 78 % n’aurait ramené l’indice qu’à environ 1 980 points. Pour retrouver 5 050 points, il fallait multiplier 1 114 par plus de 4,5, soit une hausse de plus de 350 %. L’indice n’a retrouvé son niveau de mars 2000 qu’en avril 2015.',
          'Les mêmes 3 900 points environ valent −78 % à la descente et +350 % à la remontée : un taux d’évolution dépend de la valeur de départ à laquelle on rapporte l’écart.',
        ],
      },
    },
    {
      id: 'E-M2-TAUX',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['taux-evolution'],
      modalite: 'classe',
      notes:
        '[4 min · minutes 62 à 66 · mode piloté] Exemple résolu, une étape à la fois. Étape 1 : faites dire par un volontaire quelle année est le départ. Étape 2 : 30 000 € est un écart, pas un taux. Étape 3 : écrivez la formule au tableau, (arrivée − départ) ÷ départ. Étape 4 : montrez le contre-calcul 30 000 ÷ 270 000 = 11,1 %, faux. Étape 5 : vérifiez par le coefficient, 240 000 × 1,125. Cet écran est la remédiation de la division par l’arrivée et de l’écart en euros : revenez-y depuis le pivot ou la pratique si le seuil n’est pas atteint.',
      proprietes: {
        enonce:
          'Le chiffre d’affaires d’un client du cabinet passe de 240 000 € en N-1 à 270 000 € en N. Quel est son taux d’évolution ?',
        etapes: [
          {
            id: 'depart-arrivee',
            intitule: 'Repérer le départ et l’arrivée',
            raisonnement:
              'L’évolution se lit dans le temps : N-1 est la valeur de départ (240 000 €), N la valeur d’arrivée (270 000 €).',
            invite:
              'Pour l’évolution entre N et N+1, quelle serait la valeur de départ ?',
          },
          {
            id: 'ecart',
            intitule: 'Calculer l’écart en valeur',
            raisonnement:
              'Arrivée − départ = 270 000 − 240 000 = 30 000 €. C’est une variation en euros : elle ne dit pas encore si la hausse est forte ou faible.',
            invite:
              'Une hausse de 30 000 € est-elle forte pour un client qui réalise 5 millions d’euros de chiffre d’affaires ?',
          },
          {
            id: 'rapport',
            intitule: 'Rapporter l’écart à la valeur de départ',
            raisonnement:
              '30 000 ÷ 240 000 = 0,125. On divise toujours par la valeur de départ, celle à laquelle on se compare.',
            invite: 'Pourquoi ne divise-t-on pas par 270 000 € ?',
          },
          {
            id: 'pourcentage',
            intitule: 'Exprimer le taux en pourcentage',
            raisonnement:
              '0,125 × 100 = 12,5 : le taux d’évolution est de +12,5 %. Diviser par l’arrivée donnerait 30 000 ÷ 270 000 ≈ 11,1 %, un taux faux.',
            invite:
              'Quel serait le taux si le chiffre d’affaires était passé de 270 000 € à 240 000 € ?',
          },
          {
            id: 'verification',
            intitule: 'Vérifier avec le coefficient multiplicateur',
            raisonnement:
              'Une hausse de 12,5 % correspond au coefficient 1 + 12,5 ÷ 100 = 1,125, et 240 000 × 1,125 = 270 000 € : le calcul est juste.',
            invite: 'Quel coefficient correspond à une baisse de 12,5 % ?',
          },
        ],
      },
    },
    {
      id: 'E-M2-PIVOT',
      brique: 'fp-numeric',
      dureeMinutes: 5,
      concepts: ['taux-evolution'],
      seuil: SEUIL_PAR_DEFAUT,
      notes: `[5 min · minutes 66 à 71 · mode piloté, seuil 70 %] 0’–2’ : calcul individuel. Consigne : ${CONSIGNE_CALCULATRICE}. Rappelez : taux négatif pour une baisse, arrondi à 0,1 %. 2’–3’ : lisez le résultat. Au-dessus de 70 % : correction éclair, puis le coefficient. Sinon, suivez l’erreur dominante : division par l’arrivée → étape 4 de l’exemple résolu ; écart en euros → étape 2 ; résultat en 0,… → rappel du × 100 ; résultat autour de 100 → c’est le coefficient × 100, annoncez l’écran suivant. 3’–5’ : binômes pour expliquer l’erreur, puis correction collective.`,
      question: QUESTION_M2_PIVOT,
    },
    {
      id: 'E-M2-COEFFICIENT',
      brique: 'fp-concept4',
      dureeMinutes: 5,
      concepts: ['coefficient-multiplicateur'],
      modalite: 'classe',
      notes:
        '[5 min · minutes 71 à 76 · mode piloté] Faites varier le taux et lire le coefficient à voix haute : +15 % → 1,15 ; +100 % → 2 ; −20 % → 0,8 ; −100 % → 0. Question à poser : « quel taux donne un coefficient de 0,93 ? » (−7 %). Relance : « un coefficient de 1,15, est-ce une hausse de 1,15 % ? » Sur le graphique, le coefficient vaut 1 pour 0 % : au-dessus de 1, hausse ; en dessous, baisse. Exemple métier : prix HT × 1,2 = prix TTC avec une TVA à 20 %. Cet écran est la remédiation de la confusion entre coefficient et taux.',
      proprietes: {
        parametres: [
          {
            cle: 'taux',
            libelle: 'Taux d’évolution (%)',
            min: -100,
            max: 100,
            pas: 1,
            defaut: 15,
          },
        ],
        formuleLatexSimplifie: '1 + taux ÷ 100',
        calcul: '1+taux/100',
        phrase:
          'Une évolution de {taux} % revient à multiplier par le coefficient {resultat}.',
      },
    },
    {
      id: 'E-M2-PRATIQUE',
      brique: 'questionnaire',
      dureeMinutes: 25,
      concepts: ['taux-evolution', 'coefficient-multiplicateur'],
      regime: 'ouvert',
      notes:
        '[25 min · minutes 76 à 101 · mode libre sur cet écran] Six questions : prix après hausse, taux lu sur un coefficient, chiffre d’affaires avant une hausse, coefficient entre deux montants, lecture d’un coefficient, taux à partir d’un gain. Consigne : écrire le coefficient avant tout résultat. 0’–18’ : travail individuel ; au tableau de bord, repérez qui répond 115 ou 0,15 au lieu de 1,15. 18’–23’ : correction collective de la question « avant la hausse » : on divise par le coefficient, on ne retire pas le même pourcentage ; vérifiez en remultipliant. 23’–25’ : repassez en mode piloté.',
      questions: [
        QUESTION_M2_VALEUR_ARRIVEE,
        QUESTION_M2_TAUX_DU_COEFFICIENT,
        QUESTION_M2_VALEUR_DEPART,
        QUESTION_M2_COEFFICIENT_ENTRE,
        QUESTION_M2_LECTURE_COEFFICIENT,
        QUESTION_M2_TAUX_DU_GAIN,
      ],
    },
    {
      id: 'E-M2-ANCRAGE',
      brique: 'fp-recall',
      dureeMinutes: 4,
      concepts: ['taux-evolution'],
      seuil: SEUIL_PAR_DEFAUT,
      notes:
        '[4 min · minutes 101 à 105 · mode piloté] Rappel : 8 secondes sans options, puis vote. Faites justifier la bonne option en une phrase par un volontaire : « on divise l’écart par la valeur de départ, puis on multiplie par 100 ». Sous 70 % : 2 min sur l’étape 3 de l’exemple résolu du taux. Fin du mouvement 2 : pause de 10 minutes.',
      question: QUESTION_M2_ANCRAGE,
    },
    {
      id: 'E-M3-GRAPHIQUE',
      brique: 'fp-plot',
      dureeMinutes: 5,
      concepts: ['evolutions-successives'],
      modalite: 'classe',
      notes:
        '[5 min · minutes 105 à 110 · mode piloté] Le graphique montre les deux courbes d’emblée : posez la question avant de passer à l’écran. « Après dix hausses successives de 10 %, le chiffre d’affaires a-t-il doublé, plus que doublé ou moins ? » Passez ensuite à l’écran, réglez 200 000 € et +10 % par an, et montrez l’écart au bout de 10 ans : environ 518 750 € avec les coefficients multipliés, 400 000 € avec les taux additionnés. Passez à −10 % : la droite des taux additionnés tombe à 0 € au bout de 10 ans, la courbe ne s’annule jamais. Message : on multiplie les coefficients, on n’additionne pas les taux. Annoncez que le mouvement 3 mélange tout : l’enjeu est de reconnaître quelle formule appliquer.',
      proprietes: {
        abscisse: { libelle: 'Nombre d’années', min: 0, max: 10 },
        ordonnee: 'Chiffre d’affaires (€)',
        parametres: [
          {
            cle: 'ca',
            libelle: 'Chiffre d’affaires de départ (€)',
            min: 50000,
            max: 500000,
            pas: 10000,
            defaut: 200000,
          },
          {
            cle: 'taux',
            libelle: 'Taux d’évolution annuel (%)',
            min: -10,
            max: 30,
            pas: 1,
            defaut: 10,
          },
        ],
        series: [
          {
            id: 'coefficients-multiplies',
            libelle: 'Coefficients multipliés : ca × (1 + taux ÷ 100) ^ x',
            trait: 'plein',
            calcul: 'ca*(1+taux/100)^x',
          },
          {
            id: 'taux-additionnes',
            libelle: 'Taux additionnés : ca × (1 + x × taux ÷ 100)',
            trait: 'tirets',
            calcul: 'ca*(1+x*taux/100)',
          },
        ],
      },
    },
    {
      id: 'E-M3-PIVOT-SUCCESSIVES',
      brique: 'fp-vote',
      dureeMinutes: 5,
      concepts: ['evolutions-successives'],
      seuil: SEUIL_PAR_DEFAUT,
      notes: `[5 min · minutes 110 à 115 · mode piloté, seuil 70 %] 0’–1’ : vote individuel. Consigne : ${CONSIGNE_CALCULATRICE}. Au-dessus de 70 % : faites dicter par un volontaire la démarche en trois gestes (coefficients, produit, retour au taux) et avancez. Entre 30 % et 70 % : 2 min de binômes, puis revote. Sous 30 %, ou si « taux additionnés » domine encore après le revote : allez à l’écran de remédiation « évolutions successives » de la clôture, puis revenez. Piège secondaire : le coefficient global lu comme un taux (plus de 100 %).`,
      question: QUESTION_M3_PIVOT_SUCCESSIVES,
    },
    {
      id: 'E-M3-PIVOT-RECIPROQUE',
      brique: 'fp-numeric',
      dureeMinutes: 5,
      concepts: ['evolution-reciproque'],
      seuil: SEUIL_PAR_DEFAUT,
      notes: `[5 min · minutes 115 à 120 · mode piloté, seuil 70 %] 0’–2’ : calcul individuel. Consigne : ${CONSIGNE_CALCULATRICE}. Rappelez l’histoire du Nasdaq : après −78 %, +78 % ne suffit pas. 2’–4’ : correction ; on cherche le coefficient qui annule la hausse, 1 ÷ coefficient, puis on revient au taux. Sous 70 % : allez à l’écran de remédiation « évolution réciproque » de la clôture, faites manipuler le curseur 2 min, puis revenez. Erreurs attendues : le même taux en sens inverse ; un résultat entre 60 et 100 (1 ÷ coefficient × 100 lu comme un taux) ; un résultat en −0,… (oubli du × 100).`,
      question: QUESTION_M3_PIVOT_RECIPROQUE,
    },
    {
      id: 'E-M3-PRATIQUE',
      brique: 'questionnaire',
      dureeMinutes: 30,
      concepts: [
        'proportion',
        'pourcentage',
        'taux-evolution',
        'coefficient-multiplicateur',
        'evolutions-successives',
        'evolution-reciproque',
      ],
      regime: 'ouvert',
      notes:
        '[30 min · minutes 120 à 150 · mode libre sur cet écran] Neuf questions mélangées : proportion, pourcentage, taux, coefficient, évolutions successives, réciproque, TVA. Annoncez-le : « la difficulté n’est plus de calculer, c’est de reconnaître quelle formule appliquer ; le score sera plus bas qu’en pratique groupée, et c’est ce mélange qui fait retenir ». Consigne : avant chaque calcul, écrire en marge le type de situation. 0’–22’ : travail individuel. 22’–28’ : correction collective des deux questions les plus ratées au tableau de bord, en commençant toujours par « quel type de situation ? ». 28’–30’ : repassez en mode piloté. Fin du mouvement 3 : pause de 10 minutes.',
      questions: [
        QUESTION_M3_PROPORTION,
        QUESTION_M3_HAUSSE_BAISSE,
        QUESTION_M3_TAUX_GLOBAL,
        QUESTION_M3_RECIPROQUE,
        QUESTION_M3_TVA,
        QUESTION_M3_TAUX,
        QUESTION_M3_POURCENTAGE,
        QUESTION_M3_VOTE_HAUSSE_BAISSE,
        QUESTION_M3_COEFFICIENT_GLOBAL,
      ],
    },
    {
      id: 'E-M4-CABINET',
      brique: 'fp-pro',
      dureeMinutes: 4,
      concepts: ['evolutions-successives', 'taux-moyen'],
      modalite: 'classe',
      notes:
        '[4 min · minutes 150 à 154 · mode piloté] Mettez la classe en situation de collaborateur. Écrivez au tableau : coefficient global = CA N ÷ CA N-2 ; taux moyen annuel sur deux ans = (coefficient global ^ (1/2) − 1) × 100. Faites vérifier à la calculatrice de poche : +6 % puis +6 % donne 1,06 × 1,06 = 1,1236, et 1,1236 ^ (1/2) = 1,06. Montrez la touche racine ou la puissance 0,5. Prévenez : chaque question du questionnaire est un dossier client différent, les chiffres changent d’une question à l’autre, c’est voulu ; la correction se fera sur un dossier de référence commun, écrit au tableau.',
      proprietes: {
        metier: 'Collaborateur comptable, revue annuelle des dossiers',
        situation:
          'Avant les rendez-vous de bilan, le chef de mission vous confie plusieurs dossiers clients. Pour chacun, vous disposez du chiffre d’affaires des trois derniers exercices : N-2, N-1 et N.',
        geste:
          'Pour chaque dossier, vous posez les coefficients multiplicateurs annuels, puis vous calculez le taux d’évolution de la dernière année, le coefficient et le taux globaux de N-2 à N, le taux moyen annuel ((CA N ÷ CA N-2) ^ (1/2) − 1) × 100, et le taux qui ramènerait le chiffre d’affaires de N à son niveau de N-1.',
        consequence:
          'Ces indicateurs ouvrent la note de synthèse remise au client et le prévisionnel présenté à sa banque. Un taux moyen calculé comme la moyenne des deux taux annuels donne une image trop favorable dès que ces taux diffèrent.',
      },
    },
    {
      id: 'E-M4-DOSSIERS',
      brique: 'questionnaire',
      dureeMinutes: 26,
      concepts: [
        'taux-evolution',
        'evolutions-successives',
        'taux-moyen',
        'evolution-reciproque',
      ],
      regime: 'focus',
      notes: `[26 min · minutes 154 à 180 · mode piloté, régime focus] 0’–1’ : annoncez le régime focus avant de lancer : plein écran, copier-coller bloqué, toute sortie de la fenêtre journalisée. Consigne : ${CONSIGNE_CALCULATRICE}. 1’–20’ : six dossiers, travail individuel. Consigne de méthode : pour chaque dossier, poser les deux coefficients annuels avant tout calcul. Surveillez au tableau de bord trois confusions : taux moyen pris comme la moyenne des taux (taux additionnés), coefficient global rendu comme un taux, taux réciproque pris égal au taux annuel. 20’–26’ : correction orale sur le dossier de référence, écrit au tableau, chaque étape proposée par un volontaire. Boulangerie Lemoine : chiffre d’affaires de 330 000 € en N-2, 405 900 € en N-1, 438 372 € en N. Coefficients annuels : 405 900 ÷ 330 000 = 1,23 et 438 372 ÷ 405 900 = 1,08. Taux entre N-1 et N : +8 %. Coefficient global : 1,23 × 1,08 = 1,3284 (1,328 au millième). Taux global : +32,84 % (32,8 %), et non 23 + 8 = 31 %. Taux moyen annuel : 1,3284 ^ (1/2) ≈ 1,1526, soit +15,26 % (15,3 %), et non (23 + 8) ÷ 2 = 15,5 %. Taux qui ramènerait N au niveau de N-1 : 1 ÷ 1,08 − 1 ≈ −7,41 % (−7,4 %), et non −8 %.`,
      questions: [
        QUESTION_M4_TAUX_ANNUEL,
        QUESTION_M4_COEFFICIENT_GLOBAL,
        QUESTION_M4_TAUX_GLOBAL,
        QUESTION_M4_TAUX_MOYEN,
        QUESTION_M4_RECIPROQUE,
        QUESTION_M4_AFFIRMATION,
      ],
    },
    {
      id: 'E-CLO-SUCCESSIVES',
      brique: 'fp-worked',
      dureeMinutes: 3,
      concepts: ['evolutions-successives', 'taux-moyen'],
      modalite: 'classe',
      notes:
        '[3 min · minutes 180 à 183 · mode piloté] Écran de remédiation des taux additionnés et de la hausse suivie d’une baisse de même taux, appelé depuis le pivot du mouvement 3 si besoin. En clôture, déroulez-le en entier seulement si le tableau de bord du mouvement 4 montre encore ces confusions ; sinon, faites-le résumer en 30 secondes par un volontaire. Invite clé : « pourquoi la baisse de 20 % retire-t-elle plus d’euros que la hausse de 20 % n’en a ajouté ? »',
      proprietes: {
        enonce:
          'Le chiffre d’affaires d’un client augmente de 20 % en N-1, puis baisse de 20 % en N. A-t-il retrouvé son niveau de N-2 ?',
        etapes: [
          {
            id: 'coefficients',
            intitule: 'Traduire chaque évolution en coefficient',
            raisonnement:
              'Une hausse de 20 % correspond au coefficient 1,2 ; une baisse de 20 % au coefficient 0,8.',
            invite: 'Quel coefficient traduit une baisse de 35 % ?',
          },
          {
            id: 'produit',
            intitule: 'Multiplier les coefficients',
            raisonnement:
              'Le coefficient global vaut 1,2 × 0,8 = 0,96, et non 1 + 0,20 − 0,20 = 1. La baisse s’applique à un chiffre d’affaires déjà augmenté : elle retire plus d’euros que la hausse n’en a ajouté.',
            invite:
              'Pour 100 000 € au départ, combien d’euros la hausse ajoute-t-elle, et combien la baisse en retire-t-elle ?',
          },
          {
            id: 'taux-global',
            intitule: 'Revenir au taux global',
            raisonnement:
              '0,96 − 1 = −0,04 : le chiffre d’affaires a baissé de 4 % sur les deux ans. Additionner les taux (+20 − 20 = 0 %) conclut à tort à un retour au départ.',
            invite:
              'Une baisse de 20 % suivie d’une hausse de 20 % donne-t-elle un autre résultat ?',
          },
          {
            id: 'taux-moyen',
            intitule: 'Appliquer la même idée au taux moyen',
            raisonnement:
              'Avec +2 % puis +10 %, le coefficient global est 1,02 × 1,10 = 1,122. Le taux moyen annuel est le taux qui, appliqué deux fois, donne ce coefficient : 1,122 ^ (1/2) ≈ 1,0592, soit +5,92 % par an. La moyenne des taux, (2 + 10) ÷ 2 = 6 %, est trop forte : elle additionne les taux au lieu de multiplier les coefficients.',
            invite: 'Vérifiez : 1,0592 × 1,0592 redonne-t-il bien 1,122 ?',
          },
        ],
      },
    },
    {
      id: 'E-CLO-RECIPROQUE',
      brique: 'fp-concept4',
      dureeMinutes: 3,
      concepts: ['evolution-reciproque'],
      modalite: 'classe',
      notes:
        '[3 min · minutes 183 à 186 · mode piloté] Écran de remédiation du taux réciproque, appelé depuis le pivot du mouvement 3 si besoin. Placez le curseur sur +25 % (retour −20 %), −20 % (retour +25 %), −50 % (retour +100 %), −60 % (retour +150 %), en faisant prédire chaque résultat par la classe. Question : « pourquoi faut-il plus de 100 % de hausse pour effacer une baisse de 60 % ? » Faites le lien avec le Nasdaq. Si le temps manque, gardez seulement le cas −50 % / +100 %.',
      proprietes: {
        parametres: [
          {
            cle: 'taux',
            libelle: 'Évolution subie (%)',
            min: -60,
            max: 150,
            pas: 1,
            defaut: 25,
          },
        ],
        formuleLatexSimplifie: '(1 ÷ (1 + taux ÷ 100) − 1) × 100',
        calcul: '(1/(1+taux/100)-1)*100',
        phrase:
          'Après une évolution de {taux} %, il faut une évolution de {resultat} % pour revenir à la valeur de départ.',
      },
    },
    {
      id: 'E-CLO-EXIT',
      brique: 'fp-exit',
      dureeMinutes: 9,
      concepts: ['evolutions-successives'],
      notes:
        '[9 min · minutes 186 à 195 · mode piloté] 0’–2’ : synthèse orale, trois phrases proposées par des volontaires et écrites au tableau (un taux se calcule sur la valeur de départ ; une évolution de t % correspond au coefficient 1 + t ÷ 100 ; les coefficients se multiplient, les taux ne s’additionnent pas). 2’–5’ : billet de sortie en silence, noté sur la participation. 5’–7’ : question « qu’est-ce qui reste flou ? » ; le serveur ne recueille pas encore la réponse libre, faites-la écrire sur papier ou prenez trois réponses de volontaires à l’oral. 7’–9’ : comparez le résultat du billet au rappel d’ouverture et à la question d’évolutions successives du sas, puis annoncez que la prochaine séance ouvrira sur les points restés flous.',
      question: QUESTION_EXIT,
      invite:
        'Qu’est-ce qui reste flou pour vous sur les pourcentages, les taux ou les coefficients multiplicateurs ?',
    },
  ]),
  remediations: {
    'raisonnement-additif': 'E-M1-PART',
    'taux-valeur-facteur-cent': 'E-M1-POURCENTAGE',
    'base-arrivee': 'E-M2-TAUX',
    'ecart-absolu-au-lieu-du-taux': 'E-M2-TAUX',
    'coefficient-confondu-avec-taux': 'E-M2-COEFFICIENT',
    'taux-successifs-additionnes': 'E-CLO-SUCCESSIVES',
    'hausse-baisse-symetriques': 'E-CLO-SUCCESSIVES',
    'reciproque-meme-taux': 'E-CLO-RECIPROQUE',
  },
  derogations: [],
};
