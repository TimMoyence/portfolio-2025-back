import type { ContenuDeCours } from '../../domain/cours/CoursStocke';
import { ACTE_4 } from './b2-05.acte-4';
import {
  ACTUALISATION_INVERSEE,
  ANNUITE_ARRONDIE,
  ANNUITE_POUR_AMORTISSEMENT,
  ATTENDUS_DE_L_EPARGNE,
  ATTENDUS_DU_PLACEMENT,
  AUTRES_LIGNES_D_AMORTISSEMENT,
  CAPITAL_INITIAL,
  CONCEPTS_DU_COURS,
  DONNEES_FICTIVES,
  DUREE_DE_L_EMPRUNT,
  DUREE_DE_L_EMPRUNT_TYPE,
  EMPRUNT,
  FORMULE_DE_L_EPARGNE,
  FORMULE_DES_INTERETS_DE_L_EPARGNE,
  FORMULE_DES_INTERETS_DU_PLACEMENT,
  FORMULE_DU_PLACEMENT,
  FORMULE_DU_TOTAL_DES_INTERETS,
  INTERETS_SIMPLES,
  LIGNES_DE_L_EMPRUNT_TYPE,
  NON_FIGEE,
  PLAN_DE_L_EPARGNE,
  PLAN_DU_PLACEMENT,
  PREMIERE_LIGNE_D_AMORTISSEMENT,
  RENVOI_AU_DOSSIER,
  SANS_INTERETS,
  TAUX_DE_L_EMPRUNT,
  TAUX_POUR_COEFFICIENT,
  TOTAL_REMBOURSE,
  TOUTE_LA_DUREE,
  VPM_NON_SIGNE,
  auCentime,
} from './b2-05.donnees';
import * as moteur from './briques';
import { auMillionieme, termes } from './feuilles';

