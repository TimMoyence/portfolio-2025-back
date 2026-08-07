export type BusinessType =
  | 'ecommerce'
  | 'saas'
  | 'portfolio'
  | 'agency'
  | 'media'
  | 'service'
  | 'unknown';

const ECOMMERCE_HINTS = [
  'shopify',
  'woocommerce',
  'magento',
  'prestashop',
  'bigcommerce',
  'sylius',
  'opencart',
] as const;

const SAAS_HINTS = [
  'next.js',
  'nuxt',
  'remix',
  'svelte',
  'react',
  'vue',
  'angular',
] as const;

const AGENCY_HINTS = ['webflow', 'framer', 'wix'] as const;

const MEDIA_HINTS = [
  'wordpress',
  'ghost',
  'drupal',
  'joomla',
  'medium',
  'substack',
] as const;

const SERVICE_HINTS = [
  'jekyll',
  'hugo',
  'eleventy',
  'astro',
  'nuxt content',
] as const;

export function detectBusinessType(primaryStack: string): BusinessType {
  const normalized = primaryStack.trim().toLowerCase();
  if (!normalized || normalized.includes('not verifiable')) return 'unknown';
  if (normalized.includes('non verifiable')) return 'unknown';

  const containsAny = (hints: ReadonlyArray<string>): boolean =>
    hints.some((hint) => normalized.includes(hint));

  if (containsAny(ECOMMERCE_HINTS)) return 'ecommerce';
  if (containsAny(SAAS_HINTS)) return 'saas';
  if (containsAny(AGENCY_HINTS)) return 'agency';
  if (containsAny(MEDIA_HINTS)) return 'media';
  if (containsAny(SERVICE_HINTS)) return 'service';
  return 'unknown';
}

export function businessTypePromptHint(
  type: BusinessType,
  locale: 'fr' | 'en',
): string {
  const fr: Record<BusinessType, string> = {
    ecommerce:
      "Site e-commerce (catalogue + panier). Mets en avant : reduction du taux d'abandon panier, schema Product/Offer, Core Web Vitals sur les pages catalogue, checkout sans friction, reviews.",
    saas: 'Site SaaS (produit en ligne). Mets en avant : clarte du pricing, signup sans friction, signaux de trust (logos clients, certifications), temps jusqu\'au "aha moment", integrations visibles.',
    portfolio:
      "Site portfolio / freelance. Mets en avant : cas clients detaillees avec avant/apres et KPI, temoignages nommes, CTA de prise de contact unique, preuve d'expertise (certifications, stack).",
    agency:
      "Site d'agence. Mets en avant : offres packagees, tarifs indicatifs, cas clients par secteur, process de collaboration, portfolio d'etudes de cas avec ROI.",
    media:
      'Site media / blog / editorial. Mets en avant : E-E-A-T (author, date, sources), structured data Article, profondeur semantique, internal linking cluster, newsletter CTA.',
    service:
      "Site vitrine / service local. Mets en avant : SEO local (NAP, GMB, reviews), FAQ visible, zone d'intervention, horaires, telephone cliquable.",
    unknown:
      "Type d'activite non detecte automatiquement. Reste generique : concentre sur SEO fondations, conversion et visibilite IA.",
  };

  const en: Record<BusinessType, string> = {
    ecommerce:
      'E-commerce site (catalog + cart). Emphasize: cart abandonment reduction, Product/Offer schema, Core Web Vitals on catalog pages, frictionless checkout, reviews.',
    saas: 'SaaS site (online product). Emphasize: pricing clarity, frictionless signup, trust signals (customer logos, certifications), time-to-aha-moment, visible integrations.',
    portfolio:
      'Portfolio / freelance site. Emphasize: detailed case studies with before/after KPIs, named testimonials, single contact CTA, proof of expertise (certifications, stack).',
    agency:
      'Agency site. Emphasize: packaged offers, indicative pricing, case studies by sector, collaboration process, ROI-proven case studies.',
    media:
      'Media / blog / editorial site. Emphasize: E-E-A-T (author, date, sources), Article structured data, semantic depth, topical cluster internal linking, newsletter CTA.',
    service:
      'Showcase / local service site. Emphasize: local SEO (NAP, GMB, reviews), visible FAQ, service area, opening hours, click-to-call phone.',
    unknown:
      'Business type not auto-detected. Stay generic: focus on SEO fundamentals, conversion and AI visibility.',
  };

  return locale === 'fr' ? fr[type] : en[type];
}
