# B2-08 · Dérivées composées et fonctions économiques — conception de référence (gabarit v3)

> Cahier des charges du cours B2-08 au gabarit v3 (`docs/cours/cours-gabarit-v3.md`) : une séance de
> 2 h 45 dont 30 minutes de pause, ouverte par un récapitulatif du B2-07 en images déjà servies, puis
> trois notions traitées chacune par un cycle réfléchir → comprendre → s'exercer, puis un rappel
> espacé et la fiche mémo. Ce document ne contient aucun code exécutable ; toute divergence
> d'implémentation est un défaut de l'implémentation. Les tests `b2-08.cours.spec.ts` relisent ce
> document : § 3.1, titres publics du § 3, § 5.9, § 8.2.

| Rubrique    | Valeur                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| Date        | 13 novembre 2026                                                                                                       |
| Statut      | **Référence pédagogique** : huitième cours du plan v3                                                                  |
| Cours       | `b2-08-derivees-composees-fonctions-economiques`                                                                       |
| Gabarit     | `v3`, déclaré par le contenu et contrôlé par les règles `gabarit-*` de `verifierStructure`                             |
| Titre servi | « Dérivées composées et fonctions économiques »                                                                        |
| Durée       | **135 minutes exactes** (somme des écrans), 5 actes de 12, 45, 38, 32 et 8 minutes, plus 2 pauses de 15 min hors durée |
| Écrans      | **40**, dont 21 écrans catalogue (8 écrans d'image, 5 graphiques)                                                      |
| Sources     | Programme du BTS CG, module « Fonctions d'une variable réelle » ; cours B2-06 et B2-07 ; données fictives              |

---

## 0. Synthèse des décisions

- **Un récapitulatif de 12 minutes en images déjà servies** (décision de Tim du 13 novembre 2026,
  « récap images ciblé »). Cinq écrans d'image du B2-07 (vélo, recette des puissances, boule de
  neige, panneau, sommet) reprennent la dérivée, puis un vote non noté de deux questions la vérifie
  (une brique `fp-vote` porte deux questions au plus).
  Les PNG sont ceux du B2-07, servis depuis `/assets/cours/b2-07/v1/` ; aucun nouveau fichier.
- **Ce qui se dessine se code** (décision de Tim du 13 novembre 2026 : « choisir la meilleure
  solution pour chaque cas »). Les courbes sont des graphiques `fp-plot`, au catalogue : la tangente
  à la courbe du coût avec un curseur q, le coût moyen et le coût marginal, l'offre et la demande, la
  droite y = k avec un curseur k, une courbe logistique. Les images PNG restent aux métaphores : le
  potager, les engrenages, le nombre secret.
- **Les graphiques tracent les exemples du cours, jamais un exercice** : leurs nombres ne donnent
  aucune réponse ni aucun piège (contrôlé au centième par la spec du cours).
- **Trois notions** : dériver un produit, un quotient, e^u et ln u, à la main ou au calcul formel
  (N1) ; coût total, coût moyen, coût marginal, recette, offre, demande et prix d'équilibre (N2) ;
  le nombre de solutions de f(x) = k et une valeur approchée par balayage ou dichotomie, sur le
  modèle A / (1 + a e^(−bt)) (N3).
- **Aucune limite, aucune asymptote** : la courbe logistique « monte toujours et reste sous A ».

## 1. Objectifs d'apprentissage et public

### 1.1 Rattachement au programme officiel

Module « Fonctions d'une variable réelle » : dérivée d'un produit, d'un quotient, de e^u et de
ln u ; usage d'un logiciel de calcul formel ; coût total, coût moyen, coût marginal, recette,
fonctions d'offre et de demande, prix d'équilibre ; nombre de solutions d'une équation f(x) = k sur
un intervalle où f est strictement monotone, valeur approchée par balayage ou par dichotomie.

### 1.2 Objectifs du cours

À la fin de la séance, l'étudiant sait :

1. dériver un produit et un quotient avec (uv)′ = u′v + uv′ et (u/v)′ = (u′v − uv′)/v² ;
2. dériver e^u et ln u, et vérifier à la main une sortie de calcul formel ;
3. calculer un coût moyen et lire le coût marginal comme C′(q) ; trouver le minimum du coût moyen ;
4. écrire une recette R(p) = p × D(p), trouver un prix d'équilibre et une recette maximale ;
5. justifier qu'une équation f(x) = k a une seule solution par le tableau de variation ;
6. en donner une valeur approchée par balayage au tableur ou par dichotomie.

### 1.3 Acquis des cours précédents

| Cours | Savoirs installés                                  | Réemploi dans le B2-08                                      |
| ----- | -------------------------------------------------- | ----------------------------------------------------------- |
| B2-04 | Algorithme de seuil, boucle « Tant que »           | La dichotomie répète une coupe tant que l'écart est grand   |
| B2-06 | Modèle a e^(kx), ln, seuil par ln                  | Prix d'équilibre par ln ; modèle logistique                 |
| B2-07 | Dérivée, signe de la dérivée, tableau de variation | Récapitulatif ; minimum du coût moyen ; nombre de solutions |

