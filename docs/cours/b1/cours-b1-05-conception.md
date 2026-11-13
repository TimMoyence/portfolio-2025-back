# B1-05 · Logique : conditions et contrôles — conception de référence (gabarit v3)

> Cahier des charges du cours B1-05 au gabarit v3 (`docs/cours/cours-gabarit-v3.md`) : cinquième cours de
> mathématiques des BTS CG 1re année. Le B1-04 fait foi pour la forme : 4 actes, un diagnostic, trois
> notions traitées chacune par un cycle réfléchir → comprendre → s'exercer, six écrans « pour
> comprendre » suivis chacun de sa page de cours, puis un rappel et la fiche mémo. Ce document ne
> contient aucun code exécutable ; toute divergence d'implémentation est un défaut de
> l'implémentation. Les tests `b1-05.cours.spec.ts` relisent ce document : § 3.1, titres publics du
> § 3, § 5.9, § 8.2.

| Rubrique    | Valeur                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Date        | 13 novembre 2026                                                                                        |
| Statut      | **Conception validée le 13 novembre 2026** : cinquième cours du plan BTS CG 1 (B1-01 → B1-12)           |
| Cours       | `b1-05-logique-conditions`                                                                              |
| Gabarit     | `v3`, déclaré par le contenu et contrôlé par les quatre règles `gabarit-*` de `verifierStructure`       |
| Niveau      | `B1` (`moteur.coursB1`)                                                                                 |
| Titre servi | « Logique : conditions et contrôles »                                                                   |
| Durée       | **121 minutes exactes** (somme des écrans), 4 actes de 45, 36, 32 et 8 minutes, plus 2 pauses de 15 min |
| Écrans      | **33**, dont 15 écrans catalogue (6 écrans « pour comprendre »)                                         |
| Sources     | Programme officiel du BTS CG ; données fictives                                                         |

---

## 0. Synthèse des décisions

Décisions de Tim du 13 novembre 2026, sur le cadrage :

- **Les tableaux sont dessinés par le code**, pas par une image : les tables de vérité des cinq
  connecteurs (A1-09) et le fichier des clients (A3-05) sont des rendus v2 `table`, calculés depuis
  les données et lisibles sur mobile. Les écrans « pour comprendre » restent des images dessinées,
  générées par Tim depuis `illustrations-b1-05/prompts.md`. Aucune évolution du front.
- **La forme du B1-04 : 121 minutes, actes de 45, 36, 32 et 8 minutes**, 33 écrans.
- **Le fil rouge continue : Partie Libre.** Théo a paramétré la remise de fidélité avec « ou » au
  lieu de « et » ; Inès Marchal veut des règles qu'on puisse écrire, nier et contrôler sur le
  fichier des clients. Toutes ces données sont fictives et signalées à l'écran.
- **Le tableur** : `SI`, `ET`, `OU`, `NON`, déjà dans le moteur de formules ; la recopie vers le bas
  du B1-01 resservit. Chaque cellule calcule un montant depuis le panier : le correcteur refuse une
  formule qui écrit en dur la valeur attendue.
- **L'accroche** : la page de titre des Lois de la pensée de George Boole (1854), déjà servie au
  B2-03.

## 1. Objectifs d'apprentissage et public

### 1.1 Rattachement au programme officiel

Module « Éléments de logique » du BTS CG, unité U3 – Mathématiques appliquées : propositions,
connecteurs logiques (non, et, ou, implication, équivalence), tables de vérité, négation d'une
proposition composée, prédicats, quantificateurs universel et existentiel ; usage raisonné du
tableur pour les tests conditionnels.

### 1.2 Objectifs du cours

À la fin de la séance, l'étudiant sait :

1. dire quand « non P », « P et Q », « P ou Q » sont vraies, avec la table de vérité ;
2. dire quand une implication est fausse, et qu'elle n'affirme pas sa réciproque ;
3. nier une règle à deux conditions par les lois de Morgan ;
4. écrire un prédicat et sa négation, borne comprise ;
5. nier « pour tout » et « il existe », et lire l'ordre des quantificateurs ;
6. traduire une règle commerciale au tableur avec `SI`, `ET` et `OU`.

### 1.3 Acquis des B1-01 à B1-04

