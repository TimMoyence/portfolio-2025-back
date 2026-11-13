import {
  enEuros,
  enPourcent,
  nombreFrancais,
} from '../../../../../../common/domain/nombres/ecriture-francaise';
import { exigerAuMoinsUn } from '../../../../../../common/domain/objets/au-moins-un';
import type { ConceptId } from '../../../../domain/cours/banque/concepts';
import type { ConfusionId } from '../../../../domain/cours/banque/confusions';
import * as moteur from '../../briques';
import {
  DEFIS_B3_01,
  HISTOIRES_B3_01,
  VALEURS_B3_01,
} from '../b3-01/b3-01.donnees';

export const QUESTIONS_CHIFFREES_B3_03 = [
  'b3-03-a1-paragraphes-vides',
  'b3-03-a1-doubles-espaces',
  'b3-03-a1-titres-1',
  'b3-03-a1-titres-2',
  'b3-03-a2-tirets',
] as const;

type QuestionChiffreeB303 = (typeof QUESTIONS_CHIFFREES_B3_03)[number];

export const VALEURS_B3_03: Readonly<Record<QuestionChiffreeB303, number>> = {
  'b3-03-a1-paragraphes-vides': 31,
  'b3-03-a1-doubles-espaces': 5,
  'b3-03-a1-titres-1': 6,
  'b3-03-a1-titres-2': 9,
  'b3-03-a2-tirets': 4,
};

export const pourcent = (valeur: number): string =>
  enPourcent(Math.abs(valeur));

export const LIGNES_DE_LA_NOTE_B3_03: readonly string[] = [
  'NOTE AU COMITÉ DE DIRECTION',
  'Analyse des ventes du réseau Norvane Équipement, janvier à septembre 2026',
  'De : Nadia Ferrand, directrice commerciale. À : comité de direction. Le 8 décembre 2026.',
  '1. CONTEXTE ET DONNÉES',
  '1.1 Origine des données',
  `L’analyse porte sur l’export des commandes des agences du réseau, de janvier 2025 à septembre 2026.  Après nettoyage, la base compte ${nombreFrancais(VALEURS_B3_01['b3-01-a1-lignes-uniques'], 0)} lignes de commande.`,
  '1.2 Lignes signalées',
  `Au total, ${nombreFrancais(VALEURS_B3_01['b3-01-a1-a-verifier'], 0)} lignes douteuses sont signalées à vérifier.  Aucune n’est corrigée sans validation, aucune n’est supprimée.`,
  '2. LES CHIFFRES CLÉS',
  '2.1 Chiffre d’affaires',
  `De janvier à septembre 2026, le réseau réalise ${enEuros(VALEURS_B3_01['b3-01-a3-ca-2026'])} de chiffre d’affaires HT, en hausse de ${pourcent(VALEURS_B3_01['b3-01-a3-evolution'])} sur les mêmes mois de 2025.`,
  '2.2 Objectifs',
  `Au total, ${nombreFrancais(VALEURS_B3_01['b3-01-a3-agences-sous-objectif'], 0)} agences restent sous leur objectif cumulé.  Rennes atteint ${pourcent(VALEURS_B3_01['b3-01-a3-atteinte-rennes'])} de ses objectifs de janvier à septembre, le taux le plus bas du réseau.`,
  '2.3 Taux de marque',
  `Marseille dégage un taux de marque de ${pourcent(VALEURS_B3_01['b3-01-a3-marge-marseille'])} en 2026, contre ${pourcent(HISTOIRES_B3_01['taux-de-marge-marseille-2025'])} sur les mêmes mois de 2025, alors que son chiffre d’affaires dépasse l’objectif.`,
  '3. DÉLAIS ET RETARDS',
  '3.1 Délai médian',
  `À Strasbourg, le délai médian de livraison passe de ${nombreFrancais(HISTOIRES_B3_01['delai-median-strasbourg-2025'], 0)} jours ouvrés en 2025 à ${nombreFrancais(VALEURS_B3_01['b3-01-a2-delai-strasbourg'], 0)} en 2026.  Celui du réseau reste à ${nombreFrancais(HISTOIRES_B3_01['delai-median-reseau-2026'], 0)}.`,
  '3.2 Retards',
  `En 2026, ${nombreFrancais(VALEURS_B3_01['b3-01-a2-retards'], 0)} lignes de commande sont livrées après leur date promise.`,
  '4. CE QUE DISENT LES DONNÉES',
  `- Marseille : ${nombreFrancais(DEFIS_B3_01['remises-marseille'], 0)} lignes portent une remise de plus de 15 %, la marge fond.`,
  `- Rennes : l’informatique recule de ${pourcent(HISTOIRES_B3_01['evolution-informatique-rennes'])}, les autres catégories bougent peu.`,
  `- Lille : le chiffre d’affaires progresse de ${pourcent(HISTOIRES_B3_01['evolution-lille'])}.`,
  '- Strasbourg : les clients attendent leur livraison plus longtemps que dans le reste du réseau.',
  '5. RECOMMANDATIONS',
  '5.1 Les remises de Marseille',
  'Dès janvier, toute remise au-delà de 10 % est validée par la direction ; le contrôle est confié au responsable de l’agence de Marseille.',
  '5.2 Les livraisons de Strasbourg',
  'D’ici mars, le responsable de Strasbourg traite le transport et le stock avant de perdre ses clients.',
  '6. ANNEXE : MÉTHODE',
  'Les chiffres de cette note viennent du classeur de reprise nettoyé.  Chaque taux est un ratio de sommes, chaque délai une médiane, sur la même période que sa comparaison.',
];

