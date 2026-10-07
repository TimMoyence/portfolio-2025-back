# B2-02 · Séries statistiques : résumer, relier, prévoir — conception de référence (gabarit v3)

> Cahier des charges du cours B2-02 au gabarit v3 (`docs/cours-gabarit-v3.md`) : une séance de
> 3 h 30 dont 30 minutes de pause, trois notions traitées chacune par un cycle réfléchir → comprendre
> → s'exercer, puis une mini-situation CCF. Il remplace la conception v1 (« Résumer une série sans la
> trahir », 62 écrans, 204 minutes), dont le contenu versionné reste lisible en base pour les séances
> clôturées. Ce document ne contient aucun code exécutable ; toute divergence d'implémentation est un
> défaut de l'implémentation. Les tests `b2-02.cours.spec.ts` relisent ce document : § 3.1, titres
> publics du § 3, § 5.9, § 8.2.

| Rubrique    | Valeur                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| Date        | 28 septembre 2026                                                                                                   |
| Statut      | **Référence pédagogique** : deuxième cours du plan v3 (`docs/cours-bts-cg2-plan-v3.md`), premier au gabarit v3      |
| Cours       | `b2-02-series-statistiques` (ancien slug `b2-02-serie-statistique-une-variable`, redirigé en 301 côté front)        |
| Gabarit     | `v3`, déclaré par le contenu et contrôlé par les quatre règles `gabarit-*` de `verifierStructure`                   |
| Titre servi | « Séries statistiques : résumer, relier, prévoir »                                                                  |
| Durée       | **180 minutes exactes** (somme des écrans), 4 actes de 44, 47, 41 et 48 minutes, plus 2 pauses de 15 min hors durée |
| Écrans      | **37**, dont 17 écrans catalogue                                                                                    |
| Sources     | `docs/donnees-b2-02-sources.md` (espace de travail) : Arcep (série fibre), données Atelier Rivage fictives          |

---

## 0. Synthèse des décisions

- **Une question de gestion en deux temps** : la banque d'Atelier Rivage demande le délai de paiement
  typique des clients professionnels et sa régularité, puis une prévision du chiffre d'affaires 2028
  pour dimensionner une facilité de caisse. La première partie se règle avec une variable, la seconde
  demande deux variables.
- **Une variable en reprise théorique** : les vingt délais du trimestre (dont la facture contestée de
  146 jours) servent à revoir centre, écart et choix du résumé en un seul cycle, sans boîte à
  moustaches ni classes, jamais évaluées seules au CCF.
- **Deux variables comme cœur du cours** : nuage, point moyen, coefficient de corrélation,
  corrélation ≠ causalité, droite des moindres carrés, interpolation, extrapolation, seuil.
- **Une série réelle pour la mini-situation** : abonnements à la fibre optique en France, fin 2020 à
  fin 2024 (Arcep). La valeur réelle de fin 2025, publiée depuis, permet de juger la prévision du
  modèle : elle la surestime, parce que la croissance ralentit.
- **Six fonctions de tableur**, dont trois nouvelles : `MOYENNE`, `MEDIANE` et `ECARTYPEP` sont des
  rappels de la v1 ; `COEFFICIENT.CORRELATION`, `PENTE` et `ORDONNEE.ORIGINE` sont nouvelles. La
  cellule de contrôle E7 ajoute `SI` et `ARRONDI`, déjà connues.
- **Fil rouge « Atelier Rivage » conservé** : la question à deux variables s'y prête (six années de
  chiffre d'affaires, rang de l'année en abscisse), comme le modèle 2024 Ex. 2 A (bénéfice, ajustement,
  année du seuil).

## 1. Objectifs d'apprentissage et public

### 1.1 Rattachement au programme officiel

Module « Statistique descriptive » du BTS CG : série statistique à une variable (reprise), série
statistique à deux variables, nuage de points, point moyen, ajustement affine par la méthode des
moindres carrés, coefficient de corrélation linéaire, interpolation et extrapolation. Capacités :
utiliser la calculatrice ou le tableur pour obtenir les paramètres, interpréter un coefficient de
corrélation, prévoir et discuter la pertinence d'une prévision (`docs/programme-bts-cg-maths-officiel.md`).

### 1.2 Objectifs du cours

À la fin de la séance, l'étudiant sait :

1. résumer une série par un centre et un écart adaptés, en signalant une valeur extrême ;
2. représenter une série à deux variables, placer le point moyen et interpréter r ;
3. distinguer corrélation et causalité ;
4. obtenir au tableur la droite des moindres carrés et l'utiliser pour interpoler, extrapoler et
   trouver l'année d'un seuil, en rédigeant la limite de la prévision.

