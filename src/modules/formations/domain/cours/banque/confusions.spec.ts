import { CONCEPTS } from './concepts';
import { CONFUSIONS, libelleDeConfusion, libelleLisible } from './confusions';

const CONFUSIONS_AJOUTEES_PAR_LA_V3 = {
  'proportion-confondue-avec-evolution': {
    concept: 'pourcentage',
    libelle:
      'Confondre un pourcentage de proportion (part d’un total) et un pourcentage d’évolution (variation par rapport à une valeur de départ).',
  },
  'points-confondus-avec-pourcentage': {
    concept: 'point-de-pourcentage',
    libelle: 'Exprimer en % l’écart entre deux taux, qui se mesure en points.',
  },
  'population-reference-ignoree': {
    concept: 'proportion',
    libelle:
      'Comparer ou confondre deux proportions calculées sur des populations de référence différentes.',
  },
  'base-inversee': {
    concept: 'proportion',
    libelle:
      'Diviser le total par la partie au lieu de la partie par le total.',
  },
  'sens-de-variation': {
    concept: 'taux-evolution',
    libelle:
      'Oublier le signe d’une variation : une baisse s’écrit avec un signe moins.',
  },
  'coefficient-global-mal-interprete': {
    concept: 'evolutions-successives',
    libelle:
      'Mal traduire un coefficient global en taux (0,99 correspond à une baisse de 1 %).',
  },
  'rythme-confondu-avec-niveau': {
    concept: 'indice-base-100',
    libelle:
      'Confondre désinflation (la hausse des prix ralentit) et déflation (les prix baissent).',
  },
  'indice-lu-comme-taux': {
    concept: 'indice-base-100',
    libelle:
      'Lire un indice comme un taux (112,68 au lieu de +12,68 %) ou l’inverse.',
  },
  'indice-lu-comme-valeur': {
    concept: 'indice-base-100',
    libelle: 'Lire un indice comme un prix ou un montant.',
  },
  'taux-moyen-arithmetique': {
    concept: 'taux-moyen',
    libelle:
      'Diviser un taux global par le nombre de périodes au lieu de prendre une racine n-ième.',
  },
  'moyenne-simple-des-taux': {
    concept: 'moyenne-ponderee',
    libelle:
      'Faire la moyenne simple de taux au lieu de les pondérer par leurs bases.',
  },
  'hausse-base-baisse-taux': {
    concept: 'moyenne-ponderee',
    libelle:
      'Croire qu’une hausse du total fait mécaniquement baisser un taux.',
  },
  'baisse-attribuee-aux-taux-locaux': {
    concept: 'moyenne-ponderee',
    libelle:
      'Attribuer la baisse d’un taux global à la baisse des taux de chaque composante, sans regarder les poids.',
  },
  'axe-tronque-lu-comme-ecart': {
    concept: 'lecture-graphique',
    libelle:
      'Juger une évolution à la hauteur des barres sans lire l’origine et l’amplitude de l’axe.',
  },
  'correlation-prise-pour-causalite': {
    concept: 'lecture-graphique',
    libelle:
      'Conclure sur une cause, ou sur l’absence de cause, à partir de deux évolutions simultanées.',
  },
  'forme-inadaptee': {
    concept: 'lecture-graphique',
    libelle:
      'Choisir une forme de graphique qui ne montre pas la relation demandée.',
  },
  'titre-interpretatif': {
    concept: 'lecture-graphique',
    libelle:
      'Choisir un titre ou une phrase de lecture qui conclut au lieu de décrire la mesure.',
  },
  'unite-manquante-ignoree': {
    concept: 'contrat-de-lecture',
    libelle: 'Accepter un chiffre sans unité, base ou période.',
  },
  'bases-incompatibles': {
    concept: 'contrat-de-lecture',
    libelle:
      'Comparer des valeurs de périodes, de périmètres ou de bases (HT/TTC, unités) différents sans retraitement.',
  },
  'valeur-confondue-avec-taux': {
    concept: 'contrat-de-lecture',
    libelle:
      'Conclure sur une rentabilité (un taux) à partir d’un montant, ou lire un montant comme un taux.',
  },
  'ca-confondu-avec-marge': {
    concept: 'contrat-de-lecture',
    libelle:
      'Utiliser le chiffre d’affaires là où la question porte sur la marge.',
  },
  'marque-confondue-avec-marge': {
    concept: 'pourcentage',
    libelle:
      'Confondre le taux de marque (marge ÷ prix de vente HT) et le taux de marge (marge ÷ coût d’achat HT).',
  },
  'total-concordant-vaut-preuve': {
    concept: 'controle-coherence',
    libelle: 'Croire qu’un total exact garantit l’exactitude de chaque ligne.',
  },
  'indice-pris-pour-preuve': {
    concept: 'controle-coherence',
    libelle:
      'Traiter un indice de recherche (écart multiple de 9) comme une preuve.',
  },
  'controle-non-discriminant': {
    concept: 'controle-coherence',
    libelle:
      'Choisir un contrôle qui ne permet ni de localiser ni de trancher l’anomalie.',
  },
  'tva-base-non-corrigee': {
    concept: 'controle-coherence',
    libelle: 'Calculer la TVA sur une base erronée non corrigée.',
  },
  'tva-calculee-sur-ttc': {
    concept: 'pourcentage',
    libelle: 'Appliquer le taux de TVA comme si la base était un montant TTC.',
  },
  'reference-relative-non-figee': {
    concept: 'tableur',
    libelle:
      'Recopier une formule dont la référence au total n’est pas figée ($) : le dénominateur glisse.',
  },
  'valeur-saisie-sans-formule': {
    concept: 'tableur',
    libelle:
      'Taper un résultat calculé ailleurs au lieu d’une formule qui cite les cellules.',
  },
  'formule-non-recopiable': {
    concept: 'tableur',
    libelle:
      'Écrire une formule différente à chaque ligne au lieu d’une formule recopiable.',
  },
};

