# B2-06 · Exponentielle et logarithme — conception de référence (gabarit v3)

> Cahier des charges du cours B2-06 au gabarit v3 (`docs/cours-gabarit-v3.md`) : une séance de
> 3 h 30 dont 30 minutes de pause, ouverte par le rappel du B2-02, du B2-04 et du B2-05, puis trois
> notions traitées chacune par un cycle réfléchir → comprendre → s'exercer, et une mini-situation
> CCF. Ce document ne contient aucun code exécutable ; toute divergence d'implémentation est un
> défaut de l'implémentation. Les tests `b2-06.cours.spec.ts` relisent ce document : § 3.1, titres
> publics du § 3, § 5.9, § 8.2.

| Rubrique    | Valeur                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| Date        | 1er octobre 2026                                                                                                    |
| Statut      | **Référence pédagogique** : sixième cours du plan v3 (`docs/cours-bts-cg2-plan-v3.md`), cinquième au gabarit v3     |
| Cours       | `b2-06-exponentielle-logarithme`                                                                                    |
| Gabarit     | `v3`, déclaré par le contenu et contrôlé par les quatre règles `gabarit-*` de `verifierStructure`                   |
| Titre servi | « Exponentielle et logarithme »                                                                                     |
| Durée       | **180 minutes exactes** (somme des écrans), 4 actes de 49, 39, 47 et 45 minutes, plus 2 pauses de 15 min hors durée |
| Écrans      | **34**, dont 12 écrans catalogue                                                                                    |
| Sources     | `docs/donnees-b2-06-sources.md` (espace de travail) : programme officiel, sujet CCF de Créteil, données fictives    |

---

## 0. Synthèse des décisions

- **Une question de gestion : la gamme Sillage.** Atelier Rivage lance des sacs en toile de voile
  recyclée. Hélène Garnier se pose trois questions : à quel rythme croissent les ventes en ligne,
  modélisées par V(x) = 400e^(0,06x) ; à partir de quel mois dépasseront-elles la capacité de
  1 000 sacs de l'atelier ; quel modèle décrit la demande des boutiques nautiques selon le prix de
  gros. Chaque question est une notion du cours.
- **Le cours s'ouvre par le rappel du B2-02, du B2-04 et du B2-05**, et chaque acquis devient une
  brique du jour : la suite géométrique u₀ × qⁿ (B2-04) et le capital placé C₀ × (1 + t)ⁿ (B2-05)
  deviennent la fonction x ↦ a e^(kx), définie pour tout x réel ; la droite des moindres carrés et
  `PENTE` (B2-02) servent à ajuster z = ln y.
- **Trois notions** : de qⁿ à e^(kx), la fonction exponentielle et ses modèles (N1) ; le logarithme
  népérien et la résolution de qⁿ ≥ s et de e^(kx) ≥ s (N2) ; les modèles exponentiels et
  l'ajustement par le changement de variable z = ln y (N3).
- **Deux fonctions de tableur nouvelles, `EXP` et `LN`**, entrent dans les deux moteurs de formules.
  `PENTE` et `ORDONNEE.ORIGINE`, vues au B2-02, reviennent pour l'ajustement.
- **La limite n'est pas au programme** : le cours décrit le sens de variation et le signe de
  x ↦ e^(kx) sans parler de limite ni d'asymptote.
- **Mini-situation sur le modèle du sujet CCF de Créteil n° 1** : les kits de réparation de voile,
  demande ajustée au tableur par z = ln y, puis modèle retenu f(x) = 20e^(−0,7x), demande pour un
  prix, prix pour une demande de 400 kits, seuil et taux de baisse.

## 1. Objectifs d'apprentissage et public

### 1.1 Rattachement au programme officiel

