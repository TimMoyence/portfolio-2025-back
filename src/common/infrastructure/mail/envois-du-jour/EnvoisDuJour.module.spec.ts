import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { buildConfigService } from '../../../../../test/factories/env.factory';
import { createMockTransporter } from '../../../../../test/factories/mailer.factory';
import { BUDGET_DES_ENVOIS } from '../../../application/budget-des-envois';
import { safeHtml } from '../../../domain/texte/nettoyage/html-escape.util';
import { CompteurDesEnvoisTypeOrm } from './compteur-des-envois.typeorm';
import { EnvoisDuJourModule } from './EnvoisDuJour.module';
import { ExpediteurDeCourriels } from '../expediteur-smtp';

const COURRIEL = {
  to: 'jane@mail.com',
  subject: 'Sujet',
  html: safeHtml`<p>Corps</p>`,
};

describe('EnvoisDuJourModule', () => {
  it('NL-16 · branche au demarrage le compte de chaque mail et fournit le budget de la diffusion', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const moduleRef = await Test.createTestingModule({
      imports: [EnvoisDuJourModule],
    })
      .useMocker((jeton) => {
        if (jeton === DataSource) return { query };
        if (jeton === ConfigService) return buildConfigService();
        return undefined;
      })
      .compile();
    await moduleRef.init();

    await new ExpediteurDeCourriels(createMockTransporter()).envoyer(COURRIEL);
    await moduleRef.close();
    await new ExpediteurDeCourriels(createMockTransporter()).envoyer(COURRIEL);
    await Promise.resolve();

    expect(moduleRef.get(BUDGET_DES_ENVOIS)).toBeInstanceOf(
      CompteurDesEnvoisTypeOrm,
    );
    expect(query.mock.calls).toHaveLength(1);
  });
});
