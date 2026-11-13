# B2-07 · Dérivée et optimisation — conception de référence (gabarit v3)

> Cahier des charges du cours B2-07 au gabarit v3 (`docs/cours/cours-gabarit-v3.md`) : une séance de
> 2 h 45 dont 30 minutes de pause, ouverte par un récapitulatif du B2-06 et de la boucle « Tant que »
> expliqués par des images mises en face du cours, puis trois notions traitées chacune par un cycle réfléchir →
> comprendre → s'exercer, puis un rappel espacé et la fiche mémo. Ce document ne contient aucun code
> exécutable ; toute divergence d'implémentation est un défaut de l'implémentation. Les tests
> `b2-07.cours.spec.ts` relisent ce document : § 3.1, titres publics du § 3, § 5.9, § 8.2.

| Rubrique    | Valeur                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| Date        | 6 novembre 2026                                                                                                           |
| Statut      | **Référence pédagogique** : septième cours du plan v3, sixième au gabarit v3                                              |
| Cours       | `b2-07-derivee-optimisation`                                                                                              |
| Gabarit     | `v3`, déclaré par le contenu et contrôlé par les quatre règles `gabarit-*` de `verifierStructure`                         |
| Titre servi | « Dérivée et optimisation »                                                                                               |
| Durée       | **135 minutes exactes** (somme des écrans), 5 actes de 12, 46, 25, 44 et 8 minutes, plus 2 pauses de 15 min hors durée    |
| Écrans      | **39**, dont 21 écrans catalogue (14 écrans d'image)                                                                      |
| Sources     | Devoir maison « Réviser B2-01 à B2-07 », exercice 7 et son encadré « Méthode » ; fiches B2-04 et B2-06 ; données fictives |

---

## 0. Synthèse des décisions

- **Un récapitulatif de 12 minutes avant la dérivée** (décision de Tim du 6 novembre 2026). Le devoir
  maison a montré que le B2-06 et la boucle « Tant que » ne sont pas acquis. L'acte 1 les reprend en
  sept écrans d'une seule idée chacun : une image du quotidien, une phrase qui la décrit, la règle
  du cours, puis la liste de ce que chaque élément de l'image devient dans le cours (décision de Tim
  du 11 novembre 2026, qui remplace les écrans « comme à cinq ans »). Un vote non noté les vérifie ;
  aucun exercice noté.
- **Une question de gestion : le prix du cabas Escale.** Atelier Rivage lance un cabas en toile de
  voile vendu en ligne. Hélène Garnier doit fixer son prix entre 12 € et 28 € : la demande
  hebdomadaire vaut 360 − 12x cabas, chaque cabas coûte 8 € à fabriquer, et l'atelier n'en coud que
  120 par semaine. Bénéfice B(x) = (x − 8)(360 − 12x) = −12x² + 456x − 2 880.
- **Trois notions** : la dérivée, pente de la courbe, dérivée de e^(kx) comprise (N1) ; le signe de la
  dérivée et le tableau de variation (N2) ; l'extremum, le prix optimal et l'optimum sous contrainte
  (N3). Chaque notion s'ouvre, comme le récapitulatif, sur des écrans d'image placés avant sa trace
  écrite.
- **Périmètre des dérivées** : celui de l'encadré du devoir maison (k, x, x², x³, k × u, u + v), plus
  la dérivée de e^(kx), décidée par Tim le 6 novembre 2026 pour relier le cours au B2-06. Elle entre
  dans N1, comme une recette de plus, et sert deux exercices : la variation des ventes du B2-06 et le
  coût minimal d'un modèle avec exponentielle. Aucune limite, aucune dérivée de produit ni de quotient.
- **Aucune fonction de tableur nouvelle** : la feuille utilise `^` et la recopie vers le bas.

## 1. Objectifs d'apprentissage et public

### 1.1 Rattachement au programme officiel

Module « Fonctions d'une variable réelle » : nombre dérivé et fonction dérivée, dérivées des fonctions
de référence, dont x ↦ e^(kx), et des sommes, sens de variation et signe de la dérivée, extremum,
« exploiter le tableau de variation d'une fonction » ; application à l'optimisation d'un bénéfice ou
d'un coût. La notion de limite n'est pas au programme.

### 1.2 Objectifs du cours

À la fin de la séance, l'étudiant sait :

1. lire un modèle a e^(kx), le défaire par ln, et dire ce que fait une boucle « Tant que » ;
2. dire que f′(a) est la pente de la courbe de f au point d'abscisse a, et la distinguer de f(a) ;
3. calculer f′(x) pour un polynôme de degré 3 au plus et pour a e^(kx) ;
4. étudier le signe de f′(x) et dresser le tableau de variation de f, avec les valeurs aux bornes et
   aux changements de sens ;
5. trouver le maximum ou le minimum d'une fonction sur un intervalle, en comparant les valeurs aux
   bornes et aux extremums ;
6. résoudre un problème d'optimisation de gestion, prix optimal et optimum sous contrainte, et écrire
   le bénéfice et sa dérivée au tableur.

### 1.3 Acquis des six premiers cours

| Cours | Savoirs installés                                                                        | Réemploi dans le B2-07                                                            |
| ----- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| B2-01 | Taux d'évolution, coefficient multiplicateur ; `$`, recopie                              | Coefficient e^k et taux e^k − 1 du récapitulatif                                  |
| B2-02 | Droite d'ajustement, coefficient directeur                                               | La pente d'une droite devient la pente d'une courbe                               |
| B2-03 | Négation, contraire d'une comparaison                                                    | La condition de « Tant que » est le contraire de l'objectif                       |
| B2-04 | Suites géométriques, seuil, boucle « Tant que »                                          | Récapitulatif de la boucle                                                        |
| B2-05 | Intérêts composés                                                                        | Aucun réemploi direct                                                             |
| B2-06 | Modèle a e^(kx), ln, seuil par ln, sens qui change quand on divise par un nombre négatif | Récapitulatif ; dérivée de a e^(kx) ; le sens qui change revient avec −24 et −0,1 |

### 1.4 Public et conditions

BTS CG 2e année, 25 étudiants au plus, calculatrice autorisée, un poste par étudiant ou le livret
papier. Séance de 2 h 45 : 135 minutes de travail, pause de 15 minutes après l'acte 2 et après
l'acte 3.

