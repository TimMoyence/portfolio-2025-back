# B3-01 · Expert Data : de la donnée brute à la décision — conception de référence (gabarit b3)

> Cahier des charges du premier cours « Outils informatiques du manager » du Bachelor 3 (B3GSP) :
> une séance de 3 h 30 dont 30 minutes de pause, qui conduit d'un export commercial sale à un
> tableau de bord de direction en six niveaux (comprendre, nettoyer, transformer, modéliser,
> visualiser, décider). Les étudiants travaillent dans Excel sur un classeur fourni ; le runtime
> pose les questions, recueille les résultats et dévoile les corrections. Ce document ne contient
> aucun code exécutable ; toute divergence d'implémentation est un défaut de l'implémentation.

| Rubrique    | Valeur                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Date        | 8 octobre 2026                                                                                                     |
| Statut      | **Conception validée le 8 octobre 2026**, ouverture et acte 1 ajustés aux règles communes (§ 2.6)                  |
| Cours       | `b3-01-donnee-brute-decision`                                                                                      |
| Gabarit     | `b3`, nouveau : les contrôles du v3 sans la mini-situation CCF ni l'équivalence papier (§ 6.1)                     |
| Titre servi | « Expert Data : de la donnée brute à la décision »                                                                 |
| Séance      | **Mardi 13 octobre 2026, 8 h 30 – 12 h**, B3GSP                                                                    |
| Durée       | **180 minutes exactes** (somme des écrans), 3 actes de 56, 60 et 64 minutes, plus 2 pauses de 15 min hors durée    |
| Écrans      | **40**, dont 14 écrans catalogue                                                                                   |
| Sources     | Programme B3 « Outils informatiques du manager » 2026-27 et son cahier des charges d'évaluation ; données fictives |

---

## 0. Synthèse des décisions

- **Toute la chaîne en une séance.** Les six niveaux et le tableau de bord se font le 13/10. La
  séance 2 (17/11, matin) ne reprend pas le tableur : elle construit **l'agent Data Analyst**, à
  qui l'on confie ce que les étudiants ont fait à la main.
- **Le cahier de règles de l'analyste** relie les deux séances : chaque niveau se conclut par une
  règle rédigée par l'étudiant (réponse libre). Le rapport de séance les conserve ; elles
  deviennent les instructions de l'agent en séance 2.
- **Runtime `/cours` + vrai Excel.** Le moteur `fp-sheet` ne connaît ni `INDEX`, ni
  `SOMME.SI.ENS`, ni les TCD : les manipulations se font dans Excel, et chaque atelier se
  termine par la saisie de résultats chiffrés, corrigés contre le jeu de données.
- **Socle commun + variantes 365.** Le cours enseigne ce qui fonctionne sur toute version
  d'Excel depuis 2019 (`INDEX`/`EQUIV`, `SOMME.SI.ENS`, `NB.SI.ENS`, TCD, segments) ;
  `RECHERCHEX`, `FILTRE`, `UNIQUE`, `TRIER` et Power Query sont des encadrés « si vous avez 365 ».
- **Fil rouge : Norvane Équipement**, réseau commercial fictif de 12 agences, 36 commerciaux,
  ≈ 4 000 lignes de commande de janvier 2025 à septembre 2026, avec des anomalies semées en
  nombre connu et quatre « histoires cachées » que le tableau de bord doit révéler.
- **Une grille 2 × 2 de la qualité des données** (faux / suspect × correction automatique / à
  demander à un humain), règle d'or : rien de douteux ne se corrige seul ; on ne supprime pas, on
  signale. C'est aussi la logique de l'agent de la séance 2.
- **Classeurs de reprise** au début des actes 2 et 3 : tout le monde repart de la même base, ce
  qui garantit des résultats saisis comparables et qu'un étudiant bloqué au nettoyage ne perd pas
  le tableau de bord.
- **Gabarit `b3`** : 40 écrans au plus, 180 minutes au plus, cycle réfléchir → comprendre →
  s'exercer, trois temps par exercice ; ni `fp-escape` obligatoire ni mode papier.
- **Une seule fonctionnalité nouvelle du runtime : la pièce jointe d'écran** (le classeur
  téléchargeable depuis le poste étudiant).

## 1. Objectifs d'apprentissage et public

### 1.1 Rattachement au programme et à l'évaluation

Programme B3 « Outils informatiques du manager » 2026-27, séances 1 et 2 « Maîtriser un tableur
en mode avancé » : fonctions statistiques, graphiques, tableau de bord, fonctions de base de
données sur un tableur, préparation d'une base de données, dates et heures, fonctions de
recherche. Le programme fusionne ici ces deux séances en une seule ; la séance 2 du calendrier est
consacrée à l'agent Data Analyst.

Cahier des charges de l'évaluation : cas pratique d'1 heure à la dernière séance ; **tableur sur
8 points sur 20**. Couverture des points évaluables du tableur :

| Point évaluable du cahier des charges     | Écran noté                   | Ailleurs                |
| ----------------------------------------- | ---------------------------- | ----------------------- |
| Créer un tableau, présenter les données   | A2-11 (tableau structuré)    | A2-09                   |
| TCD, filtres, segments, regroupements     | A1-08 (filtre), A2-11, A3-09 | A2-10                   |
| Mise en forme conditionnelle              | A3-09                        | A3-08                   |
| Calculer par pourcentage                  | A2-07, A2-11, A3-05, A3-09   |                         |
| Graphique : créer, légender, options      | A3-05                        | A3-03, A3-04            |
| Fonctions de recherche                    | A2-04                        | A2-03                   |
| `SOMMEPROD`, `NB.SI.ENS`, `SOMME.SI.ENS`  | A2-04, A2-07                 | A2-03, A2-06            |
| `SERIE.JOUR.OUVRE` (et `NB.JOURS.OUVRES`) | A2-07                        | A2-06                   |
| `DATEDIF`, `JOURSEM`, `TEMPS`             | — (palier défi de A2-07)     | A2-06, fiche mémo A3-11 |

### 1.2 Objectifs du cours

À la fin de la séance, l'étudiant sait :

1. décrire un jeu de données inconnu : observation, variable et son type, identifiant,
   granularité, source de vérité, tables reliées par une clé ;
2. classer une anomalie dans la grille 2 × 2 et décider ce qui se corrige seul et ce qui se
   demande ;
3. nettoyer un export : casse et espaces, nombres stockés en texte, dates en texte, doublons
   exacts, colonne de contrôle ;
4. reconnaître la famille d'un problème (chercher, compter, additionner sous conditions, comparer,
   classer, transformer, filtrer, regrouper, manipuler le temps, détecter une anomalie) et
   choisir la fonction qui le résout ;
5. calculer sous conditions et sur des dates ouvrées, et distinguer moyenne et médiane, taux
   moyen et ratio de sommes ;
6. modéliser : tableau structuré, colonnes calculées, TCD, regroupements, segments ;
7. choisir un graphique d'après la décision qu'il doit permettre ;
8. assembler un tableau de bord de direction (KPI en contexte, graphiques, segments, anomalies
   en MFC) et formuler une recommandation chiffrée.

### 1.3 Lien avec la séance 2 : l'agent Data Analyst

Ce que la séance 1 fait à la main, la séance 2 le délègue : le dictionnaire des données (A1-07),
la grille de qualité (A1-10, A1-13), les familles de problèmes (A2-02), le choix du graphique
(A3-04) et les règles du cahier (A1-15, A2-12, A3-12). Le rapport de séance et l'export de la
synthèse fournissent ces règles telles que les étudiants les ont écrites.

### 1.4 Public et conditions

B3GSP, Bachelor 3e année, en contrat initial ou en alternance. Bases d'Excel acquises (saisie
d'une formule, recopie, `SOMME`, `MOYENNE`, tri, filtre) : pas de leçon sur les gestes de base,
une seule question de rappel à l'ouverture (A1-01), qui sert aussi de diagnostic d'une classe
que le formateur découvre. Un poste par étudiant avec Excel (Windows ou Mac, version 2019 ou plus
récente, en français, séparateur `;`) ; pas de mode papier. Séance de 3 h 30 : 180 minutes de
travail, pause de 15 minutes après l'acte 1 (9 h 26) et après l'acte 2 (10 h 41).

## 2. Architecture

### 2.1 Les trois actes

| Acte | Rôle                      | Niveaux           | Minutes |
| ---- | ------------------------- | ----------------- | ------: |
| 1    | On vous confie le fichier | ouverture, N1, N2 |      56 |
| 2    | Faire parler les données  | N3, N4            |      60 |
| 3    | Décider                   | N5, N6, clôture   |      64 |

Horaires indicatifs : acte 1 de 8 h 30 à 9 h 26, acte 2 de 9 h 41 à 10 h 41, acte 3 de 10 h 56 à
12 h. Les pauses ne sont pas des écrans.

### 2.2 Le cycle d'un niveau

