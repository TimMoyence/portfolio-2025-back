import {
  enEuros,
  enPourcent,
} from '../../../../../../common/domain/nombres/ecriture-francaise';
import { VALEURS_B3_01 } from '../b3-01/b3-01.donnees';
import { REPRISE_NETTOYEE } from './b3-02.acte-1';

import * as moteur from '../../briques';

export const LES_SIX_REGLES = [
  '1. Je relie les tables par un identifiant, jamais par un libellé.',
  '2. Je corrige seul ce qui est faux et certain ; je signale ce qui est douteux, je ne supprime rien.',
  '3. J’écris la période dans chaque critère, la même pour le chiffre et pour sa comparaison.',
  '4. Pour un délai typique je prends la médiane ; pour un taux, le ratio des sommes.',
  '5. J’écris le dénominateur de chaque pourcentage.',
  '6. Je montre la méthode de chaque chiffre et le nombre de lignes retenues.',
] as const;

const COMPRENDRE: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-02-A3-01-VOTE-IA',
      titre: 'Vote : le chiffre d’une IA',
      dureeMinutes: 3,
      concepts: ['ia-analyste'],
      notes: moteur.puces(
        'Temps « réfléchir » de l’IA : vote non noté, 2 min de vote et 1 min de révélation.',
        'Révélation : le 10 est la moyenne des délais ; votre médiane de l’exercice 4 vaut moins. Ni la croire, ni la jeter : comparer et lire la méthode.',
      ),
    },
    [
      moteur.vote(
        'b3-02-a3-chiffre-ia',
        'ia-analyste',
        false,
        'Vous confiez la reprise nettoyée à une IA. Elle annonce : « Délai de livraison de Strasbourg en 2026 : 10 jours ouvrés. » Que faites-vous ?',
        'Je le compare au mien et je lis sa méthode',
        [
          [
            'Je le reprends tel quel : elle a tout calculé',
            'ia-crue-sur-parole',
          ],
          [
            'Je le jette : une IA se trompe toujours',
            'ia-rejetee-sans-comparaison',
          ],
        ],
      ),
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B3-02-A3-02-COURS-IA-ANALYSTE',
      titre: 'Cours : une IA qui analyse vos données',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['ia-analyste'],
      notes: moteur.puces(
        '3 min, enchaînées sur le cahier de règles, puis sur le prompt lancé tous ensemble.',
        'Le formateur lance le prompt sur son propre compte, avec une IA qui exécute du code sur un fichier ; la classe lit et compare.',
      ),
    },
    'lesson',
    {
      title: 'Une IA qui analyse vos données',
      blocks: [
        {
          kind: 'definition',
          title: 'Ce qu’elle fait, ce qu’elle ignore',
          text: 'Une IA d’analyse (ChatGPT, Claude, Le Chat, Copilot…) lit le fichier qu’on lui donne, écrit du code, souvent en Python, l’exécute et rend des chiffres, des tableaux, des graphiques. Elle calcule vite ; elle ne connaît ni le métier, ni vos règles, ni la question exacte de Nadia.',
        },
        {
          kind: 'method',
          title: 'La consigne en cinq parties',
          text: 'Une consigne précise vaut mieux qu’une longue conversation.',
          steps: [
            'Rôle : « Tu es analyste data pour un réseau de 12 agences. »',
            'Données : le fichier, ses onglets, ce qu’est une ligne, la clé de chaque table.',
            'Règles : votre cahier de règles, mot pour mot.',
            'Questions : une par ligne, avec sa période et son unité.',
            'Format : un tableau question, chiffre, méthode, lignes retenues.',
          ],
        },
        {
          kind: 'example',
          title: 'Une consigne courte, hors dossier',
          text: '« Tu es analyste pour une chaîne de cinq boulangeries. Fichier ventes.xlsx, une ligne par ticket. Règle : ne supprime aucune ligne, signale-la. Question : panier moyen de mars 2026, en euros. Réponds par un tableau : chiffre, méthode, lignes retenues. »',
        },
        {
          kind: 'property',
          title: 'Un chiffre de l’IA n’est vrai que vérifié',
          text: 'Elle peut prendre la mauvaise période, la moyenne au lieu de la médiane, le mauvais total, et l’écrire avec la même assurance que le bon chiffre. On ne lui confie que des données qu’on a le droit de confier : celles de Norvane sont fictives.',
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B3-02-A3-03-COURS-CAHIER-DE-REGLES',
      titre: 'Cours : le cahier de règles de l’analyste',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['ia-analyste'],
      notes: moteur.puces(
        '3 min ; chaque règle a été dite à la correction d’un exercice : faire retrouver lequel.',
        'Transition : « L’IA analyste, tous ensemble : le prompt. »',
      ),
    },
    'lesson',
    {
      title: 'Le cahier de règles de l’analyste',
      blocks: [
        {
          kind: 'definition',
          title: 'Une règle se vérifie',
          text: 'Six phrases impératives, tirées des exercices de la séance. « Sois rigoureux » ne se vérifie pas ; « Écris la période dans chaque critère » se vérifie sur chaque chiffre.',
        },
        {
          kind: 'method',
          title: 'Les six règles',
          text: 'Elles deviennent les règles de votre consigne.',
          steps: [...LES_SIX_REGLES],
        },
        {
          kind: 'property',
          title: 'Trois contrôles',
          text: 'Avant de reprendre un chiffre de l’IA.',
          steps: [
            'Recompter : le nombre de lignes retenues, à chaque étape.',
            'Refaire un chiffre à la main, le plus simple, et le comparer au sien.',
            'Lire la méthode : la formule, le code ou la phrase qui dit la période, le filtre et le dénominateur.',
          ],
        },
      ],
    },
  ),
];

