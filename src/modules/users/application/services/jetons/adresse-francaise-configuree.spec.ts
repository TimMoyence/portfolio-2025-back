import { Logger } from '@nestjs/common';
import { buildUser } from '../../../../../../test/factories/comptes/user.factory';
import {
  emettreUnLienTemporaire,
  type CanalDeLienTemporaire,
} from './emission-de-lien-temporaire';

describe('emettreUnLienTemporaire · adresse francaise configuree', () => {
  it('CPT-02 · garde a un compte francais l adresse de base deja prefixee en francais', async () => {
    const envoyer = jest.fn().mockResolvedValue(undefined);
    const canal: CanalDeLienTemporaire = {
      dureeDeValiditeMs: 90 * 60_000,
      adresseDeBase: 'https://asilidesign.fr/fr/reset-password',
      echecDEnvoi: 'Echec du lien',
      remplacerLesLiensActifs: jest.fn().mockResolvedValue({ id: 'lien-1' }),
      envoyer,
    };

    await emettreUnLienTemporaire(
      buildUser({ id: 'user-9', locale: 'fr' }),
      'user-9',
      canal,
      new Logger('test'),
    );

    const [[lien]] = envoyer.mock.calls as [[{ url: string }]];
    expect(lien.url.split('?')[0]).toBe(
      'https://asilidesign.fr/fr/reset-password',
    );
  });
});