Chaque niveau suit : **Réfléchir** (vote non noté) → **Comprendre** (trace écrite `lesson`,
parfois précédée d'un tableau v2) → **S'exercer** (tri ou atelier Excel noté, corrigé sur place).
Un exemple guidé `fp-worked` s'insère avant l'atelier quand la manipulation est nouvelle.

Chaque exercice annonce ses temps dans les notes formateur, sous la forme
`• Temps : réflexion N min · travail M min · correction K min`, dont la somme est la durée de
l'écran. La correction se dévoile sur l'écran de l'exercice (`correctionSurPlace`), question par
question.

### 2.3 Les deux paliers d'un atelier Excel

Chaque atelier porte un palier **essentiel** (les questions notées) et un palier **défi**, écrit
dans l'énoncé, non noté, corrigé dans la correction sur place. Le défi occupe les étudiants
rapides sans retarder la correction collective.

### 2.4 Les classeurs de reprise

| Classeur                                | Servi sur | Contenu                                                                                        |
| --------------------------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `B3-01_export_ventes.xlsx`              | A1-02     | Export brut : `Commandes` sale, `Clients`, `Produits`, `Agences`, `Objectifs`                  |
| `B3-01_reprise_acte_2.<empreinte>.xlsx` | A2-01     | `Commandes` nettoyée (lignes saines seulement), `Quarantaine`, référentiels inchangés          |
| `B3-01_reprise_acte_3.<empreinte>.xlsx` | A3-02     | Reprise 1 + tableau structuré `T_Commandes` avec région, catégorie, coût, marge, délai, retard |

À l'ouverture des actes 2 et 3, **tout le monde ouvre le classeur de reprise**, y compris ceux
qui ont tout réussi : les résultats saisis se comparent ainsi à une même base. Les deux classeurs
de reprise sont publiés sous un nom suffixé de leur empreinte (§ 6.2).

Les formules montrées à l'écran s'écrivent sans espace avant `;`, `:` ou `!`. La typographie
automatique des contenus n'épargne qu'un texte qui commence par `=` : une formule glissée dans une
phrase recevrait sinon une espace insécable, qu'Excel refuse au copier-coller.

### 2.5 Le cahier de règles

Trois écrans `fp-pro` recueillent les règles : A1-15 (N1 et N2), A2-12 (N3 et N4), A3-12 (N5 et
N6, puis relecture des six). Une règle est une phrase impérative et vérifiable (« une ville n'est
jamais une clé : on relie par `client_id` »). Les notes formateur donnent une règle modèle par
niveau, montrée seulement après la saisie.

### 2.6 Règles de structure

Le cours déclare `gabarit: 'b3'` et passe les règles communes et les contrôles du gabarit
(§ 6.1) : 40 écrans ≤ 40, 180 minutes ≤ 180, chaque trace écrite précédée d'une réflexion depuis
le dernier exercice et suivie d'un exercice, chaque exercice avec ses trois temps. Exposition
continue de 6 minutes au plus (`fp-worked` est interactif).

Trois règles communes à tous les cours, vérifiées dans `StructureCours.ts`, ont ajusté l'acte 1
après la validation du brainstorming :

- un cours qui pose des questions **ouvre par un rappel `fp-recall`** et **se clôt par un
  `fp-exit`** : A1-01 devient un rappel noté sur la recopie d'une formule, le courriel passe en
  A1-02 ;
- une suite d'exercices notés consécutifs dure **au moins 8 minutes**, et un exercice noté
  **au plus 15 minutes**, correction comprise : A1-07 + A1-08 passent de 7 à 8 minutes ;
- pour tenir 40 écrans et 180 minutes, les deux votes d'ouverture (part douteuse, clé) n'en font
  plus qu'un, à deux questions (`questionJumelle`), la carte passe à 2 minutes et le billet de
  sortie à 5.

### 2.7 Diffusion

Catalogue : le courriel d'ouverture et son classeur brut, la carte de la séance, les neuf traces
écrites, le tableau des familles, le graphique trompeur et la fiche mémo. Tout le reste est servi
en séance, dont les deux classeurs de reprise, qui portent des colonnes calculées. Aucun écran
catalogue ne porte une réponse : le classeur brut est la matière de l'exercice, pas son résultat.

### 2.8 Notation

Fonctions en français et en majuscules (`SOMME.SI.ENS`), arguments séparés par `;`, nombres au
format français (1 250,50 €, 18,4 %). Les variantes 365 s'écrivent dans un encadré « Si vous avez
Excel 365 ». Saisies numériques : montants arrondis à l'euro, tolérance de 1 € ; pourcentages
arrondis au dixième de point, tolérance de 0,1 point ; comptages exacts. L'étudiant saisit le
nombre seul (`1250`, `18,4`) : l'unité est affichée à côté du champ, et le lecteur de saisie du
poste refuse « 1 250 € » ou « 18,4 % ». Chaque énoncé le rappelle (« en euros, sans le
symbole »).

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B3-01-A{acte}-{rang}-{SLUG}`, conformes à `^B3-01-A[1-3]-\d{2}-[A-Z0-9-]+$`.
« I » = interactif. « Q » = questions fermées notées portées par l'écran.

| Rang | Identifiant                        | Min | Brique · rendu           |  I  |   Q | Diffusion |
| ---: | ---------------------------------- | --: | ------------------------ | :-: | --: | --------- |
|    1 | B3-01-A1-01-RAPPEL-RECOPIE         |   3 | `fp-recall`              |  I  |   1 | seance    |
|    2 | B3-01-A1-02-COURRIEL               |   2 | `fp-story` · v2 `hero`   |     |   0 | catalogue |
|    3 | B3-01-A1-03-CARTE                  |   2 | `fp-story` · v2 `grid`   |     |   0 | catalogue |
|    4 | B3-01-A1-04-VOTE-PART-ET-CLE       |   3 | `fp-vote` · 2 questions  |  I  |   0 | seance    |
|    5 | B3-01-A1-05-COURS-DONNEE           |   3 | `fp-story` · v2 `lesson` |     |   0 | catalogue |
|    6 | B3-01-A1-06-COURS-RELATIONS        |   3 | `fp-story` · v2 `lesson` |     |   0 | catalogue |
|    7 | B3-01-A1-07-TRI-COLONNES           |   4 | `fp-cardsort`            |  I  |   1 | seance    |
|    8 | B3-01-A1-08-ATELIER-GRANULARITE    |   4 | `questionnaire`          |  I  |   2 | seance    |
|    9 | B3-01-A1-09-VOTE-CA-TEXTE          |   2 | `fp-vote`                |  I  |   0 | seance    |
|   10 | B3-01-A1-10-COURS-GRILLE           |   3 | `fp-story` · v2 `lesson` |     |   0 | catalogue |
|   11 | B3-01-A1-11-COURS-OUTILS           |   3 | `fp-story` · v2 `lesson` |     |   0 | catalogue |
|   12 | B3-01-A1-12-EXEMPLE-NETTOYAGE      |   3 | `fp-worked`              |  I  |   0 | seance    |
|   13 | B3-01-A1-13-TRI-ANOMALIES          |   5 | `fp-cardsort`            |  I  |   1 | seance    |
|   14 | B3-01-A1-14-ATELIER-NETTOYAGE      |  12 | `questionnaire`          |  I  |   4 | seance    |
|   15 | B3-01-A1-15-REGLES-ACTE-1          |   4 | `fp-pro`                 |  I  |   0 | seance    |
|   16 | B3-01-A2-01-VOTE-FAMILLE           |   3 | `fp-vote`                |  I  |   0 | seance    |
|   17 | B3-01-A2-02-FAMILLES               |   3 | `fp-story` · v2 `table`  |     |   0 | catalogue |
|   18 | B3-01-A2-03-COURS-CHERCHER-AGREGER |   3 | `fp-story` · v2 `lesson` |     |   0 | catalogue |
|   19 | B3-01-A2-04-ATELIER-RECHERCHE      |  10 | `questionnaire`          |  I  |   3 | seance    |
|   20 | B3-01-A2-05-VOTE-DELAI             |   2 | `fp-vote`                |  I  |   0 | seance    |
|   21 | B3-01-A2-06-COURS-TEMPS-STATS      |   3 | `fp-story` · v2 `lesson` |     |   0 | catalogue |
|   22 | B3-01-A2-07-ATELIER-DELAIS-MARGE   |  10 | `questionnaire`          |  I  |   3 | seance    |
|   23 | B3-01-A2-08-VOTE-NOUVELLES-LIGNES  |   2 | `fp-vote`                |  I  |   0 | seance    |
|   24 | B3-01-A2-09-COURS-TCD              |   3 | `fp-story` · v2 `lesson` |     |   0 | catalogue |
|   25 | B3-01-A2-10-EXEMPLE-TCD            |   3 | `fp-worked`              |  I  |   0 | seance    |
|   26 | B3-01-A2-11-ATELIER-TCD            |  14 | `questionnaire`          |  I  |   2 | seance    |
|   27 | B3-01-A2-12-REGLES-ACTE-2          |   4 | `fp-pro`                 |  I  |   0 | seance    |
|   28 | B3-01-A3-01-GRAPHIQUE-TROMPEUR     |   1 | `fp-story` · v2 `chart`  |     |   0 | catalogue |
|   29 | B3-01-A3-02-VOTE-GRAPHIQUE         |   2 | `fp-vote`                |  I  |   0 | seance    |
|   30 | B3-01-A3-03-COURS-GRAPHIQUES       |   3 | `fp-story` · v2 `lesson` |     |   0 | catalogue |
|   31 | B3-01-A3-04-TRI-GRAPHIQUES         |   4 | `fp-cardsort`            |  I  |   1 | seance    |
|   32 | B3-01-A3-05-ATELIER-GRAPHIQUES     |   8 | `questionnaire`          |  I  |   2 | seance    |
|   33 | B3-01-A3-06-VOTE-TRENTE-SECONDES   |   3 | `fp-vote`                |  I  |   0 | seance    |
|   34 | B3-01-A3-07-COURS-DASHBOARD        |   3 | `fp-story` · v2 `lesson` |     |   0 | catalogue |
|   35 | B3-01-A3-08-EXEMPLE-MFC-SEGMENTS   |   3 | `fp-worked`              |  I  |   0 | seance    |
|   36 | B3-01-A3-09-ATELIER-DASHBOARD      |  15 | `questionnaire`          |  I  |   4 | seance    |
|   37 | B3-01-A3-10-RECOMMANDATIONS        |   9 | `fp-pro`                 |  I  |   0 | seance    |
|   38 | B3-01-A3-11-FICHE-MEMO             |   3 | `fp-story` · v2 `grid`   |     |   0 | catalogue |
|   39 | B3-01-A3-12-CAHIER-DE-REGLES       |   5 | `fp-pro`                 |  I  |   0 | seance    |
|   40 | B3-01-A3-13-BILLET-DE-SORTIE       |   5 | `fp-exit`                |  I  |   1 | seance    |

Rythme : 142 minutes interactives, 38 d'exposition, exposition continue de 6 minutes au plus
(A1-05 + A1-06, A1-10 + A1-11, A2-02 + A2-03).

### 3.2 Acte 1 — On vous confie le fichier (56 min)

#### A1-01 · `B3-01-A1-01-RAPPEL-RECOPIE` — 3 min · `fp-recall` · séance

- Titre public : « Rappel : recopier une formule »
- Pendant que les postes rejoignent la séance. Question notée `b3-01-a1-rappel-recopie` : en D2,
  `=C2*$H$1` est recopiée en D3. Que contient D3 ? `=C3*$H$1` (bonne) ; `=C3*$H$2` (piège
  `reference-absolue-ignoree`) ; `=C2*$H$1` (piège `reference-absolue-ignoree`).
- Diagnostic : le taux de réussite dit au formateur s'il faut insister sur le `$` à l'atelier
  A2-04.

#### A1-02 · `B3-01-A1-02-COURRIEL` — 2 min · v2 `hero` · catalogue

- Titre public : « Expert Data : de la donnée brute à la décision »
- Lundi 12 octobre, 8 h. Nadia Ferrand, directrice commerciale de Norvane Équipement, écrit :
  « Voici l'export des ventes depuis janvier 2025. Qu'est-ce qui ne va pas dans mon réseau ? J'ai
  le comité de direction jeudi. » Mention « Données fictives ».
- Pièce jointe : `B3-01_export_ventes.xlsx`.

#### A1-03 · `B3-01-A1-03-CARTE` — 2 min · v2 `grid` · catalogue

- Titre public : « La carte de la séance »
- Six cases : comprendre, nettoyer, transformer, modéliser, visualiser, décider ; à chaque case,
  le livrable du niveau et la règle qu'il ajoute au cahier. Bandeau : « Séance 2 : un agent
  appliquera vos règles. »

#### A1-04 · `B3-01-A1-04-VOTE-PART-ET-CLE` — 3 min · `fp-vote` à deux questions · séance

- Titre public : « Vote : le fichier et Dupont, Bordeaux »
- Question 1 : dans un export de ≈ 4 000 lignes, quelle part est fausse ou douteuse : moins de
  1 %, environ 5 %, environ 15 %, plus de 30 % ? Pas de révélation ici : la réponse tombe à la
  correction de l'atelier A1-14 (environ 15 % dans ce fichier, § 4.3).
- Question 2 (`questionJumelle`) : « Dupont – Bordeaux » suffit-il à identifier un client ?
  Oui ; non, il faut aussi le SIRET ; non, il faut un identifiant attribué par le système.
  Révélation commentée : deux Dupont à Bordeaux dans `Clients`, et un même client écrit de deux
  façons.

#### A1-05 · `B3-01-A1-05-COURS-DONNEE` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : lire un jeu de données »
- `definition` : une observation (une ligne), une variable (une colonne) ; `property` : les cinq
  types (identifiant, numérique, catégorie, date, booléen) et la donnée manquante ; `method` :
  trouver la granularité (« une ligne = un produit dans une commande ») avant de compter ;
  `example` : la source de vérité (la ville du client se lit dans `Clients`, pas dans l'export).

#### A1-06 · `B3-01-A1-06-COURS-RELATIONS` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : des tables reliées par des clés »
- `definition` : clé primaire, clé étrangère ; `property` : `Clients` ← `client_id` →
  `Commandes` → `produit_id` → `Produits`, `agence_id` → `Agences` ; `method` : une clé est
  unique, stable et sans signification ; `example` : pourquoi « Dupont Bordeaux » n'est pas une
  clé fiable.

#### A1-07 · `B3-01-A1-07-TRI-COLONNES` — 4 min · `fp-cardsort` · séance

- Titre public : « Exercice 1 — Le dictionnaire des données »
- Temps : réflexion 1 min · travail 2 min · correction 1 min.
- Classer les 13 colonnes de `Commandes` en cinq catégories : identifiant (`n_commande`,
  `client_id`, `commercial_id`, `produit_id`, `agence_id`), date (`date_commande`,
  `date_livraison`), catégorie (`ville`), numérique (`quantite`, `prix_unitaire_ht`, `remise`,
  `ca_ht`), booléen (`facturee`). Pièges `identifiant-pris-pour-nombre` (`n_commande`),
  `libelle-pris-pour-cle`.

#### A1-08 · `B3-01-A1-08-ATELIER-GRANULARITE` — 4 min · `questionnaire` · séance

- Titre public : « Exercice 2 — Une ligne, c'est quoi ? »
- Temps : réflexion 1 min · travail 2 min · correction 1 min.
- `b3-01-a1-lignes-commande` (numérique) : filtrez `n_commande` sur C-10234 ; combien de
  lignes ? (3, fixé par le générateur) ; piège `lignes-comptees-pour-commandes`.
- `b3-01-a1-granularite` (vote noté) : le fichier compte-t-il plus de lignes que de commandes,
  autant, ou moins ? (plus) ; piège `lignes-comptees-pour-commandes`.

#### A1-09 · `B3-01-A1-09-VOTE-CA-TEXTE` — 2 min · `fp-vote` · séance

- Titre public : « Vote : un CA aligné à gauche »
- Une cellule de `ca_ht` affiche « 1 250,00 € », alignée à gauche. Que fait `SOMME` de la
  colonne ? Elle l'ajoute ; elle l'ignore sans prévenir ; elle affiche une erreur. Révélation :
  elle l'ignore sans prévenir — c'est le pire cas.

#### A1-10 · `B3-01-A1-10-COURS-GRILLE` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : faux, suspect, automatique, humain »
- `definition` : faux (l'erreur est certaine), suspect (l'erreur est possible) ; `property` : la
  grille 2 × 2 et sa case vide, « suspect · automatique » ; `method` : rien de douteux ne se
  corrige seul ; on ne supprime pas, on signale (colonne de contrôle, onglet `Quarantaine`) ;
  `example` : une quantité de −2 est-elle une erreur ou un avoir ? On demande.

#### A1-11 · `B3-01-A1-11-COURS-OUTILS` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : les outils du nettoyage »
- `method` : `SUPPRESPACE`, `NOMPROPRE`, `SUBSTITUE` puis `CNUM` pour un nombre en texte,
  `DATEVAL` pour une date en texte ISO, « Données › Supprimer les doublons » sur une copie,
  colonne `controle` avec `SI` et `OU` ; `property` : on nettoie dans une nouvelle colonne, jamais
  sur la donnée brute ; encadré 365 : Power Query refait le nettoyage d'un clic au prochain
  export.

#### A1-12 · `B3-01-A1-12-EXEMPLE-NETTOYAGE` — 3 min · `fp-worked` · séance

- Titre public : « Exemple guidé : deux cellules à soigner »
- Étape 1 : « ␣bordeaux␣ » → `=NOMPROPRE(SUPPRESPACE(F2))` → « Bordeaux ». Étape 2 :
  « 1 250,00 € » → `=CNUM(SUBSTITUE(SUBSTITUE(L2;" €";"");" ";""))` → 1250. Étape 3 :
  vérifier avec `ESTNUM`. Le fichier sépare les milliers par une espace ordinaire ; les notes
  formateur signalent que les vrais exports utilisent souvent l'espace insécable, `CAR(160)`.

#### A1-13 · `B3-01-A1-13-TRI-ANOMALIES` — 5 min · `fp-cardsort` · séance

- Titre public : « Exercice 3 — Classer les anomalies »
- Temps : réflexion 1 min · travail 3 min · correction 1 min.
- Dix cartes tirées du fichier, quatre catégories (la case « suspect · automatique » reste
  vide) : faux · automatique (ville en majuscules ou avec espaces ; CA en texte ; ligne exportée
  deux fois ; CA ≠ quantité × prix × (1 − remise)) ; faux · humain (`produit_id` absent du
  référentiel ; livraison antérieure à la commande) ; suspect · humain (date « 05/04/26 » d'un
  autre système ; quantité négative ; prix unitaire dix fois le prix catalogue ; client en double
  probable dans `Clients`). Pièges `suspect-corrige-sans-validation`,
  `suppression-au-lieu-de-signalement`.

#### A1-14 · `B3-01-A1-14-ATELIER-NETTOYAGE` — 12 min · `questionnaire` · séance

- Titre public : « Exercice 4 — Nettoyer l'export »
- Temps : réflexion 1 min · travail 9 min · correction 2 min.
- Essentiel : copie de `Commandes`, colonnes nettoyées `ville` et `ca_ht`, suppression des
  doublons exacts, colonne `controle` sur les dates brutes :
  `=SI(OU(date_livraison<date_commande;quantite<=0;commercial_id="");"À vérifier";"OK")`.
  Une date restée en texte est signalée elle aussi (Excel classe tout texte au-dessus de tout
  nombre) : c'est voulu, une date en texte est à vérifier. Défi : convertir les dates ISO par
  `DATEVAL`, recalculer `ca_ht` et signaler les écarts de plus d'un euro.
- `b3-01-a1-lignes-uniques` : nombre de lignes après suppression des doublons exacts ; piège
  `doublons-supprimes-sur-une-colonne`.
- `b3-01-a1-ca-total` : CA total HT, en euros, après dédoublonnage et conversion ; piège
  `texte-pris-pour-nombre`.
- `b3-01-a1-villes` : nombre de villes distinctes après normalisation ; piège
  `casse-non-normalisee`.
- `b3-01-a1-a-verifier` : nombre de lignes « À vérifier » ; pièges
  `suspect-corrige-sans-validation` (dates converties par `DATEVAL` avant le contrôle) et
  `suppression-au-lieu-de-signalement`.
- La correction révèle la première question du vote A1-04 : part des lignes fausses ou douteuses
  du fichier.

#### A1-15 · `B3-01-A1-15-REGLES-ACTE-1` — 4 min · `fp-pro` · séance

- Titre public : « Cahier de règles : niveaux 1 et 2 »
- Deux questions libres : `regle-comprendre`, `regle-nettoyer`. Règles modèles dans les notes :
  « Je relie les tables par un identifiant, jamais par un libellé » ; « Je corrige seul ce qui
  est faux et certain ; je signale ce qui est douteux et je demande. »
- Puis pause de 15 minutes.

### 3.3 Acte 2 — Faire parler les données (60 min)

#### A2-01 · `B3-01-A2-01-VOTE-FAMILLE` — 3 min · `fp-vote` · séance

- Titre public : « Vote : quelle famille de problème ? »
- Pièce jointe : `B3-01_reprise_acte_2.xlsx`, ouverte par tous.
- Nadia demande « le CA de Rennes en informatique en 2026 ». Est-ce chercher, compter,
  additionner sous conditions ou regrouper ? Révélation : additionner sous conditions, après avoir
  cherché la catégorie du produit.

#### A2-02 · `B3-01-A2-02-FAMILLES` — 3 min · v2 `table` · catalogue

- Titre public : « Les dix familles de problèmes »
- Colonnes : famille, question type de la direction, fonction socle, variante 365. Chercher
  (`INDEX`/`EQUIV` ; `RECHERCHEX`), compter (`NB.SI.ENS`), additionner sous conditions
  (`SOMME.SI.ENS`, `SOMMEPROD`), comparer (`SI`, `ET`, `OU`), classer (`RANG`, `GRANDE.VALEUR` ;
  `TRIER`), transformer (`SUPPRESPACE`, `CNUM`, `TEXTE`), filtrer (filtre automatique ;
  `FILTRE`), regrouper (TCD ; `UNIQUE`), manipuler le temps (`NB.JOURS.OUVRES`,
  `SERIE.JOUR.OUVRE`, `DATEDIF`), détecter une anomalie (MFC, `MEDIANE`, `ECARTYPE`).

#### A2-03 · `B3-01-A2-03-COURS-CHERCHER-AGREGER` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : chercher et additionner sous conditions »
- `method` : `=INDEX(Produits!C:C;EQUIV(I2;Produits!A:A;0))`, le 0 pour une correspondance
  exacte ; `property` : `SOMME.SI.ENS(somme;plage1;critère1;…)` et `NB.SI.ENS` ; `method` :
  critères écrits `">0,15"` ou `">="&DATE(2026;1;1)` ; figer les plages avec `$` ; encadré 365 :
  `RECHERCHEX`.

#### A2-04 · `B3-01-A2-04-ATELIER-RECHERCHE` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 5 — Relier et additionner »
- Temps : réflexion 1 min · travail 7 min · correction 2 min.
- Essentiel : colonnes `region` (depuis `Agences`) et `categorie` (depuis `Produits`) par
  `INDEX`/`EQUIV`. Défi : colonne `cout` (quantité × coût unitaire).
- `b3-01-a2-ca-rennes-info` : CA HT de Rennes en informatique, janvier à septembre 2026 ; pièges
  `plage-recherche-non-figee`, `critere-mal-ecrit`.
- `b3-01-a2-remises-marseille` : nombre de lignes de Marseille dont la remise dépasse 15 % ;
  piège `critere-mal-ecrit` (critère écrit 15 au lieu de 0,15).
- `b3-01-a2-ca-ouest` : CA HT de la région Ouest, janvier à septembre 2026 ; piège
  `plage-recherche-non-figee`.

#### A2-05 · `B3-01-A2-05-VOTE-DELAI` — 2 min · `fp-vote` · séance

- Titre public : « Vote : vendredi, lundi »
- Commande le vendredi, livraison le lundi : combien de jours de délai ? 3 ; 1 ; 0. Révélation :
  3 jours calendaires, 1 jour ouvré — le contrat parle de jours ouvrés.

#### A2-06 · `B3-01-A2-06-COURS-TEMPS-STATS` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : le temps et les indicateurs »
- `property` : une date est un nombre de jours ; `NB.JOURS.OUVRES(début;fin)` compte les jours
  ouvrés, `SERIE.JOUR.OUVRE(début;n)` donne la date n jours ouvrés plus tard, `JOURSEM`,
  `DATEDIF(début;fin;"m")`, `TEMPS(h;m;s)` ; `method` : un délai long et rare tire la moyenne,
  pas la médiane ; `property` : taux de marge = `SOMME(marge) ÷ SOMME(CA)`, jamais la moyenne des
  taux de ligne ; `SOMMEPROD(quantite;prix−cout)` calcule la marge sans colonne intermédiaire.
- Jours fériés : non comptés dans ce cours (les fonctions acceptent une liste en dernier
  argument ; encadré).

#### A2-07 · `B3-01-A2-07-ATELIER-DELAIS-MARGE` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 6 — Délais et marge »
- Temps : réflexion 1 min · travail 7 min · correction 2 min.
- Défi : `JOURSEM` pour la part des commandes passées le vendredi ; `DATEDIF` pour l'ancienneté
  des clients en mois.
- `b3-01-a2-delai-strasbourg` : délai médian de livraison de Strasbourg en 2026, en jours
  ouvrés ; pièges `jours-calendaires-pour-ouvres`, `valeur-extreme-ignoree`.
- `b3-01-a2-retards` : nombre de lignes 2026 livrées après la promesse (commande + 5 jours
  ouvrés, `SERIE.JOUR.OUVRE`) ; piège `jours-calendaires-pour-ouvres`.
- `b3-01-a2-taux-marge` : taux de marge du réseau, janvier à septembre 2026, en % ; piège
  `moyenne-simple-des-taux`.

#### A2-08 · `B3-01-A2-08-VOTE-NOUVELLES-LIGNES` — 2 min · `fp-vote` · séance

- Titre public : « Vote : 200 lignes de plus »
- On colle 200 lignes d'octobre sous le tableau. Les formules écrites sur `A2:A4001` les
  prennent-elles en compte ? Oui ; non ; seulement après recalcul. Révélation : non — d'où le
  tableau structuré.

#### A2-09 · `B3-01-A2-09-COURS-TCD` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : tableau structuré et tableau croisé dynamique »
- `method` : Ctrl + T (⌘ + T), nom `T_Commandes`, colonnes calculées et références
  `T_Commandes[ca_ht]` ; `property` : un TCD place des champs en lignes, colonnes, valeurs et
  filtres ; `method` : regrouper les dates par mois ou trimestre, afficher en % du total,
  segments ; encadré : relier `T_Commandes` et `Agences` dans le modèle de données (365).

#### A2-10 · `B3-01-A2-10-EXEMPLE-TCD` — 3 min · `fp-worked` · séance

- Titre public : « Exemple guidé : le TCD agence × mois »
- Étapes : insérer le TCD depuis `T_Commandes` ; `agence_id` en lignes, `date_commande` en
  colonnes groupée par mois ; `ca_ht` en valeurs, format monétaire ; filtre `annee` sur 2026.

#### A2-11 · `B3-01-A2-11-ATELIER-TCD` — 14 min · `questionnaire` · séance

- Titre public : « Exercice 7 — Le TCD de la direction »
- Temps : réflexion 1 min · travail 11 min · correction 2 min.
- Essentiel : tableau structuré, TCD région × trimestre, regroupement par trimestre, % du total
  de ligne, segment « catégorie ». Défi : regroupement des remises en tranches de 5 points.
- `b3-01-a2-part-info-rennes` : part de l'informatique dans le CA de Rennes de janvier à
  septembre 2026, en % ; piège `pourcentage-du-mauvais-total`.
- `b3-01-a2-meilleur-trimestre` (vote noté) : le trimestre au CA le plus élevé du réseau, parmi
  les sept trimestres ; piège `plage-fixe-au-lieu-de-tableau`.

#### A2-12 · `B3-01-A2-12-REGLES-ACTE-2` — 4 min · `fp-pro` · séance

- Titre public : « Cahier de règles : niveaux 3 et 4 »
- Deux questions libres : `regle-transformer`, `regle-modeliser`. Règles modèles : « Avant la
  fonction, je nomme la famille du problème » ; « Je travaille sur un tableau structuré, jamais
  sur une plage fixe. »
- Puis pause de 15 minutes.

### 3.4 Acte 3 — Décider (64 min)

#### A3-01 · `B3-01-A3-01-GRAPHIQUE-TROMPEUR` — 1 min · v2 `chart` · catalogue

- Titre public : « Un graphique de la direction »
- Barres du CA 2025 (année pleine) de Rennes et de Nantes, axe des ordonnées commençant juste
  sous la plus petite valeur (`axisRanges`) : Rennes paraît vendre trois fois moins que Nantes.
  Valeurs arrondies au millier d'euros, issues du jeu de données. L'année 2025 est choisie parce
  qu'aucune question ne porte sur le CA 2025 d'une agence : l'écran public ne livre aucune
  réponse.

#### A3-02 · `B3-01-A3-02-VOTE-GRAPHIQUE` — 2 min · `fp-vote` · séance

- Titre public : « Vote : que décidez-vous ? »
- Pièce jointe : `B3-01_reprise_acte_3.xlsx`, ouverte par tous.
- En 2025, Rennes a-t-elle vendu trois fois moins que Nantes ? Oui ; non, l'axe est tronqué ;
  impossible à dire. Révélation : l'axe tronqué grossit l'écart ; on montre le même graphique depuis zéro.

#### A3-03 · `B3-01-A3-03-COURS-GRAPHIQUES` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : un graphique répond à une question »
- `method` : comparer → barres ; évolution → courbe ; composition → barres empilées (peu de
  parts) ; distribution → histogramme ; relation → nuage de points ; KPI → valeur et contexte ;
  `property` : à éviter : 3D, camembert de plus de cinq parts, axe tronqué non signalé, double axe
  trompeur ; `example` hors dossier : un titre qui dit la conclusion (« Caen à 92 % de son
  objectif »), jamais une valeur du jeu de données.

#### A3-04 · `B3-01-A3-04-TRI-GRAPHIQUES` — 4 min · `fp-cardsort` · séance

- Titre public : « Exercice 8 — À chaque question son graphique »
- Temps : réflexion 1 min · travail 2 min · correction 1 min.
- Six questions de la direction, six catégories (barres, courbe, empilé, histogramme, nuage,
  KPI) : quelle agence vend le plus ; comment évolue le CA mois par mois ; de quoi est fait le CA
  de Rennes ; comment se répartissent les délais de livraison ; la remise fait-elle baisser la
  marge ; où en est le CA cumulé face à l'objectif. Pièges `camembert-pour-evolution`,
  `graphique-sans-question`.

#### A3-05 · `B3-01-A3-05-ATELIER-GRAPHIQUES` — 8 min · `questionnaire` · séance

- Titre public : « Exercice 9 — CA et objectif par agence »
- Temps : réflexion 1 min · travail 6 min · correction 1 min.
- Essentiel : tableau de synthèse par agence (CA cumulé par `SOMME.SI.ENS` sur `T_Commandes`,
  objectif cumulé par `SOMME.SI.ENS` sur `Objectifs`, taux d'atteinte), puis graphique en barres
  groupées CA et objectif, titre qui conclut, légende, axe depuis zéro. Un TCD seul ne suffit
  pas : l'objectif vit dans une autre table (encadré 365 : le modèle de données les relie).
  Défi : courbe du CA mensuel 2025 et 2026 superposées.
- `b3-01-a3-agences-sous-objectif` : nombre d'agences dont le CA cumulé est sous l'objectif
  cumulé ; piège `objectif-annuel-pour-cumul`.
- `b3-01-a3-atteinte-rennes` : taux d'atteinte de Rennes, en % ; piège
  `objectif-annuel-pour-cumul`.

#### A3-06 · `B3-01-A3-06-VOTE-TRENTE-SECONDES` — 3 min · `fp-vote` · séance

- Titre public : « Vote : trente secondes »
- Nadia a trente secondes avant le comité. Que voit-elle d'abord : le tableau de toutes les
  lignes ; quatre chiffres avec leur comparaison ; dix graphiques ? Révélation : quatre chiffres
  en contexte, puis le détail sur demande.

#### A3-07 · `B3-01-A3-07-COURS-DASHBOARD` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : l'anatomie d'un tableau de bord »
- `definition` : un tableau de bord répond à une question de décision ; `property` : 4 KPI,
  chacun avec un contexte (objectif, N − 1), 2 graphiques, des segments connectés à tous les TCD,
  les anomalies en MFC ; `method` : une recommandation = constat chiffré → cause → action ;
  `example` hors dossier : « Caen : délai médian de 8 jours ouvrés contre 3 dans le réseau ;
  changement de transporteur en mars ; renégocier le contrat ou revenir à l'ancien » ; aucune
  valeur du jeu de données, pour ne rien dévoiler des ateliers A3-09 et A3-10.

#### A3-08 · `B3-01-A3-08-EXEMPLE-MFC-SEGMENTS` — 3 min · `fp-worked` · séance

- Titre public : « Exemple guidé : MFC et segments connectés »
- Étapes : MFC par formule `=$E5<0,95` en rouge sur le taux d'atteinte ; barres de données sur
  le CA ; segment « région » relié à deux TCD (« Connexions de rapport »).

#### A3-09 · `B3-01-A3-09-ATELIER-DASHBOARD` — 15 min · `questionnaire` · séance

- Titre public : « Exercice 10 — Le tableau de bord Direction »
- Temps : réflexion 1 min · travail 12 min · correction 2 min.
- Essentiel : onglet `Dashboard` avec 4 KPI (CA cumulé 2026, évolution par rapport à 2025, taux
  de marge, lignes en quarantaine), le graphique de A3-05, un TCD marge par agence en MFC, deux
  segments connectés (région, catégorie). Défi : mise en page A4 paysage pour impression.
- `b3-01-a3-ca-2026` : CA HT cumulé de janvier à septembre 2026 ; piège
  `texte-pris-pour-nombre`.
- `b3-01-a3-evolution` : évolution du CA par rapport à janvier-septembre 2025, en % ; piège
  `evolution-sur-annee-pleine`.
- `b3-01-a3-marge-marseille` : taux de marge de Marseille de janvier à septembre 2026, en % ;
  piège `moyenne-simple-des-taux`.
- `b3-01-a3-quarantaine` : nombre de lignes en quarantaine ; piège
  `suppression-au-lieu-de-signalement`.

#### A3-10 · `B3-01-A3-10-RECOMMANDATIONS` — 9 min · `fp-pro` · séance

- Titre public : « Vos trois recommandations au comité »
- Trois questions libres (`recommandation-1` à `recommandation-3`) : constat chiffré → cause →
  action. Correction sur place, quatre explications révélées une à une : les quatre histoires du
  § 4.4. Garde de dévoilement : aucune explication ne donne une valeur d'une question encore
  ouverte (les questions de A3-09 sont révélées avant).

#### A3-11 · `B3-01-A3-11-FICHE-MEMO` — 3 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : de la donnée brute à la décision »
- Six cases, une par niveau : la question à se poser, les fonctions ou outils, le piège principal.

#### A3-12 · `B3-01-A3-12-CAHIER-DE-REGLES` — 5 min · `fp-pro` · séance

- Titre public : « Cahier de règles : niveaux 5 et 6, puis relecture »
- Trois questions libres : `regle-visualiser`, `regle-decider`, `regle-la-plus-utile` (« laquelle
  de vos six règles confieriez-vous en premier à un agent, et pourquoi ? »). Annonce de la
  séance 2 : l'agent Data Analyst.

#### A3-13 · `B3-01-A3-13-BILLET-DE-SORTIE` — 5 min · `fp-exit` · séance

- Titre public : « Billet de sortie »
- Une question notée : la ligne « date_livraison antérieure à date_commande » se corrige-t-elle
  automatiquement ? (non : faux · humain). Une question libre : ce qui reste flou.

## 4. Le jeu de données

### 4.1 L'entreprise

Norvane Équipement (nom et personnes fictifs) distribue de l'équipement professionnel en quatre
catégories : mobilier (12 produits), informatique (12), fournitures (10), maintenance (6
services). Réseau de 12 agences en 6 régions, 3 commerciaux par agence :

| Région        | Agences (`agence_id`)                |
| ------------- | ------------------------------------ |
| Nord          | Lille (AG01), Rouen (AG02)           |
| Île-de-France | Paris-Est (AG03), Paris-Ouest (AG04) |
| Ouest         | Nantes (AG05), Rennes (AG06)         |
| Sud-Ouest     | Bordeaux (AG07), Toulouse (AG08)     |
| Méditerranée  | Marseille (AG09), Montpellier (AG10) |
| Est           | Lyon (AG11), Strasbourg (AG12)       |

### 4.2 Les onglets du classeur brut

| Onglet      |  Lignes | Colonnes                                                                                                                                                                         |
| ----------- | ------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Commandes` | ≈ 4 000 | `n_commande`, `date_commande`, `date_livraison`, `client_id`, `ville`, `agence_id`, `commercial_id`, `produit_id`, `quantite`, `prix_unitaire_ht`, `remise`, `ca_ht`, `facturee` |
| `Clients`   |     600 | `client_id`, `raison_sociale`, `ville`, `secteur`, `date_premiere_commande`                                                                                                      |
| `Produits`  |      40 | `produit_id`, `libelle`, `categorie`, `prix_catalogue_ht`, `cout_unitaire`                                                                                                       |
| `Agences`   |      12 | `agence_id`, `ville`, `region`, `responsable`                                                                                                                                    |
| `Objectifs` |     252 | `agence_id`, `mois`, `objectif_ca_ht` (12 agences × 21 mois, janvier 2025 à septembre 2026)                                                                                      |

Période des commandes : du 2 janvier 2025 au 30 septembre 2026, jours ouvrés seulement. Une
ligne est un produit dans une commande ; une commande compte de 1 à 5 lignes. La commande
C-10234 compte exactement 3 lignes. `ca_ht` vaut `quantite × prix_unitaire_ht × (1 − remise)`,
arrondi au centime, sauf sur les lignes de l'anomalie F4.

### 4.3 Les anomalies semées

Les comptes sont des paramètres du générateur ; ils s'appliquent à des lignes distinctes, et
aucune ligne doublonnée (F3) ne porte une autre anomalie.

| Code | Anomalie                                                                                  | Case de la grille  |   Lignes |
| ---- | ----------------------------------------------------------------------------------------- | ------------------ | -------: |
| F1   | `ville` en majuscules, en minuscules ou entourée d'espaces                                | faux · automatique |      310 |
| F2   | `ca_ht` stocké en texte (« 1 250,00 € », espaces ordinaires)                              | faux · automatique |      180 |
| F3   | ligne exportée deux fois à l'identique                                                    | faux · automatique |       46 |
| F4   | `ca_ht` = quantité × prix, remise oubliée, écart de plus d'1 €                            | faux · automatique |       24 |
| F5   | `date_commande` en texte au format ISO « 2026-03-15 »                                     | faux · automatique |       40 |
| H1   | `produit_id` absent de `Produits` (P047, P051)                                            | faux · humain      |        9 |
| H2   | `date_livraison` antérieure à `date_commande`                                             | faux · humain      |       14 |
| H3   | `commercial_id` vide                                                                      | faux · humain      |       11 |
| S1   | `date_commande` en texte « 04/05/26 », écrite en mm/jj/aa, que `DATEVAL` lit en jj/mm/aa  | suspect · humain   |       12 |
| S2   | `quantite` négative                                                                       | suspect · humain   |        8 |
| S3   | `prix_unitaire_ht` d'une fourniture égal à dix fois le prix catalogue                     | suspect · humain   |        6 |
| S4   | client en double probable dans `Clients` (même raison sociale et ville, deux `client_id`) | suspect · humain   | 4 paires |

Total des lignes de `Commandes` touchées : 660, soit environ 16 % des lignes uniques, d'où la
révélation de la première question du vote A1-04 (« environ 15 % »). La colonne `controle` de A1-14, appliquée aux dates
brutes, attrape H2, H3, S2 et les dates restées en texte F5 et S1 : 14 + 11 + 8 + 40 + 12 = 85
lignes. F4, H1 et S3 relèvent du défi et de la quarantaine du classeur de reprise.

### 4.4 Les quatre histoires cachées

| Histoire                 | Paramètre semé                                                                                                                                                                                      | Ce que le tableau de bord montre                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Marseille, la marge fond | à partir de janvier 2026, le commercial C26 prend 45 % des lignes de l'agence et accorde des remises de 18 à 30 % (réseau : 0 à 10 %)                                                               | CA au-dessus de l'objectif, taux de marge en chute                                         |
| Rennes, sous l'objectif  | l'informatique de Rennes baisse de 40 % en 2026 par rapport à 2025, les autres catégories sont stables                                                                                              | taux d'atteinte le plus bas du réseau                                                      |
| Lille, la croissance     | CA de Lille de janvier à septembre 2026 supérieur de 25 % à celui de 2025                                                                                                                           | plus forte évolution du réseau                                                             |
| Strasbourg, les retards  | à partir de mars 2026, délai de livraison de Strasbourg tiré entre 6 et 12 jours ouvrés (réseau : 1 à 5), et 8 % de ses lignes de mars à juillet en rupture, livrées 40 à 60 jours ouvrés plus tard | délai médian et nombre de retards hors norme ; moyenne tirée vers le haut par les ruptures |

Aucune livraison n'est postérieure au 9 octobre 2026, date de l'export : une rupture de fin de
période est plafonnée à cette date. Les objectifs suivent la règle d'un contrôleur de gestion :
l'objectif d'un mois de 2025 est le CA réalisé du mois à ± 6 % près, celui d'un mois de 2026 le
CA réalisé du même mois de 2025 majoré de 5 %, arrondis à la centaine. Le taux d'atteinte 2026
d'une agence vaut donc environ son évolution sur un an, divisée par 1,05.

### 4.5 Les classeurs de reprise

- **Reprise 1** (`B3-01_reprise_acte_2.xlsx`) : `Commandes` sans F1 à F5 (corrigées), sans les
  doublons F3, sans les lignes H1, H2, H3, S1, S2 et S3, déplacées dans `Quarantaine` avec une
  colonne `motif` ; référentiels inchangés, `Clients` avec une colonne `doublon_probable` qui
  porte, pour chaque client d'une paire S4, le `client_id` de son jumeau (vide sinon).
- **Reprise 2** (`B3-01_reprise_acte_3.xlsx`) : reprise 1, plus le tableau structuré
  `T_Commandes` et ses colonnes `annee`, `region`, `categorie`, `cout`, `marge`,
  `delai_ouvre`, `date_promise`, `en_retard`, écrites en formules avec leur valeur. Pas de TCD :
  `exceljs` ne sait pas en créer, et les étudiants construisent ceux du tableau de bord à
  l'atelier A3-09.

Les questions des actes 2 et 3 portent sur les lignes saines de la reprise 1 (hors quarantaine) ;
celles de l'acte 1 portent sur le classeur brut.

### 4.6 Génération

Un générateur déterministe à graine fixe (générateur pseudo-aléatoire maison, sans dépendance)
produit les lignes à partir des paramètres des § 4.1 à 4.5. Il vit sous `test/` : la production
ne l'exécute jamais, le contenu servi porte les valeurs attendues en constantes. Les mêmes
fonctions servent :

- à l'écriture des trois classeurs (dépendance de développement `exceljs`), déclenchée par
  `ECRIRE_CLASSEURS=1` comme l'instantané, et d'un manifeste `classeurs.manifest.json` portant,
  pour chaque classeur, son nom publié et l'empreinte SHA-256 du fichier, et pour chaque onglet,
  le nombre de lignes et l'empreinte SHA-256 de sa sérialisation canonique ;
- au spec de recalcul, qui régénère les lignes et recalcule chaque valeur attendue des questions ;
- au spec des classeurs, qui relit les classeurs versionnés avec `exceljs` et compare chaque
  onglet relu au générateur, puis chaque fichier au manifeste.

Un binaire `xlsx` n'est pas reproductible octet pour octet (horodatages de l'archive) : c'est le
contenu relu qui se compare au générateur, et le fichier au manifeste.

