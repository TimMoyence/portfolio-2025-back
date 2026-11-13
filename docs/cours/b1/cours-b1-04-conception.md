# B1-04 · Séries à deux variables : ajuster et prévoir — conception de référence (gabarit v3)

> Cahier des charges du cours B1-04 au gabarit v3 (`docs/cours/cours-gabarit-v3.md`) : quatrième cours de
> mathématiques des BTS CG 1re année. Le B1-03 fait foi pour la forme : 4 actes, un diagnostic, trois
> notions traitées chacune par un cycle réfléchir → comprendre → s'exercer, six écrans « pour
> comprendre » suivis chacun de sa page de cours, puis un rappel et la fiche mémo. Ce document ne
> contient aucun code exécutable ; toute divergence d'implémentation est un défaut de
> l'implémentation. Les tests `b1-04.cours.spec.ts` relisent ce document : § 3.1, titres publics du
> § 3, § 5.9, § 8.2.

| Rubrique    | Valeur                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Date        | 13 novembre 2026                                                                                        |
| Statut      | **Conception validée le 13 novembre 2026** : quatrième cours du plan BTS CG 1 (B1-01 → B1-12)           |
| Cours       | `b1-04-series-deux-variables`                                                                           |
| Gabarit     | `v3`, déclaré par le contenu et contrôlé par les quatre règles `gabarit-*` de `verifierStructure`       |
| Niveau      | `B1` (`moteur.coursB1`)                                                                                 |
| Titre servi | « Séries à deux variables : ajuster et prévoir »                                                        |
| Durée       | **121 minutes exactes** (somme des écrans), 4 actes de 45, 36, 32 et 8 minutes, plus 2 pauses de 15 min |
| Écrans      | **33**, dont 15 écrans catalogue (6 écrans « pour comprendre »)                                         |
| Sources     | Programme officiel du BTS CG ; annale BTS CG Polynésie 2018 (données Insee) ; données fictives          |

---

## 0. Synthèse des décisions

Décisions de Tim du 13 novembre 2026, sur le cadrage :

- **Les graphes de données sont dessinés par le code**, pas par une image : le nuage du site web
  (A1-09) et celui de l'annale avec sa droite D (A3-05) sont des rendus v2 `scatter`, lisibles sur
  mobile. Les écrans « pour comprendre » restent des images dessinées, générées par Tim depuis
  `illustrations-b1-04/prompts.md`. Aucune évolution du front.
- **La forme du B1-03 : 121 minutes, actes de 45, 36, 32 et 8 minutes**, 33 écrans : l'acte 1 porte
  deux écrans de plus que les autres, le nuage codé et l'exercice au tableur.
- **L'annale Polynésie 2018, exercice 1, partie A**, devient l'exercice 4. Son énoncé renvoie au
  nuage A3-05 au lieu de recopier les valeurs.
- **Dérogation écrite** : le nuage de l'annale sert la valeur observée 85,4 (2014 et 2016), égale par
  hasard à la prévision 2018 par D. La règle `confidentialite` est levée pour ce seul écran
  (`DEROGATIONS_DES_COURS`, `StructureCours.ts`), comme au B2-04.
- **Le fil rouge continue : Partie Libre.** Inès Marchal veut prévoir le chiffre d'affaires du site
  web d'après son budget de publicité, puis celui de la boutique de Nantes. Théo choisit le
  coefficient de corrélation positif. Toutes ces données sont fictives et signalées à l'écran.
- **Le tableur** : `PENTE`, `ORDONNEE.ORIGINE`, `COEFFICIENT.CORRELATION`, déjà dans le moteur de
  formules, avec `MOYENNE` et `ARRONDI` ; la recopie vers la droite du B1-02 resservit, plage des y
  figée par `$`.
- **L'accroche** : le diagramme de corrélation de Francis Galton (1875), déjà servi au B2-02.

## 1. Objectifs d'apprentissage et public

### 1.1 Rattachement au programme officiel

Module « Statistique descriptive » du BTS CG, unité U3 – Mathématiques appliquées : série
statistique à deux variables, nuage de points, point moyen, ajustement affine par la méthode des
moindres carrés, coefficient de corrélation linéaire, interpolation et extrapolation ; usage
raisonné du tableur et de la calculatrice. La distinction entre corrélation et causalité est exigée
par le programme.

### 1.2 Objectifs du cours

À la fin de la séance, l'étudiant sait :

