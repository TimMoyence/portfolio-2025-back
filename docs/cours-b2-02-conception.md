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
| Écrans      | **38**, dont 8 écrans catalogue                                                                                     |
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
- **Cinq fonctions de tableur** au plus : `MOYENNE`, `MEDIANE`, `ECARTYPEP` (rappel),
  `COEFFICIENT.CORRELATION`, `PENTE`, `ORDONNEE.ORIGINE` ; `MEDIANE` et `ECARTYPEP` sont des rappels de
  la v1, seules les trois dernières sont nouvelles.
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
non noté) → **Comprendre** (trace écrite, rendu v2 `lesson`, 6 minutes au plus, puis exemple guidé
`fp-worked` et son corrigé) → **S'exercer** (exercices notés, chacun suivi de son écran de
correction). Chaque exercice annonce ses temps dans les notes formateur, sous la forme
`• Temps : réflexion N min · travail N min`, dont la somme est la durée de l'écran ; la correction
est l'écran suivant.

### 2.3 Règles de structure

Le cours passe les seize règles communes et les quatre règles du gabarit v3 : 38 écrans ≤ 40,
180 minutes ≤ 180, chaque trace écrite précédée d'une réflexion et suivie d'un exercice, chaque
exercice avec ses temps et sa correction, mini-situation (`fp-escape`) sans trace écrite après elle.
Exposition continue de 6 minutes au plus.

### 2.4 Diffusion

