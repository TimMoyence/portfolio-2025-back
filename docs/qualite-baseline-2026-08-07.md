# Baseline qualite outillee — 2026-08-07

Trois outils d'analyse statique ont ete ajoutes au backend : **jscpd**
(duplication), **knip** (code et dependances non utilises) et
**eslint-plugin-sonarjs** (qualite et complexite).

Ce document fige les chiffres du jour. Il sert de point de comparaison : tout
ecart futur se lit par rapport a ces valeurs.

| Outil                 | Version | Branche dans la CI                        |
| --------------------- | ------- | ----------------------------------------- |
| jscpd                 | 5.0.14  | Non (script dedie)                        |
| knip                  | 6.32.0  | Non (script dedie)                        |
| eslint-plugin-sonarjs | 4.2.0   | **Oui**, via `lint` — perimetre restreint |

## Comment lancer chaque outil

```bash
pnpm run quality:cpd         # duplication du code de production
pnpm run quality:cpd:tests   # duplication dans les tests (informatif)
pnpm run quality:knip        # exports / fichiers / dependances non utilises
pnpm run quality:sonar       # dette sonarjs complete, regles neutralisees incluses
```

`quality:cpd` sort en erreur si la duplication depasse 2 %. Les trois autres
sortent en erreur tant que la dette listee plus bas n'est pas resorbee : c'est
attendu, ils sont volontairement hors CI.

Les rapports HTML de jscpd sont ecrits dans `reports/`, ignore par Git.

## Etat de la CI

`ci:check` (`lint && format:check && typecheck && jest && build`) et le hook
`pre-push` sont inchanges, **a une exception pres** : `lint` execute desormais
sonarjs. Le perimetre a ete calibre pour que `lint` reste a `EXIT=0`.

Aucun des scripts `quality:*` n'a ete ajoute a `ci:check` ni a
`pre-push:check`. Les brancher aujourd'hui bloquerait tous les pushes.

## 1. jscpd — duplication

### Code de production

Config : `.jscpd.json`. Seuil : 5 lignes / 50 tokens minimum.

| Metrique          | Valeur       |
| ----------------- | ------------ |
| Fichiers analyses | 302          |
| Lignes analysees  | 33 452       |
| Clones detectes   | 49           |
| Lignes dupliquees | 618 (1,85 %) |

Le seuil d'echec est fixe a **2 %**, juste au-dessus de la mesure du jour :
la duplication ne peut plus augmenter sans que le script echoue.

**Exclusions et justifications :**

- `src/migrations/**` — fichiers generes par TypeORM, structurellement
  repetitifs. Mesure de controle : les inclure ajoute **0 clone** (chaque
  migration porte un SQL unique), mais 52 fichiers de bruit potentiel.
- `**/*.spec.ts` — la duplication de structure y est volontaire (Arrange /
  Act / Assert). Mesuree separement, voir plus bas.
- `**/*.entity.ts` — les declarations `@Column` se ressemblent par nature.
  Verifie manuellement : les 14 clones detectes sont tous des blocs
  `createdAt` / `updatedAt` / `updatedOrCreatedBy`, sans exception.
  A eux seuls ils representaient **179 lignes dupliquees** sur
  `AuditRequest.entity.ts`, soit du bruit pur.
- `**/*.dto.ts` et `**/dto/**` — meme raison (69 fichiers) : des
  declarations de champs decores, naturellement similaires.
- `dist/`, `node_modules/`, `coverage/` — artefacts de build.

### Les pires endroits (code de production)

| Lignes | Emplacements                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| 59     | `audit-requests/.../audit-pdf-generator.service.ts:41` ↔ `lead-magnets/.../ToolkitPdfGenerator.service.ts:34` |
| 32     | `audit-requests/.../audit-queue.service.ts:144` ↔ `sebastian/.../badges-evaluation-queue.service.ts:162`      |
| 24     | `users/application/AuthenticateGoogleUser.useCase.ts:162` ↔ `AuthenticateUser.useCase.ts:58`                  |
| 21     | `audit-requests/.../audit-queue.service.ts:115` ↔ `audit-worker.service.ts:67`                                |
| 21     | `sebastian/.../badges-evaluation-queue.service.ts:133` ↔ `badges-evaluation-worker.service.ts:84`             |

Le clone de 59 lignes est le plus interessant : **deux gestions
independantes du cycle de vie Puppeteer** (lancement singleton, generation
PDF avec les memes marges, fermeture au shutdown) coexistent dans deux
modules. Toute correction sur l'une doit etre reportee a la main sur l'autre.

Les clones BullMQ (32 + 21 + 21 lignes) relevent du meme constat : la
configuration de queue et de worker est recopiee entre `audit-requests` et
`sebastian`.

### Tests

Config : `.jscpd.tests.json`. Seuil desactive (100 %) : purement informatif.

