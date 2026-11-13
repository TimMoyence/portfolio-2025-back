import {
  PIEGES_B3_04,
  questionChiffreeB304,
  VALEURS_B3_04,
} from './b3-04.donnees';
import { pageDuFournil } from '../b3-03/b3-03.briques';
import { champ, pageDePublipostage } from './b3-04.briques';
import * as moteur from '../../briques';

const LES_SIX_REGLES = [
  'Une lettre type, une liste, une fusion',
  'La liste se tient dans le tableur',
  'Ce qui change s’insère par un champ',
  'On filtre dans Word, sans toucher au classeur',
  'On vérifie l’aperçu avant de fusionner',
  'Un destinataire ne reçoit que sa lettre',
] as const;

const AILLEURS = 'correction-au-mauvais-endroit';
const DANS_LA_LISTE = { lettre: AILLEURS, regle: AILLEURS } as const;
const DANS_LA_LETTRE = { liste: AILLEURS, regle: AILLEURS } as const;
const DANS_LA_REGLE = { liste: AILLEURS, lettre: AILLEURS } as const;

export const ACTE_2: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-04-A2-01-VOTE-FILTRE',
      titre: 'Vote : les seuls clients de Rennes',
      dureeMinutes: 2,
      concepts: ['regle-de-fusion'],
      notes: moteur.puces(
        'Temps « réfléchir » du filtre : vote non noté, 1 min de vote et 1 min de révélation.',
        'Révélation : ouvrir le classeur ; des clients de Saint-Malo ou de Vannes relèvent de l’agence de Rennes.',
      ),
    },
    [
      moteur.vote(
        'b3-04-a2-filtre',
        'regle-de-fusion',
        false,
        'Yann Le Goff, responsable de l’agence de Rennes, veut les lettres de ses seuls clients. Comment les obtenez-vous ?',
        'Je filtre la liste dans Word sur la colonne agence',
        [
          [
            'Je supprime du classeur les lignes des autres agences',
            'source-modifiee-pour-filtrer',
          ],
          [
            'Je filtre la liste dans Word sur la colonne ville',
            'filtre-sur-le-mauvais-champ',
          ],
        ],
      ),
    ],
  ),
  pageDePublipostage(
    {
      screenId: 'B3-04-A2-02-PAGE-FILTRER',
      titre: 'Page : filtrer les destinataires',
      concepts: ['regle-de-fusion'],
      notes: [
        '2 min, enchaînées sur la page suivante.',
        'Le filtre se garde avec la lettre type ; Effacer tout dans la même fenêtre le retire.',
      ],
    },
    {
      rang: 5,
      page: pageDuFournil({
        blocks: [
          {
            style: 'table',
            rows: [
              ['Champ', 'Comparaison', 'Comparer à'],
              ['quartier', 'Égal à', 'Port'],
            ],
            marker: 1,
          },
          moteur.paragraphe(
            [{ text: 'Destinataires retenus : 1 sur 2', tone: 'accent' }],
            2,
          ),
          moteur.paragraphe(
            [{ text: 'Liste du tableur : 2 lignes, intacte' }],
            3,
          ),
        ],
      }),
      pageAlt:
        'La fenêtre de filtre de Word sur la liste inventée du Fournil du Port : un critère sur le quartier, un destinataire retenu, le tableur inchangé.',
      syntaxe:
        'Publipostage › Modifier la liste des destinataires › Filtrer : un champ, une comparaison, une valeur ; Et ou Ou pour un second critère.',
      piege:
        'filtrer sur une colonne voisine qui ressemble au critère : le quartier d’un client n’est pas toujours celui de sa livraison.',
      exemple:
        'le Fournil du Port écrit aux seuls clients du quartier du Port : un destinataire sur deux, exemple inventé.',
      correspondances: [
        ['Pastille 1', 'le champ, la comparaison, la valeur'],
        ['Pastille 2', 'le compte des destinataires retenus'],
        ['Pastille 3', 'le classeur, que le filtre ne touche pas'],
      ],
    },
  ),
  pageDePublipostage(
    {
      screenId: 'B3-04-A2-03-PAGE-REGLE',
      titre: 'Page : une règle Si…Alors…Sinon',
      concepts: ['regle-de-fusion'],
      notes: [
        '2 min ; montrer la fenêtre de la règle, puis son code par Alt + F9 : { IF … }.',
        'Transition : « Les lettres de Rennes : exercice 4. »',
      ],
    },
    {
      rang: 6,
      page: pageDuFournil({
        blocks: [
          {
            style: 'table',
            rows: [
              ['Nom du champ', 'Comparaison', 'Comparer à'],
              ['quartier', 'Égal à', 'Plage'],
            ],
            marker: 1,
          },
          moteur.paragraphe(
            [
              { text: 'Insérer ce texte : ' },
              { text: 'Livraison avant 7 h.', tone: 'accent' },
              { text: ' Sinon : ' },
              { text: 'Livraison avant 8 h.', tone: 'muted' },
            ],
            2,
          ),
          moteur.paragraphe(
            [{ text: '{ IF { MERGEFIELD quartier } = "Plage" … }' }],
            3,
          ),
        ],
      }),
      pageAlt:
        'La fenêtre Si…Alors…Sinon de Word sur un exemple inventé : une comparaison sur le quartier, le texte si vrai, le texte sinon, et le code de la règle.',
      syntaxe:
        'Publipostage › Règles › Si…Alors…Sinon : nom du champ, comparaison, valeur comparée, texte si vrai, texte sinon.',
      piege:
        'écrire dans la case « Insérer ce texte » le texte du cas contraire : chaque lettre reçoit celui de l’autre cas.',
      exemple:
        'le Fournil du Port annonce une livraison avant 7 h aux hôtels de la plage, avant 8 h aux autres, exemple inventé.',
      correspondances: [
        ['Pastille 1', 'la condition, sur une colonne'],
        ['Pastille 2', 'le texte si vrai, puis le texte sinon'],
        ['Pastille 3', 'la règle en code, un champ IF'],
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-04-A2-04-ATELIER-FILTRE',
      titre: 'Exercice 4 — Les lettres de Rennes',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 13,
      concepts: ['regle-de-fusion'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 12),
        'Réflexion : faire relire les colonnes agence et ville du classeur avant de filtrer.',
        'Pièges : filtrer sur ville ; inverser les deux textes de la règle ; comparer à « Madame » au lieu de « Mme ».',
      ),
      proprietes: {
        intitule: 'Exercice 4 — Les lettres de Rennes',
        consigne:
          'Dans Lettre_clients.docx. Étape 1 : Modifier la liste des destinataires › Filtrer, champ agence, Égal à, Rennes ; comptez les destinataires retenus. Étape 2 : sélectionnez « Madame, Monsieur » sans sa virgule, puis Règles › Si…Alors…Sinon : champ civilite, Égal à, Mme ; texte si vrai « Chère Madame », texte sinon « Cher Monsieur » ; la virgule suit la règle : la formule d’appel ne porte jamais le nom. Étape 3 : Aperçu des résultats, parcourez trois lettres. Étape 4 : Terminer et fusionner › Modifier des documents individuels › Tous ; dans le document qui s’ouvre, Ctrl + F, cherchez « Chère Madame » et lisez le nombre de résultats. Fermez ce document sans l’enregistrer.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffreeB304(
            'b3-04-a2-lettres-rennes',
            'regle-de-fusion',
            'Étape 1 : combien de destinataires le filtre retient-il ?',
            'destinataires',
          ),
          questionChiffreeB304(
            'b3-04-a2-chere-madame',
            'regle-de-fusion',
            'Étape 4 : combien de lettres commencent par « Chère Madame » ?',
            'lettres',
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Règle 4, dite à la correction : « On filtre dans Word, sans toucher au classeur. »',
        'Transition : « Avant de fusionner pour de bon : un vote. »',
      ],
    },
    [
      [
        'b3-04-a2-lettres-rennes',
        `Le filtre agence égal à Rennes retient ${VALEURS_B3_04['b3-04-a2-lettres-rennes']} destinataires : les clients de Rennes, de Saint-Malo, de Vannes et de Fougères. Filtrer sur la ville n’en garde que ${PIEGES_B3_04['b3-04-a2-lettres-rennes']['filtre-sur-le-mauvais-champ']}, ceux de la seule ville de Rennes.`,
      ],
      [
        'b3-04-a2-chere-madame',
        `${VALEURS_B3_04['b3-04-a2-chere-madame']} lettres commencent par « Chère Madame », une par cliente « Mme » de l’agence. Les deux textes inversés en donnent ${PIEGES_B3_04['b3-04-a2-chere-madame']['condition-inversee']}, le nombre de « M. ». Certaines lettres annoncent 0,00 € de chiffre d’affaires : une règle Si…Alors…Sinon sur ca_2026, égal à 0, y mettrait une phrase de relance à la place.`,
      ],
    ],
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-04-A2-05-VOTE-APERCU',
      titre: 'Vote : avant de fusionner',
      dureeMinutes: 2,
      concepts: ['fusion-et-pdf'],
      notes: moteur.puces(
        'Temps « réfléchir » de la fusion : vote non noté, 1 min de vote et 1 min de révélation.',
        'Révélation : une espace oubliée dans la lettre type, c’est cinquante lettres à reprendre une fois imprimées.',
      ),
    },
    [
      moteur.vote(
        'b3-04-a2-apercu',
        'fusion-et-pdf',
        false,
        'Les cinquante lettres de Rennes sont prêtes à fusionner. Que faites-vous d’abord ?',
        'Je parcours l’aperçu et je lance la vérification des erreurs',
        [
          [
            'Je fusionne vers l’imprimante : j’ai vérifié la lettre type',
            'fusion-sans-apercu',
          ],
        ],
      ),
    ],
  ),
  pageDePublipostage(
    {
      screenId: 'B3-04-A2-06-PAGE-APERCU',
      titre: 'Page : l’aperçu des résultats',
      concepts: ['fusion-et-pdf'],
      notes: [
        '2 min, enchaînées sur les deux pages suivantes : 6 min d’exposition au plus.',
        'Vérification des erreurs simule la fusion et liste les champs manquants.',
      ],
    },
    {
      rang: 7,
      page: pageDuFournil({
        blocks: [
          {
            style: 'normal',
            align: 'right',
            runs: [{ text: '◀  2 / 2  ▶', tone: 'muted' }],
            marker: 1,
          },
          moteur.paragraphe([{ text: 'Hôtel des Dunes' }]),
          moteur.paragraphe(
            [{ text: 'Quartier de la ' }, { text: 'Plage', tone: 'accent' }],
            2,
          ),
          moteur.paragraphe(
            [{ text: 'Livraison avant7 h.', tone: 'alert' }],
            3,
          ),
        ],
      }),
      pageAlt:
        'L’aperçu d’une lettre inventée du Fournil du Port, deuxième destinataire sur deux : le quartier remplacé par sa valeur, et une espace manquante surlignée.',
      syntaxe:
        'Publipostage › Aperçu des résultats, les flèches d’un destinataire à l’autre, Rechercher un destinataire ; Vérification des erreurs avant de terminer.',
      piege:
        'ne regarder que le premier destinataire : le défaut d’une lettre longue ou d’une valeur vide se cache plus loin.',
      exemple:
        'au deuxième destinataire inventé, « avant7 h » : l’espace manque dans la règle, pas dans la liste.',
      correspondances: [
        ['Pastille 1', 'le rang du destinataire affiché'],
        ['Pastille 2', 'le champ remplacé par sa valeur'],
        ['Pastille 3', 'un défaut vu à l’aperçu, corrigé à sa source'],
      ],
    },
  ),
  pageDePublipostage(
    {
      screenId: 'B3-04-A2-07-PAGE-FUSION',
      titre: 'Page : fusionner en documents individuels',
      concepts: ['fusion-et-pdf'],
      notes: [
        '2 min ; le document fusionné ne garde plus aucun champ : c’est du texte.',
      ],
    },
    {
      rang: 8,
      page: pageDuFournil({
        blocks: [
          moteur.paragraphe([{ text: 'Café du Quai' }], 1),
          moteur.paragraphe(
            [{ text: 'Saut de section (page suivante)', tone: 'muted' }],
            2,
          ),
          moteur.paragraphe([{ text: 'Hôtel des Dunes' }], 3),
        ],
      }),
      pageAlt:
        'Le document fusionné du Fournil du Port, exemple inventé : la lettre du Café du Quai, un saut de section, puis celle de l’Hôtel des Dunes.',
      syntaxe:
        'Publipostage › Terminer et fusionner › Modifier des documents individuels › Tous : Word ouvre un nouveau document, Lettres1.',
      piege:
        'enregistrer la lettre type elle-même, champs compris : ce n’est pas encore une lettre.',
      exemple:
        'deux destinataires inventés, un document de deux lettres, chacune dans sa section.',
      correspondances: [
        ['Pastille 1', 'la lettre du premier destinataire'],
        ['Pastille 2', 'un saut de section entre deux lettres'],
        ['Pastille 3', 'la lettre suivante, ses valeurs fusionnées'],
      ],
    },
  ),
  pageDePublipostage(
    {
      screenId: 'B3-04-A2-08-PAGE-PDF',
      titre: 'Page : le PDF d’une lettre, le PDF de toutes',
      concepts: ['fusion-et-pdf'],
      notes: [
        '2 min ; Enregistrement en cours fusionne le seul destinataire affiché à l’aperçu.',
        'Transition : « Fusionner et enregistrer : exercice 5. »',
      ],
    },
    {
      rang: 9,
      page: pageDuFournil({
        blocks: [
          moteur.paragraphe(
            [{ text: 'Lettres_fournil.pdf : 2 lettres, pour l’archive' }],
            1,
          ),
          moteur.paragraphe(
            [{ text: 'Enregistrement en cours : ' }, champ('enseigne')],
            2,
          ),
          moteur.paragraphe(
            [
              {
                text: 'Lettre_Cafe_du_Quai.pdf : une lettre, pour son client',
                tone: 'accent',
              },
            ],
            3,
          ),
        ],
      }),
      pageAlt:
        'Deux PDF tirés d’une fusion inventée : celui de toutes les lettres, gardé pour l’archive, et celui d’une seule lettre, pour son destinataire.',
      syntaxe:
        'Dans le document fusionné, Fichier › Enregistrer sous › PDF ; pour une seule lettre, Aperçu sur son destinataire, puis Modifier des documents individuels › Enregistrement en cours.',
      piege:
        'envoyer à un client le PDF de toutes les lettres : il y lit les montants des autres.',
      exemple:
        'le Fournil du Port, exemple inventé, archive le PDF des deux lettres et n’envoie au Café du Quai que la sienne.',
      correspondances: [
        ['Pastille 1', 'toutes les lettres, un PDF pour l’archive'],
        ['Pastille 2', 'le destinataire affiché, seul fusionné'],
        ['Pastille 3', 'sa lettre seule, pour lui'],
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-04-A2-09-ATELIER-FUSION',
      titre: 'Exercice 5 — Fusionner et enregistrer en PDF',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 13,
      concepts: ['fusion-et-pdf'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 12),
        'Réflexion : faire dire qui recevra chaque fichier avant de l’enregistrer.',
        'Pièges : enregistrer la lettre type en PDF ; joindre le PDF des cinquante lettres à un client.',
      ),
      proprietes: {
        intitule: 'Exercice 5 — Fusionner et enregistrer en PDF',
        consigne:
          'Dans Lettre_clients.docx, filtre de Rennes en place. Étape 1 : Vérification des erreurs › Simuler la fusion ; corrigez dans la lettre type ce qu’elle signale. Étape 2 : Terminer et fusionner › Modifier des documents individuels › Tous ; enregistrez le document obtenu sous Lettres_Rennes.docx, puis Fichier › Enregistrer sous › PDF : Lettres_Rennes.pdf. Étape 3 : revenez à Lettre_clients.docx, Aperçu des résultats, Rechercher un destinataire : CL001. Étape 4 : Terminer et fusionner › Modifier des documents individuels › Enregistrement en cours ; enregistrez la lettre en PDF sous Lettre_CL001.pdf.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b3-04-a2-fusionner',
            'fusion-et-pdf',
            true,
            'Étape 2 : quel geste donne les cinquante lettres de Rennes en un PDF ?',
            'Modifier des documents individuels › Tous, puis le document obtenu enregistré en PDF',
            [
              [
                'Lettre_clients.docx enregistrée en PDF, aperçu affiché',
                'lettre-type-exportee-au-lieu-de-fusionnee',
              ],
            ],
          ),
          moteur.vote(
            'b3-04-a2-pdf-client',
            'fusion-et-pdf',
            true,
            'Le client CL001 demande sa lettre en PDF. Quel fichier lui envoyez-vous ?',
            'Lettre_CL001.pdf, sa seule lettre fusionnée par Enregistrement en cours',
            [
              [
                'Lettres_Rennes.pdf : il y trouvera la sienne',
                'pdf-de-toutes-les-lettres-a-chacun',
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
        'Règles 5 et 6, dites à la correction : « On vérifie l’aperçu avant de fusionner » ; « Un destinataire ne reçoit que sa lettre. »',
        'Transition : « Un défaut à l’aperçu : où le corriger ? Un tri. »',
      ],
    },
    [
      [
        'b3-04-a2-fusionner',
        'Seul le document fusionné contient les cinquante lettres, chacune avec ses valeurs. La lettre type enregistrée en PDF n’en donne qu’une, celle que montre l’aperçu.',
      ],
      [
        'b3-04-a2-pdf-client',
        'Lettres_Rennes.pdf porte le nom, l’adresse et le chiffre d’affaires de cinquante clients : il reste à l’archive. Le client ne reçoit que sa lettre.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-04-A2-10-TRI-CORRECTIONS',
      titre: 'Exercice 6 — Où corriger ?',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 12,
      concepts: ['fusion-et-pdf', 'regle-de-fusion'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 11),
        'Réflexion : pour chaque défaut, une question : se voit-il dans une seule lettre ou dans toutes ?',
      ),
      proprietes: {
        modalite: 'binome',
        ...moteur.classement(
          {
            id: 'b3-04-a2-tri-corrections',
            intitule:
              'Neuf défauts vus à l’aperçu des lettres de Rennes. Rangez chacun selon l’endroit où il se corrige une fois pour toutes.',
          },
          'fusion-et-pdf',
          [
            ['liste', 'Dans le classeur des contacts'],
            ['lettre', 'Dans la lettre type'],
            ['regle', 'Dans la règle'],
          ],
          [
            {
              id: 'demenagement',
              libelle:
                'Un client a déménagé : sa lettre porte l’ancienne adresse',
              categorie: 'liste',
              confusions: DANS_LA_LISTE,
              justification: 'la valeur est fausse dans sa ligne',
            },
            {
              id: 'nom-mal-ecrit',
              libelle: 'Le nom d’un client est mal orthographié',
              categorie: 'liste',
              confusions: DANS_LA_LISTE,
              justification: 'une cellule à corriger, une seule lettre touchée',
            },
            {
              id: 'contact-parti',
              libelle: 'Le contact d’une entreprise a quitté son poste',
              categorie: 'liste',
              confusions: DANS_LA_LISTE,
              justification: 'prénom et nom à changer dans sa ligne',
            },
            {
              id: 'montant-brut',
              libelle: 'Chaque montant s’affiche avec un point décimal',
              categorie: 'lettre',
              confusions: DANS_LA_LETTRE,
              justification: 'un réglage du champ ca_2026, valable pour toutes',
            },
            {
              id: 'mots-colles',
              libelle:
                'Le prénom et le nom sont collés dans toutes les lettres',
              categorie: 'lettre',
              confusions: DANS_LA_LETTRE,
              justification: 'une espace à taper entre deux champs',
            },
            {
              id: 'agence-tapee',
              libelle:
                'Toutes les lettres disent « notre agence de Rennes », même hors filtre',
              categorie: 'lettre',
              confusions: DANS_LA_LETTRE,
              justification: 'le nom tapé à remplacer par le champ agence',
            },
            {
              id: 'appel-inverse',
              libelle: '« Chère Madame » s’adresse à chaque client « M. »',
              categorie: 'regle',
              confusions: DANS_LA_REGLE,
              justification: 'les deux textes à remettre en place',
            },
            {
              id: 'jamais-madame',
              libelle: 'Aucune lettre ne dit « Chère Madame »',
              categorie: 'regle',
              confusions: DANS_LA_REGLE,
              justification: 'la valeur comparée n’est pas « Mme »',
            },
            {
              id: 'relance-a-tous',
              libelle:
                'La phrase de relance arrive aussi aux clients qui ont acheté',
              categorie: 'regle',
              confusions: DANS_LA_REGLE,
              justification: 'la condition sur ca_2026 à reprendre',
            },
          ],
        ),
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger case par case : un défaut d’une seule lettre vient de sa ligne ; un défaut de toutes vient de la lettre type ou de la règle.',
        moteur.PAUSE_HORS_DUREE,
      ],
    },
    [
      [
        'liste',
        'Une adresse, un nom, un contact faux ne touchent qu’une lettre : la valeur se corrige dans sa ligne du classeur, et la prochaine fusion sera juste.',
      ],
      [
        'lettre',
        'Un format, une espace, un nom tapé touchent toutes les lettres : on les corrige dans la lettre type, jamais lettre par lettre dans le document fusionné.',
      ],
      [
        'regle',
        'Une formule d’appel ou une phrase qui tombe sur les mauvais clients vient de la condition ou de ses deux textes : on reprend la règle.',
      ],
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B3-04-A2-11-FICHE-RECAP',
      titre: 'Fiche récap : le publipostage',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: [
        'source-de-publipostage',
        'champ-de-fusion',
        'regle-de-fusion',
        'fusion-et-pdf',
      ],
      notes: moteur.puces('2 min ; la fiche s’imprime.'),
    },
    'grid',
    {
      title: 'Fiche récap : le publipostage',
      subtitle: 'Six règles, chacune avec ses gestes.',
      imprimable: true,
      items: [
        {
          title: LES_SIX_REGLES[0],
          description:
            'Publipostage › Démarrer la fusion et le publipostage › Lettres ; la lettre type s’écrit une fois.',
        },
        {
          title: LES_SIX_REGLES[1],
          description:
            'Une ligne par destinataire, une colonne par champ, les en-têtes en première ligne ; Sélection des destinataires › Utiliser une liste existante.',
        },
        {
          title: LES_SIX_REGLES[2],
          description:
            'Insérer un champ de fusion ; Alt + F9 pour le code, \\# "# ##0,00 €" pour un montant ; Règles › Si…Alors…Sinon pour un texte qui dépend d’une colonne.',
        },
        {
          title: LES_SIX_REGLES[3],
          description:
            'Modifier la liste des destinataires › Filtrer : le champ du critère, sa comparaison, sa valeur.',
        },
        {
          title: LES_SIX_REGLES[4],
          description:
            'Aperçu des résultats, Rechercher un destinataire, Vérification des erreurs ; un défaut se corrige à sa source.',
        },
        {
          title: LES_SIX_REGLES[5],
          description:
            'Modifier des documents individuels › Tous pour l’archive, › Enregistrement en cours pour la lettre d’un client, puis Enregistrer sous › PDF.',
        },
      ],
    },
  ),
];
