# B2-03 · Logique : écrire et contrôler une règle — conception de référence (gabarit v3)

> Cahier des charges du cours B2-03 au gabarit v3 (`docs/cours-gabarit-v3.md`) : une séance de
> 140 minutes de travail et deux pauses de 15 minutes, trois notions traitées chacune par un cycle
> réfléchir → comprendre → s'exercer, puis une mini-situation CCF. Ce document ne contient aucun code
> exécutable ; toute divergence d'implémentation est un défaut de l'implémentation. Les tests
> `b2-03.cours.spec.ts` relisent ce document : § 3.1, titres publics du § 3, § 5.9, § 8.2.

| Rubrique    | Valeur                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| Date        | 29 septembre 2026, révisée le 15 octobre 2026                                                                       |
| Statut      | **Référence pédagogique** : troisième cours du plan v3 (`docs/cours-bts-cg2-plan-v3.md`), deuxième au gabarit v3    |
| Cours       | `b2-03-logique`                                                                                                     |
| Gabarit     | `v3`, déclaré par le contenu et contrôlé par les quatre règles `gabarit-*` de `verifierStructure`                   |
| Titre servi | « Logique : écrire et contrôler une règle »                                                                         |
| Durée       | **140 minutes exactes** (somme des écrans), 4 actes de 36, 33, 23 et 48 minutes, plus 2 pauses de 15 min hors durée |
| Écrans      | **32**, dont 16 écrans catalogue                                                                                    |
| Sources     | `docs/donnees-b2-03-sources.md` (espace de travail) : Code de commerce, CGI, factures Atelier Rivage fictives       |

---

## 0. Synthèse des décisions

- **Une question de gestion : contrôler les comptes clients avant la clôture.** Marc Lefèvre,
  expert-comptable d'Atelier Rivage, fait appliquer trois règles aux seize factures du trimestre :
  relance (impayée **et** délai de plus de 60 jours), TVA (client de l'Union européenne hors de
  France **et** numéro de TVA absent : anomalie), visa (montant HT d'au moins 5 000 € **ou** client
  hors de France). Chaque règle est une proposition composée ; les contrôler, c'est de la logique.
- **Trois notions** : connecteurs et implication (N1), négation et lois de Morgan (N2), prédicats et
  quantificateurs (N3). Les bornes (« dépasse » : >, « au moins » : ≥) traversent les trois notions :
  F213, impayée depuis 60 jours pile, et F209, payée à 61 jours, sont les deux lignes qui les testent.
- **Le tableur comme traduction de la règle** : `SI`, `ET`, `OU`, `NON`, `NB.SI`, textes et critères
  entre guillemets. La mini-situation ajoute une clause `WHERE` SQL, même logique écrite `AND`.
- **Fil rouge « Atelier Rivage » conservé** : après la banque (B2-02), l'expert-comptable. Le délai
  de 60 jours et l'indemnité de 40 € suivent le Code de commerce ; la procédure de visa est interne et
  fictive, annoncée comme telle.
- **Une seule table de données** pour tout le cours (seize factures), rendue deux fois : en ouverture
  pour la lecture, en mini-situation avec les lettres de colonnes de la feuille.
- **Révision du 15 octobre 2026** (retours de Tim) : une illustration d'une minute avant chaque page
  de trace écrite, pages ramenées à 2 minutes et à leurs blocs essentiels ; plus de diagnostic
  d'ouverture, d'exemple guidé, de formule du visa à l'acte 1 ni de défi IA ; l'ordre des
  quantificateurs, le comptage de « A ou B » et le compte des visas au tableur quittent le cours.

## 1. Objectifs d'apprentissage et public

### 1.1 Rattachement au programme officiel

Module « Calcul propositionnel et calcul des prédicats » du BTS CG : proposition, valeur de vérité,
connecteurs (négation, conjonction, disjonction, implication, équivalence), table de vérité, lois de
Morgan, prédicats, quantificateurs universel et existentiel et leur négation. Capacités : traduire une
règle de gestion en proposition, la mettre en œuvre dans un tableur ou une requête, nier une
proposition quantifiée (`docs/programme-bts-cg-maths-officiel.md`).

### 1.2 Objectifs du cours

À la fin de la séance, l'étudiant sait :

