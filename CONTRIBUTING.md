# Contribution

## Langue de travail

Le francais est la langue par defaut pour les nouveaux commentaires, la documentation, les descriptions de PR, les notes d'architecture et les messages de commit, sauf besoin explicite contraire.

## Discipline de commit

- Un lot de changement coherent = un commit atomique.
- Ne pas melanger schema, refactor et feature sauf si c'est inseparable.
- Utiliser les Conventional Commits, par exemple `feat(audit): ajoute le garde-fou de timeout sitemap`.
- Garder le diff relisible en mettant la documentation a jour dans le meme commit quand le comportement ou le workflow changent.

## Attendus d'architecture

- Respecter la direction `interfaces -> application -> domain -> infrastructure`.
- Les regles metier vivent dans le domaine et sont orchestrees par des use cases explicites.
- Les controllers, DTO, entites TypeORM et repositories ne doivent pas porter la politique metier.
- Les dependances pointent toujours vers le domaine, jamais l'inverse.

## Standards de code

- Appliquer DRY quand la duplication est reelle, repetee et stable.
- Ajouter du JSDoc sur les classes exportees, use cases, services de domaine, tokens, value objects et fonctions exportees non triviales.
- Traduire les echecs d'infrastructure en comportement applicatif ou HTTP explicite.
- Garder logs et erreurs exempts de secrets ou de payloads sensibles.
- Considerer toute page crawlee, sitemap, sortie LLM ou donnee utilisateur comme non fiable.

## Regles base de donnees

- Toute evolution de schema passe par migration.
- Aucun drift manuel en production. L'etat de la base doit etre reproductible depuis le code.
- Les changements de persistance significatifs imposent des tests d'integration repository.
- Les indexes, la pagination et la performance des requetes comptent autant que la forme des entites.

## Verification

Avant d'ouvrir une PR, lancer idealement :

```bash
pnpm run lint
pnpm run format:check
pnpm run typecheck
pnpm test -- --runInBand --watchman=false
pnpm run test:e2e
pnpm run test:e2e:http
pnpm run build
```

Les hooks Git suivants tournent automatiquement apres installation des dependances :

- `pre-commit` via `lint-staged` ;
- `commit-msg` via `commitlint` ;
- `pre-push` via `pnpm run ci:check`.

Si la base de donnees est impactee, ajouter le flux d'integration DB documente.