export const NOTE_B3_03 = {
  publique: '/assets/cours/b3-03/B3-03_note_comite.8d11b9c3.txt',
  reservee: 'b3-03/B3-03_note_comite.8d11b9c3.txt',
} as const;

const LIBELLE_DE_LA_NOTE = 'Note brute de Nadia Ferrand (texte)';

export const NOTE_A_TELECHARGER = {
  pieceJointe: { libelle: LIBELLE_DE_LA_NOTE, fichier: NOTE_B3_03.publique },
};

export const NOTE_RESERVEE = {
  libelle: LIBELLE_DE_LA_NOTE,
  classeur: NOTE_B3_03.reservee,
  reprend: [],
};

const occurrences = (motif: string): number =>
  LIGNES_DE_LA_NOTE_B3_03.join('\n').split(motif).length - 1;

export const PIEGES_B3_03 = {
  'b3-03-a1-paragraphes-vides': {
    'recherche-mal-saisie': 2 * VALEURS_B3_03['b3-03-a1-paragraphes-vides'],
  },
  'b3-03-a1-doubles-espaces': {
    'recherche-mal-saisie': occurrences(' '),
  },
  'b3-03-a1-titres-1': {
    'niveaux-de-titre-confondus':
      VALEURS_B3_03['b3-03-a1-titres-1'] + VALEURS_B3_03['b3-03-a1-titres-2'],
  },
  'b3-03-a1-titres-2': { 'niveaux-de-titre-confondus': 0 },
  'b3-03-a2-tirets': { 'recherche-mal-saisie': occurrences('-') },
} as const satisfies Readonly<
  Record<QuestionChiffreeB303, Readonly<Partial<Record<ConfusionId, number>>>>
>;

const CONSIGNE_DE_SAISIE = 'Saisissez le nombre seul.';

export interface Comptage {
  readonly valeur: number;
  readonly pieges: Readonly<Partial<Record<ConfusionId, number>>>;
}

export function questionDeComptage(
  id: string,
  concept: ConceptId,
  question: string,
  unite: string,
  { valeur, pieges }: Comptage,
) {
  return moteur.numerique(
    id,
    concept,
    `${question} ${CONSIGNE_DE_SAISIE}`,
    unite,
    valeur,
    moteur.TOLERANCE_NULLE,
    `${valeur} ${unite}`,
    exigerAuMoinsUn(
      (Object.entries(pieges) as [ConfusionId, number][]).map(
        ([confusion, piege]) => [piege, confusion] as const,
      ),
      `Comptage sans piège : ${id}`,
    ),
  );
}

export const questionChiffreeDe =
  <Id extends string>(
    valeurs: Readonly<Record<Id, number>>,
    pieges: Readonly<Record<Id, Comptage['pieges']>>,
  ) =>
  (id: Id, concept: ConceptId, question: string, unite: string) =>
    questionDeComptage(id, concept, question, unite, {
      valeur: valeurs[id],
      pieges: pieges[id],
    });

export const questionChiffreeB303 = questionChiffreeDe<QuestionChiffreeB303>(
  VALEURS_B3_03,
  PIEGES_B3_03,
);