Module « Analyse de phénomènes exponentiels » : paragraphe « Fonctions de référence » (fonctions
logarithme népérien et exponentielle de base e, représenter une fonction de référence et exploiter
sa courbe ; la notion de limite n'est pas au programme), et ligne « Exploiter le tableau de
variation d'une fonction f pour obtenir […] le nombre de solutions d'une équation du type
f(x) = k », dont les solutions se déterminent « explicitement dans les cas simples » : le passage
par ln pour résoudre qⁿ = k ou e^(at) = k en relève. Ajustement « se ramenant, par un changement de
variable simple donné, à un ajustement affine » (`docs/programme-bts-cg-maths-officiel.md`, § B2-05
b et notes de répartition).

### 1.2 Objectifs du cours

À la fin de la séance, l'étudiant sait :

1. calculer une valeur de x ↦ a e^(kx) à la calculatrice et au tableur avec `EXP` ;
2. dire le sens de variation de x ↦ a e^(kx) selon le signe de k, et le taux d'évolution e^k − 1
   par unité ;
3. utiliser ln comme réciproque de l'exponentielle et ses propriétés sur les produits et les
   puissances ;
4. résoudre qⁿ ≥ s et a e^(kx) ≥ s par ln, en changeant le sens de l'inégalité quand on divise par
   un nombre négatif, et donner le premier entier solution ;
5. ajuster une série par z = ln y au tableur (`LN`, `PENTE`, `ORDONNEE.ORIGINE`, `EXP`) et revenir
   au modèle y = e^b × e^(ax) ;
6. utiliser un modèle exponentiel pour calculer une valeur et la valeur de x qui donne une valeur
   visée.

### 1.3 Acquis des cinq premiers cours

| Cours | Savoirs installés                                                                                                                                                                                                                  | Réemploi dans le B2-06                                            |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| B2-01 | Proportion, taux d'évolution, coefficient multiplicateur, évolutions successives et réciproque, points de pourcentage, indice, taux moyen, moyenne pondérée, lecture de graphiques, contrôles ; `$`, `SOMME`, `PUISSANCE`, recopie | Taux d'évolution e^k − 1 ; coefficient e^k ; `$`                  |
| B2-02 | Moyenne, médiane, écart-type ; nuage, corrélation ; droite d'ajustement, prévision ; `PENTE`, `ORDONNEE.ORIGINE`                                                                                                                   | Ajustement de z = ln y ; seuil arrondi au premier entier          |
| B2-03 | Connecteurs, implication, négation, quantificateurs ; `SI`, `ET`, `OU`, `NON`, `NB.SI`                                                                                                                                             | Aucun réemploi direct                                             |
| B2-04 | Suites arithmétiques et géométriques, terme général, rang, seuil, somme de termes ; recopie, `SOMME`                                                                                                                               | qⁿ devient e^(kx) ; le seuil se résout par ln au lieu de tâtonner |
| B2-05 | Intérêts composés, valeur actuelle, annuités, emprunt, tableau d'amortissement, coût du crédit ; `VPM`                                                                                                                             | Durée de doublement d'un placement, 1,025ⁿ ≥ 2                    |

### 1.4 Public et conditions

BTS CG 2e année, 25 étudiants au plus, calculatrice autorisée, un poste par étudiant ou le livret
papier. Séance de 3 h 30 : 180 minutes de travail, pause de 15 minutes après l'acte 1 et après
l'acte 3.

## 2. Architecture

### 2.1 Les quatre actes

| Acte | Rôle                                  | Notion | Minutes |
| ---- | ------------------------------------- | ------ | ------: |
| 1    | Rappel des cours, puis de qⁿ à e^(kx) | N1     |      49 |
| 2    | Le logarithme et les seuils           | N2     |      39 |
| 3    | Modèles exponentiels et ajustement    | N3     |      47 |
| 4    | Mini-situation CCF et clôture         | —      |      45 |

Pause 1 (15 min) après le jalon A1-12 ; pause 2 (15 min) après le jalon A3-09. Les pauses ne sont
pas des écrans : le formateur les annonce, la durée programmée n'en tient pas compte.

### 2.2 L'ouverture : rappel rapide du B2-02, du B2-04 et du B2-05

Neuf minutes, trois temps : une question de rappel d'ouverture sur le B2-05 (`fp-recall`, une seule
question) ; un vote à deux questions sur le B2-04 et le B2-02, avec révélation commentée ; un écran
de synthèse en trois colonnes, qui dit pour chaque acquis ce qu'il devient aujourd'hui. On interroge
avant de montrer : le rappel de mémoire précède la synthèse.

### 2.3 Le cycle d'une notion

Chaque notion suit : **Réfléchir** (mission, réflexion écrite ou vote non noté) → **Comprendre**
(trace écrite en deux pages v2 `lesson` de 3 minutes, puis exemple guidé `fp-worked` corrigé étape
par étape sur son propre écran) → **S'exercer** (exercices notés, corrigés sur place). Chaque page de
trace écrite porte trois blocs : une définition en langage courant qui dit à quoi sert la notion pour
la gamme Sillage, un exemple pour débuter hors du dossier et une méthode ou un encadré « Au CCF »
qui nomme les pièges.

Chaque exercice annonce ses temps dans les notes formateur, sous la forme
`• Temps : réflexion N min · travail N min · correction N min`, dont la somme est la durée de
l'écran. La correction se dévoile sur l'écran de l'exercice (`correctionSurPlace`).

### 2.4 Règles de structure

Le cours passe les règles communes et les quatre règles du gabarit v3 : 34 écrans ≤ 40,
180 minutes ≤ 180, chaque trace écrite précédée d'une réflexion et suivie d'un exercice, chaque
exercice avec ses trois temps et sa correction sur place, mini-situation (`fp-escape`) sans trace
écrite après elle. Exposition continue de 6 minutes au plus.

### 2.5 Diffusion

Catalogue : l'accroche, la synthèse des acquis, le dossier de la gamme Sillage, les six pages de
trace écrite, le graphique des demandes relevées, le dossier de la mini-situation et la fiche mémo.
Tout le reste est servi en séance. Aucun écran catalogue ne porte une réponse : le graphique montre
des relevés, que l'exercice 5 donne aussi, sans leur logarithme ni leur ajustement.

### 2.6 Notation

