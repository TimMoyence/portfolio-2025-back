# Module formations

Séances de cours en classe : le formateur ouvre une séance, les étudiants la rejoignent par un code à quatre chiffres et répondent depuis leur poste ; le serveur corrige, agrège, puis, à la clôture, enregistre les notes et envoie les copies.

## Le cours est servi par le serveur

- Le contenu des cours est stocké en base dans `formation_course_contents` (une ligne par version publiée d'un slug) et `formation_screen_contents` (un écran par ligne, ordonné par `position`). Le B2-01 migré compte 72 écrans et 14 quiz notés, en version 1 et en version 2 (deck visuel). Une version publiée est immuable : un trigger refuse toute mise à jour ou suppression ; une correction passe par une nouvelle version.
- Le catalogue de production est `CoursCatalogueRepositoryTypeORM` (`src/modules/formations/infrastructure/CoursCatalogue.repository.typeorm.ts`). Il ne fait que transmettre les colonnes au domaine : `lireCoursStocke` (`src/modules/formations/domain/cours/CoursStocke.ts`) valide le contenu à chaque lecture et construit le `Cours`, sans valeur par défaut. Brique `fp-story`, concepts et confusions connus, quiz noté complet (identifiants d'options uniques, bonne réponse parmi les options, une confusion par option piège, `noteCompte` explicite), guide, correction et présentation sans clé inconnue, quiz affiché identique au quiz noté, correction d'accord avec la bonne réponse. Un contenu hors contrat lève `ContenuDeCoursInvalideError` : la requête répond `500` (détail masqué en production) et le journal nomme le cours, la version et le champ fautif.
- À l'ouverture, `trouverCourant` fournit la dernière version publiée ; la séance la fige dans `formation_sessions.course_version` et toutes ses lectures (sujet, déroulé, pilotage, résultats, clôture) relisent cette version, même après une nouvelle publication.
- Un cours évalué ouvre avec son barème et soixante tirages non ambigus ; un cours sans question ouvre avec un barème vide et attribue seulement une graine technique unique par participant. Le barème est stocké dans `formation_sessions.bareme` (jsonb) et ne quitte jamais le serveur.
- Le client n'envoie pas de barème : un champ `bareme` dans le corps d'ouverture est refusé en `400` (`property bareme should not exist`).
- Réponses libres, annotations formateur, groupes et scores sont persistés par séance (`formation_free_responses`, `formation_teacher_annotations`, `formation_groups`, `formation_scores`).

## Routes

Préfixe : `API_PREFIX` puis `/formations`. Swagger (`/docs`) porte le détail des DTO.

### Formateur

Rôle `teacher` requis. Sur les routes portant un `:id`, le cas d'usage applique en plus la règle de propriété de la séance (`src/modules/formations/domain/SessionOwnership.ts`) :

- **lectures** (`results`, `report`, `deroule`, `free-responses`, `annotations`, `groups`, `participants` en `GET`) : le formateur propriétaire ou un administrateur (rôle `admin`, avec ou sans `teacher`) ; `403` pour tout autre formateur ;
- **écritures et pilotage** (`start`, `control`, `close`, `presenter-stream`, `POST annotations`, groupes et affectations) : le seul formateur propriétaire ; `403` pour tout autre appelant, administrateur compris ;
- `404` quand la séance n'existe pas.

| Méthode  | Route                                            | Contrat                                                                                                                                                                                        |
| -------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`   | `sessions`                                       | Corps `{ courseSlug }` ; `201 { sessionId, code }` ; `404` si le cours est absent du catalogue ; `409` pour un cours évalué qui ne produit pas assez de tirages non ambigus.                   |
| `POST`   | `sessions/:id/start`                             | `204` ; libère les réponses.                                                                                                                                                                   |
| `PATCH`  | `sessions/:id/control`                           | Corps `{ ecran?, mode?, intervalle? }` ; `204`. Voir la borne d'écran ci-dessous.                                                                                                              |
| `POST`   | `sessions/:id/close`                             | `204` ; enregistre les notes et les statistiques, envoie la synthèse au formateur et une copie à chaque étudiant ; `409` si la séance est déjà terminée.                                       |
| `GET`    | `sessions/:id/results`                           | Rapport (`courseSlug`, `code`, `ouverteLe`, `fermeeLe`, `participants`, `conceptsFragiles`), agrégat `resultats`, `statistiques` et `notation` (voir « Résultats et notation »).               |
| `GET`    | `sessions/:id/report`                            | Même contenu que `results`, servi en pièce jointe `bilan-seance.json`.                                                                                                                         |
| `GET`    | `sessions/:id/deroule`                           | Déroulé annoté : écrans avec `notes`, `seuil`, `corriges` et, s'il existe, `guide` (`aDire`, `question`, `reponse`, `calcul`, `relance`, `transition`), puis `remediations`.                   |
| `GET`    | `sessions/:id/presenter-stream`                  | Flux SSE du formateur : `etat`, `resultats`, `heartbeat`, `fin`.                                                                                                                               |
| `GET`    | `sessions/:id/free-responses`                    | Réponses libres de la séance, sans correction automatique.                                                                                                                                     |
| `GET`    | `sessions/:id/participants`                      | Participants de la séance avec leur groupe (`id`, `prenom`, `nom`, `groupId`).                                                                                                                 |
| `GET`    | `sessions/:id/annotations`                       | Annotations du formateur propriétaire, par écran et groupe.                                                                                                                                    |
| `POST`   | `sessions/:id/annotations`                       | Corps `{ screenId, groupName, note }` ; `201` ; la dernière écriture pour un même écran et groupe remplace la précédente ; `400` si le groupe ou la note est vide une fois les blancs retirés. |
| `GET`    | `sessions/:id/groups`                            | Groupes de la séance.                                                                                                                                                                          |
| `POST`   | `sessions/:id/groups`                            | Corps `{ name }` ; `201` ; `400` si le nom est vide ; `409` `NOM_DE_GROUPE_DEJA_PRIS` si le nom existe déjà dans la séance.                                                                    |
| `PATCH`  | `sessions/:id/groups/:groupId`                   | Corps `{ name }` ; `200` ; `400` si le nom est vide ; `404` si le groupe n'appartient pas à la séance ; `409` `NOM_DE_GROUPE_DEJA_PRIS`.                                                       |
| `PATCH`  | `sessions/:id/participants/:participantId/group` | Corps `{ groupId }` ; `204` ; `404` si le groupe ou le participant n'appartient pas à la séance.                                                                                               |
| `DELETE` | `sessions/:id/participants/:participantId/group` | `204` ; retire l'affectation ; `404` si le participant n'appartient pas à la séance.                                                                                                           |

### Étudiant

Routes publiques. Hors inscription, chaque appel présente le jeton rendu à l'inscription dans l'en-tête `x-participant-token` (`401` sinon).

| Méthode | Route                         | Contrat                                                                                                                                                                                                      |
| ------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST`  | `sessions/:code/join`         | Corps `{ studentKey, prenom, nom, email }` ; `201 { participantId, sessionId, ecranCourant, modeRythme, jeton }`, sans barème ni graine.                                                                     |
| `GET`   | `sessions/:id/sujet`          | Sujet du tirage du participant, sans corrigé : `{ id, titre, niveau, duree, concepts, ecrans[] }`, écrans non encore révélés verrouillés ; `409` si le cours a changé depuis l'ouverture.                    |
| `POST`  | `sessions/:id/answers`        | Corps `{ questionId, valeur, dureeMs }` pour les questions notées ; `201` avec le verdict ; `409` avec un `code` (voir « Refus d'une réponse »).                                                             |
| `POST`  | `sessions/:id/free-responses` | Corps `{ screenId, activityId, response, dureeMs }` ; `201 { status: 'enregistre' }`, la dernière réponse d'une activité remplace la précédente ; `400` si la réponse est vide ; `409` hors séance en cours. |
| `POST`  | `sessions/:id/incidents`      | Journal d'incidents du poste ; `204`.                                                                                                                                                                        |
| `GET`   | `sessions/:id/due-questions`  | Questions à revoir selon les boîtes de Leitner.                                                                                                                                                              |
| `GET`   | `sessions/:id/stream`         | Flux SSE de l'étudiant : `etat`, `heartbeat`, `fin`.                                                                                                                                                         |

### Catalogue public

| Méthode | Route             | Contrat                                                                                                                                                               |
| ------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`   | `catalogue/:slug` | Sans authentification. Sujet public de la dernière version publiée (tirage de référence), sans notes, guide, correction ni quiz noté ; `404` si le cours est inconnu. |

## Contrats à connaître

- **Sujet** : `GET sessions/:id/sujet` recalcule le tirage du participant depuis la version figée du cours et le compare au barème stocké. S'ils divergent, la route rend `409` : le formateur doit ouvrir une nouvelle séance.
- **Graine et contenu noté** : la graine attribuée à un participant et le barème ne quittent jamais le serveur. Le quiz noté (bonne réponse, confusions), les notes, le guide et les corrections ne sont servis qu'au formateur, par le déroulé ; le sujet et le catalogue public n'en portent aucun.
- **Refus d'une réponse** : `POST sessions/:id/answers` et `POST sessions/:id/free-responses` distinguent leurs conflits par le champ `code` du corps RFC 7807, à lire à la place du texte `detail`. `SEANCE_NON_DEMARREE` : le formateur n'a pas encore démarré la séance. `SEANCE_TERMINEE` : la séance est close. `REPONSE_DEJA_ENREGISTREE` (réponses notées seulement) : ce participant a déjà répondu à cette question, la première réponse fait foi.
- **Verdict** : `misconception` est l'identifiant de la confusion détectée, `libelleConfusion` son libellé lisible (banque `src/modules/formations/domain/cours/banque/confusions.ts`) ; les deux valent `null` quand aucune confusion n'est reconnue, réponse juste comprise. Le verdict ne porte jamais la réponse attendue.
- **Réponses d'un étudiant** (`results.participants[].reponses[]`, copie envoyée à l'étudiant, CSV de la synthèse) : `valeur` garde la valeur envoyée ; `reponse` la rend lisible, le libellé de l'option pour un vote (recalculé par `tirer(cours, graine)` sur la version figée du cours), « Je ne sais pas » en toutes lettres, la valeur telle quelle sinon. Si le cours a disparu du catalogue ou si son tirage échoue, `reponse` garde l'identifiant de l'option ; un échec du tirage ne casse ni la clôture ni `GET results` et laisse un seul avertissement au journal (séance, cours, nom de l'erreur, sans graine ni donnée personnelle). Dans le rapport, la synthèse et son CSV, les étudiants suivent leur ordre d'arrivée et leurs réponses l'ordre des questions du barème ; à rang égal, l'horodatage puis l'identifiant départagent.
- **Événement `resultats`** : poussé sur le seul flux du formateur, à l'ouverture du flux puis à chaque nouvelle inscription ou réponse ; il porte `participants`, `questions[]` et `statistiques`, recalculés à la volée sans rien écrire. Le flux étudiant ne le reçoit jamais.
- **Borne d'écran** : `ecran` est un entier de `0` au nombre d'écrans de la version figée exclu, et un `intervalle` de rythme libre doit tenir dans le cours. Hors borne, `PATCH control` rend `400` et n'écrit ni ne publie rien.
- **Déroulé** : il révèle les bonnes réponses du tirage de référence ; il n'est servi qu'au formateur propriétaire et aux administrateurs, jamais à un poste étudiant.

## Résultats et notation

`GET results` (et `report`) rend :

- `resultats` : `{ participants, questions[] }`, chaque question donnant `questionId`, `total`, `correctes`, `neSaitPas` et `confusions[] { id, libelle, nombre }` triées par fréquence ;
- `statistiques` : `moyenne`, `mediane` et `dispersion` (écart type) des notes, arrondies à deux décimales ; `tauxParticipation`, part des participants ayant répondu à au moins une question notée ; `tauxReussite`, réponses correctes sur réponses enregistrées ; `questionsProblemes`, questions dont moins de 70 % des réponses sont correctes ;
- `notation` : la règle appliquée, `REGLE_DE_NOTATION` (`src/modules/formations/domain/RegleDeNotation.ts`), rendue telle quelle.

La règle en clair :

1. La note est une **note de participation sur 20, relative à la classe** : elle ne mesure pas la justesse des réponses (portée par `resultats` et `tauxReussite`).
2. La **complétion** d'un étudiant est la part des questions notées (`noteCompte`) auxquelles il a répondu. « Je ne sais pas » compte comme une réponse, une question sans réponse vaut 0, les réponses libres ne sont pas notées.
3. La **référence** est la complétion de l'étudiant qui ferme le premier cinquième de la classe (rang `⌈20 % × effectif⌉` par complétion décroissante).
4. **Note** = `min(20, 20 × complétion / référence)`, et 0 si la référence est nulle. Un étudiant est signalé **sous le seuil** quand sa complétion est inférieure à 40 % de la référence.

Les notes, complétions et statistiques ne sont écrites qu'**à la clôture** (`POST close`), dans `formation_scores` ; `results`, `report` et le flux formateur les recalculent sans rien écrire.

## Flux SSE et limites de débit

- **Budgets des flux** (`src/modules/formations/application/StreamSession.useCase.ts`) : cent flux étudiants simultanés par séance, deux flux simultanés par participant, et quatre places réservées au formateur propriétaire sur `presenter-stream` (pupitre, scène et reconnexions) que les flux étudiants n'occupent jamais. Une place se libère à la fermeture du flux. Avec Redis (`REDIS_URL` ou `REDIS_HOST`/`REDIS_PORT` renseignés), les places sont partagées entre processus ; si Redis est configuré mais injoignable, l'ouverture d'un flux est refusée en `429`. Sans Redis (`REDIS_URL` et `REDIS_HOST` vides), les plafonds ne sont tenus qu'en mémoire, par instance ; voir `.env.example`.
- **Le plus récent gagne** : au-delà de ses deux flux (participant) ou de ses quatre places (formateur), une ouverture ferme le plus ancien flux du même porteur et le nouveau est accepté. Le flux fermé se termine sans événement `fin`, que le front lirait comme la fin de la séance : un poste encore vivant se reconnecte. Une socket à demi ouverte n'est détectée morte qu'après l'échec des battements, jusqu'à une quinzaine de minutes ; elle ne bloque donc jamais une reconnexion. Seul le plafond de séance refuse en `429`, et seulement quand l'ouverture ne remplace pas un flux du même participant. Un flux formateur abandonné pendant son ouverture ne prend aucune place.
- **Limites de débit**, par fenêtre d'une minute (`src/modules/formations/interfaces/formations-throttling.ts`) :
  - `join` : 120 par code de séance ; les codes inconnus restent bornés par adresse (`src/modules/formations/interfaces/CodeScanProtection.service.ts`) ;
  - par participant, clé tirée du jeton après vérification de sa signature : `answers` 60, `free-responses` 60, `incidents` 30, `due-questions` 30, `stream` 30 ouvertures, `sujet` 20 ;
  - `control` : 240 par adresse ;
  - toute autre route : 30 par adresse (throttler global, `src/app.module.ts`).
  - Au-delà, `429`. Le throttler borne le rythme des ouvertures de flux, pas le nombre de flux tenus.

## Configuration

- `FORMATION_REVIEW_TOKEN_SECRET` (au moins 32 caractères) : signe les jetons de participant et les liens de révision.
- `FORMATION_TEACHER_NOTIFICATION_TO` : destinataire de la synthèse de clôture.
- `FORMATION_REVIEW_BASE_URL` : base des liens de révision envoyés aux étudiants.
- `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT` : plafonds de flux partagés (voir ci-dessus).

Les exemples sont dans `deploy/backend.env.example` (production) et `.env.example` (local).

## Migrations

- Les tables des séances viennent de `1778900000000-CreateFormations`, puis de `1780300000000` à `1780600000000` (réponses libres, annotations, groupes, scores). Le contenu du B2-01, ses versions et le rattrapage des séances déjà ouvertes s'étalent de `1779100000000` à `1780200000000` (publication du deck visuel en version 2). `1789818127042-DropFormationScreenNotesDefault` retire le défaut vide de `formation_screen_contents.notes`, qu'interdit le CHECK `chk_formation_screen_notes_not_blank`.
- Les migrations de données `1779200000000`, `1779300000000`, `1779600000000`, `1779700000000` et `1779800000000` sont irréversibles : leur `down()` lève « Migration de données irréversible » sans rien exécuter.
- `1789893879954-InsertB2CoursV3` insère la version 3 du B2-01 (52 écrans, 38 remédiations, 5 médias) **sans la publier** : `formation_course_publications` reste sur la version 2, et la bascule appartient à `PUT catalogue/:slug/publication`. Elle refuse le contenu que `lireCoursStocke` ou `verifierStructure` rejettent, ne réinsère rien si la version 3 existe déjà, et son `down()` refuse de supprimer un contenu publié ou servi par une séance.
- Les entités déclarent les clefs étrangères, CHECK, index et verrous d'unicité de la base sous leurs noms réels ; un test DB compare les deux (`test/formations-repositories.db-integration.spec.ts`).

## Tests

- Unitaires (`pnpm test`) : domaine, cas d'usage et dépôts. Le contrat du contenu stocké est couvert par `src/modules/formations/domain/cours/CoursStocke.spec.ts` et `src/modules/formations/infrastructure/CoursCatalogue.repository.typeorm.spec.ts`.
- Contrats HTTP et SSE (`pnpm run test:e2e:http`) : `test/formations-session.http-socket.spec.ts` (séance complète, flux, contrat OpenAPI), `test/formations-acces-formateur.http-socket.spec.ts` (matrice d'accès propriétaire, administrateur et autre formateur, codes 400/404/409) et `test/formations-catalogue.http-socket.spec.ts` (catalogue public). Ces suites montent l'application sur des dépôts en mémoire et un catalogue de test (`test/helpers/formations-harness.ts`, `test/factories/cours.factory.ts`).
- Postgres (`pnpm run test:integration:db:local`, qui monte puis arrête le Postgres de test) : `test/formations-{repositories,catalogue-b2,concurrence,resilience,seance,repetition-b2-01}.db-integration.spec.ts`. Chaque suite ouvre `ouvrirContexteFormations()` (`test/helpers/formations-db.ts`), qui rejoue toute la chaîne des migrations formations, contenu B2 compris, et expose les vrais dépôts TypeORM, catalogue compris (`contexte.catalogue`).
- Répétition à blanc sur le vrai B2 : `test/formations-repetition-b2-01.db-integration.spec.ts` monte `monterBancFormations()` sans catalogue de test, donc sur `CoursCatalogueRepositoryTypeORM`, lit la version publiée (2, 72 écrans, 14 quiz) et joue la séance de l'ouverture à la clôture pour trente étudiants.
- Séance complète sur la V3 migrée : `test/formations-e2e-seance-v3.db-integration.spec.ts` publie la version 3, ouvre une séance de capacité 4, déroule les 52 écrans et les 16 briques, éprouve `ECRAN_NON_SERVI`, `PHASE_FERMEE`, `PHASE_NON_MONOTONE`, `ENIGME_VERROUILLEE`, `TENTATIVES_EPUISEES`, `PRODUCTION_VIDE`, `SEANCE_COMPLETE`, `SEANCE_NON_DEMARREE`, `REPONSE_DEJA_ENREGISTREE` et `SEANCE_TERMINEE`, vérifie le flux `resultats` sur deux flux formateur, la reprise par `GET /moi`, la clôture, la rebascule vers la v2 et l'absence de ligne orpheline après suppression de la séance. `test/formations-v3-classe.db-integration.spec.ts` joue la même V3 migrée à trente-cinq postes pour les budgets d'AC-34.
- Graines : l'API ne rendant pas la graine, les suites Postgres la lisent en base (`contexte.graineDe(participantId)`) et recalculent côté test les réponses attendues par `tirer(cours, graine)`.
- Charge : `test/formations-charge.db-integration.spec.ts`, exclue de `test:integration:db` (`test/jest-db-integration.json`) et lancée à part par `pnpm run db:integration:up`, `pnpm run test:charge:run`, puis `pnpm run db:integration:down`. Elle joue un cours évalué de test.
