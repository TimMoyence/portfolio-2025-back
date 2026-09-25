import { CitationWorthinessService } from './citation-worthiness.service';

describe('CitationWorthinessService', () => {
  const service = new CitationWorthinessService();

  it('détecte un article avec auteur, date, sources et faits → score > 60', () => {
    const longParagraph = 'Un paragraphe riche en contenu éditorial. '.repeat(
      120,
    );
    const html = `<html>
      <head><meta name="author" content="Jane Doe"></head>
      <body>
        <article>
          <h1>Analyse</h1>
          <h2>Contexte</h2>
          <time datetime="2026-01-01">1 janvier 2026</time>
          <p>Selon <a href="https://www.nature.com/article-x">Nature</a>,
             72% des cas étudiés montrent...</p>
          <cite>Source : INSEE 2025</cite>
          <p>${longParagraph}</p>
        </article>
      </body>
    </html>`;
    const result = service.analyze(html, 'https://example.com');
    expect(result.hasAuthor).toBe(true);
    expect(result.hasDates).toBe(true);
    expect(result.hasSources).toBe(true);
    expect(result.hasFacts).toBe(true);
    expect(result.contentDensity).toBe('high');
    expect(result.score).toBeGreaterThan(60);
  });

  it('pénalise un contenu vide → score < 20', () => {
    const result = service.analyze(
      '<html><body></body></html>',
      'https://x.test',
    );
    expect(result.score).toBeLessThan(20);
    expect(result.contentDensity).toBe('low');
    expect(result.hasAuthor).toBe(false);
    expect(result.hasDates).toBe(false);
    expect(result.hasSources).toBe(false);
    expect(result.hasFacts).toBe(false);
  });

  it('classifie la densité medium entre 200 et 400 mots', () => {
    const text = 'mot '.repeat(300);
    const html = `<html><body><article><p>${text}</p></article></body></html>`;
    const result = service.analyze(html, 'https://example.com');
    expect(result.contentDensity).toBe('medium');
  });

  it.each([
    [
      'ignore les liens vers le même domaine pour les sources',
      '<a href="https://example.com/another">interne</a>',
      'hasSources',
      false,
    ],
    [
      'détecte les faits via nombres à 2+ chiffres',
      '<article><p>En 2025, plus de 1200 utilisateurs ont...</p></article>',
      'hasFacts',
      true,
    ],
    [
      'détecte une source externe vers un domaine d autorité',
      '<a href="https://www.reuters.com/story">Reuters</a>',
      'hasSources',
      true,
    ],
    [
      'détecte un auteur via rel="author"',
      '<a rel="author" href="/team">Jane</a>',
      'hasAuthor',
      true,
    ],
    [
      'détecte un auteur via itemprop="author"',
      '<span itemprop="author">Jane</span>',
      'hasAuthor',
      true,
    ],
    [
      'ignore les liens avec URL invalide (relative sans base)',
      '<a href="not-a-valid-url">x</a>',
      'hasSources',
      false,
    ],
    [
      'arrête la détection après la première source trouvée (short-circuit)',
      `<a href="https://www.nature.com/a">first</a>
      <a href="https://www.reuters.com/b">second</a>
      <a href="https://www.bbc.com/c">third</a>`,
      'hasSources',
      true,
    ],
    [
      'ignore les liens vers un domaine non autoritaire',
      '<a href="https://random-blog.xyz/x">random</a>',
      'hasSources',
      false,
    ],
  ] as const)('%s', (_titre, corps, signal, attendu) => {
    const html = `<html><body>${corps}</body></html>`;
    const result = service.analyze(html, 'https://example.com');
    expect(result[signal]).toBe(attendu);
  });

  it('gère une URL de page mal formée en retournant score bas', () => {
    const result = service.analyze('<html><body></body></html>', 'not a url');
    expect(result.score).toBeLessThan(20);
  });

  it('score plafonné entre 0 et 100', () => {
    const longParagraph = 'a '.repeat(1000);
    const html = `<html>
      <head><meta name="author" content="X"></head>
      <body>
        <article>
          <h1>H1</h1><h2>H2</h2>
          <time datetime="2026-01-01">date</time>
          <a href="https://nature.com/a">nature</a>
          <p>99% ${longParagraph}</p>
          <cite>INSEE</cite>
        </article>
      </body>
    </html>`;
    const result = service.analyze(html, 'https://example.com');
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