| Acquis                            | Diagnostic | Réemploi dans le B1-05 |
| --------------------------------- | ---------- | ---------------------- |
| Comparaisons ≥, >, ≤, < (collège) | A1-01      | Prédicats (N2)         |
| Recopie vers le bas (B1-01)       | exercice 3 | Exercice 3             |
| Lecture d'un fichier en tableau   | A3-05      | Exercice 4             |

### 1.4 Public et conditions

BTS CG 1re année, 25 étudiants au plus, bacs STMG en majorité. Calculatrice inutile. Un poste par
étudiant pour l'exercice 3. Séance de 3 h 30 : pause de 15 minutes après l'acte 1 et après
l'acte 3.

## 2. Architecture

### 2.1 Les quatre actes

| Acte | Rôle                                        | Notion | Minutes |
| ---- | ------------------------------------------- | ------ | ------: |
| 1    | Diagnostic, puis connecteurs et implication | N1     |      45 |
| 2    | Nier une règle : Morgan et prédicats        | N2     |      36 |
| 3    | Quantificateurs : nier et lire l'ordre      | N3     |      32 |
| 4    | Rappel et fiche mémo                        | —      |       8 |

Pause 1 après le jalon A1-11 ; pause 2 après le jalon A3-07. Les pauses ne sont pas des écrans.

### 2.2 Le cycle d'une notion

Chaque notion suit : **Réfléchir** (mission, réflexion ou vote) → **Comprendre** (deux écrans « pour
comprendre » d'1 minute, chacun suivi de sa page `lesson` de 2 minutes ; un exemple guidé
`fp-worked` corrigé étape par étape) → **S'exercer** (exercices notés, corrigés sur place).

### 2.3 L'écran « pour comprendre »

Brique commune `moteur.pourComprendreDans(dossier)`, rendu v2 `image-left`, 1 minute, diffusion
catalogue, placé juste avant sa page et numéroté comme elle (`B1-05-A{acte}-{rang}-ENFANT-{SUJET}`).
À côté de l'image : un titre sans le nom de la notion, une phrase qui décrit l'image sans mot du
cours, la règle « En maths, on écrit : … » qui nomme la notion de la page suivante (connecteurs,
implication et équivalence, lois de Morgan, prédicat et négation, pour tout et il existe, ordre des
quantificateurs), puis trois ou quatre correspondances.

### 2.4 Diffusion

Catalogue : l'accroche, le dossier, les six écrans « pour comprendre », les six pages de cours et la
fiche mémo. Tout le reste est servi en séance, tables de vérité et fichier des clients compris.
Aucun écran catalogue ne porte une réponse d'exercice.

### 2.5 Notation et écriture

