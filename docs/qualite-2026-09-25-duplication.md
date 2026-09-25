# Duplication à zéro — état verrouillé au 2026-09-25

Complète `qualite-2026-08-08.md`. Les seuils de 1,1 % (production) et 1,2 % (tests) sont
remplacés par un seuil **0** sur les deux périmètres, mesuré par **deux moteurs**.

## La porte

```bash
pnpm run quality:cpd         # jscpd 5 puis jscpd 4, sur .jscpd.json
pnpm run quality:cpd:tests   # jscpd 5 sur .jscpd.tests.json, jscpd 4 sur .jscpd4.tests.json
```

| Réglage     | Valeur                                        |
| ----------- | --------------------------------------------- |
| `minTokens` | 30                                            |
| `minLines`  | 5                                             |
| `threshold` | 0                                             |
| Production  | `src/`, hors `*.spec.ts` et `src/migrations/` |
| Tests       | `src/**/*.spec.ts` et `test/**/*.ts`          |

Pourquoi deux moteurs : jscpd 5 tokenise certains fichiers en gros blocs et laisse passer
des clones que jscpd 4 voit ; jscpd 4 saute les fichiers de plus de 1000 lignes que
jscpd 5 lit. Chacun couvre l'angle mort de l'autre. Un test de câblage plante un clone
canari dans un dépôt jetable et vérifie que chaque moteur le voit dans son périmètre et
l'ignore en dehors.

Aucune exclusion n'a été ajoutée pour atteindre zéro : pas d'`ignore`, pas de marqueur
`jscpd:ignore`, pas de renommage cosmétique. Chaque clone a été résorbé par une
extraction réelle (factory de test, helper, classe de base, `it.each`).

## Résultat

| Périmètre  | jscpd 5 | jscpd 4 |
| ---------- | ------- | ------- |
| Production | 0 clone | 0 clone |
| Tests      | 0 clone | 0 clone |

Suites rejouées après le refactor, toutes vertes :

| Suite                                                                | Résultat               |
| -------------------------------------------------------------------- | ---------------------- |
| `ci:check` (lint, format, typecheck, cpd, knip, gardes, jest, build) | 304 suites, 3028 tests |
| `test:e2e`                                                           | 46 tests               |
| `test:e2e:http`                                                      | 234 tests              |
| `test:integration:db:local`                                          | 190 tests              |
| `test:charge:run`                                                    | 5 tests                |

## Écarts de comportement trouvés et corrigés

Un refactor ne doit rien changer d'observable. Les relectures adverses ont trouvé quatre
écarts, chacun corrigé en commençant par un test qui échouait :

- **Injection de `ActionSurUnParticipant`** — la classe de base abstraite extraite pour
  l'éviction et la réadmission n'était pas décorée `@Injectable()` : Nest n'émettait pas
  ses `design:paramtypes`, la dépendance arrivait `undefined` et les deux routes
  répondaient 500. Les tests unitaires instanciaient la classe à la main et ne l'ont pas
  vu ; seul l'e2e HTTP l'a attrapé. `__tests__/ActionSurUnParticipant.spec.ts` résout
  désormais les deux cas d'usage par un module Nest de test.
- **Validation des identifiants de participant** — le regroupement des paramètres de
  route en DTO passait de `ParseUUIDPipe` à `@IsUUID()`, plus strict (versions RFC) et au
  message d'erreur différent. `CibleParticipantPipe` délègue de nouveau à
  `ParseUUIDPipe` : même message `Validation failed (uuid is expected)`, même acceptation
  d'un UUID bien formé hors version RFC. Deux tests e2e HTTP le fixent.
- **Schéma OpenAPI de la page toolkit** — typés par un type indexé
  (`ToolkitContent['cheatsheet']`), `cheatsheet`, `workflows` et `templates` émettaient
  `Object` au lieu de `Array`. `@ApiProperty({ type: Array })` les rétablit ; un test lit
  les métadonnées Swagger de chaque propriété.
- **Espaces insécables d'un test** — la factorisation de
  `StructureCoursConfidentialite.spec.ts` avait remplacé l'U+202F et l'U+00A0 des cas
  « confond les espaces » par des espaces ordinaires : le test passait sans plus rien
  prouver. Les octets sont revenus à l'identique de l'état initial, et un contrôle a
  comparé le nombre d'espaces insécables de chaque fichier modifié, dans les deux dépôts.

## Écarts acceptés

- L'ordre de quelques clés du document OpenAPI a changé là où des décorateurs ont été
  regroupés ; le contenu du schéma est identique.