### 1.4 Public et conditions

BTS CG 2e année, 25 étudiants au plus, calculatrice autorisée, un poste par étudiant ou le livret
papier. Séance de 2 h 45 : 135 minutes de travail, pause de 15 minutes après l'acte 2 et après
l'acte 3.

## 2. Architecture

### 2.1 Les cinq actes

| Acte | Rôle                                               | Notion | Minutes |
| ---- | -------------------------------------------------- | ------ | ------: |
| 1    | Avant les dérivées composées : le B2-07, en images | —      |      12 |
| 2    | Dériver un produit, un quotient, e^u et ln u       | N1     |      45 |
| 3    | Coûts, recette, offre, demande et prix d'équilibre | N2     |      38 |
| 4    | Solutions de f(x) = k, balayage et dichotomie      | N3     |      32 |
| 5    | Rappel et fiche mémo                               | —      |       8 |

Pause 1 (15 min) après le jalon A2-11 ; pause 2 (15 min) après le jalon A3-11.

### 2.2 Les écrans d'image et les graphiques

Huit écrans d'image d'une minute, brique `moteur.pourComprendreDans(dossier)` (rendu v2
`image-left`), diffusés au catalogue, au format du B2-07 : le titre, une phrase qui décrit l'image
sans mot du cours, la règle « En maths, on écrit : … », puis trois ou quatre correspondances
« élément de l'image → ce qu'il est dans le cours ». Cinq réemploient les images du B2-07, trois sont
nouvelles (`illustrations-b2-08/prompts.md`).

Cinq graphiques `fp-plot` d'une minute, au catalogue, sans référence : le livret imprime leur réglage
par défaut. Chaque axe des abscisses a une longueur multiple de 24, et chaque position d'un curseur
d'abscisse tombe sur un des 25 jalons calculés. Ils tracent les exemples du cours.

### 2.3 Le cycle d'une notion

Chaque notion suit : **Réfléchir** (mission ou vote non noté) → écrans d'image ou graphiques →
**Comprendre** (une trace écrite v2 `lesson` de 2 minutes, parfois suivie d'un exemple guidé
`fp-worked`) → **S'exercer** (exercices notés corrigés sur place). N1 et N2 tiennent chacune deux
cycles. Chaque exercice annonce ses temps dans les notes formateur, sous la forme
`• Temps : réflexion N min · travail N min · correction N min`, dont la somme est la durée de l'écran.

### 2.4 Règles de structure

40 écrans ≤ 40, 135 minutes ≤ 180. Exposition continue de 5 minutes au plus : deux graphiques, une
image et une trace écrite à l'acte 4.

### 2.5 Diffusion

Catalogue : l'accroche, les huit écrans d'image, le dossier, les cinq graphiques, les cinq traces
écrites et la fiche mémo. Tout le reste est servi en séance.

### 2.6 Notation

