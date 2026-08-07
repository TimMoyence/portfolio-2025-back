// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import-x';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  sonarjs.configs.recommended,
  // --- Garde-fou C2 : no-extraneous-dependencies --------------------------
  // Detecte tout import valeur depuis un package absent de
  // dependencies/devDependencies (cf bug express cdf24cb).
  {
    plugins: { 'import-x': importPlugin },
    settings: {
      'import-x/resolver': {
        typescript: { project: 'tsconfig.json' },
        node: true,
      },
    },
    rules: {
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.spec.ts',
            '**/*.test.ts',
            'test/**/*.ts',
            'test/**/*.{js,mjs,cjs}',
            'src/**/__tests__/**',
            '**/*.config.{js,mjs,cjs,ts}',
            'eslint.config.mjs',
            'jest.config.{js,mjs,cjs,ts}',
            'generate-architecture.mjs',
          ],
          optionalDependencies: false,
          peerDependencies: false,
          bundledDependencies: false,
        },
      ],
    },
  },
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
  // --- Baseline sonarjs (2026-08-07) -----------------------------------
  // `pnpm run lint` est dans `ci:check` ET dans le hook pre-push : il doit
  // rester a EXIT=0. Le preset `sonarjs/recommended` remonte 221 erreurs sur
  // l existant. Regle adoptee : on desactive nommement, avec le comptage du
  // jour, uniquement les regles qui declenchent ; toutes les autres restent
  // en `error` et servent de garde-fou pour le code a venir.
  //
  // Ces desactivations sont une dette explicite, pas un verdict : chaque
  // ligne est a re-activer apres traitement. Voir la baseline detaillee dans
  // `docs/qualite-baseline-2026-08-07.md`.
  //
  // Pas de `warn` ici : `lint-staged` lance `eslint --fix --max-warnings=0`
  // sur les fichiers stages, donc un warning casserait le pre-commit.
  {
    rules: {
      // Complexite cognitive : 19 fonctions au-dessus du seuil sonar (15),
      // la pire a 51 (`deep-url-analysis.service.ts`). Plutot que de couper
      // la regle, on la garde active en cliquet non-regressif cale sur le
      // pire cas actuel : rien ne peut empirer, et on abaisse le chiffre au
      // fur et a mesure des refactorings.
      'sonarjs/cognitive-complexity': ['error', 51],

      // 15 occurrences (13 prod / 2 test). Risque ReDoS reel a instruire
      // une par une (parsers sitemap, scraping audit) — pas un bruit.
      'sonarjs/super-linear-regex': 'off',

      // 13 occurrences, toutes en prod. Lisibilite.
      'sonarjs/no-nested-conditional': 'off',

      // 71 occurrences dont 67 dans les tests (fixtures 127.0.0.1). Les
      // 4 occurrences prod sont a verifier (rate-limiting / SSRF guard).
      'sonarjs/no-hardcoded-ip': 'off',

      // 5 occurrences : regexps a simplifier.
      'sonarjs/concise-regex': 'off',
      // 5 occurrences : `RegExp.exec` a preferer a `String.match`.
      'sonarjs/prefer-regexp-exec': 'off',
      // 3 occurrences : API depreciees encore appelees.
      'sonarjs/deprecation': 'off',
      // 2 occurrences chacune.
      'sonarjs/use-type-alias': 'off',
      'sonarjs/no-nested-template-literals': 'off',
      'sonarjs/pseudo-random': 'off',

      // Quick wins : 1 seule occurrence chacune, toutes en prod. A traiter
      // en priorite pour pouvoir supprimer ce bloc.
      'sonarjs/no-redundant-optional': 'off',
      'sonarjs/no-dead-store': 'off',
      'sonarjs/void-use': 'off',
      'sonarjs/no-all-duplicated-branches': 'off',
      'sonarjs/prefer-single-boolean-return': 'off',
      'sonarjs/no-identical-functions': 'off',
      'sonarjs/different-types-comparison': 'off',
      'sonarjs/no-redundant-jump': 'off',
      'sonarjs/no-async-constructor': 'off',
    },
  },
  {
    files: ['test/**/*.ts', 'src/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',

      // Regles sonarjs qui ne declenchent QUE dans les tests (0 occurrence
      // en code de production) : on les neutralise ici seulement, elles
      // restent donc des erreurs bloquantes dans `src/` hors specs.
      'sonarjs/no-hardcoded-passwords': 'off', // 32 occ. — mots de passe de fixtures
      'sonarjs/no-floating-point-equality': 'off', // 16 occ. — assertions sur scores/BAC
      'sonarjs/prefer-specific-assertions': 'off', // 10 occ.
      'sonarjs/no-alphabetical-sort': 'off', // 4 occ.
      'sonarjs/assertions-in-tests': 'off', // 4 occ.
      'sonarjs/parameterized-tests': 'off', // 4 occ.
      'sonarjs/no-undefined-argument': 'off', // 2 occ.
      'sonarjs/constructor-for-side-effects': 'off', // 2 occ.
      'sonarjs/no-clear-text-protocols': 'off', // 1 occ. — URL http de test
      'sonarjs/no-empty-collection': 'off', // 1 occ.
    },
  },
  // --- Guardrails C4b : split langchain-audit-report ---------------------
  // Les fichiers `automation/langchain-*` autres que l'orchestrateur ne
  // doivent pas importer depuis l'orchestrateur (evite les cycles et
  // garde une dependance unidirectionnelle helpers -> orchestrateur).
  //
  // Exemption `langchain-fallback-report.builder.ts` : ce builder genere
  // des rapports deterministes quand le LLM echoue, et a besoin du type
  // `ExpertReport` derive de Zod (`z.infer<typeof expertReportSchema>`)
  // qui vit dans l'orchestrateur. Le deplacer vers `contracts/` casserait
  // l'invariant "contracts Zod-free" (Pass 2 NF-1). Le builder est donc
  // exempte volontairement.
  {
    files: [
      'src/modules/audit-requests/infrastructure/automation/langchain-*.ts',
    ],
    ignores: [
      'src/modules/audit-requests/infrastructure/automation/langchain-audit-report.service.ts',
      'src/modules/audit-requests/infrastructure/automation/langchain-audit-report.service.spec.ts',
      'src/modules/audit-requests/infrastructure/automation/langchain-fallback-report.builder.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/langchain-audit-report.service'],
              message:
                'Les helpers langchain-* ne doivent pas importer depuis l orchestrateur. Importer les contrats via ./contracts/langchain-contracts.',
            },
          ],
        },
      ],
    },
  },
  // Hors du dossier automation/, interdire l import direct des contrats
  // afin de conserver un unique point d entree (re-export du service).
  {
    files: ['src/**/*.ts'],
    ignores: ['src/modules/audit-requests/infrastructure/automation/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/audit-requests/infrastructure/automation/contracts/langchain-contracts',
              ],
              message:
                'Importer ces contrats via langchain-audit-report.service (re-export) afin de preserver un unique point d entree.',
            },
          ],
        },
      ],
    },
  },
);