Exposants en caractères Unicode quand ils sont des nombres (e⁰, e³, 1,025ⁿ) et en notation
e^(kx) quand l'exposant est une expression, dans les traces écrites, les énoncés et le livret. Les
coefficients s'écrivent en décimal (k = 0,06) et les taux en pourcentage dans les phrases (6,18 %).
ln désigne le logarithme népérien, jamais le logarithme décimal (touche log).

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B2-06-A{acte}-{rang}-{SLUG}`, conformes à `^B2-06-A[1-6]-\d{2}-[A-Z0-9-]+$`.
Colonne « Brique · rendu » : valeur de la colonne `brique` ; les écrans « v2 » sont stockés en
`fp-story` avec une présentation v2. « I » = interactif. « Q » = questions fermées notées (vote,
numérique, classement) portées par l'écran.

| Rang | Identifiant                      | Min | Brique · rendu               |  I  |   Q | Diffusion |
| ---: | -------------------------------- | --: | ---------------------------- | :-: | --: | --------- |
|    1 | B2-06-A1-01-RAPPEL-PLACEMENT     |   3 | `fp-recall`                  |  I  |   1 | seance    |
|    2 | B2-06-A1-02-ACCROCHE             |   1 | `fp-story` · v2 `hero`       |     |   0 | catalogue |
|    3 | B2-06-A1-03-VOTE-ACQUIS          |   4 | `fp-vote`                    |  I  |   0 | seance    |
|    4 | B2-06-A1-04-ACQUIS               |   2 | `fp-story` · v2 `comparison` |     |   0 | catalogue |
|    5 | B2-06-A1-05-DOSSIER              |   2 | `fp-story` · v2 `table`      |     |   0 | catalogue |
|    6 | B2-06-A1-06-MISSION              |   6 | `fp-pro`                     |  I  |   0 | seance    |
|    7 | B2-06-A1-07-COURS-EXPONENTIELLE  |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|    8 | B2-06-A1-08-COURS-MODELE-EXP     |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|    9 | B2-06-A1-09-EXEMPLE-ABONNES      |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   10 | B2-06-A1-10-ATELIER-VENTES       |  10 | `questionnaire`              |  I  |   4 | seance    |
|   11 | B2-06-A1-11-TABLEUR-VENTES       |   8 | `fp-sheet`                   |  I  |   0 | seance    |
|   12 | B2-06-A1-12-JALON                |   1 | `fp-pulse`                   |     |   0 | seance    |
|   13 | B2-06-A2-01-REFLEXION-RECIPROQUE |   5 | `fp-story` · v2 `reflection` |  I  |   0 | seance    |
|   14 | B2-06-A2-02-COURS-LOGARITHME     |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   15 | B2-06-A2-03-COURS-SEUIL          |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   16 | B2-06-A2-04-EXEMPLE-DOUBLEMENT   |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   17 | B2-06-A2-05-ATELIER-SEUILS       |  11 | `questionnaire`              |  I  |   4 | seance    |
|   18 | B2-06-A2-06-TABLEUR-OBJECTIFS    |  10 | `fp-sheet`                   |  I  |   0 | seance    |
|   19 | B2-06-A2-07-JALON                |   1 | `fp-pulse`                   |     |   0 | seance    |
|   20 | B2-06-A3-01-GRAPHIQUE            |   2 | `fp-story` · v2 `chart`      |     |   0 | catalogue |
|   21 | B2-06-A3-02-VOTE-MODELE          |   4 | `fp-vote`                    |  I  |   0 | seance    |
|   22 | B2-06-A3-03-COURS-MODELE         |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   23 | B2-06-A3-04-COURS-AJUSTEMENT     |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   24 | B2-06-A3-05-EXEMPLE-AJUSTEMENT   |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   25 | B2-06-A3-06-TABLEAU-LOGARITHMES  |   8 | `fp-table-build`             |  I  |   0 | seance    |
|   26 | B2-06-A3-07-ATELIER-DEMANDE      |  10 | `questionnaire`              |  I  |   4 | seance    |
|   27 | B2-06-A3-08-DEFI-IA              |  10 | `fp-challenge`               |  I  |   0 | seance    |
|   28 | B2-06-A3-09-JALON                |   1 | `fp-pulse`                   |     |   0 | seance    |
|   29 | B2-06-A4-01-SITUATION-KITS       |   3 | `fp-story` · v2 `table`      |     |   0 | catalogue |
|   30 | B2-06-A4-02-TABLEUR-KITS         |  16 | `fp-sheet`                   |  I  |   0 | seance    |
|   31 | B2-06-A4-03-COFFRE-KITS          |  14 | `fp-escape`                  |  I  |   0 | seance    |
|   32 | B2-06-A4-04-RAPPEL               |   6 | `fp-spaced`                  |  I  |   0 | seance    |
|   33 | B2-06-A4-05-FICHE-MEMO           |   2 | `fp-story` · v2 `grid`       |     |   0 | catalogue |
|   34 | B2-06-A4-06-BILLET-DE-SORTIE     |   4 | `fp-exit`                    |  I  |   1 | seance    |

Rythme : 147 minutes interactives, 33 d'exposition, exposition continue de 6 minutes au plus.

### 3.2 Acte 1 — Rappel des cours, puis de qⁿ à e^(kx) (49 min)

#### A1-01 · `B2-06-A1-01-RAPPEL-PLACEMENT` — 3 min · `fp-recall` · séance

- Titre public : « Rappel du B2-05 : un capital placé à 3 % »
- Énoncé (`b2-06-a1-rappel-placement`) : que vaut, au bout de n années, un capital de 1 000 €
  placé à 3 % par an à intérêts composés ? Bonne réponse : 1 000 × 1,03ⁿ ; pièges
  `coefficient-confondu-avec-taux`, `interets-simples-au-lieu-de-composes`.
- Papier : question en tête du livret, vote à main levée.

#### A1-02 · `B2-06-A1-02-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Exponentielle et logarithme : croître, viser, ajuster »
- La gamme Sillage et ses trois questions ; plan en trois notions et une mini-situation.

