# B2-02 · Résumer une série sans la trahir — conception de référence

> Cahier des charges de référence du cours B2-02 : statistique descriptive à une variable, au niveau
> du B2-01 et sur le même moteur de cours (mêmes briques, mêmes règles de structure, même garde de
> confidentialité, même contrat commun des cours servis). Le fil rouge « Atelier Rivage » continue :
> après le comité du B2-01, la banque demande des chiffres. Ce document ne contient aucun code
> exécutable ; toute divergence d’implémentation est un défaut de l’implémentation, pas une liberté.
> Les tests `b2-02.cours.spec.ts` relisent ce document : § 3.1, titres publics du § 3, § 5.9, § 8.2.

| Rubrique    | Valeur                                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Date        | 27 septembre 2026                                                                                                                             |
| Statut      | **Référence pédagogique** : deuxième cours de la progression BTS CG 2 (B2-01 → B2-12)                                                         |
| Cours       | `b2-02-serie-statistique-une-variable`, contenu unique du cours (`b2-02.cours.ts`), publié au démarrage de l’API dès que son empreinte change |
| Titre servi | « Résumer une série sans la trahir »                                                                                                          |
| Durée       | **204 minutes exactes** (somme des écrans), 6 actes de 33, 34, 31, 33, 47 et 26 minutes, plus une pause de 15 minutes hors durée              |
| Écrans      | **62**, dont 8 écrans catalogue                                                                                                               |
| Sources     | `docs/donnees-b2-02-sources.md` (espace de travail) : Insee, Banque de France, DVF, Légifrance, référentiel BTS CG                            |

---

## 0. Synthèse des décisions

- **Une question de gestion, pas un chapitre** : « Quel délai de paiement annoncer à la banque, et avec
  quelle régularité ? ». Chaque notion (médiane, quartiles, écart-type, boîte, classes) arrive parce
  qu’elle répond à une question que la précédente laisse ouverte.
- **Une série unique, vingt factures**, avec une valeur extrême réelle et contestée (F105, 146 jours) :
  elle rend visibles, sans artifice, l’écart moyenne/médiane, la fragilité de l’étendue et la
  résistance des quartiles.
- **Deux conventions de quartile assumées** : la convention du cours (rang ⌈n ÷ 4⌉ et ⌈3n ÷ 4⌉, une
  valeur de la série) et celle du tableur (`QUARTILE`, interpolée). La feuille A4-02 les confronte ;
  la confusion `convention-de-quartile-ignoree` la mesure.
- **Écart-type population d’abord** (`ECARTYPEP`, division par n) : c’est la définition du
  programme ; `ECARTYPE` (n − 1) n’apparaît que pour un échantillon explicite.
- **Données réelles pour transférer** : salaires du privé (Insee), délais fournisseurs (Banque de
  France), prix des locaux (DVF), patrimoine (Insee). Les nombres publiés restent ceux des sources.
- **Même moteur que le B2-01** : aucune brique nouvelle ; le rendu `boxplot` et les confusions du
  B2-02 existaient déjà dans le moteur. Le cours est ajouté à `CONTENUS` et passe le contrat commun.

## 1. Objectifs d’apprentissage et public

### 1.1 Rattachement au programme officiel

Module **« Statistique descriptive »** du programme de mathématiques du BTS Comptabilité et gestion
(arrêté du 4 juin 2013, annexes I et II ; épreuve **E3 – Mathématiques appliquées** depuis l’arrêté
du 8 juillet 2024). Capacités visées : exploiter une série statistique à une variable ; déterminer
et interpréter les paramètres de position (moyenne, médiane, quartiles) et de dispersion (étendue,
écart interquartile, écart-type) ; représenter une série (diagramme en boîte, histogramme) ; utiliser
le tableur pour calculer ces paramètres. La variance n’est qu’un intermédiaire de calcul.

### 1.2 Objectifs du cours B2-02

À la fin de la séance, l’étudiant sait :

1. décrire une série : population, individu, caractère, effectif, effectif cumulé, unité, période ;
2. calculer une moyenne (avec effectifs), une médiane (effectif pair ou impair), des quartiles selon
   la convention du cours ;
3. mesurer la dispersion : étendue, écart interquartile, écart-type de la population, et dire quand
   diviser par n − 1 ;
4. lire et comparer des boîtes à moustaches, en vérifiant où s’arrêtent les moustaches ;
5. calculer avec des classes : centres, effectifs cumulés, classe médiane, densité d’un histogramme ;
6. choisir le résumé à publier quand une valeur extrême tire la série, et l’écrire pour un tiers.

### 1.3 Public et conditions

BTS CG 2, groupe de 24 à 35 étudiants, un poste par étudiant, calculatrice et tableur autorisés.
Prérequis : B2-01 (proportions, taux, lecture critique d’un chiffre). Séance de 3 h 30 avec une
pause de 15 minutes après le jalon 3.

## 2. Architecture

### 2.1 Les six actes

| Acte | Question                                          | Minutes | Notions                                        |
| ---- | ------------------------------------------------- | ------: | ---------------------------------------------- |
| A1   | Que regarde-t-on, et combien de nombres faut-il ? |      33 | série, vocabulaire, fiche d’identité           |
| A2   | Moyenne ou médiane ?                              |      34 | moyenne, médiane, valeur extrême, choix        |
| A3   | Les délais sont-ils réguliers ?                   |      31 | étendue, quartiles, EIQ, écart-type            |
| A4   | Le tableur et la boîte disent-ils la même chose ? |      33 | fonctions du tableur, boîte à moustaches       |
| A5   | Que faire quand les valeurs sont en classes ?     |      47 | effectifs cumulés, centres, densité, choix     |
| A6   | Saurez-vous le refaire seul·e ?                   |      26 | transfert, IA, rappel espacé, billet de sortie |

