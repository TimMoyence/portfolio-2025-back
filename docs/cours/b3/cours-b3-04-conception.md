# B3-04 · Publipostage et e-mailing — conception de référence (gabarit b3)

> Cahier des charges du quatrième cours « Outils informatiques du manager » du Bachelor 3 (B3GSP).
> Nadia Ferrand veut écrire à chaque client du réseau Norvane le chiffre d’affaires qu’il a fait
> avec l’agence depuis janvier. L’étudiant reçoit le classeur des contacts tiré du B3-01, écrit la
> lettre type, y insère les champs, filtre les clients de Rennes, adapte la formule d’appel par une
> règle, vérifie l’aperçu, fusionne et enregistre en PDF ; puis il envoie la lettre par e-mailing à
> lui-même et à son binôme, ou, sans Outlook classique, en PDF joint à un courriel, et fait écrire
> la lettre type par une IA qu’il relit. Ce document ne contient aucun code exécutable ; toute
> divergence d’implémentation est un défaut de l’implémentation.

| Rubrique    | Valeur                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------- |
| Date        | 13 novembre 2026                                                                                    |
| Statut      | **Conception validée le 13 novembre 2026** (réponses de Tim au cadrage, § 0)                        |
| Cours       | `b3-04-publipostage`                                                                                |
| Gabarit     | `b3` (`docs/cours/cours-gabarit-v3.md` § 8)                                                         |
| Niveau      | `B3` (`moteur.coursB3`)                                                                             |
| Titre servi | « Publipostage et e-mailing »                                                                       |
| Séance      | **Jeudi 10 décembre 2026, 8 h 30 – 12 h**, B3GSP                                                    |
| Durée       | **180 minutes exactes** : 120 de publipostage (actes 1 et 2, 60 min chacun), 60 d’envoi et d’IA     |
| Écrans      | **34**, dont 15 écrans catalogue                                                                    |
| Sources     | Clients et chiffres du jeu fictif Norvane Équipement du B3-01 (graine 20 261 013), contacts dérivés |

---

## 0. Synthèse des décisions

Réponses de Tim au cadrage, le 13 novembre 2026 :

- **Format** : « 180 min + 1 h d’IA », le modèle des B3-02 et B3-03.
- **Visuels** : « Rendu natif page ». Les écrans de Word sont des pages dessinées par le moteur, les
  champs de fusion marqués comme tels ; aucun prompt d’image. L’accroche reprend une gravure du
  domaine public.
- **Fil rouge** : « Norvane, suite du B3-02 ». Les contacts sont les clients du B3-01.
- **Notation** : « Faits sûrs lus dans le document ». Les nombres notés se recomptent dans le
  classeur servi ; l’insertion des champs, la fusion et l’envoi se notent par des votes sur le geste.
- **E-mailing** : « Plan B guidé dans l’écran », puis « Classeur d’envoi à 2 lignes ». L’envoi part
  d’un classeur séparé, `B3-04_envoi`, à deux lignes, dont l’étudiant remplace les adresses de
  remplissage par la sienne et celle de son binôme : aucun courriel ne part vers un client fictif,
  aucun envoi ne dépasse deux courriels.
- **Séance** : jeudi 10 décembre 2026.

Ce qui en découle :

- **Trois actes de 60 minutes.** Acte 1 : la source, la lettre type, les champs. Acte 2 : filtrer,
  Si…Alors…Sinon, l’aperçu, la fusion, le PDF. Acte 3 : l’e-mailing, le courriel avec le PDF joint,
  l’IA qui rédige la lettre type.
- **Le cycle du B3-03** : un vote ouvre la notion, des pages de 2 minutes l’expliquent, un exercice
  en étapes numérotées la fait pratiquer, corrigé sur place.
- **Deux chemins d’envoi.** Le publipostage par messagerie exige Outlook classique pour Windows ; sans
  lui, l’étudiant fusionne une lettre en PDF et l’envoie à la main, PDF joint.

## 1. Objectifs d’apprentissage et public

### 1.1 Rattachement au programme

Programme B3 « Outils informatiques du manager » 2026-27, séance « Publipostage et e-mailing » : créer
un publipostage à partir des données du tableur, insérer les champs, l’envoyer par e-mailing, en
générer le PDF et transmettre le document par courriel.

