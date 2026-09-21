# B2-01 · Traitement de l’information chiffrée — conception finale (V3)

> Cahier des charges figé du cours B2-01 : fusion du deck en production (72 écrans « v2 ») et du
> brief V2 (fil rouge « Atelier Rivage »), après intégration de la relecture pédagogique et
> mathématique (51 constats) et de la relecture technique (43 constats). Ce document ne contient
> aucun code exécutable : il fixe les contenus, les données, les contrats (§ 9), le plan de lots
> et les critères de sortie (§ 7 et § 10). Toute divergence d’implémentation est un défaut de
> l’implémentation, pas une liberté.

| Rubrique    | Valeur                                                                                                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date        | 19 septembre 2026                                                                                                                                                                                   |
| Statut      | **Figé** : version finale, les deux relectures sont intégrées (traçabilité en annexe C)                                                                                                             |
| Cours       | `b2-01-traitement-information-chiffree`, **version 3**, insérée non publiée puis publiée par bascule réversible (§ 9.10, R15) ; les versions 1 et 2 restent servies aux séances qui les référencent |
| Titre servi | « Traitement de l’information chiffrée »                                                                                                                                                            |
| Durée       | **210 minutes exactes** (somme des écrans), 6 actes aux durées du brief (30, 36, 36, 38, 42, 28), plus une pause de 15 minutes hors durée                                                           |
| Écrans      | **52** (option A de la relecture pédagogique : budget rééquilibré acte par acte, § 2.5)                                                                                                             |
| Remplace    | `docs/formation-b2-01-brief-v2.md` (V2) ; le deck `src/migrations/data/b2-visual.snapshot.ts` (v2 servie) ; la conception V3 à 49 écrans                                                            |

Code lu pour figer les contrats (lecture seule, branche `fix/cours-qa-prod` des deux dépôts) : back
`Cours.ts`, `CoursStocke.ts`, `CoursPublic.ts`, `Tirage.ts`, `DeroulePresentateur.ts`,
`OuvertureTirages.ts`, `VisualPresentation.ts`, `Bareme.ts`, `GradingCore.ts`, `AnswerGrading.ts`,
`RegleDeNotation.ts`, `ResultatsSeance.ts`, `SessionStatistics.ts`, `SessionReport.ts`,
`ISessionStateCache.port.ts`, `StreamSession.useCase.ts`, `ControlSession.useCase.ts`,
`SubmitAnswer.useCase.ts`, `SaveFreeResponse.useCase.ts`, `LireSujet.useCase.ts`,
`LireCoursPublic.useCase.ts`, `JoinSession.useCase.ts`, `OpenSession.useCase.ts`,
`GetSessionResults.useCase.ts`, `StreamCapacity.service.ts`, `CoursCatalogue.repository.typeorm.ts`,
`DomainExceptionFilter.ts`, les contrôleurs `FormationsStudent`, `FormationsPresenter`,
`FormationsCatalog`, les entités `FormationSession`, `FormationAnswer`, `FormationCourseContent`,
`FormationScreenContent` et la migration `1780100000000-VersionFormationCourseContent` ; front
`core/i18n.ts`, `core/formula.ts`, `core/sync.ts`, les 17 briques `Fp*.ts`, `lecture-ecran.ts`,
`slide-activity.component.ts`, `slide-deck.component.html`, `formations.port.ts`,
`regle-de-notation.ts` et `docs/seo-lastmod.md`.

---

## 0. Synthèse des décisions

1. **Un seul récit.** L’étudiant est l’assistant·e de gestion d’Atelier Rivage (voilerie fictive de
   La Rochelle). Il a jusqu’à jeudi pour fiabiliser le tableau de bord 2025 avant le comité de
   direction. Trois cas d’entreprise reviennent d’acte en acte : le tableau de bord par canal, le
   prix de la toile, les factures de vente de mars. Trois récits historiques éclairent le cas, avec
   leurs nuances vérifiées : Playfair (1786, précédé par la frise de Priestley, 1765) quand on juge
   une diapositive, Nightingale (1858) quand on défend une décision, Pacioli (1494, qui décrit la
   partie double sans l’avoir inventée) quand on contrôle des pièces.
2. **52 écrans, 210 minutes, une séance.** Les ajouts de la relecture pédagogique (N1 : indice et
   taux moyen avant l’atelier 2 ; N3 : tableau croisé dynamique ; N4 : fiche mémo ; question N2 sur
   taux de marge et taux de marque dans l’atelier 1) sont financés acte par acte, sans toucher aux
   durées du brief. Les deux votes par les pairs restent à 8 minutes, pour respecter la règle des
   ateliers de 8 à 15 minutes (§ 2.5).
3. **Aucune notion utile du deck n’est perdue** : l’inventaire de couverture (§ 3.9) passe les
   52 notions en revue ; toutes sont enseignées, et celles qui sont évaluées le sont après avoir été
   enseignées (TVA, rapprochement ligne à ligne, compensation, multiple de 9, boîte à outils du
   tableur, fiche de synthèse, désinflation, champ calculé du TCD…).
4. **Plus de micro-quiz isolés.** Toute question fermée notée vit dans un atelier de 8 à 15 minutes
   (questionnaire, vote par les pairs, tri de cartes), sauf le rappel d’ouverture (`fp-recall`) et le
   billet de sortie (`fp-exit`). Les ateliers dont l’enchaînement compte déclarent `ordre: 'fixe'`.
5. **Les cinq briques restaurées ont chacune un rôle que rien d’autre ne remplit** : `fp-sheet` et
   `fp-table-build` portent les deux tâches de tableur de l’acte 4, `fp-escape` le mini-jeu de
   résolution autonome de l’acte 6, `fp-pulse` les jalons de confiance des actes 1 à 5, `fp-spaced`
   le rappel espacé de l’acte 6 (compensation et multiple de 9 servis à tous, plus les concepts que le
   Leitner désigne comme fragiles).
6. **Deux familles de rendu cohabitent** : les rendus v2 Angular portent l’exposition soignée
   (graphiques, tableaux, images, guides) ; les briques runtime portent les activités. La page
   publique monte les deux (R18).
7. **Diffusion par écran.** Chaque écran déclare `diffusion: 'catalogue' | 'seance'` : le catalogue
   public ne sert en clair que 13 écrans d’exposition sans réponse ; les 39 autres y sont verrouillés
   (titre et durée seulement). La garde de confidentialité s’exécute sur le sujet de séance **et** sur
   le catalogue (§ 6.4).
8. **Correction et pilotage côté serveur.** Aucune solution n’atteint le poste avant la réponse ;
   toute écriture vérifie que l’écran visé est servi (409 `ECRAN_NON_SERVI`) ; les phases de vote, les
   révélations et l’étayage sont persistés par écran et diffusés dans le flux ; un participant qui
   recharge sa page retrouve ses réponses, ses verdicts et ses brouillons (§ 9).
9. **La vidéo du brief est écartée** (25 min, en allemand) et remplacée par une capsule de
   2 min 30 **produite par nous** : page HTML/SVG animée rendue image par image, narration Piper
   `fr_FR-siwis-medium`, WebM VP9/Opus normalisé à −16 LUFS, sous-titres WebVTT, sous CC BY-SA 4.0
   (annexe A). La voix système de macOS n’est jamais utilisée.
10. **Données réelles de l’Insee** (taux annuels moyens 2019–2025, parus le 23 mars 2026). L’IPC est
    publié en base 100 = moyenne 2025 depuis janvier 2026 (série de référence 011814630) ; le cours
    reconstitue un indice base 100 = moyenne 2019 et signale que l’indice officiel rebasé vaut
    116,04 en 2025. Toutes les autres données sont fictives, déclarées comme telles et recalculées
    par script (§ 5.8, annexe E).
11. **Terminologie comptable tranchée** (§ 5.1) : marge ÷ coût d’achat HT = taux de marge ;
    marge ÷ prix de vente HT = taux de marque ; marge commerciale ÷ ventes de marchandises = taux de
    marge commerciale ; la marge d’Atelier Rivage (CA HT − coûts directs) est une marge sur coûts
    directs, appelée « marge brute » dans le cours, et le « taux de marge brute (sur CA HT) » est
    défini explicitement dès la fiche A1-06.
12. **`verifierStructure` est restauré et adapté** (§ 2.6) : la V3 ne lève aucune violation, sans
    dérogation ; la vérification est rejouée par le script de l’annexe E.
13. **Publication réversible** : la V3 est insérée non publiée, testée en préproduction, puis
    publiée par une bascule que l’administrateur peut annuler (§ 10.1, lot 6).

---

## 1. Objectifs d’apprentissage et public

### 1.1 Rattachement au programme officiel

Le cours relève du module **« Traitement de l’information chiffrée »** (§ 2.1) du programme de
mathématiques du BTS Comptabilité et gestion, défini par l’arrêté du 4 juin 2013 (NOR ESRS1312230A,
annexes I et II) et repris par le référentiel (unité **U3 – Mathématiques appliquées**, numérotée U2
avant l’arrêté du 8 juillet 2024). L’arrêté du 8 juillet 2024 (NOR ESRS2414606A) renomme l’épreuve
en **E3 – Mathématiques appliquées** (coefficient 3) ; en CCF, la **première situation
d’évaluation** (55 minutes, avant la fin de la première année) porte notamment sur ce module, et
« l’un au moins des exercices de chaque situation comporte une ou deux questions dont la résolution
nécessite l’utilisation du tableur ». Compétences évaluées : s’informer ; chercher ; modéliser ;
raisonner et argumenter ; calculer, illustrer, mettre en œuvre une stratégie ; communiquer. Les deux
situations évaluent aussi les capacités du module « Calcul des propositions et des prédicats » en
prenant appui sur des contextes : l’étape `logique` de A5-03 en fournit un.

Objectifs du module, cités du référentiel : « différencier l’expression d’une proportion de celle
d’une variation relative ; acquérir une pratique aisée de techniques élémentaires de calcul sur les
pourcentages ; développer une attitude critique vis-à-vis des informations chiffrées et favoriser un
usage raisonné des outils numériques et en particulier du tableur ». Le programme cite la capacité
« Créer et exploiter un tableau croisé dynamique sur tableur » (« On aborde l’ajout d’un champ
calculé ») et exclut « le calcul d’un indice synthétique, comme par exemple l’indice des prix » : le
cours lit et chaîne un indice simple, il ne construit pas l’IPC.

### 1.2 Objectifs du cours B2-01

| #   | À la fin du cours, l’étudiant sait…                                                                                                                        | Capacité du programme (§ 2.1)                                                              | Compétence E3           | Écrans où c’est travaillé                | Preuve recueillie                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------- | ---------------------------------------- | --------------------------------------------------------- |
| O1  | lire un chiffre : unité, base, période, périmètre, source                                                                                                  | « L’importance de la population de référence est soulignée » ; attitude critique           | S’informer              | A1-04 à A1-08                            | classement A1-05, réponse libre A1-08                     |
| O2  | calculer et interpréter une proportion, choisir la population de référence                                                                                 | Proportion d’une sous-population ; associer proportion et pourcentage                      | Modéliser, calculer     | A1-06, A2-03, A4-02, A5-06               | atelier 1 (Q2, Q3), feuille E2:E5, atelier 4 (Q1)         |
| O3  | distinguer proportion et évolution, variation absolue et relative, point de pourcentage, taux de marge et taux de marque                                   | t = (y₂ − y₁) / y₁ et y₂ = (1 + t) y₁ ; « point de pourcentage » ; proportion ou évolution | Raisonner               | A1-05, A1-06, A2-03, A2-05, A2-06, A5-06 | tri A1-05, atelier 1 (Q4, Q6), atelier 4 (Q4)             |
| O4  | enchaîner des évolutions, retrouver une valeur de départ, calculer une évolution réciproque (dont TTC → HT)                                                | Évolutions successives ; évolution réciproque                                              | Calculer                | A3-01 à A3-04, A3-07, A4-05, A6-02       | votes A3-01, atelier 2 (Q3, Q5), tableau A4-05, énigme E3 |
| O5  | passer d’un indice base 100 à un taux et réciproquement                                                                                                    | Indice simple en base 100                                                                  | Calculer, communiquer   | A3-06, A3-07, A3-08, A4-05               | atelier 2 (Q1, Q2), tableau A4-05                         |
| O6  | calculer un taux d’évolution moyen avec une racine n-ième                                                                                                  | Racine n-ième ; taux d’évolution moyen                                                     | Calculer                | A3-06, A3-07, A6-04                      | atelier 2 (Q4), défi A6-04                                |
| O7  | construire une feuille de calcul contrôlable (références relatives et absolues, SOMME, SI, ARRONDI, contrôles)                                             | « Résoudre un problème de proportion / d’évolution à l’aide du tableur »                   | Calculer, illustrer     | A4-01, A4-02, A4-05, A6-07               | feuille A4-02, tableau A4-05                              |
| O8  | expliquer un taux global par une moyenne pondérée (effet de répartition) et le calculer par le champ calculé d’un TCD                                      | Traitement de données ; tableau croisé dynamique et champ calculé                          | Modéliser, raisonner    | A5-02 à A5-06                            | votes A5-02, atelier 4 (Q5), énigme E1, devoir TCD déposé |
| O9  | juger et construire un graphique fidèle (forme, titre, axe, source, phrase de lecture)                                                                     | Attitude critique vis-à-vis des informations fournies par les médias                       | Communiquer             | A1-09, A1-10, A2-02, A4-03, A4-04        | défi A1-10, atelier 3                                     |
| O10 | contrôler un tableau et défendre une recommandation chiffrée, y compris face à une réponse d’IA                                                            | Usage raisonné des outils numériques                                                       | Argumenter, communiquer | A5-07, A5-08, A6-03, A6-04, A6-08        | tri A5-07, recommandation A5-08, billet A6-08             |
| O11 | contrôler des pièces : rapprocher ligne à ligne, reconnaître une compensation, utiliser un écart multiple de 9 comme indice, retenir la pièce comme preuve | Attitude critique ; lien avec le processus P1 (pointage, état de rapprochement)            | Raisonner, argumenter   | A5-07, A6-01, A6-02, A6-05               | tri A5-07, énigme E4, rappels R10 et R11                  |

B2-01 pose le principe du tableau croisé dynamique et de son champ calculé (A5-05, atelier 4 Q5) et
fait réaliser la synthèse par canal « à la main » dans la feuille A4-02 ; le **devoir de
prolongement** (§ 5.2) fait créer le TCD sur le fichier trimestriel et est **déposé**. La création
complète d’un TCD sur un fichier professionnel est approfondie par B2-03, les indices par B2-02.

### 1.3 Public et conditions

- **Public** : étudiants de BTS Comptabilité et gestion, **première année**, premier trimestre (le
  module est évalué en CCF 1, avant la fin de la première année). Le deck actuel indique « Deuxième
  année » : c’est corrigé. Le cours convient aussi à un public en reconversion vers la gestion.
- **Prérequis** : pourcentages du lycée (appliquer un taux, calculer une part). Le rappel d’ouverture
  A1-01 les diagnostique.
- **Effectif** : 12 à 35 étudiants (capacité de séance réglée à l’ouverture, 40 par défaut, 60 au
  plus).
- **Matériel** : **un poste par étudiant pour les activités notées** (navigateur, rejoint la séance
  par code) et une calculatrice ; vidéoprojecteur pour la projection formateur. Dans les activités
  marquées « binôme », les deux étudiants discutent ensemble, puis **chacun envoie** depuis son poste :
  la note de participation est individuelle (§ 4.5).
- **Séance** : **une séance unique** de 210 minutes de cours plus une **pause de 15 minutes hors
  durée** entre l’acte 3 et l’acte 4 (3 h 45 au total). L’horaire hebdomadaire de mathématiques de
  STS étant de 2 heures, le cours se programme sur une demi-journée banalisée (regroupement ou
  semaine de mise en situation). La pause n’est pas un écran : un écran « pause » compterait comme
  exposition. Le rappel A6-05 impose un espacement intra-séance d’au moins 30 minutes ; les concepts
  restés en boîte 1 rouvrent la séance B2-02, ce qui apporte l’espacement entre séances.

---

## 2. Architecture

### 2.1 Les six actes

| Acte | Titre                              | Minutes | Écrans | Preuve attendue (brief V2)                                 | Où la preuve est recueillie                                   |
| ---: | ---------------------------------- | ------: | -----: | ---------------------------------------------------------- | ------------------------------------------------------------- |
|    1 | Le chiffre qui déclenche l’alerte  |      30 |     11 | identifier partie, total, unité et question de gestion     | tri A1-05 (noté), question de gestion A1-08, audit A1-10      |
|    2 | Comparer sans tromper              |      36 |      8 | proportion, pourcentage, base commune et ordre de grandeur | atelier 1 A2-03 (6 questions notées), mini-jeu A2-07          |
|    3 | Raconter une évolution             |      36 |     10 | écart, taux, coefficient et interprétation                 | votes A3-01, atelier 2 A3-07, note A3-09                      |
|    4 | Construire une feuille contrôlable |      38 |      6 | formule, contrôles et graphique lisible                    | feuille A4-02, atelier 3 A4-03, tableau A4-05                 |
|    5 | Défendre une décision au comité    |      42 |      9 | dossier complet avec comparaison et recommandation         | votes A5-02, atelier 4 A5-06, tri A5-07, recommandation A5-08 |
|    6 | Transférer et vérifier             |      28 |      8 | résolution autonome, correction d’une erreur et bilan      | coffre A6-02, défi IA A6-04, rappel A6-05, billet A6-08       |
|      | **Total**                          | **210** | **52** |                                                            |                                                               |

### 2.2 Le fil rouge « Atelier Rivage »

**Atelier Rivage** (entreprise fictive) : voilerie artisanale de La Rochelle, SAS, 12 salariés en
2024 et 14 en 2025. Trois canaux :

- **Sur-mesure** : voiles neuves fabriquées sur commande (taux de marge brute 36 % du CA HT) ;
- **Entretien** : réparation et hivernage de voiles (28 %) ;
- **Marketplace** : sacs et accessoires en toile recyclée, confectionnés par un atelier partenaire
  et revendus en l’état sur une plateforme en ligne (16 %, commission de la plateforme comprise dans
  les coûts directs).

La « marge brute » du cours est la **marge sur coûts directs** : CA HT − coûts directs (matière,
sous-traitance, commissions). Son rapport au CA HT est appelé « taux de marge brute (sur CA HT) » et
défini à l’écran A1-06, avec les trois autres usages du mot « taux de marge ».

Personnages : **Hélène Garnier**, dirigeante ; **Samir Haddad**, responsable commercial, auteur du
tableau de bord et d’une diapositive trompeuse ; **vous**, assistant·e de gestion.

| Acte | Ce qui arrive à Atelier Rivage                                                                                                                                                                                                                               | Récit historique tissé                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Lundi 8 h 40 : Hélène transfère le tableau de bord de Samir (« CA +9,5 %, excellente année, investissons dans la marketplace ») et demande : « Est-ce qu’on gagne vraiment plus ? » Samir prépare une diapositive « Marge brute : une croissance continue ». | —                                                                                                                                |
| 2    | Vous jugez la diapositive (axe qui commence à 284 000 €) et vous rapportez chaque chiffre à la bonne base (commandes ou CA ; coût d’achat ou prix de vente).                                                                                                 | **Playfair, 1786**, après la frise de Priestley (1765) : le graphique pour comparer d’un coup d’œil, et le risque du coup d’œil. |
| 3    | Samir veut baisser les tarifs « puisque l’inflation baisse » et additionne les hausses du fournisseur de toile. Vous enchaînez les coefficients, lisez un indice et calculez un taux moyen.                                                                  | — (les données de l’Insee jouent le rôle de source externe)                                                                      |
| 4    | Vous construisez la feuille par canal et l’indice du prix de la toile ; le graphique du comité montre les trimestres 2025.                                                                                                                                   | — (capsule : la formule qui se recopie)                                                                                          |
| 5    | Mercredi : le dossier du comité. Le taux global baisse alors que chaque canal garde son taux : effet de répartition, confirmé par le TCD. Le cabinet comptable signale un écart sur les factures de vente de mars.                                           | **Nightingale, 1858** : un diagramme au service d’une décision.                                                                  |
| 6    | Jeudi, 13 h 30 : quatre vérifications ouvrent la salle du comité (dont le rapprochement des factures) ; vous corrigez une réponse d’IA fausse, révisez vos points faibles, puis rédigez la phrase du compte rendu.                                           | **Pacioli, 1494** : la partie double qu’il décrit, la concordance et la preuve.                                                  |

### 2.3 Les trois cas d’entreprise récurrents

| Cas                                   | Données (détail § 5)                                                                                                          | Actes         | Écrans                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------- |
| **Cas 1 — Tableau de bord par canal** | CA, marge brute et taux par canal 2024–2025 ; commandes ; marge 2022–2025 ; CA 2025 par trimestre                             | 1, 2, 4, 5, 6 | A1-04 à A1-10, A2-02 à A2-06, A4-02 à A4-04, A5-02 à A5-08, A6-02 (E1, E2), A6-08 |
| **Cas 2 — Prix de la toile**          | 20,00 €/m² au 1er janvier 2025, quatre révisions (+8 %, −5 %, +4 %, −3 %) ; 2026 : +6 % puis −4 % ; comparaison à l’inflation | 1, 3, 4, 5, 6 | A1-04, A1-05, A4-05, A5-07, A6-02 (E3), A6-05                                     |
| **Cas 3 — Factures de vente de mars** | F001 à F004, grand livre des ventes 48 795 € HT, pièces 48 705 € HT, TVA collectée 20 %                                       | 5, 6          | A5-07, A5-08, A6-01, A6-02 (E4), A6-05, A6-08                                     |

Cas satellites (transfert, jamais le fil principal) : sac étanche (+10 % puis −10 % ; taux de marge
et taux de marque), voile au prix catalogue (deux remises successives), bobine de fil technique
(+10 % puis −8 % ; TTC → HT), loyer de l’atelier (indice et taux moyen), lycée et taux de réussite
(effet de répartition), CA de la marketplace 2023–2025 (défi IA), capsule sur des ventes
trimestrielles de sacs.

### 2.4 Rythme type d’un acte

Chaque acte suit la même boucle : **situation ou récit court (≤ 6 min d’exposition continue) →
activité de production → correction par un visuel ou un exemple travaillé → atelier noté → jalon
de confiance `fp-pulse`**. Un exemple travaillé (`fp-worked`) précède toujours l’évaluation de sa
méthode, et cette évaluation porte sur d’autres nombres (A3-04 et A3-06 avant l’atelier 2 ; A5-03
avant la question 5 de l’atelier 4 et l’énigme E1 ; A2-06 avant l’énigme E2 et le rappel R2) ; les
phrases de synthèse du fil rouge (atelier 4 Q4, billet A6-08) reprennent volontairement ses chiffres
clés : elles évaluent la formulation (points ou pourcentage, montant ou taux), pas le calcul. Tout
visuel qui porte la réponse d’une question est placé après elle (§ 6.1).

### 2.5 Couverture plutôt que décompte : 52 écrans

Le nombre d’écrans n’est pas un objectif ; la couverture l’est. Les ateliers regroupent les questions
fermées (d’où 52 écrans au lieu des 60 visés par le brief) ; les notions du deck que ces ateliers ne
couvraient pas sont reprises par N1 (A3-06), N2 (atelier 1, Q6), N3 (A5-05) et N4 (A6-06), et par des
enrichissements d’écrans existants (inventaire au § 3.9). Toutes les exigences quantitatives du brief
sont tenues : 3 cas récurrents, 2 tâches de tableur, 4 graphiques complets (G1 à G4), 2 mini-jeux,
1 billet argumenté, 1 vidéo sous licence libre attribuée, une note formateur en 5 rubriques par écran.

Budget de l’option A (durées du brief inchangées par acte) :

| Acte | Durée | Gains                                    | Coupes                                        |
| ---: | ----: | ---------------------------------------- | --------------------------------------------- |
|    1 |    30 | A1-06 +1 (carte « Un mot, trois taux »)  | A1-03 −1                                      |
|    2 |    36 | A2-03 +1 (question N2)                   | A2-02 −1                                      |
|    3 |    36 | N1 (A3-06) +5                            | A3-02, A3-03, A3-04, A3-05, A3-09 : −1 chacun |
|    4 |    38 | —                                        | —                                             |
|    5 |    42 | N3 (A5-05) +2, A5-06 +1 (question 5)     | A5-01, A5-04, A5-08 : −1 chacun               |
|    6 |    28 | N4 (A6-06) +2, A6-07 +1 (boîte à outils) | A6-02, A6-05, A6-08 : −1 chacun               |

Écart avec le budget proposé par la relecture : elle retirait une minute aux deux votes par les pairs
(A3-01, A5-02), ce qui les aurait portés à 7 minutes et fait violer la règle
`atelier-questions-fermees` (8 à 15 minutes). La minute est reprise sur A3-03 (graphique de
correction du vote, 1 minute) et A5-01 (récit de Nightingale, 1 minute).

### 2.6 Règles de structure : `verifierStructure` restauré et adapté

`StructureCours.ts` (supprimé en `c8324cb`) est **restauré** dans `domain/cours/StructureCours.ts`
avec son spec (lu dans `c8324cb^`), puis adapté. Motif de la suppression, traité ici : appliqué au B2
servi, il levait 11 violations incorrigibles parce que le stockage n’acceptait que `fp-story` et que
`estInteractif` ne comptait que les écrans porteurs d’un quiz. La V3 lève ces deux causes : le
stockage accepte toutes les briques (B1) et l’interactivité est définie par la **production
recueillie côté serveur**.

#### 2.6.1 Définition de l’interactivité

`estInteractif(ecran)` vaut vrai si et seulement si l’écran recueille une production de l’étudiant
côté serveur :

| Compte comme interactif                                                                                                    | Ne compte pas (exposition)                                         |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| briques de question : `fp-recall`, `fp-vote`, `fp-numeric`, `fp-exit`, `questionnaire`                                     | `fp-story` sans présentation interactive, `fp-pro`, `fp-quote`     |
| briques de production : `fp-cardsort`, `fp-challenge`, `fp-worked`, `fp-sheet`, `fp-table-build`, `fp-escape`, `fp-spaced` | `fp-plot`, `fp-concept4` : exploration sans production enregistrée |
| `fp-story` dont la présentation v2 est `quiz`, `reflection`, ou `image-left` avec `nestedQuiz`                             | `fp-pulse` : sondage anonyme, compté comme exposition              |

#### 2.6.2 Règles adaptées, seuils et résultat

| Règle                                    | Définition                                                                                                                                                                               | Seuil          | Résultat sur la V3                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------- |
| `exposition-continue`                    | cumul des minutes d’écrans non interactifs consécutifs, jalons compris                                                                                                                   | ≤ 6 min        | **5 min** au plus (3 blocs à 5 min)                       |
| `ratio-interaction`                      | minutes interactives ÷ minutes d’exposition                                                                                                                                              | ≥ 0,30         | 161 ÷ 49 = **3,29**                                       |
| `ouverture-cloture`                      | premier écran `fp-recall`, dernier écran `fp-exit`                                                                                                                                       | —              | A1-01 `fp-recall`, A6-08 `fp-exit`                        |
| `duree-ecran`                            | chaque durée est un entier strictement positif                                                                                                                                           | > 0            | 52 écrans de 1 à 14 min                                   |
| `duree-cours`                            | somme des écrans **égale** à la durée annoncée (la tolérance de 5 % est supprimée)                                                                                                       | écart = 0      | 210 = 210                                                 |
| `reference-inconnue`                     | toute cible `ref:` (remédiations, renvois) existe                                                                                                                                        | —              | 38 remédiations, toutes vers des écrans existants (§ 5.9) |
| `reference-circulaire`                   | aucune boucle de références                                                                                                                                                              | —              | aucune référence entre écrans                             |
| **nouvelle** `notes-formateur`           | `notes` contient les cinq rubriques non vides `Action :`, `Observé :`, `Attendu :`, `Contrôle :`, `Transition :`                                                                         | 5 / 5          | 52 / 52                                                   |
| **nouvelle** `atelier-questions-fermees` | toute question du barème de type `vote`, `numeric` ou `classement` avec `noteCompte` est portée par un écran de 8 à 15 min ; exceptions : `fp-recall` en ouverture, `fp-exit` en clôture | 8 ≤ durée ≤ 15 | 9 écrans concernés, de 8 à 14 min                         |
| **nouvelle** `confidentialite`           | trois volets (exact, segments, catalogue), § 6.4                                                                                                                                         | 0 fuite        | 0 fuite                                                   |
| **nouvelle** `catalogue-sans-question`   | aucun écran interactif n’est en diffusion `catalogue`                                                                                                                                    | 0              | 0                                                         |
| **nouvelle** `media-sans-licence`        | toute image, vidéo ou piste des propriétés publiques figure au catalogue des médias du cours (page source, auteur, licence)                                                              | 0 manque       | 5 médias catalogués (§ 8.2)                               |
| **nouvelle** `options-neutres`           | l’identifiant stable de chaque option de vote vaut `slugOption(libelle)` (§ 9.2)                                                                                                         | 0 écart        | 0 écart                                                   |

Les **dérogations** (champ `Cours.derogations`, retiré en `c8324cb`) sont restaurées avec la règle
« dérogation sans justification », mais **la V3 n’en utilise aucune**.

#### 2.6.3 Démonstration sur le déroulé

Sortie du script de vérification (annexe E), rejoué sur le tableau du § 3.1 :

```
écrans 52 · total 210 · par acte {1: 30, 2: 36, 3: 36, 4: 38, 5: 42, 6: 28}
plus longue exposition continue : 5 min (jalons comptés comme exposition)
interactif 161 min · exposition 49 min · ratio 3,29
ouverture fp-recall · clôture fp-exit
écrans portant des questions fermées notées : A1-05 (8), A2-03 (14), A2-07 (8),
A3-01 (8), A3-07 (10), A4-03 (8), A5-02 (8), A5-06 (9), A5-07 (8)
```

Blocs d’exposition continue : A1-02→A1-04 (5), A1-06→A1-07 (5), A1-09 (2), A1-11→A2-02 (5),
A2-04→A2-05 (4), A2-08 (1), A3-02→A3-03 (3), A3-05 (1), A3-08 (2), A3-10→A4-01 (4), A4-04 (2),
A4-06→A5-01 (2), A5-04→A5-05 (4), A5-09→A6-01 (3), A6-03 (2), A6-06→A6-07 (4).

### 2.7 Diffusion : catalogue public et séance

Le catalogue public (`GET /formations/catalogue/:slug`, page publique indexée) sert le cours sans
séance, à tout moment. Il ne peut donc contenir aucun écran de correction placé « après la
question » ni aucune activité.

- `catalogue` : écran d’exposition qui ne porte la réponse d’**aucune** question du cours. Servi en
  clair, monté en mode aperçu s’il s’agit d’une brique runtime.
- `seance` : tout écran interactif, tout visuel ou exemple qui corrige ou institutionnalise une
  question, toute fiche qui résume des réponses. Servi dans le catalogue sous la forme d’un écran
  verrouillé `{ id, type: 'ecran-verrouille', titre, duree, interactif: false, donnees: {} }`.

Écrans `catalogue` (13) : A1-02, A1-03, A1-04, A1-06, A1-07, A1-09, A2-01, A2-02, A3-05, A4-01,
A5-01, A6-03, A6-07. La garde `confidentialite` vérifie ce choix (volet catalogue, § 6.4) et la règle
`catalogue-sans-question` interdit d’y placer une activité. Les versions 1 et 2 du B2 sont lues avec
`diffusion: 'catalogue'` pour tous leurs écrans (comportement actuel inchangé).

---

## 3. Déroulé écran par écran

### 3.1 Vue d’ensemble

Identifiants : `B2-01-A{acte}-{rang}-{SLUG}` (stables, uniques, ≤ 120 caractères, conformes à
`^B2-01-A[1-6]-\d{2}-[A-Z0-9-]+$`). Colonne « Brique · rendu » : valeur de la colonne `brique` ; les
écrans « v2 » sont stockés en `fp-story` avec une présentation v2 (§ 4.1). « I » = interactif au sens
du § 2.6.1. « Q » = nombre de questions fermées notées (vote, numérique, classement) portées par
l’écran. « Diffusion » : § 2.7. Statut : **N** = nouveau, **M** = modifié à partir des écrans cités du
deck, **C** = conservé sur le fond (texte adapté au fil rouge).

| Rang | Identifiant                       | Min | Brique · rendu                |  I  |   Q | Diffusion | Statut (écrans du deck)        |
| ---: | --------------------------------- | --: | ----------------------------- | :-: | --: | --------- | ------------------------------ |
|    1 | B2-01-A1-01-DIAGNOSTIC            |   3 | `fp-recall`                   |  I  |   1 | seance    | N (remplace S03)               |
|    2 | B2-01-A1-02-ACCROCHE              |   1 | `fp-story` · v2 `hero`        |     |   0 | catalogue | M (S01)                        |
|    3 | B2-01-A1-03-MISSION               |   2 | `fp-pro`                      |     |   0 | catalogue | N                              |
|    4 | B2-01-A1-04-TABLEAU-DE-BORD       |   2 | `fp-story` · v2 `table`       |     |   0 | catalogue | N                              |
|    5 | B2-01-A1-05-ANATOMIE              |   8 | `fp-cardsort`                 |  I  |   1 | seance    | N (reprend S08)                |
|    6 | B2-01-A1-06-FICHE-INDICATEUR      |   3 | `fp-story` · v2 `grid`        |     |   0 | catalogue | M (S05, S06, S13)              |
|    7 | B2-01-A1-07-PLAN                  |   2 | `fp-story` · v2 `method-path` |     |   0 | catalogue | M (S02, S10)                   |
|    8 | B2-01-A1-08-QUESTION-DE-GESTION   |   3 | `fp-story` · v2 `reflection`  |  I  |   0 | seance    | N (remplace S11)               |
|    9 | B2-01-A1-09-DIAPOSITIVE           |   2 | `fp-story` · v2 `chart`       |     |   0 | catalogue | N (reprend S03, S04)           |
|   10 | B2-01-A1-10-AUDIT-DIAPOSITIVE     |   3 | `fp-challenge`                |  I  |   0 | seance    | N (reprend S37)                |
|   11 | B2-01-A1-11-JALON-1               |   1 | `fp-pulse`                    |     |   0 | seance    | N                              |
|   12 | B2-01-A2-01-PLAYFAIR              |   2 | `fp-story` · v2 `image-left`  |     |   0 | catalogue | M (S30)                        |
|   13 | B2-01-A2-02-ORIGINE-AXE           |   2 | `fp-plot`                     |     |   0 | catalogue | M (S04, S32)                   |
|   14 | B2-01-A2-03-ATELIER-1             |  14 | `questionnaire`               |  I  |   6 | seance    | N (reprend S12, S14, S31, S43) |
|   15 | B2-01-A2-04-MARGE-AXE-ZERO        |   2 | `fp-story` · v2 `chart` (G1)  |     |   0 | seance    | M (S32)                        |
|   16 | B2-01-A2-05-ECRITURES             |   2 | `fp-story` · v2 `stats`       |     |   0 | seance    | M (S08, S12)                   |
|   17 | B2-01-A2-06-POINTS                |   5 | `fp-worked`                   |  I  |   0 | seance    | M (S16)                        |
|   18 | B2-01-A2-07-JEU-COMPARABLE        |   8 | `fp-cardsort` (mini-jeu 1)    |  I  |   1 | seance    | M (S07)                        |
|   19 | B2-01-A2-08-JALON-2               |   1 | `fp-pulse`                    |     |   0 | seance    | N                              |
|   20 | B2-01-A3-01-VOTE-HAUSSE-BAISSE    |   8 | `fp-vote` (pairs)             |  I  |   2 | seance    | M (S17, S21, S22)              |
|   21 | B2-01-A3-02-MACHINE-COEFFICIENTS  |   2 | `fp-concept4`                 |     |   0 | seance    | M (S13, S18, S19)              |
|   22 | B2-01-A3-03-PRIX-SAC              |   1 | `fp-story` · v2 `chart`       |     |   0 | seance    | C (S17)                        |
|   23 | B2-01-A3-04-FIL-TECHNIQUE         |   4 | `fp-worked`                   |  I  |   0 | seance    | M (S15, S19, S56)              |
|   24 | B2-01-A3-05-INFLATION-RYTHME      |   1 | `fp-story` · v2 `chart` (G2)  |     |   0 | catalogue | M (S24, S26)                   |
|   25 | B2-01-A3-06-INDICE-ET-TAUX-MOYEN  |   5 | `fp-worked`                   |  I  |   0 | seance    | N (N1, reprend S27)            |
|   26 | B2-01-A3-07-ATELIER-2             |  10 | `questionnaire`               |  I  |   5 | seance    | N (reprend S23, S25, S27)      |
|   27 | B2-01-A3-08-INDICE-PRIX           |   2 | `fp-story` · v2 `chart` (G3)  |     |   0 | seance    | M (S26, S27)                   |
|   28 | B2-01-A3-09-NOTE-CONJONCTURE      |   2 | `fp-story` · v2 `reflection`  |  I  |   0 | seance    | M (S28)                        |
|   29 | B2-01-A3-10-JALON-3               |   1 | `fp-pulse`                    |     |   0 | seance    | N                              |
|   30 | B2-01-A4-01-CAPSULE               |   3 | `fp-story` (vidéo)            |     |   0 | catalogue | N (reprend S67, S69)           |
|   31 | B2-01-A4-02-FEUILLE-CANAUX        |  13 | `fp-sheet` (tableur 1)        |  I  |   0 | seance    | N (reprend S43, S44)           |
|   32 | B2-01-A4-03-ATELIER-3             |   8 | `questionnaire`               |  I  |   4 | seance    | N (reprend S33, S34, S37)      |
|   33 | B2-01-A4-04-CA-TRIMESTRIEL        |   2 | `fp-story` · v2 `chart` (G4)  |     |   0 | seance    | N (reprend S20, S33)           |
|   34 | B2-01-A4-05-INDICE-TOILE          |  11 | `fp-table-build` (tableur 2)  |  I  |   0 | seance    | N                              |
|   35 | B2-01-A4-06-JALON-4               |   1 | `fp-pulse`                    |     |   0 | seance    | N                              |
|   36 | B2-01-A5-01-NIGHTINGALE           |   1 | `fp-story` · v2 `image-right` |     |   0 | catalogue | M (S36)                        |
|   37 | B2-01-A5-02-VOTE-PARADOXE         |   8 | `fp-vote` (pairs)             |  I  |   2 | seance    | M (S38, S46 à S49)             |
|   38 | B2-01-A5-03-MOYENNE-PONDEREE      |   5 | `fp-worked`                   |  I  |   0 | seance    | M (S39, S40, S42)              |
|   39 | B2-01-A5-04-SIMULATEUR-MIX        |   2 | `fp-plot`                     |     |   0 | seance    | M (S41)                        |
|   40 | B2-01-A5-05-TCD                   |   2 | `fp-story` · v2 `table`       |     |   0 | seance    | N (N3, reprend S68)            |
|   41 | B2-01-A5-06-ATELIER-4             |   9 | `questionnaire`               |  I  |   5 | seance    | N (reprend S35, S42 à S44)     |
|   42 | B2-01-A5-07-CONTROLE-DISCRIMINANT |   8 | `fp-cardsort`                 |  I  |   1 | seance    | M (S51, S57, S59 à S61)        |
|   43 | B2-01-A5-08-RECOMMANDATION        |   6 | `fp-challenge`                |  I  |   0 | seance    | M (S45, S58, S60, S62)         |
|   44 | B2-01-A5-09-JALON-5               |   1 | `fp-pulse`                    |     |   0 | seance    | N                              |
|   45 | B2-01-A6-01-PACIOLI               |   2 | `fp-story` · v2 `image-left`  |     |   0 | seance    | M (S50, S54, S57)              |
|   46 | B2-01-A6-02-COFFRE                |  10 | `fp-escape` (mini-jeu 2)      |  I  |   0 | seance    | N (reprend S52 à S56)          |
|   47 | B2-01-A6-03-IA-CADRE              |   2 | `fp-story` · v2 `guide`       |     |   0 | catalogue | M (S67, S70, S71)              |
|   48 | B2-01-A6-04-IA-ERREUR             |   4 | `fp-challenge`                |  I  |   0 | seance    | N                              |
|   49 | B2-01-A6-05-RAPPEL                |   3 | `fp-spaced`                   |  I  |   0 | seance    | N (remplace S57, S63 à S65)    |
|   50 | B2-01-A6-06-FICHE-MEMO            |   2 | `fp-story` · v2 `grid`        |     |   0 | seance    | N (N4, reprend S21, S49, S65)  |
|   51 | B2-01-A6-07-BOITE-A-OUTILS        |   2 | `fp-story` · v2 `grid`        |     |   0 | catalogue | M (S67 à S69, S72)             |
|   52 | B2-01-A6-08-BILLET-DE-SORTIE      |   3 | `fp-exit`                     |  I  |   1 | seance    | M (S58, S62, S66)              |

Conventions des fiches ci-dessous. Le bloc **Contenu (public)** est recopié tel quel dans le fichier
de données : c’est tout ce que voient l’étudiant et la projection (il inclut le « titre public » servi
aussi par le catalogue pour les écrans verrouillés). Les blocs **Corrigé réservé**, **Stratégies de
référence (corrigé)** et **Révélation (déroulé)** ne sont servis qu’au pupitre (et, pour les
stratégies, à l’étudiant après son envoi). Les **Notes** suivent les cinq rubriques et ne sont jamais
projetées. Les options des questions, leurs identifiants stables, les bonnes réponses et les
confusions sont au § 5.10. Les années des `labels` des graphiques sont des chaînes (`"2022"`).

### 3.2 Acte 1 — Le chiffre qui déclenche l’alerte (30 min)

#### A1-01 · `B2-01-A1-01-DIAGNOSTIC` — 3 min · `fp-recall` · séance · Nouveau (remplace S03)

- **Intention** : rouvrir la mémoire du lycée (taux d’évolution) avant d’y ajouter, diagnostiquer la
  confusion de base, amorcer l’état Leitner de chaque étudiant.
- **Concept · modalité** : `taux-evolution` · solo.
- **Contenu (public)** :
  - Titre public : « Diagnostic : le prix d’une réparation »
  - Énoncé (`b2-01-a1-diagnostic`) : « Le prix d’une réparation de voile passe de 80 € à 100 €. De
    quel pourcentage a-t-il augmenté ? »
  - Rappel libre avant les options : « Écrivez tout ce dont vous vous souvenez, sans regarder vos
    notes » pendant 45 s (`delaiMs: 45000`).
  - Options (ordre mélangé par graine) : les quatre libellés du § 5.10.
- **Interaction et correction** : vote corrigé serveur, noté (participation) ; le texte du rappel est
  enregistré en réponse libre (`activityId: b2-01-a1-diagnostic:rappel`), non noté, jamais envoyé vide.
- **Notes** :
  - Action : projeter ; annoncer « question de reprise : seule la participation compte » ; 45 s
    d’écriture individuelle sans regarder les options, puis vote.
  - Observé : l’histogramme du pupitre et la confusion dominante (« +20 % » : division par la valeur
    d’arrivée).
  - Attendu : (100 − 80) / 80 = 0,25, soit +25 % ; le dénominateur est la valeur de départ.
  - Contrôle : 80 × 1,25 = 100. Si plus de 30 % de « +20 % », le noter : la question 5 de l’atelier 2
    (A3-07) repose la situation à l’envers, et l’atelier 1 (Q6) la retrouve dans le taux de marge.
  - Transition : « Cette question — quelle est la base ? — va vous suivre toute la journée. Voici
    l’entreprise pour laquelle vous travaillez. »

#### A1-02 · `B2-01-A1-02-ACCROCHE` — 1 min · v2 `hero` · catalogue · Modifié (S01)

- **Intention** : poser le titre, l’entreprise et l’enjeu.
- **Contenu (public)** :
  - Titre public : « Lire un chiffre, ce n’est pas le croire »
  - `title` « Lire un chiffre, ce n’est pas le croire »
  - `subtitle` « Atelier Rivage, voilerie de La Rochelle. Lundi, 9 h : le comité de direction se
    réunit jeudi. Votre mission : fiabiliser le tableau de bord 2025. »
  - `bullets` [« BTS Comptabilité et gestion · 1re année · module Traitement de l’information
    chiffrée », « 3 h 30 · 6 actes · 2 tâches de tableur · 2 mini-jeux · 1 billet de sortie »]
  - `bgImage` `/assets/cours/b2-01/v3/playfair-ecosse-1786.webp` (média M1) ; `bgImageAlt`
    « Graphique en barres de William Playfair (1786) : exportations et importations de l’Écosse avec
    ses partenaires commerciaux sur une année »
- **Modifications** : photo Pexels (licence Pexels, ni CC0 ni domaine public) remplacée par un
  document du domaine public ; « Deuxième année » corrigé en « 1re année ».
- **Notes** :
  - Action : lire le titre, présenter Atelier Rivage en une phrase, faire ouvrir le navigateur et la
    calculatrice.
  - Observé : le graphique en barres de 1786 en fond, le seul graphique en barres de l’atlas de
    Playfair : l’écran A2-01 y revient.
  - Attendu : aucun calcul ; faire dire à la classe à quoi sert un tableau de bord (décider).
  - Contrôle : chaque poste a rejoint la séance (compteur de participants au pupitre).
  - Transition : « Voici le courriel reçu ce matin. »

#### A1-03 · `B2-01-A1-03-MISSION` — 2 min · `fp-pro` · catalogue · Nouveau

- **Intention** : situer la mission professionnelle et la décision en jeu.
- **Contenu (public)** :
  - Titre public : « Votre mission chez Atelier Rivage »
  - `metier` « Assistant·e de gestion — Atelier Rivage (voilerie artisanale, 14 salariés, La
    Rochelle) »
  - `situation` « Lundi, 8 h 40. Hélène Garnier, la dirigeante, vous transfère le tableau de bord 2025
    préparé par Samir Haddad, responsable commercial : « Samir annonce une excellente année et veut
    investir dans la marketplace. Est-ce qu’on gagne vraiment plus qu’en 2024 ? Préparez-moi un
    dossier fiable pour le comité de jeudi. » »
  - `geste` « Avant de recommander un investissement, répondez à trois questions : que mesure chaque
    chiffre ? Les bases et les périodes sont-elles comparables ? Le recalcul confirme-t-il la recommandation ? »
  - `consequence` « Si le comité décide sur un chiffre mal lu, Atelier Rivage peut investir dans le
    canal qui dégrade sa rentabilité. »
- **Notes** :
  - Action : lecture à voix haute, classe entière, en 90 secondes.
  - Observé : la demande d’Hélène (« gagner plus ») et la proposition de Samir (investir).
  - Attendu : repérer que « gagner » peut désigner un montant ou un taux.
  - Contrôle : faire reformuler l’enjeu par un étudiant en une phrase.
  - Transition : « Regardons le tableau de bord tel qu’il a été envoyé. »

#### A1-04 · `B2-01-A1-04-TABLEAU-DE-BORD` — 2 min · v2 `table` · catalogue · Nouveau

- **Intention** : donner l’artefact de travail, avec ses défauts, sans les signaler.
- **Contenu (public)** :
  - Titre public : « Tableau de bord 2025 transmis au comité »
  - `title` « Tableau de bord 2025 transmis au comité » ; `subtitle` « Avant de calculer, repérez pour
    chaque ligne ce qu’elle mesure, sa base et sa période. »
  - `columns` : indicateur « Indicateur », a2024 « 2024 », a2025 « 2025 », evolution « Évolution
    affichée »
  - `rows` (libellés de Samir, reproduits tels quels) :

    | Indicateur                                  | 2024        | 2025        | Évolution affichée |
    | ------------------------------------------- | ----------- | ----------- | ------------------ |
    | CA HT total                                 | 1 050 000 € | 1 150 000 € | +9,5 %             |
    | CA HT de la marketplace                     | 357 000 €   | 523 000 €   | +46,5 %            |
    | Marge brute                                 | 289 800 €   | 291 000 €   | +1 200             |
    | Taux de marge                               | 27,6 %      | 25,3 %      | −2,3 %             |
    | Prix de la toile (€ par m², au 31 décembre) | 20,00       | 20,80       | +4 %               |
    | Inflation                                   | —           | 4,9         | —                  |

  - `note` « Données fictives Atelier Rivage, créées pour ce cours. »

- **Notes** :
  - Action : laisser une minute de lecture silencieuse ; ne rien commenter.
  - Observé : six lignes ; des pourcentages de natures différentes ; deux valeurs sans unité ; un
    libellé imprécis (« Taux de marge »).
  - Attendu : aucune réponse à ce stade ; l’activité suivante classe chaque ligne.
  - Contrôle : vérifier que tous les postes affichent le tableau (rechargement si besoin).
  - Transition : « Avant de discuter des chiffres, classons-les : que dit chacun ? »

#### A1-05 · `B2-01-A1-05-ANATOMIE` — 8 min · `fp-cardsort` · séance · Nouveau (reprend S08)

- **Intention** : faire nommer l’écriture de chaque chiffre (valeur, proportion, évolution, points,
  ambigu) : c’est la preuve « unité » de l’acte 1.
- **Concept · modalité** : `contrat-de-lecture` · binôme (discussion à deux, chacun envoie).
- **Contenu (public)** :
  - Titre public : « Que dit chaque chiffre du tableau de bord ? »
  - Intitulé du plan `b2-01-a1-anatomie` : « Classez chaque chiffre du tableau de bord selon ce qu’il
    exprime. »
  - Catégories : « Valeur en euros » ; « Proportion : part d’un total » ; « Évolution : variation par
    rapport à une valeur de départ » ; « Écart entre deux taux, en points » ; « Ambigu en l’état :
    unité, base ou période manquante ».
  - Cartes : « CA HT 2025 : 1 150 000 € » ; « CA : « +9,5 % » par rapport à 2024 » ; « Entretien :
    20 % du CA 2025 » ; « Taux de marge 2025 : 25,3 % » ; « Taux de marge : « −2,3 % » par rapport à
    2024 » ; « Marge brute : « +1 200 » (colonne « Évolution affichée », dont les autres lignes sont en
    %) » ; « Inflation : « 4,9 » » ; « Prix de la toile : « +4 % » sur l’année ».
- **Interaction et correction** : classement corrigé serveur carte par carte ; score = cartes bien
  placées ÷ 8 ; réussite si ≥ 6/8 ; chaque carte mal placée enregistre sa confusion ; verdict carte par
  carte renvoyé à l’étudiant (juste / à revoir) ; taux d’erreur par carte au pupitre.
- **Notes** :
  - Action : binômes, 5 min de tri (annoncer « plus qu’une minute » à 4 min), puis 3 min de correction
    au pupitre sur le taux d’erreur par carte ; rappeler que chacun envoie depuis son poste.
  - Observé : les cartes « Taux de marge : −2,3 % » et « Inflation : 4,9 » concentrent les erreurs.
  - Attendu : « −2,3 % » est un écart entre deux taux, donc des points, avec un libellé imprécis (il
    s’agit du taux de marge brute) ; « +1 200 » et « 4,9 » sont ambigus en l’état ; « Entretien : 20 %
    du CA » et « Taux de marge 2025 : 25,3 % » sont des proportions ; « +9,5 % » et « +4 % » sont des
    évolutions ; 1 150 000 € est une valeur.
  - Contrôle : faire justifier une carte par binôme avec la question « rapporté à quoi ? ».
  - Transition : « Un taux n’est une information que si l’on connaît sa fiche d’identité. »

#### A1-06 · `B2-01-A1-06-FICHE-INDICATEUR` — 3 min · v2 `grid` · catalogue · Modifié (S05, S06, S13)

- **Intention** : institutionnaliser le contrat de lecture d’un taux sur l’exemple 27,6 %, définir le
  taux de marge brute et distinguer les trois usages du mot « taux de marge » ; poser la formule de
  l’évolution avant l’atelier 1.
- **Contenu (public)** :
  - Titre public : « 27,6 % : la fiche d’identité d’un taux »
  - `title` « 27,6 % : la fiche d’identité d’un taux » ; `subtitle` « Un taux devient une
    information quand on sait ce qu’il rapporte, à quoi, quand, pour qui et d’où il vient. »
  - `items` (recto `description`, verso `back`) :
    - Mesure · « Quel indicateur ? » · « Taux de marge brute (sur CA HT) = marge brute ÷ CA HT. Ici,
      marge brute = CA HT − coûts directs (matière, sous-traitance, commissions) : c’est une marge
      sur coûts directs. »
    - Base · « Rapporté à quoi ? » · « 289 800 € de marge brute pour 1 050 000 € de CA HT. Pour une
      évolution, la base est la valeur de départ : t = (y₂ − y₁) ÷ y₁, donc y₂ = (1 + t) × y₁. »
    - Période · « Quand ? » · « Exercice 2024, du 1er janvier au 31 décembre. »
    - Périmètre · « Pour qui ? » · « Atelier Rivage, trois canaux : sur-mesure, entretien,
      marketplace. »
    - Source · « D’où vient le montant ? » · « Compte de résultat 2024 et grand livre (comptes de
      produits et de charges directes). »
    - Un mot, trois taux · « « Taux de marge » : lequel ? » · « Taux de marge = marge ÷ coût d’achat HT
      (une hausse depuis le coût). Taux de marque = marge ÷ prix de vente HT (une part du prix). Taux de
      marge commerciale = marge commerciale ÷ ventes de marchandises (soldes intermédiaires de
      gestion). Écrivez toujours le dénominateur. »
- **Modifications** : fusion de S05 et S06 ; la définition fausse « taux de marge commercial, calculé
  sur le coût d’achat » est remplacée (TER-01) ; carte « Un mot, trois taux » ajoutée ; formule de
  l’évolution reprise de S13.
- **Notes** :
  - Action : retourner les six cartes une à une, classe entière.
  - Observé : 27,6 % n’a de sens qu’avec ses cinq réponses ; le même mot « taux de marge » désigne trois
    rapports.
  - Attendu : 289 800 ÷ 1 050 000 = 0,276 ; « pour 100 € de CA HT, il reste 27,60 € de marge brute » ;
    un taux de marge se rapporte au coût, un taux de marque au prix de vente.
  - Contrôle : demander ce qui manque à « Inflation : 4,9 » (unité, période, source) et quel
    dénominateur il faudrait écrire à côté de « Taux de marge » dans le tableau de Samir (le CA HT).
  - Transition : « Voici le plan pour que chaque chiffre du dossier ait sa fiche. »

#### A1-07 · `B2-01-A1-07-PLAN` — 2 min · v2 `method-path` · catalogue · Modifié (S02, S10)

- **Intention** : organiser la séance (organisateur préalable) ; chaque étape = un acte.
- **Contenu (public)** :
  - Titre public : « Votre plan jusqu’à jeudi »
  - `title` « Votre plan jusqu’à jeudi » ; `subtitle` « Six gestes, six actes : chaque acte se termine
    par une preuve que vous savez faire. »
  - `steps` :

    | id         | title                           | question                              | proof                                            | result                                          |
    | ---------- | ------------------------------- | ------------------------------------- | ------------------------------------------------ | ----------------------------------------------- |
    | lire       | Acte 1 · Lire                   | Que mesure chaque chiffre ?           | Unité, base, période, périmètre, source.         | Un tableau de bord dont chaque ligne a un sens. |
    | comparer   | Acte 2 · Comparer               | Compare-t-on la même chose ?          | Population de référence, axe, ordre de grandeur. | Des comparaisons honnêtes.                      |
    | evoluer    | Acte 3 · Raconter une évolution | Quelle base, quel coefficient ?       | Écart, taux, coefficient, indice.                | Des évolutions justes, même successives.        |
    | outiller   | Acte 4 · Outiller               | La feuille se contrôle-t-elle seule ? | Formules, références, contrôles, graphique.      | Un classeur qu’un tiers peut refaire.           |
    | defendre   | Acte 5 · Défendre               | Quel mécanisme explique l’écart ?     | Poids, répartition, preuve, limite.              | Une recommandation argumentée.                  |
    | transferer | Acte 6 · Transférer             | Saurez-vous le refaire seul·e ?       | Mini-jeu, erreur d’IA corrigée, rappel.          | Des réflexes durables.                          |

- **Notes** :
  - Action : parcourir les six étapes en 90 secondes.
  - Observé : la colonne « preuve » annonce ce qui sera demandé à chaque acte.
  - Attendu : chacun sait où il en est et ce qui compte pour la note (la participation, § 4.5).
  - Contrôle : question rapide : « quel acte produit le graphique du comité ? » (l’acte 4).
  - Transition : « Première preuve : transformer la question d’Hélène. »

#### A1-08 · `B2-01-A1-08-QUESTION-DE-GESTION` — 3 min · v2 `reflection` · séance · Nouveau (remplace S11)

- **Intention** : transformer une inquiétude en question mesurable (preuve « question de gestion »).
- **Contenu (public)** :
  - Titre public : « La question d’Hélène, en chiffres »
  - `promptData.id` `b2-01-a1-question-gestion`
  - `question` « Hélène demande : « Est-ce qu’on gagne vraiment plus qu’en 2024 ? » Réécrivez sa
    question pour qu’un chiffre puisse y répondre : quel indicateur, rapporté à quoi, sur quelle
    période, pour quel périmètre ? »
  - `placeholder` « Indicateur… rapporté à… entre… et… pour… »
  - `context` « Une question de gestion devient traitable quand on sait quel chiffre y répond. »
  - `competency` « S’informer · formuler une question mesurable »
- **Corrigé réservé** (`correction`) : `expected` « Par exemple : la marge brute d’Atelier Rivage
  (trois canaux) a-t-elle augmenté entre 2024 et 2025, en euros et rapportée au CA HT ? Deux
  réponses sont attendues : un montant et un taux. » ; `nextAction` « Cette question ouvrira la
  recommandation de l’acte 5. »
- **Interaction et correction** : réponse libre enregistrée (file hors ligne partagée), non notée ;
  lue par le formateur dans le panneau des réponses libres.
- **Notes** :
  - Action : écriture individuelle 2 min ; lire trois réponses anonymisées au pupitre.
  - Observé : les réponses qui oublient la période ou le périmètre.
  - Attendu : indicateur (marge brute), base (CA HT), période (2024 → 2025), périmètre (trois
    canaux) ; deux mesures : un montant et un taux.
  - Contrôle : chaque réponse lue doit permettre de dire quel chiffre la tranche.
  - Transition : « Samir a déjà répondu à sa façon : avec une diapositive. »

#### A1-09 · `B2-01-A1-09-DIAPOSITIVE` — 2 min · v2 `chart` · catalogue · Nouveau (reprend S03, S04)

- **Intention** : présenter la pièce trompeuse telle quelle ; elle est jugée à l’écran suivant.
- **Contenu (public)** :
  - Titre public : « La diapositive de Samir »
  - `title` « Marge brute : une croissance continue » (titre de Samir, reproduit tel quel) ; `caption`
    « Diapositive 3 du support commercial » ; `context` « Voici la diapositive que Samir veut
    projeter jeudi. »
  - `labels` ["2022", "2023", "2024", "2025"] ; `series` [{ label « Marge brute », values [285000,
    288000, 289800, 291000], tone gold }] ; `axisRanges` [[284000, 292000]] ; `axisLabels`
    [« 284 000 à 292 000 € »] ; `unit` « € »
  - `reading` « Lecture proposée par le service commercial : « la marge brute progresse nettement
    chaque année ». » ; `source` « Service commercial d’Atelier Rivage (données fictives). »
  - `description` (alternative textuelle) « Diagramme en barres : marge brute de 2022 à 2025, axe
    vertical de 284 000 € à 292 000 € ; barres de 285 000 €, 288 000 €, 289 800 € et 291 000 €. »
- **Notes** :
  - Action : projeter 30 secondes sans commentaire, puis demander « peut-on la montrer jeudi ? ».
  - Observé : la barre 2025 est sept fois plus haute que celle de 2022 (12,5 % et 87,5 % de la hauteur
    de l’échelle).
  - Attendu : aucune réponse orale ; les vérifications s’écrivent à l’écran suivant.
  - Contrôle : ce graphique n’est pas un des quatre graphiques de référence (§ 5.7) : c’est une pièce
    à auditer, volontairement non conforme.
  - Transition : « Écrivez ce que vous vérifieriez avant de répondre à Hélène. »

#### A1-10 · `B2-01-A1-10-AUDIT-DIAPOSITIVE` — 3 min · `fp-challenge` · séance · Nouveau (reprend S37)

- **Intention** : faire produire les vérifications d’un graphique avant de les enseigner (effet de
  génération).
- **Concept · modalité** : `lecture-graphique` · solo.
- **Contenu (public)** :
  - Titre public : « Audit de la diapositive »
  - `id` `b2-01-a1-audit-diapositive` ; `enonce` « Sur la diapositive de Samir, la barre 2025 est sept
    fois plus haute que la barre 2022. Hélène demande si elle peut la projeter telle quelle jeudi. » ;
    `invite` « Écrivez trois vérifications à faire avant de lui répondre, puis votre réponse en une
    phrase. » ; `strategies` [] à l’envoi initial.
- **Stratégies de référence (corrigé)** : `axe` « Lire l’origine et l’amplitude de l’axe vertical
  avant de comparer les hauteurs. » ; `evolution` « Calculer l’évolution réelle entre 2022 et 2025
  avant de parler de croissance. » ; `titre` « Vérifier que le titre décrit la mesure au lieu de
  conclure. » ; `montant` « Comparer la marge au CA : un montant ne dit rien de la rentabilité. » ;
  `couleur` (fausse) « Changer la couleur des barres pour rendre le graphique plus neutre. »
- **Interaction et correction** : tentative envoyée par la route des défis ; la première tentative
  est figée ; les stratégies (sans le drapeau `fausse`) reviennent après l’envoi ; le drapeau est servi
  quand le formateur déclenche la révélation.
- **Notes** :
  - Action : 2 min d’écriture individuelle, puis révélation au pupitre et 1 min de mise en commun.
  - Observé : les étudiants qui citent l’axe et ceux qui citent seulement la couleur ou le titre.
  - Attendu : axe tronqué (284 000 €), évolution réelle à calculer, titre interprétatif, comparaison
    au CA ; la couleur ne prouve rien.
  - Contrôle : faire repérer la stratégie fausse avant de la révéler.
  - Transition : « Le calcul de l’évolution réelle ouvrira l’atelier de l’acte 2. »

#### A1-11 · `B2-01-A1-11-JALON-1` — 1 min · `fp-pulse` · séance · Nouveau

- **Contenu (public)** :
  - Titre public : « Jalon 1 : où en êtes-vous ? »
  - `id` `b2-01-a1-jalon` ; `invite` « Je sais dire ce que mesure chaque chiffre du tableau de bord :
    unité, base, période. » ; réponses anonymes « Perdu · Ça va · C’est clair ».
- **Notes** :
  - Action : 30 secondes de vote anonyme ; afficher l’agrégat (masqué en projection sous 5 réponses).
  - Observé : la répartition perdu / ça va / clair.
  - Attendu : au moins 60 % « ça va » ou « c’est clair ».
  - Contrôle : si « perdu » dépasse 30 %, reprendre la fiche A1-06 en 2 min avec « Inflation : 4,9 ».
  - Transition : « Acte 2 : comparer sans tromper, en commençant par l’inventeur des graphiques
    économiques. »

### 3.3 Acte 2 — Comparer sans tromper (36 min)

#### A2-01 · `B2-01-A2-01-PLAYFAIR` — 2 min · v2 `image-left` · catalogue · Modifié (S30)

- **Contenu (public)** :
  - Titre public : « 1786 : le graphique devient un langage »
  - `title` « 1786 : le graphique devient un langage » ; `subtitle` « En 1786, William Playfair publie
    les premiers graphiques en courbes et en barres de données économiques. Un coup d’œil peut aussi
    tromper. »
  - `image` `/assets/cours/b2-01/v3/playfair-series-1786.webp` (média M2) ; `imageAlt` « Graphique de
    William Playfair (1786) : exportations et importations de l’Angleterre avec le Danemark et la
    Norvège, de 1700 à 1780, deux courbes dont l’écart figure la balance commerciale »
  - `paragraphs` [« Vingt ans plus tôt, Joseph Priestley avait déjà placé des vies sur une frise
    chronologique (A Chart of Biography, 1765). Playfair, lui, trace des données économiques : dans
    The Commercial and Political Atlas, la balance commerciale de l’Angleterre se lit dans l’écart
    entre deux courbes. », « Son atlas compte 43 courbes et un seul graphique en barres : pour
    l’Écosse, faute de série sur plusieurs années, il compare 17 partenaires sur une seule année. La
    forme suit la donnée disponible. », « Le graphique accélère la comparaison ; il ne remplace ni les
    valeurs, ni l’axe, ni la source. C’est ce contrat de lecture que vous appliquez à la diapositive
    de Samir. »]
  - `items` [« Titre », « Axes et échelle », « Séries », « Source »]
  - `sourceLink` { href https://commons.wikimedia.org/wiki/File:Playfair_TimeSeries.png, label
    « Document original · Wikimedia Commons (domaine public) » }
- **Modifications** : image et lien alignés sur le même fichier (le deck liait
  `Playfair_TimeSeries-2.png`) ; « Playfair invente les courbes et les barres » nuancé (Priestley, 1765) ; le graphique en barres du fond de A1-02 est expliqué.
- **Notes** :
  - Action : raconter en une minute ; montrer l’écart entre les deux courbes, puis rappeler le
    graphique en barres du fond de A1-02 (l’Écosse, une seule année).
  - Observé : titre, axes gradués, deux séries, légende.
  - Attendu : les quatre éléments du contrat de lecture graphique ; la forme suit la donnée.
  - Contrôle : « qu’est-ce qui manque sur la diapositive de Samir ? » (une échelle honnête).
  - Transition : « Faites l’expérience : déplacez vous-même l’origine et le haut de l’axe. »

#### A2-02 · `B2-01-A2-02-ORIGINE-AXE` — 2 min · `fp-plot` · catalogue · Modifié (S04, S32)

- **Contenu (public)** :
  - Titre public : « Déplacez l’origine de l’axe »
  - `definition` : `id` `b2-01-a2-origine-axe` ; `titre` « Marge brute d’Atelier Rivage, 2022–2025 :
    déplacez l’origine et le haut de l’axe » ; `source` « Données fictives Atelier Rivage » ;
    `abscisse` { libelle « Année (0 = 2022, 3 = 2025) », min 0, max 3 } ; `ordonnee` « Marge brute
    (€) » ; `bornesOrdonnee` { minParametre « origine », maxParametre « maximum » } ; `parametres`
    [{ cle « origine », libelle « Origine de l’axe vertical (€) », min 0, max 284000, pas 4000,
    defaut 284000 }, { cle « maximum », libelle « Haut de l’axe vertical (€) », min 292000, max 600000,
    pas 4000, defaut 292000 }] ; `series` [{ id « marge », libelle « Marge brute », trait « plein »,
    calcul `SI(x<=1;285000+3000*x;SI(x<=2;288000+1800*(x-1);289800+1200*(x-2)))` }]
  - `description` « Courbe de la marge brute de 2022 à 2025 ; deux curseurs règlent le bas et le haut de
    l’axe vertical ; au départ, l’axe va de 284 000 € à 292 000 €, comme sur la diapositive de
    Samir. »
- **Notes** :
  - Action : chaque étudiant fait glisser l’origine de 284 000 € à 0 €, puis le haut de l’axe de
    292 000 € à 600 000 €.
  - Observé : la pente s’écrase, les valeurs ne changent pas ; le premier affichage reproduit la
    diapositive de A1-09.
  - Attendu : « l’échelle change l’impression, pas la donnée ».
  - Contrôle : faire lire la valeur 2025 dans les deux positions (291 000 €).
  - Transition : « Atelier 1 : lire, rapporter, estimer. »

#### A2-03 · `B2-01-A2-03-ATELIER-1` — 14 min · `questionnaire` (régime `focus`, ordre `fixe`) · séance · Nouveau

- **Intention** : évaluer la lecture critique, la proportion, la population de référence,
  l’évolution, l’ordre de grandeur et la distinction taux de marge / taux de marque (preuve de
  l’acte 2).
- **Contenu (public)** :
  - Titre public : « Atelier 1 — Lire, rapporter, estimer »
  - `intitule` « Atelier 1 — Lire, rapporter, estimer » ; `consigne` « Calculatrice autorisée, sauf
    pour la question sur le nombre de commandes (ordre de grandeur). Répondez seul·e, puis comparez
    avec votre voisin·e avant la correction. »
  - Questions (ordre fixe) :
    1. `b2-01-a2-evolution-marge` (vote) « La diapositive de Samir montre une marge brute passée de
       285 000 € (2022) à 291 000 € (2025). Quelle évolution réelle représente-t-elle ? »
    2. `b2-01-a2-part-marketplace` (numérique, « % ») « En 2025, la marketplace réalise 523 000 € d’un
       CA HT total de 1 150 000 €. Quelle part du CA représente-t-elle ? Réponse en %, arrondie au
       dixième. »
    3. `b2-01-a2-population-reference` (vote) « La marketplace traite 4 200 des 5 000 commandes de
       2025, soit 84 %. Samir en conclut qu’elle réalise « l’essentiel du chiffre d’affaires ». Que
       lui répondez-vous ? »
    4. `b2-01-a2-evolution-sur-mesure` (numérique, « % ») « Le CA HT du sur-mesure passe de 483 000 €
       (2024) à 397 000 € (2025). Quel est son taux d’évolution ? Réponse en %, arrondie au centième,
       signe compris. »
    5. `b2-01-a2-ordre-de-grandeur` (vote) « Sans calculatrice : le nombre de commandes de la
       marketplace passe de 2 900 (2024) à 4 200 (2025). La hausse est d’environ… »
    6. `b2-01-a2-marge-marque` (vote) « Atelier Rivage achète un sac étanche 80 € HT à son atelier
       partenaire et le revend 100 € HT. Quelle affirmation est exacte ? »
- **Notes** :
  - Action : 9 min de travail (annoncer « plus que 2 minutes » à 7 min), puis 5 min de correction
    question par question au pupitre.
  - Observé : taux de réussite et confusion dominante par question ; pour Q6, la part de « taux de
    marque 25 % ».
  - Attendu : Q1 +2,1 % en trois ans (6 000 ÷ 285 000) ; Q2 45,5 ; Q3 une part des commandes n’est pas
    une part du CA ; Q4 −17,81 ; Q5 environ +45 % (1 300 ÷ 2 900) ; Q6 taux de marque 20 % (20 ÷ 100),
    taux de marge 25 % (20 ÷ 80, la même hausse qu’en A1-01).
  - Contrôle : Q2 : 1 150 000 × 0,455 ≈ 523 000 ; Q4 : 483 000 × (1 − 0,1781) ≈ 397 000 ; Q5 :
    2 900 × 1,45 ≈ 4 200 ; Q6 : 80 × 1,25 = 100 et 100 × 0,80 = 80.
  - Transition : « Remettons la diapositive de Samir d’aplomb. »

#### A2-04 · `B2-01-A2-04-MARGE-AXE-ZERO` — 2 min · v2 `chart` (G1) · séance · Modifié (S32)

- **Contenu (public)** :
  - Titre public : « Marge brute 2022–2025, axe à zéro »
  - `title` « Marge brute d’Atelier Rivage, 2022–2025 » ; `caption` « Axe vertical de 0 à 300 000 € » ;
    `labels` ["2022", "2023", "2024", "2025"] ; `series` [{ label « Marge brute », values [285000,
    288000, 289800, 291000], tone teal }] ; `axisRanges` [[0, 300000]] ; `axisLabels` [« 0 à
    300 000 € »] ; `unit` « € »
  - `formula` « Évolution 2022–2025 = (291 000 − 285 000) ÷ 285 000 ≈ 0,021 »
  - `reading` « La marge brute passe de 285 000 € à 291 000 € : +6 000 € en trois ans, soit +2,1 %. La
    progression est réelle mais faible, et elle ralentit chaque année. »
  - `source` « Comptes de résultat 2022 à 2025 d’Atelier Rivage (données fictives). »
  - `description` « Diagramme en barres à partir de zéro : quatre barres presque égales, de 285 000 € en
    2022 à 291 000 € en 2025. »
- **Notes** :
  - Action : projeter à côté de la diapositive de Samir (deux onglets) si possible.
  - Observé : des barres presque égales ; une phrase de lecture qui donne l’écart en euros et en %.
  - Attendu : titre descriptif, unité, source, phrase de lecture chiffrée : les quatre exigences d’un
    graphique de référence ; l’écart absolu et le taux se complètent (S12, S14).
  - Contrôle : les hausses annuelles ralentissent : +1,05 %, +0,63 %, +0,41 %.
  - Transition : « Cinq écritures reviennent sans cesse : fixons-les. »

#### A2-05 · `B2-01-A2-05-ECRITURES` — 2 min · v2 `stats` · séance · Modifié (S08, S12)

- **Contenu (public)** :
  - Titre public : « Cinq écritures, cinq questions »
  - `title` « Cinq écritures, cinq questions » ; `subtitle` « Chaque écriture répond à une question
    différente ; les mélanger dans une note crée une erreur de décision. »
  - `stats` : « 100 000 € » · « valeur : combien ? (hausse du CA HT en 2025) » ; « 20 % » ·
    « proportion : quelle part du total ? (l’entretien dans le CA 2025) » ; « +9,5 % » · « évolution :
    de combien par rapport au départ ? (CA HT 2024 → 2025) » ; « −2,3 points » · « écart entre deux
    taux (taux de marge brute 2024 → 2025) » ; « indice 112 » · « niveau relatif : +12 % par rapport à
    la base 100 ».
- **Notes** :
  - Action : faire associer chaque écriture à une carte de A1-05.
  - Observé : la différence entre « +9,5 % » (évolution) et « 20 % » (proportion) ; entre 100 000 €
    (valeur) et +9,5 % (taux).
  - Attendu : un pourcentage exprime soit une proportion, soit une évolution ; un écart entre deux
    taux s’écrit en points ; un indice se lit par rapport à 100.
  - Contrôle : « −2,3 % » du tableau de bord : quelle écriture aurait dû être utilisée ?
  - Transition : « Rédigeons la phrase juste sur le taux de marge brute. »

#### A2-06 · `B2-01-A2-06-POINTS` — 5 min · `fp-worked` · séance · Modifié (S16)

- **Concept · modalité** : `point-de-pourcentage` · solo.
- **Contenu (public)** :
  - Titre public : « Points ou pourcentage : la phrase du comité »
  - `exemple` : `id` `b2-01-a2-points` ; `enonce` « Le taux de marge brute passe de 27,60 % (2024) à
    25,30 % (2025). Hélène veut une phrase juste pour le comité. » ; `etayage` initial 3.
  - `etapes` :
    1. `ecart` · « Écart entre les deux taux » · « 25,30 − 27,60 = −2,30. Un écart entre deux
       pourcentages se mesure en points de pourcentage : −2,30 points. » · invite « Écrivez l’écart
       avec son unité. »
    2. `relatif` · « Évolution relative du taux » · « −2,30 ÷ 27,60 ≈ −0,083, soit −8,3 % : le taux
       lui-même a perdu 8,3 % de sa valeur. » · invite « Calculez l’évolution relative en précisant la
       base. »
    3. `phrase` · « Phrase pour le comité » · « « Le taux de marge brute recule de 2,3 points (de
       27,6 % à 25,3 %), soit une baisse relative de 8,3 %. » » · invite « Rédigez la phrase sans
       écrire « −2,3 % ». »
    4. `controle` · « Contrôle » · « 27,60 × (1 − 0,083) ≈ 25,31 : l’évolution relative redonne le
       taux d’arrivée, à l’arrondi près. » · invite « Faites le contrôle inverse. »
- **Interaction et correction** : étayage dégressif piloté par le formateur (`pilotage.etayage`, de 4
  à 0) ; une réponse libre par étape rédigée (`activityId: b2-01-a2-points:<etape>`), non notée.
- **Notes** :
  - Action : première étape commentée, les suivantes rédigées par les étudiants ; baisser l’étayage à
    2 si la classe a réussi A1-05.
  - Observé : ceux qui écrivent « −2,3 % » à l’étape 3.
  - Attendu : −2,30 points ; −8,3 % en relatif ; une phrase qui contient les deux taux.
  - Contrôle : 27,6 × 0,917 = 25,31 (écart d’arrondi assumé).
  - Transition : « Mini-jeu : tout n’est pas comparable. »

#### A2-07 · `B2-01-A2-07-JEU-COMPARABLE` — 8 min · `fp-cardsort` · séance · Mini-jeu 1 · Modifié (S07)

- **Intention** : décider vite si deux chiffres sont comparables (base commune) : mini-jeu chronométré
  en binôme, score affiché, débriefing sur la carte la plus ratée.
- **Concept · modalité** : `contrat-de-lecture` · binôme (chacun envoie).
- **Contenu (public)** :
  - Titre public : « Mini-jeu : comparable ou pas ? »
  - Intitulé du plan `b2-01-a2-comparable` : « Mini-jeu : comparable ou pas ? Classez les neuf
    comparaisons avant la fin du chrono. » ; `dureeJeuMs` 300000 (compte à rebours affiché, sans
    blocage de l’envoi).
  - Catégories : « Comparable directement » ; « Comparable après retraitement » ; « Pas comparable
    sans nouvelle donnée ».
  - Cartes : « CA de mars 2025 / CA de mars 2024 » ; « Taux de marge brute 2024 / 2025 d’Atelier
    Rivage (même définition) » ; « CA par salarié 2025 (14 salariés) / CA par salarié 2024
    (12 salariés) » ; « Marge brute HT 2025 / ventes TTC 2025 » ; « Prix de la toile en € par m² /
    prix en € par rouleau de 50 m² » ; « CA 2025 d’Atelier Rivage (trois canaux) / CA 2024 de
    l’atelier seul, sans la marketplace » ; « Taux de marge brute d’Atelier Rivage / « taux de marge
    moyen des voileries » lu dans la presse » ; « Hausse des tarifs d’Atelier Rivage en 2025 /
    « Inflation : 4,9 » du tableau de bord » ; « CA du 1er semestre 2025 / CA annuel 2024 (le fichier
    2024 ne contient que le total annuel) ».
- **Interaction et correction** : classement corrigé serveur ; score x/9 renvoyé et affiché ; réussite
  si ≥ 7/9 ; le pupitre affiche le taux d’erreur par carte.
- **Notes** :
  - Action : lancer le chrono (5 min, annoncer la dernière minute), puis 3 min de débriefing sur les
    deux cartes les plus ratées.
  - Observé : le score médian de la classe et les cartes les plus ratées.
  - Attendu : directes : mars/mars, taux 2024/2025, CA par salarié ; après retraitement : HT/TTC,
    m²/rouleau, périmètre (retirer la marketplace du CA 2025) ; impossibles sans nouvelle donnée :
    taux sectoriel, inflation de 2023, semestre/année.
  - Contrôle : pour chaque retraitement, faire dire l’opération (÷ 1,2 ; ÷ 50 ; − 523 000 €) ; pour le
    semestre : l’activité est saisonnière, doubler un semestre ne donne pas l’année.
  - Transition : jalon de confiance, puis acte 3.

#### A2-08 · `B2-01-A2-08-JALON-2` — 1 min · `fp-pulse` · séance · Nouveau

- **Contenu (public)** :
  - Titre public : « Jalon 2 : où en êtes-vous ? »
  - `id` `b2-01-a2-jalon` ; `invite` « Je sais choisir la bonne base et repérer une comparaison
    trompeuse (axe, population de référence, taux de marge ou de marque). »
- **Notes** :
  - Action : vote anonyme 30 secondes.
  - Observé : l’agrégat perdu / ça va / clair.
  - Attendu : au moins 60 % « ça va » ou « c’est clair ».
  - Contrôle : au-delà de 30 % « perdu », reprendre la Q3 de l’atelier 1 (commandes / CA) et la Q6
    (coût / prix de vente).
  - Transition : « Acte 3 : un prix monte, puis redescend. »

### 3.4 Acte 3 — Raconter une évolution (36 min)

#### A3-01 · `B2-01-A3-01-VOTE-HAUSSE-BAISSE` — 8 min · `fp-vote` (instruction par les pairs) · séance · Modifié (S17, S21, S22)

- **Intention** : faire émerger la fausse symétrie des évolutions successives par un vote, un débat
  entre pairs et un second vote sur un cas jumeau (on vérifie le transfert, pas une simple revote).
- **Concept · modalité** : `evolutions-successives` · solo, puis binôme pour le débat.
- **Contenu (public)** :
  - Titre public : « Vote : +10 %, puis −10 % »
  - `question` `b2-01-a3-sac-v1` : « Atelier Rivage augmente de 10 % le prix de son sac étanche en
    mars, puis le baisse de 10 % en septembre. Par rapport au prix de départ, le prix final est… »
  - `questionJumelle` `b2-01-a3-remise-v2` (affichée à partir de la phase `revote`) : « Une voile au
    prix catalogue de 4 000 € HT bénéficie d’une remise de 10 %, puis d’une seconde remise de 2 %
    calculée sur le net. De quel pourcentage le net commercial est-il inférieur au prix catalogue ? »
- **Révélation (déroulé)** : projetée en phase `revele` seulement. Titre « Pourquoi le prix ne revient
  pas à son point de départ » ; lignes « 100 × 1,10 = 110, puis 110 × 0,90 = 99 : la baisse s’applique
  à 110, pas à 100. » ; « Coefficient global : 1,10 × 0,90 = 0,99, soit −1 %. » ; « Remises :
  0,90 × 0,98 = 0,882 : le net est inférieur de 11,8 % au prix catalogue (3 528 € HT), pas de 12 %. »
- **Interaction et correction** : phases pilotées et persistées (`pilotage.phase`) : `vote` (2 min,
  principale seule) → `discussion` (3 min, tout vote refusé) → `revote` (2 min, jumelle seule) →
  `revele` (1 min, jumelle encore acceptée pour les retardataires). Deux réponses notées distinctes.
- **Notes** :
  - Action : vote individuel sans calculatrice ; si 30 à 70 % de bonnes réponses, débat en binôme
    « convainquez votre voisin » ; sinon, passer directement à `revote`.
  - Observé : l’histogramme du vote 1 (par option stable, toutes graines confondues), puis le gain
    entre vote 1 et vote 2.
  - Attendu : 100 × 1,10 × 0,90 = 99 : inférieur de 1 % ; 0,90 × 0,98 = 0,882 : 11,8 % (net 3 528 € HT).
  - Contrôle : la seconde variation s’applique à la valeur devenue courante (110, pas 100) ; une
    seconde remise « sur le net » est une réduction commerciale, pas un escompte.
  - Transition : « Manipulez la machine à coefficients pour voir pourquoi. »

#### A3-02 · `B2-01-A3-02-MACHINE-COEFFICIENTS` — 2 min · `fp-concept4` · séance · Modifié (S13, S18, S19)

- **Contenu (public)** :
  - Titre public : « La machine à coefficients »
  - `definition` : `id` `b2-01-a3-machine` ; `parametres` [{ cle « depart », libelle « Valeur de départ
    (€) », min 1, max 200, pas 1, defaut 100 }, { cle « tauxUn », libelle « Premier taux (%) », min −50,
    max 50, pas 1, defaut 10 }, { cle « tauxDeux », libelle « Second taux (%) », min −50, max 50, pas 1,
    defaut −10 }] ; `formuleLatexSimplifie` « arrivée = départ × (1 + t₁) × (1 + t₂) » ; `calcul`
    `depart * (1 + tauxUn / 100) * (1 + tauxDeux / 100)` ; `phrase` « Chaque taux s’applique à la
    valeur devenue courante : on multiplie les coefficients, on n’additionne pas les taux. Taux
    d’évolution = (arrivée − départ) ÷ départ. »
- **Contrainte d’implémentation** : les noms de variables ne contiennent que des lettres (`tauxUn`, pas
  `t1`, que le moteur lit comme la cellule T1).
- **Notes** :
  - Action : faire tester +50 % puis −50 % (résultat 75).
  - Observé : le résultat n’est jamais la valeur de départ tant que les deux taux sont opposés et non
    nuls.
  - Attendu : coefficient global = produit des coefficients ; taux global = coefficient − 1 ; une
    baisse s’écrit avec un signe moins.
  - Contrôle : 1,5 × 0,5 = 0,75, soit −25 %.
  - Transition : « Conséquence pour la marge du sac. »

#### A3-03 · `B2-01-A3-03-PRIX-SAC` — 1 min · v2 `chart` · séance · Conservé (S17, adapté au fil rouge)

- **Contenu (public)** :
  - Titre public : « Le sac étanche : prix et marge »
  - `title` « Prix du sac étanche : +10 %, puis −10 % » ; `caption` « 100 ventes par période ; coût
    d’achat unitaire : 80 € HT » ; `kind` line ; `unit` « € HT par sac » ; `labels` [« Prix initial »,
    « Après +10 % », « Après −10 % »] ; `series` [{ « Prix de vente unitaire », [100, 110, 99], teal },
    { « Coût d’achat unitaire », [80, 80, 80], ink }, { « Marge unitaire », [20, 30, 19], gold }] ;
    `axisRanges` [[0, 120]]
  - `formula` « Prix : 100 × 1,10 × 0,90 = 99 € · CA : 10 000 → 11 000 → 9 900 € · marge totale :
    2 000 → 3 000 → 1 900 € »
  - `reading` « Après la baisse, le prix (99 €) reste sous le prix initial : −1 %. Avec un coût
    inchangé, la marge unitaire tombe à 19 € et la marge totale perd 100 €, soit −5 %. »
  - `source` « Cas Atelier Rivage (données fictives) : 100 ventes à chaque période, coût d’achat
    constant. »
  - `description` « Trois courbes étiquetées : prix de vente 100, 110 puis 99 € ; coût d’achat constant
    à 80 € ; marge unitaire 20, 30 puis 19 €. »
- **Modification** : source « Atelier Nord » remplacée par Atelier Rivage ; placé **après** le vote
  (il en est la correction).
- **Notes** :
  - Action : commenter la seule courbe de marge, en 45 secondes.
  - Observé : −1 % sur le prix devient −5 % sur la marge.
  - Attendu : quand la marge ne représente que 20 % du prix, une petite variation du prix pèse cinq
    fois plus lourd sur la marge.
  - Contrôle : (19 − 20) ÷ 20 = −5 %.
  - Transition : « Même raisonnement sur un achat : le fil technique. »

#### A3-04 · `B2-01-A3-04-FIL-TECHNIQUE` — 4 min · `fp-worked` · séance · Modifié (S15, S19, S56)

- **Concept · modalité** : `evolutions-successives` · solo.
- **Contenu (public)** :
  - Titre public : « Le fil technique : coefficients, base et TVA »
  - `exemple` : `id` `b2-01-a3-fil` ; `enonce` « Atelier Rivage achète son fil technique 12,50 € HT la
    bobine. Le fournisseur annonce +10 % au 1er avril, puis −8 % au 1er octobre. Le service
    commercial écrit : « au final, +2 % ». » ; `etayage` initial 3.
  - `etapes` :
    1. `coefficients` · « Traduire les taux » · « +10 % → × 1,10 ; −8 % → × 0,92. » · invite
       « Traduisez chaque taux en coefficient. »
    2. `global` · « Évolution globale » · « 1,10 × 0,92 = 1,012 : l’évolution globale est de +1,2 %, et
       non de +2 %. » · invite « Multipliez les coefficients, puis retirez 1. »
    3. `prix` · « Prix final » · « 12,50 × 1,012 = 12,65 € HT la bobine. » · invite « Calculez le prix
       final. »
    4. `base` · « Retrouver la base » · « Après la hausse d’avril, la bobine coûte 13,75 €. Prix
       initial = 13,75 ÷ 1,10 = 12,50 € : on divise par le coefficient, on ne retire pas 10 %. » ·
       invite « Retrouvez la valeur de départ à partir de la valeur d’arrivée. »
    5. `reciproque` · « Évolution réciproque » · « Pour annuler une hausse de 10 %, il faut multiplier
       par 1 ÷ 1,10 ≈ 0,909, soit une baisse d’environ 9,1 % ; une baisse de 10 % irait trop loin
       (13,75 × 0,90 = 12,375 €). » · invite « Calculez le taux réciproque. »
    6. `tva` · « Du TTC au HT » · « Une facture d’entretien affiche 3 600 € TTC (TVA 20 %). HT =
       3 600 ÷ 1,20 = 3 000 € : on divise par le coefficient 1,20. Retirer 20 % donnerait 2 880 €, ce
       qui est faux. Passer du TTC au HT, c’est une baisse de 1 − 1 ÷ 1,20 ≈ 16,67 %. Contrôle
       inverse : 3 000 × 1,20 = 3 600. » · invite « Retrouvez le HT, puis le taux de baisse du TTC vers
       le HT. »
- **Interaction et correction** : étayage dégressif piloté ; une réponse libre par étape rédigée,
  non notée.
- **Notes** :
  - Action : étapes 1 à 3 commentées rapidement ; 4 à 6 rédigées (étayage 3) ; 4 minutes au total.
  - Observé : ceux qui retirent 10 % de 13,75 € à l’étape 4 (12,375 €) et ceux qui retirent 20 % du TTC
    à l’étape 6 (2 880 €).
  - Attendu : +1,2 % ; 12,65 € ; 12,50 € ; −9,1 % ; 3 000 € et −16,67 %.
  - Contrôle : 12,65 ÷ 12,50 = 1,012 ; 3 000 × 1,20 = 3 600.
  - Transition : « À l’échelle de l’économie, le même calcul s’appelle l’inflation. »

#### A3-05 · `B2-01-A3-05-INFLATION-RYTHME` — 1 min · v2 `chart` (G2) · catalogue · Modifié (S24, S26)

- **Contenu (public)** :
  - Titre public : « Inflation annuelle en France, 2019–2025 »
  - `title` « Inflation annuelle en France, 2019–2025 » ; `caption` « Taux d’inflation annuel moyen
    (IPC), en % » ; `labels` ["2019", "2020", "2021", "2022", "2023", "2024", "2025"] ; `series`
    [{ « Inflation (IPC) », [1.1, 0.5, 1.6, 5.2, 4.9, 2.0, 0.9], teal }] ; `axisRanges` [[0, 6]] ;
    `unit` « % par an »
  - `reading` « Le taux culmine à 5,2 % en 2022, puis diminue : 2,0 % en 2024 et 0,9 % en 2025. »
  - `source` « Source : Insee, indice des prix à la consommation, « L’essentiel sur… l’inflation »,
    paru le 23 mars 2026. »
  - `description` « Diagramme en barres des taux d’inflation annuels moyens : 1,1 % en 2019, 0,5 % en
    2020, 1,6 % en 2021, 5,2 % en 2022, 4,9 % en 2023, 2,0 % en 2024 et 0,9 % en 2025. »
- **Modification** : source Banque mondiale remplacée par la source officielle française ; série
  prolongée à 2025 ; la lecture décrit le taux sans rien dire du niveau des prix (c’est la question 1
  de l’atelier 2).
- **Notes** :
  - Action : lire la série à voix haute, sans commentaire sur le niveau.
  - Observé : un taux par année.
  - Attendu : chaque barre mesure une hausse sur un an, en moyenne annuelle.
  - Contrôle : repérer que « 4,9 » du tableau de bord est la valeur de 2023.
  - Transition : « Avant l’atelier : comment passer d’une série à un indice et à un taux moyen. »

#### A3-06 · `B2-01-A3-06-INDICE-ET-TAUX-MOYEN` — 5 min · `fp-worked` · séance · Nouveau (N1, reprend S27)

- **Intention** : enseigner l’indice base 100 et le taux moyen (racine n-ième) avant l’atelier qui les
  évalue, avec d’autres nombres.
- **Concept · modalité** : `indice-base-100`, `taux-moyen` · solo.
- **Contenu (public)** :
  - Titre public : « Le loyer de l’atelier : indice et taux moyen »
  - `exemple` : `id` `b2-01-a3-indice-taux-moyen` ; `enonce` « Le loyer de l’atelier d’Atelier Rivage
    passe de 1 000 € (2021) à 1 060 € (2022), 1 123,60 € (2023) et 1 191,02 € (2024). Samir écrit :
    « +19,10 % en trois ans, donc +6,37 % par an ». » ; `etayage` initial 3.
  - `etapes` :
    1. `indice` · « Indice base 100 en 2021 » · « I = 100 × V ÷ V₀ : 2022 : 100 × 1 060 ÷ 1 000 =
       106,00 ; 2023 : 112,36 ; 2024 : 119,10. » · invite « Calculez l’indice de chaque année. »
    2. `lire` · « Lire un indice » · « 119,10 signifie +19,10 % depuis 2021 : taux = I ÷ 100 − 1. Ce
       n’est ni +119,10 %, ni un loyer de 119,10 €. » · invite « Traduisez l’indice 2024 en taux
       d’évolution. »
    3. `chainer` · « Chaîner des coefficients » · « Indice = 100 × produit des coefficients : 100 ×
       1,06 × 1,06 × 1,06 = 119,10. Additionner les taux (6 + 6 + 6 = 18) sous-estime la hausse. » ·
       invite « Retrouvez l’indice 2024 à partir des coefficients. »
    4. `taux-moyen` · « Taux annuel moyen » · « On cherche x tel que x³ = 1,19102 : x = 1,19102^(1/3) ≈
       1,0600, soit +6,00 % par an. Calculatrice : 1,19102 ^ (1 ÷ 3) ; tableur :
       =PUISSANCE(1,19102;1/3). » · invite « Calculez le taux annuel moyen avec la puissance 1/3. »
    5. `piege` · « Pourquoi pas 19,10 ÷ 3 ? » · « 19,10 ÷ 3 ≈ 6,37 % est faux : 1,0637³ ≈ 1,2035, et non
       1,1910. Diviser un taux global par le nombre d’années surestime le taux moyen. » · invite
       « Vérifiez en élevant 1,0637 au cube. »
- **Interaction et correction** : étayage dégressif piloté ; une réponse libre par étape rédigée, non
  notée.
- **Notes** :
  - Action : étapes 1 et 2 commentées ; 3 à 5 rédigées ; montrer la touche puissance de la calculatrice
    au vidéoprojecteur.
  - Observé : ceux qui lisent 119,10 comme +119,10 %, et ceux qui divisent 19,10 par 3.
  - Attendu : 106,00 ; 112,36 ; 119,10 ; +19,10 % ; 6,00 % par an ; 6,37 % faux.
  - Contrôle : 1,06³ = 1,191016 ; 1,0637³ ≈ 1,2035.
  - Transition : « Atelier 2 : rythme, niveau, indice, avec les données de l’Insee. »

#### A3-07 · `B2-01-A3-07-ATELIER-2` — 10 min · `questionnaire` (régime `focus`, ordre `fixe`) · séance · Nouveau (reprend S23, S25, S27)

- **Contenu (public)** :
  - Titre public : « Atelier 2 — Rythme, niveau, indice »
  - `intitule` « Atelier 2 — Rythme, niveau, indice » ; `consigne` « Calculatrice autorisée. Base 100 =
    moyenne annuelle 2019. Taux annuels moyens de l’Insee : 2020 : 0,5 % ; 2021 : 1,6 % ; 2022 :
    5,2 % ; 2023 : 4,9 % ; 2024 : 2,0 % ; 2025 : 0,9 %. »
  - Questions (ordre fixe) :
    1. `b2-01-a3-niveau-prix` (vote) « L’inflation passe de 2,0 % en 2024 à 0,9 % en 2025. En 2025, le
       niveau général des prix est… »
    2. `b2-01-a3-indice-2023` (numérique) « Calculez l’indice des prix de 2023 (base 100 = moyenne
       2019), arrondi au centième. »
    3. `b2-01-a3-hausse-2019-2025` (numérique, « % ») « De combien les prix ont-ils augmenté entre
       2019 et 2025 ? Réponse en %, arrondie au centième. »
    4. `b2-01-a3-taux-moyen` (numérique, « % ») « Quel taux annuel constant, appliqué six années de
       suite, donne la même hausse des prix entre 2019 et 2025 ? Réponse en %, arrondie au
       centième. »
    5. `b2-01-a3-reciproque` (vote) « Le prix d’une réparation est passé de 80 € à 100 €. Pour revenir
       à 80 €, de quel pourcentage faut-il le baisser ? »
- **Notes** :
  - Action : 7 min individuelles, 3 min de correction.
  - Observé : confusions « rythme / niveau » (Q1), « addition des taux » (Q2, Q3), « moyenne
    arithmétique » (Q4).
  - Attendu : Q1 plus élevé qu’en 2024 ; Q2 112,68 ; Q3 15,97 % ; Q4 2,50 % ; Q5 une baisse de 20 %.
  - Contrôle : 1,025⁶ ≈ 1,1597 ; 100 × 0,80 = 80. Ici l’écart entre moyenne arithmétique des taux
    (2,52 %) et taux moyen (2,50 %) est faible parce que les taux sont petits ; en A3-06 il était
    visible (6,37 % contre 6,00 %) et en A6-04 il atteint 0,65 point (33,25 % contre 32,6 %) : la
    méthode reste fausse.
  - Transition : « Voici la courbe que vous venez de calculer. »

#### A3-08 · `B2-01-A3-08-INDICE-PRIX` — 2 min · v2 `chart` (G3) · séance · Modifié (S26, S27)

- **Contenu (public)** :
  - Titre public : « Indice des prix, base 100 en 2019 »
  - `title` « Indice des prix à la consommation, base 100 = moyenne 2019 » ; `caption` « Indice
    reconstitué à partir des taux annuels moyens de l’Insee » ; `kind` line ; `labels` ["2019" …
    "2025"] ; `series` [{ « Indice des prix », [100, 100.5, 102.11, 107.42, 112.68, 114.93, 115.97],
    gold }] ; `axisRanges` [[95, 120]] ; `axisLabels` [« 95 à 120 »] ; `unit` « indice (base 100 en 2019) »
  - `formula` « Indice 2025 = 100 × 1,005 × 1,016 × 1,052 × 1,049 × 1,020 × 1,009 ≈ 115,97 »
  - `reading` « Les prix de 2025 sont en moyenne 16,0 % plus élevés qu’en 2019. Le rythme ralentit
    depuis 2023, mais l’indice continue de monter : une inflation qui ralentit tout en restant positive
    s’appelle une désinflation ; une baisse du niveau des prix s’appellerait une déflation. »
  - `source` « Calcul du cours à partir des taux annuels moyens publiés par l’Insee (IPC,
    « L’essentiel sur… l’inflation », paru le 23 mars 2026). L’indice officiel, publié en base 100 =
    moyenne 2025 et rebasé à 100 en 2019, vaut 116,04 en 2025 : les taux publiés étant arrondis au
    dixième, l’indice reconstitué s’en écarte de quelques centièmes. »
  - `description` « Courbe croissante de l’indice : 100 en 2019, 107,42 en 2022, 112,68 en 2023, 115,97
    en 2025 ; axe gradué de 95 à 120. »
- **Modification** : « base 100 fin 2019 » était faux (des taux en moyenne annuelle se chaînent depuis
  la moyenne 2019) ; « l’indice officiel peut différer au centième » supprimé (l’écart atteint 7
  centièmes) ; placé après l’atelier ; axe explicite de 95 à 120 (un axe non nul est acceptable pour
  une courbe d’indice si l’échelle est affichée : c’est l’occasion de le dire).
- **Notes** :
  - Action : superposer mentalement G2 et G3.
  - Observé : des barres qui baissent, une courbe qui monte.
  - Attendu : rythme ≠ niveau ; le mot « désinflation ».
  - Contrôle : 115,97 − 100 = 15,97 % ; l’indice officiel rebasé (116,04) correspond à un taux moyen
    de 2,51 %.
  - Transition : « Répondez à Samir, qui veut baisser les tarifs. »

#### A3-09 · `B2-01-A3-09-NOTE-CONJONCTURE` — 2 min · v2 `reflection` · séance · Modifié (S28)

- **Contenu (public)** :
  - Titre public : « Note de conjoncture pour Hélène »
  - `promptData.id` `b2-01-a3-note-conjoncture`
  - `question` « Samir propose de baisser les tarifs 2026 de 2 % « puisque l’inflation baisse ». Nos
    tarifs n’ont pas bougé depuis 2019. En deux phrases chiffrées et sourcées, dites à Hélène si
    l’argument tient et ce que valent aujourd’hui nos tarifs en euros de 2019. »
  - `placeholder` « L’argument de Samir… Nos tarifs, en euros de 2019… Source : … »
  - `context` « Une note de conjoncture sépare le rythme d’une hausse et le niveau atteint. »
  - `competency` « Communiquer · distinguer rythme et niveau »
- **Corrigé réservé** : `expected` « L’argument ne tient pas : l’inflation ralentit (désinflation :
  0,9 % en 2025 après 2,0 % en 2024), mais le niveau des prix continue de monter. Les prix ayant
  augmenté de 16,0 % depuis 2019 (Insee, IPC), des tarifs inchangés ont perdu 13,8 % de leur valeur
  réelle (1 ÷ 1,1597 − 1) : les baisser aggraverait la perte. » ; `nextAction` « Réutiliser la paire
  rythme / niveau dans la recommandation. »
- **Notes** :
  - Action : rédaction individuelle 90 secondes, puis lecture de deux réponses.
  - Observé : les phrases sans source et celles qui concluent sur le rythme seulement.
  - Attendu : deux chiffres (rythme, niveau), une source, une conséquence en euros de 2019
    (évolution réciproque : −13,8 %).
  - Contrôle : chaque phrase est-elle vérifiable par un tiers ?
  - Transition : jalon 3, puis **pause de 15 minutes** (hors durée).

#### A3-10 · `B2-01-A3-10-JALON-3` — 1 min · `fp-pulse` · séance · Nouveau

- **Contenu (public)** :
  - Titre public : « Jalon 3 : où en êtes-vous ? »
  - `id` `b2-01-a3-jalon` ; `invite` « Je sais enchaîner des évolutions avec des coefficients, lire un
    indice base 100 et calculer un taux moyen. »
- **Notes** :
  - Action : vote anonyme.
  - Observé : l’agrégat perdu / ça va / clair.
  - Attendu : au moins 60 % « ça va » ou « c’est clair ».
  - Contrôle : au-delà de 30 % « perdu », rejouer la machine à coefficients (A3-02) et l’étape 4 de
    A3-06 au retour de pause.
  - Transition : annoncer la pause (15 min) et l’acte 4 au tableur.

### 3.5 Acte 4 — Construire une feuille contrôlable (38 min)

#### A4-01 · `B2-01-A4-01-CAPSULE` — 3 min · `fp-story` (vidéo) · catalogue · Nouveau (reprend S67, S69)

- **Intention** : montrer une fois, sur un autre tableau, les gestes que la tâche 1 fera appliquer :
  total, taux d’évolution, recopie, référence absolue, contrôle des formules et contrôle par une
  source indépendante.
- **Contenu (public)** :
  - Titre public : « Capsule : une formule qui se recopie »
  - `recit` : `titre` « Capsule : une formule qui se recopie, un tableau qui se contrôle » ;
    `paragraphes` [« Regardez la capsule (2 min 30), puis ouvrez la tâche de tableur : vous y
    appliquerez les mêmes gestes à Atelier Rivage. », « Vidéo « Une formule qui se recopie, un tableau
    qui se contrôle », Asili Design, 2026, licence CC BY-SA 4.0. Voix de synthèse : Piper, modèle
    fr_FR-siwis-medium ; données SIWIS (Université d’Édimbourg), CC BY 4.0. Transcription et
    sous-titres disponibles. »]
  - `video` : `src` `/assets/cours/b2-01/v3/capsule-formule-recopiable-720p.webm` (projection) ;
    `srcPoste` `/assets/cours/b2-01/v3/capsule-formule-recopiable-480p.webm` (postes étudiants) ;
    `type` `video/webm` ; `titre` « Une formule qui se recopie, un tableau qui se contrôle (2 min 30) » ;
    `poster` `/assets/cours/b2-01/v3/capsule-formule-recopiable.jpg` ; `transcript` : texte de
    l’annexe A.6 ; `source` `/formations/b2-01-traitement-information-chiffree` ; `licence` « CC BY-SA
    4.0 · Asili Design, 2026 » ; `sousTitres` { `src`
    `/assets/cours/b2-01/v3/capsule-formule-recopiable.fr.vtt`, `srclang` « fr », `libelle`
    « Français » } ; `preload` « none ».
- **Notes** :
  - Action : projeter la capsule en plein écran, sous-titres activés.
  - Observé : l’erreur #DIV/0! quand la référence au total n’est pas figée, et le contrôle qui passe à
    0 quand une formule est écrasée par une valeur.
  - Attendu : `$C$6` fige la colonne et la ligne ; le contrôle des parts surveille les formules ; le
    total comparé au compte de résultat surveille les données.
  - Contrôle : « que devient `=C2/C6` recopiée d’une ligne ? » (`=C3/C7`) ; « que détecte le contrôle
    des parts ? que détecte le contrôle par le compte de résultat ? ».
  - Transition : « À vous, sur le tableau de bord d’Atelier Rivage. »

#### A4-02 · `B2-01-A4-02-FEUILLE-CANAUX` — 13 min · `fp-sheet` · séance · Tâche de tableur 1 · Nouveau (reprend S43, S44)

- **Intention** : produire, avec des formules recopiables, le tableau par canal, et le rendre
  auto-contrôlé (formules et données).
- **Concept · modalité** : `tableur` · binôme (chacun envoie sa feuille).
- **Contenu (public)** :
  - Titre public : « Tâche de tableur 1 — Tableau de bord par canal »
  - `plan` : `id` `b2-01-a4-feuille-canaux` ; `intitule` « Tâche de tableur 1 — Tableau de bord par
    canal, 2024–2025 » ; grille, cellules verrouillées et consignes du § 5.6 (recopiées ici par
    renvoi : c’est le même texte) ; bouton « Recopier vers le bas » ; bouton « Je ne sais pas ».
- **Interaction et correction** : envoi unique (brouillon local restauré en cas de rechargement) ; le
  serveur réévalue les formules avec le moteur canonique (B6), compare 17 cellules attendues (valeur,
  forme de la formule, cohérence de la recopie) et renvoie un verdict par cellule (juste / à revoir,
  avec la confusion reconnue, sans valeur attendue) ; réussite si ≥ 14/17.
- **Notes** :
  - Action : binômes ; circuler ; au bout de 9 min, projeter la grille d’un binôme volontaire ; rappeler
    que chacun envoie.
  - Observé : les #DIV/0! en E3 (total non figé), les taux saisis en pourcentage (× 100), les résultats
    tapés sans formule.
  - Attendu : D2 −0,178054 ; E4 0,454783 ; G5 291 000 ; F5 0,253043 ; B7 et C7 = 1.
  - Contrôle : C7 compare la marge calculée à la marge du compte de résultat (B6) : c’est une source
    indépendante ; B7 surveille les formules, C7 les données.
  - Transition : « Comment montrer au comité l’activité de l’année, trimestre par trimestre ? »

#### A4-03 · `B2-01-A4-03-ATELIER-3` — 8 min · `questionnaire` (régime `focus`, ordre `fixe`) · séance · Nouveau (reprend S33, S34, S37)

- **Contenu (public)** :
  - Titre public : « Atelier 3 — Habiller le graphique du comité »
  - `intitule` « Atelier 3 — Habiller le graphique du comité » ; `consigne` « Pour le comité, vous
    devez montrer comment le CA HT 2025 de chaque canal a évolué au fil des trimestres. CA HT 2025, en
    milliers d’euros, du 1er au 4e trimestre : sur-mesure 120 ; 95 ; 102 ; 80 · entretien 58 ; 61 ;
    49 ; 62 · marketplace 98 ; 131 ; 167 ; 127. »
  - Questions (ordre fixe) :
    1. `b2-01-a4-forme` (vote) « Quel graphique choisissez-vous pour montrer l’évolution trimestrielle
       du CA HT de chaque canal ? »
    2. `b2-01-a4-titre` (vote) « Quel titre donnez-vous à ce graphique ? »
    3. `b2-01-a4-axe` (vote) « Où placez-vous l’origine de l’axe vertical ? »
    4. `b2-01-a4-lecture` (vote) « Quelle phrase de lecture placez-vous sous le graphique ? »
- **Notes** :
  - Action : 5 min de travail, 3 min de correction.
  - Observé : choix de forme et de titre.
  - Attendu : trois courbes (une par canal, trimestres en abscisse) ; titre descriptif avec l’unité ;
    axe à 0 gradué ; phrase qui cite deux valeurs et leur unité.
  - Contrôle : la phrase de lecture décrit, elle ne conclut pas ; la forme suit la question (évolution
    dans le temps : courbe).
  - Transition : « Voici le graphique qui figurera au dossier. »

#### A4-04 · `B2-01-A4-04-CA-TRIMESTRIEL` — 2 min · v2 `chart` (G4) · séance · Nouveau (reprend S20, S33)

- **Contenu (public)** :
  - Titre public : « Le graphique retenu pour le dossier du comité »
  - `title` « CA HT 2025 d’Atelier Rivage par canal et par trimestre » ; `caption` « Une courbe par
    canal : la forme suit la question (une évolution dans le temps) » ; `kind` line ; `labels` [« T1 »,
    « T2 », « T3 », « T4 »] ; `series` [{ « Sur-mesure », [120, 95, 102, 80], ink }, { « Entretien »,
    [58, 61, 49, 62], gold }, { « Marketplace », [98, 131, 167, 127], teal }] ; `axisRanges` [[0, 180]] ;
    `axisLabels` [« 0 à 180 milliers d’euros »] ; `unit` « milliers d’euros HT »
  - `reading` « La marketplace culmine au 3e trimestre (167 000 €) ; le sur-mesure recule de 120 000 €
    à 80 000 € entre le 1er et le 4e trimestre ; l’entretien reste entre 49 000 € et 62 000 €. »
  - `source` « Comptabilité analytique d’Atelier Rivage, 2025 (données fictives). »
  - `description` « Trois courbes étiquetées sur quatre trimestres : sur-mesure 120, 95, 102, 80 ;
    entretien 58, 61, 49, 62 ; marketplace 98, 131, 167, 127 (milliers d’euros) ; axe de 0 à 180. »
- **Confidentialité** : le titre public de cet écran est neutre parce qu’il est lu au catalogue,
  écran verrouillé compris, donc avant la séance. Le titre descriptif reprenait mot pour mot les
  segments de la bonne réponse de A4-03 Q2 (`b2-01-a4-titre`), qui demande précisément quel titre
  donner au graphique ; il ne subsiste que dans `title`, servi en séance après la question.
- **Notes** :
  - Action : comparer au choix fait à l’atelier 3.
  - Observé : trois courbes étiquetées directement (pas de légende à décoder), des marqueurs distincts.
  - Attendu : lecture en milliers d’euros ; aucune conclusion causale.
  - Contrôle : les totaux annuels redonnent 397, 230 et 523 milliers d’euros.
  - Transition : « Deuxième tâche : le prix de la toile, révision après révision. »

#### A4-05 · `B2-01-A4-05-INDICE-TOILE` — 11 min · `fp-table-build` · séance · Tâche de tableur 2 · Nouveau

- **Intention** : appliquer des évolutions successives ligne à ligne et passer du prix à l’indice ; les
  colonnes déduites (coefficient appliqué, évolution cumulée) permettent à l’étudiant de se corriger
  avant d’envoyer ; la synthèse démontre que Samir a additionné les taux.
- **Concept · modalité** : `evolutions-successives` · solo.
- **Contenu (public)** :
  - Titre public : « Tâche de tableur 2 — Prix et indice de la toile »
  - `plan` du § 5.6 (colonnes, formules sérialisées, consignes, synthèse) ; bouton « Je ne sais pas ».
- **Interaction et correction** : 8 valeurs saisies (4 prix, 4 indices) corrigées serveur à 0,01 près ;
  réussite si ≥ 6/8 ; les colonnes déduites ne sont pas corrigées (elles découlent des saisies) ;
  verdict par ligne.
- **Notes** :
  - Action : individuel, 7 min ; correction 4 min sur la ligne de synthèse.
  - Observé : les prix calculés à partir de 20,00 € à chaque ligne (addition déguisée des taux).
  - Attendu : 21,60 ; 20,52 ; 21,34 ; 20,70 € et 108,00 ; 102,60 ; 106,70 ; 103,50 ; évolution réelle
    +3,50 % contre « +4 % ».
  - Contrôle : la colonne « coefficient appliqué » redonne 1,0800 ; 0,9500 ; 1,0400 ; 0,9700. Pour
    comparer à l’inflation des grandeurs de même nature : la toile augmente de 3,50 % sur l’année
    (glissement) ; l’IPC augmente de 0,8 % entre décembre 2024 et décembre 2025 (99,17 → 99,95, base
    2025), alors que 0,9 % est une moyenne annuelle.
  - Transition : jalon 4, puis le dossier du comité.

#### A4-06 · `B2-01-A4-06-JALON-4` — 1 min · `fp-pulse` · séance · Nouveau

- **Contenu (public)** :
  - Titre public : « Jalon 4 : où en êtes-vous ? »
  - `id` `b2-01-a4-jalon` ; `invite` « Je sais écrire une formule recopiable et contrôler un
    tableau. »
- **Notes** :
  - Action : vote anonyme.
  - Observé : l’agrégat perdu / ça va / clair.
  - Attendu : au moins 60 % « ça va » ou « c’est clair ».
  - Contrôle : au-delà de 30 % « perdu », rejouer la capsule sur le passage du dollar (plans P05 et
    P06).
  - Transition : « Acte 5 : défendre une décision. Commençons par une infirmière de 1858. »

### 3.6 Acte 5 — Défendre une décision au comité (42 min)

#### A5-01 · `B2-01-A5-01-NIGHTINGALE` — 1 min · v2 `image-right` · catalogue · Modifié (S36)

- **Contenu (public)** :
  - Titre public : « 1858 : Florence Nightingale fait décider par les données »
  - `title` « 1858 : Florence Nightingale fait décider par les données »
  - `image` `/assets/cours/b2-01/v3/nightingale-1858.webp` (média M3) ; `imageAlt` « Diagramme polaire
    de Florence Nightingale (1858) : un secteur par mois de la guerre de Crimée ; la plupart des mois,
    les secteurs bleus (décès par maladies évitables) sont bien plus grands que les rouges (blessures)
    et les noirs (autres causes). »
  - `paragraphs` [« Pendant la guerre de Crimée, Florence Nightingale montre, mois par mois, que la
    plupart des soldats meurent de maladies évitables plutôt que de blessures. », « Chaque secteur
    représente un mois ; son aire mesure un taux annuel de mortalité pour 1 000 soldats : en bleu les
    maladies évitables, en rouge les blessures, en noir les autres causes. Publié en 1858 et adressé à
    la reine Victoria, le diagramme appuie des réformes sanitaires. », « Jeudi, votre dossier devra
    faire de même : un constat, un mécanisme, une preuve, une décision. »]
  - `sourceLink` { href https://commons.wikimedia.org/wiki/File:Nightingale-mortality.jpg, label
    « Florence Nightingale, 1858 · Wikimedia Commons (domaine public) » }
- **Modification** : « chaque secteur a une période, une unité et une source » était inexact (aucune
  source n’y figure ; la légende explique la lecture des aires) ; texte alternatif décrivant le
  contenu.
- **Notes** :
  - Action : raconter en 45 secondes ; montrer un mois où le bleu domine.
  - Observé : un secteur par mois, des aires comparables.
  - Attendu : un graphique au service d’une décision ; un taux pour 1 000 est une proportion.
  - Contrôle : « quelle décision le comité doit-il prendre jeudi ? » (investir ou non dans la
    marketplace).
  - Transition : « Voici le paradoxe à expliquer. »

#### A5-02 · `B2-01-A5-02-VOTE-PARADOXE` — 8 min · `fp-vote` (instruction par les pairs) · séance · Modifié (S38, S46 à S49)

- **Concept · modalité** : `moyenne-ponderee` · solo, puis binôme pour le débat.
- **Contenu (public)** :
  - Titre public : « Vote : le paradoxe du taux global »
  - `question` `b2-01-a5-paradoxe-v1` : « Entre 2024 et 2025, chaque canal d’Atelier Rivage garde
    exactement le même taux de marge brute (36 %, 28 % et 16 %). Pourtant, le taux global passe de
    27,6 % à 25,3 %. Comment l’expliquez-vous ? »
  - `questionJumelle` `b2-01-a5-paradoxe-v2` (affichée à partir de `revote`) : « Dans un lycée qui ne
    prépare que deux BTS, le taux de réussite reste de 90 % en CG et de 70 % en MCO d’une session à
    l’autre. Pourtant, le taux de réussite global du lycée baisse. Comment l’expliquez-vous ? »
- **Révélation (déroulé)** : titre « Un taux global est une moyenne pondérée » ; lignes « Taux
  global = somme des (poids × taux) : si les poids changent, le taux global change, même quand chaque
  taux reste stable. » ; « Grille du débat — argument correct : taux locaux constants et poids
  modifiés, avec un exemple chiffré ; incomplet : une intuition sans chiffre ; faux : moyenne simple
  des taux, ou poids ignorés. » ; « Au lycée, la part des candidats de MCO, moins souvent reçus, a
  augmenté. »
- **Interaction et correction** : mêmes phases que A3-01 ; deux réponses notées.
- **Notes** :
  - Action : vote 1 (2 min), débat (3 min) sur la consigne « prouvez-le avec deux canaux et des
    chiffres », vote 2 (2 min), révélation (1 min) avec la grille du débat.
  - Observé : la part de « c’est une erreur » au vote 1 ; le vote 1 n’a été préparé par aucun écran
    (l’acte 4 a montré les trimestres, pas la répartition annuelle).
  - Attendu : le poids de chaque canal dans le CA a changé ; au lycée, la part des candidats de MCO a
    augmenté.
  - Contrôle : un argument complet contient un mécanisme (poids) et un exemple chiffré.
  - Transition : « Prouvons-le par le calcul. »

#### A5-03 · `B2-01-A5-03-MOYENNE-PONDEREE` — 5 min · `fp-worked` · séance · Modifié (S39, S40, S42)

- **Concept · modalité** : `moyenne-ponderee` · solo.
- **Contenu (public)** :
  - Titre public : « Prouver l’effet de répartition »
  - `exemple` : `id` `b2-01-a5-ponderee` ; `enonce` « Prouvez au comité que la baisse du taux global
    vient du changement de répartition du CA. » ; `etayage` initial 3.
  - `etapes` :
    1. `poids` · « Poids des canaux » · « Poids d’un canal = CA du canal ÷ CA total. 2024 : 46 %, 20 %,
       34 %. 2025 : 34,5 %, 20 %, 45,5 %. » · invite « Calculez les poids des deux années. »
    2. `taux-2024` · « Taux global 2024 » · « 0,46 × 36 + 0,20 × 28 + 0,34 × 16 = 16,56 + 5,60 + 5,44 =
       27,60 %. » · invite « Pondérez chaque taux par son poids. »
    3. `taux-2025` · « Taux global 2025 » · « 0,345 × 36 + 0,20 × 28 + 0,455 × 16 = 12,42 + 5,60 +
       7,28 = 25,30 %. Avec les poids exacts (397 ÷ 1 150 ; 230 ÷ 1 150 ; 523 ÷ 1 150), on obtient
       25,304 %, soit 291 000 ÷ 1 150 000. » · invite « Refaites le calcul avec les poids 2025. »
    4. `moyenne-simple` · « Pourquoi pas la moyenne simple ? » · « (36 + 28 + 16) ÷ 3 ≈ 26,7 % : ce
       nombre ne correspond à aucune année, car il suppose trois canaux de même poids. » · invite
       « Expliquez pourquoi la moyenne simple ne convient pas. »
    5. `effet` · « Chiffrer l’effet de répartition » · « Avec la répartition de 2024, le CA 2025
       (1 150 000 €) aurait donné 27,6 % de marge, soit 317 400 €. La marge réelle est de 291 000 € :
       le changement de répartition « coûte » 26 400 € de marge. » · invite « Chiffrez l’effet du
       changement de répartition. »
    6. `logique` · « Réfuter une implication » · « L’affirmation « si chaque canal garde son taux,
       alors le taux global est inchangé » est fausse : Atelier Rivage en est un contre-exemple. Sa
       négation s’écrit : « il existe une répartition du CA pour laquelle chaque canal garde son taux
       et le taux global change ». » · invite « Écrivez la négation de l’affirmation, puis le
       contre-exemple. »
- **Modification** : étape 3 corrigée (0,345 × 36 = 12,42 et non 12,43 ; la somme écrite donnait
  25,31) ; étape 6 ajoutée (calcul des propositions en contexte).
- **Notes** :
  - Action : étapes 1 et 2 guidées, 3 à 6 rédigées.
  - Observé : l’étape 5 (raisonnement contrefactuel) et l’étape 6 (négation d’un « si… alors »).
  - Attendu : 27,60 % ; 25,30 % ; 317 400 € ; −26 400 € ; une négation de la forme « il existe… et… ».
  - Contrôle : effet volume (+27 600 €) + effet de répartition (−26 400 €) = +1 200 €.
  - Transition : « Faites varier la part de la marketplace. »

#### A5-04 · `B2-01-A5-04-SIMULATEUR-MIX` — 2 min · `fp-plot` · séance · Modifié (S41)

- **Contenu (public)** :
  - Titre public : « Simulateur : la part de la marketplace »
  - `definition` : `id` `b2-01-a5-simulateur` ; `titre` « Taux de marge brute global selon la part de
    la marketplace » ; `source` « Hypothèses Atelier Rivage : entretien fixé à 20 % du CA, taux par
    canal 36 %, 28 % et 16 % (données fictives). » ; `abscisse` { libelle « Part de la marketplace
    dans le CA (%) », min 0, max 80 } ; `ordonnee` « Taux de marge brute global (%) » ;
    `bornesOrdonnee` { min 0, max 40 } ; `parametres` [{ cle « tauxMarketplace », libelle « Taux de
    marge brute de la marketplace (%) », min 10, max 30, pas 1, defaut 16 }] ; `series` [{ id
    « global », libelle « Taux global », trait plein, calcul `(20*28 + (80 - x)*36 + x*tauxMarketplace)/100`
    }, { id « reference », libelle « Taux 2024 (27,6 %) », trait tirets, calcul `27.6` }]
  - `description` « Droite décroissante du taux global en fonction de la part de la marketplace, et
    droite horizontale du taux 2024 ; un curseur règle le taux de marge de la marketplace. »
- **Modèle** : taux global = 34,4 − 0,2 × part (avec 16 %) ; 27,6 % à 34 % (2024) et 25,30 % à 45,48 %
  (2025) : les deux années réelles sont sur la courbe.
- **Notes** :
  - Action : faire trouver la part de marketplace qui maintiendrait 27,6 % (34 %) et le taux de marge
    de la marketplace qui, à la répartition 2025, redonnerait 27,6 % (environ 21 % : curseur à 21,
    courbe à 27,6 % pour une part de 45,5 %).
  - Observé : la pente de −0,2 point de taux global par point de part.
  - Attendu : chaque point de part gagné par la marketplace coûte 0,2 point de taux global.
  - Contrôle : lire 30,4 % pour une part de 20 % (34,4 − 0,2 × 20).
  - Transition : « Le tableur fait ce calcul pour vous, à condition de choisir le bon total. »

#### A5-05 · `B2-01-A5-05-TCD` — 2 min · v2 `table` · séance · Nouveau (N3, reprend S68)

- **Intention** : montrer le tableau croisé dynamique et son champ calculé (capacité du programme), et
  faire voir que la « moyenne des taux » d’un TCD n’est pas le taux global.
- **Contenu (public)** :
  - Titre public : « Tableau croisé dynamique : deux totaux de taux »
  - `title` « Tableau croisé dynamique : ventes du 3e trimestre 2025 par canal » ; `subtitle` « Le
    fichier trimestriel, résumé par le tableur : deux façons d’obtenir un taux au total. »
  - `columns` : canal « Étiquettes de lignes » ; ca « Somme de CA HT (€) » ; marge « Somme de marge
    brute (€) » ; moyenne « Moyenne de Taux » ; calcule « Taux (champ calculé = Marge ÷ CA) »
  - `rows` :

    | Étiquettes de lignes | Somme de CA HT (€) | Somme de marge brute (€) | Moyenne de Taux | Taux (champ calculé = Marge ÷ CA) |
    | -------------------- | ------------------ | ------------------------ | --------------- | --------------------------------- |
    | Sur-mesure           | 102 000            | 36 720                   | 36 %            | 36 %                              |
    | Entretien            | 49 000             | 13 720                   | 28 %            | 28 %                              |
    | Marketplace          | 167 000            | 26 720                   | 16 %            | 16 %                              |
    | Total général        | 318 000            | 77 160                   | 26,7 %          | 24,3 %                            |

  - `note` « « Moyenne de Taux » applique la fonction Moyenne aux trois valeurs du champ Taux ; le champ
    calculé Taux divise la marge par le CA, ligne par ligne et au total. Données fictives Atelier
    Rivage (3e trimestre 2025). »

- **Notes** :
  - Action : montrer les deux colonnes de droite ; faire dire ce que chacune calcule au total.
  - Observé : les lignes sont identiques, seul le total diffère ; ce trimestre, la marketplace pèse
    plus de la moitié du CA.
  - Attendu : le total d’une « moyenne de taux » traite les canaux à égalité ; le champ calculé
    recalcule le taux sur les sommes, donc pondère chaque canal par son CA.
  - Contrôle : 77 160 ÷ 318 000 = 24,3 % ; (36 + 28 + 16) ÷ 3 = 26,7 %. Rappeler le devoir déposé
    (§ 5.2) : refaire ce TCD sur l’année (taux au total attendu : 25,3 %).
  - Transition : « Atelier 4 : du constat à la preuve. »

#### A5-06 · `B2-01-A5-06-ATELIER-4` — 9 min · `questionnaire` (régime `focus`, ordre `fixe`) · séance · Nouveau (reprend S35, S42 à S44)

- **Contenu (public)** :
  - Titre public : « Atelier 4 — Du constat à la preuve »
  - `intitule` « Atelier 4 — Du constat à la preuve » ; `consigne` « Données par canal, CA HT 2024 →
    2025 : sur-mesure 483 000 € → 397 000 € (taux de marge brute 36 %) ; entretien 210 000 € →
    230 000 € (28 %) ; marketplace 357 000 € → 523 000 € (16 %). Marge brute totale 2025 :
    291 000 €. »
  - Questions (ordre fixe) :
    1. `b2-01-a5-part-marge-marketplace` (numérique, « % ») « En 2025, quelle part de la marge brute
       d’Atelier Rivage provient de la marketplace ? Réponse en %, arrondie au dixième. »
    2. `b2-01-a5-variation-marge-sur-mesure` (numérique, « € ») « De combien la marge brute du
       sur-mesure a-t-elle varié entre 2024 et 2025 ? Réponse en euros, signe compris. »
    3. `b2-01-a5-causalite` (vote) « Samir écrit : « La marketplace détourne nos clients du
       sur-mesure : son CA monte pendant que celui du sur-mesure baisse. » Que lui répondez-vous ? »
    4. `b2-01-a5-synthese` (vote) « Quelle phrase pouvez-vous écrire telle quelle dans le dossier du
       comité ? »
    5. `b2-01-a5-tcd` (vote) « Le tableau croisé dynamique du 3e trimestre (écran précédent) affiche
       deux totaux de taux, 26,7 % et 24,3 %. Lequel portez-vous au dossier du comité ? »
- **Notes** :
  - Action : 6 min de travail, 3 min de correction.
  - Observé : Q3 (causalité) et Q5 (quel total).
  - Attendu : Q1 28,8 % (83 680 ÷ 291 000) ; Q2 −30 960 € ; Q3 une hypothèse à vérifier ; Q4 « +1 200 €
    mais −2,3 points » ; Q5 24,3 % (le total pondéré par le CA).
  - Contrôle : 83 680 − 57 120 = +26 560 € de marge apportée par la marketplace : elle pèse 45,5 % du
    CA mais 28,8 % de la marge.
  - Transition : « Quel contrôle pour chaque anomalie du dossier ? »

#### A5-07 · `B2-01-A5-07-CONTROLE-DISCRIMINANT` — 8 min · `fp-cardsort` · séance · Modifié (S51, S57, S59 à S61)

- **Concept · modalité** : `controle-coherence` · binôme (chacun envoie).
- **Contenu (public)** :
  - Titre public : « Quel contrôle pour chaque anomalie ? »
  - Intitulé du plan `b2-01-a5-controle` : « Pour chaque anomalie du dossier, choisissez le contrôle le
    plus direct qui permet de trancher. »
  - Catégories : « Compléter les métadonnées (unité, période, source) » ; « Recalculer (coefficients,
    points, pondération) » ; « Refaire la représentation (axe, titre, forme) » ; « Chercher une preuve
    externe (pièce, donnée détaillée) ».
  - Cartes : « « Inflation : 4,9 » dans le tableau de bord » ; « « Marge brute : +1 200 » » ; « « Taux
    de marge : −2,3 % » » ; « « Prix de la toile : +4 % » (8 − 5 + 4 − 3) » ; « Note de Samir : « taux
    de marge moyen des canaux : 26,7 % » » ; « Diapositive « Marge brute : une croissance
    continue » » ; « « La marketplace détourne nos clients du sur-mesure » » ; « Courriel du cabinet
    comptable : grand livre des ventes de mars 48 795 € HT, pièces 48 705 € HT » ; « Contrôle de
    février : total du grand livre égal au total des pièces, mais F002 à +100 € et F003 à −100 € ».
- **Interaction et correction** : classement corrigé serveur ; score x/9 ; réussite si ≥ 7/9 ; taux
  d’erreur par carte au pupitre.
- **Notes** :
  - Action : 5 min de tri (annoncer la dernière minute), 3 min de correction.
  - Observé : les cartes « factures », « compensation » et « détourne nos clients ».
  - Attendu : métadonnées (inflation, +1 200) ; recalcul (−2,3 %, +4 %, moyenne simple) ;
    représentation (diapositive) ; preuve externe (clients, factures, compensation). À efficacité
    égale, le contrôle le moins coûteux d’abord : métadonnées avant recalcul, recalcul avant pièce.
  - Contrôle : un total qui concorde ne prouve pas que chaque ligne est juste (février : +100 € et
    −100 € se compensent) ; un indice oriente, une pièce tranche.
  - Transition : « Rédigez votre recommandation. »

#### A5-08 · `B2-01-A5-08-RECOMMANDATION` — 6 min · `fp-challenge` · séance · Modifié (S45, S58, S60, S62)

- **Concept · modalité** : `moyenne-ponderee` · solo.
- **Contenu (public)** :
  - Titre public : « Votre recommandation au comité »
  - `id` `b2-01-a5-recommandation` ; `enonce` « Mercredi, 17 h. Samir annonce qu’il proposera demain
    d’investir 40 000 € pour doubler les ventes de la marketplace. Hélène vous demande votre
    recommandation écrite, fondée sur le dossier. » ; `invite` « Rédigez six phrases : 1) le constat
    chiffré ; 2) le mécanisme qui l’explique ; 3) ce qui reste à prouver ; 4) la décision que vous
    proposez ; 5) la limite de votre analyse ; 6) les anomalies du dossier, classées de la plus
    importante à la moins importante pour la décision. » ; `strategies` [] à l’envoi initial.
- **Stratégies de référence (corrigé)** : `constat` « Constat : CA +9,5 %, marge brute +1 200 €, taux
  de marge brute −2,3 points (27,6 % → 25,3 %). » ; `mecanisme` « Mécanisme : taux par canal stables ;
  la marketplace (16 %) passe de 34 % à 45,5 % du CA : effet de répartition d’environ −26 400 € de
  marge, confirmé par le champ calculé du TCD. » ; `a-prouver` « À prouver : le transfert de clients
  du sur-mesure vers la marketplace (données par client) et l’écart de 90 € sur les factures de vente
  de mars (pièce F004). » ; `decision` « Décision : conditionner l’investissement à un objectif de
  marge en euros et à un plan pour le sur-mesure, plutôt qu’à un objectif de CA. » ; `limite`
  « Limite : deux exercices seulement, données annuelles, coûts directs supposés stables. » ;
  `priorites` « Priorités : d’abord l’effet de répartition (−26 400 € de marge), puis le recul du
  sur-mesure (−30 960 €), enfin l’écart de 90 € des factures, sans effet sur la décision mais à
  corriger. » ; `arreter` (fausse) « Arrêter la marketplace, puisqu’elle fait baisser le taux
  global. »
- **Notes** :
  - Action : 4 min d’écriture, révélation, 2 min d’échange.
  - Observé : les recommandations qui confondent taux et montant ; l’ordre des priorités.
  - Attendu : la marketplace apporte +26 560 € de marge : l’arrêter serait une erreur ; il faut piloter
    la marge en euros ; la priorité va à l’effet qui pèse le plus sur la décision.
  - Contrôle : chaque phrase cite un chiffre ou une pièce.
  - Transition : jalon 5, puis jeudi.

#### A5-09 · `B2-01-A5-09-JALON-5` — 1 min · `fp-pulse` · séance · Nouveau

- **Contenu (public)** :
  - Titre public : « Jalon 5 : où en êtes-vous ? »
  - `id` `b2-01-a5-jalon` ; `invite` « Je sais expliquer un écart par un effet de répartition et
    défendre une recommandation chiffrée. »
- **Notes** :
  - Action : vote anonyme.
  - Observé : l’agrégat perdu / ça va / clair.
  - Attendu : au moins 60 % « ça va » ou « c’est clair ».
  - Contrôle : au-delà de 30 % « perdu », rejouer l’étape 2 de A5-03 au tableau.
  - Transition : « Jeudi, 13 h 30. Avant d’entrer, un détour par Venise. »

### 3.7 Acte 6 — Transférer et vérifier (28 min)

#### A6-01 · `B2-01-A6-01-PACIOLI` — 2 min · v2 `image-left` · séance · Modifié (S50, S54, S57)

- **Intention** : raconter la partie double sans mythe, et enseigner à tous les deux réflexes de
  contrôle du deck : la compensation et l’écart multiple de 9.
- **Contenu (public)** :
  - Titre public : « 1494 : Pacioli et la méthode du contrôle »
  - `title` « 1494 : Pacioli et la méthode du contrôle » ; `subtitle` « Les traces comptables doivent se
    répondre. »
  - `image` `/assets/cours/b2-01/v3/pacioli-1495.webp` (média M4) ; `imageAlt` « Portrait de Luca
    Pacioli en habit franciscain, démontrant une figure d’Euclide, à côté d’un jeune homme non
    identifié ; tableau daté de 1495, attribué à Jacopo de’ Barbari. »
  - `paragraphs` [« En 1494, à Venise, Luca Pacioli publie dans la Summa de arithmetica la première
    description imprimée de la comptabilité en partie double. Il n’en est pas l’inventeur : il décrit
    la pratique des marchands vénitiens. », « Chaque opération y est enregistrée deux fois et les
    totaux doivent concorder. Une concordance est un signal, pas une preuve : deux erreurs de sens
    contraire peuvent se compenser, et c’est la pièce justificative qui tranche. », « Quand deux totaux
    diffèrent, l’écart oriente la recherche. Intervertir deux chiffres voisins a et b change un nombre
    de 9 × (a − b) unités du rang concerné, car (10a + b) − (10b + a) = 9 × (a − b) : saisir 1 623 au
    lieu de 1 263 crée un écart de 360, divisible par 9. Un tel écart fait soupçonner une inversion ;
    seule la pièce la confirme. »]
  - `sourceLink` { href https://commons.wikimedia.org/wiki/File:Pacioli.jpg, label « Portrait attribué
    à Jacopo de’ Barbari, 1495 · Wikimedia Commons (domaine public) » }
  - Pas de `nestedQuiz` : le paragraphe du deck en donnait la réponse ; les deux notions sont reprises
    en rappel par tous (R10, R11).
- **Notes** :
  - Action : raconter en une minute, puis écrire au tableau (10a + b) − (10b + a) = 9 × (a − b) avec
    l’exemple 1 263 / 1 623.
  - Observé : le portrait et ses instruments ; la preuve algébrique du 9.
  - Attendu : concordance ≠ exactitude ligne à ligne ; un écart multiple de 9 oriente, la pièce
    tranche.
  - Contrôle : « que prouve un total juste ? » (une cohérence, rien de plus) ; « 360 ÷ 9 = 40 : à quel
    rang l’inversion a-t-elle eu lieu ? » (centaines et dizaines).
  - Transition : « Quatre vérifications ouvrent la salle du comité. »

#### A6-02 · `B2-01-A6-02-COFFRE` — 10 min · `fp-escape` · séance · Mini-jeu 2 · Nouveau (reprend S52 à S56)

- **Intention** : résolution autonome, chronométrée, de quatre problèmes de transfert (preuve
  « résolution autonome » de l’acte 6), dont un rapprochement ligne à ligne.
- **Concept · modalité** : un concept par énigme · solo.
- **Contenu (public)** :
  - Titre public : « Le coffre du comité »
  - `parcours` : `id` `b2-01-a6-coffre` ; `intitule` « Le coffre du comité : quatre vérifications, un
    code pour ouvrir la salle » ; `delaiIndiceMs` 60000 ; `budgetEnigmeMs` 150000 (repère affiché, ne
    bloque jamais la saisie) ; `tentativesMax` 10.
  - Énigme 1 `b2-01-a6-e1-mix`, « Le premier semestre 2026 » : « Au 1er semestre 2026 : sur-mesure
    150 000 € de CA HT (taux de marge brute 36 %), entretien 120 000 € (28 %), marketplace 330 000 €
    (16 %). Quel est le taux de marge brute global, en %, arrondi au dixième ? » · indice
    « Additionnez les marges en euros, puis divisez par le CA total. »
  - Énigme 2 `b2-01-a6-e2-points`, « L’écart » : « Au 1er semestre 2025, le taux de marge brute global
    était de 26,2 %. De combien a-t-il varié au 1er semestre 2026 (taux trouvé à l’énigme
    précédente) ? Réponse en points, signe compris, arrondie au dixième. » · indice « Comparez deux
    semestres entre eux ; un écart entre deux taux se lit en points : soustrayez le taux de départ. »
  - Énigme 3 `b2-01-a6-e3-rouleau`, « Le rouleau en 2026 » : « Pour 2026, le fournisseur annonce +6 %
    au 1er mars, puis −4 % au 1er juin. Au 1er juin 2026, un rouleau de 50 m² de toile coûte
    1 053,22 € HT. Quel était son prix au 1er janvier 2026, en euros, arrondi au centime ? » · indice
    « Remontez le temps : divisez par le coefficient global, pas par la somme des taux. »
  - Énigme 4 `b2-01-a6-e4-tva`, « Les factures de vente de mars » : « Courriel du cabinet : grand livre
    des ventes de mars 48 795 € HT, pièces 48 705 € HT. Détail (grand livre / pièce) : F001 12 000 /
    12 000 ; F002 8 500 / 8 500 ; F003 15 865 / 15 865 ; F004 12 430 / 12 340. Quel montant de TVA
    collectée à 20 % faut-il retenir pour les ventes de mars, en euros ? » · indice « Comparez chaque
    ligne du grand livre à sa pièce : la pièce justificative fait foi. »
- **Interaction et correction** : les énigmes s’ouvrent dans l’ordre (la suivante s’ouvre quand la
  précédente est résolue ou épuisée) ; chaque tentative est vérifiée par le serveur, qui ne renvoie le
  fragment qu’en cas de réussite ; 10 tentatives au plus par énigme
  (une saisie équivalente à une tentative déjà faite n’en consomme pas) ; progression restaurée après
  rechargement ; la première tentative de chaque énigme alimente le Leitner et les statistiques ;
  **non noté**. Code final reconstitué par les fragments (§ 5.10).
- **Notes** :
  - Action : lancer le parcours ; indices disponibles après 60 secondes ; au bout de 8 min, projeter
    les énigmes les moins résolues (progression au pupitre).
  - Observé : progression par étudiant et tentatives moyennes par énigme au pupitre.
  - Attendu : 23,4 % ; −2,8 points ; 1 035,00 € ; 9 741 €.
  - Contrôle : E3 : 1 035 × 1,0176 = 1 053,22 (le prix du 1er janvier 2026 est celui du
    31 décembre 2025 : 20,70 €/m² × 50 m²) ; E4 : l’écart de 90 € vient de F004 (inversion 3/4, 90 =
    9 × 10) ; 48 705 × 0,20 = 9 741 ; 48 705 + 9 741 = 58 446 € TTC.
  - Transition : « Dernier piège : une réponse d’IA. »

#### A6-03 · `B2-01-A6-03-IA-CADRE` — 2 min · v2 `guide` · catalogue · Modifié (S67, S70, S71)

- **Contenu (public)** :
  - Titre public : « IA : accélérer la préparation, jamais déléguer le jugement »
  - `title` « IA : accélérer la préparation, jamais déléguer le jugement » ; `subtitle` « Une IA
    générative peut proposer une méthode ou une formule. Elle ne valide ni un chiffre, ni une pièce, ni
    une conclusion. »
  - `context` « Le cadre d’usage de l’IA en éducation (ministère de l’Éducation nationale, juin 2025)
    demande un usage encadré, la protection des données et la vérification des productions. Pour un
    comptable, cela rejoint le secret professionnel et le contrôle interne. »
  - `takeaway` « L’IA peut réduire le temps de préparation ; la responsabilité de la preuve reste
    humaine. » ; `nextAction` « Pour chaque réponse d’IA : source, calcul refait au tableur, contrôle,
    limite. »
  - `items` : Cadrer (« Décrire le rôle, la question, le format attendu et les contraintes de
    calcul. » / « Demander une méthode vérifiable, pas une réponse persuasive. ») ; Anonymiser
    (« Remplacer noms, clients et montants réels par des données fictives. » / « Aucune donnée
    confidentielle dans un service grand public. ») ; Faire challenger (« Demander les hypothèses, les
    unités et les cas limites. » / « L’IA est utile comme contradicteur, pas comme source ; sachez
    écrire « je ne peux pas conclure » quand la donnée manque. ») ; Vérifier au tableur (« Qualifier la
    source de chaque chiffre, recalculer avec un outil déterministe et comparer aux pièces. » / « Un
    résultat doit être reproductible hors de la conversation. ») ; Tracer (« Conserver la question, la
    version retenue et les corrections humaines. » / « Le lecteur doit savoir ce qui vient de l’outil et
    ce qui vient du professionnel. »).
- **Notes** :
  - Action : lire les cinq gestes.
  - Observé : « vérifier au tableur » et « je ne peux pas conclure ».
  - Attendu : l’IA propose, le professionnel prouve.
  - Contrôle : « quelle donnée d’Atelier Rivage ne doit jamais être collée dans un outil grand
    public ? » (clients, montants réels).
  - Transition : « Corrigez cette réponse. »

#### A6-04 · `B2-01-A6-04-IA-ERREUR` — 4 min · `fp-challenge` · séance · Nouveau

- **Intention** : corriger une erreur plausible produite par un outil (preuve « correction d’une
  erreur »).
- **Concept · modalité** : `taux-moyen` · solo.
- **Contenu (public)** :
  - Titre public : « Corriger une réponse d’IA »
  - `id` `b2-01-a6-ia-erreur` ; `enonce` « Samir a demandé à un assistant IA : « Évolution du CA de
    notre marketplace entre 2023 et 2025, et taux annuel moyen ? », en donnant +20 % en 2024 et +46,5 %
    en 2025. Réponse obtenue : « Hausse totale : 20 + 46,5 = 66,5 %. Taux annuel moyen : 66,5 ÷ 2 =
    33,25 %. » » ; `invite` « Trouvez les deux erreurs, corrigez les deux résultats, puis écrivez le
    contrôle que vous feriez au tableur. » ; `strategies` [] à l’envoi initial.
- **Stratégies de référence (corrigé)** : `successives` « Erreur 1 : des évolutions successives se
  multiplient : 1,20 × 1,465 ≈ 1,758, soit +75,8 % (297 500 € → 523 000 €). » ; `racine` « Erreur 2 : le
  taux moyen se calcule avec une racine carrée : √1,758 − 1 ≈ 0,326, soit +32,6 % par an. » ;
  `tableur` « Contrôle au tableur : =297500\*PUISSANCE(1,326;2) redonne environ 523 000. » ; `garder`
  (fausse) « Garder la réponse de l’IA : elle donne le bon ordre de grandeur. »
- **Notes** :
  - Action : 3 min d’écriture, révélation, 1 min d’échange.
  - Observé : qui trouve une seule erreur ; qui retrouve le CA 2023 (357 000 ÷ 1,20).
  - Attendu : +75,8 % et +32,6 % par an ; l’écart avec 33,25 % est de 0,65 point : l’ordre de
    grandeur ne suffit pas.
  - Contrôle : 297 500 × 1,326² ≈ 523 000.
  - Transition : « Votre rappel personnel. »

#### A6-05 · `B2-01-A6-05-RAPPEL` — 3 min · `fp-spaced` · séance · Nouveau (remplace S57, S63 à S65)

- **Intention** : reposer à chacun, après délai, deux réflexes de contrôle servis à tous (compensation,
  multiple de 9) et un ou deux concepts que le Leitner serveur désigne comme fragiles (effet de test et
  espacement) ; donner au formateur la carte de maîtrise réelle de la classe.
- **Contenu (public)** :
  - Titre public : « Rappel : de mémoire, sans vos notes »
  - `rappel` : `id` `b2-01-a6-rappel` ; `intitule` « Rappel : de mémoire, sans vos notes » ; 3 ou 4
    questions par étudiant, servies par `GET …/rappels` (§ 4.2, fiche `fp-spaced`).
- **Interaction et correction** : chaque réponse passe par l’enregistrement standard des réponses
  (Leitner mis à jour) ; **non noté** (les étudiants n’ont pas tous le même nombre de questions) ; la
  sélection est figée au premier chargement.
- **Notes** :
  - Action : 2 min 30 individuelles ; projeter la carte de maîtrise (répartition des boîtes par
    concept).
  - Observé : les concepts qui restent en boîte 1 pour plus de 30 % de la classe.
  - Attendu : chaque étudiant répond à R10 et R11, puis revoit ses propres erreurs de la séance.
  - Contrôle : annoncer que les concepts en boîte 1 reviendront en ouverture de B2-02.
  - Transition : « Votre fiche mémo pour le CCF. »

#### A6-06 · `B2-01-A6-06-FICHE-MEMO` — 2 min · v2 `grid` · séance · Nouveau (N4, reprend S21, S49, S65)

- **Intention** : donner à l’étudiant la synthèse qu’il gardera : quelle méthode pour quelle question,
  avec son contrôle. Placée après les questions pour ne rien révéler ; imprimable.
- **Contenu (public)** :
  - Titre public : « Fiche mémo : quelle méthode pour quelle question ? »
  - `title` « Fiche mémo : quelle méthode pour quelle question ? » ; `subtitle` « À garder pour le CCF :
    chaque carte part d’une question et donne la méthode et son contrôle. » ; `imprimable` true.
  - `items` (recto `description`, verso `back`) :
    - Proportion · « Quelle part du total ? » · « Partie ÷ total. Nommez la population de référence
      (commandes ou CA ?). »
    - Évolution · « De combien a-t-il varié ? » · « t = (y₂ − y₁) ÷ y₁ ; y₂ = (1 + t) × y₁. Le
      dénominateur est la valeur de départ. »
    - Successives · « Plusieurs hausses et baisses ? » · « Multipliez les coefficients, puis retirez 1.
      On n’additionne jamais des taux successifs. »
    - Réciproque · « Comment revenir au départ ? » · « Valeur de départ = arrivée ÷ coefficient ; taux
      réciproque = 1 ÷ (1 + t) − 1. Du TTC au HT : ÷ 1,20, soit une baisse de 16,67 %. »
    - Points · « Deux taux à comparer ? » · « Écart en points (de 27 % à 25 % : −2 points) ;
      l’évolution relative du taux se calcule à part. »
    - Indice · « Que signifie un indice ? » · « I = 100 × V ÷ V₀ ; taux = I ÷ 100 − 1. Un indice n’est
      ni un prix ni un taux. »
    - Taux moyen · « Quel rythme annuel constant ? » · « (Vₙ ÷ V₀)^(1/n) − 1, jamais le taux global
      divisé par n. »
    - Moyenne pondérée · « Pourquoi le taux global bouge-t-il ? » · « Taux global = somme des marges ÷
      somme des CA : il dépend des poids. Dans un TCD, utilisez un champ calculé, jamais « Moyenne de
      taux ». »
    - Représenter · « Quel graphique ? » · « Évolution dans le temps : courbes ; comparaison de
      catégories : barres ; parts d’un total : barres empilées à 100 %. Toujours titre, unité, axe
      gradué, source et phrase de lecture ; un tableau reste l’alternative quand la forme trompe. »
    - Contrôler · « Le tableau est-il juste ? » · « $ fige une référence ; un contrôle de formules
      (les parts font 1) ; un contrôle de données (source indépendante) ; un écart multiple de 9
      oriente vers une inversion ; seule la pièce prouve ; à efficacité égale, le contrôle le moins
      coûteux d’abord. »
    - Libellés · « Quel « taux de marge » ? » · « Taux de marge = marge ÷ coût d’achat HT ; taux de
      marque = marge ÷ prix de vente HT ; taux de marge brute (sur CA HT) = marge sur coûts directs ÷
      CA HT. »
- **Interaction** : bouton « Imprimer ou enregistrer en PDF » (feuille de style d’impression qui
  n’imprime que la fiche, recto et verso de chaque carte).
- **Notes** :
  - Action : montrer la fiche et le bouton d’impression ; 90 secondes de lecture.
  - Observé : les cartes que les étudiants retournent en premier.
  - Attendu : chacun sait retrouver la méthode d’une question du CCF.
  - Contrôle : question rapide : « quelle carte pour « le taux global baisse alors que chaque taux est
    stable » ? » (moyenne pondérée).
  - Transition : « Vos outils pour la suite. »

#### A6-07 · `B2-01-A6-07-BOITE-A-OUTILS` — 2 min · v2 `grid` · catalogue · Modifié (S67 à S69, S72)

- **Contenu (public)** :
  - Titre public : « Votre boîte à outils »
  - `title` « Votre boîte à outils » ; `subtitle` « Les gestes du tableur professionnel et les sources
    officielles de ce cours. »
  - `items` (liens en `external: true`, URL au § 8.1) :
    - « Une ligne = une observation » · « Des données propres avant tout calcul. » · « Pas de cellule
      fusionnée, ni de sous-total ou de titre au milieu des données : le tableau croisé dynamique en
      dépend. »
    - « Tableau croisé dynamique (Excel) » · « Agréger par canal, vérifier le total général, ajouter
      un champ calculé. » · « Pour un taux au total : champ calculé, jamais « Moyenne de taux » ; datez
      chaque tableau de bord (date d’extraction). » · lien Microsoft (TCD)
    - « Table pilote (LibreOffice Calc) » · « Le même outil dans un tableur libre. » · lien The
      Document Foundation
    - « SOMME.SI.ENS » · « Agréger par canal et par période. » · « Contrôle : la somme des sous-totaux
      égale le total sans filtre. »
    - « RECHERCHEX (Excel) » · « Retrouver une valeur par sa clé. » · « Testez une clé absente et un
      doublon avant de faire confiance au résultat. » · lien Microsoft (RECHERCHEX)
    - « SIERREUR » · « Afficher un message, jamais un 0 muet. » · « Un 0 peut cacher une clé
      manquante : affichez « à vérifier ». »
    - « ARRONDI à l’affichage » · « Calculer en pleine précision. » · « N’arrondissez que le résultat
      affiché ou facturé ; un prix facturé, lui, est arrondi au centime. »
    - « Power Query (Excel) » · « Nettoyer sans détruire. » · « Des étapes rejouables, une source
      intacte, un nettoyage tracé. » · lien Microsoft (Power Query)
    - « L’inflation expliquée (Insee) » · « Taux annuels moyens et glissements. » · lien Insee
    - « Indice des prix, base 2025 (Insee) » · « La série officielle de l’IPC, France, ensemble. » ·
      lien Insee, série 011814630
    - « Cadre d’usage de l’IA en éducation » · « Ministère de l’Éducation nationale, juin 2025. » ·
      lien education.gouv.fr
    - « Compétences en IA pour les élèves (UNESCO) » · « Le cadre de référence international. » ·
      lien UNESCO
    - « Référentiel du BTS CG » · « Le programme de mathématiques et l’épreuve E3. » · lien DGESIP
- **Modifications** : WCAG retiré (ressource de développeur) ; série Insee arrêtée 001765618
  remplacée par la série 011814630 ; liens Microsoft en français ; LibreOffice, référentiel et UNESCO
  rétablis ; les apports de S67 à S69 (données propres, TCD, fonctions de recherche et de contrôle)
  deviennent des cartes.
- **Notes** :
  - Action : montrer où retrouver la liste ; lire les cartes « une ligne = une observation » et
    « SIERREUR ».
  - Observé : les outils déjà connus des étudiants.
  - Attendu : chacun note la ressource utile pour le devoir déposé (le TCD du § 5.2).
  - Contrôle : le lien du référentiel et celui de la série Insee s’ouvrent.
  - Transition : « Billet de sortie. »

#### A6-08 · `B2-01-A6-08-BILLET-DE-SORTIE` — 3 min · `fp-exit` · séance · Modifié (S58, S62, S66)

- **Concept · modalité** : `contrat-de-lecture` · solo.
- **Contenu (public)** :
  - Titre public : « Billet de sortie : la phrase du compte rendu »
  - `billet` `b2-01-a6-billet` : `question` « Le comité ne retiendra qu’une phrase. Laquelle peut
    figurer telle quelle au compte rendu ? » ; quatre options (§ 5.10) ; `invite` « Justifiez en trois
    phrases : le calcul qui prouve votre choix, la limite de l’analyse et l’action que vous proposez.
    Si vous avez corrigé une anomalie, ajoutez l’alerte adressée au cabinet : constat, pièce, montant,
    action. »
- **Interaction et correction** : le choix est noté (participation) et corrigé serveur ; le texte libre
  est enregistré (`activityId: b2-01-a6-billet`), lu par le formateur, non noté ; le pupitre affiche
  « N billets reçus / M participants » avant la clôture.
- **Notes** :
  - Action : 3 min ; clore la séance quand le compteur de billets est complet (synthèse envoyée au
    formateur).
  - Observé : répartition des choix et qualité des justifications ; présence de l’alerte F004.
  - Attendu : la phrase qui distingue +9,5 % de CA et −2,3 points de taux et nomme la répartition ;
    une alerte du type « F004 saisie 12 430 € au lieu de 12 340 € (pièce), écart 90 €, TVA collectée à
    corriger de 18 €, écriture à rectifier ».
  - Contrôle : la justification contient un calcul (poids ou taux) et une limite.
  - Transition : « Rendez-vous en B2-02 : vos concepts en boîte 1 vous y attendent. »

### 3.8 Correspondance des 72 écrans du deck actuel

| Écran actuel             | Sort     | Destination V3                                   | Motif                                                                                     |
| ------------------------ | -------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| S01 ACCROCHE             | modifié  | A1-02                                            | image du domaine public, « 1re année », fil rouge                                         |
| S02 CONTRAT              | modifié  | A1-07                                            | six étapes = six actes                                                                    |
| S03 PREDICTION           | retiré   | A1-09, A1-10, A2-03 Q1                           | quiz isolé ; contexte donnant la réponse (§ 6.2)                                          |
| S04 AXES                 | modifié  | A2-02, A2-04                                     | manipulation de l’origine et de l’amplitude, puis graphique de référence                  |
| S05 ANATOMIE             | fusionné | A1-06                                            | avec S06                                                                                  |
| S06 HABILLER             | modifié  | A1-06                                            | données Atelier Rivage, définition du taux de marge brute                                 |
| S07 COMPATIBILITE        | modifié  | A2-07                                            | devient le mini-jeu 1, carte de périmètre ajoutée                                         |
| S08 UNITES               | modifié  | A1-05, A2-05                                     | tri noté puis institutionnalisation                                                       |
| S09 FONDATIONS           | retiré   | A1-05, A1-06                                     | contexte donnant la réponse                                                               |
| S10 CONTROLEUR           | fusionné | A1-07, A5-07, A5-08                              | plan de séance, contrôle discriminant, « démontré ou hypothèse »                          |
| S11 C1                   | modifié  | A1-05 (carte « Inflation : 4,9 »), A1-08         | la question de gestion remplace la question sur « 4,9 »                                   |
| S12 ABSOLU-RELATIF       | modifié  | A2-03 Q4, A2-04, A2-05                           | affichait la réponse de S14 deux écrans avant ; la phrase de conclusion est portée par G1 |
| S13 FORMULE              | fusionné | A1-06 (formule avant l’atelier 1), A3-02         |                                                                                           |
| S14 CALCUL               | modifié  | A2-03 Q4                                         | réponse déjà affichée en S12                                                              |
| S15 BASE                 | modifié  | A3-04 étape 4 (enseigné), A6-02 E3 (évalué)      |                                                                                           |
| S16 POINTS               | modifié  | A2-06                                            | exemple travaillé à étayage dégressif                                                     |
| S17 HAUSSE-BAISSE        | conservé | A3-03                                            | placé après le vote qu’il corrige                                                         |
| S18 COEFFICIENTS         | modifié  | A3-02                                            | simulateur manipulable                                                                    |
| S19 SUCCESSIVES          | fusionné | A3-02, A3-04                                     |                                                                                           |
| S20 HISTOIRE             | fusionné | A2-01, A4-04                                     | « la forme suit la question » portée par Playfair et G4                                   |
| S21 METHODE              | modifié  | A6-06                                            | « quelle méthode pour quelle question » devient la fiche mémo                             |
| S22 C2                   | retiré   | A3-01                                            | l’indication de saisie donnait la réponse                                                 |
| S23 INFLATION            | retiré   | A3-07 Q1                                         | question ambiguë et contexte donnant la réponse                                           |
| S24 SOURCE-INFLATION     | modifié  | A3-05, A3-07 (consigne)                          | source Insee ; le sous-titre donnait la réponse de S25                                    |
| S25 DESINFLATION         | modifié  | A3-07 Q1, A3-08                                  | contexte orienté ; le mot « désinflation » revient en A3-08                               |
| S26 RYTHME               | modifié  | A3-05, A3-08                                     | la formule donnait la conclusion de S28                                                   |
| S27 INDICE               | modifié  | A3-06 (enseigné), A3-08 (graphique)              | base corrigée, enseigné avant l’atelier                                                   |
| S28 CONCLUSION-INFLATION | modifié  | A3-09                                            | décision tarifaire en euros de 2019                                                       |
| S29 PAUSE                | retiré   | pause hors durée après A3-10                     | un écran de pause compte comme exposition                                                 |
| S30 PLAYFAIR             | modifié  | A2-01                                            | lien aligné sur l’image, Priestley, forme et donnée                                       |
| S31 RELECTURE            | retiré   | A2-03 Q1                                         | contexte donnant la réponse                                                               |
| S32 AMPLITUDE            | fusionné | A2-02, A2-04                                     |                                                                                           |
| S33 FORME                | modifié  | A4-03 Q1, A4-04, A6-06                           | règle de forme institutionnalisée                                                         |
| S34 TITRE                | modifié  | A4-03 Q2                                         |                                                                                           |
| S35 CORRELATION          | modifié  | A5-06 Q3                                         | contexte donnant la réponse                                                               |
| S36 NIGHTINGALE          | modifié  | A5-01                                            | image allégée, texte exact, orienté décision                                              |
| S37 AUDIT-GRAPHIQUE      | modifié  | A1-10, A4-03, A6-06                              | l’alternative tabulaire revient (« Voir les données », fiche mémo)                        |
| S38 MIX                  | retiré   | A5-02                                            | contexte éliminant les pièges                                                             |
| S39 PREVISION-MIX        | retiré   | A5-02, A5-03                                     | donnait la réponse avant le vote                                                          |
| S40 PONDEREE             | fusionné | A5-03                                            |                                                                                           |
| S41 SIMULATEUR-MIX       | modifié  | A5-04                                            | le titre donnait la réponse du vote ; données Atelier Rivage                              |
| S42 VALEUR-TAUX          | retiré   | A5-03, A5-06 Q4                                  | affichait les réponses de S43 et S44                                                      |
| S43 MARGE-2024           | fusionné | A1-06, A2-03 Q6, A4-02                           |                                                                                           |
| S44 MARGE-2025           | fusionné | A4-02 (F5), A5-06                                |                                                                                           |
| S45 RECOMMANDATION       | modifié  | A5-08                                            | stratégies de référence après envoi                                                       |
| S46 VOTE-1               | modifié  | A5-02 vote 1                                     | contexte donnant la réponse                                                               |
| S47 PAIRS                | fusionné | A5-02 phase discussion                           |                                                                                           |
| S48 VOTE-2               | modifié  | A5-02 vote 2 (cas jumeau)                        | même question que S46 et contexte donnant la réponse                                      |
| S49 DEBRIEF              | fusionné | A5-02 révélation (grille du débat), A5-03, A6-06 |                                                                                           |
| S50 PACIOLI              | modifié  | A6-01 (sans quiz), R10                           | le paragraphe donnait la réponse du quiz imbriqué                                         |
| S51 MISSION              | modifié  | A5-07                                            | la bonne réponse était marquée dans l’écran ; coût du contrôle dans les notes             |
| S52 CONTROLE-GLOBAL      | modifié  | A5-07, A6-02 E4                                  | la colonne « écart » et la note donnaient la réponse                                      |
| S53 LOCALISER            | modifié  | A6-02 E4                                         | le rapprochement ligne à ligne est fait par l’étudiant                                    |
| S54 MULTIPLE-NEUF        | modifié  | A6-01 (enseigné à tous), R11 (servi à tous)      | contexte donnant la réponse                                                               |
| S55 F004                 | fusionné | A6-02 E4                                         |                                                                                           |
| S56 TVA                  | modifié  | A3-04 étape 6, A6-02 E4, R13                     | HT ↔ TTC et contrôle inverse enseignés                                                    |
| S57 COMPENSATION         | modifié  | A5-07 (carte), A6-01, R10 (servi à tous)         | contexte donnant la réponse                                                               |
| S58 ALERTE               | modifié  | A5-08, A6-08 (alerte au cabinet)                 |                                                                                           |
| S59 DEFI                 | retiré   | A5-07                                            | « Nova Services » remplacé par le fil rouge                                               |
| S60 PRIORITES            | modifié  | A5-07, A5-08 (sixième phrase)                    | classement objectivable et priorisation argumentée                                        |
| S61 CONTROLE             | modifié  | A5-07 (catégories)                               |                                                                                           |
| S62 DECISION             | modifié  | A5-08, A6-08                                     |                                                                                           |
| S63 FLASH-POINTS         | modifié  | R2                                               | le contexte écartait un piège                                                             |
| S64 FLASH-PREUVE         | modifié  | R11                                              | contexte donnant la réponse                                                               |
| S65 MAITRISE             | remplacé | A6-05, A6-06                                     | carte de maîtrise réelle (Leitner) et fiche mémo                                          |
| S66 SORTIE               | retiré   | A6-08                                            | appel à l’action sans activité                                                            |
| S67 BOITE-A-OUTILS       | fusionné | A4-01, A6-03, A6-07                              |                                                                                           |
| S68 TABLEUR-BI           | fusionné | A5-05, A6-07                                     | TCD et chaîne tableur devenus contenus                                                    |
| S69 FORMULES             | fusionné | A4-01, A4-02 (consignes), A6-07                  | RECHERCHEX, SOMME.SI.ENS, SIERREUR, ARRONDI                                               |
| S70 IA-CONTROLE          | modifié  | A6-03                                            |                                                                                           |
| S71 SKILLS-IA            | fusionné | A6-03 (« je ne peux pas conclure »), A6-04       |                                                                                           |
| S72 RESSOURCES           | modifié  | A6-07                                            | UNESCO et série Insee à jour                                                              |

### 3.9 Inventaire de couverture du deck (52 notions)

Reprise de l’inventaire de la relecture pédagogique (§ 4.1). Chaque notion est enseignée ; les
notions évaluées le sont après leur enseignement. Aucune n’est partielle ni perdue.

|   # | Notion ou apport du deck (écrans)                                                                               | Enseignée en                                      | Évaluée en                |
| --: | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------- |
|   1 | « Lire un chiffre, ce n’est pas le croire » (S01)                                                               | A1-02                                             | —                         |
|   2 | Six gestes (S02)                                                                                                | A1-07                                             | —                         |
|   3 | Pente contre échelle (S03, S31)                                                                                 | A1-09, A1-10                                      | A2-03 Q1                  |
|   4 | Origine et amplitude de l’axe (S04, S32)                                                                        | A2-02 (deux curseurs), A2-04                      | A4-03 Q3, R9              |
|   5 | Fiche d’identité en 5 rubriques (S05, S06, S09)                                                                 | A1-06                                             | A1-05                     |
|   6 | Comparabilité : période, HT/TTC, périmètre, mensuel/annuel (S07)                                                | A2-07 (dont la carte périmètre)                   | A2-07                     |
|   7 | Écritures valeur / rapport / points / indice (S08)                                                              | A2-05                                             | A1-05                     |
|   8 | Raisonnement du contrôleur ; « démontré ou hypothèse » (S10)                                                    | A1-07, A5-07                                      | A5-06 Q3, A5-08           |
|   9 | Première question devant « 4,9 » (S11)                                                                          | A1-06                                             | A1-05, A1-08              |
|  10 | Écart absolu contre taux ; phrase de conclusion (S12, S14)                                                      | A2-04 (lecture « +6 000 € … soit +2,1 % »), A2-05 | A2-03 Q4, A5-06 Q4        |
|  11 | t = (y₂ − y₁) / y₁ et y₂ = (1 + t) y₁ (S13)                                                                     | A1-06 (carte Base), A3-02                         | A2-03 Q4                  |
|  12 | Retrouver la valeur de départ (S15)                                                                             | A3-04 étape 4                                     | A6-02 E3                  |
|  13 | Points contre évolution relative (S16, S63)                                                                     | A2-06                                             | A5-06 Q4, E2, R2          |
|  14 | +10 % puis −10 % et effet sur la marge (S17, S22)                                                               | A3-03                                             | A3-01                     |
|  15 | Machine à coefficients (S18, S19)                                                                               | A3-02, A3-04                                      | A3-01, A4-05              |
|  16 | La représentation vient après la question (S20)                                                                 | A2-01, A4-04                                      | A4-03                     |
|  17 | Choisir la méthode selon la question (S21)                                                                      | A6-06                                             | A6-08                     |
|  18 | Rythme contre niveau (S23, S25, S26, S28)                                                                       | A3-05, A3-08                                      | A3-07 Q1, A3-09           |
|  19 | « Désinflation » et « déflation » (S26)                                                                         | A3-08                                             | A3-09                     |
|  20 | Source de l’inflation (S24)                                                                                     | A3-05, A6-07 (série 011814630)                    | A3-09                     |
|  21 | Indice cumulé base 100 (S27)                                                                                    | A3-06                                             | A3-07 Q2, A4-05, R5       |
|  22 | Pause de consolidation (S29)                                                                                    | jalons `fp-pulse`                                 | —                         |
|  23 | Playfair (S30)                                                                                                  | A2-01                                             | —                         |
|  24 | Choisir une forme : courbe, barres, aire (S33)                                                                  | A4-04, A6-06                                      | A4-03 Q1                  |
|  25 | Titre descriptif contre titre interprétatif (S34)                                                               | A1-10 (stratégies), A2-04                         | A4-03 Q2                  |
|  26 | Corrélation n’est pas causalité (S35)                                                                           | A5-02 révélation, A5-08                           | A5-06 Q3                  |
|  27 | Nightingale (S36)                                                                                               | A5-01                                             | —                         |
|  28 | Audit express ; « tableau : alternative aux formes » (S37)                                                      | A1-10, bouton « Voir les données », A6-06         | A1-10                     |
|  29 | Effet de mix, votes, argument entre pairs (S38, S39, S41, S46 à S48)                                            | A5-03, A5-04                                      | A5-02                     |
|  30 | Grille « argument correct / incomplet / faux » (S49)                                                            | A5-02 révélation                                  | A5-08                     |
|  31 | Moyenne pondérée et champ calculé du TCD (S40, S68)                                                             | A5-03, A5-05                                      | A5-06 Q5, E1, devoir TCD  |
|  32 | Valeur contre taux (S42)                                                                                        | A2-05                                             | A5-06 Q4                  |
|  33 | Calcul de 27,60 % et 25,30 % (S43, S44)                                                                         | A1-06, A5-03                                      | A4-02                     |
|  34 | Recommandation argumentée (S45, S62)                                                                            | A5-08 (stratégies)                                | A5-08                     |
|  35 | Pacioli (S50)                                                                                                   | A6-01                                             | —                         |
|  36 | Choisir le premier contrôle, coût du contrôle (S51)                                                             | A5-07 (correction), A6-06                         | A5-07                     |
|  37 | Contrôle global puis localisation ligne à ligne (S52, S53)                                                      | A6-01                                             | A6-02 E4                  |
|  38 | Multiple de 9 : indice, pas preuve (S54, S64)                                                                   | A6-01                                             | R11 (servi à tous)        |
|  39 | Preuve par la pièce F004 (S55)                                                                                  | A6-01                                             | A6-02 E4                  |
|  40 | TVA et TTC, contrôle inverse (S56)                                                                              | A3-04 étape 6                                     | A6-02 E4, R13             |
|  41 | Compensation de deux erreurs (S57)                                                                              | A5-07 (correction), A6-01                         | A5-07, R10 (servi à tous) |
|  42 | Alerte professionnelle écrite (S58)                                                                             | A5-08 (stratégies)                                | A6-08 (alerte)            |
|  43 | Prioriser selon l’impact (S59, S60)                                                                             | A5-08 (stratégies)                                | A5-08 (sixième phrase)    |
|  44 | Contrôle discriminant (S61)                                                                                     | A5-07                                             | A5-07                     |
|  45 | Carte de maîtrise (S65)                                                                                         | A6-05                                             | A6-05                     |
|  46 | Transition vers les outils (S66)                                                                                | A6-07                                             | —                         |
|  47 | Cycle du comptable : qualifier la source, nettoyer sans détruire, base explicite, rapprocher (S67)              | A6-03, A6-07, A1-06, A6-01                        | A6-02 E4                  |
|  48 | Chaîne tableur/BI : une ligne = une observation, Power Query, TCD, tableau de bord daté (S68)                   | A5-05, A6-07                                      | devoir TCD                |
|  49 | Formules à savoir expliquer : RECHERCHEX, SOMME.SI.ENS, SIERREUR, ARRONDI à l’affichage, contrôle inverse (S69) | A6-07, A3-04                                      | A4-02 (ARRONDI, SI)       |
|  50 | Cadre IA : cadrer, anonymiser, challenger, vérifier, tracer (S70)                                               | A6-03                                             | A6-04                     |
|  51 | Compétences IA ; « je ne peux pas conclure » (S71)                                                              | A6-03                                             | A5-06 Q3, A6-04           |
|  52 | Ressources, dont le cadre de compétences en IA de l’UNESCO (S72)                                                | A6-07                                             | —                         |

---

## 4. Les briques : rôle, contrats, correction, notation et manques

### 4.1 Principes communs

1. **Fonction et rendu séparés.** `formation_screen_contents.brique` porte la fonction pédagogique
   (l’une des 17 briques runtime ou `questionnaire`) ; `proprietes.presentation` (version 2) porte le
   rendu Angular. Un écran d’exposition rendu en v2 reste stocké en `fp-story`. Le front choisit le
   rendu v2 si `presentation.version === 2`, sinon il monte la brique runtime. Les deux familles
   coexistent, y compris sur la page publique.
2. **Secret côté serveur uniquement.** Les clefs réservées de `proprietes` sont `guide`, `correction`,
   `interaction` (existantes), **`questions`** (définitions notées, bonne réponse comprise),
   **`corrige`** (corrigés de production, stratégies de défi, révélation d’un vote) et **`banque`**
   (banque de rappel). Le filtre porte sur tous les niveaux (schémas `strict` imbriqués, B1). Aucune
   n’est servie au sujet ni au catalogue ; `corrige` n’est servi qu’au déroulé formateur (B22).
3. **Correction toujours serveur.** Aucune solution, empreinte de solution, fragment ni stratégie
   n’atteint le poste avant la réponse. Le poste envoie une production brute ; le serveur vérifie que
   l’écran est servi (B20), la corrige et ne renvoie que le verdict.
4. **Notation inchangée dans son principe** : la note mesure la **participation** relative à la
   cohorte ; la justesse alimente le Leitner, les statistiques et les confusions. Le contrat
   `notation` est étendu sans rupture (§ 9.3.8) ; le détail par brique est au § 4.5.

### 4.2 Fiche par brique

Les formes exactes des données publiques sont au § 9.4, les corrigés au § 9.3.3, les routes au § 9.5.

#### `fp-sheet` — tâche de tableur 1 (A4-02)

- **Rôle** : écrire des formules recopiables (références relatives et absolues), totaliser, contrôler
  formules et données. C’est la seule brique où l’étudiant **écrit la formule**, ce que l’épreuve E3
  demande « en présence de l’examinateur ».
- **Public** : `plan` (`SheetPlanPublic` : grille, cellules initiales, verrouillées, `consignes`).
- **Secret** : `CorrigeFeuille` (attendus avec valeur, tolérance, forme, pièges ; plan recopié).
- **Correction serveur** : feuille reconstruite (cellules envoyées + cellules verrouillées réimposées
  depuis le plan), évaluée par le moteur canonique à complexité bornée (B6) ; par attendu, dans
  l’ordre : cellule vide → à revoir sans confusion ; forme `references` non respectée (aucune
  référence, ou un littéral égal en valeur absolue à la valeur attendue — sauf quand l’attendu est
  une valeur de contrôle, 0, 1 ou −1 : la formule de référence de B7 contient elle-même le
  littéral 1) → `valeur-saisie-sans-formule` ; code d’erreur
  (#DIV/0!, #REF!) → confusion déclarée de la cellule ; valeur hors tolérance → piège reconnu ou
  aucune confusion ; forme `{ memeQue }` non respectée (forme R1C1 différente de celle de la cellule
  de référence) → `formule-non-recopiable`. Score = justes ÷ 17 ; `correcte` si score ≥ 0,8.
- **Notation** : 1 question notée (`b2-01-a4-feuille-canaux`, concept `tableur`) ; « je ne sais pas »
  possible (compté comme réponse, score 0).
- **Manques** : B1, B2, B4, B5, B6, B11, B26 ; F1, F2, F6, F17, F18.

#### `fp-table-build` — tâche de tableur 2 (A4-05)

- **Rôle** : construire ligne à ligne une chaîne d’évolutions successives ; les colonnes déduites
  rendent visible la conséquence de chaque saisie ; la synthèse confronte le résultat au « +4 % »
  additif.
- **Public** : `plan` (`TableBuildPlanPublic`, sérialisable : colonnes `donnee`, `saisie`, `deduite`
  avec formules en chaînes). Les **saisies** (prix facturés) sont arrondies au centime par l’étudiant ;
  les **colonnes déduites** sont calculées par `evaluerExpression` (résultat au millionième) et
  arrondies à l’affichage selon `decimales`.
- **Secret** : `CorrigeTableau` (attendus par rang et clé, tolérance absolue 0,01, seuil 0,75).
- **Correction serveur** : comparaison des saisies aux attendus ; pièges reconnus (prix calculé depuis
  20,00 € avec la somme des taux → `taux-successifs-additionnes` ; indice saisi comme évolution →
  `indice-lu-comme-taux`).
- **Notation** : 1 question notée (`b2-01-a4-indice-toile`, concept `evolutions-successives`).
- **Manques** : B1, B2, B4, B5, B11 ; F1, F2, F5, F17, F18.

#### `fp-escape` — mini-jeu 2 (A6-02)

- **Rôle** : résolution autonome et chronométrée de quatre problèmes de transfert couvrant les trois
  cas du fil rouge ; la récompense (code de la salle du comité) n’a de valeur que si le serveur la
  délivre : le code n’est pas devinable depuis le récit.
- **Public** : `parcours` (intitulés, énoncés, indices, délais, `tentativesMax`), **sans** solution ni
  fragment. Les indices ne contiennent aucune valeur de réponse (garde, § 6.4).
- **Secret** : un `CorrigeEnigme` par énigme (solution, fragment, pièges).
- **Faille actuelle** : `FpEscape` reçoit les solutions et compare une empreinte FNV-1a 32 bits,
  réversible en quelques millisecondes, et détient les fragments. Le poste ne reçoit plus que le
  contrat public.
- **Correction serveur** : `POST …/escape/:parcoursId/tentatives` ; saisie lue par
  `lireNombreSaisi` (espaces ordinaires, insécables et fines ; virgule ou point ; signe moins
  typographique U+2212 ; suffixes « % », « € », « pt », « point(s) ») ; une saisie équivalente à une
  tentative déjà faite ne consomme rien ; incrément atomique plafonné à 10 ; une énigme s’ouvre quand
  la précédente est résolue **ou** que ses 10 tentatives sont épuisées (sans fragment : le code final
  reste alors incomplet) ; énigme non ouverte → 409 `ENIGME_VERROUILLEE` ; plafond atteint → 409
  `TENTATIVES_EPUISEES` ; en cas de réussite, renvoie le fragment. La première tentative de chaque énigme est aussi enregistrée comme réponse (Leitner,
  statistiques), sans doublon même en parallèle.
- **Notation** : non noté (4 questions `noteCompte: false`).
- **Manques** : B1, B2, B4, B7 ; F1, F2, F4, F17, F18.

#### `fp-pulse` — jalons de confiance (A1-11, A2-08, A3-10, A4-06, A5-09)

- **Rôle** : mesure métacognitive anonyme à la fin des actes 1 à 5 ; déclenche une reprise ciblée
  (seuil : 30 % « perdu », écrit dans chaque fiche).
- **Public** : `sondage` (`id`, `invite`, `metadonnees`). Comptes par le flux formateur.
- **Traitement serveur** : `PUT …/pulses/:sondageId` (dernier état par participant et par sondage),
  stocké sous une clé HMAC du participant (l’anonymat annoncé est réel en base) ; agrégat publié
  dans le flux formateur et dans le rapport ; projection des comptes seulement à partir de
  5 réponses ; aucune route ne renvoie l’état d’un autre participant.
- **Notation** : aucune ; pas de Leitner. **Manques** : B1, B8 ; F1, F2, F11.

#### `fp-spaced` — rappel espacé au transfert (A6-05)

- **Rôle** : reposer à chacun, après au moins 30 minutes, des questions **nouvelles** : les deux
  réflexes de contrôle servis à tous (R10 compensation, R11 multiple de 9) et un ou deux concepts
  fragiles selon le Leitner ; donner au formateur la carte de maîtrise réelle.
- **Problème résolu** : `DueQuestionsUseCase` compte les séances en jours distincts (`isDue`,
  boîte 1 = 1 séance) : pendant la séance, aucun concept n’est « dû ». La nouvelle fonction de domaine
  `choisirRappels` le remplace pour cette brique (`DueQuestions` reste pour B2-02 et suivants).
- **Règle de sélection** `choisirRappels(participant)`, déterministe :
  1. obligatoires : `b2-01-r-compensation` puis `b2-01-r-multiple-neuf` ;
  2. candidats : concepts ayant au moins une question de la banque non encore répondue, hors
     `controle-coherence` ;
  3. priorité 1 : concepts dont la dernière réponse de la séance est fausse et date d’au moins
     30 minutes (les plus anciennes d’abord) ; priorité 2 : concepts dus selon `isDue` (séances
     antérieures) ; priorité 3 : concepts réussis une seule fois dans la séance, depuis au moins
     30 minutes ; complément : plus faible taux de réussite (`succes ÷ (succes + echecs)`), ordre de la
     banque en cas d’égalité ;
  4. un concept retenu donne une question (la première non répondue de la banque) ; 1 à 2 concepts ;
     total 3 ou 4 questions ; la liste est **figée** au premier appel (`formation_rappels_servis`).
- **Public** : `rappel` (`id`, `intitule`) dans le sujet ; questions par `GET …/rappels`
  (`SpacedQuestionPublique[]`, options à identifiants stables mélangées selon la graine).
- **Secret** : `banque` (13 votes, § 5.10), inscrite au barème (`noteCompte: false`,
  `origine: 'banque'`), projetée en privé par graine (B4, R06).
- **Formateur** : `GET …/rappels/synthese` (par concept : boîtes 1, 2, 3 et non vus).
- **Notation** : non noté ; Leitner mis à jour. **Manques** : B1, B4, B9 ; F1, F10.

#### `fp-cardsort` — tri de l’acte 1, mini-jeu 1, contrôle discriminant (A1-05, A2-07, A5-07)

- **Rôle** : ateliers de décision à catégories objectivables ; mini-jeu chronométré en A2-07.
- **Public** : `plan` (cartes mélangées côté serveur par un générateur dérivé de la graine,
  catégories, `dureeJeuMs?`).
- **Secret** : `CorrigeClassement` (catégorie attendue, confusion, justification par carte, seuil
  0,75).
- **Correction serveur** : carte par carte ; chaque carte classée une fois dans une catégorie connue
  (sinon 400) ; score = justes ÷ cartes ; une confusion par carte mal placée (toutes comptées) ; la
  confusion la plus fréquente alimente le Leitner.
- **Notation** : 3 questions notées. **Manques** : B1, B2, B4, B5, B10, B11 ; F1, F2, F7.

#### `fp-challenge` — défis ouverts (A1-10, A5-08, A6-04)

- **Rôle** : produire avant de voir la solution (effet de génération), puis comparer à des stratégies
  de référence dont une est fausse.
- **Public** : `probleme` (`id`, `enonce`, `invite`, `strategies: []`).
- **Secret** : `CorrigeDefi` (stratégies avec `fausse`).
- **Traitement serveur** : `POST …/defis/:defiId/tentative` enregistre la tentative (réponse libre,
  écran servi exigé), **fige la première** et renvoie les stratégies sans `fausse` ; `GET
…/defis/:defiId/strategies` les resert (404 sans tentative) et ajoute `fausse` seulement après la
  révélation pilotée (`pilotage.revele`).
- **Notation** : non noté. **Manques** : B1, B2, B12, B20, B21 ; F1, F2, F8.

#### `fp-worked` — exemples travaillés à étayage dégressif (A2-06, A3-04, A3-06, A5-03)

- **Rôle** : enseigner la méthode avant l’atelier qui l’évalue, puis retirer progressivement les
  étapes montrées.
- **Public** : `exemple` et `etayage` initial ; l’étayage courant vient du pilotage (`direct`).
- **Traitement serveur** : une réponse libre par étape rédigée (`activityId: <exempleId>:<etapeId>`).
- **Notation** : non noté. **Manques** : B1, B21 ; F2, F14.

#### `fp-plot` — manipulation graphique (A2-02, A5-04) et `fp-concept4` — machine à coefficients (A3-02)

- **Rôle** : faire varier un paramètre et observer la conséquence ; exposition active, sans production
  enregistrée.
- **Public** : `definition` (expressions en chaînes ; `bornesOrdonnee` avec `minParametre` et
  `maxParametre` ; `description` pour `fp-plot`). Noms de paramètres en lettres seules.
- **Notation** : aucune. **Manques** : B1 (schéma de stockage, dont `bornesOrdonnee` et
  `description`) ; F23 (`description` rendue).

#### `fp-vote` — instruction par les pairs (A3-01, A5-02) et questions des ateliers

- **Rôle** : vote individuel, débat, vote sur un **cas jumeau**, révélation.
- **Public** : `question` et, pour les écrans à pairs, `questionJumelle` (même forme), options à
  **identifiants stables** (`slugOption(libelle)`), ordre mélangé par graine ; côté pupitre :
  résultats `{ total, parOption }` indexés par ces identifiants.
- **Secret** : définitions stockées (`questions`) ; révélation (`corrige` de type `revelation`).
- **Phases** : `vote` → `discussion` → `revote` → `revele`, persistées par écran, monotones (pas de
  retour en arrière), diffusées dans l’`etat` du flux ; en `vote`, seule la principale est acceptée ;
  en `discussion`, aucune ; en `revote` et `revele`, seule la jumelle (409 `PHASE_FERMEE` sinon). En
  rythme libre, sans phase : principale seule. L’énoncé de la jumelle figure dans le sujet dès le
  départ (sans aucune réponse) ; la brique ne l’affiche qu’à partir de `revote` (choix acté).
- **Notation** : 2 questions notées par écran à pairs ; les votes des ateliers sont notés.
- **Manques** : B1, B3, B10, B21, B22 ; F1, F2, F9, F20.

#### `fp-numeric` — questions numériques des ateliers

- **Public** : `question` (`id`, `enonce`, `unite`). **Secret** : `NumeriqueStockee` (solution,
  tolérance, pièges). **Correction** : existante (tolérance, pièges, `TirageAmbiguError` si un piège se
  confond avec la solution). **Notation** : notée. **Manques** : B3.

#### `questionnaire` — ateliers 1 à 4 (A2-03, A3-07, A4-03, A5-06)

- **Rôle** : regrouper les questions fermées en ateliers de 8 à 15 minutes.
- **Public** : `{ intitule, consigne, regime, ordre, questions: { brique, donnees }[] }` ; `ordre:
'fixe'` conserve l’ordre du fichier (les quatre ateliers de la V3), `'melange'` (défaut) mélange
  par graine ; les options sont toujours mélangées.
- **Notation** : chaque question notée. **Manques** : B1, B3, B4 ; F1.

#### `fp-recall` — ouverture (A1-01) et `fp-exit` — billet de sortie (A6-08)

- **Public** : `fp-recall` : `{ question, delaiMs }` ; `fp-exit` : `{ billet }`.
- **Traitement** : le choix passe par `POST …/answers` ; le texte du rappel
  (`activityId: <questionId>:rappel`) et le texte argumenté du billet (`activityId: <billetId>`) sont
  enregistrés en réponses libres, jamais vides (aujourd’hui ils sont perdus).
- **Notation** : le choix est noté ; les textes ne le sont pas. **Manques** : B1, B3 ; F1, F2, F14.

#### `fp-pro`, `fp-story`, `fp-quote`

- `fp-pro` (A1-03) : `cas` (`metier`, `situation`, `geste`, `consequence`). Manque : B1.
- `fp-story` (A4-01 et support des écrans v2) : `recit` (`titre`, `paragraphes`, `visuel?`,
  `video?` avec `srcPoste`, `sousTitres`, `preload`). Manques : B1 (schéma strict qui refuse `visuel`
  et `video`), B14 (chemins `/assets/cours/…`), F12.
- `fp-quote` : non utilisé (aucune citation historique vérifiable ne s’imposait) ; la brique reste
  enregistrée pour d’autres cours.

#### Rendus v2 (hero, table, grid, method-path, reflection, chart, image-left, image-right, stats, guide)

- Validés par `VisualPresentation.ts`, étendu par B29 : `chart.description` (alternative textuelle),
  `grid.imprimable`, chemins `/assets/cours/…` pour les images (B14).
- `quiz`, `cta` et le `nestedQuiz` d’`image-left` ne sont pas utilisés par la V3 mais restent
  disponibles.
- `reflection` : réponse libre enregistrée par le service partagé des réponses libres (F14) ; compte
  comme interactif.
- `chart` : graduations visibles pour les barres et les courbes, `axisRanges[0]` respecté en
  `kind: 'line'`, barres proportionnelles quand l’axe part de 0, étiquettes directes et marqueurs
  distincts par série, bouton « Voir les données » (F13).

### 4.3 Ce qui manque dans le back

| #   | Manque                                                                                        | Contrat attendu (formes au § 9)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Fichiers                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | **Stockage multi-briques** : `ecranStocke` n’accepte que `fp-story` (`CoursStocke.ts` l. 246) | union discriminée zod sur `brique` (17 briques + `questionnaire`), schémas `strict` à **tous** les niveaux imbriqués ; clefs réservées ; propriétés sœurs figées par brique (`delaiMs`, `questionJumelle`, `etayage`, `regime`, `ordre`, `modalite`) ; colonnes d’écran `titre` et `diffusion` (entité puis migration générée) ; `PROPRIETE_PAR_BRIQUE` étendu aux cinq briques restaurées ; les versions 1 et 2 restent lisibles                                                                                                                                                                                                                                                                     | `CoursStocke.ts` + spec, `Tirage.ts` (l. 59-74), `FormationScreenContent.entity.ts`                                                                        |
| B2  | **Corrigés**                                                                                  | `Corrige.ts` : `CorrigeFeuille`, `CorrigeTableau`, `CorrigeClassement`, `CorrigeEnigme`, `CorrigeDefi`, `CorrigeRevelation` ; zod ; contrôle d’ambiguïté piège / attendu (comme `assurerNonAmbigu`) ; projetés au déroulé seulement (B22)                                                                                                                                                                                                                                                                                                                                                                                                                                                             | nouveau `domain/cours/Corrige.ts`                                                                                                                          |
| B3  | **Questions stockées**                                                                        | `VoteStockee` (options `{ id, libelle, confusion }`, `id = slugOption(libelle)`, une seule option à `confusion: null`) et `NumeriqueStockee`, converties par `questionVote` / `questionNumerique` avec des données constantes ; `Tirage` mélange l’ordre des options par graine mais garde leurs identifiants stables                                                                                                                                                                                                                                                                                                                                                                                 | `CoursStocke.ts`, `Cours.ts`, `Tirage.ts` (l. 364-388)                                                                                                     |
| B4  | **Questions de production et barème v2**                                                      | `Question = QuestionNumerique \| QuestionVote \| QuestionProduction` ; `TypeQuestion` ; `Bareme = BaremeV1 \| BaremeV2` (v2 : `ecranId`, `rangEcran`, `ouverture`, `origine`, solutions communes, écarts par graine, corrigés de production) ; `enregistrerQuestionAttachee` en aiguillage exhaustif (`switch` + `never`, `Tirage.ts` l. 165-212, l. 193 aujourd’hui cassante) ; `corrigesDe` limité aux votes et numériques (`DeroulePresentateur.ts` l. 78-90) ; `SessionReport`, `ResultatsSeance`, `SubmitAnswer` adaptés ; banque de rappel projetée en privé par graine avec un générateur dérivé (`TirageDuCours.banque`, jamais dans `sujet`) ; `ordre: 'fixe'` respecté (`Tirage.ts` l. 272) | `Cours.ts`, `Bareme.ts`, `OuvertureTirages.ts`, `Tirage.ts`, `DeroulePresentateur.ts`, `SessionReport.ts`, `ResultatsSeance.ts`, `SubmitAnswer.useCase.ts` |
| B5  | **Route des productions**                                                                     | `POST /formations/sessions/:id/productions` ; `ValeurProduction` (feuille, tableau, classement, ou « je ne sais pas ») validée contre le plan (noms de cellules dans la grille, cellules verrouillées ignorées, ≤ 200 caractères, valeurs finies, chaque carte classée une fois ; identifiant du plan = identifiant de la question) ; production sans aucune saisie → 400 `PRODUCTION_VIDE` ; une production par question                                                                                                                                                                                                                                                                             | nouveau `SubmitProduction.useCase.ts`, DTO, `FormationsStudent.controller.ts`                                                                              |
| B6  | **Moteur de formules canonique**                                                              | `domain/cours/Formule.ts` (TypeScript pur) : mémoïsation par cellule, AST en cache, budget de 20 000 nœuds (dépassement → `#VALEUR!`), formule ≤ 200 caractères, profondeur ≤ 64 ; `formeR1C1` ; compatibilité tableur (M13) ; `no-eval`, `no-new-func` ; vecteurs canoniques signés (R16)                                                                                                                                                                                                                                                                                                                                                                                                            | nouveau fichier + spec, `formule.vecteurs.json`                                                                                                            |
| B7  | **Énigmes**                                                                                   | tables `formation_escape_progress` (compteur atomique plafonné) et `formation_escape_attempts` (journal) ; `POST …/escape/:parcoursId/tentatives` ; progression dans `GET …/moi` et dans le flux formateur                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | use cases, repositories, entités, migrations générées                                                                                                      |
| B8  | **Jalons**                                                                                    | table `formation_pulses` (clé HMAC du participant, `CHECK etat`, cascade) ; `PUT …/pulses/:sondageId` ; agrégat au flux et au rapport                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | idem                                                                                                                                                       |
| B9  | **Rappels**                                                                                   | `choisirRappels` ; table `formation_rappels_servis` ; `GET …/rappels` ; `GET …/rappels/synthese` ; banque au barème                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | nouveau `LireRappels.useCase.ts`, `SyntheseRappels.useCase.ts`                                                                                             |
| B10 | **Résultats détaillés**                                                                       | `ResultatQuestion` étendu : `type`, `noteCompte`, `ecranId`, `parOption` indexé par l’identifiant **stable** d’option (et `__je_ne_sais_pas__`), `scoreMoyen`, `parCle` (cellules, cartes, lignes)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `ResultatsSeance.ts`, `GetSessionResults.useCase.ts`                                                                                                       |
| B11 | **Score et détail des productions**                                                           | colonnes `score real NULL` et `details jsonb NULL` sur `formation_answers` ; `misconception` = confusion la plus fréquente de `details`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `FormationAnswer.entity.ts`, `IAnswers.repository.ts`                                                                                                      |
| B12 | **Défis**                                                                                     | `POST …/defis/:defiId/tentative`, `GET …/defis/:defiId/strategies` ; colonnes `premiere_reponse` et `strategies_servies_le` sur `formation_free_responses`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `SubmitDefi.useCase.ts`, `FormationFreeResponse.entity.ts`                                                                                                 |
| B13 | _(remplacé par B21)_                                                                          | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | —                                                                                                                                                          |
| B14 | **Médias du même domaine**                                                                    | images, vidéos, pistes : `https://` seulement (`z.url({ protocol: /^https$/ })`) ou chemin `^/assets/cours/[a-z0-9-]+/v[0-9]+/[a-z0-9.-]+\.(webp\|jpg\|png\|webm\|vtt)$` sans `..` ; `video.source` : `https://` ou `^/formations/[a-z0-9-]+$`                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `VisualPresentation.ts`, `CoursStocke.ts`                                                                                                                  |
| B15 | **`verifierStructure` restauré et adapté**                                                    | § 2.6 et § 6.4 : interactivité, 7 règles d’origine, 6 nouvelles, dérogations justifiées ; test `b2-v3.cours.spec.ts` : `verifierStructure(B2 v3) === []`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `domain/cours/StructureCours.ts` + spec (depuis `c8324cb^`)                                                                                                |
| B16 | **Concepts et confusions**                                                                    | 7 concepts et 30 confusions ajoutés (§ 5.9), chacun rattaché à un concept ; précède B18                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `banque/concepts.ts`, `banque/confusions.ts`                                                                                                               |
| B17 | **Remédiations et médias persistés**                                                          | colonnes `remediations jsonb NOT NULL DEFAULT '{}'` et `medias jsonb NOT NULL DEFAULT '[]'` sur `formation_course_contents` ; lues vers `Cours.remediations` et `Cours.medias` (aujourd’hui `{}` en dur, `CoursStocke.ts` l. 342)                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `FormationCourseContent.entity.ts`, `CoursCatalogue.repository.typeorm.ts`                                                                                 |
| B18 | **Contenu V3**                                                                                | fichier de données typé `src/migrations/data/b2-v3.cours.ts` (`z.input<typeof coursStocke>`, 52 écrans, notes, questions, corrigés, banque, remédiations, médias) ; migration `InsertB2CoursV3` qui valide par `lireCoursStocke` et `verifierStructure`, insère **sans publier** ; `down` refusé si une séance référence la v3                                                                                                                                                                                                                                                                                                                                                                        | nouveau fichier de données + migration                                                                                                                     |
| B19 | **Diffusion au catalogue**                                                                    | `LireCoursPublic` sert les écrans `seance` verrouillés (titre, durée) ; limitation 60 requêtes/min par adresse                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `LireCoursPublic.useCase.ts`, `FormationsCatalog.controller.ts`                                                                                            |
| B20 | **Garde « écran servi »**                                                                     | `domain/cours/EcranServi.ts` : `dernierEcranServi` (extrait de `LireSujet`), `assertEcranServi` → 409 `ECRAN_NON_SERVI` ; appliquée à toutes les écritures étudiantes (réponses, productions, tentatives, jalons, rappels, réponses libres, défis) ; `activitesLibres(cours)` liste les `activityId` admis par écran                                                                                                                                                                                                                                                                                                                                                                                  | nouveau fichier, tous les use cases d’écriture                                                                                                             |
| B21 | **Pilotage par écran persisté**                                                               | colonnes `pilotage_ecrans jsonb` et `revision int` sur `formation_sessions` ; `ControlSessionChanges.pilotage` validé (écran du cours, brique compatible, étayage borné, phases monotones) ; `LiveSessionState.pilotage` et `revision` dans l’empreinte ; `SubmitAnswer` applique les phases                                                                                                                                                                                                                                                                                                                                                                                                          | `ControlSession.useCase.ts`, `ISessionStateCache.port.ts`, `SessionStateCache.service.ts`, `StreamSession.useCase.ts`, `FormationSession.entity.ts`        |
| B22 | **Corrigés au déroulé**                                                                       | `EcranDeroule.corrigeEcran` (productions, défis, révélation) ; `questionsDeLEcran` couvre les nouvelles questions ; jamais dans le sujet ni le catalogue                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `DeroulePresentateur.ts`                                                                                                                                   |
| B23 | **État du participant**                                                                       | `GET /formations/sessions/:id/moi` (données de l’appelant seulement)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | nouveau `LireEtatParticipant.useCase.ts`                                                                                                                   |
| B24 | **Cache et coût**                                                                             | cache LRU `(slug, version) → Cours` ; `trouverCourant` par la table de publication ; mémo LRU `tirer` par `(slug, version, graine)` ; `bilanDe` au plus 1 fois par seconde et par séance, partagé entre les flux formateur ; `findById` sans barème pour les routes qui n’en ont pas besoin                                                                                                                                                                                                                                                                                                                                                                                                           | `CoursCatalogue.repository.typeorm.ts`, `StreamSession.useCase.ts`, `GetSessionResults.useCase.ts`, `Sessions.repository.typeorm.ts`                       |
| B25 | **Publication réversible**                                                                    | table `formation_course_publications` ; `trouverCourant` et le catalogue lisent la version publiée ; `PUT /formations/catalogue/:slug/publication` (administrateur) avec validation préalable ; `OpenSessionCommand.version?` réservé à l’administrateur ; migration d’amorçage (B2 v2 publiée)                                                                                                                                                                                                                                                                                                                                                                                                       | nouveau use case, entité, `OpenSession.useCase.ts`, `CoursCatalogue.repository.typeorm.ts`                                                                 |
| B26 | **Rapport, mails et statistiques**                                                            | `ValeurReponse`, `DetailProduction` ; `reponseLisible` (« Feuille : 14/17 cellules justes ») ; `RapportSession.jalons`, `enigmes` ; statistiques sur les questions notées seulement ; `notation` et `bareme` dans les résultats                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `SessionReport.ts`, `SessionStatistics.ts`, `FormationMailer.service.ts`, `GetSessionResults.useCase.ts`                                                   |
| B27 | _(fusionné dans B7)_                                                                          | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | —                                                                                                                                                          |
| B28 | **Capacité et éviction**                                                                      | `formation_sessions.capacite` (40 par défaut, 1 à 60) ; au-delà, 409 `SEANCE_COMPLETE` ; `DELETE /formations/sessions/:id/participants/:participantId` (formateur propriétaire) : jeton révoqué, place et graine libérées, réponses conservées                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `OpenSession.useCase.ts`, `JoinSession.useCase.ts`, nouveau `EvincerParticipant.useCase.ts`, `FormationParticipant.entity.ts`, `ParticipantToken.guard.ts` |
| B29 | **Extensions de `VisualPresentation`**                                                        | `chart.description` (obligatoire en V3), `grid.imprimable?`, `description` des définitions `fp-plot`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `VisualPresentation.ts`, `CoursStocke.ts`                                                                                                                  |
| B30 | **Robustesse transverse**                                                                     | limitations de débit des nouvelles routes (M20) ; mise à jour atomique du Leitner (`succes = succes + 1`) ; instance unique documentée pour le cache d’état ; tout export tabulaire préfixe `'` devant `= + - @ \t \r`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `formations-throttling.ts`, `Mastery.repository.typeorm.ts`, `docs/`                                                                                       |

### 4.4 Ce qui manque dans le front

| #   | Manque                                                                                                                                          | Attendu                                                                                                                                                                                                                                                                | Fichiers                                                                                                                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Montage : `PROPRIETES_PAR_BRIQUE` ignore les cinq briques restaurées ; le questionnaire n’affiche ni titre ni consigne ; `delaiMs` jamais monté | propriétés par brique du § 9.4 ; `PORTEUR_DE_REPONSE` étendu ; intitulé et consigne du questionnaire ; écran `ecran-verrouille` rendu (titre, durée, mention « disponible pendant la séance »)                                                                         | `lecture-ecran.ts`, `slide-activity.component.ts`                                                                                            |
| F2  | Relais : seuls 4 événements sont relayés                                                                                                        | tous les événements des briques deviennent des `EvenementBrique` (§ 9.7) ; réinjection par `retours` et `direct`                                                                                                                                                       | `slide-activity.component.ts`                                                                                                                |
| F3  | Rôle : l’hôte pose `data-slide-role`, `FpBlock` lit `data-cours-role`                                                                           | poser `data-cours-role` ; ne **pas** poser de graine (les mélanges sont faits par le serveur) ; auditer chaque `renderStage`                                                                                                                                           | `slide-activity.component.ts`, `cours-scene.component.ts`                                                                                    |
| F4  | `FpEscape` : solutions et fragments dans la charge, empreinte réversible, clé locale commune à toutes les séances                               | contrat public seul ; événement `fp-escape-tentative` ; verdicts et fragments par `retours` ; reprise par `moi`                                                                                                                                                        | `FpEscape.ts` + spec                                                                                                                         |
| F5  | `FpTableBuild` : `calcul` est une fonction, arrondi au centime à chaque étape                                                                   | contrat sérialisable du § 9.4 ; formules par `evaluerExpression` ; arrondi à l’affichage ; synthèse ; `soldeDe` conservé ; fabriques de test migrées                                                                                                                   | `FpTableBuild.ts` + spec, `cours.factory.ts`                                                                                                 |
| F6  | `FpSheet` : pas de consignes ni de verdict ; `set plan` remet tout à zéro                                                                       | consignes ; verdict par cellule ; « Je ne sais pas » ; brouillon (F18)                                                                                                                                                                                                 | `FpSheet.ts`                                                                                                                                 |
| F7  | `FpCardsort` : ni chrono ni score                                                                                                               | `dureeJeuMs` (compte à rebours, jamais bloquant) ; verdict carte par carte ; « Je ne sais pas » ; tri au clavier vérifié                                                                                                                                               | `FpCardsort.ts`                                                                                                                              |
| F8  | `FpChallenge` : stratégies servies avec l’énoncé                                                                                                | liste vide au départ ; stratégies par `retours` ; `fausse` seulement après révélation                                                                                                                                                                                  | `FpChallenge.ts`                                                                                                                             |
| F9  | `FpVote` : phases et résultats jamais alimentés ; le setter `phase` émet un événement ; `seed` re-mélange                                       | `questionJumelle` ; phase depuis `direct` (setter sans émission) ; `resultats` depuis `parOption` stable ; aucun mélange côté poste                                                                                                                                    | `FpVote.ts`                                                                                                                                  |
| F10 | `FpSpaced` : la vue formateur liste des questions ; textes faux en séance                                                                       | propriété `rappel` ; questions par `retours` ; vue formateur = carte de maîtrise ; nouveaux libellés                                                                                                                                                                   | `FpSpaced.ts`                                                                                                                                |
| F11 | `FpPulse` : `comptes` jamais alimentés                                                                                                          | comptes depuis `direct` ; masqués en projection sous 5 réponses                                                                                                                                                                                                        | `FpPulse.ts`, hôte                                                                                                                           |
| F12 | `FpStory` : vidéo sans sous-titres                                                                                                              | `<track kind="captions" srclang="fr" label="Français" default>` ; `srcPoste` en `hand` ; `preload="none"`                                                                                                                                                              | `FpStory.ts`                                                                                                                                 |
| F13 | `slide-chart` : courbe sur min–max sans graduation ; plancher de 8 % des barres                                                                 | graduations ; `axisRanges[0]` en `kind: 'line'` ; barres proportionnelles depuis 0 ; étiquettes directes et marqueurs ; `description` et bouton « Voir les données » (tableau HTML) ; contrastes ≥ 3:1 (traits) et ≥ 4,5:1 (textes), teinte `gold` ramenée à `#8A5E00` | `slide-chart.component.*`                                                                                                                    |
| F14 | Textes libres des briques runtime perdus ; file hors ligne enfermée dans `slide-reflection`                                                     | service `ReponsesLibresService` partagé ; jamais de texte vide ; une réponse libre par étape de `fp-worked` ; politique hors ligne : productions et jalons en file (409 = succès), tentatives jamais en file                                                           | `free-response.queue.ts`, nouveau service, `slide-reflection.component.ts`                                                                   |
| F15 | _(remplacé par F21)_                                                                                                                            | —                                                                                                                                                                                                                                                                      | —                                                                                                                                            |
| F16 | _(remplacé par H2)_                                                                                                                             | —                                                                                                                                                                                                                                                                      | —                                                                                                                                            |
| F17 | **Contrat de l’hôte**                                                                                                                           | `evenement`, `retours`, `direct`, `corrige`, `apercu` (§ 9.7) ; clé de montage `${slide.id}\|${render}\|${role}\|${apercu}` ; mises à jour par `setProperty` sur les éléments conservés, jamais par remontage                                                          | `slide-activity.component.ts`, `cours-etudiant.component.ts`, `formations.port.ts`, `formations-http.adapter.ts`, `createFormationsPortStub` |
| F18 | **Brouillons et reprise**                                                                                                                       | brouillons (sauvegarde différée d’une seconde) sous `fp.<sessionId>.<participantId>.<brique>.<id>`, purgés à `fin` et à tout nouveau rattachement ; un 409 déclenche `lireMonEtat` et la réinjection du verdict ; message « déjà répondu » visible                     | `core/storage.ts`, `cours-etudiant.component.ts`                                                                                             |
| F19 | **Pupitre**                                                                                                                                     | panneaux : productions (par cellule, carte, ligne), énigmes, carte de maîtrise, jalons, billets reçus ; commandes de phase, de révélation et d’étayage ; éviction ; phrase de notation à partir de `notation` et `bareme`                                              | pupitre `features/cours/presentateur/*`                                                                                                      |
| F20 | **Types du flux**                                                                                                                               | `EtatSession.revision` et `pilotage` (absents → 0 et `{}` : le front accepte l’ancienne forme) ; `ResultatsSeance` étendu ; gardes `estEtatSession` et `estResultatQuestion` mises à jour                                                                              | `core/sync.ts`, `content/types.ts`                                                                                                           |
| F21 | **Page publique en aperçu**                                                                                                                     | la page du cours monte `app-slide-activity [apercu]="true"` pour les écrans runtime `catalogue` ; aucune requête d’écriture ; écrans `seance` verrouillés (titre, durée) ; résumé HTML (titre, durée) servi en rendu serveur pour le référencement                     | `features/formations/b2-01-traitement-information-chiffree/*`                                                                                |
| F22 | **Banc E2E réel**                                                                                                                               | projet Playwright `e2e-seance` (§ 10.2)                                                                                                                                                                                                                                | `playwright.config.ts`, `e2e/seance/*`                                                                                                       |
| F23 | **Rendus v2 étendus**                                                                                                                           | `grid.imprimable` : bouton « Imprimer ou enregistrer en PDF » et feuille de style d’impression (accès à `window` protégé pour le rendu serveur) ; `description` des graphiques et des `fp-plot`                                                                        | `slide-grid.component.*`, `FpPlot.ts`                                                                                                        |

### 4.5 Règle de notation par brique

| Écran                                                                                   | Élément                            | Questions notées (`noteCompte`) | Leitner |        Statistiques        |
| --------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------: | :-----: | :------------------------: |
| A1-01                                                                                   | rappel d’ouverture (vote)          |                               1 |   oui   |            oui             |
| A1-05, A2-07, A5-07                                                                     | classements                        |                               3 |   oui   |      oui (par carte)       |
| A2-03, A3-07, A4-03, A5-06                                                              | ateliers (6 + 5 + 4 + 5 questions) |                              20 |   oui   |            oui             |
| A3-01, A5-02                                                                            | votes et cas jumeaux               |                               4 |   oui   | oui (gain vote 1 → vote 2) |
| A4-02                                                                                   | feuille                            |                               1 |   oui   |     oui (par cellule)      |
| A4-05                                                                                   | tableau                            |                               1 |   oui   |      oui (par ligne)       |
| A6-08                                                                                   | billet (choix)                     |                               1 |   oui   |            oui             |
| A6-02                                                                                   | énigmes (première tentative)       |                0 (4 non notées) |   oui   |      oui (hors note)       |
| A6-05                                                                                   | rappels                            |       0 (3 ou 4 servies sur 13) |   oui   |      oui (hors note)       |
| A1-08, A3-09, A1-10, A5-08, A6-04, A2-06, A3-04, A3-06, A5-03, textes de A1-01 et A6-08 | réponses libres                    |                               0 |   non   |     lecture formateur      |
| jalons                                                                                  | sondages                           |                               0 |   non   |          agrégat           |
| **Total**                                                                               |                                    |                          **31** |         |                            |

Répartition des 31 questions notées : 19 votes, 7 numériques, 3 classements, 1 feuille, 1 tableau.
Complétion d’un étudiant = questions notées répondues (« je ne sais pas » compris, pour les votes
comme pour les productions) ÷ 31 ; note = 20 × complétion ÷ complétion de référence (rang des 20 %
supérieurs), plafonnée à 20 ; sous le seuil si complétion < 40 % de la référence. Une production vide
est refusée (400), elle ne peut donc pas gonfler la participation. Les énigmes et les rappels
n’entrent ni dans la note ni dans `tauxReussite` et `questionsProblemes`.

### 4.6 Éléments annexes (H1 à H6)

| #   | Élément                                              | Dépôt         | Contrat et changement                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Test de sortie                                                                                          |
| --- | ---------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| H1  | `lastmod` du sitemap pour les cours servis par l’API | back et front | back : `GET /formations/catalogue/:slug` renvoie aussi `version` et `publieLe` (ISO 8601, `publiee_le` de la table de publication, B25 : date de la bascule, pas celle de la migration) ; front : `src/server.ts` lit `publieLe` sur le modèle de `loadArticleSitemap` (URL de l’API par variable d’environnement, délai 2 s, cache 5 min), publie `lastmod = max(lastmod de seo-metadata.json, publieLe)`, et journalise en `warn` tout repli ; `docs/seo-lastmod.md` mis à jour | back : test HTTP du champ ; front : test de `buildSitemapXml` avec et sans API                          |
| H2  | Libellés des briques runtime                         | front         | `src/cours/runtime/core/i18n.ts` : le dictionnaire monolingue devient un dictionnaire de `$localize` (identifiants `@@coursRuntime` + clé en PascalCase, annexe D) ; traductions anglaises dans `src/locale/messages.en.xlf` ; `texte(cle)` inchangé pour les briques                                                                                                                                                                                                             | `npm run extract-i18n` sans différence non traduite ; test : chaque clé a une cible anglaise non vide   |
| H3  | `i18n-aria-label` mort                               | front         | `slide-deck.component.html` l. 26-32 : `i18n-aria-label` ne traduit pas un `[attr.aria-label]` lié ; le composant expose `libellePlein` et `libelleCompact` calculés par `$localize` (`@@slideDeckFullscreenEnter`, `@@slideDeckFullscreenExit`, `@@slideDeckFullscreenEnterShort`, `@@slideDeckFullscreenExitShort`) et le gabarit les lie ; le marqueur mort est retiré                                                                                                         | test du composant en locale anglaise simulée ; extraction XLF                                           |
| H4  | Accents manquants de Sebastian                       | front         | « Quantite » → « Quantité » (`sebastian-add-drink-sheet.component.ts` l. 136, placeholder « Quantité max » de `sebastian-goals.component.ts` l. 50) ; « Cafe » → « Café » (`sebastian-app.component.ts` l. 71, options de `sebastian-history` et `sebastian-goals`, `$localize` `@@sebastianCategoryCoffee` et `@@sebastianDrinkCoffee`) ; sources XLF régénérées, cibles anglaises inchangées ; spec du heatmap mise à jour                                                      | extraction XLF ; tests Sebastian                                                                        |
| H5  | Texte alternatif du projet 9                         | front         | `projets.component.ts` l. 140 : `@@projetsProject9ImageAlt` « illustration — Fourmizzz Suite » (le projet ne s’appelle plus « Le Jeu des Fourmis ») ; cible anglaise « illustration — Fourmizzz Suite »                                                                                                                                                                                                                                                                           | extraction XLF ; test du composant                                                                      |
| H6  | Flux SSE : plafond atteint ou Redis en panne         | back          | `StreamCapacity.service.ts` lève `PlafondDeFluxAtteintError` quand le script renvoie 0 ; toute autre erreur est une panne ; `StreamSession.useCase.ts` : plafond atteint → `warn` et 429 `SessionStreamLimitError` ; panne → `error` (cause jointe) et ouverture du flux en mode dégradé, bornée par les plafonds du processus (100 flux étudiants par séance, 2 par participant, 4 pour le formateur)                                                                            | tests unitaires des deux branches (journal et issue) ; E2E : Redis coupé, flux ouverts, journal `error` |

---

## 5. Jeux de données

Toutes les données d’Atelier Rivage et des cas satellites sont **fictives** et déclarées comme telles
à l’écran (champ `source` ou `note`). Seules les données d’inflation sont réelles (Insee).

### 5.1 L’entreprise et la terminologie

| Élément                                           | Valeur                                                                                                                                                                             |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Raison sociale                                    | Atelier Rivage (SAS, fictive)                                                                                                                                                      |
| Activité                                          | voilerie artisanale : voiles sur mesure, entretien et hivernage ; accessoires en toile recyclée confectionnés par un atelier partenaire et revendus en l’état                      |
| Implantation                                      | La Rochelle                                                                                                                                                                        |
| Effectif                                          | 12 salariés en 2024, 14 en 2025                                                                                                                                                    |
| Canaux et taux de marge brute (stables 2024–2025) | sur-mesure 36 %, entretien 28 %, marketplace 16 %                                                                                                                                  |
| Définition                                        | marge brute = CA HT − coûts directs (matière, sous-traitance, commissions de plateforme) : une **marge sur coûts directs** ; taux de marge brute (sur CA HT) = marge brute ÷ CA HT |

**Terminologie tranchée.** Le deck écrit « taux de marge = marge / CA ». L’expression est ambiguë : en
calcul commercial, le **taux de marge** rapporte la marge au coût d’achat HT et le **taux de marque**
la rapporte au prix de vente HT ; dans les soldes intermédiaires de gestion, le **taux de marge
commerciale** rapporte la marge commerciale aux ventes de marchandises (Insee, définition c2224) ; en
statistique d’entreprise, le « taux de marge » est l’EBE rapporté à la valeur ajoutée. La V3 nomme
l’indicateur d’Atelier Rivage « taux de marge brute (sur CA HT) », définit la marge brute comme une
marge sur coûts directs (vocabulaire du processus P5) et écrit toujours le dénominateur. Le taux de
marge est une variation relative (du coût au prix : +25 % pour le sac étanche), le taux de marque
une proportion (part du prix : 20 %) : c’est le premier objectif du module, et la question 6 de
l’atelier 1 l’évalue. Les libellés imprécis sont conservés **volontairement** dans les pièces de
Samir (A1-04, A1-05, A5-07) : les corriger fait partie du travail de l’étudiant.

### 5.2 Cas 1 — Tableau de bord par canal

| Canal       |      CA HT 2024 |      CA HT 2025 |   Évolution | Part 2024 | Part 2025 |                  Taux |    Marge 2024 |    Marge 2025 | Écart de marge |
| ----------- | --------------: | --------------: | ----------: | --------: | --------: | --------------------: | ------------: | ------------: | -------------: |
| Sur-mesure  |       483 000 € |       397 000 € |    −17,81 % |      46 % |   34,52 % |                  36 % |     173 880 € |     142 920 € |      −30 960 € |
| Entretien   |       210 000 € |       230 000 € |     +9,52 % |      20 % |      20 % |                  28 % |      58 800 € |      64 400 € |       +5 600 € |
| Marketplace |       357 000 € |       523 000 € |    +46,50 % |      34 % |   45,48 % |                  16 % |      57 120 € |      83 680 € |      +26 560 € |
| **Total**   | **1 050 000 €** | **1 150 000 €** | **+9,52 %** |     100 % |     100 % | **27,60 % → 25,30 %** | **289 800 €** | **291 000 €** |   **+1 200 €** |

- Écart du taux global : −2,2957 points, affiché −2,3 points ; évolution relative du taux −8,32 %.
- Décomposition : effet volume +27 600 € (1 150 000 × 27,6 % − 289 800), effet de répartition
  −26 400 € (291 000 − 317 400), total +1 200 €.
- Part de la marketplace dans la marge brute 2025 : 83 680 ÷ 291 000 = 28,76 % (contre 45,48 % du
  CA).
- Modèle du simulateur (entretien fixé à 20 %) : taux global = 34,4 − 0,2 × part de la marketplace ;
  les deux années réelles sont sur la courbe (34 % → 27,6 % ; 45,48 % → 25,30 %).
- Commandes : marketplace 2 900 (2024) puis 4 200 (2025) sur 5 000 commandes au total en 2025 (84 %) ;
  panier moyen marketplace 123,10 € puis 124,52 € ; autres canaux 783,75 € en 2025 (627 000 € pour
  800 commandes).
- Marge brute 2022–2025 (diapositive A1-09 et G1) : 285 000 € ; 288 000 € ; 289 800 € ; 291 000 €
  (+2,11 % en trois ans ; +1,05 %, +0,63 %, +0,41 % par an).
- CA HT 2025 par trimestre (atelier 3, G4, devoir TCD), en milliers d’euros : sur-mesure 120 ; 95 ;
  102 ; 80 · entretien 58 ; 61 ; 49 ; 62 · marketplace 98 ; 131 ; 167 ; 127. Totaux par canal : 397 ;
  230 ; 523 ; par trimestre : 276 ; 287 ; 318 ; 269 ; total 1 150.
- 1er semestre 2025 (T1 + T2, énigme E2) : CA 563 k€, marge 147,36 k€, taux 26,17 %, affiché 26,2 %.
- Tableau croisé dynamique du 3e trimestre 2025 (A5-05, atelier 4 Q5) : CA 102 000 €, 49 000 € et
  167 000 € ; marges 36 720 €, 13 720 € et 26 720 € ; total 318 000 € et 77 160 € ; taux au total
  24,26 % (champ calculé) contre 26,67 % (moyenne des taux). Ces nombres diffèrent de ceux de
  l’exemple travaillé A5-03 (répartition annuelle, 25,30 %).
- Tableau de bord de Samir (A1-04) : quatre défauts voulus : « +1 200 » sans unité, « −2,3 % » au lieu
  de points, toile à 20,80 € (« +4 % » additionné) au lieu de 20,70 €, « Inflation : 4,9 » (valeur de
  2023, sans unité ni période) ; plus un libellé imprécis (« Taux de marge »).
- **Devoir de prolongement déposé** (fichier `.xlsx` ou `.ods`, à rendre avant la séance B2-02) :
  « À partir du fichier trimestriel (une ligne par canal et par trimestre : canal, trimestre, CA HT,
  marge brute), créez un tableau croisé dynamique : lignes = canal ; valeurs = somme du CA HT, somme de
  la marge brute, % du total général ; ajoutez le champ calculé Taux = Marge ÷ CA. Contrôles : le total
  général du CA vaut 1 150 k€ et le taux au total vaut 25,3 %. » Le fichier fourni contient les douze
  lignes ci-dessus et les marges correspondantes (CA × taux du canal).

### 5.3 Cas 2 — Prix de la toile

| Date             | Taux annoncé | Coefficient | Prix du m² (arrondi) | Indice (base 100 au 1er janvier) | Évolution cumulée |
| ---------------- | -----------: | ----------: | -------------------: | -------------------------------: | ----------------: |
| 1er janvier 2025 |            — |           — |              20,00 € |                           100,00 |                 — |
| 1er mars         |         +8 % |        1,08 |              21,60 € |                           108,00 |           +8,00 % |
| 1er juin         |         −5 % |        0,95 |              20,52 € |                           102,60 |           +2,60 % |
| 1er septembre    |         +4 % |        1,04 |              21,34 € |                           106,70 |           +6,70 % |
| 1er décembre     |         −3 % |        0,97 |              20,70 € |                           103,50 |           +3,50 % |

- Calcul additif de Samir : 8 − 5 + 4 − 3 = +4 %, d’où 20,80 € au tableau de bord (faux).
- Taux moyen par révision : 1,0350288^(1/4) − 1 ≈ 0,86 %.
- 2026 (énigme E3) : +6 % au 1er mars, −4 % au 1er juin : coefficient 1,06 × 0,96 = 1,0176. Un rouleau
  de 50 m² coûte 20,70 × 50 = 1 035,00 € au 1er janvier 2026, puis 1 053,22 € au 1er juin ; l’énigme
  demande de retrouver 1 035,00 € à partir de 1 053,22 €.
- Comparaison à l’inflation : la toile augmente de 3,50 % sur l’année (glissement du 1er janvier au
  31 décembre) ; l’IPC augmente de 0,8 % entre décembre 2024 et décembre 2025 (glissement), et de 0,9 %
  en moyenne annuelle. On ne compare que des grandeurs de même nature (note de A4-05).

### 5.4 Cas 3 — Factures de vente de mars (TVA collectée)

| Facture   |     Pièce HT | Grand livre des ventes HT |     Écart | TVA collectée 20 % (pièce) |  TTC (pièce) |
| --------- | -----------: | ------------------------: | --------: | -------------------------: | -----------: |
| F001      |     12 000 € |                  12 000 € |       0 € |                    2 400 € |     14 400 € |
| F002      |      8 500 € |                   8 500 € |       0 € |                    1 700 € |     10 200 € |
| F003      |     15 865 € |                  15 865 € |       0 € |                    3 173 € |     19 038 € |
| F004      |     12 340 € |                  12 430 € |     +90 € |                    2 468 € |     14 808 € |
| **Total** | **48 705 €** |              **48 795 €** | **+90 €** |                **9 741 €** | **58 446 €** |

- L’écart de 90 € est un multiple de 9 : les chiffres des centaines et des dizaines de F004 sont
  intervertis (12 340 → 12 430 : (43 − 34) × 10 = 90). C’est un indice, que la pièce confirme.
- Pièges de l’énigme E4 : TVA sur le grand livre 9 759 € ; TVA « extraite » comme d’un TTC
  (48 705 × 20 ÷ 120) 8 117,50 € ; TVA de l’écart seul 18 €.
- Contrôle de février (carte A5-07, rappel R10) : total concordant, F002 +100 €, F003 −100 € : deux
  erreurs de sens contraire se compensent.
- Rappel R11 (multiple de 9) : écart de 270 € en avril (4 520 € saisi pour 4 250 €).

### 5.5 Données réelles — inflation en France (Insee)

Source : Insee, « L’essentiel sur… l’inflation », taux annuels moyens de l’indice des prix à la
consommation, paru le **23 mars 2026** (§ 8.1). Licence Ouverte 2.0 (Etalab), mention « Source :
Insee » et date de mise à jour obligatoires.

| Année | Inflation (moyenne annuelle) | Indice reconstitué (base 100 = moyenne 2019) | Indice officiel, série 011814630 rebasée (100 = moyenne 2019) |
| ----- | ---------------------------: | -------------------------------------------: | ------------------------------------------------------------: |
| 2019  |                        1,1 % |                                       100,00 |                                                        100,00 |
| 2020  |                        0,5 % |                                       100,50 |                                                        100,48 |
| 2021  |                        1,6 % |                                       102,11 |                                                        102,13 |
| 2022  |                        5,2 % |                                       107,42 |                                                        107,46 |
| 2023  |                        4,9 % |                                       112,68 |                                                        112,70 |
| 2024  |                        2,0 % |                                       114,93 |                                                        114,96 |
| 2025  |                        0,9 % |                                       115,97 |                                                        116,04 |

- Hausse 2019–2025 : +15,97 % (reconstituée) ; somme des taux (piège) 15,1 ; taux annuel moyen 2,50 %
  (1,15969^(1/6) − 1 = 2,4999 %) ; pièges 2,66 % (15,97 ÷ 6) et 2,52 % (15,1 ÷ 6). Taux moyen officiel
  2,51 %.
- **Base de l’IPC** : depuis janvier 2026, l’Insee publie l’IPC en base 100 = moyenne 2025
  (9e génération d’indices) ; la série de référence est **011814630** (France, ensemble des ménages,
  ensemble). La série 001765618 (base 2015, métropole, hors tabac) est arrêtée : elle n’est plus
  citée. Le cours reconstitue un indice base 100 = moyenne 2019 à partir des taux publiés ; l’indice
  officiel rebasé s’en écarte de quelques centièmes (7 au plus), parce que les taux publiés sont
  arrondis au dixième. L’affirmation « l’indice peut différer au centième » est supprimée.
- **Correction du deck** : « base 100 fin 2019 » est inexact : des taux en moyenne annuelle se
  chaînent depuis la **moyenne** 2019 (une base décembre 2019 donnerait 115,22 pour la moyenne 2025).
- Glissement annuel : IPC de décembre 2024 à décembre 2025 = 99,17 → 99,95 (base 2025), soit +0,8 %.
- Le programme exclut le calcul d’un indice synthétique ; le cours chaîne des taux publiés (indice
  simple), ce qui est au programme.

### 5.6 Les deux tâches de tableur

#### Tâche 1 — `fp-sheet` `b2-01-a4-feuille-canaux` (A4-02)

Grille de 7 lignes × 7 colonnes. Contenu initial (`cellules`) :

|     | A                                     | B              | C              | D               | E               | F                   | G                    |
| --- | ------------------------------------- | -------------- | -------------- | --------------- | --------------- | ------------------- | -------------------- |
| 1   | Canal                                 | CA HT 2024 (€) | CA HT 2025 (€) | Évolution du CA | Part du CA 2025 | Taux de marge brute | Marge brute 2025 (€) |
| 2   | Sur-mesure                            | 483000         | 397000         |                 |                 | 0,36                |                      |
| 3   | Entretien                             | 210000         | 230000         |                 |                 | 0,28                |                      |
| 4   | Marketplace                           | 357000         | 523000         |                 |                 | 0,16                |                      |
| 5   | Total                                 |                |                |                 |                 |                     |                      |
| 6   | Marge brute 2025 (compte de résultat) | 291000         |                |                 |                 |                     |                      |
| 7   | Contrôles                             |                |                |                 |                 |                     |                      |

`verrouillees` : A1 à G1, A2 à A7, B2 à C4, F2 à F4, B6 (23 cellules ; 26 cellules modifiables).

`consignes` :

1. « En B5 et C5, calculez les totaux avec SOMME. »
2. « En D2, écrivez le taux d’évolution du CA du sur-mesure, puis recopiez jusqu’en D5 avec le bouton
   « Recopier vers le bas ». Écrivez les taux en décimal : 0,125 correspond à 12,5 %. »
3. « En E2, écrivez la part du sur-mesure dans le CA 2025 en figeant le total, puis recopiez jusqu’en
   E5. »
4. « En G2, calculez la marge brute 2025 du canal (CA 2025 × taux de marge brute), recopiez jusqu’en
   G4, puis totalisez en G5 avec SOMME. »
5. « En F5, calculez le taux de marge brute global : marge totale ÷ CA total. »
6. « En B7, contrôlez vos formules : les parts doivent faire 100 % :
   =SI(ARRONDI(SOMME(E2:E4);6)=1;1;0). En C7, contrôlez vos données : votre marge (G5) doit égaler
   celle du compte de résultat (B6) ; ce second contrôle surveille les données. »

Corrigé (`corrige`, type `feuille`, `seuilReussite` 0,8 ; valeurs obtenues avec le moteur de formules
sur les formules de référence ; tolérance relative 10⁻⁴ sauf mention) :

| Cellule | Formule de référence                 |        Valeur | Forme exigée | Erreur de formule → confusion  | Pièges reconnus                                                               |
| ------- | ------------------------------------ | ------------: | ------------ | ------------------------------ | ----------------------------------------------------------------------------- |
| B5      | `=SOMME(B2:B4)`                      |     1 050 000 | références   | —                              | —                                                                             |
| C5      | `=SOMME(C2:C4)`                      |     1 150 000 | références   | —                              | —                                                                             |
| D2      | `=(C2-B2)/B2`                        |     −0,178054 | références   | —                              | −17,805383 (`taux-valeur-facteur-cent`) ; −0,216625 (`base-arrivee`)          |
| D3      | recopie                              |      0,095238 | même que D2  | —                              | 9,52381 ; 0,086957                                                            |
| D4      | recopie                              |      0,464986 | même que D2  | —                              | 46,498599 ; 0,3174                                                            |
| D5      | recopie                              |      0,095238 | même que D2  | —                              | 9,52381 ; 0,086957                                                            |
| E2      | `=C2/$C$5`                           |      0,345217 | références   | `reference-relative-non-figee` | 34,521739 (`taux-valeur-facteur-cent`)                                        |
| E3      | recopie                              |           0,2 | même que E2  | `reference-relative-non-figee` | —                                                                             |
| E4      | recopie                              |      0,454783 | même que E2  | `reference-relative-non-figee` | 523 000 (`reference-relative-non-figee`)                                      |
| E5      | recopie                              |             1 | même que E2  | `reference-relative-non-figee` | —                                                                             |
| G2      | `=C2*F2`                             |       142 920 | références   | —                              | —                                                                             |
| G3      | recopie                              |        64 400 | même que G2  | —                              | —                                                                             |
| G4      | recopie                              |        83 680 | même que G2  | —                              | —                                                                             |
| G5      | `=SOMME(G2:G4)`                      |       291 000 | références   | —                              | —                                                                             |
| F5      | `=G5/C5`                             |      0,253043 | références   | —                              | 25,304348 (`taux-valeur-facteur-cent`) ; 0,266667 (`moyenne-simple-des-taux`) |
| B7      | `=SI(ARRONDI(SOMME(E2:E4);6)=1;1;0)` | 1 (absolue 0) | références   | —                              | —                                                                             |
| C7      | `=SI(ARRONDI(G5-B6;0)=0;1;0)`        | 1 (absolue 0) | références   | —                              | —                                                                             |

« Références » : la formule cite au moins une cellule et ne contient aucun littéral égal à la valeur
attendue (sinon `valeur-saisie-sans-formule`). « Même que X » : en plus, la forme R1C1 de la formule
est celle de la cellule X envoyée par l’étudiant (sinon `formule-non-recopiable`). Exemples de formes
R1C1 : `=(C2-B2)/B2` en D2 → `=(RC[-1]-RC[-2])/RC[-2]` ; `=C2/$C$5` en E2 → `=RC[-2]/R5C3`, la même
en E3, E4 et E5 ; `=C2*F2` en G2 → `=RC[-4]*RC[-1]`.

Constats d’exécution : avec `=C2/C5` recopiée (référence non figée), E3 vaut `#DIV/0!` (C6 vide), E4
vaut 523 000 (division par le 1 de C7) et E5 vaut `#REF!` (ligne 8 hors grille) ; B7, qui somme E2:E4,
passe en erreur : 13 cellules justes sur 17, échec. Avec des résultats tapés sans formule en E2 à E5,
les quatre cellules sont à revoir (`valeur-saisie-sans-formule`) et B7 reste juste : 13/17, échec.

#### Tâche 2 — `fp-table-build` `b2-01-a4-indice-toile` (A4-05)

Plan public (`TableBuildPlanPublic`, les `metadonnees` sont ajoutées par le tirage) :

```json
{
  "id": "b2-01-a4-indice-toile",
  "intitule": "Tâche de tableur 2 — Prix et indice de la toile en 2025",
  "consignes": [
    "Au 1er janvier 2025, le m² de toile coûte 20,00 € HT. Pour chaque révision, calculez le nouveau prix à partir du prix précédent. Le fournisseur facture des prix arrondis au centime : arrondissez chaque prix au centime.",
    "Vérifiez la colonne « Coefficient appliqué » : elle doit redonner le taux annoncé (1,0800 pour +8 %).",
    "Calculez l’indice de chaque prix, base 100 au 1er janvier : prix ÷ 20 × 100, arrondi au centième.",
    "Comparez l’évolution réelle sur l’année à la somme des taux annoncés, celle du tableau de bord."
  ],
  "echeances": 4,
  "libellesLignes": [
    "1er mars : +8 %",
    "1er juin : −5 %",
    "1er septembre : +4 %",
    "1er décembre : −3 %"
  ],
  "parametres": { "prixInitial": 20 },
  "colonnes": [
    {
      "cle": "taux",
      "intitule": "Taux annoncé (%)",
      "role": "donnee",
      "valeurs": [8, -5, 4, -3],
      "decimales": 0,
      "totalise": true
    },
    {
      "cle": "prix",
      "intitule": "Prix du m² après révision (€ HT)",
      "role": "saisie",
      "decimales": 2,
      "totalise": false
    },
    {
      "cle": "coef",
      "intitule": "Coefficient appliqué",
      "role": "deduite",
      "formuleInitiale": "prix / prixInitial",
      "formule": "prix / avantPrix",
      "decimales": 4,
      "totalise": false
    },
    {
      "cle": "indice",
      "intitule": "Indice (base 100 au 1er janvier)",
      "role": "saisie",
      "decimales": 2,
      "totalise": false
    },
    {
      "cle": "evolution",
      "intitule": "Évolution depuis le 1er janvier (%)",
      "role": "deduite",
      "formule": "indice - 100",
      "decimales": 2,
      "totalise": false
    }
  ],
  "synthese": [
    {
      "libelle": "Somme des taux annoncés (calcul du tableau de bord)",
      "formule": "totalTaux",
      "unite": "%",
      "decimales": 2
    },
    {
      "libelle": "Évolution réelle sur l’année",
      "formule": "dernierEvolution",
      "unite": "%",
      "decimales": 2
    }
  ]
}
```

Variables d’une formule : les paramètres ; les clefs de la ligne courante ; celles de la ligne
précédente préfixées `avant` puis capitalisées (`avantPrix`) ; dans `synthese`, celles de la dernière
ligne préfixées `dernier` (`dernierEvolution`) et le total de chaque colonne `totalise` préfixé
`total` (`totalTaux`).

Corrigé (`corrige`, type `tableau`, tolérance absolue 0,01, `seuilReussite` 0,75) :

| Rang | Prix attendu | Piège « taux additionnés » (prix) | Indice attendu | Pièges indice                                                          |
| ---: | -----------: | --------------------------------: | -------------: | ---------------------------------------------------------------------- |
|    0 |        21,60 |                                 — |         108,00 | 8,00 (`indice-lu-comme-taux`)                                          |
|    1 |        20,52 |                             20,60 |         102,60 | 103,00 (`taux-successifs-additionnes`) ; 2,60 (`indice-lu-comme-taux`) |
|    2 |        21,34 |                             21,40 |         106,70 | 107,00 ; 6,70                                                          |
|    3 |        20,70 |                             20,80 |         103,50 | 104,00 ; 3,50                                                          |

Les indices calculés sans arrondir les prix (106,704 ; 103,503) sont dans la tolérance ; la chaîne
avec prix arrondis (21,34 × 0,97 = 20,6998) redonne 20,70. Les expressions `prix / avantPrix`,
`indice - 100` et `totalTaux` ont été exécutées avec `evaluerExpression` (0,95 ; 3,5 ; 4).

### 5.7 Les graphiques

| Graphique | Écran | Titre                                                      | Unité                             | Source                                                                          | Phrase de lecture                                                    |
| --------- | ----- | ---------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| G1        | A2-04 | Marge brute d’Atelier Rivage, 2022–2025                    | € (axe 0 à 300 000)               | comptes de résultat 2022–2025 (fictifs)                                         | +6 000 € en trois ans, soit +2,1 % ; progression faible qui ralentit |
| G2        | A3-05 | Inflation annuelle en France, 2019–2025                    | % par an                          | Insee, paru le 23 mars 2026                                                     | le taux culmine à 5,2 % en 2022, puis diminue                        |
| G3        | A3-08 | Indice des prix à la consommation, base 100 = moyenne 2019 | indice (axe 95 à 120)             | calcul du cours à partir des taux Insee ; indice officiel rebasé 116,04 en 2025 | prix 2025 supérieurs de 16,0 % à 2019 ; désinflation, pas déflation  |
| G4        | A4-04 | CA HT 2025 d’Atelier Rivage par canal et par trimestre     | milliers d’euros HT (axe 0 à 180) | comptabilité analytique 2025 (fictive)                                          | marketplace au plus haut au 3e trimestre ; sur-mesure de 120 à 80 k€ |

Complémentaires : A3-03 (prix du sac, avec titre, unité, source et lecture) ; A1-09 (pièce trompeuse à
auditer, volontairement non conforme) ; A2-02 et A5-04 (graphiques manipulables `fp-plot`) ; A5-05
(tableau croisé dynamique). Chaque graphique porte une `description` textuelle et le bouton « Voir
les données » (tableau HTML).

### 5.8 Tableau de vérification des calculs

Chaque valeur est **recalculée** par le script de l’annexe E (`verif-cours-b2-01.mjs`, `node`), qui lit
ce tableau et compare sa colonne « Résultat » à son propre calcul (écart relatif ≤ 10⁻⁶, ou au dernier
chiffre écrit). Colonne « Résultat » : valeurs séparées par « ; », sans séparateur de milliers,
arrondies au millionième sauf mention.

| #   | Calcul                                                                                                                         | Résultat                                                                              | Utilisé en                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------- |
| V01 | 483 000 + 210 000 + 357 000                                                                                                    | 1050000                                                                               | A1-04, A4-02 B5, A5-05        |
| V02 | 397 000 + 230 000 + 523 000                                                                                                    | 1150000                                                                               | A1-04, A4-02 C5, A5-05        |
| V03 | marges 2024 : 0,36 × 483 000 ; 0,28 × 210 000 ; 0,16 × 357 000                                                                 | 173880 ; 58800 ; 57120                                                                | § 5.2                         |
| V04 | somme des marges 2024                                                                                                          | 289800                                                                                | A1-04, A1-06                  |
| V05 | marges 2025 : 0,36 × 397 000 ; 0,28 × 230 000 ; 0,16 × 523 000                                                                 | 142920 ; 64400 ; 83680                                                                | A4-02 G2:G4, A5-05            |
| V06 | somme des marges 2025                                                                                                          | 291000                                                                                | A1-04, A4-02 G5, A5-05        |
| V07 | 289 800 ÷ 1 050 000                                                                                                            | 0,276                                                                                 | A1-06                         |
| V08 | 291 000 ÷ 1 150 000                                                                                                            | 0,253043                                                                              | A4-02 F5, A5-05               |
| V09 | (V08 − V07) × 100, en points                                                                                                   | −2,295652                                                                             | A2-06, A5-06 Q4               |
| V10 | V08 ÷ V07 − 1                                                                                                                  | −0,083176                                                                             | § 5.2                         |
| V11 | 1 150 000 ÷ 1 050 000 − 1                                                                                                      | 0,095238                                                                              | A1-04, A4-02 D5               |
| V12 | (397 000 − 483 000) ÷ 483 000                                                                                                  | −0,178054                                                                             | A2-03 Q4, A4-02 D2            |
| V13 | (230 000 − 210 000) ÷ 210 000                                                                                                  | 0,095238                                                                              | A4-02 D3, R1                  |
| V14 | (523 000 − 357 000) ÷ 357 000                                                                                                  | 0,464986                                                                              | A1-04, A4-02 D4               |
| V15 | parts 2025 : 397 000 ; 230 000 ; 523 000 ÷ 1 150 000                                                                           | 0,345217 ; 0,2 ; 0,454783                                                             | A2-03 Q2, A4-02 E, A5-03      |
| V16 | parts 2024 : 483 000 ; 210 000 ; 357 000 ÷ 1 050 000                                                                           | 0,46 ; 0,2 ; 0,34                                                                     | A5-03                         |
| V17 | 0,46 × 36 + 0,20 × 28 + 0,34 × 16                                                                                              | 27,6                                                                                  | A5-03 étape 2                 |
| V18 | 0,345 × 36 ; 0,20 × 28 ; 0,455 × 16 ; leur somme                                                                               | 12,42 ; 5,6 ; 7,28 ; 25,3                                                             | A5-03 étape 3                 |
| V19 | somme des poids exacts 2025 × taux                                                                                             | 25,304348                                                                             | A5-03 étape 3                 |
| V20 | (36 + 28 + 16) ÷ 3                                                                                                             | 26,666667                                                                             | A5-03, A5-05, A5-07, A4-02 F5 |
| V21 | 1 150 000 × 0,276 ; 291 000 − 317 400                                                                                          | 317400 ; −26400                                                                       | A5-03 étape 5                 |
| V22 | 317 400 − 289 800 ; 27 600 − 26 400                                                                                            | 27600 ; 1200                                                                          | A5-03 (contrôle)              |
| V23 | simulateur (20 × 28 + (80 − x) × 36 + 16x) ÷ 100 pour x = 34 ; 45,478261 ; 20 ; 50                                             | 27,6 ; 25,304348 ; 30,4 ; 24,4                                                        | A5-04                         |
| V24 | taux de la marketplace qui redonne 27,6 % pour x = 45,478261 ; simulateur pour x = 45,5 et un taux de 21 %                     | 21,047801 ; 27,575                                                                    | A5-04                         |
| V25 | écarts de marge 2025 − 2024 : sur-mesure ; entretien ; marketplace                                                             | −30960 ; 5600 ; 26560                                                                 | A5-06 Q2, A5-08               |
| V26 | 4 200 ÷ 5 000 ; (4 200 − 2 900) ÷ 2 900 ; 1 300 ÷ 4 200                                                                        | 0,84 ; 0,448276 ; 0,309524                                                            | A2-03 Q3, Q5                  |
| V27 | paniers : 523 000 ÷ 4 200 ; 627 000 ÷ 800 ; 357 000 ÷ 2 900                                                                    | 124,52381 ; 783,75 ; 123,103448                                                       | § 5.2                         |
| V28 | (291 000 − 285 000) ÷ 285 000                                                                                                  | 0,021053                                                                              | A2-03 Q1, A2-04               |
| V29 | hausses annuelles de la marge 2023, 2024, 2025                                                                                 | 0,010526 ; 0,00625 ; 0,004141                                                         | A2-04                         |
| V30 | hauteurs des barres de A1-09 en % de l’échelle : (v − 284 000) ÷ 8 000 × 100 ; rapport 2025 ÷ 2022                             | 12,5 ; 50 ; 72,5 ; 87,5 ; 7                                                           | A1-09, A1-10                  |
| V31 | formule de A2-02 pour x = 0 ; 0,5 ; 1 ; 2 ; 3                                                                                  | 285000 ; 286500 ; 288000 ; 289800 ; 291000                                            | A2-02                         |
| V32 | A2-03 Q2 : solution (%) ; pièges ÷ 100 et base inversée                                                                        | 45,478261 ; 0,454783 ; 219,885277                                                     | A2-03                         |
| V33 | A2-03 Q4 : solution (%) ; pièges                                                                                               | −17,805383 ; −21,662469 ; −86000 ; 82,194617 ; 17,805383                              | A2-03                         |
| V34 | A2-03 Q6 : marge ÷ prix de vente ; marge ÷ coût d’achat                                                                        | 0,2 ; 0,25                                                                            | A2-03, A1-06                  |
| V35 | A2-06 : 25,30 − 27,60 ; −2,30 ÷ 27,60 ; 27,60 × 0,917                                                                          | −2,3 ; −0,083333 ; 25,3092                                                            | A2-06                         |
| V36 | A1-01 : (100 − 80) ÷ 80 ; 80 × 1,25                                                                                            | 0,25 ; 100                                                                            | A1-01                         |
| V37 | A3-01 : 100 × 1,1 × 0,9 ; 4 000 × 0,9 × 0,98 ; 1 − 0,9 × 0,98                                                                  | 99 ; 3528 ; 0,118                                                                     | A3-01                         |
| V38 | A3-02 : 1,5 × 0,5 ; 100 × 1,5 × 0,5                                                                                            | 0,75 ; 75                                                                             | A3-02                         |
| V39 | A3-03 : marges unitaires ; marges totales (100 ventes) ; (19 − 20) ÷ 20                                                        | 20 ; 30 ; 19 ; 2000 ; 3000 ; 1900 ; −0,05                                             | A3-03                         |
| V40 | A3-04 : 1,1 × 0,92 ; 12,5 × 1,012 ; 12,5 × 1,1 ; 13,75 ÷ 1,1 ; 1 ÷ 1,1 − 1 ; 13,75 × 0,9                                       | 1,012 ; 12,65 ; 13,75 ; 12,5 ; −0,090909 ; 12,375                                     | A3-04                         |
| V41 | A3-04 étape 6 : 3 600 ÷ 1,2 ; 3 600 × 0,8 ; 1 − 1 ÷ 1,2 ; 3 000 × 1,2                                                          | 3000 ; 2880 ; 0,166667 ; 3600                                                         | A3-04                         |
| V42 | A3-06 : loyers 1 000 × 1,06 ; 1 000 × 1,06² ; 1 000 × 1,06³                                                                    | 1060 ; 1123,6 ; 1191,016                                                              | A3-06                         |
| V43 | A3-06 : indices 100 × 1,06 ; 100 × 1,06² ; 100 × 1,06³                                                                         | 106 ; 112,36 ; 119,1016                                                               | A3-06                         |
| V44 | A3-06 : 1,19102^(1/3) ; 19,10 ÷ 3 ; 1,0637³                                                                                    | 1,060001 ; 6,366667 ; 1,203532                                                        | A3-06                         |
| V45 | indices IPC base 100 = moyenne 2019, de 2020 à 2025                                                                            | 100,5 ; 102,108 ; 107,417616 ; 112,681079 ; 114,934701 ; 115,969113                   | A3-07 Q2, A3-08               |
| V46 | somme des taux 2020–2025 ; indice 2023 calculé en additionnant les taux                                                        | 15,1 ; 112,2                                                                          | A3-07 (pièges)                |
| V47 | taux moyen 2019–2025 (%) ; pièges 15,969113 ÷ 6 et 15,1 ÷ 6                                                                    | 2,499966 ; 2,661519 ; 2,516667                                                        | A3-07 Q4                      |
| V48 | 1,025⁶                                                                                                                         | 1,159693                                                                              | A3-07 (contrôle)              |
| V49 | A3-07 Q5 : 80 ÷ 100 − 1                                                                                                        | −0,2                                                                                  | A3-07                         |
| V50 | A3-09 : 1 ÷ 1,15969113 − 1                                                                                                     | −0,137701                                                                             | A3-09                         |
| V51 | taux moyen officiel : (116,04 ÷ 100)^(1/6) − 1                                                                                 | 0,025104                                                                              | A3-08                         |
| V52 | IPC, glissement décembre 2024 → décembre 2025 : 99,95 ÷ 99,17 − 1                                                              | 0,007865                                                                              | A4-05, § 5.3                  |
| V53 | capsule : totaux 2024 et 2025 ; évolutions T1 à T4 et total                                                                    | 110000 ; 120000 ; 0,125 ; 0,05 ; 0,133333 ; 0 ; 0,090909                              | A4-01, annexe A               |
| V54 | capsule : parts T1 à T4 et total ; somme de l’épreuve 0,15 + 0,4 + 0,425 + 0,075                                               | 0,15 ; 0,35 ; 0,425 ; 0,075 ; 1 ; 1,05                                                | A4-01, annexe A               |
| V55 | A4-02, pièges de D2 à D5 (× 100 ; base d’arrivée)                                                                              | −17,805383 ; −0,216625 ; 9,52381 ; 0,086957 ; 46,498599 ; 0,3174 ; 9,52381 ; 0,086957 | A4-02                         |
| V56 | A4-02, pièges de E2 et F5                                                                                                      | 34,521739 ; 25,304348 ; 0,266667                                                      | A4-02                         |
| V57 | toile : prix arrondis au centime après chaque révision                                                                         | 21,6 ; 20,52 ; 21,34 ; 20,7                                                           | A4-05                         |
| V58 | toile : indices ; coefficients implicites entre prix arrondis                                                                  | 108 ; 102,6 ; 106,7 ; 103,5 ; 0,95 ; 1,04 ; 0,97                                      | A4-05                         |
| V59 | toile : pièges additifs (prix des rangs 1 à 3 ; indices)                                                                       | 20,6 ; 21,4 ; 20,8 ; 103 ; 107 ; 104                                                  | A4-05                         |
| V60 | toile : somme des taux ; coefficient global ; taux moyen par révision (%) ; 20 × 1,04                                          | 4 ; 1,035029 ; 0,864446 ; 20,8                                                        | A1-04, A4-05, § 5.3           |
| V61 | CA 2025 par trimestre : totaux par canal ; par trimestre ; total (k€)                                                          | 397 ; 230 ; 523 ; 276 ; 287 ; 318 ; 269 ; 1150                                        | A4-03, A4-04, § 5.2           |
| V62 | 1er semestre 2025 : CA (k€) ; marge (k€) ; taux (%)                                                                            | 563 ; 147,36 ; 26,174067                                                              | § 5.2, E2                     |
| V63 | A5-06 Q1 : solution (%) ; pièges                                                                                               | 28,756014 ; 45,478261 ; 0,28756 ; 347,753346                                          | A5-06                         |
| V64 | E1 : taux global du 1er semestre 2026 (%) ; moyenne simple                                                                     | 23,4 ; 26,666667                                                                      | A6-02                         |
| V65 | E2 : 23,4 − 26,2 ; (23,4 ÷ 26,2 − 1) × 100 ; 23,4 − 25,304348                                                                  | −2,8 ; −10,687023 ; −1,904348                                                         | A6-02                         |
| V66 | E3 : 1 035 × 1,06 × 0,96 ; 1 053,22 ÷ 1,0176 ; pièges 1 053,22 ÷ 1,02 ; 1 053,22 × (1 − 0,0176) ; 1 053,22 × 0,98 ; 20,70 × 50 | 1053,216 ; 1035,003931 ; 1032,568627 ; 1034,683328 ; 1032,1556 ; 1035                 | A6-02                         |
| V67 | factures : total des pièces ; total du grand livre ; écart ; écart ÷ 9                                                         | 48705 ; 48795 ; 90 ; 10                                                               | A5-07, A6-02 E4               |
| V68 | E4 : TVA des pièces ; TTC ; TVA du grand livre ; TVA « extraite » ; TVA de l’écart                                             | 9741 ; 58446 ; 9759 ; 8117,5 ; 18                                                     | A6-02                         |
| V69 | TVA et TTC de F001 à F004                                                                                                      | 2400 ; 14400 ; 1700 ; 10200 ; 3173 ; 19038 ; 2468 ; 14808                             | § 5.4                         |
| V70 | inversion de F004 : (43 − 34) × 10 ; exemple de A6-01 : 1 623 − 1 263 ; 360 ÷ 9                                                | 90 ; 360 ; 40                                                                         | A6-01, A6-02                  |
| V71 | A6-04 : 357 000 ÷ 1,2 ; 523 000 ÷ 297 500 ; √(523 000 ÷ 297 500) − 1 ; 297 500 × 1,326² ; 1,2 × 1,465 ; 33,25 − 32,6           | 297500 ; 1,757983 ; 0,32589 ; 523087,11 ; 1,758 ; 0,65                                | A6-04                         |
| V72 | R1 : 20 000 ÷ 210 000 ; 20 000 ÷ 230 000                                                                                       | 0,095238 ; 0,086957                                                                   | A6-05                         |
| V73 | R2 : 5 − 4 ; (5 − 4) ÷ 4                                                                                                       | 1 ; 0,25                                                                              | A6-05                         |
| V74 | R3 : 1,2 × 0,8 − 1                                                                                                             | −0,04                                                                                 | A6-05                         |
| V75 | R4 : 1 ÷ 0,8 − 1                                                                                                               | 0,25                                                                                  | A6-05                         |
| V76 | R5 : 103,5 ÷ 100 − 1                                                                                                           | 0,035                                                                                 | A6-05                         |
| V77 | R6 : √1,21 − 1 ; 21 ÷ 2 ; √21                                                                                                  | 0,1 ; 10,5 ; 4,582576                                                                 | A6-05                         |
| V78 | R7 : (100 000 × 0,30 + 300 000 × 0,10) ÷ 400 000 ; (30 + 10) ÷ 2 ; 30 + 10                                                     | 0,15 ; 20 ; 40                                                                        | A6-05                         |
| V79 | R9 : hauteurs (98 − 97) ÷ 4 et (100 − 97) ÷ 4 ; rapport ; (100 − 98) ÷ 98                                                      | 0,25 ; 0,75 ; 3 ; 0,020408                                                            | A6-05                         |
| V80 | R10 : 100 − 100 ; R11 : 4 520 − 4 250 ; 270 ÷ 9                                                                                | 0 ; 270 ; 30                                                                          | A6-05                         |
| V81 | R12 : 1,06^(1/12) − 1 ; 6 ÷ 12 ; 6 × 12                                                                                        | 0,004868 ; 0,5 ; 72                                                                   | A6-05                         |
| V82 | R13 : 1 − 1 ÷ 1,2 ; 1 ÷ 1,2                                                                                                    | 0,166667 ; 0,833333                                                                   | A6-05, A6-06                  |
| V83 | contrastes WCAG sur #FBF7EF : #1F2A30 ; #0F6E6E ; #1F5FBF ; #B4400B ; #B3261E ; #1E6B3A ; #8A5E00                              | 13,72 ; 5,65 ; 5,7 ; 5,34 ; 6,12 ; 6,1 ; 5,34                                         | F13, annexe A                 |
| V84 | A2-04 : 291 000 − 285 000                                                                                                      | 6000                                                                                  | A2-04                         |
| V85 | TCD du 3e trimestre : marges des trois canaux ; total du CA ; total des marges ; champ calculé (%) ; moyenne des taux (%)      | 36720 ; 13720 ; 26720 ; 318000 ; 77160 ; 24,264151 ; 26,666667                        | A5-05, A5-06 Q5               |

### 5.9 Concepts, confusions et remédiations

**Concepts** (`banque/concepts.ts`) : existants `proportion`, `pourcentage`, `taux-evolution`,
`coefficient-multiplicateur`, `evolutions-successives`, `evolution-reciproque`, `taux-moyen` ;
**ajoutés** `indice-base-100`, `point-de-pourcentage`, `moyenne-ponderee`, `lecture-graphique`,
`controle-coherence`, `contrat-de-lecture`, `tableur`. Concepts du cours (`Cours.concepts`) : les 14.

**Confusions** : les 8 existantes sont conservées ; 30 sont ajoutées. Chaque piège V3 porte une
confusion qui le décrit réellement (le deck étiquetait par exemple « la couleur de la courbe » comme
`taux-valeur-facteur-cent`). Chaque confusion a une remédiation vers l’écran qui enseigne la notion
(identifiants complets `ref:B2-01-…`).

| Identifiant                                  | Concept                    | Libellé                                                                                                                                | Remédiation                       |
| -------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `hausse-baisse-symetriques` (existante)      | evolutions-successives     | Croire qu’une hausse puis une baisse du même pourcentage ramènent à la valeur de départ.                                               | B2-01-A3-03-PRIX-SAC              |
| `taux-successifs-additionnes` (existante)    | evolutions-successives     | Additionner des taux successifs au lieu de multiplier les coefficients.                                                                | B2-01-A3-04-FIL-TECHNIQUE         |
| `reciproque-meme-taux` (existante)           | evolution-reciproque       | Croire que le même pourcentage en sens inverse suffit pour revenir au départ.                                                          | B2-01-A3-04-FIL-TECHNIQUE         |
| `base-arrivee` (existante)                   | taux-evolution             | Diviser l’écart par la valeur d’arrivée au lieu de la valeur de départ.                                                                | B2-01-A3-02-MACHINE-COEFFICIENTS  |
| `ecart-absolu-au-lieu-du-taux` (existante)   | taux-evolution             | Donner l’écart en valeur au lieu du taux en pourcentage.                                                                               | B2-01-A2-05-ECRITURES             |
| `coefficient-confondu-avec-taux` (existante) | coefficient-multiplicateur | Confondre le coefficient multiplicateur 1,15 avec le taux de 15 %.                                                                     | B2-01-A3-02-MACHINE-COEFFICIENTS  |
| `taux-valeur-facteur-cent` (existante)       | pourcentage                | Confondre le taux 70 % et la valeur 0,7 : le résultat est décalé d’un facteur 100.                                                     | B2-01-A2-05-ECRITURES             |
| `raisonnement-additif` (existante)           | proportion                 | Ajouter un écart constant là où la situation est proportionnelle.                                                                      | B2-01-A5-03-MOYENNE-PONDEREE      |
| `proportion-confondue-avec-evolution`        | pourcentage                | Confondre un pourcentage de proportion (part d’un total) et un pourcentage d’évolution (variation par rapport à une valeur de départ). | B2-01-A2-05-ECRITURES             |
| `points-confondus-avec-pourcentage`          | point-de-pourcentage       | Exprimer en % l’écart entre deux taux, qui se mesure en points.                                                                        | B2-01-A2-06-POINTS                |
| `population-reference-ignoree`               | proportion                 | Comparer ou confondre deux proportions calculées sur des populations de référence différentes.                                         | B2-01-A1-06-FICHE-INDICATEUR      |
| `base-inversee`                              | proportion                 | Diviser le total par la partie au lieu de la partie par le total.                                                                      | B2-01-A1-06-FICHE-INDICATEUR      |
| `sens-de-variation`                          | taux-evolution             | Oublier le signe d’une variation : une baisse s’écrit avec un signe moins.                                                             | B2-01-A3-02-MACHINE-COEFFICIENTS  |
| `coefficient-global-mal-interprete`          | evolutions-successives     | Mal traduire un coefficient global en taux (0,99 correspond à une baisse de 1 %).                                                      | B2-01-A3-02-MACHINE-COEFFICIENTS  |
| `rythme-confondu-avec-niveau`                | indice-base-100            | Confondre désinflation (la hausse des prix ralentit) et déflation (les prix baissent).                                                 | B2-01-A3-08-INDICE-PRIX           |
| `indice-lu-comme-taux`                       | indice-base-100            | Lire un indice comme un taux (112,68 au lieu de +12,68 %) ou l’inverse.                                                                | B2-01-A3-06-INDICE-ET-TAUX-MOYEN  |
| `indice-lu-comme-valeur`                     | indice-base-100            | Lire un indice comme un prix ou un montant.                                                                                            | B2-01-A3-06-INDICE-ET-TAUX-MOYEN  |
| `taux-moyen-arithmetique`                    | taux-moyen                 | Diviser un taux global par le nombre de périodes au lieu de prendre une racine n-ième.                                                 | B2-01-A3-06-INDICE-ET-TAUX-MOYEN  |
| `moyenne-simple-des-taux`                    | moyenne-ponderee           | Faire la moyenne simple de taux au lieu de les pondérer par leurs bases.                                                               | B2-01-A5-03-MOYENNE-PONDEREE      |
| `hausse-base-baisse-taux`                    | moyenne-ponderee           | Croire qu’une hausse du total fait mécaniquement baisser un taux.                                                                      | B2-01-A5-04-SIMULATEUR-MIX        |
| `baisse-attribuee-aux-taux-locaux`           | moyenne-ponderee           | Attribuer la baisse d’un taux global à la baisse des taux de chaque composante, sans regarder les poids.                               | B2-01-A5-03-MOYENNE-PONDEREE      |
| `axe-tronque-lu-comme-ecart`                 | lecture-graphique          | Juger une évolution à la hauteur des barres sans lire l’origine et l’amplitude de l’axe.                                               | B2-01-A2-02-ORIGINE-AXE           |
| `correlation-prise-pour-causalite`           | lecture-graphique          | Conclure sur une cause, ou sur l’absence de cause, à partir de deux évolutions simultanées.                                            | B2-01-A5-08-RECOMMANDATION        |
| `forme-inadaptee`                            | lecture-graphique          | Choisir une forme de graphique qui ne montre pas la relation demandée.                                                                 | B2-01-A4-04-CA-TRIMESTRIEL        |
| `titre-interpretatif`                        | lecture-graphique          | Choisir un titre ou une phrase de lecture qui conclut au lieu de décrire la mesure.                                                    | B2-01-A4-04-CA-TRIMESTRIEL        |
| `unite-manquante-ignoree`                    | contrat-de-lecture         | Accepter un chiffre sans unité, base ou période.                                                                                       | B2-01-A1-06-FICHE-INDICATEUR      |
| `bases-incompatibles`                        | contrat-de-lecture         | Comparer des valeurs de périodes, de périmètres ou de bases (HT/TTC, unités) différents sans retraitement.                             | B2-01-A2-07-JEU-COMPARABLE        |
| `valeur-confondue-avec-taux`                 | contrat-de-lecture         | Conclure sur une rentabilité (un taux) à partir d’un montant, ou lire un montant comme un taux.                                        | B2-01-A2-05-ECRITURES             |
| `ca-confondu-avec-marge`                     | contrat-de-lecture         | Utiliser le chiffre d’affaires là où la question porte sur la marge.                                                                   | B2-01-A1-06-FICHE-INDICATEUR      |
| `marque-confondue-avec-marge`                | pourcentage                | Confondre le taux de marque (marge ÷ prix de vente HT) et le taux de marge (marge ÷ coût d’achat HT).                                  | B2-01-A1-06-FICHE-INDICATEUR      |
| `total-concordant-vaut-preuve`               | controle-coherence         | Croire qu’un total exact garantit l’exactitude de chaque ligne.                                                                        | B2-01-A6-01-PACIOLI               |
| `indice-pris-pour-preuve`                    | controle-coherence         | Traiter un indice de recherche (écart multiple de 9) comme une preuve.                                                                 | B2-01-A6-01-PACIOLI               |
| `controle-non-discriminant`                  | controle-coherence         | Choisir un contrôle qui ne permet ni de localiser ni de trancher l’anomalie.                                                           | B2-01-A5-07-CONTROLE-DISCRIMINANT |
| `tva-base-non-corrigee`                      | controle-coherence         | Calculer la TVA sur une base erronée non corrigée.                                                                                     | B2-01-A3-04-FIL-TECHNIQUE         |
| `tva-calculee-sur-ttc`                       | pourcentage                | Appliquer le taux de TVA comme si la base était un montant TTC.                                                                        | B2-01-A3-04-FIL-TECHNIQUE         |
| `reference-relative-non-figee`               | tableur                    | Recopier une formule dont la référence au total n’est pas figée ($) : le dénominateur glisse.                                          | B2-01-A4-01-CAPSULE               |
| `valeur-saisie-sans-formule`                 | tableur                    | Taper un résultat calculé ailleurs au lieu d’une formule qui cite les cellules.                                                        | B2-01-A4-01-CAPSULE               |
| `formule-non-recopiable`                     | tableur                    | Écrire une formule différente à chaque ligne au lieu d’une formule recopiable.                                                         | B2-01-A4-01-CAPSULE               |

Soit 38 confusions et 38 remédiations, toutes vers des écrans existants (règle
`reference-inconnue`).

### 5.10 Banque des questions et des corrigés

Convention : pour chaque vote, la **bonne réponse** puis les **pièges** avec leur confusion ; les
libellés sont les options servies (identifiant stable = `slugOption(libelle)`, § 9.2 ; ordre mélangé
par graine). Pour chaque question numérique : la solution, sa tolérance et sa **forme publiée**
(l’écriture à la française cherchée par la garde de confidentialité). « Segments » : fragments de la
bonne réponse cherchés ensemble par la garde (§ 6.4, volet segments). Toutes les questions sont
statiques (mêmes données pour toute la classe).

**Rappel d’ouverture — A1-01** (`fp-recall`, concept `taux-evolution`, noté) :

| Id                    | Type · concept        | Bonne réponse | Pièges                                                                                                                  | Segments |
| --------------------- | --------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| `b2-01-a1-diagnostic` | vote · taux-evolution | « +25 % »     | « +20 % » (`base-arrivee`) ; « +20 € » (`ecart-absolu-au-lieu-du-taux`) ; « +125 % » (`coefficient-confondu-avec-taux`) | —        |

**Atelier 1 — A2-03** (ordre fixe) :

| Id                              | Type · concept                   | Bonne réponse                                                               | Pièges                                                                                                                                                                   | Segments                             |
| ------------------------------- | -------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| `b2-01-a2-evolution-marge`      | vote · lecture-graphique         | « +2,1 % en trois ans »                                                     | « Environ sept fois plus de marge qu’en 2022 » (`axe-tronque-lu-comme-ecart`) ; « +6 000 € : une forte croissance » (`ecart-absolu-au-lieu-du-taux`)                     | « +2,1 % » ; « trois ans »           |
| `b2-01-a2-part-marketplace`     | numérique « % » · proportion     | 45,478261 · absolue 0,05 · forme publiée « 45,5 »                           | 0,454783 (`taux-valeur-facteur-cent`) ; 219,885277 (`base-inversee`)                                                                                                     | —                                    |
| `b2-01-a2-population-reference` | vote · proportion                | « Rien ne le prouve : 84 % des commandes ne disent rien de la part du CA. » | « Il a raison : 84 % des commandes, c’est environ 84 % du CA. » (`population-reference-ignoree`) ; « Il a tort : il fallait diviser 5 000 par 4 200. » (`base-inversee`) | « commandes » ; « part du CA »       |
| `b2-01-a2-evolution-sur-mesure` | numérique « % » · taux-evolution | −17,805383 · décimales 2 · forme publiée « −17,81 »                         | −21,662469 (`base-arrivee`) ; −86 000 (`ecart-absolu-au-lieu-du-taux`) ; 82,194617 (`coefficient-confondu-avec-taux`) ; 17,805383 (`sens-de-variation`)                  | —                                    |
| `b2-01-a2-ordre-de-grandeur`    | vote · taux-evolution            | « Environ +45 % »                                                           | « Environ +31 % » (`base-arrivee`) ; « Environ +1 300 % » (`ecart-absolu-au-lieu-du-taux`)                                                                               | —                                    |
| `b2-01-a2-marge-marque`         | vote · pourcentage               | « Taux de marque : 20 % ; taux de marge : 25 % »                            | « Taux de marque : 25 % ; taux de marge : 20 % » (`marque-confondue-avec-marge`) ; « Taux de marque : 20 % ; taux de marge : 20 % » (`base-arrivee`)                     | « marque : 20 % » ; « marge : 25 % » |

**Instruction par les pairs — A3-01** :

| Id                             | Type · concept                | Bonne réponse                          | Pièges                                                                                                                                       | Segments                |
| ------------------------------ | ----------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `b2-01-a3-sac-v1` (principale) | vote · evolutions-successives | « Inférieur de 1 % au prix de départ » | « Identique au prix de départ » (`hausse-baisse-symetriques`) ; « Supérieur de 1 % au prix de départ » (`coefficient-global-mal-interprete`) | « Inférieur » ; « 1 % » |
| `b2-01-a3-remise-v2` (jumelle) | vote · evolutions-successives | « 11,8 % »                             | « 12 % » (`taux-successifs-additionnes`) ; « 88,2 % » (`coefficient-confondu-avec-taux`)                                                     | —                       |

**Atelier 2 — A3-07** (ordre fixe) :

| Id                          | Type · concept                           | Bonne réponse                                       | Pièges                                                                                                      | Segments                  |
| --------------------------- | ---------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------- |
| `b2-01-a3-niveau-prix`      | vote · indice-base-100                   | « Plus élevé qu’en 2024 »                           | « Plus bas qu’en 2024 » ; « Identique à celui de 2024 » (les deux `rythme-confondu-avec-niveau`)            | « Plus élevé » ; « 2024 » |
| `b2-01-a3-indice-2023`      | numérique · indice-base-100              | 112,681079 · décimales 2 · forme publiée « 112,68 » | 112,2 (`taux-successifs-additionnes`) ; 12,681079 (`indice-lu-comme-taux`)                                  | —                         |
| `b2-01-a3-hausse-2019-2025` | numérique « % » · evolutions-successives | 15,969113 · décimales 2 · forme publiée « 15,97 »   | 15,1 (`taux-successifs-additionnes`) ; 115,969113 (`indice-lu-comme-taux`)                                  | —                         |
| `b2-01-a3-taux-moyen`       | numérique « % » · taux-moyen             | 2,499966 · décimales 2 · forme publiée « 2,50 »     | 2,661519 (`taux-moyen-arithmetique`) ; 2,516667 (`taux-successifs-additionnes`)                             | —                         |
| `b2-01-a3-reciproque`       | vote · evolution-reciproque              | « Une baisse de 20 % »                              | « Une baisse de 25 % » (`reciproque-meme-taux`) ; « Une baisse de 80 % » (`coefficient-confondu-avec-taux`) | —                         |

**Atelier 3 — A4-03** (ordre fixe) :

| Id                 | Type · concept           | Bonne réponse                                                                               | Pièges                                                                                                                                                           | Segments                       |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `b2-01-a4-forme`   | vote · lecture-graphique | « Trois courbes, une par canal, trimestres en abscisse »                                    | « Trois secteurs en relief, un par canal » ; « Une barre par canal avec son CA annuel » (les deux `forme-inadaptee`)                                             | « courbes » ; « trimestres »   |
| `b2-01-a4-titre`   | vote · lecture-graphique | « CA HT 2025 par canal et par trimestre (en milliers d’euros) »                             | « La marketplace s’envole au troisième trimestre » (`titre-interpretatif`) ; « Évolution des canaux » (`unite-manquante-ignoree`)                                | « par canal et par trimestre » |
| `b2-01-a4-axe`     | vote · lecture-graphique | « À 0, avec une graduation tous les 20 000 € »                                              | « À 49 000 €, la plus petite valeur du tableau » ; « Nulle part : sans graduation, seules les courbes comptent » (les deux `axe-tronque-lu-comme-ecart`)         | « À 0 » ; « graduation »       |
| `b2-01-a4-lecture` | vote · lecture-graphique | « Au 3e trimestre, la marketplace atteint 167 000 €, contre 102 000 € pour le sur-mesure. » | « Au 3e trimestre, la marketplace réalise 167 % du CA. » (`valeur-confondue-avec-taux`) ; « Au 3e trimestre, le sur-mesure s’effondre. » (`titre-interpretatif`) | « 167 000 € » ; « 102 000 € »  |

**Instruction par les pairs — A5-02** :

| Id                                  | Type · concept          | Bonne réponse                                                            | Pièges                                                                                                                                                                    | Segments                |
| ----------------------------------- | ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `b2-01-a5-paradoxe-v1` (principale) | vote · moyenne-ponderee | « Le poids des canaux dans le CA a changé. »                             | « Taux locaux stables, taux global stable : c’est une erreur. » (`moyenne-simple-des-taux`) ; « Plus de CA fait toujours baisser un taux. » (`hausse-base-baisse-taux`)   | « poids » ; « canaux »  |
| `b2-01-a5-paradoxe-v2` (jumelle)    | vote · moyenne-ponderee | « Les candidats de MCO pèsent davantage dans l’ensemble des candidats. » | « C’est impossible : le taux global est la moyenne de 90 % et 70 %. » (`moyenne-simple-des-taux`) ; « Il y a eu plus de candidats au total. » (`hausse-base-baisse-taux`) | « MCO » ; « davantage » |

**Atelier 4 — A5-06** (ordre fixe) :

| Id                                    | Type · concept                   | Bonne réponse                                                                      | Pièges                                                                                                                                                                                                                            | Segments                       |
| ------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `b2-01-a5-part-marge-marketplace`     | numérique « % » · proportion     | 28,756014 · absolue 0,05 · forme publiée « 28,8 »                                  | 45,478261 (`population-reference-ignoree`) ; 0,28756 (`taux-valeur-facteur-cent`) ; 347,753346 (`base-inversee`)                                                                                                                  | —                              |
| `b2-01-a5-variation-marge-sur-mesure` | numérique « € » · taux-evolution | −30 960 · absolue 0,5 · forme publiée « −30 960 »                                  | 30 960 (`sens-de-variation`) ; −86 000 (`ca-confondu-avec-marge`)                                                                                                                                                                 | —                              |
| `b2-01-a5-causalite`                  | vote · lecture-graphique         | « Hypothèse plausible, à vérifier avec les données par client. »                   | « C’est prouvé : les deux évolutions sont simultanées. » ; « C’est exclu : les deux canaux n’ont pas les mêmes clients. » (les deux `correlation-prise-pour-causalite`)                                                           | « Hypothèse » ; « par client » |
| `b2-01-a5-synthese`                   | vote · contrat-de-lecture        | « En 2025, la marge brute progresse de 1 200 € et son taux recule de 2,3 points. » | « En 2025, la marge brute progresse de 1 200 € et son taux recule de 2,3 %. » (`points-confondus-avec-pourcentage`) ; « En 2025, la rentabilité progresse, puisque la marge brute gagne 1 200 €. » (`valeur-confondue-avec-taux`) | « 1 200 € » ; « 2,3 points »   |
| `b2-01-a5-tcd`                        | vote · moyenne-ponderee          | « 24,3 % : il pondère chaque canal par son CA »                                    | « 26,7 % : il traite les trois canaux à égalité » (`moyenne-simple-des-taux`) ; « L’un ou l’autre : ils mesurent le même taux » (`moyenne-simple-des-taux`)                                                                       | « pondère » ; « 24,3 % »       |

**Classement A1-05** `b2-01-a1-anatomie` (contrat-de-lecture ; seuil 0,75) — catégories `valeur`
« Valeur en euros », `proportion` « Proportion : part d’un total », `evolution` « Évolution :
variation par rapport à une valeur de départ », `points` « Écart entre deux taux, en points »,
`ambigu` « Ambigu en l’état : unité, base ou période manquante » :

| Carte              | Libellé                                                                                     | Catégorie  | Confusion si erreur                   | Justification                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------- | ---------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| `ca-2025`          | CA HT 2025 : 1 150 000 €                                                                    | valeur     | `valeur-confondue-avec-taux`          | montant en euros : « combien ? »                                              |
| `evolution-ca`     | CA : « +9,5 % » par rapport à 2024                                                          | evolution  | `proportion-confondue-avec-evolution` | variation rapportée à la valeur de 2024                                       |
| `part-entretien`   | Entretien : 20 % du CA 2025                                                                 | proportion | `proportion-confondue-avec-evolution` | 230 000 € rapportés à 1 150 000 €                                             |
| `taux-marge`       | Taux de marge 2025 : 25,3 %                                                                 | proportion | `proportion-confondue-avec-evolution` | marge brute rapportée au CA HT de la même année : une part                    |
| `ecart-taux`       | Taux de marge : « −2,3 % » par rapport à 2024                                               | points     | `points-confondus-avec-pourcentage`   | libellé imprécis (taux de marge brute) et unité fausse : −2,3 points          |
| `marge-sans-unite` | Marge brute : « +1 200 » (colonne « Évolution affichée », dont les autres lignes sont en %) | ambigu     | `unite-manquante-ignoree`             | euros ou pourcentage ? Dans une colonne de %, un nombre sans unité est ambigu |
| `inflation`        | Inflation : « 4,9 »                                                                         | ambigu     | `unite-manquante-ignoree`             | ni unité, ni période, ni source                                               |
| `toile`            | Prix de la toile : « +4 % » sur l’année                                                     | evolution  | `proportion-confondue-avec-evolution` | variation depuis le 1er janvier (calcul à vérifier à l’acte 4)                |

**Classement A2-07** `b2-01-a2-comparable` (contrat-de-lecture ; confusion si erreur :
`bases-incompatibles` pour toutes les cartes ; seuil 0,75) — catégories `directe` « Comparable
directement », `retraitement` « Comparable après retraitement », `impossible` « Pas comparable sans
nouvelle donnée » :

| Carte       | Libellé                                                                                        | Catégorie    | Justification                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `mars`      | CA de mars 2025 / CA de mars 2024                                                              | directe      | même mois, même périmètre, même unité                                                          |
| `taux`      | Taux de marge brute 2024 / 2025 d’Atelier Rivage (même définition)                             | directe      | écart en points                                                                                |
| `salarie`   | CA par salarié 2025 (14 salariés) / CA par salarié 2024 (12 salariés)                          | directe      | ratios rapportés à la même base                                                                |
| `ht-ttc`    | Marge brute HT 2025 / ventes TTC 2025                                                          | retraitement | ramener les ventes en HT : TTC ÷ 1,2                                                           |
| `rouleau`   | Prix de la toile en € par m² / prix en € par rouleau de 50 m²                                  | retraitement | diviser le prix du rouleau par 50                                                              |
| `perimetre` | CA 2025 d’Atelier Rivage (trois canaux) / CA 2024 de l’atelier seul, sans la marketplace       | retraitement | retirer la marketplace du CA 2025 (523 000 €)                                                  |
| `secteur`   | Taux de marge brute d’Atelier Rivage / « taux de marge moyen des voileries » lu dans la presse | impossible   | définition, période et périmètre inconnus                                                      |
| `inflation` | Hausse des tarifs d’Atelier Rivage en 2025 / « Inflation : 4,9 » du tableau de bord            | impossible   | « 4,9 » est l’inflation de 2023 : il faut celle de 2025, publiée par l’Insee                   |
| `semestre`  | CA du 1er semestre 2025 / CA annuel 2024 (le fichier 2024 ne contient que le total annuel)     | impossible   | activité saisonnière : doubler un semestre ne donne pas l’année ; il faut le 1er semestre 2024 |

**Classement A5-07** `b2-01-a5-controle` (controle-coherence ; seuil 0,75) — catégories
`metadonnees` « Compléter les métadonnées (unité, période, source) », `recalcul` « Recalculer
(coefficients, points, pondération) », `representation` « Refaire la représentation (axe, titre,
forme) », `preuve` « Chercher une preuve externe (pièce, donnée détaillée) » :

| Carte          | Libellé                                                                                                  | Catégorie      | Confusion si erreur                 |
| -------------- | -------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------- |
| `inflation`    | « Inflation : 4,9 » dans le tableau de bord                                                              | metadonnees    | `unite-manquante-ignoree`           |
| `marge`        | « Marge brute : +1 200 »                                                                                 | metadonnees    | `unite-manquante-ignoree`           |
| `points`       | « Taux de marge : −2,3 % »                                                                               | recalcul       | `points-confondus-avec-pourcentage` |
| `toile`        | « Prix de la toile : +4 % » (8 − 5 + 4 − 3)                                                              | recalcul       | `taux-successifs-additionnes`       |
| `moyenne`      | Note de Samir : « taux de marge moyen des canaux : 26,7 % »                                              | recalcul       | `moyenne-simple-des-taux`           |
| `diapo`        | Diapositive « Marge brute : une croissance continue »                                                    | representation | `axe-tronque-lu-comme-ecart`        |
| `clients`      | « La marketplace détourne nos clients du sur-mesure »                                                    | preuve         | `correlation-prise-pour-causalite`  |
| `factures`     | Courriel du cabinet comptable : grand livre des ventes de mars 48 795 € HT, pièces 48 705 € HT           | preuve         | `controle-non-discriminant`         |
| `compensation` | Contrôle de février : total du grand livre égal au total des pièces, mais F002 à +100 € et F003 à −100 € | preuve         | `total-concordant-vaut-preuve`      |

**Coffre A6-02** `b2-01-a6-coffre` (non noté ; `tentativesMax` 10 ; énoncés et indices au § 3.7) :

| Énigme                | Concept              | Solution (corrigé)                              | Forme publiée | Fragment | Pièges                                                                                                                     |
| --------------------- | -------------------- | ----------------------------------------------- | ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `b2-01-a6-e1-mix`     | moyenne-ponderee     | 23,4 (absolue 0,05)                             | « 23,4 »      | K7       | 26,666667 (`moyenne-simple-des-taux`)                                                                                      |
| `b2-01-a6-e2-points`  | point-de-pourcentage | −2,8 (absolue 0,05)                             | « −2,8 »      | M2       | −10,687023 (`points-confondus-avec-pourcentage`) ; 2,8 (`sens-de-variation`) ; −1,904348 (`bases-incompatibles`)           |
| `b2-01-a6-e3-rouleau` | evolution-reciproque | 1 035,003931 (absolue 0,005 : 1 035,00 accepté) | « 1 035,00 »  | Q9       | 1 032,568627 (`taux-successifs-additionnes`) ; 1 034,683328 (`reciproque-meme-taux`) ; 1 032,1556 (`reciproque-meme-taux`) |
| `b2-01-a6-e4-tva`     | controle-coherence   | 9 741 (absolue 0,5)                             | « 9 741 »     | 4X       | 9 759 (`tva-base-non-corrigee`) ; 8 117,5 (`tva-calculee-sur-ttc`) ; 18 (`controle-non-discriminant`)                      |

Code final : « K7M2Q94X » (sans lien avec le récit, il ne se devine pas).

**Banque de rappel A6-05** (`banque`, 13 votes, non notés ; R10 et R11 servis à tous) :

| Id                                          | Concept                | Énoncé                                                                                                                                           | Bonne réponse                                                          | Pièges                                                                                                                                      |
| ------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `b2-01-r-taux-evolution` (R1)               | taux-evolution         | Le CA de l’entretien passe de 210 000 € à 230 000 €. Quel est son taux d’évolution ?                                                             | « Environ +9,5 % »                                                     | « Environ +8,7 % » (`base-arrivee`) ; « +20 000 € » (`ecart-absolu-au-lieu-du-taux`)                                                        |
| `b2-01-r-points` (R2)                       | point-de-pourcentage   | Le taux de retour des colis passe de 4 % à 5 %. Quelle phrase est exacte ?                                                                       | « +1 point, soit +25 % en valeur relative »                            | « +1 % » ; « +25 points » (les deux `points-confondus-avec-pourcentage`)                                                                    |
| `b2-01-r-successives` (R3)                  | evolutions-successives | Un prix augmente de 20 %, puis baisse de 20 %. Quelle est son évolution globale ?                                                                | « Une baisse de 4 % »                                                  | « Aucune évolution : 0 % » (`hausse-baisse-symetriques`) ; « Une hausse de 4 % » (`coefficient-global-mal-interprete`)                      |
| `b2-01-r-reciproque` (R4)                   | evolution-reciproque   | Après une baisse de 20 %, quelle hausse ramène au prix initial ?                                                                                 | « Une hausse de 25 % »                                                 | « Une hausse de 20 % » (`reciproque-meme-taux`) ; « Une hausse de 80 % » (`coefficient-confondu-avec-taux`)                                 |
| `b2-01-r-indice` (R5)                       | indice-base-100        | L’indice du prix de la toile vaut 103,5 (base 100 au 1er janvier). Que signifie-t-il ?                                                           | « Le prix a augmenté de 3,5 % depuis le 1er janvier »                  | « Le m² coûte 103,50 € » (`indice-lu-comme-valeur`) ; « Le prix a augmenté de 103,5 % » (`indice-lu-comme-taux`)                            |
| `b2-01-r-taux-moyen` (R6)                   | taux-moyen             | Un CA augmente de 21 % en deux ans. Quel taux annuel moyen ?                                                                                     | « 10 % par an »                                                        | « 10,5 % par an » (`taux-moyen-arithmetique`) ; « 4,6 % par an » (`coefficient-confondu-avec-taux` : racine du taux au lieu du coefficient) |
| `b2-01-r-ponderee` (R7)                     | moyenne-ponderee       | Canal A : 100 000 € de CA à 30 % de marge ; canal B : 300 000 € à 10 %. Taux de marge global ?                                                   | « Un taux global de 15 % »                                             | « Un taux global de 20 % » (`moyenne-simple-des-taux`) ; « Un taux global de 40 % » (`raisonnement-additif`)                                |
| `b2-01-r-population` (R8)                   | proportion             | Un canal réalise 45 % des commandes mais 20 % du CA. Est-ce contradictoire ?                                                                     | « Non : les deux parts n’ont pas la même population de référence »     | « Oui : l’un des deux chiffres est faux » ; « Oui : les deux parts devraient être égales » (les deux `population-reference-ignoree`)        |
| `b2-01-r-axe` (R9)                          | lecture-graphique      | Deux barres valent 98 et 100 ; l’axe vertical va de 97 à 101 ; la seconde paraît trois fois plus haute. Quel est l’écart réel ?                  | « Environ +2 % »                                                       | « +200 % » ; « La valeur a triplé » (les deux `axe-tronque-lu-comme-ecart`)                                                                 |
| `b2-01-r-compensation` (R10, servi à tous)  | controle-coherence     | Contrôle de février : le total du grand livre égale celui des pièces, mais F002 est à +100 € et F003 à −100 €. Peut-on valider chaque écriture ? | « Non : deux erreurs de sens contraire se compensent »                 | « Oui : le total concorde » (`total-concordant-vaut-preuve`) ; « Oui : un écart de 100 € est négligeable » (`controle-non-discriminant`)    |
| `b2-01-r-multiple-neuf` (R11, servi à tous) | controle-coherence     | Un écart de 270 € sépare le grand livre d’avril des pièces ; 270 est divisible par 9. Qu’en concluez-vous ?                                      | « C’est un indice d’inversion de chiffres, à confirmer avec la pièce » | « C’est la preuve d’une inversion de chiffres » (`indice-pris-pour-preuve`) ; « Il n’y a pas d’erreur » (`total-concordant-vaut-preuve`)    |
| `b2-01-r-taux-mensuel` (R12)                | taux-moyen             | Un placement rapporte 6 % par an. Quel taux mensuel, appliqué douze fois, donne le même résultat ?                                               | « Environ 0,49 % par mois »                                            | « 0,5 % par mois » (`taux-moyen-arithmetique`) ; « 72 % par an » (`taux-successifs-additionnes`)                                            |
| `b2-01-r-ttc-ht` (R13)                      | evolution-reciproque   | Pour passer d’un prix TTC (TVA 20 %) au prix HT, de quel pourcentage le prix baisse-t-il ?                                                       | « Une baisse d’environ 16,7 % »                                        | « Une baisse de 20 % » (`reciproque-meme-taux`) ; « Une baisse d’environ 83,3 % » (`coefficient-confondu-avec-taux`)                        |

**Billet de sortie A6-08** — `b2-01-a6-billet` · vote · contrat-de-lecture · noté :

| Bonne réponse                                                                                                                            | Pièges                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Segments                            |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| « Le CA progresse de 9,5 % mais le taux de marge brute recule de 2,3 points : la marketplace, moins margée, pèse davantage dans le CA. » | « Le CA progresse de 9,5 % mais le taux de marge brute recule de 2,3 % : la marketplace, moins margée, pèse davantage dans le CA. » (`points-confondus-avec-pourcentage`) ; « Le CA progresse de 9,5 % mais le taux de marge brute recule de 2,3 points : chaque canal a vu son propre taux baisser. » (`baisse-attribuee-aux-taux-locaux`) ; « La marge brute progresse de 1 200 € et le CA de 9,5 % : la rentabilité de l’entreprise s’améliore. » (`valeur-confondue-avec-taux`) | « 2,3 points » ; « pèse davantage » |

**Défis** (stratégies de référence, `corrige` type `defi`) : textes aux fiches A1-10, A5-08 et A6-04 ;
exactement une stratégie `fausse: true` par défi. **Révélations** (`corrige` type `revelation`) :
fiches A3-01 et A5-02.

**Productions** : `b2-01-a1-anatomie`, `b2-01-a2-comparable`, `b2-01-a5-controle` (classements),
`b2-01-a4-feuille-canaux` (feuille), `b2-01-a4-indice-toile` (tableau) : corrigés ci-dessus et au
§ 5.6.

---

## 6. Confidentialité : aucune réponse avant la question

### 6.1 Règles

1. **Contrat public sans secret.** Le sujet (`GET …/sujet`) et le catalogue (`GET
/formations/catalogue/:slug`) ne contiennent aucune des clefs `guide`, `correction`,
   `interaction`, `questions`, `corrige`, `banque`, ni aucun champ `solution`, `attendus`,
   `fragment`, `fausse`, `misconception`, `valeurAttendue`, ni `misconceptionsCiblees` non vide, ni
   stratégie de défi (`strategies` vaut `[]`), à aucun niveau d’imbrication.
2. **Diffusion.** Les écrans `seance` sont servis verrouillés au catalogue (titre et durée) ; seuls les
   13 écrans `catalogue` y sont servis en clair (§ 2.7).
3. **Questions sans contexte explicatif.** Les questions notées sont portées par des briques runtime
   qui n’affichent que l’énoncé et les options ; les énoncés sont des situations, jamais des rappels de
   cours.
4. **Correction après question.** Tout visuel qui porte la réponse d’une question est placé après
   l’écran de cette question (G1 après l’atelier 1, A3-03 après le vote A3-01, G3 après l’atelier 2, G4
   après l’atelier 3, A5-03 après le vote A5-02) ; tout exemple travaillé qui enseigne une méthode
   utilise d’autres nombres que les questions qui évaluent cette méthode (§ 2.4) ; seules les phrases
   de synthèse du fil rouge reprennent ses chiffres clés, pour évaluer la formulation.
5. **Aides sans valeur de réponse.** Les indices d’énigme ne contiennent aucun chiffre ; les
   `placeholder` et les titres décrivent une démarche, jamais un résultat.
6. **Stratégies après production.** Les stratégies d’un défi ne sont servies qu’après l’envoi de la
   tentative, qui est figée ; le drapeau `fausse` n’est servi qu’après la révélation pilotée.
7. **Écran servi.** Aucune écriture n’est acceptée sur un écran que le participant ne peut pas encore
   voir (409 `ECRAN_NON_SERVI`) : ni réponse, ni production, ni tentative, ni jalon, ni rappel, ni texte
   libre, ni défi.
8. **Notes et corrigés jamais projetés.** `notes`, `guide` et `corrigeEcran` ne sont servis qu’au
   déroulé formateur et rendus au pupitre (`board`) seulement ; la projection (`stage`) montre la bonne
   option d’un vote et la révélation **uniquement** en phase `revele` ; la vue étudiante ne les affiche
   jamais.

### 6.2 Les contextes de quiz du deck et leur reformulation neutre

Analyse du deck servi : 13 des 14 contextes de quiz trahissent la réponse ; le quatorzième (S63)
écarte un piège. Dans la V3, chaque question devient l’énoncé d’une brique runtime (colonne
« Destination ») ; la reformulation neutre sert de texte de situation si l’écran est un jour rendu en
quiz v2.

| Écran                       | Contexte actuel (extrait)                                                       | Ce qui trahit la réponse                           | Reformulation neutre                                                                                                                                               | Destination V3                |
| --------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| S03 PREDICTION              | « … Le premier réflexe est de vérifier le repère. »                             | nomme la bonne option                              | « Deux graphiques du tableau de bord montrent des pentes très différentes. Avant de dire lequel progresse le plus vite, que vérifiez-vous en premier ? »           | A1-10, A2-03 Q1               |
| S09 FONDATIONS              | « Un taux est une information relationnelle… »                                  | énonce la réponse « Non »                          | « Dans un courriel, un responsable écrit : « 27,6 %, c’est bon signe. » Peut-on décider sur cette base ? »                                                         | A1-05, A1-06                  |
| S23 INFLATION               | « Une baisse du rythme d’inflation ne signifie pas… »                           | donne la réponse ; rend « Cela dépend » défendable | « L’Insee publie une inflation de 2,0 % en 2024 puis de 0,9 % en 2025. En 2025, le niveau général des prix est-il plus bas, identique ou plus élevé qu’en 2024 ? » | A3-07 Q1                      |
| S25 DESINFLATION            | « … si le niveau des prix a baissé ou si sa hausse a seulement ralenti. »       | la dichotomie oriente                              | « Vous préparez la révision annuelle des tarifs d’Atelier Rivage. L’inflation passe de 4,9 % à 2,0 %. Que devient le niveau général des prix ? »                   | A3-07 Q1 (fusionnée avec S23) |
| S31 RELECTURE               | « Un analyste commence par vérifier le repère… »                                | nomme la bonne option                              | « Reprenez les deux graphiques du début de séance. Quel élément contrôlez-vous en premier ? »                                                                      | A2-03 Q1                      |
| S35 CORRELATION             | « … cause commune, relation indirecte ou simple coïncidence. »                  | énumère les raisons du « Non »                     | « Samir affirme : « La marketplace détourne nos clients du sur-mesure. » Que pensez-vous de cette affirmation ? »                                                  | A5-06 Q3                      |
| S38 MIX                     | « … Leur évolution peut diverger sans qu’il y ait une erreur. »                 | élimine « Erreur certaine »                        | « Tableau de bord 2025 : CA +9,5 %, marge brute +1 200 €, taux de marge brute de 27,6 % à 25,3 %. Quelle première conclusion est défendable ? »                    | A5-02 vote 1                  |
| S46 VOTE-1                  | « Un taux global est une moyenne pondérée… »                                    | énonce la bonne option                             | « Les trois canaux d’Atelier Rivage gardent chacun le même taux de marge brute en 2024 et en 2025. Le taux global baisse pourtant. Comment l’expliquez-vous ? »    | A5-02 vote 1                  |
| S48 VOTE-2                  | « … l’argument doit relier les taux locaux, les poids et le calcul global. »    | nomme la bonne option ; même question que S46      | remplacée par le cas jumeau du lycée                                                                                                                               | A5-02 vote 2                  |
| S50 PACIOLI (quiz imbriqué) | « un total exact ne garantit pas des lignes exactes »                           | contexte et paragraphe donnent la réponse          | question déplacée au rappel servi à tous (R10)                                                                                                                     | A6-01 (sans quiz), R10        |
| S54 MULTIPLE-NEUF           | « … il ne localise ni ne prouve l’anomalie. »                                   | énonce la réponse                                  | « Un écart de 270 € sépare le grand livre d’avril des pièces ; 270 est divisible par 9. Qu’en concluez-vous ? »                                                    | R11                           |
| S57 COMPENSATION            | « Un total exact peut masquer deux écarts de sens contraire. »                  | énonce la réponse                                  | « Contrôle de février : le total du grand livre égale celui des pièces ; F002 +100 €, F003 −100 €. Peut-on valider chaque écriture ? »                             | A5-07 (carte), R10            |
| S63 FLASH-POINTS            | « … un écart entre deux taux n’est pas toujours une évolution en pourcentage. » | écarte le piège « 25 points »                      | « Le taux de retour des colis passe de 4 % à 5 %. Quelle phrase est exacte ? »                                                                                     | R2                            |
| S64 FLASH-PREUVE            | « Le contrôle par 9 est un outil de repérage rapide… »                          | énonce la réponse                                  | « Un écart de 270 € apparaît entre le grand livre d’avril et les pièces ; 270 est divisible par 9. Qu’en concluez-vous ? »                                         | R11                           |

### 6.3 Autres fuites du deck et leur traitement

| Écran                                            | Fuite                                                                                  | Traitement V3                                                                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| S12 ABSOLU-RELATIF                               | affiche 18 000 € et 15 % deux écrans avant S14                                         | A2-03 Q4 sur d’autres données ; A2-05 sans les nombres évalués                                                   |
| S21 METHODE                                      | affiche « 1,08 × 0,95 = 1,026 » juste avant S22                                        | contenu repris par la fiche mémo, placée après toutes les questions                                              |
| S22 C2                                           | aide « Bases différentes ; 10 % de 110 vaut 11. »                                      | retiré ; aides V3 sans résultat                                                                                  |
| S24, S26, S27                                    | sous-titres et formules donnent les conclusions de S25 et S28                          | G2 décrit le taux sans parler du niveau ; G3 placé après l’atelier ; A3-09 demande une décision en euros de 2019 |
| S39, S41                                         | « Le taux global baisse probablement » ; titre du simulateur                           | retirés ; le vote précède l’exemple travaillé et le simulateur ; titre neutre                                    |
| S42 VALEUR-TAUX                                  | affiche 27,60 %, 25,3043 % et −2,30 points avant S43 et S44                            | retiré                                                                                                           |
| S47 PAIRS                                        | aide « Poids × taux local… »                                                           | remplacée par la phase de débat                                                                                  |
| S51 MISSION                                      | la bonne réponse porte la teinte « succès »                                            | classement A5-07 à catégories neutres                                                                            |
| S52, S53                                         | colonne « écart » déjà calculée, note « +90 € » avant la localisation                  | E4 donne le détail brut ; l’étudiant compare les lignes lui-même                                                 |
| S60 PRIORITES                                    | chaque anomalie affichée avec son contrôle                                             | cartes sans le contrôle ; priorisation écrite en A5-08                                                           |
| Énoncé de E4 (conception à 49 écrans)            | « un indice d’inversion de chiffres, que la pièce confirme » donnait la réponse de R11 | énoncé réécrit (détail des lignes, sans conclusion)                                                              |
| Consigne de A4-03 et G4 (conception à 49 écrans) | la répartition 2024/2025 donnait le mécanisme du vote A5-02                            | A4-03 et G4 portent sur la saisonnalité 2025 ; la répartition n’apparaît qu’en A5-03, après le vote              |
| Notes formateur (migration `1780060000000`)      | aucun test ne garantissait qu’elles ne sont pas projetées                              | règle 6.1-8 et test de bout en bout                                                                              |

### 6.4 Garde automatique `confidentialite`

Règle de `verifierStructure` (§ 2.6.2), exécutée dans le test du fichier de données V3 et avant toute
publication (B25). Les « textes publics » d’un écran sont toutes les chaînes de ses `donnees`
projetées par `tirer` (sujet) ou par `LireCoursPublic` (catalogue), options des questions comprises,
et son titre public. Recherche des nombres avec bornes : ni chiffre ni virgule immédiatement avant,
ni chiffre immédiatement après (« 12,50 » ne contient pas « 2,50 ») ; espaces ordinaires, insécables
et fines équivalents ; signe moins typographique et trait d’union équivalents.

1. **Volet exact** (toute question : notée, jumelle, énigme, rappel) : la forme publiée d’une solution
   numérique et le libellé exact de la bonne option d’un vote n’apparaissent dans aucun texte public
   des écrans 0 à k (k = écran de la question), hors l’énoncé et les options de la question
   elle-même ; les indices d’énigme ne contiennent aucun chiffre.
2. **Volet segments** (votes notés, principales, jumelles et billet) : les segments de la bonne réponse
   (§ 5.10) ne figurent pas **tous** dans une même chaîne publique des écrans 0 à k − 1 (comparaison
   sans casse). Les questions de la banque de rappel en sont exclues par construction : ce sont des
   questions de récupération sur des notions déjà enseignées (A5-07, A6-01) ; le volet exact leur
   reste appliqué.
3. **Volet catalogue** : les volets 1 et 2 sont rejoués en remplaçant « écrans 0 à k » par « tous les
   écrans `catalogue` », quel que soit leur rang ; la règle `catalogue-sans-question` interdit toute
   activité en diffusion `catalogue`. Un écran `seance` paraît lui aussi au catalogue, verrouillé :
   ses `donnees` sont vides, mais **son titre public reste lisible**, et il est donc cherché comme
   un texte de catalogue. C’est ce volet qui a fait renommer le titre de A4-04 (§ 3, acte 4).
4. **Valeurs numériques des propriétés** : les séries des graphiques (`values`) sont formatées à la
   française à la précision de chaque question numérique et incluses dans les textes publics ; les
   attendus des productions ayant au moins trois chiffres significatifs sont cherchés à 2, 4 et
   6 décimales (0,3452 ; 34,52) ; `metadonnees.misconceptionsCiblees` est vide partout.
   **Exception mesurée pour les feuilles** : les attendus d’un `fp-sheet` sont cherchés à 4 et
   6 décimales seulement, c’est-à-dire à la précision que le moteur calcule, jamais à leur arrondi
   d’affichage à 2 décimales. Cherchés à 2 décimales, ils donnent deux faux positifs sur la V3, tous
   deux du contenu de cours légitime : A2-06 affiche « 25,30 % », le taux de marge global 2025 qui
   est une donnée du cas (§ 5.2) et non une réponse à trouver, quand F5 vaut 0,253043 ; la capsule
   A4-01 affiche « 0,35 », une part de son propre exemple sur les sacs étanches, quand E2 vaut
   0,345217 — deux nombres différents que seul l’arrondi confond. À 4 et 6 décimales la V3 ne lève
   aucune fuite, et un écran qui publierait « 0,253043 » ou « 25,3043 » serait bien signalé.

Résultat attendu sur la V3 : **0 fuite** (vérifié par le script de l’annexe E sur les textes de ce
document). Premières apparitions publiques des réponses numériques, toutes **après** la question :
45,5 (A5-03, étape 1) ; 112,68 (A3-08). Les autres (−17,81 ; 15,97 ; 2,50 ; 28,8 ; −30 960 ; 23,4 ;
−2,8 ; 1 035,00 ; 9 741) n’apparaissent jamais dans un texte public (corrigés au pupitre seulement).

---

## 7. Critères d’acceptation mesurables

### 7.1 Structure et contenu

| #     | Critère                                                                                                                                                                                           | Mesure                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| AC-01 | `verifierStructure(B2 v3)` ne renvoie aucune violation, sans dérogation                                                                                                                           | test unitaire back                                                         |
| AC-02 | 52 écrans ; identifiants uniques conformes à `^B2-01-A[1-6]-\d{2}-[A-Z0-9-]+$` ; ordre du § 3.1 ; chaque écran V3 porte un titre public (≤ 120 caractères) et une diffusion explicite             | test du fichier de données                                                 |
| AC-03 | somme des durées = 210 = durée annoncée ; par acte 30, 36, 36, 38, 42, 28                                                                                                                         | test                                                                       |
| AC-04 | exposition continue ≤ 6 min (attendu 5) ; ratio interactif ÷ exposition ≥ 0,30 (attendu 3,29)                                                                                                     | règle de structure                                                         |
| AC-05 | toute question de type vote, numérique ou classement notée est sur un écran de 8 à 15 min, hors `fp-recall` d’ouverture et `fp-exit` de clôture                                                   | règle `atelier-questions-fermees`                                          |
| AC-06 | chaque `notes` contient les 5 rubriques non vides                                                                                                                                                 | règle `notes-formateur`, contrainte `chk_formation_screen_notes_not_blank` |
| AC-07 | 31 questions notées (19 votes, 7 numériques, 3 classements, 1 feuille, 1 tableau), 4 énigmes et 13 rappels non notés ; identifiants de question uniques ≤ 60 caractères                           | test                                                                       |
| AC-08 | `ouvrirTirages(V3)` produit 61 graines non ambiguës ; barème v2 ≤ 400 Ko                                                                                                                          | test                                                                       |
| AC-09 | chaque piège porte une confusion de la banque ; chacune des 38 confusions a une remédiation vers un écran existant ; chaque identifiant d’option vaut `slugOption(libelle)`                       | règles `reference-inconnue`, `options-neutres`                             |
| AC-10 | les valeurs du § 5.8 sont celles du fichier de données (un test recalcule les corrigés depuis les données brutes)                                                                                 | test                                                                       |
| AC-11 | la feuille A4-02 corrigée par le moteur canonique donne les 17 valeurs du § 5.6 ; les vecteurs partagés donnent les mêmes résultats dans le back et le front ; empreintes des vecteurs identiques | tests de parité (R16)                                                      |
| AC-12 | les versions 1 et 2 du B2 restent lisibles et servies ; leurs solutions et libellés d’options sur 10 graines figées sont inchangés après chaque lot                                               | tests dorés (R17)                                                          |

### 7.2 Confidentialité et intégrité

| #     | Critère                                                                                                                                                                                                | Mesure                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| AC-13 | aucune clef ni champ interdit (§ 6.1-1) dans le sujet ni dans le catalogue ; les écrans `seance` du catalogue n’ont pas de `donnees`                                                                   | test HTTP, parcours récursif du JSON             |
| AC-14 | garde `confidentialite` : 0 fuite sur les trois volets                                                                                                                                                 | règle de structure                               |
| AC-15 | un fragment n’est renvoyé qu’après une tentative juste ; 11e tentative → 409 `TENTATIVES_EPUISEES` ; 20 tentatives parallèles → exactement 10 comptées ; énigme non ouverte → 409 `ENIGME_VERROUILLEE` | tests HTTP et base                               |
| AC-16 | les stratégies d’un défi ne sont servies qu’après l’envoi, sans `fausse` avant la révélation ; la première tentative reste figée au pupitre                                                            | tests HTTP                                       |
| AC-17 | aucune route ne renvoie l’état individuel d’un autre participant (jalons, réponses, énigmes)                                                                                                           | tests HTTP (matrice d’accès)                     |
| AC-18 | la projection et la vue étudiante n’affichent jamais `notes`, `guide` ni `corrigeEcran` ; la projection montre la bonne option et la révélation seulement en phase `revele`                            | test de bout en bout paramétré (`stage` × phase) |
| AC-19 | toute écriture visant un écran non servi → 409 `ECRAN_NON_SERVI` ; question jumelle hors phase → 409 `PHASE_FERMEE`                                                                                    | tests HTTP                                       |

### 7.3 Licences et médias

| #     | Critère                                                                                                                                                                                    | Mesure                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| AC-20 | chaque image, la vidéo et sa piste de sous-titres figurent au catalogue des médias (§ 8.2) avec page source, auteur, date, licence                                                         | règle `media-sans-licence` |
| AC-21 | attribution visible : lien « Wikimedia Commons (domaine public) » sous chaque image historique ; licence, voix de synthèse et données SIWIS créditées sous la vidéo et sur le carton final | test de rendu              |
| AC-22 | plus aucune image Pexels ; médias servis depuis `/assets/cours/b2-01/v3/` ; image ≤ 400 Ko ; vidéo de projection ≤ 25 Mo, variante poste ≤ 8 Mo                                            | test de taille             |
| AC-23 | capsule : transcription complète avec descriptions visuelles et sous-titres WebVTT en français activés par défaut ; durée 145 à 155 s ; intensité −16 LUFS ± 1 ; aucune voix système macOS | recette de l’annexe A      |

### 7.4 Rendu étudiant, formateur, projection et page publique

| #     | Critère                                                                                                                                                                                                                                    | Mesure                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-24 | chaque écran se rend en `hand`, `board` et `stage` sans `fp-block-error` ni « écran inconnu »                                                                                                                                              | test de montage paramétré sur les 52 écrans, à partir de l’instantané JSON du sujet et du déroulé V3 produit par le test back (avec son empreinte) |
| AC-25 | les briques reçoivent `data-cours-role` : le solutionnaire de `fp-escape` et la carte de maîtrise de `fp-spaced` n’apparaissent qu’au pupitre                                                                                              | test                                                                                                                                               |
| AC-26 | G1 à G4 affichent titre, unité, source, phrase de lecture et une échelle graduée (courbes comprises) ; barres proportionnelles depuis 0                                                                                                    | test de rendu et instantanés visuels                                                                                                               |
| AC-27 | la projection passe en plein écran et reste dans la palette crème et ivoire                                                                                                                                                                | test existant étendu                                                                                                                               |
| AC-28 | page publique : les 13 écrans `catalogue` sont rendus (v2 et runtime en aperçu), les 39 autres verrouillés avec titre et durée ; aucune requête vers `/formations/sessions` ; le HTML rendu côté serveur contient le titre de chaque écran | test de la page                                                                                                                                    |
| AC-29 | chaque graphique a une `description` textuelle et un bouton « Voir les données »                                                                                                                                                           | test de rendu                                                                                                                                      |
| AC-30 | aucune information portée par la seule couleur (étiquettes directes, marqueurs) ; contrastes ≥ 3:1 (traits) et ≥ 4,5:1 (textes), mesurés                                                                                                   | test automatisé des couleurs                                                                                                                       |
| AC-31 | tri de cartes au clavier (sélection puis catégorie) et en un seul pointeur                                                                                                                                                                 | test                                                                                                                                               |
| AC-32 | aucun chrono ne bloque l’envoi (`dureeJeuMs`, `budgetEnigmeMs`)                                                                                                                                                                            | test                                                                                                                                               |

### 7.5 Robustesse, performance et exploitation

| #     | Critère                                                                                                                                                                                                          | Mesure                                          |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| AC-33 | rechargement pendant une production : brouillon restauré ; après envoi : verdict restauré, bouton désactivé, message « déjà répondu » ; deux séances successives sur le même navigateur : aucune reprise croisée | Playwright                                      |
| AC-34 | budgets : 35 lectures simultanées du sujet < 1 s au 95e centile ; 35 productions simultanées < 3 s ; poussée de `resultats` < 200 ms, au plus une par seconde ; sujet V3 ≤ 150 Ko                                | `test/formations-charge.db-integration.spec.ts` |
| AC-35 | moteur de formules : vecteurs adverses (chaîne de 26 doublements, 26 `SOMME` croisées, cycle de 26 maillons) < 50 ms côté back, < 100 ms côté front                                                              | tests unitaires                                 |
| AC-36 | publication : V3 insérée non publiée → les séances s’ouvrent en v2 ; bascule → V3 ; rebascule → v2 ; les séances ouvertes gardent leur version                                                                   | test base et E2E                                |
| AC-37 | capacité : au-delà de la capacité de la séance → 409 `SEANCE_COMPLETE` ; un participant évincé perd son accès, sa place et sa graine sont libérées                                                               | tests HTTP                                      |
| AC-38 | chaque libellé runtime a une traduction anglaise ; aucun texte de brique en dur hors `$localize`                                                                                                                 | test et extraction XLF                          |
| AC-39 | Redis en panne : flux ouverts en mode dégradé et journal `error` ; plafond atteint : 429 et journal `warn`                                                                                                       | tests unitaires et E2E                          |

---

## 8. Sources et licences

### 8.1 Sources (vérifiées le 19 septembre 2026)

| Sujet                                                                                                                                                                                                 | Source                                                                      | URL                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arrêté du 8 juillet 2024 (BTS CG, épreuve E3, situations d’évaluation, tableur)                                                                                                                       | Légifrance, JORF n° 0163 du 10 juillet 2024, NOR ESRS2414606A               | https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000049926350                                                                                                                                                                      |
| Référentiel du BTS CG (programme de mathématiques de l’arrêté du 4 juin 2013, NOR ESRS1312230A ; module « Traitement de l’information chiffrée » ; processus P1 et P5), avec l’arrêté de 2024 en tête | DGESIP                                                                      | https://enqdip.sup.adc.education.fr/bts/referentiel/BTS_ComptabiliteGestion.pdf                                                                                                                                                  |
| Inflation 2019–2025 (moyennes annuelles, IPC), paru le 23 mars 2026 ; IPC en base 2025 depuis janvier 2026                                                                                            | Insee, « L’essentiel sur… l’inflation »                                     | https://www.insee.fr/fr/statistiques/4268033                                                                                                                                                                                     |
| IPC base 2025, France, ensemble des ménages (ressource A6-07, indice officiel rebasé, glissement annuel)                                                                                              | Insee, série 011814630                                                      | https://www.insee.fr/fr/statistiques/serie/011814630 ; données : https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/011814630                                                                                                      |
| Série arrêtée, retirée du cours                                                                                                                                                                       | Insee, série 001765618                                                      | https://www.insee.fr/fr/statistiques/serie/001765618                                                                                                                                                                             |
| Taux de marge commerciale ; taux de marge (statistique d’entreprise)                                                                                                                                  | Insee, définitions                                                          | https://www.insee.fr/fr/metadonnees/definition/c2224 ; https://www.insee.fr/fr/metadonnees/definition/c1574 ; https://www.insee.fr/fr/metadonnees/definition/c1835                                                               |
| Taux de marque et taux de marge ; soldes intermédiaires de gestion                                                                                                                                    | Bpifrance Création                                                          | https://bpifrance-creation.fr/taux-marque ; https://bpifrance-creation.fr/encyclopedie/piloter-lentreprise/finance-pilotage-economique/comprendre-calculer-soldes                                                                |
| Réutilisation des données Insee (Licence Ouverte 2.0)                                                                                                                                                 | Insee ; Etalab                                                              | https://www.insee.fr/fr/information/2008466 ; https://www.etalab.gouv.fr/licence-ouverte-open-licence                                                                                                                            |
| Cadre d’usage de l’IA en éducation (juin 2025)                                                                                                                                                        | Ministère de l’Éducation nationale                                          | https://www.education.gouv.fr/cadre-d-usage-de-l-ia-en-education-450647                                                                                                                                                          |
| Compétences en IA pour les élèves                                                                                                                                                                     | UNESCO                                                                      | https://www.unesco.org/en/articles/ai-competency-framework-students                                                                                                                                                              |
| Tableau croisé dynamique (Excel)                                                                                                                                                                      | Microsoft                                                                   | https://support.microsoft.com/fr-fr/excel/get-started/create-a-pivottable-to-analyze-worksheet-data                                                                                                                              |
| Power Query (Excel)                                                                                                                                                                                   | Microsoft                                                                   | https://support.microsoft.com/fr-fr/Excel/power-query-for-excel-help                                                                                                                                                             |
| RECHERCHEX (Excel)                                                                                                                                                                                    | Microsoft                                                                   | https://support.microsoft.com/fr-fr/excel/functions/xlookup-function                                                                                                                                                             |
| Table pilote (LibreOffice Calc)                                                                                                                                                                       | The Document Foundation                                                     | https://help.libreoffice.org/latest/fr/text/scalc/guide/datapilot.html                                                                                                                                                           |
| Licences CC BY-SA 4.0 (capsule) et CC BY 4.0 (données SIWIS)                                                                                                                                          | Creative Commons                                                            | https://creativecommons.org/licenses/by-sa/4.0/deed.fr ; https://creativecommons.org/licenses/by/4.0/deed.fr                                                                                                                     |
| Voix de synthèse Piper, modèle `fr_FR-siwis-medium` (MIT)                                                                                                                                             | rhasspy / Piper                                                             | https://huggingface.co/rhasspy/piper-voices/blob/main/fr/fr_FR/siwis/medium/MODEL_CARD                                                                                                                                           |
| The SIWIS French Speech Synthesis Database (CC BY 4.0)                                                                                                                                                | Université d’Édimbourg                                                      | https://datashare.ed.ac.uk/handle/10283/2353 ; https://doi.org/10.7488/ds/1705                                                                                                                                                   |
| Licence de macOS Tahoe 26, § 2.F (voix système : pas de publication)                                                                                                                                  | Apple                                                                       | https://www.apple.com/legal/sla/docs/macOSTahoe.pdf                                                                                                                                                                              |
| Charte de qualité du sous-titrage (12 caractères par seconde en moyenne)                                                                                                                              | Arcom (ex-CSA), décembre 2011                                               | https://www.csa.fr/Reguler/Espace-juridique/Les-relations-de-l-Arcom-avec-les-editeurs/Chartes-et-autres-guides/Charte-relative-a-la-qualite-du-sous-titrage-a-destination-des-personnes-sourdes-ou-malentendantes-Decembre-2011 |
| Accessibilité (1.1.1, 1.2.2, 1.2.5, 1.2.8, 1.4.1, 1.4.11, 2.1.1, 2.2.1, 2.5.7)                                                                                                                        | W3C, WCAG 2.2                                                               | https://www.w3.org/TR/WCAG22/                                                                                                                                                                                                    |
| Reproduction d’œuvres d’art du domaine public (M4)                                                                                                                                                    | Directive (UE) 2019/790, article 14                                         | https://eur-lex.europa.eu/eli/dir/2019/790/oj                                                                                                                                                                                    |
| Capture vidéo et normalisation                                                                                                                                                                        | Playwright ; FFmpeg (`loudnorm`, `ebur128`) ; paquet `ffmpeg-static`        | https://playwright.dev/docs/videos ; https://ffmpeg.org/ffmpeg-filters.html#loudnorm ; https://www.npmjs.com/package/ffmpeg-static                                                                                               |
| Playfair (43 courbes et un graphique en barres) ; Priestley, A Chart of Biography (1765)                                                                                                              | Wikipedia (source secondaire, recoupée avec les fichiers Commons)           | https://en.wikipedia.org/wiki/William_Playfair                                                                                                                                                                                   |
| Summa de arithmetica (1494), première description imprimée de la partie double                                                                                                                        | Wikipedia (source secondaire)                                               | https://en.wikipedia.org/wiki/Summa_de_arithmetica                                                                                                                                                                               |
| Espacement de la pratique (A6-05)                                                                                                                                                                     | Cepeda, Pashler, Vul, Wixted, Rohrer (2006), Psychological Bulletin 132(3)  | https://doi.org/10.1037/0033-2909.132.3.354                                                                                                                                                                                      |
| Effet de test (A1-01, A6-05)                                                                                                                                                                          | Roediger, Karpicke (2006), Psychological Science 17(3)                      | https://doi.org/10.1111/j.1467-9280.2006.01693.x                                                                                                                                                                                 |
| Instruction par les pairs (A3-01, A5-02)                                                                                                                                                              | Crouch, Mazur (2001), American Journal of Physics 69                        | https://doi.org/10.1119/1.1374249                                                                                                                                                                                                |
| Exemples travaillés (A2-06, A3-04, A3-06, A5-03)                                                                                                                                                      | Sweller, Cooper (1985), Cognition and Instruction 2(1)                      | https://doi.org/10.1207/s1532690xci0201_3                                                                                                                                                                                        |
| Étayage dégressif                                                                                                                                                                                     | Renkl, Atkinson (2003), Educational Psychologist 38(1)                      | https://doi.org/10.1207/S15326985EP3801_3                                                                                                                                                                                        |
| Rédaction des items (options de longueur comparable, distracteurs plausibles)                                                                                                                         | Haladyna, Downing, Rodriguez (2002), Applied Measurement in Education 15(3) | https://doi.org/10.1207/S15324818AME1503_5                                                                                                                                                                                       |
| Principe de cohérence (capsule)                                                                                                                                                                       | Mayer (2009), Multimedia Learning                                           | https://doi.org/10.1017/CBO9780511811678                                                                                                                                                                                         |

### 8.2 Catalogue des médias

Les images sont téléchargées une fois, converties en WebP (1 600 px de large au plus, ≤ 400 Ko) et
servies depuis `/assets/cours/b2-01/v3/` (chemins versionnés : un média corrigé change de version et
n’est jamais servi depuis un cache d’un an sous l’ancien nom). Le domaine public autorise ces dérivés
sans condition ; le lien vers la page Commons reste affiché. Le catalogue est stocké avec le cours
(`Cours.medias`, B17) et contrôlé par la règle `media-sans-licence`.

| Id  | Écran | Fichier source (page)                                                                                                                                                      | Original                                                                                                | Auteur, date                                                                                                                                                                                        | Licence                 | Dérivé servi                                                                                                                                          | Attribution affichée                                                                                                                                                                |
| --- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | A1-02 | https://commons.wikimedia.org/wiki/File:1786_Playfair_-_Exports_and_Imports_of_Scotland_to_and_from_different_parts_for_one_Year_from_Christmas_1780_to_Christmas_1781.jpg | 1 137 × 763 px, 278 ko                                                                                  | William Playfair, The Commercial and Political Atlas, 1786                                                                                                                                          | domaine public          | `playfair-ecosse-1786.webp`                                                                                                                           | « William Playfair, 1786 · Wikimedia Commons (domaine public) »                                                                                                                     |
| M2  | A2-01 | https://commons.wikimedia.org/wiki/File:Playfair_TimeSeries.png                                                                                                            | 2 067 × 1 527 px, 5,3 Mo                                                                                | William Playfair, 1786                                                                                                                                                                              | domaine public          | `playfair-series-1786.webp`                                                                                                                           | « Document original · Wikimedia Commons (domaine public) »                                                                                                                          |
| M3  | A5-01 | https://commons.wikimedia.org/wiki/File:Nightingale-mortality.jpg                                                                                                          | 6 996 × 3 826 px, 5,6 Mo                                                                                | Florence Nightingale, 1858 (numérisation David Rumsey Map Collection)                                                                                                                               | domaine public          | `nightingale-1858.webp`                                                                                                                               | « Florence Nightingale, 1858 · Wikimedia Commons (domaine public) »                                                                                                                 |
| M4  | A6-01 | https://commons.wikimedia.org/wiki/File:Pacioli.jpg                                                                                                                        | 1 500 × 1 250 px, 306 ko                                                                                | portrait attribué à Jacopo de’ Barbari, 1495                                                                                                                                                        | domaine public (PD-Art) | `pacioli-1495.webp`                                                                                                                                   | « Portrait attribué à Jacopo de’ Barbari, 1495 · Wikimedia Commons (domaine public) »                                                                                               |
| M5  | A4-01 | capsule produite pour le cours (annexe A)                                                                                                                                  | WebM VP9/Opus 1 280 × 720 (≤ 25 Mo) et 854 × 480 (≤ 8 Mo), 2 min 30 ; affiche JPEG ; sous-titres WebVTT | Asili Design, 2026 ; voix de synthèse Piper `fr_FR-siwis-medium` (modèle MIT, données SIWIS de l’Université d’Édimbourg, CC BY 4.0) ; polices Atkinson Hyperlegible et JetBrains Mono (SIL OFL 1.1) | CC BY-SA 4.0            | `capsule-formule-recopiable-720p.webm`, `capsule-formule-recopiable-480p.webm`, `capsule-formule-recopiable.jpg`, `capsule-formule-recopiable.fr.vtt` | « Une formule qui se recopie, un tableau qui se contrôle · Asili Design, 2026 · CC BY-SA 4.0 · Voix : Piper fr_FR-siwis-medium, données SIWIS (Université d’Édimbourg), CC BY 4.0 » |

M4 est la reproduction photographique d’une peinture du domaine public : sa libre réutilisation repose
aussi sur l’article 14 de la directive (UE) 2019/790 (une reproduction fidèle d’une œuvre d’art visuel
tombée dans le domaine public n’est pas protégée, sauf originalité propre).

Médias retirés : la photo Pexels du hero (licence Pexels, qui n’est ni CC0 ni une licence libre) ;
`Luca_Pacioli.jpg`, dessin des proportions d’une tête tiré de De divina proportione (1509), présenté à
tort par le deck comme un portrait de Pacioli ; le lien incohérent `Playfair_TimeSeries-2.png`.

### 8.3 La vidéo prévue par le brief V2 : vérification et décision

Fichier vérifié : `Mathematrix Prozentrechnung Vertiefend.webm`,
https://commons.wikimedia.org/wiki/File:Mathematrix_Prozentrechnung_Vertiefend.webm, auteur
« Yomomo », travail personnel du 24 août 2020, licence CC BY-SA 4.0 ; 1 513 s (25 min 13 s), 693 × 388
px, 65,8 Mo, **en allemand**.

**Décision : écartée.** Elle occuperait 12 % de la séance, dans une langue que le public ne comprend
pas, à une définition insuffisante pour la projection, sans lien avec le fil rouge. Aucune vidéo
francophone sur les pourcentages sous licence libre vérifiable n’a été trouvée sur Wikimedia Commons ;
les ressources francophones trouvées ailleurs sont sous licence non commerciale ou sans licence libre.
**Remplacement** : capsule de 2 min 30 produite par nous (annexe A), en français, sur un tableau
différent de la tâche notée, publiée sous CC BY-SA 4.0. La narration utilise Piper
`fr_FR-siwis-medium` (données SIWIS sous CC BY 4.0, compatibles avec CC BY-SA 4.0 si elles sont
créditées). Les voix système de macOS (`say`) sont exclues de toute étape, y compris des maquettes :
la licence de macOS Tahoe 26 (§ 2.F) interdit l’enregistrement et la publication de ces voix, même à
but non lucratif.

---

## 9. Contrats figés (lot 0)

Ce paragraphe est la référence commune du back et du front : chacun s’implémente contre lui, sans
autre échange. Les types sont normatifs (noms, champs, optionalité) ; les commentaires `//` des blocs
ne font que les expliquer. Toute évolution d’un contrat passe par une modification de ce document
avant le code.

### 9.1 Conventions

- Préfixe : `/api/v1/portfolio25` (variable `API_PREFIX`) ; toutes les routes ci-dessous commencent par
  `/formations`.
- JSON en UTF-8 ; dates en ISO 8601 UTC ; identifiants de séance et de participant en UUID ;
  identifiants de question ≤ 60 caractères ; identifiants d’écran ≤ 120 caractères.
- Authentification : participant par l’en-tête `x-participant-token` (jeton signé de la séance) ;
  formateur par jeton porteur, rôle `teacher` ; administrateur, rôle `admin`.
- Erreurs métier au format RFC 7807 (`DomainExceptionFilter`) : `{ type, title, status, detail,
instance, code? }`. Les erreurs de validation des DTO restent celles de Nest (400).

| `code`                     | Statut | Sens                                                                      |
| -------------------------- | -----: | ------------------------------------------------------------------------- |
| `SEANCE_NON_DEMARREE`      |    409 | écriture avant `start` (existant)                                         |
| `SEANCE_TERMINEE`          |    409 | écriture après clôture (existant)                                         |
| `REPONSE_DEJA_ENREGISTREE` |    409 | réponse ou production déjà enregistrée (existant, étendu aux productions) |
| `NOM_DE_GROUPE_DEJA_PRIS`  |    409 | existant                                                                  |
| `COURS_MODIFIE`            |    409 | le tirage recalculé diffère du barème (code ajouté à `CoursModifieError`) |
| `ECRAN_NON_SERVI`          |    409 | l’écran visé n’est pas encore servi au participant (B20)                  |
| `PHASE_FERMEE`             |    409 | question d’un vote à pairs hors de sa phase (B21)                         |
| `PHASE_NON_MONOTONE`       |    409 | commande de pilotage qui ramène une phase ou une révélation en arrière    |
| `ENIGME_VERROUILLEE`       |    409 | énigme dont la précédente n’est pas résolue                               |
| `ENIGME_DEJA_RESOLUE`      |    409 | tentative sur une énigme résolue                                          |
| `TENTATIVES_EPUISEES`      |    409 | dixième tentative déjà consommée                                          |
| `SEANCE_COMPLETE`          |    409 | capacité de la séance atteinte                                            |
| `VERSION_NON_PUBLIABLE`    |    409 | version dont `ouvrirTirages` échoue au moment de la bascule               |
| `TYPE_DE_QUESTION`         |    400 | question envoyée sur une route qui n’est pas la sienne                    |
| `PRODUCTION_VIDE`          |    400 | production sans aucune saisie                                             |
| `PRODUCTION_INVALIDE`      |    400 | production non conforme au plan (cellule hors grille, carte inconnue…)    |
| `ACTIVITE_INCONNUE`        |    400 | `activityId` ou `screenId` absent du cours                                |
| `DEFI_SANS_TENTATIVE`      |    404 | stratégies demandées sans tentative                                       |
| `SEANCE_INTROUVABLE`       |    404 | séance absente de la base                                                 |
| `COURS_INTROUVABLE`        |    404 | cours ou version absent du catalogue                                      |
| `PARTICIPANT_INTROUVABLE`  |    404 | participant absent de la séance, ou évincé                                |
| `PLAFOND_DE_FLUX_ATTEINT`  |    429 | plafond de flux partagé atteint sur une autre instance (H6)               |

### 9.2 Identifiants et fonctions pures partagées

- **`slugOption(libelle)`** (identifiant stable d’option, calculé par le back seulement) : normaliser
  en NFD et retirer les diacritiques ; passer en minuscules ; remplacer `+` par « plus », `−` (U+2212)
  par « moins », `%` par « pct », `€` par « eur » (entourés d’espaces) ; remplacer toute suite de
  caractères hors `[a-z0-9]` par `-` ; retirer les `-` de début et de fin ; garder les 40 premiers
  caractères (sans `-` final) ; ajouter `-` et les 8 premiers caractères hexadécimaux du SHA-256 du
  libellé en NFC. Exemples : « +25 % » → `plus-25-pct-ecd953a1` ; « Inférieur de 1 % au prix de
  départ » → `inferieur-de-1-pct-au-prix-de-depart-7b7f8a6e`. L’identifiant ne dit rien de la
  justesse de l’option ; deux options d’une même question ne peuvent pas avoir le même identifiant
  (test).
- **`activityId` des réponses libres** : réflexion v2 → `promptData.id` ; rappel libre de
  `fp-recall` → `<questionId>:rappel` ; texte du billet → `<billetId>` ; étape rédigée de `fp-worked` →
  `<exempleId>:<etapeId>` et son explication → `<exempleId>:<etapeId>:pourquoi` ; défi → `<defiId>`.
  `activitesLibres(cours)` renvoie, par écran, la liste de ces identifiants.
- **`lireNombreSaisi(texte): number | null`** : retire les espaces (U+0020, U+00A0, U+202F) ; accepte
  la virgule ou le point décimal, `+`, `-` et `−` en tête ; accepte en fin « % », « € », « pt »,
  « pts », « point », « points » (sans casse) ; refuse tout autre caractère (`null`).
- **Clés de brouillon (front)** : `fp.<sessionId>.<participantId>.<brique>.<id>` (valeur JSON) ; purgées
  à l’événement `fin` et à tout nouveau rattachement ; aucune autre clé `fp.*` n’est écrite.

### 9.3 Types du domaine (back)

#### 9.3.1 Écrans et cours

```ts
// domain/cours/Cours.ts — forme finale (extraits normatifs)
export type Diffusion = 'catalogue' | 'seance';
export type OrdreQuestions = 'fixe' | 'melange';
export type TypeQuestion =
  | 'numeric'
  | 'vote'
  | 'feuille'
  | 'tableau'
  | 'classement'
  | 'enigme';

interface EcranCommun {
  readonly id: string;
  readonly titre: string | null; // obligatoire (≤ 120) à partir de la version 3
  readonly diffusion: Diffusion; // 'catalogue' à la lecture des versions 1 et 2
  readonly dureeMinutes: number;
  readonly concepts: AuMoinsUn<ConceptId>;
  readonly notes: string;
  readonly modalite?: Modalite;
  readonly question?: QuestionVote; // quiz v2 attaché (versions 1 et 2)
  readonly guide?: GuideFormateur;
}

export type Ecran =
  | EcranExposition // fp-quote, fp-story, fp-pro, fp-worked, fp-concept4, fp-plot, fp-pulse
  | (EcranCommun & {
      readonly brique: 'fp-numeric';
      readonly question: QuestionNumerique;
      readonly seuil?: number;
    })
  | (EcranCommun & {
      readonly brique: 'fp-vote';
      readonly question: QuestionVote;
      readonly questionJumelle?: QuestionVote;
      readonly revelation?: CorrigeRevelation;
      readonly seuil?: number;
    })
  | (EcranCommun & {
      readonly brique: 'fp-recall';
      readonly question: QuestionVote;
      readonly delaiMs: number;
      readonly seuil?: number;
    })
  | (EcranCommun & {
      readonly brique: 'fp-exit';
      readonly question: QuestionVote;
      readonly invite: string;
    })
  | (EcranCommun & {
      readonly brique: 'questionnaire';
      readonly intitule: string;
      readonly consigne: string;
      readonly regime: RegimeVerrou;
      readonly ordre: OrdreQuestions;
      readonly questions: AuMoinsUn<QuestionVote | QuestionNumerique>;
    })
  | (EcranCommun & {
      readonly brique: 'fp-sheet';
      readonly proprietes: { readonly plan: SheetPlanStocke };
      readonly production: QuestionProduction;
    })
  | (EcranCommun & {
      readonly brique: 'fp-table-build';
      readonly proprietes: { readonly plan: TableBuildPlanStocke };
      readonly production: QuestionProduction;
    })
  | (EcranCommun & {
      readonly brique: 'fp-cardsort';
      readonly proprietes: { readonly plan: CardsortPlanStocke };
      readonly production: QuestionProduction;
    })
  | (EcranCommun & {
      readonly brique: 'fp-escape';
      readonly proprietes: { readonly parcours: EscapeParcoursStocke };
      readonly enigmes: AuMoinsUn<QuestionProduction>;
    })
  | (EcranCommun & {
      readonly brique: 'fp-challenge';
      readonly proprietes: { readonly probleme: ProblemeStocke };
      readonly defi: CorrigeDefi;
    })
  | (EcranCommun & {
      readonly brique: 'fp-spaced';
      readonly proprietes: {
        readonly rappel: { readonly id: string; readonly intitule: string };
      };
      readonly banque: AuMoinsUn<QuestionVote>;
      readonly obligatoires: readonly string[]; // identifiants de la banque servis à tous
    });

export interface Cours {
  readonly slug: string;
  readonly titre: string;
  readonly niveau: string;
  readonly dureeMinutes: number;
  readonly concepts: AuMoinsUn<ConceptId>;
  readonly ecrans: AuMoinsUn<Ecran>;
  readonly remediations: Readonly<Partial<Record<ConfusionId, string>>>; // B17
  readonly medias: readonly MediaCatalogue[]; // B17
}

export interface MediaCatalogue {
  readonly id: string; // 'M1' …
  readonly chemins: AuMoinsUn<string>; // chemins servis (/assets/cours/b2-01/v3/…)
  readonly pageSource: string | null; // page Commons, ou null pour une production interne
  readonly auteur: string;
  readonly date: string;
  readonly licence: string; // 'domaine public', 'CC BY-SA 4.0'…
  readonly attribution: string; // texte affiché
}

// questionsDe(ecran) : questions du questionnaire ; question et questionJumelle du vote ; question de
// fp-numeric, fp-recall, fp-exit ; production ; énigmes ; banque ; quiz v2 attaché.
export function questionsDe(ecran: Ecran): readonly Question[];
```

Formes stockées des plans : `SheetPlanStocke`, `CardsortPlanStocke`, `TableBuildPlanStocke` et
`EscapeParcoursStocke` sont les formes publiques du § 9.4 sans `metadonnees` (ajoutées par le
tirage) ; `ProblemeStocke` = `{ id, enonce, invite }`. `EcranExposition` garde ses briques actuelles et
ajoute `fp-pulse` (`proprietes: { sondage: { id, invite } }`) ; `fp-worked` porte `{ exemple, etayage }`
et `fp-plot` accepte `bornesOrdonnee`, `sourceUrl` et `description`.

#### 9.3.2 Questions

```ts
export interface QuestionProduction {
  readonly id: string;
  readonly type: 'feuille' | 'tableau' | 'classement' | 'enigme';
  readonly concept: ConceptId;
  readonly noteCompte: boolean;
  readonly confusions: AuMoinsUn<ConfusionId>;
  readonly corrige: CorrigeProduction; // identique pour toutes les graines, sans `generer`
}
export type Question = QuestionNumerique | QuestionVote | QuestionProduction;

// Formes stockées (sous la clef réservée `questions` ou dans `banque`), converties par questionVote /
// questionNumerique avec des données constantes.
export interface OptionStockee {
  readonly id: string; // === slugOption(libelle)
  readonly libelle: string;
  readonly confusion: ConfusionId | null; // null pour la seule bonne option
}
export interface VoteStockee {
  readonly type: 'vote';
  readonly id: string;
  readonly concept: ConceptId;
  readonly noteCompte: boolean;
  readonly enonce: string;
  readonly options: AuMoinsUn<OptionStockee>;
  readonly segments: readonly string[]; // volet segments de la garde ; [] pour la banque
}
export interface NumeriqueStockee {
  readonly type: 'numeric';
  readonly id: string;
  readonly concept: ConceptId;
  readonly noteCompte: boolean;
  readonly enonce: string;
  readonly unite: string | null;
  readonly solution: number;
  readonly tolerance: Tolerance;
  readonly formePubliee: string; // '45,5' : cherchée par la garde
  readonly pieges: AuMoinsUn<{
    readonly valeur: number;
    readonly confusion: ConfusionId;
  }>;
}
```

#### 9.3.3 Corrigés

```ts
// domain/cours/Corrige.ts
export interface PiegeNumerique {
  readonly valeur: number;
  readonly confusion: ConfusionId;
}
export type FormeFormule = 'references' | { readonly memeQue: string };

export interface CorrigeFeuille {
  readonly type: 'feuille';
  readonly plan: SheetPlanStocke; // recopié : la correction ne relit pas le cours
  readonly attendus: AuMoinsUn<{
    readonly reference: string; // 'E3'
    readonly formuleReference: string; // '=C3/$C$5' (pupitre seulement)
    readonly valeur: number;
    readonly tolerance: Tolerance;
    readonly forme: FormeFormule;
    readonly confusionSiErreurFormule: ConfusionId | null; // #DIV/0!, #REF!, #VALEUR!, #NOM?
    readonly pieges: readonly PiegeNumerique[];
  }>;
  readonly seuilReussite: number; // 0,8
}
export interface CorrigeTableau {
  readonly type: 'tableau';
  readonly attendus: AuMoinsUn<{
    readonly rang: number;
    readonly cle: string;
    readonly valeur: number;
    readonly pieges: readonly PiegeNumerique[];
  }>;
  readonly tolerance: Tolerance; // absolue 0,01
  readonly seuilReussite: number; // 0,75
}
export interface CorrigeClassement {
  readonly type: 'classement';
  readonly attendus: AuMoinsUn<{
    readonly carteId: string;
    readonly categorieId: string;
    readonly confusionSiErreur: ConfusionId;
    readonly justification: string;
  }>;
  readonly seuilReussite: number; // 0,75
}
export interface CorrigeEnigme {
  readonly type: 'enigme';
  readonly parcoursId: string;
  readonly enigmeId: string;
  readonly rang: number; // 0 = première énigme
  readonly solution:
    | {
        readonly type: 'nombre';
        readonly valeur: number;
        readonly tolerance: Tolerance;
        readonly formePubliee: string;
      }
    | { readonly type: 'texte'; readonly acceptees: AuMoinsUn<string> };
  readonly fragment: string;
  readonly pieges: readonly PiegeNumerique[];
}
export interface CorrigeDefi {
  readonly type: 'defi';
  readonly strategies: AuMoinsUn<{
    readonly id: string;
    readonly libelle: string;
    readonly fausse: boolean;
  }>; // une seule fausse
}
export interface CorrigeRevelation {
  readonly type: 'revelation';
  readonly titre: string;
  readonly lignes: AuMoinsUn<string>;
}
export type CorrigeProduction =
  | CorrigeFeuille
  | CorrigeTableau
  | CorrigeClassement
  | CorrigeEnigme;
```

#### 9.3.4 Barème

```ts
// domain/Bareme.ts
export interface BaremeQuestionV2 {
  readonly id: string;
  readonly type: TypeQuestion;
  readonly concept: ConceptId;
  readonly noteCompte: boolean;
  readonly ecranId: string;
  readonly rangEcran: number;
  readonly tolerance?: Tolerance; // numeric
  readonly ouverture?: 'principale' | 'jumelle'; // fp-vote à pairs
  readonly origine?: 'banque'; // questions de fp-spaced
  readonly parcoursId?: string; // enigme
  readonly rangEnigme?: number; // enigme
}
export interface BaremeV2 {
  readonly version: 2;
  readonly graineReference: number;
  readonly questions: readonly BaremeQuestionV2[];
  readonly solutionsCommunes: Readonly<Record<string, Solution>>; // identiques pour toutes les graines
  readonly tirages: readonly {
    readonly seed: number;
    readonly ecarts: Readonly<Record<string, Solution>>;
  }[]; // 60 graines
  readonly corriges: Readonly<Record<string, CorrigeProduction>>; // productions et énigmes
}
export type Bareme = BaremeV1 | BaremeV2; // BaremeV1 : forme actuelle (version: 1), lue sans changement

export function solutionFor(
  bareme: Bareme,
  seed: number,
  questionId: string,
): Solution | null; // v2 : ecarts[id] ?? solutionsCommunes[id]
export function questionDuBareme(
  bareme: Bareme,
  questionId: string,
  cours: Cours | null,
): BaremeQuestionV2 | null; // v1 : ecranId et rangEcran dérivés du cours
export function questionsNotees(bareme: Bareme): readonly BaremeQuestionV2[];
```

`ouvrirTirages` produit un barème v2 pour toute version de cours ≥ 3 et un barème v1 sinon (les
séances v2 ouvertes gardent leur barème). Taille visée du barème V3 : ≤ 400 Ko.

#### 9.3.5 Tirage et projection publique

```ts
// domain/cours/Tirage.ts
export interface TirageDuCours {
  readonly sujet: CoursPublic;
  readonly solutions: Readonly<Record<string, Solution>>; // votes, numériques et banque
  readonly corriges: Readonly<Record<string, CorrigeTire>>; // votes et numériques (déroulé)
  readonly libellesOptions: LibellesDesOptions; // questionId → identifiant stable → libellé
  readonly banque: Readonly<Record<string, VotePublic>>; // jamais dans `sujet`
}

// domain/cours/CoursPublic.ts
export interface EcranPublic {
  readonly id: string;
  readonly type: string; // brique, 'questionnaire' ou 'ecran-verrouille'
  readonly titre: string | null;
  readonly duree: number;
  readonly interactif: boolean;
  readonly donnees: Readonly<Record<string, unknown>>; // § 9.4 ; {} pour un écran verrouillé
}
export interface CoursPublic {
  readonly id: string;
  readonly titre: string;
  readonly niveau: string;
  readonly duree: number;
  readonly concepts: readonly string[];
  readonly ecrans: readonly EcranPublic[];
}
export interface CoursPublicCatalogue extends CoursPublic {
  readonly version: number;
  readonly publieLe: string; // ISO 8601, date de la bascule de publication
}
```

Règles du générateur : l’ordre de consommation du générateur existant est inchangé ; toute
consommation nouvelle (mélange des cartes de `fp-cardsort`, options de la banque) utilise un
générateur dérivé `creerRng(graine ^ SEL_CARTES)` ou `creerRng(graine ^ SEL_BANQUE)` (constantes
nommées). Les identifiants d’options sont stables ; seul leur ordre dépend de la graine. Aucune graine
n’est exposée au poste.

#### 9.3.6 Déroulé formateur

```ts
// domain/cours/DeroulePresentateur.ts
export interface EcranDeroule extends EcranPublic {
  readonly notes: string;
  readonly diffusion: Diffusion;
  readonly seuil: number | null;
  readonly corriges: readonly CorrigePresentateur[]; // votes et numériques de l'écran
  readonly questions: readonly {
    readonly id: string;
    readonly enonce: string;
    readonly options:
      | readonly { readonly id: string; readonly libelle: string }[]
      | null;
  }[];
  readonly corrigeEcran: CorrigeEcranPresentateur | null;
  readonly guide?: GuideFormateur;
}
export type CorrigeEcranPresentateur =
  | {
      readonly type: 'feuille';
      readonly attendus: readonly {
        readonly reference: string;
        readonly formuleReference: string;
        readonly valeur: number;
        readonly tolerance: Tolerance;
        readonly forme: FormeFormule;
      }[];
      readonly seuilReussite: number;
    }
  | {
      readonly type: 'tableau';
      readonly attendus: readonly {
        readonly rang: number;
        readonly cle: string;
        readonly valeur: number;
      }[];
      readonly tolerance: Tolerance;
      readonly seuilReussite: number;
    }
  | {
      readonly type: 'classement';
      readonly attendus: readonly {
        readonly carteId: string;
        readonly categorieId: string;
        readonly justification: string;
      }[];
      readonly seuilReussite: number;
    }
  | {
      readonly type: 'enigmes';
      readonly enigmes: readonly {
        readonly enigmeId: string;
        readonly solution: string;
        readonly fragment: string;
      }[];
      readonly codeFinal: string;
    }
  | {
      readonly type: 'defi';
      readonly strategies: readonly {
        readonly id: string;
        readonly libelle: string;
        readonly fausse: boolean;
      }[];
    }
  | {
      readonly type: 'revelation';
      readonly titre: string;
      readonly lignes: readonly string[];
    };
export interface DerouleCours extends Omit<CoursPublic, 'ecrans'> {
  readonly ecrans: readonly EcranDeroule[];
  readonly remediations: Readonly<Record<string, string>>;
}
```

#### 9.3.7 Réponses, productions et résultats

```ts
export type ValeurProduction =
  | {
      readonly type: 'feuille';
      readonly cellules: Readonly<Record<string, string>>;
    }
  | {
      readonly type: 'tableau';
      readonly saisies: readonly {
        readonly rang: number;
        readonly cle: string;
        readonly valeur: number;
      }[];
    }
  | {
      readonly type: 'classement';
      readonly classement: Readonly<Record<string, string>>;
    } // carteId → categorieId
  | {
      readonly type: 'feuille' | 'tableau' | 'classement';
      readonly neSaitPas: true;
    };

export type ValeurReponse = AnswerValue | ValeurProduction; // « je ne sais pas » est stocké NE_SAIT_PAS
export interface DetailProduction {
  readonly cle: string; // cellule 'E3', carte, ou '<rang>:<cle>'
  readonly juste: boolean;
  readonly confusion: ConfusionId | null;
}
export interface AnswerRecord {
  id: string;
  sessionId: string;
  participantId: string;
  questionId: string;
  concept: string;
  valeur: ValeurReponse;
  seed: number;
  correcte: boolean;
  misconception: string | null; // confusion la plus fréquente de `details` pour une production
  score: number | null; // productions : justes ÷ attendus
  details: readonly DetailProduction[] | null;
  dureeMs: number;
  soumisLe: Date;
}

// domain/ResultatsSeance.ts
export interface ResultatQuestion {
  readonly questionId: string;
  readonly ecranId: string;
  readonly type: TypeQuestion;
  readonly noteCompte: boolean;
  readonly total: number;
  readonly correctes: number;
  readonly neSaitPas: number;
  readonly confusions: readonly ConfusionComptee[]; // toutes les confusions de `details` comptées
  readonly parOption: Readonly<Record<string, number>> | null; // votes : identifiant stable (et '__je_ne_sais_pas__') → nombre
  readonly scoreMoyen: number | null; // productions
  readonly parCle: Readonly<
    Record<string, { readonly total: number; readonly justes: number }>
  > | null; // cellules, cartes, lignes
}
export interface ResultatsSeance {
  readonly participants: number;
  readonly questions: readonly ResultatQuestion[];
}
export interface ComptesJalon {
  readonly perdu: number;
  readonly 'ca-va': number;
  readonly clair: number;
  readonly total: number;
}
export interface ProgressionEnigme {
  readonly parcoursId: string;
  readonly enigmeId: string;
  readonly ouvertes: number; // participants ayant au moins une tentative
  readonly resolues: number;
  readonly tentativesMoyennes: number;
  readonly epuisees: number;
}
export interface ResumeBareme {
  readonly questionsNotees: number; // 31 pour la V3
  readonly parType: Readonly<
    Record<
      TypeQuestion,
      { readonly notees: number; readonly nonNotees: number }
    >
  >;
}
export interface ResultatsEnDirect extends ResultatsSeance {
  readonly statistiques: StatistiquesSeance; // calculées sur les questions notées seulement
  readonly jalons: Readonly<Record<string, ComptesJalon>>;
  readonly enigmes: readonly ProgressionEnigme[];
  readonly bareme: ResumeBareme;
}
// GetSessionResults
export type ResultatsDeSeance = RapportSession & {
  readonly resultats: ResultatsSeance;
  readonly statistiques: StatistiquesSeance;
  readonly notation: RegleDeNotation;
  readonly bareme: ResumeBareme;
  readonly jalons: Readonly<Record<string, ComptesJalon>>;
  readonly enigmes: readonly ProgressionEnigme[];
};
// RapportQuestion (IFormationMailer.port.ts) gagne `type: TypeQuestion` et `score: number | null` ;
// `reponse` est lisible pour toute question (« Feuille : 14/17 cellules justes », « Classement : 6/8 cartes »).
```

#### 9.3.8 Contrat `notation` final

Le contrat servi aujourd’hui au front (`{ noteMax, base, partCohorteReference, ratioSeuilValidation,
neSaitPasCompteCommeReponse, pointsNonReponse, reponsesLibresNotees, seuilQuestionProbleme,
decimalesStatistiques }`) est conservé champ pour champ et **étendu** de trois champs :

```ts
// domain/RegleDeNotation.ts (back) et core/ports/formations.port.ts `RegleNotation` (front) : même forme
export interface RegleDeNotation {
  readonly noteMax: number; // 20
  readonly base: 'participation-relative-cohorte';
  readonly partCohorteReference: number; // 0.2
  readonly ratioSeuilValidation: number; // 0.4
  readonly neSaitPasCompteCommeReponse: boolean; // true : votes, numériques et productions
  readonly pointsNonReponse: number; // 0
  readonly reponsesLibresNotees: boolean; // false
  readonly seuilQuestionProbleme: number; // 0.7
  readonly decimalesStatistiques: number; // 2
  readonly typesNotables: readonly TypeQuestion[]; // ['vote', 'numeric', 'classement', 'feuille', 'tableau']
  readonly productionCompteSi: 'au-moins-une-saisie';
  readonly statistiquesSurQuestionsNotees: boolean; // true
}
```

Les résultats servent aussi `bareme: ResumeBareme` (le dénominateur, 31). Transition : le front est
déployé avant le back ; son adaptateur HTTP complète un `notation` sans les trois nouveaux champs avec
les valeurs ci-dessus et un `bareme` absent par `null` (phrase de notation sans dénominateur). La
phrase du pupitre devient : « Note /20 de participation relative à la cohorte, sur 31 questions notées
(votes, questions numériques, classements, feuille et tableau) : … ; « je ne sais pas » compte comme
une réponse, y compris pour une production ; une production vide n’est pas acceptée ; énigmes et
rappels ne comptent pas ; … ».

#### 9.3.9 Pilotage, état en direct et état du participant

```ts
// domain/ISessionStateCache.port.ts
export type VotePhase = 'vote' | 'discussion' | 'revote' | 'revele';
export interface PilotageEcran {
  readonly phase?: VotePhase; // fp-vote à question jumelle
  readonly revele?: boolean; // fp-challenge : drapeau `fausse` servi aux postes
  readonly etayage?: number; // fp-worked : étapes montrées, de 0 au nombre d'étapes
}
export interface LiveSessionState {
  etat: SessionState;
  modeRythme: PacingMode;
  ecranCourant: number;
  intervalleLibre: FreeRange | null;
  participants: number;
  majLe: Date;
  revision: number; // incrémentée à chaque écriture de pilotage, persistée
  pilotage: Readonly<Record<string, PilotageEcran>>; // clé : screenId
}
// fingerprint(state) = etat | modeRythme | ecranCourant | intervalle | participants | revision

// application/ControlSession.useCase.ts
export interface ControlSessionChanges {
  ecran?: number;
  mode?: PacingMode;
  intervalle?: FreeRange | null;
  pilotage?: { readonly screenId: string } & PilotageEcran;
}
// Validation : écran du cours ; phase seulement sur un fp-vote à jumelle ; revele seulement sur un
// fp-challenge ; etayage seulement sur un fp-worked, entier de 0 au nombre d'étapes ; phases et
// révélation monotones (vote < discussion < revote < revele ; false → true), sinon 409 PHASE_NON_MONOTONE.

// application/LireEtatParticipant.useCase.ts — GET sessions/:id/moi
export interface EtatParticipant {
  readonly sessionId: string;
  readonly participantId: string;
  readonly revision: number;
  readonly reponses: readonly {
    readonly questionId: string;
    readonly valeur: ValeurReponse;
    readonly correcte: boolean;
    readonly score: number | null;
    readonly details:
      | readonly {
          readonly cle: string;
          readonly juste: boolean;
          readonly libelleConfusion: string | null;
        }[]
      | null;
    readonly libelleConfusion: string | null;
  }[];
  readonly reponsesLibres: readonly {
    readonly activityId: string;
    readonly response: string;
  }[];
  readonly jalons: readonly {
    readonly sondageId: string;
    readonly etat: EtatPulse;
  }[];
  readonly enigmes: readonly {
    readonly parcoursId: string;
    readonly resolues: readonly {
      readonly enigmeId: string;
      readonly fragment: string;
    }[];
    readonly tentativesRestantes: Readonly<Record<string, number>>;
  }[];
  readonly defis: readonly {
    readonly defiId: string;
    readonly premiereTentative: string;
  }[];
  readonly rappels: { readonly questionIds: readonly string[] };
}
```

Règles de phase appliquées par `SubmitAnswer` : question `principale` acceptée si la phase de son écran
est absente ou vaut `vote` ; question `jumelle` acceptée si la phase vaut `revote` ou `revele` ;
sinon 409 `PHASE_FERMEE`. En rythme libre, sans commande du formateur, la phase est absente : seule la
principale est ouverte.

### 9.4 Données publiques par brique

| Brique                   | `donnees` servies (sujet et catalogue)                                                               | Propriétés posées sur l’élément                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `fp-story`               | `{ recit: StoryRecit }` ; un écran v2 garde `recit.presentation` (rendu Angular)                     | `recit`                                                          |
| `fp-pro`                 | `{ cas: { id, metier, situation, geste, consequence, metadonnees } }`                                | `cas`                                                            |
| `fp-worked`              | `{ exemple: WorkedExemple, etayage: number }`                                                        | `exemple`, `etayage`                                             |
| `fp-concept4`, `fp-plot` | `{ definition }` (expressions en chaînes, `bornesOrdonnee`, `description`)                           | `definition`                                                     |
| `fp-challenge`           | `{ probleme: { id, enonce, invite, strategies: [], metadonnees } }`                                  | `probleme`                                                       |
| `fp-cardsort`            | `{ plan: CardsortPlanPublic }`                                                                       | `plan`                                                           |
| `fp-sheet`               | `{ plan: SheetPlanPublic }`                                                                          | `plan`                                                           |
| `fp-table-build`         | `{ plan: TableBuildPlanPublic }`                                                                     | `plan`                                                           |
| `fp-escape`              | `{ parcours: EscapeParcoursPublic }`                                                                 | `parcours`                                                       |
| `fp-pulse`               | `{ sondage: PulseSondage }`                                                                          | `sondage`                                                        |
| `fp-spaced`              | `{ rappel: { id, intitule, metadonnees } }`                                                          | `rappel` (questions par `retours`)                               |
| `fp-numeric`             | `{ question: NumeriquePublic }`                                                                      | `question`                                                       |
| `fp-vote`                | `{ question: VotePublic, questionJumelle?: VotePublic }`                                             | `question`, `questionJumelle`                                    |
| `fp-recall`              | `{ question: VotePublic & { metadonnees }, delaiMs: number }`                                        | `question`, `delaiMs`                                            |
| `fp-exit`                | `{ billet: ExitBilletPublic }`                                                                       | `billet`                                                         |
| `questionnaire`          | `{ intitule, consigne, regime, ordre, questions: { brique: 'fp-numeric' \| 'fp-vote', donnees }[] }` | une brique par question ; intitulé et consigne rendus par l’hôte |
| `ecran-verrouille`       | `{}` (le titre est dans `EcranPublic.titre`)                                                         | aucune (message de l’hôte)                                       |

```ts
// Formes publiques (front : src/cours/runtime/blocks, back : projection de Tirage)
interface OptionPublique {
  readonly id: string;
  readonly libelle: string;
} // id stable
interface VotePublic {
  readonly id: string;
  readonly enonce: string;
  readonly options: readonly OptionPublique[];
}
interface SheetPlanPublic {
  readonly id: string;
  readonly intitule: string;
  readonly lignes: number;
  readonly colonnes: number;
  readonly cellules: Readonly<Record<string, string>>;
  readonly verrouillees: readonly string[];
  readonly consignes: readonly string[];
  readonly metadonnees: MetadonneesBrique;
}
interface CardsortPlanPublic {
  readonly id: string;
  readonly intitule: string;
  readonly cartes: readonly OptionPublique[]; // ordre mélangé par le serveur
  readonly categories: readonly OptionPublique[];
  readonly dureeJeuMs?: number;
  readonly metadonnees: MetadonneesBrique;
}
interface TableColonneServie {
  readonly cle: string; // [a-z][A-Za-z]*
  readonly intitule: string;
  readonly role: 'donnee' | 'saisie' | 'deduite';
  readonly decimales: number; // arrondi d'affichage
  readonly valeurs?: readonly number[]; // role 'donnee'
  readonly formule?: string; // role 'deduite', syntaxe de evaluerExpression
  readonly formuleInitiale?: string; // rang 0
  readonly soldeDe?: string; // colonne dont la dernière valeur est affichée comme solde (autres cours)
  readonly totalise: boolean;
}
interface TableBuildPlanPublic {
  readonly id: string;
  readonly intitule: string;
  readonly consignes: readonly string[];
  readonly echeances: number;
  readonly libellesLignes: readonly string[]; // longueur = echeances
  readonly parametres: Readonly<Record<string, number>>;
  readonly colonnes: readonly TableColonneServie[];
  readonly synthese: readonly {
    readonly libelle: string;
    readonly formule: string;
    readonly unite: string | null;
    readonly decimales: number;
  }[];
  readonly metadonnees: MetadonneesBrique;
}
interface EscapeParcoursPublic {
  readonly id: string;
  readonly intitule: string;
  readonly delaiIndiceMs: number;
  readonly budgetEnigmeMs: number; // repère affiché, jamais bloquant
  readonly tentativesMax: number;
  readonly enigmes: readonly {
    readonly id: string;
    readonly intitule: string;
    readonly enonce: string;
    readonly indice: string;
  }[];
  readonly metadonnees: MetadonneesBrique;
}
interface PulseSondage {
  readonly id: string;
  readonly invite: string;
  readonly metadonnees: MetadonneesBrique;
}
interface SpacedQuestionPublique {
  readonly questionId: string;
  readonly concept: string;
  readonly boite: 1 | 2 | 3;
  readonly cours: string; // « B2-01 · Traitement de l’information chiffrée »
  readonly enonce: string;
  readonly options: readonly OptionPublique[];
}
interface StoryRecit {
  readonly id: string;
  readonly titre: string;
  readonly paragraphes: readonly string[];
  readonly visuel?: {
    readonly src: string;
    readonly alt: string;
    readonly legende?: string;
    readonly source?: string;
  };
  readonly video?: {
    readonly src: string; // projection (720p)
    readonly srcPoste?: string; // postes étudiants (480p)
    readonly type: 'video/webm' | 'video/mp4';
    readonly titre: string;
    readonly poster?: string;
    readonly transcript: string;
    readonly source: string;
    readonly licence: string;
    readonly sousTitres?: {
      readonly src: string;
      readonly srclang: string;
      readonly libelle: string;
    };
    readonly preload?: 'none' | 'metadata';
  };
  readonly metadonnees: MetadonneesBrique;
}
```

### 9.5 Routes HTTP

Accès : **P** = participant (en-tête `x-participant-token`, routes du contrôleur étudiant, `@Public`
côté rôles) ; **F** = formateur propriétaire de la séance ; **A** = administrateur ; **Pub** = public.
Toute écriture **P** vérifie dans l’ordre : jeton, séance ouverte (`SEANCE_NON_DEMARREE`,
`SEANCE_TERMINEE`), écran servi (`ECRAN_NON_SERVI`), puis ses règles propres.

| Méthode et chemin                                  | Accès  | Limite (par minute) | Corps                                                                                                           | Réponse                                                                                                    | Erreurs propres                                                                                                   |
| -------------------------------------------------- | ------ | ------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `POST sessions/:code/join` (existant)              | Pub    | 120 par code        | inchangé                                                                                                        | 201 inchangé                                                                                               | 409 `SEANCE_COMPLETE`                                                                                             |
| `GET sessions/:id/sujet` (existant)                | P      | 20                  | —                                                                                                               | 200 `CoursPublic` (écrans avec `titre`)                                                                    | 409 `COURS_MODIFIE`                                                                                               |
| `POST sessions/:id/answers` (existant)             | P      | 60                  | `{ questionId, valeur: number \| string, dureeMs }`                                                             | 201 `{ correcte, misconception, libelleConfusion }`                                                        | 400 `TYPE_DE_QUESTION` (production ou énigme) ; 409 `ECRAN_NON_SERVI`, `PHASE_FERMEE`, `REPONSE_DEJA_ENREGISTREE` |
| `POST sessions/:id/free-responses` (existant)      | P      | 60                  | `{ screenId, activityId, response, dureeMs }`                                                                   | 201 `{ status: 'enregistre' }`                                                                             | 400 `ACTIVITE_INCONNUE`, texte vide ; 409 `ECRAN_NON_SERVI`                                                       |
| `POST sessions/:id/productions`                    | P      | 60                  | `{ questionId, valeur: ValeurProduction, dureeMs }`                                                             | 201 `{ correcte, score, details: { cle, juste, libelleConfusion }[], libelleConfusion }`                   | 400 `TYPE_DE_QUESTION`, `PRODUCTION_VIDE`, `PRODUCTION_INVALIDE` ; 409 `REPONSE_DEJA_ENREGISTREE`                 |
| `POST sessions/:id/escape/:parcoursId/tentatives`  | P      | 20                  | `{ enigmeId, reponse (1 à 40 caractères), dureeMs }`                                                            | 201 `{ correcte, fragment: string \| null, tentativesRestantes }`                                          | 409 `ENIGME_VERROUILLEE`, `ENIGME_DEJA_RESOLUE`, `TENTATIVES_EPUISEES`                                            |
| `PUT sessions/:id/pulses/:sondageId`               | P      | 30                  | `{ etat: 'perdu' \| 'ca-va' \| 'clair' }`                                                                       | 204                                                                                                        | 400 sondage inconnu                                                                                               |
| `GET sessions/:id/rappels`                         | P      | 30                  | —                                                                                                               | 200 `{ questions: SpacedQuestionPublique[] }` (liste figée)                                                | 409 `ECRAN_NON_SERVI`                                                                                             |
| `POST sessions/:id/defis/:defiId/tentative`        | P      | 20                  | `{ texte (1 à 2 000 caractères), dureeMs }`                                                                     | 201 `{ strategies: { id, libelle }[] }`                                                                    | 400 `ACTIVITE_INCONNUE`                                                                                           |
| `GET sessions/:id/defis/:defiId/strategies`        | P      | 30                  | —                                                                                                               | 200 `{ strategies: { id, libelle, fausse?: boolean }[] }` (`fausse` présent seulement après la révélation) | 404 `DEFI_SANS_TENTATIVE`                                                                                         |
| `GET sessions/:id/moi`                             | P      | 30                  | —                                                                                                               | 200 `EtatParticipant`                                                                                      | —                                                                                                                 |
| SSE `sessions/:id/stream` (existant)               | P      | 30 ouvertures       | —                                                                                                               | flux § 9.6                                                                                                 | 429                                                                                                               |
| `POST sessions` (existant)                         | F      | défaut              | `{ courseSlug, version?: number, capacite?: number }` (`version` réservé à A ; `capacite` de 1 à 60, défaut 40) | 201 `{ sessionId, code }`                                                                                  | 403 `version` sans rôle A ; 404 cours ; 409 tirages insuffisants                                                  |
| `PATCH sessions/:id/control` (existant)            | F      | 240                 | `{ ecran?, mode?, intervalle?, pilotage?: { screenId, phase?, revele?, etayage? } }` (au moins un champ)        | 204                                                                                                        | 400 validation ; 409 `PHASE_NON_MONOTONE`, `SEANCE_TERMINEE`                                                      |
| `GET sessions/:id/deroule` (existant)              | F ou A | défaut              | —                                                                                                               | 200 `DerouleCours` (§ 9.3.6)                                                                               | —                                                                                                                 |
| `GET sessions/:id/results`, `…/report` (existants) | F ou A | défaut              | —                                                                                                               | 200 `ResultatsDeSeance` (§ 9.3.7)                                                                          | —                                                                                                                 |
| SSE `sessions/:id/presenter-stream` (existant)     | F      | défaut              | —                                                                                                               | flux § 9.6 avec `resultats`                                                                                | 429                                                                                                               |
| `GET sessions/:id/rappels/synthese`                | F ou A | 60                  | —                                                                                                               | 200 `{ concepts: { concept, libelle, boite1, boite2, boite3, nonVus }[] }`                                 | —                                                                                                                 |
| `DELETE sessions/:id/participants/:participantId`  | F      | 60                  | —                                                                                                               | 204                                                                                                        | 404 participant                                                                                                   |
| `GET catalogue/:slug` (existant)                   | Pub    | 60 par adresse      | —                                                                                                               | 200 `CoursPublicCatalogue` (écrans `seance` verrouillés)                                                   | 404                                                                                                               |
| `PUT catalogue/:slug/publication`                  | A      | 10                  | `{ version: number }`                                                                                           | 200 `{ slug, versionPubliee, publieeLe }`                                                                  | 404 version inconnue ; 409 `VERSION_NON_PUBLIABLE`                                                                |

### 9.6 Flux SSE

Événements du flux étudiant (`stream`) et du flux formateur (`presenter-stream`) :

| Événement   | Flux                | Données                                                                                                              | Émission                                                                                                                 |
| ----------- | ------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `etat`      | les deux            | `{ etat, modeRythme, ecranCourant, intervalleLibre, participants, revision, pilotage, majLe }` (`majLe` en ISO 8601) | à l’ouverture, puis à chaque changement d’empreinte (`revision` comprise)                                                |
| `resultats` | formateur seulement | `ResultatsEnDirect` (§ 9.3.7)                                                                                        | au plus une fois par seconde et par séance, calcul partagé entre les flux du formateur, seulement si l’activité a changé |
| `heartbeat` | les deux            | `{ ts }`                                                                                                             | toutes les 15 s                                                                                                          |
| `fin`       | les deux            | `{ raison: 'cloturee' \| 'introuvable' \| 'expiree' }`                                                               | une fois, puis fermeture                                                                                                 |

Le pilotage est persisté en base (`formation_sessions.pilotage_ecrans`, `revision`) : après un
redémarrage de l’API, le premier `etat` le restitue. Le cache d’état reste un cache de processus :
l’API tourne en **une seule instance** (documenté, B30) ; les plafonds de flux (100 flux étudiants par
séance, 2 par participant, 4 pour le formateur) sont partagés par Redis quand il est disponible, et
tenus par le processus en mode dégradé (H6).

### 9.7 Contrat de l’hôte (front)

```ts
// src/app/shared/slides/session/contrat-hote.ts
export type EtatPulse = 'perdu' | 'ca-va' | 'clair';

export type EvenementBrique =
  | {
      readonly kind: 'reponse';
      readonly screenId: string;
      readonly questionId: string;
      readonly valeur: number | string;
      readonly dureeMs: number;
    }
  | {
      readonly kind: 'production';
      readonly screenId: string;
      readonly questionId: string;
      readonly valeur: ValeurProduction;
      readonly dureeMs: number;
    }
  | {
      readonly kind: 'tentative';
      readonly screenId: string;
      readonly parcoursId: string;
      readonly enigmeId: string;
      readonly reponse: string;
      readonly dureeMs: number;
    }
  | {
      readonly kind: 'libre';
      readonly screenId: string;
      readonly activityId: string;
      readonly response: string;
      readonly dureeMs: number;
    }
  | {
      readonly kind: 'defi';
      readonly screenId: string;
      readonly defiId: string;
      readonly texte: string;
      readonly dureeMs: number;
    }
  | {
      readonly kind: 'jalon';
      readonly screenId: string;
      readonly sondageId: string;
      readonly etat: EtatPulse;
    };

export type RetourBrique =
  | {
      readonly kind: 'verdict-reponse';
      readonly questionId: string;
      readonly correcte: boolean;
      readonly libelleConfusion: string | null;
    }
  | {
      readonly kind: 'verdict-production';
      readonly questionId: string;
      readonly correcte: boolean;
      readonly score: number;
      readonly details: readonly {
        readonly cle: string;
        readonly juste: boolean;
        readonly libelleConfusion: string | null;
      }[];
    }
  | {
      readonly kind: 'tentative';
      readonly parcoursId: string;
      readonly enigmeId: string;
      readonly correcte: boolean;
      readonly fragment: string | null;
      readonly tentativesRestantes: number;
    }
  | {
      readonly kind: 'progression-enigmes';
      readonly parcoursId: string;
      readonly resolues: readonly {
        readonly enigmeId: string;
        readonly fragment: string;
      }[];
      readonly tentativesRestantes: Readonly<Record<string, number>>;
    }
  | {
      readonly kind: 'strategies';
      readonly defiId: string;
      readonly strategies: readonly {
        readonly id: string;
        readonly libelle: string;
        readonly fausse?: boolean;
      }[];
    }
  | {
      readonly kind: 'rappels';
      readonly questions: readonly SpacedQuestionPublique[];
    }
  | { readonly kind: 'deja-repondu'; readonly questionId: string }
  | {
      readonly kind: 'refus';
      readonly motif: MotifRefusReponse;
      readonly message: string;
    };

export interface DirectEcran {
  readonly pilotage: PilotageEcran;
  readonly resultats: readonly ResultatQuestion[] | null; // board et stage ; null côté étudiant
  readonly comptesJalon: ComptesJalon | null; // board ; stage seulement si total ≥ 5
}

// SlideActivityComponent (forme finale)
//   readonly slide = input.required<EcranContent>();
//   readonly render = input<RenderMode>('hand');
//   readonly role = input<Role>('etudiant');
//   readonly sessionId = input<string | null>(null);   // réflexions v2
//   readonly jeton = input<string>('');                // réflexions v2
//   readonly retours = input<ReadonlyMap<string, readonly RetourBrique[]>>(new Map()); // clé : screenId
//   readonly direct = input<DirectEcran | null>(null);
//   readonly corrige = input<CorrigeEcranPresentateur | null>(null); // board seulement
//   readonly apercu = input(false);                   // page publique : aucun envoi
//   readonly evenement = output<EvenementBrique>();   // remplace `reponse` (les quiz v2 émettent kind 'reponse')
```

Correspondance des événements DOM des briques (`CustomEvent`, `bubbles: true`) :

| Événement émis par la brique                                       | Détail                                                                                             | Devient                                                                                      |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `fp-numeric-submit`, `fp-vote-submit`                              | `{ questionId, valeur, dureeMs }`                                                                  | `reponse`                                                                                    |
| `fp-recall-submit`                                                 | `{ questionId, valeur, rappel, dureeMs }`                                                          | `reponse` ; plus `libre` (`<questionId>:rappel`) si le rappel n’est pas vide                 |
| `fp-exit-submit`                                                   | `{ billetId, valeur, texteLibre, dureeMs }`                                                        | `reponse` (`questionId = billetId`) ; plus `libre` (`<billetId>`) si le texte n’est pas vide |
| `fp-spaced-reponse`                                                | `{ questionId, optionId, dureeMs }`                                                                | `reponse` (`valeur = optionId`)                                                              |
| `fp-cardsort-submit`, `fp-sheet-submit`, `fp-table-build-submit`   | `{ planId, classement \| cellules \| saisies, dureeMs }` ou `{ planId, neSaitPas: true, dureeMs }` | `production` (`questionId = planId`)                                                         |
| `fp-escape-tentative` (nouveau ; `fp-escape-resolue` est supprimé) | `{ parcoursId, enigmeId, reponse, dureeMs }`                                                       | `tentative`                                                                                  |
| `fp-pulse-change`                                                  | `{ sondageId, etat, dureeMs }`                                                                     | `jalon`                                                                                      |
| `fp-challenge-submit`                                              | `{ problemeId, tentative, dureeMs }`                                                               | `defi` (`defiId = problemeId`, `texte = tentative`)                                          |
| `fp-worked-submit`                                                 | `{ exempleId, redactions, explications, dureeMs, … }`                                              | un `libre` par rédaction et par explication non vides                                        |
| `fp-vote-phase`                                                    | —                                                                                                  | **supprimé** : le setter `phase` n’émet plus rien                                            |

Réinjection (jamais par remontage, clé de montage `${slide.id}|${render}|${role}|${apercu}`) : le
verdict d’une réponse → propriété `verdict` de la brique de la question ; le verdict d’une production →
`verdict` de `fp-sheet`, `fp-table-build`, `fp-cardsort` ; `tentative` et `progression-enigmes` →
`verdict` et `progression` de `fp-escape` ; `strategies` → `strategies` de `fp-challenge` ; `rappels` →
`questions` de `fp-spaced` ; `deja-repondu` → `dejaRepondu = true` et message visible ; `refus` →
`erreur`. `direct.pilotage` → `phase` de `fp-vote`, `etayage` de `fp-worked`, `revele` de
`fp-challenge` ; `direct.resultats` → `resultats` de `fp-vote` (`{ total, parOption }`) ;
`direct.comptesJalon` → `comptes` de `fp-pulse` ; `corrige` → `corrige` des briques de production et
solutionnaire de `fp-escape` (rendu `board` seulement). La page étudiante porte les appels au port ;
elle charge `GET …/rappels` quand l’écran courant est un `fp-spaced`, et `GET …/moi` au rattachement,
à la reprise et sur tout 409 `REPONSE_DEJA_ENREGISTREE`.

### 9.8 Port front

```ts
// src/app/core/ports/formations.port.ts — ajouts et modifications
export interface CommandePilotage {
  ecran?: number;
  mode?: PacingMode;
  intervalle?: FreeRange;
  pilotage?: { screenId: string } & PilotageEcran;
}
export interface VerdictProduction {
  correcte: boolean;
  score: number;
  details: readonly {
    cle: string;
    juste: boolean;
    libelleConfusion: string | null;
  }[];
  libelleConfusion: string | null;
}
export interface VerdictTentative {
  correcte: boolean;
  fragment: string | null;
  tentativesRestantes: number;
}
export interface StrategiePublique {
  id: string;
  libelle: string;
  fausse?: boolean;
}
export interface SyntheseConcept {
  concept: string;
  libelle: string;
  boite1: number;
  boite2: number;
  boite3: number;
  nonVus: number;
}
export type MotifRefusReponse =
  | 'reseau'
  | 'deja-repondue'
  | 'seance-non-demarree'
  | 'seance-terminee'
  | 'ecran-non-servi'
  | 'phase-fermee'
  | 'enigme-verrouillee'
  | 'tentatives-epuisees'
  | 'production-vide'
  | 'evince'
  | 'refusee';

export interface FormationsPort {
  // … méthodes existantes inchangées, sauf :
  ouvrirSeance(
    courseSlug: string,
    options?: { version?: number; capacite?: number },
  ): Observable<SeanceOuverte>;
  piloter(sessionId: string, commande: CommandePilotage): Observable<void>;
  // nouvelles méthodes
  envoyerProduction(
    sessionId: string,
    jeton: string,
    production: {
      questionId: string;
      valeur: ValeurProduction;
      dureeMs: number;
    },
  ): Observable<VerdictProduction>;
  tenterEnigme(
    sessionId: string,
    jeton: string,
    parcoursId: string,
    tentative: { enigmeId: string; reponse: string; dureeMs: number },
  ): Observable<VerdictTentative>;
  declarerJalon(
    sessionId: string,
    jeton: string,
    sondageId: string,
    etat: EtatPulse,
  ): Observable<void>;
  lireRappels(
    sessionId: string,
    jeton: string,
  ): Observable<{ questions: readonly SpacedQuestionPublique[] }>;
  envoyerDefi(
    sessionId: string,
    jeton: string,
    defiId: string,
    tentative: { texte: string; dureeMs: number },
  ): Observable<{ strategies: readonly StrategiePublique[] }>;
  lireStrategies(
    sessionId: string,
    jeton: string,
    defiId: string,
  ): Observable<{ strategies: readonly StrategiePublique[] }>;
  lireMonEtat(sessionId: string, jeton: string): Observable<EtatParticipant>;
  lireSyntheseRappels(
    sessionId: string,
  ): Observable<{ concepts: readonly SyntheseConcept[] }>;
  evincerParticipant(
    sessionId: string,
    participantId: string,
  ): Observable<void>;
}
```

Les types miroirs du front (`EtatSession`, `ResultatsSeance`, `ResultatQuestion`, `DerouleCours`,
`EcranDeroule`, `EcranContent.titre?`, `RegleNotation`, `EtatParticipant`, `ValeurProduction`) ont
exactement la forme des § 9.3 et § 9.6 ; la fabrique `createFormationsPortStub` implémente toutes les
méthodes. Les gardes du flux (`estEtatSession`, `estResultatQuestion`) acceptent l’absence des
nouveaux champs (déploiement du front avant le back).

### 9.9 Moteur de formules et vecteurs partagés

```ts
// back : domain/cours/Formule.ts (source canonique) ; front : src/cours/runtime/core/formula.ts
export type CodeErreur = '#REF!' | '#DIV/0!' | '#NOM?' | '#VALEUR!';
export interface ResultatFormule {
  readonly valeur: number | null;
  readonly erreur: CodeErreur | null;
}
export interface Feuille {
  readonly lignes: number;
  readonly colonnes: number;
  readonly cellules: Readonly<Record<string, string>>;
}
export interface OptionsEvaluation {
  readonly budgetNoeuds: number;
} // défaut 20 000
export const LONGUEUR_MAX_FORMULE = 200;
export const PROFONDEUR_MAX = 64;
export function evaluerFeuille(
  feuille: Feuille,
  options?: OptionsEvaluation,
): ReadonlyMap<string, ResultatFormule>;
export function evaluerCellule(
  feuille: Feuille,
  nom: string,
  options?: OptionsEvaluation,
): ResultatFormule;
export function evaluerExpression(
  expression: string,
  variables: Readonly<Record<string, number>>,
  options?: OptionsEvaluation,
): ResultatFormule;
export function formeR1C1(formule: string, cellule: string): string | null; // null si non analysable
```

- **Complexité bornée** : une évaluation mémoïse chaque cellule (`Map<nom, ResultatFormule>`) et garde
  l’AST de chaque cellule en cache ; un compteur de nœuds partagé par l’évaluation arrête le calcul au
  budget (`#VALEUR!`) ; formule de plus de 200 caractères ou imbrication de plus de 64 niveaux →
  `#VALEUR!` ; cycle → `#REF!`. Aucun `eval` ni `new Function` (règles ESLint `no-eval`,
  `no-new-func`).
- **Compatibilité tableur** (figée par les vecteurs) : `^` associatif à gauche (`2^3^2` = 64) ;
  `ARRONDI` arrondit la moitié en s’éloignant de zéro (`ARRONDI(-2,5;0)` = −3) ; `SOMME` ignore les
  cellules de texte d’une plage et renvoie `#VALEUR!` pour un texte passé en argument direct ; `SI`
  accepte 2 ou 3 arguments (0 si faux et absent) ; fonctions : `SOMME`, `MOYENNE`, `ARRONDI`,
  `PUISSANCE`, `SI` ; opérateurs `+ - * / ^`, comparaisons, références `$`, virgule décimale,
  séparateur `;`. `evaluerExpression` arrondit son résultat au millionième.
- **R1C1** : référence relative → `R[Δligne]C[Δcolonne]` (`R` ou `C` seul si le décalage est nul) ;
  absolue → `R<ligne>C<colonne>` ; mixte en conséquence ; noms de fonctions et séparateurs conservés.
- **Vecteurs** : `formule.vecteurs.json` = `{ version, sha256, vecteurs: { id, type: 'feuille' |
'expression' | 'r1c1', entree, attendu }[] }`, où `sha256` est l’empreinte du tableau `vecteurs`
  sérialisé de façon canonique (clés triées). Source : le back ; copie dans le front. Chaque dépôt
  exécute les vecteurs et vérifie l’empreinte ; `scripts/verifier-parite-formules.mjs` (CI des deux
  dépôts) compare l’empreinte locale à celle de la branche principale de l’autre dépôt (`gh api`).
  Couverture minimale : erreurs (`#REF!`, `#DIV/0!`, `#NOM?`, `#VALEUR!`), `$`, plages inversées et
  hors grille, cycles, budgets (chaîne de 26 doublements, 26 `SOMME` croisées, cycle de 26 maillons),
  décimales françaises, `ARRONDI` à mi-chemin, associativité de `^`, `SOMME` sur du texte, arrondi de
  `evaluerExpression`, formes R1C1, les 17 cellules de A4-02 et les trois constats d’exécution du
  § 5.6.

### 9.10 Persistance (entités d’abord, migrations générées)

| Table                                      | Changement                                                                                                                                                                                                                           | Contraintes                                                                                                                                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `formation_screen_contents`                | colonnes `titre varchar(120) NULL`, `diffusion varchar(10) NOT NULL DEFAULT 'catalogue'`                                                                                                                                             | `CHECK (diffusion IN ('catalogue','seance'))` ; l’ajout de colonnes ne déclenche pas le déclencheur d’immutabilité (qui porte sur `UPDATE` et `DELETE`)                                                                          |
| `formation_course_contents`                | colonnes `remediations jsonb NOT NULL DEFAULT '{}'`, `medias jsonb NOT NULL DEFAULT '[]'`                                                                                                                                            | idem                                                                                                                                                                                                                             |
| `formation_course_publications` (nouvelle) | `slug varchar(120) PK`, `version_publiee int NOT NULL`, `publiee_le timestamptz NOT NULL DEFAULT now()`, `publiee_par uuid NULL`                                                                                                     | FK `(slug, version_publiee)` → `formation_course_contents (slug, version)` ; amorçage : chaque slug existant publié à sa plus haute version (B2 → 2)                                                                             |
| `formation_sessions`                       | colonnes `pilotage_ecrans jsonb NOT NULL DEFAULT '{}'`, `revision int NOT NULL DEFAULT 0`, `capacite smallint NOT NULL DEFAULT 40`                                                                                                   | `CHECK (capacite BETWEEN 1 AND 60)` ; `revision` incrémentée par `UPDATE … SET revision = revision + 1 RETURNING`                                                                                                                |
| `formation_participants`                   | colonne `evince_le timestamptz NULL`                                                                                                                                                                                                 | les graines des évincés sont libres pour `pickFreeSeed`                                                                                                                                                                          |
| `formation_answers`                        | colonnes `score real NULL`, `details jsonb NULL`                                                                                                                                                                                     | unique `(participant_id, question_id)` existant (une production par question)                                                                                                                                                    |
| `formation_free_responses`                 | colonnes `premiere_reponse text NULL`, `strategies_servies_le timestamptz NULL`                                                                                                                                                      | la première tentative d’un défi n’est jamais réécrite                                                                                                                                                                            |
| `formation_escape_progress` (nouvelle)     | `session_id`, `participant_id`, `parcours_id varchar(60)`, `enigme_id varchar(60)`, `tentatives int NOT NULL DEFAULT 0`, `resolue_le timestamptz NULL`                                                                               | PK `(participant_id, enigme_id)` ; `CHECK (tentatives BETWEEN 0 AND 10)` ; FK `ON DELETE CASCADE` ; incrément `UPDATE … SET tentatives = tentatives + 1 WHERE … AND tentatives < 10 AND resolue_le IS NULL RETURNING tentatives` |
| `formation_escape_attempts` (nouvelle)     | `id uuid`, `session_id`, `participant_id`, `enigme_id`, `valeur_normalisee numeric NULL`, `saisie varchar(40)`, `correcte boolean`, `soumis_le timestamptz`                                                                          | index `(participant_id, enigme_id)` ; FK `ON DELETE CASCADE` ; sert à ne pas recompter une saisie équivalente                                                                                                                    |
| `formation_pulses` (nouvelle)              | `session_id`, `cle_participant char(64)` (HMAC-SHA-256 de `sessionId:participantId`, secret `FORMATIONS_PULSE_SECRET` de 32 octets au moins, validé au démarrage), `sondage_id varchar(60)`, `etat varchar(8)`, `maj_le timestamptz` | unique `(session_id, cle_participant, sondage_id)` ; `CHECK (etat IN ('perdu','ca-va','clair'))` ; FK séance `ON DELETE CASCADE`                                                                                                 |
| `formation_rappels_servis` (nouvelle)      | `session_id`, `participant_id`, `question_id varchar(60)`, `rang smallint`, `servi_le timestamptz`                                                                                                                                   | PK `(participant_id, question_id)` ; FK `ON DELETE CASCADE`                                                                                                                                                                      |

---

## 10. Plan de lots, scénario de bout en bout et QA navigateur

### 10.1 Plan de lots

Principe : **figer les contrats d’abord** (lot 0), puis back et front en parallèle contre ces contrats
(bouchons de port côté front, fichier de données V3 côté back). Les médias partent dès le début
(dépendance la plus longue). Chaque lot suit la TDD du dépôt (factories partagées obligatoires) et sa
Definition of Done (lint, format, typecheck, tests, build, gardes). Aucune route n’est fusionnée sans
sa garde « écran servi » et sa limitation de débit ; aucune évolution de `tirer` sans les tests dorés
v1/v2 ; aucune entité sans migration générée.

| Lot                                       | Contenu                                                                                                                                                                                                                                                                                                                | Dépend de                            | En parallèle avec | Entrées (contrats)                                                    | Tests de sortie                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Risque                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **0 — Contrats**                          | types des § 9.3, § 9.4, § 9.7, § 9.8 écrits dans les deux dépôts ; DTO et schémas OpenAPI des routes du § 9.5 (sans route active) ; format signé des vecteurs ; `createFormationsPortStub` complet ; types du flux (F20)                                                                                               | —                                    | 5, 7              | ce document                                                           | compilation des deux dépôts ; instantané OpenAPI ; spec de contrat par dépôt qui consomme chaque type (`satisfies`) ; bouchon conforme au port                                                                                                                                                                                                                                                                                                                                                                                                                                     | faible (mais conditionne tout)                      |
| **1 — Domaine et stockage (back)**        | tests dorés v1/v2 **avant tout changement** (R17) ; B16, B3, B2, B4 (avec Tirage, Déroulé, Rapport), B1 avec diffusion et titre, B14, B15 (garde à trois volets), B17, B19 (lecture), B22, B29 ; barème v2 ; fichier de données V3 complet ; instantané JSON du sujet et du déroulé V3 (avec empreinte) livré au front | 0                                    | 2a, 3, 5, 7       | § 3, § 5, § 6.4, § 9.2 à § 9.4, § 9.10 (colonnes d’écran et de cours) | schéma strict par brique (clefs imbriquées inconnues refusées) ; zod des corrigés ; `tirer(V3)` sur 61 graines sans ambiguïté ; banque projetée en privé ; `deroulePresentateur(V3)` expose 31 + 4 + 13 questions ; `verifierStructure(V3) === []` ; AC-01 à AC-10, AC-12, AC-14 ; test de lecture de toutes les versions publiées ; `schema-entites-migrations.db-integration.spec.ts` vert                                                                                                                                                                                       | **élevé** (séances v2 ouvertes)                     |
| **2a — Moteur de formules**               | B6 durci (budget, mémoïsation, R1C1, compatibilité tableur), vecteurs canoniques signés, script de parité                                                                                                                                                                                                              | 0                                    | 1, 3              | § 9.9                                                                 | vecteurs (back) ; adverses < 50 ms ; AC-11 ; `no-eval`, `no-new-func` ; empreinte des vecteurs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | moyen à élevé                                       |
| **2b — Routes, persistance, flux (back)** | B5, B7, B8, B9, B10, B11, B12, B20, B21, B23, B24, B25 (et H1 côté back), B26, B28, B30, H6 ; entités d’abord, migrations générées                                                                                                                                                                                     | 1, 2a                                | 3                 | § 9.5, § 9.6, § 9.9, § 9.10                                           | unitaires par cas d’usage ; HTTP : matrice d’accès de chaque route (participant, participant d’une autre séance, formateur propriétaire, autre formateur, administrateur), codes 400/401/403/404/409/429, OpenAPI à jour (`openapi-contract.e2e.spec.ts`) ; base : concurrence (20 tentatives → 10 ; deux productions → une ; première tentative doublée → une réponse), cascade à la suppression d’une séance, pilotage restitué après recréation du module ; charge (AC-34) ; répétition V3 à 30 étudiants sur la base migrée ; AC-13, AC-15 à AC-17, AC-19, AC-36, AC-37, AC-39 | **élevé** (sécurité, concurrence, flux)             |
| **3 — Front**                             | F1 à F14, F17 à F21, F23, H2 ; intégration réelle après 2b                                                                                                                                                                                                                                                             | 0 (bouchons) ; 2b pour l’intégration | 1, 2a, 2b         | § 9.4, § 9.7, § 9.8, annexe D                                         | Jasmine : chaque brique en `hand`, `board`, `stage` ; aucune donnée secrète en `hand` ; réinjection sans remontage (saisie conservée) ; hôte : chaque événement → un appel au port ; brouillons et reprise ; parité des vecteurs (front) ; AC-24 (52 écrans depuis l’instantané), AC-25, AC-27, AC-28, AC-29, AC-31 à AC-33, AC-38                                                                                                                                                                                                                                                 | moyen à élevé (perte de saisie, rendu serveur)      |
| **4 — Rendus v2**                         | F13 (graduations, `axisRanges`, barres proportionnelles, étiquettes directes, marqueurs, contrastes, « Voir les données »)                                                                                                                                                                                             | 0                                    | tous              | § 4.2 (rendus v2), § 5.7                                              | rendu et instantanés visuels Playwright ; AC-26, AC-29, AC-30                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | faible                                              |
| **5 — Médias**                            | capsule (annexe A), dérivés WebP versionnés, entrées du catalogue des médias                                                                                                                                                                                                                                           | —                                    | tous              | annexe A, § 8.2                                                       | AC-20 à AC-23 ; manifeste de production archivé                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | moyen (production)                                  |
| **6 — Publication**                       | migration `InsertB2CoursV3` (non publiée) ; banc E2E réel (F22) ; QA en préproduction (§ 10.2, § 10.3) ; bascule par l’administrateur ; vérification en production ; rebascule répétée                                                                                                                                 | 1 à 5, 7                             | —                 | B18, B25                                                              | migration montée puis descendue (`down` refusé si une séance référence la v3 **ou si la v3 est la version publiée**) ; bascule aller-retour ; moitié serveur du scénario du § 10.2 rejouée par `test/formations-e2e-seance-v3.db-integration.spec.ts` ; scénario du § 10.2 complet en préproduction ; QA du § 10.3 signée                                                                                                                                                                                                                                                          | **élevé**, ramené à moyen par la bascule réversible |
| **7 — Annexes**                           | H1 (côté front : `lastmod`), H3, H4, H5                                                                                                                                                                                                                                                                                | H1 : 2b déployé                      | tous              | § 4.6                                                                 | tests listés au § 4.6 ; extraction XLF sans différence non traduite                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | faible                                              |

Ordre critique : **0 → (1 ∥ 2a) → 2b → intégration 3 → 6**, avec 3 (sur bouchons), 4, 5 et 7 menés en
parallèle dès la fin du lot 0. Déploiement : le front (lots 3, 4, 7) et le back (lots 1, 2a, 2b) se
déploient indépendamment, chacun compatible avec la v2 servie ; la migration du lot 6 insère la V3
sans la publier ; l’administrateur ouvre une séance de préproduction en V3 (`version: 3`) pour la QA ;
la bascule n’a lieu qu’après le déploiement des **deux** dépôts et la QA signée ; en cas d’incident,
la rebascule vers la v2 est immédiate et ne supprime aucun contenu.

### 10.2 Scénario de bout en bout sur la V3 migrée (Playwright, banc réel)

**Banc** (`e2e-seance`, F22) : `globalSetup` démarre PostgreSQL 16 et Redis
(`portfolio-2025-back/test/db-integration.compose.yaml`, service Redis ajouté), applique toutes les
migrations jusqu’à `InsertB2CoursV3`, crée un compte formateur, un second formateur et un
administrateur (identifiants dans l’environnement, jamais dans le dépôt), démarre l’API (`pnpm start`)
avec un mailer de test qui capture les messages, construit et démarre le front en rendu serveur.
Horloge des navigateurs pilotée (`page.clock`) pour les délais de 45 s, 60 s et 30 min.

Acteurs : **F** formateur propriétaire ; **F2** autre formateur ; **A** administrateur ; **E1**
étudiant qui répond juste ; **E2** étudiant qui tombe dans les pièges ; **E3** étudiant qui répond
« je ne sais pas » ou reste hors ligne ; **E4** étudiant arrivé en retard ; **X** script d’abus.

**Découpage livré.** La moitié serveur de ce scénario — HTTP, SSE et PostgreSQL réels, sans
navigateur — est rejouée par `test/formations-e2e-seance-v3.db-integration.spec.ts`, porte
`pnpm run test:integration:db:local` : publication et rebascule (points 1 et 25), capacité et
éviction (point 3), garde d’écran servi (point 4), les seize briques du cours (points 5 à 20),
rythme libre (point 11), groupes et annotations (point 21), flux `resultats` et cloisonnement du
flux étudiant (point 22), clôture et rapport (points 23 et 24), purge des tables du module
(point 26, moitié base). Restent au banc Playwright (F22) : tout ce qui suppose un navigateur —
page publique rendue côté serveur (point 2), rendus `hand`, `board` et `stage`, horloge pilotée,
coupure réseau, brouillons et clés locales, capsule et sous-titres, impression de la fiche mémo,
axe-core et consoles.

1. **Publication réversible** : F ouvre S2 → v2 (la V3 est insérée, non publiée) ; le catalogue sert
   la v2 ; F demande `version: 3` → 403 ; A ouvre une séance de contrôle en V3 → 201 ; A bascule la
   publication (`PUT catalogue/…/publication`, `{ version: 3 }`) → le catalogue sert la V3 avec
   `version` et `publieLe`, 13 écrans en clair et 39 verrouillés, sans aucune clef interdite
   (parcours récursif, AC-13) ; S2 sert toujours la v2 (sujet 200). F ouvre S3 (V3, capacité 4) :
   toute la suite se joue sur S3.
2. **Page publique** : `/formations/b2-01-traitement-information-chiffree` rendue côté serveur
   contient les 52 titres ; A2-02 se manipule en aperçu ; aucune requête vers `/formations/sessions`
   (AC-28) ; en locale anglaise, les libellés des briques sont traduits (H2) ; le sitemap porte
   `lastmod` ≥ `publieLe` (H1).
3. **Accès et capacité** : code erroné → refus, balayage protégé ; E1, E2, E3 rejoignent (graines
   distinctes) ; X s’inscrit (4e place), puis une seconde identité de X → 409 `SEANCE_COMPLETE` ; F
   évince X → 204, le jeton de X → 404 `PARTICIPANT_INTROUVABLE`, la place est libérée ; F2 pilote S3 → 403 ;
   A lit les résultats → 200, pilote → 403.
4. **Démarrage et écran servi** : réponse avant `start` → 409 `SEANCE_NON_DEMARREE` ; `start` ; rythme
   piloté ; chaque poste suit l’`etat` du flux ; E2, par script, écrit sur des écrans non servis
   (réponse, production, tentative, jalon, rappels, réponse libre, défi) → 409 `ECRAN_NON_SERVI`
   partout (AC-19).
5. **A1-01 `fp-recall`** : options indisponibles 45 s ; E1 « +25 % », E2 « +20 % » (confusion
   `base-arrivee` au pupitre), E3 « je ne sais pas » ; l’histogramme `parOption` compte chaque option
   par son identifiant stable, identique pour les trois graines ; rappel libre enregistré
   (`b2-01-a1-diagnostic:rappel`), rappel vide non envoyé.
6. **Exposition** (A1-02 à A1-04, A1-06, A1-07, A1-09) : rendus v2 ; attribution de M1 visible
   (AC-21) ; `notes` absentes des postes et de la projection (AC-18).
7. **A1-05 `fp-cardsort`** : E1 8/8, E2 5/8 (trois confusions comptées, taux d’erreur par carte au
   pupitre), E3 « je ne sais pas » (compté) ; E1 renvoie → 409 → le poste lit `moi`, restaure le
   verdict et affiche « déjà répondu » (AC-33).
8. **Réflexions A1-08 et A3-09** : réseau coupé 30 s pendant A3-09 → mise en file, envoi au retour,
   aucune perte ; le pupitre liste les réponses libres.
9. **Défi A1-10** : aucune stratégie avant la tentative ; après l’envoi, stratégies sans `fausse` ; E1
   modifie sa tentative → le pupitre affiche la première ; F déclenche la révélation → `GET
strategies` renvoie `fausse` ; la projection ne signale la piste fausse qu’après la révélation.
10. **Jalons A1-11 à A5-09** : E1 « c’est clair », E2 « perdu », E3 change deux fois ; agrégats du
    pupitre égaux aux derniers états ; aucune route ne rend l’état d’un autre participant (AC-17) ;
    comptes masqués en projection sous 5 réponses.
11. **Rythme libre** : F ouvre l’intervalle A2-01 → A2-08 ; les postes naviguent dans l’intervalle, pas
    au-delà (écran verrouillé, écriture → 409) ; retour au rythme piloté.
12. **Questionnaires A2-03, A3-07, A4-03, A5-06** : titre et consigne affichés ; ordre des questions
    identique pour toutes les graines (`fixe`), options mélangées ; saisies numériques avec virgule ;
    régime `focus` → incidents remontés quand l’onglet est quitté ; `parOption` cohérent entre graines.
13. **Exploration et exemples travaillés** (A2-02, A3-02, A5-04 ; A2-06, A3-04, A3-06, A5-03) :
    manipulation sans requête ; F baisse l’étayage de A3-06 → postes mis à jour sans perte de saisie ;
    une réponse libre par étape rédigée.
14. **Votes à pairs A3-01 et A5-02** : `vote` (jumelle → 409 `PHASE_FERMEE`) → `discussion` (principale
    → 409) → `revote` (jumelle seule) → `revele` (bonne option et révélation projetées, jamais avant) ;
    F tente de revenir à `vote` → 409 `PHASE_NON_MONOTONE` ; E4 rejoint en `revele` : principale
    refusée, jumelle acceptée ; redémarrage de l’API → la phase revient avec le premier `etat`.
15. **Capsule A4-01** : lecture ; sous-titres activés par défaut ; transcription dépliable ; variante
    480p sur les postes, 720p en projection ; aucun préchargement avant lecture.
16. **Feuille A4-02** : E1 17/17 ; E2 recopie `=C2/C5` (E3, E4, E5 et B7 à revoir,
    `reference-relative-non-figee`) ; E3 tape des résultats (`valeur-saisie-sans-formule`) ; E4 écrit
    E3 à la main `=C3/C5` (`formule-non-recopiable`) ; rechargement pendant la saisie → brouillon
    restauré ; envoi vide → 400 `PRODUCTION_VIDE` ; « je ne sais pas » compté ; X envoie une feuille
    adverse (chaîne de doublements) → verdict en moins d’une seconde, flux des autres postes non
    interrompus.
17. **Tableau A4-05** : colonnes déduites en direct ; pièges additifs reconnus ; synthèse 4 contre
    3,50 ; verdict par ligne.
18. **Coffre A6-02** : indice après 60 s ; E2 propose 26,7 (confusion enregistrée à la première
    tentative seulement) ; rechargement après deux énigmes → progression et deux fragments restitués ;
    « −2,8 » (U+2212) et « −2,8 pts » acceptés ; une saisie équivalente répétée ne consomme rien ;
    énigme 4 avant la 3 → 409 `ENIGME_VERROUILLEE` ; dix tentatives puis 409 `TENTATIVES_EPUISEES`, y
    compris en 20 requêtes parallèles (exactement 10 comptées), et l’énigme suivante s’ouvre sans
    fragment ; progression au pupitre ; solutionnaire au pupitre seulement (AC-25).
19. **Rappels A6-05** : chaque poste reçoit R10, R11 et un ou deux rappels ; E2 (faux aux questions 2 et
    3 de l’atelier 2 depuis plus de 30 min, horloge avancée) reçoit `b2-01-r-indice` ; même liste après
    rechargement ; réponse à une question de la banque non servie → 409 `ECRAN_NON_SERVI` ; carte de
    maîtrise par concept au pupitre.
20. **Fiche mémo A6-06** : le bouton d’impression produit un aperçu qui contient les 11 cartes, recto
    et verso.
21. **Groupes et annotations** : F crée deux groupes, affecte E1 à E3, annote A4-02 par groupe ; après
    rechargement, le pupitre retrouve le déroulé, le flux, le pilotage et les annotations.
22. **Flux** : coupure du flux étudiant → reconnexion ; un troisième flux d’un même participant ferme
    le plus ancien ; `resultats` au plus une fois par seconde ; aucun `resultats` sur un flux étudiant ;
    Redis arrêté → nouveaux flux ouverts en mode dégradé et journal `error` ; Redis relancé → plafonds
    partagés rétablis (H6, AC-39).
23. **Billet A6-08** : choix noté et texte libre ; « N billets reçus / M participants » au pupitre ;
    clôture.
24. **Clôture et rapport** : événement `fin` sur tous les flux ; toute écriture ensuite → 409
    `SEANCE_TERMINEE` ; rapport : 31 questions notées, complétion et note selon la règle, scores des
    productions lisibles, agrégat des 5 jalons, progression des énigmes, `notation` et `bareme`
    présents ; lignes `formation_scores` écrites ; mails capturés (synthèse formateur et copies
    étudiantes) sans « [object Object] ».
25. **Rebascule** : A publie de nouveau la v2 → le catalogue sert la v2 ; S3 (V3, close) reste
    lisible ; une nouvelle séance s’ouvre en v2 ; A republie la V3.
26. **Nettoyage vérifié** : cache d’état vidé (`activite` = 0) ; clés locales `fp.<S3>.*` purgées sur
    chaque poste ; suppression de S3 → 0 ligne restante dans `formation_answers`,
    `formation_escape_progress`, `formation_escape_attempts`, `formation_pulses`,
    `formation_rappels_servis`, `formation_free_responses`, annotations, groupes, participants et
    scores ; S2 intacte ; console sans erreur ; axe-core : 0 violation `serious` ou `critical` sur
    A1-04, A2-03, A4-02, A5-04, A6-02 et sur la page publique.

### 10.3 QA navigateur réelle (préproduction, avant la bascule)

Le scénario automatisé ne remplace pas une séance jouée dans de vrais navigateurs, sur de vrais
écrans. Protocole :

- **Matériel** : un poste formateur (Chrome) relié à un vidéoprojecteur en 1 280 × 720 et à un écran
  1 920 × 1 080 ; trois postes étudiants (Chrome, Firefox et Safari sur macOS) ; un poste sur Wi-Fi
  bridé (profil « Fast 3G ») ; un lecteur d’écran (NVDA avec Firefox, VoiceOver avec Safari).
- **Parcours** : les 52 écrans en rythme piloté, chaque activité jouée sur chaque poste (une bonne
  réponse, un piège, un « je ne sais pas ») ; un passage en rythme libre ; une coupure réseau ; un
  rechargement pendant la feuille et pendant le coffre ; deux onglets sur un même poste ; fermeture et
  réouverture du navigateur ; clôture.
- **Contrôles** : lisibilité de la projection à 3 m (taille des textes, contrastes) ; plein écran ;
  zoom à 200 % sur les postes ; navigation au clavier seul (tri de cartes, feuille, votes, coffre) ;
  lecteur d’écran sur un graphique (description et tableau de données), sur la vidéo (sous-titres,
  transcription) et sur le coffre ; préférence « réduire les animations » respectée ; sous-titres
  lisibles (au plus 15 caractères par seconde) ; aucune erreur dans les consoles.
- **Mesure** : chaque acte est chronométré ; les écarts avec le § 2.1 sont consignés au rapport ; une
  modification de durée passe par une révision de ce document, jamais par une retouche du fichier de
  données seul.
- **Livrable** : rapport de QA signé (navigateurs et versions, captures des 52 écrans en `hand`,
  `board` et `stage`, défauts ouverts et leur correction), archivé avec les preuves du lot 6 ; la
  bascule n’a lieu qu’avec un rapport sans défaut bloquant.

---

## Annexe A — Dossier de production de la capsule « Une formule qui se recopie, un tableau qui se contrôle »

La capsule est **produite par nous** : une page HTML/SVG animée, rendue image par image, narrée par
Piper, encodée en WebM. Le tableau démontré (ventes trimestrielles de sacs) est **différent** de la
tâche notée A4-02, pour que la tâche reste un transfert. Tout ce qu’il faut pour la refaire est dans
cette annexe ; les versions exactes des outils et les empreintes des fichiers sont consignées dans
le manifeste de production (A.1, étape 10).

### A.1 Chaîne de production reproductible

Outillage installé **hors des dépôts**, dans un répertoire de production dédié (par exemple
`~/production/capsule-b2-01/`) muni de son propre `package.json` : `ffmpeg-static` (binaire FFmpeg),
`playwright` (Chromium sans interface) ; Piper (exécutable de la version publiée par le projet) et le
modèle `fr_FR-siwis-medium` (`fr_FR-siwis-medium.onnx` et `fr_FR-siwis-medium.onnx.json`, téléchargés
depuis `rhasspy/piper-voices`, chemin `fr/fr_FR/siwis/medium/`). Aucune voix système (`say`) n’est
utilisée à aucune étape.

1. **Vérifier l’outillage** : `FFMPEG=$(node -p "require('ffmpeg-static')")` ; `"$FFMPEG" -hide_banner
-encoders` doit lister `libvpx-vp9` et `libopus`, sinon arrêt ; empreinte SHA-256 du modèle
   Piper notée.
2. **Page** `capsule.html` (1 280 × 720, sans aucune ressource réseau) : elle expose
   `window.__seek(t)`, qui met la scène dans l’**état exact** du temps `t` (en secondes) à partir de
   `timeline.json` ; aucune animation CSS ni `requestAnimationFrame` libre. Polices embarquées :
   Atkinson Hyperlegible (textes) et JetBrains Mono (formules), sous SIL OFL 1.1.
3. **Voix, un fichier par plan** (texte « Voix » du § A.4, un fichier `voix/Pnn.txt` par plan) :
   `piper --model fr_FR-siwis-medium.onnx --length_scale 1.15 --output_file audio/P02.wav < voix/P02.txt`.
   Relire chaque piste ; corriger une prononciation par la ponctuation du texte « Voix », jamais par
   une autre voix.
4. **Mesure** : durée de chaque piste lue par `"$FFMPEG" -i audio/P02.wav -f null -` (ligne
   `Duration`). Durée d’un plan = 0,4 s d’attaque + durée de la voix + pause visuelle de 1,5 à 3 s (P11 :
   6 s, sans voix). `timeline.json` : début de chaque plan = fin du précédent. Cible : 150 s ± 5 s ; on
   ajuste les pauses, jamais le texte.
5. **Piste audio** : placer chaque piste à son début
   (`"$FFMPEG" -i audio/P02.wav -af "adelay=400:all=1,apad=whole_dur=<durée du plan>" -ar 48000 -ac 1 p02.wav`),
   concaténer (`"$FFMPEG" -f concat -safe 0 -i liste.txt -c pcm_s16le narration.wav`), puis normaliser
   en **deux passes** `loudnorm` : mesure (`-af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -`),
   puis application avec les valeurs mesurées (`measured_I`, `measured_TP`, `measured_LRA`,
   `measured_thresh`, `offset`, `linear=true`) vers `narration-norm.wav` en 48 kHz. Pas de musique.
6. **Images** (script `rendre.mjs`, Chromium sans interface, fenêtre 1 280 × 720,
   `deviceScaleFactor` 1) : pour `f` de 0 à `round(total × 30) − 1`, `await page.evaluate(t =>
window.__seek(t), f / 30)`, puis capture `images/<f sur 5 chiffres>.png`.
7. **Encodage** :
   - projection : `"$FFMPEG" -framerate 30 -i images/%05d.png -i narration-norm.wav -c:v libvpx-vp9 -b:v 0 -crf 33 -row-mt 1 -pix_fmt yuv420p -c:a libopus -b:a 96k -shortest capsule-formule-recopiable-720p.webm` (≤ 25 Mo) ;
   - postes : `"$FFMPEG" -i capsule-formule-recopiable-720p.webm -vf scale=854:480 -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -pix_fmt yuv420p -c:a copy capsule-formule-recopiable-480p.webm` (≤ 8 Mo).
8. **Affiche** : `"$FFMPEG" -ss <fin de P09 − 0,5> -i capsule-formule-recopiable-720p.webm -frames:v 1 -q:v 3 capsule-formule-recopiable.jpg` (les deux contrôles à 1).
9. **Sous-titres** : générer `capsule-formule-recopiable.fr.vtt` depuis `timeline.json` et les
   répliques du § A.5 : chaque réplique occupe, dans la fenêtre voix de son plan, une durée
   proportionnelle à son nombre de caractères ; au plus 2 lignes de 42 caractères ; au plus
   15 caractères par seconde (12 en moyenne) ; une réplique trop dense est prolongée sur la pause qui
   suit.
10. **Manifeste** `capsule-formule-recopiable.manifest.json`, versionné avec les médias dans
    `portfolio-2025-front/src/assets/cours/b2-01/v3/` : versions de Piper, du modèle (empreinte), de
    FFmpeg, de Chromium et de Playwright ; durée de chaque plan et durée totale ; intensité intégrée et
    crête mesurées ; poids et empreinte SHA-256 de chaque fichier produit.
11. **Recette** (AC-22, AC-23) : durée de 145 à 155 s ; `"$FFMPEG" -i capsule-formule-recopiable-720p.webm
-af ebur128 -f null -` donne −16 LUFS ± 1 et une crête ≤ −1,5 dBTP ; poids respectés ; la piste
    WebVTT est lue et activée par défaut ; chaque valeur prononcée est visible à l’écran au même
    moment ; carton de crédits présent ; aucune réplique au-delà de 15 caractères par seconde.

### A.2 Charte visuelle de la page

| Élément               | Spécification                                                                                                                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fond                  | `#FBF7EF` (crème)                                                                                                                                                                                                                                                             |
| Texte                 | `#1F2A30` (contraste 13,72:1)                                                                                                                                                                                                                                                 |
| Accent                | `#0F6E6E` (5,65:1)                                                                                                                                                                                                                                                            |
| Référence « arrivée » | bordure 3 px et fond à 10 % en `#1F5FBF` (5,70:1), avec l’étiquette « arrivée »                                                                                                                                                                                               |
| Référence « départ »  | bordure 3 px et fond à 10 % en `#B4400B` (5,34:1), avec l’étiquette « départ »                                                                                                                                                                                                |
| Erreur                | `#B3261E` (6,12:1), avec icône et mot « erreur » : jamais la couleur seule                                                                                                                                                                                                    |
| Contrôle réussi       | `#1E6B3A` (6,10:1), avec la mention « OK »                                                                                                                                                                                                                                    |
| Mise en page          | à gauche, la grille A à E, lignes 1 à 9 (x 40–780, y 110–600) ; à droite, le panneau d’explication (x 810–1 240) ; en haut, la barre de formule (y 40–95, police mono 28 px, préfixée du nom de la cellule) ; en bas, 90 px **laissés vides** pour les sous-titres du lecteur |
| Grille                | cellules de 150 × 48 px, texte à 22 px ; nombres alignés à droite, séparateur de milliers espace, virgule décimale ; parts et évolutions à 4 décimales au plus                                                                                                                |
| Bouton                | « Recopier vers le bas » dessiné sous la grille, identique au libellé de la plateforme (`FpSheet`) ; le clic est matérialisé par un anneau de 300 ms                                                                                                                          |
| Frappe                | 60 ms par caractère ; curseur en flèche, déplacements de 400 ms                                                                                                                                                                                                               |

### A.3 Données du tableau

A1 « Trimestre », B1 « Ventes 2024 (€ HT) », C1 « Ventes 2025 (€ HT) », D1 « Évolution », E1 « Part
2025 » ; A2 à A5 « T1 » à « T4 » ; B2 à B5 : 16 000 ; 40 000 ; 45 000 ; 9 000 ; C2 à C5 : 18 000 ;
42 000 ; 51 000 ; 9 000 ; A6 « Total » ; ligne 7 vide ; D8 « Contrôle 1 (formules) » ; A9 « Compte de
résultat 2025 : ventes de sacs », C9 120 000 (en gris italique, marqué « source externe »), D9
« Contrôle 2 (données) ». Valeurs vérifiées (V53, V54) : totaux 110 000 et 120 000 ; évolutions
0,125 ; 0,05 ; 0,1333 ; 0 ; 0,0909 ; parts 0,15 ; 0,35 ; 0,425 ; 0,075 ; 1.

### A.4 Découpage plan par plan (voix exacte, visuels, minutage cible)

Minutage cible (gabarit) ; la durée définitive sort de l’étape 4 de la chaîne.

| Plan                               | Cible     | Voix (texte exact du fichier `voix/Pnn.txt`)                                                                                                                                                                                     | Visuel                                                                                                                                                                                                                                                                                   |
| ---------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P01 · Titre et tableau             | 0:00–0:13 | « Une formule qui se recopie, un tableau qui se contrôle : quatre gestes de tableur, sur les ventes trimestrielles de sacs étanches, en euros hors taxes. Les données sont fictives. »                                           | de 0 à 6 s, carton titre (« Une formule qui se recopie, un tableau qui se contrôle », sous-titre « B2-01 · 4 gestes de tableur ») ; de 6 à 13 s, fondu vers la grille remplie en A1:C5 et A6 « Total » ; B6, C6, colonnes D et E vides ; étiquette « données fictives » en haut à droite |
| P02 · Geste 1, le total            | 0:13–0:28 | « Premier geste : le total. En C6, on écrit : égal, SOMME, parenthèse, C2 deux-points C5. Le tableur affiche cent vingt mille. En B6, la même formule donne cent dix mille. »                                                    | C6 sélectionnée ; la barre affiche « C6 » puis `=SOMME(C2:C5)` frappé ; C2:C5 surlignée ; C6 affiche 120 000 sur « cent vingt mille » ; puis B6 : `=SOMME(B2:B5)` → 110 000 ; panneau « SOMME(plage) : additionne la plage »                                                             |
| P03 · Geste 2, le taux d’évolution | 0:28–0:46 | « Deuxième geste : le taux d’évolution. En D2 : égal, parenthèse, C2 moins B2, parenthèse fermée, divisé par B2, la valeur de départ. Résultat : zéro virgule cent vingt-cinq, soit douze virgule cinq pour cent. »              | D2 : frappe de `=(C2-B2)/B2` ; C2 marquée « arrivée », B2 « départ » ; au mot « départ », le B2 du dénominateur clignote deux fois ; D2 affiche 0,125 ; panneau « 0,125 × 100 = 12,5 % » et « t = (arrivée − départ) / départ »                                                          |
| P04 · La recopie                   | 0:46–0:59 | « On recopie vers le bas avec le bouton « Recopier vers le bas ». Les références glissent d’une ligne : C2 devient C3, B2 devient B3. C’est ce que l’on veut : chaque ligne compare ses propres valeurs. »                       | quatre clics sur « Recopier vers le bas », à 1,2 s d’intervalle ; D3 à D6 : 0,05 ; 0,1333 ; 0 ; 0,0909 ; panneau : `D2 =(C2-B2)/B2`, `D3 =(C3-B3)/B3`… jusqu’à D6, les chiffres de ligne qui changent en gras                                                                            |
| P05 · Geste 3, la part et l’erreur | 0:59–1:16 | « Troisième geste : la part du total. En E2, on divise C2 par le total, C6. Mais, recopiée telle quelle, la formule divise C3 par C7, une cellule vide : le tableur affiche une erreur de division par zéro. »                   | E2 : `=C2/C6` → 0,15 ; un clic sur « Recopier vers le bas » : la barre affiche `E3 =C3/C7` ; E3 affiche « #DIV/0! » en rouge avec l’icône d’erreur ; C7 encadrée en tirets, marquée « vide » ; panneau « C6 a glissé en C7 »                                                             |
| P06 · Le dollar                    | 1:16–1:30 | « Le total doit rester fixe. On écrit dollar C dollar 6 : le dollar fige la colonne et la ligne. On recopie : les parts s’affichent, et celle du total vaut 1, c’est-à-dire cent pour cent. »                                    | E3 vidée ; retour à E2 ; insertion des deux « $ » en gras, couleur accent : `=C2/$C$6` ; panneau « $C : colonne figée · $6 : ligne figée » ; quatre recopies : E3 0,35 ; E4 0,425 ; E5 0,075 ; E6 1                                                                                      |
| P07 · Geste 4, le contrôle         | 1:30–1:44 | « Quatrième geste : le contrôle. Les quatre parts doivent faire 1. En E8, on écrit : SI l’arrondi de la somme de E2 à E5 est égal à 1, alors 1, sinon 0. Le contrôle affiche 1. »                                                | E8 : frappe de `=SI(ARRONDI(SOMME(E2:E5);6)=1;1;0)` ; cinq accolades s’allument dans l’ordre de la voix : « SOMME(E2:E5) », « ARRONDI(… ; 6) », « = 1 ? », « alors 1 », « sinon 0 » ; E8 affiche 1 sur fond vert, « OK »                                                                 |
| P08 · L’épreuve du contrôle        | 1:44–1:57 | « Mettons-le à l’épreuve : si quelqu’un tape zéro virgule quatre à la place de la formule de E3, la somme ne vaut plus 1 et le contrôle passe à 0. On rétablit la formule : il revient à 1. »                                    | E3 remplacée par la valeur tapée 0,4, badge « valeur tapée, plus de formule » ; E8 passe à 0 (rouge, « À vérifier ») ; panneau « 0,15 + 0,4 + 0,425 + 0,075 = 1,05 » ; puis E3 reçoit de nouveau `=C3/$C$6` → 0,35 et E8 revient à 1 (« OK »)                                            |
| P09 · La source indépendante       | 1:57–2:11 | « Ce contrôle surveille les formules, pas les données. Pour les données, on compare le total à une source indépendante : le compte de résultat indique cent vingt mille euros de ventes de sacs. Le second contrôle affiche 1. » | A9 et C9 apparaissent (120 000, « source externe ») ; E9 : frappe de `=SI(ARRONDI(C6-C9;0)=0;1;0)` → 1 (« OK ») ; panneau : « Contrôle 1 : les formules tiennent » ; « Contrôle 2 : le total concorde avec une source indépendante » ; **affiche** : dernière image du plan              |
| P10 · Récapitulatif                | 2:11–2:24 | « Total, évolution, part figée par le dollar, contrôles : à vous de les appliquer au tableau de bord d’Atelier Rivage. »                                                                                                         | quatre cartes numérotées : « 1 Total : =SOMME(plage) » ; « 2 Évolution : (arrivée − départ) / départ » ; « 3 Part : total figé, $C$6 » ; « 4 Contrôles : formules + source indépendante » ; en bas « À vous : tâche de tableur 1 — Atelier Rivage »                                      |
| P11 · Crédits                      | 2:24–2:30 | (sans voix)                                                                                                                                                                                                                      | carton de crédits du § A.7                                                                                                                                                                                                                                                               |

Le passage « tableau croisé dynamique » de la première version du script est retiré (principe de
cohérence) : le TCD est enseigné en A5-05. L’affirmation fausse « si quelqu’un modifie une ligne, le
contrôle passe à 0 » est remplacée par P08 et P09 : modifier une **donnée** laisse la somme des parts
à 1 ; le contrôle des parts détecte une **formule écrasée**, le contrôle par une source indépendante
détecte une donnée fausse.

### A.5 Sous-titres (gabarit WebVTT)

Fichier `capsule-formule-recopiable.fr.vtt` ; temps cibles, recalés à l’étape 9 sur la durée mesurée
de chaque plan.

```
WEBVTT

NOTE Gabarit B2-01 — minutage cible, recalé sur la durée mesurée de chaque piste Piper

P01-1
00:00:00.400 --> 00:00:04.190
Une formule qui se recopie,
un tableau qui se contrôle :

P01-2
00:00:04.190 --> 00:00:09.740
quatre gestes de tableur, sur les ventes
trimestrielles de sacs étanches, en € HT.

P01-3
00:00:09.740 --> 00:00:11.500
Les données sont fictives.

P02-1
00:00:13.400 --> 00:00:19.602
Premier geste : le total.
En C6, on écrit =SOMME(C2:C5).

P02-2
00:00:19.602 --> 00:00:26.800
Le tableur affiche 120 000.
En B6, la même formule donne 110 000.

P03-1
00:00:28.400 --> 00:00:36.232
Deuxième geste : le taux d’évolution.
En D2 : =(C2-B2)/B2,

P03-2
00:00:36.232 --> 00:00:40.149
B2 étant la valeur de départ.

P03-3
00:00:40.149 --> 00:00:44.200
Résultat : 0,125, soit 12,5 %.

P04-1
00:00:46.400 --> 00:00:50.282
On recopie vers le bas avec
le bouton « Recopier vers le bas ».

P04-2
00:00:50.282 --> 00:00:54.411
Les références glissent d’une ligne :
C2 devient C3, B2 devient B3.

P04-3
00:00:54.411 --> 00:00:57.800
C’est voulu : chaque ligne compare
ses propres valeurs.

P05-1
00:00:59.400 --> 00:01:03.715
Troisième geste : la part du total.
En E2 : =C2/C6.

P05-2
00:01:03.715 --> 00:01:09.723
Mais recopiée telle quelle, la formule
devient =C3/C7, et C7 est vide :

P05-3
00:01:09.723 --> 00:01:14.800
le tableur affiche #DIV/0!,
une erreur de division par zéro.

P06-1
00:01:16.400 --> 00:01:19.895
Le total doit rester fixe :
on écrit =C2/$C$6.

P06-2
00:01:19.895 --> 00:01:22.782
Le dollar fige la colonne et la ligne.

P06-3
00:01:22.782 --> 00:01:28.100
On recopie : les parts s’affichent,
celle du total vaut 1, soit 100 %.

P07-1
00:01:30.400 --> 00:01:36.450
Quatrième geste : le contrôle.
Les quatre parts doivent faire 1.

P07-2
00:01:36.450 --> 00:01:40.420
En E8 :
=SI(ARRONDI(SOMME(E2:E5);6)=1;1;0)

P07-3
00:01:40.420 --> 00:01:42.500
Le contrôle affiche 1.

P08-1
00:01:44.400 --> 00:01:49.151
Mettons-le à l’épreuve : on tape 0,4
à la place de la formule de E3.

P08-2
00:01:49.151 --> 00:01:52.505
La somme ne vaut plus 1 :
le contrôle passe à 0.

P08-3
00:01:52.505 --> 00:01:55.300
On rétablit la formule : il revient à 1.

P09-1
00:01:57.400 --> 00:02:00.484
Ce contrôle surveille les formules,
pas les données.

P09-2
00:02:00.484 --> 00:02:04.340
Pour les données, on compare le total
à une source indépendante :

P09-3
00:02:04.340 --> 00:02:07.780
le compte de résultat indique
120 000 € de ventes de sacs.

P09-4
00:02:07.780 --> 00:02:09.500
Le second contrôle affiche 1.

P10-1
00:02:11.400 --> 00:02:16.394
Total, évolution, part figée ($),
contrôles : à vous de les appliquer

P10-2
00:02:16.394 --> 00:02:19.000
au tableau de bord d’Atelier Rivage.
```

### A.6 Transcription (`video.transcript`, avec descriptions visuelles)

Chaque plan : description visuelle (entre parenthèses ci-dessous), puis le texte « Voix ». La transcription satisfait
le critère 1.2.8 des WCAG et, avec une narration qui décrit ce qui s’affiche, tient lieu
d’audiodescription (critère 1.2.5).

- **P01** — (Carton titre : « Une formule qui se recopie, un tableau qui se contrôle », sous-titre
  « B2-01 · 4 gestes de tableur ». Puis une grille de tableur : trimestres T1 à T4 en lignes, ventes
  2024 et 2025 en euros HT, ligne 6 « Total » ; étiquette « données fictives ».) Une formule qui se
  recopie, un tableau qui se contrôle : quatre gestes de tableur, sur les ventes trimestrielles de sacs
  étanches, en euros hors taxes. Les données sont fictives.
- **P02** — (La cellule C6 reçoit la formule =SOMME(C2:C5) ; la plage C2 à C5 est surlignée ; C6
  affiche 120 000. B6 reçoit =SOMME(B2:B5) et affiche 110 000.) Premier geste : le total. En C6, on
  écrit : égal, SOMME, parenthèse, C2 deux-points C5. Le tableur affiche cent vingt mille. En B6, la
  même formule donne cent dix mille.
- **P03** — (D2 reçoit =(C2-B2)/B2 ; C2 est marquée « arrivée », B2 « départ » ; D2 affiche 0,125 ; le
  panneau indique 0,125 × 100 = 12,5 % et t = (arrivée − départ) / départ.) Deuxième geste : le taux
  d’évolution. En D2 : égal, parenthèse, C2 moins B2, parenthèse fermée, divisé par B2, la valeur de
  départ. Résultat : zéro virgule cent vingt-cinq, soit douze virgule cinq pour cent.
- **P04** — (Quatre clics sur le bouton « Recopier vers le bas » ; D3 à D6 affichent 0,05 ; 0,1333 ;
  0 ; 0,0909 ; le panneau liste les formules recopiées, de =(C3-B3)/B3 à =(C6-B6)/B6.) On recopie vers
  le bas avec le bouton « Recopier vers le bas ». Les références glissent d’une ligne : C2 devient C3,
  B2 devient B3. C’est ce que l’on veut : chaque ligne compare ses propres valeurs.
- **P05** — (E2 contient =C2/C6 et affiche 0,15. Après recopie, E3 contient =C3/C7 et affiche l’erreur
  #DIV/0! ; la cellule C7 est vide.) Troisième geste : la part du total. En E2, on divise C2 par le
  total, C6. Mais, recopiée telle quelle, la formule divise C3 par C7, une cellule vide : le tableur
  affiche une erreur de division par zéro.
- **P06** — (E2 devient =C2/$C$6, les dollars en gras ; après quatre recopies, E3 affiche 0,35, E4
  0,425, E5 0,075 et E6 1.) Le total doit rester fixe. On écrit dollar C dollar 6 : le dollar fige la
  colonne et la ligne. On recopie : les parts s’affichent, et celle du total vaut 1, c’est-à-dire cent
  pour cent.
- **P07** — (E8 reçoit =SI(ARRONDI(SOMME(E2:E5);6)=1;1;0) ; les cinq parties de la formule
  s’allument dans l’ordre ; E8 affiche 1 sur fond vert avec « OK ».) Quatrième geste : le contrôle. Les
  quatre parts doivent faire 1. En E8, on écrit : SI l’arrondi de la somme de E2 à E5 est égal à 1,
  alors 1, sinon 0. Le contrôle affiche 1.
- **P08** — (La formule de E3 est remplacée par la valeur tapée 0,4 ; E8 passe à 0, en rouge, « À
  vérifier » ; le panneau affiche 0,15 + 0,4 + 0,425 + 0,075 = 1,05. Puis E3 retrouve =C3/$C$6 et E8
  revient à 1.) Mettons-le à l’épreuve : si quelqu’un tape zéro virgule quatre à la place de la formule
  de E3, la somme ne vaut plus 1 et le contrôle passe à 0. On rétablit la formule : il revient à 1.
- **P09** — (La ligne 9 apparaît : « Compte de résultat 2025 : ventes de sacs », 120 000, marqué
  « source externe » ; E9 reçoit =SI(ARRONDI(C6-C9;0)=0;1;0) et affiche 1, « OK ».) Ce contrôle
  surveille les formules, pas les données. Pour les données, on compare le total à une source
  indépendante : le compte de résultat indique cent vingt mille euros de ventes de sacs. Le second
  contrôle affiche 1.
- **P10** — (Quatre cartes numérotées : 1, Total : =SOMME(plage) ; 2, Évolution : (arrivée − départ) /
  départ ; 3, Part : total figé, $C$6 ; 4, Contrôles : formules et source indépendante. En bas : « À
  vous : tâche de tableur 1 — Atelier Rivage ».) Total, évolution, part figée par le dollar, contrôles :
  à vous de les appliquer au tableau de bord d’Atelier Rivage.
- **P11** — (Carton de crédits, sans voix : titre, Asili Design 2026, licence CC BY-SA 4.0, voix de
  synthèse Piper fr_FR-siwis-medium, données SIWIS de l’Université d’Édimbourg sous CC BY 4.0, polices
  sous licence OFL, données fictives.)

Dans le champ `video.transcript`, les descriptions visuelles figurent entre crochets et les plans se
suivent en paragraphes séparés, sans les étiquettes P01 à P11.

### A.7 Crédits (carton final P11 et paragraphe de A4-01)

« Une formule qui se recopie, un tableau qui se contrôle · Asili Design, 2026 · Licence CC BY-SA 4.0 ·
Voix de synthèse : Piper, modèle fr_FR-siwis-medium ; données SIWIS, Université d’Édimbourg,
CC BY 4.0 (https://doi.org/10.7488/ds/1705) · Polices Atkinson Hyperlegible et JetBrains Mono (SIL
OFL 1.1) · Données fictives · Transcription et sous-titres disponibles »

### A.8 Modifications induites dans le cours (déjà intégrées)

- A4-01 : paragraphe de crédits (voix Piper et données SIWIS), intention sans le TCD, notes
  « Observé » et « Contrôle » sur les deux contrôles.
- A4-02, consigne 6 : « … ce second contrôle surveille les données ». Le corrigé est inchangé.
- A4-06 : la reprise vise les plans P05 et P06.

---

## Annexe B — Arbitrages rendus et points ouverts

| Question laissée ouverte par la conception à 49 écrans ou par les relectures | Décision                                                                                                                                                        |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format : 52 écrans en une séance (option A) ou 53 en deux séances (option B) | **Option A** : une séance, 210 minutes exactes, 52 écrans (arbitrage de l’utilisateur) ; les votes par les pairs restent à 8 minutes (§ 2.5)                    |
| Production de la capsule                                                     | produite par nous (page animée, capture image par image, WebM VP9/Opus), voix **Piper `fr_FR-siwis-medium`**, −16 LUFS, WebVTT ; voix système macOS exclue      |
| Seuil de 30 minutes des rappels intra-séance                                 | conservé ; la part des étudiants servis en priorité 1 est mesurée à la première séance réelle et consignée au rapport de QA                                     |
| Hébergement des médias                                                       | dérivés optimisés servis localement sous `/assets/cours/b2-01/v3/` ; aucune dépendance à `upload.wikimedia.org`                                                 |
| Nom de l’indicateur                                                          | « taux de marge brute (sur CA HT) », défini comme marge sur coûts directs ÷ CA HT ; « taux de marque » écarté (il suppose des marchandises revendues en l’état) |
| Binômes et notation individuelle                                             | un poste par étudiant pour les activités notées ; en binôme, chacun envoie                                                                                      |
| Code du coffre                                                               | « K7M2Q94X », sans lien avec le récit                                                                                                                           |
| Identifiant des options de vote                                              | identifiant stable `slugOption(libelle)` ; l’histogramme est indexé par cet identifiant                                                                         |

**Points ouverts : aucun.**

---

## Annexe C — Traçabilité des relectures

Disposition de chacun des 94 constats : **intégré** (la correction proposée est appliquée, lieu
indiqué), **adapté** (le problème est traité autrement, la manière est indiquée), **rejeté** (motif
indiqué). Bilan : **84 intégrés, 9 adaptés, 1 rejeté**.

### C.1 Relecture pédagogique et mathématique (51 constats)

| Id     | Sévérité | Constat                                                                        | Disposition | Où et comment                                                                                                                                                                                                             |
| ------ | -------- | ------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MAT-01 | majeur   | A5-03 : 0,345 × 36 vaut 12,42, la somme écrite 25,31                           | intégré     | A5-03 étape 3 (12,42 + 5,60 + 7,28 = 25,30 ; poids exacts 25,304 %) ; V18, V19                                                                                                                                            |
| MAT-02 | mineur   | le piège « moyenne arithmétique » est proche de la solution                    | intégré     | note « Contrôle » de A3-07 ; écart visible en A3-06 (6,37 % contre 6,00 %) et en A6-04 (0,65 point)                                                                                                                       |
| MAT-03 | mineur   | arrondi au centime demandé mais « à supprimer »                                | intégré     | consigne 1 de A4-05 ; § 4.2 `fp-table-build` : saisies arrondies au centime, colonnes déduites arrondies à l’affichage                                                                                                    |
| TER-01 | majeur   | définition fausse du « taux de marge commercial »                              | intégré     | A1-06, cartes « Mesure » et « Un mot, trois taux »                                                                                                                                                                        |
| TER-02 | majeur   | libellés de marge à arrêter partout                                            | intégré     | § 5.1 ; en-têtes F1 et G1 de A4-02 ; libellés imprécis conservés dans les pièces de Samir avec leur justification (A1-05) ; annexe B                                                                                      |
| TER-03 | majeur   | série Insee 001765618 arrêtée ; IPC en base 2025                               | intégré     | A6-07, § 5.5, § 8.1 : série 011814630                                                                                                                                                                                     |
| TER-04 | mineur   | « l’indice officiel peut différer au centième »                                | intégré     | source de G3 (A3-08) : indice officiel rebasé 116,04 en 2025 ; affirmation supprimée ; § 5.5                                                                                                                              |
| TER-05 | mineur   | comparer la toile au glissement annuel de l’IPC                                | adapté      | § 5.3 et note « Contrôle » de A4-05 (et non de A3-09, pour ne pas citer +3,50 % avant la tâche qui le fait calculer)                                                                                                      |
| PRG-01 | mineur   | U3, arrêté de 2013, compétence « mettre en œuvre une stratégie »               | intégré     | § 1.1                                                                                                                                                                                                                     |
| PRG-02 | majeur   | tableau croisé dynamique et champ calculé absents                              | intégré     | A5-05 (N3), atelier 4 Q5, devoir déposé (§ 5.2), O8, A6-07                                                                                                                                                                |
| PRG-03 | majeur   | indice base 100 et taux moyen évalués sans enseignement                        | intégré     | A3-06 (N1) avant l’atelier 2 ; remédiations `taux-moyen-arithmetique`, `indice-lu-comme-taux`, `indice-lu-comme-valeur` vers A3-06                                                                                        |
| PRG-04 | mineur   | calcul des propositions en contexte ; `ET`, `OU`, `NON`                        | adapté      | étape 6 `logique` de A5-03 intégrée ; `ET`, `OU`, `NON` non ajoutés au moteur : aucune formule du cours n’en a besoin                                                                                                     |
| PRG-05 | mineur   | taux mensuel équivalent absent                                                 | intégré     | rappel R12 `b2-01-r-taux-mensuel` (V81)                                                                                                                                                                                   |
| PRG-06 | majeur   | proposer deux séances (horaire, charge, espacement)                            | **rejeté**  | arbitrage de l’utilisateur : une séance de 210 min (option A). Atténuations : § 1.3 (demi-journée banalisée), pause de 15 min, jalons, espacement intra-séance ≥ 30 min, concepts en boîte 1 repris en ouverture de B2-02 |
| COU-01 | majeur   | « 49 écrans » a servi à valider des pertes                                     | intégré     | § 2.5 réécrit ; 52 écrans (option A) ; inventaire § 3.9                                                                                                                                                                   |
| COU-02 | majeur   | TVA et TTC → HT jamais enseignés                                               | intégré     | A3-04 étape 6, R13, E4 ; remédiations TVA vers A3-04                                                                                                                                                                      |
| COU-03 | majeur   | compensation et multiple de 9 conditionnels ; E4 donne la réponse              | intégré     | E4 réécrit (rapprochement ligne à ligne) ; carte `compensation` en A5-07 ; A6-01 enseigne à tous le « pourquoi 9 » (paragraphe public, plus seulement une note) ; R10 et R11 servis à tous                                |
| COU-04 | majeur   | boîte à outils du tableur réduite à des liens                                  | adapté      | A6-07 en rendu `grid` de 13 cartes (et non `guide`, qui n’accepte pas de liens) : données propres, TCD, SOMME.SI.ENS, RECHERCHEX, SIERREUR, ARRONDI, Power Query, sources                                                 |
| COU-05 | majeur   | aucune synthèse côté étudiant                                                  | intégré     | A6-06 (N4), fiche mémo imprimable                                                                                                                                                                                         |
| COU-06 | mineur   | « désinflation » disparue                                                      | intégré     | lecture de G3 (A3-08), corrigé de A3-09, libellé de `rythme-confondu-avec-niveau`                                                                                                                                         |
| COU-07 | mineur   | pertes secondaires                                                             | intégré     | A2-02 (curseur `maximum`), A2-07 (carte `perimetre`), A5-08 (sixième phrase), A6-08 (alerte), A5-02 (grille du débat dans la révélation projetée), A6-07 (UNESCO)                                                         |
| HIS-01 | mineur   | Playfair « invente » trop absolu ; renvoi de A1-02 incohérent                  | intégré     | A2-01 (Priestley 1765, 43 courbes et un graphique en barres), notes de A1-02 et A2-01                                                                                                                                     |
| HIS-02 | mineur   | Nightingale : « chaque secteur a une source » inexact                          | intégré     | A5-01 (paragraphe et texte alternatif)                                                                                                                                                                                    |
| HIS-03 | mineur   | Pacioli présenté comme inventeur                                               | intégré     | A6-01 (paragraphe, texte alternatif, attribution)                                                                                                                                                                         |
| HIS-04 | mineur   | `Luca_Pacioli.jpg` n’est pas un portrait                                       | intégré     | § 8.2, médias retirés                                                                                                                                                                                                     |
| HIS-05 | mineur   | fondement juridique de M4                                                      | intégré     | § 8.2 (PD-Art, directive (UE) 2019/790, article 14)                                                                                                                                                                       |
| CON-01 | majeur   | A4-03 et G4 désamorcent le vote A5-02                                          | intégré     | A4-03 et A4-04 sur la saisonnalité 2025 ; répartition annuelle en A5-03 seulement                                                                                                                                         |
| CON-02 | majeur   | E4 et A6-01 donnent les réponses de R11 et R10 ; garde aveugle aux paraphrases | adapté      | E4 réécrit ; volet segments de la garde (§ 6.4) pour les votes notés ; les rappels, questions de récupération, gardent le volet exact : leur statut de rappel après enseignement est acté (option offerte par le constat) |
| CON-03 | majeur   | la bonne option est la plus longue et la seule nuancée                         | intégré     | § 5.10 : A6-08, A2-03 Q3, A5-06 Q3 et Q4, A5-02 v1 réécrits ; options équilibrées aussi pour A4-03, A2-03 Q6 et la banque                                                                                                 |
| CON-04 | mineur   | lecture de G2 donne la Q1 de l’atelier 2                                       | intégré     | A3-05 (`reading`, `caption`)                                                                                                                                                                                              |
| CON-05 | mineur   | exemple « 0,095 » donne D3 et D5                                               | intégré     | consigne 2 de A4-02 (« 0,125 correspond à 12,5 % »)                                                                                                                                                                       |
| CON-06 | mineur   | l’ancienne Q1 de l’atelier 4 recopiait la cellule G4                           | intégré     | atelier 4 Q1 `b2-01-a5-part-marge-marketplace` (28,8 %)                                                                                                                                                                   |
| CON-07 | mineur   | reformulations « neutres » encore orientées                                    | intégré     | § 6.2 (S03, S09, S35, S46)                                                                                                                                                                                                |
| CON-08 | mineur   | A3-08 recopiait la conclusion de G3                                            | intégré     | A3-09 : décision tarifaire en euros de 2019 (−13,8 %)                                                                                                                                                                     |
| PED-01 | bloquant | 8 énoncés absents (ateliers 3 et 4)                                            | intégré     | A4-03 (énoncés adaptés à la saisonnalité, CON-01) et A5-06 (dont Q1 de CON-06) ; § 5.10                                                                                                                                   |
| PED-02 | majeur   | `Tirage` mélange l’ordre des questions                                         | intégré     | `ordre: 'fixe'` sur les quatre ateliers (B1, B4, § 4.2) ; consigne de A2-03 sans numéro ; Q4 de A3-07 autonome                                                                                                            |
| PED-03 | majeur   | cartes ambiguës (A1-05, A2-07)                                                 | intégré     | cartes `marge-sans-unite`, catégorie « Ambigu en l’état », carte `semestre`                                                                                                                                               |
| PED-04 | majeur   | E2 compare un semestre à une année                                             | intégré     | E2 : 1er semestre 2025 (26,2 %) → −2,8 points ; piège −1,9 (`bases-incompatibles`) ; § 5.2                                                                                                                                |
| PED-05 | majeur   | binômes et note individuelle                                                   | intégré     | § 1.3, notes « Action » des activités en binôme                                                                                                                                                                           |
| PED-06 | majeur   | accessibilité incomplète                                                       | intégré     | `description` et « Voir les données » (F13, F23, B29), étiquettes directes, contrastes (V83), tri au clavier, chronos non bloquants ; AC-29 à AC-32 ; transcription descriptive de la capsule                             |
| PED-07 | mineur   | l’escompte n’est pas une baisse de prix                                        | intégré     | question jumelle de A3-01 (deux remises, net commercial)                                                                                                                                                                  |
| PED-08 | mineur   | lycée : autres BTS possibles                                                   | intégré     | question jumelle de A5-02 (« qui ne prépare que deux BTS »)                                                                                                                                                               |
| PED-09 | mineur   | ventes ou achats ? TVA collectée ou déductible ?                               | intégré     | § 5.4, carte `factures` de A5-07, E4                                                                                                                                                                                      |
| PED-10 | mineur   | remédiations vers des écrans qui n’enseignent pas                              | adapté      | § 5.9 : TVA → A3-04 ; `taux-moyen-arithmetique` → A3-06 ; `sens-de-variation` → A3-02 ; `indice-pris-pour-preuve` → A6-01, qui enseigne désormais le multiple de 9 (au lieu de la fiche mémo proposée)                    |
| PED-11 | mineur   | sacs « fabriqués » mais « coût d’achat »                                       | intégré     | § 2.2 et § 5.1 (confectionnés par un atelier partenaire, revendus en l’état)                                                                                                                                              |
| PED-12 | mineur   | durées de l’atelier 2 et de A6-04                                              | adapté      | atelier 2 à 10 min grâce à A3-06 ; A6-04 reste à 4 min (option A) ; annonces de temps restant dans les notes des activités chronométrées                                                                                  |
| VID-01 | bloquant | voix `say` interdite de publication                                            | intégré     | Piper `fr_FR-siwis-medium`, crédits SIWIS (A4-01, § 8.2, annexe A) ; `say` exclu de toute étape, y compris des maquettes                                                                                                  |
| VID-02 | majeur   | « le contrôle passe à 0 si une ligne change » est faux                         | intégré     | plans P08 et P09 (annexe A.4)                                                                                                                                                                                             |
| VID-03 | majeur   | annexe A insuffisante                                                          | intégré     | annexe A complète (chaîne, charte, plans, voix, VTT, transcription, crédits, recette)                                                                                                                                     |
| VID-04 | mineur   | capture en temps réel non déterministe                                         | intégré     | capture image par image par `window.__seek(t)` (A.1)                                                                                                                                                                      |
| VID-05 | mineur   | vitesse de lecture des sous-titres                                             | intégré     | `--length_scale 1.15`, 15 caractères par seconde au plus, 12 en moyenne (A.1, étapes 3 et 9)                                                                                                                              |

### C.2 Relecture technique (43 constats)

| Id  | Sévérité | Constat                                                           | Disposition | Où et comment                                                                                                                                                                                                      |
| --- | -------- | ----------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R01 | bloquant | le catalogue public sert les réponses avant la question           | intégré     | `diffusion` par écran (B1, B19), écrans `seance` verrouillés, garde à volet catalogue, `catalogue-sans-question`, limitation 60/min (§ 2.7, § 6.4, § 9.5)                                                          |
| R02 | bloquant | évaluation exponentielle du moteur de formules                    | intégré     | B6, § 9.9 (mémoïsation, budget, bornes), AC-35                                                                                                                                                                     |
| R03 | bloquant | aucune garde « écran servi »                                      | intégré     | B20, `BaremeQuestionV2.ecranId`, 409 `ECRAN_NON_SERVI` sur toutes les écritures, défi figé (B12), AC-19                                                                                                            |
| R04 | majeur   | phases, révélation et étayage sans contrat                        | intégré     | B21, `PilotageEcran`, `revision` dans l’empreinte, persistance, phases monotones (§ 9.3.9)                                                                                                                         |
| R05 | majeur   | `parOption` indexé par un identifiant dépendant de la graine      | adapté      | indexé par l’identifiant **stable** `slugOption(libelle)` (arbitrage de l’utilisateur) plutôt que par les identifiants du tirage de référence ; plus aucune table de correspondance à calculer                     |
| R06 | majeur   | B4 casse Tirage, Déroulé, Rapport ; banque sans projection privée | intégré     | B4 (aiguillage exhaustif, `corrigesDe` gardé, `TirageDuCours.banque`)                                                                                                                                              |
| R07 | majeur   | valeur de production et confusions multiples                      | intégré     | `ValeurReponse`, `DetailProduction`, colonnes `score` et `details`, rapport lisible (B11, B26)                                                                                                                     |
| R08 | majeur   | le déroulé n’a aucun corrigé de production                        | intégré     | B22, `CorrigeEcranPresentateur` (§ 9.3.6), rendu `board` seulement                                                                                                                                                 |
| R09 | majeur   | tentatives : plafond non atomique, pupitre aveugle                | intégré     | B7, tables de progression et de journal, `lireNombreSaisi`, codes 409, `tentativesMax` public, progression au flux                                                                                                 |
| R10 | majeur   | pas de reprise après rechargement ; clés locales partagées        | intégré     | B23 (`moi`), F18 (brouillons cloisonnés, purge), message « déjà répondu »                                                                                                                                          |
| R11 | majeur   | contrat de l’hôte non spécifié                                    | intégré     | F17, § 9.7                                                                                                                                                                                                         |
| R12 | majeur   | `formuleObligatoire` accepte une constante                        | adapté      | `forme: 'references' \| { memeQue }` : une constante est refusée et la cohérence R1C1 est exigée entre cellules recopiées, ce qui accepte les formules équivalentes (`=C2/B2-1`) au lieu d’imposer une chaîne R1C1 |
| R13 | majeur   | règle de notation à étendre                                       | intégré     | § 9.3.8 (contrat final), production vide refusée, « je ne sais pas » pour les productions, statistiques sur les questions notées, phrase du pupitre                                                                |
| R14 | majeur   | coût du cours, du bilan et du sujet                               | intégré     | B24, AC-34                                                                                                                                                                                                         |
| R15 | majeur   | V3 servie dès la migration, sans retour                           | intégré     | B25, route d’administration, lot 6 (insertion non publiée, bascule et rebascule)                                                                                                                                   |
| R16 | majeur   | parité des moteurs non garantie                                   | intégré     | § 9.9 (source canonique, vecteurs signés, script de parité)                                                                                                                                                        |
| R17 | majeur   | non-régression des tirages v1/v2                                  | intégré     | tests dorés avant le lot 1, générateurs dérivés, `Bareme = BaremeV1 \| BaremeV2`                                                                                                                                   |
| R18 | majeur   | la page publique ne monte pas les briques                         | intégré     | F21, AC-28                                                                                                                                                                                                         |
| R19 | majeur   | réserve de graines épuisable                                      | adapté      | capacité de séance (40 par défaut, ≤ 60), éviction avec graine libérée (B28) ; plafond d’inscriptions par adresse **non retenu** : une salle entière sort par une seule adresse NAT, il bloquerait la classe       |
| R20 | majeur   | scénario E2E inexécutable                                         | intégré     | F22, banc réel (PostgreSQL, Redis, API, front), § 10.2                                                                                                                                                             |
| M01 | mineur   | stratégies perdues hors ligne                                     | intégré     | routes dédiées aux défis (§ 9.5)                                                                                                                                                                                   |
| M02 | mineur   | banque et énigmes par `/answers` ; sélection recalculée           | intégré     | garde de type (400 `TYPE_DE_QUESTION`), sélection figée (`formation_rappels_servis`), 409 `ECRAN_NON_SERVI`                                                                                                        |
| M03 | mineur   | code « RIVAGE26 » devinable                                       | intégré     | code « K7M2Q94X » (§ 5.10)                                                                                                                                                                                         |
| M04 | mineur   | `numeric` revient en chaîne                                       | intégré     | `score real` (§ 9.10)                                                                                                                                                                                              |
| M05 | mineur   | `z.url()` accepte `javascript:`                                   | intégré     | B14 : `https` seulement ou chemin `/assets/cours/…`                                                                                                                                                                |
| M06 | mineur   | cache d’un an sans empreinte ; vidéo lourde                       | intégré     | chemins versionnés `v3`, `preload="none"`, variante 480p ≤ 8 Mo                                                                                                                                                    |
| M07 | mineur   | libellés runtime monolingues et faux en séance                    | intégré     | H2 (`$localize`, traductions anglaises, annexe D) ; textes de `fp-spaced` corrigés                                                                                                                                 |
| M08 | mineur   | forme des `donnees` non figée                                     | intégré     | § 9.4                                                                                                                                                                                                              |
| M09 | mineur   | écho de `fp-vote-phase` ; graine exposée                          | intégré     | setter sans émission ; aucune graine posée ; cartes mélangées côté serveur (générateur dérivé)                                                                                                                     |
| M10 | mineur   | la garde ignore séries, attendus, `misconceptionsCiblees`         | intégré     | § 6.4, volet 4                                                                                                                                                                                                     |
| M11 | mineur   | liste d’ateliers incohérente                                      | intégré     | règle définie sur les types vote, numérique et classement notés (§ 2.6.2)                                                                                                                                          |
| M12 | mineur   | bornes fixes, valeurs non validées                                | intégré     | validation contre le plan (B5), plan recopié dans le corrigé, identifiant du plan = identifiant de la question                                                                                                     |
| M13 | mineur   | écarts avec un vrai tableur                                       | intégré     | § 9.9, compatibilité figée par les vecteurs                                                                                                                                                                        |
| M14 | mineur   | la migration importe le domaine                                   | intégré     | fichier de données typé `z.input` (B18) ; test de lecture de toutes les versions (lot 1)                                                                                                                           |
| M15 | mineur   | barème lourd relu à chaque réponse                                | intégré     | barème v2 à solutions communes ; `findById` sans barème (B24)                                                                                                                                                      |
| M16 | mineur   | anonymat des jalons non réel                                      | intégré     | clé HMAC, cascade, `CHECK`, comptes masqués sous 5 réponses                                                                                                                                                        |
| M17 | mineur   | rendu `stage` à auditer ; AC-18 contredit la révélation           | intégré     | F3 ; AC-18 « jamais avant la révélation »                                                                                                                                                                          |
| M18 | mineur   | file hors ligne enfermée ; textes vides ; billets perdus          | intégré     | F14, compteur de billets au pupitre                                                                                                                                                                                |
| M19 | mineur   | injection de formule dans un export                               | intégré     | B30                                                                                                                                                                                                                |
| M20 | mineur   | nouvelles routes sans limite                                      | intégré     | § 9.5 (limites par route et contrôleur désigné)                                                                                                                                                                    |
| M21 | mineur   | cache par processus ; Leitner non atomique                        | intégré     | B30 (instance unique documentée, mise à jour atomique)                                                                                                                                                             |
| M22 | mineur   | plancher de 8 % des barres                                        | intégré     | F13 (barres proportionnelles depuis 0)                                                                                                                                                                             |
| M23 | mineur   | jumelle présente dans le sujet dès la phase `vote`                | intégré     | acté : l’énoncé de la jumelle est servi dès le départ (sans réponse) et n’est affiché qu’à partir de `revote` (A3-01, § 4.2)                                                                                       |

---

## Annexe D — Libellés des briques runtime (H2)

Règle : `src/cours/runtime/core/i18n.ts` expose le même `texte(cle)` aux briques, mais chaque valeur
devient un `$localize` d’identifiant `@@coursRuntime` + clé en PascalCase ; `npm run extract-i18n`
ajoute les sources au fichier XLF, et `src/locale/messages.en.xlf` reçoit les cibles ci-dessous. Un
test vérifie que chaque clé a une cible anglaise non vide. Les textes du rendu Angular (graphiques,
fiche imprimable, page publique) suivent la même règle avec leurs propres identifiants.

### D.1 Clés existantes (123)

| Clé                        | Identifiant                            | Français                                                                                                                                                                                                          | Anglais                                                                                          |
| -------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `valider`                  | `@@coursRuntimeValider`                | Valider                                                                                                                                                                                                           | Submit                                                                                           |
| `suivant`                  | `@@coursRuntimeSuivant`                | Suivant                                                                                                                                                                                                           | Next                                                                                             |
| `precedent`                | `@@coursRuntimePrecedent`              | Précédent                                                                                                                                                                                                         | Previous                                                                                         |
| `je-ne-sais-pas`           | `@@coursRuntimeJeNeSaisPas`            | Je ne sais pas                                                                                                                                                                                                    | I don’t know                                                                                     |
| `en-attente`               | `@@coursRuntimeEnAttente`              | En attente de votre réponse                                                                                                                                                                                       | Waiting for your answer                                                                          |
| `reponse-enregistree`      | `@@coursRuntimeReponseEnregistree`     | Réponse enregistrée                                                                                                                                                                                               | Answer recorded                                                                                  |
| `saisie-non-numerique`     | `@@coursRuntimeSaisieNonNumerique`     | Saisissez un nombre — la virgule décimale est acceptée                                                                                                                                                            | Enter a number — a decimal comma is accepted                                                     |
| `a-revoir`                 | `@@coursRuntimeARevoir`                | Pas encore — regardons pourquoi                                                                                                                                                                                   | Not yet — let’s see why                                                                          |
| `confirme`                 | `@@coursRuntimeConfirme`               | C’est juste                                                                                                                                                                                                       | That’s right                                                                                     |
| `discussion-en-cours`      | `@@coursRuntimeDiscussionEnCours`      | Discutez avec votre voisin                                                                                                                                                                                        | Discuss with your neighbour                                                                      |
| `revoter`                  | `@@coursRuntimeRevoter`                | Voter à nouveau                                                                                                                                                                                                   | Vote again                                                                                       |
| `envoyer`                  | `@@coursRuntimeEnvoyer`                | Envoyer                                                                                                                                                                                                           | Send                                                                                             |
| `rappel-consigne`          | `@@coursRuntimeRappelConsigne`         | Écrivez tout ce dont vous vous souvenez, sans regarder vos notes                                                                                                                                                  | Write down everything you remember, without looking at your notes                                |
| `rappel-restant`           | `@@coursRuntimeRappelRestant`          | Options disponibles dans                                                                                                                                                                                          | Options available in                                                                             |
| `rappel-termine`           | `@@coursRuntimeRappelTermine`          | Options disponibles                                                                                                                                                                                               | Options available                                                                                |
| `choix-obligatoire`        | `@@coursRuntimeChoixObligatoire`       | Choisissez une réponse avant d’envoyer                                                                                                                                                                            | Choose an answer before sending                                                                  |
| `texte-libre-trop-long`    | `@@coursRuntimeTexteLibreTropLong`     | Réduisez votre réponse à                                                                                                                                                                                          | Shorten your answer to                                                                           |
| `caracteres-maximum`       | `@@coursRuntimeCaracteresMaximum`      | caractères maximum                                                                                                                                                                                                | characters maximum                                                                               |
| `chargement`               | `@@coursRuntimeChargement`             | Chargement…                                                                                                                                                                                                       | Loading…                                                                                         |
| `hors-ligne`               | `@@coursRuntimeHorsLigne`              | Hors ligne — vos réponses seront envoyées à la reconnexion                                                                                                                                                        | Offline — your answers will be sent when you reconnect                                           |
| `pulse-perdu`              | `@@coursRuntimePulsePerdu`             | Perdu                                                                                                                                                                                                             | Lost                                                                                             |
| `pulse-ca-va`              | `@@coursRuntimePulseCaVa`              | Ça va                                                                                                                                                                                                             | OK                                                                                               |
| `pulse-clair`              | `@@coursRuntimePulseClair`             | C’est clair                                                                                                                                                                                                       | Clear                                                                                            |
| `pulse-anonymat`           | `@@coursRuntimePulseAnonymat`          | Réponses anonymes : personne ne voit qui a répondu quoi                                                                                                                                                           | Anonymous answers: nobody sees who answered what                                                 |
| `pulse-votre-etat`         | `@@coursRuntimePulseVotreEtat`         | Votre état actuel :                                                                                                                                                                                               | Your current state:                                                                              |
| `pulse-total`              | `@@coursRuntimePulseTotal`             | Réponses reçues :                                                                                                                                                                                                 | Answers received:                                                                                |
| `challenge-consigne`       | `@@coursRuntimeChallengeConsigne`      | Cherchez par vous-même : aucune méthode ne vous a encore été donnée                                                                                                                                               | Work it out yourself: no method has been given to you yet                                        |
| `challenge-tentative-vide` | `@@coursRuntimeChallengeTentativeVide` | Écrivez votre tentative, même imparfaite : c’est elle qui compte                                                                                                                                                  | Write your attempt, even an imperfect one: it is what counts                                     |
| `challenge-reveler`        | `@@coursRuntimeChallengeReveler`       | Voir les stratégies                                                                                                                                                                                               | Show the strategies                                                                              |
| `challenge-strategies`     | `@@coursRuntimeChallengeStrategies`    | Stratégies typiques                                                                                                                                                                                               | Typical strategies                                                                               |
| `challenge-fausse`         | `@@coursRuntimeChallengeFausse`        | Piste fausse                                                                                                                                                                                                      | Wrong lead                                                                                       |
| `pro-geste`                | `@@coursRuntimeProGeste`               | Le geste professionnel                                                                                                                                                                                            | The professional practice                                                                        |
| `pro-consequence`          | `@@coursRuntimeProConsequence`         | Sur le terrain :                                                                                                                                                                                                  | In the field:                                                                                    |
| `concept4-reglages`        | `@@coursRuntimeConcept4Reglages`       | Faites varier les paramètres et observez les quatre faces                                                                                                                                                         | Vary the parameters and watch the four views                                                     |
| `concept4-animer`          | `@@coursRuntimeConcept4Animer`         | Animer le calcul                                                                                                                                                                                                  | Animate the calculation                                                                          |
| `concept4-formule`         | `@@coursRuntimeConcept4Formule`        | Formule                                                                                                                                                                                                           | Formula                                                                                          |
| `concept4-graphique`       | `@@coursRuntimeConcept4Graphique`      | Graphique                                                                                                                                                                                                         | Chart                                                                                            |
| `concept4-courbe`          | `@@coursRuntimeConcept4Courbe`         | Courbe du résultat en fonction du paramètre                                                                                                                                                                       | Curve of the result against the parameter                                                        |
| `concept4-tableau`         | `@@coursRuntimeConcept4Tableau`        | Tableau de valeurs                                                                                                                                                                                                | Table of values                                                                                  |
| `concept4-phrase`          | `@@coursRuntimeConcept4Phrase`         | En mots                                                                                                                                                                                                           | In words                                                                                         |
| `concept4-resultat`        | `@@coursRuntimeConcept4Resultat`       | Résultat                                                                                                                                                                                                          | Result                                                                                           |
| `concept4-plage`           | `@@coursRuntimeConcept4Plage`          | de                                                                                                                                                                                                                | from                                                                                             |
| `concept4-plage-fin`       | `@@coursRuntimeConcept4PlageFin`       | à                                                                                                                                                                                                                 | to                                                                                               |
| `worked-consigne`          | `@@coursRuntimeWorkedConsigne`         | Suivez le raisonnement, puis reprenez les étapes laissées de côté                                                                                                                                                 | Follow the reasoning, then complete the steps left out                                           |
| `worked-a-vous`            | `@@coursRuntimeWorkedAVous`            | À vous de rédiger cette étape                                                                                                                                                                                     | Your turn to write this step                                                                     |
| `worked-pourquoi`          | `@@coursRuntimeWorkedPourquoi`         | Pourquoi cette étape ?                                                                                                                                                                                            | Why this step?                                                                                   |
| `worked-etape-vide`        | `@@coursRuntimeWorkedEtapeVide`        | Rédigez chaque étape laissée de côté avant de valider                                                                                                                                                             | Write every step left out before submitting                                                      |
| `worked-niveau`            | `@@coursRuntimeWorkedNiveau`           | Étapes montrées :                                                                                                                                                                                                 | Steps shown:                                                                                     |
| `plot-reglages`            | `@@coursRuntimePlotReglages`           | Faites varier les paramètres et observez la forme des courbes                                                                                                                                                     | Vary the parameters and watch the shape of the curves                                            |
| `plot-animer`              | `@@coursRuntimePlotAnimer`             | Voir l’évolution                                                                                                                                                                                                  | Show the change                                                                                  |
| `plot-selon`               | `@@coursRuntimePlotSelon`              | en fonction de                                                                                                                                                                                                    | against                                                                                          |
| `plot-legende`             | `@@coursRuntimePlotLegende`            | Légende des courbes                                                                                                                                                                                               | Curve legend                                                                                     |
| `plot-trait-plein`         | `@@coursRuntimePlotTraitPlein`         | trait plein                                                                                                                                                                                                       | solid line                                                                                       |
| `plot-trait-tirets`        | `@@coursRuntimePlotTraitTirets`        | trait en pointillés                                                                                                                                                                                               | dashed line                                                                                      |
| `plot-tableau`             | `@@coursRuntimePlotTableau`            | Valeurs aux deux extrémités                                                                                                                                                                                       | Values at both ends                                                                              |
| `plot-serie`               | `@@coursRuntimePlotSerie`              | Courbe                                                                                                                                                                                                            | Curve                                                                                            |
| `plot-ecart`               | `@@coursRuntimePlotEcart`              | Écart entre les deux courbes :                                                                                                                                                                                    | Gap between the two curves:                                                                      |
| `plot-aucune-serie`        | `@@coursRuntimePlotAucuneSerie`        | Aucune courbe à tracer : la définition ne porte aucune série                                                                                                                                                      | No curve to draw: the definition has no series                                                   |
| `plot-plage`               | `@@coursRuntimePlotPlage`              | de                                                                                                                                                                                                                | from                                                                                             |
| `plot-plage-fin`           | `@@coursRuntimePlotPlageFin`           | à                                                                                                                                                                                                                 | to                                                                                               |
| `table-build-consigne`     | `@@coursRuntimeTableBuildConsigne`     | Bâtissez le tableau ligne à ligne : chaque cellule déduite se recalcule dès que vous saisissez                                                                                                                    | Build the table row by row: each derived cell updates as soon as you type                        |
| `table-build-echeance`     | `@@coursRuntimeTableBuildEcheance`     | Échéance                                                                                                                                                                                                          | Instalment                                                                                       |
| `table-build-a-saisir`     | `@@coursRuntimeTableBuildASaisir`      | à saisir                                                                                                                                                                                                          | to enter                                                                                         |
| `table-build-deduite`      | `@@coursRuntimeTableBuildDeduite`      | déduite                                                                                                                                                                                                           | derived                                                                                          |
| `table-build-totaux`       | `@@coursRuntimeTableBuildTotaux`       | Totaux                                                                                                                                                                                                            | Totals                                                                                           |
| `table-build-solde`        | `@@coursRuntimeTableBuildSolde`        | Capital restant dû après la dernière échéance :                                                                                                                                                                   | Outstanding principal after the last instalment:                                                 |
| `table-build-cellule-vide` | `@@coursRuntimeTableBuildCelluleVide`  | Complétez chaque cellule à saisir avant de valider                                                                                                                                                                | Fill in every cell to enter before submitting                                                    |
| `table-build-progression`  | `@@coursRuntimeTableBuildProgression`  | Cellules saisies :                                                                                                                                                                                                | Cells entered:                                                                                   |
| `table-build-vide`         | `@@coursRuntimeTableBuildVide`         | Aucune ligne à bâtir : le plan ne porte aucune échéance                                                                                                                                                           | No row to build: the plan has no instalment                                                      |
| `sheet-consigne`           | `@@coursRuntimeSheetConsigne`          | Écrivez vos formules : commencez par « = », citez les cellules par leur nom, séparez les arguments par un point-virgule                                                                                           | Write your formulas: start with “=”, refer to cells by name, separate arguments with a semicolon |
| `sheet-coin`               | `@@coursRuntimeSheetCoin`              | Cellule                                                                                                                                                                                                           | Cell                                                                                             |
| `sheet-cellule`            | `@@coursRuntimeSheetCellule`           | Cellule                                                                                                                                                                                                           | Cell                                                                                             |
| `sheet-recopier`           | `@@coursRuntimeSheetRecopier`          | Recopier vers le bas                                                                                                                                                                                              | Fill down                                                                                        |
| `sheet-recopie-impossible` | `@@coursRuntimeSheetRecopieImpossible` | Aucune cellule sous celle-ci : la recopie n’a rien où aller                                                                                                                                                       | No cell below this one: there is nowhere to fill down                                            |
| `sheet-cellule-fautive`    | `@@coursRuntimeSheetCelluleFautive`    | Formule refusée par le tableur                                                                                                                                                                                    | Formula rejected by the spreadsheet                                                              |
| `sheet-erreurs`            | `@@coursRuntimeSheetErreurs`           | Formules à revoir :                                                                                                                                                                                               | Formulas to review:                                                                              |
| `sheet-aucune-formule`     | `@@coursRuntimeSheetAucuneFormule`     | Écrivez au moins une formule avant de valider                                                                                                                                                                     | Write at least one formula before submitting                                                     |
| `sheet-progression`        | `@@coursRuntimeSheetProgression`       | Formules écrites :                                                                                                                                                                                                | Formulas written:                                                                                |
| `sheet-vide`               | `@@coursRuntimeSheetVide`              | Aucune cellule à remplir : le plan ne porte aucune ligne                                                                                                                                                          | No cell to fill in: the plan has no row                                                          |
| `cardsort-consigne`        | `@@coursRuntimeCardsortConsigne`       | Choisissez une carte, désignez sa catégorie, puis déplacez-la — à la souris comme au clavier                                                                                                                      | Pick a card, choose its category, then move it — with the mouse or the keyboard                  |
| `cardsort-pioche`          | `@@coursRuntimeCardsortPioche`         | Cartes à trier                                                                                                                                                                                                    | Cards to sort                                                                                    |
| `cardsort-destination`     | `@@coursRuntimeCardsortDestination`    | Catégorie de destination                                                                                                                                                                                          | Target category                                                                                  |
| `cardsort-deplacer`        | `@@coursRuntimeCardsortDeplacer`       | Déplacer la carte                                                                                                                                                                                                 | Move the card                                                                                    |
| `cardsort-selection`       | `@@coursRuntimeCardsortSelection`      | Carte choisie :                                                                                                                                                                                                   | Selected card:                                                                                   |
| `cardsort-relachee`        | `@@coursRuntimeCardsortRelachee`       | Carte relâchée : aucune carte n’est choisie                                                                                                                                                                       | Card released: no card is selected                                                               |
| `cardsort-deplacee`        | `@@coursRuntimeCardsortDeplacee`       | déplacée vers                                                                                                                                                                                                     | moved to                                                                                         |
| `cardsort-aucune-carte`    | `@@coursRuntimeCardsortAucuneCarte`    | Choisissez d’abord une carte à déplacer                                                                                                                                                                           | First pick a card to move                                                                        |
| `cardsort-hors-cible`      | `@@coursRuntimeCardsortHorsCible`      | Dépôt hors d’une catégorie : la carte est revenue à sa place                                                                                                                                                      | Dropped outside a category: the card went back to its place                                      |
| `cardsort-incomplet`       | `@@coursRuntimeCardsortIncomplet`      | Placez chaque carte dans une catégorie avant de valider                                                                                                                                                           | Place every card in a category before submitting                                                 |
| `cardsort-progression`     | `@@coursRuntimeCardsortProgression`    | Cartes placées :                                                                                                                                                                                                  | Cards placed:                                                                                    |
| `cardsort-vide`            | `@@coursRuntimeCardsortVide`           | Aucune carte à trier : le plan ne porte aucune carte                                                                                                                                                              | No card to sort: the plan has no card                                                            |
| `escape-consigne`          | `@@coursRuntimeEscapeConsigne`         | Résolvez une énigme pour ouvrir la suivante : chaque réponse juste livre un fragment du code                                                                                                                      | Solve a puzzle to open the next one: each correct answer gives a piece of the code               |
| `escape-progression`       | `@@coursRuntimeEscapeProgression`      | Énigmes résolues :                                                                                                                                                                                                | Puzzles solved:                                                                                  |
| `escape-minuteur`          | `@@coursRuntimeEscapeMinuteur`         | Temps passé sur cette énigme :                                                                                                                                                                                    | Time spent on this puzzle:                                                                       |
| `escape-minuteur-annonce`  | `@@coursRuntimeEscapeMinuteurAnnonce`  | minutes annoncées                                                                                                                                                                                                 | minutes planned                                                                                  |
| `escape-echu`              | `@@coursRuntimeEscapeEchu`             | Le temps annoncé est écoulé : rien ne se ferme, prenez le temps qu’il faut                                                                                                                                        | The planned time is up: nothing closes, take the time you need                                   |
| `escape-vide`              | `@@coursRuntimeEscapeVide`             | Aucune énigme dans ce parcours                                                                                                                                                                                    | No puzzle in this trail                                                                          |
| `escape-etat-resolue`      | `@@coursRuntimeEscapeEtatResolue`      | Résolue                                                                                                                                                                                                           | Solved                                                                                           |
| `escape-etat-ouverte`      | `@@coursRuntimeEscapeEtatOuverte`      | Ouverte                                                                                                                                                                                                           | Open                                                                                             |
| `escape-etat-verrouillee`  | `@@coursRuntimeEscapeEtatVerrouillee`  | Verrouillée                                                                                                                                                                                                       | Locked                                                                                           |
| `escape-verrouillee`       | `@@coursRuntimeEscapeVerrouillee`      | Verrouillée : l’énigme précédente l’ouvrira                                                                                                                                                                       | Locked: the previous puzzle will open it                                                         |
| `escape-fragment`          | `@@coursRuntimeEscapeFragment`         | Fragment du code obtenu :                                                                                                                                                                                         | Code piece obtained:                                                                             |
| `escape-reponse`           | `@@coursRuntimeEscapeReponse`          | Votre réponse                                                                                                                                                                                                     | Your answer                                                                                      |
| `escape-repondre`          | `@@coursRuntimeEscapeRepondre`         | Proposer cette réponse                                                                                                                                                                                            | Submit this answer                                                                               |
| `escape-reponse-vide`      | `@@coursRuntimeEscapeReponseVide`      | Écrivez une réponse avant de la proposer                                                                                                                                                                          | Write an answer before submitting it                                                             |
| `escape-a-chercher`        | `@@coursRuntimeEscapeAChercher`        | Ce n’est pas encore cela : relisez l’énoncé et proposez autre chose                                                                                                                                               | Not yet: reread the statement and try something else                                             |
| `escape-indice`            | `@@coursRuntimeEscapeIndice`           | Demander un indice                                                                                                                                                                                                | Ask for a hint                                                                                   |
| `escape-indice-gratuit`    | `@@coursRuntimeEscapeIndiceGratuit`    | Prendre un indice ne retire rien à votre parcours                                                                                                                                                                 | Taking a hint costs you nothing                                                                  |
| `escape-indice-attente`    | `@@coursRuntimeEscapeIndiceAttente`    | L’indice s’ouvre dans                                                                                                                                                                                             | The hint opens in                                                                                |
| `escape-secondes`          | `@@coursRuntimeEscapeSecondes`         | secondes                                                                                                                                                                                                          | seconds                                                                                          |
| `escape-indice-pris`       | `@@coursRuntimeEscapeIndicePris`       | Indice ouvert : il ne retire rien à votre parcours                                                                                                                                                                | Hint opened: it costs you nothing                                                                |
| `escape-indice-donne`      | `@@coursRuntimeEscapeIndiceDonne`      | Indice :                                                                                                                                                                                                          | Hint:                                                                                            |
| `escape-debloquee`         | `@@coursRuntimeEscapeDebloquee`        | Énigme suivante déverrouillée :                                                                                                                                                                                   | Next puzzle unlocked:                                                                            |
| `escape-termine`           | `@@coursRuntimeEscapeTermine`          | Toutes les énigmes sont résolues, le code est reconstitué :                                                                                                                                                       | All puzzles are solved, the code is complete:                                                    |
| `escape-code`              | `@@coursRuntimeEscapeCode`             | Code final :                                                                                                                                                                                                      | Final code:                                                                                      |
| `spaced-consigne`          | `@@coursRuntimeSpacedConsigne`         | Rappel : quelques questions sur ce que vous avez travaillé plus tôt, de mémoire, sans vos notes (modifié ; ancien : « Quelques questions des séances déjà passées : répondez de mémoire, sans relire vos notes ») | Recall: a few questions on what you worked on earlier, from memory, without your notes           |
| `spaced-progression`       | `@@coursRuntimeSpacedProgression`      | Question                                                                                                                                                                                                          | Question                                                                                         |
| `spaced-origine`           | `@@coursRuntimeSpacedOrigine`          | Vu en                                                                                                                                                                                                             | Seen in                                                                                          |
| `spaced-boite`             | `@@coursRuntimeSpacedBoite`            | Boîte                                                                                                                                                                                                             | Box                                                                                              |
| `spaced-vide`              | `@@coursRuntimeSpacedVide`             | Rien à revoir pour l’instant (modifié ; ancien : « Rien à réviser aujourd’hui : revenez après la prochaine séance »)                                                                                              | Nothing to review for now                                                                        |
| `spaced-erreur`            | `@@coursRuntimeSpacedErreur`           | Les questions à revoir ne sont pas arrivées : réessayez dans un instant, rien n’est perdu                                                                                                                         | The review questions did not arrive: try again in a moment, nothing is lost                      |
| `spaced-termine`           | `@@coursRuntimeSpacedTermine`          | Révision terminée : vos réponses sont parties                                                                                                                                                                     | Review finished: your answers have been sent                                                     |
| `spaced-diagnostics`       | `@@coursRuntimeSpacedDiagnostics`      | Confusions visées :                                                                                                                                                                                               | Targeted misconceptions:                                                                         |

### D.2 Clés nouvelles (28)

| Clé                            | Identifiant                                | Français                                                                | Anglais                                                       |
| ------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| `verdict-juste`                | `@@coursRuntimeVerdictJuste`               | Juste                                                                   | Correct                                                       |
| `verdict-a-revoir`             | `@@coursRuntimeVerdictARevoir`             | À revoir                                                                | To review                                                     |
| `verdict-score`                | `@@coursRuntimeVerdictScore`               | Score :                                                                 | Score:                                                        |
| `sheet-verdict`                | `@@coursRuntimeSheetVerdict`               | Cellules justes :                                                       | Correct cells:                                                |
| `cardsort-verdict`             | `@@coursRuntimeCardsortVerdict`            | Cartes bien placées :                                                   | Cards correctly placed:                                       |
| `table-build-verdict`          | `@@coursRuntimeTableBuildVerdict`          | Lignes justes :                                                         | Correct rows:                                                 |
| `table-build-synthese`         | `@@coursRuntimeTableBuildSynthese`         | Synthèse                                                                | Summary                                                       |
| `cardsort-chrono`              | `@@coursRuntimeCardsortChrono`             | Temps restant :                                                         | Time left:                                                    |
| `cardsort-chrono-echu`         | `@@coursRuntimeCardsortChronoEchu`         | Le temps est écoulé : vous pouvez encore envoyer                        | Time is up: you can still submit                              |
| `escape-tentatives-restantes`  | `@@coursRuntimeEscapeTentativesRestantes`  | Tentatives restantes :                                                  | Attempts left:                                                |
| `escape-tentatives-epuisees`   | `@@coursRuntimeEscapeTentativesEpuisees`   | Tentatives épuisées : l’énigme suivante s’ouvre, sans fragment          | No attempts left: the next puzzle opens, without a code piece |
| `challenge-attente-revelation` | `@@coursRuntimeChallengeAttenteRevelation` | Les pistes fausses seront signalées à la révélation                     | Wrong leads will be flagged at the reveal                     |
| `vote-phase-vote`              | `@@coursRuntimeVotePhaseVote`              | Votez seul·e, sans en parler                                            | Vote on your own, without talking                             |
| `vote-phase-revele`            | `@@coursRuntimeVotePhaseRevele`            | Réponse révélée                                                         | Answer revealed                                               |
| `vote-phase-fermee`            | `@@coursRuntimeVotePhaseFermee`            | Le vote est fermé pour cette question                                   | Voting is closed for this question                            |
| `deja-repondu`                 | `@@coursRuntimeDejaRepondu`                | Réponse déjà enregistrée : voici votre verdict                          | Answer already recorded: here is your result                  |
| `ecran-non-servi`              | `@@coursRuntimeEcranNonServi`              | Cet écran n’est pas encore ouvert                                       | This screen is not open yet                                   |
| `apercu`                       | `@@coursRuntimeApercu`                     | Aperçu : les réponses s’envoient pendant la séance                      | Preview: answers are sent during the session                  |
| `ecran-verrouille`             | `@@coursRuntimeEcranVerrouille`            | Disponible pendant la séance                                            | Available during the session                                  |
| `video-sous-titres`            | `@@coursRuntimeVideoSousTitres`            | Sous-titres                                                             | Subtitles                                                     |
| `video-transcription`          | `@@coursRuntimeVideoTranscription`         | Transcription                                                           | Transcript                                                    |
| `spaced-carte-maitrise`        | `@@coursRuntimeSpacedCarteMaitrise`        | Carte de maîtrise par concept                                           | Mastery map by concept                                        |
| `spaced-non-vus`               | `@@coursRuntimeSpacedNonVus`               | Non vus                                                                 | Not seen                                                      |
| `pulse-masque`                 | `@@coursRuntimePulseMasque`                | Comptes affichés à partir de 5 réponses                                 | Counts shown from 5 answers                                   |
| `production-vide`              | `@@coursRuntimeProductionVide`             | Saisissez au moins une valeur ou choisissez « Je ne sais pas »          | Enter at least one value or choose “I don’t know”             |
| `brouillon-restaure`           | `@@coursRuntimeBrouillonRestaure`          | Brouillon restauré                                                      | Draft restored                                                |
| `plot-voir-donnees`            | `@@coursRuntimePlotVoirDonnees`            | Voir les données                                                        | Show the data                                                 |
| `tentatives-reseau`            | `@@coursRuntimeTentativesReseau`           | Tentative non envoyée : vérifiez la connexion et proposez-la de nouveau | Attempt not sent: check the connection and submit it again    |

---

## Annexe E — Vérification automatique du document

Script : `verif-cours-b2-01.mjs` (Node.js 22 ou plus, sans dépendance), conservé hors des dépôts
avec les preuves de la conception ; il sort en code 1 à la première incohérence. Il lit **ce
document** et contrôle :

1. le tableau du § 3.1 : 52 écrans, rangs 1 à 52, identifiants uniques et conformes à
   `^B2-01-A[1-6]-\d{2}-[A-Z0-9-]+$`, somme 210, minutes par acte 30, 36, 36, 38, 42, 28 ; accord de
   chaque ligne avec l’en-tête de sa fiche (identifiant, durée, diffusion) ;
2. les règles de structure adaptées du § 2.6 : exposition continue ≤ 6 min (jalons comptés comme
   exposition), ratio ≥ 0,30, ouverture `fp-recall` et clôture `fp-exit`, durées entières positives,
   `atelier-questions-fermees` (Q > 0 ⇒ 8 à 15 min, hors ouverture et clôture), total des questions
   fermées notées (29) égal au décompte de la banque du § 5.10, `catalogue-sans-question` ;
3. une note en cinq rubriques non vides (`Action`, `Observé`, `Attendu`, `Contrôle`, `Transition`)
   dans chacune des 52 fiches ;
4. les remédiations du § 5.9 : 38 confusions, chaque cible est un écran existant ;
5. la garde de confidentialité (§ 6.4) rejouée sur les textes publics des fiches (blocs « Contenu
   (public) ») et les options de la banque : volets exact, segments et catalogue ;
6. **toutes les valeurs du tableau V01 à V85 (§ 5.8)**, recalculées indépendamment et comparées
   (écart relatif ≤ 10⁻⁶, ou au dernier chiffre écrit), plus les solutions et pièges numériques de la
   banque (§ 5.10) et les corrigés de tableur (§ 5.6) confrontés à ce tableau.

Le script a été éprouvé : sur une copie du document où l’on injecte une minute de trop (A3-03), une
rubrique de note effacée (A1-01), une valeur fausse (V17), le nombre « 45,5 » dans un écran du
catalogue et une paraphrase du billet dans A2-05, il signale les 11 incohérences attendues.

Sortie de la dernière exécution (19 septembre 2026), sur la version finale de ce document :

```
écrans 52 · total 210 · par acte {1: 30, 2: 36, 3: 36, 4: 38, 5: 42, 6: 28}
plus longue exposition continue : 5 min (jalons comptés comme exposition)
interactif 161 min · exposition 49 min · ratio 3,29
ouverture fp-recall · clôture fp-exit
écrans portant des questions fermées notées : A1-05 (8), A2-03 (14), A2-07 (8), A3-01 (8),
A3-07 (10), A4-03 (8), A5-02 (8), A5-06 (9), A5-07 (8)
blocs d’exposition : A1-02 (5), A1-06 (5), A1-09 (2), A1-11 (5), A2-04 (4), A2-08 (1), A3-02 (3),
A3-05 (1), A3-08 (2), A3-10 (4), A4-04 (2), A4-06 (2), A5-04 (4), A5-09 (3), A6-03 (2), A6-06 (4)
diffusion : 13 catalogue, 39 séance ; catalogue-sans-question : 0 violation
notes formateur : 52 fiches, 5 rubriques contrôlées par fiche
questions fermées notées : 29 (banque) = 29 (tableau) ; rappels 13 ; énigmes 4
remédiations : 38, cibles toutes existantes : oui ; 119 pièges et cartes renvoient à une confusion connue
confidentialité : 0 fuite(s) (volets exact, segments, catalogue ; 4 indices sans chiffre)
valeurs numériques recalculées : 326 (V01 à V85, banque, corrigés de tableur)
RÉSULTAT : 0 erreur
```
