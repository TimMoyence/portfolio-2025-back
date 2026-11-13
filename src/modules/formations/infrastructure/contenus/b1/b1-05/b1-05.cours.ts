import { implique } from '../../../../../../common/domain/logique/implique';
import type { ContenuDeCours } from '../../../../domain/cours/stockage/CoursStocke';
import { DONNEES_FICTIVES } from '../b1-01/b1-01.donnees';
import { ACTE_4 } from './b1-05.acte-4';
import {
  BORNE,
  CLIENTS,
  COMPARAISON,
  CONCEPTS_DU_COURS,
  CONTRE_EXEMPLES,
  ET_PAR_OU,
  FEUILLE_DES_CONTROLES,
  FORMULE_DE_LA_REMISE,
  FORMULE_DU_PORT,
  FRAIS_DE_PORT,
  HORS_EQUIVALENCE,
  IL_EXISTE_GARDE,
  LIVRAISONS_ADDITIONNEES,
  LIVRAISONS_EXCLUSIVES,
  LIVRAISONS_OFFERTES,
  NON_FIDELES,
  ORDRE,
  OU_COMPTE_DEUX_FOIS,
  OU_EXCLUSIF,
  POUR_TOUT_EN_AUCUN,
  PREMISSE_FAUSSE,
  RECIPROQUE,
  RENVOI_AU_FICHIER_DES_CLIENTS,
  SANS_MORGAN,
  SEUIL_DE_LA_LIVRAISON,
  SEUIL_DE_LA_REMISE,
  TAUX_DE_LA_REMISE,
  ouiNon,
} from './b1-05.donnees';
import * as moteur from '../../briques';
import { GRAVURE_DE_BOOLE as GRAVURE_DE_L_ACCROCHE } from '../../gravures';

const DOSSIER_DES_IMAGES = '/assets/cours/b1-05/v1';

const pourComprendre = moteur.pourComprendreDans(DOSSIER_DES_IMAGES);

const lettre = (valeur: boolean): string => (valeur ? 'V' : 'F');
const enClients = (nombre: number): string => `${nombre} clients`;

const COMBINAISONS = [
  [true, true],
  [true, false],
  [false, true],
  [false, false],
] as const;

const REGLE_DE_LA_REMISE = `Remise de ${TAUX_DE_LA_REMISE} % du panier si le client est fidèle et si son panier atteint ${SEUIL_DE_LA_REMISE} €.`;
const REGLE_DE_LA_LIVRAISON = `Livraison offerte si le panier atteint ${SEUIL_DE_LA_LIVRAISON} € ou si le client est abonné au club.`;
const REGLE_DU_CONTROLE =
  '« Si un client est abonné au club, alors sa livraison est offerte. »';

