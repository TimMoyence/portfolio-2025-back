# B2-09 · Probabilités conditionnelles — conception de référence (gabarit v3)

> Cahier des charges du cours B2-09 au gabarit v3 (`docs/cours/cours-gabarit-v3.md`) : une séance de
> 2 h 45 dont 30 minutes de pause, ouverte par un récapitulatif des probabilités du lycée en images,
> puis trois notions traitées chacune par un cycle réfléchir → comprendre → s'exercer, puis un rappel
> espacé et la fiche mémo. Ce document ne contient aucun code exécutable ; toute divergence
> d'implémentation est un défaut de l'implémentation. Les tests `b2-09.cours.spec.ts` relisent ce
> document : § 3.1, titres publics du § 3, § 5.9, § 8.2.

| Rubrique    | Valeur                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| Date        | 13 novembre 2026                                                                                                       |
| Statut      | **Référence pédagogique** : neuvième cours du plan v3                                                                  |
| Cours       | `b2-09-probabilites-conditionnelles`                                                                                   |
| Gabarit     | `v3`, déclaré par le contenu et contrôlé par les règles `gabarit-*` de `verifierStructure`                             |
| Titre servi | « Probabilités conditionnelles »                                                                                       |
| Durée       | **135 minutes exactes** (somme des écrans), 5 actes de 12, 45, 38, 32 et 8 minutes, plus 2 pauses de 15 min hors durée |
| Écrans      | **40**, dont 21 écrans catalogue (8 écrans d'image, 4 arbres, 1 tableau d'exemple)                                     |
| Sources     | Programme du BTS CG, module « Probabilités » ; probabilités du lycée ; données fictives                                |

---

## 0. Synthèse des décisions

- **Un récapitulatif de 12 minutes en images** (décision de Tim du 13 novembre 2026, « récap images
  ciblé »). Cinq écrans d'image reprennent les probabilités du lycée : la part du tout, le
  contraire, l'intersection, la réunion, le tableau croisé ; puis un vote non noté de deux
  questions les vérifie (une brique `fp-vote` porte deux questions au plus).
- **Les arbres se dessinent par le code** (décision de Tim du 13 novembre 2026 : « choisir la
  meilleure solution pour chaque cas »). Quatre arbres pondérés en rendu v2 `arbre`, au catalogue :
  le code calcule le produit au bout de chaque chemin et refuse un nœud dont les branches ne
  somment pas à 1. Un générateur d'images invente des chiffres : aucun arbre n'est une image. Les
  images PNG restent aux métaphores : le gâteau, les billes, les cerceaux, la commode, les
  ruisseaux, la loupe, la pièce.
- **Les arbres et tableaux tracent les exemples du cours, jamais un exercice** : probabilités à deux
  décimales (0,35 / 0,65…), choisies hors des réponses et des pièges des exercices (contrôlé au
  centième par la spec du cours) ; effectifs d'exemple hors des attendus du tableau croisé noté.
- **Trois notions** : construire un arbre pondéré ou un tableau croisé et calculer P_A(B) (N1) ;
  les probabilités totales sur une partition, puis P_B(A) en remontant l'arbre (N2) ;
  l'indépendance de deux événements, justifiée par le calcul (N3).

## 1. Objectifs d'apprentissage et public

### 1.1 Rattachement au programme officiel

Module « Probabilités » : probabilité conditionnelle P_A(B) ; arbre pondéré et tableau croisé ;
formule des probabilités totales sur une partition ; indépendance de deux événements.

### 1.2 Objectifs du cours

À la fin de la séance, l'étudiant sait :

1. construire un arbre pondéré, et lire sur une branche une probabilité conditionnelle ;
2. calculer P(A ∩ B) = P(A) × P_A(B) en multipliant le long d'un chemin ;
3. compléter un tableau croisé d'effectifs et y lire P_A(B) = effectif de A ∩ B ÷ effectif de A ;
4. calculer P(B) par les probabilités totales sur une partition ;
5. remonter l'arbre : P_B(A) = P(A ∩ B) ÷ P(B) ;
6. justifier que deux événements sont, ou ne sont pas, indépendants.

### 1.3 Acquis des cours précédents

| Cours | Savoirs installés                                      | Réemploi dans le B2-09                      |
| ----- | ------------------------------------------------------ | ------------------------------------------- |
| Lycée | Probabilité, contraire, intersection, réunion, tableau | Récapitulatif de l'acte 1                   |
| B2-01 | Proportion, pourcentage d'un pourcentage               | P(A ∩ B) = P(A) × P_A(B), part d'une part   |
| B1-03 | Tableau croisé dynamique, effectifs par ligne et total | Tableau croisé d'effectifs, totaux de ligne |

