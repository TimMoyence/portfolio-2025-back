# Module formations

Seances de cours en classe : le formateur ouvre une seance, les etudiants la rejoignent par un code a quatre chiffres, repondent depuis leur poste, et le serveur corrige, agrege et envoie les copies a la cloture.

## Le cours est servi par le serveur

- Les cours publies vivent dans `src/modules/formations/domain/cours/catalogue/` : un fichier par cours (`b1-01-proportions.ts`), inscrit dans `COURS_PUBLIES` (`index.ts`) qui alimente le catalogue `CATALOGUE_COURS_STATIQUE`.
- `coursPublies.spec.ts` rejoue chaque cours publie : structure pedagogique, identifiants uniques, confusions rattachees a un ecran de remediation, formules ne citant que des parametres declares, au plus 1 % de graines ecartees sur 500 et soixante tirages a l'ouverture. Publier un cours revient a ajouter son fichier au catalogue et a faire passer cette suite.
- A l'ouverture, le serveur tire le bareme du cours : soixante tirages distribues aux etudiants et une graine de reference reservee au deroule du formateur, graines dans `[0, 2 147 483 647)`, graines ambigues ecartees. Le bareme est stocke dans `formation_sessions.bareme` (jsonb) et ne quitte jamais le serveur.
- Le client n'envoie plus de bareme : un champ `bareme` dans le corps d'ouverture est refuse en `400` (`property bareme should not exist`).

## Routes

Prefixe : `API_PREFIX` puis `/formations`. Swagger (`/docs`) porte le detail des DTO.

### Formateur

Role `teacher` requis ; chaque route portant un `:id` verifie en plus que l'appelant est le formateur proprietaire de la seance (`403` sinon).

| Methode | Route                           | Contrat                                                                                                                       |
| ------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `POST`  | `sessions`                      | Corps `{ courseSlug }` ; `201 { sessionId, code }` ; `404` si le cours est absent du catalogue.                               |
| `POST`  | `sessions/:id/start`            | `204` ; libere les reponses.                                                                                                  |
| `PATCH` | `sessions/:id/control`          | Corps `{ ecran?, mode?, intervalle? }` ; `204`. Voir la borne d'ecran ci-dessous.                                             |
| `POST`  | `sessions/:id/close`            | `204` ; envoie la synthese au formateur et une copie a chaque etudiant.                                                       |
| `GET`   | `sessions/:id/results`          | Rapport (`courseSlug`, `code`, `ouverteLe`, `fermeeLe`, `participants`, `conceptsFragiles`) et agregat `resultats`.           |
| `GET`   | `sessions/:id/deroule`          | Deroule annote du tirage de reference : ecrans avec `notes`, `seuil` et `corriges`, puis `remediations`. Contient le corrige. |
| `GET`   | `sessions/:id/presenter-stream` | Flux SSE du formateur : `etat`, `resultats`, `heartbeat`, `fin`.                                                              |

### Etudiant

Routes publiques. Hors inscription, chaque appel presente le jeton rendu a l'inscription dans l'en-tete `x-participant-token`.

| Methode | Route                        | Contrat                                                                                                                                            |
| ------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`  | `sessions/:code/join`        | Corps `{ studentKey, prenom, nom, email }` ; `201 { participantId, sessionId, seed, ecranCourant, modeRythme, jeton }`.                            |
| `GET`   | `sessions/:id/sujet`         | Sujet du tirage du participant, sans corrige : `{ id, titre, niveau, duree, concepts, ecrans[] }` ; `409` si le cours a change depuis l'ouverture. |
| `POST`  | `sessions/:id/answers`       | Corps `{ questionId, valeur, dureeMs }` ; `201 { correcte, misconception, libelleConfusion }`.                                                     |
| `POST`  | `sessions/:id/incidents`     | Journal d'incidents du poste ; `204`.                                                                                                              |
| `GET`   | `sessions/:id/due-questions` | Questions a revoir selon les boites de Leitner.                                                                                                    |
| `GET`   | `sessions/:id/stream`        | Flux SSE de l'etudiant : `etat`, `heartbeat`, `fin`.                                                                                               |

## Contrats a connaitre

- **Sujet** : `GET sessions/:id/sujet` recalcule le tirage du participant depuis le cours du catalogue et le compare au bareme stocke. S'ils divergent (cours modifie apres l'ouverture), la route rend `409` : le formateur doit ouvrir une nouvelle seance.
- **Verdict** : `misconception` est l'identifiant de la confusion detectee, `libelleConfusion` son libelle lisible (banque `domain/cours/banque/confusions.ts`) ; les deux valent `null` quand aucune confusion n'est reconnue, reponse juste comprise. Le verdict ne porte jamais la reponse attendue.
- **Resultats** : `results.resultats` vaut `{ participants, questions[] }`, chaque question donnant `questionId`, `total`, `correctes`, `neSaitPas` et `confusions[] { id, libelle, nombre }` triees par frequence. Dans le rapport, la synthese et son CSV, les etudiants suivent leur ordre d'arrivee et leurs reponses leur ordre d'envoi (horodatage d'ecriture, puis identifiant en cas d'egalite).
- **Evenement `resultats`** : pousse sur le seul flux du formateur, a l'ouverture du flux puis a chaque nouvelle inscription ou reponse ; meme forme que `results.resultats`. Le flux etudiant ne le recoit jamais.
- **Borne d'ecran** : `ecran` est un entier de `0` au nombre d'ecrans du cours exclu, et un `intervalle` de rythme libre doit tenir dans le cours. Hors borne, `PATCH control` rend `400` et n'ecrit ni ne publie rien.
- **Deroule** : il revele les bonnes reponses du tirage de reference ; il n'est servi qu'au formateur proprietaire et ne doit jamais etre expose a un poste etudiant.

## Configuration

- `FORMATION_REVIEW_TOKEN_SECRET` (au moins 32 caracteres) : signe les jetons de participant et les liens de revision.
- `FORMATION_TEACHER_NOTIFICATION_TO` : destinataire de la synthese de cloture.
- `FORMATION_REVIEW_BASE_URL` : base des liens de revision envoyes aux etudiants.

Les exemples sont dans `deploy/backend.env.example`.

## Tests

- Contrats HTTP et SSE : `test/formations-session.http-socket.spec.ts` (`pnpm run test:e2e:http`).
- Postgres : `test/formations-{repositories,concurrence,resilience,seance}.db-integration.spec.ts` (`pnpm run test:integration:db:local`). Les suites HTTP montent un catalogue de test (`creerCatalogueDeTest(buildCoursDeClasse(12))`, `test/factories/cours.factory.ts`) pour ne pas dependre du contenu d'un cours publie ; les reponses attendues sont recalculees par `tirer(cours, seed)`.
- Charge : `pnpm run db:integration:up`, `pnpm run test:charge:run`, puis `pnpm run db:integration:down`. Budgets : trente inscriptions simultanees en 5 s, trente reponses simultanees en 3 s, cloture de 360 reponses en 10 s, lecture des resultats en 2 s, trente flux tenus deux minutes avec moins de 20 % de croissance memoire.