| Point du programme                   | Écran noté   | Page         |
| ------------------------------------ | ------------ | ------------ |
| Publipostage depuis le tableur       | A1-06        | A1-04, A1-05 |
| Insérer les champs                   | A1-11, A1-12 | A1-08, A1-09 |
| Filtrer, adapter par une règle       | A2-04        | A2-02, A2-03 |
| Fusionner, générer le PDF            | A2-09, A2-10 | A2-06, A2-08 |
| Envoyer par e-mailing                | A3-04        | A3-02        |
| Transmettre le document par courriel | A3-04        | A3-03        |

### 1.2 Objectifs du cours

À la fin de la séance, l’étudiant sait :

1. lier une lettre type à une liste de contacts tenue dans un tableur, en-têtes compris ;
2. insérer les champs de fusion et régler le format d’un montant ;
3. filtrer les destinataires et adapter un passage par une règle Si…Alors…Sinon ;
4. vérifier l’aperçu, fusionner en documents individuels et enregistrer le résultat en PDF ;
5. envoyer la lettre par e-mailing, ou une lettre en PDF joint à un courriel ;
6. faire écrire une lettre type par une IA et la relire avant d’y insérer les champs.

### 1.3 Acquis des B3-01 à B3-03

| Acquis                                          | Réemploi dans le B3-04   |
| ----------------------------------------------- | ------------------------ |
| Les clients, les agences et la reprise nettoyée | le classeur des contacts |
| Les jumeaux du fichier clients                  | un contact par client    |
| Les champs de numéro de page                    | A1-01                    |
| Le style, la mise en page et le PDF             | la lettre type, A2-08    |
| Relire un texte d’IA                            | A3-06 à A3-10            |

### 1.4 Public et conditions

B3GSP, Bachelor 3e année. Un poste par étudiant avec Word et Excel 2019 ou plus récents, en
français ; Outlook classique pour Windows pour le premier chemin d’envoi ; une messagerie et une IA
conversationnelle au compte de l’étudiant, sans compte le binôme. Séance de 3 h 30 : 180 minutes de
travail, pause de 15 minutes après l’acte 1 et après l’acte 2.

## 2. Architecture

### 2.1 Les trois actes

| Acte | Rôle                                  | Gestes                                                                                        | Minutes |
| ---- | ------------------------------------- | --------------------------------------------------------------------------------------------- | ------: |
| 1    | La source, la lettre type, les champs | Démarrer la fusion, Sélection des destinataires, Insérer un champ de fusion, code de format   |      60 |
| 2    | Filtrer, adapter, fusionner, exporter | Modifier la liste des destinataires, Règles, Aperçu des résultats, Terminer et fusionner, PDF |      60 |
| 3    | Envoyer, puis faire écrire par une IA | Envoyer des messages électroniques, PDF joint à la main, consigne, relecture, champs insérés  |      60 |

### 2.2 Le cycle d’une notion

**Réfléchir** (vote non noté de 2 minutes) → **Comprendre** (une à trois pages de 2 minutes) →
**S’exercer** (exercice noté, corrigé sur place, consigne en étapes numérotées). Un exemple guidé
`fp-worked` précède l’exercice 2. Chaque exercice annonce
`• Temps : réflexion N min · travail M min · correction K min`.

### 2.3 La page de Word

Le rendu v2 `page` du B3-03 : une page dessinée, à côté `Syntaxe :`, `Le piège :`, `Exemple :`, puis
une correspondance par pastille. Les champs de fusion s’y montrent comme dans Word, entre chevrons,
marqués comme champs. Les exemples sont des extraits inventés, dits tels, sur les clients du Fournil
du Port : aucune page ne reproduit la lettre attendue ni une réponse d’exercice.

### 2.4 Les fichiers de travail

| Fichier                           | Servi sur | Diffusion | Contenu                                                      |
| --------------------------------- | --------- | --------- | ------------------------------------------------------------ |
| `B3-04_contacts.<empreinte>.xlsx` | A1-02     | catalogue | un onglet Contacts, un contact par client, aucun e-mail      |
| `B3-04_contacts.<empreinte>.xlsx` | A1-03     | seance    | le même, réservé, pour qui arrive après l’accroche           |
| `B3-04_envoi.<empreinte>.xlsx`    | A3-04     | seance    | les colonnes de Contacts plus `email`, deux lignes de Rennes |

