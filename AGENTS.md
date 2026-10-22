# portfolio-2025-back

API NestJS du portfolio. Les règles transverses sont dans `~/.claude/CLAUDE.md`. Ce fichier ne garde que les juges, les commandes non évidentes et les invariants qu'aucune machine ne tient ici.

## Juges

- Le contrat HTTP de ce dépôt (DTO et document OpenAPI produit par Swagger) est la source unique des types du front `portfolio-2025-front`. Le front ne réécrit jamais un type de réponse à la main : un type recopié faisait perdre 7 incidents sur 9 en production.
- Une règle métier vit ici ; le front lit le champ servi au lieu de la recalculer. Un DTO qui change change le contrat dans le même commit, et `test/openapi-contract.e2e.spec.ts` le juge.
- Les imports entre `interfaces`, `application`, `domain` et `infrastructure` sont jugés par `src/runtime/dependency-rules.spec.ts`.

## Commandes

- Ciblé pendant le travail : `pnpm test -- <chemin-ou-motif>`.
- Suite complète avant chaque commit : `pnpm ci:check`, puis `pnpm test:e2e`, `pnpm test:e2e:http` et `pnpm test:integration:db:local` (Docker). `ci:check` ne contient pas ces trois-là, que `.github/workflows/ci.yml` joue.
- Nouvelle migration : `pnpm migration:new --name=NomEnCamelCase`, base de dev démarrée. Il prend l'horodatage suivant ; on n'en écrit jamais un à la main.

## Invariants qu'aucune machine ne tient

- Le schéma ne change que par une migration ; on ne modifie jamais la base à la main pour la rattraper.
- Aucune règle métier dans une entity TypeORM, un DTO ou un controller.

## GitNexus

- Index local absent par défaut : `npx gitnexus analyze --index-only` le crée ou le rafraîchit. Toujours `--index-only` : sans lui, `analyze` réinjecte un bloc généré dans ce fichier et dans `CLAUDE.md`.
- Usage par les skills `.claude/skills/gitnexus-*`. Un `risk: UNKNOWN` ou zéro appelant n'est pas un feu vert : il se confirme par `git grep`.