Les lignes ne sont pas versionnées en source (limite des 2 000 insertions par commit) : seuls la
graine, les paramètres et les classeurs binaires le sont. Un classeur corrigé formateur porte les
formules des ateliers (`SOMME.SI.ENS`, `NB.JOURS.OUVRES`, `MEDIANE`, `SOMMEPROD`…) ; `exceljs`
n'écrit ni TCD, ni graphique, ni segment. Il est écrit dans `.tmp/b3-01/`, ignoré par git, ni
versionné ni servi, et sert à vérifier que les formules enseignées rendent les valeurs du § 5.1.

## 5. Contenus

### 5.1 Les valeurs attendues

Chaque valeur est calculée par le générateur à la première génération, recopiée dans le contenu
et dans le tableau ci-dessous, puis recalculée par `b3-01.donnees.spec.ts` à partir de la seule
graine (20 261 013). Toute régénération qui change une valeur doit la mettre à jour aux trois
endroits. Les valeurs vivent dans `b3-01.donnees.ts` ; le générateur, ses paramètres et le
recalcul à la sémantique d'Excel vivent sous `test/helpers/cours-b3-01/`.

| Question                         | Définition exacte                                                                                          |    Valeur |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------: |
| `b3-01-a1-lignes-commande`       | lignes du brut où `n_commande` = C-10234                                                                   |         3 |
| `b3-01-a1-lignes-uniques`        | lignes du brut (4 144) moins les 46 doublons F3                                                            |     4 098 |
| `b3-01-a1-ca-total`              | somme de `ca_ht` converti, lignes uniques, F4 non recalculées, arrondie à l'euro                           | 1 340 208 |
| `b3-01-a1-villes`                | valeurs distinctes de `NOMPROPRE(SUPPRESPACE(ville))` sur les lignes uniques                               |        48 |
| `b3-01-a1-a-verifier`            | lignes uniques signalées par la colonne `controle` sur les dates brutes (§ 4.3)                            |        85 |
| `b3-01-a2-ca-rennes-info`        | reprise 1, AG06, catégorie Informatique, `date_commande` de janvier à septembre 2026                       |     8 342 |
| `b3-01-a2-remises-marseille`     | reprise 1, AG09, `remise` > 0,15, toutes dates                                                             |        66 |
| `b3-01-a2-ca-ouest`              | reprise 1, région Ouest, janvier à septembre 2026                                                          |    77 850 |
| `b3-01-a2-delai-strasbourg`      | médiane de `NB.JOURS.OUVRES(date_commande;date_livraison) − 1`, AG12, 2026                                 |         8 |
| `b3-01-a2-retards`               | lignes 2026 où `date_livraison` > `SERIE.JOUR.OUVRE(date_commande;5)`                                      |        99 |
| `b3-01-a2-taux-marge`            | `SOMMEPROD(quantite;prix_unitaire_ht×(1−remise)−cout_unitaire) ÷ SOMME(ca_ht)`, 2026, en %                 |      32,0 |
| `b3-01-a2-part-info-rennes`      | CA Informatique de AG06 ÷ CA de AG06, janvier à septembre 2026, en %                                       |      27,2 |
| `b3-01-a2-meilleur-trimestre`    | trimestre civil au plus fort CA du réseau, T1 2025 à T3 2026                                               |   T4 2025 |
| `b3-01-a3-agences-sous-objectif` | agences dont le CA de janvier à septembre 2026 est sous la somme de leurs objectifs mensuels de la période |         3 |
| `b3-01-a3-atteinte-rennes`       | CA ÷ objectif cumulé de AG06, janvier à septembre 2026, en %                                               |      79,0 |
| `b3-01-a3-ca-2026`               | CA du réseau, janvier à septembre 2026                                                                     |   575 046 |
| `b3-01-a3-evolution`             | CA janvier-septembre 2026 ÷ CA janvier-septembre 2025 − 1, en %                                            |       8,6 |
| `b3-01-a3-marge-marseille`       | taux de marge de AG09, janvier à septembre 2026, en %                                                      |      26,9 |
| `b3-01-a3-quarantaine`           | lignes de l'onglet `Quarantaine` de la reprise 1 : H1 + H2 + H3 + S1 + S2 + S3                             |        60 |

