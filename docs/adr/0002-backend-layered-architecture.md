# 0002 - Architecture backend en couches DDD

- Statut : accepte
- Date : 2026-03-17

## Contexte

Le backend melange API HTTP, use cases, domaine, persistence TypeORM, queue et orchestration LLM. Sans frontieres explicites, la logique metier peut vite deriver vers les controllers ou les repositories.

## Decision

Le backend conserve le decoupage suivant :

- `interfaces` pour le transport HTTP et les DTO ;
- `application` pour les use cases et l'orchestration ;
- `domain` pour les invariants et objets metier ;
- `infrastructure` pour persistence, queue, mail et appels externes.

Le domaine ne depend jamais de Nest, TypeORM ou d'un detail d'integration.

## Consequences

- Les invariants metier restent testables sans infrastructure.
- Les integrations techniques restent remplacables.
- Une nouvelle couche ne se justifie que si elle retire un vrai couplage et clarifie le langage metier.
