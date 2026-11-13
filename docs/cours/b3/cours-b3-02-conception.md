# B3-02 · Toutes les formules, puis l’IA analyste — conception de référence (gabarit b3)

> Cahier des charges du deuxième cours « Outils informatiques du manager » du Bachelor 3 (B3GSP).
> Le B3-01 s’est arrêté à l’écran 12 (`B3-01-A1-12-EXEMPLE-NETTOYAGE`) : trop de notions d’un coup,
> pas assez d’explications. Le B3-02 reprend le fil rouge Norvane Équipement là où la classe l’a
> laissé et enseigne **tout** le référentiel Excel du B3-01, formule par formule : chaque page donne
> la syntaxe, un exemple chiffré, le piège courant et, en face de l’infographie, ce que chaque élément
> dessiné devient dans Excel ; chaque exercice se fait pas à
> pas, formules écrites en entier. Une fiche récap rassemble toutes les formules. Puis une heure où
> l’étudiant confie l’analyse à une IA, la guide par son cahier de règles et vérifie ses chiffres
> contre les siens. Ce document ne contient aucun code exécutable ; toute divergence
> d’implémentation est un défaut de l’implémentation.

| Rubrique    | Valeur                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| Date        | 6 novembre 2026                                                                                             |
| Statut      | **Conception validée le 6 novembre 2026** (réponses de Tim au cadrage, § 0)                                 |
| Cours       | `b3-02-formules-et-ia-analyste`                                                                             |
| Gabarit     | `b3` (`docs/cours/cours-gabarit-v3.md` § 8)                                                                 |
| Niveau      | `B3` (`moteur.coursB3`)                                                                                     |
| Titre servi | « Toutes les formules, puis l’IA analyste »                                                                 |
| Séance      | **Mardi 17 novembre 2026, 8 h 30 – 12 h**, B3GSP                                                            |
| Durée       | **180 minutes exactes** : 120 de tableur (actes 1 et 2, 57 et 63 min), 60 d’IA (acte 3), 2 pauses de 15 min |
| Écrans      | **40**, dont 20 écrans catalogue                                                                            |
| Sources     | Jeu fictif Norvane Équipement du B3-01 (graine 20 261 013), ses trois classeurs réutilisés tels quels       |

---

## 0. Synthèse des décisions

Réponses de Tim au cadrage, transmises le 6 novembre 2026 :

- **Q1, l’IA** : au choix de l’étudiant, parmi les IA qui exécutent du code sur un fichier ; il
  déclare l’outil dans le runtime et travaille en binôme s’il n’a pas de compte.
- **Q2, le contenu** : « Il faut garder et que le référentiel soit compris et appliqué. Donc TOUT le
  référentiel Excel. Avec une fiche récap pour TOUTES les formules. Ensuite on fait l’IA. » Rien de
  ce que le B3-01 enseignait après l’écran 12 n’est abandonné.
- **Q3, la recherche** : `RECHERCHEV`, avec l’encadré `RECHERCHEX` ; `INDEX` et `EQUIV` gardent leur
  place sur la page de la recherche et dans la fiche récap.
- **Q4, le fichier de l’IA** : la reprise nettoyée. Les écarts attendus ne viennent plus du
  nettoyage, mais de l’analyse : période, résumé statistique, dénominateur.

Ce qui en découle :

- **2 h de tableur, puis 1 h d’IA.** Acte 1 (57 min) : classer, nettoyer, contrôler, relier,
  additionner. Acte 2 (63 min) : dates, statistiques, tableau structuré, TCD, graphiques, ratios,
  tableau de bord, deux fiches récap. Acte 3 (60 min) : l’IA analyste.
- **Tout tient par des pages de 2 minutes.** Treize pages, une par famille de formules ou par outil,
  chacune une image commentée : l’infographie, et à côté la syntaxe, le piège, l’exemple chiffré,
  puis ce que chaque élément dessiné devient dans Excel. Trois pages au plus d’affilée (6 minutes d’exposition), précédées d’un vote et
  suivies d’un exercice.
- **Exercices allégés, guidés pas à pas.** Chaque consigne numérote les étapes et écrit chaque
  formule en entier, une espace après chaque point-virgule pour qu’elle passe à la ligne sur un
  téléphone (Excel l’accepte) ; les défis du B3-01 disparaissent, et l’exercice du tableau de bord garde trois
  questions sur quatre : l’onglet `Quarantaine` de la reprise se montre à l’ouverture de la reprise
  (A1-09), sans être recompté.
- **Même fil rouge, mêmes classeurs, mêmes chiffres que le B3-01.** L’export brut et les deux
  reprises du B3-01 sont servis tels quels ; chaque valeur attendue est importée de
  `b3-01.donnees.ts`, jamais recopiée.
- **Ce qui est repris du B3-01** : A1-13 (tri des anomalies, mêmes cartes), A1-14 (nettoyage et
  contrôle), A2-02 (les familles, dans la fiche récap), A2-04 (recherche et agrégation), A2-06 et
  A2-07 (dates, médiane, retards), A2-08 à A2-11 (tableau structuré, TCD), A3-01 à A3-05 (graphique
  trompeur, choix du graphique, CA et objectif), A3-06 à A3-09 (tableau de bord, MFC, segments, taux
  de marque), A3-10 (recommandations et leurs quatre histoires), A3-12 (cahier de règles) et A3-11
  (fiche mémo).
- **L’IA en position de data scientist.** Elle reçoit la reprise nettoyée et la consigne de
  l’étudiant, fondée sur son cahier de règles. L’exercice 8 apprend à auditer un rapport d’IA écrit
  pour le cours (noté) ; l’analyse en direct confronte ensuite les chiffres de la vraie IA à ceux des
  exercices 3 à 7 (réponses libres) ; l’IA rédige enfin deux recommandations que l’étudiant garde ou
  corrige (exercice 10).

## 1. Objectifs d’apprentissage et public

### 1.1 Rattachement au programme

Programme B3 « Outils informatiques du manager » 2026-27, séances 1 et 2 « Maîtriser un tableur en
mode avancé », et usage raisonné de l’IA en analyse de données. Cahier des charges de l’évaluation :
cas pratique d’1 heure à la dernière séance, tableur sur 8 points sur 20.