Les valeurs-pièges sont recalculées de la même façon, en reproduisant l'erreur de la confusion :

| Question                         | Confusion                            | Erreur reproduite                                          |     Piège |
| -------------------------------- | ------------------------------------ | ---------------------------------------------------------- | --------: |
| `b3-01-a1-lignes-uniques`        | `doublons-supprimes-sur-une-colonne` | doublons supprimés sur `n_commande` seule                  |     1 618 |
| `b3-01-a1-ca-total`              | `texte-pris-pour-nombre`             | `SOMME` qui ignore les montants restés en texte            | 1 286 319 |
| `b3-01-a1-villes`                | `casse-non-normalisee`               | villes distinctes sans `NOMPROPRE` ni `SUPPRESPACE`        |        83 |
| `b3-01-a1-a-verifier`            | `suspect-corrige-sans-validation`    | dates F5 et S1 converties par `DATEVAL` avant le contrôle  |        39 |
| `b3-01-a2-delai-strasbourg`      | `jours-calendaires-pour-ouvres`      | médiane de `date_livraison − date_commande`                |        11 |
| `b3-01-a2-delai-strasbourg`      | `valeur-extreme-ignoree`             | moyenne au lieu de la médiane, au dixième                  |       9,5 |
| `b3-01-a2-retards`               | `jours-calendaires-pour-ouvres`      | livraison après `date_commande + 5`                        |       481 |
| `b3-01-a2-taux-marge`            | `moyenne-simple-des-taux`            | moyenne des taux de marge des lignes                       |      35,4 |
| `b3-01-a2-part-info-rennes`      | `pourcentage-du-mauvais-total`       | CA Informatique de AG06 ÷ CA du réseau                     |       1,5 |
| `b3-01-a3-agences-sous-objectif` | `objectif-annuel-pour-cumul`         | CA 2026 comparé à tous les objectifs de l'agence (21 mois) |        12 |
| `b3-01-a3-atteinte-rennes`       | `objectif-annuel-pour-cumul`         | CA 2026 de AG06 ÷ tous ses objectifs (21 mois)             |      33,8 |
| `b3-01-a3-evolution`             | `evolution-sur-annee-pleine`         | CA janvier-septembre 2026 ÷ CA de toute l'année 2025 − 1   |     −22,1 |
| `b3-01-a3-marge-marseille`       | `moyenne-simple-des-taux`            | moyenne des taux de marge des lignes de AG09               |      28,7 |

