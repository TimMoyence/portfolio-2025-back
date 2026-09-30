# B2-05 · Mathématiques financières : placer, emprunter — conception de référence (gabarit v3)

> Cahier des charges du cours B2-05 au gabarit v3 (`docs/cours-gabarit-v3.md`) : une séance de
> 3 h 30 dont 30 minutes de pause, ouverte par le rappel du B2-01 et du B2-04, puis trois notions
> traitées chacune par un cycle réfléchir → comprendre → s'exercer, et une mini-situation CCF. Ce
> document ne contient aucun code exécutable ; toute divergence d'implémentation est un défaut de
> l'implémentation. Les tests `b2-05.cours.spec.ts` relisent ce document : § 3.1, titres publics du
> § 3, § 5.9, § 8.2.

| Rubrique    | Valeur                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| Date        | 30 septembre 2026                                                                                                   |
| Statut      | **Référence pédagogique** : cinquième cours du plan v3 (`docs/cours-bts-cg2-plan-v3.md`), quatrième au gabarit v3   |
| Cours       | `b2-05-mathematiques-financieres`                                                                                   |
| Gabarit     | `v3`, déclaré par le contenu et contrôlé par les quatre règles `gabarit-*` de `verifierStructure`                   |
| Titre servi | « Mathématiques financières : placer, emprunter »                                                                   |
| Durée       | **180 minutes exactes** (somme des écrans), 4 actes de 49, 39, 47 et 45 minutes, plus 2 pauses de 15 min hors durée |
| Écrans      | **34**, dont 12 écrans catalogue                                                                                    |
| Sources     | `docs/donnees-b2-05-sources.md` (espace de travail) : programme officiel, sujets d'examen, données fictives         |

---

## 0. Synthèse des décisions

- **Une question de gestion : le dossier de financement du second atelier.** Hélène Garnier doit
  montrer à la banque trois lignes de son plan : la trésorerie de 40 000 € placée à 2,5 % par an en
  attendant le chantier ; 6 000 € mis de côté à la fin de chaque année, de 2026 à 2030, à 3 % par
  an, pour les machines ; un emprunt d'équipement de 60 000 € sur 5 ans à 4 %, remboursé par
  annuités constantes. Chaque ligne est une notion du cours.
- **Le cours s'ouvre par le rappel du B2-01 et du B2-04**, et chaque acquis devient une brique du
  jour : le coefficient multiplicateur (B2-01) capitalise, l'évolution réciproque actualise ; la
  suite géométrique (B2-04) est le capital placé, la somme de termes est la valeur acquise d'une
  suite d'annuités.
- **Trois notions** : intérêts composés, valeur acquise et valeur actuelle (N1) ; suites d'annuités
  (N2) ; emprunt à annuités constantes, tableau d'amortissement et coût du crédit (N3).
- **Les formules non exigibles sont données** : la valeur acquise d'annuités constantes et
  l'annuité d'un emprunt s'affichent à l'écran et au livret, comme dans les sujets 2025 et 2026 ;
  l'étudiant les applique, il ne les restitue pas. Au tableur, l'annuité se calcule par `VPM`, dont
  le capital s'écrit avec un signe moins.
- **Le tableau d'amortissement au centre** : il se construit à la main (`fp-table-build`, capital dû
  déduit, intérêts et amortissements saisis), puis au tableur dans la mini-situation, sur le modèle
  des formules C2 et F2 du sujet 2025.
- **Mini-situation sur un contexte neuf** : la camionnette électrique d'Atelier Rivage, 32 000 €
  empruntés sur 4 ans à 3,5 %, avec un placement, une valeur actuelle et une épargne.

## 1. Objectifs d'apprentissage et public

### 1.1 Rattachement au programme officiel

Paragraphe « Mathématiques financières » du module « Analyse de phénomènes exponentiels » : intérêts
composés, valeur actuelle, valeur acquise d'un capital et d'une suite d'annuités, calculées à la
calculatrice ou au tableur ; principes du tableau d'amortissement d'un emprunt. L'expression de la
valeur acquise d'annuités constantes et celle de l'annuité d'un emprunt ne sont pas exigibles
(`docs/programme-bts-cg-maths-officiel.md`, § B2-05).

### 1.2 Objectifs du cours

À la fin de la séance, l'étudiant sait :

1. calculer la valeur acquise d'un capital placé à intérêts composés, et la distinguer des intérêts
   simples ;
2. calculer la valeur actuelle d'une somme future en divisant par (1 + t)ⁿ ;
3. calculer la valeur acquise d'une suite d'annuités, versement par versement ou avec la formule
   donnée ;
4. calculer une annuité constante avec la formule donnée ou `VPM` ;
5. compléter un tableau d'amortissement et calculer le coût du crédit ;
6. écrire les formules recopiables du tableau d'amortissement avec une référence figée par `$`.