### 2.2 Le fil rouge « Atelier Rivage »

Lundi 11 janvier 2027. Les vingt factures professionnelles émises au 2e trimestre 2026 sont toutes
encaissées au 31 décembre 2026. La chargée d’affaires demande « le délai de paiement de vos clients
professionnels et sa régularité » pour dimensionner une facilité de caisse. Samir a préparé une
diapositive : « 48 jours en moyenne, nous sommes dans les clous » (plafond de 60 jours, Code de
commerce, art. L441-10). Hélène Garnier, la dirigeante, veut une vérification avant envoi.

### 2.3 Règles de structure

Le cours passe `verifierStructure` sans dérogation : premier écran `fp-recall`, dernier `fp-exit`,
durée = somme des écrans, exposition continue ≤ 6 min (4 min au plus ici), ratio interactif ≥ 0,3
(151 min interactives pour 53 d’exposition), temps notés ≤ 15 min et suites ≥ 8 min, renvois vers
l’amont, corrections après leur source, confidentialité (§ 6).

### 2.4 Diffusion

Huit écrans catalogue, sans réponse : accroche, plan, factures, fiche d’identité, diapositive de
Samir, Quetelet, Galton, boîte à outils. Tous les autres sont servis en séance et verrouillés au
catalogue.

## 3. Déroulé écran par écran

### 3.1 Vue d’ensemble

Identifiants : `B2-02-A{acte}-{rang}-{SLUG}`, conformes à `^B2-02-A[1-6]-\d{2}-[A-Z0-9-]+$`.
Colonne « Brique · rendu » : valeur de la colonne `brique` ; les écrans « v2 » sont stockés en
`fp-story` avec une présentation v2. « I » = interactif. « Q » = questions fermées notées (vote,
numérique, classement) portées par l’écran.

