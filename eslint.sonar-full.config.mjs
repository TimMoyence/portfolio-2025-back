// @ts-check
// Config d audit : reprend la config ESLint du projet puis re-active TOUTES
// les regles `sonarjs/recommended`, y compris celles neutralisees dans
// `eslint.config.mjs` (cf. bloc "Baseline sonarjs").
//
// Sert uniquement a re-mesurer la dette sonarjs (`pnpm run quality:sonar`).
// N est jamais utilisee par `lint`, `ci:check` ni le hook pre-push : cette
// config sort volontairement en erreur tant que la dette n est pas resorbee.
import sonarjs from 'eslint-plugin-sonarjs';
import baseConfig from './eslint.config.mjs';

export default [
  ...baseConfig,
  sonarjs.configs.recommended,
  {
    // En flat config, redonner uniquement la severite conserve les options
    // deja posees : sans ce bloc, `cognitive-complexity` garderait le seuil
    // cliquet de 51 de `eslint.config.mjs` au lieu du seuil sonar (15).
    rules: {
      'sonarjs/cognitive-complexity': ['error', 15],
    },
  },
];