1. traduire une règle de gestion avec non, et, ou, si… alors, en plaçant la bonne borne ;
2. remplir une table de vérité et trouver le contre-exemple d'une implication ;
3. nier une comparaison et une règle à deux conditions (lois de Morgan) ;
4. nier une phrase avec « tous » ou « il existe » ;
5. écrire la règle au tableur (`SI`, `ET`, `OU`, `NON`, `NB.SI`) et lire une clause `WHERE`.

### 1.3 Public et conditions

BTS CG 2e année, 25 étudiants au plus, calculatrice autorisée, un poste par étudiant ou le livret
papier. Séance de 140 minutes de travail, pause de 15 minutes après l'acte 1 et après l'acte 3.

## 2. Architecture

### 2.1 Les quatre actes

| Acte | Rôle                                    | Notion | Minutes |
| ---- | --------------------------------------- | ------ | ------: |
| 1    | Ouverture, puis combiner des conditions | N1     |      36 |
| 2    | Nier une règle                          | N2     |      33 |
| 3    | Tous, au moins un                       | N3     |      23 |
| 4    | Mini-situation CCF et clôture           | —      |      48 |

Pause 1 (15 min) après le jalon A1-12 ; pause 2 (15 min) après le jalon A3-07. Les pauses ne sont
pas des écrans : le formateur les annonce, la durée programmée n'en tient pas compte.

### 2.2 Le cycle d'une notion

Chaque notion suit : **Réfléchir** (vote non noté ou réflexion écrite) → **Comprendre** (trace écrite
en deux pages v2 `lesson` de 2 minutes, chacune précédée d'un écran v2 `illustration` d'une minute qui
montre son exemple pour débuter) → **S'exercer** (exercices notés, corrigés sur place). Chaque page de
trace écrite porte une définition en langage courant (une méthode pour la page du tableur) et un
exemple pour débuter hors du fichier (remise d'une boutique, prime d'ancienneté, équipe de vente) ;
la page des prédicats garde en plus sa méthode pour nier une phrase quantifiée.

Chaque exercice annonce ses temps dans les notes formateur, sous la forme
`• Temps : réflexion N min · travail N min · correction N min`, dont la somme est la durée de
l'écran. La correction se dévoile sur l'écran de l'exercice (`correctionSurPlace`).

### 2.3 Règles de structure

Le cours passe les règles communes et les quatre règles du gabarit v3 : 32 écrans ≤ 40,
140 minutes ≤ 180, chaque trace écrite précédée d'une réflexion et suivie d'un exercice, chaque
exercice avec ses trois temps et sa correction sur place, mini-situation (`fp-escape`) sans trace
écrite après elle. Exposition continue de 6 minutes au plus : deux illustrations et deux pages.

### 2.4 Diffusion

