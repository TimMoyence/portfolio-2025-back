# B1-01 · Proportions et pourcentages — conception de référence (gabarit v3)

> Cahier des charges du cours B1-01 au gabarit v3 (`docs/cours-gabarit-v3.md`) : premier cours de
> mathématiques des BTS CG 1re année, et première séance des étudiants sur la plateforme. Une séance
> de 3 h 30 réelles pour 160 minutes programmées : diagnostic des acquis du lycée, trois notions
> traitées chacune par un cycle réfléchir → comprendre → s'exercer, et une mini-situation CCF. Le
> texte est écrit court dès la conception, sur le modèle du B2-04 allégé. Ce document ne contient
> aucun code exécutable ; toute divergence d'implémentation est un défaut de l'implémentation. Les
> tests `b1-01.cours.spec.ts` relisent ce document : § 3.1, titres publics du § 3, § 5.9, § 8.2.

| Rubrique    | Valeur                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Date        | 20 octobre 2026                                                                                                                |
| Statut      | **Conception validée le 20 octobre 2026** : premier cours du plan BTS CG 1 (B1-01 → B1-12), premier au gabarit v3 en 1re année |
| Cours       | `b1-01-proportions-pourcentages`                                                                                               |
| Gabarit     | `v3`, déclaré par le contenu et contrôlé par les quatre règles `gabarit-*` de `verifierStructure`                              |
| Niveau      | `B1` (nouveau constructeur `moteur.coursB1`, même forme que `coursB2`)                                                         |
| Titre servi | « Proportions et pourcentages »                                                                                                |
| Séance      | Semaine du 26 octobre 2026, BTS CG 1re année                                                                                   |
| Durée       | **160 minutes exactes** (somme des écrans), 4 actes de 49, 36, 37 et 38 minutes, plus 2 pauses de 15 min hors durée            |
| Écrans      | **37**, dont 16 écrans catalogue (6 illustrations)                                                                             |
| Sources     | Programme officiel du BTS CG (module « Information chiffrée »), forme de la CCF n° 1 ; données fictives Partie Libre           |

---

## 0. Synthèse des décisions

- **160 minutes pour 3 h 30 réelles.** Les séances B2 montrent que la réflexion déborde toujours ce
  que les notes annoncent. Le B1-01 programme 160 minutes et deux pauses de 15 minutes : il reste
  20 minutes de marge pour la prise en main du poste et les réflexions qui s'allongent. Peu
  d'exposition (29 minutes, jalons compris), des exercices de 9 à 13 minutes.
- **Premier cours, premier contact avec la plateforme.** Pas de rappel d'un cours précédent : la
  séance s'ouvre sur un diagnostic des pourcentages du lycée, sans calculatrice (une question de
  rappel, puis un vote à deux questions). Les notes formateur prévoient la prise en main : rejoindre
  la séance, répondre, voir sa réponse comptée au pupitre.
- **Un nouveau fil rouge pour la série B1 : Partie Libre.** Réseau fictif de quatre boutiques-bars à
  jeux (jeux de société, consoles et jeux vidéo reconditionnés), à Nantes, Angers, Tours et Le Mans.
  L'étudiant y joue l'alternant·e assistant·e de gestion : la plupart des 1re année sont eux-mêmes
  en alternance. Le réseau porte naturellement des effectifs à répartir (salariés, alternants,
  clients), des proportions de proportions (carte de fidélité, réservations en ligne), un taux global
  pondéré (fidélité des quatre boutiques) et des prix d'achat et de vente (consoles, manettes).
- **Trois notions** : proportion, pourcentage et population de référence (N1) ; proportion de
  proportion et taux global (N2) ; proportion ou évolution : point de pourcentage, taux de marge et
  taux de marque (N3).
- **Le tableur dès le premier cours** : `SOMME` pour le total, la part `=ARRONDI(B2/$B$6*100;1)` à
  recopier, le total figé par `$`. Trois fonctions ou notions de tableur, sous le plafond de cinq.
- **Traces écrites courtes, illustrées** : chaque page tient en une définition de deux lignes, des
  formules une par ligne, un exemple pour débuter hors du fil rouge, une méthode de trois ou quatre
  lignes titrée par un moyen mnémotechnique. Pas d'encadré « Au CCF ». Chaque page est précédée de
  l'infographie de son exemple (six infographies : § 8).
- **Mini-situation sur un contexte neuf, écrite pour le cours** : le Week-end du jeu, festival
  organisé par Partie Libre. Question tableur sur la répartition des 960 billets (formule de la part
  en C3, recopiée vers le bas), puis quatre énigmes, une par capacité du cours. Elle prépare la
  situation CCF n° 1.

## 1. Objectifs d'apprentissage et public

### 1.1 Rattachement au programme officiel

Module « Information chiffrée » du BTS CG, unité U3 – Mathématiques appliquées. Objectifs cités du
référentiel : « différencier l'expression d'une proportion de celle d'une variation relative ;
acquérir une pratique aisée de techniques élémentaires de calcul sur les pourcentages ; développer
une attitude critique vis-à-vis des informations chiffrées et favoriser un usage raisonné des outils
numériques et en particulier du tableur ». Le programme souligne « l'importance de la population de
référence ». La première situation de CCF (55 minutes, avant la fin de la 1re année) porte sur ce
module et réserve 3 points sur 10 au tableur. Les évolutions (coefficient multiplicateur,
évolutions successives, indices) sont l'objet du B1-02 : le B1-01 n'en garde que le taux
d'évolution, pour le distinguer d'un écart en points.

### 1.2 Objectifs du cours

À la fin de la séance, l'étudiant sait :

