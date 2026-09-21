import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'dotenv';
import { buildProductionSecrets } from '../../test/factories/env.factory';
import { validateEnv } from './env.validation';

const RACINE = join(__dirname, '../..');

function lireExemple(chemin: string): Record<string, string> {
  return parse(readFileSync(join(RACINE, chemin)));
}

describe('exemples de configuration', () => {
  it('.env.example passe tel quel la validation d environnement', () => {
    expect(() => validateEnv(lireExemple('.env.example'))).not.toThrow();
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