Catalogue : l'accroche, les deux tableaux des factures, les six illustrations, les six pages de trace
écrite et la fiche mémo. Tout le reste est servi en séance.

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B2-03-A{acte}-{rang}-{SLUG}`, conformes à `^B2-03-A[1-6]-\d{2}-[A-Z0-9-]+$`.
Colonne « Brique · rendu » : valeur de la colonne `brique` ; les écrans « v2 » sont stockés en
`fp-story` avec une présentation v2. « I » = interactif. « Q » = questions fermées notées (vote,
numérique, classement) portées par l'écran.

| Rang | Identifiant                              | Min | Brique · rendu                 |  I  |   Q | Diffusion |
| ---: | ---------------------------------------- | --: | ------------------------------ | :-: | --: | --------- |
|    1 | B2-03-A1-02-ACCROCHE                     |   1 | `fp-story` · v2 `hero`         |     |   0 | catalogue |
|    2 | B2-03-A1-03-MISSION                      |   5 | `fp-pro`                       |  I  |   0 | seance    |
|    3 | B2-03-A1-04-FACTURES                     |   2 | `fp-story` · v2 `table`        |     |   0 | catalogue |
|    4 | B2-03-A1-05-VOTE-OU                      |   5 | `fp-vote`                      |  I  |   0 | seance    |
|    5 | B2-03-A1-06-ILLUSTRATION-CONNECTEURS     |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|    6 | B2-03-A1-06-COURS-CONNECTEURS            |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|    7 | B2-03-A1-07-ILLUSTRATION-IMPLICATION     |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|    8 | B2-03-A1-07-COURS-IMPLICATION            |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|    9 | B2-03-A1-09-TABLE-VERITE                 |   8 | `fp-table-build`               |  I  |   0 | seance    |
|   10 | B2-03-A1-10-ATELIER-CONNECTEURS          |   8 | `questionnaire`                |  I  |   2 | seance    |
|   11 | B2-03-A1-12-JALON                        |   1 | `fp-pulse`                     |     |   0 | seance    |
|   12 | B2-03-A2-01-CONTRAIRE                    |   5 | `fp-story` · v2 `reflection`   |  I  |   0 | seance    |
|   13 | B2-03-A2-02-ILLUSTRATION-NEGATION        |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   14 | B2-03-A2-02-COURS-NEGATION               |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   15 | B2-03-A2-03-ILLUSTRATION-MORGAN          |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   16 | B2-03-A2-03-COURS-MORGAN                 |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   17 | B2-03-A2-05-ATELIER-MORGAN               |  11 | `questionnaire`                |  I  |   4 | seance    |
|   18 | B2-03-A2-06-TABLEUR-NON-OU               |  10 | `fp-sheet`                     |  I  |   0 | seance    |
|   19 | B2-03-A2-07-JALON                        |   1 | `fp-pulse`                     |     |   0 | seance    |
|   20 | B2-03-A3-01-VOTE-TOUTES                  |   5 | `fp-vote`                      |  I  |   0 | seance    |
|   21 | B2-03-A3-02-ILLUSTRATION-PREDICATS       |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   22 | B2-03-A3-02-COURS-PREDICATS              |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   23 | B2-03-A3-03-ILLUSTRATION-QUANTIFICATEURS |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   24 | B2-03-A3-03-COURS-QUANTIFICATEURS        |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   25 | B2-03-A3-05-ATELIER-QUANTIF              |  11 | `questionnaire`                |  I  |   2 | seance    |
|   26 | B2-03-A3-07-JALON                        |   1 | `fp-pulse`                     |     |   0 | seance    |
|   27 | B2-03-A4-01-SITUATION-FACTURES           |   3 | `fp-story` · v2 `table`        |     |   0 | catalogue |
|   28 | B2-03-A4-02-TABLEUR-CONTROLE             |  17 | `fp-sheet`                     |  I  |   0 | seance    |
|   29 | B2-03-A4-03-COFFRE-CONTROLE              |  16 | `fp-escape`                    |  I  |   0 | seance    |
|   30 | B2-03-A4-04-RAPPEL                       |   6 | `fp-spaced`                    |  I  |   0 | seance    |
|   31 | B2-03-A4-05-FICHE-MEMO                   |   2 | `fp-story` · v2 `grid`         |     |   0 | catalogue |
|   32 | B2-03-A4-06-BILLET-DE-SORTIE             |   4 | `fp-exit`                      |  I  |   1 | seance    |

Rythme : 111 minutes interactives, 29 d'exposition, exposition continue de 6 minutes au plus.

### 3.2 Acte 1 — Ouverture, puis combiner des conditions (36 min)

#### A1-02 · `B2-03-A1-02-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Écrire et contrôler une règle »
- Atelier Rivage et le contrôle de l'expert-comptable ; plan en trois notions et une mini-situation.

#### A1-03 · `B2-03-A1-03-MISSION` — 5 min · `fp-pro` · séance

- Titre public : « Votre mission : le contrôle des factures clients »
- Courriel de Marc Lefèvre (trois règles) et remarque d'Hélène Garnier (F213 à 60 jours pile ; « toutes
  nos factures hors de France portent un numéro de TVA »). Deux questions libres sans calcul : « et »
  ou « ou » pour chaque règle (`regles`) ; relancer F213 (`f213`). Ni geste ni conséquence : l'écran
  ne montre que la situation et ses deux questions.
- Papier : deux lignes d'écriture dans le livret.

#### A1-04 · `B2-03-A1-04-FACTURES` — 2 min · v2 `table` · catalogue

- Titre public : « Les seize factures du trimestre »
- Les seize factures F201 à F216 : client, pays, montant HT, délai, statut, numéro de TVA renseigné.
  Mention « Données fictives ».

