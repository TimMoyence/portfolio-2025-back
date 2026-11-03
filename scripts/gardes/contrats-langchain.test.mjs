import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ESLint } from 'eslint';

import { RACINE } from '../lib/racine.mjs';

const eslint = new ESLint({ cwd: RACINE });

const importsRefuses = async (source) => {
  const [resultat] = await eslint.lintText(source, { filePath: 'src/main.ts' });
  return resultat.messages
    .filter((message) => message.ruleId === 'no-restricted-imports')
    .map((message) => message.message);
};

void test('hors d’automation, les contrats langchain ne s’importent que par le re-export de langchain-audit-report.service', async () => {
  assert.deepEqual(
    await importsRefuses(
      "export type { ExpertReport } from './modules/audit-requests/infrastructure/automation/redaction/contracts/langchain-contracts';\n",
    ),
    [
      "'./modules/audit-requests/infrastructure/automation/redaction/contracts/langchain-contracts' import is restricted from being used by a pattern. Importer ces contrats via langchain-audit-report.service (re-export) afin de preserver un unique point d entree.",
    ],
  );
});
