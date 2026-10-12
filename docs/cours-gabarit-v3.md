# Gabarit v3 des cours BTS CG 2

Gabarit commun aux douze cours B2-01 → B2-12 (plan du 2026-09-26). Un cours le déclare par
`gabarit: 'v3'` dans son fichier de contenu ; la colonne `gabarit` de
`formation_course_contents` le persiste (migration `1790900000002-AjouteGabaritDuCours`). Un cours
sans gabarit déclaré (B2-01 à ce jour) garde les seules règles communes de `verifierStructure`.

Premier cours conforme : B2-02 « Séries statistiques : résumer, relier, prévoir »
(`docs/cours-b2-02-conception.md`).

Ce document distingue deux choses :

- les **règles vérifiées** par `src/modules/formations/domain/cours/StructureGabarit.ts`, que
  `verifierStructure` applique à tout cours v3 — un contenu qui les enfreint ne se publie pas ;
- les **conventions de conception**, que rien ne vérifie : la relecture de la fiche de conception
  les tient.

## 1. Budget d'une séance

Une séance dure 3 h 30, dont 30 min de pause que le contenu ne compte pas. Le budget vaut pour
les deux gabarits, `v3` et `b3` (§ 8) : `controlerBudget` lit le plafond de minutes du gabarit
déclaré, 180 pour l'un comme pour l'autre.

| Budget                            | Valeur                              | Vérifié                                         |
| --------------------------------- | ----------------------------------- | ----------------------------------------------- |
| Écrans                            | 30 à 40, jamais plus de 40          | plafond de 40 (`ECRANS_MAXIMUM_DU_GABARIT`)     |
| Durée de travail (`dureeMinutes`) | 180 min au plus, pause non comprise | oui (`MINUTES_MAXIMUM_DU_GABARIT`, v3 et b3)    |
| Notions nouvelles                 | 3 au plus                           | convention                                      |
| Fonctions de tableur nouvelles    | 5 au plus                           | convention                                      |
| Exposition continue               | 6 min au plus sans interaction      | fiche du cours (`rythme.expositionContinueMax`) |

Le plancher de 30 écrans est une convention : un cours plus court est un signe de notions
trop tassées, pas une erreur de structure.

## 2. Le cycle Réfléchir → Comprendre → S'exercer

Chaque notion suit trois temps, dans cet ordre.

| Temps      | Rôle                                             | Briques                                                                                                                   | Exemple (B2-02)                |
| ---------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Réfléchir  | Faire naître la question avant de donner l'outil | écran interactif hors exercice : `fp-vote`, `fp-pro`, `fp-story` à rendu `reflection` ou `scatter` interrogé, `fp-pulse`… | `B2-02-A2-02-VOTE-CORRELATION` |
| Comprendre | Poser la trace écrite                            | `fp-story` à rendu v2 `lesson`                                                                                            | `B2-02-A2-03-COURS-NUAGE`      |
| S'exercer  | Réinvestir, noté                                 | écran à question notée (`questionnaire`, `fp-table-build`, `fp-sheet`, `fp-cardsort`…), `fp-escape`, `fp-challenge`       | `B2-02-A2-05-ATELIER-NUAGE`    |

`fp-worked` (exemple résolu), `fp-recall`, `fp-spaced` et `fp-exit` restent **hors cycle** : ils
s'insèrent librement, sans ouvrir ni fermer un temps.

Règles vérifiées (`controlerCycle`) :

- le cours porte au moins une trace écrite (`lesson`) ;
- chaque trace écrite est précédée d'un temps de réflexion depuis le dernier exercice ;
- chaque trace écrite est suivie d'au moins un exercice.

## 3. Les trois temps d'un exercice

Un exercice se découpe en réflexion, travail puis correction, chacun chronométré. Est un
exercice tout `fp-escape`, tout `fp-challenge`, et tout autre écran qui porte une question notée
(`noteCompte`), hors `fp-recall`, `fp-exit`, `fp-spaced` et `fp-worked`.

- **L'annonce** tient sur une ligne exacte des notes formateur :
  `• Temps : réflexion N min · travail M min`, suivie de ` · correction K min` quand la
  correction se fait sur l'écran de l'exercice. `N + M + K` (K vaut 0 sans correction annoncée)
  vaut la `dureeMinutes` de l'écran.
- **La correction** se fait de l'une de deux façons :
  - **sur place** (`correctionSurPlace`) : sur l'écran même de l'exercice, dévoilée question par
    question ; ses explications suivent les questions du questionnaire dans leur ordre, et le
    questionnaire n'en mélange pas l'ordre (règle `correction-sur-place`) ;
  - **sur un écran de correction** qui suit l'exercice (`correctionsDe` le retrouve par sa
    source) et porte sa propre durée ; il reste verrouillé jusqu'à la révélation de sa source,
    comme dans tout cours servi.

Règle vérifiée (`controlerTempsDesExercices`) : chaque exercice porte l'annonce, sa somme tombe
juste, et il est corrigé, sur place ou sur un écran qui le suit.

## 4. La trace écrite (rendu `lesson`)