| Rang | Identifiant                       | Min | Brique · rendu                  |  I  |   Q | Diffusion |
| ---: | --------------------------------- | --: | ------------------------------- | :-: | --: | --------- |
|    1 | B2-02-A1-01-DIAGNOSTIC            |   3 | `fp-recall`                     |  I  |   1 | seance    |
|    2 | B2-02-A1-02-ACCROCHE              |   1 | `fp-story` · v2 `hero`          |     |   0 | catalogue |
|    3 | B2-02-A1-03-MISSION               |   4 | `fp-pro`                        |  I  |   0 | seance    |
|    4 | B2-02-A1-04-PLAN                  |   1 | `fp-story` · v2 `method-path`   |     |   0 | catalogue |
|    5 | B2-02-A1-05-FACTURES              |   2 | `fp-story` · v2 `table`         |     |   0 | catalogue |
|    6 | B2-02-A1-06-VOCABULAIRE           |   8 | `fp-cardsort`                   |  I  |   1 | seance    |
|    7 | B2-02-A1-06-CORRECTION            |   1 | `fp-story` · v2 `sort-review`   |     |   0 | seance    |
|    8 | B2-02-A1-07-FICHE-SERIE           |   3 | `fp-story` · v2 `grid`          |     |   0 | catalogue |
|    9 | B2-02-A1-08-QUESTION-DE-LA-BANQUE |   3 | `fp-story` · v2 `reflection`    |  I  |   0 | seance    |
|   10 | B2-02-A1-09-DIAPOSITIVE           |   2 | `fp-story` · v2 `stats`         |     |   0 | catalogue |
|   11 | B2-02-A1-10-AUDIT-DIAPOSITIVE     |   3 | `fp-challenge`                  |  I  |   0 | seance    |
|   12 | B2-02-A1-10-CORRECTION            |   1 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   13 | B2-02-A1-11-JALON-1               |   1 | `fp-pulse`                      |     |   0 | seance    |
|   14 | B2-02-A2-01-QUETELET              |   2 | `fp-story` · v2 `image-left`    |     |   0 | catalogue |
|   15 | B2-02-A2-02-DEUX-CENTRES          |   4 | `fp-worked`                     |  I  |   0 | seance    |
|   16 | B2-02-A2-02-CORRECTION            |   2 | `fp-worked` (piloté)            |     |   0 | seance    |
|   17 | B2-02-A2-03-ATELIER-1             |   6 | `questionnaire`                 |  I  |   3 | seance    |
|   18 | B2-02-A2-03-CORRECTION-1          |   1 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   19 | B2-02-A2-03-ATELIER-1-SUITE       |   6 | `questionnaire`                 |  I  |   3 | seance    |
|   20 | B2-02-A2-03-CORRECTION-2          |   1 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   21 | B2-02-A2-04-FACTURE-LITIGE        |   2 | `fp-concept4`                   |     |   0 | seance    |
|   22 | B2-02-A2-05-MOYENNE-OU-MEDIANE    |   8 | `fp-cardsort`                   |  I  |   1 | seance    |
|   23 | B2-02-A2-05-CORRECTION            |   1 | `fp-story` · v2 `sort-review`   |     |   0 | seance    |
|   24 | B2-02-A2-06-JALON-2               |   1 | `fp-pulse`                      |     |   0 | seance    |
|   25 | B2-02-A3-01-VOTE-SEGMENTS         |   8 | `fp-vote`                       |  I  |   2 | seance    |
|   26 | B2-02-A3-02-DISPERSION            |   4 | `fp-worked`                     |  I  |   0 | seance    |
|   27 | B2-02-A3-02-CORRECTION            |   2 | `fp-worked` (piloté)            |     |   0 | seance    |
|   28 | B2-02-A3-03-DEUX-ECARTS-TYPES     |   2 | `fp-story` · v2 `comparison`    |     |   0 | seance    |
|   29 | B2-02-A3-04-ATELIER-2             |   6 | `questionnaire`                 |  I  |   3 | seance    |
|   30 | B2-02-A3-04-CORRECTION-1          |   1 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   31 | B2-02-A3-04-ATELIER-2-SUITE       |   6 | `questionnaire`                 |  I  |   2 | seance    |
|   32 | B2-02-A3-04-CORRECTION-2          |   1 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   33 | B2-02-A3-05-JALON-3               |   1 | `fp-pulse`                      |     |   0 | seance    |
|   34 | B2-02-A4-01-GALTON                |   2 | `fp-story` · v2 `image-left`    |     |   0 | catalogue |
|   35 | B2-02-A4-02-FEUILLE-DELAIS        |  15 | `fp-sheet`                      |  I  |   0 | seance    |
|   36 | B2-02-A4-03-BOITE-DELAIS          |   2 | `fp-story` · v2 `boxplot`       |     |   0 | seance    |
|   37 | B2-02-A4-04-BDF                   |   2 | `fp-story` · v2 `boxplot`       |     |   0 | seance    |
|   38 | B2-02-A4-05-ATELIER-3             |   7 | `questionnaire`                 |  I  |   3 | seance    |
|   39 | B2-02-A4-05-CORRECTION            |   1 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   40 | B2-02-A4-06-LECTURE               |   3 | `fp-story` · v2 `reflection`    |  I  |   0 | seance    |
|   41 | B2-02-A4-07-JALON-4               |   1 | `fp-pulse`                      |     |   0 | seance    |
|   42 | B2-02-A5-01-HISTOGRAMME           |   2 | `fp-story` · v2 `chart`         |     |   0 | seance    |
|   43 | B2-02-A5-02-CLASSES               |   4 | `fp-worked`                     |  I  |   0 | seance    |
|   44 | B2-02-A5-02-CORRECTION            |   2 | `fp-worked` (piloté)            |     |   0 | seance    |
|   45 | B2-02-A5-03-EFFECTIFS-CUMULES     |   8 | `fp-table-build`                |  I  |   0 | seance    |
|   46 | B2-02-A5-03-CORRECTION            |   1 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   47 | B2-02-A5-04-ATELIER-4             |   6 | `questionnaire`                 |  I  |   3 | seance    |
|   48 | B2-02-A5-04-CORRECTION-1          |   1 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   49 | B2-02-A5-04-ATELIER-4-SUITE       |   6 | `questionnaire`                 |  I  |   2 | seance    |
|   50 | B2-02-A5-04-CORRECTION-2          |   1 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   51 | B2-02-A5-05-QUEL-GRAPHIQUE        |   8 | `fp-cardsort`                   |  I  |   1 | seance    |
|   52 | B2-02-A5-05-CORRECTION            |   1 | `fp-story` · v2 `sort-review`   |     |   0 | seance    |
|   53 | B2-02-A5-06-DOSSIER-BANQUE        |   2 | `fp-story` · v2 `table`         |     |   0 | seance    |
|   54 | B2-02-A5-07-NOTE-BANQUE           |   4 | `fp-challenge`                  |  I  |   0 | seance    |
|   55 | B2-02-A5-08-JALON-5               |   1 | `fp-pulse`                      |     |   0 | seance    |
|   56 | B2-02-A6-01-COFFRE                |  10 | `fp-escape`                     |  I  |   0 | seance    |
|   57 | B2-02-A6-01-CORRECTION            |   1 | `fp-story` · v2 `answer-review` |     |   0 | seance    |
|   58 | B2-02-A6-02-IA-ERREUR             |   4 | `fp-challenge`                  |  I  |   0 | seance    |
|   59 | B2-02-A6-03-RAPPEL                |   4 | `fp-spaced`                     |  I  |   0 | seance    |
|   60 | B2-02-A6-04-FICHE-MEMO            |   2 | `fp-story` · v2 `grid`          |     |   0 | seance    |
|   61 | B2-02-A6-05-BOITE-A-OUTILS        |   2 | `fp-story` · v2 `grid`          |     |   0 | catalogue |
|   62 | B2-02-A6-06-BILLET-DE-SORTIE      |   3 | `fp-exit`                       |  I  |   1 | seance    |

Questions : 28 notées (13 votes, 10 numériques, 3 classements, 1 feuille, 1 tableau), 4 énigmes,
13 rappels. Temps notés : A1-06, A2-03 (×2), A2-05, A3-01, A3-04 (×2), A4-05, A5-04 (×2), A5-05.

### 3.2 Acte 1 — Décrire la série (33 min)

#### A1-01 · `B2-02-A1-01-DIAGNOSTIC` — 3 min · `fp-recall` · séance

- Titre public : « Diagnostic : le délai du milieu »
- Énoncé (`b2-02-a1-diagnostic`) : cinq délais 35, 20, 140, 25 et 30 jours ; quel délai partage les
  clients en deux groupes de même effectif ? Bonne réponse « 30 jours ». Pièges : « 50 jours »
  (`moyenne-lue-comme-mediane`), « 140 jours » (`mediane-sans-tri`). Sans délai d’écriture.

#### A1-02 · `B2-02-A1-02-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Résumer une série sans la trahir »
- Situation d’Atelier Rivage et demande de la banque ; aucun nombre de la série.

