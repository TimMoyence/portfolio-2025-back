# AGENTS.md

## Portee

Ces instructions s'appliquent a tout le code sous `portfolio-2025-back`.

## Protocole obligatoire avant toute execution

1. Avant toute commande, toute lecture approfondie, toute modification, tout test, tout build, toute migration ou toute installation, l'agent produit un plan explicite, meme si l'utilisateur ne le demande pas.
2. Ce plan doit rester concis mais couvrir au minimum :
   - l'objectif et le resultat attendu ;
   - les couches impactees (`interfaces`, `application`, `domain`, `infrastructure`, `database`, `docs`, `deploy`) ;
   - les fichiers ou zones susceptibles d'etre modifies ;
   - les tests, verifications et commandes prevus ;
   - les risques, dependances ou points bloquants.
3. L'execution peut commencer apres ce plan sans attendre une validation supplementaire, sauf si la demande est ambigue, destructive ou a fort impact.
4. Si la comprehension du probleme change en cours de route, l'agent met a jour le plan avant de continuer.

## Stack imposee

- NestJS 11
- TypeScript
- TypeORM
- Jest
- ESLint + Prettier
- Swagger / OpenAPI
- Docker / Docker Compose
- `pnpm` et `pnpm-lock.yaml`

L'agent respecte strictement cette stack. Il n'introduit pas de framework, ORM, moteur de validation, gestionnaire de paquets ou pattern transverse non presents sans demande explicite.

## Architecture non negociable

- Respecter le decoupage existant : `interfaces -> application -> domain -> infrastructure`.
- Appliquer DDD :
  - la logique metier vit dans le `domain` et, si besoin, est orchestree par `application` ;
  - les controllers, DTO, entities et repositories d'infrastructure ne portent pas les regles metier.
- Appliquer Clean Architecture :
  - controllers minces ;
  - use cases explicites ;
  - ports, interfaces et tokens stables ;
  - dependances dirigees vers le domaine, jamais l'inverse.
- Appliquer DRY :
  - factoriser seulement la duplication reelle et repetee ;
  - ne pas introduire d'abstraction speculative.
- Appliquer KISS :
  - choisir la solution la plus simple defendable ;
  - pas de sur-ingenierie, pas de couches artificielles, pas de genericite prematuree.

## TDD obligatoire

- Tout changement de comportement commence par un test cible qui echoue, ou par l'ajout/la mise a jour immediate d'un test avant l'implementation finale.
- Priorite des tests :
  - tests unitaires de domaine et de use cases ;
  - tests d'integration des repositories, mappers et flux base de donnees ;
  - tests e2e pour les contrats HTTP, SSE et parcours critiques.
- Si un test automatise pertinent n'est vraiment pas possible, l'agent doit le justifier explicitement et mettre en place la meilleure couverture alternative realiste.

## Regles de code

- JSDoc obligatoire sur :
  - classes exportees ;
  - use cases ;
  - services de domaine ;
  - value objects, tokens, ports et fonctions exportees dont l'intention n'est pas triviale ;
  - toute logique metier complexe, invariant metier, orchestration async ou choix technique non evident.
- Les commentaires doivent expliquer le pourquoi, pas paraphraser le code.
- Les exceptions sont gerees explicitement. Aucun `catch` silencieux, aucun retour `null` ambigu pour masquer une erreur.
- Les erreurs de domaine, d'application et d'infrastructure doivent etre traduites proprement jusqu'a la couche HTTP.
- Aucune logique metier dans les entities TypeORM, les DTO ou les controllers.
- Toute evolution de schema passe par migration. Aucun drift manuel de base de donnees.

## Definition de termine orientee entreprise

Une tache n'est pas terminee tant que tous les points suivants ne sont pas satisfaits :

- `package.json` est aligne avec la realite du projet.
- Les scripts utiles existent et restent coherents avec la stack. Au minimum : `lint`, `test`, `typecheck`, `build`. Si un script manque, l'agent l'ajoute ou l'aligne avant de conclure.
- Le lint passe.
- Les tests pertinents passent.
- Le typecheck passe.
- Le build passe.
- La documentation impactee est mise a jour.
- Les fichiers de configuration, exemples d'environnement, scripts et docs de deploiement restent coherents.

### Verification minimale attendue

- `pnpm lint`
- `pnpm test`
- `pnpm exec tsc --noEmit -p tsconfig.json` ou `pnpm typecheck` si le script existe
- `pnpm build`

### Verification additionnelle selon l'impact

- Endpoints HTTP, transport, serialization ou SSE :
  - `pnpm test:e2e`
  - `pnpm test:e2e:http`
- Base de donnees, mappings TypeORM, repositories, migrations, performance de listing :
  - `pnpm test:integration:db`
  - ou le flux local equivalent documente par le projet

L'agent ne doit jamais declarer une tache "terminee" si une verification attendue n'a pas ete executee ou si un blocage n'est pas explique precisement.

## Exigence production-ready

- Aucune secret, cle API, mot de passe, jeton ou configuration sensible en dur dans le code.
- Toute nouvelle configuration passe par l'environnement et ses exemples documentes, notamment `deploy/backend.env.example` et la documentation associee.
- Les timeouts, retries, fallback et limites sont explicites pour tout appel reseau, traitement asynchrone ou integration externe.
- Les erreurs et logs ne doivent jamais exposer de donnees sensibles.
- Les DTO, validations et contrats OpenAPI doivent rester synchronises avec le comportement reel.
- Les changements de comportement public, d'endpoint, d'env, de migration, de workflow de deploiement ou d'architecture doivent mettre a jour `README.md`, `docs/` et les exemples de configuration appropries.
- Le code livre doit etre exploitable en production sans TODO bloquant, sans valeur magique critique cachee et sans comportement implicite non documente.

## Regles de sortie

- Le compte-rendu final doit indiquer ce qui a ete modifie, quelles verifications ont ete executees et quels risques residuels subsistent.
- Si une contrainte d'environnement empeche une verification, l'agent le signale explicitement avec la commande concernee et la raison exacte.
