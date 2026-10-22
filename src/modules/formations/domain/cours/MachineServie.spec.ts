import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import { COURS_B2_01 } from '../../../../../test/factories/contenus-publies';
import { ProductionInvalideError } from '../errors/FormationErrors';
import {
  evaluerLaMachine,
  machineCalculee,
  machineDuCours,
  type MachineACalculer,
  sortiesDeLaMachine,
} from './MachineServie';
import { tirer } from './Tirage';

const ECRAN_MACHINE = 'B2-01-A3-02-MACHINE-COEFFICIENTS';
const COURS = buildCoursDuContenu(COURS_B2_01);

function machineDuB201(): MachineACalculer {
  const machine = machineDuCours(COURS, ECRAN_MACHINE);
  if (machine === null) {
    throw new Error(`machine absente du B2-01 : ${ECRAN_MACHINE}`);
  }
  return machine;
}

describe('sortiesDeLaMachine', () => {
  it('calcule la machine du B2-01 à ses réglages par défaut : +10 % puis −10 % donnent 99, pas 100', () => {
    const sorties = sortiesDeLaMachine(machineDuB201(), {});

    expect(sorties.valeurs).toEqual({ depart: 100, tauxUn: 10, tauxDeux: -10 });
    expect(sorties.resultat.valeur).toBeCloseTo(99, 9);
    expect(sorties.resultat.affichage).toBe('99');
    expect(sorties.etapes.map(({ affichage }) => affichage)).toEqual([
      '100',
      '110',
      '99',
    ]);
    expect(sorties.phrase).toBe(machineDuB201().phrase);
  });

  it('pose un réglage et garde les autres à leur défaut', () => {
    const sorties = sortiesDeLaMachine(machineDuB201(), { tauxUn: 12 });

    expect(sorties.valeurs).toEqual({ depart: 100, tauxUn: 12, tauxDeux: -10 });
    expect(sorties.resultat.affichage).toBe('100,8');
  });

  it('L4-F11 · arrondit un demi comme Excel : 1 € à −50 % puis +13 % arrive à 0,57 €', () => {
    const sorties = sortiesDeLaMachine(machineDuB201(), {
      depart: 1,
      tauxUn: -50,
      tauxDeux: 13,
    });

    expect(sorties.resultat.affichage).toBe('0,57');
    expect(sorties.etapes.map(({ affichage }) => affichage)).toEqual([
      '1',
      '0,5',
      '0,57',
    ]);
  });

  it('dresse la table de chaque curseur sur six intervalles, réglage courant inséré et marqué', () => {
    const lignes = sortiesDeLaMachine(machineDuB201(), {}).lignes.tauxUn;

    expect(lignes.map(({ valeur }) => valeur.affichage)).toEqual([
      '-50',
      '-33,33',
      '-16,67',
      '0',
      '10',
      '16,67',
      '33,33',
      '50',
    ]);
    expect(lignes.filter(({ courante }) => courante)).toEqual([
      {
        valeur: { valeur: 10, affichage: '10' },
        resultat: expect.objectContaining({ affichage: '99' }),
        courante: true,
      },
    ]);
    expect(lignes[0].resultat.affichage).toBe('45');
    expect(lignes.at(-1)?.resultat.affichage).toBe('135');
  });

  it('trace la courbe de chaque curseur sur 25 points, les autres à leur réglage', () => {
    const courbe = sortiesDeLaMachine(machineDuB201(), {}).courbes.tauxDeux;

    expect(courbe).toHaveLength(25);
    expect(courbe[0].x).toBe(-50);
    expect(courbe[0].y).toBeCloseTo(55, 9);
    expect(courbe.at(-1)?.x).toBe(50);
    expect(courbe.at(-1)?.y).toBeCloseTo(165, 9);
  });

  it('écrit dans la phrase les réglages et le résultat nommés, et laisse une clé inconnue telle quelle', () => {
    const sorties = sortiesDeLaMachine(
      {
        ...machineDuB201(),
        phrase: 'De {depart} € on arrive à {resultat} € ; {inconnu} reste.',
      },
      { tauxUn: 50, tauxDeux: -50 },
    );

    expect(sorties.phrase).toBe('De 100 € on arrive à 75 € ; {inconnu} reste.');
  });
});

