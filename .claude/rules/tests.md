---
paths:
  - '**/*.spec.ts'
  - 'test/**'
---

# Tests du back

- Un objet de test récurrent (entité, repository mock, service mock, résultat) vient d'une factory de `test/factories/` : `buildX(overrides?)` pour un objet, `createMockX()` pour un double complet. Jamais un `{ findAll: jest.fn(), ... }` recopié dans un spec : `docs/qualite-2026-08-08.md` en a relevé entre `jwt-auth.guard.spec.ts` et `roles.guard.spec.ts`.
- La factory manquante se crée avant le test qui la lit.
- Une règle de domaine ou un use case se teste en unitaire ; un repository, un mapper ou une migration en `*.db-integration.spec.ts` ; un contrat HTTP ou SSE en `*.e2e.spec.ts` ou `*.http-socket.spec.ts`.