## 2. Architecture

### 2.1 Les cinq actes

| Acte | Rôle                                                    | Notion | Minutes |
| ---- | ------------------------------------------------------- | ------ | ------: |
| 1    | Avant la dérivée : le B2-06 et la boucle, en images     | —      |      12 |
| 2    | La dérivée, pente de la courbe, et la dérivée de e^(kx) | N1     |      46 |
| 3    | Le signe de la dérivée et les variations                | N2     |      25 |
| 4    | L'extremum et le prix optimal                           | N3     |      44 |
| 5    | Rappel et fiche mémo                                    | —      |       8 |

Pause 1 (15 min) après le jalon A2-12 ; pause 2 (15 min) après le jalon A3-07.

### 2.2 Les écrans d'image

Quatorze écrans d'une minute, brique commune `moteur.pourComprendreDans(dossier)` (rendu v2
`image-left`, la même qu'au B1-03), diffusés au catalogue. Décision de Tim du 11 novembre 2026 :
l'image n'est pas une explication pour enfant, mais un parallèle avec la réalité du cours. Chaque
écran porte une seule idée, toujours dans le même ordre :

1. **le titre**, sans préfixe, qui nomme l'image (« La pente sous le vélo ») ;
2. **l'image et sa phrase** : ce qu'on voit, au ton adulte, sans mot du cours (ni dérivée,
   tangente, exponentielle, logarithme, fonction, suite, boucle, algorithme, extremum, maximum,
   minimum, variation) ; elle peut citer un chiffre ou un signe dessiné (× 1,5 ; 1,609 ; 2x) ;
3. **la règle** : « En maths, on écrit : … », la notation du cours, avec un exemple chiffré qui n'est
   la réponse d'aucun exercice ;
4. **les correspondances** : trois ou quatre lignes « élément de l'image → ce qu'il est dans le
   cours », chacune nommant un élément réellement dessiné.

Le mot « enfant » n'apparaît dans aucun texte servi de ces écrans, hors texte alternatif de l'image.
Les notes formateur portent la consigne commune (« faire décrire l'image, puis faire dire à quoi
correspond chaque élément dans le cours ») et une question de relance propre à l'écran.

Ils ne sont pas des traces écrites : la trace écrite (`lesson`) qui les suit donne la règle complète.
Sept ouvrent le cours (quatre pour l'exponentielle et le logarithme, trois pour la boucle), sept
précèdent les traces écrites des trois notions.

### 2.3 Le cycle d'une notion

Chaque notion suit : **Réfléchir** (mission, vote non noté ou réflexion écrite) → écrans d'image →
**Comprendre** (une trace écrite v2 `lesson` de 2 minutes, parfois suivie d'un exemple guidé
`fp-worked` corrigé étape par étape sur son propre écran) → **S'exercer** (exercices notés corrigés sur
place). N1 tient deux cycles : les polynômes, puis l'exponentielle. Les traces écrites partent de
l'exemple de l'encadré du devoir maison, f(x) = −2x² + 40x + 5.

Chaque exercice annonce ses temps dans les notes formateur, sous la forme
`• Temps : réflexion N min · travail N min · correction N min`, dont la somme est la durée de
l'écran. La correction se dévoile sur l'écran de l'exercice (`correctionSurPlace`).

### 2.4 Règles de structure

39 écrans ≤ 40, 135 minutes ≤ 180, chaque trace écrite précédée d'une réflexion et suivie d'un
exercice, chaque exercice avec ses trois temps et sa correction sur place. Exposition continue de
6 minutes au plus, sans dérogation : le plus long bloc, de l'acte 1 au dossier, fait 5 minutes.

### 2.5 Diffusion

Catalogue : l'accroche, les quatorze écrans d'image, le dossier du cabas Escale, les
quatre traces écrites et la fiche mémo. Tout le reste est servi en séance. Aucun écran catalogue ne
porte une réponse : leurs exemples sont ceux du devoir maison ou des valeurs inédites.

### 2.6 Notation