Propositions P et Q ; V pour vraie, F pour fausse. Implication P ⇒ Q, équivalence P ⇔ Q.
Quantificateurs ∀ (« pour tout ») et ∃ (« il existe »), toujours doublés de leur lecture en mots.
Au tableur, séparateur `;`, textes entre guillemets.

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B1-05-A{acte}-{rang}-{SLUG}`. Un écran « pour comprendre » porte le rang de la page
qu'il précède. « I » = interactif. « Q » = questions fermées notées portées par l'écran.

| Rang | Identifiant                       | Min | Brique · rendu               |  I  |   Q | Diffusion |
| ---: | --------------------------------- | --: | ---------------------------- | :-: | --: | --------- |
|    1 | B1-05-A1-01-DIAGNOSTIC-CONTRAIRE  |   4 | `fp-recall`                  |  I  |   1 | seance    |
|    2 | B1-05-A1-02-ACCROCHE              |   1 | `fp-story` · v2 `hero`       |     |   0 | catalogue |
|    3 | B1-05-A1-03-VOTE-DIAGNOSTIC       |   4 | `fp-vote`                    |  I  |   0 | seance    |
|    4 | B1-05-A1-04-DOSSIER               |   2 | `fp-story` · v2 `table`      |     |   0 | catalogue |
|    5 | B1-05-A1-05-MISSION               |   6 | `fp-pro`                     |  I  |   0 | seance    |
|    6 | B1-05-A1-06-ENFANT-SERRURES       |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    7 | B1-05-A1-06-COURS-CONNECTEURS     |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|    8 | B1-05-A1-07-ENFANT-PLUIE          |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|    9 | B1-05-A1-07-COURS-IMPLICATION     |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   10 | B1-05-A1-08-EXEMPLE-ANGERS        |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   11 | B1-05-A1-09-TABLES-DE-VERITE      |   1 | `fp-story` · v2 `table`      |     |   0 | seance    |
|   12 | B1-05-A1-10-ATELIER-CONNECTEURS   |  14 | `questionnaire`              |  I  |   4 | seance    |
|   13 | B1-05-A1-11-JALON                 |   1 | `fp-pulse`                   |     |   0 | seance    |
|   14 | B1-05-A2-01-REFLEXION-CONTRAIRE   |   5 | `fp-story` · v2 `reflection` |  I  |   0 | seance    |
|   15 | B1-05-A2-02-ENFANT-PORTILLON      |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   16 | B1-05-A2-02-COURS-MORGAN          |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   17 | B1-05-A2-03-ENFANT-TOISE          |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   18 | B1-05-A2-03-COURS-PREDICATS       |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   19 | B1-05-A2-04-EXEMPLE-PRIME         |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   20 | B1-05-A2-05-ATELIER-NEGATIONS     |   8 | `questionnaire`              |  I  |   4 | seance    |
|   21 | B1-05-A2-06-TABLEUR-CONTROLES     |  10 | `fp-sheet`                   |  I  |   0 | seance    |
|   22 | B1-05-A2-07-JALON                 |   1 | `fp-pulse`                   |     |   0 | seance    |
|   23 | B1-05-A3-01-VOTE-QUANTIFICATEURS  |   5 | `fp-vote`                    |  I  |   0 | seance    |
|   24 | B1-05-A3-02-ENFANT-PANIER         |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   25 | B1-05-A3-02-COURS-QUANTIFICATEURS |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   26 | B1-05-A3-03-ENFANT-CLES           |   1 | `fp-story` · v2 `image-left` |     |   0 | catalogue |
|   27 | B1-05-A3-03-COURS-ORDRE           |   2 | `fp-story` · v2 `lesson`     |     |   0 | catalogue |
|   28 | B1-05-A3-04-EXEMPLE-STOCK         |   6 | `fp-worked`                  |  I  |   0 | seance    |
|   29 | B1-05-A3-05-FICHIER-CLIENTS       |   1 | `fp-story` · v2 `table`      |     |   0 | seance    |
|   30 | B1-05-A3-06-ATELIER-CLIENTS       |  13 | `questionnaire`              |  I  |   5 | seance    |
|   31 | B1-05-A3-07-JALON                 |   1 | `fp-pulse`                   |     |   0 | seance    |
|   32 | B1-05-A4-01-RAPPEL                |   6 | `fp-spaced`                  |  I  |   0 | seance    |
|   33 | B1-05-A4-02-FICHE-MEMO            |   2 | `fp-story` · v2 `grid`       |     |   0 | catalogue |

Rythme : 93 minutes interactives, 28 d'exposition (jalons compris), exposition continue de 6 minutes
au plus. Somme : 45 + 36 + 32 + 8 = 121.

### 3.2 Acte 1 — Diagnostic, puis connecteurs et implication (45 min)

#### A1-01 · `B1-05-A1-01-DIAGNOSTIC-CONTRAIRE` — 4 min · `fp-recall` · séance

- Titre public : « Diagnostic : le contraire d’une condition »
- `b1-05-a1-diagnostic-contraire` : « Quel est le contraire de panier ≥ 50 € ? » Bonne : panier
  < 50 € ; piège panier ≤ 50 € (`negation-comparaison`).

#### A1-02 · `B1-05-A1-02-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Logique : conditions et contrôles »
- Fond : la page de titre des Lois de la pensée de George Boole, 1854.

#### A1-03 · `B1-05-A1-03-VOTE-DIAGNOSTIC` — 4 min · `fp-vote` · séance

- Titre public : « Vote : « ou » et « si… alors » »
- `b1-05-a1-vote-ou` : le stage ouvert aux BTS ou aux alternants ; Inès, les deux, peut s'inscrire
  (`ou-lu-exclusif`).
- `b1-05-a1-vote-si-alors` : « s'il pleut, le tournoi est annulé » ; tournoi annulé ne prouve pas
  la pluie (`implication-lue-comme-equivalence`).

#### A1-04 · `B1-05-A1-04-DOSSIER` — 2 min · v2 `table` · catalogue

- Titre public : « Les règles commerciales de Partie Libre »
- Lignes : l'entreprise ; la remise de fidélité (10 % du panier si fidèle et panier ≥ 50 €) ; la
  livraison (offerte si panier ≥ 60 € ou abonné au club) ; le contrôle (« si abonné, alors
  livraison offerte ») ; la question d'Inès. Note : données fictives.

