# B1-02 · Évolutions : taux, coefficients, indices — conception de référence (gabarit v3)

> Cahier des charges du cours B1-02 au gabarit v3 (`docs/cours/cours-gabarit-v3.md`) : deuxième cours de
> mathématiques des BTS CG 1re année. Le B1-01 fait foi pour la forme : 4 actes, 121 minutes, un
> diagnostic, trois notions traitées chacune par un cycle réfléchir → comprendre → s'exercer, puis
> un rappel et la fiche mémo. Ce document ne contient aucun code exécutable ; toute divergence
> d'implémentation est un défaut de l'implémentation. Les tests `b1-02.cours.spec.ts` relisent ce
> document : § 3.1, titres publics du § 3, § 5.9, § 8.2.

| Rubrique    | Valeur                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| Date        | 30 octobre 2026                                                                                            |
| Statut      | **Conception validée le 30 octobre 2026** : deuxième cours du plan BTS CG 1 (B1-01 → B1-12)                |
| Cours       | `b1-02-evolutions-coefficients-indices`                                                                    |
| Gabarit     | `v3`, déclaré par le contenu et contrôlé par les quatre règles `gabarit-*` de `verifierStructure`          |
| Niveau      | `B1` (`moteur.coursB1`)                                                                                    |
| Titre servi | « Évolutions : taux, coefficients, indices »                                                               |
| Durée       | **121 minutes exactes** (somme des écrans), 4 actes de 49, 36, 28 et 8 minutes, plus 2 pauses de 15 min    |
| Écrans      | **32**, dont 15 écrans catalogue (6 illustrations)                                                         |
| Sources     | Programme officiel du BTS CG ; sujet 26CGMATPO (Polynésie 2026), exercice 1, partie B ; CNIL, rapport 2024 |

---

## 0. Synthèse des décisions

- **Le B1-01 fait foi.** Même déroulé, mêmes durées, mêmes consignes de temps : pas de mini-situation,
  pas de défi IA. Le cours se clôt sur un rappel de douze questions et la fiche mémo.
- **Le fil rouge continue : Partie Libre.** Inès Marchal prépare la grille de prix 2027 et l'alternant
  vérifie les calculs de Théo. Toutes ces données sont fictives et signalées à l'écran.
- **Trois notions** : taux, coefficient, HT ↔ TTC et remises (N1) ; évolutions successives et
  évolution réciproque (N2) ; indice base 100 et taux moyen (N3).
- **Le dernier exercice est une annale.** Exercice 5 : le tableau en ligne du sujet de Polynésie 2026,
  sur les sanctions de la CNIL, données réelles sourcées, énoncé réécrit. La formule de C3 se
  recopie vers la droite : le tableur gagne le bouton « Recopier vers la droite », sur toute feuille.
- **Le tableur** : taux recopié vers le bas (exercice 2), indice recopié vers la droite et
  `PUISSANCE` (exercice 5). Deux gestes et une fonction nouvelle, sous le plafond de cinq.
- **Six illustrations.** Chaque page de 2 minutes suit 1 minute sur l'infographie de son exemple pour
  débuter (§ 8), durée inchangée.

## 1. Objectifs d'apprentissage et public

### 1.1 Rattachement au programme officiel

Module « Information chiffrée » du BTS CG, unité U3 – Mathématiques appliquées. Le cours prépare la
situation de CCF n° 1 : le sujet de Polynésie 2026 pose exactement ce tableau, cette formule et ce
taux moyen. Le B1-01 a posé le taux d'évolution ; le B1-02 le transforme en coefficient.

### 1.2 Objectifs du cours

À la fin de la séance, l'étudiant sait :

1. calculer un taux d'évolution et passer du taux au coefficient multiplicateur ;
2. retrouver une valeur d'arrivée (× c) ou de départ (÷ c) ;
3. passer du HT au TTC et retour, appliquer une remise ;
4. calculer le coefficient et le taux global d'évolutions successives ;
5. calculer le taux d'une évolution réciproque ;
6. calculer et lire un indice base 100 ;
7. calculer un taux annuel moyen avec une puissance 1/n ;
8. écrire au tableur un taux et un indice recopiables, et `PUISSANCE`.

### 1.3 Acquis du B1-01

| Acquis                                 | Diagnostic | Réemploi dans le B1-02 |
| -------------------------------------- | ---------- | ---------------------- |
| Taux d'évolution, base de départ       | A1-01      | Toute la séance        |
| Pourcentage et décimal                 | A1-03      | Coefficients (N1)      |
| `SOMME`, `ARRONDI`, recopie, total `$` | exercice 2 | Exercices 2 et 5       |

### 1.4 Public et conditions

BTS CG 1re année, 25 étudiants au plus, bacs STMG en majorité. Calculatrice autorisée sauf au
diagnostic et à la mission. Un poste par étudiant ou le livret papier. Séance de 3 h 30 : pause de
15 minutes après l'acte 1 et après l'acte 3.

## 2. Architecture