**Contacts.** Un onglet, `Contacts`, aux colonnes `client_id`, `raison_sociale`, `civilite`
(« Mme » ou « M. »), `prenom`, `nom`, `adresse`, `code_postal` (texte de cinq chiffres), `ville`,
`agence` (la ville de l’agence) et `ca_2026` (chiffre d’affaires HT de janvier à septembre 2026,
au centime). Un contact par client distinct du B3-01 : chaque jumeau, le client à la première
commande la plus récente d’une paire signalée en doublon, est retiré et ses commandes sont
rattachées à l’original. Le CA vient de la reprise nettoyée de l’acte 2 du B3-01. Civilité,
prénom, nom et adresse sont tirés d’un flux aléatoire dérivé de la graine du B3-01 ; les classeurs
du B3-01 ne changent pas. Aucune adresse e-mail.

**Envoi.** Les colonnes de `Contacts` dans le même ordre, plus `email`, sur deux lignes de l’agence
de Rennes : la première « Mme », la seconde « M. ». Leurs adresses, `votre.adresse@ecole.example` et
`adresse.du.binome@ecole.example`, ne délivrent rien : l’étudiant les remplace par la sienne et celle
de son binôme. La lettre type de l’acte 2 s’y fusionne sans changement : mêmes colonnes, même onglet.

Le générateur est `test/helpers/formations/b3/b3-04/contacts.ts` ; `b3-04.classeurs.spec.ts` écrit les deux
classeurs avec `ECRIRE_CLASSEURS=1`, les relit sinon et y recompte chaque valeur notée.

### 2.5 Les règles du publipostage

Chaque correction des actes 1 et 2 dit sa règle ; la fiche récap les rassemble :

1. Une lettre type, une liste, une fusion : on n’écrit jamais deux fois la même lettre.
2. La liste se tient dans le tableur, une ligne par destinataire, une colonne par champ, en-têtes en
   première ligne.
3. Ce qui change d’une lettre à l’autre s’insère par un champ, jamais à la main.
4. On filtre dans Word, sans toucher au classeur.
5. On vérifie l’aperçu avant de fusionner.
6. Un destinataire ne reçoit que sa lettre.

### 2.6 Diffusion

Catalogue : l’accroche et le classeur des contacts, les onze pages, la fiche récap, la page de l’IA
et la fiche mémo. Tout le reste est servi en séance. Aucun écran catalogue ne porte une réponse
d’exercice.

### 2.7 Notation

Comptages exacts, tolérance nulle : les contacts de la liste, les lettres après le filtre, les
lettres qui commencent par « Chère Madame ». L’étudiant saisit le nombre seul ; l’énoncé le rappelle.
L’insertion des champs, la fusion, le PDF et l’envoi se notent par des votes sur le geste ; le reçu
se vérifie par une check-list libre, non notée.

## 3. Déroulé écran par écran

### 3.1 Vue d’ensemble

Identifiants : `B3-04-A{acte}-{rang}-{SLUG}`. « I » = interactif. « Q » = questions fermées notées.