### 1.4 Public et conditions

BTS CG 2e année, 25 étudiants au plus, calculatrice autorisée, un poste par étudiant ou le livret
papier. Séance de 2 h 45 : 135 minutes de travail, pause de 15 minutes après l'acte 2 et après
l'acte 3.

## 2. Architecture

### 2.1 Les cinq actes

| Acte | Rôle                                              | Notion | Minutes |
| ---- | ------------------------------------------------- | ------ | ------: |
| 1    | Avant les probabilités conditionnelles, en images | —      |      12 |
| 2    | Arbre pondéré, tableau croisé et P_A(B)           | N1     |      45 |
| 3    | Probabilités totales, puis remonter l'arbre       | N2     |      38 |
| 4    | Indépendance de deux événements                   | N3     |      32 |
| 5    | Rappel et fiche mémo                              | —      |       8 |

Pause 1 (15 min) après le jalon A2-12 ; pause 2 (15 min) après le jalon A3-10.

### 2.2 Les écrans d'image, les arbres et les tableaux

Huit écrans d'image d'une minute, brique `moteur.pourComprendreDans(dossier)` (rendu v2
`image-left`), diffusés au catalogue : le titre, une phrase qui décrit l'image sans mot du cours, la
règle « En maths, on écrit : … », puis trois ou quatre correspondances « élément de l'image → ce
qu'il est dans le cours ». Les huit sont nouvelles (`illustrations-b2-09/prompts.md`).

Quatre arbres pondérés d'une minute, rendu v2 `arbre`, au catalogue : deux générations, une
probabilité sur chaque branche, le produit calculé par le code au bout de chaque chemin. Un tableau
croisé d'exemple en rendu v2 `table`. Ils portent les exemples du cours.

### 2.3 Le cycle d'une notion

Chaque notion suit : **Réfléchir** (mission ou vote non noté) → écrans d'image, arbres ou tableaux →
**Comprendre** (une trace écrite v2 `lesson` de 2 minutes, parfois suivie d'un exemple guidé
`fp-worked`) → **S'exercer** (exercices notés corrigés sur place). N1 et N2 tiennent chacune deux
cycles. Chaque exercice annonce ses temps dans les notes formateur, sous la forme
`• Temps : réflexion N min · travail N min · correction N min`, dont la somme est la durée de l'écran.

### 2.4 Règles de structure

40 écrans ≤ 40, 135 minutes ≤ 180. Exposition continue de 5 minutes au plus : un arbre, un tableau,
une image et une trace écrite à l'acte 4.

### 2.5 Diffusion

Catalogue : l'accroche, les huit écrans d'image, le dossier, les quatre arbres, le tableau
d'exemple, les cinq traces écrites et la fiche mémo. Tout le reste est servi en séance.

### 2.6 Notation

