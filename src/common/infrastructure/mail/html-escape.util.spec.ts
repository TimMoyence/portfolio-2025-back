import { escapeHtml, safeHtml } from './html-escape.util';

describe('escapeHtml', () => {
  it('echappe tous les caracteres HTML sensibles', () => {
    expect(escapeHtml('<a href="x">&\'')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#39;',
    );
  });

  it('echappe `&` en premier (pas de double echappement des entites)', () => {
    // Si `&` n'etait pas echappe en premier, `<` deviendrait `&amp;lt;`.
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
    expect(safeHtml`<ul>${safeHtml`<li>x</li>`}</ul>`).toBe(
      '<ul><li>x</li></ul>',
    );
  });
});

describe('etancheite du type : ce que le compilateur doit refuser', () => {
  it('refuse un tableau de chaines brutes', () => {
    const items = ['<script>alert(1)</script>'];

    // @ts-expect-error un `string[]` n'est pas un `readonly EscapedHtml[]` —
    // verrouille le motif `.map()` employe par les mailers avant migration.
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
