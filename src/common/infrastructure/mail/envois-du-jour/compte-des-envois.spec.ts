import { createMockTransporter } from '../../../../../test/factories/mailer.factory';
import { safeHtml } from '../../../domain/texte/nettoyage/html-escape.util';
import { COMPTEUR_DES_ENVOIS, ExpediteurDeCourriels } from '../expediteur-smtp';

const COURRIEL = {
  to: 'jane@mail.com',
  subject: 'Sujet',
  html: safeHtml`<p>Corps</p>`,
};

describe('ExpediteurDeCourriels · compte des envois', () => {
  const compter = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    compter.mockClear();
    COMPTEUR_DES_ENVOIS.enregistrer({ compter });
  });

  afterEach(() => {
    COMPTEUR_DES_ENVOIS.enregistrer(null);
  });

  it('NL-16 · compte chaque mail accepte par le relais', async () => {
    await new ExpediteurDeCourriels(createMockTransporter()).envoyer(COURRIEL);

    expect(compter.mock.calls).toEqual([[expect.any(Date)]]);
  });

  it('NL-16 · ne compte pas un mail que le relais refuse', async () => {
    const transporteur = createMockTransporter();
    transporteur.sendMail.mockRejectedValueOnce(new Error('refus du relais'));

    await expect(
      new ExpediteurDeCourriels(transporteur).envoyer(COURRIEL),
    ).rejects.toThrow('refus du relais');
    expect(compter.mock.calls).toEqual([]);
  });

  it('NL-16 · laisse partir le mail quand le compte echoue', async () => {
    compter.mockRejectedValueOnce(new Error('base indisponible'));

    await expect(
      new ExpediteurDeCourriels(createMockTransporter()).envoyer(COURRIEL),
    ).resolves.toBeUndefined();
  });
});
