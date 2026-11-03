import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createMockDepotsFormations } from '../../factories/formations/formation.factory';
import { monterApplicationFormations } from '../../helpers/formations/seance/formations-harness';
import {
  ADRESSE_BOUCLE_LOCALE,
  fermerApplication,
  ouvrirApplication,
  serveurHttpDe,
} from '../../helpers/http/nest-test-app';

const MONTAGES: readonly [string, () => Promise<INestApplication>][] = [
  [
    'le harnais des formations',
    () => monterApplicationFormations(createMockDepotsFormations()),
  ],
  [
    'le montage commun',
    async () => ouvrirApplication(await Test.createTestingModule({}).compile()),
  ],
];

describe('Écoute des applications des suites HTTP (e2e http socket)', () => {
  it.each(MONTAGES)(
    '%s écoute une seule fois sur la boucle locale, avant la première requête',
    async (_montage, monter) => {
      const app = await monter();
      const ecoute = serveurHttpDe(app).address();
      await fermerApplication(app);

      expect(ecoute).toMatchObject({
        address: ADRESSE_BOUCLE_LOCALE,
        family: 'IPv4',
      });
    },
  );
});