const ACTE_1: moteur.Acte = [
  {
    screenId: 'B2-05-A1-01-RAPPEL-SUITE',
    titre: 'Rappel du B2-04 : un capital qui gagne 2 % par an',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 3,
    concepts: ['suite-geometrique'],
    notes: moteur.puces(
      'Avant de lancer : vérifier au pupitre que tous les postes ont rejoint la séance.',
      'Annoncer « seule la participation compte ». Chacun répond sans calculatrice.',
      'Piège : prendre le taux (0,02) pour la raison ; tout l’acte 1 repose sur ce coefficient.',
      'Papier : la question est en tête du livret ; vote à main levée.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-05-a1-rappel-suite',
          'suite-geometrique',
          true,
          'Un capital augmente de 2 % chaque année. Quelle suite modélise sa valeur année après année ?',
          'Une suite géométrique de raison 1,02',
          [
            ['Une suite géométrique de raison 0,02', TAUX_POUR_COEFFICIENT],
            ['Une suite arithmétique de raison 2', 'nature-de-suite-confondue'],
          ],
        ),
      ],
      delaiMs: 0,
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-05-A1-02-ACCROCHE',
      titre: 'Placer, emprunter : le prix du temps',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['interets-composes', 'annuites', 'tableau-d-amortissement'],
      notes: moteur.puces(
        'Rappeler en une phrase le B2-04 : le plan à cinq ans est prêt ; Hélène monte maintenant le dossier de financement du second atelier.',
        'Annoncer le plan : un rappel rapide du B2-01 et du B2-04, puis trois notions, chacune en trois temps (réfléchir, comprendre, s’exercer), et une mini-situation CCF.',
        'Annoncer les deux pauses de 15 minutes, après l’acte 1 et après l’acte 3.',
      ),
    },
    'hero',
    {
      title: 'Placer, emprunter : le prix du temps',
      subtitle:
        'Atelier Rivage, voilerie de La Rochelle. Pour financer son second atelier, la dirigeante place sa trésorerie, épargne chaque année et emprunte : trois calculs que la banque va vérifier.',
      bullets: [
        'BTS Comptabilité et gestion · 2e année · cinquième cours de mathématiques',
        'Un rappel rapide du B2-01 et du B2-04, réinvestis aujourd’hui',
        'Trois notions : intérêts composés, suites d’annuités, emprunts',
        'Une mini-situation CCF et sa question tableur',
      ],
    },
  ),
  {
    screenId: 'B2-05-A1-03-VOTE-ACQUIS',
    titre: 'Vote : deux rappels, B2-01 et B2-04',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 4,
    concepts: ['evolution-reciproque', 'somme-de-termes'],
    notes: moteur.puces(
      'Rappel rapide : deux votes non notés, un par cours.',
      'Dire où chaque acquis resservira : la réciproque pour actualiser, le nombre de termes pour les annuités.',
      ...moteur.NOTES_DU_VOTE_A_DEUX_QUESTIONS,
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-05-a1-rappel-reciproque',
          'evolution-reciproque',
          false,
          'Rappel du B2-01. Un prix augmente de 25 %. Par quel nombre faut-il multiplier le nouveau prix pour retrouver le prix de départ ?',
          'Par 1 ÷ 1,25 = 0,8',
          [['Par 0,75, soit une baisse de 25 %', 'reciproque-meme-taux']],
        ),
        moteur.vote(
          'b2-05-a1-rappel-termes',
          'somme-de-termes',
          false,
          'Rappel du B2-04. Combien de termes additionne-t-on du rang 0 au rang 4 inclus ?',
          'Cinq termes : 4 − 0 + 1',
          [['Quatre termes : 4 − 0', 'nombre-de-termes-decale']],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Deux acquis qui resservent aujourd’hui',
        lignes: [
          'Pour annuler une hausse, on divise par son coefficient : ÷ 1,25, c’est × 0,8, soit une baisse de 20 %, pas de 25 %.',
          'Du rang 0 au rang 4 inclus, on compte 4 − 0 + 1 = 5 termes.',
          'L’écran suivant dit ce que ces acquis deviennent aujourd’hui.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-05-A1-04-ACQUIS',
      titre: 'Ce que vous savez déjà',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: [
        'coefficient-multiplicateur',
        'evolution-reciproque',
        'suite-geometrique',
        'somme-de-termes',
      ],
      notes: moteur.puces(
        '2 min : lire la dernière ligne de chaque colonne, c’est le fil du cours.',
        'Question : « Lequel de ces acquis servira à calculer la somme à placer aujourd’hui ? » La réciproque : on divise par le coefficient.',
        'Ne pas refaire les cours : renvoyer aux fiches mémo du classeur de CCF.',
      ),
    },
    'comparison',
    {
      title: 'Ce que vous savez déjà',
      subtitle: 'Trois acquis qui servent à placer et à emprunter.',
      columns: [
        {
          label: 'B2-01 · Information chiffrée',
          tone: 'info',
          items: [
            'Hausse de t % : × (1 + t).',
            'Annuler une hausse : ÷ (1 + t).',
            'Aujourd’hui : capitaliser, puis actualiser.',
          ],
        },
        {
          label: 'B2-04 · Suites',
          tone: 'success',
          items: [
            'Géométrique : uₙ = u₀ × qⁿ.',
            'Somme de termes : compter les rangs.',
            'Aujourd’hui : capital placé et annuités.',
          ],
        },
        {
          label: 'Tableur',
          tone: 'warning',
          items: [
            'Une formule, recopiée vers le bas.',
            'Le taux figé par des $.',
            'Aujourd’hui : VPM et le tableau d’amortissement.',
          ],
        },
      ],
      note: 'Les fiches mémo du B2-01 et du B2-04 sont dans votre classeur de CCF.',
    },
  ),
  moteur.ecranV2(
    {
      screenId: RENVOI_AU_DOSSIER,
      titre: 'Le dossier de financement d’Atelier Rivage',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['interets-composes', 'annuites', 'tableau-d-amortissement'],
      notes: moteur.puces(
        '1 min de lecture silencieuse ; ne rien calculer.',
        'Faire dire les trois lignes du plan : placer une fois, placer chaque année, emprunter.',
        'Relier aux notions du jour : une ligne du dossier par notion.',
      ),
    },
    'table',
    {
      title: 'Le dossier de financement d’Atelier Rivage',
      subtitle:
        'Les trois lignes du plan de financement du second atelier, à présenter à la banque.',
      columns: [...moteur.COLONNES_DU_DOSSIER],
      rows: [
        {
          rubrique: 'Le projet',
          contenu:
            'Un second atelier de voilerie, à équiper à partir de 2031. Hélène Garnier, la dirigeante, présente son plan de financement à la banque.',
        },
        {
          rubrique: 'La trésorerie',
          contenu:
            '40 000 € disponibles au 1er janvier 2026, placés à 2,5 % par an, intérêts laissés sur le compte, en attendant le chantier.',
        },
        {
          rubrique: 'L’épargne des machines',
          contenu:
            '6 000 € mis de côté à la fin de chaque année, de 2026 à 2030, sur un compte à 3 % par an.',
        },
        {
          rubrique: 'L’emprunt d’équipement',
          contenu:
            '60 000 € empruntés sur 5 ans au taux annuel de 4 %, remboursés par annuités constantes.',
        },
        {
          rubrique: 'La question de la banque',
          contenu:
            'Combien le placement et l’épargne rapporteront-ils, et combien l’emprunt coûtera-t-il ?',
        },
      ],
      note: DONNEES_FICTIVES,
    },
  ),
  {
    screenId: 'B2-05-A1-06-MISSION',
    titre: 'Votre mission : le dossier de financement',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 6,
    concepts: ['interets-composes', 'annuites', 'tableau-d-amortissement'],
    notes: moteur.puces(
      'Lecture à voix haute du courriel (1 min), puis 4 min d’écriture individuelle et 1 min de mise en commun au pupitre.',
      'Question 1 : faire dire que les intérêts de la deuxième année portent aussi sur ceux de la première.',
      'Question 2 : faire dire que chaque versement ne rapporte pas pendant la même durée.',
      'Question 3 : faire émerger qu’une annuité paie aussi des intérêts ; c’est l’acte 3.',
      'Papier : trois lignes d’écriture dans le livret.',
    ),
    proprietes: {
      metier:
        'Assistant·e de gestion — Atelier Rivage (voilerie artisanale, 14 salariés, La Rochelle)',
      situation:
        'Lundi, 9 h. Hélène Garnier écrit : « La banque veut voir trois lignes de notre plan : les 40 000 € de trésorerie placés à 2,5 % par an, les 6 000 € que nous mettrons de côté chaque fin d’année de 2026 à 2030 à 3 %, et l’emprunt de 60 000 € sur 5 ans à 4 %. Pouvez-vous chiffrer chaque ligne ? » Marc Lefèvre, l’expert-comptable, ajoute : « Pour l’emprunt, ne vous contentez pas de diviser 60 000 € par 5 : la banque se paie aussi en intérêts. »',
      geste:
        'Sans calculatrice, répondez aux trois questions à partir du dossier.',
      consequence:
        'Un placement surestimé, et le chantier manque d’argent ; un emprunt sous-estimé, et les annuités pèsent sur la trésorerie des cinq prochaines années.',
      questionsLibres: [
        {
          id: 'b2-05-a1-mission:placement',
          question:
            'Le placement de 40 000 € rapporte-t-il les mêmes intérêts chaque année ? Pourquoi ?',
          placeholder: 'Oui / Non, parce que chaque année…',
        },
        {
          id: 'b2-05-a1-mission:epargne',
          question:
            'Cinq versements de 6 000 € font-ils 30 000 € d’épargne fin 2030 ? Plus, moins ?',
          placeholder: 'Plus / moins / autant, parce que…',
        },
        {
          id: 'b2-05-a1-mission:emprunt',
          question:
            'Rembourser 12 000 € par an pendant cinq ans suffit-il à solder l’emprunt ? Pourquoi ?',
          placeholder: 'Oui / Non, parce que la banque…',
        },
      ],
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-05-A1-07-COURS-INTERETS-COMPOSES',
      titre: 'Cours : intérêts composés et valeur acquise',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['interets-composes', 'suite-geometrique'],
      notes: moteur.puces(
        '3 min ; la trace écrite est imprimée dans le livret : on lit et on commente, on ne recopie pas.',
        'Avant l’exemple, demander : « 3 % pendant 10 ans, est-ce 30 % ? » Laisser venir les intérêts des intérêts.',
        'Relier au B2-04 : le capital placé est une suite géométrique de raison 1 + t.',
        'Lien au dossier : « La trésorerie d’Hélène, placée combien d’années avant le chantier ? »',
      ),
    },
    'lesson',
    {
      title: 'Intérêts composés : les intérêts rapportent à leur tour',
      subtitle: 'Trace écrite · notion 1 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Capitaliser : multiplier par 1 + t chaque année',
          text: 'Un capital C₀ placé au taux annuel t rapporte des intérêts. Aux intérêts simples, ils sont calculés chaque année sur le seul capital de départ. Aux intérêts composés, ils s’ajoutent au capital à la fin de chaque année et rapportent à leur tour : on multiplie par 1 + t chaque année. Le capital Cₙ obtenu au bout de n années s’appelle la valeur acquise. C’est une suite géométrique de raison 1 + t (B2-04). C’est le calcul de la trésorerie d’Hélène.',
          formula:
            'Intérêts composés : Cₙ = C₀ × (1 + t)ⁿ · intérêts simples : C₀ × (1 + n × t)',
        },
        {
          kind: 'example',
          title: 'Pour débuter : le livret à 3 %',
          text: 'On place 2 000 € sur un livret à 3 % par an, intérêts laissés sur le livret. C₀ = 2 000 et 1 + t = 1,03.',
          steps: [
            'Après un an : 2 000 × 1,03 = 2 060 € ; les intérêts sont de 60 €.',
            'Après deux ans : 2 060 × 1,03 = 2 121,80 € ; les intérêts de la deuxième année, 61,80 €, portent sur 2 060 €.',
            'Après dix ans : 2 000 × 1,03¹⁰ ≈ 2 687,83 €.',
            'Aux intérêts simples : 2 000 × (1 + 10 × 0,03) = 2 600 € seulement.',
          ],
        },
        {
          kind: 'method',
          title: 'Calculer une valeur acquise',
          text: 'Pièges : multiplier par le taux au lieu du coefficient (0,03 au lieu de 1,03) ; calculer les intérêts sur le seul capital de départ ; placer une année de trop ou de moins en comptant mal la durée.',
          steps: [
            'Écrire le capital de départ et le taux en décimal.',
            'Compter la durée n en années entières de placement.',
            'Calculer C₀ × (1 + t)ⁿ avec la touche puissance ; arrondir au centime à la fin.',
            'Intérêts gagnés : Cₙ − C₀.',
          ],
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-05-A1-08-COURS-VALEUR-ACTUELLE',
      titre: 'Cours : valeur actuelle et tableur',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['valeur-actuelle', 'evolution-reciproque', 'tableur'],
      notes: moteur.puces(
        '3 min, enchaînées sur la page 1 : 6 min pour les deux pages.',
        'Relier au vote de rappel : annuler une hausse, c’est diviser par son coefficient ; actualiser, c’est annuler n hausses.',
        'Faire taper la formule sans $ sur un poste volontaire, puis la recopier : la colonne se fige, l’erreur fixe la règle.',
      ),
    },
    'lesson',
    {
      title: 'Valeur actuelle : ce qu’il faut placer aujourd’hui',
      subtitle: 'Trace écrite · notion 1 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Actualiser : diviser par (1 + t)ⁿ',
          text: 'La valeur actuelle d’une somme Cₙ disponible dans n années est le capital C₀ qu’il faut placer aujourd’hui, au taux t, pour obtenir Cₙ. On remonte le temps : on divise par le coefficient, comme pour annuler une hausse (B2-01). Capitaliser, c’est aller vers le futur (× (1 + t)ⁿ) ; actualiser, c’est revenir au présent (÷ (1 + t)ⁿ).',
          formula: 'C₀ = Cₙ ÷ (1 + t)ⁿ',
        },
        {
          kind: 'method',
          title: 'Au tableur : le taux dans une cellule figée',
          text: 'Une valeur de départ, puis une formule recopiée qui multiplie le capital du dessus par 1 + taux. Le taux est rangé dans une cellule à part, figé par des $.',
          steps: [
            'B2 contient le capital placé ; le taux, écrit 0,03, est en E1.',
            'En B3 : =B2*(1+$E$1), puis recopier vers le bas.',
            'Intérêts de l’année en C3 : =B3-B2, recopiée.',
            'Sans les $, B4 lirait E2, vide : le capital cesserait de grossir.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : capitaliser ou actualiser ?',
          text: 'Lire d’abord le sens de la question. « Que vaudra… dans n ans ? » : on capitalise. « Combien placer aujourd’hui pour avoir… ? » : on actualise. Pièges : multiplier au lieu de diviser ; diviser par 1 + n × t, comme aux intérêts simples.',
          steps: [
            'Repérer la somme connue et sa date.',
            'Futur connu, présent cherché : ÷ (1 + t)ⁿ.',
            'Contrôle : la valeur actuelle est plus petite que la somme future.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-05-A1-09-EXEMPLE-PLACEMENT',
      titre: 'Exemple guidé : placer 8 000 € à 2 %',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['interets-composes', 'valeur-actuelle'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape, puis la correction se dévoile étape par étape sur ce même écran.',
        'Papier : réponses sous chaque étape du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-05-a1-exemple-placement',
          enonce:
            'Le comité d’entreprise d’Atelier Rivage place 8 000 € à intérêts composés au taux annuel de 2 %. Il se demande aussi combien placer aujourd’hui pour disposer de 10 000 € dans 5 ans.',
          etapes: [
            {
              id: 'coefficient',
              intitule: 'Le coefficient',
              raisonnement:
                'Gagner 2 % par an, c’est multiplier par 1 + 0,02 = 1,02 chaque année.',
              invite:
                'Par quel nombre multiplie-t-on le capital chaque année ?',
            },
            {
              id: 'premieres',
              intitule: 'Les deux premières valeurs',
              raisonnement:
                'Après un an : 8 000 × 1,02 = 8 160 € ; après deux ans : 8 160 × 1,02 = 8 323,20 €.',
              invite: 'Calculez le capital après un an, puis après deux ans.',
            },
            {
              id: 'valeur-acquise',
              intitule: 'La valeur acquise',
              raisonnement:
                'Après cinq ans : 8 000 × 1,02⁵ ≈ 8 832,65 €, soit 832,65 € d’intérêts.',
              invite: 'Calculez la valeur acquise au bout de 5 ans.',
            },
            {
              id: 'simples',
              intitule: 'La comparaison',
              raisonnement:
                'Aux intérêts simples : 8 000 × (1 + 5 × 0,02) = 8 800 €. Les intérêts composés rapportent 32,65 € de plus : les intérêts des intérêts.',
              invite: 'Que donneraient les intérêts simples sur 5 ans ?',
            },
            {
              id: 'actualiser',
              intitule: 'La valeur actuelle',
              raisonnement:
                '10 000 ÷ 1,02⁵ ≈ 9 057,31 € : c’est la somme à placer aujourd’hui. Multiplier par 1,02⁵ donnerait une somme plus grande que 10 000 €, absurde.',
              invite:
                'Combien placer aujourd’hui pour avoir 10 000 € dans 5 ans ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur l’écart avec les intérêts simples (étape 4) et sur le sens de l’actualisation (étape 5).',
        'Transition : « À vous, sur la trésorerie d’Hélène : exercice 1. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-05-A1-10-ATELIER-PLACEMENT',
      titre: 'Exercice 1 — Placer la trésorerie',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['interets-composes', 'valeur-actuelle'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 6 min',
        'Réflexion : écrire le capital, le taux décimal et la durée avant de calculer ; dire, pour chaque question, s’il faut capitaliser ou actualiser.',
        'Pièges : taux pris pour le coefficient ; intérêts simples ; une année de trop ; multiplier pour actualiser.',
        'Papier : exercice 1 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        intitule: 'Exercice 1 — Placer la trésorerie',
        consigne:
          'Trésorerie : 40 000 € placés le 1er janvier 2026 à intérêts composés, au taux annuel de 2,5 %. Résultats au centime.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-05-a1-coefficient',
            'interets-composes',
            true,
            'Par quel nombre la valeur du placement est-elle multipliée chaque année ?',
            '1,025 : on multiplie par 1 + 0,025',
            [['0,025 : le taux écrit en décimal', TAUX_POUR_COEFFICIENT]],
          ),
          moteur.numerique(
            'b2-05-a1-valeur-acquise',
            'interets-composes',
            'Quelle est la valeur acquise du placement au 1er janvier 2029 ?',
            '€',
            43075.63,
            moteur.DEUX_DECIMALES,
            '43 075,63 €',
            [
              [43000, INTERETS_SIMPLES],
              [44152.52, 'rang-decale'],
            ],
          ),
          moteur.vote(
            'b2-05-a1-actualiser',
            'valeur-actuelle',
            true,
            'Hélène voudrait disposer de 50 000 € au 1er janvier 2029. Quel calcul donne la somme à placer au 1er janvier 2026 ?',
            '50 000 ÷ 1,025³',
            [
              ['50 000 × 1,025³', ACTUALISATION_INVERSEE],
              ['50 000 ÷ (1 + 3 × 0,025)', INTERETS_SIMPLES],
            ],
          ),
          moteur.numerique(
            'b2-05-a1-valeur-actuelle',
            'valeur-actuelle',
            'Quelle somme faut-il placer au 1er janvier 2026 pour disposer de 50 000 € au 1er janvier 2029 ?',
            '€',
            46429.97,
            moteur.DEUX_DECIMALES,
            '46 429,97 €',
            [
              [53844.53, ACTUALISATION_INVERSEE],
              [46511.63, INTERETS_SIMPLES],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger question par question, en commençant par la moins réussie (score sous chaque correction).',
        'Transition : « Faisons calculer tout le placement par le tableur : exercice 2. »',
      ],
    },
    [
      [
        'b2-05-a1-coefficient',
        'Gagner 2,5 % par an, c’est multiplier par 1 + 0,025 = 1,025. 0,025 est le taux, pas le coefficient.',
      ],
      [
        'b2-05-a1-valeur-acquise',
        'Du 1er janvier 2026 au 1er janvier 2029 : trois années. 40 000 × 1,025³ ≈ 43 075,63 €. Aux intérêts simples, 40 000 × 1,075 = 43 000 € ; avec une année de trop, 44 152,52 €.',
      ],
      [
        'b2-05-a1-actualiser',
        'La somme future est connue, la somme présente est cherchée : on actualise, on divise par 1,025³. Multiplier irait dans le mauvais sens du temps.',
      ],
      [
        'b2-05-a1-valeur-actuelle',
        '50 000 ÷ 1,025³ ≈ 46 429,97 €. Contrôle : 46 429,97 × 1,025³ ≈ 50 000 €. Multiplier donnerait 53 844,53 €, plus que la somme visée.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-05-A1-11-TABLEUR-PLACEMENT',
      titre: 'Exercice 2 — Le placement au tableur',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 6,
      concepts: ['tableur', 'interets-composes'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 5 min',
        'Réflexion : écrire sur papier la formule de C3, puis ce qu’elle devient en C4 une fois recopiée.',
        'Erreurs à chercher : =C2*$G$1 (le taux seul) ; G1 sans $ : la colonne reste bloquée à 41 000 ; des intérêts toujours égaux à 1 000 €.',
        'Papier : formules écrites sur la copie, puis les valeurs à la calculatrice.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: PLAN_DU_PLACEMENT,
        questions: [
          {
            type: 'feuille',
            id: PLAN_DU_PLACEMENT.id,
            concept: 'tableur',
            noteCompte: true,
            corrige: {
              type: 'feuille',
              plan: PLAN_DU_PLACEMENT,
              attendus: ATTENDUS_DU_PLACEMENT,
              seuilReussite: 0.8,
            },
          },
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter la feuille d’un poste volontaire, relire la formule de C3 et montrer les $ qui la font recopier.',
        'Transition : jalon 1, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'C3 à C7',
        `${FORMULE_DU_PLACEMENT}, recopiée : 41 000 € au 1er janvier 2027, jusqu’à environ 45 256,33 € au 1er janvier 2031. Sans les $, la recopie lit G2, vide, et la colonne reste à 41 000.`,
      ],
      [
        'D3 à D7',
        `${FORMULE_DES_INTERETS_DU_PLACEMENT}, recopiée : 1 000 €, puis 1 025 €, 1 050,63 €… Les intérêts grossissent chaque année ; toujours 1 000 €, ce seraient des intérêts simples.`,
      ],
    ],
  ),
  {
    screenId: 'B2-05-A1-12-JALON',
    titre: 'Jalon 1 : intérêts composés',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['interets-composes', 'valeur-actuelle'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : reprendre la trace écrite A1-08 sur le sens de l’actualisation après la pause.',
      'Pause de 15 minutes, hors durée programmée.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-05-a1-jalon',
        invite:
          'Je sais calculer une valeur acquise et une valeur actuelle, et les écrire au tableur.',
      },
    },
  },
];

const ACTE_2: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-05-A2-01-REFLEXION-VERSEMENTS',
      titre: 'Réfléchir : 6 000 € par an pendant cinq ans',
      diffusion: 'seance',
      dureeMinutes: 5,
      concepts: ['annuites', 'interets-composes'],
      notes: moteur.puces(
        'Temps « réfléchir » de la notion 2 : 3 min d’écriture individuelle, puis lire trois réponses au pupitre.',
        'Ne rien trancher : la trace écrite suivante répond.',
        'Relance : « Le versement de fin 2030 rapporte-t-il des intérêts avant fin 2030 ? »',
        'Papier : cadre de réponse du livret.',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b2-05-a2-reflexion-versements',
        type: 'reflection',
        question:
          'Un stagiaire chiffre l’épargne des machines : « Cinq versements de 6 000 € placés cinq ans à 3 % : 5 × 6 000 × 1,03⁵. » Sans calculatrice, dites s’il a raison, versement par versement : combien d’années chacun rapporte-t-il des intérêts jusqu’à fin 2030 ?',
        placeholder: 'Il a raison / il a tort, parce que le versement de…',
        competency: 'Modéliser · reconnaître une suite de versements',
      },
    },
    {
      correction: {
        expected:
          'Il a tort : le versement de fin 2026 rapporte quatre ans, celui de fin 2027 trois ans, et ainsi de suite ; celui de fin 2030 ne rapporte rien. Chaque versement a sa propre durée, et son calcul surestime l’épargne.',
        nextAction:
          'Gardez votre réponse : la trace écrite additionne les versements un par un.',
      },
      renvoi: RENVOI_AU_DOSSIER,
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-05-A2-02-COURS-ANNUITES',
      titre: 'Cours : suite d’annuités et valeur acquise',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['annuites', 'suite-geometrique', 'somme-de-termes'],
      notes: moteur.puces(
        '3 min ; garder la réflexion précédente sous les yeux.',
        'Faire tracer au tableau une frise de 2026 à 2030, une flèche par versement jusqu’à fin 2030.',
        'Relier au B2-04 : les valeurs acquises forment une suite géométrique de raison 1 + t, qu’on additionne.',
      ),
    },
    'lesson',
    {
      title: 'Suite d’annuités : additionner des versements placés',
      subtitle: 'Trace écrite · notion 2 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Chaque versement a sa durée',
          text: 'Une suite d’annuités est une suite de versements égaux, faits à intervalles réguliers, ici en fin d’année. Sa valeur acquise, à la date du dernier versement, est la somme des valeurs acquises de chaque versement : le premier est placé n − 1 années, le dernier ne rapporte rien. Ces valeurs forment une suite géométrique de raison 1 + t (B2-04), d’où une formule donnée au CCF. C’est l’épargne des machines d’Hélène.',
          formula:
            'Vₙ = a × ((1 + t)ⁿ − 1) ÷ t · n versements de a, en fin de période',
        },
        {
          kind: 'example',
          title: 'Pour débuter : 1 000 € par an à 2 %',
          text: 'Trois versements de 1 000 €, en fin d’année, sur un compte à 2 %. Valeur acquise au troisième versement ?',
          steps: [
            'Le premier est placé deux ans : 1 000 × 1,02² = 1 040,40 €.',
            'Le deuxième est placé un an : 1 000 × 1,02 = 1 020 €.',
            'Le troisième ne rapporte rien : 1 000 €.',
            'Somme : 3 060,40 € ; formule : 1 000 × (1,02³ − 1) ÷ 0,02 = 3 060,40 €.',
          ],
        },
        {
          kind: 'method',
          title: 'Calculer la valeur acquise d’une suite d’annuités',
          text: 'Pièges : additionner les versements sans leurs intérêts (3 000 € au lieu de 3 060,40 €) ; placer chaque versement pendant toute la durée ; compter un versement de trop ou de moins.',
          steps: [
            'Compter les versements n, du premier au dernier inclus.',
            'Repérer la date d’évaluation : celle du dernier versement.',
            'Appliquer la formule donnée, taux en décimal ; arrondir au centime à la fin.',
            'Intérêts gagnés : valeur acquise − n × a.',
          ],
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-05-A2-03-COURS-ANNUITES-TABLEUR',
      titre: 'Cours : les annuités au tableur',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['annuites', 'tableur', 'somme-de-termes'],
      notes: moteur.puces(
        '3 min, enchaînées sur la page 1 : 6 min pour les deux pages.',
        'Dire la formule en français avant de l’écrire : « l’épargne de l’an passé, plus ses intérêts, plus le versement ».',
        'Question : « Le total des intérêts, c’est la dernière ligne de la colonne ? » Non : une somme.',
      ),
    },
    'lesson',
    {
      title: 'Les annuités au tableur : une ligne par année',
      subtitle: 'Trace écrite · notion 2 · page 2 sur 2',
      blocks: [
        {
          kind: 'method',
          title: 'Le tableau d’épargne',
          text: 'Première ligne : le premier versement. Chaque ligne suivante reprend l’épargne de l’an passé, lui ajoute ses intérêts de l’année, puis le nouveau versement. Taux et versement sont rangés dans deux cellules figées par des $.',
          steps: [
            'B2 contient le premier versement ; le taux est en E1, le versement en G1.',
            'En B3 : =B2*(1+$E$1)+$G$1, puis recopier vers le bas.',
            'Intérêts de l’année en C3 : =B2*$E$1, recopiée.',
            'Sans les $, la recopie lit E2 et G2, vides : l’épargne n’augmente plus.',
          ],
        },
        {
          kind: 'property',
          title: 'Total des intérêts : une somme',
          text: 'Le total des intérêts gagnés est la somme de la colonne des intérêts, ou la dernière épargne moins le total versé. La dernière cellule de la colonne ne donne que les intérêts d’une seule année.',
          formula: '=SOMME(plage des intérêts) = dernière épargne − n × a',
        },
        {
          kind: 'exam',
          title: 'Au CCF : lire la date d’évaluation',
          text: 'Un sujet demande souvent la valeur acquise « au dernier versement » avec la formule donnée, puis une formule de tableur à recopier. Pièges : compter le dernier versement comme placé ; oublier les $ ; donner une valeur de la colonne pour le total.',
          steps: [
            'Relever a, t et n, puis vérifier la date du dernier versement.',
            'Contrôle : la valeur acquise dépasse n × a, d’un écart plausible.',
            'Au tableur : une formule, recopiée, taux et versement figés.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-05-A2-04-EXEMPLE-ANNUITES',
      titre: 'Exemple guidé : 1 500 € par an à 2,5 %',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['annuites'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape, puis la correction se dévoile étape par étape sur ce même écran.',
        'Papier : réponses sous chaque étape du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-05-a2-exemple-annuites',
          enonce:
            'Le comité d’entreprise verse 1 500 € à la fin de chaque année, pendant quatre ans, sur un compte à 2,5 % par an. Quelle épargne aura-t-il au quatrième versement ?',
          etapes: [
            {
              id: 'durees',
              intitule: 'La durée de chaque versement',
              raisonnement:
                'Le premier versement est placé trois ans, le deuxième deux ans, le troisième un an ; le quatrième ne rapporte rien.',
              invite:
                'Combien d’années chaque versement rapporte-t-il jusqu’au quatrième versement ?',
            },
            {
              id: 'valeurs',
              intitule: 'Les valeurs acquises',
              raisonnement:
                '1 500 × 1,025³ ≈ 1 615,34 € ; 1 500 × 1,025² ≈ 1 575,94 € ; 1 500 × 1,025 = 1 537,50 € ; 1 500 €.',
              invite: 'Calculez la valeur acquise de chaque versement.',
            },
            {
              id: 'formule',
              intitule: 'La formule donnée',
              raisonnement:
                '1 500 × (1,025⁴ − 1) ÷ 0,025 ≈ 6 228,77 €. La somme des valeurs arrondies donne 6 228,78 € : un centime d’arrondi.',
              invite: 'Retrouvez l’épargne avec la formule de la trace écrite.',
            },
            {
              id: 'interets',
              intitule: 'Les intérêts gagnés',
              raisonnement:
                'Versé : 4 × 1 500 = 6 000 €. Intérêts : 6 228,77 − 6 000 = 228,77 €.',
              invite: 'Combien les versements ont-ils rapporté ?',
            },
            {
              id: 'piege',
              intitule: 'Le piège de la durée pleine',
              raisonnement:
                '4 × 1 500 × 1,025⁴ ≈ 6 622,88 € : c’est trop, car le dernier versement ne rapporte rien.',
              invite:
                'Que donnerait le calcul « quatre versements placés quatre ans » ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur les durées (étape 1) et sur l’écart avec la durée pleine (étape 5).',
        'Transition : « À vous, sur l’épargne des machines : exercice 3. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-05-A2-05-ATELIER-ANNUITES',
      titre: 'Exercice 3 — L’épargne des machines',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 9,
      concepts: ['annuites'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 7 min',
        'Réflexion : dessiner la frise des cinq versements et écrire sous chacun sa durée de placement.',
        'Pièges : chaque versement placé cinq ans ; versements additionnés sans intérêts ; intérêts simples.',
        'Papier : exercice 3 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        intitule: 'Exercice 3 — L’épargne des machines',
        consigne:
          'Épargne des machines : 6 000 € versés à la fin de chaque année, de 2026 à 2030, sur un compte à 3 % par an. Résultats au centime.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-05-a2-duree',
            'annuites',
            true,
            'Le versement de fin 2026 : pendant combien d’années rapporte-t-il des intérêts jusqu’à fin 2030 ?',
            'Quatre ans : de fin 2026 à fin 2030',
            [['Cinq ans : la durée du plan', TOUTE_LA_DUREE]],
          ),
          moteur.numerique(
            'b2-05-a2-premier',
            'annuites',
            'Que vaut le versement de fin 2026 à la fin de 2030 ?',
            '€',
            6753.05,
            moteur.DEUX_DECIMALES,
            '6 753,05 €',
            [
              [6955.64, TOUTE_LA_DUREE],
              [6720, INTERETS_SIMPLES],
            ],
          ),
          moteur.vote(
            'b2-05-a2-expression',
            'annuites',
            true,
            'Quelle expression donne l’épargne disponible fin 2030, au dernier versement ?',
            '6 000 × (1,03⁵ − 1) ÷ 0,03',
            [
              ['5 × 6 000 × 1,03⁵', TOUTE_LA_DUREE],
              ['5 × 6 000', SANS_INTERETS],
            ],
          ),
          moteur.numerique(
            'b2-05-a2-valeur-acquise',
            'annuites',
            'Quelle épargne Hélène aura-t-elle à la fin de 2030 ?',
            '€',
            31854.81,
            moteur.DEUX_DECIMALES,
            '31 854,81 €',
            [
              [30000, SANS_INTERETS],
              [32810.46, TOUTE_LA_DUREE],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger question par question, en commençant par la moins réussie.',
        'Transition : « Faisons tenir l’épargne dans un tableau : exercice 4. »',
      ],
    },
    [
      [
        'b2-05-a2-duree',
        'Fin 2026, fin 2027, fin 2028, fin 2029, fin 2030 : quatre années de placement. Seul un versement fait en début de plan rapporterait cinq ans.',
      ],
      [
        'b2-05-a2-premier',
        '6 000 × 1,03⁴ ≈ 6 753,05 €. Placé cinq ans, on trouverait 6 955,64 € ; aux intérêts simples, 6 000 × 1,12 = 6 720 €.',
      ],
      [
        'b2-05-a2-expression',
        'Cinq versements de 6 000 € en fin d’année : la formule donnée avec a = 6 000, t = 0,03 et n = 5. 5 × 6 000 × 1,03⁵ place chaque versement cinq ans ; 5 × 6 000 oublie les intérêts.',
      ],
      [
        'b2-05-a2-valeur-acquise',
        '6 000 × (1,03⁵ − 1) ÷ 0,03 ≈ 31 854,81 €, soit 1 854,81 € d’intérêts. 30 000 € oublie les intérêts ; 32 810,46 € place tout un an de trop.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-05-A2-06-TABLEUR-EPARGNE',
      titre: 'Exercice 4 — L’épargne au tableur',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 8,
      concepts: ['tableur', 'annuites'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 6 min',
        'Réflexion : dire en français la formule de B3, puis l’écrire sur papier.',
        'Erreurs à chercher : =B2+$H$1 (pas d’intérêts) ; F1 ou H1 sans $ ; =C6 pour le total.',
        'Papier : formules écrites sur la copie, puis les valeurs à la calculatrice.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: PLAN_DE_L_EPARGNE,
        questions: [
          {
            type: 'feuille',
            id: PLAN_DE_L_EPARGNE.id,
            concept: 'tableur',
            noteCompte: true,
            corrige: {
              type: 'feuille',
              plan: PLAN_DE_L_EPARGNE,
              attendus: ATTENDUS_DE_L_EPARGNE,
              seuilReussite: 0.8,
            },
          },
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter la feuille d’un poste volontaire ; comparer B6 à la réponse de l’exercice 3.',
        'Transition : jalon 2.',
      ],
    },
    [
      [
        'B3 à B6',
        `${FORMULE_DE_L_EPARGNE}, recopiée : 12 180 € fin 2027, jusqu’à environ 31 854,81 € fin 2030, la valeur de l’exercice 3. =B2+$H$1 additionne les versements sans intérêts.`,
      ],
      [
        'C3 à C6',
        `${FORMULE_DES_INTERETS_DE_L_EPARGNE}, recopiée : 180 €, puis 365,40 €, 556,36 € et 753,05 €. Sans les $, la recopie lit F2, vide, et donne 0.`,
      ],
      [
        'F3',
        `${FORMULE_DU_TOTAL_DES_INTERETS} : environ 1 854,81 € d’intérêts. =C6 ne donne que ceux de 2030.`,
      ],
    ],
  ),
  {
    screenId: 'B2-05-A2-07-JALON',
    titre: 'Jalon 2 : suites d’annuités',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['annuites'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : reprendre la frise des versements de la trace écrite A2-02.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-05-a2-jalon',
        invite:
          'Je sais calculer la valeur acquise d’une suite de versements et la construire au tableur.',
      },
    },
  },
];

const ACTE_3: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-05-A3-01-GRAPHIQUE',
      titre: 'Un emprunt remboursé par annuités constantes',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['tableau-d-amortissement'],
      notes: moteur.puces(
        '2 min : faire décrire les deux couleurs avant de lire la légende.',
        'Question : « La hauteur totale de chaque barre change-t-elle ? » Non : c’est l’annuité, constante.',
        'Transition : « Pourquoi les intérêts baissent-ils ? »',
      ),
    },
    'chart',
    {
      title: 'Emprunt type : 100 000 € sur 10 ans à 5 %',
      caption: 'Décomposition de chaque annuité, en euros',
      kind: 'bars',
      unit: '€',
      labels: termes((annee) => `Année ${annee}`, 1, DUREE_DE_L_EMPRUNT_TYPE),
      series: [
        {
          label: 'Intérêts',
          values: LIGNES_DE_L_EMPRUNT_TYPE.map((ligne) =>
            auCentime(ligne.interets),
          ),
          tone: 'ink',
        },
        {
          label: 'Amortissement du capital',
          values: LIGNES_DE_L_EMPRUNT_TYPE.map((ligne) =>
            auCentime(ligne.amortissement),
          ),
          tone: 'teal',
        },
      ],
      formula:
        'Annuité = intérêts + amortissement, environ 12 950,46 € chaque année',
      reading:
        'Chaque année, la barre a la même hauteur : l’annuité. Les intérêts baissent, car ils portent sur un capital restant dû de plus en plus petit ; l’amortissement monte d’autant.',
      source: `Emprunt type. ${DONNEES_FICTIVES}`,
      description:
        'Dix barres de même hauteur totale. La part des intérêts part de 5 000 € en année 1 et descend jusqu’à 617 € environ en année 10 ; la part de l’amortissement monte de 7 950 € environ à 12 334 € environ.',
    },
  ),
  {
    screenId: 'B2-05-A3-02-VOTE-EMPRUNT',
    titre: 'Vote : rembourser et payer les intérêts',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 4,
    concepts: ['tableau-d-amortissement', 'cout-du-credit'],
    notes: moteur.notesDuVoteQuiOuvreLaNotion(3),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-05-a3-rembourse',
          'tableau-d-amortissement',
          false,
          'Une annuité de 13 000 € contient 2 000 € d’intérêts. Quelle part du capital emprunté rembourse-t-elle ?',
          '11 000 € : l’annuité moins les intérêts',
          [['13 000 € : toute l’annuité', ANNUITE_POUR_AMORTISSEMENT]],
        ),
        moteur.vote(
          'b2-05-a3-cout-vote',
          'cout-du-credit',
          false,
          'On emprunte 10 000 € et l’on rembourse 11 200 € en tout. Combien le crédit a-t-il coûté ?',
          '1 200 € : le total remboursé moins le capital',
          [['11 200 € : le total remboursé', TOTAL_REMBOURSE]],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Rembourser, ce n’est pas seulement rendre le capital',
        lignes: [
          'Une annuité paie d’abord les intérêts de l’année ; le reste, l’amortissement, rembourse le capital : 13 000 − 2 000 = 11 000 €.',
          'Le coût du crédit est ce que l’on paie en plus du capital : 11 200 − 10 000 = 1 200 €.',
          'La trace écrite construit le tableau d’amortissement ligne par ligne.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-05-A3-03-COURS-EMPRUNT',
      titre: 'Cours : emprunt et tableau d’amortissement',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['tableau-d-amortissement', 'annuites'],
      notes: moteur.puces(
        '3 min ; la trace écrite est imprimée dans le livret.',
        'Remplir au tableau la première ligne de l’exemple, puis la deuxième : faire dire sur quel capital portent les intérêts.',
        'Lien au dossier : « L’emprunt d’Hélène, 60 000 € : combien d’intérêts la première année ? »',
      ),
    },
    'lesson',
    {
      title: 'Emprunter : intérêts, amortissement, annuité',
      subtitle: 'Trace écrite · notion 3 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Une annuité paie les intérêts, puis rembourse',
          text: 'Un emprunt de capital C, au taux t, sur n années, se rembourse par annuités constantes a. Chaque annuité paie les intérêts de l’année, calculés sur le capital restant dû en début d’année ; le reste, l’amortissement, rembourse le capital. Les intérêts baissent donc chaque année, et l’amortissement monte. L’annuité est donnée au CCF par une formule.',
          formula:
            'a = C × t ÷ (1 − (1 + t)⁻ⁿ) · intérêts = capital restant dû × t · amortissement = a − intérêts',
        },
        {
          kind: 'example',
          title: 'Pour débuter : 10 000 € sur 3 ans à 5 %',
          text: 'a = 10 000 × 0,05 ÷ (1 − 1,05⁻³) ≈ 3 672,09 €.',
          steps: [
            'Année 1 : intérêts 10 000 × 0,05 = 500 € ; amortissement 3 672,09 − 500 = 3 172,09 €.',
            'Capital restant dû : 10 000 − 3 172,09 = 6 827,91 €.',
            'Année 2 : intérêts 6 827,91 × 0,05 ≈ 341,40 € ; amortissement 3 330,69 €.',
            'La dernière ligne solde le capital, au centime d’arrondi près.',
          ],
        },
        {
          kind: 'method',
          title: 'Remplir le tableau ligne par ligne',
          text: 'Pièges : calculer les intérêts chaque année sur le capital emprunté ; prendre l’annuité pour l’amortissement ; oublier de retirer l’amortissement du capital restant dû.',
          steps: [
            'Capital dû en début d’année : le capital emprunté, puis la fin d’année précédente.',
            'Intérêts : capital dû × t.',
            'Amortissement : annuité − intérêts.',
            'Capital dû en fin d’année : début − amortissement ; il tombe à 0 à la dernière ligne.',
          ],
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-05-A3-04-COURS-COUT-TABLEUR',
      titre: 'Cours : coût du crédit et tableur',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['cout-du-credit', 'tableur'],
      notes: moteur.puces(
        '3 min, enchaînées sur la page 1 : 6 min pour les deux pages.',
        'Faire taper VPM sans le signe moins sur un poste volontaire : l’annuité sort négative, l’erreur fixe la règle.',
        'Question : « Le coût du crédit, c’est ce que je rembourse ? » Non : ce que je rembourse en plus.',
      ),
    },
    'lesson',
    {
      title: 'Coût du crédit et tableau d’amortissement au tableur',
      subtitle: 'Trace écrite · notion 3 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Le coût du crédit',
          text: 'Le coût du crédit est ce que l’emprunteur paie en plus du capital : le total remboursé moins le capital emprunté. C’est aussi la somme des intérêts du tableau, à quelques centimes près quand l’annuité est arrondie.',
          formula: 'Coût = n × a − C = somme des intérêts',
        },
        {
          kind: 'method',
          title: 'Au tableur : VPM et formules recopiées',
          text: 'VPM(taux ; durée ; capital) renvoie l’annuité avec la convention du tableur : un capital reçu positif donne une annuité à payer négative. On écrit donc le capital avec un signe moins.',
          steps: [
            'Taux en B1, durée en B2, capital emprunté en B3 : =VPM(B1;B2;-B3).',
            'Capital dû en B2 et taux en G1 : intérêts =B2*$G$1, recopiée.',
            'Amortissement : annuité figée moins intérêts ; capital en fin d’année : début moins amortissement.',
            'Coût : annuité × durée − capital.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : les formules d’un tableau d’amortissement',
          text: 'Un sujet donne souvent un tableau à compléter et demande les formules de deux cellules, à recopier vers le bas. Pièges : taux ou annuité non figés ; annuité négative par oubli du signe ; total remboursé donné pour le coût.',
          steps: [
            'Nommer chaque colonne en français avant d’écrire sa formule.',
            'Figer par des $ ce qui ne change pas d’une ligne à l’autre.',
            'Contrôle : dernier capital dû égal à 0 ; somme des amortissements égale au capital.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-05-A3-05-EXEMPLE-EMPRUNT',
      titre: 'Exemple guidé : emprunter 24 000 € à 3 %',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['tableau-d-amortissement', 'cout-du-credit'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape, puis la correction se dévoile étape par étape sur ce même écran.',
        'Papier : réponses sous chaque étape du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-05-a3-exemple-emprunt',
          enonce:
            'Atelier Rivage finance une machine à coudre industrielle : 24 000 € empruntés sur 4 ans au taux annuel de 3 %, remboursés par annuités constantes.',
          etapes: [
            {
              id: 'annuite',
              intitule: 'L’annuité',
              raisonnement: 'a = 24 000 × 0,03 ÷ (1 − 1,03⁻⁴) ≈ 6 456,65 €.',
              invite: 'Calculez l’annuité avec la formule de la trace écrite.',
            },
            {
              id: 'ligne-1',
              intitule: 'La première ligne',
              raisonnement:
                'Intérêts : 24 000 × 0,03 = 720 € ; amortissement : 6 456,65 − 720 = 5 736,65 € ; reste dû : 18 263,35 €.',
              invite:
                'Calculez les intérêts, l’amortissement et le capital restant dû de l’année 1.',
            },
            {
              id: 'ligne-2',
              intitule: 'La deuxième ligne',
              raisonnement:
                'Intérêts : 18 263,35 × 0,03 ≈ 547,90 €, et non 720 € ; amortissement : 5 908,75 € ; reste dû : 12 354,60 €.',
              invite: 'Même travail pour l’année 2.',
            },
            {
              id: 'cout',
              intitule: 'Le coût du crédit',
              raisonnement:
                '4 × 6 456,65 − 24 000 = 1 826,60 €. Le total remboursé, 25 826,60 €, n’est pas le coût.',
              invite: 'Combien ce crédit coûte-t-il ?',
            },
            {
              id: 'tableur',
              intitule: 'Au tableur',
              raisonnement:
                '=VPM(A1;A2;-A3) ≈ 6 456,65 € ; sans le signe moins, −6 456,65 €.',
              invite:
                'Taux en A1, durée en A2, capital en A3 : quelle formule donne l’annuité ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur la base des intérêts de l’année 2 (étape 3) et sur le coût (étape 4).',
        'Transition : « À vous, sur l’emprunt d’Hélène : exercice 5. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-05-A3-06-ATELIER-EMPRUNT',
      titre: 'Exercice 5 — L’emprunt de 60 000 €',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['tableau-d-amortissement', 'cout-du-credit', 'tableur'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 6 min',
        'Réflexion : écrire C, t et n, puis poser la formule de l’annuité sans l’effectuer.',
        'Pièges : 60 000 ÷ 5 ; intérêts toujours sur 60 000 € ; total remboursé pris pour le coût ; VPM sans signe moins.',
        'Papier : exercice 5 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        intitule: 'Exercice 5 — L’emprunt de 60 000 €',
        consigne:
          'Emprunt d’équipement : 60 000 € sur 5 ans au taux annuel de 4 %, remboursés par annuités constantes a = C × t ÷ (1 − (1 + t)⁻ⁿ). Résultats au centime.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b2-05-a3-annuite',
            'tableau-d-amortissement',
            'Quelle est l’annuité de l’emprunt ?',
            '€',
            ANNUITE_ARRONDIE,
            moteur.DEUX_DECIMALES,
            '13 477,63 €',
            [
              [EMPRUNT / DUREE_DE_L_EMPRUNT, ANNUITE_POUR_AMORTISSEMENT],
              [
                EMPRUNT / DUREE_DE_L_EMPRUNT + EMPRUNT * TAUX_DE_L_EMPRUNT,
                CAPITAL_INITIAL,
              ],
            ],
          ),
          moteur.vote(
            'b2-05-a3-base',
            'tableau-d-amortissement',
            true,
            'Sur quel capital calcule-t-on les intérêts de la deuxième année ?',
            'Sur le capital restant dû au début de la deuxième année',
            [['Sur les 60 000 € empruntés', CAPITAL_INITIAL]],
          ),
          moteur.numerique(
            'b2-05-a3-cout',
            'cout-du-credit',
            'Quel est le coût du crédit, avec l’annuité arrondie au centime ?',
            '€',
            auMillionieme(DUREE_DE_L_EMPRUNT * ANNUITE_ARRONDIE - EMPRUNT),
            { type: 'absolue', valeur: 0.05 },
            '7 388,15 €',
            [
              [DUREE_DE_L_EMPRUNT * ANNUITE_ARRONDIE, TOTAL_REMBOURSE],
              [
                DUREE_DE_L_EMPRUNT * EMPRUNT * TAUX_DE_L_EMPRUNT,
                CAPITAL_INITIAL,
              ],
            ],
          ),
          moteur.vote(
            'b2-05-a3-vpm',
            'tableur',
            true,
            'Taux en F1, durée en F2, capital emprunté en F3 : quelle formule affiche l’annuité, positive ?',
            '=VPM(F1;F2;-F3)',
            [
              ['=VPM(F1;F2;F3)', VPM_NON_SIGNE],
              ['=F3/F2', ANNUITE_POUR_AMORTISSEMENT],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger question par question, en commençant par la moins réussie.',
        'Transition : « L’annuité est trouvée : remplissons le tableau d’amortissement, exercice 6. »',
      ],
    },
    [
      [
        'b2-05-a3-annuite',
        'a = 60 000 × 0,04 ÷ (1 − 1,04⁻⁵) ≈ 13 477,63 €. 60 000 ÷ 5 = 12 000 € ne rembourse que le capital ; 12 000 + 2 400 = 14 400 € garde les intérêts de la première année chaque année.',
      ],
      [
        'b2-05-a3-base',
        'Les intérêts portent sur ce qui reste dû : 60 000 − 11 077,63 = 48 922,37 € au début de la deuxième année, soit 1 956,89 € d’intérêts.',
      ],
      [
        'b2-05-a3-cout',
        '5 × 13 477,63 − 60 000 = 7 388,15 €. 67 388,15 € est le total remboursé ; 5 × 2 400 = 12 000 € calcule les intérêts sur 60 000 € chaque année.',
      ],
      [
        'b2-05-a3-vpm',
        'Le tableur renvoie une annuité négative pour un capital positif : le signe moins devant F3 la rend positive. =F3/F2 ne donne que l’amortissement moyen, sans intérêts.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-05-A3-07-TABLEAU-AMORTISSEMENT',
      titre: 'Exercice 6 — Le tableau d’amortissement',
      diffusion: 'seance',
      brique: 'fp-table-build',
      dureeMinutes: 6,
      concepts: ['tableau-d-amortissement'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 5 min',
        'Réflexion : dire en français comment passer d’une ligne à la suivante.',
        'Pièges : intérêts sur 60 000 € chaque année ; annuité écrite comme amortissement.',
        'Papier : tableau du livret, rempli à la main, calculs arrondis au centime.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: {
          id: 'b2-05-a3-tableau-amortissement',
          intitule: 'Le tableau d’amortissement de l’emprunt de 60 000 €',
          consignes: [
            'Emprunt de 60 000 € sur 5 ans à 4 %, annuité de 13 477,63 €.',
            'Pour chaque année, saisissez les intérêts (capital dû × 0,04), puis l’amortissement (annuité − intérêts), arrondis au centime.',
            'Le capital dû en début d’année se calcule seul à partir de vos saisies ; le solde final contrôle votre tableau.',
          ],
          echeances: DUREE_DE_L_EMPRUNT,
          intituleDesLignes: 'Année',
          libellesLignes: termes(
            (annee) => `Année ${annee}`,
            1,
            DUREE_DE_L_EMPRUNT,
          ),
          parametres: { emprunt: EMPRUNT },
          colonnes: [
            {
              cle: 'capital',
              intitule: 'Capital dû en début d’année (€)',
              role: 'deduite',
              formuleInitiale: 'emprunt',
              formule: 'avantCapital - avantAmortissement',
              decimales: 2,
              totalise: false,
            },
            {
              cle: 'interets',
              intitule: 'Intérêts (€)',
              role: 'saisie',
              decimales: 2,
              totalise: true,
            },
            {
              cle: 'amortissement',
              intitule: 'Amortissement (€)',
              role: 'saisie',
              decimales: 2,
              soldeDe: 'capital',
              totalise: true,
            },
            {
              cle: 'annuite',
              intitule: 'Annuité (€)',
              role: 'donnee',
              valeurs: termes(() => ANNUITE_ARRONDIE, 1, DUREE_DE_L_EMPRUNT),
              decimales: 2,
              totalise: true,
            },
          ],
          synthese: [],
        },
        questions: [
          moteur.questionDeTableau(
            'b2-05-a3-tableau-amortissement',
            'tableau-d-amortissement',
            [PREMIERE_LIGNE_D_AMORTISSEMENT, ...AUTRES_LIGNES_D_AMORTISSEMENT],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter le tableau juste, ligne par ligne ; faire lire la colonne des intérêts de haut en bas.',
        'Transition : « Une IA a fait le même calcul. »',
      ],
    },
    [
      [
        'b2-05-a3-tableau-amortissement',
        'Intérêts : 2 400 ; 1 956,89 ; 1 496,07 ; 1 016,80 ; 518,37 €. Amortissements : 11 077,63 ; 11 520,74 ; 11 981,56 ; 12 460,83 ; 12 959,26 €. Le solde final de −0,02 € vient de l’annuité arrondie au centime : c’est aussi l’écart entre le coût du crédit, 7 388,15 €, et la somme des intérêts, 7 388,13 €.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-05-A3-08-DEFI-IA',
      titre: 'Exercice 7 — Corriger le calcul d’une IA',
      diffusion: 'seance',
      brique: 'fp-challenge',
      dureeMinutes: 8,
      concepts: ['tableau-d-amortissement', 'cout-du-credit'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 6 min',
        'Réflexion : relire les traces écrites de la notion 3.',
        'Repérer qui trouve la formule, la base des intérêts et le coût ; faire trouver la piste fausse avant de révéler.',
        'Papier : exercice 7 du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        probleme: {
          id: 'b2-05-a3-defi-ia',
          enonce:
            'Hélène a demandé à un assistant IA de chiffrer l’emprunt de 60 000 € sur 5 ans à 4 %. Réponse : « 1. Chaque année, vous remboursez 60 000 ÷ 5 = 12 000 € de capital, plus 60 000 × 4 % = 2 400 € d’intérêts : l’annuité est de 14 400 €. 2. Les intérêts restent de 2 400 € chaque année, puisque le taux ne change pas. 3. Le coût du crédit est de 5 × 14 400 = 72 000 €. »',
          invite:
            'Trouvez les erreurs de l’IA, corrigez chacune et dites comment la contrôler.',
        },
        corrige: {
          type: 'defi',
          strategies: [
            moteur.strategie(
              'formule',
              'L’annuité constante se calcule avec la formule donnée, a = C × t ÷ (1 − (1 + t)⁻ⁿ), et non en ajoutant les intérêts de la première année au capital divisé par la durée.',
            ),
            moteur.strategie(
              'base',
              'Les intérêts portent sur le capital restant dû, qui diminue : ils baissent chaque année.',
            ),
            moteur.strategie(
              'cout',
              'Le coût du crédit est le total remboursé moins le capital, pas le total remboursé.',
            ),
            moteur.strategie(
              'controle',
              'Contrôler par le tableau : la somme des amortissements doit redonner les 60 000 € empruntés.',
            ),
            moteur.strategie(
              'garder',
              'Garder le calcul : il rembourse bien 60 000 € et paie des intérêts.',
              true,
            ),
          ],
        },
      },
    },
    {
      minutes: 2,
      notes: [
        'Faire lire deux corrections de la classe, puis dévoiler les pistes une à une en recalculant l’annuité.',
        'Transition : jalon 3, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'formule',
        'a = 60 000 × 0,04 ÷ (1 − 1,04⁻⁵) ≈ 13 477,63 € : l’IA surestime l’annuité de près de 1 000 € par an.',
      ],
      [
        'base',
        'Deuxième année : 48 922,37 × 0,04 ≈ 1 956,89 €, et non 2 400 €. Les intérêts baissent jusqu’à 518,37 € la dernière année.',
      ],
      [
        'cout',
        '72 000 € est un total remboursé, et encore faux ; le coût est 5 × 13 477,63 − 60 000 = 7 388,15 €.',
      ],
      [
        'controle',
        'Avec l’IA, les amortissements font bien 60 000 €, mais les intérêts, 12 000 €, ne suivent pas le capital restant dû : le tableau juste en donne 7 388,13 €.',
      ],
      [
        'garder',
        'Piste fausse : rembourser le capital ne suffit pas, les intérêts doivent suivre le capital restant dû.',
      ],
    ],
  ),
  {
    screenId: 'B2-05-A3-09-JALON',
    titre: 'Jalon 3 : emprunts',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['tableau-d-amortissement', 'cout-du-credit'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Pause de 15 minutes, hors durée programmée.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-05-a3-jalon',
        invite:
          'Je sais calculer une annuité, remplir un tableau d’amortissement et donner le coût d’un crédit.',
      },
    },
  },
];

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  [TAUX_POUR_COEFFICIENT]: 'B2-05-A1-07-COURS-INTERETS-COMPOSES',
  'nature-de-suite-confondue': 'B2-05-A1-07-COURS-INTERETS-COMPOSES',
  [INTERETS_SIMPLES]: 'B2-05-A1-07-COURS-INTERETS-COMPOSES',
  'rang-decale': 'B2-05-A1-07-COURS-INTERETS-COMPOSES',
  [ACTUALISATION_INVERSEE]: 'B2-05-A1-08-COURS-VALEUR-ACTUELLE',
  'reciproque-meme-taux': 'B2-05-A1-08-COURS-VALEUR-ACTUELLE',
  [NON_FIGEE]: 'B2-05-A1-08-COURS-VALEUR-ACTUELLE',
  [SANS_INTERETS]: 'B2-05-A2-02-COURS-ANNUITES',
  [TOUTE_LA_DUREE]: 'B2-05-A2-02-COURS-ANNUITES',
  'nombre-de-termes-decale': 'B2-05-A2-02-COURS-ANNUITES',
  'terme-pris-pour-somme': 'B2-05-A2-03-COURS-ANNUITES-TABLEUR',
  [CAPITAL_INITIAL]: 'B2-05-A3-03-COURS-EMPRUNT',
  [ANNUITE_POUR_AMORTISSEMENT]: 'B2-05-A3-03-COURS-EMPRUNT',
  [TOTAL_REMBOURSE]: 'B2-05-A3-04-COURS-COUT-TABLEUR',
  [VPM_NON_SIGNE]: 'B2-05-A3-04-COURS-COUT-TABLEUR',
};

export const COURS_B2_05 = moteur.coursB2(
  [ACTE_1, ACTE_2, ACTE_3, ACTE_4],
  REMEDIATIONS,
  [],
  {
    slug: 'b2-05-mathematiques-financieres',
    titre: 'Mathématiques financières : placer, emprunter',
    gabarit: 'v3',
    dureeMinutes: 180,
    concepts: [...CONCEPTS_DU_COURS],
  },
);