#### A1-05 · `B1-05-A1-05-MISSION` — 6 min · `fp-pro` · séance

- Titre public : « Votre mission : une règle mal écrite »
- Situation : Théo a saisi « fidèle ou panier ≥ 50 € » ; des clients jamais venus ont eu la remise.
- Questions libres : `:remise`, `:livraison`, `:controle`.

#### A1-06 · `B1-05-A1-06-ENFANT-SERRURES` — 1 min · v2 `image-left` · catalogue

- Titre public : « Deux clés ou deux portes »
- Correspondances : les deux cadenas → « P et Q » ; les deux portes ouvertes → « P ou Q » ; l'enfant
  passé par les deux portes → « ou » reste vrai quand les deux le sont. Image
  `serrures-portes.webp`.

#### A1-06 · `B1-05-A1-06-COURS-CONNECTEURS` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : et, ou, non »
- Page 1 sur 2. Proposition, connecteurs et table de vérité ; exemple pour débuter : la sortie de
  Léa ; méthode « « Ou » accepte les deux ».

#### A1-07 · `B1-05-A1-07-ENFANT-PLUIE` — 1 min · v2 `image-left` · catalogue

- Titre public : « Le chemin mouillé »
- Correspondances : la pluie → P ; le chemin mouillé → Q ; le chemin mouillé au soleil → P fausse,
  Q vraie ; le tuyau → la réciproque n'est pas affirmée. Image `pluie-arrosoir.webp`.

#### A1-07 · `B1-05-A1-07-COURS-IMPLICATION` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : implication et équivalence »
- Page 2 sur 2. P ⇒ Q fausse seulement si P vraie et Q fausse ; P ⇔ Q ; exemple pour débuter : la
  carte d'électrice de Léa ; méthode « Un seul cas faux ».

#### A1-08 · `B1-05-A1-08-EXEMPLE-ANGERS` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : la carte cadeau d’Angers »
- Carte cadeau si trois jeux achetés et inscription à la lettre. Étapes `propositions`, `et`, `ou`,
  `implication`, `reciproque`.

#### A1-09 · `B1-05-A1-09-TABLES-DE-VERITE` — 1 min · v2 `table` · séance

- Titre public : « Les tables de vérité des cinq connecteurs »
- Quatre lignes VV, VF, FV, FF ; colonnes P, Q, non P, P et Q, P ou Q, P ⇒ Q, P ⇔ Q, calculées par
  le code.

#### A1-10 · `B1-05-A1-10-ATELIER-CONNECTEURS` — 14 min · `questionnaire` · séance

- Titre public : « Exercice 1 — Les règles appliquées à quatre clients »
- Temps : réflexion 2 min · travail 9 min · correction 3 min.
- Votes notés `b1-05-a1-remise-chloe` (`borne-stricte-large`), `b1-05-a1-livraison-farid`
  (`ou-lu-exclusif`), `b1-05-a1-implication-hugo` (`implication-fausse-si-premisse-fausse`),
  `b1-05-a1-reciproque-ana` (`implication-lue-comme-equivalence`).

#### A1-11 · `B1-05-A1-11-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 1 : lire une règle à deux conditions »
- Puis pause de 15 minutes.

### 3.3 Acte 2 — Nier une règle : Morgan et prédicats (36 min)

#### A2-01 · `B1-05-A2-01-REFLEXION-CONTRAIRE` — 5 min · v2 `reflection` · séance

- Titre public : « Réfléchir : qui paie sa livraison ? »
- Théo écrit « panier < 60 € ou non abonné ». Attendu : non, un abonné à 30 € le vérifie ; le
  contraire est « panier < 60 € et non abonné ».

#### A2-02 · `B1-05-A2-02-ENFANT-PORTILLON` — 1 min · v2 `image-left` · catalogue

- Titre public : « Le billet et le casque »
- Correspondances : entrer → « billet et casque » ; rester dehors → « pas de billet ou pas de
  casque » ; les trois refusés → les trois cas du « ou ». Image `portillon-casque.webp`.

#### A2-02 · `B1-05-A2-02-COURS-MORGAN` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : les lois de Morgan »
- Page 1 sur 2. non (P et Q) = non P ou non Q ; non (P ou Q) = non P et non Q ; au tableur ;
  exemple pour débuter : la sortie de Léa ; méthode « Nier, puis échanger ».