Probabilité conditionnelle P_A(B), lue « probabilité de B sachant A ». Contraire Ā. Intersection
A ∩ B, réunion A ∪ B. Probabilités en écriture décimale, virgule française.

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B2-09-A{acte}-{rang}-{SLUG}`, conformes à `^B2-09-A[1-6]-\d{2}-[A-Z0-9-]+$`.
« I » = interactif. « Q » = questions fermées notées portées par l'écran.

| Rang | Identifiant                      | Min | Brique · rendu               |  I  |   Q | Diffusion |
| ---: | -------------------------------- | --: | ---------------------------- | :-: | --: | --------- |
|    1 | B2-09-A1-01-ACCROCHE             |   1 | `fp-story` · v2 `hero`       |     |   0 | catalogue |
|    2 | B2-09-A1-02-ENFANT-PART          |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    3 | B2-09-A1-03-ENFANT-CONTRAIRE     |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    4 | B2-09-A1-04-ENFANT-INTERSECTION  |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    5 | B2-09-A1-05-VOTE-LYCEE           |   6 | `fp-vote`                    |  I  |   0 | seance    |
|    6 | B2-09-A1-06-ENFANT-REUNION       |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    7 | B2-09-A1-07-ENFANT-TABLEAU       |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    8 | B2-09-A2-01-DOSSIER              |   2 | `fp-story` · v2 `table`      |     |   0 | catalogue |
|    9 | B2-09-A2-02-MISSION              |   5 | `fp-pro`                     |  I  |   0 | seance    |
|   10 | B2-09-A2-03-ENFANT-RUISSEAUX     |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   11 | B2-09-A2-04-ARBRE-EXEMPLE        |   1 | `fp-story` · v2 `arbre`      |     |   0 | catalogue |
|   12 | B2-09-A2-05-COURS-ARBRE          |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   13 | B2-09-A2-06-EXEMPLE-ARBRE        |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   14 | B2-09-A2-07-ATELIER-ARBRE        |  10 | `questionnaire`              |  I  |   4 | seance    |
|   15 | B2-09-A2-08-VOTE-TABLEAU         |   4 | `fp-vote`                    |  I  |   0 | seance    |
|   16 | B2-09-A2-09-ENFANT-LOUPE         |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   17 | B2-09-A2-10-COURS-TABLEAU        |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   18 | B2-09-A2-11-TABLEAU-CROISE       |  10 | `fp-table-build`             |  I  |   0 | seance    |
|   19 | B2-09-A2-12-JALON                |   1 | `fp-pulse`                   |     |   0 | seance    |
|   20 | B2-09-A3-01-VOTE-TOTALES         |   4 | `fp-vote`                    |  I  |   0 | seance    |
|   21 | B2-09-A3-02-ARBRE-TOTALES        |   1 | `fp-story` · v2 `arbre`      |     |   0 | catalogue |
|   22 | B2-09-A3-03-COURS-TOTALES        |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   23 | B2-09-A3-04-EXEMPLE-TOTALES      |   7 | `fp-worked`                  |  I  |   0 | seance    |
|   24 | B2-09-A3-05-ATELIER-TOTALES      |   8 | `questionnaire`              |  I  |   3 | seance    |
|   25 | B2-09-A3-06-VOTE-REMONTER        |   4 | `fp-vote`                    |  I  |   0 | seance    |
|   26 | B2-09-A3-07-ARBRE-REMONTER       |   1 | `fp-story` · v2 `arbre`      |     |   0 | catalogue |
|   27 | B2-09-A3-08-COURS-REMONTER       |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   28 | B2-09-A3-09-ATELIER-REMONTER     |   8 | `questionnaire`              |  I  |   3 | seance    |
|   29 | B2-09-A3-10-JALON                |   1 | `fp-pulse`                   |     |   0 | seance    |
|   30 | B2-09-A4-01-VOTE-INDEPENDANCE    |   4 | `fp-vote`                    |  I  |   0 | seance    |
|   31 | B2-09-A4-02-ARBRE-INDEPENDANT    |   1 | `fp-story` · v2 `arbre`      |     |   0 | catalogue |
|   32 | B2-09-A4-03-TABLEAU-INDEPENDANT  |   1 | `fp-story` · v2 `table`      |     |   0 | catalogue |
|   33 | B2-09-A4-04-ENFANT-PIECE         |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   34 | B2-09-A4-05-COURS-INDEPENDANCE   |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   35 | B2-09-A4-06-EXEMPLE-INDEPENDANCE |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   36 | B2-09-A4-07-ATELIER-INDEPENDANCE |   8 | `questionnaire`              |  I  |   3 | seance    |
|   37 | B2-09-A4-08-ATELIER-SYNTHESE     |   8 | `questionnaire`              |  I  |   3 | seance    |
|   38 | B2-09-A4-09-JALON                |   1 | `fp-pulse`                   |     |   0 | seance    |
|   39 | B2-09-A5-01-RAPPEL               |   6 | `fp-spaced`                  |  I  |   0 | seance    |
|   40 | B2-09-A5-02-FICHE-MEMO           |   2 | `fp-story` · v2 `grid`       |     |   0 | catalogue |

Rythme : 104 minutes interactives, 31 d'exposition, exposition continue de 5 minutes au plus.

### 3.2 Acte 1 — Avant les probabilités conditionnelles, en images (12 min)

#### A1-01 · `B2-09-A1-01-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Probabilités conditionnelles : arbres, tableaux, indépendance »
- Gravure M9 : page de l'Ars Conjectandi de Jacques Bernoulli, 1713.

#### A1-02 · `B2-09-A1-02-ENFANT-PART` — 1 min · v2 `image-left` · catalogue

- Titre public : « La part du gâteau »
- Image M1 : un gâteau en dix parts, trois portent une fraise. Règle : P(A) = parts de A ÷ parts du
  tout, entre 0 et 1.

#### A1-03 · `B2-09-A1-03-ENFANT-CONTRAIRE` — 1 min · v2 `image-left` · catalogue

- Titre public : « Le sac de billes »
- Image M2 : les billes rouges et toutes les autres. Règle : P(Ā) = 1 − P(A).

