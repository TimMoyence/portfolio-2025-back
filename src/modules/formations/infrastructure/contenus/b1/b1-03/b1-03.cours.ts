import type { ContenuDeCours } from '../../../../domain/cours/stockage/CoursStocke';
import type { AuMoinsUnModifiable } from '../../../../../../common/domain/objets/au-moins-un';
import type { ConfusionId } from '../../../../domain/cours/banque/confusions';
import {
  auCentime,
  auDixieme,
  auMillionieme,
} from '../../../../../../common/domain/nombres/arrondi';
import {
  avecVirgule,
  enEuros,
  enPourcent,
} from '../../../../../../common/domain/nombres/ecriture-francaise';
import { somme } from '../../../../../../common/domain/nombres/statistiques';
import {
  ARRONDI_OUBLIE,
  DONNEES_FICTIVES,
  MARQUE_POUR_MARGE,
  MOYENNE_SIMPLE,
} from '../b1-01/b1-01.donnees';
import { ECART } from '../b1-02/b1-02.donnees';
import { ACTE_4 } from './b1-03.acte-4';
import {
  BOITE_EFFECTIF,
  CENTRE_OUBLIE,
  CLASSES_DE_NANTES,
  CLASSEUR_DES_VENTES,
  CONCEPTS_DU_COURS,
  ECHANTILLON,
  ETENDUE,
  EXTREME_IGNOREE,
  MEDIANE_PAIRE,
  MEME_MOYENNE,
  MOITIE_DE_MEDIANE,
  MOYENNE_POUR_MEDIANE,
  NOMBRE_DE_VENTES,
  PANIERS_AU_TABLEUR,
  PANIERS_DE_LA_MARKETPLACE,
  PANIERS_DU_MARDI,
  RANG_PAR_DEFAUT,
  RENVOI_AU_DOSSIER,
  RENVOI_AUX_BOITES,
  RESUME_DE_NANTES,
  RESUME_DU_SITE,
  SAMEDI_A_ANGERS,
  SANS_TRI,
  SYNTHESE_ERRONEE,
  TOTAL_GENERAL,
  VENTES_D_OCTOBRE,
  centreDeClasse,
  ligneDuCanal,
  moyenneParClasses,
  quartileAuRangInferieur,
  quartileDuProgramme,
  resumeDe,
  tauxDeMarge,
  tauxDeMarque,
  type ClasseDePaniers,
  type ResumeDUneSerie,
} from './b1-03.donnees';
import * as moteur from '../../briques';

const DOSSIER_DES_IMAGES = '/assets/cours/b1-03/v1';

const GRAVURE_DE_L_ACCROCHE = moteur.gravureDuDomainePublic({
  id: 'M7',
  chemin: '/assets/cours/gravures/v1/hollerith-recensement-1890.jpg',
  pageSource:
    'https://commons.wikimedia.org/wiki/File:1890_Census_Hollerith_Electrical_Counting_Machines_Sci_Amer.jpg',
  auteur: 'Scientific American, machines de Herman Hollerith',
  date: '1890',
});

const pourComprendre = moteur.pourComprendreDans(DOSSIER_DES_IMAGES);

const SITE = ligneDuCanal('Site web');
const BOUTIQUE = ligneDuCanal('Boutique');
const MARKETPLACE = ligneDuCanal('Marketplace');
const PREMIERE_VENTE = VENTES_D_OCTOBRE[0];
const MOYENNE_DES_TROIS_TAUX =
  (tauxDeMarge(BOUTIQUE.ca, BOUTIQUE.cout) +
    tauxDeMarge(SITE.ca, SITE.cout) +
    tauxDeMarge(MARKETPLACE.ca, MARKETPLACE.cout)) /
  3;

const ANGERS_PAR_CANAL = ['Boutique', 'Site web', 'Marketplace'].map(
  (canal) => {
    const ventes = SAMEDI_A_ANGERS.filter(([nom]) => nom === canal);
    const ca = ventes.reduce((total, [, montant]) => total + montant, 0);
    const cout = ventes.reduce((total, [, , achat]) => total + achat, 0);
    return { canal, ca, cout, taux: tauxDeMarge(ca, cout) };
  },
);
const CA_D_ANGERS = ANGERS_PAR_CANAL.reduce((total, { ca }) => total + ca, 0);
const COUT_D_ANGERS = ANGERS_PAR_CANAL.reduce(
  (total, { cout }) => total + cout,
  0,
);

const RESUME_DU_MARDI = resumeDe(PANIERS_DU_MARDI);
const RESUME_DE_LA_MARKETPLACE = resumeDe(PANIERS_DE_LA_MARKETPLACE);
const MOYENNE_DES_CLASSES = moyenneParClasses(
  CLASSES_DE_NANTES,
  centreDeClasse,
);

const enUnite = (valeur: number): string => `${avecVirgule(valeur)} €`;

const venteDAngers = ([canal, ca, cout]: readonly [
  string,
  number,
  number,
]): string => `${canal.toLowerCase()} ${ca} € et ${cout} €`;

const tauxDuCanal = ({
  canal,
  taux,
}: {
  readonly canal: string;
  readonly taux: number;
}): string => `${canal} ${enPourcent(taux)}`;

const classeEcrite = ({ debut, fin, effectif }: ClasseDePaniers): string =>
  `[${debut} ; ${fin}[ : ${effectif}`;

const sousLaMoyenne = (paniers: readonly number[], centre: number): string =>
  `${paniers.filter((panier) => panier < centre).length} paniers sur ${paniers.length}`;

