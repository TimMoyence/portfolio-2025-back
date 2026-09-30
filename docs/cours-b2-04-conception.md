# B2-04 · Suites : modéliser une évolution régulière — conception de référence (gabarit v3)

> Cahier des charges du cours B2-04 au gabarit v3 (`docs/cours-gabarit-v3.md`) : une séance de
> 3 h 30 dont 30 minutes de pause, ouverte par le rappel des trois premiers cours, puis trois notions
> traitées chacune par un cycle réfléchir → comprendre → s'exercer, et une mini-situation CCF. Ce
> document ne contient aucun code exécutable ; toute divergence d'implémentation est un défaut de
> l'implémentation. Les tests `b2-04.cours.spec.ts` relisent ce document : § 3.1, titres publics du
> § 3, § 5.9, § 8.2.

| Rubrique    | Valeur                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| Date        | 30 septembre 2026                                                                                                   |
| Statut      | **Référence pédagogique** : quatrième cours du plan v3 (`docs/cours-bts-cg2-plan-v3.md`), troisième au gabarit v3   |
| Cours       | `b2-04-suites`                                                                                                      |
| Gabarit     | `v3`, déclaré par le contenu et contrôlé par les quatre règles `gabarit-*` de `verifierStructure`                   |
| Titre servi | « Suites : modéliser une évolution régulière »                                                                      |
| Durée       | **180 minutes exactes** (somme des écrans), 4 actes de 49, 39, 47 et 45 minutes, plus 2 pauses de 15 min hors durée |
| Écrans      | **34**, dont 12 écrans catalogue                                                                                    |
| Sources     | `docs/donnees-b2-04-sources.md` (espace de travail) : programme officiel, annales de CCF, données fictives          |

---

## 0. Synthèse des décisions

- **Une question de gestion : le plan à cinq ans pour la banque.** Hélène Garnier veut le chiffre
  d'affaires prévu de 2026 à 2030 et l'année où il atteindra 1 200 k€, niveau (fictif) qui rentabilise
  l'agrandissement de l'atelier. Deux hypothèses partent des 826 k€ de 2025 : A, +44 k€ par an
  (Marc Lefèvre reprend la pente de la droite d'ajustement du B2-02) ; B, +6 % par an (Samir reprend
  le taux moyen 2020-2025). A est une suite arithmétique, B une suite géométrique.
- **Le cours s'ouvre par le rappel des trois premiers cours**, et chaque acquis devient une brique
  du jour : le coefficient multiplicateur (B2-01) est la raison d'une suite géométrique ; la pente de
  la droite d'ajustement (B2-02) est la raison d'une suite arithmétique ; la négation d'une
  comparaison (B2-03) est la condition d'arrêt de la boucle « Tant que ».
- **Trois notions** : suites arithmétiques (N1), suites géométriques (N2), seuils et cumuls (N3). Le
  rang traverse les trois : 2025 a le rang 0, et le rang d'une année est le nombre d'années écoulées.
- **Le tableur comme table de valeurs** : la référence figée par `$` (cellule de la raison ou du
  taux), la recopie, `SOMME` pour le cumul ; `SI` revient dans la mini-situation.
- **L'algorithme sans brique nouvelle** : la boucle « Tant que » s'écrit dans la trace écrite, se
  déroule dans un tableau d'exécution (`fp-table-build`, colonne V/F du B2-03) et se complète par
  vote, comme dans les sujets d'examen 2024 et 2026.
- **Mini-situation sur un contexte neuf** : la boutique en ligne d'Atelier Rivage (+16 % par an) et
  son coût d'acquisition (−10 % par an), sur le modèle des sujets d'examen 2024 et 2026.

## 1. Objectifs d'apprentissage et public

### 1.1 Rattachement au programme officiel

Module « Suites numériques » du BTS CG : suites arithmétiques et géométriques, expression du terme
général, utilisation d'un algorithme ou d'un tableur pour comparer des évolutions et déterminer un
seuil, somme de n termes consécutifs (formule donnée si nécessaire), algorithme de somme. Aucune
notion de limite (`docs/programme-bts-cg-maths-officiel.md`).

### 1.2 Objectifs du cours

À la fin de la séance, l'étudiant sait :

