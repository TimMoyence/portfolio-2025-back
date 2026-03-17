# Standards d'ingenierie Backend

## 1. Pourquoi ce document existe

Un contributeur qui decouvre totalement le projet doit pouvoir comprendre ou poser du code, comment le verifier et quelles regles ne sont pas negociables. Ce document rend ces attentes explicites.

## 2. Frontieres d'architecture

- `interfaces` expose les contrats HTTP, la validation et le mapping transport.
- `application` orchestre les use cases, commandes et services applicatifs.
- `domain` porte le vocabulaire metier, les invariants et les decisions.
- `infrastructure` implemente la persistence, le mail, les files d'attente et les integrations externes.

Si une classe depend de details de transport Nest ou d'entites TypeORM, elle n'appartient pas au `domain`.

## 3. DDD et Clean Architecture

- Un use case doit exprimer une intention metier, pas une mecanique de framework.
- Les objets de domaine protegent les invariants et refusent les etats invalides le plus tot possible.
- Les controllers restent minces et traduisent le transport en commandes applicatives.
- Les repositories sont des details d'infrastructure derriere des contrats stables orientes domaine.

## 4. DRY et simplicite

- Mutualiser les validations repetees, les mappings et la logique transport dupliquee.
- Eviter les abstractions speculatives. Une nouvelle couche n'est justifiee que si elle retire un vrai couplage.
- Preferer du code explicite a des helpers generiques si le langage metier devient plus flou.

## 5. Regles JSDoc

Ajouter du JSDoc sur :

- les classes exportees et les use cases ;
- les value objects, tokens, ports et services de domaine ;
- les helpers exportes non triviaux ;
- l'orchestration asynchrone avec deadlines, retries ou fallback importants.

Chaque commentaire doit expliciter l'intention, les invariants ou les modes d'echec.

## 6. Gestion des erreurs

- Aucun `catch` silencieux.
- Aucun `null` ambigu pour masquer une erreur d'infrastructure.
- Les erreurs de domaine, application et infrastructure doivent etre traduites deliberement.
- Les logs doivent rester actionnables sans fuite de secret.

## 7. Definition of Done

Une tache n'est pas terminee tant que :

- lint, format, typecheck, tests et build passent ;
- les hooks Git (`pre-commit`, `commit-msg`, `pre-push`) sont restes actifs et respectes ;
- la documentation est a jour pour toute evolution publique, architecture, env, deploiement ou workflow ;
- les changements base de donnees incluent migration et couverture d'integration adaptee ;
- les flux LLM sont revus sous l'angle prompt injection et contenu non fiable ;
- le changement est committe comme une unite coherente.