### 1.3 Acquis des quatre premiers cours

| Cours | Savoirs installés                                                                                                                                                                                                                  | Réemploi dans le B2-05                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| B2-01 | Proportion, taux d'évolution, coefficient multiplicateur, évolutions successives et réciproque, points de pourcentage, indice, taux moyen, moyenne pondérée, lecture de graphiques, contrôles ; `$`, `SOMME`, `PUISSANCE`, recopie | Capitaliser : × (1 + t) ; actualiser : ÷ (1 + t) ; `$`         |
| B2-02 | Moyenne, médiane, écart-type ; nuage, corrélation ; droite d'ajustement, prévision                                                                                                                                                 | Atelier Rivage et son projet de second atelier                 |
| B2-03 | Connecteurs, implication, négation, quantificateurs ; `SI`, `ET`, `OU`, `NON`, `NB.SI`                                                                                                                                             | Aucun réemploi direct                                          |
| B2-04 | Suites arithmétiques et géométriques, terme général, rang, seuil, somme de termes ; recopie, `SOMME`                                                                                                                               | Capital placé = suite géométrique ; annuités = somme de termes |

### 1.4 Public et conditions

BTS CG 2e année, 25 étudiants au plus, calculatrice autorisée, un poste par étudiant ou le livret
papier. Séance de 3 h 30 : 180 minutes de travail, pause de 15 minutes après l'acte 1 et après
l'acte 3.

## 2. Architecture

### 2.1 Les quatre actes

| Acte | Rôle                                     | Notion | Minutes |
| ---- | ---------------------------------------- | ------ | ------: |
| 1    | Rappel des cours, puis placer un capital | N1     |      49 |
| 2    | Placer chaque année                      | N2     |      39 |
| 3    | Emprunter et rembourser                  | N3     |      47 |
| 4    | Mini-situation CCF et clôture            | —      |      45 |

Pause 1 (15 min) après le jalon A1-12 ; pause 2 (15 min) après le jalon A3-09. Les pauses ne sont
pas des écrans : le formateur les annonce, la durée programmée n'en tient pas compte.

### 2.2 L'ouverture : rappel rapide du B2-01 et du B2-04

Neuf minutes, trois temps : une question de rappel d'ouverture sur le B2-04 (`fp-recall`, une seule
question) ; un vote à deux questions sur le B2-01 et le B2-04, avec révélation commentée ; un écran
de synthèse en trois colonnes, qui dit pour chaque acquis ce qu'il devient aujourd'hui. On interroge
avant de montrer : le rappel de mémoire précède la synthèse.

### 2.3 Le cycle d'une notion

Chaque notion suit : **Réfléchir** (mission, réflexion écrite ou vote non noté) → **Comprendre**
(trace écrite en deux pages v2 `lesson` de 3 minutes, puis exemple guidé `fp-worked` corrigé étape
par étape sur son propre écran) → **S'exercer** (exercices notés, corrigés sur place). Chaque page de
trace écrite porte trois blocs : une définition en langage courant qui dit à quoi sert la notion pour
le dossier d'Hélène, un exemple pour débuter hors du dossier (livret, emprunt d'un particulier) et
une méthode ou un encadré « Au CCF » qui nomme les pièges.

Chaque exercice annonce ses temps dans les notes formateur, sous la forme
`• Temps : réflexion N min · travail N min · correction N min`, dont la somme est la durée de
l'écran. La correction se dévoile sur l'écran de l'exercice (`correctionSurPlace`).

### 2.4 Règles de structure

Le cours passe les règles communes et les quatre règles du gabarit v3 : 34 écrans ≤ 40,
180 minutes ≤ 180, chaque trace écrite précédée d'une réflexion et suivie d'un exercice, chaque
exercice avec ses trois temps et sa correction sur place, mini-situation (`fp-escape`) sans trace
écrite après elle. Exposition continue de 6 minutes au plus.

### 2.5 Diffusion

Catalogue : l'accroche, la synthèse des acquis, le dossier de financement, les six pages de trace
écrite, le graphique d'un emprunt type, le dossier de la mini-situation et la fiche mémo. Tout le
reste est servi en séance. Aucun écran catalogue ne porte une réponse : le graphique montre un
emprunt de 100 000 € qui n'est demandé dans aucun exercice.

### 2.6 Notation