f′ s'écrit avec le signe prime U+2032 (f′(x), C′(q)), jamais avec une apostrophe. Exponentielles en
notation e^(kx), e^u. Coût moyen CM, coût marginal Cm. Intervalles fermés [0 ; 20].

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B2-08-A{acte}-{rang}-{SLUG}`, conformes à `^B2-08-A[1-6]-\d{2}-[A-Z0-9-]+$`.
« I » = interactif. « Q » = questions fermées notées portées par l'écran.

| Rang | Identifiant                        | Min | Brique · rendu               |  I  |   Q | Diffusion |
| ---: | ---------------------------------- | --: | ---------------------------- | :-: | --: | --------- |
|    1 | B2-08-A1-01-ACCROCHE               |   1 | `fp-story` · v2 `hero`       |     |   0 | catalogue |
|    2 | B2-08-A1-02-ENFANT-PENTE           |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    3 | B2-08-A1-03-ENFANT-RECETTE         |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    4 | B2-08-A1-04-ENFANT-BOULE           |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    5 | B2-08-A1-05-VOTE-DERIVEE           |   6 | `fp-vote`                    |  I  |   0 | seance    |
|    6 | B2-08-A1-06-ENFANT-PANNEAU         |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    7 | B2-08-A1-07-ENFANT-SOMMET          |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    8 | B2-08-A2-01-DOSSIER                |   2 | `fp-story` · v2 `table`      |     |   0 | catalogue |
|    9 | B2-08-A2-02-MISSION                |   6 | `fp-pro`                     |  I  |   0 | seance    |
|   10 | B2-08-A2-03-ENFANT-POTAGER         |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   11 | B2-08-A2-04-COURS-PRODUIT-QUOTIENT |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   12 | B2-08-A2-05-EXEMPLE-PRODUIT        |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   13 | B2-08-A2-06-ATELIER-PRODUIT        |  10 | `questionnaire`              |  I  |   4 | seance    |
|   14 | B2-08-A2-07-VOTE-COMPOSEE          |   4 | `fp-vote`                    |  I  |   0 | seance    |
|   15 | B2-08-A2-08-ENFANT-ENGRENAGES      |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   16 | B2-08-A2-09-COURS-EXP-LN           |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   17 | B2-08-A2-10-ATELIER-COMPOSEES      |  10 | `questionnaire`              |  I  |   4 | seance    |
|   18 | B2-08-A2-11-JALON                  |   1 | `fp-pulse`                   |     |   0 | seance    |
|   19 | B2-08-A3-01-VOTE-MARGINAL          |   4 | `fp-vote`                    |  I  |   0 | seance    |
|   20 | B2-08-A3-02-GRAPHE-TANGENTE        |   1 | `fp-plot`                    |     |   0 | catalogue |
|   21 | B2-08-A3-03-GRAPHE-COUT-MOYEN      |   1 | `fp-plot`                    |     |   0 | catalogue |
|   22 | B2-08-A3-04-COURS-COUTS            |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   23 | B2-08-A3-05-EXEMPLE-COUTS          |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   24 | B2-08-A3-06-ATELIER-COUTS          |   8 | `questionnaire`              |  I  |   3 | seance    |
|   25 | B2-08-A3-07-VOTE-MARCHE            |   4 | `fp-vote`                    |  I  |   0 | seance    |
|   26 | B2-08-A3-08-GRAPHE-MARCHE          |   1 | `fp-plot`                    |     |   0 | catalogue |
|   27 | B2-08-A3-09-COURS-MARCHE           |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   28 | B2-08-A3-10-ATELIER-MARCHE         |   8 | `questionnaire`              |  I  |   3 | seance    |
|   29 | B2-08-A3-11-JALON                  |   1 | `fp-pulse`                   |     |   0 | seance    |
|   30 | B2-08-A4-01-VOTE-SOLUTIONS         |   4 | `fp-vote`                    |  I  |   0 | seance    |
|   31 | B2-08-A4-02-GRAPHE-DROITE-K        |   1 | `fp-plot`                    |     |   0 | catalogue |
|   32 | B2-08-A4-03-GRAPHE-LOGISTIQUE      |   1 | `fp-plot`                    |     |   0 | catalogue |
|   33 | B2-08-A4-04-ENFANT-NOMBRE-SECRET   |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   34 | B2-08-A4-05-COURS-SOLUTIONS        |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   35 | B2-08-A4-06-EXEMPLE-DICHOTOMIE     |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   36 | B2-08-A4-07-ATELIER-SOLUTIONS      |   8 | `questionnaire`              |  I  |   4 | seance    |
|   37 | B2-08-A4-08-TABLEUR-BALAYAGE       |   8 | `fp-sheet`                   |  I  |   0 | seance    |
|   38 | B2-08-A4-09-JALON                  |   1 | `fp-pulse`                   |     |   0 | seance    |
|   39 | B2-08-A5-01-RAPPEL                 |   6 | `fp-spaced`                  |  I  |   0 | seance    |
|   40 | B2-08-A5-02-FICHE-MEMO             |   2 | `fp-story` · v2 `grid`       |     |   0 | catalogue |

Rythme : 104 minutes interactives, 31 d'exposition, exposition continue de 5 minutes au plus.

### 3.2 Acte 1 — Avant les dérivées composées : le B2-07, en images (12 min)

#### A1-01 · `B2-08-A1-01-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Dérivées composées et fonctions économiques : coûts, marché, solutions »
- Gravure de fond : page de titre des « Recherches sur les principes mathématiques de la théorie des
  richesses », Antoine-Augustin Cournot, 1838, premier livre à écrire la demande comme une fonction
  du prix (M9).

#### A1-02 · `B2-08-A1-02-ENFANT-PENTE` — 1 min · v2 `image-left` · catalogue

- Titre public : « La pente sous le vélo »
- Image du B2-07 (M1). Règle : f′(a) est la pente de la courbe au point d'abscisse a.

#### A1-03 · `B2-08-A1-03-ENFANT-RECETTE` — 1 min · v2 `image-left` · catalogue

- Titre public : « La recette des puissances »
- Image du B2-07 (M2). Règle : (xⁿ)′ = n xⁿ⁻¹, (k)′ = 0, (u + v)′ = u′ + v′.

#### A1-04 · `B2-08-A1-04-ENFANT-BOULE` — 1 min · v2 `image-left` · catalogue

- Titre public : « La boule de neige »
- Image du B2-07 (M3). Règle : (a e^(kx))′ = a k e^(kx), du signe de a × k.

#### A1-05 · `B2-08-A1-05-VOTE-DERIVEE` — 6 min · `fp-vote` · séance

- Titre public : « Vote : la dérivée du cours 7, deux questions »
- Deux votes non notés : la dérivée de 300e^(−0,5x) (`derivee-de-l-exponentielle-sans-k`) ;
  f′(4) = 0 suffit-il pour un extremum (`extremum-sans-changement-de-signe`). La dérivée de
  5x³ − 2x + 7 se fait à main levée avant la révélation, sans remédiation : aucune question ne la note.