#### A2-03 · `B1-05-A2-03-ENFANT-TOISE` — 1 min · v2 `image-left` · catalogue

- Titre public : « Sous la barre de la girafe »
- Correspondances : la barre → la borne ; toucher ou dépasser → « x ≥ 120 » ; l'enfant pile à la
  barre → x = 120 vérifie P(x) ; le plus petit → « x < 120 ». Image `toise-manege.webp`.

#### A2-03 · `B1-05-A2-03-COURS-PREDICATS` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : prédicats et négation »
- Page 2 sur 2. Prédicat P(x), négation d'une comparaison ; exemple pour débuter : la majorité de
  Léa ; méthode « La borne change de camp ».

#### A2-04 · `B1-05-A2-04-EXEMPLE-PRIME` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : la prime des animateurs »
- Prime si au moins 20 soirées ou note d'au moins 4. Étapes `propositions`, `negations`, `morgan`,
  `borne`, `tableur`.

#### A2-05 · `B1-05-A2-05-ATELIER-NEGATIONS` — 8 min · `questionnaire` · séance

- Titre public : « Exercice 2 — Le contraire des règles »
- Temps : réflexion 2 min · travail 4 min · correction 2 min.
- Votes notés `b1-05-a2-contraire-livraison`, `b1-05-a2-contraire-remise`, `b1-05-a2-predicat`,
  `b1-05-a2-non-et-tableur` (§ 5.2).

#### A2-06 · `B1-05-A2-06-TABLEUR-CONTROLES` — 10 min · `fp-sheet` · séance

- Titre public : « Exercice 3 — Les contrôles des commandes au tableur »
- Temps : réflexion 2 min · travail 6 min · correction 2 min.
- Feuille de 7 lignes sur 6 colonnes (§ 5.1). E2 `=SI(ET(B2="oui";C2>=50);C2/10;0)`,
  F2 `=SI(ET(C2<60;D2="non");C2-E2+6;C2-E2)`, recopiées vers le bas jusqu'à la ligne 7.

#### A2-07 · `B1-05-A2-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : nier une règle »

### 3.4 Acte 3 — Quantificateurs : nier et lire l'ordre (32 min)

#### A3-01 · `B1-05-A3-01-VOTE-QUANTIFICATEURS` — 5 min · `fp-vote` · séance

- Titre public : « Vote : tous, au moins un »
- `b1-05-a3-vote-tous` : un seul jeu en rupture contredit « tous en stock »
  (`negation-pour-tout-en-aucun`). `b1-05-a3-vote-ordre` : « chaque table a un animateur » contre
  « un animateur pour toutes les tables » (`ordre-quantificateurs-inverse`).

#### A3-02 · `B1-05-A3-02-ENFANT-PANIER` — 1 min · v2 `image-left` · catalogue

- Titre public : « Une pomme dans le panier »
- Correspondances : « toutes les pommes sont belles » → pour tout x, P(x) ; la pomme abîmée → un
  contre-exemple ; une pomme suffit → il existe x tel que non P(x). Image `panier-pommes.webp`.

#### A3-02 · `B1-05-A3-02-COURS-QUANTIFICATEURS` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : pour tout, il existe »
- Page 1 sur 2. ∀ et ∃, leurs négations ; exemple pour débuter : les notes de Léa ; méthode « Un
  contre-exemple suffit ».

#### A3-03 · `B1-05-A3-03-ENFANT-CLES` — 1 min · v2 `image-left` · catalogue

- Titre public : « Une clé chacun ou une clé pour tous »
- Correspondances : une clé par casier → pour tout casier, il existe une clé ; la clé dorée → il
  existe une clé pour tous les casiers ; les deux scènes → les mêmes mots, dans un autre ordre.
  Image `cles-cadenas.webp`.

#### A3-03 · `B1-05-A3-03-COURS-ORDRE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : l’ordre des quantificateurs »
- Page 2 sur 2. « ∃y, ∀x » entraîne « ∀x, ∃y », pas l'inverse ; exemple pour débuter : les tuteurs
  de la classe ; méthode « Le second dépend du premier ».

#### A3-04 · `B1-05-A3-04-EXEMPLE-STOCK` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : le stock du bar de Tours »
- Stocks 4, 0, 7, 3, 9. Étapes `pour-tout`, `negation-pour-tout`, `il-existe`,
  `negation-il-existe`, `ordre`.