#### A1-03 · `B2-06-A1-03-VOTE-ACQUIS` — 4 min · `fp-vote` · séance

- Titre public : « Vote : deux rappels, B2-04 et B2-02 »
- Deux votes non notés, révélation commentée : l'évolution des termes d'une suite géométrique de
  raison 0,9 (`nature-de-suite-confondue`) ; l'ordre des séries dans `PENTE`
  (`pente-ordonnee-inversees`).

#### A1-04 · `B2-06-A1-04-ACQUIS` — 2 min · v2 `comparison` · catalogue

- Titre public : « Ce que vous savez déjà »
- Trois colonnes : la suite géométrique (B2-04), les intérêts composés (B2-05), l'ajustement affine
  au tableur (B2-02) ; puis leur emploi du jour. Trois lignes courtes par colonne : l'écran tient
  dans la toile 1280 × 720 sans descendre sous l'échelle 0,8.

#### A1-05 · `B2-06-A1-05-DOSSIER` — 2 min · v2 `table` · catalogue

- Titre public : « Le dossier de la gamme Sillage »
- Le projet, les ventes en ligne et leur modèle, la capacité de l'atelier, l'étude de prix auprès des
  boutiques nautiques, les questions d'Hélène. Mention « Données fictives ».

#### A1-06 · `B2-06-A1-06-MISSION` — 6 min · `fp-pro` · séance

- Titre public : « Votre mission : chiffrer la gamme Sillage »
- Courriel d'Hélène Garnier, remarque de Marc Lefèvre sur le modèle. Trois questions libres, temps
  « réfléchir » de N1 : les ventes gagnent-elles le même nombre de sacs chaque mois (`croissance`) ;
  comment trouver le mois des 1 000 sacs sans essayer tous les mois (`seuil`) ; une droite
  suffit-elle à décrire la baisse de la demande quand le prix monte (`prix`).
- Papier : trois lignes d'écriture dans le livret.

#### A1-07 · `B2-06-A1-07-COURS-EXPONENTIELLE` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : de qⁿ à la fonction exponentielle »
- Page 1 sur 2 : la suite géométrique ne vit qu'aux entiers, la fonction exponentielle prolonge
  qⁿ à tout x réel ; le nombre e ≈ 2,718 ; e⁰ = 1, eˣ > 0, croissante, e^(a + b) = e^a × e^b ;
  exemple pour débuter (e¹, e^0,5, e^(−1)) ; méthode et pièges.

#### A1-08 · `B2-06-A1-08-COURS-MODELE-EXP` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : les modèles a e^(kx) et le tableur »
- Page 2 sur 2 : a valeur en 0, chaque unité multiplie par e^k, taux e^k − 1 ; sens selon le signe
  de k ; au tableur, `EXP` et les paramètres figés par `$` ; au CCF, lire a et k avant de calculer.

#### A1-09 · `B2-06-A1-09-EXEMPLE-ABONNES` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : 200 abonnés et e^(0,05x) »
- Valeur en 0, valeur au bout de 10 semaines, coefficient et taux hebdomadaires, modèle décroissant
  200e^(−0,05x). 4 min de réponses, puis 2 min de correction dévoilée étape par étape.

#### A1-10 · `B2-06-A1-10-ATELIER-VENTES` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 1 — Les ventes en ligne »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, question par question sur place.
- `b2-06-a1-calcul` (vote) : le calcul de V(5) ; pièges `exponentielle-lue-comme-produit`,
  `k-confondu-avec-taux`.
- `b2-06-a1-ventes` : ventes prévues en juin 2026 (x = 5) ; pièges `k-confondu-avec-taux`,
  `exponentielle-lue-comme-produit`.
- `b2-06-a1-sens` (vote) : le sens de variation des ventes en boutique 900e^(−0,04x) ; piège
  `signe-de-k-ignore`.
- `b2-06-a1-taux` : le taux d'évolution mensuel des ventes en ligne ; pièges
  `k-confondu-avec-taux`, `coefficient-confondu-avec-taux`.