| Rang | Identifiant                   | Min | Brique · rendu           |  I  |   Q | Diffusion |
| ---: | ----------------------------- | --: | ------------------------ | :-: | --: | --------- |
|    1 | B3-04-A1-01-RAPPEL-CHAMPS     |   2 | `fp-recall`              |  I  |   1 | seance    |
|    2 | B3-04-A1-02-ACCROCHE          |   1 | `fp-story` · v2 `hero`   |     |   0 | catalogue |
|    3 | B3-04-A1-03-VOTE-LETTRES      |   2 | `fp-vote`                |  I  |   0 | seance    |
|    4 | B3-04-A1-04-PAGE-PUBLIPOSTAGE |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|    5 | B3-04-A1-05-PAGE-SOURCE       |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|    6 | B3-04-A1-06-ATELIER-SOURCE    |  14 | `questionnaire`          |  I  |   2 | seance    |
|    7 | B3-04-A1-07-VOTE-CHAMP        |   2 | `fp-vote`                |  I  |   0 | seance    |
|    8 | B3-04-A1-08-PAGE-CHAMPS       |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|    9 | B3-04-A1-09-PAGE-FORMAT       |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   10 | B3-04-A1-10-EXEMPLE-CHAMPS    |   4 | `fp-worked`              |  I  |   0 | seance    |
|   11 | B3-04-A1-11-ATELIER-LETTRE    |  15 | `questionnaire`          |  I  |   2 | seance    |
|   12 | B3-04-A1-12-TRI-LETTRE        |  12 | `fp-cardsort`            |  I  |   1 | seance    |
|   13 | B3-04-A2-01-VOTE-FILTRE       |   2 | `fp-vote`                |  I  |   0 | seance    |
|   14 | B3-04-A2-02-PAGE-FILTRER      |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   15 | B3-04-A2-03-PAGE-REGLE        |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   16 | B3-04-A2-04-ATELIER-FILTRE    |  15 | `questionnaire`          |  I  |   2 | seance    |
|   17 | B3-04-A2-05-VOTE-APERCU       |   2 | `fp-vote`                |  I  |   0 | seance    |
|   18 | B3-04-A2-06-PAGE-APERCU       |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   19 | B3-04-A2-07-PAGE-FUSION       |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   20 | B3-04-A2-08-PAGE-PDF          |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   21 | B3-04-A2-09-ATELIER-FUSION    |  15 | `questionnaire`          |  I  |   2 | seance    |
|   22 | B3-04-A2-10-TRI-CORRECTIONS   |  14 | `fp-cardsort`            |  I  |   1 | seance    |
|   23 | B3-04-A2-11-FICHE-RECAP       |   2 | `fp-story` · v2 `grid`   |     |   0 | catalogue |
|   24 | B3-04-A3-01-VOTE-ENVOI        |   2 | `fp-vote`                |  I  |   0 | seance    |
|   25 | B3-04-A3-02-PAGE-E-MAILING    |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   26 | B3-04-A3-03-PAGE-PDF-JOINT    |   2 | `fp-story` · v2 `page`   |     |   0 | catalogue |
|   27 | B3-04-A3-04-ATELIER-ENVOI     |  14 | `questionnaire`          |  I  |   1 | seance    |
|   28 | B3-04-A3-05-RECU              |   4 | `fp-pro`                 |  I  |   0 | seance    |
|   29 | B3-04-A3-06-VOTE-IA           |   2 | `fp-vote`                |  I  |   0 | seance    |
|   30 | B3-04-A3-07-COURS-IA-LETTRE   |   3 | `fp-story` · v2 `lesson` |     |   0 | catalogue |
|   31 | B3-04-A3-08-AUDIT-LETTRE-IA   |  11 | `fp-cardsort`            |  I  |   1 | seance    |
|   32 | B3-04-A3-09-DEFI-CONSIGNE     |   7 | `fp-challenge`           |  I  |   0 | seance    |
|   33 | B3-04-A3-10-LETTRE-IA         |  10 | `fp-pro`                 |  I  |   0 | seance    |
|   34 | B3-04-A3-11-FICHE-MEMO        |   3 | `fp-story` · v2 `grid`   |     |   0 | catalogue |

Somme : 60 + 60 + 60 = 180. Exposition continue de 6 minutes au plus (A2-06 à A2-08). Treize
questions notées : sept votes, trois nombres, trois tris.

### 3.2 Acte 1 — La source, la lettre type, les champs (60 min)

#### A1-01 · `B3-04-A1-01-RAPPEL-CHAMPS` — 2 min · `fp-recall` · séance

- Titre public : « Rappel : ce qui change à chaque page »
- Pendant que les postes rejoignent. `b3-04-a1-rappel-champ` : « Page 2 sur 5 » au bas de chaque
  page ? Bonne : les champs ; piège : le taper (`numero-de-page-tape`).

#### A1-02 · `B3-04-A1-02-ACCROCHE` — 1 min · v2 `hero` · catalogue

- Titre public : « Publipostage et e-mailing »
- Nadia veut écrire à chaque client son chiffre d’affaires de l’année. Fond : la gravure du facteur
  de 1860. Pièce jointe publique : le classeur des contacts.

#### A1-03 · `B3-04-A1-03-VOTE-LETTRES` — 2 min · `fp-vote` · séance

- Titre public : « Vote : six cents lettres »
- Pièce jointe réservée : le classeur des contacts. Une lettre type et la liste, fusionnées (bonne) ;
  copier la lettre et changer chaque nom à la main (`lettre-recopiee-a-la-main`).

#### A1-04 · `B3-04-A1-04-PAGE-PUBLIPOSTAGE` — 2 min · v2 `page` · catalogue

- Titre public : « Page : les trois pièces du publipostage »
- Publipostage › Démarrer la fusion et le publipostage › Lettres ; la lettre type, la liste, la
  fusion.

#### A1-05 · `B3-04-A1-05-PAGE-SOURCE` — 2 min · v2 `page` · catalogue