const PROMPT_DE_L_ANALYSTE = [
  'Rôle',
  'Tu es analyste data pour Norvane Équipement, un réseau de 12 agences.',
  '',
  'Données',
  'Le classeur joint, la reprise nettoyée de l’export des ventes :',
  '- Commandes (colonnes A à M) : une ligne par produit commandé ; date_commande, date_livraison, agence_id, produit_id, quantite, ca_ht ;',
  '- Quarantaine : les lignes douteuses, à laisser de côté ;',
  '- Clients ; Agences (agence_id, ville, region) ; Produits (produit_id, categorie, cout_unitaire) ; Objectifs.',
  'Définitions :',
  '- date promise = 5 jours ouvrés après date_commande ;',
  '- délai = jours ouvrés entre date_commande et date_livraison, jour de commande exclu, sans jours fériés ;',
  '- marge = ca_ht − quantite × cout_unitaire, cout_unitaire pris dans Produits.',
  '',
  'Règles',
  ...LES_SIX_REGLES,
  '',
  'Questions',
  'Q1. CA HT de Rennes (AG06) en informatique, de janvier à septembre 2026, en euros.',
  'Q2. Délai médian de livraison de Strasbourg (AG12) en 2026, en jours ouvrés.',
  'Q3. Nombre de lignes du réseau commandées en 2026 et livrées après leur date promise.',
  'Q4. Part de l’informatique dans le CA HT de Rennes (AG06), de janvier à septembre 2026, en %.',
  'Q5. Évolution du CA HT du réseau de janvier à septembre 2026 par rapport aux mêmes mois de 2025, en %.',
  'Q6. Taux de marque de Marseille (AG09), marge ÷ CA HT, de janvier à septembre 2026, en %.',
  '',
  'Format',
  'Un tableau : question, chiffre, méthode ou code, lignes retenues.',
].join('\n');

const FAIRE_FAIRE: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B3-02-A3-04-PROMPT-TOUS-ENSEMBLE',
      titre: 'L’IA analyste, tous ensemble',
      diffusion: 'seance',
      dureeMinutes: 30,
      concepts: ['ia-analyste'],
      notes: moteur.puces(
        '30 min : 3 pour ouvrir l’IA sur le compte du formateur et lui donner le classeur, 2 pour coller le prompt, 15 pour la laisser calculer et lire sa méthode, 10 pour comparer avec la classe.',
        `Chiffres de référence, ceux des exercices 3 à 6 : Q1 : ${enEuros(VALEURS_B3_01['b3-01-a2-ca-rennes-info'])} ; Q2 : ${VALEURS_B3_01['b3-01-a2-delai-strasbourg']} jours ouvrés ; Q3 : ${VALEURS_B3_01['b3-01-a2-retards']} lignes ; Q4 : ${enPourcent(VALEURS_B3_01['b3-01-a2-part-info-rennes'])} ; Q5 : +${enPourcent(VALEURS_B3_01['b3-01-a3-evolution'])} ; Q6 : ${enPourcent(VALEURS_B3_01['b3-01-a3-marge-marseille'])}.`,
        'Quand un chiffre de l’IA diffère, faire dire la règle en cause, puis demander à l’IA sa méthode.',
        'Transition : « Gardez la fiche mémo de l’IA analyste. »',
      ),
    },
    'prompt',
    {
      title: 'L’IA analyste, tous ensemble',
      subtitle:
        'Le formateur colle ce prompt dans son IA, avec le classeur ; la classe compare ses chiffres aux vôtres.',
      prompt: PROMPT_DE_L_ANALYSTE,
    },
    { pieceJointe: REPRISE_NETTOYEE },
  ),
  moteur.ecranV2(
    {
      screenId: 'B3-02-A3-08-FICHE-MEMO',
      titre: 'Fiche mémo : l’IA analyste',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['ia-analyste'],
      notes: moteur.puces(
        '3 min ; la fiche s’imprime et s’agrafe à la fiche récap des formules.',
      ),
    },
    'grid',
    {
      title: 'Fiche mémo : l’IA analyste',
      subtitle:
        'Faire faire à une IA, et vérifier : la consigne, les règles, les contrôles.',
      imprimable: true,
      items: [
        {
          title: 'La consigne',
          description:
            'Rôle, données, règles, questions avec leur période et leur unité, format de réponse : chiffre, méthode, lignes retenues.',
        },
        {
          title: 'Relier et nettoyer',
          description:
            'Règles 1 et 2 : un identifiant, jamais un libellé ; le faux certain se corrige, le douteux se signale, rien ne se supprime.',
        },
        {
          title: 'Calculer',
          description:
            'Règles 3 à 5 : la même période pour le chiffre et sa comparaison ; la médiane pour un délai, le ratio des sommes pour un taux ; le dénominateur écrit.',
        },
        {
          title: 'Montrer',
          description:
            'Règle 6 : la méthode de chaque chiffre et le nombre de lignes retenues.',
        },
        {
          title: 'Vérifier',
          description:
            'Recompter les lignes, refaire un chiffre à la main, lire la méthode. Ni croire l’IA sur parole, ni la rejeter sans comparer.',
        },
        {
          title: 'Décider',
          description:
            'Une recommandation : un constat chiffré et vérifié, sa cause, une action datée confiée à quelqu’un.',
        },
      ],
    },
  ),
];

export const ACTE_3: moteur.Acte = [...COMPRENDRE, ...FAIRE_FAIRE];