### 1.3 Public et conditions

BTS CG 2e année, 25 étudiants au plus, calculatrice autorisée, un poste par étudiant ou le livret
papier. Séance de 3 h 30 : 180 minutes de travail, pause de 15 minutes après l'acte 1 et après
l'acte 3.

## 2. Architecture

### 2.1 Les quatre actes

| Acte | Rôle                              | Notion | Minutes |
| ---- | --------------------------------- | ------ | ------: |
| 1    | Ouverture, puis résumer une série | N1     |      44 |
| 2    | Relier deux variables             | N2     |      47 |
| 3    | Prévoir avec une droite           | N3     |      41 |
| 4    | Mini-situation CCF et clôture     | —      |      48 |

Pause 1 (15 min) après le jalon A1-09 ; pause 2 (15 min) après le jalon A3-06. Les pauses ne sont
pas des écrans : le formateur les annonce, la durée programmée n'en tient pas compte.

### 2.2 Le cycle d'une notion

Chaque notion suit : **Réfléchir** (écran interactif de réflexion : `reflection`, `fp-pro` ou vote
non noté) → **Comprendre** (trace écrite en deux pages v2 `lesson` de 3 minutes, puis exemple
guidé `fp-worked` corrigé étape par étape sur son propre écran) → **S'exercer** (exercices notés,
corrigés sur place). Chaque page de trace écrite porte trois blocs : une définition en langage
courant qui dit à quoi sert la notion pour la banque, un exemple pour débuter (rendu `example`,
calcul entièrement déroulé sur trois à cinq valeurs) et une méthode ou un encadré « Au CCF » qui
nomme les pièges. Elle se lit sans orateur ; les notes formateur portent les questions à poser, les
relances et le lien au dossier.

Chaque exercice annonce ses temps dans les notes formateur, sous la forme
`• Temps : réflexion N min · travail N min · correction N min`, dont la somme est la durée de
l'écran. La correction n'a pas d'écran à elle : le formateur la dévoile sur l'écran de l'exercice,
une question, une étape ou une piste à la fois (`correctionSurPlace`), et chaque question corrigée
se ferme aux réponses.

### 2.3 Règles de structure

Le cours passe les dix-sept règles communes et les quatre règles du gabarit v3 : 37 écrans ≤ 40,
180 minutes ≤ 180, chaque trace écrite précédée d'une réflexion et suivie d'un exercice, chaque
exercice avec ses trois temps et sa correction sur place, dont les explications suivent les
questions une à une, mini-situation (`fp-escape`) sans trace écrite après elle. Exposition continue
de 6 minutes au plus.

### 2.4 Diffusion