| Point évaluable du cahier des charges    | Écran noté   | Page          |
| ---------------------------------------- | ------------ | ------------- |
| Préparer une base de données             | A1-03, A1-08 | A1-05 à A1-07 |
| Fonctions de recherche                   | A1-13        | A1-10         |
| `NB.SI.ENS`, `SOMME.SI.ENS`, `SOMMEPROD` | A1-13, A2-17 | A1-11, A2-15  |
| `SERIE.JOUR.OUVRE`, `NB.JOURS.OUVRES`    | A2-05        | A2-02         |
| `DATEDIF`, `JOURSEM`, `TEMPS`            | —            | A2-03         |
| TCD, filtres, segments, regroupements    | A2-09        | A2-07, A2-08  |
| Graphique : créer, légender, options     | A2-13        | A2-12         |
| Mise en forme conditionnelle             | A2-17        | A2-16         |
| Calculer par pourcentage                 | A2-09, A2-17 | A2-15         |

### 1.2 Objectifs du cours

À la fin de la séance, l’étudiant sait :

1. classer une anomalie dans la grille 2 × 2 et décider ce qui se corrige seul et ce qui se demande ;
2. nettoyer et contrôler un export avec `SUPPRESPACE`, `NOMPROPRE`, `SUBSTITUE`, `CNUM`, `ESTNUM`,
   `SI`, `OU`, `ET` ;
3. relier deux tables par `RECHERCHEV`, additionner et compter sous conditions par `SOMME.SI.ENS`,
   `NB.SI.ENS` et `DATE` ;
4. compter en jours ouvrés, lire le calendrier (`JOURSEM`, `DATEDIF`, `TEMPS`) et résumer par la
   médiane, y compris sous conditions ;
5. construire un tableau structuré et un TCD filtré, groupé, affiché en % du total de la ligne ;
6. choisir et construire le graphique qui répond à une question, axe depuis zéro ;
7. calculer un taux de marque, une évolution, un taux d’atteinte, et assembler un tableau de bord
   (KPI en contexte, MFC, segments) ;
8. écrire une consigne d’analyse à une IA à partir de son cahier de règles, vérifier ses chiffres
   contre les siens et nommer la cause de chaque écart.

### 1.3 Acquis du B3-01

| Acquis (écrans 1 à 12 du B3-01)               | Réemploi dans le B3-02     |
| --------------------------------------------- | -------------------------- |
| Recopie et référence absolue `$`              | A1-10, A2-16, fiche récap  |
| Observation, variable, clé, granularité       | A1-09, A3-03, fiche récap  |
| Grille faux / suspect × automatique / humain  | A1-01, A1-03, A3-03        |
| Outils du nettoyage, exemple de deux cellules | A1-05 à A1-08, fiche récap |

### 1.4 Public et conditions

B3GSP, Bachelor 3e année. Un poste par étudiant avec Excel 2019 ou plus récent, en français
(séparateur `;`), et une IA qui exécute du code sur un fichier (ChatGPT, Claude, Le Chat, Copilot…),
au compte de l’étudiant ; sans compte, le binôme. Pas de mode papier. Séance de 3 h 30 : 180 minutes
de travail, pause de 15 minutes après l’acte 1 (9 h 27) et après l’acte 2 (10 h 45).

## 2. Architecture

### 2.1 Les trois actes

| Acte | Rôle                                      | Formules ou outils                                                                                                                                                          | Minutes |
| ---- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------: |
| 1    | Nettoyer, contrôler, relier, additionner  | `SUPPRESPACE`, `NOMPROPRE`, `SUBSTITUE`, `CNUM`, `ESTNUM`, `SI`, `OU`, `ET`, `RECHERCHEV`, `SOMME.SI.ENS`, `NB.SI.ENS`, `DATE`                                              |      57 |
| 2    | Dater, résumer, croiser, montrer, décider | `NB.JOURS.OUVRES`, `SERIE.JOUR.OUVRE`, `JOURSEM`, `DATEDIF`, `TEMPS`, `MOYENNE`, `MEDIANE`, `ANNEE`, tableau structuré, TCD, graphiques, `SOMMEPROD`, ratios, MFC, segments |      63 |
| 3    | L’IA analyste                             | consigne, cahier de règles, audit, recommandations                                                                                                                          |      60 |

Horaires indicatifs : acte 1 de 8 h 30 à 9 h 27, acte 2 de 9 h 42 à 10 h 45, acte 3 de 11 h à 12 h.

### 2.2 Le cycle d’une famille de formules

**Réfléchir** (vote non noté de 2 minutes sur une cellule du fichier) → **Comprendre** (une à trois
pages de 2 minutes) → **S’exercer** (exercice noté, corrigé sur place, consigne en étapes
numérotées). Un exemple guidé `fp-worked` précède l’exercice 3, dont le geste (une recherche puis
une somme sous conditions) est le plus long. Chaque exercice annonce
`• Temps : réflexion N min · travail M min · correction K min`.

### 2.3 La page de formules

Image commentée (`moteur.ecranDImageCommentee`, rendu v2 `image-left`), décision de Tim du
6 novembre 2026, revue le 11 et le 12 novembre 2026 : l’infographie de la page à gauche, et à côté,
en texte court, trois paragraphes toujours dans cet ordre, puis trois correspondances :

| Bloc            | Contenu                                                             |
| --------------- | ------------------------------------------------------------------- |
| `Syntaxe :`     | La syntaxe de chaque formule de la page et ce qu’elle rend          |
| `Le piège :`    | Le piège courant, en une phrase                                     |
| `Exemple :`     | L’exemple chiffré, dessiné dans l’infographie, repris en une ligne  |
| Correspondances | Trois lignes « élément de l’infographie → ce qu’il est dans Excel » |

Les correspondances, la même forme qu’aux écrans d’image du B1-03 et du B2-07, remplacent l’ancien
paragraphe `Arguments :`, qu’elles reprennent. Chacune tient sur une ligne, nomme un élément
réellement dessiné, ne redit pas l’exemple et ne donne aucune réponse d’exercice. Avec les quatre
paragraphes et la liste, sept pages sur treize dépassaient la toile, mesuré le 12 novembre 2026. Les
notes formateur de ces pages ne changent pas.

Les chemins de menu complets, les variantes et les formules entières vont aux notes du formateur,
pour que la page tienne sur la toile 1280 × 720 à l’échelle 0,8. Une page d’outil (tableau structuré,
TCD, graphique, tableau de bord) suit la même forme : le geste tient lieu de syntaxe. L’exemple
chiffré d’une page publique ne donne jamais une réponse d’exercice. Les deux cours de l’IA gardent le
rendu `lesson` à quatre blocs.

### 2.4 Les classeurs

