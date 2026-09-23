const IMAGE = 'https://images.example.test/deck/illustration.jpeg';

const ELEMENT = {
  title: 'Unité',
  description: 'Lire l’unité avant le nombre.',
};

export function buildQuizAffiche(
  overrides: Readonly<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: 'quiz-1',
    type: 'quiz',
    question: 'Que vérifier avant de comparer deux courbes ?',
    options: ['Les unités et l’échelle', 'La couleur', 'La taille du titre'],
    ...overrides,
  };
}

const IMAGE_ET_TEXTE = {
  title: 'La pièce probante',
  image: IMAGE,
  imageAlt: 'Registre comptable ouvert',
  paragraphs: ['Un total concordant ne prouve pas chaque ligne.'],
};

export const PRESENTATIONS_VISUELLES_VALIDES: Readonly<
  Record<string, Readonly<Record<string, unknown>>>
> = {
  hero: { title: 'Lire un chiffre', bullets: ['BTS CG · deuxième année'] },
  'method-path': {
    title: 'De la donnée à la décision',
    steps: [
      {
        id: 'lire',
        title: 'Lire',
        question: 'Qu’est-ce qui est mesuré ?',
        proof: 'Unité, période, périmètre.',
        result: 'Un chiffre défendable.',
      },
    ],
  },
  quiz: { questionData: buildQuizAffiche() },
  chart: {
    title: 'Chiffre d’affaires',
    labels: ['2024', '2025'],
    series: [{ label: 'CA', values: [120, 138] }],
  },
  grid: { title: 'Les quatre contrôles', items: [ELEMENT] },
  comparison: {
    title: 'Écart ou taux',
    columns: [{ label: 'Écart', items: ['En euros'] }],
  },
  stats: { title: 'Repères', stats: [{ value: '27,6 %', label: 'Taux' }] },
  reflection: {
    promptData: {
      id: 'reflexion-1',
      type: 'reflection',
      question: 'Que faut-il demander avant de comparer ?',
    },
  },
  quote: { quote: 'Un chiffre sans unité ne dit rien.' },
  table: {
    title: 'Rapprochement',
    columns: [{ key: 'ligne', label: 'Ligne' }],
    rows: [{ ligne: 'F004' }],
  },
  'image-left': IMAGE_ET_TEXTE,
  'image-right': IMAGE_ET_TEXTE,
  cta: {
    title: 'Pour aller plus loin',
    description: 'La boîte à outils du contrôle.',
    ctaLabel: 'Ouvrir',
    ctaHref: '/formations/ia-solopreneurs/toolkit',
  },
  guide: { title: 'Méthode', items: [ELEMENT] },
  'sort-review': {
    title: 'Correction du tri',
    source: { screenId: 'B2-01-A1-05-ANATOMIE', sortId: 'b2-01-a1-anatomie' },
    categories: [
      { id: 'valeur', label: 'Valeur en euros' },
      { id: 'ambigu', label: 'Ambigu en l’état' },
    ],
    cards: [
      {
        id: 'ca-2025',
        label: 'CA HT 2025 : 1 150 000 €',
        category: 'valeur',
        justification: 'montant en euros : « combien ? »',
      },
      {
        id: 'inflation',
        label: 'Inflation : « 4,9 »',
        category: 'ambigu',
        justification: 'ni unité, ni période, ni source',
      },
    ],
  },
};
