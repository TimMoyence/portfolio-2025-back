# B2-03 · Logique : écrire et contrôler une règle — conception de référence (gabarit v3)

> Cahier des charges du cours B2-03 au gabarit v3 (`docs/cours-gabarit-v3.md`) : une séance de
> 3 h 30 dont 30 minutes de pause, trois notions traitées chacune par un cycle réfléchir → comprendre
> → s'exercer, puis une mini-situation CCF. Ce document ne contient aucun code exécutable ; toute
> divergence d'implémentation est un défaut de l'implémentation. Les tests `b2-03.cours.spec.ts`
> relisent ce document : § 3.1, titres publics du § 3, § 5.9, § 8.2.

| Rubrique    | Valeur                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| Date        | 29 septembre 2026                                                                                                   |
| Statut      | **Référence pédagogique** : troisième cours du plan v3 (`docs/cours-bts-cg2-plan-v3.md`), deuxième au gabarit v3    |
| Cours       | `b2-03-logique`                                                                                                     |
| Gabarit     | `v3`, déclaré par le contenu et contrôlé par les quatre règles `gabarit-*` de `verifierStructure`                   |
| Titre servi | « Logique : écrire et contrôler une règle »                                                                         |
| Durée       | **180 minutes exactes** (somme des écrans), 4 actes de 54, 39, 39 et 48 minutes, plus 2 pauses de 15 min hors durée |
| Écrans      | **32**, dont 10 écrans catalogue                                                                                    |
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
4. nier une phrase avec « tous » ou « il existe » et respecter l'ordre des quantificateurs ;
5. écrire la règle au tableur (`SI`, `ET`, `OU`, `NON`, `NB.SI`) et lire une clause `WHERE`.

### 1.3 Public et conditions

BTS CG 2e année, 25 étudiants au plus, calculatrice autorisée, un poste par étudiant ou le livret
papier. Séance de 3 h 30 : 180 minutes de travail, pause de 15 minutes après l'acte 1 et après
l'acte 3.

## 2. Architecture

### 2.1 Les quatre actes

| Acte | Rôle                                    | Notion | Minutes |
| ---- | --------------------------------------- | ------ | ------: |
| 1    | Ouverture, puis combiner des conditions | N1     |      54 |
| 2    | Nier une règle                          | N2     |      39 |
| 3    | Tous, au moins un                       | N3     |      39 |
| 4    | Mini-situation CCF et clôture           | —      |      48 |

Pause 1 (15 min) après le jalon A1-12 ; pause 2 (15 min) après le jalon A3-07. Les pauses ne sont
pas des écrans : le formateur les annonce, la durée programmée n'en tient pas compte.

### 2.2 Le cycle d'une notion

Chaque notion suit : **Réfléchir** (vote non noté ou réflexion écrite) → **Comprendre** (trace écrite
en deux pages v2 `lesson` de 3 minutes, puis exemple guidé `fp-worked` corrigé étape par étape sur son
propre écran) → **S'exercer** (exercices notés, corrigés sur place). Chaque page de trace écrite porte
trois blocs : une définition en langage courant qui dit à quoi sert la notion pour le contrôle, un
exemple pour débuter hors du fichier (remise d'une boutique, prime d'ancienneté, équipe de vente) et
une méthode ou un encadré « Au CCF » qui nomme les pièges.

Chaque exercice annonce ses temps dans les notes formateur, sous la forme
`• Temps : réflexion N min · travail N min · correction N min`, dont la somme est la durée de
l'écran. La correction se dévoile sur l'écran de l'exercice (`correctionSurPlace`).

### 2.3 Règles de structure

Le cours passe les règles communes et les quatre règles du gabarit v3 : 32 écrans ≤ 40,
180 minutes ≤ 180, chaque trace écrite précédée d'une réflexion et suivie d'un exercice, chaque
exercice avec ses trois temps et sa correction sur place, mini-situation (`fp-escape`) sans trace
écrite après elle. Exposition continue de 6 minutes au plus.

### 2.4 Diffusion

