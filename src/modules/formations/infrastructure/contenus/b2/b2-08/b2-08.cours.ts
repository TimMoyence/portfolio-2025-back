import type { ContenuDeCours } from '../../../../domain/cours/stockage/CoursStocke';
import { ACTE_5 } from './b2-08.acte-5';
import {
  ABSCISSE_POUR_EXTREMUM,
  ATTENDUS_DU_BALAYAGE,
  CALCUL_FORMEL_EN_2,
  CONCEPTS_DU_COURS,
  COUT_MARGINAL_EN_3,
  COUT_MOYEN_MINIMAL,
  FORMULE_DU_BALAYAGE,
  LOGARITHME_EN_3,
  MAL_ENCADRE,
  MAUVAISE_MOITIE,
  MILIEU_DE_LA_DICHOTOMIE,
  MOYEN_POUR_MARGINAL,
  PLAN_DU_BALAYAGE,
  PRIX_D_EQUILIBRE,
  PRODUIT_EN_2,
  PRODUIT_TERME_A_TERME,
  QUOTIENT_EN_1,
  QUOTIENT_INVERSE,
  QUOTIENT_SANS_CARRE,
  RECETTE_MAXIMALE,
  RECETTE_SANS_PRIX,
  RENVOI_AU_DOSSIER,
  SANS_CHANGEMENT_DE_SIGNE,
  SANS_K,
  SANS_U_PRIME,
  SANS_VARIATIONS,
  SEUIL_PAR_DIVISION,
  SIGNE_DE_K,
  VALEUR_APPROCHEE,
  VALEUR_POUR_PENTE,
} from './b2-08.donnees';
import * as moteur from '../../briques';
import { VELO_SUR_LA_COLLINE } from '../b2-07/b2-07.cours';

const GRAVURE_DE_L_ACCROCHE = moteur.gravureDuDomainePublic({
  id: 'M9',
  chemin: '/assets/cours/gravures/v1/cournot-richesses-1838.jpg',
  pageSource:
    'https://commons.wikimedia.org/wiki/File:Recherches_sur_les_principes_math%C3%A9matiques_de_la_th%C3%A9orie_des_richesses,_1838.jpg',
  auteur:
    'Antoine-Augustin Cournot, Recherches sur les principes mathématiques de la théorie des richesses',
  date: '1838',
});

const IMAGES_DU_B2_07 = '/assets/cours/b2-07/v1';
const IMAGES_DU_B2_08 = '/assets/cours/b2-08/v1';

const commeAuB207 = moteur.pourComprendreDans(IMAGES_DU_B2_07);
const pourComprendre = moteur.pourComprendreDans(IMAGES_DU_B2_08);

const COUT_D_EXEMPLE = 'x^3/12-1.5*x^2+20*x+72';
const COUT_MARGINAL_D_EXEMPLE = 'x^2/4-3*x+20';

const ACTE_1: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-08-A1-01-ACCROCHE',
      titre:
        'Dérivées composées et fonctions économiques : coûts, marché, solutions',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['derivees-composees', 'fonctions-economiques'],
      notes: moteur.puces(
        'Annoncer le plan : douze minutes pour reprendre la dérivée du cours 7 en images, puis trois notions, chacune en trois temps (réfléchir, comprendre, s’exercer), et la fiche mémo.',
        'Annoncer les deux pauses de 15 minutes, après l’acte 2 et après l’acte 3.',
      ),
    },
    'hero',
    {
      title:
        'Dérivées composées et fonctions économiques : coûts, marché, solutions',
      subtitle:
        'Combien coûte une voile de plus ? À quel prix l’offre rencontre-t-elle la demande ? Quand la lettre de l’atelier atteindra-t-elle son objectif d’abonnés ? La dérivée répond, une fois qu’on sait dériver un produit, un quotient, e^u et ln u.',
      bgImage: GRAVURE_DE_L_ACCROCHE.chemins[0],
      bgImageAlt:
        'Page de titre des Recherches sur les principes mathématiques de la théorie des richesses d’Antoine-Augustin Cournot, publiées à Paris en 1838, le premier livre à écrire la demande comme une fonction du prix',
    },
  ),
  commeAuB207(
    {
      screenId: 'B2-08-A1-02-ENFANT-PENTE',
      titre: 'La pente sous le vélo',
      concepts: ['fonction-derivee'],
    },
    {
      ...VELO_SUR_LA_COLLINE,
      regle:
        'f′(a) est la pente de la courbe de f au point d’abscisse a, celle de sa tangente. f(a) dit où l’on est ; f′(a) dit de combien on monte, juste là.',
    },
    'Question : « L’altitude du vélo, est-ce f(a) ou f′(a) ? » f(a) ; la pente sous la roue, c’est f′(a).',
  ),
  commeAuB207(
    {
      screenId: 'B2-08-A1-03-ENFANT-RECETTE',
      titre: 'La recette des puissances',
      concepts: ['fonction-derivee'],
    },
    {
      fichier: 'exposant-qui-saute.webp',
      imageAlt:
        'Un grand x debout sur un plongeoir : le petit 2 de son exposant saute et atterrit devant lui, on lit 2x. À côté, un caillou marqué 7 sur un sol plat, avec l’étiquette pente 0.',
      scene:
        'Le petit 2 en haut du x saute du plongeoir et atterrit devant lui. Le caillou 7, posé sur un sol plat, ne monte jamais.',
      regle:
        '(xⁿ)′ = n xⁿ⁻¹ ; (k)′ = 0 ; (k × u)′ = k × u′ ; (u + v)′ = u′ + v′. Ce sont les briques de toutes les dérivées de ce cours.',
      correspondances: [
        [
          'Le 2 qui saute devant le x',
          'l’exposant, qui descend en coefficient',
        ],
        ['Le x resté seul sur le plongeoir', 'l’exposant diminué de un'],
        ['Le caillou 7 sur le sol plat', 'une constante, de dérivée nulle'],
      ],
    },
    'Question : « Que vaut la dérivée de x³ ? » 3x² : le 3 saute devant, l’exposant perd un.',
  ),
  commeAuB207(
    {
      screenId: 'B2-08-A1-04-ENFANT-BOULE',
      titre: 'La boule de neige',
      concepts: ['fonction-derivee', 'fonction-exponentielle'],
    },
    {
      fichier: 'boule-de-neige.webp',
      imageAlt:
        'Une pente enneigée : on pousse une boule de neige qui roule en grossissant, petite, moyenne, puis très grosse. Derrière chaque boule, des traits de vitesse de plus en plus longs.',
      scene:
        'La boule de neige roule dans la pente : plus elle est grosse, plus elle ramasse de neige à chaque tour.',
      regle:
        '(a e^(kx))′ = a k e^(kx) : on multiplie par k, l’exposant reste. Comme e^(kx) > 0, le signe de la dérivée est celui de a × k.',
      correspondances: [
        ['La taille de la boule', 'la valeur a e^(kx)'],
        ['La neige ramassée à chaque tour', 'la dérivée a k e^(kx)'],
        [
          'Les traits de vitesse, plus longs derrière la plus grosse',
          'la dérivée, proportionnelle à la valeur',
        ],
      ],
    },
    'Question : « Quel est le signe de la dérivée de 40e^(−0,5x) ? » Négatif : 40 × (−0,5) < 0.',
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B2-08-A1-05-VOTE-DERIVEE',
      titre: 'Vote : la dérivée du cours 7, deux questions',
      dureeMinutes: 6,
      concepts: ['fonction-derivee', 'optimisation'],
      notes: moteur.puces(
        'Récapitulatif du cours 7 : deux votes non notés, une question après l’autre, sans débat entre elles.',
        'Avant la révélation, faire dériver 5x³ − 2x + 7 au tableau à main levée : 15x² − 2, le 3 saute devant.',
        'La révélation s’ouvre après la question 2 : revenir sur l’écran d’image de chaque erreur, la boule de neige, puis le sommet.',
        'Papier : vote à main levée sur chaque question.',
      ),
    },
    [
      moteur.vote(
        'b2-08-a1-vote-exponentielle',
        'fonction-derivee',
        false,
        'Quelle est la dérivée de 300e^(−0,5x) ?',
        '−150e^(−0,5x)',
        [['300e^(−0,5x), l’exponentielle reste la même', SANS_K]],
      ),
      moteur.vote(
        'b2-08-a1-vote-extremum',
        'optimisation',
        false,
        'f′(4) = 0. La fonction f a-t-elle forcément un maximum ou un minimum en 4 ?',
        'Non : il faut que f′ change de signe en 4',
        [['Oui, dès que f′ s’annule', SANS_CHANGEMENT_DE_SIGNE]],
      ),
    ],
  ),
  commeAuB207(
    {
      screenId: 'B2-08-A1-06-ENFANT-PANNEAU',
      titre: 'Le panneau de la route',
      concepts: ['variations-d-une-fonction'],
    },
    {
      fichier: 'panneaux-de-la-route.webp',
      imageAlt:
        'Une route de montagne et une voiture. Au bord de la route, un panneau vert marqué + annonce la montée, un panneau rouge marqué − annonce la descente. Un petit repère d’altitude suit la voiture.',
      scene:
        'Au bord de la route de montagne, un panneau vert annonce la montée, un panneau rouge la descente.',
      regle:
        'f′ > 0 sur un intervalle : f y est croissante ; f′ < 0 : f y est décroissante. C’est le signe de f′ qu’on lit, pas celui de f.',
      correspondances: [
        ['Le panneau vert +', 'f′ > 0, f croissante'],
        ['Le panneau rouge −', 'f′ < 0, f décroissante'],
        ['L’altitude de la voiture', 'f(x), que le signe de f′ ne donne pas'],
      ],
    },
    'Question : « Une fonction positive peut-elle décroître ? » Oui : c’est le signe de f′ qui compte.',
  ),
  commeAuB207(
    {
      screenId: 'B2-08-A1-07-ENFANT-SOMMET',
      titre: 'Le sommet de la colline',
      concepts: ['optimisation'],
    },
    {
      fichier: 'sommet-de-la-colline.webp',
      imageAlt:
        'Le cycliste au sommet de la colline, entre la montée et la descente, à côté d’un drapeau marqué sommet. Plus loin, un replat barré où la route continue de monter.',
      scene:
        'Le vélo s’arrête au sommet, entre la montée et la descente. Plus loin, sur un replat, la route reprend sa montée.',
      regle:
        'f′ s’annule en a en passant de + à − : f(a) est un maximum ; de − à + : un minimum. Le x du sommet n’est pas sa hauteur f(a).',
      correspondances: [
        ['Le drapeau « sommet »', 'un maximum, f′ passe de + à −'],
        ['Le replat barré', 'f′ = 0 sans changement de signe : pas d’extremum'],
        ['La hauteur du drapeau', 'la valeur du maximum, f(a)'],
      ],
    },
    'Transition : « La dérivée du cours 7 est en place. Place au dossier du jour. »',
  ),
];

