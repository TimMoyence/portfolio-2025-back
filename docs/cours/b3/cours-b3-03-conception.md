# B3-03 · Traitement de texte : mettre en forme et mettre en page — conception de référence (gabarit b3)

> Cahier des charges du troisième cours « Outils informatiques du manager » du Bachelor 3 (B3GSP).
> Nadia Ferrand a reçu les chiffres des B3-01 et B3-02 ; elle a tapé sa note au comité de direction
> d’un trait, en texte brut. L’étudiant la reçoit en `.txt`, la nettoie, la met en forme par des
> styles et un thème, la met en page, la numérote et en tire un PDF ; puis une heure où une IA
> réécrit et résume, et où l’étudiant relit chaque chiffre avant de mettre en page ce qu’elle rend.
> Chaque page montre une page Word dessinée par le moteur (rendu `page`), et à côté la syntaxe, le
> piège, l’exemple et une correspondance par pastille. Ce document ne contient aucun code
> exécutable ; toute divergence d’implémentation est un défaut de l’implémentation.

| Rubrique    | Valeur                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Date        | 13 novembre 2026                                                                                        |
| Statut      | **Conception validée le 13 novembre 2026** (réponses de Tim au cadrage, § 0)                            |
| Cours       | `b3-03-traitement-de-texte`                                                                             |
| Gabarit     | `b3` (`docs/cours/cours-gabarit-v3.md` § 8)                                                             |
| Niveau      | `B3` (`moteur.coursB3`)                                                                                 |
| Titre servi | « Traitement de texte : mettre en forme et mettre en page »                                             |
| Séance      | **Mardi 8 décembre 2026, 8 h 30 – 12 h**, B3GSP                                                         |
| Durée       | **180 minutes exactes** : 120 de traitement de texte (actes 1 et 2, 60 min chacun), 60 d’IA (acte 3)    |
| Écrans      | **35**, dont 16 écrans catalogue                                                                        |
| Sources     | Chiffres du jeu fictif Norvane Équipement du B3-01 (graine 20 261 013), note brute écrite pour le cours |

---

## 0. Synthèse des décisions

Réponses de Tim au cadrage, le 13 novembre 2026 :

- **Format** : « 180 min + 1 h d’IA », le modèle du B3-02 : deux heures de Word guidé, puis une heure
  où l’IA rédige et où l’étudiant met en page et vérifie.
- **Visuels** : « Rendu natif page ». Les pages de Word ne sont pas des infographies PNG : le moteur
  dessine une page (feuille, en-tête, corps, pied, styles, alignements, pastilles), nette sur un
  téléphone. Aucun prompt d’image n’est nécessaire ; l’accroche reprend une gravure du domaine public.
- **Fil rouge** : « Norvane, suite du B3-02 ». Le texte brut est la note de Nadia Ferrand au comité,
  écrite pour le cours avec les chiffres du jeu Norvane.
- **Notation** : « Faits sûrs lus dans le document ». Un nombre noté se recalcule depuis le fichier
  servi et ne dépend ni de la version de Word ni de la police : jamais un nombre de pages, un numéro
  de section ou les signets d’un PDF. La mise en page et le PDF se notent par des votes sur le geste.
- **Séance** : mardi 8 décembre 2026.

Ce qui en découle :

- **Trois actes de 60 minutes.** Acte 1 : importer, nettoyer, caractères, styles, thème. Acte 2 :
  paragraphes, listes, en-tête et pied, mise en page, numéros, PDF. Acte 3 : l’IA rédactrice.
- **Le cycle du B3-02** : un vote ouvre la notion, une à trois pages de 2 minutes l’expliquent, un
  exercice guidé pas à pas la fait pratiquer, corrigé sur place.
- **Les titres de la note sont numérotés** (« 1. » niveau 1, « 1.1 » niveau 2) : le nombre de titres
  du volet de navigation se lit sans ambiguïté.

## 1. Objectifs d’apprentissage et public

### 1.1 Rattachement au programme

Programme B3 « Outils informatiques du manager » 2026-27, séance « Traitement de texte : mettre en
forme et mettre en page » : créer un document et y importer un texte brut, mettre en forme les
caractères, appliquer un style ou un thème, aligner et gérer les paragraphes, faire l’en-tête et le
pied de page, mettre en page et numéroter, générer un PDF.

