import type { LangchainAuditInput } from './langchain-audit-report.service';
import {
  compactText,
  payloadBytes,
  buildPayload,
  buildSectionPayloads,
} from './llm-payload.builder';

/** Construit un input minimal valide pour les tests du payload builder. */
function buildMinimalInput(
  overrides?: Partial<LangchainAuditInput>,
): LangchainAuditInput {
  return {
    locale: 'fr',
    websiteName: 'Mon Site',
    normalizedUrl: 'https://monsite.fr',
    keyChecks: { robots: true, sitemap: true },
    quickWins: ['Ajouter meta description', 'Compresser les images'],
    pillarScores: { seo: 70, performance: 60, security: 80 },
    deepFindings: [
      {
        code: 'SEO-001',
        title: 'Titre manquant',
        description: 'Aucune balise title sur la page',
        severity: 'high',
        confidence: 0.9,
        impact: 'traffic',
        affectedUrls: ['https://monsite.fr/page1', 'https://monsite.fr/page2'],
        recommendation: 'Ajouter une balise title unique',
      },
    ],
    sampledUrls: [
      {
        url: 'https://monsite.fr',
        statusCode: 200,
        indexable: true,
        canonical: 'https://monsite.fr',
        error: null,
      },
    ],
    pageRecaps: [
      {
        url: 'https://monsite.fr',
        priority: 'high',
        wordingScore: 6,
        trustScore: 7,
        ctaScore: 5,
        seoCopyScore: 6,
        topIssues: ['Titre trop long', 'Meta description absente'],
        recommendations: ['Raccourcir le titre', 'Ajouter meta description'],
        source: 'llm',
      },
    ],
    pageSummary: { totalPages: 5, indexablePages: 4 },
    techFingerprint: {
      primaryStack: 'WordPress',
      confidence: 0.85,
      evidence: ['wp-content'],
      alternatives: [],
      unknowns: [],
    },
    ...overrides,
  };
}

describe('compactText', () => {
  it('retourne le texte inchange si inferieur a maxChars', () => {
    expect(compactText('hello world', 50)).toBe('hello world');
  });

  it('tronque et ajoute des points de suspension si le texte depasse maxChars', () => {
    const long = 'a'.repeat(100);
    const result = compactText(long, 20);
    expect(result).toHaveLength(20);
    expect(result.endsWith('...')).toBe(true);
  });

  it('nettoie les espaces multiples avant la troncature', () => {
    expect(compactText('hello   world   test', 50)).toBe('hello world test');
  });

  it('retourne une chaine vide pour une chaine vide', () => {
    expect(compactText('', 50)).toBe('');
  });

  it('retourne une chaine vide pour une chaine composee uniquement d espaces', () => {
    expect(compactText('   ', 50)).toBe('');
  });

  it('gere les sauts de ligne comme des espaces', () => {
    expect(compactText('hello\n\nworld', 50)).toBe('hello world');
  });
});

describe('payloadBytes', () => {
  it('retourne la taille en octets du payload JSON', () => {
    const payload = { key: 'value' };
    const expected = Buffer.byteLength(JSON.stringify(payload), 'utf8');
    expect(payloadBytes(payload)).toBe(expected);
  });

  it('gere correctement les caracteres multi-octets (UTF-8)', () => {
    const payload = { text: 'cafe\u0301' };
    const expected = Buffer.byteLength(JSON.stringify(payload), 'utf8');
    expect(payloadBytes(payload)).toBe(expected);
  });

  it('retourne un nombre positif pour un objet vide', () => {
    expect(payloadBytes({})).toBe(2); // '{}'
  });
});

describe('buildPayload', () => {
  it('retourne un objet avec les cles attendues pour le profil summary', () => {
    const input = buildMinimalInput();
    const result = buildPayload(input, 'summary');

    expect(result).toHaveProperty('locale', 'fr');
    expect(result).toHaveProperty('website');
    expect(result).toHaveProperty('normalizedUrl');
    expect(result).toHaveProperty('keyChecks');
    expect(result).toHaveProperty('quickWins');
    expect(result).toHaveProperty('pillarScores');
    expect(result).toHaveProperty('deepFindings');
    expect(result).toHaveProperty('sampledUrls');
    expect(result).toHaveProperty('pageRecaps');
    expect(result).toHaveProperty('pageSummary');
    expect(result).toHaveProperty('techFingerprint');
    expect(result).toHaveProperty('evidenceBuckets');
  });

  it('applique les caps summary sur les quickWins', () => {
    const manyQuickWins = Array.from({ length: 20 }, (_, i) => `QW-${i}`);
    const input = buildMinimalInput({ quickWins: manyQuickWins });
    const result = buildPayload(input, 'summary');

    expect(result.quickWins).toHaveLength(6);
  });

  it('applique les caps expert sur les quickWins', () => {
    const manyQuickWins = Array.from({ length: 20 }, (_, i) => `QW-${i}`);
    const input = buildMinimalInput({ quickWins: manyQuickWins });
    const result = buildPayload(input, 'expert');

    expect(result.quickWins).toHaveLength(10);
  });

  it('applique les caps expert_compact sur les quickWins', () => {
    const manyQuickWins = Array.from({ length: 20 }, (_, i) => `QW-${i}`);
    const input = buildMinimalInput({ quickWins: manyQuickWins });
    const result = buildPayload(input, 'expert_compact');

    expect(result.quickWins).toHaveLength(8);
  });

  it('sanitise le nom du site web', () => {
    const input = buildMinimalInput({
      websiteName: 'Mon\nSite\nMalicieux',
    });
    const result = buildPayload(input, 'summary');

    expect(result.website).not.toContain('\n');
  });
});

describe('buildSectionPayloads', () => {
  it('retourne les 4 sections attendues', () => {
    const input = buildMinimalInput();
    const result = buildSectionPayloads(input);

    expect(result).toHaveProperty('executiveSection');
    expect(result).toHaveProperty('prioritySection');
    expect(result).toHaveProperty('executionSection');
    expect(result).toHaveProperty('clientCommsSection');
  });

  it('chaque section contient locale et website', () => {
    const input = buildMinimalInput();
    const result = buildSectionPayloads(input);

    for (const section of Object.values(result)) {
      expect(section).toHaveProperty('locale', 'fr');
      expect(section).toHaveProperty('website', 'Mon Site');
    }
  });

  it('limite les findings a 10 maximum', () => {
    const manyFindings = Array.from({ length: 20 }, (_, i) => ({
      code: `SEO-${i}`,
      title: `Finding ${i}`,
      description: `Description ${i}`,
      severity: 'medium' as const,
      confidence: 0.8,
      impact: 'traffic' as const,
      affectedUrls: ['https://monsite.fr/a', 'https://monsite.fr/b'],
      recommendation: `Fix ${i}`,
    }));
    const input = buildMinimalInput({ deepFindings: manyFindings });
    const result = buildSectionPayloads(input);

    const findings = result.prioritySection.deepFindings as unknown[];
    expect(findings.length).toBeLessThanOrEqual(10);
  });

  it('inclut evidenceBuckets dans executiveSection', () => {
    const input = buildMinimalInput();
    const result = buildSectionPayloads(input);

    expect(result.executiveSection).toHaveProperty('evidenceBuckets');
  });
});
