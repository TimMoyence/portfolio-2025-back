# 0001 - Gouvernance qualite et protection de branche

- Statut : accepte
- Date : 2026-03-17

## Contexte

Le backend pilote des routes publiques, des migrations, des integrations externes et un pipeline LLM. Une regression de qualite ou un secret commite a un impact plus lourd qu'un simple bug de presentation.

## Decision

Le depot impose une gouvernance minimale :

- `CODEOWNERS` pour rendre explicite le proprietaire de revue ;
- branche `master` protegee par pull request ;
- checks obligatoires `quality-gate` et `security` ;
- scans CI pour secrets et dependances ;
- seuil minimal de couverture pour eviter une erosion silencieuse des tests.

## Consequences

- Le merge est plus strict mais plus previsible.
- Les noms des jobs CI deviennent des contrats stables.
- Toute evolution de gouvernance doit etre documentee dans le meme changement.