### 2.1 Les quatre actes

| Acte | Rôle                                          | Notion | Minutes |
| ---- | --------------------------------------------- | ------ | ------: |
| 1    | Diagnostic, puis multiplier au lieu d'ajouter | N1     |      49 |
| 2    | Plusieurs évolutions, et le retour            | N2     |      36 |
| 3    | Indice, taux moyen et annale                  | N3     |      28 |
| 4    | Rappel et fiche mémo                          | —      |       8 |

Pause 1 après le jalon A1-11 ; pause 2 après le jalon A3-06. Les pauses ne sont pas des écrans.

### 2.2 Le cycle d'une notion

Chaque notion suit : **Réfléchir** (mission, réflexion ou vote) → **Comprendre** (deux pages `lesson`
de 2 minutes, chacune précédée d'1 minute sur son illustration, puis un exemple guidé `fp-worked`
corrigé étape par étape) → **S'exercer** (exercices notés, corrigés sur place). Chaque page tient en une définition de deux lignes, des formules une par
ligne, un exemple pour débuter hors du dossier, une méthode de trois ou quatre lignes titrée par un moyen
mnémotechnique. Pas d'encadré « Au CCF ».

### 2.3 Diffusion

Catalogue : l'accroche, le dossier, les six pages de trace écrite, leurs six illustrations et la
fiche mémo. Tout le reste est servi en séance. Aucun écran catalogue ne porte une réponse d'exercice.

### 2.4 Notation et écriture

Taux en décimal dans les calculs (0,15), en pourcentage dans les phrases (+ 15 %). Une évolution
porte toujours son signe. Coefficient : c ; coefficient global : C. Un indice s'écrit sans unité.

## 3. Déroulé écran par écran

### 3.1 Vue d'ensemble

Identifiants : `B1-02-A{acte}-{rang}-{SLUG}`. Une illustration porte le rang de la page qu'elle
précède. « I » = interactif. « Q » = questions fermées notées portées par l'écran.

| Rang | Identifiant                      | Min | Brique · rendu                 |  I  |   Q | Diffusion |
| ---: | -------------------------------- | --: | ------------------------------ | :-: | --: | --------- |
|    1 | B1-02-A1-01-DIAGNOSTIC-TAUX      |   4 | `fp-recall`                    |  I  |   1 | seance    |
|    2 | B1-02-A1-02-ACCROCHE             |   1 | `fp-story` · v2 `hero`         |     |   0 | catalogue |
|    3 | B1-02-A1-03-VOTE-DIAGNOSTIC      |   4 | `fp-vote`                      |  I  |   0 | seance    |
|    4 | B1-02-A1-04-DOSSIER              |   2 | `fp-story` · v2 `table`        |     |   0 | catalogue |
|    5 | B1-02-A1-05-MISSION              |   6 | `fp-pro`                       |  I  |   0 | seance    |
|    6 | B1-02-A1-06-ILLUSTRATION-CINEMA  |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|    7 | B1-02-A1-06-COURS-COEFFICIENT    |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|    8 | B1-02-A1-07-ILLUSTRATION-CASQUE  |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|    9 | B1-02-A1-07-COURS-HT-TTC         |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   10 | B1-02-A1-08-EXEMPLE-JEU          |   6 | `fp-worked`                    |  I  |   0 | seance    |
|   11 | B1-02-A1-09-ATELIER-PRIX         |  10 | `questionnaire`                |  I  |   4 | seance    |
|   12 | B1-02-A1-10-TABLEUR-CA           |   9 | `fp-sheet`                     |  I  |   0 | seance    |
|   13 | B1-02-A1-11-JALON                |   1 | `fp-pulse`                     |     |   0 | seance    |
|   14 | B1-02-A2-01-REFLEXION-SOLDES     |   5 | `fp-story` · v2 `reflection`   |  I  |   0 | seance    |
|   15 | B1-02-A2-02-ILLUSTRATION-LOYER   |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   16 | B1-02-A2-02-COURS-SUCCESSIVES    |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   17 | B1-02-A2-03-ILLUSTRATION-VELO    |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   18 | B1-02-A2-03-COURS-RECIPROQUE     |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   19 | B1-02-A2-04-EXEMPLE-PROMO        |   6 | `fp-worked`                    |  I  |   0 | seance    |
|   20 | B1-02-A2-05-TABLEAU-PRIX         |   8 | `fp-table-build`               |  I  |   0 | seance    |
|   21 | B1-02-A2-06-ATELIER-RETOUR       |  10 | `questionnaire`                |  I  |   4 | seance    |
|   22 | B1-02-A2-07-JALON                |   1 | `fp-pulse`                     |     |   0 | seance    |
|   23 | B1-02-A3-01-VOTE-INDICES         |   5 | `fp-vote`                      |  I  |   0 | seance    |
|   24 | B1-02-A3-02-ILLUSTRATION-TICKET  |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   25 | B1-02-A3-02-COURS-INDICE         |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   26 | B1-02-A3-03-ILLUSTRATION-EPARGNE |   1 | `fp-story` · v2 `illustration` |     |   0 | catalogue |
|   27 | B1-02-A3-03-COURS-TAUX-MOYEN     |   2 | `fp-story` · v2 `lesson`       |     |   0 | catalogue |
|   28 | B1-02-A3-04-EXEMPLE-CLIENTS      |   6 | `fp-worked`                    |  I  |   0 | seance    |
|   29 | B1-02-A3-05-TABLEUR-CNIL         |  10 | `fp-sheet`                     |  I  |   0 | seance    |
|   30 | B1-02-A3-06-JALON                |   1 | `fp-pulse`                     |     |   0 | seance    |
|   31 | B1-02-A4-01-RAPPEL               |   6 | `fp-spaced`                    |  I  |   0 | seance    |
|   32 | B1-02-A4-02-FICHE-MEMO           |   2 | `fp-story` · v2 `grid`         |     |   0 | catalogue |

