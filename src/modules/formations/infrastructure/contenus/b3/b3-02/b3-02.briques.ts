import * as moteur from '../../briques';

interface Infographie {
  readonly id: string;
  readonly fichier: string;
  readonly titre: string;
  readonly imageAlt: string;
}

export const DOSSIER_DES_INFOGRAPHIES = '/assets/cours/b3-02/v1';

export const INFOGRAPHIES: readonly Infographie[] = [
  {
    id: 'M2',
    fichier: 'nettoyer-le-texte.webp',
    titre: 'Nettoyer le texte',
    imageAlt:
      'Infographie : une ville en capitales entourée d’espaces passe par SUPPRESPACE puis NOMPROPRE et devient « Bordeaux ».',
  },
  {
    id: 'M3',
    fichier: 'convertir-un-montant.webp',
    titre: 'Du texte au nombre',
    imageAlt:
      'Infographie : un montant en texte perd son symbole et son espace par deux SUBSTITUE, puis CNUM le rend nombre.',
  },
  {
    id: 'M4',
    fichier: 'signaler-par-si-ou.webp',
    titre: 'Signaler, pas corriger',
    imageAlt:
      'Infographie : trois tests passent dans un entonnoir OU ; un seul vrai suffit pour marquer la ligne « À vérifier ».',
  },
  {
    id: 'M5',
    fichier: 'recherchev-quatre-arguments.webp',
    titre: 'RECHERCHEV en quatre questions',
    imageAlt:
      'Infographie : les quatre arguments de RECHERCHEV numérotés, et la ligne AG06 de la table Agences qui rend « Ouest ».',
  },
  {
    id: 'M6',
    fichier: 'additionner-sous-conditions.webp',
    titre: 'Additionner sous conditions',
    imageAlt:
      'Infographie : SOMME.SI.ENS en couleurs, un entonnoir ne laisse passer que les lignes de Rennes en 2026.',
  },
  {
    id: 'M7',
    fichier: 'jours-ouvres.webp',
    titre: 'Compter en jours ouvrés',
    imageAlt:
      'Infographie : un calendrier de mars 2026, week-end grisé, du vendredi de la commande au lundi de la livraison.',
  },
  {
    id: 'M8',
    fichier: 'calendrier-joursem-datedif-temps.webp',
    titre: 'Lire le calendrier',
    imageAlt:
      'Infographie : une semaine numérotée pour JOURSEM, une frise de mois pour DATEDIF, une horloge pour TEMPS.',
  },
  {
    id: 'M9',
    fichier: 'moyenne-ou-mediane.webp',
    titre: 'Moyenne ou médiane ?',
    imageAlt:
      'Infographie : cinq colis dont un délai de 40 jours ; la balance de la moyenne penche, la médiane reste au milieu.',
  },
  {
    id: 'M10',
    fichier: 'tableau-structure.webp',
    titre: 'Un tableau qui grandit',
    imageAlt:
      'Infographie : une plage fixe laisse dehors les lignes collées dessous ; le tableau T_Commandes s’étire pour les prendre.',
  },
  {
    id: 'M11',
    fichier: 'tcd-quatre-zones.webp',
    titre: 'Le TCD en quatre zones',
    imageAlt:
      'Infographie : les quatre zones du volet des champs et un TCD dont la ligne Rennes fait 100 %.',
  },
  {
    id: 'M12',
    fichier: 'graphique-qui-repond.webp',
    titre: 'D’abord la question',
    imageAlt:
      'Infographie : six vignettes associent une question à son graphique ; deux barres, l’axe coupé puis l’axe depuis zéro.',
  },
  {
    id: 'M13',
    fichier: 'ratios-de-sommes.webp',
    titre: 'Un taux, c’est un ratio de sommes',
    imageAlt:
      'Infographie : deux ventes ; le ratio des sommes donne 32,7 %, la moyenne des taux 45 %, barrée.',
  },
  {
    id: 'M14',
    fichier: 'tableau-de-bord.webp',
    titre: 'Lu en trente secondes',
    imageAlt:
      'Infographie : une page de tableau de bord, quatre indicateurs comparés, deux graphiques, un segment relié, des taux en rouge.',
  },
];

function infographieDeLaPage(rang: number): Infographie {
  const infographie = INFOGRAPHIES.at(rang - 1);
  if (infographie === undefined) {
    throw new Error(`aucune infographie pour la page ${rang}`);
  }
  return infographie;
}