Le spec vérifie aussi les quatre histoires (§ 4.4) sur le jeu généré : Rennes au taux d'atteinte
le plus bas (79 %), Lille à la plus forte évolution (+23,1 %), Marseille à la plus forte baisse
de marge (32,3 % en 2025, 26,9 % en 2026) avec un objectif atteint, Strasbourg au délai médian
2026 le plus long (8 jours ouvrés contre 2 en 2025), et un meilleur trimestre devant le suivant
de plus de 2 %.

Convention du délai : `NB.JOURS.OUVRES` compte les deux bornes ; le délai d'une commande livrée
le jour ouvré suivant vaut 1, d'où le `− 1`. La trace écrite A2-06 et l'exemple de A2-05
l'énoncent.

### 5.2 Concepts, confusions et remédiations

**Concepts** (tous nouveaux, banque B3) : `reference-de-cellule`, `jeu-de-donnees`,
`cle-et-relation`, `granularite`, `qualite-des-donnees`, `nettoyage`, `recherche-dans-une-table`,
`agregation-conditionnelle`, `calcul-sur-dates`, `indicateur-statistique`,
`tableau-croise-dynamique`, `choix-du-graphique`, `tableau-de-bord`.

**Confusions** : dix-neuf nouvelles et deux reprises de la banque B2, qui décrivent déjà la même
erreur (`valeur-extreme-ignoree`, `moyenne-simple-des-taux`). `reference-absolue-ignoree` reste
distincte de `reference-relative-non-figee` : l'une lit mal le `$` d'une formule recopiée,
l'autre oublie de l'écrire. `critere-mal-ecrit` ne couvre que l'opérateur joint par `&` et le
pourcentage ; le critère sans guillemets est `critere-sans-guillemets`.

