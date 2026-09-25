import { traiterEnParallele } from './traitement-concurrent.util';

describe('traiterEnParallele', () => {
  it('rend les résultats dans l ordre des éléments et signale chaque fin avec le compte cumulé', async () => {
    const signalements: Array<[string, number, number]> = [];

    const resultats = await traiterEnParallele(
      [30, 10, 20],
      2,
      (delai) =>
        new Promise<string>((tenir) =>
          setTimeout(() => tenir(`r${delai}`), delai),
        ),
      (resultat, faits, total) => {
        signalements.push([resultat, faits, total]);
        return Promise.resolve();
      },
    );

    expect(resultats).toEqual(['r30', 'r10', 'r20']);
    expect(signalements).toEqual([
      ['r10', 1, 3],
      ['r30', 2, 3],
      ['r20', 3, 3],
    ]);
  });

  it('ne dépasse jamais la concurrence demandée et en ouvre au moins une', async () => {
    let enCours = 0;
    let pic = 0;
    const traiter = async (): Promise<void> => {
      enCours += 1;
      pic = Math.max(pic, enCours);
      await new Promise((tenir) => setTimeout(tenir, 5));
      enCours -= 1;
    };

    await traiterEnParallele([1, 2, 3, 4, 5], 2, traiter);
    expect(pic).toBe(2);

    pic = 0;
    await traiterEnParallele([1, 2], 0, traiter);
    expect(pic).toBe(1);
  });
});
