import {
  buildClientCommsSystemBlocks,
  buildExecutionSystemBlocks,
  buildExecutiveSystemBlocks,
  buildExpertReportSystemBlocks,
  buildPrioritySystemBlocks,
  buildUserSummarySystemBlocks,
} from './section-prompts.builder';

/**
 * Les builders de prompts ne dependent que de `AuditLocale` et `retryMode` —
 * tests purement structurels pour garantir :
 *  - le disclaimer untrusted est toujours le premier bloc
 *  - le retry constraint est ajoute uniquement en retryMode
 *  - le nombre et l'ordre des blocs sont stables
 */

describe('section-prompts builders', () => {
  describe('executive', () => {
    it('retourne 2 blocs hors retry (disclaimer + main)', () => {
      expect(buildExecutiveSystemBlocks('fr', false)).toHaveLength(2);
    });
    it('retourne 3 blocs en retry (disclaimer + main + retry)', () => {
      expect(buildExecutiveSystemBlocks('fr', true)).toHaveLength(3);
    });
    it('differencie les prompts FR et EN', () => {
      const fr = buildExecutiveSystemBlocks('fr', false)[1];
      const en = buildExecutiveSystemBlocks('en', false)[1];
      expect(fr).not.toBe(en);
    });
  });

  describe('priority', () => {
    it('retourne 2 blocs hors retry', () => {
      expect(buildPrioritySystemBlocks('fr', false)).toHaveLength(2);
    });
    it('retourne 3 blocs en retry', () => {
      expect(buildPrioritySystemBlocks('fr', true)).toHaveLength(3);
    });
  });

  describe('execution', () => {
    it('retourne 2 blocs hors retry', () => {
      expect(buildExecutionSystemBlocks('fr', false)).toHaveLength(2);
    });
    it('retourne 3 blocs en retry', () => {
      expect(buildExecutionSystemBlocks('fr', true)).toHaveLength(3);
    });
  });

  describe('clientComms', () => {
    it('retourne 2 blocs hors retry', () => {
      expect(buildClientCommsSystemBlocks('fr', false)).toHaveLength(2);
    });
    it('retourne 3 blocs en retry', () => {
      expect(buildClientCommsSystemBlocks('fr', true)).toHaveLength(3);
    });
  });

  describe('userSummary', () => {
    it('retourne 2 blocs hors retry', () => {
      expect(buildUserSummarySystemBlocks('fr', false)).toHaveLength(2);
    });
    it('retourne 3 blocs en retry', () => {
      expect(buildUserSummarySystemBlocks('fr', true)).toHaveLength(3);
    });
  });

  describe('expertReport', () => {
    it('retourne 3 blocs en mode standard (disclaimer + main + strict)', () => {
      expect(buildExpertReportSystemBlocks('fr', false, false)).toHaveLength(3);
    });
    it('retourne 4 blocs en mode compact (ajoute compact constraint)', () => {
      expect(buildExpertReportSystemBlocks('fr', true, false)).toHaveLength(4);
    });
    it('retourne 4 blocs en mode retry (ajoute retry constraint)', () => {
      expect(buildExpertReportSystemBlocks('fr', false, true)).toHaveLength(4);
    });
    it('retourne 5 blocs quand compact ET retry sont actives', () => {
      expect(buildExpertReportSystemBlocks('fr', true, true)).toHaveLength(5);
    });
  });

  describe('invariants partages', () => {
    it('le 1er bloc est toujours le disclaimer untrusted data', () => {
      const disclaimerFr = buildExecutiveSystemBlocks('fr', false)[0];
      const disclaimerEn = buildExecutiveSystemBlocks('en', false)[0];
      expect(disclaimerFr.length).toBeGreaterThan(0);
      expect(disclaimerEn.length).toBeGreaterThan(0);
      expect(disclaimerFr).not.toBe(disclaimerEn);
    });

    it('tous les blocs sont des chaines non vides', () => {
      const blocks = [
        ...buildExecutiveSystemBlocks('fr', true),
        ...buildPrioritySystemBlocks('fr', true),
        ...buildExecutionSystemBlocks('fr', true),
        ...buildClientCommsSystemBlocks('fr', true),
        ...buildUserSummarySystemBlocks('fr', true),
        ...buildExpertReportSystemBlocks('fr', true, true),
      ];
      expect(blocks.every((b) => typeof b === 'string' && b.length > 0)).toBe(
        true,
      );
    });
  });
});