Indices et exposants en caractères Unicode (C₀, Cₙ, (1 + t)ⁿ, 1,025³) dans les traces écrites, les
énoncés et le livret. Les taux s'écrivent en décimal dans les formules (t = 0,04) et en pourcentage
dans les phrases (4 %).

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B2-05-A{acte}-{rang}-{SLUG}`, conformes à `^B2-05-A[1-6]-\d{2}-[A-Z0-9-]+$`.
Colonne « Brique · rendu » : valeur de la colonne `brique` ; les écrans « v2 » sont stockés en
`fp-story` avec une présentation v2. « I » = interactif. « Q » = questions fermées notées (vote,
numérique, classement) portées par l'écran.

| Rang | Identifiant                         | Min | Brique · rendu               |  I  |   Q | Diffusion |
| ---: | ----------------------------------- | --: | ---------------------------- | :-: | --: | --------- |
|    1 | B2-05-A1-01-RAPPEL-SUITE            |   3 | `fp-recall`                  |  I  |   1 | seance    |
|    2 | B2-05-A1-02-ACCROCHE                |   1 | `fp-story` · v2 `hero`       |     |   0 | catalogue |
|    3 | B2-05-A1-03-VOTE-ACQUIS             |   4 | `fp-vote`                    |  I  |   0 | seance    |
|    4 | B2-05-A1-04-ACQUIS                  |   2 | `fp-story` · v2 `comparison` |     |   0 | catalogue |
|    5 | B2-05-A1-05-DOSSIER                 |   2 | `fp-story` · v2 `table`      |     |   0 | catalogue |
|    6 | B2-05-A1-06-MISSION                 |   6 | `fp-pro`                     |  I  |   0 | seance    |
|    7 | B2-05-A1-07-COURS-INTERETS-COMPOSES |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|    8 | B2-05-A1-08-COURS-VALEUR-ACTUELLE   |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|    9 | B2-05-A1-09-EXEMPLE-PLACEMENT       |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   10 | B2-05-A1-10-ATELIER-PLACEMENT       |  10 | `questionnaire`              |  I  |   4 | seance    |
|   11 | B2-05-A1-11-TABLEUR-PLACEMENT       |   8 | `fp-sheet`                   |  I  |   0 | seance    |
|   12 | B2-05-A1-12-JALON                   |   1 | `fp-pulse`                   |     |   0 | seance    |
|   13 | B2-05-A2-01-REFLEXION-VERSEMENTS    |   5 | `fp-story` · v2 `reflection` |  I  |   0 | seance    |
|   14 | B2-05-A2-02-COURS-ANNUITES          |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   15 | B2-05-A2-03-COURS-ANNUITES-TABLEUR  |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   16 | B2-05-A2-04-EXEMPLE-ANNUITES        |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   17 | B2-05-A2-05-ATELIER-ANNUITES        |  11 | `questionnaire`              |  I  |   4 | seance    |
|   18 | B2-05-A2-06-TABLEUR-EPARGNE         |  10 | `fp-sheet`                   |  I  |   0 | seance    |
|   19 | B2-05-A2-07-JALON                   |   1 | `fp-pulse`                   |     |   0 | seance    |
|   20 | B2-05-A3-01-GRAPHIQUE               |   2 | `fp-story` · v2 `chart`      |     |   0 | catalogue |
|   21 | B2-05-A3-02-VOTE-EMPRUNT            |   4 | `fp-vote`                    |  I  |   0 | seance    |
|   22 | B2-05-A3-03-COURS-EMPRUNT           |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   23 | B2-05-A3-04-COURS-COUT-TABLEUR      |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   24 | B2-05-A3-05-EXEMPLE-EMPRUNT         |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   25 | B2-05-A3-06-ATELIER-EMPRUNT         |  10 | `questionnaire`              |  I  |   4 | seance    |
|   26 | B2-05-A3-07-TABLEAU-AMORTISSEMENT   |   8 | `fp-table-build`             |  I  |   0 | seance    |
|   27 | B2-05-A3-08-DEFI-IA                 |  10 | `fp-challenge`               |  I  |   0 | seance    |
|   28 | B2-05-A3-09-JALON                   |   1 | `fp-pulse`                   |     |   0 | seance    |
|   29 | B2-05-A4-01-SITUATION-CAMIONNETTE   |   3 | `fp-story` · v2 `table`      |     |   0 | catalogue |
|   30 | B2-05-A4-02-TABLEUR-CAMIONNETTE     |  16 | `fp-sheet`                   |  I  |   0 | seance    |
|   31 | B2-05-A4-03-COFFRE-CAMIONNETTE      |  14 | `fp-escape`                  |  I  |   0 | seance    |
|   32 | B2-05-A4-04-RAPPEL                  |   6 | `fp-spaced`                  |  I  |   0 | seance    |
|   33 | B2-05-A4-05-FICHE-MEMO              |   2 | `fp-story` · v2 `grid`       |     |   0 | catalogue |
|   34 | B2-05-A4-06-BILLET-DE-SORTIE        |   4 | `fp-exit`                    |  I  |   1 | seance    |

Rythme : 147 minutes interactives, 33 d'exposition, exposition continue de 6 minutes au plus.

### 3.2 Acte 1 — Rappel des cours, puis placer un capital (49 min)

#### A1-01 · `B2-05-A1-01-RAPPEL-SUITE` — 3 min · `fp-recall` · séance

- Titre public : « Rappel du B2-04 : un capital qui gagne 2 % par an »
- Énoncé (`b2-05-a1-rappel-suite`) : quelle suite modélise un capital qui augmente de 2 % chaque
  année ? Bonne réponse : une suite géométrique de raison 1,02 ; pièges
  `coefficient-confondu-avec-taux`, `nature-de-suite-confondue`.
- Papier : question en tête du livret, vote à main levée.

#### A1-02 · `B2-05-A1-02-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Placer, emprunter : le prix du temps »
- Atelier Rivage et son dossier de financement ; plan en trois notions et une mini-situation.

