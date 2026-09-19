# Module formations

Seances de cours en classe : le formateur ouvre une seance, les etudiants la rejoignent par un code a quatre chiffres, repondent depuis leur poste, et le serveur corrige, agrege et envoie les copies a la cloture.

## Le cours est servi par le serveur

- Le contenu des séances live est stocké en base dans `formation_course_contents` et `formation_screen_contents`. Le B2-01 migré compte 72 écrans et 14 interactions ; les propriétés `presentation` alimentent le renderer partagé. Les versions ouvertes sont immuables et les réponses libres, annotations, groupes et snapshots de score sont persistés par séance.
- Le catalogue de production est `CoursCatalogueRepositoryTypeORM`. Le domaine conserve les briques d’évaluation pour les cours qui en ont besoin, mais un cours sans question est un parcours d’exposition simple : pas de tirage, pas de correction et pas de contrainte artificielle d’ouverture/clôture.
- À l’ouverture, les cours évalués conservent leur barème et leurs tirages ; un cours sans question ouvre avec un barème vide et attribue seulement un seed technique unique par participant. Le barème est stocké dans `formation_sessions.bareme` (jsonb) et ne quitte jamais le serveur.
- Le client n'envoie plus de bareme : un champ `bareme` dans le corps d'ouverture est refuse en `400` (`property bareme should not exist`).

## Routes

Prefixe : `API_PREFIX` puis `/formations`. Swagger (`/docs`) porte le detail des DTO.

### Formateur

Role `teacher` requis ; chaque route portant un `:id` verifie en plus que l'appelant est le formateur proprietaire de la seance (`403` sinon).

| Methode  | Route                                            | Contrat                                                                                                                                                              |
| -------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`   | `sessions`                                       | Corps `{ courseSlug }` ; `201 { sessionId, code }` ; `404` si le cours est absent du catalogue ; `409` seulement pour un cours évalué dont les tirages sont ambigus. |
| `POST`   | `sessions/:id/start`                             | `204` ; libere les reponses.                                                                                                                                         |
| `PATCH`  | `sessions/:id/control`                           | Corps `{ ecran?, mode?, intervalle? }` ; `204`. Voir la borne d'ecran ci-dessous.                                                                                    |
| `POST`   | `sessions/:id/close`                             | `204` ; envoie la synthese au formateur et une copie a chaque etudiant.                                                                                              |
| `GET`    | `sessions/:id/results`                           | Rapport (`courseSlug`, `code`, `ouverteLe`, `fermeeLe`, `participants`, `conceptsFragiles`) et agregat `resultats`.                                                  |
| `GET`    | `sessions/:id/deroule`                           | Déroulé annoté : écrans avec `notes`, `seuil` et `corriges`, puis `remediations`. Les quiz du B2-01 ont des corrections réservées au formateur.                      |
| `GET`    | `sessions/:id/presenter-stream`                  | Flux SSE du formateur : `etat`, `resultats`, `heartbeat`, `fin`.                                                                                                     |
| `GET`    | `sessions/:id/free-responses`                    | Réponses libres de la séance, réservées au formateur propriétaire.                                                                                                   |
| `GET`    | `sessions/:id/annotations`                       | Notes formateur synchronisées par écran et groupe.                                                                                                                   |
| `POST`   | `sessions/:id/annotations`                       | Corps `{ screenId, groupName, note }` ; écriture idempotente.                                                                                                        |
| `GET`    | `sessions/:id/groups`                            | Groupes persistés de la séance.                                                                                                                                      |
| `POST`   | `sessions/:id/groups`                            | Corps `{ name }` ; crée un groupe dans la séance.                                                                                                                    |
| `PATCH`  | `sessions/:id/groups/:groupId`                   | Corps `{ name }` ; renomme un groupe de la séance.                                                                                                                   |
| `PATCH`  | `sessions/:id/participants/:participantId/group` | Corps `{ groupId }` ; affecte un participant à un groupe.                                                                                                            |
| `DELETE` | `sessions/:id/participants/:participantId/group` | Retire l'affectation du participant.                                                                                                                                 |

### Etudiant

Routes publiques. Hors inscription, chaque appel presente le jeton rendu a l'inscription dans l'en-tete `x-participant-token`.

| Methode | Route                         | Contrat                                                                                                                                            |
| ------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`  | `sessions/:code/join`         | Corps `{ studentKey, prenom, nom, email }` ; `201 { participantId, sessionId, ecranCourant, modeRythme, jeton }`, sans la graine du tirage.        |
| `GET`   | `sessions/:id/sujet`          | Sujet du tirage du participant, sans corrige : `{ id, titre, niveau, duree, concepts, ecrans[] }` ; `409` si le cours a change depuis l'ouverture. |
| `POST`  | `sessions/:id/answers`        | Corps `{ questionId, valeur, dureeMs }` pour les questions évaluées ; les réponses libres demanderont un contrat distinct.                         |
| `POST`  | `sessions/:id/free-responses` | Corps `{ screenId, activityId, response, dureeMs }` ; sauvegarde idempotente pour le participant signé.                                            |
| `POST`  | `sessions/:id/incidents`      | Journal d'incidents du poste ; `204`.                                                                                                              |
| `GET`   | `sessions/:id/due-questions`  | Questions a revoir selon les boites de Leitner.                                                                                                    |
| `GET`   | `sessions/:id/stream`         | Flux SSE de l'etudiant : `etat`, `heartbeat`, `fin`.                                                                                               |

