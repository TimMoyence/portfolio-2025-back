import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = join(__dirname, 'Formule.ts');
const INTERDITS = [
  /\beval\s*\(/,
  /\bnew\s+Function\b/,
  /\bFunction\s*\(/,
  /\bimport\s*\(/,
  /\brequire\s*\(/,
  /\bsetTimeout\s*\(\s*['"`]/,
  /\bglobalThis\b/,
  /\[\s*['"`][^'"`]*['"`]\s*\]\s*\(/,
];
describe('le moteur de formules n execute jamais la saisie, tapée par un étudiant, comme du code', () => {
  it('sa source ne contient aucune construction de code a l execution', () => {
    const contenu = readFileSync(SOURCE, 'utf8');

    expect(contenu.length).toBeGreaterThan(0);
    expect(
      INTERDITS.filter((motif) => motif.test(contenu)).map(
        (motif) => motif.source,
      ),
    ).toEqual([]);
  });

  it('chaque construction interdite serait reconnue', () => {
    const temoins = [
      'eval("1+1")',
      'new Function("a", "return a")',
      'Function("return 1")',
      'import("x")',
      'require("x")',
      'setTimeout("x()", 1)',
      'globalThis.x',
      'window["eval"]("1")',
    ];

    expect(
      temoins.map((temoin) => INTERDITS.some((motif) => motif.test(temoin))),
    ).not.toContain(false);
  });
});
