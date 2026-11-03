import { z } from 'zod';
import { doublonsDe, signalerDoublons, signaleurDe } from './SchemasCommuns';

function issuesDe(
  controler: (contexte: z.RefinementCtx) => void,
): readonly z.core.$ZodIssue[] {
  const resultat = z.unknown().superRefine((_, contexte) => {
    controler(contexte);
  });
  const lecture = resultat.safeParse(null);
  return lecture.success ? [] : lecture.error.issues;
}

describe('doublonsDe', () => {
  it('rend chaque valeur repetee une seule fois, dans l ordre de sa repetition', () => {
    expect(doublonsDe(['a', 'b', 'a', 'c', 'b', 'a'])).toEqual(['a', 'b']);
  });

  it('rend une liste vide quand toutes les valeurs sont distinctes', () => {
    expect(doublonsDe(['a', 'b', 'c'])).toEqual([]);
  });
});

describe('signaleurDe', () => {
  it('prefixe le chemin de chaque signalement', () => {
    const issues = issuesDe((contexte) => {
      signaleurDe(contexte, ['ecrans', 2])(['titre'], 'titre manquant');
    });

    expect(issues).toEqual([
      expect.objectContaining({
        code: 'custom',
        path: ['ecrans', 2, 'titre'],
        message: 'titre manquant',
      }),
    ]);
  });
});

describe('signalerDoublons', () => {
  it('signale une fois, au chemin donne, toutes les valeurs en double', () => {
    const issues = issuesDe((contexte) => {
      signalerDoublons(
        ['a', 'b', 'a', 'b', 'a'],
        ['options'],
        signaleurDe(contexte),
      );
    });

    expect(issues).toEqual([
      expect.objectContaining({
        path: ['options'],
        message: 'en double : « a », « b »',
      }),
    ]);
  });

  it('ne signale rien quand les valeurs sont distinctes', () => {
    const issues = issuesDe((contexte) => {
      signalerDoublons(['a', 'b'], ['options'], signaleurDe(contexte));
    });

    expect(issues).toEqual([]);
  });
});