Catalogue : l'accroche, les deux tableaux de données, le nuage d'Atelier Rivage, les six pages de
trace écrite, chacune suivie de l'illustration de son exemple, et la fiche mémo. Tout le reste est
servi en séance.

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B2-02-A{acte}-{rang}-{SLUG}`, conformes à `^B2-02-A[1-6]-\d{2}-[A-Z0-9-]+$`.
Colonne « Brique · rendu » : valeur de la colonne `brique` ; les écrans « v2 » sont stockés en
`fp-story` avec une présentation v2. « I » = interactif. « Q » = questions fermées notées (vote,
numérique, classement) portées par l'écran.

| Rang | Identifiant                          | Min | Brique · rendu                 |  I  |   Q | Diffusion |
| ---: | ------------------------------------ | --: | ------------------------------ | :-: | --: | --------- |
|    1 | B2-02-A1-01-DIAGNOSTIC               |   4 | `fp-recall`                    |  I  |   1 | seance    |
|    2 | B2-02-A1-02-ACCROCHE                 |   1 | `fp-story` · v2 `hero`         |     |   0 | catalogue |
|    3 | B2-02-A1-03-MISSION                  |   5 | `fp-pro`                       |  I  |   0 | seance    |
|    4 | B2-02-A1-04-FACTURES                 |   2 | `fp-story` · v2 `table`        |     |   0 | catalogue |
|    5 | B2-02-A1-05-UN-SEUL-NOMBRE           |   5 | `fp-story` · v2 `reflection`   |  I  |   0 | seance    |
|    6 | B2-02-A1-06-COURS-RESUMER            |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|    7 | B2-02-A1-06-ILLUSTRATION-RESUMER     |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|    8 | B2-02-A1-06-COURS-ECART              |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|    9 | B2-02-A1-06-ILLUSTRATION-ECART       |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   10 | B2-02-A1-07-EXEMPLE-RESUME           |   8 | `fp-worked`                    |  I  |   0 | seance    |
|   11 | B2-02-A1-08-ATELIER-RESUME           |  12 | `questionnaire`                |  I  |   4 | seance    |
|   12 | B2-02-A1-09-JALON                    |   1 | `fp-pulse`                     |     |   0 | seance    |
|   13 | B2-02-A2-01-NUAGE-RIVAGE             |   2 | `fp-story` · v2 `scatter`      |     |   0 | catalogue |
|   14 | B2-02-A2-02-VOTE-CORRELATION         |   8 | `fp-vote`                      |  I  |   0 | seance    |
|   15 | B2-02-A2-03-COURS-NUAGE              |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   16 | B2-02-A2-03-ILLUSTRATION-NUAGE       |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   17 | B2-02-A2-03-COURS-CORRELATION        |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   18 | B2-02-A2-03-ILLUSTRATION-CORRELATION |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   19 | B2-02-A2-04-EXEMPLE-NUAGE            |   7 | `fp-worked`                    |  I  |   0 | seance    |
|   20 | B2-02-A2-05-ATELIER-NUAGE            |  11 | `questionnaire`                |  I  |   4 | seance    |
|   21 | B2-02-A2-06-ECARTS-POINT-MOYEN       |  12 | `fp-table-build`               |  I  |   0 | seance    |
|   22 | B2-02-A2-07-JALON                    |   1 | `fp-pulse`                     |     |   0 | seance    |
|   23 | B2-02-A3-01-JUSQU-OU                 |   5 | `fp-story` · v2 `reflection`   |  I  |   0 | seance    |
|   24 | B2-02-A3-02-COURS-DROITE             |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   25 | B2-02-A3-02-ILLUSTRATION-DROITE      |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   26 | B2-02-A3-02-COURS-PREVOIR            |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   27 | B2-02-A3-02-ILLUSTRATION-PREVOIR     |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   28 | B2-02-A3-03-EXEMPLE-DROITE           |   8 | `fp-worked`                    |  I  |   0 | seance    |
|   29 | B2-02-A3-04-ATELIER-DROITE           |  11 | `questionnaire`                |  I  |   4 | seance    |
|   30 | B2-02-A3-05-DEFI-IA                  |  10 | `fp-challenge`                 |  I  |   0 | seance    |
|   31 | B2-02-A3-06-JALON                    |   1 | `fp-pulse`                     |     |   0 | seance    |
|   32 | B2-02-A4-01-SITUATION-FIBRE          |   3 | `fp-story` · v2 `table`        |     |   0 | catalogue |
|   33 | B2-02-A4-02-TABLEUR-FIBRE            |  17 | `fp-sheet`                     |  I  |   0 | seance    |
|   34 | B2-02-A4-03-COFFRE-FIBRE             |  16 | `fp-escape`                    |  I  |   0 | seance    |
|   35 | B2-02-A4-04-RAPPEL                   |   6 | `fp-spaced`                    |  I  |   0 | seance    |
|   36 | B2-02-A4-05-FICHE-MEMO               |   2 | `fp-story` · v2 `grid`         |     |   0 | catalogue |
|   37 | B2-02-A4-06-BILLET-DE-SORTIE         |   4 | `fp-exit`                      |  I  |   1 | seance    |

Rythme : 149 minutes interactives, 31 d'exposition, exposition continue de 6 minutes au plus.
Chaque trace écrite garde ses 3 minutes, partagées avec l'illustration de son exemple qui la suit :
2 minutes pour la page, 1 minute pour l'image. Le plafond d'exposition continue (6 minutes) et la
séance de 180 minutes interdisent d'ajouter une minute aux traces écrites.

### 3.2 Acte 1 — Ouverture, puis résumer une série (44 min)

#### A1-01 · `B2-02-A1-01-DIAGNOSTIC` — 4 min · `fp-recall` · séance

- Titre public : « Diagnostic : le délai du milieu »
- Énoncé (`b2-02-a1-diagnostic`) : cinq délais 35, 20, 140, 25 et 30 jours ; quel délai partage les
  clients en deux groupes de même effectif ? Bonne réponse « 30 jours ». Pièges : « 50 jours »
  (`moyenne-lue-comme-mediane`), « 140 jours » (`mediane-sans-tri`).
- Papier : question du livret, réponse entourée, vote à main levée.

#### A1-02 · `B2-02-A1-02-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Résumer, relier, prévoir »
- Atelier Rivage et le dossier de la banque ; plan en trois notions et une mini-situation.

#### A1-03 · `B2-02-A1-03-MISSION` — 5 min · `fp-pro` · séance

