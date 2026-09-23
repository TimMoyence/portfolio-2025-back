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

  it('porte les 55 écrans du cours, mission, corrections des deux tris et exercice des points compris', () => {
    const livre = lire();

    expect(livre.sujet.ecrans).toHaveLength(55);
    expect(livre.deroule.ecrans).toHaveLength(55);
    expect(
      livre.catalogue.ecrans.filter(
        (ecran) => ecran.type === 'ecran-verrouille',
      ),
    ).toHaveLength(43);
  });
});