f′ s'écrit avec le signe prime U+2032 (f′(x), B′(x)), jamais avec une apostrophe. Puissances en
exposants Unicode (x², x³), exposants d'exponentielle en notation e^(kx). Intervalles fermés
[12 ; 28]. Flèches de variation ↗ et ↘.

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B2-07-A{acte}-{rang}-{SLUG}`, conformes à `^B2-07-A[1-6]-\d{2}-[A-Z0-9-]+$`.
« I » = interactif. « Q » = questions fermées notées portées par l'écran.

| Rang | Identifiant                      | Min | Brique · rendu               |  I  |   Q | Diffusion |
| ---: | -------------------------------- | --: | ---------------------------- | :-: | --: | --------- |
|    1 | B2-07-A1-01-ACCROCHE             |   1 | `fp-story` · v2 `hero`       |     |   0 | catalogue |
|    2 | B2-07-A1-02-ENFANT-MULTIPLIER    |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    3 | B2-07-A1-03-ENFANT-A-ET-K        |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    4 | B2-07-A1-04-ENFANT-LN            |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    5 | B2-07-A1-05-ENFANT-SEUIL         |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    6 | B2-07-A1-06-VOTE-EXPONENTIELLE   |   4 | `fp-vote`                    |  I  |   0 | seance    |
|    7 | B2-07-A1-07-ENFANT-BOUCLE        |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    8 | B2-07-A1-08-ENFANT-TANT-QUE      |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    9 | B2-07-A1-09-ENFANT-DEUX-CHEMINS  |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   10 | B2-07-A2-01-DOSSIER              |   2 | `fp-story` · v2 `table`      |     |   0 | catalogue |
|   11 | B2-07-A2-02-MISSION              |   6 | `fp-pro`                     |  I  |   0 | seance    |
|   12 | B2-07-A2-03-ENFANT-PENTE         |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   13 | B2-07-A2-04-ENFANT-RECETTE       |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   14 | B2-07-A2-05-COURS-DERIVEE        |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   15 | B2-07-A2-06-EXEMPLE-DERIVEE      |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   16 | B2-07-A2-07-ATELIER-DERIVEES     |  10 | `questionnaire`              |  I  |   4 | seance    |
|   17 | B2-07-A2-08-VOTE-EXPONENTIELLE   |   4 | `fp-vote`                    |  I  |   0 | seance    |
|   18 | B2-07-A2-09-ENFANT-EXPONENTIELLE |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   19 | B2-07-A2-10-COURS-DERIVEE-EXP    |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   20 | B2-07-A2-11-ATELIER-VENTES       |  10 | `questionnaire`              |  I  |   4 | seance    |
|   21 | B2-07-A2-12-JALON                |   1 | `fp-pulse`                   |     |   0 | seance    |
|   22 | B2-07-A3-01-VOTE-SIGNE           |   4 | `fp-vote`                    |  I  |   0 | seance    |
|   23 | B2-07-A3-02-ENFANT-PANNEAU       |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   24 | B2-07-A3-03-ENFANT-CARTE         |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   25 | B2-07-A3-04-COURS-VARIATIONS     |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   26 | B2-07-A3-05-EXEMPLE-VARIATIONS   |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   27 | B2-07-A3-06-ATELIER-VARIATIONS   |  10 | `questionnaire`              |  I  |   4 | seance    |
|   28 | B2-07-A3-07-JALON                |   1 | `fp-pulse`                   |     |   0 | seance    |
|   29 | B2-07-A4-01-REFLEXION-CAPACITE   |   5 | `fp-story` · v2 `reflection` |  I  |   0 | seance    |
|   30 | B2-07-A4-02-ENFANT-SOMMET        |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   31 | B2-07-A4-03-ENFANT-BORD          |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   32 | B2-07-A4-04-COURS-OPTIMUM        |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   33 | B2-07-A4-05-EXEMPLE-OPTIMUM      |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   34 | B2-07-A4-06-ATELIER-PRIX         |  10 | `questionnaire`              |  I  |   4 | seance    |
|   35 | B2-07-A4-07-TABLEUR-BENEFICE     |   8 | `fp-sheet`                   |  I  |   0 | seance    |
|   36 | B2-07-A4-08-ATELIER-REVISIONS    |  10 | `questionnaire`              |  I  |   4 | seance    |
|   37 | B2-07-A4-09-JALON                |   1 | `fp-pulse`                   |     |   0 | seance    |
|   38 | B2-07-A5-01-RAPPEL               |   6 | `fp-spaced`                  |  I  |   0 | seance    |
|   39 | B2-07-A5-02-FICHE-MEMO           |   2 | `fp-story` · v2 `grid`       |     |   0 | catalogue |

Rythme : 105 minutes interactives, 30 d'exposition, exposition continue de 5 minutes au plus.

### 3.2 Acte 1 — Avant la dérivée : le B2-06 et la boucle, en images (12 min)

#### A1-01 · `B2-07-A1-01-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Dérivée et optimisation : la pente, le sens, le sommet »
- Gravure de fond : première page de « Nova Methodus pro Maximis et Minimis », Leibniz, Acta
  Eruditorum, 1684 (M15). Plan : d'abord comprendre enfin le cours 6, puis trois notions.

#### A1-02 · `B2-07-A1-02-ENFANT-MULTIPLIER` — 1 min · v2 `image-left` · catalogue

- Titre public : « L’exponentielle multiplie »
- Image : une plante une fois et demie plus haute chaque semaine. Correspondances : le pot
  « semaine 0 » → u₀ ou a ; le numéro de la semaine → n ou x ; la flèche × 1,5 → q ou e^k ; la
  hauteur atteinte → uₙ ou f(x). Règle : uₙ = u₀ × qⁿ au B2-04, f(x) = a e^(kx) au B2-06 ; on
  multiplie à chaque pas, on n'ajoute pas ; e^0,4 se calcule « exposant d'abord ».

#### A1-03 · `B2-07-A1-03-ENFANT-A-ET-K` — 1 min · v2 `image-left` · catalogue

- Titre public : « Le départ et la vitesse »
- Image : deux ballons de même taille, l'un qu'on gonfle, l'autre qui se dégonfle. Correspondances :
  la taille commune marquée a → a = f(0) ; le ballon gonflé, k > 0 → f croissante ; le ballon qui se
  dégonfle, k < 0 → f décroissante. Règle : f(0) = a car e⁰ = 1 ; coefficient e^k, taux e^k − 1 ;
  1 000e^(0,02x) : + 2,02 % par unité, pas 2 %.

#### A1-04 · `B2-07-A1-04-ENFANT-LN` — 1 min · v2 `image-left` · catalogue

- Titre public : « ln, le bouton retour »
- Image : une machine qui transforme 1,609 en 5, et son bouton « retour » qui rend 1,609.
  Correspondances : la flèche eˣ → la fonction exponentielle ; le bouton ln → le logarithme
  népérien ; la carte 1,609 → l'exposant x ; la carte 5 → y = eˣ. Règle : eˣ = y ⇔ x = ln y, pour
  y > 0 ; ln défait eˣ comme ÷ défait × ; touche ln, pas log.

#### A1-05 · `B2-07-A1-05-ENFANT-SEUIL` — 1 min · v2 `image-left` · catalogue

- Titre public : « Quand touchera-t-on la fenêtre ? »
- Image : la plante qui monte vers le rebord d'une fenêtre. Correspondances : le rebord, trait 10 →
  le seuil ; la hauteur de la plante → 1,5ⁿ ; le trait 6, que montre le doigt → le plus petit n
  tel que qⁿ ≥ seuil. Règle : 1,5ⁿ ≥ 10 ⇔ n ≥ ln 10 ÷ ln 1,5 ≈ 5,68, donc n = 6, l'entier juste
  au-dessus ; si q < 1, ln q < 0 et le sens change.

#### A1-06 · `B2-07-A1-06-VOTE-EXPONENTIELLE` — 4 min · `fp-vote` · séance

- Titre public : « Vote : l’exponentielle et ln, deux questions »
- Deux votes non notés, révélation commentée : le taux de 1 000e^(−0,05x) par unité
  (`k-confondu-avec-taux`) ; la solution de eˣ = 6 (`seuil-par-division`).

#### A1-07 · `B2-07-A1-07-ENFANT-BOUCLE` — 1 min · v2 `image-left` · catalogue