#### A1-03 · `B2-05-A1-03-VOTE-ACQUIS` — 4 min · `fp-vote` · séance

- Titre public : « Vote : deux rappels, B2-01 et B2-04 »
- Deux votes non notés, révélation commentée : le coefficient qui annule une hausse de 25 %
  (`reciproque-meme-taux`) ; le nombre de termes du rang 0 au rang 4 (`nombre-de-termes-decale`).

#### A1-04 · `B2-05-A1-04-ACQUIS` — 2 min · v2 `comparison` · catalogue

- Titre public : « Ce que vous savez déjà »
- Trois colonnes : le coefficient multiplicateur et la réciproque (B2-01), la suite géométrique et
  la somme de termes (B2-04), le tableur ; puis leur emploi du jour. Trois lignes courtes par
  colonne : l'écran tient dans la toile 1280 × 720 sans descendre sous l'échelle 0,8.

#### A1-05 · `B2-05-A1-05-DOSSIER` — 2 min · v2 `table` · catalogue

- Titre public : « Le dossier de financement d’Atelier Rivage »
- Le projet, la trésorerie placée, l'épargne des machines, l'emprunt d'équipement et la question de
  la banque. Mention « Données fictives ».

#### A1-06 · `B2-05-A1-06-MISSION` — 6 min · `fp-pro` · séance

- Titre public : « Votre mission : le dossier de financement »
- Courriel d'Hélène Garnier, remarque de Marc Lefèvre sur l'emprunt. Trois questions libres, temps
  « réfléchir » de N1 : les intérêts du placement sont-ils les mêmes chaque année (`placement`) ;
  cinq versements de 6 000 € font-ils 30 000 € (`epargne`) ; rembourser 12 000 € par an
  suffit-il (`emprunt`).
- Papier : trois lignes d'écriture dans le livret.

#### A1-07 · `B2-05-A1-07-COURS-INTERETS-COMPOSES` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : intérêts composés et valeur acquise »
- Page 1 sur 2 : intérêts simples et intérêts composés, valeur acquise Cₙ = C₀ × (1 + t)ⁿ (lien
  B2-04) ; exemple pour débuter (le livret à 3 %) ; méthode et pièges.

#### A1-08 · `B2-05-A1-08-COURS-VALEUR-ACTUELLE` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : valeur actuelle et tableur »
- Page 2 sur 2 : valeur actuelle C₀ = Cₙ ÷ (1 + t)ⁿ (lien B2-01, évolution réciproque) ; le
  placement au tableur, taux figé par `$` ; au CCF, capitaliser ou actualiser.

#### A1-09 · `B2-05-A1-09-EXEMPLE-PLACEMENT` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : placer 8 000 € à 2 % »
- Coefficient, deux premières valeurs, valeur acquise au bout de 5 ans, comparaison avec les
  intérêts simples, valeur actuelle de 10 000 € dans 5 ans. 4 min de réponses, puis 2 min de
  correction dévoilée étape par étape.

#### A1-10 · `B2-05-A1-10-ATELIER-PLACEMENT` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 1 — Placer la trésorerie »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, question par question sur place.
- `b2-05-a1-coefficient` (vote) : le coefficient annuel ; piège `coefficient-confondu-avec-taux`.
- `b2-05-a1-valeur-acquise` : valeur acquise au bout de 3 ans ; pièges
  `interets-simples-au-lieu-de-composes`, `rang-decale`.
- `b2-05-a1-actualiser` (vote) : le calcul de la somme à placer ; pièges `actualisation-inversee`,
  `interets-simples-au-lieu-de-composes`.
- `b2-05-a1-valeur-actuelle` : valeur actuelle de 50 000 € dans 3 ans ; pièges
  `actualisation-inversee`, `interets-simples-au-lieu-de-composes`.

#### A1-11 · `B2-05-A1-11-TABLEUR-PLACEMENT` — 8 min · `fp-sheet` · séance

