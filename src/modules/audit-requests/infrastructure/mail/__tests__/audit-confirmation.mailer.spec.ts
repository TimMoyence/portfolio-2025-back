import {
  createMockTransporter,
  DEFAULT_AUDIT_ENV,
  premierMailEnvoye,
  setSmtpEnv,
} from '../../../../../../test/factories/mailer.factory';
import { ExpediteurDeCourriels } from '../../../../../common/infrastructure/mail/expediteur-smtp';
import { AuditConfirmationMailer } from '../audit-confirmation.mailer';

describe('AuditConfirmationMailer', () => {
  const lien =
    'https://asilidesign.fr/fr/growth-audit?token=4f7ab9f3f7b3d0eaa77a4b5b0dcaea31695f15de22f22e53f35b98b0aaf3112c';
  let cleanupEnv: () => void;
  let transporteur: ReturnType<typeof createMockTransporter>;

  afterEach(() => {
    cleanupEnv?.();
  });

  async function demander(locale: 'fr' | 'en') {
    transporteur = createMockTransporter();
    cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
    await new AuditConfirmationMailer(
      new ExpediteurDeCourriels(transporteur),
    ).demanderLaConfirmation({
      to: 'client@example.com',
      hote: 'www.mon-site.fr',
      lien,
      locale,
    });
    return premierMailEnvoye(transporteur);
  }

  it('envoie le lien de confirmation a l adresse saisie, et dit quoi faire si la demande n est pas d elle', async () => {
    const courriel = await demander('fr');

    expect(courriel.to).toBe('client@example.com');
    expect(courriel.subject).toBe("Confirmez l'audit de www.mon-site.fr");
    expect(courriel.text).toContain(lien);
    expect(courriel.html).toContain(lien.replaceAll('&', '&amp;'));
    expect(courriel.text).toContain('Ignorez ce message');
  });

  it('ecrit le courriel dans la langue de la demande', async () => {
    expect((await demander('en')).subject).toBe(
      'Confirm the audit of www.mon-site.fr',
    );
  });
});