#### A1-04 · `B2-09-A1-04-ENFANT-INTERSECTION` — 1 min · v2 `image-left` · catalogue

- Titre public : « Les deux cerceaux »
- Image M3 : deux cerceaux qui se chevauchent. Règle : A ∩ B, A et B à la fois.

#### A1-05 · `B2-09-A1-05-VOTE-LYCEE` — 6 min · `fp-vote` · séance

- Titre public : « Vote : les probabilités du lycée, deux questions »
- Deux votes non notés : le contraire (`complementaire-oublie`) ; la réunion
  (`reunion-sans-intersection`).

#### A1-06 · `B2-09-A1-06-ENFANT-REUNION` — 1 min · v2 `image-left` · catalogue

- Titre public : « Les cerceaux réunis »
- Image M4 : compter une seule fois les enfants des deux cerceaux. Règle :
  P(A ∪ B) = P(A) + P(B) − P(A ∩ B).

#### A1-07 · `B2-09-A1-07-ENFANT-TABLEAU` — 1 min · v2 `image-left` · catalogue

- Titre public : « La commode à tiroirs »
- Image M5 : une commode rangée par taille en lignes et par couleur en colonnes. Règle : le tableau
  croisé compte chaque case A et B, et ses totaux.

### 3.3 Acte 2 — Arbre pondéré, tableau croisé et P_A(B) (45 min)

#### A2-01 · `B2-09-A2-01-DOSSIER` — 2 min · v2 `table` · catalogue

- Titre public : « Le dossier des clients de l’atelier »
- La boutique en ligne, les deux ateliers de couture, les paiements, les questions d'Hélène ; sans
  aucun nombre d'exercice.

#### A2-02 · `B2-09-A2-02-MISSION` — 5 min · `fp-pro` · séance

- Titre public : « Votre mission : lire les clients par groupes »
- Courriel d'Hélène Garnier, trois questions libres : le temps « réfléchir » de N1.

#### A2-03 · `B2-09-A2-03-ENFANT-RUISSEAUX` — 1 min · v2 `image-left` · catalogue

- Titre public : « Les ruisseaux qui se partagent »
- Image M6 : l'eau d'une source se partage, puis chaque ruisseau se partage encore. Règle : on
  multiplie le long d'un chemin ; les branches d'un nœud somment à 1.

#### A2-04 · `B2-09-A2-04-ARBRE-EXEMPLE` — 1 min · v2 `arbre` · catalogue

- Titre public : « Un arbre pondéré, produits au bout des chemins »
- Exemple E1 : P(M) = 0,35, P_M(C) = 0,8, P_M̄(C) = 0,65 ; produits 0,28 ; 0,07 ; 0,4225 ; 0,2275.

#### A2-05 · `B2-09-A2-05-COURS-ARBRE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : l’arbre pondéré et P_A(B) »
- P_A(B), probabilité de B sachant A ; somme des branches d'un nœud ; P(A ∩ B) = P(A) × P_A(B).

#### A2-06 · `B2-09-A2-06-EXEMPLE-ARBRE` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : construire l’arbre des paiements »
- Exemple E1 : quatre étapes, de la première génération au produit P(M ∩ C) = 0,28.

#### A2-07 · `B2-09-A2-07-ATELIER-ARBRE` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 1 — L’arbre des clients de la lettre »
- Temps : réflexion 2 min · travail 6 min · correction 2 min.
- P(L) = 0,4, P_L(A) = 0,55, P_L̄(A) = 0,2.
- `b2-09-a2-lecture` (vote) : 0,55 est P_L(A) ; piège `intersection-pour-conditionnelle`.
- `b2-09-a2-intersection` : P(L ∩ A) = 0,22 ; pièges `branches-additionnees` (0,95),
  `intersection-pour-conditionnelle` (0,55).
- `b2-09-a2-complement` (vote) : P_L̄(Ā) = 0,8 ; piège `complementaire-oublie`.
- `b2-09-a2-chemin` : P(L̄ ∩ Ā) = 0,48 ; pièges `complementaire-oublie` (0,12),
  `branches-additionnees` (1,4).

#### A2-08 · `B2-09-A2-08-VOTE-TABLEAU` — 4 min · `fp-vote` · séance

- Titre public : « Vote : parmi qui compte-t-on ? »
- Deux votes non notés (`mauvais-total-du-tableau`, `conditionnelle-inversee`).

#### A2-09 · `B2-09-A2-09-ENFANT-LOUPE` — 1 min · v2 `image-left` · catalogue

- Titre public : « La loupe sur une ligne »
- Image M7 : une loupe posée sur une seule ligne d'un grand registre. Règle : P_A(B) ne regarde que
  la ligne A.