#### A1-05 · `B2-03-A1-05-VOTE-OU` — 5 min · `fp-vote` · séance

- Titre public : « Vote : « ou » et « plus de » »
- Deux votes non notés (temps « réfléchir » de N1), révélation commentée : client fidèle à 1 500 €
  (`ou-lu-exclusif`) ; prime pour plus de trois ans, Léo à trois ans pile (`borne-stricte-large`).

#### A1-06 · `B2-03-A1-06-ILLUSTRATION-CONNECTEURS` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : la remise de la boutique »
- Image seule (M1) : l'exemple pour débuter de la page qui suit (quatre clients, P, Q et P ∨ Q pour
  chacun, la formule `OU` au tableur).

#### A1-06 · `B2-03-A1-06-COURS-CONNECTEURS` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : propositions et connecteurs »
- Page 1 sur 2, deux blocs : proposition, non, et, ou ; exemple pour débuter (remise de la boutique,
  quatre clients).

#### A1-07 · `B2-03-A1-07-ILLUSTRATION-IMPLICATION` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : la prime d’ancienneté »
- Image seule (M2) : l'exemple pour débuter de la page qui suit (Anna, Bruno, Chloé, la réciproque,
  le récapitulatif avec David).

#### A1-07 · `B2-03-A1-07-COURS-IMPLICATION` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : implication et réciproque »
- Page 2 sur 2, deux blocs : implication, contre-exemple, réciproque, équivalence ; exemple pour
  débuter (prime d'ancienneté, trois salariés et la réciproque).

#### A1-09 · `B2-03-A1-09-TABLE-VERITE` — 8 min · `fp-table-build` · séance

- Titre public : « Exercice 1 — La table de vérité du visa »
- Temps : réflexion 1 min · travail 5 min · correction 2 min sur place.
- P « hors de France », Q « montant d'au moins 5 000 € » sur F205, F203, F202, F201 ; saisie de ¬P,
  P ∧ Q, P ∨ Q, P ⇒ Q. Pièges : `ou-lu-exclusif` (ligne V, V), `implication-lue-comme-equivalence`
  (ligne F, V).
- Choix T-01 : pas de brique nouvelle. Une colonne `fp-table-build` de format `booleen` se saisit
  par une liste V/F (0 ou 1, toute autre valeur refusée par le serveur) et s'imprime « V / F » au
  livret.

#### A1-10 · `B2-03-A1-10-ATELIER-CONNECTEURS` — 8 min · `questionnaire` · séance

- Titre public : « Exercice 2 — Appliquer les règles aux factures »
- Temps : réflexion 1 min · travail 5 min · correction 2 min, question par question sur place.
- `b2-03-a1-implication` (vote) : la réciproque du visa ; piège `implication-lue-comme-equivalence`.
- `b2-03-a1-f205` (vote) : F205 visée ? ; piège `ou-lu-exclusif`.

#### A1-12 · `B2-03-A1-12-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 1 : lire une règle »
- Puis pause de 15 minutes.

### 3.3 Acte 2 — Nier une règle (33 min)

#### A2-01 · `B2-03-A2-01-CONTRAIRE` — 5 min · v2 `reflection` · séance

- Titre public : « Réfléchir : le contraire d’une règle »
- Écrire la règle des factures non relancées sans le mot « non ». Temps « réfléchir » de N2.

#### A2-02 · `B2-03-A2-02-ILLUSTRATION-NEGATION` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : le cas de Léo »
- Image seule (M3) : l'exemple pour débuter de la page qui suit (prime pour plus de trois ans, Léo à
  trois ans pile dans le contraire, l'erreur « < 3 », `B2<>"France"`, la formule de la prime).

#### A2-02 · `B2-03-A2-02-COURS-NEGATION` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : la négation d’une condition »
- Page 1 sur 2, deux blocs : négation, comparaison niée borne comprise ; exemple pour débuter (prime
  d'ancienneté).

#### A2-03 · `B2-03-A2-03-ILLUSTRATION-MORGAN` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : le contraire de la remise »
- Image seule (M4) : l'exemple pour débuter de la page qui suit (le contraire de la remise, l'erreur
  sans Morgan sur le client à 1 300 €, `NON(OU(…))` et `ET(…)` au tableur, quatre clients).

#### A2-03 · `B2-03-A2-03-COURS-MORGAN` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : les lois de Morgan »
- Page 2 sur 2, deux blocs : lois de Morgan ; exemple pour débuter (remise de la boutique).

#### A2-05 · `B2-03-A2-05-ATELIER-MORGAN` — 11 min · `questionnaire` · séance

- Titre public : « Exercice 3 — Nier la relance et le visa »
- Temps : réflexion 2 min · travail 7 min · correction 2 min, question par question sur place.
- `b2-03-a2-non-relance` (vote) : piège `negation-comparaison` ; `b2-03-a2-non-visa` (vote) :
  piège `negation-sans-morgan`. Un seul piège par vote pour que l'écran tienne sur un portable
  14 pouces.
- `b2-03-a2-sans-visa` : factures non visées ; pièges `negation-comparaison`, `negation-sans-morgan`.
- `b2-03-a2-formule` (vote) : forme de Morgan d'une formule `NON(ET(…))` ; piège
  `negation-sans-morgan`.

#### A2-06 · `B2-03-A2-06-TABLEUR-NON-OU` — 10 min · `fp-sheet` · séance

- Titre public : « Exercice 4 — Deux contrôles de la TVA »
- Temps : réflexion 2 min · travail 6 min · correction 2 min sur place.
- Cinq factures ; D avec `SI`, `NON`, `OU`, E avec `SI`, `ET` : les deux colonnes s'accordent.

#### A2-07 · `B2-03-A2-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : nier une règle »

### 3.4 Acte 3 — Tous, au moins un (23 min)

#### A3-01 · `B2-03-A3-01-VOTE-TOUTES` — 5 min · `fp-vote` · séance

- Titre public : « Vote : « toutes » et « il existe » »
- Deux votes non notés (temps « réfléchir » de N3) : contredire « toutes »
  (`negation-pour-tout-en-aucun`) ; nier « il existe » (`negation-il-existe-gardee`).

#### A3-02 · `B2-03-A3-02-ILLUSTRATION-PREDICATS` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : l’équipe de vente »
- Image seule (M5) : l'exemple pour débuter de la page qui suit (Léa 12 voiles, Karim 7, Sofia 15 ;
  ∃ vraie, ∀ fausse, leurs contraires et le résumé).