Rendu v2 `lesson` d'un `fp-story` : un titre et **quatre blocs au plus**, chacun d'un type :

| `kind`       | Contenu                                                      |
| ------------ | ------------------------------------------------------------ |
| `definition` | La définition, dans les mots du référentiel                  |
| `property`   | La propriété ou le résultat à retenir, avec sa `formula`     |
| `method`     | La méthode, en `steps` numérotés                             |
| `example`    | Un exemple résolu court                                      |
| `exam`       | « Comment rédiger au CCF » : la phrase attendue sur la copie |

Une trace écrite est **publique** au catalogue (diffusion `catalogue`) : elle sert de fiche de
révision et ne livre aucune réponse d'exercice. La garde de confidentialité le vérifie.

Le rendu `scatter` (nuage de points, point moyen et droite facultatifs) complète la trace écrite
des séries à deux variables. La garde de confidentialité lit ses coordonnées comme les valeurs
d'un graphique.

## 5. La mini-situation CCF

Le cours se clôt sur une mini-situation au format de la CCF de mathématiques du BTS CG
(deux situations de 55 min, dont 3 points sur 10 réservés au tableur) :

- un énoncé au format officiel, sur données réelles sourcées ;
- une question tableur, jouée en `fp-sheet` et corrigée cellule par cellule ;
- une suite d'énigmes (`fp-escape`) qui déroule les questions de la situation ;
- une grille : barème par question, pièges attendus et remédiation dans les notes formateur.

Règles vérifiées (`controlerMiniSituation`) : le cours porte un `fp-escape`, et aucune trace
écrite ne le suit — la mini-situation réinvestit, elle n'introduit rien. Seuls le rappel espacé,
la fiche mémo et le billet de sortie viennent après.

## 6. Équivalence papier

Une séance doit pouvoir se tenir sans aucun poste étudiant : le formateur projette et pilote les
révélations, les étudiants répondent sur papier. Chaque brique interactive a donc une forme
papier, que la fiche de conception décrit écran par écran.

| Brique                            | Forme papier                                                        |
| --------------------------------- | ------------------------------------------------------------------- |
| `fp-vote`                         | Cases à cocher, décompte à main levée                               |
| `questionnaire`                   | Question et espace de réponse ; réponse numérique encadrée          |
| `fp-sheet`                        | « Quelle formule écrivez-vous en E3 ? » avec la grille des cellules |
| `fp-table-build`                  | Tableau à compléter                                                 |
| `fp-cardsort`                     | Liste à classer en colonnes                                         |
| `fp-escape`                       | Énigmes en série ; le code de chaque étape se vérifie au corrigé    |
| `fp-challenge`                    | Réponse de l'IA imprimée, à critiquer par écrit                     |
| `fp-pro`, `reflection`, `fp-exit` | Question ouverte et lignes de réponse                               |
| `fp-pulse`                        | Pouce levé, main à plat, pouce baissé                               |
| `fp-recall`, `fp-spaced`          | Questions de rappel en tête de feuille                              |
| `fp-worked`                       | Exemple résolu étape par étape, révélé au tableau                   |
| `lesson`, `scatter`               | Imprimés tels quels dans le livret                                  |

## 7. Liste de contrôle d'un nouveau cours v3

1. Fiche de conception `docs/cours-b2-XX-conception.md` : tableau des écrans, rythme, sources.
2. Données réelles sourcées (licence ouverte) ou signalées fictives à l'écran.
3. `gabarit: 'v3'` dans le fichier de contenu, `concepts` et confusions ajoutés aux banques.
4. `b2-XX.cours.spec.ts` : fiche du cours (`decrireLaFicheDuCours`) et recalcul de chaque valeur
   attendue depuis les données.
5. Instantané régénéré (`ECRIRE_INSTANTANE=1`) et copié dans les fixtures du front.
6. Paramètres du cours dans les e2e DB (`formations-e2e-seance`, `formations-cours-publies`) :
   une entrée de `cellulesDesFeuilles` par écran `fp-sheet`, dans l'ordre du déroulé.
7. Côté front : `COURS_EN_SEANCE` (`cours-en-seance.ts`), carte de la liste des formations,
   entrée SEO, XLF fr/en.

## 8. Gabarit b3 des cours Bachelor 3

Un cours B3 déclare `gabarit: 'b3'`. `verifierStructure` lui applique le budget (§ 1 : 40 écrans
et 180 minutes au plus, comme le v3, décision de Tim du 2026-10-12 : deux pauses de 15 minutes
dans la séance de 3 h 30), le cycle
(§ 2) et les trois temps de chaque exercice (§ 3), mais pas la mini-situation CCF (§ 5) : le
Bachelor n'a pas d'épreuve CCF à préparer. L'équivalence papier (§ 6) ne le concerne pas non
plus, les manipulations se faisant dans Excel. La valeur `b3` tient dans la colonne `gabarit`
(`varchar(20)`) sans migration.

Premier cours conforme : B3-01 « Expert Data : de la donnée brute à la décision »
(`docs/cours-b3-01-conception.md`).