#### A3-05 · `B1-05-A3-05-FICHIER-CLIENTS` — 1 min · v2 `table` · séance

- Titre public : « Le fichier des clients de la boutique en ligne »
- Les huit clients (§ 5.3), fidélité, panier, abonnement, calculés par le code.

#### A3-06 · `B1-05-A3-06-ATELIER-CLIENTS` — 13 min · `questionnaire` · séance

- Titre public : « Exercice 4 — Contrôler le fichier des clients »
- Temps : réflexion 2 min · travail 8 min · correction 3 min.
- Renvoi au fichier A3-05. Questions `b1-05-a3-contre-exemples`, `b1-05-a3-livraison`
  (numériques), `b1-05-a3-negation-tous`, `b1-05-a3-negation-existe`, `b1-05-a3-ordre` (votes
  notés) (§ 5.3).

#### A3-07 · `B1-05-A3-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 3 : contrôler avec des quantificateurs »
- Puis pause de 15 minutes.

### 3.5 Acte 4 — Rappel et fiche mémo (8 min)

#### A4-01 · `B1-05-A4-01-RAPPEL` — 6 min · `fp-spaced` · séance

- Titre public : « Rappel : de mémoire, sans vos notes »
- Les douze questions de la banque (§ 5.10) sont obligatoires.

#### A4-02 · `B1-05-A4-02-FICHE-MEMO` — 2 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : conditions et contrôles »
- Neuf cartes et le référentiel (`REFERENTIEL_DU_BTS_CG`).

## 4. Mode papier

Le livret reprend, dans l'ordre des écrans, les écrans « pour comprendre », les traces écrites, les
énoncés et un cadre de réponse par question. Les tables de vérité et le fichier des clients sont
imprimés. Les formules de l'exercice 3 s'écrivent sur la copie avec la grille des cellules.

## 5. Contenus

### 5.1 La feuille de l'exercice 3

| Client | Fidèle | Panier (€) | Abonné | Remise E (€) | Net à payer F (€) |
| ------ | ------ | ---------: | ------ | -----------: | ----------------: |
| Léo    | oui    |         50 | non    |            5 |                51 |
| Maya   | non    |         90 | non    |            0 |                90 |
| Noé    | oui    |         48 | oui    |            0 |                48 |
| Lina   | non    |         61 | oui    |            0 |                61 |
| Paul   | oui    |         60 | non    |            6 |                54 |
| Rose   | non    |         30 | non    |            0 |                36 |

Le net à payer est le panier moins la remise, plus 6 € de port si la livraison n'est pas offerte :
chaque cellule calcule depuis le panier, et aucune valeur attendue n'égale un nombre écrit dans sa
formule. Pièges de E : `OU` au lieu de `ET` (Maya 9, Noé 4,8, Lina 6,1 ; `et-traduit-par-ou`) ;
`>` au lieu de `>=` (Léo 0 ; `borne-stricte-large`). Piège de F : le contraire sans Morgan,
`OU(C2<60;D2="non")` (Maya 96, Noé 54 ; `negation-sans-morgan`). Chez Paul, à 60 € pile, ce
contraire et l'erreur de borne `C2<=60` donnent tous deux 60 : la cellule est refusée sans confusion
nommée, car aucune des deux n'y est sûre. Les bornes sont éprouvées
par les paniers pile : Léo à 50 € refuse `C2>50`, Noé à 48 € refuse un seuil de remise pris entre 43
et 48 €, Paul à 60 € refuse `C2<=60`.

### 5.2 Exercice 2

Contraire de « panier ≥ 60 € ou abonné » : « panier < 60 € et non abonné » ; de « fidèle et panier
≥ 50 € » : « non fidèle ou panier < 50 € » ; de « p > 30 » : « p ≤ 30 » ; `NON(ET(B2="oui";C2>=50))`
équivaut à `OU(B2<>"oui";C2<50)`.

### 5.3 Exercice 4, le fichier des clients

| Client | Fidèle | Panier (€) | Abonné |
| ------ | ------ | ---------: | ------ |
| Ana    | oui    |         72 | non    |
| Bilal  | non    |         85 | oui    |
| Chloé  | oui    |         50 | non    |
| David  | oui    |         38 | oui    |
| Emma   | non    |         45 | non    |
| Farid  | oui    |         64 | oui    |
| Gaël   | non    |         55 | non    |
| Hugo   | oui    |         49 | non    |