| Classeur (B3-01, inchangé)           | Servi sur | Diffusion | Reprend                    |
| ------------------------------------ | --------- | --------- | -------------------------- |
| `B3-01_export_ventes.dfa709a7.xlsx`  | A1-02     | catalogue | —                          |
| `B3-01_reprise_acte_2.e6fc9b7d.xlsx` | A1-09     | seance    | A1-03, A1-08               |
| `B3-01_reprise_acte_3.72ace752.xlsx` | A2-11     | seance    | A1-03, A1-08, A1-13, A2-05 |
| `B3-01_reprise_acte_2.e6fc9b7d.xlsx` | A3-06     | seance    | A1-03, A1-08               |

Tout le monde ouvre la reprise, y compris ceux qui ont tout réussi : les résultats se comparent sur
une même base. Les exercices 3 à 5 se font dans la reprise de l’acte 2, colonnes ajoutées par
l’étudiant (N `region`, O `categorie`, P `delai`, Q `date_promise`, R colonne d’aide de la médiane,
puis, à l’exercice 5, le tableau `T_Commandes` et sa colonne calculée S `annee`) ; les retards se
comptent sur `delai` par `NB.SI.ENS` (`">5"`, équivalent à « après la date promise » pour une
commande passée un jour ouvré, comme toutes celles de la reprise) ; les
exercices 6 et 7 dans la reprise de l’acte 3, dont `T_Commandes` porte déjà `annee`, `region`,
`categorie`, `cout`, `marge`, `delai_ouvre`, `date_promise` et `en_retard`. L’IA reçoit la reprise
de l’acte 2 : la reprise nettoyée.

### 2.5 Le cahier de règles

Chaque correction d’exercice des actes 1 et 2 dit sa règle ; la page A3-03 les rassemble en six
règles, que la consigne de l’IA reprend mot pour mot :

1. Je relie les tables par un identifiant, jamais par un libellé.
2. Je corrige seul ce qui est faux et certain ; je signale ce qui est douteux, je ne supprime rien.
3. J’écris la période dans chaque critère, la même pour le chiffre et pour sa comparaison.
4. Pour un délai typique je prends la médiane ; pour un taux, le ratio des sommes.
5. J’écris le dénominateur de chaque pourcentage.
6. Je montre la méthode de chaque chiffre et le nombre de lignes retenues.

### 2.6 Diffusion

Catalogue : la reprise et son export brut, les treize pages, le graphique trompeur, les deux fiches récap,
les deux pages de l’IA et la fiche mémo. Tout le reste est servi en séance, dont les reprises.
Aucun écran catalogue ne porte une réponse d’exercice.

### 2.7 Notation

Fonctions en français et en majuscules, arguments séparés par `;`. Montants arrondis à l’euro
(tolérance 1 €), pourcentages au dixième (tolérance 0,1 point), comptages exacts : les tolérances du
B3-01, importées. L’étudiant saisit le nombre seul ; l’énoncé le rappelle.

## 3. Déroulé écran par écran

### 3.1 Vue d’ensemble

Identifiants : `B3-02-A{acte}-{rang}-{SLUG}`. « I » = interactif. « Q » = questions fermées notées.

| Rang | Identifiant                         | Min | Brique · rendu               |  I  |   Q | Diffusion |
| ---: | ----------------------------------- | --: | ---------------------------- | :-: | --: | --------- |
|    1 | B3-02-A1-01-RAPPEL-GRILLE           |   2 | `fp-recall`                  |  I  |   1 | seance    |
|    2 | B3-02-A1-02-REPRISE                 |   1 | `fp-story` · v2 `hero`       |     |   0 | catalogue |
|    3 | B3-02-A1-03-TRI-ANOMALIES           |   8 | `fp-cardsort`                |  I  |   1 | seance    |
|    4 | B3-02-A1-04-VOTE-ESPACES            |   2 | `fp-vote`                    |  I  |   0 | seance    |
|    5 | B3-02-A1-05-FORMULES-TEXTE          |   2 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    6 | B3-02-A1-06-FORMULES-NOMBRE         |   2 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    7 | B3-02-A1-07-FORMULES-CONTROLE       |   2 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    8 | B3-02-A1-08-ATELIER-NETTOYAGE       |  15 | `questionnaire`              |  I  |   3 | seance    |
|    9 | B3-02-A1-09-VOTE-RELIER             |   2 | `fp-vote`                    |  I  |   0 | seance    |
|   10 | B3-02-A1-10-FORMULE-RECHERCHE       |   2 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   11 | B3-02-A1-11-FORMULES-SOMME-SI       |   2 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   12 | B3-02-A1-12-EXEMPLE-RECHERCHE       |   4 | `fp-worked`                  |  I  |   0 | seance    |
|   13 | B3-02-A1-13-ATELIER-RECHERCHE       |  13 | `questionnaire`              |  I  |   2 | seance    |
|   14 | B3-02-A2-01-VOTE-DELAI              |   2 | `fp-vote`                    |  I  |   0 | seance    |
|   15 | B3-02-A2-02-FORMULES-JOURS-OUVRES   |   2 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   16 | B3-02-A2-03-FORMULES-CALENDRIER     |   2 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   17 | B3-02-A2-04-FORMULES-MEDIANE        |   2 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   18 | B3-02-A2-05-ATELIER-DELAIS          |   9 | `questionnaire`              |  I  |   2 | seance    |
|   19 | B3-02-A2-06-VOTE-NOUVELLES-LIGNES   |   2 | `fp-vote`                    |  I  |   0 | seance    |
|   20 | B3-02-A2-07-OUTIL-TABLEAU-STRUCTURE |   2 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   21 | B3-02-A2-08-OUTIL-TCD               |   2 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   22 | B3-02-A2-09-ATELIER-TCD             |   9 | `questionnaire`              |  I  |   2 | seance    |
|   23 | B3-02-A2-10-GRAPHIQUE-TROMPEUR      |   1 | `fp-story` · v2 `chart`      |     |   0 | catalogue |
|   24 | B3-02-A2-11-VOTE-GRAPHIQUE          |   2 | `fp-vote`                    |  I  |   0 | seance    |
|   25 | B3-02-A2-12-OUTIL-GRAPHIQUES        |   2 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   26 | B3-02-A2-13-ATELIER-GRAPHIQUES      |   8 | `questionnaire`              |  I  |   2 | seance    |
|   27 | B3-02-A2-14-VOTE-TRENTE-SECONDES    |   2 | `fp-vote`                    |  I  |   0 | seance    |
|   28 | B3-02-A2-15-FORMULES-RATIOS         |   2 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   29 | B3-02-A2-16-OUTIL-TABLEAU-DE-BORD   |   2 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   30 | B3-02-A2-17-ATELIER-DASHBOARD       |  10 | `questionnaire`              |  I  |   3 | seance    |
|   31 | B3-02-A2-18-FICHE-RECAP-1           |   1 | `fp-story` · v2 `grid`       |     |   0 | catalogue |
|   32 | B3-02-A2-19-FICHE-RECAP-2           |   1 | `fp-story` · v2 `grid`       |     |   0 | catalogue |
|   33 | B3-02-A3-01-VOTE-IA                 |   3 | `fp-vote`                    |  I  |   0 | seance    |
|   34 | B3-02-A3-02-COURS-IA-ANALYSTE       |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   35 | B3-02-A3-03-COURS-CAHIER-DE-REGLES  |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   36 | B3-02-A3-04-AUDIT-RAPPORT-IA        |  11 | `fp-cardsort`                |  I  |   1 | seance    |
|   37 | B3-02-A3-05-DEFI-CONSIGNE           |   7 | `fp-challenge`               |  I  |   0 | seance    |
|   38 | B3-02-A3-06-ANALYSE-IA              |  18 | `fp-pro`                     |  I  |   0 | seance    |
|   39 | B3-02-A3-07-RECOMMANDATIONS         |  12 | `fp-pro`                     |  I  |   0 | seance    |
|   40 | B3-02-A3-08-FICHE-MEMO              |   3 | `fp-story` · v2 `grid`       |     |   0 | catalogue |