Catalogue : l'accroche, les deux tableaux des factures, les six pages de trace écrite et la fiche
mémo. Tout le reste est servi en séance.

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B2-03-A{acte}-{rang}-{SLUG}`, conformes à `^B2-03-A[1-6]-\d{2}-[A-Z0-9-]+$`.
Colonne « Brique · rendu » : valeur de la colonne `brique` ; les écrans « v2 » sont stockés en
`fp-story` avec une présentation v2. « I » = interactif. « Q » = questions fermées notées (vote,
numérique, classement) portées par l'écran.

| Rang | Identifiant                       | Min | Brique · rendu               |  I  |   Q | Diffusion |
| ---: | --------------------------------- | --: | ---------------------------- | :-: | --: | --------- |
|    1 | B2-03-A1-01-DIAGNOSTIC            |   4 | `fp-recall`                  |  I  |   1 | seance    |
|    2 | B2-03-A1-02-ACCROCHE              |   1 | `fp-story` · v2 `hero`       |     |   0 | catalogue |
|    3 | B2-03-A1-03-MISSION               |   5 | `fp-pro`                     |  I  |   0 | seance    |
|    4 | B2-03-A1-04-FACTURES              |   2 | `fp-story` · v2 `table`      |     |   0 | catalogue |
|    5 | B2-03-A1-05-VOTE-OU               |   5 | `fp-vote`                    |  I  |   0 | seance    |
|    6 | B2-03-A1-06-COURS-CONNECTEURS     |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|    7 | B2-03-A1-07-COURS-IMPLICATION     |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|    8 | B2-03-A1-08-EXEMPLE-TABLE         |   6 | `fp-worked`                  |  I  |   0 | seance    |
|    9 | B2-03-A1-09-TABLE-VERITE          |   8 | `fp-table-build`             |  I  |   0 | seance    |
|   10 | B2-03-A1-10-ATELIER-CONNECTEURS   |   8 | `questionnaire`              |  I  |   4 | seance    |
|   11 | B2-03-A1-11-TABLEUR-SI-OU         |   8 | `fp-sheet`                   |  I  |   0 | seance    |
|   12 | B2-03-A1-12-JALON                 |   1 | `fp-pulse`                   |     |   0 | seance    |
|   13 | B2-03-A2-01-CONTRAIRE             |   5 | `fp-story` · v2 `reflection` |  I  |   0 | seance    |
|   14 | B2-03-A2-02-COURS-NEGATION        |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   15 | B2-03-A2-03-COURS-MORGAN          |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   16 | B2-03-A2-04-EXEMPLE-MORGAN        |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   17 | B2-03-A2-05-ATELIER-MORGAN        |  11 | `questionnaire`              |  I  |   4 | seance    |
|   18 | B2-03-A2-06-TABLEUR-NON-OU        |  10 | `fp-sheet`                   |  I  |   0 | seance    |
|   19 | B2-03-A2-07-JALON                 |   1 | `fp-pulse`                   |     |   0 | seance    |
|   20 | B2-03-A3-01-VOTE-TOUTES           |   5 | `fp-vote`                    |  I  |   0 | seance    |
|   21 | B2-03-A3-02-COURS-PREDICATS       |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   22 | B2-03-A3-03-COURS-QUANTIFICATEURS |   3 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   23 | B2-03-A3-04-EXEMPLE-QUANTIF       |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   24 | B2-03-A3-05-ATELIER-QUANTIF       |  11 | `questionnaire`              |  I  |   4 | seance    |
|   25 | B2-03-A3-06-DEFI-IA               |  10 | `fp-challenge`               |  I  |   0 | seance    |
|   26 | B2-03-A3-07-JALON                 |   1 | `fp-pulse`                   |     |   0 | seance    |
|   27 | B2-03-A4-01-SITUATION-FACTURES    |   3 | `fp-story` · v2 `table`      |     |   0 | catalogue |
|   28 | B2-03-A4-02-TABLEUR-CONTROLE      |  17 | `fp-sheet`                   |  I  |   0 | seance    |
|   29 | B2-03-A4-03-COFFRE-CONTROLE       |  16 | `fp-escape`                  |  I  |   0 | seance    |
|   30 | B2-03-A4-04-RAPPEL                |   6 | `fp-spaced`                  |  I  |   0 | seance    |
|   31 | B2-03-A4-05-FICHE-MEMO            |   2 | `fp-story` · v2 `grid`       |     |   0 | catalogue |
|   32 | B2-03-A4-06-BILLET-DE-SORTIE      |   4 | `fp-exit`                    |  I  |   1 | seance    |

Rythme : 151 minutes interactives, 29 d'exposition, exposition continue de 6 minutes au plus.

### 3.2 Acte 1 — Ouverture, puis combiner des conditions (54 min)

#### A1-01 · `B2-03-A1-01-DIAGNOSTIC` — 4 min · `fp-recall` · séance

- Titre public : « Diagnostic : la remise à 1 000 € »
- Énoncé (`b2-03-a1-diagnostic`) : B2 vaut 1000, que renvoie `=SI(B2>=1000;"Remise";"Plein tarif")` ?
  Bonne réponse : la remise ; piège `borne-stricte-large`.
- Papier : question du livret, vote à main levée.

#### A1-02 · `B2-03-A1-02-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Écrire et contrôler une règle »
- Atelier Rivage et le contrôle de l'expert-comptable ; plan en trois notions et une mini-situation.

