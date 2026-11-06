import {
  ecartTypePopulation,
  mediane,
  moyenne,
  somme,
} from '../../../../../../common/domain/nombres/statistiques';
import { auDixieme } from '../../../../../../common/domain/nombres/arrondi';
import {
  exigerAuMoinsUn,
  type AuMoinsUn,
} from '../../../../../../common/domain/objets/au-moins-un';
import type { ConceptId } from '../../../../domain/cours/banque/concepts';
import {
  creerRng,
  creerTirage,
} from '../../../../domain/cours/tirage/Aleatoire';
import type { ConfusionId } from '../../../../domain/cours/banque/confusions';
import { BOUTIQUES } from '../b1-01/b1-01.donnees';
import * as moteur from '../../briques';
import {
  colonneDeValeurs,
  gesteDeRecopieVersLaDroite,
  ligneRecopiee,
  piegeDeLArrondi,
} from '../../feuilles';

export const CONCEPTS_DU_COURS = [
  'tableau-croise-dynamique',
  'pourcentage',
  'moyenne-ponderee',
  'moyenne',
  'mediane',
  'quartiles',
  'ecart-type',
  'dispersion',
  'boite-a-moustaches',
  'choix-du-resume',
  'tableur',
] as const satisfies readonly ConceptId[];

export const SYNTHESE_ERRONEE = 'synthese-des-valeurs-erronee';
export const SANS_TRI = 'mediane-sans-tri';
export const MEDIANE_PAIRE = 'mediane-rang-pair';
export const MOYENNE_POUR_MEDIANE = 'moyenne-lue-comme-mediane';
export const EXTREME_IGNOREE = 'valeur-extreme-ignoree';
export const RANG_PAR_DEFAUT = 'rang-de-quartile-arrondi-par-defaut';
export const MOITIE_DE_MEDIANE = 'quartile-moitie-de-mediane';
export const ECHANTILLON = 'ecart-type-population-echantillon';
export const ETENDUE = 'etendue-prise-pour-dispersion';
export const MEME_MOYENNE = 'meme-moyenne-meme-serie';
export const BOITE_EFFECTIF = 'boite-lue-comme-effectif';
export const CENTRE_OUBLIE = 'centre-de-classe-oublie';

export const RENVOI_AU_DOSSIER = 'B1-03-A1-04-DOSSIER';
export const RENVOI_AUX_BOITES = 'B1-03-A3-05-BOITES-CANAUX';

export const CLASSEUR_DES_VENTES = 'b1-03/B1-03_ventes_octobre.b6d11e67.xlsx';

export const CANAUX = ['Boutique', 'Site web', 'Marketplace'] as const;
export type Canal = (typeof CANAUX)[number];
const CATEGORIES = ['Jeu de société', 'Jeu vidéo', 'Accessoire'] as const;

const GRAINE_DES_VENTES = 20_261_103;
export const NOMBRE_DE_VENTES = 240;
const JOURS_D_OCTOBRE = 31;
const COUT_MINIMUM = 8;
const COUT_MAXIMUM = 90;
const PAS_DU_TAUX = 0.05;
const TAUX_DES_CANAUX: Readonly<Record<Canal, readonly [number, number]>> = {
  Boutique: [0.35, 0.65],
  'Site web': [0.15, 0.35],
  Marketplace: [0.1, 0.25],
};
const TIRAGE_DES_CANAUX: AuMoinsUn<Canal> = [
  'Boutique',
  'Boutique',
  'Boutique',
  'Boutique',
  'Boutique',
  'Site web',
  'Site web',
  'Site web',
  'Marketplace',
  'Marketplace',
];

export interface Vente {
  readonly jour: number;
  readonly boutique: string;
  readonly canal: Canal;
  readonly categorie: string;
  readonly ca: number;
  readonly cout: number;
}

function genererLesVentes(): readonly Vente[] {
  const tirage = creerTirage(creerRng(GRAINE_DES_VENTES));
  const ventes = Array.from({ length: NOMBRE_DE_VENTES }, (): Vente => {
    const canal = tirage.choix(TIRAGE_DES_CANAUX);
    const [tauxMinimum, tauxMaximum] = TAUX_DES_CANAUX[canal];
    const cout = tirage.entier(COUT_MINIMUM, COUT_MAXIMUM);
    const taux = tirage.decimal(tauxMinimum, tauxMaximum, PAS_DU_TAUX);
    return {
      jour: tirage.entier(1, JOURS_D_OCTOBRE),
      boutique: tirage.choix(BOUTIQUES),
      canal,
      categorie: tirage.choix(CATEGORIES),
      ca: Math.round(cout * (1 + taux)),
      cout,
    };
  });
  return ventes.sort((gauche, droite) => gauche.jour - droite.jour);
}

export const VENTES_D_OCTOBRE = genererLesVentes();

export const tauxDeMarge = (ca: number, cout: number): number =>
  ((ca - cout) / cout) * 100;