Somme : 57 + 63 + 60 = 180. Rythme : 141 minutes interactives, 39 d’exposition, exposition continue
de 6 minutes au plus (A1-05 à A1-07, A2-02 à A2-04, A3-02 + A3-03). Dix-sept questions notées. Les
pages tiennent sur une toile de 1 280 × 720 à l’échelle 0,8 au moins : chaque bloc reste court,
les chemins de menu complets vont aux notes du formateur.

### 3.2 Acte 1 — Nettoyer, contrôler, relier, additionner (57 min)

#### A1-01 · `B3-02-A1-01-RAPPEL-GRILLE` — 2 min · `fp-recall` · séance

- Titre public : « Rappel : la grille de la qualité »
- Pendant que les postes rejoignent. `b3-02-a1-rappel-grille` : une ligne porte une quantité de −2 ;
  dans quelle case de la grille ? Bonne : suspect · à demander à un humain ; pièges faux · correction
  automatique (`suspect-corrige-sans-validation`), faux · à demander à un humain
  (`donnee-douteuse-jugee-fausse`).

#### A1-02 · `B3-02-A1-02-REPRISE` — 1 min · v2 `hero` · catalogue

- Titre public : « Toutes les formules, puis l’IA analyste »
- Nadia Ferrand attend toujours son analyse ; on reprend l’export là où on l’a laissé. Fond : la
  gravure Hollerith du B3-01. Pièce jointe publique : l’export brut du B3-01.

#### A1-03 · `B3-02-A1-03-TRI-ANOMALIES` — 8 min · `fp-cardsort` · séance

- Titre public : « Exercice 1 — Classer les anomalies »
- Temps : réflexion 1 min · travail 6 min · correction 1 min.
- Les dix cartes, les quatre cases, les confusions et la correction de `B3-01-A1-13-TRI-ANOMALIES`,
  importées. Règle dite à la correction : la règle 2.

#### A1-04 · `B3-02-A1-04-VOTE-ESPACES` — 2 min · `fp-vote` · séance

- Titre public : « Vote : des espaces invisibles »
- E783 contient « Bordeaux » entouré d’une espace de chaque côté. Que rend `=E783="Bordeaux"` ? FAUX
  (bonne) ; VRAI (`espaces-non-supprimes`).

#### A1-05 · `B3-02-A1-05-FORMULES-TEXTE` — 2 min · v2 `image-left` · catalogue

- Titre public : « Formules : SUPPRESPACE et NOMPROPRE »
- Syntaxe `=SUPPRESPACE(texte)`, `=NOMPROPRE(texte)` ; correspondances des pastilles 1 et 2 ; exemple
  `=NOMPROPRE(SUPPRESPACE("  BORDEAUX "))` rend « Bordeaux » ; piège : écrire dans la colonne brute,
  compter les lignes avec l’en-tête, dédoublonner sur une seule colonne.

#### A1-06 · `B3-02-A1-06-FORMULES-NOMBRE` — 2 min · v2 `image-left` · catalogue

- Titre public : « Formules : SUBSTITUE, CNUM et ESTNUM »
- Syntaxe et correspondances ; exemple « 1 150,00 € » → 1150 ; piège : `CNUM` avant `SUBSTITUE`, espace
  insécable `UNICAR(160)`, `SOMME` qui ignore un montant en texte.

#### A1-07 · `B3-02-A1-07-FORMULES-CONTROLE` — 2 min · v2 `image-left` · catalogue

- Titre public : « Formules : SI, OU et ET »
- Syntaxe, correspondances, exemple sur une ligne inventée et dite telle ; piège : `ET` au lieu de `OU`,
  guillemets oubliés, contrôle posé sur des données déjà corrigées.

#### A1-08 · `B3-02-A1-08-ATELIER-NETTOYAGE` — 15 min · `questionnaire` · séance

- Titre public : « Exercice 2 — Nettoyer et contrôler l’export »
- Temps : réflexion 1 min · travail 12 min · correction 2 min.
- Cinq étapes numérotées : copier l’onglet, colonnes N et O, Supprimer les doublons, colonne de
  contrôle en P, compter.
- `b3-02-a1-lignes-uniques`, `b3-02-a1-ca-total`, `b3-02-a1-a-verifier`.
- Règles dites à la correction : 2, puis 1 avant la reprise.

#### A1-09 · `B3-02-A1-09-VOTE-RELIER` — 2 min · `fp-vote` · séance

- Titre public : « Vote : où lire la catégorie ? »
- Pièce jointe réservée : la reprise de l’acte 2. Une ligne dit `produit_id` = P012 ; où lire sa
  catégorie ? Dans `Produits`, sur la ligne de P012 (bonne) ; dans le libellé du produit
  (`libelle-pris-pour-cle`) ; dans la ville du client (`libelle-pris-pour-cle`).

#### A1-10 · `B3-02-A1-10-FORMULE-RECHERCHE` — 2 min · v2 `image-left` · catalogue

- Titre public : « Formule : RECHERCHEV »
- `=RECHERCHEV(valeur_cherchée;table;n°_colonne;FAUX)` ; exemple sur `Agences` (AG06 → Ouest) ;
  piège : la table non figée glisse ; encadré `RECHERCHEX` (Excel 2021 ou 365) et `INDEX`/`EQUIV`.

