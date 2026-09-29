import { lireLInstantane } from '../../../../../test/helpers/instantane-de-cours';
import { COURS_B2_01 } from './b2-01.cours';

describe('instantané du B2-01 livré au front', () => {
  it('porte les 59 écrans du cours, corrections sur place et dossier du comité compris', () => {
    const livre = lireLInstantane(COURS_B2_01);

    expect(livre.sujet.ecrans).toHaveLength(59);
    expect(livre.deroule.ecrans).toHaveLength(59);
    expect(
      livre.catalogue.ecrans.filter(
        (ecran) => ecran.type === 'ecran-verrouille',
      ),
    ).toHaveLength(47);
    expect(
      livre.deroule.ecrans.filter(
        (ecran) => (ecran.explications?.length ?? 0) > 0,
      ),
    ).toHaveLength(11);
  });

  it('R1 · R3 · sert à l écran 5 sa correction suivante et le cadrage de son renvoi', () => {
    const livre = lireLInstantane(COURS_B2_01);
    const tri = livre.sujet.ecrans.find(
      ({ id }) => id === 'B2-01-A1-05-ANATOMIE',
    );

    expect(tri?.resoluPar).toEqual(['B2-01-A1-05-CORRECTION']);
    expect(tri?.cadrageDuRenvoi).toEqual({
      extrait: { lignes: [0, 1, 2, 3, 4, 5] },
    });
  });
});