1. reconnaître une suite arithmétique, donner sa raison et son terme général, calculer un terme ;
2. traduire une évolution à taux constant par une suite géométrique de raison 1 + t ÷ 100 ;
3. relier une année et son rang sans se décaler d'un terme ;
4. compléter, dérouler et interpréter une boucle « Tant que » de recherche de seuil ;
5. calculer un cumul en comptant les termes, avec `SOMME` ou une formule donnée ;
6. écrire une formule recopiable avec une référence figée par `$`.

### 1.3 Acquis des trois premiers cours

| Cours | Savoirs installés                                                                                                                                                                                                                  | Réemploi dans le B2-04                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| B2-01 | Proportion, taux d'évolution, coefficient multiplicateur, évolutions successives et réciproque, points de pourcentage, indice, taux moyen, moyenne pondérée, lecture de graphiques, contrôles ; `$`, `SOMME`, `PUISSANCE`, recopie | Raison q = 1 + t ÷ 100 ; ne pas additionner les taux ; `$` |
| B2-02 | Moyenne, médiane, écart-type, valeur extrême ; nuage, point moyen, corrélation ; droite d'ajustement, prévision par le rang, seuil arrondi à l'entier supérieur                                                                    | Raison r = pente ; rang d'une année ; seuil                |
| B2-03 | Connecteurs, implication, bornes strictes et larges, négation, lois de Morgan, quantificateurs ; `SI`, `ET`, `OU`, `NON`, `NB.SI`                                                                                                  | Condition du « Tant que » et son contraire ; `SI`          |

### 1.4 Public et conditions

BTS CG 2e année, 25 étudiants au plus, calculatrice autorisée, un poste par étudiant ou le livret
papier. Séance de 3 h 30 : 180 minutes de travail, pause de 15 minutes après l'acte 1 et après
l'acte 3.

## 2. Architecture

### 2.1 Les quatre actes

| Acte | Rôle                                           | Notion | Minutes |
| ---- | ---------------------------------------------- | ------ | ------: |
| 1    | Rappel des trois cours, puis ajouter chaque an | N1     |      49 |
| 2    | Multiplier chaque an                           | N2     |      39 |
| 3    | Atteindre un seuil, cumuler                    | N3     |      47 |
| 4    | Mini-situation CCF et clôture                  | —      |      45 |

Pause 1 (15 min) après le jalon A1-12 ; pause 2 (15 min) après le jalon A3-09. Les pauses ne sont
pas des écrans : le formateur les annonce, la durée programmée n'en tient pas compte.

### 2.2 L'ouverture : rappel rapide des trois cours

Neuf minutes, trois temps : une question de rappel d'ouverture sur le B2-01 (`fp-recall`, une seule
question par schéma) ; un vote à deux questions sur le B2-02 et le B2-03, avec révélation commentée ;
un écran de synthèse en trois colonnes, qui dit pour chaque cours ce qui est acquis et à quoi il sert
aujourd'hui. On interroge avant de montrer : le rappel de mémoire précède la synthèse.

### 2.3 Le cycle d'une notion

Chaque notion suit : **Réfléchir** (mission, réflexion écrite ou vote non noté) → **Comprendre**
(trace écrite en deux pages v2 `lesson` de 3 minutes, puis exemple guidé `fp-worked` corrigé étape
par étape sur son propre écran) → **S'exercer** (exercices notés, corrigés sur place). Chaque page de
trace écrite porte trois blocs : une définition en langage courant qui dit à quoi sert la notion pour
le plan d'Hélène, un exemple pour débuter hors du dossier (tirelire, livret d'épargne) et une méthode
ou un encadré « Au CCF » qui nomme les pièges.

Chaque exercice annonce ses temps dans les notes formateur, sous la forme
`• Temps : réflexion N min · travail N min · correction N min`, dont la somme est la durée de
l'écran. La correction se dévoile sur l'écran de l'exercice (`correctionSurPlace`).

### 2.4 Règles de structure

Le cours passe les règles communes et les quatre règles du gabarit v3 : 34 écrans ≤ 40,
180 minutes ≤ 180, chaque trace écrite précédée d'une réflexion et suivie d'un exercice, chaque
exercice avec ses trois temps et sa correction sur place, mini-situation (`fp-escape`) sans trace
écrite après elle. Exposition continue de 6 minutes au plus.

### 2.5 Diffusion

Catalogue : l'accroche, la synthèse des acquis, l'historique du chiffre d'affaires, les six pages de
trace écrite, le graphique des deux hypothèses, le dossier de la mini-situation et la fiche mémo.
Tout le reste est servi en séance. Aucun écran catalogue ne porte une réponse.