1. tracer un nuage de points et placer le point moyen G(x̄ ; ȳ) ;
2. obtenir la droite des moindres carrés à la calculatrice et au tableur, plage des y d'abord ;
3. comparer deux ajustements par la valeur absolue du coefficient de corrélation ;
4. distinguer une liaison d'une causalité et nommer un facteur caché ;
5. prévoir par la droite au bon rang, interpoler ou extrapoler avec réserve ;
6. trouver le premier rang où la droite dépasse un seuil.

### 1.3 Acquis des B1-01 à B1-03

| Acquis                               | Diagnostic | Réemploi dans le B1-04   |
| ------------------------------------ | ---------- | ------------------------ |
| Fonction affine y = ax + b (collège) | A1-01      | Droite d'ajustement (N1) |
| Moyenne d'une série (B1-03)          | A1-03      | Point moyen (N1)         |
| `ARRONDI`, recopie vers la droite    | exercices  | Exercices 1 et 2         |

### 1.4 Public et conditions

BTS CG 1re année, 25 étudiants au plus, bacs STMG en majorité. Calculatrice autorisée sauf au
diagnostic et à la mission. Un poste par étudiant pour les exercices 1 et 2. Séance de 3 h 30 :
pause de 15 minutes après l'acte 1 et après l'acte 3.

## 2. Architecture

### 2.1 Les quatre actes

| Acte | Rôle                                                 | Notion | Minutes |
| ---- | ---------------------------------------------------- | ------ | ------: |
| 1    | Diagnostic, puis nuage, point moyen et droite        | N1     |      45 |
| 2    | Comparer deux ajustements ; liaison et causalité     | N2     |      36 |
| 3    | Prévoir : interpoler, extrapoler, atteindre un seuil | N3     |      32 |
| 4    | Rappel et fiche mémo                                 | —      |       8 |

Pause 1 après le jalon A1-11 ; pause 2 après le jalon A3-07. Les pauses ne sont pas des écrans.

### 2.2 Le cycle d'une notion

Chaque notion suit : **Réfléchir** (mission, réflexion ou vote) → **Comprendre** (deux écrans « pour
comprendre » d'1 minute, chacun suivi de sa page `lesson` de 2 minutes ; un exemple guidé
`fp-worked` corrigé étape par étape) → **S'exercer** (exercices notés, corrigés sur place).

### 2.3 L'écran « pour comprendre »

Brique commune `moteur.pourComprendreDans(dossier)`, rendu v2 `image-left`, 1 minute, diffusion
catalogue, placé juste avant sa page et numéroté comme elle (`B1-04-A{acte}-{rang}-ENFANT-{SUJET}`).
À côté de l'image : un titre sans le nom de la notion, une phrase qui décrit l'image sans mot du
cours, la règle « En maths, on écrit : … » qui nomme la notion de la page suivante (nuage de points
et point moyen, moindres carrés, coefficient de corrélation, cause, interpoler et extrapoler, seuil),
puis trois ou quatre correspondances.

### 2.4 Diffusion

Catalogue : l'accroche, le dossier, les six écrans « pour comprendre », les six pages de cours et la
fiche mémo. Tout le reste est servi en séance, nuages compris. Aucun écran catalogue ne porte une
réponse d'exercice.

### 2.5 Notation et écriture