- « Si le panier atteint 50 €, alors le client est fidèle » : 2 contre-exemples, Bilal et Gaël
  (pièges : 3 non fidèles, `implication-fausse-si-premisse-fausse` ; 4 hors équivalence,
  `implication-lue-comme-equivalence`).
- Livraisons offertes : 4, Ana, Bilal, David, Farid (pièges : 6 en additionnant,
  `ou-compte-deux-fois` ; 2 en « ou » exclusif, `ou-lu-exclusif`).
- Le contraire de « tous les abonnés sont fidèles » : au moins un abonné n'est pas fidèle (Bilal).
- « Pour tout fidèle, il existe un client au panier plus grand » est vraie (Bilal, 85 €) ; « il
  existe un fidèle dont le panier dépasse celui de tous » est fausse.

### 5.9 Concepts, confusions et remédiations

**Concepts** : `proposition`, `connecteur`, `negation`, `quantificateur`, `tableur` (tous déjà dans
la banque). **Confusions** : `implication-fausse-si-premisse-fausse` est ajoutée à la banque ; les
autres existent.

| Identifiant                             | Concept        | Libellé court                            | Remédiation                       |
| --------------------------------------- | -------------- | ---------------------------------------- | --------------------------------- |
| `ou-lu-exclusif`                        | connecteur     | Exclure le cas où les deux sont vraies.  | B1-05-A1-06-COURS-CONNECTEURS     |
| `et-traduit-par-ou`                     | connecteur     | Écrire « ou » pour « et ».               | B1-05-A1-06-COURS-CONNECTEURS     |
| `ou-compte-deux-fois`                   | connecteur     | Compter deux fois les deux conditions.   | B1-05-A1-06-COURS-CONNECTEURS     |
| `borne-stricte-large`                   | proposition    | Confondre ≥ et >.                        | B1-05-A1-06-COURS-CONNECTEURS     |
| `implication-lue-comme-equivalence`     | connecteur     | Lire la réciproque dans l'implication.   | B1-05-A1-07-COURS-IMPLICATION     |
| `implication-fausse-si-premisse-fausse` | connecteur     | Juger fausse une implication à P fausse. | B1-05-A1-07-COURS-IMPLICATION     |
| `negation-sans-morgan`                  | negation       | Nier sans échanger « et » et « ou ».     | B1-05-A2-02-COURS-MORGAN          |
| `negation-comparaison`                  | negation       | Garder la borne du même côté.            | B1-05-A2-03-COURS-PREDICATS       |
| `negation-pour-tout-en-aucun`           | quantificateur | Nier « tous » par « aucun ».             | B1-05-A3-02-COURS-QUANTIFICATEURS |
| `negation-il-existe-gardee`             | quantificateur | Garder « il existe » en niant.           | B1-05-A3-02-COURS-QUANTIFICATEURS |
| `ordre-quantificateurs-inverse`         | quantificateur | Échanger ∀ et ∃ sans changer le sens.    | B1-05-A3-03-COURS-ORDRE           |

### 5.10 Rappels espacés

Douze rappels, tous obligatoires, écrits dans `b1-05.acte-4.ts` : « et », « ou », compter un « ou »,
implication à P fausse, réciproque, borne, Morgan sur « et », Morgan au tableur, négation d'une
comparaison, négation de « tous », négation de « il existe », ordre des quantificateurs.

## 6. Moteur

- **Aucune évolution du moteur.** `SI`, `ET`, `OU` et `NON` sont déjà dans le moteur de formules
  (`Formule.ts`). Le rendu `table` est servi et rendu par le front. La recopie vers le bas vient du
  B1-01. Une confusion est ajoutée à la banque : `implication-fausse-si-premisse-fausse`.

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
`illustrations-b1-05/prompts.md`. Les tables sont dessinées par le code. La gravure de l'accroche,
déjà servie au B2-03, complète le catalogue.

### 8.2 Catalogue des médias

Chaque PNG d'origine (1 536 × 1 024 px) est converti en WebP à la même taille et servi depuis
`/assets/cours/b1-05/v1/`. Le catalogue est stocké avec le cours (`Cours.medias`) et contrôlé par la
règle `media-sans-licence`.