### 2.6 Notation

Indices et exposants en caractères Unicode (u₀, uₙ, uₙ₊₁, qⁿ, 1,06⁵) dans les traces écrites, les
énoncés et le livret. Dans un algorithme, `←` se lit « prend la valeur ».

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B2-04-A{acte}-{rang}-{SLUG}`, conformes à `^B2-04-A[1-6]-\d{2}-[A-Z0-9-]+$`.
Colonne « Brique · rendu » : valeur de la colonne `brique` ; les écrans « v2 » sont stockés en
`fp-story` avec une présentation v2. « I » = interactif. « Q » = questions fermées notées (vote,
numérique, classement) portées par l'écran.

| Rang | Identifiant                      | Min | Brique · rendu               |  I  |   Q | Diffusion |
| ---: | -------------------------------- | --: | ---------------------------- | :-: | --: | --------- |
|    1 | B2-04-A1-01-RAPPEL-COEFFICIENT   |   3 | `fp-recall`                  |  I  |   1 | seance    |
|    2 | B2-04-A1-02-ACCROCHE             |   1 | `fp-story` · v2 `hero`       |     |   0 | catalogue |
|    3 | B2-04-A1-03-VOTE-ACQUIS          |   4 | `fp-vote`                    |  I  |   0 | seance    |
|    4 | B2-04-A1-04-ACQUIS               |   2 | `fp-story` · v2 `comparison` |     |   0 | catalogue |
|    5 | B2-04-A1-05-HISTORIQUE           |   2 | `fp-story` · v2 `table`      |     |   0 | catalogue |
|    6 | B2-04-A1-06-MISSION              |   6 | `fp-pro`                     |  I  |   0 | seance    |
|    7 | B2-04-A1-07-COURS-ARITHMETIQUE   |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|    8 | B2-04-A1-08-COURS-RAISON-TABLEUR |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|    9 | B2-04-A1-09-EXEMPLE-ARITHMETIQUE |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   10 | B2-04-A1-10-ATELIER-ARITHMETIQUE |  10 | `questionnaire`              |  I  |   4 | seance    |
|   11 | B2-04-A1-11-TABLEUR-ARITHMETIQUE |   8 | `fp-sheet`                   |  I  |   0 | seance    |
|   12 | B2-04-A1-12-JALON                |   1 | `fp-pulse`                   |     |   0 | seance    |
|   13 | B2-04-A2-01-REFLEXION-TAUX       |   5 | `fp-story` · v2 `reflection` |  I  |   0 | seance    |
|   14 | B2-04-A2-02-COURS-GEOMETRIQUE    |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   15 | B2-04-A2-03-COURS-VARIATION      |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   16 | B2-04-A2-04-EXEMPLE-GEOMETRIQUE  |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   17 | B2-04-A2-05-ATELIER-GEOMETRIQUE  |  11 | `questionnaire`              |  I  |   4 | seance    |
|   18 | B2-04-A2-06-TABLEUR-GEOMETRIQUE  |  10 | `fp-sheet`                   |  I  |   0 | seance    |
|   19 | B2-04-A2-07-JALON                |   1 | `fp-pulse`                   |     |   0 | seance    |
|   20 | B2-04-A3-01-GRAPHIQUE            |   2 | `fp-story` · v2 `chart`      |     |   0 | catalogue |
|   21 | B2-04-A3-02-VOTE-SEUIL           |   4 | `fp-vote`                    |  I  |   0 | seance    |
|   22 | B2-04-A3-03-COURS-SEUIL          |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   23 | B2-04-A3-04-COURS-SOMME          |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   24 | B2-04-A3-05-EXEMPLE-SEUIL        |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   25 | B2-04-A3-06-TABLEAU-ALGORITHME   |   7 | `fp-table-build`             |  I  |   0 | seance    |
|   26 | B2-04-A3-07-ATELIER-SEUIL        |  11 | `questionnaire`              |  I  |   4 | seance    |
|   27 | B2-04-A3-08-DEFI-IA              |  10 | `fp-challenge`               |  I  |   0 | seance    |
|   28 | B2-04-A3-09-JALON                |   1 | `fp-pulse`                   |     |   0 | seance    |
|   29 | B2-04-A4-01-SITUATION-BOUTIQUE   |   3 | `fp-story` · v2 `table`      |     |   0 | catalogue |
|   30 | B2-04-A4-02-TABLEUR-BOUTIQUE     |  16 | `fp-sheet`                   |  I  |   0 | seance    |
|   31 | B2-04-A4-03-COFFRE-BOUTIQUE      |  14 | `fp-escape`                  |  I  |   0 | seance    |
|   32 | B2-04-A4-04-RAPPEL               |   6 | `fp-spaced`                  |  I  |   0 | seance    |
|   33 | B2-04-A4-05-FICHE-MEMO           |   2 | `fp-story` · v2 `grid`       |     |   0 | catalogue |
|   34 | B2-04-A4-06-BILLET-DE-SORTIE     |   4 | `fp-exit`                    |  I  |   1 | seance    |

Rythme : 147 minutes interactives, 33 d'exposition, exposition continue de 6 minutes au plus.

### 3.2 Acte 1 — Rappel des trois cours, puis ajouter chaque an (49 min)

#### A1-01 · `B2-04-A1-01-RAPPEL-COEFFICIENT` — 3 min · `fp-recall` · séance

- Titre public : « Rappel du B2-01 : augmenter de 6 % »
- Énoncé (`b2-04-a1-rappel-coefficient`) : par quel nombre multiplie-t-on un chiffre d'affaires qui
  augmente de 6 % par an ? Bonne réponse : le coefficient multiplicateur ; piège
  `coefficient-confondu-avec-taux`.
- Papier : question en tête du livret, vote à main levée.

#### A1-02 · `B2-04-A1-02-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Modéliser une évolution régulière »
- Atelier Rivage et le plan à cinq ans ; plan en trois notions et une mini-situation.