- Titre public : « La boucle répète »
- Image : on verse de l'eau dans un verre en comptant les tours sur ses doigts, n = 3.
  Correspondances : la flèche qui tourne autour de la cuillère → la boucle ; les doigts levés → le
  compteur n ; l'eau dans le verre → la valeur u. Règle : à chaque tour, n ← n + 1 puis u ← u × q.

#### A1-08 · `B2-07-A1-08-ENFANT-TANT-QUE` — 1 min · v2 `image-left` · catalogue

- Titre public : « Tant que veut dire pas encore »
- Image : tant que l'eau n'atteint pas le trait « plein », on verse encore. Correspondances : le
  trait « plein » → le seuil ; « pas encore… » → la condition u < 1 000 ; « fini ! » → la sortie de
  la boucle, puis Afficher n. Règle : objectif u ≥ 1 000, boucle « Tant que u < 1 000 » ; pour
  descendre sous 500, « Tant que u ≥ 500 » ; après « Tant que », le contraire de l'objectif.

#### A1-09 · `B2-07-A1-09-ENFANT-DEUX-CHEMINS` — 1 min · v2 `image-left` · catalogue

- Titre public : « Deux chemins, le même rang »
- Image : deux chemins vers la même cabane, l'un à petits pas numérotés, l'autre en un saut.
  Correspondances : les pas de 1 à 6 → la boucle « Tant que » ; le saut marqué ln → le calcul par
  ln ; la marche 6 → le premier rang qui dépasse le seuil. Règle : la boucle sur 1,5ⁿ affiche 6 ;
  ln 10 ÷ ln 1,5 ≈ 5,68, arrondi au-dessus, donne 6.

### 3.3 Acte 2 — La dérivée, pente de la courbe (46 min)

#### A2-01 · `B2-07-A2-01-DOSSIER` — 2 min · v2 `table` · catalogue

- Titre public : « Le dossier du cabas Escale »
- Le cabas, la demande hebdomadaire 360 − 12x pour un prix de 12 € à 28 €, le coût de 8 € par cabas,
  la capacité de 120 cabas par semaine, les questions d'Hélène. Mention « Données fictives ».

#### A2-02 · `B2-07-A2-02-MISSION` — 6 min · `fp-pro` · séance

- Titre public : « Votre mission : le meilleur prix du cabas »
- Courriel d'Hélène Garnier. Trois questions libres, temps « réfléchir » de N1 : le prix le plus cher
  rapporte-t-il le plus ; à un prix donné, comment savoir s'il faut monter ou baisser le prix ; avec
  120 cabas au plus, le meilleur prix change-t-il.

#### A2-03 · `B2-07-A2-03-ENFANT-PENTE` — 1 min · v2 `image-left` · catalogue

- Titre public : « La pente sous le vélo »
- Image : un vélo qui monte, roule à plat au sommet, puis descend. Correspondances : le segment sous
  la roue → la tangente ; la montée + → f′(a) > 0 ; le plat 0 → f′(a) = 0 ; la descente − →
  f′(a) < 0. Règle : f′(a) est la pente de la courbe au point d'abscisse a, celle de sa tangente.

#### A2-04 · `B2-07-A2-04-ENFANT-RECETTE` — 1 min · v2 `image-left` · catalogue

- Titre public : « La recette des puissances »
- Image : le petit 2 qui saute du plongeoir devant le x ; un caillou 7 sur un sol plat.
  Correspondances : le 2 qui saute → l'exposant, qui descend en coefficient ; le x resté seul →
  l'exposant diminué de un ; le caillou 7 → une constante, de dérivée nulle. Règle : (x²)′ = 2x,
  (x³)′ = 3x², (x)′ = 1, (k)′ = 0, (k × u)′ = k × u′, (u + v)′ = u′ + v′.

#### A2-05 · `B2-07-A2-05-COURS-DERIVEE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : la dérivée, pente de la courbe »
- Page 1 sur 2 : nombre dérivé f′(a), pente de la tangente ; fonction dérivée ; tableau des dérivées
  de l'encadré ; exemple pour débuter f(x) = −2x² + 40x + 5, f′(x) = −4x + 40, f′(5) = 20 ; au CCF,
  dériver terme à terme, et les pièges.

#### A2-06 · `B2-07-A2-06-EXEMPLE-DERIVEE` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : le coût de découpe »
- K(x) = x³ − 6x² + 15x + 20 : dériver terme à terme, K′(x) = 3x² − 12x + 15, K′(2) = 3, lire la pente
  au point d'abscisse 2. 4 min de réponses, puis 2 min de correction dévoilée étape par étape.

#### A2-07 · `B2-07-A2-07-ATELIER-DERIVEES` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 1 — Dériver »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, question par question sur place.
- `b2-07-a2-carre` (vote) : la dérivée de 4x², 8x ; piège `exposant-non-descendu`.
- `b2-07-a2-cube` : g′(3) pour g(x) = 2x³ − 6x² + 5, 18 ; pièges `exposant-non-descendu` (0),
  `constante-non-annulee` (23), `valeur-et-pente-confondues` (g(3) = 5).
- `b2-07-a2-benefice` (vote) : B′(x) = −24x + 456 ; pièges `constante-non-annulee`,
  `exposant-non-descendu`.
- `b2-07-a2-pente` : B′(15), 96 ; pièges `valeur-et-pente-confondues` (B(15) = 1 260),
  `exposant-non-descendu` (276).

#### A2-08 · `B2-07-A2-08-VOTE-EXPONENTIELLE` — 4 min · `fp-vote` · séance

- Titre public : « Vote : à quelle vitesse croît une exponentielle ? »
- Deux votes non notés (temps « réfléchir » du second cycle de N1) : les ventes 400e^(0,06x) gagnent-
  elles plus de sacs par mois en décembre qu'en janvier (`nature-de-suite-confondue`) ; la dérivée de
  eˣ (`derivee-de-l-exponentielle-sans-k`).

#### A2-09 · `B2-07-A2-09-ENFANT-EXPONENTIELLE` — 1 min · v2 `image-left` · catalogue

