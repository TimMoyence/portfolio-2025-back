import {
  CONTACTS_A_TELECHARGER,
  CONTACTS_RESERVES,
  PIEGES_B3_04,
  questionChiffreeB304,
  VALEURS_B3_04,
} from './b3-04.donnees';
import { pageDuFournil } from '../b3-03/b3-03.briques';
import {
  champ,
  FOND_DU_FACTEUR,
  lettreDuFournil,
  pageDePublipostage,
} from './b3-04.briques';
import * as moteur from '../../briques';

const CONFONDUE = 'piece-de-la-lettre-confondue';
const TAPE_UNE_FOIS = { champ: CONFONDUE, regle: CONFONDUE } as const;
const PAR_UN_CHAMP = { fixe: CONFONDUE, regle: CONFONDUE } as const;
const PAR_UNE_REGLE = { fixe: CONFONDUE, champ: CONFONDUE } as const;

export const ACTE_1: moteur.Acte = [
  {
    screenId: 'B3-04-A1-01-RAPPEL-CHAMPS',
    titre: 'Rappel : ce qui change à chaque page',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 2,
    concepts: ['mise-en-page'],
    notes: moteur.puces(
      'Pendant que les postes rejoignent la séance : vérifier au pupitre que tous sont connectés.',
      'Réponse de mémoire. Faire le lien : le numéro de page est un champ que Word remplit à chaque page ; aujourd’hui, des champs que Word remplit à chaque lettre.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b3-04-a1-rappel-champ',
          'mise-en-page',
          true,
          'Mardi, la note du comité portait « Page 2 sur 5 » au bas de chaque page. Comment ces numéros y sont-ils arrivés ?',
          'Par les champs du numéro et du nombre de pages, que Word met à jour',
          [['Tapés au clavier au bas de chaque page', 'numero-de-page-tape']],
        ),
      ],
      delaiMs: 0,
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B3-04-A1-02-ACCROCHE',
      titre: 'Publipostage et e-mailing',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['source-de-publipostage'],
      notes: moteur.puces(
        'Faire télécharger le classeur des contacts : un onglet, une ligne par client, aucune adresse e-mail.',
        'Annoncer la séance : deux heures pour écrire une lettre et la fusionner avec la liste, une heure pour l’envoyer et la faire écrire par une IA.',
      ),
    },
    'hero',
    {
      title: 'Publipostage et e-mailing',
      subtitle:
        'Jeudi 10 décembre, 8 h 30. Nadia Ferrand veut écrire à chaque client du réseau le chiffre d’affaires qu’il a fait avec son agence depuis janvier : six cents lettres, une seule à écrire. Données fictives.',
      ...FOND_DU_FACTEUR,
    },
    CONTACTS_A_TELECHARGER,
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-04-A1-03-VOTE-LETTRES',
      titre: 'Vote : six cents lettres',
      dureeMinutes: 2,
      concepts: ['source-de-publipostage'],
      notes: moteur.puces(
        'Temps « réfléchir » du publipostage : vote non noté, 1 min de vote et 1 min de révélation.',
        'Révélation : ouvrir le classeur des contacts ; chaque ligne sera une lettre, chaque colonne un champ.',
      ),
    },
    [
      moteur.vote(
        'b3-04-a1-lettres',
        'source-de-publipostage',
        false,
        'Nadia veut la même lettre pour chaque client, avec son nom, son adresse et son chiffre d’affaires. Comment la produisez-vous ?',
        'J’écris une lettre type et je la fusionne avec la liste des clients',
        [
          [
            'J’écris la première, je la copie et je change le nom et le montant dans chaque copie',
            'lettre-recopiee-a-la-main',
          ],
        ],
      ),
    ],
    CONTACTS_RESERVES,
  ),
  pageDePublipostage(
    {
      screenId: 'B3-04-A1-04-PAGE-PUBLIPOSTAGE',
      titre: 'Page : les trois pièces du publipostage',
      concepts: ['source-de-publipostage'],
      notes: [
        '2 min, enchaînées sur la page suivante.',
        'Sur Mac, l’onglet s’appelle aussi Publipostage ; le Gestionnaire de fusion des anciennes versions n’est plus utile.',
      ],
    },
    {
      rang: 1,
      page: lettreDuFournil(
        moteur.paragraphe(
          [{ text: 'Merci pour votre fidélité au fournil cette saison.' }],
          2,
        ),
        {
          style: 'table',
          rows: [
            ['enseigne', 'quartier'],
            ['Café du Quai', 'Port'],
            ['Hôtel des Dunes', 'Plage'],
          ],
          marker: 3,
        },
      ),
      pageAlt:
        'Une lettre type du Fournil du Port : un champ en tête, une phrase commune à tous, et sous la lettre la petite liste des clients qui la recevront.',
      syntaxe:
        'Publipostage › Démarrer la fusion et le publipostage › Lettres, dans un document vierge.',
      piege:
        'commencer par écrire une lettre à un client précis : son nom tapé restera dans toutes les autres.',
      exemple:
        'la lettre inventée du Fournil du Port à ses cafés et hôtels : une lettre, deux clients, deux lettres fusionnées.',
      correspondances: [
        ['Pastille 1', 'un champ : remplacé à chaque lettre'],
        ['Pastille 2', 'le texte commun, tapé une fois'],
        ['Pastille 3', 'la liste : une ligne par destinataire'],
      ],
    },
  ),
  pageDePublipostage(
    {
      screenId: 'B3-04-A1-05-PAGE-SOURCE',
      titre: 'Page : lier la liste du tableur',
      concepts: ['source-de-publipostage'],
      notes: [
        '2 min ; montrer la fenêtre Sélectionner le tableau et sa case des en-têtes.',
        'Transition : « La lettre type de Nadia et sa liste : exercice 1. »',
      ],
    },
    {
      rang: 2,
      page: pageDuFournil({
        blocks: [
          {
            style: 'table',
            rows: [
              ['enseigne', 'quartier', 'commandes'],
              ['Café du Quai', 'Port', '41'],
              ['Hôtel des Dunes', 'Plage', '17'],
            ],
            marker: 1,
          },
          moteur.paragraphe(
            [{ text: 'Feuille1$ : la première ligne contient les en-têtes' }],
            2,
          ),
          moteur.paragraphe([{ text: 'Destinataires : 2', tone: 'accent' }], 3),
        ],
      }),
      pageAlt:
        'La liste inventée du Fournil du Port dans un tableur, son onglet choisi avec la case des en-têtes cochée, et le nombre de destinataires que Word en tire.',
      syntaxe:
        'Publipostage › Sélection des destinataires › Utiliser une liste existante, le classeur, puis l’onglet ; Modifier la liste des destinataires pour la parcourir.',
      piege:
        'décocher la case des en-têtes : la ligne des noms de colonnes devient un destinataire, et les champs n’ont plus de nom.',
      exemple:
        'trois lignes dans le tableur inventé, dont une d’en-têtes : deux destinataires.',
      correspondances: [
        ['Pastille 1', 'une colonne par champ, une ligne par client'],
        ['Pastille 2', 'les noms de colonnes deviennent les noms de champs'],
        ['Pastille 3', 'le compte de Word, en-têtes exclus'],
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-04-A1-06-ATELIER-SOURCE',
      titre: 'Exercice 1 — La lettre type et sa liste',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 12,
      concepts: ['source-de-publipostage'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 11),
        'Réflexion : faire ouvrir le classeur des contacts dans Excel, le lire, puis le fermer : Word ne le lie pas tant qu’Excel le tient ouvert sur certains postes.',
        'Pièges : décocher la case des en-têtes ; compter la ligne d’en-tête ; lier un autre classeur que celui du jour.',
      ),
      proprietes: {
        intitule: 'Exercice 1 — La lettre type et sa liste',
        consigne:
          'Étape 1 : enregistrez le classeur des contacts dans votre dossier, puis fermez-le. Étape 2 : dans un document Word vierge, Publipostage › Démarrer la fusion et le publipostage › Lettres ; enregistrez-le sous le nom Lettre_clients.docx. Étape 3 : Sélection des destinataires › Utiliser une liste existante, le classeur des contacts, l’onglet Contacts, case « La première ligne de données contient les en-têtes de colonnes » cochée. Étape 4 : Modifier la liste des destinataires, comptez les destinataires. Étape 5 : tapez la date et l’objet de la lettre : « Objet : votre activité avec Norvane depuis janvier ».',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffreeB304(
            'b3-04-a1-contacts',
            'source-de-publipostage',
            'Étape 4 : combien de destinataires la liste compte-t-elle ?',
            'destinataires',
          ),
          moteur.vote(
            'b3-04-a1-en-tetes',
            'source-de-publipostage',
            true,
            'Étape 3 : pourquoi laisser cochée la case « La première ligne de données contient les en-têtes de colonnes » ?',
            'Pour que les noms de colonnes deviennent les noms des champs',
            [
              [
                'Pour que la ligne des noms de colonnes reçoive aussi une lettre',
                'ligne-d-en-tete-comptee',
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
        'Règles 1 et 2, dites à la correction : « Une lettre type, une liste, une fusion » ; « La liste se tient dans le tableur, une ligne par destinataire, une colonne par champ, en-têtes en première ligne. »',
        'Transition : « La lettre a sa liste ; plaçons-y le nom du client : un vote. »',
      ],
    },
    [
      [
        'b3-04-a1-contacts',
        `La liste compte ${VALEURS_B3_04['b3-04-a1-contacts']} destinataires : un par client, chaque jumeau du fichier clients du B3-01 retiré. Le classeur compte ${PIEGES_B3_04['b3-04-a1-contacts']['ligne-d-en-tete-comptee']} lignes remplies, dont la ligne d’en-tête, qui n’est pas une lettre.`,
      ],
      [
        'b3-04-a1-en-tetes',
        'La première ligne nomme les colonnes : client_id, civilite, nom, ca_2026… Ce sont les noms que Word donne aux champs. Décochée, elle devient un destinataire de plus, et les champs s’appellent F1, F2…',
      ],
    ],
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-04-A1-07-VOTE-CHAMP',
      titre: 'Vote : le nom du client dans la lettre',
      dureeMinutes: 2,
      concepts: ['champ-de-fusion'],
      notes: moteur.puces(
        'Temps « réfléchir » des champs : vote non noté, 1 min de vote et 1 min de révélation.',
        'Révélation : taper les chevrons au clavier, puis Aperçu des résultats ; le texte ne change pas.',
      ),
    },
    [
      moteur.vote(
        'b3-04-a1-champ',
        'champ-de-fusion',
        false,
        'La lettre doit commencer par le nom du client. Que faites-vous à cet endroit de la lettre type ?',
        'Publipostage › Insérer un champ de fusion › nom',
        [
          [
            'Je tape «nom», chevrons compris, au clavier',
            'champ-tape-a-la-main',
          ],
        ],
      ),
    ],
  ),
  pageDePublipostage(
    {
      screenId: 'B3-04-A1-08-PAGE-CHAMPS',
      titre: 'Page : insérer les champs de fusion',
      concepts: ['champ-de-fusion'],
      notes: [
        '2 min, enchaînées sur la page suivante.',
        'Alt + F9 bascule entre les champs et leurs codes ; sur Mac, Option + F9.',
      ],
    },
    {
      rang: 3,
      page: lettreDuFournil(
        moteur.paragraphe(
          [
            { text: 'Quartier du ' },
            champ('quartier'),
            { text: ', Saint-Brévin' },
          ],
          2,
        ),
        moteur.paragraphe(
          [{ text: '{ MERGEFIELD quartier }', tone: 'muted' }],
          3,
        ),
      ),
      pageAlt:
        'Une lettre type inventée : le champ de l’enseigne seul sur sa ligne, le champ du quartier pris dans une phrase, et le code du champ affiché par Alt + F9.',
      syntaxe:
        'Publipostage › Insérer un champ de fusion, puis le nom de la colonne ; espaces et ponctuation se tapent entre les champs ; Alt + F9 montre les codes.',
      piege:
        'taper les chevrons au clavier : le texte reste tel quel, aucune donnée n’arrive.',
      exemple:
        'dans la lettre inventée, « Quartier du «quartier» » devient « Quartier du Port » pour le Café du Quai.',
      correspondances: [
        ['Pastille 1', 'un champ seul sur sa ligne'],
        ['Pastille 2', 'un champ pris dans une phrase, espaces tapées autour'],
        ['Pastille 3', 'le même champ, en code'],
      ],
    },
  ),
  pageDePublipostage(
    {
      screenId: 'B3-04-A1-09-PAGE-FORMAT',
      titre: 'Page : le format d’un montant',
      concepts: ['champ-de-fusion'],
      notes: [
        '2 min ; le format se règle dans le code du champ, pas dans le classeur : Word lit la valeur, pas son affichage.',
        'Transition : « Pas à pas sur le bloc d’adresse. »',
      ],
    },
    {
      rang: 4,
      page: pageDuFournil({
        blocks: [
          moteur.paragraphe(
            [
              { text: 'Vos achats de la saison : ' },
              { text: '1834.5', tone: 'alert' },
            ],
            1,
          ),
          moteur.paragraphe(
            [
              {
                text: '{ MERGEFIELD achats \\# "# ##0,00 €" }',
                tone: 'muted',
              },
            ],
            2,
          ),
          moteur.paragraphe(
            [
              { text: 'Vos achats de la saison : ' },
              { text: '1 834,50 €', tone: 'accent' },
            ],
            3,
          ),
        ],
      }),
      pageAlt:
        'Un montant inventé fusionné sans format, le code du champ avec son format, puis le même montant écrit à la française avec le symbole euro.',
      syntaxe:
        'Alt + F9, puis dans le code du champ, après son nom : \\# "# ##0,00 €" ; Alt + F9 pour revenir, F9 pour mettre à jour.',
      piege:
        'compter sur le format du tableur : Word fusionne la valeur brute, point décimal compris.',
      exemple:
        'les achats inventés du Café du Quai passent de 1834.5 à 1 834,50 €.',
      correspondances: [
        ['Pastille 1', 'la valeur brute, sans format'],
        ['Pastille 2', 'le format, dans le code du champ'],
        ['Pastille 3', 'le montant à la française'],
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B3-04-A1-10-EXEMPLE-CHAMPS',
      titre: 'Exemple guidé : le bloc d’adresse, champ par champ',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 3,
      concepts: ['champ-de-fusion'],
      notes: moteur.puces(
        moteur.REPONSES_SOUS_CHAQUE_ETAPE,
        'Chacun le fait dans Lettre_clients.docx : ce bloc ouvre l’exercice 2.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b3-04-a1-exemple-adresse',
          enonce:
            'En haut à droite de Lettre_clients.docx, composez l’adresse du client à partir des champs du classeur, puis vérifiez-la sur un destinataire.',
          rappel: [
            {
              libelle: 'Insérer un champ de fusion',
              valeur: 'place à l’endroit du curseur la colonne choisie.',
            },
            {
              libelle: 'Maj + Entrée',
              valeur:
                'passe à la ligne sans ouvrir de paragraphe : le bloc garde son espacement.',
            },
            {
              libelle: 'Aperçu des résultats',
              valeur: 'remplace les champs par les données d’un destinataire.',
            },
          ],
          etapes: [
            {
              id: 'nom',
              intitule: 'La ligne du nom',
              raisonnement:
                'Champ raison_sociale, Maj + Entrée, puis champ prenom, une espace, champ nom : l’espace se tape, elle n’est dans aucune colonne.',
              invite: 'Qu’est-ce qui sépare le prénom du nom ?',
            },
            {
              id: 'ville',
              intitule: 'La ligne de la ville',
              raisonnement:
                'Champ adresse, Maj + Entrée, champ code_postal, une espace, champ ville. Le code postal est en texte dans le classeur : il garde ses cinq chiffres.',
              invite: 'Pourquoi le code postal est-il rangé en texte ?',
            },
            {
              id: 'apercu',
              intitule: 'L’aperçu',
              raisonnement:
                'Aperçu des résultats, puis les flèches : chaque destinataire montre son adresse. Un trou ou deux mots collés se corrigent dans la lettre type, une fois pour toutes.',
              invite: 'Où corrige-t-on une espace oubliée ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 1,
      notes: [
        'Faire afficher un destinataire sur un poste : l’adresse est complète.',
        'Transition : « Le reste de la lettre : exercice 2. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-04-A1-11-ATELIER-LETTRE',
      titre: 'Exercice 2 — Les champs de la lettre',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 13,
      concepts: ['champ-de-fusion'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 12),
        'Réflexion : faire repérer dans la lettre ce qui change d’un client à l’autre avant de taper.',
        'Pièges : chevrons tapés ; montant sans format ; nom de l’agence tapé au lieu du champ.',
      ),
      proprietes: {
        intitule: 'Exercice 2 — Les champs de la lettre',
        consigne:
          'Dans Lettre_clients.docx. Étape 1 : le bloc d’adresse de l’exemple guidé, en haut à droite. Étape 2 : tapez « Madame, Monsieur, » ; elle deviendra une règle à l’exercice 4. Étape 3 : écrivez le corps : « De janvier à septembre 2026, votre entreprise a réalisé » puis le champ ca_2026, puis « de chiffre d’affaires HT avec notre agence de », le champ agence et un point. Étape 4 : Alt + F9, donnez au champ ca_2026 le format \\# "# ##0,00 €", Alt + F9, F9. Étape 5 : signez « Nadia Ferrand, directrice commerciale », puis Aperçu des résultats.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b3-04-a1-inserer',
            'champ-de-fusion',
            true,
            'Étape 3 : l’agence du client doit suivre « avec notre agence de ». Quel geste ?',
            'Insérer un champ de fusion › agence, une espace tapée avant',
            [
              [
                'Taper « Rennes », l’agence du premier client',
                'champ-tape-a-la-main',
              ],
              ['Taper « «agence» » au clavier', 'champ-tape-a-la-main'],
            ],
          ),
          moteur.vote(
            'b3-04-a1-format-ca',
            'champ-de-fusion',
            true,
            'Étape 4 : sans format, la lettre affiche « 1058.1 ». Où réglez-vous « 1 058,10 € » ?',
            'Dans le code du champ ca_2026, par \\# "# ##0,00 €"',
            [
              [
                'Nulle part : le montant est juste, son allure importe peu',
                'format-du-nombre-ignore',
              ],
              [
                'Dans chaque lettre fusionnée, en retapant le montant',
                'format-du-nombre-ignore',
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
        'Règle 3, dite à la correction : « Ce qui change d’une lettre à l’autre s’insère par un champ, jamais à la main. »',
        'Transition : « Tapé, champ ou règle ? Un tri. »',
      ],
    },
    [
      [
        'b3-04-a1-inserer',
        'Le champ agence écrit dans chaque lettre l’agence de son client. « Rennes » tapé serait faux pour tous les clients des autres agences ; des chevrons tapés resteraient tels quels.',
      ],
      [
        'b3-04-a1-format-ca',
        'Word fusionne la valeur du tableur, pas son affichage : le format se règle dans le code du champ, une fois pour toutes les lettres. Retaper dans les lettres fusionnées, c’est six cents corrections.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-04-A1-12-TRI-LETTRE',
      titre: 'Exercice 3 — Tapé, champ ou règle ?',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 10,
      concepts: ['champ-de-fusion', 'regle-de-fusion'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 9),
        'Réflexion : pour chaque passage, une question : est-il le même dans toutes les lettres, vient-il d’une colonne, ou dépend-il d’une condition ?',
      ),
      proprietes: {
        modalite: 'binome',
        ...moteur.classement(
          {
            id: 'b3-04-a1-tri-lettre',
            intitule:
              'Rangez chaque passage de la lettre de Nadia : tapé une fois dans la lettre type, inséré comme champ, ou produit par une règle selon une condition.',
          },
          'champ-de-fusion',
          [
            ['fixe', 'Tapé une fois'],
            ['champ', 'Un champ'],
            ['regle', 'Une règle'],
          ],
          [
            {
              id: 'objet',
              libelle: 'L’objet de la lettre',
              categorie: 'fixe',
              confusions: TAPE_UNE_FOIS,
              justification: 'le même objet pour tous',
            },
            {
              id: 'signature',
              libelle: 'La signature de Nadia Ferrand',
              categorie: 'fixe',
              confusions: TAPE_UNE_FOIS,
              justification: 'une signataire, toutes les lettres',
            },
            {
              id: 'date',
              libelle: 'La date de la lettre',
              categorie: 'fixe',
              confusions: TAPE_UNE_FOIS,
              justification: 'toutes partent le même jour',
            },
            {
              id: 'raison-sociale',
              libelle: 'Le nom de l’entreprise du client',
              categorie: 'champ',
              confusions: PAR_UN_CHAMP,
              justification: 'la colonne raison_sociale',
            },
            {
              id: 'montant',
              libelle: 'Le chiffre d’affaires de l’année',
              categorie: 'champ',
              confusions: PAR_UN_CHAMP,
              justification: 'la colonne ca_2026, formatée',
            },
            {
              id: 'code-postal',
              libelle: 'Le code postal',
              categorie: 'champ',
              confusions: PAR_UN_CHAMP,
              justification: 'la colonne code_postal',
            },
            {
              id: 'appel',
              libelle: '« Chère Madame » ou « Cher Monsieur »',
              categorie: 'regle',
              confusions: PAR_UNE_REGLE,
              justification: 'selon la colonne civilite',
            },
            {
              id: 'relance',
              libelle:
                'Une phrase de relance pour les seuls clients sans achat cette année',
              categorie: 'regle',
              confusions: PAR_UNE_REGLE,
              justification: 'selon que ca_2026 vaut 0',
            },
            {
              id: 'accord',
              libelle: '« votre fidèle client » ou « votre fidèle cliente »',
              categorie: 'regle',
              confusions: PAR_UNE_REGLE,
              justification: 'l’accord suit civilite',
            },
          ],
        ),
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger case par case : demander, pour chaque passage, s’il change d’une lettre à l’autre et selon quoi.',
        moteur.PAUSE_HORS_DUREE,
      ],
    },
    [
      [
        'fixe',
        'L’objet, la date et la signature sont les mêmes dans toutes les lettres : on les tape une fois dans la lettre type.',
      ],
      [
        'champ',
        'L’entreprise, le montant, le code postal viennent chacun d’une colonne : un champ les écrit dans chaque lettre.',
      ],
      [
        'regle',
        'La formule d’appel, l’accord et la phrase de relance dépendent d’une condition sur une colonne : une règle Si…Alors…Sinon les choisit, lettre par lettre.',
      ],
    ],
  ),
];