const ACTE_1: moteur.Acte = [
  {
    screenId: 'B1-05-A1-01-DIAGNOSTIC-CONTRAIRE',
    titre: 'Diagnostic : le contraire d’une condition',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 4,
    concepts: ['negation'],
    notes: moteur.puces(
      '4 min : écrire au tableau l’adresse et le code de séance.',
      'Rappel du collège : ≥ se lit « supérieur ou égal ».',
      'Annoncer « seule la participation compte ».',
      'Papier : la question est en tête du livret ; vote à main levée.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b1-05-a1-diagnostic-contraire',
          'negation',
          true,
          `Quel est le contraire de « le panier atteint ${SEUIL_DE_LA_REMISE} € », c’est-à-dire « panier ≥ ${SEUIL_DE_LA_REMISE} € » ?`,
          `« Panier < ${SEUIL_DE_LA_REMISE} € »`,
          [[`« Panier ≤ ${SEUIL_DE_LA_REMISE} € »`, COMPARAISON]],
        ),
      ],
      delaiMs: 0,
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B1-05-A1-02-ACCROCHE',
      titre: 'Logique : conditions et contrôles',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['proposition', 'connecteur'],
      notes: moteur.puces(
        'Annoncer les deux pauses de 15 minutes, après l’acte 1 et après l’acte 3.',
        'Raconter : en 1854, George Boole écrit les lois de la pensée comme des calculs, avec des vrais et des faux. Chaque formule SI d’un tableur en descend.',
      ),
    },
    'hero',
    {
      title: 'Logique : conditions et contrôles',
      subtitle:
        'Partie Libre accorde des remises et offre des livraisons selon des règles. Votre dossier : écrire ces règles sans ambiguïté, les nier sans erreur, les contrôler sur le fichier des clients.',
      bgImage: GRAVURE_DE_L_ACCROCHE.chemins[0],
      bgImageAlt:
        'Page de titre de l’ouvrage de George Boole, An Investigation of the Laws of Thought, 1854',
    },
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B1-05-A1-03-VOTE-DIAGNOSTIC',
      titre: 'Vote : « ou » et « si… alors »',
      dureeMinutes: 4,
      concepts: ['connecteur'],
      notes: moteur.notesDuVoteQuiOuvreLaNotion(1),
    },
    [
      moteur.vote(
        'b1-05-a1-vote-ou',
        'connecteur',
        false,
        '« Le stage est ouvert aux étudiants de BTS ou aux alternants. » Inès est en BTS et en alternance. Peut-elle s’inscrire ?',
        'Oui : elle remplit les deux conditions, « ou » l’accepte',
        [['Non : il faut remplir une seule des deux', OU_EXCLUSIF]],
      ),
      moteur.vote(
        'b1-05-a1-vote-si-alors',
        'connecteur',
        false,
        '« S’il pleut, le tournoi en plein air est annulé. » Le tournoi est annulé. Pleut-il forcément ?',
        'Non : il peut être annulé pour une autre raison',
        [['Oui : la règle le dit', RECIPROQUE]],
      ),
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-05-A1-04-DOSSIER',
      titre: 'Les règles commerciales de Partie Libre',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['proposition', 'connecteur'],
      notes: moteur.puces(
        '1 min de lecture silencieuse ; ne rien calculer.',
        'Faire souligner les mots « et », « ou », « si… alors » dans les règles.',
      ),
    },
    'table',
    {
      title: 'Les règles commerciales de Partie Libre',
      subtitle: 'Ce que la boutique en ligne doit appliquer à chaque commande.',
      columns: [...moteur.COLONNES_DU_DOSSIER],
      rows: [
        {
          rubrique: 'L’entreprise',
          contenu:
            'Partie Libre : quatre boutiques-bars à jeux, à Nantes, Angers, Tours et Le Mans, et un site web.',
        },
        { rubrique: 'La remise de fidélité', contenu: REGLE_DE_LA_REMISE },
        { rubrique: 'La livraison', contenu: REGLE_DE_LA_LIVRAISON },
        { rubrique: 'Le contrôle', contenu: REGLE_DU_CONTROLE },
        {
          rubrique: 'La question d’Inès',
          contenu:
            '« Le site accorde des remises à des clients qui n’y ont pas droit. Qui a écrit les règles, et comment les vérifier ? »',
        },
      ],
      note: DONNEES_FICTIVES,
    },
  ),
  {
    screenId: 'B1-05-A1-05-MISSION',
    titre: 'Votre mission : une règle mal écrite',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 6,
    concepts: ['connecteur', 'proposition'],
    notes: moteur.puces(
      'Lecture à voix haute (1 min), puis 4 min d’écriture individuelle et 1 min de mise en commun au pupitre.',
      'Consigne orale : pas de calcul, des phrases. Enjeu : chaque remise de trop coûte à la boutique.',
      'Question 3 : ne pas trancher, c’est la notion 1.',
      'Papier : trois lignes d’écriture dans le livret.',
    ),
    proprietes: {
      metier:
        'Alternant·e assistant·e de gestion — Partie Libre (boutiques-bars à jeux, 40 salariés, Nantes)',
      situation: [
        'Mardi, 10 h. Inès Marchal relit le paramétrage du site.',
        `Théo a saisi la remise ainsi : « fidèle ou panier ≥ ${SEUIL_DE_LA_REMISE} € ».`,
        '« Des clients jamais venus ont eu la remise. Il faut comprendre pourquoi, et écrire des règles qu’on puisse contrôler. »',
      ].join('\n'),
      geste: null,
      consequence: null,
      questionsLibres: [
        {
          id: 'b1-05-a1-mission:remise',
          question:
            'Quel client, jamais venu, a pu obtenir la remise avec la règle de Théo ?',
          placeholder: 'Un client qui…',
        },
        {
          id: 'b1-05-a1-mission:livraison',
          question:
            'Un abonné dont le panier atteint 60 € a-t-il la livraison offerte ?',
          placeholder: 'Oui, parce que… / Non, parce que…',
        },
        {
          id: 'b1-05-a1-mission:controle',
          question:
            'Un client non abonné paie sa livraison : la règle du contrôle est-elle violée ?',
          placeholder: 'Je pense que…',
        },
      ],
    },
  },
  pourComprendre(
    {
      screenId: 'B1-05-A1-06-ENFANT-SERRURES',
      titre: 'Deux clés ou deux portes',
      concepts: ['connecteur'],
    },
    {
      fichier: 'serrures-portes.webp',
      scene:
        'À gauche, une porte fermée par deux cadenas : il faut les deux clés pour entrer. À droite, une salle à deux portes ouvertes : on entre par l’une, par l’autre, ou en passant la tête par les deux.',
      imageAlt:
        'Dessin : à gauche, une porte fermée par un cadenas rouge et un cadenas bleu, un enfant tient une clé de chaque couleur ; à droite, une salle de jeux à deux portes ouvertes, une rouge et une bleue, trois enfants y entrent.',
      regle:
        'les connecteurs « et », « ou » et « non » relient des conditions. « P et Q » est vraie si les deux le sont ; « P ou Q » si au moins une l’est, les deux comprises ; « non P » est le contraire de P. La table de vérité donne toutes les combinaisons.',
      correspondances: [
        ['Les deux cadenas', '« P et Q » : les deux conditions sont exigées'],
        ['Les deux portes ouvertes', '« P ou Q » : une seule suffit'],
        [
          'Celui qui passe par les deux portes',
          '« ou » reste vrai quand les deux sont vraies',
        ],
      ],
    },
    'Question : « Celui qui passe la tête par les deux portes est-il entré ? » Oui : le « ou » de la logique l’accepte.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-05-A1-06-COURS-CONNECTEURS',
      titre: 'Cours : et, ou, non',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['connecteur', 'proposition'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : « ou » accepte les deux.',
      ),
    },
    'lesson',
    {
      title: 'Et, ou, non : « ou » accepte les deux',
      subtitle: 'Trace écrite · notion 1 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Proposition et connecteurs',
          text: 'Une proposition est une phrase vraie ou fausse.\nLes connecteurs en fabriquent de nouvelles, dont la table de vérité donne la valeur.',
          formula:
            'P et Q : vraie seulement si P et Q sont vraies\nP ou Q : fausse seulement si P et Q sont fausses\nnon P : vraie quand P est fausse',
        },
        {
          kind: 'example',
          title: 'Pour débuter : la sortie de Léa',
          text: 'P : « Léa a fini ses devoirs ». Q : « il fait beau ». Elle sort si P et Q.',
          steps: [
            'P vraie, Q fausse : « P et Q » est fausse, Léa reste.',
            'Avec « P ou Q », P vraie suffit : elle sort.',
            'P et Q vraies : « P ou Q » est vraie aussi.',
          ],
        },
        {
          kind: 'method',
          title: '« Ou » accepte les deux',
          text: 'Pour lire ou écrire une règle à deux conditions.',
          steps: [
            'Nommer chaque condition par une lettre, P et Q.',
            'Repérer le connecteur, puis lire sa ligne dans la table de vérité.',
            'Au tableur : ET(condition;condition), OU(…), NON(…), dans un SI.',
          ],
        },
      ],
    },
  ),
  pourComprendre(
    {
      screenId: 'B1-05-A1-07-ENFANT-PLUIE',
      titre: 'Le chemin mouillé',
      concepts: ['connecteur'],
    },
    {
      fichier: 'pluie-arrosoir.webp',
      scene:
        'Quand il pleut, le chemin est mouillé. Mais un chemin mouillé sous le soleil peut venir d’un tuyau d’arrosage : la pluie n’est pas la seule raison.',
      imageAlt:
        'Dessin : à gauche, il pleut sur un jardin, le chemin est mouillé, un enfant sous un parapluie ; à droite, grand soleil sur le même jardin, le chemin est mouillé aussi, un enfant l’arrose avec un tuyau.',
      regle:
        'l’implication « si P alors Q », P ⇒ Q, n’est fausse que si P est vraie et Q fausse. L’équivalence P ⇔ Q, « P si et seulement si Q », est vraie quand P et Q ont la même valeur : elle affirme aussi la réciproque.',
      correspondances: [
        ['La pluie', 'la condition P'],
        ['Le chemin mouillé', 'la conséquence Q'],
        [
          'Le chemin mouillé au soleil',
          'P fausse, Q vraie : l’implication reste vraie',
        ],
        ['Le tuyau d’arrosage', 'la réciproque Q ⇒ P n’est pas affirmée'],
      ],
    },
    'Question : « Le chemin est mouillé : a-t-il plu ? » Pas forcément : le tuyau.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-05-A1-07-COURS-IMPLICATION',
      titre: 'Cours : implication et équivalence',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['connecteur'],
      notes: moteur.puces(
        moteur.DEUXIEME_PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : un seul cas faux.',
      ),
    },
    'lesson',
    {
      title: 'Implication et équivalence : un seul cas faux',
      subtitle: 'Trace écrite · notion 1 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Si P alors Q',
          text: 'P ⇒ Q est fausse dans un seul cas : P vraie et Q fausse.\nP ⇔ Q est vraie quand P et Q sont toutes deux vraies ou toutes deux fausses.',
          formula:
            'P ⇒ Q : fausse seulement si P vraie et Q fausse\nP ⇔ Q : (P ⇒ Q) et (Q ⇒ P)',
        },
        {
          kind: 'example',
          title: 'Pour débuter : la carte de Léa',
          text: '« Si Léa a 18 ans, alors elle peut voter. »',
          steps: [
            'Léa a 18 ans et vote : vraie.',
            'Léa a 16 ans et ne vote pas : vraie, la condition est fausse.',
            'Seul « 18 ans et ne peut pas voter » rendrait la phrase fausse.',
          ],
        },
        {
          kind: 'method',
          title: 'Un seul cas faux',
          text: 'Pour contrôler une règle « si… alors ».',
          steps: [
            'Chercher les lignes où la condition P est vraie.',
            'Parmi elles, celles où Q est fausse : ce sont les contre-exemples.',
            'Une ligne où P est fausse ne contredit jamais la règle.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B1-05-A1-08-EXEMPLE-ANGERS',
      titre: 'Exemple guidé : la carte cadeau d’Angers',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['connecteur', 'proposition'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b1-05-a1-exemple-angers',
          enonce:
            'Boutique d’Angers : une carte cadeau si le client achète au moins trois jeux (P) et s’inscrit à la lettre d’information (Q). Contrôle affiché : « si un client a une carte cadeau, alors il a acheté au moins trois jeux ».',
          etapes: [
            {
              id: 'propositions',
              intitule: 'Les propositions',
              raisonnement:
                'P : « le client achète au moins trois jeux ». Q : « il s’inscrit à la lettre ». La règle est « P et Q ».',
              invite: 'Quelles sont les deux conditions ?',
            },
            {
              id: 'et',
              intitule: 'Le connecteur « et »',
              raisonnement:
                'Trois jeux sans inscription : P vraie, Q fausse, « P et Q » fausse. Pas de carte.',
              invite:
                'Un client achète trois jeux sans s’inscrire : a-t-il la carte ?',
            },
            {
              id: 'ou',
              intitule: 'Si la règle disait « ou »',
              raisonnement:
                'Avec « P ou Q », le même client aurait la carte : une condition suffit.',
              invite: 'Et si la règle était « P ou Q » ?',
            },
            {
              id: 'implication',
              intitule: 'Le contrôle',
              raisonnement:
                'Un client sans carte qui achète un seul jeu : la condition « a une carte » est fausse, le contrôle reste vrai.',
              invite:
                'Un client sans carte achète un jeu : le contrôle est-il violé ?',
            },
            {
              id: 'reciproque',
              intitule: 'La réciproque',
              raisonnement:
                'Un client achète cinq jeux sans s’inscrire : pas de carte. Le contrôle ne dit pas que trois jeux donnent une carte.',
              invite: 'Trois jeux achetés donnent-ils toujours une carte ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur le contrôle (étape 4) et la réciproque (étape 5).',
        'Transition : « Les tables de vérité des cinq connecteurs, puis l’exercice 1. »',
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-05-A1-09-TABLES-DE-VERITE',
      titre: 'Les tables de vérité des cinq connecteurs',
      diffusion: 'seance',
      dureeMinutes: 1,
      concepts: ['connecteur'],
      notes: moteur.puces(
        '1 min : faire lire la seule ligne fausse de P ⇒ Q et la ligne où « ou » est vrai deux fois.',
      ),
    },
    'table',
    {
      title: 'Les tables de vérité des cinq connecteurs',
      subtitle: 'V : vraie · F : fausse. Une ligne par combinaison de P et Q.',
      columns: [
        { key: 'p', label: 'P' },
        { key: 'q', label: 'Q' },
        { key: 'nonP', label: 'non P' },
        { key: 'et', label: 'P et Q' },
        { key: 'ou', label: 'P ou Q' },
        { key: 'implique', label: 'P ⇒ Q' },
        { key: 'equivaut', label: 'P ⇔ Q' },
      ],
      rows: COMBINAISONS.map(([p, q]) => ({
        p: lettre(p),
        q: lettre(q),
        nonP: lettre(!p),
        et: lettre(p && q),
        ou: lettre(p || q),
        implique: lettre(implique(p, q)),
        equivaut: lettre(p === q),
      })),
      note: 'P ⇒ Q n’est fausse qu’à la deuxième ligne : P vraie et Q fausse.',
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-05-A1-10-ATELIER-CONNECTEURS',
      titre: 'Exercice 1 — Les règles appliquées à quatre clients',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 11,
      concepts: ['connecteur', 'proposition'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 9),
        'Réflexion : écrire chaque règle avec ses lettres P et Q.',
        'Pièges : borne stricte ; « ou » exclusif ; implication jugée fausse quand sa condition l’est ; réciproque.',
        'Papier : exercice 1 du livret.',
      ),
      proprietes: {
        intitule: 'Exercice 1 — Les règles appliquées à quatre clients',
        consigne: `Les règles du dossier. ${REGLE_DE_LA_REMISE} ${REGLE_DE_LA_LIVRAISON} Contrôle : ${REGLE_DU_CONTROLE} ${DONNEES_FICTIVES}`,
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b1-05-a1-remise-chloe',
            'proposition',
            true,
            `Chloé est fidèle et son panier fait ${SEUIL_DE_LA_REMISE} € pile. A-t-elle la remise ?`,
            `Oui : elle est fidèle et ${SEUIL_DE_LA_REMISE} ≥ ${SEUIL_DE_LA_REMISE}`,
            [[`Non : il faut dépasser ${SEUIL_DE_LA_REMISE} €`, BORNE]],
          ),
          moteur.vote(
            'b1-05-a1-livraison-farid',
            'connecteur',
            true,
            'Farid est abonné et son panier fait 64 €. Sa livraison est-elle offerte ?',
            'Oui : les deux conditions sont vraies, « ou » l’est aussi',
            [
              [
                'Non : « ou » exclut le cas où les deux sont vraies',
                OU_EXCLUSIF,
              ],
            ],
          ),
          moteur.vote(
            'b1-05-a1-implication-hugo',
            'connecteur',
            true,
            'Hugo n’est pas abonné, son panier fait 49 € et il paie sa livraison. Contredit-il la règle du contrôle ?',
            'Non : sa condition est fausse, l’implication reste vraie',
            [
              [
                'Oui : sa condition est fausse, donc la règle aussi',
                PREMISSE_FAUSSE,
              ],
            ],
          ),
          moteur.vote(
            'b1-05-a1-reciproque-ana',
            'connecteur',
            true,
            'Ana n’est pas abonnée, son panier fait 72 € et sa livraison est offerte. Contredit-elle la règle du contrôle ?',
            'Non : la règle ne dit rien des clients non abonnés',
            [['Oui : seuls les abonnés devraient en profiter', RECIPROQUE]],
          ),
        ],
      },
    },
    {
      minutes: 3,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE,
        'Faire montrer la ligne de la table de vérité qui tranche chaque question.',
        'Transition : jalon 1, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'b1-05-a1-remise-chloe',
        `P : « fidèle », vraie. Q : « panier ≥ ${SEUIL_DE_LA_REMISE} € », vraie à la borne. « P et Q » est vraie : remise.`,
      ],
      [
        'b1-05-a1-livraison-farid',
        '« P ou Q » est vraie quand les deux le sont : livraison offerte.',
      ],
      [
        'b1-05-a1-implication-hugo',
        'Seul un abonné qui paie sa livraison contredirait le contrôle. Hugo n’est pas abonné.',
      ],
      [
        'b1-05-a1-reciproque-ana',
        'Le contrôle n’affirme pas « livraison offerte ⇒ abonné ». Ana a la livraison par son panier.',
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B1-05-A1-11-JALON',
      titre: 'Jalon 1 : lire une règle à deux conditions',
      concepts: ['connecteur'],
    },
    {
      id: 'b1-05-a1-jalon',
      invite:
        'Je sais dire quand « et », « ou » et « si… alors » sont vrais, avec la table de vérité.',
    },
    'Si plus de 30 % « Perdu » : reprendre la ligne fausse de l’implication après la pause.',
    moteur.PAUSE_HORS_DUREE,
  ),
];

