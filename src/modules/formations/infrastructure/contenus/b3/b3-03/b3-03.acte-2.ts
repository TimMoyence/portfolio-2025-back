import {
  PIEGES_B3_03,
  questionChiffreeB303,
  VALEURS_B3_03,
} from './b3-03.donnees';
import {
  COLLER_LE_TEXTE_SEUL,
  EN_TETE_INVENTE,
  pageDeTraitementDeTexte,
  pageDuFournil,
} from './b3-03.briques';
import * as moteur from '../../briques';

const MAUVAIS_NIVEAU = 'niveau-de-reglage-confondu';
const DU_CARACTERE = {
  categorie: 'caractere',
  confusions: { paragraphe: MAUVAIS_NIVEAU, section: MAUVAIS_NIVEAU },
} as const;
const DU_PARAGRAPHE = {
  categorie: 'paragraphe',
  confusions: { caractere: MAUVAIS_NIVEAU, section: MAUVAIS_NIVEAU },
} as const;
const DE_LA_SECTION = {
  categorie: 'section',
  confusions: { caractere: MAUVAIS_NIVEAU, paragraphe: MAUVAIS_NIVEAU },
} as const;

const reglage = <N extends { readonly categorie: string }>(
  id: string,
  libelle: string,
  niveau: N,
  justification: string,
) => ({ id, libelle, ...niveau, justification });

const LES_SIX_REGLES = [
  '1. J’importe le texte seul, puis je le mets en forme dans Word.',
  '2. Je travaille marques affichées : jamais de ligne vide ni d’espace pour espacer ou aligner.',
  '3. Un titre reçoit un style, jamais une mise en forme à la main.',
  '4. La police et les couleurs viennent du thème.',
  '5. Ce qui change à chaque page s’insère par un champ : numéro, nombre de pages, date.',
  '6. Le PDF s’enregistre, il ne s’imprime pas.',
] as const;