#### A1-03 · `B2-04-A1-03-VOTE-ACQUIS` — 4 min · `fp-vote` · séance

- Titre public : « Vote : deux rappels, B2-02 et B2-03 »
- Deux votes non notés, révélation commentée : ce que mesure la pente de la droite d'ajustement
  (`pente-ordonnee-inversees`) ; la phrase vraie quand une boucle « tant que le chiffre d'affaires
  est inférieur à 1 200 k€ » s'arrête (`negation-comparaison`).

#### A1-04 · `B2-04-A1-04-ACQUIS` — 2 min · v2 `comparison` · catalogue

- Titre public : « Ce que vous savez déjà »
- Trois colonnes, une par cours : deux acquis, puis leur emploi du jour (raison q, raison r,
  condition de la boucle). Trois lignes courtes par colonne : l'écran tient dans la toile
  1280 × 720 sans descendre sous l'échelle 0,8.

#### A1-05 · `B2-04-A1-05-HISTORIQUE` — 2 min · v2 `table` · catalogue

- Titre public : « Le chiffre d’affaires d’Atelier Rivage, 2020-2025 »
- Six années, chiffre d'affaires, hausse en k€ et en % : la hausse en k€ et la hausse en % sont
  toutes deux à peu près régulières, d'où les deux hypothèses. Mention « Données fictives ».

#### A1-06 · `B2-04-A1-06-MISSION` — 6 min · `fp-pro` · séance

- Titre public : « Votre mission : le plan à cinq ans »
- Courriel d'Hélène Garnier (plan 2026-2030, seuil de 1 200 k€), hypothèse A de Marc Lefèvre,
  hypothèse B de Samir. Trois questions libres, temps « réfléchir » de N1 : le calcul direct de 2030
  sous l'hypothèse A (`hypothese-a`) ; la hausse en k€ est-elle constante sous l'hypothèse B
  (`hypothese-b`) ; laquelle atteint le seuil la première, et comment le vérifier (`seuil`).
- Papier : trois lignes d'écriture dans le livret.

#### A1-07 · `B2-04-A1-07-COURS-ARITHMETIQUE` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : suites arithmétiques »
- Page 1 sur 2 : suite, rang, terme ; suite arithmétique, raison, terme général ; exemple pour
  débuter (la tirelire de Léa) ; méthode pour reconnaître la suite et compter le rang.

#### A1-08 · `B2-04-A1-08-COURS-RAISON-TABLEUR` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : raison, graphique et tableur »
- Page 2 sur 2 : sens de variation, points alignés, raison = pente (lien B2-02) ; la tirelire au
  tableur, référence figée par `$` ; au CCF, la phrase de justification.