export function pageDeFormules(
  socle: moteur.SocleDeLaPage,
  { rang, ...page }: moteur.PageDeSerie & { readonly rang: number },
): moteur.EcranDeRecit {
  return moteur.ecranDImageCommentee(
    socle,
    DOSSIER_DES_INFOGRAPHIES,
    infographieDeLaPage(rang),
    page,
  );
}

interface FicheRecapA4 extends Infographie {
  readonly pdf: string;
}

export const FICHES_RECAP_A4: readonly [FicheRecapA4, FicheRecapA4] = [
  {
    id: 'M15',
    fichier: 'fiche-recap-1.webp',
    pdf: '/assets/cours/b3-02/b3-02-fiche-recap-1.d5d022d7.pdf',
    titre: 'Fiche récap 1 : nettoyer, chercher, additionner',
    imageAlt:
      'Fiche récap 1 sur 2 : nettoyer, chercher, additionner. Nommer la famille du problème, puis écrire sa formule, toujours dans une nouvelle colonne. 1. Nettoyer le texte : SUPPRESPACE(texte) puis NOMPROPRE(texte), « BORDEAUX » entouré d’espaces devient « Bordeaux » ; MAJUSCULE et MINUSCULE changent toute la casse ; NBCAR(texte) compte les caractères, espaces compris. 2. Du texte au nombre : SUBSTITUE deux fois, puis CNUM, « 1 250,00 € » devient 1250,00 puis le nombre 1250 ; un texte se cale à gauche, un nombre à droite ; ESTNUM(valeur) le vérifie. UNICAR(160) : l’espace insécable ; DATEVAL(texte) : une date en texte ; Power Query rejoue le nettoyage. 3. Supprimer les doublons : Données › Supprimer les doublons, toutes les colonnes cochées, sur une copie de l’onglet ; des trois lignes de la commande 41 (Sac 2 80, Lampe 1 35, Sac 2 80), seule la ligne identique partout part, la lampe reste. 4. Signaler : SI(OU(…)), une anomalie suffit ; ET(…), il les faut toutes ; remise 80 % et client C041, ou remise 10 % et client vide : « À vérifier » par OU, « OK » par ET. On signale, on ne corrige pas : la ligne douteuse reste ; SI.CONDITIONS pour plusieurs cas. 5. Chercher : RECHERCHEV(clé;$table$;n°;FAUX), colonne 1 produit, 2 libellé, 3 catégorie : P07 rend Textile (P07 Nappe Textile, P12 Lampe Déco). La clé en première colonne, FAUX pour l’exact. Sinon INDEX(colonne;EQUIV(clé;colonne_clé;0)) ; RECHERCHEX dans Excel 2021 ou 365. 6. Additionner sous conditions : SOMME.SI.ENS(somme;plage1;critère1;…), Lyon 2026 200 et 300 gardées, Lyon 2025 150 et Nice 2026 90 écartées : 500. NB.SI.ENS compte les lignes. Critère de date : ">="&DATE(2026;1;1), la date hors des guillemets, jointe par &. Les pièges : =CNUM(A2) sur « 120 € » donne #VALEUR!, SUBSTITUE d’abord, puis CNUM donne 120 ; ">=DATE(2026;1;1)" dans les guillemets, la somme vaut 0 ; RECHERCHEV(H2;A2:C41;3;FAUX) recopiée sans $, la table glisse et #N/A gagne le bas, d’où $A$2:$C$41 ; doublons cochés sur « cde » seule, 2 lignes sur 3 partent, toutes les colonnes cochées, seule la copie exacte part. Au tableur : =NOMPROPRE(SUPPRESPACE(E2)) ; =CNUM(SUBSTITUE(SUBSTITUE(L2;" €";"");" ";"")) ; =SI(OU(K2>0,5;D2="");"À vérifier";"OK"), une seule anomalie suffit à signaler la ligne ; =RECHERCHEV(H2;Produits!$A$2:$E$41;3;FAUX), la catégorie du produit, table figée ; =INDEX($C$2:$C$41;EQUIV(H2;$A$2:$A$41;0)) ; =SOMME.SI.ENS(D:D;B:B;"Lyon";C:C;">="&DATE(2026;1;1)), le CA de Lyon depuis le 1er janvier 2026.',
  },
  {
    id: 'M16',
    fichier: 'fiche-recap-2.webp',
    pdf: '/assets/cours/b3-02/b3-02-fiche-recap-2.227e5d62.pdf',
    titre: 'Fiche récap 2 : dater, résumer, croiser, montrer',
    imageAlt:
      'Fiche récap 2 sur 2 : dater, résumer, croiser, montrer. Compter en jours ouvrés, choisir le bon résumé, croiser par un tableau, montrer un chiffre comparé. 1. Compter en jours ouvrés : commande le jeudi, livraison le mardi, fin − début = 5 jours mais NB.JOURS.OUVRES − 1 = 3 jours. NB.JOURS.OUVRES(début;fin) − 1 ; SERIE.JOUR.OUVRE(début;5) : la date promise, 5 jours ouvrés plus tard, week-ends sautés. 2. Lire le calendrier : pour lun. 9/11/2026, JOURSEM(date;2) rend 1 et ANNEE(date) rend 2026 ; DATEDIF(15/1/2026;15/4/2026;"M") rend 3 mois. Avec 2 en second argument, lundi vaut 1 et dimanche 7. TEMPS(h;m;s) construit une durée. 3. Moyenne ou médiane ? Délais : 2, 2, 3, 3 et 60 jours, un colis à 60 jours : moyenne 14, médiane 3. MEDIANE(plage) pour un délai typique. MOYENNE suit la valeur extrême, MEDIANE reste au milieu. AGREGAT(12;5;plage) : la médiane sous filtre ; ECARTYPE.STANDARD(plage) : la dispersion. 4. Tableau structuré : Ctrl + L (⌘ + T sur Mac), T_Ventes[montant] ; sous 12/03/2025 80 2025 et 04/02/2026 120 2026, la ligne collée 09/11/2026 60 2026 entre seule. Une formule de colonne se recopie seule : =ANNEE([@[date_vente]]). Classer : EQUATION.RANG, GRANDE.VALEUR ; TRIER, FILTRE, UNIQUE (2021 ou 365). 5. Le tableau croisé dynamique : Filtres annee = 2026, Lignes ville, Colonnes categorie, Valeurs montant en % ligne. Afficher les valeurs › % du total de la ligne : chaque ligne fait 100 %, la part de chaque catégorie dans la ville. Les dates se groupent par Trimestres et Années. 6. Ratios et tableau de bord : vente 1, marge 10 € et CA 20 € ; vente 2, marge 20 € et CA 200 € : 30 ÷ 220, le ratio des sommes, 13,6 %. Taux de marque = Σ marges ÷ Σ CA HT ; un indicateur, toujours avec sa comparaison. Évolution = valeur ÷ même période − 1 ; atteinte = réalisé ÷ objectif ; SOMMEPROD(qtés;prix). Axe depuis 0, barres de données, MFC par formule, segments. Les pièges : du jeudi au mardi, fin − début = 5 jours, alors que NB.JOURS.OUVRES − 1 = 3 jours ouvrés ; délais 2, 2, 3, 3, 60 : 14 jours en moyenne, la médiane : 3 jours, le délai habituel ; taux de 50 % et 10 % : 30 % en moyenne, faux, marges 10 € et 20 €, CA 20 € et 200 € : 30 ÷ 220 ≈ 13,6 % ; 9 mois de 2026 ÷ 12 mois de 2025 − 1, faux, janvier-septembre ÷ janvier-septembre : la même période. Au tableur : =NB.JOURS.OUVRES(B2;C2)-1, le délai en jours ouvrés après la commande ; =SERIE.JOUR.OUVRE(B2;5), la date promise ; =MEDIANE(D2:D200), le délai typique ; =ANNEE([@[date_vente]]), l’année recopiée seule ; =SOMME.SI.ENS(T_Ventes[montant];T_Ventes[annee];2026), le CA 2026 même quand le tableau grandit ; =SOMME(T_Ventes[marge])/SOMME(T_Ventes[montant]), le taux de marque sur les sommes.',
  },
];

export const MEDIAS_DES_INFOGRAPHIES = (
  ...gravures: Parameters<typeof moteur.mediasDesIllustrations>[2][]
) =>
  moteur.mediasDesIllustrations(
    DOSSIER_DES_INFOGRAPHIES,
    [...INFOGRAPHIES, ...FICHES_RECAP_A4].map(
      ({ id, fichier, titre }) => [id, fichier, titre] as const,
    ),
    ...gravures,
  );