Rythme : 95 minutes interactives, 26 d'exposition (jalons compris), exposition continue de 6 minutes
au plus. Somme : 49 + 36 + 28 + 8 = 121.

### 3.2 Acte 1 — Diagnostic, puis multiplier au lieu d'ajouter (49 min)

#### A1-01 · `B1-02-A1-01-DIAGNOSTIC-TAUX` — 4 min · `fp-recall` · séance

- Titre public : « Diagnostic : un taux, sans calculatrice »
- `b1-02-a1-diagnostic-taux` : « Un abonnement passe de 60 € à 75 €. Quel est son taux d'évolution ? »
  Bonne : + 25 % ; pièges + 15 % (`ecart-absolu-au-lieu-du-taux`), + 20 % (`base-arrivee`).

#### A1-02 · `B1-02-A1-02-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Évolutions : multiplier, pas ajouter »
- Sous-titre : « Partie Libre revoit ses tarifs. Votre dossier : des hausses, de la TVA, des remises
  et un indice à lire. »
- Fond : le graphique de William Playfair, prix du blé et salaires de 1565 à 1821.

#### A1-03 · `B1-02-A1-03-VOTE-DIAGNOSTIC` — 4 min · `fp-vote` · séance

- Titre public : « Vote : par quel nombre multiplier ? »
- `b1-02-a1-vote-hausse` : « Un prix augmente de 5 %. Par quel nombre le multiplier ? » Bonne : 1,05 ;
  pièges 0,05 (`coefficient-confondu-avec-taux`), 1,5 (`taux-valeur-facteur-cent`).
- `b1-02-a1-vote-remise` : « Une remise de 30 % sur un prix : par quel nombre le multiplier ? » Bonne :
  0,70 ; pièges 0,30 (`coefficient-confondu-avec-taux`), 1,30 (`sens-de-variation`).

#### A1-04 · `B1-02-A1-04-DOSSIER` — 2 min · v2 `table` · catalogue