| Point du programme                        | Écran noté   | Page         |
| ----------------------------------------- | ------------ | ------------ |
| Créer un document, importer un texte brut | A1-06        | A1-04, A1-05 |
| Mettre en forme les caractères            | A1-13        | A1-08        |
| Appliquer un style ou un thème            | A1-12, A1-13 | A1-09, A1-10 |
| Aligner et gérer les paragraphes          | A2-04, A2-10 | A2-02, A2-03 |
| En-tête et pied de page                   | A2-09        | A2-06        |
| Mettre en page et numéroter               | A2-09, A2-10 | A2-07, A2-08 |
| Générer un PDF                            | A2-13        | A2-12        |

### 1.2 Objectifs du cours

À la fin de la séance, l’étudiant sait :

1. créer un document et y importer un texte brut sans sa mise en forme d’origine ;
2. afficher les marques de mise en forme et nettoyer par Rechercher et remplacer (`^p^p`, doubles
   espaces, `^p-`) ;
3. mettre en forme des caractères, et savoir quand une mise en forme directe suffit ;
4. appliquer les styles Titre, Sous-titre, Titre 1, Titre 2, Normal, les modifier, et changer de
   thème ;
5. aligner, retirer, espacer les paragraphes sans ligne vide ni espace, faire une liste à puces et un
   saut de page ;
6. poser un en-tête et un pied de page, une première page différente, un saut de section, des marges
   et une orientation, et numéroter « Page X sur Y » par des champs ;
7. enregistrer un PDF avec ses signets ;
8. confier à une IA la réécriture d’un texte, relire chaque chiffre contre la source et mettre en
   page ce qu’elle rend.

### 1.3 Acquis des B3-01 et B3-02

| Acquis                                         | Réemploi dans le B3-03      |
| ---------------------------------------------- | --------------------------- |
| Les chiffres du réseau et les quatre histoires | la note brute, A3-04, A3-07 |
| La médiane pour un délai typique               | A1-01                       |
| La consigne en cinq parties                    | A3-02, A3-05                |
| Comparer un chiffre d’IA au sien               | A3-01, A3-04                |

### 1.4 Public et conditions

B3GSP, Bachelor 3e année. Un poste par étudiant avec Word 2019 ou plus récent, en français, et une
IA conversationnelle au compte de l’étudiant ; sans compte, le binôme. Séance de 3 h 30 : 180 minutes
de travail, pause de 15 minutes après l’acte 1 et après l’acte 2.

## 2. Architecture

### 2.1 Les trois actes

| Acte | Rôle                                    | Gestes                                                                                                      | Minutes |
| ---- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------: |
| 1    | Importer, nettoyer, mettre en forme     | Texte d’un fichier, collage du texte seul, marques ¶, Rechercher et remplacer, police, casse, styles, thème |      60 |
| 2    | Paragraphes, mise en page, numéros, PDF | Alignement, retraits, espacements, enchaînements, puces, sauts, en-tête, pied, sections, marges, numéros    |      60 |
| 3    | L’IA rédactrice, vous metteur en page   | Consigne de réécriture, relecture chiffre par chiffre, collage du texte seul, styles                        |      60 |

### 2.2 Le cycle d’une notion

**Réfléchir** (vote non noté de 2 minutes) → **Comprendre** (une à trois pages de 2 minutes) →
**S’exercer** (exercice noté, corrigé sur place, consigne en étapes numérotées). Un exemple guidé
`fp-worked` précède l’exercice 2. Chaque exercice annonce
`• Temps : réflexion N min · travail M min · correction K min`.

### 2.3 La page de Word

Rendu v2 `page` (`moteur.ecranDePageCommentee`) : à gauche une page dessinée par le moteur, à côté
trois paragraphes toujours dans cet ordre, `Syntaxe :` (le chemin du menu ou le raccourci),
`Le piège :`, `Exemple :`, puis une correspondance par pastille de la page, trois ou quatre. La page
porte une feuille portrait ou paysage, un en-tête, un corps et un pied ; chaque bloc a son style
(Titre, Sous-titre, Titre 1, Titre 2, Normal, Liste, paragraphe vide, tableau), son
alignement (à gauche sans mention, centré, à droite, justifié), ses mises en forme de caractères et, au besoin, sa pastille ; les marques ¶ s’affichent
quand la page les montre. Les exemples sont des extraits inventés, dits tels : aucune page du
catalogue ne reproduit le texte ou les titres de la note servie. Les chemins de menu complets et les
variantes Mac vont aux notes du formateur.

### 2.4 Le fichier de travail

