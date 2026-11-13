import {
  ADRESSES_DE_REMPLISSAGE_B3_04,
  CLASSEUR_D_ENVOI,
} from './b3-04.donnees';
import { COLLER_LE_TEXTE_SEUL, pageDuFournil } from '../b3-03/b3-03.briques';
import { champ, pageDePublipostage } from './b3-04.briques';
import * as moteur from '../../briques';

const REPRIS = 'texte-d-ia-repris-sans-relecture';
const REJETE = 'texte-d-ia-rejete-sans-relecture';
const MAL_NOMME = 'ecart-d-ia-mal-nomme';
const RETENUE_A_TORT = {
  colonne: REJETE,
  'en-dur': REJETE,
  promesse: REJETE,
} as const;
const COLONNE_INVENTEE = {
  juste: REPRIS,
  'en-dur': MAL_NOMME,
  promesse: MAL_NOMME,
} as const;
const VALEUR_EN_DUR = {
  juste: REPRIS,
  colonne: MAL_NOMME,
  promesse: MAL_NOMME,
} as const;
const PROMESSE_INVENTEE = {
  juste: REPRIS,
  colonne: MAL_NOMME,
  'en-dur': MAL_NOMME,
} as const;

const OBJET = 'Votre activité avec Norvane depuis janvier';

