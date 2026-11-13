import type { ContenuDeCours } from '../../../../domain/cours/stockage/CoursStocke';
import { ACTE_5 } from './b2-07.acte-5';
import {
  ABSCISSE_POUR_EXTREMUM,
  AJOUTER_POUR_MULTIPLIER,
  ATTENDUS_DU_BENEFICE,
  BENEFICE_A_L_ARRIVEE,
  BENEFICE_AU_DEPART,
  BENEFICE_MAXIMAL,
  BENEFICE_SOUS_CONTRAINTE,
  BORNES_OUBLIEES,
  CONCEPTS_DU_COURS,
  CONDITION_INVERSEE,
  CONSTANTE,
  CONTRAINTE_IGNOREE,
  COUT_MINIMAL,
  DERIVEE_DE_G,
  EXPOSANT,
  FORMULE_DE_LA_PENTE,
  FORMULE_DU_BENEFICE,
  INTERVALLE_OPTIMAL,
  K_POUR_TAUX,
  LUE_COMME_PRODUIT,
  PENTE_A_15_EUROS,
  PLAN_DU_BENEFICE,
  PRIX_RETENU,
  RENVOI_AU_DOSSIER,
  SANS_CHANGEMENT_DE_SIGNE,
  SANS_K,
  SENS_INCHANGE,
  SEUIL_MAL_ARRONDI,
  SEUIL_PAR_DIVISION,
  SIGNE_DE_F,
  SIGNE_DE_K,
  VALEUR_POUR_PENTE,
  VITESSE_EN_BOUTIQUE,
  VITESSE_EN_JUIN,
} from './b2-07.donnees';
import * as moteur from '../../briques';

const GRAVURE_DE_L_ACCROCHE = moteur.gravureDuDomainePublic({
  id: 'M15',
  chemin: '/assets/cours/gravures/v1/leibniz-nova-methodus-1684.jpg',
  pageSource:
    'https://commons.wikimedia.org/wiki/File:Leibniz-Acta-1684-NovaMethodus.jpg',
  auteur: 'Gottfried Wilhelm Leibniz, Nova Methodus pro Maximis et Minimis',
  date: '1684',
});

const DOSSIER_DES_ILLUSTRATIONS = '/assets/cours/b2-07/v1';

const pourComprendre = moteur.pourComprendreDans(DOSSIER_DES_ILLUSTRATIONS);

export const VELO_SUR_LA_COLLINE = {
  fichier: 'velo-sur-la-colline.webp',
  imageAlt:
    'Une colline vue de côté et trois fois le même enfant à vélo : il monte en pédalant fort, flèche verte +, roule à plat au sommet, trait bleu 0, puis descend, flèche rouge −. Sous chaque roue, un petit segment suit la pente.',
  scene: 'Le vélo monte la colline, roule à plat tout en haut, puis redescend.',
  correspondances: [
    ['Le segment sous la roue', 'la tangente au point d’abscisse a'],
    ['La montée, flèche verte +', 'f′(a) > 0'],
    ['Le plat du sommet, trait bleu 0', 'f′(a) = 0'],
    ['La descente, flèche rouge −', 'f′(a) < 0'],
  ],
} as const;