#### A2-10 · `B2-09-A2-10-COURS-TABLEAU` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : du tableau croisé à P_A(B) »
- P_A(B) = P(A ∩ B) ÷ P(A) ; dans un tableau, effectif de A ∩ B ÷ effectif de A. Exemple : 400
  visiteurs, 250 sur mobile dont 100 acheteurs, 150 sur ordinateur dont 30 acheteurs ;
  P_M(A) = 100 ÷ 250 = 0,4, et non 100 ÷ 400.

#### A2-11 · `B2-09-A2-11-TABLEAU-CROISE` — 10 min · `fp-table-build` · séance

- Titre public : « Exercice 2 — Le tableau croisé des 1 000 commandes »
- Temps : réflexion 2 min · travail 6 min · correction 2 min.
- 1 000 commandes, 300 venues de la lettre ; 35 % d'entre elles comportent un sac, 20 % des autres.
  Attendus : 105 et 195, 140 et 560 ; pièges `mauvais-total-du-tableau` (350, 650, 200, 800).

#### A2-12 · `B2-09-A2-12-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 1 : arbres et tableaux »
- Puis pause de 15 minutes.

### 3.4 Acte 3 — Probabilités totales, puis remonter l'arbre (38 min)

#### A3-01 · `B2-09-A3-01-VOTE-TOTALES` — 4 min · `fp-vote` · séance

- Titre public : « Vote : combien de chemins mènent à B ? »
- Deux votes non notés (`totales-incompletes`, `totales-sans-ponderation`).

#### A3-02 · `B2-09-A3-02-ARBRE-TOTALES` — 1 min · v2 `arbre` · catalogue

- Titre public : « Deux chemins mènent à C »
- Exemple E1 : P(C) = 0,28 + 0,4225, sans la somme : 0,7025 vaut 0,70 au centième, le piège
  `condition-ignoree` de La Rochelle. La somme vient à l'écran suivant, qui n'est pas un arbre.

#### A3-03 · `B2-09-A3-03-COURS-TOTALES` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : les probabilités totales »
- Partition ; P(B) = P(A) × P*A(B) + P(Ā) × P*Ā(B).

#### A3-04 · `B2-09-A3-04-EXEMPLE-TOTALES` — 7 min · `fp-worked` · séance

- Titre public : « Exemple guidé : la part des paiements par carte »
- Exemple E1 : les deux chemins, la somme 0,7025, le contrôle 1 − P(C̄).

#### A3-05 · `B2-09-A3-05-ATELIER-TOTALES` — 8 min · `questionnaire` · séance

- Titre public : « Exercice 3 — Les voiles défectueuses »
- Temps : réflexion 1 min · travail 5 min · correction 2 min.
- P(R) = 0,7, P_R(D) = 0,04, P_F(D) = 0,09.
- `b2-09-a3-formule` (vote) : P(D) = P(R) × P_R(D) + P(F) × P_F(D) ; piège
  `totales-sans-ponderation`.
- `b2-09-a3-defaut` : P(D) = 0,055 ; pièges `totales-sans-ponderation` (0,13),
  `totales-incompletes` (0,028).
- `b2-09-a3-sans-defaut` : P(D̄) = 0,945 ; piège `totales-sans-ponderation` (0,87).

#### A3-06 · `B2-09-A3-06-VOTE-REMONTER` — 4 min · `fp-vote` · séance

- Titre public : « Vote : sachant quoi ? »
- Deux votes non notés (`conditionnelle-inversee`, `condition-ignoree`).

#### A3-07 · `B2-09-A3-07-ARBRE-REMONTER` — 1 min · v2 `arbre` · catalogue

- Titre public : « Remonter l’arbre »
- Exemple E2 : P(R) = 0,65, P_R(V) = 0,5, P_R̄(V) = 0,2 ; P(V) = 0,395 ; P_V(R) ≈ 0,82.

#### A3-08 · `B2-09-A3-08-COURS-REMONTER` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : remonter l’arbre, P_B(A) »
- P_B(A) = P(A ∩ B) ÷ P(B), P(B) par les probabilités totales.

#### A3-09 · `B2-09-A3-09-ATELIER-REMONTER` — 8 min · `questionnaire` · séance

- Titre public : « Exercice 4 — D’où vient la voile défectueuse ? »
- Temps : réflexion 1 min · travail 5 min · correction 2 min.
- `b2-09-a3-remonter` (vote) : P_D(F) = P(F ∩ D) ÷ P(D) ; piège `conditionnelle-inversee`.
- `b2-09-a3-rochefort` : P_D(F) ≈ 0,49 ; pièges `conditionnelle-inversee` (0,09),
  `intersection-pour-conditionnelle` (0,027), `condition-ignoree` (0,3).