#### A3-02 · `B2-03-A3-02-COURS-PREDICATS` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : prédicats et quantificateurs »
- Page 1 sur 2, trois blocs : prédicat, ∀, ∃ ; exemple pour débuter (trois commerciaux) ; négation
  d'une phrase quantifiée.

#### A3-03 · `B2-03-A3-03-ILLUSTRATION-QUANTIFICATEURS` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : les voiles vendues »
- Image seule (M6) : l'exemple pour débuter de la page qui suit (`NB.SI` avec `">=10"` puis `"<10"`,
  le critère sans guillemets, le récapitulatif).

#### A3-03 · `B2-03-A3-03-COURS-QUANTIFICATEURS` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : quantificateurs au tableur »
- Page 2 sur 2, deux blocs : ∀ et ∃ vérifiés par `NB.SI`, critère entre guillemets ; exemple pour
  débuter (les voiles vendues).

#### A3-05 · `B2-03-A3-05-ATELIER-QUANTIF` — 11 min · `questionnaire` · séance

- Titre public : « Exercice 5 — Contredire une affirmation »
- Temps : réflexion 2 min · travail 7 min · correction 2 min, question par question sur place.
- `b2-03-a3-non-toutes` (vote) ; pièges `negation-pour-tout-en-aucun`, `negation-comparaison`.
- `b2-03-a3-impayees-recentes` : contre-exemples ; piège `negation-comparaison`.

#### A3-07 · `B2-03-A3-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 3 : quantifier »
- Puis pause de 15 minutes.

### 3.5 Acte 4 — Mini-situation CCF et clôture (48 min)

#### A4-01 · `B2-03-A4-01-SITUATION-FACTURES` — 3 min · v2 `table` · catalogue

- Titre public : « Mini-situation CCF : contrôler les comptes clients »
- Les seize factures avec les lettres de colonnes A à G ; barème sur 10. Mention « Données fictives ».