#### A1-03 · `B2-03-A1-03-MISSION` — 5 min · `fp-pro` · séance

- Titre public : « Votre mission : le contrôle des factures clients »
- Courriel de Marc Lefèvre (trois règles) et remarque d'Hélène Garnier (F213 à 60 jours pile ; « toutes
  nos factures hors de France portent un numéro de TVA »). Trois questions libres sans calcul : « et »
  ou « ou » pour chaque règle (`regles`) ; relancer F213 (`f213`) ; que trouver pour contredire
  Hélène (`preuve`).
- Papier : trois lignes d'écriture dans le livret.

#### A1-04 · `B2-03-A1-04-FACTURES` — 2 min · v2 `table` · catalogue

- Titre public : « Les seize factures du trimestre »
- Les seize factures F201 à F216 : client, pays, montant HT, délai, statut, numéro de TVA renseigné.
  Mention « Données fictives ».

#### A1-05 · `B2-03-A1-05-VOTE-OU` — 5 min · `fp-vote` · séance

- Titre public : « Vote : « ou » et « plus de » »
- Deux votes non notés (temps « réfléchir » de N1), révélation commentée : client fidèle à 1 500 €
  (`ou-lu-exclusif`) ; prime pour plus de trois ans, Léo à trois ans pile (`borne-stricte-large`).

#### A1-06 · `B2-03-A1-06-COURS-CONNECTEURS` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : propositions et connecteurs »
- Page 1 sur 2 : proposition, non, et, ou ; exemple pour débuter (remise de la boutique, quatre
  clients) ; méthode de la table de vérité et pièges du « ou » (exclusif, compté deux fois).

