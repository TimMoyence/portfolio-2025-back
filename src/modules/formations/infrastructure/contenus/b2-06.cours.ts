import type { ContenuDeCours } from '../../domain/cours/CoursStocke';
import { ACTE_4 } from './b2-06.acte-4';
import {
  AJUSTEMENT_DE_Y,
  ATTENDUS_DES_OBJECTIFS,
  ATTENDUS_DES_VENTES,
  AUTRES_LOGARITHMES,
  CONCEPTS_DU_COURS,
  DEMANDES,
  DONNEES_FICTIVES,
  FORMULE_DE_L_EXPOSANT,
  FORMULE_DES_VENTES,
  FORMULE_DU_MOIS_EXACT,
  FORMULE_DU_TAUX_MENSUEL,
  INTERETS_SIMPLES,
  K_POUR_TAUX,
  LN_EN_PRODUIT,
  LUE_COMME_PRODUIT,
  NON_FIGEE,
  ORDONNEE_NON_EXPONENTIEE,
  PLAN_DES_OBJECTIFS,
  PLAN_DES_VENTES,
  PREMIER_LOGARITHME,
  PRIX_DE_GROS,
  RENVOI_AU_DOSSIER,
  SENS_INCHANGE,
  SERIES_INVERSEES,
  SEUIL_MAL_ARRONDI,
  SEUIL_PAR_DIVISION,
  SIGNE_DE_K,
  TAUX_POUR_COEFFICIENT,
  TOUCHE_LOG,
} from './b2-06.donnees';
import * as moteur from './briques';