Catalogue : l'accroche, les deux tableaux de données, le nuage d'Atelier Rivage, les trois traces
écrites et la fiche mémo. Tout le reste est servi en séance.

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B2-02-A{acte}-{rang}-{SLUG}`, conformes à `^B2-02-A[1-6]-\d{2}-[A-Z0-9-]+$`.
Colonne « Brique · rendu » : valeur de la colonne `brique` ; les écrans « v2 » sont stockés en
`fp-story` avec une présentation v2. « I » = interactif. « Q » = questions fermées notées (vote,
numérique, classement) portées par l'écran.

| Rang | Identifiant                    | Min | Brique · rendu                  |  I  |   Q | Diffusion |
| ---: | ------------------------------ | --: | ------------------------------- | :-: | --: | --------- |
|    1 | B2-02-A1-01-DIAGNOSTIC         |   4 | `fp-recall`                     |  I  |   1 | seance    |
|    2 | B2-02-A1-02-ACCROCHE           |   1 | `fp-story` · v2 `hero`          |     |   0 | catalogue |
|    3 | B2-02-A1-03-MISSION            |   5 | `fp-pro`                        |  I  |   0 | seance    |
|    4 | B2-02-A1-04-FACTURES           |   2 | `fp-story` · v2 `table`         |     |   0 | catalogue |
|    5 | B2-02-A1-05-UN-SEUL-NOMBRE     |   5 | `fp-story` · v2 `reflection`    |  I  |   0 | seance    |
|    6 | B2-02-A1-06-COURS-RESUMER      |   6 | `fp-story` · v2 `lesson`        |     |   0 | catalogue |
|    7 | B2-02-A1-07-EXEMPLE-RESUME     |   6 | `fp-worked`                     |  I  |   0 | seance    |
|    8 | B2-02-A1-07-CORRECTION         |   2 | `fp-worked`                     |     |   0 | seance    |
|    9 | B2-02-A1-08-ATELIER-RESUME     |  10 | `questionnaire`                 |  I  |   4 | seance    |
|   10 | B2-02-A1-08-CORRECTION         |   2 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   11 | B2-02-A1-09-JALON              |   1 | `fp-pulse`                      |     |   0 | seance    |
|   12 | B2-02-A2-01-NUAGE-RIVAGE       |   2 | `fp-story` · v2 `scatter`       |     |   0 | catalogue |
|   13 | B2-02-A2-02-VOTE-CORRELATION   |   8 | `fp-vote`                       |  I  |   0 | seance    |
|   14 | B2-02-A2-03-COURS-NUAGE        |   6 | `fp-story` · v2 `lesson`        |     |   0 | catalogue |
|   15 | B2-02-A2-04-EXEMPLE-NUAGE      |   5 | `fp-worked`                     |  I  |   0 | seance    |
|   16 | B2-02-A2-04-CORRECTION         |   2 | `fp-worked`                     |     |   0 | seance    |
|   17 | B2-02-A2-05-ATELIER-NUAGE      |   9 | `questionnaire`                 |  I  |   4 | seance    |
|   18 | B2-02-A2-05-CORRECTION         |   2 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   19 | B2-02-A2-06-ECARTS-POINT-MOYEN |  10 | `fp-table-build`                |  I  |   0 | seance    |
|   20 | B2-02-A2-06-CORRECTION         |   2 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   21 | B2-02-A2-07-JALON              |   1 | `fp-pulse`                      |     |   0 | seance    |
|   22 | B2-02-A3-01-JUSQU-OU           |   5 | `fp-story` · v2 `reflection`    |  I  |   0 | seance    |
|   23 | B2-02-A3-02-COURS-DROITE       |   6 | `fp-story` · v2 `lesson`        |     |   0 | catalogue |
|   24 | B2-02-A3-03-EXEMPLE-DROITE     |   6 | `fp-worked`                     |  I  |   0 | seance    |
|   25 | B2-02-A3-03-CORRECTION         |   2 | `fp-worked`                     |     |   0 | seance    |
|   26 | B2-02-A3-04-ATELIER-DROITE     |   9 | `questionnaire`                 |  I  |   4 | seance    |
|   27 | B2-02-A3-04-CORRECTION         |   2 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   28 | B2-02-A3-05-DEFI-IA            |   8 | `fp-challenge`                  |  I  |   0 | seance    |
|   29 | B2-02-A3-05-CORRECTION         |   2 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   30 | B2-02-A3-06-JALON              |   1 | `fp-pulse`                      |     |   0 | seance    |
|   31 | B2-02-A4-01-SITUATION-FIBRE    |   3 | `fp-story` · v2 `table`         |     |   0 | catalogue |
|   32 | B2-02-A4-02-TABLEUR-FIBRE      |  15 | `fp-sheet`                      |  I  |   0 | seance    |
|   33 | B2-02-A4-02-CORRECTION         |   2 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   34 | B2-02-A4-03-COFFRE-FIBRE       |  14 | `fp-escape`                     |  I  |   0 | seance    |
|   35 | B2-02-A4-03-CORRECTION         |   2 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   36 | B2-02-A4-04-RAPPEL             |   6 | `fp-spaced`                     |  I  |   0 | seance    |
|   37 | B2-02-A4-05-FICHE-MEMO         |   2 | `fp-story` · v2 `grid`          |     |   0 | catalogue |
|   38 | B2-02-A4-06-BILLET-DE-SORTIE   |   4 | `fp-exit`                       |  I  |   1 | seance    |

Rythme : 129 minutes interactives, 51 d'exposition, exposition continue de 6 minutes au plus.

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
- Hélène Garnier transmet la demande de la banque : délai de paiement typique et régularité, puis
  prévision du chiffre d'affaires 2028. Trois questions libres : que mesure-t-on, combien de nombres,
  que faut-il vérifier avant une prévision.
- Papier : trois lignes d'écriture dans le livret.

#### A1-04 · `B2-02-A1-04-FACTURES` — 2 min · v2 `table` · catalogue

- Titre public : « Les vingt délais de paiement du trimestre »
- Les vingt factures F101 à F120 et leur délai, F105 contestée (146 jours).

#### A1-05 · `B2-02-A1-05-UN-SEUL-NOMBRE` — 5 min · v2 `reflection` · séance

- Titre public : « Réfléchir : un seul nombre suffit-il ? »
- Réflexion écrite : quel nombre annoncer à la banque, et que cache-t-il ? Temps « réfléchir » de N1.
- Papier : cadre de réponse du livret.

#### A1-06 · `B2-02-A1-06-COURS-RESUMER` — 6 min · v2 `lesson` · catalogue

- Titre public : « Cours : résumer une série par un centre et un écart »
- Quatre blocs : moyenne et médiane (définition, méthode du tri) ; mesurer l'écart (étendue, écart
  interquartile, écart-type) ; une valeur extrême (propriété) ; rédiger au CCF (tableur, unité,
  variance en unité²).

#### A1-07 · `B2-02-A1-07-EXEMPLE-RESUME` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : huit factures de septembre »
- Huit délais 28, 41, 35, 90, 33, 39, 44, 30 : moyenne 42,5, tri, médiane 37, effet de la facture de
  90 jours, écart-type ≈ 18,66 jours, choix du résumé.
- Papier : réponses sous chaque étape du livret.

#### A1-07 · `B2-02-A1-07-CORRECTION` — 2 min · `fp-worked` · séance

- Titre public : « Correction : huit factures de septembre »

#### A1-08 · `B2-02-A1-08-ATELIER-RESUME` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 1 — Le centre et l’écart des vingt délais »
- Temps : réflexion 2 min · travail 8 min.
- `b2-02-a1-mediane` : 43 jours ; pièges 39,5 (`mediane-sans-tri`), 42 (`mediane-rang-pair`), 47,75
  (`moyenne-lue-comme-mediane`).
- `b2-02-a1-moyenne` : 47,75 jours ; pièges 42,58 (`valeur-extreme-supprimee`), 43
  (`moyenne-lue-comme-mediane`).
- `b2-02-a1-ecart-type` : 26,2 jours ; pièges 26,88 (`ecart-type-population-echantillon`), 686,49
  (`variance-confondue-avec-ecart-type`).
- `b2-02-a1-resume` (vote) : garder la facture contestée, la signaler, publier la médiane avec la
  moyenne et un écart ; pièges `valeur-extreme-ignoree`, `valeur-extreme-supprimee`.
- Papier : exercice 1 du livret.

#### A1-08 · `B2-02-A1-08-CORRECTION` — 2 min · v2 `answer-review` · séance

- Titre public : « Correction de l’exercice 1 »

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

#### A2-03 · `B2-02-A2-03-COURS-NUAGE` — 6 min · v2 `lesson` · catalogue

- Titre public : « Cours : nuage de points, point moyen, corrélation »
- Quatre blocs : série à deux variables et nuage ; point moyen G(x̄ ; ȳ) ; coefficient r ; corrélation
  n'est pas causalité.

#### A2-04 · `B2-02-A2-04-EXEMPLE-NUAGE` — 5 min · `fp-worked` · séance

- Titre public : « Exemple guidé : publicité et commandes »
- Quatre mois : publicité 2, 4, 6, 8 (centaines d'euros), commandes 11, 15, 20, 22 ; G(5 ; 17),
  r ≈ 0,988, lecture et prudence sur la cause.

#### A2-04 · `B2-02-A2-04-CORRECTION` — 2 min · `fp-worked` · séance

- Titre public : « Correction : publicité et commandes »

#### A2-05 · `B2-02-A2-05-ATELIER-NUAGE` — 9 min · `questionnaire` · séance

- Titre public : « Exercice 2 — Le nuage d’Atelier Rivage »
- Temps : réflexion 2 min · travail 7 min.
- `b2-02-a2-x-moyen` : 3,5 ; piège 21 (`point-moyen-confondu`).
- `b2-02-a2-y-moyen` : 718 k€ ; pièges 715 et 4 308 (`point-moyen-confondu`).
- `b2-02-a2-r` : 0,999 ; piège 43,89 (`correlation-lue-comme-pente`).
- `b2-02-a2-lecture-r` (vote) : ajustement affine justifié ; pièges `correlation-prise-pour-causalite`,
  `correlation-lue-comme-pente`.

#### A2-05 · `B2-02-A2-05-CORRECTION` — 2 min · v2 `answer-review` · séance

- Titre public : « Correction de l’exercice 2 »

#### A2-06 · `B2-02-A2-06-ECARTS-POINT-MOYEN` — 10 min · `fp-table-build` · séance

- Titre public : « Exercice 3 — Les écarts au point moyen »
- Temps : réflexion 2 min · travail 8 min.
- Tableau : rang, chiffre d'affaires, puis saisie de xᵢ − x̄ et yᵢ − ȳ ; piège xᵢ − 3
  (`point-moyen-confondu`). Les signes des écarts, toujours les mêmes deux à deux, montrent la
  corrélation positive.
- Papier : tableau du livret.

#### A2-06 · `B2-02-A2-06-CORRECTION` — 2 min · v2 `answer-review` · séance

- Titre public : « Correction de l’exercice 3 »

#### A2-07 · `B2-02-A2-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : relier deux variables »

