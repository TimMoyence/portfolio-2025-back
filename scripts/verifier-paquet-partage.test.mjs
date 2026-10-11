import assert from 'node:assert/strict';
import { test } from 'node:test';
import { comparerLesSources } from './verifier-paquet-partage.mjs';

const ARCHIVE =
  'https://github.com/TimMoyence/portfolio-2025-partage/releases/download/v1.0.0/portfolio-2025-partage-1.0.0.tgz';
const avec = (source) => ({
  dependencies: { 'portfolio-2025-partage': source },
});

void test('la meme archive des deux cotes passe', () => {
  assert.equal(
    comparerLesSources(avec(ARCHIVE), avec(ARCHIVE)).bloquant,
    false,
  );
});

void test('deux archives differentes bloquent', () => {
  const autre = ARCHIVE.replaceAll('1.0.0', '1.1.0');

  assert.equal(comparerLesSources(avec(ARCHIVE), avec(autre)).bloquant, true);
});

void test('un back sans le paquet bloque, un front pas encore branche ne bloque pas', () => {
  assert.equal(comparerLesSources({}, avec(ARCHIVE)).bloquant, true);
  assert.equal(comparerLesSources(avec(ARCHIVE), {}).bloquant, false);
});
