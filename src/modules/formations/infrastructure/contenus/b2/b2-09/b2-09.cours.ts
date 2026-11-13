import { avecLesProduits } from '../../../../domain/cours/structure/ArbrePondere';
import type { ContenuDeCours } from '../../../../domain/cours/stockage/CoursStocke';
import * as moteur from '../../briques';
import { ACTE_5 } from './b2-09.acte-5';
import {
  AUTRES_EFFECTIFS,
  BRANCHES_ADDITIONNEES,
  CHEMIN_SANS_LETTRE,
  COMPLEMENT,
  CONCEPTS_DU_COURS,
  CONDITION_IGNOREE,
  CORRIGE_DU_TABLEAU,
  DEFECTUEUSE_DE_LA_ROCHELLE,
  DEFECTUEUSE_DE_ROCHEFORT,
  INCOMPATIBILITE,
  INCOMPLETES,
  INTERSECTION,
  INTERSECTION_DE_LA_LETTRE,
  INVERSEE,
  MAUVAIS_TOTAL,
  PAIEMENTS_EN_RETARD,
  PLAN_DU_TABLEAU_CROISE,
  PREMIER_EFFECTIF,
  RETARD_EN_TROIS_FOIS,
  REUNION,
  SAC_SUR_MOBILE,
  SANS_CALCUL,
  SANS_PONDERATION,
  VOILES_DEFECTUEUSES,
  VOILES_SANS_DEFAUT,
} from './b2-09.donnees';

const GRAVURE_DE_L_ACCROCHE = moteur.gravureDuDomainePublic({
  id: 'M9',
  chemin: '/assets/cours/gravures/v1/bernoulli-ars-conjectandi-1713.jpg',
  pageSource:
    'https://commons.wikimedia.org/wiki/File:Ars_Conjectandi_of_Jakob_Bernoulli,_1713_(1160x1130).png',
  auteur: 'Jacques Bernoulli, Ars Conjectandi',
  date: '1713',
});

const IMAGES_DU_B2_09 = '/assets/cours/b2-09/v1';

const pourComprendre = moteur.pourComprendreDans(IMAGES_DU_B2_09);

const SOURCE_DES_EXEMPLES = 'Exemple de cours, données fictives.';

const PAIEMENTS = avecLesProduits([
  {
    evenement: 'M',
    probabilite: 0.35,
    branches: [
      { evenement: 'C', probabilite: 0.8 },
      { evenement: 'C̄', probabilite: 0.2 },
    ],
  },
  {
    evenement: 'M̄',
    probabilite: 0.65,
    branches: [
      { evenement: 'C', probabilite: 0.65 },
      { evenement: 'C̄', probabilite: 0.35 },
    ],
  },
]);

const RETOURS = avecLesProduits([
  {
    evenement: 'R',
    probabilite: 0.65,
    branches: [
      { evenement: 'V', probabilite: 0.5 },
      { evenement: 'V̄', probabilite: 0.5 },
    ],
  },
  {
    evenement: 'R̄',
    probabilite: 0.35,
    branches: [
      { evenement: 'V', probabilite: 0.2 },
      { evenement: 'V̄', probabilite: 0.8 },
    ],
  },
]);

const LETTRE_ET_SAC = avecLesProduits([
  {
    evenement: 'L',
    probabilite: 0.35,
    branches: [
      { evenement: 'S', probabilite: 0.5 },
      { evenement: 'S̄', probabilite: 0.5 },
    ],
  },
  {
    evenement: 'L̄',
    probabilite: 0.65,
    branches: [
      { evenement: 'S', probabilite: 0.5 },
      { evenement: 'S̄', probabilite: 0.5 },
    ],
  },
]);