const ACTE_1: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-07-A1-01-ACCROCHE',
      titre: 'Dérivée et optimisation : la pente, le sens, le sommet',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['fonction-derivee', 'optimisation'],
      notes: moteur.puces(
        'Annoncer le plan : douze minutes pour comprendre enfin le cours 6 et la boucle, puis trois notions, chacune en trois temps (réfléchir, comprendre, s’exercer), et la fiche mémo.',
        'Annoncer les deux pauses de 15 minutes, après l’acte 2 et après l’acte 3.',
      ),
    },
    'hero',
    {
      title: 'Dérivée et optimisation : la pente, le sens, le sommet',
      subtitle:
        'Atelier Rivage lance le cabas Escale. Quel prix rapporte le plus, et que faire quand l’atelier ne peut pas tout coudre ? La dérivée répond, à condition d’avoir d’abord compris le cours 6.',
      bgImage: GRAVURE_DE_L_ACCROCHE.chemins[0],
      bgImageAlt:
        'Première page de Nova Methodus pro Maximis et Minimis de Gottfried Wilhelm Leibniz, parue dans les Acta Eruditorum en octobre 1684, le premier texte publié sur le calcul des dérivées',
    },
  ),
  pourComprendre(
    {
      screenId: 'B2-07-A1-02-ENFANT-MULTIPLIER',
      titre: 'L’exponentielle multiplie',
      concepts: ['fonction-exponentielle', 'suite-geometrique'],
    },
    {
      fichier: 'plante-qui-multiplie.webp',
      imageAlt:
        'Quatre pots alignés, semaine 0 à semaine 3 : la même plante devient chaque semaine une fois et demie plus haute, si bien que les écarts de hauteur grandissent. Entre deux pots, une flèche marquée × 1,5.',
      scene:
        'Chaque semaine, la plante devient une fois et demie plus haute que la semaine d’avant : plus elle est grande, plus elle gagne de centimètres.',
      regle:
        'uₙ = u₀ × qⁿ au B2-04, f(x) = a e^(kx) au B2-06. À chaque pas, on multiplie par le même nombre ; on n’ajoute pas la même quantité. Pour e^0,4, on calcule l’exposant d’abord, puis la touche eˣ.',
      correspondances: [
        ['La plante du pot « semaine 0 »', 'la valeur de départ u₀, ou a'],
        ['Le numéro de la semaine', 'le rang n, ou x'],
        ['La flèche × 1,5', 'la raison q, ou e^k'],
        ['La hauteur atteinte', 'uₙ, ou f(x)'],
      ],
    },
    'Question : « Ajoute-t-on ou multiplie-t-on ? » On multiplie : c’est pour cela que la courbe se redresse.',
  ),
  pourComprendre(
    {
      screenId: 'B2-07-A1-03-ENFANT-A-ET-K',
      titre: 'Le départ et la vitesse',
      concepts: ['fonction-exponentielle'],
    },
    {
      fichier: 'deux-ballons.webp',
      imageAlt:
        'Deux ballons de même taille au départ, marqués a. À gauche, un enfant gonfle le sien, qui grossit, k > 0. À droite, l’autre ballon se dégonfle, k < 0.',
      scene:
        'Deux ballons partent de la même taille : l’un se gonfle à la pompe, l’autre se dégonfle.',
      regle:
        'f(x) = a e^(kx) et f(0) = a, car e⁰ = 1. Coefficient e^k, taux e^k − 1 : pour 1 000e^(0,02x), + 2,02 % par unité, pas 2 %.',
      correspondances: [
        ['La taille commune au départ, marquée a', 'a = f(0)'],
        ['Le ballon qu’on gonfle, k > 0', 'f croissante'],
        ['Le ballon qui se dégonfle, k < 0', 'f décroissante'],
      ],
    },
    'Question : « Que lit-on en x = 0 ? » La valeur de départ a.',
  ),
  pourComprendre(
    {
      screenId: 'B2-07-A1-04-ENFANT-LN',
      titre: 'ln, le bouton retour',
      concepts: ['logarithme-neperien'],
    },
    {
      fichier: 'bouton-retour.webp',
      imageAlt:
        'Une machine en bois : la carte 1,609 entre, la carte 5 ressort par la flèche eˣ. Dessous, une flèche repart de 5 vers 1,609 en passant par un gros bouton ln, qu’un enfant appuie.',
      scene:
        'La machine transforme 1,609 en 5 ; son bouton retour fait le chemin inverse et rend 1,609.',
      regle:
        'eˣ = y ⇔ x = ln y, pour y > 0. ln défait l’exponentielle comme ÷ défait × : ln 5 ≈ 1,609, touche ln, pas log.',
      correspondances: [
        ['La flèche eˣ de la machine', 'la fonction exponentielle'],
        ['Le bouton ln', 'la fonction logarithme népérien'],
        ['La carte 1,609 qui entre', 'l’exposant x'],
        ['La carte 5 qui ressort', 'y = eˣ'],
      ],
    },
    'Question : « × 4 se défait par ÷ 4. Comment défaire eˣ ? » Par ln.',
  ),
  pourComprendre(
    {
      screenId: 'B2-07-A1-05-ENFANT-SEUIL',
      titre: 'Quand touchera-t-on la fenêtre ?',
      concepts: ['resolution-par-logarithme', 'prevision'],
    },
    {
      fichier: 'plante-et-fenetre.webp',
      imageAlt:
        'Une plante grimpante monte vers le rebord d’une fenêtre, marqué d’un trait rouge 10. Le long de la tige, des traits numérotés de 0 à 6 marquent les semaines ; l’enfant montre le trait 6, la semaine où la tige atteint le rebord.',
      scene:
        'La plante monte vers le rebord de la fenêtre. Plutôt que de mesurer chaque semaine, on calcule d’un coup la semaine où elle l’atteint.',
      regle:
        '1,5ⁿ ≥ 10 ⇔ n ≥ ln 10 ÷ ln 1,5 ≈ 5,68, donc n = 6 : on garde l’entier juste au-dessus. Si q < 1, ln q < 0 et diviser par ln q change le sens de l’inégalité.',
      correspondances: [
        ['Le rebord de la fenêtre, trait 10', 'le seuil'],
        ['La hauteur de la plante', 'qⁿ, ici 1,5ⁿ'],
        [
          'Le trait 6, que montre le doigt',
          'le plus petit entier n tel que qⁿ ≥ seuil',
        ],
      ],
    },
    'Question : « 5,68 semaines : on répond 5 ou 6 ? » 6, l’entier juste au-dessus.',
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B2-07-A1-06-VOTE-EXPONENTIELLE',
      titre: 'Vote : l’exponentielle et ln, deux questions',
      dureeMinutes: 4,
      concepts: ['fonction-exponentielle', 'logarithme-neperien'],
      notes: moteur.puces(
        'Récapitulatif du cours 6 : deux votes non notés.',
        'Revenir sur l’écran d’image de chaque erreur : le départ et la vitesse, puis le bouton retour.',
        ...moteur.NOTES_DU_VOTE_A_DEUX_QUESTIONS,
      ),
    },
    [
      moteur.vote(
        'b2-07-a1-vote-taux',
        'fonction-exponentielle',
        false,
        'Un stock suit le modèle 1 000e^(−0,05x). De quel pourcentage évolue-t-il à chaque unité ?',
        'De e^(−0,05) − 1, soit environ −4,88 %',
        [['De −5 %, la valeur de k', K_POUR_TAUX]],
      ),
      moteur.vote(
        'b2-07-a1-vote-ln',
        'logarithme-neperien',
        false,
        'Quelle est la solution de eˣ = 6 ?',
        'x = ln 6, soit environ 1,79',
        [['x = 6 ÷ e, soit environ 2,21', SEUIL_PAR_DIVISION]],
      ),
    ],
  ),
  pourComprendre(
    {
      screenId: 'B2-07-A1-07-ENFANT-BOUCLE',
      titre: 'La boucle répète',
      concepts: ['algorithme-de-seuil'],
    },
    {
      fichier: 'verre-cuillere.webp',
      imageAlt:
        'Un enfant verse de l’eau dans un grand verre à moitié plein avec une cuillère, et compte sur ses doigts : trois doigts levés. Une flèche circulaire autour de la cuillère, et l’étiquette n = 3.',
      scene:
        'On verse de l’eau dans le verre, encore et encore, en comptant les tours sur ses doigts : trois doigts levés, n = 3.',
      regle:
        'à chaque tour, n ← n + 1 puis u ← u × q. Une boucle refait les mêmes instructions ; le compteur dit combien de fois.',
      correspondances: [
        [
          'La flèche qui tourne autour de la cuillère',
          'la boucle, qui refait les mêmes instructions',
        ],
        ['Les doigts levés, n = 3', 'le compteur n, le rang atteint'],
        ['L’eau dans le verre', 'la valeur u, mise à jour à chaque tour'],
      ],
    },
    'Question : « Que compte n ? » Le nombre de tours, donc le rang atteint.',
  ),
  pourComprendre(
    {
      screenId: 'B2-07-A1-08-ENFANT-TANT-QUE',
      titre: 'Tant que veut dire pas encore',
      concepts: ['algorithme-de-seuil'],
    },
    {
      fichier: 'pas-encore-plein.webp',
      imageAlt:
        'L’enfant devant le grand verre marqué d’un trait rouge plein. Il pense « pas encore… » et continue de verser. À côté, l’eau atteint le trait : il pose la cuillère, « fini ! ».',
      scene:
        'Tant que l’eau n’atteint pas le trait rouge « plein », on verse encore. Dès qu’elle l’atteint, on s’arrête.',
      regle:
        'objectif u ≥ 1 000, boucle « Tant que u < 1 000 » ; pour descendre sous 500, « Tant que u ≥ 500 ». Après « Tant que », on écrit le contraire de l’objectif ; à la fin, Afficher n.',
      correspondances: [
        ['Le trait rouge « plein »', 'le seuil, ici 1 000'],
        [
          'La pensée « pas encore… »',
          'la condition u < 1 000, vraie tant qu’on n’a pas fini',
        ],
        [
          '« Fini ! », la cuillère posée',
          'la sortie de la boucle, puis Afficher n',
        ],
      ],
    },
    'Question : « On veut dépasser 1 000. Que met-on après Tant que ? » u < 1 000, pas encore atteint.',
  ),
  pourComprendre(
    {
      screenId: 'B2-07-A1-09-ENFANT-DEUX-CHEMINS',
      titre: 'Deux chemins, le même rang',
      concepts: ['algorithme-de-seuil', 'resolution-par-logarithme'],
    },
    {
      fichier: 'deux-chemins.webp',
      imageAlt:
        'Une cabane en haut d’une colline. À gauche, des empreintes de pas numérotées de 1 à 6 mènent à la porte. À droite, un enfant fait un grand saut marqué ln et atterrit sur la même marche 6.',
      scene:
        'Deux chemins mènent à la même cabane : l’un à petits pas numérotés, l’autre en un seul grand saut.',
      regle:
        'la boucle sur 1,5ⁿ affiche 6 ; ln 10 ÷ ln 1,5 ≈ 5,68, arrondi au-dessus, donne aussi 6. Les deux méthodes trouvent le même premier rang.',
      correspondances: [
        [
          'Les pas numérotés de 1 à 6',
          'la boucle « Tant que », rang après rang',
        ],
        ['Le grand saut marqué ln', 'le calcul par ln, d’un coup'],
        ['La marche 6', 'le premier rang qui dépasse le seuil'],
      ],
    },
    'Transition : « Le cours 6 est en place. Place à la question du jour : le prix du cabas Escale. »',
  ),
];

