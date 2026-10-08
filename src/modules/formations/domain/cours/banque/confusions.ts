import { typographierEnProfondeur } from '../Typographie';
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
      'Croire que le même pourcentage en sens inverse suffit pour revenir au départ.',
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
      'Ajouter un écart constant là où la situation est proportionnelle.',
  },
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
  'point-moyen-confondu': {
    concept: 'nuage-de-points',
    libelle:
      'Prendre pour point moyen le point du milieu du tableau au lieu du point de coordonnées (x̄ ; ȳ).',
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
      'Inverser les deux séries dans PENTE ou ORDONNEE.ORIGINE, ou prendre la pente pour l’ordonnée à l’origine.',
  },
  'rang-pris-pour-annee': {
    concept: 'prevision',
    libelle:
      'Remplacer x par l’année au lieu de son rang dans l’équation de la droite.',
  },
  'extrapolation-sans-reserve': {
    concept: 'prevision',
    libelle:
      'Prolonger une tendance loin des données observées sans signaler la limite de la prévision.',
  },
  'seuil-mal-arrondi': {
    concept: 'prevision',
    libelle:
      'Arrondir à l’entier inférieur le rang solution d’une inéquation de seuil, au lieu du premier entier qui la vérifie.',
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
      'Nier « x > a » en « x < a » au lieu de « x ≤ a » : la borne est oubliée.',
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
      'Confondre « ajouter toujours le même nombre » (suite arithmétique) et « multiplier toujours par le même nombre » (suite géométrique).',
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
      'Prendre l’annuité pour le capital remboursé : l’amortissement est l’annuité moins les intérêts de l’année.',
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
      'Croire qu’un modèle a e^(kx) croît toujours : il décroît quand k est négatif, en restant positif.',
  },
  'k-confondu-avec-taux': {
    concept: 'fonction-exponentielle',
    libelle:
      'Prendre k pour le taux d’évolution par unité : le coefficient est e^k et le taux e^k − 1.',
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
      'Garder le sens de l’inégalité en divisant par ln q quand q < 1 : ln q est négatif, le sens change.',
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
      'Compter les lignes quand on cherche les commandes : une commande compte autant de lignes que de produits.',
  },
  'libelle-pris-pour-cle': {
    concept: 'cle-et-relation',
    libelle:
      'Relier deux tables par un nom ou une ville au lieu de leur identifiant commun.',
  },
  'suspect-corrige-sans-validation': {
    concept: 'qualite-des-donnees',
    libelle:
      'Corriger seul une donnée douteuse au lieu de la signaler à qui peut la vérifier.',
  },
  'suppression-au-lieu-de-signalement': {
    concept: 'qualite-des-donnees',
    libelle:
      'Supprimer une ligne douteuse au lieu de la mettre de côté avec son motif.',
  },
  'texte-pris-pour-nombre': {
    concept: 'nettoyage',
    libelle:
      'Additionner une colonne dont certains nombres sont du texte : la somme les ignore sans prévenir.',
  },
  'casse-non-normalisee': {
    concept: 'nettoyage',
    libelle:
      'Laisser une même ville s’écrire « Bordeaux » et « BORDEAUX » : Excel les confond, mais Power Query et les autres outils en comptent deux.',
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
      'Agréger une autre période que celle de la question : la table entière au lieu des seuls mois demandés.',
  },
  'commandes-comptees-pour-lignes': {
    concept: 'granularite',
    libelle:
      'Compter une commande quand on cherche ses lignes : une commande de trois produits occupe trois lignes.',
  },
  'type-de-variable-confondu': {
    concept: 'jeu-de-donnees',
    libelle:
      'Ranger une date, une mesure ou un booléen sous un autre type : le type dit le calcul permis.',
  },
  'espaces-non-supprimes': {
    concept: 'nettoyage',
    libelle:
      'Compter « Bordeaux » et « Bordeaux » suivi d’une espace comme deux villes faute de SUPPRESPACE.',
  },
  'part-douteuse-estimee-sans-mesure': {
    concept: 'qualite-des-donnees',
    libelle:
      'Estimer à l’œil la part des lignes fausses ou douteuses au lieu de la mesurer, anomalie par anomalie.',
  },
  'cle-prise-pour-categorie': {
    concept: 'cle-et-relation',
    libelle:
      'Ranger une clé comme agence_id parmi les catégories : elle relie deux tables, et le libellé vit dans la table qu’elle désigne.',
  },
  'correction-certaine-renvoyee-a-un-humain': {
    concept: 'qualite-des-donnees',
    libelle:
      'Renvoyer à un humain une erreur certaine dont la bonne valeur se déduit du fichier : une formule la corrige.',
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
      'Lire un TCD dont un filtre est resté actif ou dont les dates sont groupées sans les années : il ampute ou mêle les périodes.',
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
      'Poser le contrôle sur des données déjà corrigées : il ne compte plus les défauts du fichier reçu, à signaler à son émetteur.',
  },
} as const satisfies Readonly<Record<string, DefinitionConfusion>>;

export const CONFUSIONS = typographierEnProfondeur(DEFINITIONS);

export type ConfusionId = keyof typeof CONFUSIONS;

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