- Titre public : « Page : lier la liste du tableur »
- Sélection des destinataires › Utiliser une liste existante, l’onglet, la case des en-têtes.

#### A1-06 · `B3-04-A1-06-ATELIER-SOURCE` — 14 min · `questionnaire` · séance

- Titre public : « Exercice 1 — La lettre type et sa liste »
- Temps : réflexion 1 min · travail 11 min · correction 2 min.
- `b3-04-a1-contacts`, `b3-04-a1-en-tetes` (vote noté). Règles dites : 1 et 2.

#### A1-07 · `B3-04-A1-07-VOTE-CHAMP` — 2 min · `fp-vote` · séance

- Titre public : « Vote : le nom du client dans la lettre »
- Insérer le champ (bonne) ; taper « «nom» » au clavier (`champ-tape-a-la-main`).

#### A1-08 · `B3-04-A1-08-PAGE-CHAMPS` — 2 min · v2 `page` · catalogue

- Titre public : « Page : insérer les champs de fusion »
- Insérer un champ de fusion, espaces et ponctuation entre les champs, Alt + F9.

#### A1-09 · `B3-04-A1-09-PAGE-FORMAT` — 2 min · v2 `page` · catalogue

- Titre public : « Page : le format d’un montant »
- Le code de champ et son format `\# "# ##0,00 €"`, mis à jour par F9.

#### A1-10 · `B3-04-A1-10-EXEMPLE-CHAMPS` — 4 min · `fp-worked` · séance

- Titre public : « Exemple guidé : le bloc d’adresse, champ par champ »
- Trois étapes : la ligne du nom, la ligne de la ville, l’aperçu.

#### A1-11 · `B3-04-A1-11-ATELIER-LETTRE` — 15 min · `questionnaire` · séance

- Titre public : « Exercice 2 — Les champs de la lettre »
- Temps : réflexion 1 min · travail 12 min · correction 2 min.
- `b3-04-a1-inserer`, `b3-04-a1-format-ca` (votes notés). Règle dite : 3.

#### A1-12 · `B3-04-A1-12-TRI-LETTRE` — 12 min · `fp-cardsort` · séance

- Titre public : « Exercice 3 — Tapé, champ ou règle ? »
- Temps : réflexion 1 min · travail 9 min · correction 2 min.
- Neuf passages de la lettre, trois cases : tapé une fois, champ, règle ; puis pause.

### 3.3 Acte 2 — Filtrer, adapter, fusionner, exporter (60 min)

#### A2-01 · `B3-04-A2-01-VOTE-FILTRE` — 2 min · `fp-vote` · séance

- Titre public : « Vote : les seuls clients de Rennes »
- Filtrer la liste dans Word sur `agence` (bonne) ; supprimer les autres lignes du classeur
  (`source-modifiee-pour-filtrer`) ; filtrer sur `ville` (`filtre-sur-le-mauvais-champ`).

#### A2-02 · `B3-04-A2-02-PAGE-FILTRER` — 2 min · v2 `page` · catalogue

- Titre public : « Page : filtrer les destinataires »
- Modifier la liste des destinataires › Filtrer : champ, comparaison, valeur.

#### A2-03 · `B3-04-A2-03-PAGE-REGLE` — 2 min · v2 `page` · catalogue

- Titre public : « Page : une règle Si…Alors…Sinon »
- Règles › Si…Alors…Sinon : champ, comparaison, texte si vrai, texte sinon.

#### A2-04 · `B3-04-A2-04-ATELIER-FILTRE` — 15 min · `questionnaire` · séance

- Titre public : « Exercice 4 — Les lettres de Rennes »
- Temps : réflexion 1 min · travail 12 min · correction 2 min.
- `b3-04-a2-lettres-rennes`, `b3-04-a2-chere-madame`. Règle dite : 4.

#### A2-05 · `B3-04-A2-05-VOTE-APERCU` — 2 min · `fp-vote` · séance

- Titre public : « Vote : avant de fusionner »
- Parcourir l’aperçu et vérifier les erreurs (bonne) ; fusionner et imprimer tout de suite
  (`fusion-sans-apercu`).

#### A2-06 · `B3-04-A2-06-PAGE-APERCU` — 2 min · v2 `page` · catalogue

- Titre public : « Page : l’aperçu des résultats »
- Aperçu des résultats, flèches d’enregistrement, Rechercher un destinataire, Vérification des
  erreurs.

#### A2-07 · `B3-04-A2-07-PAGE-FUSION` — 2 min · v2 `page` · catalogue

