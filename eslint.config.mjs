// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
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
  {
    files: ['test/**/*.ts', 'src/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
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