#### A1-11 · `B2-06-A1-11-TABLEUR-VENTES` — 8 min · `fp-sheet` · séance

- Titre public : « Exercice 2 — Les ventes au tableur »
- Temps : réflexion 1 min · travail 5 min · correction 2 min sur place.
- Mois 0 à 6 en colonne A, a en E1 et k en E2 : ventes en colonne B (`EXP`, paramètres figés),
  taux d'évolution d'un mois sur l'autre en colonne C. Treize cellules attendues ; pièges
  `exponentielle-lue-comme-produit`, `k-confondu-avec-taux`, `reference-relative-non-figee`,
  `coefficient-confondu-avec-taux`.

#### A1-12 · `B2-06-A1-12-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 1 : fonction exponentielle »
- Puis pause de 15 minutes.

### 3.3 Acte 2 — Le logarithme et les seuils (39 min)

#### A2-01 · `B2-06-A2-01-REFLEXION-RECIPROQUE` — 5 min · v2 `reflection` · séance

- Titre public : « Réfléchir : remonter de 1 000 sacs au mois »
- Un stagiaire essaie les mois un à un pour trouver quand V(x) atteint 1 000. Dire quelle opération
  « remonte » d'une valeur de l'exponentielle à son exposant, comme la division remonte d'un
  produit. Temps « réfléchir » de N2.

#### A2-02 · `B2-06-A2-02-COURS-LOGARITHME` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : le logarithme népérien »
- Page 1 sur 2 : ln y est le nombre x tel que eˣ = y, pour y > 0 ; ln 1 = 0, ln e = 1 ; ln change
  les produits en sommes et ln(aⁿ) = n × ln a ; exemple pour débuter (eˣ = 5) ; méthode et pièges,
  dont la touche log.

#### A2-03 · `B2-06-A2-03-COURS-SEUIL` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : résoudre qⁿ ≥ s avec ln »
- Page 2 sur 2 : appliquer ln, qui garde le sens ; diviser par ln q, qui change le sens si q < 1 ;
  premier entier solution ; même méthode pour a e^(kx) ≥ s ; au tableur, `LN` ; au CCF, rédiger
  chaque étape.

#### A2-04 · `B2-06-A2-04-EXEMPLE-DOUBLEMENT` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : doubler, puis perdre la moitié »
- Durée de doublement de la trésorerie placée à 2,5 % (lien B2-05), puis durée au bout de laquelle
  une machine qui perd 20 % par an vaut moins de la moitié de son prix : le sens change.

#### A2-05 · `B2-06-A2-05-ATELIER-SEUILS` — 11 min · `questionnaire` · séance

- Titre public : « Exercice 3 — La capacité de l’atelier »
- Temps : réflexion 2 min · travail 7 min · correction 2 min, question par question sur place.
- `b2-06-a2-equivalence` (vote) : la résolution de 1,06ⁿ ≥ 2 ; pièges `seuil-par-division`,
  `ln-produit-en-produit`.
- `b2-06-a2-capacite` : premier mois où les ventes dépassent 1 000 sacs ; pièges
  `seuil-mal-arrondi`, `seuil-par-division`.
- `b2-06-a2-sens` (vote) : la résolution de 0,8ⁿ ≤ 0,4 ; pièges `sens-inegalite-ln-negatif`,
  `seuil-par-division`.
- `b2-06-a2-machine` : années au bout desquelles la machine vaut moins de 40 % de son prix ; pièges
  `seuil-mal-arrondi`, `coefficient-confondu-avec-taux`.

#### A2-06 · `B2-06-A2-06-TABLEUR-OBJECTIFS` — 10 min · `fp-sheet` · séance

- Titre public : « Exercice 4 — Les objectifs de ventes au tableur »
- Temps : réflexion 2 min · travail 6 min · correction 2 min sur place.
- Six objectifs de ventes mensuelles en colonne A, a en E1 et k en G1 : ln(s ÷ a) en colonne B,
  mois exact en colonne C. Douze cellules attendues ; pièges `seuil-par-division`,
  `ln-produit-en-produit`, `reference-relative-non-figee`.

#### A2-07 · `B2-06-A2-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : logarithme et seuils »

### 3.4 Acte 3 — Modèles exponentiels et ajustement (47 min)

#### A3-01 · `B2-06-A3-01-GRAPHIQUE` — 2 min · v2 `chart` · catalogue

- Titre public : « La demande des boutiques selon le prix de gros »
- Six demandes relevées, de 20 € à 45 €, en courbe : la demande baisse de moins en moins vite, en
  perdant à peu près la même part à chaque hausse de 5 €.

#### A3-02 · `B2-06-A3-02-VOTE-MODELE` — 4 min · `fp-vote` · séance

- Titre public : « Vote : quel modèle pour la demande ? »
- Deux votes non notés (temps « réfléchir » de N3) : le modèle d'une baisse d'une même part à
  chaque pas (`ajustement-affine-sur-y`) ; le logarithme d'un modèle exponentiel
  (`ln-produit-en-produit`).

