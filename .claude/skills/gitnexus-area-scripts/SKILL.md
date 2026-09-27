---
name: gitnexus-area-scripts
description: 'Skill for the Scripts area of portfolio-2025-back. 45 symbols across 8 files.'
---

# Scripts

45 symbols | 8 files | Cohesion: 87%

## When to Use

- Working with code in `scripts/`
- Understanding how chargerMoteur, liberer, ecartsAvecLesAttendus work
- Modifying scripts-related functionality

## Key Files

| File                                   | Symbols                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `scripts/guard-no-comments.mjs`        | analyzeFile, formatGate, githubAnnotation, main, parseArgs (+9)                              |
| `scripts/lib/vecteurs-formules.mjs`    | chargerMoteur, liberer, ecartsAvecLesAttendus, ecartsEntreMoteurs, empreinteDesVecteurs (+5) |
| `scripts/verifier-parite-formules.mjs` | controlerLeBack, controlerLeFront, empreinteDistanteDuFront, lireArguments, main             |
| `scripts/guard-no-comments.test.mjs`   | ts, gitIn, withRepo, L, narrative                                                            |
| `scripts/lib/comment-scope.mjs`        | extensionOf, hasJsdocTypes, isInScope, languageOf                                            |
| `scripts/lib/comment-extract.mjs`      | delimitedBlocks, markupBlocks, slashSlashBlocks, styleBlocks                                 |
| `scripts/duplication-gate.test.mjs`    | lireJson, verdictSurDepotPlante                                                              |
| `scripts/lib/comment-doctrine.mjs`     | declaredDependencies                                                                         |

## Entry Points

Start here when exploring this area:

- **`chargerMoteur`** (Function) — `scripts/lib/vecteurs-formules.mjs:74`
- **`liberer`** (Function) — `scripts/lib/vecteurs-formules.mjs:93`
- **`ecartsAvecLesAttendus`** (Function) — `scripts/lib/vecteurs-formules.mjs:139`
- **`ecartsEntreMoteurs`** (Function) — `scripts/lib/vecteurs-formules.mjs:155`
- **`empreinteDesVecteurs`** (Function) — `scripts/lib/vecteurs-formules.mjs:55`

## Key Symbols

| Symbol                  | Type     | File                                   | Line |
| ----------------------- | -------- | -------------------------------------- | ---- |
| `chargerMoteur`         | Function | `scripts/lib/vecteurs-formules.mjs`    | 74   |
| `liberer`               | Function | `scripts/lib/vecteurs-formules.mjs`    | 93   |
| `ecartsAvecLesAttendus` | Function | `scripts/lib/vecteurs-formules.mjs`    | 139  |
| `ecartsEntreMoteurs`    | Function | `scripts/lib/vecteurs-formules.mjs`    | 155  |
| `empreinteDesVecteurs`  | Function | `scripts/lib/vecteurs-formules.mjs`    | 55   |
| `executerVecteur`       | Function | `scripts/lib/vecteurs-formules.mjs`    | 102  |
| `lireFichierDeVecteurs` | Function | `scripts/lib/vecteurs-formules.mjs`    | 65   |
| `resultatsDesVecteurs`  | Function | `scripts/lib/vecteurs-formules.mjs`    | 123  |
| `serialiserCanonique`   | Function | `scripts/lib/vecteurs-formules.mjs`    | 32   |
| `lireArguments`         | Function | `scripts/verifier-parite-formules.mjs` | 34   |
| `main`                  | Function | `scripts/verifier-parite-formules.mjs` | 153  |
| `analyzeFile`           | Function | `scripts/guard-no-comments.mjs`        | 36   |
| `extensionOf`           | Function | `scripts/lib/comment-scope.mjs`        | 32   |
| `hasJsdocTypes`         | Function | `scripts/lib/comment-scope.mjs`        | 54   |
| `isInScope`             | Function | `scripts/lib/comment-scope.mjs`        | 62   |
| `languageOf`            | Function | `scripts/lib/comment-scope.mjs`        | 42   |
| `formatGate`            | Function | `scripts/guard-no-comments.mjs`        | 168  |
| `githubAnnotation`      | Function | `scripts/guard-no-comments.mjs`        | 210  |
| `main`                  | Function | `scripts/guard-no-comments.mjs`        | 233  |
| `parseArgs`             | Function | `scripts/guard-no-comments.mjs`        | 220  |

## Execution Flows

| Flow                          | Type            | Steps |
| ----------------------------- | --------------- | ----- |
| `Main → IsEmptyBraces`        | cross_community | 8     |
| `Main → IsLineComment`        | cross_community | 8     |
| `Main → DelimitedBlocks`      | cross_community | 6     |
| `Main → CreateSf`             | cross_community | 6     |
| `Main → SlashSlashBlocks`     | cross_community | 6     |
| `Main → ExtensionOf`          | cross_community | 6     |
| `Main → IsolatedGitEnv`       | cross_community | 5     |
| `Main → DeclaredDependencies` | cross_community | 4     |

## How to Explore

1. `context({name: "chargerMoteur"})` — see callers and callees
2. `query({search_query: "scripts"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
