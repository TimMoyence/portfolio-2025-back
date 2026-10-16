import { Logger } from '@nestjs/common';
import { buildUser } from '../../../../../test/factories/user.factory';
import { flushPromises } from '../../../../../test/helpers/flush-promises';
import { TokenHash } from '../../domain/TokenHash';
import {
  emettreUnLienTemporaire,
  type CanalDeLienTemporaire,
} from './emission-de-lien-temporaire';

const QUATRE_VINGT_DIX_MINUTES_MS = 90 * 60 * 1000;

type Methode = 'remplacerLesLiensActifs' | 'envoyer';

type CanalSimule = Omit<CanalDeLienTemporaire, Methode> & {
  readonly [M in Methode]: jest.MockedFunction<CanalDeLienTemporaire[M]>;
};

function canalSimule(): CanalSimule {
  return {
    dureeDeValiditeMs: QUATRE_VINGT_DIX_MINUTES_MS,
    adresseDeBase: 'https://asilidesign.fr/lien',
    echecDEnvoi: 'Echec du lien',
    remplacerLesLiensActifs: jest.fn().mockResolvedValue(undefined),
    envoyer: jest.fn().mockResolvedValue(undefined),
  };
}

describe('emettreUnLienTemporaire', () => {
  const user = buildUser({ id: 'user-9', email: 'ada@example.com' });

  it('remplace les liens actifs du compte avant d envoyer le neuf', async () => {
    const canal = canalSimule();

    await emettreUnLienTemporaire(user, 'user-9', canal, new Logger('test'));

    expect(canal.remplacerLesLiensActifs).toHaveBeenCalledTimes(1);
    expect(canal.remplacerLesLiensActifs).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-9' }),
    );
    expect(
      canal.remplacerLesLiensActifs.mock.invocationCallOrder[0],
    ).toBeLessThan(canal.envoyer.mock.invocationCallOrder[0]);
  });

  it('enregistre l empreinte du jeton envoye et annonce la duree de validite enregistree', async () => {
    const canal = canalSimule();
    const avant = Date.now();

    await emettreUnLienTemporaire(user, 'user-9', canal, new Logger('test'));

    const [lien] = canal.envoyer.mock.calls[0];
    const jetonBrut = new URL(lien.url).searchParams.get('token') ?? '';
    const [enregistre] = canal.remplacerLesLiensActifs.mock.calls[0];
    expect(lien).toEqual({
      email: 'ada@example.com',
      firstName: user.firstName,
      lastName: user.lastName,
      url: `https://asilidesign.fr/lien?token=${jetonBrut}`,
      expiresInMinutes: 90,
    });
    expect(enregistre).toEqual({
      userId: 'user-9',
      tokenHash: TokenHash.fromRaw(jetonBrut).value,
      expiresAt: expect.any(Date),
    });
    expect(enregistre.expiresAt.getTime() - avant).toBeGreaterThanOrEqual(
      lien.expiresInMinutes * 60_000,
    );
  });

  it('rend la main sans attendre la fin de l envoi du courriel', async () => {
    const canal = canalSimule();
    canal.envoyer.mockReturnValue(new Promise<void>(() => undefined));
    let rendue = false;

    void emettreUnLienTemporaire(
      user,
      'user-9',
      canal,
      new Logger('test'),
    ).then(() => {
      rendue = true;
    });
    await flushPromises();

    expect(rendue).toBe(true);
    expect(canal.envoyer).toHaveBeenCalledTimes(1);
  });
});