#### A1-03 · `B2-02-A1-03-MISSION` — 4 min · `fp-pro` · séance

- Titre public : « Votre mission : répondre à la banque »
- Trois questions libres : que mesure-t-on, un seul nombre suffit-il, que vérifier avant d’envoyer.

#### A1-04 · `B2-02-A1-04-PLAN` — 1 min · v2 `method-path` · catalogue

- Titre public : « Le plan de la séance »
- Six étapes, une par acte, question → preuve → résultat.

#### A1-05 · `B2-02-A1-05-FACTURES` — 2 min · v2 `table` · catalogue

- Titre public : « Les vingt factures du 2e trimestre 2026 »
- Tableau F101 à F120, type de client, délai ; F105 signalée « facture contestée ». Données § 4.1.

#### A1-06 · `B2-02-A1-06-VOCABULAIRE` — 8 min · `fp-cardsort` · séance

- Titre public : « Que désigne chaque élément du fichier ? »
- Six catégories (population, individu, caractère, valeur, effectif, effectif cumulé), huit cartes.
  Confusions : `role-statistique-confondu`, `effectif-cumule-confondu`. Renvoi A1-05.

#### A1-06 · `B2-02-A1-06-CORRECTION` — 1 min · v2 `sort-review` · séance

- Titre public : « Correction : les mots de la statistique »

#### A1-07 · `B2-02-A1-07-FICHE-SERIE` — 3 min · v2 `grid` · catalogue

- Titre public : « La fiche d’identité d’une série »
- Six cartes : population, caractère, effectif, unité, période, source. Aucun nombre de la série.

#### A1-08 · `B2-02-A1-08-QUESTION-DE-LA-BANQUE` — 3 min · v2 `reflection` · séance

- Titre public : « La question de la banque, en statistique »
- Réécrire la demande en population, caractère, période et deux mesures (un centre, un écart).
  Renvoi A1-03, cadré sur la situation.

#### A1-09 · `B2-02-A1-09-DIAPOSITIVE` — 2 min · v2 `stats` · catalogue

- Titre public : « La diapositive de Samir pour la banque »
- « 48 jours », « 60 jours » (L441-10), « dans les clous ». La moyenne exacte n’est jamais écrite.

#### A1-10 · `B2-02-A1-10-AUDIT-DIAPOSITIVE` — 3 min · `fp-challenge` · séance

- Titre public : « Audit de la diapositive »
- Stratégies : extrême, milieu, écart, plafond ; piste fausse : retirer la facture contestée.

#### A1-10 · `B2-02-A1-10-CORRECTION` — 1 min · v2 `answer-review` · séance

- Titre public : « Correction : l’audit de la diapositive »

#### A1-11 · `B2-02-A1-11-JALON-1` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 1 : où en êtes-vous ? »

### 3.3 Acte 2 — Trouver le centre (34 min)

#### A2-01 · `B2-02-A2-01-QUETELET` — 2 min · v2 `image-left` · catalogue

- Titre public : « 1835 : Quetelet et l’homme moyen »
- Média M1 (§ 8.2).

#### A2-02 · `B2-02-A2-02-DEUX-CENTRES` — 4 min · `fp-worked` · séance

- Titre public : « Deux centres pour huit factures »
- Huit délais de septembre 2026 : 28, 41, 35, 90, 33, 39, 44, 30. Étapes : moyenne 42,5 ; tri ;
  médiane 37 ; écart des centres ; sans la facture de 90 jours (35,7 et 35) ; moyenne avec effectifs
  (2 × 30 + 6 × 50) ÷ 8 = 45.

#### A2-02 · `B2-02-A2-02-CORRECTION` — 2 min · `fp-worked` (piloté) · séance

- Titre public : « Correction : deux centres pour huit factures »

#### A2-03 · `B2-02-A2-03-ATELIER-1` — 6 min · `questionnaire` · séance

- Titre public : « Atelier 1 — Le centre des vingt délais »
- `b2-02-a2-mediane` : 43 (pièges 39,5 sans tri ; 42 et 44 rang pair ; 47,75 moyenne).
- `b2-02-a2-moyenne` : 47,75 (pièges 42,578947 sans F105 ; 43 médiane).
- `b2-02-a2-au-dessus` : vote « Moins de la moitié : 7 factures sur 20 ».

#### A2-03 · `B2-02-A2-03-CORRECTION-1` — 1 min · v2 `answer-review` · séance

- Titre public : « Correction de l’atelier 1 : questions 1 à 3 »

#### A2-03 · `B2-02-A2-03-ATELIER-1-SUITE` — 6 min · `questionnaire` · séance

- Titre public : « Atelier 1 — Le centre des vingt délais (suite) »
- `b2-02-a2-facture-contestee` : garder, signaler, publier un résumé que F105 ne tire pas.
- `b2-02-a2-salaire-moyen` : 2 735 € ± 2 (Insee publie 2 733 €) ; piège 2 813,50 (moyenne simple).
- `b2-02-a2-relances` : 19 ÷ 20 = 0,95 ; pièges 2 et 4.

#### A2-03 · `B2-02-A2-03-CORRECTION-2` — 1 min · v2 `answer-review` · séance

- Titre public : « Correction de l’atelier 1 : questions 4 à 6 »

#### A2-04 · `B2-02-A2-04-FACTURE-LITIGE` — 2 min · `fp-concept4` · séance