| Fichier                             | Servi sur | Diffusion | Contenu                                               |
| ----------------------------------- | --------- | --------- | ----------------------------------------------------- |
| `B3-03_note_comite.<empreinte>.txt` | A1-02     | catalogue | la note brute : UTF-8 avec BOM, fins de ligne Windows |
| `B3-03_note_comite.<empreinte>.txt` | A1-03     | seance    | la même, réservée, pour qui arrive après l’accroche   |

La note compte 32 lignes séparées chacune par une ligne vide, sans ligne vide en tête ni en fin, sans
suite de trois sauts de ligne ni de trois espaces. Ses lignes de titre, et elles seules, commencent
par un numéro : « 1. » pour le niveau 1, annexe comprise, « 1.1 » pour le niveau 2 ; le titre et le
sous-titre de la note ne sont pas numérotés ; seules les lignes de liste commencent par « - ».

### 2.5 Les règles de la mise en forme

Chaque correction des actes 1 et 2 dit sa règle ; la fiche récap les rassemble :

1. J’importe le texte seul, puis je le mets en forme dans Word.
2. Je travaille marques ¶ affichées : jamais de ligne vide ni d’espace pour espacer ou aligner.
3. Un titre reçoit un style, jamais une mise en forme à la main.
4. La police et les couleurs viennent du thème.
5. Ce qui change à chaque page s’insère par un champ : numéro, nombre de pages, date.
6. Le PDF s’enregistre, il ne s’imprime pas.

### 2.6 Diffusion

Catalogue : l’accroche et la note brute, les onze pages, la fiche récap, les deux pages de l’IA et la
fiche mémo. Tout le reste est servi en séance. Aucun écran catalogue ne porte une réponse d’exercice.

### 2.7 Notation

Comptages exacts, tolérance nulle : les remplacements annoncés par Word et les titres du volet de
navigation. L’étudiant saisit le nombre seul ; l’énoncé le rappelle. Les gestes de mise en page et
d’export se notent par des votes.

## 3. Déroulé écran par écran

### 3.1 Vue d’ensemble

Identifiants : `B3-03-A{acte}-{rang}-{SLUG}`. « I » = interactif. « Q » = questions fermées notées.

| Rang | Identifiant                      | Min | Brique · rendu           |  I  |   Q | Diffusion |
| ---: | -------------------------------- | --: | ------------------------ | :-: | --: | --------- |
|    1 | B3-03-A1-01-RAPPEL-MEDIANE       |   2 | `fp-recall`              |  I  |   1 | seance    |
|    2 | B3-03-A1-02-ACCROCHE             |   1 | `fp-story` · v2 `hero`   |     |   0 | catalogue |
|    3 | B3-03-A1-03-VOTE-LIGNES-VIDES    |   2 | `fp-vote`                |  I  |   0 | seance    |
|    4 | B3-03-A1-04-PAGE-IMPORTER        |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|    5 | B3-03-A1-05-PAGE-NETTOYER        |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|    6 | B3-03-A1-06-ATELIER-NETTOYAGE    |  14 | `questionnaire`          |  I  |   2 | seance    |
|    7 | B3-03-A1-07-VOTE-TITRE           |   2 | `fp-vote`                |  I  |   0 | seance    |
|    8 | B3-03-A1-08-PAGE-CARACTERES      |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|    9 | B3-03-A1-09-PAGE-STYLES          |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   10 | B3-03-A1-10-PAGE-THEME           |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   11 | B3-03-A1-11-EXEMPLE-STYLE        |   4 | `fp-worked`              |  I  |   0 | seance    |
|   12 | B3-03-A1-12-ATELIER-STYLES       |  15 | `questionnaire`          |  I  |   2 | seance    |
|   13 | B3-03-A1-13-TRI-MISE-EN-FORME    |  10 | `fp-cardsort`            |  I  |   1 | seance    |
|   14 | B3-03-A2-01-VOTE-DECALER         |   2 | `fp-vote`                |  I  |   0 | seance    |
|   15 | B3-03-A2-02-PAGE-PARAGRAPHES     |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   16 | B3-03-A2-03-PAGE-LISTES-ET-SAUTS |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   17 | B3-03-A2-04-ATELIER-PARAGRAPHES  |   9 | `questionnaire`          |  I  |   2 | seance    |
|   18 | B3-03-A2-05-VOTE-NUMEROS         |   2 | `fp-vote`                |  I  |   0 | seance    |
|   19 | B3-03-A2-06-PAGE-EN-TETE-PIED    |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   20 | B3-03-A2-07-PAGE-MISE-EN-PAGE    |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   21 | B3-03-A2-08-PAGE-NUMEROS         |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   22 | B3-03-A2-09-ATELIER-MISE-EN-PAGE |  14 | `questionnaire`          |  I  |   2 | seance    |
|   23 | B3-03-A2-10-TRI-REGLAGES         |   9 | `fp-cardsort`            |  I  |   1 | seance    |
|   24 | B3-03-A2-11-VOTE-PDF             |   2 | `fp-vote`                |  I  |   0 | seance    |
|   25 | B3-03-A2-12-PAGE-PDF             |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   26 | B3-03-A2-13-ATELIER-PDF          |   8 | `questionnaire`          |  I  |   1 | seance    |
|   27 | B3-03-A2-14-FICHE-RECAP          |   2 | `fp-story` · v2 `grid`   |     |   0 | catalogue |
|   28 | B3-03-A3-01-VOTE-IA              |   3 | `fp-vote`                |  I  |   0 | seance    |
|   29 | B3-03-A3-02-COURS-IA-REDACTRICE  |   3 | `fp-story` · v2 `lesson` |     |   0 | catalogue |
|   30 | B3-03-A3-03-COURS-RELIRE         |   3 | `fp-story` · v2 `lesson` |     |   0 | catalogue |
|   31 | B3-03-A3-04-AUDIT-TEXTE-IA       |  11 | `fp-cardsort`            |  I  |   1 | seance    |
|   32 | B3-03-A3-05-DEFI-CONSIGNE        |   7 | `fp-challenge`           |  I  |   0 | seance    |
|   33 | B3-03-A3-06-REECRITURE-IA        |  18 | `fp-pro`                 |  I  |   0 | seance    |
|   34 | B3-03-A3-07-RESUME-COMITE        |  12 | `fp-pro`                 |  I  |   0 | seance    |
|   35 | B3-03-A3-08-FICHE-MEMO           |   3 | `fp-story` · v2 `grid`   |     |   0 | catalogue |

