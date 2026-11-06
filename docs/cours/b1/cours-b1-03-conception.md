# B1-03 · Traiter un fichier : TCD et série à une variable — conception de référence (gabarit v3)

> Cahier des charges du cours B1-03 au gabarit v3 (`docs/cours/cours-gabarit-v3.md`) : troisième cours de
> mathématiques des BTS CG 1re année. Le B1-02 fait foi pour la forme : 32 écrans, 121 minutes,
> 4 actes, un diagnostic, trois notions traitées chacune par un cycle réfléchir → comprendre →
> s'exercer, puis un rappel et la fiche mémo. Nouveauté : chaque notion difficile s'ouvre sur un écran
> « pour comprendre », une image du quotidien et une seule idée, sans un mot technique, juste avant
> sa page de cours. Ce document ne contient aucun code exécutable ; toute divergence d'implémentation
> est un défaut de l'implémentation. Les tests `b1-03.cours.spec.ts` relisent ce document : § 3.1,
> titres publics du § 3, § 5.9, § 8.2.

| Rubrique    | Valeur                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Date        | 6 novembre 2026                                                                                         |
| Statut      | **Conception validée le 6 novembre 2026** : troisième cours du plan BTS CG 1 (B1-01 → B1-12)            |
| Cours       | `b1-03-tcd-serie-une-variable`                                                                          |
| Gabarit     | `v3`, déclaré par le contenu et contrôlé par les quatre règles `gabarit-*` de `verifierStructure`       |
| Niveau      | `B1` (`moteur.coursB1`)                                                                                 |
| Titre servi | « Traiter un fichier : TCD et série à une variable »                                                    |
| Durée       | **121 minutes exactes** (somme des écrans), 4 actes de 45, 36, 32 et 8 minutes, plus 2 pauses de 15 min |
| Écrans      | **32**, dont 15 écrans catalogue (6 écrans « pour comprendre »)                                         |
| Sources     | Programme officiel du BTS CG (statistique descriptive, tableur) ; données fictives Partie Libre         |

---

## 0. Synthèse des décisions

Décisions de Tim du 6 novembre 2026, sur le cadrage :

- **La forme du B1-02 : 32 écrans, 121 minutes.** La médiane et les quartiles partagent une page et
  un seul écran « pour comprendre » (« ranger, puis couper ») : six écrans « pour comprendre », six
  pages. Pour y loger l'écran des boîtes à moustaches, les deux exercices Excel de l'acte 1 n'en font
  qu'un, de 15 minutes : l'acte 1 passe à 45 minutes, l'acte 3 à 32.
- **L'écran « pour comprendre »** remplace l'infographie de l'exemple du B1-02 : une scène d'enfant
  dessinée, deux phrases courtes, aucun mot du cours, une seule idée. La page qui suit pose le mot,
  la formule et le geste au tableur. La moyenne, connue depuis le collège, se pose sur la page de la
  médiane, sans écran à elle.
- **Le TCD se construit dans un vrai classeur Excel**, réservé à la séance comme ceux du B3-01
  (`docs/formations.md`, pièce jointe réservée). L'étudiant y construit le TCD et le champ calculé du
  taux de marge, puis saisit ce qu'il lit dans un questionnaire corrigé. Cet exercice n'a pas
  d'équivalent papier. Le classeur est produit par le générateur de `b1-03.donnees.ts` (graine
  20 261 103) et vérifié par `b1-03.classeur.spec.ts` : les valeurs attendues se calculent sur les
  ventes générées, puis se retrouvent dans le classeur relu.
- **Les quartiles suivent la définition du programme** (rang n ÷ 4 arrondi à l'entier supérieur dans
  la série rangée). Chaque série du cours compte 9, 13 ou 21 valeurs : pour ces effectifs, `QUARTILE`
  du tableur donne la même valeur, et la page le dit.
- **Les images dès ce lot** : six prompts dans `illustrations-b1-03/prompts.md`.
- **Le fil rouge continue : Partie Libre.** Inès Marchal a exporté les ventes d'octobre et veut savoir
  quel canal (boutique, site web, marketplace) rapporte le plus, puis à quoi ressemble un panier
  typique. Théo a fait la moyenne des taux de marge des ventes. Toutes ces données sont fictives et
  signalées à l'écran.
- **Le taux de marge reste celui du B1-01** : marge ÷ coût d'achat HT. Le champ calculé se calcule
  sur les sommes de chaque ligne du TCD ; la moyenne des taux est le piège central.
- **Le tableur** : `MOYENNE`, `MEDIANE`, `QUARTILE`, `ECARTYPEP`, quatre fonctions nouvelles sous le
  plafond de cinq, sur une feuille `fp-sheet` ; la recopie vers la droite du B1-02 resservira.

## 1. Objectifs d'apprentissage et public

### 1.1 Rattachement au programme officiel

Module « Statistique descriptive » du BTS CG, unité U3 – Mathématiques appliquées : série statistique
à une variable, paramètres de position (moyenne, médiane, quartiles) et de dispersion (écart
interquartile, écart type), boîte à moustaches, regroupement en classes ; usage raisonné du tableur
pour obtenir ces paramètres. Le traitement d'un fichier par un tableau croisé dynamique prépare la
partie tableur de la CCF (3 points sur 10).