- Titre public : « Exercice 2 — Le placement au tableur »
- Temps : réflexion 1 min · travail 5 min · correction 2 min sur place.
- Du 1er janvier 2026 au 1er janvier 2031, taux en G1 : valeur acquise en colonne C (formule
  recopiée, taux figé), intérêts de l'année en colonne D. Dix cellules attendues ; pièges
  `coefficient-confondu-avec-taux`, `reference-relative-non-figee`,
  `interets-simples-au-lieu-de-composes`.

#### A1-12 · `B2-05-A1-12-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 1 : intérêts composés »
- Puis pause de 15 minutes.

### 3.3 Acte 2 — Placer chaque année (39 min)

#### A2-01 · `B2-05-A2-01-REFLEXION-VERSEMENTS` — 5 min · v2 `reflection` · séance

- Titre public : « Réfléchir : 6 000 € par an pendant cinq ans »
- Un stagiaire place les cinq versements pendant cinq ans (5 × 6 000 × 1,03⁵). Dire s'il a raison,
  versement par versement. Temps « réfléchir » de N2.

#### A2-02 · `B2-05-A2-02-COURS-ANNUITES` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : suite d’annuités et valeur acquise »
- Page 1 sur 2 : annuités, valeur acquise au dernier versement = somme des valeurs acquises de
  chaque versement (lien B2-04), formule donnée ; exemple pour débuter (1 000 € par an à 2 %) ;
  méthode et pièges.

#### A2-03 · `B2-05-A2-03-COURS-ANNUITES-TABLEUR` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : les annuités au tableur »
- Page 2 sur 2 : le tableau d'épargne (épargne de l'an passé, plus ses intérêts, plus le
  versement), taux et versement figés ; total des intérêts avec `SOMME` ; au CCF.

#### A2-04 · `B2-05-A2-04-EXEMPLE-ANNUITES` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : 1 500 € par an à 2,5 % »
- Quatre versements de fin d'année : durée de placement de chacun, valeurs acquises, somme, formule
  donnée, intérêts gagnés.

#### A2-05 · `B2-05-A2-05-ATELIER-ANNUITES` — 11 min · `questionnaire` · séance

- Titre public : « Exercice 3 — L’épargne des machines »
- Temps : réflexion 2 min · travail 7 min · correction 2 min, question par question sur place.
- `b2-05-a2-duree` (vote) : durée de placement du premier versement ; piège
  `versements-places-toute-la-duree`.
- `b2-05-a2-premier` : valeur du premier versement fin 2030 ; pièges
  `versements-places-toute-la-duree`, `interets-simples-au-lieu-de-composes`.
- `b2-05-a2-expression` (vote) ; pièges `versements-places-toute-la-duree`,
  `versements-sans-interets`.
- `b2-05-a2-valeur-acquise` : épargne disponible fin 2030 ; pièges `versements-sans-interets`,
  `versements-places-toute-la-duree`.

#### A2-06 · `B2-05-A2-06-TABLEUR-EPARGNE` — 10 min · `fp-sheet` · séance

- Titre public : « Exercice 4 — L’épargne au tableur »
- Temps : réflexion 2 min · travail 6 min · correction 2 min sur place.
- Fins d'année 2026 à 2030, taux en F1 et versement en H1 : épargne disponible en colonne B,
  intérêts de l'année en colonne C, total des intérêts en F3. Neuf cellules attendues ; pièges
  `versements-sans-interets`, `reference-relative-non-figee`,
  `interets-simples-au-lieu-de-composes`, `terme-pris-pour-somme`.

#### A2-07 · `B2-05-A2-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : suites d’annuités »

### 3.4 Acte 3 — Emprunter et rembourser (47 min)

#### A3-01 · `B2-05-A3-01-GRAPHIQUE` — 2 min · v2 `chart` · catalogue

- Titre public : « Un emprunt remboursé par annuités constantes »
- Emprunt type de 100 000 € sur 10 ans à 5 % : intérêts et amortissement de chaque annuité, en
  barres. Les intérêts baissent, l'amortissement monte, leur somme reste constante.

#### A3-02 · `B2-05-A3-02-VOTE-EMPRUNT` — 4 min · `fp-vote` · séance

- Titre public : « Vote : rembourser et payer les intérêts »
- Deux votes non notés (temps « réfléchir » de N3) : ce qu'une annuité rembourse vraiment
  (`annuite-confondue-avec-amortissement`) ; le coût d'un crédit
  (`cout-credit-confondu-avec-total-rembourse`).

#### A3-03 · `B2-05-A3-03-COURS-EMPRUNT` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : emprunt et tableau d’amortissement »
- Page 1 sur 2 : annuité = intérêts + amortissement, intérêts sur le capital restant dû, formule
  donnée de l'annuité ; exemple pour débuter (10 000 € sur 3 ans à 5 %) ; méthode ligne par ligne.