#### A4-02 · `B2-03-A4-02-TABLEUR-CONTROLE` — 17 min · `fp-sheet` · séance

- Titre public : « Question tableur (3 points sur 10) : contrôler le fichier »
- Temps : réflexion 3 min · travail 12 min · correction 2 min sur place.
- Feuille des seize factures en lignes 2 à 17 : relance en colonne H (`SI`, `ET`), visa en colonne I
  (`SI`, `OU`), compte des relances en K2 (`NB.SI`). Trente-trois cellules attendues (les seize
  lignes de H et de I, puis K2) ; pièges `borne-stricte-large`, `critere-sans-guillemets`.

#### A4-03 · `B2-03-A4-03-COFFRE-CONTROLE` — 16 min · `fp-escape` · séance

- Titre public : « Mini-situation : conclure le contrôle »
- Temps : réflexion 2 min · travail 12 min · correction 2 min sur place, énigme par énigme.
- E1 indemnités de retard (2 points ; pièges `borne-stricte-large`, `et-traduit-par-ou`) ; E2
  factures sans relance (2 points ; `negation-sans-morgan`, `negation-comparaison`) ; E3 factures
  visées sous le seuil (1,5 point ; `implication-lue-comme-equivalence`) ; E4 requête SQL `WHERE …
AND …` (1,5 point ; `et-traduit-par-ou`).
- Papier : quatre questions rédigées du livret, sans code de coffre.

#### A4-04 · `B2-03-A4-04-RAPPEL` — 6 min · `fp-spaced` · séance

- Titre public : « Rappel : de mémoire, sans vos notes »

#### A4-05 · `B2-03-A4-05-FICHE-MEMO` — 2 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : écrire et contrôler une règle »

#### A4-06 · `B2-03-A4-06-BILLET-DE-SORTIE` — 4 min · `fp-exit` · séance

- Titre public : « Billet de sortie : la formule pour l’expert-comptable »

## 4. Mode papier

Le livret étudiant reprend, dans l'ordre des écrans, les illustrations, les traces écrites, les
énoncés et un cadre de réponse par question ; il ne contient aucune bonne réponse. Le corrigé
formateur ajoute les réponses, les pièges et le barème. Sans poste, le formateur pilote les
révélations depuis le pupitre ; les votes se font à main levée, les formules s'écrivent sur la copie
et s'appliquent à la main.

## 5. Contenus

### 5.9 Concepts, confusions et remédiations

**Concepts** : `proposition`, `connecteur`, `negation`, `quantificateur`, `tableur`.
**Confusions** : neuf, dont `negation-il-existe-gardee`, nouvelle. La borne renvoie à la page de la
négation, seule trace écrite qui écrit encore > et ≥ côte à côte.

| Identifiant                         | Concept        | Libellé                                                      | Remédiation                       |
| ----------------------------------- | -------------- | ------------------------------------------------------------ | --------------------------------- |
| `ou-lu-exclusif`                    | connecteur     | Lire « ou » comme exclusif.                                  | B2-03-A1-06-COURS-CONNECTEURS     |
| `implication-lue-comme-equivalence` | connecteur     | Prendre la réciproque pour l'implication.                    | B2-03-A1-07-COURS-IMPLICATION     |
| `borne-stricte-large`               | proposition    | Confondre inégalité stricte et large.                        | B2-03-A2-02-COURS-NEGATION        |
| `et-traduit-par-ou`                 | connecteur     | Traduire une règle « et » par un « ou ».                     | B2-03-A1-06-COURS-CONNECTEURS     |
| `negation-comparaison`              | negation       | Nier une comparaison sans changer la largeur de l'inégalité. | B2-03-A2-02-COURS-NEGATION        |
| `negation-sans-morgan`              | negation       | Nier chaque condition sans échanger « et » et « ou ».        | B2-03-A2-03-COURS-MORGAN          |
| `negation-pour-tout-en-aucun`       | quantificateur | Nier « tous » en « aucun ».                                  | B2-03-A3-02-COURS-PREDICATS       |
| `negation-il-existe-gardee`         | quantificateur | Garder « il existe » en niant.                               | B2-03-A3-02-COURS-PREDICATS       |
| `critere-sans-guillemets`           | tableur        | Écrire un texte ou un critère sans guillemets.               | B2-03-A3-03-COURS-QUANTIFICATEURS |