| Metrique          | Valeur         |
| ----------------- | -------------- |
| Fichiers analyses | 207            |
| Clones detectes   | 143            |
| Lignes dupliquees | 1 897 (6,63 %) |

Ce chiffre n'est pas un objectif a zero, mais il merite attention au regard
de la regle « factories obligatoires » de `CLAUDE.md`. Les pires cas :

| Lignes | Emplacements                                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| 109    | `test/app.http-socket.spec.ts:213` ↔ `test/legacy-contexts.e2e.spec.ts:72`                                 |
| 44     | `test/app.e2e.spec.ts:145` ↔ `test/app.http-socket.spec.ts:170`                                            |
| 36     | `test/app.e2e.spec.ts:78` ↔ `test/app.http-socket.spec.ts:88`                                              |
| 32     | `test/legacy-repositories.db-integration.spec.ts:19` ↔ `test/weather-preferences.db-integration.spec.ts:4` |

Le bloc de 109 lignes est un bootstrap d'application e2e recopie a
l'identique : c'est exactement le cas que `test/helpers/` doit absorber.

## 2. knip — code et dependances non utilises

Config : `knip.jsonc` (format `.jsonc` pour garder les justifications a cote
de la config).

### Faux positifs NestJS neutralises

Le point aveugle de knip sur ce projet est le code charge **par glob ou par
reflexion**, qu'aucun `import` statique ne reference. Declares comme points
d'entree :

- `src/database/data-source.ts` — consomme par la CLI TypeORM.
- `src/migrations/*.ts` — charges par glob depuis le `DataSource`.
- `src/**/*.entity.ts` — charges par glob depuis `app.module.ts`
  (`entities: [join(__dirname, '**/*.entity.{js,ts}')]`).
- `src/**/*.spec.ts` et `test/**/*.spec.ts` — les quatre configurations Jest.

`src/main.ts` n'est volontairement pas liste : knip le deduit deja des
scripts `start` / `start:prod`.

Dependances mises en liste blanche, chacune reellement utilisee mais
invisible a l'analyse statique :

| Dependance               | Pourquoi invisible                                                            |
| ------------------------ | ----------------------------------------------------------------------------- |
| `jest-ratchet`           | Reporter passe en CLI : `test:cov --reporters=jest-ratchet`                   |
| `pino-pretty`            | Resolu par chaine : `app.module.ts` → `transport.target`                      |
| `@nestjs/cli`            | CLI de schematics, pilotee par `nest-cli.json`                                |
| `@stryker-mutator/*` (3) | `stryker.config.mjs` present, script `test:mutation` desactive temporairement |

L'injection de dependances Nest, les decorateurs et les modules ne posent en
revanche **aucun probleme** : knip suit les `import` des `@Module`, et aucun
provider n'a ete signale a tort.

### Baseline

| Categorie                     | Nombre |
| ----------------------------- | ------ |
| Fichiers non utilises         | 2      |
| Dependances non utilisees     | 1      |
| devDependencies non utilisees | 4      |
| Exports non utilises          | 37     |
| Types exportes non utilises   | 38     |
| Exports en double             | 1      |

### Lecture des 75 exports signales

Le chiffre brut est trompeur. Apres verification symbole par symbole :

| Categorie                                                                     | Nombre |
| ----------------------------------------------------------------------------- | ------ |
| **A.** `export` superflu — symbole utilise uniquement dans son propre fichier | 47     |
| **B.** Symbole bien utilise, mais jamais **via le barrel** qui le re-exporte  | 24     |
| **C.** Aucune reference nulle part — vrai code mort                           | 4      |

- **A** est de la sur-exposition, pas du code mort : retirer le mot-cle
  `export` suffit. Exemple typique, `IWeatherProxy.port.ts` exporte 8
  interfaces (`CurrentWeather`, `DailyWeather`…) qui ne servent qu'a typer
  les champs du port dans le meme fichier.
- **B** concerne deux barils : `src/common/domain/errors/index.ts` (9 des 11
  re-exports) et `automation/section-generators/index.ts` (6). Les erreurs de
  domaine sont bien utilisees — mais **108 imports pointent directement sur
  les fichiers concrets**, et seulement 2 passent par le baril. La convention
  d'import n'est pas tenue ; c'est le baril qu'il faut trancher, pas le code.
- **C** : quatre factories de test ecrites puis jamais consommees —
  `buildContact`, `createMockSebastianProfileRepo`, `buildSebastianBadge`,
  `buildEmailVerificationToken`.

### Repartition par couche DDD

| Couche           | Exports | Types |
| ---------------- | ------- | ----- |
| `domain`         | 19      | 24    |
| `infrastructure` | 14      | 11    |
| `application`    | 0       | 3     |
| `interfaces`     | 0       | 0     |