#### A3-04 · `B2-05-A3-04-COURS-COUT-TABLEUR` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : coût du crédit et tableur »
- Page 2 sur 2 : coût du crédit, `VPM` et son signe, formules recopiables du tableau
  d'amortissement ; au CCF, les formules C2 et F2 d'un sujet.

#### A3-05 · `B2-05-A3-05-EXEMPLE-EMPRUNT` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : emprunter 24 000 € à 3 % »
- Annuité avec la formule donnée, trois lignes du tableau, coût du crédit par deux calculs.

#### A3-06 · `B2-05-A3-06-ATELIER-EMPRUNT` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 5 — L’emprunt de 60 000 € »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, question par question sur place.
- Le questionnaire précède le tableau : le tableau donne l'annuité, qui est la réponse de la
  première question.
- `b2-05-a3-annuite` : l'annuité avec la formule rappelée ; pièges
  `annuite-confondue-avec-amortissement`, `interets-sur-capital-initial`.
- `b2-05-a3-base` (vote) : le capital sur lequel portent les intérêts de la deuxième année ; piège
  `interets-sur-capital-initial`.
- `b2-05-a3-cout` : coût du crédit ; pièges `cout-credit-confondu-avec-total-rembourse`,
  `interets-sur-capital-initial`.
- `b2-05-a3-vpm` (vote) : la formule `VPM` ; pièges `capital-de-vpm-non-signe`,
  `annuite-confondue-avec-amortissement`.

#### A3-07 · `B2-05-A3-07-TABLEAU-AMORTISSEMENT` — 8 min · `fp-table-build` · séance

- Titre public : « Exercice 6 — Le tableau d’amortissement »
- Temps : réflexion 1 min · travail 5 min · correction 2 min sur place.
- Emprunt de 60 000 € sur 5 ans à 4 %, annuité donnée : le capital dû en début d'année se déduit,
  on saisit les intérêts et l'amortissement de chaque année ; totaux et capital restant dû final en
  contrôle. Pièges : `interets-sur-capital-initial`, `annuite-confondue-avec-amortissement`.

#### A3-08 · `B2-05-A3-08-DEFI-IA` — 10 min · `fp-challenge` · séance

- Titre public : « Exercice 7 — Corriger le calcul d’une IA »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, piste par piste sur place.
- L'IA ajoute au capital divisé par la durée les intérêts de la première année, garde ces intérêts
  chaque année et prend le total remboursé pour le coût. Pistes justes : formule de l'annuité,
  capital restant dû, coût, contrôle par la somme des amortissements ; piste fausse : garder le
  calcul.

#### A3-09 · `B2-05-A3-09-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 3 : emprunts »
- Puis pause de 15 minutes.

### 3.5 Acte 4 — Mini-situation CCF et clôture (45 min)

#### A4-01 · `B2-05-A4-01-SITUATION-CAMIONNETTE` — 3 min · v2 `table` · catalogue

- Titre public : « Mini-situation CCF : la camionnette électrique »
- Dossier : emprunt de 32 000 € sur 4 ans à 3,5 %, formule rappelée, placement de 15 000 €, batterie
  de 20 000 € à payer dans 4 ans, épargne de 5 000 € par an à 2 %, barème sur 10. Mention
  « Données fictives ».

#### A4-02 · `B2-05-A4-02-TABLEUR-CAMIONNETTE` — 16 min · `fp-sheet` · séance

- Titre public : « Question tableur (3 points sur 10) : le tableau d’amortissement »
- Temps : réflexion 3 min · travail 11 min · correction 2 min sur place.
- Années 1 à 4 en colonne A, 32 000 € en B2 ; paramètres en ligne 2 sous leurs libellés de la
  ligne 1 : taux 0,035 en F2, durée 4 en G2. Annuité en H2 (`=VPM(F2;G2;-B2)`), intérêts en
  colonne C (`=B2*$F$2`), amortissement en colonne D (`=$H$2-C2`), capital dû en fin d'année en
  colonne E (`=B2-D2`, comparé au centime), report en colonne B (`=E2`), coût du crédit en I2
  (`=H2*G2-B2`).
  Neuf colonnes, sans colonne vide : dix colonnes de champs ne tiennent pas dans la toile du poste
  étudiant (QF-28).
  Dix-sept cellules attendues ; pièges `capital-de-vpm-non-signe`,
  `annuite-confondue-avec-amortissement`, `reference-relative-non-figee`,
  `interets-sur-capital-initial`, `cout-credit-confondu-avec-total-rembourse`.

#### A4-03 · `B2-05-A4-03-COFFRE-CAMIONNETTE` — 14 min · `fp-escape` · séance

