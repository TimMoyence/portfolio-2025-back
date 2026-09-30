import {
  CONCEPTS,
  CONCEPTS_DU_B2_01,
  CONCEPTS_DU_B2_02,
  CONCEPTS_DU_B2_03,
  CONCEPTS_DU_B2_04,
} from './concepts';
import {
  CONFUSIONS,
  detailsLisibles,
  libelleDeConfusion,
  libelleLisible,
} from './confusions';

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

const CONFUSIONS_DU_B2_02 = {
  'role-statistique-confondu': {
    concept: 'serie-statistique',
    libelle:
      'Confondre la population étudiée, le caractère observé et l’effectif d’une série.',
  },
  'effectif-cumule-confondu': {
    concept: 'serie-statistique',
    libelle:
      'Confondre l’effectif (ou la fréquence) d’une classe et l’effectif cumulé jusqu’à cette classe.',
  },
  'moyenne-lue-comme-mediane': {
    concept: 'mediane',
    libelle:
      'Croire que la moyenne partage la série en deux moitiés d’effectifs égaux.',
  },
  'mediane-sans-tri': {
    concept: 'mediane',
    libelle:
      'Prendre la valeur du milieu de la liste sans avoir trié les valeurs.',
  },
  'mediane-rang-pair': {
    concept: 'mediane',
    libelle:
      'Pour un effectif pair, retenir une seule des deux valeurs centrales au lieu de leur demi-somme.',
  },
  'valeur-extreme-ignoree': {
    concept: 'choix-du-resume',
    libelle:
      'Résumer par la moyenne une série tirée par une valeur extrême, sans le signaler.',
  },
  'valeur-extreme-supprimee': {
    concept: 'choix-du-resume',
    libelle:
      'Retirer une valeur extrême gênante sans pièce qui prouve qu’elle est une erreur.',
  },
  'quartile-moitie-de-mediane': {
    concept: 'quartiles',
    libelle:
      'Calculer un quartile à partir de la médiane (sa moitié, ou la médiane plus la moitié) au lieu de chercher la valeur qui laisse un quart de l’effectif en dessous.',
  },
  'convention-de-quartile-ignoree': {
    concept: 'quartiles',
    libelle:
      'Comparer des quartiles obtenus par deux conventions différentes (programme, tableur) sans le signaler.',
  },
  'boite-lue-comme-effectif': {
    concept: 'boite-a-moustaches',
    libelle:
      'Croire qu’une partie plus longue de la boîte contient davantage de valeurs.',
  },
  'ecart-type-population-echantillon': {
    concept: 'ecart-type',
    libelle:
      'Confondre l’écart-type de la population (division par n) et l’écart-type estimé sur un échantillon (division par n − 1).',
  },
  'variance-confondue-avec-ecart-type': {
    concept: 'ecart-type',
    libelle:
      'Donner la variance, exprimée dans le carré de l’unité, comme écart-type.',
  },
  'etendue-prise-pour-dispersion': {
    concept: 'dispersion',
    libelle:
      'Juger la dispersion sur la seule étendue, qui ne dépend que des deux valeurs extrêmes.',
  },
  'meme-moyenne-meme-serie': {
    concept: 'dispersion',
    libelle:
      'Conclure que deux séries de même moyenne se ressemblent, sans regarder leur dispersion.',
  },
  'moyenne-des-moyennes': {
    concept: 'moyenne',
    libelle:
      'Faire la moyenne simple de moyennes calculées sur des groupes d’effectifs différents.',
  },
  'centre-de-classe-oublie': {
    concept: 'moyenne',
    libelle:
      'Calculer la moyenne de données groupées avec une borne des classes au lieu de leur centre.',
  },
  'histogramme-classes-inegales': {
    concept: 'histogramme',
    libelle:
      'Lire la hauteur d’un histogramme à classes d’amplitudes inégales comme un effectif, au lieu d’une densité.',
  },
};

const CONFUSIONS_DES_DEUX_VARIABLES = {
  'point-moyen-confondu': { concept: 'nuage-de-points' },
  'correlation-lue-comme-pente': { concept: 'correlation' },
  'correlation-jugee-au-signe': { concept: 'correlation' },
  'pente-ordonnee-inversees': { concept: 'ajustement-affine' },
  'rang-pris-pour-annee': { concept: 'prevision' },
  'extrapolation-sans-reserve': { concept: 'prevision' },
  'seuil-mal-arrondi': { concept: 'prevision' },
};

