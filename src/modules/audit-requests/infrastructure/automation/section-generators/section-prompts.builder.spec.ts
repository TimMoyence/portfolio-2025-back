import {
  clientCommsRetryConstraint,
  clientCommsSystemMain,
  executiveRetryConstraint,
  executiveSystemMain,
  executionRetryConstraint,
  executionSystemMain,
  priorityRetryConstraint,
  prioritySystemMain,
  userSummaryRetryConstraint,
  userSummarySystemMain,
} from '../prompts/v1/audit-system-prompts';
import {
  UNTRUSTED_DATA_DISCLAIMER_EN,
  UNTRUSTED_DATA_DISCLAIMER_FR,
} from '../shared/prompt-sanitize.util';
import {
  buildExpertReportSystemBlocks,
  buildSystemBlocks,
} from './section-prompts.builder';

describe('buildSystemBlocks', () => {
  it.each([
    ['executive', executiveSystemMain, executiveRetryConstraint],
    ['priority', prioritySystemMain, priorityRetryConstraint],
    ['execution', executionSystemMain, executionRetryConstraint],
    ['client_comms', clientCommsSystemMain, clientCommsRetryConstraint],
    ['user_summary', userSummarySystemMain, userSummaryRetryConstraint],
  ] as const)(
    'compose %s : avertissement, prompt principal, puis contrainte de reprise en retry',
    (section, principal, reprise) => {
      expect(buildSystemBlocks(section, 'fr', false)).toEqual([
        UNTRUSTED_DATA_DISCLAIMER_FR,
        principal('fr'),
      ]);
      expect(buildSystemBlocks(section, 'en', true)).toEqual([
        UNTRUSTED_DATA_DISCLAIMER_EN,
        principal('en'),
        reprise('en'),
      ]);
    },
  );
});

describe('buildExpertReportSystemBlocks', () => {
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
  it('ouvre sur l avertissement de la langue demandee', () => {
    expect(buildExpertReportSystemBlocks('en', false, false)[0]).toBe(
      UNTRUSTED_DATA_DISCLAIMER_EN,
    );
  });
});