const ACTE_2: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: RENVOI_AU_DOSSIER,
      titre: 'Le dossier du cabas Escale',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['fonction-derivee', 'optimisation'],
      notes: moteur.puces(
        '1 min de lecture silencieuse ; ne rien calculer.',
        'Faire dire les questions d’Hélène : quel prix, et que change la capacité de l’atelier ?',
      ),
    },
    'table',
    {
      title: 'Le dossier du cabas Escale',
      subtitle:
        'Ce que sait Hélène Garnier avant de fixer le prix du nouveau cabas.',
      columns: [...moteur.COLONNES_DU_DOSSIER],
      rows: [
        {
          rubrique: 'Le projet',
          contenu:
            'Le cabas Escale : un sac de plage cousu dans de la toile de voile recyclée, vendu en ligne. Hélène Garnier, la dirigeante, doit fixer son prix.',
        },
        {
          rubrique: 'La demande',
          contenu:
            'Pour un prix de x euros, entre 12 € et 28 €, l’étude prévoit 360 − 12x cabas vendus par semaine.',
        },
        {
          rubrique: 'Le coût',
          contenu: 'Chaque cabas coûte 8 € à fabriquer.',
        },
        {
          rubrique: 'La capacité',
          contenu: 'L’atelier coud au plus 120 cabas par semaine.',
        },
        {
          rubrique: 'Les questions d’Hélène',
          contenu:
            'Quel prix rapporte le bénéfice le plus élevé ? Ce prix reste-t-il le bon si l’atelier ne peut pas coudre toute la demande ?',
        },
      ],
      note: moteur.DONNEES_FICTIVES_DU_B2,
    },
  ),
  {
    screenId: 'B2-07-A2-02-MISSION',
    titre: 'Votre mission : le meilleur prix du cabas',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 6,
    concepts: ['fonction-derivee', 'optimisation'],
    notes: moteur.puces(
      'Lecture à voix haute du courriel (1 min), puis 4 min d’écriture individuelle et 1 min de mise en commun au pupitre.',
      'Question 1 : faire dire qu’un prix trop haut fait fuir les clients ; le bénéfice monte puis redescend.',
      'Question 2 : faire émerger l’idée de pente, montée ou descente ; c’est la dérivée.',
      'Question 3 : laisser ouvert ; c’est l’acte 4.',
      'Papier : trois lignes d’écriture dans le livret.',
    ),
    proprietes: {
      metier:
        'Assistant·e de gestion — Atelier Rivage (voilerie artisanale, 14 salariés, La Rochelle)',
      situation:
        'Lundi, 9 h. Hélène Garnier écrit : « Le cabas Escale sera prêt le mois prochain. Je pensais le vendre le plus cher possible, mais Marc dit qu’on perdrait des clients. Pouvez-vous me dire quel prix rapporte le plus, et si nos 120 cabas par semaine changent la réponse ? » Marc Lefèvre, l’expert-comptable, ajoute : « Bénéfice = marge par cabas × nombre de cabas. Regardez si le bénéfice monte ou descend quand le prix bouge. »',
      geste:
        'Sans calculatrice, répondez aux trois questions à partir du dossier.',
      consequence:
        'Un prix trop bas, et l’atelier travaille pour rien ; un prix trop haut, et les cabas restent en stock.',
      questionsLibres: [
        {
          id: 'b2-07-a2-mission:plus-cher',
          question:
            'Le prix le plus élevé rapporte-t-il forcément le bénéfice le plus élevé ? Pourquoi ?',
          placeholder: 'Oui / Non, parce que…',
        },
        {
          id: 'b2-07-a2-mission:sens',
          question:
            'À un prix donné, comment savoir s’il vaut mieux monter ou baisser le prix ?',
          placeholder: 'Il faudrait savoir si le bénéfice…',
        },
        {
          id: 'b2-07-a2-mission:capacite',
          question:
            'Si l’atelier ne peut pas coudre toute la demande, le meilleur prix change-t-il ?',
          placeholder: 'Oui / Non, parce que…',
        },
      ],
    },
  },
  pourComprendre(
    {
      screenId: 'B2-07-A2-03-ENFANT-PENTE',
      titre: 'La pente sous le vélo',
      concepts: ['fonction-derivee'],
    },
    {
      ...VELO_SUR_LA_COLLINE,
      regle:
        'f′(a) est la pente de la courbe de f au point d’abscisse a, celle de sa tangente : elle dit de combien f monte, juste là.',
    },
    'Question : « Que vaut la pente tout en haut ? » 0 : la route est plate.',
  ),
  pourComprendre(
    {
      screenId: 'B2-07-A2-04-ENFANT-RECETTE',
      titre: 'La recette des puissances',
      concepts: ['fonction-derivee'],
    },
    {
      fichier: 'exposant-qui-saute.webp',
      imageAlt:
        'Un grand x debout sur un plongeoir : le petit 2 de son exposant saute et atterrit devant lui, on lit 2x. À côté, un caillou marqué 7 sur un sol plat, avec l’étiquette pente 0.',
      scene:
        'Le petit 2 en haut du x saute du plongeoir et atterrit devant lui : on lit 2x. Le caillou 7, posé sur un sol plat, ne monte jamais.',
      regle:
        '(x²)′ = 2x ; (x³)′ = 3x² ; (x)′ = 1 ; (k)′ = 0 ; (k × u)′ = k × u′ ; (u + v)′ = u′ + v′.',
      correspondances: [
        [
          'Le 2 qui saute devant le x',
          'l’exposant, qui descend en coefficient',
        ],
        [
          'Le x resté seul sur le plongeoir',
          'l’exposant diminué de un : x¹, soit x',
        ],
        ['Le caillou 7 sur le sol plat', 'une constante, de dérivée nulle'],
      ],
    },
    'Question : « Que vaut la dérivée de 7 ? » 0, le caillou ne monte pas.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-07-A2-05-COURS-DERIVEE',
      titre: 'Cours : la dérivée, pente de la courbe',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['fonction-derivee'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Relier au B2-02 : la pente d’une droite est la même partout ; celle d’une courbe change d’un point à l’autre.',
        'Faire dériver à voix haute chaque terme de l’exemple.',
      ),
    },
    'lesson',
    {
      title: 'La dérivée : la pente de la courbe en chaque point',
      subtitle: 'Trace écrite · notion 1 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Nombre dérivé et fonction dérivée',
          text: 'Le nombre dérivé f′(a) est la pente de la courbe de f au point d’abscisse a : le coefficient directeur de sa tangente. La fonction dérivée f′ donne cette pente pour chaque x. Elle dira à Hélène si le bénéfice monte ou descend quand le prix bouge.',
          formula:
            '(k)′ = 0 · (x)′ = 1 · (x²)′ = 2x · (x³)′ = 3x² · (k × u)′ = k × u′ · (u + v)′ = u′ + v′',
        },
        {
          kind: 'example',
          title: 'Pour débuter : f(x) = −2x² + 40x + 5',
          text: 'L’exemple de l’encadré du devoir maison.',
          steps: [
            'Dériver terme à terme : (−2x²)′ = −2 × 2x = −4x ; (40x)′ = 40 ; (5)′ = 0.',
            'f′(x) = −4x + 40.',
            'f′(5) = −4 × 5 + 40 = 20 : en x = 5, la courbe monte.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : dériver sans se tromper',
          text: 'Pièges : dériver 3x² en 3x en oubliant de faire descendre l’exposant ; garder le nombre seul dans la dérivée ; calculer f(a) quand on demande f′(a).',
          steps: [
            'Écrire la dérivée de chaque terme, l’un après l’autre.',
            'Multiplier le coefficient par l’exposant, puis baisser l’exposant de 1.',
            'Effacer les nombres seuls.',
            'Remplacer x par a seulement à la fin, pour obtenir f′(a).',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-07-A2-06-EXEMPLE-DERIVEE',
      titre: 'Exemple guidé : le coût de découpe',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['fonction-derivee'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-07-a2-exemple-derivee',
          enonce:
            'Le coût de découpe de x mètres de toile, en euros, vaut K(x) = x³ − 6x² + 15x + 20.',
          etapes: [
            {
              id: 'termes',
              intitule: 'Terme à terme',
              raisonnement:
                '(x³)′ = 3x² ; (−6x²)′ = −6 × 2x = −12x ; (15x)′ = 15 ; (20)′ = 0.',
              invite: 'Dérivez chaque terme de K(x).',
            },
            {
              id: 'derivee',
              intitule: 'La fonction dérivée',
              raisonnement: 'K′(x) = 3x² − 12x + 15.',
              invite: 'Écrivez K′(x).',
            },
            {
              id: 'nombre-derive',
              intitule: 'Le nombre dérivé en 2',
              raisonnement: 'K′(2) = 3 × 4 − 12 × 2 + 15 = 12 − 24 + 15 = 3.',
              invite: 'Calculez K′(2).',
            },
            {
              id: 'lecture',
              intitule: 'Lire la pente',
              raisonnement:
                'K′(2) = 3 > 0 : en x = 2, la courbe monte ; à cet endroit, un mètre de plus coûte environ 3 € de plus. K(2) = 34 est la valeur, pas la pente.',
              invite:
                'Que dit K′(2) sur la courbe ? Ne pas confondre avec K(2).',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur l’exposant qui descend (étape 1) et sur la différence entre K(2) et K′(2) (étape 4).',
        'Transition : « À vous : exercice 1. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-07-A2-07-ATELIER-DERIVEES',
      titre: 'Exercice 1 — Dériver',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['fonction-derivee'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : pour chaque fonction, écrire la dérivée de chaque terme avant de calculer.',
        'Pièges : 3x² dérivé en 3x ; le nombre seul gardé ; f(a) calculé au lieu de f′(a).',
        'Papier : exercice 1 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        intitule: 'Exercice 1 — Dériver',
        consigne:
          'Bénéfice hebdomadaire du cabas Escale : B(x) = −12x² + 456x − 2 880 euros, pour un prix de x euros.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-07-a2-carre',
            'fonction-derivee',
            true,
            'Quelle est la dérivée de f(x) = 4x² ?',
            'f′(x) = 8x, car 4 × 2x = 8x',
            [['f′(x) = 4x, on enlève le carré', EXPOSANT]],
          ),
          moteur.numerique(
            'b2-07-a2-cube',
            'fonction-derivee',
            'g(x) = 2x³ − 6x² + 5. Combien vaut g′(3) ?',
            null,
            DERIVEE_DE_G.solution,
            moteur.TOLERANCE_NULLE,
            '18',
            DERIVEE_DE_G.pieges,
          ),
          moteur.vote(
            'b2-07-a2-benefice',
            'fonction-derivee',
            true,
            'Quelle est la dérivée du bénéfice B(x) = −12x² + 456x − 2 880 ?',
            'B′(x) = −24x + 456',
            [
              ['B′(x) = −24x + 456 − 2 880', CONSTANTE],
              ['B′(x) = −12x + 456', EXPOSANT],
            ],
          ),
          moteur.numerique(
            'b2-07-a2-pente',
            'fonction-derivee',
            'Combien vaut B′(15), la pente de la courbe du bénéfice au prix de 15 € ?',
            null,
            PENTE_A_15_EUROS.solution,
            moteur.TOLERANCE_NULLE,
            '96',
            PENTE_A_15_EUROS.pieges,
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Transition : « Et la dérivée d’une exponentielle ? Un vote pour la deviner. »',
      ],
    },
    [
      [
        'b2-07-a2-carre',
        'L’exposant 2 descend devant : (4x²)′ = 4 × 2x = 8x. Écrire 4x, c’est enlever le carré sans multiplier.',
      ],
      [
        'b2-07-a2-cube',
        'g′(x) = 6x² − 12x, le 5 disparaît. g′(3) = 54 − 36 = 18. Garder le 5 donne 23 ; oublier de faire descendre les exposants donne 0 ; g(3) = 5 est la valeur, pas la pente.',
      ],
      [
        'b2-07-a2-benefice',
        '(−12x²)′ = −24x, (456x)′ = 456 et (−2 880)′ = 0 : B′(x) = −24x + 456. Le nombre seul ne se garde pas.',
      ],
      [
        'b2-07-a2-pente',
        'B′(15) = −24 × 15 + 456 = 96 : à 15 €, la courbe du bénéfice monte. B(15) = 1 260 € est le bénéfice, pas la pente.',
      ],
    ],
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B2-07-A2-08-VOTE-EXPONENTIELLE',
      titre: 'Vote : à quelle vitesse croît une exponentielle ?',
      dureeMinutes: 4,
      concepts: ['fonction-derivee', 'fonction-exponentielle'],
      notes: moteur.puces(
        'Temps « réfléchir » de la dérivée de l’exponentielle : votes non notés.',
        ...moteur.NOTES_DU_VOTE_A_DEUX_QUESTIONS,
      ),
    },
    [
      moteur.vote(
        'b2-07-a2-vote-vitesse',
        'fonction-exponentielle',
        false,
        'Les ventes en ligne du B2-06 suivent V(x) = 400e^(0,06x). Gagnent-elles plus de sacs par mois en décembre qu’en janvier ?',
        'Oui : plus les ventes sont grandes, plus elles grandissent vite',
        [
          [
            'Non : elles gagnent autant de sacs chaque mois',
            AJOUTER_POUR_MULTIPLIER,
          ],
        ],
      ),
      moteur.vote(
        'b2-07-a2-vote-derivee',
        'fonction-derivee',
        false,
        'Quelle est la dérivée de eˣ ?',
        'eˣ elle-même',
        [['x × e^(x − 1), comme une puissance', SANS_K]],
      ),
    ],
  ),
  pourComprendre(
    {
      screenId: 'B2-07-A2-09-ENFANT-EXPONENTIELLE',
      titre: 'La boule de neige',
      concepts: ['fonction-derivee', 'fonction-exponentielle'],
    },
    {
      fichier: 'boule-de-neige.webp',
      imageAlt:
        'Une pente enneigée : un enfant pousse une boule de neige qui roule en grossissant, petite, moyenne, puis très grosse. Derrière chaque boule, des traits de vitesse de plus en plus longs.',
      scene:
        'La boule de neige roule dans la pente : plus elle est grosse, plus elle ramasse de neige à chaque tour.',
      regle:
        '(e^(kx))′ = k e^(kx), donc (a e^(kx))′ = a k e^(kx) : la vitesse de croissance est k fois la valeur. Comme e^(kx) > 0, le signe de la dérivée est celui de a × k.',
      correspondances: [
        ['La taille de la boule', 'la valeur a e^(kx)'],
        ['La neige ramassée à chaque tour', 'la dérivée a k e^(kx)'],
        [
          'Les traits de vitesse, plus longs derrière la plus grosse',
          'la dérivée, proportionnelle à la valeur',
        ],
      ],
    },
    'Question : « Quel est le signe de la dérivée de 50e^(−0,2x) ? » Négatif : 50 × (−0,2) < 0.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-07-A2-10-COURS-DERIVEE-EXP',
      titre: 'Cours : dériver a e^(kx)',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['fonction-derivee', 'fonction-exponentielle'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Relier au B2-06 : « k > 0 croissante, k < 0 décroissante » se démontre maintenant par le signe de la dérivée.',
      ),
    },
    'lesson',
    {
      title: 'Dériver a e^(kx) : la recette de l’exponentielle',
      subtitle: 'Trace écrite · notion 1 · page 2 sur 2',
      blocks: [
        {
          kind: 'property',
          title: 'La dérivée de e^(kx)',
          text: 'Dériver e^(kx), c’est multiplier par k : l’exponentielle reste la même. Comme e^(kx) est toujours positif, le signe de la dérivée de a e^(kx) est celui de a × k : on retrouve le sens de variation du B2-06.',
          formula:
            '(eˣ)′ = eˣ · (e^(kx))′ = k e^(kx) · (a e^(kx))′ = a k e^(kx)',
        },
        {
          kind: 'example',
          title: 'Pour débuter : f(x) = 1 000e^(0,02x)',
          text: 'a = 1 000 et k = 0,02.',
          steps: [
            'f′(x) = 1 000 × 0,02 × e^(0,02x) = 20e^(0,02x).',
            '20 > 0 et e^(0,02x) > 0 : f′(x) > 0, f est croissante.',
            'Avec un polynôme : (3x + 50e^(−0,1x))′ = 3 − 5e^(−0,1x).',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : les pièges de l’exponentielle',
          text: 'Pièges : oublier de multiplier par k ; dériver e^(kx) comme une puissance de x ; perdre le signe moins de k.',
          steps: [
            'Repérer a et k.',
            'Écrire a × k devant, garder e^(kx).',
            'Conclure sur le signe avec celui de a × k.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-07-A2-11-ATELIER-VENTES',
      titre: 'Exercice 2 — La vitesse des ventes du B2-06',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['fonction-derivee', 'fonction-exponentielle'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : écrire a et k de chaque modèle, puis a × k, avant la calculatrice.',
        'Pièges : la dérivée sans k ; le signe de k perdu ; la valeur prise pour la pente.',
        'Papier : exercice 2 du livret.',
      ),
      proprietes: {
        intitule: 'Exercice 2 — La vitesse des ventes du B2-06',
        consigne:
          'Ventes en ligne du sac Sillage : V(x) = 400e^(0,06x) sacs au mois x. Ventes en boutique d’un ancien sac : W(x) = 900e^(−0,04x) sacs au mois x. Le mois x = 0 est janvier 2026.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-07-a2-derivee-ventes',
            'fonction-derivee',
            true,
            'Quelle est la dérivée V′(x) des ventes en ligne ?',
            'V′(x) = 24e^(0,06x), car 400 × 0,06 = 24',
            [
              ['V′(x) = 400e^(0,06x), elle-même', SANS_K],
              ['V′(x) = 24 × e × 0,06x', LUE_COMME_PRODUIT],
            ],
          ),
          moteur.numerique(
            'b2-07-a2-vitesse-juin',
            'fonction-derivee',
            'Combien vaut V′(5), la vitesse des ventes en juin, en sacs par mois ? Arrondir au centième.',
            'sacs par mois',
            VITESSE_EN_JUIN.solution,
            moteur.DEUX_DECIMALES,
            '32,40 sacs par mois',
            VITESSE_EN_JUIN.pieges,
          ),
          moteur.vote(
            'b2-07-a2-sens-boutique',
            'fonction-derivee',
            true,
            'Comment évoluent les ventes en boutique W(x) = 900e^(−0,04x) ?',
            'Elles baissent : W′(x) = −36e^(−0,04x) est négatif',
            [
              [
                'Elles augmentent : une exponentielle croît toujours',
                SIGNE_DE_K,
              ],
            ],
          ),
          moteur.numerique(
            'b2-07-a2-vitesse-boutique',
            'fonction-derivee',
            'Combien vaut W′(10), en sacs par mois ? Arrondir au centième.',
            'sacs par mois',
            VITESSE_EN_BOUTIQUE.solution,
            moteur.DEUX_DECIMALES,
            '−24,13 sacs par mois',
            VITESSE_EN_BOUTIQUE.pieges,
          ),
        ],
      },
    },
    moteur.CORRECTION_AVANT_LA_PREMIERE_PAUSE,
    [
      [
        'b2-07-a2-derivee-ventes',
        'a = 400 et k = 0,06 : V′(x) = 400 × 0,06 × e^(0,06x) = 24e^(0,06x). L’exponentielle reste, mais on multiplie par k.',
      ],
      [
        'b2-07-a2-vitesse-juin',
        'V′(5) = 24e^0,3 ≈ 32,40 : en juin, les ventes gagnent environ 32 sacs par mois. V(5) ≈ 539,94 est le nombre de sacs, pas la vitesse.',
      ],
      [
        'b2-07-a2-sens-boutique',
        'W′(x) = 900 × (−0,04) × e^(−0,04x) = −36e^(−0,04x) : négatif, car e^(−0,04x) > 0. Les ventes baissent, comme au B2-06 quand k < 0.',
      ],
      [
        'b2-07-a2-vitesse-boutique',
        'W′(10) = −36e^(−0,4) ≈ −24,13 : au mois 10, les ventes perdent environ 24 sacs par mois. Sans le signe de k, on trouverait +24,13 ; W(10) ≈ 603,29 est le nombre de sacs.',
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B2-07-A2-12-JALON',
      titre: 'Jalon 1 : la dérivée',
      concepts: ['fonction-derivee'],
    },
    {
      id: 'b2-07-a2-jalon',
      invite:
        'Je sais dire que f′(a) est une pente et calculer la dérivée d’un polynôme et de a e^(kx).',
    },
    'Si plus de 30 % « Perdu » : reprendre l’écran de la recette des puissances après la pause.',
    moteur.PAUSE_HORS_DUREE,
  ),
];

const ACTE_3: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B2-07-A3-01-VOTE-SIGNE',
      titre: 'Vote : que dit le signe de la pente ?',
      dureeMinutes: 4,
      concepts: ['variations-d-une-fonction', 'fonction-derivee'],
      notes: moteur.notesDuVoteQuiOuvreLaNotion(2),
    },
    [
      moteur.vote(
        'b2-07-a3-vote-monte',
        'variations-d-une-fonction',
        false,
        'Au prix de 15 €, la pente de la courbe du bénéfice est positive. Si Hélène monte un peu le prix, que fait le bénéfice ?',
        'Il augmente, puisque la courbe monte à cet endroit',
        [['On ne peut pas savoir sans calculer B', VALEUR_POUR_PENTE]],
      ),
      moteur.vote(
        'b2-07-a3-vote-descend',
        'variations-d-une-fonction',
        false,
        'Sur un intervalle, B′(x) est négatif. Que peut-on dire de B ?',
        'B décroît sur cet intervalle',
        [['B est négatif : l’atelier perd de l’argent', SIGNE_DE_F]],
      ),
    ],
  ),
  pourComprendre(
    {
      screenId: 'B2-07-A3-02-ENFANT-PANNEAU',
      titre: 'Le panneau de la route',
      concepts: ['variations-d-une-fonction'],
    },
    {
      fichier: 'panneaux-de-la-route.webp',
      imageAlt:
        'Une route de montagne qui monte puis descend. Avant la montée, un panneau vert avec une flèche montante et le signe + ; avant la descente, un panneau rouge avec une flèche descendante et le signe −. Une petite voiture jaune suit la route.',
      scene:
        'Au bord de la route, un panneau annonce une montée ou une descente. Il ne dit pas à quelle altitude roule la voiture.',
      regle:
        'f′ > 0 sur un intervalle ⇒ f croissante sur cet intervalle ; f′ < 0 ⇒ f décroissante. Le signe de f′ donne le sens ; le signe de f n’en dit rien.',
      correspondances: [
        ['Le panneau vert +', 'f′ > 0 : f croissante'],
        ['Le panneau rouge −', 'f′ < 0 : f décroissante'],
        [
          'L’altitude de la voiture',
          'la valeur f(x), que le signe de f′ ne donne pas',
        ],
      ],
    },
    'Question : « Une voiture peut-elle descendre en restant à 1 000 m d’altitude ? » Oui : descendre ne veut pas dire être en bas.',
  ),
  pourComprendre(
    {
      screenId: 'B2-07-A3-03-ENFANT-CARTE',
      titre: 'La carte du trajet',
      concepts: ['variations-d-une-fonction'],
    },
    {
      fichier: 'carte-du-trajet.webp',
      imageAlt:
        'Une carte de balade dessinée par un enfant : le sentier part du départ, monte jusqu’à un sommet marqué d’un drapeau, puis descend vers l’arrivée. Au-dessus, de grandes flèches montante puis descendante ; sous chaque point clé, une étiquette d’altitude à remplir.',
      scene:
        'Avant la balade, on dessine la carte : où le sentier monte, où il descend, et l’altitude des points clés.',
      regle:
        'le tableau de variation résume f en trois lignes : une ligne x, une ligne du signe de f′, une ligne de flèches ↗ ↘ avec les valeurs de f aux bornes et là où le sens change.',
      correspondances: [
        [
          'Les panneaux départ et arrivée',
          'les bornes de l’intervalle, sur la ligne x',
        ],
        [
          'La flèche verte, puis la flèche rouge',
          'la ligne des variations, ↗ puis ↘',
        ],
        ['Le drapeau du sommet', 'la valeur de x où f′ change de signe'],
        [
          'Les étiquettes « Altitude : ___ »',
          'les valeurs de f à écrire au bout des flèches',
        ],
      ],
    },
    'Question : « Quelles altitudes écrit-on sur la carte ? » Celles du départ, du sommet et de l’arrivée.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-07-A3-04-COURS-VARIATIONS',
      titre: 'Cours : signe de la dérivée et tableau de variation',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['variations-d-une-fonction', 'fonction-derivee'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Relier au B2-06 : diviser par un nombre négatif change le sens, comme avec ln q quand q < 1.',
      ),
    },
    'lesson',
    {
      title: 'Le signe de f′ donne le sens de f',
      subtitle: 'Trace écrite · notion 2',
      blocks: [
        {
          kind: 'property',
          title: 'Signe de la dérivée et sens de variation',
          text: 'Si f′(x) > 0 sur un intervalle, f est croissante sur cet intervalle ; si f′(x) < 0, f est décroissante. Le tableau de variation range ces informations : x, signe de f′, flèches et valeurs de f.',
          formula: 'f′ > 0 ⇒ f ↗ · f′ < 0 ⇒ f ↘',
        },
        {
          kind: 'method',
          title: 'Étudier le signe de f′',
          text: 'Dérivée affine mx + p : résoudre mx + p ≥ 0, en changeant le sens si on divise par un nombre négatif. Produit de facteurs : un tableau de signes, une ligne par facteur.',
          steps: [
            'Résoudre f′(x) = 0.',
            'Trouver le signe de f′ de part et d’autre.',
            'Dresser le tableau : flèches, puis valeurs de f aux bornes et aux changements.',
          ],
        },
        {
          kind: 'example',
          title: 'Pour débuter : f′(x) = −4x + 40 sur [0 ; 15]',
          text: 'La dérivée de l’encadré du devoir maison.',
          steps: [
            '−4x + 40 ≥ 0 ⇔ −4x ≥ −40 ⇔ x ≤ 10 : on divise par −4, le sens change.',
            'f′ ≥ 0 sur [0 ; 10], f′ ≤ 0 sur [10 ; 15].',
            'f croît sur [0 ; 10], puis décroît sur [10 ; 15].',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : ne pas confondre les signes',
          text: 'Pièges : lire le sens de f dans le signe de f ; garder le sens de l’inégalité en divisant par un nombre négatif ; oublier les valeurs de f dans le tableau.',
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-07-A3-05-EXEMPLE-VARIATIONS',
      titre: 'Exemple guidé : une dérivée en deux facteurs',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['variations-d-une-fonction', 'fonction-derivee'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-07-a3-exemple-variations',
          enonce:
            'f(x) = 2x³ − 21x² + 60x sur [0 ; 7], comme à l’exercice ★ du devoir maison.',
          etapes: [
            {
              id: 'derivee',
              intitule: 'La dérivée',
              raisonnement:
                'f′(x) = 6x² − 42x + 60. En développant 6(x − 2)(x − 5) = 6(x² − 7x + 10), on retrouve 6x² − 42x + 60.',
              invite:
                'Calculez f′(x), puis vérifiez que f′(x) = 6(x − 2)(x − 5).',
            },
            {
              id: 'signe',
              intitule: 'Le signe du produit',
              raisonnement:
                'x − 2 et x − 5 sont de même signe hors de [2 ; 5] et de signes contraires dedans : f′ est positive sur [0 ; 2], négative sur [2 ; 5], positive sur [5 ; 7].',
              invite: 'Étudiez le signe de f′(x) sur [0 ; 7].',
            },
            {
              id: 'valeurs',
              intitule: 'Les valeurs du tableau',
              raisonnement: 'f(0) = 0 ; f(2) = 52 ; f(5) = 25 ; f(7) = 77.',
              invite: 'Calculez f aux bornes et aux changements de signe.',
            },
            {
              id: 'tableau',
              intitule: 'Le tableau de variation',
              raisonnement:
                'f monte de 0 à 52 sur [0 ; 2], descend jusqu’à 25 sur [2 ; 5], puis remonte jusqu’à 77 sur [5 ; 7].',
              invite: 'Dressez le tableau de variation.',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur le tableau de signes (étape 2) et sur les valeurs écrites sous les flèches (étape 4).',
        'Transition : « À vous, sur le bénéfice du cabas : exercice 3. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-07-A3-06-ATELIER-VARIATIONS',
      titre: 'Exercice 3 — Le signe de B′ et les variations',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['variations-d-une-fonction'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : résoudre B′(x) ≥ 0 sur papier, en surveillant le signe de −24.',
        'Pièges : le sens gardé en divisant par −24 ; le signe de B pris pour son sens ; B′ calculé au lieu de B.',
        'Papier : exercice 3 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        intitule: 'Exercice 3 — Le signe de B′ et les variations',
        consigne:
          'B(x) = −12x² + 456x − 2 880 et B′(x) = −24x + 456, pour un prix x de 12 € à 28 €.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-07-a3-signe',
            'variations-d-une-fonction',
            true,
            'Que donne la résolution de B′(x) ≥ 0, soit −24x + 456 ≥ 0 ?',
            'x ≤ 19, car diviser par −24 change le sens',
            [['x ≥ 19, en gardant le sens', SENS_INCHANGE]],
          ),
          moteur.vote(
            'b2-07-a3-sens',
            'variations-d-une-fonction',
            true,
            'Sur [19 ; 28], B′(x) est négatif. Que fait le bénéfice ?',
            'Il décroît quand le prix monte',
            [['Il est négatif : l’atelier perd de l’argent', SIGNE_DE_F]],
          ),
          moteur.numerique(
            'b2-07-a3-depart',
            'variations-d-une-fonction',
            'Quelle valeur écrire dans le tableau sous x = 12, au début de l’intervalle ?',
            '€',
            BENEFICE_AU_DEPART.solution,
            moteur.TOLERANCE_NULLE,
            '864 €',
            BENEFICE_AU_DEPART.pieges,
          ),
          moteur.numerique(
            'b2-07-a3-arrivee',
            'variations-d-une-fonction',
            'Quelle valeur écrire dans le tableau sous x = 28, à la fin de l’intervalle ?',
            '€',
            BENEFICE_A_L_ARRIVEE.solution,
            moteur.TOLERANCE_NULLE,
            '480 €',
            BENEFICE_A_L_ARRIVEE.pieges,
          ),
        ],
      },
    },
    moteur.CORRECTION_AVANT_LA_SECONDE_PAUSE,
    [
      [
        'b2-07-a3-signe',
        '−24x + 456 ≥ 0 ⇔ −24x ≥ −456 ⇔ x ≤ 19 : diviser par −24, un nombre négatif, change le sens.',
      ],
      [
        'b2-07-a3-sens',
        'B′ < 0 sur [19 ; 28] : B décroît. Le bénéfice reste positif ; c’est sa pente qui est négative.',
      ],
      [
        'b2-07-a3-depart',
        'B(12) = (12 − 8)(360 − 144) = 4 × 216 = 864 €. 168 est B′(12), la pente.',
      ],
      [
        'b2-07-a3-arrivee',
        'B(28) = (28 − 8)(360 − 336) = 20 × 24 = 480 €. −216 est B′(28), la pente.',
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B2-07-A3-07-JALON',
      titre: 'Jalon 2 : signe et variations',
      concepts: ['variations-d-une-fonction'],
    },
    {
      id: 'b2-07-a3-jalon',
      invite:
        'Je sais étudier le signe de f′(x) et dresser le tableau de variation de f.',
    },
    'Si plus de 30 % « Perdu » : reprendre l’exemple f′(x) = −4x + 40 de la trace écrite après la pause.',
    moteur.PAUSE_HORS_DUREE,
  ),
];

const ACTE_4: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-07-A4-01-REFLEXION-CAPACITE',
      titre: 'Réfléchir : le sommet est-il atteignable ?',
      diffusion: 'seance',
      dureeMinutes: 5,
      concepts: ['optimisation'],
      notes: moteur.puces(
        'Temps « réfléchir » de la notion 3 : 3 min d’écriture individuelle, puis lire trois réponses au pupitre.',
        'Ne rien trancher : la trace écrite suivante répond.',
        'Relance : « Si on ne peut pas aller jusqu’au sommet, où est le point le plus haut qu’on peut atteindre ? »',
        'Papier : cadre de réponse du livret.',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b2-07-a4-reflexion-capacite',
        type: 'reflection',
        question:
          'Le bénéfice monte jusqu’au prix de 19 €, puis descend. Mais l’atelier ne coud que 120 cabas par semaine, et à 19 € les clients en demanderaient davantage. Quel prix proposer à Hélène, et pourquoi ?',
        placeholder: 'Je proposerais…, parce que…',
        competency: 'Raisonner · optimiser sous contrainte',
      },
    },
    {
      correction: {
        expected:
          'À 19 €, la demande dépasse ce que l’atelier peut coudre : ce prix n’est pas permis. On cherche les prix pour lesquels la demande tient dans la capacité, puis le meilleur d’entre eux. Comme le bénéfice descend après 19 €, le meilleur prix permis est le plus petit.',
        nextAction:
          'Gardez votre réponse : la trace écrite donne la méthode de l’optimum sous contrainte.',
      },
      renvoi: RENVOI_AU_DOSSIER,
    },
  ),
  pourComprendre(
    {
      screenId: 'B2-07-A4-02-ENFANT-SOMMET',
      titre: 'Le sommet de la colline',
      concepts: ['optimisation'],
    },
    {
      fichier: 'sommet-de-la-colline.webp',
      imageAlt:
        'L’enfant à vélo s’arrête au sommet arrondi d’une colline, un drapeau planté, étiquette sommet. Plus loin, une autre route monte, fait un petit replat, puis continue de monter ; sur le replat, un panneau barré pas un sommet.',
      scene:
        'Le vélo arrive en haut de la colline : il a fini de monter et va redescendre. Plus loin, la route fait un replat, puis remonte.',
      regle:
        'si f′ s’annule en a en passant de + à −, f(a) est un maximum ; de − à + : un minimum ; sans changement de signe, pas d’extremum.',
      correspondances: [
        ['Le drapeau « sommet »', 'un maximum : f′ passe de + à −'],
        [
          'Le replat barré « pas un sommet »',
          'f′ = 0 sans changement de signe : pas d’extremum',
        ],
        ['La hauteur du drapeau', 'la valeur du maximum, f(a)'],
      ],
    },
    'Question : « f′ vaut 0 sur le replat : est-ce un sommet ? » Non, f′ ne change pas de signe.',
  ),
  pourComprendre(
    {
      screenId: 'B2-07-A4-03-ENFANT-BORD',
      titre: 'La barrière sur le chemin',
      concepts: ['optimisation'],
    },
    {
      fichier: 'barriere-sur-le-chemin.webp',
      imageAlt:
        'Une colline avec un drapeau au sommet. Sur le chemin qui monte, une barrière blanche et rouge ferme le passage avant le sommet. L’enfant, arrêté contre la barrière, lève les bras près de l’étiquette ici.',
      scene:
        'Une barrière ferme le chemin avant le sommet : le point le plus haut qu’on peut atteindre est contre la barrière, « ici ».',
      regle:
        'sur un intervalle, on compare les valeurs de f aux bornes et aux extremums. Sous contrainte, l’optimum peut être une borne.',
      correspondances: [
        ['La barrière', 'une borne de l’intervalle, fixée par une contrainte'],
        [
          'Le drapeau hors d’atteinte',
          'l’extremum situé hors de l’intervalle permis',
        ],
        [
          '« Ici », contre la barrière',
          'l’optimum sous contrainte, atteint à la borne',
        ],
      ],
    },
    'Question : « Où est le point le plus haut qu’il peut atteindre ? » Contre la barrière, au bord.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-07-A4-04-COURS-OPTIMUM',
      titre: 'Cours : extremum et optimisation',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['optimisation'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter les quatre étapes de l’encadré du devoir maison.',
      ),
    },
    'lesson',
    {
      title: 'Extremum et optimum : le sommet ou le bord',
      subtitle: 'Trace écrite · notion 3',
      blocks: [
        {
          kind: 'definition',
          title: 'Extremum et changement de signe',
          text: 'Si f′ s’annule en a en passant de + à −, f admet un maximum local en a ; de − à + , un minimum local. Le maximum sur un intervalle est la plus grande des valeurs de f aux bornes et aux maximums locaux.',
          formula:
            'f′ : + puis − en a ⇒ maximum f(a) · f′ : − puis + en a ⇒ minimum f(a)',
        },
        {
          kind: 'method',
          title: 'Les quatre étapes',
          text: 'Sous contrainte, on remplace l’intervalle par celui des valeurs permises, puis on reprend les étapes : l’optimum peut alors être une borne.',
          steps: [
            'Calculer f′(x).',
            'Résoudre f′(x) = 0.',
            'Étudier le signe de f′(x).',
            'Dresser le tableau de variation, comparer les valeurs aux bornes et aux extremums.',
          ],
        },
        {
          kind: 'example',
          title: 'Pour débuter : f(x) = −2x² + 40x + 5 sur [0 ; 15]',
          text: 'f′(x) = −4x + 40 passe de + à − en 10.',
          steps: [
            'Maximum f(10) = −200 + 400 + 5 = 205.',
            'Sous la contrainte x ≥ 12, f décroît : le maximum est f(12) = 197.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : conclure par le x et la valeur',
          text: 'Pièges : annoncer un extremum dès que f′ s’annule ; oublier les bornes ; garder l’optimum hors des valeurs permises ; donner x à la place de f(x). Phrase attendue : « Le bénéfice est maximal pour x = …, il vaut alors … € ».',
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-07-A4-05-EXEMPLE-OPTIMUM',
      titre: 'Exemple guidé : sommet ou bord ?',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['optimisation'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-07-a4-exemple-optimum',
          enonce:
            'On reprend f(x) = 2x³ − 21x² + 60x sur [0 ; 7] et son tableau de variation : f monte de 0 à 52, descend à 25, puis remonte à 77.',
          etapes: [
            {
              id: 'maximum-local',
              intitule: 'Le maximum local',
              raisonnement:
                'f′ passe de + à − en 2 : f(2) = 52 est un maximum local.',
              invite: 'Où f′ passe-t-elle de + à − ? Que vaut f en ce point ?',
            },
            {
              id: 'minimum-local',
              intitule: 'Le minimum local',
              raisonnement:
                'f′ passe de − à + en 5 : f(5) = 25 est un minimum local.',
              invite: 'Où f′ passe-t-elle de − à + ?',
            },
            {
              id: 'maximum-sur-l-intervalle',
              intitule: 'Le maximum sur [0 ; 7]',
              raisonnement:
                'On compare 52 et la valeur à la borne : f(7) = 77 > 52. Le maximum sur [0 ; 7] vaut 77, atteint au bord, où f′ ne s’annule pas.',
              invite: 'Quel est le maximum de f sur [0 ; 7] ?',
            },
            {
              id: 'contrainte',
              intitule: 'Sous la contrainte x ≤ 4',
              raisonnement:
                'Sur [0 ; 4], f monte jusqu’à 52 puis descend jusqu’à f(4) = 32 : le maximum vaut 52, en x = 2.',
              invite: 'Et si x ne peut pas dépasser 4 ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur la borne qui bat le sommet (étape 3).',
        'Transition : « À vous, sur le prix du cabas : exercice 4. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-07-A4-06-ATELIER-PRIX',
      titre: 'Exercice 4 — Le prix optimal du cabas',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['optimisation'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : écrire le tableau de variation de B sur [12 ; 28], puis la contrainte de capacité en inéquation.',
        'Pièges : donner 19 au lieu de B(19) ; garder 19 € sous contrainte ; prendre l’autre borne.',
        'Papier : exercice 4 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        intitule: 'Exercice 4 — Le prix optimal du cabas',
        consigne:
          'B(x) = −12x² + 456x − 2 880 croît sur [12 ; 19] et décroît sur [19 ; 28]. La demande vaut 360 − 12x cabas par semaine ; l’atelier en coud au plus 120.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b2-07-a4-maximum',
            'optimisation',
            'Quel est le bénéfice hebdomadaire maximal, sans tenir compte de la capacité ?',
            '€',
            BENEFICE_MAXIMAL.solution,
            moteur.TOLERANCE_NULLE,
            '1 452 €',
            BENEFICE_MAXIMAL.pieges,
          ),
          moteur.vote(
            'b2-07-a4-capacite',
            'optimisation',
            true,
            'L’atelier coud au plus 120 cabas : 360 − 12x ≤ 120. Quels prix sont permis ?',
            'Les prix x ≥ 20, car diviser par −12 change le sens',
            [['Les prix x ≤ 20, en gardant le sens', SENS_INCHANGE]],
          ),
          moteur.numerique(
            'b2-07-a4-prix',
            'optimisation',
            'Quel prix rend le bénéfice maximal sous cette contrainte ?',
            '€',
            PRIX_RETENU.solution,
            moteur.TOLERANCE_NULLE,
            '20 €',
            PRIX_RETENU.pieges,
          ),
          moteur.numerique(
            'b2-07-a4-benefice',
            'optimisation',
            'Quel est alors le bénéfice hebdomadaire ?',
            '€',
            BENEFICE_SOUS_CONTRAINTE.solution,
            moteur.TOLERANCE_NULLE,
            '1 440 €',
            BENEFICE_SOUS_CONTRAINTE.pieges,
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Transition : « Vérifions au tableur : exercice 5. »',
      ],
    },
    [
      [
        'b2-07-a4-maximum',
        'B′ passe de + à − en 19 : B(19) = (19 − 8)(360 − 228) = 11 × 132 = 1 452 €. 19 est le prix, pas le bénéfice ; 0 est B′(19).',
      ],
      [
        'b2-07-a4-capacite',
        '360 − 12x ≤ 120 ⇔ −12x ≤ −240 ⇔ x ≥ 20 : on divise par −12, le sens change.',
      ],
      [
        'b2-07-a4-prix',
        'Sur [20 ; 28], B décroît : le meilleur prix permis est la borne 20 €. 19 € n’est pas permis ; 28 € est la mauvaise borne.',
      ],
      [
        'b2-07-a4-benefice',
        'B(20) = 12 × 120 = 1 440 € par semaine, pour 120 cabas, la capacité exacte. 1 452 € n’est pas atteignable ; 480 € est B(28).',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-07-A4-07-TABLEUR-BENEFICE',
      titre: 'Exercice 5 — Le bénéfice au tableur',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 6,
      concepts: ['tableur', 'fonction-derivee'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 5),
        'Réflexion : écrire sur papier les formules de B2 et de C2.',
        'Erreurs à chercher : =-12*A2+456 pour B′ ; la constante −2 880 gardée en colonne C ; la formule de B recopiée en C.',
        'Papier : formules écrites sur la copie, puis les valeurs à la calculatrice.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: PLAN_DU_BENEFICE,
        questions: [
          moteur.questionDeFeuille(PLAN_DU_BENEFICE, ATTENDUS_DU_BENEFICE),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter la feuille d’un poste volontaire : B′ passe de 48 à 0 puis à −48, le sommet est sur la ligne de 19 €.',
        'Transition : « Une exponentielle à optimiser : exercice 6. »',
      ],
    },
    [
      [
        'B2 à B9',
        `${FORMULE_DU_BENEFICE}, recopiée : le bénéfice monte jusqu’à la ligne de 19 €, puis redescend ; les valeurs se répondent deux à deux autour du sommet.`,
      ],
      [
        'C2 à C9',
        `${FORMULE_DE_LA_PENTE}, recopiée : B′ est positive avant 19 €, nulle à 19 €, négative après. =-12*A2+456 oublie de faire descendre l’exposant ; garder −2 880 laisse la constante.`,
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-07-A4-08-ATELIER-REVISIONS',
      titre: 'Exercice 6 — Espacer les révisions de la surjeteuse',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['optimisation', 'fonction-derivee'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : écrire C′(x), puis l’équation C′(x) = 0 avant la calculatrice.',
        'Pièges : la dérivée sans k ; le signe de k perdu ; diviser sans ln ; le sens gardé en divisant par −0,1.',
        'Papier : exercice 6 du livret.',
      ),
      proprietes: {
        intitule: 'Exercice 6 — Espacer les révisions de la surjeteuse',
        consigne:
          'Si l’on révise la surjeteuse toutes les x semaines, x de 2 à 30, le coût annuel d’entretien vaut C(x) = 50x + 2 000e^(−0,1x) euros : 50x pour les pannes, qui augmentent quand on attend, 2 000e^(−0,1x) pour les révisions, qui coûtent moins quand on les espace.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-07-a4-derivee-cout',
            'fonction-derivee',
            true,
            'Quelle est la dérivée C′(x) ?',
            'C′(x) = 50 − 200e^(−0,1x)',
            [
              ['C′(x) = 50 + 200e^(−0,1x)', SIGNE_DE_K],
              ['C′(x) = 50 − 2 000e^(−0,1x)', SANS_K],
            ],
          ),
          moteur.vote(
            'b2-07-a4-signe-cout',
            'optimisation',
            true,
            'C′(x) ≥ 0 ⇔ e^(−0,1x) ≤ 0,25 ⇔ −0,1x ≤ ln 0,25. Que donne la dernière étape ?',
            'x ≥ ln 0,25 ÷ (−0,1), car diviser par −0,1 change le sens',
            [['x ≤ ln 0,25 ÷ (−0,1), en gardant le sens', SENS_INCHANGE]],
          ),
          moteur.numerique(
            'b2-07-a4-intervalle',
            'optimisation',
            'Toutes les combien de semaines réviser pour que le coût soit minimal ? Arrondir au centième.',
            'semaines',
            INTERVALLE_OPTIMAL.solution,
            moteur.DEUX_DECIMALES,
            '13,86 semaines',
            INTERVALLE_OPTIMAL.pieges,
          ),
          moteur.numerique(
            'b2-07-a4-cout-minimal',
            'optimisation',
            'Quel est alors le coût annuel minimal ? Arrondir à l’unité.',
            '€',
            COUT_MINIMAL.solution,
            moteur.A_L_UNITE,
            '1 193 €',
            COUT_MINIMAL.pieges,
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Transition : jalon 3.',
      ],
    },
    [
      [
        'b2-07-a4-derivee-cout',
        '(50x)′ = 50 et (2 000e^(−0,1x))′ = 2 000 × (−0,1) × e^(−0,1x) = −200e^(−0,1x). Perdre le signe de k donne +200 ; oublier k laisse 2 000.',
      ],
      [
        'b2-07-a4-signe-cout',
        '−0,1 est négatif : diviser par −0,1 change le sens. C′ est négative avant ce seuil et positive après : le coût descend, puis remonte.',
      ],
      [
        'b2-07-a4-intervalle',
        'x = ln 0,25 ÷ (−0,1) ≈ 13,86 : C′ passe de − à +, c’est un minimum. Diviser 0,25 par 0,1 sans ln donne 2,5 ; perdre le signe de k donne une durée négative.',
      ],
      [
        'b2-07-a4-cout-minimal',
        'C(13,86) ≈ 693 + 500 ≈ 1 193 €, moins que C(2) ≈ 1 737 € et C(30) ≈ 1 600 € aux bornes. 13,86 est la durée, pas le coût ; 0 est la pente au minimum.',
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B2-07-A4-09-JALON',
      titre: 'Jalon 3 : l’optimum',
      concepts: ['optimisation'],
    },
    {
      id: 'b2-07-a4-jalon',
      invite:
        'Je sais trouver un maximum ou un minimum sur un intervalle, et sous une contrainte.',
    },
    'Si plus de 30 % « Perdu » : reprendre l’exemple guidé sommet ou bord.',
  ),
];

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  [LUE_COMME_PRODUIT]: 'B2-07-A1-02-ENFANT-MULTIPLIER',
  [AJOUTER_POUR_MULTIPLIER]: 'B2-07-A1-02-ENFANT-MULTIPLIER',
  [K_POUR_TAUX]: 'B2-07-A1-03-ENFANT-A-ET-K',
  [SEUIL_PAR_DIVISION]: 'B2-07-A1-04-ENFANT-LN',
  [SEUIL_MAL_ARRONDI]: 'B2-07-A1-05-ENFANT-SEUIL',
  [CONDITION_INVERSEE]: 'B2-07-A1-08-ENFANT-TANT-QUE',
  [EXPOSANT]: 'B2-07-A2-05-COURS-DERIVEE',
  [CONSTANTE]: 'B2-07-A2-05-COURS-DERIVEE',
  [VALEUR_POUR_PENTE]: 'B2-07-A2-05-COURS-DERIVEE',
  [SANS_K]: 'B2-07-A2-10-COURS-DERIVEE-EXP',
  [SIGNE_DE_K]: 'B2-07-A2-10-COURS-DERIVEE-EXP',
  [SENS_INCHANGE]: 'B2-07-A3-04-COURS-VARIATIONS',
  [SIGNE_DE_F]: 'B2-07-A3-04-COURS-VARIATIONS',
  [SANS_CHANGEMENT_DE_SIGNE]: 'B2-07-A4-04-COURS-OPTIMUM',
  [ABSCISSE_POUR_EXTREMUM]: 'B2-07-A4-04-COURS-OPTIMUM',
  [BORNES_OUBLIEES]: 'B2-07-A4-04-COURS-OPTIMUM',
  [CONTRAINTE_IGNOREE]: 'B2-07-A4-04-COURS-OPTIMUM',
};

const ILLUSTRATIONS = [
  ['M1', 'plante-qui-multiplie.webp', 'L’exponentielle multiplie'],
  ['M2', 'deux-ballons.webp', 'Le départ et la vitesse'],
  ['M3', 'bouton-retour.webp', 'ln, le bouton retour'],
  ['M4', 'plante-et-fenetre.webp', 'Quand touchera-t-on la fenêtre ?'],
  ['M5', 'verre-cuillere.webp', 'La boucle répète'],
  ['M6', 'pas-encore-plein.webp', 'Tant que veut dire pas encore'],
  ['M7', 'deux-chemins.webp', 'Deux chemins, le même rang'],
  ['M8', 'velo-sur-la-colline.webp', 'La pente sous le vélo'],
  ['M9', 'exposant-qui-saute.webp', 'La recette des puissances'],
  ['M10', 'boule-de-neige.webp', 'La boule de neige'],
  ['M11', 'panneaux-de-la-route.webp', 'Le panneau de la route'],
  ['M12', 'carte-du-trajet.webp', 'La carte du trajet'],
  ['M13', 'sommet-de-la-colline.webp', 'Le sommet de la colline'],
  ['M14', 'barriere-sur-le-chemin.webp', 'La barrière sur le chemin'],
] as const;

export const COURS_B2_07 = moteur.coursB2(
  [ACTE_1, ACTE_2, ACTE_3, ACTE_4, ACTE_5],
  REMEDIATIONS,
  moteur.mediasDesIllustrations(
    DOSSIER_DES_ILLUSTRATIONS,
    ILLUSTRATIONS,
    GRAVURE_DE_L_ACCROCHE,
  ),
  {
    slug: 'b2-07-derivee-optimisation',
    titre: 'Dérivée et optimisation',
    gabarit: 'v3',
    concepts: [...CONCEPTS_DU_COURS],
  },
);