const CONFUSIONS_DU_B2_03 = {
  'ou-lu-exclusif': { concept: 'connecteur' },
  'implication-lue-comme-equivalence': { concept: 'connecteur' },
  'borne-stricte-large': { concept: 'proposition' },
  'negation-sans-morgan': { concept: 'negation' },
  'negation-comparaison': { concept: 'negation' },
  'negation-pour-tout-en-aucun': { concept: 'quantificateur' },
  'negation-il-existe-gardee': { concept: 'quantificateur' },
  'ordre-quantificateurs-inverse': { concept: 'quantificateur' },
  'critere-sans-guillemets': { concept: 'tableur' },
  'ou-compte-deux-fois': { concept: 'connecteur' },
  'et-traduit-par-ou': { concept: 'connecteur' },
};

const CONFUSIONS_DU_B2_04 = {
  'rang-decale': { concept: 'suite-arithmetique' },
  'rang-confondu-avec-annee': { concept: 'algorithme-de-seuil' },
  'nature-de-suite-confondue': { concept: 'suite-geometrique' },
  'condition-tant-que-inversee': { concept: 'algorithme-de-seuil' },
  'nombre-de-termes-decale': { concept: 'somme-de-termes' },
  'terme-pris-pour-somme': { concept: 'somme-de-termes' },
};

describe('CONCEPTS', () => {
  it('fige les quatorze concepts du B2-01 dans leur ordre', () => {
    expect(CONCEPTS.slice(0, 14)).toEqual([...CONCEPTS_DU_B2_01]);
  });

  it('ajoute à la suite les treize concepts du B2-02, les quatre de deux variables en dernier', () => {
    expect(CONCEPTS.slice(14, 27)).toEqual([...CONCEPTS_DU_B2_02]);
    expect(CONCEPTS_DU_B2_02).toEqual([
      'serie-statistique',
      'moyenne',
      'mediane',
      'quartiles',
      'dispersion',
      'ecart-type',
      'boite-a-moustaches',
      'histogramme',
      'choix-du-resume',
      'nuage-de-points',
      'correlation',
      'ajustement-affine',
      'prevision',
    ]);
  });

  it('ajoute en dernier les quatre concepts de suites du B2-04', () => {
    expect(CONCEPTS.slice(31)).toEqual([...CONCEPTS_DU_B2_04]);
    expect(CONCEPTS_DU_B2_04).toEqual([
      'suite-arithmetique',
      'suite-geometrique',
      'algorithme-de-seuil',
      'somme-de-termes',
    ]);
  });

  it('ajoute à la suite les quatre concepts de logique du B2-03', () => {
    expect(CONCEPTS.slice(27, 31)).toEqual([...CONCEPTS_DU_B2_03]);
    expect(CONCEPTS_DU_B2_03).toEqual([
      'proposition',
      'connecteur',
      'negation',
      'quantificateur',
    ]);
  });

  it('ajoute aux sept concepts existants les sept concepts de la V3 (§ 5.9)', () => {
    expect(CONCEPTS_DU_B2_01).toEqual([
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

  it('ajoute les dix-sept confusions du B2-02 aux trente-huit du B2-01', () => {
    expect(Object.keys(CONFUSIONS).slice(38, 55)).toEqual(
      Object.keys(CONFUSIONS_DU_B2_02),
    );
    expect(CONFUSIONS).toMatchObject(CONFUSIONS_DU_B2_02);
  });

  it('ajoute en dernier les sept confusions de deux variables, sans retirer celles de la v1', () => {
    expect(Object.keys(CONFUSIONS).slice(55, 62)).toEqual(
      Object.keys(CONFUSIONS_DES_DEUX_VARIABLES),
    );
    expect(CONFUSIONS).toMatchObject(CONFUSIONS_DES_DEUX_VARIABLES);
  });

  it('ajoute à la suite les onze confusions de logique du B2-03', () => {
    expect(Object.keys(CONFUSIONS).slice(62, 73)).toEqual(
      Object.keys(CONFUSIONS_DU_B2_03),
    );
    expect(CONFUSIONS).toMatchObject(CONFUSIONS_DU_B2_03);
  });

  it('ajoute en dernier les six confusions de suites du B2-04', () => {
    expect(Object.keys(CONFUSIONS)).toHaveLength(79);
    expect(Object.keys(CONFUSIONS).slice(73)).toEqual(
      Object.keys(CONFUSIONS_DU_B2_04),
    );
    expect(CONFUSIONS).toMatchObject(CONFUSIONS_DU_B2_04);
  });

  it('conserve les huit confusions existantes et ajoute les trente de la V3 (§ 5.9)', () => {
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

describe('detailsLisibles', () => {
  it('remplace la confusion de chaque detail par son libelle lisible', () => {
    expect(
      detailsLisibles([
        { cle: 'B2', juste: false, confusion: 'hausse-baisse-symetriques' },
        { cle: 'B3', juste: true, confusion: null },
      ]),
    ).toEqual([
      {
        cle: 'B2',
        juste: false,
        libelleConfusion: CONFUSIONS['hausse-baisse-symetriques'].libelle,
      },
      { cle: 'B3', juste: true, libelleConfusion: null },
    ]);
  });
});