| Identifiant                          | Concept                   | Libellé                                                              | Remédiation                        |
| ------------------------------------ | ------------------------- | -------------------------------------------------------------------- | ---------------------------------- |
| `reference-absolue-ignoree`          | reference-de-cellule      | Recopier une formule sans voir ce que le `$` fige.                   | B3-01-A2-03-COURS-CHERCHER-AGREGER |
| `identifiant-pris-pour-nombre`       | jeu-de-donnees            | Prendre un identifiant numérique pour une quantité.                  | B3-01-A1-05-COURS-DONNEE           |
| `lignes-comptees-pour-commandes`     | granularite               | Compter les lignes quand on cherche les commandes.                   | B3-01-A1-05-COURS-DONNEE           |
| `libelle-pris-pour-cle`              | cle-et-relation           | Relier deux tables par un nom ou une ville.                          | B3-01-A1-06-COURS-RELATIONS        |
| `suspect-corrige-sans-validation`    | qualite-des-donnees       | Corriger seul une donnée douteuse.                                   | B3-01-A1-10-COURS-GRILLE           |
| `suppression-au-lieu-de-signalement` | qualite-des-donnees       | Supprimer une ligne au lieu de la signaler.                          | B3-01-A1-10-COURS-GRILLE           |
| `texte-pris-pour-nombre`             | nettoyage                 | Additionner une colonne dont des nombres sont du texte.              | B3-01-A1-11-COURS-OUTILS           |
| `casse-non-normalisee`               | nettoyage                 | Compter « Bordeaux » et « BORDEAUX » comme deux villes.              | B3-01-A1-11-COURS-OUTILS           |
| `doublons-supprimes-sur-une-colonne` | nettoyage                 | Dédoublonner sur une seule colonne et perdre des lignes distinctes.  | B3-01-A1-11-COURS-OUTILS           |
| `plage-recherche-non-figee`          | recherche-dans-une-table  | Recopier une recherche sans figer la table.                          | B3-01-A2-03-COURS-CHERCHER-AGREGER |
| `critere-mal-ecrit`                  | agregation-conditionnelle | Écrire un critère sans joindre l'opérateur par `&`, ou 15 pour 15 %. | B3-01-A2-03-COURS-CHERCHER-AGREGER |
| `jours-calendaires-pour-ouvres`      | calcul-sur-dates          | Soustraire deux dates quand le contrat compte des jours ouvrés.      | B3-01-A2-06-COURS-TEMPS-STATS      |
| `valeur-extreme-ignoree` (B2-02)     | choix-du-resume           | Résumer par la moyenne une série tirée par une valeur extrême.       | B3-01-A2-06-COURS-TEMPS-STATS      |
| `moyenne-simple-des-taux` (B2-01)    | moyenne-ponderee          | Faire la moyenne simple de taux au lieu de les pondérer.             | B3-01-A2-06-COURS-TEMPS-STATS      |
| `plage-fixe-au-lieu-de-tableau`      | tableau-croise-dynamique  | Construire sur une plage fixe qui ne voit pas les nouvelles lignes.  | B3-01-A2-09-COURS-TCD              |
| `pourcentage-du-mauvais-total`       | tableau-croise-dynamique  | Afficher le % du total général au lieu du % de la ligne.             | B3-01-A2-09-COURS-TCD              |
| `graphique-sans-question`            | choix-du-graphique        | Choisir un graphique avant la question à laquelle il répond.         | B3-01-A3-03-COURS-GRAPHIQUES       |
| `camembert-pour-evolution`           | choix-du-graphique        | Montrer une évolution par un camembert.                              | B3-01-A3-03-COURS-GRAPHIQUES       |
| `objectif-annuel-pour-cumul`         | tableau-de-bord           | Comparer un cumul à neuf mois à l'objectif de l'année.               | B3-01-A3-07-COURS-DASHBOARD        |
| `evolution-sur-annee-pleine`         | tableau-de-bord           | Comparer neuf mois de 2026 à douze mois de 2025.                     | B3-01-A3-07-COURS-DASHBOARD        |
| `kpi-sans-contexte`                  | tableau-de-bord           | Afficher un chiffre sans objectif ni comparaison.                    | B3-01-A3-07-COURS-DASHBOARD        |