- Titre public : « La boule de neige »
- Image : une boule de neige qui roule et grossit. Correspondances : la taille de la boule → la
  valeur a e^(kx) ; la neige ramassée à chaque tour → la dérivée a k e^(kx) ; les traits de vitesse
  → la dérivée, proportionnelle à la valeur. Règle : (e^(kx))′ = k e^(kx), donc
  (a e^(kx))′ = a k e^(kx) ; e^(kx) > 0, le signe de la dérivée est celui de a × k.

#### A2-10 · `B2-07-A2-10-COURS-DERIVEE-EXP` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : dériver a e^(kx) »
- Page 2 sur 2 : (e^(kx))′ = k e^(kx) ; le signe de a k donne le sens, comme au B2-06 ; exemple
  f(x) = 1 000e^(0,02x), f′(x) = 20e^(0,02x) ; somme d'un polynôme et d'une exponentielle ; pièges.

#### A2-11 · `B2-07-A2-11-ATELIER-VENTES` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 2 — La vitesse des ventes du B2-06 »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, question par question sur place.
- V(x) = 400e^(0,06x) sacs vendus en ligne au mois x ; W(x) = 900e^(−0,04x) sacs vendus en boutique.
- `b2-07-a2-derivee-ventes` (vote) : V′(x) = 24e^(0,06x) ; pièges `derivee-de-l-exponentielle-sans-k`,
  `exponentielle-lue-comme-produit`.
- `b2-07-a2-vitesse-juin` : V′(5), 32,40 sacs par mois ; piège `valeur-et-pente-confondues`
  (V(5) ≈ 539,94).
- `b2-07-a2-sens-boutique` (vote) : W′(x) < 0, W décroît ; piège `signe-de-k-ignore`.
- `b2-07-a2-vitesse-boutique` : W′(10), −24,13 sacs par mois ; pièges `signe-de-k-ignore` (24,13),
  `valeur-et-pente-confondues` (W(10) ≈ 603,29).

#### A2-12 · `B2-07-A2-12-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 1 : la dérivée »
- Puis pause de 15 minutes.

### 3.4 Acte 3 — Le signe de la dérivée et les variations (25 min)

#### A3-01 · `B2-07-A3-01-VOTE-SIGNE` — 4 min · `fp-vote` · séance

- Titre public : « Vote : que dit le signe de la pente ? »
- Deux votes non notés (temps « réfléchir » de N2) : B′(15) = 96, que fait le bénéfice si le prix
  monte un peu (`valeur-et-pente-confondues`) ; B′ négative sur un intervalle, que fait B
  (`signe-de-f-pour-variations`).

#### A3-02 · `B2-07-A3-02-ENFANT-PANNEAU` — 1 min · v2 `image-left` · catalogue

- Titre public : « Le panneau de la route »
- Image : des panneaux « ça monte » et « ça descend » au bord d'une route de montagne.
  Correspondances : le panneau vert + → f′ > 0, f croissante ; le panneau rouge − → f′ < 0, f
  décroissante ; l'altitude de la voiture → f(x), que le signe de f′ ne donne pas. Règle : f′ > 0
  sur I ⇒ f croissante sur I ; f′ < 0 sur I ⇒ f décroissante sur I.

#### A3-03 · `B2-07-A3-03-ENFANT-CARTE` — 1 min · v2 `image-left` · catalogue

- Titre public : « La carte du trajet »
- Image : la carte d'une balade, avec les montées, les descentes et l'altitude des points clés.
  Correspondances : départ et arrivée → les bornes, sur la ligne x ; les flèches verte et rouge → la
  ligne des variations ; le drapeau → le x où f′ change de signe ; les étiquettes d'altitude → les
  valeurs de f. Règle : ligne x, ligne signe de f′, ligne des flèches ↗ ↘ avec les valeurs aux bornes
  et aux changements.

#### A3-04 · `B2-07-A3-04-COURS-VARIATIONS` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : signe de la dérivée et tableau de variation »
- Signe de f′ et sens de f ; étudier le signe d'une dérivée affine, en changeant le sens quand on
  divise par un nombre négatif, ou d'un produit de facteurs ; exemple f′(x) = −4x + 40 ≥ 0 ⇔ x ≤ 10 ;
  dresser le tableau.

#### A3-05 · `B2-07-A3-05-EXEMPLE-VARIATIONS` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : une dérivée en deux facteurs »
- f(x) = 2x³ − 21x² + 60x sur [0 ; 7] : f′(x) = 6x² − 42x + 60 = 6(x − 2)(x − 5), signe du produit,
  tableau de variation avec f(0) = 0, f(2) = 52, f(5) = 25, f(7) = 77.

#### A3-06 · `B2-07-A3-06-ATELIER-VARIATIONS` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 3 — Le signe de B′ et les variations »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, question par question sur place.
- `b2-07-a3-signe` (vote) : B′(x) ≥ 0 ⇔ x ≤ 19 ; piège `sens-inegalite-ln-negatif` (x ≥ 19).
- `b2-07-a3-sens` (vote) : sur [19 ; 28], B décroît ; piège `signe-de-f-pour-variations`.
- `b2-07-a3-depart` : B(12), 864 € ; piège `valeur-et-pente-confondues` (B′(12) = 168).
- `b2-07-a3-arrivee` : B(28), 480 € ; piège `valeur-et-pente-confondues` (B′(28) = −216).

#### A3-07 · `B2-07-A3-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : signe et variations »
- Puis pause de 15 minutes.

### 3.5 Acte 4 — L'extremum et le prix optimal (44 min)

#### A4-01 · `B2-07-A4-01-REFLEXION-CAPACITE` — 5 min · v2 `reflection` · séance

- Titre public : « Réfléchir : le sommet est-il atteignable ? »
- B monte jusqu'à 19 €, puis descend. Mais l'atelier ne coud que 120 cabas par semaine, et à 19 € la
  demande dépasse ce nombre. Quel prix proposer, et pourquoi ? Temps « réfléchir » de N3.

#### A4-02 · `B2-07-A4-02-ENFANT-SOMMET` — 1 min · v2 `image-left` · catalogue

