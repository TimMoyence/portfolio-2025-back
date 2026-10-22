import {
  poseeDepuisMoinsDe,
  poseeIlYAPlusDe,
  poseeIlYAPlusDeMois,
} from './horloge-de-la-base';

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

  it('compte une anciennete en mois civils sur la meme horloge', () => {
    const critere = poseeIlYAPlusDeMois(6);

    expect(critere.getSql?.('"created_at"')).toBe(
      `"created_at" < LOCALTIMESTAMP - make_interval(months => :ancienneteEnMois)`,
    );
    expect(critere.objectLiteralParameters).toEqual({ ancienneteEnMois: 6 });
  });
});