## 6. Fonctionnalités à construire

### 6.1 Gabarit `b3`

`GABARITS` passe de `['v3']` à `['v3', 'b3']`. Le gabarit `b3` applique `controlerBudget`
(40 écrans, 180 minutes), `controlerCycle` et `controlerTempsDesExercices`, mais pas
`controlerMiniSituation`. La colonne `gabarit` est un `varchar(20)` : aucune migration. Tests
rouges d'abord dans le spec de la structure : un cours `b3` sans `fp-escape` se publie, un cours
`b3` de 41 écrans ne se publie pas, un cours `v3` sans `fp-escape` reste refusé.

### 6.2 Pièce jointe d'écran

Propriété commune facultative `pieceJointe` : `libelle` et `fichier`, chemin public absolu comme
les images des B2 (`/assets/cours/b2-02/v2/…`). Le schéma stocké l'impose de la forme
`^/assets/cours/[a-z0-9-]+/[A-Za-z0-9_-]+(\.[0-9a-f]{8})?\.(xlsx|csv|pdf)$` : ni `..`, ni
sous-dossier, ni autre extension. Elle est servie au poste, au pupitre et à la projection.
Rendus :

- **poste étudiant** : bouton « Télécharger le classeur » ;
- **pupitre** : lien, pour vérifier le fichier ;
- **projection** : mention « Le classeur est sur votre poste », sans lien.