export const tauxDeMarque = (ca: number, cout: number): number =>
  ((ca - cout) / ca) * 100;

export interface LigneDuTcd {
  readonly canal: Canal | 'Total général';
  readonly ventes: number;
  readonly ca: number;
  readonly cout: number;
  readonly moyenneDesTaux: number;
}

function ligneDuTcd(
  canal: LigneDuTcd['canal'],
  ventes: readonly Vente[],
): LigneDuTcd {
  const taux = exigerAuMoinsUn(
    ventes.map(({ ca, cout }) => tauxDeMarge(ca, cout)),
    `aucune vente pour ${canal}`,
  );
  return {
    canal,
    ventes: ventes.length,
    ca: somme(ventes.map(({ ca }) => ca)),
    cout: somme(ventes.map(({ cout }) => cout)),
    moyenneDesTaux: moyenne(taux),
  };
}

export const TCD_DES_CANAUX = CANAUX.map((canal) =>
  ligneDuTcd(
    canal,
    VENTES_D_OCTOBRE.filter((vente) => vente.canal === canal),
  ),
);
export const TOTAL_GENERAL = ligneDuTcd('Total général', VENTES_D_OCTOBRE);

export function ligneDuCanal(canal: Canal): LigneDuTcd {
  const ligne = TCD_DES_CANAUX.find((candidate) => candidate.canal === canal);
  if (ligne === undefined) {
    throw new RangeError(`canal absent du TCD : ${canal}`);
  }
  return ligne;
}

export const SAMEDI_A_ANGERS = [
  ['Boutique', 120, 80],
  ['Site web', 78, 65],
  ['Boutique', 60, 40],
  ['Site web', 42, 35],
  ['Boutique', 120, 80],
  ['Marketplace', 50, 40],
] as const;

function quartileAuRang(
  valeurs: AuMoinsUn<number>,
  quart: 1 | 3,
  arrondirLeRang: (rang: number) => number,
): number {
  const rangees = [...valeurs].sort((gauche, droite) => gauche - droite);
  return rangees[arrondirLeRang((quart * rangees.length) / 4) - 1];
}

export const quartileDuProgramme = (
  valeurs: AuMoinsUn<number>,
  quart: 1 | 3,
): number => quartileAuRang(valeurs, quart, Math.ceil);

export const quartileAuRangInferieur = (
  valeurs: AuMoinsUn<number>,
  quart: 1 | 3,
): number => quartileAuRang(valeurs, quart, Math.floor);

export const PANIERS_DE_LA_MARKETPLACE = [
  33, 12, 45, 28, 95, 20, 38, 25, 30,
] as const;

export const PANIERS_DU_MARDI = [
  15, 42, 28, 33, 21, 36, 26, 150, 31, 24, 35, 19, 40,
] as const;

export const PANIERS_DU_SITE = [
  35, 22, 48, 31, 480, 27, 41, 55, 18, 36, 44, 29, 61, 38, 25, 52, 32, 46, 34,
  39, 42,
] as const;

export const PANIERS_DE_NANTES = [
  33, 41, 28, 36, 50, 31, 38, 44, 26, 35, 39, 30, 46, 37, 32, 42, 24, 52, 34,
  40, 48,
] as const;

export interface ClasseDePaniers {
  readonly debut: number;
  readonly fin: number;
  readonly effectif: number;
}

export const CLASSES_DE_NANTES: AuMoinsUn<ClasseDePaniers> = [
  { debut: 0, fin: 20, effectif: 20 },
  { debut: 20, fin: 40, effectif: 90 },
  { debut: 40, fin: 60, effectif: 70 },
  { debut: 60, fin: 80, effectif: 20 },
];

export function moyenneParClasses(
  classes: AuMoinsUn<ClasseDePaniers>,
  representant: (classe: ClasseDePaniers) => number,
): number {
  return (
    somme(classes.map((classe) => classe.effectif * representant(classe))) /
    somme(classes.map(({ effectif }) => effectif))
  );
}

export const centreDeClasse = ({ debut, fin }: ClasseDePaniers): number =>
  (debut + fin) / 2;

export interface ResumeDUneSerie {
  readonly minimum: number;
  readonly q1: number;
  readonly mediane: number;
  readonly q3: number;
  readonly maximum: number;
  readonly moyenne: number;
  readonly ecartType: number;
  readonly ecartTypeEchantillon: number;
  readonly q1AuRangInferieur: number;
  readonly q3AuRangInferieur: number;
}

export function resumeDe(serie: AuMoinsUn<number>): ResumeDUneSerie {
  const centre = moyenne(serie);
  return {
    minimum: Math.min(...serie),
    q1: quartileDuProgramme(serie, 1),
    mediane: mediane(serie),
    q3: quartileDuProgramme(serie, 3),
    maximum: Math.max(...serie),
    moyenne: centre,
    ecartType: ecartTypePopulation(serie),
    ecartTypeEchantillon: Math.sqrt(
      somme(serie.map((valeur) => (valeur - centre) ** 2)) / (serie.length - 1),
    ),
    q1AuRangInferieur: quartileAuRangInferieur(serie, 1),
    q3AuRangInferieur: quartileAuRangInferieur(serie, 3),
  };
}