- `b2-09-a3-la-rochelle` : P_D(R) ≈ 0,51 ; pièges `conditionnelle-inversee` (0,04),
  `condition-ignoree` (0,7).

#### A3-10 · `B2-09-A3-10-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : probabilités totales »
- Puis pause de 15 minutes.

### 3.5 Acte 4 — Indépendance de deux événements (32 min)

#### A4-01 · `B2-09-A4-01-VOTE-INDEPENDANCE` — 4 min · `fp-vote` · séance

- Titre public : « Vote : indépendants ou incompatibles ? »
- Deux votes non notés (`independance-et-incompatibilite-confondues`, `independance-sans-calcul`).

#### A4-02 · `B2-09-A4-02-ARBRE-INDEPENDANT` — 1 min · v2 `arbre` · catalogue

- Titre public : « Un arbre aux branches qui se répètent »
- Exemple E4 : P(L) = 0,35, P_L(S) = P_L̄(S) = 0,5.

#### A4-03 · `B2-09-A4-03-TABLEAU-INDEPENDANT` — 1 min · v2 `table` · catalogue

- Titre public : « Un tableau aux lignes proportionnelles »
- 240 clients : 84 de la lettre, dont 42 avec un sac ; 156 autres, dont 78 avec un sac.

#### A4-04 · `B2-09-A4-04-ENFANT-PIECE` — 1 min · v2 `image-left` · catalogue

- Titre public : « La pièce et la météo »
- Image M8 : une pièce lancée sous le soleil, puis sous la pluie. Règle : indépendants,
  P_A(B) = P(B).

#### A4-05 · `B2-09-A4-05-COURS-INDEPENDANCE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : justifier l’indépendance »
- P(A ∩ B) = P(A) × P(B), ou P_A(B) = P(B) ; indépendants n'est pas incompatibles.

#### A4-06 · `B2-09-A4-06-EXEMPLE-INDEPENDANCE` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : la lettre et les sacs »
- Exemple du tableau A4-03 : P(L) × P(S) = 0,35 × 0,5 = 0,175 = P(L ∩ S).

#### A4-07 · `B2-09-A4-07-ATELIER-INDEPENDANCE` — 8 min · `questionnaire` · séance