#### A3-03 · `B2-06-A3-03-COURS-MODELE` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : reconnaître et utiliser un modèle exponentiel »
- Page 1 sur 2 : à pas constant, des rapports constants signent un modèle exponentiel ; calculer
  f(x), puis résoudre f(x) = s par ln ; exemple pour débuter (500e^(−0,1x)) ; méthode et pièges.

#### A3-04 · `B2-06-A3-04-COURS-AJUSTEMENT` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : ajuster par z = ln y »
- Page 2 sur 2 : calculer z = ln y, ajuster z = αx + β par les moindres carrés, revenir à
  y = e^β × e^(αx) ; au tableur, `LN`, `PENTE`, `ORDONNEE.ORIGINE`, `EXP` ; au CCF, le changement
  de variable est donné.

#### A3-05 · `B2-06-A3-05-EXEMPLE-AJUSTEMENT` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : quatre relevés et z = ln y »
- Rapports successifs, logarithmes, droite d'ajustement de z, retour au modèle 50e^(0,2x),
  prévision.

#### A3-06 · `B2-06-A3-06-TABLEAU-LOGARITHMES` — 8 min · `fp-table-build` · séance

- Titre public : « Exercice 5 — Le changement de variable z = ln y »
- Temps : réflexion 1 min · travail 5 min · correction 2 min sur place.
- Six prix de gros et leurs demandes donnés : saisir z = ln y au millième pour chaque prix. Piège :
  `log-decimal-au-lieu-de-ln`.

#### A3-07 · `B2-06-A3-07-ATELIER-DEMANDE` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 6 — Le modèle de la demande »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, question par question sur place.
- `b2-06-a3-coefficient` (vote) : le coefficient a tiré de z = −0,05x + 8 ; pièges
  `ordonnee-non-exponentiee`, `pente-ordonnee-inversees`.
- `b2-06-a3-demande` : demande au prix de 38 € avec y = 2 981e^(−0,05x) ; pièges
  `k-confondu-avec-taux`, `signe-de-k-ignore`.
- `b2-06-a3-methode` (vote) : l'équation qui donne le prix pour 600 sacs ; pièges
  `seuil-par-division`, `ln-produit-en-produit`.
- `b2-06-a3-prix` : le prix de gros pour une demande de 600 sacs ; pièges `seuil-par-division`,
  `signe-de-k-ignore`.

#### A3-08 · `B2-06-A3-08-DEFI-IA` — 10 min · `fp-challenge` · séance

- Titre public : « Exercice 7 — Corriger l’ajustement d’une IA »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, piste par piste sur place.
- L'IA ajuste la demande par une droite (y = −31x + 1 653, r ≈ −0,985) et en tire une demande
  négative au-delà de 53 €. Pistes justes : les rapports constants, l'ajustement de z = ln y et son
  coefficient de corrélation plus proche de −1, la demande négative qui trahit la droite, la
  prévision par le modèle exponentiel ; piste fausse : un coefficient de −0,98 suffit à valider la
  droite.

#### A3-09 · `B2-06-A3-09-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 3 : modèles exponentiels »
- Puis pause de 15 minutes.

### 3.5 Acte 4 — Mini-situation CCF et clôture (45 min)

#### A4-01 · `B2-06-A4-01-SITUATION-KITS` — 3 min · v2 `table` · catalogue

- Titre public : « Mini-situation CCF : les kits de réparation »
- Dossier : six prix de 10 € à 35 € et la demande mensuelle de kits, prix x en dizaines d'euros et
  demande y en centaines de kits, ajustement par z = ln y, modèle retenu f(x) = 20e^(−0,7x),
  barème sur 10. Mention « Données fictives ».

#### A4-02 · `B2-06-A4-02-TABLEUR-KITS` — 16 min · `fp-sheet` · séance

- Titre public : « Question tableur (3 points sur 10) : ajuster la demande »
- Temps : réflexion 3 min · travail 11 min · correction 2 min sur place.
- Prix en colonne A, demandes en colonne B : z = ln y en colonne C (`=LN(B2)`, recopiée), pente en
  D2 (`=PENTE(C2:C7;A2:A7)`), ordonnée à l'origine en E2 (`=ORDONNEE.ORIGINE(C2:C7;A2:A7)`),
  coefficient a en F2 (`=EXP(E2)`), demande prévue au prix de 40 € en G2 (`=F2*EXP(D2*4)`). Sept
  colonnes, sans colonne vide (QF-28). Dix cellules attendues ; pièges `ajustement-affine-sur-y`,
  `pente-ordonnee-inversees`, `ordonnee-non-exponentiee`, `exponentielle-lue-comme-produit`.

#### A4-03 · `B2-06-A4-03-COFFRE-KITS` — 14 min · `fp-escape` · séance