Somme : 60 + 60 + 60 = 180. Rythme : 146 minutes interactives, 34 d’exposition, exposition continue
de 6 minutes au plus (A1-08 à A1-10, A2-06 à A2-08, A3-02 + A3-03). Treize questions notées : cinq
votes, cinq nombres, trois tris.

### 3.2 Acte 1 — Importer, nettoyer, mettre en forme (60 min)

#### A1-01 · `B3-03-A1-01-RAPPEL-MEDIANE` — 2 min · `fp-recall` · séance

- Titre public : « Rappel : le délai typique »
- Pendant que les postes rejoignent. `b3-03-a1-rappel-mediane` : la note dira le délai typique de
  Strasbourg en 2026, la moyenne ou la médiane ? Bonne : la médiane ; piège : la moyenne
  (`valeur-extreme-ignoree`).

#### A1-02 · `B3-03-A1-02-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Traitement de texte : mettre en forme et mettre en page »
- Nadia Ferrand a tapé sa note au comité d’un trait ; à vous d’en faire un document. Fond : la
  gravure de la machine à écrire de 1872. Pièce jointe publique : la note brute.

#### A1-03 · `B3-03-A1-03-VOTE-LIGNES-VIDES` — 2 min · `fp-vote` · séance

- Titre public : « Vote : une ligne vide entre deux paragraphes »
- Pièce jointe réservée : la note brute. Pour espacer deux paragraphes : l’espacement après le
  paragraphe (bonne) ; une ligne vide (`paragraphe-vide-pour-espacer`).

#### A1-04 · `B3-03-A1-04-PAGE-IMPORTER` — 2 min · v2 `page` · catalogue

- Titre public : « Page : importer un texte brut »
- Insertion › Objet › Texte d’un fichier, ou clic droit › Options de collage › Conserver uniquement
  le texte (Ctrl + Maj + V ne le fait que sous Microsoft 365) ; piège : coller avec la mise en forme
  de la source.

#### A1-05 · `B3-03-A1-05-PAGE-NETTOYER` — 2 min · v2 `page` · catalogue

- Titre public : « Page : afficher les marques et nettoyer »
- Accueil › ¶ ; Rechercher et remplacer `^p^p` par `^p`, deux espaces par une ; piège : remplacer
  `^p` par rien colle tous les paragraphes.

#### A1-06 · `B3-03-A1-06-ATELIER-NETTOYAGE` — 14 min · `questionnaire` · séance