#### A1-11 · `B3-02-A1-11-FORMULES-SOMME-SI` — 2 min · v2 `image-left` · catalogue

- Titre public : « Formules : SOMME.SI.ENS, NB.SI.ENS et DATE »
- Syntaxe et correspondances ; exemple : les lignes de Marseille à plus de 15 % de remise, compte du
  B3-01 (`DEFIS_B3_01`) ; piège : `DATE` dans les guillemets, `">15"` pour un taux, période oubliée.

#### A1-12 · `B3-02-A1-12-EXEMPLE-RECHERCHE` — 4 min · `fp-worked` · séance

- Titre public : « Exemple guidé : relier puis additionner »
- Trois étapes sur Lille en mobilier : la colonne `region`, la colonne `categorie`, la somme sous
  conditions. Rappel des formules visible dès l’ouverture.

#### A1-13 · `B3-02-A1-13-ATELIER-RECHERCHE` — 13 min · `questionnaire` · séance

- Titre public : « Exercice 3 — Relier et additionner »
- Temps : réflexion 1 min · travail 10 min · correction 2 min.
- `b3-02-a1-ca-rennes-info`, `b3-02-a1-ca-ouest`. Règles dites : 1 et 3, puis pause.

### 3.3 Acte 2 — Dater, résumer, croiser, montrer, décider (63 min)

#### A2-01 · `B3-02-A2-01-VOTE-DELAI` — 2 min · `fp-vote` · séance

- Titre public : « Vote : vendredi, lundi »
- Commande le vendredi, livraison le lundi : 1 jour ouvré (bonne) ; 3 (`jours-calendaires-pour-ouvres`) ;
  2 (`bornes-comptees-dans-le-delai`).

#### A2-02 · `B3-02-A2-02-FORMULES-JOURS-OUVRES` — 2 min · v2 `image-left` · catalogue

- Titre public : « Formules : NB.JOURS.OUVRES et SERIE.JOUR.OUVRE »
- Exemple : commande le vendredi 6 mars 2026, livraison le lundi 9 ; date promise le vendredi 13.

#### A2-03 · `B3-02-A2-03-FORMULES-CALENDRIER` — 2 min · v2 `image-left` · catalogue

- Titre public : « Formules : JOURSEM, DATEDIF et TEMPS »
- Exemple : `JOURSEM` d’un vendredi, 20 mois entiers du 2 janvier 2025 au 30 septembre 2026,
  `TEMPS(27;0;0)`.

#### A2-04 · `B3-02-A2-04-FORMULES-MEDIANE` — 2 min · v2 `image-left` · catalogue

- Titre public : « Formules : MOYENNE, MEDIANE et la médiane sous conditions »
- Exemple : délais 1, 2, 2, 3 et 40 jours, moyenne 9,6, médiane 2 ; la colonne d’aide et `AGREGAT`.

#### A2-05 · `B3-02-A2-05-ATELIER-DELAIS` — 9 min · `questionnaire` · séance

- Titre public : « Exercice 4 — Délais et retards »
- Temps : réflexion 1 min · travail 6 min · correction 2 min.
- `b3-02-a2-delai-strasbourg`, `b3-02-a2-retards`. Règle dite : 4.

#### A2-06 · `B3-02-A2-06-VOTE-NOUVELLES-LIGNES` — 2 min · `fp-vote` · séance

- Titre public : « Vote : 200 lignes de plus »
- Les formules écrites sur A2:A4039 voient-elles 200 lignes collées dessous ? Non (bonne) ; oui,
  seulement après recalcul (`plage-fixe-au-lieu-de-tableau`).

#### A2-07 · `B3-02-A2-07-OUTIL-TABLEAU-STRUCTURE` — 2 min · v2 `image-left` · catalogue

- Titre public : « Outil : le tableau structuré et ANNEE »

#### A2-08 · `B3-02-A2-08-OUTIL-TCD` — 2 min · v2 `image-left` · catalogue

- Titre public : « Outil : le tableau croisé dynamique »

#### A2-09 · `B3-02-A2-09-ATELIER-TCD` — 9 min · `questionnaire` · séance

- Titre public : « Exercice 5 — Le TCD de la direction »
- Temps : réflexion 1 min · travail 6 min · correction 2 min.
- `b3-02-a2-part-info-rennes`, `b3-02-a2-meilleur-trimestre` (vote noté). Règle dite : 5.

#### A2-10 · `B3-02-A2-10-GRAPHIQUE-TROMPEUR` — 1 min · v2 `chart` · catalogue

- Titre public : « Un graphique de la direction »
- Le graphique trompeur du B3-01 (Rennes et Nantes, CA 2025, axe tronqué), importé.

#### A2-11 · `B3-02-A2-11-VOTE-GRAPHIQUE` — 2 min · `fp-vote` · séance

- Titre public : « Vote : que décidez-vous ? »
- Pièce jointe réservée : la reprise de l’acte 3. Rennes a-t-elle vendu trois fois moins que
  Nantes ? Non, l’axe est tronqué (bonne) ; oui, impossible à dire (`axe-tronque-lu-comme-ecart`).

#### A2-12 · `B3-02-A2-12-OUTIL-GRAPHIQUES` — 2 min · v2 `image-left` · catalogue

- Titre public : « Outil : le graphique qui répond à une question »

#### A2-13 · `B3-02-A2-13-ATELIER-GRAPHIQUES` — 8 min · `questionnaire` · séance

- Titre public : « Exercice 6 — CA et objectif par agence »
- Temps : réflexion 1 min · travail 5 min · correction 2 min.
- `b3-02-a2-agences-sous-objectif`, `b3-02-a2-atteinte-rennes`.

#### A2-14 · `B3-02-A2-14-VOTE-TRENTE-SECONDES` — 2 min · `fp-vote` · séance

- Titre public : « Vote : trente secondes »
- Nadia a trente secondes avant le comité : quatre chiffres, chacun avec sa comparaison (bonne) ; le
  tableau de toutes les lignes (`detail-au-lieu-de-synthese`) ; dix graphiques
  (`graphique-sans-question`) ; quatre chiffres sans comparaison (`kpi-sans-contexte`).

#### A2-15 · `B3-02-A2-15-FORMULES-RATIOS` — 2 min · v2 `image-left` · catalogue

- Titre public : « Formules : taux de marque, évolution, taux d’atteinte et SOMMEPROD »
- Exemple : 1 000 € à 30 % et 100 € à 60 % : 32,7 % de taux de marque, 45 % en moyenne des taux.