describe('CONCEPTS', () => {
  it('ajoute aux sept concepts existants les sept concepts de la V3 (§ 5.9)', () => {
    expect(CONCEPTS).toEqual([
      'proportion',
      'pourcentage',
      'taux-evolution',
      'coefficient-multiplicateur',
      'evolutions-successives',
      'evolution-reciproque',
      'taux-moyen',
      'indice-base-100',
      'point-de-pourcentage',
      'moyenne-ponderee',
      'lecture-graphique',
      'controle-coherence',
      'contrat-de-lecture',
      'tableur',
    ]);
  });
});

describe('CONFUSIONS', () => {
  it('rattache chaque confusion a un concept de la banque', () => {
    for (const confusion of Object.values(CONFUSIONS)) {
      expect(CONCEPTS).toContain(confusion.concept);
      expect(confusion.libelle.trim()).not.toBe('');
    }
  });

  it('conserve les huit confusions existantes et ajoute les trente de la V3 (§ 5.9)', () => {
    expect(Object.keys(CONFUSIONS)).toHaveLength(38);
    expect(CONFUSIONS).toMatchObject(CONFUSIONS_AJOUTEES_PAR_LA_V3);
    expect(Object.keys(CONFUSIONS).slice(0, 8)).toEqual([
      'hausse-baisse-symetriques',
      'taux-successifs-additionnes',
      'reciproque-meme-taux',
      'base-arrivee',
      'ecart-absolu-au-lieu-du-taux',
      'coefficient-confondu-avec-taux',
      'taux-valeur-facteur-cent',
      'raisonnement-additif',
    ]);
  });
});

describe('libelleDeConfusion', () => {
  it('rend le libelle d une confusion connue', () => {
    expect(libelleDeConfusion('hausse-baisse-symetriques')).toBe(
      CONFUSIONS['hausse-baisse-symetriques'].libelle,
    );
  });

  it('rend null pour un identifiant inconnu ou herite', () => {
    expect(libelleDeConfusion('inconnue')).toBeNull();
    expect(libelleDeConfusion('toString')).toBeNull();
  });
});

describe('libelleLisible', () => {
  it('rend le libelle d une confusion connue', () => {
    expect(libelleLisible('hausse-baisse-symetriques')).toBe(
      CONFUSIONS['hausse-baisse-symetriques'].libelle,
    );
  });

  it('rend l identifiant tel quel quand la confusion est inconnue', () => {
    expect(libelleLisible('inconnue')).toBe('inconnue');
  });

  it('rend null quand aucune confusion n est reconnue', () => {
    expect(libelleLisible(null)).toBeNull();
  });
});
