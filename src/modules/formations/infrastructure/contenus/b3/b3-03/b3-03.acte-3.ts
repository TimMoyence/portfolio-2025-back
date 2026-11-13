import {
  enEuros,
  nombreFrancais,
} from '../../../../../../common/domain/nombres/ecriture-francaise';
import { HISTOIRES_B3_01, VALEURS_B3_01 } from '../b3-01/b3-01.donnees';

import { COLLER_LE_TEXTE_SEUL } from './b3-03.briques';
import { pourcent } from './b3-03.donnees';
import * as moteur from '../../briques';

const RETENUE_A_TORT = {
  chiffre: 'texte-d-ia-rejete-sans-relecture',
  invente: 'texte-d-ia-rejete-sans-relecture',
  sens: 'texte-d-ia-rejete-sans-relecture',
} as const;

const REPRIS = 'texte-d-ia-repris-sans-relecture';
const MAL_NOMME = 'ecart-d-ia-mal-nomme';
const CHIFFRE_CHANGE = {
  juste: REPRIS,
  invente: MAL_NOMME,
  sens: MAL_NOMME,
} as const;
const FAIT_INVENTE = {
  juste: REPRIS,
  chiffre: MAL_NOMME,
  sens: MAL_NOMME,
} as const;
const SENS_INVERSE = {
  juste: REPRIS,
  chiffre: MAL_NOMME,
  invente: MAL_NOMME,
} as const;