const ACTE_1: moteur.Acte = [
  {
    screenId: 'B1-03-A1-01-DIAGNOSTIC-MARGE',
    titre: 'Diagnostic : un taux de marge, sans calculatrice',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 4,
    concepts: ['pourcentage'],
    notes: moteur.puces(
      '4 min : écrire au tableau l’adresse et le code de séance.',
      'Rappel du B1-01 : le taux de marge se rapporte au coût d’achat HT.',
      'Annoncer « seule la participation compte ». Sans calculatrice.',
      'Papier : la question est en tête du livret ; vote à main levée.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b1-03-a1-diagnostic-marge',
          'pourcentage',
          true,
          'Un jeu s’achète 40 € HT et se vend 50 € HT. Quel est son taux de marge ?',
          '10 ÷ 40 = 25 %',
          [
            ['10 ÷ 50 = 20 %', MARQUE_POUR_MARGE],
            ['50 − 40 = 10 %', ECART],
          ],
        ),
      ],
      delaiMs: 0,
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B1-03-A1-02-ACCROCHE',
      titre: 'Traiter un fichier : TCD et série à une variable',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['tableau-croise-dynamique', 'choix-du-resume'],
      notes: moteur.puces(
        'Annoncer les deux pauses de 15 minutes, après l’acte 1 et après l’acte 3.',
        'Raconter : en 1890, les machines de Hollerith trient et comptent les fiches du recensement américain ; un TCD fait ce tri en un clic.',
      ),
    },
    'hero',
    {
      title: 'Traiter un fichier : TCD et série à une variable',
      subtitle:
        'Partie Libre exporte ses ventes d’octobre. Votre dossier : un fichier à regrouper, un taux de marge à calculer, des paniers à résumer et à comparer.',
      bgImage: GRAVURE_DE_L_ACCROCHE.chemins[0],
      bgImageAlt:
        'Gravure du Scientific American (1890) : les machines électriques de Herman Hollerith, qui trient et comptent les cartes perforées du recensement américain',
    },
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B1-03-A1-03-VOTE-DIAGNOSTIC',
      titre: 'Vote : regrouper, puis calculer',
      dureeMinutes: 4,
      concepts: ['tableau-croise-dynamique', 'moyenne-ponderee'],
      notes: moteur.notesDuVoteQuiOuvreLaNotion(1),
    },
    [
      moteur.vote(
        'b1-03-a1-vote-regrouper',
        'tableau-croise-dynamique',
        false,
        `Le fichier d’octobre compte ${NOMBRE_DE_VENTES} ventes. Pour connaître le chiffre d’affaires de chaque canal, que faire ?`,
        'Regrouper les ventes par canal et additionner leurs montants',
        [['Compter les ventes de chaque canal', SYNTHESE_ERRONEE]],
      ),
      moteur.vote(
        'b1-03-a1-vote-taux',
        'moyenne-ponderee',
        false,
        'Deux ventes : l’une à 50 % de marge sur 10 € de coût, l’autre à 10 % de marge sur 100 € de coût. Quel est le taux de marge des deux ventes ensemble ?',
        'Environ 13,6 %',
        [['30 %, la moyenne des deux taux', MOYENNE_SIMPLE]],
      ),
    ],
  ),
  moteur.ecranV2(
    {
      screenId: RENVOI_AU_DOSSIER,
      titre: 'Le fichier des ventes de Partie Libre',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['tableau-croise-dynamique'],
      notes: moteur.puces(
        '1 min de lecture silencieuse ; ne rien calculer.',
        'Faire dire ce qu’est une ligne du fichier : une vente.',
      ),
    },
    'table',
    {
      title: 'Le fichier des ventes de Partie Libre',
      subtitle: 'L’export d’octobre 2026, avant le comité de novembre.',
      columns: [...moteur.COLONNES_DU_DOSSIER],
      rows: [
        {
          rubrique: 'L’entreprise',
          contenu:
            'Quatre boutiques-bars à jeux, à Nantes, Angers, Tours et Le Mans, qui vendent aussi sur leur site web et sur une marketplace.',
        },
        {
          rubrique: 'Le fichier',
          contenu: `${NOMBRE_DE_VENTES} ventes, une par ligne, les canaux mêlés. Colonnes : Date, Boutique, Canal, Catégorie, CA_HT, Cout_achat_HT.`,
        },
        {
          rubrique: 'La première ligne',
          contenu: `${String(PREMIERE_VENTE.jour).padStart(2, '0')}/10/2026 ·${PREMIERE_VENTE.boutique} · ${PREMIERE_VENTE.canal} · ${PREMIERE_VENTE.categorie} · ${PREMIERE_VENTE.ca} € · ${PREMIERE_VENTE.cout} €.`,
        },
        {
          rubrique: 'Le taux de marge',
          contenu:
            'Marge ÷ coût d’achat HT, comme au B1-01 ; la marge vaut CA HT − coût d’achat HT.',
        },
        {
          rubrique: 'La question d’Inès',
          contenu: '« Quel canal rapporte le plus, et à quel taux de marge ? »',
        },
      ],
      note: DONNEES_FICTIVES,
    },
  ),
  {
    screenId: 'B1-03-A1-05-MISSION',
    titre: 'Votre mission : quel canal rapporte le plus ?',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 6,
    concepts: ['tableau-croise-dynamique', 'moyenne-ponderee'],
    notes: moteur.puces(
      'Lecture à voix haute (1 min), puis 4 min d’écriture individuelle et 1 min de mise en commun au pupitre.',
      'Consigne orale : sans calculatrice. Enjeu : Inès présente ces chiffres au comité de novembre.',
      'Question 3 : ne pas donner le bon taux, c’est l’exercice 1.',
      'Papier : trois lignes d’écriture dans le livret.',
    ),
    proprietes: {
      metier:
        'Alternant·e assistant·e de gestion — Partie Libre (boutiques-bars à jeux, 40 salariés, Nantes)',
      situation: [
        'Lundi, 9 h. Inès Marchal a exporté les ventes d’octobre.',
        '« Quel canal rapporte le plus ? Il me faut le chiffre d’affaires et le taux de marge de chacun pour le comité. »',
        `Théo a recopié les ${NOMBRE_DE_VENTES} lignes à la main, canal par canal, et n’a pas fini.`,
        `Il a aussi calculé le taux de marge de chaque vente, puis leur moyenne : ${enPourcent(TOTAL_GENERAL.moyenneDesTaux)}.`,
      ].join('\n'),
      geste: null,
      consequence: null,
      questionsLibres: [
        {
          id: 'b1-03-a1-mission:regrouper',
          question:
            'Comment obtenir le chiffre d’affaires de chaque canal sans recopier les lignes une à une ?',
          placeholder: 'Il faudrait regrouper… puis…',
        },
        {
          id: 'b1-03-a1-mission:marge',
          question:
            'Le taux de marge se calcule sur quel montant : le chiffre d’affaires ou le coût d’achat ?',
          placeholder: 'On divise la marge par…',
        },
        {
          id: 'b1-03-a1-mission:moyenne',
          question:
            'Une vente de 10 € et une vente de 200 € comptent autant dans la moyenne de Théo. Est-ce juste ?',
          placeholder: 'Théo a… parce que…',
        },
      ],
    },
  },
  pourComprendre(
    {
      screenId: 'B1-03-A1-06-ENFANT-TAS',
      titre: 'Un tas par couleur',
      concepts: ['tableau-croise-dynamique'],
    },
    {
      fichier: 'bonbons-tas.webp',
      scene:
        'Le sac est vidé sur la table et les bonbons sont rangés en tas, un par couleur, de tailles différentes.',
      imageAlt:
        'Dessin : un sac de bonbons vidé sur une table ; trois tas bien séparés, rouges, jaunes et verts, de tailles différentes ; des enfants autour de la table, l’un montre le tas rouge du doigt.',
      regle:
        'regrouper les ventes par canal, puis additionner les montants de chaque groupe, c’est un TCD : Somme des montants, pas Nombre.',
      correspondances: [
        ['Le sac vidé sur la table', 'le fichier des ventes'],
        ['Un bonbon', 'une vente, avec son montant'],
        ['Sa couleur', 'son canal de vente'],
        ['Un tas par couleur', 'une ligne du TCD par canal'],
      ],
    },
    'Question : « Compte-t-on les bonbons ou additionne-t-on leurs prix ? » Les prix : la Somme, pas le Nombre.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-03-A1-06-COURS-TCD',
      titre: 'Cours : le tableau croisé dynamique',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['tableau-croise-dynamique'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : lignes, colonnes, valeurs.',
        'Au pupitre, montrer le geste dans Excel sur le fichier d’octobre, sans lire les résultats.',
      ),
    },
    'lesson',
    {
      title: 'Le TCD : un tas par catégorie, puis on additionne',
      subtitle: 'Trace écrite · notion 1 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Le tableau croisé dynamique',
          text: 'Un TCD regroupe les lignes d’un fichier selon un champ.\nPour chaque groupe, il résume un autre champ : somme, nombre ou moyenne.',
          formula:
            'Lignes : le champ qui fait les groupes\nValeurs : le champ qu’on résume\nTotal général = somme de toute la colonne',
        },
        {
          kind: 'example',
          title: 'Pour débuter : les dépenses de Léa',
          text: 'Six dépenses d’octobre : courses 42 €, sorties 16 €, courses 58 €, transport 20 €, sorties 24 €, transport 20 €.',
          steps: [
            'Catégorie en Lignes, montant en Valeurs.',
            'Courses 100 €, sorties 40 €, transport 40 €.',
            'Total général : 180 €, la somme des six dépenses.',
          ],
        },
        {
          kind: 'method',
          title: 'Lignes, colonnes, valeurs',
          text: 'Dans Excel, sur le fichier entier.',
          steps: [
            'Insertion › Tableau croisé dynamique.',
            'Le champ des groupes en Lignes, un second en Colonnes si besoin.',
            'Le montant en Valeurs, en Somme et non en Nombre.',
            'Contrôle : le total général vaut la somme de la colonne.',
          ],
        },
      ],
    },
  ),
  pourComprendre(
    {
      screenId: 'B1-03-A1-07-ENFANT-LIMONADE',
      titre: 'Calculer avec tout ce qu’on a',
      concepts: ['tableau-croise-dynamique', 'moyenne-ponderee'],
    },
    {
      fichier: 'limonade-pots.webp',
      scene:
        'Le soir, au stand de limonade, les deux pots sont vidés côte à côte : les pièces gagnées et les pièces dépensées pour les citrons.',
      imageAlt:
        'Dessin : un stand de limonade le soir ; deux pots en verre, l’un plein de pièces gagnées, l’autre des pièces dépensées pour les citrons ; l’enfant les vide côte à côte sur la table, un seul carnet ouvert devant lui.',
      regle:
        'le champ calculé prend le taux de marge une seule fois, sur les sommes du TCD, et non vente par vente.',
      correspondances: [
        ['Le pot des pièces gagnées', 'la somme des ventes'],
        ['Le pot des pièces dépensées', 'la somme des coûts'],
        [
          'Le carnet ouvert, un seul calcul',
          'le champ calculé, posé sur les sommes',
        ],
      ],
    },
    'Question : « Calcule-t-on le taux vente par vente, ou sur les pots ? » Sur les pots, les sommes.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-03-A1-07-COURS-CHAMP-CALCULE',
      titre: 'Cours : le champ calculé du taux de marge',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['tableau-croise-dynamique', 'moyenne-ponderee'],
      notes: moteur.puces(
        moteur.DEUXIEME_PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : le calcul se fait sur les sommes.',
        'Lien à la mission : la moyenne de Théo pèse autant une vente de 10 € qu’une vente de 200 €.',
      ),
    },
    'lesson',
    {
      title: 'Le champ calculé : un taux sur les sommes',
      subtitle: 'Trace écrite · notion 1 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Le champ calculé',
          text: 'Un champ calculé ajoute au TCD une formule écrite sur ses champs.\nExcel la calcule sur les sommes de chaque ligne, total général compris.',
          formula:
            'taux de marge = (somme du CA HT − somme du coût) ÷ somme du coût\njamais la moyenne des taux des lignes',
        },
        {
          kind: 'example',
          title: 'Pour débuter : le stand de crêpes',
          text: 'Samedi, 120 € de recettes pour 80 € d’ingrédients ; dimanche, 200 € pour 100 €.',
          steps: [
            'Sommes : 320 € de recettes, 180 € d’ingrédients.',
            '(320 − 180) ÷ 180 ≈ 77,8 %.',
            'La moyenne de 50 % et 100 % donnerait 75 % : faux.',
          ],
        },
        {
          kind: 'method',
          title: 'Le calcul se fait sur les sommes',
          text: 'Le champ calculé pèse chaque vente par son coût.',
          steps: [
            'Analyse du tableau croisé dynamique › Champs, éléments et jeux › Champ calculé.',
            'Nom : Taux de marge ; formule : =(CA_HT-Cout_achat_HT)/Cout_achat_HT.',
            'Format pourcentage, une décimale.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B1-03-A1-08-EXEMPLE-ANGERS',
      titre: 'Exemple guidé : les ventes d’un samedi à Angers',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['tableau-croise-dynamique', 'moyenne-ponderee'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b1-03-a1-exemple-angers',
          enonce: `Six ventes d’un samedi à Angers (CA HT puis coût d’achat HT) : ${SAMEDI_A_ANGERS.map(venteDAngers).join(' ; ')}.`,
          etapes: [
            {
              id: 'champs',
              intitule: 'Les champs du TCD',
              raisonnement:
                'Canal en Lignes ; CA HT et coût d’achat HT en Valeurs, en Somme.',
              invite: 'Quel champ placer en Lignes ? Lesquels en Valeurs ?',
            },
            {
              id: 'sommes',
              intitule: 'Les sommes par canal',
              raisonnement: ANGERS_PAR_CANAL.map(
                ({ canal, ca, cout }) => `${canal} ${ca} € et ${cout} €`,
              ).join(' ; '),
              invite: 'Que donne le TCD pour chaque canal ?',
            },
            {
              id: 'total',
              intitule: 'Le total général',
              raisonnement: `${CA_D_ANGERS} € de CA HT et ${COUT_D_ANGERS} € de coût : la somme des six ventes.`,
              invite: 'Que vaut la ligne du total général ?',
            },
            {
              id: 'champ',
              intitule: 'Le champ calculé',
              raisonnement: `${ANGERS_PAR_CANAL.map(tauxDuCanal).join(' ; ')} ; total général ${CA_D_ANGERS - COUT_D_ANGERS} ÷ ${COUT_D_ANGERS} ≈ ${enPourcent(tauxDeMarge(CA_D_ANGERS, COUT_D_ANGERS))}.`,
              invite: 'Quel taux de marge le champ calculé donne-t-il ?',
            },
            {
              id: 'piege',
              intitule: 'La moyenne des taux',
              raisonnement: `La moyenne des trois taux donne ${enPourcent(ANGERS_PAR_CANAL.reduce((total, { taux }) => total + taux, 0) / ANGERS_PAR_CANAL.length)} : faux, la boutique pèse plus lourd que la marketplace.`,
              invite: 'Pourquoi ne pas faire la moyenne des trois taux ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur le total général (étape 3) et sur la moyenne des taux (étape 5).',
        'Transition : « À vous, dans Excel, sur les ventes d’octobre : exercice 1. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-03-A1-09-ATELIER-TCD',
      titre: 'Exercice 1 — Le TCD des ventes d’octobre, dans Excel',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 12,
      concepts: ['tableau-croise-dynamique', 'pourcentage', 'moyenne-ponderee'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 10),
        'Réflexion : écrire sur la copie quel champ va en Lignes et lesquels en Valeurs.',
        'Pièges : Nombre au lieu de Somme ; marge divisée par le CA ; moyenne des taux.',
        'Pas d’équivalent papier : un poste avec Excel par étudiant ou par binôme ; sinon, le formateur construit le TCD au pupitre et la classe lit les valeurs.',
      ),
      proprietes: {
        renvoi: RENVOI_AU_DOSSIER,
        pieceJointe: {
          libelle: 'Les ventes d’octobre de Partie Libre (classeur Excel)',
          classeur: CLASSEUR_DES_VENTES,
          reprend: [],
        },
        intitule: 'Exercice 1 — Le TCD des ventes d’octobre, dans Excel',
        consigne: `Ouvrez le classeur des ${NOMBRE_DE_VENTES} ventes. Construisez un TCD : Canal en Lignes, CA_HT et Cout_achat_HT en Valeurs. Ajoutez le champ calculé Taux de marge. Lisez-y vos réponses.`,
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b1-03-a1-ca-site',
            'tableau-croise-dynamique',
            'Quel est le chiffre d’affaires HT du site web en octobre ?',
            '€',
            SITE.ca,
            moteur.TOLERANCE_NULLE,
            enEuros(SITE.ca),
            [
              [SITE.ventes, SYNTHESE_ERRONEE],
              [auCentime(SITE.ca / SITE.ventes), SYNTHESE_ERRONEE],
            ],
          ),
          moteur.numerique(
            'b1-03-a1-taux-boutique',
            'pourcentage',
            'Quel est le taux de marge de la boutique, arrondi au dixième ?',
            '%',
            auMillionieme(tauxDeMarge(BOUTIQUE.ca, BOUTIQUE.cout)),
            moteur.UNE_DECIMALE,
            enPourcent(tauxDeMarge(BOUTIQUE.ca, BOUTIQUE.cout)),
            [
              [
                auMillionieme(tauxDeMarque(BOUTIQUE.ca, BOUTIQUE.cout)),
                MARQUE_POUR_MARGE,
              ],
            ],
          ),
          moteur.numerique(
            'b1-03-a1-taux-total',
            'moyenne-ponderee',
            'Quel est le taux de marge du total général, arrondi au dixième ?',
            '%',
            auMillionieme(tauxDeMarge(TOTAL_GENERAL.ca, TOTAL_GENERAL.cout)),
            moteur.UNE_DECIMALE,
            enPourcent(tauxDeMarge(TOTAL_GENERAL.ca, TOTAL_GENERAL.cout)),
            [
              [auMillionieme(MOYENNE_DES_TROIS_TAUX), MOYENNE_SIMPLE],
              [
                auMillionieme(
                  tauxDeMarque(TOTAL_GENERAL.ca, TOTAL_GENERAL.cout),
                ),
                MARQUE_POUR_MARGE,
              ],
            ],
          ),
          moteur.vote(
            'b1-03-a1-theo',
            'moyenne-ponderee',
            true,
            `Théo prend la moyenne des taux de marge des ${NOMBRE_DE_VENTES} ventes pour le taux du mois. A-t-il le bon taux ?`,
            'Non : le taux du mois se calcule sur les sommes du TCD',
            [['Oui : chaque vente compte autant', MOYENNE_SIMPLE]],
          ),
        ],
      },
    },
    {
      minutes: 3,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Projeter le TCD juste au pupitre, champ calculé compris.',
        'Transition : jalon 1, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'b1-03-a1-ca-site',
        `Canal en Lignes, CA_HT en Valeurs, en Somme : ${enEuros(SITE.ca)}. En Nombre, le TCD donne ${SITE.ventes} ventes, pas un chiffre d’affaires.`,
      ],
      [
        'b1-03-a1-taux-boutique',
        `(${BOUTIQUE.ca} − ${BOUTIQUE.cout}) ÷ ${BOUTIQUE.cout} ≈ ${enPourcent(tauxDeMarge(BOUTIQUE.ca, BOUTIQUE.cout))}. Diviser par le CA donnerait le taux de marque, ${enPourcent(tauxDeMarque(BOUTIQUE.ca, BOUTIQUE.cout))}.`,
      ],
      [
        'b1-03-a1-taux-total',
        `(${TOTAL_GENERAL.ca} − ${TOTAL_GENERAL.cout}) ÷ ${TOTAL_GENERAL.cout} ≈ ${enPourcent(tauxDeMarge(TOTAL_GENERAL.ca, TOTAL_GENERAL.cout))}. La moyenne des trois taux, ${enPourcent(MOYENNE_DES_TROIS_TAUX)}, oublie que la boutique vend le plus.`,
      ],
      [
        'b1-03-a1-theo',
        `La moyenne des ${NOMBRE_DE_VENTES} taux, ${enPourcent(TOTAL_GENERAL.moyenneDesTaux)}, pèse autant une petite vente qu’une grande ; le champ calculé travaille sur les sommes.`,
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B1-03-A1-10-JALON',
      titre: 'Jalon 1 : regrouper et calculer sur les sommes',
      concepts: ['tableau-croise-dynamique', 'moyenne-ponderee'],
    },
    {
      id: 'b1-03-a1-jalon',
      invite:
        'Je sais construire un TCD, y ajouter le champ calculé du taux de marge et le lire.',
    },
    'Si plus de 30 % « Perdu » : reprendre le geste du TCD au pupitre après la pause.',
    moteur.PAUSE_HORS_DUREE,
  ),
];

