import { escapeHtml, escapeUrl, safeHtml } from './html-escape.util';

describe('escapeHtml', () => {
  it('echappe tous les caracteres HTML sensibles', () => {
    expect(escapeHtml('<a href="x">&\'')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#39;',
    );
  });

  it('echappe `&` en premier (pas de double echappement des entites)', () => {
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('ne throw pas sur null et coerce via String()', () => {
    expect(() => escapeHtml(null)).not.toThrow();
    expect(escapeHtml(null)).toBe('null');
    expect(escapeHtml(undefined)).toBe('undefined');
    expect(escapeHtml(42)).toBe('42');
  });
});

describe('escapeUrl — schemas admis', () => {
  it.each([
    'https://asilidesign.fr/growth-audit?a=1#x',
    'http://example.com/',
    'mailto:tim.moyence@outlook.fr',
  ])('laisse passer %s intacte', (url) => {
    expect(escapeUrl(url)).toBe(url);
  });

  it("n'ajoute pas la barre finale que `new URL` insererait", () => {
    expect(escapeUrl('https://asilidesign.fr')).toBe('https://asilidesign.fr');
  });

  it.each([
    '/formations/ia-solopreneurs/toolkit',
    '../x',
    '#ancre',
    'page.html',
  ])('laisse passer la reference relative %s', (url) => {
    expect(escapeUrl(url)).toBe(url);
  });

  it("echappe les metacaracteres d'une URL admise (pas de sortie d'attribut)", () => {
    expect(escapeUrl('https://asilidesign.fr/?a="onmouseover="alert(1)')).toBe(
      'https://asilidesign.fr/?a=&quot;onmouseover=&quot;alert(1)',
    );
  });
});

describe('escapeUrl — schemas refusees et contournements', () => {
  it.each([
    ['minuscule', 'javascript:alert(1)'],
    ['casse mixte', 'JaVaScRiPt:alert(1)'],
    ['majuscules', 'JAVASCRIPT:alert(1)'],
    ['tabulation dans le schema', 'java\tscript:alert(1)'],
    ['saut de ligne dans le schema', 'java\nscript:alert(1)'],
    ['retour chariot dans le schema', 'java\rscript:alert(1)'],
    ['espace en tete', ' javascript:alert(1)'],
    ['tabulation verticale en tete', '\u000Bjavascript:alert(1)'],
    ['nul en tete', '\u0000javascript:alert(1)'],
    ['data', 'data:text/html,<script>alert(1)</script>'],
    [
      'data base64',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    ],
    ['vbscript', 'vbscript:msgbox(1)'],
    ['file', 'file:///etc/passwd'],
  ])('neutralise %s', (_label, url) => {
    expect(escapeUrl(url)).toBe('#');
  });

  it.each(['', '   ', '\t\n'])('neutralise la valeur vide %j', (url) => {
    expect(escapeUrl(url)).toBe('#');
  });

  it("neutralise le schema encode en entite HTML par l'echappement du `&`", () => {
    const rendered = safeHtml`<a href="${escapeUrl('&#106;avascript:alert(1)')}">x</a>`;

    expect(rendered).toBe('<a href="&amp;#106;avascript:alert(1)">x</a>');
    expect(rendered).not.toContain('&#106;a');
  });

  it('neutralise le schema encode en entite hexadecimale', () => {
    expect(escapeUrl('&#x6a;avascript:alert(1)')).toBe(
      '&amp;#x6a;avascript:alert(1)',
    );
  });
});

describe('escapeUrl — etancheite du type', () => {
  it('produit un fragment interpolable dans safeHtml', () => {
    expect(
      safeHtml`<a href="${escapeUrl('https://asilidesign.fr/x')}">x</a>`,
    ).toBe('<a href="https://asilidesign.fr/x">x</a>');
  });

  it('refuse une URL brute non passee par escapeUrl', () => {
    const url = 'javascript:alert(1)';

    // @ts-expect-error une string brute n'est pas un fragment sur
    const rendered: string = safeHtml`<a href="${url}">x</a>`;

    expect(rendered).toContain('javascript:');
  });

  it('ne throw pas et coerce via String(), comme escapeHtml', () => {
    expect(() => escapeUrl(null)).not.toThrow();
    expect(escapeUrl(null)).toBe('null');
    expect(escapeUrl(undefined)).toBe('undefined');
    expect(escapeUrl(42)).toBe('42');
  });
});

describe('safeHtml', () => {
  it('concatene comme un template litteral ordinaire', () => {
    const name = escapeHtml('Asili');
    expect(safeHtml`<p>Bonjour ${name}, ${42} points</p>`).toBe(
      `<p>Bonjour Asili, 42 points</p>`,
    );
  });

  it('concatene les tableaux de fragments sans separateur', () => {
    const items = ['a', 'b'].map((v) => safeHtml`<li>${escapeHtml(v)}</li>`);
    expect(safeHtml`<ul>${items}</ul>`).toBe('<ul><li>a</li><li>b</li></ul>');
  });

  it('ne re-echappe pas un fragment deja echappe', () => {
    const escaped = escapeHtml('<b>');
    expect(safeHtml`<p>${escaped}</p>`).toBe('<p>&lt;b&gt;</p>');
  });

  it('rend le tableau vide comme une chaine vide', () => {
    const items: ReturnType<typeof escapeHtml>[] = [];
    expect(safeHtml`<ul>${items}</ul>`).toBe('<ul></ul>');
  });

  it("n'echappe rien au runtime : la garantie est portee par le type", () => {
    const raw = '<script>alert(1)</script>';

    // @ts-expect-error une chaine brute n'est pas un fragment sur
    const rendered: string = safeHtml`<p>${raw}</p>`;

    expect(rendered).toBe('<p><script>alert(1)</script></p>');
  });
});

describe('safeHtml sans interpolation — le HTML statique legitime', () => {
  it("rend le litteral verbatim, sans l'echapper", () => {
    expect(safeHtml`<li>Aucun.</li>`).toBe('<li>Aucun.</li>');
  });

  it('rend le gabarit vide comme une chaine vide', () => {
    expect(safeHtml``).toBe('');
  });

  it('produit un fragment interpolable par un autre safeHtml', () => {
    const item = safeHtml`<li>x</li>`;

    expect(safeHtml`<ul>${item}</ul>`).toBe('<ul><li>x</li></ul>');
  });
});

describe('etancheite du type : ce que le compilateur doit refuser', () => {
  it('refuse un tableau de chaines brutes', () => {
    const items = ['<script>alert(1)</script>'];

    // @ts-expect-error un `string[]` n'est pas un `readonly EscapedHtml[]`
    const rendered: string = safeHtml`<ul>${items}</ul>`;

    expect(rendered).toContain('<script>');
  });

  it('refuse une valeur arbitraire non marquee', () => {
    const value = { toString: () => '<img onerror=alert(1) />' };

    // @ts-expect-error seuls EscapedHtml, number et EscapedHtml[] sont admis.
    const rendered: string = safeHtml`<p>${value}</p>`;

    expect(rendered).toContain('<p>');
  });
});
