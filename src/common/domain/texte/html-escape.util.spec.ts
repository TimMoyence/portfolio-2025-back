import {
  escapeHtml,
  escapeUrl,
  htmlEmis,
  safeCss,
  safeHtml,
  type EscapedHtml,
  type FeuilleDeStyle,
  type UrlEchappee,
} from './html-escape.util';

const refuseChaqueInterpolation = (
  cas: readonly (readonly [string, () => unknown])[],
): void => {
  it.each(cas)('refuse une interpolation dans %s', (_nom, rendre) => {
    expect(rendre).toThrow(/Interpolation refusée/);
  });
};

const rendChaqueCasAttendu = (
  intitule: string,
  cas: readonly (readonly [string, () => EscapedHtml, string])[],
): void => {
  it.each(cas)(intitule, (_nom, rendre, attendu) => {
    expect(htmlEmis(rendre())).toBe(attendu);
  });
};

const lienEmis = (url: UrlEchappee): string =>
  htmlEmis(safeHtml`<a href="${url}">x</a>`);

const lienVers = (url: Parameters<typeof escapeUrl>[0]): string =>
  lienEmis(escapeUrl(url));

const ancre = (href: string): string => `<a href="${href}">x</a>`;

const styleDe = (feuille: FeuilleDeStyle): string =>
  htmlEmis(safeHtml`<style>${feuille}</style>`);

describe('escapeHtml', () => {
  it('echappe tous les caracteres HTML sensibles', () => {
    expect(htmlEmis(escapeHtml('<a href="x">&\''))).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#39;',
    );
  });

  it('echappe `&` en premier (pas de double echappement des entites)', () => {
    expect(htmlEmis(escapeHtml('<'))).toBe('&lt;');
    expect(htmlEmis(escapeHtml('&lt;'))).toBe('&amp;lt;');
  });

  it('ne throw pas sur null et coerce via String()', () => {
    expect(() => escapeHtml(null)).not.toThrow();
    expect(htmlEmis(escapeHtml(null))).toBe('null');
    expect(htmlEmis(escapeHtml(undefined))).toBe('undefined');
    expect(htmlEmis(escapeHtml(42))).toBe('42');
  });
});

describe('escapeHtml et escapeUrl — un objet n a pas de texte a echapper', () => {
  const titre = safeHtml`<b>Titre</b>`;
  const objetQuiSeDit = { toString: () => '<b>Titre</b>' };

  it.each([
    ['escapeHtml d un fragment emis', () => escapeHtml(titre as never)],
    ['escapeUrl d un fragment emis', () => escapeUrl(titre as never)],
    ['escapeHtml d un objet', () => escapeHtml(objetQuiSeDit as never)],
    ['escapeUrl d un objet', () => escapeUrl(objetQuiSeDit as never)],
    ['escapeHtml d une fonction', () => escapeHtml((() => '<b>') as never)],
  ])('refuse %s au lieu de rendre [object Object]', (_nom, echapper) => {
    expect(echapper).toThrow(/Échappement refusé/);
  });

  it('refuse un objet a la compilation', () => {
    // @ts-expect-error un fragment emis n'est pas un texte a echapper
    expect(() => escapeHtml(titre)).toThrow(/Échappement refusé/);
    // @ts-expect-error un fragment emis n'est pas une URL a echapper
    expect(() => escapeUrl(titre)).toThrow(/Échappement refusé/);
  });
});