Diffusion : la pièce jointe suit la diffusion de l'écran. Les deux classeurs de reprise sont
portés par des écrans de séance ; comme tout fichier sous `assets/`, ils restent lisibles par qui
connaît leur adresse. Leur nom porte donc les 8 premiers caractères hexadécimaux de leur empreinte
(`B3-01_reprise_acte_2.3f9a1c0e.xlsx`), pour qu'on ne les devine pas depuis le nom du classeur
brut. Le risque résiduel est accepté : les scores sont formatifs. Les trois rendus sont vérifiés
côte à côte : un écran de cours est le même en projection, au pupitre et au poste.

### 6.3 Générateur et classeurs

Côté back : `b3-01.donnees.ts` (paramètres, noms des classeurs, valeurs attendues en constantes)
dans les contenus ; générateur et écriture des classeurs sous `test/helpers/cours-b3-01/` ;
classeurs et manifeste versionnés sous `test/fixtures/formations/b3-01/`. Côté front : copie des
classeurs et du manifeste dans `src/assets/cours/b3-01/`, et un test `node --test` de
`test:guards` qui vérifie l'empreinte de chaque fichier copié contre le manifeste. Le manifeste
relie ainsi les deux copies.

Le corrigé formateur est recalculé par Microsoft Excel pour Mac, piloté par AppleScript
(ouverture, calcul, enregistrement en CSV), et chaque cellule de résultat est comparée au § 5.1. Les classeurs sont ensuite ouverts dans Excel
(365 ou web, et une version 2019 ou 2021 si possible) avant la séance : ouverture sans
réparation, tableau structuré reconnu, formules du corrigé identiques aux valeurs attendues.

### 6.4 Front

Catalogue (carte « Bachelor 3 · Outils informatiques du manager »), route
`formations/b3-01-donnee-brute-decision`, entrée SEO, XLF fr et en, montage et instantané. La
liste `COURS_BTS` devient `COURS_EN_SEANCE` (renommage par l'outil `rename` de GitNexus) : elle
porte désormais un cours qui n'est pas de BTS.

## 7. Livraison

| Jour           | Étape                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| Jeudi 8/10     | Conception relue, task list                                                       |
| Vendredi 9/10  | Gabarit `b3`, pièce jointe (back et front, TDD), générateur et classeurs          |
| Samedi 10/10   | Contenu, spec de recalcul, instantané, e2e de séance complète sur le cours publié |
| Dimanche 11/10 | Front, banc local, PR front puis back, breaker jusqu'à zéro défaut                |
| Lundi 12/10    | Déploiement, QA prod (pupitre, projection, poste), test des classeurs dans Excel  |

## 8. Médias

### 8.1 Principe

Aucune image : le graphique trompeur et les exemples de graphiques sont rendus par v2 `chart`
(`kind: 'bars'` ou `'line'`, `axisRanges` pour l'axe tronqué), la carte et la fiche mémo par
v2 `grid`, les familles par v2 `table`.

### 8.2 Catalogue des médias

| Fichier                                 | Rôle                               | Écran | Diffusion |
| --------------------------------------- | ---------------------------------- | ----- | --------- |
| `B3-01_export_ventes.xlsx`              | export brut                        | A1-02 | catalogue |
| `B3-01_reprise_acte_2.<empreinte>.xlsx` | reprise du début de l'acte 2       | A2-01 | seance    |
| `B3-01_reprise_acte_3.<empreinte>.xlsx` | reprise du début de l'acte 3       | A3-02 | seance    |
| `classeurs.manifest.json`               | empreintes des fichiers et onglets | —     | —         |

### 8.3 Sources

- Norvane Équipement, ses agences, commerciaux, clients, produits, commandes et objectifs :
  données fictives générées pour ce cours.
- Programme « Outils informatiques du manager » B3 2026-27 et cahier des charges de l'évaluation
  2026-27 (documents de l'école, non versionnés).
