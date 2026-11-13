import {
  enEuros,
  enPourcent,
} from '../../../../../../common/domain/nombres/ecriture-francaise';
import type { ConfusionId } from '../../../../domain/cours/banque/confusions';
import {
  type QuestionChiffreeB301,
  VALEURS_B3_01,
} from '../b3-01/b3-01.donnees';
import { valeurDuPiege } from '../b3-01/b3-01.questions';
import { quatreHistoires } from '../b3-01/b3-01.acte-3';
import { REPRISE_NETTOYEE } from './b3-02.acte-1';

import * as moteur from '../../briques';

const piege = (id: QuestionChiffreeB301, confusion: ConfusionId): number =>
  valeurDuPiege(id, confusion)[0];

const LES_SIX_REGLES = [
  '1. Je relie les tables par un identifiant, jamais par un libellé.',
  '2. Je corrige seul ce qui est faux et certain ; je signale ce qui est douteux, je ne supprime rien.',
  '3. J’écris la période dans chaque critère, la même pour le chiffre et pour sa comparaison.',
  '4. Pour un délai typique je prends la médiane ; pour un taux, le ratio des sommes.',
  '5. J’écris le dénominateur de chaque pourcentage.',
  '6. Je montre la méthode de chaque chiffre et le nombre de lignes retenues.',
] as const;

const CRUE_SUR_PAROLE = { juste: 'ia-crue-sur-parole' } as const;

const REJETEE_SANS_COMPARAISON = {
  periode: 'ia-rejetee-sans-comparaison',
  resume: 'ia-rejetee-sans-comparaison',
  denominateur: 'ia-rejetee-sans-comparaison',
} as const;

