import type { ConfusionId } from '../../../../domain/cours/banque/confusions';
import {
  CA_HT_SAISI_EN_TEXTE,
  CLASSEURS_B3_01,
  DEFIS_B3_01,
} from '../b3-01/b3-01.donnees';
import {
  ecranDuTriDesAnomalies,
  EXPORT_BRUT_A_TELECHARGER,
  FOND_DE_LA_GRAVURE,
} from '../b3-01/b3-01.acte-1';
import { questionChiffreeB302 } from './b3-02.donnees';
import {
  pageDeFormules,
  type PieceReservee,
  voteQuiOuvre,
} from './b3-02.briques';
import * as moteur from '../../briques';

export const REPRISE_NETTOYEE: PieceReservee = {
  libelle: 'Classeur de reprise nettoyé',
  classeur: CLASSEURS_B3_01.repriseActe2,
  reprend: ['B3-02-A1-03-TRI-ANOMALIES', 'B3-02-A1-08-ATELIER-NETTOYAGE'],
};

const PIEGES_DE_LA_SOMME_SOUS_CONDITIONS: [ConfusionId, ...ConfusionId[]] = [
  'critere-mal-ecrit',
  'plage-recherche-non-figee',
  'periode-mal-delimitee',
];

export const ACTE_1: moteur.Acte = [
  {
    screenId: 'B3-02-A1-01-RAPPEL-GRILLE',
    titre: 'Rappel : la grille de la qualité',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 2,
    concepts: ['qualite-des-donnees'],
    notes: moteur.puces(
      'Pendant que les postes rejoignent la séance : vérifier au pupitre que tous sont connectés.',
      'Réponse de mémoire. Sous 70 % de bonnes réponses, redire les deux questions de la grille avant l’exercice 1 : l’erreur est-elle certaine ? la bonne valeur est-elle dans le fichier ?',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b3-02-a1-rappel-grille',
          'qualite-des-donnees',
          true,
          'Une ligne de l’export porte une quantité de −2. Dans quelle case de la grille de la qualité la rangez-vous ?',
          'Suspect · à demander à un humain',
          [
            [
              'Faux · correction automatique',
              'suspect-corrige-sans-validation',
            ],
            ['Faux · à demander à un humain', 'donnee-douteuse-jugee-fausse'],
          ],
        ),
      ],
      delaiMs: 0,
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B3-02-A1-02-REPRISE',
      titre: 'Toutes les formules, puis l’IA analyste',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['jeu-de-donnees'],
      notes: moteur.puces(
        'Faire télécharger l’export brut ; ceux qui l’ont gardé de la séance 1 repartent de leur fichier.',
        'Annoncer la séance : deux heures de formules, une par une, avec un exercice guidé après chaque famille ; une fiche récap ; puis une heure où une IA fait le travail et où l’on vérifie ses chiffres.',
      ),
    },
    'hero',
    {
      title: 'Toutes les formules, puis l’IA analyste',
      subtitle:
        'Mardi 17 novembre, 8 h 30. Nadia Ferrand attend toujours l’analyse de son export. On reprend là où on s’est arrêtés : le nettoyage. Deux heures pour savoir faire, formule par formule ; une heure pour faire faire à une IA, et vérifier. Données fictives.',
      ...FOND_DE_LA_GRAVURE,
    },
    EXPORT_BRUT_A_TELECHARGER,
  ),
  ecranDuTriDesAnomalies(
    {
      screenId: 'B3-02-A1-03-TRI-ANOMALIES',
      titre: 'Exercice 1 — Classer les anomalies',
      questionId: 'b3-02-a1-anomalies',
    },
    [
      'Réflexion : pour chaque carte, deux questions dans l’ordre. 1. L’erreur est-elle certaine ? 2. La bonne valeur est-elle dans le fichier ?',
    ],
    [
      'Corriger case par case ; finir par la case vide.',
      'Règle 2 du cahier : « Je corrige seul ce qui est faux et certain ; je signale ce qui est douteux, je ne supprime rien. »',
      'Transition : « Les formules qui corrigent le faux certain : un vote d’abord. »',
    ],
  ),
  voteQuiOuvre(
    {
      screenId: 'B3-02-A1-04-VOTE-ESPACES',
      titre: 'Vote : des espaces invisibles',
      dureeMinutes: 2,
      concepts: ['nettoyage'],
      notes: moteur.puces(
        'Temps « réfléchir » du nettoyage : vote non noté, 1 min de vote et 1 min de révélation.',
        'Révélation : taper la formule dans le classeur brut, en E783 ; Excel rend FAUX.',
      ),
    },
    moteur.vote(
      'b3-02-a1-espaces',
      'nettoyage',
      false,
      'La cellule E783 contient le mot Bordeaux entouré d’une espace de chaque côté. Que rend la formule =E783="Bordeaux" ?',
      'FAUX : les deux espaces font partie du texte',
      [['VRAI : Excel ignore les espaces', 'espaces-non-supprimes']],
    ),
  ),
  pageDeFormules(
    {
      screenId: 'B3-02-A1-05-FORMULES-TEXTE',
      titre: 'Formules : SUPPRESPACE et NOMPROPRE',
      concepts: ['nettoyage'],
      notes: [
        '2 min, enchaînées sur les deux pages suivantes : 6 min d’exposition au plus.',
        'Faire lire la formule de l’intérieur vers l’extérieur : SUPPRESPACE d’abord, NOMPROPRE ensuite. MAJUSCULE et MINUSCULE prennent le même argument.',
        'Rappeler : le numéro de la dernière ligne compte l’en-tête ; Supprimer les doublons se fait toutes colonnes cochées.',
      ],
    },
    {
      rang: 1,
      syntaxe:
        '=NOMPROPRE(SUPPRESPACE(E2)) : SUPPRESPACE retire les espaces en trop, NOMPROPRE met une majuscule à chaque mot.',
      arguments: 'texte, une cellule ou un texte entre guillemets.',
      piege: 'écrire dans la colonne E elle-même ; on écrit en N.',
      exemple: '« ␣BORDEAUX␣ » devient « Bordeaux ».',
    },
  ),
  pageDeFormules(
    {
      screenId: 'B3-02-A1-06-FORMULES-NOMBRE',
      titre: 'Formules : SUBSTITUE, CNUM et ESTNUM',
      concepts: ['nettoyage'],
      notes: [
        '2 min ; montrer dans le classeur brut une cellule de ca_ht alignée à gauche : c’est du texte, et SOMME l’ignore sans message.',
        'Formule complète : =CNUM(SUBSTITUE(SUBSTITUE(L2;" €";"");" ";"")). ESTNUM(valeur) rend VRAI pour un nombre.',
        'Les vrais exports séparent souvent les milliers par une espace insécable : SUBSTITUE(L2;UNICAR(160);"") la retire.',
      ],
    },
    {
      rang: 2,
      syntaxe:
        'SUBSTITUE(texte; ancien; nouveau) remplace ; CNUM(texte) convertit en nombre ; ESTNUM(valeur) vérifie.',
      arguments:
        'ancien entre guillemets, " €" puis " " ; nouveau, "" pour rien.',
      piege: 'CNUM avant SUBSTITUE rend #VALEUR!.',
      exemple: `« ${CA_HT_SAISI_EN_TEXTE} » devient 1150, un nombre.`,
    },
  ),
  pageDeFormules(
    {
      screenId: 'B3-02-A1-07-FORMULES-CONTROLE',
      titre: 'Formules : SI, OU et ET',
      concepts: ['qualite-des-donnees'],
      notes: [
        '2 min ; faire dire, pour la ligne de l’exemple, ce que vaut chacun des trois tests : C2<B2, I2<=0, G2="".',
        'Une ligne signalée part en quarantaine avec son motif : on ne la corrige pas, on ne la supprime pas, on demande. Le contrôle se pose sur les données brutes ; une date restée en texte est signalée, c’est voulu.',
        'Transition : « Au travail sur le vrai fichier : exercice 2. »',
      ],
    },
    {
      rang: 3,
      syntaxe:
        'SI(test; si_vrai; si_faux) ; OU(test1; test2; …) vrai si un test l’est, ET(…) si tous.',
      arguments: 'un test compare, C2<B2 ; un texte rendu va entre guillemets.',
      piege: 'ET au lieu de OU ne signale presque rien.',
      exemple: 'livrée le 3 mars, commandée le 5 : « À vérifier ».',
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-02-A1-08-ATELIER-NETTOYAGE',
      titre: 'Exercice 2 — Nettoyer et contrôler l’export',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 13,
      concepts: ['qualite-des-donnees', 'nettoyage'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 12),
        'Réflexion : faire relire les cinq étapes avant de commencer ; passer dans les rangs dès l’étape 2.',
        'Pièges : dédoublonner sur n_commande seule ; compter l’en-tête parmi les lignes ; additionner la colonne L brute ; poser le contrôle sur des dates converties.',
      ),
      proprietes: {
        intitule: 'Exercice 2 — Nettoyer et contrôler l’export',
        consigne:
          'Dans le classeur brut. Étape 1 : effacez tout filtre (Données › Effacer), puis copiez l’onglet Commandes (clic droit sur l’onglet › Déplacer ou copier › Créer une copie) ; on travaille sur la copie. Étape 2 : tapez en N2 =NOMPROPRE(SUPPRESPACE(E2)) et en O2 =CNUM(SUBSTITUE(SUBSTITUE(L2;" €";"");" ";"")) ; recopiez les deux jusqu’en bas par un double-clic sur la poignée. Étape 3 : Données › Supprimer les doublons, toutes les colonnes cochées, case « Mes données ont des en-têtes » cochée. Étape 4 : tapez en P2 =SI(OU(C2<B2;I2<=0;G2="");"À vérifier";"OK") et recopiez-la. Étape 5 : comptez ; filtrez la colonne P sur « À vérifier » : la barre d’état d’Excel affiche le nombre de lignes visibles.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffreeB302(
            'b3-02-a1-lignes-uniques',
            'nettoyage',
            'Combien de lignes de données, hors en-tête, reste-t-il après l’étape 3 ?',
            'lignes',
            [
              'doublons-supprimes-sur-une-colonne',
              'en-tete-compte-comme-ligne',
            ],
          ),
          questionChiffreeB302(
            'b3-02-a1-ca-total',
            'nettoyage',
            'Quel est le CA total HT de la colonne O, =SOMME(O2:O4099) ?',
            '€',
            ['texte-pris-pour-nombre'],
          ),
          questionChiffreeB302(
            'b3-02-a1-a-verifier',
            'qualite-des-donnees',
            'Combien de lignes la colonne P marque-t-elle « À vérifier » ?',
            'lignes',
            ['suspect-corrige-sans-validation', 'controle-apres-correction'],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Règle 2 du cahier, dite à la correction : « Je corrige seul ce qui est faux et certain ; je signale ce qui est douteux, je ne supprime rien. »',
        'Transition : « On repart tous du même fichier nettoyé : un vote. »',
      ],
    },
    [
      [
        'b3-02-a1-lignes-uniques',
        'L’export compte 4 144 lignes de données ; Supprimer les doublons, toutes les colonnes cochées, retire les 46 lignes exportées deux fois : il en reste 4 098. Cochée sur n_commande seule, l’outil ne garde qu’une ligne par commande : 1 618, des produits perdus. Le numéro de la dernière ligne compte aussi l’en-tête : 4 099.',
      ],
      [
        'b3-02-a1-ca-total',
        'Colonne O, convertie : =SOMME(O2:O4099) rend 1 340 208 €. Sur la colonne L brute, SOMME saute les 180 montants restés en texte, sans message : 1 286 319 €.',
      ],
      [
        'b3-02-a1-a-verifier',
        'La colonne P marque 85 lignes « À vérifier » : livraison avant la commande, quantité négative, commercial absent, et les dates restées en texte. Elles partent en quarantaine avec leur motif : on demande, on ne corrige pas, on ne supprime pas. Posé sur des dates déjà converties, le contrôle en perd : 45 si l’on convertit d’abord les dates « 2026-03-17 », 39 si DATEVAL convertit aussi les dates « 08/04/26 », que seul l’émetteur sait lire.',
      ],
    ],
  ),
  voteQuiOuvre(
    {
      screenId: 'B3-02-A1-09-VOTE-RELIER',
      titre: 'Vote : où lire la catégorie ?',
      dureeMinutes: 2,
      concepts: ['cle-et-relation'],
      notes: moteur.puces(
        'Ouvrir d’abord le classeur de reprise, tous, y compris ceux qui ont tout réussi : les résultats se compareront sur la même base.',
        'Montrer l’onglet Quarantaine : chaque ligne douteuse avec son motif, et les lignes que le contrôle ne voyait pas, produits inconnus et prix hors norme.',
        'Temps « réfléchir » de la recherche : vote non noté, 1 min de vote et 1 min de révélation.',
      ),
    },
    moteur.vote(
      'b3-02-a1-relier',
      'cle-et-relation',
      false,
      'Une ligne de Commandes porte produit_id = P012, sans catégorie. Où lire sa catégorie ?',
      'Dans l’onglet Produits, sur la ligne de P012',
      [
        ['Dans le libellé du produit', 'libelle-pris-pour-cle'],
        ['Dans la ville du client', 'libelle-pris-pour-cle'],
      ],
    ),
    REPRISE_NETTOYEE,
  ),
  pageDeFormules(
    {
      screenId: 'B3-02-A1-10-FORMULE-RECHERCHE',
      titre: 'Formule : RECHERCHEV',
      concepts: ['recherche-dans-une-table', 'reference-de-cellule'],
      notes: [
        '2 min, enchaînées sur la page suivante ; faire recopier la formule sans $ sur un poste volontaire : les #N/A gagnent la colonne, l’erreur fixe la règle.',
        'Formule de la catégorie : =RECHERCHEV(H2;Produits!$A$2:$E$41;3;FAUX). Pendant la saisie, F4 pose les $ (⌘ + T sur Mac).',
        'Excel 2021 ou 365 : RECHERCHEX(clé;colonne_clé;colonne_rendue). Toute version : INDEX et EQUIV, sur la fiche récap.',
      ],
    },
    {
      rang: 4,
      syntaxe:
        'RECHERCHEV(clé; table; n°_colonne; FAUX) rend, sur la ligne de la clé, la colonne demandée.',
      arguments:
        'la clé, un identifiant ; la table figée par $, clé en 1re colonne ; le rang de la colonne ; FAUX, l’exact.',
      piege:
        'sans les $, la table glisse : #N/A. Encadré : RECHERCHEX en 2021 ou 365.',
      exemple: 'AG06 dans Agences, 3e colonne : « Ouest ».',
    },
  ),
  pageDeFormules(
    {
      screenId: 'B3-02-A1-11-FORMULES-SOMME-SI',
      titre: 'Formules : SOMME.SI.ENS, NB.SI.ENS et DATE',
      concepts: ['agregation-conditionnelle'],
      notes: [
        '2 min ; insister sur le critère de date : l’opérateur entre guillemets, la date hors des guillemets, joints par &.',
        'Exemple complet : =SOMME.SI.ENS(L2:L4039;F2:F4039;"AG06";B2:B4039;">="&DATE(2026;1;1)). ">15" pour une remise de 15 % ne trouve rien : la remise est un taux, ">0,15".',
        'Transition : « Voyons-les ensemble sur Lille, avant l’exercice 3. »',
      ],
    },
    {
      rang: 5,
      syntaxe:
        'SOMME.SI.ENS(plage_somme; plage1; critère1; …) additionne, NB.SI.ENS(plage1; critère1; …) compte, DATE(année; mois; jour).',
      arguments:
        'les plages de même hauteur ; un critère, "AG06" ou ">="&DATE(2026; 1; 1).',
      piege: 'DATE dans les guillemets : Excel compare au texte et rend 0.',
      exemple: `Marseille au-delà de 15 % de remise : ${DEFIS_B3_01['remises-marseille']} lignes, avec ">0,15".`,
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B3-02-A1-12-EXEMPLE-RECHERCHE',
      titre: 'Exemple guidé : relier puis additionner',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 3,
      concepts: ['recherche-dans-une-table', 'agregation-conditionnelle'],
      notes: moteur.puces(
        moteur.REPONSES_SOUS_CHAQUE_ETAPE,
        'Chacun tape les formules dans le classeur de reprise, onglet Commandes : les colonnes N et O servent à l’exercice 3.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b3-02-a1-exemple-recherche',
          enonce:
            'Dans l’onglet Commandes du classeur de reprise, ajoutez la région et la catégorie de chaque ligne, puis calculez le CA HT de Lille (AG01) en mobilier, en 2026.',
          rappel: [
            {
              libelle: 'RECHERCHEV(valeur_cherchée;table;n°_colonne;FAUX)',
              valeur:
                'rend la valeur de la colonne demandée, sur la ligne de la clé, dans une table figée par des $.',
            },
            {
              libelle: 'SOMME.SI.ENS(plage_somme;plage1;critère1;…)',
              valeur:
                'additionne les lignes qui remplissent toutes les conditions.',
            },
            {
              libelle: 'DATE(année;mois;jour)',
              valeur:
                'construit une date ; en critère, ">="&DATE(2026;1;1), joint par &.',
            },
          ],
          etapes: [
            {
              id: 'region',
              intitule: 'La région',
              raisonnement:
                'En N1, tapez region ; en N2, =RECHERCHEV(F2;Agences!$A$2:$D$13;3;FAUX), puis double-clic sur la poignée. agence_id est en F, la région est la 3e colonne d’Agences.',
              invite:
                'Quelle formule ramène la région de l’agence de la ligne 2 ?',
            },
            {
              id: 'categorie',
              intitule: 'La catégorie',
              raisonnement:
                'En O1, tapez categorie ; en O2, =RECHERCHEV(H2;Produits!$A$2:$E$41;3;FAUX), recopiée. produit_id est en H, la catégorie est la 3e colonne de Produits.',
              invite:
                'Quelle formule ramène la catégorie du produit de la ligne 2 ?',
            },
            {
              id: 'somme',
              intitule: 'La somme sous conditions',
              raisonnement:
                '=SOMME.SI.ENS(L2:L4039;F2:F4039;"AG01";O2:O4039;"Mobilier";B2:B4039;">="&DATE(2026;1;1)) : trois couples plage ; critère, la date hors des guillemets.',
              invite:
                'Quelle formule additionne le CA de Lille en mobilier depuis le 1er janvier 2026 ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 1,
      notes: [
        'Montrer les trois couples plage ; critère de la somme, chacun d’une couleur.',
        'Transition : « À vous : exercice 3. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-02-A1-13-ATELIER-RECHERCHE',
      titre: 'Exercice 3 — Relier et additionner',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 11,
      concepts: ['recherche-dans-une-table', 'agregation-conditionnelle'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 10),
        'Réflexion : faire nommer, pour chaque question, les colonnes et les critères avant d’écrire.',
        'Pièges : fonction DATE écrite dans les guillemets ; table de recherche non figée ; période oubliée.',
      ),
      proprietes: {
        intitule: 'Exercice 3 — Relier et additionner',
        consigne:
          'Dans l’onglet Commandes du classeur de reprise, où l’exemple guidé a ajouté region en N et categorie en O. Étape 1 : vérifiez que N2 et O2 sont recopiées jusqu’en ligne 4039. Étape 2 : pour Rennes, tapez =SOMME.SI.ENS(L2:L4039; F2:F4039; "AG06"; O2:O4039; "Informatique"; B2:B4039; ">="&DATE(2026; 1; 1)). Étape 3 : pour toute la région Ouest, toutes catégories, tapez =SOMME.SI.ENS(L2:L4039; N2:N4039; "Ouest"; B2:B4039; ">="&DATE(2026; 1; 1)). Excel accepte l’espace après chaque point-virgule. Étape 4 : répondez.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffreeB302(
            'b3-02-a1-ca-rennes-info',
            'agregation-conditionnelle',
            'Étape 2 : quel CA HT Rennes (AG06) a-t-elle réalisé en informatique, de janvier à septembre 2026 ?',
            '€',
            PIEGES_DE_LA_SOMME_SOUS_CONDITIONS,
          ),
          questionChiffreeB302(
            'b3-02-a1-ca-ouest',
            'recherche-dans-une-table',
            'Étape 3 : quel CA HT la région Ouest a-t-elle réalisé, de janvier à septembre 2026 ?',
            '€',
            PIEGES_DE_LA_SOMME_SOUS_CONDITIONS,
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Règles 1 et 3 du cahier : « Je relie les tables par un identifiant, jamais par un libellé » ; « J’écris la période dans chaque critère, la même pour le chiffre et pour sa comparaison. »',
        'Puis pause de 15 minutes ; reprise sur le même classeur.',
      ],
    },
    [
      [
        'b3-02-a1-ca-rennes-info',
        'Trois couples plage ; critère : agence_id égal à AG06, categorie égale à Informatique, date_commande à partir du 1er janvier 2026, la date hors des guillemets. Résultat : 8 342 €.',
      ],
      [
        'b3-02-a1-ca-ouest',
        'La région Ouest réunit Nantes (AG05) et Rennes (AG06) : 77 850 € de janvier à septembre 2026. Sans les $, la table de recherche glisse d’une ligne à chaque recopie et ne trouve plus rien dès la ligne 14 : seules les lignes 4 à 6, une commande de Rennes, restent dans l’Ouest, 874 € ; le même glissement vide la colonne categorie dès la ligne 42, et la première question tombe à 729 €. ">=DATE(2026;1;1)" tout entre guillemets n’est pas calculé : 0 €, aux deux questions. Sans critère de date, 2025 s’ajoute : 188 908 €, et 27 862 € à la première question.',
      ],
    ],
  ),
];