describe('escapeUrl — schemas admis', () => {
  it.each([
    'https://asilidesign.fr/growth-audit?a=1#x',
    'http://example.com/',
    'mailto:tim.moyence@outlook.fr',
  ])('laisse passer %s intacte', (url) => {
    expect(lienVers(url)).toBe(ancre(url));
  });

  it("n'ajoute pas la barre finale que `new URL` insererait", () => {
    expect(lienVers('https://asilidesign.fr')).toBe(
      ancre('https://asilidesign.fr'),
    );
  });

  it.each([
    '/formations/ia-solopreneurs/toolkit',
    '../x',
    '#ancre',
    'page.html',
  ])('laisse passer la reference relative %s', (url) => {
    expect(lienVers(url)).toBe(ancre(url));
  });

  it("echappe les metacaracteres d'une URL admise (pas de sortie d'attribut)", () => {
    expect(lienVers('https://asilidesign.fr/?a="onmouseover="alert(1)')).toBe(
      ancre('https://asilidesign.fr/?a=&quot;onmouseover=&quot;alert(1)'),
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
    expect(lienVers(url)).toBe(ancre('#'));
  });

  it.each(['', '   ', '\t\n'])('neutralise la valeur vide %j', (url) => {
    expect(lienVers(url)).toBe(ancre('#'));
  });

  it("neutralise le schema encode en entite HTML par l'echappement du `&`", () => {
    const rendered = lienVers('&#106;avascript:alert(1)');

    expect(rendered).toBe('<a href="&amp;#106;avascript:alert(1)">x</a>');
    expect(rendered).not.toContain('&#106;a');
  });

  it('neutralise le schema encode en entite hexadecimale', () => {
    expect(lienVers('&#x6a;avascript:alert(1)')).toBe(
      ancre('&amp;#x6a;avascript:alert(1)'),
    );
  });
});

describe('escapeUrl — etancheite du type', () => {
  it('produit un fragment interpolable dans safeHtml', () => {
    expect(
      htmlEmis(
        safeHtml`<a href="${escapeUrl('https://asilidesign.fr/x')}">x</a>`,
      ),
    ).toBe('<a href="https://asilidesign.fr/x">x</a>');
  });

  it('refuse une URL brute non passee par escapeUrl, a la compilation comme au rendu', () => {
    const url = 'javascript:alert(1)';

    // @ts-expect-error une string brute n'est pas un fragment sur
    expect(() => safeHtml`<a href="${url}">x</a>`).toThrow(
      /Interpolation refusée/,
    );
  });

  it('ne throw pas et coerce via String(), comme escapeHtml', () => {
    expect(() => escapeUrl(null)).not.toThrow();
    expect(lienVers(null)).toBe(ancre('null'));
    expect(lienVers(undefined)).toBe(ancre('undefined'));
    expect(lienVers(42)).toBe(ancre('42'));
  });
});

describe('safeHtml en contexte sensible', () => {
  const LIEN_PIEGE = 'javascript:alert(1)';

  it('refuse une valeur seulement echappee dans un href', () => {
    expect(
      () => safeHtml`<a href="${escapeHtml(LIEN_PIEGE)}">lien</a>`,
    ).toThrow(/href/);
  });

  refuseChaqueInterpolation([
    [
      'un mailto seulement echappe',
      () => safeHtml`<a href="mailto:${escapeHtml('a@b.fr')}">x</a>`,
    ],
    [
      'src entre apostrophes',
      () => safeHtml`<img src='${escapeHtml(LIEN_PIEGE)}' alt="" />`,
    ],
    [
      'href sans guillemets',
      () => safeHtml`<a href=${escapeHtml(LIEN_PIEGE)}>lien</a>`,
    ],
    [
      'style',
      () => safeHtml`<span style="color: ${escapeHtml('red')}"></span>`,
    ],
    [
      'gestionnaire onclick',
      () => safeHtml`<button onclick="${escapeHtml('x')}"></button>`,
    ],
    [
      'url dans un style',
      () =>
        safeHtml`<span style="background:${escapeUrl('https://a.fr')}"></span>`,
    ],
  ]);

  it('accepte un nombre dans un attribut style, qui ne peut porter aucune charge', () => {
    expect(htmlEmis(safeHtml`<span style="width:${58}%"></span>`)).toBe(
      '<span style="width:58%"></span>',
    );
  });

  rendChaqueCasAttendu('accepte %s', [
    ['un texte', () => safeHtml`<p>${escapeHtml('a<b')}</p>`, '<p>a&lt;b</p>'],
    [
      'un attribut ordinaire',
      () => safeHtml`<p class="${escapeHtml('a"b')}"></p>`,
      '<p class="a&quot;b"></p>',
    ],
    [
      'un attribut ferme avant l interpolation',
      () => safeHtml`<a href="/x">${escapeHtml('lien')}</a>`,
      '<a href="/x">lien</a>',
    ],
    [
      'une feuille de style construite par safeCss',
      () => {
        const feuille = safeCss`a { color: ${'#fff'}; }`;
        return safeHtml`<style>${feuille}</style>`;
      },
      '<style>a { color: #fff; }</style>',
    ],
    [
      'un texte apres une feuille de style fermee',
      () => safeHtml`<style>a{}</style><p>${escapeHtml('x')}</p>`,
      '<style>a{}</style><p>x</p>',
    ],
    [
      'un titre de document, dont le contenu reste du texte',
      () => safeHtml`<title>${escapeHtml('a"b')}</title>`,
      '<title>a&quot;b</title>',
    ],
    [
      'une classe completee en cours de valeur',
      () => safeHtml`<p class="carte ${escapeHtml('solo')}"></p>`,
      '<p class="carte solo"></p>',
    ],
    [
      'une URL entre apostrophes',
      () => safeHtml`<a href='${escapeUrl('https://a.fr')}'>x</a>`,
      "<a href='https://a.fr'>x</a>",
    ],
    [
      'une couleur de presentation',
      () => safeHtml`<circle fill="${escapeHtml('#4fb3a2')}"/>`,
      '<circle fill="#4fb3a2"/>',
    ],
    [
      'un lien dans un commentaire conditionnel Outlook',
      () =>
        safeHtml`<!--[if mso]><v:roundrect href="${escapeUrl('https://a.fr')}"></v:roundrect><![endif]-->`,
      '<!--[if mso]><v:roundrect href="https://a.fr"></v:roundrect><![endif]-->',
    ],
  ]);
});

describe('safeHtml — le contexte suit le HTML rendu, pas le texte des valeurs', () => {
  it('rend un prenom termine par un faux attribut, suivi du nom, comme la synthese de seance', () => {
    expect(
      htmlEmis(
        safeHtml`<td style="padding:4px;">${escapeHtml('Theo onclick=')} ${escapeHtml('Martin')}</td>`,
      ),
    ).toBe('<td style="padding:4px;">Theo onclick= Martin</td>');
  });

  it('reste dans le contenu brut quand </style n est pas suivi d un blanc, de / ou de >', () => {
    expect(
      () => safeHtml`<style></stylex>${escapeHtml('a{}')}</style>`,
    ).toThrow(/Interpolation refusée/);
  });

  it('sort du contenu brut sur une fermeture suivie d un blanc', () => {
    expect(htmlEmis(safeHtml`<style></style >${escapeHtml('a')}`)).toBe(
      '<style></style >a',
    );
  });

  it('rend un prenom qui ressemble a un attribut, suivi d un lien', () => {
    const prenom = escapeHtml('Theo onclick=');

    expect(
      htmlEmis(
        safeHtml`<p>Bonjour ${prenom}, <a href="${escapeUrl('https://a.fr')}">revoir</a></p>`,
      ),
    ).toBe('<p>Bonjour Theo onclick=, <a href="https://a.fr">revoir</a></p>');
  });

  it.each([
    ['href=', 'href='],
    ['style="', 'style=&quot;'],
    ['<a href=', '&lt;a href='],
  ])(
    'ne prend pas le texte %s d une valeur pour un attribut ouvert',
    (brut, rendu) => {
      expect(
        htmlEmis(
          safeHtml`<p>${escapeHtml(brut)}${escapeUrl('https://a.fr')}</p>`,
        ),
      ).toBe(`<p>${rendu}https://a.fr</p>`);
    },
  );

  it('suit un fragment qui ouvre lui-meme un attribut d URL', () => {
    const ouvrant = safeHtml`<a href="`;

    expect(
      () => safeHtml`${ouvrant}${escapeHtml('javascript:alert(1)')}">x</a>`,
    ).toThrow(/Interpolation refusée/);
  });

  it('verifie chaque element d un tableau comme une interpolation a part', () => {
    const ouvrant = safeHtml`<a href="`;
    const elements = [ouvrant, escapeHtml('javascript:alert(1)')];

    expect(() => safeHtml`${elements}">x</a>`).toThrow(/Interpolation refusée/);
  });

  it('accepte dans un attribut descriptif un fragment qui y reste', () => {
    const classe = safeHtml` pillar-${escapeHtml('ok')}`;

    expect(htmlEmis(safeHtml`<p class="card${classe}">x</p>`)).toBe(
      '<p class="card pillar-ok">x</p>',
    );
  });

  refuseChaqueInterpolation([
    [
      'un attribut descriptif qu un fragment imbrique referme',
      () => {
        const libelle = safeHtml`Le "${escapeHtml('x onmouseover=alert(1)//')}"`;
        return safeHtml`<a href="${escapeUrl('/x')}" title="${libelle}">lien</a>`;
      },
    ],
    [
      'un commentaire qu un fragment imbrique referme',
      () => {
        const charge = safeHtml`<i title="--><img src=x onerror=${escapeHtml('alert(1)//')} ">`;
        return safeHtml`<!-- ${charge} -->`;
      },
    ],
    [
      'un element style qu une feuille referme',
      () => {
        const feuille = safeCss`a{}</style><b>`;
        return safeHtml`<style>${feuille}</style>`;
      },
    ],
  ]);

  refuseChaqueInterpolation([
    [
      'un script que seul un blanc non HTML semble fermer',
      () => safeHtml`<script></script\u00a0>${escapeHtml('alert(1)')}</script>`,
    ],
    [
      'une balise dont un blanc non HTML prolonge le nom',
      () =>
        safeHtml`<p\u00a0title="${escapeHtml('x onclick=alert(1)//')}">x</p>`,
    ],
  ]);
});

describe('safeHtml — contextes ou l echappement HTML ne protege de rien', () => {
  const PIEGE = 'javascript:alert(1)';

  refuseChaqueInterpolation([
    ['formaction', () => safeHtml`<button formaction="${escapeHtml(PIEGE)}">`],
    ['action', () => safeHtml`<form action="${escapeUrl('https://a.fr')}">`],
    ['xlink:href', () => safeHtml`<use xlink:href="${escapeHtml(PIEGE)}"/>`],
    ['data d un objet', () => safeHtml`<object data="${escapeHtml(PIEGE)}">`],
    [
      'content d un meta refresh',
      () =>
        safeHtml`<meta http-equiv="refresh" content="${escapeHtml('0;url=' + PIEGE)}">`,
    ],
    [
      'srcdoc, meme avec une URL admise',
      () => safeHtml`<iframe srcdoc="${escapeUrl('https://a.fr')}">`,
    ],
    ['srcset', () => safeHtml`<img srcset="${escapeHtml(PIEGE)}">`],
    ['poster', () => safeHtml`<video poster="${escapeHtml(PIEGE)}">`],
    ['background', () => safeHtml`<td background="${escapeHtml(PIEGE)}">`],
    [
      'un attribut colle au precedent',
      () => safeHtml`<a title="x"href="${escapeHtml(PIEGE)}">x</a>`,
    ],
    [
      'un attribut ordinaire sans guillemets',
      () => safeHtml`<img alt=${escapeHtml('x onerror=alert(1)')}>`,
    ],
    [
      'la suite d une valeur sans guillemets',
      () =>
        safeHtml`<a href=https://a.fr/${escapeHtml('x onmouseover=alert(1)')}>x</a>`,
    ],
    [
      'la position d un nom d attribut',
      () => safeHtml`<div ${escapeHtml('onclick=alert(1)')}>`,
    ],
    ['un nom de balise', () => safeHtml`<${escapeHtml('script')}>`],
    [
      'une feuille de style',
      () =>
        safeHtml`<style>${escapeHtml('}body{background:url(https://x)}')}</style>`,
    ],
    ['un script', () => safeHtml`<script>var a = ${escapeHtml('1')}</script>`],
    [
      'une URL precedee d un debut de valeur',
      () => safeHtml`<a href="https://a.fr/${escapeUrl('x')}">x</a>`,
    ],
    [
      'une URL suivie d une fin de valeur',
      () => safeHtml`<a href="${escapeUrl('https://a.fr')}/x">x</a>`,
    ],
    [
      'une couleur qui charge une ressource',
      () => safeHtml`<circle fill="${escapeHtml('url(https://x/a.svg#b)')}"/>`,
    ],
    [
      'une feuille de style hors d un element style',
      () => {
        const feuille = safeCss`a{}`;
        return safeHtml`<p>${feuille}</p>`;
      },
    ],
  ]);

  it('refuse une URL contrefaite qui n a pas ete emise par escapeUrl', () => {
    const contrefaite = {
      genre: 'url',
      toString: () => PIEGE,
    } as unknown as ReturnType<typeof escapeUrl>;

    expect(() => safeHtml`<a href="${contrefaite}">x</a>`).toThrow(
      /Interpolation refusée/,
    );
  });
});

describe('safeCss', () => {
  it('assemble une feuille de style a partir de jetons et de nombres', () => {
    expect(styleDe(safeCss`a { color: ${'#fff'}; width: ${58}%; }`)).toBe(
      '<style>a { color: #fff; width: 58%; }</style>',
    );
  });

  it('concatene des feuilles imbriquees', () => {
    const imbriquees = [safeCss`a{}`, safeCss`b{}`];

    expect(styleDe(safeCss`${imbriquees}c{}`)).toBe('<style>a{}b{}c{}</style>');
  });

  it.each(['red;}body{x:y', 'url(https://x)', 'a b', '</style>', ''])(
    'refuse le jeton %p, qui sortirait de sa declaration',
    (jeton) => {
      expect(() => safeCss`a { color: ${jeton}; }`).toThrow(/Jeton CSS refusé/);
    },
  );

  it('refuse une feuille contrefaite qui n a pas ete emise par safeCss', () => {
    const contrefaite = {
      genre: 'style',
      toString: () => '}body{x:y}',
    } as unknown as ReturnType<typeof safeCss>;

    expect(() => safeCss`${contrefaite}`).toThrow(/Jeton CSS refusé/);
  });
});

describe('safeHtml', () => {
  it('concatene comme un template litteral ordinaire', () => {
    const name = escapeHtml('Asili');
    expect(htmlEmis(safeHtml`<p>Bonjour ${name}, ${42} points</p>`)).toBe(
      `<p>Bonjour Asili, 42 points</p>`,
    );
  });

  it('concatene les tableaux de fragments sans separateur', () => {
    const items = ['a', 'b'].map((v) => safeHtml`<li>${escapeHtml(v)}</li>`);
    expect(htmlEmis(safeHtml`<ul>${items}</ul>`)).toBe(
      '<ul><li>a</li><li>b</li></ul>',
    );
  });

  it('ne re-echappe pas un fragment deja echappe', () => {
    const escaped = escapeHtml('<b>');
    expect(htmlEmis(safeHtml`<p>${escaped}</p>`)).toBe('<p>&lt;b&gt;</p>');
  });

  it('rend le tableau vide comme une chaine vide', () => {
    const items: ReturnType<typeof escapeHtml>[] = [];
    expect(htmlEmis(safeHtml`<ul>${items}</ul>`)).toBe('<ul></ul>');
  });

  it('rend les trous d un tableau creux comme des chaines vides', () => {
    const cellules = new Array<EscapedHtml>(3);
    cellules[2] = safeHtml`<td>c</td>`;
    const feuilles = new Array<FeuilleDeStyle>(2);
    feuilles[1] = safeCss`b{}`;

    expect(htmlEmis(safeHtml`<tr>${cellules}</tr>`)).toBe(
      '<tr><td>c</td></tr>',
    );
    expect(styleDe(safeCss`${feuilles}`)).toBe('<style>b{}</style>');
  });

  it('echappe au rendu une chaine brute, que le compilateur refuse deja', () => {
    const raw = '<script>alert(1)</script>';

    // @ts-expect-error une chaine brute n'est pas un fragment sur
    const rendered = htmlEmis(safeHtml`<p>${raw}</p>`);

    expect(rendered).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });
});

describe('safeHtml sans interpolation — le HTML statique legitime', () => {
  it("rend le litteral verbatim, sans l'echapper", () => {
    expect(htmlEmis(safeHtml`<li>Aucun.</li>`)).toBe('<li>Aucun.</li>');
  });

  it('rend le gabarit vide comme une chaine vide', () => {
    expect(htmlEmis(safeHtml``)).toBe('');
  });

  it('produit un fragment interpolable par un autre safeHtml', () => {
    const item = safeHtml`<li>x</li>`;

    expect(htmlEmis(safeHtml`<ul>${item}</ul>`)).toBe('<ul><li>x</li></ul>');
  });
});

describe('etancheite du type : ce que le compilateur doit refuser', () => {
  it('refuse un tableau de chaines brutes, et l echappe au rendu', () => {
    const items = ['<script>alert(1)</script>'];

    // @ts-expect-error un `string[]` n'est pas un `readonly EscapedHtml[]`
    const rendered = htmlEmis(safeHtml`<ul>${items}</ul>`);

    expect(rendered).toBe('<ul>&lt;script&gt;alert(1)&lt;/script&gt;</ul>');
  });

  it('refuse une valeur arbitraire non marquee, a la compilation comme au rendu', () => {
    const value = { toString: () => '<img onerror=alert(1) />' };

    // @ts-expect-error seuls EscapedHtml, number et EscapedHtml[] sont admis.
    expect(() => safeHtml`<p>${value}</p>`).toThrow(/Interpolation refusée/);
  });
});

describe('etancheite a l execution : ce que le compilateur laisse passer', () => {
  const ARBITRAIRE = '<img src=x onerror=alert(1)>';

  const pieger = <T>(elements: unknown[], substitut: string): T[] => {
    function leurre() {
      return new Proxy(Object.assign([substitut], { map: () => [substitut] }), {
        defineProperty: () => true,
      });
    }
    const methodes = Object.getOwnPropertyNames(Array.prototype).filter(
      (nom) => nom !== 'length' && nom !== 'constructor',
    );
    return Object.assign(
      elements,
      Object.fromEntries(methodes.map((nom) => [nom, leurre])),
      {
        [Symbol.iterator]: () => [substitut][Symbol.iterator](),
        constructor: { [Symbol.species]: leurre },
      },
    ) as unknown as T[];
  };

  it('ignore les methodes propres d un tableau interpole', () => {
    const liens = pieger<EscapedHtml>(
      [escapeUrl('https://ok.example')],
      'javascript:alert(1)',
    );
    const feuilles = pieger<EscapedHtml>(
      [safeCss`b{}`],
      '</style><script>alert(1)</script>',
    );
    const lignes = pieger<EscapedHtml>([escapeHtml('a')], ARBITRAIRE);

    expect(htmlEmis(safeHtml`<a href="${liens}">x</a>`)).toBe(
      '<a href="https://ok.example">x</a>',
    );
    expect(htmlEmis(safeHtml`<style>${feuilles}</style>`)).toBe(
      '<style>b{}</style>',
    );
    expect(htmlEmis(safeHtml`<p>${lignes}</p>`)).toBe('<p>a</p>');
  });

  it('refuse un tableau vide ou creux dans un href, qui laisserait un lien actif', () => {
    const aucune: EscapedHtml[] = [];
    const trous = new Array<EscapedHtml>(2);

    expect(() => safeHtml`<a href="${aucune}">x</a>`).toThrow(
      /Interpolation refusée/,
    );
    expect(() => safeHtml`<a href="${trous}">x</a>`).toThrow(
      /Interpolation refusée/,
    );
  });

  it('ignore les methodes propres d un tableau de feuilles de style', () => {
    const piege = pieger<FeuilleDeStyle>(
      [safeCss`b{}`],
      'body{background:url(https://evil.example)}',
    );

    expect(styleDe(safeCss`a{}${piege}`)).toBe('<style>a{}b{}</style>');
  });

  it('refuse un objet type comme une URL emise sans l avoir ete', () => {
    const contrefait = Object.assign(
      { toString: () => ARBITRAIRE },
      escapeUrl('#'),
    );

    expect(() => safeHtml`<p>${contrefait}</p>`).toThrow(
      /Interpolation refusée/,
    );
  });

  it('refuse une fonction typee comme une URL emise', () => {
    const contrefaite = Object.assign(
      Object.assign(() => 0, { toString: () => ARBITRAIRE }),
      escapeUrl('#'),
    );

    expect(() => safeHtml`<p>${contrefaite}</p>`).toThrow(
      /Interpolation refusée/,
    );
  });

  it.each([
    [
      'le texte',
      (forge: EscapedHtml) => safeHtml`<p>${forge}</p>`,
      '<p>&lt;img src=x onerror=alert(1)&gt;</p>',
    ],
    [
      'un attribut descriptif',
      (forge: EscapedHtml) => safeHtml`<img alt="${forge}">`,
      '<img alt="&lt;img src=x onerror=alert(1)&gt;">',
    ],
    [
      'un element de tableau',
      (forge: EscapedHtml) => safeHtml`<ul>${[escapeHtml('a'), forge]}</ul>`,
      '<ul>a&lt;img src=x onerror=alert(1)&gt;</ul>',
    ],
  ])(
    'echappe dans %s une chaine que le type fait passer pour un fragment emis',
    (_contexte, rendre, attendu) => {
      expect(htmlEmis(rendre(ARBITRAIRE as never))).toBe(attendu);
    },
  );

  it('echappe une valeur primitive qui n est ni un nombre ni un fragment emis', () => {
    expect(htmlEmis(safeHtml`<p>${Symbol(ARBITRAIRE) as never}</p>`)).toBe(
      '<p>Symbol(&lt;img src=x onerror=alert(1)&gt;)</p>',
    );
  });

  it('ne rend le texte que d un fragment emis par escapeHtml ou safeHtml', () => {
    expect(htmlEmis(safeHtml`<p>${escapeHtml('<')}</p>`)).toBe('<p>&lt;</p>');
    expect(() => htmlEmis(ARBITRAIRE as never)).toThrow(/Fragment HTML refusé/);
    expect(() => htmlEmis(escapeUrl('https://ok.example') as never)).toThrow(
      /Fragment HTML refusé/,
    );
    expect(() => htmlEmis({ toString: () => ARBITRAIRE } as never)).toThrow(
      /Fragment HTML refusé/,
    );
  });

  it('refuse un element de tableau qui n est pas un fragment', () => {
    const contrefait = Object.assign(
      { toString: () => ARBITRAIRE },
      escapeUrl('#'),
    );
    const lignes = [contrefait] as unknown as EscapedHtml[];

    expect(() => safeHtml`<ul>${lignes}</ul>`).toThrow(/Interpolation refusée/);
  });
});

describe('safeHtml — une URL admise ne charge ni script ni document', () => {
  const SCRIPT_DISTANT = 'https://evil.example/x.js';

  refuseChaqueInterpolation([
    [
      'le src d un script',
      () => safeHtml`<script src="${escapeUrl(SCRIPT_DISTANT)}"></script>`,
    ],
    [
      'le src d un script sans schema',
      () =>
        safeHtml`<script src="${escapeUrl('//evil.example/x.js')}"></script>`,
    ],
    [
      'le href d une base',
      () => safeHtml`<base href="${escapeUrl(SCRIPT_DISTANT)}">`,
    ],
    [
      'le src d une iframe',
      () => safeHtml`<iframe src="${escapeUrl(SCRIPT_DISTANT)}"></iframe>`,
    ],
    [
      'le src d un frame',
      () => safeHtml`<frame src="${escapeUrl(SCRIPT_DISTANT)}">`,
    ],
    [
      'le src d un embed',
      () => safeHtml`<embed src="${escapeUrl(SCRIPT_DISTANT)}">`,
    ],
    [
      'le href d un link',
      () =>
        safeHtml`<link rel="stylesheet" href="${escapeUrl(SCRIPT_DISTANT)}">`,
    ],
    [
      'le href d un script svg',
      () =>
        safeHtml`<svg><script href="${escapeUrl(SCRIPT_DISTANT)}"></script></svg>`,
    ],
  ]);

  rendChaqueCasAttendu('accepte toujours %s', [
    [
      'un lien',
      () => safeHtml`<a href="${escapeUrl('https://a.fr')}">x</a>`,
      '<a href="https://a.fr">x</a>',
    ],
    [
      'une image',
      () => safeHtml`<img src="${escapeUrl('https://a.fr/i.png')}" alt="" />`,
      '<img src="https://a.fr/i.png" alt="" />',
    ],
  ]);
});

describe('safeHtml — un fragment emis ne change plus de texte', () => {
  it('garde le texte d une URL dont on tente de remplacer toString', () => {
    const url = escapeUrl('https://a.fr');

    expect(() =>
      Object.assign(url, { toString: () => 'javascript:alert(1)' }),
    ).toThrow(TypeError);
    expect(lienEmis(url)).toBe(ancre('https://a.fr'));
  });

  it('garde le texte d une feuille de style dont on tente de remplacer toString', () => {
    const feuille = safeCss`a{}`;

    expect(() =>
      Object.assign(feuille, { toString: () => '</style><b>' }),
    ).toThrow(TypeError);
  });

  it('garde le texte d une URL dont on tente de modifier le prototype', () => {
    const url = escapeUrl('https://a.fr');
    const prototype = Object.getPrototypeOf(url) as { toString: () => string };

    expect(() => {
      prototype.toString = () => 'javascript:alert(1)';
    }).toThrow(TypeError);
    expect(lienEmis(url)).toBe(ancre('https://a.fr'));
  });

  it('ignore une conversion en primitive ajoutee a Object.prototype', () => {
    const url = escapeUrl('https://a.fr');
    const feuille = safeCss`a{}`;
    Object.defineProperty(Object.prototype, Symbol.toPrimitive, {
      value: () => 'javascript:alert(2)',
      configurable: true,
    });
    try {
      expect(lienEmis(url)).toBe(ancre('https://a.fr'));
      expect(styleDe(feuille)).toBe('<style>a{}</style>');
    } finally {
      Reflect.deleteProperty(Object.prototype, Symbol.toPrimitive);
    }
  });
});

describe('safeHtml — seul un gabarit litteral transporte du HTML brut', () => {
  const BRUT = '<img src=x onerror=alert(1)>';
  const fauxGabarit = (): TemplateStringsArray =>
    Object.assign([BRUT], { raw: [BRUT] });

  it('refuse un faux tableau de gabarit dans safeHtml', () => {
    expect(() => safeHtml(fauxGabarit())).toThrow(/Gabarit refusé/);
  });

  it('refuse un faux tableau de gabarit dans safeCss', () => {
    expect(() => safeCss(fauxGabarit())).toThrow(/Gabarit refusé/);
  });

  it('refuse un faux tableau de gabarit gele', () => {
    const faux: TemplateStringsArray = Object.freeze(
      Object.assign([BRUT], { raw: Object.freeze([BRUT]) }),
    );

    expect(() => safeHtml(faux)).toThrow(/Gabarit refusé/);
    expect(() => safeCss(faux)).toThrow(/Gabarit refusé/);
  });

  it('refuse un tableau gele sans raw', () => {
    const faux = Object.freeze([BRUT]) as unknown as TemplateStringsArray;

    expect(() => safeHtml(faux)).toThrow(/Gabarit refusé/);
  });
});

describe('safeHtml — un tableau interpole coute un temps lineaire', () => {
  const lignesDe = (nombre: number): EscapedHtml[] =>
    Array.from(
      { length: nombre },
      (_, rang) =>
        safeHtml`<tr><td>${rang}</td><td>${escapeHtml('cellule de démonstration')}</td></tr>`,
    );
  const dureeDAssembler = (
    lignes: readonly EscapedHtml[],
    fois: number,
  ): number => {
    const debut = performance.now();
    const tableaux = Array.from(
      { length: fois },
      () => safeHtml`<table>${lignes}</table>`,
    );
    expect(tableaux).toHaveLength(fois);
    return performance.now() - debut;
  };

  it('assemble seize fois plus de lignes dans le temps de seize petits tableaux, quelle que soit la charge du poste', () => {
    const courtes = lignesDe(125);
    const longues = lignesDe(2_000);
    dureeDAssembler(longues, 1);
    const rapports = [0, 1, 2]
      .map(
        () =>
          dureeDAssembler(longues, 1) /
          Math.max(dureeDAssembler(courtes, 16), 1),
      )
      .sort((a, b) => a - b);

    expect(rapports[1]).toBeLessThan(2);
    expect(htmlEmis(safeHtml`<table>${longues}</table>`)).toContain(
      '<tr><td>1999</td>',
    );
  });
});
