import { buildContact } from '../../../../test/factories/contacts.factory';
import {
  attendreScriptEchappe,
  DEFAULT_AUDIT_ENV,
  envoiSmtpSimule,
  mailSimule,
  moduleSmtpSimule,
  setSmtpEnv,
} from '../../../../test/factories/mailer.factory';
import { appliquer } from '../../../../test/helpers/environnement';

jest.mock('../../../common/infrastructure/mail/smtp-transporter.util', () =>
  moduleSmtpSimule(),
);

import { ContactMailerService } from './ContactMailer.service';

describe('ContactMailerService', () => {
  let restaurerEnv: () => void;

  beforeEach(() => {
    envoiSmtpSimule.mockClear();
    restaurerEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
  });

  afterEach(() => restaurerEnv());

  it('notifie le destinataire des notifications', async () => {
    await new ContactMailerService().sendContactNotification(buildContact());

    expect(mailSimule().to).toBe(DEFAULT_AUDIT_ENV.CONTACT_NOTIFICATION_TO);
  });

  it('n envoie rien sans destinataire des notifications', async () => {
    appliquer({ CONTACT_NOTIFICATION_TO: undefined });

    await new ContactMailerService().sendContactNotification(buildContact());

    expect(envoiSmtpSimule).not.toHaveBeenCalled();
  });

  it('echappe chaque champ saisi dans le HTML de la notification', async () => {
    await new ContactMailerService().sendContactNotification(
      buildContact({
        message: '<script>alert("xss")</script>',
        subject: "Tom & Jerry's <adventure>",
      }),
    );

    const { html } = mailSimule();
    attendreScriptEchappe(html);
    expect(html).toContain('Tom &amp; Jerry&#39;s &lt;adventure&gt;');
  });

  it('lie l email du contact par un mailto passe par escapeUrl', async () => {
    await new ContactMailerService().sendContactNotification(
      buildContact({ email: 'jean@example.com' }),
    );

    expect(mailSimule().html).toContain(
      '<a href="mailto:jean@example.com">jean@example.com</a>',
    );
  });
});
