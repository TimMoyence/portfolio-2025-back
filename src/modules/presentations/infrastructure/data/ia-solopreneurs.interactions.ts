import { SlideInteractions } from '../../domain/SlideInteraction';

/**
 * Interactions de la présentation « IA pour Solopreneurs ».
 *
 * Map slideId → SlideInteractions.
 * - `present` : interactions visibles en mode présentation (présentateur clique)
 * - `scroll` : interactions visibles en mode scroll (lecteur interagit seul)
 */
export const IA_SOLOPRENEURS_INTERACTIONS: Record<string, SlideInteractions> = {
  // ── BLOC 1 — ACCROCHER ──

  accroche: {
    present: [
      {
        type: 'poll',
        question: "Qui utilise déjà l'IA au quotidien ?",
        options: ['ChatGPT', 'Claude', 'Gemini', 'Autre IA', 'Aucune'],
      },
    ],
    scroll: [
      {
        type: 'reflection',
        question:
          'Quels outils IA utilisez-vous au quotidien ? Pour quelles tâches ?',
        placeholder: 'ex: ChatGPT pour mes emails, Canva pour mes visuels...',
      },
    ],
  },

  probleme: {
    present: [
      {
        type: 'poll',
        question:
          'Combien de temps passez-vous sur des tâches automatisables ?',
        options: ['< 1h/jour', '1-3h/jour', '3h+/jour', 'Aucune idée'],
      },
    ],
    scroll: [
      {
        type: 'self-rating',
        question:
          'Quel pourcentage de votre travail pourrait être automatisé ?',
        min: 1,
        max: 5,
        labels: { min: 'Presque rien', max: 'Presque tout' },
      },
    ],
  },

  'contexte-marche': {
    scroll: [
      {
        type: 'reflection',
        question:
          'Ces chiffres vous surprennent ? Quel impact sur votre secteur ?',
        placeholder: 'Décrivez ce que vous observez dans votre domaine...',
      },
    ],
  },

  // ── BLOC 2 — MONTRER ──

  'culture-apprendre': {
    present: [
      {
        type: 'poll',
        question: 'Lequel testeriez-vous en premier ?',
        options: ['NotebookLM', 'Perplexity', 'Fathom'],
      },
    ],
    scroll: [
      {
        type: 'checklist',
        question: 'Lesquels utilisez-vous déjà ?',
        items: ['NotebookLM', 'Perplexity', 'Fathom', 'Aucun des trois'],
      },
    ],
  },

  'chat-produire': {
    scroll: [
      {
        type: 'checklist',
        question: 'Lesquels utilisez-vous déjà ?',
        items: ['ChatGPT', 'Claude', 'Gemini', 'Aucun des trois'],
      },
      {
        type: 'reflection',
        question:
          'Pour quelle tâche quotidienne aimeriez-vous tester un de ces outils ?',
        placeholder:
          'ex: rédiger mes emails clients, résumer des articles, analyser des données...',
      },
    ],
  },

  creer: {
    present: [
      {
        type: 'poll',
        question: 'Quel contenu créez-vous le plus ?',
        options: ['Images', 'Présentations', 'Audio/Vidéo', 'Texte'],
      },
    ],
    scroll: [
      {
        type: 'checklist',
        question: 'Lesquels connaissez-vous ?',
        items: [
          'Ideogram',
          'Gamma',
          'ElevenLabs',
          'Midjourney',
          'DALL-E',
          'Aucun',
        ],
      },
    ],
  },

  automatiser: {
    present: [
      {
        type: 'poll',
        question: "Quel est votre niveau d'automatisation actuel ?",
        options: [
          'Tout à la main',
          'Quelques apps connectées',
          'Workflows automatisés',
        ],
      },
    ],
    scroll: [
      {
        type: 'reflection',
        question:
          'Quelle tâche répétitive vous prend le plus de temps chaque semaine ?',
        placeholder:
          'ex: relancer des prospects, poster sur les réseaux, trier mes emails...',
      },
    ],
  },

  'site-web': {
    scroll: [
      {
        type: 'reflection',
        question:
          'Avez-vous un site web ? Si oui, combien de temps a pris sa création ?',
        placeholder:
          'ex: oui, 3 mois avec une agence / non, trop cher / oui, WordPress en galère...',
      },
    ],
  },

  clients: {
    present: [
      {
        type: 'poll',
        question: 'Quel est votre plus gros défi client ?',
        options: [
          'Trouver des prospects',
          'Convertir',
          'Fidéliser',
          'Communiquer',
        ],
      },
    ],
    scroll: [
      {
        type: 'checklist',
        question: 'Lesquels utilisez-vous ?',
        items: [
          'Waalaxy',
          'Notion AI',
          'Brevo',
          'Canva AI',
          'Aucun des quatre',
        ],
      },
    ],
  },

  'stack-budget': {
    present: [
      {
        type: 'poll',
        question: 'Combien dépensez-vous actuellement en outils IA ?',
        options: ['0€', '< 30€/mois', '30-100€/mois', '100€+/mois'],
      },
    ],
    scroll: [
      {
        type: 'self-rating',
        question: "Où en êtes-vous dans votre adoption de l'IA ?",
        min: 1,
        max: 5,
        labels: { min: 'Je débute', max: 'Stack complet en place' },
      },
    ],
  },

  'outils-detail': {
    scroll: [
      {
        type: 'checklist',
        question: 'Cochez les outils que vous connaissez déjà :',
        items: [
          'NotebookLM',
          'Perplexity',
          'Fathom',
          'ChatGPT',
          'Claude',
          'Gemini',
          'Ideogram',
          'Gamma',
          'ElevenLabs',
          'Zapier',
          'Make.com',
          'n8n',
          'Waalaxy',
          'Notion AI',
          'Brevo',
          'Canva AI',
        ],
      },
    ],
  },

  'workflows-detail': {
    scroll: [
      {
        type: 'reflection',
        question:
          'Lequel de ces 3 workflows mettriez-vous en place en premier ? Pourquoi ?',
        placeholder: 'ex: la prospection automatisée, parce que...',
      },
    ],
  },

  // ── BLOC 3 — PRATIQUER ──

  'transition-pratique': {
    present: [
      {
        type: 'countdown',
        label: "Pensez à votre secteur d'activité...",
        durationSeconds: 10,
      },
    ],
  },

  'recap-8020': {
    present: [
      {
        type: 'poll',
        question: 'Quel outil allez-vous tester en premier ?',
        options: [
          'ChatGPT/Claude',
          'Gamma',
          'Zapier/Make',
          'NotebookLM',
          'Autre',
        ],
      },
    ],
    scroll: [
      {
        type: 'self-rating',
        question:
          "Après cette présentation, quel est votre niveau de confiance avec l'IA ?",
        min: 1,
        max: 5,
        labels: { min: 'Pas confiant', max: 'Prêt à foncer' },
      },
    ],
  },

  // ── BLOC 4 — ANCRER ──

  pieges: {
    scroll: [
      {
        type: 'reflection',
        question:
          "Avez-vous déjà été confronté à un de ces pièges ? Lequel, et comment l'avez-vous géré ?",
        placeholder:
          "ex: une hallucination de ChatGPT qui m'a fait envoyer un chiffre faux...",
        rows: 4,
      },
    ],
  },
};