### 3.4 Acte 3 — Prévoir avec une droite (41 min)

#### A3-01 · `B2-02-A3-01-JUSQU-OU` — 5 min · v2 `reflection` · séance

- Titre public : « Réfléchir : jusqu’où prolonger une tendance ? »
- Réflexion écrite : quelle droite tracer dans le nuage, et jusqu'à quelle année s'y fier.

#### A3-02 · `B2-02-A3-02-COURS-DROITE` — 6 min · v2 `lesson` · catalogue

- Titre public : « Cours : la droite des moindres carrés et la prévision »
- Quatre blocs : la droite des moindres carrés (a, b, passage par G, tableur) ; prévoir (rang, pas
  année ; interpolation, extrapolation) ; seuil (premier rang entier) ; rédiger au CCF.

#### A3-03 · `B2-02-A3-03-EXEMPLE-DROITE` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : la droite de la publicité »
- Même série qu'en A2-04 : a = 1,9, b = 7,5, passage par G, prévision pour 10 (26,5 commandes), seuil
  de 30 commandes (x ≥ 11,84, donc 1 200 €), limite de l'extrapolation.

#### A3-03 · `B2-02-A3-03-CORRECTION` — 2 min · `fp-worked` · séance

- Titre public : « Correction : la droite de la publicité »

