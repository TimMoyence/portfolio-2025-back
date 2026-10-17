import { Logger } from '@nestjs/common';
import { buildUser } from '../../../../../test/factories/user.factory';
import { flushPromises } from '../../../../../test/helpers/flush-promises';
import { TROIS_ENVOIS_PAR_HEURE } from '../../domain/PlafondDEnvois';
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
    remplacerLesLiensActifs: jest.fn().mockResolvedValue({ id: 'lien-1' }),
    envoyer: jest.fn().mockResolvedValue(undefined),
  };
}

describe('emettreUnLienTemporaire', () => {
  const user = buildUser({ id: 'user-9', email: 'ada@example.com' });

  const emettre = (canal: CanalSimule) =>
    emettreUnLienTemporaire(user, 'user-9', canal, new Logger('test'));

  it('remplace les liens actifs du compte avant d envoyer le neuf', async () => {
    const canal = canalSimule();

    await emettre(canal);

    expect(canal.remplacerLesLiensActifs).toHaveBeenCalledTimes(1);
    expect(canal.remplacerLesLiensActifs).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-9' }),
      TROIS_ENVOIS_PAR_HEURE,
    );
    expect(
      canal.remplacerLesLiensActifs.mock.invocationCallOrder[0],
    ).toBeLessThan(canal.envoyer.mock.invocationCallOrder[0]);
  });

  it('plafonne les liens a trois par heure et par compte', () => {
    expect(TROIS_ENVOIS_PAR_HEURE).toEqual({
      maximum: 3,
      fenetreMs: 60 * 60 * 1000,
    });
  });

  it('n envoie rien quand le plafond du compte est atteint', async () => {
    const canal = canalSimule();
    canal.remplacerLesLiensActifs.mockResolvedValue(null);

    await emettre(canal);

    expect(canal.remplacerLesLiensActifs).toHaveBeenCalledTimes(1);
    expect(canal.envoyer).not.toHaveBeenCalled();
  });

  it('enregistre l empreinte du jeton envoye et annonce la duree de validite enregistree', async () => {
    const canal = canalSimule();
    const avant = Date.now();

    await emettre(canal);

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

    void emettre(canal).then(() => {
      rendue = true;
    });
    await flushPromises();

    expect(rendue).toBe(true);
    expect(canal.envoyer).toHaveBeenCalledTimes(1);
  });
});