Point moyen G(x̄ ; ȳ). Droite y = ax + b ; a et b arrondis au centième, r au millième. Rang x de
l'année : année − année du rang 0.

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B1-04-A{acte}-{rang}-{SLUG}`. Un écran « pour comprendre » porte le rang de la page
qu'il précède. « I » = interactif. « Q » = questions fermées notées portées par l'écran.

| Rang | Identifiant                     | Min | Brique · rendu               |  I  |   Q | Diffusion |
| ---: | ------------------------------- | --: | ---------------------------- | :-: | --: | --------- |
|    1 | B1-04-A1-01-DIAGNOSTIC-DROITE   |   4 | `fp-recall`                  |  I  |   1 | seance    |
|    2 | B1-04-A1-02-ACCROCHE            |   1 | `fp-story` · v2 `hero`       |     |   0 | catalogue |
|    3 | B1-04-A1-03-VOTE-DIAGNOSTIC     |   4 | `fp-vote`                    |  I  |   0 | seance    |
|    4 | B1-04-A1-04-DOSSIER             |   2 | `fp-story` · v2 `table`      |     |   0 | catalogue |
|    5 | B1-04-A1-05-MISSION             |   6 | `fp-pro`                     |  I  |   0 | seance    |
|    6 | B1-04-A1-06-ENFANT-PLATEAU      |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    7 | B1-04-A1-06-COURS-NUAGE         |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|    8 | B1-04-A1-07-ENFANT-BATON        |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    9 | B1-04-A1-07-COURS-DROITE        |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   10 | B1-04-A1-08-EXEMPLE-ANGERS      |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   11 | B1-04-A1-09-NUAGE-SITE          |   1 | `fp-story` · v2 `scatter`    |     |   0 | seance    |
|   12 | B1-04-A1-10-TABLEUR-AJUSTEMENT  |  14 | `fp-sheet`                   |  I  |   0 | seance    |
|   13 | B1-04-A1-11-JALON               |   1 | `fp-pulse`                   |     |   0 | seance    |
|   14 | B1-04-A2-01-REFLEXION-PREVOIR   |   5 | `fp-story` · v2 `reflection` |  I  |   0 | seance    |
|   15 | B1-04-A2-02-ENFANT-OISEAUX      |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   16 | B1-04-A2-02-COURS-CORRELATION   |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   17 | B1-04-A2-03-ENFANT-PLUIE        |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   18 | B1-04-A2-03-COURS-CAUSALITE     |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   19 | B1-04-A2-04-EXEMPLE-TOURS       |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   20 | B1-04-A2-05-TABLEUR-CORRELATION |  10 | `fp-sheet`                   |  I  |   0 | seance    |
|   21 | B1-04-A2-06-ATELIER-CAUSALITE   |   8 | `questionnaire`              |  I  |   4 | seance    |
|   22 | B1-04-A2-07-JALON               |   1 | `fp-pulse`                   |     |   0 | seance    |
|   23 | B1-04-A3-01-VOTE-PREVOIR        |   5 | `fp-vote`                    |  I  |   0 | seance    |
|   24 | B1-04-A3-02-ENFANT-PIERRES      |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   25 | B1-04-A3-02-COURS-PREVOIR       |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   26 | B1-04-A3-03-ENFANT-CHAMBRANLE   |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   27 | B1-04-A3-03-COURS-SEUIL         |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   28 | B1-04-A3-04-EXEMPLE-SOIREES     |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   29 | B1-04-A3-05-NUAGE-ANNALE        |   1 | `fp-story` · v2 `scatter`    |     |   0 | seance    |
|   30 | B1-04-A3-06-ATELIER-ANNALE      |  13 | `questionnaire`              |  I  |   5 | seance    |
|   31 | B1-04-A3-07-JALON               |   1 | `fp-pulse`                   |     |   0 | seance    |
|   32 | B1-04-A4-01-RAPPEL              |   6 | `fp-spaced`                  |  I  |   0 | seance    |
|   33 | B1-04-A4-02-FICHE-MEMO          |   2 | `fp-story` · v2 `grid`       |     |   0 | catalogue |

Rythme : 93 minutes interactives, 28 d'exposition (jalons compris), exposition continue de 6 minutes
au plus. Somme : 45 + 36 + 32 + 8 = 121.

### 3.2 Acte 1 — Diagnostic, puis nuage, point moyen et droite (45 min)

#### A1-01 · `B1-04-A1-01-DIAGNOSTIC-DROITE` — 4 min · `fp-recall` · séance

- Titre public : « Diagnostic : une droite, sans calculatrice »
- `b1-04-a1-diagnostic-droite` : « Sur la droite y = 2x + 3, que vaut y pour x = 4 ? » Bonne :
  2 × 4 + 3 = 11 ; piège 3 × 4 + 2 = 14 (`pente-ordonnee-inversees`).

#### A1-02 · `B1-04-A1-02-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Séries à deux variables : ajuster et prévoir »
- Fond : le diagramme de corrélation de Francis Galton, 1875.

#### A1-03 · `B1-04-A1-03-VOTE-DIAGNOSTIC` — 4 min · `fp-vote` · séance

- Titre public : « Vote : un point au centre, une droite qui monte »
- `b1-04-a1-vote-point-moyen` : budgets 100, 200, 300 € et CA 5, 9, 10 k€ ; bonne (200 ; 8) ; piège
  (600 ; 24), les sommes (`point-moyen-confondu`).
- `b1-04-a1-vote-pente` : y = 30x + 500 ; bonne « 30 € » ; piège « 500 € »
  (`pente-ordonnee-inversees`).