### 5.10 Rappels espacés

Neuf rappels : « ou » inclusif, contre-exemple d'une implication, Morgan sur « et » et sur « ou »,
négation d'une comparaison, négation de « tous » et de « il existe », guillemets du critère, clause
`WHERE`. Obligatoires : `b2-03-r-morgan-et` et `b2-03-r-pour-tout`.

## 8. Médias

### 8.1 Principe

Les factures sont rendues par le rendu `table`, les feuilles par `fp-sheet`. Chaque page de trace
écrite est précédée d'un écran `illustration` qui ne montre que l'image de son exemple pour débuter :
six illustrations produites pour le cours, aux mêmes nombres que la page qu'elles précèdent.

Deux écarts de dessin sont publiés tels quels, sur décision de Tim du 15 octobre 2026 : M3 écrit la
formule de la prime « en C2 » alors qu'elle remplit la colonne D ; M6 affiche « #VALEUR ! » pour le
critère sans guillemets, qu'Excel refuse à la saisie et que Google Sheets signale par #ERROR!.

### 8.2 Catalogue des médias

Chaque PNG d'origine est converti en WebP de 1 600 px de large au plus (1 774 × 887 px ramené à
1 600 × 800 px ; 1 536 × 1 024 px gardé) et servi depuis `/assets/cours/b2-03/v1/`. Le catalogue est
stocké avec le cours (`Cours.medias`) et contrôlé par la règle `media-sans-licence`.

| Id  | Écran | Fichier source (page)      | Original                     | Auteur, date       | Licence      | Dérivé servi                           | Attribution affichée                                                         |
| --- | ----- | -------------------------- | ---------------------------- | ------------------ | ------------ | -------------------------------------- | ---------------------------------------------------------------------------- |
| M1  | A1-06 | production propre du cours | PNG 1 774 × 887 px, 1,7 Mo   | Asili Design, 2026 | CC BY-SA 4.0 | `remise-boutique-ou.webp`              | « La remise de la boutique · Asili Design, 2026 · CC BY-SA 4.0 »             |
| M2  | A1-07 | production propre du cours | PNG 1 536 × 1 024 px, 1,7 Mo | Asili Design, 2026 | CC BY-SA 4.0 | `prime-anciennete-implication.webp`    | « La prime d’ancienneté · Asili Design, 2026 · CC BY-SA 4.0 »                |
| M3  | A2-02 | production propre du cours | PNG 1 774 × 887 px, 1,6 Mo   | Asili Design, 2026 | CC BY-SA 4.0 | `prime-anciennete-negation.webp`       | « La prime d’ancienneté, le cas de Léo · Asili Design, 2026 · CC BY-SA 4.0 » |
| M4  | A2-03 | production propre du cours | PNG 1 774 × 887 px, 1,7 Mo   | Asili Design, 2026 | CC BY-SA 4.0 | `remise-boutique-morgan.webp`          | « Le contraire de la remise · Asili Design, 2026 · CC BY-SA 4.0 »            |
| M5  | A3-02 | production propre du cours | PNG 1 536 × 1 024 px, 1,8 Mo | Asili Design, 2026 | CC BY-SA 4.0 | `equipe-de-vente-quantificateurs.webp` | « L’équipe de vente · Asili Design, 2026 · CC BY-SA 4.0 »                    |
| M6  | A3-03 | production propre du cours | PNG 1 536 × 1 024 px, 1,6 Mo | Asili Design, 2026 | CC BY-SA 4.0 | `voiles-vendues-nb-si.webp`            | « Les voiles vendues · Asili Design, 2026 · CC BY-SA 4.0 »                   |

### 8.3 Sources des données

- Seize factures d'Atelier Rivage : données fictives créées pour le cours.
- Délai de paiement de 60 jours au plus et indemnité forfaitaire de 40 € : Code de commerce,
  articles L441-10 et D441-5 ; mentions de la facture : CGI, annexe II, article 242 nonies A ; détail
  dans `docs/donnees-b2-03-sources.md`.
- Procédure de visa : procédure interne fictive.