57 % des signalements sont dans `domain/`. Aucune violation de sens de
dependance n'a ete detectee : la couche `interfaces` ne remonte rien, et
`application` presque rien. Le motif est une **sur-exposition du vocabulaire
de domaine** — des types et constantes rendus publics « au cas ou » —, pas
une erreur d'architecture.

## 3. eslint-plugin-sonarjs

Le preset `sonarjs/recommended` est active dans `eslint.config.mjs`. Il
remonte **221 erreurs** sur l'existant, ce qui aurait casse `lint`, donc
`ci:check` et le hook `pre-push`.

Regle retenue : **desactiver nommement, avec le comptage du jour, uniquement
les regles qui declenchent**. Toutes les autres restent en `error` et servent
de garde-fou pour le code a venir. Aucune regle n'est passee en `warn` :
`lint-staged` lance `eslint --fix --max-warnings=0` sur les fichiers stages,
un warning casserait donc le pre-commit.

### Repartition des 221 erreurs

| Regle                                 | Prod | Test | Traitement                               |
| ------------------------------------- | ---- | ---- | ---------------------------------------- |
| `sonarjs/cognitive-complexity`        | 19   | 0    | Cliquet a 51                             |
| `sonarjs/super-linear-regex`          | 13   | 2    | Desactivee                               |
| `sonarjs/no-nested-conditional`       | 13   | 0    | Desactivee                               |
| `sonarjs/no-hardcoded-ip`             | 4    | 67   | Desactivee                               |
| `sonarjs/concise-regex`               | 4    | 0    | Desactivee                               |
| `sonarjs/prefer-regexp-exec`          | 4    | 1    | Desactivee                               |
| `sonarjs/deprecation`                 | 3    | 0    | Desactivee                               |
| `sonarjs/use-type-alias`              | 2    | 0    | Desactivee                               |
| `sonarjs/no-nested-template-literals` | 2    | 0    | Desactivee                               |
| `sonarjs/pseudo-random`               | 2    | 0    | Desactivee                               |
| 9 regles a 1 occurrence               | 9    | 0    | Desactivees                              |
| `sonarjs/no-hardcoded-passwords`      | 0    | 32   | Desactivee **dans les tests seulement**  |
| `sonarjs/no-floating-point-equality`  | 0    | 16   | Desactivee **dans les tests seulement**  |
| `sonarjs/prefer-specific-assertions`  | 0    | 10   | Desactivee **dans les tests seulement**  |
| 7 autres regles de test               | 0    | 18   | Desactivees **dans les tests seulement** |

Dix regles ne declenchent **que** dans les tests. Elles sont neutralisees
dans le bloc `files: ['test/**/*.ts', 'src/**/*.spec.ts']` uniquement : elles
restent donc bloquantes dans le code de production. Un mot de passe en dur
introduit demain dans `src/` fera echouer `lint`.

### Le cas de la complexite cognitive

Plutot que de couper la regle, elle est gardee active avec un **seuil cliquet
cale sur le pire cas actuel (51)**. La complexite ne peut plus empirer, et le
chiffre s'abaisse au fil des refactorings. Le seuil recommande par Sonar
reste 15.

Les 19 fonctions au-dessus de 15, par ordre de gravite :

| Complexite | Emplacement                                                    |
| ---------- | -------------------------------------------------------------- |
| 51         | `audit-requests/.../deep-url-analysis.service.ts:878`          |
| 46         | `audit-requests/.../deep-url-analysis.service.ts:154`          |
| 37         | `sebastian/domain/drink-parser.ts:384`                         |
| 34         | `audit-requests/.../report-quality-gate/tier-validators.ts:32` |
| 33         | `audit-requests/.../report-quality-gate.service.ts:291`        |
| 27         | `app.module.ts:63`                                             |
| 26         | `audit-requests/.../page-ai-recap.service.ts:582`              |
| 26         | `audit-requests/.../scoring.service.ts:104`                    |
| 25         | `audit-requests/.../ssrf-guard.util.ts:23`                     |
| 24         | `audit-requests/.../sitemap-discovery.service.ts:31`           |
| 24         | `users/domain/User.ts:87`                                      |
| 22         | `common/interfaces/security/suspicious-request-scorer.ts:77`   |
| 21         | `audit-requests/.../sitemap-parser.util.ts:25`                 |
| 21         | `users/application/services/JwtTokenService.ts:109`            |
| 21         | `audit-requests/.../report-quality-gate.service.ts:410`        |
| 20         | `audit-requests/.../page-ai-recap.service.ts:179`              |
| 18         | `audit-requests/.../AuditRequests.repository.typeORM.ts:86`    |
| 18         | `audit-requests/.../langchain-client-report.service.ts:473`    |
| 17         | `sebastian/domain/SebastianEntry.ts:101`                       |

Treize des dix-neuf sont dans `audit-requests/infrastructure/automation/`.

