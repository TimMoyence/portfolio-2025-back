import { CompteurDesEnvoisTypeOrm } from '../../../src/common/infrastructure/mail/envois-du-jour/compteur-des-envois.typeorm';
import { EnvoisDuJourEntity } from '../../../src/common/infrastructure/mail/envois-du-jour/envois-du-jour.entity';
import { buildConfigService } from '../../factories/env.factory';
import {
  baseMigreeDeLaSuite,
  describeDb,
  TOUTES_LES_MIGRATIONS,
} from '../../helpers/base/db-integration-datasource';

const LE_12_A_23H30_A_PARIS = new Date('2026-11-12T22:30:00.000Z');
const LE_13_A_00H30_A_PARIS = new Date('2026-11-12T23:30:00.000Z');

describeDb('Compteur des envois du jour (Postgres)', () => {
  const base = baseMigreeDeLaSuite(
    [EnvoisDuJourEntity],
    [TOUTES_LES_MIGRATIONS],
  );
  const compteur = () =>
    new CompteurDesEnvoisTypeOrm(base(), buildConfigService());

  beforeEach(async () => {
    await base().query('TRUNCATE "envois_du_jour"');
  });

  it('NL-16 · compte chaque envoi sur la journee de Paris, minuit compris', async () => {
    await compteur().compter(LE_12_A_23H30_A_PARIS);
    await compteur().compter(LE_12_A_23H30_A_PARIS);
    await compteur().compter(LE_13_A_00H30_A_PARIS);

    expect(await compteur().envoyesLeJourDe(LE_12_A_23H30_A_PARIS)).toBe(2);
    expect(await compteur().envoyesLeJourDe(LE_13_A_00H30_A_PARIS)).toBe(1);
  });

  it('NL-16 · laisse a la diffusion le plafond moins la reserve et les mails deja partis, jamais moins de zero', async () => {
    const reglage = buildConfigService({
      NEWSLETTER_PLAFOND_DU_JOUR: 10,
      NEWSLETTER_RESERVE_DU_JOUR: 3,
    });
    const budget = () => new CompteurDesEnvoisTypeOrm(base(), reglage);
    await budget().compter(LE_12_A_23H30_A_PARIS);
    await budget().compter(LE_12_A_23H30_A_PARIS);
    const apresDeux = await budget().restantPourLaDiffusion(
      LE_12_A_23H30_A_PARIS,
    );
    for (let envoi = 0; envoi < 6; envoi += 1) {
      await budget().compter(LE_12_A_23H30_A_PARIS);
    }

    expect([
      apresDeux,
      await budget().restantPourLaDiffusion(LE_12_A_23H30_A_PARIS),
      await budget().restantPourLaDiffusion(LE_13_A_00H30_A_PARIS),
    ]).toEqual([5, 0, 7]);
  });

  it('NL-16 · vaut zero un jour sans envoi', async () => {
    expect(await compteur().envoyesLeJourDe(LE_13_A_00H30_A_PARIS)).toBe(0);
  });
});