#### A1-09 · `B2-04-A1-09-EXEMPLE-ARITHMETIQUE` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : la production de voiles »
- 320 voiles en 2025, 25 de plus par an : nature, premiers termes, terme général, 2030, formule
  recopiable. 4 min de réponses, puis 2 min de correction dévoilée étape par étape.

#### A1-10 · `B2-04-A1-10-ATELIER-ARITHMETIQUE` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 1 — L’hypothèse A, année par année »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, question par question sur place.
- `b2-04-a1-nature` (vote) : pourquoi la suite est arithmétique ; piège `nature-de-suite-confondue`.
- `b2-04-a1-u3` : chiffre d'affaires de 2028 ; piège `rang-decale`.
- `b2-04-a1-terme-general` (vote) ; pièges `pente-ordonnee-inversees`, `nature-de-suite-confondue`.
- `b2-04-a1-rang` : nombre d'années pour atteindre 1 090 k€ ; pièges `rang-confondu-avec-annee`,
  `rang-decale`.

#### A1-11 · `B2-04-A1-11-TABLEUR-ARITHMETIQUE` — 8 min · `fp-sheet` · séance

- Titre public : « Exercice 2 — L’hypothèse A au tableur »
- Temps : réflexion 1 min · travail 5 min · correction 2 min sur place.
- Années 2025 à 2030, raison en F1 : formule en C3 recopiée jusqu'en C7. Recopie sans `$` :
  `reference-relative-non-figee`.

#### A1-12 · `B2-04-A1-12-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 1 : suites arithmétiques »
- Puis pause de 15 minutes.

### 3.3 Acte 2 — Multiplier chaque an (39 min)

#### A2-01 · `B2-04-A2-01-REFLEXION-TAUX` — 5 min · v2 `reflection` · séance

- Titre public : « Réfléchir : +6 % par an pendant cinq ans »
- Samir additionne les taux (+30 %). Calculer 2026 puis 2027 et conclure. Temps « réfléchir » de N2.