- Titre public : « Le dossier tarifs de Partie Libre »
- Lignes : l'entreprise ; le chiffre d'affaires HT par boutique (Nantes 184 puis 207, Angers 120
  puis 123, Tours 96 puis 92, Le Mans 80 puis 94, en milliers d'euros, 2025 puis 2026) ; la TVA à
  20 % ; la carte Pass Partie à 15 % de remise sur le prix TTC ; le fournisseur à + 8 % au 1er
  janvier 2027 ; la question d'Inès : « Quels coefficients pour la grille 2027 ? ». Note :
  « Données fictives Partie Libre, créées pour ce cours. »

#### A1-05 · `B1-02-A1-05-MISSION` — 6 min · `fp-pro` · séance

- Titre public : « Votre mission : vérifier la grille de prix »
- Situation : Inès demande de vérifier les calculs de Théo. Théo a écrit : « Une console à 180 € TTC,
  c'est 144 € HT : j'enlève 20 %. » et « Une manette à 60 € TTC coûte 45 € avec la remise de 15 %. »
- Questions libres : `:taux` (un jeu de 100 € à 112 € : taux et coefficient) ; `:ht` (144 € plus 20 %
  de TVA : que conclure ?) ; `:remise` (qu'a fait Théo pour la manette ?).

#### A1-06 · `B1-02-A1-06-ILLUSTRATION-CINEMA` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : multiplier, pas ajouter »
- Infographie M1 de l'exemple pour débuter : t = 2 ÷ 10 = + 20 %, c = 1,2 ; encadré − 20 % : 10 × 0,8 = 8 €.

#### A1-06 · `B1-02-A1-06-COURS-COEFFICIENT` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : taux et coefficient multiplicateur »
- Page 1 sur 2 : t = (V₂ − V₁) ÷ V₁, c = 1 + t ; exemple la place de cinéma (10 € → 12 €) ; méthode
  « Toujours le départ en bas », dont une ligne pour la formule arrondie et recopiée au tableur.

#### A1-07 · `B1-02-A1-07-ILLUSTRATION-CASQUE` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : aller, ×, retour, ÷ »
- Infographie M2 de l'exemple pour débuter : 30 € HT, 36 € TTC, × 1,20 et ÷ 1,20 ; barré 36 − 20 % = 28,80 €.

#### A1-07 · `B1-02-A1-07-COURS-HT-TTC` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : HT, TTC et remises »
- Page 2 sur 2 : TTC = HT × 1,20, HT = TTC ÷ 1,20, remise de r : × (1 − r) ; exemple le casque
  (30 € HT, 36 € TTC, − 10 % : 32,40 €) ; méthode « Aller : ×, retour : ÷ ».

#### A1-08 · `B1-02-A1-08-EXEMPLE-JEU` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : un jeu de société, de l’achat à la caisse »
- Énoncé : achat de 40 € à 46 € HT ; vente 75 € HT, TVA 20 % ; carte à − 15 %.
- Étapes (`b1-02-a1-exemple-jeu`) : `taux` 6 ÷ 40 = + 15 % ; `coefficient` 1,15 ; `ttc` 75 × 1,20 =
  90 € ; `piege` 90 ÷ 1,20 = 75 €, 90 × 0,80 = 72 € est faux ; `remise` 90 × 0,85 = 76,50 €.

#### A1-09 · `B1-02-A1-09-ATELIER-PRIX` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 1 — La nouvelle grille »
- Temps : réflexion 2 min · travail 6 min · correction 2 min.
- Consigne : un pack de cartes passe de 16 € à 18 € HT ; une manette vaut 60 € TTC, TVA 20 %.
- `b1-02-a1-taux-pack` : taux du pack, 12,5 % ; pièges 2 (`ecart-absolu-au-lieu-du-taux`), 11,1
  (`base-arrivee`).
- `b1-02-a1-coefficient` (vote) : hausse de 8 %, bonne 1,08 ; pièges 0,08
  (`coefficient-confondu-avec-taux`), 1,8 (`taux-valeur-facteur-cent`).
- `b1-02-a1-ht` : prix HT de la manette, 50 € ; pièges 48 (`tva-calculee-sur-ttc`), 72
  (`sens-de-variation`).
- `b1-02-a1-remise` : prix carte de la manette, 51 € ; pièges 45
  (`ecart-absolu-au-lieu-du-taux`), 9 (`coefficient-confondu-avec-taux`).

#### A1-10 · `B1-02-A1-10-TABLEUR-CA` — 9 min · `fp-sheet` · séance

- Titre public : « Exercice 2 — L’évolution du chiffre d’affaires au tableur »
- Temps : réflexion 2 min · travail 5 min · correction 2 min.
- Sept cellules : B6, C6 (`SOMME`) ; D2:D6 `=ARRONDI((C2-B2)/B2*100;1)` recopiée vers le bas : 12,5 ;
  2,5 ; − 4,2 ; 17,5 ; 7,5. Pièges du modèle : 11,1 (`base-arrivee`), 23
  (`ecart-absolu-au-lieu-du-taux`), 112,5 (`coefficient-confondu-avec-taux`).

#### A1-11 · `B1-02-A1-11-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 1 : du taux au coefficient »

### 3.3 Acte 2 — Plusieurs évolutions, et le retour (36 min)

#### A2-01 · `B1-02-A2-01-REFLEXION-SOLDES` — 5 min · v2 `reflection` · séance

- Titre public : « Réfléchir : + 10 %, puis − 10 % »
- `b1-02-a2-reflexion-soldes` : un jeu à 200 €, + 10 % puis − 10 %. Attendu : 200 × 1,10 × 0,90 =
  198 €, la baisse se calcule sur 220 €.

#### A2-02 · `B1-02-A2-02-ILLUSTRATION-LOYER` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : + 10 %, + 20 %, pas + 30 % »
- Infographie M3 de l'exemple pour débuter : 100, 110, 132 ; C = 1,32, soit + 32 % ; barré + 30 %.

#### A2-02 · `B1-02-A2-02-COURS-SUCCESSIVES` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : évolutions successives »
- Page 1 sur 2 : C = c₁ × c₂, taux global = C − 1 ; exemple le loyer (+ 10 %, + 20 %, + 32 %) ; méthode
  « Coefficients, jamais taux ».

#### A2-03 · `B1-02-A2-03-ILLUSTRATION-VELO` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : le retour n’a pas le même taux »
- Infographie M4 de l'exemple pour débuter : 200 € à 100 € par × 0,5, retour par × 2 ; barré + 50 % → 150 €.

#### A2-03 · `B1-02-A2-03-COURS-RECIPROQUE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : évolution réciproque »
- Page 2 sur 2 : c réciproque = 1 ÷ c ; exemple le vélo (− 50 %, + 100 %) ; méthode « Le retour n'a
  pas le même taux ».

#### A2-04 · `B1-02-A2-04-EXEMPLE-PROMO` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : hausse, puis promotion »
- Énoncé : un jeu à 80 €, + 25 % puis − 20 % ; un autre jeu de 50 € à 40 €.
- Étapes (`b1-02-a2-exemple-promo`) : `coefficients` ; `global` 1,25 × 0,80 = 1 ; `piege` + 5 % est
  faux ; `baisse` 40 ÷ 50 = 0,8 ; `reciproque` 1 ÷ 0,8 = 1,25, soit + 25 %.

#### A2-05 · `B1-02-A2-05-TABLEAU-PRIX` — 8 min · `fp-table-build` · séance

- Titre public : « Exercice 3 — Une hausse, puis des soldes »
- Temps : réflexion 1 min · travail 5 min · correction 2 min.
- Quatre lignes, prix de départ 120, 80, 60, 40 ; saisir le prix après + 20 % et après − 25 %.
  Attendus 144, 96, 72, 48 puis 108, 72, 54, 36. Synthèse `(totalSoldes / totalDepart - 1) * 100` :
  − 10 %.

#### A2-06 · `B1-02-A2-06-ATELIER-RETOUR` — 10 min · `questionnaire` · séance

- Titre public : « Exercice 4 — Deux hausses, un retour »
- Temps : réflexion 2 min · travail 6 min · correction 2 min.
- Consigne : jeux vidéo + 10 % puis + 5 % ; cartes à collectionner − 40 %.
- `b1-02-a2-coefficient-global` : 1,155 ; pièges 1,15 (`taux-successifs-additionnes`), 0,155
  (`coefficient-confondu-avec-taux`).
- `b1-02-a2-taux-global` : 15,5 % ; pièges 15 (`taux-successifs-additionnes`), 115,5
  (`coefficient-global-mal-interprete`).
- `b1-02-a2-phrase` (vote) : − 40 % puis + 40 % ; bonne « Il reste sous le prix de départ » ; piège
  « Il revient au prix de départ » (`hausse-baisse-symetriques`).
- `b1-02-a2-reciproque` : hausse pour revenir, 66,7 % ; pièges 40 (`reciproque-meme-taux`), 60
  (`sens-de-variation`).

#### A2-07 · `B1-02-A2-07-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 2 : enchaîner et revenir »

### 3.4 Acte 3 — Indice, taux moyen et annale (28 min)

#### A3-01 · `B1-02-A3-01-VOTE-INDICES` — 5 min · `fp-vote` · séance

- Titre public : « Vote : que dit un indice ? »
- `b1-02-a3-indice` : l'indice d'un prix vaut 130, base 100 en 2020. Bonne : + 30 % depuis 2020 ;
  pièges + 130 % (`indice-lu-comme-taux`), 130 € (`indice-lu-comme-valeur`).
- `b1-02-a3-moyen` : + 21 % en deux ans. Bonne : + 10 % par an ; piège + 10,5 % par an
  (`taux-moyen-arithmetique`).

#### A3-02 · `B1-02-A3-02-ILLUSTRATION-TICKET` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : ni un prix, ni un taux »
- Infographie M5 de l'exemple pour débuter : 2 € indice 100, 3 € indice 150 ; barrés 150 € et + 150 % ; encart tableur, formule en C3.

#### A3-02 · `B1-02-A3-02-COURS-INDICE` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : indice base 100 »
- Page 1 sur 2 : I = V ÷ V₀ × 100, taux depuis la base = I − 100 ; exemple le ticket de bus (2 € →
  3 €, 150) ; méthode « Ni un prix, ni un taux ».

#### A3-03 · `B1-02-A3-03-ILLUSTRATION-EPARGNE` — 1 min · v2 `illustration` · catalogue

- Titre public : « Illustration : la même hausse chaque année »
- Infographie M6 de l'exemple pour débuter : 100 €, 130 €, 169 €, × 1,3 deux fois ; barré 69 ÷ 2 = 34,5 % ; encart =PUISSANCE(1,69;1/2)-1.

#### A3-03 · `B1-02-A3-03-COURS-TAUX-MOYEN` — 2 min · v2 `lesson` · catalogue

- Titre public : « Cours : taux annuel moyen »
- Page 2 sur 2 : c moyen = C^(1/n), `PUISSANCE` ; exemple l'épargne (100 € → 169 € en 2 ans, + 30 %) ;
  méthode « n compte les évolutions ».

#### A3-04 · `B1-02-A3-04-EXEMPLE-CLIENTS` — 6 min · `fp-worked` · séance

- Titre public : « Exemple guidé : les clients du réseau »
- Énoncé : 2 000 clients en 2023, 2 300 en 2024, 2 900 en 2025, 3 456 en 2026.
- Étapes (`b1-02-a3-exemple-clients`) : `indice` 115 ; `lire` 145, + 45 % ; `global` 1,728 ;
  `moyen` 1,728^(1/3) = 1,2, + 20 % par an ; `piege` 72,8 ÷ 3 ≈ 24,3 % est faux.

#### A3-05 · `B1-02-A3-05-TABLEUR-CNIL` — 10 min · `fp-sheet` · séance

- Titre public : « Exercice 5 — Les sanctions de la CNIL »
- Temps : réflexion 2 min · travail 6 min · correction 2 min.
- Feuille de 7 lignes sur 5 colonnes, le tableau du sujet (§ 5.2). Six cellules : C3
  `=ARRONDI(C2/$B$2*100;1)` recopiée vers la droite ; B5, B6, B7 arrondies avec `ARRONDI`, B7 avec
  `PUISSANCE`. La consigne demande B2 pour la valeur de 2021 ; le correcteur accepte 18 écrit en dur
  et recopié (décision de Tim du 30 octobre), repris à l'oral. Données réelles, source citée.

#### A3-06 · `B1-02-A3-06-JALON` — 1 min · `fp-pulse` · séance

- Titre public : « Jalon 3 : indice et taux moyen »
- Puis pause de 15 minutes.

### 3.5 Acte 4 — Rappel et fiche mémo (8 min)

#### A4-01 · `B1-02-A4-01-RAPPEL` — 6 min · `fp-spaced` · séance

- Titre public : « Rappel : de mémoire, sans vos notes »
- Les douze questions de la banque (§ 5.10) sont obligatoires.

#### A4-02 · `B1-02-A4-02-FICHE-MEMO` — 2 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : évolutions, coefficients, indices »
- Neuf cartes et le référentiel (`REFERENTIEL_DU_BTS_CG`).

## 4. Mode papier

Le livret reprend, dans l'ordre des écrans, les traces écrites, les énoncés et un cadre de réponse par
question. Les votes se font à main levée, les formules s'écrivent sur la copie avec la grille des
cellules, le tableau de prix se remplit à la main.

## 5. Contenus

### 5.1 Les valeurs du dossier

| Boutique | CA 2025 (k€) | CA 2026 (k€) | Taux exact (%) | Taux arrondi (%) |
| -------- | -----------: | -----------: | -------------: | ---------------: |
| Nantes   |          184 |          207 |           12,5 |             12,5 |
| Angers   |          120 |          123 |            2,5 |              2,5 |
| Tours    |           96 |           92 |         − 4,17 |            − 4,2 |
| Le Mans  |           80 |           94 |           17,5 |             17,5 |
| Total    |          480 |          516 |            7,5 |              7,5 |

### 5.2 L'annale : sanctions de la CNIL

| Année     | 2021 |  2022 |  2023 |  2024 |
| --------- | ---: | ----: | ----: | ----: |
| Sanctions |   18 |    21 |    42 |    87 |
| Indice    |  100 | 116,7 | 233,3 | 483,3 |

Taux 2022-2024 : (87 − 21) ÷ 21 ≈ 314,3 %. Hausse 2021-2024 : (87 − 18) ÷ 18 ≈ 383,3 %. Taux annuel
moyen : (87 ÷ 18)^(1/3) − 1 ≈ 69,1 %. Pièges : la formule sans `$` recopiée donne 200 et 207,1 ; le
taux moyen par division, 127,8 %.

Une seule règle sur la feuille, celle du B1-01 : chaque résultat est arrondi au dixième avec
`ARRONDI`, tolérance nulle, et une valeur non arrondie se nomme `arrondi-oublie`. Le sujet affiche
la ligne 3 au format nombre : la correction le dit, la formule simple y suffit.

### 5.9 Concepts, confusions et remédiations

**Concepts** : `taux-evolution`, `coefficient-multiplicateur`, `evolutions-successives`,
`evolution-reciproque`, `indice-base-100`, `taux-moyen`, `pourcentage`, `tableur` (tous déjà dans la
banque). **Confusions** : toutes existantes, sauf deux dédiées à la recopie vers la droite,
`reference-non-figee-en-ligne` et `formule-non-recopiable-en-ligne` (concept `tableur`), ajoutées en
dernier à la banque.

| Identifiant                         | Concept                    | Libellé court                         | Remédiation                   |
| ----------------------------------- | -------------------------- | ------------------------------------- | ----------------------------- |
| `ecart-absolu-au-lieu-du-taux`      | taux-evolution             | Donner l'écart au lieu du taux.       | B1-02-A1-06-COURS-COEFFICIENT |
| `base-arrivee`                      | taux-evolution             | Diviser par la valeur d'arrivée.      | B1-02-A1-06-COURS-COEFFICIENT |
| `coefficient-confondu-avec-taux`    | coefficient-multiplicateur | Confondre t et 1 + t.                 | B1-02-A1-06-COURS-COEFFICIENT |
| `taux-valeur-facteur-cent`          | pourcentage                | Confondre 5 % et 0,5.                 | B1-02-A1-06-COURS-COEFFICIENT |
| `sens-de-variation`                 | taux-evolution             | Traduire une baisse par 1 + t.        | B1-02-A1-06-COURS-COEFFICIENT |
| `arrondi-oublie`                    | tableur                    | Ne pas arrondir au dixième.           | B1-02-A1-06-COURS-COEFFICIENT |
| `valeur-saisie-sans-formule`        | tableur                    | Taper le total au lieu de SOMME.      | B1-02-A1-06-COURS-COEFFICIENT |
| `formule-non-recopiable`            | tableur                    | Écrire une formule par ligne.         | B1-02-A1-06-COURS-COEFFICIENT |
| `tva-calculee-sur-ttc`              | pourcentage                | Retirer 20 % au TTC.                  | B1-02-A1-07-COURS-HT-TTC      |
| `taux-successifs-additionnes`       | evolutions-successives     | Additionner les taux.                 | B1-02-A2-02-COURS-SUCCESSIVES |
| `hausse-baisse-symetriques`         | evolutions-successives     | Croire qu'on revient au départ.       | B1-02-A2-02-COURS-SUCCESSIVES |
| `coefficient-global-mal-interprete` | evolutions-successives     | Mal lire le coefficient global.       | B1-02-A2-02-COURS-SUCCESSIVES |
| `reciproque-meme-taux`              | evolution-reciproque       | Reprendre le même taux au retour.     | B1-02-A2-03-COURS-RECIPROQUE  |
| `indice-lu-comme-taux`              | indice-base-100            | Lire 130 comme + 130 %.               | B1-02-A3-02-COURS-INDICE      |
| `indice-lu-comme-valeur`            | indice-base-100            | Lire 130 comme 130 €.                 | B1-02-A3-02-COURS-INDICE      |
| `reference-non-figee-en-ligne`      | tableur                    | Recopier à droite sans figer la base. | B1-02-A3-02-COURS-INDICE      |
| `formule-non-recopiable-en-ligne`   | tableur                    | Écrire une formule par colonne.       | B1-02-A3-02-COURS-INDICE      |
| `taux-moyen-arithmetique`           | taux-moyen                 | Diviser le taux global par n.         | B1-02-A3-03-COURS-TAUX-MOYEN  |

### 5.10 Rappels espacés

Douze rappels, tous obligatoires, écrits dans `b1-02.acte-4.ts`. Chaque bonne réponse porte son
calcul, pour qu'aucun libellé réduit à un nombre ne se lise déjà dans un texte public : taux, baisse
en coefficient, valeur de départ, HT vers TTC, TTC vers HT, remise, successives, symétrie, réciproque,
lecture d'un indice, taux moyen, `PUISSANCE`.

## 6. Moteur

- **Une évolution du moteur** : la recopie porte un sens facultatif, `bas` ou `droite`, absent = bas,
  dans le domaine, le contrat `POST …/evaluation` et la brique `FpSheet`. Le bouton « Recopier vers
  la droite » est présent sur toute feuille. Dans les deux sens, une recopie se refuse hors grille,
  vers une cellule verrouillée, et depuis une cellule verrouillée ou vide : la cible reste intacte
  et un message dit quoi faire. Ce dernier refus vaut pour tous les cours.
- **`PUISSANCE`** est déjà dans les deux moteurs de formules.
- **Synthèse du tableau de prix** : `TableauEvalue` préfixe les totaux par `total`.

## 7. Durées de la séance réelle

| Temps                              | Minutes |
| ---------------------------------- | ------: |
| Écrans programmés                  |     121 |
| Deux pauses                        |      30 |
| Marge (réflexions qui s'allongent) |      59 |
| Séance                             |     210 |

## 8. Médias

### 8.1 Principe

Six infographies, une par exemple pour débuter, chacune projetée sur un écran `illustration` placé
juste avant sa page, à partir des briefs du § 8.3. La gravure de l'accroche complète le catalogue.

### 8.2 Catalogue des médias

Chaque PNG d'origine (1 536 × 1 024 px) est converti en WebP à la même taille et servi depuis
`/assets/cours/b1-02/v1/`. Le catalogue est stocké avec le cours (`Cours.medias`) et contrôlé par la
règle `media-sans-licence`.

| Id  | Écran | Fichier source (page)                                                                                                                                       | Original                     | Auteur, date           | Licence        | Dérivé servi                     | Attribution affichée                                                   |
| --- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------- | -------------- | -------------------------------- | ---------------------------------------------------------------------- |
| M1  | A1-06 | production propre du cours                                                                                                                                  | PNG 1 536 × 1 024 px, 1,5 Mo | Asili Design, 2026     | CC BY-SA 4.0   | `cinema-coefficient.webp`        | « Multiplier, pas ajouter · Asili Design, 2026 · CC BY-SA 4.0 »        |
| M2  | A1-07 | production propre du cours                                                                                                                                  | PNG 1 536 × 1 024 px, 1,5 Mo | Asili Design, 2026     | CC BY-SA 4.0   | `casque-ht-ttc.webp`             | « Aller : ×, retour : ÷ · Asili Design, 2026 · CC BY-SA 4.0 »          |
| M3  | A2-02 | production propre du cours                                                                                                                                  | PNG 1 536 × 1 024 px, 1,5 Mo | Asili Design, 2026     | CC BY-SA 4.0   | `loyer-successives.webp`         | « + 10 %, + 20 % : pas + 30 % · Asili Design, 2026 · CC BY-SA 4.0 »    |
| M4  | A2-03 | production propre du cours                                                                                                                                  | PNG 1 536 × 1 024 px, 1,6 Mo | Asili Design, 2026     | CC BY-SA 4.0   | `velo-reciproque.webp`           | « Le retour n’a pas le même taux · Asili Design, 2026 · CC BY-SA 4.0 » |
| M5  | A3-02 | production propre du cours                                                                                                                                  | PNG 1 536 × 1 024 px, 2,2 Mo | Asili Design, 2026     | CC BY-SA 4.0   | `ticket-indice.webp`             | « Ni un prix, ni un taux · Asili Design, 2026 · CC BY-SA 4.0 »         |
| M6  | A3-03 | production propre du cours                                                                                                                                  | PNG 1 536 × 1 024 px, 1,5 Mo | Asili Design, 2026     | CC BY-SA 4.0   | `epargne-taux-moyen.webp`        | « La même hausse chaque année · Asili Design, 2026 · CC BY-SA 4.0 »    |
| M7  | A1-02 | https://commons.wikimedia.org/wiki/File:Chart_Showing_at_One_View_the_Price_of_the_Quarter_of_Wheat,_and_Wages_of_Labour_by_the_Week,_from_1565_to_1821.png | PNG 1 109 × 586 px           | William Playfair, 1822 | domaine public | `playfair-ble-salaires-1822.jpg` | « William Playfair, 1822 · Wikimedia Commons (domaine public) »        |

### 8.3 Briefs des infographies

PNG 1 536 × 1 024 px, fond clair, titre en bulle jaune en haut, chiffres en gras, une flèche ou un
encadré pour le résultat, lisible projeté au fond d'une salle. Virgule décimale.

**M1 · « Multiplier, pas ajouter »** (`cinema-coefficient.webp`, avant A1-06)

- Contenu : deux tickets de cinéma, « 10 € » et « 12 € », reliés par une flèche épaisse « × 1,2 ».
  Dessous : « t = 2 ÷ 10 = 0,2 = + 20 % » ; « c = 1 + 0,2 = 1,2 ». Encadré : « − 20 % : c = 0,8 ;
  10 × 0,8 = 8 € ». Bandeau : « Toujours le départ en bas ».

**M2 · « Aller : ×, retour : ÷ »** (`casque-ht-ttc.webp`, avant A1-07)

- Contenu : un casque audio, deux étiquettes « 30 € HT » et « 36 € TTC ». Flèche haute « × 1,20 »,
  flèche basse « ÷ 1,20 ». Barré : « 36 − 20 % = 28,80 € ». Encadré : « Remise de 10 % : 36 × 0,90 =
  32,40 € ».

**M3 · « + 10 %, + 20 % : pas + 30 % »** (`loyer-successives.webp`, avant A2-02)

- Contenu : un escalier à deux marches, « 100 » → « 110 » → « 132 », chaque marche marquée « × 1,10 »
  et « × 1,20 ». Calcul : « C = 1,10 × 1,20 = 1,32 = + 32 % ». Barré : « + 30 % ». Bandeau :
  « Coefficients, jamais taux ».

**M4 · « Le retour n'a pas le même taux »** (`velo-reciproque.webp`, avant A2-03)

- Contenu : un vélo à 200 €, flèche descendante « − 50 % = × 0,5 » vers 100 €, flèche montante
  « + 100 % = × 2 » vers 200 €. Barré : « + 50 % → 150 € ». Calcul : « 1 ÷ 0,5 = 2 ».

**M5 · « Ni un prix, ni un taux »** (`ticket-indice.webp`, avant A3-02)

- Contenu : deux barres sur un axe partant de 0, « 2020 : 2 €, indice 100 » et « 2025 : 3 €, indice
  150 ». Calcul : « 3 ÷ 2 × 100 = 150 » ; « 150 − 100 = + 50 % ». Barrés : « 150 € » et « + 150 % ».
  Encart tableur : 2 en B2, 3 en B3, « =B3/$B$2\*100 » en C3.

**M6 · « La même hausse chaque année »** (`epargne-taux-moyen.webp`, avant A3-03)

- Contenu : trois points 100 €, 130 €, 169 €, reliés par deux flèches identiques « × 1,3 ». Calcul :
  « C = 1,69 ; n = 2 ; 1,69^(1/2) = 1,3 ; + 30 % par an ». Barré : « 69 ÷ 2 = 34,5 % ». Encart
  tableur : « =PUISSANCE(1,69;1/2)-1 ». Bandeau : « n compte les évolutions ».

### 8.4 Sources des données

- Partie Libre et tous les exemples : données fictives créées pour ce cours.
- Exercice 5 : nombres de sanctions de CNIL, rapport annuel 2024 ; structure du sujet BTS CG 2026,
  Polynésie (26CGMATPO), exercice 1, partie B. L'énoncé servi est réécrit.
