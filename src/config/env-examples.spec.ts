import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'dotenv';
import { buildProductionSecrets } from '../../test/factories/env.factory';
import { RACINE } from '../../test/helpers/racine';
import { ALIAS_POSTGRES } from '../database/connexion-postgres';
import { validateEnv, VARIABLES_DE_L_ENV } from './env.validation';

function lireExemple(chemin: string): Record<string, string> {
  return parse(readFileSync(join(RACINE, chemin)));
}

const GROUPES_D_ALIAS: readonly (readonly string[])[] =
  Object.values(ALIAS_POSTGRES);
const ALIAS = new Set(GROUPES_D_ALIAS.flat());

describe('exemples de configuration', () => {
  it('.env.example passe tel quel la validation d environnement', () => {
    expect(() => validateEnv(lireExemple('.env.example'))).not.toThrow();
  });

  it('.env.example declare chaque variable du schema, un nom par groupe d alias', () => {
    const declarees = new Set(Object.keys(lireExemple('.env.example')));
    const absentes = [
      ...VARIABLES_DE_L_ENV.filter(
        (nom) => !ALIAS.has(nom) && !declarees.has(nom),
      ),
      ...GROUPES_D_ALIAS.filter(
        (groupe) => !groupe.some((nom) => declarees.has(nom)),
      ).map((groupe) => groupe.join(' | ')),
    ];

    expect(absentes).toEqual([]);
  });

  it.each(['.env.example', 'deploy/backend.env.example'])(
    '%s ne declare aucune variable hors du schema',
    (chemin) => {
      const schema = new Set<string>(VARIABLES_DE_L_ENV);

      expect(
        Object.keys(lireExemple(chemin)).filter((nom) => !schema.has(nom)),
      ).toEqual([]);
    },
  );

  it('deploy/backend.env.example declare chaque variable du schema que deploy/compose.yaml interpole', () => {
    const compose = readFileSync(join(RACINE, 'deploy/compose.yaml'), 'utf8');
    const schema = new Set<string>(VARIABLES_DE_L_ENV);
    const declarees = new Set(
      Object.keys(lireExemple('deploy/backend.env.example')),
    );
    const interpolees = new Set(
      [...compose.matchAll(/\$\{?([A-Z][A-Z0-9_]*)/g)].map(([, nom]) => nom),
    );

    expect(interpolees.size).toBeGreaterThan(0);
    expect(
      [...interpolees].filter((nom) => schema.has(nom) && !declarees.has(nom)),
    ).toEqual([]);
  });

  describe('deploy/backend.env.example', () => {
    const gabarit = {
      ...lireExemple('deploy/backend.env.example'),
      NODE_ENV: 'production',
    };
    const secrets = buildProductionSecrets();

    it('declare chaque secret que la production exige', () => {
      expect(Object.keys(gabarit)).toEqual(
        expect.arrayContaining(Object.keys(secrets)),
      );
    });

    it('refuse de demarrer tant que ses secrets restent vides', () => {
      const demarrer = () => validateEnv(gabarit);

      for (const secret of Object.keys(secrets)) {
        expect(demarrer).toThrow(secret);
      }
    });

    it('passe la validation une fois ses secrets renseignes', () => {
      expect(() => validateEnv({ ...gabarit, ...secrets })).not.toThrow();
    });
  });
});
