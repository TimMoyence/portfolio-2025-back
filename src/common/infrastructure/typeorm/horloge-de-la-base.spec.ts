import { poseeDepuisMoinsDe, poseeIlYAPlusDe } from './horloge-de-la-base';

describe('horloge de la base', () => {
  it.each([
    ['poseeDepuisMoinsDe', poseeDepuisMoinsDe, '>'],
    ['poseeIlYAPlusDe', poseeIlYAPlusDe, '<'],
  ])(
    '%s compare la colonne a l horloge de la base, jamais a celle du processus',
    (_nom, operateur, comparaison) => {
      const critere = operateur(90 * 60 * 1000);

      expect(critere.getSql?.('"created_at"')).toBe(
        `"created_at" ${comparaison} LOCALTIMESTAMP - make_interval(secs => :ancienneteEnSecondes)`,
      );
      expect(critere.objectLiteralParameters).toEqual({
        ancienneteEnSecondes: 5400,
      });
    },
  );
});