#### A1-04 · `B1-04-A1-04-DOSSIER` — 2 min · v2 `table` · catalogue

- Titre public : « La publicité et les ventes du site web »
- Lignes : l'entreprise ; les deux séries (budget de publicité x, CA y, janvier à octobre 2026) ; le
  premier mois ; la question d'Inès (1 500 € de publicité en décembre). Note : données fictives.

#### A1-05 · `B1-04-A1-05-MISSION` — 6 min · `fp-pro` · séance

- Titre public : « Votre mission : que rapporte la publicité ? »
- Situation : Inès prépare le budget de décembre ; Théo propose le CA moyen par euro de publicité.
- Questions libres : `:nuage`, `:droite`, `:prudence` (aucun mois n'a reçu 1 500 €).

#### A1-06 · `B1-04-A1-06-ENFANT-PLATEAU` — 1 min · v2 `image-left` · catalogue

- Titre public : « Tenir en équilibre sur un doigt »
- Correspondances : le plateau → le repère ; un biscuit → un point, un mois ; le doigt → le point
  moyen G. Image `plateau-equilibre.webp`.

#### A1-06 · `B1-04-A1-06-COURS-NUAGE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : nuage de points et point moyen »
- Page 1 sur 2. Série à deux variables, G(x̄ ; ȳ) ; exemple pour débuter : trois semaines de Léa,
  G(4 ; 12) ; méthode « Un mois, un point ».

#### A1-07 · `B1-04-A1-07-ENFANT-BATON` — 1 min · v2 `image-left` · catalogue

- Titre public : « Le bâton au plus près des cailloux »
- Correspondances : les cailloux → les points ; le bâton → la droite ; une ficelle → un écart
  vertical ; le bâton le plus près de tous → la droite des moindres carrés. Image
  `baton-ficelles.webp`.

#### A1-07 · `B1-04-A1-07-COURS-DROITE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : la droite des moindres carrés »
- Page 2 sur 2. `PENTE` et `ORDONNEE.ORIGINE`, la droite passe par G ; exemple pour débuter : Léa,
  y = 1,75x + 5 ; méthode « Les y d'abord ».

#### A1-08 · `B1-04-A1-08-EXEMPLE-ANGERS` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : les soirées jeux d’Angers »
- Soirées 2, 4, 6, 8, 10 ; CA 5, 9, 10, 14, 17 k€. Étapes `nuage`, `point-moyen` (G(6 ; 11)),
  `droite` (y = 1,45x + 2,3), `controle` (1,45 × 6 + 2,3 = 11), `lire`.

#### A1-09 · `B1-04-A1-09-NUAGE-SITE` — 1 min · v2 `scatter` · séance

- Titre public : « Le nuage du site web »
- Les dix points (budget ; CA), sans point moyen ni droite : l'exercice 1 les calcule.

#### A1-10 · `B1-04-A1-10-TABLEUR-AJUSTEMENT` — 14 min · `fp-sheet` · séance

- Titre public : « Exercice 1 — L’ajustement du site web au tableur »
- Temps : réflexion 2 min · travail 9 min · correction 3 min.
- Feuille de 11 lignes sur 5 colonnes (§ 5.1). E2 `=MOYENNE(B2:B11)`, E3 `=MOYENNE(C2:C11)`,
  E4 `=ARRONDI(PENTE(C2:C11;B2:B11);2)`, E5 `=ARRONDI(ORDONNEE.ORIGINE(C2:C11;B2:B11);2)`.

#### A1-11 · `B1-04-A1-11-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 1 : un nuage, un point moyen, une droite »
- Puis pause de 15 minutes.

### 3.3 Acte 2 — Comparer deux ajustements ; liaison et causalité (36 min)

#### A2-01 · `B1-04-A2-01-REFLEXION-PREVOIR` — 5 min · v2 `reflection` · séance

- Titre public : « Réfléchir : la température ou les soirées ? »
- Théo choisit les soirées, au r positif. Attendu : retenir le nuage le mieux aligné, qu'il monte ou
  descende ; une liaison ne prouve pas une cause.

#### A2-02 · `B1-04-A2-02-ENFANT-OISEAUX` — 1 min · v2 `image-left` · catalogue

- Titre public : « En file ou en désordre »
- Correspondances : la file qui monte → r proche de 1 ; la file qui descend → r proche de −1 ; la
  volée éparpillée → r proche de 0. Image `oiseaux-vols.webp`.

#### A2-02 · `B1-04-A2-02-COURS-CORRELATION` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : le coefficient de corrélation »
- Page 1 sur 2. r entre −1 et 1, `COEFFICIENT.CORRELATION` ; exemple pour débuter : deux nuages de
  Léa, 0,93 et −0,96 ; méthode « La distance à 1, pas le signe ».

#### A2-03 · `B1-04-A2-03-ENFANT-PLUIE` — 1 min · v2 `image-left` · catalogue

- Titre public : « Ce n’est pas le parapluie »
- Correspondances : les parapluies → une série ; les bottes → une seconde série ; la pluie → le
  facteur caché. Image `pluie-parapluies.webp`.

#### A2-03 · `B1-04-A2-03-COURS-CAUSALITE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : liaison n’est pas causalité »
- Page 2 sur 2. Exemple pour débuter : glaces et coups de soleil ; méthode « Chercher le
  troisième ».

#### A2-04 · `B1-04-A2-04-EXEMPLE-TOURS` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : les cafés du bar de Tours »
- Cafés 210, 190, 175, 150, 140, 115 ; température 4 à 24 °C ; matchs 3, 1, 2, 4, 2, 3. Étapes
  `temperature` (r ≈ −0,996), `matchs` (r ≈ −0,301), `comparer`, `pente` (−4,64), `cause`.

#### A2-05 · `B1-04-A2-05-TABLEUR-CORRELATION` — 10 min · `fp-sheet` · séance

- Titre public : « Exercice 2 — Deux ajustements pour Nantes »
- Temps : réflexion 2 min · travail 6 min · correction 2 min.
- Feuille de 11 lignes sur 7 colonnes (§ 5.1). F2 `=ARRONDI(COEFFICIENT.CORRELATION(C2:C11;$B$2:$B$11);3)`,
  F3 `=ARRONDI(PENTE($B$2:$B$11;C2:C11);2)`, F4 `=ARRONDI(ORDONNEE.ORIGINE($B$2:$B$11;C2:C11);2)`,
  recopiées vers la droite en G.

#### A2-06 · `B1-04-A2-06-ATELIER-CAUSALITE` — 8 min · `questionnaire` · séance

- Titre public : « Exercice 3 — Les chocolats font-ils vendre des jeux ? »
- Temps : réflexion 2 min · travail 4 min · correction 2 min.
- Questions `b1-04-a2-r-chocolats` (numérique), `b1-04-a2-cause`, `b1-04-a2-signe`,
  `b1-04-a2-pente` (votes notés) (§ 5.2).

#### A2-07 · `B1-04-A2-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : comparer deux ajustements, sans conclure à une cause »

### 3.4 Acte 3 — Prévoir : interpoler, extrapoler, atteindre un seuil (32 min)

#### A3-01 · `B1-04-A3-01-VOTE-PREVOIR` — 5 min · `fp-vote` · séance

- Titre public : « Vote : prévoir, oui, mais jusqu’où ? »
- `b1-04-a3-vote-extrapoler` : 5 000 € hors de 400 à 1 300 € (`extrapolation-sans-reserve`).
  `b1-04-a3-vote-rang` : rang 7 pour 2027, piège x = 2027 (`rang-pris-pour-annee`).

#### A3-02 · `B1-04-A3-02-ENFANT-PIERRES` — 1 min · v2 `image-left` · catalogue

- Titre public : « Le gué dans le brouillard »
- Correspondances : les pierres au soleil → les données ; sauter entre deux pierres → interpoler ;
  avancer dans le brouillard → extrapoler. Image `pierres-brouillard.webp`.

#### A3-02 · `B1-04-A3-02-COURS-PREVOIR` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : interpoler ou extrapoler »
- Page 1 sur 2. Exemple pour débuter : Léa, 3 heures puis 20 heures ; méthode « Le rang, pas
  l'année ».

#### A3-03 · `B1-04-A3-03-ENFANT-CHAMBRANLE` — 1 min · v2 `image-left` · catalogue

- Titre public : « La marque sur la porte »
- Correspondances : les traits → les valeurs ; la montée → la droite ; le ruban → le seuil ; le
  premier anniversaire au-dessus → le premier rang entier. Image `chambranle-traits.webp`.

#### A3-03 · `B1-04-A3-03-COURS-SEUIL` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : atteindre un seuil »
- Page 2 sur 2. ax + b > S ; exemple pour débuter : 3x + 40 > 100, rang 21 ; méthode « Résoudre, puis
  arrondir au-dessus ».

#### A3-04 · `B1-04-A3-04-EXEMPLE-SOIREES` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : prévoir les soirées d’Angers »
- Droite d'Angers y = 1,45x + 2,3. Étapes `interpoler` (5 soirées : 9,55 k€), `extrapoler`
  (30 soirées : 45,8 k€), `inequation` (x > 12,21), `rang` (13 soirées), `reserve`.

#### A3-05 · `B1-04-A3-05-NUAGE-ANNALE` — 1 min · v2 `scatter` · séance

- Titre public : « Le nuage de l’annale et la droite D »
- Les onze points (rang ; espérance de vie), étiquetés de leur valeur, et la droite D :
  y = 0,1x + 84,2. Dérogation `confidentialite` (§ 0).

#### A3-06 · `B1-04-A3-06-ATELIER-ANNALE` — 13 min · `questionnaire` · séance

- Titre public : « Exercice 4 — Annale : l’espérance de vie des femmes »
- Temps : réflexion 2 min · travail 8 min · correction 3 min.
- Renvoi au nuage A3-05. Questions `b1-04-a3-annale-r`, `b1-04-a3-annale-a`, `b1-04-a3-annale-b`,
  `b1-04-a3-annale-2018` (numériques) et `b1-04-a3-annale-p` (vote noté) (§ 5.3).

#### A3-07 · `B1-04-A3-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 3 : prévoir avec prudence »
- Puis pause de 15 minutes.

### 3.5 Acte 4 — Rappel et fiche mémo (8 min)

#### A4-01 · `B1-04-A4-01-RAPPEL` — 6 min · `fp-spaced` · séance

- Titre public : « Rappel : de mémoire, sans vos notes »
- Les douze questions de la banque (§ 5.10) sont obligatoires.

#### A4-02 · `B1-04-A4-02-FICHE-MEMO` — 2 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : ajuster et prévoir »
- Neuf cartes et le référentiel (`REFERENTIEL_DU_BTS_CG`).

## 4. Mode papier

Le livret reprend, dans l'ordre des écrans, les écrans « pour comprendre », les traces écrites, les
énoncés et un cadre de réponse par question. Les nuages A1-09 et A3-05 sont imprimés, la droite D
comprise. Les formules des exercices 1 et 2 s'écrivent sur la copie avec la grille des cellules ;
sans poste, a, b et r se lisent à la calculatrice.

## 5. Contenus

### 5.1 Les deux feuilles

| Mois                |    Jan |    Fév |    Mar |    Avr |    Mai |    Jun |    Jul |    Aoû |    Sep |    Oct |
| ------------------- | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: |
| Budget pub site (€) |    400 |    600 |    500 |    800 |    700 |    900 |  1 000 |  1 200 |  1 100 |  1 300 |
| CA du site (€)      | 21 000 | 26 000 | 23 000 | 30 000 | 29 000 | 32 000 | 35 000 | 41 000 | 37 000 | 43 000 |
| CA de Nantes (k€)   |     52 |     49 |     46 |     40 |     39 |     33 |     31 |     30 |     35 |     41 |
| Température (°C)    |      6 |      7 |     10 |     13 |     16 |     20 |     23 |     22 |     18 |     14 |
| Soirées jeux        |      8 |      6 |      9 |      5 |      7 |      6 |      4 |      6 |      5 |      8 |

Exercice 1 : G(850 ; 31 700) (pièges : ȳ en E2, la somme 8 500, `point-moyen-confondu`) ;
a = 24,18 et b = 11 145,45 (pièges : plages inversées 0,04 et −451, `pente-ordonnee-inversees` ;
valeurs non arrondies, `arrondi-oublie`). r = 0,996 n'est pas demandé.

Exercice 2 : température r = −0,990, a = −1,25, b = 58,26 (pièges : plages inversées −0,78 et
45,91) ; soirées r = 0,629, a = 3,02, b = 20,29 (pièges de la recopie sans `$` : −0,595, −2,26 et
29,36, `reference-non-figee-en-ligne`). |−0,990| > 0,629 : on retient la température.

### 5.2 Exercice 3

Chocolats 120, 180, 260, 310, 290, 150 ; jeux 230, 250, 350, 380, 330, 260, d'octobre à mars.
r = 0,956 (piège : la pente 0,743, `correlation-lue-comme-pente`) ; la saison est le facteur caché
(`correlation-prise-pour-causalite`) ; r = −0,97 justifie un ajustement (`correlation-jugee-au-signe`) ;
le nombre de jeux par chocolat est la pente a ≈ 0,74 (`correlation-lue-comme-pente`).

### 5.3 Exercice 4, l'annale

Annale BTS CG Polynésie, 14 mai 2018, exercice 1, partie A (édition APMEP). Espérance de vie des
femmes à la naissance, 2006 à 2016 (rangs 0 à 10) : 84,2 ; 84,4 ; 84,3 ; 84,4 ; 84,6 ; 85 ; 84,8 ;
85 ; 85,4 ; 85,1 ; 85,4 (Insee).

- r = 0,945 (piège : a au millième, 0,123, `correlation-lue-comme-pente`).
- a = 0,12 et b = 84,17 (pièges : plages inversées 7,27 et −611,56, `pente-ordonnee-inversees`).
- Par D : y = 0,1x + 84,2 ; 2018 a le rang 12 : 85,4 ans (piège : x = 2018 donne 286,
  `rang-pris-pour-annee`).
- Proposition P fausse : 0,1x + 84,2 > 86 donne x > 18 ; au rang 19 (2025), 86,1 ans. Au rang 18,
  D donne 86 ans pile (piège `seuil-mal-arrondi`).

### 5.9 Concepts, confusions et remédiations

**Concepts** : `nuage-de-points`, `ajustement-affine`, `correlation`, `lecture-graphique`,
`prevision`, `tableur` (tous déjà dans la banque). **Confusions** : toutes existantes.

| Identifiant                        | Concept           | Libellé court                          | Remédiation                   |
| ---------------------------------- | ----------------- | -------------------------------------- | ----------------------------- |
| `point-moyen-confondu`             | nuage-de-points   | Prendre les sommes ou échanger x et y. | B1-04-A1-06-COURS-NUAGE       |
| `pente-ordonnee-inversees`         | ajustement-affine | Inverser les plages ou a et b.         | B1-04-A1-07-COURS-DROITE      |
| `arrondi-oublie`                   | tableur           | Ne pas arrondir au centième.           | B1-04-A1-07-COURS-DROITE      |
| `correlation-jugee-au-signe`       | correlation       | Rejeter un r négatif.                  | B1-04-A2-02-COURS-CORRELATION |
| `correlation-lue-comme-pente`      | correlation       | Lire r comme la pente.                 | B1-04-A2-02-COURS-CORRELATION |
| `reference-non-figee-en-ligne`     | tableur           | Recopier sans figer la plage des y.    | B1-04-A2-02-COURS-CORRELATION |
| `correlation-prise-pour-causalite` | lecture-graphique | Conclure à une cause.                  | B1-04-A2-03-COURS-CAUSALITE   |
| `extrapolation-sans-reserve`       | prevision         | Prévoir loin sans réserve.             | B1-04-A3-02-COURS-PREVOIR     |
| `rang-pris-pour-annee`             | prevision         | Remplacer x par l'année.               | B1-04-A3-02-COURS-PREVOIR     |
| `seuil-mal-arrondi`                | prevision         | Garder le rang de l'égalité.           | B1-04-A3-03-COURS-SEUIL       |

### 5.10 Rappels espacés

Douze rappels, tous obligatoires, écrits dans `b1-04.acte-4.ts` : point moyen, syntaxe de `PENTE`,
ordonnée à l'origine, `ARRONDI`, r négatif, r lu comme pente, comparer r₁ et r₂, `$` dans
`COEFFICIENT.CORRELATION`, glaces et coups de soleil, extrapoler loin, rang contre année, seuil.

## 6. Moteur

- **Aucune évolution du moteur.** `PENTE`, `ORDONNEE.ORIGINE` et `COEFFICIENT.CORRELATION` sont
  déjà dans le moteur de formules (`Formule.ts`) ; `b1-04.donnees.ts` calcule ses attendus par ce
  même moteur. Le rendu `scatter`, point étiqueté et droite comprise, est servi et rendu par le
  front. La recopie vers la droite vient du B1-02.

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
`illustrations-b1-04/prompts.md`. Les deux nuages sont dessinés par le code. La gravure de
l'accroche, déjà servie au B2-02, complète le catalogue.

### 8.2 Catalogue des médias

Chaque PNG d'origine (1 536 × 1 024 px) est converti en WebP à la même taille et servi depuis
`/assets/cours/b1-04/v1/`. Le catalogue est stocké avec le cours (`Cours.medias`) et contrôlé par la
règle `media-sans-licence`.

| Id  | Écran | Fichier source (page)                                                           | Original             | Auteur, date         | Licence        | Dérivé servi                  | Attribution affichée                                                       |
| --- | ----- | ------------------------------------------------------------------------------- | -------------------- | -------------------- | -------------- | ----------------------------- | -------------------------------------------------------------------------- |
| M1  | A1-06 | production propre du cours                                                      | PNG 1 536 × 1 024 px | Asili Design, 2026   | CC BY-SA 4.0   | `plateau-equilibre.webp`      | « Tenir en équilibre sur un doigt · Asili Design, 2026 · CC BY-SA 4.0 »    |
| M2  | A1-07 | production propre du cours                                                      | PNG 1 536 × 1 024 px | Asili Design, 2026   | CC BY-SA 4.0   | `baton-ficelles.webp`         | « Le bâton au plus près des cailloux · Asili Design, 2026 · CC BY-SA 4.0 » |
| M3  | A2-02 | production propre du cours                                                      | PNG 1 536 × 1 024 px | Asili Design, 2026   | CC BY-SA 4.0   | `oiseaux-vols.webp`           | « En file ou en désordre · Asili Design, 2026 · CC BY-SA 4.0 »             |
| M4  | A2-03 | production propre du cours                                                      | PNG 1 536 × 1 024 px | Asili Design, 2026   | CC BY-SA 4.0   | `pluie-parapluies.webp`       | « Ce n’est pas le parapluie · Asili Design, 2026 · CC BY-SA 4.0 »          |
| M5  | A3-02 | production propre du cours                                                      | PNG 1 536 × 1 024 px | Asili Design, 2026   | CC BY-SA 4.0   | `pierres-brouillard.webp`     | « Le gué dans le brouillard · Asili Design, 2026 · CC BY-SA 4.0 »          |
| M6  | A3-03 | production propre du cours                                                      | PNG 1 536 × 1 024 px | Asili Design, 2026   | CC BY-SA 4.0   | `chambranle-traits.webp`      | « La marque sur la porte · Asili Design, 2026 · CC BY-SA 4.0 »             |
| M7  | A1-02 | https://commons.wikimedia.org/wiki/File:Galton%27s_correlation_diagram_1875.jpg | JPEG 745 × 631 px    | Francis Galton, 1875 | domaine public | `galton-correlation-1875.jpg` | « Francis Galton, 1875 · Wikimedia Commons (domaine public) »              |

### 8.3 Briefs des images

PNG 1 536 × 1 024 px, dessin à la main, fond clair, couleurs pastel, **aucun texte dans l'image** :
les phrases sont à l'écran, à côté. Une seule scène, lisible projetée au fond d'une salle.

1. **Tenir en équilibre sur un doigt** (`plateau-equilibre.webp`, avant A1-06) : un enfant tient un
   grand plateau sur un seul doigt ; une douzaine de biscuits éparpillés, plus serrés vers un coin ;
   le plateau reste à plat.
2. **Le bâton au plus près des cailloux** (`baton-ficelles.webp`, avant A1-07) : une dizaine de
   cailloux qui montent ; un bâton posé en travers ; de chaque caillou, une ficelle verticale
   tendue jusqu'au bâton.
3. **En file ou en désordre** (`oiseaux-vols.webp`, avant A2-02) : une file d'oiseaux qui monte, une
   qui descend, une volée éparpillée.
4. **Ce n'est pas le parapluie** (`pluie-parapluies.webp`, avant A2-03) : sous l'averse, des enfants
   en bottes avec un parapluie ouvert ; un autre, à l'abri, en baskets.
5. **Le gué dans le brouillard** (`pierres-brouillard.webp`, avant A3-02) : un chemin de pierres sur
   une rivière, au soleil puis dans le brouillard.
6. **La marque sur la porte** (`chambranle-traits.webp`, avant A3-03) : des traits au crayon sur un
   chambranle, un enfant dos au montant, un ruban rouge plus haut.

### 8.4 Sources des données

- Partie Libre et tous les exemples : données fictives créées pour ce cours.
- Exercice 4 : annale BTS CG Polynésie 2018, données Insee.
- Accroche : diagramme de Francis Galton, 1875, domaine public (Wikimedia Commons).