- Titre public : « Votre mission : le dossier de la banque »
- Hélène Garnier transmet la demande de la banque (délai de paiement habituel et régularité, puis
  prévision du chiffre d'affaires 2028) avec ses notes : vingt factures payées entre 18 et 75 jours,
  sauf F105 contestée (146 jours) ; 610 k€ en 2020, 826 k€ en 2025. Trois questions libres, chacune
  répondable en citant l'écran, sans calcul : quelle demande porte sur le passé, laquelle sur
  l'avenir (`demandes`) ; pourquoi « nos clients paient en 146 jours » tromperait la banque (`f105`) ;
  peut-on promettre la hausse jusqu'en 2028 (`prevision`).
- Papier : trois lignes d'écriture dans le livret.

#### A1-04 · `B2-02-A1-04-FACTURES` — 2 min · v2 `table` · catalogue

- Titre public : « Les vingt délais de paiement du trimestre »
- Les vingt factures F101 à F120 et leur délai, F105 contestée (146 jours).

#### A1-05 · `B2-02-A1-05-UN-SEUL-NOMBRE` — 5 min · v2 `reflection` · séance

- Titre public : « Réfléchir : un seul nombre suffit-il ? »
- Réflexion écrite : quel nombre annoncer à la banque, et que cache-t-il ? Temps « réfléchir » de N1.
- Papier : cadre de réponse du livret.

#### A1-06 · `B2-02-A1-06-COURS-RESUMER` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : le centre d’une série, moyenne et médiane »
- Page 1 sur 2, trois blocs : série, moyenne et médiane en langage courant, et pourquoi la banque
  veut le délai habituel ; exemple pour débuter (cinq factures 10, 14, 8, 12, 56 jours : moyenne
  20, médiane 12) ; méthode de la médiane (tri, effectif pair ou impair, piège du milieu non trié).

#### A1-06 · `B2-02-A1-06-ILLUSTRATION-RESUMER` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : cinq factures »
- Image seule (M1) : l'exemple pour débuter de la page 1 en schéma (moyenne 20 jours, tri, médiane
  12 jours, la facture de 56 jours qui tire la moyenne).

#### A1-06 · `B2-02-A1-06-COURS-ECART` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : la régularité d’une série, l’écart-type »
- Page 2 sur 2, trois blocs : étendue, écart interquartile, écart-type et variance ; exemple pour
  débuter (deux clients de même moyenne 10 jours, écarts-types 2 et ≈ 7,07 jours) ; au CCF (valeur
  extrême gardée et signalée, `ECARTYPEP` pour une population, unité).

#### A1-06 · `B2-02-A1-06-ILLUSTRATION-ECART` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : deux clients, même moyenne »
- Image seule (M2) : l'exemple pour débuter de la page 2 en schéma (écarts à 10 jours, carrés,
  variances 4 et 50 jours², écarts-types 2 et ≈ 7,07 jours).

#### A1-07 · `B2-02-A1-07-EXEMPLE-RESUME` — 8 min · `fp-worked` · séance

- Titre public : « Exemple guidé : huit factures de septembre »
- Huit délais 28, 41, 35, 90, 33, 39, 44, 30 : moyenne 42,5, tri, médiane 37, effet de la facture de
  90 jours, écart-type ≈ 18,66 jours, choix du résumé. 6 min de réponses sous chaque étape, puis
  2 min de correction dévoilée étape par étape sur le même écran.
- Papier : réponses sous chaque étape du livret.

#### A1-08 · `B2-02-A1-08-ATELIER-RESUME` — 12 min · `questionnaire` · séance

- Titre public : « Exercice 1 — Le centre et l’écart des vingt délais »
- Temps : réflexion 2 min · travail 8 min · correction 2 min, question par question sur place.
- `b2-02-a1-mediane` : 43 jours ; pièges 39,5 (`mediane-sans-tri`), 42 (`mediane-rang-pair`), 47,75
  (`moyenne-lue-comme-mediane`).
- `b2-02-a1-moyenne` : 47,75 jours ; pièges 42,58 (`valeur-extreme-supprimee`), 43
  (`moyenne-lue-comme-mediane`).
- `b2-02-a1-ecart-type` : 26,2 jours ; pièges 26,88 (`ecart-type-population-echantillon`), 686,49
  (`variance-confondue-avec-ecart-type`).
- `b2-02-a1-resume` (vote) : garder la facture contestée, la signaler, publier la médiane avec la
  moyenne et un écart ; pièges `valeur-extreme-ignoree`, `valeur-extreme-supprimee`.
- Papier : exercice 1 du livret.

#### A1-09 · `B2-02-A1-09-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 1 : résumer une série »
- Puis pause de 15 minutes.

### 3.3 Acte 2 — Relier deux variables (47 min)

#### A2-01 · `B2-02-A2-01-NUAGE-RIVAGE` — 2 min · v2 `scatter` · catalogue