- Titre public : « La facture contestée : qui bouge, qui résiste ? »
- Paramètre `litige` de 20 à 200 (146 par défaut) ; étapes `MOYENNE` et `MEDIANE` des vingt délais.

#### A2-05 · `B2-02-A2-05-MOYENNE-OU-MEDIANE` — 8 min · `fp-cardsort` · séance

- Titre public : « Moyenne ou médiane : quel centre pour quelle question ? »
- Huit situations de gestion, deux catégories. Total → moyenne ; individu typique ou moitié → médiane.

#### A2-05 · `B2-02-A2-05-CORRECTION` — 1 min · v2 `sort-review` · séance

- Titre public : « Correction : moyenne ou médiane ? »

#### A2-06 · `B2-02-A2-06-JALON-2` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : où en êtes-vous ? »

### 3.4 Acte 3 — Mesurer l’écart (31 min)

#### A3-01 · `B2-02-A3-01-VOTE-SEGMENTS` — 8 min · `fp-vote` · séance

- Titre public : « Vote : même moyenne, même clientèle ? »
- Clubs 40, 42, 44, 45, 46, 48, 50 et chantiers 15, 20, 30, 45, 60, 70, 75 (moyenne et médiane 45) ;
  fournisseurs A (10, 50, 50, 50, 90) et B (10, 20, 50, 80, 90), même étendue, B plus dispersée.

#### A3-02 · `B2-02-A3-02-DISPERSION` — 4 min · `fp-worked` · séance

- Titre public : « Mesurer l’écart des deux segments »
- Étendues 10 et 60 ; quartiles 42/48 et 20/70 ; EIQ 6 et 50 ; variances 10 et 500 ; écarts-types
  3,16 et 22,36.

#### A3-02 · `B2-02-A3-02-CORRECTION` — 2 min · `fp-worked` (piloté) · séance

- Titre public : « Correction : mesurer l’écart des deux segments »

#### A3-03 · `B2-02-A3-03-DEUX-ECARTS-TYPES` — 2 min · v2 `comparison` · séance

- Titre public : « Deux fonctions d’écart-type : laquelle choisir ? »

#### A3-04 · `B2-02-A3-04-ATELIER-2` — 6 min · `questionnaire` · séance

- Titre public : « Atelier 2 — L’écart des délais »
- `b2-02-a3-eiq` : 21 (Q1 31, Q3 52) ; pièges 128 étendue, 19,5 tableur, 43 médiane.
- `b2-02-a3-ecart-type-cinq` : 30, 40, 50, 60, 70 → 14,14 ; pièges 15,81 et 200.
- `b2-02-a3-variance` : 686,49 est en jours².

#### A3-04 · `B2-02-A3-04-CORRECTION-1` — 1 min · v2 `answer-review` · séance

- Titre public : « Correction de l’atelier 2 : questions 1 à 3 »

#### A3-04 · `B2-02-A3-04-ATELIER-2-SUITE` — 6 min · `questionnaire` · séance

- Titre public : « Atelier 2 — L’écart des délais (suite) »
- `b2-02-a3-fonction` : ECARTYPEP. `b2-02-a3-ecart-type-echantillon` : 15,81 ; pièges 14,14 et 250.

#### A3-04 · `B2-02-A3-04-CORRECTION-2` — 1 min · v2 `answer-review` · séance

- Titre public : « Correction de l’atelier 2 : questions 4 et 5 »

#### A3-05 · `B2-02-A3-05-JALON-3` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 3 : où en êtes-vous ? »

### 3.5 Acte 4 — Outiller et représenter (33 min)

#### A4-01 · `B2-02-A4-01-GALTON` — 2 min · v2 `image-left` · catalogue

- Titre public : « De Galton à Tukey : résumer par des rangs »
- Média M2 (§ 8.2).

#### A4-02 · `B2-02-A4-02-FEUILLE-DELAIS` — 15 min · `fp-sheet` · séance

- Titre public : « Tâche de tableur — Résumer les vingt délais »
- Colonnes A (facture) et B (délai), lignes 2 à 21 ; indicateurs en E2 à E10 : NB 20 ; MOYENNE
  47,75 ; MEDIANE 43 ; QUARTILE 33,25 et 52,75 ; écart 19,5 ; étendue 128 ; ECARTYPEP 26,200906 ;
  contrôle `SI(ARRONDI(E2*E3-SOMME(…);6)=0;1;0)` = 1. Seuil de réussite 0,8.

#### A4-03 · `B2-02-A4-03-BOITE-DELAIS` — 2 min · v2 `boxplot` · séance

- Titre public : « La boîte à moustaches des vingt délais »
- Deux boîtes : 18 / 31 / 43 / 52 / 146 (moyenne 47,75) et sans F105 18 / 31 / 42 / 52 / 75
  (moyenne 42,58). Renvoi A4-02.

#### A4-04 · `B2-02-A4-04-BDF` — 2 min · v2 `boxplot` · séance

- Titre public : « Délais fournisseurs des entreprises françaises, 2023 et 2024 »
- Moustaches aux 10e et 90e centiles, données § 4.4.

#### A4-05 · `B2-02-A4-05-ATELIER-3` — 7 min · `questionnaire` · séance

- Titre public : « Atelier 3 — Lire une boîte à moustaches »
- `b2-02-a4-part-boite` : environ la moitié. `b2-02-a4-eiq-2024` : 33,3 (pièges 70,5 et 18,8).
  `b2-02-a4-asymetrie` : plus étalés, pour un même quart.

#### A4-05 · `B2-02-A4-05-CORRECTION` — 1 min · v2 `answer-review` · séance

- Titre public : « Correction de l’atelier 3 : lire une boîte »

