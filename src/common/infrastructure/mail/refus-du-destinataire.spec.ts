import { createMockTransporter } from '../../../../test/factories/mailer.factory';
import { RefusDuDestinataire } from '../../domain/errors/RefusDuDestinataire';
import { safeHtml } from '../../domain/texte/nettoyage/html-escape.util';
import { ExpediteurDeCourriels } from './expediteur-smtp';

const COURRIEL = {
  to: 'jane@mail.com',
  subject: 'Sujet',
  html: safeHtml`<p>Corps</p>`,
};

function erreurSmtp(responseCode: number, command: string): Error {
  return Object.assign(new Error(`${responseCode} refus`), {
    responseCode,
    command,
  });
}

describe('ExpediteurDeCourriels · refus du destinataire', () => {
  it('NL-20 · signale le refus definitif d une adresse par le relais', async () => {
    const transporteur = createMockTransporter();
    transporteur.sendMail.mockRejectedValueOnce(erreurSmtp(550, 'RCPT TO'));

    await expect(
      new ExpediteurDeCourriels(transporteur).envoyer(COURRIEL),
    ).rejects.toBeInstanceOf(RefusDuDestinataire);
  });

  it.each([
    ['une panne passagere', 421, 'RCPT TO'],
    ['un identifiant refuse', 535, 'AUTH PLAIN'],
  ])(
    'NL-20 · laisse %s remonter telle quelle, pour etre retentee',
    async (_cas, code, commande) => {
      const transporteur = createMockTransporter();
      transporteur.sendMail.mockRejectedValueOnce(erreurSmtp(code, commande));

      const echec = new ExpediteurDeCourriels(transporteur).envoyer(COURRIEL);

      await expect(echec).rejects.not.toBeInstanceOf(RefusDuDestinataire);
      await expect(echec).rejects.toThrow(`${code} refus`);
    },
  );
});