#### A2-16 · `B3-02-A2-16-OUTIL-TABLEAU-DE-BORD` — 2 min · v2 `image-left` · catalogue

- Titre public : « Outil : tableau de bord, MFC et segments »

#### A2-17 · `B3-02-A2-17-ATELIER-DASHBOARD` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 7 — Le tableau de bord Direction »
- Temps : réflexion 1 min · travail 7 min · correction 2 min.
- `b3-02-a2-evolution`, `b3-02-a2-ca-2026`, `b3-02-a2-marge-marseille`. Règle dite : 6.

#### A2-18 · `B3-02-A2-18-FICHE-RECAP-1` — 1 min · v2 `grid` · catalogue

- Titre public : « Fiche récap 1 : nettoyer, chercher, additionner »
- Six cartes : texte, nombre et date en texte, doublons, comparer et signaler, chercher, additionner
  et compter. Chaque carte donne, pour chaque formule, sa syntaxe et le piège de la famille. Elle
  porte aussi les formules que le B3-01 ne faisait que citer : `INDEX` et `EQUIV`, `RECHERCHEX`,
  `SI.CONDITIONS`, `DATEVAL`, `NBCAR`, `MAJUSCULE`, `MINUSCULE`, Power Query. Imprimable.

#### A2-19 · `B3-02-A2-19-FICHE-RECAP-2` — 1 min · v2 `grid` · catalogue

- Titre public : « Fiche récap 2 : dater, résumer, croiser, montrer »
- Six cartes : dates, résumer, classer et filtrer, croiser, ratios, montrer ; avec `EQUATION.RANG`,
  `GRANDE.VALEUR`, `TRIER`, `FILTRE`, `UNIQUE`, `ECARTYPE.STANDARD`, `AGREGAT`. Une seule fiche de
  douze cartes ne tenait pas sur la toile : les cartes se chevauchaient. Imprimable.

### 3.4 Acte 3 — L’IA analyste (60 min)

#### A3-01 · `B3-02-A3-01-VOTE-IA` — 3 min · `fp-vote` · séance

- Titre public : « Vote : le chiffre d’une IA »
- Une IA annonce 10 jours de délai à Strasbourg en 2026. Je compare au mien et je lis sa méthode
  (bonne) ; je le reprends tel quel (`ia-crue-sur-parole`) ; je le jette, une IA se trompe
  toujours (`ia-rejetee-sans-comparaison`).

#### A3-02 · `B3-02-A3-02-COURS-IA-ANALYSTE` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : une IA qui analyse vos données »
- Ce qu’elle fait, ce qu’elle ignore ; la consigne en cinq parties ; une consigne hors dossier ; un
  chiffre de l’IA n’est vrai que vérifié.

#### A3-03 · `B3-02-A3-03-COURS-CAHIER-DE-REGLES` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : le cahier de règles de l’analyste »
- Les six règles du § 2.5 et les trois contrôles : recompter, refaire un chiffre, lire la méthode.

#### A3-04 · `B3-02-A3-04-AUDIT-RAPPORT-IA` — 11 min · `fp-cardsort` · séance

- Titre public : « Exercice 8 — Auditer le rapport d’une IA »
- Temps : réflexion 2 min · travail 7 min · correction 2 min.
- Le rapport d’une IA sur la reprise nettoyée, écrit pour ce cours et dit tel. Huit affirmations à
  classer en quatre cases : juste (le chiffre de l’exercice) ; faux, période (règle 3) ; faux, résumé
  (règle 4) ; faux, dénominateur (règle 5). Les chiffres faux sont des pièges du B3-01, importés.

#### A3-05 · `B3-02-A3-05-DEFI-CONSIGNE` — 7 min · `fp-challenge` · séance

- Titre public : « Exercice 9 — Votre consigne à l’IA »
- Temps : réflexion 1 min · travail 4 min · correction 2 min.
- L’étudiant écrit sa consigne ; il la compare aux cinq parties de référence et à une consigne
  fausse, qui fait tout corriger.

#### A3-06 · `B3-02-A3-06-ANALYSE-IA` — 18 min · `fp-pro` · séance

- Titre public : « L’IA au travail : ses chiffres contre les vôtres »
- Pièce jointe réservée : la reprise de l’acte 2. L’étudiant donne le fichier et sa consigne à son IA,
  lui pose sept questions des exercices 3 à 7, celles dont l’écart relève des règles 3 à 5 :
  `ca-rennes-info`, `delai-strasbourg`, `retards`, `part-info-rennes`, `atteinte-rennes`,
  `evolution`, `marge-marseille`. Il note, pour chacune, son chiffre, celui de l’IA et la règle en
  cause. Trois réponses libres, pour que l’écran tienne sans défiler : l’outil (et le binôme s’il y
  a lieu), les sept lignes de chiffres, puis le bilan des écarts.

#### A3-07 · `B3-02-A3-07-RECOMMANDATIONS` — 12 min · `fp-pro` · séance

- Titre public : « Exercice 10 — Vos recommandations au comité »
- Temps : réflexion 1 min · travail 9 min · correction 2 min.
- L’IA propose deux recommandations ; l’étudiant les garde ou les corrige, constat chiffré → cause →
  action, et dit ce qu’il lui confierait. Correction sur place : les quatre histoires du B3-01,
  importées.

#### A3-08 · `B3-02-A3-08-FICHE-MEMO` — 3 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : l’IA analyste »
- La consigne en cinq parties, les six règles, les trois contrôles. Imprimable.

## 4. Le jeu de données

Le jeu du B3-01 (§ 4 de `cours-b3-01-conception.md`), sans changement : mêmes onglets, mêmes
anomalies, mêmes histoires, même graine, mêmes classeurs. Aucun générateur ni classeur nouveau.

## 5. Contenus

### 5.1 Les valeurs attendues

Chaque valeur, chaque tolérance et chaque piège sont importés de `b3-01.donnees.ts`, que
`b3-01.donnees.spec.ts` recalcule depuis la graine ; `b3-02.cours.spec.ts` vérifie que chaque
question du B3-02 sert ceux de sa question source.