describe('machineCalculee', () => {
  it('sert le défaut, les préréglages et l animation cumulée du B2-01 : 100, puis 150, puis 75', () => {
    const { sorties } = machineCalculee(machineDuB201());

    expect(sorties.map(({ resultat }) => resultat.affichage)).toEqual([
      '99',
      '99',
      '96',
      '100',
      '150',
      '75',
    ]);
    expect(sorties.at(-1)?.valeurs).toEqual({
      depart: 100,
      tauxUn: 50,
      tauxDeux: -50,
    });
  });

  it('ne sert qu une fois une position atteinte deux fois', () => {
    const { sorties } = machineCalculee(machineDuB201());
    const positions = sorties.map(({ valeurs }) => JSON.stringify(valeurs));

    expect(new Set(positions).size).toBe(positions.length);
  });

  it('est servie au tirage du B2-01 dans la définition de la machine', () => {
    const ecran = tirer(COURS, 0).sujet.ecrans.find(
      ({ id }) => id === ECRAN_MACHINE,
    );

    expect(ecran?.donnees).toMatchObject({
      definition: { sorties: machineCalculee(machineDuB201()).sorties },
    });
  });
});

describe('evaluerLaMachine', () => {
  it('admet le défaut hors du pas, position servie, et refuse le maximum hors du pas : de 0 à 10 au pas de 4', () => {
    const machine: MachineACalculer = {
      parametres: [{ cle: 'k', min: 0, max: 10, pas: 4, defaut: 5 }],
      calcul: 'k',
      phrase: '',
    };

    expect(evaluerLaMachine(machine, 'E', { k: 5 }).valeurs).toEqual({ k: 5 });
    expect(evaluerLaMachine(machine, 'E', { k: 8 }).valeurs).toEqual({ k: 8 });
    expect(() => evaluerLaMachine(machine, 'E', { k: 10 })).toThrow(
      'k hors des positions servies',
    );
  });

  it('calcule les réglages de l élève, bornes incluses', () => {
    const sorties = evaluerLaMachine(machineDuB201(), ECRAN_MACHINE, {
      tauxDeux: -50,
    });

    expect(sorties.resultat.affichage).toBe('55');
  });

  it.each([
    [
      'un paramètre absent de la machine',
      { prix: 10 },
      'paramètre prix absent',
    ],
    [
      'un réglage sous la borne',
      { tauxUn: -51 },
      'tauxUn hors des positions servies',
    ],
    [
      'un réglage au-delà de la borne',
      { depart: 201 },
      'depart hors des positions servies',
    ],
    [
      'un réglage entre deux crans du pas',
      { tauxUn: 12.4 },
      'tauxUn hors des positions servies',
    ],
    [
      'une clé héritée d Object',
      { constructor: 1 },
      'paramètre constructor absent',
    ],
    [
      'une clé de prototype propre',
      JSON.parse('{"__proto__":1}') as Record<string, number>,
      'paramètre __proto__ absent',
    ],
  ])('refuse %s', (_cas, reglages, raison) => {
    const evaluer = () =>
      evaluerLaMachine(machineDuB201(), ECRAN_MACHINE, reglages);

    expect(evaluer).toThrow(ProductionInvalideError);
    expect(evaluer).toThrow(raison);
  });
});

describe('machineDuCours', () => {
  it.each([
    ['un tracé', 'B2-01-A2-02-ORIGINE-AXE'],
    ['un écran absent du cours', 'B2-01-INCONNU'],
  ])('ne rend aucune machine pour %s', (_cas, ecranId) => {
    expect(machineDuCours(COURS, ecranId)).toBeNull();
  });
});