1. calculer une proportion (partie ÷ total), l'écrire en décimal et en pourcentage ;
2. retrouver une partie (p × total) ou un total (partie ÷ p) ;
3. nommer la population de référence d'un pourcentage (« parmi qui ? ») ;
4. calculer une proportion de proportion en multipliant les proportions ;
5. calculer un taux global comme moyenne des taux pondérée par les effectifs ;
6. distinguer une proportion d'une évolution, exprimer en points l'écart de deux pourcentages ;
7. calculer un taux de marge (÷ coût d'achat HT) et un taux de marque (÷ prix de vente HT) ;
8. écrire au tableur un total (`SOMME`) et une part arrondie (`ARRONDI`), recopiable grâce au total
   figé par `$`.

### 1.3 Acquis du lycée

| Acquis supposé (seconde, première et terminale STMG) | Diagnostic                 | Réemploi dans le B1-01       |
| ---------------------------------------------------- | -------------------------- | ---------------------------- |
| Calculer t % d'une quantité                          | A1-03 (15 % de 80 €)       | Partie = p × total (N1)      |
| Calculer une proportion, l'écrire en %               | A1-01 (50 clients sur 200) | Toute la séance              |
| Calculer un taux d'évolution                         | A1-03 (50 € → 60 €)        | Points ou pourcentage (N3)   |
| Tableur : saisir une formule, la recopier            | aucun                      | Exercice 2 et mini-situation |

### 1.4 Public et conditions

BTS CG 1re année, 25 étudiants au plus, bacs STMG en majorité, niveau hétérogène. Calculatrice
autorisée sauf au diagnostic et à la mission. Un poste par étudiant ou le livret papier. Séance de
3 h 30 : 160 minutes programmées, pause de 15 minutes après l'acte 1 et après l'acte 3, 20 minutes
de marge.

## 2. Architecture

### 2.1 Les quatre actes

| Acte | Rôle                                                 | Notion | Minutes |
| ---- | ---------------------------------------------------- | ------ | ------: |
| 1    | Diagnostic, puis la partie sur le tout               | N1     |      49 |
| 2    | Une partie d'une partie, un taux pour tout le réseau | N2     |      36 |
| 3    | Points, évolutions, marge et marque                  | N3     |      37 |
| 4    | Mini-situation CCF et clôture                        | —      |      38 |

Pause 1 (15 min) après le jalon A1-11 ; pause 2 (15 min) après le jalon A3-07. Les pauses ne sont
pas des écrans : le formateur les annonce, la durée programmée n'en tient pas compte.

### 2.2 L'ouverture : diagnostic et prise en main

Neuf minutes, trois temps : une question de rappel (`fp-recall`) qui vérifie en même temps que tous
les postes ont rejoint la séance ; l'accroche ; un vote à deux questions sur les pourcentages du
lycée, avec révélation commentée. Le formateur ne corrige pas un cours de lycée : il repère au
pupitre les étudiants à suivre pendant les exercices.

### 2.3 Le cycle d'une notion

Chaque notion suit : **Réfléchir** (mission, réflexion écrite ou vote non noté) → **Comprendre**
(deux pages v2 `lesson` de 2 minutes, chacune précédée d'1 minute sur l'illustration de son exemple, puis un exemple guidé `fp-worked` corrigé étape par étape sur
son propre écran) → **S'exercer** (exercices notés, corrigés sur place). Chaque page se lit d'un coup d'œil : une
définition en deux lignes, formules une par ligne ; un exemple pour débuter hors du dossier ; une
méthode en trois ou quatre lignes courtes, titrée par un moyen mnémotechnique (« La partie sur le
tout », « Parmi qui ? », « Parmi → je multiplie », « Des personnes, pas des pourcentages »,
« Deux % qu'on soustrait : des points », « La marque se lit sur l'étiquette »). Pas d'encadré
« Au CCF » : les pièges sont travaillés dans les exercices et leurs corrections.

Chaque exercice annonce ses temps dans les notes formateur, sous la forme
`• Temps : réflexion N min · travail N min · correction N min`, dont la somme est la durée de
l'écran. La correction se dévoile sur l'écran de l'exercice (`correctionSurPlace`).

### 2.4 Règles de structure

Le cours passe les règles communes et les quatre règles du gabarit v3 : 37 écrans ≤ 40,
160 minutes ≤ 180, chaque trace écrite précédée d'une réflexion et suivie d'un exercice, chaque
exercice avec ses trois temps et sa correction sur place, mini-situation (`fp-escape`) sans trace
écrite après elle. Exposition continue de 6 minutes au plus (les deux pages d'une notion et leurs illustrations).

### 2.5 Diffusion

Catalogue : l'accroche, le dossier de Partie Libre, les six pages de trace écrite et leurs six illustrations, le dossier de la
mini-situation et la fiche mémo. Tout le reste est servi en
séance. Aucun écran catalogue ne porte une réponse d'exercice.

### 2.6 Notation et écriture

Proportions en décimal dans les calculs (0,25), en pourcentage dans les phrases (25 %). Un écart de
deux pourcentages s'écrit en points (« + 6 points »), jamais « + 6 % ». Montants HT partout en N3.
Parts arrondies au dixième de pourcentage quand elles ne tombent pas juste.

### 2.7 Style des textes à l'écran

- Mission : la situation en paragraphes courts, un par personne ; ni geste ni conséquence à l'écran
  (`geste: null`, `consequence: null`) ; la consigne (sans calculatrice) et l'enjeu passent dans les
  notes formateur.
- Défi IA : la réponse de l'IA un point par ligne.
- Notes formateur : une idée par puce, la première donne le minutage.
- Rappel espacé : toutes les questions sont obligatoires.

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B1-01-A{acte}-{rang}-{SLUG}`, conformes à `^B1-01-A[1-6]-\d{2}-[A-Z0-9-]+$` ; une
illustration, à son arrivée, portera le rang de la page qu'elle précède. Colonne « Brique · rendu » : valeur de la
colonne `brique` ; les écrans « v2 » sont stockés en `fp-story` avec une présentation v2. « I » =
interactif. « Q » = questions fermées notées portées par l'écran.

| Rang | Identifiant                                | Min | Brique · rendu                 |  I  |   Q | Diffusion |
| ---: | ------------------------------------------ | --: | ------------------------------ | :-: | --: | --------- |
|    1 | B1-01-A1-01-DIAGNOSTIC-PART                |   4 | `fp-recall`                    |  I  |   1 | seance    |
|    2 | B1-01-A1-02-ACCROCHE                       |   1 | `fp-story` · v2 `hero`         |     |   0 | catalogue |
|    3 | B1-01-A1-03-VOTE-DIAGNOSTIC                |   4 | `fp-vote`                      |  I  |   0 | seance    |
|    4 | B1-01-A1-04-DOSSIER                        |   2 | `fp-story` · v2 `table`        |     |   0 | catalogue |
|    5 | B1-01-A1-05-MISSION                        |   6 | `fp-pro`                       |  I  |   0 | seance    |
|    6 | B1-01-A1-06-ILLUSTRATION-CLASSE            |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|    7 | B1-01-A1-06-COURS-PROPORTION               |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|    8 | B1-01-A1-07-ILLUSTRATION-PARMI             |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|    9 | B1-01-A1-07-COURS-REFERENCE-TABLEUR        |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   10 | B1-01-A1-08-EXEMPLE-STOCK                  |   6 | `fp-worked`                    |  I  |   0 | seance    |
|   11 | B1-01-A1-09-ATELIER-ALTERNANTS             |  10 | `questionnaire`                |  I  |   4 | seance    |
|   12 | B1-01-A1-10-TABLEUR-CLIENTS                |   9 | `fp-sheet`                     |  I  |   0 | seance    |
|   13 | B1-01-A1-11-JALON                          |   1 | `fp-pulse`                     |     |   0 | seance    |
|   14 | B1-01-A2-01-REFLEXION-CARTE                |   5 | `fp-story` · v2 `reflection`   |  I  |   0 | seance    |
|   15 | B1-01-A2-02-ILLUSTRATION-SALLE             |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   16 | B1-01-A2-02-COURS-PROPORTION-DE-PROPORTION |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   17 | B1-01-A2-03-ILLUSTRATION-DEUX-CLASSES      |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   18 | B1-01-A2-03-COURS-TAUX-GLOBAL              |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   19 | B1-01-A2-04-EXEMPLE-SOIREES                |   6 | `fp-worked`                    |  I  |   0 | seance    |
|   20 | B1-01-A2-05-TABLEAU-FIDELITE               |   8 | `fp-table-build`               |  I  |   0 | seance    |
|   21 | B1-01-A2-06-ATELIER-FIDELITE               |  10 | `questionnaire`                |  I  |   4 | seance    |
|   22 | B1-01-A2-07-JALON                          |   1 | `fp-pulse`                     |     |   0 | seance    |
|   23 | B1-01-A3-01-VOTE-POURCENTAGES              |   5 | `fp-vote`                      |  I  |   0 | seance    |
|   24 | B1-01-A3-02-ILLUSTRATION-CODE              |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   25 | B1-01-A3-02-COURS-POINTS                   |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   26 | B1-01-A3-03-ILLUSTRATION-ETIQUETTE         |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   27 | B1-01-A3-03-COURS-MARGE-MARQUE             |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   28 | B1-01-A3-04-EXEMPLE-JEU                    |   6 | `fp-worked`                    |  I  |   0 | seance    |
|   29 | B1-01-A3-05-ATELIER-VENTES                 |  10 | `questionnaire`                |  I  |   4 | seance    |
|   30 | B1-01-A3-06-DEFI-IA                        |   9 | `fp-challenge`                 |  I  |   0 | seance    |
|   31 | B1-01-A3-07-JALON                          |   1 | `fp-pulse`                     |     |   0 | seance    |
|   32 | B1-01-A4-01-SITUATION-FESTIVAL             |   3 | `fp-story` · v2 `table`        |     |   0 | catalogue |
|   33 | B1-01-A4-02-TABLEUR-FESTIVAL               |  13 | `fp-sheet`                     |  I  |   0 | seance    |
|   34 | B1-01-A4-03-COFFRE-FESTIVAL                |  11 | `fp-escape`                    |  I  |   0 | seance    |
|   35 | B1-01-A4-04-RAPPEL                         |   6 | `fp-spaced`                    |  I  |   0 | seance    |
|   36 | B1-01-A4-05-FICHE-MEMO                     |   2 | `fp-story` · v2 `grid`         |     |   0 | catalogue |
|   37 | B1-01-A4-06-BILLET-DE-SORTIE               |   3 | `fp-exit`                      |  I  |   1 | seance    |

Rythme : 131 minutes interactives, 29 d'exposition (jalons compris), exposition continue de 6
minutes au plus. Somme : 49 + 36 + 37 + 38 = 160.

### 3.2 Acte 1 — Diagnostic, puis la partie sur le tout (49 min)

#### A1-01 · `B1-01-A1-01-DIAGNOSTIC-PART` — 4 min · `fp-recall` · séance

- Titre public : « Diagnostic : une part, sans calculatrice »
- Énoncé (`b1-01-a1-diagnostic-part`) : « Sur 200 clients, 40 ont payé par carte. Quelle part des
  clients a payé par carte ? » Bonne réponse : 20 % ; pièges « 40 % »
  (`valeur-confondue-avec-taux`), « 500 % » (`base-inversee`).
- Notes formateur :
  - 4 min : c'est le premier écran de leur BTS ; écrire au tableau l'adresse et le code de séance.
  - Attendre au pupitre que tous les postes aient rejoint avant de lancer.
  - Annoncer « seule la participation compte » ; sans calculatrice.
  - Papier : question en tête du livret, vote à main levée.

#### A1-02 · `B1-01-A1-02-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Proportions et pourcentages : parmi qui ? »
- Sous-titre : « Partie Libre, quatre boutiques-bars à jeux. Votre alternance commence par le bilan
  de rentrée : des effectifs, des parts, des marges. »
- Puces : « BTS CG · 1re année · premier cours de mathématiques » ; « Trois notions : la part d'un
  tout, la part d'une part, points et marges » ; « Le tableur dès aujourd'hui : SOMME, ARRONDI, $ » ;
  « Une mini-situation CCF pour finir ».
- Notes : annoncer les deux pauses de 15 minutes ; dire que la trace écrite est dans le livret.

#### A1-03 · `B1-01-A1-03-VOTE-DIAGNOSTIC` — 4 min · `fp-vote` · séance

- Titre public : « Vote : deux pourcentages du lycée »
- Deux votes non notés, révélation commentée :
  - `b1-01-a1-diagnostic-pourcentage` : « Combien font 15 % de 80 € ? » Bonne : 12 € ; pièges
    « 65 € » (`raisonnement-additif`), « 1 200 € » (`taux-valeur-facteur-cent`).
  - `b1-01-a1-diagnostic-evolution` : « Un prix passe de 50 € à 60 €. De combien a-t-il
    augmenté ? » Bonne : + 20 % ; pièges « + 10 % » (`ecart-absolu-au-lieu-du-taux`),
    « + 16,7 % » (`base-arrivee`).
- Révélation « Deux réflexes à garder » : 15 % de 80, c'est 0,15 × 80 = 12 ; une hausse se rapporte
  au prix de départ : 10 ÷ 50 = 0,20. « La deuxième question revient à l'acte 3. »
- Notes : `NOTES_DU_VOTE_A_DEUX_QUESTIONS` ; repérer les postes sous 50 %.

#### A1-04 · `B1-01-A1-04-DOSSIER` — 2 min · v2 `table` · catalogue

- Titre public : « Le bilan de rentrée de Partie Libre »
- Lignes (`COLONNES_DU_DOSSIER`) :
  - « L'entreprise » : quatre boutiques-bars à jeux (jeux de société, consoles et jeux vidéo
    reconditionnés) à Nantes, Angers, Tours et Le Mans.
  - « Les salariés » : 40 au 1er octobre 2026 : Nantes 16, Angers 10, Tours 8, Le Mans 6. Dont 10
    alternants : 4, 3, 2 et 1.
  - « Les clients de septembre » : 3 000 : Nantes 1 200, Angers 800, Tours 600, Le Mans 400.
  - « La carte Pass Partie » : 45 % des clients de Nantes, 60 % à Angers, 50 % à Tours, 75 % au
    Mans.
  - « La question d'Inès » : « Quelles parts, de quoi, pour le bilan ? »
- Note : « Données fictives Partie Libre, créées pour ce cours. »
- Notes : 1 min de lecture silencieuse ; ne rien calculer.

#### A1-05 · `B1-01-A1-05-MISSION` — 6 min · `fp-pro` · séance

- Titre public : « Votre mission : vérifier le bilan de rentrée »
- Métier : « Alternant·e assistant·e de gestion — Partie Libre (boutiques-bars à jeux, 40 salariés,
  Nantes) ».
- Situation, un paragraphe par ligne :
  - « Lundi, 9 h. Premier jour d'alternance chez Partie Libre. »
  - « Inès Marchal, la gérante, prépare le bilan de rentrée pour l'expert-comptable : « Nous sommes
    40 salariés, dont 10 alternants. Pouvez-vous vérifier les pourcentages du brouillon ? » »
  - « Théo, responsable de la boutique de Nantes, a écrit : « Nantes emploie 40 % des alternants :
    40 % des salariés de Nantes sont donc des alternants. » »
  - « Pour la carte Pass Partie, Théo propose la moyenne des quatre boutiques. »
- `geste: null`, `consequence: null`.
- Questions libres (temps « réfléchir » de N1) :
  - `b1-01-a1-mission:part` : « 10 alternants sur 40 salariés : quelle part, en % ? Comment
    l'avez-vous trouvée ? »
  - `b1-01-a1-mission:theo` : « La phrase de Théo est-elle juste ? De quel tout parle chaque
    pourcentage ? »
  - `b1-01-a1-mission:carte` : « Pour la carte, la moyenne des quatre pourcentages donne-t-elle la
    part des clients du réseau ? Pourquoi ? »
- Notes formateur :
  - Lecture à voix haute (1 min), 4 min d'écriture individuelle, 1 min de mise en commun au pupitre.
  - Consigne orale : sans calculatrice. Enjeu : un bilan faux part chez l'expert-comptable sous le
    nom de l'alternant.
  - Question 2 : faire dire « 40 % de quoi ? » ; c'est la page 2.
  - Question 3 : ne pas trancher, c'est l'acte 2.
  - Papier : trois lignes d'écriture dans le livret.

#### A1-06 · `B1-01-A1-06-ILLUSTRATION-CLASSE` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : la classe de 25 »
- Infographie M1 de l'exemple pour débuter : 10 alternants sur 25 étudiants, 10 ÷ 25 = 40 % ; encadré 0,6 × 25 = 15 étudiants.

#### A1-06 · `B1-01-A1-06-COURS-PROPORTION` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : proportion et pourcentage »
- Page 1 sur 2 : définition « La partie sur le tout » en deux lignes, formules une par ligne
  (p = partie ÷ total, partie = p × total, total = partie ÷ p, 0,4 = 40 %) ; exemple pour débuter (la
  classe de 25, 10 alternants : 40 %, puis 15 étudiants pour 60 %, puis le total retrouvé) ; méthode
  « Partie en haut, tout en bas » : repérer le tout, × 100 pour lire des %, part entre 0 % et 100 %.
- Notes : 2 min après l'illustration ; on lit, on ne recopie pas ; question « 10 sur 25, plus ou moins de la moitié ? » ;
  faire répéter le moyen mnémotechnique ; lien au dossier : « 10 alternants sur 40 : quel calcul ? »

#### A1-07 · `B1-01-A1-07-ILLUSTRATION-PARMI` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : parmi qui ? »
- Infographie M2 : les 120 filles de STMG, 60 % des 200 élèves de STMG mais 15 % des 800 du lycée ; encart `=B2/$B$6`.

#### A1-07 · `B1-01-A1-07-COURS-REFERENCE-TABLEUR` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : population de référence et tableur »
- Page 2 sur 2 : définition « Parmi qui ? » (le tout est la population de référence ; changer de
  tout change le pourcentage) ; exemple pour débuter (les filles de STMG : 60 % des STMG, 15 % du
  lycée) ; méthode « Le tout ne bouge pas : $ » : `=SOMME(B2:B5)`, `=ARRONDI(B2/$B$6*100;1)`
  recopiée, sans $ C3 lit B7, vide, et affiche #DIV/0!.
- Notes : 2 min après l'illustration enchaînées sur la page 1 ; « parmi qui ? » devant chaque pourcentage du dossier ;
  faire taper la formule sans $ sur un poste volontaire.

#### A1-08 · `B1-01-A1-08-EXEMPLE-STOCK` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : le stock d’Angers »
- Énoncé : « La boutique d'Angers a 250 jeux en stock : 90 jeux de plateau, 60 jeux de cartes et
  100 jeux vidéo. 30 % des jeux de plateau sont des jeux d'ambiance. »
- Étapes (`b1-01-a1-exemple-stock`) :
  1. `part` « La part des jeux de cartes » : 60 ÷ 250 = 0,24, soit 24 % du stock.
  2. `piege` « Le sens de la division » : 250 ÷ 60 ≈ 4,17, soit 417 % : une part ne dépasse jamais
     100 %, c'est le tout divisé par la partie.
  3. `partie` « Une partie d'après sa part » : 0,30 × 90 = 27 jeux d'ambiance.
  4. `reference` « Parmi qui ? » : 27 jeux font 30 % des jeux de plateau, mais 27 ÷ 250 = 0,108,
     soit 10,8 % du stock.
  5. `tableur` « Au tableur » : quantités en B2:B4, total en B5 = `=SOMME(B2:B4)` ; part en C2 :
     `=ARRONDI(B2/$B$5*100;1)`.
- 4 min de réponses, puis 2 min de correction dévoilée étape par étape (`corrigeEtapeParEtape`).
  Transition : « À vous, sur les salariés de Partie Libre : exercice 1. »

#### A1-09 · `B1-01-A1-09-ATELIER-ALTERNANTS` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 1 — Les alternants du réseau »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, question par question sur place.
- Consigne : « 40 salariés, dont 10 alternants. Nantes : 16 salariés, dont 4 alternants. Résultats
  en %. »
- `b1-01-a1-part-alternants` (numérique) : part des alternants parmi les salariés du réseau. 25 % ;
  pièges 400 (`base-inversee`), 0,25 (`taux-valeur-facteur-cent`).
- `b1-01-a1-phrase-theo` (vote) : « 4 des 10 alternants travaillent à Nantes. Quelle phrase est
  juste ? » Bonne : « 40 % des alternants du réseau travaillent à Nantes » ; piège « 40 % des
  salariés de Nantes sont alternants » (`population-reference-ignoree`).
- `b1-01-a1-alternants-nantes` (numérique) : part des alternants parmi les salariés de Nantes.
  25 % ; pièges 40 et 10 (`population-reference-ignoree`).
- `b1-01-a1-objectif` (numérique) : « Inès vise 30 % d'alternants parmi les 40 salariés. Combien
  d'alternants ? » 12 ; pièges 3 (`population-reference-ignoree` : 30 % des 10 alternants), 30
  (`valeur-confondue-avec-taux`).
- Explications sur place : 10 ÷ 40 = 0,25 ; « 40 % de quoi ? des alternants » : 4 ÷ 10 = 0,4 ;
  4 ÷ 16 = 0,25 : 25 % des salariés de Nantes, pas 40 %, Théo s'est trompé de tout ;
  0,30 × 40 = 12.
- Notes : réflexion : souligner le tout de chaque question avant de calculer ; papier : exercice 1
  du livret ; corriger en commençant par la moins réussie (score sous chaque correction).

#### A1-10 · `B1-01-A1-10-TABLEUR-CLIENTS` — 9 min · `fp-sheet` · séance

- Titre public : « Exercice 2 — La répartition des clients au tableur »
- Temps : réflexion 2 min · travail 5 min · correction 2 min sur place.
- Feuille (6 lignes × 3 colonnes) : A1 « Boutique », B1 « Clients en septembre », C1 « Part des
  clients (%) » ; A2:A5 Nantes, Angers, Tours, Le Mans ; B2:B5 1 200, 800, 600, 400 ; A6 « Total ».
- Consignes : « En B6, calculez le total des clients. » ; « En C2, écrivez la part des clients de
  Nantes, en %, arrondie au dixième avec ARRONDI. Recopiez jusqu'en C5 : sélectionnez C2 et cliquez
  trois fois sur « Recopier vers le bas », une ligne par clic. » ; « En C6, vérifiez que les parts
  font 100 %. » ; « Le total ne s'écrit pas dans la formule : utilisez B6, figé par des $. »
- Six cellules attendues : B6 `=SOMME(B2:B5)` = 3 000 (forme références ; une valeur tapée est
  `valeur-saisie-sans-formule`) ; C2:C5 `=ARRONDI(B2/$B$6*100;1)` recopiée = 40 ; 26,7 ; 20 ; 13,3
  (pièges du modèle 0,4 `taux-valeur-facteur-cent`, 250 `base-inversee` ; sans ARRONDI, 40 et 20
  tombent juste, 26,666… et 13,333… sont `arrondi-oublie` ; B6 non figé, la recopie lit une cellule
  vide et affiche #DIV/0! : `reference-relative-non-figee`) ; C6
  `=SOMME(C2:C5)` = 100.
- Correction : projeter la feuille d'un poste volontaire, relire C2 et montrer les $ ; jalon 1, puis
  pause.

#### A1-11 · `B1-01-A1-11-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 1 : la part d’un tout »
- Invite : « Je sais calculer une part, dire de quel tout elle parle et l'écrire au tableur. »
- Si plus de 30 % « Perdu » : reprendre la page A1-07 après la pause. Puis pause de 15 minutes.

### 3.3 Acte 2 — Une partie d'une partie, un taux pour tout le réseau (36 min)

#### A2-01 · `B1-01-A2-01-REFLEXION-CARTE` — 5 min · v2 `reflection` · séance

- Titre public : « Réfléchir : la carte et la réservation en ligne »
- Question (`b1-01-a2-reflexion-carte`) : « À Nantes, 45 % des 1 200 clients ont la carte Pass
  Partie. Parmi eux, 40 % réservent leur table en ligne. Théo écrit : « 40 % des clients de Nantes
  réservent en ligne avec la carte. » Sans calculatrice : a-t-il raison ? De quel tout parle chaque
  pourcentage ? »
- Attendu : « Il a tort : 40 % porte sur les porteurs de la carte, pas sur tous les clients. Part des
  clients : 0,45 × 0,40 = 0,18, soit 18 %, 216 clients. » Action suivante : « Gardez votre réponse :
  la trace écrite multiplie les deux parts. »
- Notes : 3 min d'écriture, puis trois réponses lues au pupitre ; ne rien trancher. Relance : « Les
  porteurs de carte sont-ils plus ou moins nombreux que les clients ? »

#### A2-02 · `B1-01-A2-02-ILLUSTRATION-SALLE` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : la part d’une part »
- Infographie M3 : salle de 200 places, 30 % de moins de 18 ans, 40 % d'entre eux gratuits : 0,30 × 0,40 = 12 %, soit 24 ; 30 % + 40 % barré.

#### A2-02 · `B1-01-A2-02-COURS-PROPORTION-DE-PROPORTION` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : proportion de proportion »
- Page 1 sur 2 : définition « Une partie d'une partie » (on multiplie ; le résultat se rapporte au
  plus grand tout), formule p₁ × p₂ ; exemple pour débuter (la salle de 200 : 60 de moins de 18 ans,
  24 places gratuites, 0,30 × 0,40 = 12 %) ; méthode « « Parmi » → je multiplie » : parts en
  décimal, multiplier, résultat plus petit que chaque part.
- Notes : 2 min après l'illustration, la réflexion sous les yeux ; « 30 % + 40 % = 70 % de la salle ? » Non : 24
  personnes.

#### A2-03 · `B1-01-A2-03-ILLUSTRATION-DEUX-CLASSES` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : deux classes, un taux »
- Infographie M4 : 10 reçus sur 20 et 24 sur 30, soit 34 sur 50 = 68 % ; la moyenne simple 65 % barrée.

#### A2-03 · `B1-01-A2-03-COURS-TAUX-GLOBAL` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : taux global et moyenne pondérée »
- Page 2 sur 2 : définition « Un taux pour tout le groupe » (on compte des personnes ; moyenne des
  taux pondérée par les effectifs), deux formules ; exemple pour débuter (deux classes : 34 reçus sur
  50, 68 %, pas 65 %) ; méthode « Des personnes, pas des pourcentages » : n × t par groupe,
  additionner, diviser, taux global près de celui du plus gros groupe.
- Notes : 2 min après l'illustration enchaînées sur la page 1 ; relier à la question 3 de la mission.

#### A2-04 · `B1-01-A2-04-EXEMPLE-SOIREES` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : les soirées jeux de Tours »
- Énoncé : « Tours organise deux soirées : mardi, 50 joueurs dont 40 % de nouveaux ; vendredi, 150
  joueurs dont 20 % de nouveaux. Parmi tous les nouveaux, 60 % reviennent la semaine suivante. »
- Étapes (`b1-01-a2-exemple-soirees`) :
  1. `mardi` « Les nouveaux du mardi » : 0,40 × 50 = 20.
  2. `vendredi` « Les nouveaux du vendredi » : 0,20 × 150 = 30.
  3. `global` « Le taux global » : 50 nouveaux sur 200 joueurs : 25 %.
  4. `piege` « La moyenne simple » : (40 + 20) ÷ 2 = 30 %, trop haut : le vendredi, plus fréquenté,
     pèse trois fois plus.
  5. `reviennent` « Une part d'une part » : 0,25 × 0,60 = 0,15 : 15 % des joueurs, soit 30.
- 4 min de réponses, 2 min de correction. Transition : « À vous, sur la carte Pass Partie :
  exercice 3. »

#### A2-05 · `B1-01-A2-05-TABLEAU-FIDELITE` — 8 min · `fp-table-build` · séance

- Titre public : « Exercice 3 — Le taux de fidélité du réseau »
- Temps : réflexion 1 min · travail 5 min · correction 2 min sur place.
- Plan (`b1-01-a2-tableau-fidelite`), quatre lignes « Boutique » (Nantes, Angers, Tours, Le Mans) :
  colonne `clients` (donnée : 1 200, 800, 600, 400 ; totalisée) ; colonne `taux` « Clients avec la
  carte (%) » (donnée : 45, 60, 50, 75 ; non totalisée) ; colonne `porteurs` « Porteurs de la
  carte » (saisie, 0 décimale, totalisée). Synthèse : « Taux global de fidélité du réseau »,
  `totalPorteurs / totalClients * 100`, en %, 1 décimale.
- Consignes : « Pour chaque boutique, saisissez le nombre de porteurs de la carte : clients × taux. »
  ; « Le total et le taux global se calculent seuls à partir de vos saisies. »
- Attendus : 540, 480, 300, 300 (pièges : le taux saisi tel quel, 45, `valeur-confondue-avec-taux` ;
  clients ÷ taux, 2 666,67, `base-inversee`). Taux global affiché : 1 620 ÷ 3 000 = 54 %.
- Notes : réflexion : dire en français ce qu'on saisit (« des personnes ») ; papier : tableau du
  livret.

#### A2-06 · `B1-01-A2-06-ATELIER-FIDELITE` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 4 — Fidélité et réservations »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, question par question sur place.
- Consigne : « Réseau : 3 000 clients, 54 % avec la carte. Parmi les porteurs, 40 % réservent leur
  table en ligne. Résultats en %, ou en nombre de clients. »
- `b1-01-a2-poids` (vote) : « Le taux global, 54 %, est plus bas que la moyenne des quatre taux,
  57,5 %. Pourquoi ? » Bonne : « Nantes, la boutique qui a le plus de clients, a le taux le plus
  bas : il pèse le plus » ; piège « La moyenne des quatre taux est le bon calcul : 54 % est une
  erreur » (`moyenne-simple-des-taux`).
- `b1-01-a2-part-reservation` (numérique) : part des clients du réseau porteurs de la carte et
  réservant en ligne : 21,6 % ; pièges 40 (`population-reference-ignoree`), 94
  (`raisonnement-additif`).
- `b1-01-a2-clients-reservation` (numérique) : nombre de ces clients : 648 ; pièges 1 200
  (`population-reference-ignoree` : 40 % des 3 000), 1 620 (`population-reference-ignoree` : tous
  les porteurs).
- `b1-01-a2-octobre` (numérique) : « En octobre, Nantes compte 1 500 clients dont 40 % de porteurs,
  Angers 500 dont 70 %. Taux global des deux boutiques ? » 47,5 % ; pièges 55
  (`moyenne-simple-des-taux`), 110 (`raisonnement-additif`).
- Explications : le plus gros groupe tire le taux global ; 0,54 × 0,40 = 0,216 ; 0,216 × 3 000 =
  648 ; (600 + 350) ÷ 2 000 = 0,475.
- Notes : pièges à chercher : taux additionnés, moyenne simple ; papier : exercice 4 du livret.

#### A2-07 · `B1-01-A2-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : la part d’une part, le taux global »
- Invite : « Je sais multiplier deux parts et calculer un taux global avec les effectifs. »
- Si plus de 30 % « Perdu » : reprendre l'exemple des deux classes (A2-03).

### 3.4 Acte 3 — Points, évolutions, marge et marque (37 min)

#### A3-01 · `B1-01-A3-01-VOTE-POURCENTAGES` — 5 min · `fp-vote` · séance

- Titre public : « Vote : de quel pourcentage parle-t-on ? »
- Deux votes non notés (temps « réfléchir » de N3) :
  - `b1-01-a3-points` : « Chez Partie Libre, la part des ventes en ligne passe de 18 % à 24 % du
    chiffre d'affaires. Quelle phrase est juste ? » Bonne : « Elle gagne 6 points » ; piège « Elle
    augmente de 6 % » (`points-confondus-avec-pourcentage`).
  - `b1-01-a3-marque` : « Une console achetée 150 € HT est revendue 240 € HT. La marge, 90 €, fait
    quel pourcentage du prix de vente ? » Bonne : 37,5 % ; piège 60 %
    (`marque-confondue-avec-marge`).
- Révélation « Deux pourcentages qui se ressemblent » : 24 − 18 = 6 points, soit une évolution de
  (24 − 18) ÷ 18 ≈ 33,3 % ; 90 ÷ 240 = 37,5 % du prix de vente, 90 ÷ 150 = 60 % du coût d'achat.
- Notes : `notesDuVoteQuiOuvreLaNotion(3)`.

#### A3-02 · `B1-01-A3-02-ILLUSTRATION-CODE` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : points ou pourcentage ? »
- Infographie M5 : réussite au code de 60 % à 66 %, + 6 points, mais + 10 % en évolution ; « + 6 % » barré.

#### A3-02 · `B1-01-A3-02-COURS-POINTS` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : proportion, évolution et points »
- Page 1 sur 2 : définition « Une part ou une évolution ? » (une part compare à un tout, une
  évolution à une valeur de départ ; l'écart de deux pourcentages se dit en points), deux formules ;
  exemple pour débuter (le code de la route : 60 % puis 66 %, + 6 points, + 10 % en évolution) ;
  méthode « Deux % qu'on soustrait : des points » : lire le mot qui accompagne le pourcentage.
- Notes : 2 min après l'illustration ; relier au diagnostic A1-03 ; les évolutions reviennent au B1-02.

#### A3-03 · `B1-01-A3-03-ILLUSTRATION-ETIQUETTE` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : une marge, deux taux »
- Infographie M6 : tee-shirt acheté 10 € HT, vendu 25 € HT, marge 15 € ; taux de marge 150 %, taux de marque 60 %.

#### A3-03 · `B1-01-A3-03-COURS-MARGE-MARQUE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : taux de marge et taux de marque »
- Page 2 sur 2 : définition « Taux de marge, taux de marque » (marge = vente HT − achat HT,
  rapportée au coût d'achat ou au prix de vente), deux formules ; exemple pour débuter (le
  tee-shirt : 10 € HT, 25 € HT, marge 150 %, marque 60 %) ; méthode « La marque se lit sur
  l'étiquette » : ÷ coût d'achat, ÷ prix de vente, marque plus petite que marge.
- Notes : 2 min après l'illustration enchaînées sur la page 1 ; lien au dossier : la console à 150 € et 240 €.

#### A3-04 · `B1-01-A3-04-EXEMPLE-JEU` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : un jeu de société à 36 € »
- Énoncé : « Partie Libre achète un jeu de société 24 € HT et le revend 36 € HT. Les jeux de société
  passent de 30 % à 35 % du chiffre d'affaires. »
- Étapes (`b1-01-a3-exemple-jeu`) :
  1. `marge` « La marge » : 36 − 24 = 12 €.
  2. `taux-de-marge` « Le taux de marge » : 12 ÷ 24 = 0,5, soit 50 %.
  3. `taux-de-marque` « Le taux de marque » : 12 ÷ 36 ≈ 0,333, soit 33,3 %.
  4. `prix` « Un prix pour 60 % de marge » : 24 × 1,6 = 38,40 € HT.
  5. `points` « Points ou % » : 35 − 30 = + 5 points ; en évolution, 5 ÷ 30 ≈ + 16,7 %.
- 4 min de réponses, 2 min de correction. Transition : « À vous : exercice 5. »

#### A3-05 · `B1-01-A3-05-ATELIER-VENTES` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 5 — Jeunes clients et manettes »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, question par question sur place.
- Consigne : « Part des moins de 25 ans parmi les clients : 36,5 % en 2025, 42,3 % en 2026. Une
  manette reconditionnée est achetée 24 € HT et vendue 39 € HT. Résultats arrondis au dixième. »
  Les données diffèrent de celles du vote A3-01 et du défi IA, pour qu'aucune réponse ne soit déjà
  écrite à l'écran.
- `b1-01-a3-ecart-points` (numérique, en points) : 5,8 ; piège 15,9
  (`points-confondus-avec-pourcentage`).
- `b1-01-a3-evolution` (numérique, en %) : taux d'évolution de la part des moins de 25 ans :
  15,9 % ; pièges 5,8 (`points-confondus-avec-pourcentage`), 13,7 (`base-arrivee`).
- `b1-01-a3-taux-de-marge` (numérique) : 62,5 % ; piège 38,5 (`marque-confondue-avec-marge`).
- `b1-01-a3-taux-de-marque` (numérique) : 38,5 % ; piège 62,5 (`marque-confondue-avec-marge`).
- Explications : 42,3 − 36,5 = 5,8 points ; 5,8 ÷ 36,5 ≈ 0,159 ; marge 15 € : 15 ÷ 24 = 0,625 et
  15 ÷ 39 ≈ 0,385.
- Notes : réflexion : écrire « proportion », « évolution » ou « marge/marque » devant chaque
  question ; papier : exercice 5 du livret.

#### A3-06 · `B1-01-A3-06-DEFI-IA` — 9 min · `fp-challenge` · séance

- Titre public : « Exercice 6 — Corriger le bilan d’une IA »
- Temps : réflexion 2 min · travail 5 min · correction 2 min, piste par piste sur place.
- Énoncé, un point par ligne :
  - « Inès a demandé à un assistant IA de rédiger trois phrases du bilan. Réponse : »
  - « « 1. Les ventes en ligne sont passées de 18 % à 24 % du chiffre d'affaires : elles ont
    progressé de 6 %. »
  - « 2. Une console achetée 150 € HT et vendue 240 € HT : notre taux de marque est de 60 %. »
  - « 3. Le taux de fidélité du réseau est la moyenne des quatre boutiques : (45 + 60 + 50 + 75) ÷ 4
    = 57,5 %. » »
- Invite : « Trouvez les erreurs de l'IA, corrigez chacune et dites comment la contrôler. »
- Pistes justes : `points` (+ 6 points, soit + 33,3 % en évolution) ; `marque` (90 ÷ 240 = 37,5 % ;
  60 % est le taux de marge) ; `global` (1 620 ÷ 3 000 = 54 %, pondéré par les clients) ;
  `controle` (le taux de marque est plus petit que le taux de marge ; le taux global est près de
  celui de la plus grosse boutique). Piste fausse : `garder` (« Garder le bilan : les trois calculs
  sont justes »).
- Notes : faire lire deux corrections de la classe, puis dévoiler les pistes une à une ; jalon 3,
  puis pause.

#### A3-07 · `B1-01-A3-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 3 : points, marge et marque »
- Invite : « Je sais écrire un écart en points et calculer un taux de marge et un taux de marque. »
- Puis pause de 15 minutes.

### 3.5 Acte 4 — Mini-situation CCF et clôture (38 min)

#### A4-01 · `B1-01-A4-01-SITUATION-FESTIVAL` — 3 min · v2 `table` · catalogue

- Titre public : « Mini-situation CCF : le Week-end du jeu »
- Lignes :
  - « Contexte » : Partie Libre organise le Week-end du jeu, son premier festival, à Nantes. Inès
    prépare le bilan pour la mairie, qui a prêté la salle.
  - « Billets » : 960 billets vendus : 412 plein tarif, 288 étudiant, 172 enfant, 88 pass famille.
  - « Ventes en ligne » : 150 des billets plein tarif ont été achetés en ligne.
  - « Option tournoi » : 45 % des billets étudiant incluent l'option tournoi.
  - « Ateliers » : samedi, 160 places remplies à 85 % ; dimanche, 140 places remplies à 60 %.
  - « Stand » : un jeu acheté 32 € HT est vendu 50 € HT au stand de la boutique.
  - `BAREME_DE_LA_MINI_SITUATION` (tableur 3 ; énigmes 2, 2, 1,5 et 1,5).
- Note : « Données fictives Partie Libre, créées pour ce cours. »
- Notes : mini-situation de 27 min (lecture 3, tableur 13, coffre 11), calculatrice, poste
  individuel ; papier : la situation est en tête de la partie 4 du livret.

#### A4-02 · `B1-01-A4-02-TABLEUR-FESTIVAL` — 13 min · `fp-sheet` · séance

- Titre public : « Question tableur (3 points sur 10) : la répartition des billets »
- Temps : réflexion 3 min · travail 8 min · correction 2 min sur place.
- Feuille (7 lignes × 3 colonnes), au format d'une copie de CCF : A1 « Billets du Week-end du jeu » ;
  ligne 2 en-têtes A2 « Catégorie », B2 « Billets vendus », C2 « Part des billets (%) » ; A3:A6
  « Plein tarif », « Étudiant », « Enfant », « Pass famille » ; B3:B6 412, 288, 172, 88 ; A7
  « Total ».
- Consignes : « En B7, calculez le nombre total de billets. » ; « En C3, écrivez la formule de la
  part des billets plein tarif, en %, arrondie au dixième, à recopier vers le bas. Recopiez jusqu'en
  C6 : sélectionnez C3 et cliquez trois fois sur « Recopier vers le bas », une ligne par clic. » ;
  « En C7, vérifiez que les parts font 100 %. » ; « Le total ne s'écrit pas dans la formule :
  utilisez B7, figé par des $. »
- Six cellules attendues : B7 `=SOMME(B3:B6)` = 960 ; C3:C6 `=ARRONDI(B3/$B$7*100;1)` recopiée =
  42,9 ; 30 ; 17,9 ; 9,2 (pièges du modèle 0,4 et 0,429… `taux-valeur-facteur-cent`, 233
  `base-inversee`, 42,916… `arrondi-oublie` ; 17,916… et 9,166… `arrondi-oublie` sur la recopie ;
  B7 non figé, #DIV/0! : `reference-relative-non-figee`) ;
  C7 `=SOMME(C3:C6)` = 100. Les parts arrondies tombent juste à 100,0 : aucun écart d'arrondi à
  expliquer en CCF.
- Notes : réflexion : chacun écrit sur papier la formule de C3, puis ce qu'elle devient en C4 ;
  erreurs à chercher : B7 sans $, total tapé au clavier, part sans × 100 ; en CCF, la question se fait
  devant l'examinateur.

#### A4-03 · `B1-01-A4-03-COFFRE-FESTIVAL` — 11 min · `fp-escape` · séance

- Titre public : « Mini-situation : le bilan du Week-end du jeu »
- Temps : réflexion 2 min · travail 7 min · correction 2 min sur place, énigme par énigme.
- Parcours `b1-01-a4-coffre-festival`, indices après 60 s, 150 s par énigme, 10 tentatives :
  - E1 `b1-01-a4-e1-en-ligne` « Les billets en ligne (2 points) » : « Quelle part des billets plein
    tarif a été achetée en ligne, en %, arrondie au dixième ? » 36,4 (tolérance 0,05) ; pièges 15,6
    (`population-reference-ignoree`), 274,7 (`base-inversee`). Indice : « Parmi qui ? Le tout, ce
    sont les billets plein tarif. »
  - E2 `b1-01-a4-e2-tournoi` « L'option tournoi (2 points) » : « Quelle part de l'ensemble des
    billets sont des billets étudiant avec tournoi, en % ? » 13,5 ; pièges 45
    (`population-reference-ignoree`), 75 (`raisonnement-additif`). Indice, sans chiffre : « Une part
    des billets étudiant, qui sont eux-mêmes une part de tous les billets : on multiplie les deux
    parts. »
  - E3 `b1-01-a4-e3-ateliers` « Les ateliers (1,5 point) » : « Quel est le taux de remplissage des
    ateliers sur tout le week-end, en %, arrondi au dixième ? » 73,3 ; pièges 72,5 (`moyenne-simple-des-taux`), 145
    (`raisonnement-additif`). Indice : « Comptez les places remplies, pas les pourcentages. »
  - E4 `b1-01-a4-e4-stand` « Le stand (1,5 point) » : « Quel est le taux de marque du jeu vendu au
    stand, en %, arrondi au dixième ? » 36 ; piège 56,25 (`marque-confondue-avec-marge`). Indice :
    « La marque se lit sur l'étiquette : divisez par le prix de vente. »
- Fragments du code : `P7`, `J2`, `R5`, `Q8`.
- Explications : 150 ÷ 412 ≈ 0,364 ; 0,30 × 0,45 = 0,135 ; (136 + 84) ÷ 300 ≈ 0,733 ;
  18 ÷ 50 = 0,36.
- Notes : relire le dossier et noter, pour chaque énigme, « parmi qui ? » ; à 6 min, projeter
  l'énigme la moins résolue ; papier : quatre questions rédigées du livret, sans code de coffre.

#### A4-04 · `B1-01-A4-04-RAPPEL` — 6 min · `fp-spaced` · séance

- Titre public : « Rappel : de mémoire, sans vos notes »
- Les douze questions de la banque (§ 5.10) sont obligatoires : chaque étudiant les reçoit toutes.

#### A4-05 · `B1-01-A4-05-FICHE-MEMO` — 2 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : proportions et pourcentages »
- Neuf cartes et le référentiel (`REFERENTIEL_DU_BTS_CG`) :
  - « Proportion » · « Une part d'un tout ? » · « p = partie ÷ total. Entre 0 et 1, soit 0 % et
    100 %. »
  - « Partie ou total » · « Je connais la part ? » · « partie = p × total ; total = partie ÷ p. »
  - « % et décimal » · « Comment l'écrire ? » · « 40 % = 0,4 ; 4 % = 0,04. On calcule en décimal. »
  - « Population de référence » · « 40 % de quoi ? » · « Le tout qui suit « parmi ». Changer de tout
    change le %. »
  - « Proportion de proportion » · « La part d'une part ? » · « On multiplie : 0,45 × 0,40 = 0,18. »
  - « Taux global » · « Plusieurs groupes ? » · « Concernés ÷ effectif total. Jamais la moyenne
    simple des taux. »
  - « Points de pourcentage » · « L'écart de deux % ? » · « 24 % − 18 % = 6 points, soit + 33,3 % en
    évolution. »
  - « Marge et marque » · « Quel taux ? » · « Marge ÷ coût d'achat HT : taux de marge. Marge ÷ prix
    de vente HT : taux de marque. »
  - « Tableur » · « La part à recopier ? » · « =ARRONDI(B2/$B$6\*100;1), total =SOMME(B2:B5) figé par
    des $. »

#### A4-06 · `B1-01-A4-06-BILLET-DE-SORTIE` — 3 min · `fp-exit` · séance

- Titre public : « Billet de sortie : la formule de la part »
- Vote noté `b1-01-a4-billet` : « Effectif en B3, total en B7. Quelle formule écrire en C3 pour la
  part en %, arrondie au dixième, à recopier vers le bas ? » Bonne : `=ARRONDI(B3/$B$7*100;1)` ;
  pièges `=ARRONDI(B3/B7*100;1)` (`reference-relative-non-figee`), `=ARRONDI($B$7/B3*100;1)`
  (`base-inversee`), `=ARRONDI(B3/$B$7;1)` (`taux-valeur-facteur-cent`).
- Invite : « En une phrase : pourquoi faut-il toujours se demander « parmi qui ? » devant un
  pourcentage ? »
- Notes : 3 min ; clore quand le compteur de billets est complet.

## 4. Mode papier

Le livret étudiant reprend, dans l'ordre des écrans, les traces écrites, les énoncés et un cadre de
réponse par question ; il ne contient aucune bonne réponse. Le corrigé formateur ajoute les
réponses et les bonnes réponses (sans les notes de chaque écran). Sans poste, le formateur pilote
les révélations depuis le pupitre ; les votes se font à main levée, les formules s'écrivent sur la
copie avec la grille des cellules, les parts se calculent à la calculatrice et le tableau de
fidélité se remplit à la main.

## 5. Contenus

### 5.1 Les valeurs du dossier

| Boutique | Salariés | Alternants | Clients (sept.) | Part des clients | Carte (%) | Porteurs |
| -------- | -------: | ---------: | --------------: | ---------------: | --------: | -------: |
| Nantes   |       16 |          4 |           1 200 |           40,0 % |        45 |      540 |
| Angers   |       10 |          3 |             800 |           26,7 % |        60 |      480 |
| Tours    |        8 |          2 |             600 |           20,0 % |        50 |      300 |
| Le Mans  |        6 |          1 |             400 |           13,3 % |        75 |      300 |
| Total    |       40 |         10 |           3 000 |          100,0 % |     54 \* |    1 620 |

\* Taux global : 1 620 ÷ 3 000 = 54 % ; moyenne simple des quatre taux : 57,5 %.

- Alternants : 10 ÷ 40 = 25 % ; 4 ÷ 10 = 40 % des alternants à Nantes ; 4 ÷ 16 = 25 % des
  salariés de Nantes ; 4 ÷ 40 = 10 % ; objectif 0,30 × 40 = 12.
- Réservations : Nantes 0,45 × 0,40 = 18 %, 216 clients ; réseau 0,54 × 0,40 = 21,6 %, 648 clients.
- Octobre : (0,40 × 1 500 + 0,70 × 500) ÷ 2 000 = 950 ÷ 2 000 = 47,5 % ; moyenne simple 55 %.
- Ventes en ligne (vote A3-01, défi IA) : 24 − 18 = 6 points ; 6 ÷ 18 ≈ + 33,3 %.
- Moins de 25 ans (exercice 5) : 42,3 − 36,5 = 5,8 points ; 5,8 ÷ 36,5 ≈ 15,89 %, soit 15,9 % ;
  5,8 ÷ 42,3 ≈ 13,7 % (base d'arrivée).
- Console : marge 90 € ; taux de marge 60 % ; taux de marque 37,5 %. Manette : marge 15 € ; taux
  de marge 15 ÷ 24 = 62,5 % ; taux de marque 15 ÷ 39 ≈ 38,46 %, soit 38,5 %.
- Exemples guidés : stock d'Angers 60 ÷ 250 = 24 %, 250 ÷ 60 ≈ 4,17, 0,30 × 90 = 27,
  27 ÷ 250 = 10,8 % ; soirées de Tours 20 + 30 = 50 nouveaux sur 200 = 25 %, moyenne simple 30 %,
  0,25 × 0,60 = 15 %, 30 joueurs ; jeu de société marge 12 €, 50 %, 33,3 %, 24 × 1,6 = 38,40 €,
  un écart de 5 points, soit 5 ÷ 30 ≈ + 16,7 %.

### 5.2 Les valeurs de la mini-situation

| Catégorie    | Billets | Part exacte (%) | Part arrondie (%) |
| ------------ | ------: | --------------: | ----------------: |
| Plein tarif  |     412 |       42,916 67 |              42,9 |
| Étudiant     |     288 |       30,000 00 |              30,0 |
| Enfant       |     172 |       17,916 67 |              17,9 |
| Pass famille |      88 |        9,166 67 |               9,2 |
| Total        |     960 |                 |             100,0 |

Coffre : 150 ÷ 412 ≈ 36,407 8 % → 36,4 (pièges 150 ÷ 960 = 15,625 → 15,6 ; 412 ÷ 150 ≈ 274,7) ;
0,30 × 0,45 = 13,5 % (45 % de 288 = 129,6 billets) ; (0,85 × 160 + 0,60 × 140) ÷ 300 = 220 ÷ 300 ≈
73,3 % (moyenne simple 72,5 %) ; (50 − 32) ÷ 50 = 36 % (18 ÷ 32 = 56,25 %). Pièges du modèle de
C3 : =ARRONDI(B3/$B$7;1) = 0,4 et 412 ÷ 960 ≈ 0,429 2 ; 960 ÷ 412 × 100 ≈ 233,0.

Les arrondis sont ceux d'`ARRONDI` (moitié vers le haut) ; aucune part de la feuille ne tombe sur
une moitié. Chaque valeur est recalculée par `b1-01.cours.spec.ts` à partir des seuls paramètres.

### 5.9 Concepts, confusions et remédiations

**Concepts** : `proportion`, `pourcentage`, `moyenne-ponderee`, `point-de-pourcentage`,
`taux-evolution`, `tableur`, `contrat-de-lecture` (tous déjà dans la banque).
**Confusions** : quatorze, toutes existantes sauf une nouvelle, `arrondi-oublie` (concept `tableur`,
« Laisser un résultat en pleine précision au lieu de l'arrondir comme demandé, avec ARRONDI »),
ajoutée en dernier à la banque.

| Identifiant                           | Concept              | Libellé court                                    | Remédiation                                |
| ------------------------------------- | -------------------- | ------------------------------------------------ | ------------------------------------------ |
| `base-inversee`                       | proportion           | Diviser le tout par la partie.                   | B1-01-A1-06-COURS-PROPORTION               |
| `taux-valeur-facteur-cent`            | pourcentage          | Confondre 40 % et 0,4, ou 0,4 et 40.             | B1-01-A1-06-COURS-PROPORTION               |
| `valeur-confondue-avec-taux`          | contrat-de-lecture   | Prendre un effectif pour un pourcentage.         | B1-01-A1-06-COURS-PROPORTION               |
| `population-reference-ignoree`        | proportion           | Se tromper de tout.                              | B1-01-A1-07-COURS-REFERENCE-TABLEUR        |
| `reference-relative-non-figee`        | tableur              | Recopier sans figer le total.                    | B1-01-A1-07-COURS-REFERENCE-TABLEUR        |
| `valeur-saisie-sans-formule`          | tableur              | Taper le total au lieu de SOMME.                 | B1-01-A1-07-COURS-REFERENCE-TABLEUR        |
| `arrondi-oublie`                      | tableur              | Ne pas arrondir la part demandée au dixième.     | B1-01-A1-07-COURS-REFERENCE-TABLEUR        |
| `raisonnement-additif`                | proportion           | Additionner des parts au lieu de les multiplier. | B1-01-A2-02-COURS-PROPORTION-DE-PROPORTION |
| `moyenne-simple-des-taux`             | moyenne-ponderee     | Faire la moyenne simple des taux.                | B1-01-A2-03-COURS-TAUX-GLOBAL              |
| `points-confondus-avec-pourcentage`   | point-de-pourcentage | Écrire « + 6 % » pour + 6 points.                | B1-01-A3-02-COURS-POINTS                   |
| `proportion-confondue-avec-evolution` | pourcentage          | Prendre une part pour une évolution.             | B1-01-A3-02-COURS-POINTS                   |
| `ecart-absolu-au-lieu-du-taux`        | taux-evolution       | Donner l'écart en euros au lieu du taux.         | B1-01-A3-02-COURS-POINTS                   |
| `base-arrivee`                        | taux-evolution       | Diviser par la valeur d'arrivée.                 | B1-01-A3-02-COURS-POINTS                   |
| `marque-confondue-avec-marge`         | pourcentage          | Confondre taux de marge et taux de marque.       | B1-01-A3-03-COURS-MARGE-MARQUE             |

### 5.10 Rappels espacés

Douze rappels, tous obligatoires. Chaque bonne réponse porte son calcul (« 15 ÷ 50 = 0,3, soit
30 % ») : un libellé réduit à « 30 % » se lirait déjà dans les textes publics du cours, et la garde
de confidentialité le refuserait.

| Id                     | Concept              | Question                                                                              | Bonne réponse                  | Piège (confusion)                                         |
| ---------------------- | -------------------- | ------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------- |
| `b1-01-r-proportion`   | proportion           | Sur 50 salariés, 15 sont à temps partiel. Quelle part ?                               | 15 ÷ 50 = 0,3, soit 30 %       | 15 % (`valeur-confondue-avec-taux`)                       |
| `b1-01-r-partie`       | proportion           | 20 % des 150 clients ont un abonnement. Combien de clients ?                          | 30 clients                     | 20 clients (`valeur-confondue-avec-taux`)                 |
| `b1-01-r-decimal`      | pourcentage          | Comment écrire 4 % en nombre décimal ?                                                | 0,04, soit 4 ÷ 100             | 0,4 (`taux-valeur-facteur-cent`)                          |
| `b1-01-r-tout`         | proportion           | « 30 % des cadres sont des femmes » : quel est le tout ?                              | Les cadres                     | Les femmes (`population-reference-ignoree`)               |
| `b1-01-r-parmi`        | proportion           | 40 cadres, dont 12 femmes ; 30 femmes en tout. Part des femmes parmi les cadres ?     | 12 ÷ 40 = 0,3, soit 30 %       | 12 ÷ 30 = 0,4, soit 40 % (`population-reference-ignoree`) |
| `b1-01-r-part-de-part` | proportion           | 50 % des clients ont la carte ; 20 % d'entre eux réservent. Quelle part des clients ? | 0,5 × 0,2 = 0,1, soit 10 %     | 50 % + 20 % = 70 % (`raisonnement-additif`)               |
| `b1-01-r-global`       | moyenne-ponderee     | Groupe A : 10 personnes, 20 % ; groupe B : 30 personnes, 60 %. Taux global ?          | (2 + 18) ÷ 40 = 0,5, soit 50 % | (20 % + 60 %) ÷ 2 = 40 % (`moyenne-simple-des-taux`)      |
| `b1-01-r-points`       | point-de-pourcentage | Un taux passe de 12 % à 15 %. Quel écart ?                                            | + 3 points                     | + 3 % (`points-confondus-avec-pourcentage`)               |
| `b1-01-r-evolution`    | pourcentage          | « Le CA a augmenté de 8 % » : proportion ou évolution ?                               | Une évolution                  | Une proportion (`proportion-confondue-avec-evolution`)    |
| `b1-01-r-marge`        | pourcentage          | Acheté 40 € HT, vendu 50 € HT : taux de marge ?                                       | 10 ÷ 40 = 0,25, soit 25 %      | 10 ÷ 50 = 0,2, soit 20 % (`marque-confondue-avec-marge`)  |
| `b1-01-r-marque`       | pourcentage          | Acheté 40 € HT, vendu 50 € HT : taux de marque ?                                      | 10 ÷ 50 = 0,2, soit 20 %       | 10 ÷ 40 = 0,25, soit 25 % (`marque-confondue-avec-marge`) |
| `b1-01-r-somme`        | tableur              | Effectifs en D3 à D8 : quelle formule pour le total en D9 ?                           | =SOMME(D3:D8)                  | Le total, tapé au clavier (`valeur-saisie-sans-formule`)  |

Contrôles : 15 ÷ 50 = 0,3 ; 0,2 × 150 = 30 ; 12 ÷ 40 = 0,3 (12 ÷ 30 = 0,4) ; 0,5 × 0,2 = 0,1 ;
(2 + 18) ÷ 40 = 0,5 (moyenne simple 40 %) ; 10 ÷ 40 = 0,25 ; 10 ÷ 50 = 0,2.

## 6. Moteur

- **Aucune brique ni fonction nouvelle** : `SOMME` et `ARRONDI` sont déjà dans les deux moteurs de
  formules ; `fp-recall`, `fp-vote`, `fp-pro`, `lesson`, `fp-worked`,
  `questionnaire`, `fp-sheet`, `fp-table-build`, `fp-challenge`, `fp-escape`, `fp-spaced`,
  `fp-exit`, `fp-pulse` servent déjà.
- **Niveau `B1`** : un constructeur `coursB1 = coursDuNiveau('B1')` dans `briques.ts`. Côté front,
  la carte du catalogue garde le badge « BTS CG · Cours interactif » de `coursBtsEnSeance` ; le
  titre « B1-01 — … » dit l'année.
- **Rappel de tout le cours** : `rappelDeToutLeCours` (`briques.ts`) sert les douze questions de la
  banque à chacun, comme au B2-04 et au B2-05.
- **Synthèse du tableau de fidélité** : `totalPorteurs / totalClients * 100` ; `TableauEvalue`
  préfixe les totaux par `total` suivi de la clé capitalisée (`prefixees`), la formule est donc
  lisible telle quelle.
- **Tolérance des parts arrondies** : la tolérance relative par défaut (10⁻⁴) refuse 26,666… pour
  26,7 : `ARRONDI` est donc exigé, comme le demande la consigne. Le piège `arrondi-oublie` le
  nomme, sur les parts qui ne tombent pas juste.

## 7. Durées de la séance réelle

| Temps                               | Minutes |
| ----------------------------------- | ------: |
| Écrans programmés                   |     160 |
| Deux pauses                         |      30 |
| Marge (prise en main, débordements) |      20 |
| Séance                              |     210 |

## 8. Médias

### 8.1 Principe

Six infographies, une par exemple pour débuter, chacune projetée sur un écran `illustration` placé
juste avant sa page de trace écrite. Le reste est rendu sans image : les dossiers par `table`, les
feuilles par `fp-sheet`, le tableau de fidélité par `fp-table-build`.

### 8.2 Catalogue des médias

Chaque PNG d'origine (1 536 × 1 024 px) est converti en WebP à la même taille et servi depuis
`/assets/cours/b1-01/v1/`. Le catalogue est stocké avec le cours (`Cours.medias`) et contrôlé par la
règle `media-sans-licence`.

| Id  | Écran | Fichier source (page)      | Original                     | Auteur, date       | Licence      | Dérivé servi                  | Attribution affichée                                                   |
| --- | ----- | -------------------------- | ---------------------------- | ------------------ | ------------ | ----------------------------- | ---------------------------------------------------------------------- |
| M1  | A1-06 | production propre du cours | PNG 1 536 × 1 024 px, 1,7 Mo | Asili Design, 2026 | CC BY-SA 4.0 | `classe-alternants.webp`      | « Pour débuter : la classe de 25 · Asili Design, 2026 · CC BY-SA 4.0 » |
| M2  | A1-07 | production propre du cours | PNG 1 536 × 1 024 px, 1,7 Mo | Asili Design, 2026 | CC BY-SA 4.0 | `parmi-qui.webp`              | « Parmi qui ? · Asili Design, 2026 · CC BY-SA 4.0 »                    |
| M3  | A2-02 | production propre du cours | PNG 1 536 × 1 024 px, 1,8 Mo | Asili Design, 2026 | CC BY-SA 4.0 | `salle-de-spectacle.webp`     | « La part d’une part · Asili Design, 2026 · CC BY-SA 4.0 »             |
| M4  | A2-03 | production propre du cours | PNG 1 536 × 1 024 px, 1,8 Mo | Asili Design, 2026 | CC BY-SA 4.0 | `deux-classes.webp`           | « Deux classes, un taux · Asili Design, 2026 · CC BY-SA 4.0 »          |
| M5  | A3-02 | production propre du cours | PNG 1 536 × 1 024 px, 1,5 Mo | Asili Design, 2026 | CC BY-SA 4.0 | `code-de-la-route.webp`       | « Points ou pourcentage ? · Asili Design, 2026 · CC BY-SA 4.0 »        |
| M6  | A3-03 | production propre du cours | PNG 1 536 × 1 024 px, 1,6 Mo | Asili Design, 2026 | CC BY-SA 4.0 | `etiquette-marge-marque.webp` | « Une marge, deux taux · Asili Design, 2026 · CC BY-SA 4.0 »           |

### 8.3 Illustrations livrées

Brief de chaque infographie, à suivre si une image est refaite, dans la charte des illustrations du
B2-04 : fond clair, titre en haut à gauche, chiffres en gras, une flèche ou un encadré pour le
résultat, lisible projeté au fond d'une salle. Chacune est projetée sur un écran `illustration` d'1
minute, juste avant sa page de 2 minutes.

| Id  | Écran                                                | Fichier                       | Titre de l'infographie             |
| --- | ---------------------------------------------------- | ----------------------------- | ---------------------------------- |
| M1  | `B1-01-A1-06-ILLUSTRATION-CLASSE`, avant A1-06       | `classe-alternants.webp`      | « Pour débuter : la classe de 25 » |
| M2  | `B1-01-A1-07-ILLUSTRATION-PARMI`, avant A1-07        | `parmi-qui.webp`              | « Parmi qui ? »                    |
| M3  | `B1-01-A2-02-ILLUSTRATION-SALLE`, avant A2-02        | `salle-de-spectacle.webp`     | « La part d'une part »             |
| M4  | `B1-01-A2-03-ILLUSTRATION-DEUX-CLASSES`, avant A2-03 | `deux-classes.webp`           | « Deux classes, un taux »          |
| M5  | `B1-01-A3-02-ILLUSTRATION-CODE`, avant A3-02         | `code-de-la-route.webp`       | « Points ou pourcentage ? »        |
| M6  | `B1-01-A3-03-ILLUSTRATION-ETIQUETTE`, avant A3-03    | `etiquette-marge-marque.webp` | « Une marge, deux taux »           |

Briefs et textes alternatifs (`imageAlt`) :

**M1 · « Pour débuter : la classe de 25 »** (`classe-alternants.webp`)

- Contenu : 25 silhouettes d'étudiants en 5 rangées de 5, dont 10 colorées et marquées
  « alternance ». À droite, trois lignes : « Partie : 10 alternants » ; « Tout : 25 étudiants » ;
  « p = 10 ÷ 25 = 0,4 = 40 % ». En bas, bandeau : « Partie en haut, tout en bas ». Encadré
  secondaire : « 60 % de la classe : 0,6 × 25 = 15 étudiants ».
- Mise en page : silhouettes à gauche (60 % de la largeur), calcul à droite ; la fraction 10/25
  dessinée en grand, « 10 » en couleur, « 25 » en gris.
- `imageAlt` : « Infographie « Pour débuter : la classe de 25 ». Une classe de 25 étudiants, dont
  10 en alternance, représentés par 25 silhouettes dont 10 colorées. La partie, 10 alternants, se
  divise par le tout, 25 étudiants : p = 10 ÷ 25 = 0,4, soit 40 %. Moyen mnémotechnique : partie en
  haut, tout en bas. Encadré : 60 % de la classe font 0,6 × 25 = 15 étudiants. »

**M2 · « Parmi qui ? »** (`parmi-qui.webp`)

- Contenu : trois cercles emboîtés : « Lycée : 800 élèves » ; dedans « STMG : 200 élèves » ;
  dedans « Filles de STMG : 120 ». Deux flèches depuis le petit cercle : vers le cercle moyen
  « 120 ÷ 200 = 60 % des élèves de STMG » ; vers le grand cercle « 120 ÷ 800 = 15 % des élèves du
  lycée ». En bas : « Même partie, autre tout, autre pourcentage ». Petit encart tableur : « Le
  total ne bouge pas : =B2/$B$6 ».
- Mise en page : cercles au centre-gauche, deux étiquettes de flèches à droite, encart tableur en
  bas à droite.
- `imageAlt` : « Infographie « Parmi qui ? ». Un lycée de 800 élèves, dont 200 en STMG, dont 120
  filles. Les 120 filles font 120 ÷ 200 = 60 % des élèves de STMG, mais 120 ÷ 800 = 15 % des élèves
  du lycée : même partie, autre tout, autre pourcentage. Le tout s'appelle la population de
  référence. Encart tableur : la part s'écrit =B2/$B$6, le total figé par des dollars. »

**M3 · « La part d'une part »** (`salle-de-spectacle.webp`)

- Contenu : une salle de 200 sièges (grille stylisée). 60 sièges teintés « moins de 18 ans :
  30 % » ; parmi eux, 24 marqués d'une étoile « place gratuite : 40 % d'entre eux ». Calcul :
  « 0,30 × 0,40 = 0,12 → 12 % de la salle = 24 spectateurs ». Barré : « 30 % + 40 % = 70 % ». Bandeau :
  « « Parmi » → je multiplie ».
- Mise en page : grille de sièges à gauche, calcul en colonne à droite, l'erreur barrée en rouge
  sous le calcul juste.
- `imageAlt` : « Infographie « La part d'une part ». Une salle de 200 spectateurs : 30 % ont moins de
  18 ans, soit 60 ; parmi eux, 40 % ont une place gratuite, soit 24. Part de la salle : 0,30 × 0,40
  = 0,12, soit 12 %, et 24 ÷ 200 = 0,12. L'addition 30 % + 40 % = 70 % est barrée. Moyen
  mnémotechnique : parmi, je multiplie. »

**M4 · « Deux classes, un taux »** (`deux-classes.webp`)

- Contenu : deux blocs. Classe A : 20 élèves, 50 % reçus, « 10 reçus ». Classe B : 30 élèves, 80 %
  reçus, « 24 reçus ». Au centre : « 10 + 24 = 34 reçus sur 20 + 30 = 50 élèves → 68 % ». Barré :
  « (50 % + 80 %) ÷ 2 = 65 % ». Une balance penche vers la classe B, plus nombreuse. Bandeau :
  « Des personnes, pas des pourcentages ».
- Mise en page : classe A à gauche (plus petite), classe B à droite (plus grande), balance et
  calcul au centre.
- `imageAlt` : « Infographie « Deux classes, un taux ». Classe A : 20 élèves, 50 % reçus, soit 10 ;
  classe B : 30 élèves, 80 % reçus, soit 24. Taux global : 34 reçus sur 50 élèves, soit 68 %. La
  moyenne simple des deux taux, 65 %, est barrée : la classe B, plus nombreuse, pèse plus. Moyen
  mnémotechnique : des personnes, pas des pourcentages. »

**M5 · « Points ou pourcentage ? »** (`code-de-la-route.webp`)

- Contenu : deux barres « Réussite au code » : 2025, 60 % ; 2026, 66 %. Entre les deux, accolade
  « 66 − 60 = + 6 points ». Encadré évolution : « (66 − 60) ÷ 60 = 0,10 → + 10 % ». Barré :
  « + 6 % ». Bandeau : « Deux % qu'on soustrait : des points ».
- Mise en page : barres à gauche, axe partant de 0 (pas d'axe tronqué), les deux calculs à
  droite, l'un sous l'autre.
- `imageAlt` : « Infographie « Points ou pourcentage ? ». Le taux de réussite au code passe de 60 %
  en 2025 à 66 % en 2026 : l'écart est de 66 − 60 = 6 points. En évolution, (66 − 60) ÷ 60 = 0,10,
  soit + 10 %. L'écriture « + 6 % » est barrée. Moyen mnémotechnique : deux pourcentages qu'on
  soustrait, ce sont des points. »

**M6 · « Une marge, deux taux »** (`etiquette-marge-marque.webp`)

- Contenu : un tee-shirt avec deux étiquettes : « Coût d'achat : 10 € HT » (étiquette fournisseur,
  grise) et « Prix de vente : 25 € HT » (étiquette magasin, colorée). Flèche entre les deux :
  « Marge : 15 € ». Deux calculs : « Taux de marge = 15 ÷ 10 = 150 % (÷ coût d'achat) » ; « Taux de
  marque = 15 ÷ 25 = 60 % (÷ prix de vente) ». Bandeau : « La marque se lit sur l'étiquette ».
- Mise en page : tee-shirt au centre, étiquette d'achat à gauche, étiquette de vente à droite,
  calculs sous chaque étiquette, du même côté que leur diviseur.
- `imageAlt` : « Infographie « Une marge, deux taux ». Un tee-shirt acheté 10 € HT et vendu 25 € HT :
  la marge est de 15 €. Taux de marge : 15 ÷ 10 = 150 %, la marge rapportée au coût d'achat. Taux
  de marque : 15 ÷ 25 = 60 %, la marge rapportée au prix de vente. Moyen mnémotechnique : la marque
  se lit sur l'étiquette, celle du prix de vente. »

### 8.4 Sources des données

- Partie Libre (salariés, clients, carte, réservations, ventes, consoles, manettes, jeux), le
  Week-end du jeu et tous les exemples : données fictives créées pour ce cours.
- Forme de la mini-situation : situation CCF n° 1 du BTS CG (55 minutes, 3 points sur 10 au
  tableur), formule de la part en C3 recopiée vers le bas.