const AUDIT: moteur.Acte = [
  moteur.voteQuiOuvre(
    {
      screenId: 'B3-03-A3-01-VOTE-IA',
      titre: 'Vote : la synthèse réécrite',
      dureeMinutes: 3,
      concepts: ['ia-redactrice'],
      notes: moteur.puces(
        'Temps « réfléchir » de l’IA : vote non noté, 2 min de vote et 1 min de révélation.',
        'Révélation : ni la coller, ni la jeter ; la relire phrase par phrase contre la note.',
      ),
    },
    [
      moteur.vote(
        'b3-03-a3-synthese',
        'ia-redactrice',
        false,
        `La partie 2 de la note revient réécrite par une IA : le style est plus fluide, mais la hausse de ${pourcent(VALEURS_B3_01['b3-01-a3-evolution'])} y est devenue une baisse. Que faites-vous ?`,
        'Je relis chaque phrase contre la note et je corrige',
        [
          [
            'Je la colle telle quelle : elle est mieux écrite',
            'texte-d-ia-repris-sans-relecture',
          ],
          [
            'Je jette tout : une IA invente toujours',
            'texte-d-ia-rejete-sans-relecture',
          ],
        ],
      ),
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B3-03-A3-02-COURS-IA-REDACTRICE',
      titre: 'Cours : une IA qui rédige',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['ia-redactrice'],
      notes: moteur.puces(
        '3 min, enchaînées sur la page suivante : 6 min d’exposition au plus.',
        'Chacun utilise l’IA conversationnelle de son choix ; sans compte, on travaille en binôme.',
      ),
    },
    'lesson',
    {
      title: 'Une IA qui rédige',
      subtitle: 'L’IA rédactrice · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Ce qu’elle fait, ce qu’elle ignore',
          text: 'Une IA conversationnelle réécrit, résume, change le ton d’un texte en quelques secondes. Elle écrit avec la même assurance une phrase juste et une phrase fausse : elle peut changer un chiffre, inventer une cause, inverser un sens.',
        },
        {
          kind: 'method',
          title: 'La consigne de réécriture en cinq parties',
          text: 'Une consigne précise vaut mieux qu’une longue conversation.',
          steps: [
            'Rôle : « Tu es assistant de direction. »',
            'Lecteur : à qui s’adresse le texte, ce qu’il sait déjà.',
            'Texte : collé tel quel, entre guillemets.',
            'Contraintes : ne change aucun chiffre, n’ajoute aucun fait, garde chaque titre.',
            'Format : texte brut, sans gras ni puces, même longueur.',
          ],
        },
        {
          kind: 'example',
          title: 'Une consigne courte, hors dossier',
          text: '« Tu es assistant de direction d’une boulangerie. Réécris ce paragraphe pour le conseil d’administration, sur un ton sobre. Ne change aucun chiffre, n’ajoute aucun fait. Réponds en texte brut, sans mise en forme. » Exemple inventé.',
        },
        {
          kind: 'property',
          title: 'Un texte d’IA n’est juste que relu',
          text: 'On relit chaque phrase contre la source avant de la garder. On ne lui confie que des textes qu’on a le droit de confier : la note de Norvane est fictive.',
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B3-03-A3-03-COURS-RELIRE',
      titre: 'Cours : relire, puis mettre en page',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['ia-redactrice', 'texte-brut'],
      notes: moteur.puces(
        '3 min ; les trois contrôles servent à l’exercice 8.',
        'Transition : « Une réécriture à relire : exercice 8. »',
      ),
    },
    'lesson',
    {
      title: 'Relire, puis mettre en page',
      subtitle: 'L’IA rédactrice · page 2 sur 2',
      blocks: [
        {
          kind: 'method',
          title: 'Trois contrôles',
          text: 'Phrase par phrase, contre la source.',
          steps: [
            'Les chiffres : chacun est-il celui de la source, sur la même période ?',
            'Les faits : chaque cause, chaque date, chaque nom est-il dans la source ?',
            'Le sens : une hausse est-elle restée une hausse, une recommandation une recommandation ?',
          ],
        },
        {
          kind: 'method',
          title: 'Le retour dans Word',
          text: 'Le texte d’une IA arrive avec sa propre mise en forme.',
          steps: [
            `Coller le texte seul : ${COLLER_LE_TEXTE_SEUL}.`,
            'Retirer les ** et les # que l’IA met pour le gras et les titres.',
            'Réappliquer les styles : Titre 1, Titre 2, Normal, puces.',
          ],
        },
        {
          kind: 'property',
          title: 'Nommer l’écart',
          text: 'Un chiffre changé se corrige par la source ; un fait inventé se supprime ; un sens inversé se réécrit. Dire « c’est faux » ne suffit pas à corriger.',
        },
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-03-A3-04-AUDIT-TEXTE-IA',
      titre: 'Exercice 8 — Relire le texte d’une IA',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 9,
      concepts: ['ia-redactrice'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(2, 7),
        'Réflexion : faire ouvrir la note nettoyée à côté ; chaque phrase se compare à elle.',
        'La réécriture est écrite pour ce cours : le dire.',
      ),
      proprietes: {
        modalite: 'binome',
        ...moteur.classement(
          {
            id: 'b3-03-a3-audit',
            intitule:
              'Huit phrases d’une réécriture de la note par une IA, écrite pour ce cours. Comparez chacune à la note et rangez-la.',
          },
          'ia-redactrice',
          [
            ['juste', 'Juste : fidèle à la note'],
            ['chiffre', 'Faux : un chiffre changé'],
            ['invente', 'Faux : un fait inventé'],
            ['sens', 'Faux : le sens inversé'],
          ],
          [
            {
              id: 'ca-2026',
              libelle: `De janvier à septembre 2026, le réseau réalise ${enEuros(VALEURS_B3_01['b3-01-a3-ca-2026'])} de chiffre d’affaires HT.`,
              categorie: 'juste',
              confusions: RETENUE_A_TORT,
              justification: 'le chiffre de la partie 2.1',
            },
            {
              id: 'retards',
              libelle: `En 2026, ${nombreFrancais(VALEURS_B3_01['b3-01-a2-retards'], 0)} lignes de commande sont livrées après leur date promise.`,
              categorie: 'juste',
              confusions: RETENUE_A_TORT,
              justification: 'le chiffre de la partie 3.2',
            },
            {
              id: 'marque-marseille',
              libelle: `Marseille dégage un taux de marque de ${pourcent(HISTOIRES_B3_01['taux-de-marge-marseille-2025'])} en 2026.`,
              categorie: 'chiffre',
              confusions: CHIFFRE_CHANGE,
              justification: 'le taux de 2025, donné pour 2026',
            },
            {
              id: 'delai-strasbourg',
              libelle: `À Strasbourg, le délai médian de livraison est de ${nombreFrancais(HISTOIRES_B3_01['delai-median-reseau-2026'], 0)} jours ouvrés en 2026.`,
              categorie: 'chiffre',
              confusions: CHIFFRE_CHANGE,
              justification: 'le délai du réseau, donné pour Strasbourg',
            },
            {
              id: 'plan-rennes',
              libelle:
                'Le comité a validé en juin un plan de relance pour Rennes.',
              categorie: 'invente',
              confusions: FAIT_INVENTE,
              justification: 'la note ne parle d’aucun plan validé',
            },
            {
              id: 'magasin-lille',
              libelle:
                'Lille doit sa hausse à l’ouverture d’un second magasin.',
              categorie: 'invente',
              confusions: FAIT_INVENTE,
              justification:
                'la note ne donne aucune cause à la hausse de Lille',
            },
            {
              id: 'baisse-reseau',
              libelle: `Le chiffre d’affaires du réseau baisse de ${pourcent(VALEURS_B3_01['b3-01-a3-evolution'])} sur les mêmes mois de 2025.`,
              categorie: 'sens',
              confusions: SENS_INVERSE,
              justification: 'une hausse devenue une baisse',
            },
            {
              id: 'informatique-rennes',
              libelle: `À Rennes, l’informatique progresse de ${pourcent(HISTOIRES_B3_01['evolution-informatique-rennes'])}.`,
              categorie: 'sens',
              confusions: SENS_INVERSE,
              justification: 'un recul devenu une progression',
            },
          ],
        ),
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger case par case ; demander à chaque fois quelle ligne de la note tranche.',
        'Transition : « À vous d’écrire la consigne qui évite ces écarts : exercice 9. »',
      ],
    },
    [
      [
        'juste',
        'Le chiffre d’affaires de 2026 et les lignes livrées en retard sont ceux de la note : comparées, ces phrases se gardent. Les rejeter sans comparer, c’est perdre un texte juste.',
      ],
      [
        'chiffre',
        `Le taux de marque de Marseille en 2026 est ${pourcent(VALEURS_B3_01['b3-01-a3-marge-marseille'])}, pas celui de 2025 ; le délai médian de Strasbourg en 2026 est ${nombreFrancais(VALEURS_B3_01['b3-01-a2-delai-strasbourg'], 0)} jours ouvrés, pas celui du réseau. Un chiffre changé se corrige par la source.`,
      ],
      [
        'invente',
        'Aucun plan validé, aucun second magasin dans la note : un fait inventé se supprime.',
      ],
      [
        'sens',
        'Le réseau progresse, l’informatique de Rennes recule : le sens inversé se réécrit, le chiffre seul ne suffit pas.',
      ],
    ],
  ),
];

const FAIRE_FAIRE: moteur.Acte = [
  moteur.defiDeConsigne({
    screenId: 'B3-03-A3-05-DEFI-CONSIGNE',
    titre: 'Exercice 9 — Votre consigne de réécriture',
    aRelire: 'la consigne en cinq parties et les trois contrôles',
    probleme: {
      id: 'b3-03-a3-consigne',
      enonce:
        'Vous allez confier la partie 2 de votre note à une IA, pour qu’elle la réécrive à l’intention du comité. Écrivez la consigne que vous lui donnerez.',
      invite:
        'En cinq parties : le rôle, le lecteur, le texte, les contraintes, le format de la réponse.',
    },
    strategies: [
      moteur.strategie(
        'lecteur',
        'Lecteur : « Le comité de direction, qui connaît le réseau et lit vite. »',
      ),
      moteur.strategie(
        'texte',
        'Texte : la partie 2 de la note, collée telle quelle entre guillemets.',
      ),
      moteur.strategie(
        'contraintes',
        'Contraintes : « Ne change aucun chiffre, n’ajoute aucun fait, garde les trois sous-titres. »',
      ),
      moteur.strategie(
        'format',
        'Format : « Texte brut, sans gras, sans puces, sans titres Markdown, à peu près la même longueur. »',
      ),
      moteur.strategie('ameliorer', '« Améliore ce texte. »', true),
    ],
    pourquoiLaFausse: 'elle ne dit ni lecteur, ni contrainte, ni format.',
    explication:
      'Une bonne consigne tient en cinq parties : rôle, lecteur, texte, contraintes, format. « Améliore ce texte » est la consigne fausse : rien n’interdit à l’IA de changer un chiffre ni d’ajouter un fait, et elle répondra en gras et en puces.',
  }),
  {
    screenId: 'B3-03-A3-06-REECRITURE-IA',
    titre: 'L’IA au travail : réécrire la partie 2',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 18,
    concepts: ['ia-redactrice', 'texte-brut', 'styles-et-theme'],
    notes: moteur.puces(
      '18 min : 3 pour donner le texte et la consigne, 9 pour relire, 6 pour coller et réappliquer les styles.',
      'Sans compte, en binôme sur le poste du voisin ; si aucune IA ne répond, le formateur projette la sienne et la classe dicte la consigne.',
      'Passer dans les rangs : faire montrer, phrase par phrase, la ligne de la note qui la confirme.',
    ),
    proprietes: {
      metier:
        'Assistant de direction — Norvane Équipement (réseau de 12 agences)',
      situation:
        'Nadia trouve la partie 2 de sa note trop sèche pour le comité. Elle vous demande de la faire réécrire par une IA, sans qu’aucun chiffre ne bouge.',
      geste:
        'Donnez la partie 2 et votre consigne à l’IA de votre choix, relisez chaque phrase contre la note, corrigez, puis collez le texte seul à la place de l’ancien et réappliquez les styles.',
      consequence:
        'Un chiffre changé dans une note au comité engage Nadia : c’est vous qui l’avez laissé passer.',
      questionsLibres: [
        {
          id: 'b3-03-a3-reecriture:outil',
          question:
            'Quelle IA avez-vous utilisée, et avec qui si vous étiez en binôme ?',
          placeholder: 'IA : … · binôme : …',
        },
        {
          id: 'b3-03-a3-reecriture:ecarts',
          question:
            'Les écarts trouvés à la relecture : pour chacun, la phrase de l’IA, la ligne de la note, la nature de l’écart.',
          placeholder: 'IA : … · note : … · écart : chiffre, fait ou sens',
        },
        {
          id: 'b3-03-a3-reecriture:garde',
          question:
            'Ce que vous avez gardé de la réécriture, et ce que vous avez remis comme dans la note.',
          placeholder: 'Gardé : … · remis : …',
        },
      ],
    },
  },
  moteur.corrigeSurPlace(
    {
      screenId: 'B3-03-A3-07-RESUME-COMITE',
      titre: 'Exercice 10 — Le résumé en tête de note',
      diffusion: 'seance',
      brique: 'fp-pro',
      dureeMinutes: 10,
      concepts: ['ia-redactrice', 'mise-en-forme-des-paragraphes'],
      notes: moteur.puces(
        moteur.tempsDeLExercice(1, 9),
        'Réflexion : faire relire la partie 4 de la note, ce que disent les données.',
      ),
      proprietes: {
        metier:
          'Assistant de direction — Norvane Équipement (réseau de 12 agences)',
        situation:
          'Le comité lit d’abord le haut de la première page. Nadia veut un résumé de cinq lignes au plus, sous le sous-titre.',
        geste:
          'Demandez à votre IA un résumé de la note en cinq lignes, relisez-le contre la note, corrigez-le, collez-le sous le sous-titre et donnez-lui le style Citation.',
        consequence: 'Un résumé faux est la seule partie que certains liront.',
        questionsLibres: [
          {
            id: 'b3-03-a3-resume:texte',
            question: 'Votre résumé, tel qu’il figure dans la note.',
            placeholder: 'Résumé : …',
          },
          {
            id: 'b3-03-a3-resume:corrections',
            question:
              'Ce que vous avez corrigé dans la proposition de l’IA, et pourquoi.',
            placeholder: 'Corrigé : … · parce que : …',
          },
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Révéler les cinq faits qu’un résumé juste doit porter ; demander qui les a tous.',
        'Transition : « Gardez la fiche mémo de l’IA rédactrice. »',
      ],
    },
    [
      [
        'reseau',
        `Le réseau : ${enEuros(VALEURS_B3_01['b3-01-a3-ca-2026'])} de chiffre d’affaires HT de janvier à septembre 2026, en hausse de ${pourcent(VALEURS_B3_01['b3-01-a3-evolution'])}.`,
      ],
      [
        'rennes',
        `Rennes : ${pourcent(VALEURS_B3_01['b3-01-a3-atteinte-rennes'])} de ses objectifs, le plus bas du réseau, l’informatique en recul de ${pourcent(HISTOIRES_B3_01['evolution-informatique-rennes'])}.`,
      ],
      [
        'marseille',
        `Marseille : un taux de marque de ${pourcent(VALEURS_B3_01['b3-01-a3-marge-marseille'])}, contre ${pourcent(HISTOIRES_B3_01['taux-de-marge-marseille-2025'])} un an plus tôt ; les remises sont à valider par la direction.`,
      ],
      [
        'strasbourg',
        `Strasbourg : un délai médian de ${nombreFrancais(VALEURS_B3_01['b3-01-a2-delai-strasbourg'], 0)} jours ouvrés en 2026 ; transport et stock à traiter.`,
      ],
      [
        'lille',
        `Lille : la croissance, ${pourcent(HISTOIRES_B3_01['evolution-lille'])}.`,
      ],
    ],
  ),
  moteur.ecranV2(
    {
      screenId: 'B3-03-A3-08-FICHE-MEMO',
      titre: 'Fiche mémo : l’IA rédactrice',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['ia-redactrice'],
      notes: moteur.puces(
        '3 min ; la fiche s’imprime et s’agrafe à la fiche récap.',
      ),
    },
    'grid',
    {
      title: 'Fiche mémo : l’IA rédactrice',
      subtitle:
        'Faire écrire une IA, et relire : la consigne, les contrôles, le retour dans Word.',
      imprimable: true,
      items: [
        {
          title: 'La consigne',
          description:
            'Rôle, lecteur, texte collé tel quel, contraintes (aucun chiffre changé, aucun fait ajouté), format texte brut.',
        },
        {
          title: 'Les chiffres',
          description:
            'Chaque chiffre comparé à la source, sur la même période. Un chiffre changé se corrige par la source.',
        },
        {
          title: 'Les faits',
          description:
            'Chaque cause, date ou nom retrouvé dans la source. Un fait inventé se supprime.',
        },
        {
          title: 'Le sens',
          description:
            'Une hausse reste une hausse. Un sens inversé se réécrit.',
        },
        {
          title: 'Le retour dans Word',
          description: `Texte seul par ${COLLER_LE_TEXTE_SEUL}, ** et # retirés, styles réappliqués.`,
        },
        {
          title: 'Ni crue, ni jetée',
          description:
            'Une phrase juste se garde, une phrase fausse se corrige : on relit avant de décider.',
        },
      ],
    },
  ),
];

export const ACTE_3: moteur.Acte = [...AUDIT, ...FAIRE_FAIRE];