- Titre public : « Mini-situation : fixer le prix des kits »
- Temps : réflexion 2 min · travail 10 min · correction 2 min sur place, énigme par énigme.
- E1 demande au prix de 25 € (2 points ; `k-confondu-avec-taux`, `signe-de-k-ignore`) ; E2 prix
  pour une demande de 400 kits (2 points ; `seuil-par-division`, `signe-de-k-ignore`) ; E3 premier
  prix entier sous 200 kits (1,5 point ; `seuil-mal-arrondi`, `k-confondu-avec-taux`) ; E4 baisse
  de la demande pour 10 € de plus (1,5 point ; `k-confondu-avec-taux`,
  `coefficient-confondu-avec-taux`).
- Papier : quatre questions rédigées du livret, sans code de coffre.

#### A4-04 · `B2-06-A4-04-RAPPEL` — 6 min · `fp-spaced` · séance

- Titre public : « Rappel : de mémoire, sans vos notes »

#### A4-05 · `B2-06-A4-05-FICHE-MEMO` — 2 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : exponentielle et logarithme »

#### A4-06 · `B2-06-A4-06-BILLET-DE-SORTIE` — 4 min · `fp-exit` · séance

- Titre public : « Billet de sortie : la formule du seuil »

## 4. Mode papier

Le livret étudiant reprend, dans l'ordre des écrans, les traces écrites, les énoncés, les formules
données et un cadre de réponse par question ; il ne contient aucune bonne réponse. Le corrigé
formateur ajoute les réponses, les pièges et le barème. Sans poste, le formateur pilote les
révélations depuis le pupitre ; les votes se font à main levée, les formules s'écrivent sur la
copie, les valeurs se calculent à la calculatrice (touches eˣ et ln) et la colonne des logarithmes
se remplit à la main.

## 5. Contenus

### 5.1 Les valeurs du dossier

Ventes en ligne V(x) = 400e^(0,06x), x en mois depuis janvier 2026 : 400 ; 424,73 ; 451,00 ;
478,89 ; 508,50 ; 539,94 ; 573,33 sacs de x = 0 à x = 6. Coefficient mensuel e^0,06 ≈ 1,0618, soit
un taux de 6,18 % par mois. Avec 1,06⁵ à la place de e^0,3 : 535,29 sacs.

Capacité de 1 000 sacs : 400e^(0,06x) ≥ 1 000 ⇔ x ≥ ln 2,5 ÷ 0,06 ≈ 15,27, premier mois entier 16
(mai 2027). Machine de 18 000 € qui perd 20 % par an, sous 40 % de son prix : 0,8ⁿ ≤ 0,4 ⇔
n ≥ ln 0,4 ÷ ln 0,8 ≈ 4,11, soit 5 ans.

Objectifs de ventes de l'exercice 4, mois exact ln(s ÷ 400) ÷ 0,06 : 3,72 ; 6,76 ; 11,55 ; 15,27 ;
18,31 ; 22,03 pour 500, 600, 800, 1 000, 1 200 et 1 500 sacs.

| Prix de gros x (€) |    20 |    25 |    30 |    35 |    40 |    45 |
| ------------------ | ----: | ----: | ----: | ----: | ----: | ----: |
| Demande y (sacs)   | 1 100 |   860 |   670 |   520 |   410 |   315 |
| z = ln y           | 7,003 | 6,757 | 6,507 | 6,254 | 6,016 | 5,753 |

Ajustement de z en x : z ≈ −0,0499x + 8,0026, arrondi à z = −0,05x + 8 ; a = e⁸ ≈ 2 981, d'où
y ≈ 2 981e^(−0,05x). Demande à 38 € : 445,86 sacs ; prix pour 600 sacs : 32,06 €. L'ajustement
affine de y donne y = −31x + 1 653, négatif dès 53,34 €.

Mini-situation, prix x en dizaines d'euros (1 à 3,5), demande y en centaines de kits : 9,9 ; 7 ;
4,9 ; 3,5 ; 2,4 ; 1,7. Ajustement de z = ln y : pente −0,7061, ordonnée à l'origine 3,0032,
a = e^3,0032 ≈ 20,15. Modèle retenu f(x) = 20e^(−0,7x) : demande à 25 € 347,55 kits ; prix pour
400 kits 22,99 € ; demande sous 200 kits dès 32,89 €, premier prix entier 33 € ; baisse de
50,34 % pour 10 € de plus.

Chaque valeur est recalculée par `b2-06.cours.spec.ts` à partir des seuls paramètres.

### 5.9 Concepts, confusions et remédiations

**Concepts** : `fonction-exponentielle`, `logarithme-neperien`, `resolution-par-logarithme`,
`ajustement-exponentiel` (nouveaux), `tableur`, et les concepts interrogés par le rappel des cours
précédents ou réemployés : `interets-composes`, `suite-geometrique`, `coefficient-multiplicateur`,
`ajustement-affine`, `prevision`.
**Confusions** : quinze, dont neuf nouvelles (`exponentielle-lue-comme-produit`,
`signe-de-k-ignore`, `k-confondu-avec-taux`, `ln-produit-en-produit`, `log-decimal-au-lieu-de-ln`,
`seuil-par-division`, `sens-inegalite-ln-negatif`, `ajustement-affine-sur-y`,
`ordonnee-non-exponentiee`).

