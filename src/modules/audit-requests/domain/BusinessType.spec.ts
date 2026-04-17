import {
  type BusinessType,
  businessTypePromptHint,
  detectBusinessType,
} from './BusinessType';

describe('BusinessType — detectBusinessType', () => {
  const cases: ReadonlyArray<{
    input: string;
    expected: BusinessType;
    scenario: string;
  }> = [
    { input: 'Shopify', expected: 'ecommerce', scenario: 'Shopify stack' },
    {
      input: 'WooCommerce on WordPress',
      expected: 'ecommerce',
      scenario: 'WooCommerce prioritaire sur WordPress',
    },
    {
      input: 'Magento 2',
      expected: 'ecommerce',
      scenario: 'Magento e-commerce',
    },
    {
      input: 'PrestaShop',
      expected: 'ecommerce',
      scenario: 'PrestaShop e-commerce',
    },
    {
      input: 'Next.js on Vercel',
      expected: 'saas',
      scenario: 'Next.js considere SaaS par defaut',
    },
    { input: 'Angular 19 + SSR', expected: 'saas', scenario: 'Angular' },
    { input: 'React + Vite', expected: 'saas', scenario: 'React' },
    { input: 'Webflow', expected: 'agency', scenario: 'Webflow no-code' },
    { input: 'Framer', expected: 'agency', scenario: 'Framer no-code' },
    {
      input: 'WordPress',
      expected: 'media',
      scenario: 'WordPress sans ecommerce → media',
    },
    { input: 'Ghost', expected: 'media', scenario: 'Ghost blogging' },
    { input: 'Hugo static site', expected: 'service', scenario: 'Hugo' },
    { input: 'Astro', expected: 'service', scenario: 'Astro' },
    { input: 'Not verifiable', expected: 'unknown', scenario: 'EN unknown' },
    { input: 'Non verifiable', expected: 'unknown', scenario: 'FR unknown' },
    { input: '', expected: 'unknown', scenario: 'Chaine vide' },
    {
      input: '   ',
      expected: 'unknown',
      scenario: 'Espaces uniquement',
    },
    {
      input: 'PHP runtime',
      expected: 'unknown',
      scenario: 'Stack generique sans hint metier',
    },
  ];

  for (const { input, expected, scenario } of cases) {
    it(`retourne '${expected}' pour '${input}' (${scenario})`, () => {
      expect(detectBusinessType(input)).toBe(expected);
    });
  }

  it('priorise ecommerce sur saas quand les deux hints sont presents', () => {
    expect(detectBusinessType('Next.js + Shopify storefront')).toBe(
      'ecommerce',
    );
  });

  it('est insensible a la casse', () => {
    expect(detectBusinessType('SHOPIFY')).toBe('ecommerce');
    expect(detectBusinessType('shopify')).toBe('ecommerce');
  });
});

describe('BusinessType — businessTypePromptHint', () => {
  it('retourne une directive FR specifique pour ecommerce', () => {
    const hint = businessTypePromptHint('ecommerce', 'fr');
    expect(hint).toContain('panier');
    expect(hint).toContain('Product');
  });

  it('retourne une directive EN specifique pour saas', () => {
    const hint = businessTypePromptHint('saas', 'en');
    expect(hint).toContain('pricing');
    expect(hint).toContain('signup');
  });

  it('tombe sur une directive neutre pour unknown', () => {
    const fr = businessTypePromptHint('unknown', 'fr');
    const en = businessTypePromptHint('unknown', 'en');
    expect(fr).toContain('non detecte');
    expect(en).toContain('not auto-detected');
  });

  it('couvre tous les BusinessType en FR et EN', () => {
    const types: BusinessType[] = [
      'ecommerce',
      'saas',
      'portfolio',
      'agency',
      'media',
      'service',
      'unknown',
    ];
    for (const t of types) {
      expect(businessTypePromptHint(t, 'fr').length).toBeGreaterThan(40);
      expect(businessTypePromptHint(t, 'en').length).toBeGreaterThan(40);
    }
  });
});