- Titre public : « Mini-situation : boucler le financement de la camionnette »
- Temps : réflexion 2 min · travail 10 min · correction 2 min sur place, énigme par énigme.
- E1 valeur acquise du placement (2 points ; `interets-simples-au-lieu-de-composes`,
  `rang-decale`) ; E2 valeur actuelle de la batterie (2 points ; `actualisation-inversee`,
  `interets-simples-au-lieu-de-composes`) ; E3 valeur acquise de l'épargne (1,5 point ;
  `versements-sans-interets`, `versements-places-toute-la-duree`) ; E4 coût du crédit (1,5 point ;
  `cout-credit-confondu-avec-total-rembourse`, `interets-sur-capital-initial`).
- Papier : quatre questions rédigées du livret, sans code de coffre.

#### A4-04 · `B2-05-A4-04-RAPPEL` — 6 min · `fp-spaced` · séance

- Titre public : « Rappel : de mémoire, sans vos notes »

#### A4-05 · `B2-05-A4-05-FICHE-MEMO` — 2 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : placer, emprunter »

#### A4-06 · `B2-05-A4-06-BILLET-DE-SORTIE` — 4 min · `fp-exit` · séance

- Titre public : « Billet de sortie : la formule des intérêts »

## 4. Mode papier

Le livret étudiant reprend, dans l'ordre des écrans, les traces écrites, les énoncés, les formules
données et un cadre de réponse par question ; il ne contient aucune bonne réponse. Le corrigé
formateur ajoute les réponses, les pièges et le barème. Sans poste, le formateur pilote les
révélations depuis le pupitre ; les votes se font à main levée, les formules s'écrivent sur la
copie, les valeurs se calculent à la calculatrice (touche puissance) et le tableau d'amortissement
se remplit à la main.

## 5. Contenus

### 5.1 Les valeurs du dossier

Placement de la trésorerie, 40 000 € à 2,5 % : 41 000 ; 42 025 ; 43 075,63 ; 44 152,52 ;
45 256,33 € après 1 à 5 ans. Intérêts simples sur 3 ans : 43 000 €. Valeur actuelle de 50 000 €
dans 3 ans : 46 429,97 €.

Épargne des machines, 6 000 € en fin d'année de 2026 à 2030 à 3 % : 6 000 ; 12 180 ; 18 545,40 ;
25 101,76 ; 31 854,81 €. Intérêts cumulés : 1 854,81 €. Premier versement fin 2030 :
6 753,05 €.

| Année | Capital dû en début d'année (€) | Intérêts (€) | Amortissement (€) | Annuité (€) | Capital dû en fin d'année (€) |
| ----: | ------------------------------: | -----------: | ----------------: | ----------: | ----------------------------: |
|     1 |                       60 000,00 |     2 400,00 |         11 077,63 |   13 477,63 |                     48 922,37 |
|     2 |                       48 922,37 |     1 956,89 |         11 520,74 |   13 477,63 |                     37 401,63 |
|     3 |                       37 401,63 |     1 496,07 |         11 981,56 |   13 477,63 |                     25 420,07 |
|     4 |                       25 420,07 |     1 016,80 |         12 460,83 |   13 477,63 |                     12 959,24 |
|     5 |                       12 959,24 |       518,37 |         12 959,26 |   13 477,63 |                         −0,02 |

Emprunt d'équipement, 60 000 € sur 5 ans à 4 %, tableau de l'exercice 6 tenu comme sur la copie :
annuité arrondie à 13 477,63 €, intérêts et amortissements arrondis au centime à chaque ligne.
Coût du crédit 5 × 13 477,63 − 60 000 = 7 388,15 €, somme des intérêts 7 388,13 € ; l'écart de 2
centimes, qui est aussi le solde final de −0,02 €, vient de l'arrondi de l'annuité. La correction
de l'exercice 6 l'explique.

Camionnette, 32 000 € sur 4 ans à 3,5 % : annuité 8 712,04 € ; intérêts 1 120,00 ; 854,28 ;
579,26 ; 294,61 € ; coût 2 848,15 €. Coffre : 15 000 × 1,02⁴ = 16 236,48 € ;
20 000 ÷ 1,02⁴ = 18 476,91 € ; 5 000 × (1,02⁴ − 1) ÷ 0,02 = 20 608,04 €.

Chaque valeur est recalculée par `b2-05.cours.spec.ts` à partir des seuls paramètres.

### 5.9 Concepts, confusions et remédiations

**Concepts** : `interets-composes`, `valeur-actuelle`, `annuites`, `tableau-d-amortissement`,
`cout-du-credit` (nouveaux), `tableur`, et les concepts interrogés par le rappel des cours
précédents : `suite-geometrique`, `somme-de-termes`, `coefficient-multiplicateur`,
`evolution-reciproque`.
**Confusions** : quinze, dont huit nouvelles (`interets-simples-au-lieu-de-composes`,
`actualisation-inversee`, `versements-sans-interets`, `versements-places-toute-la-duree`,
`interets-sur-capital-initial`, `annuite-confondue-avec-amortissement`,
`cout-credit-confondu-avec-total-rembourse`, `capital-de-vpm-non-signe`).