#### A1-06 · `B2-08-A1-06-ENFANT-PANNEAU` — 1 min · v2 `image-left` · catalogue

- Titre public : « Le panneau de la route »
- Image du B2-07 (M4). Règle : f′ > 0 sur I ⇒ f croissante ; f′ < 0 sur I ⇒ f décroissante.

#### A1-07 · `B2-08-A1-07-ENFANT-SOMMET` — 1 min · v2 `image-left` · catalogue

- Titre public : « Le sommet de la colline »
- Image du B2-07 (M5). Règle : f′ s'annule en changeant de signe : extremum.

### 3.3 Acte 2 — Dériver un produit, un quotient, e^u et ln u (45 min)

#### A2-01 · `B2-08-A2-01-DOSSIER` — 2 min · v2 `table` · catalogue

- Titre public : « Le dossier de la voile Brise »
- Atelier Rivage lance la voile d'initiation Brise, un sac en toile recyclée, une lettre
  d'information. Trois questions d'Hélène Garnier : combien produire, à quel prix vendre, quand
  atteindre 2 500 abonnés. Mention « Données fictives ».

#### A2-02 · `B2-08-A2-02-MISSION` — 6 min · `fp-pro` · séance

- Titre public : « Votre mission : coûts, prix et abonnés »
- Courriel d'Hélène Garnier, trois questions libres : le temps « réfléchir » de N1.

#### A2-03 · `B2-08-A2-03-ENFANT-POTAGER` — 1 min · v2 `image-left` · catalogue

- Titre public : « Le potager qui s’agrandit »
- Image nouvelle (M6) : un potager rectangulaire qui s'allonge et s'élargit ; la surface gagnée est
  faite de deux bandes. Règle : (uv)′ = u′v + uv′.

#### A2-04 · `B2-08-A2-04-COURS-PRODUIT-QUOTIENT` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : dériver un produit et un quotient »
- (uv)′ = u′v + uv′ ; (u/v)′ = (u′v − uv′)/v² ; exemples x e^(2x) et x/(x + 1) ; pièges.

#### A2-05 · `B2-08-A2-05-EXEMPLE-PRODUIT` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : un produit avec une exponentielle »
- k(x) = (x² − 4)e^(0,5x) : u, v, u′, v′, k′(x) = (0,5x² + 2x − 2)e^(0,5x), k′(0) = −2.

#### A2-06 · `B2-08-A2-06-ATELIER-PRODUIT` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 1 — Produits et quotients »
- Temps : réflexion 2 min · travail 6 min · correction 2 min.
- `b2-08-a2-produit` (vote) : la dérivée de (3x − 2)e^(0,5x) ; piège `produit-derive-terme-a-terme`.
- `b2-08-a2-produit-valeur` : f′(2) ≈ 13,59 ; pièges `produit-derive-terme-a-terme` (1,5e ≈ 4,08),
  `valeur-et-pente-confondues` (f(2) = 4e ≈ 10,87).
- `b2-08-a2-quotient` (vote) : la dérivée de (2x + 1)/(x + 3) ; pièges `quotient-signe-inverse`,
  `quotient-sans-carre`.
- `b2-08-a2-quotient-valeur` : g′(1) = 5/16 ≈ 0,31 ; pièges `quotient-signe-inverse` (−0,31),
  `quotient-sans-carre` (1,25), `valeur-et-pente-confondues` (g(1) = 0,75).

#### A2-07 · `B2-08-A2-07-VOTE-COMPOSEE` — 4 min · `fp-vote` · séance