- Titre public : « Le sommet de la colline »
- Image : le vélo au sommet, entre la montée et la descente ; plus loin, un replat où la route continue
  de monter. Correspondances : le drapeau « sommet » → un maximum, f′ passe de + à − ; le replat barré
  → f′ = 0 sans changement de signe, pas d'extremum ; la hauteur du drapeau → f(a). Règle : f′
  s'annule en a en passant de + à − : f(a) est un maximum ; de − à + : un minimum.

#### A4-03 · `B2-07-A4-03-ENFANT-BORD` — 1 min · v2 `image-left` · catalogue

- Titre public : « La barrière sur le chemin »
- Image : une barrière ferme le chemin avant le sommet. Correspondances : la barrière → une borne
  fixée par une contrainte ; le drapeau hors d'atteinte → l'extremum hors de l'intervalle permis ;
  « ici » → l'optimum sous contrainte, à la borne. Règle : sur un intervalle, on compare les valeurs
  aux bornes et aux extremums ; sous contrainte, l'optimum peut être une borne.

#### A4-04 · `B2-07-A4-04-COURS-OPTIMUM` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : extremum et optimisation »
- Extremum et changement de signe de f′ ; les quatre étapes de l'encadré ; maximum sur un intervalle ;
  optimum sous contrainte ; exemple f(x) = −2x² + 40x + 5, maximum f(10) = 205 ; au CCF, le x qui
  réalise l'optimum et la valeur de l'optimum.

#### A4-05 · `B2-07-A4-05-EXEMPLE-OPTIMUM` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : sommet ou bord ? »
- La fonction f de l'exemple A3-05 : maximum local 52 en x = 2, mais f(7) = 77 : le maximum sur
  [0 ; 7] est atteint au bord ; sur [0 ; 4], il vaut 52.

#### A4-06 · `B2-07-A4-06-ATELIER-PRIX` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 4 — Le prix optimal du cabas »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, question par question sur place.
- `b2-07-a4-maximum` : le bénéfice maximal, 1 452 € ; pièges `abscisse-pour-extremum` (19),
  `valeur-et-pente-confondues` (B′(19) = 0).
- `b2-07-a4-capacite` (vote) : les prix possibles avec 120 cabas au plus, x ≥ 20 ; piège
  `sens-inegalite-ln-negatif` (x ≤ 20).