- Titre public : « Exercice 1 — Importer et nettoyer la note »
- Temps : réflexion 1 min · travail 11 min · correction 2 min.
- `b3-03-a1-paragraphes-vides`, `b3-03-a1-doubles-espaces`. Règles dites : 1 et 2.

#### A1-07 · `B3-03-A1-07-VOTE-TITRE` — 2 min · `fp-vote` · séance

- Titre public : « Vote : faire un titre »
- Gras et 16 points à la main (`mise-en-forme-directe-au-lieu-du-style`), ou le style Titre 1 (bonne) ?

#### A1-08 · `B3-03-A1-08-PAGE-CARACTERES` — 2 min · v2 `page` · catalogue

- Titre public : « Page : mettre en forme les caractères »
- Police, taille, gras, italique, souligné, couleur, Modifier la casse (Maj + F3), Reproduire la mise
  en forme, Ctrl + Espace.

#### A1-09 · `B3-03-A1-09-PAGE-STYLES` — 2 min · v2 `page` · catalogue

- Titre public : « Page : appliquer et modifier un style »
- Accueil › Styles, volet de navigation, clic droit › Modifier.

#### A1-10 · `B3-03-A1-10-PAGE-THEME` — 2 min · v2 `page` · catalogue

- Titre public : « Page : changer de thème »
- Création › Thèmes, Couleurs, Polices, jeu de styles.

#### A1-11 · `B3-03-A1-11-EXEMPLE-STYLE` — 4 min · `fp-worked` · séance

- Titre public : « Exemple guidé : un titre, du brut au style »
- Trois étapes sur le premier titre de niveau 1 : la casse, le style, le style modifié.

#### A1-12 · `B3-03-A1-12-ATELIER-STYLES` — 15 min · `questionnaire` · séance

- Titre public : « Exercice 2 — Les styles de la note »
- Temps : réflexion 1 min · travail 12 min · correction 2 min.
- `b3-03-a1-titres-1`, `b3-03-a1-titres-2`. Règle dite : 3.

#### A1-13 · `B3-03-A1-13-TRI-MISE-EN-FORME` — 10 min · `fp-cardsort` · séance

- Titre public : « Exercice 3 — À la main, par un style ou par le thème ? »
- Temps : réflexion 1 min · travail 7 min · correction 2 min.
- Neuf cartes, trois cases : mise en forme directe, style, thème. Règle dite : 4, puis pause.

### 3.3 Acte 2 — Paragraphes, mise en page, numéros, PDF (60 min)

#### A2-01 · `B3-03-A2-01-VOTE-DECALER` — 2 min · `fp-vote` · séance

- Titre public : « Vote : décaler un paragraphe »
- Un retrait gauche (bonne) ; des espaces ou des tabulations (`espace-pour-aligner`).

#### A2-02 · `B3-03-A2-02-PAGE-PARAGRAPHES` — 2 min · v2 `page` · catalogue

- Titre public : « Page : aligner, retirer, espacer »
- Alignements, retraits, interligne, espacement avant et après, enchaînements.

#### A2-03 · `B3-03-A2-03-PAGE-LISTES-ET-SAUTS` — 2 min · v2 `page` · catalogue

- Titre public : « Page : listes à puces et sauts de page »
- Puces, numérotation, Ctrl + Entrée ; piège : les Entrée répétées.

#### A2-04 · `B3-03-A2-04-ATELIER-PARAGRAPHES` — 9 min · `questionnaire` · séance

- Titre public : « Exercice 4 — Les paragraphes de la note »
- Temps : réflexion 1 min · travail 6 min · correction 2 min.
- `b3-03-a2-tirets`, `b3-03-a2-titre-seul` (vote noté). Règle dite : 2.

#### A2-05 · `B3-03-A2-05-VOTE-NUMEROS` — 2 min · `fp-vote` · séance

- Titre public : « Vote : numéroter les pages »
- Insérer le champ du numéro (bonne) ; taper « Page 1 » au bas de chaque page (`numero-de-page-tape`).

#### A2-06 · `B3-03-A2-06-PAGE-EN-TETE-PIED` — 2 min · v2 `page` · catalogue

- Titre public : « Page : en-tête et pied de page »
- Insertion › En-tête, double-clic dans la marge, Première page différente, champ Date.

#### A2-07 · `B3-03-A2-07-PAGE-MISE-EN-PAGE` — 2 min · v2 `page` · catalogue

- Titre public : « Page : marges, orientation et sections »
- Mise en page › Marges, Orientation, Sauts › Page suivante.

#### A2-08 · `B3-03-A2-08-PAGE-NUMEROS` — 2 min · v2 `page` · catalogue

