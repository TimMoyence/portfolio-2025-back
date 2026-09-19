import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CodeErreur, Feuille, ResultatFormule } from './Formule';
import type { FichierVecteursFormule, VecteurFormule } from './VecteursFormule';
import { empreinteDesVecteurs, serialiserCanonique } from './VecteursFormule';

const EMPREINTE_PARTAGEE_AVEC_LE_FRONT =
  'd95119feb3e14213f2c0675a4977b1e18cc15a4333540214ba7f79fa4f8fed66';

const TYPES_DE_VECTEUR: readonly VecteurFormule['type'][] = [
  'feuille',
  'expression',
  'r1c1',
];

function lireFichier(): FichierVecteursFormule {
  const brut: unknown = JSON.parse(
    readFileSync(join(__dirname, 'formule.vecteurs.json'), 'utf8'),
  );
  return brut as FichierVecteursFormule;
}

describe('serialiserCanonique', () => {
  it('trie les clés de chaque objet, à toute profondeur', () => {
    expect(serialiserCanonique({ b: 1, a: { d: [2, 1], c: null } })).toBe(
      '{"a":{"c":null,"d":[2,1]},"b":1}',
    );
  });

  it('ordonne les clés par unités de code, indépendamment de la locale', () => {
    expect(serialiserCanonique({ a: 1, B: 2, É: 3 })).toBe(
      '{"B":2,"a":1,"É":3}',
    );
  });

  it('garde l’ordre des tableaux et n’ajoute aucun blanc', () => {
    expect(serialiserCanonique([{ z: 'é', y: -3 }, 'x', true])).toBe(
      '[{"y":-3,"z":"é"},"x",true]',
    );
  });

  it('donne la même chaîne quel que soit l’ordre d’écriture des clés', () => {
    const vecteur = {
      id: 'ordre',
      type: 'expression',
      entree: { expression: '2^3^2', variables: {} },
      attendu: { valeur: 64, erreur: null },
    };
    const inverse = {
      attendu: { erreur: null, valeur: 64 },
      entree: { variables: {}, expression: '2^3^2' },
      type: 'expression',
      id: 'ordre',
    };

    expect(serialiserCanonique(inverse)).toBe(serialiserCanonique(vecteur));
  });

  it('refuse une valeur que JSON ne représente pas', () => {
    expect(() => serialiserCanonique({ a: undefined })).toThrow(
      'Valeur non sérialisable dans un vecteur de formule',
    );
    expect(() => serialiserCanonique(Number.NaN)).toThrow(
      'Valeur non sérialisable dans un vecteur de formule',
    );
  });
});

describe('empreinteDesVecteurs', () => {
  it('est le SHA-256 hexadécimal de la sérialisation canonique', () => {
    expect(empreinteDesVecteurs([])).toBe(
      '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    );
  });
});

describe('formule.vecteurs.json', () => {
  const fichier = lireFichier();

  it('porte l’empreinte de ses propres vecteurs', () => {
    expect(fichier.sha256).toBe(empreinteDesVecteurs(fichier.vecteurs));
  });

  it('porte l’empreinte attendue par la copie du front', () => {
    expect(fichier.sha256).toBe(EMPREINTE_PARTAGEE_AVEC_LE_FRONT);
  });

  it('n’a que des vecteurs typés et d’identifiants uniques', () => {
    const identifiants = fichier.vecteurs.map((vecteur) => vecteur.id);

    expect(fichier.version).toBe(1);
    expect(new Set(identifiants).size).toBe(identifiants.length);
    expect(
      fichier.vecteurs.every((vecteur) =>
        TYPES_DE_VECTEUR.includes(vecteur.type),
      ),
    ).toBe(true);
  });

  it('couvre les trois familles de vecteurs avec les exemples du document', () => {
    const feuille: Feuille = {
      lignes: 1,
      colonnes: 2,
      cellules: { A1: '=B1', B1: '=A1' },
    };
    const cycle: ResultatFormule = { valeur: null, erreur: '#REF!' };
    const erreurs: CodeErreur[] = ['#REF!', '#DIV/0!', '#NOM?', '#VALEUR!'];
    const attendus = [
      {
        id: 'feuille-cycle-deux-maillons',
        type: 'feuille',
        entree: feuille,
        attendu: { A1: cycle, B1: cycle },
      },
      {
        id: 'expression-puissance-associative-a-gauche',
        type: 'expression',
        entree: { expression: '2^3^2', variables: {} },
        attendu: { valeur: 64, erreur: null },
      },
      {
        id: 'r1c1-part-figee-e2',
        type: 'r1c1',
        entree: { formule: '=C2/$C$5', cellule: 'E2' },
        attendu: '=RC[-2]/R5C3',
      },
    ] satisfies VecteurFormule[];

    for (const attendu of attendus) {
      expect(fichier.vecteurs).toContainEqual(attendu);
    }
    expect(erreurs).toContain(cycle.erreur);
  });
});