const ACTE_2: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: RENVOI_AU_DOSSIER,
      titre: 'Le dossier de la voile Brise',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['fonctions-economiques', 'resolution-approchee'],
      notes: moteur.puces(
        '1 min de lecture silencieuse ; ne rien calculer.',
        'Faire dire les trois questions d’Hélène : combien produire, à quel prix vendre, quand atteindre l’objectif d’abonnés.',
      ),
    },
    'table',
    {
      title: 'Le dossier de la voile Brise',
      subtitle:
        'Ce que sait Hélène Garnier avant de lancer trois chantiers de l’atelier.',
      columns: [...moteur.COLONNES_DU_DOSSIER],
      rows: [
        {
          rubrique: 'La voile Brise',
          contenu:
            'Une voile d’initiation pour les écoles de voile, cousue par dizaines. Le coût total dépend du nombre de dizaines produites dans le mois.',
        },
        {
          rubrique: 'Le sac Bordée',
          contenu:
            'Un sac en toile de voile recyclée, vendu en ligne. Plus le prix monte, moins on en demande ; plus il monte, plus l’atelier accepte d’en coudre.',
        },
        {
          rubrique: 'La lettre de l’atelier',
          contenu:
            'Une lettre d’information mensuelle. Les abonnés arrivent vite, puis de moins en moins vite : leur nombre ne dépassera pas 3 000.',
        },
        {
          rubrique: 'Les questions d’Hélène',
          contenu:
            'Combien de voiles produire pour que chacune coûte le moins cher ? À quel prix vendre le sac ? Quand la lettre atteindra-t-elle 2 500 abonnés ?',
        },
      ],
      note: moteur.DONNEES_FICTIVES_DU_B2,
    },
  ),
  {
    screenId: 'B2-08-A2-02-MISSION',
    titre: 'Votre mission : coûts, prix et abonnés',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 6,
    concepts: ['derivees-composees', 'fonctions-economiques'],
    notes: moteur.puces(
      'Lecture à voix haute du courriel (1 min), puis 4 min d’écriture individuelle et 1 min de mise en commun au pupitre.',
      'Question 1 : faire dire que le coût d’une voile de plus n’est pas le coût moyen d’une voile.',
      'Question 2 : faire dire que le prix agit deux fois sur la recette, par le prix et par la quantité : un produit à dériver.',
      'Question 3 : laisser ouvert ; c’est l’acte 4.',
      'Papier : trois lignes d’écriture dans le livret.',
    ),
    proprietes: {
      metier:
        'Assistant·e de gestion — Atelier Rivage (voilerie artisanale, 14 salariés, La Rochelle)',
      situation:
        'Lundi, 9 h. Hélène Garnier écrit : « Trois chantiers ce mois-ci : la voile Brise, le sac Bordée et notre lettre d’information. Je voudrais savoir combien de voiles produire, à quel prix vendre le sac, et quand la lettre atteindra 2 500 abonnés. » Marc Lefèvre, l’expert-comptable, ajoute : « Attention, une voile de plus ne coûte pas le coût moyen d’une voile. Et pour le sac, la recette dépend du prix deux fois. »',
      geste:
        'Sans calculatrice, répondez aux trois questions à partir du dossier.',
      consequence:
        'Produire au mauvais niveau renchérit chaque voile ; un prix mal fixé laisse la recette sur la table.',
      questionsLibres: [
        {
          id: 'b2-08-a2-mission:voile-de-plus',
          question:
            'Une voile de plus coûte-t-elle autant que le coût moyen d’une voile ? Pourquoi ?',
          placeholder: 'Oui / Non, parce que…',
        },
        {
          id: 'b2-08-a2-mission:prix',
          question:
            'Quand le prix du sac monte, la recette monte-t-elle forcément ?',
          placeholder: 'Oui / Non, parce que…',
        },
        {
          id: 'b2-08-a2-mission:abonnes',
          question:
            'Comment trouver le mois où la lettre atteint 2 500 abonnés sans tout recompter ?',
          placeholder: 'On pourrait…',
        },
      ],
    },
  },
  pourComprendre(
    {
      screenId: 'B2-08-A2-03-ENFANT-POTAGER',
      titre: 'Le potager qui s’agrandit',
      concepts: ['derivees-composees'],
    },
    {
      fichier: 'potager-qui-s-agrandit.webp',
      imageAlt:
        'Un potager rectangulaire vu de dessus. Une jardinière recule la clôture du côté long d’un pas, un jardinier celle du côté court. La surface gagnée est faite de deux bandes colorées, l’une verte le long du côté court, l’autre orange le long du côté long, et d’un minuscule coin gris.',
      scene:
        'Le potager s’allonge et s’élargit en même temps : la surface gagnée est faite de deux bandes, et d’un coin si petit qu’on le néglige.',
      regle:
        '(uv)′ = u′v + uv′ : la longueur u qui grandit, fois la largeur v, plus la longueur u, fois la largeur qui grandit. Pas u′ × v′, le petit coin.',
      correspondances: [
        ['La longueur du potager', 'u'],
        ['La largeur du potager', 'v'],
        ['La bande verte et la bande orange', 'u′v et uv′, à ajouter'],
        ['Le minuscule coin gris', 'u′ × v′, qui n’est pas la dérivée'],
      ],
    },
    'Question : « Que gagne-t-on en surface, si seule la longueur grandit ? » Une bande : u′v.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-08-A2-04-COURS-PRODUIT-QUOTIENT',
      titre: 'Cours : dériver un produit et un quotient',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['derivees-composees'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire écrire u, v, u′, v′ sur quatre lignes avant toute formule.',
      ),
    },
    'lesson',
    {
      title: 'Dériver un produit et un quotient',
      subtitle: 'Trace écrite · notion 1 · page 1 sur 2',
      blocks: [
        {
          kind: 'property',
          title: 'Produit et quotient',
          text: 'Pour un produit, on dérive l’un en gardant l’autre, puis l’inverse, et on ajoute. Pour un quotient, le numérateur commence par la dérivée du haut, et le dénominateur v ne s’annule pas.',
          formula: '(uv)′ = u′v + uv′ · (u/v)′ = (u′v − uv′)/v²',
        },
        {
          kind: 'example',
          title: 'Pour débuter : h(x) = x e^(2x) et k(x) = x/(x + 1)',
          text: 'Les quatre lignes u, v, u′, v′, puis la formule.',
          steps: [
            'h : u = x, v = e^(2x), u′ = 1, v′ = 2e^(2x).',
            'h′(x) = 1 × e^(2x) + x × 2e^(2x) = (1 + 2x)e^(2x).',
            'k : u = x, v = x + 1, u′ = 1, v′ = 1 ; k′(x) = (x + 1 − x)/(x + 1)² = 1/(x + 1)².',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : les pièges du produit et du quotient',
          text: 'Pièges : multiplier les dérivées, u′ × v′ ; écrire uv′ − u′v au numérateur ; oublier le carré du dénominateur.',
          steps: [
            'Écrire u, v, u′ et v′ sur quatre lignes.',
            'Remplacer dans la formule, sans rien simplifier.',
            'Factoriser par l’exponentielle quand il y en a une : son signe est toujours positif.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-08-A2-05-EXEMPLE-PRODUIT',
      titre: 'Exemple guidé : un produit avec une exponentielle',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['derivees-composees'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-08-a2-exemple-produit',
          enonce: 'Dériver k(x) = (x² − 4)e^(0,5x), puis calculer k′(0).',
          etapes: [
            {
              id: 'quatre-lignes',
              intitule: 'Les quatre lignes',
              raisonnement:
                'u = x² − 4 ; v = e^(0,5x) ; u′ = 2x ; v′ = 0,5e^(0,5x).',
              invite: 'Écrivez u, v, u′ et v′.',
            },
            {
              id: 'formule',
              intitule: 'La formule du produit',
              raisonnement: 'k′(x) = 2x × e^(0,5x) + (x² − 4) × 0,5e^(0,5x).',
              invite: 'Remplacez dans u′v + uv′.',
            },
            {
              id: 'factoriser',
              intitule: 'Factoriser',
              raisonnement:
                'k′(x) = (0,5x² + 2x − 2)e^(0,5x) : l’exponentielle est positive, le signe de k′ est celui du trinôme.',
              invite: 'Mettez e^(0,5x) en facteur.',
            },
            {
              id: 'valeur',
              intitule: 'La pente en 0',
              raisonnement:
                'k′(0) = (0 + 0 − 2) × 1 = −2 : en 0, la courbe descend. k(0) = −4 est la valeur, pas la pente.',
              invite: 'Calculez k′(0). Ne pas confondre avec k(0).',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur l’étape 2 : deux termes ajoutés, jamais u′ × v′.',
        'Transition : « À vous : exercice 1. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-08-A2-06-ATELIER-PRODUIT',
      titre: 'Exercice 1 — Produits et quotients',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['derivees-composees'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : écrire u, v, u′, v′ pour chaque fonction avant la calculatrice.',
        'Pièges : u′ × v′ ; le numérateur du quotient à l’envers ; le carré du dénominateur oublié ; f(a) au lieu de f′(a).',
        'Papier : exercice 1 du livret.',
      ),
      proprietes: {
        intitule: 'Exercice 1 — Produits et quotients',
        consigne:
          'f(x) = (3x − 2)e^(0,5x) et g(x) = (2x + 1)/(x + 3), pour x ≥ 0.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-08-a2-produit',
            'derivees-composees',
            true,
            'Quelle est la dérivée de f(x) = (3x − 2)e^(0,5x) ?',
            'f′(x) = 3e^(0,5x) + (3x − 2) × 0,5e^(0,5x)',
            [['f′(x) = 3 × 0,5e^(0,5x)', PRODUIT_TERME_A_TERME]],
          ),
          moteur.numerique(
            'b2-08-a2-produit-valeur',
            'derivees-composees',
            'Combien vaut f′(2) ? Arrondir au centième.',
            null,
            PRODUIT_EN_2.solution,
            moteur.DEUX_DECIMALES,
            '13,59',
            PRODUIT_EN_2.pieges,
          ),
          moteur.vote(
            'b2-08-a2-quotient',
            'derivees-composees',
            true,
            'Quelle est la dérivée de g(x) = (2x + 1)/(x + 3) ?',
            'g′(x) = 5/(x + 3)²',
            [
              ['g′(x) = −5/(x + 3)²', QUOTIENT_INVERSE],
              ['g′(x) = 5/(x + 3)', QUOTIENT_SANS_CARRE],
            ],
          ),
          moteur.numerique(
            'b2-08-a2-quotient-valeur',
            'derivees-composees',
            'Combien vaut g′(1) ? Arrondir au centième.',
            null,
            QUOTIENT_EN_1.solution,
            moteur.DEUX_DECIMALES,
            '0,31',
            QUOTIENT_EN_1.pieges,
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Transition : « Et quand l’exponentielle contient une fonction ? Un vote pour le deviner. »',
      ],
    },
    [
      [
        'b2-08-a2-produit',
        'u = 3x − 2, v = e^(0,5x), u′ = 3, v′ = 0,5e^(0,5x) : f′ = u′v + uv′ = 3e^(0,5x) + (3x − 2) × 0,5e^(0,5x) = (1,5x + 2)e^(0,5x). Le produit des dérivées oublie les deux bandes.',
      ],
      [
        'b2-08-a2-produit-valeur',
        'f′(2) = (3 + 2)e¹ = 5e ≈ 13,59. u′v′ en 2 donne 1,5e ≈ 4,08 ; f(2) = 4e ≈ 10,87 est la valeur, pas la pente.',
      ],
      [
        'b2-08-a2-quotient',
        'u = 2x + 1, v = x + 3, u′ = 2, v′ = 1 : g′ = (2(x + 3) − (2x + 1))/(x + 3)² = 5/(x + 3)². Le numérateur commence par u′v ; le dénominateur est au carré.',
      ],
      [
        'b2-08-a2-quotient-valeur',
        'g′(1) = 5/16 ≈ 0,31. Le numérateur à l’envers donne −0,31 ; sans carré, 5/4 = 1,25 ; g(1) = 0,75 est la valeur.',
      ],
    ],
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B2-08-A2-07-VOTE-COMPOSEE',
      titre: 'Vote : dériver e^u et ln u',
      dureeMinutes: 4,
      concepts: ['derivees-composees'],
      notes: moteur.notesDuVoteQuiRelanceLaNotion(1),
    },
    [
      moteur.vote(
        'b2-08-a2-vote-exp',
        'derivees-composees',
        false,
        'Quelle est la dérivée de e^(x²) ?',
        '2x e^(x²)',
        [['e^(x²), l’exponentielle reste la même', SANS_U_PRIME]],
      ),
      moteur.vote(
        'b2-08-a2-vote-ln',
        'derivees-composees',
        false,
        'Quelle est la dérivée de ln(3x), pour x > 0 ?',
        '3/(3x), soit 1/x',
        [['1/(3x)', SANS_U_PRIME]],
      ),
    ],
  ),
  pourComprendre(
    {
      screenId: 'B2-08-A2-08-ENFANT-ENGRENAGES',
      titre: 'Les deux engrenages',
      concepts: ['derivees-composees'],
    },
    {
      fichier: 'deux-engrenages.webp',
      imageAlt:
        'Une manivelle fait tourner une petite roue dentée marquée u, qui entraîne une grande roue dentée marquée e. Un petit drapeau sur chaque roue montre combien elle a tourné.',
      scene:
        'La manivelle fait tourner la petite roue, qui fait tourner la grande : pour savoir à quelle vitesse tourne la grande roue, il faut aussi la vitesse de la petite.',
      regle:
        '(e^u)′ = u′e^u et (ln u)′ = u′/u, pour u > 0. On dérive la grande roue, puis on multiplie par u′, la vitesse de la petite.',
      correspondances: [
        ['La petite roue marquée u', 'la fonction u, à l’intérieur'],
        ['La grande roue marquée e', 'e^u ou ln u, à l’extérieur'],
        ['La vitesse de la petite roue', 'u′, le facteur à ne pas oublier'],
      ],
    },
    'Question : « Si la petite roue ne tourne pas, que fait la grande ? » Rien : sans u′, pas de dérivée.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-08-A2-09-COURS-EXP-LN',
      titre: 'Cours : dériver e^u et ln u',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['derivees-composees', 'logarithme-neperien'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Montrer une sortie de calcul formel au vidéoprojecteur, puis la vérifier en une valeur simple.',
      ),
    },
    'lesson',
    {
      title: 'Dériver e^u et ln u, à la main ou au calcul formel',
      subtitle: 'Trace écrite · notion 1 · page 2 sur 2',
      blocks: [
        {
          kind: 'property',
          title: 'e^u et ln u',
          text: 'On dérive l’extérieur, puis on multiplie par u′. Comme e^u > 0, (e^u)′ a le signe de u′. ln u n’existe que pour u > 0.',
          formula: '(e^u)′ = u′e^u · (ln u)′ = u′/u',
        },
        {
          kind: 'example',
          title: 'Pour débuter',
          text: 'Repérer u, puis u′.',
          steps: [
            'e^(−3x + 1) : u = −3x + 1, u′ = −3, la dérivée vaut −3e^(−3x + 1).',
            'ln(2x + 5) : u = 2x + 5, u′ = 2, la dérivée vaut 2/(2x + 5).',
          ],
        },
        {
          kind: 'definition',
          title: 'Le calcul formel',
          text: 'Quand l’expression est longue, un logiciel de calcul formel (GeoGebra, Xcas) donne la dérivée. On vérifie sa sortie à la main en une valeur simple. Pour (2x + 1)/(x² + 1), il affiche (−2x² − 2x + 2)/(x² + 1)² ; en x = 0, la formule du quotient donne (2 × 1 − 1 × 0)/1 = 2, et la sortie aussi.',
        },
        {
          kind: 'exam',
          title: 'Au CCF : les pièges de e^u et ln u',
          text: 'Pièges : oublier u′ ; écrire 1/u pour (ln u)′ ; recopier une sortie de logiciel sans la vérifier.',
          steps: [
            'Écrire u et u′.',
            'Appliquer u′e^u ou u′/u.',
            'Vérifier une sortie de logiciel en une valeur simple.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-08-A2-10-ATELIER-COMPOSEES',
      titre: 'Exercice 2 — e^u, ln u et calcul formel',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['derivees-composees', 'variations-d-une-fonction'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : écrire u et u′ avant tout calcul ; pour la sortie du logiciel, la vérifier en x = 0.',
        'Pièges : u′ oublié ; f(a) au lieu de f′(a) ; un extremum conclu dès que f′ s’annule.',
        'Papier : exercice 2 du livret.',
      ),
      proprietes: {
        intitule: 'Exercice 2 — e^u, ln u et calcul formel',
        consigne:
          'h(x) = ln(x² + 5) ; f(x) = (x² + 1)e^(−x), pour x de 0 à 5. Un logiciel de calcul formel affiche, pour la dérivée de f : f′(x) = −(x − 1)²e^(−x).',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-08-a2-exp-u',
            'derivees-composees',
            true,
            'Quelle est la dérivée de e^(x² − 3x) ?',
            '(2x − 3)e^(x² − 3x)',
            [['e^(x² − 3x)', SANS_U_PRIME]],
          ),
          moteur.numerique(
            'b2-08-a2-ln-valeur',
            'derivees-composees',
            'Combien vaut h′(3) ? Arrondir au centième.',
            null,
            LOGARITHME_EN_3.solution,
            moteur.DEUX_DECIMALES,
            '0,43',
            LOGARITHME_EN_3.pieges,
          ),
          moteur.vote(
            'b2-08-a2-calcul-formel',
            'variations-d-une-fonction',
            true,
            'Avec la sortie du logiciel, que peut-on dire du sens de f sur [0 ; 5] ?',
            'f est décroissante : f′(x) ≤ 0, nulle seulement en 1',
            [['f a un maximum en 1, où f′ s’annule', SANS_CHANGEMENT_DE_SIGNE]],
          ),
          moteur.numerique(
            'b2-08-a2-calcul-formel-valeur',
            'derivees-composees',
            'Avec la sortie du logiciel, combien vaut f′(2) ? Arrondir au centième.',
            null,
            CALCUL_FORMEL_EN_2.solution,
            moteur.DEUX_DECIMALES,
            '−0,14',
            CALCUL_FORMEL_EN_2.pieges,
          ),
        ],
      },
    },
    moteur.CORRECTION_AVANT_LA_PREMIERE_PAUSE,
    [
      [
        'b2-08-a2-exp-u',
        'u = x² − 3x, u′ = 2x − 3 : (e^u)′ = u′e^u = (2x − 3)e^(x² − 3x). Sans u′, la petite roue ne tourne pas.',
      ],
      [
        'b2-08-a2-ln-valeur',
        'u = x² + 5, u′ = 2x : h′(x) = 2x/(x² + 5), h′(3) = 6/14 ≈ 0,43. 1/(x² + 5) oublie u′ et donne 0,07 ; h(3) = ln 14 ≈ 2,64 est la valeur.',
      ],
      [
        'b2-08-a2-calcul-formel',
        'Vérification à la main en 0 : u′v + uv′ = 2 × 0 × 1 + 1 × (−1) = −1, et −(0 − 1)²e⁰ = −1 aussi. Un carré est positif : f′(x) ≤ 0, nulle en 1 sans changer de signe, f décroît sur [0 ; 5], sans extremum en 1.',
      ],
      [
        'b2-08-a2-calcul-formel-valeur',
        'f′(2) = −(2 − 1)²e^(−2) = −e^(−2) ≈ −0,14. f(2) = 5e^(−2) ≈ 0,68 est la valeur, pas la pente.',
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B2-08-A2-11-JALON',
      titre: 'Jalon 1 : les dérivées',
      concepts: ['derivees-composees'],
    },
    {
      id: 'b2-08-a2-jalon',
      invite:
        'Je sais dériver un produit, un quotient, e^u et ln u, et vérifier une sortie de calcul formel.',
    },
    'Si plus de 30 % « Perdu » : reprendre l’écran du potager après la pause.',
    moteur.PAUSE_HORS_DUREE,
  ),
];

const ACTE_3: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B2-08-A3-01-VOTE-MARGINAL',
      titre: 'Vote : que coûte une unité de plus ?',
      dureeMinutes: 4,
      concepts: ['fonctions-economiques'],
      notes: moteur.notesDuVoteQuiOuvreLaNotion(2),
    },
    [
      moteur.vote(
        'b2-08-a3-vote-unite',
        'fonctions-economiques',
        false,
        'Produire 40 voiles coûte 9 200 €, en produire 41 coûte 9 230 €. Que coûte la 41e voile ?',
        '30 €, l’écart entre les deux coûts totaux',
        [['9 230 € ÷ 41, environ 225 €', MOYEN_POUR_MARGINAL]],
      ),
      moteur.vote(
        'b2-08-a3-vote-derivee',
        'fonctions-economiques',
        false,
        'C(q) est le coût total de q unités. Que mesure C′(q) ?',
        'Environ le coût d’une unité de plus, au niveau q',
        [['Le coût total des q unités', VALEUR_POUR_PENTE]],
      ),
    ],
  ),
  {
    screenId: 'B2-08-A3-02-GRAPHE-TANGENTE',
    titre: 'Le coût marginal, pente de la courbe du coût',
    diffusion: 'catalogue',
    brique: 'fp-plot',
    dureeMinutes: 1,
    concepts: ['fonctions-economiques', 'fonction-derivee'],
    notes: moteur.puces(
      'Faire glisser q de 0 à 24 : la tangente roule sur la courbe ; sa pente est le coût marginal.',
      'Faire dire où la pente est la plus faible : en q = 6, là où la courbe passe de « ralentit » à « accélère ».',
    ),
    proprietes: {
      titre: 'Coût total C(q) et sa tangente au point d’abscisse q',
      source: 'Exemple de cours, données fictives.',
      abscisse: { libelle: 'Production q (unités)', min: 0, max: 24 },
      ordonnee: 'Coût total (€)',
      parametres: [
        {
          cle: 'q',
          libelle: 'Production q',
          min: 0,
          max: 24,
          pas: 1,
          defaut: 8,
        },
      ],
      series: [
        {
          id: 'cout',
          libelle: 'Coût total C(q)',
          trait: 'plein',
          calcul: COUT_D_EXEMPLE,
        },
        {
          id: 'tangente',
          libelle: 'Tangente au point d’abscisse q',
          trait: 'tirets',
          calcul: `q^3/12-1.5*q^2+20*q+72+(q^2/4-3*q+20)*(x-q)`,
        },
      ],
      description:
        'C(q) = q³/12 − 1,5q² + 20q + 72. Faites glisser q : la tangente en tirets touche la courbe au point d’abscisse q, et sa pente est le coût marginal C′(q). Placez q sur 12 : la tangente monte de 20 € par unité, C′(12) = 20.',
      descriptionPapier:
        'C(q) = q³/12 − 1,5q² + 20q + 72. Sur la figure, q vaut 8 : la tangente en tirets touche la courbe au point d’abscisse 8, et sa pente C′(8) = 12 est le coût marginal, le coût d’une unité de plus, environ.',
    },
  },
  {
    screenId: 'B2-08-A3-03-GRAPHE-COUT-MOYEN',
    titre: 'Coût moyen et coût marginal se croisent',
    diffusion: 'catalogue',
    brique: 'fp-plot',
    dureeMinutes: 1,
    concepts: ['fonctions-economiques', 'optimisation'],
    notes: moteur.puces(
      'Faire lire le point de rencontre : le coût moyen y est le plus bas.',
      'Faire dire pourquoi : tant qu’une unité de plus coûte moins que la moyenne, elle fait baisser la moyenne.',
    ),
    proprietes: {
      titre: 'Coût moyen CM(q) et coût marginal Cm(q)',
      source: 'Exemple de cours, données fictives.',
      abscisse: { libelle: 'Production q (unités)', min: 1, max: 25 },
      ordonnee: 'Coût par unité (€)',
      parametres: [],
      series: [
        {
          id: 'cout-moyen',
          libelle: 'Coût moyen CM(q) = C(q) ÷ q',
          trait: 'plein',
          calcul: `(${COUT_D_EXEMPLE})/x`,
        },
        {
          id: 'cout-marginal',
          libelle: 'Coût marginal Cm(q) = C′(q)',
          trait: 'tirets',
          calcul: COUT_MARGINAL_D_EXEMPLE,
        },
      ],
      description:
        'Les deux courbes se croisent en q = 12 : le coût moyen y est minimal et vaut 20 € par unité, autant que le coût marginal. Avant 12, Cm < CM et le coût moyen baisse ; après, Cm > CM et il remonte.',
      descriptionPapier:
        'Lisez le point où les deux courbes se croisent, en q = 12 : le coût moyen y est minimal et vaut 20 € par unité, autant que le coût marginal.',
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-08-A3-04-COURS-COUTS',
      titre: 'Cours : coût total, coût moyen, coût marginal',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['fonctions-economiques'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Relier aux deux graphiques : la pente de la tangente, puis le croisement des deux courbes.',
      ),
    },
    'lesson',
    {
      title: 'Coût total, coût moyen, coût marginal',
      subtitle: 'Trace écrite · notion 2 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Trois coûts',
          text: 'Le coût total C(q) est le coût de q unités. Le coût moyen est le coût d’une unité en moyenne. Le coût marginal est le coût d’une unité de plus : C(q + 1) − C(q), que l’on approche par la dérivée.',
          formula: 'CM(q) = C(q) ÷ q · Cm(q) ≈ C′(q)',
        },
        {
          kind: 'property',
          title: 'Le minimum du coût moyen',
          text: 'CM′(q) = (q C′(q) − C(q))/q², par la formule du quotient. CM′ s’annule là où C′(q) = C(q) ÷ q : le coût moyen est minimal là où il égale le coût marginal.',
        },
        {
          kind: 'example',
          title: 'Pour débuter : C(q) = q³/12 − 1,5q² + 20q + 72',
          text: 'L’exemple des deux graphiques.',
          steps: [
            'C′(q) = q²/4 − 3q + 20 ; C′(12) = 36 − 36 + 20 = 20.',
            'CM(12) = C(12) ÷ 12 = 240 ÷ 12 = 20 : coût moyen et coût marginal se rejoignent.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : nommer le bon coût',
          text: 'Pièges : prendre C′(q) pour le coût moyen ; chercher le minimum du coût moyen là où le coût marginal est minimal ; donner q pour le coût.',
          steps: [
            'Coût d’une unité en moyenne : diviser par q.',
            'Coût d’une unité de plus : dériver.',
            'Conclure par la production et par la valeur du coût moyen.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-08-A3-05-EXEMPLE-COUTS',
      titre: 'Exemple guidé : le minimum du coût moyen',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['fonctions-economiques', 'derivees-composees'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-08-a3-exemple-couts',
          enonce:
            'C(q) = q³/12 − 1,5q² + 20q + 72 euros pour q unités, q de 1 à 24. Trouver la production qui rend le coût moyen minimal.',
          etapes: [
            {
              id: 'cout-moyen',
              intitule: 'Le coût moyen',
              raisonnement: 'CM(q) = C(q) ÷ q = q²/12 − 1,5q + 20 + 72/q.',
              invite: 'Écrivez CM(q).',
            },
            {
              id: 'derivee',
              intitule: 'Sa dérivée par le quotient',
              raisonnement:
                'CM′(q) = (q C′(q) − C(q))/q² = (q³/6 − 1,5q² − 72)/q².',
              invite: 'Dérivez CM avec la formule du quotient.',
            },
            {
              id: 'signe',
              intitule: 'Le signe',
              raisonnement:
                'En q = 12 : 288 − 216 − 72 = 0. En q = 6, le numérateur vaut −90 ; en q = 18, il vaut 414. CM′ passe de − à + en 12.',
              invite:
                'Où CM′ s’annule-t-elle, et avec quel changement de signe ?',
            },
            {
              id: 'conclusion',
              intitule: 'Conclure',
              raisonnement:
                'Le coût moyen est minimal pour 12 unités et vaut CM(12) = 20 € par unité, autant que C′(12).',
              invite: 'Donnez la production et le coût moyen minimal.',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur l’étape 3 : le minimum se justifie par le changement de signe.',
        'Transition : « À vous : exercice 3. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-08-A3-06-ATELIER-COUTS',
      titre: 'Exercice 3 — Les coûts de la voile Brise',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 6,
      concepts: ['fonctions-economiques', 'optimisation'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 5),
        'Réflexion : écrire C′(q) et CM(q) avant de calculer.',
        'Pièges : coût moyen et coût marginal confondus ; q donné pour le coût.',
        'Papier : exercice 3 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        intitule: 'Exercice 3 — Les coûts de la voile Brise',
        consigne:
          'Pour q dizaines de voiles Brise, q de 1 à 8, le coût total vaut C(q) = q³ − 6q² + 20q + 100 centaines d’euros. On admet que CM′(q) = (2q³ − 6q² − 100)/q².',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b2-08-a3-cout-marginal',
            'fonctions-economiques',
            'Combien vaut le coût marginal Cm(3) = C′(3), en centaines d’euros par dizaine ?',
            null,
            COUT_MARGINAL_EN_3.solution,
            moteur.TOLERANCE_NULLE,
            '11',
            COUT_MARGINAL_EN_3.pieges,
          ),
          moteur.vote(
            'b2-08-a3-minimum-cout-moyen',
            'fonctions-economiques',
            true,
            'Pour quelle production le coût moyen est-il minimal ?',
            'q = 5 dizaines : CM′ s’annule en 5 en passant de − à +',
            [
              [
                'q = 2 dizaines, où le coût marginal est le plus bas',
                MOYEN_POUR_MARGINAL,
              ],
            ],
          ),
          moteur.numerique(
            'b2-08-a3-cout-moyen-minimal',
            'fonctions-economiques',
            'Combien vaut ce coût moyen minimal, en centaines d’euros par dizaine ?',
            null,
            COUT_MOYEN_MINIMAL.solution,
            moteur.TOLERANCE_NULLE,
            '35',
            COUT_MOYEN_MINIMAL.pieges,
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Transition : « Du coût au prix : un vote sur la recette et l’équilibre. »',
      ],
    },
    [
      [
        'b2-08-a3-cout-marginal',
        'C′(q) = 3q² − 12q + 20, C′(3) = 27 − 36 + 20 = 11 : la dizaine suivante coûte environ 1 100 €. C(3) ÷ 3 ≈ 44,33 est le coût moyen.',
      ],
      [
        'b2-08-a3-minimum-cout-moyen',
        '2q³ − 6q² − 100 vaut 0 en 5, il est négatif avant et positif après : CM descend puis remonte, minimum en 5. Le minimum du coût marginal, en 2, n’est pas celui du coût moyen.',
      ],
      [
        'b2-08-a3-cout-moyen-minimal',
        'CM(5) = C(5) ÷ 5 = 175 ÷ 5 = 35, et C′(5) = 75 − 60 + 20 = 35 : coût moyen et coût marginal se rejoignent. 5 est la production, pas le coût.',
      ],
    ],
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B2-08-A3-07-VOTE-MARCHE',
      titre: 'Vote : recette et équilibre du marché',
      dureeMinutes: 4,
      concepts: ['fonctions-economiques', 'resolution-par-logarithme'],
      notes: moteur.notesDuVoteQuiRelanceLaNotion(2),
    },
    [
      moteur.vote(
        'b2-08-a3-vote-recette',
        'fonctions-economiques',
        false,
        'Au prix de p euros, l’atelier vend D(p) sacs. Que vaut sa recette ?',
        'p × D(p) euros',
        [['D(p), le nombre de sacs vendus', RECETTE_SANS_PRIX]],
      ),
      moteur.vote(
        'b2-08-a3-vote-equilibre',
        'resolution-par-logarithme',
        false,
        'L’équilibre du marché revient à résoudre e^(0,2p) = 10. Que vaut p ?',
        'p = ln 10 ÷ 0,2',
        [['p = 10 ÷ 0,2 = 50', SEUIL_PAR_DIVISION]],
      ),
    ],
  ),
  {
    screenId: 'B2-08-A3-08-GRAPHE-MARCHE',
    titre: 'L’offre et la demande se croisent',
    diffusion: 'catalogue',
    brique: 'fp-plot',
    dureeMinutes: 1,
    concepts: ['fonctions-economiques'],
    notes: moteur.puces(
      'Faire dire le sens de chaque courbe : la demande baisse avec le prix, l’offre monte.',
      'Faire lire le prix au croisement, puis la quantité.',
    ),
    proprietes: {
      titre: 'Demande D(p) et offre O(p)',
      source: 'Exemple de cours, données fictives.',
      abscisse: { libelle: 'Prix p (€)', min: 0, max: 48 },
      ordonnee: 'Quantité (articles)',
      parametres: [],
      series: [
        {
          id: 'demande',
          libelle: 'Demande D(p) = 600e^(−0,05p)',
          trait: 'plein',
          calcul: '600*EXP(-0.05*x)',
        },
        {
          id: 'offre',
          libelle: 'Offre O(p) = 150e^(0,03p)',
          trait: 'tirets',
          calcul: '150*EXP(0.03*x)',
        },
      ],
      description:
        'La demande baisse quand le prix monte, l’offre monte. Les courbes se croisent au prix d’équilibre, vers 17,33 € : on y lit environ 252 articles, autant demandés qu’offerts.',
      descriptionPapier:
        'Lisez le croisement des deux courbes : le prix d’équilibre, vers 17,33 €, pour environ 252 articles demandés et offerts.',
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-08-A3-09-COURS-MARCHE',
      titre: 'Cours : recette, offre, demande et prix d’équilibre',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['fonctions-economiques', 'resolution-par-logarithme'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Relier au graphique : le croisement est la solution de D(p) = O(p).',
      ),
    },
    'lesson',
    {
      title: 'Recette, offre, demande et prix d’équilibre',
      subtitle: 'Trace écrite · notion 2 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Demande, offre, recette',
          text: 'La demande D(p) est la quantité que les clients achètent au prix p ; elle décroît. L’offre O(p) est la quantité que le vendeur accepte de produire ; elle croît. La recette est le prix fois la quantité vendue.',
          formula: 'R(p) = p × D(p)',
        },
        {
          kind: 'property',
          title: 'Le prix d’équilibre',
          text: 'C’est le prix où la quantité demandée égale la quantité offerte : on résout D(p) = O(p). Avec deux exponentielles, on regroupe les e d’un côté, puis on passe par ln.',
          formula: 'D(p) = O(p)',
        },
        {
          kind: 'example',
          title: 'Pour débuter : D(p) = 600e^(−0,05p) et O(p) = 150e^(0,03p)',
          text: 'L’exemple du graphique.',
          steps: [
            '600e^(−0,05p) = 150e^(0,03p) ⇔ e^(0,08p) = 4 ⇔ p = ln 4 ÷ 0,08 ≈ 17,33 €.',
            'R(p) = 600p e^(−0,05p) : produit, R′(p) = 600e^(−0,05p)(1 − 0,05p), nulle en p = 20 ; recette maximale R(20) = 12 000e^(−1) ≈ 4 414,55 €.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : les pièges du marché',
          text: 'Pièges : prendre la quantité pour la recette ; diviser au lieu de passer par ln ; ajouter les k au lieu de les soustraire en regroupant les e.',
          steps: [
            'Écrire R(p) = p × D(p), puis la dériver comme un produit.',
            'Pour l’équilibre, regrouper les exponentielles d’un même côté.',
            'Passer par ln, puis diviser.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-08-A3-10-ATELIER-MARCHE',
      titre: 'Exercice 4 — Le prix du sac Bordée',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 6,
      concepts: ['fonctions-economiques', 'derivees-composees'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 5),
        'Réflexion : écrire l’équation d’équilibre et R(p) avant la calculatrice.',
        'Pièges : les k ajoutés au lieu d’être soustraits ; u′ × v′ ; la quantité prise pour la recette ; le prix donné pour la recette.',
        'Papier : exercice 4 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        intitule: 'Exercice 4 — Le prix du sac Bordée',
        consigne:
          'Au prix de p euros, la demande du sac Bordée vaut D(p) = 900e^(−0,04p) sacs par mois et l’offre O(p) = 100e^(0,05p) sacs par mois.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b2-08-a3-prix-equilibre',
            'resolution-par-logarithme',
            'Quel est le prix d’équilibre, en euros ? Arrondir au centième.',
            '€',
            PRIX_D_EQUILIBRE.solution,
            moteur.DEUX_DECIMALES,
            '24,41 €',
            PRIX_D_EQUILIBRE.pieges,
          ),
          moteur.vote(
            'b2-08-a3-recette-derivee',
            'derivees-composees',
            true,
            'La recette vaut R(p) = 900p e^(−0,04p). Quelle est R′(p) ?',
            'R′(p) = 900e^(−0,04p)(1 − 0,04p)',
            [['R′(p) = 900 × (−0,04)e^(−0,04p)', PRODUIT_TERME_A_TERME]],
          ),
          moteur.numerique(
            'b2-08-a3-recette-maximale',
            'fonctions-economiques',
            'Quelle est la recette mensuelle maximale, en euros ? Arrondir à l’euro.',
            '€',
            RECETTE_MAXIMALE.solution,
            moteur.A_L_UNITE,
            '8 277 €',
            RECETTE_MAXIMALE.pieges,
          ),
        ],
      },
    },
    moteur.CORRECTION_AVANT_LA_SECONDE_PAUSE,
    [
      [
        'b2-08-a3-prix-equilibre',
        '900e^(−0,04p) = 100e^(0,05p) ⇔ e^(0,09p) = 9 ⇔ p = ln 9 ÷ 0,09 ≈ 24,41 €. Ajouter −0,04 au lieu de le soustraire donne 0,01, et un prix de 219,72 €.',
      ],
      [
        'b2-08-a3-recette-derivee',
        'u = 900p, v = e^(−0,04p), u′ = 900, v′ = −0,04e^(−0,04p) : R′ = 900e^(−0,04p) − 36p e^(−0,04p) = 900e^(−0,04p)(1 − 0,04p). Le produit des dérivées oublie un terme.',
      ],
      [
        'b2-08-a3-recette-maximale',
        'R′ est du signe de 1 − 0,04p : positive avant 25, négative après. R(25) = 22 500e^(−1) ≈ 8 277 €. 25 € est le prix, pas la recette ; D(25) ≈ 331 sacs est la quantité.',
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B2-08-A3-11-JALON',
      titre: 'Jalon 2 : les fonctions économiques',
      concepts: ['fonctions-economiques'],
    },
    {
      id: 'b2-08-a3-jalon',
      invite:
        'Je sais lire le coût marginal comme C′(q), trouver le minimum du coût moyen et un prix d’équilibre.',
    },
    'Si plus de 30 % « Perdu » : reprendre le graphique du coût moyen après la pause.',
    moteur.PAUSE_HORS_DUREE,
  ),
];

const ACTE_4: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B2-08-A4-01-VOTE-SOLUTIONS',
      titre: 'Vote : combien de solutions, et où ?',
      dureeMinutes: 4,
      concepts: ['resolution-approchee'],
      notes: moteur.notesDuVoteQuiOuvreLaNotion(3),
    },
    [
      moteur.vote(
        'b2-08-a4-vote-nombre',
        'resolution-approchee',
        false,
        'f est strictement croissante sur [0 ; 10], f(0) = 2 et f(10) = 50. Combien de solutions a f(x) = 30 sur [0 ; 10] ?',
        'Exactement une',
        [['On ne peut pas savoir sans la formule de f', SANS_VARIATIONS]],
      ),
      moteur.vote(
        'b2-08-a4-vote-encadrement',
        'resolution-approchee',
        false,
        'f est croissante, f(2) = 25 et f(3) = 34. Où est la solution de f(x) = 30 ?',
        'Entre 2 et 3',
        [['En 3, la valeur la plus proche', MAL_ENCADRE]],
      ),
    ],
  ),
  {
    screenId: 'B2-08-A4-02-GRAPHE-DROITE-K',
    titre: 'La droite y = k coupe la courbe',
    diffusion: 'catalogue',
    brique: 'fp-plot',
    dureeMinutes: 1,
    concepts: ['resolution-approchee', 'variations-d-une-fonction'],
    notes: moteur.puces(
      'Faire monter k et compter les points de rencontre : deux sous le sommet, aucun au-dessus. Faire dire ce que donnerait k égal au sommet, environ 73,58 : une seule rencontre.',
      'Faire dire que le tableau de variation suffit à compter les solutions, sans tracer.',
    ),
    proprietes: {
      titre: 'g(x) = 20x e^(−0,1x) et la droite y = k',
      source: 'Exemple de cours.',
      abscisse: { libelle: 'x', min: 0, max: 48 },
      ordonnee: 'y',
      parametres: [
        { cle: 'k', libelle: 'Valeur k', min: 10, max: 80, pas: 5, defaut: 40 },
      ],
      series: [
        {
          id: 'courbe',
          libelle: 'g(x) = 20x e^(−0,1x)',
          trait: 'plein',
          calcul: '20*x*EXP(-0.1*x)',
        },
        { id: 'droite', libelle: 'Droite y = k', trait: 'tirets', calcul: 'k' },
      ],
      description:
        'g croît jusqu’à son sommet, environ 73,58 en x = 10, puis décroît. Faites monter la droite y = k de 10 à 80 : sous le sommet, elle coupe la courbe deux fois, une sur la montée et une sur la descente ; au-dessus, aucune. Seul k égal au sommet donnerait une rencontre unique.',
      descriptionPapier:
        'Sur la figure, k vaut 40 : la droite coupe la courbe deux fois, une sur la montée et une sur la descente. Le sommet vaut environ 73,58 en x = 10.',
    },
  },
  {
    screenId: 'B2-08-A4-03-GRAPHE-LOGISTIQUE',
    titre: 'Une courbe qui monte toujours',
    diffusion: 'catalogue',
    brique: 'fp-plot',
    dureeMinutes: 1,
    concepts: ['resolution-approchee', 'fonction-exponentielle'],
    notes: moteur.puces(
      'Faire décrire la courbe : elle monte vite, puis de plus en plus lentement, sans dépasser 1 000.',
      'Faire glisser k : une seule rencontre, toujours. Annoncer la question : où, précisément ?',
    ),
    proprietes: {
      titre: 'L(t) = 1 000/(1 + 9e^(−0,3t)) et la droite y = k',
      source: 'Exemple de cours.',
      abscisse: { libelle: 'Temps t', min: 0, max: 24 },
      ordonnee: 'L(t)',
      parametres: [
        {
          cle: 'k',
          libelle: 'Valeur k',
          min: 100,
          max: 950,
          pas: 50,
          defaut: 600,
        },
      ],
      series: [
        {
          id: 'courbe',
          libelle: 'L(t) = 1 000/(1 + 9e^(−0,3t))',
          trait: 'plein',
          calcul: '1000/(1+9*EXP(-0.3*x))',
        },
        { id: 'droite', libelle: 'Droite y = k', trait: 'tirets', calcul: 'k' },
      ],
      description:
        'La courbe part de 100 et monte toujours, sans dépasser 1 000. Faites glisser k entre 100 et 950 : la droite y = k la coupe une seule fois. Pour k = 600, la rencontre est entre t = 8 et t = 9.',
      descriptionPapier:
        'Sur la figure, k vaut 600 : la droite coupe la courbe une seule fois, entre t = 8 et t = 9, car la courbe monte toujours.',
    },
  },
  pourComprendre(
    {
      screenId: 'B2-08-A4-04-ENFANT-NOMBRE-SECRET',
      titre: 'Le nombre secret',
      concepts: ['resolution-approchee'],
    },
    {
      fichier: 'nombre-secret.webp',
      imageAlt:
        'Deux amis jouent au nombre secret. Une ficelle graduée de 1 à 100 est tendue entre deux poteaux ; l’une coupe la ficelle en son milieu, à 50, avec des ciseaux ; l’autre répond « plus grand ! ». La moitié gauche est grisée, la moitié droite reste colorée.',
      scene:
        'On cherche un nombre caché entre 1 et 100. À chaque essai, on coupe la plage en deux et on garde la moitié où il se cache.',
      regle:
        'la dichotomie coupe [a ; b] en son milieu m, puis garde la moitié aux bornes de laquelle f(x) − k change de signe. Chaque coupe divise l’encadrement par deux.',
      correspondances: [
        ['La ficelle de 1 à 100', 'l’intervalle de départ [a ; b]'],
        ['Les ciseaux au milieu', 'le milieu m = (a + b)/2'],
        ['La réponse « plus grand ! »', 'le signe de f(m) − k'],
        ['La moitié restée colorée', 'le nouvel encadrement'],
      ],
    },
    'Question : « Combien de coupes pour passer de 100 nombres à un seul ? » Sept, car 2⁷ = 128.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-08-A4-05-COURS-SOLUTIONS',
      titre: 'Cours : résoudre f(x) = k, balayage et dichotomie',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['resolution-approchee'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire justifier « une seule solution » par les trois mots : strictement monotone, k entre les valeurs aux bornes.',
      ),
    },
    'lesson',
    {
      title: 'Résoudre f(x) = k : combien de solutions, et où',
      subtitle: 'Trace écrite · notion 3',
      blocks: [
        {
          kind: 'property',
          title: 'Combien de solutions',
          text: 'Si f est continue et strictement monotone sur [a ; b], et si k est compris entre f(a) et f(b), alors l’équation f(x) = k a une seule solution sur [a ; b]. On le lit dans le tableau de variation, intervalle par intervalle.',
        },
        {
          kind: 'definition',
          title: 'Balayage et dichotomie',
          text: 'Le balayage calcule f au pas de 1, puis au pas de 0,1 entre les deux valeurs qui encadrent k : la solution est entre elles. La dichotomie coupe l’intervalle en son milieu et garde la moitié où f(x) − k change de signe.',
        },
        {
          kind: 'example',
          title: 'Pour débuter : L(t) = 1 000/(1 + 9e^(−0,3t)) = 600',
          text: 'L’exemple du graphique, sur [0 ; 24].',
          steps: [
            'L est strictement croissante, L(0) = 100 et L(24) ≈ 993,33 : une seule solution.',
            'Au pas de 1 : L(8) ≈ 550,52 < 600 < L(9) ≈ 623,11, la solution est entre 8 et 9.',
            'Au pas de 0,1 : elle est entre 8,6 et 8,7.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : justifier, puis encadrer',
          text: 'Pièges : annoncer une solution sans regarder les variations ; donner la borne du mauvais côté ; garder la mauvaise moitié.',
          steps: [
            'Citer la stricte monotonie et les valeurs aux bornes.',
            'Encadrer par balayage, à la calculatrice ou au tableur.',
            'Conclure par la valeur par défaut, ou par excès, demandée.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-08-A4-06-EXEMPLE-DICHOTOMIE',
      titre: 'Exemple guidé : couper en deux',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['resolution-approchee'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-08-a4-exemple-dichotomie',
          enonce:
            'L(t) = 1 000/(1 + 9e^(−0,3t)) est strictement croissante sur [0 ; 24]. Encadrer la solution de L(t) = 700 par dichotomie.',
          etapes: [
            {
              id: 'premier-milieu',
              intitule: 'Premier milieu',
              raisonnement:
                'm = 12 : L(12) ≈ 802,62 > 700, la solution est dans [0 ; 12].',
              invite: 'Calculez L(12) et gardez la bonne moitié.',
            },
            {
              id: 'deuxieme-milieu',
              intitule: 'Deuxième milieu',
              raisonnement:
                'm = 6 : L(6) ≈ 401,98 < 700, la solution est dans [6 ; 12].',
              invite: 'Coupez [0 ; 12] en deux.',
            },
            {
              id: 'troisieme-milieu',
              intitule: 'Troisième milieu',
              raisonnement:
                'm = 9 : L(9) ≈ 623,11 < 700, la solution est dans [9 ; 12].',
              invite: 'Coupez [6 ; 12] en deux.',
            },
            {
              id: 'quatrieme-milieu',
              intitule: 'Quatrième milieu',
              raisonnement:
                'm = 10,5 : L(10,5) ≈ 721,67 > 700, la solution est dans [9 ; 10,5], un encadrement d’amplitude 1,5.',
              invite: 'Coupez [9 ; 12] en deux et concluez.',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur chaque choix de moitié : on garde celle aux bornes de laquelle L(t) − 700 change de signe.',
        'Transition : « À vous : exercice 5. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-08-A4-07-ATELIER-SOLUTIONS',
      titre: 'Exercice 5 — Quand atteindra-t-on 2 500 abonnés ?',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 6,
      concepts: ['resolution-approchee'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 5),
        'Réflexion : écrire les variations de N et les valeurs aux bornes avant de calculer.',
        'Pièges : compter les solutions sans les variations ; garder la mauvaise moitié ; la valeur par excès au lieu de la valeur par défaut.',
        'Papier : exercice 5 du livret, calculatrice en mode table.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        intitule: 'Exercice 5 — Quand atteindra-t-on 2 500 abonnés ?',
        consigne:
          'Le nombre d’abonnés à la lettre de l’atelier au mois t vaut N(t) = 3 000 / (1 + 29e^(−0,5t)), pour t de 0 à 20. N est strictement croissante, N(0) = 100 et N(20) ≈ 2 996.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-08-a4-nombre-solutions',
            'resolution-approchee',
            true,
            'Combien de solutions a l’équation N(t) = 2 500 sur [0 ; 20] ?',
            'Un seul mois t : N est strictement croissante et 2 500 est entre N(0) et N(20)',
            [['Deux, une à la montée et une à la descente', SANS_VARIATIONS]],
          ),
          moteur.vote(
            'b2-08-a4-moitie',
            'resolution-approchee',
            true,
            'Dichotomie sur [0 ; 20] : N(10) ≈ 2 509,62. Quelle moitié garder ?',
            '[0 ; 10], car N(10) dépasse déjà 2 500',
            [['[10 ; 20], la moitié qui suit', MAUVAISE_MOITIE]],
          ),
          moteur.numerique(
            'b2-08-a4-dichotomie',
            'resolution-approchee',
            'Poursuivez la dichotomie : N(5) ≈ 887,45 et N(7,5) ≈ 1 783,58. Quel est le quatrième milieu calculé ?',
            null,
            MILIEU_DE_LA_DICHOTOMIE.solution,
            moteur.TOLERANCE_NULLE,
            '8,75',
            MILIEU_DE_LA_DICHOTOMIE.pieges,
          ),
          moteur.numerique(
            'b2-08-a4-valeur-approchee',
            'resolution-approchee',
            'Par balayage au pas de 0,1, donnez la valeur approchée par défaut, au dixième, de la solution de N(t) = 2 500.',
            null,
            VALEUR_APPROCHEE.solution,
            moteur.TOLERANCE_NULLE,
            '9,9',
            VALEUR_APPROCHEE.pieges,
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Transition : « Le balayage, maintenant au tableur : exercice 6. »',
      ],
    },
    [
      [
        'b2-08-a4-nombre-solutions',
        'N est strictement croissante sur [0 ; 20] et 100 < 2 500 < 2 996 : une seule solution. Une courbe qui monte toujours ne repasse jamais par la même hauteur.',
      ],
      [
        'b2-08-a4-moitie',
        'N(0) < 2 500 < N(10) : N(t) − 2 500 change de signe sur [0 ; 10], la solution y est.',
      ],
      [
        'b2-08-a4-dichotomie',
        'Milieux : 10, puis 5 (N(5) < 2 500, on garde [5 ; 10]), puis 7,5 (N(7,5) < 2 500, on garde [7,5 ; 10]), puis 8,75. Garder [5 ; 7,5] au troisième pas donnerait 6,25.',
      ],
      [
        'b2-08-a4-valeur-approchee',
        'N(9,9) ≈ 2 488,76 < 2 500 < N(10) ≈ 2 509,62 : la solution est entre 9,9 et 10, valeur par défaut 9,9. 10 est la valeur par excès.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-08-A4-08-TABLEUR-BALAYAGE',
      titre: 'Exercice 6 — Le balayage au tableur',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 6,
      concepts: ['tableur', 'resolution-approchee'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 5),
        'Réflexion : écrire sur papier la formule de B2, parenthèses du dénominateur comprises.',
        'Erreurs à chercher : EXP(0,5*A2) sans le signe moins ; les parenthèses du dénominateur oubliées.',
        'Papier : formule écrite sur la copie, puis les valeurs à la calculatrice en mode table.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: PLAN_DU_BALAYAGE,
        questions: [
          moteur.questionDeFeuille(
            PLAN_DU_BALAYAGE,
            ATTENDUS_DU_BALAYAGE,
            'resolution-approchee',
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter la feuille d’un poste volontaire : N passe 2 500 entre les lignes de 9,9 et de 10.',
        'Transition : jalon 3.',
      ],
    },
    [
      [
        'B2 à B12',
        `${FORMULE_DU_BALAYAGE}, recopiée : N(t) croît ligne après ligne et franchit 2 500 entre 9,9 et 10. Sans le signe moins, les valeurs s’effondrent au lieu de monter.`,
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B2-08-A4-09-JALON',
      titre: 'Jalon 3 : les solutions approchées',
      concepts: ['resolution-approchee'],
    },
    {
      id: 'b2-08-a4-jalon',
      invite:
        'Je sais justifier qu’une équation f(x) = k a une seule solution et l’encadrer par balayage ou dichotomie.',
    },
    'Si plus de 30 % « Perdu » : reprendre l’exemple guidé couper en deux.',
  ),
];

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  [VALEUR_POUR_PENTE]: 'B2-08-A1-02-ENFANT-PENTE',
  [SANS_K]: 'B2-08-A1-04-ENFANT-BOULE',
  [SIGNE_DE_K]: 'B2-08-A1-04-ENFANT-BOULE',
  [SANS_CHANGEMENT_DE_SIGNE]: 'B2-08-A1-07-ENFANT-SOMMET',
  [ABSCISSE_POUR_EXTREMUM]: 'B2-08-A1-07-ENFANT-SOMMET',
  [PRODUIT_TERME_A_TERME]: 'B2-08-A2-04-COURS-PRODUIT-QUOTIENT',
  [QUOTIENT_INVERSE]: 'B2-08-A2-04-COURS-PRODUIT-QUOTIENT',
  [QUOTIENT_SANS_CARRE]: 'B2-08-A2-04-COURS-PRODUIT-QUOTIENT',
  [SANS_U_PRIME]: 'B2-08-A2-09-COURS-EXP-LN',
  [MOYEN_POUR_MARGINAL]: 'B2-08-A3-04-COURS-COUTS',
  [RECETTE_SANS_PRIX]: 'B2-08-A3-09-COURS-MARCHE',
  [SEUIL_PAR_DIVISION]: 'B2-08-A3-09-COURS-MARCHE',
  [SANS_VARIATIONS]: 'B2-08-A4-05-COURS-SOLUTIONS',
  [MAL_ENCADRE]: 'B2-08-A4-05-COURS-SOLUTIONS',
  [MAUVAISE_MOITIE]: 'B2-08-A4-05-COURS-SOLUTIONS',
};

const ILLUSTRATIONS_DU_B2_07 = [
  ['M1', 'velo-sur-la-colline.webp', 'La pente sous le vélo'],
  ['M2', 'exposant-qui-saute.webp', 'La recette des puissances'],
  ['M3', 'boule-de-neige.webp', 'La boule de neige'],
  ['M4', 'panneaux-de-la-route.webp', 'Le panneau de la route'],
  ['M5', 'sommet-de-la-colline.webp', 'Le sommet de la colline'],
] as const;

const ILLUSTRATIONS_DU_B2_08 = [
  ['M6', 'potager-qui-s-agrandit.webp', 'Le potager qui s’agrandit'],
  ['M7', 'deux-engrenages.webp', 'Les deux engrenages'],
  ['M8', 'nombre-secret.webp', 'Le nombre secret'],
] as const;

export const COURS_B2_08 = moteur.coursB2(
  [ACTE_1, ACTE_2, ACTE_3, ACTE_4, ACTE_5],
  REMEDIATIONS,
  [
    ...moteur.mediasDesIllustrations(IMAGES_DU_B2_07, ILLUSTRATIONS_DU_B2_07),
    ...moteur.mediasDesIllustrations(
      IMAGES_DU_B2_08,
      ILLUSTRATIONS_DU_B2_08,
      GRAVURE_DE_L_ACCROCHE,
    ),
  ],
  {
    slug: 'b2-08-derivees-composees-fonctions-economiques',
    titre: 'Dérivées composées et fonctions économiques',
    gabarit: 'v3',
    concepts: [...CONCEPTS_DU_COURS],
  },
);