- Titre public : « Exercice 5 — Lettre, mobile et sac : indépendants ? »
- Temps : réflexion 1 min · travail 5 min · correction 2 min.
- P(L) = 0,3, P(B) = 0,2, P(L ∩ B) = 0,06 ; P(M) = 0,45, P(M ∩ B) = 0,12.
- `b2-09-a4-lettre-sac` (vote) : indépendants ; piège `independance-et-incompatibilite-confondues`.
- `b2-09-a4-mobile` : P_M(B) ≈ 0,27 ; pièges `intersection-pour-conditionnelle` (0,12, P(M ∩ B) lue dans l'énoncé),
  `conditionnelle-inversee` (0,6).
- `b2-09-a4-mobile-sac` (vote) : non indépendants ; piège `independance-sans-calcul`.

#### A4-08 · `B2-09-A4-08-ATELIER-SYNTHESE` — 8 min · `questionnaire` · séance

- Titre public : « Exercice 6 — Le paiement en trois fois »
- Temps : réflexion 1 min · travail 5 min · correction 2 min.
- P(T) = 0,3, P_T(R) = 0,16, P_T̄(R) = 0,05. P(R) et P_R(T), même arrondies au centième,
  n'apparaissent dans aucune correction antérieure (garde GR-M3), et aucun piège n'égale au
  centième un nombre d'arbre ni un nombre écrit au catalogue (CONF-01, CONF-03).
- `b2-09-a4-retard` : P(R) = 0,083 ; pièges `totales-sans-ponderation` (0,21),
  `totales-incompletes` (0,048).
- `b2-09-a4-trois-fois` : P_R(T) ≈ 0,58 ; pièges `conditionnelle-inversee` (0,16),
  `condition-ignoree` (0,3).
- `b2-09-a4-independance-retard` (vote) : non indépendants ; piège `independance-sans-calcul`.

#### A4-09 · `B2-09-A4-09-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 3 : l’indépendance »

### 3.6 Acte 5 — Rappel et fiche mémo (8 min)

#### A5-01 · `B2-09-A5-01-RAPPEL` — 6 min · `fp-spaced` · séance

- Titre public : « Rappel : de mémoire, sans vos notes »

#### A5-02 · `B2-09-A5-02-FICHE-MEMO` — 2 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : probabilités conditionnelles »

## 4. Mode papier

Le livret reprend les traces écrites, les arbres et le tableau d'exemple, les énoncés et un cadre de
réponse par question ; il ne contient aucune réponse. Les arbres s'impriment tels qu'à l'écran.

## 5. Contenus

### 5.1 Les valeurs des exercices

- Exercice 1 : P(L ∩ A) = 0,4 × 0,55 = 0,22 ; P(L̄ ∩ Ā) = 0,6 × 0,8 = 0,48.
- Exercice 2 : 300 × 0,35 = 105, 300 − 105 = 195 ; 700 × 0,2 = 140, 700 − 140 = 560.
- Exercice 3 : P(D) = 0,7 × 0,04 + 0,3 × 0,09 = 0,028 + 0,027 = 0,055 ; P(D̄) = 0,945.
- Exercice 4 : P_D(F) = 0,027 ÷ 0,055 ≈ 0,49 ; P_D(R) = 0,028 ÷ 0,055 ≈ 0,51.
- Exercice 5 : 0,3 × 0,2 = 0,06 = P(L ∩ B) ; P_M(B) = 0,12 ÷ 0,45 ≈ 0,27 ≠ 0,2.
- Exercice 6 : P(R) = 0,3 × 0,16 + 0,7 × 0,05 = 0,083 ; P_R(T) = 0,048 ÷ 0,083 ≈ 0,58.

Chaque valeur est recalculée par `b2-09.cours.spec.ts` à partir des seuls paramètres.

### 5.2 Les exemples du cours

E1 : P(M) = 0,35, P_M(C) = 0,8, P_M̄(C) = 0,65 ; produits 0,28, 0,07, 0,4225, 0,2275 ;
P(C) = 0,7025. E2 : P(R) = 0,65, P_R(V) = 0,5, P_R̄(V) = 0,2 ; produits 0,325, 0,325, 0,07, 0,28 ;
P(V) = 0,395 ; P_V(R) ≈ 0,82. E4 : P(L) = 0,35, P_L(S) = P_L̄(S) = 0,5 ; produits 0,175, 0,175,
0,325, 0,325. Aucun nombre servi par un arbre, en valeur ou écrit dans son texte, n'égale au
centième une réponse ou un piège.

### 5.9 Concepts, confusions et remédiations

**Concepts** : `probabilite-d-un-evenement`, `probabilite-conditionnelle`, `probabilites-totales`,
`independance` (nouveaux). **Confusions** : onze, toutes nouvelles.

| Identifiant                                  | Concept                    | Libellé                                                         | Remédiation                    |
| -------------------------------------------- | -------------------------- | --------------------------------------------------------------- | ------------------------------ |
| `complementaire-oublie`                      | probabilite-d-un-evenement | Prendre une autre branche au lieu du complément.                | B2-09-A1-03-ENFANT-CONTRAIRE   |
| `reunion-sans-intersection`                  | probabilite-d-un-evenement | Additionner P(A) et P(B) sans retirer la part commune.          | B2-09-A1-06-ENFANT-REUNION     |
| `intersection-pour-conditionnelle`           | probabilite-conditionnelle | Confondre P_A(B) et P(A ∩ B).                                   | B2-09-A2-05-COURS-ARBRE        |
| `branches-additionnees`                      | probabilite-conditionnelle | Additionner le long d'un chemin au lieu de multiplier.          | B2-09-A2-05-COURS-ARBRE        |
| `condition-ignoree`                          | probabilite-conditionnelle | Répondre P(B) quand la question pose une condition.             | B2-09-A2-09-ENFANT-LOUPE       |
| `mauvais-total-du-tableau`                   | probabilite-conditionnelle | Diviser par l'effectif total au lieu de celui de la condition.  | B2-09-A2-10-COURS-TABLEAU      |
| `totales-sans-ponderation`                   | probabilites-totales       | Additionner les probabilités conditionnelles sans les pondérer. | B2-09-A3-03-COURS-TOTALES      |
| `totales-incompletes`                        | probabilites-totales       | Ne garder qu'un chemin vers B.                                  | B2-09-A3-03-COURS-TOTALES      |
| `conditionnelle-inversee`                    | probabilite-conditionnelle | Confondre P_A(B) et P_B(A).                                     | B2-09-A3-08-COURS-REMONTER     |
| `independance-et-incompatibilite-confondues` | independance               | Croire indépendants deux événements incompatibles.              | B2-09-A4-05-COURS-INDEPENDANCE |
| `independance-sans-calcul`                   | independance               | Conclure à l'indépendance sans calcul.                          | B2-09-A4-05-COURS-INDEPENDANCE |

### 5.10 Rappels espacés

Douze rappels : contraire, réunion, chemin, nœud, P_A(B), tableau, sens de la condition, partition,
pondération, remonter, indépendance, indépendance sur l'arbre. Obligatoires :
`b2-09-r-conditionnelle` et `b2-09-r-ponderation`.

## 8. Médias

### 8.1 Principe

Huit images nouvelles en style d'album jeunesse, une scène, aucune réponse d'exercice : chaque PNG
d'origine (1 536 × 1 024 px) est converti en WebP et servi depuis `/assets/cours/b2-09/v1/`. Les
mini-prompts sont dans `illustrations-b2-09/prompts.md` (espace de travail). Les arbres et les
tableaux sont dessinés par le code. La gravure de l'accroche rejoint `/assets/cours/gravures/v1/`.

### 8.2 Catalogue des médias

| Id  | Écran | Fichier source (page)                                                                            | Original                             | Auteur, date                       | Licence        | Dérivé servi                         | Attribution affichée                                                              |
| --- | ----- | ------------------------------------------------------------------------------------------------ | ------------------------------------ | ---------------------------------- | -------------- | ------------------------------------ | --------------------------------------------------------------------------------- |
| M1  | A1-02 | production propre du cours                                                                       | PNG 1 536 × 1 024 px                 | Asili Design, 2026                 | CC BY-SA 4.0   | `part-du-gateau.webp`                | « La part du gâteau · Asili Design, 2026 · CC BY-SA 4.0 »                         |
| M2  | A1-03 | production propre du cours                                                                       | PNG 1 536 × 1 024 px                 | Asili Design, 2026                 | CC BY-SA 4.0   | `sac-de-billes.webp`                 | « Le sac de billes · Asili Design, 2026 · CC BY-SA 4.0 »                          |
| M3  | A1-04 | production propre du cours                                                                       | PNG 1 536 × 1 024 px                 | Asili Design, 2026                 | CC BY-SA 4.0   | `deux-cerceaux.webp`                 | « Les deux cerceaux · Asili Design, 2026 · CC BY-SA 4.0 »                         |
| M4  | A1-06 | production propre du cours                                                                       | PNG 1 536 × 1 024 px                 | Asili Design, 2026                 | CC BY-SA 4.0   | `cerceaux-reunis.webp`               | « Les cerceaux réunis · Asili Design, 2026 · CC BY-SA 4.0 »                       |
| M5  | A1-07 | production propre du cours                                                                       | PNG 1 536 × 1 024 px                 | Asili Design, 2026                 | CC BY-SA 4.0   | `commode-a-tiroirs.webp`             | « La commode à tiroirs · Asili Design, 2026 · CC BY-SA 4.0 »                      |
| M6  | A2-03 | production propre du cours                                                                       | PNG 1 536 × 1 024 px                 | Asili Design, 2026                 | CC BY-SA 4.0   | `ruisseaux-qui-se-partagent.webp`    | « Les ruisseaux qui se partagent · Asili Design, 2026 · CC BY-SA 4.0 »            |
| M7  | A2-09 | production propre du cours                                                                       | PNG 1 536 × 1 024 px                 | Asili Design, 2026                 | CC BY-SA 4.0   | `loupe-sur-une-ligne.webp`           | « La loupe sur une ligne · Asili Design, 2026 · CC BY-SA 4.0 »                    |
| M8  | A4-04 | production propre du cours                                                                       | PNG 1 536 × 1 024 px                 | Asili Design, 2026                 | CC BY-SA 4.0   | `piece-et-meteo.webp`                | « La pièce et la météo · Asili Design, 2026 · CC BY-SA 4.0 »                      |
| M9  | A1-01 | https://commons.wikimedia.org/wiki/File:Ars_Conjectandi_of_Jakob_Bernoulli,_1713_(1160x1130).png | PNG 1 160 × 1 130 px, servie en JPEG | Jacques Bernoulli, Ars Conjectandi | domaine public | `bernoulli-ars-conjectandi-1713.jpg` | « Jacques Bernoulli, Ars Conjectandi, 1713 · Wikimedia Commons (domaine public) » |

### 8.3 Sources des données

- Clients de la boutique, ateliers de couture, paiements, exemples du cours : données fictives
  créées pour ce cours.
- Gravure de l'accroche : Wikimedia Commons, domaine public.