## Contrats a connaitre

- **Sujet** : `GET sessions/:id/sujet` recalcule le tirage du participant depuis le cours du catalogue et le compare au bareme stocke. S'ils divergent (cours modifie apres l'ouverture), la route rend `409` : le formateur doit ouvrir une nouvelle seance.
- **Graine** : la graine attribuee a un participant ne quitte jamais le serveur. Le moteur de tirage et les cours sont publics : avec la graine, `tirer(cours, graine)` rendrait le corrige de l'etudiant.
- **Refus d'une reponse** : `POST sessions/:id/answers` distingue ses conflits par le champ `code` du corps RFC 7807, a lire a la place du texte `detail`. `SEANCE_NON_DEMARREE` : le formateur n'a pas encore demarre la seance. `REPONSE_DEJA_ENREGISTREE` : ce participant a deja repondu a cette question, la premiere reponse fait foi. `SEANCE_TERMINEE` : la seance est close et aucune nouvelle reponse n'est acceptee.
- **Verdict** : `misconception` est l'identifiant de la confusion detectee, `libelleConfusion` son libelle lisible (banque `domain/cours/banque/confusions.ts`) ; les deux valent `null` quand aucune confusion n'est reconnue, reponse juste comprise. Le verdict ne porte jamais la reponse attendue.
- **Resultats** : `results.resultats` vaut `{ participants, questions[] }`, chaque question donnant `questionId`, `total`, `correctes`, `neSaitPas` et `confusions[] { id, libelle, nombre }` triees par frequence. `results.statistiques` expose moyenne, médiane, dispersion, taux de participation, taux de réussite et questions problématiques ; ces valeurs et les notes individuelles sont sauvegardées dans `formation_scores` et le flux formateur les diffuse à chaque activité. Dans le rapport, la synthese et son CSV, les etudiants suivent leur ordre d'arrivee et leurs reponses l'ordre des questions du cours (rang dans `bareme.questions`, identique pour toute la classe, ce qui aligne les lignes du CSV) ; a rang egal, l'ordre d'ecriture du depot (horodatage, puis identifiant) departage.
- **Reponses d'un etudiant** (`results.participants[].reponses[]`, copie envoyee a l'etudiant, CSV de la synthese) : `valeur` garde la valeur envoyee ; `reponse` la rend lisible, le libelle de l'option pour un vote (recalcule par `tirer(cours, graine)` sur le tirage de l'etudiant), « Je ne sais pas » en toutes lettres, la valeur telle quelle sinon. Si le cours n'est plus au catalogue, a change depuis l'ouverture ou si son tirage echoue, `reponse` garde l'identifiant de l'option ; un echec du tirage ne casse ni la cloture ni `GET results` et laisse un seul avertissement au journal (seance, cours, nom de l'erreur, sans graine ni donnee personnelle). `libelleConfusion` porte le libelle de la confusion ; la colonne `confusion` du CSV l'affiche.
- **Evenement `resultats`** : pousse sur le seul flux du formateur, a l'ouverture du flux puis a chaque nouvelle inscription ou reponse ; meme forme que `results.resultats`. Le flux etudiant ne le recoit jamais.
- **Budgets des flux SSE** (`StreamSession.useCase.ts`) : Redis partage les leases entre processus quand `REDIS_URL` ou `REDIS_HOST`/`REDIS_PORT` est configure ; sans Redis, le mode memoire reste disponible pour le developpement. Les plafonds sont de cent flux etudiants simultanes par seance, deux flux simultanes par participant, et quatre places reservees au formateur proprietaire sur `presenter-stream` (pupitre, scene et reconnexions) que les flux etudiants n'occupent jamais. Une place se libere a la fermeture du flux. Le throttler borne le rythme des ouvertures, pas le nombre de flux tenus.
- **Le plus recent gagne** : au-dela de ses deux flux (participant) ou de ses quatre places (formateur), une ouverture ferme le plus ancien flux du meme porteur et le nouveau est accepte. Le flux ferme se termine sans evenement `fin`, que le front lirait comme la fin de la seance : un poste encore vivant se reconnecte. Une socket a demi ouverte (telephone qui change de reseau, onglet ferme pendant l'ouverture) n'est detectee morte qu'apres l'echec des battements, jusqu'a une quinzaine de minutes ; elle ne bloque donc jamais une reconnexion. Seul le plafond de seance refuse en `429`, et seulement quand l'ouverture ne remplace pas un flux du meme participant. Un flux formateur abandonne pendant son ouverture ne prend aucune place.
- **Limites de debit** (`formations-throttling.ts`, par fenetre d'une minute) : `join` 120 par code de seance, les codes inconnus restant bornes par adresse (`CodeScanProtection.service.ts`) ; par participant, cle tiree du jeton apres verification de sa signature : `answers` 60, `incidents` 30, `due-questions` 30, `stream` 30 ouvertures, `sujet` 20. Au-dela, `429`.
- **Borne d'ecran** : `ecran` est un entier de `0` au nombre d'ecrans du cours exclu, et un `intervalle` de rythme libre doit tenir dans le cours. Hors borne, `PATCH control` rend `400` et n'ecrit ni ne publie rien.
- **Deroule** : il revele les bonnes reponses du tirage de reference ; il n'est servi qu'au formateur proprietaire et ne doit jamais etre expose a un poste etudiant.

## Configuration

- `FORMATION_REVIEW_TOKEN_SECRET` (au moins 32 caracteres) : signe les jetons de participant et les liens de revision.
- `FORMATION_TEACHER_NOTIFICATION_TO` : destinataire de la synthese de cloture.
- `FORMATION_REVIEW_BASE_URL` : base des liens de revision envoyes aux etudiants.

Les exemples sont dans `deploy/backend.env.example`.

## Tests

- Contrats HTTP et SSE : `test/formations-session.http-socket.spec.ts` (`pnpm run test:e2e:http`).
- Postgres : `test/formations-{repositories,concurrence,resilience,seance,repetition-b2-01}.db-integration.spec.ts` et `test/formations-catalogue-b2.db-integration.spec.ts` (`pnpm run test:integration:db:local`, qui monte puis arrête le Postgres de test). Ce dernier rejoue les migrations du catalogue B2 ; les autres tests de séance rejouent encore uniquement la migration initiale des formations.
- Repetition a blanc : `test/formations-repetition-b2-01.db-integration.spec.ts` conserve la couverture de séance HTTP/Postgres ; le contenu métier du B2-01 est désormais lu depuis les tables de contenu, tandis que les suites unitaires utilisent des cours de test en mémoire.
- Catalogue et graines des suites : les suites HTTP, concurrence, resilience et seance montent un catalogue de test (`creerCatalogueDeTest(buildCoursDeClasse(12))`, `test/factories/cours.factory.ts`) pour ne pas dependre du contenu d'un cours publie. L'API ne rendant pas la graine, les suites Postgres la lisent en base (`contexte.graineDe(participantId)`, `test/helpers/formations-db.ts`) et recalculent cote test les reponses attendues par `tirer(cours, graine)`.
- Charge : `test/formations-charge.db-integration.spec.ts`, exclue de `test:integration:db` (`test/jest-db-integration.json`) et lancee a part par `pnpm run db:integration:up`, `pnpm run test:charge:run`, puis `pnpm run db:integration:down`. Elle conserve le scénario de charge sur un cours évalué de test, sans dépendre du contenu de production.