- Titre public : « Vote : dériver e^u et ln u »
- Deux votes non notés : la dérivée de e^(x²) (`u-prime-oublie` : x² n'a pas de k) ; celle de
  ln(3x) (`u-prime-oublie`).

#### A2-08 · `B2-08-A2-08-ENFANT-ENGRENAGES` — 1 min · v2 `image-left` · catalogue

- Titre public : « Les deux engrenages »
- Image nouvelle (M7) : une manivelle entraîne une petite roue, qui entraîne la grande. Règle :
  (e^u)′ = u′e^u et (ln u)′ = u′/u.

#### A2-09 · `B2-08-A2-09-COURS-EXP-LN` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : dériver e^u et ln u »
- (e^u)′ = u′e^u ; (ln u)′ = u′/u pour u > 0 ; exemples ; quand l'expression est longue, le
  calcul formel, dont on vérifie la sortie à la main sur une valeur.

#### A2-10 · `B2-08-A2-10-ATELIER-COMPOSEES` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 2 — e^u, ln u et calcul formel »
- Temps : réflexion 2 min · travail 6 min · correction 2 min.
- `b2-08-a2-exp-u` (vote) : la dérivée de e^(x² − 3x) ; piège `u-prime-oublie`.
- `b2-08-a2-ln-valeur` : h′(3) = 6/14 ≈ 0,43 pour h(x) = ln(x² + 5) ; pièges `u-prime-oublie`
  (1/14 ≈ 0,07), `valeur-et-pente-confondues` (ln 14 ≈ 2,64).
- `b2-08-a2-calcul-formel` (vote) : un logiciel de calcul formel affiche f′(x) = −(x − 1)²e^(−x)
  pour f(x) = (x² + 1)e^(−x) ; le sens de f ; piège `extremum-sans-changement-de-signe`.
- `b2-08-a2-calcul-formel-valeur` : f′(2) = −e^(−2) ≈ −0,14 ; piège `valeur-et-pente-confondues`
  (f(2) ≈ 0,68).

#### A2-11 · `B2-08-A2-11-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 1 : les dérivées »
- Puis pause de 15 minutes.

### 3.4 Acte 3 — Coûts, recette, offre, demande et prix d'équilibre (38 min)

#### A3-01 · `B2-08-A3-01-VOTE-MARGINAL` — 4 min · `fp-vote` · séance

- Titre public : « Vote : que coûte une unité de plus ? »
- Deux votes non notés (`cout-moyen-et-marginal-confondus`, `valeur-et-pente-confondues`).

#### A3-02 · `B2-08-A3-02-GRAPHE-TANGENTE` — 1 min · `fp-plot` · catalogue

- Titre public : « Le coût marginal, pente de la courbe du coût »
- Exemple de cours C(q) = q³/12 − 1,5q² + 20q + 72 sur [0 ; 24], tangente au point d'abscisse q
  (curseur de 0 à 24, pas de 1). La description fait lire C′(12) = 20.

#### A3-03 · `B2-08-A3-03-GRAPHE-COUT-MOYEN` — 1 min · `fp-plot` · catalogue

- Titre public : « Coût moyen et coût marginal se croisent »
- CM(q) = C(q) ÷ q et Cm(q) = C′(q) sur [1 ; 25] : ils se croisent en q = 12, au minimum de CM, 20.

#### A3-04 · `B2-08-A3-04-COURS-COUTS` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : coût total, coût moyen, coût marginal »
- CT = C(q) ; CM(q) = C(q) ÷ q ; Cm(q) ≈ C′(q) ; CM minimal là où CM′ s'annule, où CM = Cm.

#### A3-05 · `B2-08-A3-05-EXEMPLE-COUTS` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : le minimum du coût moyen »
- L'exemple du graphique : CM′(q) = (q³/6 − 1,5q² − 72)/q², nul en q = 12, minimum CM(12) = 20.

#### A3-06 · `B2-08-A3-06-ATELIER-COUTS` — 8 min · `questionnaire` · séance

- Titre public : « Exercice 3 — Les coûts de la voile Brise »
- Temps : réflexion 1 min · travail 5 min · correction 2 min.
- C(q) = q³ − 6q² + 20q + 100 centaines d'euros pour q dizaines de voiles, q de 1 à 8. Aucun
  coefficient de la consigne n'égale une réponse.
- `b2-08-a3-cout-marginal` : Cm(3) = C′(3) = 11 ; piège `cout-moyen-et-marginal-confondus`
  (CM(3) ≈ 44,33).
- `b2-08-a3-minimum-cout-moyen` (vote) : CM minimal en q = 5 ; piège
  `cout-moyen-et-marginal-confondus` (q = 2, minimum du coût marginal).
- `b2-08-a3-cout-moyen-minimal` : CM(5) = 35 ; pièges `abscisse-pour-extremum` (5),
  `cout-moyen-et-marginal-confondus` (Cm(2) = 8).

#### A3-07 · `B2-08-A3-07-VOTE-MARCHE` — 4 min · `fp-vote` · séance

- Titre public : « Vote : recette et équilibre du marché »
- Deux votes non notés (`recette-sans-prix`, `seuil-par-division`).

#### A3-08 · `B2-08-A3-08-GRAPHE-MARCHE` — 1 min · `fp-plot` · catalogue

- Titre public : « L’offre et la demande se croisent »
- Exemple de cours D(p) = 600e^(−0,05p), O(p) = 150e^(0,03p) sur [0 ; 48] : équilibre vers 17,33 €.

#### A3-09 · `B2-08-A3-09-COURS-MARCHE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : recette, offre, demande et prix d’équilibre »
- R(p) = p × D(p) ; demande décroissante, offre croissante ; équilibre D(p) = O(p), résolu par ln.

#### A3-10 · `B2-08-A3-10-ATELIER-MARCHE` — 8 min · `questionnaire` · séance

- Titre public : « Exercice 4 — Le prix du sac Bordée »
- Temps : réflexion 1 min · travail 5 min · correction 2 min.
- D(p) = 900e^(−0,04p) et O(p) = 100e^(0,05p) sacs par mois, p en euros.
- `b2-08-a3-prix-equilibre` : ln 9 ÷ 0,09 ≈ 24,41 € ; piège `signe-de-k-ignore` (ln 9 ÷ 0,01).
- `b2-08-a3-recette-derivee` (vote) : R′(p) = 900e^(−0,04p)(1 − 0,04p) ; piège
  `produit-derive-terme-a-terme`.
- `b2-08-a3-recette-maximale` : R(25) ≈ 8 277 € ; pièges `abscisse-pour-extremum` (25),
  `recette-sans-prix` (D(25) ≈ 331).

#### A3-11 · `B2-08-A3-11-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : les fonctions économiques »
- Puis pause de 15 minutes.

### 3.5 Acte 4 — Solutions de f(x) = k, balayage et dichotomie (32 min)

#### A4-01 · `B2-08-A4-01-VOTE-SOLUTIONS` — 4 min · `fp-vote` · séance

- Titre public : « Vote : combien de solutions, et où ? »
- Deux votes non notés (`nombre-de-solutions-sans-variations`, `balayage-mal-encadre`).

#### A4-02 · `B2-08-A4-02-GRAPHE-DROITE-K` — 1 min · `fp-plot` · catalogue

- Titre public : « La droite y = k coupe la courbe »
- Exemple g(x) = 20x e^(−0,1x) sur [0 ; 48] et la droite y = k, curseur k de 0 à 80 : deux
  rencontres sous le sommet 73,58, une au sommet, aucune au-dessus.

#### A4-03 · `B2-08-A4-03-GRAPHE-LOGISTIQUE` — 1 min · `fp-plot` · catalogue

- Titre public : « Une courbe qui monte toujours »
- Exemple L(t) = 1 000/(1 + 9e^(−0,3t)) sur [0 ; 24] et la droite y = k : une seule rencontre.

#### A4-04 · `B2-08-A4-04-ENFANT-NOMBRE-SECRET` — 1 min · v2 `image-left` · catalogue

- Titre public : « Le nombre secret »
- Image nouvelle (M8) : deviner un nombre entre 1 et 100 en coupant à chaque fois la plage en deux.
  Règle : la dichotomie garde la moitié où f(x) − k change de signe.

#### A4-05 · `B2-08-A4-05-COURS-SOLUTIONS` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : résoudre f(x) = k, balayage et dichotomie »
- f strictement monotone sur [a ; b] et k entre f(a) et f(b) : une seule solution ; balayage au pas
  1 puis 0,1 ; dichotomie ; exemple L(t) = 600.

#### A4-06 · `B2-08-A4-06-EXEMPLE-DICHOTOMIE` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : couper en deux »
- L(t) = 700 sur [0 ; 24] : milieux 12, 6, 9, 10,5, puis l'encadrement [9 ; 10,5].

#### A4-07 · `B2-08-A4-07-ATELIER-SOLUTIONS` — 8 min · `questionnaire` · séance

- Titre public : « Exercice 5 — Quand atteindra-t-on 2 500 abonnés ? »
- Temps : réflexion 1 min · travail 5 min · correction 2 min.
- N(t) = 3 000 / (1 + 29e^(−0,5t)) abonnés au mois t, t de 0 à 20.
- `b2-08-a4-nombre-solutions` (vote) : une seule solution ; piège `nombre-de-solutions-sans-variations`.
- `b2-08-a4-moitie` (vote) : la première moitié gardée, [0 ; 10] ; piège `dichotomie-mauvaise-moitie`.
- `b2-08-a4-dichotomie` : le quatrième milieu, 8,75 ; piège `dichotomie-mauvaise-moitie` (6,25).
- `b2-08-a4-valeur-approchee` : 9,9 au dixième par défaut ; piège `balayage-mal-encadre` (10).

#### A4-08 · `B2-08-A4-08-TABLEUR-BALAYAGE` — 8 min · `fp-sheet` · séance

- Titre public : « Exercice 6 — Le balayage au tableur »
- Temps : réflexion 1 min · travail 5 min · correction 2 min.
- t de 9 à 10 au pas de 0,1 en colonne A, N(t) en colonne B (`=3000/(1+29*EXP(-0,5*A2))`) ; onze
  cellules attendues ; piège `signe-de-k-ignore` (`EXP(0,5*A2)`). La feuille suit l'exercice 5.

#### A4-09 · `B2-08-A4-09-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 3 : les solutions approchées »

### 3.6 Acte 5 — Rappel et fiche mémo (8 min)

#### A5-01 · `B2-08-A5-01-RAPPEL` — 6 min · `fp-spaced` · séance

- Titre public : « Rappel : de mémoire, sans vos notes »

#### A5-02 · `B2-08-A5-02-FICHE-MEMO` — 2 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : dérivées composées et fonctions économiques »

## 4. Mode papier

Le livret reprend, dans l'ordre des écrans, les écrans d'image, les graphiques à leur réglage par
défaut, les traces écrites, les énoncés et un cadre de réponse par question ; il ne contient aucune
bonne réponse. Le balayage se fait à la calculatrice (table de valeurs) ou sur le poste.

## 5. Contenus

### 5.1 Les valeurs des exercices

- Exercice 1 : f(x) = (3x − 2)e^(0,5x), f′(x) = (1,5x + 2)e^(0,5x), f′(2) = 5e ≈ 13,59 ;
  g(x) = (2x + 1)/(x + 3), g′(x) = 5/(x + 3)², g′(1) = 0,3125.
- Exercice 2 : h(x) = ln(x² + 5), h′(3) ≈ 0,43 ; f(x) = (x² + 1)e^(−x), f′(2) = −e^(−2) ≈ −0,14.
- Exercice 3 : C(3) = 133, C(5) = 175 ; C′(q) = 3q² − 12q + 20 ; CM′(q) a le signe de
  2q³ − 6q² − 100 = 2(q − 5)(q² + 2q + 10), nul en 5 ; CM(5) = Cm(5) = 35.
- Exercice 4 : équilibre e^(0,09p) = 9, p = ln 9 ÷ 0,09 ≈ 24,41 ; R′(p) = 900e^(−0,04p)(1 − 0,04p),
  nulle en 25 ; R(25) = 22 500e^(−1) ≈ 8 277,29.
- Exercice 5 : N(t) = 2 500 ⇔ t = 2 ln 145 ≈ 9,95 ; milieux 10, 5, 7,5, 8,75 ; N(9,9) ≈ 2 488,76
  et N(10) ≈ 2 509,62.

Chaque valeur est recalculée par `b2-08.cours.spec.ts` à partir des seuls paramètres.

### 5.2 Les exemples du cours

C(q) = q³/12 − 1,5q² + 20q + 72, C′(12) = 20, CM(12) = 20 ; D(p) = 600e^(−0,05p),
O(p) = 150e^(0,03p), équilibre ln 4 ÷ 0,08 ≈ 17,33 ; g(x) = 20x e^(−0,1x), sommet 200/e ≈ 73,58 en
x = 10 ; L(t) = 1 000/(1 + 9e^(−0,3t)), L(8) ≈ 550,52, L(9) ≈ 623,11, L(t) = 600 en t ≈ 8,68 ;
L(t) = 700 en t ≈ 10,15. Le coefficient 0,3 tient « 0,4 » hors des textes publics.

### 5.9 Concepts, confusions et remédiations

**Concepts** : `derivees-composees`, `fonctions-economiques`, `resolution-approchee` (nouveaux), et
les concepts réemployés `fonction-derivee`, `variations-d-une-fonction`, `optimisation`,
`fonction-exponentielle`, `logarithme-neperien`, `resolution-par-logarithme`, `tableur`.
**Confusions** : quinze, dont neuf nouvelles.

| Identifiant                           | Concept                   | Libellé                                                   | Remédiation                        |
| ------------------------------------- | ------------------------- | --------------------------------------------------------- | ---------------------------------- |
| `valeur-et-pente-confondues`          | fonction-derivee          | Confondre f(a), la valeur, et f′(a), la pente.            | B2-08-A1-02-ENFANT-PENTE           |
| `derivee-de-l-exponentielle-sans-k`   | fonction-derivee          | Dériver e^(kx) sans multiplier par k.                     | B2-08-A1-04-ENFANT-BOULE           |
| `signe-de-k-ignore`                   | fonction-exponentielle    | Perdre le signe de k.                                     | B2-08-A1-04-ENFANT-BOULE           |
| `extremum-sans-changement-de-signe`   | optimisation              | Conclure à un extremum dès que f′ s'annule.               | B2-08-A1-07-ENFANT-SOMMET          |
| `abscisse-pour-extremum`              | optimisation              | Donner le x de l'optimum pour sa valeur, ou l'inverse.    | B2-08-A1-07-ENFANT-SOMMET          |
| `produit-derive-terme-a-terme`        | derivees-composees        | Dériver uv en u′v′.                                       | B2-08-A2-04-COURS-PRODUIT-QUOTIENT |
| `quotient-signe-inverse`              | derivees-composees        | Écrire uv′ − u′v au numérateur.                           | B2-08-A2-04-COURS-PRODUIT-QUOTIENT |
| `quotient-sans-carre`                 | derivees-composees        | Oublier le carré du dénominateur.                         | B2-08-A2-04-COURS-PRODUIT-QUOTIENT |
| `u-prime-oublie`                      | derivees-composees        | Dériver e^u en e^u ou ln u en 1/u, sans u′.               | B2-08-A2-09-COURS-EXP-LN           |
| `cout-moyen-et-marginal-confondus`    | fonctions-economiques     | Confondre C(q) ÷ q et C′(q).                              | B2-08-A3-04-COURS-COUTS            |
| `recette-sans-prix`                   | fonctions-economiques     | Prendre la quantité vendue pour la recette.               | B2-08-A3-09-COURS-MARCHE           |
| `seuil-par-division`                  | resolution-par-logarithme | Diviser au lieu de passer par ln.                         | B2-08-A3-09-COURS-MARCHE           |
| `nombre-de-solutions-sans-variations` | resolution-approchee      | Compter les solutions sans regarder le sens de variation. | B2-08-A4-05-COURS-SOLUTIONS        |
| `balayage-mal-encadre`                | resolution-approchee      | Donner la borne du mauvais côté de l'encadrement.         | B2-08-A4-05-COURS-SOLUTIONS        |
| `dichotomie-mauvaise-moitie`          | resolution-approchee      | Garder la moitié où f(x) − k ne change pas de signe.      | B2-08-A4-05-COURS-SOLUTIONS        |

### 5.10 Rappels espacés

Douze rappels : produit, quotient (signe et carré), e^u, ln u, coût marginal, minimum du coût moyen,
recette, équilibre par ln, nombre de solutions, balayage, dichotomie. Obligatoires :
`b2-08-r-produit` et `b2-08-r-solutions`.

## 8. Médias

### 8.1 Principe

Cinq images du B2-07 réemployées telles quelles depuis `/assets/cours/b2-07/v1/`, trois images
nouvelles en style d'album jeunesse, une scène, aucune réponse d'exercice : chaque PNG d'origine
(1 536 × 1 024 px) est converti en WebP et servi depuis `/assets/cours/b2-08/v1/`. Les mini-prompts
sont dans `illustrations-b2-08/prompts.md` (espace de travail). La gravure de l'accroche rejoint
`/assets/cours/gravures/v1/`.

### 8.2 Catalogue des médias

| Id  | Écran | Fichier source (page)                                                                                                              | Original              | Auteur, date                                                                                     | Licence        | Dérivé servi                  | Attribution affichée                                                                                                                            |
| --- | ----- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------ | -------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | A1-02 | production propre du cours                                                                                                         | PNG 1 536 × 1 024 px  | Asili Design, 2026                                                                               | CC BY-SA 4.0   | `velo-sur-la-colline.webp`    | « La pente sous le vélo · Asili Design, 2026 · CC BY-SA 4.0 »                                                                                   |
| M2  | A1-03 | production propre du cours                                                                                                         | PNG 1 536 × 1 024 px  | Asili Design, 2026                                                                               | CC BY-SA 4.0   | `exposant-qui-saute.webp`     | « La recette des puissances · Asili Design, 2026 · CC BY-SA 4.0 »                                                                               |
| M3  | A1-04 | production propre du cours                                                                                                         | PNG 1 536 × 1 024 px  | Asili Design, 2026                                                                               | CC BY-SA 4.0   | `boule-de-neige.webp`         | « La boule de neige · Asili Design, 2026 · CC BY-SA 4.0 »                                                                                       |
| M4  | A1-06 | production propre du cours                                                                                                         | PNG 1 536 × 1 024 px  | Asili Design, 2026                                                                               | CC BY-SA 4.0   | `panneaux-de-la-route.webp`   | « Le panneau de la route · Asili Design, 2026 · CC BY-SA 4.0 »                                                                                  |
| M5  | A1-07 | production propre du cours                                                                                                         | PNG 1 536 × 1 024 px  | Asili Design, 2026                                                                               | CC BY-SA 4.0   | `sommet-de-la-colline.webp`   | « Le sommet de la colline · Asili Design, 2026 · CC BY-SA 4.0 »                                                                                 |
| M6  | A2-03 | production propre du cours                                                                                                         | PNG 1 536 × 1 024 px  | Asili Design, 2026                                                                               | CC BY-SA 4.0   | `potager-qui-s-agrandit.webp` | « Le potager qui s’agrandit · Asili Design, 2026 · CC BY-SA 4.0 »                                                                               |
| M7  | A2-08 | production propre du cours                                                                                                         | PNG 1 536 × 1 024 px  | Asili Design, 2026                                                                               | CC BY-SA 4.0   | `deux-engrenages.webp`        | « Les deux engrenages · Asili Design, 2026 · CC BY-SA 4.0 »                                                                                     |
| M8  | A4-04 | production propre du cours                                                                                                         | PNG 1 536 × 1 024 px  | Asili Design, 2026                                                                               | CC BY-SA 4.0   | `nombre-secret.webp`          | « Le nombre secret · Asili Design, 2026 · CC BY-SA 4.0 »                                                                                        |
| M9  | A1-01 | https://commons.wikimedia.org/wiki/File:Recherches_sur_les_principes_math%C3%A9matiques_de_la_th%C3%A9orie_des_richesses,_1838.jpg | JPEG 1 615 × 1 179 px | Antoine-Augustin Cournot, Recherches sur les principes mathématiques de la théorie des richesses | domaine public | `cournot-richesses-1838.jpg`  | « Antoine-Augustin Cournot, Recherches sur les principes mathématiques de la théorie des richesses, 1838 · Wikimedia Commons (domaine public) » |

### 8.3 Sources des données

- Voile Brise, sac Bordée, abonnés de la lettre d'information, exemples du cours : données fictives
  créées pour ce cours.
- Gravure de l'accroche : Wikimedia Commons, domaine public.