function piegesDuQuartile(
  quart: 1 | 3,
): AuMoinsUnModifiable<readonly [number, ConfusionId]> {
  const moitie = RESUME_DE_LA_MARKETPLACE.mediane / 2;
  return [
    [
      quartileAuRangInferieur(PANIERS_DE_LA_MARKETPLACE, quart),
      RANG_PAR_DEFAUT,
    ],
    [
      quart === 1 ? moitie : RESUME_DE_LA_MARKETPLACE.mediane + moitie,
      MOITIE_DE_MEDIANE,
    ],
  ];
}

const ACTE_2: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B1-03-A2-01-REFLEXION-PANIER',
      titre: 'Réfléchir : le panier typique du site web',
      diffusion: 'seance',
      dureeMinutes: 5,
      concepts: ['moyenne', 'mediane', 'choix-du-resume'],
      notes: moteur.puces(
        'Temps « réfléchir » de la notion 2 : 3 min d’écriture individuelle, puis lire trois réponses au pupitre.',
        'Ne rien trancher : la trace écrite suivante répond.',
        'Relance : « Combien de paniers dépassent la moyenne ? »',
        'Papier : cadre de réponse du livret.',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b1-03-a2-reflexion-panier',
        type: 'reflection',
        question: `Le site web a reçu ${PANIERS_AU_TABLEUR.plan.lignes - 1} commandes la dernière semaine de septembre, dont celle d’un club de jeux à ${RESUME_DU_SITE.maximum} €. Théo propose la moyenne des paniers comme « panier typique ». Inès : « Presque personne ne dépense autant ! » Qui a raison ? Quel nombre proposeriez-vous ?`,
        placeholder: 'La commande du club… je proposerais…',
        competency: 'Raisonner · résumer une série',
      },
    },
    {
      correction: {
        expected: `Inès a raison : la commande à ${RESUME_DU_SITE.maximum} € tire la moyenne vers le haut. Un nombre qui laisse autant de paniers au-dessous qu’au-dessus résume mieux le panier typique.`,
        nextAction:
          'Gardez votre réponse : la trace écrite range, puis coupe la série.',
      },
    },
  ),
  pourComprendre(
    {
      screenId: 'B1-03-A2-02-ENFANT-FILE',
      titre: 'Ranger, puis couper',
      concepts: ['mediane', 'quartiles'],
    },
    {
      fichier: 'file-rubans.webp',
      scene:
        'Une file rangée de la plus petite taille à la plus grande ; un trait rouge la coupe en deux, puis deux traits bleus coupent chaque moitié en deux.',
      imageAlt:
        'Dessin : huit enfants rangés du plus petit au plus grand ; un ruban rouge au milieu de la file, deux rubans bleus au milieu de chaque moitié ; quatre petits groupes de deux enfants.',
      regle:
        'on range la série dans l’ordre croissant, puis on la coupe : la médiane Me au milieu, les quartiles Q₁ et Q₃ au milieu de chaque moitié.',
      correspondances: [
        ['La file rangée par taille', 'la série rangée dans l’ordre croissant'],
        ['Le trait rouge', 'la médiane Me'],
        ['Les deux traits bleus', 'les quartiles Q₁ et Q₃'],
      ],
    },
    'Question : « Que faut-il faire avant de couper ? » Ranger.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-03-A2-02-COURS-MEDIANE-QUARTILES',
      titre: 'Cours : médiane et quartiles',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['moyenne', 'mediane', 'quartiles'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : d’abord ranger, puis couper.',
        'Insister : le rang d’un quartile s’arrondit toujours au-dessus.',
      ),
    },
    'lesson',
    {
      title: 'Médiane et quartiles : ranger, puis couper',
      subtitle: 'Trace écrite · notion 2 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Le centre et les quarts',
          text: 'La moyenne partage le total en parts égales ; la médiane Me coupe la série rangée en deux moitiés.\nQ₁ est la plus petite valeur qui laisse au moins un quart des valeurs à sa hauteur ou au-dessous ; Q₃, trois quarts.',
          formula:
            'x̄ = somme des valeurs ÷ n\nMe : rang (n + 1) ÷ 2 si n est impair\nQ₁ : rang n ÷ 4 ; Q₃ : rang 3n ÷ 4, arrondis au-dessus\nécart interquartile = Q₃ − Q₁',
        },
        {
          kind: 'example',
          title: 'Pour débuter : neuf notes',
          text: 'Notes : 8, 12, 10, 15, 9, 14, 11, 18, 13.',
          steps: [
            'Rangées : 8, 9, 10, 11, 12, 13, 14, 15, 18.',
            'Me : rang 5, la note 12 ; x̄ = 110 ÷ 9 ≈ 12,2.',
            'Q₁ : 9 ÷ 4 = 2,25, rang 3, la note 10 ; Q₃ : 6,75, rang 7, la note 14.',
          ],
        },
        {
          kind: 'method',
          title: 'D’abord ranger, puis couper',
          text: 'Une valeur extrême tire la moyenne, pas la médiane.',
          steps: [
            'Ranger les valeurs, compter n.',
            'Calculer les rangs, arrondir au-dessus, lire les valeurs.',
            'Au tableur : =MOYENNE(B2:B22), =MEDIANE(B2:B22), =QUARTILE(B2:B22;1).',
            'Avec 9, 13 ou 21 valeurs, QUARTILE donne la même valeur ; sinon il peut différer.',
          ],
        },
      ],
    },
  ),
  pourComprendre(
    {
      screenId: 'B1-03-A2-03-ENFANT-EQUIPES',
      titre: 'Loin du milieu ou tout près',
      concepts: ['ecart-type', 'dispersion'],
    },
    {
      fichier: 'equipes-tailles.webp',
      scene:
        'Deux équipes, la même ligne pointillée : en vert, tous arrivent presque à la ligne ; en violet, du très grand au tout petit.',
      imageAlt:
        'Dessin : deux équipes de cinq enfants côte à côte, une même ligne pointillée à mi-hauteur ; à gauche, tous presque à la ligne ; à droite, un géant, un tout petit et des tailles très différentes.',
      regle:
        'l’écart type σ dit de combien les valeurs s’écartent de la moyenne, en général.',
      correspondances: [
        ['La ligne pointillée', 'la moyenne, la même pour les deux équipes'],
        ['L’équipe verte, tous près de la ligne', 'un petit écart type'],
        [
          'L’équipe violette, du très grand au tout petit',
          'un grand écart type',
        ],
      ],
    },
    'Question : « Quelle équipe a le plus petit écart ? » Celle de gauche.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-03-A2-03-COURS-ECART-TYPE',
      titre: 'Cours : l’écart type',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['ecart-type', 'dispersion'],
      notes: moteur.puces(
        moteur.DEUXIEME_PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : P comme population.',
      ),
    },
    'lesson',
    {
      title: 'L’écart type : de combien on s’écarte du centre',
      subtitle: 'Trace écrite · notion 2 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'L’écart type σ',
          text: 'σ mesure l’éloignement typique des valeurs à la moyenne, dans l’unité de la série.\nPlus il est petit, plus la série est régulière.',
          formula:
            'σ = √[((x₁ − x̄)² + … + (xₙ − x̄)²) ÷ n]\ntableur : =ECARTYPEP(B2:B22)',
        },
        {
          kind: 'example',
          title: 'Pour débuter : deux séries de moyenne 10',
          text: 'Série A : 9, 10, 11. Série B : 0, 10, 20.',
          steps: [
            'A : σ = √(2 ÷ 3) ≈ 0,8.',
            'B : σ = √(200 ÷ 3) ≈ 8,2.',
            'Même moyenne, régularité très différente.',
          ],
        },
        {
          kind: 'method',
          title: 'P comme population',
          text: 'On étudie toutes les valeurs : ECARTYPEP.',
          steps: [
            'ECARTYPEP, pas ECARTYPE, qui divise par n − 1.',
            'Écrire σ avec son unité.',
            'Comparer deux σ de même unité.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B1-03-A2-04-EXEMPLE-MARDI',
      titre: 'Exemple guidé : treize paniers d’un mardi',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['moyenne', 'mediane', 'quartiles', 'choix-du-resume'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b1-03-a2-exemple-mardi',
          enonce: `Treize paniers d’un mardi sur le site web, en euros : ${PANIERS_DU_MARDI.join(', ')}.`,
          etapes: [
            {
              id: 'ranger',
              intitule: 'Ranger',
              raisonnement: `${[...PANIERS_DU_MARDI].sort((a, b) => a - b).join(', ')}.`,
              invite: 'Rangez les treize paniers.',
            },
            {
              id: 'mediane',
              intitule: 'La médiane',
              raisonnement: `n = 13, rang (13 + 1) ÷ 2 = 7 : Me = ${RESUME_DU_MARDI.mediane} €.`,
              invite: 'Quel rang, quelle médiane ?',
            },
            {
              id: 'quartiles',
              intitule: 'Les quartiles',
              raisonnement: `13 ÷ 4 = 3,25, rang 4 : Q₁ = ${RESUME_DU_MARDI.q1} € ; 39 ÷ 4 = 9,75, rang 10 : Q₃ = ${RESUME_DU_MARDI.q3} € ; écart interquartile ${RESUME_DU_MARDI.q3 - RESUME_DU_MARDI.q1} €.`,
              invite: 'Quels rangs, quels quartiles ?',
            },
            {
              id: 'moyenne',
              intitule: 'La moyenne',
              raisonnement: `x̄ = ${somme(PANIERS_DU_MARDI)} ÷ ${PANIERS_DU_MARDI.length} ≈ ${enUnite(auDixieme(RESUME_DU_MARDI.moyenne))}.`,
              invite: 'Quelle est la moyenne ?',
            },
            {
              id: 'choisir',
              intitule: 'Choisir',
              raisonnement: `La médiane : la commande de ${RESUME_DU_MARDI.maximum} € tire la moyenne au-dessus de ${sousLaMoyenne(PANIERS_DU_MARDI, RESUME_DU_MARDI.moyenne)}.`,
              invite: 'Quel nombre résume le panier typique ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur l’arrondi au-dessus du rang (étape 3).',
        'Transition : « À vous, à la main : exercice 2. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-03-A2-05-ATELIER-MARKETPLACE',
      titre: 'Exercice 2 — Les neuf paniers de la marketplace',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 6,
      concepts: ['mediane', 'quartiles', 'choix-du-resume'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 4),
        'Réflexion : ranger les neuf paniers sur la copie avant tout calcul.',
        'Pièges : milieu sans ranger ; rang arrondi au-dessous ; quartile tiré de la médiane.',
        'Papier : exercice 2 du livret.',
      ),
      proprietes: {
        intitule: 'Exercice 2 — Les neuf paniers de la marketplace',
        consigne: `Neuf paniers d’un jour sur la marketplace, en euros : ${PANIERS_DE_LA_MARKETPLACE.join(', ')}. Sans tableur.`,
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b1-03-a2-mediane',
            'mediane',
            'Quelle est la médiane de ces paniers ?',
            '€',
            RESUME_DE_LA_MARKETPLACE.mediane,
            moteur.TOLERANCE_NULLE,
            enEuros(RESUME_DE_LA_MARKETPLACE.mediane),
            [
              [PANIERS_DE_LA_MARKETPLACE[4], SANS_TRI],
              [
                auDixieme(RESUME_DE_LA_MARKETPLACE.moyenne),
                MOYENNE_POUR_MEDIANE,
              ],
            ],
          ),
          moteur.numerique(
            'b1-03-a2-q1',
            'quartiles',
            'Quel est le premier quartile Q₁ ?',
            '€',
            quartileDuProgramme(PANIERS_DE_LA_MARKETPLACE, 1),
            moteur.TOLERANCE_NULLE,
            enEuros(quartileDuProgramme(PANIERS_DE_LA_MARKETPLACE, 1)),
            piegesDuQuartile(1),
          ),
          moteur.numerique(
            'b1-03-a2-q3',
            'quartiles',
            'Quel est le troisième quartile Q₃ ?',
            '€',
            quartileDuProgramme(PANIERS_DE_LA_MARKETPLACE, 3),
            moteur.TOLERANCE_NULLE,
            enEuros(quartileDuProgramme(PANIERS_DE_LA_MARKETPLACE, 3)),
            piegesDuQuartile(3),
          ),
          moteur.vote(
            'b1-03-a2-resume',
            'choix-du-resume',
            true,
            'Quel nombre résume le mieux le panier typique de la marketplace ?',
            `La médiane : le panier de ${RESUME_DE_LA_MARKETPLACE.maximum} € tire la moyenne vers le haut`,
            [['La moyenne : elle compte tous les paniers', EXTREME_IGNOREE]],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE,
        'Transition : « Faisons faire le travail au tableur : exercice 3. »',
      ],
    },
    [
      [
        'b1-03-a2-mediane',
        `Rangés : ${[...PANIERS_DE_LA_MARKETPLACE].sort((a, b) => a - b).join(', ')}. Rang 5 : ${enEuros(RESUME_DE_LA_MARKETPLACE.mediane)}. Sans ranger, on lirait ${PANIERS_DE_LA_MARKETPLACE[4]} €.`,
      ],
      [
        'b1-03-a2-q1',
        `9 ÷ 4 = 2,25, arrondi au-dessus : rang 3, ${enEuros(RESUME_DE_LA_MARKETPLACE.q1)}. Le rang 2 donnerait ${quartileAuRangInferieur(PANIERS_DE_LA_MARKETPLACE, 1)} €.`,
      ],
      [
        'b1-03-a2-q3',
        `27 ÷ 4 = 6,75, arrondi au-dessus : rang 7, ${enEuros(RESUME_DE_LA_MARKETPLACE.q3)}.`,
      ],
      [
        'b1-03-a2-resume',
        `La moyenne vaut environ ${enUnite(auDixieme(RESUME_DE_LA_MARKETPLACE.moyenne))}, au-dessus de ${sousLaMoyenne(PANIERS_DE_LA_MARKETPLACE, RESUME_DE_LA_MARKETPLACE.moyenne)} : la médiane résume mieux.`,
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-03-A2-06-TABLEUR-PANIERS',
      titre: 'Exercice 3 — Résumer les paniers au tableur',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 8,
      concepts: ['tableur', 'moyenne', 'quartiles', 'ecart-type'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 6),
        'Réflexion : écrire sur papier la formule de E2, puis ce qu’elle devient en F2 une fois recopiée vers la droite.',
        'Erreurs à chercher : ECARTYPE au lieu d’ECARTYPEP ; ARRONDI oublié ; étendue au lieu de l’écart interquartile.',
        'Papier : formules écrites sur la copie avec la grille des cellules.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: PANIERS_AU_TABLEUR.plan,
        questions: [
          moteur.questionDeFeuille(
            PANIERS_AU_TABLEUR.plan,
            PANIERS_AU_TABLEUR.attendus,
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Transition : « Comparez les deux colonnes : jalon 2. »',
      ],
    },
    [
      [
        'E2 à E7',
        `${PANIERS_AU_TABLEUR.formules.join(' ; ')}. Site web : ${resumeEcrit(RESUME_DU_SITE)}.`,
      ],
      [
        'F2 à F7',
        `Les mêmes formules, recopiées vers la droite : B devient C. Boutique de Nantes : ${resumeEcrit(RESUME_DE_NANTES)}.`,
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B1-03-A2-07-JALON',
      titre: 'Jalon 2 : résumer une série',
      concepts: ['mediane', 'quartiles', 'ecart-type'],
    },
    {
      id: 'b1-03-a2-jalon',
      invite:
        'Je sais calculer médiane et quartiles à la main, et résumer une série au tableur.',
    },
    'Si plus de 30 % « Perdu » : reprendre l’exemple des neuf notes de la trace écrite A2-02.',
  ),
];

function resumeEcrit(resume: ResumeDUneSerie): string {
  return [
    `moyenne ${enUnite(auDixieme(resume.moyenne))}`,
    `médiane ${resume.mediane} €`,
    `Q₁ ${resume.q1} €`,
    `Q₃ ${resume.q3} €`,
    `écart type ${enUnite(auDixieme(resume.ecartType))}`,
    `écart interquartile ${resume.q3 - resume.q1} €`,
  ].join(', ');
}

function serieDeLaBoite(
  label: string,
  resume: ResumeDUneSerie,
  tone: 'teal' | 'gold',
) {
  return {
    label,
    min: resume.minimum,
    q1: resume.q1,
    median: resume.mediane,
    q3: resume.q3,
    max: resume.maximum,
    mean: auDixieme(resume.moyenne),
    tone,
  };
}

const BOITE_D_ANGERS_EXEMPLE = {
  minimum: 12,
  q1: 25,
  mediane: 34,
  q3: 41,
  maximum: 70,
};
const BOITE_DE_TOURS_EXEMPLE = {
  minimum: 20,
  q1: 30,
  mediane: 33,
  q3: 36,
  maximum: 48,
};
const CLASSES_DE_L_EXEMPLE = [
  { debut: 0, fin: 25, effectif: 25 },
  { debut: 25, fin: 50, effectif: 60 },
  { debut: 50, fin: 75, effectif: 15 },
] as const;

const ACTE_3: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B1-03-A3-01-VOTE-COMPARER',
      titre: 'Vote : comparer sans tout relire',
      dureeMinutes: 5,
      concepts: ['boite-a-moustaches', 'moyenne'],
      notes: moteur.notesDuVoteQuiOuvreLaNotion(3),
    },
    [
      moteur.vote(
        'b1-03-a3-vote-boite',
        'boite-a-moustaches',
        false,
        'Une série est coupée en quatre parts par ses quartiles et sa médiane. Sur un dessin, la part du haut est très longue. Contient-elle plus de valeurs que les autres ?',
        'Non, autant que chacune des trois autres parts',
        [['Oui, puisqu’elle est plus longue', BOITE_EFFECTIF]],
      ),
      moteur.vote(
        'b1-03-a3-vote-centre',
        'moyenne',
        false,
        'Des paniers groupés par tranches : 30 paniers entre 20 € et 40 €. Pour calculer une moyenne, quel montant prendre pour eux ?',
        '30 €, le milieu de la tranche',
        [['20 €, le début de la tranche', CENTRE_OUBLIE]],
      ),
    ],
  ),
  pourComprendre(
    {
      screenId: 'B1-03-A3-02-ENFANT-BOITE',
      titre: 'Une boîte pour ceux du milieu',
      concepts: ['boite-a-moustaches'],
    },
    {
      fichier: 'file-boite.webp',
      scene:
        'La file est rangée par taille ; une boîte en carton entoure la moitié du milieu, et une sangle va du plus petit au plus grand.',
      imageAlt:
        'Dessin : une file d’enfants rangés par taille ; les enfants du milieu entourés d’une grande boîte en carton ouverte ; deux bras tendus vont jusqu’au plus petit et jusqu’au plus grand.',
      regle:
        'la boîte à moustaches va de Q₁ à Q₃, les moustaches du minimum au maximum.',
      correspondances: [
        ['La boîte en carton', 'la boîte, de Q₁ à Q₃ : la moitié centrale'],
        ['La sangle de part et d’autre', 'les moustaches'],
        [
          'Le plus petit et le plus grand de la file',
          'le minimum et le maximum',
        ],
      ],
    },
    'Question : « Quelle part de la file tient dans la boîte ? » La moitié.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-03-A3-02-COURS-BOITE',
      titre: 'Cours : la boîte à moustaches',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['boite-a-moustaches', 'dispersion'],
      notes: moteur.puces(
        moteur.PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : le centre, puis la boîte.',
      ),
    },
    'lesson',
    {
      title: 'La boîte à moustaches : cinq nombres, quatre quarts',
      subtitle: 'Trace écrite · notion 3 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Cinq nombres',
          text: 'La boîte va de Q₁ à Q₃ et porte la médiane ; les moustaches vont du minimum au maximum.\nChaque part contient un quart des valeurs, quelle que soit sa longueur.',
          formula:
            'min — Q₁ — Me — Q₃ — max\nlongueur de la boîte = écart interquartile',
        },
        {
          kind: 'example',
          title: 'Pour débuter : les neuf notes',
          text: 'Les notes de la page médiane et quartiles.',
          steps: [
            'min 8, Q₁ 10, Me 12, Q₃ 14, max 18.',
            'Boîte de 10 à 14, trait à 12.',
            'Moustaches de 8 à 10 et de 14 à 18.',
          ],
        },
        {
          kind: 'method',
          title: 'Le centre, puis la boîte',
          text: 'Deux boîtes sur le même axe se comparent d’un coup d’œil.',
          steps: [
            'Comparer les médianes.',
            'Comparer les longueurs de boîte : la plus courte est la plus régulière.',
            'Repérer une moustache tirée par une valeur extrême.',
          ],
        },
      ],
    },
  ),
  pourComprendre(
    {
      screenId: 'B1-03-A3-03-ENFANT-BILLES',
      titre: 'Des boîtes de billes',
      concepts: ['moyenne', 'choix-du-resume'],
    },
    {
      fichier: 'billes-boites.webp',
      scene:
        'Trop de billes pour les regarder une à une : on les range par grosseur dans trois boîtes, puis on compte chaque boîte.',
      imageAlt:
        'Dessin : un tapis couvert de billes de toutes tailles ; trois boîtes alignées, pour les petites, les moyennes et les grosses billes ; un enfant y range les billes.',
      regle:
        'on regroupe la série en classes [a ; b[ et on compte l’effectif de chacune ; on lit ensuite les classes, plus chaque valeur.',
      correspondances: [
        ['Une bille', 'une valeur de la série'],
        ['Une boîte : petites, moyennes ou grosses', 'une classe [a ; b['],
        ['Le nombre de billes dans une boîte', 'l’effectif de la classe'],
      ],
    },
    'Question : « Regarde-t-on encore chaque bille ? » Non : chaque boîte.',
  ),
  moteur.ecranV2(
    {
      screenId: 'B1-03-A3-03-COURS-CLASSES',
      titre: 'Cours : regrouper en classes',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['moyenne', 'choix-du-resume'],
      notes: moteur.puces(
        moteur.DEUXIEME_PAGE_APRES_SON_ILLUSTRATION,
        'Faire répéter le moyen mnémotechnique : le milieu représente la classe.',
      ),
    },
    'lesson',
    {
      title: 'Les classes : un grand fichier en quelques boîtes',
      subtitle: 'Trace écrite · notion 3 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Une classe et son centre',
          text: 'Une classe [a ; b[ regroupe les valeurs de a inclus à b exclu ; on compte son effectif.\nSon centre la représente pour une moyenne approchée.',
          formula:
            'centre = (a + b) ÷ 2\nmoyenne approchée = (n₁ × c₁ + … + nₖ × cₖ) ÷ N',
        },
        {
          kind: 'example',
          title: 'Pour débuter : 40 temps de trajet',
          text: '[0 ; 10[ : 8 trajets, [10 ; 20[ : 20, [20 ; 30[ : 12.',
          steps: [
            'Centres : 5, 15 et 25 minutes.',
            '5 × 8 + 15 × 20 + 25 × 12 = 640.',
            '640 ÷ 40 = 16 minutes environ.',
          ],
        },
        {
          kind: 'method',
          title: 'Le milieu représente la classe',
          text: 'Une moyenne approchée, pas exacte.',
          steps: [
            'Écrire le centre de chaque classe.',
            'Multiplier chaque centre par son effectif.',
            'Diviser la somme par l’effectif total.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B1-03-A3-04-EXEMPLE-BOUTIQUES',
      titre: 'Exemple guidé : deux boutiques, deux boîtes',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['boite-a-moustaches', 'moyenne'],
      notes: moteur.puces(...moteur.NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b1-03-a3-exemple-boutiques',
          enonce: `Paniers de septembre, en euros. Angers : min ${BOITE_D_ANGERS_EXEMPLE.minimum}, Q₁ ${BOITE_D_ANGERS_EXEMPLE.q1}, Me ${BOITE_D_ANGERS_EXEMPLE.mediane}, Q₃ ${BOITE_D_ANGERS_EXEMPLE.q3}, max ${BOITE_D_ANGERS_EXEMPLE.maximum}. Tours : min ${BOITE_DE_TOURS_EXEMPLE.minimum}, Q₁ ${BOITE_DE_TOURS_EXEMPLE.q1}, Me ${BOITE_DE_TOURS_EXEMPLE.mediane}, Q₃ ${BOITE_DE_TOURS_EXEMPLE.q3}, max ${BOITE_DE_TOURS_EXEMPLE.maximum}. Les 100 paniers d’Angers en classes : ${CLASSES_DE_L_EXEMPLE.map(classeEcrite).join(', ')}.`,
          etapes: [
            {
              id: 'centre',
              intitule: 'Les centres',
              raisonnement: `Médianes ${BOITE_D_ANGERS_EXEMPLE.mediane} et ${BOITE_DE_TOURS_EXEMPLE.mediane} : le panier typique est presque le même.`,
              invite: 'Comparez les médianes.',
            },
            {
              id: 'boite',
              intitule: 'Les boîtes',
              raisonnement: `Écarts interquartiles ${BOITE_D_ANGERS_EXEMPLE.q3 - BOITE_D_ANGERS_EXEMPLE.q1} et ${BOITE_DE_TOURS_EXEMPLE.q3 - BOITE_DE_TOURS_EXEMPLE.q1} : Tours est plus régulière.`,
              invite: 'Comparez les longueurs de boîte.',
            },
            {
              id: 'piege',
              intitule: 'La longue moustache',
              raisonnement: `La moustache haute d’Angers, de ${BOITE_D_ANGERS_EXEMPLE.q3} à ${BOITE_D_ANGERS_EXEMPLE.maximum}, ne contient qu’un quart des paniers.`,
              invite:
                'La moustache haute d’Angers contient-elle plus de paniers ?',
            },
            {
              id: 'centres',
              intitule: 'Les centres des classes',
              raisonnement: CLASSES_DE_L_EXEMPLE.map(centreDeClasse)
                .map((centre) => avecVirgule(centre))
                .join(', ')
                .concat('.'),
              invite: 'Quel est le centre de chaque classe ?',
            },
            {
              id: 'moyenne',
              intitule: 'La moyenne approchée',
              raisonnement: `${moyenneParClasses([...CLASSES_DE_L_EXEMPLE], centreDeClasse)} € environ ; avec les débuts de classe, on trouverait ${avecVirgule(moyenneParClasses([...CLASSES_DE_L_EXEMPLE], ({ debut }) => debut))} € : faux.`,
              invite: 'Quelle moyenne approchée pour Angers ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur la longue moustache (étape 3) et sur les centres (étape 4).',
        'Transition : « Vos résultats de l’exercice 3, en boîtes. »',
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: RENVOI_AUX_BOITES,
      titre: 'Les paniers des deux canaux en boîtes',
      diffusion: 'seance',
      dureeMinutes: 1,
      concepts: ['boite-a-moustaches'],
      notes: moteur.puces(
        '1 min : faire lire les deux boîtes, sans conclure ; l’exercice 4 conclut.',
      ),
    },
    'boxplot',
    {
      title: 'Les paniers de fin septembre en boîtes',
      subtitle: 'Les résultats de l’exercice 3, sur le même axe.',
      unit: '€',
      axisRange: [0, 500],
      series: [
        serieDeLaBoite('Site web', RESUME_DU_SITE, 'teal'),
        serieDeLaBoite('Boutique de Nantes', RESUME_DE_NANTES, 'gold'),
      ],
      source: DONNEES_FICTIVES,
      description: `Deux boîtes à moustaches horizontales sur un axe de 0 à 500 euros. Site web : boîte de ${RESUME_DU_SITE.q1} à ${RESUME_DU_SITE.q3}, médiane ${RESUME_DU_SITE.mediane}, moustache haute jusqu’à ${RESUME_DU_SITE.maximum}. Boutique de Nantes : boîte de ${RESUME_DE_NANTES.q1} à ${RESUME_DE_NANTES.q3}, médiane ${RESUME_DE_NANTES.mediane}, moustaches de ${RESUME_DE_NANTES.minimum} à ${RESUME_DE_NANTES.maximum}.`,
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B1-03-A3-06-ATELIER-COMPARER',
      titre: 'Exercice 4 — Choisir un résumé',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 10,
      concepts: [
        'boite-a-moustaches',
        'choix-du-resume',
        'moyenne',
        'dispersion',
      ],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 8),
        'Réflexion : comparer d’abord les médianes, puis les boîtes.',
        'Pièges : partie longue lue comme plus peuplée ; moyenne malgré la valeur extrême ; borne au lieu du centre.',
        'Papier : exercice 4 du livret, boîtes imprimées.',
      ),
      proprietes: {
        renvoi: RENVOI_AUX_BOITES,
        intitule: 'Exercice 4 — Choisir un résumé',
        consigne: `Boîtes : les paniers de fin septembre. Classes : les 200 paniers de Nantes en juillet et août, ${CLASSES_DE_NANTES.map(classeEcrite).join(', ')}.`,
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b1-03-a3-regulier',
            'dispersion',
            true,
            'Quels paniers sont les plus réguliers ?',
            'Nantes : la boîte la plus courte',
            [['Autant : médianes proches', MEME_MOYENNE]],
          ),
          moteur.vote(
            'b1-03-a3-quart',
            'boite-a-moustaches',
            true,
            'Part des paniers du site web de Q₃ au maximum ?',
            'Un quart, malgré la longueur',
            [['La plupart : partie la plus longue', BOITE_EFFECTIF]],
          ),
          moteur.vote(
            'b1-03-a3-resume',
            'choix-du-resume',
            true,
            'Quel couple présenter pour le site web ?',
            'Médiane et écart interquartile, hors effet du club',
            [['Moyenne et écart type', EXTREME_IGNOREE]],
          ),
          moteur.numerique(
            'b1-03-a3-moyenne-classes',
            'moyenne',
            'Moyenne approchée des 200 paniers de Nantes ?',
            '€',
            MOYENNE_DES_CLASSES,
            moteur.TOLERANCE_NULLE,
            enEuros(MOYENNE_DES_CLASSES),
            [
              [
                moyenneParClasses(CLASSES_DE_NANTES, ({ debut }) => debut),
                CENTRE_OUBLIE,
              ],
              [
                moyenneParClasses(CLASSES_DE_NANTES, ({ fin }) => fin),
                CENTRE_OUBLIE,
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
        'Transition : jalon 3, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'b1-03-a3-regulier',
        `Écarts interquartiles : ${RESUME_DE_NANTES.q3 - RESUME_DE_NANTES.q1} € à Nantes, ${RESUME_DU_SITE.q3 - RESUME_DU_SITE.q1} € sur le site.`,
      ],
      [
        'b1-03-a3-quart',
        `De ${RESUME_DU_SITE.q3} € à ${RESUME_DU_SITE.maximum} € : un quart, étiré par le club.`,
      ],
      [
        'b1-03-a3-resume',
        'Le club tire moyenne et écart type, pas la médiane.',
      ],
      [
        'b1-03-a3-moyenne-classes',
        `Centres ${CLASSES_DE_NANTES.map(centreDeClasse).join(', ')} : ${enEuros(MOYENNE_DES_CLASSES)}, pas ${moyenneParClasses(CLASSES_DE_NANTES, ({ debut }) => debut)} €.`,
      ],
    ],
  ),
  moteur.pulsation(
    {
      screenId: 'B1-03-A3-07-JALON',
      titre: 'Jalon 3 : comparer et choisir un résumé',
      concepts: ['boite-a-moustaches', 'choix-du-resume'],
    },
    {
      id: 'b1-03-a3-jalon',
      invite:
        'Je sais lire deux boîtes à moustaches et calculer une moyenne par les centres des classes.',
    },
    moteur.PAUSE_HORS_DUREE,
  ),
];

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  [SYNTHESE_ERRONEE]: 'B1-03-A1-06-COURS-TCD',
  [MARQUE_POUR_MARGE]: 'B1-03-A1-07-COURS-CHAMP-CALCULE',
  [ECART]: 'B1-03-A1-07-COURS-CHAMP-CALCULE',
  [MOYENNE_SIMPLE]: 'B1-03-A1-07-COURS-CHAMP-CALCULE',
  [SANS_TRI]: 'B1-03-A2-02-COURS-MEDIANE-QUARTILES',
  [MEDIANE_PAIRE]: 'B1-03-A2-02-COURS-MEDIANE-QUARTILES',
  [MOYENNE_POUR_MEDIANE]: 'B1-03-A2-02-COURS-MEDIANE-QUARTILES',
  [RANG_PAR_DEFAUT]: 'B1-03-A2-02-COURS-MEDIANE-QUARTILES',
  [MOITIE_DE_MEDIANE]: 'B1-03-A2-02-COURS-MEDIANE-QUARTILES',
  [EXTREME_IGNOREE]: 'B1-03-A2-02-COURS-MEDIANE-QUARTILES',
  [ECHANTILLON]: 'B1-03-A2-03-COURS-ECART-TYPE',
  [ARRONDI_OUBLIE]: 'B1-03-A2-03-COURS-ECART-TYPE',
  [ETENDUE]: 'B1-03-A2-03-COURS-ECART-TYPE',
  'formule-non-recopiable-en-ligne': 'B1-03-A2-03-COURS-ECART-TYPE',
  [MEME_MOYENNE]: 'B1-03-A3-02-COURS-BOITE',
  [BOITE_EFFECTIF]: 'B1-03-A3-02-COURS-BOITE',
  [CENTRE_OUBLIE]: 'B1-03-A3-03-COURS-CLASSES',
};

const POUR_COMPRENDRE = [
  ['M1', 'bonbons-tas.webp', 'Un tas par couleur'],
  ['M2', 'limonade-pots.webp', 'Calculer avec tout ce qu’on a'],
  ['M3', 'file-rubans.webp', 'Ranger, puis couper'],
  ['M4', 'equipes-tailles.webp', 'Loin du milieu ou tout près'],
  ['M5', 'file-boite.webp', 'Une boîte pour ceux du milieu'],
  ['M6', 'billes-boites.webp', 'Des boîtes de billes'],
] as const;

const MEDIAS = moteur.mediasDesIllustrations(
  DOSSIER_DES_IMAGES,
  POUR_COMPRENDRE,
  GRAVURE_DE_L_ACCROCHE,
);

export const COURS_B1_03 = moteur.coursB1(
  [ACTE_1, ACTE_2, ACTE_3, ACTE_4],
  REMEDIATIONS,
  MEDIAS,
  {
    slug: 'b1-03-tcd-serie-une-variable',
    titre: 'Traiter un fichier : TCD et série à une variable',
    gabarit: 'v3',
    concepts: [...CONCEPTS_DU_COURS],
  },
);