| Question B3-02                   | Question source B3-01            |    Valeur |
| -------------------------------- | -------------------------------- | --------: |
| `b3-02-a1-lignes-uniques`        | `b3-01-a1-lignes-uniques`        |     4 098 |
| `b3-02-a1-ca-total`              | `b3-01-a1-ca-total`              | 1 340 208 |
| `b3-02-a1-a-verifier`            | `b3-01-a1-a-verifier`            |        85 |
| `b3-02-a1-ca-rennes-info`        | `b3-01-a2-ca-rennes-info`        |     8 342 |
| `b3-02-a1-ca-ouest`              | `b3-01-a2-ca-ouest`              |    77 850 |
| `b3-02-a2-delai-strasbourg`      | `b3-01-a2-delai-strasbourg`      |         8 |
| `b3-02-a2-retards`               | `b3-01-a2-retards`               |        99 |
| `b3-02-a2-part-info-rennes`      | `b3-01-a2-part-info-rennes`      |      27,2 |
| `b3-02-a2-meilleur-trimestre`    | `b3-01-a2-meilleur-trimestre`    |   T4 2025 |
| `b3-02-a2-agences-sous-objectif` | `b3-01-a3-agences-sous-objectif` |         3 |
| `b3-02-a2-atteinte-rennes`       | `b3-01-a3-atteinte-rennes`       |      79,0 |
| `b3-02-a2-evolution`             | `b3-01-a3-evolution`             |       8,6 |
| `b3-02-a2-ca-2026`               | `b3-01-a3-ca-2026`               |   575 046 |
| `b3-02-a2-marge-marseille`       | `b3-01-a3-marge-marseille`       |      26,9 |

Le rapport d’IA de l’exercice 8 cite deux valeurs justes (79,0 % et 99 lignes) et six pièges du
B3-01 : 27 862 € (période), −22,1 % (année pleine), 10 jours (moyenne), 28,7 % (moyenne des taux),
1,5 % (total du réseau), 36,9 % (marge de Marseille ÷ coût d’achat).

### 5.2 Concepts, confusions et remédiations

Concepts : ceux du B3-01, plus `ia-analyste`. Deux confusions nouvelles, `ia-crue-sur-parole` et
`ia-rejetee-sans-comparaison` ; toutes les autres viennent de la banque.

| Identifiant                                | Concept                   | Libellé                                                                | Remédiation                         |
| ------------------------------------------ | ------------------------- | ---------------------------------------------------------------------- | ----------------------------------- |
| `suspect-corrige-sans-validation`          | qualite-des-donnees       | Corriger seul une donnée douteuse.                                     | B3-02-A1-07-FORMULES-CONTROLE       |
| `donnee-douteuse-jugee-fausse`             | qualite-des-donnees       | Déclarer fausse une donnée inhabituelle mais possible.                 | B3-02-A1-07-FORMULES-CONTROLE       |
| `correction-certaine-renvoyee-a-un-humain` | qualite-des-donnees       | Renvoyer à un humain une erreur qu’une formule corrige.                | B3-02-A1-07-FORMULES-CONTROLE       |
| `erreur-certaine-jugee-douteuse`           | qualite-des-donnees       | Juger douteuse une donnée qui viole une règle du fichier.              | B3-02-A1-07-FORMULES-CONTROLE       |
| `controle-apres-correction`                | qualite-des-donnees       | Poser le contrôle sur des données déjà corrigées.                      | B3-02-A1-07-FORMULES-CONTROLE       |
| `espaces-non-supprimes`                    | nettoyage                 | Compter deux villes faute de SUPPRESPACE.                              | B3-02-A1-05-FORMULES-TEXTE          |
| `doublons-supprimes-sur-une-colonne`       | nettoyage                 | Dédoublonner sur une seule colonne.                                    | B3-02-A1-05-FORMULES-TEXTE          |
| `en-tete-compte-comme-ligne`               | jeu-de-donnees            | Compter l’en-tête parmi les lignes.                                    | B3-02-A1-05-FORMULES-TEXTE          |
| `texte-pris-pour-nombre`                   | nettoyage                 | Additionner des nombres restés en texte.                               | B3-02-A1-06-FORMULES-NOMBRE         |
| `libelle-pris-pour-cle`                    | cle-et-relation           | Relier deux tables par un libellé.                                     | B3-02-A1-10-FORMULE-RECHERCHE       |
| `plage-recherche-non-figee`                | recherche-dans-une-table  | Recopier une recherche sans figer la table.                            | B3-02-A1-10-FORMULE-RECHERCHE       |
| `critere-mal-ecrit`                        | agregation-conditionnelle | Écrire DATE dans les guillemets, ou 15 pour 15 %.                      | B3-02-A1-11-FORMULES-SOMME-SI       |
| `periode-mal-delimitee`                    | agregation-conditionnelle | Agréger toute la table au lieu de la période.                          | B3-02-A1-11-FORMULES-SOMME-SI       |
| `jours-calendaires-pour-ouvres`            | calcul-sur-dates          | Soustraire deux dates quand on compte des jours ouvrés.                | B3-02-A2-02-FORMULES-JOURS-OUVRES   |
| `bornes-comptees-dans-le-delai`            | calcul-sur-dates          | Garder NB.JOURS.OUVRES sans le − 1.                                    | B3-02-A2-02-FORMULES-JOURS-OUVRES   |
| `valeur-extreme-ignoree`                   | choix-du-resume           | Résumer par la moyenne une série tirée par une valeur extrême.         | B3-02-A2-04-FORMULES-MEDIANE        |
| `mediane-sur-liste-trop-large`             | indicateur-statistique    | Médiane d’une liste trop large.                                        | B3-02-A2-04-FORMULES-MEDIANE        |
| `plage-fixe-au-lieu-de-tableau`            | tableau-croise-dynamique  | Construire sur une plage fixe.                                         | B3-02-A2-07-OUTIL-TABLEAU-STRUCTURE |
| `pourcentage-du-mauvais-total`             | tableau-croise-dynamique  | Afficher le % du total général au lieu du % de la ligne.               | B3-02-A2-08-OUTIL-TCD               |
| `pourcentage-du-total-de-colonne`          | tableau-croise-dynamique  | Afficher le % de la colonne au lieu du % de la ligne.                  | B3-02-A2-08-OUTIL-TCD               |
| `tcd-filtre-ou-dates-mal-groupees`         | tableau-croise-dynamique  | Lire un TCD au filtre oublié ou aux dates sans années.                 | B3-02-A2-08-OUTIL-TCD               |
| `axe-tronque-lu-comme-ecart`               | lecture-graphique         | Juger un écart à la hauteur des barres d’un axe tronqué.               | B3-02-A2-12-OUTIL-GRAPHIQUES        |
| `graphique-sans-question`                  | choix-du-graphique        | Choisir un graphique avant sa question.                                | B3-02-A2-12-OUTIL-GRAPHIQUES        |
| `objectif-annuel-pour-cumul`               | tableau-de-bord           | Comparer neuf mois à tous les objectifs.                               | B3-02-A2-15-FORMULES-RATIOS         |
| `evolution-sur-annee-pleine`               | tableau-de-bord           | Comparer neuf mois de 2026 à douze mois de 2025.                       | B3-02-A2-15-FORMULES-RATIOS         |
| `moyenne-simple-des-taux`                  | moyenne-ponderee          | Faire la moyenne simple de taux.                                       | B3-02-A2-15-FORMULES-RATIOS         |
| `marque-confondue-avec-marge`              | pourcentage               | Diviser la marge par le coût d’achat pour un taux de marque.           | B3-02-A2-15-FORMULES-RATIOS         |
| `kpi-sans-contexte`                        | tableau-de-bord           | Afficher un chiffre sans comparaison.                                  | B3-02-A2-16-OUTIL-TABLEAU-DE-BORD   |
| `detail-au-lieu-de-synthese`               | tableau-de-bord           | Montrer le détail là où la décision attend une synthèse.               | B3-02-A2-16-OUTIL-TABLEAU-DE-BORD   |
| `ia-crue-sur-parole`                       | ia-analyste               | Reprendre un chiffre d’IA sans le comparer au sien ni lire sa méthode. | B3-02-A3-03-COURS-CAHIER-DE-REGLES  |
| `ia-rejetee-sans-comparaison`              | ia-analyste               | Juger faux un chiffre d’IA sans l’avoir comparé au sien.               | B3-02-A3-03-COURS-CAHIER-DE-REGLES  |