const AUDIT: moteur.Acte = [
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
        '3 min, enchaînées sur le cahier de règles : 6 min d’exposition au plus.',
        'Chacun utilise l’IA de son choix, pourvu qu’elle exécute du code sur un fichier ; sans compte, on travaille en binôme.',
      ),
    },
    'lesson',
    {
      title: 'Une IA qui analyse vos données',
      subtitle: 'L’IA analyste · page 1 sur 2',
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
        'Transition : « Le rapport d’une IA à auditer : exercice 8. »',
      ),
    },
    'lesson',
    {
      title: 'Le cahier de règles de l’analyste',
      subtitle: 'L’IA analyste · page 2 sur 2',
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
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-02-A3-04-AUDIT-RAPPORT-IA',
      titre: 'Exercice 8 — Auditer le rapport d’une IA',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 9,
      concepts: ['ia-analyste'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 7),
        'Réflexion : faire ressortir ses propres résultats des exercices 3 à 7 avant de lire le rapport.',
        'Le rapport est écrit pour ce cours, chiffres tirés du classeur de reprise : le dire.',
      ),
      proprietes: {
        modalite: 'binome',
        ...moteur.classement(
          {
            id: 'b3-02-a3-audit',
            intitule:
              'Le rapport d’une IA sur la reprise nettoyée, écrit pour ce cours. Comparez chaque affirmation à vos résultats et rangez-la.',
          },
          'ia-analyste',
          [
            ['juste', 'Juste : le même chiffre que le mien'],
            ['periode', 'Faux : la période (règle 3)'],
            ['resume', 'Faux : le résumé (règle 4)'],
            ['denominateur', 'Faux : le dénominateur (règle 5)'],
          ],
          [
            {
              id: 'atteinte-rennes',
              libelle: `Taux d’atteinte de Rennes de janvier à septembre 2026 : ${enPourcent(VALEURS_B3_01['b3-01-a3-atteinte-rennes'])}, CA ÷ objectifs des mêmes mois.`,
              categorie: 'juste',
              confusions: REJETEE_SANS_COMPARAISON,
              justification: 'le chiffre de l’exercice 6, sur les mêmes mois',
            },
            {
              id: 'retards',
              libelle: `Lignes commandées en 2026 et livrées après leur date promise : ${VALEURS_B3_01['b3-01-a2-retards']}.`,
              categorie: 'juste',
              confusions: REJETEE_SANS_COMPARAISON,
              justification: 'le chiffre de l’exercice 4',
            },
            {
              id: 'ca-rennes-info',
              libelle: `CA de Rennes en informatique en 2026 : ${enEuros(piege('b3-01-a2-ca-rennes-info', 'periode-mal-delimitee'))}, toutes les lignes de Rennes en informatique additionnées.`,
              categorie: 'periode',
              confusions: {
                ...CRUE_SUR_PAROLE,
                resume: 'periode-mal-delimitee',
                denominateur: 'periode-mal-delimitee',
              },
              justification: '2025 additionné à 2026 : la période manque',
            },
            {
              id: 'evolution',
              libelle: `Évolution du CA 2026 : ${enPourcent(piege('b3-01-a3-evolution', 'evolution-sur-annee-pleine'))}, janvier-septembre 2026 ÷ toute l’année 2025 − 1.`,
              categorie: 'periode',
              confusions: {
                ...CRUE_SUR_PAROLE,
                resume: 'evolution-sur-annee-pleine',
                denominateur: 'evolution-sur-annee-pleine',
              },
              justification: 'neuf mois comparés à douze',
            },
            {
              id: 'delai-strasbourg',
              libelle: `Délai de livraison de Strasbourg en 2026 : ${piege('b3-01-a2-delai-strasbourg', 'valeur-extreme-ignoree')} jours ouvrés, la moyenne des délais.`,
              categorie: 'resume',
              confusions: {
                ...CRUE_SUR_PAROLE,
                periode: 'valeur-extreme-ignoree',
                denominateur: 'valeur-extreme-ignoree',
              },
              justification:
                'la moyenne tirée par les ruptures, au lieu de la médiane',
            },
            {
              id: 'marge-moyenne',
              libelle: `Taux de marque de Marseille en 2026 : ${enPourcent(piege('b3-01-a3-marge-marseille', 'moyenne-simple-des-taux'))}, la moyenne des taux de chaque ligne.`,
              categorie: 'resume',
              confusions: {
                ...CRUE_SUR_PAROLE,
                periode: 'moyenne-simple-des-taux',
                denominateur: 'moyenne-simple-des-taux',
              },
              justification: 'une moyenne de taux, au lieu du ratio des sommes',
            },
            {
              id: 'part-info',
              libelle: `Part de l’informatique dans le CA de Rennes en 2026 : ${enPourcent(piege('b3-01-a2-part-info-rennes', 'pourcentage-du-mauvais-total'))}, divisée par le CA du réseau.`,
              categorie: 'denominateur',
              confusions: {
                ...CRUE_SUR_PAROLE,
                periode: 'pourcentage-du-mauvais-total',
                resume: 'pourcentage-du-mauvais-total',
              },
              justification: 'divisée par le réseau, au lieu de Rennes',
            },
            {
              id: 'marge-cout',
              libelle: `Taux de marque de Marseille en 2026 : ${enPourcent(piege('b3-01-a3-marge-marseille', 'marque-confondue-avec-marge'))}, la marge divisée par le coût d’achat.`,
              categorie: 'denominateur',
              confusions: {
                ...CRUE_SUR_PAROLE,
                periode: 'marque-confondue-avec-marge',
                resume: 'marque-confondue-avec-marge',
              },
              justification:
                'divisée par le coût d’achat : c’est le taux de marge',
            },
          ],
        ),
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger case par case ; demander à chaque fois quel chiffre de la séance tranche.',
        'Transition : « À vous d’écrire la consigne qui évite ces erreurs : exercice 9. »',
      ],
    },
    [
      [
        'juste',
        'Le taux d’atteinte de Rennes et les retards de 2026 sont vos chiffres des exercices 6 et 4 : comparés, ils se confirment. Les juger faux sans comparer, c’est rejeter l’IA par principe.',
      ],
      [
        'periode',
        'Le CA de Rennes en informatique additionne 2025 et 2026 ; l’évolution compare neuf mois de 2026 à toute l’année 2025. Règle 3 : la période dans chaque critère, la même pour le chiffre et pour sa comparaison.',
      ],
      [
        'resume',
        'Le délai moyen de Strasbourg est tiré par les ruptures livrées deux mois plus tard ; le taux de marque moyen fait peser les petites lignes autant que les grosses. Règle 4 : la médiane pour un délai typique, le ratio des sommes pour un taux.',
      ],
      [
        'denominateur',
        'La part de l’informatique divisée par le réseau, et la marge divisée par le coût d’achat, répondent à d’autres questions. Règle 5 : écrire le dénominateur de chaque pourcentage.',
      ],
    ],
  ),
];