export const RESUME_DU_SITE = resumeDe(PANIERS_DU_SITE);
export const RESUME_DE_NANTES = resumeDe(PANIERS_DE_NANTES);

type PiegeDeCellule = readonly [number, ConfusionId];

interface LigneDuResume {
  readonly libelle: string;
  readonly formule: string;
  readonly valeur: (resume: ResumeDUneSerie) => number;
  readonly pieges: (resume: ResumeDUneSerie) => readonly PiegeDeCellule[];
}

const LIGNES_DU_RESUME: readonly LigneDuResume[] = [
  {
    libelle: 'Moyenne (€)',
    formule: '=ARRONDI(MOYENNE(B2:B22);1)',
    valeur: (resume) => auDixieme(resume.moyenne),
    pieges: (resume) => piegeDeLArrondi(resume.moyenne),
  },
  {
    libelle: 'Médiane (€)',
    formule: '=MEDIANE(B2:B22)',
    valeur: (resume) => resume.mediane,
    pieges: (resume) => [[auDixieme(resume.moyenne), MOYENNE_POUR_MEDIANE]],
  },
  {
    libelle: 'Q1 (€)',
    formule: '=QUARTILE(B2:B22;1)',
    valeur: (resume) => resume.q1,
    pieges: (resume) => [[resume.q1AuRangInferieur, RANG_PAR_DEFAUT]],
  },
  {
    libelle: 'Q3 (€)',
    formule: '=QUARTILE(B2:B22;3)',
    valeur: (resume) => resume.q3,
    pieges: (resume) => [[resume.q3AuRangInferieur, RANG_PAR_DEFAUT]],
  },
  {
    libelle: 'Écart type (€)',
    formule: '=ARRONDI(ECARTYPEP(B2:B22);1)',
    valeur: (resume) => auDixieme(resume.ecartType),
    pieges: (resume) => [
      [auDixieme(resume.ecartTypeEchantillon), ECHANTILLON],
      ...piegeDeLArrondi(resume.ecartType),
    ],
  },
  {
    libelle: 'Écart interquartile (€)',
    formule: '=E5-E4',
    valeur: (resume) => resume.q3 - resume.q1,
    pieges: (resume) => [[resume.maximum - resume.minimum, ETENDUE]],
  },
];

const PREMIERE_LIGNE_DU_RESUME = 2;

const CELLULES_DES_PANIERS = {
  A1: 'Panier',
  B1: 'Site web (€)',
  C1: 'Boutique de Nantes (€)',
  E1: 'Site web',
  F1: 'Boutique de Nantes',
  ...colonneDeValeurs(
    'A',
    PANIERS_DU_SITE.map((_, rang) => rang + 1),
  ),
  ...colonneDeValeurs('B', PANIERS_DU_SITE),
  ...colonneDeValeurs('C', PANIERS_DE_NANTES),
  ...colonneDeValeurs(
    'D',
    LIGNES_DU_RESUME.map(({ libelle }) => libelle),
  ),
};

export const PANIERS_AU_TABLEUR = {
  formules: LIGNES_DU_RESUME.map(({ formule }) => formule),
  attendus: exigerAuMoinsUn(
    LIGNES_DU_RESUME.flatMap(({ formule, valeur, pieges }, rang) =>
      ligneRecopiee(
        {
          colonne: 'E',
          premiereLigne: PREMIERE_LIGNE_DU_RESUME + rang,
          formule,
          piegesDuModele: pieges(RESUME_DU_SITE),
          piegesDuRang: () => pieges(RESUME_DE_NANTES),
          tolerance: moteur.TOLERANCE_NULLE,
        },
        [valeur(RESUME_DU_SITE), valeur(RESUME_DE_NANTES)],
      ),
    ),
    'le résumé des paniers attend au moins une cellule',
  ),
  plan: {
    id: 'b1-03-a2-tableur-paniers',
    intitule: 'Exercice 3 — Résumer les paniers au tableur',
    lignes: PANIERS_DU_SITE.length + 1,
    colonnes: 6,
    cellules: CELLULES_DES_PANIERS,
    verrouillees: Object.keys(CELLULES_DES_PANIERS),
    consignes: [
      'Données fictives Partie Libre : toutes les commandes de la dernière semaine de septembre, les 21 du site web en B, les 21 de la boutique de Nantes en C.',
      'En E2 à E7, résumez les paniers du site web : moyenne arrondie au dixième avec ARRONDI, médiane, Q1 et Q3 avec QUARTILE, écart type arrondi au dixième avec ARRONDI et ECARTYPEP, écart interquartile.',
      `Recopiez chaque formule en F pour la boutique : ${gesteDeRecopieVersLaDroite('E2', 'F')}, puis de même depuis E3, E4, E5, E6 et E7.`,
    ],
  },
};