- Titre public : « Six années de chiffre d’affaires d’Atelier Rivage »
- Nuage des six points (rang 1 à 6 pour 2020 à 2025 ; 610, 652, 694, 736, 790, 826 k€), sans point
  moyen ni droite.

#### A2-02 · `B2-02-A2-02-VOTE-CORRELATION` — 8 min · `fp-vote` · séance

- Titre public : « Vote : deux séries qui montent ensemble »
- Vote puis revote, non notés (temps « réfléchir » de N2). Vote 1 : ventes de voiles et ventes du
  glacier voisin, mois par mois ; vote 2 : chiffre d'affaires et heures de formation. Bonne réponse :
  une troisième variable (la saison, le temps) ; piège `correlation-prise-pour-causalite`.
- Papier : vote à main levée, puis revote après discussion en binôme.

#### A2-03 · `B2-02-A2-03-COURS-NUAGE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : nuage de points et point moyen »
- Page 1 sur 2, trois blocs : série à deux variables, nuage et point moyen, et ce que le nuage
  montre à la banque ; exemple pour débuter (boutique, x = 1, 2, 3 et y = 4, 5, 9 : G(2 ; 6), pas le
  point du milieu (2 ; 5)) ; méthode pour placer G et contrôler par la somme nulle des écarts.

#### A2-03 · `B2-02-A2-03-ILLUSTRATION-NUAGE` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : une boutique, trois années »
- Image seule (M3) : l'exemple pour débuter de la page 1 en schéma (tableau, nuage des trois points,
  x̄ = 2, ȳ = 6, point moyen G(2 ; 6)).

#### A2-03 · `B2-02-A2-03-COURS-CORRELATION` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : le coefficient de corrélation r »
- Page 2 sur 2, trois blocs : r mesure l'alignement, entre −1 et 1, et son signe ; exemple pour
  débuter (r de la boutique à la main par les écarts au point moyen, 5 ÷ √28 ≈ 0,945) ; au CCF (r
  n'est pas la pente, r négatif, corrélation n'est pas causalité, phrase de rédaction).

#### A2-03 · `B2-02-A2-03-ILLUSTRATION-CORRELATION` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : r de la boutique, à la main »
- Image seule (M4) : l'exemple pour débuter de la page 2 en schéma (écarts au point moyen, produits
  de somme 5, sommes des carrés 2 et 14, r = 5 ÷ √28 ≈ 0,945).

#### A2-04 · `B2-02-A2-04-EXEMPLE-NUAGE` — 7 min · `fp-worked` · séance