#### A2-02 · `B2-04-A2-02-COURS-GEOMETRIQUE` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : suites géométriques »
- Page 1 sur 2 : suite géométrique, raison q = 1 + t ÷ 100 (lien B2-01), terme général ; exemple
  pour débuter (le livret d'épargne) ; méthode et pièges (taux pris pour la raison, taux additionnés).

#### A2-03 · `B2-04-A2-03-COURS-VARIATION` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : variation et tableur »
- Page 2 sur 2 : sens de variation selon q, hausse et baisse ; le livret au tableur (`$`,
  `PUISSANCE`) ; au CCF, justifier qu'une suite est géométrique.

#### A2-04 · `B2-04-A2-04-EXEMPLE-GEOMETRIQUE` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : la consommation d’électricité »
- 48 000 kWh en 2025, baisse de 5 % par an : raison, termes, terme général, 2030, piège additif.

#### A2-05 · `B2-04-A2-05-ATELIER-GEOMETRIQUE` — 11 min · `questionnaire` · séance

- Titre public : « Exercice 3 — L’hypothèse B, année par année »
- Temps : réflexion 2 min · travail 7 min · correction 2 min, question par question sur place.
- `b2-04-a2-raison` (vote) ; piège `coefficient-confondu-avec-taux`. Un seul distracteur : avec
  deux votes à trois options, l'exercice ne tenait plus sur un portable 14 pouces.
- `b2-04-a2-v3` : chiffre d'affaires de 2028 ; pièges `taux-successifs-additionnes`, `rang-decale`.
- `b2-04-a2-terme-general` (vote) ; pièges `nature-de-suite-confondue`,
  `coefficient-confondu-avec-taux`.
- `b2-04-a2-ecart` : écart entre B et A en 2030 ; piège `taux-successifs-additionnes`.

#### A2-06 · `B2-04-A2-06-TABLEUR-GEOMETRIQUE` — 10 min · `fp-sheet` · séance

- Titre public : « Exercice 4 — Les deux hypothèses au tableur »
- Temps : réflexion 2 min · travail 6 min · correction 2 min sur place.
- Hypothèse A donnée en colonne C ; hypothèse B en colonne D (taux en G2, référence figée), écart
  B − A en colonne E (références relatives). Dix cellules attendues ; pièges
  `coefficient-confondu-avec-taux`, `reference-relative-non-figee`.

#### A2-07 · `B2-04-A2-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : suites géométriques »

### 3.4 Acte 3 — Atteindre un seuil, cumuler (47 min)

#### A3-01 · `B2-04-A3-01-GRAPHIQUE` — 2 min · v2 `chart` · catalogue

- Titre public : « Les deux hypothèses sur un graphique »
- Courbes 2025-2030 : A suit une droite, B s'en écarte. Axe de 800 à 1 200 k€, annoncé tronqué
  (B2-01) ; le seuil est le haut du graphique, aucune des deux ne l'atteint encore.

#### A3-02 · `B2-04-A3-02-VOTE-SEUIL` — 4 min · `fp-vote` · séance

- Titre public : « Vote : s’arrêter et additionner »
- Deux votes non notés (temps « réfléchir » de N3) : la valeur sur laquelle s'arrête une boucle
  (`seuil-mal-arrondi`) ; le nombre de termes de 2026 à 2030 (`nombre-de-termes-decale`).

#### A3-03 · `B2-04-A3-03-COURS-SEUIL` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : seuil et boucle « Tant que » »
- Page 1 sur 2 : seuil, tableau de valeurs, boucle « Tant que » et son arrêt (lien B2-03) ; exemple
  pour débuter (la tirelire atteint 200 €) ; méthode pour écrire et lire l'algorithme.

#### A3-04 · `B2-04-A3-04-COURS-SOMME` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : cumul et somme de termes »
- Page 2 sur 2 : somme de termes consécutifs, nombre de termes, `SOMME`, formules données au CCF,
  algorithme de somme ; exemple pour débuter ; au CCF, compléter et interpréter.

#### A3-05 · `B2-04-A3-05-EXEMPLE-SEUIL` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : passer sous un seuil »
- Consommation d'électricité, seuil de 40 000 kWh à la baisse : initialisation, condition,
  exécution, interprétation, cumul 2026-2028.

#### A3-06 · `B2-04-A3-06-TABLEAU-ALGORITHME` — 7 min · `fp-table-build` · séance

- Titre public : « Exercice 5 — Dérouler l’algorithme »
- Temps : réflexion 1 min · travail 4 min · correction 2 min sur place.
- Boucle de l'hypothèse A jusqu'à 1 000 k€ : pour chacun des quatre passages, la valeur de u et la
  condition (V ou F). Pièges : `rang-decale` (valeur avant la mise à jour),
  `condition-tant-que-inversee`.

#### A3-07 · `B2-04-A3-07-ATELIER-SEUIL` — 11 min · `questionnaire` · séance

- Titre public : « Exercice 6 — Seuil et cumul des deux hypothèses »
- Temps : réflexion 2 min · travail 7 min · correction 2 min, question par question sur place.
- `b2-04-a3-seuil-b` : années pour atteindre 1 200 k€ sous B ; pièges `seuil-mal-arrondi`,
  `rang-confondu-avec-annee`.
- `b2-04-a3-condition` (vote) : la ligne « Tant que » ; piège `condition-tant-que-inversee`.
- `b2-04-a3-cumul-a` : cumul 2026-2030 sous A ; pièges `terme-pris-pour-somme`,
  `nombre-de-termes-decale`.
- `b2-04-a3-somme` (vote) : la formule `SOMME` ; pièges `nombre-de-termes-decale`,
  `terme-pris-pour-somme`.

#### A3-08 · `B2-04-A3-08-DEFI-IA` — 10 min · `fp-challenge` · séance

- Titre public : « Exercice 7 — Corriger le plan d’une IA »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, piste par piste sur place.
- L'IA additionne les taux, inverse la condition du « Tant que » et donne le dernier terme pour le
  cumul. Pistes justes : puissance, condition, cumul, contrôle par l'ordre de grandeur ; piste
  fausse : garder la réponse.

#### A3-09 · `B2-04-A3-09-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 3 : seuils et cumuls »
- Puis pause de 15 minutes.

### 3.5 Acte 4 — Mini-situation CCF et clôture (45 min)

#### A4-01 · `B2-04-A4-01-SITUATION-BOUTIQUE` — 3 min · v2 `table` · catalogue

- Titre public : « Mini-situation CCF : la boutique en ligne »
- Dossier : boutique en ligne (120 k€ en 2025, +16 % par an), seuil de rentabilité de 280 k€, coût
  d'acquisition (40 €, −10 % par an), algorithme à compléter, barème sur 10. Mention « Données
  fictives ».

#### A4-02 · `B2-04-A4-02-TABLEUR-BOUTIQUE` — 16 min · `fp-sheet` · séance

- Titre public : « Question tableur (3 points sur 10) : le plan de la boutique »
- Temps : réflexion 3 min · travail 11 min · correction 2 min sur place.
- Années 2025 à 2032 : chiffre d'affaires en colonne C (taux en F1, figé), « Oui » ou « Non » en
  colonne D selon le seuil en H1 (`SI`, référence figée), cumul 2025-2030 en F3 (`SOMME`). Seize
  cellules attendues ; pièges `reference-relative-non-figee`, `coefficient-confondu-avec-taux`,
  `nombre-de-termes-decale`, `terme-pris-pour-somme` ; un texte sans guillemets dans `SI` est nommé
  `critere-sans-guillemets` (B2-03).

#### A4-03 · `B2-04-A4-03-COFFRE-BOUTIQUE` — 14 min · `fp-escape` · séance

- Titre public : « Mini-situation : conclure le plan de la boutique »
- Temps : réflexion 2 min · travail 10 min · correction 2 min sur place, énigme par énigme.
- E1 coût d'acquisition en 2029 (2 points ; `taux-successifs-additionnes`, `rang-decale`,
  `sens-de-variation`) ; E2 valeur affichée par l'algorithme (2 points ; `seuil-mal-arrondi`,
  `condition-tant-que-inversee`, `rang-confondu-avec-annee`) ; E3 cumul 2026-2030 (1,5 point ;
  `nombre-de-termes-decale`, `terme-pris-pour-somme`) ; E4 hausse en pourcentage de 2025 à 2030
  (1,5 point ; `taux-successifs-additionnes`, `coefficient-confondu-avec-taux`).