- Titre public : « Page : numéroter « Page X sur Y » »
- Insertion › Numéro de page › Bas de page › Page X sur Y ; les champs PAGE et NUMPAGES.

#### A2-09 · `B3-03-A2-09-ATELIER-MISE-EN-PAGE` — 14 min · `questionnaire` · séance

- Titre public : « Exercice 5 — En-tête, pied et mise en page »
- Temps : réflexion 1 min · travail 11 min · correction 2 min.
- `b3-03-a2-premiere-page`, `b3-03-a2-annexe-paysage` (votes notés). Règle dite : 5.

#### A2-10 · `B3-03-A2-10-TRI-REGLAGES` — 9 min · `fp-cardsort` · séance

- Titre public : « Exercice 6 — Caractère, paragraphe ou section ? »
- Temps : réflexion 1 min · travail 6 min · correction 2 min.
- Neuf réglages, trois cases : caractère, paragraphe, section.

#### A2-11 · `B3-03-A2-11-VOTE-PDF` — 2 min · `fp-vote` · séance

- Titre public : « Vote : un PDF pour le comité »
- Enregistrer sous, type PDF (bonne) ; Imprimer vers un PDF (`pdf-imprime-au-lieu-d-enregistre`).

#### A2-12 · `B3-03-A2-12-PAGE-PDF` — 2 min · v2 `page` · catalogue

- Titre public : « Page : enregistrer en PDF »
- Fichier › Enregistrer sous › PDF › Options › Créer des signets à l’aide de : Titres.

#### A2-13 · `B3-03-A2-13-ATELIER-PDF` — 8 min · `questionnaire` · séance

- Titre public : « Exercice 7 — Le PDF du comité »
- Temps : réflexion 1 min · travail 5 min · correction 2 min.
- `b3-03-a2-signets` (vote noté). Règle dite : 6.

#### A2-14 · `B3-03-A2-14-FICHE-RECAP` — 2 min · v2 `grid` · catalogue

- Titre public : « Fiche récap : mettre en forme et mettre en page »
- Six cartes, une par règle du § 2.5, chacune avec ses gestes. Imprimable.

### 3.4 Acte 3 — L’IA rédactrice, vous metteur en page (60 min)

#### A3-01 · `B3-03-A3-01-VOTE-IA` — 3 min · `fp-vote` · séance

- Titre public : « Vote : la synthèse réécrite »
- L’IA a rendu une synthèse plus fluide, mais la hausse de 8,6 % y est devenue 6,8 %. Je compare
  chaque chiffre à la note (bonne) ; je la colle telle quelle (`texte-d-ia-repris-sans-relecture`) ;
  je jette tout (`texte-d-ia-rejete-sans-relecture`).

#### A3-02 · `B3-03-A3-02-COURS-IA-REDACTRICE` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : une IA qui rédige »
- Ce qu’elle fait, ce qu’elle ignore ; la consigne de réécriture en cinq parties ; un exemple hors
  dossier ; un texte d’IA se relit chiffre par chiffre.

#### A3-03 · `B3-03-A3-03-COURS-RELIRE` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : relire, puis mettre en page »
- Trois contrôles (chiffres, faits, sens) et le retour dans Word : texte seul, `**` et `#` retirés,
  styles réappliqués.

#### A3-04 · `B3-03-A3-04-AUDIT-TEXTE-IA` — 11 min · `fp-cardsort` · séance

- Titre public : « Exercice 8 — Relire le texte d’une IA »
- Temps : réflexion 2 min · travail 7 min · correction 2 min.
- Huit phrases d’une réécriture écrite pour le cours, dite telle : juste, chiffre changé, fait
  inventé, sens inversé.

#### A3-05 · `B3-03-A3-05-DEFI-CONSIGNE` — 7 min · `fp-challenge` · séance

- Titre public : « Exercice 9 — Votre consigne de réécriture »
- Temps : réflexion 1 min · travail 4 min · correction 2 min.
- Cinq parties de référence et une consigne fausse, « Améliore ce texte ».

#### A3-06 · `B3-03-A3-06-REECRITURE-IA` — 18 min · `fp-pro` · séance

- Titre public : « L’IA au travail : réécrire la partie 2 »
- L’étudiant donne la partie 2 de sa note et sa consigne à son IA, relit chaque chiffre, colle le
  texte seul et réapplique les styles. Trois réponses libres : l’outil, les écarts trouvés, ce qu’il a
  gardé.