const ACTE_1: moteur.Acte = [
  {
    screenId: 'B2-06-A1-01-RAPPEL-PLACEMENT',
    titre: 'Rappel du B2-05 : un capital placé à 3 %',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 3,
    concepts: ['interets-composes'],
    notes: moteur.puces(
      'Avant de lancer : vérifier au pupitre que tous les postes ont rejoint la séance.',
      'Annoncer « seule la participation compte ». Chacun répond sans calculatrice.',
      'Piège : prendre le taux (0,03) pour le coefficient ; tout l’acte 1 prolonge ces puissances.',
      'Papier : la question est en tête du livret ; vote à main levée.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-06-a1-rappel-placement',
          'interets-composes',
          true,
          'Rappel du B2-05. 1 000 € sont placés à 3 % par an, à intérêts composés. Que valent-ils au bout de n années ?',
          '1 000 × 1,03ⁿ',
          [
            ['1 000 × 0,03ⁿ', TAUX_POUR_COEFFICIENT],
            ['1 000 × (1 + 0,03 × n)', INTERETS_SIMPLES],
          ],
        ),
      ],
      delaiMs: 0,
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-06-A1-02-ACCROCHE',
      titre: 'Exponentielle et logarithme : croître, viser, ajuster',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: [
        'fonction-exponentielle',
        'logarithme-neperien',
        'ajustement-exponentiel',
      ],
      notes: moteur.puces(
        'Rappeler en une phrase le B2-05 : le financement du second atelier est bouclé ; Hélène lance maintenant une nouvelle gamme.',
        'Annoncer le plan : un rappel rapide du B2-02, du B2-04 et du B2-05, puis trois notions, chacune en trois temps (réfléchir, comprendre, s’exercer), et une mini-situation CCF.',
        'Annoncer les deux pauses de 15 minutes, après l’acte 1 et après l’acte 3.',
      ),
    },
    'hero',
    {
      title: 'Exponentielle et logarithme : croître, viser, ajuster',
      subtitle:
        'Atelier Rivage, voilerie de La Rochelle, lance la gamme Sillage : des sacs en toile de voile recyclée. Les ventes croissent, l’atelier a une capacité, les boutiques réagissent au prix : trois questions, trois outils.',
      bullets: [
        'BTS Comptabilité et gestion · 2e année · sixième cours de mathématiques',
        'Un rappel rapide du B2-02, du B2-04 et du B2-05, réinvestis aujourd’hui',
        'Trois notions : fonction exponentielle, logarithme népérien, modèles exponentiels',
        'Une mini-situation CCF et sa question tableur',
      ],
    },
  ),
  {
    screenId: 'B2-06-A1-03-VOTE-ACQUIS',
    titre: 'Vote : deux rappels, B2-04 et B2-02',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 4,
    concepts: ['suite-geometrique', 'ajustement-affine'],
    notes: moteur.puces(
      'Rappel rapide : deux votes non notés, un par cours.',
      'Dire où chaque acquis resservira : la raison devient le coefficient e^k, PENTE ajuste z = ln y.',
      ...moteur.NOTES_DU_VOTE_A_DEUX_QUESTIONS,
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-06-a1-rappel-suite',
          'suite-geometrique',
          false,
          'Rappel du B2-04. Une suite géométrique a pour premier terme 100 et pour raison 0,9. Comment évoluent ses termes ?',
          'Ils baissent de 10 % à chaque rang',
          [['Ils baissent de 0,9 à chaque rang', 'nature-de-suite-confondue']],
        ),
        moteur.vote(
          'b2-06-a1-rappel-pente',
          'ajustement-affine',
          false,
          'Rappel du B2-02. Les x sont en A2:A7, les y en B2:B7. Quelle formule donne la pente de la droite d’ajustement de y en x ?',
          '=PENTE(B2:B7;A2:A7)',
          [['=PENTE(A2:A7;B2:B7)', SERIES_INVERSEES]],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Deux acquis qui resservent aujourd’hui',
        lignes: [
          'Raison 0,9 : chaque terme est multiplié par 0,9, il perd 10 % ; retirer 0,9 serait une suite arithmétique.',
          'PENTE prend d’abord les y, ensuite les x ; dans l’autre ordre, on obtient la droite de x en y.',
          'L’écran suivant dit ce que ces acquis deviennent aujourd’hui.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-06-A1-04-ACQUIS',
      titre: 'Ce que vous savez déjà',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['suite-geometrique', 'interets-composes', 'ajustement-affine'],
      notes: moteur.puces(
        '2 min : lire la dernière ligne de chaque colonne, c’est le fil du cours.',
        'Question : « Lequel de ces acquis devient une fonction aujourd’hui ? » La puissance qⁿ, prolongée à tout x.',
        'Ne pas refaire les cours : renvoyer aux fiches mémo du classeur de CCF.',
      ),
    },
    'comparison',
    {
      title: 'Ce que vous savez déjà',
      subtitle: 'Trois acquis qui servent à croître, viser et ajuster.',
      columns: [
        {
          label: 'B2-04 · Suites',
          tone: 'info',
          items: [
            'Géométrique : uₙ = u₀ × qⁿ.',
            'Seuil : tâtonner rang par rang.',
            'Aujourd’hui : e^(kx) et le seuil par ln.',
          ],
        },
        {
          label: 'B2-05 · Placer',
          tone: 'success',
          items: [
            'Cₙ = C₀ × (1 + t)ⁿ.',
            'Coefficient 1 + t, taux t.',
            'Aujourd’hui : le taux e^k − 1.',
          ],
        },
        {
          label: 'B2-02 · Ajustement',
          tone: 'warning',
          items: [
            'Droite des moindres carrés.',
            'PENTE et ORDONNEE.ORIGINE.',
            'Aujourd’hui : ajuster z = ln y.',
          ],
        },
      ],
      note: 'Les fiches mémo du B2-02, du B2-04 et du B2-05 sont dans votre classeur de CCF.',
    },
  ),
  moteur.ecranV2(
    {
      screenId: RENVOI_AU_DOSSIER,
      titre: 'Le dossier de la gamme Sillage',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: [
        'fonction-exponentielle',
        'resolution-par-logarithme',
        'ajustement-exponentiel',
      ],
      notes: moteur.puces(
        '1 min de lecture silencieuse ; ne rien calculer.',
        'Faire dire les trois questions d’Hélène : croître, viser, ajuster.',
        'Relier aux notions du jour : une question du dossier par notion.',
      ),
    },
    'table',
    {
      title: 'Le dossier de la gamme Sillage',
      subtitle:
        'Ce que sait Hélène Garnier sur la nouvelle gamme, avant de fixer son plan de production.',
      columns: [...moteur.COLONNES_DU_DOSSIER],
      rows: [
        {
          rubrique: 'Le projet',
          contenu:
            'La gamme Sillage : des sacs cousus dans de la toile de voile recyclée, lancés en janvier 2026. Hélène Garnier, la dirigeante, prépare le plan de production.',
        },
        {
          rubrique: 'Les ventes en ligne',
          contenu:
            'Modèle retenu par l’expert-comptable : V(x) = 400e^(0,06x) sacs par mois, x en mois depuis janvier 2026 (x = 0 en janvier).',
        },
        {
          rubrique: 'La capacité de l’atelier',
          contenu:
            'Avec l’équipe actuelle, l’atelier coud au plus 1 000 sacs par mois.',
        },
        {
          rubrique: 'L’étude de prix',
          contenu:
            'Six prix de gros testés auprès des boutiques nautiques, de 20 € à 45 € le sac, et la demande mensuelle relevée pour chacun.',
        },
        {
          rubrique: 'Les questions d’Hélène',
          contenu:
            'À quel rythme croissent les ventes en ligne ? Quand dépasseront-elles la capacité de l’atelier ? Quel modèle décrit la demande des boutiques selon le prix ?',
        },
      ],
      note: DONNEES_FICTIVES,
    },
  ),
  {
    screenId: 'B2-06-A1-06-MISSION',
    titre: 'Votre mission : chiffrer la gamme Sillage',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 6,
    concepts: [
      'fonction-exponentielle',
      'resolution-par-logarithme',
      'ajustement-exponentiel',
    ],
    notes: moteur.puces(
      'Lecture à voix haute du courriel (1 min), puis 4 min d’écriture individuelle et 1 min de mise en commun au pupitre.',
      'Question 1 : faire dire que les ventes gagnent de plus en plus de sacs chaque mois ; elles sont multipliées, pas augmentées d’un nombre fixe.',
      'Question 2 : faire émerger qu’il faudrait « défaire » l’exponentielle ; c’est l’acte 2.',
      'Question 3 : faire dire que la demande baisse de moins en moins vite ; c’est l’acte 3.',
      'Papier : trois lignes d’écriture dans le livret.',
    ),
    proprietes: {
      metier:
        'Assistant·e de gestion — Atelier Rivage (voilerie artisanale, 14 salariés, La Rochelle)',
      situation:
        'Lundi, 9 h. Hélène Garnier écrit : « La gamme Sillage démarre bien : 400 sacs vendus en ligne en janvier, et l’expert-comptable modélise nos ventes par 400e^(0,06x). Pouvez-vous me dire à quel rythme elles croissent, quand elles dépasseront les 1 000 sacs que l’atelier sait coudre par mois, et quel prix de gros proposer aux boutiques ? » Marc Lefèvre, l’expert-comptable, ajoute : « Attention : 0,06 n’est pas le taux mensuel, et vérifiez le modèle de la demande des boutiques. »',
      geste:
        'Sans calculatrice, répondez aux trois questions à partir du dossier.',
      consequence:
        'Un seuil mal calculé, et l’atelier sature avant d’avoir recruté ; un prix mal choisi, et les boutiques n’achètent pas.',
      questionsLibres: [
        {
          id: 'b2-06-a1-mission:croissance',
          question:
            'Les ventes en ligne gagnent-elles le même nombre de sacs chaque mois ? Pourquoi ?',
          placeholder: 'Oui / Non, parce que chaque mois…',
        },
        {
          id: 'b2-06-a1-mission:seuil',
          question:
            'Comment trouver le mois des 1 000 sacs sans essayer les mois un par un ?',
          placeholder: 'Il faudrait une opération qui…',
        },
        {
          id: 'b2-06-a1-mission:prix',
          question:
            'Une droite suffit-elle à décrire la baisse de la demande quand le prix de gros monte ?',
          placeholder: 'Oui / Non, parce que la demande…',
        },
      ],
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-06-A1-07-COURS-EXPONENTIELLE',
      titre: 'Cours : de qⁿ à la fonction exponentielle',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['fonction-exponentielle', 'suite-geometrique'],
      notes: moteur.puces(
        '3 min ; la trace écrite est imprimée dans le livret : on lit et on commente, on ne recopie pas.',
        'Avant l’exemple, demander : « Une suite géométrique a-t-elle une valeur au rang 2,5 ? » Non : la fonction exponentielle comble les trous.',
        'Relier au B2-04 et au B2-05 : qⁿ et (1 + t)ⁿ multiplient, ils n’ajoutent pas.',
        'Faire trouver la touche eˣ sur les calculatrices de la salle.',
      ),
    },
    'lesson',
    {
      title: 'La fonction exponentielle : des puissances pour tous les nombres',
      subtitle: 'Trace écrite · notion 1 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Prolonger qⁿ à tout nombre x',
          text: 'Une suite géométrique u₀ × qⁿ ne prend de valeurs qu’aux rangs entiers. La fonction exponentielle prolonge ces puissances à tout nombre réel x : on note eˣ, où e ≈ 2,718 est un nombre fixe, comme π. Comme les intérêts composés du B2-05, elle multiplie : des intérêts simples ajouteraient. Elle permet de calculer les ventes de la gamme Sillage à tout instant, pas seulement mois par mois.',
          formula:
            'e⁰ = 1 · eˣ > 0 pour tout x · e^(a + b) = e^a × e^b · x ↦ eˣ est croissante',
        },
        {
          kind: 'example',
          title: 'Pour débuter : quatre valeurs à la calculatrice',
          text: 'Touche eˣ, souvent en seconde fonction de la touche ln.',
          steps: [
            'e¹ ≈ 2,718 : c’est le nombre e.',
            'e^0,5 ≈ 1,649 : entre e⁰ = 1 et e¹.',
            'e^(−1) ≈ 0,368, soit 1 ÷ e : une exponentielle n’est jamais négative.',
            'e² ≈ 7,389, soit e × e : e^(a + b) = e^a × e^b.',
          ],
        },
        {
          kind: 'method',
          title: 'Calculer une valeur d’exponentielle',
          text: 'Pièges : lire e^(kx) comme e × k × x ; ajouter au lieu de multiplier, comme une suite arithmétique ; calculer « en intérêts simples ».',
          steps: [
            'Calculer d’abord l’exposant k × x.',
            'Appliquer la touche eˣ à tout l’exposant, entre parenthèses.',
            'Multiplier par a en dernier, puis arrondir.',
          ],
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-06-A1-08-COURS-MODELE-EXP',
      titre: 'Cours : les modèles a e^(kx) et le tableur',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: [
        'fonction-exponentielle',
        'coefficient-multiplicateur',
        'tableur',
      ],
      notes: moteur.puces(
        '3 min, enchaînées sur la page 1 : 6 min pour les deux pages.',
        'Faire comparer k = 0,02 et le taux 2,02 % : proches, mais pas égaux ; l’écart grandit avec k.',
        'Faire taper la formule sans $ sur un poste volontaire, puis la recopier : la colonne devient fausse, l’erreur fixe la règle.',
      ),
    },
    'lesson',
    {
      title: 'Les modèles a e^(kx) : valeur de départ, coefficient, taux',
      subtitle: 'Trace écrite · notion 1 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Lire a et k avant de calculer',
          text: 'Un modèle f(x) = a e^(kx) décrit une grandeur multipliée par le même nombre e^k à chaque unité de x. a est la valeur en 0. Le taux d’évolution par unité est e^k − 1, pas k : les deux sont proches quand k est petit, mais différents. Si k > 0, la fonction croît ; si k < 0, elle décroît.',
          formula:
            'f(0) = a · coefficient par unité : e^k · taux par unité : e^k − 1 · k > 0 croissante, k < 0 décroissante',
        },
        {
          kind: 'example',
          title: 'Pour débuter : f(x) = 1 000e^(0,02x)',
          text: 'a = 1 000 et k = 0,02.',
          steps: [
            'f(0) = 1 000 × e⁰ = 1 000.',
            'Coefficient : e^0,02 ≈ 1,0202 ; taux ≈ 2,02 % par unité, pas 2 %.',
            'g(x) = 1 000e^(−0,02x) décroît : coefficient e^(−0,02) ≈ 0,9802, soit −1,98 % par unité.',
          ],
        },
        {
          kind: 'method',
          title: 'Au tableur : EXP et des paramètres figés',
          text: 'EXP(nombre) calcule e à la puissance nombre. a et k sont rangés dans deux cellules, figées par des $, pour recopier la formule vers le bas. Au CCF : lire a et k dans l’énoncé avant d’écrire la formule.',
          steps: [
            'x en A2 ; a en H1 ; k en H2.',
            'En B2 : =$H$1*EXP($H$2*A2), puis recopier vers le bas.',
            'Taux d’une ligne à la suivante : =B3/B2-1.',
            'Sans les $, la recopie décale H1 et H2 : les valeurs deviennent fausses.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-06-A1-09-EXEMPLE-ABONNES',
      titre: 'Exemple guidé : 200 abonnés et e^(0,05x)',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['fonction-exponentielle'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape, puis la correction se dévoile étape par étape sur ce même écran.',
        'Papier : réponses sous chaque étape du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-06-a1-exemple-abonnes',
          enonce:
            'La lettre d’information de la gamme Sillage compte 200 abonnés à son lancement. Au bout de x semaines, le nombre d’abonnés est modélisé par A(x) = 200e^(0,05x).',
          etapes: [
            {
              id: 'depart',
              intitule: 'La valeur de départ',
              raisonnement:
                'A(0) = 200 × e⁰ = 200 × 1 = 200 : a est la valeur en 0.',
              invite: 'Que vaut A(0) ?',
            },
            {
              id: 'dix-semaines',
              intitule: 'Au bout de dix semaines',
              raisonnement:
                'A(10) = 200 × e^0,5 ≈ 200 × 1,6487 ≈ 329,74, soit environ 330 abonnés.',
              invite: 'Calculez A(10) à la calculatrice.',
            },
            {
              id: 'coefficient',
              intitule: 'Le coefficient et le taux',
              raisonnement:
                'Chaque semaine, A est multiplié par e^0,05 ≈ 1,0513 : le taux hebdomadaire est d’environ 5,13 %, pas 5 %.',
              invite:
                'Par quel nombre A est-il multiplié chaque semaine ? Quel est le taux ?',
            },
            {
              id: 'decroissant',
              intitule: 'Un modèle décroissant',
              raisonnement:
                'D(x) = 200e^(−0,05x) : k < 0, la fonction décroît ; D(10) = 200 × e^(−0,5) ≈ 121,31.',
              invite:
                'Une autre liste perd ses abonnés selon D(x) = 200e^(−0,05x). Croît-elle ? Que vaut D(10) ?',
            },
            {
              id: 'tableur',
              intitule: 'Au tableur',
              raisonnement:
                'Semaine en A2 : =200*EXP(0,05*A2). Mieux : a et k dans deux cellules figées, pour changer d’hypothèse sans réécrire la formule.',
              invite:
                'Quelle formule de tableur donne A(x), la semaine étant en A2 ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur l’écart entre k = 0,05 et le taux 5,13 % (étape 3) et sur le signe de k (étape 4).',
        'Transition : « À vous, sur les ventes en ligne de la gamme Sillage : exercice 1. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-06-A1-10-ATELIER-VENTES',
      titre: 'Exercice 1 — Les ventes en ligne',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['fonction-exponentielle'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 6 min',
        'Réflexion : écrire a et k du modèle, puis l’exposant à calculer, avant la calculatrice.',
        'Pièges : e × k × x ; 1,06⁵ au lieu de e^0,3 ; k pris pour le taux ; une exponentielle qui croîtrait toujours.',
        'Papier : exercice 1 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        intitule: 'Exercice 1 — Les ventes en ligne',
        consigne:
          'Ventes en ligne : V(x) = 400e^(0,06x) sacs par mois, x en mois depuis janvier 2026 (x = 0 en janvier).',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-06-a1-calcul',
            'fonction-exponentielle',
            true,
            'Quel calcul donne les ventes de juin 2026, V(5) ?',
            '400 × e^(0,06 × 5), soit 400 × e^0,3',
            [
              ['400 × e × 0,06 × 5', LUE_COMME_PRODUIT],
              ['400 × 1,06⁵', K_POUR_TAUX],
            ],
          ),
          moteur.numerique(
            'b2-06-a1-ventes',
            'fonction-exponentielle',
            'Combien de sacs le modèle prévoit-il en juin 2026 ? Arrondir à l’unité.',
            'sacs',
            540,
            { type: 'absolue', valeur: 0.5 },
            '540 sacs',
            [
              [535, K_POUR_TAUX],
              [326, LUE_COMME_PRODUIT],
            ],
          ),
          moteur.vote(
            'b2-06-a1-sens',
            'fonction-exponentielle',
            true,
            'Les ventes en boutique d’un ancien modèle de sac suivent B(x) = 900e^(−0,04x). Comment évoluent-elles ?',
            'Elles baissent chaque mois, car k = −0,04 est négatif',
            [
              [
                'Elles augmentent : une exponentielle croît toujours',
                SIGNE_DE_K,
              ],
            ],
          ),
          moteur.numerique(
            'b2-06-a1-taux',
            'fonction-exponentielle',
            'Quel est le taux d’évolution mensuel des ventes en ligne, en % ? Arrondir au centième.',
            '%',
            6.18,
            moteur.DEUX_DECIMALES,
            '6,18 %',
            [
              [6, K_POUR_TAUX],
              [106.18, TAUX_POUR_COEFFICIENT],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger question par question, en commençant par la moins réussie (score sous chaque correction).',
        'Transition : « Faisons calculer tous les mois par le tableur : exercice 2. »',
      ],
    },
    [
      [
        'b2-06-a1-calcul',
        'On calcule l’exposant 0,06 × 5 = 0,3, puis e^0,3, puis on multiplie par 400. 400 × e × 0,06 × 5 lit l’exponentielle comme un produit ; 400 × 1,06⁵ prend k pour le taux.',
      ],
      [
        'b2-06-a1-ventes',
        '400 × e^0,3 ≈ 539,94, soit environ 540 sacs en juin 2026. Avec 1,06⁵, on trouverait 535 sacs ; avec e × 0,3, 326 sacs.',
      ],
      [
        'b2-06-a1-sens',
        'k = −0,04 < 0 : chaque mois, les ventes sont multipliées par e^(−0,04) ≈ 0,961, une baisse d’environ 3,9 %. Une exponentielle ne croît que si k est positif.',
      ],
      [
        'b2-06-a1-taux',
        'Coefficient mensuel : e^0,06 ≈ 1,0618 ; taux : e^0,06 − 1 ≈ 6,18 %, et non 6 %. 106,18 % est le coefficient écrit en pourcentage.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-06-A1-11-TABLEUR-VENTES',
      titre: 'Exercice 2 — Les ventes au tableur',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 6,
      concepts: ['tableur', 'fonction-exponentielle'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 5 min',
        'Réflexion : écrire sur papier la formule de B2, puis ce qu’elle devient en B3 une fois recopiée.',
        'Erreurs à chercher : EXP(1)*k*x ; PUISSANCE(1+k;x) ; E1 sans $ : la colonne tombe à 0 ; G1 sans $ ou A2 figé à tort : elle reste à 400 ; =B3/B2 pour le taux.',
        'Papier : formules écrites sur la copie, puis les valeurs à la calculatrice.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: PLAN_DES_VENTES,
        questions: [
          {
            type: 'feuille',
            id: PLAN_DES_VENTES.id,
            concept: 'tableur',
            noteCompte: true,
            corrige: {
              type: 'feuille',
              plan: PLAN_DES_VENTES,
              attendus: ATTENDUS_DES_VENTES,
              seuilReussite: 0.8,
            },
          },
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter la feuille d’un poste volontaire, relire la formule de B2 et montrer les $ qui la font recopier.',
        'Transition : jalon 1, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'B2 à B8',
        `${FORMULE_DES_VENTES}, recopiée : 400 sacs en janvier, puis 424,73 ; 451,00 ; 478,89 ; 508,50 ; 539,94 et 573,33. Sans $ sur E1, la recopie lit E2, vide, et affiche 0 ; sans $ sur G1, ou avec A2 figé à tort, elle reste à 400.`,
      ],
      [
        'C3 à C8',
        `${FORMULE_DU_TAUX_MENSUEL}, recopiée : environ 6,18 % chaque mois, le même taux sur toute la colonne. =B3/B2 donne le coefficient, environ 1,0618, pas le taux.`,
      ],
    ],
  ),
  {
    screenId: 'B2-06-A1-12-JALON',
    titre: 'Jalon 1 : fonction exponentielle',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['fonction-exponentielle'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : reprendre la trace écrite A1-08 sur le taux e^k − 1 après la pause.',
      'Pause de 15 minutes, hors durée programmée.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-06-a1-jalon',
        invite:
          'Je sais calculer une valeur de a e^(kx), en donner le taux par unité et l’écrire au tableur.',
      },
    },
  },
];

const ACTE_2: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-06-A2-01-REFLEXION-RECIPROQUE',
      titre: 'Réfléchir : remonter de 1 000 sacs au mois',
      diffusion: 'seance',
      dureeMinutes: 5,
      concepts: ['logarithme-neperien', 'resolution-par-logarithme'],
      notes: moteur.puces(
        'Temps « réfléchir » de la notion 2 : 3 min d’écriture individuelle, puis lire trois réponses au pupitre.',
        'Ne rien trancher : la trace écrite suivante répond.',
        'Relance : « Pour défaire × 5, on divise. Pour défaire une puissance de e, on fait quoi ? »',
        'Papier : cadre de réponse du livret.',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b2-06-a2-reflexion-reciproque',
        type: 'reflection',
        question:
          'Un stagiaire cherche quand les ventes en ligne atteindront 1 000 sacs : il calcule V(1), V(2), V(3)… jusqu’à dépasser 1 000. Pour retrouver x dans 5 × x = 20, on divise. Sans calculatrice : quelle opération faudrait-il pour retrouver x dans eˣ = 2,5 ?',
        placeholder: 'Il faudrait une opération qui…',
        competency: 'Raisonner · défaire une fonction',
      },
    },
    {
      correction: {
        expected:
          'Il faut une fonction qui « remonte » de eˣ à x, comme la division remonte d’un produit : c’est le logarithme népérien, noté ln. On trouve x = ln 2,5 sans essayer les mois un par un.',
        nextAction:
          'Gardez votre réponse : la trace écrite définit ln et ses propriétés.',
      },
      renvoi: RENVOI_AU_DOSSIER,
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-06-A2-02-COURS-LOGARITHME',
      titre: 'Cours : le logarithme népérien',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['logarithme-neperien'],
      notes: moteur.puces(
        '3 min ; garder la réflexion précédente sous les yeux.',
        'Faire vérifier e^(ln 5) = 5 à la calculatrice : ln défait l’exponentielle.',
        'Faire taper log 5 puis ln 5 : deux touches, deux résultats ; seule ln sert aujourd’hui.',
      ),
    },
    'lesson',
    {
      title: 'Le logarithme népérien : défaire l’exponentielle',
      subtitle: 'Trace écrite · notion 2 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'ln remonte de l’exponentielle à l’exposant',
          text: 'Pour un nombre y strictement positif, ln y est le nombre x tel que eˣ = y. ln défait l’exponentielle, comme la division défait la multiplication : ln(eˣ) = x et e^(ln y) = y. C’est lui qui donnera le mois où les ventes de la gamme Sillage atteindront 1 000 sacs.',
          formula:
            'eˣ = y ⇔ x = ln y, pour y > 0 · ln 1 = 0 · ln e = 1 · ln(a × b) = ln a + ln b · ln(aⁿ) = n × ln a',
        },
        {
          kind: 'example',
          title: 'Pour débuter : eˣ = 5',
          text: 'On cherche l’exposant qui donne 5.',
          steps: [
            'x = ln 5 ≈ 1,609.',
            'Contrôle : e^1,609 ≈ 5.',
            'ln 8 = ln(2³) = 3 × ln 2 ≈ 2,079.',
            'ln(2 × 4) = ln 2 + ln 4, et non ln 2 × ln 4.',
          ],
        },
        {
          kind: 'method',
          title: 'Utiliser ln sans se tromper de touche',
          text: 'Pièges : prendre la touche log, le logarithme décimal, pour ln : log 5 ≈ 0,699, pas 1,609 ; écrire ln(a × b) = ln a × ln b ; chercher le ln d’un nombre négatif ou nul, qui n’existe pas.',
          steps: [
            'Repérer l’égalité eˣ = y, avec y > 0.',
            'Appliquer ln : x = ln y, touche ln de la calculatrice.',
            'Au tableur : =LN(cellule).',
            'Contrôler en recalculant eˣ.',
          ],
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-06-A2-03-COURS-SEUIL',
      titre: 'Cours : résoudre qⁿ ≥ s avec ln',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['resolution-par-logarithme', 'tableur'],
      notes: moteur.puces(
        '3 min, enchaînées sur la page 1 : 6 min pour les deux pages.',
        'Relier au B2-04 : le seuil se trouvait en tâtonnant ; ln le donne en une ligne.',
        'Question : « ln 0,8 est-il positif ? » Non : diviser par ln 0,8 change le sens.',
      ),
    },
    'lesson',
    {
      title: 'Résoudre qⁿ ≥ s : passer l’exposant devant',
      subtitle: 'Trace écrite · notion 2 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Appliquer ln, puis diviser par ln q',
          text: 'Pour trouver le premier rang n tel que qⁿ ≥ s, on applique ln aux deux membres : ln garde le sens d’une inégalité entre nombres positifs, et ln(qⁿ) = n × ln q. On divise ensuite par ln q : si q > 1, ln q > 0 et le sens reste ; si 0 < q < 1, ln q < 0 et diviser par ln q change le sens de l’inégalité. Fini de tâtonner rang par rang, comme au B2-04.',
          formula:
            'q > 1 : qⁿ ≥ s ⇔ n ≥ ln s ÷ ln q · 0 < q < 1 : qⁿ ≤ s ⇔ n ≥ ln s ÷ ln q',
        },
        {
          kind: 'example',
          title: 'Pour débuter : 1,5ⁿ ≥ 10',
          text: 'On cherche le premier entier n.',
          steps: [
            'n × ln 1,5 ≥ ln 10.',
            'ln 1,5 > 0 : n ≥ ln 10 ÷ ln 1,5 ≈ 5,68.',
            'Premier entier : n = 6. Contrôle : 1,5⁵ ≈ 7,59 < 10 et 1,5⁶ ≈ 11,39 ≥ 10.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : même méthode pour a e^(kx) ≥ s',
          text: 'a e^(kx) ≥ s ⇔ e^(kx) ≥ s ÷ a ⇔ kx ≥ ln(s ÷ a), puis on divise par k, en changeant le sens si k < 0. Pièges : diviser s par q au lieu de passer par ln ; garder le sens en divisant par un nombre négatif ; arrondir le seuil à l’entier inférieur.',
          steps: [
            'Isoler la puissance ou l’exponentielle.',
            'Appliquer ln, puis diviser par ln q ou par k, en surveillant le signe.',
            'Premier entier : arrondir au-dessus, puis contrôler les deux rangs voisins.',
            'Au tableur : =LN(B1/$H$1)/$H$2 donne la valeur exacte de x.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-06-A2-04-EXEMPLE-DOUBLEMENT',
      titre: 'Exemple guidé : doubler, puis perdre la moitié',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['resolution-par-logarithme', 'interets-composes'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape, puis la correction se dévoile étape par étape sur ce même écran.',
        'Papier : réponses sous chaque étape du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-06-a2-exemple-doublement',
          enonce:
            'Hélène relit le B2-05 : la trésorerie est placée à 2,5 % par an. En combien d’années aura-t-elle doublé ? Puis : une surjeteuse de 6 000 € perd 20 % de sa valeur chaque année ; quand vaudra-t-elle moins de la moitié de son prix ?',
          etapes: [
            {
              id: 'inequation',
              intitule: 'L’inéquation',
              raisonnement: 'Doubler, c’est être multiplié par 2 : 1,025ⁿ ≥ 2.',
              invite: 'Quelle inéquation traduit le doublement ?',
            },
            {
              id: 'logarithme',
              intitule: 'Appliquer ln',
              raisonnement:
                'n × ln 1,025 ≥ ln 2, et ln 1,025 > 0 : n ≥ ln 2 ÷ ln 1,025 ≈ 28,07.',
              invite: 'Appliquez ln, puis isolez n.',
            },
            {
              id: 'entier',
              intitule: 'Le premier entier',
              raisonnement:
                'Au bout de 29 ans. Contrôle : 1,025²⁸ ≈ 1,996 < 2 et 1,025²⁹ ≈ 2,046.',
              invite: 'Quel est le premier nombre entier d’années ?',
            },
            {
              id: 'moitie',
              intitule: 'La surjeteuse',
              raisonnement:
                '0,8ⁿ < 0,5 ⇔ n × ln 0,8 < ln 0,5 ; ln 0,8 < 0, le sens change : n > ln 0,5 ÷ ln 0,8 ≈ 3,11.',
              invite:
                'Perdre 20 % par an, c’est multiplier par 0,8. Résolvez 0,8ⁿ < 0,5.',
            },
            {
              id: 'conclusion',
              intitule: 'La conclusion',
              raisonnement:
                'Au bout de 4 ans. Garder le sens donnerait n < 3,11 : absurde, la machine perd de la valeur avec le temps.',
              invite: 'Au bout de combien d’années entières ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur le premier entier (étape 3) et sur le sens qui change (étape 4).',
        'Transition : « À vous, sur la capacité de l’atelier : exercice 3. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-06-A2-05-ATELIER-SEUILS',
      titre: 'Exercice 3 — La capacité de l’atelier',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 9,
      concepts: ['resolution-par-logarithme', 'logarithme-neperien'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 7 min',
        'Réflexion : pour chaque question, écrire l’inéquation, puis le signe du nombre par lequel on divisera.',
        'Pièges : diviser au lieu de passer par ln ; garder le sens avec ln 0,8 ; arrondir le seuil en dessous.',
        'Papier : exercice 3 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        intitule: 'Exercice 3 — La capacité de l’atelier',
        consigne:
          'V(x) = 400e^(0,06x) sacs par mois, x en mois depuis janvier 2026 ; capacité : 1 000 sacs par mois. Machine à coudre de 18 000 €, −20 % par an.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-06-a2-equivalence',
            'resolution-par-logarithme',
            true,
            'Doubler à +6 % par an : 1,06ⁿ ≥ 2. Quelle inégalité obtient-on ?',
            'n ≥ ln 2 ÷ ln 1,06',
            [
              ['n ≥ 2 ÷ 1,06', SEUIL_PAR_DIVISION],
              ['n ≥ ln(2 ÷ 1,06)', LN_EN_PRODUIT],
            ],
          ),
          moteur.numerique(
            'b2-06-a2-capacite',
            'resolution-par-logarithme',
            'À partir de quel mois x entier les ventes dépassent-elles la capacité ?',
            null,
            16,
            { type: 'absolue', valeur: 0 },
            '16 mois',
            [
              [15, SEUIL_MAL_ARRONDI],
              [42, SEUIL_PAR_DIVISION],
            ],
          ),
          moteur.vote(
            'b2-06-a2-sens',
            'resolution-par-logarithme',
            true,
            'Pour la machine, on résout 0,8ⁿ < 0,4. Quelle inégalité obtient-on ?',
            'n > ln 0,4 ÷ ln 0,8',
            [['n < ln 0,4 ÷ ln 0,8', SENS_INCHANGE]],
          ),
          moteur.numerique(
            'b2-06-a2-machine',
            'resolution-par-logarithme',
            'Après combien d’années entières la machine vaut-elle moins de 40 % de son prix ?',
            'ans',
            5,
            { type: 'absolue', valeur: 0 },
            '5 ans',
            [
              [4, SEUIL_MAL_ARRONDI],
              [1, TAUX_POUR_COEFFICIENT],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger question par question, en commençant par la moins réussie.',
        'Transition : « Et pour d’autres objectifs que 1 000 sacs ? Le tableur : exercice 4. »',
      ],
    },
    [
      [
        'b2-06-a2-equivalence',
        'ln garde le sens : n × ln 1,06 ≥ ln 2, puis on divise par ln 1,06, positif. 2 ÷ 1,06 divise sans passer par ln ; ln(2 ÷ 1,06) n’est pas ln 2 ÷ ln 1,06.',
      ],
      [
        'b2-06-a2-capacite',
        '400e^(0,06x) ≥ 1 000 ⇔ e^(0,06x) ≥ 2,5 ⇔ x ≥ ln 2,5 ÷ 0,06 ≈ 15,27. Premier mois entier : 16, soit mai 2027. 15 arrondit en dessous ; 42 vient de 2,5 ÷ 0,06, sans ln.',
      ],
      [
        'b2-06-a2-sens',
        'ln 0,8 est négatif : diviser par ln 0,8 change le sens de l’inégalité. Garder le sens donnerait n < 4,11 : la machine vaudrait moins de 40 % au début, puis plus ensuite, absurde pour un bien qui perd de la valeur.',
      ],
      [
        'b2-06-a2-machine',
        '0,8ⁿ < 0,4 ⇔ n > ln 0,4 ÷ ln 0,8 ≈ 4,11 : au bout de 5 ans. 4 arrondit en dessous ; 1 vient de 0,2ⁿ, le taux de baisse pris pour le coefficient.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-06-A2-06-TABLEUR-OBJECTIFS',
      titre: 'Exercice 4 — Les objectifs de ventes au tableur',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 8,
      concepts: ['tableur', 'resolution-par-logarithme'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 6 min',
        'Réflexion : écrire en français les deux étapes de la résolution de 400e^(0,06x) = s, puis les formules de B2 et C2.',
        'Erreurs à chercher : =A2/$E$1 sans LN ; =LN(A2)/LN($E$1) ; E1 ou G1 sans $ : la recopie affiche une erreur.',
        'Papier : formules écrites sur la copie, puis les valeurs à la calculatrice.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: PLAN_DES_OBJECTIFS,
        questions: [
          {
            type: 'feuille',
            id: PLAN_DES_OBJECTIFS.id,
            concept: 'tableur',
            noteCompte: true,
            corrige: {
              type: 'feuille',
              plan: PLAN_DES_OBJECTIFS,
              attendus: ATTENDUS_DES_OBJECTIFS,
              seuilReussite: 0.8,
            },
          },
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter la feuille d’un poste volontaire ; comparer la ligne des 1 000 sacs à la réponse de l’exercice 3.',
        'Transition : jalon 2.',
      ],
    },
    [
      [
        'B2 à B7',
        `${FORMULE_DE_L_EXPOSANT}, recopiée : ln(500 ÷ 400) ≈ 0,223 pour 500 sacs. =A2/$E$1 oublie ln ; sans les $, la recopie divise par E2, vide, et la cellule affiche une erreur.`,
      ],
      [
        'C2 à C7',
        `${FORMULE_DU_MOIS_EXACT}, recopiée : environ 3,72 mois pour 500 sacs, 15,27 pour 1 000 sacs, la valeur de l’exercice 3 avant l’arrondi, et 22,03 pour 1 500 sacs. Sans les $, la recopie divise par G2, vide.`,
      ],
    ],
  ),
  {
    screenId: 'B2-06-A2-07-JALON',
    titre: 'Jalon 2 : logarithme et seuils',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['logarithme-neperien', 'resolution-par-logarithme'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : reprendre l’exemple 1,5ⁿ ≥ 10 de la trace écrite A2-03.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-06-a2-jalon',
        invite:
          'Je sais résoudre qⁿ ≥ s et a e^(kx) ≥ s avec ln, et donner le premier entier solution.',
      },
    },
  },
];

const ACTE_3: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-06-A3-01-GRAPHIQUE',
      titre: 'La demande des boutiques selon le prix de gros',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['ajustement-exponentiel'],
      notes: moteur.puces(
        '2 min : faire décrire la courbe avant de lire la légende.',
        'Question : « La demande perd-elle le même nombre de sacs à chaque hausse de 5 € ? » Non : de moins en moins.',
        'Transition : « Quel modèle choisir ? »',
      ),
    },
    'chart',
    {
      title: 'La demande des boutiques selon le prix de gros',
      caption: 'Demande mensuelle de sacs Sillage relevée auprès des boutiques',
      kind: 'line',
      unit: 'sacs',
      labels: PRIX_DE_GROS.map((prix) => `${prix} €`),
      series: [
        {
          label: 'Demande relevée',
          values: [...DEMANDES],
          tone: 'ink',
        },
      ],
      formula:
        'La demande perd-elle le même nombre de sacs à chaque hausse de 5 € ?',
      reading:
        'La demande baisse quand le prix monte : 240 sacs perdus entre 20 € et 25 €, 95 entre 40 € et 45 €.',
      source: `Étude de prix de la gamme Sillage. ${DONNEES_FICTIVES}`,
      description:
        'Six points reliés : 1 100 sacs à 20 €, 860 à 25 €, 670 à 30 €, 520 à 35 €, 410 à 40 € et 315 à 45 €.',
    },
  ),
  {
    screenId: 'B2-06-A3-02-VOTE-MODELE',
    titre: 'Vote : quel modèle pour la demande ?',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 4,
    concepts: ['ajustement-exponentiel', 'logarithme-neperien'],
    notes: moteur.notesDuVoteQuiOuvreLaNotion(3),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-06-a3-vote-modele',
          'ajustement-exponentiel',
          false,
          'Une demande perd à peu près 22 % à chaque hausse de 5 € du prix. Quel modèle choisir ?',
          'Un modèle exponentiel, de la forme a e^(kx)',
          [['Une droite, de la forme mx + p', AJUSTEMENT_DE_Y]],
        ),
        moteur.vote(
          'b2-06-a3-vote-ln',
          'logarithme-neperien',
          false,
          'Si y = a e^(kx), que vaut ln y ?',
          'ln y = ln a + kx',
          [['ln y = ln a × kx', LN_EN_PRODUIT]],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Une même part perdue à chaque pas : l’exponentielle',
        lignes: [
          'Perdre la même part à chaque pas, c’est être multiplié par le même nombre : c’est un modèle exponentiel, pas une droite.',
          'ln change le produit a × e^(kx) en somme ln a + kx : en x, ln y suit une droite.',
          'La trace écrite en tire une méthode d’ajustement.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-06-A3-03-COURS-MODELE',
      titre: 'Cours : reconnaître et utiliser un modèle exponentiel',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['ajustement-exponentiel', 'resolution-par-logarithme'],
      notes: moteur.puces(
        '3 min ; la trace écrite est imprimée dans le livret.',
        'Faire calculer au tableau deux rapports successifs du graphique : 860 ÷ 1 100 et 670 ÷ 860.',
        'Lien au dossier : « La demande des boutiques : modèle affine ou exponentiel ? »',
      ),
    },
    'lesson',
    {
      title: 'Modèle exponentiel : le reconnaître, l’utiliser',
      subtitle: 'Trace écrite · notion 3 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Des rapports constants à pas constant',
          text: 'Quand x avance d’un pas constant, un modèle affine ajoute toujours la même quantité ; un modèle exponentiel multiplie toujours par le même nombre. Si les rapports successifs y₂ ÷ y₁, y₃ ÷ y₂… sont presque égaux, on choisit f(x) = a e^(kx). C’est le cas de la demande des boutiques : elle perd à peu près la même part à chaque hausse de 5 €.',
          formula:
            'Rapports constants ⇒ f(x) = a e^(kx) · f(x) = s ⇔ x = ln(s ÷ a) ÷ k',
        },
        {
          kind: 'example',
          title: 'Pour débuter : f(x) = 500e^(−0,1x)',
          text: 'a = 500 et k = −0,1 : f décroît.',
          steps: [
            'f(10) = 500 × e^(−1) ≈ 183,94.',
            'f(x) = 100 ⇔ e^(−0,1x) = 0,2 ⇔ −0,1x = ln 0,2.',
            'x = ln 0,2 ÷ (−0,1) ≈ 16,09.',
          ],
        },
        {
          kind: 'method',
          title: 'Utiliser un modèle exponentiel',
          text: 'Pièges : ajuster par une droite une série qui baisse de moins en moins vite ; oublier le signe de k ; diviser s par a sans passer par ln.',
          steps: [
            'Calculer les rapports successifs.',
            'Valeur : remplacer x, calculer l’exposant, puis e à cette puissance, puis × a.',
            'Antécédent : isoler l’exponentielle, appliquer ln, diviser par k.',
            'Contrôler en recalculant f(x).',
          ],
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-06-A3-04-COURS-AJUSTEMENT',
      titre: 'Cours : ajuster par z = ln y',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['ajustement-exponentiel', 'ajustement-affine', 'tableur'],
      notes: moteur.puces(
        '3 min, enchaînées sur la page 1 : 6 min pour les deux pages.',
        'Relier au B2-02 : la droite des moindres carrés est la même ; seules les ordonnées changent, z au lieu de y.',
        'Question : « β est-il le coefficient a ? » Non : a = e^β.',
      ),
    },
    'lesson',
    {
      title: 'Ajuster par z = ln y : une droite, puis l’exponentielle',
      subtitle: 'Trace écrite · notion 3 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Le changement de variable z = ln y',
          text: 'Si y = a e^(kx), alors z = ln y vaut kx + ln a : les points (x ; z) sont alignés. On ajuste donc z en x par la méthode des moindres carrés du B2-02, z = αx + β, puis on revient à y en exponentiant : y = e^β × e^(αx). Au CCF, le changement de variable est toujours donné.',
          formula:
            'z = ln y · z = αx + β · y = e^β × e^(αx) : a = e^β et k = α',
        },
        {
          kind: 'method',
          title: 'Au tableur : LN, PENTE, ORDONNEE.ORIGINE, EXP',
          text: 'Pièges : ajuster y au lieu de ln y ; inverser les séries de PENTE ; prendre β pour a sans l’exponentier.',
          steps: [
            'x en B2:B9, y en C2:C9.',
            'z en D2 : =LN(C2), recopiée.',
            'α : =PENTE(D2:D9;B2:B9) ; β : =ORDONNEE.ORIGINE(D2:D9;B2:B9) : les z d’abord, les x ensuite.',
            'a : =EXP(β) ; prévision : a × EXP(α × x).',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : rédiger le retour au modèle',
          text: 'Le sujet donne z = ln y, demande la droite de z en x au tableur ou à la calculatrice, puis le modèle en y. Écrire les arrondis demandés, puis contrôler sur un relevé.',
          steps: [
            'Écrire z = αx + β avec les arrondis.',
            'a = e^β et k = α.',
            'Contrôle : a e^(kx) proche de y pour un relevé du tableau.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-06-A3-05-EXEMPLE-AJUSTEMENT',
      titre: 'Exemple guidé : quatre relevés et z = ln y',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['ajustement-exponentiel', 'prevision'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape, puis la correction se dévoile étape par étape sur ce même écran.',
        'Papier : réponses sous chaque étape du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-06-a3-exemple-ajustement',
          enonce:
            'La lettre d’information de la gamme Sillage a compté 50, 61, 74 et 91 abonnés actifs aux semaines x = 0, 1, 2 et 3. On cherche un modèle y = a e^(kx).',
          etapes: [
            {
              id: 'rapports',
              intitule: 'Les rapports successifs',
              raisonnement:
                '61 ÷ 50 = 1,22 ; 74 ÷ 61 ≈ 1,21 ; 91 ÷ 74 ≈ 1,23 : les rapports sont presque constants, le modèle exponentiel convient.',
              invite: 'Calculez les rapports successifs. Que remarquez-vous ?',
            },
            {
              id: 'logarithmes',
              intitule: 'Les logarithmes',
              raisonnement: 'z = ln y : 3,912 ; 4,111 ; 4,304 ; 4,511.',
              invite: 'Calculez z = ln y au millième.',
            },
            {
              id: 'droite',
              intitule: 'La droite de z en x',
              raisonnement:
                'À la calculatrice : z ≈ 0,199x + 3,911, arrondi à z = 0,2x + 3,91.',
              invite: 'Ajustez z en x par les moindres carrés.',
            },
            {
              id: 'retour',
              intitule: 'Le retour au modèle',
              raisonnement:
                'y = e^3,91 × e^(0,2x) ≈ 49,9e^(0,2x), soit environ 50e^(0,2x).',
              invite: 'Revenez à y : que valent a et k ?',
            },
            {
              id: 'prevision',
              intitule: 'La prévision',
              raisonnement:
                'Semaine 5 : 50 × e^(0,2 × 5) = 50 × e ≈ 135,91, soit environ 136 abonnés.',
              invite: 'Combien d’abonnés prévoir à la semaine 5 ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur le retour au modèle (étape 4) : a = e^β, pas β.',
        'Transition : « À vous, sur la demande des boutiques : exercice 5. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-06-A3-06-TABLEAU-LOGARITHMES',
      titre: 'Exercice 5 — Le changement de variable z = ln y',
      diffusion: 'seance',
      brique: 'fp-table-build',
      dureeMinutes: 6,
      concepts: ['ajustement-exponentiel', 'logarithme-neperien'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 5 min',
        'Réflexion : vérifier sur la calculatrice que ln 1 100 est un peu au-dessus de 7.',
        'Piège : la touche log, qui donne des valeurs autour de 3.',
        'Papier : tableau du livret, rempli à la main, au millième.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: {
          id: 'b2-06-a3-tableau-logarithmes',
          intitule: 'Le changement de variable sur la demande des boutiques',
          consignes: [
            'Pour chaque prix de gros, saisissez z = ln y, arrondi au millième.',
            'Utilisez la touche ln de la calculatrice, pas la touche log.',
            'Ces valeurs de z servent à ajuster la demande à l’exercice 6.',
          ],
          echeances: DEMANDES.length,
          intituleDesLignes: 'Prix de gros',
          libellesLignes: PRIX_DE_GROS.map((prix) => `${prix} €`),
          parametres: {},
          colonnes: [
            {
              cle: 'prix',
              intitule: 'Prix de gros x (€)',
              role: 'donnee',
              valeurs: [...PRIX_DE_GROS],
              decimales: 0,
              totalise: false,
            },
            {
              cle: 'demande',
              intitule: 'Demande y (sacs)',
              role: 'donnee',
              valeurs: [...DEMANDES],
              decimales: 0,
              totalise: false,
            },
            {
              cle: 'z',
              intitule: 'z = ln y',
              role: 'saisie',
              decimales: 3,
              totalise: false,
            },
          ],
          synthese: [],
        },
        questions: [
          moteur.questionDeTableau(
            'b2-06-a3-tableau-logarithmes',
            'ajustement-exponentiel',
            [PREMIER_LOGARITHME, ...AUTRES_LOGARITHMES],
            0.001,
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter le tableau juste ; faire remarquer que z baisse d’environ 0,25 à chaque hausse de 5 €.',
        'Transition : « Une droite pour z : exercice 6. »',
      ],
    },
    [
      [
        'b2-06-a3-tableau-logarithmes',
        'z = ln y, touche ln : 7,003 ; 6,757 ; 6,507 ; 6,254 ; 6,016 ; 5,753. La touche log donne 3,041 ; 2,934… : c’est le logarithme décimal, pas ln. z baisse à peu près du même pas : les points (x ; z) sont presque alignés.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-06-A3-07-ATELIER-DEMANDE',
      titre: 'Exercice 6 — Le modèle de la demande',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['ajustement-exponentiel', 'resolution-par-logarithme'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 6 min',
        'Réflexion : écrire le retour de z à y, puis l’équation du prix, avant de calculer.',
        'Pièges : a = 8 ; a = −0,05 ; 0,95³⁸ ; le signe de k oublié ; diviser sans ln.',
        'Papier : exercice 6 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        intitule: 'Exercice 6 — Le modèle de la demande',
        consigne:
          'L’ajustement de z = ln y en x, arrondi, donne z = −0,05x + 8, x étant le prix de gros en euros et y la demande mensuelle en sacs.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-06-a3-coefficient',
            'ajustement-exponentiel',
            true,
            'Le modèle s’écrit y = a e^(−0,05x). Que vaut a ?',
            'a = e⁸, soit environ 2 981',
            [
              ['a = 8', ORDONNEE_NON_EXPONENTIEE],
              ['a = −0,05', SERIES_INVERSEES],
            ],
          ),
          moteur.numerique(
            'b2-06-a3-demande',
            'ajustement-exponentiel',
            'Avec ce modèle, a arrondi à l’unité, quelle demande prévoir au prix de gros de 38 € ? Arrondir à l’unité.',
            'sacs',
            446,
            { type: 'absolue', valeur: 0.5 },
            '446 sacs',
            [
              [424, K_POUR_TAUX],
              [19931, SIGNE_DE_K],
            ],
          ),
          moteur.vote(
            'b2-06-a3-methode',
            'resolution-par-logarithme',
            true,
            'Hélène vise une demande de 600 sacs par mois. Quelle égalité donne le prix de gros x ?',
            'x = ln(600 ÷ a) ÷ (−0,05)',
            [
              ['x = (600 ÷ a) ÷ (−0,05)', SEUIL_PAR_DIVISION],
              ['x = ln 600 ÷ ln a ÷ (−0,05)', LN_EN_PRODUIT],
            ],
          ),
          moteur.numerique(
            'b2-06-a3-prix',
            'resolution-par-logarithme',
            'Quel prix de gros donne une demande de 600 sacs par mois ? Arrondir au centime.',
            '€',
            32.06,
            moteur.DEUX_DECIMALES,
            '32,06 €',
            [
              [-4.03, SEUIL_PAR_DIVISION],
              [-32.06, SIGNE_DE_K],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger question par question, en commençant par la moins réussie.',
        'Transition : « Une IA a ajusté la même demande. »',
      ],
    },
    [
      [
        'b2-06-a3-coefficient',
        'ln y = −0,05x + 8, donc y = e⁸ × e^(−0,05x) : a = e⁸ ≈ 2 981. a = 8 oublie d’exponentier l’ordonnée à l’origine ; a = −0,05 confond la pente et l’ordonnée.',
      ],
      [
        'b2-06-a3-demande',
        '2 981 × e^(−0,05 × 38) = 2 981 × e^(−1,9) ≈ 445,86, soit environ 446 sacs. 2 981 × 0,95³⁸ ≈ 424 prend k pour le taux ; e^(+1,9) donnerait 19 931 sacs, absurde.',
      ],
      [
        'b2-06-a3-methode',
        '2 981e^(−0,05x) = 600 ⇔ e^(−0,05x) = 600 ÷ 2 981 ⇔ −0,05x = ln(600 ÷ 2 981), puis on divise par −0,05. ln(600 ÷ 2 981) n’est pas ln 600 ÷ ln 2 981.',
      ],
      [
        'b2-06-a3-prix',
        'x = ln(600 ÷ 2 981) ÷ (−0,05) ≈ 32,06 €. Sans ln, on trouve −4,03 ; en oubliant le signe de k, −32,06 : un prix négatif trahit l’erreur.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-06-A3-08-DEFI-IA',
      titre: 'Exercice 7 — Corriger l’ajustement d’une IA',
      diffusion: 'seance',
      brique: 'fp-challenge',
      dureeMinutes: 8,
      concepts: ['ajustement-exponentiel', 'ajustement-affine', 'prevision'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 6 min',
        'Réflexion : relire les traces écrites de la notion 3 et le graphique A3-01.',
        'Repérer qui calcule les rapports, qui compare les deux coefficients de corrélation, qui voit la demande négative ; faire trouver la piste fausse avant de révéler.',
        'Papier : exercice 7 du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        probleme: {
          id: 'b2-06-a3-defi-ia',
          enonce:
            'Hélène a donné les six relevés de demande à un assistant IA. Réponse : « 1. J’ajuste la demande par la droite y = −31x + 1 653, avec un coefficient de corrélation r ≈ −0,985 : l’ajustement est excellent. 2. Au prix de 55 €, la demande sera de −52 sacs. 3. Un modèle exponentiel est inutile : une droite suffit. »',
          invite:
            'Trouvez les erreurs de l’IA, corrigez chacune et dites comment la contrôler.',
        },
        corrige: {
          type: 'defi',
          strategies: [
            moteur.strategie(
              'rapports',
              'Les rapports successifs des demandes sont presque constants : la demande perd la même part à chaque hausse de 5 €, signe d’un modèle exponentiel.',
            ),
            moteur.strategie(
              'logarithme',
              'Ajuster z = ln y en x : les points (x ; z) sont presque alignés, avec un coefficient de corrélation plus proche de −1 que celui de la droite.',
            ),
            moteur.strategie(
              'negative',
              'La droite annonce une demande négative au-delà de 53 € environ : un modèle qui prévoit des ventes négatives est faux.',
            ),
            moteur.strategie(
              'prevision',
              'Prévoir avec le modèle exponentiel y = 2 981e^(−0,05x), qui reste positif et ralentit comme les relevés.',
            ),
            moteur.strategie(
              'garder',
              'Garder la droite : un coefficient de corrélation de −0,985 suffit à valider l’ajustement affine.',
              true,
            ),
          ],
        },
      },
    },
    {
      minutes: 2,
      notes: [
        'Faire lire deux corrections de la classe, puis dévoiler les pistes une à une en recalculant la prévision à 55 €.',
        'Transition : jalon 3, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'rapports',
        '860 ÷ 1 100 ≈ 0,78 ; 670 ÷ 860 ≈ 0,78 ; 520 ÷ 670 ≈ 0,78 ; 410 ÷ 520 ≈ 0,79 ; 315 ÷ 410 ≈ 0,77 : la demande perd environ 22 % à chaque hausse de 5 €.',
      ],
      [
        'logarithme',
        'z ≈ −0,0499x + 8,0026, avec r ≈ −0,99994 : bien plus proche de −1 que −0,985. C’est le modèle de l’exercice 6.',
      ],
      [
        'negative',
        '−31x + 1 653 s’annule vers 53,3 € : au-delà, la droite annonce des ventes négatives, impossibles ; à 55 €, −52 sacs.',
      ],
      [
        'prevision',
        'À 55 € : 2 981 × e^(−2,75) ≈ 191 sacs, positif et cohérent avec une baisse qui ralentit.',
      ],
      [
        'garder',
        'Piste fausse : un coefficient de −0,985 mesure un alignement, il ne choisit pas le modèle ; la courbe des relevés et les rapports constants désignent l’exponentielle.',
      ],
    ],
  ),
  {
    screenId: 'B2-06-A3-09-JALON',
    titre: 'Jalon 3 : modèles exponentiels',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['ajustement-exponentiel'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Pause de 15 minutes, hors durée programmée.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-06-a3-jalon',
        invite:
          'Je sais reconnaître un modèle exponentiel, l’ajuster par z = ln y et m’en servir pour prévoir.',
      },
    },
  },
];

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  [TAUX_POUR_COEFFICIENT]: 'B2-06-A1-08-COURS-MODELE-EXP',
  [INTERETS_SIMPLES]: 'B2-06-A1-07-COURS-EXPONENTIELLE',
  'nature-de-suite-confondue': 'B2-06-A1-07-COURS-EXPONENTIELLE',
  [LUE_COMME_PRODUIT]: 'B2-06-A1-07-COURS-EXPONENTIELLE',
  [SIGNE_DE_K]: 'B2-06-A1-08-COURS-MODELE-EXP',
  [K_POUR_TAUX]: 'B2-06-A1-08-COURS-MODELE-EXP',
  [NON_FIGEE]: 'B2-06-A1-08-COURS-MODELE-EXP',
  [LN_EN_PRODUIT]: 'B2-06-A2-02-COURS-LOGARITHME',
  [TOUCHE_LOG]: 'B2-06-A2-02-COURS-LOGARITHME',
  [SEUIL_PAR_DIVISION]: 'B2-06-A2-03-COURS-SEUIL',
  [SENS_INCHANGE]: 'B2-06-A2-03-COURS-SEUIL',
  [SEUIL_MAL_ARRONDI]: 'B2-06-A2-03-COURS-SEUIL',
  [AJUSTEMENT_DE_Y]: 'B2-06-A3-04-COURS-AJUSTEMENT',
  [ORDONNEE_NON_EXPONENTIEE]: 'B2-06-A3-04-COURS-AJUSTEMENT',
  [SERIES_INVERSEES]: 'B2-06-A3-04-COURS-AJUSTEMENT',
};

export const COURS_B2_06 = moteur.coursB2(
  [ACTE_1, ACTE_2, ACTE_3, ACTE_4],
  REMEDIATIONS,
  [],
  {
    slug: 'b2-06-exponentielle-logarithme',
    titre: 'Exponentielle et logarithme',
    gabarit: 'v3',
    dureeMinutes: 180,
    concepts: [...CONCEPTS_DU_COURS],
  },
);
