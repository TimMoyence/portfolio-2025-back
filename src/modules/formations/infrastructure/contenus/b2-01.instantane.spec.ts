import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildCoursB2_01 } from '../../../../../test/factories/cours-b2-01.factory';
import type { DerouleCours } from '../../domain/contrats/deroule';
import type { CoursPublic } from '../../domain/contrats/tirage';
import { deroulePresentateur } from '../../domain/cours/DeroulePresentateur';
import { projeterCatalogue } from '../../domain/cours/Diffusion';
import { empreinteCanonique } from '../../domain/cours/EmpreinteCanonique';
import { tirer } from '../../domain/cours/Tirage';

interface Instantane {
  readonly graine: number;
  readonly empreinte: string;
  readonly sujet: CoursPublic;
  readonly deroule: DerouleCours;
  readonly catalogue: CoursPublic;
}

const CHEMIN = join(
  __dirname,
  '../../../../../test/fixtures/formations/b2-01.instantane.json',
);
const GRAINE_DE_REFERENCE = 0;

function construire(): Instantane {
  const cours = buildCoursB2_01();
  const projection = {
    sujet: tirer(cours, GRAINE_DE_REFERENCE).sujet,
    deroule: deroulePresentateur(cours, GRAINE_DE_REFERENCE),
    catalogue: projeterCatalogue(cours),
  };
  return {
    graine: GRAINE_DE_REFERENCE,
    empreinte: empreinteCanonique(projection),
    ...projection,
  };
}

function lire(): Instantane {
  return JSON.parse(readFileSync(CHEMIN, 'utf8')) as Instantane;
}

describe('instantané du B2-01 livré au front', () => {
  const construit = construire();

  beforeAll(() => {
    if (process.env.ECRIRE_INSTANTANE === '1') {
      writeFileSync(CHEMIN, `${JSON.stringify(construit, null, 2)}\n`, 'utf8');
    }
  });

  it('reste identique au fichier livré, empreinte comprise', () => {
    const livre = lire();

    expect(livre.empreinte).toBe(construit.empreinte);
    expect(livre).toEqual(construit);
  });

  it('porte les 74 écrans du cours, écrans de correction et dossier du comité compris', () => {
    const livre = lire();

    expect(livre.sujet.ecrans).toHaveLength(74);
    expect(livre.deroule.ecrans).toHaveLength(74);
    expect(
      livre.catalogue.ecrans.filter(
        (ecran) => ecran.type === 'ecran-verrouille',
      ),
    ).toHaveLength(62);
  });

  it('R1 · R3 · sert à l écran 5 sa correction suivante et le cadrage de son renvoi', () => {
    const livre = lire();
    const tri = livre.sujet.ecrans.find(
      ({ id }) => id === 'B2-01-A1-05-ANATOMIE',
    );

    expect(tri?.resoluPar).toEqual(['B2-01-A1-05-CORRECTION']);
    expect(tri?.cadrageDuRenvoi).toEqual({
      part: 40,
      extrait: { lignes: [0, 1, 2, 3, 4, 5] },
    });
  });
});