const ACTE_2: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B1-05-A2-01-REFLEXION-CONTRAIRE',
      titre: 'Réfléchir : qui paie sa livraison ?',
      diffusion: 'seance',
      dureeMinutes: 5,
      concepts: ['negation', 'connecteur'],
      notes: moteur.puces(
        'Temps « réfléchir » de la notion 2 : 3 min d’écriture individuelle, puis lire trois réponses au pupitre.',
        'Ne rien trancher : la trace écrite suivante répond.',
        'Relance : « Un abonné à 30 € paie-t-il avec la règle de Théo ? »',
        'Papier : cadre de réponse du livret.',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b1-05-a2-reflexion-contraire',
        type: 'reflection',
        question: `Inès veut la liste des clients qui paient leur livraison. Théo écrit : « panier < ${SEUIL_DE_LA_LIVRAISON} € ou non abonné ». Sa règle est-elle le contraire de « panier ≥ ${SEUIL_DE_LA_LIVRAISON} € ou abonné » ? Comment écrire ce contraire ?`,
        placeholder: 'Un client qui… / Le contraire serait…',
        competency: 'Raisonner · nier une règle',
      },
    },
    {
      correction: {
        expected: `Non : un abonné à 30 € vérifie la règle de Théo alors que sa livraison est offerte. Le contraire est « panier < ${SEUIL_DE_LA_LIVRAISON} € et non abonné ».`,
        nextAction:
          'Gardez votre réponse : la trace écrite donne la règle qui nie deux conditions.',
      },
    },
  ),
  pourComprendre(
    {
      screenId: 'B1-05-A2-02-ENFANT-PORTILLON',
      titre: 'Le billet et le casque',
      concepts: ['negation'],
    },
    {
      fichier: 'portillon-casque.webp',
      scene:
        'Au karting, on entre avec un billet et un casque. Restent dehors celui qui n’a pas de billet, celui qui n’a pas de casque, et celui qui n’a ni l’un ni l’autre.',
      imageAlt:
        'Dessin : l’entrée d’un karting pour enfants fermée par un portillon ; un enfant avec billet et casque entre ; trois enfants refusés attendent : un avec billet sans casque, un avec casque sans billet, un sans rien.',
      regle:
        'les lois de Morgan nient deux conditions. Le contraire de « P et Q » est « non P ou non Q » ; le contraire de « P ou Q » est « non P et non Q ». On nie chaque condition et on échange le connecteur.',
      correspondances: [
        ['Entrer', '« billet et casque »'],
        ['Rester dehors', '« pas de billet ou pas de casque »'],
        [
          'Les trois refusés',
          'les trois cas du « ou », dont celui des deux manques',
        ],
      ],
    },
    'Question : « Faut-il n’avoir ni billet ni casque pour rester dehors ? » Non : un seul manque suffit.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-05-A2-02-COURS-MORGAN',
      titre: 'Cours : les lois de Morgan',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['negation', 'connecteur'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : nier, puis échanger.',
      ),
    },
    'lesson',
    {
      title: 'Les lois de Morgan : nier, puis échanger',
      subtitle: 'Trace écrite · notion 2 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Nier deux conditions',
          text: 'Pour nier une règle à deux conditions, on nie chacune et on échange « et » et « ou ».',
          formula:
            'non (P et Q) = (non P) ou (non Q)\nnon (P ou Q) = (non P) et (non Q)\nNON(ET(A;B)) = OU(NON(A);NON(B))',
        },
        {
          kind: 'example',
          title: 'Pour débuter : la sortie de Léa',
          text: 'Léa sort si elle a fini ses devoirs et s’il fait beau.',
          steps: [
            'Contraire : elle reste si ses devoirs ne sont pas finis ou s’il ne fait pas beau.',
            'Un seul empêchement suffit à la garder.',
            'Écrire « et » ici oublierait le cas d’un seul empêchement.',
          ],
        },
        {
          kind: 'method',
          title: 'Nier, puis échanger',
          text: 'Pour écrire le contraire d’une règle.',
          steps: [
            'Nier chaque condition, comparaison comprise.',
            'Échanger le connecteur : « et » devient « ou », « ou » devient « et ».',
            'Contrôler sur un cas où une seule condition est vraie.',
          ],
        },
      ],
    },
  ),
  pourComprendre(
    {
      screenId: 'B1-05-A2-03-ENFANT-TOISE',
      titre: 'Sous la barre de la girafe',
      concepts: ['proposition', 'negation'],
    },
    {
      fichier: 'toise-manege.webp',
      scene:
        'À l’entrée du manège, une girafe en bois porte une barre : on passe si on la touche ou si on la dépasse. Celui qui la touche tout juste du haut de la tête entre aussi ; seul le plus petit reste dehors.',
      imageAlt:
        'Dessin : l’entrée d’un manège avec une toise en forme de girafe et une barre horizontale ; un enfant dépasse la barre, un autre la touche pile du haut de la tête, un troisième est trop petit et regarde le manège.',
      regle:
        'un prédicat P(x), comme « x ≥ 120 », devient vrai ou faux quand on remplace x par une valeur. Sa négation non P(x) est « x < 120 » : la valeur de la borne change de camp.',
      correspondances: [
        ['La barre', 'la borne 120 cm'],
        ['Toucher ou dépasser la barre', 'le prédicat « x ≥ 120 »'],
        ['Celui qui touche pile la barre', 'x = 120 vérifie P(x)'],
        ['Le plus petit', 'la négation « x < 120 »'],
      ],
    },
    'Question : « Celui qui touche pile la barre est-il du côté des refusés ? » Non : la négation de « ≥ » est « < ».',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-05-A2-03-COURS-PREDICATS',
      titre: 'Cours : prédicats et négation',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['proposition', 'negation'],
      notes: moteur.puces(
        moteur.DEUXIEME_PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : la borne change de camp.',
      ),
    },
    'lesson',
    {
      title: 'Prédicats et négation : la borne change de camp',
      subtitle: 'Trace écrite · notion 2 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Prédicat',
          text: 'Un prédicat est une phrase qui contient une variable x : P(x) est vraie ou fausse selon x.\nSa négation est vraie exactement quand P(x) est fausse.',
          formula:
            'non (x ≥ a) : x < a\nnon (x > a) : x ≤ a\nnon (x = a) : x ≠ a',
        },
        {
          kind: 'example',
          title: 'Pour débuter : la majorité de Léa',
          text: 'P(x) : « x ≥ 18 », x l’âge en années.',
          steps: [
            'P(18) est vraie : 18 ≥ 18.',
            'non P(x) : « x < 18 ».',
            'Écrire « x ≤ 18 » mettrait 18 des deux côtés.',
          ],
        },
        {
          kind: 'method',
          title: 'La borne change de camp',
          text: 'Pour nier une comparaison, au tableur comme à l’écrit.',
          steps: [
            'Repérer la borne et si elle est comprise.',
            'Écrire le contraire : la borne passe de l’autre côté.',
            'Tester la valeur de la borne : elle vérifie un seul des deux.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B1-05-A2-04-EXEMPLE-PRIME',
      titre: 'Exemple guidé : la prime des animateurs',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['negation', 'tableur'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b1-05-a2-exemple-prime',
          enonce:
            'Les animateurs touchent une prime s’ils animent au moins 20 soirées dans le trimestre ou si leur note des clients atteint 4 sur 5. Soirées en B2, note en C2.',
          etapes: [
            {
              id: 'propositions',
              intitule: 'Les deux prédicats',
              raisonnement:
                'P(s) : « s ≥ 20 », s le nombre de soirées. Q(n) : « n ≥ 4 », n la note. Prime si « P ou Q ».',
              invite: 'Quelles sont les deux conditions ?',
            },
            {
              id: 'negations',
              intitule: 'Nier chaque condition',
              raisonnement: 'non P : « s < 20 ». non Q : « n < 4 ».',
              invite: 'Quel est le contraire de chaque condition ?',
            },
            {
              id: 'morgan',
              intitule: 'Échanger le connecteur',
              raisonnement:
                'Pas de prime si « s < 20 et n < 4 » : il manque les deux.',
              invite: 'Quand un animateur n’a-t-il pas de prime ?',
            },
            {
              id: 'borne',
              intitule: 'La borne',
              raisonnement:
                'Un animateur à 20 soirées pile a la prime : 20 n’est pas < 20.',
              invite: 'Un animateur à 20 soirées pile a-t-il la prime ?',
            },
            {
              id: 'tableur',
              intitule: 'Au tableur',
              raisonnement:
                '=SI(ET(B2<20;C2<4);"sans prime";"prime") donne le même résultat que =SI(NON(OU(B2>=20;C2>=4));"sans prime";"prime").',
              invite: 'Quelle formule avec ET, sans NON ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur l’échange du connecteur (étape 3).',
        'Transition : « Nier les règles de Partie Libre : exercice 2. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-05-A2-05-ATELIER-NEGATIONS',
      titre: 'Exercice 2 — Le contraire des règles',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 6,
      concepts: ['negation', 'connecteur'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 4),
        'Réflexion : écrire chaque règle avec P et Q avant de la nier.',
        'Pièges : connecteur gardé ; borne gardée du même côté.',
        'Papier : exercice 2 du livret.',
      ),
      proprietes: {
        intitule: 'Exercice 2 — Le contraire des règles',
        consigne: `Les règles du dossier. ${REGLE_DE_LA_REMISE} ${REGLE_DE_LA_LIVRAISON} Pour chaque question, choisissez le contraire exact.`,
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b1-05-a2-contraire-livraison',
            'negation',
            true,
            `Quel est le contraire de « panier ≥ ${SEUIL_DE_LA_LIVRAISON} € ou abonné » ?`,
            `« Panier < ${SEUIL_DE_LA_LIVRAISON} € et non abonné »`,
            [
              [
                `« Panier < ${SEUIL_DE_LA_LIVRAISON} € ou non abonné »`,
                SANS_MORGAN,
              ],
            ],
          ),
          moteur.vote(
            'b1-05-a2-contraire-remise',
            'negation',
            true,
            `Quel est le contraire de « fidèle et panier ≥ ${SEUIL_DE_LA_REMISE} € » ?`,
            `« Non fidèle ou panier < ${SEUIL_DE_LA_REMISE} € »`,
            [
              [
                `« Non fidèle et panier < ${SEUIL_DE_LA_REMISE} € »`,
                SANS_MORGAN,
              ],
              [
                `« Non fidèle ou panier ≤ ${SEUIL_DE_LA_REMISE} € »`,
                COMPARAISON,
              ],
            ],
          ),
          moteur.vote(
            'b1-05-a2-predicat',
            'negation',
            true,
            'P(p) : « le panier p dépasse 30 € », soit p > 30. Quelle est sa négation ?',
            '« p ≤ 30 »',
            [['« p < 30 »', COMPARAISON]],
          ),
          moteur.vote(
            'b1-05-a2-non-et-tableur',
            'negation',
            true,
            `Fidélité en B2, panier en C2. Quelle formule équivaut à =NON(ET(B2="oui";C2>=${SEUIL_DE_LA_REMISE})) ?`,
            `=OU(B2<>"oui";C2<${SEUIL_DE_LA_REMISE})`,
            [[`=ET(B2<>"oui";C2<${SEUIL_DE_LA_REMISE})`, SANS_MORGAN]],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE,
        'Transition : « Ces règles au tableur : exercice 3. »',
      ],
    },
    [
      [
        'b1-05-a2-contraire-livraison',
        'Morgan : non (P ou Q) = non P et non Q. Le client paie s’il manque les deux.',
      ],
      [
        'b1-05-a2-contraire-remise',
        `Morgan : non (P et Q) = non P ou non Q ; le contraire de ≥ ${SEUIL_DE_LA_REMISE} est < ${SEUIL_DE_LA_REMISE}.`,
      ],
      [
        'b1-05-a2-predicat',
        'Le contraire de « > 30 » met 30 de l’autre côté : « ≤ 30 ».',
      ],
      [
        'b1-05-a2-non-et-tableur',
        'NON(ET(A;B)) = OU(NON(A);NON(B)) ; NON(B2="oui") s’écrit B2<>"oui".',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-05-A2-06-TABLEUR-CONTROLES',
      titre: 'Exercice 3 — Les contrôles des commandes au tableur',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 8,
      concepts: ['tableur', 'connecteur', 'negation'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : écrire sur papier la règle de F2 avec Morgan avant de la taper.',
        'Erreurs à chercher : OU à la place de ET ; > à la place de >= ; contraire sans Morgan ; textes sans guillemets.',
        'Papier : formules écrites sur la copie avec la grille des cellules.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: FEUILLE_DES_CONTROLES.plan,
        questions: [
          moteur.questionDeFeuille(
            FEUILLE_DES_CONTROLES.plan,
            FEUILLE_DES_CONTROLES.attendus,
            'connecteur',
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Transition : jalon 2.',
      ],
    },
    [
      [
        'E2 à E7',
        `${FORMULE_DE_LA_REMISE}, recopiée vers le bas : la remise exige les deux conditions, ${SEUIL_DE_LA_REMISE} € compris.`,
      ],
      [
        'F2 à F7',
        `${FORMULE_DU_PORT}, recopiée vers le bas : le contraire de « panier ≥ ${SEUIL_DE_LA_LIVRAISON} € ou abonné », par Morgan. ${FRAIS_DE_PORT} € de port s’ajoutent au panier remisé seulement si les deux manquent.`,
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B1-05-A2-07-JALON',
      titre: 'Jalon 2 : nier une règle',
      concepts: ['negation'],
    },
    {
      id: 'b1-05-a2-jalon',
      invite:
        'Je sais nier une comparaison et une règle à deux conditions avec les lois de Morgan.',
    },
    'Si plus de 30 % « Perdu » : reprendre la trace écrite A2-02 sur Morgan.',
  ),
];

const ACTE_3: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B1-05-A3-01-VOTE-QUANTIFICATEURS',
      titre: 'Vote : tous, au moins un',
      dureeMinutes: 5,
      concepts: ['quantificateur'],
      notes: moteur.notesDuVoteQuiOuvreLaNotion(3),
    },
    [
      moteur.vote(
        'b1-05-a3-vote-tous',
        'quantificateur',
        false,
        '« Tous les jeux du rayon sont en stock. » Que suffit-il de trouver pour la contredire ?',
        'Un seul jeu du rayon en rupture',
        [['Que tous les jeux du rayon soient en rupture', POUR_TOUT_EN_AUCUN]],
      ),
      moteur.vote(
        'b1-05-a3-vote-ordre',
        'quantificateur',
        false,
        '« Chaque table a un animateur » et « un animateur s’occupe de toutes les tables » : même sens ?',
        'Non : la seconde affirme un seul animateur pour toutes les tables',
        [['Oui : ce sont les mêmes mots', ORDRE]],
      ),
    ],
  ),
  pourComprendre(
    {
      screenId: 'B1-05-A3-02-ENFANT-PANIER',
      titre: 'Une pomme dans le panier',
      concepts: ['quantificateur'],
    },
    {
      fichier: 'panier-pommes.webp',
      scene:
        'Pour dire que les pommes du panier ne sont pas toutes belles, il suffit de montrer la pomme abîmée. Inutile qu’elles soient toutes gâtées.',
      imageAlt:
        'Dessin : un grand panier d’osier plein de pommes rouges sur une table de marché ; au milieu, une seule pomme brune avec un petit ver ; un enfant la montre du doigt, un autre tient une belle pomme.',
      regle:
        '« pour tout x, P(x) » se nie en « il existe x tel que non P(x) » : un seul contre-exemple suffit. « Il existe x tel que P(x) » se nie en « pour tout x, non P(x) ».',
      correspondances: [
        ['« Toutes les pommes sont belles »', 'pour tout x, P(x)'],
        ['La pomme abîmée', 'un contre-exemple'],
        ['Une pomme suffit', 'il existe x tel que non P(x)'],
      ],
    },
    'Question : « Faut-il que toutes les pommes soient gâtées pour dire que le panier n’est pas parfait ? » Non : une seule suffit.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-05-A3-02-COURS-QUANTIFICATEURS',
      titre: 'Cours : pour tout, il existe',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['quantificateur', 'negation'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : un contre-exemple suffit.',
      ),
    },
    'lesson',
    {
      title: 'Pour tout, il existe : un contre-exemple suffit',
      subtitle: 'Trace écrite · notion 3 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Les quantificateurs',
          text: '« Pour tout x » (∀) : la propriété vaut pour chaque élément.\n« Il existe x » (∃) : elle vaut pour au moins un.',
          formula:
            'non (∀x, P(x)) : ∃x, non P(x)\nnon (∃x, P(x)) : ∀x, non P(x)',
        },
        {
          kind: 'example',
          title: 'Pour débuter : les notes de Léa',
          text: '« Toutes les notes de Léa sont au-dessus de 10. » Notes : 12, 9, 14.',
          steps: [
            'La note 9 est un contre-exemple : la phrase est fausse.',
            'Son contraire : « au moins une note est au plus 10 ».',
            'Pas « aucune note n’est au-dessus de 10 » : 12 et 14 le sont.',
          ],
        },
        {
          kind: 'method',
          title: 'Un contre-exemple suffit',
          text: 'Pour contrôler une règle sur un fichier.',
          steps: [
            '« Pour tout » : chercher une seule ligne qui la contredit.',
            '« Il existe » : trouver une seule ligne qui la vérifie.',
            'Nier : échanger ∀ et ∃, puis nier la propriété.',
          ],
        },
      ],
    },
  ),
  pourComprendre(
    {
      screenId: 'B1-05-A3-03-ENFANT-CLES',
      titre: 'Une clé chacun ou une clé pour tous',
      concepts: ['quantificateur'],
    },
    {
      fichier: 'cles-cadenas.webp',
      scene:
        'À gauche, devant quatre casiers, quatre amis tiennent chacun leur clé, toutes différentes. À droite, devant les mêmes casiers, un seul tient une clé dorée qui les ouvre tous.',
      imageAlt:
        'Dessin : à gauche, quatre casiers colorés, devant chacun un enfant avec une clé de la même couleur ; à droite, les mêmes casiers ouverts et un seul enfant qui tient une grosse clé dorée.',
      regle:
        'l’ordre des quantificateurs compte. « Pour tout casier, il existe une clé qui l’ouvre » permet une clé par casier ; « il existe une clé qui ouvre tous les casiers » exige un passe-partout.',
      correspondances: [
        ['Une clé par casier', 'pour tout casier, il existe une clé'],
        ['La clé dorée', 'il existe une clé pour tous les casiers'],
        ['Les deux scènes', 'les mêmes mots, dans un autre ordre'],
      ],
    },
    'Question : « Quatre clés différentes font-elles un passe-partout ? » Non : la seconde phrase est plus exigeante.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-05-A3-03-COURS-ORDRE',
      titre: 'Cours : l’ordre des quantificateurs',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['quantificateur'],
      notes: moteur.puces(
        moteur.DEUXIEME_PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : qui choisit en second dépend du premier.',
      ),
    },
    'lesson',
    {
      title: 'L’ordre des quantificateurs : le second dépend du premier',
      subtitle: 'Trace écrite · notion 3 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: '∀ puis ∃, ou ∃ puis ∀',
          text: '« ∀x, ∃y », pour tout x, il existe y : y peut changer avec x.\n« ∃y, ∀x », il existe y pour tout x : un même y convient à tous les x. La seconde phrase entraîne la première, pas l’inverse.',
          formula:
            '∃y, ∀x, P(x ; y) ⇒ ∀x, ∃y, P(x ; y)\nS’il existe y pour tout x, alors pour tout x il existe y',
        },
        {
          kind: 'example',
          title: 'Pour débuter : les tuteurs de la classe',
          text: '« Chaque élève a un tuteur » et « un tuteur suit tous les élèves ».',
          steps: [
            'Quatre élèves, quatre tuteurs différents : la première est vraie.',
            'La seconde est fausse : aucun tuteur ne suit les quatre.',
            'Échanger l’ordre change le sens.',
          ],
        },
        {
          kind: 'method',
          title: 'Le second dépend du premier',
          text: 'Pour lire une phrase à deux quantificateurs.',
          steps: [
            'Repérer le premier quantificateur : il fixe ce qu’on choisit d’abord.',
            'Le second peut dépendre du premier, jamais l’inverse.',
            'Tester sur un petit exemple avant de conclure.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B1-05-A3-04-EXEMPLE-STOCK',
      titre: 'Exemple guidé : le stock du bar de Tours',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['quantificateur', 'negation'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b1-05-a3-exemple-stock',
          enonce:
            'Bar de Tours, cinq jeux de la vitrine : quantités en stock 4, 0, 7, 3 et 9. Chaque jeu a son fournisseur.',
          etapes: [
            {
              id: 'pour-tout',
              intitule: '« Tous en stock » ?',
              raisonnement:
                'Le deuxième jeu, à 0, est un contre-exemple : la phrase est fausse.',
              invite: '« Tous les jeux sont en stock » : vraie ou fausse ?',
            },
            {
              id: 'negation-pour-tout',
              intitule: 'Son contraire',
              raisonnement:
                '« Au moins un jeu n’est pas en stock », et non « aucun jeu n’est en stock ».',
              invite:
                'Quel est le contraire de « tous les jeux sont en stock » ?',
            },
            {
              id: 'il-existe',
              intitule: '« Il existe » ?',
              raisonnement:
                '« Il existe un jeu à plus de 8 exemplaires » : vraie, le dernier en a 9.',
              invite: 'Existe-t-il un jeu à plus de 8 exemplaires ?',
            },
            {
              id: 'negation-il-existe',
              intitule: 'Son contraire',
              raisonnement: '« Tous les jeux ont au plus 8 exemplaires ».',
              invite:
                'Quel est le contraire de « il existe un jeu à plus de 8 exemplaires » ?',
            },
            {
              id: 'ordre',
              intitule: 'L’ordre',
              raisonnement:
                '« Chaque jeu a un fournisseur » est vraie ; « un fournisseur livre tous les jeux » ne l’est pas forcément.',
              invite:
                'Les deux phrases sur les fournisseurs disent-elles la même chose ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur le contraire de « tous » (étape 2).',
        'Transition : « Le fichier des clients, puis l’exercice 4. »',
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: RENVOI_AU_FICHIER_DES_CLIENTS,
      titre: 'Le fichier des clients de la boutique en ligne',
      diffusion: 'seance',
      dureeMinutes: 1,
      concepts: ['proposition'],
      notes: moteur.puces(
        '1 min : faire lire une ligne à voix haute, sans rien compter ; l’exercice 4 compte.',
      ),
    },
    'table',
    {
      title: 'Le fichier des clients de la boutique en ligne',
      subtitle: 'Huit clients de la semaine, avec leur dernier panier.',
      columns: [
        { key: 'client', label: 'Client' },
        { key: 'fidele', label: 'Fidèle' },
        { key: 'panier', label: 'Panier' },
        { key: 'abonne', label: 'Abonné au club' },
      ],
      rows: CLIENTS.map((candidat) => ({
        client: candidat.nom,
        fidele: ouiNon(candidat.fidele),
        panier: `${candidat.panier} €`,
        abonne: ouiNon(candidat.abonne),
      })),
      note: DONNEES_FICTIVES,
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-05-A3-06-ATELIER-CLIENTS',
      titre: 'Exercice 4 — Contrôler le fichier des clients',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 10,
      concepts: ['quantificateur', 'connecteur', 'negation'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 8),
        'Réflexion : pour chaque règle, écrire quelles lignes la contredisent.',
        'Pièges : condition fausse comptée comme contre-exemple ; « ou » compté deux fois ; quantificateurs niés ou échangés.',
        'Papier : exercice 4 du livret, fichier imprimé.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_FICHIER_DES_CLIENTS,
        intitule: 'Exercice 4 — Contrôler le fichier des clients',
        consigne: `Lisez le fichier des huit clients. ${REGLE_DE_LA_LIVRAISON} ${DONNEES_FICTIVES}`,
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b1-05-a3-contre-exemples',
            'connecteur',
            `Règle de contrôle : « si le panier atteint ${SEUIL_DE_LA_REMISE} €, alors le client est fidèle ». Combien de clients du fichier la contredisent ?`,
            'clients',
            CONTRE_EXEMPLES,
            moteur.A_L_UNITE,
            enClients(CONTRE_EXEMPLES),
            [
              [NON_FIDELES, PREMISSE_FAUSSE],
              [HORS_EQUIVALENCE, RECIPROQUE],
            ],
          ),
          moteur.numerique(
            'b1-05-a3-livraison',
            'connecteur',
            'Combien de clients du fichier ont la livraison offerte ?',
            'clients',
            LIVRAISONS_OFFERTES,
            moteur.A_L_UNITE,
            enClients(LIVRAISONS_OFFERTES),
            [
              [LIVRAISONS_ADDITIONNEES, OU_COMPTE_DEUX_FOIS],
              [LIVRAISONS_EXCLUSIVES, OU_EXCLUSIF],
            ],
          ),
          moteur.vote(
            'b1-05-a3-negation-tous',
            'quantificateur',
            true,
            'Inès affirme : « tous les abonnés sont fidèles ». Quel est le contraire de sa phrase ?',
            '« Au moins un abonné n’est pas fidèle »',
            [['« Aucun abonné n’est fidèle »', POUR_TOUT_EN_AUCUN]],
          ),
          moteur.vote(
            'b1-05-a3-negation-existe',
            'quantificateur',
            true,
            'Quel est le contraire de « il existe un client au panier d’au moins 80 € » ?',
            '« Tous les clients ont un panier de moins de 80 € »',
            [
              [
                '« Il existe un client au panier de moins de 80 € »',
                IL_EXISTE_GARDE,
              ],
            ],
          ),
          moteur.vote(
            'b1-05-a3-ordre',
            'quantificateur',
            true,
            'A : « pour tout client fidèle, il existe un client au panier plus grand ». B : « il existe un client fidèle dont le panier dépasse celui de tous les autres ». Laquelle est vraie dans le fichier ?',
            'A seulement',
            [['Les deux : ce sont les mêmes mots', ORDRE]],
          ),
        ],
      },
    },
    {
      minutes: 3,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE,
        'Faire nommer au pupitre chaque contre-exemple du fichier.',
        'Transition : jalon 3, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'b1-05-a3-contre-exemples',
        `Seuls les clients au panier d’au moins ${SEUIL_DE_LA_REMISE} € et non fidèles contredisent la règle : Bilal et Gaël. Emma, non fidèle à 45 €, ne la contredit pas : sa condition est fausse.`,
      ],
      [
        'b1-05-a3-livraison',
        `Ana, Bilal, David et Farid. Additionner les ${SEUIL_DE_LA_LIVRAISON} € et plus et les abonnés compte Bilal et Farid deux fois.`,
      ],
      [
        'b1-05-a3-negation-tous',
        'Un seul abonné non fidèle suffit à contredire Inès : Bilal.',
      ],
      [
        'b1-05-a3-negation-existe',
        'Le contraire de « il existe » est « pour tout », avec la propriété niée.',
      ],
      [
        'b1-05-a3-ordre',
        'A : chaque fidèle a moins que Bilal, à 85 €. B : aucun fidèle ne dépasse Bilal, qui n’est pas fidèle.',
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B1-05-A3-07-JALON',
      titre: 'Jalon 3 : contrôler avec des quantificateurs',
      concepts: ['quantificateur'],
    },
    {
      id: 'b1-05-a3-jalon',
      invite:
        'Je sais nier « pour tout » et « il existe », et je lis l’ordre des quantificateurs.',
    },
    moteur.PAUSE_HORS_DUREE,
  ),
];

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  [OU_EXCLUSIF]: 'B1-05-A1-06-COURS-CONNECTEURS',
  [ET_PAR_OU]: 'B1-05-A1-06-COURS-CONNECTEURS',
  [OU_COMPTE_DEUX_FOIS]: 'B1-05-A1-06-COURS-CONNECTEURS',
  [BORNE]: 'B1-05-A1-06-COURS-CONNECTEURS',
  [RECIPROQUE]: 'B1-05-A1-07-COURS-IMPLICATION',
  [PREMISSE_FAUSSE]: 'B1-05-A1-07-COURS-IMPLICATION',
  [SANS_MORGAN]: 'B1-05-A2-02-COURS-MORGAN',
  [COMPARAISON]: 'B1-05-A2-03-COURS-PREDICATS',
  [POUR_TOUT_EN_AUCUN]: 'B1-05-A3-02-COURS-QUANTIFICATEURS',
  [IL_EXISTE_GARDE]: 'B1-05-A3-02-COURS-QUANTIFICATEURS',
  [ORDRE]: 'B1-05-A3-03-COURS-ORDRE',
};

const POUR_COMPRENDRE = [
  ['M1', 'serrures-portes.webp', 'Deux clés ou deux portes'],
  ['M2', 'pluie-arrosoir.webp', 'Le chemin mouillé'],
  ['M3', 'portillon-casque.webp', 'Le billet et le casque'],
  ['M4', 'toise-manege.webp', 'Sous la barre de la girafe'],
  ['M5', 'panier-pommes.webp', 'Une pomme dans le panier'],
  ['M6', 'cles-cadenas.webp', 'Une clé chacun ou une clé pour tous'],
] as const;

const MEDIAS = moteur.mediasDesIllustrations(
  DOSSIER_DES_IMAGES,
  POUR_COMPRENDRE,
  GRAVURE_DE_L_ACCROCHE,
);

export const COURS_B1_05 = moteur.coursB1(
  [ACTE_1, ACTE_2, ACTE_3, ACTE_4],
  REMEDIATIONS,
  MEDIAS,
  {
    slug: 'b1-05-logique-conditions',
    titre: 'Logique : conditions et contrôles',
    gabarit: 'v3',
    concepts: [...CONCEPTS_DU_COURS],
  },
);