| Id  | Écran | Fichier source (page)                                                                                                          | Original                             | Auteur, date                                                | Licence        | Dérivé servi                       | Attribution affichée                                                                                 |
| --- | ----- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ----------------------------------------------------------- | -------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| M1  | A1-06 | production propre du cours                                                                                                     | PNG 1 536 × 1 024 px                 | Asili Design, 2026                                          | CC BY-SA 4.0   | `serrures-portes.webp`             | « Deux clés ou deux portes · Asili Design, 2026 · CC BY-SA 4.0 »                                     |
| M2  | A1-07 | production propre du cours                                                                                                     | PNG 1 536 × 1 024 px                 | Asili Design, 2026                                          | CC BY-SA 4.0   | `pluie-arrosoir.webp`              | « Le chemin mouillé · Asili Design, 2026 · CC BY-SA 4.0 »                                            |
| M3  | A2-02 | production propre du cours                                                                                                     | PNG 1 536 × 1 024 px                 | Asili Design, 2026                                          | CC BY-SA 4.0   | `portillon-casque.webp`            | « Le billet et le casque · Asili Design, 2026 · CC BY-SA 4.0 »                                       |
| M4  | A2-03 | production propre du cours                                                                                                     | PNG 1 536 × 1 024 px                 | Asili Design, 2026                                          | CC BY-SA 4.0   | `toise-manege.webp`                | « Sous la barre de la girafe · Asili Design, 2026 · CC BY-SA 4.0 »                                   |
| M5  | A3-02 | production propre du cours                                                                                                     | PNG 1 536 × 1 024 px                 | Asili Design, 2026                                          | CC BY-SA 4.0   | `panier-pommes.webp`               | « Une pomme dans le panier · Asili Design, 2026 · CC BY-SA 4.0 »                                     |
| M6  | A3-03 | production propre du cours                                                                                                     | PNG 1 536 × 1 024 px                 | Asili Design, 2026                                          | CC BY-SA 4.0   | `cles-cadenas.webp`                | « Une clé chacun ou une clé pour tous · Asili Design, 2026 · CC BY-SA 4.0 »                          |
| M7  | A1-02 | https://commons.wikimedia.org/wiki/File:An_Investigation_of_the_Laws_of_Thought_(1854,_Boole,_investigationofl00boolrich).djvu | DjVu 2 620 × 4 190 px, page de titre | George Boole, An Investigation of the Laws of Thought, 1854 | domaine public | `boole-lois-de-la-pensee-1854.jpg` | « George Boole, An Investigation of the Laws of Thought, 1854 · Wikimedia Commons (domaine public) » |

### 8.3 Briefs des images

PNG 1 536 × 1 024 px, dessin à la main, fond clair, couleurs pastel, **aucun texte dans l'image** :
les phrases sont à l'écran, à côté. Une seule scène, lisible projetée au fond d'une salle.

1. **Deux clés ou deux portes** (`serrures-portes.webp`, avant A1-06) : à gauche, une porte à deux
   cadenas, rouge et bleu, un enfant tient une clé de chaque couleur ; à droite, une salle à deux
   portes ouvertes, trois enfants y entrent.
2. **Le chemin mouillé** (`pluie-arrosoir.webp`, avant A1-07) : à gauche, la pluie sur un jardin au
   chemin mouillé ; à droite, grand soleil, le même chemin mouillé par un tuyau d'arrosage.
3. **Le billet et le casque** (`portillon-casque.webp`, avant A2-02) : l'entrée d'un karting ; un
   enfant avec billet et casque entre ; trois refusés : sans casque, sans billet, sans rien.
4. **Sous la barre de la girafe** (`toise-manege.webp`, avant A2-03) : une toise en forme de girafe ;
   un enfant dépasse la barre, un autre la touche pile, un troisième est trop petit.
5. **Une pomme dans le panier** (`panier-pommes.webp`, avant A3-02) : un panier de pommes rouges,
   une seule brune ; un enfant la montre du doigt.
6. **Une clé chacun ou une clé pour tous** (`cles-cadenas.webp`, avant A3-03) : à gauche, quatre
   casiers et quatre enfants, chacun sa clé ; à droite, un seul enfant et une clé dorée.

### 8.4 Sources des données

- Partie Libre et tous les exemples : données fictives créées pour ce cours.
- Accroche : page de titre de George Boole, 1854, domaine public (Wikimedia Commons).