#### A3-07 · `B3-03-A3-07-RESUME-COMITE` — 12 min · `fp-pro` · séance

- Titre public : « Exercice 10 — Le résumé en tête de note »
- Temps : réflexion 1 min · travail 9 min · correction 2 min.
- L’IA propose un résumé de cinq lignes ; l’étudiant le corrige et le place sous le sous-titre, en
  style Citation. Correction sur place : les cinq faits que le résumé doit porter.

#### A3-08 · `B3-03-A3-08-FICHE-MEMO` — 3 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : l’IA rédactrice »
- La consigne, les trois contrôles, le retour dans Word. Imprimable.

## 4. La note brute

Écrite pour le cours, en texte brut, à partir des chiffres du B3-01 importés de `b3-01.donnees.ts` :
titre, sous-titre, ligne d’en-tête, six parties numérotées dont l’annexe, neuf sous-parties, une
liste de quatre lignes. Ses lignes sont `LIGNES_DE_LA_NOTE_B3_03` (`b3-03.donnees.ts`) ;
`b3-03.note.spec.ts` écrit le fichier avec `ECRIRE_CLASSEURS=1`, le relit sinon octet par octet et y
recompte, comme Word, chaque valeur notée. Les faits que les données du B3-01 ne portent pas
(contrat de livraison, mois du décrochage, fourchette des remises) ne figurent pas dans la note.

## 5. Contenus

### 5.1 Les valeurs attendues

| Question                     | Ce que l’étudiant lit dans Word                             | Valeur |
| ---------------------------- | ----------------------------------------------------------- | -----: |
| `b3-03-a1-paragraphes-vides` | remplacements annoncés pour `^p^p` → `^p`                   |     31 |
| `b3-03-a1-doubles-espaces`   | remplacements annoncés pour deux espaces → une espace       |      5 |
| `b3-03-a1-titres-1`          | titres de niveau 1 du volet de navigation                   |      6 |
| `b3-03-a1-titres-2`          | titres de niveau 2 du volet de navigation                   |      9 |
| `b3-03-a2-tirets`            | remplacements annoncés pour `^p-` suivi d’une espace → `^p` |      4 |

### 5.2 Concepts, confusions et remédiations

Concepts nouveaux : `texte-brut`, `mise-en-forme-des-caracteres`, `styles-et-theme`,
`mise-en-forme-des-paragraphes`, `mise-en-page`, `export-pdf`, `ia-redactrice`.

| Identifiant                              | Concept                       | Libellé                                                                 | Remédiation                      |
| ---------------------------------------- | ----------------------------- | ----------------------------------------------------------------------- | -------------------------------- |
| `valeur-extreme-ignoree`                 | choix-du-resume               | Résumer par la moyenne une série tirée par une valeur extrême.          | B3-03-A1-01-RAPPEL-MEDIANE       |
| `paragraphe-vide-pour-espacer`           | mise-en-forme-des-paragraphes | Espacer les paragraphes par des lignes vides.                           | B3-03-A1-05-PAGE-NETTOYER        |
| `recherche-mal-saisie`                   | texte-brut                    | Chercher un autre motif que celui à remplacer.                          | B3-03-A1-05-PAGE-NETTOYER        |
| `mise-en-forme-directe-au-lieu-du-style` | styles-et-theme               | Mettre un titre en forme à la main au lieu d’un style.                  | B3-03-A1-09-PAGE-STYLES          |
| `niveaux-de-titre-confondus`             | styles-et-theme               | Donner le même niveau de style à tous les titres.                       | B3-03-A1-09-PAGE-STYLES          |
| `style-pour-un-mot-isole`                | mise-en-forme-des-caracteres  | Passer par un style pour marquer un mot isolé.                          | B3-03-A1-08-PAGE-CARACTERES      |
| `couleur-hors-du-theme`                  | styles-et-theme               | Choisir une couleur ou une police à la main au lieu du thème.           | B3-03-A1-10-PAGE-THEME           |
| `espace-pour-aligner`                    | mise-en-forme-des-paragraphes | Aligner ou décaler par des espaces ou des tabulations.                  | B3-03-A2-02-PAGE-PARAGRAPHES     |
| `saut-de-page-par-entrees`               | mise-en-forme-des-paragraphes | Passer à la page suivante par des Entrée répétées.                      | B3-03-A2-03-PAGE-LISTES-ET-SAUTS |
| `premiere-page-non-differenciee`         | mise-en-page                  | Laisser en-tête et numéro sur la page de titre.                         | B3-03-A2-06-PAGE-EN-TETE-PIED    |
| `saut-de-page-au-lieu-de-section`        | mise-en-page                  | Changer l’orientation après un simple saut de page.                     | B3-03-A2-07-PAGE-MISE-EN-PAGE    |
| `niveau-de-reglage-confondu`             | mise-en-page                  | Chercher un réglage au mauvais niveau : caractère, paragraphe, section. | B3-03-A2-07-PAGE-MISE-EN-PAGE    |
| `numero-de-page-tape`                    | mise-en-page                  | Taper le numéro de page au lieu d’insérer son champ.                    | B3-03-A2-08-PAGE-NUMEROS         |
| `pdf-imprime-au-lieu-d-enregistre`       | export-pdf                    | Imprimer vers un PDF au lieu de l’enregistrer.                          | B3-03-A2-12-PAGE-PDF             |
| `texte-d-ia-repris-sans-relecture`       | ia-redactrice                 | Reprendre un texte d’IA sans le relire contre sa source.                | B3-03-A3-03-COURS-RELIRE         |
| `texte-d-ia-rejete-sans-relecture`       | ia-redactrice                 | Rejeter un texte d’IA juste sans l’avoir comparé à sa source.           | B3-03-A3-03-COURS-RELIRE         |
| `ecart-d-ia-mal-nomme`                   | ia-redactrice                 | Voir l’écart d’un texte d’IA sans nommer sa nature.                     | B3-03-A3-03-COURS-RELIRE         |