const ENVOYER: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-04-A3-01-VOTE-ENVOI',
      titre: 'Vote : envoyer la lettre par courriel',
      dureeMinutes: 2,
      concepts: ['e-mailing'],
      notes: moteur.puces(
        'Temps « réfléchir » de l’envoi : vote non noté, 1 min de vote et 1 min de révélation.',
        'Révélation : un courriel en copie à cinquante clients leur montre les adresses des quarante-neuf autres.',
      ),
    },
    [
      moteur.vote(
        'b3-04-a3-courriel',
        'e-mailing',
        false,
        'Nadia veut envoyer la lettre par courriel plutôt que par la poste. Comment part-elle ?',
        'Un courriel par destinataire, chacun à sa propre adresse, avec sa lettre',
        [
          [
            'Un seul courriel, toutes les adresses en copie, la lettre dans le corps',
            'destinataires-en-copie',
          ],
        ],
      ),
    ],
  ),
  pageDePublipostage(
    {
      screenId: 'B3-04-A3-02-PAGE-E-MAILING',
      titre: 'Page : chemin 1, l’e-mailing depuis Word',
      concepts: ['e-mailing'],
      notes: [
        '2 min, enchaînées sur la page suivante.',
        'Word envoie par Outlook classique pour Windows, compte configuré ; ni le nouvel Outlook, ni Word pour Mac, ni Word sur le web ne le font.',
      ],
    },
    {
      rang: 10,
      page: pageDuFournil({
        blocks: [
          {
            style: 'table',
            rows: [
              ['À', 'courriel'],
              ['Objet', 'Vos commandes de la saison'],
              ['Format', 'HTML'],
            ],
            marker: 1,
          },
          moteur.paragraphe(
            [{ text: 'Envoyer les enregistrements : Tous' }],
            2,
          ),
          moteur.paragraphe(
            [{ text: 'Outlook classique, Boîte d’envoi : 2 messages' }],
            3,
          ),
        ],
      }),
      pageAlt:
        'La fenêtre d’envoi de Word sur l’exemple inventé du Fournil du Port : le champ À sur la colonne des courriels, un objet, le format HTML, puis les messages dans la boîte d’envoi.',
      syntaxe:
        'Publipostage › Terminer et fusionner › Envoyer des messages électroniques : À, Objet, Format de messagerie, enregistrements à envoyer.',
      piege:
        'choisir le format Texte brut : la lettre arrive sans sa mise en forme.',
      exemple:
        'le Fournil du Port, exemple inventé, envoie deux messages, un à chaque client, chacun avec sa lettre dans le corps.',
      correspondances: [
        ['Pastille 1', 'la colonne des adresses, un objet, le format'],
        ['Pastille 2', 'tous les destinataires retenus par le filtre'],
        ['Pastille 3', 'un message par destinataire, dans Outlook classique'],
      ],
    },
  ),
  pageDePublipostage(
    {
      screenId: 'B3-04-A3-03-PAGE-PDF-JOINT',
      titre: 'Page : chemin 2, la lettre en PDF joint',
      concepts: ['e-mailing', 'fusion-et-pdf'],
      notes: [
        '2 min ; ce chemin marche avec toute messagerie, sur tout poste.',
        'Transition : « À vous et à votre binôme : exercice 7. »',
      ],
    },
    {
      rang: 11,
      page: pageDuFournil({
        blocks: [
          moteur.paragraphe(
            [{ text: 'Enregistrement en cours : ' }, champ('enseigne')],
            1,
          ),
          moteur.paragraphe([{ text: 'Lettre_Hotel_des_Dunes.pdf' }], 2),
          moteur.paragraphe(
            [{ text: 'Nouveau message · pièce jointe : 1', tone: 'accent' }],
            3,
          ),
        ],
      }),
      pageAlt:
        'Le second chemin sur l’exemple inventé : une seule lettre fusionnée, enregistrée en PDF, puis jointe à un nouveau message.',
      syntaxe:
        'Aperçu sur le destinataire, Modifier des documents individuels › Enregistrement en cours, Enregistrer sous › PDF ; puis un nouveau message, le PDF en pièce jointe.',
      piege:
        'joindre le PDF de toutes les lettres : le destinataire lit celles des autres.',
      exemple:
        'l’Hôtel des Dunes, client inventé, reçoit un message court et sa seule lettre en PDF.',
      correspondances: [
        ['Pastille 1', 'le seul destinataire affiché'],
        ['Pastille 2', 'sa lettre en PDF, nommée pour lui'],
        ['Pastille 3', 'le message écrit à la main, la lettre jointe'],
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-04-A3-04-ATELIER-ENVOI',
      titre: 'Exercice 7 — Envoyer à vous et à votre binôme',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 12,
      concepts: ['e-mailing'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 11),
        'Réflexion : faire dire, avant tout envoi, à qui partiront les courriels ; jamais au classeur des contacts, dont aucune ligne n’a d’adresse.',
        'Chemin 1 sur les postes Windows à Outlook classique configuré ; tous les autres prennent le chemin 2. Passer dans les rangs avant le clic sur OK.',
      ),
      proprietes: {
        intitule: 'Exercice 7 — Envoyer à vous et à votre binôme',
        consigne: `Étape 1 : enregistrez le classeur d’envoi B3-04_envoi, ouvrez-le dans Excel ; remplacez ${ADRESSES_DE_REMPLISSAGE_B3_04[0]} par votre adresse et ${ADRESSES_DE_REMPLISSAGE_B3_04[1]} par celle de votre binôme ; enregistrez et fermez. Étape 2 : dans Lettre_clients.docx, Sélection des destinataires › Utiliser une liste existante, B3-04_envoi, onglet Contacts ; la lettre type ne change pas. Modifier la liste des destinataires : deux destinataires, deux courriels au plus. Étape 3, Chemin 1 (Outlook classique pour Windows) : Terminer et fusionner › Envoyer des messages électroniques ; À : email ; Objet : « ${OBJET} » ; Format : HTML ; Tous ; OK. Étape 3, Chemin 2 (sans Outlook classique) : Aperçu des résultats sur votre ligne, Modifier des documents individuels › Enregistrement en cours, enregistrez la lettre en PDF ; dans votre messagerie, écrivez-vous un courriel, objet « ${OBJET} », lettre en pièce jointe ; faites de même pour votre binôme avec sa lettre.`,
        regime: 'focus',
        ordre: 'fixe',
        pieceJointe: CLASSEUR_D_ENVOI,
        questions: [
          moteur.vote(
            'b3-04-a3-envoi',
            'e-mailing',
            true,
            'Chemin 1 : quels réglages donnez-vous à la fenêtre Envoyer des messages électroniques ?',
            `À : email · Objet : ${OBJET} · Format : HTML`,
            [
              [
                `À : nom · Objet : ${OBJET} · Format : HTML`,
                'champ-a-mal-choisi',
              ],
              [
                `À : email · Objet : ${OBJET} · Format : Texte brut`,
                'format-de-message-texte-brut',
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
        'Règle 6, redite : « Un destinataire ne reçoit que sa lettre. »',
        'Transition : « Ouvrez votre boîte : le courriel reçu. »',
      ],
    },
    [
      [
        'b3-04-a3-envoi',
        'Le champ À prend la colonne email : un message par ligne, chacun à sa propre adresse. Le format HTML garde la mise en forme de la lettre ; le texte brut la perd. Sur la colonne nom, Outlook ne trouve aucune adresse.',
      ],
    ],
  ),
  {
    screenId: 'B3-04-A3-05-RECU',
    titre: 'Le courriel reçu',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 4,
    concepts: ['e-mailing'],
    notes: moteur.puces(
      '4 min : chacun ouvre sa boîte de réception et vérifie le courriel reçu point par point.',
      'Un courriel absent : regarder les indésirables, puis la boîte d’envoi d’Outlook.',
    ),
    proprietes: {
      metier:
        'Assistant de direction — Norvane Équipement (réseau de 12 agences)',
      situation:
        'Avant d’envoyer à cinquante clients, Nadia veut que le courriel reçu soit vérifié sur deux boîtes : la vôtre et celle de votre binôme.',
      geste:
        'Ouvrez le courriel reçu et vérifiez l’expéditeur, l’objet, la formule d’appel, le nom, le montant au format français et, pour le chemin 2, la pièce jointe.',
      consequence:
        'Un défaut vu sur deux courriels, c’est cinquante clients qui ne le recevront pas.',
      questionsLibres: [
        {
          id: 'b3-04-a3-recu:chemin',
          question: 'Par quel chemin avez-vous envoyé, et sur quel poste ?',
          placeholder: 'Chemin 1 ou 2 · poste : …',
        },
        {
          id: 'b3-04-a3-recu:controle',
          question:
            'Point par point : expéditeur, objet, formule d’appel, nom, montant, pièce jointe. Ce qui est juste, ce qui ne l’est pas.',
          placeholder: 'Juste : … · à corriger : …',
        },
      ],
    },
  },
];

const FAIRE_ECRIRE: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-04-A3-06-VOTE-IA',
      titre: 'Vote : la lettre écrite par une IA',
      dureeMinutes: 2,
      concepts: ['ia-redactrice', 'champ-de-fusion'],
      notes: moteur.puces(
        'Temps « réfléchir » de l’IA : vote non noté, 1 min de vote et 1 min de révélation.',
        'Révélation : coller une lettre à crochets dans la lettre type, puis Aperçu ; les crochets restent.',
      ),
    },
    [
      moteur.vote(
        'b3-04-a3-lettre-ia',
        'ia-redactrice',
        false,
        'Une IA propose une lettre de relance, avec « [Prénom] » et « [Montant] » aux places des données. Que faites-vous ?',
        'Je la relis, puis je remplace chaque crochet par le champ inséré',
        [
          [
            'Je la colle telle quelle dans la lettre type, crochets compris',
            'texte-d-ia-repris-sans-relecture',
          ],
          [
            'Je tape le nom de la colonne dans chaque crochet',
            'champ-tape-a-la-main',
          ],
        ],
      ),
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B3-04-A3-07-COURS-IA-LETTRE',
      titre: 'Cours : une IA qui écrit la lettre type',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['ia-redactrice', 'champ-de-fusion'],
      notes: moteur.puces(
        '3 min ; les contrôles servent à l’exercice 8.',
        'Chacun utilise l’IA conversationnelle de son choix ; sans compte, on travaille en binôme.',
      ),
    },
    'lesson',
    {
      title: 'Une IA qui écrit la lettre type',
      subtitle: 'L’IA rédactrice · le publipostage',
      blocks: [
        {
          kind: 'definition',
          title: 'Ce qu’elle sait, ce qu’elle ignore',
          text: 'Une IA écrit une lettre claire en quelques secondes. Elle ignore les colonnes de votre classeur : elle invente des données à mettre entre crochets, des montants, des promesses que personne n’a faites.',
        },
        {
          kind: 'method',
          title: 'La consigne de la lettre type',
          text: 'Les cinq parties du B3-03, adaptées à la fusion.',
          steps: [
            'Rôle : « Tu es assistant de la direction commerciale. »',
            'Lecteur : le client qui reçoit la lettre, ce qu’il sait déjà.',
            'Colonnes : la liste exacte des en-têtes du classeur, seules données permises.',
            'Contraintes : aucune promesse, aucun chiffre tapé, chaque donnée entre crochets à son nom de colonne.',
            'Format : texte brut, sans gras, sans formule d’appel.',
          ],
        },
        {
          kind: 'example',
          title: 'Une consigne courte, hors dossier',
          text: '« Tu es assistant d’une boulangerie. Écris une lettre de remerciement à nos clients professionnels. Colonnes permises : [enseigne], [quartier]. Aucune promesse. Texte brut. » Exemple inventé.',
        },
        {
          kind: 'property',
          title: 'Relire, puis insérer les champs',
          text: `Chaque crochet doit nommer une colonne du classeur ; chaque phrase se relit contre ce que l’entreprise peut tenir. Puis le texte seul par ${COLLER_LE_TEXTE_SEUL}, et chaque crochet remplacé par son champ inséré.`,
        },
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-04-A3-08-AUDIT-LETTRE-IA',
      titre: 'Exercice 8 — Relire la lettre d’une IA',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 9,
      concepts: ['ia-redactrice', 'champ-de-fusion'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 7),
        'Réflexion : faire ouvrir le classeur des contacts à côté ; chaque crochet se compare à ses en-têtes.',
        'La lettre est écrite pour ce cours : le dire.',
      ),
      proprietes: {
        modalite: 'binome',
        ...moteur.classement(
          {
            id: 'b3-04-a3-audit',
            intitule:
              'Huit phrases d’une lettre type écrite par une IA pour ce cours. Comparez chacune au classeur des contacts et à ce que Nadia peut tenir, puis rangez-la.',
          },
          'ia-redactrice',
          [
            ['juste', 'Juste : à garder'],
            ['colonne', 'Faux : une colonne qui n’existe pas'],
            ['en-dur', 'Faux : une valeur tapée en dur'],
            ['promesse', 'Faux : une promesse inventée'],
          ],
          [
            {
              id: 'merci',
              libelle:
                'Nous vous remercions de la confiance que vous accordez à notre agence de [agence].',
              categorie: 'juste',
              confusions: RETENUE_A_TORT,
              justification: 'la colonne agence existe',
            },
            {
              id: 'montant',
              libelle:
                'De janvier à septembre 2026, [raison_sociale] a réalisé [ca_2026] de chiffre d’affaires HT avec nous.',
              categorie: 'juste',
              confusions: RETENUE_A_TORT,
              justification: 'deux colonnes du classeur, une période juste',
            },
            {
              id: 'conseiller',
              libelle: 'Votre conseiller, [commercial], reste à votre écoute.',
              categorie: 'colonne',
              confusions: COLONNE_INVENTEE,
              justification: 'aucune colonne commercial',
            },
            {
              id: 'fidelite',
              libelle:
                'Votre numéro de fidélité, [numero_fidelite], vous ouvre nos ventes privées.',
              categorie: 'colonne',
              confusions: COLONNE_INVENTEE,
              justification: 'aucune colonne de fidélité',
            },
            {
              id: 'durand',
              libelle: 'Cher Monsieur Durand,',
              categorie: 'en-dur',
              confusions: VALEUR_EN_DUR,
              justification: 'un nom tapé pour tous',
            },
            {
              id: 'ville',
              libelle:
                'Toute l’équipe de Rennes vous souhaite une belle fin d’année.',
              categorie: 'en-dur',
              confusions: VALEUR_EN_DUR,
              justification: 'l’agence tapée au lieu du champ',
            },
            {
              id: 'remise',
              libelle:
                'Une remise de 10 % vous est offerte sur votre prochaine commande.',
              categorie: 'promesse',
              confusions: PROMESSE_INVENTEE,
              justification: 'aucune remise décidée par Nadia',
            },
            {
              id: 'livraison',
              libelle:
                'Vos prochaines commandes vous seront livrées sous 48 heures.',
              categorie: 'promesse',
              confusions: PROMESSE_INVENTEE,
              justification: 'un délai que personne n’a promis',
            },
          ],
        ),
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger case par case ; demander à chaque fois quelle colonne ou quelle décision tranche.',
        'Transition : « La consigne qui évite ces écarts : exercice 9. »',
      ],
    },
    [
      [
        'juste',
        'Les colonnes agence, raison_sociale et ca_2026 existent : ces phrases se gardent, leurs crochets deviennent des champs. Les rejeter sans comparer, c’est perdre une lettre juste.',
      ],
      [
        'colonne',
        'Le classeur n’a ni commercial ni numéro de fidélité : la fusion ne trouverait rien. Une colonne inventée se supprime, ou s’ajoute au classeur si l’entreprise la tient.',
      ],
      [
        'en-dur',
        'Un nom ou une ville tapés partent dans toutes les lettres : ils se remplacent par la règle de formule d’appel et le champ agence.',
      ],
      [
        'promesse',
        'Aucune remise, aucun délai n’ont été décidés : une promesse inventée engage l’entreprise auprès de chaque client. Elle se supprime.',
      ],
    ],
  ),
  moteur.defiDeConsigne({
    screenId: 'B3-04-A3-09-DEFI-CONSIGNE',
    titre: 'Exercice 9 — Votre consigne pour la lettre type',
    aRelire: 'la consigne de la lettre type et les en-têtes du classeur',
    probleme: {
      id: 'b3-04-a3-consigne',
      enonce:
        'Nadia veut écrire aux clients qui n’ont rien commandé depuis janvier pour les inviter à reprendre contact avec leur agence. Écrivez la consigne que vous donnerez à une IA pour obtenir la lettre type.',
      invite:
        'En cinq parties : le rôle, le lecteur, les colonnes permises, les contraintes, le format de la réponse.',
    },
    strategies: [
      moteur.strategie(
        'lecteur',
        'Lecteur : « Un client professionnel qui n’a rien commandé cette année et ne connaît pas Nadia. »',
      ),
      moteur.strategie(
        'colonnes',
        'Colonnes : « Seules données permises, entre crochets à leur nom : [raison_sociale], [agence]. »',
      ),
      moteur.strategie(
        'contraintes',
        'Contraintes : « Aucune remise, aucun délai, aucun chiffre ; dix lignes au plus. »',
      ),
      moteur.strategie(
        'format',
        'Format : « Texte brut, sans formule d’appel, sans gras ni puces. »',
      ),
      moteur.strategie('ecrire', '« Écris une lettre à mes clients. »', true),
    ],
    pourquoiLaFausse: 'ni colonnes, ni contraintes, ni format.',
    explication:
      'Une bonne consigne tient en cinq parties : rôle, lecteur, colonnes permises, contraintes, format. « Écris une lettre à mes clients » est la consigne fausse : l’IA inventera des données, des promesses et une formule d’appel tapée.',
  }),
  {
    screenId: 'B3-04-A3-10-LETTRE-IA',
    titre: 'L’IA au travail : la lettre de relance',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 10,
    concepts: ['ia-redactrice', 'champ-de-fusion', 'regle-de-fusion'],
    notes: moteur.puces(
      '10 min : 2 pour donner la consigne, 4 pour relire, 4 pour coller le texte seul et insérer les champs.',
      'Sans compte, en binôme sur le poste du voisin ; si aucune IA ne répond, le formateur projette la sienne et la classe dicte la consigne.',
      'Passer dans les rangs : faire montrer, pour chaque crochet, la colonne du classeur.',
    ),
    proprietes: {
      metier:
        'Assistant de direction — Norvane Équipement (réseau de 12 agences)',
      situation:
        'Nadia veut une lettre de relance pour les clients sans commande depuis janvier, prête à fusionner avec le classeur des contacts.',
      geste:
        'Donnez votre consigne à l’IA de votre choix, relisez la lettre contre le classeur, collez le texte seul dans un nouveau document de publipostage lié aux contacts, remplacez chaque crochet par son champ et ajoutez la règle de la formule d’appel.',
      consequence:
        'Une promesse inventée part chez chaque client relancé : c’est l’entreprise qui devra la tenir.',
      questionsLibres: [
        {
          id: 'b3-04-a3-lettre-ia:outil',
          question:
            'Quelle IA avez-vous utilisée, et avec qui si vous étiez en binôme ?',
          placeholder: 'IA : … · binôme : …',
        },
        {
          id: 'b3-04-a3-lettre-ia:ecarts',
          question:
            'Les écarts trouvés à la relecture : la phrase de l’IA, ce qui la contredit, ce que vous en avez fait.',
          placeholder: 'IA : … · classeur ou décision : … · fait : …',
        },
        {
          id: 'b3-04-a3-lettre-ia:champs',
          question:
            'Les champs et la règle insérés dans votre lettre de relance.',
          placeholder: 'Champs : … · règle : …',
        },
      ],
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B3-04-A3-11-FICHE-MEMO',
      titre: 'Fiche mémo : envoyer et faire écrire',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['e-mailing', 'ia-redactrice'],
      notes: moteur.puces(
        '3 min ; la fiche s’imprime et s’agrafe à la fiche récap.',
      ),
    },
    'grid',
    {
      title: 'Fiche mémo : envoyer et faire écrire',
      subtitle:
        'Les deux chemins d’envoi, la consigne de la lettre type, la relecture.',
      imprimable: true,
      items: [
        {
          title: 'Chemin 1 : l’e-mailing',
          description:
            'Outlook classique pour Windows : Terminer et fusionner › Envoyer des messages électroniques, À sur la colonne des adresses, un objet, le format HTML.',
        },
        {
          title: 'Chemin 2 : le PDF joint',
          description:
            'Toute messagerie : Enregistrement en cours, Enregistrer sous › PDF, puis un message écrit à la main, la lettre jointe.',
        },
        {
          title: 'Essayer avant d’envoyer',
          description:
            'Une liste de deux lignes à vos propres adresses ; on n’envoie aux clients qu’après avoir lu le courriel reçu.',
        },
        {
          title: 'La consigne',
          description:
            'Rôle, lecteur, colonnes permises entre crochets, contraintes (aucune promesse, aucun chiffre tapé), texte brut.',
        },
        {
          title: 'La relecture',
          description:
            'Chaque crochet est une colonne du classeur ; chaque phrase, une chose que l’entreprise peut tenir.',
        },
        {
          title: 'Le retour dans Word',
          description: `Texte seul par ${COLLER_LE_TEXTE_SEUL}, chaque crochet remplacé par son champ inséré, la formule d’appel par une règle.`,
        },
      ],
    },
  ),
];

export const ACTE_3: moteur.Acte = [...ENVOYER, ...FAIRE_ECRIRE];