- Titre public : « Page : fusionner en documents individuels »
- Terminer et fusionner › Modifier des documents individuels : un document, une lettre par section.

#### A2-08 · `B3-04-A2-08-PAGE-PDF` — 2 min · v2 `page` · catalogue

- Titre public : « Page : le PDF d’une lettre, le PDF de toutes »
- Le document fusionné enregistré en PDF ; une seule lettre par « Enregistrement en cours ».

#### A2-09 · `B3-04-A2-09-ATELIER-FUSION` — 15 min · `questionnaire` · séance

- Titre public : « Exercice 5 — Fusionner et enregistrer en PDF »
- Temps : réflexion 1 min · travail 12 min · correction 2 min.
- `b3-04-a2-fusionner`, `b3-04-a2-pdf-client` (votes notés). Règles dites : 5 et 6.

#### A2-10 · `B3-04-A2-10-TRI-CORRECTIONS` — 14 min · `fp-cardsort` · séance

- Titre public : « Exercice 6 — Où corriger ? »
- Temps : réflexion 1 min · travail 11 min · correction 2 min.
- Neuf défauts vus à l’aperçu, trois cases : la liste, le champ, la règle.

#### A2-11 · `B3-04-A2-11-FICHE-RECAP` — 2 min · v2 `grid` · catalogue

- Titre public : « Fiche récap : le publipostage »
- Six cartes, une par règle du § 2.5, chacune avec ses gestes. Imprimable.

### 3.4 Acte 3 — Envoyer, puis faire écrire par une IA (60 min)

#### A3-01 · `B3-04-A3-01-VOTE-ENVOI` — 2 min · `fp-vote` · séance

- Titre public : « Vote : envoyer la lettre par courriel »
- Un courriel par destinataire, champ À sur la colonne e-mail (bonne) ; un seul courriel, toutes
  les adresses en copie (`destinataires-en-copie`).

#### A3-02 · `B3-04-A3-02-PAGE-E-MAILING` — 2 min · v2 `page` · catalogue

- Titre public : « Page : chemin 1, l’e-mailing depuis Word »
- Terminer et fusionner › Envoyer des messages électroniques : À, Objet, Format ; Outlook classique
  pour Windows.

#### A3-03 · `B3-04-A3-03-PAGE-PDF-JOINT` — 2 min · v2 `page` · catalogue

- Titre public : « Page : chemin 2, la lettre en PDF joint »
- Une lettre fusionnée en PDF, jointe à un courriel écrit à la main.

#### A3-04 · `B3-04-A3-04-ATELIER-ENVOI` — 14 min · `questionnaire` · séance

- Titre public : « Exercice 7 — Envoyer à vous et à votre binôme »
- Temps : réflexion 1 min · travail 11 min · correction 2 min.
- Pièce jointe réservée : le classeur d’envoi. Deux chemins dans la consigne. `b3-04-a3-envoi`
  (vote noté : champ À, objet, format).

#### A3-05 · `B3-04-A3-05-RECU` — 4 min · `fp-pro` · séance

- Titre public : « Le courriel reçu »
- Check-list libre, non notée : expéditeur, objet, formule d’appel, montant, pièce jointe.

#### A3-06 · `B3-04-A3-06-VOTE-IA` — 2 min · `fp-vote` · séance

- Titre public : « Vote : la lettre écrite par une IA »
- Remplacer chaque crochet par le champ inséré (bonne) ; la garder telle quelle, crochets compris
  (`texte-d-ia-repris-sans-relecture`) ; taper les noms dans les crochets (`champ-tape-a-la-main`).

#### A3-07 · `B3-04-A3-07-COURS-IA-LETTRE` — 3 min · v2 `lesson` · catalogue

- Titre public : « Cours : une IA qui écrit la lettre type »
- La consigne en cinq parties, les colonnes données à l’IA, la relecture, les champs insérés.

#### A3-08 · `B3-04-A3-08-AUDIT-LETTRE-IA` — 11 min · `fp-cardsort` · séance

- Titre public : « Exercice 8 — Relire la lettre d’une IA »
- Temps : réflexion 2 min · travail 7 min · correction 2 min.
- Huit phrases d’une lettre type écrite pour le cours, dite telle : juste, colonne inventée, valeur
  tapée en dur, promesse inventée.

#### A3-09 · `B3-04-A3-09-DEFI-CONSIGNE` — 7 min · `fp-challenge` · séance