## 6. Fonctionnalités

Deux ajouts au moteur, servis par le contrat OpenAPI :

- le rendu v2 `page` (`VisualPresentation.ts`) et sa brique `moteur.ecranDePageCommentee` : le
  schéma refuse des pastilles qui ne vont pas de 1 à n, une fois chacune, avec n = 3 ou 4, et un
  nombre de correspondances différent de n ; le ton d’un passage se prend dans une liste fermée ;
- la pièce jointe `.txt`, servie `text/plain; charset=utf-8` : les extensions servies se lisent dans
  la seule liste `TYPES_DE_FICHIER`, dont dérivent le schéma, le motif de
  `PieceJointePubliqueResponseDto.fichier` et la copie du build.

## 7. Front

Le rendu `page` (composant de diapositive, sans défilement horizontal sur téléphone, à côté de son
texte sur la toile 1280 × 720), la pièce jointe `.txt` lue depuis le motif du contrat, instantané,
montage `montage-b3-03.spec.ts`, entrée de `COURS_EN_SEANCE`, carte de la liste des formations, SEO,
XLF fr et en, la note brute sous `/assets/cours/b3-03/` (exception CRLF de `.editorconfig`).

## 8. Médias

### 8.1 Principe

Aucune infographie : les pages de Word sont dessinées par le moteur (décision de Tim, 13 novembre
2026). L’accroche reprend une gravure du domaine public, servie depuis `/assets/cours/gravures/v1/`
comme celle du B3-01.

### 8.2 Catalogue des médias

| Fichier                             | Rôle       | Écran | Diffusion | Servi par                     |
| ----------------------------------- | ---------- | ----- | --------- | ----------------------------- |
| `B3-03_note_comite.<empreinte>.txt` | note brute | A1-02 | catalogue | front, `/assets/cours/b3-03/` |
| `B3-03_note_comite.<empreinte>.txt` | note brute | A1-03 | seance    | API, poste et pupitre         |

| Id  | Écran | Fichier source (page)                                      | Original             | Auteur, date                                                  | Licence        | Dérivé servi                | Attribution affichée                                                                                   |
| --- | ----- | ---------------------------------------------------------- | -------------------- | ------------------------------------------------------------- | -------------- | --------------------------- | ------------------------------------------------------------------------------------------------------ |
| M1  | A1-02 | https://commons.wikimedia.org/wiki/File:Sholesglidden4.png | PNG 1 770 × 1 818 px | Scientific American, machine à écrire Sholes et Glidden, 1872 | domaine public | `machine-a-ecrire-1872.jpg` | « Scientific American, machine à écrire Sholes et Glidden, 1872 · Wikimedia Commons (domaine public) » |

### 8.3 Sources

- Norvane Équipement et ses chiffres : données fictives générées pour le B3-01.
- La note brute, la réécriture de l’exercice 8 et le résumé de l’exercice 10 : écrits pour ce cours,
  dits tels à l’écran.
- Programme « Outils informatiques du manager » B3 2026-27 (document de l’école, non versionné).
