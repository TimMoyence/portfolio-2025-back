import type { ContenuDeCours } from '../../../../domain/cours/stockage/CoursStocke';
import {
  auCentime,
  auDixieme,
  auMillieme,
  auMillionieme,
} from '../../../../../../common/domain/nombres/arrondi';
import {
  avecVirgule,
  nombreFrancais,
} from '../../../../../../common/domain/nombres/ecriture-francaise';
import { ARRONDI_OUBLIE, DONNEES_FICTIVES } from '../b1-01/b1-01.donnees';
import { ACTE_4 } from './b1-04.acte-4';
import {
  AJUSTEMENT_A_LA_TEMPERATURE,
  AJUSTEMENT_AUX_SOIREES,
  AJUSTEMENT_D_ANGERS,
  AJUSTEMENT_DE_L_ANNALE,
  AJUSTEMENT_DES_CHOCOLATS,
  AJUSTEMENT_DU_SITE,
  ANNALE_INVERSEE,
  ANNEE_DEMANDEE,
  BUDGETS_DU_SITE,
  CA_D_ANGERS,
  CA_DU_SITE,
  CAFES_DE_TOURS,
  CAFES_ET_MATCHS,
  CAFES_ET_TEMPERATURE,
  CAUSALITE,
  CHOCOLATS_CHAUDS,
  CONCEPTS_DU_COURS,
  DROITE_D,
  ESPERANCES_DE_VIE,
  EXTRAPOLATION,
  FEUILLE_DE_L_AJUSTEMENT,
  FEUILLE_DE_LA_CORRELATION,
  JEUX_VENDUS,
  MATCHS_DE_TOURS,
  MOIS_D_HIVER,
  NON_FIGEE,
  PENTE_INVERSEE,
  POINT_MOYEN_CONFONDU,
  PREMIERE_ANNEE_DE_L_ANNALE,
  R_POUR_PENTE,
  RANG_POUR_ANNEE,
  RENVOI_AU_DOSSIER,
  RENVOI_AU_NUAGE_DE_L_ANNALE,
  SEUIL,
  SEUIL_DE_L_ANNALE,
  SIGNE,
  SOIREES_D_ANGERS,
  TEMPERATURES_DE_TOURS,
} from './b1-04.donnees';
import * as moteur from '../../briques';
import { GRAVURE_DE_GALTON as GRAVURE_DE_L_ACCROCHE } from '../../gravures';

const DOSSIER_DES_IMAGES = '/assets/cours/b1-04/v1';

const pourComprendre = moteur.pourComprendreDans(DOSSIER_DES_IMAGES);

const enMillieme = (valeur: number): string =>
  nombreFrancais(auMillieme(valeur), 3);
const enCentieme = (valeur: number): string =>
  nombreFrancais(auCentime(valeur), 2);
const droiteEcrite = (pente: number, ordonnee: number): string =>
  `y = ${avecVirgule(pente)}x + ${avecVirgule(ordonnee)}`;

const ANGERS = AJUSTEMENT_D_ANGERS;
const DROITE_D_ANGERS = droiteEcrite(
  auCentime(ANGERS.pente),
  auCentime(ANGERS.ordonnee),
);
const parAngers = (soirees: number): number =>
  auCentime(auCentime(ANGERS.pente) * soirees + auCentime(ANGERS.ordonnee));
const SOIREES_INTERPOLEES = 5;
const SOIREES_EXTRAPOLEES = 30;
const SEUIL_D_ANGERS = 20;
const SOLUTION_DU_SEUIL_D_ANGERS =
  (SEUIL_D_ANGERS - auCentime(ANGERS.ordonnee)) / auCentime(ANGERS.pente);

const parLaDroiteD = (rang: number): number =>
  auMillionieme(DROITE_D.pente * rang + DROITE_D.ordonnee);

function premierRangAuDessusDuSeuil(): number {
  let rang = 0;
  while (parLaDroiteD(rang) <= SEUIL_DE_L_ANNALE) {
    rang += 1;
  }
  return rang;
}

const RANG_DEMANDE = ANNEE_DEMANDEE - PREMIERE_ANNEE_DE_L_ANNALE;
const RANG_DU_DEPASSEMENT = premierRangAuDessusDuSeuil();
const RANG_DE_L_EGALITE = RANG_DU_DEPASSEMENT - 1;
const DERNIER_RANG_OBSERVE = ESPERANCES_DE_VIE.length - 1;
const ESPERANCE_MAXIMALE = Math.max(...ESPERANCES_DE_VIE);
const RANGS_DU_MAXIMUM = ESPERANCES_DE_VIE.flatMap((y, rang) =>
  y === ESPERANCE_MAXIMALE ? [rang] : [],
);