- Titre public : « Exercice 9 — Votre consigne pour la lettre type »
- Temps : réflexion 1 min · travail 4 min · correction 2 min.
- Cinq parties de référence et une consigne fausse, « Écris une lettre à mes clients ».

#### A3-10 · `B3-04-A3-10-LETTRE-IA` — 10 min · `fp-pro` · séance

- Titre public : « L’IA au travail : la lettre de relance »
- L’étudiant fait écrire une lettre de relance par son IA, la relit, la colle en texte seul et y
  insère les champs. Trois réponses libres.

#### A3-11 · `B3-04-A3-11-FICHE-MEMO` — 3 min · v2 `grid` · catalogue

- Titre public : « Fiche mémo : envoyer et faire écrire »
- Les deux chemins d’envoi, la consigne, la relecture. Imprimable.

## 4. La lettre attendue

La lettre de Nadia aux clients de l’agence de Rennes : l’adresse (`raison_sociale`, `prenom` `nom`,
`adresse`, `code_postal` `ville`), la formule d’appel par la règle « Si `civilite` est égal à Mme
alors Chère Madame sinon Cher Monsieur », suivie de sa virgule et jamais du nom, puis le corps qui
cite `ca_2026` au format `# ##0,00 €`. Les pages ne la reproduisent pas. Un client sans achat en
2026 reçoit « 0,00 € » : la correction de l’exercice 4 le montre et nomme la règle de relance
Si `ca_2026` égal à 0, sans la faire poser.

## 5. Contenus

### 5.1 Les valeurs attendues

| Question                  | Ce que l’étudiant lit                                                  | Valeur |
| ------------------------- | ---------------------------------------------------------------------- | -----: |
| `b3-04-a1-contacts`       | enregistrements de la liste des destinataires                          |    596 |
| `b3-04-a2-lettres-rennes` | lettres après le filtre `agence` égal à Rennes                         |     50 |
| `b3-04-a2-chere-madame`   | lettres fusionnées qui commencent par « Chère Madame », par Rechercher |     23 |

Pièges, recomptés dans le classeur : 597 en comptant la ligne d’en-tête, 18 en filtrant sur `ville`,
27 en inversant la règle.

### 5.2 Concepts, confusions et remédiations

Concepts nouveaux : `source-de-publipostage`, `champ-de-fusion`, `regle-de-fusion`,
`fusion-et-pdf`, `e-mailing`.

| Identifiant                                 | Concept                | Libellé                                                                  | Remédiation                   |
| ------------------------------------------- | ---------------------- | ------------------------------------------------------------------------ | ----------------------------- |
| `numero-de-page-tape`                       | mise-en-page           | Taper le numéro de page au lieu d’insérer son champ.                     | B3-04-A1-01-RAPPEL-CHAMPS     |
| `lettre-recopiee-a-la-main`                 | source-de-publipostage | Recopier la lettre pour chaque destinataire au lieu de la fusionner.     | B3-04-A1-04-PAGE-PUBLIPOSTAGE |
| `ligne-d-en-tete-comptee`                   | source-de-publipostage | Compter la ligne d’en-tête parmi les destinataires.                      | B3-04-A1-05-PAGE-SOURCE       |
| `champ-tape-a-la-main`                      | champ-de-fusion        | Taper un nom de champ au clavier au lieu de l’insérer.                   | B3-04-A1-08-PAGE-CHAMPS       |
| `piece-de-la-lettre-confondue`              | champ-de-fusion        | Confondre texte commun, champ et règle dans la lettre type.              | B3-04-A1-08-PAGE-CHAMPS       |
| `format-du-nombre-ignore`                   | champ-de-fusion        | Laisser un montant fusionné sans son format.                             | B3-04-A1-09-PAGE-FORMAT       |
| `filtre-sur-le-mauvais-champ`               | regle-de-fusion        | Filtrer sur une autre colonne que celle du critère.                      | B3-04-A2-02-PAGE-FILTRER      |
| `source-modifiee-pour-filtrer`              | regle-de-fusion        | Supprimer des lignes du classeur pour filtrer.                           | B3-04-A2-02-PAGE-FILTRER      |
| `condition-inversee`                        | regle-de-fusion        | Inverser le texte si vrai et le texte sinon d’une règle.                 | B3-04-A2-03-PAGE-REGLE        |
| `fusion-sans-apercu`                        | fusion-et-pdf          | Fusionner sans avoir parcouru l’aperçu.                                  | B3-04-A2-06-PAGE-APERCU       |
| `correction-au-mauvais-endroit`             | fusion-et-pdf          | Corriger dans le document fusionné ce qui vient de la liste ou du champ. | B3-04-A2-06-PAGE-APERCU       |
| `lettre-type-exportee-au-lieu-de-fusionnee` | fusion-et-pdf          | Enregistrer la lettre type en PDF au lieu des lettres fusionnées.        | B3-04-A2-07-PAGE-FUSION       |
| `pdf-de-toutes-les-lettres-a-chacun`        | fusion-et-pdf          | Joindre à un client le PDF de toutes les lettres.                        | B3-04-A2-08-PAGE-PDF          |
| `destinataires-en-copie`                    | e-mailing              | Envoyer un seul courriel, tous les destinataires en copie.               | B3-04-A3-02-PAGE-E-MAILING    |
| `champ-a-mal-choisi`                        | e-mailing              | Régler le champ À sur une autre colonne que l’e-mail.                    | B3-04-A3-02-PAGE-E-MAILING    |
| `format-de-message-texte-brut`              | e-mailing              | Envoyer la lettre en texte brut : sa mise en forme se perd.              | B3-04-A3-02-PAGE-E-MAILING    |
| `texte-d-ia-repris-sans-relecture`          | ia-redactrice          | Reprendre un texte d’IA sans le relire contre sa source.                 | B3-04-A3-07-COURS-IA-LETTRE   |
| `texte-d-ia-rejete-sans-relecture`          | ia-redactrice          | Rejeter un texte d’IA juste sans l’avoir comparé à sa source.            | B3-04-A3-07-COURS-IA-LETTRE   |
| `ecart-d-ia-mal-nomme`                      | ia-redactrice          | Voir l’écart d’un texte d’IA sans nommer sa nature.                      | B3-04-A3-07-COURS-IA-LETTRE   |