const FAIRE_FAIRE: moteur.Acte = [
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-02-A3-05-DEFI-CONSIGNE',
      titre: 'Exercice 9 — Votre consigne à l’IA',
      diffusion: 'seance',
      brique: 'fp-challenge',
      dureeMinutes: 5,
      concepts: ['ia-analyste'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 4),
        'Réflexion : faire relire la page de la consigne en cinq parties et le cahier de règles.',
        'La consigne écrite ici sert telle quelle à l’écran suivant.',
      ),
      proprietes: {
        modalite: 'solo',
        probleme: {
          id: 'b3-02-a3-consigne',
          enonce:
            'Vous allez confier le classeur de reprise nettoyé à une IA, pour qu’elle refasse les analyses des exercices 3 à 7. Écrivez la consigne que vous lui donnerez.',
          invite:
            'En cinq parties : le rôle, les données, vos règles, les questions avec leur période et leur unité, le format de la réponse.',
        },
        corrige: {
          type: 'defi',
          strategies: [
            moteur.strategie(
              'role',
              'Rôle : « Tu es analyste data pour Norvane Équipement, un réseau de 12 agences. »',
            ),
            moteur.strategie(
              'donnees',
              'Données : « Onglet Commandes, une ligne par produit commandé, clés agence_id et produit_id ; référentiels Agences, Produits, Objectifs ; onglet Quarantaine à laisser de côté. »',
            ),
            moteur.strategie(
              'regles',
              'Règles : les six règles du cahier, mot pour mot.',
            ),
            moteur.strategie(
              'questions',
              'Questions : une par ligne, avec sa période et son unité, « CA HT de Rennes en informatique, de janvier à septembre 2026, en euros ».',
            ),
            moteur.strategie(
              'format',
              'Format : « Un tableau question, chiffre, méthode ou code, lignes retenues. »',
            ),
            moteur.strategie(
              'tout-corriger',
              '« Analyse ce fichier, corrige toutes les erreurs et donne-moi les chiffres clés. »',
              true,
            ),
          ],
        },
      },
    },
    {
      minutes: 2,
      notes: [
        'Révéler les stratégies ; demander pourquoi la dernière est fausse : elle fait corriger le douteux, et ne dit ni période, ni unité, ni format.',
        'Transition : « Votre IA au travail. »',
      ],
    },
    [
      [
        'consigne',
        'Une bonne consigne tient en cinq parties : rôle, données, règles, questions avec leur période et leur unité, format de réponse. « Corrige toutes les erreurs » est la consigne fausse : elle laisse l’IA trancher le douteux, contre la règle 2, et ne dit ni période ni dénominateur.',
      ],
    ],
  ),
  {
    screenId: 'B3-02-A3-06-ANALYSE-IA',
    titre: 'L’IA au travail : ses chiffres contre les vôtres',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 18,
    concepts: ['ia-analyste'],
    notes: moteur.puces(
      '18 min : 2 pour ouvrir l’IA et lui donner le fichier, 12 pour poser les sept questions, 4 pour noter les écarts.',
      'Sans compte, en binôme sur le poste du voisin ; si aucune IA ne répond, le formateur projette la sienne et la classe dicte la consigne.',
      'Passer dans les rangs : faire demander à l’IA sa méthode quand son chiffre diffère.',
    ),
    proprietes: {
      metier: 'Analyste data — Norvane Équipement (réseau de 12 agences)',
      situation:
        'Nadia veut savoir si une IA peut refaire vos analyses. Sept questions, de janvier à septembre 2026 : 1. CA de Rennes en informatique ; 2. délai médian de Strasbourg ; 3. retards ; 4. part de l’informatique à Rennes ; 5. atteinte de Rennes ; 6. évolution du CA ; 7. taux de marque de Marseille.',
      geste:
        'Donnez le classeur nettoyé et votre consigne à l’IA de votre choix, posez les sept questions, puis notez son chiffre, le vôtre et la règle en cause.',
      consequence:
        'Un écart que vous ne savez pas expliquer, vous ne pouvez ni le confier ni le présenter.',
      pieceJointe: REPRISE_NETTOYEE,
      questionsLibres: [
        {
          id: 'b3-02-a3-analyse:outil',
          question:
            'Quelle IA avez-vous utilisée, et avec qui si vous étiez en binôme ?',
          placeholder: 'IA : … · binôme : …',
        },
        {
          id: 'b3-02-a3-analyse:chiffres',
          question:
            'Une ligne par question, de 1 à 7 : le chiffre de l’IA, le vôtre (exercices 3 à 7), la règle en cause s’ils diffèrent.',
          placeholder: '1. IA : … · moi : … · règle : …',
        },
        {
          id: 'b3-02-a3-analyse:ecarts',
          question:
            'Votre bilan : combien de chiffres justes sur sept, et l’écart le plus grave, avec sa cause.',
          placeholder: '… justes sur 7 · écart le plus grave : …',
        },
      ],
    },
  },
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-02-A3-07-RECOMMANDATIONS',
      titre: 'Exercice 10 — Vos recommandations au comité',
      diffusion: 'seance',
      brique: 'fp-pro',
      dureeMinutes: 10,
      concepts: ['tableau-de-bord', 'ia-analyste'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 9),
        'Réflexion : faire relire la synthèse de l’exercice 6 et le tableau de bord de l’exercice 7 : ce qui sort de l’ordinaire.',
        'Rouen, troisième agence sous l’objectif, recule un peu sans cause qui ressorte du détail : à surveiller, pas une histoire.',
      ),
      proprietes: {
        metier: 'Analyste data — Norvane Équipement (réseau de 12 agences)',
        situation:
          'Jeudi, Nadia présente le réseau au comité de direction. Demandez à votre IA deux recommandations tirées du classeur, puis gardez-les ou corrigez-les.',
        geste:
          'Pour chacune : un constat chiffré, vérifié contre vos résultats, sa cause trouvée dans le détail, une action précise, datée, confiée à quelqu’un.',
        consequence:
          'Une recommandation sans chiffre vérifié ne convainc pas ; sans cause, elle traite le symptôme ; sans action, elle ne change rien.',
        questionsLibres: [
          {
            id: 'b3-02-a3-recommandations:recommandation-1',
            question:
              'Recommandation 1 : constat chiffré → cause → action, telle que vous la présenteriez.',
            placeholder: 'Constat : … Cause : … Action : …',
          },
          {
            id: 'b3-02-a3-recommandations:recommandation-2',
            question:
              'Recommandation 2 : constat chiffré → cause → action, telle que vous la présenteriez.',
            placeholder: 'Constat : … Cause : … Action : …',
          },
          {
            id: 'b3-02-a3-recommandations:confier',
            question:
              'Ce que vous confieriez à l’IA au prochain export, et ce que vous vérifieriez toujours vous-même.',
            placeholder: 'Je confie : … Je vérifie : …',
          },
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Révéler la correction : les quatre histoires du réseau s’affichent ensemble ; les commenter une à une, en demandant qui l’avait trouvée, seul ou avec l’IA.',
        'Transition : « Gardez la fiche mémo de l’IA analyste. »',
      ],
    },
    quatreHistoires(),
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

export const ACTE_3: moteur.Acte = [...AUDIT, ...FAIRE_FAIRE];