#### A3-04 · `B2-02-A3-04-ATELIER-DROITE` — 9 min · `questionnaire` · séance

- Titre public : « Exercice 4 — Prévoir le chiffre d’affaires »
- Temps : réflexion 2 min · travail 7 min.
- `b2-02-a3-pente` : 43,89 ; pièges 0,02 et 564,4 (`pente-ordonnee-inversees`).
- `b2-02-a3-ordonnee` : 564,4 ; piège 43,89 (`pente-ordonnee-inversees`).
- `b2-02-a3-prevision` : 959 k€ en 2028 (rang 9) ; piège 89 565 (`rang-pris-pour-annee`).
- `b2-02-a3-seuil` : 2029 (premier rang 10 pour 1 000 k€) ; piège 2028 (`seuil-mal-arrondi`).

#### A3-04 · `B2-02-A3-04-CORRECTION` — 2 min · v2 `answer-review` · séance

- Titre public : « Correction de l’exercice 4 »

#### A3-05 · `B2-02-A3-05-DEFI-IA` — 8 min · `fp-challenge` · séance

- Titre public : « Exercice 5 — Corriger la prévision d’une IA »
- Temps : réflexion 2 min · travail 6 min.
- Une IA prolonge la droite jusqu'en 2035 avec l'année à la place du rang et conclut que les hausses
  de tarifs causent la croissance. Pistes justes : rang, extrapolation lointaine, causalité, contrôle
  par G ; piste fausse : garder la réponse parce que r est proche de 1.

#### A3-05 · `B2-02-A3-05-CORRECTION` — 2 min · v2 `answer-review` · séance

- Titre public : « Correction de l’exercice 5 »

#### A3-06 · `B2-02-A3-06-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 3 : prévoir avec une droite »
- Puis pause de 15 minutes.

### 3.5 Acte 4 — Mini-situation CCF et clôture (48 min)

#### A4-01 · `B2-02-A4-01-SITUATION-FIBRE` — 3 min · v2 `table` · catalogue

- Titre public : « Mini-situation CCF : la fibre optique en France »
- Abonnements à la fibre, fin 2020 à fin 2024 : 10,3 ; 14,5 ; 18,1 ; 21,4 ; 24,4 millions (Arcep).

#### A4-02 · `B2-02-A4-02-TABLEUR-FIBRE` — 15 min · `fp-sheet` · séance

- Titre public : « Question tableur (3 points sur 10) : ajuster la série »
- Temps : réflexion 3 min · travail 12 min.
- Feuille : rangs en A2:A6, abonnements en B2:B6 ; six cellules attendues : E2
  `=COEFFICIENT.CORRELATION(A2:A6;B2:B6)`, E3 `=PENTE(B2:B6;A2:A6)`, E4
  `=ORDONNEE.ORIGINE(B2:B6;A2:A6)`, E5 `=MOYENNE(A2:A6)`, E6 `=MOYENNE(B2:B6)`, E7 contrôle du passage
  par le point moyen. Pièges : pente des séries inversées (`pente-ordonnee-inversees`).
- Papier : la même question se traite à la calculatrice, formules écrites sur la copie ; en CCF, elle
  se fait devant l'examinateur (appel).

#### A4-02 · `B2-02-A4-02-CORRECTION` — 2 min · v2 `answer-review` · séance

- Titre public : « Correction de la question tableur »

#### A4-03 · `B2-02-A4-03-COFFRE-FIBRE` — 14 min · `fp-escape` · séance