### 1.2 Objectifs du cours

À la fin de la séance, l'étudiant sait :

1. construire dans Excel un TCD qui répond à une question, et en lire les sommes ;
2. ajouter un champ calculé, le taux de marge, et expliquer pourquoi il ne vaut pas la moyenne des
   taux des ventes ;
3. calculer à la main la médiane et les quartiles d'une série de 9 ou 13 valeurs ;
4. obtenir au tableur `MOYENNE`, `MEDIANE`, `QUARTILE` et `ECARTYPEP`, et lire un écart type ;
5. choisir la médiane quand une valeur extrême tire la moyenne ;
6. lire et comparer deux boîtes à moustaches ;
7. calculer une moyenne approchée par les centres des classes.

### 1.3 Acquis des B1-01 et B1-02

| Acquis                               | Diagnostic | Réemploi dans le B1-03 |
| ------------------------------------ | ---------- | ---------------------- |
| Taux de marge (÷ coût d'achat HT)    | A1-01      | Champ calculé (N1)     |
| Taux global pondéré, pas une moyenne | A1-03      | Champ calculé (N1)     |
| `ARRONDI`, recopie vers la droite    | exercices  | Exercice 3             |

### 1.4 Public et conditions

BTS CG 1re année, 25 étudiants au plus, bacs STMG en majorité. Calculatrice autorisée sauf au
diagnostic et à la mission. Un poste par étudiant, avec Excel pour l'exercice 1. Séance de 3 h 30 :
pause de 15 minutes après l'acte 1 et après l'acte 3.

## 2. Architecture

### 2.1 Les quatre actes

| Acte | Rôle                                            | Notion | Minutes |
| ---- | ----------------------------------------------- | ------ | ------: |
| 1    | Diagnostic, puis regrouper un fichier par canal | N1     |      45 |
| 2    | Résumer une série : centre, quartiles, écart    | N2     |      36 |
| 3    | Comparer deux séries, résumer par classes       | N3     |      32 |
| 4    | Rappel et fiche mémo                            | —      |       8 |

Pause 1 après le jalon A1-10 ; pause 2 après le jalon A3-07. Les pauses ne sont pas des écrans.

### 2.2 Le cycle d'une notion

Chaque notion suit : **Réfléchir** (mission, réflexion ou vote) → **Comprendre** (deux écrans « pour
comprendre » d'1 minute, chacun suivi de sa page `lesson` de 2 minutes ; un exemple guidé `fp-worked`
corrigé étape par étape) → **S'exercer** (exercices notés, corrigés sur place).

### 2.3 L'écran « pour comprendre »

Brique commune `moteur.commeACinqAnsDans(dossier)` (rendu v2 `image-left`, la même qu'au B2-07),
1 minute, diffusion catalogue, placé juste avant sa page et numéroté comme elle
(`B1-03-A{acte}-{rang}-ENFANT-{SUJET}`). Décision de Tim du 6 novembre 2026 : à côté de l'image,
l'étudiant lit trois paragraphes, la scène, l'idée, puis le pont. L'écran porte :

- un titre de la forme « Pour comprendre : … », sans le nom de la notion ;
- la scène et l'idée, au présent, avec des mots d'enfant : bonbons, file d'enfants, billes,
  limonade ; aucun chiffre, aucun mot du cours (moyenne, médiane, quartile, écart, tableau, champ,
  classe, série, valeur, effectif, taux) ;
- le pont, « En maths, on écrit : … », qui nomme la notion de la page suivante (TCD, champ calculé
  et taux de marge, médiane et quartiles, écart type, boîte à moustaches, classe et effectif) ;
- une image dessinée sans texte, qui montre la même scène (§ 8.3).

Les notes formateur portent la consigne commune (décrire l'image, lire l'idée, puis le pont) et une
question de relance propre à l'écran.

### 2.4 Diffusion

Catalogue : l'accroche, le dossier, les six écrans « pour comprendre », les six pages de cours et la
fiche mémo. Tout le reste est servi en séance. Aucun écran catalogue ne porte une réponse
d'exercice ; le classeur des ventes n'est servi qu'en séance.

### 2.5 Notation et écriture

Montants en euros entiers dans le fichier ; taux de marge en pourcentage arrondi au dixième. Série
rangée : x₁ ≤ x₂ ≤ … ≤ xₙ. Quartiles Q₁ et Q₃, médiane Me, écart type σ.

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B1-03-A{acte}-{rang}-{SLUG}`. Un écran « pour comprendre » porte le rang de la page
qu'il précède. « I » = interactif. « Q » = questions fermées notées portées par l'écran.

| Rang | Identifiant                         | Min | Brique · rendu               |  I  |   Q | Diffusion |
| ---: | ----------------------------------- | --: | ---------------------------- | :-: | --: | --------- |
|    1 | B1-03-A1-01-DIAGNOSTIC-MARGE        |   4 | `fp-recall`                  |  I  |   1 | seance    |
|    2 | B1-03-A1-02-ACCROCHE                |   1 | `fp-story` · v2 `hero`       |     |   0 | catalogue |
|    3 | B1-03-A1-03-VOTE-DIAGNOSTIC         |   4 | `fp-vote`                    |  I  |   0 | seance    |
|    4 | B1-03-A1-04-DOSSIER                 |   2 | `fp-story` · v2 `table`      |     |   0 | catalogue |
|    5 | B1-03-A1-05-MISSION                 |   6 | `fp-pro`                     |  I  |   0 | seance    |
|    6 | B1-03-A1-06-ENFANT-TAS              |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    7 | B1-03-A1-06-COURS-TCD               |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|    8 | B1-03-A1-07-ENFANT-LIMONADE         |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    9 | B1-03-A1-07-COURS-CHAMP-CALCULE     |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   10 | B1-03-A1-08-EXEMPLE-ANGERS          |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   11 | B1-03-A1-09-ATELIER-TCD             |  15 | `questionnaire`              |  I  |   4 | seance    |
|   12 | B1-03-A1-10-JALON                   |   1 | `fp-pulse`                   |     |   0 | seance    |
|   13 | B1-03-A2-01-REFLEXION-PANIER        |   5 | `fp-story` · v2 `reflection` |  I  |   0 | seance    |
|   14 | B1-03-A2-02-ENFANT-FILE             |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   15 | B1-03-A2-02-COURS-MEDIANE-QUARTILES |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   16 | B1-03-A2-03-ENFANT-EQUIPES          |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   17 | B1-03-A2-03-COURS-ECART-TYPE        |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   18 | B1-03-A2-04-EXEMPLE-MARDI           |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   19 | B1-03-A2-05-ATELIER-MARKETPLACE     |   8 | `questionnaire`              |  I  |   4 | seance    |
|   20 | B1-03-A2-06-TABLEUR-PANIERS         |  10 | `fp-sheet`                   |  I  |   0 | seance    |
|   21 | B1-03-A2-07-JALON                   |   1 | `fp-pulse`                   |     |   0 | seance    |
|   22 | B1-03-A3-01-VOTE-COMPARER           |   5 | `fp-vote`                    |  I  |   0 | seance    |
|   23 | B1-03-A3-02-ENFANT-BOITE            |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   24 | B1-03-A3-02-COURS-BOITE             |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   25 | B1-03-A3-03-ENFANT-BILLES           |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   26 | B1-03-A3-03-COURS-CLASSES           |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   27 | B1-03-A3-04-EXEMPLE-BOUTIQUES       |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   28 | B1-03-A3-05-BOITES-CANAUX           |   1 | `fp-story` · v2 `boxplot`    |     |   0 | seance    |
|   29 | B1-03-A3-06-ATELIER-COMPARER        |  13 | `questionnaire`              |  I  |   4 | seance    |
|   30 | B1-03-A3-07-JALON                   |   1 | `fp-pulse`                   |     |   0 | seance    |
|   31 | B1-03-A4-01-RAPPEL                  |   6 | `fp-spaced`                  |  I  |   0 | seance    |
|   32 | B1-03-A4-02-FICHE-MEMO              |   2 | `fp-story` · v2 `grid`       |     |   0 | catalogue |

Rythme : 94 minutes interactives, 27 d'exposition (jalons compris), exposition continue de 6 minutes
au plus. Somme : 45 + 36 + 32 + 8 = 121.

### 3.2 Acte 1 — Diagnostic, puis regrouper un fichier par canal (45 min)

#### A1-01 · `B1-03-A1-01-DIAGNOSTIC-MARGE` — 4 min · `fp-recall` · séance

- Titre public : « Diagnostic : un taux de marge, sans calculatrice »
- `b1-03-a1-diagnostic-marge` : « Un jeu s’achète 40 € HT et se vend 50 € HT. Quel est son taux de
  marge ? » Bonne : 10 ÷ 40 = 25 % ; pièges 10 ÷ 50 = 20 % (`marque-confondue-avec-marge`),
  50 − 40 = 10 % (`ecart-absolu-au-lieu-du-taux`).

#### A1-02 · `B1-03-A1-02-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Traiter un fichier : TCD et série à une variable »
- Sous-titre : « Partie Libre exporte ses ventes d’octobre. Votre dossier : un fichier à regrouper,
  un taux de marge à calculer, des paniers à résumer et à comparer. »
- Fond : les machines à compter de Herman Hollerith, recensement américain de 1890.

#### A1-03 · `B1-03-A1-03-VOTE-DIAGNOSTIC` — 4 min · `fp-vote` · séance

- Titre public : « Vote : regrouper, puis calculer »
- `b1-03-a1-vote-regrouper` : 240 ventes ; bonne « Regrouper les ventes par canal et additionner
  leurs montants » ; piège « Compter les ventes de chaque canal » (`synthese-des-valeurs-erronee`).
- `b1-03-a1-vote-taux` : 50 % de marge sur 10 € de coût, 10 % sur 100 € ; bonne « Environ
  13,6 % » ; piège « 30 %, la moyenne des deux taux » (`moyenne-simple-des-taux`).

#### A1-04 · `B1-03-A1-04-DOSSIER` — 2 min · v2 `table` · catalogue

- Titre public : « Le fichier des ventes de Partie Libre »
- Lignes : l'entreprise ; le fichier (240 ventes, colonnes Date, Boutique, Canal, Catégorie, CA_HT,
  Cout_achat_HT) ; la première ligne du fichier ; le taux de marge (marge ÷ coût d'achat HT) ; la
  question d'Inès. Note : « Données fictives Partie Libre, créées pour ce cours. »

#### A1-05 · `B1-03-A1-05-MISSION` — 6 min · `fp-pro` · séance

- Titre public : « Votre mission : quel canal rapporte le plus ? »
- Situation : Inès veut le chiffre d'affaires et le taux de marge de chaque canal. Théo recopie les
  lignes à la main, et a fait la moyenne des taux de marge des ventes (37,5 %).
- Questions libres : `:regrouper`, `:marge` (diviser par le CA ou par le coût ?), `:moyenne` (une
  vente de 10 € et une de 200 € comptent-elles autant ?).

#### A1-06 · `B1-03-A1-06-ENFANT-TAS` — 1 min · v2 `image-left` · catalogue

- Titre public : « Pour comprendre : un tas par couleur »
- Phrases : « Tu vides ton sac de bonbons sur la table. » « Tu fais un tas par couleur, puis tu
  comptes chaque tas. » Image `bonbons-tas.webp`.

#### A1-06 · `B1-03-A1-06-COURS-TCD` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : le tableau croisé dynamique »
- Page 1 sur 2. Un TCD regroupe les lignes selon un champ et résume un autre champ ; exemple pour
  débuter : les dépenses de Léa (six lignes, trois catégories) ; méthode « Lignes, colonnes,
  valeurs », le montant en Somme et non en Nombre, contrôle par le total général.

#### A1-07 · `B1-03-A1-07-ENFANT-LIMONADE` — 1 min · v2 `image-left` · catalogue

- Titre public : « Pour comprendre : calculer avec tout ce qu’on a »
- Phrases : « Le soir, tu vides le pot des pièces gagnées et le pot des pièces dépensées. » « Tu fais
  ton calcul une seule fois, avec ce qu’il y a dans les deux pots. » Image `limonade-pots.webp`.

#### A1-07 · `B1-03-A1-07-COURS-CHAMP-CALCULE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : le champ calculé du taux de marge »
- Page 2 sur 2. Excel calcule le champ calculé sur les sommes ; exemple pour débuter : le stand de
  crêpes, (320 − 180) ÷ 180 ≈ 77,8 %, pas 75 % ; méthode « Le calcul se fait sur les sommes » :
  Champ calculé, formule `=(CA_HT-Cout_achat_HT)/Cout_achat_HT`, format pourcentage.

#### A1-08 · `B1-03-A1-08-EXEMPLE-ANGERS` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : les ventes d’un samedi à Angers »
- Six ventes ; étapes `champs`, `sommes` (boutique 300 et 200, site web 120 et 100, marketplace 50 et
  40), `total` (470 et 340), `champ` (50 %, 20 %, 25 %, total ≈ 38,2 %), `piege` (moyenne des trois
  taux, 31,7 %).

#### A1-09 · `B1-03-A1-09-ATELIER-TCD` — 15 min · `questionnaire` · séance

- Titre public : « Exercice 1 — Le TCD des ventes d’octobre, dans Excel »
- Temps : réflexion 2 min · travail 10 min · correction 3 min.
- Pièce jointe réservée : `b1-03/B1-03_ventes_octobre.<empreinte>.xlsx`, sans écran repris.
- Questions (valeurs au § 5.2) : `b1-03-a1-ca-site`, `b1-03-a1-taux-boutique`,
  `b1-03-a1-taux-total`, `b1-03-a1-theo` (vote : la moyenne des taux n'est pas le taux du mois).

#### A1-10 · `B1-03-A1-10-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 1 : regrouper et calculer sur les sommes »
- Puis pause de 15 minutes.

### 3.3 Acte 2 — Résumer une série : centre, quartiles, écart (36 min)

#### A2-01 · `B1-03-A2-01-REFLEXION-PANIER` — 5 min · v2 `reflection` · séance

- Titre public : « Réfléchir : le panier typique du site web »
- 21 commandes de la dernière semaine de septembre (hors du fichier d'octobre), dont celle d'un club
  à 480 € ; Théo propose la moyenne. Attendu : la commande du
  club tire la moyenne ; un nombre qui laisse autant de paniers au-dessous qu'au-dessus résume mieux.

#### A2-02 · `B1-03-A2-02-ENFANT-FILE` — 1 min · v2 `image-left` · catalogue

- Titre public : « Pour comprendre : ranger, puis couper »
- Phrases : « Les enfants se rangent du plus petit au plus grand. » « Un ruban coupe la file en deux
  moitiés, puis deux rubans coupent chaque moitié en deux. » Image `file-rubans.webp`.

#### A2-02 · `B1-03-A2-02-COURS-MEDIANE-QUARTILES` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : médiane et quartiles »
- Page 1 sur 2. Moyenne, médiane, Q₁ et Q₃ par la définition du programme ; exemple pour débuter :
  neuf notes (Me 12, Q₁ 10, Q₃ 14) ; méthode « D’abord ranger, puis couper », `MOYENNE`, `MEDIANE`,
  `QUARTILE`, et la remarque sur les effectifs de 9, 13 ou 21 valeurs.

#### A2-03 · `B1-03-A2-03-ENFANT-EQUIPES` — 1 min · v2 `image-left` · catalogue

- Titre public : « Pour comprendre : loin du milieu ou tout près »
- Phrases : « Deux équipes ont la même taille au milieu. » « Dans l’une, tous se ressemblent ; dans
  l’autre, il y a des géants et des tout petits. » Image `equipes-tailles.webp`.

#### A2-03 · `B1-03-A2-03-COURS-ECART-TYPE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : l’écart type »
- Page 2 sur 2. σ et `ECARTYPEP` ; exemple pour débuter : 9, 10, 11 et 0, 10, 20 ; méthode « P comme
  population ».

#### A2-04 · `B1-03-A2-04-EXEMPLE-MARDI` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : treize paniers d’un mardi »
- Énoncé : 15, 42, 28, 33, 21, 36, 26, 150, 31, 24, 35, 19, 40 €. Étapes `ranger`, `mediane` (31 €),
  `quartiles` (24 € et 36 €, écart interquartile 12 €), `moyenne` (≈ 38,5 €), `choisir`.

#### A2-05 · `B1-03-A2-05-ATELIER-MARKETPLACE` — 8 min · `questionnaire` · séance

- Titre public : « Exercice 2 — Les neuf paniers de la marketplace »
- Temps : réflexion 2 min · travail 4 min · correction 2 min.
- Neuf paniers : 33, 12, 45, 28, 95, 20, 38, 25, 30 €. Questions `b1-03-a2-mediane`, `b1-03-a2-q1`,
  `b1-03-a2-q3`, `b1-03-a2-resume` (§ 5.2).

#### A2-06 · `B1-03-A2-06-TABLEUR-PANIERS` — 10 min · `fp-sheet` · séance

- Titre public : « Exercice 3 — Résumer les paniers au tableur »
- Temps : réflexion 2 min · travail 6 min · correction 2 min.
- Feuille de 22 lignes sur 6 colonnes : 21 paniers du site web en B, de la boutique de Nantes en C
  (§ 5.3). Douze cellules : E2 à E7, `=ARRONDI(MOYENNE(B2:B22);1)`, `=MEDIANE(B2:B22)`,
  `=QUARTILE(B2:B22;1)`, `=QUARTILE(B2:B22;3)`, `=ARRONDI(ECARTYPEP(B2:B22);1)`, `=E5-E4`, recopiées
  vers la droite en F.

#### A2-07 · `B1-03-A2-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : résumer une série »

### 3.4 Acte 3 — Comparer deux séries, résumer par classes (32 min)

#### A3-01 · `B1-03-A3-01-VOTE-COMPARER` — 5 min · `fp-vote` · séance

- Titre public : « Vote : comparer sans tout relire »
- `b1-03-a3-vote-boite` : la part longue contient-elle plus de valeurs ? Piège
  `boite-lue-comme-effectif`. `b1-03-a3-vote-centre` : quel montant pour la tranche de 20 € à 40 € ?
  Piège `centre-de-classe-oublie`.

#### A3-02 · `B1-03-A3-02-ENFANT-BOITE` — 1 min · v2 `image-left` · catalogue

- Titre public : « Pour comprendre : une boîte pour ceux du milieu »
- Phrases : la moitié du milieu dans une boîte, deux bras jusqu'au plus petit et au plus grand.
  Image `file-boite.webp`.

#### A3-02 · `B1-03-A3-02-COURS-BOITE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : la boîte à moustaches »
- Page 1 sur 2. Cinq nombres, quatre quarts ; exemple pour débuter : les neuf notes ; méthode « Le
  centre, puis la boîte ».

#### A3-03 · `B1-03-A3-03-ENFANT-BILLES` — 1 min · v2 `image-left` · catalogue

- Titre public : « Pour comprendre : des boîtes de billes »
- Phrases : trop de billes pour les regarder une par une, trois boîtes par grosseur, on compte chaque
  boîte. Image `billes-boites.webp`.

#### A3-03 · `B1-03-A3-03-COURS-CLASSES` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : regrouper en classes »
- Page 2 sur 2. Classe [a ; b[, centre, moyenne approchée ; exemple pour débuter : 40 temps de
  trajet, 16 minutes ; méthode « Le milieu représente la classe ».

#### A3-04 · `B1-03-A3-04-EXEMPLE-BOUTIQUES` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : deux boutiques, deux boîtes »
- Angers (12, 25, 34, 41, 70) et Tours (20, 30, 33, 36, 48) ; les 100 paniers d'Angers en classes de
  25 € : moyenne approchée 35 €, pas 22,5 €.

#### A3-05 · `B1-03-A3-05-BOITES-CANAUX` — 1 min · v2 `boxplot` · séance

- Titre public : « Les paniers des deux canaux en boîtes »
- Les boîtes du site web et de la boutique de Nantes, résultats de l'exercice 3, axe de 0 à 500 €.

#### A3-06 · `B1-03-A3-06-ATELIER-COMPARER` — 13 min · `questionnaire` · séance

- Titre public : « Exercice 4 — Choisir un résumé »
- Temps : réflexion 2 min · travail 8 min · correction 3 min.
- Les boîtes de A3-05 et les 200 paniers de Nantes de juillet et août, en classes. Questions `b1-03-a3-regulier`,
  `b1-03-a3-quart`, `b1-03-a3-resume` (votes) et `b1-03-a3-moyenne-classes` (§ 5.2).

#### A3-07 · `B1-03-A3-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 3 : comparer et choisir un résumé »
- Puis pause de 15 minutes.

### 3.5 Acte 4 — Rappel et fiche mémo (8 min)

#### A4-01 · `B1-03-A4-01-RAPPEL` — 6 min · `fp-spaced` · séance

- Titre public : « Rappel : de mémoire, sans vos notes »
- Les douze questions de la banque (§ 5.10) sont obligatoires.

#### A4-02 · `B1-03-A4-02-FICHE-MEMO` — 2 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : TCD et série à une variable »
- Neuf cartes et le référentiel (`REFERENTIEL_DU_BTS_CG`).

## 4. Mode papier

Le livret reprend, dans l'ordre des écrans, les écrans « pour comprendre », les traces écrites, les
énoncés et un cadre de réponse par question. L'exercice 1 n'a pas d'équivalent papier (décision de
Tim du 6 novembre 2026) : sans poste, le formateur construit le TCD au pupitre et la classe lit les
valeurs. Les formules de l'exercice 3 s'écrivent sur la copie avec la grille des cellules ; les boîtes
de A3-05 sont imprimées.

## 5. Contenus

### 5.1 Le classeur des ventes

`b1-03.donnees.ts` génère les 240 ventes d'octobre 2026 à partir de la graine 20 261 103 : jour,
boutique, canal (boutique une fois sur deux, site web trois fois sur dix, marketplace deux fois sur
dix), catégorie, coût d'achat HT de 8 à 90 €, taux de marge tiré par canal (boutique de 35 à 65 %,
site web de 15 à 35 %, marketplace de 10 à 25 %, par pas de 5 points), CA HT arrondi à l'euro.
`b1-03.classeur.spec.ts` écrit le classeur (`ECRIRE_CLASSEURS=1`), le nomme d'après ses octets, le
relit et y retrouve les sommes par canal du § 5.2.

### 5.2 Les valeurs attendues

| Canal         | Ventes | Somme de CA HT (€) | Somme de coût d'achat HT (€) | Taux de marge (%) | Taux de marque (%) | Moyenne des taux des ventes (%) |
| ------------- | -----: | -----------------: | ---------------------------: | ----------------: | -----------------: | ------------------------------: |
| Boutique      |    131 |              9 791 |                        6 525 |              50,1 |               33,4 |                            50,0 |
| Site web      |     71 |              3 994 |                        3 204 |              24,7 |               19,8 |                            24,6 |
| Marketplace   |     38 |              2 195 |                        1 862 |              17,9 |               15,2 |                            18,5 |
| Total général |    240 |             15 980 |                       11 591 |              37,9 |               27,5 |                            37,5 |

Exercice 1 : CA du site web 3 994 € (pièges 71 et 56,25, `synthese-des-valeurs-erronee`) ; taux de
la boutique 50,1 % (piège 33,4, le taux de marque ; la moyenne des taux de la boutique, 50,0, trop
proche d'une bonne réponse arrondie à l'unité, n'est pas un piège) ; taux du total 37,9 % (pièges
30,9, moyenne des trois taux, et 27,5).

Exercice 2 (marketplace, rangés 12, 20, 25, 28, 30, 33, 38, 45, 95) : médiane 30 € (pièges 95 et
36,2) ; Q₁ 25 € (pièges 20, rang arrondi au-dessous, et 15) ; Q₃ 38 € (pièges 33 et 45).

Exercice 4 (200 paniers de Nantes en juillet et août : [0 ; 20[ : 20, [20 ; 40[ : 90, [40 ; 60[ : 70, [60 ; 80[ : 20) :
moyenne approchée 39 € (pièges 29 et 49, les débuts et les fins de classe).

### 5.3 Les paniers de la dernière semaine de septembre (exercice 3, A3-05)

Ces paniers ne viennent pas du classeur d'octobre : ils le précèdent, et la commande du club à
480 € n'y figure pas (aucune vente d'octobre ne dépasse ce montant).

| Série                | Valeurs rangées (€)                                                                 |    x̄ |  Me |  Q₁ |  Q₃ |    σ |
| -------------------- | ----------------------------------------------------------------------------------- | ---: | --: | --: | --: | ---: |
| Site web (21)        | 18, 22, 25, 27, 29, 31, 32, 34, 35, 36, 38, 39, 41, 42, 44, 46, 48, 52, 55, 61, 480 | 58,8 |  38 |  31 |  46 | 94,8 |
| Boutique Nantes (21) | 24, 26, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 44, 46, 48, 50, 52  | 37,4 |  37 |  32 |  42 |  7,6 |

Écarts interquartiles 15 et 10. Pièges : `ECARTYPE` 97,1 et 7,8 ; rangs arrondis au-dessous 29 et
44, 31 et 41 ; étendues 462 et 28 ; moyenne en guise de médiane.

### 5.9 Concepts, confusions et remédiations

**Concepts** : `tableau-croise-dynamique`, `pourcentage`, `moyenne-ponderee`, `moyenne`, `mediane`,
`quartiles`, `ecart-type`, `dispersion`, `boite-a-moustaches`, `choix-du-resume`, `tableur` (tous
déjà dans la banque). **Confusions** : toutes existantes, sauf deux, ajoutées à la banque :
`synthese-des-valeurs-erronee` (concept `tableau-croise-dynamique`) et
`rang-de-quartile-arrondi-par-defaut` (concept `quartiles`).

| Identifiant                           | Concept                  | Libellé court                              | Remédiation                         |
| ------------------------------------- | ------------------------ | ------------------------------------------ | ----------------------------------- |
| `synthese-des-valeurs-erronee`        | tableau-croise-dynamique | Compter ou moyenner au lieu d'additionner. | B1-03-A1-06-COURS-TCD               |
| `marque-confondue-avec-marge`         | pourcentage              | Diviser la marge par le CA.                | B1-03-A1-07-COURS-CHAMP-CALCULE     |
| `ecart-absolu-au-lieu-du-taux`        | taux-evolution           | Donner la marge en euros.                  | B1-03-A1-07-COURS-CHAMP-CALCULE     |
| `moyenne-simple-des-taux`             | moyenne-ponderee         | Faire la moyenne des taux.                 | B1-03-A1-07-COURS-CHAMP-CALCULE     |
| `mediane-sans-tri`                    | mediane                  | Prendre le milieu sans ranger.             | B1-03-A2-02-COURS-MEDIANE-QUARTILES |
| `mediane-rang-pair`                   | mediane                  | Garder une seule valeur du milieu.         | B1-03-A2-02-COURS-MEDIANE-QUARTILES |
| `moyenne-lue-comme-mediane`           | mediane                  | Donner la moyenne pour la médiane.         | B1-03-A2-02-COURS-MEDIANE-QUARTILES |
| `rang-de-quartile-arrondi-par-defaut` | quartiles                | Arrondir le rang au-dessous.               | B1-03-A2-02-COURS-MEDIANE-QUARTILES |
| `quartile-moitie-de-mediane`          | quartiles                | Tirer Q₁ de la médiane.                    | B1-03-A2-02-COURS-MEDIANE-QUARTILES |
| `valeur-extreme-ignoree`              | choix-du-resume          | Résumer par la moyenne malgré l'extrême.   | B1-03-A2-02-COURS-MEDIANE-QUARTILES |
| `ecart-type-population-echantillon`   | ecart-type               | Prendre ECARTYPE au lieu d'ECARTYPEP.      | B1-03-A2-03-COURS-ECART-TYPE        |
| `arrondi-oublie`                      | tableur                  | Ne pas arrondir au dixième.                | B1-03-A2-03-COURS-ECART-TYPE        |
| `etendue-prise-pour-dispersion`       | dispersion               | Juger l'écart sur l'étendue.               | B1-03-A2-03-COURS-ECART-TYPE        |
| `formule-non-recopiable-en-ligne`     | tableur                  | Écrire une formule par colonne.            | B1-03-A2-03-COURS-ECART-TYPE        |
| `meme-moyenne-meme-serie`             | dispersion               | Comparer les centres, pas les écarts.      | B1-03-A3-02-COURS-BOITE             |
| `boite-lue-comme-effectif`            | boite-a-moustaches       | Croire une partie longue plus peuplée.     | B1-03-A3-02-COURS-BOITE             |
| `centre-de-classe-oublie`             | moyenne                  | Prendre une borne au lieu du centre.       | B1-03-A3-03-COURS-CLASSES           |

### 5.10 Rappels espacés

Douze rappels, tous obligatoires, écrits dans `b1-03.acte-4.ts`. Chaque bonne réponse porte son
calcul : champs du TCD, Somme au lieu de Nombre, taux de marge, champ calculé contre moyenne des
taux, médiane d'un effectif impair, médiane d'un effectif pair, rang de Q₁, `QUARTILE`, `ECARTYPEP`,
lecture d'une boîte, comparaison de deux boîtes, centre d'une classe.

## 6. Moteur

- **Aucune évolution du moteur.** `MOYENNE`, `MEDIANE`, `QUARTILE` et `ECARTYPEP` sont déjà dans le
  moteur de formules (`Formule.ts`) ; la recopie vers la droite vient du B1-02 ; les rendus `boxplot`
  et `image-left` sont servis et rendus par le front ; la pièce jointe réservée vient du B3-01.
- `QUARTILE` du moteur suit le tableur (interpolation) : avec 21 valeurs, il tombe sur la valeur de
  rang ⌈n ÷ 4⌉, celle du programme.

## 7. Durées de la séance réelle

| Temps                              | Minutes |
| ---------------------------------- | ------: |
| Écrans programmés                  |     121 |
| Deux pauses                        |      30 |
| Marge (réflexions qui s'allongent) |      59 |
| Séance                             |     210 |

## 8. Médias

### 8.1 Principe

Six images, une par écran « pour comprendre », à partir des briefs du § 8.3 et des prompts de
`illustrations-b1-03/prompts.md`. La gravure de l'accroche, déjà servie au B3-01, complète le
catalogue.

### 8.2 Catalogue des médias

Chaque PNG d'origine (1 536 × 1 024 px) est converti en WebP à la même taille et servi depuis
`/assets/cours/b1-03/v1/`. Le catalogue est stocké avec le cours (`Cours.medias`) et contrôlé par la
règle `media-sans-licence`.

| Id  | Écran | Fichier source (page)                                                                                   | Original             | Auteur, date                                            | Licence        | Dérivé servi                     | Attribution affichée                                                                             |
| --- | ----- | ------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------- | -------------- | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| M1  | A1-06 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `bonbons-tas.webp`               | « Un tas par couleur · Asili Design, 2026 · CC BY-SA 4.0 »                                       |
| M2  | A1-07 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `limonade-pots.webp`             | « Calculer avec tout ce qu’on a · Asili Design, 2026 · CC BY-SA 4.0 »                            |
| M3  | A2-02 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `file-rubans.webp`               | « Ranger, puis couper · Asili Design, 2026 · CC BY-SA 4.0 »                                      |
| M4  | A2-03 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `equipes-tailles.webp`           | « Loin du milieu ou tout près · Asili Design, 2026 · CC BY-SA 4.0 »                              |
| M5  | A3-02 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `file-boite.webp`                | « Une boîte pour ceux du milieu · Asili Design, 2026 · CC BY-SA 4.0 »                            |
| M6  | A3-03 | production propre du cours                                                                              | PNG 1 536 × 1 024 px | Asili Design, 2026                                      | CC BY-SA 4.0   | `billes-boites.webp`             | « Des boîtes de billes · Asili Design, 2026 · CC BY-SA 4.0 »                                     |
| M7  | A1-02 | https://commons.wikimedia.org/wiki/File:1890_Census_Hollerith_Electrical_Counting_Machines_Sci_Amer.jpg | JPEG 622 × 480 px    | Scientific American, machines de Herman Hollerith, 1890 | domaine public | `hollerith-recensement-1890.jpg` | « Scientific American, machines de Herman Hollerith, 1890 · Wikimedia Commons (domaine public) » |

### 8.3 Briefs des images

PNG 1 536 × 1 024 px, dessin à la main, fond clair, couleurs pastel, **aucun texte dans l'image** :
les phrases sont à l'écran, à côté. Une seule scène, lisible projetée au fond d'une salle.

1. **Un tas par couleur** (`bonbons-tas.webp`, avant A1-06) : un enfant devant une table, un sac de
   bonbons vidé ; trois tas bien séparés (rouges, jaunes, verts), de tailles différentes ; l'enfant
   pointe un tas du doigt en comptant.
2. **Calculer avec tout ce qu'on a** (`limonade-pots.webp`, avant A1-07) : un stand de limonade le
   soir ; deux pots en verre, l'un plein de pièces gagnées, l'autre des pièces dépensées pour les
   citrons ; l'enfant les vide côte à côte sur la table, un seul carnet ouvert devant lui.
3. **Ranger, puis couper** (`file-rubans.webp`, avant A2-02) : huit enfants rangés du plus petit au
   plus grand ; un ruban rouge au milieu de la file, deux rubans bleus au milieu de chaque moitié ;
   quatre petits groupes de deux enfants.
4. **Loin du milieu ou tout près** (`equipes-tailles.webp`, avant A2-03) : deux équipes de cinq
   enfants côte à côte, une même ligne pointillée à mi-hauteur ; à gauche, tous presque à la ligne ;
   à droite, un géant, un tout petit, des tailles très différentes.
5. **Une boîte pour ceux du milieu** (`file-boite.webp`, avant A3-02) : une file d'enfants rangés ;
   les enfants du milieu entourés d'une grande boîte en carton ouverte ; deux bras tendus vont
   jusqu'au plus petit et au plus grand.
6. **Des boîtes de billes** (`billes-boites.webp`, avant A3-03) : un tapis couvert de billes de toutes
   tailles ; trois boîtes alignées, petites, moyennes et grosses billes ; un enfant y range les billes.

### 8.4 Sources des données

- Partie Libre, le classeur et tous les exemples : données fictives créées pour ce cours.
- Accroche : gravure de presse de 1890, domaine public (Wikimedia Commons).