- Papier : quatre questions rédigées du livret, sans code de coffre.

#### A4-04 · `B2-04-A4-04-RAPPEL` — 6 min · `fp-spaced` · séance

- Titre public : « Rappel : de mémoire, sans vos notes »

#### A4-05 · `B2-04-A4-05-FICHE-MEMO` — 2 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : modéliser une évolution régulière »

#### A4-06 · `B2-04-A4-06-BILLET-DE-SORTIE` — 4 min · `fp-exit` · séance

- Titre public : « Billet de sortie : la formule à recopier »

## 4. Mode papier

Le livret étudiant reprend, dans l'ordre des écrans, les traces écrites, les énoncés et un cadre de
réponse par question ; il ne contient aucune bonne réponse. Le corrigé formateur ajoute les réponses,
les pièges et le barème. Sans poste, le formateur pilote les révélations depuis le pupitre ; les votes
se font à main levée, les formules s'écrivent sur la copie, les termes se calculent à la
calculatrice (mode table de valeurs ou multiplication répétée) et le tableau d'exécution se remplit
à la main.

## 5. Contenus

### 5.1 Les valeurs du dossier

| Rang | Année | Hypothèse A (k€) | Hypothèse B (k€) |
| ---: | ----: | ---------------: | ---------------: |
|    0 |  2025 |              826 |              826 |
|    1 |  2026 |              870 |           875,56 |
|    2 |  2027 |              914 |           928,09 |
|    3 |  2028 |              958 |           983,78 |
|    4 |  2029 |            1 002 |         1 042,81 |
|    5 |  2030 |            1 046 |         1 105,37 |

Seuil de 1 200 k€ : hypothèse B au rang 7 (2032, 1 242,00 k€), hypothèse A au rang 9 (2034,
1 222 k€). Cumul 2026-2030 : 4 790 k€ sous A, 4 935,61 k€ sous B. Cohérence avec le B2-02 : la
droite d'ajustement prévoyait environ 959 k€ en 2028 et le seuil de 1 000 k€ en 2029.

Boutique en ligne : 120 ; 139,20 ; 161,47 ; 187,31 ; 217,28 ; 252,04 ; 292,37 ; 339,15 k€ de 2025 à 2032. Seuil de 280 k€ au rang 6 (2031). Cumul 2025-2030 : 1 077,30 k€ ; cumul 2026-2030 : 957,30 k€.
Coût d'acquisition en 2029 : 40 × 0,9⁴ = 26,24 €. Hausse de 2025 à 2030 : 1,16⁵ ≈ 2,10, soit 110 %.

Chaque valeur est recalculée par `b2-04.cours.spec.ts` à partir des seuls paramètres.

### 5.9 Concepts, confusions et remédiations