- Titre public : « Mini-situation : prévoir et juger la prévision »
- Temps : réflexion 2 min · travail 12 min.
- E1 prévision fin 2025 (28,27 millions ; pièges `rang-pris-pour-annee`, `pente-ordonnee-inversees`) ;
  E2 année du seuil de 35 millions (2027 ; piège `seuil-mal-arrondi`) ; E3 prévision fin 2030
  (45,82 millions ; piège `rang-pris-pour-annee`) ; E4 écart entre la hausse annuelle du modèle et la
  hausse observée en 2025, 2,7 millions (0,81 ; piège `extrapolation-sans-reserve`).
- Papier : quatre questions rédigées du livret, sans code de coffre.

#### A4-03 · `B2-02-A4-03-CORRECTION` — 2 min · v2 `answer-review` · séance

- Titre public : « Correction de la mini-situation »

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

| Identifiant                          | Concept           | Libellé                                                         | Remédiation                |
| ------------------------------------ | ----------------- | --------------------------------------------------------------- | -------------------------- |
| `moyenne-lue-comme-mediane`          | mediane           | Croire que la moyenne partage la série en deux moitiés.         | B2-02-A1-07-EXEMPLE-RESUME |
| `mediane-sans-tri`                   | mediane           | Prendre la valeur du milieu de la liste sans trier.             | B2-02-A1-07-EXEMPLE-RESUME |
| `mediane-rang-pair`                  | mediane           | Retenir une seule des deux valeurs centrales.                   | B2-02-A1-07-EXEMPLE-RESUME |
| `valeur-extreme-ignoree`             | choix-du-resume   | Résumer par la moyenne une série tirée par une valeur extrême.  | B2-02-A1-06-COURS-RESUMER  |
| `valeur-extreme-supprimee`           | choix-du-resume   | Retirer une valeur extrême gênante sans pièce.                  | B2-02-A1-06-COURS-RESUMER  |
| `ecart-type-population-echantillon`  | ecart-type        | Confondre division par n et par n − 1.                          | B2-02-A1-06-COURS-RESUMER  |
| `variance-confondue-avec-ecart-type` | ecart-type        | Donner la variance comme écart-type.                            | B2-02-A1-06-COURS-RESUMER  |
| `etendue-prise-pour-dispersion`      | dispersion        | Juger la dispersion sur la seule étendue.                       | B2-02-A1-06-COURS-RESUMER  |
| `correlation-prise-pour-causalite`   | lecture-graphique | Conclure sur une cause à partir de deux évolutions simultanées. | B2-02-A2-03-COURS-NUAGE    |
| `point-moyen-confondu`               | nuage-de-points   | Prendre le point du milieu du tableau pour le point moyen.      | B2-02-A2-04-EXEMPLE-NUAGE  |
| `correlation-lue-comme-pente`        | correlation       | Lire r comme la pente de la droite.                             | B2-02-A2-03-COURS-NUAGE    |
| `correlation-jugee-au-signe`         | correlation       | Juger l'ajustement au signe de r.                               | B2-02-A2-03-COURS-NUAGE    |
| `pente-ordonnee-inversees`           | ajustement-affine | Inverser les séries dans PENTE, ou la pente et l'ordonnée.      | B2-02-A3-03-EXEMPLE-DROITE |
| `rang-pris-pour-annee`               | prevision         | Remplacer x par l'année au lieu du rang.                        | B2-02-A3-03-EXEMPLE-DROITE |
| `seuil-mal-arrondi`                  | prevision         | Arrondir le rang d'un seuil à l'entier inférieur.               | B2-02-A3-03-EXEMPLE-DROITE |
| `extrapolation-sans-reserve`         | prevision         | Prolonger une tendance loin des données sans réserve.           | B2-02-A3-02-COURS-DROITE   |

### 5.10 Rappels espacés

Douze rappels : médiane (tri, effectif pair), écart-type (population, variance), valeur extrême,
étendue, point moyen, lecture de r (signe, pente), causalité, rang ou année, seuil. Obligatoires :
`b2-02-r-causalite` et `b2-02-r-rang`.

## 8. Médias

### 8.1 Principe

Aucune image : le nuage est dessiné par le rendu `scatter`, les tableaux par le rendu `table`.

### 8.2 Catalogue des médias

Aucun média catalogué.

### 8.3 Sources des données

- Vingt délais et chiffre d'affaires d'Atelier Rivage : données fictives créées pour le cours.
- Abonnements à la fibre optique : Arcep, Observatoire des marchés des communications électroniques,
  chiffres des 4es trimestres 2020 à 2025, données publiques réutilisables ; détail et calculs dans
  `docs/donnees-b2-02-sources.md`.