const ACTE_1: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-09-A1-01-ACCROCHE',
      titre: 'Probabilités conditionnelles : arbres, tableaux, indépendance',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['probabilite-conditionnelle', 'independance'],
      notes: moteur.puces(
        'Annoncer le plan : douze minutes pour reprendre les probabilités du lycée en images, puis trois notions, chacune en trois temps (réfléchir, comprendre, s’exercer), et la fiche mémo.',
        'Annoncer les deux pauses de 15 minutes, après l’acte 2 et après l’acte 3.',
      ),
    },
    'hero',
    {
      title: 'Probabilités conditionnelles : arbres, tableaux, indépendance',
      subtitle:
        'Parmi les clients venus par la lettre, combien achètent ? D’où vient une voile défectueuse ? Le mode de paiement change-t-il le risque de retard ? Une probabilité change quand on sait déjà quelque chose : c’est la probabilité conditionnelle.',
      bgImage: GRAVURE_DE_L_ACCROCHE.chemins[0],
      bgImageAlt:
        'Page de titre de l’Ars Conjectandi de Jacques Bernoulli, publié à Bâle en 1713, l’un des premiers livres consacrés au calcul des probabilités',
    },
  ),
  pourComprendre(
    {
      screenId: 'B2-09-A1-02-ENFANT-PART',
      titre: 'La part du gâteau',
      concepts: ['probabilite-d-un-evenement'],
    },
    {
      fichier: 'part-du-gateau.webp',
      imageAlt:
        'Un gâteau rond vu de dessus, coupé en parts toutes égales. Quelques parts portent une fraise, les autres non. Une main tend une assiette vers une part prise au hasard.',
      scene:
        'Un gâteau coupé en parts égales ; quelques parts portent une fraise, et l’on prend une part au hasard.',
      regle:
        'P(A) = nombre de cas de A ÷ nombre de cas en tout, quand tous les cas ont la même chance. Une probabilité est toujours entre 0 et 1.',
      correspondances: [
        ['Toutes les parts du gâteau', 'tous les cas possibles, l’univers'],
        ['Les parts avec une fraise', 'l’événement A'],
        ['La part du gâteau qui porte une fraise', 'P(A), entre 0 et 1'],
      ],
    },
    'Question : « Si toutes les parts portaient une fraise, que vaudrait P(A) ? » 1 : l’événement est certain.',
  ),
  pourComprendre(
    {
      screenId: 'B2-09-A1-03-ENFANT-CONTRAIRE',
      titre: 'Le sac de billes',
      concepts: ['probabilite-d-un-evenement'],
    },
    {
      fichier: 'sac-de-billes.webp',
      imageAlt:
        'Un sac en toile ouvert, rempli de billes. Les billes rouges sont regroupées d’un côté, toutes les autres, bleues, vertes et jaunes, de l’autre. Une étiquette « pas rouge » entoure le second groupe.',
      scene:
        'Dans le sac, des billes rouges et des billes d’autres couleurs : toute bille qui n’est pas rouge est d’une autre couleur.',
      regle:
        'P(Ā) = 1 − P(A) : le contraire Ā regroupe tous les cas où A n’arrive pas.',
      correspondances: [
        ['Les billes rouges', 'l’événement A'],
        ['Toutes les autres billes', 'le contraire Ā'],
        ['Le sac entier', 'tous les cas, de probabilité 1'],
      ],
    },
    'Question : « Que faut-il pour obtenir la part des billes qui ne sont pas rouges ? » Retirer la part des rouges du tout.',
  ),
  pourComprendre(
    {
      screenId: 'B2-09-A1-04-ENFANT-INTERSECTION',
      titre: 'Les deux cerceaux',
      concepts: ['probabilite-d-un-evenement'],
    },
    {
      fichier: 'deux-cerceaux.webp',
      imageAlt:
        'Deux cerceaux posés au sol, un rouge et un bleu, qui se chevauchent. Des jouets sont rangés dedans : certains dans le seul cerceau rouge, d’autres dans le seul bleu, quelques-uns dans la partie commune.',
      scene:
        'Deux cerceaux posés au sol se chevauchent ; des jouets sont rangés dedans, certains dans la partie commune.',
      regle:
        'A ∩ B, « A et B », regroupe les cas où A et B arrivent à la fois : la partie commune.',
      correspondances: [
        ['Le cerceau rouge', 'l’événement A'],
        ['Le cerceau bleu', 'l’événement B'],
        ['Les jouets de la partie commune', 'A ∩ B, A et B à la fois'],
      ],
    },
    'Question : « Un jouet du seul cerceau rouge est-il dans A ∩ B ? » Non : il est dans A, pas dans B.',
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B2-09-A1-05-VOTE-LYCEE',
      titre: 'Vote : les probabilités du lycée, deux questions',
      dureeMinutes: 6,
      concepts: ['probabilite-d-un-evenement'],
      notes: moteur.puces(
        'Récapitulatif du lycée : deux votes non notés, une question après l’autre, sans débat entre elles.',
        'Avant la révélation, faire dire au tableau ce que vaut la probabilité de l’univers : 1.',
        'La révélation s’ouvre après la question 2 : revenir sur l’écran d’image de chaque erreur, le sac de billes, puis les cerceaux.',
        'Papier : vote à main levée sur chaque question.',
      ),
    },
    [
      moteur.vote(
        'b2-09-a1-vote-contraire',
        'probabilite-d-un-evenement',
        false,
        'Dans un sac, la probabilité de tirer une bille rouge vaut 0,15. Que vaut la probabilité de ne pas tirer une bille rouge ?',
        '1 − 0,15, soit 0,85',
        [['0,15 aussi, c’est la même bille', COMPLEMENT]],
      ),
      moteur.vote(
        'b2-09-a1-vote-reunion',
        'probabilite-d-un-evenement',
        false,
        'P(A) = 0,5, P(B) = 0,4 et P(A ∩ B) = 0,15. Que vaut P(A ∪ B) ?',
        '0,5 + 0,4 − 0,15, soit 0,75',
        [['0,5 + 0,4, soit 0,9', REUNION]],
      ),
    ],
  ),
  pourComprendre(
    {
      screenId: 'B2-09-A1-06-ENFANT-REUNION',
      titre: 'Les cerceaux réunis',
      concepts: ['probabilite-d-un-evenement'],
    },
    {
      fichier: 'cerceaux-reunis.webp',
      imageAlt:
        'Les deux cerceaux qui se chevauchent, vus de dessus. Une main compte les jouets un à un : ceux de la partie commune portent une seule pastille, pas deux.',
      scene:
        'On compte les jouets des deux cerceaux ; ceux de la partie commune ne se comptent qu’une fois.',
      regle:
        'P(A ∪ B) = P(A) + P(B) − P(A ∩ B) : A ∪ B, « A ou B », ne compte qu’une fois la partie commune.',
      correspondances: [
        ['Les jouets dans au moins un cerceau', 'A ∪ B, A ou B'],
        [
          'La partie commune, comptée deux fois si l’on ajoute les deux cerceaux',
          'P(A ∩ B), à retirer une fois',
        ],
        ['La pastille unique', 'chaque cas compté une seule fois'],
      ],
    },
    'Question : « Si les cerceaux ne se touchent pas, que vaut P(A ∪ B) ? » P(A) + P(B) : il n’y a rien à retirer.',
  ),
  pourComprendre(
    {
      screenId: 'B2-09-A1-07-ENFANT-TABLEAU',
      titre: 'La commode à tiroirs',
      concepts: ['probabilite-d-un-evenement', 'probabilite-conditionnelle'],
    },
    {
      fichier: 'commode-a-tiroirs.webp',
      imageAlt:
        'Une grande commode en bois : chaque rangée de tiroirs porte une taille de chaussettes, chaque colonne une couleur. Une étiquette sur chaque tiroir indique combien de paires il contient, et une étiquette au bout de chaque rangée en donne le total.',
      scene:
        'Une commode range les chaussettes par taille, une rangée par taille, et par couleur, une colonne par couleur ; une étiquette compte chaque tiroir.',
      regle:
        'Un tableau croisé compte dans chaque case les cas de A ∩ B ; les totaux des lignes et des colonnes redonnent l’effectif total.',
      correspondances: [
        ['Une rangée de tiroirs', 'une ligne, un événement A'],
        ['Une colonne de tiroirs', 'une colonne, un événement B'],
        ['Un tiroir', 'une case, l’effectif de A ∩ B'],
        ['L’étiquette au bout de la rangée', 'l’effectif de A'],
      ],
    },
    'Transition : « Les probabilités du lycée sont en place. Place au dossier du jour. »',
  ),
];