- `b2-07-a4-prix` : le prix optimal sous contrainte, 20 € ; pièges `contrainte-ignoree` (19),
  `bornes-oubliees` (28, l'autre borne).
- `b2-07-a4-benefice` : le bénéfice sous contrainte, 1 440 € ; pièges `contrainte-ignoree` (1 452),
  `bornes-oubliees` (B(28) = 480).

#### A4-07 · `B2-07-A4-07-TABLEUR-BENEFICE` — 8 min · `fp-sheet` · séance

- Titre public : « Exercice 5 — Le bénéfice au tableur »
- Temps : réflexion 1 min · travail 5 min · correction 2 min sur place.
- Prix impairs de 13 € à 27 € en colonne A : B(x) en colonne B (`=-12*A2^2+456*A2-2880`), B′(x) en
  colonne C (`=-24*A2+456`), nul sur la ligne de 19 €. Seize cellules attendues ; pièges de la colonne
  C `exposant-non-descendu` (−12x + 456), `constante-non-annulee` (−24x − 2 424),
  `valeur-et-pente-confondues` (B(x)). Des prix pairs feraient valoir B′ ± 24, que le moteur lirait
  dans le littéral −24 de la formule comme une valeur saisie sans formule. La feuille vient après les
  exercices 3 et 4 : sa cellule B(19) ne dévoile aucune réponse encore attendue.

#### A4-08 · `B2-07-A4-08-ATELIER-REVISIONS` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 6 — Espacer les révisions de la surjeteuse »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, question par question sur place.
- Coût annuel d'entretien quand la surjeteuse est révisée toutes les x semaines, x de 2 à 30 :
  C(x) = 50x + 2 000e^(−0,1x).
- `b2-07-a4-derivee-cout` (vote) : C′(x) = 50 − 200e^(−0,1x) ; pièges `signe-de-k-ignore`
  (50 + 200e^(−0,1x)), `derivee-de-l-exponentielle-sans-k` (50 − 2 000e^(−0,1x)).
- `b2-07-a4-signe-cout` (vote) : C′(x) ≥ 0 ⇔ x ≥ −10 ln 0,25 ; piège `sens-inegalite-ln-negatif`
  (x ≤ −10 ln 0,25).
- `b2-07-a4-intervalle` : l'intervalle qui rend le coût minimal, 13,86 semaines ; pièges
  `seuil-par-division` (0,25 ÷ 0,1 = 2,5), `signe-de-k-ignore` (ln 0,25 ÷ 0,1 ≈ −13,86).
- `b2-07-a4-cout-minimal` : le coût minimal, 1 193 € ; pièges `abscisse-pour-extremum` (13,86),
  `valeur-et-pente-confondues` (C′ = 0).

#### A4-09 · `B2-07-A4-09-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 3 : l’optimum »

### 3.6 Acte 5 — Rappel et fiche mémo (8 min)

#### A5-01 · `B2-07-A5-01-RAPPEL` — 6 min · `fp-spaced` · séance

- Titre public : « Rappel : de mémoire, sans vos notes »

#### A5-02 · `B2-07-A5-02-FICHE-MEMO` — 2 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : dérivée et optimisation »

## 4. Mode papier

Le livret étudiant reprend, dans l'ordre des écrans, les écrans d'image, les traces
écrites, les énoncés et un cadre de réponse par question ; il ne contient aucune bonne réponse. Les
formules s'écrivent sur la copie, le tableau de variation se dessine à la main, les exponentielles se
calculent à la touche eˣ.

## 5. Contenus

### 5.1 Les valeurs du dossier

Cabas Escale, prix x en euros sur [12 ; 28] : demande 360 − 12x cabas par semaine, coût 8 € par
cabas, bénéfice B(x) = (x − 8)(360 − 12x) = −12x² + 456x − 2 880, B′(x) = −24x + 456.

| x (€) |  12 |    14 |    16 |    18 |    20 |    22 |    24 |   26 |   28 |
| ----- | --: | ----: | ----: | ----: | ----: | ----: | ----: | ---: | ---: |
| B(x)  | 864 | 1 152 | 1 344 | 1 440 | 1 440 | 1 344 | 1 152 |  864 |  480 |
| B′(x) | 168 |   120 |    72 |    24 |   −24 |   −72 |  −120 | −168 | −216 |

B′(x) ≥ 0 ⇔ x ≤ 19 : B croît sur [12 ; 19] et décroît sur [19 ; 28] ; maximum B(19) = 1 452 €, pour
une demande de 132 cabas. B′(15) = 96. Capacité : 360 − 12x ≤ 120 ⇔ x ≥ 20 ; sur [20 ; 28], B
décroît, d'où le prix optimal sous contrainte 20 € et B(20) = 1 440 €.

Ventes du B2-06 : V′(x) = 24e^(0,06x), V′(5) ≈ 32,40 ; W′(x) = −36e^(−0,04x), W′(10) ≈ −24,13 et
W(10) ≈ 603,29. Révisions : C′(x) = 50 − 200e^(−0,1x) ≥ 0 ⇔ e^(−0,1x) ≤ 0,25 ⇔ x ≥ −10 ln 0,25 ≈ 13,86 ;
C(13,86) ≈ 1 193,15 €, contre C(2) ≈ 1 737,46 € et C(30) ≈ 1 599,57 €.

Feuille de l'exercice 5, prix impairs : B(13) = 1 020, B(15) = 1 260, B(17) = 1 404, B(19) = 1 452,
puis 1 404, 1 260, 1 020 et 696 à 27 € ; B′ vaut 144, 96, 48, 0, −48, −96, −144, −192.

Exemples guidés : K(x) = x³ − 6x² + 15x + 20, K′(2) = 3 ; f(x) = 2x³ − 21x² + 60x sur [0 ; 7],
f(0) = 0, f(2) = 52, f(5) = 25, f(7) = 77. Exercice 1 : g′(3) = 18 pour g(x) = 2x³ − 6x² + 5.

Chaque valeur est recalculée par `b2-07.cours.spec.ts` à partir des seuls paramètres.

### 5.9 Concepts, confusions et remédiations

**Concepts** : `fonction-derivee`, `variations-d-une-fonction`, `optimisation` (nouveaux), `tableur`,
et les concepts réemployés : `fonction-exponentielle`, `logarithme-neperien`,
`resolution-par-logarithme`, `algorithme-de-seuil`, `suite-geometrique`, `prevision`.
**Confusions** : dix-sept, dont neuf nouvelles (`exposant-non-descendu`, `constante-non-annulee`,
`valeur-et-pente-confondues`, `derivee-de-l-exponentielle-sans-k`, `signe-de-f-pour-variations`,
`extremum-sans-changement-de-signe`, `abscisse-pour-extremum`, `bornes-oubliees`,
`contrainte-ignoree`). `sens-inegalite-ln-negatif` garde son identifiant ; son libellé couvre toute
division par un nombre négatif.

| Identifiant                         | Concept                   | Libellé                                                      | Remédiation                   |
| ----------------------------------- | ------------------------- | ------------------------------------------------------------ | ----------------------------- |
| `exponentielle-lue-comme-produit`   | fonction-exponentielle    | Calculer e^(kx) comme e × k × x.                             | B2-07-A1-02-ENFANT-MULTIPLIER |
| `nature-de-suite-confondue`         | suite-geometrique         | Confondre « ajouter » et « multiplier ».                     | B2-07-A1-02-ENFANT-MULTIPLIER |
| `k-confondu-avec-taux`              | fonction-exponentielle    | Confondre k et le taux d'évolution.                          | B2-07-A1-03-ENFANT-A-ET-K     |
| `seuil-par-division`                | resolution-par-logarithme | Diviser au lieu de passer par ln.                            | B2-07-A1-04-ENFANT-LN         |
| `seuil-mal-arrondi`                 | prevision                 | Arrondir le seuil à l'entier inférieur.                      | B2-07-A1-05-ENFANT-SEUIL      |
| `condition-tant-que-inversee`       | algorithme-de-seuil       | Écrire l'objectif après « Tant que ».                        | B2-07-A1-08-ENFANT-TANT-QUE   |
| `exposant-non-descendu`             | fonction-derivee          | Dériver 3x² en 3x : l'exposant ne descend pas.               | B2-07-A2-05-COURS-DERIVEE     |
| `constante-non-annulee`             | fonction-derivee          | Garder le nombre seul dans la dérivée.                       | B2-07-A2-05-COURS-DERIVEE     |
| `valeur-et-pente-confondues`        | fonction-derivee          | Confondre f(a), la valeur, et f′(a), la pente.               | B2-07-A2-05-COURS-DERIVEE     |
| `derivee-de-l-exponentielle-sans-k` | fonction-derivee          | Dériver e^(kx) sans multiplier par k.                        | B2-07-A2-10-COURS-DERIVEE-EXP |
| `signe-de-k-ignore`                 | fonction-exponentielle    | Perdre le signe de k.                                        | B2-07-A2-10-COURS-DERIVEE-EXP |
| `sens-inegalite-ln-negatif`         | resolution-par-logarithme | Garder le sens en divisant par un nombre négatif.            | B2-07-A3-04-COURS-VARIATIONS  |
| `signe-de-f-pour-variations`        | variations-d-une-fonction | Lire le sens de f dans le signe de f au lieu de celui de f′. | B2-07-A3-04-COURS-VARIATIONS  |
| `extremum-sans-changement-de-signe` | optimisation              | Conclure à un extremum dès que f′ s'annule.                  | B2-07-A4-04-COURS-OPTIMUM     |
| `abscisse-pour-extremum`            | optimisation              | Donner le x de l'optimum pour sa valeur, ou l'inverse.       | B2-07-A4-04-COURS-OPTIMUM     |
| `bornes-oubliees`                   | optimisation              | Chercher l'optimum sans comparer les valeurs aux bornes.     | B2-07-A4-04-COURS-OPTIMUM     |
| `contrainte-ignoree`                | optimisation              | Garder l'optimum sans contrainte hors des valeurs permises.  | B2-07-A4-04-COURS-OPTIMUM     |

### 5.10 Rappels espacés

Douze rappels : e⁰, taux de a e^(kx), solution de eˣ = 4, condition de « Tant que », premier entier
d'un seuil, dérivée de 5x², dérivée d'une constante, dérivée de e^(0,5x), f′(a) pente ou valeur,
signe de f′ et sens de f, extremum sans changement de signe, maximum au bord. Obligatoires :
`b2-07-r-exponentielle` et `b2-07-r-extremum`.

## 8. Médias

### 8.1 Principe

Quatorze illustrations, une par écran d'image `image-left`, en style d'album jeunesse :
une scène, très peu de texte, aucune réponse d'exercice. Chaque PNG d'origine (1 536 × 1 024 px) est
converti en WebP à la même taille et servi depuis `/assets/cours/b2-07/v1/`. Les mini-prompts sont dans
`illustrations-b2-07/prompts.md` (espace de travail). Le front publie le cours quand les quatorze WebP
sont déposés. La gravure de l'accroche rejoint `/assets/cours/gravures/v1/`.

### 8.2 Catalogue des médias

| Id  | Écran | Fichier source (page)                                                      | Original              | Auteur, date                                                    | Licence        | Dérivé servi                     | Attribution affichée                                                                                           |
| --- | ----- | -------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------- | -------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| M1  | A1-02 | production propre du cours                                                 | PNG 1 536 × 1 024 px  | Asili Design, 2026                                              | CC BY-SA 4.0   | `plante-qui-multiplie.webp`      | « L’exponentielle multiplie · Asili Design, 2026 · CC BY-SA 4.0 »                                              |
| M2  | A1-03 | production propre du cours                                                 | PNG 1 536 × 1 024 px  | Asili Design, 2026                                              | CC BY-SA 4.0   | `deux-ballons.webp`              | « Le départ et la vitesse · Asili Design, 2026 · CC BY-SA 4.0 »                                                |
| M3  | A1-04 | production propre du cours                                                 | PNG 1 536 × 1 024 px  | Asili Design, 2026                                              | CC BY-SA 4.0   | `bouton-retour.webp`             | « ln, le bouton retour · Asili Design, 2026 · CC BY-SA 4.0 »                                                   |
| M4  | A1-05 | production propre du cours                                                 | PNG 1 536 × 1 024 px  | Asili Design, 2026                                              | CC BY-SA 4.0   | `plante-et-fenetre.webp`         | « Quand touchera-t-on la fenêtre ? · Asili Design, 2026 · CC BY-SA 4.0 »                                       |
| M5  | A1-07 | production propre du cours                                                 | PNG 1 536 × 1 024 px  | Asili Design, 2026                                              | CC BY-SA 4.0   | `verre-cuillere.webp`            | « La boucle répète · Asili Design, 2026 · CC BY-SA 4.0 »                                                       |
| M6  | A1-08 | production propre du cours                                                 | PNG 1 536 × 1 024 px  | Asili Design, 2026                                              | CC BY-SA 4.0   | `pas-encore-plein.webp`          | « Tant que veut dire pas encore · Asili Design, 2026 · CC BY-SA 4.0 »                                          |
| M7  | A1-09 | production propre du cours                                                 | PNG 1 536 × 1 024 px  | Asili Design, 2026                                              | CC BY-SA 4.0   | `deux-chemins.webp`              | « Deux chemins, le même rang · Asili Design, 2026 · CC BY-SA 4.0 »                                             |
| M8  | A2-03 | production propre du cours                                                 | PNG 1 536 × 1 024 px  | Asili Design, 2026                                              | CC BY-SA 4.0   | `velo-sur-la-colline.webp`       | « La pente sous le vélo · Asili Design, 2026 · CC BY-SA 4.0 »                                                  |
| M9  | A2-04 | production propre du cours                                                 | PNG 1 536 × 1 024 px  | Asili Design, 2026                                              | CC BY-SA 4.0   | `exposant-qui-saute.webp`        | « La recette des puissances · Asili Design, 2026 · CC BY-SA 4.0 »                                              |
| M10 | A2-09 | production propre du cours                                                 | PNG 1 536 × 1 024 px  | Asili Design, 2026                                              | CC BY-SA 4.0   | `boule-de-neige.webp`            | « La boule de neige · Asili Design, 2026 · CC BY-SA 4.0 »                                                      |
| M11 | A3-02 | production propre du cours                                                 | PNG 1 536 × 1 024 px  | Asili Design, 2026                                              | CC BY-SA 4.0   | `panneaux-de-la-route.webp`      | « Le panneau de la route · Asili Design, 2026 · CC BY-SA 4.0 »                                                 |
| M12 | A3-03 | production propre du cours                                                 | PNG 1 536 × 1 024 px  | Asili Design, 2026                                              | CC BY-SA 4.0   | `carte-du-trajet.webp`           | « La carte du trajet · Asili Design, 2026 · CC BY-SA 4.0 »                                                     |
| M13 | A4-02 | production propre du cours                                                 | PNG 1 536 × 1 024 px  | Asili Design, 2026                                              | CC BY-SA 4.0   | `sommet-de-la-colline.webp`      | « Le sommet de la colline · Asili Design, 2026 · CC BY-SA 4.0 »                                                |
| M14 | A4-03 | production propre du cours                                                 | PNG 1 536 × 1 024 px  | Asili Design, 2026                                              | CC BY-SA 4.0   | `barriere-sur-le-chemin.webp`    | « La barrière sur le chemin · Asili Design, 2026 · CC BY-SA 4.0 »                                              |
| M15 | A1-01 | https://commons.wikimedia.org/wiki/File:Leibniz-Acta-1684-NovaMethodus.jpg | JPEG 1 204 × 1 781 px | Gottfried Wilhelm Leibniz, Nova Methodus pro Maximis et Minimis | domaine public | `leibniz-nova-methodus-1684.jpg` | « Gottfried Wilhelm Leibniz, Nova Methodus pro Maximis et Minimis, 1684 · Wikimedia Commons (domaine public) » |

### 8.3 Sources des données

- Cabas Escale, demande, coût, capacité, révisions de la surjeteuse, exemples guidés : données
  fictives créées pour ce cours. Ventes V et W : modèles du B2-06, données fictives.
- Encadré « Méthode » et exemple f(x) = −2x² + 40x + 5 : devoir maison « Réviser B2-01 à B2-07 ».
