import { corrigeSurPlace, pulsation, tempsDeLExercice } from './briques';

const SOCLE: Parameters<typeof pulsation>[0] = {
  screenId: 'B2-99-A1-09-JALON',
  titre: 'Jalon 1 : lire un tableau',
  concepts: ['contrat-de-lecture'],
};
const SONDAGE = { id: 'b2-99-a1-jalon', invite: 'Je sais lire un tableau.' };

describe('pulsation', () => {
  it('projette en séance un sondage anonyme d une minute', () => {
    const ecran = pulsation(SOCLE, SONDAGE);

    expect(ecran).toEqual({
      ...SOCLE,
      diffusion: 'seance',
      brique: 'fp-pulse',
      dureeMinutes: 1,
      notes: '• 30 s de vote anonyme.',
      proprietes: { sondage: SONDAGE },
    });
  });

  it('fait suivre la consigne du vote des notes propres au jalon', () => {
    const { notes } = pulsation(SOCLE, SONDAGE, 'Reprendre la fiche A1-06.');

    expect(notes).toBe('• 30 s de vote anonyme.\n• Reprendre la fiche A1-06.');
  });
});

describe('tempsDeLExercice', () => {
  it('annonce la réflexion puis le travail', () => {
    expect(tempsDeLExercice(2, 6)).toBe(
      'Temps : réflexion 2 min · travail 6 min',
    );
  });

  it('reste la ligne que la correction sur place prolonge de sa durée', () => {
    const corrige = corrigeSurPlace(
      pulsation(SOCLE, SONDAGE, tempsDeLExercice(1, 5)),
      { minutes: 3, notes: ['Corriger au tableau.'] },
      [['A1', 'Lire la ligne 1.']],
    );

    expect(corrige.notes).toContain(
      '• Temps : réflexion 1 min · travail 5 min · correction 3 min',
    );
  });
});