#### A4-06 · `B2-02-A4-06-LECTURE` — 3 min · v2 `reflection` · séance

- Titre public : « La phrase de lecture pour la banque »

#### A4-07 · `B2-02-A4-07-JALON-4` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 4 : où en êtes-vous ? »

### 3.6 Acte 5 — Regrouper et choisir (47 min)

#### A5-01 · `B2-02-A5-01-HISTOGRAMME` — 2 min · v2 `chart` · séance

- Titre public : « Les salaires du secteur privé, regroupés en classes »
- Neuf tranches de 500 € (§ 4.3), deux tranches ouvertes.

#### A5-02 · `B2-02-A5-02-CLASSES` — 4 min · `fp-worked` · séance

- Titre public : « Calculer avec des classes »
- Classe modale 1 500–2 000 € ; classe médiane 2 000–2 500 € ; interpolation ≈ 2 222 € (Insee
  publie 2 190 €) ; pas de moyenne exacte avec des classes ouvertes ; densité 1 029 ÷ 10 = 102,9.

#### A5-02 · `B2-02-A5-02-CORRECTION` — 2 min · `fp-worked` (piloté) · séance

- Titre public : « Correction : calculer avec des classes »

#### A5-03 · `B2-02-A5-03-EFFECTIFS-CUMULES` — 8 min · `fp-table-build` · séance

