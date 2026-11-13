import { typographierEnProfondeur } from '../formule/Typographie';
import type { ConceptId } from './concepts';

interface DefinitionConfusion {
  readonly concept: ConceptId;
  readonly libelle: string;
}

const DEFINITIONS = {
  'hausse-baisse-symetriques': {
    concept: 'evolutions-successives',
    libelle:
      'Croire qu’une hausse puis une baisse du même pourcentage ramènent à la valeur de départ.',
  },
  'taux-successifs-additionnes': {
    concept: 'evolutions-successives',
    libelle:
      'Additionner des taux successifs au lieu de multiplier les coefficients.',
  },
  'reciproque-meme-taux': {
    concept: 'evolution-reciproque',
    libelle:
      'Croire que le même pourcentage en sens inverse ramène au départ, qu’il soit le taux d’une évolution ou la somme de taux successifs : on revient au départ en divisant par le coefficient multiplicateur.',
  },
  'base-arrivee': {
    concept: 'taux-evolution',
    libelle:
      'Diviser l’écart par la valeur d’arrivée au lieu de la valeur de départ.',
  },
  'ecart-absolu-au-lieu-du-taux': {
    concept: 'taux-evolution',
    libelle: 'Donner l’écart en valeur au lieu du taux en pourcentage.',
  },
  'coefficient-confondu-avec-taux': {
    concept: 'coefficient-multiplicateur',
    libelle:
      'Confondre le taux d’évolution t et le coefficient multiplicateur 1 + t (pour + 15 % : 0,15 et 1,15).',
  },
  'taux-valeur-facteur-cent': {
    concept: 'pourcentage',
    libelle:
      'Confondre le taux 70 % et la valeur 0,7 : le résultat est décalé d’un facteur 100.',
  },
  'raisonnement-additif': {
    concept: 'proportion',
    libelle:
      'Raisonner par addition là où la situation est proportionnelle : ajouter un écart constant, ou additionner les taux de plusieurs composantes pour obtenir un taux global.',
  },
  'proportion-confondue-avec-evolution': {
    concept: 'pourcentage',
    libelle:
      'Confondre un pourcentage de proportion (part d’un total) et un pourcentage d’évolution (variation par rapport à une valeur de départ).',
  },
  'points-confondus-avec-pourcentage': {
    concept: 'point-de-pourcentage',
    libelle:
      'Confondre l’écart entre deux taux, qui se mesure en points, et un pourcentage, part d’un total ou évolution relative, qui se mesure en %.',
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
      'Se tromper sur le sens d’une variation : oublier le signe moins d’une baisse, traduire une baisse par le coefficient 1 + t au lieu de 1 − t, ou juger croissante une suite géométrique de raison positive, qui ne croît que si sa raison dépasse 1.',
  },
  'coefficient-global-mal-interprete': {
    concept: 'evolutions-successives',
    libelle:
      'Mal traduire un coefficient global en taux (0,99 correspond à une baisse de 1 %).',
  },
  'rythme-confondu-avec-niveau': {
    concept: 'indice-base-100',
    libelle:
      'Confondre désinflation et des prix stables ou en baisse : quand la hausse des prix ralentit (désinflation), les prix continuent de monter ; ils ne baissent qu’en déflation.',
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
      'Prendre pour taux moyen une moyenne arithmétique, le taux global divisé par le nombre de périodes ou la moyenne des taux de chaque période, au lieu de la racine n-ième du coefficient global.',
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
  'axe-tronque-lu-comme-ecart': {
    concept: 'lecture-graphique',
    libelle:
      'Lire ou construire un graphique sans tenir compte de l’origine et de l’amplitude de l’axe : juger un écart à la hauteur des barres, tronquer l’axe ou supprimer ses graduations, ou renoncer à lire un écart que les graduations permettent de mesurer.',
  },
  'correlation-prise-pour-causalite': {
    concept: 'lecture-graphique',
    libelle:
      'Tirer de deux évolutions simultanées, ou d’un coefficient de corrélation proche de 1, une conclusion qu’ils ne prouvent pas : une cause, l’absence de cause ou la poursuite de la tendance.',
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
    libelle:
      'Accepter ou produire un chiffre, un titre ou une légende sans sa définition, son unité, sa base ou sa période.',
  },
  'bases-incompatibles': {
    concept: 'contrat-de-lecture',
    libelle:
      'Comparer directement des valeurs de périodes, de périmètres ou de bases (HT/TTC, unités) différents, sans les retraiter ni chercher la donnée comparable.',
  },
  'valeur-confondue-avec-taux': {
    concept: 'contrat-de-lecture',
    libelle:
      'Confondre un montant et un taux : conclure sur une rentabilité à partir d’un montant, lire un montant comme un pourcentage ou un écart en points, ou un pourcentage comme un montant.',
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
    libelle:
      'Juger les lignes sur les seuls totaux : croire qu’un total exact garantit chaque ligne, ou conclure à l’absence d’erreur malgré un écart entre deux totaux.',
  },
  'indice-pris-pour-preuve': {
    concept: 'controle-coherence',
    libelle:
      'Traiter un indice de recherche (écart multiple de 9) comme une preuve.',
  },
  'controle-non-discriminant': {
    concept: 'controle-coherence',
    libelle:
      'Se contenter d’un contrôle ou d’un calcul qui ne localise ni ne tranche l’anomalie, en jugeant un écart négligeable ou en ne calculant que l’effet de l’écart, au lieu de remonter à la pièce qui dit quelle valeur est fausse.',
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
      'Recopier une formule dont une référence fixe n’est pas figée ($) : elle glisse d’une ligne à chaque recopie.',
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
      'Donner pour écart-type la variance, exprimée dans le carré de l’unité, ou un nombre tiré d’elle sans racine carrée, comme sa moitié : l’écart-type est la racine carrée de la variance.',
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
  'centre-de-classe-oublie': {
    concept: 'moyenne',
    libelle:
      'Calculer la moyenne de données groupées avec une borne des classes au lieu de leur centre.',
  },
  'point-moyen-confondu': {
    concept: 'nuage-de-points',
    libelle:
      'Prendre pour point moyen le point du milieu du tableau, la somme des valeurs ou la moyenne de l’autre série, au lieu du point de coordonnées (x̄ ; ȳ), moyenne des x et moyenne des y.',
  },
  'correlation-lue-comme-pente': {
    concept: 'correlation',
    libelle:
      'Lire le coefficient de corrélation comme la pente de la droite d’ajustement.',
  },
  'correlation-jugee-au-signe': {
    concept: 'correlation',
    libelle:
      'Juger la qualité d’un ajustement au signe du coefficient de corrélation au lieu de sa proximité avec 1 ou −1.',
  },
  'pente-ordonnee-inversees': {
    concept: 'ajustement-affine',
    libelle:
      'Inverser les deux séries dans PENTE ou ORDONNEE.ORIGINE, ou confondre le coefficient de x (la pente) et la valeur pour x = 0 (l’ordonnée à l’origine), dans un sens ou dans l’autre.',
  },
  'rang-pris-pour-annee': {
    concept: 'prevision',
    libelle:
      'Remplacer x par l’année, ou par l’écart à l’année de départ, au lieu de son rang dans l’équation de la droite.',
  },
  'extrapolation-sans-reserve': {
    concept: 'prevision',
    libelle:
      'Se fier à une tendance au-delà de ce que les données permettent : la prolonger loin des données sans signaler la limite de la prévision, ou ne pas mesurer l’écart entre ce que prévoit le modèle et ce qui est observé.',
  },
  'seuil-mal-arrondi': {
    concept: 'prevision',
    libelle:
      'Mal conclure une recherche de seuil, en gardant la solution non entière d’une inéquation, en l’arrondissant à l’entier inférieur ou en arrêtant une boucle un passage trop tôt, au lieu de retenir le premier rang entier qui atteint le seuil.',
  },
  'ou-lu-exclusif': {
    concept: 'connecteur',
    libelle:
      'Lire « ou » comme exclusif (l’un ou l’autre mais pas les deux), alors que le « ou » logique est vrai aussi quand les deux conditions sont vraies.',
  },
  'implication-lue-comme-equivalence': {
    concept: 'connecteur',
    libelle:
      'Lire « si P alors Q » comme « P si et seulement si Q » : croire que Q vrai entraîne P vrai.',
  },
  'borne-stricte-large': {
    concept: 'proposition',
    libelle:
      'Confondre une inégalité stricte et une inégalité large (> et ≥) : la valeur à la borne change de camp.',
  },
  'negation-sans-morgan': {
    concept: 'negation',
    libelle:
      'Nier « P et Q » en « non P et non Q » (ou « P ou Q » en « non P ou non Q ») : la loi de Morgan échange aussi le connecteur.',
  },
  'negation-comparaison': {
    concept: 'negation',
    libelle:
      'Nier une comparaison sans faire changer la borne de camp : le contraire de « x > a » est « x ≤ a » et non « x < a », celui de « x ≥ a » est « x < a » et non « x ≤ a », celui de « x < a » est « x ≥ a » et non « x > a ».',
  },
  'negation-pour-tout-en-aucun': {
    concept: 'quantificateur',
    libelle:
      'Nier « toutes vérifient P » en « aucune ne vérifie P » au lieu de « au moins une ne vérifie pas P ».',
  },
  'negation-il-existe-gardee': {
    concept: 'quantificateur',
    libelle:
      'Nier « il existe x qui vérifie P » en « il existe x qui ne vérifie pas P » au lieu de « aucun x ne vérifie P ».',
  },
  'ordre-quantificateurs-inverse': {
    concept: 'quantificateur',
    libelle:
      'Échanger « pour tout … il existe » et « il existe … pour tout » : la phrase change de sens.',
  },
  'critere-sans-guillemets': {
    concept: 'tableur',
    libelle:
      'Écrire un texte ou un critère sans guillemets dans une formule (France au lieu de "France") : le tableur renvoie une erreur.',
  },
  'ou-compte-deux-fois': {
    concept: 'connecteur',
    libelle:
      'Compter « A ou B » en additionnant les A et les B : les lignes qui vérifient les deux conditions sont comptées deux fois.',
  },
  'et-traduit-par-ou': {
    concept: 'connecteur',
    libelle:
      'Traduire une règle « et » par un « ou » (OU dans le tableur, OR en SQL) : on retient les lignes qui ne vérifient qu’une des conditions.',
  },
  'rang-decale': {
    concept: 'suite-arithmetique',
    libelle:
      'Se décaler d’un rang : prendre le terme d’avant ou d’après, ou compter le premier terme comme le rang 1 alors qu’il porte le rang 0.',
  },
  'rang-confondu-avec-annee': {
    concept: 'algorithme-de-seuil',
    libelle:
      'Répondre par l’année alors que la question porte sur le rang, ou l’inverse : l’année est l’année de départ plus le rang.',
  },
  'nature-de-suite-confondue': {
    concept: 'suite-geometrique',
    libelle:
      'Confondre « ajouter toujours le même nombre » (suite arithmétique) et « multiplier toujours par le même nombre » (suite géométrique), dans un sens ou dans l’autre, ou ajouter un taux au lieu de multiplier par lui.',
  },
  'condition-tant-que-inversee': {
    concept: 'algorithme-de-seuil',
    libelle:
      'Écrire dans « Tant que » la condition d’arrêt au lieu de la condition pour continuer : la boucle tourne tant que le seuil n’est pas atteint.',
  },
  'nombre-de-termes-decale': {
    concept: 'somme-de-termes',
    libelle:
      'Compter un terme de trop ou de moins dans une somme : du rang p au rang n, il y a n − p + 1 termes.',
  },
  'terme-pris-pour-somme': {
    concept: 'somme-de-termes',
    libelle:
      'Donner le dernier terme à la place du cumul : la somme additionne tous les termes de la période.',
  },
  'interets-simples-au-lieu-de-composes': {
    concept: 'interets-composes',
    libelle:
      'Calculer les intérêts de chaque année sur le seul capital de départ, sans les intérêts déjà acquis : à intérêts composés, on multiplie par 1 + t chaque année.',
  },
  'actualisation-inversee': {
    concept: 'valeur-actuelle',
    libelle:
      'Multiplier par (1 + t)ⁿ au lieu de diviser pour ramener une somme future à aujourd’hui : la valeur actuelle est plus petite que la somme future.',
  },
  'versements-sans-interets': {
    concept: 'annuites',
    libelle:
      'Additionner les versements sans leurs intérêts : la valeur acquise d’une suite d’annuités dépasse le total versé.',
  },
  'versements-places-toute-la-duree': {
    concept: 'annuites',
    libelle:
      'Placer chaque versement pendant toute la durée : un versement de fin d’année n’est placé que jusqu’au dernier versement, le dernier ne rapporte rien.',
  },
  'interets-sur-capital-initial': {
    concept: 'tableau-d-amortissement',
    libelle:
      'Calculer les intérêts de chaque année sur le capital emprunté au départ : ils portent sur le capital restant dû en début d’année.',
  },
  'annuite-confondue-avec-amortissement': {
    concept: 'tableau-d-amortissement',
    libelle:
      'Confondre l’annuité et le capital remboursé : prendre l’annuité pour l’amortissement, ou le capital emprunté divisé par la durée pour l’annuité, alors que l’amortissement est l’annuité moins les intérêts de l’année.',
  },
  'cout-credit-confondu-avec-total-rembourse': {
    concept: 'cout-du-credit',
    libelle:
      'Donner le total remboursé pour le coût du crédit : le coût est ce total moins le capital emprunté, soit la somme des intérêts.',
  },
  'capital-de-vpm-non-signe': {
    concept: 'tableur',
    libelle:
      'Écrire le capital emprunté sans signe moins dans VPM : le tableur rend alors une annuité négative.',
  },
  'exponentielle-lue-comme-produit': {
    concept: 'fonction-exponentielle',
    libelle:
      'Calculer e^(kx) comme e × k × x : k × x est un exposant, il se calcule avant d’appliquer l’exponentielle.',
  },
  'signe-de-k-ignore': {
    concept: 'fonction-exponentielle',
    libelle:
      'Ignorer le signe de k dans un modèle a e^(kx) : le croire toujours croissant, ou oublier le moins de k dans un calcul, alors qu’il décroît quand k est négatif, en restant positif.',
  },
  'k-confondu-avec-taux': {
    concept: 'fonction-exponentielle',
    libelle:
      'Confondre k et le taux d’évolution par unité, en prenant k pour le taux ou le taux pour k : le coefficient est e^k, le taux e^k − 1 et k = ln(1 + taux).',
  },
  'ln-produit-en-produit': {
    concept: 'logarithme-neperien',
    libelle:
      'Écrire ln(a × b) = ln a × ln b, ln(a ÷ b) = ln a ÷ ln b ou ln(aⁿ) = (ln a)ⁿ : ln change un produit en somme, un quotient en différence et une puissance en produit, ln(aⁿ) = n × ln a.',
  },
  'log-decimal-au-lieu-de-ln': {
    concept: 'logarithme-neperien',
    libelle:
      'Utiliser la touche log, le logarithme décimal, au lieu de ln, le logarithme népérien.',
  },
  'seuil-par-division': {
    concept: 'resolution-par-logarithme',
    libelle:
      'Diviser la valeur visée par q ou par k au lieu d’appliquer ln : qⁿ ≥ s se résout par n × ln q ≥ ln s.',
  },
  'sens-inegalite-ln-negatif': {
    concept: 'resolution-par-logarithme',
    libelle:
      'Garder le sens d’une inégalité en divisant par un nombre négatif, comme ln q quand q < 1 ou un coefficient négatif devant x : diviser par un nombre négatif change le sens.',
  },
  'ajustement-affine-sur-y': {
    concept: 'ajustement-exponentiel',
    libelle:
      'Ajuster y par une droite quand il baisse d’une même part à chaque pas : on ajuste z = ln y, puis on revient à y.',
  },
  'ordonnee-non-exponentiee': {
    concept: 'ajustement-exponentiel',
    libelle:
      'Prendre l’ordonnée à l’origine b de z = ax + b pour le coefficient du modèle : ce coefficient vaut e^b.',
  },
  'reference-absolue-ignoree': {
    concept: 'reference-de-cellule',
    libelle:
      'Lire une formule recopiée sans voir ce que le $ fige : la référence figée ne glisse pas, la référence relative glisse.',
  },
  'identifiant-pris-pour-nombre': {
    concept: 'jeu-de-donnees',
    libelle:
      'Prendre un identifiant qui contient des chiffres pour une quantité qu’on additionne.',
  },
  'lignes-comptees-pour-commandes': {
    concept: 'granularite',
    libelle:
      'Compter les lignes quand on cherche les commandes, ou croire que le fichier compte autant de lignes que de commandes, voire moins : une commande compte autant de lignes que de produits.',
  },
  'libelle-pris-pour-cle': {
    concept: 'cle-et-relation',
    libelle:
      'Prendre un nom ou une ville pour un identifiant, jusqu’à relier deux tables par eux : un nom se répète et s’écrit de plusieurs façons, seul l’identifiant désigne une seule fiche.',
  },
  'suspect-corrige-sans-validation': {
    concept: 'qualite-des-donnees',
    libelle:
      'Corriger seul une donnée douteuse, ou une erreur certaine dont la bonne valeur n’est pas dans le fichier, au lieu de la signaler à qui peut la vérifier.',
  },
  'texte-pris-pour-nombre': {
    concept: 'nettoyage',
    libelle:
      'Additionner une colonne dont certains nombres sont du texte : la somme les ignore sans prévenir.',
  },
  'doublons-supprimes-sur-une-colonne': {
    concept: 'nettoyage',
    libelle:
      'Dédoublonner sur une seule colonne et perdre des lignes distinctes qui la partagent.',
  },
  'plage-recherche-non-figee': {
    concept: 'recherche-dans-une-table',
    libelle:
      'Recopier une recherche sans figer la table : la plage glisse et les dernières lignes ne sont plus trouvées.',
  },
  'critere-mal-ecrit': {
    concept: 'agregation-conditionnelle',
    libelle:
      'Écrire un critère de comparaison sans joindre l’opérateur à la cellule par & (">="&H1), ou 15 au lieu de 15 %.',
  },
  'jours-calendaires-pour-ouvres': {
    concept: 'calcul-sur-dates',
    libelle: 'Soustraire deux dates quand le contrat compte des jours ouvrés.',
  },
  'plage-fixe-au-lieu-de-tableau': {
    concept: 'tableau-croise-dynamique',
    libelle:
      'Construire sur une plage fixe qui ne voit pas les lignes ajoutées ensuite.',
  },
  'pourcentage-du-mauvais-total': {
    concept: 'tableau-croise-dynamique',
    libelle:
      'Afficher la part du total général quand la question porte sur la part dans la ligne.',
  },
  'graphique-sans-question': {
    concept: 'choix-du-graphique',
    libelle:
      'Choisir un graphique avant la question à laquelle il doit répondre.',
  },
  'objectif-annuel-pour-cumul': {
    concept: 'tableau-de-bord',
    libelle:
      'Comparer un cumul de neuf mois à tous les objectifs de l’agence, sans filtrer la période.',
  },
  'evolution-sur-annee-pleine': {
    concept: 'tableau-de-bord',
    libelle:
      'Comparer une année en cours, incomplète, à une année pleine au lieu de la même période.',
  },
  'kpi-sans-contexte': {
    concept: 'tableau-de-bord',
    libelle:
      'Afficher un chiffre seul, sans objectif ni comparaison qui dise s’il est bon.',
  },
  'periode-mal-delimitee': {
    concept: 'agregation-conditionnelle',
    libelle:
      'Agréger plus large que la question en oubliant une de ses conditions : la table entière au lieu des seuls mois demandés, ou toutes les ventes d’une agence au lieu de celles de la catégorie et de la période demandées.',
  },
  'commandes-comptees-pour-lignes': {
    concept: 'granularite',
    libelle:
      'Compter une commande quand on cherche ses lignes : une commande de trois produits occupe trois lignes.',
  },
  'type-de-variable-confondu': {
    concept: 'jeu-de-donnees',
    libelle:
      'Ranger une date, une mesure, un booléen ou une catégorie sous un autre type : le type dit le calcul permis.',
  },
  'espaces-non-supprimes': {
    concept: 'nettoyage',
    libelle:
      'Compter « Bordeaux » et « Bordeaux » suivi d’une espace comme deux villes faute de SUPPRESPACE.',
  },
  'part-douteuse-estimee-sans-mesure': {
    concept: 'qualite-des-donnees',
    libelle:
      'Se tromper sur l’ordre de grandeur de la part des lignes fausses ou douteuses d’un export, faute de l’avoir mesurée anomalie par anomalie.',
  },
  'cle-prise-pour-categorie': {
    concept: 'cle-et-relation',
    libelle:
      'Ranger un identifiant comme agence_id ou commercial_id parmi les catégories : c’est un code qui désigne une seule entité, et son libellé vit dans l’onglet qu’il désigne, quand il existe.',
  },
  'correction-certaine-renvoyee-a-un-humain': {
    concept: 'qualite-des-donnees',
    libelle:
      'Renvoyer à un humain une erreur certaine dont la bonne valeur se déduit du fichier : une formule ou un outil du tableur la corrige.',
  },
  'famille-de-probleme-mal-nommee': {
    concept: 'agregation-conditionnelle',
    libelle:
      'Nommer une seule famille de problème, ou la mauvaise, quand la question demande de chercher une catégorie puis d’additionner sous conditions.',
  },
  'bornes-comptees-dans-le-delai': {
    concept: 'calcul-sur-dates',
    libelle:
      'Prendre NB.JOURS.OUVRES tel quel pour un délai : il compte le jour de départ et le jour d’arrivée, d’où le − 1.',
  },
  'tcd-filtre-ou-dates-mal-groupees': {
    concept: 'tableau-croise-dynamique',
    libelle:
      'Lire un TCD dont un filtre manque ou reste actif, ou dont les dates sont groupées sans les années : il ampute ou mêle les périodes.',
  },
  'detail-au-lieu-de-synthese': {
    concept: 'tableau-de-bord',
    libelle:
      'Montrer le détail des lignes là où la décision attend quelques indicateurs, chacun avec sa comparaison.',
  },
  'en-tete-compte-comme-ligne': {
    concept: 'jeu-de-donnees',
    libelle:
      'Compter la ligne d’en-tête parmi les données : NBVAL sur toute la colonne compte aussi le nom de la colonne.',
  },
  'controle-apres-correction': {
    concept: 'qualite-des-donnees',
    libelle:
      'Lire le contrôle sur des données déjà corrigées : recalculé, il ne compte plus les défauts du fichier reçu.',
  },
  'pourcentage-du-total-de-colonne': {
    concept: 'tableau-croise-dynamique',
    libelle:
      'Afficher le % du total de la colonne quand la question porte sur la part dans la ligne : la case donne alors le poids de la ligne dans la colonne.',
  },
  'mediane-sur-liste-trop-large': {
    concept: 'indicateur-statistique',
    libelle:
      'Prendre la médiane d’une liste trop large : un critère oublié l’élargit, et sous un filtre MEDIANE compte aussi les lignes masquées, là où AGREGAT(12;5;plage) ne garde que les lignes visibles.',
  },
  'chiffre-lisible-juge-ambigu': {
    concept: 'contrat-de-lecture',
    libelle:
      'Juger ambigu un chiffre dont le libellé dit ce qu’il mesure, sa base et sa période : il se lit tel quel, et une unité mal écrite se corrige.',
  },
  'retraitement-superflu': {
    concept: 'contrat-de-lecture',
    libelle:
      'Vouloir retraiter deux valeurs qui ont déjà la même unité, le même périmètre et la même période : elles se comparent directement.',
  },
  'comparaison-possible-refusee': {
    concept: 'contrat-de-lecture',
    libelle:
      'Renoncer à comparer deux valeurs alors qu’aucune donnée ne manque : elles se comparent directement, ou après un calcul sur les données disponibles (passer du TTC au HT, changer d’unité, retirer une partie du périmètre).',
  },
  'retraitement-sans-donnee': {
    concept: 'contrat-de-lecture',
    libelle:
      'Croire qu’un calcul remplace une donnée qui manque : sans la définition, la période ou le périmètre qui rendraient deux valeurs comparables, aucun retraitement ne suffit, il faut chercher la donnée.',
  },
  'preuve-externe-superflue': {
    concept: 'controle-coherence',
    libelle:
      'Chercher une pièce ou une donnée détaillée pour une anomalie que le document suffit à trancher : compléter l’unité, la période et la source, refaire le calcul ou refaire le graphique.',
  },
  'identifiant-range-sous-un-autre-type': {
    concept: 'jeu-de-donnees',
    libelle:
      'Ranger un identifiant parmi les dates ou les booléens : c’est un code attribué par le système, qui désigne une seule fiche, et on ne fait que le compter ou relier les tables par lui.',
  },
  'erreur-certaine-jugee-douteuse': {
    concept: 'qualite-des-donnees',
    libelle:
      'Juger seulement douteuse une donnée certainement fausse : une valeur qui viole une règle du fichier (format, doublon exact, calcul, référentiel, ordre des dates) est fausse, même quand sa bonne valeur reste à demander.',
  },
  'donnee-douteuse-jugee-fausse': {
    concept: 'qualite-des-donnees',
    libelle:
      'Déclarer fausse une donnée seulement douteuse : une valeur inhabituelle mais possible peut être juste, et seul qui l’a saisie peut le dire.',
  },
  'arrondi-oublie': {
    concept: 'tableur',
    libelle:
      'Laisser un résultat en pleine précision au lieu de l’arrondir comme demandé, avec ARRONDI.',
  },
  'reference-non-figee-en-ligne': {
    concept: 'tableur',
    libelle:
      'Recopier vers la droite une formule dont une référence fixe n’est pas figée ($) : elle glisse d’une colonne à chaque recopie.',
  },
  'formule-non-recopiable-en-ligne': {
    concept: 'tableur',
    libelle:
      'Écrire une formule différente à chaque colonne au lieu d’une formule recopiable vers la droite.',
  },
  'ia-crue-sur-parole': {
    concept: 'ia-analyste',
    libelle:
      'Reprendre un chiffre d’une IA sans le comparer au sien ni lire sa méthode : période, résumé et dénominateur restent invérifiés.',
  },
  'ia-rejetee-sans-comparaison': {
    concept: 'ia-analyste',
    libelle:
      'Juger faux un chiffre d’une IA sans l’avoir comparé au sien : un chiffre juste se reconnaît à la comparaison, pas à sa source.',
  },
  'synthese-des-valeurs-erronee': {
    concept: 'tableau-croise-dynamique',
    libelle:
      'Résumer le champ placé en Valeurs par Nombre ou par Moyenne, ou y placer le champ des groupes, quand la question demande la somme des montants.',
  },
  'rang-de-quartile-arrondi-par-defaut': {
    concept: 'quartiles',
    libelle:
      'Arrondir à l’entier inférieur le rang d’un quartile : le quart et les trois quarts de l’effectif s’arrondissent toujours à l’entier supérieur.',
  },
  'exposant-non-descendu': {
    concept: 'fonction-derivee',
    libelle:
      'Dériver k × xⁿ sans faire descendre l’exposant devant : (3x²)′ écrit 3x ou 3x² au lieu de 6x, (x³)′ écrit x² au lieu de 3x².',
  },
  'constante-non-annulee': {
    concept: 'fonction-derivee',
    libelle:
      'Garder le nombre seul en dérivant : la dérivée d’une constante vaut 0, sa courbe est plate.',
  },
  'valeur-et-pente-confondues': {
    concept: 'fonction-derivee',
    libelle:
      'Confondre f(a), la valeur de la fonction en a, et f′(a), la pente de sa courbe en a : on calcule l’une quand on demande l’autre.',
  },
  'derivee-de-l-exponentielle-sans-k': {
    concept: 'fonction-derivee',
    libelle:
      'Dériver e^(kx) sans multiplier par k, ou comme une puissance de x : (e^(kx))′ = k e^(kx) et (a e^(kx))′ = a k e^(kx).',
  },
  'signe-de-f-pour-variations': {
    concept: 'variations-d-une-fonction',
    libelle:
      'Lire le sens de variation de f dans le signe de f au lieu du signe de f′ : une fonction positive peut décroître.',
  },
  'extremum-sans-changement-de-signe': {
    concept: 'optimisation',
    libelle:
      'Conclure à un maximum ou à un minimum dès que f′ s’annule : il faut que f′ change de signe, de + à − pour un maximum, de − à + pour un minimum.',
  },
  'abscisse-pour-extremum': {
    concept: 'optimisation',
    libelle:
      'Donner la valeur de x qui réalise l’optimum à la place de l’optimum, ou l’inverse : le prix optimal est x, le bénéfice maximal est f(x).',
  },
  'bornes-oubliees': {
    concept: 'optimisation',
    libelle:
      'Chercher l’optimum sans comparer les valeurs de f aux bornes de l’intervalle : le maximum peut être atteint à une borne, où f′ ne s’annule pas.',
  },
  'contrainte-ignoree': {
    concept: 'optimisation',
    libelle:
      'Garder l’optimum trouvé sans contrainte alors qu’il sort des valeurs permises : sous contrainte, on cherche l’optimum sur le nouvel intervalle, souvent à sa borne.',
  },
  'produit-derive-terme-a-terme': {
    concept: 'derivees-composees',
    libelle:
      'Dériver un produit en multipliant les dérivées, u′ × v′ : la dérivée d’un produit est (uv)′ = u′v + uv′.',
  },
  'quotient-signe-inverse': {
    concept: 'derivees-composees',
    libelle:
      'Écrire uv′ − u′v au numérateur de la dérivée d’un quotient : on écrit u′v − uv′, la dérivée du numérateur en premier.',
  },
  'quotient-sans-carre': {
    concept: 'derivees-composees',
    libelle:
      'Oublier le carré du dénominateur : (u/v)′ = (u′v − uv′)/v², avec v² et non v.',
  },
  'u-prime-oublie': {
    concept: 'derivees-composees',
    libelle:
      'Dériver e^u ou ln u sans multiplier par u′ : (e^u)′ = u′e^u et (ln u)′ = u′/u.',
  },
  'cout-moyen-et-marginal-confondus': {
    concept: 'fonctions-economiques',
    libelle:
      'Confondre le coût moyen, C(q) ÷ q, coût d’une unité en moyenne, et le coût marginal, C′(q), coût d’une unité de plus.',
  },
  'recette-sans-prix': {
    concept: 'fonctions-economiques',
    libelle:
      'Prendre la quantité vendue pour la recette : la recette vaut prix × quantité, R(p) = p × D(p).',
  },
  'nombre-de-solutions-sans-variations': {
    concept: 'resolution-approchee',
    libelle:
      'Compter les solutions de f(x) = k sans regarder les variations de f : sur un intervalle où f est strictement monotone, k compris entre les valeurs aux bornes est atteint une seule fois.',
  },
  'balayage-mal-encadre': {
    concept: 'resolution-approchee',
    libelle:
      'Lire l’encadrement d’un balayage du mauvais côté : la valeur approchée par défaut est la borne où f(x) − k n’a pas encore changé de signe.',
  },
  'dichotomie-mauvaise-moitie': {
    concept: 'resolution-approchee',
    libelle:
      'Garder la mauvaise moitié en dichotomie : on garde la moitié aux bornes de laquelle f(x) − k change de signe.',
  },
  'complementaire-oublie': {
    concept: 'probabilite-d-un-evenement',
    libelle:
      'Prendre une autre branche au lieu du complément : les branches issues d’un même nœud somment à 1, P(Ā) = 1 − P(A).',
  },
  'reunion-sans-intersection': {
    concept: 'probabilite-d-un-evenement',
    libelle:
      'Additionner P(A) et P(B) sans retirer la part commune : P(A ∪ B) = P(A) + P(B) − P(A ∩ B).',
  },
  'intersection-pour-conditionnelle': {
    concept: 'probabilite-conditionnelle',
    libelle:
      'Confondre P_A(B), la part de B parmi A, et P(A ∩ B), la part de A et B parmi tous : P(A ∩ B) = P(A) × P_A(B).',
  },
  'conditionnelle-inversee': {
    concept: 'probabilite-conditionnelle',
    libelle:
      'Confondre P_A(B) et P_B(A) : la condition est l’événement par lequel on divise.',
  },
  'mauvais-total-du-tableau': {
    concept: 'probabilite-conditionnelle',
    libelle:
      'Diviser par l’effectif total au lieu de l’effectif de la condition : P_A(B) = effectif de A ∩ B ÷ effectif de A.',
  },
  'condition-ignoree': {
    concept: 'probabilite-conditionnelle',
    libelle:
      'Répondre P(B) quand la question pose une condition : « parmi les A » restreint l’univers à A.',
  },
  'branches-additionnees': {
    concept: 'probabilite-conditionnelle',
    libelle:
      'Additionner les probabilités le long d’un chemin : on multiplie le long d’un chemin, on additionne les chemins.',
  },
  'totales-sans-ponderation': {
    concept: 'probabilites-totales',
    libelle:
      'Additionner les probabilités conditionnelles sans les pondérer : P(B) = P(A) × P_A(B) + P(Ā) × P_Ā(B).',
  },
  'totales-incompletes': {
    concept: 'probabilites-totales',
    libelle:
      'Ne garder qu’un chemin vers B : les probabilités totales somment tous les chemins d’une partition qui mènent à B.',
  },
  'independance-et-incompatibilite-confondues': {
    concept: 'independance',
    libelle:
      'Croire indépendants deux événements qui ne peuvent pas arriver ensemble : indépendants veut dire P(A ∩ B) = P(A) × P(B).',
  },
  'independance-sans-calcul': {
    concept: 'independance',
    libelle:
      'Conclure à l’indépendance, ou à la dépendance, sans calcul : on compare P(A ∩ B) à P(A) × P(B), ou P_A(B) à P(B).',
  },
  'recherche-mal-saisie': {
    concept: 'texte-brut',
    libelle:
      'Chercher un autre motif que celui à remplacer : ^p seul au lieu de ^p^p, une espace au lieu de deux, un tiret seul au lieu de ^p suivi d’un tiret.',
  },
  'paragraphe-vide-pour-espacer': {
    concept: 'mise-en-forme-des-paragraphes',
    libelle:
      'Espacer deux paragraphes par une ligne vide au lieu de l’espacement avant ou après.',
  },
  'espace-pour-aligner': {
    concept: 'mise-en-forme-des-paragraphes',
    libelle:
      'Aligner ou décaler un paragraphe par des espaces ou des tabulations au lieu d’un retrait ou d’un alignement.',
  },
  'saut-de-page-par-entrees': {
    concept: 'mise-en-forme-des-paragraphes',
    libelle:
      'Passer à la page suivante par des Entrée répétées : la page se décale dès qu’on ajoute une ligne au-dessus.',
  },
  'style-pour-un-mot-isole': {
    concept: 'mise-en-forme-des-caracteres',
    libelle:
      'Créer ou appliquer un style de paragraphe pour marquer un seul mot, qu’une mise en forme directe suffit à marquer.',
  },
  'mise-en-forme-directe-au-lieu-du-style': {
    concept: 'styles-et-theme',
    libelle:
      'Mettre un titre en forme à la main au lieu d’un style : il n’entre ni dans le volet de navigation, ni dans la table des matières, ni dans les signets du PDF.',
  },
  'niveaux-de-titre-confondus': {
    concept: 'styles-et-theme',
    libelle:
      'Donner le même niveau de style à tous les titres : Titre 1 pour les parties, Titre 2 pour leurs sous-parties.',
  },
  'couleur-hors-du-theme': {
    concept: 'styles-et-theme',
    libelle:
      'Choisir une couleur ou une police à la main au lieu de celles du thème : elles ne suivent plus quand le thème change.',
  },
  'premiere-page-non-differenciee': {
    concept: 'mise-en-page',
    libelle:
      'Laisser l’en-tête et le numéro sur la page de titre au lieu de cocher Première page différente.',
  },
  'saut-de-page-au-lieu-de-section': {
    concept: 'mise-en-page',
    libelle:
      'Changer l’orientation d’une seule page après un simple saut de page : tout le document bascule, il fallait un saut de section.',
  },
  'niveau-de-reglage-confondu': {
    concept: 'mise-en-page',
    libelle:
      'Chercher un réglage au mauvais niveau : la police est un réglage du caractère, l’alignement du paragraphe, la marge et l’orientation de la section.',
  },
  'numero-de-page-tape': {
    concept: 'mise-en-page',
    libelle:
      'Taper le numéro de page au lieu d’insérer son champ : il ne change pas d’une page à l’autre.',
  },
  'pdf-imprime-au-lieu-d-enregistre': {
    concept: 'export-pdf',
    libelle:
      'Imprimer vers un PDF au lieu de l’enregistrer : les signets et les liens sont perdus.',
  },
  'texte-d-ia-repris-sans-relecture': {
    concept: 'ia-redactrice',
    libelle:
      'Reprendre le texte d’une IA sans le relire contre sa source : un chiffre changé ou un fait inventé passe dans le document.',
  },
  'texte-d-ia-rejete-sans-relecture': {
    concept: 'ia-redactrice',
    libelle:
      'Rejeter le texte d’une IA sans l’avoir comparé à sa source : des phrases justes sont perdues.',
  },
  'ecart-d-ia-mal-nomme': {
    concept: 'ia-redactrice',
    libelle:
      'Voir l’écart d’un texte d’IA sans nommer sa nature : chiffre changé, fait inventé ou sens inversé.',
  },
  'lettre-recopiee-a-la-main': {
    concept: 'source-de-publipostage',
    libelle:
      'Recopier la lettre pour chaque destinataire et y changer le nom à la main, au lieu de fusionner une lettre type avec la liste.',
  },
  'ligne-d-en-tete-comptee': {
    concept: 'source-de-publipostage',
    libelle:
      'Compter la ligne d’en-tête du tableur parmi les destinataires : elle nomme les champs, elle n’est pas une lettre.',
  },
  'champ-tape-a-la-main': {
    concept: 'champ-de-fusion',
    libelle:
      'Taper « «nom» » ou « [Nom] » au clavier : le texte reste tel quel dans chaque lettre, rien ne se fusionne.',
  },
  'piece-de-la-lettre-confondue': {
    concept: 'champ-de-fusion',
    libelle:
      'Confondre ce qui est commun à toutes les lettres, ce qui vient d’une colonne de la liste et ce qui dépend d’une condition.',
  },
  'format-du-nombre-ignore': {
    concept: 'champ-de-fusion',
    libelle:
      'Laisser un montant fusionné sans format : Word l’écrit comme le stocke le tableur, sans espace des milliers ni symbole €.',
  },
  'filtre-sur-le-mauvais-champ': {
    concept: 'regle-de-fusion',
    libelle:
      'Filtrer sur une autre colonne que celle du critère : la ville du client au lieu de son agence.',
  },
  'source-modifiee-pour-filtrer': {
    concept: 'regle-de-fusion',
    libelle:
      'Supprimer des lignes du classeur pour ne garder que certains destinataires, au lieu de filtrer dans Word.',
  },
  'condition-inversee': {
    concept: 'regle-de-fusion',
    libelle:
      'Inverser le texte si vrai et le texte sinon d’une règle Si…Alors…Sinon : chaque formule d’appel tombe sur l’autre civilité.',
  },
  'fusion-sans-apercu': {
    concept: 'fusion-et-pdf',
    libelle:
      'Fusionner, imprimer ou envoyer sans avoir parcouru l’aperçu des résultats ni vérifié les erreurs.',
  },
  'correction-au-mauvais-endroit': {
    concept: 'fusion-et-pdf',
    libelle:
      'Corriger lettre par lettre dans le document fusionné ce qui vient de la liste, du champ ou de la règle.',
  },
  'lettre-type-exportee-au-lieu-de-fusionnee': {
    concept: 'fusion-et-pdf',
    libelle:
      'Enregistrer la lettre type en PDF : on obtient une lettre aux champs vides ou au premier destinataire, pas les lettres fusionnées.',
  },
  'pdf-de-toutes-les-lettres-a-chacun': {
    concept: 'fusion-et-pdf',
    libelle:
      'Joindre à un client le PDF de toutes les lettres fusionnées : il reçoit les données des autres clients.',
  },
  'destinataires-en-copie': {
    concept: 'e-mailing',
    libelle:
      'Envoyer un seul courriel, toutes les adresses en copie : chacun voit les autres destinataires et lit la même lettre.',
  },
  'champ-a-mal-choisi': {
    concept: 'e-mailing',
    libelle:
      'Régler le champ À sur une autre colonne que celle des adresses e-mail.',
  },
  'format-de-message-texte-brut': {
    concept: 'e-mailing',
    libelle:
      'Envoyer la lettre en texte brut : sa mise en forme se perd dans le courriel.',
  },
  'implication-fausse-si-premisse-fausse': {
    concept: 'connecteur',
    libelle:
      'Croire qu’une implication, si P alors Q, est fausse dès que sa condition P est fausse, alors qu’elle n’est fausse que lorsque P est vraie et Q fausse.',
  },
} as const satisfies Readonly<Record<string, DefinitionConfusion>>;

export const CONFUSIONS = typographierEnProfondeur(DEFINITIONS);

export type ConfusionId = keyof typeof CONFUSIONS;

export function confusionsParFrequence<Id extends string>(
  confusions: Iterable<Id | null>,
): readonly (readonly [Id, number])[] {
  const comptes = new Map<Id, number>();
  for (const confusion of confusions) {
    if (confusion !== null) {
      comptes.set(confusion, (comptes.get(confusion) ?? 0) + 1);
    }
  }
  return [...comptes.entries()].sort(
    ([premiere, nombrePremiere], [seconde, nombreSeconde]) =>
      nombreSeconde - nombrePremiere || premiere.localeCompare(seconde),
  );
}

export function libelleDeConfusion(id: string): string | null {
  return Object.hasOwn(CONFUSIONS, id)
    ? CONFUSIONS[id as ConfusionId].libelle
    : null;
}

export function libelleLisible(confusion: string | null): string | null {
  return confusion === null
    ? null
    : (libelleDeConfusion(confusion) ?? confusion);
}

export interface DetailLisible {
  cle: string;
  juste: boolean;
  libelleConfusion: string | null;
}

export function detailsLisibles(
  details: readonly {
    readonly cle: string;
    readonly juste: boolean;
    readonly confusion: string | null;
  }[],
): DetailLisible[] {
  return details.map((detail) => ({
    cle: detail.cle,
    juste: detail.juste,
    libelleConfusion: libelleLisible(detail.confusion),
  }));
}