const ACTE_2: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-09-A2-01-DOSSIER',
      titre: 'Le dossier des clients de l’atelier',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['probabilite-conditionnelle', 'probabilites-totales'],
      notes: moteur.puces(
        '1 min de lecture silencieuse ; ne rien calculer.',
        'Faire dire les trois questions d’Hélène : qui achète parmi les clients de la lettre, d’où viennent les défauts, le paiement change-t-il le risque de retard.',
      ),
    },
    'table',
    {
      title: 'Le dossier des clients de l’atelier',
      subtitle:
        'Ce que sait Hélène Garnier avant de lire ses clients par groupes.',
      columns: [...moteur.COLONNES_DU_DOSSIER],
      rows: [
        {
          rubrique: 'La boutique en ligne',
          contenu:
            'Les sacs et les accessoires de l’atelier se vendent en ligne. Une partie des clients arrive par la lettre d’information, les autres par la recherche.',
        },
        {
          rubrique: 'Les deux ateliers',
          contenu:
            'Les voiles sont cousues à La Rochelle et à Rochefort. Chaque atelier a sa propre part de voiles défectueuses.',
        },
        {
          rubrique: 'Les paiements',
          contenu:
            'Les clients paient en une fois ou en trois fois, sur mobile ou sur ordinateur. Quelques paiements arrivent en retard.',
        },
        {
          rubrique: 'Les questions d’Hélène',
          contenu:
            'Parmi les clients de la lettre, quelle part achète ? Une voile défectueuse vient-elle plutôt de Rochefort ? Payer en trois fois change-t-il le risque de retard ?',
        },
      ],
      note: moteur.DONNEES_FICTIVES_DU_B2,
    },
  ),
  {
    screenId: 'B2-09-A2-02-MISSION',
    titre: 'Votre mission : lire les clients par groupes',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 5,
    concepts: ['probabilite-conditionnelle', 'independance'],
    notes: moteur.puces(
      'Lecture à voix haute du courriel (1 min), puis 3 min d’écriture individuelle et 1 min de mise en commun au pupitre.',
      'Question 1 : faire dire que « parmi les clients de la lettre » restreint le groupe qu’on regarde.',
      'Question 2 : faire dire qu’un atelier qui coud peu de voiles peut produire beaucoup des défectueuses.',
      'Question 3 : laisser ouvert ; c’est l’acte 4.',
      'Papier : trois lignes d’écriture dans le livret.',
    ),
    proprietes: {
      metier:
        'Assistant·e de gestion — Atelier Rivage (voilerie artisanale, 14 salariés, La Rochelle)',
      situation:
        'Lundi, 9 h. Hélène Garnier écrit : « Je voudrais mieux connaître nos clients : ceux de la lettre achètent-ils plus que les autres ? Quand une voile revient défectueuse, de quel atelier vient-elle le plus souvent ? Et le paiement en trois fois augmente-t-il les retards ? » Marc Lefèvre, l’expert-comptable, ajoute : « Attention, la part des acheteurs parmi les clients de la lettre n’est pas la part des clients de la lettre parmi les acheteurs. »',
      geste:
        'Sans calculatrice, répondez aux trois questions à partir du dossier.',
      consequence:
        'Confondre les groupes fait viser le mauvais atelier ou la mauvaise lettre d’information.',
      questionsLibres: [
        {
          id: 'b2-09-a2-mission:lettre',
          question:
            '« Parmi les clients de la lettre, la part qui achète » : sur quel groupe compte-t-on ?',
          placeholder: 'On compte sur…',
        },
        {
          id: 'b2-09-a2-mission:atelier',
          question:
            'Si Rochefort coud peu de voiles mais beaucoup de défectueuses, d’où vient le plus souvent une voile défectueuse ?',
          placeholder: 'Plutôt de…, parce que…',
        },
        {
          id: 'b2-09-a2-mission:retard',
          question:
            'Comment savoir si le paiement en trois fois change le risque de retard ?',
          placeholder: 'On pourrait comparer…',
        },
      ],
    },
  },
  pourComprendre(
    {
      screenId: 'B2-09-A2-03-ENFANT-RUISSEAUX',
      titre: 'Les ruisseaux qui se partagent',
      concepts: ['probabilite-conditionnelle'],
    },
    {
      fichier: 'ruisseaux-qui-se-partagent.webp',
      imageAlt:
        'Une source en haut d’une colline. Son eau se partage en deux ruisseaux, l’un large, l’autre étroit ; chaque ruisseau se partage à nouveau en deux. En bas, quatre petits bassins recueillent l’eau, plus ou moins remplis.',
      scene:
        'L’eau d’une source se partage en deux ruisseaux, puis chaque ruisseau se partage encore ; en bas, quatre petits bassins.',
      regle:
        'Sur un arbre pondéré, P(A ∩ B) = P(A) × P_A(B) : on multiplie le long d’un chemin, et les branches d’un même nœud somment à 1.',
      correspondances: [
        ['La source', 'l’univers, de probabilité 1'],
        ['Le premier partage', 'la première génération, P(A) et P(Ā)'],
        ['Le second partage', 'la seconde génération, P_A(B) et P_A(B̄)'],
        ['L’eau d’un petit bassin', 'le produit le long du chemin'],
      ],
    },
    'Question : « Toute l’eau de la source arrive-t-elle dans les bassins ? » Oui : les quatre produits somment à 1.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-09-A2-04-ARBRE-EXEMPLE',
      titre: 'Un arbre pondéré, produits au bout des chemins',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['probabilite-conditionnelle'],
      notes: moteur.puces(
        'Lire l’arbre de gauche à droite : la première génération, puis la seconde, puis les produits.',
        'Faire vérifier que chaque nœud somme à 1, et que les quatre produits aussi.',
      ),
    },
    'arbre',
    {
      title: 'Le paiement sur la boutique',
      subtitle: SOURCE_DES_EXEMPLES,
      branches: PAIEMENTS,
      reading:
        'M : le client paie sur mobile ; C : il paie par carte. Le chemin M puis C porte 0,35 × 0,8 = 0,28.',
      description:
        'Arbre pondéré à deux générations. De la racine partent M, 0,35, et M̄, 0,65. Sous M : C, 0,8, et C̄, 0,2. Sous M̄ : C, 0,65, et C̄, 0,35. Au bout des chemins, les produits : 0,28 ; 0,07 ; 0,4225 ; 0,2275.',
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-09-A2-05-COURS-ARBRE',
      titre: 'Cours : l’arbre pondéré et P_A(B)',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['probabilite-conditionnelle'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire lire P_A(B) à voix haute : « probabilité de B sachant A ».',
      ),
    },
    'lesson',
    {
      title: 'L’arbre pondéré et P_A(B)',
      subtitle: 'Trace écrite · notion 1 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Probabilité conditionnelle',
          text: 'P_A(B), lue « probabilité de B sachant A », est la probabilité de B quand on sait que A est réalisé : la part des B parmi les A. Elle n’existe que si P(A) n’est pas nul.',
        },
        {
          kind: 'property',
          title: 'L’arbre pondéré',
          text: 'La première génération porte P(A) et P(Ā) ; la seconde porte P_A(B), P_A(B̄), P_Ā(B), P_Ā(B̄). Les branches d’un même nœud somment à 1. On multiplie le long d’un chemin.',
          formula: 'P(A ∩ B) = P(A) × P_A(B)',
        },
        {
          kind: 'example',
          title: 'Pour débuter : le paiement sur la boutique',
          text: 'M : le client paie sur mobile ; C : il paie par carte.',
          steps: [
            'Première génération : P(M) = 0,35 et P(M̄) = 1 − 0,35 = 0,65.',
            'Seconde génération sous M : P_M(C) = 0,8 et P_M(C̄) = 0,2.',
            'Chemin M puis C : P(M ∩ C) = 0,35 × 0,8 = 0,28.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : les pièges de l’arbre',
          text: 'Pièges : lire P(A ∩ B) sur une branche, où l’on lit P_A(B) ; additionner le long d’un chemin ; compléter un nœud avec la branche d’un autre nœud.',
          steps: [
            'Nommer les événements avec une lettre et une phrase.',
            'Compléter chaque nœud à 1.',
            'Multiplier le long du chemin demandé.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-09-A2-06-EXEMPLE-ARBRE',
      titre: 'Exemple guidé : construire l’arbre des paiements',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['probabilite-conditionnelle'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-09-a2-exemple-arbre',
          enonce:
            'Sur la boutique, 35 % des clients paient sur mobile (M). 80 % d’entre eux paient par carte (C) ; parmi les autres, 65 %. Construire l’arbre, puis calculer P(M ∩ C).',
          etapes: [
            {
              id: 'premiere-generation',
              intitule: 'La première génération',
              raisonnement: 'P(M) = 0,35 et P(M̄) = 1 − 0,35 = 0,65.',
              invite: 'Écrivez les deux branches issues de la racine.',
            },
            {
              id: 'seconde-generation',
              intitule: 'La seconde génération',
              raisonnement:
                'Sous M : P_M(C) = 0,8 et P_M(C̄) = 0,2. Sous M̄ : P_M̄(C) = 0,65 et P_M̄(C̄) = 0,35. « 80 % d’entre eux » est une part parmi les M : une probabilité sachant M.',
              invite: 'Écrivez les quatre branches de la seconde génération.',
            },
            {
              id: 'noeuds',
              intitule: 'Contrôler les nœuds',
              raisonnement:
                '0,35 + 0,65 = 1 ; 0,8 + 0,2 = 1 ; 0,65 + 0,35 = 1. Chaque nœud somme à 1.',
              invite: 'Vérifiez chaque nœud.',
            },
            {
              id: 'chemin',
              intitule: 'Le chemin M puis C',
              raisonnement:
                'P(M ∩ C) = P(M) × P_M(C) = 0,35 × 0,8 = 0,28 : 28 % des clients paient sur mobile et par carte. 0,8 est P_M(C), pas P(M ∩ C).',
              invite: 'Multipliez le long du chemin.',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur l’étape 2 : « d’entre eux » annonce une probabilité conditionnelle.',
        'Transition : « À vous : exercice 1. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-09-A2-07-ATELIER-ARBRE',
      titre: 'Exercice 1 — L’arbre des clients de la lettre',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['probabilite-conditionnelle', 'probabilite-d-un-evenement'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : dessiner l’arbre sur papier, chaque nœud complété à 1, avant toute question.',
        'Pièges : lire P(L ∩ A) sur une branche ; additionner le long d’un chemin ; compléter avec la branche d’un autre nœud.',
        'Papier : exercice 1 du livret.',
      ),
      proprietes: {
        intitule: 'Exercice 1 — L’arbre des clients de la lettre',
        consigne:
          '40 % des clients de la boutique sont venus par la lettre d’information (L). Parmi eux, 55 % achètent (A) ; parmi les autres clients, 20 % achètent.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-09-a2-lecture',
            'probabilite-conditionnelle',
            true,
            'Sur l’arbre, que représente 0,55 ?',
            'P_L(A) : la part des acheteurs parmi les clients venus par la lettre',
            [
              [
                'P(L ∩ A) : la part des clients venus par la lettre et acheteurs',
                INTERSECTION,
              ],
              [
                'P(A) : la part des acheteurs parmi tous les clients',
                CONDITION_IGNOREE,
              ],
            ],
          ),
          moteur.numerique(
            'b2-09-a2-intersection',
            'probabilite-conditionnelle',
            'Combien vaut P(L ∩ A) ? Arrondir au centième.',
            null,
            INTERSECTION_DE_LA_LETTRE.solution,
            moteur.DEUX_DECIMALES,
            '0,22',
            INTERSECTION_DE_LA_LETTRE.pieges,
          ),
          moteur.vote(
            'b2-09-a2-complement',
            'probabilite-d-un-evenement',
            true,
            'Que vaut P_L̄(Ā), la part des non-acheteurs parmi les clients venus autrement ?',
            '1 − 0,2, soit 0,8',
            [['1 − 0,55, soit 0,45, comme sous L', COMPLEMENT]],
          ),
          moteur.numerique(
            'b2-09-a2-chemin',
            'probabilite-conditionnelle',
            'Combien vaut P(L̄ ∩ Ā) ? Arrondir au centième.',
            null,
            CHEMIN_SANS_LETTRE.solution,
            moteur.DEUX_DECIMALES,
            '0,48',
            CHEMIN_SANS_LETTRE.pieges,
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Transition : « Et quand les données arrivent en effectifs ? Un vote pour le deviner. »',
      ],
    },
    [
      [
        'b2-09-a2-lecture',
        '« Parmi eux, 55 % » est une part parmi les clients de la lettre : 0,55 est P_L(A), sur la branche de L vers A. P(L ∩ A) se lit au bout du chemin, pas sur la branche.',
      ],
      [
        'b2-09-a2-intersection',
        'P(L ∩ A) = P(L) × P_L(A) = 0,4 × 0,55 = 0,22. Additionner les deux branches ne suit pas un chemin ; répondre 0,55 confond P_L(A) et P(L ∩ A).',
      ],
      [
        'b2-09-a2-complement',
        'Le nœud L̄ porte A, 0,2, et Ā : P_L̄(Ā) = 1 − 0,2 = 0,8. Le 0,55 appartient au nœud L, pas à celui-ci.',
      ],
      [
        'b2-09-a2-chemin',
        'P(L̄) = 1 − 0,4 = 0,6, puis P(L̄ ∩ Ā) = 0,6 × 0,8 = 0,48. Prendre 0,2 au lieu de 0,8 donne 0,12 ; additionner donne 1,4, plus que 1.',
      ],
    ],
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B2-09-A2-08-VOTE-TABLEAU',
      titre: 'Vote : parmi qui compte-t-on ?',
      dureeMinutes: 4,
      concepts: ['probabilite-conditionnelle'],
      notes: moteur.notesDuVoteQuiRelanceLaNotion(1),
    },
    [
      moteur.vote(
        'b2-09-a2-vote-groupe',
        'probabilite-conditionnelle',
        false,
        'Sur 800 visiteurs, 160 viennent d’un réseau social, dont 40 achètent. Parmi les visiteurs venus du réseau, quelle part achète ?',
        '40 ÷ 160, soit 0,25',
        [['40 ÷ 800, soit 0,05', MAUVAIS_TOTAL]],
      ),
      moteur.vote(
        'b2-09-a2-vote-sens',
        'probabilite-conditionnelle',
        false,
        '« Parmi les acheteurs, la part venue du réseau social. » Par quoi divise-t-on ?',
        'Par le nombre d’acheteurs : la condition est l’achat',
        [['Par le nombre de visiteurs venus du réseau', INVERSEE]],
      ),
    ],
  ),
  pourComprendre(
    {
      screenId: 'B2-09-A2-09-ENFANT-LOUPE',
      titre: 'La loupe sur une ligne',
      concepts: ['probabilite-conditionnelle'],
    },
    {
      fichier: 'loupe-sur-une-ligne.webp',
      imageAlt:
        'Un grand registre ouvert sur une table, couvert de lignes et de colonnes cochées. Une loupe posée dessus grossit une seule ligne ; le reste de la page est flou.',
      scene:
        'Une loupe posée sur un grand registre ne laisse voir qu’une seule ligne ; on compte les coches de cette ligne seulement.',
      regle:
        'P_A(B) = effectif de A ∩ B ÷ effectif de A : sachant A, on ne regarde que la ligne A.',
      correspondances: [
        ['La ligne sous la loupe', 'la condition A'],
        ['Les cases cochées de cette ligne', 'les cas de A ∩ B'],
        [
          'Le reste du registre, flou',
          'les cas hors de A, qu’on ne compte pas',
        ],
      ],
    },
    'Question : « Par quel nombre divise-t-on : le total du registre, ou le total de la ligne ? » Le total de la ligne.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-09-A2-10-COURS-TABLEAU',
      titre: 'Cours : du tableau croisé à P_A(B)',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['probabilite-conditionnelle'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire montrer du doigt la ligne de la condition avant chaque division.',
      ),
    },
    'lesson',
    {
      title: 'Du tableau croisé à P_A(B)',
      subtitle: 'Trace écrite · notion 1 · page 2 sur 2',
      blocks: [
        {
          kind: 'property',
          title: 'Dans un tableau croisé',
          text: 'Sachant A, on ne garde que la ligne A : on divise l’effectif de A ∩ B par l’effectif de A, jamais par l’effectif total.',
          formula: 'P_A(B) = P(A ∩ B) ÷ P(A)',
        },
        {
          kind: 'example',
          title: 'Pour débuter : 400 visiteurs',
          text: '250 visiteurs sur mobile (M), dont 100 achètent (A) ; 150 sur ordinateur, dont 30 achètent.',
          steps: [
            'La ligne de la condition : les 250 visiteurs sur mobile.',
            'P_M(A) = 100 ÷ 250 = 0,4.',
            'Diviser par 400 donnerait P(M ∩ A), la part des visiteurs à la fois sur mobile et acheteurs, pas P_M(A).',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : les pièges du tableau',
          text: 'Pièges : diviser par l’effectif total ; diviser par la colonne au lieu de la ligne, ce qui donne P_B(A).',
          steps: [
            'Souligner la condition dans la phrase : « parmi… », « sachant… ».',
            'Repérer sa ligne ou sa colonne et son total.',
            'Diviser l’effectif de la case par ce total.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-09-A2-11-TABLEAU-CROISE',
      titre: 'Exercice 2 — Le tableau croisé des 1 000 commandes',
      diffusion: 'seance',
      brique: 'fp-table-build',
      dureeMinutes: 8,
      concepts: ['probabilite-conditionnelle'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : écrire sur papier quelle ligne porte 35 %, et laquelle 20 %.',
        'Piège : prendre 35 % des 1 000 commandes au lieu des commandes de la ligne.',
        'Papier : tableau du livret, rempli à la main.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: PLAN_DU_TABLEAU_CROISE,
        questions: [
          moteur.questionDeTableau(
            'b2-09-a2-tableau-croise',
            'probabilite-conditionnelle',
            [PREMIER_EFFECTIF, ...AUTRES_EFFECTIFS],
            0,
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter le tableau juste ; faire vérifier que chaque colonne de saisie redonne son total.',
        'Transition : jalon 1, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'b2-09-a2-tableau-croise',
        `${CORRIGE_DU_TABLEAU}. Les parts se prennent sur la ligne : 35 % des 1 000 commandes mélange les deux groupes.`,
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B2-09-A2-12-JALON',
      titre: 'Jalon 1 : arbres et tableaux',
      concepts: ['probabilite-conditionnelle'],
    },
    {
      id: 'b2-09-a2-jalon',
      invite:
        'Je sais construire un arbre pondéré ou un tableau croisé, et y lire P_A(B).',
    },
    'Si plus de 30 % « Perdu » : reprendre l’écran des ruisseaux après la pause.',
    moteur.PAUSE_HORS_DUREE,
  ),
];

const ACTE_3: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B2-09-A3-01-VOTE-TOTALES',
      titre: 'Vote : combien de chemins mènent à B ?',
      dureeMinutes: 4,
      concepts: ['probabilites-totales'],
      notes: moteur.notesDuVoteQuiOuvreLaNotion(2),
    },
    [
      moteur.vote(
        'b2-09-a3-vote-chemins',
        'probabilites-totales',
        false,
        'Sur l’arbre des paiements, combien de chemins finissent par C, « paie par carte » ?',
        'Deux : l’un passe par M, l’autre par M̄',
        [['Un seul, celui qui passe par M', INCOMPLETES]],
      ),
      moteur.vote(
        'b2-09-a3-vote-ponderer',
        'probabilites-totales',
        false,
        'Pour obtenir P(C), que fait-on de ces chemins ?',
        'On multiplie le long de chacun, puis on additionne les produits',
        [
          [
            'On additionne les deux probabilités de C sur les branches',
            SANS_PONDERATION,
          ],
        ],
      ),
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-09-A3-02-ARBRE-TOTALES',
      titre: 'Deux chemins mènent à C',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['probabilites-totales'],
      notes: moteur.puces(
        'Faire repasser au doigt les deux chemins qui finissent par C.',
        'Faire dire pourquoi on n’ajoute pas 0,8 et 0,65 : ce sont des parts de deux groupes de tailles différentes.',
      ),
    },
    'arbre',
    {
      title: 'Le paiement par carte, par les deux chemins',
      subtitle: SOURCE_DES_EXEMPLES,
      branches: PAIEMENTS,
      reading:
        'P(C) = 0,28 + 0,4225 : le chemin M puis C, plus le chemin M̄ puis C.',
      description:
        'Le même arbre des paiements : M, 0,35, et M̄, 0,65 ; sous M, C, 0,8 ; sous M̄, C, 0,65. Les deux chemins qui finissent par C portent 0,28 et 0,4225 ; leur somme est la probabilité de payer par carte.',
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-09-A3-03-COURS-TOTALES',
      titre: 'Cours : les probabilités totales',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['probabilites-totales'],
      notes: moteur.puces(
        '2 min après l’arbre des deux chemins ; la trace écrite est imprimée dans le livret : on lit et on commente, on ne recopie pas.',
        'Faire nommer la partition avant d’écrire la formule.',
      ),
    },
    'lesson',
    {
      title: 'Les probabilités totales',
      subtitle: 'Trace écrite · notion 2 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Partition',
          text: 'A et Ā forment une partition de l’univers : tout cas est dans l’un des deux, et dans un seul. Plus largement, des événements forment une partition s’ils ne se chevauchent pas et couvrent tous les cas.',
        },
        {
          kind: 'property',
          title: 'Formule des probabilités totales',
          text: 'P(B) est la somme des chemins qui finissent par B, chacun multiplié le long de ses branches.',
          formula: 'P(B) = P(A) × P_A(B) + P(Ā) × P_Ā(B)',
        },
        {
          kind: 'example',
          title: 'Pour débuter : le paiement par carte',
          text: 'L’arbre des paiements, de partition M, M̄.',
          steps: [
            'Chemin M puis C : 0,35 × 0,8 = 0,28.',
            'Chemin M̄ puis C : 0,65 × 0,65 = 0,4225.',
            'P(C) = 0,28 + 0,4225 = 0,7025.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : les pièges des probabilités totales',
          text: 'Pièges : additionner les probabilités conditionnelles sans les pondérer ; oublier un chemin ; sommer sur des événements qui ne forment pas une partition.',
          steps: [
            'Nommer la partition.',
            'Écrire un produit par chemin qui finit par B.',
            'Additionner, puis vérifier que le résultat est entre 0 et 1.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-09-A3-04-EXEMPLE-TOTALES',
      titre: 'Exemple guidé : la part des paiements par carte',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 5,
      concepts: ['probabilites-totales'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-09-a3-exemple-totales',
          enonce:
            'Avec l’arbre des paiements, calculer P(C), puis la contrôler par P(C̄).',
          etapes: [
            {
              id: 'partition',
              intitule: 'La partition',
              raisonnement:
                'Un client paie sur mobile ou non : M et M̄ forment une partition.',
              invite: 'Nommez la partition.',
            },
            {
              id: 'chemins',
              intitule: 'Les deux chemins vers C',
              raisonnement:
                'M puis C : 0,35 × 0,8 = 0,28. M̄ puis C : 0,65 × 0,65 = 0,4225.',
              invite: 'Calculez chaque chemin.',
            },
            {
              id: 'somme',
              intitule: 'La somme',
              raisonnement:
                'P(C) = 0,28 + 0,4225 = 0,7025. Ajouter 0,8 et 0,65 donnerait 1,45 : plus que 1, donc faux.',
              invite: 'Additionnez les chemins.',
            },
            {
              id: 'controle',
              intitule: 'Le contrôle par le contraire',
              raisonnement:
                'P(C̄) = 0,07 + 0,2275 = 0,2975, et 1 − 0,2975 = 0,7025 : on retrouve P(C).',
              invite: 'Contrôlez par P(C̄).',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur l’étape 3 : une probabilité au-dessus de 1 signale l’oubli de la pondération.',
        'Transition : « À vous, sur les voiles : exercice 3. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-09-A3-05-ATELIER-TOTALES',
      titre: 'Exercice 3 — Les voiles défectueuses',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 6,
      concepts: ['probabilites-totales'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 5),
        'Réflexion : dessiner l’arbre des ateliers, puis repérer les chemins qui finissent par D.',
        'Pièges : additionner 0,04 et 0,09 ; ne garder que le chemin de La Rochelle.',
        'Papier : exercice 3 du livret.',
      ),
      proprietes: {
        intitule: 'Exercice 3 — Les voiles défectueuses',
        consigne:
          '70 % des voiles sont cousues à La Rochelle (R), les autres à Rochefort (F). 4 % des voiles de La Rochelle sont défectueuses (D), contre 9 % de celles de Rochefort.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-09-a3-formule',
            'probabilites-totales',
            true,
            'Quelle écriture donne P(D) ?',
            'P(D) = 0,7 × 0,04 + 0,3 × 0,09',
            [
              ['P(D) = 0,04 + 0,09', SANS_PONDERATION],
              ['P(D) = 0,7 × 0,04', INCOMPLETES],
            ],
          ),
          moteur.numerique(
            'b2-09-a3-defaut',
            'probabilites-totales',
            'Combien vaut P(D) ? Arrondir au millième.',
            null,
            VOILES_DEFECTUEUSES.solution,
            moteur.TROIS_DECIMALES,
            '0,055',
            VOILES_DEFECTUEUSES.pieges,
          ),
          moteur.numerique(
            'b2-09-a3-sans-defaut',
            'probabilite-d-un-evenement',
            'Combien vaut P(D̄), la probabilité qu’une voile soit sans défaut ? Arrondir au millième.',
            null,
            VOILES_SANS_DEFAUT.solution,
            moteur.TROIS_DECIMALES,
            '0,945',
            VOILES_SANS_DEFAUT.pieges,
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Transition : « Une voile revient défectueuse : d’où vient-elle ? Un vote pour le deviner. »',
      ],
    },
    [
      [
        'b2-09-a3-formule',
        'R et F forment une partition : P(D) somme les deux chemins, chacun multiplié. Ajouter 0,04 et 0,09 oublie que les ateliers n’ont pas la même taille ; garder 0,7 × 0,04 oublie Rochefort.',
      ],
      [
        'b2-09-a3-defaut',
        'P(D) = 0,7 × 0,04 + 0,3 × 0,09 = 0,028 + 0,027 = 0,055. Sans pondération, 0,13 ; avec le seul chemin de La Rochelle, 0,028.',
      ],
      [
        'b2-09-a3-sans-defaut',
        'P(D̄) = 1 − P(D) = 0,945. Le complément de 0,13 donne 0,87 : il hérite de l’oubli de la pondération.',
      ],
    ],
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B2-09-A3-06-VOTE-REMONTER',
      titre: 'Vote : sachant quoi ?',
      dureeMinutes: 4,
      concepts: ['probabilite-conditionnelle'],
      notes: moteur.notesDuVoteQuiRelanceLaNotion(2),
    },
    [
      moteur.vote(
        'b2-09-a3-vote-condition',
        'probabilite-conditionnelle',
        false,
        'Une voile revient défectueuse. Pour savoir si elle vient de Rochefort, quelle probabilité cherche-t-on ?',
        'P_D(F) : on sait déjà que la voile est défectueuse',
        [['P_F(D) : on la lit directement sur l’arbre', INVERSEE]],
      ),
      moteur.vote(
        'b2-09-a3-vote-ignoree',
        'probabilite-conditionnelle',
        false,
        'Parmi les voiles défectueuses, la part de Rochefort est-elle la part de Rochefort parmi toutes les voiles ?',
        'Non : parmi les défectueuses, Rochefort pèse davantage',
        [
          [
            'Oui : Rochefort coud toujours la même part des voiles',
            CONDITION_IGNOREE,
          ],
        ],
      ),
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-09-A3-07-ARBRE-REMONTER',
      titre: 'Remonter l’arbre',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['probabilite-conditionnelle', 'probabilites-totales'],
      notes: moteur.puces(
        'Lire l’arbre dans l’autre sens : on sait que le client revient, d’où vient-il ?',
        'Faire dire que P_V(R) ne se lit sur aucune branche : il se calcule.',
      ),
    },
    'arbre',
    {
      title: 'Les clients qui reviennent',
      subtitle: SOURCE_DES_EXEMPLES,
      branches: RETOURS,
      reading:
        'P(V) = 0,325 + 0,07 = 0,395, puis P_V(R) = 0,325 ÷ 0,395 ≈ 0,82 : parmi les clients qui reviennent, environ 82 % sont de la région.',
      description:
        'Arbre pondéré à deux générations. R, le client est de la région : 0,65 ; R̄ : 0,35. Sous R : V, il revient, 0,5, et V̄, 0,5. Sous R̄ : V, 0,2, et V̄, 0,8. Produits : 0,325 ; 0,325 ; 0,07 ; 0,28.',
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-09-A3-08-COURS-REMONTER',
      titre: 'Cours : remonter l’arbre, P_B(A)',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['probabilite-conditionnelle', 'probabilites-totales'],
      notes: moteur.puces(
        '2 min après l’arbre des retours ; la trace écrite est imprimée dans le livret : on lit et on commente, on ne recopie pas.',
        'Faire souligner la condition dans chaque phrase avant de diviser.',
      ),
    },
    'lesson',
    {
      title: 'Remonter l’arbre : P_B(A)',
      subtitle: 'Trace écrite · notion 2 · page 2 sur 2',
      blocks: [
        {
          kind: 'property',
          title: 'Remonter l’arbre',
          text: 'L’arbre donne P_A(B). Pour P_B(A), on divise le chemin A puis B par P(B), obtenue par les probabilités totales.',
          formula: 'P_B(A) = P(A ∩ B) ÷ P(B)',
        },
        {
          kind: 'example',
          title: 'Pour débuter : les clients qui reviennent',
          text: 'R : le client est de la région ; V : il revient.',
          steps: [
            'Chemin R puis V : 0,65 × 0,5 = 0,325.',
            'P(V) = 0,325 + 0,35 × 0,2 = 0,325 + 0,07 = 0,395.',
            'P_V(R) = 0,325 ÷ 0,395 ≈ 0,82.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : les pièges du sens',
          text: 'Pièges : répondre P_A(B), lue sur la branche, quand on demande P_B(A) ; répondre P(A) en oubliant la condition ; diviser par P(A).',
          steps: [
            'Écrire la probabilité cherchée avec sa condition en indice.',
            'Calculer P(B) par les probabilités totales.',
            'Diviser le chemin A puis B par P(B).',
          ],
        },
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-09-A3-09-ATELIER-REMONTER',
      titre: 'Exercice 4 — D’où vient la voile défectueuse ?',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 6,
      concepts: ['probabilite-conditionnelle', 'probabilites-totales'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 5),
        'Réflexion : écrire P_D(F) avec sa condition en indice, puis la formule, avant de calculer.',
        'Pièges : répondre 0,09, lue sur la branche ; répondre 0,3, la part de Rochefort sans condition.',
        'Papier : exercice 4 du livret.',
      ),
      proprietes: {
        intitule: 'Exercice 4 — D’où vient la voile défectueuse ?',
        consigne:
          'Les ateliers de l’exercice 3 : 70 % des voiles cousues à La Rochelle (R), 30 % à Rochefort (F) ; 4 % de défectueuses (D) à La Rochelle, 9 % à Rochefort. Reprendre P(D) calculée à l’exercice 3.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-09-a3-remonter',
            'probabilite-conditionnelle',
            true,
            'Quelle écriture donne la probabilité qu’une voile défectueuse vienne de Rochefort ?',
            'P_D(F) = P(F ∩ D) ÷ P(D)',
            [['P_D(F) = P(F ∩ D) ÷ P(F)', INVERSEE]],
          ),
          moteur.numerique(
            'b2-09-a3-rochefort',
            'probabilite-conditionnelle',
            'Combien vaut P_D(F) ? Arrondir au centième.',
            null,
            DEFECTUEUSE_DE_ROCHEFORT.solution,
            moteur.DEUX_DECIMALES,
            '0,49',
            DEFECTUEUSE_DE_ROCHEFORT.pieges,
          ),
          moteur.numerique(
            'b2-09-a3-la-rochelle',
            'probabilite-conditionnelle',
            'Combien vaut P_D(R) ? Arrondir au centième.',
            null,
            DEFECTUEUSE_DE_LA_ROCHELLE.solution,
            moteur.DEUX_DECIMALES,
            '0,51',
            DEFECTUEUSE_DE_LA_ROCHELLE.pieges,
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Faire remarquer que Rochefort, qui coud 30 % des voiles, fournit près de la moitié des défectueuses.',
        'Transition : jalon 2, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'b2-09-a3-remonter',
        'On sait que la voile est défectueuse : D est la condition, on divise par P(D). Diviser par P(F) redonne P_F(D), la branche de l’arbre.',
      ],
      [
        'b2-09-a3-rochefort',
        'P(F ∩ D) = 0,3 × 0,09 = 0,027, divisé par P(D) de l’exercice 3 : environ 0,49. 0,09 est P_F(D), la branche ; 0,027 est le chemin, pas la part parmi les défectueuses ; 0,3 oublie la condition.',
      ],
      [
        'b2-09-a3-la-rochelle',
        'P(R ∩ D) = 0,7 × 0,04 = 0,028, divisé par P(D) : environ 0,51. Les deux réponses somment à 1 : une voile défectueuse vient de l’un des deux ateliers. 0,04 est la branche ; 0,7 oublie la condition.',
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B2-09-A3-10-JALON',
      titre: 'Jalon 2 : probabilités totales',
      concepts: ['probabilites-totales'],
    },
    {
      id: 'b2-09-a3-jalon',
      invite:
        'Je sais calculer P(B) par les probabilités totales, puis remonter l’arbre pour obtenir P_B(A).',
    },
    'Si plus de 30 % « Perdu » : reprendre l’exemple guidé des paiements par carte après la pause.',
    moteur.PAUSE_HORS_DUREE,
  ),
];

const ACTE_4: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B2-09-A4-01-VOTE-INDEPENDANCE',
      titre: 'Vote : indépendants ou incompatibles ?',
      dureeMinutes: 4,
      concepts: ['independance'],
      notes: moteur.notesDuVoteQuiOuvreLaNotion(3),
    },
    [
      moteur.vote(
        'b2-09-a4-vote-incompatibles',
        'independance',
        false,
        'Une voile ne peut pas être cousue à la fois à La Rochelle et à Rochefort. R et F sont-ils indépendants ?',
        'Non : savoir R rend F impossible',
        [['Oui : ils n’ont rien en commun', INCOMPATIBILITE]],
      ),
      moteur.vote(
        'b2-09-a4-vote-calcul',
        'independance',
        false,
        'Pour affirmer que deux événements sont indépendants, que faut-il ?',
        'Un calcul qui compare deux probabilités',
        [['Une intuition : les deux n’ont pas de lien', SANS_CALCUL]],
      ),
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-09-A4-02-ARBRE-INDEPENDANT',
      titre: 'Un arbre aux branches qui se répètent',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['independance'],
      notes: moteur.puces(
        'Faire remarquer que S porte la même probabilité sous L et sous L̄.',
        'Faire dire ce que cela signifie : savoir L ne change rien à la chance de S.',
      ),
    },
    'arbre',
    {
      title: 'La lettre et le sac',
      subtitle: SOURCE_DES_EXEMPLES,
      branches: LETTRE_ET_SAC,
      reading:
        'P_L(S) = P_L̄(S) = 0,5 : savoir que le client vient de la lettre ne change pas sa chance d’acheter un sac.',
      description:
        'Arbre pondéré à deux générations. L, le client vient de la lettre : 0,35 ; L̄ : 0,65. Sous L comme sous L̄ : S, il achète un sac, 0,5, et S̄, 0,5. Produits : 0,175 ; 0,175 ; 0,325 ; 0,325.',
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-09-A4-03-TABLEAU-INDEPENDANT',
      titre: 'Un tableau aux lignes proportionnelles',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['independance'],
      notes: moteur.puces(
        'Faire calculer la part des sacs sur chaque ligne : la même sur toutes.',
        'C’est le même exemple que l’arbre précédent, en effectifs.',
      ),
    },
    'table',
    {
      title: 'La lettre et le sac, en effectifs',
      subtitle: SOURCE_DES_EXEMPLES,
      columns: [
        { key: 'groupe', label: 'Clients' },
        { key: 'avecSac', label: 'Avec un sac (S)' },
        { key: 'sansSac', label: 'Sans sac (S̄)' },
        { key: 'total', label: 'Total' },
      ],
      rows: [
        {
          groupe: 'Venus de la lettre (L)',
          avecSac: '42',
          sansSac: '42',
          total: '84',
        },
        {
          groupe: 'Venus autrement (L̄)',
          avecSac: '78',
          sansSac: '78',
          total: '156',
        },
        { groupe: 'Total', avecSac: '120', sansSac: '120', total: '240' },
      ],
      note: 'Sur chaque ligne, la moitié des clients achète un sac : la part ne dépend pas de la ligne.',
    },
  ),
  pourComprendre(
    {
      screenId: 'B2-09-A4-04-ENFANT-PIECE',
      titre: 'La pièce et la météo',
      concepts: ['independance'],
    },
    {
      fichier: 'piece-et-meteo.webp',
      imageAlt:
        'Deux scènes côte à côte : une pièce lancée en l’air sous un grand soleil, puis la même pièce lancée sous la pluie. Sous chaque scène, la même petite balance, parfaitement équilibrée entre pile et face.',
      scene:
        'On lance une pièce sous le soleil, puis sous la pluie : elle tombe sur pile aussi souvent par tous les temps.',
      regle:
        'A et B sont indépendants quand P_A(B) = P(B) : savoir A ne change pas la chance de B.',
      correspondances: [
        ['La météo du jour', 'l’événement A'],
        ['La pièce qui tombe sur pile', 'l’événement B'],
        [
          'Pile aussi souvent sous la pluie',
          'P_A(B) = P(B), A et B indépendants',
        ],
      ],
    },
    'Question : « Une pièce peut-elle tomber à la fois sur pile et sur face ? » Non : pile et face sont incompatibles, et pas indépendants.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-09-A4-05-COURS-INDEPENDANCE',
      titre: 'Cours : justifier l’indépendance',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['independance'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire écrire les deux justifications possibles, puis l’erreur à ne pas faire : indépendants n’est pas incompatibles.',
      ),
    },
    'lesson',
    {
      title: 'Justifier l’indépendance',
      subtitle: 'Trace écrite · notion 3',
      blocks: [
        {
          kind: 'definition',
          title: 'Événements indépendants',
          text: 'A et B sont indépendants quand la probabilité de leur intersection est le produit de leurs probabilités. Si P(A) n’est pas nul, cela revient à P_A(B) = P(B) : savoir A ne change pas la chance de B.',
          formula: 'P(A ∩ B) = P(A) × P(B)',
        },
        {
          kind: 'property',
          title: 'Indépendants ou incompatibles',
          text: 'Deux événements incompatibles ne peuvent pas arriver ensemble : P(A ∩ B) = 0. S’ils ont chacun une probabilité non nulle, ils ne sont jamais indépendants : savoir A rend B impossible.',
        },
        {
          kind: 'example',
          title: 'Pour débuter : la lettre et le sac',
          text: 'Le tableau des 240 clients.',
          steps: [
            'P(L) = 84 ÷ 240 = 0,35 et P(S) = 120 ÷ 240 = 0,5.',
            'P(L) × P(S) = 0,35 × 0,5 = 0,175, et P(L ∩ S) = 42 ÷ 240 = 0,175.',
            'Les deux nombres sont égaux : L et S sont indépendants.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : justifier par le calcul',
          text: 'Pièges : conclure sans calcul ; confondre indépendants et incompatibles ; comparer P_A(B) à P(A) au lieu de P(B).',
          steps: [
            'Écrire les deux nombres à comparer.',
            'Les calculer.',
            'Conclure par une phrase : égaux, indépendants ; différents, non indépendants.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-09-A4-06-EXEMPLE-INDEPENDANCE',
      titre: 'Exemple guidé : la lettre et les sacs',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['independance'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-09-a4-exemple-independance',
          enonce:
            'Avec le tableau des 240 clients, justifier que L, « venu de la lettre », et S, « achète un sac », sont indépendants, de deux façons.',
          etapes: [
            {
              id: 'probabilites',
              intitule: 'Les probabilités de L et de S',
              raisonnement: 'P(L) = 84 ÷ 240 = 0,35 ; P(S) = 120 ÷ 240 = 0,5.',
              invite: 'Calculez P(L) et P(S).',
            },
            {
              id: 'produit',
              intitule: 'Le produit et l’intersection',
              raisonnement:
                'P(L) × P(S) = 0,175 ; P(L ∩ S) = 42 ÷ 240 = 0,175. Égaux : L et S sont indépendants.',
              invite: 'Comparez P(L ∩ S) à P(L) × P(S).',
            },
            {
              id: 'conditionnelle',
              intitule: 'Par la probabilité conditionnelle',
              raisonnement:
                'P_L(S) = 42 ÷ 84 = 0,5 = P(S) : savoir L ne change pas la chance de S.',
              invite: 'Comparez P_L(S) à P(S).',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur l’étape 3 : on compare P_L(S) à P(S), pas à P(L).',
        'Transition : « À vous : exercice 5. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-09-A4-07-ATELIER-INDEPENDANCE',
      titre: 'Exercice 5 — Lettre, mobile et sac : indépendants ?',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 6,
      concepts: ['independance', 'probabilite-conditionnelle'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 5),
        'Réflexion : écrire les deux nombres à comparer avant de calculer.',
        'Pièges : conclure sans calcul ; confondre indépendants et incompatibles ; répondre P(M ∩ B), lue dans l’énoncé ; diviser par P(B) au lieu de P(M).',
        'Papier : exercice 5 du livret.',
      ),
      proprietes: {
        intitule: 'Exercice 5 — Lettre, mobile et sac : indépendants ?',
        consigne:
          'Sur la boutique : P(L) = 0,3 pour un client venu de la lettre, P(B) = 0,2 pour un client qui achète un sac, et P(L ∩ B) = 0,06. Par ailleurs, P(M) = 0,45 pour un client sur mobile, et P(M ∩ B) = 0,12.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-09-a4-lettre-sac',
            'independance',
            true,
            'L et B sont-ils indépendants ?',
            'Oui : 0,3 × 0,2 donne 0,06, égal à P(L ∩ B)',
            [
              [
                'Non : un client de la lettre peut aussi acheter un sac',
                INCOMPATIBILITE,
              ],
            ],
          ),
          moteur.numerique(
            'b2-09-a4-mobile',
            'probabilite-conditionnelle',
            'Combien vaut P_M(B) ? Arrondir au centième.',
            null,
            SAC_SUR_MOBILE.solution,
            moteur.DEUX_DECIMALES,
            '0,27',
            SAC_SUR_MOBILE.pieges,
          ),
          moteur.vote(
            'b2-09-a4-mobile-sac',
            'independance',
            true,
            'M et B sont-ils indépendants ?',
            'Non : P_M(B) diffère de P(B)',
            [
              [
                'Oui, sans calcul : l’appareil ne change rien au sac',
                SANS_CALCUL,
              ],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Transition : « Une dernière situation reprend tout le cours : exercice 6. »',
      ],
    },
    [
      [
        'b2-09-a4-lettre-sac',
        'P(L) × P(B) = 0,3 × 0,2 = 0,06 = P(L ∩ B) : L et B sont indépendants. Pouvoir arriver ensemble ne s’oppose pas à l’indépendance : c’est l’incompatibilité qui l’empêche.',
      ],
      [
        'b2-09-a4-mobile',
        'P_M(B) = P(M ∩ B) ÷ P(M) = 0,12 ÷ 0,45 ≈ 0,27. 0,12 est P(M ∩ B), la part des clients à la fois sur mobile et acheteurs d’un sac, pas la part des sacs parmi les clients sur mobile ; 0,12 ÷ 0,2 = 0,6 est P_B(M).',
      ],
      [
        'b2-09-a4-mobile-sac',
        'P_M(B) ≈ 0,27 et P(B) = 0,2 : les sacs se vendent plus souvent sur mobile. M et B ne sont pas indépendants ; seul le calcul le montre.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-09-A4-08-ATELIER-SYNTHESE',
      titre: 'Exercice 6 — Le paiement en trois fois',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 6,
      concepts: [
        'probabilites-totales',
        'probabilite-conditionnelle',
        'independance',
      ],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 5),
        'Réflexion : dessiner l’arbre T, T̄ puis R, R̄ avant de calculer.',
        'Pièges : additionner 0,16 et 0,05 ; répondre 0,16, lue sur la branche ; conclure sans comparer.',
        'Papier : exercice 6 du livret.',
      ),
      proprietes: {
        intitule: 'Exercice 6 — Le paiement en trois fois',
        consigne:
          '30 % des clients paient en trois fois (T). 16 % des paiements en trois fois arrivent en retard (R), contre 5 % des paiements en une fois.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b2-09-a4-retard',
            'probabilites-totales',
            'Combien vaut P(R), la probabilité qu’un paiement arrive en retard ? Arrondir au millième.',
            null,
            PAIEMENTS_EN_RETARD.solution,
            moteur.TROIS_DECIMALES,
            '0,083',
            PAIEMENTS_EN_RETARD.pieges,
          ),
          moteur.numerique(
            'b2-09-a4-trois-fois',
            'probabilite-conditionnelle',
            'Un paiement arrive en retard. Combien vaut P_R(T), la probabilité qu’il soit en trois fois ? Arrondir au centième.',
            null,
            RETARD_EN_TROIS_FOIS.solution,
            moteur.DEUX_DECIMALES,
            '0,58',
            RETARD_EN_TROIS_FOIS.pieges,
          ),
          moteur.vote(
            'b2-09-a4-independance-retard',
            'independance',
            true,
            'T et R sont-ils indépendants ?',
            'Non : P_T(R) diffère de P(R)',
            [
              [
                'Oui : le retard ne dépend pas du mode de paiement',
                SANS_CALCUL,
              ],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Faire remarquer que 30 % des clients fournissent plus de la moitié des retards.',
        'Transition : jalon 3.',
      ],
    },
    [
      [
        'b2-09-a4-retard',
        'P(R) = 0,3 × 0,16 + 0,7 × 0,05 = 0,048 + 0,035 = 0,083. Sans pondération, 0,21 ; avec le seul chemin des paiements en trois fois, 0,048.',
      ],
      [
        'b2-09-a4-trois-fois',
        'P_R(T) = P(T ∩ R) ÷ P(R) = 0,048 ÷ 0,083 ≈ 0,58. 0,16 est P_T(R), la branche ; 0,3 oublie la condition.',
      ],
      [
        'b2-09-a4-independance-retard',
        'P_T(R) = 0,16 et P(R) = 0,083 : le paiement en trois fois multiplie le risque de retard. T et R ne sont pas indépendants.',
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B2-09-A4-09-JALON',
      titre: 'Jalon 3 : l’indépendance',
      concepts: ['independance'],
    },
    {
      id: 'b2-09-a4-jalon',
      invite:
        'Je sais justifier par le calcul que deux événements sont, ou ne sont pas, indépendants.',
    },
    'Si plus de 30 % « Perdu » : reprendre l’exemple guidé de la lettre et des sacs.',
  ),
];

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  [COMPLEMENT]: 'B2-09-A1-03-ENFANT-CONTRAIRE',
  [REUNION]: 'B2-09-A1-06-ENFANT-REUNION',
  [INTERSECTION]: 'B2-09-A2-05-COURS-ARBRE',
  [BRANCHES_ADDITIONNEES]: 'B2-09-A2-05-COURS-ARBRE',
  [CONDITION_IGNOREE]: 'B2-09-A2-09-ENFANT-LOUPE',
  [MAUVAIS_TOTAL]: 'B2-09-A2-10-COURS-TABLEAU',
  [SANS_PONDERATION]: 'B2-09-A3-03-COURS-TOTALES',
  [INCOMPLETES]: 'B2-09-A3-03-COURS-TOTALES',
  [INVERSEE]: 'B2-09-A3-08-COURS-REMONTER',
  [INCOMPATIBILITE]: 'B2-09-A4-05-COURS-INDEPENDANCE',
  [SANS_CALCUL]: 'B2-09-A4-05-COURS-INDEPENDANCE',
};

const ILLUSTRATIONS_DU_B2_09 = [
  ['M1', 'part-du-gateau.webp', 'La part du gâteau'],
  ['M2', 'sac-de-billes.webp', 'Le sac de billes'],
  ['M3', 'deux-cerceaux.webp', 'Les deux cerceaux'],
  ['M4', 'cerceaux-reunis.webp', 'Les cerceaux réunis'],
  ['M5', 'commode-a-tiroirs.webp', 'La commode à tiroirs'],
  ['M6', 'ruisseaux-qui-se-partagent.webp', 'Les ruisseaux qui se partagent'],
  ['M7', 'loupe-sur-une-ligne.webp', 'La loupe sur une ligne'],
  ['M8', 'piece-et-meteo.webp', 'La pièce et la météo'],
] as const;

export const COURS_B2_09 = moteur.coursB2(
  [ACTE_1, ACTE_2, ACTE_3, ACTE_4, ACTE_5],
  REMEDIATIONS,
  moteur.mediasDesIllustrations(
    IMAGES_DU_B2_09,
    ILLUSTRATIONS_DU_B2_09,
    GRAVURE_DE_L_ACCROCHE,
  ),
  {
    slug: 'b2-09-probabilites-conditionnelles',
    titre: 'Probabilités conditionnelles',
    gabarit: 'v3',
    concepts: [...CONCEPTS_DU_COURS],
  },
);