## 6. Fonctionnalités

Aucun ajout au moteur : le rendu `page`, la pièce jointe publique et le classeur réservé existent.
Les deux classeurs sont générés et relus par `b3-04.classeurs.spec.ts`.

## 7. Front

Instantané, montage `montage-b3-04.spec.ts`, entrée de `COURS_EN_SEANCE`, carte de la liste des
formations, SEO, XLF fr et en, le classeur des contacts sous `/assets/cours/b3-04/`, la gravure sous
`/assets/cours/gravures/v1/`.

## 8. Médias

### 8.1 Principe

Aucune infographie : les écrans de Word sont dessinés par le moteur (décision de Tim, 13 novembre
2026). L’accroche reprend une gravure du domaine public, servie depuis `/assets/cours/gravures/v1/`.

### 8.2 Catalogue des médias

| Fichier                           | Rôle             | Écran | Diffusion | Servi par                     |
| --------------------------------- | ---------------- | ----- | --------- | ----------------------------- |
| `B3-04_contacts.<empreinte>.xlsx` | contacts         | A1-02 | catalogue | front, `/assets/cours/b3-04/` |
| `B3-04_contacts.<empreinte>.xlsx` | contacts         | A1-03 | seance    | API, poste et pupitre         |
| `B3-04_envoi.<empreinte>.xlsx`    | classeur d’envoi | A3-04 | seance    | API, poste et pupitre         |

| Id  | Écran | Fichier source (page)                                                               | Original              | Auteur, date                                          | Licence        | Dérivé servi       | Attribution affichée                                                                           |
| --- | ----- | ----------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------- | -------------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| M1  | A1-02 | https://commons.wikimedia.org/wiki/File:Le_facteur,_Paris_Musées_20230525203912.jpg | JPEG 1 804 × 2 952 px | Henry Monnier, « Le facteur », gravure sur bois, 1860 | domaine public | `facteur-1860.jpg` | « Henry Monnier, « Le facteur », gravure sur bois, 1860 · Wikimedia Commons (domaine public) » |

### 8.3 Sources

- Norvane Équipement, ses clients et ses chiffres : données fictives générées pour le B3-01 ; les
  contacts du B3-04 en dérivent.
- La lettre de l’exercice 8 : écrite pour ce cours, dite telle à l’écran.
- « Le facteur », Henry Monnier, gravure sur bois, 1860, Musée Carnavalet, Paris Musées, versée au
  domaine public (CC0).
- Programme « Outils informatiques du manager » B3 2026-27 (document de l’école, non versionné).
