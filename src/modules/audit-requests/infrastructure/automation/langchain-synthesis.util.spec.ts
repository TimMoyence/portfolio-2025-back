import { buildLangchainAuditInput } from '../../../../../test/factories/audit-requests.factory';
import {
  buildExpertSynthesis,
  buildFallbackEmailDraft,
  buildFallbackNotes,
  normalizeClientEmailDraft,
  projectPerPageAnalysis,
  toEffort,
  toImpact,
} from './langchain-synthesis.util';

describe('langchain-synthesis.util', () => {
  describe('toImpact', () => {
    it('maps known values and defaults unknowns to medium', () => {
      expect(toImpact('high')).toBe('high');
      expect(toImpact('low')).toBe('low');
      expect(toImpact('medium')).toBe('medium');
      expect(toImpact('unknown')).toBe('medium');
      expect(toImpact(undefined)).toBe('medium');
      expect(toImpact(42)).toBe('medium');
    });
  });

  describe('toEffort', () => {
    it('buckets hours into high/medium/low with safe defaults', () => {
      expect(toEffort(10)).toBe('high');
      expect(toEffort(8)).toBe('high');
      expect(toEffort(5)).toBe('medium');
      expect(toEffort(3)).toBe('low');
      expect(toEffort(1)).toBe('low');
      expect(toEffort(Number.NaN)).toBe('medium');
      expect(toEffort('8')).toBe('medium');
      expect(toEffort(undefined)).toBe('medium');
    });
  });

  describe('normalizeClientEmailDraft', () => {
    it('returns null when the draft is missing, empty or malformed', () => {
      expect(normalizeClientEmailDraft(null)).toBeNull();
      expect(normalizeClientEmailDraft('string')).toBeNull();
      expect(normalizeClientEmailDraft({})).toBeNull();
      expect(
        normalizeClientEmailDraft({ subject: '   ', body: 'ok' }),
      ).toBeNull();
      expect(normalizeClientEmailDraft({ subject: 'ok', body: '' })).toBeNull();
    });

    it('trims and returns a clean subject/body pair when valid', () => {
      const draft = normalizeClientEmailDraft({
        subject: '  Audit findings  ',
        body: '  Hello there  ',
      });
      expect(draft).toEqual({
        subject: 'Audit findings',
        body: 'Hello there',
      });
    });
  });

  describe('buildFallbackEmailDraft', () => {
    it('produces a French fallback email by default', () => {
      const input = buildLangchainAuditInput({
        locale: 'fr',
        websiteName: 'acme.fr',
      });
      const draft = buildFallbackEmailDraft(input);
      expect(draft.subject).toContain('acme.fr');
      expect(draft.subject).toContain('priorites');
      expect(draft.body).toContain("L'audit de acme.fr est pret");
      expect(draft.body).toContain('Asili Design');
    });

    it('produces an English fallback email when locale is en', () => {
      const input = buildLangchainAuditInput({
        locale: 'en',
        websiteName: 'acme.com',
      });
      const draft = buildFallbackEmailDraft(input);
      expect(draft.subject).toBe('Audit findings for acme.com');
      expect(draft.body).toContain('The audit of acme.com is ready');
    });
  });

  describe('buildFallbackNotes', () => {
    it('localizes notes for fr and en', () => {
      const fr = buildFallbackNotes(
        buildLangchainAuditInput({ locale: 'fr', websiteName: 'acme.fr' }),
      );
      const en = buildFallbackNotes(
        buildLangchainAuditInput({ locale: 'en', websiteName: 'acme.com' }),
      );
      expect(fr).toContain('Notes internes');
      expect(fr).toContain('acme.fr');
      expect(en).toContain('Internal notes');
      expect(en).toContain('acme.com');
    });
  });

  describe('projectPerPageAnalysis', () => {
    it('returns empty array for null, non-array or empty input', () => {
      expect(projectPerPageAnalysis(null)).toEqual([]);
      expect(projectPerPageAnalysis(undefined)).toEqual([]);
      expect(projectPerPageAnalysis({})).toEqual([]);
      expect(projectPerPageAnalysis([])).toEqual([]);
    });

    it('filters entries without url or engineScores and truncates arrays to 6 items', () => {
      const engineScores = {
        google: {
          engine: 'google',
          score: 80,
          indexable: true,
          strengths: [],
          blockers: [],
          opportunities: [],
        },
        bingChatGpt: {
          engine: 'bing_chatgpt',
          score: 70,
          indexable: true,
          strengths: [],
          blockers: [],
          opportunities: [],
        },
        perplexity: {
          engine: 'perplexity',
          score: 60,
          indexable: true,
          strengths: [],
          blockers: [],
          opportunities: [],
        },
        geminiOverviews: {
          engine: 'gemini_overviews',
          score: 50,
          indexable: true,
          strengths: [],
          blockers: [],
          opportunities: [],
        },
      };

      const result = projectPerPageAnalysis([
        null,
        'string-entry',
        { url: '' },
        { url: 'https://a.com' }, // missing engineScores -> filtered
        {
          url: 'https://valid.com',
          title: 'Valid',
          engineScores,
          topIssues: ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7'],
          recommendations: ['r1', 'r2'],
          evidence: ['e1'],
        },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('https://valid.com');
      expect(result[0].title).toBe('Valid');
      expect(result[0].topIssues).toHaveLength(6);
      expect(result[0].recommendations).toEqual(['r1', 'r2']);
      expect(result[0].evidence).toEqual(['e1']);
    });
  });

  describe('buildExpertSynthesis', () => {
    it('builds a synthesis with fallback email/notes when adminReport is empty', () => {
      const input = buildLangchainAuditInput({
        locale: 'fr',
        websiteName: 'acme.fr',
      });
      const synthesis = buildExpertSynthesis('Summary text.', {}, input);

      expect(synthesis.executiveSummary).toBe('Summary text.');
      expect(synthesis.perPageAnalysis).toEqual([]);
      expect(synthesis.crossPageFindings).toHaveLength(
        input.deepFindings.length,
      );
      expect(synthesis.priorityBacklog).toEqual([]);
      expect(synthesis.clientEmailDraft.subject).toContain('acme.fr');
      expect(synthesis.internalNotes).toContain('acme.fr');
    });

    it('maps implementationBacklog entries via toImpact/toEffort', () => {
      const input = buildLangchainAuditInput({
        locale: 'en',
        websiteName: 'acme.com',
      });
      const adminReport: Record<string, unknown> = {
        executiveSummary: 'Exec summary.',
        implementationBacklog: [
          {
            task: 'Fix canonicals',
            priority: 'high',
            estimatedHours: 10,
            acceptanceCriteria: ['criteria-1'],
          },
          {
            task: '',
            priority: 'low',
            estimatedHours: 2,
          },
          {
            task: 'Improve CLS',
            priority: 'low',
            estimatedHours: 2,
          },
        ],
      };

      const synthesis = buildExpertSynthesis('ignored', adminReport, input);

      expect(synthesis.executiveSummary).toBe('Exec summary.');
      expect(synthesis.priorityBacklog).toHaveLength(2);
      expect(synthesis.priorityBacklog[0]).toMatchObject({
        title: 'Fix canonicals',
        impact: 'high',
        effort: 'high',
        acceptanceCriteria: ['criteria-1'],
      });
      expect(synthesis.priorityBacklog[1]).toMatchObject({
        title: 'Improve CLS',
        impact: 'low',
        effort: 'low',
      });
    });
  });
});
