import {
  NOTE_A_TELECHARGER,
  NOTE_RESERVEE,
  PIEGES_B3_03,
  questionChiffreeB303,
  VALEURS_B3_03,
} from './b3-03.donnees';
import {
  COLLER_LE_TEXTE_SEUL,
  FOND_DE_LA_MACHINE_A_ECRIRE,
  pageDeTraitementDeTexte,
  pageDuFournil,
} from './b3-03.briques';
import * as moteur from '../../briques';

const DIRECTE = {
  style: 'style-pour-un-mot-isole',
  theme: 'style-pour-un-mot-isole',
} as const;
const PAR_UN_STYLE = {
  directe: 'mise-en-forme-directe-au-lieu-du-style',
  theme: 'mise-en-forme-directe-au-lieu-du-style',
} as const;
const PAR_LE_THEME = {
  directe: 'couleur-hors-du-theme',
  style: 'couleur-hors-du-theme',
} as const;

export const ACTE_1: moteur.Acte = [
  {
    screenId: 'B3-03-A1-01-RAPPEL-MEDIANE',
    titre: 'Rappel : le délai typique',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 2,
    concepts: ['indicateur-statistique'],
    notes: moteur.puces(
      'Pendant que les postes rejoignent la séance : vérifier au pupitre que tous sont connectés.',
      'Réponse de mémoire. La note de Nadia cite des délais médians : faire redire pourquoi la médiane résiste aux ruptures livrées deux mois plus tard.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b3-03-a1-rappel-mediane',
          'indicateur-statistique',
          true,
          'La note de Nadia donne le délai typique de livraison de Strasbourg en 2026. Lequel a-t-elle calculé ?',
          'La médiane des délais',
          [['La moyenne des délais', 'valeur-extreme-ignoree']],
        ),
      ],
      delaiMs: 0,
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B3-03-A1-02-ACCROCHE',
      titre: 'Traitement de texte : mettre en forme et mettre en page',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['texte-brut'],
      notes: moteur.puces(
        'Faire télécharger la note brute : un fichier texte, sans aucune mise en forme.',
        'Annoncer la séance : deux heures pour faire de ce texte un document, une heure où une IA réécrit et où l’on vérifie chaque chiffre.',
      ),
    },
    'hero',
    {
      title: 'Traitement de texte : mettre en forme et mettre en page',
      subtitle:
        'Mardi 8 décembre, 8 h 30. Nadia Ferrand a tapé sa note au comité de direction d’un trait, en texte brut. À vous d’en faire un document : propre, stylé, mis en page, numéroté, en PDF. Données fictives.',
      ...FOND_DE_LA_MACHINE_A_ECRIRE,
    },
    NOTE_A_TELECHARGER,
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-03-A1-03-VOTE-LIGNES-VIDES',
      titre: 'Vote : une ligne vide entre deux paragraphes',
      dureeMinutes: 2,
      concepts: ['mise-en-forme-des-paragraphes'],
      notes: moteur.puces(
        'Temps « réfléchir » de l’import : vote non noté, 1 min de vote et 1 min de révélation.',
        'Révélation : ouvrir la note dans le Bloc-notes, une ligne vide entre chaque ligne ; c’est ce qu’on va retirer.',
      ),
    },
    [
      moteur.vote(
        'b3-03-a1-lignes-vides',
        'mise-en-forme-des-paragraphes',
        false,
        'Dans un document Word, comment espace-t-on deux paragraphes ?',
        'Par l’espacement après le paragraphe',
        [['Par une ligne vide entre les deux', 'paragraphe-vide-pour-espacer']],
      ),
    ],
    NOTE_RESERVEE,
  ),
  pageDeTraitementDeTexte(
    {
      screenId: 'B3-03-A1-04-PAGE-IMPORTER',
      titre: 'Page : importer un texte brut',
      concepts: ['texte-brut'],
      notes: [
        '2 min, enchaînées sur la page suivante.',
        `Montrer les deux chemins : Insertion › Objet › Texte d’un fichier, et ${COLLER_LE_TEXTE_SEUL} (sur Mac : Édition › Coller et respecter le style).`,
      ],
    },
    {
      rang: 1,
      page: pageDuFournil({
        marks: true,
        blocks: [
          moteur.paragraphe(
            [{ text: 'RAPPORT D’ACTIVITÉ DU FOURNIL DU PORT' }],
            1,
          ),
          { style: 'empty', runs: [], marker: 2 },
          moteur.paragraphe(
            [{ text: 'Les ventes de pain progressent au printemps.' }],
            3,
          ),
          { style: 'empty', runs: [] },
          moteur.paragraphe([{ text: 'Le four neuf arrive en mars.' }]),
        ],
      }),
      pageAlt:
        'Une page Word, marques de paragraphe affichées : le texte importé est en style Normal, un paragraphe vide sépare chaque ligne.',
      syntaxe: `Insertion › Objet › Texte d’un fichier, ou ${COLLER_LE_TEXTE_SEUL} pour coller le texte seul.`,
      piege:
        'coller par Ctrl + V une page web ou un courriel : sa police et ses couleurs entrent avec le texte.',
      exemple:
        'le rapport du Fournil du Port, exemple inventé, arrive en Normal, un paragraphe vide entre deux lignes.',
      correspondances: [
        ['Pastille 1', 'le texte entre en style Normal'],
        ['Pastille 2', 'la ligne vide du fichier devient un paragraphe vide'],
        ['Pastille 3', 'la police est celle du document, pas de la source'],
      ],
    },
  ),
  pageDeTraitementDeTexte(
    {
      screenId: 'B3-03-A1-05-PAGE-NETTOYER',
      titre: 'Page : afficher les marques et nettoyer',
      concepts: ['texte-brut'],
      notes: [
        '2 min ; faire afficher les marques sur chaque poste avant l’exercice : on ne nettoie que ce qu’on voit.',
        'Word annonce le nombre de remplacements : c’est ce nombre qu’on note. Relancé, Remplacer tout doit annoncer 0.',
        'Transition : « Au travail sur la note : exercice 1. »',
      ],
    },
    {
      rang: 2,
      page: pageDuFournil({
        marks: true,
        blocks: [
          moteur.paragraphe([{ text: 'Le four neuf arrive en mars.' }], 1),
          { style: 'empty', runs: [], marker: 2 },
          moteur.paragraphe(
            [
              { text: 'Les ventes' },
              { text: '  ', tone: 'alert' },
              { text: 'de brioches doublent.' },
            ],
            3,
          ),
        ],
      }),
      pageAlt:
        'Une page Word, marques affichées : un paragraphe vide à retirer, et deux espaces surlignées entre deux mots.',
      syntaxe:
        'Accueil › ¶ affiche les marques ; Ctrl + H : Rechercher ^p^p, Remplacer par ^p, Remplacer tout ; puis deux espaces par une.',
      piege:
        'remplacer ^p par rien : tous les paragraphes se collent en un seul.',
      exemple:
        'sur le rapport inventé du Fournil du Port, Word annonce 12 remplacements, puis 0 au second passage.',
      correspondances: [
        ['Pastille 1', 'la marque ¶ termine chaque paragraphe'],
        ['Pastille 2', '^p^p, deux marques de suite, devient ^p'],
        ['Pastille 3', 'deux espaces deviennent une'],
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-03-A1-06-ATELIER-NETTOYAGE',
      titre: 'Exercice 1 — Importer et nettoyer la note',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 12,
      concepts: ['texte-brut'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 11),
        'Réflexion : faire relire les quatre étapes avant de commencer ; passer dans les rangs dès l’étape 2.',
        'Pièges : chercher ^p seul ; remplacer les espaces avant les paragraphes vides ; noter le second passage, qui annonce 0.',
      ),
      proprietes: {
        intitule: 'Exercice 1 — Importer et nettoyer la note',
        consigne:
          'Étape 1 : dans un document Word vierge, Insertion › Objet › Texte d’un fichier, choisissez la note brute ; enregistrez le document sous le nom Note_comite.docx. Étape 2 : Accueil › ¶ pour afficher les marques. Étape 3 : Ctrl + H, Rechercher ^p^p, Remplacer par ^p, Remplacer tout ; notez le nombre de remplacements annoncé. Étape 4 : Rechercher deux espaces, Remplacer par une espace, Remplacer tout ; notez le nombre annoncé. Relancez chaque remplacement : Word doit annoncer 0.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffreeB303(
            'b3-03-a1-paragraphes-vides',
            'texte-brut',
            'Étape 3 : combien de remplacements Word annonce-t-il ?',
            'remplacements',
          ),
          questionChiffreeB303(
            'b3-03-a1-doubles-espaces',
            'texte-brut',
            'Étape 4 : combien de remplacements Word annonce-t-il ?',
            'remplacements',
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Règles 1 et 2, dites à la correction : « J’importe le texte seul, puis je le mets en forme dans Word » ; « Je travaille marques affichées : jamais de ligne vide ni d’espace pour espacer ou aligner. »',
        'Transition : « La note est propre ; faisons-en des titres : un vote. »',
      ],
    },
    [
      [
        'b3-03-a1-paragraphes-vides',
        `La note compte ${VALEURS_B3_03['b3-03-a1-paragraphes-vides'] + 1} lignes, chacune séparée de la suivante par une ligne vide : ^p^p → ^p fait ${VALEURS_B3_03['b3-03-a1-paragraphes-vides']} remplacements. Chercher ^p seul trouve toutes les marques, une par ligne du fichier ; le remplacer par rien colle la note en un seul paragraphe.`,
      ],
      [
        'b3-03-a1-doubles-espaces',
        `Deux espaces → une espace : ${VALEURS_B3_03['b3-03-a1-doubles-espaces']} remplacements, chacun une double espace tapée après un point. Chercher une seule espace les remplace toutes : ${PIEGES_B3_03['b3-03-a1-doubles-espaces']['recherche-mal-saisie']} remplacements, et rien ne change.`,
      ],
    ],
  ),
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-03-A1-07-VOTE-TITRE',
      titre: 'Vote : faire un titre',
      dureeMinutes: 2,
      concepts: ['styles-et-theme'],
      notes: moteur.puces(
        'Temps « réfléchir » des styles : vote non noté, 1 min de vote et 1 min de révélation.',
        'Révélation : ouvrir le volet de navigation ; le titre mis en gras à la main n’y figure pas.',
      ),
    },
    [
      moteur.vote(
        'b3-03-a1-titre',
        'styles-et-theme',
        false,
        'La ligne « 1. CONTEXTE ET DONNÉES » doit devenir un titre de partie. Que faites-vous ?',
        'Je lui applique le style Titre 1',
        [
          [
            'Je la mets en gras, en 16 points, à la main',
            'mise-en-forme-directe-au-lieu-du-style',
          ],
        ],
      ),
    ],
  ),
  pageDeTraitementDeTexte(
    {
      screenId: 'B3-03-A1-08-PAGE-CARACTERES',
      titre: 'Page : mettre en forme les caractères',
      concepts: ['mise-en-forme-des-caracteres'],
      notes: [
        '2 min, enchaînées sur les deux pages suivantes : 6 min d’exposition au plus.',
        'Sur Mac : ⌘ + B, ⌘ + I, ⌘ + U. Reproduire la mise en forme (le pinceau) recopie celle d’un mot sur un autre.',
      ],
    },
    {
      rang: 3,
      page: pageDuFournil({
        blocks: [
          moteur.paragraphe(
            [
              { text: 'Les ventes de brioches battent un ' },
              { text: 'record', bold: true },
              { text: ' en avril.' },
            ],
            1,
          ),
          moteur.paragraphe(
            [
              { text: 'La farine vient du ' },
              { text: 'Moulin de Kerlann', italic: true },
              { text: ', livrée le ' },
              { text: '3 mai', underline: true },
              { text: '.' },
            ],
            2,
          ),
          moteur.paragraphe(
            [
              { text: 'Le four neuf réduit la cuisson de ' },
              { text: 'dix minutes', tone: 'accent' },
              { text: '.' },
            ],
            3,
          ),
        ],
      }),
      pageAlt:
        'Une page Word : un mot en gras, un nom en italique, une date soulignée, deux mots en couleur.',
      syntaxe:
        'Accueil › Police : police, taille, Gras Ctrl + G, Italique Ctrl + I, Souligné Ctrl + U, couleur ; Maj + F3 change la casse ; Ctrl + Espace retire la mise en forme directe.',
      piege:
        'créer un style pour un seul mot : une mise en forme directe suffit.',
      exemple:
        'dans le rapport inventé, « record » en gras, le nom du moulin en italique.',
      correspondances: [
        ['Pastille 1', 'le gras marque un mot, à la main'],
        ['Pastille 2', 'italique et souligné, sur le mot seul'],
        ['Pastille 3', 'la couleur, prise dans le thème'],
      ],
    },
  ),
  pageDeTraitementDeTexte(
    {
      screenId: 'B3-03-A1-09-PAGE-STYLES',
      titre: 'Page : appliquer et modifier un style',
      concepts: ['styles-et-theme'],
      notes: [
        '2 min ; ouvrir le volet de navigation (Affichage › Volet de navigation) : chaque titre stylé y apparaît, à son niveau.',
        'Modifier un style change tous les paragraphes qui le portent, d’un geste.',
      ],
    },
    {
      rang: 4,
      page: pageDuFournil({
        blocks: [
          {
            style: 'title',
            runs: [{ text: 'Rapport d’activité 2026' }],
            marker: 1,
          },
          {
            style: 'subtitle',
            runs: [{ text: 'Bilan et projets du fournil' }],
          },
          {
            style: 'heading1',
            runs: [{ text: '1. Bilan de l’année' }],
            marker: 2,
          },
          {
            style: 'heading2',
            runs: [{ text: '1.1 Le pain' }],
            marker: 3,
          },
          moteur.paragraphe([
            { text: 'Les ventes de pain progressent au printemps.' },
          ]),
        ],
      }),
      pageAlt:
        'Une page Word : un titre de document, son sous-titre, un titre de niveau 1, un titre de niveau 2, puis un paragraphe Normal.',
      syntaxe:
        'Accueil › Styles : Titre, Sous-titre, Titre 1, Titre 2, Normal ; clic droit sur un style › Modifier ; Affichage › Volet de navigation.',
      piege:
        'un titre mis en gras à la main : absent du volet de navigation et des signets du PDF.',
      exemple:
        '« 1. Bilan de l’année » en Titre 1, « 1.1 Le pain » en Titre 2, dans le rapport inventé.',
      correspondances: [
        ['Pastille 1', 'le style Titre, une fois par document'],
        ['Pastille 2', 'Titre 1 pour chaque partie'],
        ['Pastille 3', 'Titre 2 pour chaque sous-partie'],
      ],
    },
  ),
  pageDeTraitementDeTexte(
    {
      screenId: 'B3-03-A1-10-PAGE-THEME',
      titre: 'Page : changer de thème',
      concepts: ['styles-et-theme'],
      notes: [
        '2 min ; changer de thème en direct sur un document stylé : titres, couleurs et polices changent ensemble.',
        'Transition : « Voyons-le pas à pas sur un titre de la note. »',
      ],
    },
    {
      rang: 5,
      page: pageDuFournil({
        blocks: [
          {
            style: 'title',
            runs: [{ text: 'Rapport d’activité 2026', tone: 'accent' }],
            marker: 1,
          },
          {
            style: 'heading1',
            runs: [{ text: '2. Les projets', tone: 'accent' }],
            marker: 2,
          },
          moteur.paragraphe(
            [{ text: 'Ouvrir un second fournil à Lorient.' }],
            3,
          ),
        ],
      }),
      pageAlt:
        'Une page Word aux couleurs d’un thème : le titre et le titre de niveau 1 prennent la couleur d’accent.',
      syntaxe:
        'Création › Thèmes, puis Couleurs, Polices et Jeu de styles : tout le document suit.',
      piege:
        'une couleur ou une police choisie hors du thème ne suit pas le changement.',
      exemple:
        'thème Rétrospective : les titres du rapport inventé changent ensemble de couleur et de police.',
      correspondances: [
        ['Pastille 1', 'les couleurs du thème'],
        ['Pastille 2', 'la police des titres, celle du thème'],
        ['Pastille 3', 'le jeu de styles, pour le corps'],
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B3-03-A1-11-EXEMPLE-STYLE',
      titre: 'Exemple guidé : un titre, du brut au style',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 3,
      concepts: ['styles-et-theme'],
      notes: moteur.puces(
        moteur.REPONSES_SOUS_CHAQUE_ETAPE,
        'Chacun le fait dans sa note : ce titre est le premier de l’exercice 2.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b3-03-a1-exemple-style',
          enonce:
            'Dans votre note nettoyée, faites de la ligne « 1. CONTEXTE ET DONNÉES » un titre de partie, puis réglez l’allure de tous les titres de partie d’un seul geste.',
          rappel: [
            {
              libelle: 'Maj + F3',
              valeur:
                'fait passer le texte sélectionné de MAJUSCULES à minuscules, puis à Première lettre en majuscule.',
            },
            {
              libelle: 'Accueil › Styles',
              valeur:
                'applique un style au paragraphe où se trouve le curseur.',
            },
            {
              libelle: 'Clic droit sur un style › Modifier',
              valeur:
                'change l’allure de tous les paragraphes qui portent ce style.',
            },
          ],
          etapes: [
            {
              id: 'casse',
              intitule: 'La casse',
              raisonnement:
                'Sélectionnez « CONTEXTE ET DONNÉES », puis Maj + F3 jusqu’à « Contexte et données » : un titre en capitales se lit mal, et le style ne change pas la casse tapée.',
              invite: 'Quel raccourci change la casse sans retaper ?',
            },
            {
              id: 'style',
              intitule: 'Le style',
              raisonnement:
                'Curseur dans la ligne, Accueil › Styles › Titre 1 : la ligne apparaît dans le volet de navigation.',
              invite: 'Quel style pour une partie de la note ?',
            },
            {
              id: 'modifier',
              intitule: 'Le style modifié',
              raisonnement:
                'Clic droit sur Titre 1 › Modifier : 14 points, espacement de 12 points avant. Tous les titres de partie suivront, ceux qu’on stylera ensuite compris.',
              invite: 'Comment changer d’un geste tous les titres de partie ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 1,
      notes: [
        'Ouvrir le volet de navigation sur un poste : le premier titre y est.',
        'Transition : « À vous, toute la note : exercice 2. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-03-A1-12-ATELIER-STYLES',
      titre: 'Exercice 2 — Les styles de la note',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 13,
      concepts: ['styles-et-theme'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 12),
        'Réflexion : faire repérer dans la note les deux formes de numéro, « 1. » et « 1.1 », avant de styler.',
        'Pièges : tout en Titre 1 ; oublier l’annexe ; styler la ligne « De : … » en titre.',
      ),
      proprietes: {
        intitule: 'Exercice 2 — Les styles de la note',
        consigne:
          'Dans Note_comite.docx. Étape 1 : la première ligne en style Titre, la deuxième en Sous-titre. Étape 2 : chaque ligne qui commence par un numéro suivi d’un point et d’une espace, comme « 1. », en Titre 1, l’annexe comprise ; Maj + F3 pour retirer les capitales. Étape 3 : chaque ligne numérotée « 1.1 », « 2.3 »…, en Titre 2. Étape 4 : Création › Thèmes, choisissez un thème. Étape 5 : Affichage › Volet de navigation, comptez les titres de chaque niveau.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          questionChiffreeB303(
            'b3-03-a1-titres-1',
            'styles-et-theme',
            'Étape 5 : combien de titres de niveau 1 le volet de navigation montre-t-il ?',
            'titres',
          ),
          questionChiffreeB303(
            'b3-03-a1-titres-2',
            'styles-et-theme',
            'Étape 5 : combien de titres de niveau 2 le volet de navigation montre-t-il ?',
            'titres',
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        moteur.CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
        'Règle 3, dite à la correction : « Un titre reçoit un style, jamais une mise en forme à la main. »',
        'Transition : « À la main, par un style ou par le thème ? Un tri. »',
      ],
    },
    [
      [
        'b3-03-a1-titres-1',
        `${VALEURS_B3_03['b3-03-a1-titres-1']} titres de niveau 1 : chaque partie numérotée « 1. », « 2. »…, l’annexe comprise. Tout mettre en Titre 1 en donne ${PIEGES_B3_03['b3-03-a1-titres-1']['niveaux-de-titre-confondus']}.`,
      ],
      [
        'b3-03-a1-titres-2',
        `${VALEURS_B3_03['b3-03-a1-titres-2']} titres de niveau 2, numérotés « 1.1 », « 2.3 »… Un volet sans niveau 2 signale des sous-parties stylées en Titre 1.`,
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-03-A1-13-TRI-MISE-EN-FORME',
      titre: 'Exercice 3 — À la main, par un style ou par le thème ?',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 8,
      concepts: ['mise-en-forme-des-caracteres', 'styles-et-theme'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 7),
        'Réflexion : pour chaque carte, une question : combien de passages ce geste doit-il changer ?',
      ),
      proprietes: {
        modalite: 'binome',
        ...moteur.classement(
          {
            id: 'b3-03-a1-tri-mise-en-forme',
            intitule:
              'Rangez chaque geste selon la façon de le faire : à la main sur le passage, par un style, ou par le thème du document.',
          },
          'styles-et-theme',
          [
            ['directe', 'À la main, sur le passage'],
            ['style', 'Par un style'],
            ['theme', 'Par le thème'],
          ],
          [
            {
              id: 'mot-en-gras',
              libelle: 'Mettre en gras un mot dans une phrase',
              categorie: 'directe',
              confusions: DIRECTE,
              justification: 'un seul passage : la mise en forme directe',
            },
            {
              id: 'nom-en-italique',
              libelle: 'Mettre en italique le nom d’un fournisseur',
              categorie: 'directe',
              confusions: DIRECTE,
              justification: 'un mot isolé : la mise en forme directe',
            },
            {
              id: 'date-soulignee',
              libelle: 'Souligner une date limite dans un paragraphe',
              categorie: 'directe',
              confusions: DIRECTE,
              justification: 'un passage, une fois : à la main',
            },
            {
              id: 'parties-navigation',
              libelle: 'Faire de chaque partie un titre du volet de navigation',
              categorie: 'style',
              confusions: PAR_UN_STYLE,
              justification: 'seul un style de titre entre dans le volet',
            },
            {
              id: 'sous-parties-pareilles',
              libelle: 'Donner aux sous-parties la même allure, d’un geste',
              categorie: 'style',
              confusions: PAR_UN_STYLE,
              justification: 'le style Titre 2, modifié une fois',
            },
            {
              id: 'espacement-titres',
              libelle: 'Ajouter 12 points avant chaque titre de partie',
              categorie: 'style',
              confusions: PAR_UN_STYLE,
              justification: 'Titre 1 modifié : tous les titres suivent',
            },
            {
              id: 'couleurs-du-document',
              libelle: 'Changer la couleur de tous les titres et accents',
              categorie: 'theme',
              confusions: PAR_LE_THEME,
              justification: 'Création › Couleurs : tout le document suit',
            },
            {
              id: 'police-de-la-charte',
              libelle: 'Passer tout le document à la police de la charte',
              categorie: 'theme',
              confusions: PAR_LE_THEME,
              justification: 'Création › Polices : titres et corps suivent',
            },
            {
              id: 'autre-marque',
              libelle:
                'Habiller tout le document aux couleurs d’une autre marque',
              categorie: 'theme',
              confusions: PAR_LE_THEME,
              justification: 'un autre thème, d’un clic',
            },
          ],
        ),
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger case par case : demander combien de passages chaque geste change.',
        'Règle 4, dite à la correction : « La police et les couleurs viennent du thème. »',
        moteur.PAUSE_HORS_DUREE,
      ],
    },
    [
      [
        'directe',
        'Un mot, un nom, une date : un seul passage, une mise en forme directe suffit. Un style pour un mot isolé encombre la liste des styles.',
      ],
      [
        'style',
        'Tout ce qui se répète sur chaque titre ou chaque sous-partie passe par un style : on le modifie une fois, tous suivent, et les titres entrent dans le volet de navigation.',
      ],
      [
        'theme',
        'Couleurs et polices de tout le document : le thème. Choisies à la main, elles ne suivent plus quand le thème change.',
      ],
    ],
  ),
];