- Titre public : « Exemple guidé : publicité et commandes »
- Quatre mois : publicité 2, 4, 6, 8 (centaines d'euros), commandes 11, 15, 20, 22 ; G(5 ; 17),
  r ≈ 0,988, lecture et prudence sur la cause. 5 min de réponses, puis 2 min de correction dévoilée
  étape par étape sur le même écran.

#### A2-05 · `B2-02-A2-05-ATELIER-NUAGE` — 11 min · `questionnaire` · séance

- Titre public : « Exercice 2 — Le nuage d’Atelier Rivage »
- Temps : réflexion 2 min · travail 7 min · correction 2 min, question par question sur place.
- `b2-02-a2-x-moyen` : 3,5 ; piège 21 (`point-moyen-confondu`).
- `b2-02-a2-y-moyen` : 718 k€ ; pièges 715 et 4 308 (`point-moyen-confondu`).
- `b2-02-a2-r` : 0,999 ; piège 43,89 (`correlation-lue-comme-pente`).
- `b2-02-a2-lecture-r` (vote) : ajustement affine justifié ; pièges `correlation-prise-pour-causalite`,
  `correlation-lue-comme-pente`.

#### A2-06 · `B2-02-A2-06-ECARTS-POINT-MOYEN` — 12 min · `fp-table-build` · séance

- Titre public : « Exercice 3 — Les écarts au point moyen »
- Temps : réflexion 2 min · travail 8 min · correction 2 min sur place.
- Tableau : rang, chiffre d'affaires, puis saisie de xᵢ − x̄ et yᵢ − ȳ ; piège xᵢ − 3
  (`point-moyen-confondu`). Les signes des écarts, toujours les mêmes deux à deux, montrent la
  corrélation positive.
- Papier : tableau du livret.

#### A2-07 · `B2-02-A2-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : relier deux variables »

### 3.4 Acte 3 — Prévoir avec une droite (41 min)

#### A3-01 · `B2-02-A3-01-JUSQU-OU` — 5 min · v2 `reflection` · séance

- Titre public : « Réfléchir : jusqu’où prolonger une tendance ? »
- Réflexion écrite : quelle droite tracer dans le nuage, et jusqu'à quelle année s'y fier.

#### A3-02 · `B2-02-A3-02-COURS-DROITE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : la droite des moindres carrés »
- Page 1 sur 2, trois blocs : la droite au plus près des points, passage par G, sens de a et de b ;
  exemple pour débuter (droite de la boutique y = 2,5x + 1, contrôle par G, écarts verticaux) ;
  méthode au tableur (`PENTE`, `ORDONNEE.ORIGINE`, plages dans l'ordre, contrôle par G).

#### A3-02 · `B2-02-A3-02-ILLUSTRATION-DROITE` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : la droite de la boutique »
- Image seule (M5) : l'exemple pour débuter de la page 1 en schéma (pente a = 2,5, ordonnée à
  l'origine b = 1, contrôle par G, résidus 0,5 ; −1 ; 0,5 et somme de leurs carrés 1,5).

#### A3-02 · `B2-02-A3-02-COURS-PREVOIR` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : prévoir avec la droite, et ses limites »
- Page 2 sur 2, trois blocs : prévoir par le rang, interpoler, extrapoler, et pourquoi 2028 porte une
  réserve ; exemple pour débuter (boutique : 13,5 k€ au rang 5, seuil de 18 atteint au rang 7) ;
  rédiger au CCF (pièges, phrases modèles, seuil à l'entier supérieur).

#### A3-02 · `B2-02-A3-02-ILLUSTRATION-PREVOIR` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : la boutique en 2026, puis le seuil de 18 »
- Image seule (M6) : l'exemple pour débuter de la page 2 en schéma (rang 5 pour 2026, prévision
  13,5 k€, seuil x ≥ 6,8, premier rang entier 7, soit 2028).

#### A3-03 · `B2-02-A3-03-EXEMPLE-DROITE` — 8 min · `fp-worked` · séance

- Titre public : « Exemple guidé : la droite de la publicité »
- Même série qu'en A2-04 : a = 1,9, b = 7,5, passage par G, prévision pour 10 (26,5 commandes), seuil
  de 30 commandes (x ≥ 11,84, donc 1 200 €), limite de l'extrapolation. 6 min de réponses, puis
  2 min de correction dévoilée étape par étape sur le même écran.

#### A3-04 · `B2-02-A3-04-ATELIER-DROITE` — 11 min · `questionnaire` · séance

- Titre public : « Exercice 4 — Prévoir le chiffre d’affaires »
- Temps : réflexion 2 min · travail 7 min · correction 2 min, question par question sur place.
- `b2-02-a3-pente` : 43,89 ; pièges 0,02 et 564,4 (`pente-ordonnee-inversees`).
- `b2-02-a3-ordonnee` : 564,4 ; piège 43,89 (`pente-ordonnee-inversees`).
- `b2-02-a3-prevision` : 959 k€ en 2028 (rang 9) ; piège 89 565 (`rang-pris-pour-annee`).
- `b2-02-a3-seuil` : 2029 (premier rang 10 pour 1 000 k€) ; piège 2028 (`seuil-mal-arrondi`).

#### A3-05 · `B2-02-A3-05-DEFI-IA` — 10 min · `fp-challenge` · séance

- Titre public : « Exercice 5 — Corriger la prévision d’une IA »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, piste par piste sur place.
- Une IA prolonge la droite jusqu'en 2035 avec l'année à la place du rang et conclut que les hausses
  de tarifs causent la croissance. Pistes justes : rang, extrapolation lointaine, causalité, contrôle
  par G ; piste fausse : garder la réponse parce que r est proche de 1.

#### A3-06 · `B2-02-A3-06-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 3 : prévoir avec une droite »
- Puis pause de 15 minutes.

### 3.5 Acte 4 — Mini-situation CCF et clôture (48 min)

#### A4-01 · `B2-02-A4-01-SITUATION-FIBRE` — 3 min · v2 `table` · catalogue

- Titre public : « Mini-situation CCF : la fibre optique en France »
- Abonnements à la fibre, fin 2020 à fin 2024 : 10,3 ; 14,5 ; 18,1 ; 21,4 ; 24,4 millions (Arcep).

#### A4-02 · `B2-02-A4-02-TABLEUR-FIBRE` — 17 min · `fp-sheet` · séance

- Titre public : « Question tableur (3 points sur 10) : ajuster la série »
- Temps : réflexion 3 min · travail 12 min · correction 2 min sur place, cellule par cellule (E2,
  E3 et E4, E5 à E7).
- Feuille : rangs en A2:A6, abonnements en B2:B6 ; six cellules attendues : E2
  `=COEFFICIENT.CORRELATION(A2:A6;B2:B6)`, E3 `=PENTE(B2:B6;A2:A6)`, E4
  `=ORDONNEE.ORIGINE(B2:B6;A2:A6)`, E5 `=MOYENNE(A2:A6)`, E6 `=MOYENNE(B2:B6)`, E7 contrôle du passage
  par le point moyen. Pièges : pente des séries inversées (`pente-ordonnee-inversees`).
- Papier : la même question se traite à la calculatrice, formules écrites sur la copie ; en CCF, elle
  se fait devant l'examinateur (appel).

#### A4-03 · `B2-02-A4-03-COFFRE-FIBRE` — 16 min · `fp-escape` · séance

- Titre public : « Mini-situation : prévoir et juger la prévision »
- Temps : réflexion 2 min · travail 12 min · correction 2 min sur place, énigme par énigme.
- E1 prévision fin 2025 (28,27 millions ; pièges `rang-pris-pour-annee`, `pente-ordonnee-inversees`) ;
  E2 année du seuil de 35 millions (2027 ; piège `seuil-mal-arrondi`) ; E3 prévision fin 2030
  (45,82 millions ; piège `rang-pris-pour-annee`) ; E4 écart entre la hausse annuelle du modèle et la
  hausse observée en 2025, 2,7 millions (0,81 ; piège `extrapolation-sans-reserve`).
- Papier : quatre questions rédigées du livret, sans code de coffre.

#### A4-04 · `B2-02-A4-04-RAPPEL` — 6 min · `fp-spaced` · séance

- Titre public : « Rappel : de mémoire, sans vos notes »

#### A4-05 · `B2-02-A4-05-FICHE-MEMO` — 2 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : résumer, relier, prévoir »

#### A4-06 · `B2-02-A4-06-BILLET-DE-SORTIE` — 4 min · `fp-exit` · séance

- Titre public : « Billet de sortie : la phrase pour la banque »

## 4. Mode papier

Le livret étudiant reprend, dans l'ordre des écrans, les traces écrites, les énoncés et un cadre de
réponse par question ; il ne contient aucune bonne réponse. Le corrigé formateur ajoute les réponses,
les pièges et le barème. Sans poste, le formateur pilote les révélations depuis le pupitre ; les votes
se font à main levée, la feuille de calcul à la calculatrice.

## 5. Contenus

### 5.9 Concepts, confusions et remédiations

**Concepts** : `serie-statistique`, `moyenne`, `mediane`, `ecart-type`, `dispersion`,
`choix-du-resume`, `nuage-de-points`, `correlation`, `ajustement-affine`, `prevision`.
**Confusions** : huit de la v1 (une variable), `correlation-prise-pour-causalite` du B2-01, et sept
nouvelles (deux variables). Les concepts et confusions de la v1 non repris ici restent dans la banque :
les versions clôturées du cours y renvoient encore.

| Identifiant                          | Concept           | Libellé                                                         | Remédiation                   |
| ------------------------------------ | ----------------- | --------------------------------------------------------------- | ----------------------------- |
| `moyenne-lue-comme-mediane`          | mediane           | Croire que la moyenne partage la série en deux moitiés.         | B2-02-A1-07-EXEMPLE-RESUME    |
| `mediane-sans-tri`                   | mediane           | Prendre la valeur du milieu de la liste sans trier.             | B2-02-A1-07-EXEMPLE-RESUME    |
| `mediane-rang-pair`                  | mediane           | Retenir une seule des deux valeurs centrales.                   | B2-02-A1-07-EXEMPLE-RESUME    |
| `valeur-extreme-ignoree`             | choix-du-resume   | Résumer par la moyenne une série tirée par une valeur extrême.  | B2-02-A1-06-COURS-ECART       |
| `valeur-extreme-supprimee`           | choix-du-resume   | Retirer une valeur extrême gênante sans pièce.                  | B2-02-A1-06-COURS-ECART       |
| `ecart-type-population-echantillon`  | ecart-type        | Confondre division par n et par n − 1.                          | B2-02-A1-06-COURS-ECART       |
| `variance-confondue-avec-ecart-type` | ecart-type        | Donner la variance comme écart-type.                            | B2-02-A1-06-COURS-ECART       |
| `etendue-prise-pour-dispersion`      | dispersion        | Juger la dispersion sur la seule étendue.                       | B2-02-A1-06-COURS-ECART       |
| `correlation-prise-pour-causalite`   | lecture-graphique | Conclure sur une cause à partir de deux évolutions simultanées. | B2-02-A2-03-COURS-CORRELATION |
| `point-moyen-confondu`               | nuage-de-points   | Prendre le point du milieu du tableau pour le point moyen.      | B2-02-A2-04-EXEMPLE-NUAGE     |
| `correlation-lue-comme-pente`        | correlation       | Lire r comme la pente de la droite.                             | B2-02-A2-03-COURS-CORRELATION |
| `correlation-jugee-au-signe`         | correlation       | Juger l'ajustement au signe de r.                               | B2-02-A2-03-COURS-CORRELATION |
| `pente-ordonnee-inversees`           | ajustement-affine | Inverser les séries dans PENTE, ou la pente et l'ordonnée.      | B2-02-A3-03-EXEMPLE-DROITE    |
| `rang-pris-pour-annee`               | prevision         | Remplacer x par l'année au lieu du rang.                        | B2-02-A3-03-EXEMPLE-DROITE    |
| `seuil-mal-arrondi`                  | prevision         | Arrondir le rang d'un seuil à l'entier inférieur.               | B2-02-A3-03-EXEMPLE-DROITE    |
| `extrapolation-sans-reserve`         | prevision         | Prolonger une tendance loin des données sans réserve.           | B2-02-A3-02-COURS-PREVOIR     |

### 5.10 Rappels espacés

Douze rappels : médiane (tri, effectif pair), écart-type (population, variance), valeur extrême,
étendue, point moyen, lecture de r (signe, pente), causalité, rang ou année, seuil. Obligatoires :
`b2-02-r-causalite` et `b2-02-r-rang`.

## 8. Médias

### 8.1 Principe

Le nuage est dessiné par le rendu `scatter`, les tableaux par le rendu `table`. Chaque trace écrite
est suivie d'un écran `illustration` qui ne montre que l'image de son exemple pour débuter : six
illustrations produites pour le cours, aux mêmes nombres que la trace écrite qu'elles suivent.

### 8.2 Catalogue des médias

Chaque PNG d'origine (1 774 × 887 px) est converti en WebP de 1 600 px de large et servi depuis
`/assets/cours/b2-02/v2/` ; le dossier `v1` garde les médias de la conception v1, que relisent les
séances clôturées. Le catalogue est stocké avec le cours (`Cours.medias`) et contrôlé par la règle
`media-sans-licence`.

| Id  | Écran | Fichier source (page)      | Original                   | Auteur, date       | Licence      | Dérivé servi                           | Attribution affichée                                                             |
| --- | ----- | -------------------------- | -------------------------- | ------------------ | ------------ | -------------------------------------- | -------------------------------------------------------------------------------- |
| M1  | A1-06 | production propre du cours | PNG 1 774 × 887 px, 1,6 Mo | Asili Design, 2026 | CC BY-SA 4.0 | `cinq-factures.webp`                   | « Pour débuter : cinq factures · Asili Design, 2026 · CC BY-SA 4.0 »             |
| M2  | A1-06 | production propre du cours | PNG 1 774 × 887 px, 1,6 Mo | Asili Design, 2026 | CC BY-SA 4.0 | `deux-clients-meme-moyenne.webp`       | « Deux clients, même moyenne · Asili Design, 2026 · CC BY-SA 4.0 »               |
| M3  | A2-03 | production propre du cours | PNG 1 774 × 887 px, 1,6 Mo | Asili Design, 2026 | CC BY-SA 4.0 | `boutique-nuage-point-moyen.webp`      | « Une boutique, trois années · Asili Design, 2026 · CC BY-SA 4.0 »               |
| M4  | A2-03 | production propre du cours | PNG 1 774 × 887 px, 1,5 Mo | Asili Design, 2026 | CC BY-SA 4.0 | `boutique-coefficient-r.webp`          | « r de la boutique, à la main · Asili Design, 2026 · CC BY-SA 4.0 »              |
| M5  | A3-02 | production propre du cours | PNG 1 774 × 887 px, 1,5 Mo | Asili Design, 2026 | CC BY-SA 4.0 | `boutique-droite-moindres-carres.webp` | « La droite de la boutique · Asili Design, 2026 · CC BY-SA 4.0 »                 |
| M6  | A3-02 | production propre du cours | PNG 1 774 × 887 px, 1,5 Mo | Asili Design, 2026 | CC BY-SA 4.0 | `boutique-prevision-seuil.webp`        | « La boutique en 2026, puis le seuil de 18 · Asili Design, 2026 · CC BY-SA 4.0 » |

### 8.3 Sources des données

- Vingt délais et chiffre d'affaires d'Atelier Rivage : données fictives créées pour le cours.
- Abonnements à la fibre optique : Arcep, Observatoire des marchés des communications électroniques,
  chiffres des 4es trimestres 2020 à 2025, données publiques réutilisables ; détail et calculs dans
  `docs/donnees-b2-02-sources.md`.