export const ACTE_2: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-03-A2-01-VOTE-DECALER',
      titre: 'Vote : décaler un paragraphe',
      dureeMinutes: 2,
      concepts: ['mise-en-forme-des-paragraphes'],
      notes: moteur.puces(
        'Temps « réfléchir » des paragraphes : vote non noté, 1 min de vote et 1 min de révélation.',
        'Révélation : décaler par des espaces, puis changer la police ; l’alignement se perd.',
      ),
    },
    [
      moteur.vote(
        'b3-03-a2-decaler',
        'mise-en-forme-des-paragraphes',
        false,
        'Une citation doit être décalée de 2 cm vers la droite. Comment faites-vous ?',
        'Un retrait gauche de 2 cm',
        [
          [
            'Des espaces ou des tabulations en début de ligne',
            'espace-pour-aligner',
          ],
        ],
      ),
    ],
  ),
  pageDeTraitementDeTexte(
    {
      screenId: 'B3-03-A2-02-PAGE-PARAGRAPHES',
      titre: 'Page : aligner, retirer, espacer',
      concepts: ['mise-en-forme-des-paragraphes'],
      notes: [
        '2 min, enchaînées sur la page suivante.',
        'Ouvrir la boîte Paragraphe (le petit lanceur du groupe) : onglet Retrait et espacement, onglet Enchaînements.',
      ],
    },
    {
      rang: 6,
      page: pageDuFournil({
        blocks: [
          {
            style: 'title',
            align: 'center',
            runs: [{ text: 'Rapport d’activité 2026' }],
            marker: 1,
          },
          {
            style: 'normal',
            align: 'justify',
            indent: true,
            runs: [
              {
                text: 'Le fournil a cuit plus de pain que jamais, malgré un hiver doux qui a ralenti les ventes de viennoiseries.',
              },
            ],
            marker: 2,
          },
          {
            style: 'heading1',
            runs: [{ text: '2. Les projets' }],
            marker: 3,
          },
          {
            style: 'normal',
            align: 'justify',
            runs: [{ text: 'Ouvrir un second fournil à Lorient.' }],
          },
        ],
      }),
      pageAlt:
        'Une page Word : un titre centré, un paragraphe justifié en retrait, un titre de partie lié au paragraphe qui le suit.',
      syntaxe:
        'Accueil › Paragraphe : alignement (Ctrl + L, E, R, J), retraits, interligne, espacement avant et après ; onglet Enchaînements.',
      piege:
        'décaler par des espaces ou espacer par une ligne vide : tout bouge au moindre changement.',
      exemple:
        'corps justifié, 6 points après chaque paragraphe, titre lié au paragraphe suivant, dans le rapport inventé.',
      correspondances: [
        ['Pastille 1', 'l’alignement centré'],
        ['Pastille 2', 'justifié, avec un retrait de première ligne'],
        ['Pastille 3', 'Paragraphes solidaires : le titre reste avec la suite'],
      ],
    },
  ),
  pageDeTraitementDeTexte(
    {
      screenId: 'B3-03-A2-03-PAGE-LISTES-ET-SAUTS',
      titre: 'Page : listes à puces et sauts de page',
      concepts: ['mise-en-forme-des-paragraphes'],
      notes: [
        '2 min ; montrer la liste qui se décale toute seule quand on modifie son retrait.',
        'Transition : « Les paragraphes de la note : exercice 4. »',
      ],
    },
    {
      rang: 7,
      page: pageDuFournil({
        marks: true,
        blocks: [
          {
            style: 'heading1',
            runs: [{ text: '2. Les projets' }],
          },
          {
            style: 'list',
            runs: [{ text: 'Ouvrir un second fournil à Lorient' }],
            marker: 1,
          },
          {
            style: 'list',
            runs: [{ text: 'Former deux apprentis' }],
          },
          {
            style: 'list',
            runs: [{ text: 'Remplacer le pétrin' }],
          },
          {
            style: 'normal',
            align: 'center',
            runs: [{ text: 'Saut de page', tone: 'muted' }],
            marker: 2,
          },
          {
            style: 'heading1',
            runs: [{ text: '3. Annexe' }],
            marker: 3,
          },
        ],
      }),
      pageAlt:
        'Une page Word, marques affichées : une liste à puces de trois projets, puis un saut de page avant l’annexe.',
      syntaxe:
        'Accueil › Puces ou Numérotation ; Insertion › Saut de page, ou Ctrl + Entrée.',
      piege:
        'des Entrée répétées pour changer de page : la page se décale dès qu’on ajoute une ligne au-dessus.',
      exemple:
        'les trois projets du rapport inventé en puces, l’annexe sur une nouvelle page.',
      correspondances: [
        ['Pastille 1', 'la puce, posée par Word, pas tapée'],
        ['Pastille 2', 'le saut de page, Ctrl + Entrée'],
        ['Pastille 3', 'l’annexe commence en haut de page'],
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-03-A2-04-ATELIER-PARAGRAPHES',
      titre: 'Exercice 4 — Les paragraphes de la note',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 7,
      concepts: ['mise-en-forme-des-paragraphes'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 6),
        'Réflexion : faire retrouver dans la note la liste tapée avec des tirets.',
        'Pièges : chercher le tiret seul ; oublier l’espace après le tiret ; décaler la liste par des espaces.',
      ),
      proprietes: {
        intitule: 'Exercice 4 — Les paragraphes de la note',
        consigne:
          'Dans Note_comite.docx. Étape 1 : modifiez le style Normal : justifié, 6 points après, interligne 1,15. Étape 2 : Ctrl + H, Rechercher ^p- suivi d’une espace, Remplacer par ^p, Remplacer tout ; notez le nombre annoncé. Étape 3 : sélectionnez les lignes de la partie 4, Accueil › Puces. Étape 4 : modifiez le style Titre 2 : Paragraphe › Enchaînements, cochez Paragraphes solidaires.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffreeB303(
            'b3-03-a2-tirets',
            'mise-en-forme-des-paragraphes',
            'Étape 2 : combien de remplacements Word annonce-t-il ?',
            'remplacements',
          ),
          moteur.vote(
            'b3-03-a2-titre-seul',
            'mise-en-forme-des-paragraphes',
            true,
            'Un titre de niveau 2 reste seul en bas d’une page, son paragraphe part sur la suivante. Quel réglage l’évite ?',
            'Paragraphes solidaires, dans le style Titre 2',
            [
              ['Une Entrée avant le titre', 'saut-de-page-par-entrees'],
              [
                'Un saut de page avant chaque titre',
                'saut-de-page-par-entrees',
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
        'Règle 2, redite : « Jamais de ligne vide ni d’espace pour espacer ou aligner. »',
        'Transition : « Numéroter les pages : un vote. »',
      ],
    },
    [
      [
        'b3-03-a2-tirets',
        `^p- suivi d’une espace → ^p : ${VALEURS_B3_03['b3-03-a2-tirets']} remplacements, les lignes de la liste. Chercher le tiret seul en trouve ${PIEGES_B3_03['b3-03-a2-tirets']['recherche-mal-saisie']}, ceux des mots composés compris.`,
      ],
      [
        'b3-03-a2-titre-seul',
        'Paragraphes solidaires lie le titre au paragraphe suivant : ils changent de page ensemble. Réglé dans le style Titre 2, il vaut pour tous les titres. Une Entrée ou un saut de page se décalent dès que le texte change.',
      ],
    ],
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-03-A2-05-VOTE-NUMEROS',
      titre: 'Vote : numéroter les pages',
      dureeMinutes: 2,
      concepts: ['mise-en-page'],
      notes: moteur.puces(
        'Temps « réfléchir » de la mise en page : vote non noté, 1 min de vote et 1 min de révélation.',
        'Révélation : ajouter une page au début ; tous les numéros tapés sont faux.',
      ),
    },
    [
      moteur.vote(
        'b3-03-a2-numeros',
        'mise-en-page',
        false,
        'Le comité veut « Page 2 sur 5 » au bas de chaque page. Comment faites-vous ?',
        'J’insère les champs du numéro et du nombre de pages',
        [['Je tape le numéro au bas de chaque page', 'numero-de-page-tape']],
      ),
    ],
  ),
  pageDeTraitementDeTexte(
    {
      screenId: 'B3-03-A2-06-PAGE-EN-TETE-PIED',
      titre: 'Page : en-tête et pied de page',
      concepts: ['mise-en-page'],
      notes: [
        '2 min, enchaînées sur les deux pages suivantes : 6 min d’exposition au plus.',
        'Double-clic dans la marge du haut pour entrer dans l’en-tête, double-clic dans le corps pour en sortir.',
      ],
    },
    {
      rang: 8,
      page: {
        orientation: 'portrait',
        header: {
          style: 'normal',
          align: 'right',
          runs: [{ text: 'Fournil du Port · Rapport 2026 · exemple inventé' }],
          marker: 1,
        },
        blocks: [
          {
            style: 'heading1',
            runs: [{ text: '1. Bilan de l’année' }],
            marker: 2,
          },
          moteur.paragraphe([
            { text: 'Les ventes de pain progressent au printemps.' },
          ]),
        ],
        footer: {
          style: 'normal',
          align: 'center',
          runs: [{ text: '15/06/2026', field: true }],
          marker: 3,
        },
      },
      pageAlt:
        'Une page Word : un en-tête aligné à droite, un titre de partie, et en pied une date insérée par un champ.',
      syntaxe:
        'Insertion › En-tête ou Pied de page, ou double-clic dans la marge ; cochez Première page différente ; Insertion › Date et heure, Mettre à jour automatiquement.',
      piege: 'laisser en-tête et numéro sur la page de titre.',
      exemple:
        'en-tête « Fournil du Port · Rapport 2026 » à droite, date en pied, page de titre sans en-tête.',
      correspondances: [
        ['Pastille 1', 'l’en-tête, répété sur chaque page'],
        ['Pastille 2', 'le corps, que l’en-tête ne touche pas'],
        ['Pastille 3', 'la date, un champ qui se met à jour'],
      ],
    },
  ),
  pageDeTraitementDeTexte(
    {
      screenId: 'B3-03-A2-07-PAGE-MISE-EN-PAGE',
      titre: 'Page : marges, orientation et sections',
      concepts: ['mise-en-page'],
      notes: [
        '2 min ; afficher les marques pour voir le saut de section, « Saut de section (page suivante) ».',
        'Une section garde ses propres marges, son orientation et son en-tête.',
      ],
    },
    {
      rang: 9,
      page: {
        orientation: 'landscape',
        marginMarker: 1,
        header: EN_TETE_INVENTE,
        blocks: [
          {
            style: 'heading1',
            runs: [{ text: '3. Annexe' }],
            marker: 3,
          },
          {
            style: 'table',
            rows: [
              ['Produit', 'Janvier', 'Février', 'Mars'],
              ['Baguette', '4 210', '3 980', '4 450'],
              ['Brioche', '610', '590', '720'],
            ],
            marker: 2,
          },
        ],
      },
      pageAlt:
        'Une page Word en paysage : une marge marquée, un titre d’annexe et un large tableau de ventes mensuelles.',
      syntaxe:
        'Mise en page › Marges, Orientation ; Mise en page › Sauts › Page suivante crée une section.',
      piege:
        'passer en paysage après un simple saut de page : tout le document bascule.',
      exemple:
        'l’annexe du rapport inventé en paysage, seule dans sa section, marges de 2 cm.',
      correspondances: [
        ['Pastille 1', 'la marge, réglée par section'],
        ['Pastille 2', 'le tableau large, qui demande le paysage'],
        ['Pastille 3', 'la section de l’annexe, après un saut Page suivante'],
      ],
    },
  ),
  pageDeTraitementDeTexte(
    {
      screenId: 'B3-03-A2-08-PAGE-NUMEROS',
      titre: 'Page : numéroter « Page X sur Y »',
      concepts: ['mise-en-page'],
      notes: [
        '2 min ; Alt + F9 montre les codes de champ { PAGE } et { NUMPAGES }, Alt + F9 les cache.',
        'Transition : « En-tête, pied et mise en page de la note : exercice 5. »',
      ],
    },
    {
      rang: 10,
      page: {
        orientation: 'portrait',
        header: { ...EN_TETE_INVENTE, marker: 3 },
        blocks: [
          moteur.paragraphe(
            [{ text: 'Les ventes de pain progressent au printemps.' }],
            2,
          ),
        ],
        footer: {
          style: 'normal',
          align: 'center',
          runs: [
            { text: 'Page ' },
            { text: '2', field: true },
            { text: ' sur ' },
            { text: '5', field: true },
          ],
          marker: 1,
        },
      },
      pageAlt:
        'Une page Word : au pied, « Page 2 sur 5 », dont le 2 et le 5 sont des champs.',
      syntaxe:
        'Insertion › Numéro de page › Bas de page › Page X sur Y ; Format des numéros pour choisir le premier ; Alt + F9 montre les champs.',
      piege: 'taper « Page 2 » : toutes les pages disent 2.',
      exemple:
        '« Page 2 sur 5 » au pied du rapport inventé, recalculé à chaque page.',
      correspondances: [
        ['Pastille 1', 'les champs PAGE et NUMPAGES, entre deux mots tapés'],
        ['Pastille 2', 'le corps, qui ne porte aucun numéro'],
        ['Pastille 3', 'l’en-tête, même section, autre zone'],
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-03-A2-09-ATELIER-MISE-EN-PAGE',
      titre: 'Exercice 5 — En-tête, pied et mise en page',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 12,
      concepts: ['mise-en-page'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 11),
        'Réflexion : faire dire, avant de commencer, ce qui change à chaque page et ce qui reste.',
        'Pièges : en-tête sur la page de titre ; saut de page au lieu de section ; numéro tapé.',
      ),
      proprietes: {
        intitule: 'Exercice 5 — En-tête, pied et mise en page',
        consigne:
          'Dans Note_comite.docx. Étape 1 : curseur juste après le sous-titre, Ctrl + Entrée : la page 1 devient la page de titre. Étape 2 : Insertion › En-tête, tapez « Norvane Équipement · Note au comité », alignez à droite ; cochez Première page différente. Étape 3 : Insertion › Numéro de page › Bas de page › Page X sur Y. Étape 4 : curseur au début du titre de l’annexe, Mise en page › Sauts › Page suivante, puis Orientation › Paysage. Étape 5 : Mise en page › Marges › Normales sur tout le document.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b3-03-a2-premiere-page',
            'mise-en-page',
            true,
            'Étape 2 : comment avez-vous retiré l’en-tête de la page de titre ?',
            'J’ai coché Première page différente',
            [
              [
                'J’ai effacé le texte de l’en-tête sur la page 1',
                'premiere-page-non-differenciee',
              ],
            ],
          ),
          moteur.vote(
            'b3-03-a2-annexe-paysage',
            'mise-en-page',
            true,
            'Étape 4 : qu’avez-vous posé avant le titre de l’annexe pour la passer seule en paysage ?',
            'Un saut de section Page suivante',
            [
              [
                'Un saut de page, Ctrl + Entrée',
                'saut-de-page-au-lieu-de-section',
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
        'Règle 5, dite à la correction : « Ce qui change à chaque page s’insère par un champ : numéro, nombre de pages, date. »',
        'Transition : « Caractère, paragraphe ou section : un tri. »',
      ],
    },
    [
      [
        'b3-03-a2-premiere-page',
        'Première page différente garde l’en-tête des autres pages et vide celui de la page de titre. Effacer le texte à la main l’efface partout : l’en-tête est le même sur toutes les pages de la section.',
      ],
      [
        'b3-03-a2-annexe-paysage',
        'Un saut de section Page suivante ouvre une section qui garde sa propre orientation : seule l’annexe passe en paysage. Après un simple saut de page, toute la note bascule.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-03-A2-10-TRI-REGLAGES',
      titre: 'Exercice 6 — Caractère, paragraphe ou section ?',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 7,
      concepts: ['mise-en-page'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 6),
        'Réflexion : pour chaque réglage, une question : que faut-il sélectionner pour le changer ?',
      ),
      proprietes: {
        modalite: 'binome',
        ...moteur.classement(
          {
            id: 'b3-03-a2-tri-reglages',
            intitule:
              'Rangez chaque réglage au niveau où Word le porte : le caractère, le paragraphe ou la section.',
          },
          'mise-en-page',
          [
            ['caractere', 'Le caractère'],
            ['paragraphe', 'Le paragraphe'],
            ['section', 'La section'],
          ],
          [
            reglage(
              'police',
              'La police et sa taille',
              DU_CARACTERE,
              'elle se pose sur les caractères sélectionnés',
            ),
            reglage(
              'gras',
              'Le gras',
              DU_CARACTERE,
              'un mot peut l’avoir, son voisin non',
            ),
            reglage(
              'couleur',
              'La couleur d’un mot',
              DU_CARACTERE,
              'elle se pose sur les caractères sélectionnés',
            ),
            reglage(
              'alignement',
              'L’alignement justifié',
              DU_PARAGRAPHE,
              'tout le paragraphe est justifié, ou aucun mot',
            ),
            reglage(
              'retrait',
              'Le retrait gauche',
              DU_PARAGRAPHE,
              'il décale tout le paragraphe',
            ),
            reglage(
              'espacement',
              'L’espacement après',
              DU_PARAGRAPHE,
              'il s’ajoute après la marque ¶',
            ),
            reglage(
              'orientation',
              'L’orientation paysage',
              DE_LA_SECTION,
              'elle vaut pour toutes les pages de la section',
            ),
            reglage(
              'marges',
              'Les marges',
              DE_LA_SECTION,
              'elles valent pour toutes les pages de la section',
            ),
            reglage(
              'en-tete',
              'Le texte de l’en-tête',
              DE_LA_SECTION,
              'chaque section peut avoir le sien',
            ),
          ],
        ),
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger case par case : demander ce qu’il faut sélectionner pour changer chaque réglage.',
        'Transition : « Le document est prêt ; il part au comité : un vote. »',
      ],
    },
    [
      [
        'caractere',
        'Police, gras, couleur : ils se posent sur les caractères sélectionnés, un mot à la fois si l’on veut.',
      ],
      [
        'paragraphe',
        'Alignement, retrait, espacement : ils valent pour tout le paragraphe, jusqu’à sa marque ¶.',
      ],
      [
        'section',
        'Orientation, marges, en-tête : ils valent pour toutes les pages de la section ; pour en changer sur une partie, un saut de section.',
      ],
    ],
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-03-A2-11-VOTE-PDF',
      titre: 'Vote : un PDF pour le comité',
      dureeMinutes: 2,
      concepts: ['export-pdf'],
      notes: moteur.puces(
        'Temps « réfléchir » du PDF : vote non noté, 1 min de vote et 1 min de révélation.',
        'Révélation : ouvrir les deux PDF côte à côte ; seul l’enregistré a des signets.',
      ),
    },
    [
      moteur.vote(
        'b3-03-a2-pdf',
        'export-pdf',
        false,
        'Nadia veut un PDF de la note, avec ses titres cliquables dans le lecteur. Comment le faites-vous ?',
        'Fichier › Enregistrer sous, type PDF',
        [
          [
            'Fichier › Imprimer, imprimante Microsoft Print to PDF',
            'pdf-imprime-au-lieu-d-enregistre',
          ],
        ],
      ),
    ],
  ),
  pageDeTraitementDeTexte(
    {
      screenId: 'B3-03-A2-12-PAGE-PDF',
      titre: 'Page : enregistrer en PDF',
      concepts: ['export-pdf'],
      notes: [
        '2 min ; sur Mac : Fichier › Enregistrer sous, Format de fichier PDF, « Idéal pour la distribution électronique ».',
        'Transition : « Le PDF de la note : exercice 7. »',
      ],
    },
    {
      rang: 11,
      page: pageDuFournil({
        blocks: [
          {
            style: 'heading1',
            runs: [{ text: '1. Bilan de l’année' }],
            marker: 1,
          },
          {
            style: 'heading2',
            runs: [{ text: '1.1 Le pain' }],
            marker: 2,
          },
          moteur.paragraphe(
            [
              { text: 'Détail en ligne sur ' },
              {
                text: 'fournil-du-port.example',
                underline: true,
                tone: 'accent',
              },
              { text: '.' },
            ],
            3,
          ),
        ],
      }),
      pageAlt:
        'Une page Word avant l’export : un titre de niveau 1 et un de niveau 2, qui deviendront des signets, et un lien.',
      syntaxe:
        'Fichier › Enregistrer sous › type PDF › Options › Créer des signets à l’aide de : Titres.',
      piege: 'Imprimer vers un PDF : signets et liens perdus.',
      exemple:
        'le PDF du rapport inventé s’ouvre avec les signets « 1. Bilan de l’année » et « 1.1 Le pain ».',
      correspondances: [
        ['Pastille 1', 'un Titre 1 devient un signet'],
        ['Pastille 2', 'un Titre 2 devient un signet sous le précédent'],
        ['Pastille 3', 'le lien reste cliquable dans le PDF'],
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-03-A2-13-ATELIER-PDF',
      titre: 'Exercice 7 — Le PDF du comité',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 6,
      concepts: ['export-pdf'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 5),
        'Réflexion : faire vérifier le volet de navigation avant d’exporter : les signets viennent des titres.',
      ),
      proprietes: {
        intitule: 'Exercice 7 — Le PDF du comité',
        consigne:
          'Étape 1 : Fichier › Enregistrer sous, type PDF, nom Note_comite.pdf. Étape 2 : Options, cochez Créer des signets à l’aide de : Titres, OK, Enregistrer. Étape 3 : ouvrez le PDF, affichez le volet des signets.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b3-03-a2-signets',
            'export-pdf',
            true,
            'Quel geste a donné à votre PDF les signets des titres de la note ?',
            'Enregistrer sous en PDF, avec l’option des signets par les titres',
            [
              [
                'Imprimer vers Microsoft Print to PDF',
                'pdf-imprime-au-lieu-d-enregistre',
              ],
              [
                'Enregistrer en .docx puis renommer le fichier en .pdf',
                'pdf-imprime-au-lieu-d-enregistre',
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
        'Règle 6, dite à la correction : « Le PDF s’enregistre, il ne s’imprime pas. »',
        'Transition : « La fiche récap des six règles. »',
      ],
    },
    [
      [
        'b3-03-a2-signets',
        'Enregistrer sous en PDF, l’option des signets par les titres cochée : chaque Titre 1 et chaque Titre 2 devient un signet. Imprimer vers un PDF n’en crée aucun ; renommer un .docx ne le change pas en PDF.',
      ],
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B3-03-A2-14-FICHE-RECAP',
      titre: 'Fiche récap : mettre en forme et mettre en page',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: [
        'texte-brut',
        'styles-et-theme',
        'mise-en-forme-des-paragraphes',
        'mise-en-page',
        'export-pdf',
      ],
      notes: moteur.puces(
        '2 min ; la fiche s’imprime.',
        moteur.PAUSE_HORS_DUREE,
      ),
    },
    'grid',
    {
      title: 'Fiche récap : mettre en forme et mettre en page',
      subtitle: 'Six règles, chacune avec ses gestes.',
      imprimable: true,
      items: [
        {
          title: LES_SIX_REGLES[0],
          description: `Insertion › Objet › Texte d’un fichier, ou ${COLLER_LE_TEXTE_SEUL} ; puis les styles.`,
        },
        {
          title: LES_SIX_REGLES[1],
          description:
            'Accueil › ¶ ; Ctrl + H : ^p^p par ^p, deux espaces par une, ^p- par ^p ; puces, retraits, espacements, Ctrl + Entrée.',
        },
        {
          title: LES_SIX_REGLES[2],
          description:
            'Titre, Sous-titre, Titre 1, Titre 2, Normal ; clic droit › Modifier ; Affichage › Volet de navigation.',
        },
        {
          title: LES_SIX_REGLES[3],
          description:
            'Création › Thèmes, Couleurs, Polices ; la mise en forme directe pour un mot isolé seulement.',
        },
        {
          title: LES_SIX_REGLES[4],
          description:
            'Insertion › Numéro de page › Page X sur Y ; Date et heure mise à jour ; Première page différente ; Sauts › Page suivante pour une section.',
        },
        {
          title: LES_SIX_REGLES[5],
          description:
            'Fichier › Enregistrer sous › PDF › Options › Créer des signets à l’aide de : Titres.',
        },
      ],
    },
  ),
];