**Concepts** : `suite-arithmetique`, `suite-geometrique`, `algorithme-de-seuil`, `somme-de-termes`
(nouveaux), `tableur`, et les trois concepts interrogés par le rappel des cours précédents :
`coefficient-multiplicateur`, `ajustement-affine`, `negation`.
**Confusions** : quatorze, dont six nouvelles (`rang-decale`, `rang-confondu-avec-annee`,
`nature-de-suite-confondue`, `condition-tant-que-inversee`, `nombre-de-termes-decale`,
`terme-pris-pour-somme`).

| Identifiant                      | Concept                    | Libellé                                                 | Remédiation                      |
| -------------------------------- | -------------------------- | ------------------------------------------------------- | -------------------------------- |
| `rang-decale`                    | suite-arithmetique         | Se décaler d'un rang.                                   | B2-04-A1-07-COURS-ARITHMETIQUE   |
| `pente-ordonnee-inversees`       | ajustement-affine          | Prendre la pente pour l'ordonnée à l'origine.           | B2-04-A1-08-COURS-RAISON-TABLEUR |
| `reference-relative-non-figee`   | tableur                    | Recopier sans figer la cellule de la raison ou du taux. | B2-04-A1-08-COURS-RAISON-TABLEUR |
| `coefficient-confondu-avec-taux` | coefficient-multiplicateur | Prendre le taux pour la raison.                         | B2-04-A2-02-COURS-GEOMETRIQUE    |
| `nature-de-suite-confondue`      | suite-geometrique          | Confondre « ajouter » et « multiplier ».                | B2-04-A2-02-COURS-GEOMETRIQUE    |
| `taux-successifs-additionnes`    | evolutions-successives     | Additionner les taux au lieu de multiplier.             | B2-04-A2-02-COURS-GEOMETRIQUE    |
| `sens-de-variation`              | taux-evolution             | Traiter une baisse comme une hausse.                    | B2-04-A2-03-COURS-VARIATION      |
| `negation-comparaison`           | negation                   | Nier « < » en « > » au lieu de « ≥ ».                   | B2-04-A3-03-COURS-SEUIL          |
| `seuil-mal-arrondi`              | prevision                  | S'arrêter un rang trop tôt.                             | B2-04-A3-03-COURS-SEUIL          |
| `condition-tant-que-inversee`    | algorithme-de-seuil        | Écrire la condition d'arrêt dans le « Tant que ».       | B2-04-A3-03-COURS-SEUIL          |
| `rang-confondu-avec-annee`       | algorithme-de-seuil        | Répondre par l'année au lieu du rang.                   | B2-04-A3-03-COURS-SEUIL          |
| `critere-sans-guillemets`        | tableur                    | Écrire un texte sans guillemets dans `SI`.              | B2-04-A3-03-COURS-SEUIL          |
| `nombre-de-termes-decale`        | somme-de-termes            | Compter un terme de trop ou de moins.                   | B2-04-A3-04-COURS-SOMME          |
| `terme-pris-pour-somme`          | somme-de-termes            | Donner le dernier terme pour la somme.                  | B2-04-A3-04-COURS-SOMME          |

### 5.10 Rappels espacés

Douze rappels : terme d'une suite arithmétique, nature d'une évolution à taux constant, raison d'une
baisse, terme d'une suite géométrique, terme général, rang d'une année, condition du « Tant que »,
interprétation de la valeur affichée, nombre de termes, cumul et dernier terme, référence figée,
sens de variation. Obligatoires : `b2-04-r-nature` et `b2-04-r-tant-que`.

## 8. Médias

### 8.1 Principe

Aucune image : l'historique et le dossier sont rendus par `table`, les deux hypothèses par `chart`,
les feuilles par `fp-sheet`, le tableau d'exécution par `fp-table-build`.

### 8.2 Catalogue des médias

Aucun média catalogué.

### 8.3 Sources des données

- Chiffre d'affaires 2020-2025 d'Atelier Rivage : données fictives créées pour le B2-02.
- Hypothèses A et B, seuil de 1 200 k€, boutique en ligne, coût d'acquisition, production de voiles,
  consommation d'électricité : données fictives créées pour ce cours.
- Forme de la mini-situation : sujets ponctuels 2023 (exercice 1, partie B), 2024 (exercice 2,
  partie C) et 2026 (exercice 1, partie B), recensés dans `docs/programme-bts-cg-maths-officiel.md` ;
  détail dans `docs/donnees-b2-04-sources.md`.