Pour re-mesurer la dette complete, regles neutralisees comprises :

```bash
pnpm run quality:sonar
```

Cette commande utilise `eslint.sonar-full.config.mjs`, qui reprend la config
du projet et re-active tout `sonarjs/recommended`. Elle sort en erreur par
construction et n'est jamais appelee par la CI.

## Points a signaler

### Dependances fantomes

`pdfkit` est declare en **dependance de production** et n'est importe nulle
part. Sa seule occurrence dans le code est une **liste noire** du test
d'architecture `src/runtime/dependency-rules.spec.ts:140`, qui interdit son
import depuis la couche `domain`. La generation de PDF passe aujourd'hui par
Puppeteer. La dependance et ses types sont donc embarques dans l'image Docker
pour rien.

Egalement non utilisees, en `devDependencies` :

- `@types/pdfkit` — corollaire du point ci-dessus.
- `ts-loader` — le build est un `tsc` direct, aucun bundler webpack.
- `source-map-support` — aucune reference.
- `@eslint/eslintrc` — aucune reference ; la config ESLint est en flat config
  pure, sans `FlatCompat`.

Ces cinq entrees ne sont **pas** masquees dans `knip.jsonc` : elles doivent
rester visibles jusqu'a suppression.

### Fichiers morts

- `src/modules/users/interfaces/dto/RefreshToken.dto.ts` — `RefreshTokenDto`
  n'a **aucune reference**. Le module Users est actif : il s'agit
  vraisemblablement d'un reste du passage du refresh token vers un cookie
  httpOnly. Un contrat d'API declare, documente Swagger, et branche nulle
  part.
- `src/modules/projects/infrastructure/enums/PublishStatus.enum.ts` — aucune
  reference. Module legacy (`ENABLE_LEGACY_CMS_CONTEXTS`), enjeu faible.

### Non-probleme identifie

L'« export en double »
`REFRESH_TOKEN_TTL_MS` / `REFRESH_TOKEN_COOKIE_MAX_AGE_MS`
(`users/domain/auth.constants.ts`) est un alias intentionnel
(`export const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = REFRESH_TOKEN_TTL_MS;`) qui
nomme deux usages distincts de la meme duree. Aucune action.

## Priorites de traitement

**1 — Supprimer les cinq dependances mortes.** Effort minimal, gain immediat
sur la surface de l'image Docker et sur l'audit de securite. `pdfkit` etant
en dependance de production, c'est le premier a traiter. Attention : sa
suppression demande d'ajuster la liste noire de
`src/runtime/dependency-rules.spec.ts`.

**2 — Les neuf regles sonarjs a une seule occurrence.** Neuf corrections
d'une ligne permettent de supprimer neuf lignes de desactivation dans
`eslint.config.mjs` et de reconvertir ces regles en garde-fous actifs.
Meilleur rapport effort / dette du lot.

**3 — Factoriser le cycle de vie Puppeteer** (clone de 59 lignes). C'est la
duplication la plus risquee du projet : deux services generent des PDF avec
la meme configuration de marges et la meme gestion de singleton Chromium.

**4 — `sonarjs/super-linear-regex` (15 occurrences).** A instruire avant les
regles de confort : ce sont des risques ReDoS sur des parsers qui traitent de
l'entree externe (sitemaps, pages scrapees par l'audit).

**5 — Supprimer les deux fichiers morts et les quatre factories inutilisees.**

**6 — Trancher le baril `common/domain/errors/index.ts`.** Soit on impose
l'import via le baril (108 imports directs a reecrire), soit on le supprime.
L'etat actuel — un baril que presque personne n'emprunte — est le pire des
deux.

**7 — Complexite cognitive.** Chantier de fond, a etaler. Cible prioritaire :
`deep-url-analysis.service.ts` (deux fonctions a 51 et 46), puis abaisser le
cliquet dans `eslint.config.mjs` a chaque palier franchi.

**8 — Bootstrap e2e duplique** (109 lignes) : a deplacer dans
`test/helpers/`.

## Quand brancher ces outils dans la CI

- `quality:cpd` est **deja pret** : il sort a `EXIT=0` avec un seuil a 2 %.
  Il peut etre ajoute a `ci:check` des maintenant si l'on accepte que toute
  hausse de duplication bloque le push.
- `quality:knip` doit attendre le traitement des priorites 1 et 5. Il restera
  ensuite bruyant a cause des 47 exports superflus (categorie A) : prevoir
  soit une passe de nettoyage, soit `--include files,dependencies` pour ne
  cadenasser que les fichiers et dependances.
- `quality:sonar` n'a pas vocation a rejoindre la CI : c'est un outil de
  mesure. Le garde-fou reel est le perimetre sonarjs actif dans `lint`, qui,
  lui, est deja dans `ci:check`.