| Identifiant                                 | Concept                    | Libellé                                                     | Remédiation                         |
| ------------------------------------------- | -------------------------- | ----------------------------------------------------------- | ----------------------------------- |
| `coefficient-confondu-avec-taux`            | coefficient-multiplicateur | Prendre le taux pour le coefficient.                        | B2-05-A1-07-COURS-INTERETS-COMPOSES |
| `nature-de-suite-confondue`                 | suite-geometrique          | Confondre « ajouter » et « multiplier ».                    | B2-05-A1-07-COURS-INTERETS-COMPOSES |
| `interets-simples-au-lieu-de-composes`      | interets-composes          | Calculer les intérêts sur le seul capital de départ.        | B2-05-A1-07-COURS-INTERETS-COMPOSES |
| `rang-decale`                               | suite-arithmetique         | Placer une année de trop ou de moins.                       | B2-05-A1-07-COURS-INTERETS-COMPOSES |
| `actualisation-inversee`                    | valeur-actuelle            | Multiplier au lieu de diviser pour actualiser.              | B2-05-A1-08-COURS-VALEUR-ACTUELLE   |
| `reciproque-meme-taux`                      | evolution-reciproque       | Annuler une hausse par une baisse du même taux.             | B2-05-A1-08-COURS-VALEUR-ACTUELLE   |
| `reference-relative-non-figee`              | tableur                    | Recopier sans figer la cellule du taux.                     | B2-05-A1-08-COURS-VALEUR-ACTUELLE   |
| `versements-sans-interets`                  | annuites                   | Additionner les versements sans leurs intérêts.             | B2-05-A2-02-COURS-ANNUITES          |
| `versements-places-toute-la-duree`          | annuites                   | Placer chaque versement pendant toute la durée.             | B2-05-A2-02-COURS-ANNUITES          |
| `nombre-de-termes-decale`                   | somme-de-termes            | Compter un terme de trop ou de moins.                       | B2-05-A2-02-COURS-ANNUITES          |
| `terme-pris-pour-somme`                     | somme-de-termes            | Donner le dernier terme pour la somme.                      | B2-05-A2-03-COURS-ANNUITES-TABLEUR  |
| `interets-sur-capital-initial`              | tableau-d-amortissement    | Calculer les intérêts sur le capital emprunté chaque année. | B2-05-A3-03-COURS-EMPRUNT           |
| `annuite-confondue-avec-amortissement`      | tableau-d-amortissement    | Prendre l'annuité pour le capital remboursé.                | B2-05-A3-03-COURS-EMPRUNT           |
| `cout-credit-confondu-avec-total-rembourse` | cout-du-credit             | Donner le total remboursé pour le coût.                     | B2-05-A3-04-COURS-COUT-TABLEUR      |
| `capital-de-vpm-non-signe`                  | tableur                    | Écrire le capital sans signe moins dans `VPM`.              | B2-05-A3-04-COURS-COUT-TABLEUR      |

### 5.10 Rappels espacés

Douze rappels : coefficient d'un placement, intérêts composés sur deux ans, valeur actuelle, sens de
l'actualisation, durée de placement d'un versement, valeur acquise et total versé, base des intérêts
d'un emprunt, amortissement d'une annuité, évolution des intérêts, coût du crédit, signe de `VPM`,
référence figée. Obligatoires : `b2-05-r-valeur-actuelle` et `b2-05-r-interets-emprunt`.

## 6. Moteur de formules

La mini-situation et le cours demandent `VPM(taux; npm; va; [vc]; [type])`, absente des quatre
premiers cours. Elle entre dans les deux moteurs (serveur et poste) avec la convention du tableur :
un capital emprunté positif donne une annuité négative, d'où `-B2` dans la formule attendue. Taux
nul : − (va + vc) ÷ npm ; nombre de périodes nul : `#DIV/0!` ; nombre d'arguments hors de 3 à 5 :
`#VALEUR!`. Les vecteurs de formule partagés entre les deux moteurs couvrent ces cas.

## 8. Médias

### 8.1 Principe

Aucune image : les dossiers sont rendus par `table`, l'emprunt type par `chart`, les feuilles par
`fp-sheet`, le tableau d'amortissement par `fp-table-build`.

### 8.2 Catalogue des médias

Aucun média catalogué.

### 8.3 Sources des données

- Trésorerie, épargne des machines, emprunt d'équipement, camionnette, placement, batterie et
  épargne de la mini-situation, exemples guidés : données fictives créées pour ce cours.
- Forme de la mini-situation : sujets ponctuels 2025 (exercice 2, partie C) et 2026 (exercice 2,
  partie C), recensés dans `docs/programme-bts-cg-maths-officiel.md` ; détail dans
  `docs/donnees-b2-05-sources.md`.