const ACTE_1: moteur.Acte = [
  {
    screenId: 'B1-04-A1-01-DIAGNOSTIC-DROITE',
    titre: 'Diagnostic : une droite, sans calculatrice',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 4,
    concepts: ['ajustement-affine'],
    notes: moteur.puces(
      '4 min : écrire au tableau l’adresse et le code de séance.',
      'Rappel du collège : dans y = ax + b, a multiplie x, b s’ajoute.',
      'Annoncer « seule la participation compte ». Sans calculatrice.',
      'Papier : la question est en tête du livret ; vote à main levée.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b1-04-a1-diagnostic-droite',
          'ajustement-affine',
          true,
          'Sur la droite y = 2x + 3, que vaut y pour x = 4 ?',
          '2 × 4 + 3 = 11',
          [['3 × 4 + 2 = 14', PENTE_INVERSEE]],
        ),
      ],
      delaiMs: 0,
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B1-04-A1-02-ACCROCHE',
      titre: 'Séries à deux variables : ajuster et prévoir',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['nuage-de-points', 'prevision'],
      notes: moteur.puces(
        'Annoncer les deux pauses de 15 minutes, après l’acte 1 et après l’acte 3.',
        'Raconter : en 1875, Francis Galton place sur un même dessin la taille des pois de parents et de leurs descendants ; il y voit une droite. La corrélation est née.',
      ),
    },
    'hero',
    {
      title: 'Séries à deux variables : ajuster et prévoir',
      subtitle:
        'Partie Libre veut prévoir son chiffre d’affaires. Votre dossier : un nuage à tracer, une droite à obtenir, deux ajustements à comparer, une prévision à faire avec prudence.',
      bgImage: GRAVURE_DE_L_ACCROCHE.chemins[0],
      bgImageAlt:
        'Diagramme de corrélation de Francis Galton (1875) : la taille de pois de parents en abscisse, celle de leurs descendants en ordonnée, et la droite qui les relie',
    },
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B1-04-A1-03-VOTE-DIAGNOSTIC',
      titre: 'Vote : un point au centre, une droite qui monte',
      dureeMinutes: 4,
      concepts: ['nuage-de-points', 'ajustement-affine'],
      notes: moteur.notesDuVoteQuiOuvreLaNotion(1),
    },
    [
      moteur.vote(
        'b1-04-a1-vote-point-moyen',
        'nuage-de-points',
        false,
        'Trois mois : budgets de publicité 100, 200 et 300 € ; chiffres d’affaires 5, 9 et 10 k€. Quel point résume les trois mois ?',
        '(200 ; 8), la moyenne des budgets et la moyenne des chiffres d’affaires',
        [['(600 ; 24), les sommes', POINT_MOYEN_CONFONDU]],
      ),
      moteur.vote(
        'b1-04-a1-vote-pente',
        'ajustement-affine',
        false,
        'Le CA suit la droite y = 30x + 500, x étant le budget de publicité en euros. Que rapporte 1 € de publicité en plus ?',
        '30 € de chiffre d’affaires en plus',
        [['500 € de chiffre d’affaires en plus', PENTE_INVERSEE]],
      ),
    ],
  ),
  moteur.ecranV2(
    {
      screenId: RENVOI_AU_DOSSIER,
      titre: 'La publicité et les ventes du site web',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['nuage-de-points'],
      notes: moteur.puces(
        '1 min de lecture silencieuse ; ne rien calculer.',
        'Faire dire ce que représente un mois : un couple (budget ; chiffre d’affaires).',
      ),
    },
    'table',
    {
      title: 'La publicité et les ventes du site web',
      subtitle: 'Les dix premiers mois de 2026, avant le budget de décembre.',
      columns: [...moteur.COLONNES_DU_DOSSIER],
      rows: [
        {
          rubrique: 'L’entreprise',
          contenu:
            'Partie Libre : quatre boutiques-bars à jeux, à Nantes, Angers, Tours et Le Mans, et un site web.',
        },
        {
          rubrique: 'Les deux séries',
          contenu:
            'Pour chaque mois de janvier à octobre 2026 : le budget de publicité en ligne du site web (x, en €) et son chiffre d’affaires (y, en €).',
        },
        {
          rubrique: 'Le premier mois',
          contenu: `Janvier : ${BUDGETS_DU_SITE[0]} € de publicité, ${nombreFrancais(CA_DU_SITE[0], 0)} € de chiffre d’affaires.`,
        },
        {
          rubrique: 'La question d’Inès',
          contenu:
            '« En décembre, je mettrais 1 500 € de publicité. Quel chiffre d’affaires attendre, et peut-on s’y fier ? »',
        },
      ],
      note: DONNEES_FICTIVES,
    },
  ),
  {
    screenId: 'B1-04-A1-05-MISSION',
    titre: 'Votre mission : que rapporte la publicité ?',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 6,
    concepts: ['nuage-de-points', 'ajustement-affine', 'prevision'],
    notes: moteur.puces(
      'Lecture à voix haute (1 min), puis 4 min d’écriture individuelle et 1 min de mise en commun au pupitre.',
      'Consigne orale : sans calculatrice. Enjeu : Inès fixe le budget de décembre.',
      'Question 3 : ne pas trancher, c’est l’acte 3.',
      'Papier : trois lignes d’écriture dans le livret.',
    ),
    proprietes: {
      metier:
        'Alternant·e assistant·e de gestion — Partie Libre (boutiques-bars à jeux, 40 salariés, Nantes)',
      situation: [
        'Lundi, 9 h. Inès Marchal prépare le budget de décembre du site web.',
        '« Plus on fait de publicité, plus on vend, mais de combien ? Il me faut une règle pour prévoir. »',
        'Théo propose de prendre le CA moyen par euro de publicité et de le multiplier par 1 500.',
      ].join('\n'),
      geste: null,
      consequence: null,
      questionsLibres: [
        {
          id: 'b1-04-a1-mission:nuage',
          question:
            'Comment voir d’un coup d’œil si le budget et le chiffre d’affaires vont ensemble ?',
          placeholder: 'On pourrait placer…',
        },
        {
          id: 'b1-04-a1-mission:droite',
          question:
            'Si les points sont presque alignés, quelle droite tracer pour résumer la tendance ?',
          placeholder: 'Une droite qui passe…',
        },
        {
          id: 'b1-04-a1-mission:prudence',
          question:
            'Aucun mois n’a reçu 1 500 € de publicité. Peut-on se fier à la prévision ?',
          placeholder: 'Oui, parce que… / Non, parce que…',
        },
      ],
    },
  },
  pourComprendre(
    {
      screenId: 'B1-04-A1-06-ENFANT-PLATEAU',
      titre: 'Tenir en équilibre sur un doigt',
      concepts: ['nuage-de-points'],
    },
    {
      fichier: 'plateau-equilibre.webp',
      scene:
        'Les biscuits sont éparpillés sur le plateau ; il tient à plat sur un seul doigt, glissé là où ils pèsent le plus.',
      imageAlt:
        'Dessin : un enfant tient un grand plateau sur un seul doigt ; une douzaine de biscuits éparpillés dessus, plus serrés vers un coin ; le plateau reste à plat, un autre enfant s’en étonne.',
      regle:
        'chaque mois devient un point (x ; y) du nuage de points ; le point moyen G(x̄ ; ȳ) est le centre d’équilibre du nuage.',
      correspondances: [
        ['Le plateau', 'le repère, x en abscisse, y en ordonnée'],
        ['Un biscuit', 'un point (xᵢ ; yᵢ), un mois'],
        ['Le doigt sous le plateau', 'le point moyen G(x̄ ; ȳ)'],
      ],
    },
    'Question : « Le doigt est-il au milieu du plateau ? » Non : là où les biscuits sont nombreux, comme G est la moyenne des points.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-04-A1-06-COURS-NUAGE',
      titre: 'Cours : nuage de points et point moyen',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['nuage-de-points'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : un mois, un point.',
      ),
    },
    'lesson',
    {
      title: 'Le nuage de points : un mois, un point',
      subtitle: 'Trace écrite · notion 1 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Série à deux variables',
          text: 'Chaque individu porte deux mesures, x et y : on place le point (xᵢ ; yᵢ).\nLe point moyen G a pour coordonnées la moyenne des x et la moyenne des y.',
          formula: 'G(x̄ ; ȳ)\nx̄ = (x₁ + … + xₙ) ÷ n ; ȳ = (y₁ + … + yₙ) ÷ n',
        },
        {
          kind: 'example',
          title: 'Pour débuter : trois semaines de Léa',
          text: 'Heures de révision 2, 4 et 6 ; notes 9, 11 et 16.',
          steps: [
            'Trois points : (2 ; 9), (4 ; 11), (6 ; 16).',
            'x̄ = 12 ÷ 3 = 4 ; ȳ = 36 ÷ 3 = 12.',
            'G(4 ; 12), au centre du nuage.',
          ],
        },
        {
          kind: 'method',
          title: 'Un mois, un point',
          text: 'Avant tout calcul, regarder la forme du nuage.',
          steps: [
            'x en abscisse, y en ordonnée, une graduation régulière par axe.',
            'Les points presque alignés ? Un ajustement affine a un sens.',
            'Au tableur : =MOYENNE(plage des x) et =MOYENNE(plage des y).',
          ],
        },
      ],
    },
  ),
  pourComprendre(
    {
      screenId: 'B1-04-A1-07-ENFANT-BATON',
      titre: 'Le bâton au plus près des cailloux',
      concepts: ['ajustement-affine'],
    },
    {
      fichier: 'baton-ficelles.webp',
      scene:
        'Un bâton est posé entre les cailloux ; une ficelle tendue relie chaque caillou au bâton, et on le pousse pour que les ficelles soient, ensemble, les plus courtes.',
      imageAlt:
        'Dessin : une dizaine de cailloux qui montent de gauche à droite ; un long bâton posé en travers ; de chaque caillou, une petite ficelle verticale tendue jusqu’au bâton ; un enfant ajuste le bâton.',
      regle:
        'la droite des moindres carrés y = ax + b rend la somme des carrés des écarts verticaux la plus petite possible.',
      correspondances: [
        ['Les cailloux', 'les points du nuage'],
        ['Le bâton', 'la droite d’ajustement y = ax + b'],
        ['Une ficelle verticale', 'l’écart entre yᵢ et axᵢ + b'],
        ['Le bâton le plus près de tous', 'la droite des moindres carrés'],
      ],
    },
    'Question : « Peut-on rendre une ficelle nulle sans allonger les autres ? » Rarement : on cherche le meilleur compromis.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-04-A1-07-COURS-DROITE',
      titre: 'Cours : la droite des moindres carrés',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['ajustement-affine', 'tableur'],
      notes: moteur.puces(
        moteur.DEUXIEME_PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : les y d’abord.',
        'Montrer à la calculatrice le menu de régression linéaire, sans lire de résultat du dossier.',
      ),
    },
    'lesson',
    {
      title: 'La droite des moindres carrés : les y d’abord',
      subtitle: 'Trace écrite · notion 1 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'La droite d’ajustement de y en x',
          text: 'La calculatrice ou le tableur donne a et b de la droite des moindres carrés.\nElle passe toujours par le point moyen G.',
          formula:
            'y = ax + b\na : =PENTE(plage des y;plage des x)\nb : =ORDONNEE.ORIGINE(plage des y;plage des x)\nȳ = a × x̄ + b',
        },
        {
          kind: 'example',
          title: 'Pour débuter : les trois semaines de Léa',
          text: 'Points (2 ; 9), (4 ; 11), (6 ; 16), G(4 ; 12).',
          steps: [
            'Calculatrice : a = 1,75 et b = 5.',
            'Contrôle par G : 1,75 × 4 + 5 = 12.',
            'Lecture : une heure de plus va avec 1,75 point de plus.',
          ],
        },
        {
          kind: 'method',
          title: 'Les y d’abord',
          text: 'Inverser les plages donne une autre droite, celle de x en y.',
          steps: [
            'PENTE et ORDONNEE.ORIGINE : la plage des y, puis celle des x.',
            'Arrondir avec ARRONDI(…;2) quand on demande le centième.',
            'Contrôler : a × x̄ + b redonne ȳ, aux arrondis près.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B1-04-A1-08-EXEMPLE-ANGERS',
      titre: 'Exemple guidé : les soirées jeux d’Angers',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['nuage-de-points', 'ajustement-affine'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b1-04-a1-exemple-angers',
          enonce: `Cinq mois de la boutique d’Angers : nombre de soirées jeux x ${SOIREES_D_ANGERS.join(', ')} ; chiffre d’affaires y, en k€, ${CA_D_ANGERS.join(', ')}.`,
          etapes: [
            {
              id: 'nuage',
              intitule: 'Le nuage',
              raisonnement:
                'Cinq points qui montent presque en ligne droite : un ajustement affine a un sens.',
              invite: 'Placez les cinq points : que voyez-vous ?',
            },
            {
              id: 'point-moyen',
              intitule: 'Le point moyen',
              raisonnement: `x̄ = ${ANGERS.moyenneX}, ȳ = ${ANGERS.moyenneY} : G(${ANGERS.moyenneX} ; ${ANGERS.moyenneY}).`,
              invite: 'Quelles sont les coordonnées de G ?',
            },
            {
              id: 'droite',
              intitule: 'La droite des moindres carrés',
              raisonnement: `Calculatrice : ${DROITE_D_ANGERS}.`,
              invite: 'Quelle droite donne la calculatrice ?',
            },
            {
              id: 'controle',
              intitule: 'Le contrôle par G',
              raisonnement: `${avecVirgule(auCentime(ANGERS.pente))} × ${ANGERS.moyenneX} + ${avecVirgule(auCentime(ANGERS.ordonnee))} = ${avecVirgule(parAngers(ANGERS.moyenneX))} : la droite passe par G.`,
              invite: 'La droite passe-t-elle par G ?',
            },
            {
              id: 'lire',
              intitule: 'Lire la pente',
              raisonnement: `Une soirée jeux de plus va avec ${avecVirgule(auCentime(ANGERS.pente))} k€ de chiffre d’affaires en plus, en moyenne sur ces cinq mois.`,
              invite: 'Que signifie a pour la boutique ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur le contrôle par G (étape 4) et sur la lecture de a (étape 5).',
        'Transition : « Voici le nuage du site web : exercice 1. »',
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-04-A1-09-NUAGE-SITE',
      titre: 'Le nuage du site web',
      diffusion: 'seance',
      dureeMinutes: 1,
      concepts: ['nuage-de-points'],
      notes: moteur.puces(
        '1 min : faire décrire la forme du nuage, sans calculer ; l’exercice 1 calcule.',
      ),
    },
    'scatter',
    {
      title: 'Le budget de publicité et le CA du site web',
      subtitle: 'Un point par mois, de janvier à octobre 2026.',
      xLabel: 'Budget de publicité (€)',
      yLabel: 'Chiffre d’affaires (€)',
      xRange: [0, 1400],
      yRange: [15000, 45000],
      points: BUDGETS_DU_SITE.map((x, rang) => ({ x, y: CA_DU_SITE[rang] })),
      reading:
        'Les dix points montent presque en ligne droite : plus de publicité va avec plus de ventes.',
      source: DONNEES_FICTIVES,
      description:
        'Nuage de dix points : en abscisse le budget de publicité, de 400 à 1 300 euros ; en ordonnée le chiffre d’affaires du site web, de 21 000 à 43 000 euros. Les points montent presque alignés.',
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-04-A1-10-TABLEUR-AJUSTEMENT',
      titre: 'Exercice 1 — L’ajustement du site web au tableur',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 11,
      concepts: ['tableur', 'nuage-de-points', 'ajustement-affine'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 9),
        'Réflexion : écrire sur papier quelle plage va en premier dans PENTE.',
        'Erreurs à chercher : plages inversées ; sommes au lieu des moyennes ; ARRONDI oublié.',
        'Papier : formules écrites sur la copie avec la grille des cellules.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: FEUILLE_DE_L_AJUSTEMENT.plan,
        questions: [
          moteur.questionDeFeuille(
            FEUILLE_DE_L_AJUSTEMENT.plan,
            FEUILLE_DE_L_AJUSTEMENT.attendus,
            'ajustement-affine',
          ),
        ],
      },
    },
    {
      minutes: 3,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Contrôler au pupitre : a × x̄ + b redonne ȳ, aux arrondis près.',
        'Transition : jalon 1, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'E2 et E3',
        `${FEUILLE_DE_L_AJUSTEMENT.formules.slice(0, 2).join(' ; ')} : G(${AJUSTEMENT_DU_SITE.moyenneX} ; ${nombreFrancais(AJUSTEMENT_DU_SITE.moyenneY, 0)}). Les sommes ne sont pas un point du nuage.`,
      ],
      [
        'E4 et E5',
        `${FEUILLE_DE_L_AJUSTEMENT.formules.slice(2).join(' ; ')} : ${droiteEcrite(auCentime(AJUSTEMENT_DU_SITE.pente), auCentime(AJUSTEMENT_DU_SITE.ordonnee))}. Chaque euro de publicité va avec ${enCentieme(AJUSTEMENT_DU_SITE.pente)} € de ventes en plus.`,
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B1-04-A1-11-JALON',
      titre: 'Jalon 1 : un nuage, un point moyen, une droite',
      concepts: ['nuage-de-points', 'ajustement-affine'],
    },
    {
      id: 'b1-04-a1-jalon',
      invite:
        'Je sais placer le point moyen et obtenir la droite des moindres carrés au tableur.',
    },
    'Si plus de 30 % « Perdu » : reprendre l’ordre des plages de PENTE après la pause.',
    moteur.PAUSE_HORS_DUREE,
  ),
];

const ACTE_2: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B1-04-A2-01-REFLEXION-PREVOIR',
      titre: 'Réfléchir : la température ou les soirées ?',
      diffusion: 'seance',
      dureeMinutes: 5,
      concepts: ['correlation', 'lecture-graphique'],
      notes: moteur.puces(
        'Temps « réfléchir » de la notion 2 : 3 min d’écriture individuelle, puis lire trois réponses au pupitre.',
        'Ne rien trancher : la trace écrite suivante répond.',
        'Relance : « Une série qui baisse peut-elle bien prévoir ? »',
        'Papier : cadre de réponse du livret.',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b1-04-a2-reflexion-prevoir',
        type: 'reflection',
        question:
          'Pour prévoir le chiffre d’affaires de la boutique de Nantes, Inès hésite entre la température du mois et le nombre de soirées jeux. Théo choisit les soirées : « Plus on en fait, plus on vend ; avec la température, les ventes baissent. » Comment choisir la meilleure des deux ? Une liaison prouve-t-elle une cause ?',
        placeholder: 'Je tracerais… je comparerais…',
        competency: 'Raisonner · comparer deux ajustements',
      },
    },
    {
      correction: {
        expected:
          'Tracer les deux nuages et retenir celui dont les points sont le mieux alignés, qu’ils montent ou qu’ils descendent. Une liaison ne prouve pas une cause.',
        nextAction:
          'Gardez votre réponse : la trace écrite mesure l’alignement par un nombre.',
      },
    },
  ),
  pourComprendre(
    {
      screenId: 'B1-04-A2-02-ENFANT-OISEAUX',
      titre: 'En file ou en désordre',
      concepts: ['correlation'],
    },
    {
      fichier: 'oiseaux-vols.webp',
      scene:
        'Trois vols d’oiseaux dans le ciel : une file qui monte, une file qui descend, et une volée éparpillée sans direction.',
      imageAlt:
        'Dessin : un ciel clair ; à gauche, des oiseaux en file presque parfaite qui monte vers la droite ; au centre, une file presque parfaite qui descend ; à droite, des oiseaux éparpillés en tous sens ; deux enfants les regardent.',
      regle:
        'le coefficient de corrélation r, entre −1 et 1, dit si les points sont bien alignés : proche de 1 ou de −1, oui ; proche de 0, non.',
      correspondances: [
        ['La file qui monte', 'r proche de 1'],
        ['La file qui descend', 'r proche de −1, un aussi bon alignement'],
        ['La volée éparpillée', 'r proche de 0 : pas d’ajustement affine'],
      ],
    },
    'Question : « La file qui descend est-elle moins bien rangée que celle qui monte ? » Non : le signe dit le sens, pas la qualité.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-04-A2-02-COURS-CORRELATION',
      titre: 'Cours : le coefficient de corrélation',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['correlation', 'tableur'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : la distance à 1, pas le signe.',
      ),
    },
    'lesson',
    {
      title: 'Le coefficient de corrélation : la distance à 1, pas le signe',
      subtitle: 'Trace écrite · notion 2 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Le coefficient r',
          text: 'r mesure l’alignement des points du nuage, entre −1 et 1.\nSon signe dit si la droite monte ou descend ; |r| proche de 1 justifie un ajustement affine.',
          formula:
            'tableur : =COEFFICIENT.CORRELATION(plage des x;plage des y)\nentre deux ajustements, garder le |r| le plus proche de 1',
        },
        {
          kind: 'example',
          title: 'Pour débuter : deux nuages de Léa',
          text: 'Heures de révision et note : r = 0,93. Heures de jeux vidéo et note : r = −0,96.',
          steps: [
            '|0,93| = 0,93 et |−0,96| = 0,96.',
            'Le second est le mieux aligné, même s’il descend.',
            'r n’est pas la pente : 0,93 ne dit pas « 0,93 point par heure ».',
          ],
        },
        {
          kind: 'method',
          title: 'La distance à 1, pas le signe',
          text: 'Comparer deux ajustements de la même série y.',
          steps: [
            'Calculer r pour chaque série x, au millième.',
            'Comparer les valeurs absolues |r|.',
            'Au tableur, figer la plage commune par $ pour recopier vers la droite.',
          ],
        },
      ],
    },
  ),
  pourComprendre(
    {
      screenId: 'B1-04-A2-03-ENFANT-PLUIE',
      titre: 'Ce n’est pas le parapluie',
      concepts: ['lecture-graphique', 'correlation'],
    },
    {
      fichier: 'pluie-parapluies.webp',
      scene:
        'Sous l’averse, tous sortent bottes et parapluie ; les parapluies ne font pas pousser les bottes : c’est la pluie qui fait sortir les deux.',
      imageAlt:
        'Dessin : une rue sous un gros nuage qui pleut ; quatre enfants en bottes de pluie tiennent un parapluie ouvert ; un cinquième, à l’abri, tient un parapluie fermé et porte des baskets.',
      regle:
        'une corrélation forte dit que deux séries varient ensemble ; elle ne prouve pas que l’une est la cause de l’autre. Souvent, un facteur caché fait varier les deux.',
      correspondances: [
        ['Les parapluies ouverts', 'une première série'],
        ['Les bottes', 'une seconde série, liée à la première'],
        ['La pluie', 'le facteur caché, cause commune des deux'],
      ],
    },
    'Question : « Interdire les parapluies ferait-il disparaître les bottes ? » Non : agir sur l’une ne change pas l’autre.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-04-A2-03-COURS-CAUSALITE',
      titre: 'Cours : liaison n’est pas causalité',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['lecture-graphique', 'correlation'],
      notes: moteur.puces(
        moteur.DEUXIEME_PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : chercher le troisième.',
      ),
    },
    'lesson',
    {
      title: 'Liaison n’est pas causalité : chercher le troisième',
      subtitle: 'Trace écrite · notion 2 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Liaison et cause',
          text: 'Un r proche de 1 ou de −1 décrit une liaison entre deux séries.\nLa cause se prouve autrement : par une expérience, un mécanisme, pas par r.',
          formula: 'r proche de ±1 : liaison forte\nliaison ≠ cause',
        },
        {
          kind: 'example',
          title: 'Pour débuter : glaces et coups de soleil',
          text: 'Sur un été, glaces vendues et coups de soleil soignés : r = 0,9.',
          steps: [
            'Les deux montent ensemble : liaison forte.',
            'Les glaces ne brûlent pas la peau.',
            'Le soleil fait monter les deux : c’est le facteur caché.',
          ],
        },
        {
          kind: 'method',
          title: 'Chercher le troisième',
          text: 'Avant de conclure à une cause.',
          steps: [
            'Nommer la liaison : « les deux séries varient ensemble ».',
            'Chercher ce qui pourrait faire varier les deux : saison, prix, météo.',
            'Prévoir reste possible ; affirmer une cause, non.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B1-04-A2-04-EXEMPLE-TOURS',
      titre: 'Exemple guidé : les cafés du bar de Tours',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['correlation', 'lecture-graphique'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b1-04-a2-exemple-tours',
          enonce: `Six semaines au bar de Tours : cafés servis y ${CAFES_DE_TOURS.join(', ')} ; température moyenne en °C ${TEMPERATURES_DE_TOURS.join(', ')} ; matchs diffusés ${MATCHS_DE_TOURS.join(', ')}.`,
          etapes: [
            {
              id: 'temperature',
              intitule: 'r avec la température',
              raisonnement: `Calculatrice : r ≈ ${enMillieme(CAFES_ET_TEMPERATURE.correlation)}.`,
              invite: 'Que vaut r entre la température et les cafés ?',
            },
            {
              id: 'matchs',
              intitule: 'r avec les matchs',
              raisonnement: `Calculatrice : r ≈ ${enMillieme(CAFES_ET_MATCHS.correlation)}.`,
              invite: 'Que vaut r entre les matchs et les cafés ?',
            },
            {
              id: 'comparer',
              intitule: 'Comparer',
              raisonnement: `|${enMillieme(CAFES_ET_TEMPERATURE.correlation)}| est plus proche de 1 : l’ajustement à la température est le meilleur, même si r est négatif.`,
              invite: 'Quel ajustement retenir ?',
            },
            {
              id: 'pente',
              intitule: 'r n’est pas la pente',
              raisonnement: `La pente vaut ${enCentieme(CAFES_ET_TEMPERATURE.pente)} : environ ${avecVirgule(Math.abs(auDixieme(CAFES_ET_TEMPERATURE.pente)))} cafés de moins par degré, pas ${enMillieme(CAFES_ET_TEMPERATURE.correlation)}.`,
              invite: 'Que dit la pente, que ne dit pas r ?',
            },
            {
              id: 'cause',
              intitule: 'Liaison ou cause',
              raisonnement:
                'La chaleur peut faire boire moins chaud, mais r ne le prouve pas : on peut prévoir, pas affirmer une cause.',
              invite: 'La chaleur fait-elle baisser les ventes ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur la comparaison des valeurs absolues (étape 3).',
        'Transition : « Même travail au tableur, pour Nantes : exercice 2. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-04-A2-05-TABLEUR-CORRELATION',
      titre: 'Exercice 2 — Deux ajustements pour Nantes',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 8,
      concepts: ['tableur', 'correlation', 'ajustement-affine'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : écrire sur papier la formule de F2, puis ce qu’elle devient en G2 une fois recopiée.',
        'Erreurs à chercher : plage du CA non figée ; plages inversées dans PENTE ; ARRONDI oublié.',
        'Papier : formules écrites sur la copie avec la grille des cellules.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: FEUILLE_DE_LA_CORRELATION.plan,
        questions: [
          moteur.questionDeFeuille(
            FEUILLE_DE_LA_CORRELATION.plan,
            FEUILLE_DE_LA_CORRELATION.attendus,
            'correlation',
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Faire conclure : la température, malgré son r négatif.',
        'Transition : « Une liaison forte, et pourtant : exercice 3. »',
      ],
    },
    [
      [
        'F2 à F4',
        `${FEUILLE_DE_LA_CORRELATION.formules.join(' ; ')}. Température : r ≈ ${enMillieme(AJUSTEMENT_A_LA_TEMPERATURE.correlation)}, ${droiteEcrite(auCentime(AJUSTEMENT_A_LA_TEMPERATURE.pente), auCentime(AJUSTEMENT_A_LA_TEMPERATURE.ordonnee))}.`,
      ],
      [
        'G2 à G4',
        `Les mêmes formules recopiées vers la droite, $B$2:$B$11 restant figée. Soirées : r ≈ ${enMillieme(AJUSTEMENT_AUX_SOIREES.correlation)}. |r| est plus proche de 1 pour la température : c’est l’ajustement à retenir.`,
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-04-A2-06-ATELIER-CAUSALITE',
      titre: 'Exercice 3 — Les chocolats font-ils vendre des jeux ?',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 6,
      concepts: ['correlation', 'lecture-graphique'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 4),
        'Réflexion : nommer ce qui change d’octobre à mars, au bar comme en boutique.',
        'Pièges : cause tirée de r ; r négatif jugé mauvais ; r lu comme une pente.',
        'Papier : exercice 3 du livret.',
      ),
      proprietes: {
        intitule: 'Exercice 3 — Les chocolats font-ils vendre des jeux ?',
        consigne: `Boutique de Nantes, d’octobre à mars (${MOIS_D_HIVER.join(', ')}) : chocolats chauds servis au bar ${CHOCOLATS_CHAUDS.join(', ')} ; jeux vendus ${JEUX_VENDUS.join(', ')}. ${DONNEES_FICTIVES} Calculatrice autorisée.`,
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b1-04-a2-r-chocolats',
            'correlation',
            'Quel est le coefficient de corrélation entre les chocolats servis (x) et les jeux vendus (y), arrondi au millième ?',
            null,
            auMillieme(AJUSTEMENT_DES_CHOCOLATS.correlation),
            moteur.TROIS_DECIMALES,
            enMillieme(AJUSTEMENT_DES_CHOCOLATS.correlation),
            [[auMillieme(AJUSTEMENT_DES_CHOCOLATS.pente), R_POUR_PENTE]],
          ),
          moteur.vote(
            'b1-04-a2-cause',
            'lecture-graphique',
            true,
            'Théo propose d’offrir un chocolat chaud à chaque client pour vendre plus de jeux. Que lui répondre ?',
            'La liaison ne prouve pas une cause : l’hiver fait monter les deux',
            [['Bonne idée : r est proche de 1', CAUSALITE]],
          ),
          moteur.vote(
            'b1-04-a2-signe',
            'correlation',
            true,
            'Entre la température et les chocolats servis, r = −0,97. Un ajustement affine est-il justifié ?',
            'Oui : r est proche de −1',
            [['Non : r est négatif', SIGNE]],
          ),
          moteur.vote(
            'b1-04-a2-pente',
            'correlation',
            true,
            'Inès lit le coefficient de corrélation comme le nombre de jeux vendus en plus par chocolat servi. A-t-elle raison ?',
            'Non : r mesure l’alignement, le nombre par chocolat est la pente a',
            [['Oui : r est le coefficient de x', R_POUR_PENTE]],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [moteur.CORRIGER_PAR_LA_MOINS_REUSSIE, 'Transition : jalon 2.'],
    },
    [
      [
        'b1-04-a2-r-chocolats',
        `r ≈ ${enMillieme(AJUSTEMENT_DES_CHOCOLATS.correlation)} : liaison forte. La pente, ${enMillieme(AJUSTEMENT_DES_CHOCOLATS.pente)}, est un autre nombre.`,
      ],
      [
        'b1-04-a2-cause',
        'Le froid fait servir des chocolats et rester jouer à l’intérieur : la saison est le facteur caché.',
      ],
      [
        'b1-04-a2-signe',
        '|−0,97| est proche de 1 : les points descendent presque en ligne droite.',
      ],
      [
        'b1-04-a2-pente',
        `Le nombre de jeux par chocolat est la pente a ≈ ${enCentieme(AJUSTEMENT_DES_CHOCOLATS.pente)}.`,
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B1-04-A2-07-JALON',
      titre: 'Jalon 2 : comparer deux ajustements, sans conclure à une cause',
      concepts: ['correlation', 'lecture-graphique'],
    },
    {
      id: 'b1-04-a2-jalon',
      invite:
        'Je sais comparer deux ajustements par r et je ne lis pas une cause dans une corrélation.',
    },
    'Si plus de 30 % « Perdu » : reprendre l’exemple des deux nuages de Léa de la trace écrite A2-02.',
  ),
];

const ACTE_3: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B1-04-A3-01-VOTE-PREVOIR',
      titre: 'Vote : prévoir, oui, mais jusqu’où ?',
      dureeMinutes: 5,
      concepts: ['prevision'],
      notes: moteur.notesDuVoteQuiOuvreLaNotion(3),
    },
    [
      moteur.vote(
        'b1-04-a3-vote-extrapoler',
        'prevision',
        false,
        'Les budgets de publicité observés vont de 400 € à 1 300 €. Que vaut la prévision du CA pour 5 000 € de publicité ?',
        'Une prévision très fragile : 5 000 € est loin des données',
        [['Une prévision sûre : la droite est bien ajustée', EXTRAPOLATION]],
      ),
      moteur.vote(
        'b1-04-a3-vote-rang',
        'prevision',
        false,
        'Le rang 0 est l’année 2020 et y = 2x + 50. Quel x pour prévoir 2027 ?',
        'x = 7, le rang de 2027',
        [['x = 2027', RANG_POUR_ANNEE]],
      ),
    ],
  ),
  pourComprendre(
    {
      screenId: 'B1-04-A3-02-ENFANT-PIERRES',
      titre: 'Le gué dans le brouillard',
      concepts: ['prevision'],
    },
    {
      fichier: 'pierres-brouillard.webp',
      scene:
        'On saute sans crainte d’une pierre à l’autre là où on les voit ; plus loin, le chemin entre dans le brouillard et chaque pas devient un pari.',
      imageAlt:
        'Dessin : une rivière traversée par un chemin de grosses pierres plates ; au soleil, un enfant saute d’une pierre à l’autre ; plus loin, les pierres disparaissent dans un épais brouillard ; un autre enfant y tend prudemment le pied.',
      regle:
        'prévoir entre les données observées, c’est interpoler ; prévoir au-delà, c’est extrapoler, avec d’autant plus de réserve qu’on s’éloigne.',
      correspondances: [
        ['Les pierres au soleil', 'les données observées'],
        ['Sauter entre deux pierres visibles', 'interpoler'],
        ['Avancer dans le brouillard', 'extrapoler, avec réserve'],
      ],
    },
    'Question : « Où le pas est-il le plus sûr ? » Entre les pierres qu’on voit.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-04-A3-02-COURS-PREVOIR',
      titre: 'Cours : interpoler ou extrapoler',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['prevision'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : le rang, pas l’année.',
      ),
    },
    'lesson',
    {
      title: 'Prévoir par la droite : le rang, pas l’année',
      subtitle: 'Trace écrite · notion 3 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Interpoler, extrapoler',
          text: 'On remplace x par sa valeur dans y = ax + b.\nDans l’intervalle des x observés, on interpole ; au-delà, on extrapole, en supposant que la tendance continue.',
          formula: 'prévision = a × x + b\nx = année − année du rang 0',
        },
        {
          kind: 'example',
          title: 'Pour débuter : Léa et ses heures',
          text: 'y = 1,75x + 5, pour 2 à 6 heures observées.',
          steps: [
            '3 heures : 1,75 × 3 + 5 = 10,25, interpolation.',
            '20 heures : 40, extrapolation absurde, la note est sur 20.',
            'Plus on s’éloigne des données, moins on peut s’y fier.',
          ],
        },
        {
          kind: 'method',
          title: 'Le rang, pas l’année',
          text: 'Avant de remplacer x.',
          steps: [
            'Calculer le rang : année − année du rang 0.',
            'Situer x : dans les données, ou au-delà ?',
            'Écrire la prévision avec son unité, et une réserve si on extrapole.',
          ],
        },
      ],
    },
  ),
  pourComprendre(
    {
      screenId: 'B1-04-A3-03-ENFANT-CHAMBRANLE',
      titre: 'La marque sur la porte',
      concepts: ['prevision'],
    },
    {
      fichier: 'chambranle-traits.webp',
      scene:
        'Un trait au crayon à chaque anniversaire, qui monte régulièrement ; plus haut, un ruban rouge marque la taille du grand manège.',
      imageAlt:
        'Dessin : l’encadrement d’une porte en bois ; une colonne de petits traits au crayon qui montent ; un enfant dos au montant, la main sur la tête ; plus haut, un ruban adhésif rouge et un petit dessin de manège punaisé.',
      regle:
        'pour savoir quand la droite atteint un seuil, on résout ax + b > seuil, puis on retient le premier rang entier qui convient.',
      correspondances: [
        ['Les traits au crayon', 'les valeurs observées'],
        ['La montée régulière', 'la droite y = ax + b'],
        ['Le ruban rouge', 'le seuil à dépasser'],
        [
          'Le premier anniversaire au-dessus du ruban',
          'le premier rang entier solution',
        ],
      ],
    },
    'Question : « Pile à la hauteur du ruban, le dépasse-t-on ? » Non : il faut être au-dessus.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-04-A3-03-COURS-SEUIL',
      titre: 'Cours : atteindre un seuil',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['prevision'],
      notes: moteur.puces(
        moteur.DEUXIEME_PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : résoudre, puis arrondir au-dessus.',
      ),
    },
    'lesson',
    {
      title: 'Atteindre un seuil : résoudre, puis arrondir au-dessus',
      subtitle: 'Trace écrite · notion 3 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Le premier rang au-delà d’un seuil',
          text: 'On cherche les x pour lesquels ax + b dépasse le seuil S.\nOn résout l’inéquation, puis on garde le premier rang entier.',
          formula: 'ax + b > S, avec a > 0 : x > (S − b) ÷ a',
        },
        {
          kind: 'example',
          title: 'Pour débuter : un abonnement qui grimpe',
          text: 'y = 3x + 40 abonnés, x rang du mois. Quand dépasse-t-on 100 ?',
          steps: [
            '3x + 40 > 100 donne x > 20.',
            'x = 20 donne 100 pile : pas au-delà.',
            'Premier rang : 21.',
          ],
        },
        {
          kind: 'method',
          title: 'Résoudre, puis arrondir au-dessus',
          text: 'Le seuil se lit aussi sur le graphique, à vérifier par le calcul.',
          steps: [
            'Écrire l’inéquation avec le bon signe : > ou ≥.',
            'Résoudre, puis retenir le premier rang entier qui convient.',
            'Traduire le rang en année.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B1-04-A3-04-EXEMPLE-SOIREES',
      titre: 'Exemple guidé : prévoir les soirées d’Angers',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['prevision'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b1-04-a3-exemple-soirees',
          enonce: `La droite d’Angers de l’exemple guidé : ${DROITE_D_ANGERS}, pour ${SOIREES_D_ANGERS[0]} à ${SOIREES_D_ANGERS.at(-1)} soirées observées par mois, y en k€.`,
          etapes: [
            {
              id: 'interpoler',
              intitule: 'Interpoler',
              raisonnement: `${SOIREES_INTERPOLEES} soirées : ${avecVirgule(parAngers(SOIREES_INTERPOLEES))} k€, dans les données.`,
              invite: `Quel CA pour ${SOIREES_INTERPOLEES} soirées ?`,
            },
            {
              id: 'extrapoler',
              intitule: 'Extrapoler',
              raisonnement: `${SOIREES_EXTRAPOLEES} soirées : ${avecVirgule(parAngers(SOIREES_EXTRAPOLEES))} k€, très loin des données : la boutique peut-elle en organiser autant ?`,
              invite: `Quel CA pour ${SOIREES_EXTRAPOLEES} soirées, et que vaut cette prévision ?`,
            },
            {
              id: 'inequation',
              intitule: 'L’inéquation',
              raisonnement: `${DROITE_D_ANGERS.slice(4)} > ${SEUIL_D_ANGERS} donne x > ${avecVirgule(auCentime(SOLUTION_DU_SEUIL_D_ANGERS))}.`,
              invite: `À partir de combien de soirées le CA dépasse-t-il ${SEUIL_D_ANGERS} k€ ?`,
            },
            {
              id: 'rang',
              intitule: 'Le premier entier',
              raisonnement: `${Math.ceil(SOLUTION_DU_SEUIL_D_ANGERS)} soirées, pas ${Math.floor(SOLUTION_DU_SEUIL_D_ANGERS)} : ${Math.floor(SOLUTION_DU_SEUIL_D_ANGERS)} donne ${avecVirgule(parAngers(Math.floor(SOLUTION_DU_SEUIL_D_ANGERS)))} k€.`,
              invite: 'Quel nombre entier de soirées retenir ?',
            },
            {
              id: 'reserve',
              intitule: 'La réserve',
              raisonnement:
                'Ce seuil est lui aussi une extrapolation, au-delà des dix soirées observées : à vérifier mois après mois.',
              invite: 'Peut-on se fier à ce seuil ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur le premier entier (étape 4).',
        'Transition : « Une annale, avec son nuage. »',
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: RENVOI_AU_NUAGE_DE_L_ANNALE,
      titre: 'Le nuage de l’annale et la droite D',
      diffusion: 'seance',
      dureeMinutes: 1,
      concepts: ['nuage-de-points', 'prevision'],
      notes: moteur.puces(
        '1 min : faire lire les valeurs des points et la droite D, sans conclure ; l’exercice 4 conclut.',
      ),
    },
    'scatter',
    {
      title: 'Espérance de vie des femmes à la naissance',
      subtitle: `Un point par année de naissance, de ${PREMIERE_ANNEE_DE_L_ANNALE} (rang 0) à ${PREMIERE_ANNEE_DE_L_ANNALE + DERNIER_RANG_OBSERVE} (rang ${DERNIER_RANG_OBSERVE}), et la droite D.`,
      xLabel: 'Rang de l’année',
      yLabel: 'Espérance de vie (années)',
      xRange: [0, 20],
      yRange: [83.8, 86.4],
      points: ESPERANCES_DE_VIE.map((y, x) => ({
        x,
        y,
        label: avecVirgule(y),
      })),
      line: {
        slope: DROITE_D.pente,
        intercept: DROITE_D.ordonnee,
        label: 'D',
      },
      reading: 'Les onze points montent en zigzag autour de la droite D.',
      source: 'Insee, Tableaux de l’économie française, édition 2016.',
      description: `Nuage de onze points : en abscisse les rangs 0 à ${DERNIER_RANG_OBSERVE} ; en ordonnée l’espérance de vie, de ${avecVirgule(ESPERANCES_DE_VIE[0])} ans au rang 0 jusqu’à son maximum, atteint aux rangs ${RANGS_DU_MAXIMUM.join(' et ')}. Les points montent en zigzag. La droite D monte régulièrement sur tout l’axe, jusqu’au rang 20.`,
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-04-A3-06-ATELIER-ANNALE',
      titre: 'Exercice 4 — Annale : l’espérance de vie des femmes',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 10,
      concepts: ['correlation', 'ajustement-affine', 'prevision'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 8),
        'Réflexion : écrire sur la copie le rang de 2018.',
        'Pièges : r lu comme la pente ; plages inversées ; 2018 au lieu du rang ; seuil égal pris pour dépassé.',
        'Papier : exercice 4 du livret, nuage et droite D imprimés.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_NUAGE_DE_L_ANNALE,
        intitule: 'Exercice 4 — Annale : l’espérance de vie des femmes',
        consigne: `Annale du BTS CG, Polynésie, 14 mai 2018, exercice 1, partie A. Espérance de vie à la naissance des femmes en France, années ${PREMIERE_ANNEE_DE_L_ANNALE} (rang 0) à ${PREMIERE_ANNEE_DE_L_ANNALE + DERNIER_RANG_OBSERVE} (rang ${DERNIER_RANG_OBSERVE}) : lisez les valeurs sur le nuage. Source : Insee. On ajuste par la droite D : y = ${avecVirgule(DROITE_D.pente)}x + ${avecVirgule(DROITE_D.ordonnee)}. Calculatrice autorisée.`,
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b1-04-a3-annale-r',
            'correlation',
            'Quel est le coefficient de corrélation r de la série, arrondi au millième ?',
            null,
            auMillieme(AJUSTEMENT_DE_L_ANNALE.correlation),
            moteur.TROIS_DECIMALES,
            enMillieme(AJUSTEMENT_DE_L_ANNALE.correlation),
            [[auMillieme(AJUSTEMENT_DE_L_ANNALE.pente), R_POUR_PENTE]],
          ),
          moteur.numerique(
            'b1-04-a3-annale-a',
            'ajustement-affine',
            'Droite de régression de y en x à la calculatrice : quel est a, arrondi au centième ?',
            null,
            auCentime(AJUSTEMENT_DE_L_ANNALE.pente),
            moteur.DEUX_DECIMALES,
            enCentieme(AJUSTEMENT_DE_L_ANNALE.pente),
            [[auCentime(ANNALE_INVERSEE.pente), PENTE_INVERSEE]],
          ),
          moteur.numerique(
            'b1-04-a3-annale-b',
            'ajustement-affine',
            'Et b, arrondi au centième ?',
            null,
            auCentime(AJUSTEMENT_DE_L_ANNALE.ordonnee),
            moteur.DEUX_DECIMALES,
            enCentieme(AJUSTEMENT_DE_L_ANNALE.ordonnee),
            [[auCentime(ANNALE_INVERSEE.ordonnee), PENTE_INVERSEE]],
          ),
          moteur.numerique(
            'b1-04-a3-annale-2018',
            'prevision',
            `Selon la droite D, quelle espérance de vie pour les femmes nées en ${ANNEE_DEMANDEE} ?`,
            'ans',
            parLaDroiteD(RANG_DEMANDE),
            moteur.UNE_DECIMALE,
            `${nombreFrancais(parLaDroiteD(RANG_DEMANDE), 1)} ans`,
            [[parLaDroiteD(ANNEE_DEMANDEE), RANG_POUR_ANNEE]],
          ),
          moteur.vote(
            'b1-04-a3-annale-p',
            'prevision',
            true,
            `Proposition P : « L’espérance de vie des femmes nées après ${PREMIERE_ANNEE_DE_L_ANNALE} restera inférieure ou égale à ${SEUIL_DE_L_ANNALE} ans. » Selon D, P est-elle vraie ?`,
            `Fausse : D dépasse ${SEUIL_DE_L_ANNALE} ans pour les femmes nées à partir de ${PREMIERE_ANNEE_DE_L_ANNALE + RANG_DU_DEPASSEMENT}`,
            [
              [
                `Vraie : ${avecVirgule(DROITE_D.pente)}x + ${avecVirgule(DROITE_D.ordonnee)} = ${SEUIL_DE_L_ANNALE} donne x = ${RANG_DE_L_EGALITE}, on reste à ${SEUIL_DE_L_ANNALE} ans`,
                SEUIL,
              ],
            ],
          ),
        ],
      },
    },
    {
      minutes: 3,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE,
        'Faire tracer au pupitre le trait de construction de 2018 sur le nuage.',
        'Transition : jalon 3, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'b1-04-a3-annale-r',
        `Calculatrice, rangs en x : r ≈ ${enMillieme(AJUSTEMENT_DE_L_ANNALE.correlation)}, proche de 1 : l’ajustement affine est justifié.`,
      ],
      [
        'b1-04-a3-annale-a',
        'La plage des y d’abord : a est la hausse d’espérance de vie par année de naissance.',
      ],
      [
        'b1-04-a3-annale-b',
        `b ≈ ${enCentieme(AJUSTEMENT_DE_L_ANNALE.ordonnee)} ; l’annale arrondit ensuite la droite en D.`,
      ],
      [
        'b1-04-a3-annale-2018',
        `${ANNEE_DEMANDEE} a le rang ${RANG_DEMANDE} : ${avecVirgule(DROITE_D.pente)} × ${RANG_DEMANDE} + ${avecVirgule(DROITE_D.ordonnee)}, à lire aussi sur le graphique.`,
      ],
      [
        'b1-04-a3-annale-p',
        `${avecVirgule(DROITE_D.pente)}x + ${avecVirgule(DROITE_D.ordonnee)} > ${SEUIL_DE_L_ANNALE} donne x > ${RANG_DE_L_EGALITE} : au rang ${RANG_DU_DEPASSEMENT}, ${nombreFrancais(parLaDroiteD(RANG_DU_DEPASSEMENT), 1)} ans. Au rang ${RANG_DE_L_EGALITE}, D donne ${SEUIL_DE_L_ANNALE} ans pile, ce qui ne contredit pas P. Prévision lointaine : avec réserve.`,
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B1-04-A3-07-JALON',
      titre: 'Jalon 3 : prévoir avec prudence',
      concepts: ['prevision'],
    },
    {
      id: 'b1-04-a3-jalon',
      invite:
        'Je sais prévoir par une droite au bon rang, atteindre un seuil, et dire quand j’extrapole.',
    },
    moteur.PAUSE_HORS_DUREE,
  ),
];

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  [POINT_MOYEN_CONFONDU]: 'B1-04-A1-06-COURS-NUAGE',
  [PENTE_INVERSEE]: 'B1-04-A1-07-COURS-DROITE',
  [ARRONDI_OUBLIE]: 'B1-04-A1-07-COURS-DROITE',
  [SIGNE]: 'B1-04-A2-02-COURS-CORRELATION',
  [R_POUR_PENTE]: 'B1-04-A2-02-COURS-CORRELATION',
  [NON_FIGEE]: 'B1-04-A2-02-COURS-CORRELATION',
  [CAUSALITE]: 'B1-04-A2-03-COURS-CAUSALITE',
  [EXTRAPOLATION]: 'B1-04-A3-02-COURS-PREVOIR',
  [RANG_POUR_ANNEE]: 'B1-04-A3-02-COURS-PREVOIR',
  [SEUIL]: 'B1-04-A3-03-COURS-SEUIL',
};

const POUR_COMPRENDRE = [
  ['M1', 'plateau-equilibre.webp', 'Tenir en équilibre sur un doigt'],
  ['M2', 'baton-ficelles.webp', 'Le bâton au plus près des cailloux'],
  ['M3', 'oiseaux-vols.webp', 'En file ou en désordre'],
  ['M4', 'pluie-parapluies.webp', 'Ce n’est pas le parapluie'],
  ['M5', 'pierres-brouillard.webp', 'Le gué dans le brouillard'],
  ['M6', 'chambranle-traits.webp', 'La marque sur la porte'],
] as const;

const MEDIAS = moteur.mediasDesIllustrations(
  DOSSIER_DES_IMAGES,
  POUR_COMPRENDRE,
  GRAVURE_DE_L_ACCROCHE,
);

export const COURS_B1_04 = moteur.coursB1(
  [ACTE_1, ACTE_2, ACTE_3, ACTE_4],
  REMEDIATIONS,
  MEDIAS,
  {
    slug: 'b1-04-series-deux-variables',
    titre: 'Séries à deux variables : ajuster et prévoir',
    gabarit: 'v3',
    concepts: [...CONCEPTS_DU_COURS],
  },
);