- Titre public : « Tableau des effectifs cumulés des vingt délais »
- Classes [0 ; 30[, [30 ; 45[, [45 ; 60[, [60 ; 90[, [90 ; 150[ d’effectifs 3, 8, 6, 2, 1 ; cumuls 3,
  11, 17, 19, 20 ; fréquences cumulées 15, 55, 85, 95, 100 %. Seuil 0,75.

#### A5-03 · `B2-02-A5-03-CORRECTION` — 1 min · v2 `answer-review` · séance

- Titre public : « Correction : les effectifs cumulés »

#### A5-04 · `B2-02-A5-04-ATELIER-4` — 6 min · `questionnaire` · séance

- Titre public : « Atelier 4 — Calculer avec des classes »
- `b2-02-a5-moyenne-classes` : 46,5 (pièges 36 et 57, bornes). `b2-02-a5-densite` : 239,4 (pièges
  2 394 et 478,8). `b2-02-a5-classes-ouvertes` : non.

#### A5-04 · `B2-02-A5-04-CORRECTION-1` — 1 min · v2 `answer-review` · séance

- Titre public : « Correction de l’atelier 4 : questions 1 à 3 »

#### A5-04 · `B2-02-A5-04-ATELIER-4-SUITE` — 6 min · `questionnaire` · séance

- Titre public : « Atelier 4 — Calculer avec des classes (suite) »
- `b2-02-a5-locaux` : le prix médian (DVF). `b2-02-a5-patrimoine` : la moitié possède moins de
  205 100 €.

#### A5-04 · `B2-02-A5-04-CORRECTION-2` — 1 min · v2 `answer-review` · séance

- Titre public : « Correction de l’atelier 4 : questions 4 et 5 »

#### A5-05 · `B2-02-A5-05-QUEL-GRAPHIQUE` — 8 min · `fp-cardsort` · séance

- Titre public : « Quel graphique pour quelle série ? »
- Quatre catégories (barres, histogramme, boîtes, courbe), sept séries.

#### A5-05 · `B2-02-A5-05-CORRECTION` — 1 min · v2 `sort-review` · séance

- Titre public : « Correction : quel graphique pour quelle série ? »

#### A5-06 · `B2-02-A5-06-DOSSIER-BANQUE` — 2 min · v2 `table` · séance

- Titre public : « Le dossier pour la banque en une page »

#### A5-07 · `B2-02-A5-07-NOTE-BANQUE` — 4 min · `fp-challenge` · séance

- Titre public : « Votre note à la banque »
- Stratégies : centre, écart, plafond, suivi, moyenne signalée ; piste fausse : retirer F105.

#### A5-08 · `B2-02-A5-08-JALON-5` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 5 : où en êtes-vous ? »

### 3.7 Acte 6 — Transférer (26 min)

#### A6-01 · `B2-02-A6-01-COFFRE` — 10 min · `fp-escape` · séance

- Titre public : « Le coffre de la banque »
- Douze délais fournisseurs 30, 45, 28, 60, 35, 38, 58, 32, 46, 36, 56, 62. E1 médiane 41,5
  (pièges 48 sans tri, 43,833333 moyenne) ; E2 EIQ 24 (Q1 32, Q3 56 ; pièges 22,25 tableur, 34
  étendue) ; E3 écart-type de 25, 35, 45, 55, 65, 75 : 17,08 (pièges 18,71 et 291,67) ; E4 (28 × 30 +
  12 × 75) ÷ 40 = 43,5 (piège 52,5). Fragments R4, T8, N3, W6.

#### A6-01 · `B2-02-A6-01-CORRECTION` — 1 min · v2 `answer-review` · séance

- Titre public : « Correction du coffre : les quatre calculs »

#### A6-02 · `B2-02-A6-02-IA-ERREUR` — 4 min · `fp-challenge` · séance

- Titre public : « Corriger une réponse d’IA »
- Deux erreurs : « la moitié paie en plus de la moyenne » ; ECARTYPE au lieu de ECARTYPEP.

#### A6-03 · `B2-02-A6-03-RAPPEL` — 4 min · `fp-spaced` · séance

- Titre public : « Rappel : de mémoire, sans vos notes »
- Treize rappels, deux obligatoires (`b2-02-r-extreme`, `b2-02-r-variance`). Les bonnes réponses
  numériques sont rédigées en phrase : un nombre seul fuirait par les références de cellules ou
  les rangs cités plus haut.

#### A6-04 · `B2-02-A6-04-FICHE-MEMO` — 2 min · v2 `grid` · séance

- Titre public : « Fiche mémo : quel indicateur pour quelle question ? »

#### A6-05 · `B2-02-A6-05-BOITE-A-OUTILS` — 2 min · v2 `grid` · catalogue

- Titre public : « Pour aller plus loin : outils et sources »

#### A6-06 · `B2-02-A6-06-BILLET-DE-SORTIE` — 3 min · `fp-exit` · séance

- Titre public : « Billet de sortie : la phrase pour la banque »
- Bonne réponse : médiane 43 jours, moitié centrale 31–52, 3 sur 20 au-delà de 60 jours. Pièges :
  la phrase de Samir, la moyenne sans F105, « la moitié en moins de 47,75 jours ».

## 4. Données vérifiées

Chaque nombre de ce paragraphe est recalculé par `b2-02.cours.spec.ts` depuis les données brutes.

### 4.1 Les vingt délais (jours)

Ordre F101 → F120 : 42, 25, 58, 31, 146, 38, 47, 18, 62, 44, 35, 52, 28, 75, 40, 30, 55, 34, 50, 45.
Somme 955, moyenne 47,75, médiane 43 (10e et 11e valeurs triées 42 et 44), milieu non trié 39,5.
Convention du cours : Q1 = 31 (5e), Q3 = 52 (15e), EIQ 21. Tableur : 33,25 et 52,75, écart 19,5.
Étendue 128. Écart-type population 26,200906, échantillon 26,881563, variance 686,4875. Sans F105 :
moyenne 42,578947, médiane 42, maximum 75. Au-delà de 60 jours : 3 ; au-dessus de la moyenne : 7.

### 4.2 Séries d’exemple

Septembre : 28, 41, 35, 90, 33, 39, 44, 30 (moyenne 42,5, médiane 37). Clubs et chantiers : § 3.4.
Cinq clients 30 à 70 : σ 14,142136, σ(n − 1) 15,811388. Relances : 0 (9), 1 (6), 2 (3), 3 (1), 4 (1).
Coffre : § 3.7.

### 4.3 Salaires du secteur privé 2024 (Insee Première n° 2079, milliers d’EQTP)

Tranches de 100 € regroupées par 500 € : < 1 500 : 1 928 ; 1 500–2 000 : 5 563 ; 2 000–2 500 :
3 979 ; 2 500–3 000 : 2 365 ; 3 000–3 500 : 1 464 ; 3 500–4 000 : 930 ; 4 000–4 500 : 613 ;
4 500–5 000 : 416 ; ≥ 5 000 : 1 261 ; total 18 519. Moyennes par catégorie : cadres 4 629 € (23,0 %),
professions intermédiaires 2 633 € (20,6 %), employés 1 941 € (27,9 %), ouvriers 2 051 € (28,6 %).

### 4.4 Délais fournisseurs (Banque de France, Bulletin n° 260/5, encadré 2)

2023 : p10 31,0 ; Q1 42,8 ; médiane 57,3 ; Q3 75,6 ; p90 99,8. 2024 : 29,9 ; 41,7 ; 56,2 ; 75,0 ;
100,4. EIQ 2024 : 33,3. Demi-boîtes 2024 : 14,5 sous la médiane, 18,8 au-dessus.

### 4.5 Autres sources

DVF 2021-2025, locaux commerciaux : moyenne 3 398 €/m², médiane 1 473 €/m². Insee Focus n° 371,
patrimoine brut début 2024 : moyenne 374 900 €, médiane 205 100 €.

## 5. Concepts, confusions et remédiations

### 5.9 Concepts, confusions et remédiations

**Concepts** : `serie-statistique`, `moyenne`, `mediane`, `quartiles`, `dispersion`, `ecart-type`,
`boite-a-moustaches`, `histogramme`, `choix-du-resume`. **Confusions** : les dix-sept du B2-02 et
`forme-inadaptee`, reprise du B2-01 pour le tri des graphiques.

| Identifiant                          | Concept            | Libellé                                                                           | Remédiation                   |
| ------------------------------------ | ------------------ | --------------------------------------------------------------------------------- | ----------------------------- |
| `role-statistique-confondu`          | serie-statistique  | Confondre la population étudiée, le caractère observé et l’effectif d’une série.  | B2-02-A1-07-FICHE-SERIE       |
| `effectif-cumule-confondu`           | serie-statistique  | Confondre l’effectif d’une classe et l’effectif cumulé jusqu’à cette classe.      | B2-02-A5-03-EFFECTIFS-CUMULES |
| `moyenne-lue-comme-mediane`          | mediane            | Croire que la moyenne partage la série en deux moitiés d’effectifs égaux.         | B2-02-A2-02-DEUX-CENTRES      |
| `mediane-sans-tri`                   | mediane            | Prendre la valeur du milieu de la liste sans avoir trié les valeurs.              | B2-02-A2-02-DEUX-CENTRES      |
| `mediane-rang-pair`                  | mediane            | Pour un effectif pair, retenir une seule des deux valeurs centrales.              | B2-02-A2-02-DEUX-CENTRES      |
| `valeur-extreme-ignoree`             | choix-du-resume    | Résumer par la moyenne une série tirée par une valeur extrême, sans le signaler.  | B2-02-A2-04-FACTURE-LITIGE    |
| `valeur-extreme-supprimee`           | choix-du-resume    | Retirer une valeur extrême gênante sans pièce qui prouve qu’elle est une erreur.  | B2-02-A2-04-FACTURE-LITIGE    |
| `moyenne-des-moyennes`               | moyenne            | Faire la moyenne simple de moyennes de groupes d’effectifs différents.            | B2-02-A2-02-DEUX-CENTRES      |
| `quartile-moitie-de-mediane`         | quartiles          | Calculer un quartile à partir de la médiane au lieu de chercher le rang du quart. | B2-02-A3-02-DISPERSION        |
| `convention-de-quartile-ignoree`     | quartiles          | Comparer des quartiles de deux conventions (programme, tableur) sans le signaler. | B2-02-A4-02-FEUILLE-DELAIS    |
| `etendue-prise-pour-dispersion`      | dispersion         | Juger la dispersion sur la seule étendue.                                         | B2-02-A3-02-DISPERSION        |
| `meme-moyenne-meme-serie`            | dispersion         | Conclure que deux séries de même moyenne se ressemblent.                          | B2-02-A3-01-VOTE-SEGMENTS     |
| `variance-confondue-avec-ecart-type` | ecart-type         | Donner la variance, en unité au carré, comme écart-type.                          | B2-02-A3-02-DISPERSION        |
| `ecart-type-population-echantillon`  | ecart-type         | Confondre la division par n et la division par n − 1.                             | B2-02-A3-03-DEUX-ECARTS-TYPES |
| `boite-lue-comme-effectif`           | boite-a-moustaches | Croire qu’une partie plus longue de la boîte contient davantage de valeurs.       | B2-02-A4-03-BOITE-DELAIS      |
| `centre-de-classe-oublie`            | moyenne            | Calculer la moyenne de données groupées avec une borne au lieu du centre.         | B2-02-A5-02-CLASSES           |
| `histogramme-classes-inegales`       | histogramme        | Lire la hauteur d’un histogramme à classes inégales comme un effectif.            | B2-02-A5-02-CLASSES           |
| `forme-inadaptee`                    | lecture-graphique  | Choisir une forme de graphique qui ne montre pas la relation demandée.            | B2-02-A5-05-QUEL-GRAPHIQUE    |

### 5.10 Barème

Le barème v2 suit le B2-01 : votes et classements corrigés serveur ; numériques à tolérance absolue
(0,05 pour les entiers et dixièmes, `DEUX_DECIMALES` pour les centièmes, 2 € pour le salaire moyen) ;
feuille à 0,8 ; tableau à 0,75 ; énigmes à tolérance absolue. 61 tirages sans ambiguïté, barème de
moins de 400 Ko (contrat commun).

## 6. Confidentialité

La garde `GardeConfidentialite` s’applique sans dérogation. Trois décisions en découlent :

1. **Rappels rédigés** : une réponse « 5 » ou « 16 » fuirait par une référence de cellule (A5, A16)
   ou un rang cité plus haut ; chaque bonne réponse de la banque de rappel est une phrase.
2. **Coffre** : l’écart interquartile des fournisseurs vaut 24, hors des références A1 à A21 de la
   feuille A4-02 ; un écart de 16 ou 17 aurait fui.
3. **Segments** : aucun segment générique (« population », « ouvertes », « médian ») ; les votes
   dont la bonne réponse ne tient que par un mot courant n’ont pas de segments.

La moyenne exacte (47,75) n’apparaît dans aucun texte public avant l’atelier 1 ; la diapositive de
Samir n’affiche que l’arrondi 48.

## 7. Scénario de séance et QA

- **Instantané** : `test/fixtures/formations/b2-02.instantane.json`, graine 0, régénéré par
  `ECRIRE_INSTANTANE=1` ; copié côté front pour les tests de rendu.
- **Scénario de séance en base** : le parcours complet du B2-01 est rejoué sur le B2-02 (ouverture,
  jonction, réponses justes et pièges, révélations, clôture, synthèse).
- **Banc** : le parcours acte par acte et le volume à trente postes couvrent le B2-02 comme le B2-01.
- **QA des trois rendus** : projection, pupitre et poste étudiant, sur les mêmes composants.

## 8. Médias

### 8.2 Catalogue des médias

Images converties en WebP et servies depuis `/assets/cours/b2-02/v1/`.

| Id  | Écran | Fichier source (page)                                                                       | Original          | Auteur, date                                                            | Licence        | Dérivé servi         | Attribution affichée                                                             |
| --- | ----- | ------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------- | -------------- | -------------------- | -------------------------------------------------------------------------------- |
| M1  | A2-01 | https://commons.wikimedia.org/wiki/File:Adolphe_Qu%C3%A9telet_by_Joseph-Arnold_Demannez.jpg | gravure sur acier | Joseph-Arnold Demannez, Annuaire de l’Académie royale de Belgique, 1875 | domaine public | `quetelet-1875.webp` | « Gravure de Joseph-Arnold Demannez, 1875 · Wikimedia Commons (domaine public) » |
| M2  | A4-01 | https://commons.wikimedia.org/wiki/File:Sir_Francis_Galton,_circa_1890.jpg                  | photographie      | Graham’s Art Studios, vers 1890                                         | domaine public | `galton-1890.webp`   | « Graham’s Art Studios, vers 1890 · Wikimedia Commons (domaine public) »         |

### 8.3 Sources des données

Voir `docs/donnees-b2-02-sources.md` à la racine de l’espace de travail : pages, dates de parution,
licences et extraits utilisés.