#### A1-07 · `B2-03-A1-07-COURS-IMPLICATION` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : implication, réciproque et bornes »
- Page 2 sur 2 : implication, contre-exemple, réciproque, équivalence ; exemple pour débuter (prime
  d'ancienneté, quatre salariés) ; au CCF (mots de la borne, test de la valeur limite).

#### A1-08 · `B2-03-A1-08-EXEMPLE-TABLE` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : la règle de relance »
- Règle de relance sur F202, F206, F209, F201 : propositions, valeurs, « et », piège du « ou »,
  formule `=SI(ET(B2="Impayée";C2>60);"Relancer";"Non")`. 4 min de réponses, puis 2 min de correction
  dévoilée étape par étape.

#### A1-09 · `B2-03-A1-09-TABLE-VERITE` — 8 min · `fp-table-build` · séance

- Titre public : « Exercice 1 — La table de vérité du visa »
- Temps : réflexion 1 min · travail 5 min · correction 2 min sur place.
- P « hors de France », Q « montant d'au moins 5 000 € » sur F205, F203, F202, F201 ; saisie de ¬P,
  P ∧ Q, P ∨ Q, P ⇒ Q. Pièges : `ou-lu-exclusif` (ligne V, V), `implication-lue-comme-equivalence`
  (ligne F, V).

#### A1-10 · `B2-03-A1-10-ATELIER-CONNECTEURS` — 8 min · `questionnaire` · séance

- Titre public : « Exercice 2 — Appliquer les règles aux factures »
- Temps : réflexion 1 min · travail 5 min · correction 2 min, question par question sur place.
- `b2-03-a1-visa` : nombre de factures à viser ; pièges `ou-lu-exclusif`, `ou-compte-deux-fois`,
  `borne-stricte-large`.
- `b2-03-a1-implication` (vote) : la réciproque du visa ; piège `implication-lue-comme-equivalence`.
- `b2-03-a1-f213` (vote) : F213 relancée ? ; piège `borne-stricte-large`.
- `b2-03-a1-f205` (vote) : F205 visée ? ; piège `ou-lu-exclusif`.

#### A1-11 · `B2-03-A1-11-TABLEUR-SI-OU` — 8 min · `fp-sheet` · séance

- Titre public : « Exercice 3 — La formule du visa »
- Temps : réflexion 1 min · travail 5 min · correction 2 min sur place.
- Cinq factures, formule du visa en D2 recopiée jusqu'en D6 ; texte sans guillemets :
  `critere-sans-guillemets`.

#### A1-12 · `B2-03-A1-12-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 1 : lire une règle »
- Puis pause de 15 minutes.

### 3.3 Acte 2 — Nier une règle (39 min)

#### A2-01 · `B2-03-A2-01-CONTRAIRE` — 5 min · v2 `reflection` · séance

- Titre public : « Réfléchir : le contraire d’une règle »
- Écrire la règle des factures non relancées sans le mot « non ». Temps « réfléchir » de N2.

#### A2-02 · `B2-03-A2-02-COURS-NEGATION` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : la négation d’une condition »
- Page 1 sur 2 : négation, comparaison niée borne comprise ; exemple pour débuter (prime
  d'ancienneté) ; méthode et contrôle par le partage des lignes.

#### A2-03 · `B2-03-A2-03-COURS-MORGAN` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : les lois de Morgan »
- Page 2 sur 2 : lois de Morgan ; exemple pour débuter (remise de la boutique) ; au CCF (nier et
  échanger le connecteur, vérifier sur une ligne).

#### A2-04 · `B2-03-A2-04-EXEMPLE-MORGAN` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : les factures conformes à la TVA »
- Règle d'anomalie TVA, négation par Morgan, trois anomalies, treize conformes, piège sans Morgan.

#### A2-05 · `B2-03-A2-05-ATELIER-MORGAN` — 11 min · `questionnaire` · séance

- Titre public : « Exercice 4 — Nier la relance et le visa »
- Temps : réflexion 2 min · travail 7 min · correction 2 min, question par question sur place.
- `b2-03-a2-non-relance` (vote) : piège `negation-comparaison` ; `b2-03-a2-non-visa` (vote) :
  piège `negation-sans-morgan`. Un seul piège par vote pour que l'écran tienne sur un portable
  14 pouces.
- `b2-03-a2-sans-visa` : factures non visées ; pièges `negation-comparaison`, `negation-sans-morgan`.
- `b2-03-a2-formule` (vote) : forme de Morgan d'une formule `NON(ET(…))` ; piège
  `negation-sans-morgan`.

#### A2-06 · `B2-03-A2-06-TABLEUR-NON-OU` — 10 min · `fp-sheet` · séance

- Titre public : « Exercice 5 — Deux contrôles de la TVA »
- Temps : réflexion 2 min · travail 6 min · correction 2 min sur place.
- Cinq factures ; D avec `SI`, `NON`, `OU`, E avec `SI`, `ET` : les deux colonnes s'accordent.

#### A2-07 · `B2-03-A2-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : nier une règle »

### 3.4 Acte 3 — Tous, au moins un (39 min)

#### A3-01 · `B2-03-A3-01-VOTE-TOUTES` — 5 min · `fp-vote` · séance

- Titre public : « Vote : « toutes » et « il existe » »
- Deux votes non notés (temps « réfléchir » de N3) : contredire « toutes »
  (`negation-pour-tout-en-aucun`) ; nier « il existe » (`negation-il-existe-gardee`).

#### A3-02 · `B2-03-A3-02-COURS-PREDICATS` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : prédicats et quantificateurs »
- Page 1 sur 2 : prédicat, ∀, ∃ ; exemple pour débuter (trois commerciaux) ; négation d'une phrase
  quantifiée.

#### A3-03 · `B2-03-A3-03-COURS-QUANTIFICATEURS` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : quantificateurs au tableur et ordre »
- Page 2 sur 2 : ∀ et ∃ vérifiés par `NB.SI`, critère entre guillemets ; exemple pour débuter ; au
  CCF, l'ordre des quantificateurs.

#### A3-04 · `B2-03-A3-04-EXEMPLE-QUANTIF` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : les commerciaux et leurs clients »
- Léa et Karim, cinq clients : ∀ puis ∃ vraie, ∃ puis ∀ fausse, négation, `NB.SI`.

#### A3-05 · `B2-03-A3-05-ATELIER-QUANTIF` — 11 min · `questionnaire` · séance

- Titre public : « Exercice 6 — Contredire une affirmation »
- Temps : réflexion 2 min · travail 7 min · correction 2 min, question par question sur place.
- `b2-03-a3-non-toutes` (vote) ; pièges `negation-pour-tout-en-aucun`, `negation-comparaison`.
- `b2-03-a3-impayees-recentes` : contre-exemples ; piège `negation-comparaison`.
- `b2-03-a3-ordre` (vote) ; piège `ordre-quantificateurs-inverse`.
- `b2-03-a3-clients` : clients qui contredisent la phrase ; piège `negation-il-existe-gardee`.

#### A3-06 · `B2-03-A3-06-DEFI-IA` — 10 min · `fp-challenge` · séance

- Titre public : « Exercice 7 — Corriger le contrôle d’une IA »
- Temps : réflexion 2 min · travail 6 min · correction 2 min, piste par piste sur place.
- L'IA nie « toutes » en « aucune », relance avec « ou » et inverse l'ordre des quantificateurs.
  Pistes justes : négation, « et », ordre, contrôle sur F209 ; piste fausse : garder la réponse.

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
  (`SI`, `OU`), comptes en K2 et K3 (`NB.SI`). Trente-quatre cellules attendues (les seize lignes de H et de I, puis K2 et K3) ; pièges
  `borne-stricte-large`, `ou-compte-deux-fois`, `ou-lu-exclusif`, `critere-sans-guillemets`.

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

Le livret étudiant reprend, dans l'ordre des écrans, les traces écrites, les énoncés et un cadre de
réponse par question ; il ne contient aucune bonne réponse. Le corrigé formateur ajoute les réponses,
les pièges et le barème. Sans poste, le formateur pilote les révélations depuis le pupitre ; les votes
se font à main levée, les formules s'écrivent sur la copie et s'appliquent à la main.

## 5. Contenus

### 5.9 Concepts, confusions et remédiations

**Concepts** : `proposition`, `connecteur`, `negation`, `quantificateur`, `tableur`.
**Confusions** : onze, dont `negation-il-existe-gardee`, nouvelle.

| Identifiant                         | Concept        | Libellé                                                      | Remédiation                       |
| ----------------------------------- | -------------- | ------------------------------------------------------------ | --------------------------------- |
| `ou-lu-exclusif`                    | connecteur     | Lire « ou » comme exclusif.                                  | B2-03-A1-06-COURS-CONNECTEURS     |
| `ou-compte-deux-fois`               | connecteur     | Additionner les deux conditions d'un « ou ».                 | B2-03-A1-06-COURS-CONNECTEURS     |
| `implication-lue-comme-equivalence` | connecteur     | Prendre la réciproque pour l'implication.                    | B2-03-A1-07-COURS-IMPLICATION     |
| `borne-stricte-large`               | proposition    | Confondre inégalité stricte et large.                        | B2-03-A1-07-COURS-IMPLICATION     |
| `et-traduit-par-ou`                 | connecteur     | Traduire une règle « et » par un « ou ».                     | B2-03-A1-08-EXEMPLE-TABLE         |
| `negation-comparaison`              | negation       | Nier une comparaison sans changer la largeur de l'inégalité. | B2-03-A2-02-COURS-NEGATION        |
| `negation-sans-morgan`              | negation       | Nier chaque condition sans échanger « et » et « ou ».        | B2-03-A2-03-COURS-MORGAN          |
| `negation-pour-tout-en-aucun`       | quantificateur | Nier « tous » en « aucun ».                                  | B2-03-A3-02-COURS-PREDICATS       |
| `negation-il-existe-gardee`         | quantificateur | Garder « il existe » en niant.                               | B2-03-A3-02-COURS-PREDICATS       |
| `critere-sans-guillemets`           | tableur        | Écrire un texte ou un critère sans guillemets.               | B2-03-A3-03-COURS-QUANTIFICATEURS |
| `ordre-quantificateurs-inverse`     | quantificateur | Échanger l'ordre de « pour tout » et « il existe ».          | B2-03-A3-04-EXEMPLE-QUANTIF       |

### 5.10 Rappels espacés

Douze rappels : « ou » inclusif, contre-exemple d'une implication, borne, Morgan sur « et » et sur
« ou », négation d'une comparaison, négation de « tous » et de « il existe », ordre des
quantificateurs, guillemets du critère, compter « A ou B », clause `WHERE`. Obligatoires :
`b2-03-r-morgan-et` et `b2-03-r-pour-tout`.

## 8. Médias

### 8.1 Principe

Aucune image : les factures sont rendues par le rendu `table`, les feuilles par `fp-sheet`.

### 8.2 Catalogue des médias

Aucun média catalogué.

### 8.3 Sources des données

- Seize factures d'Atelier Rivage : données fictives créées pour le cours.
- Délai de paiement de 60 jours au plus et indemnité forfaitaire de 40 € : Code de commerce,
  articles L441-10 et D441-5 ; mentions de la facture : CGI, annexe II, article 242 nonies A ; détail
  dans `docs/donnees-b2-03-sources.md`.
- Procédure de visa : procédure interne fictive.