## 6. Fonctionnalités

Aucune brique ni règle nouvelle du moteur : le cours s’écrit avec `contenus/briques.ts` et passe
`verifierStructure` au gabarit `b3`. Le B3-01 exporte ce que le B3-02 réutilise (tri des anomalies,
graphique trompeur, quatre histoires, question chiffrée d’une question source) ; son contenu publié
et son instantané ne changent pas.

## 7. Front

Instantané, montage `montage-b3-02.spec.ts`, entrée de `COURS_EN_SEANCE`, carte de la liste des
formations, entrée SEO, XLF fr et en.

## 8. Médias

### 8.1 Principe

Treize infographies, une par page de formules ou d’outil, briefées dans
`illustrations-b3-02/prompts.md` : chacune est l’image de sa page, rendue en image commentée
(décision de Tim, 6 novembre 2026). Chaque PNG d’origine (1 536 × 1 024 px) est converti en WebP de
même taille et servi depuis `/assets/cours/b3-02/v1/`. L’accroche reprend la gravure du B3-01. Les
fiches récap restent sans image.

### 8.2 Catalogue des médias

| Fichier                                 | Rôle                        | Écran | Diffusion | Servi par                     |
| --------------------------------------- | --------------------------- | ----- | --------- | ----------------------------- |
| `B3-01_export_ventes.<empreinte>.xlsx`  | export brut                 | A1-02 | catalogue | front, `/assets/cours/b3-01/` |
| `B3-01_reprise_acte_2.<empreinte>.xlsx` | reprise nettoyée            | A1-09 | seance    | API, poste et pupitre         |
| `B3-01_reprise_acte_3.<empreinte>.xlsx` | reprise et `T_Commandes`    | A2-11 | seance    | API, poste et pupitre         |
| `B3-01_reprise_acte_2.<empreinte>.xlsx` | reprise nettoyée, pour l’IA | A3-06 | seance    | API, poste et pupitre         |

| Id  | Écran | Fichier source (page)                                                                                   | Original             | Auteur, date                                            | Licence        | Dérivé servi                            | Attribution affichée                                                                             |
| --- | ----- | ------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------- | -------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| M2  | A1-05 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `nettoyer-le-texte.webp`                | « Nettoyer le texte · Asili Design, 2026 · CC BY-SA 4.0 »                                        |
| M3  | A1-06 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `convertir-un-montant.webp`             | « Du texte au nombre · Asili Design, 2026 · CC BY-SA 4.0 »                                       |
| M4  | A1-07 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `signaler-par-si-ou.webp`               | « Signaler, pas corriger · Asili Design, 2026 · CC BY-SA 4.0 »                                   |
| M5  | A1-10 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `recherchev-quatre-arguments.webp`      | « RECHERCHEV en quatre questions · Asili Design, 2026 · CC BY-SA 4.0 »                           |
| M6  | A1-11 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `additionner-sous-conditions.webp`      | « Additionner sous conditions · Asili Design, 2026 · CC BY-SA 4.0 »                              |
| M7  | A2-02 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `jours-ouvres.webp`                     | « Compter en jours ouvrés · Asili Design, 2026 · CC BY-SA 4.0 »                                  |
| M8  | A2-03 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `calendrier-joursem-datedif-temps.webp` | « Lire le calendrier · Asili Design, 2026 · CC BY-SA 4.0 »                                       |
| M9  | A2-04 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `moyenne-ou-mediane.webp`               | « Moyenne ou médiane ? · Asili Design, 2026 · CC BY-SA 4.0 »                                     |
| M10 | A2-07 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `tableau-structure.webp`                | « Un tableau qui grandit · Asili Design, 2026 · CC BY-SA 4.0 »                                   |
| M11 | A2-08 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `tcd-quatre-zones.webp`                 | « Le TCD en quatre zones · Asili Design, 2026 · CC BY-SA 4.0 »                                   |
| M12 | A2-12 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `graphique-qui-repond.webp`             | « D’abord la question · Asili Design, 2026 · CC BY-SA 4.0 »                                      |
| M13 | A2-15 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `ratios-de-sommes.webp`                 | « Un taux, c’est un ratio de sommes · Asili Design, 2026 · CC BY-SA 4.0 »                        |
| M14 | A2-16 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `tableau-de-bord.webp`                  | « Lu en trente secondes · Asili Design, 2026 · CC BY-SA 4.0 »                                    |
| M1  | A1-02 | https://commons.wikimedia.org/wiki/File:1890_Census_Hollerith_Electrical_Counting_Machines_Sci_Amer.jpg | JPEG 622 × 480 px    | Scientific American, machines de Herman Hollerith, 1890 | domaine public | `hollerith-recensement-1890.jpg`        | « Scientific American, machines de Herman Hollerith, 1890 · Wikimedia Commons (domaine public) » |

### 8.3 Sources

- Norvane Équipement et toutes ses données : données fictives générées pour le B3-01.
- Le rapport d’IA de l’exercice 8 : écrit pour ce cours, dit tel à l’écran.
- Programme « Outils informatiques du manager » B3 2026-27 et cahier des charges de l’évaluation
  2026-27 (documents de l’école, non versionnés).
