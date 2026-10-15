import { enArrierePlan, journaliserLEchec } from './en-arriere-plan';

function journal() {
  return { warn: jest.fn<void, [string]>() };
}

describe('journaliserLEchec', () => {
  it('journalise l echec avec sa cause en une seule chaîne', async () => {
    const espion = journal();

    await journaliserLEchec(
      Promise.reject(new Error('smtp down')),
      'Contact notification failed',
      espion,
    );

    expect(espion.warn).toHaveBeenCalledTimes(1);
    expect(espion.warn).toHaveBeenCalledWith(
      'Contact notification failed: smtp down',
    );
  });

  it('journalise une cause qui n est pas une erreur', async () => {
    const espion = journal();

    await journaliserLEchec(
      jest.fn<Promise<never>, []>().mockRejectedValue('refus')(),
      'Envoi echoue',
      espion,
    );

    expect(espion.warn).toHaveBeenCalledWith('Envoi echoue: refus');
  });

  it('ne journalise rien quand la tâche réussit et se résout sans valeur', async () => {
    const espion = journal();

    await expect(
      journaliserLEchec(Promise.resolve(42), 'Envoi echoue', espion),
    ).resolves.toBeUndefined();

    expect(espion.warn).not.toHaveBeenCalled();
  });
});

describe('enArrierePlan', () => {
  it('rend la main sans attendre la tâche et journalise son échec ensuite', async () => {
    const espion = journal();
    let rejeter!: (erreur: Error) => void;
    const tache = new Promise<void>((_resoudre, rej) => {
      rejeter = rej;
    });

    enArrierePlan(tache, 'Drip cancel failed', espion);
    expect(espion.warn).not.toHaveBeenCalled();

    rejeter(new Error('redis down'));
    await new Promise((resoudre) => setImmediate(resoudre));

    expect(espion.warn).toHaveBeenCalledWith('Drip cancel failed: redis down');
  });
});