| Identifiant                            | Concept                    | Libellé                                                   | Remédiation                     |
| -------------------------------------- | -------------------------- | --------------------------------------------------------- | ------------------------------- |
| `coefficient-confondu-avec-taux`       | coefficient-multiplicateur | Prendre le taux pour le coefficient.                      | B2-06-A1-08-COURS-MODELE-EXP    |
| `interets-simples-au-lieu-de-composes` | interets-composes          | Calculer les intérêts sur le seul capital de départ.      | B2-06-A1-07-COURS-EXPONENTIELLE |
| `nature-de-suite-confondue`            | suite-geometrique          | Confondre « ajouter » et « multiplier ».                  | B2-06-A1-07-COURS-EXPONENTIELLE |
| `exponentielle-lue-comme-produit`      | fonction-exponentielle     | Calculer e^(kx) comme e × k × x.                          | B2-06-A1-07-COURS-EXPONENTIELLE |
| `signe-de-k-ignore`                    | fonction-exponentielle     | Croire qu'une exponentielle croît toujours.               | B2-06-A1-08-COURS-MODELE-EXP    |
| `k-confondu-avec-taux`                 | fonction-exponentielle     | Prendre k pour le taux d'évolution.                       | B2-06-A1-08-COURS-MODELE-EXP    |
| `reference-relative-non-figee`         | tableur                    | Recopier sans figer les cellules des paramètres.          | B2-06-A1-08-COURS-MODELE-EXP    |
| `ln-produit-en-produit`                | logarithme-neperien        | Écrire ln(a × b) = ln a × ln b.                           | B2-06-A2-02-COURS-LOGARITHME    |
| `log-decimal-au-lieu-de-ln`            | logarithme-neperien        | Prendre la touche log pour ln.                            | B2-06-A2-02-COURS-LOGARITHME    |
| `seuil-par-division`                   | resolution-par-logarithme  | Diviser par q au lieu de passer par ln.                   | B2-06-A2-03-COURS-SEUIL         |
| `sens-inegalite-ln-negatif`            | resolution-par-logarithme  | Garder le sens en divisant par ln q négatif.              | B2-06-A2-03-COURS-SEUIL         |
| `seuil-mal-arrondi`                    | prevision                  | Arrondir le seuil à l'entier inférieur.                   | B2-06-A2-03-COURS-SEUIL         |
| `ajustement-affine-sur-y`              | ajustement-exponentiel     | Ajuster y par une droite au lieu de ln y.                 | B2-06-A3-04-COURS-AJUSTEMENT    |
| `ordonnee-non-exponentiee`             | ajustement-exponentiel     | Prendre l'ordonnée à l'origine b pour le coefficient a.   | B2-06-A3-04-COURS-AJUSTEMENT    |
| `pente-ordonnee-inversees`             | ajustement-affine          | Inverser les séries de `PENTE` ou la pente et l'ordonnée. | B2-06-A3-04-COURS-AJUSTEMENT    |

### 5.10 Rappels espacés

Douze rappels : e⁰, sens de 50e^(−0,2x), taux d'un modèle a e^(kx), calcul de 400e^(0,1x),
résolution de eˣ = 7, ln d'un produit, touche ln, seuil 1,1ⁿ ≥ 3, sens qui change avec 0,9ⁿ ≤ 0,5,
premier entier, choix de l'ajustement, retour au coefficient a. Obligatoires : `b2-06-r-seuil` et
`b2-06-r-retour`.

## 6. Moteur de formules

Le cours et la mini-situation demandent `EXP(x)` et `LN(x)`, absentes des cinq premiers cours.
Elles entrent dans les deux moteurs (serveur et poste) : un seul argument, sinon `#VALEUR!` ;
`LN` d'un nombre négatif ou nul rend `#VALEUR!`, là où le tableur affiche `#NOMBRE!`, parce que le
jeu d'erreurs des moteurs est fermé à quatre codes (`#REF!`, `#DIV/0!`, `#NOM?`, `#VALEUR!`) ; une
exponentielle trop grande pour un nombre fini rend aussi `#VALEUR!`. Les vecteurs de formule
partagés entre les deux moteurs couvrent ces cas.

## 8. Médias

### 8.1 Principe

Aucune image : les dossiers sont rendus par `table`, les demandes relevées par `chart`, les feuilles
par `fp-sheet`, la colonne des logarithmes par `fp-table-build`.

### 8.2 Catalogue des médias

Aucun média catalogué.

### 8.3 Sources des données

- Gamme Sillage, ventes en ligne, capacité de l'atelier, étude de prix, machine, kits de
  réparation, exemples guidés : données fictives créées pour ce cours.
- Forme de la mini-situation : sujet CCF type n° 1 de l'académie de Créteil (demande ajustée par
  f(x) = 20e^(−0,7x) au tableur, prix pour une demande de 400), recensé dans
  `docs/programme-bts-cg-maths-officiel.md` ; détail dans `docs/donnees-b2-06-sources.md`.
