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
import { type FonctionDerivable, tangenteEn, tracer } from './b2-07.courbes';

const COLLINE: FonctionDerivable = {
  f: (x) => -x * x + 6 * x,
  derivee: (x) => -2 * x + 6,
};

const CAPITAL: FonctionDerivable = {
  f: (x) => 1000 * Math.exp(0.02 * x),
  derivee: (x) => 20 * Math.exp(0.02 * x),
};

const PARABOLE: FonctionDerivable = {
  f: (x) => -2 * x * x + 40 * x + 5,
  derivee: (x) => -4 * x + 40,
};

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
        'Le titre complet de la page affichée : « Nouvelle méthode pour les maximums et les minimums, ainsi que pour les tangentes ». Le tout premier texte publié sur les dérivées, en 1684, annonce déjà le programme du jour.',
        'Newton avait trouvé la même méthode vers 1665, sans la publier. En 1712, la Royal Society, qu’il préside, lui donne la priorité dans un rapport qu’il a rédigé lui-même. On reconnaît aujourd’hui deux découvertes indépendantes.',
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
    'Intérêts simples : on ajoute chaque année le même montant. Intérêts composés : on multiplie. 1 000 € à 5 % pendant 10 ans donnent 1 500 € d’un côté, environ 1 628,89 € de l’autre.',
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
      regle: [
        'f(x) = a e^(kx).',
        'a est la valeur de départ : f(0) = a × e⁰ = a × 1 = a.',
        'k règle le sens : k > 0, f croît ; k < 0, f décroît.',
        'e^k est le coefficient multiplicateur d’une unité à la suivante.',
        'Pour 1 000e^(0,02x) : a = 1 000 et e^0,02 ≈ 1,0202, soit + 2,02 % par unité, pas + 2 %.',
      ].join('\n'),
      correspondances: [
        ['La taille commune au départ, marquée a', 'a = f(0)'],
        ['Le ballon qu’on gonfle, k > 0', 'f croissante'],
        ['Le ballon qui se dégonfle, k < 0', 'f décroissante'],
      ],
    },
    'En 1683, Jacob Bernoulli place 1 € à 100 % et capitalise de plus en plus souvent : 2 € une fois l’an, environ 2,61 € chaque mois, e ≈ 2,72 € à chaque instant. Le nombre e est né d’un problème d’intérêts.',
    '1 000e^(0,02x), c’est 2 % capitalisés en continu, soit 2,02 % par unité : l’écart entre taux nominal et taux effectif.',
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
    'Si la calculatrice affiche 0,699, c’est la touche log, en base 10. ln 5 vaut 1,609.',
    '« Népérien » rend hommage à John Napier (Neper), qui publie en 1614 les premières tables de logarithmes : elles changent les multiplications en additions.',
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
    'Le piège arrive avec un résultat comme 5,2 : l’arrondi habituel donne 5, le seuil demande 6. Pour un seuil, on prend toujours l’entier du dessus.',
    'Doubler un capital placé à 5 % : ln 2 ÷ ln 1,05 ≈ 14,2, donc 15 ans. Les banquiers ont un raccourci, la règle de 72 (72 ÷ 5 = 14,4), déjà chez Luca Pacioli en 1494, dans l’ouvrage qui imprime pour la première fois la comptabilité en partie double.',
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B2-07-A1-06-VOTE-EXPONENTIELLE',
      titre: 'Vote : l’exponentielle et ln, deux questions',
      dureeMinutes: 4,
      concepts: ['fonction-exponentielle', 'logarithme-neperien'],
      notes: '',
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
    '« Algorithme » vient d’al-Khwarizmi, mathématicien de Bagdad au IXe siècle. Le titre de son livre a aussi donné « algèbre », d’« al-jabr ».',
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
      regle: [
        'objectif u ≥ 1 000, boucle « Tant que u < 1 000 » ; pour descendre sous 500, « Tant que u ≥ 500 ».',
        'Après « Tant que », on écrit le contraire de l’objectif ; à la fin, Afficher n.',
        'La plante de la fenêtre : u ← 1 ; n ← 0 ; Tant que u < 10 : n ← n + 1, u ← u × 1,5 ; Afficher n, soit 6.',
        'C’est le rang que donne ln : ln 10 ÷ ln 1,5 ≈ 5,68, arrondi au-dessus.',
      ].join('\n'),
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
    'Avec « Tant que u > 1 000 » et u qui part de 1, la boucle ne tourne jamais et affiche n = 0. Une réponse 0 trahit une condition inversée.',
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
        '360 − 12x se lit en clients : chaque euro de plus sur l’étiquette fait perdre 12 cabas par semaine. À 30 €, plus personne n’achète.',
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
    notes: '',
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
    '« Tangente » vient du latin tangere, toucher : c’est la droite qui touche la courbe.',
    'Le panneau routier « 10 % » est déjà une pente : 10 m de dénivelé pour 100 m d’avancée, soit 0,1. Les jambes du cycliste sentent la pente, pas l’altitude.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-07-A2-04-COURBE-PENTES',
      titre: 'La pente, point par point',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['fonction-derivee'],
      notes: moteur.puces(
        'En x = 1, la courbe est à 5 de haut et sa pente vaut 4. Au sommet, elle est à 9 de haut et sa pente vaut 0. Hauteur et pente sont deux nombres différents.',
      ),
    },
    'courbe',
    {
      title: 'La pente, point par point',
      figure: {
        formula: 'f(x) = −x² + 6x',
        xLabel: 'x',
        yLabel: 'f(x)',
        xRange: [0, 6],
        yRange: [0, 10],
        points: tracer(COLLINE, [0, 6], 0.25),
        description:
          'La courbe de f(x) = −x² + 6x : une colline qui part de 0, monte jusqu’à 9 en x = 3, puis redescend à 0 en x = 6.',
      },
      steps: [
        {
          title: 'Une colline',
          text: 'f(x) = −x² + 6x monte de x = 0 à x = 3, puis redescend jusqu’à x = 6.\nEn chaque point, on pose une règle qui touche la courbe sans la couper : la tangente.\nSa pente dit de combien la courbe monte, juste là.',
        },
        {
          title: 'En x = 1',
          text: 'La tangente monte de 4 quand x avance de 1.\nPente 4 : la courbe monte vite.',
          tangent: tangenteEn(COLLINE, 1, 'pente 4'),
        },
        {
          title: 'En x = 2',
          text: 'Pente 2 : la courbe monte encore, moins vite.',
          tangent: tangenteEn(COLLINE, 2, 'pente 2'),
        },
        {
          title: 'En x = 3',
          text: 'La tangente est à plat : pente 0.\nC’est le sommet : la courbe ne monte plus et ne descend pas encore.',
          tangent: tangenteEn(COLLINE, 3, 'pente 0'),
        },
        {
          title: 'En x = 4',
          text: 'Pente −2 : la courbe descend.',
          tangent: tangenteEn(COLLINE, 4, 'pente −2'),
        },
        {
          title: 'En x = 5',
          text: 'Pente −4 : elle descend de plus en plus vite.',
          tangent: tangenteEn(COLLINE, 5, 'pente −4'),
        },
        {
          title: 'La dérivée',
          text: 'x : 1, 2, 3, 4, 5\npente : 4, 2, 0, −2, −4\nQuand x avance de 1, la pente baisse de 2 : pente = −2x + 6.\nCette formule s’appelle la dérivée de f : f′(x) = −2x + 6.\nElle dit, sans dessiner, si f monte (f′ > 0), s’arrête (f′ = 0) ou descend (f′ < 0).',
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-07-A2-05-COURS-DERIVEE',
      titre: 'Cours : la dérivée, pente de la courbe',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['fonction-derivee'],
      notes: moteur.puces(
        'La notation f′ et le mot « fonction dérivée » viennent de Lagrange, en 1797. Leibniz écrivait dy/dx : une toute petite montée divisée par une toute petite avancée.',
        'Une dérivée a pour unité celle de f par unité de x : B′ se lit en euros de bénéfice par euro de prix, V′ en sacs par mois.',
      ),
    },
    'lesson',
    {
      title: 'La dérivée, pente de la courbe',
      blocks: [
        {
          kind: 'definition',
          title: 'Nombre dérivé et fonction dérivée',
          text: 'Le nombre dérivé f′(a) est la pente de la tangente à la courbe de f au point d’abscisse a.\nLa fonction dérivée f′ donne cette pente pour chaque x.\nElle sert à savoir où f monte et où elle descend : elle dira à Hélène si le bénéfice monte ou descend quand le prix bouge.',
          formula: [
            '(k)′ = 0',
            '(x)′ = 1',
            '(x²)′ = 2x',
            '(x³)′ = 3x²',
            '(k × u)′ = k × u′',
            '(u + v)′ = u′ + v′',
          ].join('\n'),
        },
        {
          kind: 'example',
          title: 'Pour débuter : f(x) = −2x² + 40x + 5',
          text: 'Une fonction de degré 2, dérivée terme à terme.',
          steps: [
            'Dériver terme à terme : (−2x²)′ = −2 × 2x = −4x ; (40x)′ = 40 ; (5)′ = 0.',
            'f′(x) = −4x + 40.',
            'f′(5) = −4 × 5 + 40 = 20 : en x = 5, la courbe monte.',
          ],
        },
        {
          kind: 'piege',
          title: 'Dériver sans se tromper',
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
      notes: moteur.puces(
        'En gestion, K′ s’appelle le coût marginal : ce que coûte le mètre de plus. K′(2) = 3 l’annonce, et le vrai écart K(3) − K(2) = 38 − 34 = 4 € en est proche.',
      ),
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
    moteur.CORRECTION_DE_DEUX_MINUTES,
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
        'La calculatrice dérive en un point (TI : math, puis nDeriv( ; Casio : OPTN, CALC, d/dx). Elle confirme g′(3) = 18, mais ne donne jamais la formule de g′.',
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
    moteur.CORRECTION_DE_DEUX_MINUTES,
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
        'Avec 2ˣ, la dérivée vaut environ 0,69 fois la valeur ; avec 3ˣ, environ 1,10 fois. Entre les deux, un seul nombre donne exactement 1 fois : e ≈ 2,718. C’est pour cela qu’on l’a choisi.',
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
    'Une exponentielle grandit d’autant plus vite qu’elle est grosse : c’est l’« effet boule de neige » d’une dette dont on ne paie pas les intérêts.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-07-A2-10-COURS-DERIVEE-EXP',
      titre: 'Cours : dériver a e^(kx)',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['fonction-derivee', 'fonction-exponentielle'],
      notes: '',
    },
    'lesson',
    {
      title: 'Dériver a e^(kx)',
      figure: {
        formula: 'f(x) = 1 000e^(0,02x)',
        xLabel: 'x',
        yLabel: 'f(x)',
        xRange: [0, 50],
        yRange: [0, 3000],
        points: tracer(CAPITAL, [0, 50], 5),
        tangents: [tangenteEn(CAPITAL, 0, 'pente 20 en x = 0')],
        description:
          'La courbe de f(x) = 1 000e^(0,02x) part de 1 000 en x = 0 et monte de plus en plus vite ; sa tangente en x = 0 a pour pente 20.',
      },
      blocks: [
        {
          kind: 'property',
          title: 'La dérivée de e^(kx)',
          text: 'Dériver e^(kx), c’est multiplier par k : l’exponentielle reste la même.\nComme e^(kx) est toujours positif, le signe de la dérivée de a e^(kx) est celui de a × k : on retrouve le sens de variation du B2-06.',
          formula: [
            '(eˣ)′ = eˣ',
            '(e^(kx))′ = k e^(kx)',
            '(a e^(kx))′ = a k e^(kx)',
          ].join('\n'),
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
          kind: 'piege',
          title: 'Les pièges de l’exponentielle',
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
        'V′(5) ≈ 32,40, c’est 6 % de V(5) ≈ 539,94 : la vitesse reste toujours égale à 6 % des ventes du moment.',
        'Le revers : V double en ln 2 ÷ 0,06 ≈ 11,6 mois, un peu moins d’un an.',
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
    moteur.CORRECTION_DE_DEUX_MINUTES,
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
];

const ACTE_3: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B2-07-A3-01-VOTE-SIGNE',
      titre: 'Vote : que dit le signe de la pente ?',
      dureeMinutes: 4,
      concepts: ['variations-d-une-fonction', 'fonction-derivee'],
      notes: moteur.puces(
        'Passer le prix de 15 € à 16 € fait monter le bénéfice de 1 260 € à 1 344 €, soit + 84 €. La pente B′(15) = 96 annonçait la bonne direction, pas le montant exact.',
      ),
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
    'Un chiffre d’affaires en baisse peut rester le plus gros du secteur : la tendance n’est pas le niveau.',
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
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-07-A3-04-COURS-VARIATIONS',
      titre: 'Cours : signe de la dérivée et tableau de variation',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['variations-d-une-fonction', 'fonction-derivee'],
      notes: moteur.puces(
        'Contrôle immédiat du sens : x = 0 dans −4x + 40 ≥ 0 donne 40 ≥ 0, vrai. La solution doit donc contenir 0 : x ≤ 10 le contient, x ≥ 10 non.',
        'Diviser par un négatif renverse l’ordre : 2 < 3, mais −2 > −3.',
      ),
    },
    'lesson',
    {
      title: 'Le signe de f′ donne le sens de f',
      blocks: [
        {
          kind: 'property',
          title: 'Signe de la dérivée et sens de variation',
          text: 'Si f′(x) > 0 sur un intervalle, f est croissante sur cet intervalle ; si f′(x) < 0, f est décroissante. Le tableau de variation range ces informations : x, signe de f′, flèches et valeurs de f.',
          formula: ['f′ > 0 ⇒ f ↗', 'f′ < 0 ⇒ f ↘'].join('\n'),
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
          text: 'Le signe d’une dérivée affine donne le sens de variation de f.',
          steps: [
            '−4x + 40 ≥ 0 ⇔ −4x ≥ −40 ⇔ x ≤ 10 : on divise par −4, le sens change.',
            'f′ ≥ 0 sur [0 ; 10], f′ ≤ 0 sur [10 ; 15].',
            'f croît sur [0 ; 10], puis décroît sur [10 ; 15].',
          ],
        },
        {
          kind: 'piege',
          title: 'Ne pas confondre les signes',
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
      notes: moteur.puces(
        'Pour vérifier le signe, on teste une valeur par zone : f′(0) = 60 > 0, f′(3) = −12 < 0, f′(6) = 24 > 0. C’est bien + puis − puis +.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-07-a3-exemple-variations',
          enonce: 'f(x) = 2x³ − 21x² + 60x sur [0 ; 7].',
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
    moteur.CORRECTION_DE_DEUX_MINUTES,
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-07-A3-06-ATELIER-VARIATIONS',
      titre: 'Exercice 3 — Le signe de B′ et les variations',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['variations-d-une-fonction'],
      notes: '',
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
    moteur.CORRECTION_DE_DEUX_MINUTES,
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
        'À 19 €, 132 clients voudraient un cabas et l’atelier n’en coud que 120. Douze repartent déçus, et les 120 autres auraient accepté de payer un peu plus.',
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
    'Dès les années 1630, Fermat trouve les maximums en cherchant où une petite variation de x ne change presque plus la valeur. C’est l’idée de f′ = 0, une génération avant Newton et Leibniz.',
    'Le contre-exemple à retenir : x³ a une dérivée nulle en 0 (3 × 0² = 0), et pourtant elle monte toujours.',
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
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-07-A4-04-COURS-OPTIMUM',
      titre: 'Cours : extremum et optimisation',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['optimisation'],
      notes: '',
    },
    'lesson',
    {
      title: 'Le sommet ou le bord',
      figure: {
        formula: 'f(x) = −2x² + 40x + 5',
        xLabel: 'x',
        yLabel: 'f(x)',
        xRange: [0, 15],
        yRange: [0, 220],
        points: tracer(PARABOLE, [0, 15], 0.5),
        tangents: [tangenteEn(PARABOLE, 10, 'sommet : f(10) = 205')],
        zone: { from: 12, to: 15, label: 'contrainte x ≥ 12' },
        description:
          'La parabole de f(x) = −2x² + 40x + 5 sur [0 ; 15] : son sommet, tangente à plat, est en x = 10 ; la zone permise x ≥ 12 commence après le sommet, où f descend.',
      },
      blocks: [
        {
          kind: 'definition',
          title: 'Extremum et changement de signe',
          text: 'Si f′ s’annule en a en passant de + à −, f admet un maximum local en a ; de − à +, un minimum local.\nLe maximum sur un intervalle est la plus grande des valeurs de f aux bornes et aux maximums locaux.',
          formula: [
            'f′ : + puis − en a ⇒ maximum f(a)',
            'f′ : − puis + en a ⇒ minimum f(a)',
          ].join('\n'),
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
          kind: 'piege',
          title: 'Conclure par le x et la valeur',
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
      notes: moteur.puces(
        'Un maximum local, c’est la meilleure boutique du quartier, pas forcément de la ville : on regarde toujours les bornes.',
      ),
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
    moteur.CORRECTION_DE_DEUX_MINUTES,
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
        'Contrôle sans dérivée : B s’annule à 8 €, où la marge est nulle, et à 30 €, où il n’y a plus de clients. Le sommet est au milieu : (8 + 30) ÷ 2 = 19.',
        'Le chiffre d’affaires x(360 − 12x) culmine à 15 € (2 700 €), le bénéfice à 19 €. Viser les ventes ou viser le bénéfice ne donne pas le même prix.',
        'La capacité coûte 1 452 − 1 440 = 12 € par semaine, environ 624 € par an : le chiffre à comparer au coût d’une couturière de plus.',
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
    moteur.CORRECTION_DE_DEUX_MINUTES,
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
        'Piège d’Excel au bureau : =-2^2 donne 4, parce que le moins s’applique avant le carré. =-A2^2 rend donc +A2² ; on écrit -12*A2^2 ou -(A2^2).',
      ),
      proprietes: {
        modalite: 'solo',
        plan: PLAN_DU_BENEFICE,
        questions: [
          moteur.questionDeFeuille(PLAN_DU_BENEFICE, ATTENDUS_DU_BENEFICE),
        ],
      },
    },
    moteur.CORRECTION_DE_DEUX_MINUTES,
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
        'C’est le schéma de la formule de Wilson en gestion des stocks (Harris, 1913) : un coût qui monte, un coût qui baisse, et l’optimum là où leurs pentes se compensent.',
        'En pratique, on révise toutes les 14 semaines : C(14) ≈ 1 193,19 €, à peine 5 centimes de plus que le minimum. Près d’un optimum la courbe est plate, et arrondir ne coûte presque rien.',
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
    moteur.CORRECTION_DE_DEUX_MINUTES,
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
  ['M8', 'velo-sur-la-colline.webp', 'La pente sous le vélo'],
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
