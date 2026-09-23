import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { empreinte } from '../../../test/helpers/portrait-tirages-b2';
import type { DerouleCours } from '../../modules/formations/domain/contrats/deroule';
import type { CoursPublic } from '../../modules/formations/domain/contrats/tirage';
import { lireCoursStocke } from '../../modules/formations/domain/cours/CoursStocke';
import { deroulePresentateur } from '../../modules/formations/domain/cours/DeroulePresentateur';
import { projeterCatalogue } from '../../modules/formations/domain/cours/Diffusion';
import { tirer } from '../../modules/formations/domain/cours/Tirage';
import { B2_COURS_ENRICHI } from './b2-enrichi.cours';

interface InstantaneV3 {
  readonly version: number;
  readonly graine: number;
  readonly empreinte: string;
  readonly sujet: CoursPublic;
  readonly deroule: DerouleCours;
  readonly catalogue: CoursPublic;
}

const CHEMIN = join(
  __dirname,
  '../../../test/fixtures/formations/b2-01-v3.instantane.json',
);
const GRAINE_DE_REFERENCE = 0;

function construire(): InstantaneV3 {
  const cours = lireCoursStocke(B2_COURS_ENRICHI);
  const projection = {
    sujet: tirer(cours, GRAINE_DE_REFERENCE).sujet,
    deroule: deroulePresentateur(cours, GRAINE_DE_REFERENCE),
    catalogue: projeterCatalogue(cours),
  };
  return {
    version: B2_COURS_ENRICHI.version,
    graine: GRAINE_DE_REFERENCE,
    empreinte: empreinte(projection),
    ...projection,
  };
}

function lire(): InstantaneV3 {
  return JSON.parse(readFileSync(CHEMIN, 'utf8')) as InstantaneV3;
}

describe('instantané V3 livré au front', () => {
  const construit = construire();

  beforeAll(() => {
    if (process.env.ECRIRE_INSTANTANE_V3 === '1') {
      writeFileSync(CHEMIN, `${JSON.stringify(construit, null, 2)}\n`, 'utf8');
    }
  });

  it('reste identique au fichier livré, empreinte comprise', () => {
    const livre = lire();

    expect(livre.empreinte).toBe(construit.empreinte);
    expect(livre).toEqual(construit);
  });

  it('P1 · porte les 54 écrans de la version 3 publiée, mission, correction du tri et exercice des points compris', () => {
    const livre = lire();

    expect(livre.version).toBe(3);
    expect(livre.sujet.ecrans).toHaveLength(54);
    expect(livre.deroule.ecrans).toHaveLength(54);
    expect(
      livre.catalogue.ecrans.filter(
        (ecran) => ecran.type === 'ecran-verrouille',
      ),
    ).toHaveLength(42);
  });
});
