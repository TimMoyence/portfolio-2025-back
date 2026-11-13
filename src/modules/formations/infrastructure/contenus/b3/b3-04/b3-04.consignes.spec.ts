import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import { COURS_B3_04 } from './b3-04.cours';
import { VALEURS_B3_04 } from './b3-04.donnees';

const ATELIER_LETTRE = 'B3-04-A1-11-ATELIER-LETTRE';
const ATELIER_FILTRE = 'B3-04-A2-04-ATELIER-FILTRE';

const consigneDe = (screenId: string): string => {
  const { proprietes } = fiche.ecranDuContenu(COURS_B3_04, screenId);
  return 'consigne' in proprietes ? String(proprietes.consigne) : '';
};

const nombresVisibles = (ecran: object): readonly string[] =>
  JSON.stringify(ecran, (cle, valeur: unknown) =>
    cle === 'notes' ? undefined : valeur,
  ).match(/\d+(?:[.,]\d+)?/g) ?? [];

describe('B3-04 — consignes et corrections', () => {
  it('B304-02 aucun écran avant l’exercice 4 ne donne ni ne laisse déduire ses deux réponses', () => {
    const lettres = VALEURS_B3_04['b3-04-a2-lettres-rennes'];
    const madame = VALEURS_B3_04['b3-04-a2-chere-madame'];
    const deductibles = [
      lettres,
      VALEURS_B3_04['b3-04-a1-contacts'] - lettres,
      madame,
      lettres - madame,
    ].map(String);
    const rang = fiche.rangDuContenu(COURS_B3_04, ATELIER_FILTRE);

    expect(
      COURS_B3_04.ecrans.slice(0, rang).flatMap((ecran) =>
        nombresVisibles(ecran)
          .filter((nombre) => deductibles.includes(nombre))
          .map((nombre) => `${ecran.screenId} : ${nombre}`),
      ),
    ).toEqual([]);
  });

  it('B304-01 la règle de l’exercice 4 remplace la formule d’appel de l’exercice 2 sans doubler sa virgule', () => {
    expect(consigneDe(ATELIER_LETTRE)).toContain('tapez « Madame, Monsieur, »');
    expect(consigneDe(ATELIER_FILTRE)).toContain(
      'sélectionnez « Madame, Monsieur » sans sa virgule',
    );
    expect(consigneDe(ATELIER_FILTRE)).not.toContain('virgule.');
  });

  it('B304-01 la formule d’appel suit l’usage de la lettre : « Chère Madame, », sans le nom', () => {
    expect(consigneDe(ATELIER_FILTRE)).not.toContain('champ nom');
    expect(consigneDe(ATELIER_FILTRE)).toContain(
      'la virgule suit la règle : la formule d’appel ne porte jamais le nom',
    );
  });

  it('B304-02 la correction de l’exercice 4 montre la lettre à 0,00 € et la règle de relance qui la corrigerait', () => {
    const corrections = JSON.stringify(
      fiche.ecranDuContenu(COURS_B3_04, ATELIER_FILTRE).proprietes,
    );

    expect(corrections).toContain('0,00 €');
    expect(corrections).toContain('Si…Alors…Sinon sur ca_2026, égal à 0');
  });
});
