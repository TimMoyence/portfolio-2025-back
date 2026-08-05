// Stryker (mutation testing) temporairement desactive.
// Pour reactiver : decommenter le bloc ci-dessous ET restaurer la cle
// "test:mutation" dans package.json (actuellement prefixee par "//").
//
// /** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
// export default {
//   testRunner: 'jest',
//   checkers: ['typescript'],
//   tsconfigFile: 'tsconfig.json',
//   mutate: [
//     'src/modules/*/domain/**/*.ts',
//     'src/modules/*/application/**/*.ts',
//     'src/common/domain/**/*.ts',
//     '!src/**/*.spec.ts',
//     '!src/**/*.module.ts',
//   ],
//   thresholds: { high: 80, low: 60, break: 50 },
//   reporters: ['clear-text', 'html'],
//   jest: {
//     configFile: 'package.json',
//   },
// };
